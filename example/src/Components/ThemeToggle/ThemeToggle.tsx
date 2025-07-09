import {FC, useCallback, useContext} from 'react';
import {Button, Theme, ThemeContext} from '@gravity-ui/uikit';
import {SetThemeCtx} from '@/hooks/SetThemeCtx';

const themeList: Theme[] = ['light', 'dark'];

const ThemeToggle: FC = () => {
    const setTheme = useContext(SetThemeCtx);
    const {themeValue} = useContext(ThemeContext) ?? {};

    const onSwitch = useCallback(() => {
        let nextIdx = (themeValue ? themeList.indexOf(themeValue) : -1) + 1;
        if (nextIdx === -1 || nextIdx >= themeList.length) {
            nextIdx = 0;
        }
        setTheme(themeList[nextIdx]);
    }, [themeValue]);

    return <Button onClick={onSwitch}>Switch theme</Button>;
};

export default ThemeToggle;
