import { useRef, useCallback } from 'react'
import { GoogleGenAI } from '@google/genai'
import { useAssistantStore } from '@/store/assistant'
import { encodeBase64, decodeBase64, pcmToAudioBuffer } from '@/lib/audio'

const INPUT_RATE = 16000
const OUTPUT_RATE = 24000
const CONNECT_TIMEOUT = 12000
const MAX_RECONNECTS = 5
// Mic level (0..1) above which we treat input as a real barge-in during playback
const BARGE_LEVEL = 0.15

export function useGeminiLive({ onToolCall }) {
  const params = useRef(null) // { brandSlug, modelSlug } — for re-fetching tokens
  const prefetched = useRef(null) // { token, model, baseConfig, at } minted ahead of time
  const session = useRef(null)
  const inCtx = useRef(null)
  const outCtx = useRef(null)
  const worklet = useRef(null)
  const stream = useRef(null)
  const analyser = useRef(null)
  const raf = useRef(null)
  const connectTimer = useRef(null)
  const nextStart = useRef(0)
  const sources = useRef([])
  const active = useRef(false)

  const resumeHandle = useRef(null)
  const userClosed = useRef(false)
  const reconnects = useRef(0)
  const gen = useRef(0)
  const newTurn = useRef(false)

  const {
    setStatus, setStreamingText, appendStreamingText,
    setLastResponse, clearAll, appendHistory, setError, setInputLevel,
  } = useAssistantStore.getState()

  const stopPlayback = useCallback(() => {
    sources.current.forEach((s) => { try { s.stop() } catch (_) {} })
    sources.current = []
    nextStart.current = 0
  }, [])

  const teardownMic = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = null
    analyser.current = null
    setInputLevel(0)
    worklet.current?.disconnect()
    worklet.current = null
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    inCtx.current?.close().catch(() => {})
    inCtx.current = null
  }, [setInputLevel])

  const teardownSession = useCallback(() => {
    const s = session.current
    session.current = null
    s?.then((x) => { try { x.close() } catch (_) {} }).catch(() => {})
  }, [])

  const disconnect = useCallback(() => {
    userClosed.current = true
    active.current = false
    gen.current += 1
    if (connectTimer.current) { clearTimeout(connectTimer.current); connectTimer.current = null }
    teardownSession()
    teardownMic()
    stopPlayback()
    outCtx.current?.close().catch(() => {})
    outCtx.current = null
    resumeHandle.current = null
    reconnects.current = 0
    setStatus('idle')
    setStreamingText('')
  }, [teardownSession, teardownMic, stopPlayback, setStatus, setStreamingText])

  const handleMessage = useCallback(async (msg) => {
    // Resumption handle for transparent reconnect
    if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
      resumeHandle.current = msg.sessionResumptionUpdate.newHandle
    }

    // Audio out
    const inline = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData
    const audio = inline?.data
    if (audio) {
      setStatus('speaking')
      const ctx = outCtx.current
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})
      // Parse the real sample rate from the mime type (e.g. "audio/pcm;rate=24000").
      // Building the buffer at the source rate lets Web Audio resample correctly —
      // a hardcoded rate mismatch is what makes speech sound sped-up / garbled.
      const rateMatch = /rate=(\d+)/.exec(inline.mimeType || '')
      const srcRate = rateMatch ? parseInt(rateMatch[1], 10) : OUTPUT_RATE
      const buf = pcmToAudioBuffer(ctx, decodeBase64(audio), srcRate)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      nextStart.current = Math.max(nextStart.current, ctx.currentTime + 0.02)
      src.start(nextStart.current)
      nextStart.current += buf.duration
      sources.current.push(src)
      src.onended = () => {
        sources.current = sources.current.filter((s) => s !== src)
        if (sources.current.length === 0 && nextStart.current <= ctx.currentTime + 0.05) setStatus('listening')
      }
    }

    // Barge-in: the model detected the user speaking over it → stop playback now
    if (msg.serverContent?.interrupted) {
      stopPlayback()
      setStatus('listening')
    }

    // User speech transcript (for history only)
    const inT = msg.serverContent?.inputTranscription
    if (inT?.finished && inT.text?.trim()) appendHistory({ sender: 'user', text: inT.text })

    // Clear the screen ONCE at the start of a new turn — triggered by whichever
    // arrives first (speech transcript OR a tool call). This prevents a tool
    // card added before the first transcript from being wiped.
    const startTurn = () => { if (!newTurn.current) { clearAll(); newTurn.current = true } }

    // Agent speech transcript → live caption
    const outT = msg.serverContent?.outputTranscription
    if (outT?.text) {
      startTurn()
      appendStreamingText(outT.text)
    }

    // Turn complete
    if (msg.serverContent?.turnComplete) {
      const final = useAssistantStore.getState().streamingText.trim()
      if (final) { setLastResponse(final); appendHistory({ sender: 'assistant', text: final }) }
      setStreamingText('')
      newTurn.current = false
      reconnects.current = 0
      setStatus('listening')
    }

    // Tool calls — onToolCall returns data the model needs (or fires async)
    if (msg.toolCall?.functionCalls?.length) {
      const s = session.current
      if (!s || !active.current) return
      startTurn() // clear BEFORE adding cards, so they survive the turn
      const live = await s
      for (const call of msg.toolCall.functionCalls) {
        let result
        try { result = await onToolCall(call.name, call.args ?? {}) } catch (_) { result = null }
        if (!active.current) break
        try {
          live.sendToolResponse({
            functionResponses: [{ id: call.id, name: call.name, response: { output: result ?? 'done' } }],
          })
        } catch (_) {}
      }
    }
  }, [setStatus, setStreamingText, appendStreamingText, setLastResponse, clearAll, appendHistory, stopPlayback, onToolCall])

  const openSession = useCallback(async (isReconnect) => {
    const myGen = ++gen.current

    const reconnect = () => {
      if (userClosed.current || myGen !== gen.current) return
      if (reconnects.current >= MAX_RECONNECTS) { setError('Connection lost. Tap the mic to continue.'); disconnect(); return }
      reconnects.current += 1
      teardownSession()
      openSession(true)
    }

    // Get a single-use ephemeral token + config. Prefer a token pre-minted on
    // page load (saves ~500ms on the first connect). Tokens are valid ~2 min;
    // only reuse a prefetch younger than 90s, and never for reconnects.
    let token, model, baseConfig
    const pf = prefetched.current
    prefetched.current = null
    if (!isReconnect && pf && performance.now() - pf.at < 90_000) {
      ({ token, model, baseConfig } = pf)
    } else {
      try {
        const res = await fetch(`/api/gemini-session?brand=${params.current.brandSlug}&model=${params.current.modelSlug}`)
        if (!res.ok) throw new Error()
        const d = await res.json()
        token = d.token; model = d.sessionConfig.model; baseConfig = d.sessionConfig.config
      } catch (_) {
        if (isReconnect) { reconnect(); return }
        setError('Could not reach the server.'); disconnect(); return
      }
    }
    if (myGen !== gen.current || userClosed.current) return // stale after await

    const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1alpha' } })
    const config = { ...baseConfig, sessionResumption: { handle: resumeHandle.current || undefined } }

    const setupMic = async () => {
      let s
      try {
        s = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
      } catch (_) { setError('Microphone access denied.'); disconnect(); return }
      stream.current = s
      const ctx = new AudioContext({ sampleRate: INPUT_RATE })
      inCtx.current = ctx
      await ctx.audioWorklet.addModule('/pcm-worklet.js')
      const source = ctx.createMediaStreamSource(s)

      const an = ctx.createAnalyser()
      an.fftSize = 256
      source.connect(an)
      analyser.current = an
      const data = new Uint8Array(an.frequencyBinCount)
      let last = 0, lastT = 0
      const tick = () => {
        if (!analyser.current) return
        an.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v }
        const lvl = Math.min(1, Math.sqrt(sum / data.length) * 4)
        const now = performance.now()
        if (Math.abs(lvl - last) > 0.04 && now - lastT > 33) { setInputLevel(lvl); last = lvl; lastT = now }
        raf.current = requestAnimationFrame(tick)
      }
      tick()

      const w = new AudioWorkletNode(ctx, 'pcm-worklet')
      worklet.current = w
      w.port.onmessage = (e) => {
        if (!active.current || !session.current) return
        const st = useAssistantStore.getState()
        if (st.muted) return
        // Barge-in: while the agent is speaking, only forward audio once the
        // mic level clears the echo floor (echoCancellation keeps speaker bleed
        // low). Real user speech crosses BARGE_LEVEL → the model hears it and
        // interrupts; the agent's own voice stays below it → no self-interrupt.
        if (st.status === 'speaking' && st.inputLevel < BARGE_LEVEL) return
        const blob = { data: encodeBase64(new Uint8Array(e.data)), mimeType: 'audio/pcm;rate=16000' }
        session.current.then((live) => {
          if (!active.current) return
          try { live.sendRealtimeInput({ audio: blob }) } catch (_) {}
        })
      }
      source.connect(w)
    }

    session.current = ai.live.connect({
      model,
      config,
      callbacks: {
        onopen: async () => {
          if (myGen !== gen.current) return
          active.current = true
          if (connectTimer.current) { clearTimeout(connectTimer.current); connectTimer.current = null }
          setStatus('listening')
          newTurn.current = false
          if (!isReconnect) await setupMic()
        },
        onmessage: (m) => { if (myGen === gen.current) handleMessage(m) },
        onerror: () => { if (myGen === gen.current && !userClosed.current) reconnect() },
        onclose: () => { if (myGen === gen.current && !userClosed.current) reconnect() },
      },
    })
  }, [handleMessage, disconnect, teardownSession, setStatus, setError, setInputLevel])

  // Pre-mint a token ahead of the user tapping the mic (call on page load).
  // Removes the ~500ms token round-trip from the first-response path.
  const prefetch = useCallback(async ({ brandSlug, modelSlug }) => {
    params.current = { brandSlug, modelSlug }
    try {
      const res = await fetch(`/api/gemini-session?brand=${brandSlug}&model=${modelSlug}`)
      if (!res.ok) return
      const d = await res.json()
      prefetched.current = {
        token: d.token, model: d.sessionConfig.model,
        baseConfig: d.sessionConfig.config, at: performance.now(),
      }
    } catch (_) { /* non-fatal — connect will mint on demand */ }
  }, [])

  const connect = useCallback(({ brandSlug, modelSlug }) => {
    if (session.current || active.current) disconnect()
    params.current = { brandSlug, modelSlug }
    userClosed.current = false
    resumeHandle.current = null
    reconnects.current = 0
    setError(null)
    setStatus('connecting')

    connectTimer.current = setTimeout(() => {
      if (!active.current) { setError('Connection timed out. Please try again.'); disconnect() }
    }, CONNECT_TIMEOUT)

    outCtx.current = new AudioContext({ sampleRate: OUTPUT_RATE })
    outCtx.current.resume().catch(() => {})

    openSession(false)
  }, [disconnect, openSession, setError, setStatus])

  return { connect, disconnect, prefetch }
}
