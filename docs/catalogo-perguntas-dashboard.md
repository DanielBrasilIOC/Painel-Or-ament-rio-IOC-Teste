# Catálogo de perguntas para o Agente de Consulta do Painel Financeiro e Orçamentário IOC

**Finalidade:** matriz funcional de perguntas reais para testar o agente. As respostas devem ser calculadas a partir dos registros carregados; não se deve inventar dados, confundir ausência de informação com resultado zero ou misturar conjuntos de dados.

## 1. Visão executiva e panorama geral
1. Qual é a situação financeira atual do IOC?
2. Qual é o saldo financeiro total?
3. Qual é o saldo orçamentário disponível?
4. Quanto temos em restos a pagar?
5. Quanto temos em empenhos de 2026?
6. Quanto está aguardando repasse orçamentário?
7. Quanto foi pago em ordens bancárias?
8. Qual é o total de publicações pagas?
9. Qual é o total de diárias pagas?
10. Quantos registros existem em cada aba?
11. Qual é a data de atualização da base?
12. Quais são as fontes de dados utilizadas?
13. Quais conjuntos de dados estão disponíveis?
14. Quais campos existem em cada conjunto de dados?
15. Quais informações o painel não possui?

## 2. Saldo Financeiro
16. Qual é o saldo financeiro total?
17. Quantos registros compõem o saldo financeiro?
18. Qual é o saldo por fonte?
19. Qual é o saldo por vinculação de pagamento?
20. Qual é o saldo por UGE?
21. Qual é o saldo por unidade?
22. Qual fonte possui o maior saldo?
23. Qual fonte possui saldo zero?
24. Quais vinculações possuem saldo positivo?
25. Qual é o saldo da fonte [código da fonte]?
26. Qual é o saldo da vinculação [código]?
27. Qual é o saldo da UGE [código]?
28. Liste os registros de saldo financeiro da fonte [código].
29. Existem registros com saldo negativo?
30. A soma dos registros confere com o saldo financeiro total?

## 3. Restos a Pagar
31. Qual é o total de restos a pagar?
32. Quantos empenhos aparecem em restos a pagar?
33. Qual é o saldo do empenho [número da NE]?
34. Qual fornecedor está vinculado ao empenho [número]?
35. Qual é o CNPJ do fornecedor do empenho [número]?
36. Qual é a natureza de despesa do empenho [número]?
37. Qual é o código da natureza do empenho [número]?
38. Quais empenhos estão vinculados ao fornecedor [nome]?
39. Qual fornecedor concentra o maior saldo em restos a pagar?
40. Quais são os maiores saldos de restos a pagar?
41. Quais empenhos têm saldo de [valor]?
42. Existe o empenho [número] em restos a pagar?
43. Qual é o saldo total por fornecedor?
44. Qual é o saldo total por natureza de despesa?
45. Quais campos estão vazios para o empenho [número]?

## 4. Empenhos 2026
46. Qual é o saldo total dos empenhos de 2026?
47. Quantos registros de empenho existem?
48. Qual é o saldo do empenho [número da NE]?
49. Qual fornecedor está associado ao empenho [número]?
50. Qual é o CNPJ associado ao empenho [número]?
51. Qual é a observação do empenho [número]?
52. Qual é o subitem do empenho [número]?
53. Qual é a natureza do empenho [número]?
54. Qual é a fonte de recursos detalhada do empenho [número]?
55. Qual é a NE/CCOR do empenho [número]?
56. Quais empenhos pertencem ao fornecedor [nome]?
57. Qual fornecedor possui o maior saldo empenhado?
58. Quais são os dez maiores saldos de empenhos?
59. Quais empenhos têm saldo inferior a R$ [valor]?
60. Quais empenhos têm saldo superior a R$ [valor]?
61. Existem empenhos com saldo zero?
62. Existem empenhos com o mesmo número de NE em mais de um registro?
63. Qual é a soma dos saldos do fornecedor [nome]?
64. O empenho [número] possui observação preenchida?
65. O campo [nome do campo] está preenchido para o empenho [número]?

## 5. Saldo Orçamentário
66. Qual é o saldo orçamentário total?
67. Quantos registros existem no saldo orçamentário?
68. Qual é o saldo por fonte de recursos?
69. Qual é o saldo por natureza de despesa?
70. Qual é o saldo por elemento de despesa?
71. Qual é o saldo por subgrupo de despesa?
72. Qual é a classificação orçamentária do registro [identificador]?
73. Qual é a UG responsável pelo registro [identificador]?
74. Qual é o saldo da fonte [código]?
75. Quais fontes têm saldo zero?
76. Quais são os maiores saldos orçamentários?
77. A soma dos registros corresponde ao total informado?

## 6. Aguardando Repasse Orçamentário
78. Qual é o total aguardando repasse?
79. Quantas solicitações aguardam repasse?
80. Qual é o número da solicitação [número]?
81. Qual é o valor da solicitação [número]?
82. Qual é a situação da solicitação [número]?
83. Qual é a prioridade da solicitação [número]?
84. Qual é a UG responsável pela solicitação [número]?
85. Quais solicitações estão com prioridade alta?
86. Quantas solicitações estão em prioridade média?
87. Qual é o valor total por situação/prioridade?
88. Qual é o status da solicitação [número]?
89. Existe a solicitação [número] na base?
90. Quais solicitações não têm situação informada?

## 7. Ordens Bancárias e pagamentos
91. Qual foi a última OB paga?
92. Qual foi a última OB paga em [mês/ano]?
93. Qual foi a última OB paga para [favorecido]?
94. Qual é o número da OB [identificador]?
95. Qual é a data de pagamento da OB [número]?
96. Qual é o valor da OB [número]?
97. Quem foi o favorecido da OB [número]?
98. Qual é o processo vinculado à OB [número]?
99. Qual é a fonte vinculada à OB [número], se houver esse campo?
100. Qual foi o maior pagamento?
101. Quais foram os cinco maiores pagamentos?
102. Quais foram os dez maiores pagamentos em [mês/ano]?
103. Quais pagamentos superaram R$ [valor]?
104. Quantas OBs foram pagas em [mês/ano]?
105. Qual foi o total pago em [mês/ano]?
106. Qual foi o total pago ao favorecido [nome]?
107. Quanto foi pago ao favorecido [nome] em [mês/ano]?
108. Houve pagamento de R$ [valor] para [favorecido]?
109. Quais OBs estão vinculadas ao processo [número]?
110. Quais pagamentos foram feitos ao fornecedor [nome]?
111. Existe a OB [número] na base?
112. Qual é a data e o valor da OB [número]?
113. Liste os pagamentos de [favorecido] por data.
114. Qual foi o menor pagamento?
115. Qual é o total e a quantidade de pagamentos acima de R$ [valor]?

## 8. Publicações pagas
116. Qual é o total de publicações pagas?
117. Quantos registros de publicações pagas existem?
118. Qual foi a última publicação paga?
119. Qual é a data de pagamento da publicação [identificador]?
120. Qual foi o valor pago pela publicação [identificador]?
121. Qual favorecido recebeu o pagamento da publicação [identificador]?
122. Quanto foi pago em publicações para [favorecido]?
123. Quais publicações foram pagas em [mês/ano]?
124. Qual foi o total de publicações pagas em [mês/ano]?
125. Quais são as publicações de maior valor?
126. Existe publicação vinculada à OB [número]?

## 9. Diárias pagas
127. Qual é o total de diárias pagas?
128. Quantos registros de diárias pagas existem?
129. Quanto recebeu [favorecido] em diárias?
130. Quanto recebeu [favorecido] em diárias em [mês/ano]?
131. Qual é a data e o valor do pagamento de diárias de [favorecido]?
132. Quais diárias foram pagas em [mês/ano]?
133. Qual foi o total de diárias pagas em [mês/ano]?
134. Quem recebeu o maior valor em diárias?
135. Quais foram os maiores pagamentos de diárias?
136. Existe registro de diária para [favorecido]?
137. Quantos pagamentos de diárias foram feitos a [favorecido]?
138. Qual é o valor médio por registro de diária, se os registros permitirem esse cálculo?

## 10. Consultas por campo e identificador
Para **cada campo presente em cada conjunto de dados**, devem funcionar variações como:
- Qual é o [campo] do registro [identificador]?
- Informe o [campo] referente ao empenho [número].
- Qual [campo] está associado ao fornecedor [nome]?
- Liste os valores distintos do campo [campo], se a pergunta pedir uma listagem e o volume permitir.
- Quais registros têm o campo [campo] vazio?
- Quais registros possuem o valor [valor] no campo [campo]?
- Quantos registros possuem o campo [campo] preenchido?
- Qual é a soma do campo monetário [campo] por [agrupamento], quando os dados permitirem?

Os identificadores devem ser compatíveis com o conjunto consultado. Se houver mais de um registro possível, o agente deve apresentar as correspondências ou pedir um identificador mais específico.

## 11. Comparações, agregações e filtros
139. Compare [conjunto A] e [conjunto B] em valor total e quantidade de registros.
140. Qual é a diferença entre o saldo financeiro e o saldo orçamentário?
141. Qual é a diferença entre o total de empenhos e o total de restos a pagar?
142. Qual é o total por fornecedor?
143. Qual é o total por natureza de despesa?
144. Qual é o total por fonte?
145. Qual é a quantidade de registros por situação?
146. Quais são os registros entre R$ [mínimo] e R$ [máximo]?
147. Quais registros correspondem ao período de [data inicial] a [data final]?
148. Qual foi o total no período de [data inicial] a [data final]?
149. Quantos registros existem no período de [data inicial] a [data final]?
150. Qual é o maior, menor e valor médio dos registros de [conjunto], quando aplicável?

## 12. Ausência de dados, ambiguidades e limites
151. Qual é o telefone do favorecido?
152. Qual é o e-mail do fornecedor?
153. Qual é o endereço do favorecido?
154. Qual é a informação de [campo inexistente]?
155. Existe o registro [identificador inexistente]?
156. Qual é a observação do empenho? (sem informar qual empenho)
157. Qual é o valor desse registro? (sem contexto anterior)
158. Quanto foi pago a [nome ambíguo]?
159. Qual foi a última OB? (quando o conjunto não tem data válida)
160. Quanto foi pago em [mês] quando não existe campo de data adequado?
161. Quais são todos os dados disponíveis?
162. Por que não é possível responder à pergunta [pergunta]?

**Comportamento obrigatório para essas situações:**
- Distinguir “nenhum registro encontrado” de “campo não existe” e de “base indisponível”.
- Não converter campo ausente em zero.
- Não declarar que um pagamento ocorreu ou não ocorreu sem critério de correspondência explícito.
- Não somar registros de conjuntos diferentes sem explicar o critério e sem garantir que não haja dupla contagem.
- Informar o conjunto consultado, a fonte e a data da base quando disponíveis.
- Para perguntas ambíguas, solicitar o identificador necessário.
- Para perguntas com data, confirmar que o conjunto possui um campo de data apropriado antes de calcular.
- Para perguntas com valores, usar parsing monetário brasileiro e tolerância adequada para centavos.
- Para rankings, ordenar numericamente, não como texto.
- Para resultados múltiplos, apresentar contagem e limitar a listagem com clareza.
- Não dizer que a base foi atualizada agora; informar a data real da base.
