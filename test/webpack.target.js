
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: './target.js',
  output: {
    path: __dirname + '/build',
    filename: 'target.js',
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

