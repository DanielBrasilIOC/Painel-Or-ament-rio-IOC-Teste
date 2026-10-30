const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const URL='https://raw.githubusercontent.com/DanielBrasilIOC/brasil/agente-teste/data.json';
const required={
 financeiro:['uge','unidade','fonte','vinculo','saldo'],
 restos:['empenho','cnpj','fornecedor','natureza_codigo','natureza','saldo'],
 empenhos:['empenho','ne_ccor','subitem','natureza','fornecedor','saldo'],
 orcamentario:['ug','ptres','fonte','natureza_codigo','saldo'],
 repasses:['processo','fornecedor','situacao_prioridade','status_empenho','saldo'],
 ordens_bancarias:['ob','data_pagamento','processo','cnpj','favorecido','valor'],
 publicacoes_pagas:['data','ob','favorecido','processo','valor'],
 diarias_pagas:['favorecido','data_pagamento','documento','observacao','valor']
};
const money=v=>{if(typeof v==='number')return v;const s=String(v??'').trim().replace(/[^0-9,.-]/g,'');return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)||0};
(async()=>{
 const response=await fetch(URL+'?contract='+Date.now(),{cache:'no-store'});
 assert.equal(response.ok,true,'a base isolada de teste precisa estar acessível');
 const data=await response.json();
 assert.ok(/^20\d{2}-\d{2}-\d{2}$/.test(data.source_updated_at||''),'data de atualização ausente ou inválida');
 assert.ok(Array.isArray(data.datasets),'datasets precisa ser uma lista');
 const ids=data.datasets.map(d=>d.id);
 assert.equal(new Set(ids).size,ids.length,'há IDs de conjuntos duplicados');
 assert.deepEqual([...ids].sort(),Object.keys(required).sort(),'o contrato deve conter os oito conjuntos esperados');
 let totalRows=0,totalFields=0;
 for(const [id,fields] of Object.entries(required)){
  const d=data.datasets.find(x=>x.id===id);
  assert.ok(d, 'conjunto ausente: '+id);
  assert.ok(Array.isArray(d.rows),id+': rows precisa ser uma lista');
  assert.ok(d.rows.length>0,id+': conjunto sem registros');
  assert.ok(Number.isFinite(Number(d.total)),id+': total financeiro não numérico');
  const keys=[...new Set(d.rows.flatMap(r=>Object.keys(r||{})))];
  for(const field of fields)assert.ok(keys.includes(field),id+': campo obrigatório ausente '+field);
  for(const row of d.rows)assert.ok(row&&typeof row==='object'&&!Array.isArray(row),id+': linha malformada');
  const valueField=keys.includes('valor')?'valor':'saldo';
  const sum=d.rows.reduce((a,r)=>a+money(r[valueField]),0);
  assert.ok(Math.abs(sum-Number(d.total))<0.005,id+': total diverge da soma de '+valueField+'; soma='+sum+' total='+d.total);
  totalRows+=d.rows.length;totalFields+=keys.length;
 }
 const agent=fs.readFileSync(path.join(__dirname,'..','agent.js'),'utf8');
 assert.ok(agent.includes('/brasil/agente-teste/data.json'),'motor não aponta para a base isolada de teste');
 assert.ok(!agent.includes('/brasil/main/data.json'),'motor de teste não pode consultar a base de produção');
 console.log('CONTRATO DE DADOS APROVADO: '+ids.length+' conjuntos, '+totalRows+' registros, '+totalFields+' campos distintos; totais conciliados e fonte isolada.');
})().catch(e=>{console.error(e);process.exitCode=1;});
