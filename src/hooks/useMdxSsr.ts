import React, {useLayoutEffect, useMemo, useRef} from 'react';
import type {MdxArtifacts} from '../types';
import {idMdxToComponents, renderMdxComponents} from '../utils/internal/common';
import type {MDXComponents} from 'mdx/types';
import usePortals from './internal/usePortals';

export interface UseMdxSsrProps {
    html: string;
    refCtr: React.MutableRefObject<HTMLElement | null>;
    components?: MDXComponents;
    pureComponents?: MDXComponents;
    mdxArtifacts?: MdxArtifacts;
}

const useMdxSsr = ({html, refCtr, mdxArtifacts, components, pureComponents}: UseMdxSsrProps) => {
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
            isSSR: true,
            setPortal,
        });
    }, [html, refCtr, combinedComponents, idMdxComponent, idTagName, setPortal]);

    return portalsNode;
};

export default useMdxSsr;
