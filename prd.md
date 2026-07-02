# PRD - SafeTalk

## 1. Visão Geral do Projeto

### Nome do projeto
**SafeTalk**

### Proposta da plataforma
O SafeTalk é uma plataforma web voltada ao acolhimento emocional, permitindo que usuários publiquem desabafos de forma anônima, interajam com outras pessoas da comunidade e encontrem profissionais cadastrados.

### Problema que busca resolver
Muitas pessoas têm dificuldade de falar sobre sentimentos, inseguranças ou situações pessoais. O projeto busca oferecer um ambiente digital mais acolhedor, anônimo e organizado, aproximando usuários de apoio comunitário e de profissionais.

## 2. Objetivo do Sistema

### Objetivo principal
Criar uma plataforma de apoio emocional com feed anônimo, interação entre usuários e área profissional para acompanhamento de solicitações, agenda, avaliações e estatísticas.

### Objetivos específicos
- Permitir cadastro e login de usuários.
- Diferenciar usuários comuns e profissionais.
- Permitir publicação de desabafos anônimos.
- Permitir curtidas e respostas em publicações.
- Disponibilizar diretório de profissionais.
- Permitir que profissionais editem seus perfis.
- Exibir indicadores, solicitações, agenda e avaliações para profissionais.
- Utilizar Firebase para autenticação e persistência de dados.
- Utilizar IA para moderação de textos e reformulação empática de respostas.

## 3. Público-Alvo / Tipos de Usuário

### Usuário comum
Pessoa que busca um espaço seguro para expressar sentimentos e receber apoio.

Pode:
- Criar conta.
- Fazer login.
- Publicar desabafos anônimos.
- Filtrar desabafos por categoria.
- Curtir publicações.
- Responder publicações.
- Visualizar seus próprios desabafos.
- Excluir seus próprios desabafos.
- Buscar profissionais no diretório.

### Profissional
Pessoa cadastrada como profissional de apoio ou saúde mental.

Pode:
- Criar perfil profissional.
- Editar dados do perfil.
- Visualizar dashboard profissional.
- Acompanhar solicitações existentes.
- Aceitar, recusar ou finalizar solicitações.
- Responder desabafos sem resposta.
- Visualizar avaliações cadastradas.
- Editar disponibilidade da agenda.
- Visualizar estatísticas calculadas com base nos dados do Firebase.
- Alterar e-mail, senha ou excluir conta.

## 4. Principais Funcionalidades

### Login e cadastro
- Autenticação com Firebase Authentication.
- Cadastro com escolha entre usuário comum e profissional.
- Cadastro profissional possui campos como especialidade, CRP, áreas de atuação, abordagem, atendimento e disponibilidade.

### Dashboard
- Área protegida, acessível apenas após login.
- Interface muda conforme o tipo de usuário.
- Usuário comum vê feed, criação de desabafo, profissionais e seus posts.
- Profissional vê visão geral, perfil, solicitações, comunidade, respostas, avaliações, agenda, estatísticas e configurações.

### Feed de desabafos
- Lista publicações da coleção `posts`.
- Exibe posts em ordem recente.
- Permite filtro por categoria.
- Exibe curtidas, respostas e tempo relativo.

### Criação de desabafo
- Usuário escreve um texto e escolhe categoria.
- Conteúdo é moderado via serviço de IA antes de ser salvo.
- Publicação é salva no Firestore com autor, categoria, data, curtidas e respostas.

### Interações nos posts
- Curtir e remover curtida.
- Responder publicações.
- Reformular resposta com IA para deixá-la mais empática.
- Moderação da resposta antes de salvar.

### Meus desabafos
- Lista posts criados pelo usuário logado.
- Mostra estatísticas simples: publicações, respostas e curtidas.
- Permite remover desabafos próprios.

### Diretório de profissionais
- Busca usuários cadastrados como `profissional`.
- Permite filtrar por área.
- Exibe nome, especialidade, CRP, descrição, abordagem, atendimento e disponibilidade.
- A ação “Solicitar contato” abre um modal, mas ainda está parcialmente implementada, pois exibe alerta e não grava uma solicitação no Firestore nessa tela.

### Perfil profissional
- Profissional pode editar nome, foto, CRP, especialidade, áreas, idiomas, formação, experiência, modalidade, valor, cidade, estado, disponibilidade, redes sociais, certificações e biografia.
- Alterações são salvas automaticamente no documento do usuário no Firestore.
- Exibe progresso de preenchimento do perfil.

### Solicitações
- Dashboard profissional lê solicitações da coleção `requests`.
- Exibe contagem por status.
- Permite alterar status para aceita, recusada ou finalizada.
- Exibe detalhes da solicitação.

### Agenda
- Lê atendimentos da coleção `appointments`.
- Exibe próximos atendimentos quando existem.
- Permite editar a disponibilidade semanal do profissional no perfil.

### Avaliações
- Lê avaliações da coleção `reviews`.
- Calcula nota média.
- Exibe total de avaliações, comentários recentes e distribuição por estrelas.

### Estatísticas
- Calcula métricas com base em posts, solicitações, agenda, avaliações e visualizações.
- Exibe dados como solicitações recebidas, avaliações, pacientes ajudados e respostas registradas.
- Mostra gráficos simples de barras quando há dados.

### Configurações
- Alteração de e-mail.
- Alteração de senha.
- Logout.
- Exclusão da conta e documento do usuário.

## 5. Fluxo Geral de Uso

1. O usuário acessa a landing page.
2. Pode entrar com conta existente ou criar cadastro.
3. No cadastro, escolhe entre usuário comum e profissional.
4. Após login, é redirecionado para `/dashboard`.
5. O sistema consulta o perfil no Firestore e identifica o tipo de usuário.
6. Se for usuário comum:
   - acessa feed;
   - cria desabafos;
   - interage com posts;
   - visualiza profissionais;
   - acompanha seus próprios desabafos.
7. Se for profissional:
   - acessa visão geral;
   - edita perfil;
   - acompanha solicitações;
   - responde desabafos;
   - visualiza avaliações;
   - gerencia disponibilidade;
   - acompanha estatísticas.

## 6. Tecnologias Utilizadas

### Stack principal
- **React 18**
- **Vite**
- **JavaScript**
- **Tailwind CSS**
- **React Router DOM**

### Bibliotecas
- **Firebase**
- **Lucide React** para ícones
- **ESLint** para padronização

### Serviços externos
- **Firebase Authentication**: login, cadastro e controle de sessão.
- **Cloud Firestore**: armazenamento de usuários, posts, respostas, solicitações, agenda, avaliações e dados auxiliares.
- **Groq API**: usada para moderação de texto e reformulação empática de respostas.

## 7. Estrutura do Projeto

### Arquivos principais
- `src/App.jsx`: define rotas principais e proteção de rota.
- `src/pages/Dashboard.jsx`: controla o dashboard e decide qual experiência mostrar conforme o tipo de usuário.
- `src/pages/Home.jsx`: feed de desabafos.
- `src/components/CreatePost.jsx`: criação de publicações.
- `src/components/PostCard.jsx`: exibição e interação com posts.
- `src/pages/Professionals.jsx`: diretório de profissionais.
- `src/pages/MyPosts.jsx`: posts criados pelo usuário.
- `src/pages/ProfessionalHome.jsx`: dashboard profissional atual.
- `src/pages/Login.jsx`: tela de login.
- `src/pages/Register.jsx`: tela de cadastro.
- `src/services/firebase.js`: configuração do Firebase.
- `src/services/ai.js`: integração com IA.

### Observação
Existe também o arquivo `ProfessionalDashboard.jsx`, mas ele não está ligado às rotas principais atuais. O fluxo profissional usado no sistema é o `ProfessionalHome.jsx`.

## 8. Estado Atual do Projeto

### Já está funcionando
- Cadastro e login com Firebase.
- Diferenciação entre usuário comum e profissional.
- Feed de desabafos com dados do Firestore.
- Criação de posts.
- Moderação de posts via IA.
- Curtidas e respostas.
- Reformulação de respostas com IA.
- Listagem e exclusão de posts próprios.
- Diretório de profissionais.
- Edição automática do perfil profissional.
- Dashboard profissional com dados reais do Firestore.
- Visualização e alteração de status de solicitações existentes.
- Visualização de agenda, avaliações e estatísticas quando há dados.
- Configurações de conta.

### Parcialmente implementado
- Solicitação de contato pelo diretório de profissionais: a interface existe, mas a confirmação apenas mostra um alerta e não grava uma solicitação no Firestore.
- Agenda: exibe atendimentos existentes e permite editar disponibilidade, mas não há fluxo completo de criação de consulta pelo usuário.
- Avaliações: o dashboard lê avaliações existentes, mas não há fluxo completo visível para o paciente criar uma avaliação.
- Denúncia de posts: existe botão visual, mas não há ação implementada.

### Melhorias pendentes
- Implementar gravação real de solicitações de contato.
- Criar fluxo completo de agendamento.
- Criar fluxo de avaliação pelo usuário.
- Implementar ação real para denúncia de publicações.
- Revisar textos com problemas de acentuação em algumas partes da interface.
- Melhorar regras de segurança do Firebase, se ainda não estiverem configuradas fora do código.
- Expandir validações e mensagens de erro.

## 9. Conclusão

O SafeTalk é uma plataforma acadêmica com proposta clara de apoio emocional, combinando comunidade anônima, interação entre usuários e recursos para profissionais. O projeto já possui autenticação, persistência em banco, feed funcional, cadastro diferenciado, dashboard profissional e integração com IA.

A solução demonstra uma lógica completa de produto: usuários podem compartilhar experiências e receber apoio, enquanto profissionais têm uma área própria para acompanhar perfil, solicitações, agenda, avaliações e indicadores. Mesmo com algumas funcionalidades ainda parciais, o sistema já apresenta uma base funcional consistente para evolução.