const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const URL='https://raw.githubusercontent.com/DanielBrasilIOC/brasil/main/data.json';
const els={status:{textContent:'',className:''},answer:{textContent:'',hidden:true},q:{value:'',addEventListener(){}},ask:{addEventListener(){}}};
const document={getElementById:id=>els[id],querySelectorAll:()=>[]};
const norm=s=>String(s??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const rows=d=>Array.isArray(d?.rows)?d.rows:[];
(async()=>{
 const response=await fetch(URL+'?human-audit='+Date.now(),{cache:'no-store'});
 assert.equal(response.ok,true,'data.json da produção deve estar acessível');
 const data=await response.json();
 const context={document,console,Date,Intl,Map,Set,Number,String,Array,Object,Math,JSON,fetch:async()=>({ok:true,json:async()=>data})};
 vm.createContext(context);
 const root=__dirname.replace(/[\\/]+tests$/,'');
 const agent=fs.readFileSync(root+'/agent.js','utf8')+'\\nglobalThis.__ready=load();';
 vm.runInContext(agent,context);
 await context.__ready;
 const fixes=fs.readFileSync(root+'/agent-fixes.js','utf8');
 vm.runInContext(fixes,context);
 await context.__agentFixReady;
 const ask=q=>String(context.answer(q));
 const ob=data.datasets.find(d=>d.id==='ordens_bancarias');
 const sorted=rows(ob).slice().sort((a,b)=>Number(b.valor)-Number(a.valor));
 const top=ask('Top 10 ordens bancárias');
 assert.match(top,/Ranking das 10 maiores ordens bancárias/i,'pergunta humana por top 10 OB deve gerar ranking');
 for(const r of sorted.slice(0,10))assert.ok(top.includes(String(r.ob)),`ranking omitiu OB ${r.ob}`);
 assert.ok(top.includes(money(sorted[0].valor)),'ranking deve exibir o maior valor correto');
 const daily=data.datasets.find(d=>d.id==='diarias_pagas');
 const unique=new Map();
 for(const r of rows(daily)){
   const p=String(r.observacao||'').match(/\\bPCDP\\s*[:#-]?\\s*([A-Z0-9][A-Z0-9/-]*)/i);
   if(p&&r.favorecido)unique.set(norm(r.favorecido)+'|'+p[1].toUpperCase(),{name:r.favorecido,id:p[1].toUpperCase()});
 }
 const counts=new Map();
 for(const x of unique.values()){const k=norm(x.name);const v=counts.get(k)||{name:x.name,count:0};v.count++;counts.set(k,v)}
 const expected=[...counts.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pt-BR'));
 const travel=ask('Quem mais viajou?');
 assert.match(travel,/Quem mais viajou/i,'pergunta quem mais viajou deve ser reconhecida');
 for(const x of expected.filter(x=>x.count===expected[0].count)){assert.ok(travel.includes(x.name),`ranking de viagens omitiu liderança ${x.name}`);assert.ok(travel.includes(String(x.count)),`contagem incorreta para ${x.name}`)}
 const names=ask('Liste os nomes de quem viajou');
 assert.match(names,/Pessoas com viagem identificada/i,'pedido de nomes de viajantes deve ser reconhecido');
 for(const x of expected)assert.ok(names.includes(x.name),`lista de viajantes omitiu ${x.name}`);
 assert.ok(names.includes(String(expected.length)+' nomes'),'quantidade de pessoas deve ser informada');
 const tripCount=ask('Quantas viagens foram realizadas?');
 assert.ok(tripCount.includes(String(unique.size)+' viagens distintas'),'total de viagens deve contar PCDPs distintos');
 console.log('AUDITORIA HUMANA: 4 cenários críticos aprovados; ranking top 10 OB, líderes de viagens, lista de viajantes e total de PCDPs.');
})().catch(e=>{console.error(e);process.exitCode=1;});
