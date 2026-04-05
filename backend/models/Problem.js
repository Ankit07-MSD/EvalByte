const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    testCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true }
);

problemSchema.methods.getEvaluationCases = function getEvaluationCases() {
  const primary = {
    stdin: this.input ?? '',
    expectedOutput: (this.expectedOutput ?? '').trim(),
  };
  const extras = (this.testCases || []).map((tc) => ({
    stdin: tc.input ?? '',
    expectedOutput: (tc.expectedOutput ?? '').trim(),
  }));

  const cases = [];
  if (primary.expectedOutput !== '') {
    cases.push(primary);
  }
  for (const e of extras) {
    if (e.expectedOutput !== '') cases.push(e);
  }
  return cases;
};

module.exports = mongoose.model('Problem', problemSchema);
