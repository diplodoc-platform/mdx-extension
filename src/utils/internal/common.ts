import * as runtime from 'react/jsx-runtime';
import React from 'react';
import type {MDXProps} from 'mdx/types';
import {portalWrapperComponentMap} from './maps';
import type {ContextWithValue, MdxArtifacts, ReactContextLike} from '../../types';

export const idMdxToComponents = (idMdx?: Record<string, string>) => {
    return Object.entries(idMdx ?? {}).reduce<Record<string, React.ComponentType<MDXProps>>>(
        (acc, [id, fnStr]) => {
            // eslint-disable-next-line no-param-reassign
            acc[id] = runSync(fnStr, runtime).default;
            return acc;
        },
        {},
    );
};

export function generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function isPortal(component: React.ElementType) {
    if (!component || typeof component !== 'object') return false;
    return portalWrapperComponentMap.has(component);
}

export function getInitMdxArtifacts(): MdxArtifacts {
    return {idMdx: {}, idTagName: {}};
}

// runSync from @mdx-js/mdx
export function runSync(code: string, options: unknown) {
    // eslint-disable-next-line no-new-func
    return new Function(String(code))(options);
}

export function getCtxFromCtxItem<T>(ctxItem: ReactContextLike<T> | ContextWithValue<T>) {
    let ctx;
    let initValue: unknown | undefined;
    if ('ctx' in ctxItem) {
        ctx = ctxItem.ctx;
        initValue = ctxItem.initValue;
    } else {
        ctx = ctxItem;
    }
    return {
        ctx: ctx as React.Context<T>,
        initValue,
    };
}
