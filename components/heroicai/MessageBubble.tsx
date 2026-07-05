import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-heroicai-chat'
import { FormattedContent } from './FormattedContent'

interface MessageBubbleProps {
  message: ChatMessage
  streaming?: boolean
}

export function MessageBubble({ message, streaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#002868] to-[#2563eb] shadow-sm shadow-blue-900/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm',
          isUser
            ? 'rounded-br-md bg-gradient-to-br from-[#002868] to-[#003d8f] text-white'
            : 'rounded-bl-md border border-slate-100 bg-white',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{message.content}</p>
        ) : (
          <>
            <FormattedContent content={message.content} />
            {streaming && <span className="heroicai-caret" aria-hidden />}
          </>
        )}
      </div>
    </div>
  )
}
