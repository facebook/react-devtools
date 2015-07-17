
module.exports = {
  // devtool: 'cheap-module-eval-source-map',
  entry: {
    panel: './panel/run.js',
    backend: './backend.js',
  },
  output: {
    path: __dirname + '/data/build',
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


