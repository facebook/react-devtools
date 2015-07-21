
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    main: './src/main.js',
    backend: './src/backend.js',
    background: './src/background.js',
    inject: './src/GlobalHook.js',
    contentScript: './src/contentScript.js',
    panel: './src/panel/run.js',
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

