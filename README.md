# Evolve Project

Welcome to the Evolve project, a Next.js application designed to help you get started with your development journey.

## Getting Started

### Prerequisites
Make sure Node.js is installed on your machine.

### Installation
1. Clone this repository to your local machine.
2. Navigate to the project root directory in your terminal.
3. Run npm install to install the necessary Node modules.
   ```
   npm install
   ```

### Configuration
- Update the MongoDB URL in Evolve/src/dbConfig/dbConfig.ts with your own database URL.
- Create a .env file in the root directory and add your API keys:
```
YOUTUBE_API_KEY=your_youtube_data_api_key
GEMINI_API_KEY=your_gemini_api_key
TOKEN_SECRET=token_secret_for_your_database
DOMAIN=http://localhost:3000
```
- Paste your YouTube Data API key into Evolve/src/app/analytics/page.jsx.


### Development

Start the development server:

bash
```
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev

```

Additionally, run the following files using:

```
node server.js
node profile.js
node bot.js
```

Open http://localhost:3000 in your browser to see the application.

### Usage

Begin modifying app/page.js to customize your page. The changes will automatically update the page.

This project utilizes next/font for optimizing and loading Inter, a custom Google Font.

## Work Flow
![Workflow](https://github.com/Anurag-Gaddamwar/Evolve/assets/123613177/ea3ba3d1-82fe-46d1-8e3c-d1fe4ffbb96a)

### Learn More

Explore the resources below to dive deeper into Next.js:

Next.js Documentation: Learn about Next.js features and API.
Learn Next.js: Interactive Next.js tutorial.
Next.js GitHub Repository: Contribute and provide feedback.

### Deployment
Consider using the Vercel Platform for seamless deployment. Refer to the Next.js deployment documentation for detailed instructions.

We welcome your feedback and contributions to this project! Happy coding!
