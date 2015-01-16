var path = require('path');
var webpack = require('webpack');

var minify = (process.env.NODE_ENV === 'production');

var plugins = [
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify(minify ? 'production' : 'development')
        }
    })
];

if (minify) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
        output: {
            ascii_only: true,
        }
    }));
}

module.exports = {
    entry: {
        'main': './js/main.js',
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].bundle.js',
        pathinfo: !minify
    },
    module: {
        loaders: [
            { test: /knockout.build.output.knockout-latest.debug\.js/, loader: 'imports?require=>__webpack_require__' },
            { test: /\.js$/, loader: 'jsx-loader?harmony' },
            { test: /\.css$/, loader: 'style-loader!css-loader' },
            { test: /\.less$/, loader: 'style-loader!css-loader!less-loader' },
            { test: /\.json/, loader: 'json-loader' },
        ],
        noParse: [
            /knockout.build.output.knockout-latest.debug\.js/
        ]
    },
    plugins: plugins,
    devtool: minify ? null : 'inline-source-map'
};
