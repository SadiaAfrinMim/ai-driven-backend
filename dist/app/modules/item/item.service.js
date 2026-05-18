"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const cloudinary_1 = require("../../../shared/cloudinary");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createItem = async (userId, payload, files) => {
    console.log('🔄 Creating item for user:', userId, payload);
    let imageUrls = [];
    // Upload images to Cloudinary - images are optional for development
    if (files && files.length > 0) {
        console.log('📤 Starting image upload process...');
        console.log('Number of files to upload:', files.length);
        console.log('File details:', files.map(f => ({ mimetype: f.mimetype, bufferSize: f.buffer.length })));
        try {
            console.log('📤 Uploading images to Cloudinary...');
            const uploadResults = await (0, cloudinary_1.uploadImages)(files, 'items');
            imageUrls = uploadResults.map(result => result.secure_url);
            console.log('✅ Images uploaded successfully:', imageUrls.length, 'images');
            console.log('Image URLs:', imageUrls);
        }
        catch (error) {
            console.error('❌ Image upload failed:', error);
            console.log('Continuing without images...');
            // Continue without images for development
        }
        // Ensure we have at least one image URL
        if (imageUrls.length === 0) {
            throw new ApiError_1.default(400, 'Failed to process images');
        }
    }
    // Ensure we have at least one image URL
    if (imageUrls.length === 0) {
        throw new ApiError_1.default(400, 'Failed to process images');
    }
    const item = await database_1.default.item.create({
        data: {
            title: payload.title,
            description: payload.description,
            price: payload.price,
            location: payload.location,
            category: payload.category,
            tags: payload.tags || [],
            images: imageUrls, // Store Cloudinary URLs
            isAIContent: payload.isAIContent || false,
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
    return item;
};
const getItems = async (filters = {}, pagination = {}) => {
    console.log('🔍 Getting items with filters:', filters, 'pagination:', pagination);
    // Create query object for QueryBuilder
    const query = {
        ...filters,
        ...pagination,
    };
    // Rename properties to match QueryBuilder expectations
    if (filters.search)
        query.searchTerm = filters.search;
    if (pagination.sortBy)
        query.sort = pagination.sortBy;
    if (pagination.sortOrder)
        query.sortOrder = pagination.sortOrder;
    // Handle price range filters
    if (filters.minPrice !== undefined)
        query.min_price = filters.minPrice;
    if (filters.maxPrice !== undefined)
        query.max_price = filters.maxPrice;
    // Create QueryBuilder instance
    const itemQuery = new QueryBuilder_1.default(database_1.default.item.findMany({
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            reviews: {
                select: {
                    rating: true,
                },
            },
        },
    }), query);
    // Apply QueryBuilder methods
    const result = await itemQuery
        .search(['title', 'description', 'category'])
        .filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery;
    // Get total count with same filters
    const countQuery = new QueryBuilder_1.default(database_1.default.item.count(), query);
    const total = await countQuery
        .search(['title', 'description', 'category'])
        .filter()
        .modelQuery;
    // Calculate pagination metadata
    const { page = 1, limit = 10 } = pagination;
    const totalPages = Math.ceil(total / limit);
    // Calculate average rating for each item
    const itemsWithRating = result.map((item) => ({
        ...item,
        rating: item.reviews.length > 0
            ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length
            : 0,
    }));
    console.log(`✅ Retrieved ${result.length} items (page ${page}/${totalPages})`);
    return {
        items: itemsWithRating,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};
const getItemById = async (itemId) => {
    console.log('🔍 Getting item by ID:', itemId);
    const item = await database_1.default.item.findUnique({
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
        throw new ApiError_1.default(404, 'Item not found');
    }
    // Calculate average rating
    const rating = item.reviews.length > 0
        ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length
        : 0;
    console.log('✅ Item retrieved:', item.title);
    return { ...item, rating };
};
const updateItem = async (itemId, userId, payload) => {
    console.log('🔄 Updating item:', itemId, 'by user:', userId, payload);
    // Check if item exists and user owns it
    const existingItem = await database_1.default.item.findUnique({
        where: { id: itemId },
    });
    if (!existingItem) {
        console.log('❌ Item not found:', itemId);
        throw new ApiError_1.default(404, 'Item not found');
    }
    if (existingItem.ownerId !== userId) {
        console.log('❌ Unauthorized: User', userId, 'does not own item', itemId);
        throw new ApiError_1.default(403, 'You can only update your own items');
    }
    let imageUrls = existingItem.images;
    // Handle image updates
    if (payload.images !== undefined) {
        try {
            if (payload.images.length > 0) {
                // Upload new images
                console.log('📤 Uploading new images...');
                const uploadResults = await (0, cloudinary_1.uploadImages)(payload.images, 'items');
                const newImageUrls = uploadResults.map(result => result.secure_url);
                // Combine existing and new images
                imageUrls = [...existingItem.images, ...newImageUrls];
                console.log('✅ New images added');
            }
            else if (payload.images.length === 0) {
                // Remove all images
                console.log('🗑️ Removing all images...');
                // Extract public IDs from existing image URLs for deletion
                const publicIds = existingItem.images.map(url => {
                    const parts = url.split('/');
                    const filename = parts[parts.length - 1];
                    return `items/${filename.split('.')[0]}`;
                });
                await (0, cloudinary_1.deleteImages)(publicIds);
                imageUrls = [];
                console.log('✅ All images removed');
            }
        }
        catch (error) {
            console.error('❌ Image update failed:', error);
            throw new ApiError_1.default(500, 'Failed to update images');
        }
    }
    const updatedItem = await database_1.default.item.update({
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
    return updatedItem;
};
const deleteItem = async (itemId, userId) => {
    console.log('🗑️ Deleting item:', itemId, 'by user:', userId);
    // Check if item exists and user owns it
    const existingItem = await database_1.default.item.findUnique({
        where: { id: itemId },
    });
    if (!existingItem) {
        console.log('❌ Item not found:', itemId);
        throw new ApiError_1.default(404, 'Item not found');
    }
    if (existingItem.ownerId !== userId) {
        console.log('❌ Unauthorized: User', userId, 'does not own item', itemId);
        throw new ApiError_1.default(403, 'You can only delete your own items');
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
            await (0, cloudinary_1.deleteImages)(publicIds);
            console.log('✅ Item images deleted from Cloudinary');
        }
        catch (error) {
            console.error('❌ Failed to delete images from Cloudinary:', error);
            // Continue with item deletion even if image deletion fails
        }
    }
    await database_1.default.item.delete({
        where: { id: itemId },
    });
    console.log('✅ Item deleted successfully');
};
const getMyItems = async (userId, pagination = {}) => {
    console.log('🔍 Getting my items for user:', userId);
    const filters = { ownerId: userId };
    return getItems(filters, pagination);
};
exports.itemService = {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    getMyItems,
};
