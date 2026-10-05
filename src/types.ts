export interface LookupOption {
  id: string
  name: string
}

export interface Book {
  id: string
  title: string
  author: string | null
  publisher: string | null
  type_id: string
  placement_id: string
  quantity: number
  type?: LookupOption | null
  placement?: LookupOption | null
}

export interface BookFormData {
  title: string
  author: string
  publisher: string
  type_id: string
  quantity: number
  placement_id: string
}

export const emptyBookForm: BookFormData = {
  title: '',
  author: '',
  publisher: '',
  type_id: '',
  quantity: 1,
  placement_id: '',
}
