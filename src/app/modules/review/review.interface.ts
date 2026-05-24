export interface IReview {
  id: string;
  comment: string;
  rating: number;
  userId: string;
  itemId: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  item?: {
    id: string;
    title: string;
    category: string;
  };
}

export interface ICreateReview {
  comment: string;
  rating: number;
  itemId: string;
}

export interface IUpdateReview {
  comment?: string;
  rating?: number;
}

export interface IReviewFilters {
  itemId?: string;
  userId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
}

export interface IReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface IReviewResponse {
  reviews: IReview[];
  stats?: IReviewStats;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}