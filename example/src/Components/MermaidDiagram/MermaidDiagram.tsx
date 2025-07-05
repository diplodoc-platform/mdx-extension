import React, {FC, useEffect, useState} from 'react';
import mermaid from 'mermaid';
import {Skeleton} from '@gravity-ui/uikit';
import './MermaidDiagram.scss';

interface MermaidDiagramProps {
    children: string;
    skeletonHeight?: number;
}

const MermaidDiagram: FC<MermaidDiagramProps> = ({children, skeletonHeight = 10}) => {
    const [svg, setSvg] = useState('');

    useEffect(() => {
        (async () => {
            try {
                // Инициализируем Mermaid
                mermaid.initialize({
                    startOnLoad: true,
                    theme: 'default',
                    flowchart: {useMaxWidth: false},
                });

                // Получаем текст диаграммы из children
                const diagramCode = children;

                // Рендерим диаграмму
                const svgCode = await mermaid.render(`mermaid-diagram-${Date.now()}`, diagramCode);
                setSvg(svgCode.svg);
            } catch (error) {
                console.error('Mermaid rendering error:', error);
                setSvg(`<div class="mermaid-error">Diagram rendering failed</div>`);
            }
        })();
    }, [children]);

    return (
        <div className="mermaid-container">
            {!svg ? (
                <Skeleton style={{height: `${skeletonHeight}px`}} />
            ) : (
                <div className="mermaid-ctr" dangerouslySetInnerHTML={{__html: svg}} />
            )}
        </div>
    );
};

export default MermaidDiagram;
