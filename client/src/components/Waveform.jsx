import { motion } from 'framer-motion'
import { useAssistantStore } from '@/store/assistant'

const BARS = 14
// Per-bar base heights forming a smooth bell curve
const BASE = Array.from({ length: BARS }, (_, i) => {
  const t = i / (BARS - 1)
  return 0.25 + Math.sin(t * Math.PI) * 0.75
})

export function Waveform() {
  const status = useAssistantStore((s) => s.status)
  const level = useAssistantStore((s) => s.inputLevel)

  const speaking = status === 'speaking'
  const listening = status === 'listening'
  const dim = !speaking && !listening

  return (
    <div className="flex items-center gap-[2px] h-7 flex-1">
      {BASE.map((base, i) => {
        // Listening → react to mic level; Speaking → gentle auto animation
        const target = listening
          ? 3 + base * level * 22
          : speaking
            ? undefined
            : 3 + base * 2

        return (
          <motion.span
            key={i}
            className="w-[2px] rounded-full"
            style={{ background: 'var(--brand-primary)', opacity: dim ? 0.18 : 0.9 }}
            animate={
              speaking
                ? { height: [4, 4 + base * 18, 4] }
                : { height: target }
            }
            transition={
              speaking
                ? { duration: 0.5 + (i % 5) * 0.08, repeat: Infinity, ease: 'easeInOut', delay: (i % 7) * 0.05 }
                : { type: 'spring', stiffness: 400, damping: 25 }
            }
          />
        )
      })}
    </div>
  )
}
