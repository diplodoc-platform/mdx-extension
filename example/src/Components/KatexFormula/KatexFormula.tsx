import React, {FC, useMemo} from 'react';

import 'katex/dist/katex.min.css';

interface KatexFormulaProps {
    html: string;
}

const KatexFormula: FC<KatexFormulaProps> = ({html}) => {
    return (
        <div
            className="katex-conteiner"
            dangerouslySetInnerHTML={useMemo(() => ({__html: html}), [html])}
        />
    );
};

export default KatexFormula;
