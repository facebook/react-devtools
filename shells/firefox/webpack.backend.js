
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: './backend.js',
  output: {
    path: __dirname + '/build',
    filename: 'backend.js',
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


