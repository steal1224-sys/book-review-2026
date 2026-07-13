export interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface Review {
  id: number;
  bookTitle: string;
  author: string;
  student: string;
  penName?: string;
  content: string;
  rating: number;
  isPublic: boolean;
  reactions: Record<string, number>;
  isAiGenerated?: boolean;
  coverImageUrl?: string;
  comments?: Comment[];
  createdAt: string;
}

export type FilterType = "all" | "public" | "private";

export interface BookSeed {
  id: number;
  bookTitle: string;
  author: string;
  publishYear: string;
  coverImageUrl?: string;
  keyword: string;
  relatedSentence: string;
  createdAt: string;
}
