import type {MdxStateCtxValue} from './context';

export interface MdxArtifacts {
    idMdx: Record<string, string>;
}

export interface MdxPluginEnv {
    mdxArtifacts?: MdxArtifacts;
}

export type MDXRenderer = (mdx: string, mdxArtifacts: MdxArtifacts) => string;

export interface MDXGetInitialProps<P = Record<string, unknown>> {
    (props: P, mdxSate: MdxStateCtxValue): Promise<P> | P;
}
