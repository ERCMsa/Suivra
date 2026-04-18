export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      caisse_items: {
        Row: {
          caisse_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          caisse_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          caisse_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caisse_items_caisse_id_fkey"
            columns: ["caisse_id"]
            isOneToOne: false
            referencedRelation: "caisses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caisse_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      caisse_movements: {
        Row: {
          caisse_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          responsible_person: string | null
          type: string
        }
        Insert: {
          caisse_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          reason?: string | null
          responsible_person?: string | null
          type: string
        }
        Update: {
          caisse_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          responsible_person?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "caisse_movements_caisse_id_fkey"
            columns: ["caisse_id"]
            isOneToOne: false
            referencedRelation: "caisses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caisse_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      caisses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      damage_reports: {
        Row: {
          action_taken: string | null
          created_at: string
          created_by: string | null
          damage_date: string
          description: string
          id: string
          image_url: string | null
          notes: string | null
          product_id: string
          quantity_damaged: number
          responsible_person: string | null
          responsible_team: string | null
          severity: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          damage_date?: string
          description: string
          id?: string
          image_url?: string | null
          notes?: string | null
          product_id: string
          quantity_damaged?: number
          responsible_person?: string | null
          responsible_team?: string | null
          severity?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          damage_date?: string
          description?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          product_id?: string
          quantity_damaged?: number
          responsible_person?: string | null
          responsible_team?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_items: {
        Row: {
          created_at: string
          discharge_id: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          discharge_id: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          discharge_id?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "discharge_items_discharge_id_fkey"
            columns: ["discharge_id"]
            isOneToOne: false
            referencedRelation: "discharges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discharges: {
        Row: {
          created_at: string
          created_by: string | null
          date_out: string
          date_returned: string | null
          employee_id: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_out?: string
          date_returned?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          reference: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_out?: string
          date_returned?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discharges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          email: string | null
          employee_id: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          position: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department: string
          email?: string | null
          employee_id?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string
          brand_logo: string | null
          color: string
          created_at: string
          created_by: string | null
          designation: string
          id: string
          image_url: string | null
          length: number
          location: string
          min_quantity: number
          quantity: number
          surface: number
          thickness: number
          type: string
          unit: string
          updated_at: string
          width: number
        }
        Insert: {
          brand?: string
          brand_logo?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          designation: string
          id?: string
          image_url?: string | null
          length?: number
          location?: string
          min_quantity?: number
          quantity?: number
          surface?: number
          thickness?: number
          type: string
          unit?: string
          updated_at?: string
          width?: number
        }
        Update: {
          brand?: string
          brand_logo?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          designation?: string
          id?: string
          image_url?: string | null
          length?: number
          location?: string
          min_quantity?: number
          quantity?: number
          surface?: number
          thickness?: number
          type?: string
          unit?: string
          updated_at?: string
          width?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assigned_project: string | null
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string | null
          id: string
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_project?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_project?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          created_at: string
          created_by: string | null
          current_stock: number
          id: string
          min_threshold: number
          notes: string | null
          product_id: string
          status: string
          suggested_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_stock?: number
          id?: string
          min_threshold?: number
          notes?: string | null
          product_id: string
          status?: string
          suggested_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_stock?: number
          id?: string
          min_threshold?: number
          notes?: string | null
          product_id?: string
          status?: string
          suggested_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          length: number
          notes: string | null
          product_id: string
          quantity: number
          surface: number
          taken_by: string | null
          type: string
          width: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          length?: number
          notes?: string | null
          product_id: string
          quantity: number
          surface?: number
          taken_by?: string | null
          type: string
          width?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          length?: number
          notes?: string | null
          product_id?: string
          quantity?: number
          surface?: number
          taken_by?: string | null
          type?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          product_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          product_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          product_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          image_url: string | null
          is_recommended: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_recommended?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_recommended?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          department: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          reason?: string | null
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "worker" | "magasinier" | "chef_chantier" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "worker", "magasinier", "chef_chantier", "viewer"],
    },
  },
} as const
