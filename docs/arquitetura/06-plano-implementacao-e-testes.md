# Plano de implementação, validação e testes

**Versão:** 1.0 · **Data:** 30/10/2026 · **Ambiente:** TESTE

## Princípio de execução
Trabalhar em ciclos pequenos, com evidência antes/depois, testes de regressão e read-back do que foi publicado. Não prometer cobertura absoluta: medir cobertura por intenção, conjunto, campo, filtro e tipo de pergunta.

## Fase 0 — Baseline e segurança
- [x] Confirmar repositório de teste e URL publicada.
- [x] Confirmar que o agente consulta `brasil/agente-teste/data.json`.
- [x] Inventariar oito conjuntos, 1.438 registros e campos observados.
- [x] Registrar os seis documentos de arquitetura.
- [ ] Garantir que toda a bateria de QA usa exclusivamente a base de teste.
- [ ] Inventariar workflows e confirmar publicação separada da coleta.
- [ ] Registrar estado inicial e evidências de regressão.

## Fase 1 — Integridade e contrato de dados
- Validar esquema JSON, tipos, totais, campos e datas.
- Criar reconciliação automática por conjunto, campo monetário e contagem.
- Testar duplicidades com chaves compostas e relações entre conjuntos.
- Gerar relatório de divergências sem alterar fonte automaticamente.

## Fase 2 — Motor de linguagem natural
- Catalogar intenções: totais, contagens, ranking, última movimentação, por pessoa/fornecedor, período, comparação, campo/identificador e perguntas sem resposta.
- Separar interpretação da pergunta, plano de consulta, execução e formatação.
- Criar testes com paráfrases humanas, erros de digitação leves, abreviações e contexto.
- Cobrir perguntas de acompanhamento e ambiguidade.
- Remover dependência de camadas legadas somente após provar que não são carregadas e não são necessárias.

## Fase 3 — Respostas e experiência da diretoria
- Padronizar resposta executiva: conclusão direta, valor/quantidade, critério, período, fonte e atualização.
- Oferecer detalhamento sob demanda sem despejar linhas desnecessárias.
- Testar legibilidade, precisão de centavos e explicação de limites.

## Fase 4 — Interface e acessibilidade
- Auditar todas as abas e estados (carregando, vazio, erro, sucesso).
- Testar tamanhos de tela e navegação por teclado.
- Melhorar consistência de filtros, tabelas, rótulos, datas e atualização.
- Não introduzir informação repetida nem remover funções sem teste.

## Fase 5 — Monitoramento e operações
- Validar agenda por eventos reais `schedule`, duração, persistência e histórico.
- Testar falha, falha consecutiva, alerta, recuperação e ausência de falso positivo.
- Documentar que monitoramento público não confirma operação autenticada.
- Testar retenção, concorrência de workflows e restauração de backup.

## Fase 6 — Homologação
- Executar baterias unitária, integração, humana, diretoria, segurança, acessibilidade e regressão.
- Conferir totais e amostras com a fonte de teste.
- Conferir deploy e abrir a URL de teste em celular e desktop.
- Publicar relatório com aprovados, reprovados, não testados e limitações.
- Produção permanece fora de escopo até autorização explícita e plano separado.

## Métricas de qualidade
- Precisão numérica: 100% nos casos determinísticos com gabarito.
- Cobertura de intenções: percentual de cenários aprovados por categoria.
- Respostas sem suporte: zero nos testes negativos.
- Fonte/data presentes: 100% nas respostas factuais quando metadados existem.
- Regressões: zero nos cenários previamente aprovados.
- Testes visuais: todos os breakpoints-alvo sem defeitos críticos.
