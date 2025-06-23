'use client';
import React, {useMemo, useRef} from 'react';
import {CONTENT} from '@/constants';
import {COMPONENTS, PURE_COMPONENTS} from '@/components';

import '@diplodoc/transform/dist/css/yfm.css';
import transform from '@diplodoc/transform';
import DefaultPlugins from '@diplodoc/transform/lib/plugins';
// eslint-disable-next-line import/no-extraneous-dependencies
import {isWithMdxArtifacts, mdxPlugin, useMdx} from '@plugin';

const NoSsrPage: React.FC = () => {
    const refYfm = useRef<HTMLDivElement>(null);

    const {html, mdxArtifacts} = useMemo(() => {
        const {result} = transform(CONTENT, {
            needToSanitizeHtml: false,
            useCommonAnchorButtons: true,
            plugins: [...DefaultPlugins, mdxPlugin()],
        });

        isWithMdxArtifacts(result);

        return result;
    }, []);

    useMdx({
        refCtr: refYfm,
        html,
        components: COMPONENTS,
        pureComponents: PURE_COMPONENTS,
        mdxArtifacts,
    });

    return <div ref={refYfm} className={'yfm'} />;
};

export default NoSsrPage;
