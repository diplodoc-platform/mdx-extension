import React, {
    type FC,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {componentWithPortalProps, generateUniqueId} from './internal/common';
import {MdxPortalSetterCtx} from '../context';

export interface WithPortalProps {
    <A = {}, T = React.ComponentType<A>>(component: T, fallback?: T): T;
}

const withPortal: WithPortalProps = (component, fallback) => {
    const fallbackLocal = fallback ?? (() => null);
    componentWithPortalProps.set(
        component as React.ComponentType,
        fallbackLocal as React.ComponentType,
    );
    return portalCtrWrapper(
        component as React.ComponentType,
        fallbackLocal as React.ComponentType,
    ) as typeof component;
};

export default withPortal;

function portalCtrWrapper(component: React.ComponentType, fallback: React.ComponentType): FC {
    return (props) => {
        const portalSetter = useContext(MdxPortalSetterCtx);
        const ref = useRef<HTMLSpanElement>();
        const id = useMemo(() => `yfm-${generateUniqueId()}`, []);
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            return () => {
                portalSetter({
                    id,
                    node: null,
                    reactNode: null,
                });
            };
        }, [id]);

        useLayoutEffect(() => {
            const node = ref.current;
            if (!node) return;
            setMounted(true);

            portalSetter({
                id,
                node,
                reactNode: React.createElement(component, props),
            });
        }, [id, component, props]);

        return React.createElement('span', {
            ref,
            children: mounted ? null : React.createElement(fallback),
        });
    };
}
