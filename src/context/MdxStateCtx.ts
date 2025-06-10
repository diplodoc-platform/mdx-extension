import {createContext} from 'react';

export type MdxStateCtxValue<T = Record<string, unknown>> = T | null;

export const MdxStateCtx = createContext<MdxStateCtxValue>(null);
