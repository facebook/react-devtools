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

> Note: if you prefer to avoid global installations, you can add `react-devtools` as a project dependency. With Yarn, you can run `yarn add react-devtools`, and then run `yarn react-devtools` from your project folder to open the DevTools. With npm, you can run `npm install --save react-devtools`, add `"react-devtools": "react-devtools"` to the `scripts` section in your `package.json`, and then run `npm run react-devtools` from your project folder to open the DevTools.

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

Finally, add `<script src="http://localhost:8097"></script>` as the very first `<script>` tag in the `<head>` of your page when developing. This will ensure the developer tools are connected. Don’t forget to remove it before deploying to production!

>Note: instead of adding a `<script>` tag, you can alternatively `import 'react-devtools'` in your entry point before all other imports, but make sure to remove this code before deploying to production, as it carries a large DevTools client with it. If you use Webpack and have control over its configuration, it could be reasonable to make `'react-devtools'` the first item in the `entry` array of the development-only configuration.

## Advanced

By default DevTools listen to port `8097` on `localhost`.  
If you need to customize host, port, or other settings, see the `react-devtools-core` package instead.

## Developing

* Run `npm run backend:watch` and `npm run standalone:watch` in `../react-devtools-core`
* Run `npm start` in this folder
* Refresh the app after it has recompiled on change
* For React Native, copy `react-devtools-core` to its `node_modules` to test your changes
