const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const URL='https://raw.githubusercontent.com/DanielBrasilIOC/brasil/agente-teste/data.json';
const els={status:{textContent:'',className:''},answer:{textContent:'',hidden:true},q:{value:'',addEventListener(){}},ask:{addEventListener(){}}};
const document={getElementById:id=>els[id],querySelectorAll:()=>[]};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const compact=s=>norm(s).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const rows=d=>Array.isArray(d?.rows)?d.rows:[];
const anchors=['ob','documento','empenho','processo','numero_solicitacao','solicitacao_ne','cnpj','ne_ccor','pi','ptres','fonte','uge','unidade'];
const leads=['Por favor, ','Preciso conferir: ','Na conferência dos dados, ','Para uma consulta da diretoria, ','Pode verificar para mim: ','Gostaria de confirmar: ','Só para checar, ','Na base do painel, ','Em relação aos dados, ','Me ajude com uma informação: '];
const patterns=[
 'qual é o valor do campo {field} no registro {id} da aba {dataset}?',
 'informe o campo {field} que consta no registro {id} da aba {dataset}.',
 'o que aparece no campo {field} do registro {id} na base {dataset}?',
 'me diga o conteúdo do campo {field} referente ao registro {id} em {dataset}.',
 'qual informação está registrada no campo {field} para o registro {id} de {dataset}?',
 'localize o campo {field} do registro {id} em {dataset}.',
 'confira o valor do campo {field} no registro {id} da base {dataset}.',
 'no registro {id} de {dataset}, mostre o campo {field}.',
 'para o registro {id} da aba {dataset}, qual é o campo {field}?',
 'qual dado está associado ao campo {field} no registro {id} de {dataset}?'
];
(async()=>{
 const response=await fetch(URL+'?million-audit='+Date.now(),{cache:'no-store'});
 assert.equal(response.ok,true,'A base isolada de teste precisa estar acessível');
 const data=await response.json();
 assert.equal(data.datasets.length,8,'A base de teste deve conter 8 conjuntos');
 const context={document,console,Date,Intl,Map,Set,Number,String,Array,Object,Math,JSON,fetch:async()=>({ok:true,json:async()=>data})};
 vm.createContext(context);
 const root=__dirname.replace(/[\\/]+tests$/,'');
 const agent=fs.readFileSync(root+'/agent.js','utf8')+'\nglobalThis.__ready=load();';
 vm.runInContext(agent,context);
 await context.__ready;
 const fixes=fs.readFileSync(root+'/agent-fixes.js','utf8');
 vm.runInContext(fixes,context);
 await context.__agentFixReady;
 const pairs=[];
 for(const d of data.datasets){
  const all=rows(d),counts=new Map(),valueRows=new Map();
  for(let ri=0;ri<all.length;ri++){
   const row=all[ri];
   for(const value of Object.values(row||{})){
    const token=compact(value);
    if(token.length>=5){
     if(!valueRows.has(token))valueRows.set(token,new Set());
     valueRows.get(token).add(ri);
    }
   }
   for(const k of anchors){
    const value=String(row[k]??'').trim(),token=compact(value);
    if(token.length>=5)counts.set(k+'|'+token,(counts.get(k+'|'+token)||0)+1);
   }
  }
  for(let ri=0;ri<all.length;ri++){
   const row=all[ri];let anchor=null;
   for(const k of anchors){
    const value=String(row[k]??'').trim(),token=compact(value);
    if(token.length>=5&&counts.get(k+'|'+token)===1&&valueRows.get(token)?.size===1){anchor={value};break;}
   }
   if(!anchor)continue;
   for(const [field,value] of Object.entries(row)){
    if(value===null||value===undefined||String(value).trim()==='')continue;
    pairs.push({dataset:d.title,id:anchor.value,field:field.replace(/_/g,' '),expected:String(value).trim(),datasetId:d.id});
   }
  }
 }
 const templates=leads.flatMap(lead=>patterns.map(pattern=>lead+pattern));
 const target=1000000;
 assert.ok(pairs.length*templates.length>=target,'Combinações insuficientes: '+pairs.length+' pares x '+templates.length+' frases');
 const unique=new Set(),failures=[];
 let passed=0;
 for(let i=0;i<target;i++){
  const pair=pairs[Math.floor(i/templates.length)],template=templates[i%templates.length];
  const question=template.replaceAll('{field}',pair.field).replaceAll('{id}',pair.id).replaceAll('{dataset}',pair.dataset);
  if(unique.has(question)){failures.push({i:i+1,question,expected:pair.expected,actual:'DUPLICADA'});continue;}
  unique.add(question);
  let answer='';
  try{answer=String(context.answer(question)||'');}catch(e){failures.push({i:i+1,question,expected:pair.expected,error:String(e),actual:''});continue;}
  const start=answer.indexOf('Resultado(s): ');
  const end=start>=0?answer.indexOf('\nRegistros correspondentes:',start):-1;
  const actual=start>=0?(end>=0?answer.slice(start+'Resultado(s): '.length,end):answer.slice(start+'Resultado(s): '.length)).trim():null;
  if(actual===pair.expected)passed++;
  else if(failures.length<200)failures.push({i:i+1,dataset:pair.dataset,record:pair.id,field:pair.field,question,expected:pair.expected,actual,answer:answer.slice(0,700)});
 }
 const report={generated_at:new Date().toISOString(),base_updated_at:data.source_updated_at,datasets:data.datasets.map(d=>({id:d.id,title:d.title,rows:rows(d).length})),record_field_pairs:pairs.length,templates:templates.length,total_questions:target,unique_questions:unique.size,passed,failed:target-passed,pass_rate:passed/target,status:passed===target&&unique.size===target?'PASSOU':'REPROVADO',failures};
 fs.writeFileSync('stress-1000000-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({AUDITORIA_1000000:report.status,total:target,unique:unique.size,passed,failed:target-passed,pass_rate:report.pass_rate,record_field_pairs:pairs.length,templates:templates.length},null,2));
 if(report.status!=='PASSOU')process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
