import prisma from '../../../config/database';
import QueryBuilder from '../../builder/QueryBuilder';
import { uploadImages, deleteImages } from '../../../shared/cloudinary';
import { IItem, ICreateItem, IUpdateItem, IItemFilters, IItemPagination, IItemResponse } from './item.interface';
import ApiError from '../../../errors/ApiError';
import { aiService } from '../ai/ai.service';
import { IContentGenerationRequest } from '../ai/ai.interface';

const createItem = async (userId: string, payload: ICreateItem, files?: { buffer: Buffer; mimetype: string }[]): Promise<IItem> => {
  console.log('🔄 Creating item for user:', userId, payload);

  let imageUrls: string[] = [];

  // Upload images to Cloudinary - images are optional for development
  if (files && files.length > 0) {
    console.log('📤 Starting image upload process...');
    console.log('Number of files to upload:', files.length);
    console.log('File details:', files.map(f => ({ mimetype: f.mimetype, bufferSize: f.buffer.length })));

    try {
      console.log('📤 Uploading images to Cloudinary...');
      const uploadResults = await uploadImages(files, 'items');
      imageUrls = uploadResults.map(result => result.secure_url);
      console.log('✅ Images uploaded successfully:', imageUrls.length, 'images');
      console.log('Image URLs:', imageUrls);
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      console.log('Continuing without images...');
      // Continue without images for development
    }

    // Ensure we have at least one image URL
    if (imageUrls.length === 0) {
      throw new ApiError(400, 'Failed to process images');
    }
  }

  // Images are optional — continue even if no images were uploaded

  // If AI generation is requested, generate description and tags
  if (payload.isAIContent) {
    try {
      const aiRequest: IContentGenerationRequest = {
        type: 'item-description',
        topic: payload.title,
        keywords: payload.tags,
        category: payload.category,
      };

      const aiResult = await aiService.generateItemContent(aiRequest);

      if (aiResult.title && !payload.title) payload.title = aiResult.title;
      if (aiResult.description && !payload.description) payload.description = aiResult.description;
      if (aiResult.tags && aiResult.tags.length > 0) payload.tags = [...new Set([...(payload.tags || []), ...aiResult.tags])];

      console.log('✅ AI generated content applied to item:', { title: payload.title, tags: payload.tags });
    } catch (err) {
      console.error('❌ AI generation failed, continuing without AI content:', err);
    }
  }

    const item = await prisma.item.create({
      data: {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        location: payload.location,
        category: payload.category || 'uncategorized',
        tags: payload.tags || [],
        images: imageUrls,
        isAIContent: payload.isAIContent || false,
        quantity: 1,
        status: 'PENDING',
        ownerId: userId,
      },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  console.log('✅ Item created successfully:', item.id);
  return item as IItem;
};

const getItems = async (
  filters: IItemFilters = {},
  pagination: IItemPagination = {}
): Promise<IItemResponse> => {
  console.log('🔍 Getting items with filters:', filters, 'pagination:', pagination);

  const where: any = {}; 

  // By default only include APPROVED items unless includeAll flag is explicitly true
  const includeAllFlag = filters.includeAll === true || filters.includeAll === 'true';
  if (!includeAllFlag) {
    where.status = 'APPROVED';
  } else {
    // explicitly allow admin to pass includeAll=true
  }

  // Search across several fields
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.category) where.category = filters.category;
  if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
  if (filters.isAIContent !== undefined) where.isAIContent = filters.isAIContent;

  // price range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {} as any;
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  // tags (array of strings)
  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags } as any;
  }

  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const sortBy = (pagination.sortBy as string) || 'createdAt';
  const sortOrder = (pagination.sortOrder as string) === 'asc' ? 'asc' : 'desc';

  const [result, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder as any },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        reviews: { select: { rating: true } },
      },
    }),
    prisma.item.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const itemsWithRating = result.map((item: any) => ({
    ...item,
    rating: item.reviews && item.reviews.length > 0
      ? item.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / item.reviews.length
      : 0,
    reviewCount: item.reviews ? item.reviews.length : 0,
  }));

  console.log(`✅ Retrieved ${result.length} items (page ${page}/${totalPages})`);

  return {
    items: itemsWithRating as IItem[],
    meta: { page, limit, total, totalPages },
  };
};

const getItemById = async (itemId: string): Promise<IItem> => {
  console.log('🔍 Getting item by ID:', itemId);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    console.log('❌ Item not found:', itemId);
    throw new ApiError(404, 'Item not found');
  }

  // Calculate average rating
  const rating = item.reviews.length > 0
    ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length
    : 0;

  console.log('✅ Item retrieved:', item.title);
  return { ...item, rating } as IItem;
};

const updateItem = async (itemId: string, userId: string, payload: IUpdateItem): Promise<IItem> => {
  console.log('🔄 Updating item:', itemId, 'by user:', userId, payload);

  // Check if item exists and user owns it
  const existingItem = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (!existingItem) {
    console.log('❌ Item not found:', itemId);
    throw new ApiError(404, 'Item not found');
  }

  if (existingItem.ownerId !== userId) {
    console.log('❌ Unauthorized: User', userId, 'does not own item', itemId);
    throw new ApiError(403, 'You can only update your own items');
  }

  let imageUrls: string[] = existingItem.images;

  // Handle image updates
  if (payload.images !== undefined) {
    try {
      if (payload.images.length > 0) {
        // Upload new images
        console.log('📤 Uploading new images...');
        const uploadResults = await uploadImages(payload.images, 'items');
        const newImageUrls = uploadResults.map(result => result.secure_url);

        // Combine existing and new images
        imageUrls = [...existingItem.images, ...newImageUrls];
        console.log('✅ New images added');
      } else if (payload.images.length === 0) {
        // Remove all images
        console.log('🗑️ Removing all images...');
        // Extract public IDs from existing image URLs for deletion
        const publicIds = existingItem.images.map(url => {
          const parts = url.split('/');
          const filename = parts[parts.length - 1];
          return `items/${filename.split('.')[0]}`;
        });
        await deleteImages(publicIds);
        imageUrls = [];
        console.log('✅ All images removed');
      }
    } catch (error) {
      console.error('❌ Image update failed:', error);
      throw new ApiError(500, 'Failed to update images');
    }
  }

  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      ...payload,
      images: imageUrls,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  console.log('✅ Item updated successfully:', updatedItem.title);
  return updatedItem as IItem;
};

const deleteItem = async (itemId: string, userId: string): Promise<void> => {
  console.log('🗑️ Deleting item:', itemId, 'by user:', userId);

  // Check if item exists and user owns it
  const existingItem = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (!existingItem) {
    console.log('❌ Item not found:', itemId);
    throw new ApiError(404, 'Item not found');
  }

  if (existingItem.ownerId !== userId) {
    console.log('❌ Unauthorized: User', userId, 'does not own item', itemId);
    throw new ApiError(403, 'You can only delete your own items');
  }

  // Delete images from Cloudinary
  if (existingItem.images && existingItem.images.length > 0) {
    try {
      console.log('🗑️ Deleting item images from Cloudinary...');
      // Extract public IDs from image URLs
      const publicIds = existingItem.images.map(url => {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return `items/${filename.split('.')[0]}`;
      });
      await deleteImages(publicIds);
      console.log('✅ Item images deleted from Cloudinary');
    } catch (error) {
      console.error('❌ Failed to delete images from Cloudinary:', error);
      // Continue with item deletion even if image deletion fails
    }
  }

  await prisma.item.delete({
    where: { id: itemId },
  });

  console.log('✅ Item deleted successfully');
};

const getMyItems = async (userId: string, pagination: IItemPagination = {}): Promise<IItemResponse> => {
  console.log('🔍 Getting my items for user:', userId);

  const filters: IItemFilters = { ownerId: userId };
  return getItems(filters, pagination);
};

const getPendingItems = async () => {
  return prisma.item.findMany({
    where: { status: 'PENDING' } as any,
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const updateItemStatus = async (itemId: string, status: string) => {
  return prisma.item.update({
    where: { id: itemId },
    data: { status } as any,
  });
};

export const itemService = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyItems,
  getPendingItems,
  updateItemStatus,
};