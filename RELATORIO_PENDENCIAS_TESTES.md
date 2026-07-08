# Relatorio de pendencias e testes - SafeTalk

Data: 2026-07-08

## Estrutura atual

- Frontend: React + Vite em `src`.
- Banco/autenticacao: Firebase Auth e Firestore direto no frontend.
- Backend proprio: nao existe neste projeto.
- Controllers/services de dominio: nao existem; as chamadas de banco ficam dentro das paginas/componentes.
- Colecoes usadas no Firestore: `users`, `posts`, `requests`, `appointments`, `reviews`, `profileViews` e subcolecao `users/{uid}/savedPosts`.

## Pontos ainda incompletos ou frageis

1. Regras do Firestore

   Nao ha arquivo de regras no projeto. Isso e importante para impedir no banco que profissionais avaliem profissionais, que usuarios editem dados de outros usuarios, ou que qualquer pessoa altere solicitacoes.

2. Autorizacao no frontend nao substitui seguranca

   O frontend agora bloqueia profissional de avaliar/solicitar contato pelo diretorio, mas a protecao definitiva precisa estar nas regras do Firestore.

3. Agenda

   A agenda agora tem grade semanal de dias e horarios, cria, edita e exclui eventos em `appointments`. Ainda falta recorrencia, duracao configuravel, bloqueio de horarios indisponiveis, visualizacao mensal e prevencao transacional de conflito caso dois clientes tentem agendar o mesmo horario ao mesmo tempo.

4. Avaliacoes

   Apenas usuarios conseguem enviar avaliacao pela interface. Ainda falta vincular avaliacao a um atendimento finalizado, evitar multiplas avaliacoes duplicadas do mesmo usuario para o mesmo profissional e permitir denuncia/moderacao de comentarios.

5. Estatisticas

   Os acessos ao perfil sao registrados em `profileViews` quando alguem abre o modal de contato no diretorio. Ainda falta separar acessos unicos de acessos totais, filtrar por periodo e ignorar acessos feitos pelo proprio profissional.

6. Solicitacoes

   Solicitacoes sao persistidas em `requests` e o profissional consegue mudar status. Ainda falta notificacao, historico/auditoria de mudancas e criacao automatica de evento na agenda quando uma solicitacao for aceita.

7. Perfil profissional

   O perfil salva corretamente com loading encerrado. Ainda falta upload real de foto, validacao forte de CRP, revisao/aprovacao administrativa e padronizacao de campos como cidade/estado.

8. Modo escuro

   O modo escuro foi implementado globalmente por classe no `html` e persistido em `localStorage`. Como muitas telas usam classes utilitarias diretas, podem existir detalhes visuais pontuais que precisam de refinamento manual em telas menos usadas.

9. Qualidade tecnica

   O projeto tem script `lint`, mas nao possui configuracao ESLint. Tambem nao ha suite automatizada de testes unitarios/e2e.

10. Arquivo antigo

   `src/pages/ProfessionalDashboard.jsx` parece ser uma versao antiga/estatica do painel profissional e nao e usada pelo `Dashboard.jsx` atual. Pode confundir manutencao futura.

## Testes executados nesta maquina

- `npm.cmd run build`: passou.
- A aplicacao respondeu em `http://127.0.0.1:5173` com status HTTP 200.
- `npm.cmd run lint`: nao executa porque nao ha arquivo de configuracao ESLint no projeto.

## Testes manuais que precisam de uma sessao Firebase real

1. Usuario comum

   - Login.
   - Criar desabafo.
   - Curtir/descurtir post.
   - Responder post.
   - Abrir diretorio de profissionais.
   - Solicitar contato.
   - Avaliar profissional com nota de 1 a 5.
   - Verificar se `requests`, `reviews` e `profileViews` foram gravados no Firestore.

2. Profissional

   - Login como profissional.
   - Abrir Visao Geral.
   - Salvar Meu Perfil e confirmar que o loading encerra.
   - Abrir Avaliacoes e confirmar que nao existe formulario para se autoavaliar.
   - Abrir Profissionais como profissional e confirmar que avaliacao/solicitacao ficam bloqueadas.
   - Criar evento na Agenda clicando em dia/hora.
   - Editar evento pela grade.
   - Excluir evento.
   - Alterar status de Solicitacoes.
   - Conferir Estatisticas com dados reais de `profileViews`, `requests`, `reviews`, `appointments` e `posts`.

3. Modo escuro

   - Alternar tema no botao do Navbar.
   - Recarregar a pagina e confirmar persistencia.
   - Verificar contraste em Landing, Login, Cadastro, Feed, Profissionais, Perfil, Agenda, Estatisticas e Configuracoes.

## Recomendacoes imediatas

- Criar regras Firestore antes de qualquer uso real.
- Remover ou arquivar `ProfessionalDashboard.jsx` se ele realmente nao for usado.
- Criar configuracao ESLint e um teste e2e minimo para login, solicitacao, avaliacao e agenda.
- Definir modelo final de `appointments`, incluindo duracao, timezone e conflito de horario.
