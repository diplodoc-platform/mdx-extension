import type {MDXComponents} from 'mdx/types';
import {type CompileOptions, type RunOptions, compile, run} from '@mdx-js/mdx';
import React from 'react';
import type {MdxArtifacts} from '../types';
import {MDX_PREFIX, TAG_NAME} from '../constants';
import {renderToString} from 'react-dom/server';
import {escapeAttribute, isEmptyObject, wrapObject} from './internal/common';
import {MdxSetStateCtx, MdxStateCtx, type MdxStateCtxValue} from '../context';
import {
    AsyncComponentWrapper,
    generateUniqueId,
    getMdxRuntimeWithHook,
} from './internal/asyncRenderTools';

export interface GetAsyncSsrRendererProps {
    components?: MDXComponents;
    pureComponents?: MDXComponents;
    compileOptions?: CompileOptions;
}

const getAsyncSsrRenderer = ({
    components,
    pureComponents,
    compileOptions,
}: GetAsyncSsrRendererProps) => {
    const componentsNames = Object.keys(components || {});

    const usedComponents = new Set<string>();
    const combinedComponents = wrapObject(
        {
            ...components,
            ...pureComponents,
        },
        (name) => usedComponents.add(name),
    );

    const render = async (id: string, mdx: string) => {
        const vFile = await compile(mdx, {
            ...compileOptions,
            outputFormat: 'function-body',
        });

        const state: MdxStateCtxValue = {};
        const setState = (value: MdxStateCtxValue) => {
            Object.assign(state, value);
        };

        const {runtime, init} = getMdxRuntimeWithHook();
        const {default: componentFn} = await run(vFile, runtime as unknown as RunOptions);

        usedComponents.clear();
        const asyncWrapper = componentFn({
            components: combinedComponents,
        }) as unknown as AsyncComponentWrapper;
        await init(state);

        const Component = () => asyncWrapper.build();

        let code: string | undefined = vFile.toString();

        const options = {
            identifierPrefix: id,
        };

        let html = renderToString(
            React.createElement(TAG_NAME, {
                className: id,
                children: React.createElement(MdxSetStateCtx.Provider, {
                    value: setState,
                    children: React.createElement(MdxStateCtx.Provider, {
                        value: state,
                        children: React.createElement(Component),
                    }),
                }),
            }),
            options,
        );
        if (!isEmptyObject(state)) {
            html = html.replace(
                `${TAG_NAME} `,
                `${TAG_NAME} data-mdx-state="${escapeAttribute(JSON.stringify(state))}" `,
            );
        }
        const withComponents = componentsNames.some((name) => usedComponents.has(name));
        if (!withComponents) {
            const endOpenSpan = html.indexOf('>');
            const startCloseSpan = html.lastIndexOf('<');
            html = html.slice(endOpenSpan + 1, startCloseSpan);
            code = undefined;
        }

        return {html, code};
    };

    const idFragment = new Map<string, {replacer: string; mdx: string}>();

    const getHtmlAsync = async (inputOrig: string, mdxArtifacts: MdxArtifacts) => {
        let input = inputOrig;
        const {idMdx} = mdxArtifacts;

        const items = Array.from(idFragment.entries());

        for (let item, i = 0; (item = items[i]); i++) {
            const [id, {replacer, mdx}] = item;
            const {html, code} = await render(id, mdx);
            input = input.replace(replacer, () => html);
            if (code) {
                idMdx[id] = code;
            }
        }

        return input;
    };

    let idx = 0;

    const getHtml = (mdx: string) => {
        const id = `${MDX_PREFIX}${++idx}`;
        const replacer = `<${TAG_NAME} class="${id}">${generateUniqueId()}</${TAG_NAME}>`;
        idFragment.set(id, {replacer, mdx});
        return replacer;
    };

    return {render: getHtml, renderAsync: getHtmlAsync};
};

export default getAsyncSsrRenderer;
