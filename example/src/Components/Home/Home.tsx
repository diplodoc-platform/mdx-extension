'use client';
import React, {FC, Fragment, useRef} from 'react';
import '@diplodoc/transform/dist/css/yfm.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import {MdxArtifacts, useMdxSsr} from '@plugin';
import {COMPONENTS, CONTEXT_LIST, PURE_COMPONENTS} from '@/components';

interface HomeProps {
    html: string;
    mdxArtifacts?: MdxArtifacts;
}

const Home: FC<HomeProps> = ({html, mdxArtifacts}) => {
    const refYfm = useRef<HTMLDivElement>(null);

    const portalsNode = useMdxSsr({
        refCtr: refYfm,
        components: COMPONENTS,
        pureComponents: PURE_COMPONENTS,
        contextList: CONTEXT_LIST,
        mdxArtifacts,
        html,
    });

    const innerHtml = React.useMemo(() => {
        return {__html: html};
    }, [html]);

    return (
        <Fragment>
            <div ref={refYfm} className={'yfm'} dangerouslySetInnerHTML={innerHtml} />
            {portalsNode}
        </Fragment>
    );
};

export default Home;
