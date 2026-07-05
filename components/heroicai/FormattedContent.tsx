import { Fragment, type ReactNode } from 'react'

/**
 * Renderiza el texto del asistente con formato mínimo y SEGURO (sin
 * dangerouslySetInnerHTML): negritas **texto**, viñetas y saltos de línea.
 * Suficiente para respuestas concisas; evita sumar una dependencia de markdown.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={`${keyPrefix}-t${i}`}>{text.slice(lastIndex, match.index)}</Fragment>)
    }
    nodes.push(
      <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-slate-900">
        {match[1]}
      </strong>,
    )
    lastIndex = regex.lastIndex
    i++
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t${i}`}>{text.slice(lastIndex)}</Fragment>)
  }
  return nodes
}

export function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed text-slate-700">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} className="h-1.5" />

        const bulletMatch = /^[-*•]\s+(.*)$/.exec(trimmed)
        if (bulletMatch) {
          return (
            <div key={idx} className="flex gap-2 pl-1">
              <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500/70" />
              <span>{renderInline(bulletMatch[1], `l${idx}`)}</span>
            </div>
          )
        }

        return <p key={idx}>{renderInline(trimmed, `l${idx}`)}</p>
      })}
    </div>
  )
}
