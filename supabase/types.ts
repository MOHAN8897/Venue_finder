export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      amenities: {
        Row: {
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      auth_logs: {
        Row: {
          attempt_type: string
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          created_at: string | null
          event_date: string
          event_duration: string | null
          id: string
          payment_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          slot_ids: string[]
          special_requests: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          created_at?: string | null
          event_date: string
          event_duration?: string | null
          id?: string
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          slot_ids: string[]
          special_requests?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          created_at?: string | null
          event_date?: string
          event_duration?: string | null
          id?: string
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          slot_ids?: string[]
          special_requests?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          active: boolean | null
          created_at: string | null
          html_content: string
          id: string
          subject: string
          template_type: string
          text_content: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          html_content: string
          id?: string
          subject: string
          template_type: string
          text_content: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          html_content?: string
          id?: string
          subject?: string
          template_type?: string
          text_content?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_view_log: {
        Row: {
          details: Json | null
          id: number
          page: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          details?: Json | null
          id?: number
          page: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          details?: Json | null
          id?: number
          page?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string
          id: string
          invoice_url: string | null
          metadata: Json | null
          payment_method: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          invoice_url?: string | null
          metadata?: Json | null
          payment_method?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          invoice_url?: string | null
          metadata?: Json | null
          payment_method?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          description: string | null
          email: string
          full_name: string | null
          gender: string | null
          google_id: string | null
          id: string
          name: string
          notification_settings: Json | null
          owner_id: string | null
          owner_verification_date: string | null
          owner_verified: boolean | null
          phone: string | null
          preferences: Json | null
          profile_picture: string | null
          profile_status: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          description?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          google_id?: string | null
          id?: string
          name: string
          notification_settings?: Json | null
          owner_id?: string | null
          owner_verification_date?: string | null
          owner_verified?: boolean | null
          phone?: string | null
          preferences?: Json | null
          profile_picture?: string | null
          profile_status?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          description?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          google_id?: string | null
          id?: string
          name?: string
          notification_settings?: Json | null
          owner_id?: string | null
          owner_verification_date?: string | null
          owner_verified?: boolean | null
          phone?: string | null
          preferences?: Json | null
          profile_picture?: string | null
          profile_status?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          images: string[] | null
          rating: number | null
          updated_at: string | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_credentials: {
        Row: {
          admin_id: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          locked_until: string | null
          login_attempts: number | null
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: number
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: number
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_bookings: {
        Row: {
          booking_date: string
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: string | null
          total_price: number
          updated_at: string | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          booking_date: string
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string | null
          total_price: number
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          booking_date?: string
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          preferences: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          session_id: string
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id?: string
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      venue_amenities: {
        Row: {
          amenity_id: string
          created_at: string | null
          id: string
          venue_id: string
        }
        Insert: {
          amenity_id: string
          created_at?: string | null
          id?: string
          venue_id: string
        }
        Update: {
          amenity_id?: string
          created_at?: string | null
          id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_approval_logs: {
        Row: {
          action: string
          admin_id: string | null
          admin_notes: string | null
          created_at: string | null
          id: string
          reason: string | null
          venue_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          venue_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          venue_id?: string | null
        }
        Relationships: []
      }
      venue_managers: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          manager_id: string | null
          role: string
          status: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          manager_id?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          manager_id?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_managers_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_managers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_media: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          order_index: number
          type: string
          updated_at: string | null
          url: string
          venue_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_index: number
          type: string
          updated_at?: string | null
          url: string
          venue_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number
          type?: string
          updated_at?: string | null
          url?: string
          venue_id?: string
        }
        Relationships: []
      }
      venue_slots: {
        Row: {
          available: boolean | null
          booked_by: string | null
          created_at: string | null
          date: string
          end_time: string
          id: string
          price: number
          start_time: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          available?: boolean | null
          booked_by?: string | null
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          price: number
          start_time: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          available?: boolean | null
          booked_by?: string | null
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          price?: number
          start_time?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_slots_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_unavailability: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          recurrence: string | null
          start_date: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          recurrence?: string | null
          start_date: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          recurrence?: string | null
          start_date?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          approval_date: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          id: string
          name: string
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          submission_date: string | null
          submitted_by: string | null
          type: Database["public"]["Enums"]["venue_type"]
          user_id: string | null
        }
        Insert: {
          approval_date?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          name: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          submission_date?: string | null
          submitted_by?: string | null
          type: Database["public"]["Enums"]["venue_type"]
          user_id?: string | null
        }
        Update: {
          approval_date?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          name?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          submission_date?: string | null
          submitted_by?: string | null
          type?: Database["public"]["Enums"]["venue_type"]
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_venue: {
        Args: { venue_uuid: string; admin_notes?: string }
        Returns: Json
      }
      authenticate_demo_user: {
        Args: { user_email: string; user_password: string }
        Returns: boolean
      }
      authenticate_super_admin: {
        Args: { email_input: string; password_input: string }
        Returns: Json
      }
      check_auth_rate_limit: {
        Args: {
          user_email: string
          attempt_type?: string
          max_attempts?: number
          time_window?: unknown
        }
        Returns: Json
      }
      check_email_exists: {
        Args: { user_email: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          user_email: string
          attempt_type: string
          time_window?: unknown
          max_attempts?: number
        }
        Returns: boolean
      }
      cleanup_auth_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_demo_user: {
        Args: {
          user_email: string
          user_password: string
          user_name: string
          user_role?: Database["public"]["Enums"]["user_role"]
          business_name?: string
        }
        Returns: Json
      }
      create_user_profile: {
        Args: { user_id: string; user_email: string; user_data: Json }
        Returns: Json
      }
      create_user_session: {
        Args: {
          p_user_id: string
          p_session_token: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: string
      }
      generate_password_reset_token: {
        Args: { user_email: string }
        Returns: string
      }
      generate_secure_otp: {
        Args: { user_email: string; otp_type?: string }
        Returns: Json
      }
      get_user_dashboard_data: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_dashboard_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_preferences: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_user_preferences_with_profile: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_user_profile: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: Json
      }
      get_user_profile_simple: {
        Args: { user_uuid: string }
        Returns: Json
      }
      has_completed_preferences: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      log_auth_attempt: {
        Args: {
          user_email: string
          attempt_type: string
          success: boolean
          ip_address?: string
          user_agent?: string
          error_message?: string
        }
        Returns: undefined
      }
      log_page_view: {
        Args: { p_user_id: string; p_page: string; p_details?: Json }
        Returns: undefined
      }
      log_user_activity: {
        Args:
          | { p_user_id: string; p_action: string; p_details?: Json }
          | {
              user_id: string
              activity_type: string
              details?: Json
              ip_address?: string
            }
        Returns: undefined
      }
      reject_venue: {
        Args: {
          venue_uuid: string
          rejection_reason: string
          admin_notes?: string
        }
        Returns: Json
      }
      sanitize_input: {
        Args: { input: string; max_length?: number }
        Returns: string
      }
      save_user_preferences: {
        Args: {
          target_user_id: string
          user_preferences: Json
          is_completed?: boolean
        }
        Returns: Json
      }
      save_venue_amenities: {
        Args: { venue_id: string; amenities: Json }
        Returns: undefined
      }
      save_venue_media: {
        Args: { venue_id: string; media: Json }
        Returns: undefined
      }
      submit_venue: {
        Args: {
          venue_name: string
          venue_type: Database["public"]["Enums"]["venue_type"]
        }
        Returns: string
      }
      update_user_role: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: Json
      }
      user_needs_preferences_form: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: Json
      }
      verify_otp_secure: {
        Args: { user_email: string; input_otp: string }
        Returns: Json
      }
      verify_password_reset_token: {
        Args: { user_email: string; input_token: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      user_role: "user" | "owner" | "admin" | "super_admin"
      venue_status: "pending" | "approved" | "rejected" | "inactive"
      venue_type:
        | "cricket-box"
        | "farmhouse"
        | "banquet-hall"
        | "sports-complex"
        | "party-hall"
        | "conference-room"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      payment_status: ["pending", "paid", "refunded", "failed"],
      user_role: ["user", "owner", "admin", "super_admin"],
      venue_status: ["pending", "approved", "rejected", "inactive"],
      venue_type: [
        "cricket-box",
        "farmhouse",
        "banquet-hall",
        "sports-complex",
        "party-hall",
        "conference-room",
      ],
    },
  },
} as const
