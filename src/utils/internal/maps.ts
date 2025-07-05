import React from 'react';

export const portalWrapperComponentMap = new WeakMap<React.ComponentType, React.ComponentType>();

export const componentGetInitProps = new WeakMap<
    React.ComponentType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => Promise<unknown> | unknown
>();
