import React from 'react';
import {componentGetInitProps} from './internal/asyncRenderTools';
import type {MdxStateCtxValue} from '../context';

const withInitialProps = <A = {}, T = React.ComponentType<A>>(
    component: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInitProps: (props: any, mdxState: MdxStateCtxValue) => Promise<A> | A,
): T => {
    componentGetInitProps.set(component as React.ComponentType<A>, getInitProps);
    return component as T;
};

export default withInitialProps;
