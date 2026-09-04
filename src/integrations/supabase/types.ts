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
      advisor_conversations: {
        Row: {
          call_seconds: number | null
          call_sid: string | null
          caller_number: string | null
          channel: Database["public"]["Enums"]["advisor_channel"]
          created_at: string
          ended_at: string | null
          id: string
          ip_hash: string | null
          language: string
          last_turn_at: string
          lead_id: string | null
          qualification: Json
          session_token: string
          started_at: string
          summary: string | null
          transcript: Json
          turn_count: number
          updated_at: string
        }
        Insert: {
          call_seconds?: number | null
          call_sid?: string | null
          caller_number?: string | null
          channel: Database["public"]["Enums"]["advisor_channel"]
          created_at?: string
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          language?: string
          last_turn_at?: string
          lead_id?: string | null
          qualification?: Json
          session_token: string
          started_at?: string
          summary?: string | null
          transcript?: Json
          turn_count?: number
          updated_at?: string
        }
        Update: {
          call_seconds?: number | null
          call_sid?: string | null
          caller_number?: string | null
          channel?: Database["public"]["Enums"]["advisor_channel"]
          created_at?: string
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          language?: string
          last_turn_at?: string
          lead_id?: string | null
          qualification?: Json
          session_token?: string
          started_at?: string
          summary?: string | null
          transcript?: Json
          turn_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      area_price_history: {
        Row: {
          area_id: string
          created_at: string
          id: string
          median_price: number | null
          median_price_per_sqft: number | null
          period_month: string
          provenance: Database["public"]["Enums"]["data_provenance"]
          transaction_count: number
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          median_price?: number | null
          median_price_per_sqft?: number | null
          period_month: string
          provenance: Database["public"]["Enums"]["data_provenance"]
          transaction_count?: number
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          median_price?: number | null
          median_price_per_sqft?: number | null
          period_month?: string
          provenance?: Database["public"]["Enums"]["data_provenance"]
          transaction_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "area_price_history_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      area_stats: {
        Row: {
          area_id: string
          average_price: number | null
          average_price_per_sqft: number | null
          created_at: string
          gross_yield_pct: number | null
          id: string
          last_updated: string
          median_annual_rent: number | null
          median_price: number | null
          median_price_per_sqft: number | null
          off_plan_share_pct: number | null
          prior_median_price_per_sqft: number | null
          prior_transaction_count: number | null
          provenance: Database["public"]["Enums"]["data_provenance"]
          transaction_count: number
          window_end: string
          window_start: string
          yoy_price_change_pct: number | null
          yoy_volume_change_pct: number | null
        }
        Insert: {
          area_id: string
          average_price?: number | null
          average_price_per_sqft?: number | null
          created_at?: string
          gross_yield_pct?: number | null
          id?: string
          last_updated?: string
          median_annual_rent?: number | null
          median_price?: number | null
          median_price_per_sqft?: number | null
          off_plan_share_pct?: number | null
          prior_median_price_per_sqft?: number | null
          prior_transaction_count?: number | null
          provenance: Database["public"]["Enums"]["data_provenance"]
          transaction_count?: number
          window_end: string
          window_start: string
          yoy_price_change_pct?: number | null
          yoy_volume_change_pct?: number | null
        }
        Update: {
          area_id?: string
          average_price?: number | null
          average_price_per_sqft?: number | null
          created_at?: string
          gross_yield_pct?: number | null
          id?: string
          last_updated?: string
          median_annual_rent?: number | null
          median_price?: number | null
          median_price_per_sqft?: number | null
          off_plan_share_pct?: number | null
          prior_median_price_per_sqft?: number | null
          prior_transaction_count?: number | null
          provenance?: Database["public"]["Enums"]["data_provenance"]
          transaction_count?: number
          window_end?: string
          window_start?: string
          yoy_price_change_pct?: number | null
          yoy_volume_change_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "area_stats_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: true
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string
          description: string | null
          dld_area_name: string | null
          dld_directory_area_id: string | null
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
          dld_directory_area_id?: string | null
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
          dld_directory_area_id?: string | null
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
            foreignKeyName: "areas_dld_directory_area_id_fkey"
            columns: ["dld_directory_area_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_communities"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "areas_dld_directory_area_id_fkey"
            columns: ["dld_directory_area_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_communities_public"
            referencedColumns: ["area_id"]
          },
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
      campaign_spend: {
        Row: {
          ad_id: string
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string
          campaign_name: string | null
          clicks: number | null
          created_at: string
          id: string
          imported_at: string
          impressions: number | null
          platform: string
          platform_conversions: number | null
          spend_aed: number
          spend_date: string
          updated_at: string
        }
        Insert: {
          ad_id?: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id: string
          campaign_name?: string | null
          clicks?: number | null
          created_at?: string
          id?: string
          imported_at?: string
          impressions?: number | null
          platform: string
          platform_conversions?: number | null
          spend_aed: number
          spend_date: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string
          campaign_name?: string | null
          clicks?: number | null
          created_at?: string
          id?: string
          imported_at?: string
          impressions?: number | null
          platform?: string
          platform_conversions?: number | null
          spend_aed?: number
          spend_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          attempts: number
          created_at: string
          destination: Database["public"]["Enums"]["conversion_destination"]
          error: string | null
          event_id: string
          event_name: string
          id: string
          lead_id: string | null
          response: Json | null
          sent_at: string | null
          status: Database["public"]["Enums"]["conversion_status"]
          updated_at: string
          value_aed: number | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          destination: Database["public"]["Enums"]["conversion_destination"]
          error?: string | null
          event_id: string
          event_name: string
          id?: string
          lead_id?: string | null
          response?: Json | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["conversion_status"]
          updated_at?: string
          value_aed?: number | null
        }
        Update: {
          attempts?: number
          created_at?: string
          destination?: Database["public"]["Enums"]["conversion_destination"]
          error?: string | null
          event_id?: string
          event_name?: string
          id?: string
          lead_id?: string | null
          response?: Json | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["conversion_status"]
          updated_at?: string
          value_aed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          created_at: string
          description: string | null
          dld_directory_developer_id: string | null
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
          dld_directory_developer_id?: string | null
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
          dld_directory_developer_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "developers_dld_directory_developer_id_fkey"
            columns: ["dld_directory_developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "developers_dld_directory_developer_id_fkey"
            columns: ["dld_directory_developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers_public"
            referencedColumns: ["developer_id"]
          },
        ]
      }
      dld_directory_broker_office_links: {
        Row: {
          broker_id: string
          licence_end_date: string | null
          licence_start_date: string | null
          office_id: string | null
          office_number: string | null
          source_dataset: string
          source_export_date: string
          source_office_id: string
        }
        Insert: {
          broker_id: string
          licence_end_date?: string | null
          licence_start_date?: string | null
          office_id?: string | null
          office_number?: string | null
          source_dataset: string
          source_export_date: string
          source_office_id: string
        }
        Update: {
          broker_id?: string
          licence_end_date?: string | null
          licence_start_date?: string | null
          office_id?: string | null
          office_number?: string | null
          source_dataset?: string
          source_export_date?: string
          source_office_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dld_directory_broker_office_links_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_brokers"
            referencedColumns: ["broker_id"]
          },
          {
            foreignKeyName: "dld_directory_broker_office_links_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_brokers_public"
            referencedColumns: ["broker_id"]
          },
          {
            foreignKeyName: "dld_directory_broker_office_links_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices"
            referencedColumns: ["office_id"]
          },
          {
            foreignKeyName: "dld_directory_broker_office_links_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices_public"
            referencedColumns: ["office_id"]
          },
        ]
      }
      dld_directory_brokers: {
        Row: {
          aliases: string
          broker_id: string
          broker_number: string | null
          licence_end_date: string | null
          licence_start_date: string | null
          name_ar: string | null
          name_en: string | null
          participant_id: string | null
          source_dataset: string
          source_export_date: string
        }
        Insert: {
          aliases?: string
          broker_id: string
          broker_number?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          name_ar?: string | null
          name_en?: string | null
          participant_id?: string | null
          source_dataset: string
          source_export_date: string
        }
        Update: {
          aliases?: string
          broker_id?: string
          broker_number?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          name_ar?: string | null
          name_en?: string | null
          participant_id?: string | null
          source_dataset?: string
          source_export_date?: string
        }
        Relationships: []
      }
      dld_directory_communities: {
        Row: {
          aliases: string
          area_id: string
          municipality_number: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string
          source_export_date: string
        }
        Insert: {
          aliases?: string
          area_id: string
          municipality_number?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset: string
          source_export_date: string
        }
        Update: {
          aliases?: string
          area_id?: string
          municipality_number?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string
          source_export_date?: string
        }
        Relationships: []
      }
      dld_directory_developers: {
        Row: {
          aliases: string
          developer_id: string
          developer_number: string | null
          legal_status_ar: string | null
          legal_status_en: string | null
          licence_expiry_date: string | null
          licence_issue_date: string | null
          licence_number: string | null
          licence_source_ar: string | null
          licence_source_en: string | null
          licence_source_id: string | null
          name_ar: string | null
          name_en: string | null
          participant_id: string | null
          registration_date: string | null
          source_dataset: string
          source_export_date: string
        }
        Insert: {
          aliases?: string
          developer_id: string
          developer_number?: string | null
          legal_status_ar?: string | null
          legal_status_en?: string | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          licence_source_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          participant_id?: string | null
          registration_date?: string | null
          source_dataset: string
          source_export_date: string
        }
        Update: {
          aliases?: string
          developer_id?: string
          developer_number?: string | null
          legal_status_ar?: string | null
          legal_status_en?: string | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          licence_source_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          participant_id?: string | null
          registration_date?: string | null
          source_dataset?: string
          source_export_date?: string
        }
        Relationships: []
      }
      dld_directory_escrow_agents: {
        Row: {
          aliases: string
          escrow_agent_number: string
          name_ar: string | null
          name_en: string | null
          source_dataset: string
          source_export_date: string
        }
        Insert: {
          aliases?: string
          escrow_agent_number: string
          name_ar?: string | null
          name_en?: string | null
          source_dataset: string
          source_export_date: string
        }
        Update: {
          aliases?: string
          escrow_agent_number?: string
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string
          source_export_date?: string
        }
        Relationships: []
      }
      dld_directory_free_zone_companies: {
        Row: {
          aliases: string
          company_number: string
          licence_expiry_date: string | null
          licence_issue_date: string | null
          licence_number: string | null
          licence_source_ar: string | null
          licence_source_en: string | null
          licence_source_id: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string
          source_export_date: string
        }
        Insert: {
          aliases?: string
          company_number: string
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          licence_source_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset: string
          source_export_date: string
        }
        Update: {
          aliases?: string
          company_number?: string
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          licence_source_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string
          source_export_date?: string
        }
        Relationships: []
      }
      dld_directory_licences: {
        Row: {
          activity_name_ar: string | null
          activity_name_en: string | null
          activity_type_id: string | null
          aliases: string
          authority_id: string | null
          cancel_date: string | null
          ded_activity_code: string | null
          expiry_date: string | null
          issue_date: string | null
          legal_type_ar: string | null
          legal_type_en: string | null
          licence_key: string
          licence_number: string | null
          matched_developer_id: string | null
          matched_office_id: string | null
          participant_id: string | null
          source_dataset: string
          source_export_date: string
          status_ar: string | null
          status_en: string | null
          trade_name_ar: string | null
          trade_name_en: string | null
        }
        Insert: {
          activity_name_ar?: string | null
          activity_name_en?: string | null
          activity_type_id?: string | null
          aliases?: string
          authority_id?: string | null
          cancel_date?: string | null
          ded_activity_code?: string | null
          expiry_date?: string | null
          issue_date?: string | null
          legal_type_ar?: string | null
          legal_type_en?: string | null
          licence_key: string
          licence_number?: string | null
          matched_developer_id?: string | null
          matched_office_id?: string | null
          participant_id?: string | null
          source_dataset: string
          source_export_date: string
          status_ar?: string | null
          status_en?: string | null
          trade_name_ar?: string | null
          trade_name_en?: string | null
        }
        Update: {
          activity_name_ar?: string | null
          activity_name_en?: string | null
          activity_type_id?: string | null
          aliases?: string
          authority_id?: string | null
          cancel_date?: string | null
          ded_activity_code?: string | null
          expiry_date?: string | null
          issue_date?: string | null
          legal_type_ar?: string | null
          legal_type_en?: string | null
          licence_key?: string
          licence_number?: string | null
          matched_developer_id?: string | null
          matched_office_id?: string | null
          participant_id?: string | null
          source_dataset?: string
          source_export_date?: string
          status_ar?: string | null
          status_en?: string | null
          trade_name_ar?: string | null
          trade_name_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dld_directory_licences_matched_developer_id_fkey"
            columns: ["matched_developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "dld_directory_licences_matched_developer_id_fkey"
            columns: ["matched_developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers_public"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "dld_directory_licences_matched_office_id_fkey"
            columns: ["matched_office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices"
            referencedColumns: ["office_id"]
          },
          {
            foreignKeyName: "dld_directory_licences_matched_office_id_fkey"
            columns: ["matched_office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices_public"
            referencedColumns: ["office_id"]
          },
        ]
      }
      dld_directory_office_activities: {
        Row: {
          activity_key: string
          activity_name_ar: string | null
          activity_name_en: string | null
          activity_type_id: string | null
          ded_activity_code: string | null
          office_id: string
          source_dataset: string
          source_export_date: string
        }
        Insert: {
          activity_key: string
          activity_name_ar?: string | null
          activity_name_en?: string | null
          activity_type_id?: string | null
          ded_activity_code?: string | null
          office_id: string
          source_dataset: string
          source_export_date: string
        }
        Update: {
          activity_key?: string
          activity_name_ar?: string | null
          activity_name_en?: string | null
          activity_type_id?: string | null
          ded_activity_code?: string | null
          office_id?: string
          source_dataset?: string
          source_export_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "dld_directory_office_activities_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices"
            referencedColumns: ["office_id"]
          },
          {
            foreignKeyName: "dld_directory_office_activities_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices_public"
            referencedColumns: ["office_id"]
          },
        ]
      }
      dld_directory_offices: {
        Row: {
          aliases: string
          is_branch: boolean | null
          licence_expiry_date: string | null
          licence_issue_date: string | null
          licence_number: string | null
          licence_source_ar: string | null
          licence_source_en: string | null
          licence_source_id: string | null
          main_office_id: string | null
          name_ar: string | null
          name_en: string | null
          office_id: string
          office_number: string | null
          participant_id: string | null
          source_dataset: string
          source_export_date: string
        }
        Insert: {
          aliases?: string
          is_branch?: boolean | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          licence_source_id?: string | null
          main_office_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          office_id: string
          office_number?: string | null
          participant_id?: string | null
          source_dataset: string
          source_export_date: string
        }
        Update: {
          aliases?: string
          is_branch?: boolean | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          licence_source_id?: string | null
          main_office_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          office_id?: string
          office_number?: string | null
          participant_id?: string | null
          source_dataset?: string
          source_export_date?: string
        }
        Relationships: []
      }
      dld_directory_owner_associations: {
        Row: {
          aliases: string
          association_key: string
          latitude: number | null
          longitude: number | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string
          source_export_date: string
        }
        Insert: {
          aliases?: string
          association_key: string
          latitude?: number | null
          longitude?: number | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset: string
          source_export_date: string
        }
        Update: {
          aliases?: string
          association_key?: string
          latitude?: number | null
          longitude?: number | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string
          source_export_date?: string
        }
        Relationships: []
      }
      dld_directory_permits: {
        Row: {
          aliases: string
          end_date: string | null
          exhibition_name_ar: string | null
          exhibition_name_en: string | null
          licence_number: string | null
          main_service_ar: string | null
          main_service_en: string | null
          participant_name_ar: string | null
          participant_name_en: string | null
          permit_id: string
          permit_number: string | null
          service_ar: string | null
          service_en: string | null
          service_id: string | null
          source_dataset: string
          source_export_date: string
          start_date: string | null
          status_ar: string | null
          status_en: string | null
        }
        Insert: {
          aliases?: string
          end_date?: string | null
          exhibition_name_ar?: string | null
          exhibition_name_en?: string | null
          licence_number?: string | null
          main_service_ar?: string | null
          main_service_en?: string | null
          participant_name_ar?: string | null
          participant_name_en?: string | null
          permit_id: string
          permit_number?: string | null
          service_ar?: string | null
          service_en?: string | null
          service_id?: string | null
          source_dataset: string
          source_export_date: string
          start_date?: string | null
          status_ar?: string | null
          status_en?: string | null
        }
        Update: {
          aliases?: string
          end_date?: string | null
          exhibition_name_ar?: string | null
          exhibition_name_en?: string | null
          licence_number?: string | null
          main_service_ar?: string | null
          main_service_en?: string | null
          participant_name_ar?: string | null
          participant_name_en?: string | null
          permit_id?: string
          permit_number?: string | null
          service_ar?: string | null
          service_en?: string | null
          service_id?: string | null
          source_dataset?: string
          source_export_date?: string
          start_date?: string | null
          status_ar?: string | null
          status_en?: string | null
        }
        Relationships: []
      }
      dld_directory_projects: {
        Row: {
          aliases: string
          area_id: string | null
          area_name_ar: string | null
          area_name_en: string | null
          cancellation_date: string | null
          completion_date: string | null
          developer_id: string | null
          developer_number: string | null
          escrow_agent_number: string | null
          master_developer_id: string | null
          name_ar: string | null
          name_en: string | null
          no_of_buildings: number | null
          no_of_units: number | null
          no_of_villas: number | null
          percent_completed: number | null
          project_end_date: string | null
          project_id: string
          project_number: string | null
          project_start_date: string | null
          source_dataset: string
          source_developer_id: string | null
          source_developer_name: string | null
          source_escrow_agent_number: string | null
          source_export_date: string
          source_name: string | null
          status_ar: string | null
          status_en: string | null
        }
        Insert: {
          aliases?: string
          area_id?: string | null
          area_name_ar?: string | null
          area_name_en?: string | null
          cancellation_date?: string | null
          completion_date?: string | null
          developer_id?: string | null
          developer_number?: string | null
          escrow_agent_number?: string | null
          master_developer_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          no_of_buildings?: number | null
          no_of_units?: number | null
          no_of_villas?: number | null
          percent_completed?: number | null
          project_end_date?: string | null
          project_id: string
          project_number?: string | null
          project_start_date?: string | null
          source_dataset: string
          source_developer_id?: string | null
          source_developer_name?: string | null
          source_escrow_agent_number?: string | null
          source_export_date: string
          source_name?: string | null
          status_ar?: string | null
          status_en?: string | null
        }
        Update: {
          aliases?: string
          area_id?: string | null
          area_name_ar?: string | null
          area_name_en?: string | null
          cancellation_date?: string | null
          completion_date?: string | null
          developer_id?: string | null
          developer_number?: string | null
          escrow_agent_number?: string | null
          master_developer_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          no_of_buildings?: number | null
          no_of_units?: number | null
          no_of_villas?: number | null
          percent_completed?: number | null
          project_end_date?: string | null
          project_id?: string
          project_number?: string | null
          project_start_date?: string | null
          source_dataset?: string
          source_developer_id?: string | null
          source_developer_name?: string | null
          source_escrow_agent_number?: string | null
          source_export_date?: string
          source_name?: string | null
          status_ar?: string | null
          status_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dld_directory_projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_communities"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_communities_public"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers_public"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_escrow_agent_number_fkey"
            columns: ["escrow_agent_number"]
            isOneToOne: false
            referencedRelation: "dld_directory_escrow_agents"
            referencedColumns: ["escrow_agent_number"]
          },
          {
            foreignKeyName: "dld_directory_projects_escrow_agent_number_fkey"
            columns: ["escrow_agent_number"]
            isOneToOne: false
            referencedRelation: "dld_directory_escrow_agents_public"
            referencedColumns: ["escrow_agent_number"]
          },
          {
            foreignKeyName: "dld_directory_projects_master_developer_id_fkey"
            columns: ["master_developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_master_developer_id_fkey"
            columns: ["master_developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers_public"
            referencedColumns: ["developer_id"]
          },
        ]
      }
      dld_directory_valuators: {
        Row: {
          aliases: string
          company_name_ar: string | null
          company_name_en: string | null
          licence_end_date: string | null
          licence_start_date: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string
          source_export_date: string
          valuation_company_number: string | null
          valuator_key: string
          valuator_number: string | null
        }
        Insert: {
          aliases?: string
          company_name_ar?: string | null
          company_name_en?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset: string
          source_export_date: string
          valuation_company_number?: string | null
          valuator_key: string
          valuator_number?: string | null
        }
        Update: {
          aliases?: string
          company_name_ar?: string | null
          company_name_en?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string
          source_export_date?: string
          valuation_company_number?: string | null
          valuator_key?: string
          valuator_number?: string | null
        }
        Relationships: []
      }
      dld_ingest_runs: {
        Row: {
          areas_refreshed: number
          created_at: string
          dataset: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          rows_fetched: number
          rows_rejected: number
          rows_upserted: number
          started_at: string
          status: string
          trigger_source: string
        }
        Insert: {
          areas_refreshed?: number
          created_at?: string
          dataset?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          rows_fetched?: number
          rows_rejected?: number
          rows_upserted?: number
          started_at?: string
          status?: string
          trigger_source?: string
        }
        Update: {
          areas_refreshed?: number
          created_at?: string
          dataset?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          rows_fetched?: number
          rows_rejected?: number
          rows_upserted?: number
          started_at?: string
          status?: string
          trigger_source?: string
        }
        Relationships: []
      }
      dld_rent_contracts: {
        Row: {
          annual_rent: number
          area_id: string | null
          area_name_raw: string
          area_sqm: number | null
          bedrooms: number | null
          contract_start_date: string
          created_at: string
          id: string
          ingested_at: string
          property_type: string | null
          provenance: Database["public"]["Enums"]["data_provenance"]
          source_contract_id: string
        }
        Insert: {
          annual_rent: number
          area_id?: string | null
          area_name_raw: string
          area_sqm?: number | null
          bedrooms?: number | null
          contract_start_date: string
          created_at?: string
          id?: string
          ingested_at?: string
          property_type?: string | null
          provenance: Database["public"]["Enums"]["data_provenance"]
          source_contract_id: string
        }
        Update: {
          annual_rent?: number
          area_id?: string | null
          area_name_raw?: string
          area_sqm?: number | null
          bedrooms?: number | null
          contract_start_date?: string
          created_at?: string
          id?: string
          ingested_at?: string
          property_type?: string | null
          provenance?: Database["public"]["Enums"]["data_provenance"]
          source_contract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dld_rent_contracts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      dld_transactions: {
        Row: {
          amount: number
          area_id: string | null
          area_name_raw: string
          area_sqft: number | null
          area_sqm: number | null
          bedrooms: number | null
          building_name: string | null
          created_at: string
          id: string
          ingested_at: string
          is_freehold: boolean | null
          latitude: number | null
          longitude: number | null
          price_per_sqft: number | null
          property_subtype: string | null
          property_type: string | null
          provenance: Database["public"]["Enums"]["data_provenance"]
          registration_type: string | null
          rooms_raw: string | null
          source_transaction_id: string
          transaction_date: string
          transaction_group: string | null
        }
        Insert: {
          amount: number
          area_id?: string | null
          area_name_raw: string
          area_sqft?: number | null
          area_sqm?: number | null
          bedrooms?: number | null
          building_name?: string | null
          created_at?: string
          id?: string
          ingested_at?: string
          is_freehold?: boolean | null
          latitude?: number | null
          longitude?: number | null
          price_per_sqft?: number | null
          property_subtype?: string | null
          property_type?: string | null
          provenance: Database["public"]["Enums"]["data_provenance"]
          registration_type?: string | null
          rooms_raw?: string | null
          source_transaction_id: string
          transaction_date: string
          transaction_group?: string | null
        }
        Update: {
          amount?: number
          area_id?: string | null
          area_name_raw?: string
          area_sqft?: number | null
          area_sqm?: number | null
          bedrooms?: number | null
          building_name?: string | null
          created_at?: string
          id?: string
          ingested_at?: string
          is_freehold?: boolean | null
          latitude?: number | null
          longitude?: number | null
          price_per_sqft?: number | null
          property_subtype?: string | null
          property_type?: string | null
          provenance?: Database["public"]["Enums"]["data_provenance"]
          registration_type?: string | null
          rooms_raw?: string | null
          source_transaction_id?: string
          transaction_date?: string
          transaction_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dld_transactions_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
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
          deal_closed_at: string | null
          deal_value_aed: number | null
          dedupe_key: string | null
          email: string | null
          external_form_id: string | null
          external_lead_id: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          first_landing_page_url: string | null
          first_seen_at: string | null
          first_utm_campaign: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          full_name: string | null
          gbraid: string | null
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
          msclkid: string | null
          nurture_last_sent_at: string | null
          nurture_stage: number
          nurture_started_at: string | null
          page_path: string | null
          phone: string | null
          preferred_contact: string | null
          preferred_language: string
          property_id: string | null
          property_types: Database["public"]["Enums"]["property_type"][]
          qualification_answers: Json
          raw_payload: Json
          referrer_url: string | null
          routed_at: string | null
          routing_reason: string | null
          score: number
          source_detail: string | null
          source_type: Database["public"]["Enums"]["lead_source_type"]
          spam_reasons: Json
          spam_score: number | null
          status: Database["public"]["Enums"]["lead_status"]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          timeline: Database["public"]["Enums"]["lead_timeline"] | null
          ttclid: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          wbraid: string | null
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
          deal_closed_at?: string | null
          deal_value_aed?: number | null
          dedupe_key?: string | null
          email?: string | null
          external_form_id?: string | null
          external_lead_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          first_landing_page_url?: string | null
          first_seen_at?: string | null
          first_utm_campaign?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          full_name?: string | null
          gbraid?: string | null
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
          msclkid?: string | null
          nurture_last_sent_at?: string | null
          nurture_stage?: number
          nurture_started_at?: string | null
          page_path?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_language?: string
          property_id?: string | null
          property_types?: Database["public"]["Enums"]["property_type"][]
          qualification_answers?: Json
          raw_payload?: Json
          referrer_url?: string | null
          routed_at?: string | null
          routing_reason?: string | null
          score?: number
          source_detail?: string | null
          source_type: Database["public"]["Enums"]["lead_source_type"]
          spam_reasons?: Json
          spam_score?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          timeline?: Database["public"]["Enums"]["lead_timeline"] | null
          ttclid?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          wbraid?: string | null
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
          deal_closed_at?: string | null
          deal_value_aed?: number | null
          dedupe_key?: string | null
          email?: string | null
          external_form_id?: string | null
          external_lead_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          first_landing_page_url?: string | null
          first_seen_at?: string | null
          first_utm_campaign?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          full_name?: string | null
          gbraid?: string | null
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
          msclkid?: string | null
          nurture_last_sent_at?: string | null
          nurture_stage?: number
          nurture_started_at?: string | null
          page_path?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_language?: string
          property_id?: string | null
          property_types?: Database["public"]["Enums"]["property_type"][]
          qualification_answers?: Json
          raw_payload?: Json
          referrer_url?: string | null
          routed_at?: string | null
          routing_reason?: string | null
          score?: number
          source_detail?: string | null
          source_type?: Database["public"]["Enums"]["lead_source_type"]
          spam_reasons?: Json
          spam_score?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          timeline?: Database["public"]["Enums"]["lead_timeline"] | null
          ttclid?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          wbraid?: string | null
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
          dld_directory_project_id: string | null
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
          dld_directory_project_id?: string | null
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
          dld_directory_project_id?: string | null
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
          {
            foreignKeyName: "projects_dld_directory_project_id_fkey"
            columns: ["dld_directory_project_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "projects_dld_directory_project_id_fkey"
            columns: ["dld_directory_project_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_projects_public"
            referencedColumns: ["project_id"]
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
      report_grants: {
        Row: {
          area_id: string | null
          created_at: string
          expires_at: string
          first_viewed_at: string | null
          id: string
          lead_id: string | null
          token: string
          view_count: number
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          expires_at: string
          first_viewed_at?: string | null
          id?: string
          lead_id?: string | null
          token: string
          view_count?: number
        }
        Update: {
          area_id?: string | null
          created_at?: string
          expires_at?: string
          first_viewed_at?: string | null
          id?: string
          lead_id?: string | null
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_grants_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_grants_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      dld_directory_broker_office_links_public: {
        Row: {
          broker_id: string | null
          licence_end_date: string | null
          licence_start_date: string | null
          office_id: string | null
          office_number: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          broker_id?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          office_id?: string | null
          office_number?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          broker_id?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          office_id?: string | null
          office_number?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dld_directory_broker_office_links_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_brokers"
            referencedColumns: ["broker_id"]
          },
          {
            foreignKeyName: "dld_directory_broker_office_links_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_brokers_public"
            referencedColumns: ["broker_id"]
          },
          {
            foreignKeyName: "dld_directory_broker_office_links_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices"
            referencedColumns: ["office_id"]
          },
          {
            foreignKeyName: "dld_directory_broker_office_links_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices_public"
            referencedColumns: ["office_id"]
          },
        ]
      }
      dld_directory_brokers_public: {
        Row: {
          broker_id: string | null
          broker_number: string | null
          licence_end_date: string | null
          licence_start_date: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          broker_id?: string | null
          broker_number?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          broker_id?: string | null
          broker_number?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: []
      }
      dld_directory_communities_public: {
        Row: {
          area_id: string | null
          municipality_number: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          area_id?: string | null
          municipality_number?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          area_id?: string | null
          municipality_number?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: []
      }
      dld_directory_developers_public: {
        Row: {
          developer_id: string | null
          developer_number: string | null
          legal_status_ar: string | null
          legal_status_en: string | null
          licence_expiry_date: string | null
          licence_issue_date: string | null
          licence_number: string | null
          licence_source_ar: string | null
          licence_source_en: string | null
          name_ar: string | null
          name_en: string | null
          registration_date: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          developer_id?: string | null
          developer_number?: string | null
          legal_status_ar?: string | null
          legal_status_en?: string | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          name_ar?: string | null
          name_en?: string | null
          registration_date?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          developer_id?: string | null
          developer_number?: string | null
          legal_status_ar?: string | null
          legal_status_en?: string | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          name_ar?: string | null
          name_en?: string | null
          registration_date?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: []
      }
      dld_directory_escrow_agents_public: {
        Row: {
          escrow_agent_number: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          escrow_agent_number?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          escrow_agent_number?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: []
      }
      dld_directory_free_zone_companies_public: {
        Row: {
          company_number: string | null
          licence_expiry_date: string | null
          licence_issue_date: string | null
          licence_number: string | null
          licence_source_ar: string | null
          licence_source_en: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          company_number?: string | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          company_number?: string | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: []
      }
      dld_directory_licences_public: {
        Row: {
          activity_name_ar: string | null
          activity_name_en: string | null
          activity_type_id: string | null
          cancel_date: string | null
          ded_activity_code: string | null
          expiry_date: string | null
          issue_date: string | null
          legal_type_ar: string | null
          legal_type_en: string | null
          licence_key: string | null
          licence_number: string | null
          source_dataset: string | null
          source_export_date: string | null
          status_ar: string | null
          status_en: string | null
          trade_name_ar: string | null
          trade_name_en: string | null
        }
        Insert: {
          activity_name_ar?: string | null
          activity_name_en?: string | null
          activity_type_id?: string | null
          cancel_date?: string | null
          ded_activity_code?: string | null
          expiry_date?: string | null
          issue_date?: string | null
          legal_type_ar?: string | null
          legal_type_en?: string | null
          licence_key?: string | null
          licence_number?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
          status_ar?: string | null
          status_en?: string | null
          trade_name_ar?: string | null
          trade_name_en?: string | null
        }
        Update: {
          activity_name_ar?: string | null
          activity_name_en?: string | null
          activity_type_id?: string | null
          cancel_date?: string | null
          ded_activity_code?: string | null
          expiry_date?: string | null
          issue_date?: string | null
          legal_type_ar?: string | null
          legal_type_en?: string | null
          licence_key?: string | null
          licence_number?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
          status_ar?: string | null
          status_en?: string | null
          trade_name_ar?: string | null
          trade_name_en?: string | null
        }
        Relationships: []
      }
      dld_directory_office_activities_public: {
        Row: {
          activity_key: string | null
          activity_name_ar: string | null
          activity_name_en: string | null
          activity_type_id: string | null
          ded_activity_code: string | null
          office_id: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          activity_key?: string | null
          activity_name_ar?: string | null
          activity_name_en?: string | null
          activity_type_id?: string | null
          ded_activity_code?: string | null
          office_id?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          activity_key?: string | null
          activity_name_ar?: string | null
          activity_name_en?: string | null
          activity_type_id?: string | null
          ded_activity_code?: string | null
          office_id?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dld_directory_office_activities_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices"
            referencedColumns: ["office_id"]
          },
          {
            foreignKeyName: "dld_directory_office_activities_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_offices_public"
            referencedColumns: ["office_id"]
          },
        ]
      }
      dld_directory_offices_public: {
        Row: {
          is_branch: boolean | null
          licence_expiry_date: string | null
          licence_issue_date: string | null
          licence_number: string | null
          licence_source_ar: string | null
          licence_source_en: string | null
          name_ar: string | null
          name_en: string | null
          office_id: string | null
          office_number: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          is_branch?: boolean | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          name_ar?: string | null
          name_en?: string | null
          office_id?: string | null
          office_number?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          is_branch?: boolean | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          licence_number?: string | null
          licence_source_ar?: string | null
          licence_source_en?: string | null
          name_ar?: string | null
          name_en?: string | null
          office_id?: string | null
          office_number?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: []
      }
      dld_directory_owner_associations_public: {
        Row: {
          association_key: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string | null
          source_export_date: string | null
        }
        Insert: {
          association_key?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Update: {
          association_key?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
        }
        Relationships: []
      }
      dld_directory_permits_public: {
        Row: {
          end_date: string | null
          exhibition_name_ar: string | null
          exhibition_name_en: string | null
          licence_number: string | null
          main_service_ar: string | null
          main_service_en: string | null
          participant_name_ar: string | null
          participant_name_en: string | null
          permit_id: string | null
          permit_number: string | null
          service_ar: string | null
          service_en: string | null
          service_id: string | null
          source_dataset: string | null
          source_export_date: string | null
          start_date: string | null
          status_ar: string | null
          status_en: string | null
        }
        Insert: {
          end_date?: string | null
          exhibition_name_ar?: string | null
          exhibition_name_en?: string | null
          licence_number?: string | null
          main_service_ar?: string | null
          main_service_en?: string | null
          participant_name_ar?: string | null
          participant_name_en?: string | null
          permit_id?: string | null
          permit_number?: string | null
          service_ar?: string | null
          service_en?: string | null
          service_id?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
          start_date?: string | null
          status_ar?: string | null
          status_en?: string | null
        }
        Update: {
          end_date?: string | null
          exhibition_name_ar?: string | null
          exhibition_name_en?: string | null
          licence_number?: string | null
          main_service_ar?: string | null
          main_service_en?: string | null
          participant_name_ar?: string | null
          participant_name_en?: string | null
          permit_id?: string | null
          permit_number?: string | null
          service_ar?: string | null
          service_en?: string | null
          service_id?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
          start_date?: string | null
          status_ar?: string | null
          status_en?: string | null
        }
        Relationships: []
      }
      dld_directory_projects_public: {
        Row: {
          area_id: string | null
          area_name_ar: string | null
          area_name_en: string | null
          cancellation_date: string | null
          completion_date: string | null
          developer_id: string | null
          developer_number: string | null
          escrow_agent_number: string | null
          master_developer_id: string | null
          name_ar: string | null
          name_en: string | null
          no_of_buildings: number | null
          no_of_units: number | null
          no_of_villas: number | null
          percent_completed: number | null
          project_end_date: string | null
          project_id: string | null
          project_number: string | null
          project_start_date: string | null
          source_dataset: string | null
          source_export_date: string | null
          source_name: string | null
          status_ar: string | null
          status_en: string | null
        }
        Insert: {
          area_id?: string | null
          area_name_ar?: string | null
          area_name_en?: string | null
          cancellation_date?: string | null
          completion_date?: string | null
          developer_id?: string | null
          developer_number?: string | null
          escrow_agent_number?: string | null
          master_developer_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          no_of_buildings?: number | null
          no_of_units?: number | null
          no_of_villas?: number | null
          percent_completed?: number | null
          project_end_date?: string | null
          project_id?: string | null
          project_number?: string | null
          project_start_date?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
          source_name?: string | null
          status_ar?: string | null
          status_en?: string | null
        }
        Update: {
          area_id?: string | null
          area_name_ar?: string | null
          area_name_en?: string | null
          cancellation_date?: string | null
          completion_date?: string | null
          developer_id?: string | null
          developer_number?: string | null
          escrow_agent_number?: string | null
          master_developer_id?: string | null
          name_ar?: string | null
          name_en?: string | null
          no_of_buildings?: number | null
          no_of_units?: number | null
          no_of_villas?: number | null
          percent_completed?: number | null
          project_end_date?: string | null
          project_id?: string | null
          project_number?: string | null
          project_start_date?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
          source_name?: string | null
          status_ar?: string | null
          status_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dld_directory_projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_communities"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_communities_public"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers_public"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_escrow_agent_number_fkey"
            columns: ["escrow_agent_number"]
            isOneToOne: false
            referencedRelation: "dld_directory_escrow_agents"
            referencedColumns: ["escrow_agent_number"]
          },
          {
            foreignKeyName: "dld_directory_projects_escrow_agent_number_fkey"
            columns: ["escrow_agent_number"]
            isOneToOne: false
            referencedRelation: "dld_directory_escrow_agents_public"
            referencedColumns: ["escrow_agent_number"]
          },
          {
            foreignKeyName: "dld_directory_projects_master_developer_id_fkey"
            columns: ["master_developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers"
            referencedColumns: ["developer_id"]
          },
          {
            foreignKeyName: "dld_directory_projects_master_developer_id_fkey"
            columns: ["master_developer_id"]
            isOneToOne: false
            referencedRelation: "dld_directory_developers_public"
            referencedColumns: ["developer_id"]
          },
        ]
      }
      dld_directory_valuators_public: {
        Row: {
          company_name_ar: string | null
          company_name_en: string | null
          licence_end_date: string | null
          licence_start_date: string | null
          name_ar: string | null
          name_en: string | null
          source_dataset: string | null
          source_export_date: string | null
          valuation_company_number: string | null
          valuator_key: string | null
          valuator_number: string | null
        }
        Insert: {
          company_name_ar?: string | null
          company_name_en?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
          valuation_company_number?: string | null
          valuator_key?: string | null
          valuator_number?: string | null
        }
        Update: {
          company_name_ar?: string | null
          company_name_en?: string | null
          licence_end_date?: string | null
          licence_start_date?: string | null
          name_ar?: string | null
          name_en?: string | null
          source_dataset?: string | null
          source_export_date?: string | null
          valuation_company_number?: string | null
          valuator_key?: string | null
          valuator_number?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          check_user_id: string
        }
        Returns: boolean
      }
      link_transactions_to_areas: { Args: never; Returns: number }
      refresh_area_stats: { Args: never; Returns: number }
      trigger_dld_sync: {
        Args: { dataset?: string; trigger_source?: string }
        Returns: number
      }
      trigger_lead_nurture: { Args: never; Returns: number }
    }
    Enums: {
      advisor_channel: "chat" | "voice"
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
      conversion_destination: "meta_capi" | "google_ads" | "ga4"
      conversion_status: "pending" | "sent" | "failed" | "skipped"
      data_provenance: "dld_open_data" | "sample"
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
      advisor_channel: ["chat", "voice"],
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
      conversion_destination: ["meta_capi", "google_ads", "ga4"],
      conversion_status: ["pending", "sent", "failed", "skipped"],
      data_provenance: ["dld_open_data", "sample"],
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
