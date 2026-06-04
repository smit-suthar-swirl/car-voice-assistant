export function encodeBase64(uint8Array) {
  let binary = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  return btoa(binary)
}

export function decodeBase64(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** Convert raw 16-bit little-endian PCM bytes → Web Audio AudioBuffer at targetSampleRate */
export function pcmToAudioBuffer(audioCtx, bytes, sampleRate = 24000) {
  const samples = bytes.length / 2
  const buffer = audioCtx.createBuffer(1, samples, sampleRate)
  const channel = buffer.getChannelData(0)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  for (let i = 0; i < samples; i++) {
    channel[i] = view.getInt16(i * 2, true) / 32768
  }
  return buffer
}

/** Convert Float32 mic samples → 16-bit little-endian PCM Uint8Array at 16kHz */
export function float32ToPcm16(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < float32Array.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(i * 2, clamped * 32767, true)
  }
  return new Uint8Array(buffer)
}
