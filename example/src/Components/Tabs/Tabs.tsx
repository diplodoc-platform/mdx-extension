import React, {useState} from 'react';
import {Tab, TabList, ThemeProvider} from '@gravity-ui/uikit';

type TabProps = {
    label: string;
    children: React.ReactNode;
};

type TabsProps = {
    children: React.ReactElement<TabProps>[];
};

export const TabsLocal: React.FC<TabsProps> = ({children}) => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <ThemeProvider theme={'light'}>
            <div>
                <TabList value={String(activeTab)}>
                    {React.Children.map(children, (child, index) => (
                        <Tab
                            key={index}
                            value={String(index)}
                            onClick={() => setActiveTab(index)}
                            suppressHydrationWarning={true}
                        >
                            {child.props.label}
                        </Tab>
                    ))}
                </TabList>
                <div style={{padding: 4}}>
                    {React.Children.toArray(children)[Number(activeTab)]}
                </div>
            </div>
        </ThemeProvider>
    );
};

export const TabLocal: React.FC<TabProps> = ({children}) => {
    return <>{children}</>;
};
