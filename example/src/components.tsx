import {Alert, Button, Label} from '@gravity-ui/uikit';
import {CompatTable} from '@/Components/CompatTable/CompatTable';
import MermaidDiagram from '@/Components/MermaidDiagram/MermaidDiagram';
import {Counter} from '@/Components/Counter/Counter';
import {TabLocal, TabsLocal} from '@/Components/Tabs/Tabs';
import {withInitProps} from '@plugin';
import KatexFormula from '@/Components/KatexFormula/KatexFormula';
import {initProps} from '@/Components/KatexFormula/initProps';

export const COMPONENTS = {
    Alert,
    Button,
    Counter: withInitProps(Counter, async () => ({initialValue: 10})),
    Tabs: TabsLocal,
    Tab: TabLocal,
    Label,
    CompatTable,
    MermaidDiagram,
};

export const PURE_COMPONENTS = {
    Sum: ({a, b}: {a: number; b: number}) => a + b,
    KatexFormula: withInitProps(KatexFormula, initProps),
};
