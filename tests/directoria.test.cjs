const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const DATA_URL='https://raw.githubusercontent.com/DanielBrasilIOC/brasil/main/data.json';
const els={status:{textContent:''},answer:{textContent:'',hidden:true},q:{value:'',addEventListener(){}},ask:{addEventListener(){}}};
const document={getElementById:id=>els[id],querySelectorAll:()=>[]};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const money=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const rows=d=>Array.isArray(d?.rows)?d.rows:[];
const dsById=(d,id)=>d.datasets.find(x=>x.id===id);
const valueKey=r=>Object.keys(r||{}).find(k=>['valor','saldo','total'].includes(norm(k)))||Object.keys(r||{}).find(k=>/valor|saldo|total|liquido|bruto/.test(norm(k))&&!/data|pagamento/.test(norm(k)));
const nameKey=r=>Object.keys(r||{}).find(k=>/favorecido|beneficiario|fornecedor|nome|credor/.test(norm(k)));
const parseMoney=v=>{if(typeof v==='number')return v;const s=String(v??'').replace(/[^0-9,.-]/g,'');return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)||0};
(async()=>{
 const res=await fetch(DATA_URL+'?director='+Date.now(),{cache:'no-store'});assert.equal(res.ok,true);const data=await res.json();
 const ds=dsById(data,'ordens_bancarias'), nk=nameKey(rows(ds)[0]), vk=valueKey(rows(ds)[0]);
 const fiotec=rows(ds).filter(r=>norm(r[nk]||'').includes('fiotec'));
 const exact=fiotec.filter(r=>Math.abs(parseMoney(r[vk])-200000)<0.005);
 const ctx={document,console,Date,Intl,Map,Set,Number,String,Array,Object,Math,JSON,fetch:async()=>({ok:true,json:async()=>data})};vm.createContext(ctx);
 const source=fs.readFileSync(require('node:path').join(__dirname,'..','agent.js'),'utf8')+'\nglobalThis.__answer=answer; globalThis.__ready=load();';vm.runInContext(source,ctx);await ctx.__ready;const ask=q=>String(ctx.__answer(q));
 const variants=['Foi pago R$ 200.000,00 à Fiotec?','Foi pago 200.000,00 para a Fiotec?','Pagaram 200 mil para Fiotec?'];
 for(const q of variants){const a=ask(q);assert.ok(!/Encontrei .*correspondência/i.test(a),`resposta genérica para pergunta objetiva: ${a}`);if(exact.length){assert.match(a,/^Sim\./,`deveria confirmar pagamento: ${a}`);assert.ok(a.includes('R$ 200.000,00'),`valor ausente: ${a}`)}else{assert.match(a,/^Não\./,`deveria negar pagamento exato: ${a}`);assert.ok(a.includes('R$ 200.000,00'),`valor consultado ausente: ${a}`)}}
 const totalFiotec=fiotec.reduce((s,r)=>s+parseMoney(r[vk]),0);const totalAnswer=ask('Quanto foi pago à Fiotec?');assert.ok(totalAnswer.includes(money(totalFiotec)),`total Fiotec divergente: ${totalAnswer}`);
 const noMatch=ask('Foi pago R$ 200.000,01 à Fiotec?');assert.match(noMatch,/^(Sim|Não)\./);assert.ok(noMatch.includes('R$ 200.000,01'));
 console.log(`AUDITORIA DIRETORIA PASSOU: ${variants.length+2} consultas de linguagem natural; Fiotec possui ${fiotec.length} registro(s) e ${exact.length} pagamento(s) exato(s) de R$ 200.000,00.`);
})().catch(e=>{console.error(e);process.exitCode=1});
