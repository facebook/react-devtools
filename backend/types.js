
type DataType = {
  nodeType: 'Native' | 'Wrapper' | 'Composite' | 'Text',
  type: ?(string | Object),
  name: ?string,
  props: ?Object,
  state: ?Object,
  context: ?Object,
  children: ?(string | Array<Object>),
  text: ?string,
  updater: ?{
    setState: ?(newState: any) => void,
    forceUpdate: ?() => void,
    publicInstance: Object,
  },
};

// This type is entirely opaque to the backend.
type OpaqueReactElement = {
  _rootNodeID: string,
};
type NativeType = {};

export {DataType, OpaqueReactElement, Native};
