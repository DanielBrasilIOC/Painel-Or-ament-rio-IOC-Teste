# Agente de Consulta — Painel Financeiro e Orçamentário IOC (Teste)

Este é um ambiente de teste separado do repositório de produção.

## Acesso e segurança
- A interface é publicada pelo GitHub Pages deste repositório, com origem configurada em Settings → Pages → GitHub Actions.
- O agente consulta, em modo somente leitura, o arquivo público `data.json` do repositório de produção `DanielBrasilIOC/brasil`.
- Este projeto não grava nem altera dados do painel de produção.
- Como a base consultada é pública, as respostas podem refletir a última versão publicada nela; a interface mostra a data de atualização disponível na fonte.
- O agente usa regras locais e cálculos determinísticos; não é um modelo de IA conversacional completo e pode não entender todas as formulações de perguntas.

## Consultas implementadas
- última OB paga, por data identificável;
- maior pagamento e lista dos maiores pagamentos (Top N até 10);
- registros acima de um limite monetário;
- total e quantidade de registros para saldo financeiro, restos a pagar, empenhos 2026, saldo orçamentário, aguardando repasse, ordens bancárias pagas, publicações pagas e diárias pagas;
- totais por mês quando os registros possuem uma data reconhecível.

## Publicação
O workflow `.github/workflows/pages.yml` publica este repositório independente no GitHub Pages quando há commit em `main` ou execução manual. Após alterar Settings → Pages, um novo commit ou uma execução manual é necessário para testar a publicação.

## Limitações conhecidas
- A interpretação de linguagem natural é baseada em correspondência de palavras e padrões, não em IA generativa.
- A consulta mensal depende de campos de data reconhecíveis e da expressão do mês no texto.
- Antes de usar respostas em decisões administrativas, confira o painel e a fonte indicada.
