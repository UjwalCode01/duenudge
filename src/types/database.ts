export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];
export type BusinessProfileInsert = Database['public']['Tables']['business_profiles']['Insert'];
export type BusinessProfileUpdate = Database['public']['Tables']['business_profiles']['Update'];
export type UserProfile = Database['public']['Tables']['users']['Row'];
