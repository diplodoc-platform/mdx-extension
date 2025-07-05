import {useEffect, useLayoutEffect} from 'react';

/**
 * Just mute errors on server with useLayoutEffect
 */

export const useLocalLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
