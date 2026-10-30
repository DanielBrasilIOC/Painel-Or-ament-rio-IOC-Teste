# Design System — IOC

**Versão:** 1.0 · **Data:** 30/10/2026 · **Ambiente:** TESTE

## 1. Direção visual
Institucional, sóbria, clara e orientada à leitura de dados. Priorizar hierarquia, legibilidade e consistência em vez de decoração. Não esconder informação importante em excesso de cores ou cartões.

## 2. Tokens observados na interface atual
- Azul principal: `#153B57`
- Azul secundário: `#2D6685`
- Verde petróleo: `#398780`
- Texto secundário: `#667B89`
- Fundo: `#F4F7FA`
- Bordas: `#E0E8EE`
- Erro: `#AD4545`
- Atenção: `#9A6B1D`
- Raio padrão: 14–16 px
- Tipografia: Inter com fallback Segoe UI, Roboto e system-ui.

## 3. Componentes
- Navegação lateral em desktop e navegação horizontal rolável em telas pequenas.
- Cartões KPI para indicadores essenciais; evitar duplicação do mesmo total em vários lugares.
- Painéis para análises relacionadas.
- Tabelas com cabeçalho fixo, rolagem horizontal e alinhamento numérico.
- Etiquetas de estado apenas quando comunicam condição real.
- Mensagens de vazio, erro e carregamento distintas.
- Botões com foco visível, estados hover e áreas de toque adequadas.

## 4. Responsividade
- Desktop: navegação lateral e conteúdo em largura fluida com limite máximo.
- Tablet: painéis em uma coluna quando duas colunas prejudicarem a leitura.
- Celular: navegação horizontal, KPIs em duas colunas quando legíveis, filtros empilhados, tabelas roláveis e ações com largura adequada.
- Nenhum conteúdo essencial pode depender de hover.

## 5. Acessibilidade
- Contraste de texto e controles suficiente.
- Ordem de tabulação lógica e foco visível.
- Botões com rótulos claros; ícones decorativos não substituem nomes.
- Tabelas com cabeçalhos semânticos.
- Mensagens de status anunciáveis e erros compreensíveis.
- Não usar apenas cor para indicar sucesso, alerta ou falha.

## 6. Critérios de aceite visual
Testar 360 px, 390 px, 768 px, 1024 px e desktop amplo. Conferir ausência de corte, sobreposição, scroll horizontal global, texto truncado crítico e navegação inacessível.
