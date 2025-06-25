import {replaceBlocks} from './utils/internal/plugin';
import {type GetSsrRendererProps} from './utils/getSsrRenderer';
import {getAsyncSsrRenderer, getSsrRenderer} from './utils';
import type {MdxArtifacts} from './types';
import type {GetAsyncSsrRendererProps} from './utils/getAsyncSsrRenderer';

export interface GetMdxCollectPluginOptions extends Omit<GetSsrRendererProps, 'components'> {
    tagNames?: string[];
}

export const getMdxCollectPlugin = (options: GetMdxCollectPluginOptions) => {
    const {tagNames, ...rendererOptions} = options;

    const render = getSsrRenderer(rendererOptions);

    const plugin = (origContent: string) => {
        const mdxArtifacts: MdxArtifacts = {idMdx: {}};

        const content = replaceBlocks({
            content: origContent,
            tagNames,
            replacer: ({content: contentLocal}) => render(contentLocal, mdxArtifacts),
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
        const mdxArtifacts: MdxArtifacts = {idMdx: {}};

        let content = replaceBlocks({
            content: origContent,
            tagNames,
            replacer: ({content: contentLocal}) => render(contentLocal),
        });

        content = await renderAsync(content, mdxArtifacts);

        return content;
    };

    return plugin;
};
