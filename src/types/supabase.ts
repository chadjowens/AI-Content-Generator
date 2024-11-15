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
      content: {
        Row: {
          id: number
          created_at: string
          prompt: string
          generated_content: string
          user_id: string
        }
        Insert: {
          id?: number
          created_at?: string
          prompt: string
          generated_content: string
          user_id: string
        }
        Update: {
          id?: number
          created_at?: string
          prompt?: string
          generated_content?: string
          user_id?: string
        }
      }
    }
  }
}