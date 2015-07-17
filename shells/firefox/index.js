var self = require('sdk/self');

const { Cu, Ci } = require("chrome");

// inject the global hook

var pageMod = require("sdk/page-mod");

pageMod.PageMod({
  include: ["*", "file://*"],
  contentScriptFile: './inject.js',
  contentScriptWhen: 'start',
});


// messaging

// panel
// for docs, see
// https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/dev_panel

const { Panel } = require("dev/panel.js");
const { Class } = require("sdk/core/heritage");
const { Tool } = require("dev/toolbox");

const ReactPanel = Class({
  extends: Panel,
  label: 'React',
  tooltip: 'Debug & Develop React Apps',
  icon: "./icon.png",
  url: './panel.html',
  setup(options) {
    // this.debuggee = options.debuggee;
  },
  dispose() {
    // this.debuggee = null;
  },
  onReady() {
    var tabs = require('sdk/tabs');
    var worker = tabs.activeTab.attach({
      contentScriptFile: 'backend.js',
    });

    const { MessageChannel } = require("sdk/messaging");
    const channel = new MessageChannel();
    const addonSide = channel.port1;
    const panelSide = channel.port2;

    addonSide.onmessage = function (evt) {
      if (evt.data === 'panel show') {
        console.log('panel was shown');
        if (jsterm) {
          passSelectedNode(jsterm);
        }
        return;
      }
      // console.log('from panel', evt.data);
      worker.port.emit('message', evt.data);
    };
    worker.port.on('message', function (data) {
      // console.log('to panel', data);
      addonSide.postMessage(data);
    });
    worker.on('error', function (error) {
      console.log('More Error!!', error);
    });
    worker.port.on('error', function (error) {
      console.log('Error!!', error);
    });

    this.postMessage('port', [panelSide]);
    console.log('Panel ready');
  },
});

const ReactDevtools = new Tool({
  name: 'React Devtools',
  panels: {
    react: ReactPanel,
  },
});



// toolbox

const { gDevTools } = Cu.import("resource:///modules/devtools/gDevTools.jsm", {});

function main(options, callbacks) {
  trackSelection();
}

/**
 * Whenever the devtools inspector panel selection changes, pass that node to
 * __REACT_DEVTOOLS_GLOBAL_HOOK__.$0
 */
function trackSelection() {
  var wc;
  gDevTools.on('webconsole-init', function (eid, toolbox, panelFrame) {
    toolbox.once('webconsole-ready', (eId, panel) => {
      wc = panel;
    });
  });

  gDevTools.on('inspector-init', (eid, toolbox, panelFrame) => {
    toolbox.once('inspector-ready', (eid, panel) => {
      panel.selection.on('new-node-front', (ev, val, reason) => {
        passSelectedNode(wc.hud.ui.jsterm);
      });
    });
  });
}

function passSelectedNode(jsterm) {
  let inspectorSelection = jsterm.hud.owner.getInspectorSelection();
  if (inspectorSelection && inspectorSelection.nodeFront) {
    selectedNodeActor = inspectorSelection.nodeFront.actorID;
  }
  jsterm.requestEvaluation('__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent.selectFromDOMNode($0, true)', {
    selectedNodeActor: selectedNodeActor,
  });
}

function onUnload(reason) {
}

// Exports from this module
exports.main = main;
exports.onUnload = onUnload;
