import React from 'react';
import type {MdxStateCtxValue} from './context';
import type {MDXProps} from 'mdx/types';

export type {WithInitialProps} from './utils/withInitialProps';

export interface MdxArtifacts {
    idMdx: Record<string, string>;
    idMdxComponent?: Record<string, React.ComponentType<MDXProps>>;
    idTagName: Record<string, string>;
}

export interface MdxPluginEnv {
    mdxArtifacts?: MdxArtifacts;
}

export type MDXRenderer = (mdx: string, mdxArtifacts: MdxArtifacts) => string;

export interface MDXGetInitialProps<ComponentProps = unknown> {
    (
        props: ComponentProps,
        mdxSate: Exclude<MdxStateCtxValue, null>,
    ): Promise<ComponentProps> | ComponentProps;
}

export type ReactContextLike<T> =
    | React.Context<T>
    | {Provider: unknown; Consumer: unknown; displayName?: string};

export type ContextWithValue<T> = {
    ctx: ReactContextLike<T>;
    initValue: T;
};

export type ContextList = (ReactContextLike<unknown> | ContextWithValue<unknown>)[];
