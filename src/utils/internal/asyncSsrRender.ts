import {type RunOptions, compile, run} from '@mdx-js/mdx';
import React from 'react';
import {TAG_NAME} from '../../constants';
import {renderToString} from 'react-dom/server';
import {getCtxFromCtxItem, isPortal} from './common';
import {MdxSetStateCtx, MdxStateCtx, type MdxStateCtxValue} from '../../context';
import {MdxPortalSetterCtx} from '../../context/internal/MdxPortalSetterCtx';
import {AsyncComponentWrapper, getMdxRuntimeWithHook} from './asyncRenderTools';
import {
    escapeAttribute,
    isEmptyObject,
    trimComponentWrapper,
    trimPortalTag,
    wrapObject,
} from './ssr';
import type {CreateSsrRenderProps} from './ssrRender';

export type CreateAsyncSsrRenderProps = CreateSsrRenderProps;

export const createAsyncSsrRender = ({
    components,
    pureComponents,
    compileOptions,
    contextList = [],
}: CreateAsyncSsrRenderProps) => {
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

        const isTopLevelPortal = isPortal(combinedComponents[tagName] as React.ElementType);

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
                children: contextList.reduce<React.ReactNode>(
                    (acc, ctxItem) => {
                        const {ctx, initValue} = getCtxFromCtxItem(ctxItem);
                        return React.createElement(ctx.Provider, {
                            value: initValue,
                            children: acc,
                        });
                    },
                    React.createElement(MdxPortalSetterCtx.Provider, {
                        value: () => {},
                        children: React.createElement(MdxSetStateCtx.Provider, {
                            value: setState,
                            children: React.createElement(MdxStateCtx.Provider, {
                                value: state,
                                children: React.createElement(Component),
                            }),
                        }),
                    }),
                ),
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

    return render;
};
