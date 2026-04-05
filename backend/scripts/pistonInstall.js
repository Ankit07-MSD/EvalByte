/**
 * Install C, C++, Java, Python runtimes into a local Piston instance.
 * Requires: docker compose -f ../docker-compose.piston.yml up -d
 * Run from backend: node scripts/pistonInstall.js
 */
const axios = require('axios');

const base = (process.env.PISTON_API_BASE || 'http://127.0.0.1:2000').replace(/\/$/, '');

// Piston repo uses package name "gcc" for C/C++ toolchains (adds `c` + `c++` runtimes).
const PACKAGES = [
  { language: 'python', version: '*' },
  { language: 'gcc', version: '*' },
  { language: 'java', version: '*' },
];

async function main() {
  console.log('Piston API:', base);
  for (const body of PACKAGES) {
    const label = `${body.language}@${body.version}`;
    process.stdout.write(`Installing ${label}... `);
    try {
      const { data } = await axios.post(`${base}/api/v2/packages`, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 600_000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      console.log('OK', data);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      console.log('FAILED', msg);
      if (e.code === 'ECONNREFUSED') {
        console.error('\nStart Piston first: cd .. && docker compose -f docker-compose.piston.yml up -d');
        process.exit(1);
      }
    }
  }
  const { data: runtimes } = await axios.get(`${base}/api/v2/runtimes`);
  console.log('\nInstalled runtimes:', runtimes.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
