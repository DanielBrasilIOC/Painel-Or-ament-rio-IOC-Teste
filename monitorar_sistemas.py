#!/usr/bin/env python3
"""Monitoramento conservador de endpoints públicos e páginas oficiais de aviso.
Não autentica nem executa transações nos sistemas monitorados.
"""
import json, os, time, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATE = ROOT / "monitoramento-sistemas.json"
TIMEOUT = 20
UA = "IOC-Test-Monitor/1.0 (+public-endpoint-check; no-auth)"
SYSTEMS = [
 {"id":"siafi","name":"SIAFI","url":"https://siafi.tesouro.gov.br/","scope":"Portal público; autenticação, consultas e operações internas não são testadas.","official_info":"https://www.gov.br/tesouronacional/pt-br/siafi/consultas-e-servicos/calendario-disponibilidade-siafi"},
 {"id":"contratos","name":"Contratos.gov.br","url":"https://contratos.comprasnet.gov.br/login","scope":"Página pública de entrada; módulos autenticados e transações não são testados.","official_info":"https://www.gov.br/compras/pt-br/acesso-a-informacao/comunicados"},
 {"id":"compras","name":"Compras.gov.br","url":"https://www.gov.br/compras/pt-br","scope":"Portal público; login, sessão de disputa e operações internas não são testados.","official_info":"https://www.gov.br/compras/pt-br/acesso-a-informacao/comunicados"},
 {"id":"sicaf","name":"SICAF","url":"https://www.gov.br/compras/pt-br/sistemas/conheca-o-compras/sicaf-digital","scope":"Página pública informativa; acesso autenticado e funcionalidades internas do SICAF não são testados.","official_info":"https://www.gov.br/compras/pt-br/acesso-a-informacao/comunicados"},
 {"id":"pncp","name":"PNCP","url":"https://pncp.gov.br/app/area-de-trabalho","scope":"Portal público; APIs, autenticação e operações de publicação não são testadas.","official_info":"https://www.gov.br/pncp/pt-br/central-de-conteudo/comunicados/comunicados"},
 {"id":"transferegov","name":"Transferegov.br","url":"https://portal.transferegov.sistema.gov.br/","scope":"Portal público; autenticação e operações internas não são testadas.","official_info":"https://www.gov.br/transferegov/pt-br"},
]

def probe(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept":"text/html,application/xhtml+xml,*/*"})
    start=time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            code=res.status
            final=res.geturl()
        ms=round((time.monotonic()-start)*1000)
        status = "ACESSIVEL" if 200 <= code < 400 else ("INSTABILIDADE" if code >= 500 else "NAO_VERIFICADO")
        detail = "Endpoint público respondeu; isso não comprova autenticação nem funcionamento de módulos internos." if status == "ACESSIVEL" else ("Servidor retornou erro HTTP 5xx." if status == "INSTABILIDADE" else "Endpoint respondeu com HTTP não conclusivo; não classificado como indisponibilidade.")
        return {"http_status":code,"latency_ms":ms,"final_url":final,"status":status,"detail":detail}
    except urllib.error.HTTPError as e:
        ms=round((time.monotonic()-start)*1000)
        status = "INSTABILIDADE" if e.code >= 500 else "NAO_VERIFICADO"
        detail = "Servidor retornou erro HTTP 5xx." if status == "INSTABILIDADE" else f"Endpoint respondeu com HTTP {e.code}; não classificado como indisponibilidade."
        return {"http_status":e.code,"latency_ms":ms,"final_url":e.geturl(),"status":status,"detail":detail}
    except Exception as e:
        ms=round((time.monotonic()-start)*1000)
        return {"http_status":None,"latency_ms":ms,"final_url":None,"status":"NAO_VERIFICADO","detail":f"Falha ao confirmar a conexão pública ({type(e).__name__}); pode ser bloqueio de rede ou falha transitória, não prova indisponibilidade do sistema."}

def main():
    old={}
    if STATE.exists():
        try: old=json.loads(STATE.read_text(encoding="utf-8"))
        except Exception: old={}
    old_by_id={s.get("id"):s for s in old.get("systems",[])}
    started=time.monotonic()
    now=datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00","Z")
    systems=[]; alerts=list(old.get("alerts",[]))
    for spec in SYSTEMS:
        result=probe(spec["url"])
        info=probe(spec["official_info"])
        prev=old_by_id.get(spec["id"],{})
        streak=(int(prev.get("failure_streak",0))+1) if result["status"]=="INSTABILIDADE" else (0 if result["status"]=="ACESSIVEL" else int(prev.get("failure_streak",0)))
        alert_state="SEM_ALERTA"
        if result["status"]=="INSTABILIDADE" and streak>=2 and prev.get("alert_state")!="FALHA_ALERTADA":
            alerts.append({"created_at":now,"system":spec["name"],"type":"FALHA_CONSECUTIVA","message":f"{spec['name']}: duas ou mais falhas consecutivas no endpoint público."})
            alert_state="FALHA_ALERTADA"
        elif result["status"]=="ACESSIVEL" and prev.get("alert_state")=="FALHA_ALERTADA":
            alerts.append({"created_at":now,"system":spec["name"],"type":"RECUPERACAO","message":f"{spec['name']}: endpoint público voltou a responder."})
        elif result["status"]=="INSTABILIDADE" and streak>=2: alert_state="FALHA_ALERTADA"
        elif result["status"]=="NAO_VERIFICADO": alert_state=prev.get("alert_state","SEM_ALERTA")
        else: alert_state="SEM_ALERTA"
        systems.append({**spec,**result,"checked_at":now,"failure_streak":streak,"alert_state":alert_state,
          "operational":{"status":"NAO_VERIFICADO_AUTOMATICAMENTE","source_url":spec["official_info"],"http_status":info["http_status"],"source_page_status":"ACESSIVEL" if info["status"]=="ACESSIVEL" else "INDISPONIVEL","detail":"A página oficial de referência foi testada quanto ao acesso. O conteúdo dos avisos não é interpretado automaticamente; ausência de aviso não significa ausência de manutenção. Operação autenticada não é testada."}})
    duration=round((time.monotonic()-started)*1000)
    history=list(old.get("history",[]))
    counts={"accessible":sum(s["status"]=="ACESSIVEL" for s in systems),"instability":sum(s["status"]=="INSTABILIDADE" for s in systems),"not_verified":sum(s["status"]=="NAO_VERIFICADO" for s in systems)}
    history.append({"checked_at":now,"duration_ms":duration,**counts})
    event=os.environ.get("GITHUB_EVENT_NAME","workflow_dispatch")
    scheduled=event=="schedule"
    state={"environment":"TESTE","checked_at":now,"collector":"monitorar_sistemas.py",
      "scheduler_status":"EXECUCAO_AGENDADA_CONFIRMADA" if scheduled else "AGENDAMENTO_CONFIGURADO_AGUARDANDO_EXECUCAO_AGENDADA",
      "frequency_target_seconds":1800,"schedule_target":"A cada 30 minutos, de segunda a sexta-feira (horário UTC configurado no GitHub Actions)",
      "last_run_duration_ms":duration,"disclaimer":"Somente endpoints públicos e acesso às páginas oficiais de referência são verificados. Não testa login, transações ou módulos internos. Conteúdo de comunicados não é classificado automaticamente.",
      "systems":systems,"history":history[-100:],"alerts":alerts[-100:]}
    STATE.write_text(json.dumps(state,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"checked_at":now,"duration_ms":duration,"counts":counts,"scheduler_status":state["scheduler_status"]},ensure_ascii=False))
if __name__=="__main__": main()
