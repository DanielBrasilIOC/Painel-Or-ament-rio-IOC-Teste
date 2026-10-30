# Agente de Consulta — Painel Financeiro e Orçamentário IOC (Teste)

## Separação dos ambientes
- Este repositório publica somente o agente e sua interface de teste.
- O agente consulta exclusivamente `DanielBrasilIOC/brasil` na branch `agente-teste`, arquivo `data.json`.
- Não consulta a branch `main` do repositório de produção e não altera dados nem código de produção.
- A base observada em 30/10/2026 contém oito conjuntos, 1.438 registros e atualização de origem em 28/10/2026. Esses números devem ser recalculados a cada atualização.

## Arquitetura e documentação do produto
A evolução segue seis documentos, em `docs/arquitetura/`:
1. `01-prd.md` — visão do produto, usuários, objetivos e critérios de aceite.
2. `02-trd.md` — arquitetura, fronteiras, requisitos técnicos, riscos e observabilidade.
3. `03-fluxos-usuario.md` — fluxos de consulta, ranking, registro, falhas, monitoramento e publicação.
4. `04-design-system.md` — tokens visuais, componentes, responsividade e acessibilidade.
5. `05-modelo-dados.md` — contrato JSON, inventário dos conjuntos e regras de integridade.
6. `06-plano-implementacao-e-testes.md` — fases, métricas e homologação.

## Motor de respostas
O motor principal está em `agent.js`. As respostas são calculadas diretamente dos registros carregados. O agente identifica bases, totais, contagens, rankings de ordens bancárias, última OB por data, pagamentos acima de limites, totais por favorecido, viagens por PCDP e consultas a campos de registros identificados.
- O ranking de viagens conta PCDPs distintos por favorecido, não linhas de pagamento.
- O ranking de ordens bancárias usa o valor numérico pago e apresenta OB, favorecido e data.
- Perguntas objetivas sobre pagamento a favorecido podem verificar o valor exato; consultas de total por favorecido somam os registros identificados.
- Quando não há identificador suficiente, o agente pede esclarecimento em vez de escolher um registro arbitrário.

## Auditoria automatizada
O workflow `.github/workflows/agente-qa.yml` executa:
- `tests/quality.test.cjs`: totais dos oito conjuntos, top 10 OBs, última OB, quem mais viajou, lista de viajantes, PCDPs, limites monetários, inventário, ambiguidade e consultas por identificador.
- `tests/human-questions.test.cjs`: perguntas em linguagem humana contra o próprio `agent.js` publicado, sem carregar camadas legadas.
- `tests/directoria.test.cjs`: perguntas de diretoria sobre pagamentos exatos e totais por favorecido.

A aprovação comprova apenas os cenários executados com a versão da base usada no teste; não garante matematicamente qualquer formulação futura. Perguntas reais novas devem ser incorporadas à bateria.

## Monitoramento
O monitoramento dos portais públicos é separado do agente financeiro. Verifica endpoints públicos de SIAFI, Contratos.gov.br, Compras.gov.br, SICAF, PNCP e Transferegov.br. Não testa login, transações nem módulos internos autenticados; HTTP 200 não comprova operação completa.
