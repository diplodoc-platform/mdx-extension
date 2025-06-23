import React, {useCallback, useRef} from 'react';
import useMdxSsr from './useMdxSsr';
import type {DocPageProps} from '@diplodoc/components';

export type RenderBodyHook = DocPageProps['renderBodyHooks'][number];

const withMdxSsr: RenderBodyHook = (Component) => {
    return (props) => {
        const {forwardRef, mdxArtifacts, html} = props;
        const refCtr = useRef<HTMLDivElement | null>(null);
        refCtr.current = null;

        const forwardRefWrap = useCallback(
            (v: HTMLDivElement) => {
                refCtr.current = v;
                return forwardRef(v);
            },
            [forwardRef],
        );

        useMdxSsr({
            refCtr,
            components: {},
            pureComponents: {},
            mdxArtifacts,
            html,
        });

        return React.createElement(Component, {...props, forwardRef: forwardRefWrap});
    };
};

export default withMdxSsr;
