# PRD — Painel Financeiro e Orçamentário IOC (ambiente de teste)

**Versão:** 1.0 · **Data:** 30/10/2026 · **Status:** baseline para evolução  
**Escopo:** exclusivamente o repositório de teste. O repositório de produção não integra este ciclo de mudanças.

## 1. Visão do produto
Oferecer à gestão do IOC uma visão confiável, compreensível e rastreável da execução financeira e orçamentária, com consulta em linguagem natural que responda perguntas da diretoria a partir dos registros efetivamente carregados.

## 2. Usuários e necessidades
- **Direção e gestores:** respostas rápidas, sínteses, rankings, comparações e explicação do critério.
- **Equipe administrativa/financeira:** consulta detalhada, filtros, identificação de registros e conferência dos totais.
- **Responsável pela manutenção:** atualização previsível, auditoria, diagnóstico e recuperação.

## 3. Objetivos mensuráveis
1. Respostas numéricas reproduzíveis diretamente dos dados carregados.
2. Toda resposta factual deve indicar conjunto consultado, fonte e data de atualização quando disponíveis.
3. Perguntas ambíguas ou sem dados suficientes devem gerar esclarecimento, nunca suposição.
4. Rankings devem usar ordenação numérica e critérios explícitos.
5. Interface utilizável em celular e desktop, com navegação acessível.
6. Atualizações e monitoramento devem registrar evidências e distinguir execução automática de execução manual.

## 4. Funcionalidades
- Visão executiva e abas de detalhe para os oito conjuntos publicados.
- Agente conversacional para totais, contagens, rankings, últimas movimentações, períodos, favorecidos, PCDPs e consultas por identificador/campo.
- Exibição de fonte e data de atualização.
- Monitoramento técnico dos seis portais públicos definidos no projeto, com ressalva explícita de que endpoint público não comprova operação autenticada.
- Histórico, alertas e registro de execução do monitoramento.
- Testes automatizados de regressão, perguntas humanas e cenários de diretoria.

## 5. Fora de escopo / limites
- Não autenticar em sistemas governamentais nem executar transações.
- Não inventar dados, nomes, datas, fontes ou links.
- Não alterar planilhas de origem ou o repositório de produção.
- Não afirmar que o monitoramento comprova módulos internos.
- Não tratar a aprovação de uma bateria finita como garantia matemática de 100% para qualquer pergunta futura.

## 6. Regras de negócio essenciais
- A fonte de verdade do agente é o arquivo `data.json` da branch `agente-teste` do repositório de dados; o agente não pode consultar a branch `main` de produção.
- Contar viagens por PCDPs distintos por favorecido, e não por linhas de pagamento.
- OB repetida deve ser tratada conforme a chave de negócio validada; não deduplicar apenas pelo número se a fonte pagadora também for necessária.
- Valores brasileiros devem ser interpretados com precisão decimal e apresentados em BRL.
- Não converter campo ausente em zero.
- Toda agregação entre conjuntos exige critério explícito e controle contra dupla contagem.

## 7. Critérios de aceite
- Oito conjuntos carregados com contagem e totais conciliados com a fonte.
- Cenários críticos: top 10 OBs, última OB, líder e lista de viajantes, total PCDP, consultas por favorecido, filtros por período, campos ausentes e identificadores ambíguos.
- Testes do agente usam exclusivamente a base de teste.
- Deploy só é considerado concluído após workflow bem-sucedido; validação visual real é etapa separada.
