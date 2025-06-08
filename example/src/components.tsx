import {Alert, Button, Label} from '@gravity-ui/uikit';
import {CompatTable} from '@/Components/CompatTable/CompatTable';
import MermaidDiagram from '@/Components/MermaidDiagram/MermaidDiagram';
import {Counter} from '@/Components/Counter/Counter';
import {TabLocal, TabsLocal} from '@/Components/Tabs/Tabs';

export const COMPONENTS = {
    Alert,
    Button,
    Counter,
    Tabs: TabsLocal,
    Tab: TabLocal,
    Label,
    CompatTable,
    MermaidDiagram,
};

export const PURE_COMPONENTS = {
    Sum: ({a, b}: {a: number; b: number}) => a + b,
};
