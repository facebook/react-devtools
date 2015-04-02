module.exports = {
  context: __dirname + "/src",

  entry: {
    "content-script": "./content_scripts/content-script-main.js",
    "devpanel": "./devpanel/devpanel-main.js",
    "injected-main": "./injected_scripts/injected-main.js",
    "injected-prelude": "./injected_scripts/injected-prelude.js",
  },

  output: {
    path: __dirname + "/build",
    filename: '[name].bundle.js',
  },

  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
      {test: /\.js$/, exclude: /node_modules/, loader: "eslint-loader"},
    ]
  }
};
