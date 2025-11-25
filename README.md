# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Quick Start — Run Locally, Publish, and Deploy

This repo is a Vite + React + TypeScript project. Below are copy-paste commands for Windows PowerShell to get the project running locally, push it to GitHub, and deploy to Netlify.

Prerequisites:

- Node.js 18+ (recommended)
- npm (bundled with Node)
- Git (for publishing)
- Optional: GitHub CLI (`gh`) and Netlify CLI for convenience

### 1) Install dependencies and run locally

Open PowerShell in the project root and run:

```powershell
npm install
npm run dev
```

- The dev server uses Vite. Open the URL shown in the terminal (usually `http://localhost:5173`).
- To create a production build and preview it locally:

```powershell
npm run build
npm run preview
```

### 2) Upload this project to GitHub

Option A — Standard Git (web-based repo creation):

1. Create a new empty repository on GitHub using the website (choose `main` branch).
2. In PowerShell run:

```powershell
git init
git add .
git commit -m "Initial commit - Zama ACL demo"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Replace `<your-username>` and `<repo-name>` with your GitHub username and chosen repository name.

Option B — Using GitHub CLI (quicker if you have `gh`):

```powershell
gh auth login
gh repo create <repo-name> --public --source=. --remote=origin --push
```

This creates the repo and pushes your local code.

### 3) Deploy to Netlify (recommended: deploy from Git)

Netlify will automatically build and publish your site from the `main` branch.

1. Go to https://app.netlify.com and sign in.
2. Click **"Add new site" → "Import from Git"**.
3. Connect your Git provider (GitHub) and select the repository you just pushed.
4. Set the build settings:

   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

5. Click **Deploy site**. Netlify will run the build and publish the `dist` folder.

Notes:
- Vite's default production output directory is `dist` — that's what Netlify should publish.
- If you need environment variables (e.g., API keys), add them in the Netlify site settings under **Site settings → Build & deploy → Environment**.

Optionally, use the Netlify CLI to deploy directly from your machine:

```powershell
npm i -g netlify-cli
netlify login
netlify init    # follow prompts to link or create a site
npm run build
netlify deploy --prod --dir=dist
```

### 4) Optional `netlify.toml` (recommended for reproducible builds)

Create a `netlify.toml` in the repo root to pin build settings for Netlify UI and CLI:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[dev]
  command = "npm run dev"
```

Add that file and push it to the repository so Netlify reads consistent settings automatically.

### 5) Common troubleshooting

- If the site fails to build in Netlify, check the build logs in the Netlify UI to see missing dependencies or script errors.
- Ensure `node` and `npm` versions in Netlify match your local setup (you can specify Node version in `package.json` `engines` or in Netlify site settings).
- For 404s on client-side routes, add a `_redirects` file with `/* /index.html 200` or configure Netlify redirects (useful for SPA routing).

---

If you want, I can also add a `netlify.toml` file now and commit it for you, or create a short `deploy.ps1` PowerShell script to automate the Git + Netlify CLI steps — tell me which you'd prefer.
