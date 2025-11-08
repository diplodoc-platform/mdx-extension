'use client';
import React, {FC, Fragment, useEffect, useRef} from 'react';
import '@diplodoc/transform/dist/css/yfm.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import {type IdMdxComponentLoader, MdxArtifacts, useMdxSsr} from '@plugin';
import {COMPONENTS, CONTEXT_LIST, PURE_COMPONENTS} from '@/components';
import {MDXModule, MDXProps} from 'mdx/types';
import * as runtime from 'react/jsx-runtime';
import {executeCodeWithPromise} from '@/utils/utils';

interface HomeProps {
    html: string;
    mdxArtifacts?: MdxArtifacts;
    withLoader?: boolean;
}

const Home: FC<HomeProps> = ({html, mdxArtifacts, withLoader}) => {
    const refYfm = useRef<HTMLDivElement>(null);
    const [isSuccess, setSuccess] = React.useState(false);
    const [data, setData] = React.useState<IdMdxComponentLoader['data']>(undefined);

    const portalsNode = useMdxSsr({
        refCtr: refYfm,
        components: COMPONENTS,
        pureComponents: PURE_COMPONENTS,
        contextList: CONTEXT_LIST,
        mdxArtifacts,
        html,
        idMdxComponentLoader: withLoader ? {isSuccess, data} : undefined,
    });

    const innerHtml = React.useMemo(() => {
        return {__html: html};
    }, [html]);

    useEffect(() => {
        if (!withLoader) return;
        (async () => {
            const idMdxComponent: Record<string, React.ComponentType<MDXProps>> = {};

            for (const [artifactId, code] of Object.entries(mdxArtifacts?.idMdx ?? {})) {
                const fn = await executeCodeWithPromise<(r: typeof runtime) => MDXModule>(code);
                idMdxComponent[artifactId] = fn(runtime).default;
            }

            setData(idMdxComponent);
            setSuccess(true);
        })();
    }, [mdxArtifacts]);

    return (
        <Fragment>
            <div ref={refYfm} className={'yfm'} dangerouslySetInnerHTML={innerHtml} />
            {portalsNode}
        </Fragment>
    );
};

export default Home;
