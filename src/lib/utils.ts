import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "Not available"
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  })
}

export function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

export function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
