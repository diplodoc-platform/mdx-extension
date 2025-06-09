export interface MdxArtifacts {
    idMdx: Record<string, string>;
}

export interface MdxPluginEnv {
    mdxArtifacts?: MdxArtifacts;
}

export type MDXRenderer = (mdx: string, mdxArtifacts: MdxArtifacts) => string;
