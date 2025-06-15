import {getMdxCollectPlugin} from '../src/mdx-collect-plugin';
import * as React from 'react';

describe('getMdxCollectPlugin', () => {
    const pureComponents = {
        B: ({children}: {children: React.ReactNode}) => React.createElement('b', {children}),
    };

    it('should process basic MDX content', () => {
        const plugin = getMdxCollectPlugin({pureComponents});
        const content = '<B>Hello World</B>';
        const result = plugin(content);

        expect(result).toBe('<b>Hello World</b>');
    });
});

describe('getAsyncMdxCollectPlugin', () => {
    const pureComponents = {
        B: ({children}: {children: React.ReactNode}) => React.createElement('b', {children}),
    };

    it('should process basic MDX content', async () => {
        const plugin = getMdxCollectPlugin({pureComponents});
        const content = '<B>Hello World</B>';
        const result = await plugin(content);

        expect(result).toBe('<b>Hello World</b>');
    });
});
