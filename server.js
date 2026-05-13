import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query, pool } from './db.js';
import { seed } from './seed.js';

dotenv.config();
await seed();

const app = express();
app.set('trust proxy', 1);
const PgSession = pgSession(session);
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production' }
}));

function requireUser(req, res, next) { if (!req.session.user) return res.redirect('/login'); next(); }
function page(title, body) { return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="/style.css"></head><body><main>${body}</main></body></html>`; }

app.get('/', (req,res)=> req.session.user ? res.redirect('/dashboard') : res.redirect('/login'));

app.get('/register', (req,res)=> res.send(page('Register', `<div class="card"><h1>CBAP/BABOK Quiz</h1><h2>Create account</h2><form method="post"><input name="name" placeholder="Name" required><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><button>Create account</button></form><p><a href="/login">Already registered? Login</a></p></div>`)));
app.post('/register', async (req,res)=>{
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = await query('INSERT INTO app_users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email',[name,email.toLowerCase(),hash]);
    req.session.user = r.rows[0]; res.redirect('/dashboard');
  } catch(e) { res.send(page('Register error', `<div class="card"><p>Email already exists or invalid.</p><a href="/register">Try again</a></div>`)); }
});

app.get('/login', (req,res)=> res.send(page('Login', `<div class="card"><h1>CBAP/BABOK Quiz</h1><h2>Login</h2><form method="post"><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><button>Login</button></form><p><a href="/register">Create account</a></p></div>`)));
app.post('/login', async (req,res)=>{
  const { email, password } = req.body;
  const r = await query('SELECT id,name,email,password_hash FROM app_users WHERE email=$1',[email.toLowerCase()]);
  if (!r.rows[0] || !(await bcrypt.compare(password, r.rows[0].password_hash))) return res.send(page('Login error', `<div class="card"><p>Invalid login.</p><a href="/login">Try again</a></div>`));
  const { password_hash, ...user } = r.rows[0]; req.session.user = user; res.redirect('/dashboard');
});
app.post('/logout',(req,res)=> req.session.destroy(()=>res.redirect('/login')));

app.get('/dashboard', requireUser, async (req,res)=>{
  const cards = [];
  for (let m=1;m<=8;m++) for (let t=1;t<=6;t++) {
    const pr = await query('SELECT last_question_number FROM user_progress WHERE user_id=$1 AND master_set=$2 AND test_number=$3',[req.session.user.id,m,t]);
    const last = pr.rows[0]?.last_question_number || 0;
    cards.push(`<a class="test" href="/test/${m}/${t}"><b>Master ${m} · Test ${t}</b><span>${last >= 60 ? 'Completed' : last > 0 ? `Resume Q${last+1}` : 'Start Q1'}</span></a>`);
  }
  res.send(page('Dashboard', `<div class="top"><h1>Welcome, ${req.session.user.name}</h1><form method="post" action="/logout"><button class="secondary">Logout</button></form></div><p>Choose any test. Your progress is saved after every answer.</p><div class="grid">${cards.join('')}</div>`));
});

app.get('/test/:m/:t', requireUser, async (req,res)=>{
  const m = Number(req.params.m), t = Number(req.params.t);
  const answered = await query(`SELECT q.question_number FROM user_answers ua JOIN questions q ON q.id=ua.question_id WHERE ua.user_id=$1 AND q.master_set=$2 AND q.test_number=$3`,[req.session.user.id,m,t]);
  const done = new Set(answered.rows.map(r=>r.question_number));
  let next = 1; while (done.has(next) && next <= 60) next++;
  if (next > 60) return res.redirect(`/results/${m}/${t}`);
  res.redirect(`/test/${m}/${t}/${next}`);
});

app.get('/test/:m/:t/:q', requireUser, async (req,res)=>{
  const [m,t,qn] = [Number(req.params.m),Number(req.params.t),Number(req.params.q)];
  const r = await query('SELECT * FROM questions WHERE master_set=$1 AND test_number=$2 AND question_number=$3',[m,t,qn]);
  const q = r.rows[0]; if (!q) return res.status(404).send('Question not found');
  const previous = await query('SELECT selected_option FROM user_answers WHERE user_id=$1 AND question_id=$2',[req.session.user.id,q.id]);
  const selected = previous.rows[0]?.selected_option;
  res.send(page(`Q${qn}`, `<div class="top"><h1>Master ${m} · Test ${t}</h1><a href="/dashboard">Dashboard</a></div><div class="progress"><div style="width:${(qn/60)*100}%"></div></div><div class="card"><div class="meta">Question ${qn}/60 · ${q.knowledge_area}</div><h2>${q.question_text}</h2><form method="post">${['A','B','C','D'].map(opt=>`<label class="option"><input type="radio" name="selected" value="${opt}" ${selected===opt?'checked':''} required> <b>${opt}.</b> ${q['option_'+opt.toLowerCase()]}</label>`).join('')}<button>Save & Continue</button></form></div>`));
});

app.post('/test/:m/:t/:q', requireUser, async (req,res)=>{
  const [m,t,qn] = [Number(req.params.m),Number(req.params.t),Number(req.params.q)];
  const selected = req.body.selected;
  const r = await query('SELECT id,correct_option FROM questions WHERE master_set=$1 AND test_number=$2 AND question_number=$3',[m,t,qn]);
  const q = r.rows[0];
  const isCorrect = selected === q.correct_option;
  await query(`INSERT INTO user_answers(user_id,question_id,selected_option,is_correct) VALUES($1,$2,$3,$4)
    ON CONFLICT(user_id,question_id) DO UPDATE SET selected_option=$3,is_correct=$4,answered_at=NOW()`,[req.session.user.id,q.id,selected,isCorrect]);
  await query(`INSERT INTO user_progress(user_id,master_set,test_number,last_question_number,updated_at) VALUES($1,$2,$3,$4,NOW())
    ON CONFLICT(user_id,master_set,test_number) DO UPDATE SET last_question_number=GREATEST(user_progress.last_question_number,$4),updated_at=NOW()`,[req.session.user.id,m,t,qn]);
  res.redirect(qn >= 60 ? `/results/${m}/${t}` : `/test/${m}/${t}/${qn+1}`);
});

app.get('/results/:m/:t', requireUser, async (req,res)=>{
  const [m,t] = [Number(req.params.m),Number(req.params.t)];
  const r = await query(`SELECT q.question_number,q.knowledge_area,q.correct_option,q.explanation,ua.selected_option,ua.is_correct FROM questions q LEFT JOIN user_answers ua ON ua.question_id=q.id AND ua.user_id=$1 WHERE q.master_set=$2 AND q.test_number=$3 ORDER BY q.question_number`,[req.session.user.id,m,t]);
  const total = r.rows.length, answered = r.rows.filter(x=>x.selected_option).length, correct = r.rows.filter(x=>x.is_correct).length;
  const by = {};
  for (const row of r.rows) { by[row.knowledge_area] ||= [0,0]; if(row.selected_option) by[row.knowledge_area][0]++; if(row.is_correct) by[row.knowledge_area][1]++; }
  const breakdown = Object.entries(by).map(([ka,[a,c]])=>`<tr><td>${ka}</td><td>${c}/${a}</td></tr>`).join('');
  res.send(page('Results', `<div class="top"><h1>Results: Master ${m} · Test ${t}</h1><a href="/dashboard">Dashboard</a></div><div class="card"><h2>Score: ${correct}/${total}</h2><p>Answered: ${answered}/${total}</p><table><tr><th>Knowledge Area</th><th>Score</th></tr>${breakdown}</table><a class="button" href="/review/${m}/${t}">Review answers</a></div>`));
});

app.get('/review/:m/:t', requireUser, async (req,res)=>{
  const [m,t] = [Number(req.params.m),Number(req.params.t)];
  const r = await query(`SELECT q.*,ua.selected_option,ua.is_correct FROM questions q LEFT JOIN user_answers ua ON ua.question_id=q.id AND ua.user_id=$1 WHERE q.master_set=$2 AND q.test_number=$3 ORDER BY q.question_number`,[req.session.user.id,m,t]);
  const items = r.rows.map(q=>`<div class="card"><div class="meta">Q${q.question_number} · ${q.knowledge_area}</div><p>${q.question_text}</p><p>Your answer: <b>${q.selected_option || 'Not answered'}</b> · Correct: <b>${q.correct_option}</b></p><p>${q.explanation}</p></div>`).join('');
  res.send(page('Review', `<div class="top"><h1>Review Master ${m} · Test ${t}</h1><a href="/dashboard">Dashboard</a></div>${items}`));
});

app.listen(PORT, ()=> console.log(`CBAP quiz app running on port ${PORT}`));
