// eslint-disable-next-line import/no-extraneous-dependencies
import type {MDXGetInitialProps} from '@plugin';
import {CounterProps} from '@/Components/Counter/Counter';

export const getInitialProps: MDXGetInitialProps<CounterProps> = (props, mdxSate) => {
    // eslint-disable-next-line no-param-reassign
    mdxSate.initialValue = 10;
    return props;
};
