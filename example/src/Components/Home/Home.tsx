'use client';
import React, {FC, useRef} from 'react';
import '@diplodoc/transform/dist/css/yfm.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import {MdxArtifacts, useMdxSsr} from '@plugin';
import {COMPONENTS} from '@/components';

interface HomeProps {
    html: string;
    mdxArtifacts?: MdxArtifacts;
}

const Home: FC<HomeProps> = ({html, mdxArtifacts}) => {
    const refYfm = useRef<HTMLDivElement>(null);

    useMdxSsr({refCtr: refYfm, components: COMPONENTS, mdxArtifacts, html});

    const innerHtml = React.useMemo(() => {
        return {__html: html};
    }, [html]);

    return <div ref={refYfm} className={'yfm'} dangerouslySetInnerHTML={innerHtml} />;
};

export default Home;
