# `react-devtools`

If you need to debug a React page somewhere other than Chrome on desktop (a mobile browser, an embedded webview, Safari, etc), the `react-devtools` package is for you! It is also useful if your app is inside an iframe.

It works both with React DOM and React Native.

<img src="http://i.imgur.com/OZxWlyw.png" width="500" alt="Screenshot of React DevTools running with React Native">

## Usage with React Native

Install the `react-devtools` package globally:

```
npm install -g react-devtools
```

Now run `react-devtools` from the terminal to launch the standalone DevTools app.

If you're using React Native 0.43 or higher, it should connect to your simulator within a few seconds.

>Note: alternatively, you can install `react-devtools` as a `devDependency` and add it to `scripts` in your `package.json` if you prefer so.

## Usage with React DOM

The standalone shell can also be useful with React DOM (for example, to debug apps in Safari, or inside an iframe).

We recommend installing the `react-devtools` as a `devDependency` because, unlike with React Native, we’ll also need to run some code to connect to it.

To install it, run:

```
npm install --save-dev react-devtools
```

Add a script to your `package.json`:

```js
  "scripts": {
    // (other scripts skipped)
    "devtools": "react-devtools"
  }
```

Finally, you need to import `'react-devtools'` as **the very first module in the entry point of your app**. It is important that it comes before `react-dom`, or otherwise it won’t connect. If you use Webpack, the easiest way to do this is to **edit your development Webpack configuration** to put it before every `entry`:

```js
// webpack.config.dev.js

module.exports = {
  entry: [
    'react-devtools', // Put it first
    './src/index',    // Your app
    // ...
```

Make sure you **only do this for the development coniguration**, or you’ll ship the DevTools code to production.

If you don’t use Webpack, you can manually `import 'react-devtools'` before any other imports in your app, but be careful to remove that statement every time you finish debugging.

## Advanced

By default DevTools listen to port `8097` on `localhost`.  
If you need to customize host, port, or other settings, see the `react-devtools-core` package instead.

## Developing

* Run `npm run backend:watch` and `npm run standalone:watch` in `../react-devtools-core`
* Run `npm start` in this folder
* Refresh the app after it has recompiled on change
* For React Native, copy `react-devtools-core` to its `node_modules` to test your changes
