// packages/shared/src/types/index.ts
export type RideStatus = 
  | 'scheduled'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_pending'
  | 'paid'
  | 'cancelled'
  | 'expired'
  | 'no_show'
