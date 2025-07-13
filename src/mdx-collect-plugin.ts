import {replaceBlocks} from './utils/internal/plugin';
import {type GetAsyncSsrRendererProps, type GetSsrRendererProps} from './utils';
import {getAsyncSsrRenderer, getSsrRenderer} from './utils';
import type {MdxArtifacts} from './types';
import {getInitMdxArtifacts} from './utils/internal/common';

export interface GetMdxCollectPluginOptions extends Omit<GetSsrRendererProps, 'components'> {
    tagNames?: string[];
}

export const getMdxCollectPlugin = (options: GetMdxCollectPluginOptions) => {
    const {tagNames, ...rendererOptions} = options;

    const render = getSsrRenderer(rendererOptions);

    const plugin = (origContent: string) => {
        const mdxArtifacts: MdxArtifacts = getInitMdxArtifacts();

        const content = replaceBlocks({
            content: origContent,
            tagNames,
            replacer: ({content: contentLocal, tagName}) =>
                render({mdx: contentLocal, mdxArtifacts, tagName}),
        });

        return content;
    };

    return plugin;
};

export interface GetAsyncMdxCollectPluginOptions
    extends Omit<GetAsyncSsrRendererProps, 'components'> {
    tagNames?: string[];
}

export const getAsyncMdxCollectPlugin = (options: GetAsyncMdxCollectPluginOptions) => {
    const {tagNames, ...rendererOptions} = options;

    const {render, renderAsync} = getAsyncSsrRenderer(rendererOptions);

    const plugin = async (origContent: string) => {
        const mdxArtifacts: MdxArtifacts = getInitMdxArtifacts();

        let content = replaceBlocks({
            content: origContent,
            tagNames,
            replacer: ({content: contentLocal, tagName}) =>
                render({mdx: contentLocal, mdxArtifacts, tagName}),
        });

        content = await renderAsync(content, mdxArtifacts);

        return content;
    };

    return plugin;
};
