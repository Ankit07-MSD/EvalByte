const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    language: {
      type: String,
      enum: ['C', 'C++', 'Java', 'Python'],
      required: true,
    },
    sourceCode: { type: String, required: true },
    output: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Accepted', 'Wrong Answer', 'Error'],
      required: true,
    },
    judgeMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

submissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
