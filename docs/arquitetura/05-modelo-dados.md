# Modelo de dados e contrato JSON

**Versão:** 1.0 · **Data:** 30/10/2026 · **Ambiente:** TESTE

## 1. Fonte de verdade
Arquivo `data.json` em `DanielBrasilIOC/brasil`, branch `agente-teste`. O objeto contém metadados da atualização e uma lista `datasets`. Cada conjunto contém `id`, `title`, `source_name`, `total` e `rows`.

## 2. Inventário da base de teste observada em 30/10/2026
| ID | Conjunto | Registros | Campos |
|---|---|---:|---|
| financeiro | Saldo Financeiro | 17 | uge, unidade, fonte, vinculo, saldo |
| restos | Restos a Pagar | 23 | empenho, cnpj, fornecedor, pi, programa, autor_emenda, natureza_codigo, natureza, saldo |
| empenhos | Empenhos 2026 | 231 | empenho, ne_ccor, subitem, natureza, cnpj, fornecedor, observacao, fonte_recursos_detalhada, saldo |
| orcamentario | Saldo Orçamentário | 23 | ug, unidade, ptres, fonte, descricao_fonte, natureza_codigo, natureza, ug_responsavel, responsavel, pi, programa, saldo |
| repasses | Aguardando Repasse Orçamentário | 63 | processo, licitacao, fornecedor, sub_grupo, elemento_despesa, elemento, sub_grupo_despesa, vigencia, situacao_prioridade, solicitacao_ne, numero_ne, status_empenho, fornecedores, saldo |
| ordens_bancarias | Ordens Bancárias Pagas | 807 | ob, data, data_pagamento, processo, cnpj, favorecido, observacao, valor |
| publicacoes_pagas | Publicações Pagas | 86 | data, ob, cnpj, favorecido, processo, valor, observacao |
| diarias_pagas | Diárias Pagas | 188 | favorecido, data_pagamento, classificacao_orcamentaria, valor, documento, observacao |

**Total observado:** 8 conjuntos e 1.438 linhas. **Data de atualização da fonte:** 2026-10-28.

## 3. Regras de tipos e interpretação
- Valores monetários devem ser numéricos ou convertidos com parser brasileiro validado; preservar centavos.
- Datas podem estar em DD/MM/AAAA; campos de data devem ser explicitamente mapeados por conjunto.
- Identificadores como OB, empenho, CNPJ e processo devem ser tratados como texto para preservar zeros e formatação.
- Campos vazios permanecem vazios/nulos; nunca inferir zero.
- A estrutura é um conjunto de dados JSON, não um banco relacional; não assumir chaves estrangeiras sem validar.

## 4. Chaves e relacionamentos candidatos
- OB: `ob`; relaciona-se com publicações quando o número de OB corresponder, mas a regra deve ser validada por registro.
- Diárias: PCDP extraído de `observacao` + favorecido identifica viagem única para contagem do projeto.
- Empenho: número do empenho; validar duplicidade e contexto antes de usar como chave.
- Favorecido/fornecedor: nome textual não é chave estável; usar CNPJ quando disponível e adequado.
- Processo: texto de processo; não presumir unicidade.

## 5. Validações obrigatórias antes de cálculos
- Confirmar que cada conjunto existe e tem `rows` como array.
- Comparar `total` com a soma das linhas, se o campo representar total financeiro, e distinguir esse campo de contagem.
- Detectar campos obrigatórios ausentes, linhas malformadas e valores não numéricos.
- Verificar atualização real e não confundir data do arquivo com data da coleta.
- Conferir duplicidades segundo chave composta de negócio.
- Não misturar saldo, valor pago e valor empenhado como se fossem a mesma métrica.
