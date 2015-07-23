
module.exports = function setupRNStyle(bridge, agent, resolveRNStyle) {
  bridge.onCall('rn-style:get', id => {
    var node = agent.elementData.get(id);
    if (!node || !node.props) {
      return null;
    }
    return resolveRNStyle(node.props.style);
  });

  /*
  bridge.on('rn-style:unset', ({id, oldName, newName, val}) => {
    unsetStyle(agent, id, oldName);
  });
  */

  bridge.on('rn-style:rename', ({id, oldName, newName, val}) => {
    renameStyle(agent, id, oldName, newName, val);
  });

  bridge.on('rn-style:set', ({id, attr, val}) => {
    setStyle(agent, id, attr, val);
  });
}

function shallowClone(obj) {
  var nobj = {};
  for (var n in obj) {
    nobj[n] = obj[n];
  }
  return nobj;
}

function renameStyle(agent, id, oldName, newName, val) {
  var data = agent.elementData.get(id);
  // $FlowFixMe "computed property keys not supported"
  var newStyle = {[newName]: val};
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
      // $FlowFixMe we know that updater is not null here
      var customStyle = shallowClone(style[style.length - 1]);
      delete customStyle[oldName];
      customStyle[newName] = val;
      data.updater.setInProps(['style', style.length - 1], customStyle);
    } else {
      style = style.concat([newStyle]);
      // $FlowFixMe we know that updater is not null here
      data.updater.setInProps(['style'], style);
    }
  } else {
    if ('object' === typeof style) {
      var customStyle = shallowClone(style[style.length - 1]);
      delete customStyle[oldName];
      customStyle[newName] = val;
      data.updater.setInProps(['style'], customStyle);
    } else {
      style = [style, newStyle];
      data.updater.setInProps(['style'], style);
    }
  }
  agent.emit('hideHighlight');
}

function setStyle(agent, id, attr, val) {
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
      // $FlowFixMe we know that updater is not null here
      data.updater.setInProps(['style', style.length - 1, attr], val);
    } else {
      style = style.concat([newStyle]);
      // $FlowFixMe we know that updater is not null here
      data.updater.setInProps(['style'], style);
    }
  } else {
    style = [style, newStyle];
    data.updater.setInProps(['style'], style);
  }
  agent.emit('hideHighlight');
}
