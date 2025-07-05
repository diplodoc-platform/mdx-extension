import React, {type FC, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {componentPortalSet, generateUniqueId} from './internal/common';
import {MdxPortalSetterCtx} from '../context/internal/MdxPortalSetterCtx';
import {TAG_NAME} from '../constants';
import {useLocalLayoutEffect} from '../hooks/internal/useLocalLayoutEffect';

const withPortal = <A = {}, T = React.ComponentType<A>>(component: T, fallback?: T) => {
    const wrappedComponent = portalSwitch(component, fallback);
    componentPortalSet.add(wrappedComponent);
    return wrappedComponent as FC<A>;
};

export default withPortal;

function portalSwitch<A = {}, T = React.ComponentType<A>>(component: T, fallback?: T): FC<A> {
    return (props) => {
        const portalSetter = useContext(MdxPortalSetterCtx);

        if (!portalSetter) {
            // inside portal
            return React.createElement(component as React.ComponentType, props as {});
        }

        return React.createElement(portalWrapper(component, fallback), props as {});
    };
}

function portalWrapper<A = {}, T = React.ComponentType<A>>(component: T, fallback?: T): FC<A> {
    return (props) => {
        const portalSetter = useContext(MdxPortalSetterCtx);
        const ref = useRef<HTMLSpanElement>();
        const id = useMemo(() => generateUniqueId(), []);
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            return () => {
                if (!portalSetter) return;
                portalSetter({
                    id,
                    node: null,
                    reactNode: null,
                });
            };
        }, [id]);

        useLocalLayoutEffect(() => {
            const node = ref.current;
            if (!node || !portalSetter) return;
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
