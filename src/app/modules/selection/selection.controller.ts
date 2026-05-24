import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { selectionService } from './selection.service';

const createSelection = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await selectionService.createSelection(userId, req.body);
  sendResponse(res, 201, true, 'Product selected successfully. Awaiting manager approval.', result);
});

const getMySelections = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await selectionService.getMySelections(userId);
  sendResponse(res, 200, true, 'Your selections retrieved', result);
});

const getPendingSelections = catchAsync(async (req: Request, res: Response) => {
  const result = await selectionService.getPendingSelections();
  sendResponse(res, 200, true, 'Pending selections retrieved', result);
});

const getApprovedSelections = catchAsync(async (req: Request, res: Response) => {
  const result = await selectionService.getApprovedSelections();
  sendResponse(res, 200, true, 'Approved selections retrieved', result);
});

const approveSelection = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await selectionService.approveSelection(id);
  sendResponse(res, 200, true, 'Selection approved successfully', result);
});

const rejectSelection = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await selectionService.rejectSelection(id);
  sendResponse(res, 200, true, 'Selection rejected', result);
});

export const selectionController = {
  createSelection,
  getMySelections,
  getPendingSelections,
  getApprovedSelections,
  approveSelection,
  rejectSelection,
};
