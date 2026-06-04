// AudioWorkletProcessor — captures mic frames, batches them into steady
// ~64ms chunks, and posts 16-bit PCM to the main thread. Batching gives the
// server-side VAD a smooth, reliable stream (tiny per-quantum sends cause
// backpressure and make turn detection flaky).
const TARGET_SAMPLES = 512 // 32ms at 16kHz — low latency, still a smooth stream

class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buf = new Int16Array(TARGET_SAMPLES)
    this._len = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true
    const ch = input[0] // Float32Array, 128 samples

    for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]))
      this._buf[this._len++] = s * 32767
      if (this._len === TARGET_SAMPLES) {
        // Copy out and post (transfer the copy's buffer)
        const out = this._buf.slice(0)
        this.port.postMessage(out.buffer, [out.buffer])
        this._len = 0
      }
    }
    return true
  }
}

registerProcessor('pcm-worklet', PCMWorklet)
