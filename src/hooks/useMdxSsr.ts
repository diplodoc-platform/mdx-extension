import React, {useLayoutEffect, useMemo, useRef} from 'react';
import type {ContextList, IdMdxComponentLoader, MdxArtifacts} from '../types';
import {idMdxToComponents, renderMdxComponents} from '../utils/internal/common';
import type {MDXComponents} from 'mdx/types';
import usePortals from './internal/usePortals';
import useContextProxy from './internal/useContextProxy';

export interface UseMdxSsrProps {
    html: string;
    refCtr: React.RefObject<HTMLElement | null>;
    components?: MDXComponents;
    pureComponents?: MDXComponents;
    mdxArtifacts?: MdxArtifacts;
    contextList?: ContextList;
    idMdxComponentLoader?: IdMdxComponentLoader;
}

const useMdxSsr = ({
    html,
    refCtr,
    mdxArtifacts,
    components,
    pureComponents,
    contextList,
    idMdxComponentLoader,
}: UseMdxSsrProps) => {
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

    // umount mdx components when html or refCtr changes
    useLayoutEffect(() => {
        return () => refUmount.current();
    }, [html, refCtr]);

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
            isSSR: true,
        });
    }, [
        html,
        refCtr,
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

export default useMdxSsr;
