AtomView = require './atom-view'
{CompositeDisposable} = require 'atom'

isVisible = false;

module.exports = Atom =
  atomView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @atomView = new AtomView(state.atomViewState)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'atom:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @atomView.destroy()

  serialize: ->
    atomViewState: @atomView.serialize()

  toggle: ->
    console.log 'React Devtools was toggled!'

    if isVisible
      isVisible = false
      @modalPanel.destroy()
      @atomView.disconnect()
    else
      isVisible = true
      @modalPanel = atom.workspace.addBottomPanel(item: @atomView.getElement())#, visible: false);
      @atomView.connect()
