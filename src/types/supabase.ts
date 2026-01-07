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
      asset_collection_items: {
        Row: {
          asset_id: string
          collection_id: string
          id: string
          order_index: number | null
        }
        Insert: {
          asset_id: string
          collection_id: string
          id?: string
          order_index?: number | null
        }
        Update: {
          asset_id?: string
          collection_id?: string
          id?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_collection_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "asset_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_collections: {
        Row: {
          brand_id: string
          cover_asset_id: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          cover_asset_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          cover_asset_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_collections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_collections_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_folders: {
        Row: {
          brand_id: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_folder_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_folder_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_folder_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_folders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "asset_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_transformations: {
        Row: {
          asset_id: string
          created_at: string
          file_size: number | null
          format: string
          grayscale: boolean | null
          height: number | null
          id: string
          quality: number | null
          transformed_path: string
          width: number | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          file_size?: number | null
          format?: string
          grayscale?: boolean | null
          height?: number | null
          id?: string
          quality?: number | null
          transformed_path: string
          width?: number | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          file_size?: number | null
          format?: string
          grayscale?: boolean | null
          height?: number | null
          id?: string
          quality?: number | null
          transformed_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_transformations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          ai_colors: string[] | null
          ai_description: string | null
          ai_tags: string[] | null
          alt_text: string | null
          brand_id: string
          category: string | null
          created_at: string
          dimensions: Json | null
          file_path: string
          file_size: number
          file_type: string
          folder_name: string | null
          height: number | null
          id: string
          is_archived: boolean | null
          metadata: Json | null
          mime_type: string
          name: string
          parent_asset_id: string | null
          processing_status: string | null
          source: string | null
          tags: string[] | null
          thumbnail_path: string | null
          updated_at: string
          uploaded_by: string
          version: number | null
          width: number | null
        }
        Insert: {
          ai_colors?: string[] | null
          ai_description?: string | null
          ai_tags?: string[] | null
          alt_text?: string | null
          brand_id: string
          category?: string | null
          created_at?: string
          dimensions?: Json | null
          file_path: string
          file_size: number
          file_type: string
          folder_name?: string | null
          height?: number | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          mime_type: string
          name: string
          parent_asset_id?: string | null
          processing_status?: string | null
          source?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          updated_at?: string
          uploaded_by: string
          version?: number | null
          width?: number | null
        }
        Update: {
          ai_colors?: string[] | null
          ai_description?: string | null
          ai_tags?: string[] | null
          alt_text?: string | null
          brand_id?: string
          category?: string | null
          created_at?: string
          dimensions?: Json | null
          file_path?: string
          file_size?: number
          file_type?: string
          folder_name?: string | null
          height?: number | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          mime_type?: string
          name?: string
          parent_asset_id?: string | null
          processing_status?: string | null
          source?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          updated_at?: string
          uploaded_by?: string
          version?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          ai_generated: boolean | null
          ai_model: string | null
          ai_prompt: string | null
          content: Json
          created_at: string
          description: string | null
          id: string
          is_visible: boolean | null
          order_index: number | null
          page_id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          ai_model?: string | null
          ai_prompt?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean | null
          order_index?: number | null
          page_id: string
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          ai_model?: string | null
          ai_prompt?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean | null
          order_index?: number | null
          page_id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_fonts: {
        Row: {
          brand_id: string
          category: string | null
          created_at: string
          family: string
          figma_postscript_name: string | null
          file_name: string
          file_path: string
          file_size: number
          format: string
          google_fonts_url: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          source: string
          source_url: string | null
          style: string
          updated_at: string
          uploaded_by: string | null
          weight: number
        }
        Insert: {
          brand_id: string
          category?: string | null
          created_at?: string
          family: string
          figma_postscript_name?: string | null
          file_name: string
          file_path: string
          file_size: number
          format: string
          google_fonts_url?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          source?: string
          source_url?: string | null
          style?: string
          updated_at?: string
          uploaded_by?: string | null
          weight?: number
        }
        Update: {
          brand_id?: string
          category?: string | null
          created_at?: string
          family?: string
          figma_postscript_name?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          format?: string
          google_fonts_url?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          source?: string
          source_url?: string | null
          style?: string
          updated_at?: string
          uploaded_by?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_fonts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_members: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_members_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          ai_context_prompt: string | null
          created_at: string
          id: string
          is_public: boolean | null
          logo_url: string | null
          mission: string | null
          name: string
          owner_id: string
          personality: Json | null
          settings: Json | null
          slug: string
          updated_at: string
          values: string[] | null
          vision: string | null
          voice_tone: Json | null
        }
        Insert: {
          ai_context_prompt?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          mission?: string | null
          name: string
          owner_id: string
          personality?: Json | null
          settings?: Json | null
          slug: string
          updated_at?: string
          values?: string[] | null
          vision?: string | null
          voice_tone?: Json | null
        }
        Update: {
          ai_context_prompt?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          mission?: string | null
          name?: string
          owner_id?: string
          personality?: Json | null
          settings?: Json | null
          slug?: string
          updated_at?: string
          values?: string[] | null
          vision?: string | null
          voice_tone?: Json | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      template_versions: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string
          root_node: Json
          template_id: string
          version_number: number
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          root_node: Json
          template_id: string
          version_number: number
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          root_node?: Json
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          ai_generated: boolean | null
          brand_id: string
          category: Database["public"]["Enums"]["template_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          format: Database["public"]["Enums"]["template_format"]
          id: string
          is_archived: boolean | null
          is_public: boolean | null
          name: string
          root_node: Json
          schema_version: number
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          brand_id: string
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          format?: Database["public"]["Enums"]["template_format"]
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          name: string
          root_node: Json
          schema_version?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          brand_id?: string
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          format?: Database["public"]["Enums"]["template_format"]
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          name?: string
          root_node?: Json
          schema_version?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_template_version: {
        Args: { p_comment?: string; p_template_id: string }
        Returns: string
      }
      get_asset_url: {
        Args: {
          p_asset_id: string
          p_format?: string
          p_grayscale?: boolean
          p_height?: number
          p_width?: number
        }
        Returns: string
      }
      restore_template_version: {
        Args: { p_version_id: string }
        Returns: boolean
      }
    }
    Enums: {
      asset_category:
        | "logo"
        | "image"
        | "typography"
        | "document"
        | "icon"
        | "video"
        | "other"
      asset_source: "upload" | "ai_generated" | "imported" | "transformed"
      member_role: "owner" | "admin" | "editor" | "viewer"
      template_category:
        | "social_instagram"
        | "social_linkedin"
        | "social_twitter"
        | "social_facebook"
        | "print_business_card"
        | "print_flyer"
        | "print_poster"
        | "print_one_pager"
        | "digital_web_banner"
        | "digital_email_header"
        | "digital_newsletter"
        | "presentation"
        | "report"
        | "other"
      template_format:
        | "instagram_post"
        | "instagram_story"
        | "instagram_reel"
        | "linkedin_post"
        | "linkedin_banner"
        | "twitter_post"
        | "facebook_post"
        | "facebook_cover"
        | "business_card"
        | "flyer_a5"
        | "flyer_a4"
        | "poster_a3"
        | "one_pager"
        | "web_banner_leaderboard"
        | "web_banner_medium"
        | "web_banner_skyscraper"
        | "email_header"
        | "custom"
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
      asset_category: [
        "logo",
        "image",
        "typography",
        "document",
        "icon",
        "video",
        "other",
      ],
      asset_source: ["upload", "ai_generated", "imported", "transformed"],
      member_role: ["owner", "admin", "editor", "viewer"],
      template_category: [
        "social_instagram",
        "social_linkedin",
        "social_twitter",
        "social_facebook",
        "print_business_card",
        "print_flyer",
        "print_poster",
        "print_one_pager",
        "digital_web_banner",
        "digital_email_header",
        "digital_newsletter",
        "presentation",
        "report",
        "other",
      ],
      template_format: [
        "instagram_post",
        "instagram_story",
        "instagram_reel",
        "linkedin_post",
        "linkedin_banner",
        "twitter_post",
        "facebook_post",
        "facebook_cover",
        "business_card",
        "flyer_a5",
        "flyer_a4",
        "poster_a3",
        "one_pager",
        "web_banner_leaderboard",
        "web_banner_medium",
        "web_banner_skyscraper",
        "email_header",
        "custom",
      ],
    },
  },
} as const
