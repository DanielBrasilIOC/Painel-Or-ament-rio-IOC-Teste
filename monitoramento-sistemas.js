(()=>{'use strict';
const d=document;
if(d.getElementById('iocGovMonitor'))return;
const css=`
:root{--navy:#163b57;--blue:#286785;--teal:#31847c;--ink:#263d4c;--muted:#687d8b;--line:#e1e9ee;--surface:#fff;--canvas:#f3f7f9;--green:#237456;--green-bg:#e9f5ef;--amber:#946316;--amber-bg:#fff4df;--red:#a23d3d;--red-bg:#fceeee}
*{box-sizing:border-box}
html{background:var(--canvas)}
body{margin:0;background:linear-gradient(135deg,#f3f7f9 0%,#edf3f6 55%,#f7f9fb 100%);color:var(--ink);font-family:Inter,"Segoe UI",Roboto,system-ui,-apple-system,sans-serif}
.gm-wrap{max-width:1440px;margin:0 auto;padding:24px clamp(14px,2.8vw,36px) 28px}
.gm-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 2px 14px}
.gm-section-head h1{font-size:clamp(19px,2vw,24px);letter-spacing:-.025em;color:var(--navy);margin:0;font-weight:800}
.gm-section-head p{margin:4px 0 0;color:var(--muted);font-size:12px}
.gm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.gm-card{position:relative;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:17px 18px 16px;box-shadow:0 5px 18px rgba(22,59,87,.045);transition:transform .18s ease,box-shadow .18s ease}
.gm-card:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(22,59,87,.09)}
.gm-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#9aabb5}
.gm-card.is-ok:before{background:var(--green)}
.gm-card.is-warn:before{background:#c08b2d}
.gm-card.is-bad:before{background:var(--red)}
.gm-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:13px}
.gm-name-wrap{display:flex;align-items:center;gap:11px;min-width:0}
.gm-name{font-size:16px;line-height:1.25;font-weight:800;color:var(--navy);text-decoration:none;overflow-wrap:anywhere}
.gm-name:hover{color:var(--blue);text-decoration:underline;text-underline-offset:3px}
.gm-status{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:850;white-space:nowrap}
.gm-status:before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.gm-status.ok{background:var(--green-bg);color:var(--green)}
.gm-status.warn{background:var(--amber-bg);color:var(--amber)}
.gm-status.bad{background:var(--red-bg);color:var(--red)}
.gm-detail{font-size:12px;line-height:1.5;color:#607481;margin:0 0 13px}
.gm-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.gm-metric{min-width:0;background:#f7fafb;border:1px solid #e8eef1;border-radius:10px;padding:10px 11px}
.gm-metric b{display:block;color:var(--navy);font-size:15px;font-weight:850;font-variant-numeric:tabular-nums;white-space:nowrap}
.gm-metric span{display:block;margin-top:3px;color:var(--muted);font-size:10px;line-height:1.35}
.gm-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #edf1f3;margin-top:13px;padding-top:11px}
.gm-checked{font-size:10px;color:#80909a;line-height:1.4}
.gm-links{display:flex;gap:12px;flex-wrap:wrap}
.gm-links a{font-size:11px;color:var(--blue);font-weight:750;text-decoration:none}
.gm-links a:hover{text-decoration:underline;text-underline-offset:3px}
.gm-alerts{margin-top:20px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;box-shadow:0 5px 18px rgba(22,59,87,.04)}
.gm-alerts-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.gm-alerts h2{margin:0;color:var(--navy);font-size:15px;font-weight:800}
.gm-alert-count{background:#eef3f6;color:#607481;border-radius:99px;padding:4px 9px;font-size:10px;font-weight:800}
.gm-alert-list{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.gm-alert-list li{border:1px solid #edf1f3;border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.5;color:#526977}
.gm-empty{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f6faf8;border:1px solid #e4efe9;border-radius:10px;color:#47715f;font-size:12px}
.gm-empty-mark{width:24px;height:24px;border-radius:50%;background:#e4f2ea;color:var(--green);display:grid;place-items:center;font-weight:900;flex:0 0 24px}
.gm-error{background:#fff5f5;border:1px solid #edcccc;border-left:4px solid var(--red);color:#873b3b;padding:14px;border-radius:12px;font-size:13px}
@media(max-width:760px){.gm-wrap{padding:16px 12px 20px}.gm-grid{grid-template-columns:1fr;gap:11px}.gm-card{padding:15px}.gm-section-head{margin-bottom:11px}.gm-alerts{margin-top:14px;padding:14px}}
@media(max-width:380px){.gm-card-head{align-items:flex-start;flex-direction:column}.gm-status{align-self:flex-start}.gm-metric{padding:9px 8px}.gm-metric b{font-size:14px}}
@media(prefers-reduced-motion:reduce){.gm-card{transition:none}.gm-card:hover{transform:none}}
`;
const st=d.createElement('style');st.textContent=css;d.head.appendChild(st);
const root=d.createElement('main');root.id='iocGovMonitor';root.innerHTML='<div class="gm-wrap"><div id="gmContent"><div class="gm-error">Carregando monitoramento…</div></div></div>';
d.body.innerHTML='';d.body.appendChild(root);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>s?new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—';
const stt=s=>s==='ACESSIVEL'?['Acessível','ok','is-ok']:s==='INSTABILIDADE'?['Instabilidade','bad','is-bad']:['Não verificado','warn','is-warn'];
const initials=s=>String(s||'').replace(/\.gov\.br/gi,'').replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase()||'SYS';
async function render(){
 const el=d.getElementById('gmContent');
 try{
  const r=await fetch('./monitoramento-sistemas.json?ts='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const x=await r.json(),systems=x.systems||[],alerts=(x.alerts||[]).slice(-10).reverse();
  const cards=systems.map(s=>{
   const z=stt(s.status),lat=Number(s.latency_ms),latLabel=Number.isFinite(lat)?lat.toLocaleString('pt-BR')+' ms':'—';
   const http=s.http_status??'—',fail=s.failure_streak??0,oper=s.operational||{};
   const detail=s.detail||s.scope||'Verificação de acesso ao endereço público.';
   const opLink=oper.source_url?'<a href="'+esc(oper.source_url)+'" target="_blank" rel="noopener noreferrer">Referência oficial ↗</a>':'';
   return '<article class="gm-card '+z[2]+'"><div class="gm-card-head"><div class="gm-name-wrap"><a class="gm-name" href="'+esc(s.url||'#')+'" target="_blank" rel="noopener noreferrer">'+esc(s.name||'Sistema')+' ↗</a></div><span class="gm-status '+z[1]+'">'+z[0]+'</span></div><p class="gm-detail">'+esc(detail)+'</p><div class="gm-metrics"><div class="gm-metric"><b>HTTP '+esc(http)+'</b><span>Resposta do endereço público</span></div><div class="gm-metric"><b>'+esc(latLabel)+'</b><span>Tempo de resposta</span></div><div class="gm-metric"><b>'+esc(fail)+'</b><span>Falhas consecutivas</span></div></div><div class="gm-card-foot"><span class="gm-checked">Última checagem: '+esc(fmt(s.checked_at||x.checked_at))+'</span><span class="gm-links">'+opLink+'</span></div></article>';
  }).join('');
  const alertMarkup=alerts.length?'<ul class="gm-alert-list">'+alerts.map(a=>'<li>'+esc(fmt(a.created_at))+' — '+esc(a.message)+'</li>').join('')+'</ul>':'<div class="gm-empty"><span class="gm-empty-mark">✓</span><span>Nenhum alerta ou recuperação registrado no momento.</span></div>';
  el.innerHTML='<section aria-labelledby="gmSystemsTitle"><div class="gm-section-head"><div><h1 id="gmSystemsTitle">Sistemas monitorados</h1><p>Acompanhamento de acesso aos endereços públicos oficiais</p></div></div><div class="gm-grid">'+(cards||'<div class="gm-error">Nenhum sistema registrado.</div>')+'</div></section><section class="gm-alerts" aria-labelledby="gmAlertsTitle"><div class="gm-alerts-head"><h2 id="gmAlertsTitle">Alertas e recuperações</h2><span class="gm-alert-count">'+alerts.length+' registro(s)</span></div>'+alertMarkup+'</section>';
  fitFrame();
 }catch(e){el.innerHTML='<div class="gm-error"><b>Não foi possível carregar o monitoramento.</b><br>'+esc(e.message)+'</div>';fitFrame();}
}
function fitFrame(){try{if(window.frameElement){window.frameElement.style.height=Math.max(document.documentElement.scrollHeight,500)+'px';}}catch(e){}}
if('ResizeObserver'in window){new ResizeObserver(fitFrame).observe(d.body);}
window.addEventListener('load',fitFrame);window.addEventListener('resize',fitFrame);
render();
})();