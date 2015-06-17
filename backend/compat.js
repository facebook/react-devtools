
var ReactDOMTextComponent = require('react/lib/ReactDOMTextComponent');
var ReactDOMComponent = require('react/lib/ReactDOMComponent');

function childrenList(children) {
  var res = [];
  for (var name in children) {
    res.push(children[name]);
  }
  return res;
}

function getData(element, context) {
  var children = null;
  var props = null;
  var state = null;
  var updater = null;
  var name = null;
  var type = null;
  var text = null;
  var nodeType = 'Native';
  if (element._renderedComponent) {
    nodeType = 'Wrapper';
    children = [element._renderedComponent];
    props = element._instance.props;
    state = element._instance.state;
  } else if (element._renderedChildren) {
    children = childrenList(element._renderedChildren);
  } else if (element._currentElement.props) {
    children = element._currentElement.props.children
  }

  if (!props && element._currentElement && element._currentElement.props) {
    props = element._currentElement.props;
  }

  if (element._currentElement) {
    type = element._currentElement.type;
    if ('string' === typeof type) {
      name = type;
    } else if (element.getName) {
      nodeType = 'Custom';
      name = element.getName();
    } else if (element._stringText) {
      nodeType = 'Text';
      text = element._stringText;
    }
  }

  if (element._instance) {
    var inst = element._instance
    updater = {
      setState: inst.setState && inst.setState.bind(inst),
      //setProps: inst.setProps && inst.setProps.bind(inst),
    }
  }

  return {nodeType, props, state, context, children, updater, type, name, text};
}

if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ && window.__REACT_DEVTOOLS_BACKEND__) {
  var reconciler = __REACT_DEVTOOLS_GLOBAL_HOOK__._reactRuntime.Reconciler;
  var reactMount = __REACT_DEVTOOLS_GLOBAL_HOOK__._reactRuntime.Mount;

  var backhooks = __REACT_DEVTOOLS_BACKEND__;
  var oldHandlers = {};

  backhooks.setEnabled = val => {
    if (!val) {
      if (!oldHandlers) {
        return;
      }

      restoreMany(reconciler, oldHandlers);
      oldHandlers = null;
      return;
    }

    decorateResult(reactMount, '_renderNewRootComponent', element => {
      backhooks.addRoot(element);
    });

    oldHandlers = decorateMany(reconciler, {
      mountComponent(element, rootID, transaction, context) {

        var data = getData(element, context)
        if (!data.children && data.name === 'div') {
          debugger
        }
        backhooks.onMounted(element, data);
      },
      performUpdateIfNecessary(element, rootID, transaction, context) {
        backhooks.onUpdated(element, getData(element, context));
      },
      receiveComponent(element, nextChild, transaction, context) {
        backhooks.onUpdated(element, getData(element, context));
      },
      unmountComponent(element) {
        backhooks.onUnmounted(element);
      }
    });
  }

  if (backhooks.enabled) {
    backhooks.setEnabled(true);
  }

  function decorateResult(obj, attr, fn) {
    var old = obj[attr];
    obj[attr] = function (instance: NodeLike) {
      var res = old.apply(this, arguments);
      fn(res);
      return res;
    };
    return old;
  }

  function decorate(obj, attr, fn) {
    var old = obj[attr];
    obj[attr] = function (instance: NodeLike) {
      var res = old.apply(this, arguments);
      fn.apply(this, arguments);
      return res;
    };
    return old;
  }

  function decorateMany(source, fns) {
    var olds = {};
    for (var name in fns) {
      olds[name] = decorate(source, name, fns[name]);
    }
    return olds;
  }

  function restoreMany(source, olds) {
    for (var name in olds) {
      source[name] = olds[name];
    }
  }
}
