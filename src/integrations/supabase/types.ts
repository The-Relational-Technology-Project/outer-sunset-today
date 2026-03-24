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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      best_blue_days: {
        Row: {
          blue_date: string
          created_at: string
          id: string
        }
        Insert: {
          blue_date: string
          created_at?: string
          id?: string
        }
        Update: {
          blue_date?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          submission_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          submission_type?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          submission_type?: string
        }
        Relationships: []
      }
      custom_update_subscriptions: {
        Row: {
          created_at: string
          custom_update_id: string
          email: string | null
          id: string
          is_creator: boolean
          messaging_opt_in: boolean
          phone: string | null
          preferred_channel: string
        }
        Insert: {
          created_at?: string
          custom_update_id: string
          email?: string | null
          id?: string
          is_creator?: boolean
          messaging_opt_in?: boolean
          phone?: string | null
          preferred_channel?: string
        }
        Update: {
          created_at?: string
          custom_update_id?: string
          email?: string | null
          id?: string
          is_creator?: boolean
          messaging_opt_in?: boolean
          phone?: string | null
          preferred_channel?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_update_subscriptions_custom_update_id_fkey"
            columns: ["custom_update_id"]
            isOneToOne: false
            referencedRelation: "custom_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_updates: {
        Row: {
          created_at: string
          description: string
          id: string
          is_public: boolean
          subscriber_count: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_public?: boolean
          subscriber_count?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          subscriber_count?: number
        }
        Relationships: []
      }
      daily_menus: {
        Row: {
          category: string
          created_at: string
          hours: string
          id: string
          location: string
          menu_date: string
          price: string | null
          restaurant: string
          special_item: string
        }
        Insert: {
          category: string
          created_at?: string
          hours: string
          id?: string
          location: string
          menu_date: string
          price?: string | null
          restaurant: string
          special_item: string
        }
        Update: {
          category?: string
          created_at?: string
          hours?: string
          id?: string
          location?: string
          menu_date?: string
          price?: string | null
          restaurant?: string
          special_item?: string
        }
        Relationships: []
      }
      event_submissions: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          submitter_email: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          submitter_email: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          submitter_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          location: string
          start_time: string
          status: string
          title: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type: string
          id?: string
          location: string
          start_time: string
          status?: string
          title: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string
          start_time?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      flyer_submissions: {
        Row: {
          archived: boolean
          created_at: string
          event_id: string | null
          id: string
          processed: boolean
          processing_notes: string | null
          storage_path: string
          submitter_email: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          event_id?: string | null
          id?: string
          processed?: boolean
          processing_notes?: string | null
          storage_path: string
          submitter_email?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          event_id?: string | null
          id?: string
          processed?: boolean
          processing_notes?: string | null
          storage_path?: string
          submitter_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flyer_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          article_hash: string
          category: string | null
          created_at: string
          helpful_count: number
          id: string
          is_actionable: boolean | null
          not_helpful_count: number
          published_at: string | null
          relevance_score: number | null
          source_name: string
          source_url: string
          summary: string | null
          title: string
        }
        Insert: {
          article_hash: string
          category?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_actionable?: boolean | null
          not_helpful_count?: number
          published_at?: string | null
          relevance_score?: number | null
          source_name: string
          source_url: string
          summary?: string | null
          title: string
        }
        Update: {
          article_hash?: string
          category?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_actionable?: boolean | null
          not_helpful_count?: number
          published_at?: string | null
          relevance_score?: number | null
          source_name?: string
          source_url?: string
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          status: string
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          status?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          status?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      surf_counts: {
        Row: {
          count: number
          created_at: string
          id: string
          surf_date: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          surf_date?: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          surf_date?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_news_feedback: {
        Args: { feedback_type: string; item_id: string }
        Returns: undefined
      }
      increment_surf_count: { Args: never; Returns: number }
      increment_update_subscriber_count: {
        Args: { update_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
