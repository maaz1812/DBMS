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
      departments: {
        Row: {
          dept_id: number
          dept_name: string
          floor: number
          head_doctor_id: number | null
        }
        Insert: {
          dept_id?: number
          dept_name: string
          floor: number
          head_doctor_id?: number | null
        }
        Update: {
          dept_id?: number
          dept_name?: string
          floor?: number
          head_doctor_id?: number | null
        }
      }
      doctors: {
        Row: {
          doctor_id: number
          dept_id: number | null
          first_name: string
          last_name: string
          specialization: string | null
          fee: number | null
          phone: string | null
        }
        Insert: {
          doctor_id?: number
          dept_id?: number | null
          first_name: string
          last_name: string
          specialization?: string | null
          fee?: number | null
          phone?: string | null
        }
        Update: {
          doctor_id?: number
          dept_id?: number | null
          first_name?: string
          last_name?: string
          specialization?: string | null
          fee?: number | null
          phone?: string | null
        }
      }
      patients: {
        Row: {
          patient_id: number
          first_name: string
          last_name: string
          dob: string | null
          gender: string | null
          blood_group: string | null
          contact: string | null
        }
        Insert: {
          patient_id?: number
          first_name: string
          last_name: string
          dob?: string | null
          gender?: string | null
          blood_group?: string | null
          contact?: string | null
        }
        Update: {
          patient_id?: number
          first_name?: string
          last_name?: string
          dob?: string | null
          gender?: string | null
          blood_group?: string | null
          contact?: string | null
        }
      }
      rooms_beds: {
        Row: {
          bed_id: number
          room_no: string
          ward_type: 'ICU' | 'General' | 'Private'
          daily_rate: number
          status: 'Vacant' | 'Occupied' | 'Sanitizing'
        }
        Insert: {
          bed_id?: number
          room_no: string
          ward_type: 'ICU' | 'General' | 'Private'
          daily_rate: number
          status?: 'Vacant' | 'Occupied' | 'Sanitizing'
        }
        Update: {
          bed_id?: number
          room_no?: string
          ward_type?: 'ICU' | 'General' | 'Private'
          daily_rate?: number
          status?: 'Vacant' | 'Occupied' | 'Sanitizing'
        }
      }
      admissions: {
        Row: {
          admission_id: number
          patient_id: number
          bed_id: number
          doctor_id: number
          admission_date: string
          discharge_date: string | null
          notes: string | null
        }
        Insert: {
          admission_id?: number
          patient_id: number
          bed_id: number
          doctor_id: number
          admission_date?: string
          discharge_date?: string | null
          notes?: string | null
        }
        Update: {
          admission_id?: number
          patient_id?: number
          bed_id?: number
          doctor_id?: number
          admission_date?: string
          discharge_date?: string | null
          notes?: string | null
        }
      }
      appointments: {
        Row: {
          appointment_id: number
          patient_id: number
          doctor_id: number
          appt_date: string
          time_slot: string
          status: 'Scheduled' | 'Completed' | 'Cancelled'
        }
        Insert: {
          appointment_id?: number
          patient_id: number
          doctor_id: number
          appt_date: string
          time_slot: string
          status?: 'Scheduled' | 'Completed' | 'Cancelled'
        }
        Update: {
          appointment_id?: number
          patient_id?: number
          doctor_id?: number
          appt_date?: string
          time_slot?: string
          status?: 'Scheduled' | 'Completed' | 'Cancelled'
        }
      }
      medications: {
        Row: {
          med_id: number
          med_name: string
          unit_price: number
          stock_qty: number
          min_threshold: number
        }
        Insert: {
          med_id?: number
          med_name: string
          unit_price: number
          stock_qty: number
          min_threshold?: number
        }
        Update: {
          med_id?: number
          med_name?: string
          unit_price?: number
          stock_qty?: number
          min_threshold?: number
        }
      }
      prescription_items: {
        Row: {
          item_id: number
          admission_id: number
          med_id: number
          quantity: number
          dosage_instructions: string | null
        }
        Insert: {
          item_id?: number
          admission_id: number
          med_id: number
          quantity: number
          dosage_instructions?: string | null
        }
        Update: {
          item_id?: number
          admission_id?: number
          med_id?: number
          quantity?: number
          dosage_instructions?: string | null
        }
      }
      invoices: {
        Row: {
          invoice_id: number
          admission_id: number
          room_charge: number
          doctor_charge: number
          pharmacy_charge: number
          total_amount: number
          status: 'Pending' | 'Paid'
          created_at: string
        }
        Insert: {
          invoice_id?: number
          admission_id: number
          room_charge?: number
          doctor_charge?: number
          pharmacy_charge?: number
          total_amount?: number
          status?: 'Pending' | 'Paid'
          created_at?: string
        }
        Update: {
          invoice_id?: number
          admission_id?: number
          room_charge?: number
          doctor_charge?: number
          pharmacy_charge?: number
          total_amount?: number
          status?: 'Pending' | 'Paid'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      discharge_patient: {
        Args: {
          p_admission_id: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
