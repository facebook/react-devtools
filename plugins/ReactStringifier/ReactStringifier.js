/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type Bridge from '../../agent/Bridge';
import type Store from '../../frontend/Store';

var Symbol = require('es6-symbol');
var consts = require('../../agent/consts');

type ReactProps = {[key: string]: any};

function indent(depth: number): string {
  return new Array(depth + 1).join('  ');
}

class ReactStringifier {
  _bridge: Bridge;

  constructor(bridge: Bridge) {
    this._bridge = bridge;
  }

  stringify(node: Object): Promise<string> {
    return this._stringifyComponentWrapper(
      new ComponentWrapper(this._bridge, node, []),
      0 // depth
    );
  }

  _stringifyComponentWrapper(component: ComponentWrapper, depth: number): Promise<string> {
    depth = depth || 0;

    return component.getNameAndPropsAndChildren().then(({name, props, children}) => {
      var hasChildren = children.length > 0;
      var hasProps = props && Object.keys(props).length > 0;

      return Promise.all([
        this._stringifyChildren(children, depth),
        this._stringifyProps(props, depth + 1)
      ]).then(([serializedChildren, serializedProps]: [string, string]) => {
        return (
          indent(depth) +
          // Open tag
          '<' + name +
          // Properties
          (hasProps ? '\n' : '') +
          serializedProps +
          // Close tag if childless
          (hasChildren
            ? '>\n'
            : ((hasProps ? '\n' + indent(depth) : ' ') + '/>')) +
          // Children
          serializedChildren +
          // Close tag if children
          (hasChildren ? '\n' + indent(depth) + '</' + name + '>' : '')
        );
      });
    });
  }

  _stringifyChildren(children: Array<any>, depth: number): Promise<string> {
    return Promise.all(
      children
        .filter(child => child != null)
        .map((child, index) => {
          if (child instanceof ComponentWrapper) {
            return this._stringifyComponentWrapper(child, depth + 1);
          } else if (child instanceof ValueWrapper) {
            return child.getValue().then(value => {
              return indent(depth + 1) + '{' + value + '}';
            });
          } else {
            return indent(depth + 1) + child;
          }
        })
    )
    .then(serializedChildren => serializedChildren.join('\n'));
  }

  _stringifyProps(props: Object, depth: number): Promise<string> {
    var serializedProps = [];
    var propNames = Object.keys(props);

    var serializedPropValuesPromise = propNames.map(propName => {
      return this._stringifyProp(props[propName], depth);
    });

    return Promise.all(serializedPropValuesPromise)
      .then(function(serializedPropValues) {
        for (var [propIndex, propName] of propNames.entries()) {
          serializedProps.push(
            indent(depth) +
            propName +
            '=' +
            serializedPropValues[propIndex]
          );
        }
        return serializedProps.join('\n');
      });
  }

  _stringifyProp(object: any, depth: number): Promise<string> {
    return this._stringifyValue(object, depth)
      .then((serializedValue: string) => {
        if (typeof object === 'string') {
          return serializedValue;
        } else {
          return (
            '{' +
            serializedValue +
            (object instanceof ComponentWrapper ? '\n' + indent(depth) : '') +
            '}'
          )
        }
      });
  }

  _stringifyValue(value: any, depth: number): Promise<string> {
    // infinite loop safeguard
    if (depth > 10) {
      return Promise.resolve("(depth > " + depth + ")");
    }

    if (value == null || typeof value in {'undefined': 1, 'string': 1, 'number': 1, 'boolean': 1}) {
      return Promise.resolve(JSON.stringify(value));
    } else if (value instanceof RegExp) {
      return value.toString();
    } else if (typeof value === 'function') {
      let functionName = value.displayName || '';
      return Promise.resolve('function ' + functionName + '() {}');
    } else if (Array.isArray(value)) {
      return this._stringifyArray(value, depth);
    } else if (value instanceof ComponentWrapper) {
      return this._stringifyComponentWrapper(value, depth + 1)
        .then(stringified => '\n' + stringified);
    } else if (value instanceof ObjectInstanceWrapper) {
      return value.getValue();
    } else if (value instanceof ValueWrapper) {
      return value.getValue().then(value => {
        return this._stringifyValue(value, depth)
      });
    } else {
      return this._stringifyObject(value, depth);
    }
  }

  _stringifyArray(array: Array<any>, depth: number): Promise<string> {
    return Promise.all(
      array.map((value, index) => this._stringifyValue(value, depth + 1))
    ).then((serializedValues: Array<string>) => {
      return (
        '[\n' +
        indent(depth + 1) +
        serializedValues.join(',\n' + indent(depth + 1)) +
        '\n' + indent(depth) +
        ']'
      );
    });
  }

  _stringifyObject(object: Object, depth: number): Promise<string> {
    var keys = Object.keys(object);

    return Promise.all(
      keys.map(key => this._stringifyValue(object[key], depth + 1))
    ).then((serializedValues: Array<string>) => {
      var serializedKeyValues = keys.map((key, index) => JSON.stringify(key) + ': ' + serializedValues[index]);
      return (
        '{\n' +
        indent(depth + 1) +
        serializedKeyValues.join(',\n' + indent(depth + 1)) +
        '\n' + indent(depth) +
        '}'
      );
    });
  }
}

/**
 * This class represents the object that can be found at valuePath of rootNode.
 */
class ValueWrapper {
  _bridge: Bridge;
  _rootNode: Object;
  _rootNodeId: string;
  _valuePath: Array<string>;

  constructor(bridge: Bridge, rootNode: Object, valuePath: Array<string>) {
    this._bridge = bridge;
    this._rootNode = rootNode;
    this._valuePath = valuePath;
    this._rootNodeId = rootNode.get('id');
  }

  _isComponent(value: Object): boolean {
    return value.$$typeof && value.$$typeof[consts.name] === String(Symbol('react.element'));
  }

  _isObjectInstance(value: Object): boolean {
    return value[consts.type] === 'object' && !(value[consts.name] in {'Function': 1, 'RegExp': 1});
  }

  _wrapValue(value: any, valuePath: Array<string>): any {
    if (value == null) {
      return value;
    } else if (typeof value === 'object') {
      if (this._isComponent(value)) {
        return new ComponentWrapper(this._bridge, this._rootNode, valuePath);
      } else if (this._isObjectInstance(value)) {
        return new ObjectInstanceWrapper(this._bridge, this._rootNode, valuePath, value[consts.name]);
      } else {
        return new ValueWrapper(this._bridge, this._rootNode, valuePath);
      }
    } else {
      return value;
    }
  }

  _wrapObjectValues(object: Object, objectPath: Array<string>): Object {
    var newObject = {};
    Object.keys(object).forEach(name => {
      newObject[name] = this._wrapValue(object[name], objectPath.concat(name));
    });

    return newObject;
  }

  _wrapArrayValues(arrayish: Object, objectPath: Array<string>): Array<any> {
    // arrayish can be an array or an object like an array.
    return Array.prototype.map.call(arrayish, (value: any, index: number) => {
      return this._wrapValue(value, objectPath.concat(String(index)));
    });
  }

  getValue(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._bridge.inspect(this._rootNodeId, this._valuePath, (value: any) => {
        var proto = value[consts.proto];
        var type = proto && proto.constructor && proto.constructor[consts.name];

        if (type === 'Array') {
          value = this._wrapArrayValues(value, this._valuePath);
        } else if (type === 'Function') {
          var funktion = function(){};
          funktion.displayName = value.name;
          value = funktion;
        } else if (type === 'RegExp') {
          value = new RegExp(
            value.source,
            (value.global ? 'g' : '') +
            (value.ignoreCase ? 'i' : '') +
            (value.multiline ? 'm' : '')
          );
        } else if (typeof value === 'object') {
          value = this._wrapObjectValues(value, this._valuePath);
        }

        resolve(value);
      });
    });
  }
}

class ComponentWrapper extends ValueWrapper {
  getNameAndPropsAndChildren(): Promise<{name: string, props: Object, children: Array<any>}> {
    var readDataFromRootNode = false;

    return new Promise((resolve, reject) => {
      this._bridge.inspect(this._rootNodeId, this._valuePath, value => {
        var name = value.name;
        var props = value.props;

        // For some reason root elements that do not have "complex types" do
        // not get anything from the bridge... In this situation we can only
        // use the data from the node itself.
        if (this._valuePath.length === 0 && name === undefined) {
          readDataFromRootNode = true;
        }
        if (readDataFromRootNode) {
          name = this._rootNode.get('name');
          props = this._rootNode.get('props');
        }

        // type == string => span, div, etc.
        if (name || typeof value.type === 'string') {
          resolve({name: name || value.type, props: props});
        } else {
          this._bridge.inspect(this._rootNodeId, this._valuePath.concat('type'), type => {
            // name: ES6 class component
            // displayName: React.createClass component
            resolve({name: type.name || type.displayName, props: props});
          });
        }
      });
    }).then(nameAndProps => {
      var { children, ...props } = nameAndProps.props;

      return {
        name: nameAndProps.name,
        props: readDataFromRootNode
          ? props
          : this._wrapObjectValues(props, this._valuePath.concat('props')),
        children: this._wrapChildrenValues(children)
      }
    })
  }

  _wrapChildrenValues(propsChildren: ?Object): Array<any> {
    var children;

    if (Array.isArray(propsChildren)) {
      children = propsChildren;
    } else if (propsChildren) {
      children = [propsChildren];
    } else {
      children = [];
    }

    return children.map((child, index) => {
      var childPath = this._valuePath.concat('props', 'children');
      // If there is only one child then props.children is not an array.
      if (children.length > 1) {
        childPath.push(String(index));
      }
      return this._wrapValue(child, childPath);
    });
  }
}

class ObjectInstanceWrapper extends ValueWrapper {
  _objectName: string;

  constructor(bridge: Bridge, rootNode: Object, valuePath: Array<string>, objectName: string) {
    super(bridge, rootNode, valuePath);
    this._objectName = objectName;
  }

  getValue(): Promise<string> {
    var value;

    return new Promise((resolve, reject) => {
      this._bridge.inspect(this._rootNodeId, this._valuePath, value => {
        // Special cases reside here.
        if (value.$FbtResult_contents) {
          resolve(JSON.stringify(value.props.translation));
        } else {
          resolve("new " + this._objectName + "()")
        }
      });
    });
  }
}

function copyToClipboard(text: string) {
  var root = document.body;
  var textarea = document.createElement('textarea');

  root.appendChild(textarea);
  textarea.value = text;
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (e) { console.error(e) }
  root.removeChild(textarea);
}

module.exports = ReactStringifier;
module.exports.copyToClipboard = copyToClipboard;
