const { validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const { runCode, outputsMatch } = require('../utils/codeRunner');

const LANGUAGES = ['C', 'C++', 'Java', 'Python'];

async function createSubmission(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { problemId, language, sourceCode } = req.body;
    if (!LANGUAGES.includes(language)) {
      return res.status(400).json({ message: 'Invalid language' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const cases = problem.getEvaluationCases();
    if (!cases.length) {
      return res.status(400).json({ message: 'Problem has no test cases configured' });
    }

    const outputs = [];
    let lastMessage = '';

    for (let i = 0; i < cases.length; i += 1) {
      const { stdin, expectedOutput } = cases[i];
      let exec;
      try {
        exec = await runCode(language, sourceCode, stdin);
      } catch (e) {
        const submission = await Submission.create({
          userId: req.user._id,
          problemId,
          language,
          sourceCode,
          output: '',
          status: 'Error',
          judgeMessage: e.message || 'Execution failed',
        });
        return res.status(201).json({
          submission,
          message: 'Code execution failed',
        });
      }

      lastMessage = exec.message;
      outputs.push(exec.stdout);

      const acceptedCase = exec.statusId === 3 && outputsMatch(exec.stdout, expectedOutput);
      if (!acceptedCase) {
        const status = exec.statusId === 3 ? 'Wrong Answer' : 'Error';
        const submission = await Submission.create({
          userId: req.user._id,
          problemId,
          language,
          sourceCode,
          output: exec.stdout,
          status,
          judgeMessage: exec.statusId === 3 ? 'Output mismatch' : exec.message,
        });
        return res.status(201).json({
          submission,
          message: status === 'Wrong Answer' ? 'Wrong Answer' : 'Runtime or compile error',
        });
      }
    }

    const submission = await Submission.create({
      userId: req.user._id,
      problemId,
      language,
      sourceCode,
      output: outputs.join('\n---\n'),
      status: 'Accepted',
      judgeMessage: lastMessage,
    });

    res.status(201).json({
      submission,
      message: 'Accepted',
    });
  } catch (err) {
    next(err);
  }
}

async function listUserSubmissions(req, res, next) {
  try {
    const list = await Submission.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('problemId', 'title difficulty')
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
}

module.exports = { createSubmission, listUserSubmissions };
