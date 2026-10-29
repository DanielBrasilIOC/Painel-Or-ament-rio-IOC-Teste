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
 'me diga o conteúdo do campo {field} referente ao registro {id} na aba {dataset}.',
 'qual informação está registrada no campo {field} para o registro {id} da base {dataset}?',
 'localize o campo {field} do registro {id} na aba {dataset}.',
 'confira o valor do campo {field} no registro {id} da base {dataset}.',
 'no registro {id} da aba {dataset}, mostre o campo {field}.',
 'para o registro {id} da aba {dataset}, qual é o campo {field}?',
 'qual dado está associado ao campo {field} no registro {id} na base {dataset}?'
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
 const anchorPriority=['ob','documento','empenho','processo','numero_solicitacao','solicitacao_ne','cnpj','ne_ccor','pi','ptres','fonte','vinculo','uge','unidade'];
 for(const d of data.datasets){
  const all=rows(d),valueRows=new Map();
  for(let ri=0;ri<all.length;ri++){
   for(const value of Object.values(all[ri]||{})){
    const token=compact(value);
    if(token.length>=2){if(!valueRows.has(token))valueRows.set(token,new Set());valueRows.get(token).add(ri);}
   }
  }
  const pairMap=new Map();
  const intersect=tokens=>{
   if(!tokens.length)return[];
   let result=new Set(valueRows.get(tokens[0])||[]);
   for(const token of tokens.slice(1)){
    const next=valueRows.get(token)||new Set();
    result=new Set([...result].filter(i=>next.has(i)));
    if(!result.size)break;
   }
   return [...result].sort((a,b)=>a-b);
  };
  for(let ri=0;ri<all.length;ri++){
   const row=all[ri];
   for(const [field,value] of Object.entries(row||{})){
    if(value===null||value===undefined||String(value).trim()==='')continue;
    const targetToken=compact(value);
    const seen=new Set();
    const candidates=Object.entries(row).filter(([k,v])=>k!==field&&v!==null&&v!==undefined&&String(v).trim()!=='').map(([k,v])=>({key:k,token:compact(v),priority:anchorPriority.indexOf(k)<0?999:anchorPriority.indexOf(k)})).filter(x=>x.token.length>=2&&x.token!==targetToken&&!seen.has(x.token)&&seen.add(x.token));
    candidates.sort((a,b)=>(valueRows.get(a.token)?.size||9999)-(valueRows.get(b.token)?.size||9999)||a.priority-b.priority);
    let best=null,foundUnique=false;
    const consider=tokens=>{
     const matched=intersect(tokens);
     if(!matched.length)return false;
     if(!best||matched.length<best.rows.length||(matched.length===best.rows.length&&tokens.length<best.tokens.length))best={tokens,rows:matched};
     if(matched.length===1){foundUnique=true;return true;}
     return false;
    };
    for(const x of candidates){if(consider([x.token]))break;}
    if(!foundUnique){
     for(let a=0;a<candidates.length&&!foundUnique;a++)for(let b=a+1;b<candidates.length;b++){if(consider([candidates[a].token,candidates[b].token]))break;}
    }
    if(!foundUnique){
     for(let a=0;a<candidates.length&&!foundUnique;a++)for(let b=a+1;b<candidates.length&&!foundUnique;b++)for(let cc=b+1;cc<candidates.length;cc++){if(consider([candidates[a].token,candidates[b].token,candidates[cc].token]))break;}
    }
    if(!best)continue;
    const expectedValues=[...new Set(best.rows.map(i=>String(all[i][field]??'').trim()).filter(Boolean))];
    if(!expectedValues.length)continue;
    const id=best.tokens.join(' + '),key=d.id+'|'+id+'|'+field;
    pairMap.set(key,{dataset:d.title,id,field:field.replace(/_/g,' '),expected:expectedValues.join('; '),datasetId:d.id,rowIndex:ri,matchedRows:best.rows.length});
   }
  }
  pairs.push(...pairMap.values());
 }
 const templates=leads.flatMap(lead=>patterns.map(pattern=>lead+pattern));
 const target=1000000;
 assert.ok(pairs.length*templates.length>=target,'Combinações insuficientes: '+pairs.length+' pares x '+templates.length+' frases');
 const unique=new Set(),failures=[];
 let passed=0,questionIndex=0;
 const basePerPair=Math.floor(target/pairs.length),extraPairs=target%pairs.length;
 for(let pi=0;pi<pairs.length;pi++){
  const pair=pairs[pi],variantCount=basePerPair+(pi<extraPairs?1:0);
  for(let vi=0;vi<variantCount;vi++){
   const template=templates[vi];
   const question=template.replaceAll('{field}',pair.field).replaceAll('{id}',pair.id).replaceAll('{dataset}',pair.dataset);
   questionIndex++;
   if(unique.has(question)){failures.push({i:questionIndex,question,expected:pair.expected,actual:'DUPLICADA'});continue;}
   unique.add(question);
   let answer='';
   try{answer=String(context.answer(question)||'');}catch(e){failures.push({i:questionIndex,question,expected:pair.expected,error:String(e),actual:''});continue;}
   const start=answer.indexOf('Resultado(s): ');
   const end=start>=0?answer.indexOf('\nRegistros correspondentes:',start):-1;
   const actual=start>=0?(end>=0?answer.slice(start+'Resultado(s): '.length,end):answer.slice(start+'Resultado(s): '.length)).trim():null;
   if(actual===pair.expected)passed++;
   else if(failures.length<200)failures.push({i:questionIndex,dataset:pair.dataset,record:pair.id,field:pair.field,question,expected:pair.expected,actual,answer:answer.slice(0,700)});
  }
 }
 const coveredRows=new Set(pairs.map(p=>p.datasetId+'|'+p.rowIndex));
 const report={generated_at:new Date().toISOString(),base_updated_at:data.source_updated_at,datasets:data.datasets.map(d=>({id:d.id,title:d.title,rows:rows(d).length})),record_field_pairs:pairs.length,record_rows_covered:coveredRows.size,templates:templates.length,questions_per_pair_min:basePerPair,questions_per_pair_max:basePerPair+1,total_questions:target,unique_questions:unique.size,passed,failed:target-passed,pass_rate:passed/target,status:passed===target&&unique.size===target?'PASSOU':'REPROVADO',failures};
 fs.writeFileSync('stress-1000000-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({AUDITORIA_1000000:report.status,total:target,unique:unique.size,passed,failed:target-passed,pass_rate:report.pass_rate,record_field_pairs:pairs.length,templates:templates.length},null,2));
 if(report.status!=='PASSOU')process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
