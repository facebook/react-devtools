
window.performance = {
  now: () => Date.now(),
}
var globalHook = require('../../../backend/GlobalHook.js');

globalHook(window);

var Agent = require('../../../agent/Agent');
var Bridge = require('../../../agent/Bridge');

var inject = require('../../../agent/inject');

FOR_BACKEND.wall.onClose(() => {
  if (agent) {
    agent.emit('shutdown');
  }
  bridge = null;
  agent = null;
  console.log('closing devtools');
});

var bridge = new Bridge();
bridge.attach(FOR_BACKEND.wall);
var agent = new Agent({});
agent.addBridge(bridge);

bridge.onCall('rn:getStyle', id => {
  var node = agent.elementData.get(id);
  if (!node || !node.props) {
    return null;
  }
  var style = node.props.style;
  return FOR_BACKEND.resolveRNStyle(style);
});
bridge.on('rn:setStyle', ({id, attr, val}) => {
  console.log('setting rn style', id, attr, val);
  var data = agent.elementData.get(id);
  // $FlowFixMe "computed property keys not supported"
  var newStyle = {[attr]: val};
  if (!data.updater || !data.updater.setInProps) {
    var el:Object = agent.reactElements.get(id);
    if (el.setNativeProps) {
      el.setNativeProps(newStyle);
    } else {
      console.error('Unable to set style for this element... (no forceUpdate or setNativeProps)');
    }
    return;
  }
  var style = data.props && data.props.style;
  if (Array.isArray(style)) {
    if ('object' === typeof style[style.length - 1] && !Array.isArray(style[style.length - 1])) {
      data.updater.setInProps(['style', style.length - 1, attr], val);
    } else {
      style = style.concat([newStyle]);
      data.updater.setInProps(['style'], style);
    }
  } else {
    style = [style, newStyle];
    data.updater.setInProps(['style'], style);
  }
  agent.emit('hideHighlight');
});

var _connectTimeout = setTimeout(function () {
  console.error('react-devtools agent got no connection');
}, 20000);

agent.once('connected', function () {
  inject(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent);
  clearTimeout(_connectTimeout);
});

