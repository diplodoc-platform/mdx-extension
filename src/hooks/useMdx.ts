import React, {useLayoutEffect, useMemo, useRef} from 'react';
import type {ContextList, IdMdxComponentLoader, MdxArtifacts} from '../types';
import {idMdxToComponents, renderMdxComponents} from '../utils/internal/common';
import type {MDXComponents} from 'mdx/types';
import usePortals from './internal/usePortals';
import useContextProxy from './internal/useContextProxy';

export interface UseMdxProps {
    html: string;
    refCtr: React.RefObject<HTMLElement | null>;
    components?: MDXComponents;
    pureComponents?: MDXComponents;
    mdxArtifacts?: MdxArtifacts;
    contextList?: ContextList;
    idMdxComponentLoader?: IdMdxComponentLoader;
}

const useMdx = ({
    refCtr,
    html,
    components,
    pureComponents,
    mdxArtifacts,
    contextList,
    idMdxComponentLoader,
}: UseMdxProps) => {
    const refUmount = useRef(() => {});

    const {portalsNode, setPortal} = usePortals();

    const combinedComponents = useMemo(
        () => ({...components, ...pureComponents}),
        [components, pureComponents],
    );

    // building mdx scripts into components
    const idMdxComponent = useMemo(
        () =>
            idMdxComponentLoader
                ? idMdxComponentLoader.data
                : idMdxToComponents(mdxArtifacts?.idMdx),
        [mdxArtifacts?.idMdx, idMdxComponentLoader?.data],
    );

    const idTagName = useMemo(() => mdxArtifacts?.idTagName ?? {}, [mdxArtifacts]);

    const {getCtxEmitterRef, listenerNode} = useContextProxy(contextList);

    // render new html
    useLayoutEffect(() => {
        const ctr = refCtr.current;
        if (!ctr) {
            throw new Error('ctr is null');
        }

        const dom = new DOMParser().parseFromString(
            `<html lang="en"><body>${html}</body></html>`,
            'text/html',
        );

        const bodyNode = dom.querySelector('body');
        if (!bodyNode) {
            throw new Error('bodyNode is null');
        }

        const fragment = document.createDocumentFragment();
        fragment.append(...Array.from(bodyNode.childNodes.values()));

        ctr.textContent = null;
        ctr.appendChild(fragment);

        // umount mdx components when html or refCtr changes
        return () => refUmount.current();
    }, [refCtr, html]);

    // render mdx
    useLayoutEffect(() => {
        if (idMdxComponentLoader && !idMdxComponentLoader.isSuccess) {
            return;
        }

        const ctr = refCtr.current;
        if (!ctr) {
            throw new Error('ctr is null');
        }

        if (!idMdxComponent) {
            throw new Error('idMdxComponent is null');
        }

        refUmount.current = renderMdxComponents({
            idMdxComponent,
            idTagName,
            ctr,
            components: combinedComponents,
            setPortal,
            getCtxEmitterRef,
            contextList,
        });
    }, [
        refCtr,
        html,
        combinedComponents,
        idMdxComponent,
        idTagName,
        setPortal,
        getCtxEmitterRef,
        contextList,
        idMdxComponentLoader?.isSuccess,
    ]);

    return React.createElement(React.Fragment, null, portalsNode, listenerNode);
};

export default useMdx;
