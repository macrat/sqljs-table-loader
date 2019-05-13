export default {
    input: './src/index.js',
    output: [{
        name: 'TableLoader',
        file: './dist/sqljs-table-loader.js',
        format: 'umd',
        globals: {
            'xlsx': 'xlsx',
        },
    }, {
        file: './dist/sqljs-table-loader.mjs',
        format: 'esm',
    }],
    external: ['xlsx'],
}
