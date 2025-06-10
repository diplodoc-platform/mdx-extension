/** @type {import("jest").Config} **/
export default {
    transformIgnorePatterns: [],
    transform: {
        '\\.[jt]sx?$': [
            'ts-jest',
            {
                tsconfig: './tsconfig.test.json',
            },
        ],
    },
    moduleNameMapper: {
        '^estree-walker$': `<rootDir>/../node_modules/estree-walker/src/index.js`,
    },
};
