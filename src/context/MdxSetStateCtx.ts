import {createContext} from 'react';
import type {MdxStateCtxValue} from './MdxStateCtx';

export type MdxSetStateCtxValue = null | ((state: MdxStateCtxValue) => void);

export const MdxSetStateCtx = createContext<MdxSetStateCtxValue | null>(null);
