const path = require('path');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: {
        "infinite-scroll": ['./infinite-scroll.js']
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: 'infinite-scroll',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['env']
                        ]
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    plugins: []
};