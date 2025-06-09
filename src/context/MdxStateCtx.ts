import {createContext} from 'react';

export type MdxStateCtxValue = Record<string, unknown>;

export const MdxStateCtx = createContext<MdxStateCtxValue>({});
