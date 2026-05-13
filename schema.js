import { query } from './db.js';

export async function migrate() {
  await query(`CREATE TABLE IF NOT EXISTS app_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`);
  await query(`CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    master_set INT NOT NULL,
    test_number INT NOT NULL,
    question_number INT NOT NULL,
    knowledge_area TEXT NOT NULL,
    scenario TEXT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL,
    explanation TEXT NOT NULL,
    UNIQUE(master_set, test_number, question_number)
  );`);
  await query(`CREATE TABLE IF NOT EXISTS user_answers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES app_users(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    selected_option CHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
  );`);
  await query(`CREATE TABLE IF NOT EXISTS user_progress (
    user_id INT REFERENCES app_users(id) ON DELETE CASCADE,
    master_set INT NOT NULL,
    test_number INT NOT NULL,
    last_question_number INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(user_id, master_set, test_number)
  );`);
}
