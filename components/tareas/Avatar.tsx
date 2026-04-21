import { cn } from '@/lib/utils'
import { getInitials } from './utils'

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(hash)]
}

export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = getAvatarColor(name)
  const sizeClass = size === 'sm' ? 'w-5 h-5 text-[9px]' : size === 'md' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div
      className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', color, sizeClass)}
    >
      {getInitials(name)}
    </div>
  )
}
