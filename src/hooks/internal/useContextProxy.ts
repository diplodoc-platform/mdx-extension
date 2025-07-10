import React, {useCallback, useMemo, useRef} from 'react';
import type {CtxProxyRef} from '../../components/internal/CtxProxy';
import CtxListener from '../../components/internal/CtxListener';
import type {ContextList, ContextWithValue} from '../../types';
import {getCtxFromCtxItem} from '../../utils/internal/common';

export type ListenCtxFn = (
    Content: React.ComponentType,
    ctx: React.Context<unknown> | null,
) => {ref: React.Ref<CtxProxyRef>; value: unknown};

const useContextProxy = (contextList?: ContextList) => {
    const refCtxValue = useRef<Map<React.Context<unknown>, unknown>>(new Map());
    const refContentCtxListMap = useRef<
        Map<
            React.ComponentType,
            {ctx: React.Context<unknown>; ref: {current: CtxProxyRef | null}}[]
        >
    >(new Map());

    const handleChangeValue = useCallback((ctx: React.Context<unknown>, value: unknown) => {
        const ctxValue = refCtxValue.current;
        const contentCtxListMap = refContentCtxListMap.current;
        ctxValue.set(ctx, value);
        contentCtxListMap.forEach((list) => {
            list.forEach(({ctx: ctxLocal, ref}) => {
                if (ref.current && ctxLocal === ctx) {
                    ref.current.setValue(value);
                }
            });
        });
    }, []);

    const listenerNodes = useMemo(() => {
        if (!contextList) return [];
        return contextList.map((ctxItem, idx) => {
            const {ctx} = getCtxFromCtxItem(ctxItem as ContextWithValue<unknown>);
            return React.createElement(CtxListener, {
                key: `ctx-${ctx.displayName ?? idx}`,
                ctx,
                setValue: (v) => handleChangeValue(ctx, v),
            });
        });
    }, [contextList, handleChangeValue]);

    const getCtxEmitterRef = useCallback<ListenCtxFn>((Content, ctx) => {
        const contentCtxListMap = refContentCtxListMap.current;
        if (!ctx) {
            contentCtxListMap.delete(Content);
            return {ref: null, value: null};
        }

        const ref = {current: null};
        const ctxValueMap = refCtxValue.current;
        let ctxListLocal = contentCtxListMap.get(Content);
        if (!ctxListLocal) {
            ctxListLocal = [];
            contentCtxListMap.set(Content, ctxListLocal);
        }
        ctxListLocal.push({ctx, ref});

        const value = ctxValueMap.get(ctx);
        return {ref, value};
    }, []);

    return {
        getCtxEmitterRef,
        listenerNode: React.createElement(React.Fragment, {children: listenerNodes}),
    };
};

export default useContextProxy;
