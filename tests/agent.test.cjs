const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const DATA_URL = 'https://raw.githubusercontent.com/DanielBrasilIOC/brasil/main/data.json';
const els = {
  status:{textContent:'',className:''},
  answer:{textContent:'',hidden:true},
  q:{value:'',addEventListener(){}},
  ask:{addEventListener(){}}
};
const document = {getElementById:id=>els[id],querySelectorAll:()=>[]};

function brl(v){ return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function norm(s){ return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function valueKey(r){ return Object.keys(r||{}).find(k=>['valor','saldo','total'].includes(norm(k))) || Object.keys(r||{}).find(k=>/valor|saldo|total|liquido|bruto/.test(norm(k))&&!/data|pagamento/.test(norm(k))); }
function dateValue(r){
  const entries=Object.entries(r||{});
  entries.sort(([a],[b])=>{const rank=k=>{const n=norm(k); if(n==='data_pagamento')return 0;if(n==='data')return 1;return 99;};return rank(a)-rank(b);});
  for(const [k,v] of entries){const n=norm(k); if(!(n.includes('data')||n.includes('pagamento')))continue; const s=String(v??'').trim(); const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if(m)return `${m[3]}-${m[2]}-${m[1]}`; if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);}
  return null;
}
function rows(ds){return Array.isArray(ds?.rows)?ds.rows:[];}
function dsById(data,id){return data.datasets.find(d=>d.id===id);}
function sumValues(ds){const k=valueKey(rows(ds)[0]||{}); return rows(ds).reduce((s,r)=>s+Number(r[k]||0),0);}
function monthRange(month,year=2026){const m={janeiro:1,fevereiro:2,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12}[month]; const start=`${year}-${String(m).padStart(2,'0')}-01`; const end=m===12?`${year+1}-01-01`:`${year}-${String(m+1).padStart(2,'0')}-01`; return [start,end];}

(async()=>{
  const res=await fetch(DATA_URL+'?audit='+Date.now(),{cache:'no-store'});
  assert.equal(res.ok,true,'produção data.json deve estar acessível');
  const data=await res.json();
  assert.ok(Array.isArray(data.datasets)&&data.datasets.length===8,'devem existir 8 conjuntos de dados');

  // Integridade da base: contagem e totais declarados precisam bater com os registros.
  for(const ds of data.datasets){
    assert.equal(ds.detail_count,rows(ds).length,`${ds.id}: detail_count divergente`);
    const sum=sumValues(ds);
    assert.ok(Math.abs(sum-Number(ds.total))<0.01,`${ds.id}: total declarado ${ds.total} != soma ${sum}`);
    for(const r of rows(ds)){
      const v=Number(r[valueKey(r)]||0);
      assert.ok(Number.isFinite(v),`${ds.id}: valor não numérico`);
      assert.ok(v>=0,`${ds.id}: valor negativo inesperado`);
    }
  }

  const context={document,console,Date,Intl,Map,Set,Number,String,Array,Object,Math,JSON,fetch:async()=>({ok:true,json:async()=>data})};
  vm.createContext(context);
  const source=fs.readFileSync(require('node:path').join(__dirname,'..','agent.js'),'utf8')+'\nglobalThis.__answer = answer; globalThis.__ready = load();';
  vm.runInContext(source,context);
  await context.__ready;
  const ask=q=>String(context.__answer(q));

  const checks=[];
  function check(label,q,expected){const a=ask(q); assert.ok(a.includes(expected),`${label}: esperado ${expected}; resposta: ${a}`); checks.push(label); return a;}

  check('saldo financeiro','Qual é o saldo financeiro?',brl(dsById(data,'financeiro').total));
  check('restos a pagar','Quanto temos de restos a pagar?',brl(dsById(data,'restos').total));
  check('empenhos','Quanto temos de empenhos?',brl(dsById(data,'empenhos').total));
  check('saldo orçamentário','Qual é o saldo orçamentário?',brl(dsById(data,'orcamentario').total));
  check('aguardando repasse','Quanto temos aguardando repasse?',brl(dsById(data,'repasses').total));
  check('ordens bancárias','Qual o total das ordens bancárias?',brl(dsById(data,'ordens_bancarias').total));
  check('publicações pagas','Qual o total de publicações pagas?',brl(dsById(data,'publicacoes_pagas').total));
  check('diárias pagas','Qual o total de diárias pagas?',brl(dsById(data,'diarias_pagas').total));

  // Caso crítico informado e validado anteriormente.
  check('Jerônimo total','Quanto recebeu Jerônimo em diárias?',brl(11191.28));
  check('Jerônimo por mês','Quanto recebeu Jerônimo em diárias em março de 2026?',brl(2480.90));

  // Última OB global e última OB por período devem respeitar a data real.
  const obs=rows(dsById(data,'ordens_bancarias')).map(r=>({r,date:dateValue(r)})).filter(x=>x.date).sort((a,b)=>b.date.localeCompare(a.date)||String(b.r.ob).localeCompare(String(a.r.ob)));
  const latest=obs[0];
  check('última OB global','Qual foi a última OB paga?',latest.r.ob);
  const [augStart,augEnd]=monthRange('agosto',2026);
  const aug=obs.filter(x=>x.date>=augStart&&x.date<augEnd)[0];
  check('última OB de agosto','Qual foi a última OB paga em agosto de 2026?',aug.r.ob);

  // Top 5: a primeira posição precisa ser o maior valor real da base.
  const top=rows(dsById(data,'ordens_bancarias')).slice().sort((a,b)=>Number(b.valor)-Number(a.valor));
  check('maior pagamento','Qual foi o maior pagamento?',top[0].ob);
  check('top 5 pagamentos','Quais foram os 5 maiores pagamentos?',top.slice(0,5)[0].ob);

  // Limite monetário: resultado deve ser compatível com cálculo direto da base.
  const threshold=1000000;
  const above=rows(dsById(data,'ordens_bancarias')).filter(r=>Number(r.valor)>threshold);
  const aboveTotal=above.reduce((s,r)=>s+Number(r.valor),0);
  const aboveAnswer=check('pagamentos acima de 1 milhão','Quais pagamentos foram acima de R$ 1.000.000?',`${above.length} registro(s)`);
  assert.ok(aboveAnswer.includes(brl(aboveTotal)),`total acima de 1 milhão divergente: ${aboveAnswer}`);

  // Filtro mensal genérico: o total retornado precisa bater com a soma dos registros do mês.
  const [julStart,julEnd]=monthRange('julho',2026);
  const july=rows(dsById(data,'ordens_bancarias')).filter(r=>{const d=dateValue(r);return d&&d>=julStart&&d<julEnd;});
  const julyTotal=july.reduce((s,r)=>s+Number(r.valor),0);
  const julyAnswer=check('pagamentos de julho','Quanto foi pago em julho de 2026?',brl(julyTotal));
  assert.ok(julyAnswer.includes(`Registros: ${july.length}`),`contagem de julho divergente: ${julyAnswer}`);

  // Pergunta sem base suficiente não pode inventar valor.
  const unknown=ask('Qual foi o valor pago ao favorecido XYZ_INEXISTENTE_987?');
  assert.ok(/não consegui|não encontrei|não há|não fornec|correspondência/i.test(unknown),'pergunta sem correspondência não deve inventar resposta');

  // Perguntas livres, ausência de campos e ação de limpar devem funcionar na interface.
  const missingField=ask('Qual é o telefone do favorecido?');
  assert.match(missingField,/não consta em nosso banco de dados/i,'campo ausente deve ser declarado explicitamente');
  const ui=fs.readFileSync(require('node:path').join(__dirname,'..','consulta.html'),'utf8');
  assert.ok(!/class="examples"/.test(ui),'a interface não deve exibir perguntas predefinidas');
  assert.ok(/id="clear"/.test(ui),'a interface deve oferecer o botão Limpar pergunta');
  els.q.value='pergunta de teste';
  els.answer.textContent='resposta anterior';
  els.answer.hidden=false;
  context.clearQuestion();
  assert.equal(els.q.value,'','Limpar pergunta deve esvaziar o campo');
  assert.equal(els.answer.textContent,'','Limpar pergunta deve remover a resposta anterior');
  assert.equal(els.answer.hidden,true,'a resposta anterior deve ficar oculta após limpar');
  console.log(`AUDITORIA PASSOU: ${checks.length} consultas + integridade dos 8 datasets.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
