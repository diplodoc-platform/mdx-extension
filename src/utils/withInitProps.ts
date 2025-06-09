import React from 'react';
import {componentGetInitProps} from './internal/asyncRenderTools';

const withInitProps = <A = {}, T = React.ComponentType<A>>(
    component: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInitProps: (props: any) => Promise<A>,
): T => {
    componentGetInitProps.set(component as React.ComponentType<A>, getInitProps);
    return component as T;
};

export default withInitProps;
