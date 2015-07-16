
module.exports = {
  debug: true,
  devtool: 'source-map',
  // devtool: 'cheap-module-eval-source-map',
  entry: './panel/Panel.js',
  output: {
    path: __dirname + '/build',
    filename: 'panel-el.js',
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


