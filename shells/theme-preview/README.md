# Theme Preview site

This is the source for the theme preview site running at [facebook.github.io/react-devtools](http://facebook.github.io/react-devtools).

### Development

To build a local version of the preview site run: `build.sh`

If you're making frequent changes, you can also run in "watch" mode: `../../node_modules/.bin/webpack --config webpack.config.js --watch`

After the site has been built, open the `index.html` file (in this directory) in your browser.

### Deployment

To deploy this site to `gh-pages` run `npm run deploy` from the root directory.

