'use client';
import React, {FC, useState} from 'react';
import {ThemeProvider} from '@gravity-ui/uikit';
import {SetThemeCtx} from '@/hooks/SetThemeCtx';

const App: FC<{children: React.ReactNode}> = ({children}) => {
    const [theme, setTheme] = useState('light');

    return (
        <SetThemeCtx.Provider value={setTheme}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </SetThemeCtx.Provider>
    );
};

export default App;
