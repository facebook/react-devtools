
module.exports = {
  debug: true,
  devtool: 'source-map',
  // devtool: 'cheap-module-eval-source-map',
  entry: {
    panel: './panel/run.js',
    backend: './backend/run.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
  },

  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader:  'babel-loader?stage=0',
      exclude: [
        'node_modules',
      ],
    }]
  },
}

