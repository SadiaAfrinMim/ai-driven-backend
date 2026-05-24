"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectionController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const selection_service_1 = require("./selection.service");
const createSelection = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const payload = req.body;
    const result = await selection_service_1.selectionService.createSelection(userId, payload);
    (0, sendResponse_1.default)(res, 201, true, 'Product selected successfully. Awaiting manager approval.', result);
});
const getMySelections = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const status = req.query.status;
    const result = await selection_service_1.selectionService.getMySelections(userId, status ? { status } : {});
    (0, sendResponse_1.default)(res, 200, true, 'Your selections retrieved', result);
});
const getPendingSelections = (0, catchAsync_1.default)(async (req, res) => {
    const result = await selection_service_1.selectionService.getPendingSelections();
    (0, sendResponse_1.default)(res, 200, true, 'Pending selections retrieved', result);
});
const approveSelection = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const selectionId = Array.isArray(id) ? id[0] : id;
    const result = await selection_service_1.selectionService.approveSelection(selectionId);
    (0, sendResponse_1.default)(res, 200, true, 'Selection approved successfully', result);
});
const rejectSelection = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const selectionId = Array.isArray(id) ? id[0] : id;
    const result = await selection_service_1.selectionService.rejectSelection(selectionId);
    (0, sendResponse_1.default)(res, 200, true, 'Selection rejected. Stock restored.', result);
});
const getApprovedForMe = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const result = await selection_service_1.selectionService.getApprovedSelectionsForUser(userId);
    (0, sendResponse_1.default)(res, 200, true, 'Your approved selections retrieved', result);
});
exports.selectionController = {
    createSelection,
    getMySelections,
    getPendingSelections,
    approveSelection,
    rejectSelection,
    getApprovedForMe,
};
