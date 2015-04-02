module.exports = {
  context: __dirname + "/src",

  entry: {
    "content-script": "./content_scripts/content-script-main.js",
    "devpanel": "./devpanel/devpanel-main.js",
  },

  output: {
    path: __dirname + "/build",
    filename: '[name].js',
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
    ]
  }
};
