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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          total_consumed: number
          total_target: number
          user_profile_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          total_consumed?: number
          total_target: number
          user_profile_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_consumed?: number
          total_target?: number
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_entries: {
        Row: {
          calories: number
          daily_log_id: string
          food_name: string
          id: string
          scanned_at: string
        }
        Insert: {
          calories: number
          daily_log_id: string
          food_name: string
          id?: string
          scanned_at?: string
        }
        Update: {
          calories?: number
          daily_log_id?: string
          food_name?: string
          id?: string
          scanned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_entries_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          age: number
          biological_sex: Database["public"]["Enums"]["biological_sex"]
          created_at: string
          daily_calorie_target: number
          goal: Database["public"]["Enums"]["weight_goal"]
          height: number
          id: string
          name: string | null
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          age: number
          biological_sex: Database["public"]["Enums"]["biological_sex"]
          created_at?: string
          daily_calorie_target: number
          goal: Database["public"]["Enums"]["weight_goal"]
          height: number
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
          weight: number
        }
        Update: {
          age?: number
          biological_sex?: Database["public"]["Enums"]["biological_sex"]
          created_at?: string
          daily_calorie_target?: number
          goal?: Database["public"]["Enums"]["weight_goal"]
          height?: number
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_food_entry: {
        Args: {
          p_calories: number
          p_date: string
          p_food_name: string
          p_target: number
        }
        Returns: {
          calories: number
          daily_log_id: string
          food_name: string
          id: string
          scanned_at: string
        }
        SetofOptions: {
          from: "*"
          to: "food_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_food_entry: { Args: { p_entry_id: string }; Returns: undefined }
      get_or_create_log: {
        Args: { p_date: string; p_target: number }
        Returns: {
          created_at: string
          date: string
          id: string
          total_consumed: number
          total_target: number
          user_profile_id: string
        }
        SetofOptions: {
          from: "*"
          to: "daily_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      biological_sex: "MALE" | "FEMALE"
      weight_goal: "LOSE" | "MAINTAIN" | "GAIN"
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
      biological_sex: ["MALE", "FEMALE"],
      weight_goal: ["LOSE", "MAINTAIN", "GAIN"],
    },
  },
} as const
