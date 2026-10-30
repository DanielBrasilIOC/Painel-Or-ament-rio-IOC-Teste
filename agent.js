/* Agente de consulta IOC — motor único, auditável e determinístico.
   Ambiente de TESTE: consulta exclusivamente a branch agente-teste/data.json. */
const DATA_URL='https://raw.githubusercontent.com/DanielBrasilIOC/brasil/agente-teste/data.json';
let base=null,loadError=null;
const $=id=>document.getElementById(id);
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const compact=s=>norm(s).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const rows=d=>Array.isArray(d?.rows)?d.rows:[];
const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function money(v){if(typeof v==='number')return Number.isFinite(v)?v:0;const s=String(v??'').trim().replace(/[^0-9,.-]/g,'');if(!s)return 0;const z=s.includes(',')?s.replace(/\./g,'').replace(',','.'):(/^[-+]?\d{1,3}(?:\.\d{3})+$/.test(s)?s.replace(/\./g,''):s);const n=Number(z);return Number.isFinite(n)?n:0}
const ds=id=>(base?.datasets||[]).find(d=>d.id===id);
const fieldKeys=d=>[...new Set(rows(d).flatMap(r=>Object.keys(r||{})))];
const source=d=>'Fonte: '+(d?.source_name||d?.title||'base do dashboard')+'\nBase atualizada em: '+(base?.source_updated_at||'data não informada');
const datasetTerms=[
 ['saldo financeiro','financeiro'],['financeiro','financeiro'],
 ['restos a pagar','restos'],['restos','restos'],
 ['empenhos 2026','empenhos'],['empenhos','empenhos'],['empenho','empenhos'],
 ['saldo orçamentário','orcamentario'],['saldo orcamentario','orcamentario'],['orçamentário','orcamentario'],['orcamentario','orcamentario'],
 ['aguardando repasse','repasses'],['repasse','repasses'],['repasses','repasses'],
 ['publicações pagas','publicacoes_pagas'],['publicacoes pagas','publicacoes_pagas'],['publicações','publicacoes_pagas'],['publicacoes','publicacoes_pagas'],['artigos científicos','publicacoes_pagas'],['artigos cientificos','publicacoes_pagas'],['artigos','publicacoes_pagas'],
 ['diárias pagas','diarias_pagas'],['diarias pagas','diarias_pagas'],['diárias','diarias_pagas'],['diarias','diarias_pagas'],
 ['ordens bancárias','ordens_bancarias'],['ordens bancarias','ordens_bancarias'],['ordem bancária','ordens_bancarias'],['ordem bancaria','ordens_bancarias'],['obs','ordens_bancarias'],['ob','ordens_bancarias']
];
function chooseDataset(q){
 const s=compact(q);
 const matches=datasetTerms.map(x=>({term:compact(x[0]),id:x[1]})).filter(x=>x.term&&(' '+s+' ').includes(' '+x.term+' ')).sort((a,b)=>b.term.length-a.term.length);
 return matches.length?ds(matches[0].id):null;
}
function dateOf(row){
 const keys=Object.keys(row||{}).sort((a,b)=>{
  const rank=k=>{const x=norm(k);if(x==='data_pagamento')return 0;if(x==='data')return 1;if(x.includes('data')||x.includes('emissao'))return 2;return 9};
  return rank(a)-rank(b);
 });
 for(const k of keys){if(!/(data|emissao|pagamento)/.test(norm(k)))continue;const s=String(row[k]??'').trim();let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);if(m)return m[3]+'-'+m[2]+'-'+m[1];m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[0]}
 return null;
}
const monthMap={janeiro:0,fevereiro:1,marco:2,abril:3,maio:4,junho:5,julho:6,agosto:7,setembro:8,outubro:9,novembro:10,dezembro:11};
function periodOf(q){
 const s=compact(q),raw=String(q||'');
 let m=raw.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/);
 if(m){const dt=new Date(+m[3],+m[2]-1,+m[1]);if(dt.getFullYear()===+m[3]&&dt.getMonth()===+m[2]-1&&dt.getDate()===+m[1])return{start:iso(dt),end:iso(new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()+1)),label:dt.toLocaleDateString('pt-BR')}}
 const month=Object.keys(monthMap).find(x=>new RegExp('\\b'+x+'\\b').test(s));
 const ym=s.match(/\b(20\d{2})\b/),year=Number(ym?.[1]||base?.source_updated_at?.slice(0,4)||new Date().getFullYear());
 if(month){const i=monthMap[month];return{start:iso(new Date(year,i,1)),end:iso(new Date(year,i+1,1)),label:month.charAt(0).toUpperCase()+month.slice(1)+' de '+year}}
 const yearContext=/\\b(ano|exercicio|periodo|durante|pagos? em|pagamento em|recebeu em|no ano|no exercicio)\\b/.test(s)||(/\\bem\\s+20\\d{2}\\b/.test(s)&&! /\\bempenhos?\\s+20\\d{2}\\b/.test(s));\n if(ym&&yearContext)return{start:year+'-01-01',end:(year+1)+'-01-01',label:String(year)};
 return null;
}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function within(row,p){const d=dateOf(row);return !!d&&d>=p.start&&d<p.end}
function dateLabel(row){const d=dateOf(row);return d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'data não informada'}
function valueKey(d){const k=fieldKeys(d);return k.find(x=>['valor','saldo','total'].includes(norm(x)))||k.find(x=>/(valor|saldo|total)/.test(norm(x))&&!/(data|pagamento)/.test(norm(x)))}
function nameKey(d){const k=fieldKeys(d);return k.find(x=>['favorecido','beneficiario','fornecedor','nome','credor'].includes(norm(x)))||k.find(x=>/(favorecido|beneficiario|fornecedor)/.test(norm(x)))}
function obKey(d){return fieldKeys(d).find(x=>['ob','documento','ordem_bancaria'].includes(norm(x)))}
function datasetSummary(d,p){
 let arr=rows(d);if(p){const hasDate=arr.some(r=>dateOf(r));if(!hasDate)return 'Não é possível aplicar o período '+p.label+': a base '+d.title+' não contém datas utilizáveis.\n'+source(d);arr=arr.filter(r=>within(r,p))}
 const k=valueKey(d),sum=k?arr.reduce((a,r)=>a+money(r[k]),0):null;
 return d.title+'\n'+(sum===null?'Total financeiro não disponível nesta base.':'Total: '+brl(sum))+'\nRegistros: '+arr.length+(p?'\nPeríodo considerado: '+p.label:'')+'\n'+source(d);
}
function inventory(){
 const ds0=base?.datasets||[];
 return 'Inventário dos dados disponíveis:\n'+ds0.map(d=>'• '+d.title+': '+rows(d).length+' registros\n  Campos: '+fieldKeys(d).join(', ')).join('\n')+'\n\nTotal: '+ds0.length+' conjuntos e '+ds0.reduce((a,d)=>a+rows(d).length,0)+' registros detalhados.\nBase atualizada em: '+(base?.source_updated_at||'data não informada');
}
function topN(q){const s=compact(q),m=s.match(/\btop\s*(\d+)\b/)||s.match(/\b(\d+)\s+maiores?\b/);return Math.min(50,Math.max(1,Number(m?.[1]||10)))}
function rankingOB(q,d,p){
 let arr=rows(d).filter(r=>Number.isFinite(money(r.valor)));if(p)arr=arr.filter(r=>within(r,p));
 arr.sort((a,b)=>money(b.valor)-money(a.valor)||String(a.ob||'').localeCompare(String(b.ob||'')));
 if(!arr.length)return 'Não encontrei ordens bancárias no período solicitado.\n'+source(d);
 const n=topN(q),shown=arr.slice(0,n);
 return 'Ranking das '+shown.length+' maiores ordens bancárias'+(p?' em '+p.label:'')+', ordenadas pelo valor pago (maior para menor):\n'+shown.map((r,i)=>(i+1)+'. OB '+(r.ob||'não informada')+' — '+brl(money(r.valor))+' — '+(r.favorecido||'favorecido não informado')+' — '+dateLabel(r)).join('\n')+'\n\nRegistros classificados: '+arr.length+(p?'\nPeríodo considerado: '+p.label:'')+'\n'+source(d);
}
function latestOB(q,d,p){
 let arr=rows(d).filter(r=>dateOf(r));if(p)arr=arr.filter(r=>within(r,p));
 arr.sort((a,b)=>dateOf(b).localeCompare(dateOf(a))||String(b.ob||'').localeCompare(String(a.ob||'')));
 if(!arr.length)return 'Não encontrei uma OB com data válida'+(p?' em '+p.label:'')+'.\n'+source(d);
 const r=arr[0];
 return 'A ordem bancária mais recente'+(p?' em '+p.label:'')+' é:\nOB: '+r.ob+'\nData do pagamento: '+dateLabel(r)+'\nFavorecido: '+(r.favorecido||'não informado')+'\nValor: '+brl(money(r.valor))+'\nProcesso: '+(r.processo||'não informado')+'\n'+source(d);
}
function pcdpInfo(row){
 const obs=String(row.observacao||'');
 const m=obs.match(/\bPCDP\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]*)/i);
 if(!m)return null;
 const period=obs.match(/PERIODO\s+DE\s+(\d{2}\/\d{2}\/\d{4})\s+A\s+(\d{2}\/\d{2}\/\d{4})/i);
 return{id:m[1].toUpperCase(),start:period?.[1]||'',end:period?.[2]||''};
}
function travelRecords(d,p){
 const nk=nameKey(d)||'favorecido',map=new Map();
 for(const r of rows(d)){
  const name=String(r[nk]??'').trim(),pcdp=pcdpInfo(r);if(!name||!pcdp)continue;
  if(p){const a=parseBR(pcdp.start),b=parseBR(pcdp.end);if(!a||!b||a>=p.end||b<p.start)continue}
  const id=compact(name)+'|'+pcdp.id;
  if(!map.has(id))map.set(id,{name,pcdp:pcdp.id,row:r,amount:0,docs:new Set()});
  const x=map.get(id);x.amount+=money(r.valor);if(r.documento)x.docs.add(String(r.documento));
 }
 return [...map.values()];
}
function parseBR(s){const m=String(s||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?m[3]+'-'+m[2]+'-'+m[1]:null}
function travelAnswer(q,d,p){
 const s=compact(q),items=travelRecords(d,p),people=new Map();
 for(const x of items){const k=compact(x.name);if(!people.has(k))people.set(k,{name:x.name,pcdps:new Set(),amount:0});const a=people.get(k);a.pcdps.add(x.pcdp);a.amount+=x.amount}
 const ranked=[...people.values()].map(x=>({name:x.name,count:x.pcdps.size,amount:x.amount})).sort((a,b)=>b.count-a.count||b.amount-a.amount||a.name.localeCompare(b.name,'pt-BR'));
 if(!items.length)return 'Não identifiquei PCDPs com favorecido e período de viagem legíveis'+(p?' em '+p.label:'')+' na base de diárias. Não vou tratar cada pagamento como uma viagem sem um identificador de PCDP.\n'+source(d);
 if(/quem mais|mais viajou|fez mais viagens|realizou mais viagens|maior numero de viagens|maior quantidade de viagens|quem viajou mais/.test(s)){
  const leaders=ranked.filter(x=>x.count===ranked[0].count);
  return 'Quem mais viajou'+(p?' em '+p.label:'')+', considerando PCDPs distintos por pessoa:\n'+leaders.map(x=>'• '+x.name+' — '+x.count+' viagens identificadas').join('\n')+'\n\nCritério: cada PCDP distinto é contado uma vez por favorecido. Total de PCDPs identificados: '+items.length+'; pessoas: '+ranked.length+'.\n'+source(d);
 }
 if(/top\s*\d+|\b\d+\s+maiores?\b/.test(s)){
  const n=topN(q);
  return 'Ranking de viajantes'+(p?' em '+p.label:'')+', por quantidade de PCDPs distintos:\n'+ranked.slice(0,n).map((x,i)=>(i+1)+'. '+x.name+' — '+x.count+' viagens — '+brl(x.amount)+' em diárias').join('\n')+'\n\nCritério: PCDPs distintos por favorecido. Pessoas identificadas: '+ranked.length+'.\n'+source(d);
 }
 if(/quantas pessoas|quantos viajantes|numero de pessoas|pessoas distintas/.test(s))return 'Foram identificadas '+ranked.length+' pessoas distintas com PCDP'+(p?' em '+p.label:'')+'. Total de viagens identificadas: '+items.length+'.\n'+source(d);
 if(/quantas viagens|quantidade de viagens|numero de viagens|total de viagens|quantas pcdps|total de pcdps/.test(s))return 'Foram identificadas '+items.length+' viagens distintas por PCDP e favorecido'+(p?' em '+p.label:'')+'.\n'+source(d);
 if(/liste|listar|lista|nomes|quais pessoas|quem viajou|pessoas que viajaram|relacao de viajantes|nomes dos viajantes/.test(s)){
  return 'Pessoas com viagens identificadas'+(p?' em '+p.label:'')+' ('+ranked.length+'):\n'+ranked.map(x=>'• '+x.name+' — '+x.count+' viagem(ns)').join('\n')+'\n\nCritério: favorecidos com PCDP identificável na observação; cada PCDP é contado uma vez por pessoa.\n'+source(d);
 }
 return null;
}
function exactPerson(q,d,p){
 const nk=nameKey(d),vk=valueKey(d);if(!nk||!vk)return null;
 const s=compact(q),names=[...new Set(rows(d).map(r=>String(r[nk]??'').trim()).filter(Boolean))].sort((a,b)=>compact(b).length-compact(a).length);
 const foundName=names.find(x=>s.includes(compact(x)));
 if(!foundName)return null;
 let found=rows(d).filter(r=>compact(r[nk])===compact(foundName));if(p)found=found.filter(r=>within(r,p));
 if(!found.length)return 'Não encontrei registros para '+foundName+(p?' em '+p.label:'')+'.\n'+source(d);
 const total=found.reduce((a,r)=>a+money(r[vk]),0);
 return 'Total pago a '+foundName+': '+brl(total)+'\nRegistros considerados: '+found.length+(p?'\nPeríodo: '+p.label:'')+'\n'+source(d);
}
function thresholdAnswer(q,d,p){
 const s=compact(q);if(!/(acima de|maior que|superior a|superiores a|mais de|ultrapass)/.test(s))return null;
 const raw=String(q||'').match(/r\$\s*([\d.]+(?:,\d{1,2})?)/i)||String(q||'').match(/\b([\d.]+(?:,\d{1,2})?)\s*(mil|milhao|milhoes)?\b/i);
 if(!raw)return null;
 let threshold=money(raw[1]);if(raw[2]==='mil')threshold*=1000;if(raw[2]?.startsWith('milhao'))threshold*=1000000;
 const vk=valueKey(d);if(!vk)return null;
 let found=rows(d).filter(r=>money(r[vk])>threshold);if(p)found=found.filter(r=>within(r,p));
 const total=found.reduce((a,r)=>a+money(r[vk]),0);
 return found.length+' registro(s) com valor superior a '+brl(threshold)+(p?' em '+p.label:'')+'.\nTotal desses registros: '+brl(total)+'\n'+(found.length?'Maiores ocorrências:\n'+found.slice().sort((a,b)=>money(b[vk])-money(a[vk])).slice(0,10).map((r,i)=>(i+1)+'. '+(r.ob||r.empenho||r.documento||'Registro')+' — '+brl(money(r[vk]))).join('\n')+'\n':'')+source(d);
}
function fieldRequest(q,d){
 const s=compact(q),keys=fieldKeys(d);
 const aliases={
  'data pagamento':['data_pagamento','data'],'data do pagamento':['data_pagamento','data'],'data':['data_pagamento','data'],
  'numero da ob':['ob','documento'],'numero ob':['ob','documento'],'ordem bancaria':['ob','documento'],'ob':['ob','documento'],
  'numero do empenho':['empenho','ne_ccor'],'numero ne':['empenho','ne_ccor'],'empenho':['empenho','ne_ccor'],
  'beneficiario':['favorecido','fornecedor'],'nome':['favorecido','fornecedor'],
  'valor pago':['valor'],'valor':['valor','saldo'],'saldo':['saldo','valor'],
  'situacao':['situacao_prioridade','status_empenho'],'prioridade':['situacao_prioridade'],
  'solicitacao':['solicitacao_ne','numero_ne'],'numero da solicitacao':['solicitacao_ne','numero_ne'],
  'descricao':['observacao','natureza','descricao_fonte'],'observacao':['observacao']
 };
 let candidates=[];
 for(const k of keys){const f=compact(k.replace(/_/g,' '));if(f.length>1&&(' '+s+' ').includes(' '+f+' '))candidates.push(k)}
 candidates.sort((a,b)=>compact(b).length-compact(a).length);
 if(candidates.length)return candidates[0];
 for(const [phrase,ks] of Object.entries(aliases)){if((' '+s+' ').includes(' '+phrase+' ')){const hit=ks.find(k=>keys.includes(k));if(hit)return hit}}
 return null;
}
function recordQuery(q,d,p){
 const s=compact(q),field=fieldRequest(q,d);if(!field)return null;
 const idTerms=compact(q).split(' ').filter(t=>t.length>=6&&/[0-9]/.test(t));
 const names=fieldKeys(d).filter(k=>/(favorecido|fornecedor)/.test(norm(k)));
 const nameHit=rows(d).flatMap(r=>names.map(k=>String(r[k]??'').trim())).filter(Boolean).sort((a,b)=>b.length-a.length).find(n=>s.includes(compact(n)));
 const allTerms=[...idTerms];if(nameHit)allTerms.push(compact(nameHit));
 if(!allTerms.length)return 'Para consultar o campo "'+field.replace(/_/g,' ')+'", preciso identificar o registro. Informe, por exemplo, o número da OB, processo, empenho, solicitação ou nome do favorecido.';
 let found=rows(d).filter(r=>{const hay=compact(Object.entries(r).map(([k,v])=>k+' '+String(v??'')).join(' '));return allTerms.every(t=>hay.includes(t))});
 if(p)found=found.filter(r=>within(r,p));
 if(!found.length)return 'Não encontrei registro correspondente aos identificadores informados em '+d.title+'. Não vou presumir um valor.\n'+source(d);
 const vals=[...new Set(found.map(r=>String(r[field]??'').trim()).filter(Boolean))];
 return 'Campo consultado: '+field.replace(/_/g,' ')+'\nResultado(s): '+(vals.length?vals.slice(0,25).join('; '):'o campo está vazio nos registros localizados')+'\nRegistros correspondentes: '+found.length+(p?'\nPeríodo: '+p.label:'')+'\n'+source(d);
}
function answer(q0){
 const raw=String(q0??''),q=compact(raw);
 if(!base)return loadError?'Não foi possível consultar a base neste momento. A conexão falhou; isso não significa que a informação não exista.':'A base ainda está carregando. Aguarde e tente novamente.';
 if(!q)return 'Digite uma pergunta para consultar os dados.';
 if(/inventario|todos os campos|quais campos|campos disponiveis|dados disponiveis|o que tem no dashboard|quais dados/.test(q))return inventory();
 const d=chooseDataset(q),p=periodOf(raw);
 const travelIntent=/(viaj|viagem|viagens|viajante|viajantes|pcdp)/.test(q);
 if(travelIntent){const td=ds('diarias_pagas');const result=travelAnswer(raw,td,p);if(result)return result}
 if(d&&d.id==='ordens_bancarias'&&/(top\s*\d+|maiores?|maior valor|maior pagamento|maior ob|maior ordem)/.test(q))return rankingOB(raw,d,p);
 if(d&&d.id==='ordens_bancarias'&&/(ultima|ultimo|mais recente|por ultimo)/.test(q))return latestOB(raw,d,p);
 if(d&&/(acima de|maior que|superior a|superiores a|mais de|ultrapass)/.test(q)){const r=thresholdAnswer(raw,d,p);if(r)return r}
 if(d&&/(quanto|total|soma|valor total|montante|saldo total|quanto temos|quanto ha|quanto há)/.test(q)){
  const person=exactPerson(raw,d,p);if(person)return person;
  return datasetSummary(d,p);
 }
 if(d&&/(quantos|quantas|quantidade|numero de registros|numero de|contagem)/.test(q)&&/(registro|registros|ordens|ob|diarias|diária|viagens|empenhos|publicacoes|publicações)/.test(q)){
  let arr=rows(d);if(p)arr=arr.filter(r=>within(r,p));
  return d.title+': '+arr.length+' registros'+(p?' em '+p.label:'')+'.\n'+source(d);
 }
 if(d&&/(quem|qual favorecido|qual fornecedor|quem recebeu|quem pagou|listar|liste|nomes)/.test(q)&&d.id==='ordens_bancarias'){
  const nk=nameKey(d);const counts=new Map();for(const r of rows(d)){const n=String(r[nk]??'').trim();if(n)counts.set(n,(counts.get(n)||0)+1)}
  const ordered=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'));
  if(/quem mais recebeu|quem recebeu mais|maior favorecido/.test(q))return 'Favorecido com maior número de ordens bancárias:\n'+ordered.slice(0,10).map((x,i)=>(i+1)+'. '+x[0]+' — '+x[1]+' OB(s)').join('\n')+'\n'+source(d);
 }
 if(d){const field=recordQuery(raw,d,p);if(field)return field;return datasetSummary(d,p)}
 const candidates=(base.datasets||[]).filter(x=>x.id==='ordens_bancarias'||x.id==='diarias_pagas');
 for(const x of candidates){const r=recordQuery(raw,x,p);if(r)return r}
 return 'Não consegui identificar com segurança o conjunto de dados ou o registro da sua pergunta. Tente mencionar o assunto (por exemplo, ordens bancárias, diárias, empenhos, restos a pagar, saldo financeiro, saldo orçamentário, publicações ou repasses). Não vou inventar valores.';
}
async function load(){
 try{const r=await fetch(DATA_URL+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const next=await r.json();if(!Array.isArray(next.datasets)||!next.datasets.length)throw new Error('Base sem conjuntos de dados');base=next;loadError=null;
  const coverage=(base.datasets||[]).reduce((a,d)=>({rows:a.rows+rows(d).length,fields:a.fields+fieldKeys(d).length}),{rows:0,fields:0});
  if($('status')){$('status').textContent='Base de teste carregada: '+base.datasets.length+' conjuntos, '+coverage.rows+' registros e '+coverage.fields+' campos. Atualização: '+(base.source_updated_at||'não informada')+'.';$('status').className='status ok'}
  return base;
 }catch(e){loadError=e;if($('status')){$('status').textContent='Não foi possível conectar à base isolada do ambiente de teste. As consultas estão indisponíveis até a conexão ser restabelecida.';$('status').className='status err'}throw e}
}
function renderAnswer(text){const el=$('answer');if(!el)return;el.textContent=text;el.hidden=false}
function clearQuestion(){const q=$('q'),el=$('answer');if(q)q.value='';if(el){el.textContent='';el.hidden=true}if(q&&typeof q.focus==='function')q.focus()}
function bind(){const q=$('q'),ask=$('ask'),clear=$('clear');if(ask)ask.addEventListener('click',()=>renderAnswer(answer(q?.value||'')));if(q)q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault?.();renderAnswer(answer(q.value||''))}});if(clear)clear.addEventListener('click',clearQuestion)}
if(typeof window!=='undefined')window.addEventListener?.('DOMContentLoaded',()=>{bind();load().catch(()=>{})});
globalThis.answer=answer;globalThis.load=load;globalThis.clearQuestion=clearQuestion;globalThis.answerDataInventory=inventory;globalThis.coverageSummary=()=>({datasets:base?.datasets?.length||0,rows:(base?.datasets||[]).reduce((n,d)=>n+rows(d).length,0),fields:(base?.datasets||[]).reduce((n,d)=>n+fieldKeys(d).length,0)});
