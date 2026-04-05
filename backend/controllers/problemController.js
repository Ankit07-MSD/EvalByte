const { validationResult } = require('express-validator');
const Problem = require('../models/Problem');

async function listProblems(_req, res, next) {
  try {
    const problems = await Problem.find().sort({ createdAt: -1 }).lean();
    res.json(problems);
  } catch (err) {
    next(err);
  }
}

async function getProblem(req, res, next) {
  try {
    const problem = await Problem.findById(req.params.id).lean();
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid problem id' });
    }
    next(err);
  }
}

function hasAtLeastOneCase(body) {
  const primary = (body.expectedOutput ?? '').trim();
  if (primary !== '') return true;
  const list = body.testCases;
  if (!Array.isArray(list)) return false;
  return list.some((tc) => (tc.expectedOutput ?? '').trim() !== '');
}

function validateProblemBody(body, isUpdate = false) {
  const { title, description, difficulty, testCases } = body;
  if (!isUpdate) {
    if (!title || !description) {
      return 'Title and description are required';
    }
    if (!hasAtLeastOneCase(body)) {
      return 'Provide default expected output and/or at least one test case with expected output';
    }
  }
  if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    return 'Invalid difficulty';
  }
  if (testCases !== undefined) {
    if (!Array.isArray(testCases)) {
      return 'testCases must be an array';
    }
    for (const tc of testCases) {
      if (tc.expectedOutput === undefined || tc.expectedOutput === null) {
        return 'Each test case needs expectedOutput';
      }
    }
  }
  return null;
}

async function createProblem(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const msg = validateProblemBody(req.body, false);
    if (msg) return res.status(400).json({ message: msg });

    const { title, description, input, expectedOutput, difficulty, testCases } = req.body;
    const problem = await Problem.create({
      title,
      description,
      input: input ?? '',
      expectedOutput: expectedOutput ?? '',
      difficulty: difficulty || 'Easy',
      testCases: testCases || [],
    });
    res.status(201).json(problem);
  } catch (err) {
    next(err);
  }
}

async function updateProblem(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const msg = validateProblemBody(req.body, true);
    if (msg) return res.status(400).json({ message: msg });

    const updates = {};
    ['title', 'description', 'input', 'expectedOutput', 'difficulty', 'testCases'].forEach(
      (k) => {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      }
    );
    const merged = await Problem.findById(req.params.id).lean();
    if (!merged) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    const preview = { ...merged, ...updates };
    if (!hasAtLeastOneCase(preview)) {
      return res.status(400).json({
        message: 'Provide default expected output and/or at least one test case with expected output',
      });
    }
    const problem = await Problem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid problem id' });
    }
    next(err);
  }
}

async function deleteProblem(req, res, next) {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json({ message: 'Problem deleted' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid problem id' });
    }
    next(err);
  }
}

module.exports = {
  listProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
};
