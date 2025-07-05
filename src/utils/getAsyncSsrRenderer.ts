import type {MDXComponents} from 'mdx/types';
import {type CompileOptions, type RunOptions, compile, run} from '@mdx-js/mdx';
import React from 'react';
import type {MdxArtifacts} from '../types';
import {MDX_PREFIX, TAG_NAME} from '../constants';
import {renderToString} from 'react-dom/server';
import {generateUniqueId, isPortal} from './internal/common';
import {MdxSetStateCtx, MdxStateCtx, type MdxStateCtxValue} from '../context';
import {MdxPortalSetterCtx} from '../context/internal/MdxPortalSetterCtx';
import {AsyncComponentWrapper, getMdxRuntimeWithHook} from './internal/asyncRenderTools';
import type {GetHtmlProps} from './internal/types';
import {
    escapeAttribute,
    isEmptyObject,
    trimComponentWrapper,
    trimPortalTag,
    wrapObject,
} from './internal/ssr';

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
    const combinedComponents = {
        ...components,
        ...pureComponents,
    };

    const render = async (id: string, mdx: string, tagName: string) => {
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

        const isTopLevelPortal = isPortal(combinedComponents[tagName] as React.ComponentType);

        const usedComponents = new Set<string>();
        const combinedComponentsWatch = wrapObject(combinedComponents, (name) =>
            usedComponents.add(name),
        );

        const asyncWrapper = componentFn({
            components: combinedComponentsWatch,
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
                children: React.createElement(MdxPortalSetterCtx.Provider, {
                    value: () => {},
                    children: React.createElement(MdxSetStateCtx.Provider, {
                        value: setState,
                        children: React.createElement(MdxStateCtx.Provider, {
                            value: state,
                            children: React.createElement(Component),
                        }),
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
            html = trimComponentWrapper(html);
            code = undefined;
        }

        if (isTopLevelPortal) {
            html = trimPortalTag(html);
        }

        return {html, code};
    };

    const idFragment = new Map<string, {replacer: string; mdx: string; tagName: string}>();

    const getHtmlAsync = async (inputOrig: string, mdxArtifacts: MdxArtifacts) => {
        let input = inputOrig;
        const {idMdx, idTagName} = mdxArtifacts;

        const items: {id: string; replacer: string; tagName: string}[] = [];
        const promises: ReturnType<typeof render>[] = [];
        idFragment.forEach(({replacer, mdx, tagName}, id) => {
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

        return input;
    };

    let idx = 0;

    const getHtml = ({mdx, tagName}: GetHtmlProps) => {
        const id = `${MDX_PREFIX}${++idx}`;
        const replacer = `<${TAG_NAME} class="${id}">${generateUniqueId()}</${TAG_NAME}>`;
        idFragment.set(id, {replacer, mdx, tagName});
        return replacer;
    };

    return {render: getHtml, renderAsync: getHtmlAsync};
};

export default getAsyncSsrRenderer;
