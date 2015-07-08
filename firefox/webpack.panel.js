
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: './panel/run.js',
  output: {
    path: __dirname + '/data/build',
    filename: 'panel.js',
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


