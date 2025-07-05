import {TAG_NAME} from '../../constants';

export function wrapObject<T extends Object>(obj: T, onGet: (name: string) => void) {
    return Object.entries(obj).reduce<T>((acc, [key, value]) => {
        Object.defineProperty(acc, key, {
            get: () => {
                onGet(key);
                return value;
            },
            enumerable: true,
        });
        return acc;
    }, {} as T);
}

export function isEmptyObject(obj: Object) {
    // eslint-disable-next-line guard-for-in
    for (const _key in obj) {
        return false;
    }
    return true;
}

export function escapeAttribute(value: unknown) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export const trimComponentWrapper = (html: string) => {
    const endOpenSpan = html.indexOf('>');
    const startCloseSpan = html.lastIndexOf('<');
    return html.slice(endOpenSpan + 1, startCloseSpan);
};

export const trimPortalTag = (html: string) => {
    const openTag = `<${TAG_NAME}>`;
    const closeTag = `</${TAG_NAME}>`;
    const openTagPos = html.indexOf(openTag);
    const closeTagPos = html.lastIndexOf(closeTag);
    return (
        html.slice(0, openTagPos) +
        html.slice(openTagPos + openTag.length, closeTagPos) +
        html.slice(closeTagPos + closeTag.length)
    );
};
