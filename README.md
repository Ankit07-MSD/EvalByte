# Evalbyte – Online Coding Practice & Evaluation Platform

Beginner-friendly full-stack app: users register, solve problems in multiple languages, and get **Accepted / Wrong Answer** verdicts using a **free local Piston** runner (Docker) or optional **Judge0** (RapidAPI). Admins manage problems and test cases.

## Tech stack

| Layer        | Technologies                          |
|-------------|----------------------------------------|
| Frontend    | React (Vite), Tailwind CSS, Axios, React Router |
| Backend     | Node.js, Express.js                    |
| Database    | MongoDB, Mongoose                      |
| Auth        | JWT (Bearer token)                     |
| Execution   | Piston (Docker, free) or Judge0 CE (optional) |

## Project layout

```
Evalbyte/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/seed.js
│   ├── utils/judge0.js
│   ├── utils/piston.js
│   ├── utils/codeRunner.js
│   └── server.js
├── docker-compose.piston.yml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.js
│   │   ├── context/AuthContext.jsx
│   │   ├── App.jsx
│   │   ├── App.js
│   │   └── main.jsx
│   └── ...
└── README.md
```

## Prerequisites

1. **Node.js** 18+ and **npm**
2. **MongoDB** running locally or a connection string (MongoDB Atlas)
3. **Docker Desktop** (or Docker Engine) — to run **Piston** locally for free code execution  
4. *(Optional)* **Judge0** on [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce) if you set `CODE_RUNNER=judge0` instead of Piston

## Setup

### 1. MongoDB

Start local MongoDB or create a cluster and copy the connection URI.

### 2. Backend

```bash
cd Evalbyte/backend
copy .env.example .env
```

Edit `.env`:

- `MONGODB_URI` — e.g. `mongodb://127.0.0.1:27017/evalbyte`
- `JWT_SECRET` — long random string
- **Default (free):** `CODE_RUNNER=piston` and `PISTON_API_BASE=http://127.0.0.1:2000`
- **Optional Judge0:** `CODE_RUNNER=judge0` plus `JUDGE0_API_KEY`, `JUDGE0_API_URL`, `JUDGE0_API_HOST`

### 2b. Start Piston (free runner)

From the **Evalbyte** folder (one level above `backend`):

```bash
docker compose -f docker-compose.piston.yml up -d
```

First run pulls the **official** image `ghcr.io/engineer-man/piston` and stores language packages under `Evalbyte/data/piston/packages` (can be large). The API listens on **port 2000**.  
Do not use the `piston/api` image alone — it exits without the `/piston/packages` volume.

Piston starts with **no languages**. Install C, C++, Java, and Python (one-time, downloads ~hundreds of MB each):

```bash
cd Evalbyte/backend
npm run piston:install
```

If Docker is not available, install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker on Linux.

> The old public Piston demo (`emkc.org`) is **whitelist-only** as of 2026 — self-hosting with the compose file above is the reliable free path.

Still in **`Evalbyte/backend`**, install dependencies and seed sample data (creates admin + problems):

```bash
npm install
npm run seed
```

Default admin (unless overridden in `.env`):

- Email: `admin@evalbyte.local`
- Password: `admin123`

Start API:

```bash
npm run dev
```

Server: `http://localhost:5000`  
Health check: `GET http://localhost:5000/api/health`

### 3. Frontend

```bash
cd Evalbyte/frontend
npm install
```

Optional: copy `.env.example` to `.env`. Leave `VITE_API_URL` empty to use the Vite dev proxy to port 5000.

```bash
npm run dev
```

App: `http://localhost:5173`

## API routes

| Method | Path | Auth | Description |
|--------|------|------|---------------|
| POST | `/api/auth/register` | — | Register (role: user) |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/problems` | — | List problems |
| GET | `/api/problems/:id` | — | Problem detail |
| POST | `/api/problems` | Admin JWT | Create problem |
| PUT | `/api/problems/:id` | Admin JWT | Update problem |
| DELETE | `/api/problems/:id` | Admin JWT | Delete problem |
| POST | `/api/submissions` | User JWT | Submit code (Piston or Judge0 + compare) |
| GET | `/api/submissions/user` | User JWT | Submission history |
| GET | `/api/dashboard` | User JWT | Stats + recent submissions |

Send JWT as: `Authorization: Bearer <token>`

## MongoDB collections (schemas)

- **users** — `name`, `email`, `password` (hashed), `role` (`user` \| `admin`), timestamps (`createdAt`, …)
- **problems** — `title`, `description`, `input`, `expectedOutput`, `difficulty`, `testCases[]`, timestamps
- **submissions** — `userId`, `problemId`, `language`, `sourceCode`, `output`, `status`, `judgeMessage`, timestamps

## Sample problems (from seed)

1. **Hello World** — read name, print `Hello, <name>!`
2. **Sum of Two Numbers** — two integers, print sum (multiple cases)
3. **Factorial** — print n! for small n

## Evaluation logic

1. Load problem and build case list: primary `expectedOutput` (if set) first, then `testCases` with non-empty expected output.
2. For each case, run code via **Piston** or **Judge0** (`CODE_RUNNER` in `.env`) with the selected language and stdin.
3. If the runner reports a successful run (internally `statusId === 3`), compare trimmed stdout to expected (normalized newlines).
4. If any case fails → **Wrong Answer** or **Error**; all pass → **Accepted**.

## Frontend pages

- Home, Register, Login  
- Problem list, Problem detail, Code editor (submit)  
- Submission history, Dashboard  
- Admin panel (CRUD problems + test cases)

## Academic / demo notes

- **Security**: Change default admin password after seeding; never commit `.env`.
- **Piston**: Needs Docker; the API container runs with `--privileged` to compile user code (acceptable on a dev machine, not for untrusted production without hardening).
- **Judge0**: Paid or rate-limited tiers on RapidAPI; optional if you use `CODE_RUNNER=judge0`.
- **Java**: Use `public class Main` to match both Piston and Judge0 templates.

## GitHub Pages (sirf frontend UI)

GitHub Pages **README** dikhaata hai jab root par koi **`index.html`** nahi hota. Is repo mein React app `frontend/` ke andar hai — pehle **build** chahiye.

### Automatic deploy (recommended)

1. Ye repo GitHub par push karo (`.github/workflows/deploy-pages.yml` included).
2. GitHub repo → **Settings** → **Pages** → **Build and deployment** → **Source**: **GitHub Actions** (NOT “Deploy from a branch”).
3. **Actions** tab kholo → **Deploy frontend to GitHub Pages** workflow green hone do.
4. Site URL: `https://<username>.github.io/<repo-name>/`  
   - `<repo-name>` aur workflow mein `VITE_BASE` wahi hona chahiye (usually lowercase, e.g. `evalbyte`).

### Important

- Pages par sirf **static React build** chalega. **Login / API / submit** tab kaam karenge jab tumhara **backend** kahin aur host ho (Render, Railway, etc.) aur GitHub repo **Secrets** mein `VITE_API_URL` set ho (poora API URL, jaise `https://api.tumhari-site.com`). Bina iske UI khulega par API calls fail ho sakti hain.
- Pehle “branch se Pages” use kiya ho to hata do; warna galat folder serve ho sakta hai.

### Manual build check (local)

```bash
cd Evalbyte/frontend
set VITE_BASE=/your-repo-name/
npm run build
```

Open `frontend/dist/index.html` logic via a static server (paths must match `VITE_BASE`).

## Production build (frontend)

```bash
cd Evalbyte/frontend
npm run build
```

Serve `frontend/dist` with any static host and set `VITE_API_URL` at build time to your API origin, or configure reverse proxy for `/api`.
