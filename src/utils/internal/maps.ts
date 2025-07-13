import React from 'react';
import type {MdxStateCtxValue} from '../../context';

export const portalWrapperComponentMap = new WeakMap<React.ComponentType, React.ComponentType>();

export type IGetInitProps = (
    props: unknown,
    mdxState: MdxStateCtxValue,
) => Promise<unknown> | unknown;

export const componentGetInitProps = new WeakMap<React.ComponentType, IGetInitProps>();
