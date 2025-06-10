import React from 'react';
import type {MDXComponents} from 'mdx/types';
import {run} from '@mdx-js/mdx';
import type {MdxStateCtxValue} from '../../context';

export type ComponentBaseProps = {
    children?: React.ReactNode;
};

export const componentGetInitProps = new WeakMap<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.ComponentType<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => Promise<unknown> | unknown
>();

const getInitPropsFn = <C extends React.ComponentType, T = React.ComponentProps<C>>(
    component: React.ComponentType,
) => {
    return componentGetInitProps.get(component) as (
        props: Object,
        mdxState: MdxStateCtxValue,
    ) => Promise<T> | T;
};

const getPropsKey = (name: string, props: ComponentBaseProps) => {
    const {children: _, ...reset} = props;
    return JSON.stringify([name, reset]);
};

export const getComponentInitProps = async (
    components: MDXComponents,
    vFile: Parameters<typeof run>[0],
) => {
    const usedComponents = new Set<string>();
    const componentList = Object.values(components);
    const componentNameList = Object.keys(components);

    const componentsOverrides: MDXComponents = {};
    const keyInitFnList: ((state: MdxStateCtxValue) => Promise<void>)[] = [];
    const keyInitFnResult: Record<string, {}> = {};
    const fakeJsx = (mdxComponent: MDXComponents['string'], props: ComponentBaseProps) => {
        const component = mdxComponent as React.ComponentType;
        const idx = componentList.indexOf(component);
        if (idx !== -1) {
            const name = componentNameList[idx];
            usedComponents.add(name);

            const fn = getInitPropsFn(component);
            if (fn) {
                const clearProps = removeReactNodeProps(props);
                const uKey = getPropsKey(name, clearProps);
                keyInitFnList.push((mdxState) =>
                    Promise.resolve(fn(clearProps, mdxState)).then((p) => {
                        keyInitFnResult[uKey] = p;
                    }),
                );

                componentsOverrides[name] = (propsLocal) => {
                    const clearPropsLocal = removeReactNodeProps(propsLocal);
                    const uKeyLocal = getPropsKey(name, clearPropsLocal);
                    return React.createElement(component, {
                        ...propsLocal,
                        ...keyInitFnResult[uKeyLocal],
                    });
                };
            }
        }
        return React.createElement(React.Fragment);
    };

    const {default: trackComponent} = await run(vFile, {
        Fragment: () => {},
        jsx: fakeJsx,
        jsxs: fakeJsx,
    });
    trackComponent({components: components});

    const initComponents = async (mdxState: MdxStateCtxValue) => {
        await Promise.all(keyInitFnList.map((fn) => fn(mdxState)));
    };

    let renderComponents = components;
    if (keyInitFnList.length) {
        renderComponents = {...components, ...componentsOverrides};
    }

    return {initComponents, renderComponents, usedComponents};
};

export function generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function hasReactNode(value: unknown): boolean {
    if (React.isValidElement(value)) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.some(hasReactNode);
    }

    if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(hasReactNode);
    }

    return false;
}

function removeReactNodeProps<T extends Record<string, unknown>>(props: T): Partial<T> {
    const result: Partial<T> = {};

    for (const key in props) {
        if (!hasReactNode(props[key])) {
            result[key] = props[key];
        }
    }

    return result;
}
