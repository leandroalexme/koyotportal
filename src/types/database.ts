export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          slug: string
          owner_id: string
          mission: string | null
          vision: string | null
          values: string[] | null
          voice_tone: Json | null
          ai_generated_core: Json | null
          settings: Json | null
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          slug: string
          owner_id: string
          mission?: string | null
          vision?: string | null
          values?: string[] | null
          voice_tone?: Json | null
          ai_generated_core?: Json | null
          settings?: Json | null
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          slug?: string
          owner_id?: string
          mission?: string | null
          vision?: string | null
          values?: string[] | null
          voice_tone?: Json | null
          ai_generated_core?: Json | null
          settings?: Json | null
          is_public?: boolean
        }
      }
      guidelines: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          brand_id: string
          block_type: 'color' | 'typography' | 'logo' | 'imagery' | 'spacing' | 'custom'
          title: string
          description: string | null
          content: Json
          order_index: number
          is_published: boolean
          version: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          brand_id: string
          block_type: 'color' | 'typography' | 'logo' | 'imagery' | 'spacing' | 'custom'
          title: string
          description?: string | null
          content: Json
          order_index?: number
          is_published?: boolean
          version?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          brand_id?: string
          block_type?: 'color' | 'typography' | 'logo' | 'imagery' | 'spacing' | 'custom'
          title?: string
          description?: string | null
          content?: Json
          order_index?: number
          is_published?: boolean
          version?: number
        }
      }
      assets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          brand_id: string
          name: string
          file_path: string
          file_type: string
          file_size: number
          mime_type: string
          width: number | null
          height: number | null
          alt_text: string | null
          tags: string[] | null
          ai_tags: string[] | null
          ai_description: string | null
          metadata: Json | null
          version: number
          parent_asset_id: string | null
          is_archived: boolean
          uploaded_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          brand_id: string
          name: string
          file_path: string
          file_type: string
          file_size: number
          mime_type: string
          width?: number | null
          height?: number | null
          alt_text?: string | null
          tags?: string[] | null
          ai_tags?: string[] | null
          ai_description?: string | null
          metadata?: Json | null
          version?: number
          parent_asset_id?: string | null
          is_archived?: boolean
          uploaded_by: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          brand_id?: string
          name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          mime_type?: string
          width?: number | null
          height?: number | null
          alt_text?: string | null
          tags?: string[] | null
          ai_tags?: string[] | null
          ai_description?: string | null
          metadata?: Json | null
          version?: number
          parent_asset_id?: string | null
          is_archived?: boolean
          uploaded_by?: string
        }
      }
      asset_collections: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          brand_id: string
          name: string
          description: string | null
          cover_asset_id: string | null
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          brand_id: string
          name: string
          description?: string | null
          cover_asset_id?: string | null
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          brand_id?: string
          name?: string
          description?: string | null
          cover_asset_id?: string | null
          is_public?: boolean
        }
      }
      brand_members: {
        Row: {
          id: string
          created_at: string
          brand_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
        }
        Insert: {
          id?: string
          created_at?: string
          brand_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
        }
        Update: {
          id?: string
          created_at?: string
          brand_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      block_type: 'color' | 'typography' | 'logo' | 'imagery' | 'spacing' | 'custom'
      member_role: 'owner' | 'admin' | 'editor' | 'viewer'
    }
  }
}

export type Brand = Database['public']['Tables']['brands']['Row']
export type Guideline = Database['public']['Tables']['guidelines']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type AssetCollection = Database['public']['Tables']['asset_collections']['Row']
export type BrandMember = Database['public']['Tables']['brand_members']['Row']

export type BlockType = Database['public']['Enums']['block_type']
export type MemberRole = Database['public']['Enums']['member_role']
