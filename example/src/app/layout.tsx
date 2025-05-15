import type {Metadata} from 'next';

import App from '@/Components/App/App';

import React from 'react';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import '../styles/globals.scss';

export const metadata: Metadata = {
    title: 'mdx-extension demo',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <body style={{margin: '30px'}} className="g-root g-root_theme_light">
                <App>{children}</App>
            </body>
        </html>
    );
}
