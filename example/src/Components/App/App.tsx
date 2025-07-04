'use client';
import React, {FC} from 'react';
import {ThemeProvider} from '@gravity-ui/uikit';

const App: FC<{children: React.ReactNode}> = ({children}) => {
    return <ThemeProvider theme={'light'}>{children}</ThemeProvider>;
};

export default App;
