# Auditoria do Agente — Ambiente de Teste

Data: 29/10/2026

## Escopo

Auditoria funcional do agente de consultas do Painel Financeiro e Orçamentário IOC, exclusivamente no repositório de teste `DanielBrasilIOC/Painel-Or-ament-rio-IOC-Teste`. A produção não foi alterada. A base consultada é o `data.json` público do repositório `DanielBrasilIOC/brasil`, em modo somente leitura.

## Alterações implementadas

- Removidos os botões com perguntas predefinidas; o usuário digita livremente a pergunta.
- Adicionado botão **Limpar pergunta**, que limpa o campo e apaga/oculta a resposta anterior.
- Adicionado tratamento distinto para falha de conexão, pergunta sem correspondência e campo que não existe na base.
- Preservada a vírgula decimal em valores monetários, para não confundir `R$ 200.000,01` com `R$ 200.000,00`.
- Adicionada consulta por identificador de OB para recuperar o processo associado.
- Evitado retornar o total geral da base quando a pergunta é sobre um favorecido que não foi localizado.
- Melhorada a identificação de favorecidos em perguntas de confirmação de pagamento.
- Mantidas as respostas com fonte e data da base sempre que aplicável.

## Testes executados

O workflow de diagnóstico executou com sucesso os seguintes testes no commit `9efa81948ab81a86ba7c1674df23e37b99c1245e`:

- `node --check agent.js`: aprovado.
- `node tests/agent.test.cjs`: aprovado; 16 consultas de referência e verificação de integridade dos 8 conjuntos de dados, além de verificações de campo ausente, ausência de perguntas predefinidas, botão limpar e consulta por processo via OB.
- `node tests/directoria.test.cjs`: aprovado; 5 consultas de linguagem natural com foco em pagamentos da Fiotec e validação de valores exatos com separador decimal brasileiro.

O workflow de publicação do GitHub Pages está sendo acompanhado separadamente; a aprovação dos testes de código não é, por si só, prova de que a interface já foi carregada no navegador. O agente continua baseado em regras determinísticas, então perguntas formuladas de maneiras não cobertas podem pedir reformulação em vez de adivinhar uma resposta.


## Ampliação da cobertura de dados — 29/10/2026

- O agente informa na própria interface a cobertura carregada: quantidade de conjuntos, registros detalhados e campos distintos.
- Na versão consultada em 29/10/2026, o `data.json` usado pelo dashboard contém **8 conjuntos, 1.469 linhas detalhadas e 42 nomes de campos distintos**. A distribuição atual é: Saldo Financeiro (17), Restos a Pagar (23), Empenhos 2026 (225), Saldo Orçamentário (23), Aguardando Repasse Orçamentário (94), Ordens Bancárias Pagas (812), Publicações Pagas (86) e Diárias Pagas (189).
- Foi adicionada uma busca cruzada nos registros e campos carregados para perguntas que não sejam resolvidas pelas regras específicas existentes; os resultados mostram os campos encontrados e a fonte.
- Isso **não comprova que todos os campos das planilhas originais estejam no `data.json`**. O agente só pode conhecer os campos publicados nesse arquivo. A conferência integral de cada CSV/planilha original contra os campos exportados ainda precisa ser feita; por isso, não se deve afirmar que ele conhece dados omitidos na exportação.
- O agente continua determinístico e não pode garantir a interpretação de toda formulação possível. A resposta deve indicar quando não houver correspondência, sem inventar valores.

## Limites e controle de qualidade

- A base pública contém somente os campos existentes no `data.json`; o agente não deve inventar campos ou fatos externos.
- Se a informação não existir no esquema, a resposta informa que ela não consta no banco de dados disponível.
- Se a consulta falhar por indisponibilidade da base, o agente informa a falha e não conclui que a informação inexiste.
- Novas formulações identificadas durante o uso devem ser transformadas em testes de regressão antes de ampliar as regras de interpretação.
