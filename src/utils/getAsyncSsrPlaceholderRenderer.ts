import type {GetHtmlProps} from './internal/types';
import {MDX_PREFIX, TAG_NAME} from '../constants';
import {generateUniqueId} from './internal/common';

function getAsyncSsrPlaceholderRenderer() {
    let idx = 0;

    const getHtml = ({mdx, tagName, mdxArtifacts}: GetHtmlProps) => {
        if (!mdxArtifacts.idFragment) {
            mdxArtifacts.idFragment = [];
        }
        const idFragment = mdxArtifacts.idFragment;

        const id = `${MDX_PREFIX}${++idx}`;
        const replacer = `<${TAG_NAME} class="${id}">${generateUniqueId()}</${TAG_NAME}>`;
        idFragment.push({id, replacer, mdx, tagName});
        return replacer;
    };

    return getHtml;
}

export default getAsyncSsrPlaceholderRenderer;