# `react-devtools`

If you need to debug a React page somewhere other than Chrome on desktop (a mobile browser, an embedded webview, safari, etc), the `react-devtools` package is for you! It is also useful if your app is inside an iframe.

It works both with React DOM and React Native.

<img src="http://i.imgur.com/OZxWlyw.png" width="500" alt="Screenshot of React DevTools running with React Native">

## Usage

Install the package:

```
npm install --save-dev react-devtools
```

Add a script to your `package.json`:

```js
  "scripts": {
    // ...
    "devtools": "react-devtools"
  }
```

Now run `npm run devtools` to launch the standalone DevTools app.

The final step depends on your rendering target.

### React Native

You don't need to do anything else. Just make sure your app is running in foreground in the simulator, and DevTools will connect to it.

### React DOM

Add `import 'react-devtools'` to the top of your entry file.

```js
import 'react-devtools'; // Put it first!
import ReactDOM from 'react-dom';
```

Make sure that your `react-devtools` import comes **before** your `react-dom` import.  
And **don't forget to remove the import before shipping to production!**

## Advanced

By default DevTools listen to port `8097` on `localhost`.  
If you need to customize host, port, or other settings, see the `react-devtools-core` package instead.

## Developing

* Run `npm run backend:watch` and `npm run standalone:watch` in `../react-devtools-core`
* Run `npm start` in this folder
* Refresh the app after it has recompiled on change

### React Native

React Native uses `react-devtools-core` as a dependency.
Unfortunately, due to RN Packager aggressive caching of `node_modules`, it is very inconvenient to develop against it.

The way I do it is by changing [this require](https://github.com/facebook/react-native/blob/167ac4993ab86d15eabc2094f2749818b7659ebc/Libraries/Core/Devtools/setupDevtools.js#L18) to be relative, and then running [`watch-and-rsync`](https://www.npmjs.com/package/watch-and-rsync)` -o=start -s=../react-devtools-core -t=~/<YOUR PATH TO PROJECT DIR>/react-native/Libraries/Core/Devtools/react-devtools-core`. This circumvents RN Packager caching, and if you are also runing `npm run backend:watch` in `../react-devtools-core`, rebuilds on each change.
