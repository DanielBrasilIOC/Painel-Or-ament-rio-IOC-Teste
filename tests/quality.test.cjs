const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const URL='https://raw.githubusercontent.com/DanielBrasilIOC/brasil/agente-teste/data.json';
const els={status:{textContent:'',className:''},answer:{textContent:'',hidden:true},q:{value:'',addEventListener(){},focus(){}},ask:{addEventListener(){}}};
const document={getElementById:id=>els[id],querySelectorAll:()=>[]};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const money=v=>{if(typeof v==='number')return v;const s=String(v??'').replace(/[^0-9,.-]/g,'');return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)||0};
const brl=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const rows=d=>Array.isArray(d?.rows)?d.rows:[];
(async()=>{
 const res=await fetch(URL);assert.equal(res.ok,true);const data=await res.json();
 const ctx={document,console,Date,Intl,Map,Set,Number,String,Array,Object,Math,JSON,fetch:async()=>({ok:true,json:async()=>data})};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..','agent.js'),'utf8'),ctx);await ctx.load();
 const ask=q=>String(ctx.answer(q)),get=id=>data.datasets.find(d=>d.id===id),checks=[];
 function check(label,q,expected){const a=ask(q);assert.ok(a.includes(expected),label+' falhou: '+a+'; esperado '+expected);checks.push(label);return a}
 for(const [id,q] of [['financeiro','Qual é o saldo financeiro?'],['restos','Quanto temos de restos a pagar?'],['empenhos','Quanto temos de empenhos em 2026?'],['orcamentario','Qual é o saldo orçamentário?'],['repasses','Quanto está aguardando repasse?'],['ordens_bancarias','Qual o total das ordens bancárias?'],['publicacoes_pagas','Quanto foi pago em publicações científicas?'],['diarias_pagas','Qual o total de diárias pagas?']])check('total '+id,q,brl(get(id).total));
 const ob=get('ordens_bancarias'),sorted=rows(ob).slice().sort((a,b)=>money(b.valor)-money(a.valor));
 const top=check('top 10 OB','Top 10 ordens bancárias',String(sorted[0].ob));
 for(const r of sorted.slice(0,10))assert.ok(top.includes(String(r.ob)),'Top 10 omitiu OB '+r.ob);
 assert.ok(top.includes(brl(money(sorted[0].valor))),'Top 10 não exibiu valor correto');
 const latest=rows(ob).slice().sort((a,b)=>{const dt=x=>{const m=String(x.data_pagamento||x.data||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?m[3]+'-'+m[2]+'-'+m[1]:''};return dt(b).localeCompare(dt(a))||String(b.ob||'').localeCompare(String(a.ob||''))})[0];
 check('última OB','Qual foi a última ordem bancária paga?',String(latest.ob));
 const daily=get('diarias_pagas'),map=new Map();
 for(const r of rows(daily)){const m=String(r.observacao||'').match(/\bPCDP\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]*)/i);if(m&&r.favorecido){const k=norm(r.favorecido)+'|'+m[1].toUpperCase();if(!map.has(k))map.set(k,{name:r.favorecido,id:m[1].toUpperCase()})}}
 const people=new Map();for(const x of map.values()){const k=norm(x.name);if(!people.has(k))people.set(k,{name:x.name,count:0});people.get(k).count++}
 const ranking=[...people.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pt-BR'));
 const travel=check('quem mais viajou','Quem mais viajou?',ranking[0].name);assert.ok(travel.includes(String(ranking[0].count)),'contagem do líder ausente');
 const names=check('nomes de viajantes','Liste os nomes de quem viajou',ranking[0].name);for(const x of ranking)assert.ok(names.includes(x.name),'lista omitiu '+x.name);
 check('quantidade de viagens','Quantas viagens foram realizadas?',String(map.size));
 const jer=rows(daily).filter(r=>norm(r.favorecido).includes('jeronimo')).reduce((a,r)=>a+money(r.valor),0);if(jer)check('total Jerônimo','Quanto recebeu Jerônimo em diárias?',brl(jer));
 const threshold=1000000,above=rows(ob).filter(r=>money(r.valor)>threshold),ta=check('limite monetário','Quais OBs superaram R$ 1.000.000?',String(above.length)+' registro(s)');assert.ok(ta.includes(brl(above.reduce((a,r)=>a+money(r.valor),0))),'total acima do limite divergente');
 const inventory=ask('Quais são todos os campos disponíveis no dashboard?');for(const d of data.datasets)for(const k of [...new Set(rows(d).flatMap(r=>Object.keys(r)))])assert.ok(inventory.includes(k),'inventário omitiu '+d.id+'.'+k);
 const unknown=ask('Qual foi o telefone de XYZ_INEXISTENTE?');assert.match(unknown,/não consegui|não encontrei|não vou inventar|informe/i);
 const noId=ask('Qual é a observação do empenho?');assert.match(noId,/identificar o registro|informe/i);
 const biggest=check('maior OB em pergunta singular','Qual foi a maior OB?',String(sorted[0].ob));assert.ok(biggest.includes('Ranking das 1 maiores'),'pergunta singular deve retornar somente a maior OB');
 const naturalTop=check('dez maiores em linguagem natural','Mostre as dez maiores ordens bancárias',String(sorted[0].ob));for(const r of sorted.slice(0,10))assert.ok(naturalTop.includes(String(r.ob)),'formulação natural omitiu OB '+r.ob);
 const latestVariant=check('OB mais recente','Qual é a OB mais recente?',String(latest.ob));
 const jerVariant=check('nome parcial Jerônimo','Quanto recebeu Jerônimo em diárias?',brl(11191.28));
 const travelersVariant=check('servidores que viajaram','Quais servidores viajaram?',ranking[0].name);for(const x of ranking)assert.ok(travelersVariant.includes(x.name),'variante de viajantes omitiu '+x.name);
 const receivedDaily=check('quem recebeu diárias','Quem recebeu diárias?',ranking[0].name);
 const proc=check('processo por identificador','Qual é o processo da OB '+latest.ob+'?',String(latest.processo));
 const obs=check('observação por identificador','Qual é a observação da OB '+latest.ob+'?',String(latest.observacao).slice(0,35));
 const html=fs.readFileSync(require('node:path').join(__dirname,'..','consulta.html'),'utf8');assert.ok(!html.includes('agent-fixes.js'),'interface ainda carrega camadas antigas');assert.ok(html.includes('agent.js?v=20261030-0001'),'interface não carrega o motor novo');
 console.log('AUDITORIA DE QUALIDADE: '+checks.length+' cenários principais aprovados; '+map.size+' PCDPs distintos, '+ranking.length+' viajantes e '+data.datasets.length+' bases.');
})().catch(e=>{console.error(e);process.exitCode=1});
