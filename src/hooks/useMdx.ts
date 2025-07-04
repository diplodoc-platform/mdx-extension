import React from 'react';
import type {MdxArtifacts} from '../types';
import {idMdxToComponents, renderMdxComponents} from '../utils/internal/common';
import type {MDXComponents} from 'mdx/types';
import usePortals from './usePortals';

export interface UseMdxProps {
    html: string;
    refCtr: React.MutableRefObject<HTMLElement | null>;
    components?: MDXComponents;
    pureComponents?: MDXComponents;
    mdxArtifacts?: MdxArtifacts;
}

const useMdx = ({refCtr, html, components, pureComponents, mdxArtifacts}: UseMdxProps) => {
    const refUmount = React.useRef(() => {});

    const {portalsNode, setPortal} = usePortals();

    const combinedComponents = React.useMemo(
        () => ({...components, ...pureComponents}),
        [components, pureComponents],
    );

    // building mdx scripts into components
    const idMdxComponent = React.useMemo(
        () => idMdxToComponents(mdxArtifacts?.idMdx),
        [mdxArtifacts?.idMdx],
    );

    const idTagName = React.useMemo(() => mdxArtifacts?.idTagName ?? {}, [mdxArtifacts]);

    // render new html
    React.useLayoutEffect(() => {
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
    React.useLayoutEffect(() => {
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
        });
    }, [refCtr, html, combinedComponents, idMdxComponent, idTagName, setPortal]);

    return portalsNode;
};

export default useMdx;
