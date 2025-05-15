import React, {FC} from 'react';
import './CompatTable.scss'; // Стили можно вынести отдельно

interface CompatTableProps {
    children: Record<string, string[]>;
}

export const CompatTable: FC<CompatTableProps> = ({children}) => {
    if (!children || typeof children !== 'object') {
        return <div className="compat-table-error">Invalid table data</div>;
    }

    const data = children;
    const headers = Object.keys(data);
    const rows = data[headers[0]].length;

    return (
        <div className="compat-table-container">
            <table className="compat-table">
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({length: rows}).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map((header, colIndex) => (
                                <td
                                    key={colIndex}
                                    className={
                                        data[header][rowIndex] === '✓' ? 'compat-yes' : 'compat-no'
                                    }
                                >
                                    {data[header][rowIndex]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
