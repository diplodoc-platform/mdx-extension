import React, {useCallback, useRef, useState} from 'react';
import type {MdxPortalCtxSetterProps} from '../context';
import {createPortal} from 'react-dom';

const usePortals = () => {
    const refIdPortalMap = useRef(new Map<string, React.ReactNode>());
    const [portalNodes, setPortalNodes] = useState<React.ReactNode[]>([]);

    const setPortal = useCallback(({id, node, reactNode}: MdxPortalCtxSetterProps) => {
        const idPortalMap = refIdPortalMap.current;
        if (node) {
            idPortalMap.set(id, createPortal(reactNode, node, id));
        } else {
            idPortalMap.delete(id);
        }
        setPortalNodes(Array.from(idPortalMap.values()));
    }, []);

    return {
        portalsNode: React.createElement(React.Fragment, {children: portalNodes}),
        setPortal,
    };
};

export default usePortals;
