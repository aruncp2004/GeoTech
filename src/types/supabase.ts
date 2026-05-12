export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          company: string
          designation: string
          email: string
          phone: string
          address: string
          pincode: string
          role: string
          tracking_access: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          company: string
          designation: string
          email: string
          phone: string
          address: string
          pincode: string
          role?: string
          tracking_access?: boolean
          created_at?: string
        }
        Update: {
          full_name?: string
          company?: string
          designation?: string
          email?: string
          phone?: string
          address?: string
          pincode?: string
          role?: string
          tracking_access?: boolean
        }
      }
      samples: {
        Row: {
          id: string
          sample_id: string
          customer_id: string
          sample_type: string
          test_required: string
          client_name: string | null
          num_parcels: number
          weight_kg: number
          pickup_address: string
          pickup_date: string
          pickup_time: string
          courier_name: string
          awb_number: string | null
          status: string
          condition: string | null
          notes: string | null
          received_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sample_id: string
          customer_id: string
          sample_type: string
          test_required: string
          client_name?: string | null
          num_parcels: number
          weight_kg: number
          pickup_address: string
          pickup_date: string
          pickup_time: string
          courier_name: string
          awb_number?: string | null
          status?: string
          condition?: string | null
          notes?: string | null
          received_at?: string | null
          created_at?: string
        }
        Update: {
          status?: string
          condition?: string | null
          notes?: string | null
          awb_number?: string | null
          received_at?: string | null
          client_name?: string | null
        }
      }
    }
  }
}