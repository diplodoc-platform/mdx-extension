// @ts-ignore
import {expose} from 'threads/worker';
import transform from '@diplodoc/transform';
import DefaultPlugins from '@diplodoc/transform/lib/plugins';
// eslint-disable-next-line import/no-extraneous-dependencies
import {isWithMdxArtifacts, mdxPlugin} from '@plugin';
import {PURE_COMPONENTS, SSR_COMPONENTS} from '@/components';
import getAsyncSsrRenderer from '../../../../src/utils/getAsyncSsrRenderer';
import assert from 'node:assert';
import {transform as swcTransform} from '@swc/core';

export interface SsrRendererWorker {
    getContent: typeof getContent;
}

const getContent = async (content: string) => {
    const {render, renderAsync} = getAsyncSsrRenderer({
        components: SSR_COMPONENTS,
        pureComponents: PURE_COMPONENTS,
    });

    const {result} = transform(content, {
        needToSanitizeHtml: false,
        useCommonAnchorButtons: true,
        plugins: [...DefaultPlugins, mdxPlugin({render})],
    });

    isWithMdxArtifacts(result);

    const {html, mdxArtifacts} = result;

    assert(mdxArtifacts);
    const htmlWithMdx = await renderAsync(html, mdxArtifacts);

    const keys = Object.keys(mdxArtifacts.idMdx);

    for (let i = 0, id; (id = keys[i]); i++) {
        const code = mdxArtifacts.idMdx[id];

        const swcResult = await swcTransform(code, {
            jsc: {
                parser: {
                    syntax: 'ecmascript',
                    allowReturnOutsideFunction: true,
                },
                minify: {
                    mangle: {
                        topLevel: true,
                    },
                },
            },
            minify: true,
        });

        mdxArtifacts.idMdx[id] = swcResult.code;
    }

    return {html: htmlWithMdx, mdxArtifacts};
};

expose({
    getContent,
});
