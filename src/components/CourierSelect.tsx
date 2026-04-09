import { useCouriers } from '@/hooks/useCouriers'
import { cn } from '@/lib/utils'
import type { Courier } from '@/types'

interface CourierSelectProps {
  selected: string
  onSelect: (courier: Courier) => void
}

export default function CourierSelect({
  selected,
  onSelect,
}: CourierSelectProps) {
  const { couriers, isLoading } = useCouriers()

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (couriers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No couriers available for your pincode. Please contact support.
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      {couriers.map((courier) => (
        <button
          key={courier.id}
          type="button"
          onClick={() => onSelect(courier)}
          className={cn(
            'w-full p-4 rounded-lg border-2 text-left transition-all',
            'hover:border-primary hover:bg-primary/5',
            selected === courier.name
              ? 'border-secondary bg-secondary/10'
              : 'border-border bg-background'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {courier.name}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {courier.coverage}
              </p>
            </div>
            {selected === courier.name && (
              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 text-secondary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}