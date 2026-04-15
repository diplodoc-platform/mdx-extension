import {MDX_PREFIX} from '../constants';
import type {GetHtmlProps} from './internal/types';
import {type CreateSsrRenderProps, createSsrRender} from './internal/ssrRender';

export interface GetSsrRendererProps extends CreateSsrRenderProps {}

const getSsrRenderer = (renderProps: GetSsrRendererProps) => {
    const render = createSsrRender(renderProps);

    let idx = 0;

    const getHtml = ({mdx, mdxArtifacts, tagName}: GetHtmlProps) => {
        const {idMdx, idTagName} = mdxArtifacts;
        const id = `${MDX_PREFIX}${++idx}`;
        const {html, code} = render(id, mdx, tagName);
        if (code) {
            idMdx[id] = code;
            idTagName[id] = tagName;
        }
        return html;
    };

    return getHtml;
};

export default getSsrRenderer;
