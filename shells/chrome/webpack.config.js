
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    main: './main.js',
    backend: './backend.js',
    background: './background.js',
    inject: './injected/GlobalHook.js',
    reporter: './reporter.js',
    panel: './panel/run.js',
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

