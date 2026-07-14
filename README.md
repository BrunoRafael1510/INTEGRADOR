# 💙 SafeTalk

> Plataforma web de apoio emocional anônimo — conectando pessoas que precisam ser ouvidas.

⚠️ **Este serviço não substitui acompanhamento psicológico ou psiquiátrico profissional.**  
Em crise? Ligue para o **CVV: 188** (24 horas, gratuito).

---

## 📋 Sobre o projeto

O SafeTalk é um ambiente digital seguro e sem julgamentos para que pessoas possam desabafar anonimamente, receber apoio de outras com experiências semelhantes e, quando estiverem prontas, se conectar com profissionais de saúde mental verificados.

---

## 🚀 Tecnologias

| Camada      | Tecnologia                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite                     |
| Estilização | Tailwind CSS 3                      |
| Auth        | Firebase Authentication             |
| Banco       | Firebase Firestore                  |
| Roteamento  | React Router DOM v6                 |

---

## 🗂️ Estrutura do projeto

```
safetalk_project/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx        # Topbar fixa com logout
│   │   ├── Sidebar.jsx       # Menu lateral de navegação
│   │   ├── PostCard.jsx      # Card de desabafo com respostas
│   │   └── CreatePost.jsx    # Formulário de novo desabafo
│   ├── pages/
│   │   ├── Landing.jsx       # Página inicial pública
│   │   ├── Login.jsx         # Tela de login
│   │   ├── Register.jsx      # Cadastro (usuário ou profissional)
│   │   ├── Dashboard.jsx     # Layout principal autenticado
│   │   ├── Home.jsx          # Feed de desabafos
│   │   ├── Professionals.jsx # Lista de profissionais
│   │   └── MyPosts.jsx       # Meus desabafos
│   ├── services/
│   │   ├── firebase.js       # Inicialização Firebase
│   │   └── ai.js             # Compatibilidade local sem API externa
│   ├── App.jsx               # Roteamento principal
│   ├── main.jsx              # Entry point
│   └── index.css             # Tailwind + estilos globais
├── .env.example              # Modelo de variáveis de ambiente
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## ⚙️ Como rodar localmente

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/safetalk.git
cd safetalk_project
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais do Firebase.

### 3. Configure o Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto
3. Ative **Authentication** → método **E-mail/senha**
4. Ative **Firestore Database** em modo de teste
5. Copie as credenciais do app web para o `.env`

Regras do Firestore recomendadas para desenvolvimento:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Rode o projeto

```bash
npm run dev
```

Acesse em `http://localhost:5173`

---

## 🧩 Funcionalidades do MVP

- [x] Cadastro e login (Firebase Auth)
- [x] Dois tipos de usuário: comum e profissional
- [x] Criação de desabafos anônimos com categorias
- [x] Feed em tempo real com filtro por categoria
- [x] Sistema de respostas entre usuários
- [x] Curtidas em desabafos
- [x] Lista de profissionais com busca
- [x] Tela "Meus desabafos" com estatísticas
- [x] Layout responsivo com sidebar + topbar

## 🔮 Funcionalidades futuras

- [ ] Agendamento real com profissionais
- [ ] Avaliação de profissionais (nota + comentário)
- [ ] Sistema de denúncias de conteúdo
- [ ] Notificações de respostas
- [ ] Perfil editável do usuário
- [ ] Curtidas em respostas individuais

---

## 🌿 Variáveis de ambiente

| Variável                          | Descrição                    |
|-----------------------------------|------------------------------|
| `VITE_FIREBASE_API_KEY`           | API Key do Firebase          |
| `VITE_FIREBASE_AUTH_DOMAIN`       | Auth domain do Firebase      |
| `VITE_FIREBASE_PROJECT_ID`        | ID do projeto Firebase       |
| `VITE_FIREBASE_STORAGE_BUCKET`    | Storage bucket               |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID                  |
| `VITE_FIREBASE_APP_ID`            | App ID do Firebase           |

---

## 🤝 Contribuindo

1. Crie sua branch: `git checkout -b feat/sua-feature`
2. Faça suas alterações e commit: `git commit -m 'feat: descrição'`
3. Push: `git push origin feat/sua-feature`
4. Abra um Pull Request para a `main`

---

## 📄 Licença

MIT — feito com cuidado 💙
