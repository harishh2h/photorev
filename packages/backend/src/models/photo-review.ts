export const PHOTO_REVIEWS_TABLE = 'photo_reviews'

export type ReviewDecision = -1 | 1 | null

export interface PhotoReview {
  id: string
  photo_id: string
  user_id: string
  library_id: string
  seen: boolean
  decision: ReviewDecision
  renamed_to: string | null
  seen_at: Date
  voted_at: Date | null
}

export interface PhotoReviewInsert {
  photo_id: string
  user_id: string
  library_id: string
  seen?: boolean
  decision?: ReviewDecision
  renamed_to?: string | null
  voted_at?: Date | null
}
