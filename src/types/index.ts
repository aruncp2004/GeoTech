export type SampleStatus = 'booked' | 'picked_up' | 'in_transit' | 'received';

export type SampleCondition = 'intact' | 'damaged';

export type SampleType = 'soil' | 'rock' | 'water' | 'concrete' | 'aggregate' | 'other' | string;

export type UserRole = 'super_admin' | 'admin' | 'customer';

export interface UserProfile {
  id: string;
  full_name: string;
  company: string;
  designation: string;
  email: string;
  phone: string;
  address: string;
  pincode: string;
  role: UserRole;
  tracking_access: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Sample {
  id: string;
  sample_id: string;
  customer_id: string;
  customer_name?: string;
  customer_company?: string;
   profiles?: {
    full_name: string
    company: string
  }
  sample_type: SampleType;
  test_required: string;
  project_name?: string;
  site_location?: string;
  sample_description?: string;
  num_parcels: number;
  weight_kg: number;
  pickup_address: string;
  pickup_date: string;
  pickup_time: string;
  courier_name: string;
  awb_number?: string;
  status: SampleStatus;
  condition?: SampleCondition;
  notes?: string;
  received_at?: string;
  created_at: string;
}

export interface Courier {
  id: string;
  name: string;
  coverage: string;
}

export const STATUS_LABELS: Record<SampleStatus, string> = {
  booked: 'Booked',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  received: 'Received',
};

export const STATUS_ORDER: SampleStatus[] = [
  'booked',
  'picked_up',
  'in_transit',
  'received',
];