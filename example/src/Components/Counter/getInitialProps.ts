// eslint-disable-next-line import/no-extraneous-dependencies
import type {MDXGetInitialProps} from '@plugin';
import {CounterProps} from '@/Components/Counter/Counter';

export const getInitialProps: MDXGetInitialProps<CounterProps> = (props, mdxSate) => {
    mdxSate.initialValue = 10;
    return props;
};
