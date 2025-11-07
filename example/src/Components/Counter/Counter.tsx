import React, {useContext, useState} from 'react';
import {Button} from '@gravity-ui/uikit';
// eslint-disable-next-line import/no-extraneous-dependencies
import {MdxStateCtx, MdxStateCtxValue} from '@plugin';

export type CounterProps = {
    initialValue?: number;
};

export const Counter: React.FC<CounterProps> = ({initialValue = 0}) => {
    const state = useContext(MdxStateCtx as React.Context<MdxStateCtxValue<CounterProps>>);
    const [count, setCount] = useState(state?.initialValue ?? initialValue);

    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            <Button onClick={() => setCount((c) => c - 1)}>-</Button>
            <span style={{margin: '0 10px'}}>{count}</span>
            <Button onClick={() => setCount((c) => c + 1)}>+</Button>
        </div>
    );
};
