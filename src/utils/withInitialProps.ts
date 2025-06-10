import React from 'react';
import {componentGetInitProps} from './internal/asyncRenderTools';
import type {MDXGetInitialProps} from '../types';

export interface WithInitialProps {
    <A = {}, T = React.ComponentType<A>>(
        component: T,
        getInitProps: MDXGetInitialProps<A, never, never>,
    ): T;
}

const withInitialProps: WithInitialProps = (component, getInitProps) => {
    componentGetInitProps.set(component as React.ComponentType, getInitProps);
    return component;
};

export default withInitialProps;
