const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const datasets = [
  {id:'financeiro',title:'Saldo Financeiro',source_name:'Saldo Financeiro.csv',total:119416.18,detail_count:17,rows:[{uge:'IOC',unidade:'IOC',fonte:'1000',vinculo:'Livre',saldo:119416.18}]},
  {id:'restos',title:'Restos a Pagar',source_name:'Restos a Pagar.csv',total:4526062.32,detail_count:23,rows:[{fornecedor:'Fornecedor A',saldo:4526062.32}]},
  {id:'ordens_bancarias',title:'Ordens Bancárias Pagas',source_name:'ORDEM BANCARIAS EMITIDAS.csv',total:55368182.23,detail_count:807,rows:[
    {ob:'OB000100',data:'30/07/2026',data_pagamento:'30/07/2026',favorecido:'Fornecedor A',valor:8000},
    {ob:'OB000101',data:'01/08/2026',data_pagamento:'01/08/2026',favorecido:'Fornecedor B',valor:9000}
  ]},
  {id:'diarias_pagas',title:'Diárias Pagas',source_name:'DIARIAS PAGAS.csv',total:311632.17,detail_count:188,rows:[
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'23/03/2026',valor:1240.45},
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'25/03/2026',valor:1240.45},
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'27/04/2026',valor:1290.78},
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'06/05/2026',valor:1236.60},
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'24/06/2026',valor:1236.60},
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'25/06/2026',valor:1236.60},
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'03/07/2026',valor:1236.60},
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'24/07/2026',valor:1236.60},
    {favorecido:'JERONIMO AUGUSTO FONSECA ALENCAR',data_pagamento:'21/08/2026',valor:1236.60}
  ]}
];
const els = {
  status:{textContent:'',className:''},
  answer:{textContent:'',hidden:true},
  q:{value:'',addEventListener(){}},
  ask:{addEventListener(){}}
};
const document = {getElementById:id=>els[id],querySelectorAll:()=>[]};
const context = {document,console,Date,Intl,Map,Set,Number,String,Array,Object,Math,JSON,fetch:async()=>({ok:true,json:async()=>({source_updated_at:'2026-10-28',datasets})})};
vm.createContext(context);
const source = fs.readFileSync(require('node:path').join(__dirname,'..','agent.js'),'utf8') + '\nglobalThis.__answer = answer; globalThis.__ready = load();';
vm.runInContext(source,context);
(async()=>{
  await context.__ready;
  const tests = [
    ['saldo financeiro','Qual é o saldo financeiro?','R$ 119.416,18'],
    ['Jerônimo total','Quanto recebeu Jerônimo em diárias?','R$ 11.191,28'],
    ['última OB','Qual foi a última OB paga?','01/08/2026'],
    ['restos a pagar','Quanto temos de restos a pagar?','R$ 4.526.062,32']
  ];
  for(const [label,q,expected] of tests){
    const answer=context.__answer(q);
    assert.ok(answer.includes(expected),label+' expected '+expected+' but got: '+answer);
    assert.ok(!answer.includes('\\\\n'),label+' contains escaped line breaks');
    console.log('PASS',label);
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
