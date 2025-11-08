const HANDLERS_KEY = '__mdxLoader__';

export function executeCodeWithPromise<T>(code: string, nonce?: string) {
    // @ts-ignore
    const headers = (window[HANDLERS_KEY] = window[HANDLERS_KEY] || {});

    let id;
    do {
        id = Math.random().toString(36).substring(2);
    } while (headers[id]);

    return new Promise<T>((resolve, reject) => {
        headers[id] = {resolve, reject};

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
