const {resolve} = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@gravity-ui/uikit'],
    webpack: (configLocal, {isServer}) => {
        const config = configLocal;

        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        });

        if (isServer && config.name === 'server') {
            const prevEntry = config.entry;

            config.entry = async (...args) => {
                const entries = await prevEntry(...args);
                return {
                    ...entries,
                    ssrRendererWorker: resolve(
                        process.cwd(),
                        'src/workers/ssrRenderer/ssrRenderer.ts',
                    ),
                };
            };
        } else {
            config.resolve.fallback = {fs: false};
        }

        return config;
    },
};

module.exports = nextConfig;
