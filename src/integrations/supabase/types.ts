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
      app_settings: {
        Row: {
          commission_amount: number
          commission_currency: string
          commission_on_no_show: boolean
          id: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_currency?: string
          commission_on_no_show?: boolean
          id?: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_currency?: string
          commission_on_no_show?: boolean
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      campaign_packages: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          days: number
          id: string
          name: string
          price: number
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          days: number
          id?: string
          name: string
          price: number
          type: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          days?: number
          id?: string
          name?: string
          price?: number
          type?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          days: number
          ends_at: string | null
          id: string
          offer_id: string | null
          package_id: string | null
          price: number
          restaurant_id: number
          starts_at: string | null
          status: string
          target_city: string | null
          target_cuisine: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          days: number
          ends_at?: string | null
          id?: string
          offer_id?: string | null
          package_id?: string | null
          price: number
          restaurant_id: number
          starts_at?: string | null
          status?: string
          target_city?: string | null
          target_cuisine?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          days?: number
          ends_at?: string | null
          id?: string
          offer_id?: string | null
          package_id?: string | null
          price?: number
          restaurant_id?: number
          starts_at?: string | null
          status?: string
          target_city?: string | null
          target_cuisine?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "campaign_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          reservation_id: string
          restaurant_id: number
          status: string
          voided_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          reservation_id: string
          restaurant_id: number
          status?: string
          voided_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          reservation_id?: string
          restaurant_id?: number
          status?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_attempts: {
        Row: {
          code: string | null
          created_at: string
          id: number
          ok: boolean
          user_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: never
          ok: boolean
          user_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: never
          ok?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          bill_amount: number | null
          code: string
          expires_at: string
          id: string
          issued_at: string
          offer_id: string
          reservation_id: string | null
          restaurant_id: number
          status: string
          used_at: string | null
          user_id: string
          validated_by: string | null
        }
        Insert: {
          bill_amount?: number | null
          code: string
          expires_at: string
          id?: string
          issued_at?: string
          offer_id: string
          reservation_id?: string | null
          restaurant_id: number
          status?: string
          used_at?: string | null
          user_id: string
          validated_by?: string | null
        }
        Update: {
          bill_amount?: number | null
          code?: string
          expires_at?: string
          id?: string
          issued_at?: string
          offer_id?: string
          reservation_id?: string | null
          restaurant_id?: number
          status?: string
          used_at?: string | null
          user_id?: string
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          claims_count: number
          combinable: boolean
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          discount_type: string
          discount_value: number
          ends_on: string
          excluded_items: string | null
          exclusive: boolean
          id: string
          included_items: string | null
          max_uses: number | null
          max_uses_per_user: number
          min_bill: number | null
          min_people: number | null
          requires_reservation: boolean
          restaurant_id: number
          starts_on: string
          status: string
          terms: string | null
          time_from: string | null
          time_to: string | null
          title: string
          updated_at: string
          uses_count: number
          valid_days: number[]
        }
        Insert: {
          claims_count?: number
          combinable?: boolean
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          discount_type: string
          discount_value: number
          ends_on: string
          excluded_items?: string | null
          exclusive?: boolean
          id?: string
          included_items?: string | null
          max_uses?: number | null
          max_uses_per_user?: number
          min_bill?: number | null
          min_people?: number | null
          requires_reservation?: boolean
          restaurant_id: number
          starts_on?: string
          status?: string
          terms?: string | null
          time_from?: string | null
          time_to?: string | null
          title: string
          updated_at?: string
          uses_count?: number
          valid_days?: number[]
        }
        Update: {
          claims_count?: number
          combinable?: boolean
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_on?: string
          excluded_items?: string | null
          exclusive?: boolean
          id?: string
          included_items?: string | null
          max_uses?: number | null
          max_uses_per_user?: number
          min_bill?: number | null
          min_people?: number | null
          requires_reservation?: boolean
          restaurant_id?: number
          starts_on?: string
          status?: string
          terms?: string | null
          time_from?: string | null
          time_to?: string | null
          title?: string
          updated_at?: string
          uses_count?: number
          valid_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "offers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          kind: string
          paid_at: string | null
          provider: string | null
          provider_ref: string | null
          restaurant_id: number
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind: string
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          restaurant_id: number
          status?: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind?: string
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          restaurant_id?: number
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: number
          restaurant_id: number
          viewed_at: string
        }
        Insert: {
          id?: never
          restaurant_id: number
          viewed_at?: string
        }
        Update: {
          id?: never
          restaurant_id?: number
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          coupon_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          people: number
          phone: string
          reserved_date: string
          reserved_time: string
          restaurant_id: number
          status: string
          status_changed_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          people: number
          phone: string
          reserved_date: string
          reserved_time: string
          restaurant_id: number
          status?: string
          status_changed_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          people?: number
          phone?: string
          reserved_date?: string
          reserved_time?: string
          restaurant_id?: number
          status?: string
          status_changed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_coupon_fk"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_owners: {
        Row: {
          contact_name: string | null
          created_at: string
          id: string
          message: string | null
          phone: string | null
          restaurant_id: number
          status: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          id?: string
          message?: string | null
          phone?: string | null
          restaurant_id: number
          status?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          id?: string
          message?: string | null
          phone?: string | null
          restaurant_id?: number
          status?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_owners_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          booking: Json
          city: string
          created_at: string
          cuisine: string
          cuisine_label: string | null
          data_source: string | null
          description: string | null
          dishes: string[]
          distance: string | null
          facilities: string[]
          google_checked_at: string | null
          google_cover_url: string | null
          google_match_note: string | null
          google_photos: Json
          google_place_id: string | null
          google_reviews: Json | null
          google_reviews_at: string | null
          hours: string | null
          id: number
          image: string | null
          instagram: string | null
          latitude: number | null
          longitude: number | null
          menu: Json
          mood: string | null
          name: string
          open_until: string | null
          osm_id: number | null
          osm_type: string | null
          phone: string | null
          photos: string[]
          price: string
          rating: number
          review_count: number | null
          source_url: string | null
          status: string
          submitted_at: string
          tags: string[]
          website: string | null
        }
        Insert: {
          address?: string | null
          booking?: Json
          city: string
          created_at?: string
          cuisine: string
          cuisine_label?: string | null
          data_source?: string | null
          description?: string | null
          dishes?: string[]
          distance?: string | null
          facilities?: string[]
          google_checked_at?: string | null
          google_cover_url?: string | null
          google_match_note?: string | null
          google_photos?: Json
          google_place_id?: string | null
          google_reviews?: Json | null
          google_reviews_at?: string | null
          hours?: string | null
          id?: never
          image?: string | null
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          menu?: Json
          mood?: string | null
          name: string
          open_until?: string | null
          osm_id?: number | null
          osm_type?: string | null
          phone?: string | null
          photos?: string[]
          price?: string
          rating?: number
          review_count?: number | null
          source_url?: string | null
          status?: string
          submitted_at?: string
          tags?: string[]
          website?: string | null
        }
        Update: {
          address?: string | null
          booking?: Json
          city?: string
          created_at?: string
          cuisine?: string
          cuisine_label?: string | null
          data_source?: string | null
          description?: string | null
          dishes?: string[]
          distance?: string | null
          facilities?: string[]
          google_checked_at?: string | null
          google_cover_url?: string | null
          google_match_note?: string | null
          google_photos?: Json
          google_place_id?: string | null
          google_reviews?: Json | null
          google_reviews_at?: string | null
          hours?: string | null
          id?: never
          image?: string | null
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          menu?: Json
          mood?: string | null
          name?: string
          open_until?: string | null
          osm_id?: number | null
          osm_type?: string | null
          phone?: string | null
          photos?: string[]
          price?: string
          rating?: number
          review_count?: number | null
          source_url?: string | null
          status?: string
          submitted_at?: string
          tags?: string[]
          website?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean
          can_publish_offers: boolean
          code: string
          currency: string
          detailed_reports: boolean
          features: string[]
          has_badge: boolean
          has_stats: boolean
          homepage_feature: boolean
          name: string
          price: number
          priority_ranking: boolean
          priority_support: boolean
          sort: number
        }
        Insert: {
          active?: boolean
          can_publish_offers?: boolean
          code: string
          currency?: string
          detailed_reports?: boolean
          features?: string[]
          has_badge?: boolean
          has_stats?: boolean
          homepage_feature?: boolean
          name: string
          price?: number
          priority_ranking?: boolean
          priority_support?: boolean
          sort?: number
        }
        Update: {
          active?: boolean
          can_publish_offers?: boolean
          code?: string
          currency?: string
          detailed_reports?: boolean
          features?: string[]
          has_badge?: boolean
          has_stats?: boolean
          homepage_feature?: boolean
          name?: string
          price?: number
          priority_ranking?: boolean
          priority_support?: boolean
          sort?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          created_by: string | null
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_code: string
          price: number
          provider: string | null
          provider_ref: string | null
          restaurant_id: number
          status: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          created_by?: string | null
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_code: string
          price?: number
          provider?: string | null
          provider_ref?: string | null
          restaurant_id: number
          status?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          created_by?: string | null
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_code?: string
          price?: number
          provider?: string | null
          provider_ref?: string | null
          restaurant_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_overview: { Args: never; Returns: Json }
      admin_set_payment: {
        Args: { _payment_id: string; _ref?: string; _status: string }
        Returns: undefined
      }
      buy_campaign: {
        Args: {
          _city?: string
          _cuisine?: string
          _offer_id?: string
          _package_id: string
          _rid: number
        }
        Returns: Json
      }
      cancel_campaign: { Args: { _id: string }; Returns: undefined }
      cancel_subscription: {
        Args: { _resume?: boolean; _rid: number }
        Returns: undefined
      }
      claim_offer: {
        Args: { _offer_id: string }
        Returns: {
          bill_amount: number | null
          code: string
          expires_at: string
          id: string
          issued_at: string
          offer_id: string
          reservation_id: string | null
          restaurant_id: number
          status: string
          used_at: string | null
          user_id: string
          validated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "coupons"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_payment_internal: {
        Args: { _payment_id: string; _provider: string; _provider_ref: string }
        Returns: undefined
      }
      coupon_check: { Args: { _code: string }; Returns: Json }
      get_restaurant_catalog_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { _rid: number; _uid: string }; Returns: boolean }
      owner_update_restaurant: {
        Args: { _patch: Json; _rid: number }
        Returns: undefined
      }
      plan_allows_offers: { Args: { _rid: number }; Returns: boolean }
      public_monetization: { Args: never; Returns: Json }
      redeem_coupon: {
        Args: { _bill_amount?: number; _code: string }
        Returns: Json
      }
      restaurant_plan: { Args: { _rid: number }; Returns: string }
      restaurant_stats: { Args: { _rid: number }; Returns: Json }
      select_plan: { Args: { _plan: string; _rid: number }; Returns: Json }
      set_reservation_status: {
        Args: { _id: string; _status: string }
        Returns: {
          coupon_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          people: number
          phone: string
          reserved_date: string
          reserved_time: string
          restaurant_id: number
          status: string
          status_changed_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
