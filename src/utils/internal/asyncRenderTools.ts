import React from 'react';
import type {MdxStateCtxValue} from '../../context';
import * as runtime from 'react/jsx-runtime';
import {componentGetInitProps, portalWrapperComponentMap} from './maps';

const getInitPropsFn = (component: React.ElementType) => {
    if (!component || typeof component !== 'object') return;
    const origComponent = portalWrapperComponentMap.get(component);
    const initFn =
        componentGetInitProps.get(component) ??
        (origComponent && componentGetInitProps.get(origComponent));
    return initFn;
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
            const initFn = getInitPropsFn(component);
            if (initFn) {
                const readyProps = await initFn(props, state);
                args[1] = readyProps;
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
        const arr = thing;
        for (let i = 0, len = arr.length; i < len; i++) {
            // eslint-disable-next-line no-param-reassign
            arr[i] = replaceComponentRefs(arr[i]);
        }
        return arr;
    }

    if (typeof thing === 'object' && thing !== null) {
        const obj = thing as Record<string, unknown>;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key as keyof typeof obj] = replaceComponentRefs(obj[key]);
            }
        }
    }

    return thing;
}
