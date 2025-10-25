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
  file_url: string
  file_type: string | null
  executive_director_id: string
  secretary_id: string
  division_id: string
  department_id: string
  classified_by: string | null
  classified_at: string
  created_at: string
  updated_at: string
}
