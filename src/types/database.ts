export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id?: string | null;
          business_name: string;
          logo_url: string | null;
          address: string | null;
          currency: string;
          payment_instructions: string | null;
          default_due_days: number;
          invoice_prefix: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          business_name?: string;
          logo_url?: string | null;
          address?: string | null;
          currency?: string;
          payment_instructions?: string | null;
          default_due_days?: number;
          invoice_prefix?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          business_name?: string;
          logo_url?: string | null;
          address?: string | null;
          currency?: string;
          payment_instructions?: string | null;
          default_due_days?: number;
          invoice_prefix?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      business_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          logo_url: string | null;
          address: string | null;
          currency: string;
          payment_instructions: string | null;
          default_due_days: number;
          invoice_prefix: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name?: string;
          logo_url?: string | null;
          address?: string | null;
          currency?: string;
          payment_instructions?: string | null;
          default_due_days?: number;
          invoice_prefix?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          logo_url?: string | null;
          address?: string | null;
          currency?: string;
          payment_instructions?: string | null;
          default_due_days?: number;
          invoice_prefix?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          company: string | null;
          currency: string;
          default_payment_terms: number;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          company?: string | null;
          currency?: string;
          default_payment_terms?: number;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          currency?: string;
          default_payment_terms?: number;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          invoice_number: string;
          issue_date: string;
          due_date: string;
          status: InvoiceStatus;
          currency: string;
          subtotal: number;
          tax_percentage: number;
          tax_amount: number;
          total_amount: number;
          notes: string | null;
          payment_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          invoice_number: string;
          issue_date?: string;
          due_date: string;
          status?: InvoiceStatus;
          currency?: string;
          subtotal?: number;
          tax_percentage?: number;
          tax_amount?: number;
          total_amount?: number;
          notes?: string | null;
          payment_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          invoice_number?: string;
          issue_date?: string;
          due_date?: string;
          status?: InvoiceStatus;
          currency?: string;
          subtotal?: number;
          tax_percentage?: number;
          tax_amount?: number;
          total_amount?: number;
          notes?: string | null;
          payment_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          user_id: string;
          description: string;
          quantity: number;
          rate: number;
          amount: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          user_id: string;
          description: string;
          quantity?: number;
          rate?: number;
          amount?: number;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          user_id?: string;
          description?: string;
          quantity?: number;
          rate?: number;
          amount?: number;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      invoice_status: InvoiceStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];
export type BusinessProfileInsert = Database['public']['Tables']['business_profiles']['Insert'];
export type BusinessProfileUpdate = Database['public']['Tables']['business_profiles']['Update'];

export type UserProfile = Database['public']['Tables']['users']['Row'];

export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];
export type InvoiceItemUpdate = Database['public']['Tables']['invoice_items']['Update'];

export interface InvoiceWithDetails extends Invoice {
  client?: Client | null;
  items?: InvoiceItem[];
}
