"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectionService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createSelection = async (userId, payload) => {
    const qty = payload.quantity || 1;
    // Check item exists and has stock
    const item = await database_1.default.item.findUnique({
        where: { id: payload.itemId },
    });
    if (!item) {
        throw new ApiError_1.default(404, 'Product not found');
    }
    if (item.quantity < qty) {
        throw new ApiError_1.default(400, 'Not enough stock available');
    }
    // Prevent owner from selecting own product
    if (item.ownerId === userId) {
        throw new ApiError_1.default(403, 'You cannot select your own product');
    }
    // Check for existing pending selection by this user for this item
    const existing = await database_1.default.selection.findFirst({
        where: {
            userId,
            itemId: payload.itemId,
            status: 'PENDING',
        },
    });
    if (existing) {
        throw new ApiError_1.default(409, 'You already have a pending request for this product');
    }
    // Atomic: decrement stock + create selection record together
    const [, selection] = await database_1.default.$transaction([
        database_1.default.item.update({
            where: { id: payload.itemId },
            data: { quantity: { decrement: qty } },
        }),
        database_1.default.selection.create({
            data: {
                userId,
                itemId: payload.itemId,
                quantity: qty,
                status: 'PENDING',
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, profileImage: true },
                },
                item: {
                    select: { id: true, title: true, price: true, category: true, images: true, location: true, quantity: true },
                },
            },
        }),
    ]);
    return selection;
};
const getMySelections = async (userId, filters = {}) => {
    const page = 1;
    const limit = 50;
    const where = {
        userId,
        ...(filters.status && { status: filters.status }),
    };
    const selections = await database_1.default.selection.findMany({
        where,
        include: {
            user: {
                select: { id: true, name: true, email: true, profileImage: true },
            },
            item: {
                select: { id: true, title: true, price: true, category: true, images: true, location: true, quantity: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    });
    const total = await database_1.default.selection.count({ where });
    return {
        selections: selections,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
const getPendingSelections = async () => {
    const selections = await database_1.default.selection.findMany({
        where: { status: 'PENDING' },
        include: {
            user: {
                select: { id: true, name: true, email: true, profileImage: true },
            },
            item: {
                select: { id: true, title: true, price: true, category: true, images: true, location: true, quantity: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return selections;
};
const approveSelection = async (selectionId) => {
    const selection = await database_1.default.selection.findUnique({
        where: { id: selectionId },
        include: { item: true },
    });
    if (!selection) {
        throw new ApiError_1.default(404, 'Selection request not found');
    }
    if (selection.status !== 'PENDING') {
        throw new ApiError_1.default(400, 'Only pending selections can be approved');
    }
    const updated = await database_1.default.selection.update({
        where: { id: selectionId },
        data: { status: 'APPROVED' },
        include: {
            user: {
                select: { id: true, name: true, email: true, profileImage: true },
            },
            item: {
                select: { id: true, title: true, price: true, category: true, images: true, location: true, quantity: true },
            },
        },
    });
    return updated;
};
const rejectSelection = async (selectionId) => {
    const selection = await database_1.default.selection.findUnique({
        where: { id: selectionId },
        include: { item: true },
    });
    if (!selection) {
        throw new ApiError_1.default(404, 'Selection request not found');
    }
    if (selection.status !== 'PENDING') {
        throw new ApiError_1.default(400, 'Only pending selections can be rejected');
    }
    // Restore stock
    await database_1.default.item.update({
        where: { id: selection.itemId },
        data: { quantity: { increment: selection.quantity } },
    });
    const updated = await database_1.default.selection.update({
        where: { id: selectionId },
        data: { status: 'REJECTED' },
        include: {
            user: {
                select: { id: true, name: true, email: true, profileImage: true },
            },
            item: {
                select: { id: true, title: true, price: true, category: true, images: true, location: true, quantity: true },
            },
        },
    });
    return updated;
};
const getApprovedSelectionsForUser = async (userId) => {
    const selections = await database_1.default.selection.findMany({
        where: {
            userId,
            status: 'APPROVED',
        },
        include: {
            item: {
                select: { id: true, title: true, price: true, category: true, images: true, location: true, quantity: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return selections;
};
exports.selectionService = {
    createSelection,
    getMySelections,
    getPendingSelections,
    approveSelection,
    rejectSelection,
    getApprovedSelectionsForUser,
};
