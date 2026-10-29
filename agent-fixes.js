/* Correções de interpretação do agente — somente ambiente de TESTE. */
(()=>{
 const legacyAnswer=globalThis.answer,URL='https://raw.githubusercontent.com/DanielBrasilIOC/brasil/agente-teste/data.json';let data=null;
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(),compact=s=>norm(s).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(),rows=d=>Array.isArray(d?.rows)?d.rows:[],money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),parse=v=>{if(typeof v==='number')return v;const s=String(v??'').replace(/[^0-9,.-]/g,'');return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)||0},dsById=id=>data?.datasets.find(d=>d.id===id);
 const explicitDataset=q=>{const s=compact(q),tests=[['saldo financeiro','financeiro'],['restos a pagar','restos'],['empenhos 2026','empenhos'],['saldo orcamentario','orcamentario'],['aguardando repasse','repasses'],['ordens bancarias pagas','ordens_bancarias'],['ordens bancarias','ordens_bancarias'],['publicacoes pagas','publicacoes_pagas'],['artigos cientificos','publicacoes_pagas'],['artigos','publicacoes_pagas'],['diarias pagas','diarias_pagas']];for(const[n,id]of tests)if(s.includes(n))return dsById(id);return null};
 const keysOf=d=>[...new Set(rows(d).flatMap(r=>Object.keys(r||{})))];
 const fieldFromQuestion=(q,d)=>{if(!d)return null;const s=compact(q),keys=keysOf(d).sort((a,b)=>compact(b.replace(/_/g,' ')).length-compact(a.replace(/_/g,' ')).length);for(const k of keys){const f=compact(k.replace(/_/g,' '));if(new RegExp(`(?:campo|informacao de|consta em|diga o|informe o|mostre o|localize o)\\s+${f}\\b`).test(s))return k;if(new RegExp(`\\bqual(?: e o| é o| o)?\\s+${f}\\b`).test(s))return k;if(new RegExp(`\\bqual informacao de ${f}\\b`).test(s))return k}return null};
 const requestedField=(q,d)=>fieldFromQuestion(q,d)||(()=>{const s=compact(q),aliases=[['numero_solicitacao',['numero da solicitacao','numero solicitacao']],['natureza_codigo',['natureza codigo','codigo da natureza','codigo natureza']],['sub_grupo_despesa',['sub grupo de despesa','subgrupo de despesa']],['classificacao_orcamentaria',['classificacao orcamentaria']],['data_pagamento',['data do pagamento','data de pagamento']],['situacao_prioridade',['situacao prioridade']],['status_empenho',['status do empenho','status empenho']],['saldo',['saldo']],['valor',['valor pago','valor','montante']],['empenho',['numero do empenho','numero ne','empenho']],['processo',['processo']],['favorecido',['favorecido','beneficiario']],['fornecedor',['fornecedor']],['ob',['ordem bancaria','ob']],['cnpj',['cnpj']],['pi',['pi']],['programa',['programa']],['unidade',['unidade']],['uge',['uge']],['ug',['ug']],['ptres',['ptres']],['subitem',['subitem']],['natureza',['natureza']],['observacao',['observacao','descricao']],['vigencia',['vigencia']]];for(const[k,als]of aliases)if(als.some(a=>s.includes(compact(a))))return k;return null})();
 const fieldAliases={numero_solicitacao:['numero_solicitacao','solicitacao_ne'],natureza_codigo:['natureza_codigo'],empenho:['empenho','numero_ne','ne_ccor'],ob:['ob','documento'],valor:['valor','saldo','total'],favorecido:['favorecido','beneficiario','fornecedor'],observacao:['observacao','descricao'],saldo:['saldo']};
 const findField=(r,key)=>{if(!r)return null;const ks=Object.keys(r),names=fieldAliases[key]||[key];return ks.find(k=>names.includes(norm(k)))||ks.find(k=>names.some(n=>norm(k).includes(norm(n))))};
 const nameKey=r=>Object.keys(r||{}).find(k=>['favorecido','beneficiario','fornecedor','nome','credor'].some(t=>norm(k).includes(t))),valueKey=r=>Object.keys(r||{}).find(k=>['valor','saldo','total'].includes(norm(k)))||Object.keys(r||{}).find(k=>/valor|saldo|total|liquido|bruto/.test(norm(k))&&!/data|pagamento/.test(norm(k)));
 const directPersonTotal=q=>{const d=explicitDataset(q);if(!d||!(/\b(recebeu|total pago a|quanto recebeu|pagamento para)\b/.test(compact(q))))return null;const sample=rows(d)[0]||{},nk=nameKey(sample),vk=valueKey(sample);if(!nk||!vk)return null;const names=[...new Set(rows(d).map(r=>String(r[nk]??'').trim()).filter(Boolean))].sort((a,b)=>b.length-a.length),person=names.find(n=>compact(q).includes(compact(n)));if(!person)return null;const hits=rows(d).filter(r=>norm(r[nk])===norm(person)),total=hits.reduce((s,r)=>s+parse(r[vk]),0);return`Total identificado para ${person}: ${money(total)}\nRegistros considerados: ${hits.length}\n\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`};
 const directThreshold=q=>{const s=compact(q);if(!/\b(acima de|superiores a|acima do limite de)\b/.test(s)||!s.includes('pagamentos'))return null;const raw=String(q),m=raw.match(/r\$\s*([0-9.]+)(?:,([0-9]+))?/i);if(!m)return null;const t=Number(m[1].replace(/\./g,''))+Number('0.'+(m[2]||'0')),d=dsById('ordens_bancarias'),sample=rows(d)[0]||{},vk=valueKey(sample);if(!vk)return null;const hits=rows(d).filter(r=>parse(r[vk])>t),total=hits.reduce((a,r)=>a+parse(r[vk]),0);return`${hits.length} registro(s) acima de ${money(t)}.\nTotal desses pagamentos: ${money(total)}\n\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`};
 const directLatest=q=>{const s=compact(q);if(!/\b(ultima|última|mais recente|mais recentemente|por ultimo|por último|ultimo pagamento|último pagamento)\b/.test(s)||(!s.includes('ob')&&!s.includes('ordem bancaria')&&!s.includes('pagamento')))return null;const d=dsById('ordens_bancarias'),rs=rows(d);let best=null,bestDate='';for(const r of rs){for(const k of Object.keys(r)){const v=String(r[k]??'').trim();let iso=null,m=v.match(/(\d{2})\/(\d{2})\/(\d{4})/);if(m)iso=`${m[3]}-${m[2]}-${m[1]}`;m=v.match(/(\d{4})-(\d{2})-(\d{2})/);if(m)iso=m[0];if(iso&&(iso>bestDate)&&(/data|pagamento|emissao/.test(norm(k)))){bestDate=iso;best=r}}}if(!best){best=rs.slice().sort((a,b)=>String(b.ob??b.documento??'').localeCompare(String(a.ob??a.documento??'')))[0];bestDate='';}if(!best)return null;const id=best.ob??best.documento??best.ordem_bancaria;return`Última OB registrada: ${id}${bestDate?'\nData: '+bestDate.split('-').reverse().join('/'):''}\n\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`};
 const identifierTokens=q=>compact(q).split(' ').filter(t=>t.length>=5&&(/[0-9]/.test(t)||/^[a-z]{2,}\d/.test(t)));
 const answerFixed=q=>{const s=compact(q);if(/(quais.*campos|campos.*disponiveis|quais.*dados|todos.*dados|todos.*campos|o que (tem|existe).*dashboard|inventario|conjuntos.*dados|informacoes.*disponiveis)/.test(s))return'Inventário dos dados disponíveis no dashboard:\n'+data.datasets.map(d=>'• '+d.title+': '+rows(d).length+' registros; campos: '+keysOf(d).join(', ')).join('\n')+'\n\nTotal: '+data.datasets.length+' conjuntos, '+data.datasets.reduce((n,d)=>n+rows(d).length,0)+' registros e '+[...new Set(data.datasets.flatMap(d=>keysOf(d)))].length+' nomes de campos distintos.\nBase atualizada em: '+(data.source_updated_at||'data não informada');
  const person=directPersonTotal(s);if(person)return person;const threshold=directThreshold(q);if(threshold)return threshold;const latest=directLatest(s);if(latest)return latest;
  const explicit=explicitDataset(s),isCount=/\b(quantos|quantas|quantidade|numero de registros|número de registros|registros existem|registros constam|itens existem|lancamentos existem|lançamentos existem|dados existem|numero atual|número atual|quantos lancamentos|quantos lançamentos|aba apresenta|quantidade registrada)\b/.test(s),isTotal=/\b(quanto|total|montante|valor total|valor de|saldo total|valor registrado|montante registrado|quanto esta registrado|quanto está registrado|quanto existe|quanto consta|quanto representa|disponivel atualmente|disponível atualmente|apresenta|montante aparece|contabilizado|valor informado|total financeiro|valor consolidado|total consolidado)\b/.test(s);if(explicit&&(isCount||isTotal)){if(isCount)return`${explicit.title}: ${explicit.detail_count??rows(explicit).length} registros.\nFonte: ${explicit.source_name||explicit.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`;return`${explicit.title}: ${money(explicit.total)}\nRegistros: ${explicit.detail_count??rows(explicit).length}\nFonte: ${explicit.source_name||explicit.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`}
  const fk=requestedField(s,explicit),ids=identifierTokens(s);if(fk&&ids.length&&/\b(qual|quais|informe|mostre|localize|encontre|diga|informacao|informação|o que consta)\b/.test(s)){const target=explicit?[explicit]:data.datasets,hits=[];for(const d of target)for(const r of rows(d)){const hay=compact(Object.values(r).join(' '));if(ids.every(id=>hay.includes(id)))hits.push({d,r})}if(hits.length===1){const {d,r}=hits[0],k=findField(r,fk);if(k)return`Campo consultado: ${k}\nResultado(s): ${String(r[k]??'')}\nRegistros correspondentes: 1\n\nFonte(s): ${d.source_name||d.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`}if(hits.length>1){const vals=[];for(const h of hits){const k=findField(h.r,fk);if(k&&String(h.r[k]??'').trim())vals.push(`${h.d.title}: ${h.r[k]}`)}if(vals.length)return`Campo consultado: ${fk}\nResultado(s): ${vals.join('; ')}\nRegistros correspondentes: ${hits.length}\n\nBase atualizada em: ${data.source_updated_at||'data não informada'}`}}
  return legacyAnswer(q)};globalThis.answer=answerFixed;globalThis.__answer=answerFixed;globalThis.__agentFixReady=fetch(URL+'?fix='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(j=>{data=j;globalThis.__agentData=j;return j});
})();

/* Cobertura adicional de linguagem natural: rankings de OBs e viagens/diárias. */
(()=>{
 const previous=globalThis.answer;
 const n=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const c=s=>n(s).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const ds=id=>globalThis.__agentData?.datasets?.find(x=>x.id===id);
 const rs=d=>Array.isArray(d?.rows)?d.rows:[];
 const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const num=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const s=String(v??'').replace(/[^0-9,.-]/g,'');const z=s.includes(',')?s.replace(/\./g,'').replace(',','.'):s;const x=Number(z);return Number.isFinite(x)?x:0};
 const source=d=>'Fonte: '+(d?.source_name||d?.title||'base do dashboard')+'\nBase atualizada em: '+(globalThis.__agentData?.source_updated_at||'data não informada');
 const dateOrderAnswer=q=>{
   const s=c(q),intent=/(ordens? bancarias?|obs?\b)/.test(s);
   if(!intent)return null;
   const raw=String(q||''),day=raw.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/);
   const months={janeiro:0,fevereiro:1,marco:2,abril:3,maio:4,junho:5,julho:6,agosto:7,setembro:8,outubro:9,novembro:10,dezembro:11};
   const month=Object.keys(months).find(k=>new RegExp('\\\\b'+k+'\\\\b').test(s));
   const yearMatch=s.match(/\b(20\d{2})\b/),year=Number(yearMatch?.[1]||globalThis.__agentData?.source_updated_at?.slice(0,4)||new Date().getFullYear());
   if(!day&&!month&&!yearMatch)return null;
   let start,end,label;
   if(day){const dt=new Date(Number(day[3]),Number(day[2])-1,Number(day[1]));start=new Date(dt.getFullYear(),dt.getMonth(),dt.getDate());end=new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()+1);label=dt.toLocaleDateString('pt-BR')}
   else if(month){start=new Date(year,months[month],1);end=new Date(year,months[month]+1,1);label=month.charAt(0).toUpperCase()+month.slice(1)+' de '+year}
   else{start=new Date(year,0,1);end=new Date(year+1,0,1);label=String(year)}
   const d=ds('ordens_bancarias');if(!d)return 'A base de ordens bancárias não está disponível.';
   const parseDate=v=>{const m=String(v||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m)return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));const x=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return x?new Date(Number(x[1]),Number(x[2])-1,Number(x[3])):null};
   const found=rs(d).filter(r=>{const dt=parseDate(r.data_pagamento||r.data);return dt&&dt>=start&&dt<end});\n   const rankMatch=s.match(/top\\s*(\\d+)/)||s.match(/\\b(\\d+)\\s+maiores?\\b/),rankIntent=/(top\\s*\\d+|maiores?\\b|maior valor|maior pagamento)/.test(s);\n   found.sort(rankIntent?(a,b)=>num(b.valor)-num(a.valor):(a,b)=>String(a.ob||'').localeCompare(String(b.ob||'')));
   if(!found.length)return 'Não encontrei ordens bancárias pagas em '+label+'.\n'+source(d);
   const limit=rankMatch?Math.min(50,Math.max(1,Number(rankMatch[1]))):(rankIntent?10:25),shown=found.slice(0,limit);
   const lines=shown.map((r,i)=>(i+1)+'. OB '+String(r.ob||'não informada')+' · '+brl(num(r.valor))+' · '+String(r.favorecido||'favorecido não informado')).join('\n');
   return 'Foram encontradas '+found.length+' ordens bancárias pagas em '+label+'.'+(found.length>limit?'\nExibindo '+limit+' de '+found.length+' registros:':'')+'\n'+lines+'\n\n'+source(d);
 };
 const topOb=q=>{
   const s=c(q);
   const orderIntent=/(ordens? bancarias?|obs?\b|pagamentos?)/.test(s);
   const rankIntent=/(top\s*\d+|\b\d+\s+maiores?\b|maiores?\b|maior valor|maior pagamento|maior ob|maior ordem bancaria|de maior valor|mais altos? valores?)/.test(s);
   if(!orderIntent||!rankIntent)return null;
   const d=ds('ordens_bancarias');if(!d||!rs(d).length)return 'A base de ordens bancárias não está disponível para o ranking.';
   const m=s.match(/top\s*(\d+)/)||s.match(/\b(\d+)\s+maiores?\b/);
   const singleIntent=/\b(quem recebeu|quem pagou|qual foi|qual e|qual o|maior pagamento|maior valor|maior ob|maior ordem bancaria)\b/.test(s)&&!m;
   const limit=Math.min(50,Math.max(1,Number(m?.[1]||(singleIntent?1:10))));
   const k=Object.keys(rs(d)[0]||{}),vk=k.find(x=>['valor','valor_ob'].includes(n(x)))||k.find(x=>/valor/.test(n(x)));
   if(!vk)return 'A base de ordens bancárias não possui um campo de valor identificável; não é possível montar o ranking.';
   const ok=k.find(x=>['ob','documento','ordem_bancaria'].includes(n(x)))||'ob',fk=k.find(x=>/favorecido|beneficiario|fornecedor/.test(n(x)));
   const arr=rs(d).map(r=>({r,v:num(r[vk])})).filter(x=>Number.isFinite(x.v)).sort((a,b)=>b.v-a.v||String(a.r[ok]||'').localeCompare(String(b.r[ok]||'')));
   if(!arr.length)return 'Não há ordens bancárias com valor numérico para classificar.';
   const body=arr.slice(0,limit).map((x,i)=>(i+1)+'. '+brl(x.v)+' · OB '+String(x.r[ok]??'não informada')+(fk?' · '+String(x.r[fk]??''):'')).join('\n');
   return 'Ranking das '+Math.min(limit,arr.length)+' maiores ordens bancárias pagas, por valor (ordem decrescente):\n'+body+'\n\nRegistros classificados: '+arr.length+'\n'+source(d);
 };
 const tripData=()=>{
   const d=ds('diarias_pagas');if(!d)return null;
   const sample=rs(d)[0]||{},nk=Object.keys(sample).find(k=>/favorecido|beneficiario|nome/.test(n(k)));
   if(!nk)return {d,items:[],names:[],ranking:[]};
   const items=[];
   for(const r of rs(d)){
     const name=String(r[nk]??'').trim();if(!name)continue;
     const obs=String(r.observacao??'');
     const p=obs.match(/\bPCDP\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]*)/i);
     if(!p)continue;
     items.push({name,id:p[1].toUpperCase(),row:r});
   }
   const unique=new Map();for(const x of items)unique.set(c(x.name)+'|'+x.id,x);
   const people=new Map();for(const x of unique.values()){const k=c(x.name);if(!people.has(k))people.set(k,{name:x.name,trips:new Set()});people.get(k).trips.add(x.id)}
   const ranking=[...people.values()].map(x=>({name:x.name,count:x.trips.size})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pt-BR'));
   return {d,items:[...unique.values()],names:ranking,ranking};
 };
 const travelAnswer=q=>{
   const s=c(q),intent=/(viaj|viagem|viagens|viajada|viajantes|pcdp)/.test(s);if(!intent)return null;
   const t=tripData();if(!t||!t.d)return 'A base de diárias pagas não está disponível para consultar as viagens.';
   const ranked=/(quem mais|mais viajou|fez mais viagens|realizou mais viagens|maior numero de viagens|maior quantidade de viagens|quem viajou mais|top\s*\d+|\d+\s+maiores)/.test(s);
   const list=/(liste|listar|lista|nomes|quais pessoas|quem viajou|pessoas que viajaram|relacao de viajantes|quem sao os viajantes|quais sao os viajantes|nomes dos viajantes)/.test(s);
   const count=/(quantas viagens|quantidade de viagens|numero de viagens|número de viagens|total de viagens|quantas pessoas viajaram|quantos viajantes|numero de pessoas que viajaram|quantas pcdps|quantos pcdps|numero de pcdps|total de pcdps)/.test(s);
   if(!t.items.length)return 'Não localizei identificadores PCDP nas observações dos registros de diárias. Não é possível contar viagens com segurança.';
   if(ranked){
     const topMatch=s.match(/top\s*(\d+)/)||s.match(/\b(\d+)\s+maiores/),lim=Math.min(50,Math.max(1,Number(topMatch?.[1]||10)));
     const highest=t.ranking[0]?.count||0,leaders=t.ranking.filter(x=>x.count===highest);
     const listRows=(topMatch?t.ranking.slice(0,lim):leaders).map((x,i)=>(i+1)+'. '+x.name+' — '+x.count+' viagem(ns)').join('\n');
     return (topMatch?'Ranking dos '+Math.min(lim,t.ranking.length)+' viajantes com mais viagens identificadas:':'Quem mais viajou, considerando PCDPs distintos:')+'\n'+listRows+'\n\nCritério: cada número de PCDP distinto foi contado uma vez por favorecido, evitando contar pagamentos repetidos da mesma viagem como viagens diferentes. Viagens identificadas: '+t.items.length+'; pessoas: '+t.ranking.length+'.\n'+source(t.d);
   }
   if(count)return 'Foram identificadas '+t.items.length+' viagens distintas por número de PCDP, envolvendo '+t.ranking.length+' pessoas. Cada PCDP foi contado uma única vez por favorecido.\n'+source(t.d);
   if(list){
     const body=t.ranking.map(x=>'• '+x.name+' — '+x.count+' viagem(ns)').join('\n');
     return 'Pessoas com viagem identificada nos registros de diárias ('+t.ranking.length+' nomes):\n'+body+'\n\nCritério: favorecidos com PCDP identificável na observação; cada PCDP é contado uma vez por pessoa.\n'+source(t.d);
   }
   return null;
 };
 globalThis.answer=(q)=>dateOrderAnswer(q)||topOb(q)||travelAnswer(q)||previous(q);
 globalThis.__answer=globalThis.answer;
})();
