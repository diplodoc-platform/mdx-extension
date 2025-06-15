import {replaceBlocks} from './utils/internal/plugin';
import {type GetSsrRendererProps} from './utils/getSsrRenderer';
import {getAsyncSsrRenderer, getSsrRenderer} from './utils';
import type {MdxArtifacts} from './types';
import type {GetAsyncSsrRendererProps} from './utils/getAsyncSsrRenderer';

interface Options extends Omit<GetSsrRendererProps, 'components'> {
    tagNames?: string[];
}

export const getMdxCollectPlugin = (options: Options) => {
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

interface AsyncOptions extends Omit<GetAsyncSsrRendererProps, 'components'> {
    tagNames?: string[];
}

export const getAsyncMdxCollectPlugin = (options: AsyncOptions) => {
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
