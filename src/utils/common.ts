import type {MdxPluginEnv} from '../types';
import type {OutputType} from '@diplodoc/transform/lib/typings';

export function isWithMdxArtifacts<T extends OutputType['result']>(
    _: T,
): asserts _ is T & MdxPluginEnv {}
