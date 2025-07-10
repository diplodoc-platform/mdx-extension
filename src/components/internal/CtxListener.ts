import React, {type FC, useContext, useMemo} from 'react';

interface CtxListenerProps {
    ctx: React.Context<unknown>;
    setValue: (value: unknown) => void;
}

const CtxListener: FC<CtxListenerProps> = ({ctx, setValue}) => {
    const value = useContext(ctx);

    useMemo(() => setValue(value), [value, setValue]);

    return null;
};

export default CtxListener;
