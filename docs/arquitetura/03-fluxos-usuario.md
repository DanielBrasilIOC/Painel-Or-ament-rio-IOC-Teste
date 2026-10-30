# Fluxos do produto e do usuário

**Versão:** 1.0 · **Data:** 30/10/2026 · **Ambiente:** TESTE

## 1. Fluxo principal — consulta da diretoria
1. Usuário abre o painel e escolhe “Agente de consulta”.
2. Interface informa que está carregando a base e identifica a data real da fonte.
3. Usuário pergunta em linguagem natural.
4. Motor identifica intenção, conjunto, período, entidade e métrica.
5. Motor valida se os dados necessários existem e se a pergunta é inequívoca.
6. Calcula diretamente sobre os registros carregados.
7. Resposta apresenta resultado em destaque textual, critério, quantidade de registros, fonte e atualização.
8. Se faltarem dados ou houver múltiplas correspondências, solicita o identificador ou esclarecimento necessário.

## 2. Fluxo de ranking
1. Identificar entidade e métrica (ex.: OB por valor pago; viajante por PCDPs distintos).
2. Aplicar filtros temporais e de conjunto.
3. Ordenar numericamente, com desempate documentado.
4. Informar universo analisado e quantidade retornada.
5. Permitir que o usuário solicite mais resultados sem mudar o critério.

## 3. Fluxo de consulta por registro
1. Detectar identificador (OB, empenho, processo, PCDP ou outro campo-chave).
2. Pesquisar apenas no conjunto compatível.
3. Se houver uma correspondência, devolver os campos disponíveis.
4. Se houver mais de uma, listar chaves discriminadoras ou pedir refinamento.
5. Se não houver, dizer que não foi encontrado; não fabricar valor.

## 4. Fluxo de falha
- Base indisponível: mensagem explícita de indisponibilidade; não responder com dados vazios ou zerados.
- Campo inexistente: informar que o campo não está na base.
- Nenhuma correspondência: informar que o registro não foi encontrado.
- Período sem data adequada: explicar por que não foi possível filtrar.
- Pergunta ambígua: fazer uma única pergunta objetiva para desambiguar.

## 5. Fluxo de monitoramento
1. Coletor verifica os endpoints públicos definidos.
2. Cada sistema recebe classificação técnica e detalhe.
3. Página oficial de referência é consultada separadamente.
4. Estado, histórico e alertas são persistidos.
5. Painel apresenta última coleta, duração e situação do agendamento.
6. Usuário pode atualizar a leitura persistida; isso não dispara uma nova coleta.
7. Operação autenticada permanece “não verificada automaticamente”.

## 6. Fluxo de publicação
1. Alterações são realizadas somente no repositório de teste.
2. Testes automatizados são executados.
3. Workflow de publicação conclui.
4. URL de teste é aberta em desktop e celular.
5. Conferem-se as funções alteradas e a origem dos dados.
6. Só então a mudança é marcada como validada; produção exige autorização separada.
