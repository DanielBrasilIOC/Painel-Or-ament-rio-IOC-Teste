# TRD — Documento Técnico

**Versão:** 1.0 · **Data:** 30/10/2026 · **Ambiente:** TESTE

## 1. Arquitetura atual observada
- Front-end estático publicado por GitHub Pages no repositório `DanielBrasilIOC/Painel-Or-ament-rio-IOC-Teste`.
- Interface principal em `index.html`; consulta em `consulta.html`; motor determinístico em `agent.js`.
- Dados consumidos pelo agente em `https://raw.githubusercontent.com/DanielBrasilIOC/brasil/agente-teste/data.json`.
- Monitoramento público em `monitorar_sistemas.py`, estado persistido em `monitoramento-sistemas.json`, apresentação em `monitoramento-sistemas.js`.
- Automação por GitHub Actions; publicação e coleta são workflows distintos.
- Não há evidência de banco de dados transacional próprio: o contrato atual é JSON versionado com conjuntos e linhas.

## 2. Fronteiras de ambiente e segurança
- Repositório de interface/teste: `DanielBrasilIOC/Painel-Or-ament-rio-IOC-Teste`, branch `main`.
- Repositório de dados: `DanielBrasilIOC/brasil`, branch `agente-teste`, arquivo `data.json`.
- Proibido apontar o agente de teste para `brasil/main/data.json`.
- Segredos e credenciais não devem ser armazenados no front-end, JSON público ou logs.
- Monitoramento público sem autenticação; não realizar login, escrita ou transações.
- Toda alteração de código neste ciclo fica no repositório de teste.

## 3. Requisitos técnicos
- Validar JSON, esquema, tipos, campos obrigatórios e atualização da fonte antes de responder.
- Falha de carregamento deve ser apresentada como falha de dados, nunca como saldo zero.
- Cálculos monetários devem evitar erros binários de ponto flutuante em comparações de centavos; preferir centavos inteiros ou decimal controlado.
- Datas devem ser interpretadas com formatos explícitos e fuso documentado.
- Saídas do agente devem separar resultado, critério, período, fonte e limitações.
- Renderização deve escapar texto proveniente dos dados antes de inserir em HTML.
- Navegação por teclado, foco visível, contraste e responsividade devem ser testados.
- Monitoramento deve diferenciar HTTP 2xx/3xx, 4xx, 5xx e erro de conexão; falha de rede não prova indisponibilidade.

## 4. Observabilidade e recuperação
- Cada coleta registra timestamp UTC, duração, status, código HTTP, latência, detalhe e evento de workflow.
- Alertas de falha devem exigir evidência repetida e recuperação deve ser registrada.
- Manter histórico limitado com retenção definida e evitar alertas duplicados.
- Agendamento configurado não equivale a execução agendada comprovada.
- Backup/rollback precisa ser testado por cenário, não apenas descrito.

## 5. Riscos técnicos identificados na leitura inicial
1. Os testes `human-questions.test.cjs` e `directoria.test.cjs` referenciam `brasil/main/data.json`, enquanto o agente de teste usa `brasil/agente-teste/data.json`; isso pode fazer QA validar outra base.
2. O workflow `agente-qa.yml` executa apenas `tests/quality.test.cjs`; demais baterias existentes não estão integradas nele.
3. O arquivo `agent-fixes.js` existe no repositório, embora a auditoria principal afirme que o motor deve ser único; verificar se é código legado não carregado antes de removê-lo.
4. O monitoramento verifica endpoint público e página de referência; não interpreta automaticamente comunicados nem testa funções autenticadas.
5. A coleta agendada precisa de evento schedule observado para provar que a agenda efetivamente executou.

## 6. Critério de mudança
Toda alteração deve ter: hipótese, evidência, arquivo afetado, teste de regressão, resultado do workflow e conferência do ambiente publicado. Sem evidência, classificar como pendente.
