import React from 'react';
import {componentGetInitProps} from './internal/asyncRenderTools';
import type {MDXGetInitialProps} from '../types';

const withInitialProps = <A = {}, T = React.ComponentType<A>>(
    component: T,
    getInitProps: MDXGetInitialProps<A, never, never>,
): T => {
    componentGetInitProps.set(component as React.ComponentType<A>, getInitProps);
    return component as T;
};

export default withInitialProps;
