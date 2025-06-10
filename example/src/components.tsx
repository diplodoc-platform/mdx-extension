import {Alert, Button, Label} from '@gravity-ui/uikit';
import {CompatTable} from '@/Components/CompatTable/CompatTable';
import MermaidDiagram from '@/Components/MermaidDiagram/MermaidDiagram';
import {Counter} from '@/Components/Counter/Counter';
import {TabLocal, TabsLocal} from '@/Components/Tabs/Tabs';
import KatexFormula from '@/Components/KatexFormula/KatexFormula';
// eslint-disable-next-line import/no-extraneous-dependencies
import {withInitialProps} from '@plugin';
import {getInitialProps} from '@/Components/Counter/getInitialProps';

export const COMPONENTS = {
    Button,
    Counter,
    Tabs: TabsLocal,
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
