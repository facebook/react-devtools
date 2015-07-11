# React Devtools

## Cross-Platform

- chrome devtools plugin
- firefox devtools plugin
- atom/nuclide package (for react native)
- electron app (for react native)

## Planned Refactorings

### Platform unification

There's a ton of copypasta between firefox, chrome, and electron shell code.

- "backend" stuff, so that everywhere calls "startupListeners", for example
- the "Panel" component
- the "global" __REACT_DEVTOOLS_BACKEND__ stuff should just be in one place

### Webpack buildchain stuff

- there are a ton of webpack.zzz.js files all over the place
- electron shell doesn't need it, but atom does...
- there are some files that are *not* passed through babel/webpack, which is
    confusing b/c you can't use es6 syntax there. So what do you do? 
