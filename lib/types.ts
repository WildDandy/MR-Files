export interface ExecutiveDirector {
  id: string
  name: string
}

export interface Secretary {
  id: string
  name: string
  executive_director_id: string
}

export interface Division {
  id: string
  name: string
  secretary_id: string
}

export interface Department {
  id: string
  name: string
  division_id: string
}

export interface Document {
  id: string
  title: string
  description: string | null
  file_url: string | null
  file_type: string | null
  executive_director_id: string | null
  secretary_id: string | null
  division_id: string | null
  department_id: string | null
  classified_by: string | null
  classified_at: string | null
  created_at: string
  updated_at: string
  // Additional fields from migrations
  status?: string | null
  location?: string | null
  access_level?: string | null
  priority?: string | null
  document_type_id?: string | null
  folder_id?: string | null
  path?: string | null
  group_name?: string | null
}

// Database type for Supabase typing (simplified version)
export type Database = {
  public: {
    Tables: {
      documents: {
        Row: Document
      }
      executive_directors: {
        Row: ExecutiveDirector
      }
      secretaries: {
        Row: Secretary
      }
      divisions: {
        Row: Division
      }
      departments: {
        Row: Department
      }
    }
  }
}
