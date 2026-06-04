import { create } from 'zustand'

export const useAssistantStore = create((set, get) => ({
  // Connection
  status: 'idle', // idle | connecting | listening | speaking | error
  setStatus: (status) => set({ status }),

  error: null,
  setError: (error) => set({ error }),

  // Mute — pauses sending mic audio without closing the session
  muted: false,
  setMuted: (muted) => set({ muted }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),

  // Live mic input level (0..1) for the reactive waveform
  inputLevel: 0,
  setInputLevel: (inputLevel) => set({ inputLevel }),

  // Live streaming text (in-progress, shown while agent is speaking)
  streamingText: '',
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingText: (chunk) => set((s) => ({ streamingText: s.streamingText + chunk })),

  // Last completed response — single value, never accumulates
  lastResponse: '',
  setLastResponse: (text) => set({ lastResponse: text }),

  // Content blocks — only non-text cards (comparison, reviews, videos)
  contentBlocks: [],
  addBlock: (type, data) =>
    set((s) => ({ contentBlocks: [...s.contentBlocks, { id: Date.now(), type, data }] })),

  clearAll: () => set({ contentBlocks: [], streamingText: '', lastResponse: '', activePanel: null, panelData: null }),

  // Booking panels (step-by-step overlay)
  activePanel: null,
  panelData: null,
  showPanel: (panel, data) => set({ activePanel: panel, panelData: data }),
  clearPanel: () => set({ activePanel: null, panelData: null }),

  // Conversation history
  history: [],
  appendHistory: (entry) => set((s) => ({ history: [...s.history.slice(-30), entry] })),

  // Brand + car context
  brand: null,
  car: null,
  setContext: (brand, car) => set({ brand, car }),

  // Booking state
  booking: { name: '', mobile: '', showroomId: '', showroomName: '', slot: '' },
  setBooking: (partial) => set((s) => ({ booking: { ...s.booking, ...partial } })),
  clearBooking: () => set({ booking: { name: '', mobile: '', showroomId: '', showroomName: '', slot: '' } }),
}))
