from pathlib import Path
import re

path = Path('index.html')
html = path.read_text(encoding='utf-8')

item = '<a class="nav-monitoramento" href="./monitoramento.html" aria-label="Monitoramento de Sistemas">Monitoramento de Sistemas</a>'

if 'href="./monitoramento.html"' not in html:
    patterns = [
        r'(<nav[^>]*class=["\'][^"\']*nav[^"\']*["\'][^>]*>)(.*?)(</nav>)',
        r'(<div[^>]*class=["\'][^"\']*nav[^"\']*["\'][^>]*>)(.*?)(</div>)',
    ]
    for pattern in patterns:
        m = re.search(pattern, html, flags=re.I | re.S)
        if m:
            block = m.group(2)
            if 'nav-monitoramento' not in block:
                html = html[:m.start(2)] + block + item + html[m.end(2):]
            break

css = '''<style id="monitoramento-nav-style">.nav-monitoramento{display:flex;align-items:center;gap:9px;min-height:42px;padding:11px 12px;border:1px solid transparent;border-radius:11px;color:#d8e5ed;text-decoration:none;font-size:12px;font-weight:600}.nav-monitoramento:hover{background:#ffffff12;border-color:#ffffff10;transform:translateX(2px);color:#fff}.nav-monitoramento::before{content:"◉";font-size:10px;color:#8ed0c5}@media(max-width:700px){.nav-monitoramento{white-space:nowrap}}</style>'''
if 'id="monitoramento-nav-style"' not in html:
    html = html.replace('</head>', css + '</head>', 1)

path.write_text(html, encoding='utf-8')

# Integração exclusiva do ambiente de TESTE; produção não é alterada.
