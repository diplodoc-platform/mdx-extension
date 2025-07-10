import {createContext} from 'react';
import {Theme} from '@gravity-ui/uikit';

export const SetThemeCtx = createContext<(theme: Theme) => void>(() => {});
