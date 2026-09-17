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
      airports: {
        Row: {
          iata_code: string
          name: string
          region: string
        }
        Insert: {
          iata_code: string
          name: string
          region: string
        }
        Update: {
          iata_code?: string
          name?: string
          region?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          technician_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          technician_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_users_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          asset_number: string
          created_at: string
          current_location_airport: string | null
          current_location_type: Database["public"]["Enums"]["location_type"]
          kind: Database["public"]["Enums"]["article_kind"]
          model_name: string
          physical_status: Database["public"]["Enums"]["article_physical_status"]
          serial_number: string
        }
        Insert: {
          asset_number: string
          created_at?: string
          current_location_airport?: string | null
          current_location_type: Database["public"]["Enums"]["location_type"]
          kind: Database["public"]["Enums"]["article_kind"]
          model_name: string
          physical_status?: Database["public"]["Enums"]["article_physical_status"]
          serial_number: string
        }
        Update: {
          asset_number?: string
          created_at?: string
          current_location_airport?: string | null
          current_location_type?: Database["public"]["Enums"]["location_type"]
          kind?: Database["public"]["Enums"]["article_kind"]
          model_name?: string
          physical_status?: Database["public"]["Enums"]["article_physical_status"]
          serial_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_current_location_airport_fkey"
            columns: ["current_location_airport"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata_code"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: unknown
          occurred_at: string
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown
          occurred_at?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown
          occurred_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_airports: {
        Row: {
          airport_iata: string
          commission_id: string
        }
        Insert: {
          airport_iata: string
          commission_id: string
        }
        Update: {
          airport_iata?: string
          commission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_airports_airport_iata_fkey"
            columns: ["airport_iata"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata_code"]
          },
          {
            foreignKeyName: "commission_airports_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_equipment: {
        Row: {
          commission_id: string
          equipment_id: string
          id: string
          intervened: boolean
        }
        Insert: {
          commission_id: string
          equipment_id: string
          id?: string
          intervened?: boolean
        }
        Update: {
          commission_id?: string
          equipment_id?: string
          id?: string
          intervened?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "commission_equipment_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "installed_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_technicians: {
        Row: {
          commission_id: string
          technician_id: string
        }
        Insert: {
          commission_id: string
          technician_id: string
        }
        Update: {
          commission_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_technicians_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_technicians_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_tool_checklist: {
        Row: {
          asset_number: string
          checked_at: string | null
          checked_by: string | null
          commission_id: string
          return_state: Database["public"]["Enums"]["tool_return_state"]
        }
        Insert: {
          asset_number: string
          checked_at?: string | null
          checked_by?: string | null
          commission_id: string
          return_state?: Database["public"]["Enums"]["tool_return_state"]
        }
        Update: {
          asset_number?: string
          checked_at?: string | null
          checked_by?: string | null
          commission_id?: string
          return_state?: Database["public"]["Enums"]["tool_return_state"]
        }
        Relationships: [
          {
            foreignKeyName: "commission_tool_checklist_asset_number_fkey"
            columns: ["asset_number"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["asset_number"]
          },
          {
            foreignKeyName: "commission_tool_checklist_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_tool_checklist_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          actual_arrival_date: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          id: string
          planned_arrival_date: string
          planned_departure_date: string
          status: Database["public"]["Enums"]["commission_status"]
          vehicle_id: string | null
        }
        Insert: {
          actual_arrival_date?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          planned_arrival_date: string
          planned_departure_date: string
          status?: Database["public"]["Enums"]["commission_status"]
          vehicle_id?: string | null
        }
        Update: {
          actual_arrival_date?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          planned_arrival_date?: string
          planned_departure_date?: string
          status?: Database["public"]["Enums"]["commission_status"]
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      installed_equipment: {
        Row: {
          aerial_verification_frequency_months: number
          airport_iata: string
          catalog_model_id: string
          created_at: string
          current_status: Database["public"]["Enums"]["operational_status"]
          id: string
          installed_at: string
          parent_equipment_id: string | null
        }
        Insert: {
          aerial_verification_frequency_months: number
          airport_iata: string
          catalog_model_id: string
          created_at?: string
          current_status?: Database["public"]["Enums"]["operational_status"]
          id?: string
          installed_at?: string
          parent_equipment_id?: string | null
        }
        Update: {
          aerial_verification_frequency_months?: number
          airport_iata?: string
          catalog_model_id?: string
          created_at?: string
          current_status?: Database["public"]["Enums"]["operational_status"]
          id?: string
          installed_at?: string
          parent_equipment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installed_equipment_airport_iata_fkey"
            columns: ["airport_iata"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata_code"]
          },
          {
            foreignKeyName: "installed_equipment_catalog_model_id_fkey"
            columns: ["catalog_model_id"]
            isOneToOne: false
            referencedRelation: "model_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installed_equipment_parent_equipment_id_fkey"
            columns: ["parent_equipment_id"]
            isOneToOne: false
            referencedRelation: "installed_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenances: {
        Row: {
          commission_id: string | null
          con_alarmas: boolean | null
          created_at: string
          equipment_id: string
          id: string
          next_due_date: string | null
          notes: string | null
          performed_at: string
          technician_id: string
          type: Database["public"]["Enums"]["maintenance_type"]
        }
        Insert: {
          commission_id?: string | null
          con_alarmas?: boolean | null
          created_at?: string
          equipment_id: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          performed_at?: string
          technician_id: string
          type: Database["public"]["Enums"]["maintenance_type"]
        }
        Update: {
          commission_id?: string | null
          con_alarmas?: boolean | null
          created_at?: string
          equipment_id?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          performed_at?: string
          technician_id?: string
          type?: Database["public"]["Enums"]["maintenance_type"]
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenances_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "installed_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenances_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      model_catalog: {
        Row: {
          brand: string
          created_at: string
          id: string
          model: string
          preventive_frequency_months: number
          type: Database["public"]["Enums"]["equipment_type"]
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          model: string
          preventive_frequency_months?: number
          type: Database["public"]["Enums"]["equipment_type"]
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          model?: string
          preventive_frequency_months?: number
          type?: Database["public"]["Enums"]["equipment_type"]
        }
        Relationships: []
      }
      movements: {
        Row: {
          asset_number: string
          batch_id: string
          commission_id: string | null
          destination_airport: string | null
          destination_type: Database["public"]["Enums"]["location_type"]
          id: string
          moved_at: string
          moved_by: string
          notes: string | null
          origin_airport: string | null
          origin_type: Database["public"]["Enums"]["location_type"]
          technician_id: string | null
        }
        Insert: {
          asset_number: string
          batch_id?: string
          commission_id?: string | null
          destination_airport?: string | null
          destination_type: Database["public"]["Enums"]["location_type"]
          id?: string
          moved_at?: string
          moved_by: string
          notes?: string | null
          origin_airport?: string | null
          origin_type: Database["public"]["Enums"]["location_type"]
          technician_id?: string | null
        }
        Update: {
          asset_number?: string
          batch_id?: string
          commission_id?: string | null
          destination_airport?: string | null
          destination_type?: Database["public"]["Enums"]["location_type"]
          id?: string
          moved_at?: string
          moved_by?: string
          notes?: string | null
          origin_airport?: string | null
          origin_type?: Database["public"]["Enums"]["location_type"]
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movements_asset_number_fkey"
            columns: ["asset_number"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["asset_number"]
          },
          {
            foreignKeyName: "movements_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_destination_airport_fkey"
            columns: ["destination_airport"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata_code"]
          },
          {
            foreignKeyName: "movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_origin_airport_fkey"
            columns: ["origin_airport"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata_code"]
          },
          {
            foreignKeyName: "movements_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts: {
        Row: {
          asset_number: string
          catalog_model_id: string
          spare_type: string
        }
        Insert: {
          asset_number: string
          catalog_model_id: string
          spare_type: string
        }
        Update: {
          asset_number?: string
          catalog_model_id?: string
          spare_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_asset_number_fkey"
            columns: ["asset_number"]
            isOneToOne: true
            referencedRelation: "articles"
            referencedColumns: ["asset_number"]
          },
          {
            foreignKeyName: "spare_parts_catalog_model_id_fkey"
            columns: ["catalog_model_id"]
            isOneToOne: false
            referencedRelation: "model_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          article_id: string | null
          changed_at: string
          changed_by: string
          commission_id: string | null
          entity_type: Database["public"]["Enums"]["status_entity_type"]
          equipment_id: string | null
          id: string
          manual_edit: boolean
          new_status: string
          previous_status: string | null
          reason: string | null
          transmitter_id: string | null
        }
        Insert: {
          article_id?: string | null
          changed_at?: string
          changed_by: string
          commission_id?: string | null
          entity_type: Database["public"]["Enums"]["status_entity_type"]
          equipment_id?: string | null
          id?: string
          manual_edit?: boolean
          new_status: string
          previous_status?: string | null
          reason?: string | null
          transmitter_id?: string | null
        }
        Update: {
          article_id?: string | null
          changed_at?: string
          changed_by?: string
          commission_id?: string | null
          entity_type?: Database["public"]["Enums"]["status_entity_type"]
          equipment_id?: string | null
          id?: string
          manual_edit?: boolean
          new_status?: string
          previous_status?: string | null
          reason?: string | null
          transmitter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "status_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["asset_number"]
          },
          {
            foreignKeyName: "status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "installed_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_transmitter_id_fkey"
            columns: ["transmitter_id"]
            isOneToOne: false
            referencedRelation: "transmitters"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          created_at: string
          dni: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          dni: string
          email: string
          full_name: string
          id?: string
        }
        Update: {
          created_at?: string
          dni?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          commission_id: string | null
          created_at: string
          created_by: string
          description: string
          equipment_id: string
          id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          transmitter_id: string | null
        }
        Insert: {
          commission_id?: string | null
          created_at?: string
          created_by: string
          description: string
          equipment_id: string
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          transmitter_id?: string | null
        }
        Update: {
          commission_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          equipment_id?: string
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          transmitter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "installed_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_transmitter_id_fkey"
            columns: ["transmitter_id"]
            isOneToOne: false
            referencedRelation: "transmitters"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          asset_number: string
          tool_type: string
        }
        Insert: {
          asset_number: string
          tool_type: string
        }
        Update: {
          asset_number?: string
          tool_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_asset_number_fkey"
            columns: ["asset_number"]
            isOneToOne: true
            referencedRelation: "articles"
            referencedColumns: ["asset_number"]
          },
        ]
      }
      transmitters: {
        Row: {
          equipment_id: string
          id: string
          label: Database["public"]["Enums"]["tx_label"]
          status: Database["public"]["Enums"]["operational_status"]
          updated_at: string
        }
        Insert: {
          equipment_id: string
          id?: string
          label: Database["public"]["Enums"]["tx_label"]
          status?: Database["public"]["Enums"]["operational_status"]
          updated_at?: string
        }
        Update: {
          equipment_id?: string
          id?: string
          label?: Database["public"]["Enums"]["tx_label"]
          status?: Database["public"]["Enums"]["operational_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transmitters_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "installed_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand_model: string | null
          created_at: string
          id: string
          license_plate: string
        }
        Insert: {
          brand_model?: string | null
          created_at?: string
          id?: string
          license_plate: string
        }
        Update: {
          brand_model?: string | null
          created_at?: string
          id?: string
          license_plate?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_upcoming_maintenance_due: {
        Row: {
          airport_iata: string | null
          days_remaining: number | null
          equipment_id: string | null
          next_due_date: string | null
          performed_at: string | null
          type: Database["public"]["Enums"]["maintenance_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "installed_equipment_airport_iata_fkey"
            columns: ["airport_iata"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["iata_code"]
          },
          {
            foreignKeyName: "maintenances_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "installed_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      rpc_check_tool_return: {
        Args: {
          p_asset_number: string
          p_commission_id: string
          p_notes?: string
          p_returned: boolean
        }
        Returns: undefined
      }
      rpc_close_commission: { Args: { p_commission_id: string }; Returns: Json }
      rpc_consume_spare_part: {
        Args: {
          p_asset_number: string
          p_commission_id: string
          p_notes?: string
        }
        Returns: undefined
      }
      rpc_create_article: {
        Args: {
          p_asset_number: string
          p_catalog_model_id?: string
          p_kind: Database["public"]["Enums"]["article_kind"]
          p_location_airport?: string
          p_location_type: Database["public"]["Enums"]["location_type"]
          p_model_name: string
          p_physical_status?: Database["public"]["Enums"]["article_physical_status"]
          p_serial_number: string
          p_spare_type?: string
          p_tool_type?: string
        }
        Returns: undefined
      }
      rpc_create_commission: {
        Args: {
          p_airport_iatas: string[]
          p_planned_arrival_date: string
          p_planned_departure_date: string
          p_technician_ids: string[]
          p_vehicle_id?: string
        }
        Returns: string
      }
      rpc_create_equipment: {
        Args: {
          p_aerial_verification_frequency_months: number
          p_airport_iata: string
          p_catalog_model_id: string
          p_dme_aerial_verification_frequency_months?: number
          p_dme_catalog_model_id?: string
          p_installed_at?: string
        }
        Returns: Json
      }
      rpc_record_maintenance: {
        Args: {
          p_commission_id: string
          p_con_alarmas?: boolean
          p_equipment_id: string
          p_notes?: string
          p_performed_at?: string
          p_technician_id: string
          p_type: Database["public"]["Enums"]["maintenance_type"]
        }
        Returns: string
      }
      rpc_record_movement_batch: {
        Args: {
          p_asset_numbers: string[]
          p_commission_id?: string
          p_destination_airport?: string
          p_destination_type: Database["public"]["Enums"]["location_type"]
          p_notes?: string
          p_technician_id?: string
        }
        Returns: string
      }
      rpc_return_article_to_workshop: {
        Args: {
          p_asset_number: string
          p_commission_id: string
          p_destination_type?: Database["public"]["Enums"]["location_type"]
          p_notes?: string
        }
        Returns: undefined
      }
      rpc_set_commission_arrival: {
        Args: { p_actual_arrival_date: string; p_commission_id: string }
        Returns: undefined
      }
      rpc_set_equipment_intervened: {
        Args: {
          p_commission_id: string
          p_equipment_id: string
          p_intervened: boolean
        }
        Returns: undefined
      }
      rpc_set_transmitter_status: {
        Args: {
          p_commission_id: string
          p_new_status: Database["public"]["Enums"]["operational_status"]
          p_transmitter_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "dev" | "tecnico"
      article_kind: "herramienta" | "repuesto"
      article_physical_status: "en_servicio" | "fuera_servicio" | "baja"
      commission_status: "planificada" | "en_curso" | "finalizada" | "cancelada"
      equipment_type: "VOR" | "ILS" | "DME"
      location_type: "aeropuerto" | "panol" | "taller"
      maintenance_type:
        | "preventivo_mensual"
        | "preventivo_semestral"
        | "preventivo_anual"
        | "correctivo"
        | "verificacion_aerea"
        | "preventivo_trimestral"
      operational_status: "en_servicio" | "degradado" | "fuera_servicio"
      status_entity_type: "equipo" | "transmisor" | "articulo"
      ticket_status: "pendiente" | "en_progreso" | "resuelto"
      tool_return_state: "pendiente" | "devuelta" | "no_devuelta"
      tx_label: "TX1" | "TX2"
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
      app_role: ["admin", "dev", "tecnico"],
      article_kind: ["herramienta", "repuesto"],
      article_physical_status: ["en_servicio", "fuera_servicio", "baja"],
      commission_status: ["planificada", "en_curso", "finalizada", "cancelada"],
      equipment_type: ["VOR", "ILS", "DME"],
      location_type: ["aeropuerto", "panol", "taller"],
      maintenance_type: [
        "preventivo_mensual",
        "preventivo_semestral",
        "preventivo_anual",
        "correctivo",
        "verificacion_aerea",
        "preventivo_trimestral",
      ],
      operational_status: ["en_servicio", "degradado", "fuera_servicio"],
      status_entity_type: ["equipo", "transmisor", "articulo"],
      ticket_status: ["pendiente", "en_progreso", "resuelto"],
      tool_return_state: ["pendiente", "devuelta", "no_devuelta"],
      tx_label: ["TX1", "TX2"],
    },
  },
} as const
