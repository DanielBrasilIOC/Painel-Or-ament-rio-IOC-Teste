# Agente de Consulta — Painel Financeiro e Orçamentário IOC (Teste)

## Separação dos ambientes
- Este repositório publica somente o agente e sua interface de teste.
- O agente consulta exclusivamente `DanielBrasilIOC/brasil` na branch `agente-teste`, arquivo `data.json`.
- Não consulta a branch `main` do repositório de produção e não altera dados nem código de produção.
- A base de teste contém oito conjuntos de dados; fonte e data de atualização são exibidas nas respostas.

## Motor de respostas
O agente foi consolidado em um único motor, sem a cadeia de sobrescritas de funções e correções independentes. As respostas são calculadas diretamente dos registros carregados. O motor identifica bases, totais, contagens, rankings de ordens bancárias, última OB por data, pagamentos acima de limites, totais por favorecido, viagens por PCDP e consultas a campos de registros identificados.

O ranking de viagens conta PCDPs distintos por favorecido, não linhas de pagamento. O ranking de ordens bancárias usa o valor numérico pago e apresenta OB, favorecido e data. Quando não há identificador suficiente para consultar um campo, o agente pede o identificador em vez de escolher um registro arbitrário.

## Auditoria
O workflow valida a sintaxe e executa `tests/quality.test.cjs`. A bateria verifica os totais dos oito conjuntos, top 10 OBs, última OB, quem mais viajou, lista de viajantes, contagem de PCDPs, limite monetário, inventário de campos e comportamento para perguntas sem dados suficientes.

A aprovação comprova os cenários explicitamente testados, não garante matematicamente qualquer formulação futura. Perguntas reais novas devem ser incorporadas à bateria.
