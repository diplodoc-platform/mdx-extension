import type {Configuration} from 'webpack';
import * as path from 'node:path';

const config: Configuration = {
    entry: './src/index.ts',
    mode: 'production',
    optimization: {
        minimize: false,
    },
    target: 'node',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: `index.js`,
        path: path.resolve('./build/cjs'),
        libraryTarget: 'commonjs2',
    },
    externals: ['react', 'react-dom', 'react/jsx-runtime'],
};

export default config;
