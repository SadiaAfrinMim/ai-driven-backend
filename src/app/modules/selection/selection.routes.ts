import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { selectionController } from './selection.controller';
import { createSelectionValidationSchema } from './selection.validation';

const router = express.Router();

// Buyer creates a selection (must be logged in as USER/MANAGER/ADMIN)
router.post(
  '/',
  auth('USER', 'MANAGER', 'ADMIN'),
  validateRequest(createSelectionValidationSchema),
  selectionController.createSelection
);

// Get my own selections (any logged in user)
router.get(
  '/my-selections',
  auth('USER', 'MANAGER', 'ADMIN'),
  selectionController.getMySelections
);

// Manager/Admin only views
router.get(
  '/pending',
  auth('MANAGER', 'ADMIN'),
  selectionController.getPendingSelections
);

router.get(
  '/approved',
  auth('MANAGER', 'ADMIN'),
  selectionController.getApprovedSelections
);

// Approve / Reject (Manager/Admin)
router.patch(
  '/:id/approve',
  auth('MANAGER', 'ADMIN'),
  selectionController.approveSelection
);

router.patch(
  '/:id/reject',
  auth('MANAGER', 'ADMIN'),
  selectionController.rejectSelection
);

export default router;
