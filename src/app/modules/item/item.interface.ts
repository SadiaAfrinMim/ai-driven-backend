import { Request } from 'express';

export interface IItem {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity?: number;
  location: string;
  rating: number;
  reviewCount?: number;
  category: string;
  tags: string[];
  images: string[];
  isAIContent: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateItem {
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  tags?: string[];
  images: string[]; // Images are required for item creation
  isAIContent?: boolean;
}



export interface IUpdateItem {
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  category?: string;
  tags?: string[];
  images?: string[]; // For now, only support URLs - multer handled in controller
  isAIContent?: boolean;
}

export interface IItemFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  ownerId?: string;
  isAIContent?: boolean;
  tags?: string[];
  includeAll?: boolean | string; // admin flag to include non-approved items
}

export interface IUpdateItem {
  title?: string;
  description?: string;
  price?: number;
  location?: string;
  category?: string;
  tags?: string[];
  images?: string[]; // For now, only support URLs - multer handled in controller
  isAIContent?: boolean;
}

export interface IItemPagination {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IItemResponse {
  items: IItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IItemPagination {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IItemResponse {
  items: IItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}