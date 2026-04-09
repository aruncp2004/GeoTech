import { useQuery } from '@tanstack/react-query'
import { getCouriersFromDB } from '@/lib/courier'

export function useCouriers() {
  const { data: couriers = [], isLoading } = useQuery({
    queryKey: ['couriers'],
    queryFn: getCouriersFromDB,
  })

  return {
    couriers,
    isLoading,
  }
}