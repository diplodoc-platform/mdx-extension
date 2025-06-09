import React from 'react';
import type {MDXComponents} from 'mdx/types';
import {run} from '@mdx-js/mdx';

export type ComponentBaseProps = {
    children?: React.ReactNode;
    key?: string;
};

const componentGetInitProps = new WeakMap<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.ComponentType<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props?: any) => Promise<unknown>
>();

export const withInitProps = <A = {}, T = React.ComponentType<A>>(
    component: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInitProps: (props: any) => Promise<A>,
): T => {
    componentGetInitProps.set(component as React.ComponentType<A>, getInitProps);
    return component as T;
};

export const getInitPropsFn = <C extends React.ComponentType, T = React.ComponentProps<C>>(
    component: React.ComponentType,
) => {
    return componentGetInitProps.get(component) as (props: Object) => Promise<T>;
};

export const getPropsKey = (name: string, props: ComponentBaseProps) => {
    if (props.key) {
        return props.key;
    }
    const {children: _, ...reset} = props;
    return JSON.stringify([name, reset]);
};

export const getComponentInitProps = async (
    components: MDXComponents,
    vFile: Parameters<typeof run>[0],
) => {
    const usedComponents = new Set<string>();
    const renderComponents: MDXComponents = {...components};
    const componentList = Object.values(components);
    const componentNameList = Object.keys(components);

    const keyInitFnList: (() => Promise<void>)[] = [];
    const keyInitFnResult: Record<string, {}> = {};
    const fakeJsx = (mdxComponent: MDXComponents['string'], props: ComponentBaseProps) => {
        const component = mdxComponent as React.ComponentType;
        const idx = componentList.indexOf(component);
        if (idx !== -1) {
            const name = componentNameList[idx];
            usedComponents.add(name);

            const uKey = getPropsKey(name, props as ComponentBaseProps);
            const fn = getInitPropsFn(component);
            if (fn) {
                keyInitFnList.push(() =>
                    fn(props).then((p) => {
                        keyInitFnResult[uKey] = p;
                    }),
                );

                renderComponents[name] = (propsLocal) => {
                    const uKeyLocal = getPropsKey(name, propsLocal as ComponentBaseProps);
                    return React.createElement(component, keyInitFnResult[uKeyLocal]);
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

    const initComponents = async () => {
        await Promise.all(keyInitFnList.map((fn) => fn()));
    };

    return {initComponents, renderComponents, usedComponents};
};

export function generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
