# Atom/Nuclide React Native Devtools

## How to run things

### 1. Start the packager with the "no-devtools" flag:

```bash
DEVTOOLS_SERVER_OPTIONS="--no-devtools=true" ./Libraries/FBReactKit/runServerHere.sh
```

### 2. Start node-executor with the devtools preloader

```bash
node index.js ~/clone/devtools/electron/node-backend/index.js
```

### 3. Open the devtools

Hit `ctrl+alt+o` in Atom/Nuclide, and you're up!

