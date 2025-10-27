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
          {
            foreignKeyName: "admin_approvals_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_analytics_summary"
            referencedColumns: ["guide_id"]
          },
        ]
      }
      audio_guides: {
        Row: {
          admin_qr_code_url: string | null
          admin_share_url: string | null
          audio_url: string | null
          best_time: string | null
          category: string
          created_at: string
          creator_id: string
          currency: string
          description: string
          destination_id: string | null
          difficulty: string
          duration: number
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_approved: boolean
          is_featured: boolean
          is_published: boolean
          is_standalone: boolean
          languages: string[]
          location: string
          master_access_code: string | null
          preview_url: string | null
          price_usd: number
          qr_code_url: string | null
          rating: number | null
          sections: Json | null
          share_url: string | null
          slug: string
          title: string
          total_purchases: number | null
          total_reviews: number | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          admin_qr_code_url?: string | null
          admin_share_url?: string | null
          audio_url?: string | null
          best_time?: string | null
          category: string
          created_at?: string
          creator_id: string
          currency?: string
          description: string
          destination_id?: string | null
          difficulty: string
          duration: number
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_approved?: boolean
          is_featured?: boolean
          is_published?: boolean
          is_standalone?: boolean
          languages?: string[]
          location: string
          master_access_code?: string | null
          preview_url?: string | null
          price_usd: number
          qr_code_url?: string | null
          rating?: number | null
          sections?: Json | null
          share_url?: string | null
          slug: string
          title: string
          total_purchases?: number | null
          total_reviews?: number | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          admin_qr_code_url?: string | null
          admin_share_url?: string | null
          audio_url?: string | null
          best_time?: string | null
          category?: string
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string
          destination_id?: string | null
          difficulty?: string
          duration?: number
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_approved?: boolean
          is_featured?: boolean
          is_published?: boolean
          is_standalone?: boolean
          languages?: string[]
          location?: string
          master_access_code?: string | null
          preview_url?: string | null
          price_usd?: number
          qr_code_url?: string | null
          rating?: number | null
          sections?: Json | null
          share_url?: string | null
          slug?: string
          title?: string
          total_purchases?: number | null
          total_reviews?: number | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_guides_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          best_time_to_visit: string | null
          category: string
          city: string
          coordinates: unknown
          country: string
          created_at: string
          cultural_significance: string | null
          description: string | null
          difficulty_level: string
          id: string
          image_url: string | null
          is_approved: boolean
          latitude: number | null
          longitude: number | null
          name: string
          popular_attractions: string[] | null
          suggested_by: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          best_time_to_visit?: string | null
          category?: string
          city: string
          coordinates?: unknown
          country: string
          created_at?: string
          cultural_significance?: string | null
          description?: string | null
          difficulty_level?: string
          id?: string
          image_url?: string | null
          is_approved?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          popular_attractions?: string[] | null
          suggested_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          best_time_to_visit?: string | null
          category?: string
          city?: string
          coordinates?: unknown
          country?: string
          created_at?: string
          cultural_significance?: string | null
          description?: string | null
          difficulty_level?: string
          id?: string
          image_url?: string | null
          is_approved?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          popular_attractions?: string[] | null
          suggested_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: string
          id: string
          is_active: boolean
          name: string
          subject: string
          template_type: string
          text_content: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guest_reviews: {
        Row: {
          comment: string
          created_at: string
          email: string
          guide_id: string
          id: string
          is_approved: boolean
          name: string
          rating: number | null
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          email: string
          guide_id: string
          id?: string
          is_approved?: boolean
          name: string
          rating?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          email?: string
          guide_id?: string
          id?: string
          is_approved?: boolean
          name?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: []
      }
      guide_collections: {
        Row: {
          created_at: string
          id: string
          linked_guides: Json
          main_guide_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_guides?: Json
          main_guide_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_guides?: Json
          main_guide_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_collections_main_guide_id_fkey"
            columns: ["main_guide_id"]
            isOneToOne: true
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_collections_main_guide_id_fkey"
            columns: ["main_guide_id"]
            isOneToOne: true
            referencedRelation: "guide_analytics_summary"
            referencedColumns: ["guide_id"]
          },
        ]
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
          {
            foreignKeyName: "guide_reviews_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_analytics_summary"
            referencedColumns: ["guide_id"]
          },
        ]
      }
      guide_sections: {
        Row: {
          audio_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          guide_id: string
          id: string
          is_original: boolean
          language: string
          language_code: string
          order_index: number
          original_section_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          guide_id: string
          id?: string
          is_original?: boolean
          language?: string
          language_code?: string
          order_index?: number
          original_section_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          guide_id?: string
          id?: string
          is_original?: boolean
          language?: string
          language_code?: string
          order_index?: number
          original_section_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_sections_original_section_id_fkey"
            columns: ["original_section_id"]
            isOneToOne: false
            referencedRelation: "guide_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_stats: {
        Row: {
          created_at: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          stat_description: string
          stat_label: string
          stat_type: string
          stat_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          stat_description: string
          stat_label: string
          stat_type: string
          stat_value: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          stat_description?: string
          stat_label?: string
          stat_type?: string
          stat_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profile_privacy_settings: {
        Row: {
          allow_public_messaging: boolean
          created_at: string
          id: string
          show_certifications: boolean
          show_experience_years: boolean
          show_guide_country: boolean
          show_languages: boolean
          show_license_info: boolean
          show_social_media: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_public_messaging?: boolean
          created_at?: string
          id?: string
          show_certifications?: boolean
          show_experience_years?: boolean
          show_guide_country?: boolean
          show_languages?: boolean
          show_license_info?: boolean
          show_social_media?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_public_messaging?: boolean
          created_at?: string
          id?: string
          show_certifications?: boolean
          show_experience_years?: boolean
          show_guide_country?: boolean
          show_languages?: boolean
          show_license_info?: boolean
          show_social_media?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supported_languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          native_name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          native_name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      trending_locations: {
        Row: {
          coordinates: unknown
          country: string
          created_at: string
          growth_percentage: number | null
          guides_count: number | null
          id: string
          last_updated: string
          name: string
          total_views: number | null
          trending_rank: number | null
        }
        Insert: {
          coordinates?: unknown
          country: string
          created_at?: string
          growth_percentage?: number | null
          guides_count?: number | null
          id?: string
          last_updated?: string
          name: string
          total_views?: number | null
          trending_rank?: number | null
        }
        Update: {
          coordinates?: unknown
          country?: string
          created_at?: string
          growth_percentage?: number | null
          guides_count?: number | null
          id?: string
          last_updated?: string
          name?: string
          total_views?: number | null
          trending_rank?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          description: string | null
          id: string
          metadata: Json | null
          points: number | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points?: number | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points?: number | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          created_at: string
          guide_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guide_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guide_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarks_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_analytics_summary"
            referencedColumns: ["guide_id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          access_code: string
          currency: string
          email_error: string | null
          email_sent: boolean | null
          guest_email: string | null
          guide_id: string
          id: string
          price_paid: number
          purchase_date: string
          stripe_payment_id: string
          user_id: string | null
        }
        Insert: {
          access_code: string
          currency?: string
          email_error?: string | null
          email_sent?: boolean | null
          guest_email?: string | null
          guide_id: string
          id?: string
          price_paid: number
          purchase_date?: string
          stripe_payment_id: string
          user_id?: string | null
        }
        Update: {
          access_code?: string
          currency?: string
          email_error?: string | null
          email_sent?: boolean | null
          guest_email?: string | null
          guide_id?: string
          id?: string
          price_paid?: number
          purchase_date?: string
          stripe_payment_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_analytics_summary"
            referencedColumns: ["guide_id"]
          },
        ]
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
      viral_metrics: {
        Row: {
          completion_rate: number | null
          date: string
          downloads_count: number | null
          guide_id: string
          id: string
          shares_count: number | null
          trending_rank: number | null
          updated_at: string
          views_count: number | null
          viral_score: number | null
        }
        Insert: {
          completion_rate?: number | null
          date?: string
          downloads_count?: number | null
          guide_id: string
          id?: string
          shares_count?: number | null
          trending_rank?: number | null
          updated_at?: string
          views_count?: number | null
          viral_score?: number | null
        }
        Update: {
          completion_rate?: number | null
          date?: string
          downloads_count?: number | null
          guide_id?: string
          id?: string
          shares_count?: number | null
          trending_rank?: number | null
          updated_at?: string
          views_count?: number | null
          viral_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "viral_metrics_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viral_metrics_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_analytics_summary"
            referencedColumns: ["guide_id"]
          },
        ]
      }
      viral_shares: {
        Row: {
          created_at: string
          guide_id: string
          id: string
          location: string | null
          platform: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guide_id: string
          id?: string
          location?: string | null
          platform: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guide_id?: string
          id?: string
          location?: string | null
          platform?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viral_shares_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viral_shares_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_analytics_summary"
            referencedColumns: ["guide_id"]
          },
        ]
      }
    }
    Views: {
      guide_analytics_summary: {
        Row: {
          avg_rating: number | null
          category: string | null
          conversion_rate: number | null
          created_at: string | null
          guide_id: string | null
          is_approved: boolean | null
          is_published: boolean | null
          location: string | null
          max_viral_score: number | null
          title: string | null
          total_purchases: number | null
          total_revenue: number | null
          total_reviews: number | null
          total_shares: number | null
          total_views: number | null
        }
        Relationships: []
      }
      public_guest_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          guide_id: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          rating: number | null
          status: Database["public"]["Enums"]["review_status"] | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          guide_id?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["review_status"] | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          guide_id?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["review_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_creator_verification: {
        Args: { admin_notes_param?: string; request_id: string }
        Returns: boolean
      }
      approve_destination: {
        Args: { admin_notes?: string; destination_id: string }
        Returns: boolean
      }
      audit_verification_operation: {
        Args: {
          p_metadata?: Json
          p_operation: string
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      calculate_guide_duration: {
        Args: { p_guide_id: string }
        Returns: number
      }
      calculate_tier_points: {
        Args: { creator_user_id: string }
        Returns: number
      }
      can_access_verification_document: {
        Args: { p_document_type: string; p_verification_request_id: string }
        Returns: boolean
      }
      can_access_verification_documents: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_profile_access_rate_limit: {
        Args: { accessed_user_id: string }
        Returns: boolean
      }
      cleanup_verification_documents: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_access_code: { Args: never; Returns: string }
      generate_slug: {
        Args: { location_text?: string; title_text: string }
        Returns: string
      }
      get_full_linked_guides_with_access: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: {
          custom_title: string
          guide_id: string
          master_access_code: string
          order_index: number
          sections: Json
          slug: string
          title: string
        }[]
      }
      get_guest_purchase_basic_info: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: {
          access_code: string
          guide_id: string
          purchase_date: string
        }[]
      }
      get_guest_purchase_info: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: {
          access_code: string
          currency: string
          guide_id: string
          id: string
          price_paid: number
          purchase_date: string
        }[]
      }
      get_guide_languages: {
        Args: { p_guide_id: string }
        Returns: {
          language_code: string
          language_name: string
          native_name: string
          section_count: number
        }[]
      }
      get_guide_with_access: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: {
          audio_url: string
          best_time: string
          category: string
          created_at: string
          creator_id: string
          currency: string
          description: string
          difficulty: string
          duration: number
          id: string
          image_url: string
          image_urls: string[]
          is_approved: boolean
          is_published: boolean
          languages: string[]
          location: string
          price_usd: number
          rating: number
          sections: Json
          title: string
          total_reviews: number
          transcript: string
          updated_at: string
        }[]
      }
      get_guide_with_access_v2: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: {
          admin_qr_code_url: string
          admin_share_url: string
          category: string
          created_at: string
          creator_id: string
          currency: string
          description: string
          difficulty: string
          duration: number
          id: string
          image_url: string
          is_approved: boolean
          is_published: boolean
          languages: string[]
          location: string
          master_access_code: string
          price_usd: number
          qr_code_url: string
          rating: number
          sections: Json
          share_url: string
          slug: string
          title: string
          total_reviews: number
          updated_at: string
        }[]
      }
      get_linked_guide_sections_with_access:
        | {
            Args: {
              p_access_code: string
              p_language_code?: string
              p_linked_guide_id: string
              p_main_guide_id: string
            }
            Returns: {
              audio_url: string
              created_at: string
              description: string
              duration_seconds: number
              guide_id: string
              id: string
              is_original: boolean
              language: string
              language_code: string
              order_index: number
              original_section_id: string
              title: string
              updated_at: string
            }[]
          }
        | {
            Args: {
              p_access_code: string
              p_language_code?: string
              p_main_guide_id: string
              p_target_guide_id: string
            }
            Returns: {
              audio_url: string
              created_at: string
              description: string
              duration_seconds: number
              guide_id: string
              id: string
              is_original: boolean
              language: string
              language_code: string
              order_index: number
              original_section_id: string
              title: string
              updated_at: string
            }[]
          }
      get_linked_guides_with_access: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: {
          custom_title: string
          guide_id: string
          master_access_code: string
          order_index: number
          slug: string
          title: string
        }[]
      }
      get_masked_guest_email: {
        Args: { p_guest_email: string; p_user_id: string }
        Returns: string
      }
      get_masked_verification_request: {
        Args: { request_id: string }
        Returns: {
          admin_notes: string
          creator_type: string
          experience_description: string
          full_name: string
          id: string
          id_document_url: string
          id_number: string
          license_document_url: string
          license_number: string
          portfolio_url: string
          reviewed_at: string
          social_media_links: Json
          status: string
          submitted_at: string
          user_id: string
          verification_level: string
        }[]
      }
      get_safe_creator_profile: {
        Args: { creator_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          experience_years: number
          full_name: string
          guide_country: string
          languages_spoken: string[]
          social_profiles: Json
          specialties: string[]
          user_id: string
          verification_status: string
        }[]
      }
      get_safe_verification_request: {
        Args: { request_id: string }
        Returns: {
          admin_notes: string
          created_at: string
          creator_type: string
          document_status: string
          experience_description: string
          full_name: string
          id: string
          id_document_url: string
          id_number: string
          license_document_url: string
          license_number: string
          portfolio_url: string
          reviewed_at: string
          reviewed_by: string
          social_media_links: Json
          social_verification_data: Json
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
          verification_level: string
        }[]
      }
      get_sections_with_access: {
        Args: {
          p_access_code: string
          p_guide_id: string
          p_language_code?: string
        }
        Returns: {
          audio_url: string
          created_at: string
          description: string
          duration_seconds: number
          guide_id: string
          id: string
          is_original: boolean
          language: string
          language_code: string
          order_index: number
          original_section_id: string
          title: string
          updated_at: string
        }[]
      }
      get_user_verification_request_safely: {
        Args: { request_id: string }
        Returns: {
          full_name: string
          id: string
          id_document_url: string
          id_number: string
          license_document_url: string
          license_number: string
          reviewed_at: string
          status: string
          submitted_at: string
          user_id: string
        }[]
      }
      get_verification_document_url: {
        Args: { p_document_path: string; p_expires_in?: number }
        Returns: string
      }
      get_verification_document_urls: {
        Args: { p_request_id: string }
        Returns: {
          id_document_url: string
          id_number: string
          license_document_url: string
          license_number: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_verification_document_access: {
        Args: { p_document_type?: string; p_verification_request_id: string }
        Returns: boolean
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      log_purchase_access_attempt: {
        Args: { p_access_code: string; p_guide_id: string; p_success: boolean }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_error_message?: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_success?: boolean
          p_user_id: string
        }
        Returns: undefined
      }
      mask_verification_data: {
        Args: { p_data: string; p_field_name: string; p_user_id: string }
        Returns: string
      }
      mask_verification_sensitive_data: {
        Args: {
          p_id_document_url: string
          p_id_number: string
          p_license_document_url: string
          p_license_number: string
          p_user_id: string
        }
        Returns: Json
      }
      refresh_analytics_summary: { Args: never; Returns: undefined }
      reject_creator_verification: {
        Args: {
          admin_notes_param?: string
          rejection_reason_param: string
          request_id: string
        }
        Returns: boolean
      }
      secure_delete_verification_documents: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      secure_verification_document_access: {
        Args: { p_document_path: string; p_operation?: string }
        Returns: boolean
      }
      track_guide_view: { Args: { p_guide_id: string }; Returns: undefined }
      track_viral_share: {
        Args: { p_guide_id: string; p_location?: string; p_platform: string }
        Returns: undefined
      }
      update_creator_tier: {
        Args: { creator_user_id: string }
        Returns: string
      }
      validate_verification_document_access: {
        Args: { p_document_path: string }
        Returns: boolean
      }
      verify_access_code_secure: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: boolean
      }
      verify_guest_purchase_access: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: boolean
      }
      verify_master_access_code: {
        Args: { p_access_code: string; p_guide_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "content_creator" | "traveler"
      creator_type: "local_guide" | "influencer" | "hybrid"
      document_status: "pending" | "approved" | "rejected" | "incomplete"
      review_status: "pending" | "approved" | "rejected"
      user_role: "traveler" | "admin" | "content_creator"
      verification_level: "basic" | "premium" | "expert"
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
      app_role: ["admin", "content_creator", "traveler"],
      creator_type: ["local_guide", "influencer", "hybrid"],
      document_status: ["pending", "approved", "rejected", "incomplete"],
      review_status: ["pending", "approved", "rejected"],
      user_role: ["traveler", "admin", "content_creator"],
      verification_level: ["basic", "premium", "expert"],
    },
  },
} as const
