import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { itemService } from './item.service';
import { ICreateItem, IUpdateItem, IItemFilters, IItemPagination } from './item.interface';

const createItem = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const allFiles = (req as any).files as { fieldname: string; buffer: Buffer; mimetype: string }[];

  // Filter only image files (fieldname = 'images')
  const imageFiles = allFiles?.filter(file => file.fieldname === 'images') || [];

  // Parse JSON data from 'data' field
  let parsedData;
  try {
    parsedData = JSON.parse((req as any).body.data);
    console.log('📨 Parsed JSON data:', parsedData);
  } catch (error) {
    console.error('❌ Failed to parse JSON data:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON data format',
    });
  }

  // Validate required fields
  const { title, description, price, location } = parsedData;
  // If category not provided, default to 'uncategorized' for AI generation/storage
  let category = parsedData.category || 'uncategorized';
  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  // If AI-generated content is enabled, description may be empty and will be filled later
  if (!parsedData.isAIContent) {
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }
  } else {
    // If AI content is enabled and description is present, still validate minimum length
    if (description && typeof description === 'string' && description.trim().length > 0 && description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }
  }
  if (!price || isNaN(Number(price)) || Number(price) <= 0) {
    errors.push('Price must be a valid positive number');
  }
  if (!location || typeof location !== 'string' || location.trim().length < 2) {
    errors.push('Location must be at least 2 characters');
  }
  // Category is optional; if not provided and not AI content, require it
  if (!parsedData.isAIContent) {
    if (!category || typeof category !== 'string' || category.trim().length < 2) {
      errors.push('Category must be at least 2 characters');
    }
  } else {
    // AI content: category optional; if provided, validate length
    if (category && (typeof category !== 'string' || category.trim().length < 2)) {
      errors.push('Category must be at least 2 characters');
    }
  }

  // Images are optional in development — no additional validation required here


  if (errors.length > 0) {
    console.log('❌ Validation errors:', errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorDetails: errors,
    });
  }

  // Parse and validate the item data
  const itemData: ICreateItem = {
    title: parsedData.title?.trim(),
    description: parsedData.description?.trim(),
    price: parseFloat(parsedData.price),
    quantity: parsedData.quantity !== undefined ? Number(parsedData.quantity) : 0,
    location: parsedData.location?.trim(),
    category: parsedData.category?.trim(),
    tags: parsedData.tags ? (Array.isArray(parsedData.tags) ? parsedData.tags : parsedData.tags.split(',').map((t: string) => t.trim())) : [],
    images: [], // Will be populated by Cloudinary URLs
    isAIContent: parsedData.isAIContent === 'true' || parsedData.isAIContent === true,
  };

  console.log('📨 Create item request - Raw body:', JSON.stringify((req as any).body, null, 2));
  console.log('📨 Create item request - All files:', allFiles?.length || 0);
  console.log('📨 Create item request - Image files:', imageFiles.length);
  console.log('📨 Create item request - Parsed data:', itemData);

  const result = await itemService.createItem(userId, itemData, imageFiles);

  console.log('✅ Item created successfully');
  sendResponse(res, 201, true, 'Item created successfully', result);
});

const getItems = catchAsync(async (req: Request, res: Response) => {
  const filters: IItemFilters = {
    search: req.query.search as string,
    category: req.query.category as string,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    location: req.query.location as string,
    isAIContent: req.query.isAIContent ? req.query.isAIContent === 'true' : undefined,
    tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    includeAll: req.query.includeAll as string | boolean | undefined,
    status: req.query.status as string | undefined,
  };

  const pagination: IItemPagination = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
  };

  console.log('📨 Get items request:', { filters, pagination });

  const result = await itemService.getItems(filters, pagination);

  console.log('✅ Items retrieved successfully');
  sendResponse(res, 200, true, 'Items retrieved successfully', result);
});

// Public: Get only approved items
const getApprovedItems = catchAsync(async (req: Request, res: Response) => {
  console.log('📨 getApprovedItems called - headers:', {
    origin: req.headers.origin,
    host: req.headers.host,
    ua: req.headers['user-agent'],
    auth: req.headers.authorization,
    query: req.query,
  });

  const filters: IItemFilters = {
    search: req.query.search as string,
    category: req.query.category as string,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    location: req.query.location as string,
    status: 'APPROVED',
  };

  const pagination: IItemPagination = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
  };

  const result = await itemService.getItems(filters, pagination);
  sendResponse(res, 200, true, 'Approved items retrieved successfully', result);
});

const getItemById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log('📨 Get item by ID request:', id);

  const result = await itemService.getItemById(Array.isArray(id) ? id[0] : id);

  console.log('✅ Item retrieved successfully');
  sendResponse(res, 200, true, 'Item retrieved successfully', result);
});

const updateItem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const updateData: IUpdateItem = req.body;

  console.log('📨 Update item request:', { id, userId, updateData });

  const result = await itemService.updateItem(Array.isArray(id) ? id[0] : id, userId, updateData);

  console.log('✅ Item updated successfully');
  sendResponse(res, 200, true, 'Item updated successfully', result);
});

const deleteItem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  console.log('📨 Delete item request:', { id, userId });

  await itemService.deleteItem(Array.isArray(id) ? id[0] : id, userId);

  console.log('✅ Item deleted successfully');
  sendResponse(res, 200, true, 'Item deleted successfully');
});

const getMyItems = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const pagination: IItemPagination = {
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as ('asc' | 'desc'),
  };

  console.log('📨 Get my items request:', { userId, pagination });

  const result = await itemService.getMyItems(userId, pagination);

  console.log('✅ My items retrieved successfully');
  sendResponse(res, 200, true, 'My items retrieved successfully', result);
});

// Admin: Get pending items
const getPendingItems = catchAsync(async (req: Request, res: Response) => {
  const result = await itemService.getPendingItems();
  sendResponse(res, 200, true, 'Pending items retrieved', result);
});

// Admin: Approve item
const approveItem = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await itemService.updateItemStatus(id, 'APPROVED');
  sendResponse(res, 200, true, 'Item approved successfully', result);
});

// Admin: Reject item
const rejectItem = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await itemService.updateItemStatus(id, 'REJECTED');
  sendResponse(res, 200, true, 'Item rejected', result);
});

export const itemController = {
  createItem,
  getItems,
  getApprovedItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyItems,
  getPendingItems,
  approveItem,
  rejectItem,
};