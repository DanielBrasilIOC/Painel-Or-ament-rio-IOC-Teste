# Agente de Consulta — Painel Financeiro e Orçamentário IOC (Teste)

## Separação e segurança
- Repositório independente: `DanielBrasilIOC/Painel-Or-ament-rio-IOC-Teste`.
- A interface consulta em modo somente leitura o `data.json` público de `DanielBrasilIOC/brasil`.
- Nenhuma alteração é feita no repositório ou no dashboard de produção.
- A fonte de dados e a data de atualização são mostradas nas respostas.

## Interface
- Campo de pergunta livre, sem botões de perguntas predefinidas.
- Botão **Consultar** e botão **Limpar pergunta**, que limpa o campo e a resposta anterior.
- Respostas acessíveis por teclado e em telas pequenas.
- Erros de conexão são diferenciados de informações que não existem na base.

## Consultas e limites
O agente interpreta perguntas por regras determinísticas, calcula totais e contagens a partir dos registros, aplica filtros por mês/ano e limites monetários, localiza registros e identifica registros mais recentes quando há data válida. Perguntas ambíguas ou fora das regras são sinalizadas sem inventar valores. Quando uma informação não consta nos campos disponíveis, o agente deve dizê-lo explicitamente.

Nenhum conjunto finito de regras garante a interpretação de toda formulação possível. A bateria de testes cobre casos críticos e deve ser ampliada sempre que forem detectadas perguntas novas. A fonte continua sendo a base pública de produção, consultada somente para leitura; a interface e as regras ficam neste repositório de teste.

## Publicação e testes
O workflow `.github/workflows/pages.yml` valida sintaxe, integridade dos dados e testes funcionais antes de publicar o ambiente de teste no GitHub Pages.
