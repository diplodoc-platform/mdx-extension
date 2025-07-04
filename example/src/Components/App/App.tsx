'use client';
import React, {FC} from 'react';
import {ThemeProvider} from '@gravity-ui/uikit';
import {TestCtx} from '@/context/TestCtx';

const App: FC<{children: React.ReactNode}> = ({children}) => {
    return (
        <TestCtx.Provider value={Math.random()}>
            <ThemeProvider theme={'light'}>{children}</ThemeProvider>
        </TestCtx.Provider>
    );
};

export default App;
