import { createContext } from "react";
import type { MdxStateCtxValue } from "./MdxStateCtx";

export type MdxSetStateCtxValue =
  | undefined
  | ((state: MdxStateCtxValue) => void);

export const MdxSetStateCtx = createContext<MdxSetStateCtxValue>(undefined);
