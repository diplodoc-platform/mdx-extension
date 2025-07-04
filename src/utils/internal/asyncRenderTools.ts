import React from 'react';
import type {MdxStateCtxValue} from '../../context';
import * as runtime from 'react/jsx-runtime';

export const componentGetInitProps = new WeakMap<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.ComponentType<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => Promise<unknown> | unknown
>();

const getInitPropsFn = <C extends React.ComponentType, T = React.ComponentProps<C>>(
    component: React.ComponentType,
) => {
    return componentGetInitProps.get(component) as
        | ((props: Object, mdxState: MdxStateCtxValue) => Promise<T> | T)
        | undefined;
};

type JSXFnParameters = Parameters<typeof runtime.jsx>;

export class AsyncComponentWrapper {
    args;
    jsxs;
    node: React.ReactNode | undefined;
    constructor(jsxs: boolean, args: JSXFnParameters) {
        this.jsxs = jsxs;
        this.args = args;
    }
    build(): React.ReactNode {
        const jsxFn = this.jsxs ? runtime.jsxs : runtime.jsx;
        return jsxFn.apply(runtime, this.args);
    }
}

export function getMdxRuntimeWithHook() {
    const refs: AsyncComponentWrapper[] = [];
    const jsx = function (isJsxs: boolean, ...args: JSXFnParameters) {
        const ref = new AsyncComponentWrapper(isJsxs, args);
        refs.push(ref);
        return ref;
    };
    const rt = {
        Fragment: runtime.Fragment,
        jsx: jsx.bind(null, false),
        jsxs: jsx.bind(null, true),
    };
    const init = async (state: MdxStateCtxValue) => {
        for (let i = 0, len = refs.length; i < len; i++) {
            const ref = refs[i];
            const {args} = ref;
            replaceComponentRefs(args);
            const [component, props] = args;
            const initFn = getInitPropsFn(component as React.ComponentType);
            if (initFn) {
                const readyProps = await initFn(props as {}, state);
                args[1] = {...(props as {}), ...readyProps};
            }
        }
    };
    return {runtime: rt, init};
}

function replaceComponentRefs(thing: unknown): unknown {
    if (thing instanceof AsyncComponentWrapper) {
        return thing.build();
    }

    if (Array.isArray(thing)) {
        const arr = thing as unknown[];
        for (let i = 0, len = arr.length; i < len; i++) {
            // eslint-disable-next-line no-param-reassign
            arr[i] = replaceComponentRefs(arr[i]);
        }
        return arr;
    }

    if (typeof thing === 'object' && thing !== null) {
        const obj = thing as {[key: string]: unknown};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key as keyof typeof obj] = replaceComponentRefs(obj[key]);
            }
        }
    }

    return thing;
}
