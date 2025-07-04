import React, {createContext} from 'react';

export interface MdxPortalCtxSetterProps {
    id: string;
    node: HTMLSpanElement | null;
    reactNode: React.ReactNode | null;
}

export type MdxPortalCtxSetter = (props: MdxPortalCtxSetterProps) => void;

export const MdxPortalSetterCtx = createContext<MdxPortalCtxSetter | null>(null);
