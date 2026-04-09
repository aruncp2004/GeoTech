import { CheckCircle2, Circle } from 'lucide-react'
import { STATUS_ORDER, STATUS_LABELS } from '@/types'
import type { SampleStatus } from '@/types'
import { cn } from '@/lib/utils'

interface TrackingTimelineProps {
  currentStatus: SampleStatus
}

export default function TrackingTimeline({
  currentStatus,
}: TrackingTimelineProps) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="space-y-0">
      {STATUS_ORDER.map((status, idx) => {
        const isPast = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isFuture = idx > currentIdx

        return (
          <div key={status} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                  isPast &&
                    'bg-green-500 border-green-500 text-white',
                  isCurrent &&
                    'bg-secondary border-secondary text-secondary-foreground',
                  isFuture &&
                    'bg-background border-muted text-muted-foreground'
                )}
              >
                {isPast ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-current" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {idx < STATUS_ORDER.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 mt-1',
                    isPast ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}
            </div>

            {/* Label column */}
            <div className="pb-8 pt-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  isPast && 'text-green-600',
                  isCurrent && 'text-foreground font-semibold',
                  isFuture && 'text-muted-foreground'
                )}
              >
                {STATUS_LABELS[status]}
              </p>
              {isCurrent && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current status
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}