// @ts-ignore
import {expose} from 'threads/worker';
import transform from '@diplodoc/transform';
import DefaultPlugins from '@diplodoc/transform/lib/plugins';
// eslint-disable-next-line import/no-extraneous-dependencies
import {MdxPluginEnv, getSsrRenderer, mdxPlugin} from '@plugin';
import type {OutputType} from '@diplodoc/transform/lib/typings';
import {COMPONENTS} from '@/components';

export interface SsrRendererWorker {
    getContent: typeof getContent;
}

const getContent = async (content: string) => {
    const render = await getSsrRenderer({
        components: COMPONENTS,
    });

    const {
        result: {html, mdxArtifacts},
    } = transform(content, {
        needToSanitizeHtml: false,
        useCommonAnchorButtons: true,
        plugins: [...DefaultPlugins, mdxPlugin({render})],
    }) as unknown as OutputType & {result: OutputType['result'] & MdxPluginEnv};

    return {html, mdxArtifacts};
};

expose({
    getContent,
});
