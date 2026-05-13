export const knowledgeAreas = [
  'Business Analysis Planning and Monitoring',
  'Elicitation and Collaboration',
  'Requirements Life Cycle Management',
  'Strategy Analysis',
  'Requirements Analysis and Design Definition',
  'Solution Evaluation'
];

const industries = ['bank', 'insurance company', 'credit union', 'telecom provider', 'retail chain', 'education platform'];
const projects = ['digital onboarding portal', 'claims modernization program', 'payments platform upgrade', 'customer self-service app', 'CRM replacement', 'regulatory reporting solution'];

const templates = {
  'Business Analysis Planning and Monitoring': [
    ['A {industry} starts a {project}. Stakeholders are distributed across IT, operations, compliance, and business units. What should the BA do first?', ['Define the business analysis approach and stakeholder engagement plan','Start writing detailed test cases','Ask developers to choose the requirements format','Wait until the project manager finalizes all tasks'], 0, 'Planning the BA approach and stakeholder engagement is necessary before detailed work begins.'],
    ['A project has high uncertainty and frequent feedback cycles. What BA approach is most suitable?', ['A predictive approach with no change tolerance','An adaptive approach with iterative elicitation and validation','No documented approach','Only post-implementation analysis'], 1, 'Frequent change and uncertainty call for an adaptive BA approach.'],
    ['A sponsor asks why BA work needs estimates. What is the best response?', ['BA estimates help plan effort, timing, and resources for analysis activities','BA work cannot be estimated','Only developers need estimates','Estimates replace stakeholder engagement'], 0, 'BA planning includes estimating analysis activities and resources.']
  ],
  'Elicitation and Collaboration': [
    ['During a workshop for a {project}, two departments disagree about priority. What should the BA do?', ['Select the senior person’s opinion','Facilitate discussion to uncover needs and confirm outcomes','Stop the workshop permanently','Let the vendor decide'], 1, 'The BA facilitates collaboration and confirms elicitation results.'],
    ['A BA completes interviews and notices several assumptions. What should happen next?', ['Confirm elicitation results with stakeholders','Convert assumptions directly into code','Ignore assumptions until deployment','Ask only the sponsor'], 0, 'Elicitation results should be confirmed to avoid misunderstanding.'],
    ['Users are reluctant to speak openly in a group setting. Which technique may help?', ['Individual interviews','Public voting only','Skipping elicitation','Technical design review'], 0, 'Interviews can help collect sensitive or individual perspectives.']
  ],
  'Requirements Life Cycle Management': [
    ['A regulatory requirement changes after approval. What should the BA do?', ['Assess impact and manage the change through the agreed process','Reject it automatically','Update the system without communication','Ask QA to hide the issue'], 0, 'Changes should be assessed, traced, prioritized, and approved using the agreed process.'],
    ['A requirement is linked to a business objective, design element, and test case. What does this demonstrate?', ['Traceability','Brainstorming','Benchmarking','Root cause analysis'], 0, 'Traceability links requirements to objectives, designs, tests, and outcomes.'],
    ['Stakeholders disagree about which requirements are most important. What should the BA support?', ['Prioritization using agreed criteria','First-come-first-served delivery','Ignoring low-power stakeholders','Removing all nonfunctional requirements'], 0, 'The BA facilitates requirements prioritization using agreed criteria.']
  ],
  'Strategy Analysis': [
    ['A {industry} wants a {project} but has not defined the business problem. What should the BA do first?', ['Assess current state and define the business need','Start UI design','Create deployment scripts','Write training material'], 0, 'Strategy analysis begins with understanding current state and business need.'],
    ['An organization considers entering a new market. Which BA activity is most relevant?', ['Analyze risks, opportunities, capabilities, and potential value','Prepare test data','Create a sprint burndown chart','Approve invoices'], 0, 'Strategy analysis examines context, capability gaps, risks, and value.'],
    ['A solution option has high benefit but also high operational risk. What should the BA do?', ['Analyze risk and recommend mitigation or alternatives','Ignore risk because value is high','Approve the option alone','Cancel all analysis'], 0, 'Risks and mitigation are part of recommending a viable change strategy.']
  ],
  'Requirements Analysis and Design Definition': [
    ['A stakeholder says, “The system should be easy to use.” What should the BA do?', ['Convert it into measurable acceptance criteria','Record it as complete','Delete it because it is subjective','Ask developers to guess'], 0, 'Ambiguous requirements should be analyzed and made clear, measurable, and testable.'],
    ['The team needs to compare two solution approaches for a {project}. What should the BA produce?', ['Design options with analysis of value and trade-offs','Only meeting minutes','A final invoice','A production incident report'], 0, 'RADD includes defining and analyzing design options.'],
    ['A process has many exception paths. Which model would best help clarify behavior?', ['Process model or activity diagram','Organization chart only','Budget spreadsheet only','Press release'], 0, 'Process models clarify workflows, decisions, and exceptions.']
  ],
  'Solution Evaluation': [
    ['A new {project} went live, but users still rely on manual workarounds. What should the BA evaluate?', ['Whether the solution delivers expected value and identify limitations','Whether all emails were archived','Whether the project name is correct','Whether developers attended every meeting'], 0, 'Solution evaluation examines performance, value, limitations, and improvement opportunities.'],
    ['A KPI expected 30% reduction in processing time, but only 10% was achieved. What should the BA do?', ['Analyze performance results and recommend improvements','Declare success without review','Remove the KPI','Blame end users immediately'], 0, 'The BA evaluates actual performance against expected value and recommends actions.'],
    ['A solution is technically complete but adoption is low. What is the best BA focus?', ['Assess barriers to value realization','Close all requirements automatically','Stop measuring outcomes','Ignore user feedback'], 0, 'Low adoption may prevent value realization and should be evaluated.']
  ]
};

export function makeQuestion(masterSet, testNumber, questionNumber) {
  const ka = knowledgeAreas[(questionNumber - 1) % knowledgeAreas.length];
  const group = templates[ka];
  const t = group[(Math.floor((questionNumber - 1) / knowledgeAreas.length) + testNumber + masterSet) % group.length];
  const industry = industries[(masterSet + testNumber + questionNumber) % industries.length];
  const project = projects[(masterSet * testNumber + questionNumber) % projects.length];
  const scenario = t[0].replaceAll('{industry}', industry).replaceAll('{project}', project);
  return {
    masterSet,
    testNumber,
    questionNumber,
    knowledgeArea: ka,
    scenario,
    questionText: scenario,
    optionA: t[1][0], optionB: t[1][1], optionC: t[1][2], optionD: t[1][3],
    correctOption: ['A','B','C','D'][t[2]],
    explanation: t[3]
  };
}

export function allQuestions() {
  const rows = [];
  for (let m = 1; m <= 8; m++) for (let t = 1; t <= 6; t++) for (let q = 1; q <= 60; q++) rows.push(makeQuestion(m,t,q));
  return rows;
}
