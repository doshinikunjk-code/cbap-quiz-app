# CBAP/BABOK Quiz App

A deployable Express + PostgreSQL quiz app for CBAP/BABOK case-study tests.

## Features

- 8 Master Sets
- 6 tests per Master Set
- 60 questions per test
- 2,880 seeded scenario-based questions
- Mix of all 6 BABOK knowledge areas
- User registration/login
- Saves every answer
- Resumes from next unanswered question across devices
- Score and knowledge-area breakdown
- Railway-ready

## Railway deployment from GitHub

1. Upload this folder to a new GitHub repository.
2. Go to Railway and create a new project.
3. Choose **Deploy from GitHub repo** and select this repo.
4. Add a PostgreSQL database service in the same Railway project.
5. In your app service, add these variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `SESSION_SECRET` = any long random value
   - `NODE_ENV` = `production`
6. Railway will run `npm install` and `npm start` automatically.
7. Generate a public domain from Railway app service settings.
8. Open the public URL, register, choose a Master Set and Test, and start.

Railway injects environment variables at runtime and supports GitHub deployments for Express apps.

## Local setup

```bash
npm install
cp .env.example .env
# update DATABASE_URL in .env
npm start
```

Open http://localhost:3000

## How progress resume works

When a user answers question 29, the app saves the answer and updates progress. When the user opens the same test again, the app finds the first unanswered question and opens question 30.

## Important note

The seed content is generated as a large starter bank. You can improve wording and exam realism by editing `src/questionFactory.js` or by replacing seeded rows in PostgreSQL.
