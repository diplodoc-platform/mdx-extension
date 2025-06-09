import React, {FC, useMemo} from 'react';

import 'katex/dist/katex.min.css';
import katex from 'katex';

interface KatexFormulaProps {
    children: string;
}

const KatexFormula: FC<KatexFormulaProps> = ({children}) => {
    const html = useMemo(() => katex.renderToString(children), [children]);

    return (
        <div
            className="katex-conteiner"
            dangerouslySetInnerHTML={useMemo(() => ({__html: html}), [html])}
        />
    );
};

export default KatexFormula;
