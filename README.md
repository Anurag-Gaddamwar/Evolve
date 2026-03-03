# Evolve

`Evolve` is a full‑stack **Next.js 13** application with a Node/Express backend that provides user
authentication, video browsing, AI chat, analytics, and a bot interface. It serves as both a
starter template and an opinionated implementation of common features for modern web apps.

---
## 🧱 Project Structure

```text
.
├── public/             # static assets
├── src/
│   ├── app/            # Next.js app router (pages using React Server Components)
│   │   ├── api/        # serverless API routes (users, chats, auth flows, etc.)
│   │   ├── components/ # shared React components
│   │   ├── profile/    # profile pages and styles
│   │   ├── login/      # login/signup flows
│   │   └── …
│   ├── backend/        # Express routes and services (ai, bot, videos)
│   ├── config/         # configuration helpers
│   ├── dbConfig/        # MongoDB connection logic
│   ├── helpers/         # utility functions (token handling, mailer)
│   ├── models/          # Mongoose models (userModel.js)
│   └── routes/          # additional Express routes
├── server.js           # custom Express server used by Next.js
├── package.json        # dependencies & scripts
├── tsconfig.json
├── next.config.mjs
└── README.md           # (this file)
```

> The repository mixes JavaScript and TypeScript; you can convert files to TS as needed.

---
## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm, yarn, pnpm or bun
- MongoDB instance (local or cloud)

### Installation

```bash
git clone <repo-url> evolve
cd evolve
npm install          # or yarn, pnpm, bun
```

### Environment Variables
Create a `.env` file at the project root with the following keys:

```env
MONGODB_URI=<your_mongo_connection_string>
YOUTUBE_API_KEY=<your_youtube_data_api_key>
GEMINI_API_KEY=<your_gemini_api_key>  # used by AI/chat endpoints
TOKEN_SECRET=<jwt_signing_secret>
DOMAIN=http://localhost:3000          # adjust for production URL
```

Update `src/dbConfig/dbConfig.ts` if you need custom connection logic.

> You can also set `NODE_ENV=development` during local work; production ENV variables
> are handled by your hosting provider (Vercel, etc.).

### Configuration Reminders
- Analytics page fetches YouTube key from `src/app/analytics/page.jsx`.
- Email and token helpers are in `src/helpers/mailer.ts` and `getDataFromToken.ts`.

---
## 🛠 Development

```bash
npm run dev            # starts Next.js dev server (http://localhost:3000)
node server.js         # runs custom Express backend concurrently (needed for some routes)
```

> In most cases `npm run dev` will start the backend automatically via `server.js`.

You can also run individual scripts for testing or debugging:

```bash
node backend/routes/bot.js    # standalone bot server
node backend/routes/profile.js
to run specific modules as needed
```

### Useful Commands
- `npm run build` – compile production bundle
- `npm start` – start in production mode (requires build)
- `npm test` – run any tests (not yet configured)
- `npm run lint` / `npm run format` – lint/format code

---
## 🔧 Features & Usage

- **Authentication** – signup/login/logout, password reset, email verification
- **Profile pages** – browse/edit user profiles, dynamic routes
- **Video service** – search and display videos via YouTube API
- **AI Chat** – powered by Gemini or another model using `chatService.js`
- **Analytics** – view YouTube analytics for a channel/user
- **Bot interface** – simple chat bot under `src/app/bot`

To start customizing, edit files inside `src/app` (React components) or
`src/backend` (Express services).

---
## 📚 Learning Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router Guide](https://nextjs.org/docs/app/building-your-application/routing)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Mongoose](https://mongoosejs.com/docs/guide.html)

---
## 📦 Deployment
This project works seamlessly with Vercel; simply connect the repo and add
your environment variables. You can also deploy using Docker or any Node.js
hosting provider. See the [Next.js deployment docs](https://nextjs.org/docs/deployment)
for general guidance.

---
## 🤝 Contributing
Contributions and feedback are welcome! Please open issues or pull requests
against the `main` branch. Follow conventional commits and include tests when
adding functionality.

---
## 💡 Notes
- The codebase uses Tailwind CSS for styling; run `npx tailwindcss init` if you
modify the config.
- Some API routes live under `src/app/api/users/...` and are used by the
frontend; any backend change may require updating both the Next.js route
and the Express service.

Happy coding! 🎉
