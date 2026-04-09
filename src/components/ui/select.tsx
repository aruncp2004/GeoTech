import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  onValueChange?: (value: string) => void
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, onChange, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onChange={(event) => {
          onChange?.(event)
          onValueChange?.(event.target.value)
        }}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

function SelectTrigger({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return null
}

function SelectValue({
  placeholder,
}: {
  placeholder?: string
}) {
  return null
}

function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function SelectItem({
  value,
  children,
  disabled,
}: {
  value: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
