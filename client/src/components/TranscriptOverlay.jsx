import { AnimatePresence, motion } from 'framer-motion'
import { useAssistantStore } from '@/store/assistant'

export function TranscriptOverlay() {
  const transcript = useAssistantStore((s) => s.transcript)
  const status = useAssistantStore((s) => s.status)

  const label =
    status === 'idle' ? 'Say something to start…' :
    status === 'connecting' ? 'Connecting…' :
    status === 'listening' ? 'Listening…' :
    transcript || ''

  return (
    <div className="h-12 flex items-center justify-center px-8">
      <AnimatePresence mode="wait">
        <motion.p
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-sm text-white/50 text-center truncate max-w-xl"
        >
          {label}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
