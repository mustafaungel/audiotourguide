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
          destination_id: string | null
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
          qr_code_url: string | null
          rating: number | null
          sections: Json | null
          share_url: string | null
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
          destination_id?: string | null
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
          qr_code_url?: string | null
          rating?: number | null
          sections?: Json | null
          share_url?: string | null
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
          destination_id?: string | null
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
          qr_code_url?: string | null
          rating?: number | null
          sections?: Json | null
          share_url?: string | null
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
      creator_availability: {
        Row: {
          created_at: string
          creator_id: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          max_bookings_per_slot: number
          slot_duration_minutes: number
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          max_bookings_per_slot?: number
          slot_duration_minutes?: number
          start_time: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          max_bookings_per_slot?: number
          slot_duration_minutes?: number
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_connections: {
        Row: {
          connected_at: string
          connection_source: string
          creator_id: string
          guide_id: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          connected_at?: string
          connection_source?: string
          creator_id: string
          guide_id?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          connected_at?: string
          connection_source?: string
          creator_id?: string
          guide_id?: string | null
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          currency: string
          earning_type: string
          guide_id: string
          id: string
          processed_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          currency?: string
          earning_type: string
          guide_id: string
          id?: string
          processed_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          currency?: string
          earning_type?: string
          guide_id?: string
          id?: string
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "audio_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_messages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message_text: string
          message_type: string
          read_at: string | null
          recipient_id: string
          related_guide_id: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_text: string
          message_type?: string
          read_at?: string | null
          recipient_id: string
          related_guide_id?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_text?: string
          message_type?: string
          read_at?: string | null
          recipient_id?: string
          related_guide_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      creator_platform_ratings: {
        Row: {
          created_at: string
          creator_id: string
          evidence_data: Json | null
          id: string
          rated_by: string
          rating: number
          rating_category: string
          rating_notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          evidence_data?: Json | null
          id?: string
          rated_by: string
          rating: number
          rating_category: string
          rating_notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          evidence_data?: Json | null
          id?: string
          rated_by?: string
          rating?: number
          rating_category?: string
          rating_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_service_ratings: {
        Row: {
          created_at: string
          creator_id: string
          experience_id: string | null
          guide_id: string | null
          id: string
          is_verified_purchase: boolean
          rating: number
          review_text: string | null
          service_category: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          experience_id?: string | null
          guide_id?: string | null
          id?: string
          is_verified_purchase?: boolean
          rating: number
          review_text?: string | null
          service_category?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          experience_id?: string | null
          guide_id?: string | null
          id?: string
          is_verified_purchase?: boolean
          rating?: number
          review_text?: string | null
          service_category?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_stories: {
        Row: {
          background_color: string | null
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string
          creator_id: string
          duration_seconds: number | null
          expires_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          creator_id: string
          duration_seconds?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          creator_id?: string
          duration_seconds?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_tiers: {
        Row: {
          benefits: Json | null
          created_at: string
          id: string
          required_points: number
          tier_color: string
          tier_description: string | null
          tier_level: number
          tier_name: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string
          id?: string
          required_points: number
          tier_color?: string
          tier_description?: string | null
          tier_level: number
          tier_name: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string
          id?: string
          required_points?: number
          tier_color?: string
          tier_description?: string | null
          tier_level?: number
          tier_name?: string
        }
        Relationships: []
      }
      creator_updates: {
        Row: {
          content: string
          created_at: string
          creator_id: string
          id: string
          image_url: string | null
          is_pinned: boolean | null
          metadata: Json | null
          related_experience_id: string | null
          related_guide_id: string | null
          title: string | null
          update_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          creator_id: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          metadata?: Json | null
          related_experience_id?: string | null
          related_guide_id?: string | null
          title?: string | null
          update_type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          creator_id?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          metadata?: Json | null
          related_experience_id?: string | null
          related_guide_id?: string | null
          title?: string | null
          update_type?: string
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
          coordinates: unknown | null
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
          coordinates?: unknown | null
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
          coordinates?: unknown | null
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
      experience_bookings: {
        Row: {
          booking_date: string
          booking_notes: string | null
          created_at: string
          creator_id: string
          currency: string
          experience_id: string
          id: string
          meeting_link: string | null
          participants_count: number
          payment_status: string
          scheduled_for: string
          special_requests: string | null
          status: string
          stripe_payment_id: string | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_notes?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          experience_id: string
          id?: string
          meeting_link?: string | null
          participants_count?: number
          payment_status?: string
          scheduled_for: string
          special_requests?: string | null
          status?: string
          stripe_payment_id?: string | null
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_notes?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          experience_id?: string
          id?: string
          meeting_link?: string | null
          participants_count?: number
          payment_status?: string
          scheduled_for?: string
          special_requests?: string | null
          status?: string
          stripe_payment_id?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string
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
      guide_sections: {
        Row: {
          audio_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          guide_id: string
          id: string
          language: string
          order_index: number
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
          language?: string
          order_index?: number
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
          language?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_experiences: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          currency: string
          description: string
          difficulty_level: string
          duration_minutes: number
          experience_type: string
          id: string
          image_url: string | null
          included_items: string | null
          is_active: boolean
          language: string
          location: string | null
          max_participants: number
          price_usd: number
          requirements: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          creator_id: string
          currency?: string
          description: string
          difficulty_level?: string
          duration_minutes: number
          experience_type?: string
          id?: string
          image_url?: string | null
          included_items?: string | null
          is_active?: boolean
          language?: string
          location?: string | null
          max_participants?: number
          price_usd: number
          requirements?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string
          difficulty_level?: string
          duration_minutes?: number
          experience_type?: string
          id?: string
          image_url?: string | null
          included_items?: string | null
          is_active?: boolean
          language?: string
          location?: string | null
          max_participants?: number
          price_usd?: number
          requirements?: string | null
          title?: string
          updated_at?: string
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
          bio: string | null
          blue_tick_verified: boolean | null
          certifications: Json | null
          combined_rating: number | null
          created_at: string
          creator_badge: boolean | null
          creator_type: string | null
          current_tier: string | null
          email: string
          experience_years: number | null
          full_name: string | null
          guide_country: string | null
          id: string
          languages_spoken: string[] | null
          license_country: string | null
          license_type: string | null
          local_guide_verified: boolean | null
          platform_rating: number | null
          platform_rating_count: number | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          service_rating: number | null
          service_rating_count: number | null
          social_profiles: Json | null
          specialties: string[] | null
          tier_points: number | null
          tier_updated_at: string | null
          updated_at: string
          user_id: string
          verification_badge_type: string | null
          verification_documents: Json | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blue_tick_verified?: boolean | null
          certifications?: Json | null
          combined_rating?: number | null
          created_at?: string
          creator_badge?: boolean | null
          creator_type?: string | null
          current_tier?: string | null
          email: string
          experience_years?: number | null
          full_name?: string | null
          guide_country?: string | null
          id?: string
          languages_spoken?: string[] | null
          license_country?: string | null
          license_type?: string | null
          local_guide_verified?: boolean | null
          platform_rating?: number | null
          platform_rating_count?: number | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          service_rating?: number | null
          service_rating_count?: number | null
          social_profiles?: Json | null
          specialties?: string[] | null
          tier_points?: number | null
          tier_updated_at?: string | null
          updated_at?: string
          user_id: string
          verification_badge_type?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blue_tick_verified?: boolean | null
          certifications?: Json | null
          combined_rating?: number | null
          created_at?: string
          creator_badge?: boolean | null
          creator_type?: string | null
          current_tier?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string | null
          guide_country?: string | null
          id?: string
          languages_spoken?: string[] | null
          license_country?: string | null
          license_type?: string | null
          local_guide_verified?: boolean | null
          platform_rating?: number | null
          platform_rating_count?: number | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          service_rating?: number | null
          service_rating_count?: number | null
          social_profiles?: Json | null
          specialties?: string[] | null
          tier_points?: number | null
          tier_updated_at?: string | null
          updated_at?: string
          user_id?: string
          verification_badge_type?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      story_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          story_id?: string
          user_id?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      tier_history: {
        Row: {
          created_at: string
          id: string
          new_tier: string
          points_earned: number | null
          previous_tier: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_tier: string
          points_earned?: number | null
          previous_tier?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_tier?: string
          points_earned?: number | null
          previous_tier?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trending_locations: {
        Row: {
          coordinates: unknown | null
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
          coordinates?: unknown | null
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
          coordinates?: unknown | null
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
        ]
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
          creator_type: Database["public"]["Enums"]["creator_type"] | null
          document_status: Database["public"]["Enums"]["document_status"] | null
          experience_description: string | null
          full_name: string
          id: string
          id_document_url: string | null
          id_number: string | null
          license_document_url: string | null
          license_number: string | null
          portfolio_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_media_links: Json | null
          social_verification_data: Json | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
          verification_level:
            | Database["public"]["Enums"]["verification_level"]
            | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
          document_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          experience_description?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          license_document_url?: string | null
          license_number?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_links?: Json | null
          social_verification_data?: Json | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
          verification_level?:
            | Database["public"]["Enums"]["verification_level"]
            | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          creator_type?: Database["public"]["Enums"]["creator_type"] | null
          document_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          experience_description?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          license_document_url?: string | null
          license_number?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_links?: Json | null
          social_verification_data?: Json | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
          verification_level?:
            | Database["public"]["Enums"]["verification_level"]
            | null
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
      approve_destination: {
        Args: { admin_notes?: string; destination_id: string }
        Returns: boolean
      }
      calculate_tier_points: {
        Args: { creator_user_id: string }
        Returns: number
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
      track_guide_view: {
        Args: { p_guide_id: string }
        Returns: undefined
      }
      track_viral_share: {
        Args: { p_guide_id: string; p_location?: string; p_platform: string }
        Returns: undefined
      }
      update_creator_tier: {
        Args: { creator_user_id: string }
        Returns: string
      }
    }
    Enums: {
      creator_type: "local_guide" | "influencer" | "hybrid"
      document_status: "pending" | "approved" | "rejected" | "incomplete"
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
      creator_type: ["local_guide", "influencer", "hybrid"],
      document_status: ["pending", "approved", "rejected", "incomplete"],
      user_role: ["traveler", "admin", "content_creator"],
      verification_level: ["basic", "premium", "expert"],
    },
  },
} as const
