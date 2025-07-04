import {runSync} from '@mdx-js/mdx';
import {type Root, createRoot, hydrateRoot} from 'react-dom/client';
import * as runtime from 'react/jsx-runtime';
import React from 'react';
import type {MDXComponents, MDXProps} from 'mdx/types';
import {type MdxPortalCtxSetterProps, MdxPortalSetterCtx, MdxStateCtx} from '../../context';

const nodeRootMap = new WeakMap<Element, Root>();
const nodeWillUmount = new WeakMap<Element, boolean>();

interface RenderMdxComponentsProps {
    ctr: HTMLElement;
    isSSR?: boolean;
    components?: MDXComponents;
    idMdxComponent: Record<string, React.ComponentType<MDXProps>>;
    setPortal: (props: MdxPortalCtxSetterProps) => void;
}

export const renderMdxComponents = ({
    idMdxComponent,
    isSSR,
    ctr,
    components,
    setPortal,
}: RenderMdxComponentsProps) => {
    const unmountFns = Object.entries(idMdxComponent).map(([id, Content]) => {
        let node = ctr.querySelector<HTMLElement>(`.${id}`);
        if (!node) {
            throw new Error('node is null');
        }

        if (nodeWillUmount.get(node) && node.parentNode) {
            const newNode = node.cloneNode(true) as HTMLElement;
            node.parentNode.replaceChild(newNode, node);
            node = newNode;
        }

        const mdxState = node?.dataset?.mdxState ? JSON.parse(node.dataset.mdxState) : null;

        const reactNode = React.createElement(MdxPortalSetterCtx.Provider, {
            value: setPortal,
            children: React.createElement(MdxStateCtx.Provider, {
                value: mdxState,
                children: React.createElement(Content, {
                    components,
                }),
            }),
        });

        let root = nodeRootMap.get(node);
        if (root) {
            root.render(reactNode);
        } else {
            const options = {
                identifierPrefix: id,
            };
            if (isSSR) {
                root = hydrateRoot(node, reactNode, options);
            } else {
                root = createRoot(node, options);
                root.render(reactNode);
            }
            nodeRootMap.set(node, root);
        }

        return () => {
            nodeWillUmount.set(node, true);
            setTimeout(() => root.unmount(), 0);
        };
    });

    return () => unmountFns.forEach((cb) => cb());
};

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

export function wrapObject<T extends Object>(obj: T, onGet: (name: string) => void) {
    return Object.entries(obj).reduce<T>((acc, [key, value]) => {
        Object.defineProperty(acc, key, {
            get: () => {
                onGet(key);
                return value;
            },
            enumerable: true,
        });
        return acc;
    }, {} as T);
}

export function escapeAttribute(value: unknown) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function isEmptyObject(obj: Object) {
    // eslint-disable-next-line guard-for-in
    for (const _key in obj) {
        return false;
    }
    return true;
}

export function generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
