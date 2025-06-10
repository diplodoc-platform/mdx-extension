import React from 'react';
import type {MDXComponents} from 'mdx/types';
import {run} from '@mdx-js/mdx';
import type {MdxStateCtxValue} from '../../context';
import * as runtime from 'react/jsx-runtime';
import {HOOK_ARG} from '../../constants';

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

export const getComponentInitProps = async (
    components: MDXComponents,
    vFile: Parameters<typeof run>[0],
) => {
    const usedComponents = new Set<string>();
    const componentList = Object.values(components);
    const componentNameList = Object.keys(components);

    const componentsOverrides: MDXComponents = {};
    const keyInitFnList: ((state: MdxStateCtxValue) => Promise<void>)[] = [];
    let callIdx = 0;
    const idxInitFnResult = new Map<number, {}>();
    const fakeJsx = (mdxComponent: MDXComponents['string'], props: ComponentBaseProps) => {
        const component = mdxComponent as React.ComponentType;
        const listIdx = componentList.indexOf(component);
        if (listIdx !== -1) {
            const name = componentNameList[listIdx];
            usedComponents.add(name);

            const fn = getInitPropsFn(component);
            if (fn) {
                const currentCallIdx = ++callIdx;
                const clearProps = removeReactNodeProps(props);
                keyInitFnList.push((mdxState) =>
                    Promise.resolve(fn(clearProps, mdxState)).then((p) => {
                        idxInitFnResult.set(currentCallIdx, p);
                    }),
                );

                componentsOverrides[name] = (propsLocal: {[HOOK_ARG]: number}) => {
                    const {[HOOK_ARG]: id, ...rest} = propsLocal;
                    return React.createElement(component, {
                        ...rest,
                        ...idxInitFnResult.get(id),
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

    return {
        initComponents,
        renderComponents,
        usedComponents,
        componentsWithHooks: componentsOverrides,
    };
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

export function getRuntimeWithHook(nameComponent: MDXComponents) {
    const components = Object.values(nameComponent);
    const runtimeCopy = {...runtime};
    let callIdx = 0;
    ['jsx' as const, 'jsxs' as const].forEach((key) => {
        const origFn = runtimeCopy[key];
        if (typeof origFn !== 'function') return;
        runtimeCopy[key] = function (...args) {
            if (components.includes(args[0])) {
                const props = args[1] as {[HOOK_ARG]: number};
                if (props && typeof props === 'object') {
                    props[HOOK_ARG] = ++callIdx;
                }
            }
            return origFn.apply(runtimeCopy, args);
        };
    });
    return runtimeCopy;
}
