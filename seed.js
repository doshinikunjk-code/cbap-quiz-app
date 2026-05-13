import { migrate } from './schema.js';
import { query, pool } from './db.js';
import { allQuestions } from './questionFactory.js';

export async function seed() {
  await migrate();
  const count = await query('SELECT COUNT(*)::int AS count FROM questions');
  if (count.rows[0].count >= 2880) return;
  const rows = allQuestions();
  for (const q of rows) {
    await query(`INSERT INTO questions
      (master_set,test_number,question_number,knowledge_area,scenario,question_text,option_a,option_b,option_c,option_d,correct_option,explanation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT(master_set,test_number,question_number) DO UPDATE SET
      knowledge_area=EXCLUDED.knowledge_area, scenario=EXCLUDED.scenario, question_text=EXCLUDED.question_text,
      option_a=EXCLUDED.option_a, option_b=EXCLUDED.option_b, option_c=EXCLUDED.option_c, option_d=EXCLUDED.option_d,
      correct_option=EXCLUDED.correct_option, explanation=EXCLUDED.explanation`,
      [q.masterSet,q.testNumber,q.questionNumber,q.knowledgeArea,q.scenario,q.questionText,q.optionA,q.optionB,q.optionC,q.optionD,q.correctOption,q.explanation]);
  }
}

if (process.argv[1].endsWith('seed.js')) {
  seed().then(() => { console.log('Seed complete'); pool.end(); }).catch(e => { console.error(e); process.exit(1); });
}
