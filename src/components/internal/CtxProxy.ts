import React, {forwardRef, useImperativeHandle} from 'react';

export interface CtxProxyRef {
    setValue: (v: unknown) => void;
}

interface CtxProxyProps {
    ctx: React.Context<unknown>;
    children: React.ReactNode;
    initValue: unknown;
}

const CtxProxy = forwardRef<CtxProxyRef, CtxProxyProps>(({ctx, children, initValue}, ref) => {
    const [value, setValue] = React.useState(() => initValue);

    useImperativeHandle(ref, () => {
        return {
            setValue: (v) => setValue(() => v),
        };
    }, []);

    return React.createElement(ctx.Provider, {
        value,
        children,
    });
});

export default CtxProxy;
