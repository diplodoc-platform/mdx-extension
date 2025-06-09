import React, {useContext, useState} from 'react';
import {Button} from '@gravity-ui/uikit';
import {MdxSetStateCtx, type MdxSetStateCtxValue, MdxStateCtx} from '@plugin';

type CounterProps = {
    initialValue?: number;
};

export const Counter: React.FC<CounterProps> = ({initialValue = 0}) => {
    const mdxState = useContext(MdxStateCtx as React.Context<CounterProps>);
    const setMdxState = useContext(MdxSetStateCtx as React.Context<MdxSetStateCtxValue>);

    if (setMdxState) {
        setMdxState({initialValue});
    }

    const [count, setCount] = useState(mdxState.initialValue ?? initialValue);

    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            <Button onClick={() => setCount((c) => c - 1)}>-</Button>
            <span style={{margin: '0 10px'}}>{count}</span>
            <Button onClick={() => setCount((c) => c + 1)}>+</Button>
        </div>
    );
};
