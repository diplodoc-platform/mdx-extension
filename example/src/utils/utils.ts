const HANDLERS_KEY = '__mdxLoader__';

export function executeCodeWithPromise<T>(id: string, code: string, nonce?: string) {
    return new Promise<T>((resolve, reject) => {
        // @ts-ignore
        const handlers = (window[HANDLERS_KEY] = window[HANDLERS_KEY] || {});
        handlers[id] = {resolve, reject};

        const wrappedCode = `(function(handlers) {
    try {
        handlers['${id}'].resolve(function() {
            ${code}
        });
    } catch (error) {
        handlers['${id}'].reject(error);
    }
    delete handlers['${id}'];
})(window.${HANDLERS_KEY});`;

        const script = document.createElement('script');
        if (nonce) {
            script.setAttribute('nonce', nonce);
        }
        script.textContent = wrappedCode;
        document.head.appendChild(script);
        script.parentNode?.removeChild(script);
    });
}
