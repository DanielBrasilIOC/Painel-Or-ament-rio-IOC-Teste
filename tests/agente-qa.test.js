const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DATA_URL = 'https://raw.githubusercontent.com/DanielBrasilIOC/brasil/agente-teste/data.json';

(async () => {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  assert.equal(response.ok, true, 'A base isolada do ambiente de teste deve estar acessível');
  const data = await response.json();

  // Simula somente os elementos de tela necessários para executar o agente real.
  global.document = {
    getElementById: () => null,
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  };
  global.window = global;
  global.addEventListener = () => {};
  global.fetch = async () => ({ ok: true, json: async () => data });

  require('../agent.js');
  await global.load();
  require('../agent-fixes.js');
  await global.__agentFixReady;

  const ask = q => String(global.answer(q) || '');
  const cases = [
    ['top 10 ordens bancárias', 'Ranking das 10 maiores ordens bancárias pagas'],
    ['quais são as dez maiores ordens bancárias?', 'Ranking das 10 maiores ordens bancárias pagas'],
    ['me mostre os 10 maiores pagamentos bancários', 'Ranking das 10 maiores ordens bancárias pagas'],
    ['quem recebeu o maior pagamento?', 'Ranking das 1 maiores ordens bancárias pagas'],
    ['qual foi a maior OB?', 'Ranking das 1 maiores ordens bancárias pagas'],
    ['quais OBs foram pagas em outubro?', '138 ordens bancárias pagas em Outubro de 2026'],
    ['top 10 OBs em outubro', 'Exibindo 10 de 138 registros'],
    ['qual foi a OB paga em 27/10/2026?', '5 ordens bancárias pagas em 27/10/2026'],
    ['quem mais viajou?', 'Quem mais viajou, considerando PCDPs distintos'],
    ['quem realizou mais viagens no IOC?', 'Quem mais viajou, considerando PCDPs distintos'],
    ['quem são os viajantes?', '105 nomes'],
    ['listar os nomes de quem viajou', '105 nomes'],
    ['quantas pessoas viajaram?', '105 pessoas'],
    ['quantas PCDPs existem?', '188 viagens distintas'],
    ['quantas viagens foram feitas?', '188 viagens distintas'],
    ['top 5 viajantes', 'Ranking dos 5 viajantes'],
    ['10 maiores viajantes', 'Ranking dos 10 viajantes'],
    ['qual foi a última OB paga?', '254463252012026OB000813'],
    ['qual o número da última OB paga?', '27/10/2026'],
    ['quanto foi pago ao Jerônimo?', '11.191,28'],
    ['quanto foi pago em publicações?', '2.754.526,58'],
    ['qual o total de pagamentos a artigos científicos?', '2.754.526,58'],
    ['qual o total de diárias pagas?', '311.632,17'],
    ['quantos empenhos existem?', 'Registros: 231'],
    ['qual o saldo financeiro total?', '119.416,18'],
    ['quanto temos de saldo orçamentário?', '9.892,63'],
    ['qual o total de restos a pagar?', '4.526.062,32'],
    ['quanto está aguardando repasse?', '1.481.215,65']
  ];

  const failures = [];
  for (const [question, expected] of cases) {
    const answer = ask(question);
    if (!answer.toLowerCase().includes(expected.toLowerCase())) {
      failures.push({ question, expected, answer: answer.slice(0, 350) });
    }
  }

  const leaders = ask('quem mais viajou?');
  assert.match(leaders, /ELIZABETH FERREIRA RANGEL[\s\S]*9 viagem/);
  assert.match(leaders, /JERONIMO AUGUSTO FONSECA ALENCAR[\s\S]*9 viagem/);

  const names = ask('listar os nomes de quem viajou');
  assert.match(names, /105 nomes/);
  assert.match(names, /PAULO JOSE LEITE/);

  const topTen = ask('top 10 ordens bancárias');
  assert.match(topTen, /254463252012026OB000089/);
  assert.match(topTen, /Registros classificados: 807/);
  assert.equal((topTen.match(/^\d+\./gm) || []).length, 10);

  const singleLargest = ask('quem recebeu o maior pagamento?');
  assert.equal((singleLargest.match(/^\d+\./gm) || []).length, 1);

  const octoberTopTen = ask('top 10 OBs em outubro');
  assert.match(octoberTopTen, /254463252012026OB000786/);
  assert.equal((octoberTopTen.match(/^\d+\./gm) || []).length, 10);

  const dayOrders = ask('qual foi a OB paga em 27/10/2026?');
  assert.match(dayOrders, /254463252012026OB000813/);
  assert.match(dayOrders, /254463252012026OB000817/);

  // Garante que o ambiente de teste não consulte a base de produção.
  for (const file of ['../index.html', '../agent.js', '../agent-fixes.js']) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    assert.match(source, /brasil\/agente-teste\/data\.json/);
    assert.doesNotMatch(source, /brasil\/main\/data\.json/);
  }

  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
  console.log('APROVADO: ' + cases.length + ' perguntas em linguagem natural + 6 verificações de ranking, viajantes, períodos e isolamento; 0 falhas.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
