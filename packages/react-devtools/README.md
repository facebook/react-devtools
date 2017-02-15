# `react-devtools`

## Why use this?

If you need to debug a React page somewhere other than Chrome on desktop (a mobile browser, an embedded webview, safari, etc), the `react-devtools` package is for you! It is also useful if your app is inside an iframe.

It works both with React DOM and React Native.

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
import 'react-devtools';
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
