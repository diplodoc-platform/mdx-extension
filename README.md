# @diplodoc/mdx-extension

[![npm version](https://img.shields.io/npm/v/@diplodoc/mdx-extension?logo=npm)](https://www.npmjs.com/package/@diplodoc/mdx-extension)
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
- Context support with tracking of context changes
- Multiple syntax options:
  - Explicit `<MDX>...</MDX>` tags
  - Short form JSX fragments `<>...</>`
  - Direct React component usage `<Component />`
- Built-in security with MDX input validation
- Portal support for advanced component mounting with `withPortal`
- Asynchronous component loading support via `idMdxComponentLoader`

## Usage

### Basic Setup

First, add the `mdxPlugin()` to your Diplodoc transform plugins:

```typescript
import transform from '@diplodoc/transform';
import DefaultPlugins from '@diplodoc/transform/lib/plugins';
import {mdxPlugin} from '@diplodoc/mdx-extension';

const result = transform(markdownContent, {
  plugins: [...DefaultPlugins, mdxPlugin()],
});
```

### Enabling MDX Input Validation

The `validateMdx` plugin is a **recma plugin** (Rehype Compatible MDAST to JavaScript AST compiler) that validates MDX content for security by analyzing the generated Abstract Syntax Tree (AST). It prevents execution of potentially unsafe code by restricting allowed JavaScript constructs and patterns.

To enable security validation of MDX input:

```typescript
import {mdxPlugin, validateMdx} from '@diplodoc/mdx-extension';

const result = transform(markdownContent, {
  plugins: [
    ...DefaultPlugins,
    mdxPlugin({
      compileOptions: {
        recmaPlugins: [validateMdx],
      },
    }),
  ],
});
```

#### What the Plugin Validates

The `validateMdx` plugin performs comprehensive security validation by:

1. **Restricting JSX prop values** to only allow:
   - Literals (strings, numbers, booleans)
   - Identifiers
   - Array expressions (with validated elements)
   - Object expressions (with validated properties)
   - Binary expressions (with validated operands)
   - Specific JSX calls (`_jsxs`, `_jsx`)

2. **Blocking dangerous props** including:
   - `dangerouslySetInnerHTML`
   - `ref`
   - Event handlers (props starting with `on[A-Z]`)
   - Unsafe URL protocols in `href`, `src`, `action` props (blocks `javascript:` and `data:text/html`)

3. **Limiting component types** to only:
   - Built-in MDX components (`_Fragment`, `MDXLayout`, `_createMdxContent`)
   - Components from the `_components` object
   - Literal component names

4. **Disallowing unsafe JavaScript constructs**:
   - Function declarations (except specific MDX functions)
   - Variable declarations (except specific patterns)
   - Member expressions (except specific patterns)
   - Call expressions (except specific functions)
   - New expressions (only `Error` allowed)
   - Spread elements (only specific patterns)
   - Logical expressions (only specific patterns)
   - Async/await, yield, assignment, import, and function expressions

5. **Enforcing depth limits** (max depth 50) to prevent overly complex ASTs

#### Why Use This Plugin?

- **Security**: Prevents execution of arbitrary JavaScript code in MDX content
- **Server-side protection**: Blocks unsafe code that could execute during SSR
- **Controlled environment**: Ensures only approved patterns are allowed
- **Early error detection**: Throws validation errors for suspicious patterns before execution

#### Validation Errors

When the plugin detects invalid patterns, it throws descriptive errors such as:

- "Component prop 'dangerouslySetInnerHTML' is not allowed"
- "Component tag type '...' is not allowed here"
- "FunctionDeclaration is not allowed here"
- "Max depth exceeded"

### Client-side Rendering (CSR)

```tsx
import React, {Fragment, useMemo, useRef} from 'react';
import transform from '@diplodoc/transform';
import DefaultPlugins from '@diplodoc/transform/lib/plugins';
import {mdxPlugin, useMdx, isWithMdxArtifacts, validateMdx} from '@diplodoc/mdx-extension';

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

  const {html, mdxArtifacts} = useMemo(() => {
    const {result} = transform(CONTENT, {
      plugins: [
        ...DefaultPlugins,
        mdxPlugin({
          compileOptions: {
            recmaPlugins: [validateMdx],
          },
        }),
      ],
    });

    isWithMdxArtifacts(result);

    return result;
  }, []);

  const portals = useMdx({
    refCtr: ref,
    html,
    components: Components,
    mdxArtifacts,
  });

  return (
    <Fragment>
      <div ref={ref}></div>
      {portals}
    </Fragment>
  );
}
```

### Server-side Rendering (SSR)

```tsx
import React from 'react';
import transform from '@diplodoc/transform';
import DefaultPlugins from '@diplodoc/transform/lib/plugins';
import {mdxPlugin, useMdxSsr, getSsrRenderer, validateMdx} from '@diplodoc/mdx-extension';

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
    compileOptions: {
      recmaPlugins: [validateMdx],
    },
  });

  const {result} = transform(CONTENT, {
    plugins: [...DefaultPlugins, mdxPlugin({render})],
  });

  isWithMdxArtifacts(result);

  const {html, mdxArtifacts} = result;

  return {props: {html, mdxArtifacts}};
}

function ServerPage({html, mdxArtifacts}) {
  const ref = useRef(null);

  const portals = useMdxSsr({
    refCtr: ref,
    components: Components,
    mdxArtifacts,
    html,
  });

  const innerHtml = useMemo(() => {
    return {__html: html};
  }, [html]);

  return (
    <Fragment>
      <div ref={ref} dangerouslySetInnerHTML={innerHtml}></div>
      {portals}
    </Fragment>
  );
}
```

## Collect Plugin

The collect plugin provides functionality to process and transform MDX content while collecting artifacts. It comes in both synchronous and asynchronous versions.

### Synchronous Collect Plugin

```typescript
import {getMdxCollectPlugin} from '@diplodoc/mdx-extension';

const plugin = getMdxCollectPlugin({
  tagNames: ['CustomComponent'], // Optional filter for specific tags
  pureComponents: PURE_COMPONENTS,
  compileOptions: {
    // MDX compilation options
  },
});

const transformedContent = plugin(originalContent);
```

### Asynchronous Collect Plugin

```typescript
import {getAsyncMdxCollectPlugin} from '@diplodoc/mdx-extension';

const asyncPlugin = getAsyncMdxCollectPlugin({
  tagNames: ['AsyncComponent'], // Optional filter for specific tags
  pureComponents: PURE_COMPONENTS,
  compileOptions: {
    // MDX compilation options
  },
});

const transformedContent = await asyncPlugin(originalContent);
```

## Placeholder Renderer

The placeholder renderer provides a two-phase rendering approach for MDX content. This is useful for scenarios where you need to separate parsing from execution, such as deferred rendering, SSR with async components, or when you want to process MDX content in multiple passes.

### How it works

1. **Placeholder Generation**: During initial MDX processing, the `getPlaceholderRenderer` function creates placeholder HTML elements with unique IDs and stores the original MDX content in `mdxArtifacts.idFragment`.

2. **Placeholder Rendering**: Later, the `createPlaceholderRender` or `createAsyncPlaceholderRender` functions process these placeholders, replacing them with actual rendered HTML and storing the compiled code in `idMdx` and `idTagName` for client-side hydration.

### Usage

```typescript
import {getPlaceholderRenderer, createPlaceholderRender} from '@diplodoc/mdx-extension';

// Create a placeholder renderer
const placeholderRenderer = getPlaceholderRenderer();

// Use it in mdxPlugin
const {result} = transform(content, {
  plugins: [
    ...DefaultPlugins,
    mdxPlugin({
      render: placeholderRenderer,
    }),
  ],
});

// Later, render the placeholders
const render = createPlaceholderRender({
  components: YOUR_COMPONENTS,
  // ... other options
});

const finalHtml = render(result.html, result.mdxArtifacts);
```

### Async Placeholder Rendering

For asynchronous rendering (e.g., with components that have `withInitialProps`), use the async version:

```typescript
import {createAsyncPlaceholderRender} from '@diplodoc/mdx-extension';

const asyncRender = createAsyncPlaceholderRender({
  components: YOUR_COMPONENTS,
  // ... other options
});

const finalHtml = await asyncRender(result.html, result.mdxArtifacts);
```

## Raw MDX Content Plugin

The `remarkRawMdxContent` plugin is a remark plugin that extracts raw MDX content inside specified components and preserves it as text, preventing it from being parsed as MDX. This is useful for components that need to output raw MDX/JSX as text content (e.g., code examples, documentation generators).

### How it works

The plugin processes MDX JSX elements and for specified tag names, extracts the raw text content between the opening and closing tags. It then replaces the children with a single text node containing that raw content, preserving the original formatting.

### Usage

```typescript
import {remarkRawMdxContent} from '@diplodoc/mdx-extension';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';

const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkRawMdxContent, {
    tagNames: ['CodeExample', 'RawContent'], // Specify which tags to process
  });

const tree = processor.parse(`# Example

<CodeExample>
  <Button>Click me</Button>
</CodeExample>`);

const transformedTree = processor.runSync(tree);
```

### Integration with Diplodoc Transform

You can use the plugin as part of your Diplodoc transform pipeline:

```typescript
import transform from '@diplodoc/transform';
import DefaultPlugins from '@diplodoc/transform/lib/plugins';
import {mdxPlugin, remarkRawMdxContent} from '@diplodoc/mdx-extension';

const result = transform(content, {
  plugins: [
    ...DefaultPlugins,
    mdxPlugin({
      compileOptions: {
        remarkPlugins: [[remarkRawMdxContent, {tagNames: ['CodeExample']}]],
      },
    }),
  ],
});
```

This will ensure that content inside `<CodeExample>` tags is preserved as raw text rather than being parsed as MDX.

## API Reference

### `mdxPlugin(options?: { render?: MDXRenderer })`

The main plugin function that enables MDX processing.

#### Options:

- `render`: Optional renderer function, for SSR use `getSsrRenderer`
- `tagNames?: string[]` - Optional array of tag names to filter which components will be processed

### `useMdx(options: UseMdxProps): React.Fragment`

React hook for client-side MDX processing.

#### Options:

- `refCtr`: Ref to the container element
- `html`: HTML string from Diplodoc transform
- `components`: Object of React components to use
- `mdxArtifacts`: MDX artifacts from transform
- `pureComponents?`: Optional object of components that shouldn't hydrate (MDXComponents)
- `contextList?`: Array of React contexts to provide to MDX components
- `idMdxComponentLoader?`: Custom mdx component loader

### `useMdxSsr(options: UseMdxSsrProps): React.Fragment`

React hook for SSR-processed MDX content.

#### Options:

- `refCtr`: Ref to the container element
- `html`: HTML string from Diplodoc transform
- `components`: Object of React components to use
- `mdxArtifacts`: MDX artifacts from transform
- `pureComponents?`: Optional object of components that shouldn't hydrate (MDXComponents)
- `contextList?`: Array of React contexts to provide to MDX components
- `idMdxComponentLoader?`: Custom mdx component loader

### `getRenderer(options: GetRenderProps)`

Creates an renderer function for client-side processing.

#### Options:

- `compileOptions?`: MDX compilation options (see [MDX documentation](https://mdxjs.com/packages/mdx/#compileoptions))

### `getSsrRenderer(options: GetSsrRendererProps)`

Creates an SSR renderer function for server-side processing.

#### Options:

- `components`: Object of React components to use
- `pureComponents?`: Optional object of components that shouldn't hydrate (MDXComponents)
- `compileOptions?`: MDX compilation options (see [MDX documentation](https://mdxjs.com/packages/mdx/#compileoptions))
- `contextList?`: Array of React contexts to provide to MDX components. Use `{ ctx, initValue }` format to pass initial values for SSR

### `getAsyncSsrRenderer(options: GetAsyncSsrRendererProps)`

Creates an asynchronous SSR renderer that supports `withInitialProps`.

#### Options:

- `components`: Object of React components to use
- `pureComponents?`: Optional object of components that shouldn't hydrate (MDXComponents)
- `compileOptions?`: MDX compilation options (see [MDX documentation](https://mdxjs.com/packages/mdx/#compileoptions))
- `contextList?`: Array of React contexts to provide to MDX components. Use `{ ctx, initValue }` format to pass initial values for SSR

### `getMdxCollectPlugin(options: Options)`

Creates a synchronous collect plugin for processing MDX content.

#### Options:

- `tagNames?: string[]` - Optional array of tag names to filter processing
- `pureComponents?`: Components that should skip client-side hydration
- `compileOptions?`: MDX compilation options

### `getAsyncMdxCollectPlugin(options: AsyncOptions)`

Creates an asynchronous collect plugin that supports components with initial props.

#### Options:

- `tagNames?: string[]` - Optional array of tag names to filter processing
- `pureComponents?`: Components that should skip client-side hydration
- `compileOptions?`: MDX compilation options

### State Management Contexts

#### `MdxStateCtx: Context<MdxStateCtxValue>`

Provides access to the current MDX state:

```tsx
const state = useContext(MdxStateCtx);
```

#### `MdxSetStateCtx: Context<MdxSetStateCtxValue>`

Provides state setter function (only available during SSR):

```tsx
const setState = useContext(MdxSetStateCtx);
// Usage in SSR:
setState?.({key: value});
```

### Component Enhancers

#### `withInitialProps: WithInitialProps`

Wraps a component to enable initial props fetching during SSR.

**Parameters:**

- `component`: React component to wrap
- `getInitProps`: Function that receives props and MDX state, returns props (sync or async)

#### `withPortal: WithPortalProps`

Wraps a component to render it through React.createPortal, allowing for more flexible mounting.

**Parameters:**

- `component`: React component to wrap
- `fallback`: Optional fallback component to show before portal is mounted

**Usage:**

```tsx
export const COMPONENTS = {
  Tabs: withPortal(TabsLocal, () => <Skeleton />),
};
```

When using `withPortal`, the component will:

1. Render the fallback component (if provided) initially
2. Create a portal to mount the actual component when ready
3. Clean up the portal when unmounted

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

## Advanced Features

### State Management in SSR

The library provides two context providers for managing state during Server-Side Rendering (SSR):

- **`MdxSetStateCtx`** - A context that provides a function to update the MDX state. This function is only available during SSR (`null` on client-side). If you set a component's state using this context, it will be:
  - Serialized into the `data-mdx-state` attribute during SSR
  - Available in `MdxStateCtx` when the component renders

- **`MdxStateCtx`** - A context that provides access to the current MDX state value

### Asynchronous SSR with Initial Props

- **`withInitialProps`** - A higher-order component that enables asynchronous data fetching for SSR:
  - When wrapping a component with this function and using `getAsyncSsrRenderer`, the `getInitialProps` function will be called
  - Receives the component's props and MDX state as arguments
  - Can return either static or promise-based props

- **`getAsyncSsrRenderer`** - An asynchronous version of `getSsrRenderer` that:
  - Supports components wrapped with `withInitialProps`
  - Enables async data fetching during SSR

Example usage:

```typescript
const getInitialProps: MDXGetInitialProps<CounterProps> = (props, mdxState) => {
  mdxState.initialValue = 10; // Set initial state
  return props;
};

export const SSR_COMPONENTS = {
  ...COMPONENTS,
  Counter: withInitialProps(Counter, getInitialProps),
};
```

### Pure Components

The library supports pure components that:

- Are only rendered once during SSR
- Skip hydration on the client side
- Can be specified via the `pureComponents` option in:
  - `useMdx`
  - `useMdxSsr`
  - `getSsrRenderer`
  - `getAsyncSsrRenderer`

Example:

```typescript
export const PURE_COMPONENTS = {
  KatexFormula, // Will render once on server and not hydrate
  Label, // on client
  CompatTable,
  Alert,
};
```

### Asynchronous Component Loading

The `useMdx` and `useMdxSsr` hooks support an optional `idMdxComponentLoader` parameter that enables asynchronous loading of MDX components:

```tsx
interface PageProps {
  html: string;
  mdxArtifacts?: MdxArtifacts;
  withLoader?: boolean;
}

const Page: FC<PageProps> = ({html, mdxArtifacts}) => {
  const [isSuccess, setSuccess] = React.useState(false);
  const [data, setData] = React.useState<IdMdxComponentLoader['data']>(undefined);

  useMdxSsr({
    // ...other options
    idMdxComponentLoader: {isSuccess, data},
  });

  useEffect(() => {
    (async () => {
      const idMdxComponent: Record<string, React.ComponentType<MDXProps>> = {};

      for (const [artifactId, code] of Object.entries(mdxArtifacts?.idMdx ?? {})) {
        const fn = await asyncExecuteCode(code);
        idMdxComponent[artifactId] = fn(runtime).default;
      }

      setData(idMdxComponent);
      setSuccess(true);
    })();
  }, [mdxArtifacts]);

  // ...rest of the component
};
```

### Compilation Options

All renderer functions (`getSsrRenderer`, `getAsyncSsrRenderer`, `getRenderer`) accept optional MDX compilation options:

```typescript
const renderer = await getAsyncSsrRenderer({
  components: SSR_COMPONENTS,
  pureComponents: PURE_COMPONENTS,
  compileOptions: {
    // MDX compilation options here
  },
});
```

This allows for fine-grained control over the MDX compilation process while maintaining the library's core functionality.

## License

MIT
