const axios = require('axios');

/** Piston language id (self-hosted API uses "c++" not "cpp") */
const PISTON_LANG = {
  C: 'c',
  'C++': 'c++',
  Java: 'java',
  Python: 'python',
};

const FILE_NAMES = {
  C: 'main.c',
  'C++': 'main.cpp',
  Java: 'Main.java',
  Python: 'main.py',
};

let runtimesCache = null;
let runtimesCacheAt = 0;
const CACHE_MS = 30 * 60 * 1000;

function getBase() {
  return (process.env.PISTON_API_BASE || 'http://127.0.0.1:2000').replace(/\/$/, '');
}

function normalizeRuntimesPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.value)) return data.value;
  return [];
}

async function fetchRuntimes() {
  const now = Date.now();
  if (runtimesCache && now - runtimesCacheAt < CACHE_MS) return runtimesCache;

  const { data } = await axios.get(`${getBase()}/api/v2/runtimes`, { timeout: 8000 });
  const list = normalizeRuntimesPayload(data);
  runtimesCache = list;
  runtimesCacheAt = now;
  return list;
}

function pickRuntime(list, pistonLang) {
  const matches = list.filter((r) => r.language === pistonLang);
  if (!matches.length) return null;
  return matches[matches.length - 1];
}

function formatPistonError(err) {
  if (axios.isAxiosError?.(err)) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return [
        `Cannot reach Piston at ${getBase()} (${err.code}).`,
        'Start Docker: open a terminal in the Evalbyte folder and run:',
        'docker compose -f docker-compose.piston.yml up -d',
        'Then set PISTON_API_BASE=http://127.0.0.1:2000 in backend/.env (or leave default).',
      ].join(' ');
    }
    const body = err.response?.data;
    const msg =
      typeof body === 'string'
        ? body.slice(0, 400)
        : body?.message || (body && JSON.stringify(body).slice(0, 400));
    if (err.response?.status === 403 && msg.includes('whitelist')) {
      return [
        'The public Piston demo API is restricted.',
        'Use self-hosted Piston (free): docker compose -f docker-compose.piston.yml up -d',
        'and keep PISTON_API_BASE=http://127.0.0.1:2000.',
      ].join(' ');
    }
    return msg || err.message || 'Piston request failed';
  }
  return err?.message || 'Piston execution failed';
}

/**
 * Run code via a self-hosted Piston API (same result shape as Judge0 helper).
 * @returns {{ stdout: string, stderr: string, statusId: number, message: string, rawStatus: string }}
 */
async function runCode(language, sourceCode, stdin = '') {
  const pistonLang = PISTON_LANG[language];
  if (!pistonLang) {
    throw new Error(`Unsupported language: ${language}`);
  }

  let list;
  try {
    list = await fetchRuntimes();
  } catch (err) {
    throw new Error(formatPistonError(err));
  }

  const rt = pickRuntime(list, pistonLang);
  if (!rt) {
    throw new Error(
      `Piston has no "${pistonLang}" runtime. Rebuild/pull the Piston image so compilers are installed.`
    );
  }

  let data;
  try {
    const res = await axios.post(
      `${getBase()}/api/v2/execute`,
      {
        language: rt.language,
        version: rt.version,
        files: [{ name: FILE_NAMES[language], content: sourceCode }],
        stdin: stdin ?? '',
      },
      { timeout: 45000 }
    );
    data = res.data;
  } catch (err) {
    throw new Error(formatPistonError(err));
  }

  const run = data.run || {};
  const stdout = String(run.stdout ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  const stderr = String(run.stderr ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  const exitCode = run.code;
  const signal = run.signal;

  const finishedOk = Number(exitCode) === 0 && (signal == null || signal === '');
  const statusId = finishedOk ? 3 : 4;

  let message = stderr;
  if (!finishedOk) {
    const parts = [stderr, exitCode != null ? `exit ${exitCode}` : '', signal ? `signal ${signal}` : ''].filter(
      Boolean
    );
    message = parts.join(' ').trim();
  }

  return {
    stdout,
    stderr,
    statusId,
    message: message || (finishedOk ? 'No details' : 'Runtime error'),
    rawStatus: finishedOk ? 'Accepted' : 'Error',
  };
}

module.exports = { runCode };
