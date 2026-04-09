import { cn } from '@/lib/utils'
import type { SampleStatus, SampleCondition } from '@/types'

interface StatusBadgeProps {
  status?: SampleStatus
  condition?: SampleCondition
  className?: string
}

const statusStyles: Record<SampleStatus, string> = {
  booked: 'bg-blue-100 text-blue-800 border border-blue-200',
  picked_up: 'bg-purple-100 text-purple-800 border border-purple-200',
  in_transit: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  received: 'bg-green-100 text-green-800 border border-green-200',
}

const statusLabels: Record<SampleStatus, string> = {
  booked: 'Booked',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  received: 'Received',
}

const conditionStyles: Record<SampleCondition, string> = {
  intact: 'bg-green-100 text-green-800 border border-green-200',
  damaged: 'bg-red-100 text-red-800 border border-red-200',
}

export default function StatusBadge({
  status,
  condition,
  className,
}: StatusBadgeProps) {
  if (condition) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
          conditionStyles[condition],
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </span>
    )
  }

  if (!status) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        statusStyles[status],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  )
}