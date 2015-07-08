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
      contentScriptFile: './backend.js',
    });

    const { MessageChannel } = require("sdk/messaging");
    const channel = new MessageChannel();
    const addonSide = channel.port1;
    const panelSide = channel.port2;

    addonSide.onmessage = function (evt) {
      console.log('from panel', evt.data);
      worker.port.emit('message', evt.data);
    };
    worker.port.on('message', function (data) {
      console.log('to panel', data);
      addonSide.postMessage(data);
    });

    // this.debuggee.start();
    this.postMessage('port', [panelSide]);
    console.log('ready');
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

function makeToolbox(cbs) {
  return {
    initialize(options) {
      gDevTools.on('toolbox-ready', cbs.ready);
      gDevTools.on('toolbox-destroy', cbs.destroy);
      gDevTools.on('toolbox-destroyed', cbs.closed);
    },

    shutdown(reason) {
      gDevTools.off('toolbox-ready', cbs.ready);
      gDevTools.off('toolbox-destroy', cbs.destroy);
      gDevTools.off('toolbox-destroyed', cbs.closed);
    }
  }
}

const toolbox = makeToolbox({
  ready(evt, toolbox) {
  },
  destroy(eventId, target) {
  },
  closed(eventId, target) {
  }
});



function main(options, callbacks) {
  toolbox.initialize(options);
}

function onUnload(reason) {
  toolbox.shutdown(reason);
}

// Exports from this module
exports.main = main;
exports.onUnload = onUnload;
