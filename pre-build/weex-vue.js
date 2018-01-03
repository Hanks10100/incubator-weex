(this.nativeLog || function(s) {console.log(s)})('Weex JS Framework 0.23.6, Build 2018-01-03 18:05. (Vue: 2.5.11-weex.1)');
;(this.getJSFMVersion = function(){return "0.23.6"});
var global = this; var process = {env:{}}; var setTimeout = global.setTimeout;

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

var subversion = {"framework":"0.23.6","transformer":">=0.1.5 <0.5"};

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Get a unique id.
 */
var nextNodeRef = 1;
function uniqueId () {
  return (nextNodeRef++).toString()
}

function typof (v) {
  var s = Object.prototype.toString.call(v);
  return s.substring(8, s.length - 1)
}

function bufferToBase64 (buffer) {
  if (typeof btoa !== 'function') {
    return ''
  }
  var string = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (code) { return String.fromCharCode(code); }
  ).join('');
  return btoa(string) // eslint-disable-line no-undef
}

function base64ToBuffer (base64) {
  if (typeof atob !== 'function') {
    return new ArrayBuffer(0)
  }
  var string = atob(base64); // eslint-disable-line no-undef
  var array = new Uint8Array(string.length);
  Array.prototype.forEach.call(string, function (ch, i) {
    array[i] = ch.charCodeAt(0);
  });
  return array.buffer
}

/**
 * Detect if the param is falsy or empty
 * @param {any} any
 */
function isEmpty (any) {
  if (!any || typeof any !== 'object') {
    return true
  }

  for (var key in any) {
    if (Object.prototype.hasOwnProperty.call(any, key)) {
      return false
    }
  }
  return true
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Normalize a primitive value.
 * @param  {any}        v
 * @return {primitive}
 */
function normalizePrimitive (v) {
  var type = typof(v);

  switch (type) {
    case 'Undefined':
    case 'Null':
      return ''

    case 'RegExp':
      return v.toString()
    case 'Date':
      return v.toISOString()

    case 'Number':
    case 'String':
    case 'Boolean':
    case 'Array':
    case 'Object':
      return v

    case 'ArrayBuffer':
      return {
        '@type': 'binary',
        dataType: type,
        base64: bufferToBase64(v)
      }

    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
      return {
        '@type': 'binary',
        dataType: type,
        base64: bufferToBase64(v.buffer)
      }

    default:
      return JSON.stringify(v)
  }
}

function decodePrimitive (data) {
  if (typof(data) === 'Object') {
    // decode base64 into binary
    if (data['@type'] && data['@type'] === 'binary') {
      return base64ToBuffer(data.base64 || '')
    }

    var realData = {};
    for (var key in data) {
      realData[key] = decodePrimitive(data[key]);
    }
    return realData
  }
  if (typof(data) === 'Array') {
    return data.map(decodePrimitive)
  }
  return data
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function getHookKey (componentId, type, hookName) {
  return (type + "@" + hookName + "#" + componentId)
}

/**
 * For general callback management of a certain Weex instance.
 * Because function can not passed into native, so we create callback
 * callback id for each function and pass the callback id into native
 * in fact. And when a callback called from native, we can find the real
 * callback through the callback id we have passed before.
 */
var CallbackManager = function CallbackManager (instanceId) {
  this.instanceId = String(instanceId);
  this.lastCallbackId = 0;
  this.callbacks = {};
  this.hooks = {};
};
CallbackManager.prototype.add = function add (callback) {
  this.lastCallbackId++;
  this.callbacks[this.lastCallbackId] = callback;
  return this.lastCallbackId
};
CallbackManager.prototype.remove = function remove (callbackId) {
  var callback = this.callbacks[callbackId];
  delete this.callbacks[callbackId];
  return callback
};
CallbackManager.prototype.registerHook = function registerHook (componentId, type, hookName, hookFunction) {
  // TODO: validate arguments
  var key = getHookKey(componentId, type, hookName);
  if (this.hooks[key]) {
    console.warn(("[JS Framework] Override an existing component hook \"" + key + "\"."));
  }
  this.hooks[key] = hookFunction;
};
CallbackManager.prototype.triggerHook = function triggerHook (componentId, type, hookName, options) {
    if ( options === void 0 ) options = {};

  // TODO: validate arguments
  var key = getHookKey(componentId, type, hookName);
  var hookFunction = this.hooks[key];
  if (typeof hookFunction !== 'function') {
    console.error(("[JS Framework] Invalid hook function type (" + (typeof hookFunction) + ") on \"" + key + "\"."));
    return null
  }
  var result = null;
  try {
    result = hookFunction.apply(null, options.args || []);
  }
  catch (e) {
    console.error(("[JS Framework] Failed to execute the hook function on \"" + key + "\"."));
  }
  return result
};
CallbackManager.prototype.consume = function consume (callbackId, data, ifKeepAlive) {
  var callback = this.callbacks[callbackId];
  if (typeof ifKeepAlive === 'undefined' || ifKeepAlive === false) {
    delete this.callbacks[callbackId];
  }
  if (typeof callback === 'function') {
    return callback(decodePrimitive(data))
  }
  return new Error(("invalid callback id \"" + callbackId + "\""))
};
CallbackManager.prototype.close = function close () {
  this.callbacks = {};
  this.hooks = {};
};

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var docMap = {};

/**
 * Add a document object into docMap.
 * @param {string} id
 * @param {object} document
 */
function addDoc (id, doc) {
  if (id) {
    docMap[id] = doc;
  }
}

/**
 * Get the document object by id.
 * @param {string} id
 */
function getDoc (id) {
  return docMap[id]
}

/**
 * Remove the document from docMap by id.
 * @param {string} id
 */
function removeDoc (id) {
  delete docMap[id];
}

/**
 * @deprecated
 * Get listener by document id.
 * @param {string} id
 * @return {object} listener
 */


/**
 * Get TaskCenter instance by id.
 * @param {string} id
 * @return {object} TaskCenter
 */
function getTaskCenter (id) {
  var doc = docMap[id];
  if (doc && doc.taskCenter) {
    return doc.taskCenter
  }
  return null
}

/**
 * Append body node to documentElement.
 * @param {object} document
 * @param {object} node
 * @param {object} before
 */
function appendBody (doc, node, before) {
  var documentElement = doc.documentElement;

  if (documentElement.pureChildren.length > 0 || node.parentNode) {
    return
  }
  var children = documentElement.children;
  var beforeIndex = children.indexOf(before);
  if (beforeIndex < 0) {
    children.push(node);
  }
  else {
    children.splice(beforeIndex, 0, node);
  }

  if (node.nodeType === 1) {
    if (node.role === 'body') {
      node.docId = doc.id;
      node.ownerDocument = doc;
      node.parentNode = documentElement;
      linkParent(node, documentElement);
    }
    else {
      node.children.forEach(function (child) {
        child.parentNode = node;
      });
      setBody(doc, node);
      node.docId = doc.id;
      node.ownerDocument = doc;
      linkParent(node, documentElement);
      delete doc.nodeMap[node.nodeId];
    }
    documentElement.pureChildren.push(node);
    sendBody(doc, node);
  }
  else {
    node.parentNode = documentElement;
    doc.nodeMap[node.ref] = node;
  }
}

function sendBody (doc, node) {
  var body = node.toJSON();
  if (doc && doc.taskCenter && typeof doc.taskCenter.send === 'function') {
    doc.taskCenter.send('dom', { action: 'createBody' }, [body]);
  }
}

/**
 * Set up body node.
 * @param {object} document
 * @param {object} element
 */
function setBody (doc, el) {
  el.role = 'body';
  el.depth = 1;
  delete doc.nodeMap[el.nodeId];
  el.ref = '_root';
  doc.nodeMap._root = el;
  doc.body = el;
}

/**
 * Establish the connection between parent and child node.
 * @param {object} child node
 * @param {object} parent node
 */
function linkParent (node, parent) {
  node.parentNode = parent;
  if (parent.docId) {
    node.docId = parent.docId;
    node.ownerDocument = parent.ownerDocument;
    node.ownerDocument.nodeMap[node.nodeId] = node;
    node.depth = parent.depth + 1;
  }
  node.children.forEach(function (child) {
    linkParent(child, node);
  });
}

/**
 * Get the next sibling element.
 * @param {object} node
 */
function nextElement (node) {
  while (node) {
    if (node.nodeType === 1) {
      return node
    }
    node = node.nextSibling;
  }
}

/**
 * Get the previous sibling element.
 * @param {object} node
 */
function previousElement (node) {
  while (node) {
    if (node.nodeType === 1) {
      return node
    }
    node = node.previousSibling;
  }
}

/**
 * Insert a node into list at the specified index.
 * @param {object} target node
 * @param {array} list
 * @param {number} newIndex
 * @param {boolean} changeSibling
 * @return {number} newIndex
 */
function insertIndex (target, list, newIndex, changeSibling) {
  /* istanbul ignore next */
  if (newIndex < 0) {
    newIndex = 0;
  }
  var before = list[newIndex - 1];
  var after = list[newIndex];
  list.splice(newIndex, 0, target);
  if (changeSibling) {
    before && (before.nextSibling = target);
    target.previousSibling = before;
    target.nextSibling = after;
    after && (after.previousSibling = target);
  }
  return newIndex
}

/**
 * Move the node to a new index in list.
 * @param {object} target node
 * @param {array} list
 * @param {number} newIndex
 * @param {boolean} changeSibling
 * @return {number} newIndex
 */
function moveIndex (target, list, newIndex, changeSibling) {
  var index = list.indexOf(target);
  /* istanbul ignore next */
  if (index < 0) {
    return -1
  }
  if (changeSibling) {
    var before = list[index - 1];
    var after = list[index + 1];
    before && (before.nextSibling = after);
    after && (after.previousSibling = before);
  }
  list.splice(index, 1);
  var newIndexAfter = newIndex;
  if (index <= newIndex) {
    newIndexAfter = newIndex - 1;
  }
  var beforeNew = list[newIndexAfter - 1];
  var afterNew = list[newIndexAfter];
  list.splice(newIndexAfter, 0, target);
  if (changeSibling) {
    beforeNew && (beforeNew.nextSibling = target);
    target.previousSibling = beforeNew;
    target.nextSibling = afterNew;
    afterNew && (afterNew.previousSibling = target);
  }
  if (index === newIndexAfter) {
    return -1
  }
  return newIndex
}

/**
 * Remove the node from list.
 * @param {object} target node
 * @param {array} list
 * @param {boolean} changeSibling
 */
function removeIndex (target, list, changeSibling) {
  var index = list.indexOf(target);
  /* istanbul ignore next */
  if (index < 0) {
    return
  }
  if (changeSibling) {
    var before = list[index - 1];
    var after = list[index + 1];
    before && (before.nextSibling = after);
    after && (after.previousSibling = before);
  }
  list.splice(index, 1);
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var Node = function Node () {
  this.nodeId = uniqueId();
  this.ref = this.nodeId;
  this.children = [];
  this.pureChildren = [];
  this.parentNode = null;
  this.nextSibling = null;
  this.previousSibling = null;
};

/**
* Destroy current node, and remove itself form nodeMap.
*/
Node.prototype.destroy = function destroy () {
  var doc = getDoc(this.docId);
  if (doc) {
    delete this.docId;
    delete doc.nodeMap[this.nodeId];
  }
  this.children.forEach(function (child) {
    child.destroy();
  });
};

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var Element$2;

function setElement (El) {
  Element$2 = El;
}

/**
 * A map which stores all type of elements.
 * @type {Object}
 */
var registeredElements = {};

/**
 * Register an extended element type with component methods.
 * @param  {string} type    component type
 * @param  {array}  methods a list of method names
 */
function registerElement (type, methods) {
  // Skip when no special component methods.
  if (!methods || !methods.length) {
    return
  }

  // Init constructor.
  var WeexElement = (function (Element) {
    function WeexElement () {
      Element.apply(this, arguments);
    }if ( Element ) WeexElement.__proto__ = Element;
    WeexElement.prototype = Object.create( Element && Element.prototype );
    WeexElement.prototype.constructor = WeexElement;

    

    return WeexElement;
  }(Element$2));

  // Add methods to prototype.
  methods.forEach(function (methodName) {
    WeexElement.prototype[methodName] = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var taskCenter = getTaskCenter(this.docId);
      if (taskCenter) {
        return taskCenter.send('component', {
          ref: this.ref,
          component: type,
          method: methodName
        }, args)
      }
    };
  });

  // Add to element type map.
  registeredElements[type] = WeexElement;
}



function getWeexElement (type) {
  return registeredElements[type]
}



/**
 * Clear all element types. Only for testing.
 */

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var DEFAULT_TAG_NAME = 'div';
var BUBBLE_EVENTS = [
  'click', 'longpress', 'touchstart', 'touchmove', 'touchend',
  'panstart', 'panmove', 'panend', 'horizontalpan', 'verticalpan', 'swipe'
];

function registerNode (docId, node) {
  var doc = getDoc(docId);
  doc.nodeMap[node.nodeId] = node;
}

var Element = (function (Node$$1) {
  function Element (type, props, isExtended) {
    if ( type === void 0 ) type = DEFAULT_TAG_NAME;

    Node$$1.call(this);

    var WeexElement = getWeexElement(type);
    if (WeexElement && !isExtended) {
      return new WeexElement(type, props, true)
    }

    props = props || {};
    this.nodeType = 1;
    this.nodeId = uniqueId();
    this.ref = this.nodeId;
    this.type = type;
    this.attr = props.attr || {};
    this.style = props.style || {};
    this.classStyle = props.classStyle || {};
    this.event = {};
    this.children = [];
    this.pureChildren = [];
  }

  if ( Node$$1 ) Element.__proto__ = Node$$1;
  Element.prototype = Object.create( Node$$1 && Node$$1.prototype );
  Element.prototype.constructor = Element;

  /**
   * Append a child node.
   * @param {object} node
   * @return {undefined | number} the signal sent by native
   */
  Element.prototype.appendChild = function appendChild (node) {
    if (node.parentNode && node.parentNode !== this) {
      return
    }
    /* istanbul ignore else */
    if (!node.parentNode) {
      linkParent(node, this);
      insertIndex(node, this.children, this.children.length, true);
      if (this.docId) {
        registerNode(this.docId, node);
      }
      if (node.nodeType === 1) {
        insertIndex(node, this.pureChildren, this.pureChildren.length);
        var taskCenter = getTaskCenter(this.docId);
        if (taskCenter) {
          return taskCenter.send(
            'dom',
            { action: 'addElement' },
            [this.ref, node.toJSON(), -1]
          )
        }
      }
    }
    else {
      moveIndex(node, this.children, this.children.length, true);
      if (node.nodeType === 1) {
        var index = moveIndex(node, this.pureChildren, this.pureChildren.length);
        var taskCenter$1 = getTaskCenter(this.docId);
        if (taskCenter$1 && index >= 0) {
          return taskCenter$1.send(
            'dom',
            { action: 'moveElement' },
            [node.ref, this.ref, index]
          )
        }
      }
    }
  };

  /**
   * Insert a node before specified node.
   * @param {object} node
   * @param {object} before
   * @return {undefined | number} the signal sent by native
   */
  Element.prototype.insertBefore = function insertBefore (node, before) {
    if (node.parentNode && node.parentNode !== this) {
      return
    }
    if (node === before || (node.nextSibling && node.nextSibling === before)) {
      return
    }
    if (!node.parentNode) {
      linkParent(node, this);
      insertIndex(node, this.children, this.children.indexOf(before), true);
      if (this.docId) {
        registerNode(this.docId, node);
      }
      if (node.nodeType === 1) {
        var pureBefore = nextElement(before);
        var index = insertIndex(
          node,
          this.pureChildren,
          pureBefore
            ? this.pureChildren.indexOf(pureBefore)
            : this.pureChildren.length
        );
        var taskCenter = getTaskCenter(this.docId);
        if (taskCenter) {
          return taskCenter.send(
            'dom',
            { action: 'addElement' },
            [this.ref, node.toJSON(), index]
          )
        }
      }
    }
    else {
      moveIndex(node, this.children, this.children.indexOf(before), true);
      if (node.nodeType === 1) {
        var pureBefore$1 = nextElement(before);
        /* istanbul ignore next */
        var index$1 = moveIndex(
          node,
          this.pureChildren,
          pureBefore$1
            ? this.pureChildren.indexOf(pureBefore$1)
            : this.pureChildren.length
        );
        var taskCenter$1 = getTaskCenter(this.docId);
        if (taskCenter$1 && index$1 >= 0) {
          return taskCenter$1.send(
            'dom',
            { action: 'moveElement' },
            [node.ref, this.ref, index$1]
          )
        }
      }
    }
  };

  /**
   * Insert a node after specified node.
   * @param {object} node
   * @param {object} after
   * @return {undefined | number} the signal sent by native
   */
  Element.prototype.insertAfter = function insertAfter (node, after) {
    if (node.parentNode && node.parentNode !== this) {
      return
    }
    if (node === after || (node.previousSibling && node.previousSibling === after)) {
      return
    }
    if (!node.parentNode) {
      linkParent(node, this);
      insertIndex(node, this.children, this.children.indexOf(after) + 1, true);
      /* istanbul ignore else */
      if (this.docId) {
        registerNode(this.docId, node);
      }
      if (node.nodeType === 1) {
        var index = insertIndex(
          node,
          this.pureChildren,
          this.pureChildren.indexOf(previousElement(after)) + 1
        );
        var taskCenter = getTaskCenter(this.docId);
        /* istanbul ignore else */
        if (taskCenter) {
          return taskCenter.send(
            'dom',
            { action: 'addElement' },
            [this.ref, node.toJSON(), index]
          )
        }
      }
    }
    else {
      moveIndex(node, this.children, this.children.indexOf(after) + 1, true);
      if (node.nodeType === 1) {
        var index$1 = moveIndex(
          node,
          this.pureChildren,
          this.pureChildren.indexOf(previousElement(after)) + 1
        );
        var taskCenter$1 = getTaskCenter(this.docId);
        if (taskCenter$1 && index$1 >= 0) {
          return taskCenter$1.send(
            'dom',
            { action: 'moveElement' },
            [node.ref, this.ref, index$1]
          )
        }
      }
    }
  };

  /**
   * Remove a child node, and decide whether it should be destroyed.
   * @param {object} node
   * @param {boolean} preserved
   */
  Element.prototype.removeChild = function removeChild (node, preserved) {
    if (node.parentNode) {
      removeIndex(node, this.children, true);
      if (node.nodeType === 1) {
        removeIndex(node, this.pureChildren);
        var taskCenter = getTaskCenter(this.docId);
        if (taskCenter) {
          taskCenter.send(
            'dom',
            { action: 'removeElement' },
            [node.ref]
          );
        }
      }
    }
    if (!preserved) {
      node.destroy();
    }
  };

  /**
   * Clear all child nodes.
   */
  Element.prototype.clear = function clear () {
    var taskCenter = getTaskCenter(this.docId);
    /* istanbul ignore else */
    if (taskCenter) {
      this.pureChildren.forEach(function (node) {
        taskCenter.send(
          'dom',
          { action: 'removeElement' },
          [node.ref]
        );
      });
    }
    this.children.forEach(function (node) {
      node.destroy();
    });
    this.children.length = 0;
    this.pureChildren.length = 0;
  };

  /**
   * Set an attribute, and decide whether the task should be send to native.
   * @param {string} key
   * @param {string | number} value
   * @param {boolean} silent
   */
  Element.prototype.setAttr = function setAttr (key, value, silent) {
    if (this.attr[key] === value && silent !== false) {
      return
    }
    this.attr[key] = value;
    var taskCenter = getTaskCenter(this.docId);
    if (!silent && taskCenter) {
      var result = {};
      result[key] = value;
      taskCenter.send(
        'dom',
        { action: 'updateAttrs' },
        [this.ref, result]
      );
    }
  };

  /**
   * Set batched attributes.
   * @param {object} batchedAttrs
   * @param {boolean} silent
   */
  Element.prototype.setAttrs = function setAttrs (batchedAttrs, silent) {
    var this$1 = this;

    if (isEmpty(batchedAttrs)) { return }
    var mutations = {};
    for (var key in batchedAttrs) {
      if (this$1.attr[key] !== batchedAttrs[key]) {
        this$1.attr[key] = batchedAttrs[key];
        mutations[key] = batchedAttrs[key];
      }
    }
    if (!isEmpty(mutations)) {
      var taskCenter = getTaskCenter(this.docId);
      if (!silent && taskCenter) {
        taskCenter.send(
          'dom',
          { action: 'updateAttrs' },
          [this.ref, mutations]
        );
      }
    }
  };

  /**
   * Set a style property, and decide whether the task should be send to native.
   * @param {string} key
   * @param {string | number} value
   * @param {boolean} silent
   */
  Element.prototype.setStyle = function setStyle (key, value, silent) {
    if (this.style[key] === value && silent !== false) {
      return
    }
    this.style[key] = value;
    var taskCenter = getTaskCenter(this.docId);
    if (!silent && taskCenter) {
      var result = {};
      result[key] = value;
      taskCenter.send(
        'dom',
        { action: 'updateStyle' },
        [this.ref, result]
      );
    }
  };

  /**
   * Set batched style properties.
   * @param {object} batchedStyles
   * @param {boolean} silent
   */
  Element.prototype.setStyles = function setStyles (batchedStyles, silent) {
    var this$1 = this;

    if (isEmpty(batchedStyles)) { return }
    var mutations = {};
    for (var key in batchedStyles) {
      if (this$1.style[key] !== batchedStyles[key]) {
        this$1.style[key] = batchedStyles[key];
        mutations[key] = batchedStyles[key];
      }
    }
    if (!isEmpty(mutations)) {
      var taskCenter = getTaskCenter(this.docId);
      if (!silent && taskCenter) {
        taskCenter.send(
          'dom',
          { action: 'updateStyle' },
          [this.ref, mutations]
        );
      }
    }
  };

  /**
   * Set style properties from class.
   * @param {object} classStyle
   */
  Element.prototype.setClassStyle = function setClassStyle (classStyle) {
    var this$1 = this;

    // reset previous class style to empty string
    for (var key in this$1.classStyle) {
      this$1.classStyle[key] = '';
    }

    Object.assign(this.classStyle, classStyle);
    var taskCenter = getTaskCenter(this.docId);
    if (taskCenter) {
      taskCenter.send(
        'dom',
        { action: 'updateStyle' },
        [this.ref, this.toStyle()]
      );
    }
  };

  /**
   * Add an event handler.
   * @param {string} event type
   * @param {function} event handler
   */
  Element.prototype.addEvent = function addEvent (type, handler, params) {
    if (!this.event) {
      this.event = {};
    }
    if (!this.event[type]) {
      this.event[type] = { handler: handler, params: params };
      var taskCenter = getTaskCenter(this.docId);
      if (taskCenter) {
        taskCenter.send(
          'dom',
          { action: 'addEvent' },
          [this.ref, type]
        );
      }
    }
  };

  /**
   * Remove an event handler.
   * @param {string} event type
   */
  Element.prototype.removeEvent = function removeEvent (type) {
    if (this.event && this.event[type]) {
      delete this.event[type];
      var taskCenter = getTaskCenter(this.docId);
      if (taskCenter) {
        taskCenter.send(
          'dom',
          { action: 'removeEvent' },
          [this.ref, type]
        );
      }
    }
  };

  /**
   * Fire an event manually.
   * @param {string} type type
   * @param {function} event handler
   * @param {boolean} isBubble whether or not event bubble
   * @param {boolean} options
   * @return {} anything returned by handler function
   */
  Element.prototype.fireEvent = function fireEvent (type, event, isBubble, options) {
    var result = null;
    var isStopPropagation = false;
    var eventDesc = this.event[type];
    if (eventDesc && event) {
      var handler = eventDesc.handler;
      event.stopPropagation = function () {
        isStopPropagation = true;
      };
      if (options && options.params) {
        result = handler.call.apply(handler, [ this ].concat( options.params, [event] ));
      }
      else {
        result = handler.call(this, event);
      }
    }

    if (!isStopPropagation
      && isBubble
      && (BUBBLE_EVENTS.indexOf(type) !== -1)
      && this.parentNode
      && this.parentNode.fireEvent) {
      event.currentTarget = this.parentNode;
      this.parentNode.fireEvent(type, event, isBubble); // no options
    }

    return result
  };

  /**
   * Get all styles of current element.
   * @return {object} style
   */
  Element.prototype.toStyle = function toStyle () {
    return Object.assign({}, this.classStyle, this.style)
  };

  /**
   * Convert current element to JSON like object.
   * @return {object} element
   */
  Element.prototype.toJSON = function toJSON () {
    var this$1 = this;

    var result = {
      ref: this.ref.toString(),
      type: this.type,
      attr: this.attr,
      style: this.toStyle()
    };
    var event = [];
    for (var type in this$1.event) {
      var ref = this$1.event[type];
      var params = ref.params;
      if (!params) {
        event.push(type);
      }
      else {
        event.push({ type: type, params: params });
      }
    }
    if (event.length) {
      result.event = event;
    }
    if (this.pureChildren.length) {
      result.children = this.pureChildren.map(function (child) { return child.toJSON(); });
    }
    return result
  };

  /**
   * Convert to HTML element tag string.
   * @return {stirng} html
   */
  Element.prototype.toString = function toString () {
    return '<' + this.type +
    ' attr=' + JSON.stringify(this.attr) +
    ' style=' + JSON.stringify(this.toStyle()) + '>' +
    this.pureChildren.map(function (child) { return child.toString(); }).join('') +
    '</' + this.type + '>'
  };

  return Element;
}(Node));

setElement(Element);

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var fallback = function () {};

// The API of TaskCenter would be re-design.
var TaskCenter = function TaskCenter (id, sendTasks) {
  Object.defineProperty(this, 'instanceId', {
    enumerable: true,
    value: String(id)
  });
  Object.defineProperty(this, 'callbackManager', {
    enumerable: true,
    value: new CallbackManager(id)
  });
  fallback = sendTasks || function () {};
};

TaskCenter.prototype.callback = function callback (callbackId, data, ifKeepAlive) {
  return this.callbackManager.consume(callbackId, data, ifKeepAlive)
};

TaskCenter.prototype.registerHook = function registerHook () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

  return (ref = this.callbackManager).registerHook.apply(ref, args)
    var ref;
};

TaskCenter.prototype.triggerHook = function triggerHook () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

  return (ref = this.callbackManager).triggerHook.apply(ref, args)
    var ref;
};

TaskCenter.prototype.updateData = function updateData (componentId, newData, callback) {
  this.send('module', {
    module: 'dom',
    method: 'updateComponentData'
  }, [componentId, newData, callback]);
};

TaskCenter.prototype.destroyCallback = function destroyCallback () {
  return this.callbackManager.close()
};

/**
 * Normalize a value. Specially, if the value is a function, then generate a function id
 * and save it to `CallbackManager`, at last return the function id.
 * @param{any}      v
 * @return {primitive}
 */
TaskCenter.prototype.normalize = function normalize (v) {
  var type = typof(v);
  if (v && v instanceof Element) {
    return v.ref
  }
  if (v && v._isVue && v.$el instanceof Element) {
    return v.$el.ref
  }
  if (type === 'Function') {
    return this.callbackManager.add(v).toString()
  }
  return normalizePrimitive(v)
};

TaskCenter.prototype.send = function send (type, params, args, options) {
    var this$1 = this;

  var action = params.action;
    var component = params.component;
    var ref = params.ref;
    var module = params.module;
    var method = params.method;

  args = args.map(function (arg) { return this$1.normalize(arg); });

  switch (type) {
    case 'dom':
      return this[action](this.instanceId, args)
    case 'component':
      return this.componentHandler(this.instanceId, ref, method, args, Object.assign({ component: component }, options))
    default:
      return this.moduleHandler(this.instanceId, module, method, args, options)
  }
};

TaskCenter.prototype.callDOM = function callDOM (action, args) {
  return this[action](this.instanceId, args)
};

TaskCenter.prototype.callComponent = function callComponent (ref, method, args, options) {
  return this.componentHandler(this.instanceId, ref, method, args, options)
};

TaskCenter.prototype.callModule = function callModule (module, method, args, options) {
  return this.moduleHandler(this.instanceId, module, method, args, options)
};

function init$1 () {
  var DOM_METHODS = {
    createFinish: global.callCreateFinish,
    updateFinish: global.callUpdateFinish,
    refreshFinish: global.callRefreshFinish,

    createBody: global.callCreateBody,

    addElement: global.callAddElement,
    removeElement: global.callRemoveElement,
    moveElement: global.callMoveElement,
    updateAttrs: global.callUpdateAttrs,
    updateStyle: global.callUpdateStyle,

    addEvent: global.callAddEvent,
    removeEvent: global.callRemoveEvent
  };
  var proto = TaskCenter.prototype;

  var loop = function ( name ) {
    var method = DOM_METHODS[name];
    proto[name] = method ?
      function (id, args) { return method.apply(void 0, [ id ].concat( args )); } :
      function (id, args) { return fallback(id, [{ module: 'dom', method: name, args: args }], '-1'); };
  };

  for (var name in DOM_METHODS) loop( name );

  proto.componentHandler = global.callNativeComponent ||
    (function (id, ref, method, args, options) { return fallback(id, [{ component: options.component, ref: ref, method: method, args: args }]); });

  proto.moduleHandler = global.callNativeModule ||
    (function (id, module, method, args) { return fallback(id, [{ module: module, method: method, args: args }]); });
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function fireEvent (document, nodeId, type, event, domChanges, params) {
  var el = document.getRef(nodeId);
  if (el) {
    return document.fireEvent(el, type, event, domChanges, params)
  }
  return new Error(("invalid element reference \"" + nodeId + "\""))
}

function callback (document, callbackId, data, ifKeepAlive) {
  return document.taskCenter.callback(callbackId, data, ifKeepAlive)
}

function componentHook (document, componentId, type, hook, options) {
  if (!document || !document.taskCenter) {
    console.error("[JS Framework] Can't find \"document\" or \"taskCenter\".");
    return null
  }
  var result = null;
  try {
    result = document.taskCenter.triggerHook(componentId, type, hook, options);
  }
  catch (e) {
    console.error(("[JS Framework] Failed to trigger the \"" + type + "@" + hook + "\" hook on " + componentId + "."));
  }
  return result
}

/**
 * Accept calls from native (event or callback).
 *
 * @param  {string} id
 * @param  {array} tasks list with `method` and `args`
 */
function receiveTasks (id, tasks) {
  var document = getDoc(id);
  if (!document) {
    return new Error("[JS Framework] Failed to receiveTasks, "
      + "instance (" + id + ") is not available.")
  }
  if (Array.isArray(tasks)) {
    return tasks.map(function (task) {
      switch (task.method) {
        case 'callback': return callback.apply(void 0, [ document ].concat( task.args ))
        case 'fireEventSync':
        case 'fireEvent': return fireEvent.apply(void 0, [ document ].concat( task.args ))
        case 'componentHook': return componentHook.apply(void 0, [ document ].concat( task.args ))
      }
    })
  }
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var weexModules = {};

/**
 * Register native modules information.
 * @param {object} newModules
 */
function registerModules (newModules) {
  var loop = function ( name ) {
    if (!weexModules[name]) {
      weexModules[name] = {};
    }
    newModules[name].forEach(function (method) {
      if (typeof method === 'string') {
        weexModules[name][method] = true;
      }
      else {
        weexModules[name][method.name] = method.args;
      }
    });
  };

  for (var name in newModules) loop( name );
}

/**
 * Check whether the module or the method has been registered.
 * @param {String} module name
 * @param {String} method name (optional)
 */
function isRegisteredModule (name, method) {
  if (typeof method === 'string') {
    return !!(weexModules[name] && weexModules[name][method])
  }
  return !!weexModules[name]
}

function getModuleDescription (name) {
  return weexModules[name]
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var weexComponents = {};

/**
 * Register native components information.
 * @param {array} newComponents
 */
function registerComponents (newComponents) {
  if (Array.isArray(newComponents)) {
    newComponents.forEach(function (component) {
      if (!component) {
        return
      }
      if (typeof component === 'string') {
        weexComponents[component] = true;
      }
      else if (typeof component === 'object' && typeof component.type === 'string') {
        weexComponents[component.type] = component;
        registerElement(component.type, component.methods);
      }
    });
  }
}

/**
 * Check whether the component has been registered.
 * @param {String} component name
 */
function isRegisteredComponent (name) {
  return !!weexComponents[name]
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// JS Services

var services = [];

/**
 * Register a JavaScript service.
 * A JavaScript service options could have a set of lifecycle methods
 * for each Weex instance. For example: create, refresh, destroy.
 * For the JS framework maintainer if you want to supply some features
 * which need to work well in different Weex instances, even in different
 * frameworks separately. You can make a JavaScript service to init
 * its variables or classes for each Weex instance when it's created
 * and recycle them when it's destroyed.
 * @param {object} options Could have { create, refresh, destroy }
 *                         lifecycle methods. In create method it should
 *                         return an object of what variables or classes
 *                         would be injected into the Weex instance.
 */
function register (name, options) {
  if (has(name)) {
    console.warn(("Service \"" + name + "\" has been registered already!"));
  }
  else {
    options = Object.assign({}, options);
    services.push({ name: name, options: options });
  }
}

/**
 * Unregister a JavaScript service by name
 * @param {string} name
 */
function unregister (name) {
  services.some(function (service, index) {
    if (service.name === name) {
      services.splice(index, 1);
      return true
    }
  });
}

/**
 * Check if a JavaScript service with a certain name existed.
 * @param  {string}  name
 * @return {Boolean}
 */
function has (name) {
  return indexOf(name) >= 0
}

/**
 * Find the index of a JavaScript service by name
 * @param  {string} name
 * @return {number}
 */
function indexOf (name) {
  return services.map(function (service) { return service.name; }).indexOf(name)
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function track (id, type, value) {
  var taskCenter = getTaskCenter(id);
  if (!taskCenter || typeof taskCenter.send !== 'function') {
    console.error("[JS Framework] Failed to create tracker!");
    return
  }
  if (!type || !value) {
    console.warn(("[JS Framework] Invalid track type (" + type + ") or value (" + value + ")"));
    return
  }
  var label = "jsfm." + type + "." + value;
  try {
    if (isRegisteredModule('userTrack', 'addPerfPoint')) {
      var message = Object.create(null);
      message[label] = '4';
      taskCenter.send('module', {
        module: 'userTrack',
        method: 'addPerfPoint'
      }, [message]);
    }
  }
  catch (err) {
    console.error(("[JS Framework] Failed to trace \"" + label + "\"!"));
  }
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var Comment = (function (Node$$1) {
  function Comment (value) {
    Node$$1.call(this);

    this.nodeType = 8;
    this.nodeId = uniqueId();
    this.ref = this.nodeId;
    this.type = 'comment';
    this.value = value;
    this.children = [];
    this.pureChildren = [];
  }

  if ( Node$$1 ) Comment.__proto__ = Node$$1;
  Comment.prototype = Object.create( Node$$1 && Node$$1.prototype );
  Comment.prototype.constructor = Comment;

  /**
  * Convert to HTML comment string.
  * @return {stirng} html
  */
  Comment.prototype.toString = function toString () {
    return '<!-- ' + this.value + ' -->'
  };

  return Comment;
}(Node));

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
* Create the action object.
* @param {string} name
* @param {array} arguments
* @return {object} action
*/
function createAction (name, args) {
  if ( args === void 0 ) args = [];

  return { module: 'dom', method: name, args: args }
}

var Listener = function Listener (id, handler) {
  this.id = id;
  this.batched = false;
  this.updates = [];
  if (typeof handler === 'function') {
    Object.defineProperty(this, 'handler', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: handler
    });
  }
  else {
    console.error('[JS Runtime] invalid parameter, handler must be a function');
  }
};

/**
 * Send the "createFinish" signal.
 * @param {function} callback
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.createFinish = function createFinish (callback) {
  var handler = this.handler;
  return handler([createAction('createFinish')], callback)
};

/**
 * Send the "updateFinish" signal.
 * @param {function} callback
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.updateFinish = function updateFinish (callback) {
  var handler = this.handler;
  return handler([createAction('updateFinish')], callback)
};

/**
 * Send the "refreshFinish" signal.
 * @param {function} callback
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.refreshFinish = function refreshFinish (callback) {
  var handler = this.handler;
  return handler([createAction('refreshFinish')], callback)
};

/**
 * Send the "createBody" signal.
 * @param {object} element
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.createBody = function createBody (element) {
  var body = element.toJSON();
  var children = body.children;
  delete body.children;
  var actions = [createAction('createBody', [body])];
  if (children) {
    actions.push.apply(actions, children.map(function (child) {
      return createAction('addElement', [body.ref, child, -1])
    }));
  }
  return this.addActions(actions)
};

/**
 * Send the "addElement" signal.
 * @param {object} element
 * @param {stirng} reference id
 * @param {number} index
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.addElement = function addElement (element, ref, index) {
  if (!(index >= 0)) {
    index = -1;
  }
  return this.addActions(createAction('addElement', [ref, element.toJSON(), index]))
};

/**
 * Send the "removeElement" signal.
 * @param {stirng} reference id
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.removeElement = function removeElement (ref) {
  if (Array.isArray(ref)) {
    var actions = ref.map(function (r) { return createAction('removeElement', [r]); });
    return this.addActions(actions)
  }
  return this.addActions(createAction('removeElement', [ref]))
};

/**
 * Send the "moveElement" signal.
 * @param {stirng} target reference id
 * @param {stirng} parent reference id
 * @param {number} index
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.moveElement = function moveElement (targetRef, parentRef, index) {
  return this.addActions(createAction('moveElement', [targetRef, parentRef, index]))
};

/**
 * Send the "updateAttrs" signal.
 * @param {stirng} reference id
 * @param {stirng} key
 * @param {stirng} value
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.setAttr = function setAttr (ref, key, value) {
  var result = {};
  result[key] = value;
  return this.addActions(createAction('updateAttrs', [ref, result]))
};

/**
 * Send the "updateStyle" signal, update a sole style.
 * @param {stirng} reference id
 * @param {stirng} key
 * @param {stirng} value
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.setStyle = function setStyle (ref, key, value) {
  var result = {};
  result[key] = value;
  return this.addActions(createAction('updateStyle', [ref, result]))
};

/**
 * Send the "updateStyle" signal.
 * @param {stirng} reference id
 * @param {object} style
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.setStyles = function setStyles (ref, style) {
  return this.addActions(createAction('updateStyle', [ref, style]))
};

/**
 * Send the "addEvent" signal.
 * @param {stirng} reference id
 * @param {string} event type
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.addEvent = function addEvent (ref, type) {
  return this.addActions(createAction('addEvent', [ref, type]))
};

/**
 * Send the "removeEvent" signal.
 * @param {stirng} reference id
 * @param {string} event type
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.removeEvent = function removeEvent (ref, type) {
  return this.addActions(createAction('removeEvent', [ref, type]))
};

/**
 * Default handler.
 * @param {object | array} actions
 * @param {function} callback
 * @return {} anything returned by callback function
 */
Listener.prototype.handler = function handler (actions, cb) {
  return cb && cb()
};

/**
 * Add actions into updates.
 * @param {object | array} actions
 * @return {undefined | number} the signal sent by native
 */
Listener.prototype.addActions = function addActions (actions) {
  var updates = this.updates;
  var handler = this.handler;

  if (!Array.isArray(actions)) {
    actions = [actions];
  }

  if (this.batched) {
    updates.push.apply(updates, actions);
  }
  else {
    return handler(actions)
  }
};

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * @fileOverview
 * Task handler for communication between javascript and native.
 */

var handlerMap = {
  createBody: 'callCreateBody',
  addElement: 'callAddElement',
  removeElement: 'callRemoveElement',
  moveElement: 'callMoveElement',
  updateAttrs: 'callUpdateAttrs',
  updateStyle: 'callUpdateStyle',
  addEvent: 'callAddEvent',
  removeEvent: 'callRemoveEvent'
};

/**
 * Create a task handler.
 * @param {string} id
 * @param {function} handler
 * @return {function} taskHandler
 */
function createHandler (id, handler) {
  var defaultHandler = handler || global.callNative;

  /* istanbul ignore if */
  if (typeof defaultHandler !== 'function') {
    console.error('[JS Runtime] no default handler');
  }

  return function taskHandler (tasks) {
    /* istanbul ignore if */
    if (!Array.isArray(tasks)) {
      tasks = [tasks];
    }
    for (var i = 0; i < tasks.length; i++) {
      var returnValue = dispatchTask(id, tasks[i], defaultHandler);
      if (returnValue === -1) {
        return returnValue
      }
    }
  }
}

/**
 * Check if there is a corresponding available handler in the environment.
 * @param {string} module
 * @param {string} method
 * @return {boolean}
 */
function hasAvailableHandler (module, method) {
  return module === 'dom'
    && handlerMap[method]
    && typeof global[handlerMap[method]] === 'function'
}

/**
 * Dispatch the task to the specified handler.
 * @param {string} id
 * @param {object} task
 * @param {function} defaultHandler
 * @return {number} signal returned from native
 */
function dispatchTask (id, task, defaultHandler) {
  var module = task.module;
  var method = task.method;
  var args = task.args;

  if (hasAvailableHandler(module, method)) {
    return global[handlerMap[method]].apply(global, [ id ].concat( args, ['-1'] ))
  }

  return defaultHandler(id, [task], '-1')
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Update all changes for an element.
 * @param {object} element
 * @param {object} changes
 */
function updateElement (el, changes) {
  var attrs = changes.attrs || {};
  for (var name in attrs) {
    el.setAttr(name, attrs[name], true);
  }
  var style = changes.style || {};
  for (var name$1 in style) {
    el.setStyle(name$1, style[name$1], true);
  }
}

var Document = function Document (id, url, handler) {
  id = id ? id.toString() : '';
  this.id = id;
  this.URL = url;

  addDoc(id, this);
  this.nodeMap = {};
  var L = Document.Listener || Listener;
  this.listener = new L(id, handler || createHandler(id, Document.handler)); // deprecated
  this.taskCenter = new TaskCenter(id, handler ? function (id) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    return handler.apply(void 0, args);
  } : Document.handler);
  this.createDocumentElement();
};

/**
* Get the node from nodeMap.
* @param {string} reference id
* @return {object} node
*/
Document.prototype.getRef = function getRef (ref) {
  return this.nodeMap[ref]
};

/**
* Turn on batched updates.
*/
Document.prototype.open = function open () {
  this.listener.batched = false;
};

/**
* Turn off batched updates.
*/
Document.prototype.close = function close () {
  this.listener.batched = true;
};

/**
* Create the document element.
* @return {object} documentElement
*/
Document.prototype.createDocumentElement = function createDocumentElement () {
    var this$1 = this;

  if (!this.documentElement) {
    var el = new Element('document');
    el.docId = this.id;
    el.ownerDocument = this;
    el.role = 'documentElement';
    el.depth = 0;
    el.ref = '_documentElement';
    this.nodeMap._documentElement = el;
    this.documentElement = el;

    Object.defineProperty(el, 'appendChild', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function (node) {
        appendBody(this$1, node);
      }
    });

    Object.defineProperty(el, 'insertBefore', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function (node, before) {
        appendBody(this$1, node, before);
      }
    });
  }

  return this.documentElement
};

/**
* Create the body element.
* @param {string} type
* @param {objct} props
* @return {object} body element
*/
Document.prototype.createBody = function createBody (type, props) {
  if (!this.body) {
    var el = new Element(type, props);
    setBody(this, el);
  }

  return this.body
};

/**
* Create an element.
* @param {string} tagName
* @param {objct} props
* @return {object} element
*/
Document.prototype.createElement = function createElement (tagName, props) {
  return new Element(tagName, props)
};

/**
* Create an comment.
* @param {string} text
* @return {object} comment
*/
Document.prototype.createComment = function createComment (text) {
  return new Comment(text)
};

/**
* Fire an event on specified element manually.
* @param {object} element
* @param {string} event type
* @param {object} event object
* @param {object} dom changes
* @param {object} options
* @return {} anything returned by handler function
*/
Document.prototype.fireEvent = function fireEvent (el, type, event, domChanges, options) {
  if (!el) {
    return
  }
  event = event || {};
  event.type = event.type || type;
  event.target = el;
  event.currentTarget = el;
  event.timestamp = Date.now();
  if (domChanges) {
    updateElement(el, domChanges);
  }
  var isBubble = this.getRef('_root').attr['bubble'] === 'true';
  return el.fireEvent(type, event, isBubble, options)
};

/**
* Destroy current document, and remove itself form docMap.
*/
Document.prototype.destroy = function destroy () {
  this.taskCenter.destroyCallback();
  delete this.listener;
  delete this.nodeMap;
  delete this.taskCenter;
  removeDoc(this.id);
};

// default task handler
Document.handler = null;

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var moduleProxies = {};

function setId (weex, id) {
  Object.defineProperty(weex, '[[CurrentInstanceId]]', { value: id });
}

function getId (weex) {
  return weex['[[CurrentInstanceId]]']
}

function moduleGetter (id, module, method) {
  var taskCenter = getTaskCenter(id);
  if (!taskCenter || typeof taskCenter.send !== 'function') {
    console.error(("[JS Framework] Failed to find taskCenter (" + id + ")."));
    return null
  }
  return function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return taskCenter.send('module', { module: module, method: method }, args);
  }
}

function moduleSetter (id, module, method, fn) {
  var taskCenter = getTaskCenter(id);
  if (!taskCenter || typeof taskCenter.send !== 'function') {
    console.error(("[JS Framework] Failed to find taskCenter (" + id + ")."));
    return null
  }
  if (typeof fn !== 'function') {
    console.error(("[JS Framework] " + module + "." + method + " must be assigned as a function."));
    return null
  }
  return function (fn) { return taskCenter.send('module', { module: module, method: method }, [fn]); }
}

var WeexInstance = function WeexInstance (id, config) {
  setId(this, String(id));
  this.config = config || {};
  this.document = new Document(id, this.config.bundleUrl);
  this.requireModule = this.requireModule.bind(this);
  this.isRegisteredModule = isRegisteredModule;
  this.isRegisteredComponent = isRegisteredComponent;
};

WeexInstance.prototype.requireModule = function requireModule (moduleName) {
  var id = getId(this);
  if (!(id && this.document && this.document.taskCenter)) {
    console.error("[JS Framework] Failed to requireModule(\"" + moduleName + "\"), "
      + "instance (" + id + ") doesn't exist anymore.");
    return
  }

  // warn for unknown module
  if (!isRegisteredModule(moduleName)) {
    console.warn(("[JS Framework] using unregistered weex module \"" + moduleName + "\""));
    return
  }

  // create new module proxy
  var proxyName = moduleName + "#" + id;
  if (!moduleProxies[proxyName]) {
    // create registered module apis
    var moduleDefine = getModuleDescription(moduleName);
    var moduleApis = {};
    var loop = function ( methodName ) {
      Object.defineProperty(moduleApis, methodName, {
        enumerable: true,
        configurable: true,
        get: function () { return moduleGetter(id, moduleName, methodName); },
        set: function (fn) { return moduleSetter(id, moduleName, methodName, fn); }
      });
    };

      for (var methodName in moduleDefine) loop( methodName );

    // create module Proxy
    if (typeof Proxy === 'function') {
      moduleProxies[proxyName] = new Proxy(moduleApis, {
        get: function get (target, methodName) {
          if (methodName in target) {
            return target[methodName]
          }
          console.warn(("[JS Framework] using unregistered method \"" + moduleName + "." + methodName + "\""));
          return moduleGetter(id, moduleName, methodName)
        }
      });
    }
    else {
      moduleProxies[proxyName] = moduleApis;
    }
  }

  return moduleProxies[proxyName]
};

WeexInstance.prototype.supports = function supports (condition) {
  if (typeof condition !== 'string') { return null }

  var res = condition.match(/^@(\w+)\/(\w+)(\.(\w+))?$/i);
  if (res) {
    var type = res[1];
    var name = res[2];
    var method = res[4];
    switch (type) {
      case 'module': return isRegisteredModule(name, method)
      case 'component': return isRegisteredComponent(name)
    }
  }

  return null
};

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var frameworks;
var runtimeConfig;

var versionRegExp = /^\s*\/\/ *(\{[^}]*\}) *\r?\n/;

/**
 * Detect a JS Bundle code and make sure which framework it's based to. Each JS
 * Bundle should make sure that it starts with a line of JSON comment and is
 * more that one line.
 * @param  {string} code
 * @return {object}
 */
function getBundleType (code) {
  var result = versionRegExp.exec(code);
  if (result) {
    try {
      var info = JSON.parse(result[1]);
      return info.framework
    }
    catch (e) {}
  }

  // default bundle type
  return 'Weex'
}

function createServices (id, env, config) {
  // Init JavaScript services for this instance.
  var serviceMap = Object.create(null);
  serviceMap.service = Object.create(null);
  services.forEach(function (ref) {
    var name = ref.name;
    var options = ref.options;

    {
      console.debug(("[JS Runtime] create service " + name + "."));
    }
    var create = options.create;
    if (create) {
      try {
        var result = create(id, env, config);
        Object.assign(serviceMap.service, result);
        Object.assign(serviceMap, result.instance);
      }
      catch (e) {
        console.error(("[JS Runtime] Failed to create service " + name + "."));
      }
    }
  });
  delete serviceMap.service.instance;
  Object.freeze(serviceMap.service);
  return serviceMap
}

var instanceTypeMap = {};
function getFrameworkType (id) {
  return instanceTypeMap[id]
}

function createInstanceContext (id, options, data) {
  if ( options === void 0 ) options = {};

  var weex = new WeexInstance(id, options);
  Object.freeze(weex);

  var bundleType = options.bundleType || 'Vue';
  instanceTypeMap[id] = bundleType;
  var framework = runtimeConfig.frameworks[bundleType];
  if (!framework) {
    return new Error(("[JS Framework] Invalid bundle type \"" + bundleType + "\"."))
  }
  track(id, 'bundleType', bundleType);

  // prepare js service
  var services$$1 = createServices(id, {
    weex: weex,
    config: options,
    created: Date.now(),
    framework: bundleType,
    bundleType: bundleType
  }, runtimeConfig);
  Object.freeze(services$$1);

  // prepare runtime context
  var runtimeContext = Object.create(null);
  Object.assign(runtimeContext, services$$1, {
    weex: weex,
    services: services$$1 // Temporary compatible with some legacy APIs in Rax
  });
  Object.freeze(runtimeContext);

  // prepare instance context
  var instanceContext = Object.assign({}, runtimeContext);
  if (typeof framework.createInstanceContext === 'function') {
    Object.assign(instanceContext, framework.createInstanceContext(id, runtimeContext, data));
  }
  Object.freeze(instanceContext);
  return instanceContext
}

/**
 * Check which framework a certain JS Bundle code based to. And create instance
 * by this framework.
 * @param {string} id
 * @param {string} code
 * @param {object} config
 * @param {object} data
 */
function createInstance (id, code, config, data) {
  if (instanceTypeMap[id]) {
    return new Error(("The instance id \"" + id + "\" has already been used!"))
  }

  // Init instance info.
  var bundleType = getBundleType(code);
  instanceTypeMap[id] = bundleType;

  // Init instance config.
  config = JSON.parse(JSON.stringify(config || {}));
  config.env = JSON.parse(JSON.stringify(global.WXEnvironment || {}));
  config.bundleType = bundleType;

  var framework = runtimeConfig.frameworks[bundleType];
  if (!framework) {
    return new Error(("[JS Framework] Invalid bundle type \"" + bundleType + "\"."))
  }
  if (bundleType === 'Weex') {
    console.error("[JS Framework] COMPATIBILITY WARNING: "
      + "Weex DSL 1.0 (.we) framework is no longer supported! "
      + "It will be removed in the next version of WeexSDK, "
      + "your page would be crash if you still using the \".we\" framework. "
      + "Please upgrade it to Vue.js or Rax.");
  }

  var instanceContext = createInstanceContext(id, config, data);
  if (typeof framework.createInstance === 'function') {
    // Temporary compatible with some legacy APIs in Rax,
    // some Rax page is using the legacy ".we" framework.
    if (bundleType === 'Rax' || bundleType === 'Weex') {
      var raxInstanceContext = Object.assign({
        config: config,
        created: Date.now(),
        framework: bundleType
      }, instanceContext);
      return framework.createInstance(id, code, config, data, raxInstanceContext)
    }
    return framework.createInstance(id, code, config, data, instanceContext)
  }
  // console.error(`[JS Framework] Can't find available "createInstance" method in ${bundleType}!`)
  runInContext(code, instanceContext);
}

/**
 * Run js code in a specific context.
 * @param {string} code
 * @param {object} context
 */
function runInContext (code, context) {
  var keys = [];
  var args = [];
  for (var key in context) {
    keys.push(key);
    args.push(context[key]);
  }

  var bundle = "\n    (function (global) {\n      " + code + "\n    })(Object.create(this))\n  ";

  return (new (Function.prototype.bind.apply( Function, [ null ].concat( keys, [bundle]) ))).apply(void 0, args)
}

/**
 * Get the JSON object of the root element.
 * @param {string} instanceId
 */
function getRoot (instanceId) {
  var document = getDoc(instanceId);
  try {
    if (document && document.body) {
      return document.body.toJSON()
    }
  }
  catch (e) {
    console.error("[JS Framework] Failed to get the virtual dom tree.");
    return
  }
}

var methods = {
  createInstance: createInstance,
  createInstanceContext: createInstanceContext,
  getRoot: getRoot,
  getDocument: getDoc,
  registerService: register,
  unregisterService: unregister,
  callJS: function callJS (id, tasks) {
    var framework = frameworks[getFrameworkType(id)];
    if (framework && typeof framework.receiveTasks === 'function') {
      return framework.receiveTasks(id, tasks)
    }
    return receiveTasks(id, tasks)
  }
};

/**
 * Register methods which will be called for each instance.
 * @param {string} methodName
 */
function genInstance (methodName) {
  methods[methodName] = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var id = args[0];
    var type = getFrameworkType(id);
    if (type && frameworks[type]) {
      var result = (ref = frameworks[type])[methodName].apply(ref, args);
      var info = { framework: type };

      // Lifecycle methods
      if (methodName === 'refreshInstance') {
        services.forEach(function (service) {
          var refresh = service.options.refresh;
          if (refresh) {
            refresh(id, { info: info, runtime: runtimeConfig });
          }
        });
      }
      else if (methodName === 'destroyInstance') {
        services.forEach(function (service) {
          var destroy = service.options.destroy;
          if (destroy) {
            destroy(id, { info: info, runtime: runtimeConfig });
          }
        });
        delete instanceTypeMap[id];
      }

      return result
    }
    return new Error("[JS Framework] Using invalid instance id "
      + "\"" + id + "\" when calling " + methodName + ".")
    var ref;
  };
}

/**
 * Register methods which init each frameworks.
 * @param {string} methodName
 * @param {function} sharedMethod
 */
function adaptMethod (methodName, sharedMethod) {
  methods[methodName] = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    if (typeof sharedMethod === 'function') {
      sharedMethod.apply(void 0, args);
    }

    // TODO: deprecated
    for (var name in runtimeConfig.frameworks) {
      var framework = runtimeConfig.frameworks[name];
      if (framework && framework[methodName]) {
        framework[methodName].apply(framework, args);
      }
    }
  };
}

function init$$1 (config) {
  runtimeConfig = config || {};
  frameworks = runtimeConfig.frameworks || {};
  init$1();

  // Init each framework by `init` method and `config` which contains three
  // virtual-DOM Class: `Document`, `Element` & `Comment`, and a JS bridge method:
  // `sendTasks(...args)`.
  for (var name in frameworks) {
    var framework = frameworks[name];
    if (typeof framework.init === 'function') {
      try {
        framework.init(config);
      }
      catch (e) {}
    }
  }

  adaptMethod('registerComponents', registerComponents);
  adaptMethod('registerModules', registerModules);
  adaptMethod('registerMethods')

  ; ['destroyInstance', 'refreshInstance'].forEach(genInstance);

  return methods
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var config = {
  Document: Document, Element: Element, Comment: Comment, Listener: Listener,
  TaskCenter: TaskCenter,
  sendTasks: function sendTasks () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    if (typeof callNative === 'function') {
      return callNative.apply(void 0, args)
    }
    return (global.callNative || (function () {})).apply(void 0, args)
  }
};

Document.handler = config.sendTasks;

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* istanbul ignore next */
function freezePrototype () {
  // Object.freeze(config.Element)
  Object.freeze(config.Comment);
  Object.freeze(config.Listener);
  Object.freeze(config.Document.prototype);
  // Object.freeze(config.Element.prototype)
  Object.freeze(config.Comment.prototype);
  Object.freeze(config.Listener.prototype);
}

var runtime = {
  service: { register: register, unregister: unregister, has: has },
  freezePrototype: freezePrototype,
  init: init$$1,
  config: config
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Mock MessageEvent type
 * @param {string} type
 * @param {object} dict { data, origin, source, ports }
 *
 * This type has been simplified.
 * https://html.spec.whatwg.org/multipage/comms.html#messageevent
 * https://dom.spec.whatwg.org/#interface-event
 */
function MessageEvent (type, dict) {
  if ( dict === void 0 ) dict = {};

  this.type = type || 'message';

  this.data = dict.data || null;
  this.origin = dict.origin || '';
  this.source = dict.source || null;
  this.ports = dict.ports || [];

  // inherit properties
  this.target = null;
  this.timeStamp = Date.now();
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * @fileOverview
 * The polyfill of BroadcastChannel API.
 * This api can be used to achieve inter-instance communications.
 *
 * https://html.spec.whatwg.org/multipage/comms.html#broadcasting-to-other-browsing-contexts
 */

var channels = {};
var instances = {};

/**
 * An empty constructor for BroadcastChannel polyfill.
 * The real constructor will be defined when a Weex instance created because
 * we need to track the channel by Weex instance id.
 */
function BroadcastChannel () {}

/**
 * Sends the given message to other BroadcastChannel objects set up for this channel.
 * @param {any} message
 */
BroadcastChannel.prototype.postMessage = function (message) {
  var this$1 = this;

  if (this._closed) {
    throw new Error(("BroadcastChannel \"" + (this.name) + "\" is closed."))
  }

  var subscribers = channels[this.name];
  if (subscribers && subscribers.length) {
    for (var i = 0; i < subscribers.length; ++i) {
      var member = subscribers[i];

      if (member._closed || member === this$1) { continue }

      if (typeof member.onmessage === 'function') {
        member.onmessage(new MessageEvent('message', { data: message }));
      }
    }
  }
};

/**
 * Closes the BroadcastChannel object, opening it up to garbage collection.
 */
BroadcastChannel.prototype.close = function () {
  var this$1 = this;

  if (this._closed) {
    return
  }

  this._closed = true;

  // remove itself from channels.
  if (channels[this.name]) {
    var subscribers = channels[this.name].filter(function (x) { return x !== this$1; });
    if (subscribers.length) {
      channels[this.name] = subscribers;
    }
    else {
      delete channels[this.name];
    }
  }
};

var BroadcastChannel$1 = {
  create: function (id, env, config) {
    instances[id] = [];
    if (typeof global.BroadcastChannel === 'function') {
      return {}
    }
    var serviceObject = {
      /**
       * Returns a new BroadcastChannel object via which messages for the given
       * channel name can be sent and received.
       * @param {string} name
       */
      BroadcastChannel: function (name) {
        // the name property is readonly
        Object.defineProperty(this, 'name', {
          configurable: false,
          enumerable: true,
          writable: false,
          value: String(name)
        });

        this._closed = false;
        this.onmessage = null;

        if (!channels[this.name]) {
          channels[this.name] = [];
        }
        channels[this.name].push(this);
        instances[id].push(this);
      }
    };
    serviceObject.BroadcastChannel.prototype = BroadcastChannel.prototype;
    return {
      instance: serviceObject
    }
  },
  destroy: function (id, env) {
    instances[id].forEach(function (channel) { return channel.close(); });
    delete instances[id];
  }
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var services$1 = {
  BroadcastChannel: BroadcastChannel$1
}

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Setup frameworks with runtime.
 * You can package more frameworks by
 *  passing them as arguments.
 */
function setup (frameworks) {
  var init = runtime.init;
  var config = runtime.config;
  config.frameworks = frameworks;
  var native = subversion.native;
  var transformer = subversion.transformer;

  for (var serviceName in services$1) {
    runtime.service.register(serviceName, services$1[serviceName]);
  }

  runtime.freezePrototype();

  // register framework meta info
  global.frameworkVersion = native;
  global.transformerVersion = transformer;

  // init frameworks
  var globalMethods = init(config);

  // set global methods
  var loop = function ( methodName ) {
    global[methodName] = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var ret = globalMethods[methodName].apply(globalMethods, args);
      if (ret instanceof Error) {
        console.error(ret.toString());
      }
      return ret
    };
  };

  for (var methodName in globalMethods) loop( methodName );
}

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var factory = createCommonjsModule(function (module) {
module.exports = function weexFactory (exports, document) {

/*  */

var emptyObject = Object.freeze({});

// these helpers produces better vm code in JS engines due to their
// explicitness and function inlining
function isUndef (v) {
  return v === undefined || v === null
}

function isDef (v) {
  return v !== undefined && v !== null
}

function isTrue (v) {
  return v === true
}

function isFalse (v) {
  return v === false
}

/**
 * Check if value is primitive
 */
function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Get the raw type string of a value e.g. [object Object]
 */
var _toString = Object.prototype.toString;

function toRawType (value) {
  return _toString.call(value).slice(8, -1)
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
function isPlainObject (obj) {
  return _toString.call(obj) === '[object Object]'
}

function isRegExp (v) {
  return _toString.call(v) === '[object RegExp]'
}

/**
 * Check if val is a valid array index.
 */
function isValidArrayIndex (val) {
  var n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

/**
 * Convert a value to a string that is actually rendered.
 */
function toString (val) {
  return val == null
    ? ''
    : typeof val === 'object'
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 */
function toNumber (val) {
  var n = parseFloat(val);
  return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap (
  str,
  expectsLowerCase
) {
  var map = Object.create(null);
  var list = str.split(',');
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? function (val) { return map[val.toLowerCase()]; }
    : function (val) { return map[val]; }
}

/**
 * Check if a tag is a built-in tag.
 */
var isBuiltInTag = makeMap('slot,component', true);

/**
 * Check if a attribute is a reserved attribute.
 */
var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

/**
 * Remove an item from an array
 */
function remove (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether the object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

/**
 * Create a cached version of a pure function.
 */
function cached (fn) {
  var cache = Object.create(null);
  return (function cachedFn (str) {
    var hit = cache[str];
    return hit || (cache[str] = fn(str))
  })
}

/**
 * Camelize a hyphen-delimited string.
 */
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});

/**
 * Capitalize a string.
 */
var capitalize = cached(function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
});

/**
 * Hyphenate a camelCase string.
 */
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cached(function (str) {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
});

/**
 * Simple bind, faster than native
 */
function bind (fn, ctx) {
  function boundFn (a) {
    var l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }
  // record original fn length
  boundFn._length = fn.length;
  return boundFn
}

/**
 * Convert an Array-like object to a real Array.
 */
function toArray (list, start) {
  start = start || 0;
  var i = list.length - start;
  var ret = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret
}

/**
 * Mix properties into target object.
 */
function extend (to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to
}

/**
 * Merge an Array of Objects into a single Object.
 */
function toObject (arr) {
  var res = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res
}

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/)
 */
function noop (a, b, c) {}

/**
 * Always return false.
 */
var no = function (a, b, c) { return false; };

/**
 * Return same value
 */
var identity = function (_) { return _; };

/**
 * Generate a static keys string from compiler modules.
 */


/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
function looseEqual (a, b) {
  if (a === b) { return true }
  var isObjectA = isObject(a);
  var isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      var isArrayA = Array.isArray(a);
      var isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every(function (e, i) {
          return looseEqual(e, b[i])
        })
      } else if (!isArrayA && !isArrayB) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every(function (key) {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

function looseIndexOf (arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) { return i }
  }
  return -1
}

/**
 * Ensure a function is called only once.
 */
function once (fn) {
  var called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  }
}

var SSR_ATTR = 'data-server-rendered';

var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];

var LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured'
];

/*  */

var config = ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * Show production mode tip message on boot?
   */
  productionTip: "development" !== 'production',

  /**
   * Whether to enable devtools
   */
  devtools: "development" !== 'production',

  /**
   * Whether to record perf
   */
  performance: false,

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   */
  warnHandler: null,

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
});

/*  */

/**
 * Check if a string starts with $ or _
 */
function isReserved (str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.
 */
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/**
 * Parse simple path.
 */
var bailRE = /[^\w.$]/;
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  var segments = path.split('.');
  return function (obj) {
    for (var i = 0; i < segments.length; i++) {
      if (!obj) { return }
      obj = obj[segments[i]];
    }
    return obj
  }
}

/*  */


// can we use __proto__?
var hasProto = '__proto__' in {};

// Browser environment sniffing
var inBrowser = typeof window !== 'undefined';
var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
var UA = inBrowser && window.navigator.userAgent.toLowerCase();
var isIE = UA && /msie|trident/.test(UA);
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isEdge = UA && UA.indexOf('edge/') > 0;
var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;

// Firefox has a "watch" function on Object.prototype...
var nativeWatch = ({}).watch;


if (inBrowser) {
  try {
    var opts = {};
    Object.defineProperty(opts, 'passive', ({
      get: function get () {
        /* istanbul ignore next */

      }
    })); // https://github.com/facebook/flow/issues/285
    window.addEventListener('test-passive', null, opts);
  } catch (e) {}
}

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
var _isServer;
var isServerRendering = function () {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'].env.VUE_ENV === 'server';
    } else {
      _isServer = false;
    }
  }
  return _isServer
};

// detect devtools
var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

/* istanbul ignore next */
function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

var hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

var _Set;
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = (function () {
    function Set () {
      this.set = Object.create(null);
    }
    Set.prototype.has = function has (key) {
      return this.set[key] === true
    };
    Set.prototype.add = function add (key) {
      this.set[key] = true;
    };
    Set.prototype.clear = function clear () {
      this.set = Object.create(null);
    };

    return Set;
  }());
}

/*  */

var warn = noop;
var tip = noop;
var generateComponentTrace = (noop); // work around flow check
var formatComponentName = (noop);

{
  var hasConsole = typeof console !== 'undefined';
  var classifyRE = /(?:^|[-_])(\w)/g;
  var classify = function (str) { return str
    .replace(classifyRE, function (c) { return c.toUpperCase(); })
    .replace(/[-_]/g, ''); };

  warn = function (msg, vm) {
    var trace = vm ? generateComponentTrace(vm) : '';

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace);
    } else if (hasConsole && (!config.silent)) {
      console.error(("[Vue warn]: " + msg + trace));
    }
  };

  tip = function (msg, vm) {
    if (hasConsole && (!config.silent)) {
      console.warn("[Vue tip]: " + msg + (
        vm ? generateComponentTrace(vm) : ''
      ));
    }
  };

  formatComponentName = function (vm, includeFile) {
    if (vm.$root === vm) {
      return '<Root>'
    }
    var options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm || {};
    var name = options.name || options._componentTag;
    var file = options.__file;
    if (!name && file) {
      var match = file.match(/([^/\\]+)\.vue$/);
      name = match && match[1];
    }

    return (
      (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
      (file && includeFile !== false ? (" at " + file) : '')
    )
  };

  var repeat = function (str, n) {
    var res = '';
    while (n) {
      if (n % 2 === 1) { res += str; }
      if (n > 1) { str += str; }
      n >>= 1;
    }
    return res
  };

  generateComponentTrace = function (vm) {
    if (vm._isVue && vm.$parent) {
      var tree = [];
      var currentRecursiveSequence = 0;
      while (vm) {
        if (tree.length > 0) {
          var last = tree[tree.length - 1];
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++;
            vm = vm.$parent;
            continue
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence];
            currentRecursiveSequence = 0;
          }
        }
        tree.push(vm);
        vm = vm.$parent;
      }
      return '\n\nfound in\n\n' + tree
        .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
            ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
            : formatComponentName(vm))); })
        .join('\n')
    } else {
      return ("\n\n(found in " + (formatComponentName(vm)) + ")")
    }
  };
}

/*  */


var uid$1 = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep () {
  this.id = uid$1++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.notify = function notify () {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null;
var targetStack = [];

function pushTarget (_target) {
  if (Dep.target) { targetStack.push(Dep.target); }
  Dep.target = _target;
}

function popTarget () {
  Dep.target = targetStack.pop();
}

/*  */

var VNode = function VNode (
  tag,
  data,
  children,
  text,
  elm,
  context,
  componentOptions,
  asyncFactory
) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;
  this.elm = elm;
  this.ns = undefined;
  this.context = context;
  this.fnContext = undefined;
  this.fnOptions = undefined;
  this.fnScopeId = undefined;
  this.key = data && data.key;
  this.componentOptions = componentOptions;
  this.componentInstance = undefined;
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
};

var prototypeAccessors = { child: { configurable: true } };

// DEPRECATED: alias for componentInstance for backwards compat.
/* istanbul ignore next */
prototypeAccessors.child.get = function () {
  return this.componentInstance
};

Object.defineProperties( VNode.prototype, prototypeAccessors );

var createEmptyVNode = function (text) {
  if ( text === void 0 ) { text = ''; }

  var node = new VNode();
  node.text = text;
  node.isComment = true;
  return node
};

function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
function cloneVNode (vnode, deep) {
  var componentOptions = vnode.componentOptions;
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.isCloned = true;
  if (deep) {
    if (vnode.children) {
      cloned.children = cloneVNodes(vnode.children, true);
    }
    if (componentOptions && componentOptions.children) {
      componentOptions.children = cloneVNodes(componentOptions.children, true);
    }
  }
  return cloned
}

function cloneVNodes (vnodes, deep) {
  var len = vnodes.length;
  var res = new Array(len);
  for (var i = 0; i < len; i++) {
    res[i] = cloneVNode(vnodes[i], deep);
  }
  return res
}

/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
].forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    var arguments$1 = arguments;

    var args = [], len = arguments.length;
    while ( len-- ) { args[ len ] = arguments$1[ len ]; }

    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // notify change
    ob.dep.notify();
    return result
  });
});

/*  */

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */
var observerState = {
  shouldConvert: true
};

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    var augment = hasProto
      ? protoAugment
      : copyAugment;
    augment(value, arrayMethods, arrayKeys);
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i], obj[keys[i]]);
  }
};

/**
 * Observe a list of Array items.
 */
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src, keys) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe (value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    observerState.shouldConvert &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive (
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if ("development" !== 'production' && customSetter) {
        customSetter();
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set (target, key, val) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    "development" !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return val
  }
  if (!ob) {
    target[key] = val;
    return val
  }
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
function del (target, key) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    "development" !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key];
  if (!ob) {
    return
  }
  ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

/*  */

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
var strats = config.optionMergeStrategies;

/**
 * Options with restrictions
 */
{
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        "option \"" + key + "\" can only be used during instance " +
        'creation with the `new` keyword.'
      );
    }
    return defaultStrat(parent, child)
  };
}

/**
 * Helper that recursively merges two data objects together.
 */
function mergeData (to, from) {
  if (!from) { return to }
  var key, toVal, fromVal;
  var keys = Object.keys(from);
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal);
    }
  }
  return to
}

/**
 * Data
 */
function mergeDataOrFn (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      var instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal;
      var defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

strats.data = function (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      "development" !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      );

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
};

/**
 * Hooks and props are merged as arrays.
 */
function mergeHook (
  parentVal,
  childVal
) {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}

LIFECYCLE_HOOKS.forEach(function (hook) {
  strats[hook] = mergeHook;
});

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets (
  parentVal,
  childVal,
  vm,
  key
) {
  var res = Object.create(parentVal || null);
  if (childVal) {
    "development" !== 'production' && assertObjectType(key, childVal, vm);
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (
  parentVal,
  childVal,
  vm,
  key
) {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) { parentVal = undefined; }
  if (childVal === nativeWatch) { childVal = undefined; }
  /* istanbul ignore if */
  if (!childVal) { return Object.create(parentVal || null) }
  {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = {};
  extend(ret, parentVal);
  for (var key$1 in childVal) {
    var parent = ret[key$1];
    var child = childVal[key$1];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key$1] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child];
  }
  return ret
};

/**
 * Other object hashes.
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal,
  childVal,
  vm,
  key
) {
  if (childVal && "development" !== 'production') {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = Object.create(null);
  extend(ret, parentVal);
  if (childVal) { extend(ret, childVal); }
  return ret
};
strats.provide = mergeDataOrFn;

/**
 * Default strategy.
 */
var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
};

/**
 * Validate component names
 */
function checkComponents (options) {
  for (var key in options.components) {
    validateComponentName(key);
  }
}

function validateComponentName (name) {
  if (!/^[a-zA-Z][\w-]*$/.test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'can only contain alphanumeric characters and the hyphen, ' +
      'and must start with a letter.'
    );
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    );
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps (options, vm) {
  var props = options.props;
  if (!props) { return }
  var res = {};
  var i, val, name;
  if (Array.isArray(props)) {
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === 'string') {
        name = camelize(val);
        res[name] = { type: null };
      } else {
        warn('props must be strings when using array syntax.');
      }
    }
  } else if (isPlainObject(props)) {
    for (var key in props) {
      val = props[key];
      name = camelize(key);
      if ("development" !== 'production' && isPlainObject(val)) {
        validatePropObject(name, val, vm);
      }
      res[name] = isPlainObject(val)
        ? val
        : { type: val };
    }
  } else {
    warn(
      "Invalid value for option \"props\": expected an Array or an Object, " +
      "but got " + (toRawType(props)) + ".",
      vm
    );
  }
  options.props = res;
}

/**
 * Validate whether a prop object keys are valid.
 */
var propOptionsRE = /^(type|default|required|validator)$/;

function validatePropObject (
  propName,
  prop,
  vm
) {
  for (var key in prop) {
    if (!propOptionsRE.test(key)) {
      warn(
        ("Invalid key \"" + key + "\" in validation rules object for prop \"" + propName + "\"."),
        vm
      );
    }
  }
}

/**
 * Normalize all injections into Object-based format
 */
function normalizeInject (options, vm) {
  var inject = options.inject;
  if (!inject) { return }
  var normalized = options.inject = {};
  if (Array.isArray(inject)) {
    for (var i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] };
    }
  } else if (isPlainObject(inject)) {
    for (var key in inject) {
      var val = inject[key];
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val };
    }
  } else {
    warn(
      "Invalid value for option \"inject\": expected an Array or an Object, " +
      "but got " + (toRawType(inject)) + ".",
      vm
    );
  }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options) {
  var dirs = options.directives;
  if (dirs) {
    for (var key in dirs) {
      var def = dirs[key];
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def };
      }
    }
  }
}

function assertObjectType (name, value, vm) {
  if (!isPlainObject(value)) {
    warn(
      "Invalid value for option \"" + name + "\": expected an Object, " +
      "but got " + (toRawType(value)) + ".",
      vm
    );
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions (
  parent,
  child,
  vm
) {
  {
    checkComponents(child);
  }

  if (typeof child === 'function') {
    child = child.options;
  }

  normalizeProps(child, vm);
  normalizeInject(child, vm);
  normalizeDirectives(child);
  var extendsFrom = child.extends;
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm);
  }
  if (child.mixins) {
    for (var i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm);
    }
  }
  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
function resolveAsset (
  options,
  type,
  id,
  warnMissing
) {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  var assets = options[type];
  // check local registration variations first
  if (hasOwn(assets, id)) { return assets[id] }
  var camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
  var PascalCaseId = capitalize(camelizedId);
  if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
  // fallback to prototype chain
  var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
  if ("development" !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    );
  }
  return res
}

/*  */

function validateProp (
  key,
  propOptions,
  propsData,
  vm
) {
  var prop = propOptions[key];
  var absent = !hasOwn(propsData, key);
  var value = propsData[key];
  // handle boolean props
  if (isType(Boolean, prop.type)) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false;
    } else if (!isType(String, prop.type) && (value === '' || value === hyphenate(key))) {
      value = true;
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    var prevShouldConvert = observerState.shouldConvert;
    observerState.shouldConvert = true;
    observe(value);
    observerState.shouldConvert = prevShouldConvert;
  }
  if (
    "development" !== 'production' &&
    // skip validation for weex recycle-list child component props
    !(true && isObject(value) && ('@binding' in value))
  ) {
    assertProp(prop, key, value, vm, absent);
  }
  return value
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm, prop, key) {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  var def = prop.default;
  // warn against non-factory defaults for Object & Array
  if ("development" !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    );
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
function assertProp (
  prop,
  name,
  value,
  vm,
  absent
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    );
    return
  }
  if (value == null && !prop.required) {
    return
  }
  var type = prop.type;
  var valid = !type || type === true;
  var expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }
  if (!valid) {
    warn(
      "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', ')) +
      ", got " + (toRawType(value)) + ".",
      vm
    );
    return
  }
  var validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

function assertType (value, type) {
  var valid;
  var expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    var t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid: valid,
    expectedType: expectedType
  }
}

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  var match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : ''
}

function isType (type, fn) {
  if (!Array.isArray(fn)) {
    return getType(fn) === getType(type)
  }
  for (var i = 0, len = fn.length; i < len; i++) {
    if (getType(fn[i]) === getType(type)) {
      return true
    }
  }
  /* istanbul ignore next */
  return false
}

/*  */

function handleError (err, vm, info) {
  if (vm) {
    var cur = vm;
    while ((cur = cur.$parent)) {
      var hooks = cur.$options.errorCaptured;
      if (hooks) {
        for (var i = 0; i < hooks.length; i++) {
          try {
            var capture = hooks[i].call(cur, err, vm, info) === false;
            if (capture) { return }
          } catch (e) {
            globalHandleError(e, cur, 'errorCaptured hook');
          }
        }
      }
    }
  }
  globalHandleError(err, vm, info);
}

function globalHandleError (err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      logError(e, null, 'config.errorHandler');
    }
  }
  logError(err, vm, info);
}

function logError (err, vm, info) {
  {
    warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err);
  } else {
    throw err
  }
}

/*  */
/* globals MessageChannel */

var callbacks = [];
var pending = false;

function flushCallbacks () {
  pending = false;
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

// Here we have async deferring wrappers using both micro and macro tasks.
// In < 2.4 we used micro tasks everywhere, but there are some scenarios where
// micro tasks have too high a priority and fires in between supposedly
// sequential events (e.g. #4521, #6690) or even between bubbling of the same
// event (#6566). However, using macro tasks everywhere also has subtle problems
// when state is changed right before repaint (e.g. #6813, out-in transitions).
// Here we use micro task by default, but expose a way to force macro task when
// needed (e.g. in event handlers attached by v-on).
var microTimerFunc;
var macroTimerFunc;
var useMacroTask = false;

// Determine (macro) Task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  macroTimerFunc = function () {
    setImmediate(flushCallbacks);
  };
} else if (typeof MessageChannel !== 'undefined' && (
  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'
)) {
  var channel = new MessageChannel();
  var port = channel.port2;
  channel.port1.onmessage = flushCallbacks;
  macroTimerFunc = function () {
    port.postMessage(1);
  };
} else {
  /* istanbul ignore next */
  macroTimerFunc = function () {
    setTimeout(flushCallbacks, 0);
  };
}

// Determine MicroTask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  var p = Promise.resolve();
  microTimerFunc = function () {
    p.then(flushCallbacks);
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) { setTimeout(noop); }
  };
} else {
  // fallback to macro
  microTimerFunc = macroTimerFunc;
}

/**
 * Wrap a function so that if any code inside triggers state change,
 * the changes are queued using a Task instead of a MicroTask.
 */


function nextTick (cb, ctx) {
  var _resolve;
  callbacks.push(function () {
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    if (useMacroTask) {
      macroTimerFunc();
    } else {
      microTimerFunc();
    }
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(function (resolve) {
      _resolve = resolve;
    })
  }
}

/*  */

/* not type checking this file because flow doesn't play well with Proxy */

var initProxy;

{
  var allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  );

  var warnNonPresent = function (target, key) {
    warn(
      "Property or method \"" + key + "\" is not defined on the instance but " +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    );
  };

  var hasProxy =
    typeof Proxy !== 'undefined' &&
    Proxy.toString().match(/native code/);

  if (hasProxy) {
    var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
    config.keyCodes = new Proxy(config.keyCodes, {
      set: function set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
          return false
        } else {
          target[key] = value;
          return true
        }
      }
    });
  }

  var hasHandler = {
    has: function has (target, key) {
      var has = key in target;
      var isAllowed = allowedGlobals(key) || key.charAt(0) === '_';
      if (!has && !isAllowed) {
        warnNonPresent(target, key);
      }
      return has || !isAllowed
    }
  };

  var getHandler = {
    get: function get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        warnNonPresent(target, key);
      }
      return target[key]
    }
  };

  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      var options = vm.$options;
      var handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler;
      vm._renderProxy = new Proxy(vm, handlers);
    } else {
      vm._renderProxy = vm;
    }
  };
}

/*  */

var seenObjects = new _Set();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
function traverse (val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse (val, seen) {
  var i, keys;
  var isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || Object.isFrozen(val)) {
    return
  }
  if (val.__ob__) {
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}

var mark;
var measure;

{
  var perf = inBrowser && window.performance;
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) {
    mark = function (tag) { return perf.mark(tag); };
    measure = function (name, startTag, endTag) {
      perf.measure(name, startTag, endTag);
      perf.clearMarks(startTag);
      perf.clearMarks(endTag);
      perf.clearMeasures(name);
    };
  }
}

/*  */

var normalizeEvent = cached(function (name) {
  var passive = name.charAt(0) === '&';
  name = passive ? name.slice(1) : name;
  var once$$1 = name.charAt(0) === '~'; // Prefixed last, checked first
  name = once$$1 ? name.slice(1) : name;
  var capture = name.charAt(0) === '!';
  name = capture ? name.slice(1) : name;
  return {
    name: name,
    once: once$$1,
    capture: capture,
    passive: passive
  }
});

function createFnInvoker (fns) {
  function invoker () {
    var arguments$1 = arguments;

    var fns = invoker.fns;
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        cloned[i].apply(null, arguments$1);
      }
    } else {
      // return handler return value for single handlers
      return fns.apply(null, arguments)
    }
  }
  invoker.fns = fns;
  return invoker
}

function updateListeners (
  on,
  oldOn,
  add,
  remove$$1,
  vm
) {
  var name, def, cur, old, event;
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name);
    /* istanbul ignore if */
    if (true && isPlainObject(def)) {
      cur = def.handler;
      event.params = def.params;
    }
    if (isUndef(cur)) {
      "development" !== 'production' && warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur);
      }
      add(event.name, cur, event.once, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      old.fns = cur;
      on[name] = old;
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove$$1(event.name, oldOn[name], event.capture);
    }
  }
}

/*  */

function mergeVNodeHook (def, hookKey, hook) {
  if (def instanceof VNode) {
    def = def.data.hook || (def.data.hook = {});
  }
  var invoker;
  var oldHook = def[hookKey];

  function wrappedHook () {
    hook.apply(this, arguments);
    // important: remove merged hook to ensure it's called only once
    // and prevent memory leak
    remove(invoker.fns, wrappedHook);
  }

  if (isUndef(oldHook)) {
    // no existing hook
    invoker = createFnInvoker([wrappedHook]);
  } else {
    /* istanbul ignore if */
    if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
      // already a merged invoker
      invoker = oldHook;
      invoker.fns.push(wrappedHook);
    } else {
      // existing plain hook
      invoker = createFnInvoker([oldHook, wrappedHook]);
    }
  }

  invoker.merged = true;
  def[hookKey] = invoker;
}

/*  */

function extractPropsFromVNodeData (
  data,
  Ctor,
  tag
) {
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  var propOptions = Ctor.options.props;
  if (isUndef(propOptions)) {
    return
  }
  var res = {};
  var attrs = data.attrs;
  var props = data.props;
  if (isDef(attrs) || isDef(props)) {
    for (var key in propOptions) {
      var altKey = hyphenate(key);
      {
        var keyInLowerCase = key.toLowerCase();
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          tip(
            "Prop \"" + keyInLowerCase + "\" is passed to component " +
            (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
            " \"" + key + "\". " +
            "Note that HTML attributes are case-insensitive and camelCased " +
            "props need to use their kebab-case equivalents when using in-DOM " +
            "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
          );
        }
      }
      checkProp(res, props, key, altKey, true) ||
      checkProp(res, attrs, key, altKey, false);
    }
  }
  return res
}

function checkProp (
  res,
  hash,
  key,
  altKey,
  preserve
) {
  if (isDef(hash)) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key];
      if (!preserve) {
        delete hash[key];
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey];
      if (!preserve) {
        delete hash[altKey];
      }
      return true
    }
  }
  return false
}

/*  */

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
function simpleNormalizeChildren (children) {
  for (var i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
function normalizeChildren (children) {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

function isTextNode (node) {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

function normalizeArrayChildren (children, nestedIndex) {
  var res = [];
  var i, c, lastIndex, last;
  for (i = 0; i < children.length; i++) {
    c = children[i];
    if (isUndef(c) || typeof c === 'boolean') { continue }
    lastIndex = res.length - 1;
    last = res[lastIndex];
    //  nested
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
        // merge adjacent text nodes
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]).text);
          c.shift();
        }
        res.push.apply(res, c);
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c);
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c));
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text);
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = "__vlist" + nestedIndex + "_" + i + "__";
        }
        res.push(c);
      }
    }
  }
  return res
}

/*  */

function ensureCtor (comp, base) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default;
  }
  return isObject(comp)
    ? base.extend(comp)
    : comp
}

function createAsyncPlaceholder (
  factory,
  data,
  context,
  children,
  tag
) {
  var node = createEmptyVNode();
  node.asyncFactory = factory;
  node.asyncMeta = { data: data, context: context, children: children, tag: tag };
  return node
}

function resolveAsyncComponent (
  factory,
  baseCtor,
  context
) {
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }

  if (isDef(factory.resolved)) {
    return factory.resolved
  }

  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    return factory.loadingComp
  }

  if (isDef(factory.contexts)) {
    // already pending
    factory.contexts.push(context);
  } else {
    var contexts = factory.contexts = [context];
    var sync = true;

    var forceRender = function () {
      for (var i = 0, l = contexts.length; i < l; i++) {
        contexts[i].$forceUpdate();
      }
    };

    var resolve = once(function (res) {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor);
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender();
      }
    });

    var reject = once(function (reason) {
      "development" !== 'production' && warn(
        "Failed to resolve async component: " + (String(factory)) +
        (reason ? ("\nReason: " + reason) : '')
      );
      if (isDef(factory.errorComp)) {
        factory.error = true;
        forceRender();
      }
    });

    var res = factory(resolve, reject);

    if (isObject(res)) {
      if (typeof res.then === 'function') {
        // () => Promise
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject);
        }
      } else if (isDef(res.component) && typeof res.component.then === 'function') {
        res.component.then(resolve, reject);

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor);
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor);
          if (res.delay === 0) {
            factory.loading = true;
          } else {
            setTimeout(function () {
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true;
                forceRender();
              }
            }, res.delay || 200);
          }
        }

        if (isDef(res.timeout)) {
          setTimeout(function () {
            if (isUndef(factory.resolved)) {
              reject(
                "timeout (" + (res.timeout) + "ms)"
              );
            }
          }, res.timeout);
        }
      }
    }

    sync = false;
    // return in case resolved synchronously
    return factory.loading
      ? factory.loadingComp
      : factory.resolved
  }
}

/*  */

function isAsyncPlaceholder (node) {
  return node.isComment && node.asyncFactory
}

/*  */

function getFirstComponentChild (children) {
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}

/*  */

/*  */

function initEvents (vm) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}

var target;

function add (event, fn, once) {
  if (once) {
    target.$once(event, fn);
  } else {
    target.$on(event, fn);
  }
}

function remove$1 (event, fn) {
  target.$off(event, fn);
}

function updateComponentListeners (
  vm,
  listeners,
  oldListeners
) {
  target = vm;
  updateListeners(listeners, oldListeners || {}, add, remove$1, vm);
  target = undefined;
}

function eventsMixin (Vue) {
  var hookRE = /^hook:/;
  Vue.prototype.$on = function (event, fn) {
    var this$1 = this;

    var vm = this;
    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm
  };

  Vue.prototype.$once = function (event, fn) {
    var vm = this;
    function on () {
      vm.$off(event, on);
      fn.apply(vm, arguments);
    }
    on.fn = fn;
    vm.$on(event, on);
    return vm
  };

  Vue.prototype.$off = function (event, fn) {
    var this$1 = this;

    var vm = this;
    // all
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$off(event[i], fn);
      }
      return vm
    }
    // specific event
    var cbs = vm._events[event];
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null;
      return vm
    }
    if (fn) {
      // specific handler
      var cb;
      var i$1 = cbs.length;
      while (i$1--) {
        cb = cbs[i$1];
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i$1, 1);
          break
        }
      }
    }
    return vm
  };

  Vue.prototype.$emit = function (event) {
    var vm = this;
    {
      var lowerCaseEvent = event.toLowerCase();
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          "Event \"" + lowerCaseEvent + "\" is emitted in component " +
          (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
          "Note that HTML attributes are case-insensitive and you cannot use " +
          "v-on to listen to camelCase events when using in-DOM templates. " +
          "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
        );
      }
    }
    var cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      var args = toArray(arguments, 1);
      for (var i = 0, l = cbs.length; i < l; i++) {
        try {
          cbs[i].apply(vm, args);
        } catch (e) {
          handleError(e, vm, ("event handler for \"" + event + "\""));
        }
      }
    }
    return vm
  };
}

/*  */



/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 */
function resolveSlots (
  children,
  context
) {
  var slots = {};
  if (!children) {
    return slots
  }
  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];
    var data = child.data;
    // remove slot attribute if the node is resolved as a Vue slot node
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot;
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) {
      var name = data.slot;
      var slot = (slots[name] || (slots[name] = []));
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || []);
      } else {
        slot.push(child);
      }
    } else {
      (slots.default || (slots.default = [])).push(child);
    }
  }
  // ignore slots that contains only whitespace
  for (var name$1 in slots) {
    if (slots[name$1].every(isWhitespace)) {
      delete slots[name$1];
    }
  }
  return slots
}

function isWhitespace (node) {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}

function resolveScopedSlots (
  fns, // see flow/vnode
  res
) {
  res = res || {};
  for (var i = 0; i < fns.length; i++) {
    if (Array.isArray(fns[i])) {
      resolveScopedSlots(fns[i], res);
    } else {
      res[fns[i].key] = fns[i].fn;
    }
  }
  return res
}

/*  */

var activeInstance = null;
var isUpdatingChildComponent = false;

function initLifecycle (vm) {
  var options = vm.$options;

  // locate first non-abstract parent
  var parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}

function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate');
    }
    var prevEl = vm.$el;
    var prevVnode = vm._vnode;
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    vm._vnode = vnode;
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(
        vm.$el, vnode, hydrating, false /* removeOnly */,
        vm.$options._parentElm,
        vm.$options._refElm
      );
      // no need for the ref nodes after initial patch
      // this prevents keeping a detached DOM tree in memory (#5851)
      vm.$options._parentElm = vm.$options._refElm = null;
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    activeInstance = prevActiveInstance;
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };

  Vue.prototype.$forceUpdate = function () {
    var vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  };

  Vue.prototype.$destroy = function () {
    var vm = this;
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy');
    vm._isBeingDestroyed = true;
    // remove self from parent
    var parent = vm.$parent;
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm);
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown();
    }
    var i = vm._watchers.length;
    while (i--) {
      vm._watchers[i].teardown();
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--;
    }
    // call the last hook...
    vm._isDestroyed = true;
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null);
    // fire destroyed hook
    callHook(vm, 'destroyed');
    // turn off all instance listeners.
    vm.$off();
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null;
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null;
    }
  };
}

function mountComponent (
  vm,
  el,
  hydrating
) {
  vm.$el = el;
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode;
    {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        );
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        );
      }
    }
  }
  callHook(vm, 'beforeMount');

  var updateComponent;
  /* istanbul ignore if */
  if ("development" !== 'production' && config.performance && mark) {
    updateComponent = function () {
      var name = vm._name;
      var id = vm._uid;
      var startTag = "vue-perf-start:" + id;
      var endTag = "vue-perf-end:" + id;

      mark(startTag);
      var vnode = vm._render();
      mark(endTag);
      measure(("vue " + name + " render"), startTag, endTag);

      mark(startTag);
      vm._update(vnode, hydrating);
      mark(endTag);
      measure(("vue " + name + " patch"), startTag, endTag);
    };
  } else {
    updateComponent = function () {
      vm._update(vm._render(), hydrating);
    };
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, null, true /* isRenderWatcher */);
  hydrating = false;

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true;
    callHook(vm, 'mounted');
  }
  return vm
}

function updateChildComponent (
  vm,
  propsData,
  listeners,
  parentVnode,
  renderChildren
) {
  {
    isUpdatingChildComponent = true;
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren
  var hasChildren = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    parentVnode.data.scopedSlots || // has new scoped slots
    vm.$scopedSlots !== emptyObject // has old scoped slots
  );

  vm.$options._parentVnode = parentVnode;
  vm.$vnode = parentVnode; // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode;
  }
  vm.$options._renderChildren = renderChildren;

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = (parentVnode.data && parentVnode.data.attrs) || emptyObject;
  vm.$listeners = listeners || emptyObject;

  // update props
  if (propsData && vm.$options.props) {
    observerState.shouldConvert = false;
    var props = vm._props;
    var propKeys = vm.$options._propKeys || [];
    for (var i = 0; i < propKeys.length; i++) {
      var key = propKeys[i];
      props[key] = validateProp(key, vm.$options.props, propsData, vm);
    }
    observerState.shouldConvert = true;
    // keep a copy of raw propsData
    vm.$options.propsData = propsData;
  }

  // update listeners
  if (listeners) {
    var oldListeners = vm.$options._parentListeners;
    vm.$options._parentListeners = listeners;
    updateComponentListeners(vm, listeners, oldListeners);
  }
  // resolve slots + force update if has children
  if (hasChildren) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context);
    vm.$forceUpdate();
  }

  {
    isUpdatingChildComponent = false;
  }
}

function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) { return true }
  }
  return false
}

function activateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = false;
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false;
    for (var i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'activated');
  }
}

function deactivateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = true;
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true;
    for (var i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'deactivated');
  }
}

function callHook (vm, hook) {
  var handlers = vm.$options[hook];
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      try {
        handlers[i].call(vm);
      } catch (e) {
        handleError(e, vm, (hook + " hook"));
      }
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook);
  }
}

/*  */


var MAX_UPDATE_COUNT = 100;

var queue = [];
var activatedChildren = [];
var has = {};
var circular = {};
var waiting = false;
var flushing = false;
var index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0;
  has = {};
  {
    circular = {};
  }
  waiting = flushing = false;
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  flushing = true;
  var watcher, id;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort(function (a, b) { return a.id - b.id; });

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    id = watcher.id;
    has[id] = null;
    watcher.run();
    // in dev build, check and stop circular updates.
    if ("development" !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? ("in watcher with expression \"" + (watcher.expression) + "\"")
              : "in a component render function."
          ),
          watcher.vm
        );
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();

  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush');
  }
}

function callUpdatedHooks (queue) {
  var i = queue.length;
  while (i--) {
    var watcher = queue[i];
    var vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted) {
      callHook(vm, 'updated');
    }
  }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
function queueActivatedComponent (vm) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false;
  activatedChildren.push(vm);
}

function callActivatedHooks (queue) {
  for (var i = 0; i < queue.length; i++) {
    queue[i]._inactive = true;
    activateChildComponent(queue[i], true /* true */);
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
function queueWatcher (watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;
      nextTick(flushSchedulerQueue);
    }
  }
}

/*  */

var uid$2 = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
var Watcher = function Watcher (
  vm,
  expOrFn,
  cb,
  options,
  isRenderWatcher
) {
  this.vm = vm;
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
  // options
  if (options) {
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }
  this.cb = cb;
  this.id = ++uid$2; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression = expOrFn.toString();
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = function () {};
      "development" !== 'production' && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  this.value = this.lazy
    ? undefined
    : this.get();
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get () {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
    value = this.getter.call(vm, vm);
  } catch (e) {
    if (this.user) {
      handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value
};

/**
 * Add a dependency to this directive.
 */
Watcher.prototype.addDep = function addDep (dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};

/**
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    var dep = this$1.deps[i];
    if (!this$1.newDepIds.has(dep.id)) {
      dep.removeSub(this$1);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */
Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};

/**
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run () {
  if (this.active) {
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      if (this.user) {
        try {
          this.cb.call(this.vm, value, oldValue);
        } catch (e) {
          handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */
Watcher.prototype.evaluate = function evaluate () {
  this.value = this.get();
  this.dirty = false;
};

/**
 * Depend on all deps collected by this watcher.
 */
Watcher.prototype.depend = function depend () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    this$1.deps[i].depend();
  }
};

/**
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown () {
    var this$1 = this;

  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this$1.deps[i].removeSub(this$1);
    }
    this.active = false;
  }
};

/*  */

var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function initState (vm) {
  vm._watchers = [];
  vm._inlineComputed = null;
  var opts = vm.$options;
  if (opts.props) { initProps(vm, opts.props); }
  if (opts.methods) { initMethods(vm, opts.methods); }
  if (opts.data) {
    initData(vm);
  } else {
    observe(vm._data = {}, true /* asRootData */);
  }
  if (opts.computed) { initComputed(vm, opts.computed); }
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

function initProps (vm, propsOptions) {
  var propsData = vm.$options.propsData || {};
  var props = vm._props = {};
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  var keys = vm.$options._propKeys = [];
  var isRoot = !vm.$parent;
  // root instance props should be converted
  observerState.shouldConvert = isRoot;
  var loop = function ( key ) {
    keys.push(key);
    var value = validateProp(key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    {
      var hyphenatedKey = hyphenate(key);
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
          vm
        );
      }
      defineReactive(props, key, value, function () {
        if (vm.$parent && !isUpdatingChildComponent) {
          warn(
            "Avoid mutating a prop directly since the value will be " +
            "overwritten whenever the parent component re-renders. " +
            "Instead, use a data or computed property based on the prop's " +
            "value. Prop being mutated: \"" + key + "\"",
            vm
          );
        }
      });
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, "_props", key);
    }
  };

  for (var key in propsOptions) { loop( key ); }
  observerState.shouldConvert = true;
}

function initData (vm) {
  var data = vm.$options.data;
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};
  if (!isPlainObject(data)) {
    data = {};
    "development" !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  // proxy data on instance
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;
  while (i--) {
    var key = keys[i];
    {
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      "development" !== 'production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {
      proxy(vm, "_data", key);
    }
  }
  // observe data
  observe(data, true /* asRootData */);
}

function getData (data, vm) {
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, "data()");
    return {}
  }
}

var computedWatcherOptions = { lazy: true };

function initComputed (vm, computed) {
  // $flow-disable-line
  var watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  var isSSR = isServerRendering();

  for (var key in computed) {
    var userDef = computed[key];
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if ("development" !== 'production' && getter == null) {
      warn(
        ("Getter is missing for computed property \"" + key + "\"."),
        vm
      );
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else {
      if (key in vm.$data) {
        warn(("The computed property \"" + key + "\" is already defined in data."), vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
      }
    }
  }
}

function defineComputed (
  target,
  key,
  userDef
) {
  var shouldCache = !isServerRendering();
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : userDef;
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : userDef.get
      : noop;
    sharedPropertyDefinition.set = userDef.set
      ? userDef.set
      : noop;
  }
  if ("development" !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        ("Computed property \"" + key + "\" was assigned to but it has no setter."),
        this
      );
    };
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function createComputedGetter (key) {
  return function computedGetter () {
    var watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value
    }
  }
}

function initMethods (vm, methods) {
  var props = vm.$options.props;
  for (var key in methods) {
    {
      if (methods[key] == null) {
        warn(
          "Method \"" + key + "\" has an undefined value in the component definition. " +
          "Did you reference the function correctly?",
          vm
        );
      }
      if (props && hasOwn(props, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a prop."),
          vm
        );
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
          "Avoid defining component methods that start with _ or $."
        );
      }
    }
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm);
  }
}

function initWatch (vm, watch) {
  for (var key in watch) {
    var handler = watch[key];
    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher (
  vm,
  keyOrFn,
  handler,
  options
) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(keyOrFn, handler, options)
}

function stateMixin (Vue) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  var dataDef = {};
  dataDef.get = function () { return this._data };
  var propsDef = {};
  propsDef.get = function () { return this._props };
  {
    dataDef.set = function (newData) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      );
    };
    propsDef.set = function () {
      warn("$props is readonly.", this);
    };
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef);
  Object.defineProperty(Vue.prototype, '$props', propsDef);

  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;

  Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    var vm = this;
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {};
    options.user = true;
    var watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) {
      cb.call(vm, watcher.value);
    }
    return function unwatchFn () {
      watcher.teardown();
    }
  };
}

/*  */

function initProvide (vm) {
  var provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide;
  }
}

function initInjections (vm) {
  var result = resolveInject(vm.$options.inject, vm);
  if (result) {
    observerState.shouldConvert = false;
    Object.keys(result).forEach(function (key) {
      /* istanbul ignore else */
      {
        defineReactive(vm, key, result[key], function () {
          warn(
            "Avoid mutating an injected value directly since the changes will be " +
            "overwritten whenever the provided component re-renders. " +
            "injection being mutated: \"" + key + "\"",
            vm
          );
        });
      }
    });
    observerState.shouldConvert = true;
  }
}

function resolveInject (inject, vm) {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    var result = Object.create(null);
    var keys = hasSymbol
      ? Reflect.ownKeys(inject).filter(function (key) {
        /* istanbul ignore next */
        return Object.getOwnPropertyDescriptor(inject, key).enumerable
      })
      : Object.keys(inject);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var provideKey = inject[key].from;
      var source = vm;
      while (source) {
        if (source._provided && provideKey in source._provided) {
          result[key] = source._provided[provideKey];
          break
        }
        source = source.$parent;
      }
      if (!source) {
        if ('default' in inject[key]) {
          var provideDefault = inject[key].default;
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault;
        } else {
          warn(("Injection \"" + key + "\" not found"), vm);
        }
      }
    }
    return result
  }
}

/*  */

/**
 * Runtime helper for rendering v-for lists.
 */
function renderList (
  val,
  render
) {
  var ret, i, l, keys, key;
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length);
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i);
    }
  } else if (typeof val === 'number') {
    ret = new Array(val);
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i);
    }
  } else if (isObject(val)) {
    keys = Object.keys(val);
    ret = new Array(keys.length);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      ret[i] = render(val[key], key, i);
    }
  }
  if (isDef(ret)) {
    (ret)._isVList = true;
  }
  return ret
}

/*  */

/**
 * Runtime helper for rendering <slot>
 */
function renderSlot (
  name,
  fallback,
  props,
  bindObject
) {
  var scopedSlotFn = this.$scopedSlots[name];
  var nodes;
  if (scopedSlotFn) { // scoped slot
    props = props || {};
    if (bindObject) {
      if ("development" !== 'production' && !isObject(bindObject)) {
        warn(
          'slot v-bind without argument expects an Object',
          this
        );
      }
      props = extend(extend({}, bindObject), props);
    }
    nodes = scopedSlotFn(props) || fallback;
  } else {
    var slotNodes = this.$slots[name];
    // warn duplicate slot usage
    if (slotNodes) {
      if ("development" !== 'production' && slotNodes._rendered) {
        warn(
          "Duplicate presence of slot \"" + name + "\" found in the same render tree " +
          "- this will likely cause render errors.",
          this
        );
      }
      slotNodes._rendered = true;
    }
    nodes = slotNodes || fallback;
  }

  var target = props && props.slot;
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}

/*  */

/**
 * Runtime helper for resolving filters
 */
function resolveFilter (id) {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}

/*  */

/**
 * Runtime helper for checking keyCodes from config.
 * exposed as Vue.prototype._k
 * passing in eventKeyName as last argument separately for backwards compat
 */
function checkKeyCodes (
  eventKeyCode,
  key,
  builtInAlias,
  eventKeyName
) {
  var keyCodes = config.keyCodes[key] || builtInAlias;
  if (keyCodes) {
    if (Array.isArray(keyCodes)) {
      return keyCodes.indexOf(eventKeyCode) === -1
    } else {
      return keyCodes !== eventKeyCode
    }
  } else if (eventKeyName) {
    return hyphenate(eventKeyName) !== key
  }
}

/*  */

/**
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
function bindObjectProps (
  data,
  tag,
  value,
  asProp,
  isSync
) {
  if (value) {
    if (!isObject(value)) {
      "development" !== 'production' && warn(
        'v-bind without argument expects an Object or Array value',
        this
      );
    } else {
      if (Array.isArray(value)) {
        value = toObject(value);
      }
      var hash;
      var loop = function ( key ) {
        if (
          key === 'class' ||
          key === 'style' ||
          isReservedAttribute(key)
        ) {
          hash = data;
        } else {
          var type = data.attrs && data.attrs.type;
          hash = asProp || config.mustUseProp(tag, type, key)
            ? data.domProps || (data.domProps = {})
            : data.attrs || (data.attrs = {});
        }
        if (!(key in hash)) {
          hash[key] = value[key];

          if (isSync) {
            var on = data.on || (data.on = {});
            on[("update:" + key)] = function ($event) {
              value[key] = $event;
            };
          }
        }
      };

      for (var key in value) { loop( key ); }
    }
  }
  return data
}

/*  */

/**
 * Runtime helper for rendering static trees.
 */
function renderStatic (
  index,
  isInFor
) {
  var cached = this._staticTrees || (this._staticTrees = []);
  var tree = cached[index];
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree by doing a shallow clone.
  if (tree && !isInFor) {
    return Array.isArray(tree)
      ? cloneVNodes(tree)
      : cloneVNode(tree)
  }
  // otherwise, render a fresh tree.
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this // for render fns generated for functional component templates
  );
  markStatic(tree, ("__static__" + index), false);
  return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 */
function markOnce (
  tree,
  index,
  key
) {
  markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
  return tree
}

function markStatic (
  tree,
  key,
  isOnce
) {
  if (Array.isArray(tree)) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], (key + "_" + i), isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}

function markStaticNode (node, key, isOnce) {
  node.isStatic = true;
  node.key = key;
  node.isOnce = isOnce;
}

/*  */

function bindObjectListeners (data, value) {
  if (value) {
    if (!isPlainObject(value)) {
      "development" !== 'production' && warn(
        'v-on without argument expects an Object value',
        this
      );
    } else {
      var on = data.on = data.on ? extend({}, data.on) : {};
      for (var key in value) {
        var existing = on[key];
        var ours = value[key];
        on[key] = existing ? [].concat(existing, ours) : ours;
      }
    }
  }
  return data
}

/*  */

/**
 * This runtime helper creates an inline computed property for component
 * props that contain object or array literals. The caching ensures the same
 * object/array is returned unless the value has indeed changed, thus avoiding
 * the child component to always re-render when comparing props values.
 *
 * Installed to the instance as _a, requires special handling in parser that
 * transforms the following
 *   <foo :bar="{ a: 1 }"/>
 * to:
 *   <foo :bar="_a(0, function(){return { a: 1 }})"
 */
function createInlineComputed (id, getter) {
  var vm = this;
  var watchers = vm._inlineComputed || (vm._inlineComputed = {});
  var cached$$1 = watchers[id];
  if (cached$$1) {
    return cached$$1.value
  } else {
    watchers[id] = new Watcher(vm, getter, noop, { sync: true });
    return watchers[id].value
  }
}

/*  */

function installRenderHelpers (target) {
  target._o = markOnce;
  target._n = toNumber;
  target._s = toString;
  target._l = renderList;
  target._t = renderSlot;
  target._q = looseEqual;
  target._i = looseIndexOf;
  target._m = renderStatic;
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  target._v = createTextVNode;
  target._e = createEmptyVNode;
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
  target._a = createInlineComputed;
}

/*  */

function FunctionalRenderContext (
  data,
  props,
  children,
  parent,
  Ctor
) {
  var options = Ctor.options;
  this.data = data;
  this.props = props;
  this.children = children;
  this.parent = parent;
  this.listeners = data.on || emptyObject;
  this.injections = resolveInject(options.inject, parent);
  this.slots = function () { return resolveSlots(children, parent); };

  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  var contextVm = Object.create(parent);
  var isCompiled = isTrue(options._compiled);
  var needNormalization = !isCompiled;

  // support for compiled functional template
  if (isCompiled) {
    // exposing $options for renderStatic()
    this.$options = options;
    // pre-resolve slots for renderSlot()
    this.$slots = this.slots();
    this.$scopedSlots = data.scopedSlots || emptyObject;
  }

  if (options._scopeId) {
    this._c = function (a, b, c, d) {
      var vnode = createElement(contextVm, a, b, c, d, needNormalization);
      if (vnode) {
        vnode.fnScopeId = options._scopeId;
        vnode.fnContext = parent;
      }
      return vnode
    };
  } else {
    this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
  }
}

installRenderHelpers(FunctionalRenderContext.prototype);

function createFunctionalComponent (
  Ctor,
  propsData,
  data,
  contextVm,
  children
) {
  var options = Ctor.options;
  var props = {};
  var propOptions = options.props;
  if (isDef(propOptions)) {
    for (var key in propOptions) {
      props[key] = validateProp(key, propOptions, propsData || emptyObject);
    }
  } else {
    if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
    if (isDef(data.props)) { mergeProps(props, data.props); }
  }

  var renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  );

  var vnode = options.render.call(null, renderContext._c, renderContext);

  if (vnode instanceof VNode) {
    vnode.fnContext = contextVm;
    vnode.fnOptions = options;
    if (data.slot) {
      (vnode.data || (vnode.data = {})).slot = data.slot;
    }
  }

  return vnode
}

function mergeProps (to, from) {
  for (var key in from) {
    to[camelize(key)] = from[key];
  }
}

/*  */


var RECYCLE_LIST_MARKER = '@inRecycleList';

// Register the component hook to weex native render engine.
// The hook will be triggered by native, not javascript.
function registerComponentHook (
  componentId,
  type, // hook type, could be "lifecycle" or "instance"
  hook, // hook name
  fn
) {
  if (!document || !document.taskCenter) {
    warn("Can't find available \"document\" or \"taskCenter\".");
    return
  }
  if (typeof document.taskCenter.registerHook === 'function') {
    return document.taskCenter.registerHook(componentId, type, hook, fn)
  }
  warn(("Failed to register component hook \"" + type + "@" + hook + "#" + componentId + "\"."));
}

// Updates the state of the component to weex native render engine.
function updateComponentData (
  componentId,
  newData,
  callback
) {
  if (!document || !document.taskCenter) {
    warn("Can't find available \"document\" or \"taskCenter\".");
    return
  }
  if (typeof document.taskCenter.updateData === 'function') {
    return document.taskCenter.updateData(componentId, newData, callback)
  }
  warn(("Failed to update component data (" + componentId + ")."));
}

/*  */

// https://github.com/Hanks10100/weex-native-directive/tree/master/component

var uid$3 = 0;

// override Vue.prototype._init
function initVirtualComponent (options) {
  if ( options === void 0 ) { options = {}; }

  var vm = this;
  var componentId = options.componentId;

  // virtual component uid
  vm._uid = "virtual-component-" + (uid$3++);

  // a flag to avoid this being observed
  vm._isVue = true;
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options);
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    );
  }

  /* istanbul ignore else */
  {
    initProxy(vm);
  }

  vm._self = vm;
  initLifecycle(vm);
  initEvents(vm);
  initRender(vm);
  callHook(vm, 'beforeCreate');
  initInjections(vm); // resolve injections before data/props
  initState(vm);
  initProvide(vm); // resolve provide after data/props
  callHook(vm, 'created');

  // send initial data to native
  var data = vm.$options.data;
  var params = typeof data === 'function'
    ? getData(data, vm)
    : data || {};
  if (isPlainObject(params)) {
    updateComponentData(componentId, params);
  }

  registerComponentHook(componentId, 'lifecycle', 'attach', function () {
    callHook(vm, 'beforeMount');

    var updateComponent = function () {
      vm._update(vm._vnode, false);
    };
    new Watcher(vm, updateComponent, noop, null, true);

    vm._isMounted = true;
    callHook(vm, 'mounted');
  });

  registerComponentHook(componentId, 'lifecycle', 'detach', function () {
    vm.$destroy();
  });
}

// override Vue.prototype._update
function updateVirtualComponent (vnode) {
  var vm = this;
  var componentId = vm.$options.componentId;
  if (vm._isMounted) {
    callHook(vm, 'beforeUpdate');
  }
  vm._vnode = vnode;
  if (vm._isMounted && componentId) {
    // TODO: data should be filtered and without bindings
    var data = Object.assign({}, vm._data);
    updateComponentData(componentId, data, function () {
      callHook(vm, 'updated');
    });
  }
}

// listening on native callback
function resolveVirtualComponent (vnode) {
  var BaseCtor = vnode.componentOptions.Ctor;
  var VirtualComponent = BaseCtor.extend({});
  var cid = VirtualComponent.cid;
  VirtualComponent.prototype._init = initVirtualComponent;
  VirtualComponent.prototype._update = updateVirtualComponent;

  vnode.componentOptions.Ctor = BaseCtor.extend({
    beforeCreate: function beforeCreate () {
      // const vm: Component = this

      // TODO: listen on all events and dispatch them to the
      // corresponding virtual components according to the componentId.
      // vm._virtualComponents = {}
      var createVirtualComponent = function (componentId, propsData) {
        // create virtual component
        // const subVm =
        new VirtualComponent({
          componentId: componentId,
          propsData: propsData
        });
        // if (vm._virtualComponents) {
        //   vm._virtualComponents[componentId] = subVm
        // }
      };

      registerComponentHook(cid, 'lifecycle', 'create', createVirtualComponent);
    },
    beforeDestroy: function beforeDestroy () {
      delete this._virtualComponents;
    }
  });
}

/*  */

function isRecyclableComponent (vnode) {
  return vnode.data.attrs
    ? (RECYCLE_LIST_MARKER in vnode.data.attrs)
    : false
}

function renderRecyclableComponentTemplate (vnode) {
  // $flow-disable-line
  delete vnode.data.attrs[RECYCLE_LIST_MARKER];
  resolveVirtualComponent(vnode);
  var vm = createComponentInstanceForVnode(vnode);
  var render = (vm.$options)['@render'];
  if (render) {
    try {
      return render.call(vm)
    } catch (err) {
      handleError(err, vm, "@render");
    }
  } else {
    warn(
      "@render function not defined on component used in <recycle-list>. " +
      "Make sure to declare `recyclable=\"true\"` on the component's template.",
      vm
    );
  }
}

/*  */

// hooks to be invoked on component VNodes during patch
var componentVNodeHooks = {
  init: function init (
    vnode,
    hydrating,
    parentElm,
    refElm
  ) {
    if (!vnode.componentInstance || vnode.componentInstance._isDestroyed) {
      var child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance,
        parentElm,
        refElm
      );
      child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    } else if (vnode.data.keepAlive) {
      // kept-alive components, treat as a patch
      var mountedNode = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    }
  },

  prepatch: function prepatch (oldVnode, vnode) {
    var options = vnode.componentOptions;
    var child = vnode.componentInstance = oldVnode.componentInstance;
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    );
  },

  insert: function insert (vnode) {
    var context = vnode.context;
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */);
      }
    }
  },

  destroy: function destroy (vnode) {
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy();
      } else {
        deactivateChildComponent(componentInstance, true /* direct */);
      }
    }
  }
};

var hooksToMerge = Object.keys(componentVNodeHooks);

function createComponent (
  Ctor,
  data,
  context,
  children,
  tag
) {
  if (isUndef(Ctor)) {
    return
  }

  var baseCtor = context.$options._base;

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor);
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    {
      warn(("Invalid Component definition: " + (String(Ctor))), context);
    }
    return
  }

  // async component
  var asyncFactory;
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor;
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context);
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {};

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor);

  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // extract props
  var propsData = extractPropsFromVNodeData(data, Ctor, tag);

  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  var listeners = data.on;
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn;

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    var slot = data.slot;
    data = {};
    if (slot) {
      data.slot = slot;
    }
  }

  // merge component management hooks onto the placeholder node
  mergeHooks(data);

  // return a placeholder vnode
  var name = Ctor.options.name || tag;
  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
    asyncFactory
  );

  // Weex specific: invoke recycle-list optimized @render function for
  // extracting cell-slot template.
  // https://github.com/Hanks10100/weex-native-directive/tree/master/component
  /* istanbul ignore if */
  if (true && isRecyclableComponent(vnode)) {
    return renderRecyclableComponentTemplate(vnode)
  }

  return vnode
}

function createComponentInstanceForVnode (
  vnode, // we know it's MountedComponentVNode but flow doesn't
  parent, // activeInstance in lifecycle state
  parentElm,
  refElm
) {
  var options = {
    _isComponent: true,
    parent: parent,
    _parentVnode: vnode,
    _parentElm: parentElm || null,
    _refElm: refElm || null
  };
  // check inline-template render functions
  var inlineTemplate = vnode.data.inlineTemplate;
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render;
    options.staticRenderFns = inlineTemplate.staticRenderFns;
  }
  return new vnode.componentOptions.Ctor(options)
}

function mergeHooks (data) {
  if (!data.hook) {
    data.hook = {};
  }
  for (var i = 0; i < hooksToMerge.length; i++) {
    var key = hooksToMerge[i];
    var fromParent = data.hook[key];
    var ours = componentVNodeHooks[key];
    data.hook[key] = fromParent ? mergeHook$1(ours, fromParent) : ours;
  }
}

function mergeHook$1 (one, two) {
  return function (a, b, c, d) {
    one(a, b, c, d);
    two(a, b, c, d);
  }
}

// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel (options, data) {
  var prop = (options.model && options.model.prop) || 'value';
  var event = (options.model && options.model.event) || 'input';(data.props || (data.props = {}))[prop] = data.model.value;
  var on = data.on || (data.on = {});
  if (isDef(on[event])) {
    on[event] = [data.model.callback].concat(on[event]);
  } else {
    on[event] = data.model.callback;
  }
}

/*  */

var SIMPLE_NORMALIZE = 1;
var ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
function createElement (
  context,
  tag,
  data,
  children,
  normalizationType,
  alwaysNormalize
) {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType)
}

function _createElement (
  context,
  tag,
  data,
  children,
  normalizationType
) {
  if (isDef(data) && isDef((data).__ob__)) {
    "development" !== 'production' && warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  if ("development" !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    if (!true || !('@binding' in data.key)) {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      );
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);
  }
  var vnode, ns;
  if (typeof tag === 'string') {
    var Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );
    } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      );
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children);
  }
  if (isDef(vnode)) {
    if (ns) { applyNS(vnode, ns); }
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS (vnode, ns, force) {
  vnode.ns = ns;
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined;
    force = true;
  }
  if (isDef(vnode.children)) {
    for (var i = 0, l = vnode.children.length; i < l; i++) {
      var child = vnode.children[i];
      if (isDef(child.tag) && (isUndef(child.ns) || isTrue(force))) {
        applyNS(child, ns, force);
      }
    }
  }
}

/*  */

function initRender (vm) {
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null; // v-once cached trees
  var options = vm.$options;
  var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
  var renderContext = parentVnode && parentVnode.context;
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  vm.$scopedSlots = emptyObject;
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  var parentData = parentVnode && parentVnode.data;

  /* istanbul ignore else */
  {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
      !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
    }, true);
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, function () {
      !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
    }, true);
  }
}

function renderMixin (Vue) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype);

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };

  Vue.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;
    var _parentVnode = ref._parentVnode;

    if (vm._isMounted) {
      // if the parent didn't update, the slot nodes will be the ones from
      // last render. They need to be cloned to ensure "freshness" for this render.
      for (var key in vm.$slots) {
        var slot = vm.$slots[key];
        // _rendered is a flag added by renderSlot, but may not be present
        // if the slot is passed from manually written render functions
        if (slot._rendered || (slot[0] && slot[0].elm)) {
          vm.$slots[key] = cloneVNodes(slot, true /* deep */);
        }
      }
    }

    vm.$scopedSlots = (_parentVnode && _parentVnode.data.scopedSlots) || emptyObject;

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode;
    // render self
    var vnode;
    try {
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      handleError(e, vm, "render");
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      {
        if (vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
          } catch (e) {
            handleError(e, vm, "renderError");
            vnode = vm._vnode;
          }
        } else {
          vnode = vm._vnode;
        }
      }
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if ("development" !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        );
      }
      vnode = createEmptyVNode();
    }
    // set parent
    vnode.parent = _parentVnode;
    return vnode
  };
}

/*  */

var uid = 0;

function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    var vm = this;
    // a uid
    vm._uid = uid++;

    var startTag, endTag;
    /* istanbul ignore if */
    if ("development" !== 'production' && config.performance && mark) {
      startTag = "vue-perf-start:" + (vm._uid);
      endTag = "vue-perf-end:" + (vm._uid);
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    {
      initProxy(vm);
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    initInjections(vm); // resolve injections before data/props
    initState(vm);
    initProvide(vm); // resolve provide after data/props
    callHook(vm, 'created');

    /* istanbul ignore if */
    if ("development" !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

function initInternalComponent (vm, options) {
  var opts = vm.$options = Object.create(vm.constructor.options);
  // doing this because it's faster than dynamic enumeration.
  var parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;
  opts._parentElm = options._parentElm;
  opts._refElm = options._refElm;

  var vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

function resolveConstructorOptions (Ctor) {
  var options = Ctor.options;
  if (Ctor.super) {
    var superOptions = resolveConstructorOptions(Ctor.super);
    var cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      var modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor) {
  var modified;
  var latest = Ctor.options;
  var extended = Ctor.extendOptions;
  var sealed = Ctor.sealedOptions;
  for (var key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) { modified = {}; }
      modified[key] = dedupe(latest[key], extended[key], sealed[key]);
    }
  }
  return modified
}

function dedupe (latest, extended, sealed) {
  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    var res = [];
    sealed = Array.isArray(sealed) ? sealed : [sealed];
    extended = Array.isArray(extended) ? extended : [extended];
    for (var i = 0; i < latest.length; i++) {
      // push original options and not sealed options to exclude duplicated options
      if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i]);
      }
    }
    return res
  } else {
    return latest
  }
}

function Vue$2 (options) {
  if ("development" !== 'production' &&
    !(this instanceof Vue$2)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}

initMixin(Vue$2);
stateMixin(Vue$2);
eventsMixin(Vue$2);
lifecycleMixin(Vue$2);
renderMixin(Vue$2);

/*  */

function initUse (Vue) {
  Vue.use = function (plugin) {
    var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    var args = toArray(arguments, 1);
    args.unshift(this);
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args);
    }
    installedPlugins.push(plugin);
    return this
  };
}

/*  */

function initMixin$1 (Vue) {
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
    return this
  };
}

/*  */

function initExtend (Vue) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  var cid = 1;

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {};
    var Super = this;
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    var name = extendOptions.name || Super.options.name;
    if ("development" !== 'production' && name) {
      validateComponentName(name);
    }

    var Sub = function VueComponent (options) {
      this._init(options);
    };
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    );
    Sub['super'] = Super;

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps$1(Sub);
    }
    if (Sub.options.computed) {
      initComputed$1(Sub);
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub
  };
}

function initProps$1 (Comp) {
  var props = Comp.options.props;
  for (var key in props) {
    proxy(Comp.prototype, "_props", key);
  }
}

function initComputed$1 (Comp) {
  var computed = Comp.options.computed;
  for (var key in computed) {
    defineComputed(Comp.prototype, key, computed[key]);
  }
}

/*  */

function initAssetRegisters (Vue) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(function (type) {
    Vue[type] = function (
      id,
      definition
    ) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if ("development" !== 'production' && type === 'component') {
          validateComponentName(id);
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id;
          definition = this.options._base.extend(definition);
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition };
        }
        this.options[type + 's'][id] = definition;
        return definition
      }
    };
  });
}

/*  */

function getComponentName (opts) {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function pruneCache (keepAliveInstance, filter) {
  var cache = keepAliveInstance.cache;
  var keys = keepAliveInstance.keys;
  var _vnode = keepAliveInstance._vnode;
  for (var key in cache) {
    var cachedNode = cache[key];
    if (cachedNode) {
      var name = getComponentName(cachedNode.componentOptions);
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode);
      }
    }
  }
}

function pruneCacheEntry (
  cache,
  key,
  keys,
  current
) {
  var cached$$1 = cache[key];
  if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
    cached$$1.componentInstance.$destroy();
  }
  cache[key] = null;
  remove(keys, key);
}

var patternTypes = [String, RegExp, Array];

var KeepAlive = {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created: function created () {
    this.cache = Object.create(null);
    this.keys = [];
  },

  destroyed: function destroyed () {
    var this$1 = this;

    for (var key in this$1.cache) {
      pruneCacheEntry(this$1.cache, key, this$1.keys);
    }
  },

  watch: {
    include: function include (val) {
      pruneCache(this, function (name) { return matches(val, name); });
    },
    exclude: function exclude (val) {
      pruneCache(this, function (name) { return !matches(val, name); });
    }
  },

  render: function render () {
    var slot = this.$slots.default;
    var vnode = getFirstComponentChild(slot);
    var componentOptions = vnode && vnode.componentOptions;
    if (componentOptions) {
      // check pattern
      var name = getComponentName(componentOptions);
      var ref = this;
      var include = ref.include;
      var exclude = ref.exclude;
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      var ref$1 = this;
      var cache = ref$1.cache;
      var keys = ref$1.keys;
      var key = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
        : vnode.key;
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance;
        // make current key freshest
        remove(keys, key);
        keys.push(key);
      } else {
        cache[key] = vnode;
        keys.push(key);
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode);
        }
      }

      vnode.data.keepAlive = true;
    }
    return vnode || (slot && slot[0])
  }
};

var builtInComponents = {
  KeepAlive: KeepAlive
};

/*  */

function initGlobalAPI (Vue) {
  // config
  var configDef = {};
  configDef.get = function () { return config; };
  {
    configDef.set = function () {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      );
    };
  }
  Object.defineProperty(Vue, 'config', configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn: warn,
    extend: extend,
    mergeOptions: mergeOptions,
    defineReactive: defineReactive
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  Vue.options = Object.create(null);
  ASSET_TYPES.forEach(function (type) {
    Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;

  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin$1(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}

initGlobalAPI(Vue$2);

Object.defineProperty(Vue$2.prototype, '$isServer', {
  get: isServerRendering
});

Object.defineProperty(Vue$2.prototype, '$ssrContext', {
  get: function get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
});

Vue$2.version = '2.5.11';

var latestNodeId = 1;

function TextNode (text) {
  this.instanceId = '';
  this.nodeId = latestNodeId++;
  this.parentNode = null;
  this.nodeType = 3;
  this.text = text;
}

/* globals document */
// document is injected by weex factory wrapper

var namespaceMap = {};

function createElement$1 (tagName) {
  return document.createElement(tagName)
}

function createElementNS (namespace, tagName) {
  return document.createElement(namespace + ':' + tagName)
}

function createTextNode (text) {
  return new TextNode(text)
}

function createComment (text) {
  return document.createComment(text)
}

function insertBefore (node, target, before) {
  if (target.nodeType === 3) {
    if (node.type === 'text') {
      node.setAttr('value', target.text);
      target.parentNode = node;
    } else {
      var text = createElement$1('text');
      text.setAttr('value', target.text);
      node.insertBefore(text, before);
    }
    return
  }
  node.insertBefore(target, before);
}

function removeChild (node, child) {
  if (child.nodeType === 3) {
    node.setAttr('value', '');
    return
  }
  node.removeChild(child);
}

function appendChild (node, child) {
  if (child.nodeType === 3) {
    if (node.type === 'text') {
      node.setAttr('value', child.text);
      child.parentNode = node;
    } else {
      var text = createElement$1('text');
      text.setAttr('value', child.text);
      node.appendChild(text);
    }
    return
  }

  node.appendChild(child);
}

function parentNode (node) {
  return node.parentNode
}

function nextSibling (node) {
  return node.nextSibling
}

function tagName (node) {
  return node.type
}

function setTextContent (node, text) {
  node.parentNode.setAttr('value', text);
}

function setAttribute (node, key, val) {
  node.setAttr(key, val);
}


var nodeOps = Object.freeze({
	namespaceMap: namespaceMap,
	createElement: createElement$1,
	createElementNS: createElementNS,
	createTextNode: createTextNode,
	createComment: createComment,
	insertBefore: insertBefore,
	removeChild: removeChild,
	appendChild: appendChild,
	parentNode: parentNode,
	nextSibling: nextSibling,
	tagName: tagName,
	setTextContent: setTextContent,
	setAttribute: setAttribute
});

/*  */

var ref = {
  create: function create (_, vnode) {
    registerRef(vnode);
  },
  update: function update (oldVnode, vnode) {
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true);
      registerRef(vnode);
    }
  },
  destroy: function destroy (vnode) {
    registerRef(vnode, true);
  }
};

function registerRef (vnode, isRemoval) {
  var key = vnode.data.ref;
  if (!key) { return }

  var vm = vnode.context;
  var ref = vnode.componentInstance || vnode.elm;
  var refs = vm.$refs;
  if (isRemoval) {
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  } else {
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref];
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref);
      }
    } else {
      refs[key] = ref;
    }
  }
}

/*  */



var isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template,blockquote,iframe,tfoot'
);

// this map is intentionally selective, only covering SVG elements that may
// contain child elements.
var isSVG = makeMap(
  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
  'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
  true
);









var isTextInputType = makeMap('text,number,password,search,email,tel,url');

/**
 * Virtual DOM patching algorithm based on Snabbdom by
 * Simon Friis Vindum (@paldepind)
 * Licensed under the MIT License
 * https://github.com/paldepind/snabbdom/blob/master/LICENSE
 *
 * modified by Evan You (@yyx990803)
 *
 * Not type-checking this because this file is perf-critical and the cost
 * of making flow understand it is not worth it.
 */

var emptyNode = new VNode('', {}, []);

var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}

function sameInputType (a, b) {
  if (a.tag !== 'input') { return true }
  var i;
  var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
  var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
  return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
}

function createKeyToOldIdx (children, beginIdx, endIdx) {
  var i, key;
  var map = {};
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) { map[key] = i; }
  }
  return map
}

function createPatchFunction (backend) {
  var i, j;
  var cbs = {};

  var modules = backend.modules;
  var nodeOps = backend.nodeOps;

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]]);
      }
    }
  }

  function emptyNodeAt (elm) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  function createRmCb (childElm, listeners) {
    function remove () {
      if (--remove.listeners === 0) {
        removeNode(childElm);
      }
    }
    remove.listeners = listeners;
    return remove
  }

  function removeNode (el) {
    var parent = nodeOps.parentNode(el);
    // element may have already been removed due to v-html / v-text
    if (isDef(parent)) {
      nodeOps.removeChild(parent, el);
    }
  }

  function isUnknownElement$$1 (vnode, inVPre) {
    return (
      !inVPre &&
      !vnode.ns &&
      !(
        config.ignoredElements.length &&
        config.ignoredElements.some(function (ignore) {
          return isRegExp(ignore)
            ? ignore.test(vnode.tag)
            : ignore === vnode.tag
        })
      ) &&
      config.isUnknownElement(vnode.tag)
    )
  }

  var creatingElmInVPre = 0;
  function createElm (vnode, insertedVnodeQueue, parentElm, refElm, nested) {
    vnode.isRootInsert = !nested; // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    var data = vnode.data;
    var children = vnode.children;
    var tag = vnode.tag;
    if (isDef(tag)) {
      {
        if (data && data.pre) {
          creatingElmInVPre++;
        }
        if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
          warn(
            'Unknown custom element: <' + tag + '> - did you ' +
            'register the component correctly? For recursive components, ' +
            'make sure to provide the "name" option.',
            vnode.context
          );
        }
      }
      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode);
      setScope(vnode);

      /* istanbul ignore if */
      {
        // in Weex, the default insertion order is parent-first.
        // List items can be optimized to use children-first insertion
        // with append="tree".
        var appendAsTree = isDef(data) && isTrue(data.appendAsTree);
        if (!appendAsTree) {
          if (isDef(data)) {
            invokeCreateHooks(vnode, insertedVnodeQueue);
          }
          insert(parentElm, vnode.elm, refElm);
        }
        createChildren(vnode, children, insertedVnodeQueue);
        if (appendAsTree) {
          if (isDef(data)) {
            invokeCreateHooks(vnode, insertedVnodeQueue);
          }
          insert(parentElm, vnode.elm, refElm);
        }
      }

      if ("development" !== 'production' && data && data.pre) {
        creatingElmInVPre--;
      }
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    }
  }

  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i = vnode.data;
    if (isDef(i)) {
      var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */, parentElm, refElm);
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue);
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
        }
        return true
      }
    }
  }

  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
      vnode.data.pendingInsert = null;
    }
    vnode.elm = vnode.componentInstance.$el;
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
      setScope(vnode);
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode);
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode);
    }
  }

  function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i;
    // hack for #4339: a reactivated component with inner transition
    // does not trigger because the inner node's created hooks are not called
    // again. It's not ideal to involve module-specific logic in here but
    // there doesn't seem to be a better way to do it.
    var innerNode = vnode;
    while (innerNode.componentInstance) {
      innerNode = innerNode.componentInstance._vnode;
      if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
        for (i = 0; i < cbs.activate.length; ++i) {
          cbs.activate[i](emptyNode, innerNode);
        }
        insertedVnodeQueue.push(innerNode);
        break
      }
    }
    // unlike a newly created component,
    // a reactivated keep-alive component doesn't insert itself
    insert(parentElm, vnode.elm, refElm);
  }

  function insert (parent, elm, ref$$1) {
    if (isDef(parent)) {
      if (isDef(ref$$1)) {
        if (ref$$1.parentNode === parent) {
          nodeOps.insertBefore(parent, elm, ref$$1);
        }
      } else {
        nodeOps.appendChild(parent, elm);
      }
    }
  }

  function createChildren (vnode, children, insertedVnodeQueue) {
    if (Array.isArray(children)) {
      {
        checkDuplicateKeys(children);
      }
      for (var i = 0; i < children.length; ++i) {
        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true);
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(vnode.text));
    }
  }

  function isPatchable (vnode) {
    while (vnode.componentInstance) {
      vnode = vnode.componentInstance._vnode;
    }
    return isDef(vnode.tag)
  }

  function invokeCreateHooks (vnode, insertedVnodeQueue) {
    for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
      cbs.create[i$1](emptyNode, vnode);
    }
    i = vnode.data.hook; // Reuse variable
    if (isDef(i)) {
      if (isDef(i.create)) { i.create(emptyNode, vnode); }
      if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
    }
  }

  // set scope id attribute for scoped CSS.
  // this is implemented as a special case to avoid the overhead
  // of going through the normal attribute patching process.
  function setScope (vnode) {
    var i;
    if (isDef(i = vnode.fnScopeId)) {
      nodeOps.setAttribute(vnode.elm, i, '');
    } else {
      var ancestor = vnode;
      while (ancestor) {
        if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
          nodeOps.setAttribute(vnode.elm, i, '');
        }
        ancestor = ancestor.parent;
      }
    }
    // for slot content they should also get the scopeId from the host instance.
    if (isDef(i = activeInstance) &&
      i !== vnode.context &&
      i !== vnode.fnContext &&
      isDef(i = i.$options._scopeId)
    ) {
      nodeOps.setAttribute(vnode.elm, i, '');
    }
  }

  function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm);
    }
  }

  function invokeDestroyHook (vnode) {
    var i, j;
    var data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
      for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
    }
    if (isDef(i = vnode.children)) {
      for (j = 0; j < vnode.children.length; ++j) {
        invokeDestroyHook(vnode.children[j]);
      }
    }
  }

  function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.tag)) {
          removeAndInvokeRemoveHook(ch);
          invokeDestroyHook(ch);
        } else { // Text node
          removeNode(ch.elm);
        }
      }
    }
  }

  function removeAndInvokeRemoveHook (vnode, rm) {
    if (isDef(rm) || isDef(vnode.data)) {
      var i;
      var listeners = cbs.remove.length + 1;
      if (isDef(rm)) {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners;
      } else {
        // directly removing
        rm = createRmCb(vnode.elm, listeners);
      }
      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm);
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm);
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm);
      } else {
        rm();
      }
    } else {
      removeNode(vnode.elm);
    }
  }

  function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    var oldStartIdx = 0;
    var newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

    // removeOnly is a special flag used only by <transition-group>
    // to ensure removed elements stay in correct relative positions
    // during leaving transitions
    var canMove = !removeOnly;

    {
      checkDuplicateKeys(newCh);
    }

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
        idxInOld = isDef(newStartVnode.key)
          ? oldKeyToIdx[newStartVnode.key]
          : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
        if (isUndef(idxInOld)) { // New element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm);
        } else {
          vnodeToMove = oldCh[idxInOld];
          if (sameVnode(vnodeToMove, newStartVnode)) {
            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
            oldCh[idxInOld] = undefined;
            canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
          } else {
            // same key but different element. treat as new element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm);
          }
        }
        newStartVnode = newCh[++newStartIdx];
      }
    }
    if (oldStartIdx > oldEndIdx) {
      refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
      addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function checkDuplicateKeys (children) {
    var seenKeys = {};
    for (var i = 0; i < children.length; i++) {
      var vnode = children[i];
      var key = vnode.key;
      if (isDef(key)) {
        if (seenKeys[key]) {
          warn(
            ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
            vnode.context
          );
        } else {
          seenKeys[key] = true;
        }
      }
    }
  }

  function findIdxInOld (node, oldCh, start, end) {
    for (var i = start; i < end; i++) {
      var c = oldCh[i];
      if (isDef(c) && sameVnode(node, c)) { return i }
    }
  }

  function patchVnode (oldVnode, vnode, insertedVnodeQueue, removeOnly) {
    if (oldVnode === vnode) {
      return
    }

    var elm = vnode.elm = oldVnode.elm;

    if (isTrue(oldVnode.isAsyncPlaceholder)) {
      if (isDef(vnode.asyncFactory.resolved)) {
        hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
      } else {
        vnode.isAsyncPlaceholder = true;
      }
      return
    }

    // reuse element for static trees.
    // note we only do this if the vnode is cloned -
    // if the new node is not cloned it means the render functions have been
    // reset by the hot-reload-api and we need to do a proper re-render.
    if (isTrue(vnode.isStatic) &&
      isTrue(oldVnode.isStatic) &&
      vnode.key === oldVnode.key &&
      (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ) {
      vnode.componentInstance = oldVnode.componentInstance;
      return
    }

    var i;
    var data = vnode.data;
    if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
      i(oldVnode, vnode);
    }

    var oldCh = oldVnode.children;
    var ch = vnode.children;
    if (isDef(data) && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
      if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) {
        nodeOps.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      nodeOps.setTextContent(elm, vnode.text);
    }
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
    }
  }

  function invokeInsertHook (vnode, queue, initial) {
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (isTrue(initial) && isDef(vnode.parent)) {
      vnode.parent.data.pendingInsert = queue;
    } else {
      for (var i = 0; i < queue.length; ++i) {
        queue[i].data.hook.insert(queue[i]);
      }
    }
  }

  var hydrationBailed = false;
  // list of modules that can skip create hook during hydration because they
  // are already rendered on the client or has no need for initialization
  // Note: style is excluded because it relies on initial clone for future
  // deep updates (#7063).
  var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

  // Note: this is a browser-only function so we can assume elms are DOM nodes.
  function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
    var i;
    var tag = vnode.tag;
    var data = vnode.data;
    var children = vnode.children;
    inVPre = inVPre || (data && data.pre);
    vnode.elm = elm;

    if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
      vnode.isAsyncPlaceholder = true;
      return true
    }
    // assert node match
    {
      if (!assertNodeMatch(elm, vnode, inVPre)) {
        return false
      }
    }
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
      if (isDef(i = vnode.componentInstance)) {
        // child component. it should have hydrated its own tree.
        initComponent(vnode, insertedVnodeQueue);
        return true
      }
    }
    if (isDef(tag)) {
      if (isDef(children)) {
        // empty element, allow client to pick up and populate children
        if (!elm.hasChildNodes()) {
          createChildren(vnode, children, insertedVnodeQueue);
        } else {
          // v-html and domProps: innerHTML
          if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
            if (i !== elm.innerHTML) {
              /* istanbul ignore if */
              if ("development" !== 'production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('server innerHTML: ', i);
                console.warn('client innerHTML: ', elm.innerHTML);
              }
              return false
            }
          } else {
            // iterate and compare children lists
            var childrenMatch = true;
            var childNode = elm.firstChild;
            for (var i$1 = 0; i$1 < children.length; i$1++) {
              if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                childrenMatch = false;
                break
              }
              childNode = childNode.nextSibling;
            }
            // if childNode is not null, it means the actual childNodes list is
            // longer than the virtual children list.
            if (!childrenMatch || childNode) {
              /* istanbul ignore if */
              if ("development" !== 'production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
              }
              return false
            }
          }
        }
      }
      if (isDef(data)) {
        var fullInvoke = false;
        for (var key in data) {
          if (!isRenderedModule(key)) {
            fullInvoke = true;
            invokeCreateHooks(vnode, insertedVnodeQueue);
            break
          }
        }
        if (!fullInvoke && data['class']) {
          // ensure collecting deps for deep class bindings for future updates
          traverse(data['class']);
        }
      }
    } else if (elm.data !== vnode.text) {
      elm.data = vnode.text;
    }
    return true
  }

  function assertNodeMatch (node, vnode, inVPre) {
    if (isDef(vnode.tag)) {
      return vnode.tag.indexOf('vue-component') === 0 || (
        !isUnknownElement$$1(vnode, inVPre) &&
        vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
      )
    } else {
      return node.nodeType === (vnode.isComment ? 8 : 3)
    }
  }

  return function patch (oldVnode, vnode, hydrating, removeOnly, parentElm, refElm) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
      return
    }

    var isInitialPatch = false;
    var insertedVnodeQueue = [];

    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true;
      createElm(vnode, insertedVnodeQueue, parentElm, refElm);
    } else {
      var isRealElement = isDef(oldVnode.nodeType);
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly);
      } else {
        if (isRealElement) {
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR);
            hydrating = true;
          }
          if (isTrue(hydrating)) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true);
              return oldVnode
            } else {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              );
            }
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode);
        }

        // replacing existing element
        var oldElm = oldVnode.elm;
        var parentElm$1 = nodeOps.parentNode(oldElm);

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm$1,
          nodeOps.nextSibling(oldElm)
        );

        // update parent placeholder node element, recursively
        if (isDef(vnode.parent)) {
          var ancestor = vnode.parent;
          var patchable = isPatchable(vnode);
          while (ancestor) {
            for (var i = 0; i < cbs.destroy.length; ++i) {
              cbs.destroy[i](ancestor);
            }
            ancestor.elm = vnode.elm;
            if (patchable) {
              for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                cbs.create[i$1](emptyNode, ancestor);
              }
              // #6513
              // invoke insert hooks that may have been merged by create hooks.
              // e.g. for directives that uses the "inserted" hook.
              var insert = ancestor.data.hook.insert;
              if (insert.merged) {
                // start at index 1 to avoid re-invoking component mounted hook
                for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                  insert.fns[i$2]();
                }
              }
            } else {
              registerRef(ancestor);
            }
            ancestor = ancestor.parent;
          }
        }

        // destroy old node
        if (isDef(parentElm$1)) {
          removeVnodes(parentElm$1, [oldVnode], 0, 0);
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode);
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
    return vnode.elm
  }
}

/*  */

var directives = {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives (vnode) {
    updateDirectives(vnode, emptyNode);
  }
};

function updateDirectives (oldVnode, vnode) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}

function _update (oldVnode, vnode) {
  var isCreate = oldVnode === emptyNode;
  var isDestroy = vnode === emptyNode;
  var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
  var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

  var dirsWithInsert = [];
  var dirsWithPostpatch = [];

  var key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // new directive, bind
      callHook$1(dir, 'bind', vnode, oldVnode);
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value;
      callHook$1(dir, 'update', vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) {
    var callInsert = function () {
      for (var i = 0; i < dirsWithInsert.length; i++) {
        callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
      }
    };
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', function () {
      for (var i = 0; i < dirsWithPostpatch.length; i++) {
        callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
      }
    });
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
      }
    }
  }
}

var emptyModifiers = Object.create(null);

function normalizeDirectives$1 (
  dirs,
  vm
) {
  var res = Object.create(null);
  if (!dirs) {
    // $flow-disable-line
    return res
  }
  var i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
  }
  // $flow-disable-line
  return res
}

function getRawDirName (dir) {
  return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
}

function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {
  var fn = dir.def && dir.def[hook];
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
    } catch (e) {
      handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
    }
  }
}

var baseModules = [
  ref,
  directives
];

/*  */

function updateAttrs (oldVnode, vnode) {
  if (!oldVnode.data.attrs && !vnode.data.attrs) {
    return
  }
  var key, cur, old;
  var elm = vnode.elm;
  var oldAttrs = oldVnode.data.attrs || {};
  var attrs = vnode.data.attrs || {};
  // clone observed objects, as the user probably wants to mutate it
  if (attrs.__ob__) {
    attrs = vnode.data.attrs = extend({}, attrs);
  }

  var supportBatchUpdate = typeof elm.setAttrs === 'function';
  var batchedAttrs = {};
  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      supportBatchUpdate
        ? (batchedAttrs[key] = cur)
        : elm.setAttr(key, cur);
    }
  }
  for (key in oldAttrs) {
    if (attrs[key] == null) {
      supportBatchUpdate
        ? (batchedAttrs[key] = undefined)
        : elm.setAttr(key);
    }
  }
  if (supportBatchUpdate) {
    elm.setAttrs(batchedAttrs);
  }
}

var attrs = {
  create: updateAttrs,
  update: updateAttrs
};

/*  */

function updateClass (oldVnode, vnode) {
  var el = vnode.elm;
  var ctx = vnode.context;

  var data = vnode.data;
  var oldData = oldVnode.data;
  if (!data.staticClass &&
    !data.class &&
    (!oldData || (!oldData.staticClass && !oldData.class))
  ) {
    return
  }

  var oldClassList = [];
  // unlike web, weex vnode staticClass is an Array
  var oldStaticClass = oldData.staticClass;
  if (oldStaticClass) {
    oldClassList.push.apply(oldClassList, oldStaticClass);
  }
  if (oldData.class) {
    oldClassList.push.apply(oldClassList, oldData.class);
  }

  var classList = [];
  // unlike web, weex vnode staticClass is an Array
  var staticClass = data.staticClass;
  if (staticClass) {
    classList.push.apply(classList, staticClass);
  }
  if (data.class) {
    classList.push.apply(classList, data.class);
  }

  var style = getStyle(oldClassList, classList, ctx);
  if (typeof el.setStyles === 'function') {
    el.setStyles(style);
  } else {
    for (var key in style) {
      el.setStyle(key, style[key]);
    }
  }
}

function getStyle (oldClassList, classList, ctx) {
  // style is a weex-only injected object
  // compiled from <style> tags in weex files
  var stylesheet = ctx.$options.style || {};
  var result = {};
  classList.forEach(function (name) {
    var style = stylesheet[name];
    extend(result, style);
  });
  oldClassList.forEach(function (name) {
    var style = stylesheet[name];
    for (var key in style) {
      if (!result.hasOwnProperty(key)) {
        result[key] = '';
      }
    }
  });
  return result
}

var klass = {
  create: updateClass,
  update: updateClass
};

/*  */

var target$1;

function add$1 (
  event,
  handler,
  once,
  capture,
  passive,
  params
) {
  if (capture) {
    console.log('Weex do not support event in bubble phase.');
    return
  }
  if (once) {
    var oldHandler = handler;
    var _target = target$1; // save current target element in closure
    handler = function (ev) {
      var res = arguments.length === 1
        ? oldHandler(ev)
        : oldHandler.apply(null, arguments);
      if (res !== null) {
        remove$2(event, null, null, _target);
      }
    };
  }
  target$1.addEvent(event, handler, params);
}

function remove$2 (
  event,
  handler,
  capture,
  _target
) {
  (_target || target$1).removeEvent(event);
}

function updateDOMListeners (oldVnode, vnode) {
  if (!oldVnode.data.on && !vnode.data.on) {
    return
  }
  var on = vnode.data.on || {};
  var oldOn = oldVnode.data.on || {};
  target$1 = vnode.elm;
  updateListeners(on, oldOn, add$1, remove$2, vnode.context);
  target$1 = undefined;
}

var events = {
  create: updateDOMListeners,
  update: updateDOMListeners
};

/*  */

var normalize = cached(camelize);

function createStyle (oldVnode, vnode) {
  if (!vnode.data.staticStyle) {
    updateStyle(oldVnode, vnode);
    return
  }
  var elm = vnode.elm;
  var staticStyle = vnode.data.staticStyle;
  var supportBatchUpdate = typeof elm.setStyles === 'function';
  var batchedStyles = {};
  for (var name in staticStyle) {
    if (staticStyle[name]) {
      supportBatchUpdate
        ? (batchedStyles[normalize(name)] = staticStyle[name])
        : elm.setStyle(normalize(name), staticStyle[name]);
    }
  }
  if (supportBatchUpdate) {
    elm.setStyles(batchedStyles);
  }
  updateStyle(oldVnode, vnode);
}

function updateStyle (oldVnode, vnode) {
  if (!oldVnode.data.style && !vnode.data.style) {
    return
  }
  var cur, name;
  var elm = vnode.elm;
  var oldStyle = oldVnode.data.style || {};
  var style = vnode.data.style || {};

  var needClone = style.__ob__;

  // handle array syntax
  if (Array.isArray(style)) {
    style = vnode.data.style = toObject$1(style);
  }

  // clone the style for future updates,
  // in case the user mutates the style object in-place.
  if (needClone) {
    style = vnode.data.style = extend({}, style);
  }

  var supportBatchUpdate = typeof elm.setStyles === 'function';
  var batchedStyles = {};
  for (name in oldStyle) {
    if (!style[name]) {
      supportBatchUpdate
        ? (batchedStyles[normalize(name)] = '')
        : elm.setStyle(normalize(name), '');
    }
  }
  for (name in style) {
    cur = style[name];
    supportBatchUpdate
      ? (batchedStyles[normalize(name)] = cur)
      : elm.setStyle(normalize(name), cur);
  }
  if (supportBatchUpdate) {
    elm.setStyles(batchedStyles);
  }
}

function toObject$1 (arr) {
  var res = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res
}

var style = {
  create: createStyle,
  update: updateStyle
};

/*  */

/**
 * Add class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */


/**
 * Remove class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */

/*  */

function resolveTransition (def) {
  if (!def) {
    return
  }
  /* istanbul ignore else */
  if (typeof def === 'object') {
    var res = {};
    if (def.css !== false) {
      extend(res, autoCssTransition(def.name || 'v'));
    }
    extend(res, def);
    return res
  } else if (typeof def === 'string') {
    return autoCssTransition(def)
  }
}

var autoCssTransition = cached(function (name) {
  return {
    enterClass: (name + "-enter"),
    enterToClass: (name + "-enter-to"),
    enterActiveClass: (name + "-enter-active"),
    leaveClass: (name + "-leave"),
    leaveToClass: (name + "-leave-to"),
    leaveActiveClass: (name + "-leave-active")
  }
});

var hasTransition = inBrowser && !isIE9;
// Transition property/event sniffing




if (hasTransition) {
  /* istanbul ignore if */
  if (window.ontransitionend === undefined &&
    window.onwebkittransitionend !== undefined
  ) {

  }
  if (window.onanimationend === undefined &&
    window.onwebkitanimationend !== undefined
  ) {

  }
}

// binding to window is necessary to make hot reload work in IE in strict mode
var raf = inBrowser
  ? window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : setTimeout
  : /* istanbul ignore next */ function (fn) { return fn(); };

var transition = {
  create: enter,
  activate: enter,
  remove: leave
};

function enter (_, vnode) {
  var el = vnode.elm;

  // call leave callback now
  if (el._leaveCb) {
    el._leaveCb.cancelled = true;
    el._leaveCb();
  }

  var data = resolveTransition(vnode.data.transition);
  if (!data) {
    return
  }

  /* istanbul ignore if */
  if (el._enterCb) {
    return
  }

  var enterClass = data.enterClass;
  var enterToClass = data.enterToClass;
  var enterActiveClass = data.enterActiveClass;
  var appearClass = data.appearClass;
  var appearToClass = data.appearToClass;
  var appearActiveClass = data.appearActiveClass;
  var beforeEnter = data.beforeEnter;
  var enter = data.enter;
  var afterEnter = data.afterEnter;
  var enterCancelled = data.enterCancelled;
  var beforeAppear = data.beforeAppear;
  var appear = data.appear;
  var afterAppear = data.afterAppear;
  var appearCancelled = data.appearCancelled;

  var context = activeInstance;
  var transitionNode = activeInstance.$vnode;
  while (transitionNode && transitionNode.parent) {
    transitionNode = transitionNode.parent;
    context = transitionNode.context;
  }

  var isAppear = !context._isMounted || !vnode.isRootInsert;

  if (isAppear && !appear && appear !== '') {
    return
  }

  var startClass = isAppear ? appearClass : enterClass;
  var toClass = isAppear ? appearToClass : enterToClass;
  var activeClass = isAppear ? appearActiveClass : enterActiveClass;
  var beforeEnterHook = isAppear ? (beforeAppear || beforeEnter) : beforeEnter;
  var enterHook = isAppear ? (typeof appear === 'function' ? appear : enter) : enter;
  var afterEnterHook = isAppear ? (afterAppear || afterEnter) : afterEnter;
  var enterCancelledHook = isAppear ? (appearCancelled || enterCancelled) : enterCancelled;

  var userWantsControl =
    enterHook &&
    // enterHook may be a bound method which exposes
    // the length of original fn as _length
    (enterHook._length || enterHook.length) > 1;

  var stylesheet = vnode.context.$options.style || {};
  var startState = stylesheet[startClass];
  var transitionProperties = (stylesheet['@TRANSITION'] && stylesheet['@TRANSITION'][activeClass]) || {};
  var endState = getEnterTargetState(el, stylesheet, startClass, toClass, activeClass, vnode.context);
  var needAnimation = Object.keys(endState).length > 0;

  var cb = el._enterCb = once(function () {
    if (cb.cancelled) {
      enterCancelledHook && enterCancelledHook(el);
    } else {
      afterEnterHook && afterEnterHook(el);
    }
    el._enterCb = null;
  });

  // We need to wait until the native element has been inserted, but currently
  // there's no API to do that. So we have to wait "one frame" - not entirely
  // sure if this is guaranteed to be enough (e.g. on slow devices?)
  setTimeout(function () {
    var parent = el.parentNode;
    var pendingNode = parent && parent._pending && parent._pending[vnode.key];
    if (pendingNode &&
      pendingNode.context === vnode.context &&
      pendingNode.tag === vnode.tag &&
      pendingNode.elm._leaveCb
    ) {
      pendingNode.elm._leaveCb();
    }
    enterHook && enterHook(el, cb);

    if (needAnimation) {
      var animation = vnode.context.$requireWeexModule('animation');
      animation.transition(el.ref, {
        styles: endState,
        duration: transitionProperties.duration || 0,
        delay: transitionProperties.delay || 0,
        timingFunction: transitionProperties.timingFunction || 'linear'
      }, userWantsControl ? noop : cb);
    } else if (!userWantsControl) {
      cb();
    }
  }, 16);

  // start enter transition
  beforeEnterHook && beforeEnterHook(el);

  if (startState) {
    if (typeof el.setStyles === 'function') {
      el.setStyles(startState);
    } else {
      for (var key in startState) {
        el.setStyle(key, startState[key]);
      }
    }
  }

  if (!needAnimation && !userWantsControl) {
    cb();
  }
}

function leave (vnode, rm) {
  var el = vnode.elm;

  // call enter callback now
  if (el._enterCb) {
    el._enterCb.cancelled = true;
    el._enterCb();
  }

  var data = resolveTransition(vnode.data.transition);
  if (!data) {
    return rm()
  }

  if (el._leaveCb) {
    return
  }

  var leaveClass = data.leaveClass;
  var leaveToClass = data.leaveToClass;
  var leaveActiveClass = data.leaveActiveClass;
  var beforeLeave = data.beforeLeave;
  var leave = data.leave;
  var afterLeave = data.afterLeave;
  var leaveCancelled = data.leaveCancelled;
  var delayLeave = data.delayLeave;

  var userWantsControl =
    leave &&
    // leave hook may be a bound method which exposes
    // the length of original fn as _length
    (leave._length || leave.length) > 1;

  var stylesheet = vnode.context.$options.style || {};
  var startState = stylesheet[leaveClass];
  var endState = stylesheet[leaveToClass] || stylesheet[leaveActiveClass];
  var transitionProperties = (stylesheet['@TRANSITION'] && stylesheet['@TRANSITION'][leaveActiveClass]) || {};

  var cb = el._leaveCb = once(function () {
    if (el.parentNode && el.parentNode._pending) {
      el.parentNode._pending[vnode.key] = null;
    }
    if (cb.cancelled) {
      leaveCancelled && leaveCancelled(el);
    } else {
      rm();
      afterLeave && afterLeave(el);
    }
    el._leaveCb = null;
  });

  if (delayLeave) {
    delayLeave(performLeave);
  } else {
    performLeave();
  }

  function performLeave () {
    var animation = vnode.context.$requireWeexModule('animation');
    // the delayed leave may have already been cancelled
    if (cb.cancelled) {
      return
    }
    // record leaving element
    if (!vnode.data.show) {
      (el.parentNode._pending || (el.parentNode._pending = {}))[vnode.key] = vnode;
    }
    beforeLeave && beforeLeave(el);

    if (startState) {
      animation.transition(el.ref, {
        styles: startState
      }, next);
    } else {
      next();
    }

    function next () {
      animation.transition(el.ref, {
        styles: endState,
        duration: transitionProperties.duration || 0,
        delay: transitionProperties.delay || 0,
        timingFunction: transitionProperties.timingFunction || 'linear'
      }, userWantsControl ? noop : cb);
    }

    leave && leave(el, cb);
    if (!endState && !userWantsControl) {
      cb();
    }
  }
}

// determine the target animation style for an entering transition.
function getEnterTargetState (el, stylesheet, startClass, endClass, activeClass, vm) {
  var targetState = {};
  var startState = stylesheet[startClass];
  var endState = stylesheet[endClass];
  var activeState = stylesheet[activeClass];
  // 1. fallback to element's default styling
  if (startState) {
    for (var key in startState) {
      targetState[key] = el.style[key];
      if (
        "development" !== 'production' &&
        targetState[key] == null &&
        (!activeState || activeState[key] == null) &&
        (!endState || endState[key] == null)
      ) {
        warn(
          "transition property \"" + key + "\" is declared in enter starting class (." + startClass + "), " +
          "but not declared anywhere in enter ending class (." + endClass + "), " +
          "enter active cass (." + activeClass + ") or the element's default styling. " +
          "Note in Weex, CSS properties need explicit values to be transitionable."
        );
      }
    }
  }
  // 2. if state is mixed in active state, extract them while excluding
  //    transition properties
  if (activeState) {
    for (var key$1 in activeState) {
      if (key$1.indexOf('transition') !== 0) {
        targetState[key$1] = activeState[key$1];
      }
    }
  }
  // 3. explicit endState has highest priority
  if (endState) {
    extend(targetState, endState);
  }
  return targetState
}

var platformModules = [
  attrs,
  klass,
  events,
  style,
  transition
];

/*  */

// the directive module should be applied last, after all
// built-in modules have been applied.
var modules = platformModules.concat(baseModules);

var patch = createPatchFunction({
  nodeOps: nodeOps,
  modules: modules,
  LONG_LIST_THRESHOLD: 10
});

var platformDirectives = {
};

/*  */

function getVNodeType (vnode) {
  if (!vnode.tag) {
    return ''
  }
  return vnode.tag.replace(/vue\-component\-(\d+\-)?/, '')
}

function isSimpleSpan (vnode) {
  return vnode.children &&
    vnode.children.length === 1 &&
    !vnode.children[0].tag
}

function parseStyle (vnode) {
  if (!vnode || !vnode.data) {
    return
  }
  var ref = vnode.data;
  var staticStyle = ref.staticStyle;
  var staticClass = ref.staticClass;
  if (vnode.data.style || vnode.data.class || staticStyle || staticClass) {
    var styles = Object.assign({}, staticStyle, vnode.data.style);
    var cssMap = vnode.context.$options.style || {};
    var classList = [].concat(staticClass, vnode.data.class);
    classList.forEach(function (name) {
      if (name && cssMap[name]) {
        Object.assign(styles, cssMap[name]);
      }
    });
    return styles
  }
}

function convertVNodeChildren (children) {
  if (!children.length) {
    return
  }

  return children.map(function (vnode) {
    var type = getVNodeType(vnode);
    var props = { type: type };

    // convert raw text node
    if (!type) {
      props.type = 'span';
      props.attr = {
        value: (vnode.text || '').trim()
      };
    } else {
      props.style = parseStyle(vnode);
      if (vnode.data) {
        props.attr = vnode.data.attrs;
        if (vnode.data.on) {
          props.events = vnode.data.on;
        }
      }
      if (type === 'span' && isSimpleSpan(vnode)) {
        props.attr = props.attr || {};
        props.attr.value = vnode.children[0].text.trim();
        return props
      }
    }

    if (vnode.children && vnode.children.length) {
      props.children = convertVNodeChildren(vnode.children);
    }

    return props
  })
}

var Richtext = {
  name: 'richtext',
  render: function render (h) {
    return h('weex:richtext', {
      on: this._events,
      attrs: {
        value: convertVNodeChildren(this.$options._renderChildren || [])
      }
    })
  }
};

/*  */

// Provides transition support for a single element/component.
// supports transition mode (out-in / in-out)

var transitionProps = {
  name: String,
  appear: Boolean,
  css: Boolean,
  mode: String,
  type: String,
  enterClass: String,
  leaveClass: String,
  enterToClass: String,
  leaveToClass: String,
  enterActiveClass: String,
  leaveActiveClass: String,
  appearClass: String,
  appearActiveClass: String,
  appearToClass: String,
  duration: [Number, String, Object]
};

// in case the child is also an abstract component, e.g. <keep-alive>
// we want to recursively retrieve the real component to be rendered
function getRealChild (vnode) {
  var compOptions = vnode && vnode.componentOptions;
  if (compOptions && compOptions.Ctor.options.abstract) {
    return getRealChild(getFirstComponentChild(compOptions.children))
  } else {
    return vnode
  }
}

function extractTransitionData (comp) {
  var data = {};
  var options = comp.$options;
  // props
  for (var key in options.propsData) {
    data[key] = comp[key];
  }
  // events.
  // extract listeners and pass them directly to the transition methods
  var listeners = options._parentListeners;
  for (var key$1 in listeners) {
    data[camelize(key$1)] = listeners[key$1];
  }
  return data
}

function placeholder (h, rawChild) {
  if (/\d-keep-alive$/.test(rawChild.tag)) {
    return h('keep-alive', {
      props: rawChild.componentOptions.propsData
    })
  }
}

function hasParentTransition (vnode) {
  while ((vnode = vnode.parent)) {
    if (vnode.data.transition) {
      return true
    }
  }
}

function isSameChild (child, oldChild) {
  return oldChild.key === child.key && oldChild.tag === child.tag
}

var Transition$1 = {
  name: 'transition',
  props: transitionProps,
  abstract: true,

  render: function render (h) {
    var this$1 = this;

    var children = this.$slots.default;
    if (!children) {
      return
    }

    // filter out text nodes (possible whitespaces)
    children = children.filter(function (c) { return c.tag || isAsyncPlaceholder(c); });
    /* istanbul ignore if */
    if (!children.length) {
      return
    }

    // warn multiple elements
    if ("development" !== 'production' && children.length > 1) {
      warn(
        '<transition> can only be used on a single element. Use ' +
        '<transition-group> for lists.',
        this.$parent
      );
    }

    var mode = this.mode;

    // warn invalid mode
    if ("development" !== 'production' &&
      mode && mode !== 'in-out' && mode !== 'out-in'
    ) {
      warn(
        'invalid <transition> mode: ' + mode,
        this.$parent
      );
    }

    var rawChild = children[0];

    // if this is a component root node and the component's
    // parent container node also has transition, skip.
    if (hasParentTransition(this.$vnode)) {
      return rawChild
    }

    // apply transition data to child
    // use getRealChild() to ignore abstract components e.g. keep-alive
    var child = getRealChild(rawChild);
    /* istanbul ignore if */
    if (!child) {
      return rawChild
    }

    if (this._leaving) {
      return placeholder(h, rawChild)
    }

    // ensure a key that is unique to the vnode type and to this transition
    // component instance. This key will be used to remove pending leaving nodes
    // during entering.
    var id = "__transition-" + (this._uid) + "-";
    child.key = child.key == null
      ? child.isComment
        ? id + 'comment'
        : id + child.tag
      : isPrimitive(child.key)
        ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
        : child.key;

    var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
    var oldRawChild = this._vnode;
    var oldChild = getRealChild(oldRawChild);

    // mark v-show
    // so that the transition module can hand over the control to the directive
    if (child.data.directives && child.data.directives.some(function (d) { return d.name === 'show'; })) {
      child.data.show = true;
    }

    if (
      oldChild &&
      oldChild.data &&
      !isSameChild(child, oldChild) &&
      !isAsyncPlaceholder(oldChild) &&
      // #6687 component root is a comment node
      !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
    ) {
      // replace old child transition data with fresh one
      // important for dynamic transitions!
      var oldData = oldChild.data.transition = extend({}, data);
      // handle transition mode
      if (mode === 'out-in') {
        // return placeholder node and queue update when leave finishes
        this._leaving = true;
        mergeVNodeHook(oldData, 'afterLeave', function () {
          this$1._leaving = false;
          this$1.$forceUpdate();
        });
        return placeholder(h, rawChild)
      } else if (mode === 'in-out') {
        if (isAsyncPlaceholder(child)) {
          return oldRawChild
        }
        var delayedLeave;
        var performLeave = function () { delayedLeave(); };
        mergeVNodeHook(data, 'afterEnter', performLeave);
        mergeVNodeHook(data, 'enterCancelled', performLeave);
        mergeVNodeHook(oldData, 'delayLeave', function (leave) { delayedLeave = leave; });
      }
    }

    return rawChild
  }
};

// reuse same transition component logic from web

var props = extend({
  tag: String,
  moveClass: String
}, transitionProps);

delete props.mode;

var TransitionGroup = {
  props: props,

  created: function created () {
    var dom = this.$requireWeexModule('dom');
    this.getPosition = function (el) { return new Promise(function (resolve, reject) {
      dom.getComponentRect(el.ref, function (res) {
        if (!res.result) {
          reject(new Error(("failed to get rect for element: " + (el.tag))));
        } else {
          resolve(res.size);
        }
      });
    }); };

    var animation = this.$requireWeexModule('animation');
    this.animate = function (el, options) { return new Promise(function (resolve) {
      animation.transition(el.ref, options, resolve);
    }); };
  },

  render: function render (h) {
    var tag = this.tag || this.$vnode.data.tag || 'span';
    var map = Object.create(null);
    var prevChildren = this.prevChildren = this.children;
    var rawChildren = this.$slots.default || [];
    var children = this.children = [];
    var transitionData = extractTransitionData(this);

    for (var i = 0; i < rawChildren.length; i++) {
      var c = rawChildren[i];
      if (c.tag) {
        if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
          children.push(c);
          map[c.key] = c
          ;(c.data || (c.data = {})).transition = transitionData;
        } else {
          var opts = c.componentOptions;
          var name = opts
            ? (opts.Ctor.options.name || opts.tag)
            : c.tag;
          warn(("<transition-group> children must be keyed: <" + name + ">"));
        }
      }
    }

    if (prevChildren) {
      var kept = [];
      var removed = [];
      prevChildren.forEach(function (c) {
        c.data.transition = transitionData;

        // TODO: record before patch positions

        if (map[c.key]) {
          kept.push(c);
        } else {
          removed.push(c);
        }
      });
      this.kept = h(tag, null, kept);
      this.removed = removed;
    }

    return h(tag, null, children)
  },

  beforeUpdate: function beforeUpdate () {
    // force removing pass
    this.__patch__(
      this._vnode,
      this.kept,
      false, // hydrating
      true // removeOnly (!important avoids unnecessary moves)
    );
    this._vnode = this.kept;
  },

  updated: function updated () {
    var children = this.prevChildren;
    var moveClass = this.moveClass || ((this.name || 'v') + '-move');
    var moveData = children.length && this.getMoveData(children[0].context, moveClass);
    if (!moveData) {
      return
    }

    // TODO: finish implementing move animations once
    // we have access to sync getComponentRect()

    // children.forEach(callPendingCbs)

    // Promise.all(children.map(c => {
    //   const oldPos = c.data.pos
    //   const newPos = c.data.newPos
    //   const dx = oldPos.left - newPos.left
    //   const dy = oldPos.top - newPos.top
    //   if (dx || dy) {
    //     c.data.moved = true
    //     return this.animate(c.elm, {
    //       styles: {
    //         transform: `translate(${dx}px,${dy}px)`
    //       }
    //     })
    //   }
    // })).then(() => {
    //   children.forEach(c => {
    //     if (c.data.moved) {
    //       this.animate(c.elm, {
    //         styles: {
    //           transform: ''
    //         },
    //         duration: moveData.duration || 0,
    //         delay: moveData.delay || 0,
    //         timingFunction: moveData.timingFunction || 'linear'
    //       })
    //     }
    //   })
    // })
  },

  methods: {
    getMoveData: function getMoveData (context, moveClass) {
      var stylesheet = context.$options.style || {};
      return stylesheet['@TRANSITION'] && stylesheet['@TRANSITION'][moveClass]
    }
  }
};

// function callPendingCbs (c) {
//   /* istanbul ignore if */
//   if (c.elm._moveCb) {
//     c.elm._moveCb()
//   }
//   /* istanbul ignore if */
//   if (c.elm._enterCb) {
//     c.elm._enterCb()
//   }
// }

var platformComponents = {
  Richtext: Richtext,
  Transition: Transition$1,
  TransitionGroup: TransitionGroup
};

/*  */

// These util functions are split into its own file because Rollup cannot drop
// makeMap() due to potential side effects, so these variables end up
// bloating the web builds.

var isReservedTag$1 = makeMap(
  'template,script,style,element,content,slot,link,meta,svg,view,' +
  'a,div,img,image,text,span,input,switch,textarea,spinner,select,' +
  'slider,slider-neighbor,indicator,canvas,' +
  'list,cell,header,loading,loading-indicator,refresh,scrollable,scroller,' +
  'video,web,embed,tabbar,tabheader,datepicker,timepicker,marquee,countdown',
  true
);

// Elements that you can, intentionally, leave open (and which close themselves)
// more flexible than web
var canBeLeftOpenTag = makeMap(
  'web,spinner,switch,video,textarea,canvas,' +
  'indicator,marquee,countdown',
  true
);

var isRuntimeComponent = makeMap(
  'richtext,transition,transition-group',
  true
);

var isUnaryTag = makeMap(
  'embed,img,image,input,link,meta',
  true
);

function mustUseProp (tag, type, name) {
  return false
}



function isUnknownElement$1 (tag) {
  return false
}

function query (el, document) {
  // document is injected by weex factory wrapper
  var placeholder = document.createComment('root');
  placeholder.hasAttribute = placeholder.removeAttribute = function () {}; // hack for patch
  document.documentElement.appendChild(placeholder);
  return placeholder
}

/*  */

// install platform specific utils
Vue$2.config.mustUseProp = mustUseProp;
Vue$2.config.isReservedTag = isReservedTag$1;
Vue$2.config.isRuntimeComponent = isRuntimeComponent;
Vue$2.config.isUnknownElement = isUnknownElement$1;

// install platform runtime directives and components
Vue$2.options.directives = platformDirectives;
Vue$2.options.components = platformComponents;

// install platform patch function
Vue$2.prototype.__patch__ = patch;

// wrap mount
Vue$2.prototype.$mount = function (
  el,
  hydrating
) {
  return mountComponent(
    this,
    el && query(el, this.$document),
    hydrating
  )
};

// this entry is built and wrapped with a factory function
// used to generate a fresh copy of Vue for every Weex instance.

exports.Vue = Vue$2;

};
});

unwrapExports(factory);

var weexVueFramework = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, '__esModule', { value: true });

/*  */

// this will be preserved during build
// $flow-disable-line


var instanceOptions = {};

/**
 * Create instance context.
 */
function createInstanceContext (
  instanceId,
  runtimeContext,
  data
) {
  if ( data === void 0 ) { data = {}; }

  var weex = runtimeContext.weex;
  var instance = instanceOptions[instanceId] = {
    instanceId: instanceId,
    config: weex.config,
    document: weex.document,
    data: data
  };

  // Each instance has a independent `Vue` module instance
  var Vue = instance.Vue = createVueModuleInstance(instanceId, weex);

  // DEPRECATED
  var timerAPIs = getInstanceTimer(instanceId, weex.requireModule);

  var instanceContext = Object.assign({ Vue: Vue }, timerAPIs);
  Object.freeze(instanceContext);
  return instanceContext
}

/**
 * Destroy an instance with id. It will make sure all memory of
 * this instance released and no more leaks.
 */
function destroyInstance (instanceId) {
  var instance = instanceOptions[instanceId];
  if (instance && instance.app instanceof instance.Vue) {
    try {
      instance.app.$destroy();
      instance.document.destroy();
    } catch (e) {}
    delete instance.document;
    delete instance.app;
  }
  delete instanceOptions[instanceId];
}

/**
 * Refresh an instance with id and new top-level component data.
 * It will use `Vue.set` on all keys of the new data. So it's better
 * define all possible meaningful keys when instance created.
 */
function refreshInstance (
  instanceId,
  data
) {
  var instance = instanceOptions[instanceId];
  if (!instance || !(instance.app instanceof instance.Vue)) {
    return new Error(("refreshInstance: instance " + instanceId + " not found!"))
  }
  if (instance.Vue && instance.Vue.set) {
    for (var key in data) {
      instance.Vue.set(instance.app, key, data[key]);
    }
  }
  // Finally `refreshFinish` signal needed.
  instance.document.taskCenter.send('dom', { action: 'refreshFinish' }, []);
}

/**
 * Create a fresh instance of Vue for each Weex instance.
 */
function createVueModuleInstance (
  instanceId,
  weex
) {
  var exports = {};
  factory(exports, weex.document);
  var Vue = exports.Vue;

  var instance = instanceOptions[instanceId];

  // patch reserved tag detection to account for dynamically registered
  // components
  var weexRegex = /^weex:/i;
  var isReservedTag = Vue.config.isReservedTag || (function () { return false; });
  var isRuntimeComponent = Vue.config.isRuntimeComponent || (function () { return false; });
  Vue.config.isReservedTag = function (name) {
    return (!isRuntimeComponent(name) && weex.supports(("@component/" + name))) ||
      isReservedTag(name) ||
      weexRegex.test(name)
  };
  Vue.config.parsePlatformTagName = function (name) { return name.replace(weexRegex, ''); };

  // expose weex-specific info
  Vue.prototype.$instanceId = instanceId;
  Vue.prototype.$document = instance.document;

  // expose weex native module getter on subVue prototype so that
  // vdom runtime modules can access native modules via vnode.context
  Vue.prototype.$requireWeexModule = weex.requireModule;

  // Hack `Vue` behavior to handle instance information and data
  // before root component created.
  Vue.mixin({
    beforeCreate: function beforeCreate () {
      var options = this.$options;
      // root component (vm)
      if (options.el) {
        // set external data of instance
        var dataOption = options.data;
        var internalData = (typeof dataOption === 'function' ? dataOption() : dataOption) || {};
        options.data = Object.assign(internalData, instance.data);
        // record instance by id
        instance.app = this;
      }
    },
    mounted: function mounted () {
      var options = this.$options;
      // root component (vm)
      if (options.el && weex.document && instance.app === this) {
        try {
          // Send "createFinish" signal to native.
          weex.document.taskCenter.send('dom', { action: 'createFinish' }, []);
        } catch (e) {}
      }
    }
  });

  /**
   * @deprecated Just instance variable `weex.config`
   * Get instance config.
   * @return {object}
   */
  Vue.prototype.$getConfig = function () {
    if (instance.app instanceof Vue) {
      return instance.config
    }
  };

  return Vue
}

/**
 * DEPRECATED
 * Generate HTML5 Timer APIs. An important point is that the callback
 * will be converted into callback id when sent to native. So the
 * framework can make sure no side effect of the callback happened after
 * an instance destroyed.
 */
function getInstanceTimer (
  instanceId,
  moduleGetter
) {
  var instance = instanceOptions[instanceId];
  var timer = moduleGetter('timer');
  var timerAPIs = {
    setTimeout: function () {
      var arguments$1 = arguments;

      var args = [], len = arguments.length;
      while ( len-- ) { args[ len ] = arguments$1[ len ]; }

      var handler = function () {
        args[0].apply(args, args.slice(2));
      };

      timer.setTimeout(handler, args[1]);
      return instance.document.taskCenter.callbackManager.lastCallbackId.toString()
    },
    setInterval: function () {
      var arguments$1 = arguments;

      var args = [], len = arguments.length;
      while ( len-- ) { args[ len ] = arguments$1[ len ]; }

      var handler = function () {
        args[0].apply(args, args.slice(2));
      };

      timer.setInterval(handler, args[1]);
      return instance.document.taskCenter.callbackManager.lastCallbackId.toString()
    },
    clearTimeout: function (n) {
      timer.clearTimeout(n);
    },
    clearInterval: function (n) {
      timer.clearInterval(n);
    }
  };
  return timerAPIs
}

exports.createInstanceContext = createInstanceContext;
exports.destroyInstance = destroyInstance;
exports.refreshInstance = refreshInstance;
});

var index = unwrapExports(weexVueFramework);
var weexVueFramework_1 = weexVueFramework.createInstanceContext;
var weexVueFramework_2 = weexVueFramework.destroyInstance;
var weexVueFramework_3 = weexVueFramework.refreshInstance;


var Vue = Object.freeze({
	default: index,
	__moduleExports: weexVueFramework,
	createInstanceContext: weexVueFramework_1,
	destroyInstance: weexVueFramework_2,
	refreshInstance: weexVueFramework_3
});

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

setup({ Vue: Vue });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VleC12dWUuanMiLCJzb3VyY2VzIjpbIi4uL3J1bnRpbWUvc2hhcmVkL3V0aWxzLmpzIiwiLi4vcnVudGltZS9icmlkZ2Uvbm9ybWFsaXplLmpzIiwiLi4vcnVudGltZS9icmlkZ2UvQ2FsbGJhY2tNYW5hZ2VyLmpzIiwiLi4vcnVudGltZS92ZG9tL29wZXJhdGlvbi5qcyIsIi4uL3J1bnRpbWUvdmRvbS9Ob2RlLmpzIiwiLi4vcnVudGltZS92ZG9tL1dlZXhFbGVtZW50LmpzIiwiLi4vcnVudGltZS92ZG9tL0VsZW1lbnQuanMiLCIuLi9ydW50aW1lL2JyaWRnZS9UYXNrQ2VudGVyLmpzIiwiLi4vcnVudGltZS9icmlkZ2UvcmVjZWl2ZXIuanMiLCIuLi9ydW50aW1lL2FwaS9tb2R1bGUuanMiLCIuLi9ydW50aW1lL2FwaS9jb21wb25lbnQuanMiLCIuLi9ydW50aW1lL2FwaS9zZXJ2aWNlLmpzIiwiLi4vcnVudGltZS9icmlkZ2UvZGVidWcuanMiLCIuLi9ydW50aW1lL3Zkb20vQ29tbWVudC5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL0xpc3RlbmVyLmpzIiwiLi4vcnVudGltZS9icmlkZ2UvSGFuZGxlci5qcyIsIi4uL3J1bnRpbWUvdmRvbS9Eb2N1bWVudC5qcyIsIi4uL3J1bnRpbWUvYXBpL1dlZXhJbnN0YW5jZS5qcyIsIi4uL3J1bnRpbWUvYXBpL2luaXQuanMiLCIuLi9ydW50aW1lL3Zkb20vaW5kZXguanMiLCIuLi9ydW50aW1lL2FwaS9jb25maWcuanMiLCIuLi9ydW50aW1lL2FwaS9pbmRleC5qcyIsIi4uL3J1bnRpbWUvc2VydmljZXMvYnJvYWRjYXN0LWNoYW5uZWwvbWVzc2FnZS1ldmVudC5qcyIsIi4uL3J1bnRpbWUvc2VydmljZXMvYnJvYWRjYXN0LWNoYW5uZWwvaW5kZXguanMiLCIuLi9ydW50aW1lL3NlcnZpY2VzL2luZGV4LmpzIiwiLi4vcnVudGltZS9lbnRyaWVzL3NldHVwLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3dlZXgtdnVlLWZyYW1ld29yay9mYWN0b3J5LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3dlZXgtdnVlLWZyYW1ld29yay9pbmRleC5qcyIsIi4uL3J1bnRpbWUvZW50cmllcy92dWUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogR2V0IGEgdW5pcXVlIGlkLlxuICovXG5sZXQgbmV4dE5vZGVSZWYgPSAxXG5leHBvcnQgZnVuY3Rpb24gdW5pcXVlSWQgKCkge1xuICByZXR1cm4gKG5leHROb2RlUmVmKyspLnRvU3RyaW5nKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHR5cG9mICh2KSB7XG4gIGNvbnN0IHMgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodilcbiAgcmV0dXJuIHMuc3Vic3RyaW5nKDgsIHMubGVuZ3RoIC0gMSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1ZmZlclRvQmFzZTY0IChidWZmZXIpIHtcbiAgaWYgKHR5cGVvZiBidG9hICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgY29uc3Qgc3RyaW5nID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKFxuICAgIG5ldyBVaW50OEFycmF5KGJ1ZmZlciksXG4gICAgY29kZSA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpXG4gICkuam9pbignJylcbiAgcmV0dXJuIGJ0b2Eoc3RyaW5nKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjRUb0J1ZmZlciAoYmFzZTY0KSB7XG4gIGlmICh0eXBlb2YgYXRvYiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBuZXcgQXJyYXlCdWZmZXIoMClcbiAgfVxuICBjb25zdCBzdHJpbmcgPSBhdG9iKGJhc2U2NCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KHN0cmluZy5sZW5ndGgpXG4gIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoc3RyaW5nLCAoY2gsIGkpID0+IHtcbiAgICBhcnJheVtpXSA9IGNoLmNoYXJDb2RlQXQoMClcbiAgfSlcbiAgcmV0dXJuIGFycmF5LmJ1ZmZlclxufVxuXG4vKipcbiAqIERldGVjdCBpZiB0aGUgcGFyYW0gaXMgZmFsc3kgb3IgZW1wdHlcbiAqIEBwYXJhbSB7YW55fSBhbnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRW1wdHkgKGFueSkge1xuICBpZiAoIWFueSB8fCB0eXBlb2YgYW55ICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBpbiBhbnkpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGFueSwga2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgdHlwb2YsIGJ1ZmZlclRvQmFzZTY0LCBiYXNlNjRUb0J1ZmZlciB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcblxuLyoqXG4gKiBOb3JtYWxpemUgYSBwcmltaXRpdmUgdmFsdWUuXG4gKiBAcGFyYW0gIHthbnl9ICAgICAgICB2XG4gKiBAcmV0dXJuIHtwcmltaXRpdmV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcmltaXRpdmUgKHYpIHtcbiAgY29uc3QgdHlwZSA9IHR5cG9mKHYpXG5cbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnVW5kZWZpbmVkJzpcbiAgICBjYXNlICdOdWxsJzpcbiAgICAgIHJldHVybiAnJ1xuXG4gICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgIHJldHVybiB2LnRvU3RyaW5nKClcbiAgICBjYXNlICdEYXRlJzpcbiAgICAgIHJldHVybiB2LnRvSVNPU3RyaW5nKClcblxuICAgIGNhc2UgJ051bWJlcic6XG4gICAgY2FzZSAnU3RyaW5nJzpcbiAgICBjYXNlICdCb29sZWFuJzpcbiAgICBjYXNlICdBcnJheSc6XG4gICAgY2FzZSAnT2JqZWN0JzpcbiAgICAgIHJldHVybiB2XG5cbiAgICBjYXNlICdBcnJheUJ1ZmZlcic6XG4gICAgICByZXR1cm4ge1xuICAgICAgICAnQHR5cGUnOiAnYmluYXJ5JyxcbiAgICAgICAgZGF0YVR5cGU6IHR5cGUsXG4gICAgICAgIGJhc2U2NDogYnVmZmVyVG9CYXNlNjQodilcbiAgICAgIH1cblxuICAgIGNhc2UgJ0ludDhBcnJheSc6XG4gICAgY2FzZSAnVWludDhBcnJheSc6XG4gICAgY2FzZSAnVWludDhDbGFtcGVkQXJyYXknOlxuICAgIGNhc2UgJ0ludDE2QXJyYXknOlxuICAgIGNhc2UgJ1VpbnQxNkFycmF5JzpcbiAgICBjYXNlICdJbnQzMkFycmF5JzpcbiAgICBjYXNlICdVaW50MzJBcnJheSc6XG4gICAgY2FzZSAnRmxvYXQzMkFycmF5JzpcbiAgICBjYXNlICdGbG9hdDY0QXJyYXknOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgJ0B0eXBlJzogJ2JpbmFyeScsXG4gICAgICAgIGRhdGFUeXBlOiB0eXBlLFxuICAgICAgICBiYXNlNjQ6IGJ1ZmZlclRvQmFzZTY0KHYuYnVmZmVyKVxuICAgICAgfVxuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVQcmltaXRpdmUgKGRhdGEpIHtcbiAgaWYgKHR5cG9mKGRhdGEpID09PSAnT2JqZWN0Jykge1xuICAgIC8vIGRlY29kZSBiYXNlNjQgaW50byBiaW5hcnlcbiAgICBpZiAoZGF0YVsnQHR5cGUnXSAmJiBkYXRhWydAdHlwZSddID09PSAnYmluYXJ5Jykge1xuICAgICAgcmV0dXJuIGJhc2U2NFRvQnVmZmVyKGRhdGEuYmFzZTY0IHx8ICcnKVxuICAgIH1cblxuICAgIGNvbnN0IHJlYWxEYXRhID0ge31cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG4gICAgICByZWFsRGF0YVtrZXldID0gZGVjb2RlUHJpbWl0aXZlKGRhdGFba2V5XSlcbiAgICB9XG4gICAgcmV0dXJuIHJlYWxEYXRhXG4gIH1cbiAgaWYgKHR5cG9mKGRhdGEpID09PSAnQXJyYXknKSB7XG4gICAgcmV0dXJuIGRhdGEubWFwKGRlY29kZVByaW1pdGl2ZSlcbiAgfVxuICByZXR1cm4gZGF0YVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IGRlY29kZVByaW1pdGl2ZSB9IGZyb20gJy4vbm9ybWFsaXplJ1xuXG5mdW5jdGlvbiBnZXRIb29rS2V5IChjb21wb25lbnRJZCwgdHlwZSwgaG9va05hbWUpIHtcbiAgcmV0dXJuIGAke3R5cGV9QCR7aG9va05hbWV9IyR7Y29tcG9uZW50SWR9YFxufVxuXG4vKipcbiAqIEZvciBnZW5lcmFsIGNhbGxiYWNrIG1hbmFnZW1lbnQgb2YgYSBjZXJ0YWluIFdlZXggaW5zdGFuY2UuXG4gKiBCZWNhdXNlIGZ1bmN0aW9uIGNhbiBub3QgcGFzc2VkIGludG8gbmF0aXZlLCBzbyB3ZSBjcmVhdGUgY2FsbGJhY2tcbiAqIGNhbGxiYWNrIGlkIGZvciBlYWNoIGZ1bmN0aW9uIGFuZCBwYXNzIHRoZSBjYWxsYmFjayBpZCBpbnRvIG5hdGl2ZVxuICogaW4gZmFjdC4gQW5kIHdoZW4gYSBjYWxsYmFjayBjYWxsZWQgZnJvbSBuYXRpdmUsIHdlIGNhbiBmaW5kIHRoZSByZWFsXG4gKiBjYWxsYmFjayB0aHJvdWdoIHRoZSBjYWxsYmFjayBpZCB3ZSBoYXZlIHBhc3NlZCBiZWZvcmUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENhbGxiYWNrTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yIChpbnN0YW5jZUlkKSB7XG4gICAgdGhpcy5pbnN0YW5jZUlkID0gU3RyaW5nKGluc3RhbmNlSWQpXG4gICAgdGhpcy5sYXN0Q2FsbGJhY2tJZCA9IDBcbiAgICB0aGlzLmNhbGxiYWNrcyA9IHt9XG4gICAgdGhpcy5ob29rcyA9IHt9XG4gIH1cbiAgYWRkIChjYWxsYmFjaykge1xuICAgIHRoaXMubGFzdENhbGxiYWNrSWQrK1xuICAgIHRoaXMuY2FsbGJhY2tzW3RoaXMubGFzdENhbGxiYWNrSWRdID0gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5sYXN0Q2FsbGJhY2tJZFxuICB9XG4gIHJlbW92ZSAoY2FsbGJhY2tJZCkge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3NbY2FsbGJhY2tJZF1cbiAgICBkZWxldGUgdGhpcy5jYWxsYmFja3NbY2FsbGJhY2tJZF1cbiAgICByZXR1cm4gY2FsbGJhY2tcbiAgfVxuICByZWdpc3Rlckhvb2sgKGNvbXBvbmVudElkLCB0eXBlLCBob29rTmFtZSwgaG9va0Z1bmN0aW9uKSB7XG4gICAgLy8gVE9ETzogdmFsaWRhdGUgYXJndW1lbnRzXG4gICAgY29uc3Qga2V5ID0gZ2V0SG9va0tleShjb21wb25lbnRJZCwgdHlwZSwgaG9va05hbWUpXG4gICAgaWYgKHRoaXMuaG9va3Nba2V5XSkge1xuICAgICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBPdmVycmlkZSBhbiBleGlzdGluZyBjb21wb25lbnQgaG9vayBcIiR7a2V5fVwiLmApXG4gICAgfVxuICAgIHRoaXMuaG9va3Nba2V5XSA9IGhvb2tGdW5jdGlvblxuICB9XG4gIHRyaWdnZXJIb29rIChjb21wb25lbnRJZCwgdHlwZSwgaG9va05hbWUsIG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIGFyZ3VtZW50c1xuICAgIGNvbnN0IGtleSA9IGdldEhvb2tLZXkoY29tcG9uZW50SWQsIHR5cGUsIGhvb2tOYW1lKVxuICAgIGNvbnN0IGhvb2tGdW5jdGlvbiA9IHRoaXMuaG9va3Nba2V5XVxuICAgIGlmICh0eXBlb2YgaG9va0Z1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBJbnZhbGlkIGhvb2sgZnVuY3Rpb24gdHlwZSAoJHt0eXBlb2YgaG9va0Z1bmN0aW9ufSkgb24gXCIke2tleX1cIi5gKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IG51bGxcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gaG9va0Z1bmN0aW9uLmFwcGx5KG51bGwsIG9wdGlvbnMuYXJncyB8fCBbXSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byBleGVjdXRlIHRoZSBob29rIGZ1bmN0aW9uIG9uIFwiJHtrZXl9XCIuYClcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGNvbnN1bWUgKGNhbGxiYWNrSWQsIGRhdGEsIGlmS2VlcEFsaXZlKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLmNhbGxiYWNrc1tjYWxsYmFja0lkXVxuICAgIGlmICh0eXBlb2YgaWZLZWVwQWxpdmUgPT09ICd1bmRlZmluZWQnIHx8IGlmS2VlcEFsaXZlID09PSBmYWxzZSkge1xuICAgICAgZGVsZXRlIHRoaXMuY2FsbGJhY2tzW2NhbGxiYWNrSWRdXG4gICAgfVxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhkZWNvZGVQcmltaXRpdmUoZGF0YSkpXG4gICAgfVxuICAgIHJldHVybiBuZXcgRXJyb3IoYGludmFsaWQgY2FsbGJhY2sgaWQgXCIke2NhbGxiYWNrSWR9XCJgKVxuICB9XG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IHt9XG4gICAgdGhpcy5ob29rcyA9IHt9XG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCBkb2NNYXAgPSB7fVxuXG4vKipcbiAqIEFkZCBhIGRvY3VtZW50IG9iamVjdCBpbnRvIGRvY01hcC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtvYmplY3R9IGRvY3VtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREb2MgKGlkLCBkb2MpIHtcbiAgaWYgKGlkKSB7XG4gICAgZG9jTWFwW2lkXSA9IGRvY1xuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBkb2N1bWVudCBvYmplY3QgYnkgaWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERvYyAoaWQpIHtcbiAgcmV0dXJuIGRvY01hcFtpZF1cbn1cblxuLyoqXG4gKiBSZW1vdmUgdGhlIGRvY3VtZW50IGZyb20gZG9jTWFwIGJ5IGlkLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEb2MgKGlkKSB7XG4gIGRlbGV0ZSBkb2NNYXBbaWRdXG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqIEdldCBsaXN0ZW5lciBieSBkb2N1bWVudCBpZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7b2JqZWN0fSBsaXN0ZW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGlzdGVuZXIgKGlkKSB7XG4gIGNvbnN0IGRvYyA9IGRvY01hcFtpZF1cbiAgaWYgKGRvYyAmJiBkb2MubGlzdGVuZXIpIHtcbiAgICByZXR1cm4gZG9jLmxpc3RlbmVyXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBHZXQgVGFza0NlbnRlciBpbnN0YW5jZSBieSBpZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7b2JqZWN0fSBUYXNrQ2VudGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXNrQ2VudGVyIChpZCkge1xuICBjb25zdCBkb2MgPSBkb2NNYXBbaWRdXG4gIGlmIChkb2MgJiYgZG9jLnRhc2tDZW50ZXIpIHtcbiAgICByZXR1cm4gZG9jLnRhc2tDZW50ZXJcbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIEFwcGVuZCBib2R5IG5vZGUgdG8gZG9jdW1lbnRFbGVtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGRvY3VtZW50XG4gKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICogQHBhcmFtIHtvYmplY3R9IGJlZm9yZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQm9keSAoZG9jLCBub2RlLCBiZWZvcmUpIHtcbiAgY29uc3QgeyBkb2N1bWVudEVsZW1lbnQgfSA9IGRvY1xuXG4gIGlmIChkb2N1bWVudEVsZW1lbnQucHVyZUNoaWxkcmVuLmxlbmd0aCA+IDAgfHwgbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgY2hpbGRyZW4gPSBkb2N1bWVudEVsZW1lbnQuY2hpbGRyZW5cbiAgY29uc3QgYmVmb3JlSW5kZXggPSBjaGlsZHJlbi5pbmRleE9mKGJlZm9yZSlcbiAgaWYgKGJlZm9yZUluZGV4IDwgMCkge1xuICAgIGNoaWxkcmVuLnB1c2gobm9kZSlcbiAgfVxuICBlbHNlIHtcbiAgICBjaGlsZHJlbi5zcGxpY2UoYmVmb3JlSW5kZXgsIDAsIG5vZGUpXG4gIH1cblxuICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgIGlmIChub2RlLnJvbGUgPT09ICdib2R5Jykge1xuICAgICAgbm9kZS5kb2NJZCA9IGRvYy5pZFxuICAgICAgbm9kZS5vd25lckRvY3VtZW50ID0gZG9jXG4gICAgICBub2RlLnBhcmVudE5vZGUgPSBkb2N1bWVudEVsZW1lbnRcbiAgICAgIGxpbmtQYXJlbnQobm9kZSwgZG9jdW1lbnRFbGVtZW50KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XG4gICAgICAgIGNoaWxkLnBhcmVudE5vZGUgPSBub2RlXG4gICAgICB9KVxuICAgICAgc2V0Qm9keShkb2MsIG5vZGUpXG4gICAgICBub2RlLmRvY0lkID0gZG9jLmlkXG4gICAgICBub2RlLm93bmVyRG9jdW1lbnQgPSBkb2NcbiAgICAgIGxpbmtQYXJlbnQobm9kZSwgZG9jdW1lbnRFbGVtZW50KVxuICAgICAgZGVsZXRlIGRvYy5ub2RlTWFwW25vZGUubm9kZUlkXVxuICAgIH1cbiAgICBkb2N1bWVudEVsZW1lbnQucHVyZUNoaWxkcmVuLnB1c2gobm9kZSlcbiAgICBzZW5kQm9keShkb2MsIG5vZGUpXG4gIH1cbiAgZWxzZSB7XG4gICAgbm9kZS5wYXJlbnROb2RlID0gZG9jdW1lbnRFbGVtZW50XG4gICAgZG9jLm5vZGVNYXBbbm9kZS5yZWZdID0gbm9kZVxuICB9XG59XG5cbmZ1bmN0aW9uIHNlbmRCb2R5IChkb2MsIG5vZGUpIHtcbiAgY29uc3QgYm9keSA9IG5vZGUudG9KU09OKClcbiAgaWYgKGRvYyAmJiBkb2MudGFza0NlbnRlciAmJiB0eXBlb2YgZG9jLnRhc2tDZW50ZXIuc2VuZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGRvYy50YXNrQ2VudGVyLnNlbmQoJ2RvbScsIHsgYWN0aW9uOiAnY3JlYXRlQm9keScgfSwgW2JvZHldKVxuICB9XG59XG5cbi8qKlxuICogU2V0IHVwIGJvZHkgbm9kZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBkb2N1bWVudFxuICogQHBhcmFtIHtvYmplY3R9IGVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEJvZHkgKGRvYywgZWwpIHtcbiAgZWwucm9sZSA9ICdib2R5J1xuICBlbC5kZXB0aCA9IDFcbiAgZGVsZXRlIGRvYy5ub2RlTWFwW2VsLm5vZGVJZF1cbiAgZWwucmVmID0gJ19yb290J1xuICBkb2Mubm9kZU1hcC5fcm9vdCA9IGVsXG4gIGRvYy5ib2R5ID0gZWxcbn1cblxuLyoqXG4gKiBFc3RhYmxpc2ggdGhlIGNvbm5lY3Rpb24gYmV0d2VlbiBwYXJlbnQgYW5kIGNoaWxkIG5vZGUuXG4gKiBAcGFyYW0ge29iamVjdH0gY2hpbGQgbm9kZVxuICogQHBhcmFtIHtvYmplY3R9IHBhcmVudCBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5rUGFyZW50IChub2RlLCBwYXJlbnQpIHtcbiAgbm9kZS5wYXJlbnROb2RlID0gcGFyZW50XG4gIGlmIChwYXJlbnQuZG9jSWQpIHtcbiAgICBub2RlLmRvY0lkID0gcGFyZW50LmRvY0lkXG4gICAgbm9kZS5vd25lckRvY3VtZW50ID0gcGFyZW50Lm93bmVyRG9jdW1lbnRcbiAgICBub2RlLm93bmVyRG9jdW1lbnQubm9kZU1hcFtub2RlLm5vZGVJZF0gPSBub2RlXG4gICAgbm9kZS5kZXB0aCA9IHBhcmVudC5kZXB0aCArIDFcbiAgfVxuICBub2RlLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgIGxpbmtQYXJlbnQoY2hpbGQsIG5vZGUpXG4gIH0pXG59XG5cbi8qKlxuICogR2V0IHRoZSBuZXh0IHNpYmxpbmcgZWxlbWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXh0RWxlbWVudCAobm9kZSkge1xuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICByZXR1cm4gbm9kZVxuICAgIH1cbiAgICBub2RlID0gbm9kZS5uZXh0U2libGluZ1xuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBwcmV2aW91cyBzaWJsaW5nIGVsZW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJldmlvdXNFbGVtZW50IChub2RlKSB7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgIHJldHVybiBub2RlXG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZ1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0IGEgbm9kZSBpbnRvIGxpc3QgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgbm9kZVxuICogQHBhcmFtIHthcnJheX0gbGlzdFxuICogQHBhcmFtIHtudW1iZXJ9IG5ld0luZGV4XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoYW5nZVNpYmxpbmdcbiAqIEByZXR1cm4ge251bWJlcn0gbmV3SW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydEluZGV4ICh0YXJnZXQsIGxpc3QsIG5ld0luZGV4LCBjaGFuZ2VTaWJsaW5nKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmIChuZXdJbmRleCA8IDApIHtcbiAgICBuZXdJbmRleCA9IDBcbiAgfVxuICBjb25zdCBiZWZvcmUgPSBsaXN0W25ld0luZGV4IC0gMV1cbiAgY29uc3QgYWZ0ZXIgPSBsaXN0W25ld0luZGV4XVxuICBsaXN0LnNwbGljZShuZXdJbmRleCwgMCwgdGFyZ2V0KVxuICBpZiAoY2hhbmdlU2libGluZykge1xuICAgIGJlZm9yZSAmJiAoYmVmb3JlLm5leHRTaWJsaW5nID0gdGFyZ2V0KVxuICAgIHRhcmdldC5wcmV2aW91c1NpYmxpbmcgPSBiZWZvcmVcbiAgICB0YXJnZXQubmV4dFNpYmxpbmcgPSBhZnRlclxuICAgIGFmdGVyICYmIChhZnRlci5wcmV2aW91c1NpYmxpbmcgPSB0YXJnZXQpXG4gIH1cbiAgcmV0dXJuIG5ld0luZGV4XG59XG5cbi8qKlxuICogTW92ZSB0aGUgbm9kZSB0byBhIG5ldyBpbmRleCBpbiBsaXN0LlxuICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBub2RlXG4gKiBAcGFyYW0ge2FycmF5fSBsaXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbmV3SW5kZXhcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY2hhbmdlU2libGluZ1xuICogQHJldHVybiB7bnVtYmVyfSBuZXdJbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gbW92ZUluZGV4ICh0YXJnZXQsIGxpc3QsIG5ld0luZGV4LCBjaGFuZ2VTaWJsaW5nKSB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKHRhcmdldClcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChjaGFuZ2VTaWJsaW5nKSB7XG4gICAgY29uc3QgYmVmb3JlID0gbGlzdFtpbmRleCAtIDFdXG4gICAgY29uc3QgYWZ0ZXIgPSBsaXN0W2luZGV4ICsgMV1cbiAgICBiZWZvcmUgJiYgKGJlZm9yZS5uZXh0U2libGluZyA9IGFmdGVyKVxuICAgIGFmdGVyICYmIChhZnRlci5wcmV2aW91c1NpYmxpbmcgPSBiZWZvcmUpXG4gIH1cbiAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG4gIGxldCBuZXdJbmRleEFmdGVyID0gbmV3SW5kZXhcbiAgaWYgKGluZGV4IDw9IG5ld0luZGV4KSB7XG4gICAgbmV3SW5kZXhBZnRlciA9IG5ld0luZGV4IC0gMVxuICB9XG4gIGNvbnN0IGJlZm9yZU5ldyA9IGxpc3RbbmV3SW5kZXhBZnRlciAtIDFdXG4gIGNvbnN0IGFmdGVyTmV3ID0gbGlzdFtuZXdJbmRleEFmdGVyXVxuICBsaXN0LnNwbGljZShuZXdJbmRleEFmdGVyLCAwLCB0YXJnZXQpXG4gIGlmIChjaGFuZ2VTaWJsaW5nKSB7XG4gICAgYmVmb3JlTmV3ICYmIChiZWZvcmVOZXcubmV4dFNpYmxpbmcgPSB0YXJnZXQpXG4gICAgdGFyZ2V0LnByZXZpb3VzU2libGluZyA9IGJlZm9yZU5ld1xuICAgIHRhcmdldC5uZXh0U2libGluZyA9IGFmdGVyTmV3XG4gICAgYWZ0ZXJOZXcgJiYgKGFmdGVyTmV3LnByZXZpb3VzU2libGluZyA9IHRhcmdldClcbiAgfVxuICBpZiAoaW5kZXggPT09IG5ld0luZGV4QWZ0ZXIpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICByZXR1cm4gbmV3SW5kZXhcbn1cblxuLyoqXG4gKiBSZW1vdmUgdGhlIG5vZGUgZnJvbSBsaXN0LlxuICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBub2RlXG4gKiBAcGFyYW0ge2FycmF5fSBsaXN0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoYW5nZVNpYmxpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUluZGV4ICh0YXJnZXQsIGxpc3QsIGNoYW5nZVNpYmxpbmcpIHtcbiAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YodGFyZ2V0KVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKGNoYW5nZVNpYmxpbmcpIHtcbiAgICBjb25zdCBiZWZvcmUgPSBsaXN0W2luZGV4IC0gMV1cbiAgICBjb25zdCBhZnRlciA9IGxpc3RbaW5kZXggKyAxXVxuICAgIGJlZm9yZSAmJiAoYmVmb3JlLm5leHRTaWJsaW5nID0gYWZ0ZXIpXG4gICAgYWZ0ZXIgJiYgKGFmdGVyLnByZXZpb3VzU2libGluZyA9IGJlZm9yZSlcbiAgfVxuICBsaXN0LnNwbGljZShpbmRleCwgMSlcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyB1bmlxdWVJZCB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcbmltcG9ydCB7IGdldERvYyB9IGZyb20gJy4vb3BlcmF0aW9uJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOb2RlIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMubm9kZUlkID0gdW5pcXVlSWQoKVxuICAgIHRoaXMucmVmID0gdGhpcy5ub2RlSWRcbiAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICB0aGlzLnB1cmVDaGlsZHJlbiA9IFtdXG4gICAgdGhpcy5wYXJlbnROb2RlID0gbnVsbFxuICAgIHRoaXMubmV4dFNpYmxpbmcgPSBudWxsXG4gICAgdGhpcy5wcmV2aW91c1NpYmxpbmcgPSBudWxsXG4gIH1cblxuICAvKipcbiAgKiBEZXN0cm95IGN1cnJlbnQgbm9kZSwgYW5kIHJlbW92ZSBpdHNlbGYgZm9ybSBub2RlTWFwLlxuICAqL1xuICBkZXN0cm95ICgpIHtcbiAgICBjb25zdCBkb2MgPSBnZXREb2ModGhpcy5kb2NJZClcbiAgICBpZiAoZG9jKSB7XG4gICAgICBkZWxldGUgdGhpcy5kb2NJZFxuICAgICAgZGVsZXRlIGRvYy5ub2RlTWFwW3RoaXMubm9kZUlkXVxuICAgIH1cbiAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgY2hpbGQuZGVzdHJveSgpXG4gICAgfSlcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgeyBnZXRUYXNrQ2VudGVyIH0gZnJvbSAnLi9vcGVyYXRpb24nXG5cbmxldCBFbGVtZW50XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRFbGVtZW50IChFbCkge1xuICBFbGVtZW50ID0gRWxcbn1cblxuLyoqXG4gKiBBIG1hcCB3aGljaCBzdG9yZXMgYWxsIHR5cGUgb2YgZWxlbWVudHMuXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5jb25zdCByZWdpc3RlcmVkRWxlbWVudHMgPSB7fVxuXG4vKipcbiAqIFJlZ2lzdGVyIGFuIGV4dGVuZGVkIGVsZW1lbnQgdHlwZSB3aXRoIGNvbXBvbmVudCBtZXRob2RzLlxuICogQHBhcmFtICB7c3RyaW5nfSB0eXBlICAgIGNvbXBvbmVudCB0eXBlXG4gKiBAcGFyYW0gIHthcnJheX0gIG1ldGhvZHMgYSBsaXN0IG9mIG1ldGhvZCBuYW1lc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJFbGVtZW50ICh0eXBlLCBtZXRob2RzKSB7XG4gIC8vIFNraXAgd2hlbiBubyBzcGVjaWFsIGNvbXBvbmVudCBtZXRob2RzLlxuICBpZiAoIW1ldGhvZHMgfHwgIW1ldGhvZHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBJbml0IGNvbnN0cnVjdG9yLlxuICBjbGFzcyBXZWV4RWxlbWVudCBleHRlbmRzIEVsZW1lbnQge31cblxuICAvLyBBZGQgbWV0aG9kcyB0byBwcm90b3R5cGUuXG4gIG1ldGhvZHMuZm9yRWFjaChtZXRob2ROYW1lID0+IHtcbiAgICBXZWV4RWxlbWVudC5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgIHJldHVybiB0YXNrQ2VudGVyLnNlbmQoJ2NvbXBvbmVudCcsIHtcbiAgICAgICAgICByZWY6IHRoaXMucmVmLFxuICAgICAgICAgIGNvbXBvbmVudDogdHlwZSxcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZE5hbWVcbiAgICAgICAgfSwgYXJncylcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgLy8gQWRkIHRvIGVsZW1lbnQgdHlwZSBtYXAuXG4gIHJlZ2lzdGVyZWRFbGVtZW50c1t0eXBlXSA9IFdlZXhFbGVtZW50XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bnJlZ2lzdGVyRWxlbWVudCAodHlwZSkge1xuICBkZWxldGUgcmVnaXN0ZXJlZEVsZW1lbnRzW3R5cGVdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXZWV4RWxlbWVudCAodHlwZSkge1xuICByZXR1cm4gcmVnaXN0ZXJlZEVsZW1lbnRzW3R5cGVdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1dlZXhFbGVtZW50ICh0eXBlKSB7XG4gIHJldHVybiAhIXJlZ2lzdGVyZWRFbGVtZW50c1t0eXBlXVxufVxuXG4vKipcbiAqIENsZWFyIGFsbCBlbGVtZW50IHR5cGVzLiBPbmx5IGZvciB0ZXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJXZWV4RWxlbWVudHMgKCkge1xuICBmb3IgKGNvbnN0IHR5cGUgaW4gcmVnaXN0ZXJlZEVsZW1lbnRzKSB7XG4gICAgdW5yZWdpc3RlckVsZW1lbnQodHlwZSlcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBOb2RlIGZyb20gJy4vTm9kZSdcbmltcG9ydCB7XG4gIGdldERvYyxcbiAgZ2V0VGFza0NlbnRlcixcbiAgbGlua1BhcmVudCxcbiAgbmV4dEVsZW1lbnQsXG4gIHByZXZpb3VzRWxlbWVudCxcbiAgaW5zZXJ0SW5kZXgsXG4gIG1vdmVJbmRleCxcbiAgcmVtb3ZlSW5kZXhcbn0gZnJvbSAnLi9vcGVyYXRpb24nXG5pbXBvcnQgeyB1bmlxdWVJZCwgaXNFbXB0eSB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcbmltcG9ydCB7IGdldFdlZXhFbGVtZW50LCBzZXRFbGVtZW50IH0gZnJvbSAnLi9XZWV4RWxlbWVudCdcblxuY29uc3QgREVGQVVMVF9UQUdfTkFNRSA9ICdkaXYnXG5jb25zdCBCVUJCTEVfRVZFTlRTID0gW1xuICAnY2xpY2snLCAnbG9uZ3ByZXNzJywgJ3RvdWNoc3RhcnQnLCAndG91Y2htb3ZlJywgJ3RvdWNoZW5kJyxcbiAgJ3BhbnN0YXJ0JywgJ3Bhbm1vdmUnLCAncGFuZW5kJywgJ2hvcml6b250YWxwYW4nLCAndmVydGljYWxwYW4nLCAnc3dpcGUnXG5dXG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTm9kZSAoZG9jSWQsIG5vZGUpIHtcbiAgY29uc3QgZG9jID0gZ2V0RG9jKGRvY0lkKVxuICBkb2Mubm9kZU1hcFtub2RlLm5vZGVJZF0gPSBub2RlXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVsZW1lbnQgZXh0ZW5kcyBOb2RlIHtcbiAgY29uc3RydWN0b3IgKHR5cGUgPSBERUZBVUxUX1RBR19OQU1FLCBwcm9wcywgaXNFeHRlbmRlZCkge1xuICAgIHN1cGVyKClcblxuICAgIGNvbnN0IFdlZXhFbGVtZW50ID0gZ2V0V2VleEVsZW1lbnQodHlwZSlcbiAgICBpZiAoV2VleEVsZW1lbnQgJiYgIWlzRXh0ZW5kZWQpIHtcbiAgICAgIHJldHVybiBuZXcgV2VleEVsZW1lbnQodHlwZSwgcHJvcHMsIHRydWUpXG4gICAgfVxuXG4gICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgIHRoaXMubm9kZVR5cGUgPSAxXG4gICAgdGhpcy5ub2RlSWQgPSB1bmlxdWVJZCgpXG4gICAgdGhpcy5yZWYgPSB0aGlzLm5vZGVJZFxuICAgIHRoaXMudHlwZSA9IHR5cGVcbiAgICB0aGlzLmF0dHIgPSBwcm9wcy5hdHRyIHx8IHt9XG4gICAgdGhpcy5zdHlsZSA9IHByb3BzLnN0eWxlIHx8IHt9XG4gICAgdGhpcy5jbGFzc1N0eWxlID0gcHJvcHMuY2xhc3NTdHlsZSB8fCB7fVxuICAgIHRoaXMuZXZlbnQgPSB7fVxuICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgIHRoaXMucHVyZUNoaWxkcmVuID0gW11cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgYSBjaGlsZCBub2RlLlxuICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGFwcGVuZENoaWxkIChub2RlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmICghbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICBsaW5rUGFyZW50KG5vZGUsIHRoaXMpXG4gICAgICBpbnNlcnRJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmxlbmd0aCwgdHJ1ZSlcbiAgICAgIGlmICh0aGlzLmRvY0lkKSB7XG4gICAgICAgIHJlZ2lzdGVyTm9kZSh0aGlzLmRvY0lkLCBub2RlKVxuICAgICAgfVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgaW5zZXJ0SW5kZXgobm9kZSwgdGhpcy5wdXJlQ2hpbGRyZW4sIHRoaXMucHVyZUNoaWxkcmVuLmxlbmd0aClcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ2FkZEVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbdGhpcy5yZWYsIG5vZGUudG9KU09OKCksIC0xXVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1vdmVJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmxlbmd0aCwgdHJ1ZSlcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gbW92ZUluZGV4KG5vZGUsIHRoaXMucHVyZUNoaWxkcmVuLCB0aGlzLnB1cmVDaGlsZHJlbi5sZW5ndGgpXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyICYmIGluZGV4ID49IDApIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ21vdmVFbGVtZW50JyB9LFxuICAgICAgICAgICAgW25vZGUucmVmLCB0aGlzLnJlZiwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydCBhIG5vZGUgYmVmb3JlIHNwZWNpZmllZCBub2RlLlxuICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICAgKiBAcGFyYW0ge29iamVjdH0gYmVmb3JlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgaW5zZXJ0QmVmb3JlIChub2RlLCBiZWZvcmUpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlICYmIG5vZGUucGFyZW50Tm9kZSAhPT0gdGhpcykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChub2RlID09PSBiZWZvcmUgfHwgKG5vZGUubmV4dFNpYmxpbmcgJiYgbm9kZS5uZXh0U2libGluZyA9PT0gYmVmb3JlKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICBsaW5rUGFyZW50KG5vZGUsIHRoaXMpXG4gICAgICBpbnNlcnRJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmluZGV4T2YoYmVmb3JlKSwgdHJ1ZSlcbiAgICAgIGlmICh0aGlzLmRvY0lkKSB7XG4gICAgICAgIHJlZ2lzdGVyTm9kZSh0aGlzLmRvY0lkLCBub2RlKVxuICAgICAgfVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgcHVyZUJlZm9yZSA9IG5leHRFbGVtZW50KGJlZm9yZSlcbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnNlcnRJbmRleChcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIHRoaXMucHVyZUNoaWxkcmVuLFxuICAgICAgICAgIHB1cmVCZWZvcmVcbiAgICAgICAgICAgID8gdGhpcy5wdXJlQ2hpbGRyZW4uaW5kZXhPZihwdXJlQmVmb3JlKVxuICAgICAgICAgICAgOiB0aGlzLnB1cmVDaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgKVxuICAgICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgICAgIHJldHVybiB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICAgIHsgYWN0aW9uOiAnYWRkRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFt0aGlzLnJlZiwgbm9kZS50b0pTT04oKSwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW92ZUluZGV4KG5vZGUsIHRoaXMuY2hpbGRyZW4sIHRoaXMuY2hpbGRyZW4uaW5kZXhPZihiZWZvcmUpLCB0cnVlKVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgcHVyZUJlZm9yZSA9IG5leHRFbGVtZW50KGJlZm9yZSlcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgY29uc3QgaW5kZXggPSBtb3ZlSW5kZXgoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICB0aGlzLnB1cmVDaGlsZHJlbixcbiAgICAgICAgICBwdXJlQmVmb3JlXG4gICAgICAgICAgICA/IHRoaXMucHVyZUNoaWxkcmVuLmluZGV4T2YocHVyZUJlZm9yZSlcbiAgICAgICAgICAgIDogdGhpcy5wdXJlQ2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgaWYgKHRhc2tDZW50ZXIgJiYgaW5kZXggPj0gMCkge1xuICAgICAgICAgIHJldHVybiB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICAgIHsgYWN0aW9uOiAnbW92ZUVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbbm9kZS5yZWYsIHRoaXMucmVmLCBpbmRleF1cbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0IGEgbm9kZSBhZnRlciBzcGVjaWZpZWQgbm9kZS5cbiAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAgICogQHBhcmFtIHtvYmplY3R9IGFmdGVyXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgaW5zZXJ0QWZ0ZXIgKG5vZGUsIGFmdGVyKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAobm9kZSA9PT0gYWZ0ZXIgfHwgKG5vZGUucHJldmlvdXNTaWJsaW5nICYmIG5vZGUucHJldmlvdXNTaWJsaW5nID09PSBhZnRlcikpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIW5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbGlua1BhcmVudChub2RlLCB0aGlzKVxuICAgICAgaW5zZXJ0SW5kZXgobm9kZSwgdGhpcy5jaGlsZHJlbiwgdGhpcy5jaGlsZHJlbi5pbmRleE9mKGFmdGVyKSArIDEsIHRydWUpXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKHRoaXMuZG9jSWQpIHtcbiAgICAgICAgcmVnaXN0ZXJOb2RlKHRoaXMuZG9jSWQsIG5vZGUpXG4gICAgICB9XG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICBjb25zdCBpbmRleCA9IGluc2VydEluZGV4KFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4sXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4uaW5kZXhPZihwcmV2aW91c0VsZW1lbnQoYWZ0ZXIpKSArIDFcbiAgICAgICAgKVxuICAgICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgICAgIHJldHVybiB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICAgIHsgYWN0aW9uOiAnYWRkRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFt0aGlzLnJlZiwgbm9kZS50b0pTT04oKSwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW92ZUluZGV4KG5vZGUsIHRoaXMuY2hpbGRyZW4sIHRoaXMuY2hpbGRyZW4uaW5kZXhPZihhZnRlcikgKyAxLCB0cnVlKVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBtb3ZlSW5kZXgoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICB0aGlzLnB1cmVDaGlsZHJlbixcbiAgICAgICAgICB0aGlzLnB1cmVDaGlsZHJlbi5pbmRleE9mKHByZXZpb3VzRWxlbWVudChhZnRlcikpICsgMVxuICAgICAgICApXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyICYmIGluZGV4ID49IDApIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ21vdmVFbGVtZW50JyB9LFxuICAgICAgICAgICAgW25vZGUucmVmLCB0aGlzLnJlZiwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIGNoaWxkIG5vZGUsIGFuZCBkZWNpZGUgd2hldGhlciBpdCBzaG91bGQgYmUgZGVzdHJveWVkLlxuICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHByZXNlcnZlZFxuICAgKi9cbiAgcmVtb3ZlQ2hpbGQgKG5vZGUsIHByZXNlcnZlZCkge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIHJlbW92ZUluZGV4KG5vZGUsIHRoaXMuY2hpbGRyZW4sIHRydWUpXG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICByZW1vdmVJbmRleChub2RlLCB0aGlzLnB1cmVDaGlsZHJlbilcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgICB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICAgIHsgYWN0aW9uOiAncmVtb3ZlRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFtub2RlLnJlZl1cbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwcmVzZXJ2ZWQpIHtcbiAgICAgIG5vZGUuZGVzdHJveSgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsZWFyIGFsbCBjaGlsZCBub2Rlcy5cbiAgICovXG4gIGNsZWFyICgpIHtcbiAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgIHRoaXMucHVyZUNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ3JlbW92ZUVsZW1lbnQnIH0sXG4gICAgICAgICAgW25vZGUucmVmXVxuICAgICAgICApXG4gICAgICB9KVxuICAgIH1cbiAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBub2RlLmRlc3Ryb3koKVxuICAgIH0pXG4gICAgdGhpcy5jaGlsZHJlbi5sZW5ndGggPSAwXG4gICAgdGhpcy5wdXJlQ2hpbGRyZW4ubGVuZ3RoID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhbiBhdHRyaWJ1dGUsIGFuZCBkZWNpZGUgd2hldGhlciB0aGUgdGFzayBzaG91bGQgYmUgc2VuZCB0byBuYXRpdmUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IHZhbHVlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2lsZW50XG4gICAqL1xuICBzZXRBdHRyIChrZXksIHZhbHVlLCBzaWxlbnQpIHtcbiAgICBpZiAodGhpcy5hdHRyW2tleV0gPT09IHZhbHVlICYmIHNpbGVudCAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmF0dHJba2V5XSA9IHZhbHVlXG4gICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICBpZiAoIXNpbGVudCAmJiB0YXNrQ2VudGVyKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB7fVxuICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAnZG9tJyxcbiAgICAgICAgeyBhY3Rpb246ICd1cGRhdGVBdHRycycgfSxcbiAgICAgICAgW3RoaXMucmVmLCByZXN1bHRdXG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBiYXRjaGVkIGF0dHJpYnV0ZXMuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBiYXRjaGVkQXR0cnNcbiAgICogQHBhcmFtIHtib29sZWFufSBzaWxlbnRcbiAgICovXG4gIHNldEF0dHJzIChiYXRjaGVkQXR0cnMsIHNpbGVudCkge1xuICAgIGlmIChpc0VtcHR5KGJhdGNoZWRBdHRycykpIHJldHVyblxuICAgIGNvbnN0IG11dGF0aW9ucyA9IHt9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYmF0Y2hlZEF0dHJzKSB7XG4gICAgICBpZiAodGhpcy5hdHRyW2tleV0gIT09IGJhdGNoZWRBdHRyc1trZXldKSB7XG4gICAgICAgIHRoaXMuYXR0cltrZXldID0gYmF0Y2hlZEF0dHJzW2tleV1cbiAgICAgICAgbXV0YXRpb25zW2tleV0gPSBiYXRjaGVkQXR0cnNba2V5XVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWlzRW1wdHkobXV0YXRpb25zKSkge1xuICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgIGlmICghc2lsZW50ICYmIHRhc2tDZW50ZXIpIHtcbiAgICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICdkb20nLFxuICAgICAgICAgIHsgYWN0aW9uOiAndXBkYXRlQXR0cnMnIH0sXG4gICAgICAgICAgW3RoaXMucmVmLCBtdXRhdGlvbnNdXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgc3R5bGUgcHJvcGVydHksIGFuZCBkZWNpZGUgd2hldGhlciB0aGUgdGFzayBzaG91bGQgYmUgc2VuZCB0byBuYXRpdmUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IHZhbHVlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2lsZW50XG4gICAqL1xuICBzZXRTdHlsZSAoa2V5LCB2YWx1ZSwgc2lsZW50KSB7XG4gICAgaWYgKHRoaXMuc3R5bGVba2V5XSA9PT0gdmFsdWUgJiYgc2lsZW50ICE9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuc3R5bGVba2V5XSA9IHZhbHVlXG4gICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICBpZiAoIXNpbGVudCAmJiB0YXNrQ2VudGVyKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB7fVxuICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAnZG9tJyxcbiAgICAgICAgeyBhY3Rpb246ICd1cGRhdGVTdHlsZScgfSxcbiAgICAgICAgW3RoaXMucmVmLCByZXN1bHRdXG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBiYXRjaGVkIHN0eWxlIHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBiYXRjaGVkU3R5bGVzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2lsZW50XG4gICAqL1xuICBzZXRTdHlsZXMgKGJhdGNoZWRTdHlsZXMsIHNpbGVudCkge1xuICAgIGlmIChpc0VtcHR5KGJhdGNoZWRTdHlsZXMpKSByZXR1cm5cbiAgICBjb25zdCBtdXRhdGlvbnMgPSB7fVxuICAgIGZvciAoY29uc3Qga2V5IGluIGJhdGNoZWRTdHlsZXMpIHtcbiAgICAgIGlmICh0aGlzLnN0eWxlW2tleV0gIT09IGJhdGNoZWRTdHlsZXNba2V5XSkge1xuICAgICAgICB0aGlzLnN0eWxlW2tleV0gPSBiYXRjaGVkU3R5bGVzW2tleV1cbiAgICAgICAgbXV0YXRpb25zW2tleV0gPSBiYXRjaGVkU3R5bGVzW2tleV1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpc0VtcHR5KG11dGF0aW9ucykpIHtcbiAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICBpZiAoIXNpbGVudCAmJiB0YXNrQ2VudGVyKSB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ3VwZGF0ZVN0eWxlJyB9LFxuICAgICAgICAgIFt0aGlzLnJlZiwgbXV0YXRpb25zXVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBzdHlsZSBwcm9wZXJ0aWVzIGZyb20gY2xhc3MuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjbGFzc1N0eWxlXG4gICAqL1xuICBzZXRDbGFzc1N0eWxlIChjbGFzc1N0eWxlKSB7XG4gICAgLy8gcmVzZXQgcHJldmlvdXMgY2xhc3Mgc3R5bGUgdG8gZW1wdHkgc3RyaW5nXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5jbGFzc1N0eWxlKSB7XG4gICAgICB0aGlzLmNsYXNzU3R5bGVba2V5XSA9ICcnXG4gICAgfVxuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmNsYXNzU3R5bGUsIGNsYXNzU3R5bGUpXG4gICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAnZG9tJyxcbiAgICAgICAgeyBhY3Rpb246ICd1cGRhdGVTdHlsZScgfSxcbiAgICAgICAgW3RoaXMucmVmLCB0aGlzLnRvU3R5bGUoKV1cbiAgICAgIClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGV2ZW50IGhhbmRsZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50IGhhbmRsZXJcbiAgICovXG4gIGFkZEV2ZW50ICh0eXBlLCBoYW5kbGVyLCBwYXJhbXMpIHtcbiAgICBpZiAoIXRoaXMuZXZlbnQpIHtcbiAgICAgIHRoaXMuZXZlbnQgPSB7fVxuICAgIH1cbiAgICBpZiAoIXRoaXMuZXZlbnRbdHlwZV0pIHtcbiAgICAgIHRoaXMuZXZlbnRbdHlwZV0gPSB7IGhhbmRsZXIsIHBhcmFtcyB9XG4gICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICdkb20nLFxuICAgICAgICAgIHsgYWN0aW9uOiAnYWRkRXZlbnQnIH0sXG4gICAgICAgICAgW3RoaXMucmVmLCB0eXBlXVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgdHlwZVxuICAgKi9cbiAgcmVtb3ZlRXZlbnQgKHR5cGUpIHtcbiAgICBpZiAodGhpcy5ldmVudCAmJiB0aGlzLmV2ZW50W3R5cGVdKSB7XG4gICAgICBkZWxldGUgdGhpcy5ldmVudFt0eXBlXVxuICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ3JlbW92ZUV2ZW50JyB9LFxuICAgICAgICAgIFt0aGlzLnJlZiwgdHlwZV1cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlIGFuIGV2ZW50IG1hbnVhbGx5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50IGhhbmRsZXJcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0J1YmJsZSB3aGV0aGVyIG9yIG5vdCBldmVudCBidWJibGVcbiAgICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zXG4gICAqIEByZXR1cm4ge30gYW55dGhpbmcgcmV0dXJuZWQgYnkgaGFuZGxlciBmdW5jdGlvblxuICAgKi9cbiAgZmlyZUV2ZW50ICh0eXBlLCBldmVudCwgaXNCdWJibGUsIG9wdGlvbnMpIHtcbiAgICBsZXQgcmVzdWx0ID0gbnVsbFxuICAgIGxldCBpc1N0b3BQcm9wYWdhdGlvbiA9IGZhbHNlXG4gICAgY29uc3QgZXZlbnREZXNjID0gdGhpcy5ldmVudFt0eXBlXVxuICAgIGlmIChldmVudERlc2MgJiYgZXZlbnQpIHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSBldmVudERlc2MuaGFuZGxlclxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uID0gKCkgPT4ge1xuICAgICAgICBpc1N0b3BQcm9wYWdhdGlvbiA9IHRydWVcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucGFyYW1zKSB7XG4gICAgICAgIHJlc3VsdCA9IGhhbmRsZXIuY2FsbCh0aGlzLCAuLi5vcHRpb25zLnBhcmFtcywgZXZlbnQpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gaGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghaXNTdG9wUHJvcGFnYXRpb25cbiAgICAgICYmIGlzQnViYmxlXG4gICAgICAmJiAoQlVCQkxFX0VWRU5UUy5pbmRleE9mKHR5cGUpICE9PSAtMSlcbiAgICAgICYmIHRoaXMucGFyZW50Tm9kZVxuICAgICAgJiYgdGhpcy5wYXJlbnROb2RlLmZpcmVFdmVudCkge1xuICAgICAgZXZlbnQuY3VycmVudFRhcmdldCA9IHRoaXMucGFyZW50Tm9kZVxuICAgICAgdGhpcy5wYXJlbnROb2RlLmZpcmVFdmVudCh0eXBlLCBldmVudCwgaXNCdWJibGUpIC8vIG5vIG9wdGlvbnNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBzdHlsZXMgb2YgY3VycmVudCBlbGVtZW50LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHN0eWxlXG4gICAqL1xuICB0b1N0eWxlICgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5jbGFzc1N0eWxlLCB0aGlzLnN0eWxlKVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgY3VycmVudCBlbGVtZW50IHRvIEpTT04gbGlrZSBvYmplY3QuXG4gICAqIEByZXR1cm4ge29iamVjdH0gZWxlbWVudFxuICAgKi9cbiAgdG9KU09OICgpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICByZWY6IHRoaXMucmVmLnRvU3RyaW5nKCksXG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBhdHRyOiB0aGlzLmF0dHIsXG4gICAgICBzdHlsZTogdGhpcy50b1N0eWxlKClcbiAgICB9XG4gICAgY29uc3QgZXZlbnQgPSBbXVxuICAgIGZvciAoY29uc3QgdHlwZSBpbiB0aGlzLmV2ZW50KSB7XG4gICAgICBjb25zdCB7IHBhcmFtcyB9ID0gdGhpcy5ldmVudFt0eXBlXVxuICAgICAgaWYgKCFwYXJhbXMpIHtcbiAgICAgICAgZXZlbnQucHVzaCh0eXBlKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGV2ZW50LnB1c2goeyB0eXBlLCBwYXJhbXMgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGV2ZW50Lmxlbmd0aCkge1xuICAgICAgcmVzdWx0LmV2ZW50ID0gZXZlbnRcbiAgICB9XG4gICAgaWYgKHRoaXMucHVyZUNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgcmVzdWx0LmNoaWxkcmVuID0gdGhpcy5wdXJlQ2hpbGRyZW4ubWFwKChjaGlsZCkgPT4gY2hpbGQudG9KU09OKCkpXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRvIEhUTUwgZWxlbWVudCB0YWcgc3RyaW5nLlxuICAgKiBAcmV0dXJuIHtzdGlybmd9IGh0bWxcbiAgICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJzwnICsgdGhpcy50eXBlICtcbiAgICAnIGF0dHI9JyArIEpTT04uc3RyaW5naWZ5KHRoaXMuYXR0cikgK1xuICAgICcgc3R5bGU9JyArIEpTT04uc3RyaW5naWZ5KHRoaXMudG9TdHlsZSgpKSArICc+JyArXG4gICAgdGhpcy5wdXJlQ2hpbGRyZW4ubWFwKChjaGlsZCkgPT4gY2hpbGQudG9TdHJpbmcoKSkuam9pbignJykgK1xuICAgICc8LycgKyB0aGlzLnR5cGUgKyAnPidcbiAgfVxufVxuXG5zZXRFbGVtZW50KEVsZW1lbnQpXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IENhbGxiYWNrTWFuYWdlciBmcm9tICcuL0NhbGxiYWNrTWFuYWdlcidcbmltcG9ydCBFbGVtZW50IGZyb20gJy4uL3Zkb20vRWxlbWVudCdcbmltcG9ydCB7IHR5cG9mIH0gZnJvbSAnLi4vc2hhcmVkL3V0aWxzJ1xuaW1wb3J0IHsgbm9ybWFsaXplUHJpbWl0aXZlIH0gZnJvbSAnLi9ub3JtYWxpemUnXG5cbmxldCBmYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9XG5cbi8vIFRoZSBBUEkgb2YgVGFza0NlbnRlciB3b3VsZCBiZSByZS1kZXNpZ24uXG5leHBvcnQgY2xhc3MgVGFza0NlbnRlciB7XG4gIGNvbnN0cnVjdG9yIChpZCwgc2VuZFRhc2tzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdpbnN0YW5jZUlkJywge1xuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBTdHJpbmcoaWQpXG4gICAgfSlcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2NhbGxiYWNrTWFuYWdlcicsIHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbmV3IENhbGxiYWNrTWFuYWdlcihpZClcbiAgICB9KVxuICAgIGZhbGxiYWNrID0gc2VuZFRhc2tzIHx8IGZ1bmN0aW9uICgpIHt9XG4gIH1cblxuICBjYWxsYmFjayAoY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsYmFja01hbmFnZXIuY29uc3VtZShjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSlcbiAgfVxuXG4gIHJlZ2lzdGVySG9vayAoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrTWFuYWdlci5yZWdpc3Rlckhvb2soLi4uYXJncylcbiAgfVxuXG4gIHRyaWdnZXJIb29rICguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbGJhY2tNYW5hZ2VyLnRyaWdnZXJIb29rKC4uLmFyZ3MpXG4gIH1cblxuICB1cGRhdGVEYXRhIChjb21wb25lbnRJZCwgbmV3RGF0YSwgY2FsbGJhY2spIHtcbiAgICB0aGlzLnNlbmQoJ21vZHVsZScsIHtcbiAgICAgIG1vZHVsZTogJ2RvbScsXG4gICAgICBtZXRob2Q6ICd1cGRhdGVDb21wb25lbnREYXRhJ1xuICAgIH0sIFtjb21wb25lbnRJZCwgbmV3RGF0YSwgY2FsbGJhY2tdKVxuICB9XG5cbiAgZGVzdHJveUNhbGxiYWNrICgpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsYmFja01hbmFnZXIuY2xvc2UoKVxuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZSBhIHZhbHVlLiBTcGVjaWFsbHksIGlmIHRoZSB2YWx1ZSBpcyBhIGZ1bmN0aW9uLCB0aGVuIGdlbmVyYXRlIGEgZnVuY3Rpb24gaWRcbiAgICogYW5kIHNhdmUgaXQgdG8gYENhbGxiYWNrTWFuYWdlcmAsIGF0IGxhc3QgcmV0dXJuIHRoZSBmdW5jdGlvbiBpZC5cbiAgICogQHBhcmFtICB7YW55fSAgICAgICAgdlxuICAgKiBAcmV0dXJuIHtwcmltaXRpdmV9XG4gICAqL1xuICBub3JtYWxpemUgKHYpIHtcbiAgICBjb25zdCB0eXBlID0gdHlwb2YodilcbiAgICBpZiAodiAmJiB2IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgcmV0dXJuIHYucmVmXG4gICAgfVxuICAgIGlmICh2ICYmIHYuX2lzVnVlICYmIHYuJGVsIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgcmV0dXJuIHYuJGVsLnJlZlxuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ0Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuY2FsbGJhY2tNYW5hZ2VyLmFkZCh2KS50b1N0cmluZygpXG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVQcmltaXRpdmUodilcbiAgfVxuXG4gIHNlbmQgKHR5cGUsIHBhcmFtcywgYXJncywgb3B0aW9ucykge1xuICAgIGNvbnN0IHsgYWN0aW9uLCBjb21wb25lbnQsIHJlZiwgbW9kdWxlLCBtZXRob2QgfSA9IHBhcmFtc1xuXG4gICAgYXJncyA9IGFyZ3MubWFwKGFyZyA9PiB0aGlzLm5vcm1hbGl6ZShhcmcpKVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdkb20nOlxuICAgICAgICByZXR1cm4gdGhpc1thY3Rpb25dKHRoaXMuaW5zdGFuY2VJZCwgYXJncylcbiAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudEhhbmRsZXIodGhpcy5pbnN0YW5jZUlkLCByZWYsIG1ldGhvZCwgYXJncywgT2JqZWN0LmFzc2lnbih7IGNvbXBvbmVudCB9LCBvcHRpb25zKSlcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZUhhbmRsZXIodGhpcy5pbnN0YW5jZUlkLCBtb2R1bGUsIG1ldGhvZCwgYXJncywgb3B0aW9ucylcbiAgICB9XG4gIH1cblxuICBjYWxsRE9NIChhY3Rpb24sIGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpc1thY3Rpb25dKHRoaXMuaW5zdGFuY2VJZCwgYXJncylcbiAgfVxuXG4gIGNhbGxDb21wb25lbnQgKHJlZiwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9uZW50SGFuZGxlcih0aGlzLmluc3RhbmNlSWQsIHJlZiwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKVxuICB9XG5cbiAgY2FsbE1vZHVsZSAobW9kdWxlLCBtZXRob2QsIGFyZ3MsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGVIYW5kbGVyKHRoaXMuaW5zdGFuY2VJZCwgbW9kdWxlLCBtZXRob2QsIGFyZ3MsIG9wdGlvbnMpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXQgKCkge1xuICBjb25zdCBET01fTUVUSE9EUyA9IHtcbiAgICBjcmVhdGVGaW5pc2g6IGdsb2JhbC5jYWxsQ3JlYXRlRmluaXNoLFxuICAgIHVwZGF0ZUZpbmlzaDogZ2xvYmFsLmNhbGxVcGRhdGVGaW5pc2gsXG4gICAgcmVmcmVzaEZpbmlzaDogZ2xvYmFsLmNhbGxSZWZyZXNoRmluaXNoLFxuXG4gICAgY3JlYXRlQm9keTogZ2xvYmFsLmNhbGxDcmVhdGVCb2R5LFxuXG4gICAgYWRkRWxlbWVudDogZ2xvYmFsLmNhbGxBZGRFbGVtZW50LFxuICAgIHJlbW92ZUVsZW1lbnQ6IGdsb2JhbC5jYWxsUmVtb3ZlRWxlbWVudCxcbiAgICBtb3ZlRWxlbWVudDogZ2xvYmFsLmNhbGxNb3ZlRWxlbWVudCxcbiAgICB1cGRhdGVBdHRyczogZ2xvYmFsLmNhbGxVcGRhdGVBdHRycyxcbiAgICB1cGRhdGVTdHlsZTogZ2xvYmFsLmNhbGxVcGRhdGVTdHlsZSxcblxuICAgIGFkZEV2ZW50OiBnbG9iYWwuY2FsbEFkZEV2ZW50LFxuICAgIHJlbW92ZUV2ZW50OiBnbG9iYWwuY2FsbFJlbW92ZUV2ZW50XG4gIH1cbiAgY29uc3QgcHJvdG8gPSBUYXNrQ2VudGVyLnByb3RvdHlwZVxuXG4gIGZvciAoY29uc3QgbmFtZSBpbiBET01fTUVUSE9EUykge1xuICAgIGNvbnN0IG1ldGhvZCA9IERPTV9NRVRIT0RTW25hbWVdXG4gICAgcHJvdG9bbmFtZV0gPSBtZXRob2QgP1xuICAgICAgKGlkLCBhcmdzKSA9PiBtZXRob2QoaWQsIC4uLmFyZ3MpIDpcbiAgICAgIChpZCwgYXJncykgPT4gZmFsbGJhY2soaWQsIFt7IG1vZHVsZTogJ2RvbScsIG1ldGhvZDogbmFtZSwgYXJncyB9XSwgJy0xJylcbiAgfVxuXG4gIHByb3RvLmNvbXBvbmVudEhhbmRsZXIgPSBnbG9iYWwuY2FsbE5hdGl2ZUNvbXBvbmVudCB8fFxuICAgICgoaWQsIHJlZiwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKSA9PlxuICAgICAgZmFsbGJhY2soaWQsIFt7IGNvbXBvbmVudDogb3B0aW9ucy5jb21wb25lbnQsIHJlZiwgbWV0aG9kLCBhcmdzIH1dKSlcblxuICBwcm90by5tb2R1bGVIYW5kbGVyID0gZ2xvYmFsLmNhbGxOYXRpdmVNb2R1bGUgfHxcbiAgICAoKGlkLCBtb2R1bGUsIG1ldGhvZCwgYXJncykgPT5cbiAgICAgIGZhbGxiYWNrKGlkLCBbeyBtb2R1bGUsIG1ldGhvZCwgYXJncyB9XSkpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgZ2V0RG9jIH0gZnJvbSAnLi4vdmRvbS9vcGVyYXRpb24nXG5cbmZ1bmN0aW9uIGZpcmVFdmVudCAoZG9jdW1lbnQsIG5vZGVJZCwgdHlwZSwgZXZlbnQsIGRvbUNoYW5nZXMsIHBhcmFtcykge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldFJlZihub2RlSWQpXG4gIGlmIChlbCkge1xuICAgIHJldHVybiBkb2N1bWVudC5maXJlRXZlbnQoZWwsIHR5cGUsIGV2ZW50LCBkb21DaGFuZ2VzLCBwYXJhbXMpXG4gIH1cbiAgcmV0dXJuIG5ldyBFcnJvcihgaW52YWxpZCBlbGVtZW50IHJlZmVyZW5jZSBcIiR7bm9kZUlkfVwiYClcbn1cblxuZnVuY3Rpb24gY2FsbGJhY2sgKGRvY3VtZW50LCBjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSkge1xuICByZXR1cm4gZG9jdW1lbnQudGFza0NlbnRlci5jYWxsYmFjayhjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSlcbn1cblxuZnVuY3Rpb24gY29tcG9uZW50SG9vayAoZG9jdW1lbnQsIGNvbXBvbmVudElkLCB0eXBlLCBob29rLCBvcHRpb25zKSB7XG4gIGlmICghZG9jdW1lbnQgfHwgIWRvY3VtZW50LnRhc2tDZW50ZXIpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBDYW4ndCBmaW5kIFwiZG9jdW1lbnRcIiBvciBcInRhc2tDZW50ZXJcIi5gKVxuICAgIHJldHVybiBudWxsXG4gIH1cbiAgbGV0IHJlc3VsdCA9IG51bGxcbiAgdHJ5IHtcbiAgICByZXN1bHQgPSBkb2N1bWVudC50YXNrQ2VudGVyLnRyaWdnZXJIb29rKGNvbXBvbmVudElkLCB0eXBlLCBob29rLCBvcHRpb25zKVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIHRyaWdnZXIgdGhlIFwiJHt0eXBlfUAke2hvb2t9XCIgaG9vayBvbiAke2NvbXBvbmVudElkfS5gKVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBBY2NlcHQgY2FsbHMgZnJvbSBuYXRpdmUgKGV2ZW50IG9yIGNhbGxiYWNrKS5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlkXG4gKiBAcGFyYW0gIHthcnJheX0gdGFza3MgbGlzdCB3aXRoIGBtZXRob2RgIGFuZCBgYXJnc2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY2VpdmVUYXNrcyAoaWQsIHRhc2tzKSB7XG4gIGNvbnN0IGRvY3VtZW50ID0gZ2V0RG9jKGlkKVxuICBpZiAoIWRvY3VtZW50KSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIHJlY2VpdmVUYXNrcywgYFxuICAgICAgKyBgaW5zdGFuY2UgKCR7aWR9KSBpcyBub3QgYXZhaWxhYmxlLmApXG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkodGFza3MpKSB7XG4gICAgcmV0dXJuIHRhc2tzLm1hcCh0YXNrID0+IHtcbiAgICAgIHN3aXRjaCAodGFzay5tZXRob2QpIHtcbiAgICAgICAgY2FzZSAnY2FsbGJhY2snOiByZXR1cm4gY2FsbGJhY2soZG9jdW1lbnQsIC4uLnRhc2suYXJncylcbiAgICAgICAgY2FzZSAnZmlyZUV2ZW50U3luYyc6XG4gICAgICAgIGNhc2UgJ2ZpcmVFdmVudCc6IHJldHVybiBmaXJlRXZlbnQoZG9jdW1lbnQsIC4uLnRhc2suYXJncylcbiAgICAgICAgY2FzZSAnY29tcG9uZW50SG9vayc6IHJldHVybiBjb21wb25lbnRIb29rKGRvY3VtZW50LCAuLi50YXNrLmFyZ3MpXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmNvbnN0IHdlZXhNb2R1bGVzID0ge31cblxuLyoqXG4gKiBSZWdpc3RlciBuYXRpdmUgbW9kdWxlcyBpbmZvcm1hdGlvbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBuZXdNb2R1bGVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlck1vZHVsZXMgKG5ld01vZHVsZXMpIHtcbiAgZm9yIChjb25zdCBuYW1lIGluIG5ld01vZHVsZXMpIHtcbiAgICBpZiAoIXdlZXhNb2R1bGVzW25hbWVdKSB7XG4gICAgICB3ZWV4TW9kdWxlc1tuYW1lXSA9IHt9XG4gICAgfVxuICAgIG5ld01vZHVsZXNbbmFtZV0uZm9yRWFjaChtZXRob2QgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdlZXhNb2R1bGVzW25hbWVdW21ldGhvZF0gPSB0cnVlXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgd2VleE1vZHVsZXNbbmFtZV1bbWV0aG9kLm5hbWVdID0gbWV0aG9kLmFyZ3NcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgbW9kdWxlIG9yIHRoZSBtZXRob2QgaGFzIGJlZW4gcmVnaXN0ZXJlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGUgbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZCBuYW1lIChvcHRpb25hbClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVnaXN0ZXJlZE1vZHVsZSAobmFtZSwgbWV0aG9kKSB7XG4gIGlmICh0eXBlb2YgbWV0aG9kID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiAhISh3ZWV4TW9kdWxlc1tuYW1lXSAmJiB3ZWV4TW9kdWxlc1tuYW1lXVttZXRob2RdKVxuICB9XG4gIHJldHVybiAhIXdlZXhNb2R1bGVzW25hbWVdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2R1bGVEZXNjcmlwdGlvbiAobmFtZSkge1xuICByZXR1cm4gd2VleE1vZHVsZXNbbmFtZV1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyByZWdpc3RlckVsZW1lbnQgfSBmcm9tICcuLi92ZG9tL1dlZXhFbGVtZW50J1xuXG5jb25zdCB3ZWV4Q29tcG9uZW50cyA9IHt9XG5cbi8qKlxuICogUmVnaXN0ZXIgbmF0aXZlIGNvbXBvbmVudHMgaW5mb3JtYXRpb24uXG4gKiBAcGFyYW0ge2FycmF5fSBuZXdDb21wb25lbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbXBvbmVudHMgKG5ld0NvbXBvbmVudHMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkobmV3Q29tcG9uZW50cykpIHtcbiAgICBuZXdDb21wb25lbnRzLmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdlZXhDb21wb25lbnRzW2NvbXBvbmVudF0gPSB0cnVlXG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgY29tcG9uZW50LnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdlZXhDb21wb25lbnRzW2NvbXBvbmVudC50eXBlXSA9IGNvbXBvbmVudFxuICAgICAgICByZWdpc3RlckVsZW1lbnQoY29tcG9uZW50LnR5cGUsIGNvbXBvbmVudC5tZXRob2RzKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gcmVnaXN0ZXJlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZWdpc3RlcmVkQ29tcG9uZW50IChuYW1lKSB7XG4gIHJldHVybiAhIXdlZXhDb21wb25lbnRzW25hbWVdXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gSlMgU2VydmljZXNcblxuZXhwb3J0IGNvbnN0IHNlcnZpY2VzID0gW11cblxuLyoqXG4gKiBSZWdpc3RlciBhIEphdmFTY3JpcHQgc2VydmljZS5cbiAqIEEgSmF2YVNjcmlwdCBzZXJ2aWNlIG9wdGlvbnMgY291bGQgaGF2ZSBhIHNldCBvZiBsaWZlY3ljbGUgbWV0aG9kc1xuICogZm9yIGVhY2ggV2VleCBpbnN0YW5jZS4gRm9yIGV4YW1wbGU6IGNyZWF0ZSwgcmVmcmVzaCwgZGVzdHJveS5cbiAqIEZvciB0aGUgSlMgZnJhbWV3b3JrIG1haW50YWluZXIgaWYgeW91IHdhbnQgdG8gc3VwcGx5IHNvbWUgZmVhdHVyZXNcbiAqIHdoaWNoIG5lZWQgdG8gd29yayB3ZWxsIGluIGRpZmZlcmVudCBXZWV4IGluc3RhbmNlcywgZXZlbiBpbiBkaWZmZXJlbnRcbiAqIGZyYW1ld29ya3Mgc2VwYXJhdGVseS4gWW91IGNhbiBtYWtlIGEgSmF2YVNjcmlwdCBzZXJ2aWNlIHRvIGluaXRcbiAqIGl0cyB2YXJpYWJsZXMgb3IgY2xhc3NlcyBmb3IgZWFjaCBXZWV4IGluc3RhbmNlIHdoZW4gaXQncyBjcmVhdGVkXG4gKiBhbmQgcmVjeWNsZSB0aGVtIHdoZW4gaXQncyBkZXN0cm95ZWQuXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBDb3VsZCBoYXZlIHsgY3JlYXRlLCByZWZyZXNoLCBkZXN0cm95IH1cbiAqICAgICAgICAgICAgICAgICAgICAgICAgIGxpZmVjeWNsZSBtZXRob2RzLiBJbiBjcmVhdGUgbWV0aG9kIGl0IHNob3VsZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuIG9iamVjdCBvZiB3aGF0IHZhcmlhYmxlcyBvciBjbGFzc2VzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICB3b3VsZCBiZSBpbmplY3RlZCBpbnRvIHRoZSBXZWV4IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIgKG5hbWUsIG9wdGlvbnMpIHtcbiAgaWYgKGhhcyhuYW1lKSkge1xuICAgIGNvbnNvbGUud2FybihgU2VydmljZSBcIiR7bmFtZX1cIiBoYXMgYmVlbiByZWdpc3RlcmVkIGFscmVhZHkhYClcbiAgfVxuICBlbHNlIHtcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucylcbiAgICBzZXJ2aWNlcy5wdXNoKHsgbmFtZSwgb3B0aW9ucyB9KVxuICB9XG59XG5cbi8qKlxuICogVW5yZWdpc3RlciBhIEphdmFTY3JpcHQgc2VydmljZSBieSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5yZWdpc3RlciAobmFtZSkge1xuICBzZXJ2aWNlcy5zb21lKChzZXJ2aWNlLCBpbmRleCkgPT4ge1xuICAgIGlmIChzZXJ2aWNlLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHNlcnZpY2VzLnNwbGljZShpbmRleCwgMSlcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgSmF2YVNjcmlwdCBzZXJ2aWNlIHdpdGggYSBjZXJ0YWluIG5hbWUgZXhpc3RlZC5cbiAqIEBwYXJhbSAge3N0cmluZ30gIG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXMgKG5hbWUpIHtcbiAgcmV0dXJuIGluZGV4T2YobmFtZSkgPj0gMFxufVxuXG4vKipcbiAqIEZpbmQgdGhlIGluZGV4IG9mIGEgSmF2YVNjcmlwdCBzZXJ2aWNlIGJ5IG5hbWVcbiAqIEBwYXJhbSAge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBpbmRleE9mIChuYW1lKSB7XG4gIHJldHVybiBzZXJ2aWNlcy5tYXAoc2VydmljZSA9PiBzZXJ2aWNlLm5hbWUpLmluZGV4T2YobmFtZSlcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBnZXRUYXNrQ2VudGVyIH0gZnJvbSAnLi4vdmRvbS9vcGVyYXRpb24nXG5pbXBvcnQgeyBpc1JlZ2lzdGVyZWRNb2R1bGUgfSBmcm9tICcuLi9hcGkvbW9kdWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gdHJhY2sgKGlkLCB0eXBlLCB2YWx1ZSkge1xuICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcihpZClcbiAgaWYgKCF0YXNrQ2VudGVyIHx8IHR5cGVvZiB0YXNrQ2VudGVyLnNlbmQgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gY3JlYXRlIHRyYWNrZXIhYClcbiAgICByZXR1cm5cbiAgfVxuICBpZiAoIXR5cGUgfHwgIXZhbHVlKSB7XG4gICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBJbnZhbGlkIHRyYWNrIHR5cGUgKCR7dHlwZX0pIG9yIHZhbHVlICgke3ZhbHVlfSlgKVxuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGxhYmVsID0gYGpzZm0uJHt0eXBlfS4ke3ZhbHVlfWBcbiAgdHJ5IHtcbiAgICBpZiAoaXNSZWdpc3RlcmVkTW9kdWxlKCd1c2VyVHJhY2snLCAnYWRkUGVyZlBvaW50JykpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgICBtZXNzYWdlW2xhYmVsXSA9ICc0J1xuICAgICAgdGFza0NlbnRlci5zZW5kKCdtb2R1bGUnLCB7XG4gICAgICAgIG1vZHVsZTogJ3VzZXJUcmFjaycsXG4gICAgICAgIG1ldGhvZDogJ2FkZFBlcmZQb2ludCdcbiAgICAgIH0sIFttZXNzYWdlXSlcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byB0cmFjZSBcIiR7bGFiZWx9XCIhYClcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXJyb3IgKC4uLm1lc3NhZ2VzKSB7XG4gIGlmICh0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIGAsIC4uLm1lc3NhZ2VzKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFeGNlcHRpb24gKGVycikge1xuICBpZiAodHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIudG9TdHJpbmcoKSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHt9XG4gIH1cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICB0aHJvdyBlcnJcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBOb2RlIGZyb20gJy4vTm9kZSdcbmltcG9ydCB7IHVuaXF1ZUlkIH0gZnJvbSAnLi4vc2hhcmVkL3V0aWxzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21tZW50IGV4dGVuZHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yICh2YWx1ZSkge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMubm9kZVR5cGUgPSA4XG4gICAgdGhpcy5ub2RlSWQgPSB1bmlxdWVJZCgpXG4gICAgdGhpcy5yZWYgPSB0aGlzLm5vZGVJZFxuICAgIHRoaXMudHlwZSA9ICdjb21tZW50J1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgIHRoaXMucHVyZUNoaWxkcmVuID0gW11cbiAgfVxuXG4gIC8qKlxuICAqIENvbnZlcnQgdG8gSFRNTCBjb21tZW50IHN0cmluZy5cbiAgKiBAcmV0dXJuIHtzdGlybmd9IGh0bWxcbiAgKi9cbiAgdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnPCEtLSAnICsgdGhpcy52YWx1ZSArICcgLS0+J1xuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4qIENyZWF0ZSB0aGUgYWN0aW9uIG9iamVjdC5cbiogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiogQHBhcmFtIHthcnJheX0gYXJndW1lbnRzXG4qIEByZXR1cm4ge29iamVjdH0gYWN0aW9uXG4qL1xuZnVuY3Rpb24gY3JlYXRlQWN0aW9uIChuYW1lLCBhcmdzID0gW10pIHtcbiAgcmV0dXJuIHsgbW9kdWxlOiAnZG9tJywgbWV0aG9kOiBuYW1lLCBhcmdzOiBhcmdzIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGlzdGVuZXIge1xuICBjb25zdHJ1Y3RvciAoaWQsIGhhbmRsZXIpIHtcbiAgICB0aGlzLmlkID0gaWRcbiAgICB0aGlzLmJhdGNoZWQgPSBmYWxzZVxuICAgIHRoaXMudXBkYXRlcyA9IFtdXG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2hhbmRsZXInLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiBoYW5kbGVyXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tKUyBSdW50aW1lXSBpbnZhbGlkIHBhcmFtZXRlciwgaGFuZGxlciBtdXN0IGJlIGEgZnVuY3Rpb24nKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcImNyZWF0ZUZpbmlzaFwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBjcmVhdGVGaW5pc2ggKGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaGFuZGxlciA9IHRoaXMuaGFuZGxlclxuICAgIHJldHVybiBoYW5kbGVyKFtjcmVhdGVBY3Rpb24oJ2NyZWF0ZUZpbmlzaCcpXSwgY2FsbGJhY2spXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJ1cGRhdGVGaW5pc2hcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgdXBkYXRlRmluaXNoIChjYWxsYmFjaykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLmhhbmRsZXJcbiAgICByZXR1cm4gaGFuZGxlcihbY3JlYXRlQWN0aW9uKCd1cGRhdGVGaW5pc2gnKV0sIGNhbGxiYWNrKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwicmVmcmVzaEZpbmlzaFwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICByZWZyZXNoRmluaXNoIChjYWxsYmFjaykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLmhhbmRsZXJcbiAgICByZXR1cm4gaGFuZGxlcihbY3JlYXRlQWN0aW9uKCdyZWZyZXNoRmluaXNoJyldLCBjYWxsYmFjaylcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcImNyZWF0ZUJvZHlcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50XG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgY3JlYXRlQm9keSAoZWxlbWVudCkge1xuICAgIGNvbnN0IGJvZHkgPSBlbGVtZW50LnRvSlNPTigpXG4gICAgY29uc3QgY2hpbGRyZW4gPSBib2R5LmNoaWxkcmVuXG4gICAgZGVsZXRlIGJvZHkuY2hpbGRyZW5cbiAgICBjb25zdCBhY3Rpb25zID0gW2NyZWF0ZUFjdGlvbignY3JlYXRlQm9keScsIFtib2R5XSldXG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBhY3Rpb25zLnB1c2guYXBwbHkoYWN0aW9ucywgY2hpbGRyZW4ubWFwKGNoaWxkID0+IHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUFjdGlvbignYWRkRWxlbWVudCcsIFtib2R5LnJlZiwgY2hpbGQsIC0xXSlcbiAgICAgIH0pKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGFjdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJhZGRFbGVtZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZWxlbWVudFxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGFkZEVsZW1lbnQgKGVsZW1lbnQsIHJlZiwgaW5kZXgpIHtcbiAgICBpZiAoIShpbmRleCA+PSAwKSkge1xuICAgICAgaW5kZXggPSAtMVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbignYWRkRWxlbWVudCcsIFtyZWYsIGVsZW1lbnQudG9KU09OKCksIGluZGV4XSkpXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJyZW1vdmVFbGVtZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgcmVtb3ZlRWxlbWVudCAocmVmKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocmVmKSkge1xuICAgICAgY29uc3QgYWN0aW9ucyA9IHJlZi5tYXAoKHIpID0+IGNyZWF0ZUFjdGlvbigncmVtb3ZlRWxlbWVudCcsIFtyXSkpXG4gICAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGFjdGlvbnMpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCdyZW1vdmVFbGVtZW50JywgW3JlZl0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwibW92ZUVsZW1lbnRcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSB0YXJnZXQgcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSBwYXJlbnQgcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIG1vdmVFbGVtZW50ICh0YXJnZXRSZWYsIHBhcmVudFJlZiwgaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbignbW92ZUVsZW1lbnQnLCBbdGFyZ2V0UmVmLCBwYXJlbnRSZWYsIGluZGV4XSkpXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJ1cGRhdGVBdHRyc1wiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtzdGlybmd9IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge3N0aXJuZ30ga2V5XG4gICAqIEBwYXJhbSB7c3Rpcm5nfSB2YWx1ZVxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIHNldEF0dHIgKHJlZiwga2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCd1cGRhdGVBdHRycycsIFtyZWYsIHJlc3VsdF0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwidXBkYXRlU3R5bGVcIiBzaWduYWwsIHVwZGF0ZSBhIHNvbGUgc3R5bGUuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtzdGlybmd9IGtleVxuICAgKiBAcGFyYW0ge3N0aXJuZ30gdmFsdWVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBzZXRTdHlsZSAocmVmLCBrZXksIHZhbHVlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge31cbiAgICByZXN1bHRba2V5XSA9IHZhbHVlXG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ3VwZGF0ZVN0eWxlJywgW3JlZiwgcmVzdWx0XSkpXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJ1cGRhdGVTdHlsZVwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtzdGlybmd9IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge29iamVjdH0gc3R5bGVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBzZXRTdHlsZXMgKHJlZiwgc3R5bGUpIHtcbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbigndXBkYXRlU3R5bGUnLCBbcmVmLCBzdHlsZV0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwiYWRkRXZlbnRcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IHR5cGVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBhZGRFdmVudCAocmVmLCB0eXBlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ2FkZEV2ZW50JywgW3JlZiwgdHlwZV0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwicmVtb3ZlRXZlbnRcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IHR5cGVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICByZW1vdmVFdmVudCAocmVmLCB0eXBlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ3JlbW92ZUV2ZW50JywgW3JlZiwgdHlwZV0pKVxuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgaGFuZGxlci5cbiAgICogQHBhcmFtIHtvYmplY3QgfCBhcnJheX0gYWN0aW9uc1xuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHt9IGFueXRoaW5nIHJldHVybmVkIGJ5IGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICBoYW5kbGVyIChhY3Rpb25zLCBjYikge1xuICAgIHJldHVybiBjYiAmJiBjYigpXG4gIH1cblxuICAvKipcbiAgICogQWRkIGFjdGlvbnMgaW50byB1cGRhdGVzLlxuICAgKiBAcGFyYW0ge29iamVjdCB8IGFycmF5fSBhY3Rpb25zXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgYWRkQWN0aW9ucyAoYWN0aW9ucykge1xuICAgIGNvbnN0IHVwZGF0ZXMgPSB0aGlzLnVwZGF0ZXNcbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVyXG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYWN0aW9ucykpIHtcbiAgICAgIGFjdGlvbnMgPSBbYWN0aW9uc11cbiAgICB9XG5cbiAgICBpZiAodGhpcy5iYXRjaGVkKSB7XG4gICAgICB1cGRhdGVzLnB1c2guYXBwbHkodXBkYXRlcywgYWN0aW9ucylcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gaGFuZGxlcihhY3Rpb25zKVxuICAgIH1cbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogVGFzayBoYW5kbGVyIGZvciBjb21tdW5pY2F0aW9uIGJldHdlZW4gamF2YXNjcmlwdCBhbmQgbmF0aXZlLlxuICovXG5cbmNvbnN0IGhhbmRsZXJNYXAgPSB7XG4gIGNyZWF0ZUJvZHk6ICdjYWxsQ3JlYXRlQm9keScsXG4gIGFkZEVsZW1lbnQ6ICdjYWxsQWRkRWxlbWVudCcsXG4gIHJlbW92ZUVsZW1lbnQ6ICdjYWxsUmVtb3ZlRWxlbWVudCcsXG4gIG1vdmVFbGVtZW50OiAnY2FsbE1vdmVFbGVtZW50JyxcbiAgdXBkYXRlQXR0cnM6ICdjYWxsVXBkYXRlQXR0cnMnLFxuICB1cGRhdGVTdHlsZTogJ2NhbGxVcGRhdGVTdHlsZScsXG4gIGFkZEV2ZW50OiAnY2FsbEFkZEV2ZW50JyxcbiAgcmVtb3ZlRXZlbnQ6ICdjYWxsUmVtb3ZlRXZlbnQnXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdGFzayBoYW5kbGVyLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn0gdGFza0hhbmRsZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUhhbmRsZXIgKGlkLCBoYW5kbGVyKSB7XG4gIGNvbnN0IGRlZmF1bHRIYW5kbGVyID0gaGFuZGxlciB8fCBnbG9iYWwuY2FsbE5hdGl2ZVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAodHlwZW9mIGRlZmF1bHRIYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcignW0pTIFJ1bnRpbWVdIG5vIGRlZmF1bHQgaGFuZGxlcicpXG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gdGFza0hhbmRsZXIgKHRhc2tzKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHRhc2tzKSkge1xuICAgICAgdGFza3MgPSBbdGFza3NdXG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFza3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJldHVyblZhbHVlID0gZGlzcGF0Y2hUYXNrKGlkLCB0YXNrc1tpXSwgZGVmYXVsdEhhbmRsZXIpXG4gICAgICBpZiAocmV0dXJuVmFsdWUgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZXJlIGlzIGEgY29ycmVzcG9uZGluZyBhdmFpbGFibGUgaGFuZGxlciBpbiB0aGUgZW52aXJvbm1lbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gbW9kdWxlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBoYXNBdmFpbGFibGVIYW5kbGVyIChtb2R1bGUsIG1ldGhvZCkge1xuICByZXR1cm4gbW9kdWxlID09PSAnZG9tJ1xuICAgICYmIGhhbmRsZXJNYXBbbWV0aG9kXVxuICAgICYmIHR5cGVvZiBnbG9iYWxbaGFuZGxlck1hcFttZXRob2RdXSA9PT0gJ2Z1bmN0aW9uJ1xufVxuXG4vKipcbiAqIERpc3BhdGNoIHRoZSB0YXNrIHRvIHRoZSBzcGVjaWZpZWQgaGFuZGxlci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtvYmplY3R9IHRhc2tcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRIYW5kbGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IHNpZ25hbCByZXR1cm5lZCBmcm9tIG5hdGl2ZVxuICovXG5mdW5jdGlvbiBkaXNwYXRjaFRhc2sgKGlkLCB0YXNrLCBkZWZhdWx0SGFuZGxlcikge1xuICBjb25zdCB7IG1vZHVsZSwgbWV0aG9kLCBhcmdzIH0gPSB0YXNrXG5cbiAgaWYgKGhhc0F2YWlsYWJsZUhhbmRsZXIobW9kdWxlLCBtZXRob2QpKSB7XG4gICAgcmV0dXJuIGdsb2JhbFtoYW5kbGVyTWFwW21ldGhvZF1dKGlkLCAuLi5hcmdzLCAnLTEnKVxuICB9XG5cbiAgcmV0dXJuIGRlZmF1bHRIYW5kbGVyKGlkLCBbdGFza10sICctMScpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IENvbW1lbnQgZnJvbSAnLi9Db21tZW50J1xuaW1wb3J0IEVsZW1lbnQgZnJvbSAnLi9FbGVtZW50J1xuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4uL2JyaWRnZS9MaXN0ZW5lcidcbmltcG9ydCB7IFRhc2tDZW50ZXIgfSBmcm9tICcuLi9icmlkZ2UvVGFza0NlbnRlcidcbmltcG9ydCB7IGNyZWF0ZUhhbmRsZXIgfSBmcm9tICcuLi9icmlkZ2UvSGFuZGxlcidcbmltcG9ydCB7IGFkZERvYywgcmVtb3ZlRG9jLCBhcHBlbmRCb2R5LCBzZXRCb2R5IH0gZnJvbSAnLi9vcGVyYXRpb24nXG5cbi8qKlxuICogVXBkYXRlIGFsbCBjaGFuZ2VzIGZvciBhbiBlbGVtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGVsZW1lbnRcbiAqIEBwYXJhbSB7b2JqZWN0fSBjaGFuZ2VzXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQgKGVsLCBjaGFuZ2VzKSB7XG4gIGNvbnN0IGF0dHJzID0gY2hhbmdlcy5hdHRycyB8fCB7fVxuICBmb3IgKGNvbnN0IG5hbWUgaW4gYXR0cnMpIHtcbiAgICBlbC5zZXRBdHRyKG5hbWUsIGF0dHJzW25hbWVdLCB0cnVlKVxuICB9XG4gIGNvbnN0IHN0eWxlID0gY2hhbmdlcy5zdHlsZSB8fCB7fVxuICBmb3IgKGNvbnN0IG5hbWUgaW4gc3R5bGUpIHtcbiAgICBlbC5zZXRTdHlsZShuYW1lLCBzdHlsZVtuYW1lXSwgdHJ1ZSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEb2N1bWVudCB7XG4gIGNvbnN0cnVjdG9yIChpZCwgdXJsLCBoYW5kbGVyKSB7XG4gICAgaWQgPSBpZCA/IGlkLnRvU3RyaW5nKCkgOiAnJ1xuICAgIHRoaXMuaWQgPSBpZFxuICAgIHRoaXMuVVJMID0gdXJsXG5cbiAgICBhZGREb2MoaWQsIHRoaXMpXG4gICAgdGhpcy5ub2RlTWFwID0ge31cbiAgICBjb25zdCBMID0gRG9jdW1lbnQuTGlzdGVuZXIgfHwgTGlzdGVuZXJcbiAgICB0aGlzLmxpc3RlbmVyID0gbmV3IEwoaWQsIGhhbmRsZXIgfHwgY3JlYXRlSGFuZGxlcihpZCwgRG9jdW1lbnQuaGFuZGxlcikpIC8vIGRlcHJlY2F0ZWRcbiAgICB0aGlzLnRhc2tDZW50ZXIgPSBuZXcgVGFza0NlbnRlcihpZCwgaGFuZGxlciA/IChpZCwgLi4uYXJncykgPT4gaGFuZGxlciguLi5hcmdzKSA6IERvY3VtZW50LmhhbmRsZXIpXG4gICAgdGhpcy5jcmVhdGVEb2N1bWVudEVsZW1lbnQoKVxuICB9XG5cbiAgLyoqXG4gICogR2V0IHRoZSBub2RlIGZyb20gbm9kZU1hcC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gcmVmZXJlbmNlIGlkXG4gICogQHJldHVybiB7b2JqZWN0fSBub2RlXG4gICovXG4gIGdldFJlZiAocmVmKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZU1hcFtyZWZdXG4gIH1cblxuICAvKipcbiAgKiBUdXJuIG9uIGJhdGNoZWQgdXBkYXRlcy5cbiAgKi9cbiAgb3BlbiAoKSB7XG4gICAgdGhpcy5saXN0ZW5lci5iYXRjaGVkID0gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAqIFR1cm4gb2ZmIGJhdGNoZWQgdXBkYXRlcy5cbiAgKi9cbiAgY2xvc2UgKCkge1xuICAgIHRoaXMubGlzdGVuZXIuYmF0Y2hlZCA9IHRydWVcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSB0aGUgZG9jdW1lbnQgZWxlbWVudC5cbiAgKiBAcmV0dXJuIHtvYmplY3R9IGRvY3VtZW50RWxlbWVudFxuICAqL1xuICBjcmVhdGVEb2N1bWVudEVsZW1lbnQgKCkge1xuICAgIGlmICghdGhpcy5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGVsID0gbmV3IEVsZW1lbnQoJ2RvY3VtZW50JylcbiAgICAgIGVsLmRvY0lkID0gdGhpcy5pZFxuICAgICAgZWwub3duZXJEb2N1bWVudCA9IHRoaXNcbiAgICAgIGVsLnJvbGUgPSAnZG9jdW1lbnRFbGVtZW50J1xuICAgICAgZWwuZGVwdGggPSAwXG4gICAgICBlbC5yZWYgPSAnX2RvY3VtZW50RWxlbWVudCdcbiAgICAgIHRoaXMubm9kZU1hcC5fZG9jdW1lbnRFbGVtZW50ID0gZWxcbiAgICAgIHRoaXMuZG9jdW1lbnRFbGVtZW50ID0gZWxcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsLCAnYXBwZW5kQ2hpbGQnLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAobm9kZSkgPT4ge1xuICAgICAgICAgIGFwcGVuZEJvZHkodGhpcywgbm9kZSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsLCAnaW5zZXJ0QmVmb3JlJywge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogKG5vZGUsIGJlZm9yZSkgPT4ge1xuICAgICAgICAgIGFwcGVuZEJvZHkodGhpcywgbm9kZSwgYmVmb3JlKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRvY3VtZW50RWxlbWVudFxuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlIHRoZSBib2R5IGVsZW1lbnQuXG4gICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAgKiBAcGFyYW0ge29iamN0fSBwcm9wc1xuICAqIEByZXR1cm4ge29iamVjdH0gYm9keSBlbGVtZW50XG4gICovXG4gIGNyZWF0ZUJvZHkgKHR5cGUsIHByb3BzKSB7XG4gICAgaWYgKCF0aGlzLmJvZHkpIHtcbiAgICAgIGNvbnN0IGVsID0gbmV3IEVsZW1lbnQodHlwZSwgcHJvcHMpXG4gICAgICBzZXRCb2R5KHRoaXMsIGVsKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJvZHlcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSBhbiBlbGVtZW50LlxuICAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lXG4gICogQHBhcmFtIHtvYmpjdH0gcHJvcHNcbiAgKiBAcmV0dXJuIHtvYmplY3R9IGVsZW1lbnRcbiAgKi9cbiAgY3JlYXRlRWxlbWVudCAodGFnTmFtZSwgcHJvcHMpIHtcbiAgICByZXR1cm4gbmV3IEVsZW1lbnQodGFnTmFtZSwgcHJvcHMpXG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgYW4gY29tbWVudC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICAqIEByZXR1cm4ge29iamVjdH0gY29tbWVudFxuICAqL1xuICBjcmVhdGVDb21tZW50ICh0ZXh0KSB7XG4gICAgcmV0dXJuIG5ldyBDb21tZW50KHRleHQpXG4gIH1cblxuICAvKipcbiAgKiBGaXJlIGFuIGV2ZW50IG9uIHNwZWNpZmllZCBlbGVtZW50IG1hbnVhbGx5LlxuICAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50XG4gICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IHR5cGVcbiAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnQgb2JqZWN0XG4gICogQHBhcmFtIHtvYmplY3R9IGRvbSBjaGFuZ2VzXG4gICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAgKiBAcmV0dXJuIHt9IGFueXRoaW5nIHJldHVybmVkIGJ5IGhhbmRsZXIgZnVuY3Rpb25cbiAgKi9cbiAgZmlyZUV2ZW50IChlbCwgdHlwZSwgZXZlbnQsIGRvbUNoYW5nZXMsIG9wdGlvbnMpIHtcbiAgICBpZiAoIWVsKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgZXZlbnQgPSBldmVudCB8fCB7fVxuICAgIGV2ZW50LnR5cGUgPSBldmVudC50eXBlIHx8IHR5cGVcbiAgICBldmVudC50YXJnZXQgPSBlbFxuICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQgPSBlbFxuICAgIGV2ZW50LnRpbWVzdGFtcCA9IERhdGUubm93KClcbiAgICBpZiAoZG9tQ2hhbmdlcykge1xuICAgICAgdXBkYXRlRWxlbWVudChlbCwgZG9tQ2hhbmdlcylcbiAgICB9XG4gICAgY29uc3QgaXNCdWJibGUgPSB0aGlzLmdldFJlZignX3Jvb3QnKS5hdHRyWydidWJibGUnXSA9PT0gJ3RydWUnXG4gICAgcmV0dXJuIGVsLmZpcmVFdmVudCh0eXBlLCBldmVudCwgaXNCdWJibGUsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgKiBEZXN0cm95IGN1cnJlbnQgZG9jdW1lbnQsIGFuZCByZW1vdmUgaXRzZWxmIGZvcm0gZG9jTWFwLlxuICAqL1xuICBkZXN0cm95ICgpIHtcbiAgICB0aGlzLnRhc2tDZW50ZXIuZGVzdHJveUNhbGxiYWNrKClcbiAgICBkZWxldGUgdGhpcy5saXN0ZW5lclxuICAgIGRlbGV0ZSB0aGlzLm5vZGVNYXBcbiAgICBkZWxldGUgdGhpcy50YXNrQ2VudGVyXG4gICAgcmVtb3ZlRG9jKHRoaXMuaWQpXG4gIH1cbn1cblxuLy8gZGVmYXVsdCB0YXNrIGhhbmRsZXJcbkRvY3VtZW50LmhhbmRsZXIgPSBudWxsXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IERvY3VtZW50IGZyb20gJy4uL3Zkb20vRG9jdW1lbnQnXG5pbXBvcnQgeyBpc1JlZ2lzdGVyZWRNb2R1bGUsIGdldE1vZHVsZURlc2NyaXB0aW9uIH0gZnJvbSAnLi9tb2R1bGUnXG5pbXBvcnQgeyBpc1JlZ2lzdGVyZWRDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudCdcbmltcG9ydCB7IGdldFRhc2tDZW50ZXIgfSBmcm9tICcuLi92ZG9tL29wZXJhdGlvbidcblxuY29uc3QgbW9kdWxlUHJveGllcyA9IHt9XG5cbmZ1bmN0aW9uIHNldElkICh3ZWV4LCBpZCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkod2VleCwgJ1tbQ3VycmVudEluc3RhbmNlSWRdXScsIHsgdmFsdWU6IGlkIH0pXG59XG5cbmZ1bmN0aW9uIGdldElkICh3ZWV4KSB7XG4gIHJldHVybiB3ZWV4WydbW0N1cnJlbnRJbnN0YW5jZUlkXV0nXVxufVxuXG5mdW5jdGlvbiBtb2R1bGVHZXR0ZXIgKGlkLCBtb2R1bGUsIG1ldGhvZCkge1xuICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcihpZClcbiAgaWYgKCF0YXNrQ2VudGVyIHx8IHR5cGVvZiB0YXNrQ2VudGVyLnNlbmQgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gZmluZCB0YXNrQ2VudGVyICgke2lkfSkuYClcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiAoLi4uYXJncykgPT4gdGFza0NlbnRlci5zZW5kKCdtb2R1bGUnLCB7IG1vZHVsZSwgbWV0aG9kIH0sIGFyZ3MpXG59XG5cbmZ1bmN0aW9uIG1vZHVsZVNldHRlciAoaWQsIG1vZHVsZSwgbWV0aG9kLCBmbikge1xuICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcihpZClcbiAgaWYgKCF0YXNrQ2VudGVyIHx8IHR5cGVvZiB0YXNrQ2VudGVyLnNlbmQgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gZmluZCB0YXNrQ2VudGVyICgke2lkfSkuYClcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSAke21vZHVsZX0uJHttZXRob2R9IG11c3QgYmUgYXNzaWduZWQgYXMgYSBmdW5jdGlvbi5gKVxuICAgIHJldHVybiBudWxsXG4gIH1cbiAgcmV0dXJuIGZuID0+IHRhc2tDZW50ZXIuc2VuZCgnbW9kdWxlJywgeyBtb2R1bGUsIG1ldGhvZCB9LCBbZm5dKVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXZWV4SW5zdGFuY2Uge1xuICBjb25zdHJ1Y3RvciAoaWQsIGNvbmZpZykge1xuICAgIHNldElkKHRoaXMsIFN0cmluZyhpZCkpXG4gICAgdGhpcy5jb25maWcgPSBjb25maWcgfHwge31cbiAgICB0aGlzLmRvY3VtZW50ID0gbmV3IERvY3VtZW50KGlkLCB0aGlzLmNvbmZpZy5idW5kbGVVcmwpXG4gICAgdGhpcy5yZXF1aXJlTW9kdWxlID0gdGhpcy5yZXF1aXJlTW9kdWxlLmJpbmQodGhpcylcbiAgICB0aGlzLmlzUmVnaXN0ZXJlZE1vZHVsZSA9IGlzUmVnaXN0ZXJlZE1vZHVsZVxuICAgIHRoaXMuaXNSZWdpc3RlcmVkQ29tcG9uZW50ID0gaXNSZWdpc3RlcmVkQ29tcG9uZW50XG4gIH1cblxuICByZXF1aXJlTW9kdWxlIChtb2R1bGVOYW1lKSB7XG4gICAgY29uc3QgaWQgPSBnZXRJZCh0aGlzKVxuICAgIGlmICghKGlkICYmIHRoaXMuZG9jdW1lbnQgJiYgdGhpcy5kb2N1bWVudC50YXNrQ2VudGVyKSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIHJlcXVpcmVNb2R1bGUoXCIke21vZHVsZU5hbWV9XCIpLCBgXG4gICAgICAgICsgYGluc3RhbmNlICgke2lkfSkgZG9lc24ndCBleGlzdCBhbnltb3JlLmApXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyB3YXJuIGZvciB1bmtub3duIG1vZHVsZVxuICAgIGlmICghaXNSZWdpc3RlcmVkTW9kdWxlKG1vZHVsZU5hbWUpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFtKUyBGcmFtZXdvcmtdIHVzaW5nIHVucmVnaXN0ZXJlZCB3ZWV4IG1vZHVsZSBcIiR7bW9kdWxlTmFtZX1cImApXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgbmV3IG1vZHVsZSBwcm94eVxuICAgIGNvbnN0IHByb3h5TmFtZSA9IGAke21vZHVsZU5hbWV9IyR7aWR9YFxuICAgIGlmICghbW9kdWxlUHJveGllc1twcm94eU5hbWVdKSB7XG4gICAgICAvLyBjcmVhdGUgcmVnaXN0ZXJlZCBtb2R1bGUgYXBpc1xuICAgICAgY29uc3QgbW9kdWxlRGVmaW5lID0gZ2V0TW9kdWxlRGVzY3JpcHRpb24obW9kdWxlTmFtZSlcbiAgICAgIGNvbnN0IG1vZHVsZUFwaXMgPSB7fVxuICAgICAgZm9yIChjb25zdCBtZXRob2ROYW1lIGluIG1vZHVsZURlZmluZSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlQXBpcywgbWV0aG9kTmFtZSwge1xuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGdldDogKCkgPT4gbW9kdWxlR2V0dGVyKGlkLCBtb2R1bGVOYW1lLCBtZXRob2ROYW1lKSxcbiAgICAgICAgICBzZXQ6IGZuID0+IG1vZHVsZVNldHRlcihpZCwgbW9kdWxlTmFtZSwgbWV0aG9kTmFtZSwgZm4pXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIC8vIGNyZWF0ZSBtb2R1bGUgUHJveHlcbiAgICAgIGlmICh0eXBlb2YgUHJveHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbW9kdWxlUHJveGllc1twcm94eU5hbWVdID0gbmV3IFByb3h5KG1vZHVsZUFwaXMsIHtcbiAgICAgICAgICBnZXQgKHRhcmdldCwgbWV0aG9kTmFtZSkge1xuICAgICAgICAgICAgaWYgKG1ldGhvZE5hbWUgaW4gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgIHJldHVybiB0YXJnZXRbbWV0aG9kTmFtZV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gdXNpbmcgdW5yZWdpc3RlcmVkIG1ldGhvZCBcIiR7bW9kdWxlTmFtZX0uJHttZXRob2ROYW1lfVwiYClcbiAgICAgICAgICAgIHJldHVybiBtb2R1bGVHZXR0ZXIoaWQsIG1vZHVsZU5hbWUsIG1ldGhvZE5hbWUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIG1vZHVsZVByb3hpZXNbcHJveHlOYW1lXSA9IG1vZHVsZUFwaXNcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbW9kdWxlUHJveGllc1twcm94eU5hbWVdXG4gIH1cblxuICBzdXBwb3J0cyAoY29uZGl0aW9uKSB7XG4gICAgaWYgKHR5cGVvZiBjb25kaXRpb24gIT09ICdzdHJpbmcnKSByZXR1cm4gbnVsbFxuXG4gICAgY29uc3QgcmVzID0gY29uZGl0aW9uLm1hdGNoKC9eQChcXHcrKVxcLyhcXHcrKShcXC4oXFx3KykpPyQvaSlcbiAgICBpZiAocmVzKSB7XG4gICAgICBjb25zdCB0eXBlID0gcmVzWzFdXG4gICAgICBjb25zdCBuYW1lID0gcmVzWzJdXG4gICAgICBjb25zdCBtZXRob2QgPSByZXNbNF1cbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdtb2R1bGUnOiByZXR1cm4gaXNSZWdpc3RlcmVkTW9kdWxlKG5hbWUsIG1ldGhvZClcbiAgICAgICAgY2FzZSAnY29tcG9uZW50JzogcmV0dXJuIGlzUmVnaXN0ZXJlZENvbXBvbmVudChuYW1lKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyByZWdpc3RlclN0eWxlU2hlZXQgKHN0eWxlcykge1xuICAvLyAgIGlmICh0aGlzLmRvY3VtZW50KSB7XG4gIC8vICAgICB0aGlzLmRvY3VtZW50LnJlZ2lzdGVyU3R5bGVTaGVldChzdHlsZXMpXG4gIC8vICAgfVxuICAvLyB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgaW5pdCBhcyBpbml0VGFza0hhbmRsZXIgfSBmcm9tICcuLi9icmlkZ2UvVGFza0NlbnRlcidcbmltcG9ydCB7IHJlY2VpdmVUYXNrcyB9IGZyb20gJy4uL2JyaWRnZS9yZWNlaXZlcidcbmltcG9ydCB7IHJlZ2lzdGVyTW9kdWxlcyB9IGZyb20gJy4vbW9kdWxlJ1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21wb25lbnRzIH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgeyBzZXJ2aWNlcywgcmVnaXN0ZXIsIHVucmVnaXN0ZXIgfSBmcm9tICcuL3NlcnZpY2UnXG5pbXBvcnQgeyB0cmFjayB9IGZyb20gJy4uL2JyaWRnZS9kZWJ1ZydcbmltcG9ydCBXZWV4SW5zdGFuY2UgZnJvbSAnLi9XZWV4SW5zdGFuY2UnXG5pbXBvcnQgeyBnZXREb2MgfSBmcm9tICcuLi92ZG9tL29wZXJhdGlvbidcblxubGV0IGZyYW1ld29ya3NcbmxldCBydW50aW1lQ29uZmlnXG5cbmNvbnN0IHZlcnNpb25SZWdFeHAgPSAvXlxccypcXC9cXC8gKihcXHtbXn1dKlxcfSkgKlxccj9cXG4vXG5cbi8qKlxuICogRGV0ZWN0IGEgSlMgQnVuZGxlIGNvZGUgYW5kIG1ha2Ugc3VyZSB3aGljaCBmcmFtZXdvcmsgaXQncyBiYXNlZCB0by4gRWFjaCBKU1xuICogQnVuZGxlIHNob3VsZCBtYWtlIHN1cmUgdGhhdCBpdCBzdGFydHMgd2l0aCBhIGxpbmUgb2YgSlNPTiBjb21tZW50IGFuZCBpc1xuICogbW9yZSB0aGF0IG9uZSBsaW5lLlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2RlXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIGdldEJ1bmRsZVR5cGUgKGNvZGUpIHtcbiAgY29uc3QgcmVzdWx0ID0gdmVyc2lvblJlZ0V4cC5leGVjKGNvZGUpXG4gIGlmIChyZXN1bHQpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaW5mbyA9IEpTT04ucGFyc2UocmVzdWx0WzFdKVxuICAgICAgcmV0dXJuIGluZm8uZnJhbWV3b3JrXG4gICAgfVxuICAgIGNhdGNoIChlKSB7fVxuICB9XG5cbiAgLy8gZGVmYXVsdCBidW5kbGUgdHlwZVxuICByZXR1cm4gJ1dlZXgnXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlcnZpY2VzIChpZCwgZW52LCBjb25maWcpIHtcbiAgLy8gSW5pdCBKYXZhU2NyaXB0IHNlcnZpY2VzIGZvciB0aGlzIGluc3RhbmNlLlxuICBjb25zdCBzZXJ2aWNlTWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICBzZXJ2aWNlTWFwLnNlcnZpY2UgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gIHNlcnZpY2VzLmZvckVhY2goKHsgbmFtZSwgb3B0aW9ucyB9KSA9PiB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnKSB7XG4gICAgICBjb25zb2xlLmRlYnVnKGBbSlMgUnVudGltZV0gY3JlYXRlIHNlcnZpY2UgJHtuYW1lfS5gKVxuICAgIH1cbiAgICBjb25zdCBjcmVhdGUgPSBvcHRpb25zLmNyZWF0ZVxuICAgIGlmIChjcmVhdGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNyZWF0ZShpZCwgZW52LCBjb25maWcpXG4gICAgICAgIE9iamVjdC5hc3NpZ24oc2VydmljZU1hcC5zZXJ2aWNlLCByZXN1bHQpXG4gICAgICAgIE9iamVjdC5hc3NpZ24oc2VydmljZU1hcCwgcmVzdWx0Lmluc3RhbmNlKVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW0pTIFJ1bnRpbWVdIEZhaWxlZCB0byBjcmVhdGUgc2VydmljZSAke25hbWV9LmApXG4gICAgICB9XG4gICAgfVxuICB9KVxuICBkZWxldGUgc2VydmljZU1hcC5zZXJ2aWNlLmluc3RhbmNlXG4gIE9iamVjdC5mcmVlemUoc2VydmljZU1hcC5zZXJ2aWNlKVxuICByZXR1cm4gc2VydmljZU1hcFxufVxuXG5jb25zdCBpbnN0YW5jZVR5cGVNYXAgPSB7fVxuZnVuY3Rpb24gZ2V0RnJhbWV3b3JrVHlwZSAoaWQpIHtcbiAgcmV0dXJuIGluc3RhbmNlVHlwZU1hcFtpZF1cbn1cblxuZnVuY3Rpb24gY3JlYXRlSW5zdGFuY2VDb250ZXh0IChpZCwgb3B0aW9ucyA9IHt9LCBkYXRhKSB7XG4gIGNvbnN0IHdlZXggPSBuZXcgV2VleEluc3RhbmNlKGlkLCBvcHRpb25zKVxuICBPYmplY3QuZnJlZXplKHdlZXgpXG5cbiAgY29uc3QgYnVuZGxlVHlwZSA9IG9wdGlvbnMuYnVuZGxlVHlwZSB8fCAnVnVlJ1xuICBpbnN0YW5jZVR5cGVNYXBbaWRdID0gYnVuZGxlVHlwZVxuICBjb25zdCBmcmFtZXdvcmsgPSBydW50aW1lQ29uZmlnLmZyYW1ld29ya3NbYnVuZGxlVHlwZV1cbiAgaWYgKCFmcmFtZXdvcmspIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKGBbSlMgRnJhbWV3b3JrXSBJbnZhbGlkIGJ1bmRsZSB0eXBlIFwiJHtidW5kbGVUeXBlfVwiLmApXG4gIH1cbiAgdHJhY2soaWQsICdidW5kbGVUeXBlJywgYnVuZGxlVHlwZSlcblxuICAvLyBwcmVwYXJlIGpzIHNlcnZpY2VcbiAgY29uc3Qgc2VydmljZXMgPSBjcmVhdGVTZXJ2aWNlcyhpZCwge1xuICAgIHdlZXgsXG4gICAgY29uZmlnOiBvcHRpb25zLFxuICAgIGNyZWF0ZWQ6IERhdGUubm93KCksXG4gICAgZnJhbWV3b3JrOiBidW5kbGVUeXBlLFxuICAgIGJ1bmRsZVR5cGVcbiAgfSwgcnVudGltZUNvbmZpZylcbiAgT2JqZWN0LmZyZWV6ZShzZXJ2aWNlcylcblxuICAvLyBwcmVwYXJlIHJ1bnRpbWUgY29udGV4dFxuICBjb25zdCBydW50aW1lQ29udGV4dCA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgT2JqZWN0LmFzc2lnbihydW50aW1lQ29udGV4dCwgc2VydmljZXMsIHtcbiAgICB3ZWV4LFxuICAgIHNlcnZpY2VzIC8vIFRlbXBvcmFyeSBjb21wYXRpYmxlIHdpdGggc29tZSBsZWdhY3kgQVBJcyBpbiBSYXhcbiAgfSlcbiAgT2JqZWN0LmZyZWV6ZShydW50aW1lQ29udGV4dClcblxuICAvLyBwcmVwYXJlIGluc3RhbmNlIGNvbnRleHRcbiAgY29uc3QgaW5zdGFuY2VDb250ZXh0ID0gT2JqZWN0LmFzc2lnbih7fSwgcnVudGltZUNvbnRleHQpXG4gIGlmICh0eXBlb2YgZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlQ29udGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIE9iamVjdC5hc3NpZ24oaW5zdGFuY2VDb250ZXh0LCBmcmFtZXdvcmsuY3JlYXRlSW5zdGFuY2VDb250ZXh0KGlkLCBydW50aW1lQ29udGV4dCwgZGF0YSkpXG4gIH1cbiAgT2JqZWN0LmZyZWV6ZShpbnN0YW5jZUNvbnRleHQpXG4gIHJldHVybiBpbnN0YW5jZUNvbnRleHRcbn1cblxuLyoqXG4gKiBDaGVjayB3aGljaCBmcmFtZXdvcmsgYSBjZXJ0YWluIEpTIEJ1bmRsZSBjb2RlIGJhc2VkIHRvLiBBbmQgY3JlYXRlIGluc3RhbmNlXG4gKiBieSB0aGlzIGZyYW1ld29yay5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUluc3RhbmNlIChpZCwgY29kZSwgY29uZmlnLCBkYXRhKSB7XG4gIGlmIChpbnN0YW5jZVR5cGVNYXBbaWRdKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgVGhlIGluc3RhbmNlIGlkIFwiJHtpZH1cIiBoYXMgYWxyZWFkeSBiZWVuIHVzZWQhYClcbiAgfVxuXG4gIC8vIEluaXQgaW5zdGFuY2UgaW5mby5cbiAgY29uc3QgYnVuZGxlVHlwZSA9IGdldEJ1bmRsZVR5cGUoY29kZSlcbiAgaW5zdGFuY2VUeXBlTWFwW2lkXSA9IGJ1bmRsZVR5cGVcblxuICAvLyBJbml0IGluc3RhbmNlIGNvbmZpZy5cbiAgY29uZmlnID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb25maWcgfHwge30pKVxuICBjb25maWcuZW52ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWwuV1hFbnZpcm9ubWVudCB8fCB7fSkpXG4gIGNvbmZpZy5idW5kbGVUeXBlID0gYnVuZGxlVHlwZVxuXG4gIGNvbnN0IGZyYW1ld29yayA9IHJ1bnRpbWVDb25maWcuZnJhbWV3b3Jrc1tidW5kbGVUeXBlXVxuICBpZiAoIWZyYW1ld29yaykge1xuICAgIHJldHVybiBuZXcgRXJyb3IoYFtKUyBGcmFtZXdvcmtdIEludmFsaWQgYnVuZGxlIHR5cGUgXCIke2J1bmRsZVR5cGV9XCIuYClcbiAgfVxuICBpZiAoYnVuZGxlVHlwZSA9PT0gJ1dlZXgnKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gQ09NUEFUSUJJTElUWSBXQVJOSU5HOiBgXG4gICAgICArIGBXZWV4IERTTCAxLjAgKC53ZSkgZnJhbWV3b3JrIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQhIGBcbiAgICAgICsgYEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCB2ZXJzaW9uIG9mIFdlZXhTREssIGBcbiAgICAgICsgYHlvdXIgcGFnZSB3b3VsZCBiZSBjcmFzaCBpZiB5b3Ugc3RpbGwgdXNpbmcgdGhlIFwiLndlXCIgZnJhbWV3b3JrLiBgXG4gICAgICArIGBQbGVhc2UgdXBncmFkZSBpdCB0byBWdWUuanMgb3IgUmF4LmApXG4gIH1cblxuICBjb25zdCBpbnN0YW5jZUNvbnRleHQgPSBjcmVhdGVJbnN0YW5jZUNvbnRleHQoaWQsIGNvbmZpZywgZGF0YSlcbiAgaWYgKHR5cGVvZiBmcmFtZXdvcmsuY3JlYXRlSW5zdGFuY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBUZW1wb3JhcnkgY29tcGF0aWJsZSB3aXRoIHNvbWUgbGVnYWN5IEFQSXMgaW4gUmF4LFxuICAgIC8vIHNvbWUgUmF4IHBhZ2UgaXMgdXNpbmcgdGhlIGxlZ2FjeSBcIi53ZVwiIGZyYW1ld29yay5cbiAgICBpZiAoYnVuZGxlVHlwZSA9PT0gJ1JheCcgfHwgYnVuZGxlVHlwZSA9PT0gJ1dlZXgnKSB7XG4gICAgICBjb25zdCByYXhJbnN0YW5jZUNvbnRleHQgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgY29uZmlnLFxuICAgICAgICBjcmVhdGVkOiBEYXRlLm5vdygpLFxuICAgICAgICBmcmFtZXdvcms6IGJ1bmRsZVR5cGVcbiAgICAgIH0sIGluc3RhbmNlQ29udGV4dClcbiAgICAgIHJldHVybiBmcmFtZXdvcmsuY3JlYXRlSW5zdGFuY2UoaWQsIGNvZGUsIGNvbmZpZywgZGF0YSwgcmF4SW5zdGFuY2VDb250ZXh0KVxuICAgIH1cbiAgICByZXR1cm4gZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlKGlkLCBjb2RlLCBjb25maWcsIGRhdGEsIGluc3RhbmNlQ29udGV4dClcbiAgfVxuICAvLyBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBDYW4ndCBmaW5kIGF2YWlsYWJsZSBcImNyZWF0ZUluc3RhbmNlXCIgbWV0aG9kIGluICR7YnVuZGxlVHlwZX0hYClcbiAgcnVuSW5Db250ZXh0KGNvZGUsIGluc3RhbmNlQ29udGV4dClcbn1cblxuLyoqXG4gKiBSdW4ganMgY29kZSBpbiBhIHNwZWNpZmljIGNvbnRleHQuXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHBhcmFtIHtvYmplY3R9IGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gcnVuSW5Db250ZXh0IChjb2RlLCBjb250ZXh0KSB7XG4gIGNvbnN0IGtleXMgPSBbXVxuICBjb25zdCBhcmdzID0gW11cbiAgZm9yIChjb25zdCBrZXkgaW4gY29udGV4dCkge1xuICAgIGtleXMucHVzaChrZXkpXG4gICAgYXJncy5wdXNoKGNvbnRleHRba2V5XSlcbiAgfVxuXG4gIGNvbnN0IGJ1bmRsZSA9IGBcbiAgICAoZnVuY3Rpb24gKGdsb2JhbCkge1xuICAgICAgJHtjb2RlfVxuICAgIH0pKE9iamVjdC5jcmVhdGUodGhpcykpXG4gIGBcblxuICByZXR1cm4gKG5ldyBGdW5jdGlvbiguLi5rZXlzLCBidW5kbGUpKSguLi5hcmdzKVxufVxuXG4vKipcbiAqIEdldCB0aGUgSlNPTiBvYmplY3Qgb2YgdGhlIHJvb3QgZWxlbWVudC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnN0YW5jZUlkXG4gKi9cbmZ1bmN0aW9uIGdldFJvb3QgKGluc3RhbmNlSWQpIHtcbiAgY29uc3QgZG9jdW1lbnQgPSBnZXREb2MoaW5zdGFuY2VJZClcbiAgdHJ5IHtcbiAgICBpZiAoZG9jdW1lbnQgJiYgZG9jdW1lbnQuYm9keSkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkudG9KU09OKClcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gZ2V0IHRoZSB2aXJ0dWFsIGRvbSB0cmVlLmApXG4gICAgcmV0dXJuXG4gIH1cbn1cblxuY29uc3QgbWV0aG9kcyA9IHtcbiAgY3JlYXRlSW5zdGFuY2UsXG4gIGNyZWF0ZUluc3RhbmNlQ29udGV4dCxcbiAgZ2V0Um9vdCxcbiAgZ2V0RG9jdW1lbnQ6IGdldERvYyxcbiAgcmVnaXN0ZXJTZXJ2aWNlOiByZWdpc3RlcixcbiAgdW5yZWdpc3RlclNlcnZpY2U6IHVucmVnaXN0ZXIsXG4gIGNhbGxKUyAoaWQsIHRhc2tzKSB7XG4gICAgY29uc3QgZnJhbWV3b3JrID0gZnJhbWV3b3Jrc1tnZXRGcmFtZXdvcmtUeXBlKGlkKV1cbiAgICBpZiAoZnJhbWV3b3JrICYmIHR5cGVvZiBmcmFtZXdvcmsucmVjZWl2ZVRhc2tzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gZnJhbWV3b3JrLnJlY2VpdmVUYXNrcyhpZCwgdGFza3MpXG4gICAgfVxuICAgIHJldHVybiByZWNlaXZlVGFza3MoaWQsIHRhc2tzKVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgbWV0aG9kcyB3aGljaCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2ROYW1lXG4gKi9cbmZ1bmN0aW9uIGdlbkluc3RhbmNlIChtZXRob2ROYW1lKSB7XG4gIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGNvbnN0IGlkID0gYXJnc1swXVxuICAgIGNvbnN0IHR5cGUgPSBnZXRGcmFtZXdvcmtUeXBlKGlkKVxuICAgIGlmICh0eXBlICYmIGZyYW1ld29ya3NbdHlwZV0pIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZyYW1ld29ya3NbdHlwZV1bbWV0aG9kTmFtZV0oLi4uYXJncylcbiAgICAgIGNvbnN0IGluZm8gPSB7IGZyYW1ld29yazogdHlwZSB9XG5cbiAgICAgIC8vIExpZmVjeWNsZSBtZXRob2RzXG4gICAgICBpZiAobWV0aG9kTmFtZSA9PT0gJ3JlZnJlc2hJbnN0YW5jZScpIHtcbiAgICAgICAgc2VydmljZXMuZm9yRWFjaChzZXJ2aWNlID0+IHtcbiAgICAgICAgICBjb25zdCByZWZyZXNoID0gc2VydmljZS5vcHRpb25zLnJlZnJlc2hcbiAgICAgICAgICBpZiAocmVmcmVzaCkge1xuICAgICAgICAgICAgcmVmcmVzaChpZCwgeyBpbmZvLCBydW50aW1lOiBydW50aW1lQ29uZmlnIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAobWV0aG9kTmFtZSA9PT0gJ2Rlc3Ryb3lJbnN0YW5jZScpIHtcbiAgICAgICAgc2VydmljZXMuZm9yRWFjaChzZXJ2aWNlID0+IHtcbiAgICAgICAgICBjb25zdCBkZXN0cm95ID0gc2VydmljZS5vcHRpb25zLmRlc3Ryb3lcbiAgICAgICAgICBpZiAoZGVzdHJveSkge1xuICAgICAgICAgICAgZGVzdHJveShpZCwgeyBpbmZvLCBydW50aW1lOiBydW50aW1lQ29uZmlnIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICBkZWxldGUgaW5zdGFuY2VUeXBlTWFwW2lkXVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfVxuICAgIHJldHVybiBuZXcgRXJyb3IoYFtKUyBGcmFtZXdvcmtdIFVzaW5nIGludmFsaWQgaW5zdGFuY2UgaWQgYFxuICAgICAgKyBgXCIke2lkfVwiIHdoZW4gY2FsbGluZyAke21ldGhvZE5hbWV9LmApXG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlciBtZXRob2RzIHdoaWNoIGluaXQgZWFjaCBmcmFtZXdvcmtzLlxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZE5hbWVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHNoYXJlZE1ldGhvZFxuICovXG5mdW5jdGlvbiBhZGFwdE1ldGhvZCAobWV0aG9kTmFtZSwgc2hhcmVkTWV0aG9kKSB7XG4gIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGlmICh0eXBlb2Ygc2hhcmVkTWV0aG9kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBzaGFyZWRNZXRob2QoLi4uYXJncylcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBkZXByZWNhdGVkXG4gICAgZm9yIChjb25zdCBuYW1lIGluIHJ1bnRpbWVDb25maWcuZnJhbWV3b3Jrcykge1xuICAgICAgY29uc3QgZnJhbWV3b3JrID0gcnVudGltZUNvbmZpZy5mcmFtZXdvcmtzW25hbWVdXG4gICAgICBpZiAoZnJhbWV3b3JrICYmIGZyYW1ld29ya1ttZXRob2ROYW1lXSkge1xuICAgICAgICBmcmFtZXdvcmtbbWV0aG9kTmFtZV0oLi4uYXJncylcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdCAoY29uZmlnKSB7XG4gIHJ1bnRpbWVDb25maWcgPSBjb25maWcgfHwge31cbiAgZnJhbWV3b3JrcyA9IHJ1bnRpbWVDb25maWcuZnJhbWV3b3JrcyB8fCB7fVxuICBpbml0VGFza0hhbmRsZXIoKVxuXG4gIC8vIEluaXQgZWFjaCBmcmFtZXdvcmsgYnkgYGluaXRgIG1ldGhvZCBhbmQgYGNvbmZpZ2Agd2hpY2ggY29udGFpbnMgdGhyZWVcbiAgLy8gdmlydHVhbC1ET00gQ2xhc3M6IGBEb2N1bWVudGAsIGBFbGVtZW50YCAmIGBDb21tZW50YCwgYW5kIGEgSlMgYnJpZGdlIG1ldGhvZDpcbiAgLy8gYHNlbmRUYXNrcyguLi5hcmdzKWAuXG4gIGZvciAoY29uc3QgbmFtZSBpbiBmcmFtZXdvcmtzKSB7XG4gICAgY29uc3QgZnJhbWV3b3JrID0gZnJhbWV3b3Jrc1tuYW1lXVxuICAgIGlmICh0eXBlb2YgZnJhbWV3b3JrLmluaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZyYW1ld29yay5pbml0KGNvbmZpZylcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7fVxuICAgIH1cbiAgfVxuXG4gIGFkYXB0TWV0aG9kKCdyZWdpc3RlckNvbXBvbmVudHMnLCByZWdpc3RlckNvbXBvbmVudHMpXG4gIGFkYXB0TWV0aG9kKCdyZWdpc3Rlck1vZHVsZXMnLCByZWdpc3Rlck1vZHVsZXMpXG4gIGFkYXB0TWV0aG9kKCdyZWdpc3Rlck1ldGhvZHMnKVxuXG4gIDsgWydkZXN0cm95SW5zdGFuY2UnLCAncmVmcmVzaEluc3RhbmNlJ10uZm9yRWFjaChnZW5JbnN0YW5jZSlcblxuICByZXR1cm4gbWV0aG9kc1xufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBOb2RlIGZyb20gJy4vTm9kZSdcbmltcG9ydCBFbGVtZW50IGZyb20gJy4vRWxlbWVudCdcbmltcG9ydCBDb21tZW50IGZyb20gJy4vQ29tbWVudCdcbmltcG9ydCBEb2N1bWVudCBmcm9tICcuL0RvY3VtZW50J1xuXG5leHBvcnQge1xuICByZWdpc3RlckVsZW1lbnQsXG4gIHVucmVnaXN0ZXJFbGVtZW50LFxuICBpc1dlZXhFbGVtZW50LFxuICBjbGVhcldlZXhFbGVtZW50c1xufSBmcm9tICcuL1dlZXhFbGVtZW50J1xuXG5leHBvcnQge1xuICBEb2N1bWVudCxcbiAgTm9kZSxcbiAgRWxlbWVudCxcbiAgQ29tbWVudFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IERvY3VtZW50LCBFbGVtZW50LCBDb21tZW50IH0gZnJvbSAnLi4vdmRvbSdcbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuLi9icmlkZ2UvTGlzdGVuZXInXG5pbXBvcnQgeyBUYXNrQ2VudGVyIH0gZnJvbSAnLi4vYnJpZGdlL1Rhc2tDZW50ZXInXG5cbmNvbnN0IGNvbmZpZyA9IHtcbiAgRG9jdW1lbnQsIEVsZW1lbnQsIENvbW1lbnQsIExpc3RlbmVyLFxuICBUYXNrQ2VudGVyLFxuICBzZW5kVGFza3MgKC4uLmFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIGNhbGxOYXRpdmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBjYWxsTmF0aXZlKC4uLmFyZ3MpXG4gICAgfVxuICAgIHJldHVybiAoZ2xvYmFsLmNhbGxOYXRpdmUgfHwgKCgpID0+IHt9KSkoLi4uYXJncylcbiAgfVxufVxuXG5Eb2N1bWVudC5oYW5kbGVyID0gY29uZmlnLnNlbmRUYXNrc1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWdcbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgaW5pdCBmcm9tICcuL2luaXQnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHsgcmVnaXN0ZXIsIHVucmVnaXN0ZXIsIGhhcyB9IGZyb20gJy4vc2VydmljZSdcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIGZyZWV6ZVByb3RvdHlwZSAoKSB7XG4gIC8vIE9iamVjdC5mcmVlemUoY29uZmlnLkVsZW1lbnQpXG4gIE9iamVjdC5mcmVlemUoY29uZmlnLkNvbW1lbnQpXG4gIE9iamVjdC5mcmVlemUoY29uZmlnLkxpc3RlbmVyKVxuICBPYmplY3QuZnJlZXplKGNvbmZpZy5Eb2N1bWVudC5wcm90b3R5cGUpXG4gIC8vIE9iamVjdC5mcmVlemUoY29uZmlnLkVsZW1lbnQucHJvdG90eXBlKVxuICBPYmplY3QuZnJlZXplKGNvbmZpZy5Db21tZW50LnByb3RvdHlwZSlcbiAgT2JqZWN0LmZyZWV6ZShjb25maWcuTGlzdGVuZXIucHJvdG90eXBlKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHNlcnZpY2U6IHsgcmVnaXN0ZXIsIHVucmVnaXN0ZXIsIGhhcyB9LFxuICBmcmVlemVQcm90b3R5cGUsXG4gIGluaXQsXG4gIGNvbmZpZ1xufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogTW9jayBNZXNzYWdlRXZlbnQgdHlwZVxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBkaWN0IHsgZGF0YSwgb3JpZ2luLCBzb3VyY2UsIHBvcnRzIH1cbiAqXG4gKiBUaGlzIHR5cGUgaGFzIGJlZW4gc2ltcGxpZmllZC5cbiAqIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2NvbW1zLmh0bWwjbWVzc2FnZWV2ZW50XG4gKiBodHRwczovL2RvbS5zcGVjLndoYXR3Zy5vcmcvI2ludGVyZmFjZS1ldmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gTWVzc2FnZUV2ZW50ICh0eXBlLCBkaWN0ID0ge30pIHtcbiAgdGhpcy50eXBlID0gdHlwZSB8fCAnbWVzc2FnZSdcblxuICB0aGlzLmRhdGEgPSBkaWN0LmRhdGEgfHwgbnVsbFxuICB0aGlzLm9yaWdpbiA9IGRpY3Qub3JpZ2luIHx8ICcnXG4gIHRoaXMuc291cmNlID0gZGljdC5zb3VyY2UgfHwgbnVsbFxuICB0aGlzLnBvcnRzID0gZGljdC5wb3J0cyB8fCBbXVxuXG4gIC8vIGluaGVyaXQgcHJvcGVydGllc1xuICB0aGlzLnRhcmdldCA9IG51bGxcbiAgdGhpcy50aW1lU3RhbXAgPSBEYXRlLm5vdygpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBUaGUgcG9seWZpbGwgb2YgQnJvYWRjYXN0Q2hhbm5lbCBBUEkuXG4gKiBUaGlzIGFwaSBjYW4gYmUgdXNlZCB0byBhY2hpZXZlIGludGVyLWluc3RhbmNlIGNvbW11bmljYXRpb25zLlxuICpcbiAqIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2NvbW1zLmh0bWwjYnJvYWRjYXN0aW5nLXRvLW90aGVyLWJyb3dzaW5nLWNvbnRleHRzXG4gKi9cblxuaW1wb3J0IHsgTWVzc2FnZUV2ZW50IH0gZnJvbSAnLi9tZXNzYWdlLWV2ZW50J1xuXG5jb25zdCBjaGFubmVscyA9IHt9XG5jb25zdCBpbnN0YW5jZXMgPSB7fVxuXG4vKipcbiAqIEFuIGVtcHR5IGNvbnN0cnVjdG9yIGZvciBCcm9hZGNhc3RDaGFubmVsIHBvbHlmaWxsLlxuICogVGhlIHJlYWwgY29uc3RydWN0b3Igd2lsbCBiZSBkZWZpbmVkIHdoZW4gYSBXZWV4IGluc3RhbmNlIGNyZWF0ZWQgYmVjYXVzZVxuICogd2UgbmVlZCB0byB0cmFjayB0aGUgY2hhbm5lbCBieSBXZWV4IGluc3RhbmNlIGlkLlxuICovXG5mdW5jdGlvbiBCcm9hZGNhc3RDaGFubmVsICgpIHt9XG5cbi8qKlxuICogU2VuZHMgdGhlIGdpdmVuIG1lc3NhZ2UgdG8gb3RoZXIgQnJvYWRjYXN0Q2hhbm5lbCBvYmplY3RzIHNldCB1cCBmb3IgdGhpcyBjaGFubmVsLlxuICogQHBhcmFtIHthbnl9IG1lc3NhZ2VcbiAqL1xuQnJvYWRjYXN0Q2hhbm5lbC5wcm90b3R5cGUucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBCcm9hZGNhc3RDaGFubmVsIFwiJHt0aGlzLm5hbWV9XCIgaXMgY2xvc2VkLmApXG4gIH1cblxuICBjb25zdCBzdWJzY3JpYmVycyA9IGNoYW5uZWxzW3RoaXMubmFtZV1cbiAgaWYgKHN1YnNjcmliZXJzICYmIHN1YnNjcmliZXJzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGNvbnN0IG1lbWJlciA9IHN1YnNjcmliZXJzW2ldXG5cbiAgICAgIGlmIChtZW1iZXIuX2Nsb3NlZCB8fCBtZW1iZXIgPT09IHRoaXMpIGNvbnRpbnVlXG5cbiAgICAgIGlmICh0eXBlb2YgbWVtYmVyLm9ubWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBtZW1iZXIub25tZXNzYWdlKG5ldyBNZXNzYWdlRXZlbnQoJ21lc3NhZ2UnLCB7IGRhdGE6IG1lc3NhZ2UgfSkpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2xvc2VzIHRoZSBCcm9hZGNhc3RDaGFubmVsIG9iamVjdCwgb3BlbmluZyBpdCB1cCB0byBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gKi9cbkJyb2FkY2FzdENoYW5uZWwucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB0aGlzLl9jbG9zZWQgPSB0cnVlXG5cbiAgLy8gcmVtb3ZlIGl0c2VsZiBmcm9tIGNoYW5uZWxzLlxuICBpZiAoY2hhbm5lbHNbdGhpcy5uYW1lXSkge1xuICAgIGNvbnN0IHN1YnNjcmliZXJzID0gY2hhbm5lbHNbdGhpcy5uYW1lXS5maWx0ZXIoeCA9PiB4ICE9PSB0aGlzKVxuICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGgpIHtcbiAgICAgIGNoYW5uZWxzW3RoaXMubmFtZV0gPSBzdWJzY3JpYmVyc1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjaGFubmVsc1t0aGlzLm5hbWVdXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgY3JlYXRlOiAoaWQsIGVudiwgY29uZmlnKSA9PiB7XG4gICAgaW5zdGFuY2VzW2lkXSA9IFtdXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwuQnJvYWRjYXN0Q2hhbm5lbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHt9XG4gICAgfVxuICAgIGNvbnN0IHNlcnZpY2VPYmplY3QgPSB7XG4gICAgICAvKipcbiAgICAgICAqIFJldHVybnMgYSBuZXcgQnJvYWRjYXN0Q2hhbm5lbCBvYmplY3QgdmlhIHdoaWNoIG1lc3NhZ2VzIGZvciB0aGUgZ2l2ZW5cbiAgICAgICAqIGNoYW5uZWwgbmFtZSBjYW4gYmUgc2VudCBhbmQgcmVjZWl2ZWQuXG4gICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAgICovXG4gICAgICBCcm9hZGNhc3RDaGFubmVsOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAvLyB0aGUgbmFtZSBwcm9wZXJ0eSBpcyByZWFkb25seVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ25hbWUnLCB7XG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogU3RyaW5nKG5hbWUpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcbiAgICAgICAgdGhpcy5vbm1lc3NhZ2UgPSBudWxsXG5cbiAgICAgICAgaWYgKCFjaGFubmVsc1t0aGlzLm5hbWVdKSB7XG4gICAgICAgICAgY2hhbm5lbHNbdGhpcy5uYW1lXSA9IFtdXG4gICAgICAgIH1cbiAgICAgICAgY2hhbm5lbHNbdGhpcy5uYW1lXS5wdXNoKHRoaXMpXG4gICAgICAgIGluc3RhbmNlc1tpZF0ucHVzaCh0aGlzKVxuICAgICAgfVxuICAgIH1cbiAgICBzZXJ2aWNlT2JqZWN0LkJyb2FkY2FzdENoYW5uZWwucHJvdG90eXBlID0gQnJvYWRjYXN0Q2hhbm5lbC5wcm90b3R5cGVcbiAgICByZXR1cm4ge1xuICAgICAgaW5zdGFuY2U6IHNlcnZpY2VPYmplY3RcbiAgICB9XG4gIH0sXG4gIGRlc3Ryb3k6IChpZCwgZW52KSA9PiB7XG4gICAgaW5zdGFuY2VzW2lkXS5mb3JFYWNoKGNoYW5uZWwgPT4gY2hhbm5lbC5jbG9zZSgpKVxuICAgIGRlbGV0ZSBpbnN0YW5jZXNbaWRdXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IEJyb2FkY2FzdENoYW5uZWwgZnJvbSAnLi9icm9hZGNhc3QtY2hhbm5lbC9pbmRleCdcblxuZXhwb3J0IGRlZmF1bHQge1xuICBCcm9hZGNhc3RDaGFubmVsXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgc3VidmVyc2lvbiB9IGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbidcbmltcG9ydCBydW50aW1lIGZyb20gJy4uL2FwaSdcbmltcG9ydCBzZXJ2aWNlcyBmcm9tICcuLi9zZXJ2aWNlcydcblxuLyoqXG4gKiBTZXR1cCBmcmFtZXdvcmtzIHdpdGggcnVudGltZS5cbiAqIFlvdSBjYW4gcGFja2FnZSBtb3JlIGZyYW1ld29ya3MgYnlcbiAqICBwYXNzaW5nIHRoZW0gYXMgYXJndW1lbnRzLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoZnJhbWV3b3Jrcykge1xuICBjb25zdCB7IGluaXQsIGNvbmZpZyB9ID0gcnVudGltZVxuICBjb25maWcuZnJhbWV3b3JrcyA9IGZyYW1ld29ya3NcbiAgY29uc3QgeyBuYXRpdmUsIHRyYW5zZm9ybWVyIH0gPSBzdWJ2ZXJzaW9uXG5cbiAgZm9yIChjb25zdCBzZXJ2aWNlTmFtZSBpbiBzZXJ2aWNlcykge1xuICAgIHJ1bnRpbWUuc2VydmljZS5yZWdpc3RlcihzZXJ2aWNlTmFtZSwgc2VydmljZXNbc2VydmljZU5hbWVdKVxuICB9XG5cbiAgcnVudGltZS5mcmVlemVQcm90b3R5cGUoKVxuXG4gIC8vIHJlZ2lzdGVyIGZyYW1ld29yayBtZXRhIGluZm9cbiAgZ2xvYmFsLmZyYW1ld29ya1ZlcnNpb24gPSBuYXRpdmVcbiAgZ2xvYmFsLnRyYW5zZm9ybWVyVmVyc2lvbiA9IHRyYW5zZm9ybWVyXG5cbiAgLy8gaW5pdCBmcmFtZXdvcmtzXG4gIGNvbnN0IGdsb2JhbE1ldGhvZHMgPSBpbml0KGNvbmZpZylcblxuICAvLyBzZXQgZ2xvYmFsIG1ldGhvZHNcbiAgZm9yIChjb25zdCBtZXRob2ROYW1lIGluIGdsb2JhbE1ldGhvZHMpIHtcbiAgICBnbG9iYWxbbWV0aG9kTmFtZV0gPSAoLi4uYXJncykgPT4ge1xuICAgICAgY29uc3QgcmV0ID0gZ2xvYmFsTWV0aG9kc1ttZXRob2ROYW1lXSguLi5hcmdzKVxuICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IocmV0LnRvU3RyaW5nKCkpXG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0XG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gd2VleEZhY3RvcnkgKGV4cG9ydHMsIGRvY3VtZW50KSB7XG5cbi8qICAqL1xuXG52YXIgZW1wdHlPYmplY3QgPSBPYmplY3QuZnJlZXplKHt9KTtcblxuLy8gdGhlc2UgaGVscGVycyBwcm9kdWNlcyBiZXR0ZXIgdm0gY29kZSBpbiBKUyBlbmdpbmVzIGR1ZSB0byB0aGVpclxuLy8gZXhwbGljaXRuZXNzIGFuZCBmdW5jdGlvbiBpbmxpbmluZ1xuZnVuY3Rpb24gaXNVbmRlZiAodikge1xuICByZXR1cm4gdiA9PT0gdW5kZWZpbmVkIHx8IHYgPT09IG51bGxcbn1cblxuZnVuY3Rpb24gaXNEZWYgKHYpIHtcbiAgcmV0dXJuIHYgIT09IHVuZGVmaW5lZCAmJiB2ICE9PSBudWxsXG59XG5cbmZ1bmN0aW9uIGlzVHJ1ZSAodikge1xuICByZXR1cm4gdiA9PT0gdHJ1ZVxufVxuXG5mdW5jdGlvbiBpc0ZhbHNlICh2KSB7XG4gIHJldHVybiB2ID09PSBmYWxzZVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHZhbHVlIGlzIHByaW1pdGl2ZVxuICovXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZSAodmFsdWUpIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8XG4gICAgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyB8fFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nXG4gIClcbn1cblxuLyoqXG4gKiBRdWljayBvYmplY3QgY2hlY2sgLSB0aGlzIGlzIHByaW1hcmlseSB1c2VkIHRvIHRlbGxcbiAqIE9iamVjdHMgZnJvbSBwcmltaXRpdmUgdmFsdWVzIHdoZW4gd2Uga25vdyB0aGUgdmFsdWVcbiAqIGlzIGEgSlNPTi1jb21wbGlhbnQgdHlwZS5cbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QgKG9iaikge1xuICByZXR1cm4gb2JqICE9PSBudWxsICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnXG59XG5cbi8qKlxuICogR2V0IHRoZSByYXcgdHlwZSBzdHJpbmcgb2YgYSB2YWx1ZSBlLmcuIFtvYmplY3QgT2JqZWN0XVxuICovXG52YXIgX3RvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuZnVuY3Rpb24gdG9SYXdUeXBlICh2YWx1ZSkge1xuICByZXR1cm4gX3RvU3RyaW5nLmNhbGwodmFsdWUpLnNsaWNlKDgsIC0xKVxufVxuXG4vKipcbiAqIFN0cmljdCBvYmplY3QgdHlwZSBjaGVjay4gT25seSByZXR1cm5zIHRydWVcbiAqIGZvciBwbGFpbiBKYXZhU2NyaXB0IG9iamVjdHMuXG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QgKG9iaikge1xuICByZXR1cm4gX3RvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSdcbn1cblxuZnVuY3Rpb24gaXNSZWdFeHAgKHYpIHtcbiAgcmV0dXJuIF90b1N0cmluZy5jYWxsKHYpID09PSAnW29iamVjdCBSZWdFeHBdJ1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHZhbCBpcyBhIHZhbGlkIGFycmF5IGluZGV4LlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkQXJyYXlJbmRleCAodmFsKSB7XG4gIHZhciBuID0gcGFyc2VGbG9hdChTdHJpbmcodmFsKSk7XG4gIHJldHVybiBuID49IDAgJiYgTWF0aC5mbG9vcihuKSA9PT0gbiAmJiBpc0Zpbml0ZSh2YWwpXG59XG5cbi8qKlxuICogQ29udmVydCBhIHZhbHVlIHRvIGEgc3RyaW5nIHRoYXQgaXMgYWN0dWFsbHkgcmVuZGVyZWQuXG4gKi9cbmZ1bmN0aW9uIHRvU3RyaW5nICh2YWwpIHtcbiAgcmV0dXJuIHZhbCA9PSBudWxsXG4gICAgPyAnJ1xuICAgIDogdHlwZW9mIHZhbCA9PT0gJ29iamVjdCdcbiAgICAgID8gSlNPTi5zdHJpbmdpZnkodmFsLCBudWxsLCAyKVxuICAgICAgOiBTdHJpbmcodmFsKVxufVxuXG4vKipcbiAqIENvbnZlcnQgYSBpbnB1dCB2YWx1ZSB0byBhIG51bWJlciBmb3IgcGVyc2lzdGVuY2UuXG4gKiBJZiB0aGUgY29udmVyc2lvbiBmYWlscywgcmV0dXJuIG9yaWdpbmFsIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gdG9OdW1iZXIgKHZhbCkge1xuICB2YXIgbiA9IHBhcnNlRmxvYXQodmFsKTtcbiAgcmV0dXJuIGlzTmFOKG4pID8gdmFsIDogblxufVxuXG4vKipcbiAqIE1ha2UgYSBtYXAgYW5kIHJldHVybiBhIGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhIGtleVxuICogaXMgaW4gdGhhdCBtYXAuXG4gKi9cbmZ1bmN0aW9uIG1ha2VNYXAgKFxuICBzdHIsXG4gIGV4cGVjdHNMb3dlckNhc2Vcbikge1xuICB2YXIgbWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdmFyIGxpc3QgPSBzdHIuc3BsaXQoJywnKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgbWFwW2xpc3RbaV1dID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZXhwZWN0c0xvd2VyQ2FzZVxuICAgID8gZnVuY3Rpb24gKHZhbCkgeyByZXR1cm4gbWFwW3ZhbC50b0xvd2VyQ2FzZSgpXTsgfVxuICAgIDogZnVuY3Rpb24gKHZhbCkgeyByZXR1cm4gbWFwW3ZhbF07IH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIHRhZyBpcyBhIGJ1aWx0LWluIHRhZy5cbiAqL1xudmFyIGlzQnVpbHRJblRhZyA9IG1ha2VNYXAoJ3Nsb3QsY29tcG9uZW50JywgdHJ1ZSk7XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBhdHRyaWJ1dGUgaXMgYSByZXNlcnZlZCBhdHRyaWJ1dGUuXG4gKi9cbnZhciBpc1Jlc2VydmVkQXR0cmlidXRlID0gbWFrZU1hcCgna2V5LHJlZixzbG90LHNsb3Qtc2NvcGUsaXMnKTtcblxuLyoqXG4gKiBSZW1vdmUgYW4gaXRlbSBmcm9tIGFuIGFycmF5XG4gKi9cbmZ1bmN0aW9uIHJlbW92ZSAoYXJyLCBpdGVtKSB7XG4gIGlmIChhcnIubGVuZ3RoKSB7XG4gICAgdmFyIGluZGV4ID0gYXJyLmluZGV4T2YoaXRlbSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHJldHVybiBhcnIuc3BsaWNlKGluZGV4LCAxKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIG9iamVjdCBoYXMgdGhlIHByb3BlcnR5LlxuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuZnVuY3Rpb24gaGFzT3duIChvYmosIGtleSkge1xuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSlcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBjYWNoZWQgdmVyc2lvbiBvZiBhIHB1cmUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNhY2hlZCAoZm4pIHtcbiAgdmFyIGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgcmV0dXJuIChmdW5jdGlvbiBjYWNoZWRGbiAoc3RyKSB7XG4gICAgdmFyIGhpdCA9IGNhY2hlW3N0cl07XG4gICAgcmV0dXJuIGhpdCB8fCAoY2FjaGVbc3RyXSA9IGZuKHN0cikpXG4gIH0pXG59XG5cbi8qKlxuICogQ2FtZWxpemUgYSBoeXBoZW4tZGVsaW1pdGVkIHN0cmluZy5cbiAqL1xudmFyIGNhbWVsaXplUkUgPSAvLShcXHcpL2c7XG52YXIgY2FtZWxpemUgPSBjYWNoZWQoZnVuY3Rpb24gKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoY2FtZWxpemVSRSwgZnVuY3Rpb24gKF8sIGMpIHsgcmV0dXJuIGMgPyBjLnRvVXBwZXJDYXNlKCkgOiAnJzsgfSlcbn0pO1xuXG4vKipcbiAqIENhcGl0YWxpemUgYSBzdHJpbmcuXG4gKi9cbnZhciBjYXBpdGFsaXplID0gY2FjaGVkKGZ1bmN0aW9uIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKVxufSk7XG5cbi8qKlxuICogSHlwaGVuYXRlIGEgY2FtZWxDYXNlIHN0cmluZy5cbiAqL1xudmFyIGh5cGhlbmF0ZVJFID0gL1xcQihbQS1aXSkvZztcbnZhciBoeXBoZW5hdGUgPSBjYWNoZWQoZnVuY3Rpb24gKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoaHlwaGVuYXRlUkUsICctJDEnKS50b0xvd2VyQ2FzZSgpXG59KTtcblxuLyoqXG4gKiBTaW1wbGUgYmluZCwgZmFzdGVyIHRoYW4gbmF0aXZlXG4gKi9cbmZ1bmN0aW9uIGJpbmQgKGZuLCBjdHgpIHtcbiAgZnVuY3Rpb24gYm91bmRGbiAoYSkge1xuICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICByZXR1cm4gbFxuICAgICAgPyBsID4gMVxuICAgICAgICA/IGZuLmFwcGx5KGN0eCwgYXJndW1lbnRzKVxuICAgICAgICA6IGZuLmNhbGwoY3R4LCBhKVxuICAgICAgOiBmbi5jYWxsKGN0eClcbiAgfVxuICAvLyByZWNvcmQgb3JpZ2luYWwgZm4gbGVuZ3RoXG4gIGJvdW5kRm4uX2xlbmd0aCA9IGZuLmxlbmd0aDtcbiAgcmV0dXJuIGJvdW5kRm5cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGFuIEFycmF5LWxpa2Ugb2JqZWN0IHRvIGEgcmVhbCBBcnJheS5cbiAqL1xuZnVuY3Rpb24gdG9BcnJheSAobGlzdCwgc3RhcnQpIHtcbiAgc3RhcnQgPSBzdGFydCB8fCAwO1xuICB2YXIgaSA9IGxpc3QubGVuZ3RoIC0gc3RhcnQ7XG4gIHZhciByZXQgPSBuZXcgQXJyYXkoaSk7XG4gIHdoaWxlIChpLS0pIHtcbiAgICByZXRbaV0gPSBsaXN0W2kgKyBzdGFydF07XG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG4vKipcbiAqIE1peCBwcm9wZXJ0aWVzIGludG8gdGFyZ2V0IG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gZXh0ZW5kICh0bywgX2Zyb20pIHtcbiAgZm9yICh2YXIga2V5IGluIF9mcm9tKSB7XG4gICAgdG9ba2V5XSA9IF9mcm9tW2tleV07XG4gIH1cbiAgcmV0dXJuIHRvXG59XG5cbi8qKlxuICogTWVyZ2UgYW4gQXJyYXkgb2YgT2JqZWN0cyBpbnRvIGEgc2luZ2xlIE9iamVjdC5cbiAqL1xuZnVuY3Rpb24gdG9PYmplY3QgKGFycikge1xuICB2YXIgcmVzID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGFycltpXSkge1xuICAgICAgZXh0ZW5kKHJlcywgYXJyW2ldKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG4vKipcbiAqIFBlcmZvcm0gbm8gb3BlcmF0aW9uLlxuICogU3R1YmJpbmcgYXJncyB0byBtYWtlIEZsb3cgaGFwcHkgd2l0aG91dCBsZWF2aW5nIHVzZWxlc3MgdHJhbnNwaWxlZCBjb2RlXG4gKiB3aXRoIC4uLnJlc3QgKGh0dHBzOi8vZmxvdy5vcmcvYmxvZy8yMDE3LzA1LzA3L1N0cmljdC1GdW5jdGlvbi1DYWxsLUFyaXR5LylcbiAqL1xuZnVuY3Rpb24gbm9vcCAoYSwgYiwgYykge31cblxuLyoqXG4gKiBBbHdheXMgcmV0dXJuIGZhbHNlLlxuICovXG52YXIgbm8gPSBmdW5jdGlvbiAoYSwgYiwgYykgeyByZXR1cm4gZmFsc2U7IH07XG5cbi8qKlxuICogUmV0dXJuIHNhbWUgdmFsdWVcbiAqL1xudmFyIGlkZW50aXR5ID0gZnVuY3Rpb24gKF8pIHsgcmV0dXJuIF87IH07XG5cbi8qKlxuICogR2VuZXJhdGUgYSBzdGF0aWMga2V5cyBzdHJpbmcgZnJvbSBjb21waWxlciBtb2R1bGVzLlxuICovXG5cblxuLyoqXG4gKiBDaGVjayBpZiB0d28gdmFsdWVzIGFyZSBsb29zZWx5IGVxdWFsIC0gdGhhdCBpcyxcbiAqIGlmIHRoZXkgYXJlIHBsYWluIG9iamVjdHMsIGRvIHRoZXkgaGF2ZSB0aGUgc2FtZSBzaGFwZT9cbiAqL1xuZnVuY3Rpb24gbG9vc2VFcXVhbCAoYSwgYikge1xuICBpZiAoYSA9PT0gYikgeyByZXR1cm4gdHJ1ZSB9XG4gIHZhciBpc09iamVjdEEgPSBpc09iamVjdChhKTtcbiAgdmFyIGlzT2JqZWN0QiA9IGlzT2JqZWN0KGIpO1xuICBpZiAoaXNPYmplY3RBICYmIGlzT2JqZWN0Qikge1xuICAgIHRyeSB7XG4gICAgICB2YXIgaXNBcnJheUEgPSBBcnJheS5pc0FycmF5KGEpO1xuICAgICAgdmFyIGlzQXJyYXlCID0gQXJyYXkuaXNBcnJheShiKTtcbiAgICAgIGlmIChpc0FycmF5QSAmJiBpc0FycmF5Qikge1xuICAgICAgICByZXR1cm4gYS5sZW5ndGggPT09IGIubGVuZ3RoICYmIGEuZXZlcnkoZnVuY3Rpb24gKGUsIGkpIHtcbiAgICAgICAgICByZXR1cm4gbG9vc2VFcXVhbChlLCBiW2ldKVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIGlmICghaXNBcnJheUEgJiYgIWlzQXJyYXlCKSB7XG4gICAgICAgIHZhciBrZXlzQSA9IE9iamVjdC5rZXlzKGEpO1xuICAgICAgICB2YXIga2V5c0IgPSBPYmplY3Qua2V5cyhiKTtcbiAgICAgICAgcmV0dXJuIGtleXNBLmxlbmd0aCA9PT0ga2V5c0IubGVuZ3RoICYmIGtleXNBLmV2ZXJ5KGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4gbG9vc2VFcXVhbChhW2tleV0sIGJba2V5XSlcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH0gZWxzZSBpZiAoIWlzT2JqZWN0QSAmJiAhaXNPYmplY3RCKSB7XG4gICAgcmV0dXJuIFN0cmluZyhhKSA9PT0gU3RyaW5nKGIpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuZnVuY3Rpb24gbG9vc2VJbmRleE9mIChhcnIsIHZhbCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChsb29zZUVxdWFsKGFycltpXSwgdmFsKSkgeyByZXR1cm4gaSB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbi8qKlxuICogRW5zdXJlIGEgZnVuY3Rpb24gaXMgY2FsbGVkIG9ubHkgb25jZS5cbiAqL1xuZnVuY3Rpb24gb25jZSAoZm4pIHtcbiAgdmFyIGNhbGxlZCA9IGZhbHNlO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmICghY2FsbGVkKSB7XG4gICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cbn1cblxudmFyIFNTUl9BVFRSID0gJ2RhdGEtc2VydmVyLXJlbmRlcmVkJztcblxudmFyIEFTU0VUX1RZUEVTID0gW1xuICAnY29tcG9uZW50JyxcbiAgJ2RpcmVjdGl2ZScsXG4gICdmaWx0ZXInXG5dO1xuXG52YXIgTElGRUNZQ0xFX0hPT0tTID0gW1xuICAnYmVmb3JlQ3JlYXRlJyxcbiAgJ2NyZWF0ZWQnLFxuICAnYmVmb3JlTW91bnQnLFxuICAnbW91bnRlZCcsXG4gICdiZWZvcmVVcGRhdGUnLFxuICAndXBkYXRlZCcsXG4gICdiZWZvcmVEZXN0cm95JyxcbiAgJ2Rlc3Ryb3llZCcsXG4gICdhY3RpdmF0ZWQnLFxuICAnZGVhY3RpdmF0ZWQnLFxuICAnZXJyb3JDYXB0dXJlZCdcbl07XG5cbi8qICAqL1xuXG52YXIgY29uZmlnID0gKHtcbiAgLyoqXG4gICAqIE9wdGlvbiBtZXJnZSBzdHJhdGVnaWVzICh1c2VkIGluIGNvcmUvdXRpbC9vcHRpb25zKVxuICAgKi9cbiAgLy8gJGZsb3ctZGlzYWJsZS1saW5lXG4gIG9wdGlvbk1lcmdlU3RyYXRlZ2llczogT2JqZWN0LmNyZWF0ZShudWxsKSxcblxuICAvKipcbiAgICogV2hldGhlciB0byBzdXBwcmVzcyB3YXJuaW5ncy5cbiAgICovXG4gIHNpbGVudDogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNob3cgcHJvZHVjdGlvbiBtb2RlIHRpcCBtZXNzYWdlIG9uIGJvb3Q/XG4gICAqL1xuICBwcm9kdWN0aW9uVGlwOiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGVuYWJsZSBkZXZ0b29sc1xuICAgKi9cbiAgZGV2dG9vbHM6IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gcmVjb3JkIHBlcmZcbiAgICovXG4gIHBlcmZvcm1hbmNlOiBmYWxzZSxcblxuICAvKipcbiAgICogRXJyb3IgaGFuZGxlciBmb3Igd2F0Y2hlciBlcnJvcnNcbiAgICovXG4gIGVycm9ySGFuZGxlcjogbnVsbCxcblxuICAvKipcbiAgICogV2FybiBoYW5kbGVyIGZvciB3YXRjaGVyIHdhcm5zXG4gICAqL1xuICB3YXJuSGFuZGxlcjogbnVsbCxcblxuICAvKipcbiAgICogSWdub3JlIGNlcnRhaW4gY3VzdG9tIGVsZW1lbnRzXG4gICAqL1xuICBpZ25vcmVkRWxlbWVudHM6IFtdLFxuXG4gIC8qKlxuICAgKiBDdXN0b20gdXNlciBrZXkgYWxpYXNlcyBmb3Igdi1vblxuICAgKi9cbiAgLy8gJGZsb3ctZGlzYWJsZS1saW5lXG4gIGtleUNvZGVzOiBPYmplY3QuY3JlYXRlKG51bGwpLFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHRhZyBpcyByZXNlcnZlZCBzbyB0aGF0IGl0IGNhbm5vdCBiZSByZWdpc3RlcmVkIGFzIGFcbiAgICogY29tcG9uZW50LiBUaGlzIGlzIHBsYXRmb3JtLWRlcGVuZGVudCBhbmQgbWF5IGJlIG92ZXJ3cml0dGVuLlxuICAgKi9cbiAgaXNSZXNlcnZlZFRhZzogbm8sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGFuIGF0dHJpYnV0ZSBpcyByZXNlcnZlZCBzbyB0aGF0IGl0IGNhbm5vdCBiZSB1c2VkIGFzIGEgY29tcG9uZW50XG4gICAqIHByb3AuIFRoaXMgaXMgcGxhdGZvcm0tZGVwZW5kZW50IGFuZCBtYXkgYmUgb3ZlcndyaXR0ZW4uXG4gICAqL1xuICBpc1Jlc2VydmVkQXR0cjogbm8sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgdGFnIGlzIGFuIHVua25vd24gZWxlbWVudC5cbiAgICogUGxhdGZvcm0tZGVwZW5kZW50LlxuICAgKi9cbiAgaXNVbmtub3duRWxlbWVudDogbm8sXG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbmFtZXNwYWNlIG9mIGFuIGVsZW1lbnRcbiAgICovXG4gIGdldFRhZ05hbWVzcGFjZTogbm9vcCxcblxuICAvKipcbiAgICogUGFyc2UgdGhlIHJlYWwgdGFnIG5hbWUgZm9yIHRoZSBzcGVjaWZpYyBwbGF0Zm9ybS5cbiAgICovXG4gIHBhcnNlUGxhdGZvcm1UYWdOYW1lOiBpZGVudGl0eSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgYW4gYXR0cmlidXRlIG11c3QgYmUgYm91bmQgdXNpbmcgcHJvcGVydHksIGUuZy4gdmFsdWVcbiAgICogUGxhdGZvcm0tZGVwZW5kZW50LlxuICAgKi9cbiAgbXVzdFVzZVByb3A6IG5vLFxuXG4gIC8qKlxuICAgKiBFeHBvc2VkIGZvciBsZWdhY3kgcmVhc29uc1xuICAgKi9cbiAgX2xpZmVjeWNsZUhvb2tzOiBMSUZFQ1lDTEVfSE9PS1Ncbn0pO1xuXG4vKiAgKi9cblxuLyoqXG4gKiBDaGVjayBpZiBhIHN0cmluZyBzdGFydHMgd2l0aCAkIG9yIF9cbiAqL1xuZnVuY3Rpb24gaXNSZXNlcnZlZCAoc3RyKSB7XG4gIHZhciBjID0gKHN0ciArICcnKS5jaGFyQ29kZUF0KDApO1xuICByZXR1cm4gYyA9PT0gMHgyNCB8fCBjID09PSAweDVGXG59XG5cbi8qKlxuICogRGVmaW5lIGEgcHJvcGVydHkuXG4gKi9cbmZ1bmN0aW9uIGRlZiAob2JqLCBrZXksIHZhbCwgZW51bWVyYWJsZSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHtcbiAgICB2YWx1ZTogdmFsLFxuICAgIGVudW1lcmFibGU6ICEhZW51bWVyYWJsZSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSk7XG59XG5cbi8qKlxuICogUGFyc2Ugc2ltcGxlIHBhdGguXG4gKi9cbnZhciBiYWlsUkUgPSAvW15cXHcuJF0vO1xuZnVuY3Rpb24gcGFyc2VQYXRoIChwYXRoKSB7XG4gIGlmIChiYWlsUkUudGVzdChwYXRoKSkge1xuICAgIHJldHVyblxuICB9XG4gIHZhciBzZWdtZW50cyA9IHBhdGguc3BsaXQoJy4nKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIW9iaikgeyByZXR1cm4gfVxuICAgICAgb2JqID0gb2JqW3NlZ21lbnRzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIG9ialxuICB9XG59XG5cbi8qICAqL1xuXG5cbi8vIGNhbiB3ZSB1c2UgX19wcm90b19fP1xudmFyIGhhc1Byb3RvID0gJ19fcHJvdG9fXycgaW4ge307XG5cbi8vIEJyb3dzZXIgZW52aXJvbm1lbnQgc25pZmZpbmdcbnZhciBpbkJyb3dzZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbnZhciBpbldlZXggPSB0eXBlb2YgV1hFbnZpcm9ubWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgISFXWEVudmlyb25tZW50LnBsYXRmb3JtO1xudmFyIHdlZXhQbGF0Zm9ybSA9IGluV2VleCAmJiBXWEVudmlyb25tZW50LnBsYXRmb3JtLnRvTG93ZXJDYXNlKCk7XG52YXIgVUEgPSBpbkJyb3dzZXIgJiYgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKTtcbnZhciBpc0lFID0gVUEgJiYgL21zaWV8dHJpZGVudC8udGVzdChVQSk7XG52YXIgaXNJRTkgPSBVQSAmJiBVQS5pbmRleE9mKCdtc2llIDkuMCcpID4gMDtcbnZhciBpc0VkZ2UgPSBVQSAmJiBVQS5pbmRleE9mKCdlZGdlLycpID4gMDtcbnZhciBpc0FuZHJvaWQgPSAoVUEgJiYgVUEuaW5kZXhPZignYW5kcm9pZCcpID4gMCkgfHwgKHdlZXhQbGF0Zm9ybSA9PT0gJ2FuZHJvaWQnKTtcbnZhciBpc0lPUyA9IChVQSAmJiAvaXBob25lfGlwYWR8aXBvZHxpb3MvLnRlc3QoVUEpKSB8fCAod2VleFBsYXRmb3JtID09PSAnaW9zJyk7XG52YXIgaXNDaHJvbWUgPSBVQSAmJiAvY2hyb21lXFwvXFxkKy8udGVzdChVQSkgJiYgIWlzRWRnZTtcblxuLy8gRmlyZWZveCBoYXMgYSBcIndhdGNoXCIgZnVuY3Rpb24gb24gT2JqZWN0LnByb3RvdHlwZS4uLlxudmFyIG5hdGl2ZVdhdGNoID0gKHt9KS53YXRjaDtcblxuXG5pZiAoaW5Ccm93c2VyKSB7XG4gIHRyeSB7XG4gICAgdmFyIG9wdHMgPSB7fTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob3B0cywgJ3Bhc3NpdmUnLCAoe1xuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQgKCkge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXG4gICAgICB9XG4gICAgfSkpOyAvLyBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svZmxvdy9pc3N1ZXMvMjg1XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Rlc3QtcGFzc2l2ZScsIG51bGwsIG9wdHMpO1xuICB9IGNhdGNoIChlKSB7fVxufVxuXG4vLyB0aGlzIG5lZWRzIHRvIGJlIGxhenktZXZhbGVkIGJlY2F1c2UgdnVlIG1heSBiZSByZXF1aXJlZCBiZWZvcmVcbi8vIHZ1ZS1zZXJ2ZXItcmVuZGVyZXIgY2FuIHNldCBWVUVfRU5WXG52YXIgX2lzU2VydmVyO1xudmFyIGlzU2VydmVyUmVuZGVyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAoX2lzU2VydmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAoIWluQnJvd3NlciAmJiAhaW5XZWV4ICYmIHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBkZXRlY3QgcHJlc2VuY2Ugb2YgdnVlLXNlcnZlci1yZW5kZXJlciBhbmQgYXZvaWRcbiAgICAgIC8vIFdlYnBhY2sgc2hpbW1pbmcgdGhlIHByb2Nlc3NcbiAgICAgIF9pc1NlcnZlciA9IGdsb2JhbFsncHJvY2VzcyddLmVudi5WVUVfRU5WID09PSAnc2VydmVyJztcbiAgICB9IGVsc2Uge1xuICAgICAgX2lzU2VydmVyID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiBfaXNTZXJ2ZXJcbn07XG5cbi8vIGRldGVjdCBkZXZ0b29sc1xudmFyIGRldnRvb2xzID0gaW5Ccm93c2VyICYmIHdpbmRvdy5fX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gaXNOYXRpdmUgKEN0b3IpIHtcbiAgcmV0dXJuIHR5cGVvZiBDdG9yID09PSAnZnVuY3Rpb24nICYmIC9uYXRpdmUgY29kZS8udGVzdChDdG9yLnRvU3RyaW5nKCkpXG59XG5cbnZhciBoYXNTeW1ib2wgPVxuICB0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBpc05hdGl2ZShTeW1ib2wpICYmXG4gIHR5cGVvZiBSZWZsZWN0ICE9PSAndW5kZWZpbmVkJyAmJiBpc05hdGl2ZShSZWZsZWN0Lm93bktleXMpO1xuXG52YXIgX1NldDtcbi8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqLyAvLyAkZmxvdy1kaXNhYmxlLWxpbmVcbmlmICh0eXBlb2YgU2V0ICE9PSAndW5kZWZpbmVkJyAmJiBpc05hdGl2ZShTZXQpKSB7XG4gIC8vIHVzZSBuYXRpdmUgU2V0IHdoZW4gYXZhaWxhYmxlLlxuICBfU2V0ID0gU2V0O1xufSBlbHNlIHtcbiAgLy8gYSBub24tc3RhbmRhcmQgU2V0IHBvbHlmaWxsIHRoYXQgb25seSB3b3JrcyB3aXRoIHByaW1pdGl2ZSBrZXlzLlxuICBfU2V0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTZXQgKCkge1xuICAgICAgdGhpcy5zZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cbiAgICBTZXQucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIGhhcyAoa2V5KSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRba2V5XSA9PT0gdHJ1ZVxuICAgIH07XG4gICAgU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQgKGtleSkge1xuICAgICAgdGhpcy5zZXRba2V5XSA9IHRydWU7XG4gICAgfTtcbiAgICBTZXQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIgKCkge1xuICAgICAgdGhpcy5zZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH07XG5cbiAgICByZXR1cm4gU2V0O1xuICB9KCkpO1xufVxuXG4vKiAgKi9cblxudmFyIHdhcm4gPSBub29wO1xudmFyIHRpcCA9IG5vb3A7XG52YXIgZ2VuZXJhdGVDb21wb25lbnRUcmFjZSA9IChub29wKTsgLy8gd29yayBhcm91bmQgZmxvdyBjaGVja1xudmFyIGZvcm1hdENvbXBvbmVudE5hbWUgPSAobm9vcCk7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHZhciBoYXNDb25zb2xlID0gdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnO1xuICB2YXIgY2xhc3NpZnlSRSA9IC8oPzpefFstX10pKFxcdykvZztcbiAgdmFyIGNsYXNzaWZ5ID0gZnVuY3Rpb24gKHN0cikgeyByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoY2xhc3NpZnlSRSwgZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMudG9VcHBlckNhc2UoKTsgfSlcbiAgICAucmVwbGFjZSgvWy1fXS9nLCAnJyk7IH07XG5cbiAgd2FybiA9IGZ1bmN0aW9uIChtc2csIHZtKSB7XG4gICAgdmFyIHRyYWNlID0gdm0gPyBnZW5lcmF0ZUNvbXBvbmVudFRyYWNlKHZtKSA6ICcnO1xuXG4gICAgaWYgKGNvbmZpZy53YXJuSGFuZGxlcikge1xuICAgICAgY29uZmlnLndhcm5IYW5kbGVyLmNhbGwobnVsbCwgbXNnLCB2bSwgdHJhY2UpO1xuICAgIH0gZWxzZSBpZiAoaGFzQ29uc29sZSAmJiAoIWNvbmZpZy5zaWxlbnQpKSB7XG4gICAgICBjb25zb2xlLmVycm9yKChcIltWdWUgd2Fybl06IFwiICsgbXNnICsgdHJhY2UpKTtcbiAgICB9XG4gIH07XG5cbiAgdGlwID0gZnVuY3Rpb24gKG1zZywgdm0pIHtcbiAgICBpZiAoaGFzQ29uc29sZSAmJiAoIWNvbmZpZy5zaWxlbnQpKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbVnVlIHRpcF06IFwiICsgbXNnICsgKFxuICAgICAgICB2bSA/IGdlbmVyYXRlQ29tcG9uZW50VHJhY2Uodm0pIDogJydcbiAgICAgICkpO1xuICAgIH1cbiAgfTtcblxuICBmb3JtYXRDb21wb25lbnROYW1lID0gZnVuY3Rpb24gKHZtLCBpbmNsdWRlRmlsZSkge1xuICAgIGlmICh2bS4kcm9vdCA9PT0gdm0pIHtcbiAgICAgIHJldHVybiAnPFJvb3Q+J1xuICAgIH1cbiAgICB2YXIgb3B0aW9ucyA9IHR5cGVvZiB2bSA9PT0gJ2Z1bmN0aW9uJyAmJiB2bS5jaWQgIT0gbnVsbFxuICAgICAgPyB2bS5vcHRpb25zXG4gICAgICA6IHZtLl9pc1Z1ZVxuICAgICAgICA/IHZtLiRvcHRpb25zIHx8IHZtLmNvbnN0cnVjdG9yLm9wdGlvbnNcbiAgICAgICAgOiB2bSB8fCB7fTtcbiAgICB2YXIgbmFtZSA9IG9wdGlvbnMubmFtZSB8fCBvcHRpb25zLl9jb21wb25lbnRUYWc7XG4gICAgdmFyIGZpbGUgPSBvcHRpb25zLl9fZmlsZTtcbiAgICBpZiAoIW5hbWUgJiYgZmlsZSkge1xuICAgICAgdmFyIG1hdGNoID0gZmlsZS5tYXRjaCgvKFteL1xcXFxdKylcXC52dWUkLyk7XG4gICAgICBuYW1lID0gbWF0Y2ggJiYgbWF0Y2hbMV07XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIChuYW1lID8gKFwiPFwiICsgKGNsYXNzaWZ5KG5hbWUpKSArIFwiPlwiKSA6IFwiPEFub255bW91cz5cIikgK1xuICAgICAgKGZpbGUgJiYgaW5jbHVkZUZpbGUgIT09IGZhbHNlID8gKFwiIGF0IFwiICsgZmlsZSkgOiAnJylcbiAgICApXG4gIH07XG5cbiAgdmFyIHJlcGVhdCA9IGZ1bmN0aW9uIChzdHIsIG4pIHtcbiAgICB2YXIgcmVzID0gJyc7XG4gICAgd2hpbGUgKG4pIHtcbiAgICAgIGlmIChuICUgMiA9PT0gMSkgeyByZXMgKz0gc3RyOyB9XG4gICAgICBpZiAobiA+IDEpIHsgc3RyICs9IHN0cjsgfVxuICAgICAgbiA+Pj0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc1xuICB9O1xuXG4gIGdlbmVyYXRlQ29tcG9uZW50VHJhY2UgPSBmdW5jdGlvbiAodm0pIHtcbiAgICBpZiAodm0uX2lzVnVlICYmIHZtLiRwYXJlbnQpIHtcbiAgICAgIHZhciB0cmVlID0gW107XG4gICAgICB2YXIgY3VycmVudFJlY3Vyc2l2ZVNlcXVlbmNlID0gMDtcbiAgICAgIHdoaWxlICh2bSkge1xuICAgICAgICBpZiAodHJlZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIGxhc3QgPSB0cmVlW3RyZWUubGVuZ3RoIC0gMV07XG4gICAgICAgICAgaWYgKGxhc3QuY29uc3RydWN0b3IgPT09IHZtLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjdXJyZW50UmVjdXJzaXZlU2VxdWVuY2UrKztcbiAgICAgICAgICAgIHZtID0gdm0uJHBhcmVudDtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50UmVjdXJzaXZlU2VxdWVuY2UgPiAwKSB7XG4gICAgICAgICAgICB0cmVlW3RyZWUubGVuZ3RoIC0gMV0gPSBbbGFzdCwgY3VycmVudFJlY3Vyc2l2ZVNlcXVlbmNlXTtcbiAgICAgICAgICAgIGN1cnJlbnRSZWN1cnNpdmVTZXF1ZW5jZSA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRyZWUucHVzaCh2bSk7XG4gICAgICAgIHZtID0gdm0uJHBhcmVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiAnXFxuXFxuZm91bmQgaW5cXG5cXG4nICsgdHJlZVxuICAgICAgICAubWFwKGZ1bmN0aW9uICh2bSwgaSkgeyByZXR1cm4gKFwiXCIgKyAoaSA9PT0gMCA/ICctLS0+ICcgOiByZXBlYXQoJyAnLCA1ICsgaSAqIDIpKSArIChBcnJheS5pc0FycmF5KHZtKVxuICAgICAgICAgICAgPyAoKGZvcm1hdENvbXBvbmVudE5hbWUodm1bMF0pKSArIFwiLi4uIChcIiArICh2bVsxXSkgKyBcIiByZWN1cnNpdmUgY2FsbHMpXCIpXG4gICAgICAgICAgICA6IGZvcm1hdENvbXBvbmVudE5hbWUodm0pKSk7IH0pXG4gICAgICAgIC5qb2luKCdcXG4nKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gKFwiXFxuXFxuKGZvdW5kIGluIFwiICsgKGZvcm1hdENvbXBvbmVudE5hbWUodm0pKSArIFwiKVwiKVxuICAgIH1cbiAgfTtcbn1cblxuLyogICovXG5cblxudmFyIHVpZCQxID0gMDtcblxuLyoqXG4gKiBBIGRlcCBpcyBhbiBvYnNlcnZhYmxlIHRoYXQgY2FuIGhhdmUgbXVsdGlwbGVcbiAqIGRpcmVjdGl2ZXMgc3Vic2NyaWJpbmcgdG8gaXQuXG4gKi9cbnZhciBEZXAgPSBmdW5jdGlvbiBEZXAgKCkge1xuICB0aGlzLmlkID0gdWlkJDErKztcbiAgdGhpcy5zdWJzID0gW107XG59O1xuXG5EZXAucHJvdG90eXBlLmFkZFN1YiA9IGZ1bmN0aW9uIGFkZFN1YiAoc3ViKSB7XG4gIHRoaXMuc3Vicy5wdXNoKHN1Yik7XG59O1xuXG5EZXAucHJvdG90eXBlLnJlbW92ZVN1YiA9IGZ1bmN0aW9uIHJlbW92ZVN1YiAoc3ViKSB7XG4gIHJlbW92ZSh0aGlzLnN1YnMsIHN1Yik7XG59O1xuXG5EZXAucHJvdG90eXBlLmRlcGVuZCA9IGZ1bmN0aW9uIGRlcGVuZCAoKSB7XG4gIGlmIChEZXAudGFyZ2V0KSB7XG4gICAgRGVwLnRhcmdldC5hZGREZXAodGhpcyk7XG4gIH1cbn07XG5cbkRlcC5wcm90b3R5cGUubm90aWZ5ID0gZnVuY3Rpb24gbm90aWZ5ICgpIHtcbiAgLy8gc3RhYmlsaXplIHRoZSBzdWJzY3JpYmVyIGxpc3QgZmlyc3RcbiAgdmFyIHN1YnMgPSB0aGlzLnN1YnMuc2xpY2UoKTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBzdWJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHN1YnNbaV0udXBkYXRlKCk7XG4gIH1cbn07XG5cbi8vIHRoZSBjdXJyZW50IHRhcmdldCB3YXRjaGVyIGJlaW5nIGV2YWx1YXRlZC5cbi8vIHRoaXMgaXMgZ2xvYmFsbHkgdW5pcXVlIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb25seSBvbmVcbi8vIHdhdGNoZXIgYmVpbmcgZXZhbHVhdGVkIGF0IGFueSB0aW1lLlxuRGVwLnRhcmdldCA9IG51bGw7XG52YXIgdGFyZ2V0U3RhY2sgPSBbXTtcblxuZnVuY3Rpb24gcHVzaFRhcmdldCAoX3RhcmdldCkge1xuICBpZiAoRGVwLnRhcmdldCkgeyB0YXJnZXRTdGFjay5wdXNoKERlcC50YXJnZXQpOyB9XG4gIERlcC50YXJnZXQgPSBfdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiBwb3BUYXJnZXQgKCkge1xuICBEZXAudGFyZ2V0ID0gdGFyZ2V0U3RhY2sucG9wKCk7XG59XG5cbi8qICAqL1xuXG52YXIgVk5vZGUgPSBmdW5jdGlvbiBWTm9kZSAoXG4gIHRhZyxcbiAgZGF0YSxcbiAgY2hpbGRyZW4sXG4gIHRleHQsXG4gIGVsbSxcbiAgY29udGV4dCxcbiAgY29tcG9uZW50T3B0aW9ucyxcbiAgYXN5bmNGYWN0b3J5XG4pIHtcbiAgdGhpcy50YWcgPSB0YWc7XG4gIHRoaXMuZGF0YSA9IGRhdGE7XG4gIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgdGhpcy5lbG0gPSBlbG07XG4gIHRoaXMubnMgPSB1bmRlZmluZWQ7XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMuZm5Db250ZXh0ID0gdW5kZWZpbmVkO1xuICB0aGlzLmZuT3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgdGhpcy5mblNjb3BlSWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMua2V5ID0gZGF0YSAmJiBkYXRhLmtleTtcbiAgdGhpcy5jb21wb25lbnRPcHRpb25zID0gY29tcG9uZW50T3B0aW9ucztcbiAgdGhpcy5jb21wb25lbnRJbnN0YW5jZSA9IHVuZGVmaW5lZDtcbiAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWQ7XG4gIHRoaXMucmF3ID0gZmFsc2U7XG4gIHRoaXMuaXNTdGF0aWMgPSBmYWxzZTtcbiAgdGhpcy5pc1Jvb3RJbnNlcnQgPSB0cnVlO1xuICB0aGlzLmlzQ29tbWVudCA9IGZhbHNlO1xuICB0aGlzLmlzQ2xvbmVkID0gZmFsc2U7XG4gIHRoaXMuaXNPbmNlID0gZmFsc2U7XG4gIHRoaXMuYXN5bmNGYWN0b3J5ID0gYXN5bmNGYWN0b3J5O1xuICB0aGlzLmFzeW5jTWV0YSA9IHVuZGVmaW5lZDtcbiAgdGhpcy5pc0FzeW5jUGxhY2Vob2xkZXIgPSBmYWxzZTtcbn07XG5cbnZhciBwcm90b3R5cGVBY2Nlc3NvcnMgPSB7IGNoaWxkOiB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH07XG5cbi8vIERFUFJFQ0FURUQ6IGFsaWFzIGZvciBjb21wb25lbnRJbnN0YW5jZSBmb3IgYmFja3dhcmRzIGNvbXBhdC5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5wcm90b3R5cGVBY2Nlc3NvcnMuY2hpbGQuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5jb21wb25lbnRJbnN0YW5jZVxufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIFZOb2RlLnByb3RvdHlwZSwgcHJvdG90eXBlQWNjZXNzb3JzICk7XG5cbnZhciBjcmVhdGVFbXB0eVZOb2RlID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgaWYgKCB0ZXh0ID09PSB2b2lkIDAgKSB0ZXh0ID0gJyc7XG5cbiAgdmFyIG5vZGUgPSBuZXcgVk5vZGUoKTtcbiAgbm9kZS50ZXh0ID0gdGV4dDtcbiAgbm9kZS5pc0NvbW1lbnQgPSB0cnVlO1xuICByZXR1cm4gbm9kZVxufTtcblxuZnVuY3Rpb24gY3JlYXRlVGV4dFZOb2RlICh2YWwpIHtcbiAgcmV0dXJuIG5ldyBWTm9kZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBTdHJpbmcodmFsKSlcbn1cblxuLy8gb3B0aW1pemVkIHNoYWxsb3cgY2xvbmVcbi8vIHVzZWQgZm9yIHN0YXRpYyBub2RlcyBhbmQgc2xvdCBub2RlcyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJldXNlZCBhY3Jvc3Ncbi8vIG11bHRpcGxlIHJlbmRlcnMsIGNsb25pbmcgdGhlbSBhdm9pZHMgZXJyb3JzIHdoZW4gRE9NIG1hbmlwdWxhdGlvbnMgcmVseVxuLy8gb24gdGhlaXIgZWxtIHJlZmVyZW5jZS5cbmZ1bmN0aW9uIGNsb25lVk5vZGUgKHZub2RlLCBkZWVwKSB7XG4gIHZhciBjb21wb25lbnRPcHRpb25zID0gdm5vZGUuY29tcG9uZW50T3B0aW9ucztcbiAgdmFyIGNsb25lZCA9IG5ldyBWTm9kZShcbiAgICB2bm9kZS50YWcsXG4gICAgdm5vZGUuZGF0YSxcbiAgICB2bm9kZS5jaGlsZHJlbixcbiAgICB2bm9kZS50ZXh0LFxuICAgIHZub2RlLmVsbSxcbiAgICB2bm9kZS5jb250ZXh0LFxuICAgIGNvbXBvbmVudE9wdGlvbnMsXG4gICAgdm5vZGUuYXN5bmNGYWN0b3J5XG4gICk7XG4gIGNsb25lZC5ucyA9IHZub2RlLm5zO1xuICBjbG9uZWQuaXNTdGF0aWMgPSB2bm9kZS5pc1N0YXRpYztcbiAgY2xvbmVkLmtleSA9IHZub2RlLmtleTtcbiAgY2xvbmVkLmlzQ29tbWVudCA9IHZub2RlLmlzQ29tbWVudDtcbiAgY2xvbmVkLmZuQ29udGV4dCA9IHZub2RlLmZuQ29udGV4dDtcbiAgY2xvbmVkLmZuT3B0aW9ucyA9IHZub2RlLmZuT3B0aW9ucztcbiAgY2xvbmVkLmZuU2NvcGVJZCA9IHZub2RlLmZuU2NvcGVJZDtcbiAgY2xvbmVkLmlzQ2xvbmVkID0gdHJ1ZTtcbiAgaWYgKGRlZXApIHtcbiAgICBpZiAodm5vZGUuY2hpbGRyZW4pIHtcbiAgICAgIGNsb25lZC5jaGlsZHJlbiA9IGNsb25lVk5vZGVzKHZub2RlLmNoaWxkcmVuLCB0cnVlKTtcbiAgICB9XG4gICAgaWYgKGNvbXBvbmVudE9wdGlvbnMgJiYgY29tcG9uZW50T3B0aW9ucy5jaGlsZHJlbikge1xuICAgICAgY29tcG9uZW50T3B0aW9ucy5jaGlsZHJlbiA9IGNsb25lVk5vZGVzKGNvbXBvbmVudE9wdGlvbnMuY2hpbGRyZW4sIHRydWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2xvbmVkXG59XG5cbmZ1bmN0aW9uIGNsb25lVk5vZGVzICh2bm9kZXMsIGRlZXApIHtcbiAgdmFyIGxlbiA9IHZub2Rlcy5sZW5ndGg7XG4gIHZhciByZXMgPSBuZXcgQXJyYXkobGVuKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIHJlc1tpXSA9IGNsb25lVk5vZGUodm5vZGVzW2ldLCBkZWVwKTtcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbi8qXG4gKiBub3QgdHlwZSBjaGVja2luZyB0aGlzIGZpbGUgYmVjYXVzZSBmbG93IGRvZXNuJ3QgcGxheSB3ZWxsIHdpdGhcbiAqIGR5bmFtaWNhbGx5IGFjY2Vzc2luZyBtZXRob2RzIG9uIEFycmF5IHByb3RvdHlwZVxuICovXG5cbnZhciBhcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xudmFyIGFycmF5TWV0aG9kcyA9IE9iamVjdC5jcmVhdGUoYXJyYXlQcm90byk7W1xuICAncHVzaCcsXG4gICdwb3AnLFxuICAnc2hpZnQnLFxuICAndW5zaGlmdCcsXG4gICdzcGxpY2UnLFxuICAnc29ydCcsXG4gICdyZXZlcnNlJ1xuXS5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgLy8gY2FjaGUgb3JpZ2luYWwgbWV0aG9kXG4gIHZhciBvcmlnaW5hbCA9IGFycmF5UHJvdG9bbWV0aG9kXTtcbiAgZGVmKGFycmF5TWV0aG9kcywgbWV0aG9kLCBmdW5jdGlvbiBtdXRhdG9yICgpIHtcbiAgICB2YXIgYXJncyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIHdoaWxlICggbGVuLS0gKSBhcmdzWyBsZW4gXSA9IGFyZ3VtZW50c1sgbGVuIF07XG5cbiAgICB2YXIgcmVzdWx0ID0gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJncyk7XG4gICAgdmFyIG9iID0gdGhpcy5fX29iX187XG4gICAgdmFyIGluc2VydGVkO1xuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICBjYXNlICdwdXNoJzpcbiAgICAgIGNhc2UgJ3Vuc2hpZnQnOlxuICAgICAgICBpbnNlcnRlZCA9IGFyZ3M7XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdzcGxpY2UnOlxuICAgICAgICBpbnNlcnRlZCA9IGFyZ3Muc2xpY2UoMik7XG4gICAgICAgIGJyZWFrXG4gICAgfVxuICAgIGlmIChpbnNlcnRlZCkgeyBvYi5vYnNlcnZlQXJyYXkoaW5zZXJ0ZWQpOyB9XG4gICAgLy8gbm90aWZ5IGNoYW5nZVxuICAgIG9iLmRlcC5ub3RpZnkoKTtcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0pO1xufSk7XG5cbi8qICAqL1xuXG52YXIgYXJyYXlLZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYXJyYXlNZXRob2RzKTtcblxuLyoqXG4gKiBCeSBkZWZhdWx0LCB3aGVuIGEgcmVhY3RpdmUgcHJvcGVydHkgaXMgc2V0LCB0aGUgbmV3IHZhbHVlIGlzXG4gKiBhbHNvIGNvbnZlcnRlZCB0byBiZWNvbWUgcmVhY3RpdmUuIEhvd2V2ZXIgd2hlbiBwYXNzaW5nIGRvd24gcHJvcHMsXG4gKiB3ZSBkb24ndCB3YW50IHRvIGZvcmNlIGNvbnZlcnNpb24gYmVjYXVzZSB0aGUgdmFsdWUgbWF5IGJlIGEgbmVzdGVkIHZhbHVlXG4gKiB1bmRlciBhIGZyb3plbiBkYXRhIHN0cnVjdHVyZS4gQ29udmVydGluZyBpdCB3b3VsZCBkZWZlYXQgdGhlIG9wdGltaXphdGlvbi5cbiAqL1xudmFyIG9ic2VydmVyU3RhdGUgPSB7XG4gIHNob3VsZENvbnZlcnQ6IHRydWVcbn07XG5cbi8qKlxuICogT2JzZXJ2ZXIgY2xhc3MgdGhhdCBhcmUgYXR0YWNoZWQgdG8gZWFjaCBvYnNlcnZlZFxuICogb2JqZWN0LiBPbmNlIGF0dGFjaGVkLCB0aGUgb2JzZXJ2ZXIgY29udmVydHMgdGFyZ2V0XG4gKiBvYmplY3QncyBwcm9wZXJ0eSBrZXlzIGludG8gZ2V0dGVyL3NldHRlcnMgdGhhdFxuICogY29sbGVjdCBkZXBlbmRlbmNpZXMgYW5kIGRpc3BhdGNoZXMgdXBkYXRlcy5cbiAqL1xudmFyIE9ic2VydmVyID0gZnVuY3Rpb24gT2JzZXJ2ZXIgKHZhbHVlKSB7XG4gIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgdGhpcy5kZXAgPSBuZXcgRGVwKCk7XG4gIHRoaXMudm1Db3VudCA9IDA7XG4gIGRlZih2YWx1ZSwgJ19fb2JfXycsIHRoaXMpO1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICB2YXIgYXVnbWVudCA9IGhhc1Byb3RvXG4gICAgICA/IHByb3RvQXVnbWVudFxuICAgICAgOiBjb3B5QXVnbWVudDtcbiAgICBhdWdtZW50KHZhbHVlLCBhcnJheU1ldGhvZHMsIGFycmF5S2V5cyk7XG4gICAgdGhpcy5vYnNlcnZlQXJyYXkodmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMud2Fsayh2YWx1ZSk7XG4gIH1cbn07XG5cbi8qKlxuICogV2FsayB0aHJvdWdoIGVhY2ggcHJvcGVydHkgYW5kIGNvbnZlcnQgdGhlbSBpbnRvXG4gKiBnZXR0ZXIvc2V0dGVycy4gVGhpcyBtZXRob2Qgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIHdoZW5cbiAqIHZhbHVlIHR5cGUgaXMgT2JqZWN0LlxuICovXG5PYnNlcnZlci5wcm90b3R5cGUud2FsayA9IGZ1bmN0aW9uIHdhbGsgKG9iaikge1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGRlZmluZVJlYWN0aXZlKG9iaiwga2V5c1tpXSwgb2JqW2tleXNbaV1dKTtcbiAgfVxufTtcblxuLyoqXG4gKiBPYnNlcnZlIGEgbGlzdCBvZiBBcnJheSBpdGVtcy5cbiAqL1xuT2JzZXJ2ZXIucHJvdG90eXBlLm9ic2VydmVBcnJheSA9IGZ1bmN0aW9uIG9ic2VydmVBcnJheSAoaXRlbXMpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBpdGVtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBvYnNlcnZlKGl0ZW1zW2ldKTtcbiAgfVxufTtcblxuLy8gaGVscGVyc1xuXG4vKipcbiAqIEF1Z21lbnQgYW4gdGFyZ2V0IE9iamVjdCBvciBBcnJheSBieSBpbnRlcmNlcHRpbmdcbiAqIHRoZSBwcm90b3R5cGUgY2hhaW4gdXNpbmcgX19wcm90b19fXG4gKi9cbmZ1bmN0aW9uIHByb3RvQXVnbWVudCAodGFyZ2V0LCBzcmMsIGtleXMpIHtcbiAgLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cbiAgdGFyZ2V0Ll9fcHJvdG9fXyA9IHNyYztcbiAgLyogZXNsaW50LWVuYWJsZSBuby1wcm90byAqL1xufVxuXG4vKipcbiAqIEF1Z21lbnQgYW4gdGFyZ2V0IE9iamVjdCBvciBBcnJheSBieSBkZWZpbmluZ1xuICogaGlkZGVuIHByb3BlcnRpZXMuXG4gKi9cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiBjb3B5QXVnbWVudCAodGFyZ2V0LCBzcmMsIGtleXMpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgIGRlZih0YXJnZXQsIGtleSwgc3JjW2tleV0pO1xuICB9XG59XG5cbi8qKlxuICogQXR0ZW1wdCB0byBjcmVhdGUgYW4gb2JzZXJ2ZXIgaW5zdGFuY2UgZm9yIGEgdmFsdWUsXG4gKiByZXR1cm5zIHRoZSBuZXcgb2JzZXJ2ZXIgaWYgc3VjY2Vzc2Z1bGx5IG9ic2VydmVkLFxuICogb3IgdGhlIGV4aXN0aW5nIG9ic2VydmVyIGlmIHRoZSB2YWx1ZSBhbHJlYWR5IGhhcyBvbmUuXG4gKi9cbmZ1bmN0aW9uIG9ic2VydmUgKHZhbHVlLCBhc1Jvb3REYXRhKSB7XG4gIGlmICghaXNPYmplY3QodmFsdWUpIHx8IHZhbHVlIGluc3RhbmNlb2YgVk5vZGUpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgb2I7XG4gIGlmIChoYXNPd24odmFsdWUsICdfX29iX18nKSAmJiB2YWx1ZS5fX29iX18gaW5zdGFuY2VvZiBPYnNlcnZlcikge1xuICAgIG9iID0gdmFsdWUuX19vYl9fO1xuICB9IGVsc2UgaWYgKFxuICAgIG9ic2VydmVyU3RhdGUuc2hvdWxkQ29udmVydCAmJlxuICAgICFpc1NlcnZlclJlbmRlcmluZygpICYmXG4gICAgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IGlzUGxhaW5PYmplY3QodmFsdWUpKSAmJlxuICAgIE9iamVjdC5pc0V4dGVuc2libGUodmFsdWUpICYmXG4gICAgIXZhbHVlLl9pc1Z1ZVxuICApIHtcbiAgICBvYiA9IG5ldyBPYnNlcnZlcih2YWx1ZSk7XG4gIH1cbiAgaWYgKGFzUm9vdERhdGEgJiYgb2IpIHtcbiAgICBvYi52bUNvdW50Kys7XG4gIH1cbiAgcmV0dXJuIG9iXG59XG5cbi8qKlxuICogRGVmaW5lIGEgcmVhY3RpdmUgcHJvcGVydHkgb24gYW4gT2JqZWN0LlxuICovXG5mdW5jdGlvbiBkZWZpbmVSZWFjdGl2ZSAoXG4gIG9iaixcbiAga2V5LFxuICB2YWwsXG4gIGN1c3RvbVNldHRlcixcbiAgc2hhbGxvd1xuKSB7XG4gIHZhciBkZXAgPSBuZXcgRGVwKCk7XG5cbiAgdmFyIHByb3BlcnR5ID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSk7XG4gIGlmIChwcm9wZXJ0eSAmJiBwcm9wZXJ0eS5jb25maWd1cmFibGUgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBjYXRlciBmb3IgcHJlLWRlZmluZWQgZ2V0dGVyL3NldHRlcnNcbiAgdmFyIGdldHRlciA9IHByb3BlcnR5ICYmIHByb3BlcnR5LmdldDtcbiAgdmFyIHNldHRlciA9IHByb3BlcnR5ICYmIHByb3BlcnR5LnNldDtcblxuICB2YXIgY2hpbGRPYiA9ICFzaGFsbG93ICYmIG9ic2VydmUodmFsKTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbiByZWFjdGl2ZUdldHRlciAoKSB7XG4gICAgICB2YXIgdmFsdWUgPSBnZXR0ZXIgPyBnZXR0ZXIuY2FsbChvYmopIDogdmFsO1xuICAgICAgaWYgKERlcC50YXJnZXQpIHtcbiAgICAgICAgZGVwLmRlcGVuZCgpO1xuICAgICAgICBpZiAoY2hpbGRPYikge1xuICAgICAgICAgIGNoaWxkT2IuZGVwLmRlcGVuZCgpO1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgZGVwZW5kQXJyYXkodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHJlYWN0aXZlU2V0dGVyIChuZXdWYWwpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGdldHRlciA/IGdldHRlci5jYWxsKG9iaikgOiB2YWw7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cbiAgICAgIGlmIChuZXdWYWwgPT09IHZhbHVlIHx8IChuZXdWYWwgIT09IG5ld1ZhbCAmJiB2YWx1ZSAhPT0gdmFsdWUpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGN1c3RvbVNldHRlcikge1xuICAgICAgICBjdXN0b21TZXR0ZXIoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZXR0ZXIpIHtcbiAgICAgICAgc2V0dGVyLmNhbGwob2JqLCBuZXdWYWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsID0gbmV3VmFsO1xuICAgICAgfVxuICAgICAgY2hpbGRPYiA9ICFzaGFsbG93ICYmIG9ic2VydmUobmV3VmFsKTtcbiAgICAgIGRlcC5ub3RpZnkoKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIFNldCBhIHByb3BlcnR5IG9uIGFuIG9iamVjdC4gQWRkcyB0aGUgbmV3IHByb3BlcnR5IGFuZFxuICogdHJpZ2dlcnMgY2hhbmdlIG5vdGlmaWNhdGlvbiBpZiB0aGUgcHJvcGVydHkgZG9lc24ndFxuICogYWxyZWFkeSBleGlzdC5cbiAqL1xuZnVuY3Rpb24gc2V0ICh0YXJnZXQsIGtleSwgdmFsKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHRhcmdldCkgJiYgaXNWYWxpZEFycmF5SW5kZXgoa2V5KSkge1xuICAgIHRhcmdldC5sZW5ndGggPSBNYXRoLm1heCh0YXJnZXQubGVuZ3RoLCBrZXkpO1xuICAgIHRhcmdldC5zcGxpY2Uoa2V5LCAxLCB2YWwpO1xuICAgIHJldHVybiB2YWxcbiAgfVxuICBpZiAoa2V5IGluIHRhcmdldCAmJiAhKGtleSBpbiBPYmplY3QucHJvdG90eXBlKSkge1xuICAgIHRhcmdldFtrZXldID0gdmFsO1xuICAgIHJldHVybiB2YWxcbiAgfVxuICB2YXIgb2IgPSAodGFyZ2V0KS5fX29iX187XG4gIGlmICh0YXJnZXQuX2lzVnVlIHx8IChvYiAmJiBvYi52bUNvdW50KSkge1xuICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybihcbiAgICAgICdBdm9pZCBhZGRpbmcgcmVhY3RpdmUgcHJvcGVydGllcyB0byBhIFZ1ZSBpbnN0YW5jZSBvciBpdHMgcm9vdCAkZGF0YSAnICtcbiAgICAgICdhdCBydW50aW1lIC0gZGVjbGFyZSBpdCB1cGZyb250IGluIHRoZSBkYXRhIG9wdGlvbi4nXG4gICAgKTtcbiAgICByZXR1cm4gdmFsXG4gIH1cbiAgaWYgKCFvYikge1xuICAgIHRhcmdldFtrZXldID0gdmFsO1xuICAgIHJldHVybiB2YWxcbiAgfVxuICBkZWZpbmVSZWFjdGl2ZShvYi52YWx1ZSwga2V5LCB2YWwpO1xuICBvYi5kZXAubm90aWZ5KCk7XG4gIHJldHVybiB2YWxcbn1cblxuLyoqXG4gKiBEZWxldGUgYSBwcm9wZXJ0eSBhbmQgdHJpZ2dlciBjaGFuZ2UgaWYgbmVjZXNzYXJ5LlxuICovXG5mdW5jdGlvbiBkZWwgKHRhcmdldCwga2V5KSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHRhcmdldCkgJiYgaXNWYWxpZEFycmF5SW5kZXgoa2V5KSkge1xuICAgIHRhcmdldC5zcGxpY2Uoa2V5LCAxKTtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgb2IgPSAodGFyZ2V0KS5fX29iX187XG4gIGlmICh0YXJnZXQuX2lzVnVlIHx8IChvYiAmJiBvYi52bUNvdW50KSkge1xuICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybihcbiAgICAgICdBdm9pZCBkZWxldGluZyBwcm9wZXJ0aWVzIG9uIGEgVnVlIGluc3RhbmNlIG9yIGl0cyByb290ICRkYXRhICcgK1xuICAgICAgJy0ganVzdCBzZXQgaXQgdG8gbnVsbC4nXG4gICAgKTtcbiAgICByZXR1cm5cbiAgfVxuICBpZiAoIWhhc093bih0YXJnZXQsIGtleSkpIHtcbiAgICByZXR1cm5cbiAgfVxuICBkZWxldGUgdGFyZ2V0W2tleV07XG4gIGlmICghb2IpIHtcbiAgICByZXR1cm5cbiAgfVxuICBvYi5kZXAubm90aWZ5KCk7XG59XG5cbi8qKlxuICogQ29sbGVjdCBkZXBlbmRlbmNpZXMgb24gYXJyYXkgZWxlbWVudHMgd2hlbiB0aGUgYXJyYXkgaXMgdG91Y2hlZCwgc2luY2VcbiAqIHdlIGNhbm5vdCBpbnRlcmNlcHQgYXJyYXkgZWxlbWVudCBhY2Nlc3MgbGlrZSBwcm9wZXJ0eSBnZXR0ZXJzLlxuICovXG5mdW5jdGlvbiBkZXBlbmRBcnJheSAodmFsdWUpIHtcbiAgZm9yICh2YXIgZSA9ICh2b2lkIDApLCBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGUgPSB2YWx1ZVtpXTtcbiAgICBlICYmIGUuX19vYl9fICYmIGUuX19vYl9fLmRlcC5kZXBlbmQoKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShlKSkge1xuICAgICAgZGVwZW5kQXJyYXkoZSk7XG4gICAgfVxuICB9XG59XG5cbi8qICAqL1xuXG4vKipcbiAqIE9wdGlvbiBvdmVyd3JpdGluZyBzdHJhdGVnaWVzIGFyZSBmdW5jdGlvbnMgdGhhdCBoYW5kbGVcbiAqIGhvdyB0byBtZXJnZSBhIHBhcmVudCBvcHRpb24gdmFsdWUgYW5kIGEgY2hpbGQgb3B0aW9uXG4gKiB2YWx1ZSBpbnRvIHRoZSBmaW5hbCB2YWx1ZS5cbiAqL1xudmFyIHN0cmF0cyA9IGNvbmZpZy5vcHRpb25NZXJnZVN0cmF0ZWdpZXM7XG5cbi8qKlxuICogT3B0aW9ucyB3aXRoIHJlc3RyaWN0aW9uc1xuICovXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICBzdHJhdHMuZWwgPSBzdHJhdHMucHJvcHNEYXRhID0gZnVuY3Rpb24gKHBhcmVudCwgY2hpbGQsIHZtLCBrZXkpIHtcbiAgICBpZiAoIXZtKSB7XG4gICAgICB3YXJuKFxuICAgICAgICBcIm9wdGlvbiBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgY2FuIG9ubHkgYmUgdXNlZCBkdXJpbmcgaW5zdGFuY2UgXCIgK1xuICAgICAgICAnY3JlYXRpb24gd2l0aCB0aGUgYG5ld2Aga2V5d29yZC4nXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gZGVmYXVsdFN0cmF0KHBhcmVudCwgY2hpbGQpXG4gIH07XG59XG5cbi8qKlxuICogSGVscGVyIHRoYXQgcmVjdXJzaXZlbHkgbWVyZ2VzIHR3byBkYXRhIG9iamVjdHMgdG9nZXRoZXIuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlRGF0YSAodG8sIGZyb20pIHtcbiAgaWYgKCFmcm9tKSB7IHJldHVybiB0byB9XG4gIHZhciBrZXksIHRvVmFsLCBmcm9tVmFsO1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGZyb20pO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBrZXkgPSBrZXlzW2ldO1xuICAgIHRvVmFsID0gdG9ba2V5XTtcbiAgICBmcm9tVmFsID0gZnJvbVtrZXldO1xuICAgIGlmICghaGFzT3duKHRvLCBrZXkpKSB7XG4gICAgICBzZXQodG8sIGtleSwgZnJvbVZhbCk7XG4gICAgfSBlbHNlIGlmIChpc1BsYWluT2JqZWN0KHRvVmFsKSAmJiBpc1BsYWluT2JqZWN0KGZyb21WYWwpKSB7XG4gICAgICBtZXJnZURhdGEodG9WYWwsIGZyb21WYWwpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdG9cbn1cblxuLyoqXG4gKiBEYXRhXG4gKi9cbmZ1bmN0aW9uIG1lcmdlRGF0YU9yRm4gKFxuICBwYXJlbnRWYWwsXG4gIGNoaWxkVmFsLFxuICB2bVxuKSB7XG4gIGlmICghdm0pIHtcbiAgICAvLyBpbiBhIFZ1ZS5leHRlbmQgbWVyZ2UsIGJvdGggc2hvdWxkIGJlIGZ1bmN0aW9uc1xuICAgIGlmICghY2hpbGRWYWwpIHtcbiAgICAgIHJldHVybiBwYXJlbnRWYWxcbiAgICB9XG4gICAgaWYgKCFwYXJlbnRWYWwpIHtcbiAgICAgIHJldHVybiBjaGlsZFZhbFxuICAgIH1cbiAgICAvLyB3aGVuIHBhcmVudFZhbCAmIGNoaWxkVmFsIGFyZSBib3RoIHByZXNlbnQsXG4gICAgLy8gd2UgbmVlZCB0byByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gICAgLy8gbWVyZ2VkIHJlc3VsdCBvZiBib3RoIGZ1bmN0aW9ucy4uLiBubyBuZWVkIHRvXG4gICAgLy8gY2hlY2sgaWYgcGFyZW50VmFsIGlzIGEgZnVuY3Rpb24gaGVyZSBiZWNhdXNlXG4gICAgLy8gaXQgaGFzIHRvIGJlIGEgZnVuY3Rpb24gdG8gcGFzcyBwcmV2aW91cyBtZXJnZXMuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1lcmdlZERhdGFGbiAoKSB7XG4gICAgICByZXR1cm4gbWVyZ2VEYXRhKFxuICAgICAgICB0eXBlb2YgY2hpbGRWYWwgPT09ICdmdW5jdGlvbicgPyBjaGlsZFZhbC5jYWxsKHRoaXMsIHRoaXMpIDogY2hpbGRWYWwsXG4gICAgICAgIHR5cGVvZiBwYXJlbnRWYWwgPT09ICdmdW5jdGlvbicgPyBwYXJlbnRWYWwuY2FsbCh0aGlzLCB0aGlzKSA6IHBhcmVudFZhbFxuICAgICAgKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gbWVyZ2VkSW5zdGFuY2VEYXRhRm4gKCkge1xuICAgICAgLy8gaW5zdGFuY2UgbWVyZ2VcbiAgICAgIHZhciBpbnN0YW5jZURhdGEgPSB0eXBlb2YgY2hpbGRWYWwgPT09ICdmdW5jdGlvbidcbiAgICAgICAgPyBjaGlsZFZhbC5jYWxsKHZtLCB2bSlcbiAgICAgICAgOiBjaGlsZFZhbDtcbiAgICAgIHZhciBkZWZhdWx0RGF0YSA9IHR5cGVvZiBwYXJlbnRWYWwgPT09ICdmdW5jdGlvbidcbiAgICAgICAgPyBwYXJlbnRWYWwuY2FsbCh2bSwgdm0pXG4gICAgICAgIDogcGFyZW50VmFsO1xuICAgICAgaWYgKGluc3RhbmNlRGF0YSkge1xuICAgICAgICByZXR1cm4gbWVyZ2VEYXRhKGluc3RhbmNlRGF0YSwgZGVmYXVsdERhdGEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVmYXVsdERhdGFcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuc3RyYXRzLmRhdGEgPSBmdW5jdGlvbiAoXG4gIHBhcmVudFZhbCxcbiAgY2hpbGRWYWwsXG4gIHZtXG4pIHtcbiAgaWYgKCF2bSkge1xuICAgIGlmIChjaGlsZFZhbCAmJiB0eXBlb2YgY2hpbGRWYWwgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybihcbiAgICAgICAgJ1RoZSBcImRhdGFcIiBvcHRpb24gc2hvdWxkIGJlIGEgZnVuY3Rpb24gJyArXG4gICAgICAgICd0aGF0IHJldHVybnMgYSBwZXItaW5zdGFuY2UgdmFsdWUgaW4gY29tcG9uZW50ICcgK1xuICAgICAgICAnZGVmaW5pdGlvbnMuJyxcbiAgICAgICAgdm1cbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBwYXJlbnRWYWxcbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlRGF0YU9yRm4ocGFyZW50VmFsLCBjaGlsZFZhbClcbiAgfVxuXG4gIHJldHVybiBtZXJnZURhdGFPckZuKHBhcmVudFZhbCwgY2hpbGRWYWwsIHZtKVxufTtcblxuLyoqXG4gKiBIb29rcyBhbmQgcHJvcHMgYXJlIG1lcmdlZCBhcyBhcnJheXMuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlSG9vayAoXG4gIHBhcmVudFZhbCxcbiAgY2hpbGRWYWxcbikge1xuICByZXR1cm4gY2hpbGRWYWxcbiAgICA/IHBhcmVudFZhbFxuICAgICAgPyBwYXJlbnRWYWwuY29uY2F0KGNoaWxkVmFsKVxuICAgICAgOiBBcnJheS5pc0FycmF5KGNoaWxkVmFsKVxuICAgICAgICA/IGNoaWxkVmFsXG4gICAgICAgIDogW2NoaWxkVmFsXVxuICAgIDogcGFyZW50VmFsXG59XG5cbkxJRkVDWUNMRV9IT09LUy5mb3JFYWNoKGZ1bmN0aW9uIChob29rKSB7XG4gIHN0cmF0c1tob29rXSA9IG1lcmdlSG9vaztcbn0pO1xuXG4vKipcbiAqIEFzc2V0c1xuICpcbiAqIFdoZW4gYSB2bSBpcyBwcmVzZW50IChpbnN0YW5jZSBjcmVhdGlvbiksIHdlIG5lZWQgdG8gZG9cbiAqIGEgdGhyZWUtd2F5IG1lcmdlIGJldHdlZW4gY29uc3RydWN0b3Igb3B0aW9ucywgaW5zdGFuY2VcbiAqIG9wdGlvbnMgYW5kIHBhcmVudCBvcHRpb25zLlxuICovXG5mdW5jdGlvbiBtZXJnZUFzc2V0cyAoXG4gIHBhcmVudFZhbCxcbiAgY2hpbGRWYWwsXG4gIHZtLFxuICBrZXlcbikge1xuICB2YXIgcmVzID0gT2JqZWN0LmNyZWF0ZShwYXJlbnRWYWwgfHwgbnVsbCk7XG4gIGlmIChjaGlsZFZhbCkge1xuICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgYXNzZXJ0T2JqZWN0VHlwZShrZXksIGNoaWxkVmFsLCB2bSk7XG4gICAgcmV0dXJuIGV4dGVuZChyZXMsIGNoaWxkVmFsKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiByZXNcbiAgfVxufVxuXG5BU1NFVF9UWVBFUy5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gIHN0cmF0c1t0eXBlICsgJ3MnXSA9IG1lcmdlQXNzZXRzO1xufSk7XG5cbi8qKlxuICogV2F0Y2hlcnMuXG4gKlxuICogV2F0Y2hlcnMgaGFzaGVzIHNob3VsZCBub3Qgb3ZlcndyaXRlIG9uZVxuICogYW5vdGhlciwgc28gd2UgbWVyZ2UgdGhlbSBhcyBhcnJheXMuXG4gKi9cbnN0cmF0cy53YXRjaCA9IGZ1bmN0aW9uIChcbiAgcGFyZW50VmFsLFxuICBjaGlsZFZhbCxcbiAgdm0sXG4gIGtleVxuKSB7XG4gIC8vIHdvcmsgYXJvdW5kIEZpcmVmb3gncyBPYmplY3QucHJvdG90eXBlLndhdGNoLi4uXG4gIGlmIChwYXJlbnRWYWwgPT09IG5hdGl2ZVdhdGNoKSB7IHBhcmVudFZhbCA9IHVuZGVmaW5lZDsgfVxuICBpZiAoY2hpbGRWYWwgPT09IG5hdGl2ZVdhdGNoKSB7IGNoaWxkVmFsID0gdW5kZWZpbmVkOyB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoIWNoaWxkVmFsKSB7IHJldHVybiBPYmplY3QuY3JlYXRlKHBhcmVudFZhbCB8fCBudWxsKSB9XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0T2JqZWN0VHlwZShrZXksIGNoaWxkVmFsLCB2bSk7XG4gIH1cbiAgaWYgKCFwYXJlbnRWYWwpIHsgcmV0dXJuIGNoaWxkVmFsIH1cbiAgdmFyIHJldCA9IHt9O1xuICBleHRlbmQocmV0LCBwYXJlbnRWYWwpO1xuICBmb3IgKHZhciBrZXkkMSBpbiBjaGlsZFZhbCkge1xuICAgIHZhciBwYXJlbnQgPSByZXRba2V5JDFdO1xuICAgIHZhciBjaGlsZCA9IGNoaWxkVmFsW2tleSQxXTtcbiAgICBpZiAocGFyZW50ICYmICFBcnJheS5pc0FycmF5KHBhcmVudCkpIHtcbiAgICAgIHBhcmVudCA9IFtwYXJlbnRdO1xuICAgIH1cbiAgICByZXRba2V5JDFdID0gcGFyZW50XG4gICAgICA/IHBhcmVudC5jb25jYXQoY2hpbGQpXG4gICAgICA6IEFycmF5LmlzQXJyYXkoY2hpbGQpID8gY2hpbGQgOiBbY2hpbGRdO1xuICB9XG4gIHJldHVybiByZXRcbn07XG5cbi8qKlxuICogT3RoZXIgb2JqZWN0IGhhc2hlcy5cbiAqL1xuc3RyYXRzLnByb3BzID1cbnN0cmF0cy5tZXRob2RzID1cbnN0cmF0cy5pbmplY3QgPVxuc3RyYXRzLmNvbXB1dGVkID0gZnVuY3Rpb24gKFxuICBwYXJlbnRWYWwsXG4gIGNoaWxkVmFsLFxuICB2bSxcbiAga2V5XG4pIHtcbiAgaWYgKGNoaWxkVmFsICYmIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBhc3NlcnRPYmplY3RUeXBlKGtleSwgY2hpbGRWYWwsIHZtKTtcbiAgfVxuICBpZiAoIXBhcmVudFZhbCkgeyByZXR1cm4gY2hpbGRWYWwgfVxuICB2YXIgcmV0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgZXh0ZW5kKHJldCwgcGFyZW50VmFsKTtcbiAgaWYgKGNoaWxkVmFsKSB7IGV4dGVuZChyZXQsIGNoaWxkVmFsKTsgfVxuICByZXR1cm4gcmV0XG59O1xuc3RyYXRzLnByb3ZpZGUgPSBtZXJnZURhdGFPckZuO1xuXG4vKipcbiAqIERlZmF1bHQgc3RyYXRlZ3kuXG4gKi9cbnZhciBkZWZhdWx0U3RyYXQgPSBmdW5jdGlvbiAocGFyZW50VmFsLCBjaGlsZFZhbCkge1xuICByZXR1cm4gY2hpbGRWYWwgPT09IHVuZGVmaW5lZFxuICAgID8gcGFyZW50VmFsXG4gICAgOiBjaGlsZFZhbFxufTtcblxuLyoqXG4gKiBWYWxpZGF0ZSBjb21wb25lbnQgbmFtZXNcbiAqL1xuZnVuY3Rpb24gY2hlY2tDb21wb25lbnRzIChvcHRpb25zKSB7XG4gIGZvciAodmFyIGtleSBpbiBvcHRpb25zLmNvbXBvbmVudHMpIHtcbiAgICB2YWxpZGF0ZUNvbXBvbmVudE5hbWUoa2V5KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUNvbXBvbmVudE5hbWUgKG5hbWUpIHtcbiAgaWYgKCEvXlthLXpBLVpdW1xcdy1dKiQvLnRlc3QobmFtZSkpIHtcbiAgICB3YXJuKFxuICAgICAgJ0ludmFsaWQgY29tcG9uZW50IG5hbWU6IFwiJyArIG5hbWUgKyAnXCIuIENvbXBvbmVudCBuYW1lcyAnICtcbiAgICAgICdjYW4gb25seSBjb250YWluIGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzIGFuZCB0aGUgaHlwaGVuLCAnICtcbiAgICAgICdhbmQgbXVzdCBzdGFydCB3aXRoIGEgbGV0dGVyLidcbiAgICApO1xuICB9XG4gIGlmIChpc0J1aWx0SW5UYWcobmFtZSkgfHwgY29uZmlnLmlzUmVzZXJ2ZWRUYWcobmFtZSkpIHtcbiAgICB3YXJuKFxuICAgICAgJ0RvIG5vdCB1c2UgYnVpbHQtaW4gb3IgcmVzZXJ2ZWQgSFRNTCBlbGVtZW50cyBhcyBjb21wb25lbnQgJyArXG4gICAgICAnaWQ6ICcgKyBuYW1lXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIEVuc3VyZSBhbGwgcHJvcHMgb3B0aW9uIHN5bnRheCBhcmUgbm9ybWFsaXplZCBpbnRvIHRoZVxuICogT2JqZWN0LWJhc2VkIGZvcm1hdC5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplUHJvcHMgKG9wdGlvbnMsIHZtKSB7XG4gIHZhciBwcm9wcyA9IG9wdGlvbnMucHJvcHM7XG4gIGlmICghcHJvcHMpIHsgcmV0dXJuIH1cbiAgdmFyIHJlcyA9IHt9O1xuICB2YXIgaSwgdmFsLCBuYW1lO1xuICBpZiAoQXJyYXkuaXNBcnJheShwcm9wcykpIHtcbiAgICBpID0gcHJvcHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHZhbCA9IHByb3BzW2ldO1xuICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG5hbWUgPSBjYW1lbGl6ZSh2YWwpO1xuICAgICAgICByZXNbbmFtZV0gPSB7IHR5cGU6IG51bGwgfTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICB3YXJuKCdwcm9wcyBtdXN0IGJlIHN0cmluZ3Mgd2hlbiB1c2luZyBhcnJheSBzeW50YXguJyk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzUGxhaW5PYmplY3QocHJvcHMpKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHByb3BzKSB7XG4gICAgICB2YWwgPSBwcm9wc1trZXldO1xuICAgICAgbmFtZSA9IGNhbWVsaXplKGtleSk7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBpc1BsYWluT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgdmFsaWRhdGVQcm9wT2JqZWN0KG5hbWUsIHZhbCwgdm0pO1xuICAgICAgfVxuICAgICAgcmVzW25hbWVdID0gaXNQbGFpbk9iamVjdCh2YWwpXG4gICAgICAgID8gdmFsXG4gICAgICAgIDogeyB0eXBlOiB2YWwgfTtcbiAgICB9XG4gIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIHdhcm4oXG4gICAgICBcIkludmFsaWQgdmFsdWUgZm9yIG9wdGlvbiBcXFwicHJvcHNcXFwiOiBleHBlY3RlZCBhbiBBcnJheSBvciBhbiBPYmplY3QsIFwiICtcbiAgICAgIFwiYnV0IGdvdCBcIiArICh0b1Jhd1R5cGUocHJvcHMpKSArIFwiLlwiLFxuICAgICAgdm1cbiAgICApO1xuICB9XG4gIG9wdGlvbnMucHJvcHMgPSByZXM7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgd2hldGhlciBhIHByb3Agb2JqZWN0IGtleXMgYXJlIHZhbGlkLlxuICovXG52YXIgcHJvcE9wdGlvbnNSRSA9IC9eKHR5cGV8ZGVmYXVsdHxyZXF1aXJlZHx2YWxpZGF0b3IpJC87XG5cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvcE9iamVjdCAoXG4gIHByb3BOYW1lLFxuICBwcm9wLFxuICB2bVxuKSB7XG4gIGZvciAodmFyIGtleSBpbiBwcm9wKSB7XG4gICAgaWYgKCFwcm9wT3B0aW9uc1JFLnRlc3Qoa2V5KSkge1xuICAgICAgd2FybihcbiAgICAgICAgKFwiSW52YWxpZCBrZXkgXFxcIlwiICsga2V5ICsgXCJcXFwiIGluIHZhbGlkYXRpb24gcnVsZXMgb2JqZWN0IGZvciBwcm9wIFxcXCJcIiArIHByb3BOYW1lICsgXCJcXFwiLlwiKSxcbiAgICAgICAgdm1cbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGFsbCBpbmplY3Rpb25zIGludG8gT2JqZWN0LWJhc2VkIGZvcm1hdFxuICovXG5mdW5jdGlvbiBub3JtYWxpemVJbmplY3QgKG9wdGlvbnMsIHZtKSB7XG4gIHZhciBpbmplY3QgPSBvcHRpb25zLmluamVjdDtcbiAgaWYgKCFpbmplY3QpIHsgcmV0dXJuIH1cbiAgdmFyIG5vcm1hbGl6ZWQgPSBvcHRpb25zLmluamVjdCA9IHt9O1xuICBpZiAoQXJyYXkuaXNBcnJheShpbmplY3QpKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmplY3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIG5vcm1hbGl6ZWRbaW5qZWN0W2ldXSA9IHsgZnJvbTogaW5qZWN0W2ldIH07XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzUGxhaW5PYmplY3QoaW5qZWN0KSkge1xuICAgIGZvciAodmFyIGtleSBpbiBpbmplY3QpIHtcbiAgICAgIHZhciB2YWwgPSBpbmplY3Rba2V5XTtcbiAgICAgIG5vcm1hbGl6ZWRba2V5XSA9IGlzUGxhaW5PYmplY3QodmFsKVxuICAgICAgICA/IGV4dGVuZCh7IGZyb206IGtleSB9LCB2YWwpXG4gICAgICAgIDogeyBmcm9tOiB2YWwgfTtcbiAgICB9XG4gIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIHdhcm4oXG4gICAgICBcIkludmFsaWQgdmFsdWUgZm9yIG9wdGlvbiBcXFwiaW5qZWN0XFxcIjogZXhwZWN0ZWQgYW4gQXJyYXkgb3IgYW4gT2JqZWN0LCBcIiArXG4gICAgICBcImJ1dCBnb3QgXCIgKyAodG9SYXdUeXBlKGluamVjdCkpICsgXCIuXCIsXG4gICAgICB2bVxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgcmF3IGZ1bmN0aW9uIGRpcmVjdGl2ZXMgaW50byBvYmplY3QgZm9ybWF0LlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVEaXJlY3RpdmVzIChvcHRpb25zKSB7XG4gIHZhciBkaXJzID0gb3B0aW9ucy5kaXJlY3RpdmVzO1xuICBpZiAoZGlycykge1xuICAgIGZvciAodmFyIGtleSBpbiBkaXJzKSB7XG4gICAgICB2YXIgZGVmID0gZGlyc1trZXldO1xuICAgICAgaWYgKHR5cGVvZiBkZWYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZGlyc1trZXldID0geyBiaW5kOiBkZWYsIHVwZGF0ZTogZGVmIH07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGFzc2VydE9iamVjdFR5cGUgKG5hbWUsIHZhbHVlLCB2bSkge1xuICBpZiAoIWlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgd2FybihcbiAgICAgIFwiSW52YWxpZCB2YWx1ZSBmb3Igb3B0aW9uIFxcXCJcIiArIG5hbWUgKyBcIlxcXCI6IGV4cGVjdGVkIGFuIE9iamVjdCwgXCIgK1xuICAgICAgXCJidXQgZ290IFwiICsgKHRvUmF3VHlwZSh2YWx1ZSkpICsgXCIuXCIsXG4gICAgICB2bVxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBNZXJnZSB0d28gb3B0aW9uIG9iamVjdHMgaW50byBhIG5ldyBvbmUuXG4gKiBDb3JlIHV0aWxpdHkgdXNlZCBpbiBib3RoIGluc3RhbnRpYXRpb24gYW5kIGluaGVyaXRhbmNlLlxuICovXG5mdW5jdGlvbiBtZXJnZU9wdGlvbnMgKFxuICBwYXJlbnQsXG4gIGNoaWxkLFxuICB2bVxuKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgY2hlY2tDb21wb25lbnRzKGNoaWxkKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgY2hpbGQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjaGlsZCA9IGNoaWxkLm9wdGlvbnM7XG4gIH1cblxuICBub3JtYWxpemVQcm9wcyhjaGlsZCwgdm0pO1xuICBub3JtYWxpemVJbmplY3QoY2hpbGQsIHZtKTtcbiAgbm9ybWFsaXplRGlyZWN0aXZlcyhjaGlsZCk7XG4gIHZhciBleHRlbmRzRnJvbSA9IGNoaWxkLmV4dGVuZHM7XG4gIGlmIChleHRlbmRzRnJvbSkge1xuICAgIHBhcmVudCA9IG1lcmdlT3B0aW9ucyhwYXJlbnQsIGV4dGVuZHNGcm9tLCB2bSk7XG4gIH1cbiAgaWYgKGNoaWxkLm1peGlucykge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGQubWl4aW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcGFyZW50ID0gbWVyZ2VPcHRpb25zKHBhcmVudCwgY2hpbGQubWl4aW5zW2ldLCB2bSk7XG4gICAgfVxuICB9XG4gIHZhciBvcHRpb25zID0ge307XG4gIHZhciBrZXk7XG4gIGZvciAoa2V5IGluIHBhcmVudCkge1xuICAgIG1lcmdlRmllbGQoa2V5KTtcbiAgfVxuICBmb3IgKGtleSBpbiBjaGlsZCkge1xuICAgIGlmICghaGFzT3duKHBhcmVudCwga2V5KSkge1xuICAgICAgbWVyZ2VGaWVsZChrZXkpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBtZXJnZUZpZWxkIChrZXkpIHtcbiAgICB2YXIgc3RyYXQgPSBzdHJhdHNba2V5XSB8fCBkZWZhdWx0U3RyYXQ7XG4gICAgb3B0aW9uc1trZXldID0gc3RyYXQocGFyZW50W2tleV0sIGNoaWxkW2tleV0sIHZtLCBrZXkpO1xuICB9XG4gIHJldHVybiBvcHRpb25zXG59XG5cbi8qKlxuICogUmVzb2x2ZSBhbiBhc3NldC5cbiAqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBiZWNhdXNlIGNoaWxkIGluc3RhbmNlcyBuZWVkIGFjY2Vzc1xuICogdG8gYXNzZXRzIGRlZmluZWQgaW4gaXRzIGFuY2VzdG9yIGNoYWluLlxuICovXG5mdW5jdGlvbiByZXNvbHZlQXNzZXQgKFxuICBvcHRpb25zLFxuICB0eXBlLFxuICBpZCxcbiAgd2Fybk1pc3Npbmdcbikge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgYXNzZXRzID0gb3B0aW9uc1t0eXBlXTtcbiAgLy8gY2hlY2sgbG9jYWwgcmVnaXN0cmF0aW9uIHZhcmlhdGlvbnMgZmlyc3RcbiAgaWYgKGhhc093bihhc3NldHMsIGlkKSkgeyByZXR1cm4gYXNzZXRzW2lkXSB9XG4gIHZhciBjYW1lbGl6ZWRJZCA9IGNhbWVsaXplKGlkKTtcbiAgaWYgKGhhc093bihhc3NldHMsIGNhbWVsaXplZElkKSkgeyByZXR1cm4gYXNzZXRzW2NhbWVsaXplZElkXSB9XG4gIHZhciBQYXNjYWxDYXNlSWQgPSBjYXBpdGFsaXplKGNhbWVsaXplZElkKTtcbiAgaWYgKGhhc093bihhc3NldHMsIFBhc2NhbENhc2VJZCkpIHsgcmV0dXJuIGFzc2V0c1tQYXNjYWxDYXNlSWRdIH1cbiAgLy8gZmFsbGJhY2sgdG8gcHJvdG90eXBlIGNoYWluXG4gIHZhciByZXMgPSBhc3NldHNbaWRdIHx8IGFzc2V0c1tjYW1lbGl6ZWRJZF0gfHwgYXNzZXRzW1Bhc2NhbENhc2VJZF07XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm5NaXNzaW5nICYmICFyZXMpIHtcbiAgICB3YXJuKFxuICAgICAgJ0ZhaWxlZCB0byByZXNvbHZlICcgKyB0eXBlLnNsaWNlKDAsIC0xKSArICc6ICcgKyBpZCxcbiAgICAgIG9wdGlvbnNcbiAgICApO1xuICB9XG4gIHJldHVybiByZXNcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvcCAoXG4gIGtleSxcbiAgcHJvcE9wdGlvbnMsXG4gIHByb3BzRGF0YSxcbiAgdm1cbikge1xuICB2YXIgcHJvcCA9IHByb3BPcHRpb25zW2tleV07XG4gIHZhciBhYnNlbnQgPSAhaGFzT3duKHByb3BzRGF0YSwga2V5KTtcbiAgdmFyIHZhbHVlID0gcHJvcHNEYXRhW2tleV07XG4gIC8vIGhhbmRsZSBib29sZWFuIHByb3BzXG4gIGlmIChpc1R5cGUoQm9vbGVhbiwgcHJvcC50eXBlKSkge1xuICAgIGlmIChhYnNlbnQgJiYgIWhhc093bihwcm9wLCAnZGVmYXVsdCcpKSB7XG4gICAgICB2YWx1ZSA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoIWlzVHlwZShTdHJpbmcsIHByb3AudHlwZSkgJiYgKHZhbHVlID09PSAnJyB8fCB2YWx1ZSA9PT0gaHlwaGVuYXRlKGtleSkpKSB7XG4gICAgICB2YWx1ZSA9IHRydWU7XG4gICAgfVxuICB9XG4gIC8vIGNoZWNrIGRlZmF1bHQgdmFsdWVcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICB2YWx1ZSA9IGdldFByb3BEZWZhdWx0VmFsdWUodm0sIHByb3AsIGtleSk7XG4gICAgLy8gc2luY2UgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYSBmcmVzaCBjb3B5LFxuICAgIC8vIG1ha2Ugc3VyZSB0byBvYnNlcnZlIGl0LlxuICAgIHZhciBwcmV2U2hvdWxkQ29udmVydCA9IG9ic2VydmVyU3RhdGUuc2hvdWxkQ29udmVydDtcbiAgICBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQgPSB0cnVlO1xuICAgIG9ic2VydmUodmFsdWUpO1xuICAgIG9ic2VydmVyU3RhdGUuc2hvdWxkQ29udmVydCA9IHByZXZTaG91bGRDb252ZXJ0O1xuICB9XG4gIGlmIChcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmXG4gICAgLy8gc2tpcCB2YWxpZGF0aW9uIGZvciB3ZWV4IHJlY3ljbGUtbGlzdCBjaGlsZCBjb21wb25lbnQgcHJvcHNcbiAgICAhKHRydWUgJiYgaXNPYmplY3QodmFsdWUpICYmICgnQGJpbmRpbmcnIGluIHZhbHVlKSlcbiAgKSB7XG4gICAgYXNzZXJ0UHJvcChwcm9wLCBrZXksIHZhbHVlLCB2bSwgYWJzZW50KTtcbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGRlZmF1bHQgdmFsdWUgb2YgYSBwcm9wLlxuICovXG5mdW5jdGlvbiBnZXRQcm9wRGVmYXVsdFZhbHVlICh2bSwgcHJvcCwga2V5KSB7XG4gIC8vIG5vIGRlZmF1bHQsIHJldHVybiB1bmRlZmluZWRcbiAgaWYgKCFoYXNPd24ocHJvcCwgJ2RlZmF1bHQnKSkge1xuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxuICB2YXIgZGVmID0gcHJvcC5kZWZhdWx0O1xuICAvLyB3YXJuIGFnYWluc3Qgbm9uLWZhY3RvcnkgZGVmYXVsdHMgZm9yIE9iamVjdCAmIEFycmF5XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGlzT2JqZWN0KGRlZikpIHtcbiAgICB3YXJuKFxuICAgICAgJ0ludmFsaWQgZGVmYXVsdCB2YWx1ZSBmb3IgcHJvcCBcIicgKyBrZXkgKyAnXCI6ICcgK1xuICAgICAgJ1Byb3BzIHdpdGggdHlwZSBPYmplY3QvQXJyYXkgbXVzdCB1c2UgYSBmYWN0b3J5IGZ1bmN0aW9uICcgK1xuICAgICAgJ3RvIHJldHVybiB0aGUgZGVmYXVsdCB2YWx1ZS4nLFxuICAgICAgdm1cbiAgICApO1xuICB9XG4gIC8vIHRoZSByYXcgcHJvcCB2YWx1ZSB3YXMgYWxzbyB1bmRlZmluZWQgZnJvbSBwcmV2aW91cyByZW5kZXIsXG4gIC8vIHJldHVybiBwcmV2aW91cyBkZWZhdWx0IHZhbHVlIHRvIGF2b2lkIHVubmVjZXNzYXJ5IHdhdGNoZXIgdHJpZ2dlclxuICBpZiAodm0gJiYgdm0uJG9wdGlvbnMucHJvcHNEYXRhICYmXG4gICAgdm0uJG9wdGlvbnMucHJvcHNEYXRhW2tleV0gPT09IHVuZGVmaW5lZCAmJlxuICAgIHZtLl9wcm9wc1trZXldICE9PSB1bmRlZmluZWRcbiAgKSB7XG4gICAgcmV0dXJuIHZtLl9wcm9wc1trZXldXG4gIH1cbiAgLy8gY2FsbCBmYWN0b3J5IGZ1bmN0aW9uIGZvciBub24tRnVuY3Rpb24gdHlwZXNcbiAgLy8gYSB2YWx1ZSBpcyBGdW5jdGlvbiBpZiBpdHMgcHJvdG90eXBlIGlzIGZ1bmN0aW9uIGV2ZW4gYWNyb3NzIGRpZmZlcmVudCBleGVjdXRpb24gY29udGV4dFxuICByZXR1cm4gdHlwZW9mIGRlZiA9PT0gJ2Z1bmN0aW9uJyAmJiBnZXRUeXBlKHByb3AudHlwZSkgIT09ICdGdW5jdGlvbidcbiAgICA/IGRlZi5jYWxsKHZtKVxuICAgIDogZGVmXG59XG5cbi8qKlxuICogQXNzZXJ0IHdoZXRoZXIgYSBwcm9wIGlzIHZhbGlkLlxuICovXG5mdW5jdGlvbiBhc3NlcnRQcm9wIChcbiAgcHJvcCxcbiAgbmFtZSxcbiAgdmFsdWUsXG4gIHZtLFxuICBhYnNlbnRcbikge1xuICBpZiAocHJvcC5yZXF1aXJlZCAmJiBhYnNlbnQpIHtcbiAgICB3YXJuKFxuICAgICAgJ01pc3NpbmcgcmVxdWlyZWQgcHJvcDogXCInICsgbmFtZSArICdcIicsXG4gICAgICB2bVxuICAgICk7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKHZhbHVlID09IG51bGwgJiYgIXByb3AucmVxdWlyZWQpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgdHlwZSA9IHByb3AudHlwZTtcbiAgdmFyIHZhbGlkID0gIXR5cGUgfHwgdHlwZSA9PT0gdHJ1ZTtcbiAgdmFyIGV4cGVjdGVkVHlwZXMgPSBbXTtcbiAgaWYgKHR5cGUpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodHlwZSkpIHtcbiAgICAgIHR5cGUgPSBbdHlwZV07XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZS5sZW5ndGggJiYgIXZhbGlkOyBpKyspIHtcbiAgICAgIHZhciBhc3NlcnRlZFR5cGUgPSBhc3NlcnRUeXBlKHZhbHVlLCB0eXBlW2ldKTtcbiAgICAgIGV4cGVjdGVkVHlwZXMucHVzaChhc3NlcnRlZFR5cGUuZXhwZWN0ZWRUeXBlIHx8ICcnKTtcbiAgICAgIHZhbGlkID0gYXNzZXJ0ZWRUeXBlLnZhbGlkO1xuICAgIH1cbiAgfVxuICBpZiAoIXZhbGlkKSB7XG4gICAgd2FybihcbiAgICAgIFwiSW52YWxpZCBwcm9wOiB0eXBlIGNoZWNrIGZhaWxlZCBmb3IgcHJvcCBcXFwiXCIgKyBuYW1lICsgXCJcXFwiLlwiICtcbiAgICAgIFwiIEV4cGVjdGVkIFwiICsgKGV4cGVjdGVkVHlwZXMubWFwKGNhcGl0YWxpemUpLmpvaW4oJywgJykpICtcbiAgICAgIFwiLCBnb3QgXCIgKyAodG9SYXdUeXBlKHZhbHVlKSkgKyBcIi5cIixcbiAgICAgIHZtXG4gICAgKTtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgdmFsaWRhdG9yID0gcHJvcC52YWxpZGF0b3I7XG4gIGlmICh2YWxpZGF0b3IpIHtcbiAgICBpZiAoIXZhbGlkYXRvcih2YWx1ZSkpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgICdJbnZhbGlkIHByb3A6IGN1c3RvbSB2YWxpZGF0b3IgY2hlY2sgZmFpbGVkIGZvciBwcm9wIFwiJyArIG5hbWUgKyAnXCIuJyxcbiAgICAgICAgdm1cbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbnZhciBzaW1wbGVDaGVja1JFID0gL14oU3RyaW5nfE51bWJlcnxCb29sZWFufEZ1bmN0aW9ufFN5bWJvbCkkLztcblxuZnVuY3Rpb24gYXNzZXJ0VHlwZSAodmFsdWUsIHR5cGUpIHtcbiAgdmFyIHZhbGlkO1xuICB2YXIgZXhwZWN0ZWRUeXBlID0gZ2V0VHlwZSh0eXBlKTtcbiAgaWYgKHNpbXBsZUNoZWNrUkUudGVzdChleHBlY3RlZFR5cGUpKSB7XG4gICAgdmFyIHQgPSB0eXBlb2YgdmFsdWU7XG4gICAgdmFsaWQgPSB0ID09PSBleHBlY3RlZFR5cGUudG9Mb3dlckNhc2UoKTtcbiAgICAvLyBmb3IgcHJpbWl0aXZlIHdyYXBwZXIgb2JqZWN0c1xuICAgIGlmICghdmFsaWQgJiYgdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHZhbGlkID0gdmFsdWUgaW5zdGFuY2VvZiB0eXBlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChleHBlY3RlZFR5cGUgPT09ICdPYmplY3QnKSB7XG4gICAgdmFsaWQgPSBpc1BsYWluT2JqZWN0KHZhbHVlKTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZFR5cGUgPT09ICdBcnJheScpIHtcbiAgICB2YWxpZCA9IEFycmF5LmlzQXJyYXkodmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHZhbGlkID0gdmFsdWUgaW5zdGFuY2VvZiB0eXBlO1xuICB9XG4gIHJldHVybiB7XG4gICAgdmFsaWQ6IHZhbGlkLFxuICAgIGV4cGVjdGVkVHlwZTogZXhwZWN0ZWRUeXBlXG4gIH1cbn1cblxuLyoqXG4gKiBVc2UgZnVuY3Rpb24gc3RyaW5nIG5hbWUgdG8gY2hlY2sgYnVpbHQtaW4gdHlwZXMsXG4gKiBiZWNhdXNlIGEgc2ltcGxlIGVxdWFsaXR5IGNoZWNrIHdpbGwgZmFpbCB3aGVuIHJ1bm5pbmdcbiAqIGFjcm9zcyBkaWZmZXJlbnQgdm1zIC8gaWZyYW1lcy5cbiAqL1xuZnVuY3Rpb24gZ2V0VHlwZSAoZm4pIHtcbiAgdmFyIG1hdGNoID0gZm4gJiYgZm4udG9TdHJpbmcoKS5tYXRjaCgvXlxccypmdW5jdGlvbiAoXFx3KykvKTtcbiAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0gOiAnJ1xufVxuXG5mdW5jdGlvbiBpc1R5cGUgKHR5cGUsIGZuKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShmbikpIHtcbiAgICByZXR1cm4gZ2V0VHlwZShmbikgPT09IGdldFR5cGUodHlwZSlcbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gZm4ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZ2V0VHlwZShmbltpXSkgPT09IGdldFR5cGUodHlwZSkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHJldHVybiBmYWxzZVxufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gaGFuZGxlRXJyb3IgKGVyciwgdm0sIGluZm8pIHtcbiAgaWYgKHZtKSB7XG4gICAgdmFyIGN1ciA9IHZtO1xuICAgIHdoaWxlICgoY3VyID0gY3VyLiRwYXJlbnQpKSB7XG4gICAgICB2YXIgaG9va3MgPSBjdXIuJG9wdGlvbnMuZXJyb3JDYXB0dXJlZDtcbiAgICAgIGlmIChob29rcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBjYXB0dXJlID0gaG9va3NbaV0uY2FsbChjdXIsIGVyciwgdm0sIGluZm8pID09PSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChjYXB0dXJlKSB7IHJldHVybiB9XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZ2xvYmFsSGFuZGxlRXJyb3IoZSwgY3VyLCAnZXJyb3JDYXB0dXJlZCBob29rJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdsb2JhbEhhbmRsZUVycm9yKGVyciwgdm0sIGluZm8pO1xufVxuXG5mdW5jdGlvbiBnbG9iYWxIYW5kbGVFcnJvciAoZXJyLCB2bSwgaW5mbykge1xuICBpZiAoY29uZmlnLmVycm9ySGFuZGxlcikge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gY29uZmlnLmVycm9ySGFuZGxlci5jYWxsKG51bGwsIGVyciwgdm0sIGluZm8pXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nRXJyb3IoZSwgbnVsbCwgJ2NvbmZpZy5lcnJvckhhbmRsZXInKTtcbiAgICB9XG4gIH1cbiAgbG9nRXJyb3IoZXJyLCB2bSwgaW5mbyk7XG59XG5cbmZ1bmN0aW9uIGxvZ0Vycm9yIChlcnIsIHZtLCBpbmZvKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgd2FybigoXCJFcnJvciBpbiBcIiArIGluZm8gKyBcIjogXFxcIlwiICsgKGVyci50b1N0cmluZygpKSArIFwiXFxcIlwiKSwgdm0pO1xuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmICgoaW5Ccm93c2VyIHx8IGluV2VleCkgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IGVyclxuICB9XG59XG5cbi8qICAqL1xuLyogZ2xvYmFscyBNZXNzYWdlQ2hhbm5lbCAqL1xuXG52YXIgY2FsbGJhY2tzID0gW107XG52YXIgcGVuZGluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBmbHVzaENhbGxiYWNrcyAoKSB7XG4gIHBlbmRpbmcgPSBmYWxzZTtcbiAgdmFyIGNvcGllcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcbiAgY2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY29waWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29waWVzW2ldKCk7XG4gIH1cbn1cblxuLy8gSGVyZSB3ZSBoYXZlIGFzeW5jIGRlZmVycmluZyB3cmFwcGVycyB1c2luZyBib3RoIG1pY3JvIGFuZCBtYWNybyB0YXNrcy5cbi8vIEluIDwgMi40IHdlIHVzZWQgbWljcm8gdGFza3MgZXZlcnl3aGVyZSwgYnV0IHRoZXJlIGFyZSBzb21lIHNjZW5hcmlvcyB3aGVyZVxuLy8gbWljcm8gdGFza3MgaGF2ZSB0b28gaGlnaCBhIHByaW9yaXR5IGFuZCBmaXJlcyBpbiBiZXR3ZWVuIHN1cHBvc2VkbHlcbi8vIHNlcXVlbnRpYWwgZXZlbnRzIChlLmcuICM0NTIxLCAjNjY5MCkgb3IgZXZlbiBiZXR3ZWVuIGJ1YmJsaW5nIG9mIHRoZSBzYW1lXG4vLyBldmVudCAoIzY1NjYpLiBIb3dldmVyLCB1c2luZyBtYWNybyB0YXNrcyBldmVyeXdoZXJlIGFsc28gaGFzIHN1YnRsZSBwcm9ibGVtc1xuLy8gd2hlbiBzdGF0ZSBpcyBjaGFuZ2VkIHJpZ2h0IGJlZm9yZSByZXBhaW50IChlLmcuICM2ODEzLCBvdXQtaW4gdHJhbnNpdGlvbnMpLlxuLy8gSGVyZSB3ZSB1c2UgbWljcm8gdGFzayBieSBkZWZhdWx0LCBidXQgZXhwb3NlIGEgd2F5IHRvIGZvcmNlIG1hY3JvIHRhc2sgd2hlblxuLy8gbmVlZGVkIChlLmcuIGluIGV2ZW50IGhhbmRsZXJzIGF0dGFjaGVkIGJ5IHYtb24pLlxudmFyIG1pY3JvVGltZXJGdW5jO1xudmFyIG1hY3JvVGltZXJGdW5jO1xudmFyIHVzZU1hY3JvVGFzayA9IGZhbHNlO1xuXG4vLyBEZXRlcm1pbmUgKG1hY3JvKSBUYXNrIGRlZmVyIGltcGxlbWVudGF0aW9uLlxuLy8gVGVjaG5pY2FsbHkgc2V0SW1tZWRpYXRlIHNob3VsZCBiZSB0aGUgaWRlYWwgY2hvaWNlLCBidXQgaXQncyBvbmx5IGF2YWlsYWJsZVxuLy8gaW4gSUUuIFRoZSBvbmx5IHBvbHlmaWxsIHRoYXQgY29uc2lzdGVudGx5IHF1ZXVlcyB0aGUgY2FsbGJhY2sgYWZ0ZXIgYWxsIERPTVxuLy8gZXZlbnRzIHRyaWdnZXJlZCBpbiB0aGUgc2FtZSBsb29wIGlzIGJ5IHVzaW5nIE1lc3NhZ2VDaGFubmVsLlxuLyogaXN0YW5idWwgaWdub3JlIGlmICovXG5pZiAodHlwZW9mIHNldEltbWVkaWF0ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgaXNOYXRpdmUoc2V0SW1tZWRpYXRlKSkge1xuICBtYWNyb1RpbWVyRnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZXRJbW1lZGlhdGUoZmx1c2hDYWxsYmFja3MpO1xuICB9O1xufSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09ICd1bmRlZmluZWQnICYmIChcbiAgaXNOYXRpdmUoTWVzc2FnZUNoYW5uZWwpIHx8XG4gIC8vIFBoYW50b21KU1xuICBNZXNzYWdlQ2hhbm5lbC50b1N0cmluZygpID09PSAnW29iamVjdCBNZXNzYWdlQ2hhbm5lbENvbnN0cnVjdG9yXSdcbikpIHtcbiAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgdmFyIHBvcnQgPSBjaGFubmVsLnBvcnQyO1xuICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoQ2FsbGJhY2tzO1xuICBtYWNyb1RpbWVyRnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICBwb3J0LnBvc3RNZXNzYWdlKDEpO1xuICB9O1xufSBlbHNlIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgbWFjcm9UaW1lckZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgc2V0VGltZW91dChmbHVzaENhbGxiYWNrcywgMCk7XG4gIH07XG59XG5cbi8vIERldGVybWluZSBNaWNyb1Rhc2sgZGVmZXIgaW1wbGVtZW50YXRpb24uXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCwgJGZsb3ctZGlzYWJsZS1saW5lICovXG5pZiAodHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnICYmIGlzTmF0aXZlKFByb21pc2UpKSB7XG4gIHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIG1pY3JvVGltZXJGdW5jID0gZnVuY3Rpb24gKCkge1xuICAgIHAudGhlbihmbHVzaENhbGxiYWNrcyk7XG4gICAgLy8gaW4gcHJvYmxlbWF0aWMgVUlXZWJWaWV3cywgUHJvbWlzZS50aGVuIGRvZXNuJ3QgY29tcGxldGVseSBicmVhaywgYnV0XG4gICAgLy8gaXQgY2FuIGdldCBzdHVjayBpbiBhIHdlaXJkIHN0YXRlIHdoZXJlIGNhbGxiYWNrcyBhcmUgcHVzaGVkIGludG8gdGhlXG4gICAgLy8gbWljcm90YXNrIHF1ZXVlIGJ1dCB0aGUgcXVldWUgaXNuJ3QgYmVpbmcgZmx1c2hlZCwgdW50aWwgdGhlIGJyb3dzZXJcbiAgICAvLyBuZWVkcyB0byBkbyBzb21lIG90aGVyIHdvcmssIGUuZy4gaGFuZGxlIGEgdGltZXIuIFRoZXJlZm9yZSB3ZSBjYW5cbiAgICAvLyBcImZvcmNlXCIgdGhlIG1pY3JvdGFzayBxdWV1ZSB0byBiZSBmbHVzaGVkIGJ5IGFkZGluZyBhbiBlbXB0eSB0aW1lci5cbiAgICBpZiAoaXNJT1MpIHsgc2V0VGltZW91dChub29wKTsgfVxuICB9O1xufSBlbHNlIHtcbiAgLy8gZmFsbGJhY2sgdG8gbWFjcm9cbiAgbWljcm9UaW1lckZ1bmMgPSBtYWNyb1RpbWVyRnVuYztcbn1cblxuLyoqXG4gKiBXcmFwIGEgZnVuY3Rpb24gc28gdGhhdCBpZiBhbnkgY29kZSBpbnNpZGUgdHJpZ2dlcnMgc3RhdGUgY2hhbmdlLFxuICogdGhlIGNoYW5nZXMgYXJlIHF1ZXVlZCB1c2luZyBhIFRhc2sgaW5zdGVhZCBvZiBhIE1pY3JvVGFzay5cbiAqL1xuXG5cbmZ1bmN0aW9uIG5leHRUaWNrIChjYiwgY3R4KSB7XG4gIHZhciBfcmVzb2x2ZTtcbiAgY2FsbGJhY2tzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgIGlmIChjYikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY2IuY2FsbChjdHgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBoYW5kbGVFcnJvcihlLCBjdHgsICduZXh0VGljaycpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoX3Jlc29sdmUpIHtcbiAgICAgIF9yZXNvbHZlKGN0eCk7XG4gICAgfVxuICB9KTtcbiAgaWYgKCFwZW5kaW5nKSB7XG4gICAgcGVuZGluZyA9IHRydWU7XG4gICAgaWYgKHVzZU1hY3JvVGFzaykge1xuICAgICAgbWFjcm9UaW1lckZ1bmMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWljcm9UaW1lckZ1bmMoKTtcbiAgICB9XG4gIH1cbiAgLy8gJGZsb3ctZGlzYWJsZS1saW5lXG4gIGlmICghY2IgJiYgdHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICBfcmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgfSlcbiAgfVxufVxuXG4vKiAgKi9cblxuLyogbm90IHR5cGUgY2hlY2tpbmcgdGhpcyBmaWxlIGJlY2F1c2UgZmxvdyBkb2Vzbid0IHBsYXkgd2VsbCB3aXRoIFByb3h5ICovXG5cbnZhciBpbml0UHJveHk7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHZhciBhbGxvd2VkR2xvYmFscyA9IG1ha2VNYXAoXG4gICAgJ0luZmluaXR5LHVuZGVmaW5lZCxOYU4saXNGaW5pdGUsaXNOYU4sJyArXG4gICAgJ3BhcnNlRmxvYXQscGFyc2VJbnQsZGVjb2RlVVJJLGRlY29kZVVSSUNvbXBvbmVudCxlbmNvZGVVUkksZW5jb2RlVVJJQ29tcG9uZW50LCcgK1xuICAgICdNYXRoLE51bWJlcixEYXRlLEFycmF5LE9iamVjdCxCb29sZWFuLFN0cmluZyxSZWdFeHAsTWFwLFNldCxKU09OLEludGwsJyArXG4gICAgJ3JlcXVpcmUnIC8vIGZvciBXZWJwYWNrL0Jyb3dzZXJpZnlcbiAgKTtcblxuICB2YXIgd2Fybk5vblByZXNlbnQgPSBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHtcbiAgICB3YXJuKFxuICAgICAgXCJQcm9wZXJ0eSBvciBtZXRob2QgXFxcIlwiICsga2V5ICsgXCJcXFwiIGlzIG5vdCBkZWZpbmVkIG9uIHRoZSBpbnN0YW5jZSBidXQgXCIgK1xuICAgICAgJ3JlZmVyZW5jZWQgZHVyaW5nIHJlbmRlci4gTWFrZSBzdXJlIHRoYXQgdGhpcyBwcm9wZXJ0eSBpcyByZWFjdGl2ZSwgJyArXG4gICAgICAnZWl0aGVyIGluIHRoZSBkYXRhIG9wdGlvbiwgb3IgZm9yIGNsYXNzLWJhc2VkIGNvbXBvbmVudHMsIGJ5ICcgK1xuICAgICAgJ2luaXRpYWxpemluZyB0aGUgcHJvcGVydHkuICcgK1xuICAgICAgJ1NlZTogaHR0cHM6Ly92dWVqcy5vcmcvdjIvZ3VpZGUvcmVhY3Rpdml0eS5odG1sI0RlY2xhcmluZy1SZWFjdGl2ZS1Qcm9wZXJ0aWVzLicsXG4gICAgICB0YXJnZXRcbiAgICApO1xuICB9O1xuXG4gIHZhciBoYXNQcm94eSA9XG4gICAgdHlwZW9mIFByb3h5ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIFByb3h5LnRvU3RyaW5nKCkubWF0Y2goL25hdGl2ZSBjb2RlLyk7XG5cbiAgaWYgKGhhc1Byb3h5KSB7XG4gICAgdmFyIGlzQnVpbHRJbk1vZGlmaWVyID0gbWFrZU1hcCgnc3RvcCxwcmV2ZW50LHNlbGYsY3RybCxzaGlmdCxhbHQsbWV0YSxleGFjdCcpO1xuICAgIGNvbmZpZy5rZXlDb2RlcyA9IG5ldyBQcm94eShjb25maWcua2V5Q29kZXMsIHtcbiAgICAgIHNldDogZnVuY3Rpb24gc2V0ICh0YXJnZXQsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGlzQnVpbHRJbk1vZGlmaWVyKGtleSkpIHtcbiAgICAgICAgICB3YXJuKChcIkF2b2lkIG92ZXJ3cml0aW5nIGJ1aWx0LWluIG1vZGlmaWVyIGluIGNvbmZpZy5rZXlDb2RlczogLlwiICsga2V5KSk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGFyZ2V0W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB2YXIgaGFzSGFuZGxlciA9IHtcbiAgICBoYXM6IGZ1bmN0aW9uIGhhcyAodGFyZ2V0LCBrZXkpIHtcbiAgICAgIHZhciBoYXMgPSBrZXkgaW4gdGFyZ2V0O1xuICAgICAgdmFyIGlzQWxsb3dlZCA9IGFsbG93ZWRHbG9iYWxzKGtleSkgfHwga2V5LmNoYXJBdCgwKSA9PT0gJ18nO1xuICAgICAgaWYgKCFoYXMgJiYgIWlzQWxsb3dlZCkge1xuICAgICAgICB3YXJuTm9uUHJlc2VudCh0YXJnZXQsIGtleSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzIHx8ICFpc0FsbG93ZWRcbiAgICB9XG4gIH07XG5cbiAgdmFyIGdldEhhbmRsZXIgPSB7XG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQgKHRhcmdldCwga2V5KSB7XG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgIShrZXkgaW4gdGFyZ2V0KSkge1xuICAgICAgICB3YXJuTm9uUHJlc2VudCh0YXJnZXQsIGtleSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGFyZ2V0W2tleV1cbiAgICB9XG4gIH07XG5cbiAgaW5pdFByb3h5ID0gZnVuY3Rpb24gaW5pdFByb3h5ICh2bSkge1xuICAgIGlmIChoYXNQcm94eSkge1xuICAgICAgLy8gZGV0ZXJtaW5lIHdoaWNoIHByb3h5IGhhbmRsZXIgdG8gdXNlXG4gICAgICB2YXIgb3B0aW9ucyA9IHZtLiRvcHRpb25zO1xuICAgICAgdmFyIGhhbmRsZXJzID0gb3B0aW9ucy5yZW5kZXIgJiYgb3B0aW9ucy5yZW5kZXIuX3dpdGhTdHJpcHBlZFxuICAgICAgICA/IGdldEhhbmRsZXJcbiAgICAgICAgOiBoYXNIYW5kbGVyO1xuICAgICAgdm0uX3JlbmRlclByb3h5ID0gbmV3IFByb3h5KHZtLCBoYW5kbGVycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZtLl9yZW5kZXJQcm94eSA9IHZtO1xuICAgIH1cbiAgfTtcbn1cblxuLyogICovXG5cbnZhciBzZWVuT2JqZWN0cyA9IG5ldyBfU2V0KCk7XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgdHJhdmVyc2UgYW4gb2JqZWN0IHRvIGV2b2tlIGFsbCBjb252ZXJ0ZWRcbiAqIGdldHRlcnMsIHNvIHRoYXQgZXZlcnkgbmVzdGVkIHByb3BlcnR5IGluc2lkZSB0aGUgb2JqZWN0XG4gKiBpcyBjb2xsZWN0ZWQgYXMgYSBcImRlZXBcIiBkZXBlbmRlbmN5LlxuICovXG5mdW5jdGlvbiB0cmF2ZXJzZSAodmFsKSB7XG4gIF90cmF2ZXJzZSh2YWwsIHNlZW5PYmplY3RzKTtcbiAgc2Vlbk9iamVjdHMuY2xlYXIoKTtcbn1cblxuZnVuY3Rpb24gX3RyYXZlcnNlICh2YWwsIHNlZW4pIHtcbiAgdmFyIGksIGtleXM7XG4gIHZhciBpc0EgPSBBcnJheS5pc0FycmF5KHZhbCk7XG4gIGlmICgoIWlzQSAmJiAhaXNPYmplY3QodmFsKSkgfHwgT2JqZWN0LmlzRnJvemVuKHZhbCkpIHtcbiAgICByZXR1cm5cbiAgfVxuICBpZiAodmFsLl9fb2JfXykge1xuICAgIHZhciBkZXBJZCA9IHZhbC5fX29iX18uZGVwLmlkO1xuICAgIGlmIChzZWVuLmhhcyhkZXBJZCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBzZWVuLmFkZChkZXBJZCk7XG4gIH1cbiAgaWYgKGlzQSkge1xuICAgIGkgPSB2YWwubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHsgX3RyYXZlcnNlKHZhbFtpXSwgc2Vlbik7IH1cbiAgfSBlbHNlIHtcbiAgICBrZXlzID0gT2JqZWN0LmtleXModmFsKTtcbiAgICBpID0ga2V5cy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkgeyBfdHJhdmVyc2UodmFsW2tleXNbaV1dLCBzZWVuKTsgfVxuICB9XG59XG5cbnZhciBtYXJrO1xudmFyIG1lYXN1cmU7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHZhciBwZXJmID0gaW5Ccm93c2VyICYmIHdpbmRvdy5wZXJmb3JtYW5jZTtcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChcbiAgICBwZXJmICYmXG4gICAgcGVyZi5tYXJrICYmXG4gICAgcGVyZi5tZWFzdXJlICYmXG4gICAgcGVyZi5jbGVhck1hcmtzICYmXG4gICAgcGVyZi5jbGVhck1lYXN1cmVzXG4gICkge1xuICAgIG1hcmsgPSBmdW5jdGlvbiAodGFnKSB7IHJldHVybiBwZXJmLm1hcmsodGFnKTsgfTtcbiAgICBtZWFzdXJlID0gZnVuY3Rpb24gKG5hbWUsIHN0YXJ0VGFnLCBlbmRUYWcpIHtcbiAgICAgIHBlcmYubWVhc3VyZShuYW1lLCBzdGFydFRhZywgZW5kVGFnKTtcbiAgICAgIHBlcmYuY2xlYXJNYXJrcyhzdGFydFRhZyk7XG4gICAgICBwZXJmLmNsZWFyTWFya3MoZW5kVGFnKTtcbiAgICAgIHBlcmYuY2xlYXJNZWFzdXJlcyhuYW1lKTtcbiAgICB9O1xuICB9XG59XG5cbi8qICAqL1xuXG52YXIgbm9ybWFsaXplRXZlbnQgPSBjYWNoZWQoZnVuY3Rpb24gKG5hbWUpIHtcbiAgdmFyIHBhc3NpdmUgPSBuYW1lLmNoYXJBdCgwKSA9PT0gJyYnO1xuICBuYW1lID0gcGFzc2l2ZSA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lO1xuICB2YXIgb25jZSQkMSA9IG5hbWUuY2hhckF0KDApID09PSAnfic7IC8vIFByZWZpeGVkIGxhc3QsIGNoZWNrZWQgZmlyc3RcbiAgbmFtZSA9IG9uY2UkJDEgPyBuYW1lLnNsaWNlKDEpIDogbmFtZTtcbiAgdmFyIGNhcHR1cmUgPSBuYW1lLmNoYXJBdCgwKSA9PT0gJyEnO1xuICBuYW1lID0gY2FwdHVyZSA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lO1xuICByZXR1cm4ge1xuICAgIG5hbWU6IG5hbWUsXG4gICAgb25jZTogb25jZSQkMSxcbiAgICBjYXB0dXJlOiBjYXB0dXJlLFxuICAgIHBhc3NpdmU6IHBhc3NpdmVcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUZuSW52b2tlciAoZm5zKSB7XG4gIGZ1bmN0aW9uIGludm9rZXIgKCkge1xuICAgIHZhciBhcmd1bWVudHMkMSA9IGFyZ3VtZW50cztcblxuICAgIHZhciBmbnMgPSBpbnZva2VyLmZucztcbiAgICBpZiAoQXJyYXkuaXNBcnJheShmbnMpKSB7XG4gICAgICB2YXIgY2xvbmVkID0gZm5zLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsb25lZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjbG9uZWRbaV0uYXBwbHkobnVsbCwgYXJndW1lbnRzJDEpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyByZXR1cm4gaGFuZGxlciByZXR1cm4gdmFsdWUgZm9yIHNpbmdsZSBoYW5kbGVyc1xuICAgICAgcmV0dXJuIGZucy5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgfVxuICB9XG4gIGludm9rZXIuZm5zID0gZm5zO1xuICByZXR1cm4gaW52b2tlclxufVxuXG5mdW5jdGlvbiB1cGRhdGVMaXN0ZW5lcnMgKFxuICBvbixcbiAgb2xkT24sXG4gIGFkZCxcbiAgcmVtb3ZlJCQxLFxuICB2bVxuKSB7XG4gIHZhciBuYW1lLCBkZWYsIGN1ciwgb2xkLCBldmVudDtcbiAgZm9yIChuYW1lIGluIG9uKSB7XG4gICAgZGVmID0gY3VyID0gb25bbmFtZV07XG4gICAgb2xkID0gb2xkT25bbmFtZV07XG4gICAgZXZlbnQgPSBub3JtYWxpemVFdmVudChuYW1lKTtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAodHJ1ZSAmJiBpc1BsYWluT2JqZWN0KGRlZikpIHtcbiAgICAgIGN1ciA9IGRlZi5oYW5kbGVyO1xuICAgICAgZXZlbnQucGFyYW1zID0gZGVmLnBhcmFtcztcbiAgICB9XG4gICAgaWYgKGlzVW5kZWYoY3VyKSkge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgICBcIkludmFsaWQgaGFuZGxlciBmb3IgZXZlbnQgXFxcIlwiICsgKGV2ZW50Lm5hbWUpICsgXCJcXFwiOiBnb3QgXCIgKyBTdHJpbmcoY3VyKSxcbiAgICAgICAgdm1cbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChpc1VuZGVmKG9sZCkpIHtcbiAgICAgIGlmIChpc1VuZGVmKGN1ci5mbnMpKSB7XG4gICAgICAgIGN1ciA9IG9uW25hbWVdID0gY3JlYXRlRm5JbnZva2VyKGN1cik7XG4gICAgICB9XG4gICAgICBhZGQoZXZlbnQubmFtZSwgY3VyLCBldmVudC5vbmNlLCBldmVudC5jYXB0dXJlLCBldmVudC5wYXNzaXZlLCBldmVudC5wYXJhbXMpO1xuICAgIH0gZWxzZSBpZiAoY3VyICE9PSBvbGQpIHtcbiAgICAgIG9sZC5mbnMgPSBjdXI7XG4gICAgICBvbltuYW1lXSA9IG9sZDtcbiAgICB9XG4gIH1cbiAgZm9yIChuYW1lIGluIG9sZE9uKSB7XG4gICAgaWYgKGlzVW5kZWYob25bbmFtZV0pKSB7XG4gICAgICBldmVudCA9IG5vcm1hbGl6ZUV2ZW50KG5hbWUpO1xuICAgICAgcmVtb3ZlJCQxKGV2ZW50Lm5hbWUsIG9sZE9uW25hbWVdLCBldmVudC5jYXB0dXJlKTtcbiAgICB9XG4gIH1cbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIG1lcmdlVk5vZGVIb29rIChkZWYsIGhvb2tLZXksIGhvb2spIHtcbiAgaWYgKGRlZiBpbnN0YW5jZW9mIFZOb2RlKSB7XG4gICAgZGVmID0gZGVmLmRhdGEuaG9vayB8fCAoZGVmLmRhdGEuaG9vayA9IHt9KTtcbiAgfVxuICB2YXIgaW52b2tlcjtcbiAgdmFyIG9sZEhvb2sgPSBkZWZbaG9va0tleV07XG5cbiAgZnVuY3Rpb24gd3JhcHBlZEhvb2sgKCkge1xuICAgIGhvb2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAvLyBpbXBvcnRhbnQ6IHJlbW92ZSBtZXJnZWQgaG9vayB0byBlbnN1cmUgaXQncyBjYWxsZWQgb25seSBvbmNlXG4gICAgLy8gYW5kIHByZXZlbnQgbWVtb3J5IGxlYWtcbiAgICByZW1vdmUoaW52b2tlci5mbnMsIHdyYXBwZWRIb29rKTtcbiAgfVxuXG4gIGlmIChpc1VuZGVmKG9sZEhvb2spKSB7XG4gICAgLy8gbm8gZXhpc3RpbmcgaG9va1xuICAgIGludm9rZXIgPSBjcmVhdGVGbkludm9rZXIoW3dyYXBwZWRIb29rXSk7XG4gIH0gZWxzZSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKGlzRGVmKG9sZEhvb2suZm5zKSAmJiBpc1RydWUob2xkSG9vay5tZXJnZWQpKSB7XG4gICAgICAvLyBhbHJlYWR5IGEgbWVyZ2VkIGludm9rZXJcbiAgICAgIGludm9rZXIgPSBvbGRIb29rO1xuICAgICAgaW52b2tlci5mbnMucHVzaCh3cmFwcGVkSG9vayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGV4aXN0aW5nIHBsYWluIGhvb2tcbiAgICAgIGludm9rZXIgPSBjcmVhdGVGbkludm9rZXIoW29sZEhvb2ssIHdyYXBwZWRIb29rXSk7XG4gICAgfVxuICB9XG5cbiAgaW52b2tlci5tZXJnZWQgPSB0cnVlO1xuICBkZWZbaG9va0tleV0gPSBpbnZva2VyO1xufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gZXh0cmFjdFByb3BzRnJvbVZOb2RlRGF0YSAoXG4gIGRhdGEsXG4gIEN0b3IsXG4gIHRhZ1xuKSB7XG4gIC8vIHdlIGFyZSBvbmx5IGV4dHJhY3RpbmcgcmF3IHZhbHVlcyBoZXJlLlxuICAvLyB2YWxpZGF0aW9uIGFuZCBkZWZhdWx0IHZhbHVlcyBhcmUgaGFuZGxlZCBpbiB0aGUgY2hpbGRcbiAgLy8gY29tcG9uZW50IGl0c2VsZi5cbiAgdmFyIHByb3BPcHRpb25zID0gQ3Rvci5vcHRpb25zLnByb3BzO1xuICBpZiAoaXNVbmRlZihwcm9wT3B0aW9ucykpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgcmVzID0ge307XG4gIHZhciBhdHRycyA9IGRhdGEuYXR0cnM7XG4gIHZhciBwcm9wcyA9IGRhdGEucHJvcHM7XG4gIGlmIChpc0RlZihhdHRycykgfHwgaXNEZWYocHJvcHMpKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHByb3BPcHRpb25zKSB7XG4gICAgICB2YXIgYWx0S2V5ID0gaHlwaGVuYXRlKGtleSk7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICB2YXIga2V5SW5Mb3dlckNhc2UgPSBrZXkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGtleSAhPT0ga2V5SW5Mb3dlckNhc2UgJiZcbiAgICAgICAgICBhdHRycyAmJiBoYXNPd24oYXR0cnMsIGtleUluTG93ZXJDYXNlKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aXAoXG4gICAgICAgICAgICBcIlByb3AgXFxcIlwiICsga2V5SW5Mb3dlckNhc2UgKyBcIlxcXCIgaXMgcGFzc2VkIHRvIGNvbXBvbmVudCBcIiArXG4gICAgICAgICAgICAoZm9ybWF0Q29tcG9uZW50TmFtZSh0YWcgfHwgQ3RvcikpICsgXCIsIGJ1dCB0aGUgZGVjbGFyZWQgcHJvcCBuYW1lIGlzXCIgK1xuICAgICAgICAgICAgXCIgXFxcIlwiICsga2V5ICsgXCJcXFwiLiBcIiArXG4gICAgICAgICAgICBcIk5vdGUgdGhhdCBIVE1MIGF0dHJpYnV0ZXMgYXJlIGNhc2UtaW5zZW5zaXRpdmUgYW5kIGNhbWVsQ2FzZWQgXCIgK1xuICAgICAgICAgICAgXCJwcm9wcyBuZWVkIHRvIHVzZSB0aGVpciBrZWJhYi1jYXNlIGVxdWl2YWxlbnRzIHdoZW4gdXNpbmcgaW4tRE9NIFwiICtcbiAgICAgICAgICAgIFwidGVtcGxhdGVzLiBZb3Ugc2hvdWxkIHByb2JhYmx5IHVzZSBcXFwiXCIgKyBhbHRLZXkgKyBcIlxcXCIgaW5zdGVhZCBvZiBcXFwiXCIgKyBrZXkgKyBcIlxcXCIuXCJcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjaGVja1Byb3AocmVzLCBwcm9wcywga2V5LCBhbHRLZXksIHRydWUpIHx8XG4gICAgICBjaGVja1Byb3AocmVzLCBhdHRycywga2V5LCBhbHRLZXksIGZhbHNlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBjaGVja1Byb3AgKFxuICByZXMsXG4gIGhhc2gsXG4gIGtleSxcbiAgYWx0S2V5LFxuICBwcmVzZXJ2ZVxuKSB7XG4gIGlmIChpc0RlZihoYXNoKSkge1xuICAgIGlmIChoYXNPd24oaGFzaCwga2V5KSkge1xuICAgICAgcmVzW2tleV0gPSBoYXNoW2tleV07XG4gICAgICBpZiAoIXByZXNlcnZlKSB7XG4gICAgICAgIGRlbGV0ZSBoYXNoW2tleV07XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSBpZiAoaGFzT3duKGhhc2gsIGFsdEtleSkpIHtcbiAgICAgIHJlc1trZXldID0gaGFzaFthbHRLZXldO1xuICAgICAgaWYgKCFwcmVzZXJ2ZSkge1xuICAgICAgICBkZWxldGUgaGFzaFthbHRLZXldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qICAqL1xuXG4vLyBUaGUgdGVtcGxhdGUgY29tcGlsZXIgYXR0ZW1wdHMgdG8gbWluaW1pemUgdGhlIG5lZWQgZm9yIG5vcm1hbGl6YXRpb24gYnlcbi8vIHN0YXRpY2FsbHkgYW5hbHl6aW5nIHRoZSB0ZW1wbGF0ZSBhdCBjb21waWxlIHRpbWUuXG4vL1xuLy8gRm9yIHBsYWluIEhUTUwgbWFya3VwLCBub3JtYWxpemF0aW9uIGNhbiBiZSBjb21wbGV0ZWx5IHNraXBwZWQgYmVjYXVzZSB0aGVcbi8vIGdlbmVyYXRlZCByZW5kZXIgZnVuY3Rpb24gaXMgZ3VhcmFudGVlZCB0byByZXR1cm4gQXJyYXk8Vk5vZGU+LiBUaGVyZSBhcmVcbi8vIHR3byBjYXNlcyB3aGVyZSBleHRyYSBub3JtYWxpemF0aW9uIGlzIG5lZWRlZDpcblxuLy8gMS4gV2hlbiB0aGUgY2hpbGRyZW4gY29udGFpbnMgY29tcG9uZW50cyAtIGJlY2F1c2UgYSBmdW5jdGlvbmFsIGNvbXBvbmVudFxuLy8gbWF5IHJldHVybiBhbiBBcnJheSBpbnN0ZWFkIG9mIGEgc2luZ2xlIHJvb3QuIEluIHRoaXMgY2FzZSwganVzdCBhIHNpbXBsZVxuLy8gbm9ybWFsaXphdGlvbiBpcyBuZWVkZWQgLSBpZiBhbnkgY2hpbGQgaXMgYW4gQXJyYXksIHdlIGZsYXR0ZW4gdGhlIHdob2xlXG4vLyB0aGluZyB3aXRoIEFycmF5LnByb3RvdHlwZS5jb25jYXQuIEl0IGlzIGd1YXJhbnRlZWQgdG8gYmUgb25seSAxLWxldmVsIGRlZXBcbi8vIGJlY2F1c2UgZnVuY3Rpb25hbCBjb21wb25lbnRzIGFscmVhZHkgbm9ybWFsaXplIHRoZWlyIG93biBjaGlsZHJlbi5cbmZ1bmN0aW9uIHNpbXBsZU5vcm1hbGl6ZUNoaWxkcmVuIChjaGlsZHJlbikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW5baV0pKSB7XG4gICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgY2hpbGRyZW4pXG4gICAgfVxuICB9XG4gIHJldHVybiBjaGlsZHJlblxufVxuXG4vLyAyLiBXaGVuIHRoZSBjaGlsZHJlbiBjb250YWlucyBjb25zdHJ1Y3RzIHRoYXQgYWx3YXlzIGdlbmVyYXRlZCBuZXN0ZWQgQXJyYXlzLFxuLy8gZS5nLiA8dGVtcGxhdGU+LCA8c2xvdD4sIHYtZm9yLCBvciB3aGVuIHRoZSBjaGlsZHJlbiBpcyBwcm92aWRlZCBieSB1c2VyXG4vLyB3aXRoIGhhbmQtd3JpdHRlbiByZW5kZXIgZnVuY3Rpb25zIC8gSlNYLiBJbiBzdWNoIGNhc2VzIGEgZnVsbCBub3JtYWxpemF0aW9uXG4vLyBpcyBuZWVkZWQgdG8gY2F0ZXIgdG8gYWxsIHBvc3NpYmxlIHR5cGVzIG9mIGNoaWxkcmVuIHZhbHVlcy5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNoaWxkcmVuIChjaGlsZHJlbikge1xuICByZXR1cm4gaXNQcmltaXRpdmUoY2hpbGRyZW4pXG4gICAgPyBbY3JlYXRlVGV4dFZOb2RlKGNoaWxkcmVuKV1cbiAgICA6IEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pXG4gICAgICA/IG5vcm1hbGl6ZUFycmF5Q2hpbGRyZW4oY2hpbGRyZW4pXG4gICAgICA6IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBpc1RleHROb2RlIChub2RlKSB7XG4gIHJldHVybiBpc0RlZihub2RlKSAmJiBpc0RlZihub2RlLnRleHQpICYmIGlzRmFsc2Uobm9kZS5pc0NvbW1lbnQpXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5Q2hpbGRyZW4gKGNoaWxkcmVuLCBuZXN0ZWRJbmRleCkge1xuICB2YXIgcmVzID0gW107XG4gIHZhciBpLCBjLCBsYXN0SW5kZXgsIGxhc3Q7XG4gIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGMgPSBjaGlsZHJlbltpXTtcbiAgICBpZiAoaXNVbmRlZihjKSB8fCB0eXBlb2YgYyA9PT0gJ2Jvb2xlYW4nKSB7IGNvbnRpbnVlIH1cbiAgICBsYXN0SW5kZXggPSByZXMubGVuZ3RoIC0gMTtcbiAgICBsYXN0ID0gcmVzW2xhc3RJbmRleF07XG4gICAgLy8gIG5lc3RlZFxuICAgIGlmIChBcnJheS5pc0FycmF5KGMpKSB7XG4gICAgICBpZiAoYy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGMgPSBub3JtYWxpemVBcnJheUNoaWxkcmVuKGMsICgobmVzdGVkSW5kZXggfHwgJycpICsgXCJfXCIgKyBpKSk7XG4gICAgICAgIC8vIG1lcmdlIGFkamFjZW50IHRleHQgbm9kZXNcbiAgICAgICAgaWYgKGlzVGV4dE5vZGUoY1swXSkgJiYgaXNUZXh0Tm9kZShsYXN0KSkge1xuICAgICAgICAgIHJlc1tsYXN0SW5kZXhdID0gY3JlYXRlVGV4dFZOb2RlKGxhc3QudGV4dCArIChjWzBdKS50ZXh0KTtcbiAgICAgICAgICBjLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnB1c2guYXBwbHkocmVzLCBjKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzUHJpbWl0aXZlKGMpKSB7XG4gICAgICBpZiAoaXNUZXh0Tm9kZShsYXN0KSkge1xuICAgICAgICAvLyBtZXJnZSBhZGphY2VudCB0ZXh0IG5vZGVzXG4gICAgICAgIC8vIHRoaXMgaXMgbmVjZXNzYXJ5IGZvciBTU1IgaHlkcmF0aW9uIGJlY2F1c2UgdGV4dCBub2RlcyBhcmVcbiAgICAgICAgLy8gZXNzZW50aWFsbHkgbWVyZ2VkIHdoZW4gcmVuZGVyZWQgdG8gSFRNTCBzdHJpbmdzXG4gICAgICAgIHJlc1tsYXN0SW5kZXhdID0gY3JlYXRlVGV4dFZOb2RlKGxhc3QudGV4dCArIGMpO1xuICAgICAgfSBlbHNlIGlmIChjICE9PSAnJykge1xuICAgICAgICAvLyBjb252ZXJ0IHByaW1pdGl2ZSB0byB2bm9kZVxuICAgICAgICByZXMucHVzaChjcmVhdGVUZXh0Vk5vZGUoYykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNUZXh0Tm9kZShjKSAmJiBpc1RleHROb2RlKGxhc3QpKSB7XG4gICAgICAgIC8vIG1lcmdlIGFkamFjZW50IHRleHQgbm9kZXNcbiAgICAgICAgcmVzW2xhc3RJbmRleF0gPSBjcmVhdGVUZXh0Vk5vZGUobGFzdC50ZXh0ICsgYy50ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGRlZmF1bHQga2V5IGZvciBuZXN0ZWQgYXJyYXkgY2hpbGRyZW4gKGxpa2VseSBnZW5lcmF0ZWQgYnkgdi1mb3IpXG4gICAgICAgIGlmIChpc1RydWUoY2hpbGRyZW4uX2lzVkxpc3QpICYmXG4gICAgICAgICAgaXNEZWYoYy50YWcpICYmXG4gICAgICAgICAgaXNVbmRlZihjLmtleSkgJiZcbiAgICAgICAgICBpc0RlZihuZXN0ZWRJbmRleCkpIHtcbiAgICAgICAgICBjLmtleSA9IFwiX192bGlzdFwiICsgbmVzdGVkSW5kZXggKyBcIl9cIiArIGkgKyBcIl9fXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnB1c2goYyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGVuc3VyZUN0b3IgKGNvbXAsIGJhc2UpIHtcbiAgaWYgKFxuICAgIGNvbXAuX19lc01vZHVsZSB8fFxuICAgIChoYXNTeW1ib2wgJiYgY29tcFtTeW1ib2wudG9TdHJpbmdUYWddID09PSAnTW9kdWxlJylcbiAgKSB7XG4gICAgY29tcCA9IGNvbXAuZGVmYXVsdDtcbiAgfVxuICByZXR1cm4gaXNPYmplY3QoY29tcClcbiAgICA/IGJhc2UuZXh0ZW5kKGNvbXApXG4gICAgOiBjb21wXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFzeW5jUGxhY2Vob2xkZXIgKFxuICBmYWN0b3J5LFxuICBkYXRhLFxuICBjb250ZXh0LFxuICBjaGlsZHJlbixcbiAgdGFnXG4pIHtcbiAgdmFyIG5vZGUgPSBjcmVhdGVFbXB0eVZOb2RlKCk7XG4gIG5vZGUuYXN5bmNGYWN0b3J5ID0gZmFjdG9yeTtcbiAgbm9kZS5hc3luY01ldGEgPSB7IGRhdGE6IGRhdGEsIGNvbnRleHQ6IGNvbnRleHQsIGNoaWxkcmVuOiBjaGlsZHJlbiwgdGFnOiB0YWcgfTtcbiAgcmV0dXJuIG5vZGVcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUFzeW5jQ29tcG9uZW50IChcbiAgZmFjdG9yeSxcbiAgYmFzZUN0b3IsXG4gIGNvbnRleHRcbikge1xuICBpZiAoaXNUcnVlKGZhY3RvcnkuZXJyb3IpICYmIGlzRGVmKGZhY3RvcnkuZXJyb3JDb21wKSkge1xuICAgIHJldHVybiBmYWN0b3J5LmVycm9yQ29tcFxuICB9XG5cbiAgaWYgKGlzRGVmKGZhY3RvcnkucmVzb2x2ZWQpKSB7XG4gICAgcmV0dXJuIGZhY3RvcnkucmVzb2x2ZWRcbiAgfVxuXG4gIGlmIChpc1RydWUoZmFjdG9yeS5sb2FkaW5nKSAmJiBpc0RlZihmYWN0b3J5LmxvYWRpbmdDb21wKSkge1xuICAgIHJldHVybiBmYWN0b3J5LmxvYWRpbmdDb21wXG4gIH1cblxuICBpZiAoaXNEZWYoZmFjdG9yeS5jb250ZXh0cykpIHtcbiAgICAvLyBhbHJlYWR5IHBlbmRpbmdcbiAgICBmYWN0b3J5LmNvbnRleHRzLnB1c2goY29udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGNvbnRleHRzID0gZmFjdG9yeS5jb250ZXh0cyA9IFtjb250ZXh0XTtcbiAgICB2YXIgc3luYyA9IHRydWU7XG5cbiAgICB2YXIgZm9yY2VSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNvbnRleHRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjb250ZXh0c1tpXS4kZm9yY2VVcGRhdGUoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHJlc29sdmUgPSBvbmNlKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIC8vIGNhY2hlIHJlc29sdmVkXG4gICAgICBmYWN0b3J5LnJlc29sdmVkID0gZW5zdXJlQ3RvcihyZXMsIGJhc2VDdG9yKTtcbiAgICAgIC8vIGludm9rZSBjYWxsYmFja3Mgb25seSBpZiB0aGlzIGlzIG5vdCBhIHN5bmNocm9ub3VzIHJlc29sdmVcbiAgICAgIC8vIChhc3luYyByZXNvbHZlcyBhcmUgc2hpbW1lZCBhcyBzeW5jaHJvbm91cyBkdXJpbmcgU1NSKVxuICAgICAgaWYgKCFzeW5jKSB7XG4gICAgICAgIGZvcmNlUmVuZGVyKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVqZWN0ID0gb25jZShmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAgIFwiRmFpbGVkIHRvIHJlc29sdmUgYXN5bmMgY29tcG9uZW50OiBcIiArIChTdHJpbmcoZmFjdG9yeSkpICtcbiAgICAgICAgKHJlYXNvbiA/IChcIlxcblJlYXNvbjogXCIgKyByZWFzb24pIDogJycpXG4gICAgICApO1xuICAgICAgaWYgKGlzRGVmKGZhY3RvcnkuZXJyb3JDb21wKSkge1xuICAgICAgICBmYWN0b3J5LmVycm9yID0gdHJ1ZTtcbiAgICAgICAgZm9yY2VSZW5kZXIoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciByZXMgPSBmYWN0b3J5KHJlc29sdmUsIHJlamVjdCk7XG5cbiAgICBpZiAoaXNPYmplY3QocmVzKSkge1xuICAgICAgaWYgKHR5cGVvZiByZXMudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyAoKSA9PiBQcm9taXNlXG4gICAgICAgIGlmIChpc1VuZGVmKGZhY3RvcnkucmVzb2x2ZWQpKSB7XG4gICAgICAgICAgcmVzLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc0RlZihyZXMuY29tcG9uZW50KSAmJiB0eXBlb2YgcmVzLmNvbXBvbmVudC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJlcy5jb21wb25lbnQudGhlbihyZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgIGlmIChpc0RlZihyZXMuZXJyb3IpKSB7XG4gICAgICAgICAgZmFjdG9yeS5lcnJvckNvbXAgPSBlbnN1cmVDdG9yKHJlcy5lcnJvciwgYmFzZUN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzRGVmKHJlcy5sb2FkaW5nKSkge1xuICAgICAgICAgIGZhY3RvcnkubG9hZGluZ0NvbXAgPSBlbnN1cmVDdG9yKHJlcy5sb2FkaW5nLCBiYXNlQ3Rvcik7XG4gICAgICAgICAgaWYgKHJlcy5kZWxheSA9PT0gMCkge1xuICAgICAgICAgICAgZmFjdG9yeS5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChpc1VuZGVmKGZhY3RvcnkucmVzb2x2ZWQpICYmIGlzVW5kZWYoZmFjdG9yeS5lcnJvcikpIHtcbiAgICAgICAgICAgICAgICBmYWN0b3J5LmxvYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcmNlUmVuZGVyKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHJlcy5kZWxheSB8fCAyMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0RlZihyZXMudGltZW91dCkpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChpc1VuZGVmKGZhY3RvcnkucmVzb2x2ZWQpKSB7XG4gICAgICAgICAgICAgIHJlamVjdChcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nXG4gICAgICAgICAgICAgICAgICA/IChcInRpbWVvdXQgKFwiICsgKHJlcy50aW1lb3V0KSArIFwibXMpXCIpXG4gICAgICAgICAgICAgICAgICA6IG51bGxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCByZXMudGltZW91dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBzeW5jID0gZmFsc2U7XG4gICAgLy8gcmV0dXJuIGluIGNhc2UgcmVzb2x2ZWQgc3luY2hyb25vdXNseVxuICAgIHJldHVybiBmYWN0b3J5LmxvYWRpbmdcbiAgICAgID8gZmFjdG9yeS5sb2FkaW5nQ29tcFxuICAgICAgOiBmYWN0b3J5LnJlc29sdmVkXG4gIH1cbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGlzQXN5bmNQbGFjZWhvbGRlciAobm9kZSkge1xuICByZXR1cm4gbm9kZS5pc0NvbW1lbnQgJiYgbm9kZS5hc3luY0ZhY3Rvcnlcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGdldEZpcnN0Q29tcG9uZW50Q2hpbGQgKGNoaWxkcmVuKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjID0gY2hpbGRyZW5baV07XG4gICAgICBpZiAoaXNEZWYoYykgJiYgKGlzRGVmKGMuY29tcG9uZW50T3B0aW9ucykgfHwgaXNBc3luY1BsYWNlaG9sZGVyKGMpKSkge1xuICAgICAgICByZXR1cm4gY1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiAgKi9cblxuLyogICovXG5cbmZ1bmN0aW9uIGluaXRFdmVudHMgKHZtKSB7XG4gIHZtLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB2bS5faGFzSG9va0V2ZW50ID0gZmFsc2U7XG4gIC8vIGluaXQgcGFyZW50IGF0dGFjaGVkIGV2ZW50c1xuICB2YXIgbGlzdGVuZXJzID0gdm0uJG9wdGlvbnMuX3BhcmVudExpc3RlbmVycztcbiAgaWYgKGxpc3RlbmVycykge1xuICAgIHVwZGF0ZUNvbXBvbmVudExpc3RlbmVycyh2bSwgbGlzdGVuZXJzKTtcbiAgfVxufVxuXG52YXIgdGFyZ2V0O1xuXG5mdW5jdGlvbiBhZGQgKGV2ZW50LCBmbiwgb25jZSkge1xuICBpZiAob25jZSkge1xuICAgIHRhcmdldC4kb25jZShldmVudCwgZm4pO1xuICB9IGVsc2Uge1xuICAgIHRhcmdldC4kb24oZXZlbnQsIGZuKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmUkMSAoZXZlbnQsIGZuKSB7XG4gIHRhcmdldC4kb2ZmKGV2ZW50LCBmbik7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNvbXBvbmVudExpc3RlbmVycyAoXG4gIHZtLFxuICBsaXN0ZW5lcnMsXG4gIG9sZExpc3RlbmVyc1xuKSB7XG4gIHRhcmdldCA9IHZtO1xuICB1cGRhdGVMaXN0ZW5lcnMobGlzdGVuZXJzLCBvbGRMaXN0ZW5lcnMgfHwge30sIGFkZCwgcmVtb3ZlJDEsIHZtKTtcbiAgdGFyZ2V0ID0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBldmVudHNNaXhpbiAoVnVlKSB7XG4gIHZhciBob29rUkUgPSAvXmhvb2s6LztcbiAgVnVlLnByb3RvdHlwZS4kb24gPSBmdW5jdGlvbiAoZXZlbnQsIGZuKSB7XG4gICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV2ZW50KSkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBldmVudC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdGhpcyQxLiRvbihldmVudFtpXSwgZm4pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAodm0uX2V2ZW50c1tldmVudF0gfHwgKHZtLl9ldmVudHNbZXZlbnRdID0gW10pKS5wdXNoKGZuKTtcbiAgICAgIC8vIG9wdGltaXplIGhvb2s6ZXZlbnQgY29zdCBieSB1c2luZyBhIGJvb2xlYW4gZmxhZyBtYXJrZWQgYXQgcmVnaXN0cmF0aW9uXG4gICAgICAvLyBpbnN0ZWFkIG9mIGEgaGFzaCBsb29rdXBcbiAgICAgIGlmIChob29rUkUudGVzdChldmVudCkpIHtcbiAgICAgICAgdm0uX2hhc0hvb2tFdmVudCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2bVxuICB9O1xuXG4gIFZ1ZS5wcm90b3R5cGUuJG9uY2UgPSBmdW5jdGlvbiAoZXZlbnQsIGZuKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICBmdW5jdGlvbiBvbiAoKSB7XG4gICAgICB2bS4kb2ZmKGV2ZW50LCBvbik7XG4gICAgICBmbi5hcHBseSh2bSwgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgb24uZm4gPSBmbjtcbiAgICB2bS4kb24oZXZlbnQsIG9uKTtcbiAgICByZXR1cm4gdm1cbiAgfTtcblxuICBWdWUucHJvdG90eXBlLiRvZmYgPSBmdW5jdGlvbiAoZXZlbnQsIGZuKSB7XG4gICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIC8vIGFsbFxuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgdm0uX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICByZXR1cm4gdm1cbiAgICB9XG4gICAgLy8gYXJyYXkgb2YgZXZlbnRzXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZXZlbnQpKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGV2ZW50Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzJDEuJG9mZihldmVudFtpXSwgZm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZtXG4gICAgfVxuICAgIC8vIHNwZWNpZmljIGV2ZW50XG4gICAgdmFyIGNicyA9IHZtLl9ldmVudHNbZXZlbnRdO1xuICAgIGlmICghY2JzKSB7XG4gICAgICByZXR1cm4gdm1cbiAgICB9XG4gICAgaWYgKCFmbikge1xuICAgICAgdm0uX2V2ZW50c1tldmVudF0gPSBudWxsO1xuICAgICAgcmV0dXJuIHZtXG4gICAgfVxuICAgIGlmIChmbikge1xuICAgICAgLy8gc3BlY2lmaWMgaGFuZGxlclxuICAgICAgdmFyIGNiO1xuICAgICAgdmFyIGkkMSA9IGNicy5sZW5ndGg7XG4gICAgICB3aGlsZSAoaSQxLS0pIHtcbiAgICAgICAgY2IgPSBjYnNbaSQxXTtcbiAgICAgICAgaWYgKGNiID09PSBmbiB8fCBjYi5mbiA9PT0gZm4pIHtcbiAgICAgICAgICBjYnMuc3BsaWNlKGkkMSwgMSk7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdm1cbiAgfTtcblxuICBWdWUucHJvdG90eXBlLiRlbWl0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgdmFyIGxvd2VyQ2FzZUV2ZW50ID0gZXZlbnQudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChsb3dlckNhc2VFdmVudCAhPT0gZXZlbnQgJiYgdm0uX2V2ZW50c1tsb3dlckNhc2VFdmVudF0pIHtcbiAgICAgICAgdGlwKFxuICAgICAgICAgIFwiRXZlbnQgXFxcIlwiICsgbG93ZXJDYXNlRXZlbnQgKyBcIlxcXCIgaXMgZW1pdHRlZCBpbiBjb21wb25lbnQgXCIgK1xuICAgICAgICAgIChmb3JtYXRDb21wb25lbnROYW1lKHZtKSkgKyBcIiBidXQgdGhlIGhhbmRsZXIgaXMgcmVnaXN0ZXJlZCBmb3IgXFxcIlwiICsgZXZlbnQgKyBcIlxcXCIuIFwiICtcbiAgICAgICAgICBcIk5vdGUgdGhhdCBIVE1MIGF0dHJpYnV0ZXMgYXJlIGNhc2UtaW5zZW5zaXRpdmUgYW5kIHlvdSBjYW5ub3QgdXNlIFwiICtcbiAgICAgICAgICBcInYtb24gdG8gbGlzdGVuIHRvIGNhbWVsQ2FzZSBldmVudHMgd2hlbiB1c2luZyBpbi1ET00gdGVtcGxhdGVzLiBcIiArXG4gICAgICAgICAgXCJZb3Ugc2hvdWxkIHByb2JhYmx5IHVzZSBcXFwiXCIgKyAoaHlwaGVuYXRlKGV2ZW50KSkgKyBcIlxcXCIgaW5zdGVhZCBvZiBcXFwiXCIgKyBldmVudCArIFwiXFxcIi5cIlxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgY2JzID0gdm0uX2V2ZW50c1tldmVudF07XG4gICAgaWYgKGNicykge1xuICAgICAgY2JzID0gY2JzLmxlbmd0aCA+IDEgPyB0b0FycmF5KGNicykgOiBjYnM7XG4gICAgICB2YXIgYXJncyA9IHRvQXJyYXkoYXJndW1lbnRzLCAxKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2JzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNic1tpXS5hcHBseSh2bSwgYXJncyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBoYW5kbGVFcnJvcihlLCB2bSwgKFwiZXZlbnQgaGFuZGxlciBmb3IgXFxcIlwiICsgZXZlbnQgKyBcIlxcXCJcIikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2bVxuICB9O1xufVxuXG4vKiAgKi9cblxuXG5cbi8qKlxuICogUnVudGltZSBoZWxwZXIgZm9yIHJlc29sdmluZyByYXcgY2hpbGRyZW4gVk5vZGVzIGludG8gYSBzbG90IG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZVNsb3RzIChcbiAgY2hpbGRyZW4sXG4gIGNvbnRleHRcbikge1xuICB2YXIgc2xvdHMgPSB7fTtcbiAgaWYgKCFjaGlsZHJlbikge1xuICAgIHJldHVybiBzbG90c1xuICB9XG4gIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgdmFyIGRhdGEgPSBjaGlsZC5kYXRhO1xuICAgIC8vIHJlbW92ZSBzbG90IGF0dHJpYnV0ZSBpZiB0aGUgbm9kZSBpcyByZXNvbHZlZCBhcyBhIFZ1ZSBzbG90IG5vZGVcbiAgICBpZiAoZGF0YSAmJiBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMuc2xvdCkge1xuICAgICAgZGVsZXRlIGRhdGEuYXR0cnMuc2xvdDtcbiAgICB9XG4gICAgLy8gbmFtZWQgc2xvdHMgc2hvdWxkIG9ubHkgYmUgcmVzcGVjdGVkIGlmIHRoZSB2bm9kZSB3YXMgcmVuZGVyZWQgaW4gdGhlXG4gICAgLy8gc2FtZSBjb250ZXh0LlxuICAgIGlmICgoY2hpbGQuY29udGV4dCA9PT0gY29udGV4dCB8fCBjaGlsZC5mbkNvbnRleHQgPT09IGNvbnRleHQpICYmXG4gICAgICBkYXRhICYmIGRhdGEuc2xvdCAhPSBudWxsXG4gICAgKSB7XG4gICAgICB2YXIgbmFtZSA9IGRhdGEuc2xvdDtcbiAgICAgIHZhciBzbG90ID0gKHNsb3RzW25hbWVdIHx8IChzbG90c1tuYW1lXSA9IFtdKSk7XG4gICAgICBpZiAoY2hpbGQudGFnID09PSAndGVtcGxhdGUnKSB7XG4gICAgICAgIHNsb3QucHVzaC5hcHBseShzbG90LCBjaGlsZC5jaGlsZHJlbiB8fCBbXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzbG90LnB1c2goY2hpbGQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAoc2xvdHMuZGVmYXVsdCB8fCAoc2xvdHMuZGVmYXVsdCA9IFtdKSkucHVzaChjaGlsZCk7XG4gICAgfVxuICB9XG4gIC8vIGlnbm9yZSBzbG90cyB0aGF0IGNvbnRhaW5zIG9ubHkgd2hpdGVzcGFjZVxuICBmb3IgKHZhciBuYW1lJDEgaW4gc2xvdHMpIHtcbiAgICBpZiAoc2xvdHNbbmFtZSQxXS5ldmVyeShpc1doaXRlc3BhY2UpKSB7XG4gICAgICBkZWxldGUgc2xvdHNbbmFtZSQxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNsb3RzXG59XG5cbmZ1bmN0aW9uIGlzV2hpdGVzcGFjZSAobm9kZSkge1xuICByZXR1cm4gKG5vZGUuaXNDb21tZW50ICYmICFub2RlLmFzeW5jRmFjdG9yeSkgfHwgbm9kZS50ZXh0ID09PSAnICdcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVNjb3BlZFNsb3RzIChcbiAgZm5zLCAvLyBzZWUgZmxvdy92bm9kZVxuICByZXNcbikge1xuICByZXMgPSByZXMgfHwge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZm5zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZm5zW2ldKSkge1xuICAgICAgcmVzb2x2ZVNjb3BlZFNsb3RzKGZuc1tpXSwgcmVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzW2Zuc1tpXS5rZXldID0gZm5zW2ldLmZuO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbi8qICAqL1xuXG52YXIgYWN0aXZlSW5zdGFuY2UgPSBudWxsO1xudmFyIGlzVXBkYXRpbmdDaGlsZENvbXBvbmVudCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBpbml0TGlmZWN5Y2xlICh2bSkge1xuICB2YXIgb3B0aW9ucyA9IHZtLiRvcHRpb25zO1xuXG4gIC8vIGxvY2F0ZSBmaXJzdCBub24tYWJzdHJhY3QgcGFyZW50XG4gIHZhciBwYXJlbnQgPSBvcHRpb25zLnBhcmVudDtcbiAgaWYgKHBhcmVudCAmJiAhb3B0aW9ucy5hYnN0cmFjdCkge1xuICAgIHdoaWxlIChwYXJlbnQuJG9wdGlvbnMuYWJzdHJhY3QgJiYgcGFyZW50LiRwYXJlbnQpIHtcbiAgICAgIHBhcmVudCA9IHBhcmVudC4kcGFyZW50O1xuICAgIH1cbiAgICBwYXJlbnQuJGNoaWxkcmVuLnB1c2godm0pO1xuICB9XG5cbiAgdm0uJHBhcmVudCA9IHBhcmVudDtcbiAgdm0uJHJvb3QgPSBwYXJlbnQgPyBwYXJlbnQuJHJvb3QgOiB2bTtcblxuICB2bS4kY2hpbGRyZW4gPSBbXTtcbiAgdm0uJHJlZnMgPSB7fTtcblxuICB2bS5fd2F0Y2hlciA9IG51bGw7XG4gIHZtLl9pbmFjdGl2ZSA9IG51bGw7XG4gIHZtLl9kaXJlY3RJbmFjdGl2ZSA9IGZhbHNlO1xuICB2bS5faXNNb3VudGVkID0gZmFsc2U7XG4gIHZtLl9pc0Rlc3Ryb3llZCA9IGZhbHNlO1xuICB2bS5faXNCZWluZ0Rlc3Ryb3llZCA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBsaWZlY3ljbGVNaXhpbiAoVnVlKSB7XG4gIFZ1ZS5wcm90b3R5cGUuX3VwZGF0ZSA9IGZ1bmN0aW9uICh2bm9kZSwgaHlkcmF0aW5nKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICBpZiAodm0uX2lzTW91bnRlZCkge1xuICAgICAgY2FsbEhvb2sodm0sICdiZWZvcmVVcGRhdGUnKTtcbiAgICB9XG4gICAgdmFyIHByZXZFbCA9IHZtLiRlbDtcbiAgICB2YXIgcHJldlZub2RlID0gdm0uX3Zub2RlO1xuICAgIHZhciBwcmV2QWN0aXZlSW5zdGFuY2UgPSBhY3RpdmVJbnN0YW5jZTtcbiAgICBhY3RpdmVJbnN0YW5jZSA9IHZtO1xuICAgIHZtLl92bm9kZSA9IHZub2RlO1xuICAgIC8vIFZ1ZS5wcm90b3R5cGUuX19wYXRjaF9fIGlzIGluamVjdGVkIGluIGVudHJ5IHBvaW50c1xuICAgIC8vIGJhc2VkIG9uIHRoZSByZW5kZXJpbmcgYmFja2VuZCB1c2VkLlxuICAgIGlmICghcHJldlZub2RlKSB7XG4gICAgICAvLyBpbml0aWFsIHJlbmRlclxuICAgICAgdm0uJGVsID0gdm0uX19wYXRjaF9fKFxuICAgICAgICB2bS4kZWwsIHZub2RlLCBoeWRyYXRpbmcsIGZhbHNlIC8qIHJlbW92ZU9ubHkgKi8sXG4gICAgICAgIHZtLiRvcHRpb25zLl9wYXJlbnRFbG0sXG4gICAgICAgIHZtLiRvcHRpb25zLl9yZWZFbG1cbiAgICAgICk7XG4gICAgICAvLyBubyBuZWVkIGZvciB0aGUgcmVmIG5vZGVzIGFmdGVyIGluaXRpYWwgcGF0Y2hcbiAgICAgIC8vIHRoaXMgcHJldmVudHMga2VlcGluZyBhIGRldGFjaGVkIERPTSB0cmVlIGluIG1lbW9yeSAoIzU4NTEpXG4gICAgICB2bS4kb3B0aW9ucy5fcGFyZW50RWxtID0gdm0uJG9wdGlvbnMuX3JlZkVsbSA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHVwZGF0ZXNcbiAgICAgIHZtLiRlbCA9IHZtLl9fcGF0Y2hfXyhwcmV2Vm5vZGUsIHZub2RlKTtcbiAgICB9XG4gICAgYWN0aXZlSW5zdGFuY2UgPSBwcmV2QWN0aXZlSW5zdGFuY2U7XG4gICAgLy8gdXBkYXRlIF9fdnVlX18gcmVmZXJlbmNlXG4gICAgaWYgKHByZXZFbCkge1xuICAgICAgcHJldkVsLl9fdnVlX18gPSBudWxsO1xuICAgIH1cbiAgICBpZiAodm0uJGVsKSB7XG4gICAgICB2bS4kZWwuX192dWVfXyA9IHZtO1xuICAgIH1cbiAgICAvLyBpZiBwYXJlbnQgaXMgYW4gSE9DLCB1cGRhdGUgaXRzICRlbCBhcyB3ZWxsXG4gICAgaWYgKHZtLiR2bm9kZSAmJiB2bS4kcGFyZW50ICYmIHZtLiR2bm9kZSA9PT0gdm0uJHBhcmVudC5fdm5vZGUpIHtcbiAgICAgIHZtLiRwYXJlbnQuJGVsID0gdm0uJGVsO1xuICAgIH1cbiAgICAvLyB1cGRhdGVkIGhvb2sgaXMgY2FsbGVkIGJ5IHRoZSBzY2hlZHVsZXIgdG8gZW5zdXJlIHRoYXQgY2hpbGRyZW4gYXJlXG4gICAgLy8gdXBkYXRlZCBpbiBhIHBhcmVudCdzIHVwZGF0ZWQgaG9vay5cbiAgfTtcblxuICBWdWUucHJvdG90eXBlLiRmb3JjZVVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIGlmICh2bS5fd2F0Y2hlcikge1xuICAgICAgdm0uX3dhdGNoZXIudXBkYXRlKCk7XG4gICAgfVxuICB9O1xuXG4gIFZ1ZS5wcm90b3R5cGUuJGRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICBpZiAodm0uX2lzQmVpbmdEZXN0cm95ZWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjYWxsSG9vayh2bSwgJ2JlZm9yZURlc3Ryb3knKTtcbiAgICB2bS5faXNCZWluZ0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgLy8gcmVtb3ZlIHNlbGYgZnJvbSBwYXJlbnRcbiAgICB2YXIgcGFyZW50ID0gdm0uJHBhcmVudDtcbiAgICBpZiAocGFyZW50ICYmICFwYXJlbnQuX2lzQmVpbmdEZXN0cm95ZWQgJiYgIXZtLiRvcHRpb25zLmFic3RyYWN0KSB7XG4gICAgICByZW1vdmUocGFyZW50LiRjaGlsZHJlbiwgdm0pO1xuICAgIH1cbiAgICAvLyB0ZWFyZG93biB3YXRjaGVyc1xuICAgIGlmICh2bS5fd2F0Y2hlcikge1xuICAgICAgdm0uX3dhdGNoZXIudGVhcmRvd24oKTtcbiAgICB9XG4gICAgdmFyIGkgPSB2bS5fd2F0Y2hlcnMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHZtLl93YXRjaGVyc1tpXS50ZWFyZG93bigpO1xuICAgIH1cbiAgICAvLyByZW1vdmUgcmVmZXJlbmNlIGZyb20gZGF0YSBvYlxuICAgIC8vIGZyb3plbiBvYmplY3QgbWF5IG5vdCBoYXZlIG9ic2VydmVyLlxuICAgIGlmICh2bS5fZGF0YS5fX29iX18pIHtcbiAgICAgIHZtLl9kYXRhLl9fb2JfXy52bUNvdW50LS07XG4gICAgfVxuICAgIC8vIGNhbGwgdGhlIGxhc3QgaG9vay4uLlxuICAgIHZtLl9pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgLy8gaW52b2tlIGRlc3Ryb3kgaG9va3Mgb24gY3VycmVudCByZW5kZXJlZCB0cmVlXG4gICAgdm0uX19wYXRjaF9fKHZtLl92bm9kZSwgbnVsbCk7XG4gICAgLy8gZmlyZSBkZXN0cm95ZWQgaG9va1xuICAgIGNhbGxIb29rKHZtLCAnZGVzdHJveWVkJyk7XG4gICAgLy8gdHVybiBvZmYgYWxsIGluc3RhbmNlIGxpc3RlbmVycy5cbiAgICB2bS4kb2ZmKCk7XG4gICAgLy8gcmVtb3ZlIF9fdnVlX18gcmVmZXJlbmNlXG4gICAgaWYgKHZtLiRlbCkge1xuICAgICAgdm0uJGVsLl9fdnVlX18gPSBudWxsO1xuICAgIH1cbiAgICAvLyByZWxlYXNlIGNpcmN1bGFyIHJlZmVyZW5jZSAoIzY3NTkpXG4gICAgaWYgKHZtLiR2bm9kZSkge1xuICAgICAgdm0uJHZub2RlLnBhcmVudCA9IG51bGw7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBtb3VudENvbXBvbmVudCAoXG4gIHZtLFxuICBlbCxcbiAgaHlkcmF0aW5nXG4pIHtcbiAgdm0uJGVsID0gZWw7XG4gIGlmICghdm0uJG9wdGlvbnMucmVuZGVyKSB7XG4gICAgdm0uJG9wdGlvbnMucmVuZGVyID0gY3JlYXRlRW1wdHlWTm9kZTtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAoKHZtLiRvcHRpb25zLnRlbXBsYXRlICYmIHZtLiRvcHRpb25zLnRlbXBsYXRlLmNoYXJBdCgwKSAhPT0gJyMnKSB8fFxuICAgICAgICB2bS4kb3B0aW9ucy5lbCB8fCBlbCkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgICdZb3UgYXJlIHVzaW5nIHRoZSBydW50aW1lLW9ubHkgYnVpbGQgb2YgVnVlIHdoZXJlIHRoZSB0ZW1wbGF0ZSAnICtcbiAgICAgICAgICAnY29tcGlsZXIgaXMgbm90IGF2YWlsYWJsZS4gRWl0aGVyIHByZS1jb21waWxlIHRoZSB0ZW1wbGF0ZXMgaW50byAnICtcbiAgICAgICAgICAncmVuZGVyIGZ1bmN0aW9ucywgb3IgdXNlIHRoZSBjb21waWxlci1pbmNsdWRlZCBidWlsZC4nLFxuICAgICAgICAgIHZtXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgICdGYWlsZWQgdG8gbW91bnQgY29tcG9uZW50OiB0ZW1wbGF0ZSBvciByZW5kZXIgZnVuY3Rpb24gbm90IGRlZmluZWQuJyxcbiAgICAgICAgICB2bVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjYWxsSG9vayh2bSwgJ2JlZm9yZU1vdW50Jyk7XG5cbiAgdmFyIHVwZGF0ZUNvbXBvbmVudDtcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGNvbmZpZy5wZXJmb3JtYW5jZSAmJiBtYXJrKSB7XG4gICAgdXBkYXRlQ29tcG9uZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG5hbWUgPSB2bS5fbmFtZTtcbiAgICAgIHZhciBpZCA9IHZtLl91aWQ7XG4gICAgICB2YXIgc3RhcnRUYWcgPSBcInZ1ZS1wZXJmLXN0YXJ0OlwiICsgaWQ7XG4gICAgICB2YXIgZW5kVGFnID0gXCJ2dWUtcGVyZi1lbmQ6XCIgKyBpZDtcblxuICAgICAgbWFyayhzdGFydFRhZyk7XG4gICAgICB2YXIgdm5vZGUgPSB2bS5fcmVuZGVyKCk7XG4gICAgICBtYXJrKGVuZFRhZyk7XG4gICAgICBtZWFzdXJlKChcInZ1ZSBcIiArIG5hbWUgKyBcIiByZW5kZXJcIiksIHN0YXJ0VGFnLCBlbmRUYWcpO1xuXG4gICAgICBtYXJrKHN0YXJ0VGFnKTtcbiAgICAgIHZtLl91cGRhdGUodm5vZGUsIGh5ZHJhdGluZyk7XG4gICAgICBtYXJrKGVuZFRhZyk7XG4gICAgICBtZWFzdXJlKChcInZ1ZSBcIiArIG5hbWUgKyBcIiBwYXRjaFwiKSwgc3RhcnRUYWcsIGVuZFRhZyk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVDb21wb25lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2bS5fdXBkYXRlKHZtLl9yZW5kZXIoKSwgaHlkcmF0aW5nKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gd2Ugc2V0IHRoaXMgdG8gdm0uX3dhdGNoZXIgaW5zaWRlIHRoZSB3YXRjaGVyJ3MgY29uc3RydWN0b3JcbiAgLy8gc2luY2UgdGhlIHdhdGNoZXIncyBpbml0aWFsIHBhdGNoIG1heSBjYWxsICRmb3JjZVVwZGF0ZSAoZS5nLiBpbnNpZGUgY2hpbGRcbiAgLy8gY29tcG9uZW50J3MgbW91bnRlZCBob29rKSwgd2hpY2ggcmVsaWVzIG9uIHZtLl93YXRjaGVyIGJlaW5nIGFscmVhZHkgZGVmaW5lZFxuICBuZXcgV2F0Y2hlcih2bSwgdXBkYXRlQ29tcG9uZW50LCBub29wLCBudWxsLCB0cnVlIC8qIGlzUmVuZGVyV2F0Y2hlciAqLyk7XG4gIGh5ZHJhdGluZyA9IGZhbHNlO1xuXG4gIC8vIG1hbnVhbGx5IG1vdW50ZWQgaW5zdGFuY2UsIGNhbGwgbW91bnRlZCBvbiBzZWxmXG4gIC8vIG1vdW50ZWQgaXMgY2FsbGVkIGZvciByZW5kZXItY3JlYXRlZCBjaGlsZCBjb21wb25lbnRzIGluIGl0cyBpbnNlcnRlZCBob29rXG4gIGlmICh2bS4kdm5vZGUgPT0gbnVsbCkge1xuICAgIHZtLl9pc01vdW50ZWQgPSB0cnVlO1xuICAgIGNhbGxIb29rKHZtLCAnbW91bnRlZCcpO1xuICB9XG4gIHJldHVybiB2bVxufVxuXG5mdW5jdGlvbiB1cGRhdGVDaGlsZENvbXBvbmVudCAoXG4gIHZtLFxuICBwcm9wc0RhdGEsXG4gIGxpc3RlbmVycyxcbiAgcGFyZW50Vm5vZGUsXG4gIHJlbmRlckNoaWxkcmVuXG4pIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBpc1VwZGF0aW5nQ2hpbGRDb21wb25lbnQgPSB0cnVlO1xuICB9XG5cbiAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgY29tcG9uZW50IGhhcyBzbG90IGNoaWxkcmVuXG4gIC8vIHdlIG5lZWQgdG8gZG8gdGhpcyBiZWZvcmUgb3ZlcndyaXRpbmcgJG9wdGlvbnMuX3JlbmRlckNoaWxkcmVuXG4gIHZhciBoYXNDaGlsZHJlbiA9ICEhKFxuICAgIHJlbmRlckNoaWxkcmVuIHx8ICAgICAgICAgICAgICAgLy8gaGFzIG5ldyBzdGF0aWMgc2xvdHNcbiAgICB2bS4kb3B0aW9ucy5fcmVuZGVyQ2hpbGRyZW4gfHwgIC8vIGhhcyBvbGQgc3RhdGljIHNsb3RzXG4gICAgcGFyZW50Vm5vZGUuZGF0YS5zY29wZWRTbG90cyB8fCAvLyBoYXMgbmV3IHNjb3BlZCBzbG90c1xuICAgIHZtLiRzY29wZWRTbG90cyAhPT0gZW1wdHlPYmplY3QgLy8gaGFzIG9sZCBzY29wZWQgc2xvdHNcbiAgKTtcblxuICB2bS4kb3B0aW9ucy5fcGFyZW50Vm5vZGUgPSBwYXJlbnRWbm9kZTtcbiAgdm0uJHZub2RlID0gcGFyZW50Vm5vZGU7IC8vIHVwZGF0ZSB2bSdzIHBsYWNlaG9sZGVyIG5vZGUgd2l0aG91dCByZS1yZW5kZXJcblxuICBpZiAodm0uX3Zub2RlKSB7IC8vIHVwZGF0ZSBjaGlsZCB0cmVlJ3MgcGFyZW50XG4gICAgdm0uX3Zub2RlLnBhcmVudCA9IHBhcmVudFZub2RlO1xuICB9XG4gIHZtLiRvcHRpb25zLl9yZW5kZXJDaGlsZHJlbiA9IHJlbmRlckNoaWxkcmVuO1xuXG4gIC8vIHVwZGF0ZSAkYXR0cnMgYW5kICRsaXN0ZW5lcnMgaGFzaFxuICAvLyB0aGVzZSBhcmUgYWxzbyByZWFjdGl2ZSBzbyB0aGV5IG1heSB0cmlnZ2VyIGNoaWxkIHVwZGF0ZSBpZiB0aGUgY2hpbGRcbiAgLy8gdXNlZCB0aGVtIGR1cmluZyByZW5kZXJcbiAgdm0uJGF0dHJzID0gKHBhcmVudFZub2RlLmRhdGEgJiYgcGFyZW50Vm5vZGUuZGF0YS5hdHRycykgfHwgZW1wdHlPYmplY3Q7XG4gIHZtLiRsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMgfHwgZW1wdHlPYmplY3Q7XG5cbiAgLy8gdXBkYXRlIHByb3BzXG4gIGlmIChwcm9wc0RhdGEgJiYgdm0uJG9wdGlvbnMucHJvcHMpIHtcbiAgICBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQgPSBmYWxzZTtcbiAgICB2YXIgcHJvcHMgPSB2bS5fcHJvcHM7XG4gICAgdmFyIHByb3BLZXlzID0gdm0uJG9wdGlvbnMuX3Byb3BLZXlzIHx8IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBrZXkgPSBwcm9wS2V5c1tpXTtcbiAgICAgIHByb3BzW2tleV0gPSB2YWxpZGF0ZVByb3Aoa2V5LCB2bS4kb3B0aW9ucy5wcm9wcywgcHJvcHNEYXRhLCB2bSk7XG4gICAgfVxuICAgIG9ic2VydmVyU3RhdGUuc2hvdWxkQ29udmVydCA9IHRydWU7XG4gICAgLy8ga2VlcCBhIGNvcHkgb2YgcmF3IHByb3BzRGF0YVxuICAgIHZtLiRvcHRpb25zLnByb3BzRGF0YSA9IHByb3BzRGF0YTtcbiAgfVxuXG4gIC8vIHVwZGF0ZSBsaXN0ZW5lcnNcbiAgaWYgKGxpc3RlbmVycykge1xuICAgIHZhciBvbGRMaXN0ZW5lcnMgPSB2bS4kb3B0aW9ucy5fcGFyZW50TGlzdGVuZXJzO1xuICAgIHZtLiRvcHRpb25zLl9wYXJlbnRMaXN0ZW5lcnMgPSBsaXN0ZW5lcnM7XG4gICAgdXBkYXRlQ29tcG9uZW50TGlzdGVuZXJzKHZtLCBsaXN0ZW5lcnMsIG9sZExpc3RlbmVycyk7XG4gIH1cbiAgLy8gcmVzb2x2ZSBzbG90cyArIGZvcmNlIHVwZGF0ZSBpZiBoYXMgY2hpbGRyZW5cbiAgaWYgKGhhc0NoaWxkcmVuKSB7XG4gICAgdm0uJHNsb3RzID0gcmVzb2x2ZVNsb3RzKHJlbmRlckNoaWxkcmVuLCBwYXJlbnRWbm9kZS5jb250ZXh0KTtcbiAgICB2bS4kZm9yY2VVcGRhdGUoKTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaXNVcGRhdGluZ0NoaWxkQ29tcG9uZW50ID0gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNJbkluYWN0aXZlVHJlZSAodm0pIHtcbiAgd2hpbGUgKHZtICYmICh2bSA9IHZtLiRwYXJlbnQpKSB7XG4gICAgaWYgKHZtLl9pbmFjdGl2ZSkgeyByZXR1cm4gdHJ1ZSB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGFjdGl2YXRlQ2hpbGRDb21wb25lbnQgKHZtLCBkaXJlY3QpIHtcbiAgaWYgKGRpcmVjdCkge1xuICAgIHZtLl9kaXJlY3RJbmFjdGl2ZSA9IGZhbHNlO1xuICAgIGlmIChpc0luSW5hY3RpdmVUcmVlKHZtKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICB9IGVsc2UgaWYgKHZtLl9kaXJlY3RJbmFjdGl2ZSkge1xuICAgIHJldHVyblxuICB9XG4gIGlmICh2bS5faW5hY3RpdmUgfHwgdm0uX2luYWN0aXZlID09PSBudWxsKSB7XG4gICAgdm0uX2luYWN0aXZlID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2bS4kY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFjdGl2YXRlQ2hpbGRDb21wb25lbnQodm0uJGNoaWxkcmVuW2ldKTtcbiAgICB9XG4gICAgY2FsbEhvb2sodm0sICdhY3RpdmF0ZWQnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZWFjdGl2YXRlQ2hpbGRDb21wb25lbnQgKHZtLCBkaXJlY3QpIHtcbiAgaWYgKGRpcmVjdCkge1xuICAgIHZtLl9kaXJlY3RJbmFjdGl2ZSA9IHRydWU7XG4gICAgaWYgKGlzSW5JbmFjdGl2ZVRyZWUodm0pKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbiAgaWYgKCF2bS5faW5hY3RpdmUpIHtcbiAgICB2bS5faW5hY3RpdmUgPSB0cnVlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdm0uJGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkZWFjdGl2YXRlQ2hpbGRDb21wb25lbnQodm0uJGNoaWxkcmVuW2ldKTtcbiAgICB9XG4gICAgY2FsbEhvb2sodm0sICdkZWFjdGl2YXRlZCcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxIb29rICh2bSwgaG9vaykge1xuICB2YXIgaGFuZGxlcnMgPSB2bS4kb3B0aW9uc1tob29rXTtcbiAgaWYgKGhhbmRsZXJzKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodm0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBoYW5kbGVFcnJvcihlLCB2bSwgKGhvb2sgKyBcIiBob29rXCIpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHZtLl9oYXNIb29rRXZlbnQpIHtcbiAgICB2bS4kZW1pdCgnaG9vazonICsgaG9vayk7XG4gIH1cbn1cblxuLyogICovXG5cblxudmFyIE1BWF9VUERBVEVfQ09VTlQgPSAxMDA7XG5cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGFjdGl2YXRlZENoaWxkcmVuID0gW107XG52YXIgaGFzID0ge307XG52YXIgY2lyY3VsYXIgPSB7fTtcbnZhciB3YWl0aW5nID0gZmFsc2U7XG52YXIgZmx1c2hpbmcgPSBmYWxzZTtcbnZhciBpbmRleCA9IDA7XG5cbi8qKlxuICogUmVzZXQgdGhlIHNjaGVkdWxlcidzIHN0YXRlLlxuICovXG5mdW5jdGlvbiByZXNldFNjaGVkdWxlclN0YXRlICgpIHtcbiAgaW5kZXggPSBxdWV1ZS5sZW5ndGggPSBhY3RpdmF0ZWRDaGlsZHJlbi5sZW5ndGggPSAwO1xuICBoYXMgPSB7fTtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBjaXJjdWxhciA9IHt9O1xuICB9XG4gIHdhaXRpbmcgPSBmbHVzaGluZyA9IGZhbHNlO1xufVxuXG4vKipcbiAqIEZsdXNoIGJvdGggcXVldWVzIGFuZCBydW4gdGhlIHdhdGNoZXJzLlxuICovXG5mdW5jdGlvbiBmbHVzaFNjaGVkdWxlclF1ZXVlICgpIHtcbiAgZmx1c2hpbmcgPSB0cnVlO1xuICB2YXIgd2F0Y2hlciwgaWQ7XG5cbiAgLy8gU29ydCBxdWV1ZSBiZWZvcmUgZmx1c2guXG4gIC8vIFRoaXMgZW5zdXJlcyB0aGF0OlxuICAvLyAxLiBDb21wb25lbnRzIGFyZSB1cGRhdGVkIGZyb20gcGFyZW50IHRvIGNoaWxkLiAoYmVjYXVzZSBwYXJlbnQgaXMgYWx3YXlzXG4gIC8vICAgIGNyZWF0ZWQgYmVmb3JlIHRoZSBjaGlsZClcbiAgLy8gMi4gQSBjb21wb25lbnQncyB1c2VyIHdhdGNoZXJzIGFyZSBydW4gYmVmb3JlIGl0cyByZW5kZXIgd2F0Y2hlciAoYmVjYXVzZVxuICAvLyAgICB1c2VyIHdhdGNoZXJzIGFyZSBjcmVhdGVkIGJlZm9yZSB0aGUgcmVuZGVyIHdhdGNoZXIpXG4gIC8vIDMuIElmIGEgY29tcG9uZW50IGlzIGRlc3Ryb3llZCBkdXJpbmcgYSBwYXJlbnQgY29tcG9uZW50J3Mgd2F0Y2hlciBydW4sXG4gIC8vICAgIGl0cyB3YXRjaGVycyBjYW4gYmUgc2tpcHBlZC5cbiAgcXVldWUuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5pZCAtIGIuaWQ7IH0pO1xuXG4gIC8vIGRvIG5vdCBjYWNoZSBsZW5ndGggYmVjYXVzZSBtb3JlIHdhdGNoZXJzIG1pZ2h0IGJlIHB1c2hlZFxuICAvLyBhcyB3ZSBydW4gZXhpc3Rpbmcgd2F0Y2hlcnNcbiAgZm9yIChpbmRleCA9IDA7IGluZGV4IDwgcXVldWUubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgd2F0Y2hlciA9IHF1ZXVlW2luZGV4XTtcbiAgICBpZCA9IHdhdGNoZXIuaWQ7XG4gICAgaGFzW2lkXSA9IG51bGw7XG4gICAgd2F0Y2hlci5ydW4oKTtcbiAgICAvLyBpbiBkZXYgYnVpbGQsIGNoZWNrIGFuZCBzdG9wIGNpcmN1bGFyIHVwZGF0ZXMuXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgaGFzW2lkXSAhPSBudWxsKSB7XG4gICAgICBjaXJjdWxhcltpZF0gPSAoY2lyY3VsYXJbaWRdIHx8IDApICsgMTtcbiAgICAgIGlmIChjaXJjdWxhcltpZF0gPiBNQVhfVVBEQVRFX0NPVU5UKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgJ1lvdSBtYXkgaGF2ZSBhbiBpbmZpbml0ZSB1cGRhdGUgbG9vcCAnICsgKFxuICAgICAgICAgICAgd2F0Y2hlci51c2VyXG4gICAgICAgICAgICAgID8gKFwiaW4gd2F0Y2hlciB3aXRoIGV4cHJlc3Npb24gXFxcIlwiICsgKHdhdGNoZXIuZXhwcmVzc2lvbikgKyBcIlxcXCJcIilcbiAgICAgICAgICAgICAgOiBcImluIGEgY29tcG9uZW50IHJlbmRlciBmdW5jdGlvbi5cIlxuICAgICAgICAgICksXG4gICAgICAgICAgd2F0Y2hlci52bVxuICAgICAgICApO1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGtlZXAgY29waWVzIG9mIHBvc3QgcXVldWVzIGJlZm9yZSByZXNldHRpbmcgc3RhdGVcbiAgdmFyIGFjdGl2YXRlZFF1ZXVlID0gYWN0aXZhdGVkQ2hpbGRyZW4uc2xpY2UoKTtcbiAgdmFyIHVwZGF0ZWRRdWV1ZSA9IHF1ZXVlLnNsaWNlKCk7XG5cbiAgcmVzZXRTY2hlZHVsZXJTdGF0ZSgpO1xuXG4gIC8vIGNhbGwgY29tcG9uZW50IHVwZGF0ZWQgYW5kIGFjdGl2YXRlZCBob29rc1xuICBjYWxsQWN0aXZhdGVkSG9va3MoYWN0aXZhdGVkUXVldWUpO1xuICBjYWxsVXBkYXRlZEhvb2tzKHVwZGF0ZWRRdWV1ZSk7XG5cbiAgLy8gZGV2dG9vbCBob29rXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoZGV2dG9vbHMgJiYgY29uZmlnLmRldnRvb2xzKSB7XG4gICAgZGV2dG9vbHMuZW1pdCgnZmx1c2gnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsVXBkYXRlZEhvb2tzIChxdWV1ZSkge1xuICB2YXIgaSA9IHF1ZXVlLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHZhciB3YXRjaGVyID0gcXVldWVbaV07XG4gICAgdmFyIHZtID0gd2F0Y2hlci52bTtcbiAgICBpZiAodm0uX3dhdGNoZXIgPT09IHdhdGNoZXIgJiYgdm0uX2lzTW91bnRlZCkge1xuICAgICAgY2FsbEhvb2sodm0sICd1cGRhdGVkJyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUXVldWUgYSBrZXB0LWFsaXZlIGNvbXBvbmVudCB0aGF0IHdhcyBhY3RpdmF0ZWQgZHVyaW5nIHBhdGNoLlxuICogVGhlIHF1ZXVlIHdpbGwgYmUgcHJvY2Vzc2VkIGFmdGVyIHRoZSBlbnRpcmUgdHJlZSBoYXMgYmVlbiBwYXRjaGVkLlxuICovXG5mdW5jdGlvbiBxdWV1ZUFjdGl2YXRlZENvbXBvbmVudCAodm0pIHtcbiAgLy8gc2V0dGluZyBfaW5hY3RpdmUgdG8gZmFsc2UgaGVyZSBzbyB0aGF0IGEgcmVuZGVyIGZ1bmN0aW9uIGNhblxuICAvLyByZWx5IG9uIGNoZWNraW5nIHdoZXRoZXIgaXQncyBpbiBhbiBpbmFjdGl2ZSB0cmVlIChlLmcuIHJvdXRlci12aWV3KVxuICB2bS5faW5hY3RpdmUgPSBmYWxzZTtcbiAgYWN0aXZhdGVkQ2hpbGRyZW4ucHVzaCh2bSk7XG59XG5cbmZ1bmN0aW9uIGNhbGxBY3RpdmF0ZWRIb29rcyAocXVldWUpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgIHF1ZXVlW2ldLl9pbmFjdGl2ZSA9IHRydWU7XG4gICAgYWN0aXZhdGVDaGlsZENvbXBvbmVudChxdWV1ZVtpXSwgdHJ1ZSAvKiB0cnVlICovKTtcbiAgfVxufVxuXG4vKipcbiAqIFB1c2ggYSB3YXRjaGVyIGludG8gdGhlIHdhdGNoZXIgcXVldWUuXG4gKiBKb2JzIHdpdGggZHVwbGljYXRlIElEcyB3aWxsIGJlIHNraXBwZWQgdW5sZXNzIGl0J3NcbiAqIHB1c2hlZCB3aGVuIHRoZSBxdWV1ZSBpcyBiZWluZyBmbHVzaGVkLlxuICovXG5mdW5jdGlvbiBxdWV1ZVdhdGNoZXIgKHdhdGNoZXIpIHtcbiAgdmFyIGlkID0gd2F0Y2hlci5pZDtcbiAgaWYgKGhhc1tpZF0gPT0gbnVsbCkge1xuICAgIGhhc1tpZF0gPSB0cnVlO1xuICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgIHF1ZXVlLnB1c2god2F0Y2hlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGlmIGFscmVhZHkgZmx1c2hpbmcsIHNwbGljZSB0aGUgd2F0Y2hlciBiYXNlZCBvbiBpdHMgaWRcbiAgICAgIC8vIGlmIGFscmVhZHkgcGFzdCBpdHMgaWQsIGl0IHdpbGwgYmUgcnVuIG5leHQgaW1tZWRpYXRlbHkuXG4gICAgICB2YXIgaSA9IHF1ZXVlLmxlbmd0aCAtIDE7XG4gICAgICB3aGlsZSAoaSA+IGluZGV4ICYmIHF1ZXVlW2ldLmlkID4gd2F0Y2hlci5pZCkge1xuICAgICAgICBpLS07XG4gICAgICB9XG4gICAgICBxdWV1ZS5zcGxpY2UoaSArIDEsIDAsIHdhdGNoZXIpO1xuICAgIH1cbiAgICAvLyBxdWV1ZSB0aGUgZmx1c2hcbiAgICBpZiAoIXdhaXRpbmcpIHtcbiAgICAgIHdhaXRpbmcgPSB0cnVlO1xuICAgICAgbmV4dFRpY2soZmx1c2hTY2hlZHVsZXJRdWV1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qICAqL1xuXG52YXIgdWlkJDIgPSAwO1xuXG4vKipcbiAqIEEgd2F0Y2hlciBwYXJzZXMgYW4gZXhwcmVzc2lvbiwgY29sbGVjdHMgZGVwZW5kZW5jaWVzLFxuICogYW5kIGZpcmVzIGNhbGxiYWNrIHdoZW4gdGhlIGV4cHJlc3Npb24gdmFsdWUgY2hhbmdlcy5cbiAqIFRoaXMgaXMgdXNlZCBmb3IgYm90aCB0aGUgJHdhdGNoKCkgYXBpIGFuZCBkaXJlY3RpdmVzLlxuICovXG52YXIgV2F0Y2hlciA9IGZ1bmN0aW9uIFdhdGNoZXIgKFxuICB2bSxcbiAgZXhwT3JGbixcbiAgY2IsXG4gIG9wdGlvbnMsXG4gIGlzUmVuZGVyV2F0Y2hlclxuKSB7XG4gIHRoaXMudm0gPSB2bTtcbiAgaWYgKGlzUmVuZGVyV2F0Y2hlcikge1xuICAgIHZtLl93YXRjaGVyID0gdGhpcztcbiAgfVxuICB2bS5fd2F0Y2hlcnMucHVzaCh0aGlzKTtcbiAgLy8gb3B0aW9uc1xuICBpZiAob3B0aW9ucykge1xuICAgIHRoaXMuZGVlcCA9ICEhb3B0aW9ucy5kZWVwO1xuICAgIHRoaXMudXNlciA9ICEhb3B0aW9ucy51c2VyO1xuICAgIHRoaXMubGF6eSA9ICEhb3B0aW9ucy5sYXp5O1xuICAgIHRoaXMuc3luYyA9ICEhb3B0aW9ucy5zeW5jO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZGVlcCA9IHRoaXMudXNlciA9IHRoaXMubGF6eSA9IHRoaXMuc3luYyA9IGZhbHNlO1xuICB9XG4gIHRoaXMuY2IgPSBjYjtcbiAgdGhpcy5pZCA9ICsrdWlkJDI7IC8vIHVpZCBmb3IgYmF0Y2hpbmdcbiAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICB0aGlzLmRpcnR5ID0gdGhpcy5sYXp5OyAvLyBmb3IgbGF6eSB3YXRjaGVyc1xuICB0aGlzLmRlcHMgPSBbXTtcbiAgdGhpcy5uZXdEZXBzID0gW107XG4gIHRoaXMuZGVwSWRzID0gbmV3IF9TZXQoKTtcbiAgdGhpcy5uZXdEZXBJZHMgPSBuZXcgX1NldCgpO1xuICB0aGlzLmV4cHJlc3Npb24gPSBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nXG4gICAgPyBleHBPckZuLnRvU3RyaW5nKClcbiAgICA6ICcnO1xuICAvLyBwYXJzZSBleHByZXNzaW9uIGZvciBnZXR0ZXJcbiAgaWYgKHR5cGVvZiBleHBPckZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5nZXR0ZXIgPSBleHBPckZuO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZ2V0dGVyID0gcGFyc2VQYXRoKGV4cE9yRm4pO1xuICAgIGlmICghdGhpcy5nZXR0ZXIpIHtcbiAgICAgIHRoaXMuZ2V0dGVyID0gZnVuY3Rpb24gKCkge307XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAgIFwiRmFpbGVkIHdhdGNoaW5nIHBhdGg6IFxcXCJcIiArIGV4cE9yRm4gKyBcIlxcXCIgXCIgK1xuICAgICAgICAnV2F0Y2hlciBvbmx5IGFjY2VwdHMgc2ltcGxlIGRvdC1kZWxpbWl0ZWQgcGF0aHMuICcgK1xuICAgICAgICAnRm9yIGZ1bGwgY29udHJvbCwgdXNlIGEgZnVuY3Rpb24gaW5zdGVhZC4nLFxuICAgICAgICB2bVxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgdGhpcy52YWx1ZSA9IHRoaXMubGF6eVxuICAgID8gdW5kZWZpbmVkXG4gICAgOiB0aGlzLmdldCgpO1xufTtcblxuLyoqXG4gKiBFdmFsdWF0ZSB0aGUgZ2V0dGVyLCBhbmQgcmUtY29sbGVjdCBkZXBlbmRlbmNpZXMuXG4gKi9cbldhdGNoZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAoKSB7XG4gIHB1c2hUYXJnZXQodGhpcyk7XG4gIHZhciB2YWx1ZTtcbiAgdmFyIHZtID0gdGhpcy52bTtcbiAgdHJ5IHtcbiAgICB2YWx1ZSA9IHRoaXMuZ2V0dGVyLmNhbGwodm0sIHZtKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGUsIHZtLCAoXCJnZXR0ZXIgZm9yIHdhdGNoZXIgXFxcIlwiICsgKHRoaXMuZXhwcmVzc2lvbikgKyBcIlxcXCJcIikpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlXG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIC8vIFwidG91Y2hcIiBldmVyeSBwcm9wZXJ0eSBzbyB0aGV5IGFyZSBhbGwgdHJhY2tlZCBhc1xuICAgIC8vIGRlcGVuZGVuY2llcyBmb3IgZGVlcCB3YXRjaGluZ1xuICAgIGlmICh0aGlzLmRlZXApIHtcbiAgICAgIHRyYXZlcnNlKHZhbHVlKTtcbiAgICB9XG4gICAgcG9wVGFyZ2V0KCk7XG4gICAgdGhpcy5jbGVhbnVwRGVwcygpO1xuICB9XG4gIHJldHVybiB2YWx1ZVxufTtcblxuLyoqXG4gKiBBZGQgYSBkZXBlbmRlbmN5IHRvIHRoaXMgZGlyZWN0aXZlLlxuICovXG5XYXRjaGVyLnByb3RvdHlwZS5hZGREZXAgPSBmdW5jdGlvbiBhZGREZXAgKGRlcCkge1xuICB2YXIgaWQgPSBkZXAuaWQ7XG4gIGlmICghdGhpcy5uZXdEZXBJZHMuaGFzKGlkKSkge1xuICAgIHRoaXMubmV3RGVwSWRzLmFkZChpZCk7XG4gICAgdGhpcy5uZXdEZXBzLnB1c2goZGVwKTtcbiAgICBpZiAoIXRoaXMuZGVwSWRzLmhhcyhpZCkpIHtcbiAgICAgIGRlcC5hZGRTdWIodGhpcyk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENsZWFuIHVwIGZvciBkZXBlbmRlbmN5IGNvbGxlY3Rpb24uXG4gKi9cbldhdGNoZXIucHJvdG90eXBlLmNsZWFudXBEZXBzID0gZnVuY3Rpb24gY2xlYW51cERlcHMgKCkge1xuICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gIHZhciBpID0gdGhpcy5kZXBzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHZhciBkZXAgPSB0aGlzJDEuZGVwc1tpXTtcbiAgICBpZiAoIXRoaXMkMS5uZXdEZXBJZHMuaGFzKGRlcC5pZCkpIHtcbiAgICAgIGRlcC5yZW1vdmVTdWIodGhpcyQxKTtcbiAgICB9XG4gIH1cbiAgdmFyIHRtcCA9IHRoaXMuZGVwSWRzO1xuICB0aGlzLmRlcElkcyA9IHRoaXMubmV3RGVwSWRzO1xuICB0aGlzLm5ld0RlcElkcyA9IHRtcDtcbiAgdGhpcy5uZXdEZXBJZHMuY2xlYXIoKTtcbiAgdG1wID0gdGhpcy5kZXBzO1xuICB0aGlzLmRlcHMgPSB0aGlzLm5ld0RlcHM7XG4gIHRoaXMubmV3RGVwcyA9IHRtcDtcbiAgdGhpcy5uZXdEZXBzLmxlbmd0aCA9IDA7XG59O1xuXG4vKipcbiAqIFN1YnNjcmliZXIgaW50ZXJmYWNlLlxuICogV2lsbCBiZSBjYWxsZWQgd2hlbiBhIGRlcGVuZGVuY3kgY2hhbmdlcy5cbiAqL1xuV2F0Y2hlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKHRoaXMubGF6eSkge1xuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHRoaXMuc3luYykge1xuICAgIHRoaXMucnVuKCk7XG4gIH0gZWxzZSB7XG4gICAgcXVldWVXYXRjaGVyKHRoaXMpO1xuICB9XG59O1xuXG4vKipcbiAqIFNjaGVkdWxlciBqb2IgaW50ZXJmYWNlLlxuICogV2lsbCBiZSBjYWxsZWQgYnkgdGhlIHNjaGVkdWxlci5cbiAqL1xuV2F0Y2hlci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gcnVuICgpIHtcbiAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgdmFyIHZhbHVlID0gdGhpcy5nZXQoKTtcbiAgICBpZiAoXG4gICAgICB2YWx1ZSAhPT0gdGhpcy52YWx1ZSB8fFxuICAgICAgLy8gRGVlcCB3YXRjaGVycyBhbmQgd2F0Y2hlcnMgb24gT2JqZWN0L0FycmF5cyBzaG91bGQgZmlyZSBldmVuXG4gICAgICAvLyB3aGVuIHRoZSB2YWx1ZSBpcyB0aGUgc2FtZSwgYmVjYXVzZSB0aGUgdmFsdWUgbWF5XG4gICAgICAvLyBoYXZlIG11dGF0ZWQuXG4gICAgICBpc09iamVjdCh2YWx1ZSkgfHxcbiAgICAgIHRoaXMuZGVlcFxuICAgICkge1xuICAgICAgLy8gc2V0IG5ldyB2YWx1ZVxuICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgIGlmICh0aGlzLnVzZXIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLmNiLmNhbGwodGhpcy52bSwgdmFsdWUsIG9sZFZhbHVlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGhhbmRsZUVycm9yKGUsIHRoaXMudm0sIChcImNhbGxiYWNrIGZvciB3YXRjaGVyIFxcXCJcIiArICh0aGlzLmV4cHJlc3Npb24pICsgXCJcXFwiXCIpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jYi5jYWxsKHRoaXMudm0sIHZhbHVlLCBvbGRWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEV2YWx1YXRlIHRoZSB2YWx1ZSBvZiB0aGUgd2F0Y2hlci5cbiAqIFRoaXMgb25seSBnZXRzIGNhbGxlZCBmb3IgbGF6eSB3YXRjaGVycy5cbiAqL1xuV2F0Y2hlci5wcm90b3R5cGUuZXZhbHVhdGUgPSBmdW5jdGlvbiBldmFsdWF0ZSAoKSB7XG4gIHRoaXMudmFsdWUgPSB0aGlzLmdldCgpO1xuICB0aGlzLmRpcnR5ID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIERlcGVuZCBvbiBhbGwgZGVwcyBjb2xsZWN0ZWQgYnkgdGhpcyB3YXRjaGVyLlxuICovXG5XYXRjaGVyLnByb3RvdHlwZS5kZXBlbmQgPSBmdW5jdGlvbiBkZXBlbmQgKCkge1xuICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gIHZhciBpID0gdGhpcy5kZXBzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHRoaXMkMS5kZXBzW2ldLmRlcGVuZCgpO1xuICB9XG59O1xuXG4vKipcbiAqIFJlbW92ZSBzZWxmIGZyb20gYWxsIGRlcGVuZGVuY2llcycgc3Vic2NyaWJlciBsaXN0LlxuICovXG5XYXRjaGVyLnByb3RvdHlwZS50ZWFyZG93biA9IGZ1bmN0aW9uIHRlYXJkb3duICgpIHtcbiAgICB2YXIgdGhpcyQxID0gdGhpcztcblxuICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAvLyByZW1vdmUgc2VsZiBmcm9tIHZtJ3Mgd2F0Y2hlciBsaXN0XG4gICAgLy8gdGhpcyBpcyBhIHNvbWV3aGF0IGV4cGVuc2l2ZSBvcGVyYXRpb24gc28gd2Ugc2tpcCBpdFxuICAgIC8vIGlmIHRoZSB2bSBpcyBiZWluZyBkZXN0cm95ZWQuXG4gICAgaWYgKCF0aGlzLnZtLl9pc0JlaW5nRGVzdHJveWVkKSB7XG4gICAgICByZW1vdmUodGhpcy52bS5fd2F0Y2hlcnMsIHRoaXMpO1xuICAgIH1cbiAgICB2YXIgaSA9IHRoaXMuZGVwcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgdGhpcyQxLmRlcHNbaV0ucmVtb3ZlU3ViKHRoaXMkMSk7XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cbn07XG5cbi8qICAqL1xuXG52YXIgc2hhcmVkUHJvcGVydHlEZWZpbml0aW9uID0ge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBjb25maWd1cmFibGU6IHRydWUsXG4gIGdldDogbm9vcCxcbiAgc2V0OiBub29wXG59O1xuXG5mdW5jdGlvbiBwcm94eSAodGFyZ2V0LCBzb3VyY2VLZXksIGtleSkge1xuICBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24uZ2V0ID0gZnVuY3Rpb24gcHJveHlHZXR0ZXIgKCkge1xuICAgIHJldHVybiB0aGlzW3NvdXJjZUtleV1ba2V5XVxuICB9O1xuICBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24uc2V0ID0gZnVuY3Rpb24gcHJveHlTZXR0ZXIgKHZhbCkge1xuICAgIHRoaXNbc291cmNlS2V5XVtrZXldID0gdmFsO1xuICB9O1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHNoYXJlZFByb3BlcnR5RGVmaW5pdGlvbik7XG59XG5cbmZ1bmN0aW9uIGluaXRTdGF0ZSAodm0pIHtcbiAgdm0uX3dhdGNoZXJzID0gW107XG4gIHZtLl9pbmxpbmVDb21wdXRlZCA9IG51bGw7XG4gIHZhciBvcHRzID0gdm0uJG9wdGlvbnM7XG4gIGlmIChvcHRzLnByb3BzKSB7IGluaXRQcm9wcyh2bSwgb3B0cy5wcm9wcyk7IH1cbiAgaWYgKG9wdHMubWV0aG9kcykgeyBpbml0TWV0aG9kcyh2bSwgb3B0cy5tZXRob2RzKTsgfVxuICBpZiAob3B0cy5kYXRhKSB7XG4gICAgaW5pdERhdGEodm0pO1xuICB9IGVsc2Uge1xuICAgIG9ic2VydmUodm0uX2RhdGEgPSB7fSwgdHJ1ZSAvKiBhc1Jvb3REYXRhICovKTtcbiAgfVxuICBpZiAob3B0cy5jb21wdXRlZCkgeyBpbml0Q29tcHV0ZWQodm0sIG9wdHMuY29tcHV0ZWQpOyB9XG4gIGlmIChvcHRzLndhdGNoICYmIG9wdHMud2F0Y2ggIT09IG5hdGl2ZVdhdGNoKSB7XG4gICAgaW5pdFdhdGNoKHZtLCBvcHRzLndhdGNoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0UHJvcHMgKHZtLCBwcm9wc09wdGlvbnMpIHtcbiAgdmFyIHByb3BzRGF0YSA9IHZtLiRvcHRpb25zLnByb3BzRGF0YSB8fCB7fTtcbiAgdmFyIHByb3BzID0gdm0uX3Byb3BzID0ge307XG4gIC8vIGNhY2hlIHByb3Aga2V5cyBzbyB0aGF0IGZ1dHVyZSBwcm9wcyB1cGRhdGVzIGNhbiBpdGVyYXRlIHVzaW5nIEFycmF5XG4gIC8vIGluc3RlYWQgb2YgZHluYW1pYyBvYmplY3Qga2V5IGVudW1lcmF0aW9uLlxuICB2YXIga2V5cyA9IHZtLiRvcHRpb25zLl9wcm9wS2V5cyA9IFtdO1xuICB2YXIgaXNSb290ID0gIXZtLiRwYXJlbnQ7XG4gIC8vIHJvb3QgaW5zdGFuY2UgcHJvcHMgc2hvdWxkIGJlIGNvbnZlcnRlZFxuICBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQgPSBpc1Jvb3Q7XG4gIHZhciBsb29wID0gZnVuY3Rpb24gKCBrZXkgKSB7XG4gICAga2V5cy5wdXNoKGtleSk7XG4gICAgdmFyIHZhbHVlID0gdmFsaWRhdGVQcm9wKGtleSwgcHJvcHNPcHRpb25zLCBwcm9wc0RhdGEsIHZtKTtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICB2YXIgaHlwaGVuYXRlZEtleSA9IGh5cGhlbmF0ZShrZXkpO1xuICAgICAgaWYgKGlzUmVzZXJ2ZWRBdHRyaWJ1dGUoaHlwaGVuYXRlZEtleSkgfHxcbiAgICAgICAgICBjb25maWcuaXNSZXNlcnZlZEF0dHIoaHlwaGVuYXRlZEtleSkpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICAoXCJcXFwiXCIgKyBoeXBoZW5hdGVkS2V5ICsgXCJcXFwiIGlzIGEgcmVzZXJ2ZWQgYXR0cmlidXRlIGFuZCBjYW5ub3QgYmUgdXNlZCBhcyBjb21wb25lbnQgcHJvcC5cIiksXG4gICAgICAgICAgdm1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGRlZmluZVJlYWN0aXZlKHByb3BzLCBrZXksIHZhbHVlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh2bS4kcGFyZW50ICYmICFpc1VwZGF0aW5nQ2hpbGRDb21wb25lbnQpIHtcbiAgICAgICAgICB3YXJuKFxuICAgICAgICAgICAgXCJBdm9pZCBtdXRhdGluZyBhIHByb3AgZGlyZWN0bHkgc2luY2UgdGhlIHZhbHVlIHdpbGwgYmUgXCIgK1xuICAgICAgICAgICAgXCJvdmVyd3JpdHRlbiB3aGVuZXZlciB0aGUgcGFyZW50IGNvbXBvbmVudCByZS1yZW5kZXJzLiBcIiArXG4gICAgICAgICAgICBcIkluc3RlYWQsIHVzZSBhIGRhdGEgb3IgY29tcHV0ZWQgcHJvcGVydHkgYmFzZWQgb24gdGhlIHByb3AncyBcIiArXG4gICAgICAgICAgICBcInZhbHVlLiBQcm9wIGJlaW5nIG11dGF0ZWQ6IFxcXCJcIiArIGtleSArIFwiXFxcIlwiLFxuICAgICAgICAgICAgdm1cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmaW5lUmVhY3RpdmUocHJvcHMsIGtleSwgdmFsdWUpO1xuICAgIH1cbiAgICAvLyBzdGF0aWMgcHJvcHMgYXJlIGFscmVhZHkgcHJveGllZCBvbiB0aGUgY29tcG9uZW50J3MgcHJvdG90eXBlXG4gICAgLy8gZHVyaW5nIFZ1ZS5leHRlbmQoKS4gV2Ugb25seSBuZWVkIHRvIHByb3h5IHByb3BzIGRlZmluZWQgYXRcbiAgICAvLyBpbnN0YW50aWF0aW9uIGhlcmUuXG4gICAgaWYgKCEoa2V5IGluIHZtKSkge1xuICAgICAgcHJveHkodm0sIFwiX3Byb3BzXCIsIGtleSk7XG4gICAgfVxuICB9O1xuXG4gIGZvciAodmFyIGtleSBpbiBwcm9wc09wdGlvbnMpIGxvb3AoIGtleSApO1xuICBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBpbml0RGF0YSAodm0pIHtcbiAgdmFyIGRhdGEgPSB2bS4kb3B0aW9ucy5kYXRhO1xuICBkYXRhID0gdm0uX2RhdGEgPSB0eXBlb2YgZGF0YSA9PT0gJ2Z1bmN0aW9uJ1xuICAgID8gZ2V0RGF0YShkYXRhLCB2bSlcbiAgICA6IGRhdGEgfHwge307XG4gIGlmICghaXNQbGFpbk9iamVjdChkYXRhKSkge1xuICAgIGRhdGEgPSB7fTtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAnZGF0YSBmdW5jdGlvbnMgc2hvdWxkIHJldHVybiBhbiBvYmplY3Q6XFxuJyArXG4gICAgICAnaHR0cHM6Ly92dWVqcy5vcmcvdjIvZ3VpZGUvY29tcG9uZW50cy5odG1sI2RhdGEtTXVzdC1CZS1hLUZ1bmN0aW9uJyxcbiAgICAgIHZtXG4gICAgKTtcbiAgfVxuICAvLyBwcm94eSBkYXRhIG9uIGluc3RhbmNlXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZGF0YSk7XG4gIHZhciBwcm9wcyA9IHZtLiRvcHRpb25zLnByb3BzO1xuICB2YXIgbWV0aG9kcyA9IHZtLiRvcHRpb25zLm1ldGhvZHM7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgaWYgKG1ldGhvZHMgJiYgaGFzT3duKG1ldGhvZHMsIGtleSkpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICAoXCJNZXRob2QgXFxcIlwiICsga2V5ICsgXCJcXFwiIGhhcyBhbHJlYWR5IGJlZW4gZGVmaW5lZCBhcyBhIGRhdGEgcHJvcGVydHkuXCIpLFxuICAgICAgICAgIHZtXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwcm9wcyAmJiBoYXNPd24ocHJvcHMsIGtleSkpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybihcbiAgICAgICAgXCJUaGUgZGF0YSBwcm9wZXJ0eSBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgaXMgYWxyZWFkeSBkZWNsYXJlZCBhcyBhIHByb3AuIFwiICtcbiAgICAgICAgXCJVc2UgcHJvcCBkZWZhdWx0IHZhbHVlIGluc3RlYWQuXCIsXG4gICAgICAgIHZtXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoIWlzUmVzZXJ2ZWQoa2V5KSkge1xuICAgICAgcHJveHkodm0sIFwiX2RhdGFcIiwga2V5KTtcbiAgICB9XG4gIH1cbiAgLy8gb2JzZXJ2ZSBkYXRhXG4gIG9ic2VydmUoZGF0YSwgdHJ1ZSAvKiBhc1Jvb3REYXRhICovKTtcbn1cblxuZnVuY3Rpb24gZ2V0RGF0YSAoZGF0YSwgdm0pIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGF0YS5jYWxsKHZtLCB2bSlcbiAgfSBjYXRjaCAoZSkge1xuICAgIGhhbmRsZUVycm9yKGUsIHZtLCBcImRhdGEoKVwiKTtcbiAgICByZXR1cm4ge31cbiAgfVxufVxuXG52YXIgY29tcHV0ZWRXYXRjaGVyT3B0aW9ucyA9IHsgbGF6eTogdHJ1ZSB9O1xuXG5mdW5jdGlvbiBpbml0Q29tcHV0ZWQgKHZtLCBjb21wdXRlZCkge1xuICAvLyAkZmxvdy1kaXNhYmxlLWxpbmVcbiAgdmFyIHdhdGNoZXJzID0gdm0uX2NvbXB1dGVkV2F0Y2hlcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvLyBjb21wdXRlZCBwcm9wZXJ0aWVzIGFyZSBqdXN0IGdldHRlcnMgZHVyaW5nIFNTUlxuICB2YXIgaXNTU1IgPSBpc1NlcnZlclJlbmRlcmluZygpO1xuXG4gIGZvciAodmFyIGtleSBpbiBjb21wdXRlZCkge1xuICAgIHZhciB1c2VyRGVmID0gY29tcHV0ZWRba2V5XTtcbiAgICB2YXIgZ2V0dGVyID0gdHlwZW9mIHVzZXJEZWYgPT09ICdmdW5jdGlvbicgPyB1c2VyRGVmIDogdXNlckRlZi5nZXQ7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgZ2V0dGVyID09IG51bGwpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgIChcIkdldHRlciBpcyBtaXNzaW5nIGZvciBjb21wdXRlZCBwcm9wZXJ0eSBcXFwiXCIgKyBrZXkgKyBcIlxcXCIuXCIpLFxuICAgICAgICB2bVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzU1NSKSB7XG4gICAgICAvLyBjcmVhdGUgaW50ZXJuYWwgd2F0Y2hlciBmb3IgdGhlIGNvbXB1dGVkIHByb3BlcnR5LlxuICAgICAgd2F0Y2hlcnNba2V5XSA9IG5ldyBXYXRjaGVyKFxuICAgICAgICB2bSxcbiAgICAgICAgZ2V0dGVyIHx8IG5vb3AsXG4gICAgICAgIG5vb3AsXG4gICAgICAgIGNvbXB1dGVkV2F0Y2hlck9wdGlvbnNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gY29tcG9uZW50LWRlZmluZWQgY29tcHV0ZWQgcHJvcGVydGllcyBhcmUgYWxyZWFkeSBkZWZpbmVkIG9uIHRoZVxuICAgIC8vIGNvbXBvbmVudCBwcm90b3R5cGUuIFdlIG9ubHkgbmVlZCB0byBkZWZpbmUgY29tcHV0ZWQgcHJvcGVydGllcyBkZWZpbmVkXG4gICAgLy8gYXQgaW5zdGFudGlhdGlvbiBoZXJlLlxuICAgIGlmICghKGtleSBpbiB2bSkpIHtcbiAgICAgIGRlZmluZUNvbXB1dGVkKHZtLCBrZXksIHVzZXJEZWYpO1xuICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgaWYgKGtleSBpbiB2bS4kZGF0YSkge1xuICAgICAgICB3YXJuKChcIlRoZSBjb21wdXRlZCBwcm9wZXJ0eSBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgaXMgYWxyZWFkeSBkZWZpbmVkIGluIGRhdGEuXCIpLCB2bSk7XG4gICAgICB9IGVsc2UgaWYgKHZtLiRvcHRpb25zLnByb3BzICYmIGtleSBpbiB2bS4kb3B0aW9ucy5wcm9wcykge1xuICAgICAgICB3YXJuKChcIlRoZSBjb21wdXRlZCBwcm9wZXJ0eSBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgaXMgYWxyZWFkeSBkZWZpbmVkIGFzIGEgcHJvcC5cIiksIHZtKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVmaW5lQ29tcHV0ZWQgKFxuICB0YXJnZXQsXG4gIGtleSxcbiAgdXNlckRlZlxuKSB7XG4gIHZhciBzaG91bGRDYWNoZSA9ICFpc1NlcnZlclJlbmRlcmluZygpO1xuICBpZiAodHlwZW9mIHVzZXJEZWYgPT09ICdmdW5jdGlvbicpIHtcbiAgICBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24uZ2V0ID0gc2hvdWxkQ2FjaGVcbiAgICAgID8gY3JlYXRlQ29tcHV0ZWRHZXR0ZXIoa2V5KVxuICAgICAgOiB1c2VyRGVmO1xuICAgIHNoYXJlZFByb3BlcnR5RGVmaW5pdGlvbi5zZXQgPSBub29wO1xuICB9IGVsc2Uge1xuICAgIHNoYXJlZFByb3BlcnR5RGVmaW5pdGlvbi5nZXQgPSB1c2VyRGVmLmdldFxuICAgICAgPyBzaG91bGRDYWNoZSAmJiB1c2VyRGVmLmNhY2hlICE9PSBmYWxzZVxuICAgICAgICA/IGNyZWF0ZUNvbXB1dGVkR2V0dGVyKGtleSlcbiAgICAgICAgOiB1c2VyRGVmLmdldFxuICAgICAgOiBub29wO1xuICAgIHNoYXJlZFByb3BlcnR5RGVmaW5pdGlvbi5zZXQgPSB1c2VyRGVmLnNldFxuICAgICAgPyB1c2VyRGVmLnNldFxuICAgICAgOiBub29wO1xuICB9XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmXG4gICAgICBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24uc2V0ID09PSBub29wKSB7XG4gICAgc2hhcmVkUHJvcGVydHlEZWZpbml0aW9uLnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgIChcIkNvbXB1dGVkIHByb3BlcnR5IFxcXCJcIiArIGtleSArIFwiXFxcIiB3YXMgYXNzaWduZWQgdG8gYnV0IGl0IGhhcyBubyBzZXR0ZXIuXCIpLFxuICAgICAgICB0aGlzXG4gICAgICApO1xuICAgIH07XG4gIH1cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVDb21wdXRlZEdldHRlciAoa2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbiBjb21wdXRlZEdldHRlciAoKSB7XG4gICAgdmFyIHdhdGNoZXIgPSB0aGlzLl9jb21wdXRlZFdhdGNoZXJzICYmIHRoaXMuX2NvbXB1dGVkV2F0Y2hlcnNba2V5XTtcbiAgICBpZiAod2F0Y2hlcikge1xuICAgICAgaWYgKHdhdGNoZXIuZGlydHkpIHtcbiAgICAgICAgd2F0Y2hlci5ldmFsdWF0ZSgpO1xuICAgICAgfVxuICAgICAgaWYgKERlcC50YXJnZXQpIHtcbiAgICAgICAgd2F0Y2hlci5kZXBlbmQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB3YXRjaGVyLnZhbHVlXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRNZXRob2RzICh2bSwgbWV0aG9kcykge1xuICB2YXIgcHJvcHMgPSB2bS4kb3B0aW9ucy5wcm9wcztcbiAgZm9yICh2YXIga2V5IGluIG1ldGhvZHMpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgaWYgKG1ldGhvZHNba2V5XSA9PSBudWxsKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgXCJNZXRob2QgXFxcIlwiICsga2V5ICsgXCJcXFwiIGhhcyBhbiB1bmRlZmluZWQgdmFsdWUgaW4gdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uLiBcIiArXG4gICAgICAgICAgXCJEaWQgeW91IHJlZmVyZW5jZSB0aGUgZnVuY3Rpb24gY29ycmVjdGx5P1wiLFxuICAgICAgICAgIHZtXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAocHJvcHMgJiYgaGFzT3duKHByb3BzLCBrZXkpKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgKFwiTWV0aG9kIFxcXCJcIiArIGtleSArIFwiXFxcIiBoYXMgYWxyZWFkeSBiZWVuIGRlZmluZWQgYXMgYSBwcm9wLlwiKSxcbiAgICAgICAgICB2bVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKChrZXkgaW4gdm0pICYmIGlzUmVzZXJ2ZWQoa2V5KSkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgIFwiTWV0aG9kIFxcXCJcIiArIGtleSArIFwiXFxcIiBjb25mbGljdHMgd2l0aCBhbiBleGlzdGluZyBWdWUgaW5zdGFuY2UgbWV0aG9kLiBcIiArXG4gICAgICAgICAgXCJBdm9pZCBkZWZpbmluZyBjb21wb25lbnQgbWV0aG9kcyB0aGF0IHN0YXJ0IHdpdGggXyBvciAkLlwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIHZtW2tleV0gPSBtZXRob2RzW2tleV0gPT0gbnVsbCA/IG5vb3AgOiBiaW5kKG1ldGhvZHNba2V5XSwgdm0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRXYXRjaCAodm0sIHdhdGNoKSB7XG4gIGZvciAodmFyIGtleSBpbiB3YXRjaCkge1xuICAgIHZhciBoYW5kbGVyID0gd2F0Y2hba2V5XTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShoYW5kbGVyKSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNyZWF0ZVdhdGNoZXIodm0sIGtleSwgaGFuZGxlcltpXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNyZWF0ZVdhdGNoZXIodm0sIGtleSwgaGFuZGxlcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVdhdGNoZXIgKFxuICB2bSxcbiAga2V5T3JGbixcbiAgaGFuZGxlcixcbiAgb3B0aW9uc1xuKSB7XG4gIGlmIChpc1BsYWluT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgb3B0aW9ucyA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IGhhbmRsZXIuaGFuZGxlcjtcbiAgfVxuICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgaGFuZGxlciA9IHZtW2hhbmRsZXJdO1xuICB9XG4gIHJldHVybiB2bS4kd2F0Y2goa2V5T3JGbiwgaGFuZGxlciwgb3B0aW9ucylcbn1cblxuZnVuY3Rpb24gc3RhdGVNaXhpbiAoVnVlKSB7XG4gIC8vIGZsb3cgc29tZWhvdyBoYXMgcHJvYmxlbXMgd2l0aCBkaXJlY3RseSBkZWNsYXJlZCBkZWZpbml0aW9uIG9iamVjdFxuICAvLyB3aGVuIHVzaW5nIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgc28gd2UgaGF2ZSB0byBwcm9jZWR1cmFsbHkgYnVpbGQgdXBcbiAgLy8gdGhlIG9iamVjdCBoZXJlLlxuICB2YXIgZGF0YURlZiA9IHt9O1xuICBkYXRhRGVmLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2RhdGEgfTtcbiAgdmFyIHByb3BzRGVmID0ge307XG4gIHByb3BzRGVmLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX3Byb3BzIH07XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgZGF0YURlZi5zZXQgPSBmdW5jdGlvbiAobmV3RGF0YSkge1xuICAgICAgd2FybihcbiAgICAgICAgJ0F2b2lkIHJlcGxhY2luZyBpbnN0YW5jZSByb290ICRkYXRhLiAnICtcbiAgICAgICAgJ1VzZSBuZXN0ZWQgZGF0YSBwcm9wZXJ0aWVzIGluc3RlYWQuJyxcbiAgICAgICAgdGhpc1xuICAgICAgKTtcbiAgICB9O1xuICAgIHByb3BzRGVmLnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHdhcm4oXCIkcHJvcHMgaXMgcmVhZG9ubHkuXCIsIHRoaXMpO1xuICAgIH07XG4gIH1cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFZ1ZS5wcm90b3R5cGUsICckZGF0YScsIGRhdGFEZWYpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlLnByb3RvdHlwZSwgJyRwcm9wcycsIHByb3BzRGVmKTtcblxuICBWdWUucHJvdG90eXBlLiRzZXQgPSBzZXQ7XG4gIFZ1ZS5wcm90b3R5cGUuJGRlbGV0ZSA9IGRlbDtcblxuICBWdWUucHJvdG90eXBlLiR3YXRjaCA9IGZ1bmN0aW9uIChcbiAgICBleHBPckZuLFxuICAgIGNiLFxuICAgIG9wdGlvbnNcbiAgKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICBpZiAoaXNQbGFpbk9iamVjdChjYikpIHtcbiAgICAgIHJldHVybiBjcmVhdGVXYXRjaGVyKHZtLCBleHBPckZuLCBjYiwgb3B0aW9ucylcbiAgICB9XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy51c2VyID0gdHJ1ZTtcbiAgICB2YXIgd2F0Y2hlciA9IG5ldyBXYXRjaGVyKHZtLCBleHBPckZuLCBjYiwgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMuaW1tZWRpYXRlKSB7XG4gICAgICBjYi5jYWxsKHZtLCB3YXRjaGVyLnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHVud2F0Y2hGbiAoKSB7XG4gICAgICB3YXRjaGVyLnRlYXJkb3duKCk7XG4gICAgfVxuICB9O1xufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gaW5pdFByb3ZpZGUgKHZtKSB7XG4gIHZhciBwcm92aWRlID0gdm0uJG9wdGlvbnMucHJvdmlkZTtcbiAgaWYgKHByb3ZpZGUpIHtcbiAgICB2bS5fcHJvdmlkZWQgPSB0eXBlb2YgcHJvdmlkZSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgPyBwcm92aWRlLmNhbGwodm0pXG4gICAgICA6IHByb3ZpZGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdEluamVjdGlvbnMgKHZtKSB7XG4gIHZhciByZXN1bHQgPSByZXNvbHZlSW5qZWN0KHZtLiRvcHRpb25zLmluamVjdCwgdm0pO1xuICBpZiAocmVzdWx0KSB7XG4gICAgb2JzZXJ2ZXJTdGF0ZS5zaG91bGRDb252ZXJ0ID0gZmFsc2U7XG4gICAgT2JqZWN0LmtleXMocmVzdWx0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICBkZWZpbmVSZWFjdGl2ZSh2bSwga2V5LCByZXN1bHRba2V5XSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHdhcm4oXG4gICAgICAgICAgICBcIkF2b2lkIG11dGF0aW5nIGFuIGluamVjdGVkIHZhbHVlIGRpcmVjdGx5IHNpbmNlIHRoZSBjaGFuZ2VzIHdpbGwgYmUgXCIgK1xuICAgICAgICAgICAgXCJvdmVyd3JpdHRlbiB3aGVuZXZlciB0aGUgcHJvdmlkZWQgY29tcG9uZW50IHJlLXJlbmRlcnMuIFwiICtcbiAgICAgICAgICAgIFwiaW5qZWN0aW9uIGJlaW5nIG11dGF0ZWQ6IFxcXCJcIiArIGtleSArIFwiXFxcIlwiLFxuICAgICAgICAgICAgdm1cbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlZmluZVJlYWN0aXZlKHZtLCBrZXksIHJlc3VsdFtrZXldKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQgPSB0cnVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVJbmplY3QgKGluamVjdCwgdm0pIHtcbiAgaWYgKGluamVjdCkge1xuICAgIC8vIGluamVjdCBpcyA6YW55IGJlY2F1c2UgZmxvdyBpcyBub3Qgc21hcnQgZW5vdWdoIHRvIGZpZ3VyZSBvdXQgY2FjaGVkXG4gICAgdmFyIHJlc3VsdCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdmFyIGtleXMgPSBoYXNTeW1ib2xcbiAgICAgID8gUmVmbGVjdC5vd25LZXlzKGluamVjdCkuZmlsdGVyKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoaW5qZWN0LCBrZXkpLmVudW1lcmFibGVcbiAgICAgIH0pXG4gICAgICA6IE9iamVjdC5rZXlzKGluamVjdCk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgdmFyIHByb3ZpZGVLZXkgPSBpbmplY3Rba2V5XS5mcm9tO1xuICAgICAgdmFyIHNvdXJjZSA9IHZtO1xuICAgICAgd2hpbGUgKHNvdXJjZSkge1xuICAgICAgICBpZiAoc291cmNlLl9wcm92aWRlZCAmJiBwcm92aWRlS2V5IGluIHNvdXJjZS5fcHJvdmlkZWQpIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IHNvdXJjZS5fcHJvdmlkZWRbcHJvdmlkZUtleV07XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2UgPSBzb3VyY2UuJHBhcmVudDtcbiAgICAgIH1cbiAgICAgIGlmICghc291cmNlKSB7XG4gICAgICAgIGlmICgnZGVmYXVsdCcgaW4gaW5qZWN0W2tleV0pIHtcbiAgICAgICAgICB2YXIgcHJvdmlkZURlZmF1bHQgPSBpbmplY3Rba2V5XS5kZWZhdWx0O1xuICAgICAgICAgIHJlc3VsdFtrZXldID0gdHlwZW9mIHByb3ZpZGVEZWZhdWx0ID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICA/IHByb3ZpZGVEZWZhdWx0LmNhbGwodm0pXG4gICAgICAgICAgICA6IHByb3ZpZGVEZWZhdWx0O1xuICAgICAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICB3YXJuKChcIkluamVjdGlvbiBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgbm90IGZvdW5kXCIpLCB2bSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbi8qICAqL1xuXG4vKipcbiAqIFJ1bnRpbWUgaGVscGVyIGZvciByZW5kZXJpbmcgdi1mb3IgbGlzdHMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckxpc3QgKFxuICB2YWwsXG4gIHJlbmRlclxuKSB7XG4gIHZhciByZXQsIGksIGwsIGtleXMsIGtleTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSB8fCB0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIHJldCA9IG5ldyBBcnJheSh2YWwubGVuZ3RoKTtcbiAgICBmb3IgKGkgPSAwLCBsID0gdmFsLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcmV0W2ldID0gcmVuZGVyKHZhbFtpXSwgaSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgcmV0ID0gbmV3IEFycmF5KHZhbCk7XG4gICAgZm9yIChpID0gMDsgaSA8IHZhbDsgaSsrKSB7XG4gICAgICByZXRbaV0gPSByZW5kZXIoaSArIDEsIGkpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdCh2YWwpKSB7XG4gICAga2V5cyA9IE9iamVjdC5rZXlzKHZhbCk7XG4gICAgcmV0ID0gbmV3IEFycmF5KGtleXMubGVuZ3RoKTtcbiAgICBmb3IgKGkgPSAwLCBsID0ga2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICByZXRbaV0gPSByZW5kZXIodmFsW2tleV0sIGtleSwgaSk7XG4gICAgfVxuICB9XG4gIGlmIChpc0RlZihyZXQpKSB7XG4gICAgKHJldCkuX2lzVkxpc3QgPSB0cnVlO1xuICB9XG4gIHJldHVybiByZXRcbn1cblxuLyogICovXG5cbi8qKlxuICogUnVudGltZSBoZWxwZXIgZm9yIHJlbmRlcmluZyA8c2xvdD5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyU2xvdCAoXG4gIG5hbWUsXG4gIGZhbGxiYWNrLFxuICBwcm9wcyxcbiAgYmluZE9iamVjdFxuKSB7XG4gIHZhciBzY29wZWRTbG90Rm4gPSB0aGlzLiRzY29wZWRTbG90c1tuYW1lXTtcbiAgdmFyIG5vZGVzO1xuICBpZiAoc2NvcGVkU2xvdEZuKSB7IC8vIHNjb3BlZCBzbG90XG4gICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcbiAgICBpZiAoYmluZE9iamVjdCkge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgIWlzT2JqZWN0KGJpbmRPYmplY3QpKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgJ3Nsb3Qgdi1iaW5kIHdpdGhvdXQgYXJndW1lbnQgZXhwZWN0cyBhbiBPYmplY3QnLFxuICAgICAgICAgIHRoaXNcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHByb3BzID0gZXh0ZW5kKGV4dGVuZCh7fSwgYmluZE9iamVjdCksIHByb3BzKTtcbiAgICB9XG4gICAgbm9kZXMgPSBzY29wZWRTbG90Rm4ocHJvcHMpIHx8IGZhbGxiYWNrO1xuICB9IGVsc2Uge1xuICAgIHZhciBzbG90Tm9kZXMgPSB0aGlzLiRzbG90c1tuYW1lXTtcbiAgICAvLyB3YXJuIGR1cGxpY2F0ZSBzbG90IHVzYWdlXG4gICAgaWYgKHNsb3ROb2Rlcykge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgc2xvdE5vZGVzLl9yZW5kZXJlZCkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgIFwiRHVwbGljYXRlIHByZXNlbmNlIG9mIHNsb3QgXFxcIlwiICsgbmFtZSArIFwiXFxcIiBmb3VuZCBpbiB0aGUgc2FtZSByZW5kZXIgdHJlZSBcIiArXG4gICAgICAgICAgXCItIHRoaXMgd2lsbCBsaWtlbHkgY2F1c2UgcmVuZGVyIGVycm9ycy5cIixcbiAgICAgICAgICB0aGlzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBzbG90Tm9kZXMuX3JlbmRlcmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgbm9kZXMgPSBzbG90Tm9kZXMgfHwgZmFsbGJhY2s7XG4gIH1cblxuICB2YXIgdGFyZ2V0ID0gcHJvcHMgJiYgcHJvcHMuc2xvdDtcbiAgaWYgKHRhcmdldCkge1xuICAgIHJldHVybiB0aGlzLiRjcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScsIHsgc2xvdDogdGFyZ2V0IH0sIG5vZGVzKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBub2Rlc1xuICB9XG59XG5cbi8qICAqL1xuXG4vKipcbiAqIFJ1bnRpbWUgaGVscGVyIGZvciByZXNvbHZpbmcgZmlsdGVyc1xuICovXG5mdW5jdGlvbiByZXNvbHZlRmlsdGVyIChpZCkge1xuICByZXR1cm4gcmVzb2x2ZUFzc2V0KHRoaXMuJG9wdGlvbnMsICdmaWx0ZXJzJywgaWQsIHRydWUpIHx8IGlkZW50aXR5XG59XG5cbi8qICAqL1xuXG4vKipcbiAqIFJ1bnRpbWUgaGVscGVyIGZvciBjaGVja2luZyBrZXlDb2RlcyBmcm9tIGNvbmZpZy5cbiAqIGV4cG9zZWQgYXMgVnVlLnByb3RvdHlwZS5fa1xuICogcGFzc2luZyBpbiBldmVudEtleU5hbWUgYXMgbGFzdCBhcmd1bWVudCBzZXBhcmF0ZWx5IGZvciBiYWNrd2FyZHMgY29tcGF0XG4gKi9cbmZ1bmN0aW9uIGNoZWNrS2V5Q29kZXMgKFxuICBldmVudEtleUNvZGUsXG4gIGtleSxcbiAgYnVpbHRJbkFsaWFzLFxuICBldmVudEtleU5hbWVcbikge1xuICB2YXIga2V5Q29kZXMgPSBjb25maWcua2V5Q29kZXNba2V5XSB8fCBidWlsdEluQWxpYXM7XG4gIGlmIChrZXlDb2Rlcykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGtleUNvZGVzKSkge1xuICAgICAgcmV0dXJuIGtleUNvZGVzLmluZGV4T2YoZXZlbnRLZXlDb2RlKSA9PT0gLTFcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGtleUNvZGVzICE9PSBldmVudEtleUNvZGVcbiAgICB9XG4gIH0gZWxzZSBpZiAoZXZlbnRLZXlOYW1lKSB7XG4gICAgcmV0dXJuIGh5cGhlbmF0ZShldmVudEtleU5hbWUpICE9PSBrZXlcbiAgfVxufVxuXG4vKiAgKi9cblxuLyoqXG4gKiBSdW50aW1lIGhlbHBlciBmb3IgbWVyZ2luZyB2LWJpbmQ9XCJvYmplY3RcIiBpbnRvIGEgVk5vZGUncyBkYXRhLlxuICovXG5mdW5jdGlvbiBiaW5kT2JqZWN0UHJvcHMgKFxuICBkYXRhLFxuICB0YWcsXG4gIHZhbHVlLFxuICBhc1Byb3AsXG4gIGlzU3luY1xuKSB7XG4gIGlmICh2YWx1ZSkge1xuICAgIGlmICghaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAgICd2LWJpbmQgd2l0aG91dCBhcmd1bWVudCBleHBlY3RzIGFuIE9iamVjdCBvciBBcnJheSB2YWx1ZScsXG4gICAgICAgIHRoaXNcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IHRvT2JqZWN0KHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHZhciBoYXNoO1xuICAgICAgdmFyIGxvb3AgPSBmdW5jdGlvbiAoIGtleSApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGtleSA9PT0gJ2NsYXNzJyB8fFxuICAgICAgICAgIGtleSA9PT0gJ3N0eWxlJyB8fFxuICAgICAgICAgIGlzUmVzZXJ2ZWRBdHRyaWJ1dGUoa2V5KVxuICAgICAgICApIHtcbiAgICAgICAgICBoYXNoID0gZGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgdHlwZSA9IGRhdGEuYXR0cnMgJiYgZGF0YS5hdHRycy50eXBlO1xuICAgICAgICAgIGhhc2ggPSBhc1Byb3AgfHwgY29uZmlnLm11c3RVc2VQcm9wKHRhZywgdHlwZSwga2V5KVxuICAgICAgICAgICAgPyBkYXRhLmRvbVByb3BzIHx8IChkYXRhLmRvbVByb3BzID0ge30pXG4gICAgICAgICAgICA6IGRhdGEuYXR0cnMgfHwgKGRhdGEuYXR0cnMgPSB7fSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEoa2V5IGluIGhhc2gpKSB7XG4gICAgICAgICAgaGFzaFtrZXldID0gdmFsdWVba2V5XTtcblxuICAgICAgICAgIGlmIChpc1N5bmMpIHtcbiAgICAgICAgICAgIHZhciBvbiA9IGRhdGEub24gfHwgKGRhdGEub24gPSB7fSk7XG4gICAgICAgICAgICBvblsoXCJ1cGRhdGU6XCIgKyBrZXkpXSA9IGZ1bmN0aW9uICgkZXZlbnQpIHtcbiAgICAgICAgICAgICAgdmFsdWVba2V5XSA9ICRldmVudDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWUpIGxvb3AoIGtleSApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGF0YVxufVxuXG4vKiAgKi9cblxuLyoqXG4gKiBSdW50aW1lIGhlbHBlciBmb3IgcmVuZGVyaW5nIHN0YXRpYyB0cmVlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyU3RhdGljIChcbiAgaW5kZXgsXG4gIGlzSW5Gb3Jcbikge1xuICB2YXIgY2FjaGVkID0gdGhpcy5fc3RhdGljVHJlZXMgfHwgKHRoaXMuX3N0YXRpY1RyZWVzID0gW10pO1xuICB2YXIgdHJlZSA9IGNhY2hlZFtpbmRleF07XG4gIC8vIGlmIGhhcyBhbHJlYWR5LXJlbmRlcmVkIHN0YXRpYyB0cmVlIGFuZCBub3QgaW5zaWRlIHYtZm9yLFxuICAvLyB3ZSBjYW4gcmV1c2UgdGhlIHNhbWUgdHJlZSBieSBkb2luZyBhIHNoYWxsb3cgY2xvbmUuXG4gIGlmICh0cmVlICYmICFpc0luRm9yKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodHJlZSlcbiAgICAgID8gY2xvbmVWTm9kZXModHJlZSlcbiAgICAgIDogY2xvbmVWTm9kZSh0cmVlKVxuICB9XG4gIC8vIG90aGVyd2lzZSwgcmVuZGVyIGEgZnJlc2ggdHJlZS5cbiAgdHJlZSA9IGNhY2hlZFtpbmRleF0gPSB0aGlzLiRvcHRpb25zLnN0YXRpY1JlbmRlckZuc1tpbmRleF0uY2FsbChcbiAgICB0aGlzLl9yZW5kZXJQcm94eSxcbiAgICBudWxsLFxuICAgIHRoaXMgLy8gZm9yIHJlbmRlciBmbnMgZ2VuZXJhdGVkIGZvciBmdW5jdGlvbmFsIGNvbXBvbmVudCB0ZW1wbGF0ZXNcbiAgKTtcbiAgbWFya1N0YXRpYyh0cmVlLCAoXCJfX3N0YXRpY19fXCIgKyBpbmRleCksIGZhbHNlKTtcbiAgcmV0dXJuIHRyZWVcbn1cblxuLyoqXG4gKiBSdW50aW1lIGhlbHBlciBmb3Igdi1vbmNlLlxuICogRWZmZWN0aXZlbHkgaXQgbWVhbnMgbWFya2luZyB0aGUgbm9kZSBhcyBzdGF0aWMgd2l0aCBhIHVuaXF1ZSBrZXkuXG4gKi9cbmZ1bmN0aW9uIG1hcmtPbmNlIChcbiAgdHJlZSxcbiAgaW5kZXgsXG4gIGtleVxuKSB7XG4gIG1hcmtTdGF0aWModHJlZSwgKFwiX19vbmNlX19cIiArIGluZGV4ICsgKGtleSA/IChcIl9cIiArIGtleSkgOiBcIlwiKSksIHRydWUpO1xuICByZXR1cm4gdHJlZVxufVxuXG5mdW5jdGlvbiBtYXJrU3RhdGljIChcbiAgdHJlZSxcbiAga2V5LFxuICBpc09uY2Vcbikge1xuICBpZiAoQXJyYXkuaXNBcnJheSh0cmVlKSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJlZS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRyZWVbaV0gJiYgdHlwZW9mIHRyZWVbaV0gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG1hcmtTdGF0aWNOb2RlKHRyZWVbaV0sIChrZXkgKyBcIl9cIiArIGkpLCBpc09uY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBtYXJrU3RhdGljTm9kZSh0cmVlLCBrZXksIGlzT25jZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFya1N0YXRpY05vZGUgKG5vZGUsIGtleSwgaXNPbmNlKSB7XG4gIG5vZGUuaXNTdGF0aWMgPSB0cnVlO1xuICBub2RlLmtleSA9IGtleTtcbiAgbm9kZS5pc09uY2UgPSBpc09uY2U7XG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBiaW5kT2JqZWN0TGlzdGVuZXJzIChkYXRhLCB2YWx1ZSkge1xuICBpZiAodmFsdWUpIHtcbiAgICBpZiAoIWlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAgICd2LW9uIHdpdGhvdXQgYXJndW1lbnQgZXhwZWN0cyBhbiBPYmplY3QgdmFsdWUnLFxuICAgICAgICB0aGlzXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgb24gPSBkYXRhLm9uID0gZGF0YS5vbiA/IGV4dGVuZCh7fSwgZGF0YS5vbikgOiB7fTtcbiAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZSkge1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSBvbltrZXldO1xuICAgICAgICB2YXIgb3VycyA9IHZhbHVlW2tleV07XG4gICAgICAgIG9uW2tleV0gPSBleGlzdGluZyA/IFtdLmNvbmNhdChleGlzdGluZywgb3VycykgOiBvdXJzO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZGF0YVxufVxuXG4vKiAgKi9cblxuLyoqXG4gKiBUaGlzIHJ1bnRpbWUgaGVscGVyIGNyZWF0ZXMgYW4gaW5saW5lIGNvbXB1dGVkIHByb3BlcnR5IGZvciBjb21wb25lbnRcbiAqIHByb3BzIHRoYXQgY29udGFpbiBvYmplY3Qgb3IgYXJyYXkgbGl0ZXJhbHMuIFRoZSBjYWNoaW5nIGVuc3VyZXMgdGhlIHNhbWVcbiAqIG9iamVjdC9hcnJheSBpcyByZXR1cm5lZCB1bmxlc3MgdGhlIHZhbHVlIGhhcyBpbmRlZWQgY2hhbmdlZCwgdGh1cyBhdm9pZGluZ1xuICogdGhlIGNoaWxkIGNvbXBvbmVudCB0byBhbHdheXMgcmUtcmVuZGVyIHdoZW4gY29tcGFyaW5nIHByb3BzIHZhbHVlcy5cbiAqXG4gKiBJbnN0YWxsZWQgdG8gdGhlIGluc3RhbmNlIGFzIF9hLCByZXF1aXJlcyBzcGVjaWFsIGhhbmRsaW5nIGluIHBhcnNlciB0aGF0XG4gKiB0cmFuc2Zvcm1zIHRoZSBmb2xsb3dpbmdcbiAqICAgPGZvbyA6YmFyPVwieyBhOiAxIH1cIi8+XG4gKiB0bzpcbiAqICAgPGZvbyA6YmFyPVwiX2EoMCwgZnVuY3Rpb24oKXtyZXR1cm4geyBhOiAxIH19KVwiXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUlubGluZUNvbXB1dGVkIChpZCwgZ2V0dGVyKSB7XG4gIHZhciB2bSA9IHRoaXM7XG4gIHZhciB3YXRjaGVycyA9IHZtLl9pbmxpbmVDb21wdXRlZCB8fCAodm0uX2lubGluZUNvbXB1dGVkID0ge30pO1xuICB2YXIgY2FjaGVkJCQxID0gd2F0Y2hlcnNbaWRdO1xuICBpZiAoY2FjaGVkJCQxKSB7XG4gICAgcmV0dXJuIGNhY2hlZCQkMS52YWx1ZVxuICB9IGVsc2Uge1xuICAgIHdhdGNoZXJzW2lkXSA9IG5ldyBXYXRjaGVyKHZtLCBnZXR0ZXIsIG5vb3AsIHsgc3luYzogdHJ1ZSB9KTtcbiAgICByZXR1cm4gd2F0Y2hlcnNbaWRdLnZhbHVlXG4gIH1cbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGluc3RhbGxSZW5kZXJIZWxwZXJzICh0YXJnZXQpIHtcbiAgdGFyZ2V0Ll9vID0gbWFya09uY2U7XG4gIHRhcmdldC5fbiA9IHRvTnVtYmVyO1xuICB0YXJnZXQuX3MgPSB0b1N0cmluZztcbiAgdGFyZ2V0Ll9sID0gcmVuZGVyTGlzdDtcbiAgdGFyZ2V0Ll90ID0gcmVuZGVyU2xvdDtcbiAgdGFyZ2V0Ll9xID0gbG9vc2VFcXVhbDtcbiAgdGFyZ2V0Ll9pID0gbG9vc2VJbmRleE9mO1xuICB0YXJnZXQuX20gPSByZW5kZXJTdGF0aWM7XG4gIHRhcmdldC5fZiA9IHJlc29sdmVGaWx0ZXI7XG4gIHRhcmdldC5fayA9IGNoZWNrS2V5Q29kZXM7XG4gIHRhcmdldC5fYiA9IGJpbmRPYmplY3RQcm9wcztcbiAgdGFyZ2V0Ll92ID0gY3JlYXRlVGV4dFZOb2RlO1xuICB0YXJnZXQuX2UgPSBjcmVhdGVFbXB0eVZOb2RlO1xuICB0YXJnZXQuX3UgPSByZXNvbHZlU2NvcGVkU2xvdHM7XG4gIHRhcmdldC5fZyA9IGJpbmRPYmplY3RMaXN0ZW5lcnM7XG4gIHRhcmdldC5fYSA9IGNyZWF0ZUlubGluZUNvbXB1dGVkO1xufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gRnVuY3Rpb25hbFJlbmRlckNvbnRleHQgKFxuICBkYXRhLFxuICBwcm9wcyxcbiAgY2hpbGRyZW4sXG4gIHBhcmVudCxcbiAgQ3RvclxuKSB7XG4gIHZhciBvcHRpb25zID0gQ3Rvci5vcHRpb25zO1xuICB0aGlzLmRhdGEgPSBkYXRhO1xuICB0aGlzLnByb3BzID0gcHJvcHM7XG4gIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gIHRoaXMubGlzdGVuZXJzID0gZGF0YS5vbiB8fCBlbXB0eU9iamVjdDtcbiAgdGhpcy5pbmplY3Rpb25zID0gcmVzb2x2ZUluamVjdChvcHRpb25zLmluamVjdCwgcGFyZW50KTtcbiAgdGhpcy5zbG90cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlc29sdmVTbG90cyhjaGlsZHJlbiwgcGFyZW50KTsgfTtcblxuICAvLyBlbnN1cmUgdGhlIGNyZWF0ZUVsZW1lbnQgZnVuY3Rpb24gaW4gZnVuY3Rpb25hbCBjb21wb25lbnRzXG4gIC8vIGdldHMgYSB1bmlxdWUgY29udGV4dCAtIHRoaXMgaXMgbmVjZXNzYXJ5IGZvciBjb3JyZWN0IG5hbWVkIHNsb3QgY2hlY2tcbiAgdmFyIGNvbnRleHRWbSA9IE9iamVjdC5jcmVhdGUocGFyZW50KTtcbiAgdmFyIGlzQ29tcGlsZWQgPSBpc1RydWUob3B0aW9ucy5fY29tcGlsZWQpO1xuICB2YXIgbmVlZE5vcm1hbGl6YXRpb24gPSAhaXNDb21waWxlZDtcblxuICAvLyBzdXBwb3J0IGZvciBjb21waWxlZCBmdW5jdGlvbmFsIHRlbXBsYXRlXG4gIGlmIChpc0NvbXBpbGVkKSB7XG4gICAgLy8gZXhwb3NpbmcgJG9wdGlvbnMgZm9yIHJlbmRlclN0YXRpYygpXG4gICAgdGhpcy4kb3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgLy8gcHJlLXJlc29sdmUgc2xvdHMgZm9yIHJlbmRlclNsb3QoKVxuICAgIHRoaXMuJHNsb3RzID0gdGhpcy5zbG90cygpO1xuICAgIHRoaXMuJHNjb3BlZFNsb3RzID0gZGF0YS5zY29wZWRTbG90cyB8fCBlbXB0eU9iamVjdDtcbiAgfVxuXG4gIGlmIChvcHRpb25zLl9zY29wZUlkKSB7XG4gICAgdGhpcy5fYyA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkKSB7XG4gICAgICB2YXIgdm5vZGUgPSBjcmVhdGVFbGVtZW50KGNvbnRleHRWbSwgYSwgYiwgYywgZCwgbmVlZE5vcm1hbGl6YXRpb24pO1xuICAgICAgaWYgKHZub2RlKSB7XG4gICAgICAgIHZub2RlLmZuU2NvcGVJZCA9IG9wdGlvbnMuX3Njb3BlSWQ7XG4gICAgICAgIHZub2RlLmZuQ29udGV4dCA9IHBhcmVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2bm9kZVxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fYyA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkKSB7IHJldHVybiBjcmVhdGVFbGVtZW50KGNvbnRleHRWbSwgYSwgYiwgYywgZCwgbmVlZE5vcm1hbGl6YXRpb24pOyB9O1xuICB9XG59XG5cbmluc3RhbGxSZW5kZXJIZWxwZXJzKEZ1bmN0aW9uYWxSZW5kZXJDb250ZXh0LnByb3RvdHlwZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUZ1bmN0aW9uYWxDb21wb25lbnQgKFxuICBDdG9yLFxuICBwcm9wc0RhdGEsXG4gIGRhdGEsXG4gIGNvbnRleHRWbSxcbiAgY2hpbGRyZW5cbikge1xuICB2YXIgb3B0aW9ucyA9IEN0b3Iub3B0aW9ucztcbiAgdmFyIHByb3BzID0ge307XG4gIHZhciBwcm9wT3B0aW9ucyA9IG9wdGlvbnMucHJvcHM7XG4gIGlmIChpc0RlZihwcm9wT3B0aW9ucykpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcHJvcE9wdGlvbnMpIHtcbiAgICAgIHByb3BzW2tleV0gPSB2YWxpZGF0ZVByb3Aoa2V5LCBwcm9wT3B0aW9ucywgcHJvcHNEYXRhIHx8IGVtcHR5T2JqZWN0KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGlzRGVmKGRhdGEuYXR0cnMpKSB7IG1lcmdlUHJvcHMocHJvcHMsIGRhdGEuYXR0cnMpOyB9XG4gICAgaWYgKGlzRGVmKGRhdGEucHJvcHMpKSB7IG1lcmdlUHJvcHMocHJvcHMsIGRhdGEucHJvcHMpOyB9XG4gIH1cblxuICB2YXIgcmVuZGVyQ29udGV4dCA9IG5ldyBGdW5jdGlvbmFsUmVuZGVyQ29udGV4dChcbiAgICBkYXRhLFxuICAgIHByb3BzLFxuICAgIGNoaWxkcmVuLFxuICAgIGNvbnRleHRWbSxcbiAgICBDdG9yXG4gICk7XG5cbiAgdmFyIHZub2RlID0gb3B0aW9ucy5yZW5kZXIuY2FsbChudWxsLCByZW5kZXJDb250ZXh0Ll9jLCByZW5kZXJDb250ZXh0KTtcblxuICBpZiAodm5vZGUgaW5zdGFuY2VvZiBWTm9kZSkge1xuICAgIHZub2RlLmZuQ29udGV4dCA9IGNvbnRleHRWbTtcbiAgICB2bm9kZS5mbk9wdGlvbnMgPSBvcHRpb25zO1xuICAgIGlmIChkYXRhLnNsb3QpIHtcbiAgICAgICh2bm9kZS5kYXRhIHx8ICh2bm9kZS5kYXRhID0ge30pKS5zbG90ID0gZGF0YS5zbG90O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB2bm9kZVxufVxuXG5mdW5jdGlvbiBtZXJnZVByb3BzICh0bywgZnJvbSkge1xuICBmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuICAgIHRvW2NhbWVsaXplKGtleSldID0gZnJvbVtrZXldO1xuICB9XG59XG5cbi8qICAqL1xuXG5cbnZhciBSRUNZQ0xFX0xJU1RfTUFSS0VSID0gJ0BpblJlY3ljbGVMaXN0JztcblxuLy8gUmVnaXN0ZXIgdGhlIGNvbXBvbmVudCBob29rIHRvIHdlZXggbmF0aXZlIHJlbmRlciBlbmdpbmUuXG4vLyBUaGUgaG9vayB3aWxsIGJlIHRyaWdnZXJlZCBieSBuYXRpdmUsIG5vdCBqYXZhc2NyaXB0LlxuZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnRIb29rIChcbiAgY29tcG9uZW50SWQsXG4gIHR5cGUsIC8vIGhvb2sgdHlwZSwgY291bGQgYmUgXCJsaWZlY3ljbGVcIiBvciBcImluc3RhbmNlXCJcbiAgaG9vaywgLy8gaG9vayBuYW1lXG4gIGZuXG4pIHtcbiAgaWYgKCFkb2N1bWVudCB8fCAhZG9jdW1lbnQudGFza0NlbnRlcikge1xuICAgIHdhcm4oXCJDYW4ndCBmaW5kIGF2YWlsYWJsZSBcXFwiZG9jdW1lbnRcXFwiIG9yIFxcXCJ0YXNrQ2VudGVyXFxcIi5cIik7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKHR5cGVvZiBkb2N1bWVudC50YXNrQ2VudGVyLnJlZ2lzdGVySG9vayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBkb2N1bWVudC50YXNrQ2VudGVyLnJlZ2lzdGVySG9vayhjb21wb25lbnRJZCwgdHlwZSwgaG9vaywgZm4pXG4gIH1cbiAgd2FybigoXCJGYWlsZWQgdG8gcmVnaXN0ZXIgY29tcG9uZW50IGhvb2sgXFxcIlwiICsgdHlwZSArIFwiQFwiICsgaG9vayArIFwiI1wiICsgY29tcG9uZW50SWQgKyBcIlxcXCIuXCIpKTtcbn1cblxuLy8gVXBkYXRlcyB0aGUgc3RhdGUgb2YgdGhlIGNvbXBvbmVudCB0byB3ZWV4IG5hdGl2ZSByZW5kZXIgZW5naW5lLlxuZnVuY3Rpb24gdXBkYXRlQ29tcG9uZW50RGF0YSAoXG4gIGNvbXBvbmVudElkLFxuICBuZXdEYXRhLFxuICBjYWxsYmFja1xuKSB7XG4gIGlmICghZG9jdW1lbnQgfHwgIWRvY3VtZW50LnRhc2tDZW50ZXIpIHtcbiAgICB3YXJuKFwiQ2FuJ3QgZmluZCBhdmFpbGFibGUgXFxcImRvY3VtZW50XFxcIiBvciBcXFwidGFza0NlbnRlclxcXCIuXCIpO1xuICAgIHJldHVyblxuICB9XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQudGFza0NlbnRlci51cGRhdGVEYXRhID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnRhc2tDZW50ZXIudXBkYXRlRGF0YShjb21wb25lbnRJZCwgbmV3RGF0YSwgY2FsbGJhY2spXG4gIH1cbiAgd2FybigoXCJGYWlsZWQgdG8gdXBkYXRlIGNvbXBvbmVudCBkYXRhIChcIiArIGNvbXBvbmVudElkICsgXCIpLlwiKSk7XG59XG5cbi8qICAqL1xuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vSGFua3MxMDEwMC93ZWV4LW5hdGl2ZS1kaXJlY3RpdmUvdHJlZS9tYXN0ZXIvY29tcG9uZW50XG5cbnZhciB1aWQkMyA9IDA7XG5cbi8vIG92ZXJyaWRlIFZ1ZS5wcm90b3R5cGUuX2luaXRcbmZ1bmN0aW9uIGluaXRWaXJ0dWFsQ29tcG9uZW50IChvcHRpb25zKSB7XG4gIGlmICggb3B0aW9ucyA9PT0gdm9pZCAwICkgb3B0aW9ucyA9IHt9O1xuXG4gIHZhciB2bSA9IHRoaXM7XG4gIHZhciBjb21wb25lbnRJZCA9IG9wdGlvbnMuY29tcG9uZW50SWQ7XG5cbiAgLy8gdmlydHVhbCBjb21wb25lbnQgdWlkXG4gIHZtLl91aWQgPSBcInZpcnR1YWwtY29tcG9uZW50LVwiICsgKHVpZCQzKyspO1xuXG4gIC8vIGEgZmxhZyB0byBhdm9pZCB0aGlzIGJlaW5nIG9ic2VydmVkXG4gIHZtLl9pc1Z1ZSA9IHRydWU7XG4gIC8vIG1lcmdlIG9wdGlvbnNcbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5faXNDb21wb25lbnQpIHtcbiAgICAvLyBvcHRpbWl6ZSBpbnRlcm5hbCBjb21wb25lbnQgaW5zdGFudGlhdGlvblxuICAgIC8vIHNpbmNlIGR5bmFtaWMgb3B0aW9ucyBtZXJnaW5nIGlzIHByZXR0eSBzbG93LCBhbmQgbm9uZSBvZiB0aGVcbiAgICAvLyBpbnRlcm5hbCBjb21wb25lbnQgb3B0aW9ucyBuZWVkcyBzcGVjaWFsIHRyZWF0bWVudC5cbiAgICBpbml0SW50ZXJuYWxDb21wb25lbnQodm0sIG9wdGlvbnMpO1xuICB9IGVsc2Uge1xuICAgIHZtLiRvcHRpb25zID0gbWVyZ2VPcHRpb25zKFxuICAgICAgcmVzb2x2ZUNvbnN0cnVjdG9yT3B0aW9ucyh2bS5jb25zdHJ1Y3RvciksXG4gICAgICBvcHRpb25zIHx8IHt9LFxuICAgICAgdm1cbiAgICApO1xuICB9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBpbml0UHJveHkodm0pO1xuICB9IGVsc2Uge1xuICAgIHZtLl9yZW5kZXJQcm94eSA9IHZtO1xuICB9XG5cbiAgdm0uX3NlbGYgPSB2bTtcbiAgaW5pdExpZmVjeWNsZSh2bSk7XG4gIGluaXRFdmVudHModm0pO1xuICBpbml0UmVuZGVyKHZtKTtcbiAgY2FsbEhvb2sodm0sICdiZWZvcmVDcmVhdGUnKTtcbiAgaW5pdEluamVjdGlvbnModm0pOyAvLyByZXNvbHZlIGluamVjdGlvbnMgYmVmb3JlIGRhdGEvcHJvcHNcbiAgaW5pdFN0YXRlKHZtKTtcbiAgaW5pdFByb3ZpZGUodm0pOyAvLyByZXNvbHZlIHByb3ZpZGUgYWZ0ZXIgZGF0YS9wcm9wc1xuICBjYWxsSG9vayh2bSwgJ2NyZWF0ZWQnKTtcblxuICAvLyBzZW5kIGluaXRpYWwgZGF0YSB0byBuYXRpdmVcbiAgdmFyIGRhdGEgPSB2bS4kb3B0aW9ucy5kYXRhO1xuICB2YXIgcGFyYW1zID0gdHlwZW9mIGRhdGEgPT09ICdmdW5jdGlvbidcbiAgICA/IGdldERhdGEoZGF0YSwgdm0pXG4gICAgOiBkYXRhIHx8IHt9O1xuICBpZiAoaXNQbGFpbk9iamVjdChwYXJhbXMpKSB7XG4gICAgdXBkYXRlQ29tcG9uZW50RGF0YShjb21wb25lbnRJZCwgcGFyYW1zKTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tcG9uZW50SG9vayhjb21wb25lbnRJZCwgJ2xpZmVjeWNsZScsICdhdHRhY2gnLCBmdW5jdGlvbiAoKSB7XG4gICAgY2FsbEhvb2sodm0sICdiZWZvcmVNb3VudCcpO1xuXG4gICAgdmFyIHVwZGF0ZUNvbXBvbmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZtLl91cGRhdGUodm0uX3Zub2RlLCBmYWxzZSk7XG4gICAgfTtcbiAgICBuZXcgV2F0Y2hlcih2bSwgdXBkYXRlQ29tcG9uZW50LCBub29wLCBudWxsLCB0cnVlKTtcblxuICAgIHZtLl9pc01vdW50ZWQgPSB0cnVlO1xuICAgIGNhbGxIb29rKHZtLCAnbW91bnRlZCcpO1xuICB9KTtcblxuICByZWdpc3RlckNvbXBvbmVudEhvb2soY29tcG9uZW50SWQsICdsaWZlY3ljbGUnLCAnZGV0YWNoJywgZnVuY3Rpb24gKCkge1xuICAgIHZtLiRkZXN0cm95KCk7XG4gIH0pO1xufVxuXG4vLyBvdmVycmlkZSBWdWUucHJvdG90eXBlLl91cGRhdGVcbmZ1bmN0aW9uIHVwZGF0ZVZpcnR1YWxDb21wb25lbnQgKHZub2RlKSB7XG4gIHZhciB2bSA9IHRoaXM7XG4gIHZhciBjb21wb25lbnRJZCA9IHZtLiRvcHRpb25zLmNvbXBvbmVudElkO1xuICBpZiAodm0uX2lzTW91bnRlZCkge1xuICAgIGNhbGxIb29rKHZtLCAnYmVmb3JlVXBkYXRlJyk7XG4gIH1cbiAgdm0uX3Zub2RlID0gdm5vZGU7XG4gIGlmICh2bS5faXNNb3VudGVkICYmIGNvbXBvbmVudElkKSB7XG4gICAgLy8gVE9ETzogZGF0YSBzaG91bGQgYmUgZmlsdGVyZWQgYW5kIHdpdGhvdXQgYmluZGluZ3NcbiAgICB2YXIgZGF0YSA9IE9iamVjdC5hc3NpZ24oe30sIHZtLl9kYXRhKTtcbiAgICB1cGRhdGVDb21wb25lbnREYXRhKGNvbXBvbmVudElkLCBkYXRhLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsSG9vayh2bSwgJ3VwZGF0ZWQnKTtcbiAgICB9KTtcbiAgfVxufVxuXG4vLyBsaXN0ZW5pbmcgb24gbmF0aXZlIGNhbGxiYWNrXG5mdW5jdGlvbiByZXNvbHZlVmlydHVhbENvbXBvbmVudCAodm5vZGUpIHtcbiAgdmFyIEJhc2VDdG9yID0gdm5vZGUuY29tcG9uZW50T3B0aW9ucy5DdG9yO1xuICB2YXIgVmlydHVhbENvbXBvbmVudCA9IEJhc2VDdG9yLmV4dGVuZCh7fSk7XG4gIHZhciBjaWQgPSBWaXJ0dWFsQ29tcG9uZW50LmNpZDtcbiAgVmlydHVhbENvbXBvbmVudC5wcm90b3R5cGUuX2luaXQgPSBpbml0VmlydHVhbENvbXBvbmVudDtcbiAgVmlydHVhbENvbXBvbmVudC5wcm90b3R5cGUuX3VwZGF0ZSA9IHVwZGF0ZVZpcnR1YWxDb21wb25lbnQ7XG5cbiAgdm5vZGUuY29tcG9uZW50T3B0aW9ucy5DdG9yID0gQmFzZUN0b3IuZXh0ZW5kKHtcbiAgICBiZWZvcmVDcmVhdGU6IGZ1bmN0aW9uIGJlZm9yZUNyZWF0ZSAoKSB7XG4gICAgICAvLyBjb25zdCB2bTogQ29tcG9uZW50ID0gdGhpc1xuXG4gICAgICAvLyBUT0RPOiBsaXN0ZW4gb24gYWxsIGV2ZW50cyBhbmQgZGlzcGF0Y2ggdGhlbSB0byB0aGVcbiAgICAgIC8vIGNvcnJlc3BvbmRpbmcgdmlydHVhbCBjb21wb25lbnRzIGFjY29yZGluZyB0byB0aGUgY29tcG9uZW50SWQuXG4gICAgICAvLyB2bS5fdmlydHVhbENvbXBvbmVudHMgPSB7fVxuICAgICAgdmFyIGNyZWF0ZVZpcnR1YWxDb21wb25lbnQgPSBmdW5jdGlvbiAoY29tcG9uZW50SWQsIHByb3BzRGF0YSkge1xuICAgICAgICAvLyBjcmVhdGUgdmlydHVhbCBjb21wb25lbnRcbiAgICAgICAgLy8gY29uc3Qgc3ViVm0gPVxuICAgICAgICBuZXcgVmlydHVhbENvbXBvbmVudCh7XG4gICAgICAgICAgY29tcG9uZW50SWQ6IGNvbXBvbmVudElkLFxuICAgICAgICAgIHByb3BzRGF0YTogcHJvcHNEYXRhXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBpZiAodm0uX3ZpcnR1YWxDb21wb25lbnRzKSB7XG4gICAgICAgIC8vICAgdm0uX3ZpcnR1YWxDb21wb25lbnRzW2NvbXBvbmVudElkXSA9IHN1YlZtXG4gICAgICAgIC8vIH1cbiAgICAgIH07XG5cbiAgICAgIHJlZ2lzdGVyQ29tcG9uZW50SG9vayhjaWQsICdsaWZlY3ljbGUnLCAnY3JlYXRlJywgY3JlYXRlVmlydHVhbENvbXBvbmVudCk7XG4gICAgfSxcbiAgICBiZWZvcmVEZXN0cm95OiBmdW5jdGlvbiBiZWZvcmVEZXN0cm95ICgpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl92aXJ0dWFsQ29tcG9uZW50cztcbiAgICB9XG4gIH0pO1xufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gaXNSZWN5Y2xhYmxlQ29tcG9uZW50ICh2bm9kZSkge1xuICByZXR1cm4gdm5vZGUuZGF0YS5hdHRyc1xuICAgID8gKFJFQ1lDTEVfTElTVF9NQVJLRVIgaW4gdm5vZGUuZGF0YS5hdHRycylcbiAgICA6IGZhbHNlXG59XG5cbmZ1bmN0aW9uIHJlbmRlclJlY3ljbGFibGVDb21wb25lbnRUZW1wbGF0ZSAodm5vZGUpIHtcbiAgLy8gJGZsb3ctZGlzYWJsZS1saW5lXG4gIGRlbGV0ZSB2bm9kZS5kYXRhLmF0dHJzW1JFQ1lDTEVfTElTVF9NQVJLRVJdO1xuICByZXNvbHZlVmlydHVhbENvbXBvbmVudCh2bm9kZSk7XG4gIHZhciB2bSA9IGNyZWF0ZUNvbXBvbmVudEluc3RhbmNlRm9yVm5vZGUodm5vZGUpO1xuICB2YXIgcmVuZGVyID0gKHZtLiRvcHRpb25zKVsnQHJlbmRlciddO1xuICBpZiAocmVuZGVyKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh2bSlcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGVyciwgdm0sIFwiQHJlbmRlclwiKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd2FybihcbiAgICAgIFwiQHJlbmRlciBmdW5jdGlvbiBub3QgZGVmaW5lZCBvbiBjb21wb25lbnQgdXNlZCBpbiA8cmVjeWNsZS1saXN0Pi4gXCIgK1xuICAgICAgXCJNYWtlIHN1cmUgdG8gZGVjbGFyZSBgcmVjeWNsYWJsZT1cXFwidHJ1ZVxcXCJgIG9uIHRoZSBjb21wb25lbnQncyB0ZW1wbGF0ZS5cIixcbiAgICAgIHZtXG4gICAgKTtcbiAgfVxufVxuXG4vKiAgKi9cblxuLy8gaG9va3MgdG8gYmUgaW52b2tlZCBvbiBjb21wb25lbnQgVk5vZGVzIGR1cmluZyBwYXRjaFxudmFyIGNvbXBvbmVudFZOb2RlSG9va3MgPSB7XG4gIGluaXQ6IGZ1bmN0aW9uIGluaXQgKFxuICAgIHZub2RlLFxuICAgIGh5ZHJhdGluZyxcbiAgICBwYXJlbnRFbG0sXG4gICAgcmVmRWxtXG4gICkge1xuICAgIGlmICghdm5vZGUuY29tcG9uZW50SW5zdGFuY2UgfHwgdm5vZGUuY29tcG9uZW50SW5zdGFuY2UuX2lzRGVzdHJveWVkKSB7XG4gICAgICB2YXIgY2hpbGQgPSB2bm9kZS5jb21wb25lbnRJbnN0YW5jZSA9IGNyZWF0ZUNvbXBvbmVudEluc3RhbmNlRm9yVm5vZGUoXG4gICAgICAgIHZub2RlLFxuICAgICAgICBhY3RpdmVJbnN0YW5jZSxcbiAgICAgICAgcGFyZW50RWxtLFxuICAgICAgICByZWZFbG1cbiAgICAgICk7XG4gICAgICBjaGlsZC4kbW91bnQoaHlkcmF0aW5nID8gdm5vZGUuZWxtIDogdW5kZWZpbmVkLCBoeWRyYXRpbmcpO1xuICAgIH0gZWxzZSBpZiAodm5vZGUuZGF0YS5rZWVwQWxpdmUpIHtcbiAgICAgIC8vIGtlcHQtYWxpdmUgY29tcG9uZW50cywgdHJlYXQgYXMgYSBwYXRjaFxuICAgICAgdmFyIG1vdW50ZWROb2RlID0gdm5vZGU7IC8vIHdvcmsgYXJvdW5kIGZsb3dcbiAgICAgIGNvbXBvbmVudFZOb2RlSG9va3MucHJlcGF0Y2gobW91bnRlZE5vZGUsIG1vdW50ZWROb2RlKTtcbiAgICB9XG4gIH0sXG5cbiAgcHJlcGF0Y2g6IGZ1bmN0aW9uIHByZXBhdGNoIChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHZub2RlLmNvbXBvbmVudE9wdGlvbnM7XG4gICAgdmFyIGNoaWxkID0gdm5vZGUuY29tcG9uZW50SW5zdGFuY2UgPSBvbGRWbm9kZS5jb21wb25lbnRJbnN0YW5jZTtcbiAgICB1cGRhdGVDaGlsZENvbXBvbmVudChcbiAgICAgIGNoaWxkLFxuICAgICAgb3B0aW9ucy5wcm9wc0RhdGEsIC8vIHVwZGF0ZWQgcHJvcHNcbiAgICAgIG9wdGlvbnMubGlzdGVuZXJzLCAvLyB1cGRhdGVkIGxpc3RlbmVyc1xuICAgICAgdm5vZGUsIC8vIG5ldyBwYXJlbnQgdm5vZGVcbiAgICAgIG9wdGlvbnMuY2hpbGRyZW4gLy8gbmV3IGNoaWxkcmVuXG4gICAgKTtcbiAgfSxcblxuICBpbnNlcnQ6IGZ1bmN0aW9uIGluc2VydCAodm5vZGUpIHtcbiAgICB2YXIgY29udGV4dCA9IHZub2RlLmNvbnRleHQ7XG4gICAgdmFyIGNvbXBvbmVudEluc3RhbmNlID0gdm5vZGUuY29tcG9uZW50SW5zdGFuY2U7XG4gICAgaWYgKCFjb21wb25lbnRJbnN0YW5jZS5faXNNb3VudGVkKSB7XG4gICAgICBjb21wb25lbnRJbnN0YW5jZS5faXNNb3VudGVkID0gdHJ1ZTtcbiAgICAgIGNhbGxIb29rKGNvbXBvbmVudEluc3RhbmNlLCAnbW91bnRlZCcpO1xuICAgIH1cbiAgICBpZiAodm5vZGUuZGF0YS5rZWVwQWxpdmUpIHtcbiAgICAgIGlmIChjb250ZXh0Ll9pc01vdW50ZWQpIHtcbiAgICAgICAgLy8gdnVlLXJvdXRlciMxMjEyXG4gICAgICAgIC8vIER1cmluZyB1cGRhdGVzLCBhIGtlcHQtYWxpdmUgY29tcG9uZW50J3MgY2hpbGQgY29tcG9uZW50cyBtYXlcbiAgICAgICAgLy8gY2hhbmdlLCBzbyBkaXJlY3RseSB3YWxraW5nIHRoZSB0cmVlIGhlcmUgbWF5IGNhbGwgYWN0aXZhdGVkIGhvb2tzXG4gICAgICAgIC8vIG9uIGluY29ycmVjdCBjaGlsZHJlbi4gSW5zdGVhZCB3ZSBwdXNoIHRoZW0gaW50byBhIHF1ZXVlIHdoaWNoIHdpbGxcbiAgICAgICAgLy8gYmUgcHJvY2Vzc2VkIGFmdGVyIHRoZSB3aG9sZSBwYXRjaCBwcm9jZXNzIGVuZGVkLlxuICAgICAgICBxdWV1ZUFjdGl2YXRlZENvbXBvbmVudChjb21wb25lbnRJbnN0YW5jZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY3RpdmF0ZUNoaWxkQ29tcG9uZW50KGNvbXBvbmVudEluc3RhbmNlLCB0cnVlIC8qIGRpcmVjdCAqLyk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uIGRlc3Ryb3kgKHZub2RlKSB7XG4gICAgdmFyIGNvbXBvbmVudEluc3RhbmNlID0gdm5vZGUuY29tcG9uZW50SW5zdGFuY2U7XG4gICAgaWYgKCFjb21wb25lbnRJbnN0YW5jZS5faXNEZXN0cm95ZWQpIHtcbiAgICAgIGlmICghdm5vZGUuZGF0YS5rZWVwQWxpdmUpIHtcbiAgICAgICAgY29tcG9uZW50SW5zdGFuY2UuJGRlc3Ryb3koKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlYWN0aXZhdGVDaGlsZENvbXBvbmVudChjb21wb25lbnRJbnN0YW5jZSwgdHJ1ZSAvKiBkaXJlY3QgKi8pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxudmFyIGhvb2tzVG9NZXJnZSA9IE9iamVjdC5rZXlzKGNvbXBvbmVudFZOb2RlSG9va3MpO1xuXG5mdW5jdGlvbiBjcmVhdGVDb21wb25lbnQgKFxuICBDdG9yLFxuICBkYXRhLFxuICBjb250ZXh0LFxuICBjaGlsZHJlbixcbiAgdGFnXG4pIHtcbiAgaWYgKGlzVW5kZWYoQ3RvcikpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHZhciBiYXNlQ3RvciA9IGNvbnRleHQuJG9wdGlvbnMuX2Jhc2U7XG5cbiAgLy8gcGxhaW4gb3B0aW9ucyBvYmplY3Q6IHR1cm4gaXQgaW50byBhIGNvbnN0cnVjdG9yXG4gIGlmIChpc09iamVjdChDdG9yKSkge1xuICAgIEN0b3IgPSBiYXNlQ3Rvci5leHRlbmQoQ3Rvcik7XG4gIH1cblxuICAvLyBpZiBhdCB0aGlzIHN0YWdlIGl0J3Mgbm90IGEgY29uc3RydWN0b3Igb3IgYW4gYXN5bmMgY29tcG9uZW50IGZhY3RvcnksXG4gIC8vIHJlamVjdC5cbiAgaWYgKHR5cGVvZiBDdG9yICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHdhcm4oKFwiSW52YWxpZCBDb21wb25lbnQgZGVmaW5pdGlvbjogXCIgKyAoU3RyaW5nKEN0b3IpKSksIGNvbnRleHQpO1xuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIGFzeW5jIGNvbXBvbmVudFxuICB2YXIgYXN5bmNGYWN0b3J5O1xuICBpZiAoaXNVbmRlZihDdG9yLmNpZCkpIHtcbiAgICBhc3luY0ZhY3RvcnkgPSBDdG9yO1xuICAgIEN0b3IgPSByZXNvbHZlQXN5bmNDb21wb25lbnQoYXN5bmNGYWN0b3J5LCBiYXNlQ3RvciwgY29udGV4dCk7XG4gICAgaWYgKEN0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gcmV0dXJuIGEgcGxhY2Vob2xkZXIgbm9kZSBmb3IgYXN5bmMgY29tcG9uZW50LCB3aGljaCBpcyByZW5kZXJlZFxuICAgICAgLy8gYXMgYSBjb21tZW50IG5vZGUgYnV0IHByZXNlcnZlcyBhbGwgdGhlIHJhdyBpbmZvcm1hdGlvbiBmb3IgdGhlIG5vZGUuXG4gICAgICAvLyB0aGUgaW5mb3JtYXRpb24gd2lsbCBiZSB1c2VkIGZvciBhc3luYyBzZXJ2ZXItcmVuZGVyaW5nIGFuZCBoeWRyYXRpb24uXG4gICAgICByZXR1cm4gY3JlYXRlQXN5bmNQbGFjZWhvbGRlcihcbiAgICAgICAgYXN5bmNGYWN0b3J5LFxuICAgICAgICBkYXRhLFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgdGFnXG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgZGF0YSA9IGRhdGEgfHwge307XG5cbiAgLy8gcmVzb2x2ZSBjb25zdHJ1Y3RvciBvcHRpb25zIGluIGNhc2UgZ2xvYmFsIG1peGlucyBhcmUgYXBwbGllZCBhZnRlclxuICAvLyBjb21wb25lbnQgY29uc3RydWN0b3IgY3JlYXRpb25cbiAgcmVzb2x2ZUNvbnN0cnVjdG9yT3B0aW9ucyhDdG9yKTtcblxuICAvLyB0cmFuc2Zvcm0gY29tcG9uZW50IHYtbW9kZWwgZGF0YSBpbnRvIHByb3BzICYgZXZlbnRzXG4gIGlmIChpc0RlZihkYXRhLm1vZGVsKSkge1xuICAgIHRyYW5zZm9ybU1vZGVsKEN0b3Iub3B0aW9ucywgZGF0YSk7XG4gIH1cblxuICAvLyBleHRyYWN0IHByb3BzXG4gIHZhciBwcm9wc0RhdGEgPSBleHRyYWN0UHJvcHNGcm9tVk5vZGVEYXRhKGRhdGEsIEN0b3IsIHRhZyk7XG5cbiAgLy8gZnVuY3Rpb25hbCBjb21wb25lbnRcbiAgaWYgKGlzVHJ1ZShDdG9yLm9wdGlvbnMuZnVuY3Rpb25hbCkpIHtcbiAgICByZXR1cm4gY3JlYXRlRnVuY3Rpb25hbENvbXBvbmVudChDdG9yLCBwcm9wc0RhdGEsIGRhdGEsIGNvbnRleHQsIGNoaWxkcmVuKVxuICB9XG5cbiAgLy8gZXh0cmFjdCBsaXN0ZW5lcnMsIHNpbmNlIHRoZXNlIG5lZWRzIHRvIGJlIHRyZWF0ZWQgYXNcbiAgLy8gY2hpbGQgY29tcG9uZW50IGxpc3RlbmVycyBpbnN0ZWFkIG9mIERPTSBsaXN0ZW5lcnNcbiAgdmFyIGxpc3RlbmVycyA9IGRhdGEub247XG4gIC8vIHJlcGxhY2Ugd2l0aCBsaXN0ZW5lcnMgd2l0aCAubmF0aXZlIG1vZGlmaWVyXG4gIC8vIHNvIGl0IGdldHMgcHJvY2Vzc2VkIGR1cmluZyBwYXJlbnQgY29tcG9uZW50IHBhdGNoLlxuICBkYXRhLm9uID0gZGF0YS5uYXRpdmVPbjtcblxuICBpZiAoaXNUcnVlKEN0b3Iub3B0aW9ucy5hYnN0cmFjdCkpIHtcbiAgICAvLyBhYnN0cmFjdCBjb21wb25lbnRzIGRvIG5vdCBrZWVwIGFueXRoaW5nXG4gICAgLy8gb3RoZXIgdGhhbiBwcm9wcyAmIGxpc3RlbmVycyAmIHNsb3RcblxuICAgIC8vIHdvcmsgYXJvdW5kIGZsb3dcbiAgICB2YXIgc2xvdCA9IGRhdGEuc2xvdDtcbiAgICBkYXRhID0ge307XG4gICAgaWYgKHNsb3QpIHtcbiAgICAgIGRhdGEuc2xvdCA9IHNsb3Q7XG4gICAgfVxuICB9XG5cbiAgLy8gbWVyZ2UgY29tcG9uZW50IG1hbmFnZW1lbnQgaG9va3Mgb250byB0aGUgcGxhY2Vob2xkZXIgbm9kZVxuICBtZXJnZUhvb2tzKGRhdGEpO1xuXG4gIC8vIHJldHVybiBhIHBsYWNlaG9sZGVyIHZub2RlXG4gIHZhciBuYW1lID0gQ3Rvci5vcHRpb25zLm5hbWUgfHwgdGFnO1xuICB2YXIgdm5vZGUgPSBuZXcgVk5vZGUoXG4gICAgKFwidnVlLWNvbXBvbmVudC1cIiArIChDdG9yLmNpZCkgKyAobmFtZSA/IChcIi1cIiArIG5hbWUpIDogJycpKSxcbiAgICBkYXRhLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjb250ZXh0LFxuICAgIHsgQ3RvcjogQ3RvciwgcHJvcHNEYXRhOiBwcm9wc0RhdGEsIGxpc3RlbmVyczogbGlzdGVuZXJzLCB0YWc6IHRhZywgY2hpbGRyZW46IGNoaWxkcmVuIH0sXG4gICAgYXN5bmNGYWN0b3J5XG4gICk7XG5cbiAgLy8gV2VleCBzcGVjaWZpYzogaW52b2tlIHJlY3ljbGUtbGlzdCBvcHRpbWl6ZWQgQHJlbmRlciBmdW5jdGlvbiBmb3JcbiAgLy8gZXh0cmFjdGluZyBjZWxsLXNsb3QgdGVtcGxhdGUuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9IYW5rczEwMTAwL3dlZXgtbmF0aXZlLWRpcmVjdGl2ZS90cmVlL21hc3Rlci9jb21wb25lbnRcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICh0cnVlICYmIGlzUmVjeWNsYWJsZUNvbXBvbmVudCh2bm9kZSkpIHtcbiAgICByZXR1cm4gcmVuZGVyUmVjeWNsYWJsZUNvbXBvbmVudFRlbXBsYXRlKHZub2RlKVxuICB9XG5cbiAgcmV0dXJuIHZub2RlXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudEluc3RhbmNlRm9yVm5vZGUgKFxuICB2bm9kZSwgLy8gd2Uga25vdyBpdCdzIE1vdW50ZWRDb21wb25lbnRWTm9kZSBidXQgZmxvdyBkb2Vzbid0XG4gIHBhcmVudCwgLy8gYWN0aXZlSW5zdGFuY2UgaW4gbGlmZWN5Y2xlIHN0YXRlXG4gIHBhcmVudEVsbSxcbiAgcmVmRWxtXG4pIHtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgX2lzQ29tcG9uZW50OiB0cnVlLFxuICAgIHBhcmVudDogcGFyZW50LFxuICAgIF9wYXJlbnRWbm9kZTogdm5vZGUsXG4gICAgX3BhcmVudEVsbTogcGFyZW50RWxtIHx8IG51bGwsXG4gICAgX3JlZkVsbTogcmVmRWxtIHx8IG51bGxcbiAgfTtcbiAgLy8gY2hlY2sgaW5saW5lLXRlbXBsYXRlIHJlbmRlciBmdW5jdGlvbnNcbiAgdmFyIGlubGluZVRlbXBsYXRlID0gdm5vZGUuZGF0YS5pbmxpbmVUZW1wbGF0ZTtcbiAgaWYgKGlzRGVmKGlubGluZVRlbXBsYXRlKSkge1xuICAgIG9wdGlvbnMucmVuZGVyID0gaW5saW5lVGVtcGxhdGUucmVuZGVyO1xuICAgIG9wdGlvbnMuc3RhdGljUmVuZGVyRm5zID0gaW5saW5lVGVtcGxhdGUuc3RhdGljUmVuZGVyRm5zO1xuICB9XG4gIHJldHVybiBuZXcgdm5vZGUuY29tcG9uZW50T3B0aW9ucy5DdG9yKG9wdGlvbnMpXG59XG5cbmZ1bmN0aW9uIG1lcmdlSG9va3MgKGRhdGEpIHtcbiAgaWYgKCFkYXRhLmhvb2spIHtcbiAgICBkYXRhLmhvb2sgPSB7fTtcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGhvb2tzVG9NZXJnZS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBrZXkgPSBob29rc1RvTWVyZ2VbaV07XG4gICAgdmFyIGZyb21QYXJlbnQgPSBkYXRhLmhvb2tba2V5XTtcbiAgICB2YXIgb3VycyA9IGNvbXBvbmVudFZOb2RlSG9va3Nba2V5XTtcbiAgICBkYXRhLmhvb2tba2V5XSA9IGZyb21QYXJlbnQgPyBtZXJnZUhvb2skMShvdXJzLCBmcm9tUGFyZW50KSA6IG91cnM7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWVyZ2VIb29rJDEgKG9uZSwgdHdvKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYSwgYiwgYywgZCkge1xuICAgIG9uZShhLCBiLCBjLCBkKTtcbiAgICB0d28oYSwgYiwgYywgZCk7XG4gIH1cbn1cblxuLy8gdHJhbnNmb3JtIGNvbXBvbmVudCB2LW1vZGVsIGluZm8gKHZhbHVlIGFuZCBjYWxsYmFjaykgaW50b1xuLy8gcHJvcCBhbmQgZXZlbnQgaGFuZGxlciByZXNwZWN0aXZlbHkuXG5mdW5jdGlvbiB0cmFuc2Zvcm1Nb2RlbCAob3B0aW9ucywgZGF0YSkge1xuICB2YXIgcHJvcCA9IChvcHRpb25zLm1vZGVsICYmIG9wdGlvbnMubW9kZWwucHJvcCkgfHwgJ3ZhbHVlJztcbiAgdmFyIGV2ZW50ID0gKG9wdGlvbnMubW9kZWwgJiYgb3B0aW9ucy5tb2RlbC5ldmVudCkgfHwgJ2lucHV0JzsoZGF0YS5wcm9wcyB8fCAoZGF0YS5wcm9wcyA9IHt9KSlbcHJvcF0gPSBkYXRhLm1vZGVsLnZhbHVlO1xuICB2YXIgb24gPSBkYXRhLm9uIHx8IChkYXRhLm9uID0ge30pO1xuICBpZiAoaXNEZWYob25bZXZlbnRdKSkge1xuICAgIG9uW2V2ZW50XSA9IFtkYXRhLm1vZGVsLmNhbGxiYWNrXS5jb25jYXQob25bZXZlbnRdKTtcbiAgfSBlbHNlIHtcbiAgICBvbltldmVudF0gPSBkYXRhLm1vZGVsLmNhbGxiYWNrO1xuICB9XG59XG5cbi8qICAqL1xuXG52YXIgU0lNUExFX05PUk1BTElaRSA9IDE7XG52YXIgQUxXQVlTX05PUk1BTElaRSA9IDI7XG5cbi8vIHdyYXBwZXIgZnVuY3Rpb24gZm9yIHByb3ZpZGluZyBhIG1vcmUgZmxleGlibGUgaW50ZXJmYWNlXG4vLyB3aXRob3V0IGdldHRpbmcgeWVsbGVkIGF0IGJ5IGZsb3dcbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQgKFxuICBjb250ZXh0LFxuICB0YWcsXG4gIGRhdGEsXG4gIGNoaWxkcmVuLFxuICBub3JtYWxpemF0aW9uVHlwZSxcbiAgYWx3YXlzTm9ybWFsaXplXG4pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkgfHwgaXNQcmltaXRpdmUoZGF0YSkpIHtcbiAgICBub3JtYWxpemF0aW9uVHlwZSA9IGNoaWxkcmVuO1xuICAgIGNoaWxkcmVuID0gZGF0YTtcbiAgICBkYXRhID0gdW5kZWZpbmVkO1xuICB9XG4gIGlmIChpc1RydWUoYWx3YXlzTm9ybWFsaXplKSkge1xuICAgIG5vcm1hbGl6YXRpb25UeXBlID0gQUxXQVlTX05PUk1BTElaRTtcbiAgfVxuICByZXR1cm4gX2NyZWF0ZUVsZW1lbnQoY29udGV4dCwgdGFnLCBkYXRhLCBjaGlsZHJlbiwgbm9ybWFsaXphdGlvblR5cGUpXG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVFbGVtZW50IChcbiAgY29udGV4dCxcbiAgdGFnLFxuICBkYXRhLFxuICBjaGlsZHJlbixcbiAgbm9ybWFsaXphdGlvblR5cGVcbikge1xuICBpZiAoaXNEZWYoZGF0YSkgJiYgaXNEZWYoKGRhdGEpLl9fb2JfXykpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICBcIkF2b2lkIHVzaW5nIG9ic2VydmVkIGRhdGEgb2JqZWN0IGFzIHZub2RlIGRhdGE6IFwiICsgKEpTT04uc3RyaW5naWZ5KGRhdGEpKSArIFwiXFxuXCIgK1xuICAgICAgJ0Fsd2F5cyBjcmVhdGUgZnJlc2ggdm5vZGUgZGF0YSBvYmplY3RzIGluIGVhY2ggcmVuZGVyIScsXG4gICAgICBjb250ZXh0XG4gICAgKTtcbiAgICByZXR1cm4gY3JlYXRlRW1wdHlWTm9kZSgpXG4gIH1cbiAgLy8gb2JqZWN0IHN5bnRheCBpbiB2LWJpbmRcbiAgaWYgKGlzRGVmKGRhdGEpICYmIGlzRGVmKGRhdGEuaXMpKSB7XG4gICAgdGFnID0gZGF0YS5pcztcbiAgfVxuICBpZiAoIXRhZykge1xuICAgIC8vIGluIGNhc2Ugb2YgY29tcG9uZW50IDppcyBzZXQgdG8gZmFsc3kgdmFsdWVcbiAgICByZXR1cm4gY3JlYXRlRW1wdHlWTm9kZSgpXG4gIH1cbiAgLy8gd2FybiBhZ2FpbnN0IG5vbi1wcmltaXRpdmUga2V5XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmXG4gICAgaXNEZWYoZGF0YSkgJiYgaXNEZWYoZGF0YS5rZXkpICYmICFpc1ByaW1pdGl2ZShkYXRhLmtleSlcbiAgKSB7XG4gICAgaWYgKCF0cnVlIHx8ICEoJ0BiaW5kaW5nJyBpbiBkYXRhLmtleSkpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgICdBdm9pZCB1c2luZyBub24tcHJpbWl0aXZlIHZhbHVlIGFzIGtleSwgJyArXG4gICAgICAgICd1c2Ugc3RyaW5nL251bWJlciB2YWx1ZSBpbnN0ZWFkLicsXG4gICAgICAgIGNvbnRleHRcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIC8vIHN1cHBvcnQgc2luZ2xlIGZ1bmN0aW9uIGNoaWxkcmVuIGFzIGRlZmF1bHQgc2NvcGVkIHNsb3RcbiAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pICYmXG4gICAgdHlwZW9mIGNoaWxkcmVuWzBdID09PSAnZnVuY3Rpb24nXG4gICkge1xuICAgIGRhdGEgPSBkYXRhIHx8IHt9O1xuICAgIGRhdGEuc2NvcGVkU2xvdHMgPSB7IGRlZmF1bHQ6IGNoaWxkcmVuWzBdIH07XG4gICAgY2hpbGRyZW4ubGVuZ3RoID0gMDtcbiAgfVxuICBpZiAobm9ybWFsaXphdGlvblR5cGUgPT09IEFMV0FZU19OT1JNQUxJWkUpIHtcbiAgICBjaGlsZHJlbiA9IG5vcm1hbGl6ZUNoaWxkcmVuKGNoaWxkcmVuKTtcbiAgfSBlbHNlIGlmIChub3JtYWxpemF0aW9uVHlwZSA9PT0gU0lNUExFX05PUk1BTElaRSkge1xuICAgIGNoaWxkcmVuID0gc2ltcGxlTm9ybWFsaXplQ2hpbGRyZW4oY2hpbGRyZW4pO1xuICB9XG4gIHZhciB2bm9kZSwgbnM7XG4gIGlmICh0eXBlb2YgdGFnID09PSAnc3RyaW5nJykge1xuICAgIHZhciBDdG9yO1xuICAgIG5zID0gKGNvbnRleHQuJHZub2RlICYmIGNvbnRleHQuJHZub2RlLm5zKSB8fCBjb25maWcuZ2V0VGFnTmFtZXNwYWNlKHRhZyk7XG4gICAgaWYgKGNvbmZpZy5pc1Jlc2VydmVkVGFnKHRhZykpIHtcbiAgICAgIC8vIHBsYXRmb3JtIGJ1aWx0LWluIGVsZW1lbnRzXG4gICAgICB2bm9kZSA9IG5ldyBWTm9kZShcbiAgICAgICAgY29uZmlnLnBhcnNlUGxhdGZvcm1UYWdOYW1lKHRhZyksIGRhdGEsIGNoaWxkcmVuLFxuICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY29udGV4dFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKGlzRGVmKEN0b3IgPSByZXNvbHZlQXNzZXQoY29udGV4dC4kb3B0aW9ucywgJ2NvbXBvbmVudHMnLCB0YWcpKSkge1xuICAgICAgLy8gY29tcG9uZW50XG4gICAgICB2bm9kZSA9IGNyZWF0ZUNvbXBvbmVudChDdG9yLCBkYXRhLCBjb250ZXh0LCBjaGlsZHJlbiwgdGFnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdW5rbm93biBvciB1bmxpc3RlZCBuYW1lc3BhY2VkIGVsZW1lbnRzXG4gICAgICAvLyBjaGVjayBhdCBydW50aW1lIGJlY2F1c2UgaXQgbWF5IGdldCBhc3NpZ25lZCBhIG5hbWVzcGFjZSB3aGVuIGl0c1xuICAgICAgLy8gcGFyZW50IG5vcm1hbGl6ZXMgY2hpbGRyZW5cbiAgICAgIHZub2RlID0gbmV3IFZOb2RlKFxuICAgICAgICB0YWcsIGRhdGEsIGNoaWxkcmVuLFxuICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY29udGV4dFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gZGlyZWN0IGNvbXBvbmVudCBvcHRpb25zIC8gY29uc3RydWN0b3JcbiAgICB2bm9kZSA9IGNyZWF0ZUNvbXBvbmVudCh0YWcsIGRhdGEsIGNvbnRleHQsIGNoaWxkcmVuKTtcbiAgfVxuICBpZiAoaXNEZWYodm5vZGUpKSB7XG4gICAgaWYgKG5zKSB7IGFwcGx5TlModm5vZGUsIG5zKTsgfVxuICAgIHJldHVybiB2bm9kZVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBjcmVhdGVFbXB0eVZOb2RlKClcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseU5TICh2bm9kZSwgbnMsIGZvcmNlKSB7XG4gIHZub2RlLm5zID0gbnM7XG4gIGlmICh2bm9kZS50YWcgPT09ICdmb3JlaWduT2JqZWN0Jykge1xuICAgIC8vIHVzZSBkZWZhdWx0IG5hbWVzcGFjZSBpbnNpZGUgZm9yZWlnbk9iamVjdFxuICAgIG5zID0gdW5kZWZpbmVkO1xuICAgIGZvcmNlID0gdHJ1ZTtcbiAgfVxuICBpZiAoaXNEZWYodm5vZGUuY2hpbGRyZW4pKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB2bm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IHZub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgaWYgKGlzRGVmKGNoaWxkLnRhZykgJiYgKGlzVW5kZWYoY2hpbGQubnMpIHx8IGlzVHJ1ZShmb3JjZSkpKSB7XG4gICAgICAgIGFwcGx5TlMoY2hpbGQsIG5zLCBmb3JjZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBpbml0UmVuZGVyICh2bSkge1xuICB2bS5fdm5vZGUgPSBudWxsOyAvLyB0aGUgcm9vdCBvZiB0aGUgY2hpbGQgdHJlZVxuICB2bS5fc3RhdGljVHJlZXMgPSBudWxsOyAvLyB2LW9uY2UgY2FjaGVkIHRyZWVzXG4gIHZhciBvcHRpb25zID0gdm0uJG9wdGlvbnM7XG4gIHZhciBwYXJlbnRWbm9kZSA9IHZtLiR2bm9kZSA9IG9wdGlvbnMuX3BhcmVudFZub2RlOyAvLyB0aGUgcGxhY2Vob2xkZXIgbm9kZSBpbiBwYXJlbnQgdHJlZVxuICB2YXIgcmVuZGVyQ29udGV4dCA9IHBhcmVudFZub2RlICYmIHBhcmVudFZub2RlLmNvbnRleHQ7XG4gIHZtLiRzbG90cyA9IHJlc29sdmVTbG90cyhvcHRpb25zLl9yZW5kZXJDaGlsZHJlbiwgcmVuZGVyQ29udGV4dCk7XG4gIHZtLiRzY29wZWRTbG90cyA9IGVtcHR5T2JqZWN0O1xuICAvLyBiaW5kIHRoZSBjcmVhdGVFbGVtZW50IGZuIHRvIHRoaXMgaW5zdGFuY2VcbiAgLy8gc28gdGhhdCB3ZSBnZXQgcHJvcGVyIHJlbmRlciBjb250ZXh0IGluc2lkZSBpdC5cbiAgLy8gYXJncyBvcmRlcjogdGFnLCBkYXRhLCBjaGlsZHJlbiwgbm9ybWFsaXphdGlvblR5cGUsIGFsd2F5c05vcm1hbGl6ZVxuICAvLyBpbnRlcm5hbCB2ZXJzaW9uIGlzIHVzZWQgYnkgcmVuZGVyIGZ1bmN0aW9ucyBjb21waWxlZCBmcm9tIHRlbXBsYXRlc1xuICB2bS5fYyA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkKSB7IHJldHVybiBjcmVhdGVFbGVtZW50KHZtLCBhLCBiLCBjLCBkLCBmYWxzZSk7IH07XG4gIC8vIG5vcm1hbGl6YXRpb24gaXMgYWx3YXlzIGFwcGxpZWQgZm9yIHRoZSBwdWJsaWMgdmVyc2lvbiwgdXNlZCBpblxuICAvLyB1c2VyLXdyaXR0ZW4gcmVuZGVyIGZ1bmN0aW9ucy5cbiAgdm0uJGNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoYSwgYiwgYywgZCkgeyByZXR1cm4gY3JlYXRlRWxlbWVudCh2bSwgYSwgYiwgYywgZCwgdHJ1ZSk7IH07XG5cbiAgLy8gJGF0dHJzICYgJGxpc3RlbmVycyBhcmUgZXhwb3NlZCBmb3IgZWFzaWVyIEhPQyBjcmVhdGlvbi5cbiAgLy8gdGhleSBuZWVkIHRvIGJlIHJlYWN0aXZlIHNvIHRoYXQgSE9DcyB1c2luZyB0aGVtIGFyZSBhbHdheXMgdXBkYXRlZFxuICB2YXIgcGFyZW50RGF0YSA9IHBhcmVudFZub2RlICYmIHBhcmVudFZub2RlLmRhdGE7XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBkZWZpbmVSZWFjdGl2ZSh2bSwgJyRhdHRycycsIHBhcmVudERhdGEgJiYgcGFyZW50RGF0YS5hdHRycyB8fCBlbXB0eU9iamVjdCwgZnVuY3Rpb24gKCkge1xuICAgICAgIWlzVXBkYXRpbmdDaGlsZENvbXBvbmVudCAmJiB3YXJuKFwiJGF0dHJzIGlzIHJlYWRvbmx5LlwiLCB2bSk7XG4gICAgfSwgdHJ1ZSk7XG4gICAgZGVmaW5lUmVhY3RpdmUodm0sICckbGlzdGVuZXJzJywgb3B0aW9ucy5fcGFyZW50TGlzdGVuZXJzIHx8IGVtcHR5T2JqZWN0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAhaXNVcGRhdGluZ0NoaWxkQ29tcG9uZW50ICYmIHdhcm4oXCIkbGlzdGVuZXJzIGlzIHJlYWRvbmx5LlwiLCB2bSk7XG4gICAgfSwgdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgZGVmaW5lUmVhY3RpdmUodm0sICckYXR0cnMnLCBwYXJlbnREYXRhICYmIHBhcmVudERhdGEuYXR0cnMgfHwgZW1wdHlPYmplY3QsIG51bGwsIHRydWUpO1xuICAgIGRlZmluZVJlYWN0aXZlKHZtLCAnJGxpc3RlbmVycycsIG9wdGlvbnMuX3BhcmVudExpc3RlbmVycyB8fCBlbXB0eU9iamVjdCwgbnVsbCwgdHJ1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyTWl4aW4gKFZ1ZSkge1xuICAvLyBpbnN0YWxsIHJ1bnRpbWUgY29udmVuaWVuY2UgaGVscGVyc1xuICBpbnN0YWxsUmVuZGVySGVscGVycyhWdWUucHJvdG90eXBlKTtcblxuICBWdWUucHJvdG90eXBlLiRuZXh0VGljayA9IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBuZXh0VGljayhmbiwgdGhpcylcbiAgfTtcblxuICBWdWUucHJvdG90eXBlLl9yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICB2YXIgcmVmID0gdm0uJG9wdGlvbnM7XG4gICAgdmFyIHJlbmRlciA9IHJlZi5yZW5kZXI7XG4gICAgdmFyIF9wYXJlbnRWbm9kZSA9IHJlZi5fcGFyZW50Vm5vZGU7XG5cbiAgICBpZiAodm0uX2lzTW91bnRlZCkge1xuICAgICAgLy8gaWYgdGhlIHBhcmVudCBkaWRuJ3QgdXBkYXRlLCB0aGUgc2xvdCBub2RlcyB3aWxsIGJlIHRoZSBvbmVzIGZyb21cbiAgICAgIC8vIGxhc3QgcmVuZGVyLiBUaGV5IG5lZWQgdG8gYmUgY2xvbmVkIHRvIGVuc3VyZSBcImZyZXNobmVzc1wiIGZvciB0aGlzIHJlbmRlci5cbiAgICAgIGZvciAodmFyIGtleSBpbiB2bS4kc2xvdHMpIHtcbiAgICAgICAgdmFyIHNsb3QgPSB2bS4kc2xvdHNba2V5XTtcbiAgICAgICAgLy8gX3JlbmRlcmVkIGlzIGEgZmxhZyBhZGRlZCBieSByZW5kZXJTbG90LCBidXQgbWF5IG5vdCBiZSBwcmVzZW50XG4gICAgICAgIC8vIGlmIHRoZSBzbG90IGlzIHBhc3NlZCBmcm9tIG1hbnVhbGx5IHdyaXR0ZW4gcmVuZGVyIGZ1bmN0aW9uc1xuICAgICAgICBpZiAoc2xvdC5fcmVuZGVyZWQgfHwgKHNsb3RbMF0gJiYgc2xvdFswXS5lbG0pKSB7XG4gICAgICAgICAgdm0uJHNsb3RzW2tleV0gPSBjbG9uZVZOb2RlcyhzbG90LCB0cnVlIC8qIGRlZXAgKi8pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdm0uJHNjb3BlZFNsb3RzID0gKF9wYXJlbnRWbm9kZSAmJiBfcGFyZW50Vm5vZGUuZGF0YS5zY29wZWRTbG90cykgfHwgZW1wdHlPYmplY3Q7XG5cbiAgICAvLyBzZXQgcGFyZW50IHZub2RlLiB0aGlzIGFsbG93cyByZW5kZXIgZnVuY3Rpb25zIHRvIGhhdmUgYWNjZXNzXG4gICAgLy8gdG8gdGhlIGRhdGEgb24gdGhlIHBsYWNlaG9sZGVyIG5vZGUuXG4gICAgdm0uJHZub2RlID0gX3BhcmVudFZub2RlO1xuICAgIC8vIHJlbmRlciBzZWxmXG4gICAgdmFyIHZub2RlO1xuICAgIHRyeSB7XG4gICAgICB2bm9kZSA9IHJlbmRlci5jYWxsKHZtLl9yZW5kZXJQcm94eSwgdm0uJGNyZWF0ZUVsZW1lbnQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGhhbmRsZUVycm9yKGUsIHZtLCBcInJlbmRlclwiKTtcbiAgICAgIC8vIHJldHVybiBlcnJvciByZW5kZXIgcmVzdWx0LFxuICAgICAgLy8gb3IgcHJldmlvdXMgdm5vZGUgdG8gcHJldmVudCByZW5kZXIgZXJyb3IgY2F1c2luZyBibGFuayBjb21wb25lbnRcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICBpZiAodm0uJG9wdGlvbnMucmVuZGVyRXJyb3IpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdm5vZGUgPSB2bS4kb3B0aW9ucy5yZW5kZXJFcnJvci5jYWxsKHZtLl9yZW5kZXJQcm94eSwgdm0uJGNyZWF0ZUVsZW1lbnQsIGUpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGhhbmRsZUVycm9yKGUsIHZtLCBcInJlbmRlckVycm9yXCIpO1xuICAgICAgICAgICAgdm5vZGUgPSB2bS5fdm5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZub2RlID0gdm0uX3Zub2RlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2bm9kZSA9IHZtLl92bm9kZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gcmV0dXJuIGVtcHR5IHZub2RlIGluIGNhc2UgdGhlIHJlbmRlciBmdW5jdGlvbiBlcnJvcmVkIG91dFxuICAgIGlmICghKHZub2RlIGluc3RhbmNlb2YgVk5vZGUpKSB7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBBcnJheS5pc0FycmF5KHZub2RlKSkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgICdNdWx0aXBsZSByb290IG5vZGVzIHJldHVybmVkIGZyb20gcmVuZGVyIGZ1bmN0aW9uLiBSZW5kZXIgZnVuY3Rpb24gJyArXG4gICAgICAgICAgJ3Nob3VsZCByZXR1cm4gYSBzaW5nbGUgcm9vdCBub2RlLicsXG4gICAgICAgICAgdm1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHZub2RlID0gY3JlYXRlRW1wdHlWTm9kZSgpO1xuICAgIH1cbiAgICAvLyBzZXQgcGFyZW50XG4gICAgdm5vZGUucGFyZW50ID0gX3BhcmVudFZub2RlO1xuICAgIHJldHVybiB2bm9kZVxuICB9O1xufVxuXG4vKiAgKi9cblxudmFyIHVpZCA9IDA7XG5cbmZ1bmN0aW9uIGluaXRNaXhpbiAoVnVlKSB7XG4gIFZ1ZS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgLy8gYSB1aWRcbiAgICB2bS5fdWlkID0gdWlkKys7XG5cbiAgICB2YXIgc3RhcnRUYWcsIGVuZFRhZztcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBjb25maWcucGVyZm9ybWFuY2UgJiYgbWFyaykge1xuICAgICAgc3RhcnRUYWcgPSBcInZ1ZS1wZXJmLXN0YXJ0OlwiICsgKHZtLl91aWQpO1xuICAgICAgZW5kVGFnID0gXCJ2dWUtcGVyZi1lbmQ6XCIgKyAodm0uX3VpZCk7XG4gICAgICBtYXJrKHN0YXJ0VGFnKTtcbiAgICB9XG5cbiAgICAvLyBhIGZsYWcgdG8gYXZvaWQgdGhpcyBiZWluZyBvYnNlcnZlZFxuICAgIHZtLl9pc1Z1ZSA9IHRydWU7XG4gICAgLy8gbWVyZ2Ugb3B0aW9uc1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuX2lzQ29tcG9uZW50KSB7XG4gICAgICAvLyBvcHRpbWl6ZSBpbnRlcm5hbCBjb21wb25lbnQgaW5zdGFudGlhdGlvblxuICAgICAgLy8gc2luY2UgZHluYW1pYyBvcHRpb25zIG1lcmdpbmcgaXMgcHJldHR5IHNsb3csIGFuZCBub25lIG9mIHRoZVxuICAgICAgLy8gaW50ZXJuYWwgY29tcG9uZW50IG9wdGlvbnMgbmVlZHMgc3BlY2lhbCB0cmVhdG1lbnQuXG4gICAgICBpbml0SW50ZXJuYWxDb21wb25lbnQodm0sIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2bS4kb3B0aW9ucyA9IG1lcmdlT3B0aW9ucyhcbiAgICAgICAgcmVzb2x2ZUNvbnN0cnVjdG9yT3B0aW9ucyh2bS5jb25zdHJ1Y3RvciksXG4gICAgICAgIG9wdGlvbnMgfHwge30sXG4gICAgICAgIHZtXG4gICAgICApO1xuICAgIH1cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBpbml0UHJveHkodm0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2bS5fcmVuZGVyUHJveHkgPSB2bTtcbiAgICB9XG4gICAgLy8gZXhwb3NlIHJlYWwgc2VsZlxuICAgIHZtLl9zZWxmID0gdm07XG4gICAgaW5pdExpZmVjeWNsZSh2bSk7XG4gICAgaW5pdEV2ZW50cyh2bSk7XG4gICAgaW5pdFJlbmRlcih2bSk7XG4gICAgY2FsbEhvb2sodm0sICdiZWZvcmVDcmVhdGUnKTtcbiAgICBpbml0SW5qZWN0aW9ucyh2bSk7IC8vIHJlc29sdmUgaW5qZWN0aW9ucyBiZWZvcmUgZGF0YS9wcm9wc1xuICAgIGluaXRTdGF0ZSh2bSk7XG4gICAgaW5pdFByb3ZpZGUodm0pOyAvLyByZXNvbHZlIHByb3ZpZGUgYWZ0ZXIgZGF0YS9wcm9wc1xuICAgIGNhbGxIb29rKHZtLCAnY3JlYXRlZCcpO1xuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgY29uZmlnLnBlcmZvcm1hbmNlICYmIG1hcmspIHtcbiAgICAgIHZtLl9uYW1lID0gZm9ybWF0Q29tcG9uZW50TmFtZSh2bSwgZmFsc2UpO1xuICAgICAgbWFyayhlbmRUYWcpO1xuICAgICAgbWVhc3VyZSgoXCJ2dWUgXCIgKyAodm0uX25hbWUpICsgXCIgaW5pdFwiKSwgc3RhcnRUYWcsIGVuZFRhZyk7XG4gICAgfVxuXG4gICAgaWYgKHZtLiRvcHRpb25zLmVsKSB7XG4gICAgICB2bS4kbW91bnQodm0uJG9wdGlvbnMuZWwpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gaW5pdEludGVybmFsQ29tcG9uZW50ICh2bSwgb3B0aW9ucykge1xuICB2YXIgb3B0cyA9IHZtLiRvcHRpb25zID0gT2JqZWN0LmNyZWF0ZSh2bS5jb25zdHJ1Y3Rvci5vcHRpb25zKTtcbiAgLy8gZG9pbmcgdGhpcyBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gZHluYW1pYyBlbnVtZXJhdGlvbi5cbiAgdmFyIHBhcmVudFZub2RlID0gb3B0aW9ucy5fcGFyZW50Vm5vZGU7XG4gIG9wdHMucGFyZW50ID0gb3B0aW9ucy5wYXJlbnQ7XG4gIG9wdHMuX3BhcmVudFZub2RlID0gcGFyZW50Vm5vZGU7XG4gIG9wdHMuX3BhcmVudEVsbSA9IG9wdGlvbnMuX3BhcmVudEVsbTtcbiAgb3B0cy5fcmVmRWxtID0gb3B0aW9ucy5fcmVmRWxtO1xuXG4gIHZhciB2bm9kZUNvbXBvbmVudE9wdGlvbnMgPSBwYXJlbnRWbm9kZS5jb21wb25lbnRPcHRpb25zO1xuICBvcHRzLnByb3BzRGF0YSA9IHZub2RlQ29tcG9uZW50T3B0aW9ucy5wcm9wc0RhdGE7XG4gIG9wdHMuX3BhcmVudExpc3RlbmVycyA9IHZub2RlQ29tcG9uZW50T3B0aW9ucy5saXN0ZW5lcnM7XG4gIG9wdHMuX3JlbmRlckNoaWxkcmVuID0gdm5vZGVDb21wb25lbnRPcHRpb25zLmNoaWxkcmVuO1xuICBvcHRzLl9jb21wb25lbnRUYWcgPSB2bm9kZUNvbXBvbmVudE9wdGlvbnMudGFnO1xuXG4gIGlmIChvcHRpb25zLnJlbmRlcikge1xuICAgIG9wdHMucmVuZGVyID0gb3B0aW9ucy5yZW5kZXI7XG4gICAgb3B0cy5zdGF0aWNSZW5kZXJGbnMgPSBvcHRpb25zLnN0YXRpY1JlbmRlckZucztcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlQ29uc3RydWN0b3JPcHRpb25zIChDdG9yKSB7XG4gIHZhciBvcHRpb25zID0gQ3Rvci5vcHRpb25zO1xuICBpZiAoQ3Rvci5zdXBlcikge1xuICAgIHZhciBzdXBlck9wdGlvbnMgPSByZXNvbHZlQ29uc3RydWN0b3JPcHRpb25zKEN0b3Iuc3VwZXIpO1xuICAgIHZhciBjYWNoZWRTdXBlck9wdGlvbnMgPSBDdG9yLnN1cGVyT3B0aW9ucztcbiAgICBpZiAoc3VwZXJPcHRpb25zICE9PSBjYWNoZWRTdXBlck9wdGlvbnMpIHtcbiAgICAgIC8vIHN1cGVyIG9wdGlvbiBjaGFuZ2VkLFxuICAgICAgLy8gbmVlZCB0byByZXNvbHZlIG5ldyBvcHRpb25zLlxuICAgICAgQ3Rvci5zdXBlck9wdGlvbnMgPSBzdXBlck9wdGlvbnM7XG4gICAgICAvLyBjaGVjayBpZiB0aGVyZSBhcmUgYW55IGxhdGUtbW9kaWZpZWQvYXR0YWNoZWQgb3B0aW9ucyAoIzQ5NzYpXG4gICAgICB2YXIgbW9kaWZpZWRPcHRpb25zID0gcmVzb2x2ZU1vZGlmaWVkT3B0aW9ucyhDdG9yKTtcbiAgICAgIC8vIHVwZGF0ZSBiYXNlIGV4dGVuZCBvcHRpb25zXG4gICAgICBpZiAobW9kaWZpZWRPcHRpb25zKSB7XG4gICAgICAgIGV4dGVuZChDdG9yLmV4dGVuZE9wdGlvbnMsIG1vZGlmaWVkT3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBvcHRpb25zID0gQ3Rvci5vcHRpb25zID0gbWVyZ2VPcHRpb25zKHN1cGVyT3B0aW9ucywgQ3Rvci5leHRlbmRPcHRpb25zKTtcbiAgICAgIGlmIChvcHRpb25zLm5hbWUpIHtcbiAgICAgICAgb3B0aW9ucy5jb21wb25lbnRzW29wdGlvbnMubmFtZV0gPSBDdG9yO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gb3B0aW9uc1xufVxuXG5mdW5jdGlvbiByZXNvbHZlTW9kaWZpZWRPcHRpb25zIChDdG9yKSB7XG4gIHZhciBtb2RpZmllZDtcbiAgdmFyIGxhdGVzdCA9IEN0b3Iub3B0aW9ucztcbiAgdmFyIGV4dGVuZGVkID0gQ3Rvci5leHRlbmRPcHRpb25zO1xuICB2YXIgc2VhbGVkID0gQ3Rvci5zZWFsZWRPcHRpb25zO1xuICBmb3IgKHZhciBrZXkgaW4gbGF0ZXN0KSB7XG4gICAgaWYgKGxhdGVzdFtrZXldICE9PSBzZWFsZWRba2V5XSkge1xuICAgICAgaWYgKCFtb2RpZmllZCkgeyBtb2RpZmllZCA9IHt9OyB9XG4gICAgICBtb2RpZmllZFtrZXldID0gZGVkdXBlKGxhdGVzdFtrZXldLCBleHRlbmRlZFtrZXldLCBzZWFsZWRba2V5XSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBtb2RpZmllZFxufVxuXG5mdW5jdGlvbiBkZWR1cGUgKGxhdGVzdCwgZXh0ZW5kZWQsIHNlYWxlZCkge1xuICAvLyBjb21wYXJlIGxhdGVzdCBhbmQgc2VhbGVkIHRvIGVuc3VyZSBsaWZlY3ljbGUgaG9va3Mgd29uJ3QgYmUgZHVwbGljYXRlZFxuICAvLyBiZXR3ZWVuIG1lcmdlc1xuICBpZiAoQXJyYXkuaXNBcnJheShsYXRlc3QpKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIHNlYWxlZCA9IEFycmF5LmlzQXJyYXkoc2VhbGVkKSA/IHNlYWxlZCA6IFtzZWFsZWRdO1xuICAgIGV4dGVuZGVkID0gQXJyYXkuaXNBcnJheShleHRlbmRlZCkgPyBleHRlbmRlZCA6IFtleHRlbmRlZF07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXRlc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIHB1c2ggb3JpZ2luYWwgb3B0aW9ucyBhbmQgbm90IHNlYWxlZCBvcHRpb25zIHRvIGV4Y2x1ZGUgZHVwbGljYXRlZCBvcHRpb25zXG4gICAgICBpZiAoZXh0ZW5kZWQuaW5kZXhPZihsYXRlc3RbaV0pID49IDAgfHwgc2VhbGVkLmluZGV4T2YobGF0ZXN0W2ldKSA8IDApIHtcbiAgICAgICAgcmVzLnB1c2gobGF0ZXN0W2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBsYXRlc3RcbiAgfVxufVxuXG5mdW5jdGlvbiBWdWUkMiAob3B0aW9ucykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJlxuICAgICEodGhpcyBpbnN0YW5jZW9mIFZ1ZSQyKVxuICApIHtcbiAgICB3YXJuKCdWdWUgaXMgYSBjb25zdHJ1Y3RvciBhbmQgc2hvdWxkIGJlIGNhbGxlZCB3aXRoIHRoZSBgbmV3YCBrZXl3b3JkJyk7XG4gIH1cbiAgdGhpcy5faW5pdChvcHRpb25zKTtcbn1cblxuaW5pdE1peGluKFZ1ZSQyKTtcbnN0YXRlTWl4aW4oVnVlJDIpO1xuZXZlbnRzTWl4aW4oVnVlJDIpO1xubGlmZWN5Y2xlTWl4aW4oVnVlJDIpO1xucmVuZGVyTWl4aW4oVnVlJDIpO1xuXG4vKiAgKi9cblxuZnVuY3Rpb24gaW5pdFVzZSAoVnVlKSB7XG4gIFZ1ZS51c2UgPSBmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgdmFyIGluc3RhbGxlZFBsdWdpbnMgPSAodGhpcy5faW5zdGFsbGVkUGx1Z2lucyB8fCAodGhpcy5faW5zdGFsbGVkUGx1Z2lucyA9IFtdKSk7XG4gICAgaWYgKGluc3RhbGxlZFBsdWdpbnMuaW5kZXhPZihwbHVnaW4pID4gLTEpIHtcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLy8gYWRkaXRpb25hbCBwYXJhbWV0ZXJzXG4gICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cywgMSk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIGlmICh0eXBlb2YgcGx1Z2luLmluc3RhbGwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHBsdWdpbi5pbnN0YWxsLmFwcGx5KHBsdWdpbiwgYXJncyk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGx1Z2luID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwbHVnaW4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfVxuICAgIGluc3RhbGxlZFBsdWdpbnMucHVzaChwbHVnaW4pO1xuICAgIHJldHVybiB0aGlzXG4gIH07XG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBpbml0TWl4aW4kMSAoVnVlKSB7XG4gIFZ1ZS5taXhpbiA9IGZ1bmN0aW9uIChtaXhpbikge1xuICAgIHRoaXMub3B0aW9ucyA9IG1lcmdlT3B0aW9ucyh0aGlzLm9wdGlvbnMsIG1peGluKTtcbiAgICByZXR1cm4gdGhpc1xuICB9O1xufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gaW5pdEV4dGVuZCAoVnVlKSB7XG4gIC8qKlxuICAgKiBFYWNoIGluc3RhbmNlIGNvbnN0cnVjdG9yLCBpbmNsdWRpbmcgVnVlLCBoYXMgYSB1bmlxdWVcbiAgICogY2lkLiBUaGlzIGVuYWJsZXMgdXMgdG8gY3JlYXRlIHdyYXBwZWQgXCJjaGlsZFxuICAgKiBjb25zdHJ1Y3RvcnNcIiBmb3IgcHJvdG90eXBhbCBpbmhlcml0YW5jZSBhbmQgY2FjaGUgdGhlbS5cbiAgICovXG4gIFZ1ZS5jaWQgPSAwO1xuICB2YXIgY2lkID0gMTtcblxuICAvKipcbiAgICogQ2xhc3MgaW5oZXJpdGFuY2VcbiAgICovXG4gIFZ1ZS5leHRlbmQgPSBmdW5jdGlvbiAoZXh0ZW5kT3B0aW9ucykge1xuICAgIGV4dGVuZE9wdGlvbnMgPSBleHRlbmRPcHRpb25zIHx8IHt9O1xuICAgIHZhciBTdXBlciA9IHRoaXM7XG4gICAgdmFyIFN1cGVySWQgPSBTdXBlci5jaWQ7XG4gICAgdmFyIGNhY2hlZEN0b3JzID0gZXh0ZW5kT3B0aW9ucy5fQ3RvciB8fCAoZXh0ZW5kT3B0aW9ucy5fQ3RvciA9IHt9KTtcbiAgICBpZiAoY2FjaGVkQ3RvcnNbU3VwZXJJZF0pIHtcbiAgICAgIHJldHVybiBjYWNoZWRDdG9yc1tTdXBlcklkXVxuICAgIH1cblxuICAgIHZhciBuYW1lID0gZXh0ZW5kT3B0aW9ucy5uYW1lIHx8IFN1cGVyLm9wdGlvbnMubmFtZTtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBuYW1lKSB7XG4gICAgICB2YWxpZGF0ZUNvbXBvbmVudE5hbWUobmFtZSk7XG4gICAgfVxuXG4gICAgdmFyIFN1YiA9IGZ1bmN0aW9uIFZ1ZUNvbXBvbmVudCAob3B0aW9ucykge1xuICAgICAgdGhpcy5faW5pdChvcHRpb25zKTtcbiAgICB9O1xuICAgIFN1Yi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN1cGVyLnByb3RvdHlwZSk7XG4gICAgU3ViLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN1YjtcbiAgICBTdWIuY2lkID0gY2lkKys7XG4gICAgU3ViLm9wdGlvbnMgPSBtZXJnZU9wdGlvbnMoXG4gICAgICBTdXBlci5vcHRpb25zLFxuICAgICAgZXh0ZW5kT3B0aW9uc1xuICAgICk7XG4gICAgU3ViWydzdXBlciddID0gU3VwZXI7XG5cbiAgICAvLyBGb3IgcHJvcHMgYW5kIGNvbXB1dGVkIHByb3BlcnRpZXMsIHdlIGRlZmluZSB0aGUgcHJveHkgZ2V0dGVycyBvblxuICAgIC8vIHRoZSBWdWUgaW5zdGFuY2VzIGF0IGV4dGVuc2lvbiB0aW1lLCBvbiB0aGUgZXh0ZW5kZWQgcHJvdG90eXBlLiBUaGlzXG4gICAgLy8gYXZvaWRzIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBjYWxscyBmb3IgZWFjaCBpbnN0YW5jZSBjcmVhdGVkLlxuICAgIGlmIChTdWIub3B0aW9ucy5wcm9wcykge1xuICAgICAgaW5pdFByb3BzJDEoU3ViKTtcbiAgICB9XG4gICAgaWYgKFN1Yi5vcHRpb25zLmNvbXB1dGVkKSB7XG4gICAgICBpbml0Q29tcHV0ZWQkMShTdWIpO1xuICAgIH1cblxuICAgIC8vIGFsbG93IGZ1cnRoZXIgZXh0ZW5zaW9uL21peGluL3BsdWdpbiB1c2FnZVxuICAgIFN1Yi5leHRlbmQgPSBTdXBlci5leHRlbmQ7XG4gICAgU3ViLm1peGluID0gU3VwZXIubWl4aW47XG4gICAgU3ViLnVzZSA9IFN1cGVyLnVzZTtcblxuICAgIC8vIGNyZWF0ZSBhc3NldCByZWdpc3RlcnMsIHNvIGV4dGVuZGVkIGNsYXNzZXNcbiAgICAvLyBjYW4gaGF2ZSB0aGVpciBwcml2YXRlIGFzc2V0cyB0b28uXG4gICAgQVNTRVRfVFlQRVMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgICAgU3ViW3R5cGVdID0gU3VwZXJbdHlwZV07XG4gICAgfSk7XG4gICAgLy8gZW5hYmxlIHJlY3Vyc2l2ZSBzZWxmLWxvb2t1cFxuICAgIGlmIChuYW1lKSB7XG4gICAgICBTdWIub3B0aW9ucy5jb21wb25lbnRzW25hbWVdID0gU3ViO1xuICAgIH1cblxuICAgIC8vIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIHN1cGVyIG9wdGlvbnMgYXQgZXh0ZW5zaW9uIHRpbWUuXG4gICAgLy8gbGF0ZXIgYXQgaW5zdGFudGlhdGlvbiB3ZSBjYW4gY2hlY2sgaWYgU3VwZXIncyBvcHRpb25zIGhhdmVcbiAgICAvLyBiZWVuIHVwZGF0ZWQuXG4gICAgU3ViLnN1cGVyT3B0aW9ucyA9IFN1cGVyLm9wdGlvbnM7XG4gICAgU3ViLmV4dGVuZE9wdGlvbnMgPSBleHRlbmRPcHRpb25zO1xuICAgIFN1Yi5zZWFsZWRPcHRpb25zID0gZXh0ZW5kKHt9LCBTdWIub3B0aW9ucyk7XG5cbiAgICAvLyBjYWNoZSBjb25zdHJ1Y3RvclxuICAgIGNhY2hlZEN0b3JzW1N1cGVySWRdID0gU3ViO1xuICAgIHJldHVybiBTdWJcbiAgfTtcbn1cblxuZnVuY3Rpb24gaW5pdFByb3BzJDEgKENvbXApIHtcbiAgdmFyIHByb3BzID0gQ29tcC5vcHRpb25zLnByb3BzO1xuICBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHtcbiAgICBwcm94eShDb21wLnByb3RvdHlwZSwgXCJfcHJvcHNcIiwga2V5KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0Q29tcHV0ZWQkMSAoQ29tcCkge1xuICB2YXIgY29tcHV0ZWQgPSBDb21wLm9wdGlvbnMuY29tcHV0ZWQ7XG4gIGZvciAodmFyIGtleSBpbiBjb21wdXRlZCkge1xuICAgIGRlZmluZUNvbXB1dGVkKENvbXAucHJvdG90eXBlLCBrZXksIGNvbXB1dGVkW2tleV0pO1xuICB9XG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBpbml0QXNzZXRSZWdpc3RlcnMgKFZ1ZSkge1xuICAvKipcbiAgICogQ3JlYXRlIGFzc2V0IHJlZ2lzdHJhdGlvbiBtZXRob2RzLlxuICAgKi9cbiAgQVNTRVRfVFlQRVMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIFZ1ZVt0eXBlXSA9IGZ1bmN0aW9uIChcbiAgICAgIGlkLFxuICAgICAgZGVmaW5pdGlvblxuICAgICkge1xuICAgICAgaWYgKCFkZWZpbml0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnNbdHlwZSArICdzJ11baWRdXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgdHlwZSA9PT0gJ2NvbXBvbmVudCcpIHtcbiAgICAgICAgICB2YWxpZGF0ZUNvbXBvbmVudE5hbWUoaWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnY29tcG9uZW50JyAmJiBpc1BsYWluT2JqZWN0KGRlZmluaXRpb24pKSB7XG4gICAgICAgICAgZGVmaW5pdGlvbi5uYW1lID0gZGVmaW5pdGlvbi5uYW1lIHx8IGlkO1xuICAgICAgICAgIGRlZmluaXRpb24gPSB0aGlzLm9wdGlvbnMuX2Jhc2UuZXh0ZW5kKGRlZmluaXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnZGlyZWN0aXZlJyAmJiB0eXBlb2YgZGVmaW5pdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGRlZmluaXRpb24gPSB7IGJpbmQ6IGRlZmluaXRpb24sIHVwZGF0ZTogZGVmaW5pdGlvbiB9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9uc1t0eXBlICsgJ3MnXVtpZF0gPSBkZWZpbml0aW9uO1xuICAgICAgICByZXR1cm4gZGVmaW5pdGlvblxuICAgICAgfVxuICAgIH07XG4gIH0pO1xufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50TmFtZSAob3B0cykge1xuICByZXR1cm4gb3B0cyAmJiAob3B0cy5DdG9yLm9wdGlvbnMubmFtZSB8fCBvcHRzLnRhZylcbn1cblxuZnVuY3Rpb24gbWF0Y2hlcyAocGF0dGVybiwgbmFtZSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShwYXR0ZXJuKSkge1xuICAgIHJldHVybiBwYXR0ZXJuLmluZGV4T2YobmFtZSkgPiAtMVxuICB9IGVsc2UgaWYgKHR5cGVvZiBwYXR0ZXJuID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBwYXR0ZXJuLnNwbGl0KCcsJykuaW5kZXhPZihuYW1lKSA+IC0xXG4gIH0gZWxzZSBpZiAoaXNSZWdFeHAocGF0dGVybikpIHtcbiAgICByZXR1cm4gcGF0dGVybi50ZXN0KG5hbWUpXG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIHBydW5lQ2FjaGUgKGtlZXBBbGl2ZUluc3RhbmNlLCBmaWx0ZXIpIHtcbiAgdmFyIGNhY2hlID0ga2VlcEFsaXZlSW5zdGFuY2UuY2FjaGU7XG4gIHZhciBrZXlzID0ga2VlcEFsaXZlSW5zdGFuY2Uua2V5cztcbiAgdmFyIF92bm9kZSA9IGtlZXBBbGl2ZUluc3RhbmNlLl92bm9kZTtcbiAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgdmFyIGNhY2hlZE5vZGUgPSBjYWNoZVtrZXldO1xuICAgIGlmIChjYWNoZWROb2RlKSB7XG4gICAgICB2YXIgbmFtZSA9IGdldENvbXBvbmVudE5hbWUoY2FjaGVkTm9kZS5jb21wb25lbnRPcHRpb25zKTtcbiAgICAgIGlmIChuYW1lICYmICFmaWx0ZXIobmFtZSkpIHtcbiAgICAgICAgcHJ1bmVDYWNoZUVudHJ5KGNhY2hlLCBrZXksIGtleXMsIF92bm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHBydW5lQ2FjaGVFbnRyeSAoXG4gIGNhY2hlLFxuICBrZXksXG4gIGtleXMsXG4gIGN1cnJlbnRcbikge1xuICB2YXIgY2FjaGVkJCQxID0gY2FjaGVba2V5XTtcbiAgaWYgKGNhY2hlZCQkMSAmJiAoIWN1cnJlbnQgfHwgY2FjaGVkJCQxLnRhZyAhPT0gY3VycmVudC50YWcpKSB7XG4gICAgY2FjaGVkJCQxLmNvbXBvbmVudEluc3RhbmNlLiRkZXN0cm95KCk7XG4gIH1cbiAgY2FjaGVba2V5XSA9IG51bGw7XG4gIHJlbW92ZShrZXlzLCBrZXkpO1xufVxuXG52YXIgcGF0dGVyblR5cGVzID0gW1N0cmluZywgUmVnRXhwLCBBcnJheV07XG5cbnZhciBLZWVwQWxpdmUgPSB7XG4gIG5hbWU6ICdrZWVwLWFsaXZlJyxcbiAgYWJzdHJhY3Q6IHRydWUsXG5cbiAgcHJvcHM6IHtcbiAgICBpbmNsdWRlOiBwYXR0ZXJuVHlwZXMsXG4gICAgZXhjbHVkZTogcGF0dGVyblR5cGVzLFxuICAgIG1heDogW1N0cmluZywgTnVtYmVyXVxuICB9LFxuXG4gIGNyZWF0ZWQ6IGZ1bmN0aW9uIGNyZWF0ZWQgKCkge1xuICAgIHRoaXMuY2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMua2V5cyA9IFtdO1xuICB9LFxuXG4gIGRlc3Ryb3llZDogZnVuY3Rpb24gZGVzdHJveWVkICgpIHtcbiAgICB2YXIgdGhpcyQxID0gdGhpcztcblxuICAgIGZvciAodmFyIGtleSBpbiB0aGlzJDEuY2FjaGUpIHtcbiAgICAgIHBydW5lQ2FjaGVFbnRyeSh0aGlzJDEuY2FjaGUsIGtleSwgdGhpcyQxLmtleXMpO1xuICAgIH1cbiAgfSxcblxuICB3YXRjaDoge1xuICAgIGluY2x1ZGU6IGZ1bmN0aW9uIGluY2x1ZGUgKHZhbCkge1xuICAgICAgcHJ1bmVDYWNoZSh0aGlzLCBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gbWF0Y2hlcyh2YWwsIG5hbWUpOyB9KTtcbiAgICB9LFxuICAgIGV4Y2x1ZGU6IGZ1bmN0aW9uIGV4Y2x1ZGUgKHZhbCkge1xuICAgICAgcHJ1bmVDYWNoZSh0aGlzLCBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gIW1hdGNoZXModmFsLCBuYW1lKTsgfSk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyICgpIHtcbiAgICB2YXIgc2xvdCA9IHRoaXMuJHNsb3RzLmRlZmF1bHQ7XG4gICAgdmFyIHZub2RlID0gZ2V0Rmlyc3RDb21wb25lbnRDaGlsZChzbG90KTtcbiAgICB2YXIgY29tcG9uZW50T3B0aW9ucyA9IHZub2RlICYmIHZub2RlLmNvbXBvbmVudE9wdGlvbnM7XG4gICAgaWYgKGNvbXBvbmVudE9wdGlvbnMpIHtcbiAgICAgIC8vIGNoZWNrIHBhdHRlcm5cbiAgICAgIHZhciBuYW1lID0gZ2V0Q29tcG9uZW50TmFtZShjb21wb25lbnRPcHRpb25zKTtcbiAgICAgIHZhciByZWYgPSB0aGlzO1xuICAgICAgdmFyIGluY2x1ZGUgPSByZWYuaW5jbHVkZTtcbiAgICAgIHZhciBleGNsdWRlID0gcmVmLmV4Y2x1ZGU7XG4gICAgICBpZiAoXG4gICAgICAgIC8vIG5vdCBpbmNsdWRlZFxuICAgICAgICAoaW5jbHVkZSAmJiAoIW5hbWUgfHwgIW1hdGNoZXMoaW5jbHVkZSwgbmFtZSkpKSB8fFxuICAgICAgICAvLyBleGNsdWRlZFxuICAgICAgICAoZXhjbHVkZSAmJiBuYW1lICYmIG1hdGNoZXMoZXhjbHVkZSwgbmFtZSkpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHZub2RlXG4gICAgICB9XG5cbiAgICAgIHZhciByZWYkMSA9IHRoaXM7XG4gICAgICB2YXIgY2FjaGUgPSByZWYkMS5jYWNoZTtcbiAgICAgIHZhciBrZXlzID0gcmVmJDEua2V5cztcbiAgICAgIHZhciBrZXkgPSB2bm9kZS5rZXkgPT0gbnVsbFxuICAgICAgICAvLyBzYW1lIGNvbnN0cnVjdG9yIG1heSBnZXQgcmVnaXN0ZXJlZCBhcyBkaWZmZXJlbnQgbG9jYWwgY29tcG9uZW50c1xuICAgICAgICAvLyBzbyBjaWQgYWxvbmUgaXMgbm90IGVub3VnaCAoIzMyNjkpXG4gICAgICAgID8gY29tcG9uZW50T3B0aW9ucy5DdG9yLmNpZCArIChjb21wb25lbnRPcHRpb25zLnRhZyA/IChcIjo6XCIgKyAoY29tcG9uZW50T3B0aW9ucy50YWcpKSA6ICcnKVxuICAgICAgICA6IHZub2RlLmtleTtcbiAgICAgIGlmIChjYWNoZVtrZXldKSB7XG4gICAgICAgIHZub2RlLmNvbXBvbmVudEluc3RhbmNlID0gY2FjaGVba2V5XS5jb21wb25lbnRJbnN0YW5jZTtcbiAgICAgICAgLy8gbWFrZSBjdXJyZW50IGtleSBmcmVzaGVzdFxuICAgICAgICByZW1vdmUoa2V5cywga2V5KTtcbiAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWNoZVtrZXldID0gdm5vZGU7XG4gICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICAvLyBwcnVuZSBvbGRlc3QgZW50cnlcbiAgICAgICAgaWYgKHRoaXMubWF4ICYmIGtleXMubGVuZ3RoID4gcGFyc2VJbnQodGhpcy5tYXgpKSB7XG4gICAgICAgICAgcHJ1bmVDYWNoZUVudHJ5KGNhY2hlLCBrZXlzWzBdLCBrZXlzLCB0aGlzLl92bm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdm5vZGUuZGF0YS5rZWVwQWxpdmUgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdm5vZGUgfHwgKHNsb3QgJiYgc2xvdFswXSlcbiAgfVxufTtcblxudmFyIGJ1aWx0SW5Db21wb25lbnRzID0ge1xuICBLZWVwQWxpdmU6IEtlZXBBbGl2ZVxufTtcblxuLyogICovXG5cbmZ1bmN0aW9uIGluaXRHbG9iYWxBUEkgKFZ1ZSkge1xuICAvLyBjb25maWdcbiAgdmFyIGNvbmZpZ0RlZiA9IHt9O1xuICBjb25maWdEZWYuZ2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uZmlnOyB9O1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGNvbmZpZ0RlZi5zZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB3YXJuKFxuICAgICAgICAnRG8gbm90IHJlcGxhY2UgdGhlIFZ1ZS5jb25maWcgb2JqZWN0LCBzZXQgaW5kaXZpZHVhbCBmaWVsZHMgaW5zdGVhZC4nXG4gICAgICApO1xuICAgIH07XG4gIH1cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFZ1ZSwgJ2NvbmZpZycsIGNvbmZpZ0RlZik7XG5cbiAgLy8gZXhwb3NlZCB1dGlsIG1ldGhvZHMuXG4gIC8vIE5PVEU6IHRoZXNlIGFyZSBub3QgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBwdWJsaWMgQVBJIC0gYXZvaWQgcmVseWluZyBvblxuICAvLyB0aGVtIHVubGVzcyB5b3UgYXJlIGF3YXJlIG9mIHRoZSByaXNrLlxuICBWdWUudXRpbCA9IHtcbiAgICB3YXJuOiB3YXJuLFxuICAgIGV4dGVuZDogZXh0ZW5kLFxuICAgIG1lcmdlT3B0aW9uczogbWVyZ2VPcHRpb25zLFxuICAgIGRlZmluZVJlYWN0aXZlOiBkZWZpbmVSZWFjdGl2ZVxuICB9O1xuXG4gIFZ1ZS5zZXQgPSBzZXQ7XG4gIFZ1ZS5kZWxldGUgPSBkZWw7XG4gIFZ1ZS5uZXh0VGljayA9IG5leHRUaWNrO1xuXG4gIFZ1ZS5vcHRpb25zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgQVNTRVRfVFlQRVMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIFZ1ZS5vcHRpb25zW3R5cGUgKyAncyddID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgfSk7XG5cbiAgLy8gdGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSBcImJhc2VcIiBjb25zdHJ1Y3RvciB0byBleHRlbmQgYWxsIHBsYWluLW9iamVjdFxuICAvLyBjb21wb25lbnRzIHdpdGggaW4gV2VleCdzIG11bHRpLWluc3RhbmNlIHNjZW5hcmlvcy5cbiAgVnVlLm9wdGlvbnMuX2Jhc2UgPSBWdWU7XG5cbiAgZXh0ZW5kKFZ1ZS5vcHRpb25zLmNvbXBvbmVudHMsIGJ1aWx0SW5Db21wb25lbnRzKTtcblxuICBpbml0VXNlKFZ1ZSk7XG4gIGluaXRNaXhpbiQxKFZ1ZSk7XG4gIGluaXRFeHRlbmQoVnVlKTtcbiAgaW5pdEFzc2V0UmVnaXN0ZXJzKFZ1ZSk7XG59XG5cbmluaXRHbG9iYWxBUEkoVnVlJDIpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoVnVlJDIucHJvdG90eXBlLCAnJGlzU2VydmVyJywge1xuICBnZXQ6IGlzU2VydmVyUmVuZGVyaW5nXG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFZ1ZSQyLnByb3RvdHlwZSwgJyRzc3JDb250ZXh0Jywge1xuICBnZXQ6IGZ1bmN0aW9uIGdldCAoKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gdGhpcy4kdm5vZGUgJiYgdGhpcy4kdm5vZGUuc3NyQ29udGV4dFxuICB9XG59KTtcblxuVnVlJDIudmVyc2lvbiA9ICcyLjUuMTEnO1xuXG52YXIgbGF0ZXN0Tm9kZUlkID0gMTtcblxuZnVuY3Rpb24gVGV4dE5vZGUgKHRleHQpIHtcbiAgdGhpcy5pbnN0YW5jZUlkID0gJyc7XG4gIHRoaXMubm9kZUlkID0gbGF0ZXN0Tm9kZUlkKys7XG4gIHRoaXMucGFyZW50Tm9kZSA9IG51bGw7XG4gIHRoaXMubm9kZVR5cGUgPSAzO1xuICB0aGlzLnRleHQgPSB0ZXh0O1xufVxuXG4vKiBnbG9iYWxzIGRvY3VtZW50ICovXG4vLyBkb2N1bWVudCBpcyBpbmplY3RlZCBieSB3ZWV4IGZhY3Rvcnkgd3JhcHBlclxuXG52YXIgbmFtZXNwYWNlTWFwID0ge307XG5cbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQkMSAodGFnTmFtZSkge1xuICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKVxufVxuXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMgKG5hbWVzcGFjZSwgdGFnTmFtZSkge1xuICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lc3BhY2UgKyAnOicgKyB0YWdOYW1lKVxufVxuXG5mdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSAodGV4dCkge1xuICByZXR1cm4gbmV3IFRleHROb2RlKHRleHQpXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnQgKHRleHQpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQodGV4dClcbn1cblxuZnVuY3Rpb24gaW5zZXJ0QmVmb3JlIChub2RlLCB0YXJnZXQsIGJlZm9yZSkge1xuICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICBub2RlLnNldEF0dHIoJ3ZhbHVlJywgdGFyZ2V0LnRleHQpO1xuICAgICAgdGFyZ2V0LnBhcmVudE5vZGUgPSBub2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdGV4dCA9IGNyZWF0ZUVsZW1lbnQkMSgndGV4dCcpO1xuICAgICAgdGV4dC5zZXRBdHRyKCd2YWx1ZScsIHRhcmdldC50ZXh0KTtcbiAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKHRleHQsIGJlZm9yZSk7XG4gICAgfVxuICAgIHJldHVyblxuICB9XG4gIG5vZGUuaW5zZXJ0QmVmb3JlKHRhcmdldCwgYmVmb3JlKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlQ2hpbGQgKG5vZGUsIGNoaWxkKSB7XG4gIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gMykge1xuICAgIG5vZGUuc2V0QXR0cigndmFsdWUnLCAnJyk7XG4gICAgcmV0dXJuXG4gIH1cbiAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZENoaWxkIChub2RlLCBjaGlsZCkge1xuICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDMpIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAndGV4dCcpIHtcbiAgICAgIG5vZGUuc2V0QXR0cigndmFsdWUnLCBjaGlsZC50ZXh0KTtcbiAgICAgIGNoaWxkLnBhcmVudE5vZGUgPSBub2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdGV4dCA9IGNyZWF0ZUVsZW1lbnQkMSgndGV4dCcpO1xuICAgICAgdGV4dC5zZXRBdHRyKCd2YWx1ZScsIGNoaWxkLnRleHQpO1xuICAgICAgbm9kZS5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cblxuICBub2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcbn1cblxuZnVuY3Rpb24gcGFyZW50Tm9kZSAobm9kZSkge1xuICByZXR1cm4gbm9kZS5wYXJlbnROb2RlXG59XG5cbmZ1bmN0aW9uIG5leHRTaWJsaW5nIChub2RlKSB7XG4gIHJldHVybiBub2RlLm5leHRTaWJsaW5nXG59XG5cbmZ1bmN0aW9uIHRhZ05hbWUgKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUudHlwZVxufVxuXG5mdW5jdGlvbiBzZXRUZXh0Q29udGVudCAobm9kZSwgdGV4dCkge1xuICBub2RlLnBhcmVudE5vZGUuc2V0QXR0cigndmFsdWUnLCB0ZXh0KTtcbn1cblxuZnVuY3Rpb24gc2V0QXR0cmlidXRlIChub2RlLCBrZXksIHZhbCkge1xuICBub2RlLnNldEF0dHIoa2V5LCB2YWwpO1xufVxuXG5cbnZhciBub2RlT3BzID0gT2JqZWN0LmZyZWV6ZSh7XG5cdG5hbWVzcGFjZU1hcDogbmFtZXNwYWNlTWFwLFxuXHRjcmVhdGVFbGVtZW50OiBjcmVhdGVFbGVtZW50JDEsXG5cdGNyZWF0ZUVsZW1lbnROUzogY3JlYXRlRWxlbWVudE5TLFxuXHRjcmVhdGVUZXh0Tm9kZTogY3JlYXRlVGV4dE5vZGUsXG5cdGNyZWF0ZUNvbW1lbnQ6IGNyZWF0ZUNvbW1lbnQsXG5cdGluc2VydEJlZm9yZTogaW5zZXJ0QmVmb3JlLFxuXHRyZW1vdmVDaGlsZDogcmVtb3ZlQ2hpbGQsXG5cdGFwcGVuZENoaWxkOiBhcHBlbmRDaGlsZCxcblx0cGFyZW50Tm9kZTogcGFyZW50Tm9kZSxcblx0bmV4dFNpYmxpbmc6IG5leHRTaWJsaW5nLFxuXHR0YWdOYW1lOiB0YWdOYW1lLFxuXHRzZXRUZXh0Q29udGVudDogc2V0VGV4dENvbnRlbnQsXG5cdHNldEF0dHJpYnV0ZTogc2V0QXR0cmlidXRlXG59KTtcblxuLyogICovXG5cbnZhciByZWYgPSB7XG4gIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlIChfLCB2bm9kZSkge1xuICAgIHJlZ2lzdGVyUmVmKHZub2RlKTtcbiAgfSxcbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUgKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIGlmIChvbGRWbm9kZS5kYXRhLnJlZiAhPT0gdm5vZGUuZGF0YS5yZWYpIHtcbiAgICAgIHJlZ2lzdGVyUmVmKG9sZFZub2RlLCB0cnVlKTtcbiAgICAgIHJlZ2lzdGVyUmVmKHZub2RlKTtcbiAgICB9XG4gIH0sXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uIGRlc3Ryb3kgKHZub2RlKSB7XG4gICAgcmVnaXN0ZXJSZWYodm5vZGUsIHRydWUpO1xuICB9XG59O1xuXG5mdW5jdGlvbiByZWdpc3RlclJlZiAodm5vZGUsIGlzUmVtb3ZhbCkge1xuICB2YXIga2V5ID0gdm5vZGUuZGF0YS5yZWY7XG4gIGlmICgha2V5KSB7IHJldHVybiB9XG5cbiAgdmFyIHZtID0gdm5vZGUuY29udGV4dDtcbiAgdmFyIHJlZiA9IHZub2RlLmNvbXBvbmVudEluc3RhbmNlIHx8IHZub2RlLmVsbTtcbiAgdmFyIHJlZnMgPSB2bS4kcmVmcztcbiAgaWYgKGlzUmVtb3ZhbCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHJlZnNba2V5XSkpIHtcbiAgICAgIHJlbW92ZShyZWZzW2tleV0sIHJlZik7XG4gICAgfSBlbHNlIGlmIChyZWZzW2tleV0gPT09IHJlZikge1xuICAgICAgcmVmc1trZXldID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAodm5vZGUuZGF0YS5yZWZJbkZvcikge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlZnNba2V5XSkpIHtcbiAgICAgICAgcmVmc1trZXldID0gW3JlZl07XG4gICAgICB9IGVsc2UgaWYgKHJlZnNba2V5XS5pbmRleE9mKHJlZikgPCAwKSB7XG4gICAgICAgIC8vICRmbG93LWRpc2FibGUtbGluZVxuICAgICAgICByZWZzW2tleV0ucHVzaChyZWYpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZWZzW2tleV0gPSByZWY7XG4gICAgfVxuICB9XG59XG5cbi8qICAqL1xuXG5cblxudmFyIGlzSFRNTFRhZyA9IG1ha2VNYXAoXG4gICdodG1sLGJvZHksYmFzZSxoZWFkLGxpbmssbWV0YSxzdHlsZSx0aXRsZSwnICtcbiAgJ2FkZHJlc3MsYXJ0aWNsZSxhc2lkZSxmb290ZXIsaGVhZGVyLGgxLGgyLGgzLGg0LGg1LGg2LGhncm91cCxuYXYsc2VjdGlvbiwnICtcbiAgJ2RpdixkZCxkbCxkdCxmaWdjYXB0aW9uLGZpZ3VyZSxwaWN0dXJlLGhyLGltZyxsaSxtYWluLG9sLHAscHJlLHVsLCcgK1xuICAnYSxiLGFiYnIsYmRpLGJkbyxicixjaXRlLGNvZGUsZGF0YSxkZm4sZW0saSxrYmQsbWFyayxxLHJwLHJ0LHJ0YyxydWJ5LCcgK1xuICAncyxzYW1wLHNtYWxsLHNwYW4sc3Ryb25nLHN1YixzdXAsdGltZSx1LHZhcix3YnIsYXJlYSxhdWRpbyxtYXAsdHJhY2ssdmlkZW8sJyArXG4gICdlbWJlZCxvYmplY3QscGFyYW0sc291cmNlLGNhbnZhcyxzY3JpcHQsbm9zY3JpcHQsZGVsLGlucywnICtcbiAgJ2NhcHRpb24sY29sLGNvbGdyb3VwLHRhYmxlLHRoZWFkLHRib2R5LHRkLHRoLHRyLCcgK1xuICAnYnV0dG9uLGRhdGFsaXN0LGZpZWxkc2V0LGZvcm0saW5wdXQsbGFiZWwsbGVnZW5kLG1ldGVyLG9wdGdyb3VwLG9wdGlvbiwnICtcbiAgJ291dHB1dCxwcm9ncmVzcyxzZWxlY3QsdGV4dGFyZWEsJyArXG4gICdkZXRhaWxzLGRpYWxvZyxtZW51LG1lbnVpdGVtLHN1bW1hcnksJyArXG4gICdjb250ZW50LGVsZW1lbnQsc2hhZG93LHRlbXBsYXRlLGJsb2NrcXVvdGUsaWZyYW1lLHRmb290J1xuKTtcblxuLy8gdGhpcyBtYXAgaXMgaW50ZW50aW9uYWxseSBzZWxlY3RpdmUsIG9ubHkgY292ZXJpbmcgU1ZHIGVsZW1lbnRzIHRoYXQgbWF5XG4vLyBjb250YWluIGNoaWxkIGVsZW1lbnRzLlxudmFyIGlzU1ZHID0gbWFrZU1hcChcbiAgJ3N2ZyxhbmltYXRlLGNpcmNsZSxjbGlwcGF0aCxjdXJzb3IsZGVmcyxkZXNjLGVsbGlwc2UsZmlsdGVyLGZvbnQtZmFjZSwnICtcbiAgJ2ZvcmVpZ25PYmplY3QsZyxnbHlwaCxpbWFnZSxsaW5lLG1hcmtlcixtYXNrLG1pc3NpbmctZ2x5cGgscGF0aCxwYXR0ZXJuLCcgK1xuICAncG9seWdvbixwb2x5bGluZSxyZWN0LHN3aXRjaCxzeW1ib2wsdGV4dCx0ZXh0cGF0aCx0c3Bhbix1c2UsdmlldycsXG4gIHRydWVcbik7XG5cblxuXG5cblxuXG5cblxuXG52YXIgaXNUZXh0SW5wdXRUeXBlID0gbWFrZU1hcCgndGV4dCxudW1iZXIscGFzc3dvcmQsc2VhcmNoLGVtYWlsLHRlbCx1cmwnKTtcblxuLyoqXG4gKiBWaXJ0dWFsIERPTSBwYXRjaGluZyBhbGdvcml0aG0gYmFzZWQgb24gU25hYmJkb20gYnlcbiAqIFNpbW9uIEZyaWlzIFZpbmR1bSAoQHBhbGRlcGluZClcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZVxuICogaHR0cHM6Ly9naXRodWIuY29tL3BhbGRlcGluZC9zbmFiYmRvbS9ibG9iL21hc3Rlci9MSUNFTlNFXG4gKlxuICogbW9kaWZpZWQgYnkgRXZhbiBZb3UgKEB5eXg5OTA4MDMpXG4gKlxuICogTm90IHR5cGUtY2hlY2tpbmcgdGhpcyBiZWNhdXNlIHRoaXMgZmlsZSBpcyBwZXJmLWNyaXRpY2FsIGFuZCB0aGUgY29zdFxuICogb2YgbWFraW5nIGZsb3cgdW5kZXJzdGFuZCBpdCBpcyBub3Qgd29ydGggaXQuXG4gKi9cblxudmFyIGVtcHR5Tm9kZSA9IG5ldyBWTm9kZSgnJywge30sIFtdKTtcblxudmFyIGhvb2tzID0gWydjcmVhdGUnLCAnYWN0aXZhdGUnLCAndXBkYXRlJywgJ3JlbW92ZScsICdkZXN0cm95J107XG5cbmZ1bmN0aW9uIHNhbWVWbm9kZSAoYSwgYikge1xuICByZXR1cm4gKFxuICAgIGEua2V5ID09PSBiLmtleSAmJiAoXG4gICAgICAoXG4gICAgICAgIGEudGFnID09PSBiLnRhZyAmJlxuICAgICAgICBhLmlzQ29tbWVudCA9PT0gYi5pc0NvbW1lbnQgJiZcbiAgICAgICAgaXNEZWYoYS5kYXRhKSA9PT0gaXNEZWYoYi5kYXRhKSAmJlxuICAgICAgICBzYW1lSW5wdXRUeXBlKGEsIGIpXG4gICAgICApIHx8IChcbiAgICAgICAgaXNUcnVlKGEuaXNBc3luY1BsYWNlaG9sZGVyKSAmJlxuICAgICAgICBhLmFzeW5jRmFjdG9yeSA9PT0gYi5hc3luY0ZhY3RvcnkgJiZcbiAgICAgICAgaXNVbmRlZihiLmFzeW5jRmFjdG9yeS5lcnJvcilcbiAgICAgIClcbiAgICApXG4gIClcbn1cblxuZnVuY3Rpb24gc2FtZUlucHV0VHlwZSAoYSwgYikge1xuICBpZiAoYS50YWcgIT09ICdpbnB1dCcpIHsgcmV0dXJuIHRydWUgfVxuICB2YXIgaTtcbiAgdmFyIHR5cGVBID0gaXNEZWYoaSA9IGEuZGF0YSkgJiYgaXNEZWYoaSA9IGkuYXR0cnMpICYmIGkudHlwZTtcbiAgdmFyIHR5cGVCID0gaXNEZWYoaSA9IGIuZGF0YSkgJiYgaXNEZWYoaSA9IGkuYXR0cnMpICYmIGkudHlwZTtcbiAgcmV0dXJuIHR5cGVBID09PSB0eXBlQiB8fCBpc1RleHRJbnB1dFR5cGUodHlwZUEpICYmIGlzVGV4dElucHV0VHlwZSh0eXBlQilcbn1cblxuZnVuY3Rpb24gY3JlYXRlS2V5VG9PbGRJZHggKGNoaWxkcmVuLCBiZWdpbklkeCwgZW5kSWR4KSB7XG4gIHZhciBpLCBrZXk7XG4gIHZhciBtYXAgPSB7fTtcbiAgZm9yIChpID0gYmVnaW5JZHg7IGkgPD0gZW5kSWR4OyArK2kpIHtcbiAgICBrZXkgPSBjaGlsZHJlbltpXS5rZXk7XG4gICAgaWYgKGlzRGVmKGtleSkpIHsgbWFwW2tleV0gPSBpOyB9XG4gIH1cbiAgcmV0dXJuIG1hcFxufVxuXG5mdW5jdGlvbiBjcmVhdGVQYXRjaEZ1bmN0aW9uIChiYWNrZW5kKSB7XG4gIHZhciBpLCBqO1xuICB2YXIgY2JzID0ge307XG5cbiAgdmFyIG1vZHVsZXMgPSBiYWNrZW5kLm1vZHVsZXM7XG4gIHZhciBub2RlT3BzID0gYmFja2VuZC5ub2RlT3BzO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xuICAgIGNic1tob29rc1tpXV0gPSBbXTtcbiAgICBmb3IgKGogPSAwOyBqIDwgbW9kdWxlcy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKGlzRGVmKG1vZHVsZXNbal1baG9va3NbaV1dKSkge1xuICAgICAgICBjYnNbaG9va3NbaV1dLnB1c2gobW9kdWxlc1tqXVtob29rc1tpXV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVtcHR5Tm9kZUF0IChlbG0pIHtcbiAgICByZXR1cm4gbmV3IFZOb2RlKG5vZGVPcHMudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCksIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pXG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVSbUNiIChjaGlsZEVsbSwgbGlzdGVuZXJzKSB7XG4gICAgZnVuY3Rpb24gcmVtb3ZlICgpIHtcbiAgICAgIGlmICgtLXJlbW92ZS5saXN0ZW5lcnMgPT09IDApIHtcbiAgICAgICAgcmVtb3ZlTm9kZShjaGlsZEVsbSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlbW92ZS5saXN0ZW5lcnMgPSBsaXN0ZW5lcnM7XG4gICAgcmV0dXJuIHJlbW92ZVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlTm9kZSAoZWwpIHtcbiAgICB2YXIgcGFyZW50ID0gbm9kZU9wcy5wYXJlbnROb2RlKGVsKTtcbiAgICAvLyBlbGVtZW50IG1heSBoYXZlIGFscmVhZHkgYmVlbiByZW1vdmVkIGR1ZSB0byB2LWh0bWwgLyB2LXRleHRcbiAgICBpZiAoaXNEZWYocGFyZW50KSkge1xuICAgICAgbm9kZU9wcy5yZW1vdmVDaGlsZChwYXJlbnQsIGVsKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpc1Vua25vd25FbGVtZW50JCQxICh2bm9kZSwgaW5WUHJlKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICFpblZQcmUgJiZcbiAgICAgICF2bm9kZS5ucyAmJlxuICAgICAgIShcbiAgICAgICAgY29uZmlnLmlnbm9yZWRFbGVtZW50cy5sZW5ndGggJiZcbiAgICAgICAgY29uZmlnLmlnbm9yZWRFbGVtZW50cy5zb21lKGZ1bmN0aW9uIChpZ25vcmUpIHtcbiAgICAgICAgICByZXR1cm4gaXNSZWdFeHAoaWdub3JlKVxuICAgICAgICAgICAgPyBpZ25vcmUudGVzdCh2bm9kZS50YWcpXG4gICAgICAgICAgICA6IGlnbm9yZSA9PT0gdm5vZGUudGFnXG4gICAgICAgIH0pXG4gICAgICApICYmXG4gICAgICBjb25maWcuaXNVbmtub3duRWxlbWVudCh2bm9kZS50YWcpXG4gICAgKVxuICB9XG5cbiAgdmFyIGNyZWF0aW5nRWxtSW5WUHJlID0gMDtcbiAgZnVuY3Rpb24gY3JlYXRlRWxtICh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBwYXJlbnRFbG0sIHJlZkVsbSwgbmVzdGVkKSB7XG4gICAgdm5vZGUuaXNSb290SW5zZXJ0ID0gIW5lc3RlZDsgLy8gZm9yIHRyYW5zaXRpb24gZW50ZXIgY2hlY2tcbiAgICBpZiAoY3JlYXRlQ29tcG9uZW50KHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUsIHBhcmVudEVsbSwgcmVmRWxtKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHZhciBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuICAgIHZhciB0YWcgPSB2bm9kZS50YWc7XG4gICAgaWYgKGlzRGVmKHRhZykpIHtcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIGlmIChkYXRhICYmIGRhdGEucHJlKSB7XG4gICAgICAgICAgY3JlYXRpbmdFbG1JblZQcmUrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNVbmtub3duRWxlbWVudCQkMSh2bm9kZSwgY3JlYXRpbmdFbG1JblZQcmUpKSB7XG4gICAgICAgICAgd2FybihcbiAgICAgICAgICAgICdVbmtub3duIGN1c3RvbSBlbGVtZW50OiA8JyArIHRhZyArICc+IC0gZGlkIHlvdSAnICtcbiAgICAgICAgICAgICdyZWdpc3RlciB0aGUgY29tcG9uZW50IGNvcnJlY3RseT8gRm9yIHJlY3Vyc2l2ZSBjb21wb25lbnRzLCAnICtcbiAgICAgICAgICAgICdtYWtlIHN1cmUgdG8gcHJvdmlkZSB0aGUgXCJuYW1lXCIgb3B0aW9uLicsXG4gICAgICAgICAgICB2bm9kZS5jb250ZXh0XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdm5vZGUuZWxtID0gdm5vZGUubnNcbiAgICAgICAgPyBub2RlT3BzLmNyZWF0ZUVsZW1lbnROUyh2bm9kZS5ucywgdGFnKVxuICAgICAgICA6IG5vZGVPcHMuY3JlYXRlRWxlbWVudCh0YWcsIHZub2RlKTtcbiAgICAgIHNldFNjb3BlKHZub2RlKTtcblxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICB7XG4gICAgICAgIC8vIGluIFdlZXgsIHRoZSBkZWZhdWx0IGluc2VydGlvbiBvcmRlciBpcyBwYXJlbnQtZmlyc3QuXG4gICAgICAgIC8vIExpc3QgaXRlbXMgY2FuIGJlIG9wdGltaXplZCB0byB1c2UgY2hpbGRyZW4tZmlyc3QgaW5zZXJ0aW9uXG4gICAgICAgIC8vIHdpdGggYXBwZW5kPVwidHJlZVwiLlxuICAgICAgICB2YXIgYXBwZW5kQXNUcmVlID0gaXNEZWYoZGF0YSkgJiYgaXNUcnVlKGRhdGEuYXBwZW5kQXNUcmVlKTtcbiAgICAgICAgaWYgKCFhcHBlbmRBc1RyZWUpIHtcbiAgICAgICAgICBpZiAoaXNEZWYoZGF0YSkpIHtcbiAgICAgICAgICAgIGludm9rZUNyZWF0ZUhvb2tzKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpbnNlcnQocGFyZW50RWxtLCB2bm9kZS5lbG0sIHJlZkVsbSk7XG4gICAgICAgIH1cbiAgICAgICAgY3JlYXRlQ2hpbGRyZW4odm5vZGUsIGNoaWxkcmVuLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBpZiAoYXBwZW5kQXNUcmVlKSB7XG4gICAgICAgICAgaWYgKGlzRGVmKGRhdGEpKSB7XG4gICAgICAgICAgICBpbnZva2VDcmVhdGVIb29rcyh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW5zZXJ0KHBhcmVudEVsbSwgdm5vZGUuZWxtLCByZWZFbG0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGRhdGEgJiYgZGF0YS5wcmUpIHtcbiAgICAgICAgY3JlYXRpbmdFbG1JblZQcmUtLTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVHJ1ZSh2bm9kZS5pc0NvbW1lbnQpKSB7XG4gICAgICB2bm9kZS5lbG0gPSBub2RlT3BzLmNyZWF0ZUNvbW1lbnQodm5vZGUudGV4dCk7XG4gICAgICBpbnNlcnQocGFyZW50RWxtLCB2bm9kZS5lbG0sIHJlZkVsbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZub2RlLmVsbSA9IG5vZGVPcHMuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgICBpbnNlcnQocGFyZW50RWxtLCB2bm9kZS5lbG0sIHJlZkVsbSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlQ29tcG9uZW50ICh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBwYXJlbnRFbG0sIHJlZkVsbSkge1xuICAgIHZhciBpID0gdm5vZGUuZGF0YTtcbiAgICBpZiAoaXNEZWYoaSkpIHtcbiAgICAgIHZhciBpc1JlYWN0aXZhdGVkID0gaXNEZWYodm5vZGUuY29tcG9uZW50SW5zdGFuY2UpICYmIGkua2VlcEFsaXZlO1xuICAgICAgaWYgKGlzRGVmKGkgPSBpLmhvb2spICYmIGlzRGVmKGkgPSBpLmluaXQpKSB7XG4gICAgICAgIGkodm5vZGUsIGZhbHNlIC8qIGh5ZHJhdGluZyAqLywgcGFyZW50RWxtLCByZWZFbG0pO1xuICAgICAgfVxuICAgICAgLy8gYWZ0ZXIgY2FsbGluZyB0aGUgaW5pdCBob29rLCBpZiB0aGUgdm5vZGUgaXMgYSBjaGlsZCBjb21wb25lbnRcbiAgICAgIC8vIGl0IHNob3VsZCd2ZSBjcmVhdGVkIGEgY2hpbGQgaW5zdGFuY2UgYW5kIG1vdW50ZWQgaXQuIHRoZSBjaGlsZFxuICAgICAgLy8gY29tcG9uZW50IGFsc28gaGFzIHNldCB0aGUgcGxhY2Vob2xkZXIgdm5vZGUncyBlbG0uXG4gICAgICAvLyBpbiB0aGF0IGNhc2Ugd2UgY2FuIGp1c3QgcmV0dXJuIHRoZSBlbGVtZW50IGFuZCBiZSBkb25lLlxuICAgICAgaWYgKGlzRGVmKHZub2RlLmNvbXBvbmVudEluc3RhbmNlKSkge1xuICAgICAgICBpbml0Q29tcG9uZW50KHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBpZiAoaXNUcnVlKGlzUmVhY3RpdmF0ZWQpKSB7XG4gICAgICAgICAgcmVhY3RpdmF0ZUNvbXBvbmVudCh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBwYXJlbnRFbG0sIHJlZkVsbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbml0Q29tcG9uZW50ICh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgaWYgKGlzRGVmKHZub2RlLmRhdGEucGVuZGluZ0luc2VydCkpIHtcbiAgICAgIGluc2VydGVkVm5vZGVRdWV1ZS5wdXNoLmFwcGx5KGluc2VydGVkVm5vZGVRdWV1ZSwgdm5vZGUuZGF0YS5wZW5kaW5nSW5zZXJ0KTtcbiAgICAgIHZub2RlLmRhdGEucGVuZGluZ0luc2VydCA9IG51bGw7XG4gICAgfVxuICAgIHZub2RlLmVsbSA9IHZub2RlLmNvbXBvbmVudEluc3RhbmNlLiRlbDtcbiAgICBpZiAoaXNQYXRjaGFibGUodm5vZGUpKSB7XG4gICAgICBpbnZva2VDcmVhdGVIb29rcyh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgIHNldFNjb3BlKHZub2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZW1wdHkgY29tcG9uZW50IHJvb3QuXG4gICAgICAvLyBza2lwIGFsbCBlbGVtZW50LXJlbGF0ZWQgbW9kdWxlcyBleGNlcHQgZm9yIHJlZiAoIzM0NTUpXG4gICAgICByZWdpc3RlclJlZih2bm9kZSk7XG4gICAgICAvLyBtYWtlIHN1cmUgdG8gaW52b2tlIHRoZSBpbnNlcnQgaG9va1xuICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlLnB1c2godm5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWN0aXZhdGVDb21wb25lbnQgKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUsIHBhcmVudEVsbSwgcmVmRWxtKSB7XG4gICAgdmFyIGk7XG4gICAgLy8gaGFjayBmb3IgIzQzMzk6IGEgcmVhY3RpdmF0ZWQgY29tcG9uZW50IHdpdGggaW5uZXIgdHJhbnNpdGlvblxuICAgIC8vIGRvZXMgbm90IHRyaWdnZXIgYmVjYXVzZSB0aGUgaW5uZXIgbm9kZSdzIGNyZWF0ZWQgaG9va3MgYXJlIG5vdCBjYWxsZWRcbiAgICAvLyBhZ2Fpbi4gSXQncyBub3QgaWRlYWwgdG8gaW52b2x2ZSBtb2R1bGUtc3BlY2lmaWMgbG9naWMgaW4gaGVyZSBidXRcbiAgICAvLyB0aGVyZSBkb2Vzbid0IHNlZW0gdG8gYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIGl0LlxuICAgIHZhciBpbm5lck5vZGUgPSB2bm9kZTtcbiAgICB3aGlsZSAoaW5uZXJOb2RlLmNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICBpbm5lck5vZGUgPSBpbm5lck5vZGUuY29tcG9uZW50SW5zdGFuY2UuX3Zub2RlO1xuICAgICAgaWYgKGlzRGVmKGkgPSBpbm5lck5vZGUuZGF0YSkgJiYgaXNEZWYoaSA9IGkudHJhbnNpdGlvbikpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5hY3RpdmF0ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGNicy5hY3RpdmF0ZVtpXShlbXB0eU5vZGUsIGlubmVyTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlLnB1c2goaW5uZXJOb2RlKTtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gdW5saWtlIGEgbmV3bHkgY3JlYXRlZCBjb21wb25lbnQsXG4gICAgLy8gYSByZWFjdGl2YXRlZCBrZWVwLWFsaXZlIGNvbXBvbmVudCBkb2Vzbid0IGluc2VydCBpdHNlbGZcbiAgICBpbnNlcnQocGFyZW50RWxtLCB2bm9kZS5lbG0sIHJlZkVsbSk7XG4gIH1cblxuICBmdW5jdGlvbiBpbnNlcnQgKHBhcmVudCwgZWxtLCByZWYkJDEpIHtcbiAgICBpZiAoaXNEZWYocGFyZW50KSkge1xuICAgICAgaWYgKGlzRGVmKHJlZiQkMSkpIHtcbiAgICAgICAgaWYgKHJlZiQkMS5wYXJlbnROb2RlID09PSBwYXJlbnQpIHtcbiAgICAgICAgICBub2RlT3BzLmluc2VydEJlZm9yZShwYXJlbnQsIGVsbSwgcmVmJCQxKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZU9wcy5hcHBlbmRDaGlsZChwYXJlbnQsIGVsbSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlQ2hpbGRyZW4gKHZub2RlLCBjaGlsZHJlbiwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICBjaGVja0R1cGxpY2F0ZUtleXMoY2hpbGRyZW4pO1xuICAgICAgfVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICBjcmVhdGVFbG0oY2hpbGRyZW5baV0sIGluc2VydGVkVm5vZGVRdWV1ZSwgdm5vZGUuZWxtLCBudWxsLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzUHJpbWl0aXZlKHZub2RlLnRleHQpKSB7XG4gICAgICBub2RlT3BzLmFwcGVuZENoaWxkKHZub2RlLmVsbSwgbm9kZU9wcy5jcmVhdGVUZXh0Tm9kZSh2bm9kZS50ZXh0KSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNQYXRjaGFibGUgKHZub2RlKSB7XG4gICAgd2hpbGUgKHZub2RlLmNvbXBvbmVudEluc3RhbmNlKSB7XG4gICAgICB2bm9kZSA9IHZub2RlLmNvbXBvbmVudEluc3RhbmNlLl92bm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzRGVmKHZub2RlLnRhZylcbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZUNyZWF0ZUhvb2tzICh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgZm9yICh2YXIgaSQxID0gMDsgaSQxIDwgY2JzLmNyZWF0ZS5sZW5ndGg7ICsraSQxKSB7XG4gICAgICBjYnMuY3JlYXRlW2kkMV0oZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgfVxuICAgIGkgPSB2bm9kZS5kYXRhLmhvb2s7IC8vIFJldXNlIHZhcmlhYmxlXG4gICAgaWYgKGlzRGVmKGkpKSB7XG4gICAgICBpZiAoaXNEZWYoaS5jcmVhdGUpKSB7IGkuY3JlYXRlKGVtcHR5Tm9kZSwgdm5vZGUpOyB9XG4gICAgICBpZiAoaXNEZWYoaS5pbnNlcnQpKSB7IGluc2VydGVkVm5vZGVRdWV1ZS5wdXNoKHZub2RlKTsgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHNldCBzY29wZSBpZCBhdHRyaWJ1dGUgZm9yIHNjb3BlZCBDU1MuXG4gIC8vIHRoaXMgaXMgaW1wbGVtZW50ZWQgYXMgYSBzcGVjaWFsIGNhc2UgdG8gYXZvaWQgdGhlIG92ZXJoZWFkXG4gIC8vIG9mIGdvaW5nIHRocm91Z2ggdGhlIG5vcm1hbCBhdHRyaWJ1dGUgcGF0Y2hpbmcgcHJvY2Vzcy5cbiAgZnVuY3Rpb24gc2V0U2NvcGUgKHZub2RlKSB7XG4gICAgdmFyIGk7XG4gICAgaWYgKGlzRGVmKGkgPSB2bm9kZS5mblNjb3BlSWQpKSB7XG4gICAgICBub2RlT3BzLnNldEF0dHJpYnV0ZSh2bm9kZS5lbG0sIGksICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFuY2VzdG9yID0gdm5vZGU7XG4gICAgICB3aGlsZSAoYW5jZXN0b3IpIHtcbiAgICAgICAgaWYgKGlzRGVmKGkgPSBhbmNlc3Rvci5jb250ZXh0KSAmJiBpc0RlZihpID0gaS4kb3B0aW9ucy5fc2NvcGVJZCkpIHtcbiAgICAgICAgICBub2RlT3BzLnNldEF0dHJpYnV0ZSh2bm9kZS5lbG0sIGksICcnKTtcbiAgICAgICAgfVxuICAgICAgICBhbmNlc3RvciA9IGFuY2VzdG9yLnBhcmVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZm9yIHNsb3QgY29udGVudCB0aGV5IHNob3VsZCBhbHNvIGdldCB0aGUgc2NvcGVJZCBmcm9tIHRoZSBob3N0IGluc3RhbmNlLlxuICAgIGlmIChpc0RlZihpID0gYWN0aXZlSW5zdGFuY2UpICYmXG4gICAgICBpICE9PSB2bm9kZS5jb250ZXh0ICYmXG4gICAgICBpICE9PSB2bm9kZS5mbkNvbnRleHQgJiZcbiAgICAgIGlzRGVmKGkgPSBpLiRvcHRpb25zLl9zY29wZUlkKVxuICAgICkge1xuICAgICAgbm9kZU9wcy5zZXRBdHRyaWJ1dGUodm5vZGUuZWxtLCBpLCAnJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkVm5vZGVzIChwYXJlbnRFbG0sIHJlZkVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICBjcmVhdGVFbG0odm5vZGVzW3N0YXJ0SWR4XSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBwYXJlbnRFbG0sIHJlZkVsbSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW52b2tlRGVzdHJveUhvb2sgKHZub2RlKSB7XG4gICAgdmFyIGksIGo7XG4gICAgdmFyIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIGlmIChpc0RlZihkYXRhKSkge1xuICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKSB7IGkodm5vZGUpOyB9XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmRlc3Ryb3kubGVuZ3RoOyArK2kpIHsgY2JzLmRlc3Ryb3lbaV0odm5vZGUpOyB9XG4gICAgfVxuICAgIGlmIChpc0RlZihpID0gdm5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICBmb3IgKGogPSAwOyBqIDwgdm5vZGUuY2hpbGRyZW4ubGVuZ3RoOyArK2opIHtcbiAgICAgICAgaW52b2tlRGVzdHJveUhvb2sodm5vZGUuY2hpbGRyZW5bal0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZVZub2RlcyAocGFyZW50RWxtLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgpIHtcbiAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICB2YXIgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xuICAgICAgaWYgKGlzRGVmKGNoKSkge1xuICAgICAgICBpZiAoaXNEZWYoY2gudGFnKSkge1xuICAgICAgICAgIHJlbW92ZUFuZEludm9rZVJlbW92ZUhvb2soY2gpO1xuICAgICAgICAgIGludm9rZURlc3Ryb3lIb29rKGNoKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gVGV4dCBub2RlXG4gICAgICAgICAgcmVtb3ZlTm9kZShjaC5lbG0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlQW5kSW52b2tlUmVtb3ZlSG9vayAodm5vZGUsIHJtKSB7XG4gICAgaWYgKGlzRGVmKHJtKSB8fCBpc0RlZih2bm9kZS5kYXRhKSkge1xuICAgICAgdmFyIGk7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gY2JzLnJlbW92ZS5sZW5ndGggKyAxO1xuICAgICAgaWYgKGlzRGVmKHJtKSkge1xuICAgICAgICAvLyB3ZSBoYXZlIGEgcmVjdXJzaXZlbHkgcGFzc2VkIGRvd24gcm0gY2FsbGJhY2tcbiAgICAgICAgLy8gaW5jcmVhc2UgdGhlIGxpc3RlbmVycyBjb3VudFxuICAgICAgICBybS5saXN0ZW5lcnMgKz0gbGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZGlyZWN0bHkgcmVtb3ZpbmdcbiAgICAgICAgcm0gPSBjcmVhdGVSbUNiKHZub2RlLmVsbSwgbGlzdGVuZXJzKTtcbiAgICAgIH1cbiAgICAgIC8vIHJlY3Vyc2l2ZWx5IGludm9rZSBob29rcyBvbiBjaGlsZCBjb21wb25lbnQgcm9vdCBub2RlXG4gICAgICBpZiAoaXNEZWYoaSA9IHZub2RlLmNvbXBvbmVudEluc3RhbmNlKSAmJiBpc0RlZihpID0gaS5fdm5vZGUpICYmIGlzRGVmKGkuZGF0YSkpIHtcbiAgICAgICAgcmVtb3ZlQW5kSW52b2tlUmVtb3ZlSG9vayhpLCBybSk7XG4gICAgICB9XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnJlbW92ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBjYnMucmVtb3ZlW2ldKHZub2RlLCBybSk7XG4gICAgICB9XG4gICAgICBpZiAoaXNEZWYoaSA9IHZub2RlLmRhdGEuaG9vaykgJiYgaXNEZWYoaSA9IGkucmVtb3ZlKSkge1xuICAgICAgICBpKHZub2RlLCBybSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBybSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVOb2RlKHZub2RlLmVsbSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQ2hpbGRyZW4gKHBhcmVudEVsbSwgb2xkQ2gsIG5ld0NoLCBpbnNlcnRlZFZub2RlUXVldWUsIHJlbW92ZU9ubHkpIHtcbiAgICB2YXIgb2xkU3RhcnRJZHggPSAwO1xuICAgIHZhciBuZXdTdGFydElkeCA9IDA7XG4gICAgdmFyIG9sZEVuZElkeCA9IG9sZENoLmxlbmd0aCAtIDE7XG4gICAgdmFyIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFswXTtcbiAgICB2YXIgb2xkRW5kVm5vZGUgPSBvbGRDaFtvbGRFbmRJZHhdO1xuICAgIHZhciBuZXdFbmRJZHggPSBuZXdDaC5sZW5ndGggLSAxO1xuICAgIHZhciBuZXdTdGFydFZub2RlID0gbmV3Q2hbMF07XG4gICAgdmFyIG5ld0VuZFZub2RlID0gbmV3Q2hbbmV3RW5kSWR4XTtcbiAgICB2YXIgb2xkS2V5VG9JZHgsIGlkeEluT2xkLCB2bm9kZVRvTW92ZSwgcmVmRWxtO1xuXG4gICAgLy8gcmVtb3ZlT25seSBpcyBhIHNwZWNpYWwgZmxhZyB1c2VkIG9ubHkgYnkgPHRyYW5zaXRpb24tZ3JvdXA+XG4gICAgLy8gdG8gZW5zdXJlIHJlbW92ZWQgZWxlbWVudHMgc3RheSBpbiBjb3JyZWN0IHJlbGF0aXZlIHBvc2l0aW9uc1xuICAgIC8vIGR1cmluZyBsZWF2aW5nIHRyYW5zaXRpb25zXG4gICAgdmFyIGNhbk1vdmUgPSAhcmVtb3ZlT25seTtcblxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBjaGVja0R1cGxpY2F0ZUtleXMobmV3Q2gpO1xuICAgIH1cblxuICAgIHdoaWxlIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggJiYgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICBpZiAoaXNVbmRlZihvbGRTdGFydFZub2RlKSkge1xuICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07IC8vIFZub2RlIGhhcyBiZWVuIG1vdmVkIGxlZnRcbiAgICAgIH0gZWxzZSBpZiAoaXNVbmRlZihvbGRFbmRWbm9kZSkpIHtcbiAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XG4gICAgICB9IGVsc2UgaWYgKHNhbWVWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICBwYXRjaFZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgfSBlbHNlIGlmIChzYW1lVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XG4gICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgfSBlbHNlIGlmIChzYW1lVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUpKSB7IC8vIFZub2RlIG1vdmVkIHJpZ2h0XG4gICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIGNhbk1vdmUgJiYgbm9kZU9wcy5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRTdGFydFZub2RlLmVsbSwgbm9kZU9wcy5uZXh0U2libGluZyhvbGRFbmRWbm9kZS5lbG0pKTtcbiAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkgeyAvLyBWbm9kZSBtb3ZlZCBsZWZ0XG4gICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIGNhbk1vdmUgJiYgbm9kZU9wcy5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRFbmRWbm9kZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XG4gICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc1VuZGVmKG9sZEtleVRvSWR4KSkgeyBvbGRLZXlUb0lkeCA9IGNyZWF0ZUtleVRvT2xkSWR4KG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTsgfVxuICAgICAgICBpZHhJbk9sZCA9IGlzRGVmKG5ld1N0YXJ0Vm5vZGUua2V5KVxuICAgICAgICAgID8gb2xkS2V5VG9JZHhbbmV3U3RhcnRWbm9kZS5rZXldXG4gICAgICAgICAgOiBmaW5kSWR4SW5PbGQobmV3U3RhcnRWbm9kZSwgb2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHsgLy8gTmV3IGVsZW1lbnRcbiAgICAgICAgICBjcmVhdGVFbG0obmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBwYXJlbnRFbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2bm9kZVRvTW92ZSA9IG9sZENoW2lkeEluT2xkXTtcbiAgICAgICAgICBpZiAoc2FtZVZub2RlKHZub2RlVG9Nb3ZlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgcGF0Y2hWbm9kZSh2bm9kZVRvTW92ZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIG9sZENoW2lkeEluT2xkXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGNhbk1vdmUgJiYgbm9kZU9wcy5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCB2bm9kZVRvTW92ZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc2FtZSBrZXkgYnV0IGRpZmZlcmVudCBlbGVtZW50LiB0cmVhdCBhcyBuZXcgZWxlbWVudFxuICAgICAgICAgICAgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgcGFyZW50RWxtLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9sZFN0YXJ0SWR4ID4gb2xkRW5kSWR4KSB7XG4gICAgICByZWZFbG0gPSBpc1VuZGVmKG5ld0NoW25ld0VuZElkeCArIDFdKSA/IG51bGwgOiBuZXdDaFtuZXdFbmRJZHggKyAxXS5lbG07XG4gICAgICBhZGRWbm9kZXMocGFyZW50RWxtLCByZWZFbG0sIG5ld0NoLCBuZXdTdGFydElkeCwgbmV3RW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgIH0gZWxzZSBpZiAobmV3U3RhcnRJZHggPiBuZXdFbmRJZHgpIHtcbiAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjaGVja0R1cGxpY2F0ZUtleXMgKGNoaWxkcmVuKSB7XG4gICAgdmFyIHNlZW5LZXlzID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZub2RlID0gY2hpbGRyZW5baV07XG4gICAgICB2YXIga2V5ID0gdm5vZGUua2V5O1xuICAgICAgaWYgKGlzRGVmKGtleSkpIHtcbiAgICAgICAgaWYgKHNlZW5LZXlzW2tleV0pIHtcbiAgICAgICAgICB3YXJuKFxuICAgICAgICAgICAgKFwiRHVwbGljYXRlIGtleXMgZGV0ZWN0ZWQ6ICdcIiArIGtleSArIFwiJy4gVGhpcyBtYXkgY2F1c2UgYW4gdXBkYXRlIGVycm9yLlwiKSxcbiAgICAgICAgICAgIHZub2RlLmNvbnRleHRcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlZW5LZXlzW2tleV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmluZElkeEluT2xkIChub2RlLCBvbGRDaCwgc3RhcnQsIGVuZCkge1xuICAgIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IG9sZENoW2ldO1xuICAgICAgaWYgKGlzRGVmKGMpICYmIHNhbWVWbm9kZShub2RlLCBjKSkgeyByZXR1cm4gaSB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGF0Y2hWbm9kZSAob2xkVm5vZGUsIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUsIHJlbW92ZU9ubHkpIHtcbiAgICBpZiAob2xkVm5vZGUgPT09IHZub2RlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgZWxtID0gdm5vZGUuZWxtID0gb2xkVm5vZGUuZWxtO1xuXG4gICAgaWYgKGlzVHJ1ZShvbGRWbm9kZS5pc0FzeW5jUGxhY2Vob2xkZXIpKSB7XG4gICAgICBpZiAoaXNEZWYodm5vZGUuYXN5bmNGYWN0b3J5LnJlc29sdmVkKSkge1xuICAgICAgICBoeWRyYXRlKG9sZFZub2RlLmVsbSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2bm9kZS5pc0FzeW5jUGxhY2Vob2xkZXIgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gcmV1c2UgZWxlbWVudCBmb3Igc3RhdGljIHRyZWVzLlxuICAgIC8vIG5vdGUgd2Ugb25seSBkbyB0aGlzIGlmIHRoZSB2bm9kZSBpcyBjbG9uZWQgLVxuICAgIC8vIGlmIHRoZSBuZXcgbm9kZSBpcyBub3QgY2xvbmVkIGl0IG1lYW5zIHRoZSByZW5kZXIgZnVuY3Rpb25zIGhhdmUgYmVlblxuICAgIC8vIHJlc2V0IGJ5IHRoZSBob3QtcmVsb2FkLWFwaSBhbmQgd2UgbmVlZCB0byBkbyBhIHByb3BlciByZS1yZW5kZXIuXG4gICAgaWYgKGlzVHJ1ZSh2bm9kZS5pc1N0YXRpYykgJiZcbiAgICAgIGlzVHJ1ZShvbGRWbm9kZS5pc1N0YXRpYykgJiZcbiAgICAgIHZub2RlLmtleSA9PT0gb2xkVm5vZGUua2V5ICYmXG4gICAgICAoaXNUcnVlKHZub2RlLmlzQ2xvbmVkKSB8fCBpc1RydWUodm5vZGUuaXNPbmNlKSlcbiAgICApIHtcbiAgICAgIHZub2RlLmNvbXBvbmVudEluc3RhbmNlID0gb2xkVm5vZGUuY29tcG9uZW50SW5zdGFuY2U7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgaTtcbiAgICB2YXIgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgaWYgKGlzRGVmKGRhdGEpICYmIGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLnByZXBhdGNoKSkge1xuICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xuICAgIH1cblxuICAgIHZhciBvbGRDaCA9IG9sZFZub2RlLmNoaWxkcmVuO1xuICAgIHZhciBjaCA9IHZub2RlLmNoaWxkcmVuO1xuICAgIGlmIChpc0RlZihkYXRhKSAmJiBpc1BhdGNoYWJsZSh2bm9kZSkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMudXBkYXRlLmxlbmd0aDsgKytpKSB7IGNicy51cGRhdGVbaV0ob2xkVm5vZGUsIHZub2RlKTsgfVxuICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLnVwZGF0ZSkpIHsgaShvbGRWbm9kZSwgdm5vZGUpOyB9XG4gICAgfVxuICAgIGlmIChpc1VuZGVmKHZub2RlLnRleHQpKSB7XG4gICAgICBpZiAoaXNEZWYob2xkQ2gpICYmIGlzRGVmKGNoKSkge1xuICAgICAgICBpZiAob2xkQ2ggIT09IGNoKSB7IHVwZGF0ZUNoaWxkcmVuKGVsbSwgb2xkQ2gsIGNoLCBpbnNlcnRlZFZub2RlUXVldWUsIHJlbW92ZU9ubHkpOyB9XG4gICAgICB9IGVsc2UgaWYgKGlzRGVmKGNoKSkge1xuICAgICAgICBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpIHsgbm9kZU9wcy5zZXRUZXh0Q29udGVudChlbG0sICcnKTsgfVxuICAgICAgICBhZGRWbm9kZXMoZWxtLCBudWxsLCBjaCwgMCwgY2gubGVuZ3RoIC0gMSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNEZWYob2xkQ2gpKSB7XG4gICAgICAgIHJlbW92ZVZub2RlcyhlbG0sIG9sZENoLCAwLCBvbGRDaC5sZW5ndGggLSAxKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpIHtcbiAgICAgICAgbm9kZU9wcy5zZXRUZXh0Q29udGVudChlbG0sICcnKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9sZFZub2RlLnRleHQgIT09IHZub2RlLnRleHQpIHtcbiAgICAgIG5vZGVPcHMuc2V0VGV4dENvbnRlbnQoZWxtLCB2bm9kZS50ZXh0KTtcbiAgICB9XG4gICAgaWYgKGlzRGVmKGRhdGEpKSB7XG4gICAgICBpZiAoaXNEZWYoaSA9IGRhdGEuaG9vaykgJiYgaXNEZWYoaSA9IGkucG9zdHBhdGNoKSkgeyBpKG9sZFZub2RlLCB2bm9kZSk7IH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbnZva2VJbnNlcnRIb29rICh2bm9kZSwgcXVldWUsIGluaXRpYWwpIHtcbiAgICAvLyBkZWxheSBpbnNlcnQgaG9va3MgZm9yIGNvbXBvbmVudCByb290IG5vZGVzLCBpbnZva2UgdGhlbSBhZnRlciB0aGVcbiAgICAvLyBlbGVtZW50IGlzIHJlYWxseSBpbnNlcnRlZFxuICAgIGlmIChpc1RydWUoaW5pdGlhbCkgJiYgaXNEZWYodm5vZGUucGFyZW50KSkge1xuICAgICAgdm5vZGUucGFyZW50LmRhdGEucGVuZGluZ0luc2VydCA9IHF1ZXVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHF1ZXVlW2ldLmRhdGEuaG9vay5pbnNlcnQocXVldWVbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHZhciBoeWRyYXRpb25CYWlsZWQgPSBmYWxzZTtcbiAgLy8gbGlzdCBvZiBtb2R1bGVzIHRoYXQgY2FuIHNraXAgY3JlYXRlIGhvb2sgZHVyaW5nIGh5ZHJhdGlvbiBiZWNhdXNlIHRoZXlcbiAgLy8gYXJlIGFscmVhZHkgcmVuZGVyZWQgb24gdGhlIGNsaWVudCBvciBoYXMgbm8gbmVlZCBmb3IgaW5pdGlhbGl6YXRpb25cbiAgLy8gTm90ZTogc3R5bGUgaXMgZXhjbHVkZWQgYmVjYXVzZSBpdCByZWxpZXMgb24gaW5pdGlhbCBjbG9uZSBmb3IgZnV0dXJlXG4gIC8vIGRlZXAgdXBkYXRlcyAoIzcwNjMpLlxuICB2YXIgaXNSZW5kZXJlZE1vZHVsZSA9IG1ha2VNYXAoJ2F0dHJzLGNsYXNzLHN0YXRpY0NsYXNzLHN0YXRpY1N0eWxlLGtleScpO1xuXG4gIC8vIE5vdGU6IHRoaXMgaXMgYSBicm93c2VyLW9ubHkgZnVuY3Rpb24gc28gd2UgY2FuIGFzc3VtZSBlbG1zIGFyZSBET00gbm9kZXMuXG4gIGZ1bmN0aW9uIGh5ZHJhdGUgKGVsbSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgaW5WUHJlKSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIHRhZyA9IHZub2RlLnRhZztcbiAgICB2YXIgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgaW5WUHJlID0gaW5WUHJlIHx8IChkYXRhICYmIGRhdGEucHJlKTtcbiAgICB2bm9kZS5lbG0gPSBlbG07XG5cbiAgICBpZiAoaXNUcnVlKHZub2RlLmlzQ29tbWVudCkgJiYgaXNEZWYodm5vZGUuYXN5bmNGYWN0b3J5KSkge1xuICAgICAgdm5vZGUuaXNBc3luY1BsYWNlaG9sZGVyID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIC8vIGFzc2VydCBub2RlIG1hdGNoXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGlmICghYXNzZXJ0Tm9kZU1hdGNoKGVsbSwgdm5vZGUsIGluVlByZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0RlZihkYXRhKSkge1xuICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmluaXQpKSB7IGkodm5vZGUsIHRydWUgLyogaHlkcmF0aW5nICovKTsgfVxuICAgICAgaWYgKGlzRGVmKGkgPSB2bm9kZS5jb21wb25lbnRJbnN0YW5jZSkpIHtcbiAgICAgICAgLy8gY2hpbGQgY29tcG9uZW50LiBpdCBzaG91bGQgaGF2ZSBoeWRyYXRlZCBpdHMgb3duIHRyZWUuXG4gICAgICAgIGluaXRDb21wb25lbnQodm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0RlZih0YWcpKSB7XG4gICAgICBpZiAoaXNEZWYoY2hpbGRyZW4pKSB7XG4gICAgICAgIC8vIGVtcHR5IGVsZW1lbnQsIGFsbG93IGNsaWVudCB0byBwaWNrIHVwIGFuZCBwb3B1bGF0ZSBjaGlsZHJlblxuICAgICAgICBpZiAoIWVsbS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICBjcmVhdGVDaGlsZHJlbih2bm9kZSwgY2hpbGRyZW4sIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdi1odG1sIGFuZCBkb21Qcm9wczogaW5uZXJIVE1MXG4gICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhKSAmJiBpc0RlZihpID0gaS5kb21Qcm9wcykgJiYgaXNEZWYoaSA9IGkuaW5uZXJIVE1MKSkge1xuICAgICAgICAgICAgaWYgKGkgIT09IGVsbS5pbm5lckhUTUwpIHtcbiAgICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgIWh5ZHJhdGlvbkJhaWxlZFxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBoeWRyYXRpb25CYWlsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignUGFyZW50OiAnLCBlbG0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybignc2VydmVyIGlubmVySFRNTDogJywgaSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdjbGllbnQgaW5uZXJIVE1MOiAnLCBlbG0uaW5uZXJIVE1MKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gaXRlcmF0ZSBhbmQgY29tcGFyZSBjaGlsZHJlbiBsaXN0c1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuTWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgdmFyIGNoaWxkTm9kZSA9IGVsbS5maXJzdENoaWxkO1xuICAgICAgICAgICAgZm9yICh2YXIgaSQxID0gMDsgaSQxIDwgY2hpbGRyZW4ubGVuZ3RoOyBpJDErKykge1xuICAgICAgICAgICAgICBpZiAoIWNoaWxkTm9kZSB8fCAhaHlkcmF0ZShjaGlsZE5vZGUsIGNoaWxkcmVuW2kkMV0sIGluc2VydGVkVm5vZGVRdWV1ZSwgaW5WUHJlKSkge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuTWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNoaWxkTm9kZSA9IGNoaWxkTm9kZS5uZXh0U2libGluZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIGNoaWxkTm9kZSBpcyBub3QgbnVsbCwgaXQgbWVhbnMgdGhlIGFjdHVhbCBjaGlsZE5vZGVzIGxpc3QgaXNcbiAgICAgICAgICAgIC8vIGxvbmdlciB0aGFuIHRoZSB2aXJ0dWFsIGNoaWxkcmVuIGxpc3QuXG4gICAgICAgICAgICBpZiAoIWNoaWxkcmVuTWF0Y2ggfHwgY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICFoeWRyYXRpb25CYWlsZWRcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgaHlkcmF0aW9uQmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1BhcmVudDogJywgZWxtKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ01pc21hdGNoaW5nIGNoaWxkTm9kZXMgdnMuIFZOb2RlczogJywgZWxtLmNoaWxkTm9kZXMsIGNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpc0RlZihkYXRhKSkge1xuICAgICAgICB2YXIgZnVsbEludm9rZSA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgIGlmICghaXNSZW5kZXJlZE1vZHVsZShrZXkpKSB7XG4gICAgICAgICAgICBmdWxsSW52b2tlID0gdHJ1ZTtcbiAgICAgICAgICAgIGludm9rZUNyZWF0ZUhvb2tzKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmdWxsSW52b2tlICYmIGRhdGFbJ2NsYXNzJ10pIHtcbiAgICAgICAgICAvLyBlbnN1cmUgY29sbGVjdGluZyBkZXBzIGZvciBkZWVwIGNsYXNzIGJpbmRpbmdzIGZvciBmdXR1cmUgdXBkYXRlc1xuICAgICAgICAgIHRyYXZlcnNlKGRhdGFbJ2NsYXNzJ10pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbG0uZGF0YSAhPT0gdm5vZGUudGV4dCkge1xuICAgICAgZWxtLmRhdGEgPSB2bm9kZS50ZXh0O1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZnVuY3Rpb24gYXNzZXJ0Tm9kZU1hdGNoIChub2RlLCB2bm9kZSwgaW5WUHJlKSB7XG4gICAgaWYgKGlzRGVmKHZub2RlLnRhZykpIHtcbiAgICAgIHJldHVybiB2bm9kZS50YWcuaW5kZXhPZigndnVlLWNvbXBvbmVudCcpID09PSAwIHx8IChcbiAgICAgICAgIWlzVW5rbm93bkVsZW1lbnQkJDEodm5vZGUsIGluVlByZSkgJiZcbiAgICAgICAgdm5vZGUudGFnLnRvTG93ZXJDYXNlKCkgPT09IChub2RlLnRhZ05hbWUgJiYgbm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkpXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAodm5vZGUuaXNDb21tZW50ID8gOCA6IDMpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHBhdGNoIChvbGRWbm9kZSwgdm5vZGUsIGh5ZHJhdGluZywgcmVtb3ZlT25seSwgcGFyZW50RWxtLCByZWZFbG0pIHtcbiAgICBpZiAoaXNVbmRlZih2bm9kZSkpIHtcbiAgICAgIGlmIChpc0RlZihvbGRWbm9kZSkpIHsgaW52b2tlRGVzdHJveUhvb2sob2xkVm5vZGUpOyB9XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgaXNJbml0aWFsUGF0Y2ggPSBmYWxzZTtcbiAgICB2YXIgaW5zZXJ0ZWRWbm9kZVF1ZXVlID0gW107XG5cbiAgICBpZiAoaXNVbmRlZihvbGRWbm9kZSkpIHtcbiAgICAgIC8vIGVtcHR5IG1vdW50IChsaWtlbHkgYXMgY29tcG9uZW50KSwgY3JlYXRlIG5ldyByb290IGVsZW1lbnRcbiAgICAgIGlzSW5pdGlhbFBhdGNoID0gdHJ1ZTtcbiAgICAgIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBwYXJlbnRFbG0sIHJlZkVsbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBpc1JlYWxFbGVtZW50ID0gaXNEZWYob2xkVm5vZGUubm9kZVR5cGUpO1xuICAgICAgaWYgKCFpc1JlYWxFbGVtZW50ICYmIHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XG4gICAgICAgIC8vIHBhdGNoIGV4aXN0aW5nIHJvb3Qgbm9kZVxuICAgICAgICBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCByZW1vdmVPbmx5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc1JlYWxFbGVtZW50KSB7XG4gICAgICAgICAgLy8gbW91bnRpbmcgdG8gYSByZWFsIGVsZW1lbnRcbiAgICAgICAgICAvLyBjaGVjayBpZiB0aGlzIGlzIHNlcnZlci1yZW5kZXJlZCBjb250ZW50IGFuZCBpZiB3ZSBjYW4gcGVyZm9ybVxuICAgICAgICAgIC8vIGEgc3VjY2Vzc2Z1bCBoeWRyYXRpb24uXG4gICAgICAgICAgaWYgKG9sZFZub2RlLm5vZGVUeXBlID09PSAxICYmIG9sZFZub2RlLmhhc0F0dHJpYnV0ZShTU1JfQVRUUikpIHtcbiAgICAgICAgICAgIG9sZFZub2RlLnJlbW92ZUF0dHJpYnV0ZShTU1JfQVRUUik7XG4gICAgICAgICAgICBoeWRyYXRpbmcgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXNUcnVlKGh5ZHJhdGluZykpIHtcbiAgICAgICAgICAgIGlmIChoeWRyYXRlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSkge1xuICAgICAgICAgICAgICBpbnZva2VJbnNlcnRIb29rKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUsIHRydWUpO1xuICAgICAgICAgICAgICByZXR1cm4gb2xkVm5vZGVcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgICB3YXJuKFxuICAgICAgICAgICAgICAgICdUaGUgY2xpZW50LXNpZGUgcmVuZGVyZWQgdmlydHVhbCBET00gdHJlZSBpcyBub3QgbWF0Y2hpbmcgJyArXG4gICAgICAgICAgICAgICAgJ3NlcnZlci1yZW5kZXJlZCBjb250ZW50LiBUaGlzIGlzIGxpa2VseSBjYXVzZWQgYnkgaW5jb3JyZWN0ICcgK1xuICAgICAgICAgICAgICAgICdIVE1MIG1hcmt1cCwgZm9yIGV4YW1wbGUgbmVzdGluZyBibG9jay1sZXZlbCBlbGVtZW50cyBpbnNpZGUgJyArXG4gICAgICAgICAgICAgICAgJzxwPiwgb3IgbWlzc2luZyA8dGJvZHk+LiBCYWlsaW5nIGh5ZHJhdGlvbiBhbmQgcGVyZm9ybWluZyAnICtcbiAgICAgICAgICAgICAgICAnZnVsbCBjbGllbnQtc2lkZSByZW5kZXIuJ1xuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBlaXRoZXIgbm90IHNlcnZlci1yZW5kZXJlZCwgb3IgaHlkcmF0aW9uIGZhaWxlZC5cbiAgICAgICAgICAvLyBjcmVhdGUgYW4gZW1wdHkgbm9kZSBhbmQgcmVwbGFjZSBpdFxuICAgICAgICAgIG9sZFZub2RlID0gZW1wdHlOb2RlQXQob2xkVm5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVwbGFjaW5nIGV4aXN0aW5nIGVsZW1lbnRcbiAgICAgICAgdmFyIG9sZEVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgdmFyIHBhcmVudEVsbSQxID0gbm9kZU9wcy5wYXJlbnROb2RlKG9sZEVsbSk7XG5cbiAgICAgICAgLy8gY3JlYXRlIG5ldyBub2RlXG4gICAgICAgIGNyZWF0ZUVsbShcbiAgICAgICAgICB2bm9kZSxcbiAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWUsXG4gICAgICAgICAgLy8gZXh0cmVtZWx5IHJhcmUgZWRnZSBjYXNlOiBkbyBub3QgaW5zZXJ0IGlmIG9sZCBlbGVtZW50IGlzIGluIGFcbiAgICAgICAgICAvLyBsZWF2aW5nIHRyYW5zaXRpb24uIE9ubHkgaGFwcGVucyB3aGVuIGNvbWJpbmluZyB0cmFuc2l0aW9uICtcbiAgICAgICAgICAvLyBrZWVwLWFsaXZlICsgSE9Dcy4gKCM0NTkwKVxuICAgICAgICAgIG9sZEVsbS5fbGVhdmVDYiA/IG51bGwgOiBwYXJlbnRFbG0kMSxcbiAgICAgICAgICBub2RlT3BzLm5leHRTaWJsaW5nKG9sZEVsbSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyB1cGRhdGUgcGFyZW50IHBsYWNlaG9sZGVyIG5vZGUgZWxlbWVudCwgcmVjdXJzaXZlbHlcbiAgICAgICAgaWYgKGlzRGVmKHZub2RlLnBhcmVudCkpIHtcbiAgICAgICAgICB2YXIgYW5jZXN0b3IgPSB2bm9kZS5wYXJlbnQ7XG4gICAgICAgICAgdmFyIHBhdGNoYWJsZSA9IGlzUGF0Y2hhYmxlKHZub2RlKTtcbiAgICAgICAgICB3aGlsZSAoYW5jZXN0b3IpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2JzLmRlc3Ryb3kubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgY2JzLmRlc3Ryb3lbaV0oYW5jZXN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5jZXN0b3IuZWxtID0gdm5vZGUuZWxtO1xuICAgICAgICAgICAgaWYgKHBhdGNoYWJsZSkge1xuICAgICAgICAgICAgICBmb3IgKHZhciBpJDEgPSAwOyBpJDEgPCBjYnMuY3JlYXRlLmxlbmd0aDsgKytpJDEpIHtcbiAgICAgICAgICAgICAgICBjYnMuY3JlYXRlW2kkMV0oZW1wdHlOb2RlLCBhbmNlc3Rvcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gIzY1MTNcbiAgICAgICAgICAgICAgLy8gaW52b2tlIGluc2VydCBob29rcyB0aGF0IG1heSBoYXZlIGJlZW4gbWVyZ2VkIGJ5IGNyZWF0ZSBob29rcy5cbiAgICAgICAgICAgICAgLy8gZS5nLiBmb3IgZGlyZWN0aXZlcyB0aGF0IHVzZXMgdGhlIFwiaW5zZXJ0ZWRcIiBob29rLlxuICAgICAgICAgICAgICB2YXIgaW5zZXJ0ID0gYW5jZXN0b3IuZGF0YS5ob29rLmluc2VydDtcbiAgICAgICAgICAgICAgaWYgKGluc2VydC5tZXJnZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBzdGFydCBhdCBpbmRleCAxIHRvIGF2b2lkIHJlLWludm9raW5nIGNvbXBvbmVudCBtb3VudGVkIGhvb2tcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpJDIgPSAxOyBpJDIgPCBpbnNlcnQuZm5zLmxlbmd0aDsgaSQyKyspIHtcbiAgICAgICAgICAgICAgICAgIGluc2VydC5mbnNbaSQyXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVnaXN0ZXJSZWYoYW5jZXN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVzdHJveSBvbGQgbm9kZVxuICAgICAgICBpZiAoaXNEZWYocGFyZW50RWxtJDEpKSB7XG4gICAgICAgICAgcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSQxLCBbb2xkVm5vZGVdLCAwLCAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0RlZihvbGRWbm9kZS50YWcpKSB7XG4gICAgICAgICAgaW52b2tlRGVzdHJveUhvb2sob2xkVm5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaW52b2tlSW5zZXJ0SG9vayh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBpc0luaXRpYWxQYXRjaCk7XG4gICAgcmV0dXJuIHZub2RlLmVsbVxuICB9XG59XG5cbi8qICAqL1xuXG52YXIgZGlyZWN0aXZlcyA9IHtcbiAgY3JlYXRlOiB1cGRhdGVEaXJlY3RpdmVzLFxuICB1cGRhdGU6IHVwZGF0ZURpcmVjdGl2ZXMsXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uIHVuYmluZERpcmVjdGl2ZXMgKHZub2RlKSB7XG4gICAgdXBkYXRlRGlyZWN0aXZlcyh2bm9kZSwgZW1wdHlOb2RlKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gdXBkYXRlRGlyZWN0aXZlcyAob2xkVm5vZGUsIHZub2RlKSB7XG4gIGlmIChvbGRWbm9kZS5kYXRhLmRpcmVjdGl2ZXMgfHwgdm5vZGUuZGF0YS5kaXJlY3RpdmVzKSB7XG4gICAgX3VwZGF0ZShvbGRWbm9kZSwgdm5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF91cGRhdGUgKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIgaXNDcmVhdGUgPSBvbGRWbm9kZSA9PT0gZW1wdHlOb2RlO1xuICB2YXIgaXNEZXN0cm95ID0gdm5vZGUgPT09IGVtcHR5Tm9kZTtcbiAgdmFyIG9sZERpcnMgPSBub3JtYWxpemVEaXJlY3RpdmVzJDEob2xkVm5vZGUuZGF0YS5kaXJlY3RpdmVzLCBvbGRWbm9kZS5jb250ZXh0KTtcbiAgdmFyIG5ld0RpcnMgPSBub3JtYWxpemVEaXJlY3RpdmVzJDEodm5vZGUuZGF0YS5kaXJlY3RpdmVzLCB2bm9kZS5jb250ZXh0KTtcblxuICB2YXIgZGlyc1dpdGhJbnNlcnQgPSBbXTtcbiAgdmFyIGRpcnNXaXRoUG9zdHBhdGNoID0gW107XG5cbiAgdmFyIGtleSwgb2xkRGlyLCBkaXI7XG4gIGZvciAoa2V5IGluIG5ld0RpcnMpIHtcbiAgICBvbGREaXIgPSBvbGREaXJzW2tleV07XG4gICAgZGlyID0gbmV3RGlyc1trZXldO1xuICAgIGlmICghb2xkRGlyKSB7XG4gICAgICAvLyBuZXcgZGlyZWN0aXZlLCBiaW5kXG4gICAgICBjYWxsSG9vayQxKGRpciwgJ2JpbmQnLCB2bm9kZSwgb2xkVm5vZGUpO1xuICAgICAgaWYgKGRpci5kZWYgJiYgZGlyLmRlZi5pbnNlcnRlZCkge1xuICAgICAgICBkaXJzV2l0aEluc2VydC5wdXNoKGRpcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGV4aXN0aW5nIGRpcmVjdGl2ZSwgdXBkYXRlXG4gICAgICBkaXIub2xkVmFsdWUgPSBvbGREaXIudmFsdWU7XG4gICAgICBjYWxsSG9vayQxKGRpciwgJ3VwZGF0ZScsIHZub2RlLCBvbGRWbm9kZSk7XG4gICAgICBpZiAoZGlyLmRlZiAmJiBkaXIuZGVmLmNvbXBvbmVudFVwZGF0ZWQpIHtcbiAgICAgICAgZGlyc1dpdGhQb3N0cGF0Y2gucHVzaChkaXIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChkaXJzV2l0aEluc2VydC5sZW5ndGgpIHtcbiAgICB2YXIgY2FsbEluc2VydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlyc1dpdGhJbnNlcnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbEhvb2skMShkaXJzV2l0aEluc2VydFtpXSwgJ2luc2VydGVkJywgdm5vZGUsIG9sZFZub2RlKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGlmIChpc0NyZWF0ZSkge1xuICAgICAgbWVyZ2VWTm9kZUhvb2sodm5vZGUsICdpbnNlcnQnLCBjYWxsSW5zZXJ0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbEluc2VydCgpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkaXJzV2l0aFBvc3RwYXRjaC5sZW5ndGgpIHtcbiAgICBtZXJnZVZOb2RlSG9vayh2bm9kZSwgJ3Bvc3RwYXRjaCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlyc1dpdGhQb3N0cGF0Y2gubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbEhvb2skMShkaXJzV2l0aFBvc3RwYXRjaFtpXSwgJ2NvbXBvbmVudFVwZGF0ZWQnLCB2bm9kZSwgb2xkVm5vZGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKCFpc0NyZWF0ZSkge1xuICAgIGZvciAoa2V5IGluIG9sZERpcnMpIHtcbiAgICAgIGlmICghbmV3RGlyc1trZXldKSB7XG4gICAgICAgIC8vIG5vIGxvbmdlciBwcmVzZW50LCB1bmJpbmRcbiAgICAgICAgY2FsbEhvb2skMShvbGREaXJzW2tleV0sICd1bmJpbmQnLCBvbGRWbm9kZSwgb2xkVm5vZGUsIGlzRGVzdHJveSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbnZhciBlbXB0eU1vZGlmaWVycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZURpcmVjdGl2ZXMkMSAoXG4gIGRpcnMsXG4gIHZtXG4pIHtcbiAgdmFyIHJlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghZGlycykge1xuICAgIC8vICRmbG93LWRpc2FibGUtbGluZVxuICAgIHJldHVybiByZXNcbiAgfVxuICB2YXIgaSwgZGlyO1xuICBmb3IgKGkgPSAwOyBpIDwgZGlycy5sZW5ndGg7IGkrKykge1xuICAgIGRpciA9IGRpcnNbaV07XG4gICAgaWYgKCFkaXIubW9kaWZpZXJzKSB7XG4gICAgICAvLyAkZmxvdy1kaXNhYmxlLWxpbmVcbiAgICAgIGRpci5tb2RpZmllcnMgPSBlbXB0eU1vZGlmaWVycztcbiAgICB9XG4gICAgcmVzW2dldFJhd0Rpck5hbWUoZGlyKV0gPSBkaXI7XG4gICAgZGlyLmRlZiA9IHJlc29sdmVBc3NldCh2bS4kb3B0aW9ucywgJ2RpcmVjdGl2ZXMnLCBkaXIubmFtZSwgdHJ1ZSk7XG4gIH1cbiAgLy8gJGZsb3ctZGlzYWJsZS1saW5lXG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gZ2V0UmF3RGlyTmFtZSAoZGlyKSB7XG4gIHJldHVybiBkaXIucmF3TmFtZSB8fCAoKGRpci5uYW1lKSArIFwiLlwiICsgKE9iamVjdC5rZXlzKGRpci5tb2RpZmllcnMgfHwge30pLmpvaW4oJy4nKSkpXG59XG5cbmZ1bmN0aW9uIGNhbGxIb29rJDEgKGRpciwgaG9vaywgdm5vZGUsIG9sZFZub2RlLCBpc0Rlc3Ryb3kpIHtcbiAgdmFyIGZuID0gZGlyLmRlZiAmJiBkaXIuZGVmW2hvb2tdO1xuICBpZiAoZm4pIHtcbiAgICB0cnkge1xuICAgICAgZm4odm5vZGUuZWxtLCBkaXIsIHZub2RlLCBvbGRWbm9kZSwgaXNEZXN0cm95KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBoYW5kbGVFcnJvcihlLCB2bm9kZS5jb250ZXh0LCAoXCJkaXJlY3RpdmUgXCIgKyAoZGlyLm5hbWUpICsgXCIgXCIgKyBob29rICsgXCIgaG9va1wiKSk7XG4gICAgfVxuICB9XG59XG5cbnZhciBiYXNlTW9kdWxlcyA9IFtcbiAgcmVmLFxuICBkaXJlY3RpdmVzXG5dO1xuXG4vKiAgKi9cblxuZnVuY3Rpb24gdXBkYXRlQXR0cnMgKG9sZFZub2RlLCB2bm9kZSkge1xuICBpZiAoIW9sZFZub2RlLmRhdGEuYXR0cnMgJiYgIXZub2RlLmRhdGEuYXR0cnMpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIga2V5LCBjdXIsIG9sZDtcbiAgdmFyIGVsbSA9IHZub2RlLmVsbTtcbiAgdmFyIG9sZEF0dHJzID0gb2xkVm5vZGUuZGF0YS5hdHRycyB8fCB7fTtcbiAgdmFyIGF0dHJzID0gdm5vZGUuZGF0YS5hdHRycyB8fCB7fTtcbiAgLy8gY2xvbmUgb2JzZXJ2ZWQgb2JqZWN0cywgYXMgdGhlIHVzZXIgcHJvYmFibHkgd2FudHMgdG8gbXV0YXRlIGl0XG4gIGlmIChhdHRycy5fX29iX18pIHtcbiAgICBhdHRycyA9IHZub2RlLmRhdGEuYXR0cnMgPSBleHRlbmQoe30sIGF0dHJzKTtcbiAgfVxuXG4gIHZhciBzdXBwb3J0QmF0Y2hVcGRhdGUgPSB0eXBlb2YgZWxtLnNldEF0dHJzID09PSAnZnVuY3Rpb24nO1xuICB2YXIgYmF0Y2hlZEF0dHJzID0ge307XG4gIGZvciAoa2V5IGluIGF0dHJzKSB7XG4gICAgY3VyID0gYXR0cnNba2V5XTtcbiAgICBvbGQgPSBvbGRBdHRyc1trZXldO1xuICAgIGlmIChvbGQgIT09IGN1cikge1xuICAgICAgc3VwcG9ydEJhdGNoVXBkYXRlXG4gICAgICAgID8gKGJhdGNoZWRBdHRyc1trZXldID0gY3VyKVxuICAgICAgICA6IGVsbS5zZXRBdHRyKGtleSwgY3VyKTtcbiAgICB9XG4gIH1cbiAgZm9yIChrZXkgaW4gb2xkQXR0cnMpIHtcbiAgICBpZiAoYXR0cnNba2V5XSA9PSBudWxsKSB7XG4gICAgICBzdXBwb3J0QmF0Y2hVcGRhdGVcbiAgICAgICAgPyAoYmF0Y2hlZEF0dHJzW2tleV0gPSB1bmRlZmluZWQpXG4gICAgICAgIDogZWxtLnNldEF0dHIoa2V5KTtcbiAgICB9XG4gIH1cbiAgaWYgKHN1cHBvcnRCYXRjaFVwZGF0ZSkge1xuICAgIGVsbS5zZXRBdHRycyhiYXRjaGVkQXR0cnMpO1xuICB9XG59XG5cbnZhciBhdHRycyA9IHtcbiAgY3JlYXRlOiB1cGRhdGVBdHRycyxcbiAgdXBkYXRlOiB1cGRhdGVBdHRyc1xufTtcblxuLyogICovXG5cbmZ1bmN0aW9uIHVwZGF0ZUNsYXNzIChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgdmFyIGVsID0gdm5vZGUuZWxtO1xuICB2YXIgY3R4ID0gdm5vZGUuY29udGV4dDtcblxuICB2YXIgZGF0YSA9IHZub2RlLmRhdGE7XG4gIHZhciBvbGREYXRhID0gb2xkVm5vZGUuZGF0YTtcbiAgaWYgKCFkYXRhLnN0YXRpY0NsYXNzICYmXG4gICAgIWRhdGEuY2xhc3MgJiZcbiAgICAoIW9sZERhdGEgfHwgKCFvbGREYXRhLnN0YXRpY0NsYXNzICYmICFvbGREYXRhLmNsYXNzKSlcbiAgKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgb2xkQ2xhc3NMaXN0ID0gW107XG4gIC8vIHVubGlrZSB3ZWIsIHdlZXggdm5vZGUgc3RhdGljQ2xhc3MgaXMgYW4gQXJyYXlcbiAgdmFyIG9sZFN0YXRpY0NsYXNzID0gb2xkRGF0YS5zdGF0aWNDbGFzcztcbiAgaWYgKG9sZFN0YXRpY0NsYXNzKSB7XG4gICAgb2xkQ2xhc3NMaXN0LnB1c2guYXBwbHkob2xkQ2xhc3NMaXN0LCBvbGRTdGF0aWNDbGFzcyk7XG4gIH1cbiAgaWYgKG9sZERhdGEuY2xhc3MpIHtcbiAgICBvbGRDbGFzc0xpc3QucHVzaC5hcHBseShvbGRDbGFzc0xpc3QsIG9sZERhdGEuY2xhc3MpO1xuICB9XG5cbiAgdmFyIGNsYXNzTGlzdCA9IFtdO1xuICAvLyB1bmxpa2Ugd2ViLCB3ZWV4IHZub2RlIHN0YXRpY0NsYXNzIGlzIGFuIEFycmF5XG4gIHZhciBzdGF0aWNDbGFzcyA9IGRhdGEuc3RhdGljQ2xhc3M7XG4gIGlmIChzdGF0aWNDbGFzcykge1xuICAgIGNsYXNzTGlzdC5wdXNoLmFwcGx5KGNsYXNzTGlzdCwgc3RhdGljQ2xhc3MpO1xuICB9XG4gIGlmIChkYXRhLmNsYXNzKSB7XG4gICAgY2xhc3NMaXN0LnB1c2guYXBwbHkoY2xhc3NMaXN0LCBkYXRhLmNsYXNzKTtcbiAgfVxuXG4gIHZhciBzdHlsZSA9IGdldFN0eWxlKG9sZENsYXNzTGlzdCwgY2xhc3NMaXN0LCBjdHgpO1xuICBpZiAodHlwZW9mIGVsLnNldFN0eWxlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGVsLnNldFN0eWxlcyhzdHlsZSk7XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIga2V5IGluIHN0eWxlKSB7XG4gICAgICBlbC5zZXRTdHlsZShrZXksIHN0eWxlW2tleV0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRTdHlsZSAob2xkQ2xhc3NMaXN0LCBjbGFzc0xpc3QsIGN0eCkge1xuICAvLyBzdHlsZSBpcyBhIHdlZXgtb25seSBpbmplY3RlZCBvYmplY3RcbiAgLy8gY29tcGlsZWQgZnJvbSA8c3R5bGU+IHRhZ3MgaW4gd2VleCBmaWxlc1xuICB2YXIgc3R5bGVzaGVldCA9IGN0eC4kb3B0aW9ucy5zdHlsZSB8fCB7fTtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBjbGFzc0xpc3QuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBzdHlsZSA9IHN0eWxlc2hlZXRbbmFtZV07XG4gICAgZXh0ZW5kKHJlc3VsdCwgc3R5bGUpO1xuICB9KTtcbiAgb2xkQ2xhc3NMaXN0LmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgc3R5bGUgPSBzdHlsZXNoZWV0W25hbWVdO1xuICAgIGZvciAodmFyIGtleSBpbiBzdHlsZSkge1xuICAgICAgaWYgKCFyZXN1bHQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICByZXN1bHRba2V5XSA9ICcnO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXN1bHRcbn1cblxudmFyIGtsYXNzID0ge1xuICBjcmVhdGU6IHVwZGF0ZUNsYXNzLFxuICB1cGRhdGU6IHVwZGF0ZUNsYXNzXG59O1xuXG4vKiAgKi9cblxudmFyIHRhcmdldCQxO1xuXG5mdW5jdGlvbiBhZGQkMSAoXG4gIGV2ZW50LFxuICBoYW5kbGVyLFxuICBvbmNlLFxuICBjYXB0dXJlLFxuICBwYXNzaXZlLFxuICBwYXJhbXNcbikge1xuICBpZiAoY2FwdHVyZSkge1xuICAgIGNvbnNvbGUubG9nKCdXZWV4IGRvIG5vdCBzdXBwb3J0IGV2ZW50IGluIGJ1YmJsZSBwaGFzZS4nKTtcbiAgICByZXR1cm5cbiAgfVxuICBpZiAob25jZSkge1xuICAgIHZhciBvbGRIYW5kbGVyID0gaGFuZGxlcjtcbiAgICB2YXIgX3RhcmdldCA9IHRhcmdldCQxOyAvLyBzYXZlIGN1cnJlbnQgdGFyZ2V0IGVsZW1lbnQgaW4gY2xvc3VyZVxuICAgIGhhbmRsZXIgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgIHZhciByZXMgPSBhcmd1bWVudHMubGVuZ3RoID09PSAxXG4gICAgICAgID8gb2xkSGFuZGxlcihldilcbiAgICAgICAgOiBvbGRIYW5kbGVyLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICBpZiAocmVzICE9PSBudWxsKSB7XG4gICAgICAgIHJlbW92ZSQyKGV2ZW50LCBudWxsLCBudWxsLCBfdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIHRhcmdldCQxLmFkZEV2ZW50KGV2ZW50LCBoYW5kbGVyLCBwYXJhbXMpO1xufVxuXG5mdW5jdGlvbiByZW1vdmUkMiAoXG4gIGV2ZW50LFxuICBoYW5kbGVyLFxuICBjYXB0dXJlLFxuICBfdGFyZ2V0XG4pIHtcbiAgKF90YXJnZXQgfHwgdGFyZ2V0JDEpLnJlbW92ZUV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRE9NTGlzdGVuZXJzIChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgaWYgKCFvbGRWbm9kZS5kYXRhLm9uICYmICF2bm9kZS5kYXRhLm9uKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIG9uID0gdm5vZGUuZGF0YS5vbiB8fCB7fTtcbiAgdmFyIG9sZE9uID0gb2xkVm5vZGUuZGF0YS5vbiB8fCB7fTtcbiAgdGFyZ2V0JDEgPSB2bm9kZS5lbG07XG4gIHVwZGF0ZUxpc3RlbmVycyhvbiwgb2xkT24sIGFkZCQxLCByZW1vdmUkMiwgdm5vZGUuY29udGV4dCk7XG4gIHRhcmdldCQxID0gdW5kZWZpbmVkO1xufVxuXG52YXIgZXZlbnRzID0ge1xuICBjcmVhdGU6IHVwZGF0ZURPTUxpc3RlbmVycyxcbiAgdXBkYXRlOiB1cGRhdGVET01MaXN0ZW5lcnNcbn07XG5cbi8qICAqL1xuXG52YXIgbm9ybWFsaXplID0gY2FjaGVkKGNhbWVsaXplKTtcblxuZnVuY3Rpb24gY3JlYXRlU3R5bGUgKG9sZFZub2RlLCB2bm9kZSkge1xuICBpZiAoIXZub2RlLmRhdGEuc3RhdGljU3R5bGUpIHtcbiAgICB1cGRhdGVTdHlsZShvbGRWbm9kZSwgdm5vZGUpO1xuICAgIHJldHVyblxuICB9XG4gIHZhciBlbG0gPSB2bm9kZS5lbG07XG4gIHZhciBzdGF0aWNTdHlsZSA9IHZub2RlLmRhdGEuc3RhdGljU3R5bGU7XG4gIHZhciBzdXBwb3J0QmF0Y2hVcGRhdGUgPSB0eXBlb2YgZWxtLnNldFN0eWxlcyA9PT0gJ2Z1bmN0aW9uJztcbiAgdmFyIGJhdGNoZWRTdHlsZXMgPSB7fTtcbiAgZm9yICh2YXIgbmFtZSBpbiBzdGF0aWNTdHlsZSkge1xuICAgIGlmIChzdGF0aWNTdHlsZVtuYW1lXSkge1xuICAgICAgc3VwcG9ydEJhdGNoVXBkYXRlXG4gICAgICAgID8gKGJhdGNoZWRTdHlsZXNbbm9ybWFsaXplKG5hbWUpXSA9IHN0YXRpY1N0eWxlW25hbWVdKVxuICAgICAgICA6IGVsbS5zZXRTdHlsZShub3JtYWxpemUobmFtZSksIHN0YXRpY1N0eWxlW25hbWVdKTtcbiAgICB9XG4gIH1cbiAgaWYgKHN1cHBvcnRCYXRjaFVwZGF0ZSkge1xuICAgIGVsbS5zZXRTdHlsZXMoYmF0Y2hlZFN0eWxlcyk7XG4gIH1cbiAgdXBkYXRlU3R5bGUob2xkVm5vZGUsIHZub2RlKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU3R5bGUgKG9sZFZub2RlLCB2bm9kZSkge1xuICBpZiAoIW9sZFZub2RlLmRhdGEuc3R5bGUgJiYgIXZub2RlLmRhdGEuc3R5bGUpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgY3VyLCBuYW1lO1xuICB2YXIgZWxtID0gdm5vZGUuZWxtO1xuICB2YXIgb2xkU3R5bGUgPSBvbGRWbm9kZS5kYXRhLnN0eWxlIHx8IHt9O1xuICB2YXIgc3R5bGUgPSB2bm9kZS5kYXRhLnN0eWxlIHx8IHt9O1xuXG4gIHZhciBuZWVkQ2xvbmUgPSBzdHlsZS5fX29iX187XG5cbiAgLy8gaGFuZGxlIGFycmF5IHN5bnRheFxuICBpZiAoQXJyYXkuaXNBcnJheShzdHlsZSkpIHtcbiAgICBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGUgPSB0b09iamVjdCQxKHN0eWxlKTtcbiAgfVxuXG4gIC8vIGNsb25lIHRoZSBzdHlsZSBmb3IgZnV0dXJlIHVwZGF0ZXMsXG4gIC8vIGluIGNhc2UgdGhlIHVzZXIgbXV0YXRlcyB0aGUgc3R5bGUgb2JqZWN0IGluLXBsYWNlLlxuICBpZiAobmVlZENsb25lKSB7XG4gICAgc3R5bGUgPSB2bm9kZS5kYXRhLnN0eWxlID0gZXh0ZW5kKHt9LCBzdHlsZSk7XG4gIH1cblxuICB2YXIgc3VwcG9ydEJhdGNoVXBkYXRlID0gdHlwZW9mIGVsbS5zZXRTdHlsZXMgPT09ICdmdW5jdGlvbic7XG4gIHZhciBiYXRjaGVkU3R5bGVzID0ge307XG4gIGZvciAobmFtZSBpbiBvbGRTdHlsZSkge1xuICAgIGlmICghc3R5bGVbbmFtZV0pIHtcbiAgICAgIHN1cHBvcnRCYXRjaFVwZGF0ZVxuICAgICAgICA/IChiYXRjaGVkU3R5bGVzW25vcm1hbGl6ZShuYW1lKV0gPSAnJylcbiAgICAgICAgOiBlbG0uc2V0U3R5bGUobm9ybWFsaXplKG5hbWUpLCAnJyk7XG4gICAgfVxuICB9XG4gIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgIGN1ciA9IHN0eWxlW25hbWVdO1xuICAgIHN1cHBvcnRCYXRjaFVwZGF0ZVxuICAgICAgPyAoYmF0Y2hlZFN0eWxlc1tub3JtYWxpemUobmFtZSldID0gY3VyKVxuICAgICAgOiBlbG0uc2V0U3R5bGUobm9ybWFsaXplKG5hbWUpLCBjdXIpO1xuICB9XG4gIGlmIChzdXBwb3J0QmF0Y2hVcGRhdGUpIHtcbiAgICBlbG0uc2V0U3R5bGVzKGJhdGNoZWRTdHlsZXMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvT2JqZWN0JDEgKGFycikge1xuICB2YXIgcmVzID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGFycltpXSkge1xuICAgICAgZXh0ZW5kKHJlcywgYXJyW2ldKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG52YXIgc3R5bGUgPSB7XG4gIGNyZWF0ZTogY3JlYXRlU3R5bGUsXG4gIHVwZGF0ZTogdXBkYXRlU3R5bGVcbn07XG5cbi8qICAqL1xuXG4vKipcbiAqIEFkZCBjbGFzcyB3aXRoIGNvbXBhdGliaWxpdHkgZm9yIFNWRyBzaW5jZSBjbGFzc0xpc3QgaXMgbm90IHN1cHBvcnRlZCBvblxuICogU1ZHIGVsZW1lbnRzIGluIElFXG4gKi9cblxuXG4vKipcbiAqIFJlbW92ZSBjbGFzcyB3aXRoIGNvbXBhdGliaWxpdHkgZm9yIFNWRyBzaW5jZSBjbGFzc0xpc3QgaXMgbm90IHN1cHBvcnRlZCBvblxuICogU1ZHIGVsZW1lbnRzIGluIElFXG4gKi9cblxuLyogICovXG5cbmZ1bmN0aW9uIHJlc29sdmVUcmFuc2l0aW9uIChkZWYpIHtcbiAgaWYgKCFkZWYpIHtcbiAgICByZXR1cm5cbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAodHlwZW9mIGRlZiA9PT0gJ29iamVjdCcpIHtcbiAgICB2YXIgcmVzID0ge307XG4gICAgaWYgKGRlZi5jc3MgIT09IGZhbHNlKSB7XG4gICAgICBleHRlbmQocmVzLCBhdXRvQ3NzVHJhbnNpdGlvbihkZWYubmFtZSB8fCAndicpKTtcbiAgICB9XG4gICAgZXh0ZW5kKHJlcywgZGVmKTtcbiAgICByZXR1cm4gcmVzXG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZiA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gYXV0b0Nzc1RyYW5zaXRpb24oZGVmKVxuICB9XG59XG5cbnZhciBhdXRvQ3NzVHJhbnNpdGlvbiA9IGNhY2hlZChmdW5jdGlvbiAobmFtZSkge1xuICByZXR1cm4ge1xuICAgIGVudGVyQ2xhc3M6IChuYW1lICsgXCItZW50ZXJcIiksXG4gICAgZW50ZXJUb0NsYXNzOiAobmFtZSArIFwiLWVudGVyLXRvXCIpLFxuICAgIGVudGVyQWN0aXZlQ2xhc3M6IChuYW1lICsgXCItZW50ZXItYWN0aXZlXCIpLFxuICAgIGxlYXZlQ2xhc3M6IChuYW1lICsgXCItbGVhdmVcIiksXG4gICAgbGVhdmVUb0NsYXNzOiAobmFtZSArIFwiLWxlYXZlLXRvXCIpLFxuICAgIGxlYXZlQWN0aXZlQ2xhc3M6IChuYW1lICsgXCItbGVhdmUtYWN0aXZlXCIpXG4gIH1cbn0pO1xuXG52YXIgaGFzVHJhbnNpdGlvbiA9IGluQnJvd3NlciAmJiAhaXNJRTk7XG4vLyBUcmFuc2l0aW9uIHByb3BlcnR5L2V2ZW50IHNuaWZmaW5nXG5cblxuXG5cbmlmIChoYXNUcmFuc2l0aW9uKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAod2luZG93Lm9udHJhbnNpdGlvbmVuZCA9PT0gdW5kZWZpbmVkICYmXG4gICAgd2luZG93Lm9ud2Via2l0dHJhbnNpdGlvbmVuZCAhPT0gdW5kZWZpbmVkXG4gICkge1xuXG4gIH1cbiAgaWYgKHdpbmRvdy5vbmFuaW1hdGlvbmVuZCA9PT0gdW5kZWZpbmVkICYmXG4gICAgd2luZG93Lm9ud2Via2l0YW5pbWF0aW9uZW5kICE9PSB1bmRlZmluZWRcbiAgKSB7XG5cbiAgfVxufVxuXG4vLyBiaW5kaW5nIHRvIHdpbmRvdyBpcyBuZWNlc3NhcnkgdG8gbWFrZSBob3QgcmVsb2FkIHdvcmsgaW4gSUUgaW4gc3RyaWN0IG1vZGVcbnZhciByYWYgPSBpbkJyb3dzZXJcbiAgPyB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgPyB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KVxuICAgIDogc2V0VGltZW91dFxuICA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGZ1bmN0aW9uIChmbikgeyByZXR1cm4gZm4oKTsgfTtcblxudmFyIHRyYW5zaXRpb24gPSB7XG4gIGNyZWF0ZTogZW50ZXIsXG4gIGFjdGl2YXRlOiBlbnRlcixcbiAgcmVtb3ZlOiBsZWF2ZVxufTtcblxuZnVuY3Rpb24gZW50ZXIgKF8sIHZub2RlKSB7XG4gIHZhciBlbCA9IHZub2RlLmVsbTtcblxuICAvLyBjYWxsIGxlYXZlIGNhbGxiYWNrIG5vd1xuICBpZiAoZWwuX2xlYXZlQ2IpIHtcbiAgICBlbC5fbGVhdmVDYi5jYW5jZWxsZWQgPSB0cnVlO1xuICAgIGVsLl9sZWF2ZUNiKCk7XG4gIH1cblxuICB2YXIgZGF0YSA9IHJlc29sdmVUcmFuc2l0aW9uKHZub2RlLmRhdGEudHJhbnNpdGlvbik7XG4gIGlmICghZGF0YSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChlbC5fZW50ZXJDYikge1xuICAgIHJldHVyblxuICB9XG5cbiAgdmFyIGVudGVyQ2xhc3MgPSBkYXRhLmVudGVyQ2xhc3M7XG4gIHZhciBlbnRlclRvQ2xhc3MgPSBkYXRhLmVudGVyVG9DbGFzcztcbiAgdmFyIGVudGVyQWN0aXZlQ2xhc3MgPSBkYXRhLmVudGVyQWN0aXZlQ2xhc3M7XG4gIHZhciBhcHBlYXJDbGFzcyA9IGRhdGEuYXBwZWFyQ2xhc3M7XG4gIHZhciBhcHBlYXJUb0NsYXNzID0gZGF0YS5hcHBlYXJUb0NsYXNzO1xuICB2YXIgYXBwZWFyQWN0aXZlQ2xhc3MgPSBkYXRhLmFwcGVhckFjdGl2ZUNsYXNzO1xuICB2YXIgYmVmb3JlRW50ZXIgPSBkYXRhLmJlZm9yZUVudGVyO1xuICB2YXIgZW50ZXIgPSBkYXRhLmVudGVyO1xuICB2YXIgYWZ0ZXJFbnRlciA9IGRhdGEuYWZ0ZXJFbnRlcjtcbiAgdmFyIGVudGVyQ2FuY2VsbGVkID0gZGF0YS5lbnRlckNhbmNlbGxlZDtcbiAgdmFyIGJlZm9yZUFwcGVhciA9IGRhdGEuYmVmb3JlQXBwZWFyO1xuICB2YXIgYXBwZWFyID0gZGF0YS5hcHBlYXI7XG4gIHZhciBhZnRlckFwcGVhciA9IGRhdGEuYWZ0ZXJBcHBlYXI7XG4gIHZhciBhcHBlYXJDYW5jZWxsZWQgPSBkYXRhLmFwcGVhckNhbmNlbGxlZDtcblxuICB2YXIgY29udGV4dCA9IGFjdGl2ZUluc3RhbmNlO1xuICB2YXIgdHJhbnNpdGlvbk5vZGUgPSBhY3RpdmVJbnN0YW5jZS4kdm5vZGU7XG4gIHdoaWxlICh0cmFuc2l0aW9uTm9kZSAmJiB0cmFuc2l0aW9uTm9kZS5wYXJlbnQpIHtcbiAgICB0cmFuc2l0aW9uTm9kZSA9IHRyYW5zaXRpb25Ob2RlLnBhcmVudDtcbiAgICBjb250ZXh0ID0gdHJhbnNpdGlvbk5vZGUuY29udGV4dDtcbiAgfVxuXG4gIHZhciBpc0FwcGVhciA9ICFjb250ZXh0Ll9pc01vdW50ZWQgfHwgIXZub2RlLmlzUm9vdEluc2VydDtcblxuICBpZiAoaXNBcHBlYXIgJiYgIWFwcGVhciAmJiBhcHBlYXIgIT09ICcnKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgc3RhcnRDbGFzcyA9IGlzQXBwZWFyID8gYXBwZWFyQ2xhc3MgOiBlbnRlckNsYXNzO1xuICB2YXIgdG9DbGFzcyA9IGlzQXBwZWFyID8gYXBwZWFyVG9DbGFzcyA6IGVudGVyVG9DbGFzcztcbiAgdmFyIGFjdGl2ZUNsYXNzID0gaXNBcHBlYXIgPyBhcHBlYXJBY3RpdmVDbGFzcyA6IGVudGVyQWN0aXZlQ2xhc3M7XG4gIHZhciBiZWZvcmVFbnRlckhvb2sgPSBpc0FwcGVhciA/IChiZWZvcmVBcHBlYXIgfHwgYmVmb3JlRW50ZXIpIDogYmVmb3JlRW50ZXI7XG4gIHZhciBlbnRlckhvb2sgPSBpc0FwcGVhciA/ICh0eXBlb2YgYXBwZWFyID09PSAnZnVuY3Rpb24nID8gYXBwZWFyIDogZW50ZXIpIDogZW50ZXI7XG4gIHZhciBhZnRlckVudGVySG9vayA9IGlzQXBwZWFyID8gKGFmdGVyQXBwZWFyIHx8IGFmdGVyRW50ZXIpIDogYWZ0ZXJFbnRlcjtcbiAgdmFyIGVudGVyQ2FuY2VsbGVkSG9vayA9IGlzQXBwZWFyID8gKGFwcGVhckNhbmNlbGxlZCB8fCBlbnRlckNhbmNlbGxlZCkgOiBlbnRlckNhbmNlbGxlZDtcblxuICB2YXIgdXNlcldhbnRzQ29udHJvbCA9XG4gICAgZW50ZXJIb29rICYmXG4gICAgLy8gZW50ZXJIb29rIG1heSBiZSBhIGJvdW5kIG1ldGhvZCB3aGljaCBleHBvc2VzXG4gICAgLy8gdGhlIGxlbmd0aCBvZiBvcmlnaW5hbCBmbiBhcyBfbGVuZ3RoXG4gICAgKGVudGVySG9vay5fbGVuZ3RoIHx8IGVudGVySG9vay5sZW5ndGgpID4gMTtcblxuICB2YXIgc3R5bGVzaGVldCA9IHZub2RlLmNvbnRleHQuJG9wdGlvbnMuc3R5bGUgfHwge307XG4gIHZhciBzdGFydFN0YXRlID0gc3R5bGVzaGVldFtzdGFydENsYXNzXTtcbiAgdmFyIHRyYW5zaXRpb25Qcm9wZXJ0aWVzID0gKHN0eWxlc2hlZXRbJ0BUUkFOU0lUSU9OJ10gJiYgc3R5bGVzaGVldFsnQFRSQU5TSVRJT04nXVthY3RpdmVDbGFzc10pIHx8IHt9O1xuICB2YXIgZW5kU3RhdGUgPSBnZXRFbnRlclRhcmdldFN0YXRlKGVsLCBzdHlsZXNoZWV0LCBzdGFydENsYXNzLCB0b0NsYXNzLCBhY3RpdmVDbGFzcywgdm5vZGUuY29udGV4dCk7XG4gIHZhciBuZWVkQW5pbWF0aW9uID0gT2JqZWN0LmtleXMoZW5kU3RhdGUpLmxlbmd0aCA+IDA7XG5cbiAgdmFyIGNiID0gZWwuX2VudGVyQ2IgPSBvbmNlKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoY2IuY2FuY2VsbGVkKSB7XG4gICAgICBlbnRlckNhbmNlbGxlZEhvb2sgJiYgZW50ZXJDYW5jZWxsZWRIb29rKGVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWZ0ZXJFbnRlckhvb2sgJiYgYWZ0ZXJFbnRlckhvb2soZWwpO1xuICAgIH1cbiAgICBlbC5fZW50ZXJDYiA9IG51bGw7XG4gIH0pO1xuXG4gIC8vIFdlIG5lZWQgdG8gd2FpdCB1bnRpbCB0aGUgbmF0aXZlIGVsZW1lbnQgaGFzIGJlZW4gaW5zZXJ0ZWQsIGJ1dCBjdXJyZW50bHlcbiAgLy8gdGhlcmUncyBubyBBUEkgdG8gZG8gdGhhdC4gU28gd2UgaGF2ZSB0byB3YWl0IFwib25lIGZyYW1lXCIgLSBub3QgZW50aXJlbHlcbiAgLy8gc3VyZSBpZiB0aGlzIGlzIGd1YXJhbnRlZWQgdG8gYmUgZW5vdWdoIChlLmcuIG9uIHNsb3cgZGV2aWNlcz8pXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXJlbnQgPSBlbC5wYXJlbnROb2RlO1xuICAgIHZhciBwZW5kaW5nTm9kZSA9IHBhcmVudCAmJiBwYXJlbnQuX3BlbmRpbmcgJiYgcGFyZW50Ll9wZW5kaW5nW3Zub2RlLmtleV07XG4gICAgaWYgKHBlbmRpbmdOb2RlICYmXG4gICAgICBwZW5kaW5nTm9kZS5jb250ZXh0ID09PSB2bm9kZS5jb250ZXh0ICYmXG4gICAgICBwZW5kaW5nTm9kZS50YWcgPT09IHZub2RlLnRhZyAmJlxuICAgICAgcGVuZGluZ05vZGUuZWxtLl9sZWF2ZUNiXG4gICAgKSB7XG4gICAgICBwZW5kaW5nTm9kZS5lbG0uX2xlYXZlQ2IoKTtcbiAgICB9XG4gICAgZW50ZXJIb29rICYmIGVudGVySG9vayhlbCwgY2IpO1xuXG4gICAgaWYgKG5lZWRBbmltYXRpb24pIHtcbiAgICAgIHZhciBhbmltYXRpb24gPSB2bm9kZS5jb250ZXh0LiRyZXF1aXJlV2VleE1vZHVsZSgnYW5pbWF0aW9uJyk7XG4gICAgICBhbmltYXRpb24udHJhbnNpdGlvbihlbC5yZWYsIHtcbiAgICAgICAgc3R5bGVzOiBlbmRTdGF0ZSxcbiAgICAgICAgZHVyYXRpb246IHRyYW5zaXRpb25Qcm9wZXJ0aWVzLmR1cmF0aW9uIHx8IDAsXG4gICAgICAgIGRlbGF5OiB0cmFuc2l0aW9uUHJvcGVydGllcy5kZWxheSB8fCAwLFxuICAgICAgICB0aW1pbmdGdW5jdGlvbjogdHJhbnNpdGlvblByb3BlcnRpZXMudGltaW5nRnVuY3Rpb24gfHwgJ2xpbmVhcidcbiAgICAgIH0sIHVzZXJXYW50c0NvbnRyb2wgPyBub29wIDogY2IpO1xuICAgIH0gZWxzZSBpZiAoIXVzZXJXYW50c0NvbnRyb2wpIHtcbiAgICAgIGNiKCk7XG4gICAgfVxuICB9LCAxNik7XG5cbiAgLy8gc3RhcnQgZW50ZXIgdHJhbnNpdGlvblxuICBiZWZvcmVFbnRlckhvb2sgJiYgYmVmb3JlRW50ZXJIb29rKGVsKTtcblxuICBpZiAoc3RhcnRTdGF0ZSkge1xuICAgIGlmICh0eXBlb2YgZWwuc2V0U3R5bGVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBlbC5zZXRTdHlsZXMoc3RhcnRTdGF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBzdGFydFN0YXRlKSB7XG4gICAgICAgIGVsLnNldFN0eWxlKGtleSwgc3RhcnRTdGF0ZVtrZXldKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoIW5lZWRBbmltYXRpb24gJiYgIXVzZXJXYW50c0NvbnRyb2wpIHtcbiAgICBjYigpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxlYXZlICh2bm9kZSwgcm0pIHtcbiAgdmFyIGVsID0gdm5vZGUuZWxtO1xuXG4gIC8vIGNhbGwgZW50ZXIgY2FsbGJhY2sgbm93XG4gIGlmIChlbC5fZW50ZXJDYikge1xuICAgIGVsLl9lbnRlckNiLmNhbmNlbGxlZCA9IHRydWU7XG4gICAgZWwuX2VudGVyQ2IoKTtcbiAgfVxuXG4gIHZhciBkYXRhID0gcmVzb2x2ZVRyYW5zaXRpb24odm5vZGUuZGF0YS50cmFuc2l0aW9uKTtcbiAgaWYgKCFkYXRhKSB7XG4gICAgcmV0dXJuIHJtKClcbiAgfVxuXG4gIGlmIChlbC5fbGVhdmVDYikge1xuICAgIHJldHVyblxuICB9XG5cbiAgdmFyIGxlYXZlQ2xhc3MgPSBkYXRhLmxlYXZlQ2xhc3M7XG4gIHZhciBsZWF2ZVRvQ2xhc3MgPSBkYXRhLmxlYXZlVG9DbGFzcztcbiAgdmFyIGxlYXZlQWN0aXZlQ2xhc3MgPSBkYXRhLmxlYXZlQWN0aXZlQ2xhc3M7XG4gIHZhciBiZWZvcmVMZWF2ZSA9IGRhdGEuYmVmb3JlTGVhdmU7XG4gIHZhciBsZWF2ZSA9IGRhdGEubGVhdmU7XG4gIHZhciBhZnRlckxlYXZlID0gZGF0YS5hZnRlckxlYXZlO1xuICB2YXIgbGVhdmVDYW5jZWxsZWQgPSBkYXRhLmxlYXZlQ2FuY2VsbGVkO1xuICB2YXIgZGVsYXlMZWF2ZSA9IGRhdGEuZGVsYXlMZWF2ZTtcblxuICB2YXIgdXNlcldhbnRzQ29udHJvbCA9XG4gICAgbGVhdmUgJiZcbiAgICAvLyBsZWF2ZSBob29rIG1heSBiZSBhIGJvdW5kIG1ldGhvZCB3aGljaCBleHBvc2VzXG4gICAgLy8gdGhlIGxlbmd0aCBvZiBvcmlnaW5hbCBmbiBhcyBfbGVuZ3RoXG4gICAgKGxlYXZlLl9sZW5ndGggfHwgbGVhdmUubGVuZ3RoKSA+IDE7XG5cbiAgdmFyIHN0eWxlc2hlZXQgPSB2bm9kZS5jb250ZXh0LiRvcHRpb25zLnN0eWxlIHx8IHt9O1xuICB2YXIgc3RhcnRTdGF0ZSA9IHN0eWxlc2hlZXRbbGVhdmVDbGFzc107XG4gIHZhciBlbmRTdGF0ZSA9IHN0eWxlc2hlZXRbbGVhdmVUb0NsYXNzXSB8fCBzdHlsZXNoZWV0W2xlYXZlQWN0aXZlQ2xhc3NdO1xuICB2YXIgdHJhbnNpdGlvblByb3BlcnRpZXMgPSAoc3R5bGVzaGVldFsnQFRSQU5TSVRJT04nXSAmJiBzdHlsZXNoZWV0WydAVFJBTlNJVElPTiddW2xlYXZlQWN0aXZlQ2xhc3NdKSB8fCB7fTtcblxuICB2YXIgY2IgPSBlbC5fbGVhdmVDYiA9IG9uY2UoZnVuY3Rpb24gKCkge1xuICAgIGlmIChlbC5wYXJlbnROb2RlICYmIGVsLnBhcmVudE5vZGUuX3BlbmRpbmcpIHtcbiAgICAgIGVsLnBhcmVudE5vZGUuX3BlbmRpbmdbdm5vZGUua2V5XSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChjYi5jYW5jZWxsZWQpIHtcbiAgICAgIGxlYXZlQ2FuY2VsbGVkICYmIGxlYXZlQ2FuY2VsbGVkKGVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcm0oKTtcbiAgICAgIGFmdGVyTGVhdmUgJiYgYWZ0ZXJMZWF2ZShlbCk7XG4gICAgfVxuICAgIGVsLl9sZWF2ZUNiID0gbnVsbDtcbiAgfSk7XG5cbiAgaWYgKGRlbGF5TGVhdmUpIHtcbiAgICBkZWxheUxlYXZlKHBlcmZvcm1MZWF2ZSk7XG4gIH0gZWxzZSB7XG4gICAgcGVyZm9ybUxlYXZlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBwZXJmb3JtTGVhdmUgKCkge1xuICAgIHZhciBhbmltYXRpb24gPSB2bm9kZS5jb250ZXh0LiRyZXF1aXJlV2VleE1vZHVsZSgnYW5pbWF0aW9uJyk7XG4gICAgLy8gdGhlIGRlbGF5ZWQgbGVhdmUgbWF5IGhhdmUgYWxyZWFkeSBiZWVuIGNhbmNlbGxlZFxuICAgIGlmIChjYi5jYW5jZWxsZWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyByZWNvcmQgbGVhdmluZyBlbGVtZW50XG4gICAgaWYgKCF2bm9kZS5kYXRhLnNob3cpIHtcbiAgICAgIChlbC5wYXJlbnROb2RlLl9wZW5kaW5nIHx8IChlbC5wYXJlbnROb2RlLl9wZW5kaW5nID0ge30pKVt2bm9kZS5rZXldID0gdm5vZGU7XG4gICAgfVxuICAgIGJlZm9yZUxlYXZlICYmIGJlZm9yZUxlYXZlKGVsKTtcblxuICAgIGlmIChzdGFydFN0YXRlKSB7XG4gICAgICBhbmltYXRpb24udHJhbnNpdGlvbihlbC5yZWYsIHtcbiAgICAgICAgc3R5bGVzOiBzdGFydFN0YXRlXG4gICAgICB9LCBuZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5leHQgKCkge1xuICAgICAgYW5pbWF0aW9uLnRyYW5zaXRpb24oZWwucmVmLCB7XG4gICAgICAgIHN0eWxlczogZW5kU3RhdGUsXG4gICAgICAgIGR1cmF0aW9uOiB0cmFuc2l0aW9uUHJvcGVydGllcy5kdXJhdGlvbiB8fCAwLFxuICAgICAgICBkZWxheTogdHJhbnNpdGlvblByb3BlcnRpZXMuZGVsYXkgfHwgMCxcbiAgICAgICAgdGltaW5nRnVuY3Rpb246IHRyYW5zaXRpb25Qcm9wZXJ0aWVzLnRpbWluZ0Z1bmN0aW9uIHx8ICdsaW5lYXInXG4gICAgICB9LCB1c2VyV2FudHNDb250cm9sID8gbm9vcCA6IGNiKTtcbiAgICB9XG5cbiAgICBsZWF2ZSAmJiBsZWF2ZShlbCwgY2IpO1xuICAgIGlmICghZW5kU3RhdGUgJiYgIXVzZXJXYW50c0NvbnRyb2wpIHtcbiAgICAgIGNiKCk7XG4gICAgfVxuICB9XG59XG5cbi8vIGRldGVybWluZSB0aGUgdGFyZ2V0IGFuaW1hdGlvbiBzdHlsZSBmb3IgYW4gZW50ZXJpbmcgdHJhbnNpdGlvbi5cbmZ1bmN0aW9uIGdldEVudGVyVGFyZ2V0U3RhdGUgKGVsLCBzdHlsZXNoZWV0LCBzdGFydENsYXNzLCBlbmRDbGFzcywgYWN0aXZlQ2xhc3MsIHZtKSB7XG4gIHZhciB0YXJnZXRTdGF0ZSA9IHt9O1xuICB2YXIgc3RhcnRTdGF0ZSA9IHN0eWxlc2hlZXRbc3RhcnRDbGFzc107XG4gIHZhciBlbmRTdGF0ZSA9IHN0eWxlc2hlZXRbZW5kQ2xhc3NdO1xuICB2YXIgYWN0aXZlU3RhdGUgPSBzdHlsZXNoZWV0W2FjdGl2ZUNsYXNzXTtcbiAgLy8gMS4gZmFsbGJhY2sgdG8gZWxlbWVudCdzIGRlZmF1bHQgc3R5bGluZ1xuICBpZiAoc3RhcnRTdGF0ZSkge1xuICAgIGZvciAodmFyIGtleSBpbiBzdGFydFN0YXRlKSB7XG4gICAgICB0YXJnZXRTdGF0ZVtrZXldID0gZWwuc3R5bGVba2V5XTtcbiAgICAgIGlmIChcbiAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJlxuICAgICAgICB0YXJnZXRTdGF0ZVtrZXldID09IG51bGwgJiZcbiAgICAgICAgKCFhY3RpdmVTdGF0ZSB8fCBhY3RpdmVTdGF0ZVtrZXldID09IG51bGwpICYmXG4gICAgICAgICghZW5kU3RhdGUgfHwgZW5kU3RhdGVba2V5XSA9PSBudWxsKVxuICAgICAgKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgXCJ0cmFuc2l0aW9uIHByb3BlcnR5IFxcXCJcIiArIGtleSArIFwiXFxcIiBpcyBkZWNsYXJlZCBpbiBlbnRlciBzdGFydGluZyBjbGFzcyAoLlwiICsgc3RhcnRDbGFzcyArIFwiKSwgXCIgK1xuICAgICAgICAgIFwiYnV0IG5vdCBkZWNsYXJlZCBhbnl3aGVyZSBpbiBlbnRlciBlbmRpbmcgY2xhc3MgKC5cIiArIGVuZENsYXNzICsgXCIpLCBcIiArXG4gICAgICAgICAgXCJlbnRlciBhY3RpdmUgY2FzcyAoLlwiICsgYWN0aXZlQ2xhc3MgKyBcIikgb3IgdGhlIGVsZW1lbnQncyBkZWZhdWx0IHN0eWxpbmcuIFwiICtcbiAgICAgICAgICBcIk5vdGUgaW4gV2VleCwgQ1NTIHByb3BlcnRpZXMgbmVlZCBleHBsaWNpdCB2YWx1ZXMgdG8gYmUgdHJhbnNpdGlvbmFibGUuXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gMi4gaWYgc3RhdGUgaXMgbWl4ZWQgaW4gYWN0aXZlIHN0YXRlLCBleHRyYWN0IHRoZW0gd2hpbGUgZXhjbHVkaW5nXG4gIC8vICAgIHRyYW5zaXRpb24gcHJvcGVydGllc1xuICBpZiAoYWN0aXZlU3RhdGUpIHtcbiAgICBmb3IgKHZhciBrZXkkMSBpbiBhY3RpdmVTdGF0ZSkge1xuICAgICAgaWYgKGtleSQxLmluZGV4T2YoJ3RyYW5zaXRpb24nKSAhPT0gMCkge1xuICAgICAgICB0YXJnZXRTdGF0ZVtrZXkkMV0gPSBhY3RpdmVTdGF0ZVtrZXkkMV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIDMuIGV4cGxpY2l0IGVuZFN0YXRlIGhhcyBoaWdoZXN0IHByaW9yaXR5XG4gIGlmIChlbmRTdGF0ZSkge1xuICAgIGV4dGVuZCh0YXJnZXRTdGF0ZSwgZW5kU3RhdGUpO1xuICB9XG4gIHJldHVybiB0YXJnZXRTdGF0ZVxufVxuXG52YXIgcGxhdGZvcm1Nb2R1bGVzID0gW1xuICBhdHRycyxcbiAga2xhc3MsXG4gIGV2ZW50cyxcbiAgc3R5bGUsXG4gIHRyYW5zaXRpb25cbl07XG5cbi8qICAqL1xuXG4vLyB0aGUgZGlyZWN0aXZlIG1vZHVsZSBzaG91bGQgYmUgYXBwbGllZCBsYXN0LCBhZnRlciBhbGxcbi8vIGJ1aWx0LWluIG1vZHVsZXMgaGF2ZSBiZWVuIGFwcGxpZWQuXG52YXIgbW9kdWxlcyA9IHBsYXRmb3JtTW9kdWxlcy5jb25jYXQoYmFzZU1vZHVsZXMpO1xuXG52YXIgcGF0Y2ggPSBjcmVhdGVQYXRjaEZ1bmN0aW9uKHtcbiAgbm9kZU9wczogbm9kZU9wcyxcbiAgbW9kdWxlczogbW9kdWxlcyxcbiAgTE9OR19MSVNUX1RIUkVTSE9MRDogMTBcbn0pO1xuXG52YXIgcGxhdGZvcm1EaXJlY3RpdmVzID0ge1xufTtcblxuLyogICovXG5cbmZ1bmN0aW9uIGdldFZOb2RlVHlwZSAodm5vZGUpIHtcbiAgaWYgKCF2bm9kZS50YWcpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuICByZXR1cm4gdm5vZGUudGFnLnJlcGxhY2UoL3Z1ZVxcLWNvbXBvbmVudFxcLShcXGQrXFwtKT8vLCAnJylcbn1cblxuZnVuY3Rpb24gaXNTaW1wbGVTcGFuICh2bm9kZSkge1xuICByZXR1cm4gdm5vZGUuY2hpbGRyZW4gJiZcbiAgICB2bm9kZS5jaGlsZHJlbi5sZW5ndGggPT09IDEgJiZcbiAgICAhdm5vZGUuY2hpbGRyZW5bMF0udGFnXG59XG5cbmZ1bmN0aW9uIHBhcnNlU3R5bGUgKHZub2RlKSB7XG4gIGlmICghdm5vZGUgfHwgIXZub2RlLmRhdGEpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgcmVmID0gdm5vZGUuZGF0YTtcbiAgdmFyIHN0YXRpY1N0eWxlID0gcmVmLnN0YXRpY1N0eWxlO1xuICB2YXIgc3RhdGljQ2xhc3MgPSByZWYuc3RhdGljQ2xhc3M7XG4gIGlmICh2bm9kZS5kYXRhLnN0eWxlIHx8IHZub2RlLmRhdGEuY2xhc3MgfHwgc3RhdGljU3R5bGUgfHwgc3RhdGljQ2xhc3MpIHtcbiAgICB2YXIgc3R5bGVzID0gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGljU3R5bGUsIHZub2RlLmRhdGEuc3R5bGUpO1xuICAgIHZhciBjc3NNYXAgPSB2bm9kZS5jb250ZXh0LiRvcHRpb25zLnN0eWxlIHx8IHt9O1xuICAgIHZhciBjbGFzc0xpc3QgPSBbXS5jb25jYXQoc3RhdGljQ2xhc3MsIHZub2RlLmRhdGEuY2xhc3MpO1xuICAgIGNsYXNzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICBpZiAobmFtZSAmJiBjc3NNYXBbbmFtZV0pIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihzdHlsZXMsIGNzc01hcFtuYW1lXSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0eWxlc1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRWTm9kZUNoaWxkcmVuIChjaGlsZHJlbikge1xuICBpZiAoIWNoaWxkcmVuLmxlbmd0aCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgcmV0dXJuIGNoaWxkcmVuLm1hcChmdW5jdGlvbiAodm5vZGUpIHtcbiAgICB2YXIgdHlwZSA9IGdldFZOb2RlVHlwZSh2bm9kZSk7XG4gICAgdmFyIHByb3BzID0geyB0eXBlOiB0eXBlIH07XG5cbiAgICAvLyBjb252ZXJ0IHJhdyB0ZXh0IG5vZGVcbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIHByb3BzLnR5cGUgPSAnc3Bhbic7XG4gICAgICBwcm9wcy5hdHRyID0ge1xuICAgICAgICB2YWx1ZTogKHZub2RlLnRleHQgfHwgJycpLnRyaW0oKVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcHMuc3R5bGUgPSBwYXJzZVN0eWxlKHZub2RlKTtcbiAgICAgIGlmICh2bm9kZS5kYXRhKSB7XG4gICAgICAgIHByb3BzLmF0dHIgPSB2bm9kZS5kYXRhLmF0dHJzO1xuICAgICAgICBpZiAodm5vZGUuZGF0YS5vbikge1xuICAgICAgICAgIHByb3BzLmV2ZW50cyA9IHZub2RlLmRhdGEub247XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0eXBlID09PSAnc3BhbicgJiYgaXNTaW1wbGVTcGFuKHZub2RlKSkge1xuICAgICAgICBwcm9wcy5hdHRyID0gcHJvcHMuYXR0ciB8fCB7fTtcbiAgICAgICAgcHJvcHMuYXR0ci52YWx1ZSA9IHZub2RlLmNoaWxkcmVuWzBdLnRleHQudHJpbSgpO1xuICAgICAgICByZXR1cm4gcHJvcHNcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodm5vZGUuY2hpbGRyZW4gJiYgdm5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICBwcm9wcy5jaGlsZHJlbiA9IGNvbnZlcnRWTm9kZUNoaWxkcmVuKHZub2RlLmNoaWxkcmVuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvcHNcbiAgfSlcbn1cblxudmFyIFJpY2h0ZXh0ID0ge1xuICBuYW1lOiAncmljaHRleHQnLFxuICByZW5kZXI6IGZ1bmN0aW9uIHJlbmRlciAoaCkge1xuICAgIHJldHVybiBoKCd3ZWV4OnJpY2h0ZXh0Jywge1xuICAgICAgb246IHRoaXMuX2V2ZW50cyxcbiAgICAgIGF0dHJzOiB7XG4gICAgICAgIHZhbHVlOiBjb252ZXJ0Vk5vZGVDaGlsZHJlbih0aGlzLiRvcHRpb25zLl9yZW5kZXJDaGlsZHJlbiB8fCBbXSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG59O1xuXG4vKiAgKi9cblxuLy8gUHJvdmlkZXMgdHJhbnNpdGlvbiBzdXBwb3J0IGZvciBhIHNpbmdsZSBlbGVtZW50L2NvbXBvbmVudC5cbi8vIHN1cHBvcnRzIHRyYW5zaXRpb24gbW9kZSAob3V0LWluIC8gaW4tb3V0KVxuXG52YXIgdHJhbnNpdGlvblByb3BzID0ge1xuICBuYW1lOiBTdHJpbmcsXG4gIGFwcGVhcjogQm9vbGVhbixcbiAgY3NzOiBCb29sZWFuLFxuICBtb2RlOiBTdHJpbmcsXG4gIHR5cGU6IFN0cmluZyxcbiAgZW50ZXJDbGFzczogU3RyaW5nLFxuICBsZWF2ZUNsYXNzOiBTdHJpbmcsXG4gIGVudGVyVG9DbGFzczogU3RyaW5nLFxuICBsZWF2ZVRvQ2xhc3M6IFN0cmluZyxcbiAgZW50ZXJBY3RpdmVDbGFzczogU3RyaW5nLFxuICBsZWF2ZUFjdGl2ZUNsYXNzOiBTdHJpbmcsXG4gIGFwcGVhckNsYXNzOiBTdHJpbmcsXG4gIGFwcGVhckFjdGl2ZUNsYXNzOiBTdHJpbmcsXG4gIGFwcGVhclRvQ2xhc3M6IFN0cmluZyxcbiAgZHVyYXRpb246IFtOdW1iZXIsIFN0cmluZywgT2JqZWN0XVxufTtcblxuLy8gaW4gY2FzZSB0aGUgY2hpbGQgaXMgYWxzbyBhbiBhYnN0cmFjdCBjb21wb25lbnQsIGUuZy4gPGtlZXAtYWxpdmU+XG4vLyB3ZSB3YW50IHRvIHJlY3Vyc2l2ZWx5IHJldHJpZXZlIHRoZSByZWFsIGNvbXBvbmVudCB0byBiZSByZW5kZXJlZFxuZnVuY3Rpb24gZ2V0UmVhbENoaWxkICh2bm9kZSkge1xuICB2YXIgY29tcE9wdGlvbnMgPSB2bm9kZSAmJiB2bm9kZS5jb21wb25lbnRPcHRpb25zO1xuICBpZiAoY29tcE9wdGlvbnMgJiYgY29tcE9wdGlvbnMuQ3Rvci5vcHRpb25zLmFic3RyYWN0KSB7XG4gICAgcmV0dXJuIGdldFJlYWxDaGlsZChnZXRGaXJzdENvbXBvbmVudENoaWxkKGNvbXBPcHRpb25zLmNoaWxkcmVuKSlcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdm5vZGVcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0VHJhbnNpdGlvbkRhdGEgKGNvbXApIHtcbiAgdmFyIGRhdGEgPSB7fTtcbiAgdmFyIG9wdGlvbnMgPSBjb21wLiRvcHRpb25zO1xuICAvLyBwcm9wc1xuICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucy5wcm9wc0RhdGEpIHtcbiAgICBkYXRhW2tleV0gPSBjb21wW2tleV07XG4gIH1cbiAgLy8gZXZlbnRzLlxuICAvLyBleHRyYWN0IGxpc3RlbmVycyBhbmQgcGFzcyB0aGVtIGRpcmVjdGx5IHRvIHRoZSB0cmFuc2l0aW9uIG1ldGhvZHNcbiAgdmFyIGxpc3RlbmVycyA9IG9wdGlvbnMuX3BhcmVudExpc3RlbmVycztcbiAgZm9yICh2YXIga2V5JDEgaW4gbGlzdGVuZXJzKSB7XG4gICAgZGF0YVtjYW1lbGl6ZShrZXkkMSldID0gbGlzdGVuZXJzW2tleSQxXTtcbiAgfVxuICByZXR1cm4gZGF0YVxufVxuXG5mdW5jdGlvbiBwbGFjZWhvbGRlciAoaCwgcmF3Q2hpbGQpIHtcbiAgaWYgKC9cXGQta2VlcC1hbGl2ZSQvLnRlc3QocmF3Q2hpbGQudGFnKSkge1xuICAgIHJldHVybiBoKCdrZWVwLWFsaXZlJywge1xuICAgICAgcHJvcHM6IHJhd0NoaWxkLmNvbXBvbmVudE9wdGlvbnMucHJvcHNEYXRhXG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNQYXJlbnRUcmFuc2l0aW9uICh2bm9kZSkge1xuICB3aGlsZSAoKHZub2RlID0gdm5vZGUucGFyZW50KSkge1xuICAgIGlmICh2bm9kZS5kYXRhLnRyYW5zaXRpb24pIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzU2FtZUNoaWxkIChjaGlsZCwgb2xkQ2hpbGQpIHtcbiAgcmV0dXJuIG9sZENoaWxkLmtleSA9PT0gY2hpbGQua2V5ICYmIG9sZENoaWxkLnRhZyA9PT0gY2hpbGQudGFnXG59XG5cbnZhciBUcmFuc2l0aW9uJDEgPSB7XG4gIG5hbWU6ICd0cmFuc2l0aW9uJyxcbiAgcHJvcHM6IHRyYW5zaXRpb25Qcm9wcyxcbiAgYWJzdHJhY3Q6IHRydWUsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIgKGgpIHtcbiAgICB2YXIgdGhpcyQxID0gdGhpcztcblxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuJHNsb3RzLmRlZmF1bHQ7XG4gICAgaWYgKCFjaGlsZHJlbikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gZmlsdGVyIG91dCB0ZXh0IG5vZGVzIChwb3NzaWJsZSB3aGl0ZXNwYWNlcylcbiAgICBjaGlsZHJlbiA9IGNoaWxkcmVuLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy50YWcgfHwgaXNBc3luY1BsYWNlaG9sZGVyKGMpOyB9KTtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAoIWNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gd2FybiBtdWx0aXBsZSBlbGVtZW50c1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGNoaWxkcmVuLmxlbmd0aCA+IDEpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgICc8dHJhbnNpdGlvbj4gY2FuIG9ubHkgYmUgdXNlZCBvbiBhIHNpbmdsZSBlbGVtZW50LiBVc2UgJyArXG4gICAgICAgICc8dHJhbnNpdGlvbi1ncm91cD4gZm9yIGxpc3RzLicsXG4gICAgICAgIHRoaXMuJHBhcmVudFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB2YXIgbW9kZSA9IHRoaXMubW9kZTtcblxuICAgIC8vIHdhcm4gaW52YWxpZCBtb2RlXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiZcbiAgICAgIG1vZGUgJiYgbW9kZSAhPT0gJ2luLW91dCcgJiYgbW9kZSAhPT0gJ291dC1pbidcbiAgICApIHtcbiAgICAgIHdhcm4oXG4gICAgICAgICdpbnZhbGlkIDx0cmFuc2l0aW9uPiBtb2RlOiAnICsgbW9kZSxcbiAgICAgICAgdGhpcy4kcGFyZW50XG4gICAgICApO1xuICAgIH1cblxuICAgIHZhciByYXdDaGlsZCA9IGNoaWxkcmVuWzBdO1xuXG4gICAgLy8gaWYgdGhpcyBpcyBhIGNvbXBvbmVudCByb290IG5vZGUgYW5kIHRoZSBjb21wb25lbnQnc1xuICAgIC8vIHBhcmVudCBjb250YWluZXIgbm9kZSBhbHNvIGhhcyB0cmFuc2l0aW9uLCBza2lwLlxuICAgIGlmIChoYXNQYXJlbnRUcmFuc2l0aW9uKHRoaXMuJHZub2RlKSkge1xuICAgICAgcmV0dXJuIHJhd0NoaWxkXG4gICAgfVxuXG4gICAgLy8gYXBwbHkgdHJhbnNpdGlvbiBkYXRhIHRvIGNoaWxkXG4gICAgLy8gdXNlIGdldFJlYWxDaGlsZCgpIHRvIGlnbm9yZSBhYnN0cmFjdCBjb21wb25lbnRzIGUuZy4ga2VlcC1hbGl2ZVxuICAgIHZhciBjaGlsZCA9IGdldFJlYWxDaGlsZChyYXdDaGlsZCk7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCFjaGlsZCkge1xuICAgICAgcmV0dXJuIHJhd0NoaWxkXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xlYXZpbmcpIHtcbiAgICAgIHJldHVybiBwbGFjZWhvbGRlcihoLCByYXdDaGlsZClcbiAgICB9XG5cbiAgICAvLyBlbnN1cmUgYSBrZXkgdGhhdCBpcyB1bmlxdWUgdG8gdGhlIHZub2RlIHR5cGUgYW5kIHRvIHRoaXMgdHJhbnNpdGlvblxuICAgIC8vIGNvbXBvbmVudCBpbnN0YW5jZS4gVGhpcyBrZXkgd2lsbCBiZSB1c2VkIHRvIHJlbW92ZSBwZW5kaW5nIGxlYXZpbmcgbm9kZXNcbiAgICAvLyBkdXJpbmcgZW50ZXJpbmcuXG4gICAgdmFyIGlkID0gXCJfX3RyYW5zaXRpb24tXCIgKyAodGhpcy5fdWlkKSArIFwiLVwiO1xuICAgIGNoaWxkLmtleSA9IGNoaWxkLmtleSA9PSBudWxsXG4gICAgICA/IGNoaWxkLmlzQ29tbWVudFxuICAgICAgICA/IGlkICsgJ2NvbW1lbnQnXG4gICAgICAgIDogaWQgKyBjaGlsZC50YWdcbiAgICAgIDogaXNQcmltaXRpdmUoY2hpbGQua2V5KVxuICAgICAgICA/IChTdHJpbmcoY2hpbGQua2V5KS5pbmRleE9mKGlkKSA9PT0gMCA/IGNoaWxkLmtleSA6IGlkICsgY2hpbGQua2V5KVxuICAgICAgICA6IGNoaWxkLmtleTtcblxuICAgIHZhciBkYXRhID0gKGNoaWxkLmRhdGEgfHwgKGNoaWxkLmRhdGEgPSB7fSkpLnRyYW5zaXRpb24gPSBleHRyYWN0VHJhbnNpdGlvbkRhdGEodGhpcyk7XG4gICAgdmFyIG9sZFJhd0NoaWxkID0gdGhpcy5fdm5vZGU7XG4gICAgdmFyIG9sZENoaWxkID0gZ2V0UmVhbENoaWxkKG9sZFJhd0NoaWxkKTtcblxuICAgIC8vIG1hcmsgdi1zaG93XG4gICAgLy8gc28gdGhhdCB0aGUgdHJhbnNpdGlvbiBtb2R1bGUgY2FuIGhhbmQgb3ZlciB0aGUgY29udHJvbCB0byB0aGUgZGlyZWN0aXZlXG4gICAgaWYgKGNoaWxkLmRhdGEuZGlyZWN0aXZlcyAmJiBjaGlsZC5kYXRhLmRpcmVjdGl2ZXMuc29tZShmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5uYW1lID09PSAnc2hvdyc7IH0pKSB7XG4gICAgICBjaGlsZC5kYXRhLnNob3cgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIG9sZENoaWxkICYmXG4gICAgICBvbGRDaGlsZC5kYXRhICYmXG4gICAgICAhaXNTYW1lQ2hpbGQoY2hpbGQsIG9sZENoaWxkKSAmJlxuICAgICAgIWlzQXN5bmNQbGFjZWhvbGRlcihvbGRDaGlsZCkgJiZcbiAgICAgIC8vICM2Njg3IGNvbXBvbmVudCByb290IGlzIGEgY29tbWVudCBub2RlXG4gICAgICAhKG9sZENoaWxkLmNvbXBvbmVudEluc3RhbmNlICYmIG9sZENoaWxkLmNvbXBvbmVudEluc3RhbmNlLl92bm9kZS5pc0NvbW1lbnQpXG4gICAgKSB7XG4gICAgICAvLyByZXBsYWNlIG9sZCBjaGlsZCB0cmFuc2l0aW9uIGRhdGEgd2l0aCBmcmVzaCBvbmVcbiAgICAgIC8vIGltcG9ydGFudCBmb3IgZHluYW1pYyB0cmFuc2l0aW9ucyFcbiAgICAgIHZhciBvbGREYXRhID0gb2xkQ2hpbGQuZGF0YS50cmFuc2l0aW9uID0gZXh0ZW5kKHt9LCBkYXRhKTtcbiAgICAgIC8vIGhhbmRsZSB0cmFuc2l0aW9uIG1vZGVcbiAgICAgIGlmIChtb2RlID09PSAnb3V0LWluJykge1xuICAgICAgICAvLyByZXR1cm4gcGxhY2Vob2xkZXIgbm9kZSBhbmQgcXVldWUgdXBkYXRlIHdoZW4gbGVhdmUgZmluaXNoZXNcbiAgICAgICAgdGhpcy5fbGVhdmluZyA9IHRydWU7XG4gICAgICAgIG1lcmdlVk5vZGVIb29rKG9sZERhdGEsICdhZnRlckxlYXZlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMkMS5fbGVhdmluZyA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMkMS4kZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwbGFjZWhvbGRlcihoLCByYXdDaGlsZClcbiAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gJ2luLW91dCcpIHtcbiAgICAgICAgaWYgKGlzQXN5bmNQbGFjZWhvbGRlcihjaGlsZCkpIHtcbiAgICAgICAgICByZXR1cm4gb2xkUmF3Q2hpbGRcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGVsYXllZExlYXZlO1xuICAgICAgICB2YXIgcGVyZm9ybUxlYXZlID0gZnVuY3Rpb24gKCkgeyBkZWxheWVkTGVhdmUoKTsgfTtcbiAgICAgICAgbWVyZ2VWTm9kZUhvb2soZGF0YSwgJ2FmdGVyRW50ZXInLCBwZXJmb3JtTGVhdmUpO1xuICAgICAgICBtZXJnZVZOb2RlSG9vayhkYXRhLCAnZW50ZXJDYW5jZWxsZWQnLCBwZXJmb3JtTGVhdmUpO1xuICAgICAgICBtZXJnZVZOb2RlSG9vayhvbGREYXRhLCAnZGVsYXlMZWF2ZScsIGZ1bmN0aW9uIChsZWF2ZSkgeyBkZWxheWVkTGVhdmUgPSBsZWF2ZTsgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhd0NoaWxkXG4gIH1cbn07XG5cbi8vIHJldXNlIHNhbWUgdHJhbnNpdGlvbiBjb21wb25lbnQgbG9naWMgZnJvbSB3ZWJcblxudmFyIHByb3BzID0gZXh0ZW5kKHtcbiAgdGFnOiBTdHJpbmcsXG4gIG1vdmVDbGFzczogU3RyaW5nXG59LCB0cmFuc2l0aW9uUHJvcHMpO1xuXG5kZWxldGUgcHJvcHMubW9kZTtcblxudmFyIFRyYW5zaXRpb25Hcm91cCA9IHtcbiAgcHJvcHM6IHByb3BzLFxuXG4gIGNyZWF0ZWQ6IGZ1bmN0aW9uIGNyZWF0ZWQgKCkge1xuICAgIHZhciBkb20gPSB0aGlzLiRyZXF1aXJlV2VleE1vZHVsZSgnZG9tJyk7XG4gICAgdGhpcy5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgZG9tLmdldENvbXBvbmVudFJlY3QoZWwucmVmLCBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIGlmICghcmVzLnJlc3VsdCkge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoKFwiZmFpbGVkIHRvIGdldCByZWN0IGZvciBlbGVtZW50OiBcIiArIChlbC50YWcpKSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUocmVzLnNpemUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTsgfTtcblxuICAgIHZhciBhbmltYXRpb24gPSB0aGlzLiRyZXF1aXJlV2VleE1vZHVsZSgnYW5pbWF0aW9uJyk7XG4gICAgdGhpcy5hbmltYXRlID0gZnVuY3Rpb24gKGVsLCBvcHRpb25zKSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgYW5pbWF0aW9uLnRyYW5zaXRpb24oZWwucmVmLCBvcHRpb25zLCByZXNvbHZlKTtcbiAgICB9KTsgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uIHJlbmRlciAoaCkge1xuICAgIHZhciB0YWcgPSB0aGlzLnRhZyB8fCB0aGlzLiR2bm9kZS5kYXRhLnRhZyB8fCAnc3Bhbic7XG4gICAgdmFyIG1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdmFyIHByZXZDaGlsZHJlbiA9IHRoaXMucHJldkNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICB2YXIgcmF3Q2hpbGRyZW4gPSB0aGlzLiRzbG90cy5kZWZhdWx0IHx8IFtdO1xuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4gPSBbXTtcbiAgICB2YXIgdHJhbnNpdGlvbkRhdGEgPSBleHRyYWN0VHJhbnNpdGlvbkRhdGEodGhpcyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhd0NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IHJhd0NoaWxkcmVuW2ldO1xuICAgICAgaWYgKGMudGFnKSB7XG4gICAgICAgIGlmIChjLmtleSAhPSBudWxsICYmIFN0cmluZyhjLmtleSkuaW5kZXhPZignX192bGlzdCcpICE9PSAwKSB7XG4gICAgICAgICAgY2hpbGRyZW4ucHVzaChjKTtcbiAgICAgICAgICBtYXBbYy5rZXldID0gY1xuICAgICAgICAgIDsoYy5kYXRhIHx8IChjLmRhdGEgPSB7fSkpLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uRGF0YTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgdmFyIG9wdHMgPSBjLmNvbXBvbmVudE9wdGlvbnM7XG4gICAgICAgICAgdmFyIG5hbWUgPSBvcHRzXG4gICAgICAgICAgICA/IChvcHRzLkN0b3Iub3B0aW9ucy5uYW1lIHx8IG9wdHMudGFnKVxuICAgICAgICAgICAgOiBjLnRhZztcbiAgICAgICAgICB3YXJuKChcIjx0cmFuc2l0aW9uLWdyb3VwPiBjaGlsZHJlbiBtdXN0IGJlIGtleWVkOiA8XCIgKyBuYW1lICsgXCI+XCIpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwcmV2Q2hpbGRyZW4pIHtcbiAgICAgIHZhciBrZXB0ID0gW107XG4gICAgICB2YXIgcmVtb3ZlZCA9IFtdO1xuICAgICAgcHJldkNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgYy5kYXRhLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uRGF0YTtcblxuICAgICAgICAvLyBUT0RPOiByZWNvcmQgYmVmb3JlIHBhdGNoIHBvc2l0aW9uc1xuXG4gICAgICAgIGlmIChtYXBbYy5rZXldKSB7XG4gICAgICAgICAga2VwdC5wdXNoKGMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlbW92ZWQucHVzaChjKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLmtlcHQgPSBoKHRhZywgbnVsbCwga2VwdCk7XG4gICAgICB0aGlzLnJlbW92ZWQgPSByZW1vdmVkO1xuICAgIH1cblxuICAgIHJldHVybiBoKHRhZywgbnVsbCwgY2hpbGRyZW4pXG4gIH0sXG5cbiAgYmVmb3JlVXBkYXRlOiBmdW5jdGlvbiBiZWZvcmVVcGRhdGUgKCkge1xuICAgIC8vIGZvcmNlIHJlbW92aW5nIHBhc3NcbiAgICB0aGlzLl9fcGF0Y2hfXyhcbiAgICAgIHRoaXMuX3Zub2RlLFxuICAgICAgdGhpcy5rZXB0LFxuICAgICAgZmFsc2UsIC8vIGh5ZHJhdGluZ1xuICAgICAgdHJ1ZSAvLyByZW1vdmVPbmx5ICghaW1wb3J0YW50IGF2b2lkcyB1bm5lY2Vzc2FyeSBtb3ZlcylcbiAgICApO1xuICAgIHRoaXMuX3Zub2RlID0gdGhpcy5rZXB0O1xuICB9LFxuXG4gIHVwZGF0ZWQ6IGZ1bmN0aW9uIHVwZGF0ZWQgKCkge1xuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMucHJldkNoaWxkcmVuO1xuICAgIHZhciBtb3ZlQ2xhc3MgPSB0aGlzLm1vdmVDbGFzcyB8fCAoKHRoaXMubmFtZSB8fCAndicpICsgJy1tb3ZlJyk7XG4gICAgdmFyIG1vdmVEYXRhID0gY2hpbGRyZW4ubGVuZ3RoICYmIHRoaXMuZ2V0TW92ZURhdGEoY2hpbGRyZW5bMF0uY29udGV4dCwgbW92ZUNsYXNzKTtcbiAgICBpZiAoIW1vdmVEYXRhKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBUT0RPOiBmaW5pc2ggaW1wbGVtZW50aW5nIG1vdmUgYW5pbWF0aW9ucyBvbmNlXG4gICAgLy8gd2UgaGF2ZSBhY2Nlc3MgdG8gc3luYyBnZXRDb21wb25lbnRSZWN0KClcblxuICAgIC8vIGNoaWxkcmVuLmZvckVhY2goY2FsbFBlbmRpbmdDYnMpXG5cbiAgICAvLyBQcm9taXNlLmFsbChjaGlsZHJlbi5tYXAoYyA9PiB7XG4gICAgLy8gICBjb25zdCBvbGRQb3MgPSBjLmRhdGEucG9zXG4gICAgLy8gICBjb25zdCBuZXdQb3MgPSBjLmRhdGEubmV3UG9zXG4gICAgLy8gICBjb25zdCBkeCA9IG9sZFBvcy5sZWZ0IC0gbmV3UG9zLmxlZnRcbiAgICAvLyAgIGNvbnN0IGR5ID0gb2xkUG9zLnRvcCAtIG5ld1Bvcy50b3BcbiAgICAvLyAgIGlmIChkeCB8fCBkeSkge1xuICAgIC8vICAgICBjLmRhdGEubW92ZWQgPSB0cnVlXG4gICAgLy8gICAgIHJldHVybiB0aGlzLmFuaW1hdGUoYy5lbG0sIHtcbiAgICAvLyAgICAgICBzdHlsZXM6IHtcbiAgICAvLyAgICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZSgke2R4fXB4LCR7ZHl9cHgpYFxuICAgIC8vICAgICAgIH1cbiAgICAvLyAgICAgfSlcbiAgICAvLyAgIH1cbiAgICAvLyB9KSkudGhlbigoKSA9PiB7XG4gICAgLy8gICBjaGlsZHJlbi5mb3JFYWNoKGMgPT4ge1xuICAgIC8vICAgICBpZiAoYy5kYXRhLm1vdmVkKSB7XG4gICAgLy8gICAgICAgdGhpcy5hbmltYXRlKGMuZWxtLCB7XG4gICAgLy8gICAgICAgICBzdHlsZXM6IHtcbiAgICAvLyAgICAgICAgICAgdHJhbnNmb3JtOiAnJ1xuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgICAgIGR1cmF0aW9uOiBtb3ZlRGF0YS5kdXJhdGlvbiB8fCAwLFxuICAgIC8vICAgICAgICAgZGVsYXk6IG1vdmVEYXRhLmRlbGF5IHx8IDAsXG4gICAgLy8gICAgICAgICB0aW1pbmdGdW5jdGlvbjogbW92ZURhdGEudGltaW5nRnVuY3Rpb24gfHwgJ2xpbmVhcidcbiAgICAvLyAgICAgICB9KVxuICAgIC8vICAgICB9XG4gICAgLy8gICB9KVxuICAgIC8vIH0pXG4gIH0sXG5cbiAgbWV0aG9kczoge1xuICAgIGdldE1vdmVEYXRhOiBmdW5jdGlvbiBnZXRNb3ZlRGF0YSAoY29udGV4dCwgbW92ZUNsYXNzKSB7XG4gICAgICB2YXIgc3R5bGVzaGVldCA9IGNvbnRleHQuJG9wdGlvbnMuc3R5bGUgfHwge307XG4gICAgICByZXR1cm4gc3R5bGVzaGVldFsnQFRSQU5TSVRJT04nXSAmJiBzdHlsZXNoZWV0WydAVFJBTlNJVElPTiddW21vdmVDbGFzc11cbiAgICB9XG4gIH1cbn07XG5cbi8vIGZ1bmN0aW9uIGNhbGxQZW5kaW5nQ2JzIChjKSB7XG4vLyAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuLy8gICBpZiAoYy5lbG0uX21vdmVDYikge1xuLy8gICAgIGMuZWxtLl9tb3ZlQ2IoKVxuLy8gICB9XG4vLyAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuLy8gICBpZiAoYy5lbG0uX2VudGVyQ2IpIHtcbi8vICAgICBjLmVsbS5fZW50ZXJDYigpXG4vLyAgIH1cbi8vIH1cblxudmFyIHBsYXRmb3JtQ29tcG9uZW50cyA9IHtcbiAgUmljaHRleHQ6IFJpY2h0ZXh0LFxuICBUcmFuc2l0aW9uOiBUcmFuc2l0aW9uJDEsXG4gIFRyYW5zaXRpb25Hcm91cDogVHJhbnNpdGlvbkdyb3VwXG59O1xuXG4vKiAgKi9cblxuLy8gVGhlc2UgdXRpbCBmdW5jdGlvbnMgYXJlIHNwbGl0IGludG8gaXRzIG93biBmaWxlIGJlY2F1c2UgUm9sbHVwIGNhbm5vdCBkcm9wXG4vLyBtYWtlTWFwKCkgZHVlIHRvIHBvdGVudGlhbCBzaWRlIGVmZmVjdHMsIHNvIHRoZXNlIHZhcmlhYmxlcyBlbmQgdXBcbi8vIGJsb2F0aW5nIHRoZSB3ZWIgYnVpbGRzLlxuXG52YXIgaXNSZXNlcnZlZFRhZyQxID0gbWFrZU1hcChcbiAgJ3RlbXBsYXRlLHNjcmlwdCxzdHlsZSxlbGVtZW50LGNvbnRlbnQsc2xvdCxsaW5rLG1ldGEsc3ZnLHZpZXcsJyArXG4gICdhLGRpdixpbWcsaW1hZ2UsdGV4dCxzcGFuLGlucHV0LHN3aXRjaCx0ZXh0YXJlYSxzcGlubmVyLHNlbGVjdCwnICtcbiAgJ3NsaWRlcixzbGlkZXItbmVpZ2hib3IsaW5kaWNhdG9yLGNhbnZhcywnICtcbiAgJ2xpc3QsY2VsbCxoZWFkZXIsbG9hZGluZyxsb2FkaW5nLWluZGljYXRvcixyZWZyZXNoLHNjcm9sbGFibGUsc2Nyb2xsZXIsJyArXG4gICd2aWRlbyx3ZWIsZW1iZWQsdGFiYmFyLHRhYmhlYWRlcixkYXRlcGlja2VyLHRpbWVwaWNrZXIsbWFycXVlZSxjb3VudGRvd24nLFxuICB0cnVlXG4pO1xuXG4vLyBFbGVtZW50cyB0aGF0IHlvdSBjYW4sIGludGVudGlvbmFsbHksIGxlYXZlIG9wZW4gKGFuZCB3aGljaCBjbG9zZSB0aGVtc2VsdmVzKVxuLy8gbW9yZSBmbGV4aWJsZSB0aGFuIHdlYlxudmFyIGNhbkJlTGVmdE9wZW5UYWcgPSBtYWtlTWFwKFxuICAnd2ViLHNwaW5uZXIsc3dpdGNoLHZpZGVvLHRleHRhcmVhLGNhbnZhcywnICtcbiAgJ2luZGljYXRvcixtYXJxdWVlLGNvdW50ZG93bicsXG4gIHRydWVcbik7XG5cbnZhciBpc1J1bnRpbWVDb21wb25lbnQgPSBtYWtlTWFwKFxuICAncmljaHRleHQsdHJhbnNpdGlvbix0cmFuc2l0aW9uLWdyb3VwJyxcbiAgdHJ1ZVxuKTtcblxudmFyIGlzVW5hcnlUYWcgPSBtYWtlTWFwKFxuICAnZW1iZWQsaW1nLGltYWdlLGlucHV0LGxpbmssbWV0YScsXG4gIHRydWVcbik7XG5cbmZ1bmN0aW9uIG11c3RVc2VQcm9wICh0YWcsIHR5cGUsIG5hbWUpIHtcbiAgcmV0dXJuIGZhbHNlXG59XG5cblxuXG5mdW5jdGlvbiBpc1Vua25vd25FbGVtZW50JDEgKHRhZykge1xuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gcXVlcnkgKGVsLCBkb2N1bWVudCkge1xuICAvLyBkb2N1bWVudCBpcyBpbmplY3RlZCBieSB3ZWV4IGZhY3Rvcnkgd3JhcHBlclxuICB2YXIgcGxhY2Vob2xkZXIgPSBkb2N1bWVudC5jcmVhdGVDb21tZW50KCdyb290Jyk7XG4gIHBsYWNlaG9sZGVyLmhhc0F0dHJpYnV0ZSA9IHBsYWNlaG9sZGVyLnJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uICgpIHt9OyAvLyBoYWNrIGZvciBwYXRjaFxuICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpO1xuICByZXR1cm4gcGxhY2Vob2xkZXJcbn1cblxuLyogICovXG5cbi8vIGluc3RhbGwgcGxhdGZvcm0gc3BlY2lmaWMgdXRpbHNcblZ1ZSQyLmNvbmZpZy5tdXN0VXNlUHJvcCA9IG11c3RVc2VQcm9wO1xuVnVlJDIuY29uZmlnLmlzUmVzZXJ2ZWRUYWcgPSBpc1Jlc2VydmVkVGFnJDE7XG5WdWUkMi5jb25maWcuaXNSdW50aW1lQ29tcG9uZW50ID0gaXNSdW50aW1lQ29tcG9uZW50O1xuVnVlJDIuY29uZmlnLmlzVW5rbm93bkVsZW1lbnQgPSBpc1Vua25vd25FbGVtZW50JDE7XG5cbi8vIGluc3RhbGwgcGxhdGZvcm0gcnVudGltZSBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzXG5WdWUkMi5vcHRpb25zLmRpcmVjdGl2ZXMgPSBwbGF0Zm9ybURpcmVjdGl2ZXM7XG5WdWUkMi5vcHRpb25zLmNvbXBvbmVudHMgPSBwbGF0Zm9ybUNvbXBvbmVudHM7XG5cbi8vIGluc3RhbGwgcGxhdGZvcm0gcGF0Y2ggZnVuY3Rpb25cblZ1ZSQyLnByb3RvdHlwZS5fX3BhdGNoX18gPSBwYXRjaDtcblxuLy8gd3JhcCBtb3VudFxuVnVlJDIucHJvdG90eXBlLiRtb3VudCA9IGZ1bmN0aW9uIChcbiAgZWwsXG4gIGh5ZHJhdGluZ1xuKSB7XG4gIHJldHVybiBtb3VudENvbXBvbmVudChcbiAgICB0aGlzLFxuICAgIGVsICYmIHF1ZXJ5KGVsLCB0aGlzLiRkb2N1bWVudCksXG4gICAgaHlkcmF0aW5nXG4gIClcbn07XG5cbi8vIHRoaXMgZW50cnkgaXMgYnVpbHQgYW5kIHdyYXBwZWQgd2l0aCBhIGZhY3RvcnkgZnVuY3Rpb25cbi8vIHVzZWQgdG8gZ2VuZXJhdGUgYSBmcmVzaCBjb3B5IG9mIFZ1ZSBmb3IgZXZlcnkgV2VleCBpbnN0YW5jZS5cblxuZXhwb3J0cy5WdWUgPSBWdWUkMjtcblxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG4vKiAgKi9cblxuLy8gdGhpcyB3aWxsIGJlIHByZXNlcnZlZCBkdXJpbmcgYnVpbGRcbi8vICRmbG93LWRpc2FibGUtbGluZVxudmFyIFZ1ZUZhY3RvcnkgPSByZXF1aXJlKCcuL2ZhY3RvcnknKTtcblxudmFyIGluc3RhbmNlT3B0aW9ucyA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZSBpbnN0YW5jZSBjb250ZXh0LlxuICovXG5mdW5jdGlvbiBjcmVhdGVJbnN0YW5jZUNvbnRleHQgKFxuICBpbnN0YW5jZUlkLFxuICBydW50aW1lQ29udGV4dCxcbiAgZGF0YVxuKSB7XG4gIGlmICggZGF0YSA9PT0gdm9pZCAwICkgZGF0YSA9IHt9O1xuXG4gIHZhciB3ZWV4ID0gcnVudGltZUNvbnRleHQud2VleDtcbiAgdmFyIGluc3RhbmNlID0gaW5zdGFuY2VPcHRpb25zW2luc3RhbmNlSWRdID0ge1xuICAgIGluc3RhbmNlSWQ6IGluc3RhbmNlSWQsXG4gICAgY29uZmlnOiB3ZWV4LmNvbmZpZyxcbiAgICBkb2N1bWVudDogd2VleC5kb2N1bWVudCxcbiAgICBkYXRhOiBkYXRhXG4gIH07XG5cbiAgLy8gRWFjaCBpbnN0YW5jZSBoYXMgYSBpbmRlcGVuZGVudCBgVnVlYCBtb2R1bGUgaW5zdGFuY2VcbiAgdmFyIFZ1ZSA9IGluc3RhbmNlLlZ1ZSA9IGNyZWF0ZVZ1ZU1vZHVsZUluc3RhbmNlKGluc3RhbmNlSWQsIHdlZXgpO1xuXG4gIC8vIERFUFJFQ0FURURcbiAgdmFyIHRpbWVyQVBJcyA9IGdldEluc3RhbmNlVGltZXIoaW5zdGFuY2VJZCwgd2VleC5yZXF1aXJlTW9kdWxlKTtcblxuICB2YXIgaW5zdGFuY2VDb250ZXh0ID0gT2JqZWN0LmFzc2lnbih7IFZ1ZTogVnVlIH0sIHRpbWVyQVBJcyk7XG4gIE9iamVjdC5mcmVlemUoaW5zdGFuY2VDb250ZXh0KTtcbiAgcmV0dXJuIGluc3RhbmNlQ29udGV4dFxufVxuXG4vKipcbiAqIERlc3Ryb3kgYW4gaW5zdGFuY2Ugd2l0aCBpZC4gSXQgd2lsbCBtYWtlIHN1cmUgYWxsIG1lbW9yeSBvZlxuICogdGhpcyBpbnN0YW5jZSByZWxlYXNlZCBhbmQgbm8gbW9yZSBsZWFrcy5cbiAqL1xuZnVuY3Rpb24gZGVzdHJveUluc3RhbmNlIChpbnN0YW5jZUlkKSB7XG4gIHZhciBpbnN0YW5jZSA9IGluc3RhbmNlT3B0aW9uc1tpbnN0YW5jZUlkXTtcbiAgaWYgKGluc3RhbmNlICYmIGluc3RhbmNlLmFwcCBpbnN0YW5jZW9mIGluc3RhbmNlLlZ1ZSkge1xuICAgIHRyeSB7XG4gICAgICBpbnN0YW5jZS5hcHAuJGRlc3Ryb3koKTtcbiAgICAgIGluc3RhbmNlLmRvY3VtZW50LmRlc3Ryb3koKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIGRlbGV0ZSBpbnN0YW5jZS5kb2N1bWVudDtcbiAgICBkZWxldGUgaW5zdGFuY2UuYXBwO1xuICB9XG4gIGRlbGV0ZSBpbnN0YW5jZU9wdGlvbnNbaW5zdGFuY2VJZF07XG59XG5cbi8qKlxuICogUmVmcmVzaCBhbiBpbnN0YW5jZSB3aXRoIGlkIGFuZCBuZXcgdG9wLWxldmVsIGNvbXBvbmVudCBkYXRhLlxuICogSXQgd2lsbCB1c2UgYFZ1ZS5zZXRgIG9uIGFsbCBrZXlzIG9mIHRoZSBuZXcgZGF0YS4gU28gaXQncyBiZXR0ZXJcbiAqIGRlZmluZSBhbGwgcG9zc2libGUgbWVhbmluZ2Z1bCBrZXlzIHdoZW4gaW5zdGFuY2UgY3JlYXRlZC5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaEluc3RhbmNlIChcbiAgaW5zdGFuY2VJZCxcbiAgZGF0YVxuKSB7XG4gIHZhciBpbnN0YW5jZSA9IGluc3RhbmNlT3B0aW9uc1tpbnN0YW5jZUlkXTtcbiAgaWYgKCFpbnN0YW5jZSB8fCAhKGluc3RhbmNlLmFwcCBpbnN0YW5jZW9mIGluc3RhbmNlLlZ1ZSkpIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKChcInJlZnJlc2hJbnN0YW5jZTogaW5zdGFuY2UgXCIgKyBpbnN0YW5jZUlkICsgXCIgbm90IGZvdW5kIVwiKSlcbiAgfVxuICBpZiAoaW5zdGFuY2UuVnVlICYmIGluc3RhbmNlLlZ1ZS5zZXQpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgaW5zdGFuY2UuVnVlLnNldChpbnN0YW5jZS5hcHAsIGtleSwgZGF0YVtrZXldKTtcbiAgICB9XG4gIH1cbiAgLy8gRmluYWxseSBgcmVmcmVzaEZpbmlzaGAgc2lnbmFsIG5lZWRlZC5cbiAgaW5zdGFuY2UuZG9jdW1lbnQudGFza0NlbnRlci5zZW5kKCdkb20nLCB7IGFjdGlvbjogJ3JlZnJlc2hGaW5pc2gnIH0sIFtdKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBmcmVzaCBpbnN0YW5jZSBvZiBWdWUgZm9yIGVhY2ggV2VleCBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlVnVlTW9kdWxlSW5zdGFuY2UgKFxuICBpbnN0YW5jZUlkLFxuICB3ZWV4XG4pIHtcbiAgdmFyIGV4cG9ydHMgPSB7fTtcbiAgVnVlRmFjdG9yeShleHBvcnRzLCB3ZWV4LmRvY3VtZW50KTtcbiAgdmFyIFZ1ZSA9IGV4cG9ydHMuVnVlO1xuXG4gIHZhciBpbnN0YW5jZSA9IGluc3RhbmNlT3B0aW9uc1tpbnN0YW5jZUlkXTtcblxuICAvLyBwYXRjaCByZXNlcnZlZCB0YWcgZGV0ZWN0aW9uIHRvIGFjY291bnQgZm9yIGR5bmFtaWNhbGx5IHJlZ2lzdGVyZWRcbiAgLy8gY29tcG9uZW50c1xuICB2YXIgd2VleFJlZ2V4ID0gL153ZWV4Oi9pO1xuICB2YXIgaXNSZXNlcnZlZFRhZyA9IFZ1ZS5jb25maWcuaXNSZXNlcnZlZFRhZyB8fCAoZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pO1xuICB2YXIgaXNSdW50aW1lQ29tcG9uZW50ID0gVnVlLmNvbmZpZy5pc1J1bnRpbWVDb21wb25lbnQgfHwgKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KTtcbiAgVnVlLmNvbmZpZy5pc1Jlc2VydmVkVGFnID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gKCFpc1J1bnRpbWVDb21wb25lbnQobmFtZSkgJiYgd2VleC5zdXBwb3J0cygoXCJAY29tcG9uZW50L1wiICsgbmFtZSkpKSB8fFxuICAgICAgaXNSZXNlcnZlZFRhZyhuYW1lKSB8fFxuICAgICAgd2VleFJlZ2V4LnRlc3QobmFtZSlcbiAgfTtcbiAgVnVlLmNvbmZpZy5wYXJzZVBsYXRmb3JtVGFnTmFtZSA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBuYW1lLnJlcGxhY2Uod2VleFJlZ2V4LCAnJyk7IH07XG5cbiAgLy8gZXhwb3NlIHdlZXgtc3BlY2lmaWMgaW5mb1xuICBWdWUucHJvdG90eXBlLiRpbnN0YW5jZUlkID0gaW5zdGFuY2VJZDtcbiAgVnVlLnByb3RvdHlwZS4kZG9jdW1lbnQgPSBpbnN0YW5jZS5kb2N1bWVudDtcblxuICAvLyBleHBvc2Ugd2VleCBuYXRpdmUgbW9kdWxlIGdldHRlciBvbiBzdWJWdWUgcHJvdG90eXBlIHNvIHRoYXRcbiAgLy8gdmRvbSBydW50aW1lIG1vZHVsZXMgY2FuIGFjY2VzcyBuYXRpdmUgbW9kdWxlcyB2aWEgdm5vZGUuY29udGV4dFxuICBWdWUucHJvdG90eXBlLiRyZXF1aXJlV2VleE1vZHVsZSA9IHdlZXgucmVxdWlyZU1vZHVsZTtcblxuICAvLyBIYWNrIGBWdWVgIGJlaGF2aW9yIHRvIGhhbmRsZSBpbnN0YW5jZSBpbmZvcm1hdGlvbiBhbmQgZGF0YVxuICAvLyBiZWZvcmUgcm9vdCBjb21wb25lbnQgY3JlYXRlZC5cbiAgVnVlLm1peGluKHtcbiAgICBiZWZvcmVDcmVhdGU6IGZ1bmN0aW9uIGJlZm9yZUNyZWF0ZSAoKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuJG9wdGlvbnM7XG4gICAgICAvLyByb290IGNvbXBvbmVudCAodm0pXG4gICAgICBpZiAob3B0aW9ucy5lbCkge1xuICAgICAgICAvLyBzZXQgZXh0ZXJuYWwgZGF0YSBvZiBpbnN0YW5jZVxuICAgICAgICB2YXIgZGF0YU9wdGlvbiA9IG9wdGlvbnMuZGF0YTtcbiAgICAgICAgdmFyIGludGVybmFsRGF0YSA9ICh0eXBlb2YgZGF0YU9wdGlvbiA9PT0gJ2Z1bmN0aW9uJyA/IGRhdGFPcHRpb24oKSA6IGRhdGFPcHRpb24pIHx8IHt9O1xuICAgICAgICBvcHRpb25zLmRhdGEgPSBPYmplY3QuYXNzaWduKGludGVybmFsRGF0YSwgaW5zdGFuY2UuZGF0YSk7XG4gICAgICAgIC8vIHJlY29yZCBpbnN0YW5jZSBieSBpZFxuICAgICAgICBpbnN0YW5jZS5hcHAgPSB0aGlzO1xuICAgICAgfVxuICAgIH0sXG4gICAgbW91bnRlZDogZnVuY3Rpb24gbW91bnRlZCAoKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuJG9wdGlvbnM7XG4gICAgICAvLyByb290IGNvbXBvbmVudCAodm0pXG4gICAgICBpZiAob3B0aW9ucy5lbCAmJiB3ZWV4LmRvY3VtZW50ICYmIGluc3RhbmNlLmFwcCA9PT0gdGhpcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFNlbmQgXCJjcmVhdGVGaW5pc2hcIiBzaWduYWwgdG8gbmF0aXZlLlxuICAgICAgICAgIHdlZXguZG9jdW1lbnQudGFza0NlbnRlci5zZW5kKCdkb20nLCB7IGFjdGlvbjogJ2NyZWF0ZUZpbmlzaCcgfSwgW10pO1xuICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIEp1c3QgaW5zdGFuY2UgdmFyaWFibGUgYHdlZXguY29uZmlnYFxuICAgKiBHZXQgaW5zdGFuY2UgY29uZmlnLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9XG4gICAqL1xuICBWdWUucHJvdG90eXBlLiRnZXRDb25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGluc3RhbmNlLmFwcCBpbnN0YW5jZW9mIFZ1ZSkge1xuICAgICAgcmV0dXJuIGluc3RhbmNlLmNvbmZpZ1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gVnVlXG59XG5cbi8qKlxuICogREVQUkVDQVRFRFxuICogR2VuZXJhdGUgSFRNTDUgVGltZXIgQVBJcy4gQW4gaW1wb3J0YW50IHBvaW50IGlzIHRoYXQgdGhlIGNhbGxiYWNrXG4gKiB3aWxsIGJlIGNvbnZlcnRlZCBpbnRvIGNhbGxiYWNrIGlkIHdoZW4gc2VudCB0byBuYXRpdmUuIFNvIHRoZVxuICogZnJhbWV3b3JrIGNhbiBtYWtlIHN1cmUgbm8gc2lkZSBlZmZlY3Qgb2YgdGhlIGNhbGxiYWNrIGhhcHBlbmVkIGFmdGVyXG4gKiBhbiBpbnN0YW5jZSBkZXN0cm95ZWQuXG4gKi9cbmZ1bmN0aW9uIGdldEluc3RhbmNlVGltZXIgKFxuICBpbnN0YW5jZUlkLFxuICBtb2R1bGVHZXR0ZXJcbikge1xuICB2YXIgaW5zdGFuY2UgPSBpbnN0YW5jZU9wdGlvbnNbaW5zdGFuY2VJZF07XG4gIHZhciB0aW1lciA9IG1vZHVsZUdldHRlcigndGltZXInKTtcbiAgdmFyIHRpbWVyQVBJcyA9IHtcbiAgICBzZXRUaW1lb3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgd2hpbGUgKCBsZW4tLSApIGFyZ3NbIGxlbiBdID0gYXJndW1lbnRzWyBsZW4gXTtcblxuICAgICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFyZ3NbMF0uYXBwbHkoYXJncywgYXJncy5zbGljZSgyKSk7XG4gICAgICB9O1xuXG4gICAgICB0aW1lci5zZXRUaW1lb3V0KGhhbmRsZXIsIGFyZ3NbMV0pO1xuICAgICAgcmV0dXJuIGluc3RhbmNlLmRvY3VtZW50LnRhc2tDZW50ZXIuY2FsbGJhY2tNYW5hZ2VyLmxhc3RDYWxsYmFja0lkLnRvU3RyaW5nKClcbiAgICB9LFxuICAgIHNldEludGVydmFsOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgd2hpbGUgKCBsZW4tLSApIGFyZ3NbIGxlbiBdID0gYXJndW1lbnRzWyBsZW4gXTtcblxuICAgICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFyZ3NbMF0uYXBwbHkoYXJncywgYXJncy5zbGljZSgyKSk7XG4gICAgICB9O1xuXG4gICAgICB0aW1lci5zZXRJbnRlcnZhbChoYW5kbGVyLCBhcmdzWzFdKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZS5kb2N1bWVudC50YXNrQ2VudGVyLmNhbGxiYWNrTWFuYWdlci5sYXN0Q2FsbGJhY2tJZC50b1N0cmluZygpXG4gICAgfSxcbiAgICBjbGVhclRpbWVvdXQ6IGZ1bmN0aW9uIChuKSB7XG4gICAgICB0aW1lci5jbGVhclRpbWVvdXQobik7XG4gICAgfSxcbiAgICBjbGVhckludGVydmFsOiBmdW5jdGlvbiAobikge1xuICAgICAgdGltZXIuY2xlYXJJbnRlcnZhbChuKTtcbiAgICB9XG4gIH07XG4gIHJldHVybiB0aW1lckFQSXNcbn1cblxuZXhwb3J0cy5jcmVhdGVJbnN0YW5jZUNvbnRleHQgPSBjcmVhdGVJbnN0YW5jZUNvbnRleHQ7XG5leHBvcnRzLmRlc3Ryb3lJbnN0YW5jZSA9IGRlc3Ryb3lJbnN0YW5jZTtcbmV4cG9ydHMucmVmcmVzaEluc3RhbmNlID0gcmVmcmVzaEluc3RhbmNlO1xuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBzZXR1cCBmcm9tICcuL3NldHVwJ1xuaW1wb3J0ICogYXMgVnVlIGZyb20gJ3dlZXgtdnVlLWZyYW1ld29yaydcblxuc2V0dXAoeyBWdWUgfSlcbiJdLCJuYW1lcyI6WyJsZXQiLCJjb25zdCIsIkVsZW1lbnQiLCJzdXBlciIsInRhc2tDZW50ZXIiLCJwdXJlQmVmb3JlIiwiaW5kZXgiLCJ0aGlzIiwiaW5pdCIsIm5hbWUiLCJzZXJ2aWNlcyIsImluaXRUYXNrSGFuZGxlciIsIkJyb2FkY2FzdENoYW5uZWwiLCJhcmd1bWVudHMiLCJWdWVGYWN0b3J5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCQUEsSUFBSSxXQUFXLEdBQUcsRUFBQztBQUNuQixBQUFPLFNBQVMsUUFBUSxJQUFJO0VBQzFCLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUU7Q0FDbEM7O0FBRUQsQUFBTyxTQUFTLEtBQUssRUFBRSxDQUFDLEVBQUU7RUFDeEJDLElBQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7RUFDM0MsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztDQUNwQzs7QUFFRCxBQUFPLFNBQVMsY0FBYyxFQUFFLE1BQU0sRUFBRTtFQUN0QyxJQUFJLE9BQU8sSUFBSSxLQUFLLFVBQVUsRUFBRTtJQUM5QixPQUFPLEVBQUU7R0FDVjtFQUNEQSxJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJO0lBQ3JDLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztjQUN0QixNQUFLLFNBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUM7R0FD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TyxFQUFFO01BQzVFLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDaEQsQ0FBQyxDQUFDLEVBQUUsQ0FBQztHQUNQOztFQUVELE1BQU0sRUFBRSxTQUFTLE1BQU0sRUFBRSxDQUFDLEVBQUU7SUFDMUIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDO0lBQ3JELElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3JELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztJQUM1QyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNsQyxJQUFJLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFFakQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7TUFDM0MsSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3ZCLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRTtRQUNULElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxJQUFJLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO1VBQzNELFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDakIsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO1dBQ2IsQ0FBQyxDQUFDLENBQUMsSUFBSSxL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
