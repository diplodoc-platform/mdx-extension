import React, {useLayoutEffect, useMemo, useRef} from 'react';
import type {MdxArtifacts, ReactContextLike} from '../types';
import {idMdxToComponents, isReactContext, renderMdxComponents} from '../utils/internal/common';
import type {MDXComponents} from 'mdx/types';
import usePortals from './internal/usePortals';
import useContextProxy from './internal/useContextProxy';

export interface UseMdxSsrProps {
    html: string;
    refCtr: React.MutableRefObject<HTMLElement | null>;
    components?: MDXComponents;
    pureComponents?: MDXComponents;
    mdxArtifacts?: MdxArtifacts;
    contextList?: ReactContextLike[];
}

const useMdxSsr = ({
    html,
    refCtr,
    mdxArtifacts,
    components,
    pureComponents,
    contextList,
}: UseMdxSsrProps) => {
    isReactContext<undefined | React.Context<unknown>>(contextList);

    const refUmount = useRef(() => {});

    const {portalsNode, setPortal} = usePortals();

    const combinedComponents = useMemo(
        () => ({...components, ...pureComponents}),
        [components, pureComponents],
    );

    // building mdx scripts into components
    const idMdxComponent = useMemo(
        () => idMdxToComponents(mdxArtifacts?.idMdx),
        [mdxArtifacts?.idMdx],
    );

    const idTagName = useMemo(() => mdxArtifacts?.idTagName ?? {}, [mdxArtifacts]);

    const {getCtxEmitterRef, listenerNode} = useContextProxy(contextList);

    // umount mdx components when html or refCtr changes
    useLayoutEffect(() => {
        return () => refUmount.current();
    }, [html, refCtr]);

    // render mdx
    useLayoutEffect(() => {
        const ctr = refCtr.current;
        if (!ctr) {
            throw new Error('ctr is null');
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
    ]);

    return React.createElement(React.Fragment, null, portalsNode, listenerNode);
};

export default useMdxSsr;
