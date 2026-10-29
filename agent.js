const DATA_URL = 'https://raw.githubusercontent.com/DanielBrasilIOC/brasil/main/data.json';
let base = null;
const $ = id => document.getElementById(id);
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const money = v => Number(v || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const rows = d => Array.isArray(d?.rows) ? d.rows : [];
const findDs = terms => (base?.datasets || []).find(d => terms.some(t => norm(`${d.id} ${d.title} ${d.short || ''} ${d.source_name || ''}`).includes(norm(t)));
const key = (r, terms) => Object.keys(r || {}).find(k => terms.some(t => norm(k).includes(norm(t))));
const parseMoney = v => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim().replace(/[^0-9,.-]/g, '');
  if (!s) return 0;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return Number(normalized) || 0;
};
function dateValue(r) {
  for (const [k,v] of Object.entries(r || {})) {
    const n = norm(k);
    if (n.includes('data') || n.includes('pagamento') || n.includes('emissao')) {
      const s = String(v ?? '').trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
      if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) { const [d,m,y] = s.slice(0,10).split('/'); return `${y}-${m}-${d}`; }
    }
  }
  return null;
}
const fmtDate = s => s ? new Date(s + 'T12:00:00').toLocaleDateString('pt-BR') : '';
const valueKey = r => key(r, ['valor','saldo','total','pagamento','liquido','bruto']);
const paymentTerms = ['ordens bancarias pagas','ordens bancarias','ob pagas'];
const dateFromText = q => {
  const m = q.match(/\b(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+(20\d{2}))?\b/);
  if (!m) return null;
  const months = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const idx = months.indexOf(m[1]);
  const year = Number(m[2] || base?.source_updated_at?.slice(0,4) || new Date().getFullYear());
  return {start:`${year}-${String(idx+1).padStart(2,'0')}-01`, end: idx===11 ? `${year+1}-01-01` : `${year}-${String(idx+2).padStart(2,'0')}-01`};
};
const threshold = q => {
  const m = q.match(/(?:acima|maior|superior)\s*(?:de|a|que)?\s*r?\$?\s*([\d.]+(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(mil|milhao|milhoes)?/);
  if (!m) return null;
  let n = Number(m[1].replace(/\./g,'').replace(',','.'));
  if (m[2] === 'mil') n *= 1000;
  if (m[2] && m[2].startsWith('milhao')) n *= 1000000;
  return n;
};
const datasetTerms = q => {
  if (q.includes('diaria')) return ['diarias_pagas','diarias pagas'];
  if (q.includes('publicac')) return ['publicacoes_pagas','publicacoes pagas'];
  if (q.includes('restos')) return ['restos','restos a pagar'];
  if (q.includes('empenho')) return ['empenhos','empenhos 2026'];
  if (q.includes('repass')) return ['repasses','aguardando repasse'];
  if (q.includes('orcament')) return ['orcamentario','saldo orcamentario'];
  if (q.includes('financeiro') || q.includes('saldo')) return ['financeiro','saldo financeiro'];
  if (q.includes('ob') || q.includes('ordem bancaria') || q.includes('pagamento')) return paymentTerms;
  return null;
};
function chosenDataset(q) { const terms = datasetTerms(q); return terms ? findDs(terms) : null; }
function answer(original) {
  const q = norm(original).trim();
  if (!base) return 'A base ainda está carregando.';
  if (!q) return 'Digite uma pergunta para consultar os dados.';
  const d = chosenDataset(q);
  const dateRange = dateFromText(q);
  const isLastOb = (q.includes('ultima') || q.includes('ultimo') || q.includes('mais recente')) && (q.includes('ob') || q.includes('ordem bancaria'));
  if (isLastOb) {
    const ds = findDs(paymentTerms);
    if (!ds) return 'Não encontrei a base de Ordens Bancárias Pagas; não vou inventar uma resposta.';
    const sorted = rows(ds).map(r=>({r,date:dateValue(r)})).filter(x=>x.date).sort((a,b)=>b.date.localeCompare(a.date));
    if (!sorted.length) return 'A base foi encontrada, mas não há datas reconhecíveis para confirmar a última OB.';
    const x=sorted[0], r=x.r, ob=key(r,['ob','documento','ordem']), val=valueKey(r), fav=key(r,['favorecido']);
    return `Última OB paga encontrada: ${fmtDate(x.date)}\n${ob ? `Documento: ${r[ob]}\n` : ''}${val ? `Valor: ${money(parseMoney(r[val]))}\n` : ''}${fav ? `Favorecido: ${r[fav]}\n` : ''}\nFonte: ${ds.source_name || ds.title}\nBase atualizada em: ${base.source_updated_at || 'data não informada'}`;
  }
  if ((q.includes('maior') || q.includes('top') || q.includes('maiores')) && (q.includes('pagamento') || q.includes('ob') || q.includes('ordem bancaria'))) {
    const ds=findDs(paymentTerms); if(!ds) return 'Não encontrei a base de pagamentos.';
    let arr=rows(ds).map(r=>({r,v:parseMoney(r[valueKey(r)])})).filter(x=>Number.isFinite(x.v));
    if(dateRange) arr=arr.filter(x=>{const dt=dateValue(x.r);return dt&&dt>=dateRange.start&&dt<dateRange.end;});
    const lim=Math.min(10,Math.max(1,Number((q.match(/top\s+(\d+)/)||q.match(/(\d+)\s+maiores/)||[])[1]||1)));
    arr.sort((a,b)=>b.v-a.v);
    if(!arr.length)return 'Não há registros que atendam aos filtros informados.';
    return `Maiores pagamentos${dateRange?' no período solicitado':''}:\n`+arr.slice(0,lim).map((x,i)=>{const ob=key(x.r,['ob','documento','ordem']),fav=key(x.r,['favorecido']);return `${i+1}. ${money(x.v)}${ob?` · ${x.r[ob]}`:''}${fav?` · ${x.r[fav]}`:''}`;}).join('\n')+`\n\nFonte: ${ds.source_name||ds.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
  }
  if ((q.includes('acima') || q.includes('superior') || q.includes('maior que')) && d) {
    const t=threshold(q);
    if(t!==null){let arr=rows(d).map(r=>({r,v:parseMoney(r[valueKey(r)])})).filter(x=>x.v>t);
      if(dateRange)arr=arr.filter(x=>{const dt=dateValue(x.r);return dt&&dt>=dateRange.start&&dt<dateRange.end;});
      const total=arr.reduce((s,x)=>s+x.v,0);
      return `${arr.length} registro(s) acima de ${money(t)}${dateRange?' no período solicitado':''}.\nTotal dos registros: ${money(total)}\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
    }
  }
  if ((q.includes('quanto') || q.includes('total')) && d) {
    let arr=rows(d);
    if(dateRange)arr=arr.filter(r=>{const dt=dateValue(r);return dt&&dt>=dateRange.start&&dt<dateRange.end;});
    const total=arr.reduce((s,r)=>s+parseMoney(r[valueKey(r)]),0);
    return `Total${dateRange?' no período solicitado':''}: ${money(total)}\nRegistros: ${arr.length}\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
  }
  if (d) {
    const val=Number(d.total);
    if(Number.isFinite(val)) return `${d.title}: ${money(val)}\nRegistros: ${d.detail_count ?? rows(d).length}\nFonte: ${d.source_name||d.title}\nBase atualizada em: ${base.source_updated_at||'data não informada'}`;
    return `Encontrei o conjunto “${d.title}”, mas a base não fornece um total confiável para responder a essa pergunta.\nFonte: ${d.source_name||d.title}`;
  }
  return `Não consegui interpretar essa pergunta com segurança.\n\nExperimente:\n• Qual foi a última OB paga?\n• Quais foram os 5 maiores pagamentos em outubro?\n• Quantas OBs acima de R$ 50 mil foram pagas em outubro?\n• Qual o total de pagamentos em outubro?\n• Qual é o saldo financeiro?\n• Quanto temos de restos a pagar?\n• Qual o total de diárias pagas?`;
}
async function load() {
  try {
    const response=await fetch(DATA_URL+'?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    base=await response.json();
    if(!Array.isArray(base.datasets))throw new Error('Formato da base inesperado');
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
