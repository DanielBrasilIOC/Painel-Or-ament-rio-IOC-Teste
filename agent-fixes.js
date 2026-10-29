/* Correções de interpretação do agente — somente ambiente de TESTE. */
(()=>{
 const legacyAnswer=globalThis.answer;
 const URL='https://raw.githubusercontent.com/DanielBrasilIOC/brasil/main/data.json';
 let data=null;
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const compact=s=>norm(s).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 const rows=d=>Array.isArray(d?.rows)?d.rows:[];
 const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const parse=v=>{if(typeof v==='number')return v;const s=String(v??'').replace(/[^0-9,.-]/g,'');if(!s)return 0;return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)||0};
 const fieldKey=r=>Object.keys(r||{}).find(k=>['valor','saldo','total'].includes(norm(k)))||Object.keys(r||{}).find(k=>/valor|saldo|total|liquido|bruto/.test(norm(k))&&!/data|pagamento/.test(norm(k)));
 const nameKey=r=>Object.keys(r||{}).find(k=>['favorecido','beneficiario','fornecedor','nome','credor'].some(t=>norm(k).includes(t)));
 const dsById=id=>data?.datasets.find(d=>d.id===id);
 const explicitDataset=q=>{
  const s=compact(q);
  const tests=[['saldo financeiro',['saldo financeiro','aba saldo financeiro'],'financeiro'],['restos a pagar',['restos a pagar'],'restos'],['empenhos 2026',['empenhos 2026','saldo nos empenhos 2026'],'empenhos'],['saldo orcamentario',['saldo orcamentario','saldo orçamentário'],'orcamentario'],['aguardando repasse',['aguardando repasse orcamentario','aguardando repasse orçamentário','aguardando repasse'],'repasses'],['ordens bancarias pagas',['ordens bancarias pagas','ordens bancárias pagas','ordens bancarias'],'ordens_bancarias'],['publicacoes pagas',['publicacoes pagas','publicações pagas'],'publicacoes_pagas'],['diarias pagas',['diarias pagas','diárias pagas'],'diarias_pagas']];
  for(const[,names,id]of tests)if(names.some(n=>s.includes(compact(n))))return dsById(id);return null;
 };
 const requestedField=q=>{
  const s=compact(q);const aliases=[['saldo',['saldo']],['valor',['valor','valor pago','montante']],['empenho',['empenho','numero do empenho','numero ne']],['numero_solicitacao',['numero da solicitacao','numero solicitacao','solicitacao']],['processo',['processo']],['favorecido',['favorecido','beneficiario']],['fornecedor',['fornecedor']],['ob',['ob','ordem bancaria']],['cnpj',['cnpj']],['pi',['pi']],['programa',['programa']],['unidade',['unidade']],['uge',['uge']],['ug',['ug']],['ptres',['ptres']],['subitem',['subitem']],['natureza',['natureza']],['natureza_codigo',['codigo da natureza']],['observacao',['observacao','descricao']],['vigencia',['vigencia']],['data_pagamento',['data do pagamento','data de pagamento']],['situacao_prioridade',['situacao prioridade','situacao']],['status_empenho',['status do empenho','status empenho']]];
  for(const [key,als] of aliases)if(als.some(a=>s.includes(compact(a))))return key;return null;
 };
 const fieldAliases={numero_solicitacao:['numero_solicitacao','solicitacao_ne'],empenho:['empenho','numero_ne','ne_ccor'],ob:['ob','documento'],valor:['valor','saldo','total'],favorecido:['favorecido','beneficiario','fornecedor'],observacao:['observacao','descricao']};
 const findField=(r,key)=>{if(!r)return null;const ks=Object.keys(r);const names=fieldAliases[key]||[key];return ks.find(k=>names.includes(norm(k)))||ks.find(k=>names.some(n=>norm(k).includes(norm(n))))};
 const identifierTokens=q=>compact(q).split(' ').filter(t=>t.length>=5&&(/[0-9]/.test(t)||/^[a-z]{2,}\d/.test(t)));
 const answerFixed=q=>{
  const s=compact(q);
  if(/(quais.*campos|campos.*disponiveis|quais.*dados|todos.*dados|o que (tem|existe).*dashboard|inventario|conjuntos.*dados|informacoes.*disponiveis|informações.*disponíveis)/.test(s)){
   return 'Inventário dos dados disponíveis no dashboard:\n'+data.datasets.map(d=>'• '+d.title+': '+rows(d).length+' registros; campos: '+[...new Set(rows(d).flatMap(r=>Object.keys(r||{})))].join(', ')).join('\n')+'\n\nTotal: '+data.datasets.length+' conjuntos, '+data.datasets.reduce((n,d)=>n+rows(d).length,0)+' registros e '+[...new Set(data.datasets.flatMap(d=>rows(d).flatMap(r=>Object.keys(r||{}))))].length+' nomes de campos distintos.\nBase atualizada em: '+(data.source_updated_at||'data não informada');
  }
  const explicit=explicitDataset(s);
  const isCount=/\b(quantos|quantas|quantidade|numero de registros|número de registros|registros existem|registros constam|itens existem|lancamentos existem|lançamentos existem|dados existem)\b/.test(s);
  const isTotal=/\b(quanto|total|montante|valor total|valor de|saldo total|valor registrado|montante registrado|quanto esta registrado|quanto está registrado|quanto existe|quanto consta|quanto representa)\b/.test(s);
  if(explicit&&(isCount||isTotal)){
   if(isCount)return `${explicit.title}: ${explicit.detail_count??rows(explicit).length} registros.\nFonte: ${explicit.source_name||explicit.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`;
   return `${explicit.title}: ${money(explicit.total)}\nRegistros: ${explicit.detail_count??rows(explicit).length}\nFonte: ${explicit.source_name||explicit.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`;
  }
  const fk=requestedField(s), ids=identifierTokens(s);
  if(fk&&ids.length&&/\b(qual|quais|informe|mostre|localize|encontre)\b/.test(s)){
   const target=explicit? [explicit] : data.datasets;
   const hits=[];
   for(const d of target)for(const r of rows(d)){
    const hay=compact(Object.values(r).join(' '));
    if(ids.every(id=>hay.includes(id)))hits.push({d,r});
   }
   if(hits.length===1){const {d,r}=hits[0],k=findField(r,fk);if(k)return `Campo consultado: ${k}\nResultado(s): ${String(r[k]??'')}\nRegistros correspondentes: 1\n\nFonte(s): ${d.source_name||d.title}\nBase atualizada em: ${data.source_updated_at||'data não informada'}`;}
   if(hits.length>1){const vals=[];for(const h of hits){const k=findField(h.r,fk);if(k&&String(h.r[k]??'').trim())vals.push(`${h.d.title}: ${h.r[k]}`)}if(vals.length)return `Campo consultado: ${fk}\nResultado(s): ${vals.join('; ')}\nRegistros correspondentes: ${hits.length}\n\nBase atualizada em: ${data.source_updated_at||'data não informada'}`;}
  }
  return legacyAnswer(q);
 };
 globalThis.answer=answerFixed;
 globalThis.__agentFixReady=fetch(URL+'?fix='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(j=>{data=j;return j;});
})();