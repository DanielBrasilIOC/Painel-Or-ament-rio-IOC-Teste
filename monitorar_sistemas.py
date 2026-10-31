#!/usr/bin/env python3
"""Monitoramento em camadas: endpoints, DNS/TLS, páginas de entrada e comunicados oficiais.
Não autentica usuários, não envia credenciais e não executa consultas ou transações.
"""
import json, os, re, socket, ssl, time, urllib.request, urllib.error
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, urljoin

ROOT = Path(__file__).resolve().parent
STATE = ROOT / "monitoramento-sistemas.json"
TIMEOUT = 10
MAX_BODY = 750_000
UA = "IOC-Test-Monitor/2.0 (+safe-public-service-check; no-auth; no-transactions)"
GOVBR_SSO = "https://sso.acesso.gov.br/login"
NOTICES_URL = "https://www.gov.br/compras/pt-br/acesso-a-informacao/comunicados"

SYSTEMS = [
 {"id":"siafi","name":"SIAFI","url":"https://siafi.tesouro.gov.br/","auth_url":"https://siafi.tesouro.gov.br/senha/public/pages/security/login.jsf","scope":"Portal e página pública de entrada; não autentica nem executa operações.","official_info":"https://www.gov.br/tesouronacional/pt-br/siafi/consultas-e-servicos/calendario-disponibilidade-siafi","keywords":["siafi","tesouro"]},
 {"id":"contratos","name":"Contratos.gov.br","url":"https://contratos.comprasnet.gov.br/login","auth_url":"https://contratos.comprasnet.gov.br/login","scope":"Página pública de entrada; módulos autenticados e transações não são executados.","official_info":NOTICES_URL,"keywords":["contratos","compras"]},
 {"id":"compras","name":"Compras.gov.br","url":"https://www.gov.br/compras/pt-br","auth_url":"https://comprasnet.gov.br/seguro/loginPortalEstrangeiro.asp","scope":"Portal e página pública de entrada; não autentica nem executa operações.","official_info":NOTICES_URL,"keywords":["compras","governo federal"]},
 {"id":"sicaf","name":"SICAF","url":"https://www.gov.br/compras/pt-br/sistemas/conheca-o-compras/sicaf-digital","auth_url":"https://www3.comprasnet.gov.br/","scope":"Página pública informativa e entrada pública do SICAF; sem autenticação ou operações.","official_info":NOTICES_URL,"keywords":["sicaf","fornecedores"]},
 {"id":"govbr","name":"gov.br","url":"https://www.gov.br/","auth_url":GOVBR_SSO,"scope":"Portal e tela pública de entrada do Login Único; nenhuma credencial é enviada.","official_info":"https://www.gov.br/pt-br","keywords":["gov.br","governo"]},
 {"id":"cadin","name":"CADIN","url":"https://cadin.pgfn.gov.br/#/home","auth_url":"https://cadin.pgfn.gov.br/","scope":"Portal e entrada pública do CADIN; não consulta registros nem acessa área autenticada.","official_info":"https://www.gov.br/pgfn/pt-br/servicos/perguntas-frequentes/perguntas-frequentes-sobre-o-cadin-pgfn","keywords":["cadin","pgfn"]},
]

class NoticeParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.items=[]; self._href=None; self._text=[]
    def handle_starttag(self, tag, attrs):
        if tag.lower()=="a":
            self._href=dict(attrs).get("href"); self._text=[]
    def handle_data(self, data):
        if self._href is not None: self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower()=="a" and self._href is not None:
            title=" ".join(" ".join(self._text).split())
            if title and len(title)>12: self.items.append((title,self._href))
            self._href=None; self._text=[]

def dns_check(host):
    try:
        rows=socket.getaddrinfo(host,None,type=socket.SOCK_STREAM)
        ips=sorted({r[4][0] for r in rows})
        return {"status":"RESOLVIDO","addresses":ips[:6]}
    except Exception as e:
        return {"status":"FALHA","detail":type(e).__name__}

def tls_check(host, port=443):
    try:
        ctx=ssl.create_default_context()
        with socket.create_connection((host,port),timeout=TIMEOUT) as raw:
            with ctx.wrap_socket(raw,server_hostname=host) as conn:
                cert=conn.getpeercert()
        expiry=datetime.fromtimestamp(ssl.cert_time_to_seconds(cert["notAfter"]),tz=timezone.utc)
        days=(expiry-datetime.now(timezone.utc)).days
        state="VALIDO" if days>14 else ("VENCIMENTO_PROXIMO" if days>=0 else "EXPIRADO")
        return {"status":state,"days_remaining":days,"expires_at":expiry.isoformat(timespec="seconds").replace("+00:00","Z")}
    except Exception as e:
        return {"status":"NAO_VERIFICADO","detail":type(e).__name__}

def _probe(url):
    parsed=urlparse(url); host=parsed.hostname or ""
    dns=dns_check(host) if host else {"status":"FALHA"}
    tls=tls_check(host,parsed.port or 443) if parsed.scheme=="https" and host else {"status":"NAO_APLICAVEL"}
    req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"text/html,application/xhtml+xml,*/*"})
    start=time.monotonic()
    try:
        with urllib.request.urlopen(req,timeout=TIMEOUT) as res:
            code=res.status; final=res.geturl(); ctype=res.headers.get("Content-Type","")
            body=res.read(MAX_BODY)
        ms=round((time.monotonic()-start)*1000)
        text=body.decode("utf-8","replace")
        title_match=re.search(r"<title[^>]*>(.*?)</title>",text,re.I|re.S)
        title=re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",title_match.group(1))).strip()[:180] if title_match else ""
        http_state="ACESSIVEL" if 200<=code<400 else ("INSTABILIDADE" if code>=500 else "NAO_CONCLUSIVO")
        content_state="CONTEUDO_PRESENTE" if len(text.strip())>100 else "CONTEUDO_LIMITADO"
        latency_state="NORMAL" if ms<2000 else ("LENTA" if ms<5000 else "MUITO_LENTA")
        return {"http_status":code,"latency_ms":ms,"latency_status":latency_state,"final_url":final,
          "content_type":ctype,"page_title":title,"content_status":content_state,"body_bytes_checked":len(body),
          "dns":dns,"tls":tls,"status":http_state,
          "detail":"Resposta HTTP recebida; verificação não comprova operação autenticada."}
    except urllib.error.HTTPError as e:
        ms=round((time.monotonic()-start)*1000)
        return {"http_status":e.code,"latency_ms":ms,"latency_status":"NAO_CLASSIFICADA","final_url":e.geturl(),
          "content_type":"","page_title":"","content_status":"NAO_AVALIADO","body_bytes_checked":0,"dns":dns,"tls":tls,
          "status":"INSTABILIDADE" if e.code>=500 else "NAO_CONCLUSIVO","detail":f"Resposta HTTP {e.code}."}
    except Exception as e:
        ms=round((time.monotonic()-start)*1000)
        return {"http_status":None,"latency_ms":ms,"latency_status":"NAO_CLASSIFICADA","final_url":None,
          "content_type":"","page_title":"","content_status":"NAO_AVALIADO","body_bytes_checked":0,"dns":dns,"tls":tls,
          "status":"NAO_VERIFICADO","detail":f"Falha de conexão ({type(e).__name__}); pode ser transitória ou bloqueio de rede."}

def find_notices(spec, html):
    parser=NoticeParser()
    try: parser.feed(html)
    except Exception: pass
    terms=["manutenção","indisponibilidade","instabilidade","falha","indisponível","interrupção","erro"]
    name_terms={
      "siafi":["siafi"],"contratos":["contratos.gov.br","contratos"],"compras":["compras.gov.br","compras"],
      "sicaf":["sicaf"],"govbr":["gov.br","autenticação","login"],"cadin":["cadin","pgfn"]
    }.get(spec["id"],[spec["name"].lower()])
    found=[]
    for title,href in parser.items:
        low=title.lower()
        if any(n in low for n in name_terms) and any(t in low for t in terms):
            found.append({"title":title[:240],"url":urljoin(NOTICES_URL,href)})
    return found[:8]

_PROBE_CACHE = {}
def probe(url):
    if url not in _PROBE_CACHE:
        _PROBE_CACHE[url] = _probe(url)
    return dict(_PROBE_CACHE[url])

def assess_condition(result, auth, info):
    reasons=[]
    if result.get("status")=="INSTABILIDADE":
        reasons.append("Endereço público retornou erro HTTP 5xx.")
    elif result.get("status")=="NAO_VERIFICADO":
        reasons.append("Não foi possível concluir a verificação HTTP.")
    if result.get("dns",{}).get("status")=="FALHA":
        reasons.append("Falha na resolução DNS.")
    tls=result.get("tls",{})
    if tls.get("status")=="EXPIRADO":
        reasons.append("Certificado TLS expirado.")
    elif tls.get("status")=="VENCIMENTO_PROXIMO":
        reasons.append("Certificado TLS próximo do vencimento.")
    elif tls.get("status")=="NAO_VERIFICADO":
        reasons.append("Validade do certificado TLS não pôde ser confirmada.")
    if auth.get("status")!="ACESSIVEL":
        reasons.append("Página pública de entrada não respondeu normalmente.")
    if result.get("latency_status") in ("LENTA","MUITO_LENTA"):
        reasons.append("Tempo de resposta acima do limite de referência.")
    if info.get("status")!="ACESSIVEL":
        reasons.append("Página oficial de referência/comunicados indisponível.")
    critical=any(x in reasons for x in (
        "Endereço público retornou erro",
        "Falha na resolução DNS", "Certificado TLS expirado",
        "Página pública de entrada não respondeu"
    ))
    warning=bool(reasons)
    return {"status":"CRITICO" if critical else ("ATENCAO" if warning else "NORMAL"),
            "reasons":reasons or ["Verificações externas dentro dos limites definidos."],
            "detail":"Classificação baseada somente em sinais públicos; não representa confirmação de funcionamento interno."}

def main():
    old={}
    if STATE.exists():
        try: old=json.loads(STATE.read_text(encoding="utf-8"))
        except Exception: old={}
    old_by_id={s.get("id"):s for s in old.get("systems",[])}
    started=time.monotonic()
    now=datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00","Z")
    notices_result=probe(NOTICES_URL)
    # Uma única leitura adicional da página oficial de comunicados, sem interagir com formulários.
    notice_html=""
    try:
        req=urllib.request.Request(NOTICES_URL,headers={"User-Agent":UA})
        with urllib.request.urlopen(req,timeout=TIMEOUT) as res: notice_html=res.read(MAX_BODY).decode("utf-8","replace")
    except Exception: pass
    systems=[]; alerts=list(old.get("alerts",[]))
    for spec in SYSTEMS:
        result=probe(spec["url"])
        auth=probe(spec["auth_url"])
        info=probe(spec["official_info"])
        prev=old_by_id.get(spec["id"],{})
        streak=(int(prev.get("failure_streak",0))+1) if result["status"]=="INSTABILIDADE" else (0 if result["status"]=="ACESSIVEL" else int(prev.get("failure_streak",0)))
        alert_state="SEM_ALERTA"
        if result["status"]=="INSTABILIDADE" and streak>=2 and prev.get("alert_state")!="FALHA_ALERTADA":
            alerts.append({"created_at":now,"system":spec["name"],"type":"FALHA_CONSECUTIVA","message":f"{spec['name']}: duas ou mais falhas HTTP 5xx consecutivas no endereço público."})
            alert_state="FALHA_ALERTADA"
        elif result["status"]=="ACESSIVEL" and prev.get("alert_state")=="FALHA_ALERTADA":
            alerts.append({"created_at":now,"system":spec["name"],"type":"RECUPERACAO","message":f"{spec['name']}: endereço público voltou a responder."})
        elif result["status"]=="INSTABILIDADE" and streak>=2: alert_state="FALHA_ALERTADA"
        elif result["status"]=="NAO_VERIFICADO": alert_state=prev.get("alert_state","SEM_ALERTA")
        else: alert_state="SEM_ALERTA"
        matches=find_notices(spec,notice_html) if spec["id"] in ("contratos","compras","sicaf") else []
        auth_ok=auth["status"]=="ACESSIVEL"
        operational_status="ENTRADA_PUBLICA_ACESSIVEL" if auth_ok else "ENTRADA_PUBLICA_COM_FALHA"
        condition=assess_condition(result,auth,info)
        prev_condition=prev.get("condition",{})
        prev_level=prev_condition.get("status","NORMAL")
        if condition["status"]!="NORMAL":
            condition["since"]=prev_condition.get("since",now) if prev_level!="NORMAL" else now
            condition["duration_seconds"]=max(0,int((datetime.fromisoformat(now.replace("Z","+00:00"))-datetime.fromisoformat(condition["since"].replace("Z","+00:00"))).total_seconds()))
            if prev_level=="NORMAL":
                alerts.append({"created_at":now,"system":spec["name"],"type":"CONDICAO_DE_ATENCAO" if condition["status"]=="ATENCAO" else "CONDICAO_CRITICA","message":f"{spec['name']}: {condition['status'].lower()} — {'; '.join(condition['reasons'])}"})
        else:
            condition["since"]=None
            condition["duration_seconds"]=0
            if prev_level!="NORMAL":
                since=prev_condition.get("since")
                seconds=0
                if since:
                    seconds=max(0,int((datetime.fromisoformat(now.replace("Z","+00:00"))-datetime.fromisoformat(since.replace("Z","+00:00"))).total_seconds()))
                alerts.append({"created_at":now,"system":spec["name"],"type":"CONDICAO_NORMALIZADA","duration_seconds":seconds,"message":f"{spec['name']}: verificações externas normalizadas após {seconds//60} min."})
        systems.append({**spec,**result,"condition":condition,"checked_at":now,"failure_streak":streak,"alert_state":alert_state,
          "authentication":{"status":operational_status,"http_status":auth["http_status"],"latency_ms":auth["latency_ms"],
             "latency_status":auth["latency_status"],"url":spec["auth_url"],
             "detail":"A página pública de entrada respondeu sem envio de credenciais. Login, MFA, perfil, sessão e autorização não foram testados."},
          "operational":{"status":"AVISO_PUBLICO_IDENTIFICADO" if matches else ("SEM_AVISO_IDENTIFICADO_NA_FONTE" if spec["id"] in ("contratos","compras","sicaf") else "FONTE_OFICIAL_INFORMATIVA_SEM_FEED_DE_AVISOS"),
             "source_url":spec["official_info"],"http_status":info["http_status"],
             "source_page_status":"ACESSIVEL" if info["status"]=="ACESSIVEL" else "NAO_ACESSIVEL",
             "notices":matches,"detail":"Para Compras, Contratos e SICAF, títulos de comunicados públicos são identificados por palavras-chave; o aviso pode ser histórico e sua vigência/impacto devem ser confirmados no comunicado. Para os demais sistemas, a referência oficial consultada não é um feed de incidentes. Ausência de aviso não prova ausência de manutenção."},
          "functional":{"status":"NAO_TESTADO_SEM_AUTENTICACAO",
             "detail":"Consultas, gravações, transações, integrações, módulos internos e desempenho após login não são testados. Exigem ambiente de homologação e autorização do órgão."}})
    duration=round((time.monotonic()-started)*1000)
    history=list(old.get("history",[]))
    counts={"accessible":sum(s["status"]=="ACESSIVEL" for s in systems),"instability":sum(s["status"]=="INSTABILIDADE" for s in systems),"not_verified":sum(s["status"]=="NAO_VERIFICADO" for s in systems),"critical":sum(s.get("condition",{}).get("status")=="CRITICO" for s in systems),"attention":sum(s.get("condition",{}).get("status")=="ATENCAO" for s in systems),"normal":sum(s.get("condition",{}).get("status")=="NORMAL" for s in systems)}
    history.append({"checked_at":now,"duration_ms":duration,**counts})
    scheduled=os.environ.get("GITHUB_EVENT_NAME")=="schedule"
    state={"environment":"TESTE","checked_at":now,"collector":"monitorar_sistemas.py","monitoring_version":"2.1",
      "scheduler_status":"EXECUCAO_AGENDADA_CONFIRMADA" if scheduled else "AGENDAMENTO_CONFIGURADO_AGUARDANDO_EXECUCAO_AGENDADA",
      "frequency_target_seconds":1800,"schedule_target":"A cada 30 minutos, de segunda a sexta-feira (cron UTC 09:00–22:30; aproximadamente 06:00–19:30 em Brasília)",
      "last_run_duration_ms":duration,
      "disclaimer":"Verifica DNS, TLS, HTTP, conteúdo básico, latência, páginas públicas de entrada e comunicados públicos. Não envia credenciais, não autentica e não executa transações. HTTP 200 ou tela de login acessível não comprovam funcionamento interno.",
      "notices_source":{"url":NOTICES_URL,"http_status":notices_result.get("http_status"),"status":notices_result.get("status")},
      "systems":systems,"history":history[-100:],"alerts":alerts[-100:],"classification_legend":{"NORMAL":"Indicadores públicos dentro dos limites definidos","ATENCAO":"Sinal que merece acompanhamento; pode ser transitório","CRITICO":"Falha externa relevante detectada; não comprova indisponibilidade interna"}}
    STATE.write_text(json.dumps(state,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"checked_at":now,"duration_ms":duration,"counts":counts,"scheduler_status":state["scheduler_status"],"systems":len(systems)},ensure_ascii=False))
if __name__=="__main__": main()
