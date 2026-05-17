// Hand-written DB types. Mirror schema in supabase/migrations/0001_init.sql.

export type UserRole = 'guest' | 'staff' | 'admin';
export type RoomStatus =
  | 'available' | 'reserved' | 'occupied' | 'dirty' | 'cleaning' | 'out_of_order';
export type BookingStatus =
  | 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'promptpay' | 'cash' | 'card' | 'transfer';
export type TaskStatus = 'open' | 'in_progress' | 'done';
export type TaskKind = 'cleaning' | 'maintenance' | 'inspection';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  role: UserRole;
  guest_type: string | null;
  created_at: string;
}

export interface Floor {
  id: string;
  number: number;
  name: string;
  purposes: string[];
}

export interface Room {
  id: string;
  number: string;
  type: string;
  beds: string | null;
  capacity: number;
  price_per_night: number;
  floor_id: string | null;
  status: RoomStatus;
  amenities: string[];
  description: string | null;
}

export interface Booking {
  id: string;
  code: string;
  guest_id: string | null;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: BookingStatus;
  total_amount: number;
  notes: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  ref: string | null;
  paid_at: string | null;
  created_at: string;
}

// Bookings joined with their room — common shape for staff/guest pages.
export interface BookingWithRoom extends Booking {
  rooms: Pick<Room, 'id' | 'number' | 'type' | 'price_per_night'> | null;
}
