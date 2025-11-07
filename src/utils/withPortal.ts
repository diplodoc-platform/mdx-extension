import React, {type FC, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {generateUniqueId} from './internal/common';
import {MdxPortalSetterCtx} from '../context/internal/MdxPortalSetterCtx';
import {TAG_NAME} from '../constants';
import {useLocalLayoutEffect} from '../hooks/internal/useLocalLayoutEffect';
import {portalWrapperComponentMap} from './internal/maps';

export interface WithPortal {
    <A = unknown, T = React.ElementType<A>, F = React.ElementType<A>>(
        component: T,
        fallback?: F,
    ): FC<A>;
}

const withPortal: WithPortal = (component, fallback) => {
    const wrappedComponent = portalSwitch(
        component as React.ComponentType,
        fallback as React.ComponentType,
    );
    portalWrapperComponentMap.set(wrappedComponent, component as React.ComponentType);
    return wrappedComponent as FC<unknown>;
};

export default withPortal;

function portalSwitch(component: React.ComponentType, fallback?: React.ComponentType): FC {
    return (props) => {
        const portalSetter = useContext(MdxPortalSetterCtx);

        if (!portalSetter) {
            // inside portal
            return React.createElement(component, props);
        }

        return React.createElement(portalWrapper(component, fallback), props);
    };
}

function portalWrapper(component: React.ComponentType, fallback?: React.ComponentType): FC {
    return (props) => {
        const portalSetter = useContext(MdxPortalSetterCtx);
        const ref = useRef<HTMLSpanElement>(null);
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
                reactNode: React.createElement(component, props),
            });
        }, [id, component, props]);

        return React.createElement(TAG_NAME, {
            ref,
            children: mounted || !fallback ? null : React.createElement(fallback, props),
        });
    };
}
