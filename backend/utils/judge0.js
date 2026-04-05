const axios = require('axios');

function formatJudge0Error(err) {
  if (axios.isAxiosError?.(err) && err.response) {
    const status = err.response.status;
    const body = err.response.data;
    const snippet =
      typeof body === 'string'
        ? body.slice(0, 200)
        : body?.message || (body && JSON.stringify(body).slice(0, 200));

    if (status === 401 || status === 403) {
      return [
        `Judge0 / RapidAPI returned ${status} Forbidden.`,
        'Fix: In RapidAPI, open "Judge0 CE", click Subscribe to a plan, then copy your key into backend .env as JUDGE0_API_KEY.',
        'Ensure JUDGE0_API_HOST=judge0-ce.p.rapidapi.com and JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com (no typo, no extra spaces).',
        snippet ? `API message: ${snippet}` : '',
      ]
        .filter(Boolean)
        .join(' ');
    }
    if (status === 429) {
      return 'Judge0 rate limit (429). Wait and retry, or upgrade your RapidAPI plan.';
    }
    return `Judge0 request failed (HTTP ${status}). ${snippet || err.message}`;
  }
  return err?.message || 'Judge0 execution failed';
}

const LANGUAGE_IDS = {
  C: 50,
  'C++': 54,
  Java: 62,
  Python: 71,
};

function getJudgeHeaders() {
  const key = (process.env.JUDGE0_API_KEY || '').trim();
  const host = (process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com').trim();
  const headers = { 'Content-Type': 'application/json' };
  if (key) {
    headers['X-RapidAPI-Key'] = key;
    headers['X-RapidAPI-Host'] = host;
  }
  return headers;
}

function getBaseUrl() {
  return (
    process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
  ).replace(/\/$/, '');
}

function encodeBase64(str) {
  return Buffer.from(str ?? '', 'utf8').toString('base64');
}

function decodeBase64(b64) {
  if (!b64) return '';
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

async function pollSubmission(token) {
  const base = getBaseUrl();
  const headers = getJudgeHeaders();
  const maxAttempts = 30;
  const delayMs = 500;

  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const { data } = await axios.get(`${base}/submissions/${token}`, {
        headers,
        params: { base64_encoded: 'true', fields: '*' },
      });

      if (data.status && data.status.id > 2) {
        return data;
      }
    } catch (err) {
      throw new Error(formatJudge0Error(err));
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('Judge0 execution timed out');
}

/**
 * Run source code with stdin via Judge0 CE.
 * @returns {{ stdout: string, stderr: string, statusId: number, message: string }}
 */
async function runCode(language, sourceCode, stdin = '') {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const base = getBaseUrl();
  const headers = getJudgeHeaders();

  if (!process.env.JUDGE0_API_KEY || !process.env.JUDGE0_API_KEY.trim()) {
    throw new Error(
      'JUDGE0_API_KEY is missing in backend .env. Add your RapidAPI key for Judge0 CE.'
    );
  }

  const body = {
    language_id: languageId,
    source_code: encodeBase64(sourceCode),
    stdin: encodeBase64(stdin),
  };

  let created;
  try {
    const res = await axios.post(`${base}/submissions`, body, {
      headers,
      params: { base64_encoded: 'true', wait: 'false' },
    });
    created = res.data;
  } catch (err) {
    throw new Error(formatJudge0Error(err));
  }

  const token = created.token;
  if (!token) {
    throw new Error('Judge0 did not return a submission token');
  }

  const result = await pollSubmission(token);
  const stdout = decodeBase64(result.stdout).trim();
  const stderr = decodeBase64(result.stderr).trim();
  const compileOutput = decodeBase64(result.compile_output).trim();
  const statusId = result.status?.id ?? 0;
  const statusDesc = result.status?.description ?? '';

  let message = statusDesc;
  if (compileOutput) message = `${message}\n${compileOutput}`.trim();
  if (stderr && statusId !== 3) message = `${message}\n${stderr}`.trim();

  return {
    stdout,
    stderr,
    statusId,
    message: message || 'No details',
    rawStatus: statusDesc,
  };
}

function normalizeOutput(s) {
  return (s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function outputsMatch(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

module.exports = {
  LANGUAGE_IDS,
  runCode,
  outputsMatch,
  normalizeOutput,
  formatJudge0Error,
};
