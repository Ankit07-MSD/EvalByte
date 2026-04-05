const Submission = require('../models/Submission');
const Problem = require('../models/Problem');

async function getDashboard(req, res, next) {
  try {
    const userId = req.user._id;

    const [totalProblems, submissions] = await Promise.all([
      Problem.countDocuments(),
      Submission.find({ userId }).lean(),
    ]);

    const accepted = submissions.filter((s) => s.status === 'Accepted').length;
    const wrong = submissions.filter((s) => s.status === 'Wrong Answer').length;
    const errors = submissions.filter((s) => s.status === 'Error').length;

    const solvedProblemIds = new Set(
      submissions.filter((s) => s.status === 'Accepted').map((s) => String(s.problemId))
    );

    const recent = await Submission.find({ userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('problemId', 'title difficulty')
      .lean();

    res.json({
      summary: {
        totalProblems,
        totalSubmissions: submissions.length,
        accepted,
        wrongAnswer: wrong,
        errors,
        uniqueSolved: solvedProblemIds.size,
      },
      recentSubmissions: recent,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
