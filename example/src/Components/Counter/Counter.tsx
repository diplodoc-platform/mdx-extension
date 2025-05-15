import React, {useState} from 'react';
import {Button} from '@gravity-ui/uikit';

type CounterProps = {
    initialValue?: number;
};

export const Counter: React.FC<CounterProps> = ({initialValue = 0}) => {
    const [count, setCount] = useState(initialValue);

    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            <Button onClick={() => setCount((c) => c - 1)}>-</Button>
            <span style={{margin: '0 10px'}}>{count}</span>
            <Button onClick={() => setCount((c) => c + 1)}>+</Button>
        </div>
    );
};
