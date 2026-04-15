import {type CreateSsrRenderProps, createSsrRender} from './internal/ssrRender';
import type {MdxArtifacts} from '../types';
import {getInitMdxArtifacts} from './internal/common';
import {type CreateAsyncSsrRenderProps, createAsyncSsrRender} from './internal/asyncSsrRender';

export interface CreatePlaceholderRenderProps extends CreateSsrRenderProps {}

export const createPlaceholderRender = (renderProps: CreatePlaceholderRenderProps) => {
    const render = createSsrRender(renderProps);

    const getHtml = (inputOrig: string, mdxArtifacts?: MdxArtifacts) => {
        let input = inputOrig;
        const {idMdx, idTagName, idFragment = []} = mdxArtifacts ?? getInitMdxArtifacts();

        idFragment.splice(0).forEach(({id, replacer, mdx, tagName}) => {
            const {html, code} = render(id, mdx, tagName);

            if (code) {
                idMdx[id] = code;
                idTagName[id] = tagName;
            }

            input = input.replace(replacer, () => html);
        });

        if (mdxArtifacts) {
            delete mdxArtifacts.idFragment;
        }

        return input;
    };

    return getHtml;
};

export interface CreateAsyncPlaceholderRenderProps extends CreateAsyncSsrRenderProps {}

export const createAsyncPlaceholderRender = (renderProps: CreateAsyncPlaceholderRenderProps) => {
    const render = createAsyncSsrRender(renderProps);

    const getHtmlAsync = async (inputOrig: string, mdxArtifacts?: MdxArtifacts) => {
        let input = inputOrig;
        const {idMdx, idTagName, idFragment = []} = mdxArtifacts ?? getInitMdxArtifacts();

        const items: {id: string; replacer: string; tagName: string}[] = [];
        const promises: ReturnType<typeof render>[] = [];
        idFragment.splice(0).forEach(({id, replacer, mdx, tagName}) => {
            promises.push(render(id, mdx, tagName));
            items.push({id, replacer, tagName});
        });
        const promiseResults = await Promise.all(promises);

        for (let item, i = 0; (item = items[i]); i++) {
            const {id, replacer, tagName} = item;
            const {html, code} = promiseResults[i];
            input = input.replace(replacer, () => html);
            if (code) {
                idMdx[id] = code;
                idTagName[id] = tagName;
            }
        }

        if (mdxArtifacts) {
            delete mdxArtifacts.idFragment;
        }

        return input;
    };

    return getHtmlAsync;
};
