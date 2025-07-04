import {FC, useContext} from 'react';
import {TestCtx} from '@/context/TestCtx';

const CurrentValue: FC = () => {
    const v = useContext(TestCtx);

    return <span>{v}</span>;
};

export default CurrentValue;
