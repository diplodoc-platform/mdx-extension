import React from 'react';
import type {MDXGetInitialProps} from '../types';
import {componentGetInitProps} from './internal/maps';

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
