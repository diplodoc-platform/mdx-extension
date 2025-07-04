import React, {
    type FC,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {generateUniqueId} from './internal/common';
import {MdxPortalSetterCtx} from '../context';
import {TAG_NAME} from '../constants';

export interface WithPortalProps {
    <A = {}, T = React.ComponentType<A>>(component: T, fallback?: T): FC<A>;
}

const withPortal: WithPortalProps = (component, fallback) => {
    return portalCtrWrapper(component, fallback);
};

export default withPortal;

function portalCtrWrapper<A = {}, T = React.ComponentType<A>>(component: T, fallback?: T): FC<A> {
    return (props) => {
        const portalSetter = useContext(MdxPortalSetterCtx);
        const ref = useRef<HTMLSpanElement>();
        const id = useMemo(() => generateUniqueId(), []);
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
                reactNode: React.createElement(component as React.ComponentType, props as {}),
            });
        }, [id, component, props]);

        return React.createElement(TAG_NAME, {
            ref,
            children:
                mounted || !fallback
                    ? null
                    : React.createElement(fallback as React.ComponentType, props as {}),
        });
    };
}
