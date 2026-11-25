export type UserRole = 'admin' | 'teacher'

export interface LookupOption {
  id: string
  name: string
}

export interface AppSettings {
  /** Výchozí délka výpůjčky ve dnech. */
  loan_days: number
  /** Výchozí délka prodloužení výpůjčky ve dnech. */
  extension_days: number
}

export interface Loan {
  id: string
  book_id: Book['id']
  class_id: string
  /** Zkrácené jméno žáka; po vrácení je vždy null (GDPR). */
  borrower_name: string | null
  /** Datum ve formátu YYYY-MM-DD */
  loaned_at: string
  /** Datum ve formátu YYYY-MM-DD */
  due_date: string
  returned_at: string | null
  created_at: string
  created_by: string | null
  created_by_email: string | null
  book?: Pick<Book, 'id' | 'title' | 'author'> | null
  class?: LookupOption | null
}

export interface LoanFormData {
  book_id: Book['id']
  class_id: string
  borrower_name: string
  /** Datum ve formátu YYYY-MM-DD */
  loaned_at: string
  /** Datum ve formátu YYYY-MM-DD */
  due_date: string
}

export type LoanUpdateData = Omit<LoanFormData, 'book_id'>

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
