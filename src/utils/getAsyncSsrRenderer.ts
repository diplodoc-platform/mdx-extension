import getPlaceholderRenderer from './getPlaceholderRenderer';
import {type CreateAsyncSsrRenderProps} from './internal/asyncSsrRender';
import {createAsyncPlaceholderRender} from './renderPlaceholder';

export type GetAsyncSsrRendererProps = CreateAsyncSsrRenderProps;

const getAsyncSsrRenderer = (renderProps: GetAsyncSsrRendererProps) => {
    const getHtml = getPlaceholderRenderer();

    const getHtmlAsync = createAsyncPlaceholderRender(renderProps);

    return {render: getHtml, renderAsync: getHtmlAsync};
};

export default getAsyncSsrRenderer;
