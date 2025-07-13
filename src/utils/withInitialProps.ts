import React from 'react';
import type {MDXGetInitialProps} from '../types';
import {type IGetInitProps, componentGetInitProps} from './internal/maps';

export interface WithInitialProps {
    <A = unknown, T = React.ComponentType<A>>(component: T, getInitProps: MDXGetInitialProps<A>): T;
}

const withInitialProps: WithInitialProps = (component, getInitProps) => {
    componentGetInitProps.set(component as React.ComponentType, getInitProps as IGetInitProps);
    return component;
};

export default withInitialProps;
