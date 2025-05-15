# @diplodoc/mdx-extension

[![npm version](https://badge.fury.io/js/@diplodoc%2Fmdx-extension.svg)](https://badge.fury.io/js/@diplodoc%2Fmdx-extension)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

MDX extension for Diplodoc's markdown transformer that allows embedding MDX/JSX components within markdown content.

## Installation

```bash
npm install @diplodoc/mdx-extension
# or
yarn add @diplodoc/mdx-extension
```

## Features

- Seamlessly integrate JSX/MDX components within markdown content
- Support for both client-side (CSR) and server-side (SSR) rendering
- Multiple syntax options:
  - Explicit `<MDX>...</MDX>` tags
  - Short form JSX fragments `<>...</>`
  - Direct React component usage `<Component />`

## Usage

### Basic Setup

First, add the `mdxPlugin()` to your Diplodoc transform plugins:

```typescript
import transform from "@diplodoc/transform";
import DefaultPlugins from "@diplodoc/transform/lib/plugins";
import { mdxPlugin } from "@diplodoc/mdx-extension";

const result = transform(markdownContent, {
  plugins: [...DefaultPlugins, mdxPlugin()],
});
```

### Client-side Rendering (CSR)

```tsx
import React, { useMemo, useRef } from "react";
import transform from "@diplodoc/transform";
import DefaultPlugins from "@diplodoc/transform/lib/plugins";
import { mdxPlugin, useMdx } from "@diplodoc/mdx-extension";

const Components = {
  CustomComponent: (props) => <div {...props}>Custom</div>,
};

const CONTENT = `
# Markdown Content

<CustomComponent style={{color: 'red'}} />

<MDX>
  <div>This will be rendered as MDX</div>
</MDX>
`;

function App() {
  const ref = useRef(null);

  const { html, mdxArtifacts } = useMemo(() => {
    const { result } = transform(CONTENT, {
      plugins: [...DefaultPlugins, mdxPlugin()],
    });

    return result;
  }, []);

  useMdx({
    refCtr: ref,
    html,
    components: Components,
    mdxArtifacts,
  });

  return <div ref={ref} />;
}
```

### Server-side Rendering (SSR)

```tsx
import React from "react";
import transform from "@diplodoc/transform";
import DefaultPlugins from "@diplodoc/transform/lib/plugins";
import { mdxPlugin, useMdxSsr, getSsrRenderer } from "@diplodoc/mdx-extension";

const Components = {
  ServerComponent: (props) => <strong {...props}>Server Rendered</strong>,
};

const CONTENT = `
# Server Rendered Content

<ServerComponent />
`;

export async function getServerSideProps() {
  const render = await getSsrRenderer({
    components: Components,
  });

  const {
    result: { html, mdxArtifacts },
  } = transform(CONTENT, {
    plugins: [...DefaultPlugins, mdxPlugin({ render })],
  });

  return { props: { html, mdxArtifacts } };
}

function ServerPage({ html, mdxArtifacts }) {
  const ref = useRef(null);

  useMdxSsr({
    refCtr: ref,
    components: Components,
    mdxArtifacts,
    html,
  });

  return <div ref={ref} />;
}
```

## API Reference

### `mdxPlugin(options?: { render?: MDXRenderer })`

The main plugin function that enables MDX processing.

#### Options:

- `render`: Optional renderer function, for SSR use `getSsrRenderer`

### `useMdx(options: UseMdxProps)`

React hook for client-side MDX processing.

#### Options:

- `refCtr`: Ref to the container element
- `html`: HTML string from Diplodoc transform
- `components`: Object of React components to use
- `mdxArtifacts`: MDX artifacts from transform

### `useMdxSsr(options: UseMdxSsrProps)`

React hook for SSR-processed MDX content.

#### Options:

- `refCtr`: Ref to the container element
- `html`: HTML string from Diplodoc transform
- `components`: Object of React components to use
- `mdxArtifacts`: MDX artifacts from transform

### `getRenderer()`

Creates an renderer function for client-side processing.

### `getSsrRenderer(options: { components: MDXComponents })`

Creates an SSR renderer function for server-side processing.

## Syntax Examples

### Explicit MDX tags

```markdown
<MDX>
  <MyComponent prop="value" />
</MDX>
```

### JSX Fragments

```markdown
<>

  <div>Fragment content</div>
</>
```

### Direct Component Usage

```markdown
<Button onClick={() => console.log('click')}>
Click me
</Button>
```

## License

MIT
