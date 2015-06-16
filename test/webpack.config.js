
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: './simple.js',
  output: {
    path: __dirname + '/build',
    filename: 'simple.js',
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


