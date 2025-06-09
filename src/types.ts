export interface MdxArtifacts {
    idMdx: Record<string, string>;
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
