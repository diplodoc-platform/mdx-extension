import React, {FC, Fragment, PropsWithChildren} from 'react';

interface RawContentProps extends PropsWithChildren {}

const RawContent: FC<RawContentProps> = ({children}) => {
    return <Fragment>{children}</Fragment>;
};

export default RawContent;
