import {type Root, createRoot, hydrateRoot} from 'react-dom/client';
import * as runtime from 'react/jsx-runtime';
import React from 'react';
import type {MDXComponents, MDXProps} from 'mdx/types';
import {MdxStateCtx} from '../../context';
import {
    type MdxPortalCtxSetterProps,
    MdxPortalSetterCtx,
} from '../../context/internal/MdxPortalSetterCtx';
import {portalWrapperComponentMap} from './maps';
import type {MdxArtifacts} from '../../types';

const nodeRootMap = new WeakMap<Element, Root>();
const nodeWillUmount = new WeakMap<Element, boolean>();
const nodePortalCleanup = new WeakMap<Element, boolean>();

interface RenderMdxComponentsProps {
    ctr: HTMLElement;
    isSSR?: boolean;
    components?: MDXComponents;
    idMdxComponent: Record<string, React.ComponentType<MDXProps>>;
    idTagName: Record<string, string>;
    setPortal: (props: MdxPortalCtxSetterProps) => void;
}

export const renderMdxComponents = ({
    idMdxComponent,
    isSSR,
    ctr,
    components,
    setPortal,
    idTagName,
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

        const contentNode = React.createElement(MdxStateCtx.Provider, {
            value: mdxState,
            children: React.createElement(Content, {
                components,
            }),
        });

        const isTopLevelPortal =
            components && isPortal(components[idTagName[id]] as React.ComponentType);

        let root: Root | undefined;
        if (isTopLevelPortal) {
            if (!nodePortalCleanup.has(node)) {
                nodePortalCleanup.set(node, true);
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }
            }
            setPortal({
                id,
                node,
                reactNode: contentNode,
            });
        } else {
            const reactNode = React.createElement(MdxPortalSetterCtx.Provider, {
                value: setPortal,
                children: contentNode,
            });
            root = nodeRootMap.get(node);
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
        }

        return () => {
            nodeWillUmount.set(node, true);
            if (isTopLevelPortal) {
                setPortal({
                    id,
                    node: null,
                    reactNode: null,
                });
            } else if (root) {
                setTimeout(() => root.unmount(), 0);
            }
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

export function generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function isPortal(component: React.ComponentType) {
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
