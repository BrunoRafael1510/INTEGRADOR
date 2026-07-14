# Relatorio de auditoria funcional completa - SafeTalk

Data da auditoria: 2026-07-14

## 1. Resumo executivo

O SafeTalk ja tem uma base funcional consistente: autenticacao com Firebase, separacao entre usuario comum e profissional, feed anonimo, criacao de desabafos, curtidas, respostas, diretorio profissional, solicitacoes reais, atendimentos com chat, avaliacoes pos-atendimento, agenda, estatisticas e configuracoes.

O fluxo principal mais importante esta parcialmente integrado de ponta a ponta:

Usuario comum -> diretorio de profissionais -> solicita contato -> profissional aceita -> atendimento/chat aparece para os dois -> profissional finaliza -> paciente pode avaliar -> avaliacao aparece no painel profissional.

Porem, ainda existem quebras de integracao importantes:

- A agenda nao cria automaticamente evento quando uma solicitacao e aceita.
- O chat nao tem leitura/nao lida, notificacao por mensagem ou contagem dinamica baseada em mensagens.
- A avaliacao depende de atendimento finalizado, mas ainda pode duplicar em alguns cenarios de agenda/solicitacao duplicada.
- O cadastro profissional ainda nao esta alinhado com as opcoes pre-montadas do perfil profissional.
- Nao ha regras Firestore no projeto, entao a seguranca depende muito do frontend.
- Denuncia de posts e notificacoes por e-mail sao visuais ou preferencias salvas, mas sem efeito real completo.
- Algumas consultas precisam de indices/regras adequadas no Firestore e nao ha tratamento de erro em todas.
- O arquivo `ProfessionalDashboard.jsx` parece legado e nao esta ligado as rotas atuais.

## 2. Arquitetura atual

### Stack

- Frontend: React 18 + Vite.
- Estilizacao: Tailwind CSS + CSS global em `src/index.css`.
- Rotas: `react-router-dom`.
- Autenticacao: Firebase Authentication.
- Banco: Cloud Firestore direto no frontend.
- Backend proprio: nao existe.
- IA externa: removida. `src/services/ai.js` mantem apenas compatibilidade local.

### Arquivos centrais

- `src/App.jsx`: rotas publicas e rota privada.
- `src/pages/Dashboard.jsx`: roteamento interno do dashboard, carregamento do perfil e notificacoes do menu.
- `src/components/Sidebar.jsx`: menu lateral para usuario comum e profissional.
- `src/pages/ProfessionalHome.jsx`: painel profissional completo.
- `src/services/firebase.js`: inicializacao Firebase.
- `src/services/ai.js`: compatibilidade local sem chamada externa.

### Rotas publicas

- `/`: landing page.
- `/login`: login.
- `/cadastro`: cadastro.
- `/dashboard/*`: area protegida.

### Rotas internas do dashboard

Usuario comum:

- `/dashboard`: feed.
- `/dashboard/criar`: criar desabafo.
- `/dashboard/profissionais`: diretorio de profissionais.
- `/dashboard/atendimentos`: atendimentos/chat do paciente.
- `/dashboard/avaliacoes`: avaliacao de profissionais.
- `/dashboard/meus-desabafos`: posts do usuario.
- `/dashboard/feed-comunidade`: feed/comunidade.

Profissional:

- `/dashboard`: visao geral.
- `/dashboard#profile`: meu perfil.
- `/dashboard#requests`: solicitacoes.
- `/dashboard#sessions`: atendimentos.
- `/dashboard/feed-comunidade`: comunidade.
- `/dashboard#answer`: responder desabafos.
- `/dashboard#reviews`: avaliacoes recebidas.
- `/dashboard#schedule`: agenda.
- `/dashboard#stats`: estatisticas.
- `/dashboard#settings`: configuracoes.

Observacao: o painel profissional usa hash (`#profile`, `#requests`) dentro de `/dashboard`, exceto comunidade, que usa rota propria `feed-comunidade`.

## 3. Modelo de dados identificado

### `users`

Documento por usuario autenticado.

Campos usados:

- `uid`
- `nome`
- `email`
- `tipo`: `usuario` ou `profissional`
- `especialidade`
- `areas`
- `descricao`
- `crp`
- `abordagem`
- `atendimento`
- `disponibilidade`
- `formacao`
- `experiencia`
- `valorConsulta`
- `idiomas`
- `certificacoes`
- `fotoUrl`
- `cidade`
- `estado`
- `preferencias`
- `criadoEm`
- `atualizadoEm`

Subcolecao:

- `users/{uid}/savedPosts`

Status: integrado com cadastro, dashboard, perfil profissional, diretorio, preferencias e posts salvos.

Risco: sem regras Firestore no projeto, qualquer controle de propriedade depende das regras externas.

### `posts`

Campos usados:

- `conteudo`
- `categoria`
- `autorUid`
- `autorNome`
- `criadoEm`
- `respostas`
- `curtidas`
- `totalRespostas`
- `denuncias`
- `primeiraRespostaProfissionalEm`
- `atualizadoEm`

Status: integrado com feed, criacao, minhas publicacoes, comunidade profissional, responder desabafos, estatisticas.

Risco: respostas ficam como array dentro do documento. Funciona para projeto pequeno, mas pode escalar mal e gerar conflito em muitas respostas simultaneas.

### `requests`

Campos usados:

- `profissionalUid`
- `profissionalNome`
- `pacienteUid`
- `pacienteNome`
- `pacienteEmail`
- `motivo`
- `categoria`
- `status`: `nova`, `pendente`, `aceita`, `recusada`, `finalizada`
- `criadaEm`
- `respondidaEm`
- `finalizadaEm`
- `atualizadaEm`

Status: integrado com diretorio, solicitacoes profissional, atendimentos profissional, atendimentos paciente, avaliacoes paciente, estatisticas e notificacoes do menu.

Risco: aceitar solicitacao nao cria automaticamente agenda. Finalizar solicitacao libera avaliacao, mas nao garante que houve atendimento real.

### `appointments`

Campos usados:

- `profissionalUid`
- `profissionalNome`
- `requestId`
- `pacienteUid`
- `pacienteNome`
- `data`
- `modalidade`
- `status`: `agendada`, `confirmada`, `concluida`, `cancelada`
- `observacoes`
- `criadaEm`
- `atualizadaEm`

Status: integrado com agenda profissional, estatisticas, avaliacoes paciente e parcialmente com solicitacoes.

Risco: agenda nao aparece como agenda do paciente; paciente so ve atendimentos baseados em `requests`. Um appointment avulso com `pacienteUid` aparece para avaliar depois, mas nao necessariamente aparece no chat/atendimento do paciente.

### `reviews`

Campos usados:

- `profissionalUid`
- `profissionalNome`
- `pacienteUid`
- `pacienteNome`
- `nota`
- `comentario`
- `origem`
- `atendimentoId`
- `criadaEm`

Status: integrado com avaliacao do paciente, diretorio profissional, painel de avaliacoes e estatisticas.

Risco: deduplicacao existe no frontend por `atendimentoId`, mas nao ha garantia no banco. Sem regra/indice unico, o usuario pode avaliar duplicado se burlar frontend ou se houver duplicidade entre request e appointment.

### `profileViews`

Campos usados:

- `profissionalUid`
- `profissionalNome`
- `pacienteUid`
- `pacienteNome`
- `origem`
- `criadaEm`

Status: integrado com abertura do modal de contato no diretorio, visao geral e estatisticas.

Risco: contabiliza abertura do modal, nao necessariamente visita real ao perfil completo. Tambem pode registrar profissional visualizando outro profissional dependendo do fluxo.

### `messages`

Campos usados:

- `atendimentoId`
- `requestId`
- `profissionalUid`
- `pacienteUid`
- `senderUid`
- `senderName`
- `senderRole`
- `texto`
- `criadaEm`

Status: integrado com chat do profissional e do paciente.

Risco: nao ha controle de participantes no frontend alem dos dados do atendimento. Sem regra Firestore, qualquer usuario autenticado poderia tentar ler/enviar mensagens se conhecer IDs.

## 4. Fluxos integrados de ponta a ponta

### Fluxo A - Cadastro e entrada

1. Usuario acessa `/cadastro`.
2. Escolhe `usuario` ou `profissional`.
3. Firebase Auth cria a conta.
4. `users/{uid}` e criado no Firestore.
5. `Dashboard.jsx` le `users/{uid}` em tempo real.
6. Se `tipo === profissional`, carrega `ProfessionalHome`.
7. Caso contrario, carrega `Home`.

Status: funcional.

Problemas:

- O cadastro profissional usa opcoes antigas e campos livres que nao batem totalmente com o perfil profissional atual.
- `Register.jsx` permite `disponibilidade` livre, enquanto `ProfilePage` espera uma das opcoes de `AVAILABILITY_OPTIONS`.
- `Register.jsx` permite especialidade livre, enquanto `ProfilePage` normaliza para lista permitida.
- Nao ha verificacao real de CRP/registro.

### Fluxo B - Desabafo e comunidade

1. Usuario cria post em `/dashboard/criar`.
2. `CreatePost.jsx` chama `moderarTexto`.
3. Se aprovado, salva em `posts`.
4. `Home.jsx` e `ProfessionalHome` escutam `posts` em tempo real.
5. Usuarios podem curtir e responder em `PostCard`.
6. Profissionais podem responder posts sem resposta em `AnswerPage`.

Status: funcional.

Problemas:

- `Home.jsx` nao tem callback de erro no `onSnapshot`.
- `PostCard.handleCurtir` nao tem `try/catch`; falha de permissao ou rede nao aparece para o usuario.
- Botao de denuncia existe visualmente, mas nao executa nada.
- Respostas sao guardadas em array dentro do post, o que limita escalabilidade.
- `CreatePost` retorna para home imediatamente apos publicar; o estado de sucesso quase nao e visto porque a pagina muda.

### Fluxo C - Profissional solicitado pelo usuario

1. Usuario abre `/dashboard/profissionais`.
2. `Professionals.jsx` busca `users` com `tipo == profissional`.
3. Busca tambem `reviews` para calcular media.
4. Ao abrir modal de contato, cria registro em `profileViews`.
5. Usuario envia solicitacao.
6. `requests` recebe documento com `status: nova`.
7. `Dashboard.jsx` atualiza badge do profissional em tempo real.
8. `RequestsPage` mostra solicitacao.

Status: funcional.

Problemas:

- Profissionais sao carregados via `getDocs`, nao `onSnapshot`; mudancas no diretorio nao entram em tempo real.
- Media de avaliacoes no diretorio e calculada buscando todas as reviews do banco, o que pode ficar caro.
- Usuario pode enviar varias solicitacoes para o mesmo profissional sem bloqueio de duplicidade.
- `profileViews` registra abertura do modal, nao uma pagina de perfil real.

### Fluxo D - Solicitacao vira atendimento

1. Profissional acessa `Solicitacoes`.
2. Pode aceitar, recusar ou finalizar.
3. Ao aceitar, status vira `aceita`.
4. Solicitacao sai da fila e aparece em `Atendimentos`.
5. Paciente ve a mesma solicitacao em `/dashboard/atendimentos`.
6. `SessionChat` usa `request.id` como `atendimentoId`.

Status: funcional.

Problemas:

- Aceitar nao cria automaticamente agenda.
- Nao existe etapa de confirmar horario com paciente.
- Nao existe status intermediario claro como `em_atendimento` separado de `aceita`.
- O chat nao tem notificacao de mensagens nao lidas.
- Badges do menu contam solicitacoes aceitas, mas nao mensagens novas.

### Fluxo E - Atendimento com chat

1. Profissional ou paciente abre atendimento.
2. `SessionChat` escuta `messages` por `atendimentoId == session.id`.
3. Enviar mensagem cria documento em `messages`.
4. A outra ponta recebe em tempo real.

Status: funcional.

Problemas:

- Nao existe campo `lidaEm`, `readBy`, `ultimaMensagemEm` ou contador por usuario.
- Nao existe ordenacao via `orderBy` no Firestore; ordena no cliente.
- Nao existe bloqueio de envio se o atendimento estiver finalizado. A UI mostra finalizado, mas o form continua disponivel.
- Nao existe anexo, chamada, link de atendimento ou historico clinico.

### Fluxo F - Agenda

1. Profissional acessa Agenda.
2. Pode salvar disponibilidade no documento `users/{uid}`.
3. Pode criar evento em `appointments`.
4. Pode vincular evento a uma solicitacao aceita.
5. Pode editar/excluir evento.
6. Se salvar evento como `concluida`/`finalizada` e houver `requestId`, a request e marcada como `finalizada`.

Status: funcional, mas parcialmente integrada.

Problemas:

- Aceitar solicitacao nao cria evento automaticamente.
- Agenda nao aparece como uma pagina propria do paciente.
- Evento avulso com paciente pode nao gerar chat.
- Nao ha prevencao transacional de conflito de horario.
- Nao ha duracao configuravel.
- Nao ha recorrencia.
- Disponibilidade semanal e texto livre, enquanto o perfil profissional usa selecao pre-montada.
- Nao ha timezone explicito.

### Fluxo G - Avaliacao

1. Paciente acessa `/dashboard/avaliacoes`.
2. Pagina busca requests finalizadas, appointments concluidos/finalizados e reviews do paciente.
3. Exibe itens pendentes.
4. Paciente envia nota e comentario.
5. Documento e salvo em `reviews`.
6. Profissional ve avaliacao em `ReviewsPage`.
7. Diretorio recalcula media ao carregar.

Status: funcional.

Problemas:

- `PatientReviews` usa `getDocs`, nao tempo real.
- Pode haver duplicidade se o mesmo atendimento existir como request e appointment.
- Nao ha regra de banco garantindo que so paciente atendido avalie.
- Nao ha bloqueio transacional de avaliacao unica.
- Nota e input numerico, mas UX ainda poderia ser estrelas/botoes.

### Fluxo H - Estatisticas

1. `useProfessionalData` escuta posts, requests, appointments, reviews, profileViews e savedPosts.
2. `buildMetrics` calcula indicadores.
3. `StatsPage` monta graficos simples.

Status: funcional para dados basicos.

Problemas:

- Acessos ao perfil sao baseados em `profileViews`, que registra abertura do modal.
- Nao separa acesso total de acesso unico.
- Nao permite filtro por periodo.
- `weeklyResponses` mostra apenas total geral em uma barra, nao atividade semanal real.
- Categorias atendidas dependem de respostas do profissional em posts, nao de atendimentos/requests.
- Tempo medio de resposta usa `post.criadoEm` e `response.criadaEm`, mas resposta profissional usa `new Date().toISOString()` em alguns lugares; funciona, mas mistura timestamp Firestore e string ISO.

## 5. Auditoria pagina por pagina

### Landing - `src/pages/Landing.jsx`

Funcao: porta de entrada publica.

Integracoes:

- Recebe `user`, `theme`, `onThemeToggle`.
- Deve redirecionar/mostrar CTAs conforme sessao.

Estado: visual e navegação publica.

Pendencias recomendadas:

- Garantir que textos com acentuacao estejam corretos.
- Adicionar CTA claro para usuario e profissional.
- Garantir contraste em dark mode.

### Login - `src/pages/Login.jsx`

Funcao: autenticar usuario.

Integracoes:

- Firebase Auth `signInWithEmailAndPassword`.
- Redireciona para `/dashboard`.
- Usa tema global.

Estado: funcional.

Riscos:

- Nao possui recuperar senha.
- Nao possui login social.
- Nao verifica e-mail.

Prioridade: media.

### Cadastro - `src/pages/Register.jsx`

Funcao: criar usuario comum ou profissional.

Integracoes:

- Firebase Auth `createUserWithEmailAndPassword`.
- Auth profile `updateProfile`.
- Firestore `users/{uid}`.

Estado: funcional.

Problemas:

- Campos profissionais nao estao alinhados com `ProfilePage`.
- Especialidade/disponibilidade ainda podem entrar fora das opcoes finais.
- Nao salva preferencias padrao.
- Nao salva todos os campos que depois entram no progresso do perfil.

Prioridade: alta, porque cria dados inconsistentes logo no primeiro uso.

### Dashboard - `src/pages/Dashboard.jsx`

Funcao: area protegida e roteamento por tipo de perfil.

Integracoes:

- Escuta `users/{uid}`.
- Escuta `requests` para badges do menu.
- Roteia para paginas de usuario ou profissional.

Estado: funcional.

Problemas:

- Menu profissional usa hash; isso funciona, mas e menos limpo que rotas dedicadas.
- Badge de atendimento conta requests aceitas, nao mensagens novas.
- Se perfil nao existir, usuario comum cai em `Home` sem onboarding de perfil.

Prioridade: media.

### Feed - `src/pages/Home.jsx`

Funcao: exibir desabafos anonimos.

Integracoes:

- `posts` via `onSnapshot`.
- `PostCard` para interacoes.

Estado: funcional.

Problemas:

- Falta callback de erro no snapshot.
- Filtro de categorias difere de outras paginas (`Solidao` aparece aqui, mas nao em `ProfessionalHome`).
- Nao pagina alem de 30 posts.

Prioridade: media.

### Criar desabafo - `src/components/CreatePost.jsx`

Funcao: criar post anonimo.

Integracoes:

- `moderarTexto` local, sem API externa.
- `posts` via `addDoc`.

Estado: funcional.

Problemas:

- Se a API de IA falhar, o texto e liberado por fallback.
- Nao diferencia crise/risco: conteudo de automutilacao e bloqueado, mas talvez deveria exibir suporte de crise em vez de apenas impedir.
- Mensagem de sucesso quase nao aparece por causa do redirect imediato.

Prioridade: alta para seguranca emocional.

### PostCard - `src/components/PostCard.jsx`

Funcao: exibir post, curtir, responder, usar IA e denunciar.

Integracoes:

- `posts` via `updateDoc`.
- IA para reformular e moderar respostas.

Estado: parcialmente funcional.

Funciona:

- Curtir/descurtir.
- Responder posts de outras pessoas.
- Bloqueia resposta no proprio desabafo.
- Mostra respostas.

Problemas:

- Curtir nao tem `try/catch`.
- Reformular com IA nao usa `finally`; se algo travar, loading pode ficar incorreto dependendo do erro.
- Denunciar e botao sem acao.
- Respostas anonimas ainda mostram `autorNome`, que pode expor displayName.

Prioridade: alta para denuncia e privacidade.

### Meus desabafos - `src/pages/MyPosts.jsx`

Funcao: listar posts do usuario e permitir exclusao.

Integracoes:

- `posts` filtrado por `autorUid`.
- `deleteDoc` para apagar post.

Estado: funcional.

Problemas:

- Exclusao nao verifica no frontend se o post pertence ao usuario antes de deletar; depende de regra Firestore.
- Erro ao deletar so vai para console.
- Nao ha edicao de desabafo.

Prioridade: media.

### Diretorio de profissionais - `src/pages/Professionals.jsx`

Funcao: listar profissionais e criar solicitacao.

Integracoes:

- `users` para profissionais.
- `reviews` para media.
- `profileViews` ao abrir contato.
- `requests` ao enviar solicitacao.

Estado: funcional.

Funciona:

- Filtra por busca/area.
- Respeita `perfilPublico`.
- Respeita `aceitarSolicitacoes`.
- Bloqueia profissional de solicitar contato.
- Cria request real.

Problemas:

- Lista nao e tempo real.
- Busca todas as reviews para calcular medias.
- Nao impede solicitacao duplicada.
- Nao exibe perfil completo em pagina separada.
- Areas do diretorio nao batem totalmente com areas do perfil profissional.

Prioridade: alta para evitar duplicidade e melhorar consistencia.

### Atendimentos do paciente - `src/pages/PatientSessions.jsx`

Funcao: paciente acompanha atendimentos aceitos/finalizados e chat.

Integracoes:

- `requests` por `pacienteUid`.
- `SessionChat`.

Estado: funcional.

Problemas:

- Nao mostra appointments avulsos agendados.
- Nao separa claramente agenda de chat.
- Nao tem contador de nao lidas.
- Nao permite paciente cancelar ou propor horario.

Prioridade: alta para integrar agenda.

### Avaliacoes do paciente - `src/pages/PatientReviews.jsx`

Funcao: paciente avalia profissionais depois de atendimento finalizado.

Integracoes:

- `requests`, `appointments`, `reviews`.
- Cria documento em `reviews`.

Estado: funcional.

Problemas:

- Nao e tempo real.
- Duplicidade possivel entre request e appointment.
- Nao ha regra de banco impedindo avaliacao indevida.
- Nota numerica funciona, mas UX poderia ser estrelas.

Prioridade: alta para confiabilidade.

### Visao geral profissional - `OverviewPage`

Funcao: painel resumido do profissional.

Integracoes:

- `requests`, `appointments`, `reviews`, `profileViews`, `posts`, perfil.

Estado: funcional.

Problemas:

- "Pacientes ajudados" mistura appointments finalizados e requests finalizadas.
- Proximo horario vem de appointments, mas solicitacoes aceitas sem agenda nao aparecem como proximo compromisso.
- Perfil completo usa campos mais novos; cadastro inicial pode deixar progresso baixo por inconsistencia.

Prioridade: media.

### Meu Perfil profissional - `ProfilePage`

Funcao: editar dados publicos do profissional.

Integracoes:

- `users/{uid}` via `setDoc(..., merge: true)`.
- Preview usa preferencias.

Estado: funcional.

Funciona:

- Salva com loading controlado.
- Normaliza valor de consulta.
- Limita biografia.
- Converte campos para opcoes permitidas.
- Preview exibe campos principais.

Problemas:

- Foto e apenas URL, sem upload.
- Areas/idiomas/certificacoes foram reduzidos para uma selecao unica pelo uso de `firstAllowed`, apesar dos campos serem arrays. Se o objetivo e multipla selecao, falta UI correta.
- `formacao`, `experiencia` e `disponibilidade` sao uma opcao unica.
- CRP nao e validado.
- Nao ha aprovacao/verificacao administrativa.

Prioridade: alta para consistencia do diretorio.

### Solicitações profissional - `RequestsPage`

Funcao: gerir pedidos de contato.

Integracoes:

- `requests` em tempo real por profissional.
- Atualiza status.

Estado: funcional.

Funciona:

- Mostra pendentes.
- Aceita, recusa, finaliza.
- Move respondidas para historico.

Problemas:

- Aceitar nao cria agenda.
- Finalizar diretamente pela solicitacao libera avaliacao sem necessariamente haver chat/agenda.
- Nao tem auditoria de status.
- Nao tem notificacao para paciente alem da mudanca em tempo real se ele estiver na tela.

Prioridade: alta.

### Atendimentos profissional - `SessionsPage`

Funcao: acompanhar requests aceitas e conversar.

Integracoes:

- `requests`.
- `messages` via `SessionChat`.

Estado: funcional.

Problemas:

- Atendimento e apenas uma request aceita; nao tem entidade propria de atendimento.
- Finalizar muda request para `finalizada`.
- Nao liga automaticamente com agenda.
- Nao tem prontuario, observacoes privadas ou checklist de atendimento.

Prioridade: alta.

### Comunidade profissional - `CommunityPage`

Funcao: profissional visualiza feed e salva posts.

Integracoes:

- `posts`.
- `users/{uid}/savedPosts`.

Estado: funcional.

Problemas:

- Salvos sao apenas IDs; se post for removido, nao ha tratamento especial.
- Nao permite responder diretamente nesta aba; existe outra aba para responder.
- Nao ha filtros por prioridade real.

Prioridade: baixa/media.

### Responder desabafos - `AnswerPage`

Funcao: profissional responde posts sem respostas.

Integracoes:

- `posts` via `updateDoc` e `arrayUnion`.

Estado: funcional.

Funciona:

- Filtra apenas posts sem respostas.
- Bloqueia resposta ao proprio post.
- Incrementa `totalRespostas`.
- Marca `primeiraRespostaProfissionalEm`.

Problemas:

- Nao chama moderacao/IA nesta resposta profissional, diferente do `PostCard`.
- Usa `new Date().toISOString()` para `criadaEm`, misturando tipo com Firestore Timestamp.
- `primeiraRespostaProfissionalEm: post.primeiraRespostaProfissionalEm || serverTimestamp()` dentro de update pode ser problematico se ja existir timestamp/valor, mas deve funcionar na maioria dos casos.

Prioridade: media/alta.

### Avaliacoes profissional - `ReviewsPage`

Funcao: profissional acompanha reputacao.

Integracoes:

- `reviews` por `profissionalUid`.

Estado: funcional.

Problemas:

- Nao tem moderacao/denuncia de comentarios.
- Nao mostra de qual atendimento veio.
- Nao permite responder a avaliacao.

Prioridade: media.

### Agenda profissional - `SchedulePage`

Funcao: criar, editar e excluir eventos.

Integracoes:

- `appointments`.
- `requests` ao vincular/finalizar.
- `users/{uid}.disponibilidade`.

Estado: funcional, mas precisa de integracao mais forte.

Problemas:

- Disponibilidade e texto livre aqui, mas seletor no perfil.
- Nao ha criacao automatica por solicitacao aceita.
- Paciente nao ve a agenda como agenda.
- Nao previne conflitos com transacao.
- Grade so mostra 7 dias e horarios fixos.
- Status `finalizada` e tratado no codigo, mas select oferece `concluida`, nao `finalizada`.

Prioridade: alta.

### Estatisticas profissional - `StatsPage`

Funcao: mostrar indicadores reais.

Integracoes:

- `requests`, `appointments`, `reviews`, `profileViews`, `posts`.

Estado: funcional para metricas simples.

Problemas:

- Nao tem filtro de periodo.
- Acessos sao por dia da semana acumulado total, nao semana atual.
- Atividade e apenas uma barra com total de respostas.
- Categorias atendidas se baseiam em posts respondidos, nao em solicitacoes/atendimentos.
- Nao separa acessos unicos.

Prioridade: media.

### Configuracoes profissional - `SettingsPage`

Funcao: conta, senha, preferencias e exclusao.

Integracoes:

- Firebase Auth `updateEmail`, `updatePassword`, `deleteUser`.
- Firestore `users/{uid}` para email/preferencias/exclusao.

Estado: funcional.

Funciona:

- Salva preferencias.
- Diretorio respeita `perfilPublico`.
- Diretorio respeita `aceitarSolicitacoes`.
- Preview respeita `mostrarValorConsulta`.

Problemas:

- `notificacoesEmail` e salva, mas nao existe sistema de e-mail.
- Excluir conta apaga usuario e auth, mas nao apaga posts, requests, appointments, reviews, messages.
- Atualizar e-mail pode exigir login recente; mensagem existe, mas nao ha fluxo de reautenticacao.

Prioridade: alta para exclusao de dados.

### Chat - `SessionChat`

Funcao: conversa do atendimento.

Integracoes:

- `messages` por `atendimentoId`.

Estado: funcional.

Problemas:

- Nao bloqueia envio apos finalizado.
- Nao marca leitura.
- Nao tem notificacao.
- Nao valida se usuario e participante do atendimento.
- Nao usa `orderBy` no Firestore.

Prioridade: alta.

### IA - `src/services/ai.js`

Funcao: moderar post/resposta e reformular resposta.

Integracoes:

- Nao ha mais integracao externa por `fetch`.

Estado: funcional com fallback.

Problemas:

- Se a chave nao existir ou a API falhar, `moderarTexto` retorna `{ ok: true }`, liberando conteudo sem moderacao.
- Nao ha timeout.
- Nao ha logs estruturados alem de console.
- Conteudo de crise e tratado como proibido, mas deveria acionar mensagem de suporte/urgencia.

Prioridade: alta por envolver seguranca emocional.

## 6. O que esta integrado corretamente

- Auth -> perfil Firestore -> dashboard por tipo.
- Criacao de post -> feed -> meus desabafos -> comunidade profissional.
- Curtidas/respostas -> atualizam feed em tempo real.
- Diretorio -> profileViews -> estatisticas.
- Diretorio -> requests -> solicitacoes profissional.
- Requests aceitas -> atendimentos profissional e paciente.
- Requests aceitas -> chat por `messages`.
- Requests/appointments finalizados -> avaliacao do paciente.
- Reviews -> painel profissional e media no diretorio.
- Preferencias `perfilPublico`, `mostrarValorConsulta`, `aceitarSolicitacoes` -> afetam diretorio/preview.
- Appointments -> agenda profissional e estatisticas.

## 7. O que deveria estar integrado e ainda nao esta

### Agenda + solicitacoes

Deveria:

- Ao aceitar uma solicitacao, abrir fluxo para escolher horario ou criar pre-agendamento.
- Paciente deveria ver horario aceito/confirmado.
- Appointment deveria herdar `requestId` automaticamente.

Hoje:

- Profissional aceita request.
- Depois precisa ir manualmente na agenda e vincular.

### Agenda + chat

Deveria:

- Um atendimento agendado vinculado deveria abrir o mesmo chat.
- O paciente deveria ver consultas futuras.

Hoje:

- Chat depende principalmente de `requests`.
- `appointments` nao aparecem em `PatientSessions`.

### Chat + notificacoes

Deveria:

- Mensagem enviada atualizar contadores.
- Ao responder, contador diminuir.
- Ter `readBy` ou `lastReadAt`.

Hoje:

- Badge mostra quantidade de requests aceitas ou pendentes, nao mensagens.

### Avaliacoes + atendimento real

Deveria:

- Avaliacao liberada uma vez por atendimento finalizado.
- Banco deveria impedir duplicidade.

Hoje:

- Frontend tenta impedir com `reviewKeys`, mas nao e garantia forte.

### Denuncias + moderacao

Deveria:

- Botao denunciar criar documento ou incrementar denuncia.
- Profissional/admin deveria ver moderacao.

Hoje:

- Botao denunciar nao faz nada.

### Preferencias + notificacoes

Deveria:

- `notificacoesEmail` ativar/desativar envio real.

Hoje:

- Preferencia e salva, mas nao ha envio de e-mail.

### Exclusao de conta + dados relacionados

Deveria:

- Excluir ou anonimizar posts, respostas, requests, appointments, messages e reviews.

Hoje:

- Apaga `users/{uid}` e Auth. Dados relacionados ficam.

## 8. Principais riscos tecnicos

1. Falta de regras Firestore no repositorio.

   Sem regras, o frontend nao garante seguranca. Regras deveriam validar propriedade, tipo de usuario, status permitido e participantes do chat.

2. Duplicidade de dados e status.

   Requests e appointments representam partes do mesmo atendimento, mas nao existe uma entidade `sessions` unica. Isso gera duplicidade em avaliacao, agenda e estatisticas.

3. Arrays crescendo em documentos.

   `posts.respostas` e `posts.curtidas` como arrays funcionam no projeto academico, mas podem ficar ruins em escala.

4. Inconsistencia entre cadastro e perfil.

   O cadastro cria dados que o perfil depois normaliza ou ignora.

5. IA permissiva em falha.

   Em falha de moderacao, o sistema aprova conteudo.

6. Ausencia de testes automatizados.

   O projeto tem script `lint`, mas depende de configuracao. Nao ha testes unitarios/e2e.

## 9. Prioridades recomendadas

### Prioridade 1 - Seguranca e integridade

- Criar regras Firestore.
- Bloquear profissional avaliando profissional no banco.
- Bloquear avaliacao duplicada no banco.
- Validar participantes do chat.
- Implementar denuncia real de posts/comentarios.
- Rever fallback da moderacao por IA.

### Prioridade 2 - Fluxo atendimento completo

- Criar integracao automatica: aceitar solicitacao -> escolher horario -> criar appointment.
- Mostrar agenda/consultas futuras para paciente.
- Bloquear chat quando atendimento finalizado, ou permitir apenas historico.
- Criar notificacoes de mensagens nao lidas.

### Prioridade 3 - Consistencia de dados

- Alinhar cadastro profissional com opcoes do perfil.
- Unificar categorias entre feed, cadastro, diretorio e painel profissional.
- Decidir se `areas`, `idiomas`, `certificacoes` serao multi-selecao ou unica selecao.
- Normalizar timestamps para Firestore `serverTimestamp`/Timestamp quando possivel.

### Prioridade 4 - Estatisticas melhores

- Filtro por periodo.
- Acessos unicos vs totais.
- Atividade por dia real.
- Conversao: visualizacao -> solicitacao -> aceite -> finalizacao -> avaliacao.

### Prioridade 5 - UX e produto

- Recuperar senha.
- Perfil publico detalhado do profissional.
- Upload de foto.
- Reautenticacao para alterar e-mail/senha/excluir conta.
- Estados vazios mais orientados a acao.

## 10. Checklist funcional para testes manuais

### Usuario comum

- Criar conta como usuario.
- Entrar e alternar tema.
- Criar desabafo.
- Ver desabafo no feed.
- Ver desabafo em meus desabafos.
- Curtir/descurtir post de outro usuario.
- Responder post de outro usuario.
- Confirmar que nao consegue responder o proprio post.
- Abrir profissionais.
- Solicitar contato.
- Confirmar documento em `requests`.
- Aguardar profissional aceitar.
- Abrir Atendimentos.
- Enviar mensagem no chat.
- Aguardar profissional finalizar.
- Abrir Avaliacoes.
- Enviar avaliacao.
- Confirmar documento em `reviews`.

### Profissional

- Criar conta como profissional.
- Conferir se cadastro aparece no diretorio.
- Editar Meu Perfil.
- Salvar preferencias.
- Confirmar que `perfilPublico = false` remove do diretorio para outros usuarios.
- Confirmar que `aceitarSolicitacoes = false` bloqueia contato.
- Receber solicitacao.
- Aceitar solicitacao.
- Conferir se aparece em Atendimentos.
- Enviar mensagem no chat.
- Criar evento na agenda vinculado a solicitacao.
- Editar evento.
- Excluir evento.
- Finalizar atendimento.
- Conferir estatisticas.
- Conferir avaliacao recebida.

### Integracoes especiais

- Abrir modal de contato e confirmar `profileViews`.
- Ver badge de solicitacoes no menu profissional.
- Ver badge de atendimentos no menu paciente.
- Testar falha de rede/permissao no feed.
- Testar tentativa de avaliacao duplicada.
- Testar exclusao de conta e verificar dados relacionados.

## 11. Conclusao

O SafeTalk esta bem alem de um layout estatico: ele ja possui varias funcionalidades reais conectadas ao Firestore. O ponto mais forte atual e o fluxo de solicitacao, atendimento, chat e avaliacao. O ponto mais fraco e que esse fluxo ainda nao tem uma entidade unica de atendimento nem regras de seguranca no repositorio.

Para transformar o projeto em algo mais robusto, o proximo passo nao e apenas melhorar tela: e consolidar o modelo de dados. A recomendacao principal e criar uma colecao ou conceito claro de `sessions`/`atendimentos`, conectando `requests`, `appointments`, `messages` e `reviews` em torno de um mesmo ID. Isso reduziria duplicidade, melhoraria estatisticas, facilitaria notificacoes e deixaria avaliacao muito mais segura.

## 12. Correcoes aplicadas em 2026-07-14

Esta secao registra as correcoes feitas depois da auditoria.

### Segurança e dados

- Criado `firestore.rules` com regras para `users`, `savedPosts`, `posts`, `requests`, `appointments`, `messages`, `reviews` e `profileViews`.
- Criado `firebase.json` apontando para `firestore.rules`.
- Profissionais ficam bloqueados no diretorio para solicitar contato.
- Solicitações duplicadas abertas para o mesmo profissional passam a ser bloqueadas no frontend.
- Avaliações agora usam ID determinístico por paciente + atendimento, reduzindo duplicidade acidental.
- Avaliações removem duplicidade visual quando uma request finalizada também possui appointment vinculado.

### Solicitações, agenda e atendimentos

- Aceitar solicitação agora exige data/hora.
- Ao aceitar solicitação, o sistema cria automaticamente um evento vinculado em `appointments`.
- A request aceita recebe `appointmentId` e `agendadaPara`.
- O paciente passa a ver a data agendada em `Meus atendimentos`.
- Agenda passa a bloquear conflito de horário no uso normal.
- Disponibilidade na agenda foi alinhada às opções predefinidas do perfil.
- Modalidade da agenda foi alinhada às opções globais.

### Chat e notificações

- Mensagens passaram a salvar `readBy`.
- Abrir o chat marca mensagens recebidas como lidas.
- Badges de atendimento no menu passaram a contar mensagens não lidas, não apenas atendimentos existentes.
- Chat de atendimento finalizado agora fica bloqueado para envio e serve como histórico.
- Query de mensagens passou a ordenar por `criadaEm`.

### Posts, feed e denúncias

- Feed recebeu callback de erro no `onSnapshot`.
- Curtidas em posts agora possuem `try/catch` e mensagem de erro.
- Reformulação por IA agora encerra loading em `finally`.
- Botão de denúncia agora registra `denuncias`, `denunciadoPor` e `ultimaDenunciaEm`.
- Respostas comuns passam a ser exibidas como anônimas; respostas profissionais continuam identificadas.
- Exclusão de desabafo em `Meus desabafos` agora mostra erro ao usuário.

### Cadastro, perfil e opções

- Criado `src/constants/options.js` para centralizar categorias, áreas, especialidades, formação, experiência, certificações, idiomas, disponibilidade, modalidades e status.
- Cadastro profissional passou a usar as mesmas opções do perfil profissional.
- Cadastro profissional passou a salvar preferências padrão.
- Categorias do feed, criação de post, diretório e painel profissional foram alinhadas.

### IA/moderação

- A moderação não falha mais aberta: se a API não estiver configurada ou falhar, o envio é bloqueado com motivo.
- Respostas da aba profissional `Responder Desabafos` também passam por moderação.

### Validação técnica

- `npm.cmd run build` passou após as correções.
- Aviso restante: chunk principal acima de 500 kB, recomendando code splitting/manualChunks no futuro.

### Ainda depende de ação externa

- As regras Firestore precisam ser publicadas no Firebase para terem efeito real.
- Regras avançadas de unicidade absoluta ainda exigem modelagem/Cloud Functions ou IDs determinísticos em todos os fluxos.
- Exclusão total/anonimização de dados relacionados à conta ainda deve ser tratada com Cloud Function administrativa para não depender de permissões perigosas no frontend.

## 13. Segunda rodada de correções aplicadas

Depois da primeira correção, foi feita uma nova revisão focada em pontos que ainda poderiam quebrar no Firebase real.

### Solicitação + agenda

- Aceitar uma solicitação agora usa `writeBatch`, criando o evento de agenda e atualizando a request na mesma operação lógica.
- A fila de solicitações não permite mais finalizar diretamente um pedido pendente. A finalização fica no fluxo de atendimento/agenda, evitando liberar avaliação antes da hora.
- A data escolhida ao aceitar precisa ser futura.

### Chat + regras

- A consulta do chat agora filtra também pelo participante (`profissionalUid` ou `pacienteUid`), além de `atendimentoId`.
- Isso deixa a query compatível com as regras Firestore, que exigem que o usuário seja participante da conversa.
- O envio também retorna imediatamente se o atendimento estiver finalizado, além de bloquear pela UI.

### Firestore

- As regras agora exigem que o usuário exista em `users/{uid}` para ser considerado paciente ou profissional.
- `isPatient` passou a aceitar apenas `tipo == 'usuario'`, em vez de qualquer valor diferente de `profissional`.
- Usuários não podem alterar o próprio `tipo` depois da criação do documento.
- Criado `firestore.indexes.json` com índices para:
  - chat por atendimento + profissional + data;
  - chat por atendimento + paciente + data;
  - busca de solicitação duplicada por profissional + paciente.
- `firebase.json` agora publica regras e índices.

### Status apos esta rodada

- Build passou novamente.
- O app está mais consistente para uso normal.
- Ainda permanece uma limitação estrutural: exclusão/anonimização completa e garantias administrativas fortes devem ser feitas por Cloud Functions ou backend confiável.

## 14. Ajuste de compatibilidade das regras

Depois da publicação manual no Console Firebase, as regras foram simplificadas para evitar pontos de sintaxe que podem falhar no editor do Firestore:

- `validRequestStatus` deixou de usar lista com `in` e passou a comparar status explicitamente.
- A validação `profissionalUid is string` foi removida e substituída por uma checagem prática que impede o paciente de criar solicitação para si mesmo.

Se ainda houver erro de Firebase depois disso, ele provavelmente será de permissão em algum fluxo específico ou de índice ausente. Nesse caso, o erro do console do navegador deve indicar a tela/consulta que precisa de ajuste.

## 15. Remocao do Groq e desbloqueio dos textos

Por decisao de produto, o projeto nao usa mais Groq nem depende de `VITE_GROQ_API_KEY`.

Alteracoes aplicadas:

- `src/services/ai.js` deixou de chamar API externa.
- `moderarTexto` agora retorna `{ ok: true }`, sem bloquear desabafos ou respostas por falha externa.
- `reformularResposta` foi removida porque nao existe mais fluxo de sugestao/reformulacao por IA.
- A interface de `PostCard` nao exibe mais o botao de reformulacao empatica por IA.
- O README foi atualizado para remover instrucoes de configuracao do Groq.
- `firestore.rules` foi ajustado para considerar paciente todo usuario autenticado que nao seja profissional, ajudando contas antigas sem `tipo: usuario`.

Resultado esperado:

- Usuario comum volta a criar desabafo.
- Usuario comum volta a solicitar contato com profissional, desde que esteja logado e nao seja uma conta profissional.
- Profissional volta a responder desabafos.
- Comunidade deixa de mostrar erro de seguranca causado por indisponibilidade da API externa.

## 16. Revisao pos-remocao do Groq e ajuste do chat

Esta rodada foi feita sem alterar o PRD. O foco foi confirmar se algo ficou quebrado depois da remocao do Groq e corrigir o aviso de erro que aparecia no chat mesmo com mensagens funcionando.

### Verificacoes executadas

- Busca no codigo ativo (`src`) confirmou que nao existem mais chamadas a Groq, `VITE_GROQ_API_KEY`, endpoint externo, modelo de IA ou botao de reformulacao.
- `CreatePost`, `PostCard` e `AnswerPage` continuam chamando `moderarTexto`, mas agora ele e local e sempre retorna `{ ok: true }`.
- Nao ha mais import ativo de `reformularResposta`.
- O chat continua usando `messages` no Firestore com `atendimentoId`, `profissionalUid`, `pacienteUid`, `readBy` e `criadaEm`.

### Correcoes aplicadas

- `src/services/ai.js`: removida a funcao `reformularResposta`, deixando apenas a moderacao local sem rede.
- `src/components/SessionChat.jsx`: o estado de erro agora e limpo quando o chat carrega mensagens com sucesso.
- `src/components/SessionChat.jsx`: o estado de erro tambem e limpo quando nao ha atendimento selecionado, evitando aviso antigo preso na tela.

### Resultado esperado

- Criar desabafo nao depende mais de API externa.
- Responder desabafo como usuario ou profissional nao depende mais de API externa.
- Solicitar contato continua dependendo apenas de Auth, documento `users/{uid}` e regras Firestore.
- Chat funcional nao deve mais manter mensagem antiga de erro na tela depois que o snapshot voltar a carregar.

### Pontos para validar no Firebase real

- Publicar `firestore.rules` no projeto Firebase usado pelo app.
- `firestore.indexes.json` continua no projeto para performance futura, mas o chat e a checagem de solicitacao duplicada foram ajustados para nao dependerem desses indices compostos no uso normal.
- Recarregar a aplicacao depois de publicar as regras.
- Se alguma outra tela mostrar erro de indice ausente, o console do navegador normalmente mostra um link direto para criar o indice no Firebase.
- Se aparecer erro de permissao, conferir se os documentos de `messages` possuem `pacienteUid` e `profissionalUid` corretos.

## 17. Ajuste para erro de indice composto do Firestore

O erro "The query requires an index" apareceu porque o Firestore ainda nao tinha os indices compostos criados no Console/CLI.

### Correcoes aplicadas

- `src/components/SessionChat.jsx`: removida a query composta `atendimentoId + participante + orderBy(criadaEm)`.
- `src/components/SessionChat.jsx`: o chat agora busca mensagens pelo participante (`profissionalUid` ou `pacienteUid`), filtra o atendimento no cliente e ordena por `criadaEm` localmente.
- `src/pages/Professionals.jsx`: a checagem de solicitacao duplicada deixou de consultar `profissionalUid + pacienteUid` juntos.
- `src/pages/Professionals.jsx`: agora busca solicitacoes pelo `pacienteUid` e filtra o profissional/status no cliente.

### Resultado esperado

- O chat deixa de exigir indice composto para abrir.
- Solicitar contato deixa de exigir indice composto para verificar duplicidade.
- O projeto ainda pode usar `firestore.indexes.json` se os indices forem publicados depois, mas o fluxo principal nao deve quebrar por ausencia deles.

## 18. Ajuste de badges/notificacoes apos atendimento finalizado

Foi corrigido o comportamento em que o menu continuava mostrando notificacao depois que o atendimento ja tinha sido finalizado.

### Correcoes aplicadas

- `src/pages/Dashboard.jsx`: a contagem de mensagens nao lidas agora considera apenas requests ativas com `status: aceita`.
- `src/pages/Dashboard.jsx`: mensagens de atendimentos `finalizada` nao entram mais no badge de Atendimentos.
- `src/pages/Dashboard.jsx`: o badge de Avaliar profissionais agora conta apenas atendimentos finalizados ainda sem avaliacao.
- `src/pages/Dashboard.jsx`: depois que o paciente avalia, o listener de `reviews` atualiza o menu em tempo real e remove a notificacao.
- `src/pages/Dashboard.jsx`: appointments concluidos/finalizados tambem entram na contagem de avaliacao pendente, evitando diferenca entre agenda e solicitacao.

### Resultado esperado

- Finalizar atendimento remove notificacao de chat/atendimento pendente.
- A aba de avaliacao so mostra badge enquanto existir avaliacao realmente pendente.
- Enviar avaliacao faz o badge diminuir ou sumir sem precisar recarregar a pagina.
