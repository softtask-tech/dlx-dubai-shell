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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          auth_user_id: string | null
          bio: string | null
          brn: string | null
          created_at: string
          display_order: number
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          languages: string[]
          linkedin_url: string | null
          phone: string | null
          photo_url: string | null
          slug: string
          specialities: string[]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          auth_user_id?: string | null
          bio?: string | null
          brn?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          languages?: string[]
          linkedin_url?: string | null
          phone?: string | null
          photo_url?: string | null
          slug: string
          specialities?: string[]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          auth_user_id?: string | null
          bio?: string | null
          brn?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          languages?: string[]
          linkedin_url?: string | null
          phone?: string | null
          photo_url?: string | null
          slug?: string
          specialities?: string[]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      areas: {
        Row: {
          created_at: string
          description: string | null
          dld_area_name: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean
          latitude: number | null
          longitude: number | null
          name: string
          name_ar: string | null
          parent_area_id: string | null
          published_at: string | null
          slug: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dld_area_name?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          name_ar?: string | null
          parent_area_id?: string | null
          published_at?: string | null
          slug: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dld_area_name?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_ar?: string | null
          parent_area_id?: string | null
          published_at?: string | null
          slug?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_parent_area_id_fkey"
            columns: ["parent_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_agent_id: string | null
          body: string | null
          category: Database["public"]["Enums"]["content_category"]
          created_at: string
          excerpt: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean
          og_image_url: string | null
          published_at: string | null
          reading_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[]
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          author_agent_id?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          og_image_url?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[]
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          author_agent_id?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          og_image_url?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[]
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_agent_id_fkey"
            columns: ["author_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          created_at: string
          description: string | null
          founded_year: number | null
          id: string
          is_partner: boolean
          is_published: boolean
          logo_url: string | null
          name: string
          name_ar: string | null
          published_at: string | null
          slug: string
          summary: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          is_partner?: boolean
          is_published?: boolean
          logo_url?: string | null
          name: string
          name_ar?: string | null
          published_at?: string | null
          slug: string
          summary?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          is_partner?: boolean
          is_published?: boolean
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          published_at?: string | null
          slug?: string
          summary?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      guides: {
        Row: {
          author_agent_id: string | null
          body: string | null
          category: Database["public"]["Enums"]["content_category"]
          created_at: string
          excerpt: string | null
          hero_image_url: string | null
          id: string
          is_gated: boolean
          is_published: boolean
          og_image_url: string | null
          published_at: string | null
          reading_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          author_agent_id?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          is_gated?: boolean
          is_published?: boolean
          og_image_url?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          author_agent_id?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          excerpt?: string | null
          hero_image_url?: string | null
          id?: string
          is_gated?: boolean
          is_published?: boolean
          og_image_url?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guides_author_agent_id_fkey"
            columns: ["author_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          admin_notified_at: string | null
          area_ids: string[]
          assigned_agent_id: string | null
          bedrooms_min: number | null
          budget_currency: string
          budget_max: number | null
          budget_min: number | null
          client_confirmed_at: string | null
          consent_at: string | null
          country_code: string | null
          created_at: string
          email: string | null
          fbclid: string | null
          full_name: string | null
          gclid: string | null
          guide_id: string | null
          id: string
          intent: Database["public"]["Enums"]["lead_intent"] | null
          internal_notes: string | null
          is_financing: boolean | null
          is_first_purchase: boolean | null
          landing_page_url: string | null
          marketing_consent: boolean
          message: string | null
          page_path: string | null
          phone: string | null
          preferred_contact: string | null
          preferred_language: string
          property_id: string | null
          property_types: Database["public"]["Enums"]["property_type"][]
          qualification_answers: Json
          raw_payload: Json
          referrer_url: string | null
          score: number
          source_detail: string | null
          source_type: Database["public"]["Enums"]["lead_source_type"]
          status: Database["public"]["Enums"]["lead_status"]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          timeline: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          admin_notified_at?: string | null
          area_ids?: string[]
          assigned_agent_id?: string | null
          bedrooms_min?: number | null
          budget_currency?: string
          budget_max?: number | null
          budget_min?: number | null
          client_confirmed_at?: string | null
          consent_at?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          fbclid?: string | null
          full_name?: string | null
          gclid?: string | null
          guide_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["lead_intent"] | null
          internal_notes?: string | null
          is_financing?: boolean | null
          is_first_purchase?: boolean | null
          landing_page_url?: string | null
          marketing_consent?: boolean
          message?: string | null
          page_path?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_language?: string
          property_id?: string | null
          property_types?: Database["public"]["Enums"]["property_type"][]
          qualification_answers?: Json
          raw_payload?: Json
          referrer_url?: string | null
          score?: number
          source_detail?: string | null
          source_type: Database["public"]["Enums"]["lead_source_type"]
          status?: Database["public"]["Enums"]["lead_status"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          timeline?: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          admin_notified_at?: string | null
          area_ids?: string[]
          assigned_agent_id?: string | null
          bedrooms_min?: number | null
          budget_currency?: string
          budget_max?: number | null
          budget_min?: number | null
          client_confirmed_at?: string | null
          consent_at?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          fbclid?: string | null
          full_name?: string | null
          gclid?: string | null
          guide_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["lead_intent"] | null
          internal_notes?: string | null
          is_financing?: boolean | null
          is_first_purchase?: boolean | null
          landing_page_url?: string | null
          marketing_consent?: boolean
          message?: string | null
          page_path?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_language?: string
          property_id?: string | null
          property_types?: Database["public"]["Enums"]["property_type"][]
          qualification_answers?: Json
          raw_payload?: Json
          referrer_url?: string | null
          score?: number
          source_detail?: string | null
          source_type?: Database["public"]["Enums"]["lead_source_type"]
          status?: Database["public"]["Enums"]["lead_status"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          timeline?: Database["public"]["Enums"]["lead_timeline"] | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          amenities: string[]
          area_id: string | null
          bedrooms_max: number | null
          bedrooms_min: number | null
          brochure_url: string | null
          created_at: string
          currency: string
          description: string | null
          developer_id: string | null
          floor_plan_url: string | null
          handover_quarter: number | null
          handover_year: number | null
          hero_image_url: string | null
          id: string
          image_urls: Json
          is_featured: boolean
          is_published: boolean
          name: string
          name_ar: string | null
          payment_plan: string | null
          published_at: string | null
          slug: string
          starting_price: number | null
          status: Database["public"]["Enums"]["project_status"]
          summary: string | null
          unit_types: Database["public"]["Enums"]["property_type"][]
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          area_id?: string | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          brochure_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          developer_id?: string | null
          floor_plan_url?: string | null
          handover_quarter?: number | null
          handover_year?: number | null
          hero_image_url?: string | null
          id?: string
          image_urls?: Json
          is_featured?: boolean
          is_published?: boolean
          name: string
          name_ar?: string | null
          payment_plan?: string | null
          published_at?: string | null
          slug: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string | null
          unit_types?: Database["public"]["Enums"]["property_type"][]
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          area_id?: string | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          brochure_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          developer_id?: string | null
          floor_plan_url?: string | null
          handover_quarter?: number | null
          handover_year?: number | null
          hero_image_url?: string | null
          id?: string
          image_urls?: Json
          is_featured?: boolean
          is_published?: boolean
          name?: string
          name_ar?: string | null
          payment_plan?: string | null
          published_at?: string | null
          slug?: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string | null
          unit_types?: Database["public"]["Enums"]["property_type"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          agent_id: string | null
          amenities: string[]
          area_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          brochure_url: string | null
          built_up_sqft: number | null
          completion_status: string | null
          created_at: string
          currency: string
          description: string | null
          developer_id: string | null
          dld_permit_number: string | null
          floor: string | null
          floor_plan_url: string | null
          furnishing: Database["public"]["Enums"]["furnishing"] | null
          handover_year: number | null
          hero_image_url: string | null
          id: string
          image_urls: Json
          is_featured: boolean
          is_published: boolean
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude: number | null
          plot_sqft: number | null
          price: number | null
          project_id: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          published_at: string | null
          reference: string | null
          rent_frequency: string | null
          service_charge_per_sqft: number | null
          slug: string
          status: Database["public"]["Enums"]["property_status"]
          summary: string | null
          title: string
          title_ar: string | null
          updated_at: string
          view: string | null
        }
        Insert: {
          agent_id?: string | null
          amenities?: string[]
          area_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          brochure_url?: string | null
          built_up_sqft?: number | null
          completion_status?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          developer_id?: string | null
          dld_permit_number?: string | null
          floor?: string | null
          floor_plan_url?: string | null
          furnishing?: Database["public"]["Enums"]["furnishing"] | null
          handover_year?: number | null
          hero_image_url?: string | null
          id?: string
          image_urls?: Json
          is_featured?: boolean
          is_published?: boolean
          latitude?: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          plot_sqft?: number | null
          price?: number | null
          project_id?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          published_at?: string | null
          reference?: string | null
          rent_frequency?: string | null
          service_charge_per_sqft?: number | null
          slug: string
          status?: Database["public"]["Enums"]["property_status"]
          summary?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
          view?: string | null
        }
        Update: {
          agent_id?: string | null
          amenities?: string[]
          area_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          brochure_url?: string | null
          built_up_sqft?: number | null
          completion_status?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          developer_id?: string | null
          dld_permit_number?: string | null
          floor?: string | null
          floor_plan_url?: string | null
          furnishing?: Database["public"]["Enums"]["furnishing"] | null
          handover_year?: number | null
          hero_image_url?: string | null
          id?: string
          image_urls?: Json
          is_featured?: boolean
          is_published?: boolean
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          plot_sqft?: number | null
          price?: number | null
          project_id?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          published_at?: string | null
          reference?: string | null
          rent_frequency?: string | null
          service_charge_per_sqft?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["property_status"]
          summary?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          view?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          agent_id: string | null
          author_location: string | null
          author_name: string
          author_photo_url: string | null
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          property_id: string | null
          published_at: string | null
          quote: string
          rating: number | null
          source: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          author_location?: string | null
          author_name: string
          author_photo_url?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          property_id?: string | null
          published_at?: string | null
          quote: string
          rating?: number | null
          source?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          author_location?: string | null
          author_name?: string
          author_photo_url?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          property_id?: string | null
          published_at?: string | null
          quote?: string
          rating?: number | null
          source?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          check_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent"
      content_category:
        | "buying"
        | "selling"
        | "investment"
        | "golden_visa"
        | "relocation"
        | "market"
        | "area_guide"
        | "legal_and_tax"
      furnishing: "unfurnished" | "semi_furnished" | "furnished"
      lead_intent: "buy" | "sell" | "rent" | "invest" | "relocate" | "advice"
      lead_source_type:
        | "contact_form"
        | "valuation_form"
        | "listing_enquiry"
        | "guide_download"
        | "calculator"
        | "market_report"
        | "ai_chat"
        | "voice_call"
        | "whatsapp"
        | "referral"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "viewing_booked"
        | "negotiating"
        | "won"
        | "lost"
        | "unqualified"
      lead_temperature: "hot" | "warm" | "cold"
      lead_timeline:
        | "immediately"
        | "within_3_months"
        | "within_12_months"
        | "researching"
      listing_type: "sale" | "rent"
      project_status:
        | "announced"
        | "under_construction"
        | "completed"
        | "sold_out"
      property_status:
        | "available"
        | "under_offer"
        | "sold"
        | "let"
        | "off_market"
      property_type:
        | "apartment"
        | "villa"
        | "townhouse"
        | "penthouse"
        | "duplex"
        | "plot"
        | "office"
        | "retail"
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
      app_role: ["admin", "agent"],
      content_category: [
        "buying",
        "selling",
        "investment",
        "golden_visa",
        "relocation",
        "market",
        "area_guide",
        "legal_and_tax",
      ],
      furnishing: ["unfurnished", "semi_furnished", "furnished"],
      lead_intent: ["buy", "sell", "rent", "invest", "relocate", "advice"],
      lead_source_type: [
        "contact_form",
        "valuation_form",
        "listing_enquiry",
        "guide_download",
        "calculator",
        "market_report",
        "ai_chat",
        "voice_call",
        "whatsapp",
        "referral",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "viewing_booked",
        "negotiating",
        "won",
        "lost",
        "unqualified",
      ],
      lead_temperature: ["hot", "warm", "cold"],
      lead_timeline: [
        "immediately",
        "within_3_months",
        "within_12_months",
        "researching",
      ],
      listing_type: ["sale", "rent"],
      project_status: [
        "announced",
        "under_construction",
        "completed",
        "sold_out",
      ],
      property_status: [
        "available",
        "under_offer",
        "sold",
        "let",
        "off_market",
      ],
      property_type: [
        "apartment",
        "villa",
        "townhouse",
        "penthouse",
        "duplex",
        "plot",
        "office",
        "retail",
      ],
    },
  },
} as const
