
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    target: './target.js',
    sink: './sink.js',
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
};

