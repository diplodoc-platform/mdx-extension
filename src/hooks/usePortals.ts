import React, {useCallback, useMemo, useRef, useState} from 'react';
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

    const fragment = useMemo(
        () => React.createElement(React.Fragment, {children: portalNodes}),
        [portalNodes],
    );

    return {
        portalsNode: fragment,
        setPortal,
    };
};

export default usePortals;
