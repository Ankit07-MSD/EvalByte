const express = require('express');
const { body } = require('express-validator');
const { createSubmission, listUserSubmissions } = require('../controllers/submissionController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('problemId').isMongoId().withMessage('Valid problemId required'),
    body('language').isIn(['C', 'C++', 'Java', 'Python']).withMessage('Invalid language'),
    body('sourceCode').isString().notEmpty().withMessage('Source code required'),
  ],
  createSubmission
);

router.get('/user', listUserSubmissions);

module.exports = router;
