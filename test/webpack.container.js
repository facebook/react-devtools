
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: './container.js',
  output: {
    path: __dirname + '/build',
    filename: 'container.js',
  },

  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader:  'babel-loader?stage=0',
      exclude: [
        'node_modules',
      ],
      /*
    }, {
      test: /\.json$/,
      loader: 'json-loader',
      */
    }]
  },
}


