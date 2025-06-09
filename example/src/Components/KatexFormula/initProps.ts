import katex from 'katex';

export interface InitProps {
    children: string;
}

export const initProps = async ({children}: InitProps) => {
    return {
        html: katex.renderToString(children),
    };
};
