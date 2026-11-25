
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "check_ins": {
                  Row: {
                    "clean": boolean,"created_at": string,"date": string,"id": string,"mood": number,"note": string | null,"share_with_partner": boolean,"triggers": (string)[],"updated_at": string,"urge_level": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "clean": boolean,"created_at"?: string,"date": string,"id"?: string,"mood": number,"note"?: string | null,"share_with_partner"?: boolean,"triggers"?: (string)[],"updated_at"?: string,"urge_level": number,"user_id": string
                  }
                  Update: {
                    "clean"?: boolean,"created_at"?: string,"date"?: string,"id"?: string,"mood"?: number,"note"?: string | null,"share_with_partner"?: boolean,"triggers"?: (string)[],"updated_at"?: string,"urge_level"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "check_ins_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "check_ins_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"post_id": string,"removed_at": string | null,"removed_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"post_id": string,"removed_at"?: string | null,"removed_by"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"post_id"?: string,"removed_at"?: string | null,"removed_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_removed_by_fkey"
      columns: ["removed_by"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_removed_by_fkey"
      columns: ["removed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invites": {
                  Row: {
                    "code": string,"created_at": string,"created_by": string | null,"expires_at": string,"used_at": string | null,"used_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_used_by_fkey"
      columns: ["used_by"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_used_by_fkey"
      columns: ["used_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"partnerships": {
                  Row: {
                    "created_at": string,"id": string,"partner_id": string,"requester_id": string,"status": Database["public"]['Enums']["partnership_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"partner_id": string,"requester_id": string,"status"?: Database["public"]['Enums']["partnership_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"partner_id"?: string,"requester_id"?: string,"status"?: Database["public"]['Enums']["partnership_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "partnerships_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "partnerships_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "partnerships_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "partnerships_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"milestone_days": number | null,"removed_at": string | null,"removed_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"milestone_days"?: number | null,"removed_at"?: string | null,"removed_by"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"milestone_days"?: number | null,"removed_at"?: string | null,"removed_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_removed_by_fkey"
      columns: ["removed_by"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_removed_by_fkey"
      columns: ["removed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"longest_streak": number,"recovery_start_date": string | null,"role": Database["public"]['Enums']["member_role"],"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"longest_streak"?: number,"recovery_start_date"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"timezone"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"longest_streak"?: number,"recovery_start_date"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"timezone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reactions": {
                  Row: {
                    "created_at": string,"kind": Database["public"]['Enums']["reaction_kind"],"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"kind": Database["public"]['Enums']["reaction_kind"],"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"kind"?: Database["public"]['Enums']["reaction_kind"],"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "comment_id": string | null,"created_at": string,"id": string,"post_id": string | null,"reason": string,"reported_author_id": string | null,"reporter_id": string,"status": Database["public"]['Enums']["report_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string | null,"reason": string,"reported_author_id"?: string | null,"reporter_id": string,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Update: {
                    "comment_id"?: string | null,"created_at"?: string,"id"?: string,"post_id"?: string | null,"reason"?: string,"reported_author_id"?: string | null,"reporter_id"?: string,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reported_author_id_fkey"
      columns: ["reported_author_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reported_author_id_fkey"
      columns: ["reported_author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "member_directory": {
                  Row: {
                    "display_name": string | null,"id": string,"role": Database["public"]['Enums']["member_role"]
                  }
                  ComputedFields: never
                  Insert: {
                           "display_name"?: string | null,"id"?: string | null,"role"?: Database["public"]['Enums']["member_role"] | null
                         }
                        Update: {
                           "display_name"?: string | null,"id"?: string | null,"role"?: Database["public"]['Enums']["member_role"] | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "check_invite":
{ Args: { "invite_code": string }; Returns: boolean
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"is_active_partner":
{ Args: { "other": string }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_member":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_moderator":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"partner_check_ins":
{ Args: { "partner": string,"since"?: string }; Returns: {
              "clean": boolean,"date": string,"mood": number,"triggers": (string)[],"urge_level": number
            }[]
                           },
"set_comment_removed":
{ Args: { "removed": boolean,"target": string }; Returns: undefined
                           },
"set_member_role":
{ Args: { "member": string,"new_role": Database["public"]['Enums']["member_role"] }; Returns: undefined
                           },
"set_post_removed":
{ Args: { "removed": boolean,"target": string }; Returns: undefined
                           }
          }
          Enums: {
            "member_role": "member"|"moderator"|"admin","partnership_status": "pending"|"active"|"declined"|"ended","reaction_kind": "support"|"strength"|"prayer"|"well_done","report_status": "open"|"resolved"|"dismissed"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "member_role": ["member", "moderator", "admin"],"partnership_status": ["pending", "active", "declined", "ended"],"reaction_kind": ["support", "strength", "prayer", "well_done"],"report_status": ["open", "resolved", "dismissed"]
          }
        }
} as const
