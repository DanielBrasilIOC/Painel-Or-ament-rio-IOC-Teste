const assert = require('node:assert/strict');

const DATA_URL = 'https://raw.githubusercontent.com/DanielBrasilIOC/brasil/agente-teste/data.json';

(async () => {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  assert.equal(response.ok, true, 'A base de teste deve estar acessível');
  const data = await response.json();

  // O agente de correções consulta a base isolada do branch de teste.
  global.fetch = async () => ({ ok: true, json: async () => data });
  global.answer = () => 'fallback legado';
  require('../agent-fixes.js');
  await global.__agentFixReady;

  const ask = q => String(global.answer(q) || '');
  const cases = [
    ['top 10 ordens bancárias', 'Ranking das 10 maiores ordens bancárias pagas'],
    ['quais são as dez maiores ordens bancárias?', 'Ranking das 10 maiores ordens bancárias pagas'],
    ['me mostre os 10 maiores pagamentos bancários', 'Ranking das 10 maiores ordens bancárias pagas'],
    ['quem mais viajou?', 'Quem mais viajou, considerando PCDPs distintos'],
    ['quem realizou mais viagens no IOC?', 'Quem mais viajou, considerando PCDPs distintos'],
    ['quem fez mais viagens?', 'Quem mais viajou, considerando PCDPs distintos'],
    ['listar os nomes de quem viajou', 'Pessoas com viagem identificada'],
    ['quais pessoas viajaram?', 'Pessoas com viagem identificada'],
    ['mostre a relação de viajantes', 'Pessoas com viagem identificada'],
    ['quantas viagens foram feitas?', 'Foram identificadas 188 viagens distintas'],
    ['qual o total de viagens registradas?', 'Foram identificadas 188 viagens distintas'],
    ['top 5 viajantes', 'Ranking dos 5 viajantes'],
    ['10 maiores viajantes', 'Ranking dos 10 viajantes'],
    ['qual a última OB paga?', 'última ordem bancária'],
    ['quem mais viajou no período?', 'Quem mais viajou, considerando PCDPs distintos']
  ];

  const failures = [];
  const outputs = [];
  for (const [question, expected] of cases) {
    const answer = ask(question);
    outputs.push({ question, answer });
    if (!answer.toLowerCase().includes(expected.toLowerCase())) {
      failures.push({ question, expected, answer: answer.slice(0, 260) });
    }
  }

  const leaders = ask('quem mais viajou?');
  assert.match(leaders, /ELIZABETH FERREIRA RANGEL[\s\S]*9 viagem/);
  assert.match(leaders, /JERONIMO AUGUSTO FONSECA ALENCAR[\s\S]*9 viagem/);
  const names = ask('listar os nomes de quem viajou');
  assert.match(names, /105 nomes/);
  assert.match(names, /PAULO JOSE LEITE/);
  const ranking = ask('top 10 ordens bancárias');
  assert.match(ranking, /3\.545\.248,00/);
  assert.match(ranking, /254463252012026OB000089/);
  assert.match(ranking, /Registros classificados: 807/);

  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
  console.log('APROVADO: ' + cases.length + ' perguntas em linguagem natural; top 10 OBs, última OB, ranking e lista de viajantes validados; 0 falhas.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
