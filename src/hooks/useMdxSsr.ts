import React from 'react';
import type {MdxArtifacts} from '../types';
import {idMdxToComponents, renderMdxComponents} from '../utils/common';
import type {MDXComponents} from 'mdx/types';

interface UseMdxSsrProps {
    html: string;
    refCtr: React.MutableRefObject<HTMLElement | null>;
    components?: MDXComponents;
    pureComponents?: MDXComponents;
    mdxArtifacts?: MdxArtifacts;
}

const useMdxSsr = ({html, refCtr, mdxArtifacts, components, pureComponents}: UseMdxSsrProps) => {
    const refUmount = React.useRef(() => {});

    const combinedComponents = React.useMemo(
        () => ({...components, ...pureComponents}),
        [components, pureComponents],
    );

    // building mdx scripts into components
    const idMdxComponent = React.useMemo(
        () => idMdxToComponents(mdxArtifacts?.idMdx),
        [mdxArtifacts?.idMdx],
    );

    // umount mdx components when html or refCtr changes
    React.useLayoutEffect(() => {
        return () => refUmount.current();
    }, [html, refCtr]);

    // render mdx
    React.useLayoutEffect(() => {
        const ctr = refCtr.current;
        if (!ctr) {
            throw new Error('ctr is null');
        }

        refUmount.current = renderMdxComponents({
            idMdxComponent,
            ctr,
            components: combinedComponents,
            isSSR: true,
        });
    }, [html, refCtr, combinedComponents, idMdxComponent]);
};

export default useMdxSsr;
