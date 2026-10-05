export const BookType = {
  FICTION_1: 'fiction_1',
  FICTION_2: 'fiction_2',
  EDUCATION: 'education',
  MAGAZINE: 'magazine',
  GAMES: 'games',
  OTHER: 'other'
} as const
export type BookType = typeof BookType[keyof typeof BookType]

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  [BookType.FICTION_1]: 'Beletrie 1. stupeň',
  [BookType.FICTION_2]: 'Beletrie 2. stupeň',
  [BookType.EDUCATION]: 'Odborná literatura',
  [BookType.MAGAZINE]: 'Časopis',
  [BookType.GAMES]: 'Hry',
  [BookType.OTHER]: 'Ostatní'
}

export const Placement = {
  R1: 'R1',
  R2: 'R2',
  R3: 'R3',
  R4: 'R4',
  R5: 'R5'
} as const
export type Placement = typeof Placement[keyof typeof Placement]

export interface Book {
  id: string
  title: string
  author: string | null
  publisher: string | null
  type: BookType
  quantity: number
  placement: Placement
}

export interface BookFormData {
  title: string
  author: string
  publisher: string
  type: BookType
  quantity: number
  placement: Placement
}

export const initialFormState: BookFormData = {
  title: '',
  author: '',
  publisher: '',
  type: BookType.FICTION_1,
  quantity: 1,
  placement: Placement.R1
}
