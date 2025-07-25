import {Alert, Button, Label, Skeleton, ThemeContext} from '@gravity-ui/uikit';
import {CompatTable} from '@/Components/CompatTable/CompatTable';
import MermaidDiagram from '@/Components/MermaidDiagram/MermaidDiagram';
import {Counter} from '@/Components/Counter/Counter';
import {TabLocal, TabsLocal} from '@/Components/Tabs/Tabs';
import KatexFormula from '@/Components/KatexFormula/KatexFormula';
// eslint-disable-next-line import/no-extraneous-dependencies
import {type ContextList, withInitialProps, withPortal} from '@plugin';
import {getInitialProps} from '@/Components/Counter/getInitialProps';
import React from 'react';
import ThemeToggle from '@/Components/ThemeToggle/ThemeToggle';
import {SetThemeCtx} from '@/hooks/SetThemeCtx';

export const COMPONENTS = {
    Button,
    Counter,
    Tabs: withPortal(TabsLocal, () => <Skeleton style={{height: `${36}px`}} />),
    Tab: TabLocal,
    MermaidDiagram,
    ThemeToggle,
};

export const SSR_COMPONENTS = {
    ...COMPONENTS,
    Counter: withInitialProps(Counter, getInitialProps),
};

export const PURE_COMPONENTS = {
    KatexFormula,
    Label,
    CompatTable,
    Alert,
};

export const CONTEXT_LIST: ContextList = [
    {
        ctx: ThemeContext,
        initValue: {
            theme: 'light',
            themeValue: 'light',
            direction: 'ltr',
        } satisfies React.ContextType<typeof ThemeContext>,
    },
    SetThemeCtx,
];
