import type {MDXComponents} from 'mdx/types';
import {type CompileOptions, compileSync} from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import React from 'react';
import {TAG_NAME} from '../../constants';
import {renderToString} from 'react-dom/server';
import {getCtxFromCtxItem, isPortal, runSync} from './common';
import {MdxSetStateCtx, MdxStateCtx, type MdxStateCtxValue} from '../../context';
import {MdxPortalSetterCtx} from '../../context/internal/MdxPortalSetterCtx';
import {
    escapeAttribute,
    isEmptyObject,
    trimComponentWrapper,
    trimPortalTag,
    wrapObject,
} from './ssr';
import type {ContextList} from '../../types';

export interface CreateSsrRenderProps {
    components?: MDXComponents;
    pureComponents?: MDXComponents;
    compileOptions?: CompileOptions;
    contextList?: ContextList;
}

export const createSsrRender = ({
    components,
    pureComponents,
    compileOptions,
    contextList = [],
}: CreateSsrRenderProps) => {
    const componentsNames = Object.keys(components || {});
    const usedComponents = new Set<string>();
    const combinedComponents = {
        ...components,
        ...pureComponents,
    };
    const combinedComponentsWatch = wrapObject(combinedComponents, (name) =>
        usedComponents.add(name),
    );

    const render = (id: string, mdx: string, tagName: string) => {
        const vFile = compileSync(mdx, {
            ...compileOptions,
            outputFormat: 'function-body',
        });

        let code: string | undefined = vFile.toString();
        const {default: Component} = runSync(code, runtime);

        const isTopLevelPortal = isPortal(combinedComponents[tagName] as React.ElementType);

        const state = {};
        const setState = (value: MdxStateCtxValue) => {
            Object.assign(state, value);
        };

        const options = {
            identifierPrefix: id,
        };

        usedComponents.clear();
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
                                children: React.createElement(Component, {
                                    components: combinedComponentsWatch,
                                }),
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
