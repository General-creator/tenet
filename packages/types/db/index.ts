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
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          org_id: string
          email: string
          name: string | null
          role: Database['public']['Enums']['user_role']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          email: string
          name?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          email?: string
          name?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string
        }
      }
      hubs: {
        Row: {
          id: string
          org_id: string
          key: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          key: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          key?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sops: {
        Row: {
          id: string
          org_id: string
          hub_id: string | null
          sop_key: string
          name: string
          description: string | null
          version: number
          is_active: boolean
          definition: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          hub_id?: string | null
          sop_key: string
          name: string
          description?: string | null
          version?: number
          is_active?: boolean
          definition: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          hub_id?: string | null
          sop_key?: string
          name?: string
          description?: string | null
          version?: number
          is_active?: boolean
          definition?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          org_id: string
          hub_id: string | null
          agent_key: string
          name: string
          description: string | null
          specialization: string | null
          skills: Json
          memory_profile: string | null
          max_tokens: number | null
          config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          hub_id?: string | null
          agent_key: string
          name: string
          description?: string | null
          specialization?: string | null
          skills?: Json
          memory_profile?: string | null
          max_tokens?: number | null
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          hub_id?: string | null
          agent_key?: string
          name?: string
          description?: string | null
          specialization?: string | null
          skills?: Json
          memory_profile?: string | null
          max_tokens?: number | null
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tenet_requests: {
        Row: {
          id: string
          org_id: string
          hub_id: string | null
          user_id: string | null
          source: Database['public']['Enums']['request_source']
          raw_input: string
          intent: string | null
          sop_key: string | null
          priority: Database['public']['Enums']['request_priority']
          status: Database['public']['Enums']['request_status']
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          hub_id?: string | null
          user_id?: string | null
          source?: Database['public']['Enums']['request_source']
          raw_input: string
          intent?: string | null
          sop_key?: string | null
          priority?: Database['public']['Enums']['request_priority']
          status?: Database['public']['Enums']['request_status']
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          hub_id?: string | null
          user_id?: string | null
          source?: Database['public']['Enums']['request_source']
          raw_input?: string
          intent?: string | null
          sop_key?: string | null
          priority?: Database['public']['Enums']['request_priority']
          status?: Database['public']['Enums']['request_status']
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      routing_decisions: {
        Row: {
          id: string
          request_id: string
          org_id: string
          hub_id: string | null
          sop_id: string | null
          agent_id: string | null
          model_name: string | null
          qos_tier: Database['public']['Enums']['qos_tier'] | null
          estimated_cost: string | null
          estimated_tokens: number | null
          estimated_latency_ms: number | null
          decision_payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          org_id: string
          hub_id?: string | null
          sop_id?: string | null
          agent_id?: string | null
          model_name?: string | null
          qos_tier?: Database['public']['Enums']['qos_tier'] | null
          estimated_cost?: string | null
          estimated_tokens?: number | null
          estimated_latency_ms?: number | null
          decision_payload?: Json
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          org_id?: string
          hub_id?: string | null
          sop_id?: string | null
          agent_id?: string | null
          model_name?: string | null
          qos_tier?: Database['public']['Enums']['qos_tier'] | null
          estimated_cost?: string | null
          estimated_tokens?: number | null
          estimated_latency_ms?: number | null
          decision_payload?: Json
          created_at?: string
        }
      }
      execution_logs: {
        Row: {
          id: string
          request_id: string
          routing_id: string | null
          org_id: string
          hub_id: string | null
          agent_id: string | null
          sop_id: string | null
          step_name: string | null
          status: Database['public']['Enums']['execution_status']
          detail: string | null
          payload: Json
          tokens_used: number | null
          latency_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          routing_id?: string | null
          org_id: string
          hub_id?: string | null
          agent_id?: string | null
          sop_id?: string | null
          step_name?: string | null
          status: Database['public']['Enums']['execution_status']
          detail?: string | null
          payload?: Json
          tokens_used?: number | null
          latency_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          routing_id?: string | null
          org_id?: string
          hub_id?: string | null
          agent_id?: string | null
          sop_id?: string | null
          step_name?: string | null
          status?: Database['public']['Enums']['execution_status']
          detail?: string | null
          payload?: Json
          tokens_used?: number | null
          latency_ms?: number | null
          created_at?: string
        }
      }
      graph_nodes: {
        Row: {
          id: string
          org_id: string
          hub_id: string | null
          node_key: string
          node_type: string
          label: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          hub_id?: string | null
          node_key: string
          node_type: string
          label?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          hub_id?: string | null
          node_key?: string
          node_type?: string
          label?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      graph_edges: {
        Row: {
          id: string
          org_id: string
          from_node_id: string
          to_node_id: string
          relation_type: string
          weight: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          from_node_id: string
          to_node_id: string
          relation_type: string
          weight?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          from_node_id?: string
          to_node_id?: string
          relation_type?: string
          weight?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      memory_records: {
        Row: {
          id: string
          org_id: string
          hub_id: string | null
          agent_id: string | null
          sop_id: string | null
          user_id: string | null
          scope: Database['public']['Enums']['memory_scope']
          entity_key: string | null
          content: string
          embedding: number[] | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          hub_id?: string | null
          agent_id?: string | null
          sop_id?: string | null
          user_id?: string | null
          scope: Database['public']['Enums']['memory_scope']
          entity_key?: string | null
          content: string
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          hub_id?: string | null
          agent_id?: string | null
          sop_id?: string | null
          user_id?: string | null
          scope?: Database['public']['Enums']['memory_scope']
          entity_key?: string | null
          content?: string
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
        }
      }
      usage_records: {
        Row: {
          id: string
          org_id: string
          hub_id: string | null
          user_id: string | null
          request_id: string | null
          agent_id: string | null
          model_name: string | null
          qos_tier: Database['public']['Enums']['qos_tier'] | null
          tokens_prompt: number
          tokens_completion: number
          tokens_total: number
          cost: string | null
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          hub_id?: string | null
          user_id?: string | null
          request_id?: string | null
          agent_id?: string | null
          model_name?: string | null
          qos_tier?: Database['public']['Enums']['qos_tier'] | null
          tokens_prompt?: number
          tokens_completion?: number
          tokens_total?: number
          cost?: string | null
          period_start: string
          period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          hub_id?: string | null
          user_id?: string | null
          request_id?: string | null
          agent_id?: string | null
          model_name?: string | null
          qos_tier?: Database['public']['Enums']['qos_tier'] | null
          tokens_prompt?: number
          tokens_completion?: number
          tokens_total?: number
          cost?: string | null
          period_start?: string
          period_end?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'admin' | 'member' | 'viewer'
      request_source: 'console' | 'api' | 'integration'
      request_priority: 'low' | 'normal' | 'high'
      request_status: 'pending' | 'in_progress' | 'completed' | 'failed'
      qos_tier: 'bronze' | 'silver' | 'gold'
      execution_status: 'started' | 'success' | 'error'
      memory_scope: 'org' | 'hub' | 'agent' | 'user'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
