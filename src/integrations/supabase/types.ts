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
      admin_users: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_label: string | null
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_label?: string | null
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_label?: string | null
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          bot_token: string | null
          bot_username: string | null
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          bot_token?: string | null
          bot_username?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          bot_token?: string | null
          bot_username?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      number_requests: {
        Row: {
          approved_at: string | null
          balance_credited: boolean | null
          code_sent_at: string | null
          created_at: string
          id: string
          phone_number: string
          rejection_reason: string | null
          service_name: string | null
          status: string
          telegram_user_id: string
          telegram_username: string | null
          updated_at: string
          verification_code: string | null
        }
        Insert: {
          approved_at?: string | null
          balance_credited?: boolean | null
          code_sent_at?: string | null
          created_at?: string
          id?: string
          phone_number: string
          rejection_reason?: string | null
          service_name?: string | null
          status?: string
          telegram_user_id: string
          telegram_username?: string | null
          updated_at?: string
          verification_code?: string | null
        }
        Update: {
          approved_at?: string | null
          balance_credited?: boolean | null
          code_sent_at?: string | null
          created_at?: string
          id?: string
          phone_number?: string
          rejection_reason?: string | null
          service_name?: string | null
          status?: string
          telegram_user_id?: string
          telegram_username?: string | null
          updated_at?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_paid: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          referred_telegram_id: string
          referrer_telegram_id: string
        }
        Insert: {
          commission_paid?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          referred_telegram_id: string
          referrer_telegram_id: string
        }
        Update: {
          commission_paid?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          referred_telegram_id?: string
          referrer_telegram_id?: string
        }
        Relationships: []
      }
      support_channels: {
        Row: {
          channel_name: string
          channel_type: string
          channel_url: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          channel_name: string
          channel_type?: string
          channel_url: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          channel_name?: string
          channel_type?: string
          channel_url?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_channels: {
        Row: {
          channel_name: string
          channel_url: string
          channel_username: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          channel_name: string
          channel_url: string
          channel_username?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          channel_name?: string
          channel_url?: string
          channel_username?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          referral_code: string | null
          referred_by: string | null
          successful_numbers: number
          telegram_user_id: string
          telegram_username: string | null
          total_earned: number
          updated_at: string
          welcome_bonus_claimed: boolean | null
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          successful_numbers?: number
          telegram_user_id: string
          telegram_username?: string | null
          total_earned?: number
          updated_at?: string
          welcome_bonus_claimed?: boolean | null
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          successful_numbers?: number
          telegram_user_id?: string
          telegram_username?: string | null
          total_earned?: number
          updated_at?: string
          welcome_bonus_claimed?: boolean | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_number: string
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          payment_method: string
          processed_at: string | null
          status: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          account_number: string
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method: string
          processed_at?: string | null
          status?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          account_number?: string
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          processed_at?: string | null
          status?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_24hour_active_numbers: { Args: never; Returns: undefined }
      get_leaderboard: {
        Args: never
        Returns: {
          id: string
          rank: number
          telegram_user_id: string
          telegram_username: string
          total_earned: number
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
