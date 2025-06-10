# Next.js Project with @diplodoc/mdx-extension

This is a Next.js project that demonstrates both SSR and client-side rendering of the `@diplodoc/mdx-extension` package.

## Features

- **SSR (Server-Side Rendering)** – `/` route renders `@diplodoc/mdx-extension` on the server
- **Client-Side Rendering** – `/noSsr` route loads `@diplodoc/mdx-extension` in the browser
- Next.js optimized production build

## Prerequisites

- Node.js (v18 or later recommended)
- npm (v9 or later recommended)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/diplodoc-platform/mdx-extension mdx-extension
   cd mdx-extension
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Start the application**
   ```bash
   npm start
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Routes

- `/` – Server-side rendered version of `@diplodoc/mdx-extension`
- `/noSsr` – Client-side rendered version of `@diplodoc/mdx-extension`

## Development Scripts

- `npm run dev` – Run development server with hot-reload
- `npm run build` – Create optimized production build
- `npm start` – Start production server
- `npm run lint` – Run ESLint
