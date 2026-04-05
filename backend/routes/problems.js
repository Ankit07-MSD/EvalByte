const express = require('express');
const { body, param } = require('express-validator');
const {
  listProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
} = require('../controllers/problemController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', listProblems);
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid id'),
  validateRequest,
  getProblem
);

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  ],
  createProblem
);

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  param('id').isMongoId().withMessage('Invalid id'),
  [body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard'])],
  validateRequest,
  updateProblem
);

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  param('id').isMongoId().withMessage('Invalid id'),
  validateRequest,
  deleteProblem
);

module.exports = router;
