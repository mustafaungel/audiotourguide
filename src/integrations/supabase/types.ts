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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_approvals: {
        Row: {
          admin_id: string
          feedback: string | null
          guide_id: string
          id: string
          reviewed_at: string
          status: string
        }
        Insert: {
          admin_id: string
          feedback?: string | null
          guide_id: string
          id?: string
          reviewed_at?: string
          status: string
        }
        Update: {
          admin_id?: string
          feedback?: string | null
          guide_id?: string
          id?: string
          reviewed_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_approvals_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_guides: {
        Row: {
          audio_url: string | null
          best_time: string | null
          category: string
          created_at: string
          creator_id: string
          currency: string
          description: string
          difficulty: string
          duration: number
          id: string
          image_url: string | null
          is_approved: boolean
          is_published: boolean
          languages: string[]
          location: string
          preview_url: string | null
          price_usd: number
          rating: number | null
          title: string
          total_purchases: number | null
          total_reviews: number | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          best_time?: string | null
          category: string
          created_at?: string
          creator_id: string
          currency?: string
          description: string
          difficulty: string
          duration: number
          id?: string
          image_url?: string | null
          is_approved?: boolean
          is_published?: boolean
          languages?: string[]
          location: string
          preview_url?: string | null
          price_usd: number
          rating?: number | null
          title: string
          total_purchases?: number | null
          total_reviews?: number | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          best_time?: string | null
          category?: string
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string
          difficulty?: string
          duration?: number
          id?: string
          image_url?: string | null
          is_approved?: boolean
          is_published?: boolean
          languages?: string[]
          location?: string
          preview_url?: string | null
          price_usd?: number
          rating?: number | null
          title?: string
          total_purchases?: number | null
          total_reviews?: number | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guide_reviews: {
        Row: {
          comment: string | null
          created_at: string
          guide_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          guide_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          guide_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_reviews_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          creator_badge: boolean | null
          email: string
          experience_years: number | null
          full_name: string | null
          id: string
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_profiles: Json | null
          specialties: string[] | null
          updated_at: string
          user_id: string
          verification_documents: Json | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          creator_badge?: boolean | null
          email: string
          experience_years?: number | null
          full_name?: string | null
          id?: string
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_profiles?: Json | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          verification_documents?: Json | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          creator_badge?: boolean | null
          email?: string
          experience_years?: number | null
          full_name?: string | null
          id?: string
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_profiles?: Json | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          verification_documents?: Json | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          access_code: string
          currency: string
          guide_id: string
          id: string
          price_paid: number
          purchase_date: string
          stripe_payment_id: string
          user_id: string
        }
        Insert: {
          access_code: string
          currency?: string
          guide_id: string
          id?: string
          price_paid: number
          purchase_date?: string
          stripe_payment_id: string
          user_id: string
        }
        Update: {
          access_code?: string
          currency?: string
          guide_id?: string
          id?: string
          price_paid?: number
          purchase_date?: string
          stripe_payment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          experience_description: string | null
          full_name: string
          id: string
          id_document_url: string | null
          portfolio_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_media_links: Json | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          experience_description?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_links?: Json | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          experience_description?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_links?: Json | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_creator_verification: {
        Args: { admin_notes_param?: string; request_id: string }
        Returns: boolean
      }
      generate_access_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      reject_creator_verification: {
        Args: {
          admin_notes_param?: string
          rejection_reason_param: string
          request_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "traveler" | "admin" | "content_creator"
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
      user_role: ["traveler", "admin", "content_creator"],
    },
  },
} as const
