# Auditoria do Agente — Ambiente de Teste

Data: 29/10/2026

## Escopo

Auditoria funcional do agente de consultas do Painel Financeiro e Orçamentário IOC, exclusivamente no repositório de teste.

A base usada nos testes é o `data.json` publicado pelo dashboard. A produção não é alterada por este trabalho.

## Verificações automatizadas

- Integridade dos 8 conjuntos de dados.
- `detail_count` versus quantidade real de registros.
- Total declarado versus soma dos registros.
- Valores numéricos e ausência de valores negativos inesperados.
- Saldo Financeiro.
- Restos a Pagar.
- Empenhos 2026.
- Saldo Orçamentário.
- Aguardando Repasse Orçamentário.
- Ordens Bancárias Pagas.
- Publicações Pagas.
- Diárias Pagas.
- Total de Jerônimo: R$ 11.191,28.
- Total de Jerônimo por mês.
- Última OB paga.
- Última OB paga em período específico.
- Maior pagamento e ranking dos 5 maiores pagamentos.
- Filtro por valor acima de R$ 1.000.000,00.
- Filtro mensal e conferência simultânea de valor e quantidade de registros.
- Pergunta sem correspondência, garantindo que o agente não invente um valor.

## Melhorias aplicadas após a auditoria

1. Consultas com `ordens bancárias` no plural passaram a ser identificadas corretamente.
2. Perguntas do tipo `quanto foi pago em [mês]` passaram a selecionar a base de ordens bancárias.
3. Filtros por mês/ano passaram a funcionar também em consultas por favorecido.
4. A consulta da última OB passou a respeitar o período solicitado.
5. A identificação de favorecido ficou mais restritiva para evitar correspondências parciais indevidas.
6. O parser de valores foi ajustado para evitar interpretação incorreta de campos de data.
7. Valores com separador de milhares passaram a ser tratados corretamente em filtros por limite.
8. O parser passou a reconhecer consultas por ano completo.

## Resultado

**16 consultas funcionais + validação de integridade dos 8 datasets: PASSOU.**

O workflow do GitHub Pages deve executar `node --check agent.js` e `node tests/agent.test.cjs` antes da publicação do ambiente de teste.
