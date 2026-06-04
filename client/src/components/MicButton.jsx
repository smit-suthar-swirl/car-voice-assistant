import { motion, AnimatePresence } from 'framer-motion'
import { useAssistantStore } from '@/store/assistant'
import { cn } from '@/lib/cn'

export function MicButton({ onConnect, onDisconnect }) {
  const status = useAssistantStore((s) => s.status)
  const inputLevel = useAssistantStore((s) => s.inputLevel)
  const isActive = status === 'listening' || status === 'speaking'
  const isConnecting = status === 'connecting'

  // Glow scales with the user's voice level while listening
  const glow = status === 'listening' ? 1 + inputLevel * 0.6 : 1

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      {/* Pulsing ring while active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="ring"
            className="absolute rounded-full"
            style={{ width: 52, height: 52, background: 'var(--brand-primary)' }}
            initial={{ scale: 1, opacity: 0.35 }}
            animate={{ scale: 1.7, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Spinning loader ring while connecting */}
      {isConnecting && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 58, height: 58,
            border: '2px solid transparent',
            borderTopColor: 'var(--brand-primary)',
            borderRightColor: 'var(--brand-primary)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <motion.button
        onClick={isActive ? onDisconnect : isConnecting ? undefined : onConnect}
        disabled={isConnecting}
        whileTap={{ scale: 0.92 }}
        animate={{ scale: status === 'listening' ? glow : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'relative z-10 flex items-center justify-center w-[52px] h-[52px] rounded-full shadow-lg transition-colors duration-300',
          isActive ? 'text-white' : 'bg-white/8 hover:bg-white/12 text-white border border-white/10',
          isConnecting && 'cursor-wait opacity-80',
        )}
        style={isActive ? { background: 'var(--brand-primary)' } : {}}
        aria-label={isActive ? 'Stop' : 'Start'}
      >
        {isActive ? <StopIcon /> : <MicIcon />}
      </motion.button>
    </div>
  )
}

export function MuteButton() {
  const muted = useAssistantStore((s) => s.muted)
  const toggleMuted = useAssistantStore((s) => s.toggleMuted)
  const status = useAssistantStore((s) => s.status)
  const disabled = status === 'idle' || status === 'connecting'

  return (
    <motion.button
      onClick={toggleMuted}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-full border transition-colors flex-shrink-0',
        disabled && 'opacity-30 cursor-not-allowed border-white/10 text-white/40',
        !disabled && muted && 'bg-red-500/15 border-red-500/40 text-red-400',
        !disabled && !muted && 'bg-white/6 border-white/12 text-white/60 hover:bg-white/10',
      )}
      aria-label={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? <MicOffIcon /> : <MicSmallIcon />}
    </motion.button>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-1 15.93V21h2v-2.07A8 8 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93z" />
    </svg>
  )
}
function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <rect x="6" y="6" width="12" height="12" rx="3" />
    </svg>
  )
}
function MicSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21h2v-2.07A8 8 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93z" />
    </svg>
  )
}
function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M16 5a4 4 0 0 0-8 0v1.17l8 8V5zM3 4.27l2.1 2.1A4 4 0 0 0 5 7v4a7 7 0 0 0 .42 2.4l1.5-1.5A5 5 0 0 1 6 11h.07L3 7.93 4.27 3 3 4.27zM12 17a6 6 0 0 0 5.66-4l1.5 1.5A8 8 0 0 1 13 18.93V21h-2v-2.07A8 8 0 0 1 5.6 16.2l1.42-1.42A6 6 0 0 0 12 17zm8.73 3.46L3.27 3 2 4.27l17.46 17.46L20.73 20.46z" />
    </svg>
  )
}
