import {Alert, Button, Label, Skeleton} from '@gravity-ui/uikit';
import {CompatTable} from '@/Components/CompatTable/CompatTable';
import MermaidDiagram from '@/Components/MermaidDiagram/MermaidDiagram';
import {Counter} from '@/Components/Counter/Counter';
import {TabLocal, TabsLocal} from '@/Components/Tabs/Tabs';
import KatexFormula from '@/Components/KatexFormula/KatexFormula';
// eslint-disable-next-line import/no-extraneous-dependencies
import {withInitialProps, withPortal} from '@plugin';
import {getInitialProps} from '@/Components/Counter/getInitialProps';
import React from 'react';

export const COMPONENTS = {
    Button,
    Counter,
    Tabs: withPortal(TabsLocal, () => <Skeleton style={{height: `${36}px`}} />),
    Tab: TabLocal,
    MermaidDiagram,
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
