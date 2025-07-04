import type {MdxArtifacts} from '../../types';

export type MdxBody = {content: string; fragment: string; tagName: string};

export interface GetHtmlProps {
    mdx: string;
    mdxArtifacts: MdxArtifacts;
    tagName: string;
}
