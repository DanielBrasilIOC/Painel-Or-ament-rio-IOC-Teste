const DATA_URL = 'https://raw.githubusercontent.com/DanielBrasilIOC/brasil/main/data.json';
let base = null;
const $ = id => document.getElementById(id);
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const money = v => Number(v || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const rows = d => Array.isArray(d?.rows) ? d.rows : [];
const byId = id => (base?.datasets || []).find(d => norm(d.id) === norm(id));
const key = (r, terms) => Object.keys(r || {}).find(k => terms.some(t => norm(k).includes(norm(t))));
const parseMoney = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v ?? '').trim().replace(/[^0-9,.-]/g, '');
  if (!s) return 0;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};
function dateValue(r) {
  const preferred = ['data_pagamento','data pagamento','data','emissao','emissão'];
  const entries = Object.entries(r || {});
  entries.sort(([a],[b]) => {
    const rank = k => { const n=norm(k); const i=preferred.findIndex(x=>n===norm(x)); return i<0?99:i; };
    return rank(a)-rank(b);
  });
  for (const [k,v] of entries) {
    const n = norm(k);
    if (!(n.includes('data') || n.includes('pagamento') || n.includes('emissao'))) continue;
    const s = String(v ?? '').trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) return m[3]+'-'+m[2]+'-'+m[1];
  }
  return null;
}
const fmtDate = s => s ? new Date(s + 'T12:00:00').toLocaleDateString('pt-BR') : 'data não informada';
const valueKey = r => key(r, ['valor','saldo','total','pagamento','liquido','bruto']);
const dateFromText = q => {
  const m = q.match(/\b(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+(20\d{2}))?\b/);
  if (!m) return null;
  const months = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const idx = months.indexOf(m[1]);
  const year = Number(m[2] || base?.source_updated_at?.slice(0,4) || new Date().getFullYear());
  return {start:`${year}-${String(idx+1).padStart(2,'0')}-01`, end:idx===11?`${year+1}-01-01`:`${year}-${String(idx+2).padStart(2,'0')}-01`};
};
const threshold = q => {
  const m = q.match(/(?:acima|maior|superior)\s*(?:de|a|que)?\s*r?\$?\s*([\d.]+(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(mil|milhao|milhoes)?/);
  if (!m) return null;
  let n = Number(m[1].replace(/\./g,'').replace(',','.'));
  if (m[2] === 'mil') n *= 1000;
  if (m[2] && m[2].startsWith('milhao')) n *= 1000000;
  return n;
};
function chosenDataset(q) {
  if (q.includes('diaria')) return byId('diarias_pagas');
  if (q.includes('publicac')) return byId('publicacoes_pagas');
  if (q.includes('restos')) return byId('restos');
  if (q.includes('empenho')) return byId('empenhos');
  if (q.includes('repass')) return byId('repasses');
  if (q.includes('orcament')) return byId('orcamentario');
  if (q.includes('financeiro')) return byId('financeiro');
  if (q.includes('ob') || q.includes('ordem bancaria') || q.includes('pagamento')) return byId('ordens_bancarias');
  if (q.includes('saldo')) return byId('financeiro');
  return null;
}
const stopWords = new Set(['qual','quais','quanto','quantos','quantas','total','valor','valores','mostre','liste','localize','encontre','sobre','para','pela','pelo','com','uma','uns','das','dos','que','foi','sao','tem','por','em','de','do','da','o','a','os','as','um','uma','recebeu','receberam','recebido','recebida','receber','mais','me','diga','informe','somar','soma','pagou','pago','paga','pagas','pagos','diaria','diarias','ordem','bancaria','bancarias','ob','saldo','financeiro','financeira','favorecido','favorecida','beneficiario','beneficiaria']);
function personRows(ds, q) {
  const tokens=q.split(/\s+/).filter(t=>t.length>2&&!stopWords.has(t));
  if (!tokens.length) return [];
  const nameKey = r => key(r,['favorecido','beneficiario','fornecedor','nome','credor']);
  return rows(ds).filter(r => {
    const name=norm(r[nameKey(r)] || '');
    return name && tokens.some(t=>name.includes(t));
  });
}
function answer(original) {
  const q = norm(original).replace(/[?!.;,]/g,' ').replace(/\s+/g,' ').trim();
  if (!base) return 'A base ainda está carregando. Aguarde alguns segundos e tente novamente.';
  if (!q) return 'Digite uma pergunta para consultar os dados.';
  const d = chosenDataset(q);
  const dateRange = dateFromText(q);
  const isLastOb = (q.includes('ultima') || q.includes('ultimo') || q.includes('mais recente')) && (q.includes('ob') || q.includes('ordem bancaria'));
  if (isLastOb) {
    const ds=byId('ordens_bancarias');
    const sorted=rows(ds).map(r=>({r,date:dateValue(r)})).filter(x=>x.date).sort((a,b)=>b.date.localeCompare(a.date));
    if (!sorted.length) return 'Não foi possível confirmar a última OB: a base não contém datas de pagamento reconhecíveis.';
    const {r,date}=sorted[0], ob=key(r,['ob','documento','ordem']), val=valueKey(r), fav=key(r,['favorecido']);
    return `Última OB paga identificada: ${fmtDate(date)}\nDocumento: ${ob?r[ob]:'não informado'}\nValor: ${val?money(parseMoney(r[val])):'não informado'}\nFavorecido: ${fav?r[fav]:'não informado'}\n\nFonte: ${ds.source_name||ds.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
  }
  const asksPersonTotal = (q.includes('quanto') || q.includes('total') || q.includes('soma') || q.includes('recebeu') || q.includes('recebido')) &&
    (q.includes('recebeu') || q.includes('recebido') || q.includes('favorecido') || q.includes('beneficiario') || /\bquanto\b/.test(q));
  if (asksPersonTotal) {
    let ds=d;
    if (!ds && (q.includes('diaria') || q.includes('recebeu') || q.includes('recebido'))) ds=byId('diarias_pagas');
    if (!ds && (q.includes('ob') || q.includes('ordem bancaria'))) ds=byId('ordens_bancarias');
    const candidates=ds?[ds]:(base.datasets||[]);
    const matched=candidates.map(x=>({ds:x,found:personRows(x,q)})).filter(x=>x.found.length);
    if (matched.length) {
      matched.sort((a,b)=>{
        const preferred = x => x.ds.id==='diarias_pagas' && (q.includes('recebeu')||q.includes('recebido')||q.includes('diaria')) ? 1 : 0;
        return preferred(b)-preferred(a);
      });
      const {ds:src,found}=matched[0], vk=valueKey(found[0]);
      if (!vk) return `Encontrei registros de ${found[0][key(found[0],['favorecido','beneficiario','fornecedor','nome','credor'])]} mas não há campo de valor confiável para somar.`;
      const filtered=dateRange?found.filter(r=>{const dt=dateValue(r);return dt&&dt>=dateRange.start&&dt<dateRange.end;}):found;
      const total=filtered.reduce((s,r)=>s+parseMoney(r[vk]),0);
      const nameKey=key(filtered[0]||found[0],['favorecido','beneficiario','fornecedor','nome','credor']);
      const name=filtered[0]?.[nameKey]||found[0][nameKey];
      return `Total identificado para ${name}: ${money(total)}\nRegistros considerados: ${filtered.length}${dateRange?' no período solicitado':''}\n\nFonte: ${src.source_name||src.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
    }
  }
  if ((q.includes('maior') || q.includes('top') || q.includes('maiores')) && (q.includes('pagamento') || q.includes('ob') || q.includes('ordem bancaria'))) {
    const ds=byId('ordens_bancarias');
    let arr=rows(ds).map(r=>({r,v:parseMoney(r[valueKey(r)])})).filter(x=>Number.isFinite(x.v));
    if(dateRange) arr=arr.filter(x=>{const dt=dateValue(x.r);return dt&&dt>=dateRange.start&&dt<dateRange.end;});
    const m=q.match(/top\s+(\d+)/)||q.match(/(\d+)\s+maiores/);
    const limit=Math.min(10,Math.max(1,Number(m?.[1]||5)));
    arr.sort((a,b)=>b.v-a.v);
    if(!arr.length)return 'Não há registros que atendam aos filtros informados.';
    return `Maiores pagamentos${dateRange?' no período solicitado':''}:\n`+arr.slice(0,limit).map((x,i)=>{const ob=key(x.r,['ob','documento','ordem']),fav=key(x.r,['favorecido']);return `${i+1}. ${money(x.v)}${ob?' · '+x.r[ob]:''}${fav?' · '+x.r[fav]:''}`;}).join('\n')+`\n\nFonte: ${ds.source_name||ds.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
  }
  if ((q.includes('acima') || q.includes('superior') || q.includes('maior que')) && d) {
    const t=threshold(q);
    if(t!==null){
      let arr=rows(d).filter(r=>parseMoney(r[valueKey(r)])>t);
      if(dateRange)arr=arr.filter(r=>{const dt=dateValue(r);return dt&&dt>=dateRange.start&&dt<dateRange.end;});
      const total=arr.reduce((s,r)=>s+parseMoney(r[valueKey(r)]),0);
      return `${arr.length} registro(s) acima de ${money(t)}${dateRange?' no período solicitado':''}.\nTotal dos registros: ${money(total)}\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
    }
  }
  if (d && (q.includes('quanto') || q.includes('total') || q.includes('saldo') || q.includes('valor') || q.includes('temos') || q.includes('empenhos') || q.includes('restos'))) {
    if(dateRange) {
      const filtered=rows(d).filter(r=>{const dt=dateValue(r);return dt&&dt>=dateRange.start&&dt<dateRange.end;});
      const total=filtered.reduce((s,r)=>s+parseMoney(r[valueKey(r)]),0);
      return `Total no período solicitado: ${money(total)}\nRegistros: ${filtered.length}\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
    }
    if(Number.isFinite(Number(d.total))) return `${d.title}: ${money(Number(d.total))}\nRegistros: ${d.detail_count ?? rows(d).length}\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
    return `Encontrei “${d.title}”, mas a base não fornece um total confiável para responder.`;
  }
  if (d) return `${d.title}: ${money(Number(d.total)||0)}\nRegistros: ${d.detail_count ?? rows(d).length}\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
  const tokens=q.split(/\s+/).filter(t=>t.length>=2&&!stopWords.has(t));
  const all=(base.datasets||[]).flatMap(ds=>rows(ds).map(r=>({ds,r})));
  const hits=all.map(x=>{
    const hay=norm(Object.entries(x.r||{}).map(([k,v])=>k+' '+v).join(' ')+' '+x.ds.title+' '+x.ds.source_name);
    const matched=tokens.filter(t=>hay.includes(t));
    return {...x,score:matched.length};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(hits.length) {
    const best=hits.filter(x=>x.score===hits[0].score);
    const limit=Math.min(10,best.length);
    return `Encontrei ${best.length} registro(s) com correspondência. Não somei valores de bases diferentes para evitar duplicidade.\nConjuntos: ${[...new Set(best.map(x=>x.ds.title))].join(', ')}\n\n`+best.slice(0,limit).map((x,i)=>`${i+1}. [${x.ds.title}] ${Object.entries(x.r).filter(([k,v])=>v!==''&&v!==null&&v!==undefined).slice(0,9).map(([k,v])=>k+': '+v).join(' · ')}`).join('\n')+`\n\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
  }
  return 'Não consegui interpretar a pergunta com segurança e não vou estimar valores. Tente: “Qual foi a última OB paga?”, “Quanto recebeu Jerônimo em diárias?”, “Qual é o saldo financeiro?”, “Quanto temos de restos a pagar?” ou “Quais foram os 5 maiores pagamentos em outubro?”.';
}
async function load() {
  try {
    const response=await fetch(DATA_URL+'?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const next=await response.json();
    if(!Array.isArray(next.datasets))throw new Error('Formato da base inesperado');
    base=next;
    $('status').textContent=`Base carregada · atualização da fonte: ${base.source_updated_at||'não informada'} · ${base.datasets.length} conjuntos de dados.`;
    $('status').className='status ok';
  } catch(e) {
    $('status').textContent='Não foi possível carregar a base pública: '+e.message;
    $('status').className='status err';
  }
}
function ask(q){$('answer').hidden=false;$('answer').textContent=answer(q);}
$('ask').addEventListener('click',()=>ask($('q').value));
$('q').addEventListener('keydown',e=>{if(e.key==='Enter')ask($('q').value);});
document.querySelectorAll('.examples button').forEach(b=>b.addEventListener('click',()=>{$('q').value=b.dataset.q;ask(b.dataset.q);}));
load();
