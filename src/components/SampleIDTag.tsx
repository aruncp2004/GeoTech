import { Package } from 'lucide-react'
import type { Sample } from '@/types'

interface SampleIDTagProps {
  sample: Sample
}

export default function SampleIDTag({ sample }: SampleIDTagProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="border-2 border-dashed border-primary rounded-lg p-6 text-center bg-white max-w-sm mx-auto">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Package className="h-5 w-5 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          GeoTech Labs — Velciti
        </span>
      </div>

      <div className="text-4xl font-black text-primary tracking-wider mb-4 font-mono">
        {sample.sample_id}
      </div>

      <div className="space-y-1 text-sm text-left border-t pt-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Customer</span>
          <span className="font-medium">{sample.customer_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type</span>
          <span className="font-medium capitalize">{sample.sample_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Parcels</span>
          <span className="font-medium">{sample.num_parcels}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Weight</span>
          <span className="font-medium">{sample.weight_kg} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">
            {new Date(sample.created_at).toLocaleDateString('en-IN')}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        Write this ID clearly on all parcels
      </div>

      <button
        onClick={handlePrint}
        className="mt-4 w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors print:hidden"
      >
        Print Label
      </button>
    </div>
  )
}