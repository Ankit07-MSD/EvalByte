const judge0 = require('./judge0');
const piston = require('./piston');

/**
 * CODE_RUNNER=piston  → self-hosted Piston (Docker, free). Default.
 * CODE_RUNNER=judge0 → Judge0 CE (RapidAPI key or self-hosted URL).
 */
async function runCode(language, sourceCode, stdin) {
  const mode = (process.env.CODE_RUNNER || 'piston').toLowerCase().trim();

  if (mode === 'judge0') {
    return judge0.runCode(language, sourceCode, stdin);
  }
  if (mode === 'piston') {
    return piston.runCode(language, sourceCode, stdin);
  }

  throw new Error(`CODE_RUNNER must be "piston" or "judge0". Got: "${mode}"`);
}

module.exports = {
  runCode,
  outputsMatch: judge0.outputsMatch,
  normalizeOutput: judge0.normalizeOutput,
};
