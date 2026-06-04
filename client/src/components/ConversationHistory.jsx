import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAssistantStore } from '@/store/assistant'
import { cn } from '@/lib/cn'

export function ConversationHistory() {
  const history = useAssistantStore((s) => s.history)
  const status = useAssistantStore((s) => s.status)
  const brand = useAssistantStore((s) => s.brand)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  return (
    <div className="flex flex-col h-full">
      {/* Brand identity */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        {brand?.logoUrl ? (
          <img src={brand.logoUrl} alt={brand.name} className="h-6 object-contain" />
        ) : (
          <div
            className="w-2 h-6 rounded-sm"
            style={{ background: 'var(--brand-primary)' }}
          />
        )}
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest">Voice Assistant</p>
          <p className="text-sm font-semibold text-white/80">{brand?.name ?? 'Honda'} Dealer</p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 px-5 py-3">
        <div className={cn(
          'w-2 h-2 rounded-full transition-colors duration-500',
          status === 'idle' && 'bg-white/20',
          status === 'connecting' && 'bg-yellow-400 animate-pulse',
          status === 'listening' && 'bg-green-400',
          status === 'speaking' && 'bg-blue-400 animate-pulse',
        )} />
        <span className="text-xs text-white/30 capitalize">{status}</span>
      </div>

      {/* Conversation pills */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-hide">
        <AnimatePresence initial={false}>
          {history.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: entry.sender === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                'rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[85%]',
                entry.sender === 'user'
                  ? 'ml-auto bg-white/10 text-white/70'
                  : 'mr-auto text-white/60',
              )}
              style={entry.sender === 'assistant' ? { background: 'rgba(228,5,33,0.15)' } : {}}
            >
              {entry.text}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
