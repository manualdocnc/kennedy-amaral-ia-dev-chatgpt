# Detalhamento técnico do Service Desk

Este documento resume os bugs corrigidos, as melhorias implementadas, a forma como os prompts foram estruturados e o fluxo de versionamento usado no projeto.

## Escopo e critérios

As tarefas foram executadas na branch `Preprod` (referida nos pedidos como `prepod`). Cada correção ou melhoria recebeu um commit próprio. Os títulos de correções começam com `bugfix:` e os de melhorias com `feature:`.

Quando um pedido não definia um critério de negócio, foi adotada uma regra explícita e localizada na interface. Por exemplo, o projeto não documentava SLA; para o indicador de atraso, foi usado o limite de mais de três dias desde a abertura.

## Bugs corrigidos

| Problema | Solução | Commit |
| --- | --- | --- |
| Busca não encontrava pelo nome do solicitante | A busca passou a comparar ID, título e nome do solicitante, sem diferenciar maiúsculas de minúsculas e aceitando correspondência parcial. | `4c14915 bugfix: corrigir busca pelo solicitante` |
| Validação insuficiente do formulário | Foram acrescentadas validações para nome, e-mail, título e descrição, limites de tamanho e normalização de espaços no nome e no título. | `d850544 bugfix: validar campos do chamado` |
| Envios repetidos podiam criar chamados duplicados | Chamados ativos com o mesmo e-mail, título e descrição são comparados após normalizar caixa, acentos e espaços. Uma duplicata é bloqueada e o usuário recebe o número do chamado existente. Chamados resolvidos não bloqueiam um novo registro. | `18ea1af bugfix: evitar chamados duplicados` |
| Confirmação de envio não identificava o protocolo | A mensagem de sucesso passou a exibir explicitamente o número do protocolo gerado. | `bce7135 bugfix: confirmar envio com protocolo` |
| Datas e horários podiam variar conforme o fuso do navegador | Abertura e atualização usam um único timestamp UTC por operação, armazenado em ISO 8601; a interface converte a exibição explicitamente para `America/Sao_Paulo`. Valores de data inválidos recebem indicação própria. | `dfc53f2 bugfix: corrigir fuso de datas dos chamados` |

## Melhorias implementadas

| Melhoria | Implementação | Commit |
| --- | --- | --- |
| Filtro por status | Filtro para Aberto, Em atendimento, Aguardando usuário e Resolvido; pode ser combinado com a busca. | `b03bbbc feature: filtrar chamados por status` |
| Filtro por prioridade | Filtro para Baixa, Média, Alta e Crítica; pode ser combinado com a busca e com o filtro de status. | `b6d5312 feature: filtrar chamados por prioridade` |
| Comentários internos | Observações com data são salvas separadamente por chamado e aparecem apenas nos detalhes do painel do analista. Não são adicionadas à descrição do usuário nem ao histórico geral. | `d7afe22 feature: adicionar comentarios internos` |
| Indicadores no painel | Exibe totais de chamados abertos, concluídos, atrasados e em atendimento. Atrasado significa não resolvido e aberto há mais de três dias. Os indicadores são gerais, independentes dos filtros da fila. | `4d5e91a feature: adicionar indicadores ao painel` |

## Como os prompts foram construídos

Os pedidos seguiram um padrão curto e orientado a uma única entrega:

1. Indicar a branch de trabalho (`prepod`, interpretada como a branch existente `Preprod`).
2. Descrever uma correção ou melhoria por pedido, com o comportamento esperado.
3. Solicitar um commit atômico separado para cada item.
4. Especificar o prefixo da mensagem: `bugfix:` para correções e `feature:` para melhorias.

Exemplos do formato usado:

> Para cada bug corrigido, realize um commit atômico separado na branch prepod. Corrigir a pesquisa pelo nome do solicitante, permitindo localizar chamados pelo nome completo ou parcial. Use mensagens iniciadas por `bugfix:`.

> Para cada melhoria implementada, realize um commit atômico separado na branch prepod. Adicionar filtros de chamados por prioridade: Baixa, Média, Alta e Crítica. Use mensagens iniciadas por `feature:`.

> Para cada bug corrigido, realize um commit atômico separado na branch prepod. Corrigir a gravação e a exibição das datas de abertura e atualização considerando o fuso horário. Use uma mensagem iniciada por `bugfix:`.

Os detalhes que não estavam especificados foram resolvidos usando o comportamento e os valores já presentes no aplicativo. A exceção de negócio foi o prazo de atraso: como não havia regra de SLA nos arquivos do projeto, adotou-se e exibiu-se o limite de três dias.

## Fluxo de versionamento

1. A branch `Staging` foi criada a partir de `main` e publicada no GitHub.
2. O commit `657cb09` adicionou `service-desk/teste.txt` em `Staging`; em seguida, `Staging` foi mesclada por fast-forward em `main` e a atualização foi publicada.
3. A branch `Preprod` foi criada a partir de `main` no commit `657cb09` e publicada.
4. As quatro primeiras correções foram registradas em commits separados e publicadas em `origin/Preprod`.
5. As quatro melhorias foram registradas em commits separados e publicadas em `origin/Preprod`.
6. A correção de datas e fuso horário foi registrada no commit `dfc53f2` e publicada em `origin/Preprod`.
7. `DETALHAMENTO.md` foi criado na branch `main` no commit `d285b7e` e atualizado para incluir a quinta correção. Os commits de funcionalidades continuam em `Preprod`; não houve merge dessas alterações de código para `main`.

## Estado das branches ao preparar este documento

- `Preprod`: contém cinco commits de correção e quatro commits de melhoria, publicados em `origin/Preprod`.
- `main`: contém o histórico de código até `657cb09` e mantém este relatório em commits de documentação; as alterações do Service Desk permanecem em `Preprod`.
- `Staging`: permanece no commit `657cb09`.
