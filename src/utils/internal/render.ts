import {type Root, createRoot, hydrateRoot} from 'react-dom/client';
import React from 'react';
import type {MDXComponents, MDXProps} from 'mdx/types';
import {MdxStateCtx} from '../../context';
import {
    type MdxPortalCtxSetterProps,
    MdxPortalSetterCtx,
} from '../../context/internal/MdxPortalSetterCtx';
import type {ContextList} from '../../types';
import CtxProxy from '../../components/internal/CtxProxy';
import type {ListenCtxFn} from '../../hooks/internal/useContextProxy';
import {getCtxFromCtxItem, isPortal} from './common';

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
    getCtxEmitterRef: ListenCtxFn;
    contextList?: ContextList;
}

export const renderMdxComponents = ({
    idMdxComponent,
    isSSR,
    ctr,
    components,
    setPortal,
    idTagName,
    getCtxEmitterRef,
    contextList = [],
}: RenderMdxComponentsProps) => {
    const unmountFns = Object.entries(idMdxComponent).map(([id, Content]) => {
        let node = ctr.querySelector<HTMLElement>(`.${id}`);
        if (!node) {
            return () => {};
        }

        if (nodeWillUmount.get(node) && node.parentNode) {
            const newNode = node.cloneNode(true) as HTMLElement;
            node.parentNode.replaceChild(newNode, node);
            node = newNode;
        }

        const mdxState = node?.dataset?.mdxState ? JSON.parse(node.dataset.mdxState) : null;

        const contentNode: React.ReactNode = React.createElement(MdxStateCtx.Provider, {
            value: mdxState,
            children: React.createElement(Content, {
                components,
            }),
        });

        const isTopLevelPortal =
            components && isPortal(components[idTagName[id]] as React.ElementType);

        let root: Root | undefined;
        if (isTopLevelPortal) {
            if (!nodePortalCleanup.has(node)) {
                nodePortalCleanup.set(node, true);
                node.textContent = null;
            }
            setPortal({
                id,
                node,
                reactNode: contentNode,
            });
        } else {
            const reactNode = React.createElement(MdxPortalSetterCtx.Provider, {
                value: setPortal,
                children: contextList.reduce((acc, ctxItem) => {
                    const {ctx} = getCtxFromCtxItem(ctxItem);
                    const {ref, value} = getCtxEmitterRef(Content, ctx);
                    return React.createElement(CtxProxy, {
                        ref,
                        ctx,
                        children: acc,
                        initValue: value,
                    });
                }, contentNode),
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
            getCtxEmitterRef(Content, null);
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
