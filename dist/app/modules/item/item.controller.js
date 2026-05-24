"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const item_service_1 = require("./item.service");
const createItem = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const allFiles = req.files;
    // Filter only image files (fieldname = 'images')
    const imageFiles = allFiles?.filter(file => file.fieldname === 'images') || [];
    // Parse JSON data from 'data' field
    let parsedData;
    try {
        parsedData = JSON.parse(req.body.data);
        console.log('📨 Parsed JSON data:', parsedData);
    }
    catch (error) {
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
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        errors.push('Title must be at least 3 characters');
    }
    // If AI-generated content is enabled, description may be empty and will be filled later
    if (!parsedData.isAIContent) {
        if (!description || typeof description !== 'string' || description.trim().length < 10) {
            errors.push('Description must be at least 10 characters');
        }
    }
    else {
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
    }
    else {
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
    const itemData = {
        title: parsedData.title?.trim(),
        description: parsedData.description?.trim(),
        price: parseFloat(parsedData.price),
        location: parsedData.location?.trim(),
        category: parsedData.category?.trim(),
        tags: parsedData.tags ? (Array.isArray(parsedData.tags) ? parsedData.tags : parsedData.tags.split(',').map((t) => t.trim())) : [],
        images: [], // Will be populated by Cloudinary URLs
        isAIContent: parsedData.isAIContent === 'true' || parsedData.isAIContent === true,
    };
    console.log('📨 Create item request - Raw body:', JSON.stringify(req.body, null, 2));
    console.log('📨 Create item request - All files:', allFiles?.length || 0);
    console.log('📨 Create item request - Image files:', imageFiles.length);
    console.log('📨 Create item request - Parsed data:', itemData);
    const result = await item_service_1.itemService.createItem(userId, itemData, imageFiles);
    console.log('✅ Item created successfully');
    (0, sendResponse_1.default)(res, 201, true, 'Item created successfully', result);
});
const getItems = (0, catchAsync_1.default)(async (req, res) => {
    const filters = {
        search: req.query.search,
        category: req.query.category,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        location: req.query.location,
        isAIContent: req.query.isAIContent ? req.query.isAIContent === 'true' : undefined,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
    };
    const pagination = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
    };
    console.log('📨 Get items request:', { filters, pagination });
    const result = await item_service_1.itemService.getItems(filters, pagination);
    console.log('✅ Items retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Items retrieved successfully', result);
});
const getItemById = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log('📨 Get item by ID request:', id);
    const result = await item_service_1.itemService.getItemById(Array.isArray(id) ? id[0] : id);
    console.log('✅ Item retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Item retrieved successfully', result);
});
const updateItem = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    console.log('📨 Update item request:', { id, userId, updateData });
    const result = await item_service_1.itemService.updateItem(Array.isArray(id) ? id[0] : id, userId, updateData);
    console.log('✅ Item updated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Item updated successfully', result);
});
const deleteItem = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    console.log('📨 Delete item request:', { id, userId });
    await item_service_1.itemService.deleteItem(Array.isArray(id) ? id[0] : id, userId);
    console.log('✅ Item deleted successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Item deleted successfully');
});
const getMyItems = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const pagination = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
    };
    console.log('📨 Get my items request:', { userId, pagination });
    const result = await item_service_1.itemService.getMyItems(userId, pagination);
    console.log('✅ My items retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'My items retrieved successfully', result);
});
// Admin: Get pending items
const getPendingItems = (0, catchAsync_1.default)(async (req, res) => {
    const result = await item_service_1.itemService.getPendingItems();
    (0, sendResponse_1.default)(res, 200, true, 'Pending items retrieved', result);
});
// Admin: Approve item
const approveItem = (0, catchAsync_1.default)(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await item_service_1.itemService.updateItemStatus(id, 'APPROVED');
    (0, sendResponse_1.default)(res, 200, true, 'Item approved successfully', result);
});
// Admin: Reject item
const rejectItem = (0, catchAsync_1.default)(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await item_service_1.itemService.updateItemStatus(id, 'REJECTED');
    (0, sendResponse_1.default)(res, 200, true, 'Item rejected', result);
});
exports.itemController = {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    getMyItems,
    getPendingItems,
    approveItem,
    rejectItem,
};
