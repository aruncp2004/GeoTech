import { CheckCircle2, Circle } from 'lucide-react'
import { STATUS_ORDER, STATUS_LABELS } from '@/types'
import type { SampleStatus } from '@/types'
import { cn } from '@/lib/utils'

interface TrackingTimelineProps {
  currentStatus: SampleStatus
  createdAt?: string
  dispatchedAt?: string
  atCourierAt?: string
  receivedAt?: string
}

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function TrackingTimeline({
  currentStatus,
  createdAt,
  dispatchedAt,
  atCourierAt,
  receivedAt,
}: TrackingTimelineProps) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)

  const statusDates: Record<SampleStatus, string | null> = {
    booked: formatDate(createdAt),
    dispatched: formatDate(dispatchedAt),
    at_courier: formatDate(atCourierAt),
    received: formatDate(receivedAt),
  }

  return (
    <div className="space-y-0">
      {STATUS_ORDER.map((status, idx) => {
        const isPast = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isFuture = idx > currentIdx
        const dateStr = statusDates[status]

        return (
          <div key={status} className="flex gap-4">
            {/* Icon */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                isPast && 'bg-green-500 border-green-500 text-white',
                isCurrent && status === 'at_courier' && 'bg-yellow-400 border-yellow-400 text-white',
                isCurrent && status !== 'at_courier' && 'bg-secondary border-secondary text-secondary-foreground',
                isFuture && 'bg-background border-muted text-muted-foreground'
              )}>
                {isPast ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <div className={cn(
                    'w-2.5 h-2.5 rounded-full bg-current',
                    status === 'at_courier' && 'animate-pulse'
                  )} />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {idx < STATUS_ORDER.length - 1 && (
                <div className={cn('w-0.5 h-10 mt-1', isPast ? 'bg-green-500' : 'bg-muted')} />
              )}
            </div>

            {/* Label + date */}
            <div className="flex-1 flex items-start justify-between pb-10 pt-1">
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  isPast && 'text-green-600',
                  isCurrent && status === 'at_courier' && 'text-yellow-700 font-semibold',
                  isCurrent && status !== 'at_courier' && 'text-foreground font-semibold',
                  isFuture && 'text-muted-foreground'
                )}>
                  {STATUS_LABELS[status]}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">Current status</p>
                )}
              </div>
              <div className="text-right">
                {dateStr && (isPast || isCurrent) ? (
                  <p className={cn(
                    'text-xs font-medium',
                    isPast && 'text-green-600',
                    isCurrent && 'text-muted-foreground',
                  )}>
                    {dateStr}
                  </p>
                ) : isFuture ? (
                  <p className="text-xs text-muted-foreground">Pending</p>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}