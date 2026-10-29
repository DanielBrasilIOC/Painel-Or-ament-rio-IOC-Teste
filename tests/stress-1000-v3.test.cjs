const fs=require('node:fs');const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'stress-1000-v2.test.cjs'),'utf8');
const extra=`
const extraP=['Qual é o total consolidado informado para {n}?','Quanto está disponível atualmente em {n}?','Qual valor a aba {n} apresenta?','Qual montante aparece atualmente em {n}?','Quanto está registrado atualmente na base {n}?','Qual é o valor informado atualmente em {n}?','Quanto está contabilizado em {n}?','Qual o total financeiro indicado em {n}?','Qual o valor consolidado da aba {n}?'];
for(const d of data.datasets){for(const p of extraP){if(cases.length>=1000)break;add(p.replace('{n}',d.title),money(d.total),'total');}if(cases.length>=1000)break;}
while(cases.length<1000){const d=data.datasets[cases.length%data.datasets.length];add('Qual é o total consolidado da aba '+d.title+'?',money(d.total),'total');}
const uniqueQuestionCount=new Set(cases.map(x=>x.q)).size;console.log('QUESTOES_UNICAS='+uniqueQuestionCount);if(uniqueQuestionCount!==cases.length)throw new Error('Perguntas repetidas: '+uniqueQuestionCount+' únicas em '+cases.length);
`;
let patched=src.replace("assert.equal(cases.length,1000,`geradas ${cases.length}`);",extra+"assert.equal(cases.length,1000,`geradas ${cases.length}`);");
patched=patched.replaceAll('AUDITORIA_1000_V2','AUDITORIA_1000_V3').replaceAll('V2 — perguntas diferentes','V3 — perguntas diferentes').replaceAll('stress-1000-v2-report.json','stress-1000-v3-report.json');
if(patched===src)throw new Error('ponto de inserção não encontrado');
vm.runInNewContext(patched,{require,process,console,__dirname,Buffer,setTimeout,clearTimeout,fetch},{filename:'stress-1000-v3.test.cjs'});