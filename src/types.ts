import React from 'react';

export type {WithInitialProps} from './utils/withInitialProps';

export interface MdxArtifacts {
    idMdx: Record<string, string>;
    idTagName: Record<string, string>;
}

export interface MdxPluginEnv {
    mdxArtifacts?: MdxArtifacts;
}

export type MDXRenderer = (mdx: string, mdxArtifacts: MdxArtifacts) => string;

export interface MDXGetInitialProps<
    ComponentProps = Record<string, unknown>,
    MdxState = ComponentProps,
    MdxProps = ComponentProps,
> {
    (props: MdxProps, mdxSate: MdxState): Promise<ComponentProps> | ComponentProps;
}

export type ReactContextLike<T> =
    | React.Context<T>
    | {Provider: T; Consumer: T; displayName?: string};

export type ContextWithValue<T> = {
    ctx: ReactContextLike<T>;
    initValue: T;
};

export type ContextList = (ReactContextLike<unknown> | ContextWithValue<unknown>)[];
