(this.nativeLog || function(s) {console.log(s)})('Weex Legacy Framework 0.23.6, Build 2018-01-03 16:38.');
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
 * @fileOverview The api for invoking with "$" prefix
 */

/**
 * @deprecated use $vm instead
 * find the vm by id
 * Note: there is only one id in whole component
 * @param  {string} id
 * @return {Vm}
 */
function $ (id) {
  console.warn('[JS Framework] Vm#$ is deprecated, please use Vm#$vm instead');
  var info = this._ids[id];
  if (info) {
    return info.vm
  }
}

/**
 * find the element by id
 * Note: there is only one id in whole component
 * @param  {string} id
 * @return {Element}
 */
function $el (id) {
  var info = this._ids[id];
  if (info) {
    return info.el
  }
}

/**
 * find the vm of the custom component by id
 * Note: there is only one id in whole component
 * @param  {string} id
 * @return {Vm}
 */
function $vm (id) {
  var info = this._ids[id];
  if (info) {
    return info.vm
  }
}

/**
 * Fire when differ rendering finished
 *
 * @param  {Function} fn
 */
function $renderThen (fn) {
  var app = this._app;
  var differ = app.differ;
  return differ.then(function () {
    fn();
  })
}

/**
 * scroll an element specified by id into view,
 * moreover specify a number of offset optionally
 * @param  {string} id
 * @param  {number} offset
 */
function $scrollTo (id, offset) {
  console.warn('[JS Framework] Vm#$scrollTo is deprecated, ' +
          'please use "require(\'@weex-module/dom\')' +
          '.scrollTo(el, options)" instead');
  var el = this.$el(id);
  if (el) {
    var dom = this._app.requireModule('dom');
    dom.scrollToElement(el.ref, { offset: offset });
  }
}

/**
 * perform transition animation on an element specified by id
 * @param  {string}   id
 * @param  {object}   options
 * @param  {object}   options.styles
 * @param  {object}   options.duration(ms)
 * @param  {object}   [options.timingFunction]
 * @param  {object}   [options.delay=0(ms)]
 * @param  {Function} callback
 */
function $transition (id, options, callback) {
  var this$1 = this;

  var el = this.$el(id);
  if (el && options && options.styles) {
    var animation = this._app.requireModule('animation');
    animation.transition(el.ref, options, function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      this$1._setStyle(el, options.styles);
      callback && callback.apply(void 0, args);
    });
  }
}

/**
 * get some config
 * @return {object} some config for app instance
 * @property {string} bundleUrl
 * @property {boolean} debug
 * @property {object} env
 * @property {string} env.weexVersion(ex. 1.0.0)
 * @property {string} env.appName(ex. TB/TM)
 * @property {string} env.appVersion(ex. 5.0.0)
 * @property {string} env.platform(ex. iOS/Android)
 * @property {string} env.osVersion(ex. 7.0.0)
 * @property {string} env.deviceModel **native only**
 * @property {number} env.[deviceWidth=750]
 * @property {number} env.deviceHeight
 */
function $getConfig (callback) {
  var config = this._app.options;
  if (typeof callback === 'function') {
    console.warn('[JS Framework] the callback of Vm#$getConfig(callback) is deprecated, ' +
      'this api now can directly RETURN config info.');
    callback(config);
  }
  return config
}

/**
 * @deprecated
 * request network via http protocol
 * @param  {object}   params
 * @param  {Function} callback
 */
function $sendHttp (params, callback) {
  console.warn('[JS Framework] Vm#$sendHttp is deprecated, ' +
          'please use "require(\'@weex-module/stream\')' +
          '.sendHttp(params, callback)" instead');
  var stream = this._app.requireModule('stream');
  stream.sendHttp(params, callback);
}

/**
 * @deprecated
 * open a url
 * @param  {string} url
 */
function $openURL (url) {
  console.warn('[JS Framework] Vm#$openURL is deprecated, ' +
          'please use "require(\'@weex-module/event\')' +
          '.openURL(url)" instead');
  var event = this._app.requireModule('event');
  event.openURL(url);
}

/**
 * @deprecated
 * set a title for page
 * @param  {string} title
 */
function $setTitle (title) {
  console.warn('[JS Framework] Vm#$setTitle is deprecated, ' +
          'please use "require(\'@weex-module/pageInfo\')' +
          '.setTitle(title)" instead');
  var pageInfo = this._app.requireModule('pageInfo');
  pageInfo.setTitle(title);
}

/**
 * @deprecated use "require('@weex-module/moduleName') instead"
 * invoke a native method by specifing the name of module and method
 * @param  {string} moduleName
 * @param  {string} methodName
 * @param  {...*} the rest arguments
 */
function $call (moduleName, methodName) {
  var args = [], len = arguments.length - 2;
  while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

  console.warn('[JS Framework] Vm#$call is deprecated, ' +
    'please use "require(\'@weex-module/moduleName\')" instead');
  var module = this._app.requireModule(moduleName);
  if (module && module[methodName]) {
    module[methodName].apply(module, args);
  }
}


var methods$1 = Object.freeze({
	$: $,
	$el: $el,
	$vm: $vm,
	$renderThen: $renderThen,
	$scrollTo: $scrollTo,
	$transition: $transition,
	$getConfig: $getConfig,
	$sendHttp: $sendHttp,
	$openURL: $openURL,
	$setTitle: $setTitle,
	$call: $call
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
/**
 * Mix properties into target object.
 *
 * @param {Object} to
 * @param {Object} from
 */

function extend (target) {
  var src = [], len = arguments.length - 1;
  while ( len-- > 0 ) src[ len ] = arguments[ len + 1 ];

  /* istanbul ignore else */
  if (typeof Object.assign === 'function') {
    Object.assign.apply(Object, [ target ].concat( src ));
  }
  else {
    var first = src.shift();
    for (var key in first) {
      target[key] = first[key];
    }
    if (src.length) {
      extend.apply(void 0, [ target ].concat( src ));
    }
  }
  return target
}

/**
 * Define a property.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 * @param {Boolean} [enumerable]
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
 * Remove an item from an array
 *
 * @param {Array} arr
 * @param {*} item
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
 *
 * @param {Object} obj
 * @param {String} key
 * @return {Boolean}
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

/**
 * Simple bind, faster than native
 *
 * @param {Function} fn
 * @param {Object} ctx
 * @return {Function}
 */

function bind (fn, ctx) {
  return function (a) {
    var l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 *
 * @param {*} obj
 * @return {Boolean}
 */

function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 *
 * @param {*} obj
 * @return {Boolean}
 */

var toString = Object.prototype.toString;
var OBJECT_STRING = '[object Object]';
function isPlainObject (obj) {
  return toString.call(obj) === OBJECT_STRING
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
 * Check if a string starts with $ or _
 *
 * @param {String} str
 * @return {Boolean}
 */

function isReserved (str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

// can we use __proto__?
var hasProto = '__proto__' in {};

var _Set;
/* istanbul ignore next */
if (typeof Set !== 'undefined' && Set.toString().match(/native code/)) {
  // use native Set when available.
  _Set = Set;
}
else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = function () {
    this.set = Object.create(null);
  };
  _Set.prototype.has = function (key) {
    return this.set[key] !== undefined
  };
  _Set.prototype.add = function (key) {
    if (key == null || this.set[key]) {
      return
    }
    this.set[key] = 1;
  };
  _Set.prototype.clear = function () {
    this.set = Object.create(null);
  };
}

/**
 * Polyfill in iOS7 by native because the JavaScript polyfill has memory problem.
 * @return {object}
 */

function createNewSet () {
  /* istanbul ignore next */
  /* eslint-disable */
  if (typeof nativeSet === 'object') {
    return nativeSet.create()
  }
  /* eslint-enable */
  return new _Set()
}

/**
 * Create a cached version of a pure function.
 *
 * @param {Function} fn
 * @return {Function}
 */







function typof$1 (v) {
  var s = Object.prototype.toString.call(v);
  return s.substring(8, s.length - 1).toLowerCase()
}

// weex name rules

var WEEX_COMPONENT_REG = /^@weex-component\//;
var WEEX_MODULE_REG = /^@weex-module\//;
var NORMAL_MODULE_REG = /^\.{1,2}\//;
var JS_SURFIX_REG = /\.js$/;

var isWeexComponent = function (name) { return !!name.match(WEEX_COMPONENT_REG); };
var isWeexModule = function (name) { return !!name.match(WEEX_MODULE_REG); };
var isNormalModule = function (name) { return !!name.match(NORMAL_MODULE_REG); };
var isNpmModule = function (name) { return !isWeexComponent(name) && !isWeexModule(name) && !isNormalModule(name); };

function removeWeexPrefix (str) {
  var result = str.replace(WEEX_COMPONENT_REG, '').replace(WEEX_MODULE_REG, '');
  return result
}

function removeJSSurfix (str) {
  return str.replace(JS_SURFIX_REG, '')
}

/* eslint-disable */


var uid$1 = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 *
 * @constructor
 */

function Dep () {
  this.id = uid$1++;
  this.subs = [];
}

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

function resetTarget () {
  Dep.target = null;
  targetStack = [];
}

/**
 * Add a directive subscriber.
 *
 * @param {Directive} sub
 */

Dep.prototype.addSub = function (sub) {
  this.subs.push(sub);
};

/**
 * Remove a directive subscriber.
 *
 * @param {Directive} sub
 */

Dep.prototype.removeSub = function (sub) {
  remove(this.subs, sub);
};

/**
 * Add self as a dependency to the target watcher.
 */

Dep.prototype.depend = function () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

/**
 * Notify all subscribers of a new value.
 */

Dep.prototype.notify = function () {
  // stablize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

/* eslint-disable */


// import { pushWatcher } from './batcher'
var uid = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 *
 * @param {Vue} vm
 * @param {String|Function} expOrFn
 * @param {Function} cb
 * @param {Object} options
 *                 - {Array} filters
 *                 - {Boolean} twoWay
 *                 - {Boolean} deep
 *                 - {Boolean} user
 *                 - {Boolean} sync
 *                 - {Boolean} lazy
 *                 - {Function} [preProcess]
 *                 - {Function} [postProcess]
 * @constructor
 */

function Watcher (vm, expOrFn, cb, options) {
  // mix in options
  if (options) {
    extend(this, options);
  }
  var isFn = typeof expOrFn === 'function';
  this.vm = vm;
  vm._watchers.push(this);
  this.expression = expOrFn;
  this.cb = cb;
  this.id = ++uid; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = createNewSet(); // new Set()
  this.newDepIds = createNewSet(); // new Set()
  // parse expression for getter
  if (isFn) {
    this.getter = expOrFn;
  }
  this.value = this.lazy
    ? undefined
    : this.get();
  // state for avoiding false triggers for deep and Array
  // watchers during vm._digest()
  this.queued = this.shallow = false;
}

/**
 * Evaluate the getter, and re-collect dependencies.
 */

Watcher.prototype.get = function () {
  pushTarget(this);
  var value = this.getter.call(this.vm, this.vm);
  // "touch" every property so they are all tracked as
  // dependencies for deep watching
  if (this.deep) {
    traverse(value);
  }
  popTarget();
  this.cleanupDeps();
  return value
};

/**
 * Add a dependency to this directive.
 *
 * @param {Dep} dep
 */

Watcher.prototype.addDep = function (dep) {
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

Watcher.prototype.cleanupDeps = function () {
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
 *
 * @param {Boolean} shallow
 */

Watcher.prototype.update = function (shallow) {
  if (this.lazy) {
    this.dirty = true;
  } else {
    this.run();
  }
  // } else if (this.sync) {
  //   this.run()
  // } else {
  //   // if queued, only overwrite shallow with non-shallow,
  //   // but not the other way around.
  //   this.shallow = this.queued
  //     ? shallow
  //       ? this.shallow
  //       : false
  //     : !!shallow
  //   this.queued = true
  //   pushWatcher(this)
  // }
};

/**
 * Batcher job interface.
 * Will be called by the batcher.
 */

Watcher.prototype.run = function () {
  if (this.active) {
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated; but only do so if this is a
      // non-shallow update (caused by a vm digest).
      ((isObject(value) || this.deep) && !this.shallow)
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
    this.queued = this.shallow = false;
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */

Watcher.prototype.evaluate = function () {
  this.value = this.get();
  this.dirty = false;
};

/**
 * Depend on all deps collected by this watcher.
 */

Watcher.prototype.depend = function () {
  var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    this$1.deps[i].depend();
  }
};

/**
 * Remove self from all dependencies' subcriber list.
 */

Watcher.prototype.teardown = function () {
  var this$1 = this;

  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed or is performing a v-for
    // re-render (the watcher list is then filtered by v-for).
    if (!this.vm._isBeingDestroyed && !this.vm._vForRemoving) {
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this$1.deps[i].removeSub(this$1);
    }
    this.active = false;
    this.vm = this.cb = this.value = null;
  }
};

/**
 * Recrusively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 *
 * @param {*} val
 * @param {Set} seen
 */

var seenObjects = createNewSet(); // new Set()
/* istanbul ignore next */
function traverse (val, seen) {
  var i, keys, isA, isO;
  if (!seen) {
    seen = seenObjects;
    seen.clear();
  }
  isA = Array.isArray(val);
  isO = isObject(val);
  if (isA || isO) {
    if (val.__ob__) {
      var depId = val.__ob__.dep.id;
      if (seen.has(depId)) {
        return
      } else {
        seen.add(depId);
      }
    }
    if (isA) {
      i = val.length;
      while (i--) { traverse(val[i], seen); }
    } else if (isO) {
      keys = Object.keys(val);
      i = keys.length;
      while (i--) { traverse(val[keys[i]], seen); }
    }
  }
}

/* eslint-disable */


var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
.forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    var arguments$1 = arguments;

    // avoid leaking arguments:
    // http://jsperf.com/closure-with-arguments
    var i = arguments.length;
    var args = new Array(i);
    while (i--) {
      args[i] = arguments$1[i];
    }
    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
        inserted = args;
        break
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

/**
 * Swap the element at the given index with a new value
 * and emits corresponding event.
 *
 * @param {Number} index
 * @param {*} val
 * @return {*} - replaced element
 */

def(
  arrayProto,
  '$set',
  function $set (index, val) {
    console.warn("[JS Framework] \"Array.prototype.$set\" is not a standard API,"
      + " it will be removed in the next version.");
    if (index >= this.length) {
      this.length = index + 1;
    }
    return this.splice(index, 1, val)[0]
  }
);

/**
 * Convenience method to remove the element at given index.
 *
 * @param {Number} index
 * @param {*} val
 */

def(
  arrayProto,
  '$remove',
  function $remove (index) {
    console.warn("[JS Framework] \"Array.prototype.$remove\" is not a standard API,"
      + " it will be removed in the next version.");
    /* istanbul ignore if */
    if (!this.length) { return }
    /* istanbul ignore else */
    if (typeof index !== 'number') {
      index = this.indexOf(index);
    }
    /* istanbul ignore else */
    if (index > -1) {
      this.splice(index, 1);
    }
  }
);

/* eslint-disable */


var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 *
 * @param {Array|Object} value
 * @constructor
 */

function Observer (value) {
  this.value = value;
  this.dep = new Dep();
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
}

// Instance methods

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 *
 * @param {Object} obj
 */

Observer.prototype.walk = function (obj) {
  var this$1 = this;

  for (var key in obj) {
    this$1.convert(key, obj[key]);
  }
};

/**
 * Observe a list of Array items.
 *
 * @param {Array} items
 */

Observer.prototype.observeArray = function (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

/**
 * Convert a property into getter/setter so we can emit
 * the events when the property is accessed/changed.
 *
 * @param {String} key
 * @param {*} val
 */

Observer.prototype.convert = function (key, val) {
  defineReactive(this.value, key, val);
};

/**
 * Add an owner vm, so that when $set/$delete mutations
 * happen we can notify owner vms to proxy the keys and
 * digest the watchers. This is only called when the object
 * is observed as an instance's root $data.
 *
 * @param {Vue} vm
 */

Observer.prototype.addVm = function (vm) {
  (this.vms || (this.vms = [])).push(vm);
};

/**
 * Remove an owner vm. This is called when the object is
 * swapped out as an instance's $data object.
 *
 * @param {Vue} vm
 */

/* istanbul ignore next */
Observer.prototype.removeVm = function (vm) {
  remove(this.vms, vm);
};

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 *
 * @param {Object|Array} target
 * @param {Object} src
 */

function protoAugment (target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 *
 * @param {Object|Array} target
 * @param {Object} proto
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
 *
 * @param {*} value
 * @param {Vue} [vm]
 * @return {Observer|undefined}
 * @static
 */

function observe (value, vm) {
  if (!isObject(value)) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (ob && vm) {
    ob.addVm(vm);
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 */

function defineReactive (obj, key, val) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;

  var childOb = observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
        if (Array.isArray(value)) {
          for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
            e = value[i];
            e && e.__ob__ && e.__ob__.dep.depend();
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      if (newVal === value) {
        return
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = observe(newVal);
      dep.notify();
    }
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 * @public
 */

/* istanbul ignore next */
function set (obj, key, val) {
  if (Array.isArray(obj)) {
    return obj.splice(key, 1, val)
  }
  if (hasOwn(obj, key)) {
    obj[key] = val;
    return
  }
  if (obj._isVue) {
    set(obj._data, key, val);
    return
  }
  var ob = obj.__ob__;
  if (!ob) {
    obj[key] = val;
    return
  }
  ob.convert(key, val);
  ob.dep.notify();
  if (ob.vms) {
    var i = ob.vms.length;
    while (i--) {
      var vm = ob.vms[i];
      proxy(vm, key);
      // vm.$forceUpdate()
    }
  }
  return val
}

/**
 * Delete a property and trigger change if necessary.
 *
 * @param {Object} obj
 * @param {String} key
 */

/* istanbul ignore next */
function del (obj, key) {
  if (!hasOwn(obj, key)) {
    return
  }
  delete obj[key];
  var ob = obj.__ob__;

  if (!ob) {
    if (obj._isVue) {
      delete obj._data[key];
      // obj.$forceUpdate()
    }
    return
  }
  ob.dep.notify();
  if (ob.vms) {
    var i = ob.vms.length;
    while (i--) {
      var vm = ob.vms[i];
      unproxy(vm, key);
      // vm.$forceUpdate()
    }
  }
}

var KEY_WORDS = ['$index', '$value', '$event'];
function proxy (vm, key) {
  if (KEY_WORDS.indexOf(key) > -1 || !isReserved(key)) {
    Object.defineProperty(vm, key, {
      configurable: true,
      enumerable: true,
      get: function proxyGetter () {
        return vm._data[key]
      },
      set: function proxySetter (val) {
        vm._data[key] = val;
      }
    });
  }
}

/* istanbul ignore next */
function unproxy (vm, key) {
  if (!isReserved(key)) {
    delete vm[key];
  }
}

/* eslint-disable */


function initState (vm) {
  vm._watchers = [];
  initData(vm);
  initComputed(vm);
  initMethods(vm);
}

function initData (vm) {
  var data = vm._data;

  if (!isPlainObject(data)) {
    data = {};
  }
  // proxy data on instance
  var keys = Object.keys(data);
  var i = keys.length;
  while (i--) {
    proxy(vm, keys[i]);
  }
  // observe data
  observe(data, vm);
}

/* istanbul ignore next */
function noop () {
}

function initComputed (vm) {
  var computed = vm._computed;
  if (computed) {
    for (var key in computed) {
      var userDef = computed[key];
      var def = {
        enumerable: true,
        configurable: true
      };
      if (typeof userDef === 'function') {
        def.get = makeComputedGetter(userDef, vm);
        def.set = noop;
      } else {
        def.get = userDef.get
          ? userDef.cache !== false
            ? makeComputedGetter(userDef.get, vm)
            : bind(userDef.get, vm)
          : noop;
        def.set = userDef.set
          ? bind(userDef.set, vm)
          : noop;
      }
      Object.defineProperty(vm, key, def);
    }
  }
}

function makeComputedGetter (getter, owner) {
  var watcher = new Watcher(owner, getter, null, {
    lazy: true
  });
  return function computedGetter () {
    if (watcher.dirty) {
      watcher.evaluate();
    }
    if (Dep.target) {
      watcher.depend();
    }
    return watcher.value
  }
}

function initMethods (vm) {
  var methods = vm._methods;
  if (methods) {
    for (var key in methods) {
      vm[key] = methods[key];
    }
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
// @todo: It should be registered by native from `registerComponents()`.

var config$2 = {
  nativeComponentMap: {
    text: true,
    image: true,
    container: true,
    slider: {
      type: 'slider',
      append: 'tree'
    },
    cell: {
      type: 'cell',
      append: 'tree'
    }
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
/**
 * @fileOverview
 * Directive Parser
 */

var nativeComponentMap = config$2.nativeComponentMap;

var SETTERS = {
  attr: 'setAttr',
  style: 'setStyle',
  event: 'addEvent'
};

/**
 * apply the native component's options(specified by template.type)
 * to the template
 */
function applyNaitveComponentOptions (template) {
  var type = template.type;
  var options = nativeComponentMap[type];

  if (typeof options === 'object') {
    for (var key in options) {
      if (template[key] == null) {
        template[key] = options[key];
      }
      else if (typof$1(template[key]) === 'object' &&
        typof$1(options[key]) === 'object') {
        for (var subkey in options[key]) {
          if (template[key][subkey] == null) {
            template[key][subkey] = options[key][subkey];
          }
        }
      }
    }
  }
}

/**
 * bind all id, attr, classnames, style, events to an element
 */
function bindElement (vm, el, template) {
  setId$1(vm, el, template.id, vm);
  setAttr(vm, el, template.attr);
  setClass(vm, el, template.classList);
  setStyle(vm, el, template.style);
  bindEvents(vm, el, template.events);
}

/**
 * bind all props to sub vm and bind all style, events to the root element
 * of the sub vm if it doesn't have a replaced multi-node fragment
 */
function bindSubVm (vm, subVm, template, repeatItem) {
  subVm = subVm || {};
  template = template || {};

  var options = subVm._options || {};

  // bind props
  var props = options.props;

  if (Array.isArray(props)) {
    props = props.reduce(function (result, value) {
      result[value] = true;
      return result
    }, {});
  }

  mergeProps(repeatItem, props, vm, subVm);
  mergeProps(template.attr, props, vm, subVm);
}

/**
 * merge class and styles from vm to sub vm.
 */
function bindSubVmAfterInitialized (vm, subVm, template, target) {
  if ( target === void 0 ) target = {};

  mergeClassStyle(template.classList, vm, subVm);
  mergeStyle(template.style, vm, subVm);

  // bind subVm to the target element
  if (target.children) {
    target.children[target.children.length - 1]._vm = subVm;
  }
  else {
    target._vm = subVm;
  }
}

/**
 * Bind props from vm to sub vm and watch their updates.
 */
function mergeProps (target, props, vm, subVm) {
  if (!target) {
    return
  }
  var loop = function ( key ) {
    if (!props || props[key]) {
      var value = target[key];
      if (typeof value === 'function') {
        var returnValue = watch(vm, value, function (v) {
          subVm[key] = v;
        });
        subVm[key] = returnValue;
      }
      else {
        subVm[key] = value;
      }
    }
  };

  for (var key in target) loop( key );
}

/**
 * Bind style from vm to sub vm and watch their updates.
 */
function mergeStyle (target, vm, subVm) {
  var loop = function ( key ) {
    var value = target[key];
    if (typeof value === 'function') {
      var returnValue = watch(vm, value, function (v) {
        if (subVm._rootEl) {
          subVm._rootEl.setStyle(key, v);
        }
      });
      subVm._rootEl.setStyle(key, returnValue);
    }
    else {
      if (subVm._rootEl) {
        subVm._rootEl.setStyle(key, value);
      }
    }
  };

  for (var key in target) loop( key );
}

/**
 * Bind class & style from vm to sub vm and watch their updates.
 */
function mergeClassStyle (target, vm, subVm) {
  var css = vm._options && vm._options.style || {};

  /* istanbul ignore if */
  if (!subVm._rootEl) {
    return
  }

  var className = '@originalRootEl';
  css[className] = subVm._rootEl.classStyle;

  function addClassName (list, name) {
    if (typof$1(list) === 'array') {
      list.unshift(name);
    }
  }

  if (typeof target === 'function') {
    var value = watch(vm, target, function (v) {
      addClassName(v, className);
      setClassStyle(subVm._rootEl, css, v);
    });
    addClassName(value, className);
    setClassStyle(subVm._rootEl, css, value);
  }
  else if (target != null) {
    addClassName(target, className);
    setClassStyle(subVm._rootEl, css, target);
  }
}

/**
 * bind id to an element
 * each id is unique in a whole vm
 */
function setId$1 (vm, el, id, target) {
  var map = Object.create(null);

  Object.defineProperties(map, {
    vm: {
      value: target,
      writable: false,
      configurable: false
    },
    el: {
      get: function () { return el || target._rootEl; },
      configurable: false
    }
  });

  if (typeof id === 'function') {
    var handler = id;
    id = handler.call(vm);
    if (id || id === 0) {
      vm._ids[id] = map;
    }
    watch(vm, handler, function (newId) {
      if (newId) {
        vm._ids[newId] = map;
      }
    });
  }
  else if (id && typeof id === 'string') {
    vm._ids[id] = map;
  }
}

/**
 * bind attr to an element
 */
function setAttr (vm, el, attr) {
  bindDir(vm, el, 'attr', attr);
}

function setClassStyle (el, css, classList) {
  if (typeof classList === 'string') {
    classList = classList.split(/\s+/);
  }
  classList.forEach(function (name, i) {
    classList.splice.apply(classList, [ i, 1 ].concat( name.split(/\s+/) ));
  });
  var classStyle = {};
  var length = classList.length;

  var loop = function ( i ) {
    var style = css[classList[i]];
    if (style) {
      Object.keys(style).forEach(function (key) {
        classStyle[key] = style[key];
      });
    }
  };

  for (var i = 0; i < length; i++) loop( i );
  el.setClassStyle(classStyle);
}

/**
 * bind classnames to an element
 */
function setClass (vm, el, classList) {
  if (typeof classList !== 'function' && !Array.isArray(classList)) {
    return
  }
  if (Array.isArray(classList) && !classList.length) {
    el.setClassStyle({});
    return
  }

  var style = vm._options && vm._options.style || {};
  if (typeof classList === 'function') {
    var value = watch(vm, classList, function (v) {
      setClassStyle(el, style, v);
    });
    setClassStyle(el, style, value);
  }
  else {
    setClassStyle(el, style, classList);
  }
}

/**
 * bind style to an element
 */
function setStyle (vm, el, style) {
  bindDir(vm, el, 'style', style);
}

/**
 * add an event type and handler to an element and generate a dom update
 */
function setEvent (vm, el, type, handler) {
  el.addEvent(type, bind(handler, vm));
}

/**
 * add all events of an element
 */
function bindEvents (vm, el, events) {
  if (!events) {
    return
  }
  var keys = Object.keys(events);
  var i = keys.length;
  while (i--) {
    var key = keys[i];
    var handler = events[key];
    if (typeof handler === 'string') {
      handler = vm[handler];
      /* istanbul ignore if */
      if (!handler) {
        console.warn(("[JS Framework] The event handler \"" + handler + "\" is not defined."));
      }
    }
    setEvent(vm, el, key, handler);
  }
}

/**
 * set a series of members as a kind of an element
 * for example: style, attr, ...
 * if the value is a function then bind the data changes
 */
function bindDir (vm, el, name, data) {
  if (!data) {
    return
  }
  var keys = Object.keys(data);
  var i = keys.length;
  while (i--) {
    var key = keys[i];
    var value = data[key];
    if (typeof value === 'function') {
      bindKey(vm, el, name, key, value);
    }
    else {
      el[SETTERS[name]](key, value);
    }
  }
}

/**
 * bind data changes to a certain key to a name series in an element
 */
function bindKey (vm, el, name, key, calc) {
  var methodName = SETTERS[name];
  // watch the calc, and returns a value by calc.call()
  var value = watch(vm, calc, function (value) {
    function handler () {
      el[methodName](key, value);
    }
    var differ = vm && vm._app && vm._app.differ;
    if (differ) {
      differ.append('element', el.depth || 0, el.ref, handler);
    }
    else {
      handler();
    }
  });

  el[methodName](key, value);
}

/**
 * watch a calc function and callback if the calc value changes
 */
function watch (vm, calc, callback) {
  if (vm._static) {
    return calc.call(vm, vm)
  }
  var watcher = new Watcher(vm, calc, function (value, oldValue) {
    /* istanbul ignore if */
    if (typeof value !== 'object' && value === oldValue) {
      return
    }
    callback(value);
  });

  return watcher.value
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
 * @fileOverview Document & Element Helpers.
 *
 * required:
 * Document#: createElement, createComment, getRef
 * Element#: appendChild, insertBefore, removeChild, nextSibling
 */

/**
 * Create a body by type
 * Using this._app.doc
 *
 * @param  {string} type
 */
function createBody (vm, type) {
  var doc = vm._app.doc;
  return doc.createBody(type)
}

/**
 * Create an element by type
 * Using this._app.doc
 *
 * @param  {string} type
 */
function createElement (vm, type) {
  var doc = vm._app.doc;
  return doc.createElement(type)
}

/**
 * Create and return a frag block for an element.
 * The frag block has a starter, ender and the element itself.
 *
 * @param  {object} element
 */
function createBlock (vm, element) {
  var start = createBlockStart(vm);
  var end = createBlockEnd(vm);
  var blockId = lastestBlockId++;
  if (element.element) {
    var updateMark = element.updateMark;
    if (updateMark) {
      if (updateMark.element) {
        updateMark = updateMark.end;
      }
      element.element.insertAfter(end, updateMark);
      element.element.insertAfter(start, updateMark);
      element.updateMark = end;
    }
    else {
      element.element.insertBefore(start, element.end);
      element.element.insertBefore(end, element.end);
    }
    element = element.element;
  }
  else {
    element.appendChild(start);
    element.appendChild(end);
  }
  return { start: start, end: end, element: element, blockId: blockId }
}

var lastestBlockId = 1;

/**
 * Create and return a block starter.
 * Using this._app.doc
 */
function createBlockStart (vm) {
  var doc = vm._app.doc;
  var anchor = doc.createComment('start');
  return anchor
}

/**
 * Create and return a block ender.
 * Using this._app.doc
 */
function createBlockEnd (vm) {
  var doc = vm._app.doc;
  var anchor = doc.createComment('end');
  return anchor
}

/**
 * Attach target to a certain dest using appendChild by default.
 * If the dest is a frag block then insert before the ender.
 * If the target is a frag block then attach the starter and ender in order.
 *
 * @param  {object} target
 * @param  {object} dest
 */
function attachTarget (vm, target, dest) {
  if (dest.element) {
    var before = dest.end;
    var after = dest.updateMark;
    // push new target for watch list update later
    if (dest.children) {
      dest.children.push(target);
    }
    // for check repeat case
    if (after) {
      var signal = moveTarget(vm, target, after);
      dest.updateMark = target.element ? target.end : target;
      return signal
    }
    else if (target.element) {
      dest.element.insertBefore(target.start, before);
      dest.element.insertBefore(target.end, before);
    }
    else {
      return dest.element.insertBefore(target, before)
    }
  }
  else {
    if (target.element) {
      dest.appendChild(target.start);
      dest.appendChild(target.end);
    }
    else {
      return dest.appendChild(target)
    }
  }
}

/**
 * Move target before a certain element. The target maybe block or element.
 *
 * @param  {object} target
 * @param  {object} before
 */
function moveTarget (vm, target, after) {
  if (target.element) {
    return moveBlock(target, after)
  }
  return moveElement(target, after)
}

/**
 * Move element before a certain element.
 *
 * @param  {object} element
 * @param  {object} before
 */
function moveElement (element, after) {
  var parent = after.parentNode;
  if (parent) {
    return parent.insertAfter(element, after)
  }
}

/**
 * Move all elements of the block before a certain element.
 *
 * @param  {object} fragBlock
 * @param  {object} before
 */
function moveBlock (fragBlock, after) {
  var parent = after.parentNode;

  if (parent) {
    var el = fragBlock.start;
    var signal;
    var group = [el];

    while (el && el !== fragBlock.end) {
      el = el.nextSibling;
      group.push(el);
    }

    var temp = after;
    group.every(function (el) {
      signal = parent.insertAfter(el, temp);
      temp = el;
      return signal !== -1
    });

    return signal
  }
}

/**
 * Remove target from DOM tree.
 * If the target is a frag block then call _removeBlock
 *
 * @param  {object} target
 */
function removeTarget (vm, target, preserveBlock) {
  if ( preserveBlock === void 0 ) preserveBlock = false;

  if (target.element) {
    removeBlock(target, preserveBlock);
  }
  else {
    removeElement(target);
  }
  if (target._vm) {
    target._vm.$emit('hook:destroyed');
  }
}

/**
 * Remove a certain element.
 * Using this._app.doc
 *
 * @param  {object} target
 */
function removeElement (target) {
  var parent = target.parentNode;

  if (parent) {
    parent.removeChild(target);
  }
}

/**
 * Remove a frag block.
 * The second param decides whether the block self should be removed too.
 *
 * @param  {object}  fragBlock
 * @param  {Boolean} preserveBlock=false
 */
function removeBlock (fragBlock, preserveBlock) {
  if ( preserveBlock === void 0 ) preserveBlock = false;

  var result = [];
  var el = fragBlock.start.nextSibling;

  while (el && el !== fragBlock.end) {
    result.push(el);
    el = el.nextSibling;
  }

  if (!preserveBlock) {
    removeElement(fragBlock.start);
  }
  result.forEach(function (el) {
    removeElement(el);
  });
  if (!preserveBlock) {
    removeElement(fragBlock.end);
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
/**
 * @fileOverview
 * ViewModel template parser & data-binding process
 */

/**
 * build()
 *   compile(template, parentNode)
 *     if (type is content) create contentNode
 *     else if (dirs have v-for) foreach -> create context
 *       -> compile(templateWithoutFor, parentNode): diff(list) onchange
 *     else if (dirs have v-if) assert
 *       -> compile(templateWithoutIf, parentNode): toggle(shown) onchange
 *     else if (type is dynamic)
 *       -> compile(templateWithoutDynamicType, parentNode): watch(type) onchange
 *     else if (type is custom)
 *       addChildVm(vm, parentVm)
 *       build(externalDirs)
 *       foreach childNodes -> compile(childNode, template)
 *     else if (type is native)
 *       set(dirs): update(id/attr/style/class) onchange
 *       append(template, parentNode)
 *       foreach childNodes -> compile(childNode, template)
 */
function build (vm) {
  var opt = vm._options || {};
  var template = opt.template || {};

  if (opt.replace) {
    if (template.children && template.children.length === 1) {
      compile(vm, template.children[0], vm._parentEl);
    }
    else {
      compile(vm, template.children, vm._parentEl);
    }
  }
  else {
    compile(vm, template, vm._parentEl);
  }

  console.debug(("[JS Framework] \"ready\" lifecycle in Vm(" + (vm._type) + ")"));
  vm.$emit('hook:ready');
  vm._ready = true;
}

/**
 * Generate elements by child or children and append to parent elements.
 * Root element info would be merged if has. The first argument may be an array
 * if the root element with options.replace has not only one child.
 *
 * @param {object|array} target
 * @param {object}       dest
 * @param {object}       meta
 */
function compile (vm, target, dest, meta) {
  var app = vm._app || {};

  if (app.lastSignal === -1) {
    return
  }

  if (target.attr && target.attr.hasOwnProperty('static')) {
    vm._static = true;
  }

  if (targetIsFragment(target)) {
    compileFragment(vm, target, dest, meta);
    return
  }
  meta = meta || {};
  if (targetIsContent(target)) {
    console.debug('[JS Framework] compile "content" block by', target);
    vm._content = createBlock(vm, dest);
    return
  }

  if (targetNeedCheckRepeat(target, meta)) {
    console.debug('[JS Framework] compile "repeat" logic by', target);
    if (dest.type === 'document') {
      console.warn('[JS Framework] The root element does\'t support `repeat` directive!');
    }
    else {
      compileRepeat(vm, target, dest);
    }
    return
  }
  if (targetNeedCheckShown(target, meta)) {
    console.debug('[JS Framework] compile "if" logic by', target);
    if (dest.type === 'document') {
      console.warn('[JS Framework] The root element does\'t support `if` directive!');
    }
    else {
      compileShown(vm, target, dest, meta);
    }
    return
  }
  var typeGetter = meta.type || target.type;
  if (targetNeedCheckType(typeGetter, meta)) {
    compileType(vm, target, dest, typeGetter, meta);
    return
  }
  var type = typeGetter;
  var component = targetIsComposed(vm, target, type);
  if (component) {
    console.debug('[JS Framework] compile composed component by', target);
    compileCustomComponent(vm, component, target, dest, type, meta);
    return
  }
  console.debug('[JS Framework] compile native component by', target);
  compileNativeComponent(vm, target, dest, type);
}

/**
 * Check if target is a fragment (an array).
 *
 * @param  {object}  target
 * @return {boolean}
 */
function targetIsFragment (target) {
  return Array.isArray(target)
}

/**
 * Check if target type is content/slot.
 *
 * @param  {object}  target
 * @return {boolean}
 */
function targetIsContent (target) {
  return target.type === 'content' || target.type === 'slot'
}

/**
 * Check if target need to compile by a list.
 *
 * @param  {object}  target
 * @param  {object}  meta
 * @return {boolean}
 */
function targetNeedCheckRepeat (target, meta) {
  return !meta.hasOwnProperty('repeat') && target.repeat
}

/**
 * Check if target need to compile by a boolean value.
 *
 * @param  {object}  target
 * @param  {object}  meta
 * @return {boolean}
 */
function targetNeedCheckShown (target, meta) {
  return !meta.hasOwnProperty('shown') && target.shown
}

/**
 * Check if target need to compile by a dynamic type.
 *
 * @param  {string|function} typeGetter
 * @param  {object}          meta
 * @return {boolean}
 */
function targetNeedCheckType (typeGetter, meta) {
  return (typeof typeGetter === 'function') && !meta.hasOwnProperty('type')
}

/**
 * Check if this kind of component is composed.
 *
 * @param  {string}  type
 * @return {boolean}
 */
function targetIsComposed (vm, target, type) {
  var component;
  if (vm._app && vm._app.customComponentMap) {
    component = vm._app.customComponentMap[type];
  }
  if (vm._options && vm._options.components) {
    component = vm._options.components[type];
  }
  if (target.component) {
    component = component || {};
  }
  return component
}

/**
 * Compile a list of targets.
 *
 * @param {object} target
 * @param {object} dest
 * @param {object} meta
 */
function compileFragment (vm, target, dest, meta) {
  var fragBlock = createBlock(vm, dest);
  target.forEach(function (child) {
    compile(vm, child, fragBlock, meta);
  });
}

/**
 * Compile a target with repeat directive.
 *
 * @param {object} target
 * @param {object} dest
 */
function compileRepeat (vm, target, dest) {
  var repeat = target.repeat;
  var oldStyle = typeof repeat === 'function';
  var getter = repeat.getter || repeat.expression || repeat;
  if (typeof getter !== 'function') {
    getter = function () { return [] };
  }
  var key = repeat.key || '$index';
  var value = repeat.value || '$value';
  var trackBy = repeat.trackBy || target.trackBy ||
    (target.attr && target.attr.trackBy);

  var fragBlock = createBlock(vm, dest);
  fragBlock.children = [];
  fragBlock.data = [];
  fragBlock.vms = [];

  bindRepeat(vm, target, fragBlock, { getter: getter, key: key, value: value, trackBy: trackBy, oldStyle: oldStyle });
}

/**
 * Compile a target with if directive.
 *
 * @param {object} target
 * @param {object} dest
 * @param {object} meta
 */
function compileShown (vm, target, dest, meta) {
  var newMeta = { shown: true };
  var fragBlock = createBlock(vm, dest);

  if (dest.element && dest.children) {
    dest.children.push(fragBlock);
  }

  if (meta.repeat) {
    newMeta.repeat = meta.repeat;
  }

  bindShown(vm, target, fragBlock, newMeta);
}

/**
 * Compile a target with dynamic component type.
 *
 * @param {object}   target
 * @param {object}   dest
 * @param {function} typeGetter
 */
function compileType (vm, target, dest, typeGetter, meta) {
  var type = typeGetter.call(vm);
  var newMeta = extend({ type: type }, meta);
  var fragBlock = createBlock(vm, dest);

  if (dest.element && dest.children) {
    dest.children.push(fragBlock);
  }

  watch(vm, typeGetter, function (value) {
    var newMeta = extend({ type: value }, meta);
    removeTarget(vm, fragBlock, true);
    compile(vm, target, fragBlock, newMeta);
  });

  compile(vm, target, fragBlock, newMeta);
}

/**
 * Compile a composed component.
 *
 * @param {object} target
 * @param {object} dest
 * @param {string} type
 */
function compileCustomComponent (vm, component, target, dest, type, meta) {
  var Ctor = vm.constructor;
  var subVm = new Ctor(type, component, vm, dest, undefined, {
    'hook:init': function () {
      if (vm._static) {
        this._static = vm._static;
      }
      setId$1(vm, null, target.id, this);
      // bind template earlier because of lifecycle issues
      this._externalBinding = {
        parent: vm,
        template: target
      };
    },
    'hook:created': function () {
      bindSubVm(vm, this, target, meta.repeat);
    },
    'hook:ready': function () {
      if (this._content) {
        compileChildren(vm, target, this._content);
      }
    }
  });
  bindSubVmAfterInitialized(vm, subVm, target, dest);
}

/**
 * Generate element from template and attach to the dest if needed.
 * The time to attach depends on whether the mode status is node or tree.
 *
 * @param {object} template
 * @param {object} dest
 * @param {string} type
 */
function compileNativeComponent (vm, template, dest, type) {
  applyNaitveComponentOptions(template);

  var element;
  if (dest.ref === '_documentElement') {
    // if its parent is documentElement then it's a body
    console.debug(("[JS Framework] compile to create body for " + type));
    element = createBody(vm, type);
  }
  else {
    console.debug(("[JS Framework] compile to create element for " + type));
    element = createElement(vm, type);
  }

  if (!vm._rootEl) {
    vm._rootEl = element;
    // bind event earlier because of lifecycle issues
    var binding = vm._externalBinding || {};
    var target = binding.template;
    var parentVm = binding.parent;
    if (target && target.events && parentVm && element) {
      for (var type$1 in target.events) {
        var handler = parentVm[target.events[type$1]];
        if (handler) {
          element.addEvent(type$1, bind(handler, parentVm));
        }
      }
    }
  }

  bindElement(vm, element, template);

  if (template.attr && template.attr.append) { // backward, append prop in attr
    template.append = template.attr.append;
  }

  if (template.append) { // give the append attribute for ios adaptation
    element.attr = element.attr || {};
    element.attr.append = template.append;
  }

  var treeMode = template.append === 'tree';
  var app = vm._app || {};
  if (app.lastSignal !== -1 && !treeMode) {
    console.debug('[JS Framework] compile to append single node for', element);
    app.lastSignal = attachTarget(vm, element, dest);
  }
  if (app.lastSignal !== -1) {
    compileChildren(vm, template, element);
  }
  if (app.lastSignal !== -1 && treeMode) {
    console.debug('[JS Framework] compile to append whole tree for', element);
    app.lastSignal = attachTarget(vm, element, dest);
  }
}

/**
 * Set all children to a certain parent element.
 *
 * @param {object} template
 * @param {object} dest
 */
function compileChildren (vm, template, dest) {
  var app = vm._app || {};
  var children = template.children;
  if (children && children.length) {
    children.every(function (child) {
      compile(vm, child, dest);
      return app.lastSignal !== -1
    });
  }
}

/**
 * Watch the list update and refresh the changes.
 *
 * @param {object} target
 * @param {object} fragBlock {vms, data, children}
 * @param {object} info      {getter, key, value, trackBy, oldStyle}
 */
function bindRepeat (vm, target, fragBlock, info) {
  var vms = fragBlock.vms;
  var children = fragBlock.children;
  var getter = info.getter;
  var trackBy = info.trackBy;
  var oldStyle = info.oldStyle;
  var keyName = info.key;
  var valueName = info.value;

  function compileItem (item, index, context) {
    var mergedData;
    if (oldStyle) {
      mergedData = item;
      if (isObject(item)) {
        mergedData[keyName] = index;
        if (!mergedData.hasOwnProperty('INDEX')) {
          Object.defineProperty(mergedData, 'INDEX', {
            value: function () {
              console.warn('[JS Framework] "INDEX" in repeat is deprecated, ' +
                'please use "$index" instead');
            }
          });
        }
      }
      else {
        console.warn('[JS Framework] Each list item must be an object in old-style repeat, '
          + 'please use `repeat={{v in list}}` instead.');
        mergedData = {};
        mergedData[keyName] = index;
        mergedData[valueName] = item;
      }
    }
    else {
      mergedData = {};
      mergedData[keyName] = index;
      mergedData[valueName] = item;
    }
    var newContext = mergeContext(context, mergedData);
    vms.push(newContext);
    compile(newContext, target, fragBlock, { repeat: item });
  }

  var list = watchBlock(vm, fragBlock, getter, 'repeat',
    function (data) {
      console.debug('[JS Framework] the "repeat" item has changed', data);
      if (!fragBlock || !data) {
        return
      }

      var oldChildren = children.slice();
      var oldVms = vms.slice();
      var oldData = fragBlock.data.slice();
      // 1. collect all new refs track by
      var trackMap = {};
      var reusedMap = {};
      data.forEach(function (item, index) {
        var key = trackBy ? item[trackBy] : (oldStyle ? item[keyName] : index);
        /* istanbul ignore if */
        if (key == null || key === '') {
          return
        }
        trackMap[key] = item;
      });

      // 2. remove unused element foreach old item
      var reusedList = [];
      oldData.forEach(function (item, index) {
        var key = trackBy ? item[trackBy] : (oldStyle ? item[keyName] : index);
        if (trackMap.hasOwnProperty(key)) {
          reusedMap[key] = {
            item: item, index: index, key: key,
            target: oldChildren[index],
            vm: oldVms[index]
          };
          reusedList.push(item);
        }
        else {
          removeTarget(vm, oldChildren[index]);
        }
      });

      // 3. create new element foreach new item
      children.length = 0;
      vms.length = 0;
      fragBlock.data = data.slice();
      fragBlock.updateMark = fragBlock.start;

      data.forEach(function (item, index) {
        var key = trackBy ? item[trackBy] : (oldStyle ? item[keyName] : index);
        var reused = reusedMap[key];
        if (reused) {
          if (reused.item === reusedList[0]) {
            reusedList.shift();
          }
          else {
            reusedList.$remove(reused.item);
            moveTarget(vm, reused.target, fragBlock.updateMark, true);
          }
          children.push(reused.target);
          vms.push(reused.vm);
          if (oldStyle) {
            reused.vm = item;
          }
          else {
            reused.vm[valueName] = item;
          }
          reused.vm[keyName] = index;
          fragBlock.updateMark = reused.target;
        }
        else {
          compileItem(item, index, vm);
        }
      });

      delete fragBlock.updateMark;
    }
  );

  fragBlock.data = list.slice(0);
  list.forEach(function (item, index) {
    compileItem(item, index, vm);
  });
}

/**
 * Watch the display update and add/remove the element.
 *
 * @param  {object} target
 * @param  {object} fragBlock
 * @param  {object} context
 */
function bindShown (vm, target, fragBlock, meta) {
  var display = watchBlock(vm, fragBlock, target.shown, 'shown',
    function (display) {
      console.debug('[JS Framework] the "if" item was changed', display);

      if (!fragBlock || !!fragBlock.display === !!display) {
        return
      }
      fragBlock.display = !!display;
      if (display) {
        compile(vm, target, fragBlock, meta);
      }
      else {
        removeTarget(vm, fragBlock, true);
      }
    }
  );

  fragBlock.display = !!display;
  if (display) {
    compile(vm, target, fragBlock, meta);
  }
}

/**
 * Watch calc value changes and append certain type action to differ.
 * It is used for if or repeat data-binding generator.
 *
 * @param  {object}   fragBlock
 * @param  {function} calc
 * @param  {string}   type
 * @param  {function} handler
 * @return {any}      init value of calc
 */
function watchBlock (vm, fragBlock, calc, type, handler) {
  var differ = vm && vm._app && vm._app.differ;
  var config = {};
  var depth = (fragBlock.element.depth || 0) + 1;

  return watch(vm, calc, function (value) {
    config.latestValue = value;
    if (differ && !config.recorded) {
      differ.append(type, depth, fragBlock.blockId, function () {
        var latestValue = config.latestValue;
        handler(latestValue);
        config.recorded = false;
        config.latestValue = undefined;
      });
    }
    config.recorded = true;
  })
}

/**
 * Clone a context and merge certain data.
 *
 * @param  {object} mergedData
 * @return {object}
 */
function mergeContext (context, mergedData) {
  var newContext = Object.create(context);
  newContext._data = mergedData;
  initData(newContext);
  initComputed(newContext);
  newContext._realParent = context;
  if (context._static) {
    newContext._static = context._static;
  }
  return newContext
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
 * Everything about component event which includes event object, event listener,
 * event emitter and lifecycle hooks.
 */

/**
 * Event object definition. An event object has `type`, `timestamp` and
 * `detail` from which a component emit. The event object could be dispatched to
 * parents or broadcasted to children except `this.stop()` is called.
 * @param {string} type
 * @param {any}    detail
 */
function Evt (type, detail) {
  if (detail instanceof Evt) {
    return detail
  }

  this.timestamp = Date.now();
  this.detail = detail;
  this.type = type;

  var shouldStop = false;

  /**
   * stop dispatch and broadcast
   */
  this.stop = function () {
    shouldStop = true;
  };

  /**
   * check if it can't be dispatched or broadcasted
   */
  this.hasStopped = function () {
    return shouldStop
  };
}

/**
 * Emit an event but not broadcast down or dispatch up.
 * @param  {string} type
 * @param  {any}    detail
 */
function $emit (type, detail) {
  var this$1 = this;

  var events = this._vmEvents;
  var handlerList = events[type];
  if (handlerList) {
    var evt = new Evt(type, detail);
    handlerList.forEach(function (handler) {
      handler.call(this$1, evt);
    });
  }
}

/**
 * Emit an event and dispatch it up.
 * @param  {string} type
 * @param  {any}    detail
 */
function $dispatch (type, detail) {
  var evt = new Evt(type, detail);
  this.$emit(type, evt);

  if (!evt.hasStopped() && this._parent && this._parent.$dispatch) {
    this._parent.$dispatch(type, evt);
  }
}

/**
 * Emit an event and broadcast it down.
 * @param  {string} type
 * @param  {any}    detail
 */
function $broadcast (type, detail) {
  var evt = new Evt(type, detail);
  this.$emit(type, evt);

  if (!evt.hasStopped() && this._childrenVms) {
    this._childrenVms.forEach(function (subVm) {
      subVm.$broadcast(type, evt);
    });
  }
}

/**
 * Add event listener.
 * @param  {string}   type
 * @param  {function} handler
 */
function $on (type, handler) {
  if (!type || typeof handler !== 'function') {
    return
  }
  var events = this._vmEvents;
  var handlerList = events[type] || [];
  handlerList.push(handler);
  events[type] = handlerList;

  // fixed old version lifecycle design
  /* istanbul ignore if */
  if (type === 'hook:ready' && this._ready) {
    this.$emit('hook:ready');
  }
}

/**
 * Remove event listener.
 * @param  {string}   type
 * @param  {function} handler
 */
function $off (type, handler) {
  if (!type) {
    return
  }
  var events = this._vmEvents;
  if (!handler) {
    delete events[type];
    return
  }
  var handlerList = events[type];
  if (!handlerList) {
    return
  }
  handlerList.$remove(handler);
}

var LIFE_CYCLE_TYPES = ['init', 'created', 'ready', 'destroyed'];

/**
 * Init events:
 * 1. listen `events` in component options & `externalEvents`.
 * 2. bind lifecycle hooks.
 * @param  {Vm}     vm
 * @param  {object} externalEvents
 */
function initEvents (vm, externalEvents) {
  var options = vm._options || {};
  var events = options.events || {};
  for (var type1 in events) {
    vm.$on(type1, events[type1]);
  }
  for (var type2 in externalEvents) {
    vm.$on(type2, externalEvents[type2]);
  }
  LIFE_CYCLE_TYPES.forEach(function (type) {
    vm.$on(("hook:" + type), options[type]);
  });
}

/**
 * Bind event related methods to ViewModel instance.
 * @param  {Vm} vm
 */
function mixinEvents (vm) {
  vm.$emit = $emit;
  vm.$dispatch = $dispatch;
  vm.$broadcast = $broadcast;
  vm.$on = $on;
  vm.$off = $off;
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
 * ViewModel Constructor & definition
 */

/**
 * ViewModel constructor
 *
 * @param {string} type
 * @param {object} options    component options
 * @param {object} parentVm   which contains _app
 * @param {object} parentEl   root element or frag block
 * @param {object} mergedData external data
 * @param {object} externalEvents external events
 */
function Vm (
  type,
  options,
  parentVm,
  parentEl,
  mergedData,
  externalEvents
) {
  parentVm = parentVm || {};
  this._parent = parentVm._realParent ? parentVm._realParent : parentVm;
  this._app = parentVm._app || {};
  parentVm._childrenVms && parentVm._childrenVms.push(this);

  if (!options && this._app.customComponentMap) {
    options = this._app.customComponentMap[type];
  }
  options = options || {};

  var data = options.data || {};

  this._options = options;
  this._methods = options.methods || {};
  this._computed = options.computed || {};
  this._css = options.style || {};
  this._ids = {};
  this._vmEvents = {};
  this._childrenVms = [];
  this._type = type;

  // bind events and lifecycles
  initEvents(this, externalEvents);

  console.debug(("[JS Framework] \"init\" lifecycle in Vm(" + (this._type) + ")"));
  this.$emit('hook:init');
  this._inited = true;

  // proxy data and methods
  // observe data and add this to vms
  this._data = typeof data === 'function' ? data() : data;
  if (mergedData) {
    extend(this._data, mergedData);
  }
  initState(this);

  console.debug(("[JS Framework] \"created\" lifecycle in Vm(" + (this._type) + ")"));
  this.$emit('hook:created');
  this._created = true;

  // backward old ready entry
  if (options.methods && options.methods.ready) {
    console.warn('"exports.methods.ready" is deprecated, ' +
      'please use "exports.created" instead');
    options.methods.ready.call(this);
  }

  if (!this._app.doc) {
    return
  }

  // if no parentElement then specify the documentElement
  this._parentEl = parentEl || this._app.doc.documentElement;
  build(this);
}

mixinEvents(Vm.prototype);

/**
 * Watch an function and bind all the data appeared in it. When the related
 * data changes, the callback will be called with new value as 1st param.
 *
 * @param {Function} fn
 * @param {Function} callback
 */
Vm.prototype.$watch = function (fn, callback) {
  watch(this, fn, callback);
};

Vm.set = set;
Vm.delete = del;

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
var nativeModules = {};

// for testing

/**
 * for testing
 */


/**
 * for testing
 */


// for framework

/**
 * init modules for an app instance
 * the second param determines whether to replace an existed method
 */
function initModules (modules, ifReplace) {
  var loop = function ( moduleName ) {
    // init `modules[moduleName][]`
    var methods = nativeModules[moduleName];
    if (!methods) {
      methods = {};
      nativeModules[moduleName] = methods;
    }

    // push each non-existed new method
    modules[moduleName].forEach(function (method) {
      if (typeof method === 'string') {
        method = {
          name: method
        };
      }

      if (!methods[method.name] || ifReplace) {
        methods[method.name] = method;
      }
    });
  };

  for (var moduleName in modules) loop( moduleName );
}

/**
 * init app methods
 */
function initMethods$1 (Vm, apis) {
  var p = Vm.prototype;

  for (var apiName in apis) {
    if (!p.hasOwnProperty(apiName)) {
      p[apiName] = apis[apiName];
    }
  }
}

/**
 * get a module of methods for an app instance
 */
function requireModule (app, name) {
  var methods = nativeModules[name];
  var target = {};
  var loop = function ( methodName ) {
    Object.defineProperty(target, methodName, {
      configurable: true,
      enumerable: true,
      get: function moduleGetter () {
        return function () {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          return app.callTasks({
          module: name,
          method: methodName,
          args: args
        });
        }
      },
      set: function moduleSetter (value) {
        if (typeof value === 'function') {
          return app.callTasks({
            module: name,
            method: methodName,
            args: [value]
          })
        }
      }
    });
  };

  for (var methodName in methods) loop( methodName );
  return target
}

/**
 * get a custom component options
 */
function requireCustomComponent (app, name) {
  var customComponentMap = app.customComponentMap;
  return customComponentMap[name]
}

/**
 * register a custom component options
 */
function registerCustomComponent (app, name, def) {
  var customComponentMap = app.customComponentMap;

  if (customComponentMap[name]) {
    console.error(("[JS Framework] define a component(" + name + ") that already exists"));
    return
  }

  customComponentMap[name] = def;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var semver = createCommonjsModule(function (module, exports) {
exports = module.exports = SemVer;

// The debug function is excluded entirely from the minified version.
/* nomin */ var debug;
/* nomin */ if (typeof process === 'object' &&
    /* nomin */ process.env &&
    /* nomin */ false &&
    /* nomin */ /\bsemver\b/i.test(false))
  /* nomin */ { debug = function() {
    /* nomin */ var args = Array.prototype.slice.call(arguments, 0);
    /* nomin */ args.unshift('SEMVER');
    /* nomin */ console.log.apply(console, args);
    /* nomin */ }; }
/* nomin */ else
  /* nomin */ { debug = function() {}; }

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0';

var MAX_LENGTH = 256;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;

// The actual regexps go on exports.re
var re = exports.re = [];
var src = exports.src = [];
var R = 0;

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

var NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
var NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';


// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

var NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';


// ## Main Version
// Three dot-separated numeric identifiers.

var MAINVERSION = R++;
src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')';

var MAINVERSIONLOOSE = R++;
src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

var PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
                            '|' + src[NONNUMERICIDENTIFIER] + ')';

var PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
                                 '|' + src[NONNUMERICIDENTIFIER] + ')';


// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

var PRERELEASE = R++;
src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

var PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

var BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

var BUILD = R++;
src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';


// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

var FULL = R++;
var FULLPLAIN = 'v?' + src[MAINVERSION] +
                src[PRERELEASE] + '?' +
                src[BUILD] + '?';

src[FULL] = '^' + FULLPLAIN + '$';

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
                 src[PRERELEASELOOSE] + '?' +
                 src[BUILD] + '?';

var LOOSE = R++;
src[LOOSE] = '^' + LOOSEPLAIN + '$';

var GTLT = R++;
src[GTLT] = '((?:<|>)?=?)';

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
var XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
var XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

var XRANGEPLAIN = R++;
src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:' + src[PRERELEASE] + ')?' +
                   src[BUILD] + '?' +
                   ')?)?';

var XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:' + src[PRERELEASELOOSE] + ')?' +
                        src[BUILD] + '?' +
                        ')?)?';

var XRANGE = R++;
src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
var XRANGELOOSE = R++;
src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

// Tilde ranges.
// Meaning is "reasonably at or greater than"
var LONETILDE = R++;
src[LONETILDE] = '(?:~>?)';

var TILDETRIM = R++;
src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
var tildeTrimReplace = '$1~';

var TILDE = R++;
src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
var TILDELOOSE = R++;
src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

// Caret ranges.
// Meaning is "at least and backwards compatible with"
var LONECARET = R++;
src[LONECARET] = '(?:\\^)';

var CARETTRIM = R++;
src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
var caretTrimReplace = '$1^';

var CARET = R++;
src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
var CARETLOOSE = R++;
src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

// A simple gt/lt/eq thing, or just "" to indicate "any version"
var COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
var COMPARATOR = R++;
src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';


// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
var COMPARATORTRIM = R++;
src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

// this one has to use the /g flag
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
var comparatorTrimReplace = '$1$2$3';


// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
var HYPHENRANGE = R++;
src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
                   '\\s+-\\s+' +
                   '(' + src[XRANGEPLAIN] + ')' +
                   '\\s*$';

var HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s+-\\s+' +
                        '(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s*$';

// Star ranges basically just allow anything at all.
var STAR = R++;
src[STAR] = '(<|>)?=?\\s*\\*';

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  debug(i, src[i]);
  if (!re[i])
    { re[i] = new RegExp(src[i]); }
}

exports.parse = parse;
function parse(version, loose) {
  if (version instanceof SemVer)
    { return version; }

  if (typeof version !== 'string')
    { return null; }

  if (version.length > MAX_LENGTH)
    { return null; }

  var r = loose ? re[LOOSE] : re[FULL];
  if (!r.test(version))
    { return null; }

  try {
    return new SemVer(version, loose);
  } catch (er) {
    return null;
  }
}

exports.valid = valid;
function valid(version, loose) {
  var v = parse(version, loose);
  return v ? v.version : null;
}


exports.clean = clean;
function clean(version, loose) {
  var s = parse(version.trim().replace(/^[=v]+/, ''), loose);
  return s ? s.version : null;
}

exports.SemVer = SemVer;

function SemVer(version, loose) {
  if (version instanceof SemVer) {
    if (version.loose === loose)
      { return version; }
    else
      { version = version.version; }
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version);
  }

  if (version.length > MAX_LENGTH)
    { throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters') }

  if (!(this instanceof SemVer))
    { return new SemVer(version, loose); }

  debug('SemVer', version, loose);
  this.loose = loose;
  var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);

  if (!m)
    { throw new TypeError('Invalid Version: ' + version); }

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0)
    { throw new TypeError('Invalid major version') }

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0)
    { throw new TypeError('Invalid minor version') }

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0)
    { throw new TypeError('Invalid patch version') }

  // numberify any prerelease numeric ids
  if (!m[4])
    { this.prerelease = []; }
  else
    { this.prerelease = m[4].split('.').map(function(id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id;
        if (num >= 0 && num < MAX_SAFE_INTEGER)
          { return num; }
      }
      return id;
    }); }

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function() {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  if (this.prerelease.length)
    { this.version += '-' + this.prerelease.join('.'); }
  return this.version;
};

SemVer.prototype.toString = function() {
  return this.version;
};

SemVer.prototype.compare = function(other) {
  debug('SemVer.compare', this.version, this.loose, other);
  if (!(other instanceof SemVer))
    { other = new SemVer(other, this.loose); }

  return this.compareMain(other) || this.comparePre(other);
};

SemVer.prototype.compareMain = function(other) {
  if (!(other instanceof SemVer))
    { other = new SemVer(other, this.loose); }

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch);
};

SemVer.prototype.comparePre = function(other) {
  var this$1 = this;

  if (!(other instanceof SemVer))
    { other = new SemVer(other, this.loose); }

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length)
    { return -1; }
  else if (!this.prerelease.length && other.prerelease.length)
    { return 1; }
  else if (!this.prerelease.length && !other.prerelease.length)
    { return 0; }

  var i = 0;
  do {
    var a = this$1.prerelease[i];
    var b = other.prerelease[i];
    debug('prerelease compare', i, a, b);
    if (a === undefined && b === undefined)
      { return 0; }
    else if (b === undefined)
      { return 1; }
    else if (a === undefined)
      { return -1; }
    else if (a === b)
      { continue; }
    else
      { return compareIdentifiers(a, b); }
  } while (++i);
};

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function(release, identifier) {
  var this$1 = this;

  switch (release) {
    case 'premajor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor = 0;
      this.major++;
      this.inc('pre', identifier);
      break;
    case 'preminor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor++;
      this.inc('pre', identifier);
      break;
    case 'prepatch':
      // If this is already a prerelease, it will bump to the next version
      // drop any prereleases that might already exist, since they are not
      // relevant at this point.
      this.prerelease.length = 0;
      this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case 'prerelease':
      if (this.prerelease.length === 0)
        { this.inc('patch', identifier); }
      this.inc('pre', identifier);
      break;

    case 'major':
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0)
        { this.major++; }
      this.minor = 0;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'minor':
      // If this is a pre-minor version, bump up to the same minor version.
      // Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      if (this.patch !== 0 || this.prerelease.length === 0)
        { this.minor++; }
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0)
        { this.patch++; }
      this.prerelease = [];
      break;
    // This probably shouldn't be used publicly.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0)
        { this.prerelease = [0]; }
      else {
        var i = this.prerelease.length;
        while (--i >= 0) {
          if (typeof this$1.prerelease[i] === 'number') {
            this$1.prerelease[i]++;
            i = -2;
          }
        }
        if (i === -1) // didn't increment anything
          { this.prerelease.push(0); }
      }
      if (identifier) {
        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
        if (this.prerelease[0] === identifier) {
          if (isNaN(this.prerelease[1]))
            { this.prerelease = [identifier, 0]; }
        } else
          { this.prerelease = [identifier, 0]; }
      }
      break;

    default:
      throw new Error('invalid increment argument: ' + release);
  }
  this.format();
  this.raw = this.version;
  return this;
};

exports.inc = inc;
function inc(version, release, loose, identifier) {
  if (typeof(loose) === 'string') {
    identifier = loose;
    loose = undefined;
  }

  try {
    return new SemVer(version, loose).inc(release, identifier).version;
  } catch (er) {
    return null;
  }
}

exports.diff = diff;
function diff(version1, version2) {
  if (eq(version1, version2)) {
    return null;
  } else {
    var v1 = parse(version1);
    var v2 = parse(version2);
    if (v1.prerelease.length || v2.prerelease.length) {
      for (var key in v1) {
        if (key === 'major' || key === 'minor' || key === 'patch') {
          if (v1[key] !== v2[key]) {
            return 'pre'+key;
          }
        }
      }
      return 'prerelease';
    }
    for (var key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return key;
        }
      }
    }
  }
}

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers(a, b) {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return (anum && !bnum) ? -1 :
         (bnum && !anum) ? 1 :
         a < b ? -1 :
         a > b ? 1 :
         0;
}

exports.rcompareIdentifiers = rcompareIdentifiers;
function rcompareIdentifiers(a, b) {
  return compareIdentifiers(b, a);
}

exports.major = major;
function major(a, loose) {
  return new SemVer(a, loose).major;
}

exports.minor = minor;
function minor(a, loose) {
  return new SemVer(a, loose).minor;
}

exports.patch = patch;
function patch(a, loose) {
  return new SemVer(a, loose).patch;
}

exports.compare = compare;
function compare(a, b, loose) {
  return new SemVer(a, loose).compare(new SemVer(b, loose));
}

exports.compareLoose = compareLoose;
function compareLoose(a, b) {
  return compare(a, b, true);
}

exports.rcompare = rcompare;
function rcompare(a, b, loose) {
  return compare(b, a, loose);
}

exports.sort = sort;
function sort(list, loose) {
  return list.sort(function(a, b) {
    return exports.compare(a, b, loose);
  });
}

exports.rsort = rsort;
function rsort(list, loose) {
  return list.sort(function(a, b) {
    return exports.rcompare(a, b, loose);
  });
}

exports.gt = gt;
function gt(a, b, loose) {
  return compare(a, b, loose) > 0;
}

exports.lt = lt;
function lt(a, b, loose) {
  return compare(a, b, loose) < 0;
}

exports.eq = eq;
function eq(a, b, loose) {
  return compare(a, b, loose) === 0;
}

exports.neq = neq;
function neq(a, b, loose) {
  return compare(a, b, loose) !== 0;
}

exports.gte = gte;
function gte(a, b, loose) {
  return compare(a, b, loose) >= 0;
}

exports.lte = lte;
function lte(a, b, loose) {
  return compare(a, b, loose) <= 0;
}

exports.cmp = cmp;
function cmp(a, op, b, loose) {
  var ret;
  switch (op) {
    case '===':
      if (typeof a === 'object') { a = a.version; }
      if (typeof b === 'object') { b = b.version; }
      ret = a === b;
      break;
    case '!==':
      if (typeof a === 'object') { a = a.version; }
      if (typeof b === 'object') { b = b.version; }
      ret = a !== b;
      break;
    case '': case '=': case '==': ret = eq(a, b, loose); break;
    case '!=': ret = neq(a, b, loose); break;
    case '>': ret = gt(a, b, loose); break;
    case '>=': ret = gte(a, b, loose); break;
    case '<': ret = lt(a, b, loose); break;
    case '<=': ret = lte(a, b, loose); break;
    default: throw new TypeError('Invalid operator: ' + op);
  }
  return ret;
}

exports.Comparator = Comparator;
function Comparator(comp, loose) {
  if (comp instanceof Comparator) {
    if (comp.loose === loose)
      { return comp; }
    else
      { comp = comp.value; }
  }

  if (!(this instanceof Comparator))
    { return new Comparator(comp, loose); }

  debug('comparator', comp, loose);
  this.loose = loose;
  this.parse(comp);

  if (this.semver === ANY)
    { this.value = ''; }
  else
    { this.value = this.operator + this.semver.version; }

  debug('comp', this);
}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m)
    { throw new TypeError('Invalid comparator: ' + comp); }

  this.operator = m[1];
  if (this.operator === '=')
    { this.operator = ''; }

  // if it literally is just '>' or '' then allow anything.
  if (!m[2])
    { this.semver = ANY; }
  else
    { this.semver = new SemVer(m[2], this.loose); }
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {
  debug('Comparator.test', version, this.loose);

  if (this.semver === ANY)
    { return true; }

  if (typeof version === 'string')
    { version = new SemVer(version, this.loose); }

  return cmp(version, this.operator, this.semver, this.loose);
};

Comparator.prototype.intersects = function(comp, loose) {
  if (!(comp instanceof Comparator)) {
    throw new TypeError('a Comparator is required');
  }

  var rangeTmp;

  if (this.operator === '') {
    rangeTmp = new Range(comp.value, loose);
    return satisfies(this.value, rangeTmp, loose);
  } else if (comp.operator === '') {
    rangeTmp = new Range(this.value, loose);
    return satisfies(comp.semver, rangeTmp, loose);
  }

  var sameDirectionIncreasing =
    (this.operator === '>=' || this.operator === '>') &&
    (comp.operator === '>=' || comp.operator === '>');
  var sameDirectionDecreasing =
    (this.operator === '<=' || this.operator === '<') &&
    (comp.operator === '<=' || comp.operator === '<');
  var sameSemVer = this.semver.version === comp.semver.version;
  var differentDirectionsInclusive =
    (this.operator === '>=' || this.operator === '<=') &&
    (comp.operator === '>=' || comp.operator === '<=');
  var oppositeDirectionsLessThan =
    cmp(this.semver, '<', comp.semver, loose) &&
    ((this.operator === '>=' || this.operator === '>') &&
    (comp.operator === '<=' || comp.operator === '<'));
  var oppositeDirectionsGreaterThan =
    cmp(this.semver, '>', comp.semver, loose) &&
    ((this.operator === '<=' || this.operator === '<') &&
    (comp.operator === '>=' || comp.operator === '>'));

  return sameDirectionIncreasing || sameDirectionDecreasing ||
    (sameSemVer && differentDirectionsInclusive) ||
    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan;
};


exports.Range = Range;
function Range(range, loose) {
  if (range instanceof Range) {
    if (range.loose === loose) {
      return range;
    } else {
      return new Range(range.raw, loose);
    }
  }

  if (range instanceof Comparator) {
    return new Range(range.value, loose);
  }

  if (!(this instanceof Range))
    { return new Range(range, loose); }

  this.loose = loose;

  // First, split based on boolean or ||
  this.raw = range;
  this.set = range.split(/\s*\|\|\s*/).map(function(range) {
    return this.parseRange(range.trim());
  }, this).filter(function(c) {
    // throw out any that are not relevant for whatever reason
    return c.length;
  });

  if (!this.set.length) {
    throw new TypeError('Invalid SemVer Range: ' + range);
  }

  this.format();
}

Range.prototype.format = function() {
  this.range = this.set.map(function(comps) {
    return comps.join(' ').trim();
  }).join('||').trim();
  return this.range;
};

Range.prototype.toString = function() {
  return this.range;
};

Range.prototype.parseRange = function(range) {
  var loose = this.loose;
  range = range.trim();
  debug('range', range, loose);
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  debug('hyphen replace', range);
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
  debug('comparator trim', range, re[COMPARATORTRIM]);

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[TILDETRIM], tildeTrimReplace);

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[CARETTRIM], caretTrimReplace);

  // normalize spaces
  range = range.split(/\s+/).join(' ');

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var set = range.split(' ').map(function(comp) {
    return parseComparator(comp, loose);
  }).join(' ').split(/\s+/);
  if (this.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function(comp) {
      return !!comp.match(compRe);
    });
  }
  set = set.map(function(comp) {
    return new Comparator(comp, loose);
  });

  return set;
};

Range.prototype.intersects = function(range, loose) {
  if (!(range instanceof Range)) {
    throw new TypeError('a Range is required');
  }

  return this.set.some(function(thisComparators) {
    return thisComparators.every(function(thisComparator) {
      return range.set.some(function(rangeComparators) {
        return rangeComparators.every(function(rangeComparator) {
          return thisComparator.intersects(rangeComparator, loose);
        });
      });
    });
  });
};

// Mostly just for testing and legacy API reasons
exports.toComparators = toComparators;
function toComparators(range, loose) {
  return new Range(range, loose).set.map(function(comp) {
    return comp.map(function(c) {
      return c.value;
    }).join(' ').trim().split(' ');
  });
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator(comp, loose) {
  debug('comp', comp);
  comp = replaceCarets(comp, loose);
  debug('caret', comp);
  comp = replaceTildes(comp, loose);
  debug('tildes', comp);
  comp = replaceXRanges(comp, loose);
  debug('xrange', comp);
  comp = replaceStars(comp, loose);
  debug('stars', comp);
  return comp;
}

function isX(id) {
  return !id || id.toLowerCase() === 'x' || id === '*';
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceTilde(comp, loose);
  }).join(' ');
}

function replaceTilde(comp, loose) {
  var r = loose ? re[TILDELOOSE] : re[TILDE];
  return comp.replace(r, function(_, M, m, p, pr) {
    debug('tilde', comp, _, M, m, p, pr);
    var ret;

    if (isX(M))
      { ret = ''; }
    else if (isX(m))
      { ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0'; }
    else if (isX(p))
      // ~1.2 == >=1.2.0 <1.3.0
      { ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0'; }
    else if (pr) {
      debug('replaceTilde pr', pr);
      if (pr.charAt(0) !== '-')
        { pr = '-' + pr; }
      ret = '>=' + M + '.' + m + '.' + p + pr +
            ' <' + M + '.' + (+m + 1) + '.0';
    } else
      // ~1.2.3 == >=1.2.3 <1.3.0
      { ret = '>=' + M + '.' + m + '.' + p +
            ' <' + M + '.' + (+m + 1) + '.0'; }

    debug('tilde return', ret);
    return ret;
  });
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceCaret(comp, loose);
  }).join(' ');
}

function replaceCaret(comp, loose) {
  debug('caret', comp, loose);
  var r = loose ? re[CARETLOOSE] : re[CARET];
  return comp.replace(r, function(_, M, m, p, pr) {
    debug('caret', comp, _, M, m, p, pr);
    var ret;

    if (isX(M))
      { ret = ''; }
    else if (isX(m))
      { ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0'; }
    else if (isX(p)) {
      if (M === '0')
        { ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0'; }
      else
        { ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0'; }
    } else if (pr) {
      debug('replaceCaret pr', pr);
      if (pr.charAt(0) !== '-')
        { pr = '-' + pr; }
      if (M === '0') {
        if (m === '0')
          { ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + m + '.' + (+p + 1); }
        else
          { ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + (+m + 1) + '.0'; }
      } else
        { ret = '>=' + M + '.' + m + '.' + p + pr +
              ' <' + (+M + 1) + '.0.0'; }
    } else {
      debug('no pr');
      if (M === '0') {
        if (m === '0')
          { ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + m + '.' + (+p + 1); }
        else
          { ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0'; }
      } else
        { ret = '>=' + M + '.' + m + '.' + p +
              ' <' + (+M + 1) + '.0.0'; }
    }

    debug('caret return', ret);
    return ret;
  });
}

function replaceXRanges(comp, loose) {
  debug('replaceXRanges', comp, loose);
  return comp.split(/\s+/).map(function(comp) {
    return replaceXRange(comp, loose);
  }).join(' ');
}

function replaceXRange(comp, loose) {
  comp = comp.trim();
  var r = loose ? re[XRANGELOOSE] : re[XRANGE];
  return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
    debug('xRange', comp, ret, gtlt, M, m, p, pr);
    var xM = isX(M);
    var xm = xM || isX(m);
    var xp = xm || isX(p);
    var anyX = xp;

    if (gtlt === '=' && anyX)
      { gtlt = ''; }

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0';
      } else {
        // nothing is forbidden
        ret = '*';
      }
    } else if (gtlt && anyX) {
      // replace X with 0
      if (xm)
        { m = 0; }
      if (xp)
        { p = 0; }

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = '>=';
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else if (xp) {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<';
        if (xm)
          { M = +M + 1; }
        else
          { m = +m + 1; }
      }

      ret = gtlt + M + '.' + m + '.' + p;
    } else if (xm) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    }

    debug('xRange return', ret);

    return ret;
  });
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp, loose) {
  debug('replaceStars', comp, loose);
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[STAR], '');
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace($0,
                       from, fM, fm, fp, fpr, fb,
                       to, tM, tm, tp, tpr, tb) {

  if (isX(fM))
    { from = ''; }
  else if (isX(fm))
    { from = '>=' + fM + '.0.0'; }
  else if (isX(fp))
    { from = '>=' + fM + '.' + fm + '.0'; }
  else
    { from = '>=' + from; }

  if (isX(tM))
    { to = ''; }
  else if (isX(tm))
    { to = '<' + (+tM + 1) + '.0.0'; }
  else if (isX(tp))
    { to = '<' + tM + '.' + (+tm + 1) + '.0'; }
  else if (tpr)
    { to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr; }
  else
    { to = '<=' + to; }

  return (from + ' ' + to).trim();
}


// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function(version) {
  var this$1 = this;

  if (!version)
    { return false; }

  if (typeof version === 'string')
    { version = new SemVer(version, this.loose); }

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this$1.set[i], version))
      { return true; }
  }
  return false;
};

function testSet(set, version) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version))
      { return false; }
  }

  if (version.prerelease.length) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (var i = 0; i < set.length; i++) {
      debug(set[i].semver);
      if (set[i].semver === ANY)
        { continue; }

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch)
          { return true; }
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false;
  }

  return true;
}

exports.satisfies = satisfies;
function satisfies(version, range, loose) {
  try {
    range = new Range(range, loose);
  } catch (er) {
    return false;
  }
  return range.test(version);
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying(versions, range, loose) {
  var max = null;
  var maxSV = null;
  try {
    var rangeObj = new Range(range, loose);
  } catch (er) {
    return null;
  }
  versions.forEach(function (v) {
    if (rangeObj.test(v)) { // satisfies(v, range, loose)
      if (!max || maxSV.compare(v) === -1) { // compare(max, v, true)
        max = v;
        maxSV = new SemVer(max, loose);
      }
    }
  });
  return max;
}

exports.minSatisfying = minSatisfying;
function minSatisfying(versions, range, loose) {
  var min = null;
  var minSV = null;
  try {
    var rangeObj = new Range(range, loose);
  } catch (er) {
    return null;
  }
  versions.forEach(function (v) {
    if (rangeObj.test(v)) { // satisfies(v, range, loose)
      if (!min || minSV.compare(v) === 1) { // compare(min, v, true)
        min = v;
        minSV = new SemVer(min, loose);
      }
    }
  });
  return min;
}

exports.validRange = validRange;
function validRange(range, loose) {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, loose).range || '*';
  } catch (er) {
    return null;
  }
}

// Determine if version is less than all the versions possible in the range
exports.ltr = ltr;
function ltr(version, range, loose) {
  return outside(version, range, '<', loose);
}

// Determine if version is greater than all the versions possible in the range.
exports.gtr = gtr;
function gtr(version, range, loose) {
  return outside(version, range, '>', loose);
}

exports.outside = outside;
function outside(version, range, hilo, loose) {
  version = new SemVer(version, loose);
  range = new Range(range, loose);

  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt;
      ltefn = lte;
      ltfn = lt;
      comp = '>';
      ecomp = '>=';
      break;
    case '<':
      gtfn = lt;
      ltefn = gte;
      ltfn = gt;
      comp = '<';
      ecomp = '<=';
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }

  // If it satisifes the range it is not outside
  if (satisfies(version, range, loose)) {
    return false;
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    var high = null;
    var low = null;

    comparators.forEach(function(comparator) {
      if (comparator.semver === ANY) {
        comparator = new Comparator('>=0.0.0');
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, loose)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, loose)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false;
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false;
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false;
    }
  }
  return true;
}

exports.prerelease = prerelease;
function prerelease(version, loose) {
  var parsed = parse(version, loose);
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null;
}

exports.intersects = intersects;
function intersects(r1, r2, loose) {
  r1 = new Range(r1, loose);
  r2 = new Range(r2, loose);
  return r1.intersects(r2)
}
});

var semver_1 = semver.SEMVER_SPEC_VERSION;
var semver_2 = semver.re;
var semver_3 = semver.src;
var semver_4 = semver.parse;
var semver_5 = semver.valid;
var semver_6 = semver.clean;
var semver_7 = semver.SemVer;
var semver_8 = semver.inc;
var semver_9 = semver.diff;
var semver_10 = semver.compareIdentifiers;
var semver_11 = semver.rcompareIdentifiers;
var semver_12 = semver.major;
var semver_13 = semver.minor;
var semver_14 = semver.patch;
var semver_15 = semver.compare;
var semver_16 = semver.compareLoose;
var semver_17 = semver.rcompare;
var semver_18 = semver.sort;
var semver_19 = semver.rsort;
var semver_20 = semver.gt;
var semver_21 = semver.lt;
var semver_22 = semver.eq;
var semver_23 = semver.neq;
var semver_24 = semver.gte;
var semver_25 = semver.lte;
var semver_26 = semver.cmp;
var semver_27 = semver.Comparator;
var semver_28 = semver.Range;
var semver_29 = semver.toComparators;
var semver_30 = semver.satisfies;
var semver_31 = semver.maxSatisfying;
var semver_32 = semver.minSatisfying;
var semver_33 = semver.validRange;
var semver_34 = semver.ltr;
var semver_35 = semver.gtr;
var semver_36 = semver.outside;
var semver_37 = semver.prerelease;
var semver_38 = semver.intersects;

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
 * Normalize a version string.
 * @param  {String} Version. ie: 1, 1.0, 1.0.0
 * @return {String} Version
 */
function normalizeVersion (v) {
  var isValid = semver.valid(v);
  if (isValid) {
    return v
  }

  v = typeof (v) === 'string' ? v : '';
  var split = v.split('.');
  var i = 0;
  var result = [];

  while (i < 3) {
    var s = typeof (split[i]) === 'string' && split[i] ? split[i] : '0';
    result.push(s);
    i++;
  }

  return result.join('.')
}

/**
 * Get informations from different error key. Like:
 * - code
 * - errorMessage
 * - errorType
 * - isDowngrade
 * @param  {string} key
 * @param  {string} val
 * @param  {string} criteria
 * @return {object}
 */
function getError (key, val, criteria) {
  var result = {
    isDowngrade: true,
    errorType: 1,
    code: 1000
  };
  var getMsg = function (key, val, criteria) {
    return 'Downgrade[' + key + '] :: deviceInfo '
      + val + ' matched criteria ' + criteria
  };
  var _key = key.toLowerCase();

  result.errorMessage = getMsg(key, val, criteria);

  if (_key.indexOf('osversion') >= 0) {
    result.code = 1001;
  }
  else if (_key.indexOf('appversion') >= 0) {
    result.code = 1002;
  }
  else if (_key.indexOf('weexversion') >= 0) {
    result.code = 1003;
  }
  else if (_key.indexOf('devicemodel') >= 0) {
    result.code = 1004;
  }

  return result
}

/**
 * WEEX framework input(deviceInfo)
 * {
 *   platform: 'iOS' or 'android'
 *   osVersion: '1.0.0' or '1.0' or '1'
 *   appVersion: '1.0.0' or '1.0' or '1'
 *   weexVersion: '1.0.0' or '1.0' or '1'
 *   dDeviceModel: 'MODEL_NAME'
 * }
 *
 * downgrade config(config)
 * {
 *   ios: {
 *     osVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
 *     appVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
 *     weexVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
 *     deviceModel: ['modelA', 'modelB', ...]
 *   },
 *   android: {
 *     osVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
 *     appVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
 *     weexVersion: '>1.0.0' or '>=1.0.0' or '<1.0.0' or '<=1.0.0' or '1.0.0'
 *     deviceModel: ['modelA', 'modelB', ...]
 *   }
 * }
 *
 *
 * @param  {object} deviceInfo Weex SDK framework input
 * @param  {object} config     user input
 * @return {Object}            { isDowngrade: true/false, errorMessage... }
 */
function check (config, deviceInfo) {
  deviceInfo = deviceInfo || global.WXEnvironment;
  deviceInfo = isPlainObject(deviceInfo) ? deviceInfo : {};

  var result = {
    isDowngrade: false // defautl is pass
  };

  if (typof$1(config) === 'function') {
    var customDowngrade = config.call(this, deviceInfo, {
      semver: semver,
      normalizeVersion: normalizeVersion
    });

    customDowngrade = !!customDowngrade;

    result = customDowngrade ? getError('custom', '', 'custom params') : result;
  }
  else {
    config = isPlainObject(config) ? config : {};

    var platform = deviceInfo.platform || 'unknow';
    var dPlatform = platform.toLowerCase();
    var cObj = config[dPlatform] || {};

    for (var i in deviceInfo) {
      var key = i;
      var keyLower = key.toLowerCase();
      var val = deviceInfo[i];
      var isVersion = keyLower.indexOf('version') >= 0;
      var isDeviceModel = keyLower.indexOf('devicemodel') >= 0;
      var criteria = cObj[i];

      if (criteria && isVersion) {
        var c = normalizeVersion(criteria);
        var d = normalizeVersion(deviceInfo[i]);

        if (semver.satisfies(d, c)) {
          result = getError(key, val, criteria);
          break
        }
      }
      else if (isDeviceModel) {
        var _criteria = typof$1(criteria) === 'array' ? criteria : [criteria];
        if (_criteria.indexOf(val) >= 0) {
          result = getError(key, val, criteria);
          break
        }
      }
    }
  }

  return result
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
function setViewport (app, configs) {
  if ( configs === void 0 ) configs = {};

  /* istanbul ignore if */
  {
    console.debug(("[JS Framework] Set viewport (width: " + (configs.width) + ") for app#" + (app.id) + "."));
    validateViewport(configs);
  }

  // Send viewport configs to native
  if (app && app.callTasks) {
    return app.callTasks([{
      module: 'meta',
      method: 'setViewport',
      args: [configs]
    }])
  }

  /* istanbul ignore next */
  else {
    console.warn("[JS Framework] Can't find \"callTasks\" method on current app.");
  }
}

/**
 * Validate the viewport config.
 * @param {Object} configs
 */
function validateViewport (configs) {
  if ( configs === void 0 ) configs = {};

  var width = configs.width;
  if (width) {
    if (typeof width !== 'number' && width !== 'device-width') {
      console.warn(("[JS Framework] Not support to use " + width + " as viewport width."));
      return false
    }
    return true
  }
  console.warn('[JS Framework] the viewport config should contain the "width" property.');
  return false
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
 * bootstrap app from a certain custom component with config & data
 */
function bootstrap (app, name, config, data) {
  console.debug(("[JS Framework] bootstrap for " + name));

  // 1. validate custom component name first
  var cleanName;
  if (isWeexComponent(name)) {
    cleanName = removeWeexPrefix(name);
  }
  else if (isNpmModule(name)) {
    cleanName = removeJSSurfix(name);
    // check if define by old 'define' method
    /* istanbul ignore if */
    if (!requireCustomComponent(app, cleanName)) {
      return new Error(("It's not a component: " + name))
    }
  }
  else {
    return new Error(("Wrong component name: " + name))
  }

  // 2. validate configuration
  config = isPlainObject(config) ? config : {};
  // 2.1 transformer version check
  if (typeof config.transformerVersion === 'string' &&
    typeof global.transformerVersion === 'string' &&
    !semver.satisfies(config.transformerVersion,
      global.transformerVersion)) {
    return new Error("JS Bundle version: " + (config.transformerVersion) + " " +
      "not compatible with " + (global.transformerVersion))
  }
  // 2.2 downgrade version check
  var downgradeResult = check(config.downgrade);
  /* istanbul ignore if */
  if (downgradeResult.isDowngrade) {
    app.callTasks([{
      module: 'instanceWrap',
      method: 'error',
      args: [
        downgradeResult.errorType,
        downgradeResult.code,
        downgradeResult.errorMessage
      ]
    }]);
    return new Error(("Downgrade[" + (downgradeResult.code) + "]: " + (downgradeResult.errorMessage)))
  }

  // set viewport
  if (config.viewport) {
    setViewport(app, config.viewport);
  }

  // 3. create a new Vm with custom component name and data
  app.vm = new Vm(cleanName, null, { _app: app }, null, data);
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
 * define(name, factory) for primary usage
 * or
 * define(name, deps, factory) for compatibility
 * Notice: DO NOT use function define() {},
 * it will cause error after builded by webpack
 */
var defineFn = function (app, name) {
  var obj;

  var args = [], len = arguments.length - 2;
  while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];
  console.debug(("[JS Framework] define a component " + name));

  // adapt args:
  // 1. name, deps[], factory()
  // 2. name, factory()
  // 3. name, definition{}
  var factory, definition;
  if (args.length > 1) {
    definition = args[1];
  }
  else {
    definition = args[0];
  }
  if (typeof definition === 'function') {
    factory = definition;
    definition = null;
  }

  // resolve definition from factory
  if (factory) {
    var r = function (name) {
      if (isWeexComponent(name)) {
        var cleanName = removeWeexPrefix(name);
        return requireCustomComponent(app, cleanName)
      }
      if (isWeexModule(name)) {
        var cleanName$1 = removeWeexPrefix(name);
        return app.requireModule(cleanName$1)
      }
      if (isNormalModule(name) || isNpmModule(name)) {
        var cleanName$2 = removeJSSurfix(name);
        return app.commonModules[cleanName$2]
      }
    };
    var m = { exports: {}};
    factory(r, m.exports, m);
    definition = m.exports;
  }

  // apply definition
  if (isWeexComponent(name)) {
    var cleanName = removeWeexPrefix(name);
    registerCustomComponent(app, cleanName, definition);
  }
  else if (isWeexModule(name)) {
    var cleanName$1 = removeWeexPrefix(name);
    initModules(( obj = {}, obj[cleanName$1] = definition, obj));
  }
  else if (isNormalModule(name)) {
    var cleanName$2 = removeJSSurfix(name);
    app.commonModules[cleanName$2] = definition;
  }
  else if (isNpmModule(name)) {
    var cleanName$3 = removeJSSurfix(name);
    if (definition.template ||
        definition.style ||
        definition.methods) {
      // downgrade to old define method (define('componentName', factory))
      // the exports contain one key of template, style or methods
      // but it has risk!!!
      registerCustomComponent(app, cleanName$3, definition);
    }
    else {
      app.commonModules[cleanName$3] = definition;
    }
  }
};

/**
 * @deprecated
 */
function register$1 (app, type, options) {
  console.warn('[JS Framework] Register is deprecated, please install lastest transformer.');
  registerCustomComponent(app, type, options);
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
 * api that invoked by js bundle code
 *
 * - define(name, factory): define a new composed component type
 * - bootstrap(type, config, data): require a certain type &
 *         render with (optional) data
 *
 * deprecated:
 * - register(type, options): register a new composed component type
 * - render(type, data): render by a certain type with (optional) data
 * - require(type)(data): require a type then render with data
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
/**
 * @fileOverview
 * instance controls from native
 *
 * - fire event
 * - callback
 * - refresh
 * - destroy
 *
 * corresponded with the API of instance manager (framework.js)
 */
/**
 * Refresh an app with data to its root component options.
 * @param  {object} app
 * @param  {any}    data
 */
function refresh (app, data) {
  console.debug("[JS Framework] Refresh with", data, ("in instance[" + (app.id) + "]"));
  var vm = app.vm;
  if (vm && data) {
    if (typeof vm.refreshData === 'function') {
      vm.refreshData(data);
    }
    else {
      extend(vm, data);
    }
    app.differ.flush();
    app.doc.taskCenter.send('dom', { action: 'refreshFinish' }, []);
    return
  }
  return new Error(("invalid data \"" + data + "\""))
}

/**
 * Destroy an app.
 * @param  {object} app
 */
function destroy (app) {
  console.debug(("[JS Framework] Destory an instance(" + (app.id) + ")"));

  if (app.vm) {
    destroyVm(app.vm);
  }

  app.id = '';
  app.options = null;
  app.blocks = null;
  app.vm = null;
  app.doc.taskCenter.destroyCallback();
  app.doc.destroy();
  app.doc = null;
  app.customComponentMap = null;
  app.commonModules = null;
}

/**
 * Destroy an Vm.
 * @param {object} vm
 */
function destroyVm (vm) {
  delete vm._app;
  delete vm._computed;
  delete vm._css;
  delete vm._data;
  delete vm._ids;
  delete vm._methods;
  delete vm._options;
  delete vm._parent;
  delete vm._parentEl;
  delete vm._rootEl;

  // remove all watchers
  if (vm._watchers) {
    var watcherCount = vm._watchers.length;
    while (watcherCount--) {
      vm._watchers[watcherCount].teardown();
    }
    delete vm._watchers;
  }

  // destroy child vms recursively
  if (vm._childrenVms) {
    var vmCount = vm._childrenVms.length;
    while (vmCount--) {
      destroyVm(vm._childrenVms[vmCount]);
    }
    delete vm._childrenVms;
  }

  console.debug(("[JS Framework] \"destroyed\" lifecycle in Vm(" + (vm._type) + ")"));
  vm.$emit('hook:destroyed');

  delete vm._type;
  delete vm._vmEvents;
}

/**
 * Get a JSON object to describe the document body.
 * @param  {object} app
 * @return {object}
 */
function getRootElement (app) {
  var doc = app.doc || {};
  var body = doc.body || {};
  return body.toJSON ? body.toJSON() : {}
}

/**
 * Fire an event from renderer. The event has type, an event object and an
 * element ref. If the event comes with some virtual-DOM changes, it should
 * have one more parameter to describe the changes.
 * @param  {object} app
 * @param  {string} ref
 * @param  {type}   type
 * @param  {object} e
 * @param  {object} domChanges
 */
function fireEvent$1 (app, ref, type, e, domChanges) {
  console.debug(("[JS Framework] Fire a \"" + type + "\" event on an element(" + ref + ") in instance(" + (app.id) + ")"));
  if (Array.isArray(ref)) {
    ref.some(function (ref) {
      return fireEvent$1(app, ref, type, e) !== false
    });
    return
  }
  var el = app.doc.getRef(ref);
  if (el) {
    var result = app.doc.fireEvent(el, type, e, domChanges);
    app.differ.flush();
    app.doc.taskCenter.send('dom', { action: 'updateFinish' }, []);
    return result
  }
  return new Error(("invalid element reference \"" + ref + "\""))
}

/**
 * Make a callback for a certain app.
 * @param  {object}   app
 * @param  {number}   callbackId
 * @param  {any}      data
 * @param  {boolean}  ifKeepAlive
 */
function callback$1 (app, callbackId, data, ifKeepAlive) {
  console.debug(("[JS Framework] Invoke a callback(" + callbackId + ") with"), data, ("in instance(" + (app.id) + ")"));
  var result = app.doc.taskCenter.callback(callbackId, data, ifKeepAlive);
  updateActions(app);
  app.doc.taskCenter.send('dom', { action: 'updateFinish' }, []);
  return result
}

/**
 * Collect all virtual-DOM mutations together and send them to renderer.
 * @param  {object} app
 */
function updateActions (app) {
  app.differ.flush();
}

/**
 * Call all tasks from an app to renderer (native).
 * @param  {object} app
 * @param  {array}  tasks
 */
function callTasks (app, tasks) {
  var result;

  /* istanbul ignore next */
  if (typof$1(tasks) !== 'array') {
    tasks = [tasks];
  }

  tasks.forEach(function (task) {
    result = app.doc.taskCenter.send(
      'module',
      {
        module: task.module,
        method: task.method
      },
      task.args
    );
  });

  return result
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
 * instance controls from native
 *
 * - init bundle
 *
 * corresponded with the API of instance manager (framework.js)
 */

/**
 * Init an app by run code witgh data
 * @param  {object} app
 * @param  {string} code
 * @param  {object} data
 */
function init$2 (app, code, data, services) {
  console.debug('[JS Framework] Intialize an instance with:\n', data);
  var result;

  // prepare app env methods
  var bundleDefine = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return defineFn.apply(void 0, [ app ].concat( args ));
  };
  var bundleBootstrap = function (name, config, _data) {
    result = bootstrap(app, name, config, _data || data);
    updateActions(app);
    app.doc.listener.createFinish();
    console.debug(("[JS Framework] After intialized an instance(" + (app.id) + ")"));
  };
  var bundleVm = Vm;
  /* istanbul ignore next */
  var bundleRegister = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return register$1.apply(void 0, [ app ].concat( args ));
  };
  /* istanbul ignore next */
  var bundleRender = function (name, _data) {
    result = bootstrap(app, name, {}, _data);
  };
  /* istanbul ignore next */
  var bundleRequire = function (name) { return function (_data) {
    result = bootstrap(app, name, {}, _data);
  }; };
  var bundleDocument = app.doc;
  /* istanbul ignore next */
  var bundleRequireModule = function (name) { return app.requireModule(removeWeexPrefix(name)); };

  var weexGlobalObject = {
    config: app.options,
    define: bundleDefine,
    bootstrap: bundleBootstrap,
    requireModule: bundleRequireModule,
    document: bundleDocument,
    Vm: bundleVm
  };

  Object.freeze(weexGlobalObject);

  // prepare code
  var functionBody;
  /* istanbul ignore if */
  if (typeof code === 'function') {
    // `function () {...}` -> `{...}`
    // not very strict
    functionBody = code.toString().substr(12);
  }
  /* istanbul ignore next */
  else if (code) {
    functionBody = code.toString();
  }
  // wrap IFFE and use strict mode
  functionBody = "(function(global){\n\n\"use strict\";\n\n " + functionBody + " \n\n})(Object.create(this))";

  // run code and get result
  var WXEnvironment = global.WXEnvironment;
  var timerAPIs = {};

  /* istanbul ignore if */
  if (WXEnvironment && WXEnvironment.platform !== 'Web') {
    // timer APIs polyfill in native
    var timer = app.requireModule('timer');
    Object.assign(timerAPIs, {
      setTimeout: function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        var handler = function () {
          args[0].apply(args, args.slice(2));
        };
        timer.setTimeout(handler, args[1]);
        return app.doc.taskCenter.callbackManager.lastCallbackId.toString()
      },
      setInterval: function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        var handler = function () {
          args[0].apply(args, args.slice(2));
        };
        timer.setInterval(handler, args[1]);
        return app.doc.taskCenter.callbackManager.lastCallbackId.toString()
      },
      clearTimeout: function (n) {
        timer.clearTimeout(n);
      },
      clearInterval: function (n) {
        timer.clearInterval(n);
      }
    });
  }
  // run code and get result
  var globalObjects = Object.assign({
    define: bundleDefine,
    require: bundleRequire,
    bootstrap: bundleBootstrap,
    register: bundleRegister,
    render: bundleRender,
    __weex_define__: bundleDefine, // alias for define
    __weex_bootstrap__: bundleBootstrap, // alias for bootstrap
    __weex_document__: bundleDocument,
    __weex_require__: bundleRequireModule,
    __weex_viewmodel__: bundleVm,
    weex: weexGlobalObject
  }, timerAPIs, services);
  if (!callFunctionNative(globalObjects, functionBody)) {
    // If failed to compile functionBody on native side,
    // fallback to callFunction.
    callFunction(globalObjects, functionBody);
  }

  return result
}

/**
 * Call a new function body with some global objects.
 * @param  {object} globalObjects
 * @param  {string} code
 * @return {any}
 */
function callFunction (globalObjects, body) {
  var globalKeys = [];
  var globalValues = [];
  for (var key in globalObjects) {
    globalKeys.push(key);
    globalValues.push(globalObjects[key]);
  }
  globalKeys.push(body);

  var result = new (Function.prototype.bind.apply( Function, [ null ].concat( globalKeys) ));
  return result.apply(void 0, globalValues)
}

/**
 * Call a new function generated on the V8 native side.
 * @param  {object} globalObjects
 * @param  {string} body
 * @return {boolean} return true if no error occurred.
 */
function callFunctionNative (globalObjects, body) {
  if (typeof compileAndRunBundle !== 'function') {
    return false
  }

  var fn = void 0;
  var isNativeCompileOk = false;
  var script = '(function (';
  var globalKeys = [];
  var globalValues = [];
  for (var key in globalObjects) {
    globalKeys.push(key);
    globalValues.push(globalObjects[key]);
  }
  for (var i = 0; i < globalKeys.length - 1; ++i) {
    script += globalKeys[i];
    script += ',';
  }
  script += globalKeys[globalKeys.length - 1];
  script += ') {';
  script += body;
  script += '} )';

  try {
    var weex = globalObjects.weex || {};
    var config = weex.config || {};
    fn = compileAndRunBundle(script, config.bundleUrl, config.bundleDigest, config.codeCachePath);
    if (fn && typeof fn === 'function') {
      fn.apply(void 0, globalValues);
      isNativeCompileOk = true;
    }
  }
  catch (e) {
    console.error(e);
  }

  return isNativeCompileOk
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
 * instance controls from native
 *
 * - init bundle
 * - fire event
 * - callback
 * - destroy
 *
 * corresponded with the API of instance manager (framework.js)
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
var Differ = function Differ (id) {
  this.id = id;
  this.map = [];
  this.hooks = [];
};
Differ.prototype.isEmpty = function isEmpty () {
  return this.map.length === 0
};
Differ.prototype.append = function append (type, depth, ref, handler) {
    var this$1 = this;
    if ( depth === void 0 ) depth = 0;

  if (!this.hasTimer) {
    this.hasTimer = true;
    setTimeout(function () {
      this$1.hasTimer = false;
      this$1.flush(true);
    }, 0);
  }
  var map = this.map;
  if (!map[depth]) {
    map[depth] = {};
  }
  var group = map[depth];
  if (!group[type]) {
    group[type] = {};
  }
  if (type === 'element') {
    if (!group[type][ref]) {
      group[type][ref] = [];
    }
    group[type][ref].push(handler);
  }
  else {
    group[type][ref] = handler;
  }
};
Differ.prototype.flush = function flush (isTimeout) {
  var map = this.map.slice();
  this.map.length = 0;
  map.forEach(function (group) {
    callTypeMap(group, 'repeat');
    callTypeMap(group, 'shown');
    callTypeList(group, 'element');
  });

  var hooks = this.hooks.slice();
  this.hooks.length = 0;
  hooks.forEach(function (fn) {
    fn();
  });

  if (!this.isEmpty()) {
    this.flush();
  }
};
Differ.prototype.then = function then (fn) {
  this.hooks.push(fn);
};

function callTypeMap (group, type) {
  var map = group[type];
  for (var ref in map) {
    map[ref]();
  }
}

function callTypeList (group, type) {
  var map = group[type];
  for (var ref in map) {
    var list = map[ref];
    list.forEach(function (handler) { handler(); });
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
/**
 * @fileOverview
 * Weex App constructor & definition
 */

/**
 * App constructor for Weex framework.
 * @param {string} id
 * @param {object} options
 */
function App$1 (id, options) {
  this.id = id;
  this.options = options || {};
  this.vm = null;
  this.customComponentMap = {};
  this.commonModules = {};

  // document
  this.doc = new config$2.Document(
    id,
    this.options.bundleUrl,
    null,
    config$2.Listener
  );
  this.differ = new Differ(id);
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
 * Weex instance constructor & definition
 */

/**
 * @deprecated
 */
App$1.prototype.requireModule = function (name) {
  return requireModule(this, name)
};

/**
 * @deprecated
 */
App$1.prototype.updateActions = function () {
  return updateActions(this)
};

/**
 * @deprecated
 */
App$1.prototype.callTasks = function (tasks) {
  return callTasks(this, tasks)
};

/**
 * Prevent modification of App and App.prototype
 */
Object.freeze(App$1);
Object.freeze(App$1.prototype);

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
var instanceMap = {};

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
 * Create a Weex instance.
 *
 * @param  {string} id
 * @param  {string} code
 * @param  {object} options
 *         option `HAS_LOG` enable print log
 * @param  {object} data
 * @param  {object} info { created, ... services }
 */
function createInstance$1 (id, code, options, data, info) {
  var ref = info || {};
  var services = ref.services;
  resetTarget();
  var instance = instanceMap[id];
  /* istanbul ignore else */
  options = options || {};
  var result;
  /* istanbul ignore else */
  if (!instance) {
    instance = new App$1(id, options);
    instanceMap[id] = instance;
    result = init$2(instance, code, data, services);
  }
  else {
    result = new Error(("invalid instance id \"" + id + "\""));
  }
  return (result instanceof Error) ? result : instance
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
 * Init config informations for Weex framework
 * @param  {object} cfg
 */
function init$3 (cfg) {
  config$2.Document = cfg.Document;
  config$2.Element = cfg.Element;
  config$2.Comment = cfg.Comment;
  config$2.sendTasks = cfg.sendTasks;
  config$2.Listener = cfg.Listener;
}

/**
 * Refresh a Weex instance with data.
 *
 * @param  {string} id
 * @param  {object} data
 */
function refreshInstance (id, data) {
  var instance = instanceMap[id];
  var result;
  /* istanbul ignore else */
  if (instance) {
    result = refresh(instance, data);
  }
  else {
    result = new Error(("invalid instance id \"" + id + "\""));
  }
  return result
}

/**
 * Destroy a Weex instance.
 * @param  {string} id
 */
function destroyInstance (id) {
  // Markup some global state in native side
  if (typeof markupState === 'function') {
    markupState();
  }

  resetTarget();
  var instance = instanceMap[id];
  /* istanbul ignore else */
  if (!instance) {
    return new Error(("invalid instance id \"" + id + "\""))
  }
  destroy(instance);
  delete instanceMap[id];
  // notifyContextDisposed is used to tell v8 to do a full GC,
  // but this would have a negative performance impact on weex,
  // because all the inline cache in v8 would get cleared
  // during a full GC.
  // To take care of both memory and performance, just tell v8
  // to do a full GC every eighteen times.
  var idNum = Math.round(id);
  var round = 18;
  if (idNum > 0) {
    var remainder = idNum % round;
    if (!remainder && typeof notifyTrimMemory === 'function') {
      notifyTrimMemory();
    }
  }
  return instanceMap
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
var nativeComponentMap$1 = config$2.nativeComponentMap;

/**
 * Register the name of each native component.
 * @param  {array} components array of name
 */
function registerComponents$1 (components) {
  if (Array.isArray(components)) {
    components.forEach(function register (name) {
      /* istanbul ignore if */
      if (!name) {
        return
      }
      if (typeof name === 'string') {
        nativeComponentMap$1[name] = true;
      }
      /* istanbul ignore else */
      else if (typeof name === 'object' && typeof name.type === 'string') {
        nativeComponentMap$1[name.type] = name;
      }
    });
  }
}

/**
 * Register the name and methods of each module.
 * @param  {object} modules a object of modules
 */
function registerModules$1 (modules) {
  /* istanbul ignore else */
  if (typeof modules === 'object') {
    initModules(modules);
  }
}

/**
 * Register the name and methods of each api.
 * @param  {object} apis a object of apis
 */
function registerMethods (methods) {
  /* istanbul ignore else */
  if (typeof methods === 'object') {
    initMethods$1(Vm, methods);
  }
}

// @todo: Hack for this framework only. Will be re-designed or removed later.
global.registerMethods = registerMethods;

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
var jsHandlers = {
  fireEvent: function (id) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    return fireEvent$1.apply(void 0, [ instanceMap[id] ].concat( args ))
  },
  callback: function (id) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    return callback$1.apply(void 0, [ instanceMap[id] ].concat( args ))
  }
};

/**
 * Accept calls from native (event or callback).
 *
 * @param  {string} id
 * @param  {array} tasks list with `method` and `args`
 */
function receiveTasks$1 (id, tasks) {
  var instance = instanceMap[id];
  if (instance && Array.isArray(tasks)) {
    var results = [];
    tasks.forEach(function (task) {
      var handler = jsHandlers[task.method];
      var args = [].concat( task.args );
      /* istanbul ignore else */
      if (typeof handler === 'function') {
        args.unshift(id);
        results.push(handler.apply(void 0, args));
      }
    });
    return results
  }
  return new Error(("invalid instance id \"" + id + "\" or tasks"))
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
 * Get a whole element tree of an instance for debugging.
 * @param  {string} id
 * @return {object} a virtual dom tree
 */
function getRoot$1 (id) {
  var instance = instanceMap[id];
  var result;
  /* istanbul ignore else */
  if (instance) {
    result = getRootElement(instance);
  }
  else {
    result = new Error(("invalid instance id \"" + id + "\""));
  }
  return result
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
 * @fileOverview Weex framework entry.
 */

// register special methods for Weex framework
registerMethods(methods$1);

/**
 * Prevent modification of Vm and Vm.prototype
 */
Object.freeze(Vm);




var Weex = Object.freeze({
	registerComponents: registerComponents$1,
	registerModules: registerModules$1,
	registerMethods: registerMethods,
	createInstance: createInstance$1,
	init: init$3,
	refreshInstance: refreshInstance,
	destroyInstance: destroyInstance,
	receiveTasks: receiveTasks$1,
	getRoot: getRoot$1
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

setup({ Weex: Weex });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VleC1sZWdhY3kuanMiLCJzb3VyY2VzIjpbIi4uL3J1bnRpbWUvc2hhcmVkL3V0aWxzLmpzIiwiLi4vcnVudGltZS9icmlkZ2Uvbm9ybWFsaXplLmpzIiwiLi4vcnVudGltZS9icmlkZ2UvQ2FsbGJhY2tNYW5hZ2VyLmpzIiwiLi4vcnVudGltZS92ZG9tL29wZXJhdGlvbi5qcyIsIi4uL3J1bnRpbWUvdmRvbS9Ob2RlLmpzIiwiLi4vcnVudGltZS92ZG9tL1dlZXhFbGVtZW50LmpzIiwiLi4vcnVudGltZS92ZG9tL0VsZW1lbnQuanMiLCIuLi9ydW50aW1lL2JyaWRnZS9UYXNrQ2VudGVyLmpzIiwiLi4vcnVudGltZS9icmlkZ2UvcmVjZWl2ZXIuanMiLCIuLi9ydW50aW1lL2FwaS9tb2R1bGUuanMiLCIuLi9ydW50aW1lL2FwaS9jb21wb25lbnQuanMiLCIuLi9ydW50aW1lL2FwaS9zZXJ2aWNlLmpzIiwiLi4vcnVudGltZS9icmlkZ2UvZGVidWcuanMiLCIuLi9ydW50aW1lL3Zkb20vQ29tbWVudC5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL0xpc3RlbmVyLmpzIiwiLi4vcnVudGltZS9icmlkZ2UvSGFuZGxlci5qcyIsIi4uL3J1bnRpbWUvdmRvbS9Eb2N1bWVudC5qcyIsIi4uL3J1bnRpbWUvYXBpL1dlZXhJbnN0YW5jZS5qcyIsIi4uL3J1bnRpbWUvYXBpL2luaXQuanMiLCIuLi9ydW50aW1lL3Zkb20vaW5kZXguanMiLCIuLi9ydW50aW1lL2FwaS9jb25maWcuanMiLCIuLi9ydW50aW1lL2FwaS9pbmRleC5qcyIsIi4uL3J1bnRpbWUvc2VydmljZXMvYnJvYWRjYXN0LWNoYW5uZWwvbWVzc2FnZS1ldmVudC5qcyIsIi4uL3J1bnRpbWUvc2VydmljZXMvYnJvYWRjYXN0LWNoYW5uZWwvaW5kZXguanMiLCIuLi9ydW50aW1lL3NlcnZpY2VzL2luZGV4LmpzIiwiLi4vcnVudGltZS9lbnRyaWVzL3NldHVwLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcGkvbWV0aG9kcy5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvdXRpbC9zaGFyZWQuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3V0aWwvaW5kZXguanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2NvcmUvZGVwLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9jb3JlL3dhdGNoZXIuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2NvcmUvYXJyYXkuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2NvcmUvb2JzZXJ2ZXIuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2NvcmUvc3RhdGUuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2NvbmZpZy5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvdm0vZGlyZWN0aXZlLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS92bS9kb20taGVscGVyLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS92bS9jb21waWxlci5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvdm0vZXZlbnRzLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS92bS9pbmRleC5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL3JlZ2lzdGVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NlbXZlci9zZW12ZXIuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2FwcC9kb3duZ3JhZGUuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2FwcC92aWV3cG9ydC5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL2J1bmRsZS9ib290c3RyYXAuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2FwcC9idW5kbGUvZGVmaW5lLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcHAvYnVuZGxlL2luZGV4LmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcHAvY3RybC9taXNjLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcHAvY3RybC9pbml0LmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcHAvY3RybC9pbmRleC5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL2RpZmZlci5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL2luc3RhbmNlLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcHAvaW5kZXguanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3N0YXRpYy9tYXAuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3N0YXRpYy9jcmVhdGUuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3N0YXRpYy9saWZlLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9zdGF0aWMvcmVnaXN0ZXIuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3N0YXRpYy9icmlkZ2UuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3N0YXRpYy9taXNjLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9pbmRleC5qcyIsIi4uL3J1bnRpbWUvZW50cmllcy9sZWdhY3kuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogR2V0IGEgdW5pcXVlIGlkLlxuICovXG5sZXQgbmV4dE5vZGVSZWYgPSAxXG5leHBvcnQgZnVuY3Rpb24gdW5pcXVlSWQgKCkge1xuICByZXR1cm4gKG5leHROb2RlUmVmKyspLnRvU3RyaW5nKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHR5cG9mICh2KSB7XG4gIGNvbnN0IHMgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodilcbiAgcmV0dXJuIHMuc3Vic3RyaW5nKDgsIHMubGVuZ3RoIC0gMSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1ZmZlclRvQmFzZTY0IChidWZmZXIpIHtcbiAgaWYgKHR5cGVvZiBidG9hICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgY29uc3Qgc3RyaW5nID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKFxuICAgIG5ldyBVaW50OEFycmF5KGJ1ZmZlciksXG4gICAgY29kZSA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpXG4gICkuam9pbignJylcbiAgcmV0dXJuIGJ0b2Eoc3RyaW5nKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjRUb0J1ZmZlciAoYmFzZTY0KSB7XG4gIGlmICh0eXBlb2YgYXRvYiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBuZXcgQXJyYXlCdWZmZXIoMClcbiAgfVxuICBjb25zdCBzdHJpbmcgPSBhdG9iKGJhc2U2NCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KHN0cmluZy5sZW5ndGgpXG4gIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoc3RyaW5nLCAoY2gsIGkpID0+IHtcbiAgICBhcnJheVtpXSA9IGNoLmNoYXJDb2RlQXQoMClcbiAgfSlcbiAgcmV0dXJuIGFycmF5LmJ1ZmZlclxufVxuXG4vKipcbiAqIERldGVjdCBpZiB0aGUgcGFyYW0gaXMgZmFsc3kgb3IgZW1wdHlcbiAqIEBwYXJhbSB7YW55fSBhbnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRW1wdHkgKGFueSkge1xuICBpZiAoIWFueSB8fCB0eXBlb2YgYW55ICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBmb3IgKGNvbnN0IGtleSBpbiBhbnkpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGFueSwga2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgdHlwb2YsIGJ1ZmZlclRvQmFzZTY0LCBiYXNlNjRUb0J1ZmZlciB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcblxuLyoqXG4gKiBOb3JtYWxpemUgYSBwcmltaXRpdmUgdmFsdWUuXG4gKiBAcGFyYW0gIHthbnl9ICAgICAgICB2XG4gKiBAcmV0dXJuIHtwcmltaXRpdmV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQcmltaXRpdmUgKHYpIHtcbiAgY29uc3QgdHlwZSA9IHR5cG9mKHYpXG5cbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAnVW5kZWZpbmVkJzpcbiAgICBjYXNlICdOdWxsJzpcbiAgICAgIHJldHVybiAnJ1xuXG4gICAgY2FzZSAnUmVnRXhwJzpcbiAgICAgIHJldHVybiB2LnRvU3RyaW5nKClcbiAgICBjYXNlICdEYXRlJzpcbiAgICAgIHJldHVybiB2LnRvSVNPU3RyaW5nKClcblxuICAgIGNhc2UgJ051bWJlcic6XG4gICAgY2FzZSAnU3RyaW5nJzpcbiAgICBjYXNlICdCb29sZWFuJzpcbiAgICBjYXNlICdBcnJheSc6XG4gICAgY2FzZSAnT2JqZWN0JzpcbiAgICAgIHJldHVybiB2XG5cbiAgICBjYXNlICdBcnJheUJ1ZmZlcic6XG4gICAgICByZXR1cm4ge1xuICAgICAgICAnQHR5cGUnOiAnYmluYXJ5JyxcbiAgICAgICAgZGF0YVR5cGU6IHR5cGUsXG4gICAgICAgIGJhc2U2NDogYnVmZmVyVG9CYXNlNjQodilcbiAgICAgIH1cblxuICAgIGNhc2UgJ0ludDhBcnJheSc6XG4gICAgY2FzZSAnVWludDhBcnJheSc6XG4gICAgY2FzZSAnVWludDhDbGFtcGVkQXJyYXknOlxuICAgIGNhc2UgJ0ludDE2QXJyYXknOlxuICAgIGNhc2UgJ1VpbnQxNkFycmF5JzpcbiAgICBjYXNlICdJbnQzMkFycmF5JzpcbiAgICBjYXNlICdVaW50MzJBcnJheSc6XG4gICAgY2FzZSAnRmxvYXQzMkFycmF5JzpcbiAgICBjYXNlICdGbG9hdDY0QXJyYXknOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgJ0B0eXBlJzogJ2JpbmFyeScsXG4gICAgICAgIGRhdGFUeXBlOiB0eXBlLFxuICAgICAgICBiYXNlNjQ6IGJ1ZmZlclRvQmFzZTY0KHYuYnVmZmVyKVxuICAgICAgfVxuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVQcmltaXRpdmUgKGRhdGEpIHtcbiAgaWYgKHR5cG9mKGRhdGEpID09PSAnT2JqZWN0Jykge1xuICAgIC8vIGRlY29kZSBiYXNlNjQgaW50byBiaW5hcnlcbiAgICBpZiAoZGF0YVsnQHR5cGUnXSAmJiBkYXRhWydAdHlwZSddID09PSAnYmluYXJ5Jykge1xuICAgICAgcmV0dXJuIGJhc2U2NFRvQnVmZmVyKGRhdGEuYmFzZTY0IHx8ICcnKVxuICAgIH1cblxuICAgIGNvbnN0IHJlYWxEYXRhID0ge31cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG4gICAgICByZWFsRGF0YVtrZXldID0gZGVjb2RlUHJpbWl0aXZlKGRhdGFba2V5XSlcbiAgICB9XG4gICAgcmV0dXJuIHJlYWxEYXRhXG4gIH1cbiAgaWYgKHR5cG9mKGRhdGEpID09PSAnQXJyYXknKSB7XG4gICAgcmV0dXJuIGRhdGEubWFwKGRlY29kZVByaW1pdGl2ZSlcbiAgfVxuICByZXR1cm4gZGF0YVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IGRlY29kZVByaW1pdGl2ZSB9IGZyb20gJy4vbm9ybWFsaXplJ1xuXG5mdW5jdGlvbiBnZXRIb29rS2V5IChjb21wb25lbnRJZCwgdHlwZSwgaG9va05hbWUpIHtcbiAgcmV0dXJuIGAke3R5cGV9QCR7aG9va05hbWV9IyR7Y29tcG9uZW50SWR9YFxufVxuXG4vKipcbiAqIEZvciBnZW5lcmFsIGNhbGxiYWNrIG1hbmFnZW1lbnQgb2YgYSBjZXJ0YWluIFdlZXggaW5zdGFuY2UuXG4gKiBCZWNhdXNlIGZ1bmN0aW9uIGNhbiBub3QgcGFzc2VkIGludG8gbmF0aXZlLCBzbyB3ZSBjcmVhdGUgY2FsbGJhY2tcbiAqIGNhbGxiYWNrIGlkIGZvciBlYWNoIGZ1bmN0aW9uIGFuZCBwYXNzIHRoZSBjYWxsYmFjayBpZCBpbnRvIG5hdGl2ZVxuICogaW4gZmFjdC4gQW5kIHdoZW4gYSBjYWxsYmFjayBjYWxsZWQgZnJvbSBuYXRpdmUsIHdlIGNhbiBmaW5kIHRoZSByZWFsXG4gKiBjYWxsYmFjayB0aHJvdWdoIHRoZSBjYWxsYmFjayBpZCB3ZSBoYXZlIHBhc3NlZCBiZWZvcmUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENhbGxiYWNrTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yIChpbnN0YW5jZUlkKSB7XG4gICAgdGhpcy5pbnN0YW5jZUlkID0gU3RyaW5nKGluc3RhbmNlSWQpXG4gICAgdGhpcy5sYXN0Q2FsbGJhY2tJZCA9IDBcbiAgICB0aGlzLmNhbGxiYWNrcyA9IHt9XG4gICAgdGhpcy5ob29rcyA9IHt9XG4gIH1cbiAgYWRkIChjYWxsYmFjaykge1xuICAgIHRoaXMubGFzdENhbGxiYWNrSWQrK1xuICAgIHRoaXMuY2FsbGJhY2tzW3RoaXMubGFzdENhbGxiYWNrSWRdID0gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5sYXN0Q2FsbGJhY2tJZFxuICB9XG4gIHJlbW92ZSAoY2FsbGJhY2tJZCkge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3NbY2FsbGJhY2tJZF1cbiAgICBkZWxldGUgdGhpcy5jYWxsYmFja3NbY2FsbGJhY2tJZF1cbiAgICByZXR1cm4gY2FsbGJhY2tcbiAgfVxuICByZWdpc3Rlckhvb2sgKGNvbXBvbmVudElkLCB0eXBlLCBob29rTmFtZSwgaG9va0Z1bmN0aW9uKSB7XG4gICAgLy8gVE9ETzogdmFsaWRhdGUgYXJndW1lbnRzXG4gICAgY29uc3Qga2V5ID0gZ2V0SG9va0tleShjb21wb25lbnRJZCwgdHlwZSwgaG9va05hbWUpXG4gICAgaWYgKHRoaXMuaG9va3Nba2V5XSkge1xuICAgICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBPdmVycmlkZSBhbiBleGlzdGluZyBjb21wb25lbnQgaG9vayBcIiR7a2V5fVwiLmApXG4gICAgfVxuICAgIHRoaXMuaG9va3Nba2V5XSA9IGhvb2tGdW5jdGlvblxuICB9XG4gIHRyaWdnZXJIb29rIChjb21wb25lbnRJZCwgdHlwZSwgaG9va05hbWUsIG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIGFyZ3VtZW50c1xuICAgIGNvbnN0IGtleSA9IGdldEhvb2tLZXkoY29tcG9uZW50SWQsIHR5cGUsIGhvb2tOYW1lKVxuICAgIGNvbnN0IGhvb2tGdW5jdGlvbiA9IHRoaXMuaG9va3Nba2V5XVxuICAgIGlmICh0eXBlb2YgaG9va0Z1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBJbnZhbGlkIGhvb2sgZnVuY3Rpb24gdHlwZSAoJHt0eXBlb2YgaG9va0Z1bmN0aW9ufSkgb24gXCIke2tleX1cIi5gKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IG51bGxcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gaG9va0Z1bmN0aW9uLmFwcGx5KG51bGwsIG9wdGlvbnMuYXJncyB8fCBbXSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byBleGVjdXRlIHRoZSBob29rIGZ1bmN0aW9uIG9uIFwiJHtrZXl9XCIuYClcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGNvbnN1bWUgKGNhbGxiYWNrSWQsIGRhdGEsIGlmS2VlcEFsaXZlKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLmNhbGxiYWNrc1tjYWxsYmFja0lkXVxuICAgIGlmICh0eXBlb2YgaWZLZWVwQWxpdmUgPT09ICd1bmRlZmluZWQnIHx8IGlmS2VlcEFsaXZlID09PSBmYWxzZSkge1xuICAgICAgZGVsZXRlIHRoaXMuY2FsbGJhY2tzW2NhbGxiYWNrSWRdXG4gICAgfVxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhkZWNvZGVQcmltaXRpdmUoZGF0YSkpXG4gICAgfVxuICAgIHJldHVybiBuZXcgRXJyb3IoYGludmFsaWQgY2FsbGJhY2sgaWQgXCIke2NhbGxiYWNrSWR9XCJgKVxuICB9XG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLmNhbGxiYWNrcyA9IHt9XG4gICAgdGhpcy5ob29rcyA9IHt9XG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCBkb2NNYXAgPSB7fVxuXG4vKipcbiAqIEFkZCBhIGRvY3VtZW50IG9iamVjdCBpbnRvIGRvY01hcC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtvYmplY3R9IGRvY3VtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREb2MgKGlkLCBkb2MpIHtcbiAgaWYgKGlkKSB7XG4gICAgZG9jTWFwW2lkXSA9IGRvY1xuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBkb2N1bWVudCBvYmplY3QgYnkgaWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERvYyAoaWQpIHtcbiAgcmV0dXJuIGRvY01hcFtpZF1cbn1cblxuLyoqXG4gKiBSZW1vdmUgdGhlIGRvY3VtZW50IGZyb20gZG9jTWFwIGJ5IGlkLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEb2MgKGlkKSB7XG4gIGRlbGV0ZSBkb2NNYXBbaWRdXG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqIEdldCBsaXN0ZW5lciBieSBkb2N1bWVudCBpZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7b2JqZWN0fSBsaXN0ZW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGlzdGVuZXIgKGlkKSB7XG4gIGNvbnN0IGRvYyA9IGRvY01hcFtpZF1cbiAgaWYgKGRvYyAmJiBkb2MubGlzdGVuZXIpIHtcbiAgICByZXR1cm4gZG9jLmxpc3RlbmVyXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBHZXQgVGFza0NlbnRlciBpbnN0YW5jZSBieSBpZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7b2JqZWN0fSBUYXNrQ2VudGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXNrQ2VudGVyIChpZCkge1xuICBjb25zdCBkb2MgPSBkb2NNYXBbaWRdXG4gIGlmIChkb2MgJiYgZG9jLnRhc2tDZW50ZXIpIHtcbiAgICByZXR1cm4gZG9jLnRhc2tDZW50ZXJcbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIEFwcGVuZCBib2R5IG5vZGUgdG8gZG9jdW1lbnRFbGVtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGRvY3VtZW50XG4gKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICogQHBhcmFtIHtvYmplY3R9IGJlZm9yZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQm9keSAoZG9jLCBub2RlLCBiZWZvcmUpIHtcbiAgY29uc3QgeyBkb2N1bWVudEVsZW1lbnQgfSA9IGRvY1xuXG4gIGlmIChkb2N1bWVudEVsZW1lbnQucHVyZUNoaWxkcmVuLmxlbmd0aCA+IDAgfHwgbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgY2hpbGRyZW4gPSBkb2N1bWVudEVsZW1lbnQuY2hpbGRyZW5cbiAgY29uc3QgYmVmb3JlSW5kZXggPSBjaGlsZHJlbi5pbmRleE9mKGJlZm9yZSlcbiAgaWYgKGJlZm9yZUluZGV4IDwgMCkge1xuICAgIGNoaWxkcmVuLnB1c2gobm9kZSlcbiAgfVxuICBlbHNlIHtcbiAgICBjaGlsZHJlbi5zcGxpY2UoYmVmb3JlSW5kZXgsIDAsIG5vZGUpXG4gIH1cblxuICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgIGlmIChub2RlLnJvbGUgPT09ICdib2R5Jykge1xuICAgICAgbm9kZS5kb2NJZCA9IGRvYy5pZFxuICAgICAgbm9kZS5vd25lckRvY3VtZW50ID0gZG9jXG4gICAgICBub2RlLnBhcmVudE5vZGUgPSBkb2N1bWVudEVsZW1lbnRcbiAgICAgIGxpbmtQYXJlbnQobm9kZSwgZG9jdW1lbnRFbGVtZW50KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XG4gICAgICAgIGNoaWxkLnBhcmVudE5vZGUgPSBub2RlXG4gICAgICB9KVxuICAgICAgc2V0Qm9keShkb2MsIG5vZGUpXG4gICAgICBub2RlLmRvY0lkID0gZG9jLmlkXG4gICAgICBub2RlLm93bmVyRG9jdW1lbnQgPSBkb2NcbiAgICAgIGxpbmtQYXJlbnQobm9kZSwgZG9jdW1lbnRFbGVtZW50KVxuICAgICAgZGVsZXRlIGRvYy5ub2RlTWFwW25vZGUubm9kZUlkXVxuICAgIH1cbiAgICBkb2N1bWVudEVsZW1lbnQucHVyZUNoaWxkcmVuLnB1c2gobm9kZSlcbiAgICBzZW5kQm9keShkb2MsIG5vZGUpXG4gIH1cbiAgZWxzZSB7XG4gICAgbm9kZS5wYXJlbnROb2RlID0gZG9jdW1lbnRFbGVtZW50XG4gICAgZG9jLm5vZGVNYXBbbm9kZS5yZWZdID0gbm9kZVxuICB9XG59XG5cbmZ1bmN0aW9uIHNlbmRCb2R5IChkb2MsIG5vZGUpIHtcbiAgY29uc3QgYm9keSA9IG5vZGUudG9KU09OKClcbiAgaWYgKGRvYyAmJiBkb2MudGFza0NlbnRlciAmJiB0eXBlb2YgZG9jLnRhc2tDZW50ZXIuc2VuZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGRvYy50YXNrQ2VudGVyLnNlbmQoJ2RvbScsIHsgYWN0aW9uOiAnY3JlYXRlQm9keScgfSwgW2JvZHldKVxuICB9XG59XG5cbi8qKlxuICogU2V0IHVwIGJvZHkgbm9kZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBkb2N1bWVudFxuICogQHBhcmFtIHtvYmplY3R9IGVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEJvZHkgKGRvYywgZWwpIHtcbiAgZWwucm9sZSA9ICdib2R5J1xuICBlbC5kZXB0aCA9IDFcbiAgZGVsZXRlIGRvYy5ub2RlTWFwW2VsLm5vZGVJZF1cbiAgZWwucmVmID0gJ19yb290J1xuICBkb2Mubm9kZU1hcC5fcm9vdCA9IGVsXG4gIGRvYy5ib2R5ID0gZWxcbn1cblxuLyoqXG4gKiBFc3RhYmxpc2ggdGhlIGNvbm5lY3Rpb24gYmV0d2VlbiBwYXJlbnQgYW5kIGNoaWxkIG5vZGUuXG4gKiBAcGFyYW0ge29iamVjdH0gY2hpbGQgbm9kZVxuICogQHBhcmFtIHtvYmplY3R9IHBhcmVudCBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5rUGFyZW50IChub2RlLCBwYXJlbnQpIHtcbiAgbm9kZS5wYXJlbnROb2RlID0gcGFyZW50XG4gIGlmIChwYXJlbnQuZG9jSWQpIHtcbiAgICBub2RlLmRvY0lkID0gcGFyZW50LmRvY0lkXG4gICAgbm9kZS5vd25lckRvY3VtZW50ID0gcGFyZW50Lm93bmVyRG9jdW1lbnRcbiAgICBub2RlLm93bmVyRG9jdW1lbnQubm9kZU1hcFtub2RlLm5vZGVJZF0gPSBub2RlXG4gICAgbm9kZS5kZXB0aCA9IHBhcmVudC5kZXB0aCArIDFcbiAgfVxuICBub2RlLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgIGxpbmtQYXJlbnQoY2hpbGQsIG5vZGUpXG4gIH0pXG59XG5cbi8qKlxuICogR2V0IHRoZSBuZXh0IHNpYmxpbmcgZWxlbWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXh0RWxlbWVudCAobm9kZSkge1xuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICByZXR1cm4gbm9kZVxuICAgIH1cbiAgICBub2RlID0gbm9kZS5uZXh0U2libGluZ1xuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBwcmV2aW91cyBzaWJsaW5nIGVsZW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJldmlvdXNFbGVtZW50IChub2RlKSB7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgIHJldHVybiBub2RlXG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZ1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0IGEgbm9kZSBpbnRvIGxpc3QgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgbm9kZVxuICogQHBhcmFtIHthcnJheX0gbGlzdFxuICogQHBhcmFtIHtudW1iZXJ9IG5ld0luZGV4XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoYW5nZVNpYmxpbmdcbiAqIEByZXR1cm4ge251bWJlcn0gbmV3SW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydEluZGV4ICh0YXJnZXQsIGxpc3QsIG5ld0luZGV4LCBjaGFuZ2VTaWJsaW5nKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmIChuZXdJbmRleCA8IDApIHtcbiAgICBuZXdJbmRleCA9IDBcbiAgfVxuICBjb25zdCBiZWZvcmUgPSBsaXN0W25ld0luZGV4IC0gMV1cbiAgY29uc3QgYWZ0ZXIgPSBsaXN0W25ld0luZGV4XVxuICBsaXN0LnNwbGljZShuZXdJbmRleCwgMCwgdGFyZ2V0KVxuICBpZiAoY2hhbmdlU2libGluZykge1xuICAgIGJlZm9yZSAmJiAoYmVmb3JlLm5leHRTaWJsaW5nID0gdGFyZ2V0KVxuICAgIHRhcmdldC5wcmV2aW91c1NpYmxpbmcgPSBiZWZvcmVcbiAgICB0YXJnZXQubmV4dFNpYmxpbmcgPSBhZnRlclxuICAgIGFmdGVyICYmIChhZnRlci5wcmV2aW91c1NpYmxpbmcgPSB0YXJnZXQpXG4gIH1cbiAgcmV0dXJuIG5ld0luZGV4XG59XG5cbi8qKlxuICogTW92ZSB0aGUgbm9kZSB0byBhIG5ldyBpbmRleCBpbiBsaXN0LlxuICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBub2RlXG4gKiBAcGFyYW0ge2FycmF5fSBsaXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbmV3SW5kZXhcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY2hhbmdlU2libGluZ1xuICogQHJldHVybiB7bnVtYmVyfSBuZXdJbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gbW92ZUluZGV4ICh0YXJnZXQsIGxpc3QsIG5ld0luZGV4LCBjaGFuZ2VTaWJsaW5nKSB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKHRhcmdldClcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChjaGFuZ2VTaWJsaW5nKSB7XG4gICAgY29uc3QgYmVmb3JlID0gbGlzdFtpbmRleCAtIDFdXG4gICAgY29uc3QgYWZ0ZXIgPSBsaXN0W2luZGV4ICsgMV1cbiAgICBiZWZvcmUgJiYgKGJlZm9yZS5uZXh0U2libGluZyA9IGFmdGVyKVxuICAgIGFmdGVyICYmIChhZnRlci5wcmV2aW91c1NpYmxpbmcgPSBiZWZvcmUpXG4gIH1cbiAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG4gIGxldCBuZXdJbmRleEFmdGVyID0gbmV3SW5kZXhcbiAgaWYgKGluZGV4IDw9IG5ld0luZGV4KSB7XG4gICAgbmV3SW5kZXhBZnRlciA9IG5ld0luZGV4IC0gMVxuICB9XG4gIGNvbnN0IGJlZm9yZU5ldyA9IGxpc3RbbmV3SW5kZXhBZnRlciAtIDFdXG4gIGNvbnN0IGFmdGVyTmV3ID0gbGlzdFtuZXdJbmRleEFmdGVyXVxuICBsaXN0LnNwbGljZShuZXdJbmRleEFmdGVyLCAwLCB0YXJnZXQpXG4gIGlmIChjaGFuZ2VTaWJsaW5nKSB7XG4gICAgYmVmb3JlTmV3ICYmIChiZWZvcmVOZXcubmV4dFNpYmxpbmcgPSB0YXJnZXQpXG4gICAgdGFyZ2V0LnByZXZpb3VzU2libGluZyA9IGJlZm9yZU5ld1xuICAgIHRhcmdldC5uZXh0U2libGluZyA9IGFmdGVyTmV3XG4gICAgYWZ0ZXJOZXcgJiYgKGFmdGVyTmV3LnByZXZpb3VzU2libGluZyA9IHRhcmdldClcbiAgfVxuICBpZiAoaW5kZXggPT09IG5ld0luZGV4QWZ0ZXIpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICByZXR1cm4gbmV3SW5kZXhcbn1cblxuLyoqXG4gKiBSZW1vdmUgdGhlIG5vZGUgZnJvbSBsaXN0LlxuICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBub2RlXG4gKiBAcGFyYW0ge2FycmF5fSBsaXN0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoYW5nZVNpYmxpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUluZGV4ICh0YXJnZXQsIGxpc3QsIGNoYW5nZVNpYmxpbmcpIHtcbiAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YodGFyZ2V0KVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKGNoYW5nZVNpYmxpbmcpIHtcbiAgICBjb25zdCBiZWZvcmUgPSBsaXN0W2luZGV4IC0gMV1cbiAgICBjb25zdCBhZnRlciA9IGxpc3RbaW5kZXggKyAxXVxuICAgIGJlZm9yZSAmJiAoYmVmb3JlLm5leHRTaWJsaW5nID0gYWZ0ZXIpXG4gICAgYWZ0ZXIgJiYgKGFmdGVyLnByZXZpb3VzU2libGluZyA9IGJlZm9yZSlcbiAgfVxuICBsaXN0LnNwbGljZShpbmRleCwgMSlcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyB1bmlxdWVJZCB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcbmltcG9ydCB7IGdldERvYyB9IGZyb20gJy4vb3BlcmF0aW9uJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOb2RlIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMubm9kZUlkID0gdW5pcXVlSWQoKVxuICAgIHRoaXMucmVmID0gdGhpcy5ub2RlSWRcbiAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICB0aGlzLnB1cmVDaGlsZHJlbiA9IFtdXG4gICAgdGhpcy5wYXJlbnROb2RlID0gbnVsbFxuICAgIHRoaXMubmV4dFNpYmxpbmcgPSBudWxsXG4gICAgdGhpcy5wcmV2aW91c1NpYmxpbmcgPSBudWxsXG4gIH1cblxuICAvKipcbiAgKiBEZXN0cm95IGN1cnJlbnQgbm9kZSwgYW5kIHJlbW92ZSBpdHNlbGYgZm9ybSBub2RlTWFwLlxuICAqL1xuICBkZXN0cm95ICgpIHtcbiAgICBjb25zdCBkb2MgPSBnZXREb2ModGhpcy5kb2NJZClcbiAgICBpZiAoZG9jKSB7XG4gICAgICBkZWxldGUgdGhpcy5kb2NJZFxuICAgICAgZGVsZXRlIGRvYy5ub2RlTWFwW3RoaXMubm9kZUlkXVxuICAgIH1cbiAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgY2hpbGQuZGVzdHJveSgpXG4gICAgfSlcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgeyBnZXRUYXNrQ2VudGVyIH0gZnJvbSAnLi9vcGVyYXRpb24nXG5cbmxldCBFbGVtZW50XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRFbGVtZW50IChFbCkge1xuICBFbGVtZW50ID0gRWxcbn1cblxuLyoqXG4gKiBBIG1hcCB3aGljaCBzdG9yZXMgYWxsIHR5cGUgb2YgZWxlbWVudHMuXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5jb25zdCByZWdpc3RlcmVkRWxlbWVudHMgPSB7fVxuXG4vKipcbiAqIFJlZ2lzdGVyIGFuIGV4dGVuZGVkIGVsZW1lbnQgdHlwZSB3aXRoIGNvbXBvbmVudCBtZXRob2RzLlxuICogQHBhcmFtICB7c3RyaW5nfSB0eXBlICAgIGNvbXBvbmVudCB0eXBlXG4gKiBAcGFyYW0gIHthcnJheX0gIG1ldGhvZHMgYSBsaXN0IG9mIG1ldGhvZCBuYW1lc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJFbGVtZW50ICh0eXBlLCBtZXRob2RzKSB7XG4gIC8vIFNraXAgd2hlbiBubyBzcGVjaWFsIGNvbXBvbmVudCBtZXRob2RzLlxuICBpZiAoIW1ldGhvZHMgfHwgIW1ldGhvZHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBJbml0IGNvbnN0cnVjdG9yLlxuICBjbGFzcyBXZWV4RWxlbWVudCBleHRlbmRzIEVsZW1lbnQge31cblxuICAvLyBBZGQgbWV0aG9kcyB0byBwcm90b3R5cGUuXG4gIG1ldGhvZHMuZm9yRWFjaChtZXRob2ROYW1lID0+IHtcbiAgICBXZWV4RWxlbWVudC5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgIHJldHVybiB0YXNrQ2VudGVyLnNlbmQoJ2NvbXBvbmVudCcsIHtcbiAgICAgICAgICByZWY6IHRoaXMucmVmLFxuICAgICAgICAgIGNvbXBvbmVudDogdHlwZSxcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZE5hbWVcbiAgICAgICAgfSwgYXJncylcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgLy8gQWRkIHRvIGVsZW1lbnQgdHlwZSBtYXAuXG4gIHJlZ2lzdGVyZWRFbGVtZW50c1t0eXBlXSA9IFdlZXhFbGVtZW50XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bnJlZ2lzdGVyRWxlbWVudCAodHlwZSkge1xuICBkZWxldGUgcmVnaXN0ZXJlZEVsZW1lbnRzW3R5cGVdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXZWV4RWxlbWVudCAodHlwZSkge1xuICByZXR1cm4gcmVnaXN0ZXJlZEVsZW1lbnRzW3R5cGVdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1dlZXhFbGVtZW50ICh0eXBlKSB7XG4gIHJldHVybiAhIXJlZ2lzdGVyZWRFbGVtZW50c1t0eXBlXVxufVxuXG4vKipcbiAqIENsZWFyIGFsbCBlbGVtZW50IHR5cGVzLiBPbmx5IGZvciB0ZXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJXZWV4RWxlbWVudHMgKCkge1xuICBmb3IgKGNvbnN0IHR5cGUgaW4gcmVnaXN0ZXJlZEVsZW1lbnRzKSB7XG4gICAgdW5yZWdpc3RlckVsZW1lbnQodHlwZSlcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBOb2RlIGZyb20gJy4vTm9kZSdcbmltcG9ydCB7XG4gIGdldERvYyxcbiAgZ2V0VGFza0NlbnRlcixcbiAgbGlua1BhcmVudCxcbiAgbmV4dEVsZW1lbnQsXG4gIHByZXZpb3VzRWxlbWVudCxcbiAgaW5zZXJ0SW5kZXgsXG4gIG1vdmVJbmRleCxcbiAgcmVtb3ZlSW5kZXhcbn0gZnJvbSAnLi9vcGVyYXRpb24nXG5pbXBvcnQgeyB1bmlxdWVJZCwgaXNFbXB0eSB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcbmltcG9ydCB7IGdldFdlZXhFbGVtZW50LCBzZXRFbGVtZW50IH0gZnJvbSAnLi9XZWV4RWxlbWVudCdcblxuY29uc3QgREVGQVVMVF9UQUdfTkFNRSA9ICdkaXYnXG5jb25zdCBCVUJCTEVfRVZFTlRTID0gW1xuICAnY2xpY2snLCAnbG9uZ3ByZXNzJywgJ3RvdWNoc3RhcnQnLCAndG91Y2htb3ZlJywgJ3RvdWNoZW5kJyxcbiAgJ3BhbnN0YXJ0JywgJ3Bhbm1vdmUnLCAncGFuZW5kJywgJ2hvcml6b250YWxwYW4nLCAndmVydGljYWxwYW4nLCAnc3dpcGUnXG5dXG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTm9kZSAoZG9jSWQsIG5vZGUpIHtcbiAgY29uc3QgZG9jID0gZ2V0RG9jKGRvY0lkKVxuICBkb2Mubm9kZU1hcFtub2RlLm5vZGVJZF0gPSBub2RlXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVsZW1lbnQgZXh0ZW5kcyBOb2RlIHtcbiAgY29uc3RydWN0b3IgKHR5cGUgPSBERUZBVUxUX1RBR19OQU1FLCBwcm9wcywgaXNFeHRlbmRlZCkge1xuICAgIHN1cGVyKClcblxuICAgIGNvbnN0IFdlZXhFbGVtZW50ID0gZ2V0V2VleEVsZW1lbnQodHlwZSlcbiAgICBpZiAoV2VleEVsZW1lbnQgJiYgIWlzRXh0ZW5kZWQpIHtcbiAgICAgIHJldHVybiBuZXcgV2VleEVsZW1lbnQodHlwZSwgcHJvcHMsIHRydWUpXG4gICAgfVxuXG4gICAgcHJvcHMgPSBwcm9wcyB8fCB7fVxuICAgIHRoaXMubm9kZVR5cGUgPSAxXG4gICAgdGhpcy5ub2RlSWQgPSB1bmlxdWVJZCgpXG4gICAgdGhpcy5yZWYgPSB0aGlzLm5vZGVJZFxuICAgIHRoaXMudHlwZSA9IHR5cGVcbiAgICB0aGlzLmF0dHIgPSBwcm9wcy5hdHRyIHx8IHt9XG4gICAgdGhpcy5zdHlsZSA9IHByb3BzLnN0eWxlIHx8IHt9XG4gICAgdGhpcy5jbGFzc1N0eWxlID0gcHJvcHMuY2xhc3NTdHlsZSB8fCB7fVxuICAgIHRoaXMuZXZlbnQgPSB7fVxuICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgIHRoaXMucHVyZUNoaWxkcmVuID0gW11cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmQgYSBjaGlsZCBub2RlLlxuICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGFwcGVuZENoaWxkIChub2RlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmICghbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICBsaW5rUGFyZW50KG5vZGUsIHRoaXMpXG4gICAgICBpbnNlcnRJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmxlbmd0aCwgdHJ1ZSlcbiAgICAgIGlmICh0aGlzLmRvY0lkKSB7XG4gICAgICAgIHJlZ2lzdGVyTm9kZSh0aGlzLmRvY0lkLCBub2RlKVxuICAgICAgfVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgaW5zZXJ0SW5kZXgobm9kZSwgdGhpcy5wdXJlQ2hpbGRyZW4sIHRoaXMucHVyZUNoaWxkcmVuLmxlbmd0aClcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ2FkZEVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbdGhpcy5yZWYsIG5vZGUudG9KU09OKCksIC0xXVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1vdmVJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmxlbmd0aCwgdHJ1ZSlcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gbW92ZUluZGV4KG5vZGUsIHRoaXMucHVyZUNoaWxkcmVuLCB0aGlzLnB1cmVDaGlsZHJlbi5sZW5ndGgpXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyICYmIGluZGV4ID49IDApIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ21vdmVFbGVtZW50JyB9LFxuICAgICAgICAgICAgW25vZGUucmVmLCB0aGlzLnJlZiwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydCBhIG5vZGUgYmVmb3JlIHNwZWNpZmllZCBub2RlLlxuICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICAgKiBAcGFyYW0ge29iamVjdH0gYmVmb3JlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgaW5zZXJ0QmVmb3JlIChub2RlLCBiZWZvcmUpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlICYmIG5vZGUucGFyZW50Tm9kZSAhPT0gdGhpcykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChub2RlID09PSBiZWZvcmUgfHwgKG5vZGUubmV4dFNpYmxpbmcgJiYgbm9kZS5uZXh0U2libGluZyA9PT0gYmVmb3JlKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmICghbm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICBsaW5rUGFyZW50KG5vZGUsIHRoaXMpXG4gICAgICBpbnNlcnRJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmluZGV4T2YoYmVmb3JlKSwgdHJ1ZSlcbiAgICAgIGlmICh0aGlzLmRvY0lkKSB7XG4gICAgICAgIHJlZ2lzdGVyTm9kZSh0aGlzLmRvY0lkLCBub2RlKVxuICAgICAgfVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgcHVyZUJlZm9yZSA9IG5leHRFbGVtZW50KGJlZm9yZSlcbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnNlcnRJbmRleChcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIHRoaXMucHVyZUNoaWxkcmVuLFxuICAgICAgICAgIHB1cmVCZWZvcmVcbiAgICAgICAgICAgID8gdGhpcy5wdXJlQ2hpbGRyZW4uaW5kZXhPZihwdXJlQmVmb3JlKVxuICAgICAgICAgICAgOiB0aGlzLnB1cmVDaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgKVxuICAgICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgICAgIHJldHVybiB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICAgIHsgYWN0aW9uOiAnYWRkRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFt0aGlzLnJlZiwgbm9kZS50b0pTT04oKSwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW92ZUluZGV4KG5vZGUsIHRoaXMuY2hpbGRyZW4sIHRoaXMuY2hpbGRyZW4uaW5kZXhPZihiZWZvcmUpLCB0cnVlKVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgcHVyZUJlZm9yZSA9IG5leHRFbGVtZW50KGJlZm9yZSlcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgY29uc3QgaW5kZXggPSBtb3ZlSW5kZXgoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICB0aGlzLnB1cmVDaGlsZHJlbixcbiAgICAgICAgICBwdXJlQmVmb3JlXG4gICAgICAgICAgICA/IHRoaXMucHVyZUNoaWxkcmVuLmluZGV4T2YocHVyZUJlZm9yZSlcbiAgICAgICAgICAgIDogdGhpcy5wdXJlQ2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgaWYgKHRhc2tDZW50ZXIgJiYgaW5kZXggPj0gMCkge1xuICAgICAgICAgIHJldHVybiB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICAgIHsgYWN0aW9uOiAnbW92ZUVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbbm9kZS5yZWYsIHRoaXMucmVmLCBpbmRleF1cbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0IGEgbm9kZSBhZnRlciBzcGVjaWZpZWQgbm9kZS5cbiAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAgICogQHBhcmFtIHtvYmplY3R9IGFmdGVyXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgaW5zZXJ0QWZ0ZXIgKG5vZGUsIGFmdGVyKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAobm9kZSA9PT0gYWZ0ZXIgfHwgKG5vZGUucHJldmlvdXNTaWJsaW5nICYmIG5vZGUucHJldmlvdXNTaWJsaW5nID09PSBhZnRlcikpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIW5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbGlua1BhcmVudChub2RlLCB0aGlzKVxuICAgICAgaW5zZXJ0SW5kZXgobm9kZSwgdGhpcy5jaGlsZHJlbiwgdGhpcy5jaGlsZHJlbi5pbmRleE9mKGFmdGVyKSArIDEsIHRydWUpXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKHRoaXMuZG9jSWQpIHtcbiAgICAgICAgcmVnaXN0ZXJOb2RlKHRoaXMuZG9jSWQsIG5vZGUpXG4gICAgICB9XG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICBjb25zdCBpbmRleCA9IGluc2VydEluZGV4KFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4sXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4uaW5kZXhPZihwcmV2aW91c0VsZW1lbnQoYWZ0ZXIpKSArIDFcbiAgICAgICAgKVxuICAgICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgICAgIHJldHVybiB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICAgIHsgYWN0aW9uOiAnYWRkRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFt0aGlzLnJlZiwgbm9kZS50b0pTT04oKSwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbW92ZUluZGV4KG5vZGUsIHRoaXMuY2hpbGRyZW4sIHRoaXMuY2hpbGRyZW4uaW5kZXhPZihhZnRlcikgKyAxLCB0cnVlKVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBtb3ZlSW5kZXgoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICB0aGlzLnB1cmVDaGlsZHJlbixcbiAgICAgICAgICB0aGlzLnB1cmVDaGlsZHJlbi5pbmRleE9mKHByZXZpb3VzRWxlbWVudChhZnRlcikpICsgMVxuICAgICAgICApXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyICYmIGluZGV4ID49IDApIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ21vdmVFbGVtZW50JyB9LFxuICAgICAgICAgICAgW25vZGUucmVmLCB0aGlzLnJlZiwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIGNoaWxkIG5vZGUsIGFuZCBkZWNpZGUgd2hldGhlciBpdCBzaG91bGQgYmUgZGVzdHJveWVkLlxuICAgKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHByZXNlcnZlZFxuICAgKi9cbiAgcmVtb3ZlQ2hpbGQgKG5vZGUsIHByZXNlcnZlZCkge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIHJlbW92ZUluZGV4KG5vZGUsIHRoaXMuY2hpbGRyZW4sIHRydWUpXG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICByZW1vdmVJbmRleChub2RlLCB0aGlzLnB1cmVDaGlsZHJlbilcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgICB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICAgIHsgYWN0aW9uOiAncmVtb3ZlRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFtub2RlLnJlZl1cbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwcmVzZXJ2ZWQpIHtcbiAgICAgIG5vZGUuZGVzdHJveSgpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsZWFyIGFsbCBjaGlsZCBub2Rlcy5cbiAgICovXG4gIGNsZWFyICgpIHtcbiAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgIHRoaXMucHVyZUNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ3JlbW92ZUVsZW1lbnQnIH0sXG4gICAgICAgICAgW25vZGUucmVmXVxuICAgICAgICApXG4gICAgICB9KVxuICAgIH1cbiAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBub2RlLmRlc3Ryb3koKVxuICAgIH0pXG4gICAgdGhpcy5jaGlsZHJlbi5sZW5ndGggPSAwXG4gICAgdGhpcy5wdXJlQ2hpbGRyZW4ubGVuZ3RoID0gMFxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhbiBhdHRyaWJ1dGUsIGFuZCBkZWNpZGUgd2hldGhlciB0aGUgdGFzayBzaG91bGQgYmUgc2VuZCB0byBuYXRpdmUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IHZhbHVlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2lsZW50XG4gICAqL1xuICBzZXRBdHRyIChrZXksIHZhbHVlLCBzaWxlbnQpIHtcbiAgICBpZiAodGhpcy5hdHRyW2tleV0gPT09IHZhbHVlICYmIHNpbGVudCAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmF0dHJba2V5XSA9IHZhbHVlXG4gICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICBpZiAoIXNpbGVudCAmJiB0YXNrQ2VudGVyKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB7fVxuICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAnZG9tJyxcbiAgICAgICAgeyBhY3Rpb246ICd1cGRhdGVBdHRycycgfSxcbiAgICAgICAgW3RoaXMucmVmLCByZXN1bHRdXG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBiYXRjaGVkIGF0dHJpYnV0ZXMuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBiYXRjaGVkQXR0cnNcbiAgICogQHBhcmFtIHtib29sZWFufSBzaWxlbnRcbiAgICovXG4gIHNldEF0dHJzIChiYXRjaGVkQXR0cnMsIHNpbGVudCkge1xuICAgIGlmIChpc0VtcHR5KGJhdGNoZWRBdHRycykpIHJldHVyblxuICAgIGNvbnN0IG11dGF0aW9ucyA9IHt9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYmF0Y2hlZEF0dHJzKSB7XG4gICAgICBpZiAodGhpcy5hdHRyW2tleV0gIT09IGJhdGNoZWRBdHRyc1trZXldKSB7XG4gICAgICAgIHRoaXMuYXR0cltrZXldID0gYmF0Y2hlZEF0dHJzW2tleV1cbiAgICAgICAgbXV0YXRpb25zW2tleV0gPSBiYXRjaGVkQXR0cnNba2V5XVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWlzRW1wdHkobXV0YXRpb25zKSkge1xuICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgIGlmICghc2lsZW50ICYmIHRhc2tDZW50ZXIpIHtcbiAgICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICdkb20nLFxuICAgICAgICAgIHsgYWN0aW9uOiAndXBkYXRlQXR0cnMnIH0sXG4gICAgICAgICAgW3RoaXMucmVmLCBtdXRhdGlvbnNdXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgc3R5bGUgcHJvcGVydHksIGFuZCBkZWNpZGUgd2hldGhlciB0aGUgdGFzayBzaG91bGQgYmUgc2VuZCB0byBuYXRpdmUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXJ9IHZhbHVlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2lsZW50XG4gICAqL1xuICBzZXRTdHlsZSAoa2V5LCB2YWx1ZSwgc2lsZW50KSB7XG4gICAgaWYgKHRoaXMuc3R5bGVba2V5XSA9PT0gdmFsdWUgJiYgc2lsZW50ICE9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuc3R5bGVba2V5XSA9IHZhbHVlXG4gICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICBpZiAoIXNpbGVudCAmJiB0YXNrQ2VudGVyKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB7fVxuICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAnZG9tJyxcbiAgICAgICAgeyBhY3Rpb246ICd1cGRhdGVTdHlsZScgfSxcbiAgICAgICAgW3RoaXMucmVmLCByZXN1bHRdXG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBiYXRjaGVkIHN0eWxlIHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBiYXRjaGVkU3R5bGVzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2lsZW50XG4gICAqL1xuICBzZXRTdHlsZXMgKGJhdGNoZWRTdHlsZXMsIHNpbGVudCkge1xuICAgIGlmIChpc0VtcHR5KGJhdGNoZWRTdHlsZXMpKSByZXR1cm5cbiAgICBjb25zdCBtdXRhdGlvbnMgPSB7fVxuICAgIGZvciAoY29uc3Qga2V5IGluIGJhdGNoZWRTdHlsZXMpIHtcbiAgICAgIGlmICh0aGlzLnN0eWxlW2tleV0gIT09IGJhdGNoZWRTdHlsZXNba2V5XSkge1xuICAgICAgICB0aGlzLnN0eWxlW2tleV0gPSBiYXRjaGVkU3R5bGVzW2tleV1cbiAgICAgICAgbXV0YXRpb25zW2tleV0gPSBiYXRjaGVkU3R5bGVzW2tleV1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpc0VtcHR5KG11dGF0aW9ucykpIHtcbiAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICBpZiAoIXNpbGVudCAmJiB0YXNrQ2VudGVyKSB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ3VwZGF0ZVN0eWxlJyB9LFxuICAgICAgICAgIFt0aGlzLnJlZiwgbXV0YXRpb25zXVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBzdHlsZSBwcm9wZXJ0aWVzIGZyb20gY2xhc3MuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjbGFzc1N0eWxlXG4gICAqL1xuICBzZXRDbGFzc1N0eWxlIChjbGFzc1N0eWxlKSB7XG4gICAgLy8gcmVzZXQgcHJldmlvdXMgY2xhc3Mgc3R5bGUgdG8gZW1wdHkgc3RyaW5nXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5jbGFzc1N0eWxlKSB7XG4gICAgICB0aGlzLmNsYXNzU3R5bGVba2V5XSA9ICcnXG4gICAgfVxuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmNsYXNzU3R5bGUsIGNsYXNzU3R5bGUpXG4gICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAnZG9tJyxcbiAgICAgICAgeyBhY3Rpb246ICd1cGRhdGVTdHlsZScgfSxcbiAgICAgICAgW3RoaXMucmVmLCB0aGlzLnRvU3R5bGUoKV1cbiAgICAgIClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGV2ZW50IGhhbmRsZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50IGhhbmRsZXJcbiAgICovXG4gIGFkZEV2ZW50ICh0eXBlLCBoYW5kbGVyLCBwYXJhbXMpIHtcbiAgICBpZiAoIXRoaXMuZXZlbnQpIHtcbiAgICAgIHRoaXMuZXZlbnQgPSB7fVxuICAgIH1cbiAgICBpZiAoIXRoaXMuZXZlbnRbdHlwZV0pIHtcbiAgICAgIHRoaXMuZXZlbnRbdHlwZV0gPSB7IGhhbmRsZXIsIHBhcmFtcyB9XG4gICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICdkb20nLFxuICAgICAgICAgIHsgYWN0aW9uOiAnYWRkRXZlbnQnIH0sXG4gICAgICAgICAgW3RoaXMucmVmLCB0eXBlXVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgdHlwZVxuICAgKi9cbiAgcmVtb3ZlRXZlbnQgKHR5cGUpIHtcbiAgICBpZiAodGhpcy5ldmVudCAmJiB0aGlzLmV2ZW50W3R5cGVdKSB7XG4gICAgICBkZWxldGUgdGhpcy5ldmVudFt0eXBlXVxuICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ3JlbW92ZUV2ZW50JyB9LFxuICAgICAgICAgIFt0aGlzLnJlZiwgdHlwZV1cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlIGFuIGV2ZW50IG1hbnVhbGx5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSB0eXBlXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGV2ZW50IGhhbmRsZXJcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0J1YmJsZSB3aGV0aGVyIG9yIG5vdCBldmVudCBidWJibGVcbiAgICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zXG4gICAqIEByZXR1cm4ge30gYW55dGhpbmcgcmV0dXJuZWQgYnkgaGFuZGxlciBmdW5jdGlvblxuICAgKi9cbiAgZmlyZUV2ZW50ICh0eXBlLCBldmVudCwgaXNCdWJibGUsIG9wdGlvbnMpIHtcbiAgICBsZXQgcmVzdWx0ID0gbnVsbFxuICAgIGxldCBpc1N0b3BQcm9wYWdhdGlvbiA9IGZhbHNlXG4gICAgY29uc3QgZXZlbnREZXNjID0gdGhpcy5ldmVudFt0eXBlXVxuICAgIGlmIChldmVudERlc2MgJiYgZXZlbnQpIHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSBldmVudERlc2MuaGFuZGxlclxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uID0gKCkgPT4ge1xuICAgICAgICBpc1N0b3BQcm9wYWdhdGlvbiA9IHRydWVcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucGFyYW1zKSB7XG4gICAgICAgIHJlc3VsdCA9IGhhbmRsZXIuY2FsbCh0aGlzLCAuLi5vcHRpb25zLnBhcmFtcywgZXZlbnQpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gaGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghaXNTdG9wUHJvcGFnYXRpb25cbiAgICAgICYmIGlzQnViYmxlXG4gICAgICAmJiAoQlVCQkxFX0VWRU5UUy5pbmRleE9mKHR5cGUpICE9PSAtMSlcbiAgICAgICYmIHRoaXMucGFyZW50Tm9kZVxuICAgICAgJiYgdGhpcy5wYXJlbnROb2RlLmZpcmVFdmVudCkge1xuICAgICAgZXZlbnQuY3VycmVudFRhcmdldCA9IHRoaXMucGFyZW50Tm9kZVxuICAgICAgdGhpcy5wYXJlbnROb2RlLmZpcmVFdmVudCh0eXBlLCBldmVudCwgaXNCdWJibGUpIC8vIG5vIG9wdGlvbnNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBzdHlsZXMgb2YgY3VycmVudCBlbGVtZW50LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHN0eWxlXG4gICAqL1xuICB0b1N0eWxlICgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5jbGFzc1N0eWxlLCB0aGlzLnN0eWxlKVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgY3VycmVudCBlbGVtZW50IHRvIEpTT04gbGlrZSBvYmplY3QuXG4gICAqIEByZXR1cm4ge29iamVjdH0gZWxlbWVudFxuICAgKi9cbiAgdG9KU09OICgpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICByZWY6IHRoaXMucmVmLnRvU3RyaW5nKCksXG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBhdHRyOiB0aGlzLmF0dHIsXG4gICAgICBzdHlsZTogdGhpcy50b1N0eWxlKClcbiAgICB9XG4gICAgY29uc3QgZXZlbnQgPSBbXVxuICAgIGZvciAoY29uc3QgdHlwZSBpbiB0aGlzLmV2ZW50KSB7XG4gICAgICBjb25zdCB7IHBhcmFtcyB9ID0gdGhpcy5ldmVudFt0eXBlXVxuICAgICAgaWYgKCFwYXJhbXMpIHtcbiAgICAgICAgZXZlbnQucHVzaCh0eXBlKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGV2ZW50LnB1c2goeyB0eXBlLCBwYXJhbXMgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGV2ZW50Lmxlbmd0aCkge1xuICAgICAgcmVzdWx0LmV2ZW50ID0gZXZlbnRcbiAgICB9XG4gICAgaWYgKHRoaXMucHVyZUNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgcmVzdWx0LmNoaWxkcmVuID0gdGhpcy5wdXJlQ2hpbGRyZW4ubWFwKChjaGlsZCkgPT4gY2hpbGQudG9KU09OKCkpXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRvIEhUTUwgZWxlbWVudCB0YWcgc3RyaW5nLlxuICAgKiBAcmV0dXJuIHtzdGlybmd9IGh0bWxcbiAgICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJzwnICsgdGhpcy50eXBlICtcbiAgICAnIGF0dHI9JyArIEpTT04uc3RyaW5naWZ5KHRoaXMuYXR0cikgK1xuICAgICcgc3R5bGU9JyArIEpTT04uc3RyaW5naWZ5KHRoaXMudG9TdHlsZSgpKSArICc+JyArXG4gICAgdGhpcy5wdXJlQ2hpbGRyZW4ubWFwKChjaGlsZCkgPT4gY2hpbGQudG9TdHJpbmcoKSkuam9pbignJykgK1xuICAgICc8LycgKyB0aGlzLnR5cGUgKyAnPidcbiAgfVxufVxuXG5zZXRFbGVtZW50KEVsZW1lbnQpXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IENhbGxiYWNrTWFuYWdlciBmcm9tICcuL0NhbGxiYWNrTWFuYWdlcidcbmltcG9ydCBFbGVtZW50IGZyb20gJy4uL3Zkb20vRWxlbWVudCdcbmltcG9ydCB7IHR5cG9mIH0gZnJvbSAnLi4vc2hhcmVkL3V0aWxzJ1xuaW1wb3J0IHsgbm9ybWFsaXplUHJpbWl0aXZlIH0gZnJvbSAnLi9ub3JtYWxpemUnXG5cbmxldCBmYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9XG5cbi8vIFRoZSBBUEkgb2YgVGFza0NlbnRlciB3b3VsZCBiZSByZS1kZXNpZ24uXG5leHBvcnQgY2xhc3MgVGFza0NlbnRlciB7XG4gIGNvbnN0cnVjdG9yIChpZCwgc2VuZFRhc2tzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdpbnN0YW5jZUlkJywge1xuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBTdHJpbmcoaWQpXG4gICAgfSlcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2NhbGxiYWNrTWFuYWdlcicsIHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbmV3IENhbGxiYWNrTWFuYWdlcihpZClcbiAgICB9KVxuICAgIGZhbGxiYWNrID0gc2VuZFRhc2tzIHx8IGZ1bmN0aW9uICgpIHt9XG4gIH1cblxuICBjYWxsYmFjayAoY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsYmFja01hbmFnZXIuY29uc3VtZShjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSlcbiAgfVxuXG4gIHJlZ2lzdGVySG9vayAoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrTWFuYWdlci5yZWdpc3Rlckhvb2soLi4uYXJncylcbiAgfVxuXG4gIHRyaWdnZXJIb29rICguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbGJhY2tNYW5hZ2VyLnRyaWdnZXJIb29rKC4uLmFyZ3MpXG4gIH1cblxuICB1cGRhdGVEYXRhIChjb21wb25lbnRJZCwgbmV3RGF0YSwgY2FsbGJhY2spIHtcbiAgICB0aGlzLnNlbmQoJ21vZHVsZScsIHtcbiAgICAgIG1vZHVsZTogJ2RvbScsXG4gICAgICBtZXRob2Q6ICd1cGRhdGVDb21wb25lbnREYXRhJ1xuICAgIH0sIFtjb21wb25lbnRJZCwgbmV3RGF0YSwgY2FsbGJhY2tdKVxuICB9XG5cbiAgZGVzdHJveUNhbGxiYWNrICgpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsYmFja01hbmFnZXIuY2xvc2UoKVxuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZSBhIHZhbHVlLiBTcGVjaWFsbHksIGlmIHRoZSB2YWx1ZSBpcyBhIGZ1bmN0aW9uLCB0aGVuIGdlbmVyYXRlIGEgZnVuY3Rpb24gaWRcbiAgICogYW5kIHNhdmUgaXQgdG8gYENhbGxiYWNrTWFuYWdlcmAsIGF0IGxhc3QgcmV0dXJuIHRoZSBmdW5jdGlvbiBpZC5cbiAgICogQHBhcmFtICB7YW55fSAgICAgICAgdlxuICAgKiBAcmV0dXJuIHtwcmltaXRpdmV9XG4gICAqL1xuICBub3JtYWxpemUgKHYpIHtcbiAgICBjb25zdCB0eXBlID0gdHlwb2YodilcbiAgICBpZiAodiAmJiB2IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgcmV0dXJuIHYucmVmXG4gICAgfVxuICAgIGlmICh2ICYmIHYuX2lzVnVlICYmIHYuJGVsIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgcmV0dXJuIHYuJGVsLnJlZlxuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ0Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMuY2FsbGJhY2tNYW5hZ2VyLmFkZCh2KS50b1N0cmluZygpXG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVQcmltaXRpdmUodilcbiAgfVxuXG4gIHNlbmQgKHR5cGUsIHBhcmFtcywgYXJncywgb3B0aW9ucykge1xuICAgIGNvbnN0IHsgYWN0aW9uLCBjb21wb25lbnQsIHJlZiwgbW9kdWxlLCBtZXRob2QgfSA9IHBhcmFtc1xuXG4gICAgYXJncyA9IGFyZ3MubWFwKGFyZyA9PiB0aGlzLm5vcm1hbGl6ZShhcmcpKVxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdkb20nOlxuICAgICAgICByZXR1cm4gdGhpc1thY3Rpb25dKHRoaXMuaW5zdGFuY2VJZCwgYXJncylcbiAgICAgIGNhc2UgJ2NvbXBvbmVudCc6XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudEhhbmRsZXIodGhpcy5pbnN0YW5jZUlkLCByZWYsIG1ldGhvZCwgYXJncywgT2JqZWN0LmFzc2lnbih7IGNvbXBvbmVudCB9LCBvcHRpb25zKSlcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZUhhbmRsZXIodGhpcy5pbnN0YW5jZUlkLCBtb2R1bGUsIG1ldGhvZCwgYXJncywgb3B0aW9ucylcbiAgICB9XG4gIH1cblxuICBjYWxsRE9NIChhY3Rpb24sIGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpc1thY3Rpb25dKHRoaXMuaW5zdGFuY2VJZCwgYXJncylcbiAgfVxuXG4gIGNhbGxDb21wb25lbnQgKHJlZiwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9uZW50SGFuZGxlcih0aGlzLmluc3RhbmNlSWQsIHJlZiwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKVxuICB9XG5cbiAgY2FsbE1vZHVsZSAobW9kdWxlLCBtZXRob2QsIGFyZ3MsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGVIYW5kbGVyKHRoaXMuaW5zdGFuY2VJZCwgbW9kdWxlLCBtZXRob2QsIGFyZ3MsIG9wdGlvbnMpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXQgKCkge1xuICBjb25zdCBET01fTUVUSE9EUyA9IHtcbiAgICBjcmVhdGVGaW5pc2g6IGdsb2JhbC5jYWxsQ3JlYXRlRmluaXNoLFxuICAgIHVwZGF0ZUZpbmlzaDogZ2xvYmFsLmNhbGxVcGRhdGVGaW5pc2gsXG4gICAgcmVmcmVzaEZpbmlzaDogZ2xvYmFsLmNhbGxSZWZyZXNoRmluaXNoLFxuXG4gICAgY3JlYXRlQm9keTogZ2xvYmFsLmNhbGxDcmVhdGVCb2R5LFxuXG4gICAgYWRkRWxlbWVudDogZ2xvYmFsLmNhbGxBZGRFbGVtZW50LFxuICAgIHJlbW92ZUVsZW1lbnQ6IGdsb2JhbC5jYWxsUmVtb3ZlRWxlbWVudCxcbiAgICBtb3ZlRWxlbWVudDogZ2xvYmFsLmNhbGxNb3ZlRWxlbWVudCxcbiAgICB1cGRhdGVBdHRyczogZ2xvYmFsLmNhbGxVcGRhdGVBdHRycyxcbiAgICB1cGRhdGVTdHlsZTogZ2xvYmFsLmNhbGxVcGRhdGVTdHlsZSxcblxuICAgIGFkZEV2ZW50OiBnbG9iYWwuY2FsbEFkZEV2ZW50LFxuICAgIHJlbW92ZUV2ZW50OiBnbG9iYWwuY2FsbFJlbW92ZUV2ZW50XG4gIH1cbiAgY29uc3QgcHJvdG8gPSBUYXNrQ2VudGVyLnByb3RvdHlwZVxuXG4gIGZvciAoY29uc3QgbmFtZSBpbiBET01fTUVUSE9EUykge1xuICAgIGNvbnN0IG1ldGhvZCA9IERPTV9NRVRIT0RTW25hbWVdXG4gICAgcHJvdG9bbmFtZV0gPSBtZXRob2QgP1xuICAgICAgKGlkLCBhcmdzKSA9PiBtZXRob2QoaWQsIC4uLmFyZ3MpIDpcbiAgICAgIChpZCwgYXJncykgPT4gZmFsbGJhY2soaWQsIFt7IG1vZHVsZTogJ2RvbScsIG1ldGhvZDogbmFtZSwgYXJncyB9XSwgJy0xJylcbiAgfVxuXG4gIHByb3RvLmNvbXBvbmVudEhhbmRsZXIgPSBnbG9iYWwuY2FsbE5hdGl2ZUNvbXBvbmVudCB8fFxuICAgICgoaWQsIHJlZiwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKSA9PlxuICAgICAgZmFsbGJhY2soaWQsIFt7IGNvbXBvbmVudDogb3B0aW9ucy5jb21wb25lbnQsIHJlZiwgbWV0aG9kLCBhcmdzIH1dKSlcblxuICBwcm90by5tb2R1bGVIYW5kbGVyID0gZ2xvYmFsLmNhbGxOYXRpdmVNb2R1bGUgfHxcbiAgICAoKGlkLCBtb2R1bGUsIG1ldGhvZCwgYXJncykgPT5cbiAgICAgIGZhbGxiYWNrKGlkLCBbeyBtb2R1bGUsIG1ldGhvZCwgYXJncyB9XSkpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgZ2V0RG9jIH0gZnJvbSAnLi4vdmRvbS9vcGVyYXRpb24nXG5cbmZ1bmN0aW9uIGZpcmVFdmVudCAoZG9jdW1lbnQsIG5vZGVJZCwgdHlwZSwgZXZlbnQsIGRvbUNoYW5nZXMsIHBhcmFtcykge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldFJlZihub2RlSWQpXG4gIGlmIChlbCkge1xuICAgIHJldHVybiBkb2N1bWVudC5maXJlRXZlbnQoZWwsIHR5cGUsIGV2ZW50LCBkb21DaGFuZ2VzLCBwYXJhbXMpXG4gIH1cbiAgcmV0dXJuIG5ldyBFcnJvcihgaW52YWxpZCBlbGVtZW50IHJlZmVyZW5jZSBcIiR7bm9kZUlkfVwiYClcbn1cblxuZnVuY3Rpb24gY2FsbGJhY2sgKGRvY3VtZW50LCBjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSkge1xuICByZXR1cm4gZG9jdW1lbnQudGFza0NlbnRlci5jYWxsYmFjayhjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSlcbn1cblxuZnVuY3Rpb24gY29tcG9uZW50SG9vayAoZG9jdW1lbnQsIGNvbXBvbmVudElkLCB0eXBlLCBob29rLCBvcHRpb25zKSB7XG4gIGlmICghZG9jdW1lbnQgfHwgIWRvY3VtZW50LnRhc2tDZW50ZXIpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBDYW4ndCBmaW5kIFwiZG9jdW1lbnRcIiBvciBcInRhc2tDZW50ZXJcIi5gKVxuICAgIHJldHVybiBudWxsXG4gIH1cbiAgbGV0IHJlc3VsdCA9IG51bGxcbiAgdHJ5IHtcbiAgICByZXN1bHQgPSBkb2N1bWVudC50YXNrQ2VudGVyLnRyaWdnZXJIb29rKGNvbXBvbmVudElkLCB0eXBlLCBob29rLCBvcHRpb25zKVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIHRyaWdnZXIgdGhlIFwiJHt0eXBlfUAke2hvb2t9XCIgaG9vayBvbiAke2NvbXBvbmVudElkfS5gKVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBBY2NlcHQgY2FsbHMgZnJvbSBuYXRpdmUgKGV2ZW50IG9yIGNhbGxiYWNrKS5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlkXG4gKiBAcGFyYW0gIHthcnJheX0gdGFza3MgbGlzdCB3aXRoIGBtZXRob2RgIGFuZCBgYXJnc2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY2VpdmVUYXNrcyAoaWQsIHRhc2tzKSB7XG4gIGNvbnN0IGRvY3VtZW50ID0gZ2V0RG9jKGlkKVxuICBpZiAoIWRvY3VtZW50KSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIHJlY2VpdmVUYXNrcywgYFxuICAgICAgKyBgaW5zdGFuY2UgKCR7aWR9KSBpcyBub3QgYXZhaWxhYmxlLmApXG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkodGFza3MpKSB7XG4gICAgcmV0dXJuIHRhc2tzLm1hcCh0YXNrID0+IHtcbiAgICAgIHN3aXRjaCAodGFzay5tZXRob2QpIHtcbiAgICAgICAgY2FzZSAnY2FsbGJhY2snOiByZXR1cm4gY2FsbGJhY2soZG9jdW1lbnQsIC4uLnRhc2suYXJncylcbiAgICAgICAgY2FzZSAnZmlyZUV2ZW50U3luYyc6XG4gICAgICAgIGNhc2UgJ2ZpcmVFdmVudCc6IHJldHVybiBmaXJlRXZlbnQoZG9jdW1lbnQsIC4uLnRhc2suYXJncylcbiAgICAgICAgY2FzZSAnY29tcG9uZW50SG9vayc6IHJldHVybiBjb21wb25lbnRIb29rKGRvY3VtZW50LCAuLi50YXNrLmFyZ3MpXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmNvbnN0IHdlZXhNb2R1bGVzID0ge31cblxuLyoqXG4gKiBSZWdpc3RlciBuYXRpdmUgbW9kdWxlcyBpbmZvcm1hdGlvbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBuZXdNb2R1bGVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlck1vZHVsZXMgKG5ld01vZHVsZXMpIHtcbiAgZm9yIChjb25zdCBuYW1lIGluIG5ld01vZHVsZXMpIHtcbiAgICBpZiAoIXdlZXhNb2R1bGVzW25hbWVdKSB7XG4gICAgICB3ZWV4TW9kdWxlc1tuYW1lXSA9IHt9XG4gICAgfVxuICAgIG5ld01vZHVsZXNbbmFtZV0uZm9yRWFjaChtZXRob2QgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdlZXhNb2R1bGVzW25hbWVdW21ldGhvZF0gPSB0cnVlXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgd2VleE1vZHVsZXNbbmFtZV1bbWV0aG9kLm5hbWVdID0gbWV0aG9kLmFyZ3NcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgbW9kdWxlIG9yIHRoZSBtZXRob2QgaGFzIGJlZW4gcmVnaXN0ZXJlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGUgbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZCBuYW1lIChvcHRpb25hbClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVnaXN0ZXJlZE1vZHVsZSAobmFtZSwgbWV0aG9kKSB7XG4gIGlmICh0eXBlb2YgbWV0aG9kID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiAhISh3ZWV4TW9kdWxlc1tuYW1lXSAmJiB3ZWV4TW9kdWxlc1tuYW1lXVttZXRob2RdKVxuICB9XG4gIHJldHVybiAhIXdlZXhNb2R1bGVzW25hbWVdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2R1bGVEZXNjcmlwdGlvbiAobmFtZSkge1xuICByZXR1cm4gd2VleE1vZHVsZXNbbmFtZV1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyByZWdpc3RlckVsZW1lbnQgfSBmcm9tICcuLi92ZG9tL1dlZXhFbGVtZW50J1xuXG5jb25zdCB3ZWV4Q29tcG9uZW50cyA9IHt9XG5cbi8qKlxuICogUmVnaXN0ZXIgbmF0aXZlIGNvbXBvbmVudHMgaW5mb3JtYXRpb24uXG4gKiBAcGFyYW0ge2FycmF5fSBuZXdDb21wb25lbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbXBvbmVudHMgKG5ld0NvbXBvbmVudHMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkobmV3Q29tcG9uZW50cykpIHtcbiAgICBuZXdDb21wb25lbnRzLmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdlZXhDb21wb25lbnRzW2NvbXBvbmVudF0gPSB0cnVlXG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgY29tcG9uZW50LnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdlZXhDb21wb25lbnRzW2NvbXBvbmVudC50eXBlXSA9IGNvbXBvbmVudFxuICAgICAgICByZWdpc3RlckVsZW1lbnQoY29tcG9uZW50LnR5cGUsIGNvbXBvbmVudC5tZXRob2RzKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gcmVnaXN0ZXJlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZWdpc3RlcmVkQ29tcG9uZW50IChuYW1lKSB7XG4gIHJldHVybiAhIXdlZXhDb21wb25lbnRzW25hbWVdXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gSlMgU2VydmljZXNcblxuZXhwb3J0IGNvbnN0IHNlcnZpY2VzID0gW11cblxuLyoqXG4gKiBSZWdpc3RlciBhIEphdmFTY3JpcHQgc2VydmljZS5cbiAqIEEgSmF2YVNjcmlwdCBzZXJ2aWNlIG9wdGlvbnMgY291bGQgaGF2ZSBhIHNldCBvZiBsaWZlY3ljbGUgbWV0aG9kc1xuICogZm9yIGVhY2ggV2VleCBpbnN0YW5jZS4gRm9yIGV4YW1wbGU6IGNyZWF0ZSwgcmVmcmVzaCwgZGVzdHJveS5cbiAqIEZvciB0aGUgSlMgZnJhbWV3b3JrIG1haW50YWluZXIgaWYgeW91IHdhbnQgdG8gc3VwcGx5IHNvbWUgZmVhdHVyZXNcbiAqIHdoaWNoIG5lZWQgdG8gd29yayB3ZWxsIGluIGRpZmZlcmVudCBXZWV4IGluc3RhbmNlcywgZXZlbiBpbiBkaWZmZXJlbnRcbiAqIGZyYW1ld29ya3Mgc2VwYXJhdGVseS4gWW91IGNhbiBtYWtlIGEgSmF2YVNjcmlwdCBzZXJ2aWNlIHRvIGluaXRcbiAqIGl0cyB2YXJpYWJsZXMgb3IgY2xhc3NlcyBmb3IgZWFjaCBXZWV4IGluc3RhbmNlIHdoZW4gaXQncyBjcmVhdGVkXG4gKiBhbmQgcmVjeWNsZSB0aGVtIHdoZW4gaXQncyBkZXN0cm95ZWQuXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBDb3VsZCBoYXZlIHsgY3JlYXRlLCByZWZyZXNoLCBkZXN0cm95IH1cbiAqICAgICAgICAgICAgICAgICAgICAgICAgIGxpZmVjeWNsZSBtZXRob2RzLiBJbiBjcmVhdGUgbWV0aG9kIGl0IHNob3VsZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuIG9iamVjdCBvZiB3aGF0IHZhcmlhYmxlcyBvciBjbGFzc2VzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICB3b3VsZCBiZSBpbmplY3RlZCBpbnRvIHRoZSBXZWV4IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIgKG5hbWUsIG9wdGlvbnMpIHtcbiAgaWYgKGhhcyhuYW1lKSkge1xuICAgIGNvbnNvbGUud2FybihgU2VydmljZSBcIiR7bmFtZX1cIiBoYXMgYmVlbiByZWdpc3RlcmVkIGFscmVhZHkhYClcbiAgfVxuICBlbHNlIHtcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucylcbiAgICBzZXJ2aWNlcy5wdXNoKHsgbmFtZSwgb3B0aW9ucyB9KVxuICB9XG59XG5cbi8qKlxuICogVW5yZWdpc3RlciBhIEphdmFTY3JpcHQgc2VydmljZSBieSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5yZWdpc3RlciAobmFtZSkge1xuICBzZXJ2aWNlcy5zb21lKChzZXJ2aWNlLCBpbmRleCkgPT4ge1xuICAgIGlmIChzZXJ2aWNlLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHNlcnZpY2VzLnNwbGljZShpbmRleCwgMSlcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9KVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgSmF2YVNjcmlwdCBzZXJ2aWNlIHdpdGggYSBjZXJ0YWluIG5hbWUgZXhpc3RlZC5cbiAqIEBwYXJhbSAge3N0cmluZ30gIG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXMgKG5hbWUpIHtcbiAgcmV0dXJuIGluZGV4T2YobmFtZSkgPj0gMFxufVxuXG4vKipcbiAqIEZpbmQgdGhlIGluZGV4IG9mIGEgSmF2YVNjcmlwdCBzZXJ2aWNlIGJ5IG5hbWVcbiAqIEBwYXJhbSAge3N0cmluZ30gbmFtZVxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBpbmRleE9mIChuYW1lKSB7XG4gIHJldHVybiBzZXJ2aWNlcy5tYXAoc2VydmljZSA9PiBzZXJ2aWNlLm5hbWUpLmluZGV4T2YobmFtZSlcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBnZXRUYXNrQ2VudGVyIH0gZnJvbSAnLi4vdmRvbS9vcGVyYXRpb24nXG5pbXBvcnQgeyBpc1JlZ2lzdGVyZWRNb2R1bGUgfSBmcm9tICcuLi9hcGkvbW9kdWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gdHJhY2sgKGlkLCB0eXBlLCB2YWx1ZSkge1xuICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcihpZClcbiAgaWYgKCF0YXNrQ2VudGVyIHx8IHR5cGVvZiB0YXNrQ2VudGVyLnNlbmQgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gY3JlYXRlIHRyYWNrZXIhYClcbiAgICByZXR1cm5cbiAgfVxuICBpZiAoIXR5cGUgfHwgIXZhbHVlKSB7XG4gICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBJbnZhbGlkIHRyYWNrIHR5cGUgKCR7dHlwZX0pIG9yIHZhbHVlICgke3ZhbHVlfSlgKVxuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGxhYmVsID0gYGpzZm0uJHt0eXBlfS4ke3ZhbHVlfWBcbiAgdHJ5IHtcbiAgICBpZiAoaXNSZWdpc3RlcmVkTW9kdWxlKCd1c2VyVHJhY2snLCAnYWRkUGVyZlBvaW50JykpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgICBtZXNzYWdlW2xhYmVsXSA9ICc0J1xuICAgICAgdGFza0NlbnRlci5zZW5kKCdtb2R1bGUnLCB7XG4gICAgICAgIG1vZHVsZTogJ3VzZXJUcmFjaycsXG4gICAgICAgIG1ldGhvZDogJ2FkZFBlcmZQb2ludCdcbiAgICAgIH0sIFttZXNzYWdlXSlcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byB0cmFjZSBcIiR7bGFiZWx9XCIhYClcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXJyb3IgKC4uLm1lc3NhZ2VzKSB7XG4gIGlmICh0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIGAsIC4uLm1lc3NhZ2VzKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFeGNlcHRpb24gKGVycikge1xuICBpZiAodHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIudG9TdHJpbmcoKSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHt9XG4gIH1cbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICB0aHJvdyBlcnJcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBOb2RlIGZyb20gJy4vTm9kZSdcbmltcG9ydCB7IHVuaXF1ZUlkIH0gZnJvbSAnLi4vc2hhcmVkL3V0aWxzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21tZW50IGV4dGVuZHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yICh2YWx1ZSkge1xuICAgIHN1cGVyKClcblxuICAgIHRoaXMubm9kZVR5cGUgPSA4XG4gICAgdGhpcy5ub2RlSWQgPSB1bmlxdWVJZCgpXG4gICAgdGhpcy5yZWYgPSB0aGlzLm5vZGVJZFxuICAgIHRoaXMudHlwZSA9ICdjb21tZW50J1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMuY2hpbGRyZW4gPSBbXVxuICAgIHRoaXMucHVyZUNoaWxkcmVuID0gW11cbiAgfVxuXG4gIC8qKlxuICAqIENvbnZlcnQgdG8gSFRNTCBjb21tZW50IHN0cmluZy5cbiAgKiBAcmV0dXJuIHtzdGlybmd9IGh0bWxcbiAgKi9cbiAgdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnPCEtLSAnICsgdGhpcy52YWx1ZSArICcgLS0+J1xuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4qIENyZWF0ZSB0aGUgYWN0aW9uIG9iamVjdC5cbiogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiogQHBhcmFtIHthcnJheX0gYXJndW1lbnRzXG4qIEByZXR1cm4ge29iamVjdH0gYWN0aW9uXG4qL1xuZnVuY3Rpb24gY3JlYXRlQWN0aW9uIChuYW1lLCBhcmdzID0gW10pIHtcbiAgcmV0dXJuIHsgbW9kdWxlOiAnZG9tJywgbWV0aG9kOiBuYW1lLCBhcmdzOiBhcmdzIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGlzdGVuZXIge1xuICBjb25zdHJ1Y3RvciAoaWQsIGhhbmRsZXIpIHtcbiAgICB0aGlzLmlkID0gaWRcbiAgICB0aGlzLmJhdGNoZWQgPSBmYWxzZVxuICAgIHRoaXMudXBkYXRlcyA9IFtdXG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2hhbmRsZXInLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiBoYW5kbGVyXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tKUyBSdW50aW1lXSBpbnZhbGlkIHBhcmFtZXRlciwgaGFuZGxlciBtdXN0IGJlIGEgZnVuY3Rpb24nKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcImNyZWF0ZUZpbmlzaFwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBjcmVhdGVGaW5pc2ggKGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaGFuZGxlciA9IHRoaXMuaGFuZGxlclxuICAgIHJldHVybiBoYW5kbGVyKFtjcmVhdGVBY3Rpb24oJ2NyZWF0ZUZpbmlzaCcpXSwgY2FsbGJhY2spXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJ1cGRhdGVGaW5pc2hcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgdXBkYXRlRmluaXNoIChjYWxsYmFjaykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLmhhbmRsZXJcbiAgICByZXR1cm4gaGFuZGxlcihbY3JlYXRlQWN0aW9uKCd1cGRhdGVGaW5pc2gnKV0sIGNhbGxiYWNrKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwicmVmcmVzaEZpbmlzaFwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICByZWZyZXNoRmluaXNoIChjYWxsYmFjaykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLmhhbmRsZXJcbiAgICByZXR1cm4gaGFuZGxlcihbY3JlYXRlQWN0aW9uKCdyZWZyZXNoRmluaXNoJyldLCBjYWxsYmFjaylcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcImNyZWF0ZUJvZHlcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50XG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgY3JlYXRlQm9keSAoZWxlbWVudCkge1xuICAgIGNvbnN0IGJvZHkgPSBlbGVtZW50LnRvSlNPTigpXG4gICAgY29uc3QgY2hpbGRyZW4gPSBib2R5LmNoaWxkcmVuXG4gICAgZGVsZXRlIGJvZHkuY2hpbGRyZW5cbiAgICBjb25zdCBhY3Rpb25zID0gW2NyZWF0ZUFjdGlvbignY3JlYXRlQm9keScsIFtib2R5XSldXG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBhY3Rpb25zLnB1c2guYXBwbHkoYWN0aW9ucywgY2hpbGRyZW4ubWFwKGNoaWxkID0+IHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUFjdGlvbignYWRkRWxlbWVudCcsIFtib2R5LnJlZiwgY2hpbGQsIC0xXSlcbiAgICAgIH0pKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGFjdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJhZGRFbGVtZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZWxlbWVudFxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGFkZEVsZW1lbnQgKGVsZW1lbnQsIHJlZiwgaW5kZXgpIHtcbiAgICBpZiAoIShpbmRleCA+PSAwKSkge1xuICAgICAgaW5kZXggPSAtMVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbignYWRkRWxlbWVudCcsIFtyZWYsIGVsZW1lbnQudG9KU09OKCksIGluZGV4XSkpXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJyZW1vdmVFbGVtZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgcmVtb3ZlRWxlbWVudCAocmVmKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocmVmKSkge1xuICAgICAgY29uc3QgYWN0aW9ucyA9IHJlZi5tYXAoKHIpID0+IGNyZWF0ZUFjdGlvbigncmVtb3ZlRWxlbWVudCcsIFtyXSkpXG4gICAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGFjdGlvbnMpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCdyZW1vdmVFbGVtZW50JywgW3JlZl0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwibW92ZUVsZW1lbnRcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSB0YXJnZXQgcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSBwYXJlbnQgcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIG1vdmVFbGVtZW50ICh0YXJnZXRSZWYsIHBhcmVudFJlZiwgaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbignbW92ZUVsZW1lbnQnLCBbdGFyZ2V0UmVmLCBwYXJlbnRSZWYsIGluZGV4XSkpXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJ1cGRhdGVBdHRyc1wiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtzdGlybmd9IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge3N0aXJuZ30ga2V5XG4gICAqIEBwYXJhbSB7c3Rpcm5nfSB2YWx1ZVxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIHNldEF0dHIgKHJlZiwga2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCd1cGRhdGVBdHRycycsIFtyZWYsIHJlc3VsdF0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwidXBkYXRlU3R5bGVcIiBzaWduYWwsIHVwZGF0ZSBhIHNvbGUgc3R5bGUuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtzdGlybmd9IGtleVxuICAgKiBAcGFyYW0ge3N0aXJuZ30gdmFsdWVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBzZXRTdHlsZSAocmVmLCBrZXksIHZhbHVlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge31cbiAgICByZXN1bHRba2V5XSA9IHZhbHVlXG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ3VwZGF0ZVN0eWxlJywgW3JlZiwgcmVzdWx0XSkpXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJ1cGRhdGVTdHlsZVwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtzdGlybmd9IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge29iamVjdH0gc3R5bGVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBzZXRTdHlsZXMgKHJlZiwgc3R5bGUpIHtcbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbigndXBkYXRlU3R5bGUnLCBbcmVmLCBzdHlsZV0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwiYWRkRXZlbnRcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IHR5cGVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBhZGRFdmVudCAocmVmLCB0eXBlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ2FkZEV2ZW50JywgW3JlZiwgdHlwZV0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwicmVtb3ZlRXZlbnRcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IHR5cGVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICByZW1vdmVFdmVudCAocmVmLCB0eXBlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ3JlbW92ZUV2ZW50JywgW3JlZiwgdHlwZV0pKVxuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgaGFuZGxlci5cbiAgICogQHBhcmFtIHtvYmplY3QgfCBhcnJheX0gYWN0aW9uc1xuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHt9IGFueXRoaW5nIHJldHVybmVkIGJ5IGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICBoYW5kbGVyIChhY3Rpb25zLCBjYikge1xuICAgIHJldHVybiBjYiAmJiBjYigpXG4gIH1cblxuICAvKipcbiAgICogQWRkIGFjdGlvbnMgaW50byB1cGRhdGVzLlxuICAgKiBAcGFyYW0ge29iamVjdCB8IGFycmF5fSBhY3Rpb25zXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgYWRkQWN0aW9ucyAoYWN0aW9ucykge1xuICAgIGNvbnN0IHVwZGF0ZXMgPSB0aGlzLnVwZGF0ZXNcbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVyXG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYWN0aW9ucykpIHtcbiAgICAgIGFjdGlvbnMgPSBbYWN0aW9uc11cbiAgICB9XG5cbiAgICBpZiAodGhpcy5iYXRjaGVkKSB7XG4gICAgICB1cGRhdGVzLnB1c2guYXBwbHkodXBkYXRlcywgYWN0aW9ucylcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gaGFuZGxlcihhY3Rpb25zKVxuICAgIH1cbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogVGFzayBoYW5kbGVyIGZvciBjb21tdW5pY2F0aW9uIGJldHdlZW4gamF2YXNjcmlwdCBhbmQgbmF0aXZlLlxuICovXG5cbmNvbnN0IGhhbmRsZXJNYXAgPSB7XG4gIGNyZWF0ZUJvZHk6ICdjYWxsQ3JlYXRlQm9keScsXG4gIGFkZEVsZW1lbnQ6ICdjYWxsQWRkRWxlbWVudCcsXG4gIHJlbW92ZUVsZW1lbnQ6ICdjYWxsUmVtb3ZlRWxlbWVudCcsXG4gIG1vdmVFbGVtZW50OiAnY2FsbE1vdmVFbGVtZW50JyxcbiAgdXBkYXRlQXR0cnM6ICdjYWxsVXBkYXRlQXR0cnMnLFxuICB1cGRhdGVTdHlsZTogJ2NhbGxVcGRhdGVTdHlsZScsXG4gIGFkZEV2ZW50OiAnY2FsbEFkZEV2ZW50JyxcbiAgcmVtb3ZlRXZlbnQ6ICdjYWxsUmVtb3ZlRXZlbnQnXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdGFzayBoYW5kbGVyLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn0gdGFza0hhbmRsZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUhhbmRsZXIgKGlkLCBoYW5kbGVyKSB7XG4gIGNvbnN0IGRlZmF1bHRIYW5kbGVyID0gaGFuZGxlciB8fCBnbG9iYWwuY2FsbE5hdGl2ZVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAodHlwZW9mIGRlZmF1bHRIYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcignW0pTIFJ1bnRpbWVdIG5vIGRlZmF1bHQgaGFuZGxlcicpXG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gdGFza0hhbmRsZXIgKHRhc2tzKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHRhc2tzKSkge1xuICAgICAgdGFza3MgPSBbdGFza3NdXG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFza3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJldHVyblZhbHVlID0gZGlzcGF0Y2hUYXNrKGlkLCB0YXNrc1tpXSwgZGVmYXVsdEhhbmRsZXIpXG4gICAgICBpZiAocmV0dXJuVmFsdWUgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZXJlIGlzIGEgY29ycmVzcG9uZGluZyBhdmFpbGFibGUgaGFuZGxlciBpbiB0aGUgZW52aXJvbm1lbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gbW9kdWxlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBoYXNBdmFpbGFibGVIYW5kbGVyIChtb2R1bGUsIG1ldGhvZCkge1xuICByZXR1cm4gbW9kdWxlID09PSAnZG9tJ1xuICAgICYmIGhhbmRsZXJNYXBbbWV0aG9kXVxuICAgICYmIHR5cGVvZiBnbG9iYWxbaGFuZGxlck1hcFttZXRob2RdXSA9PT0gJ2Z1bmN0aW9uJ1xufVxuXG4vKipcbiAqIERpc3BhdGNoIHRoZSB0YXNrIHRvIHRoZSBzcGVjaWZpZWQgaGFuZGxlci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtvYmplY3R9IHRhc2tcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlZmF1bHRIYW5kbGVyXG4gKiBAcmV0dXJuIHtudW1iZXJ9IHNpZ25hbCByZXR1cm5lZCBmcm9tIG5hdGl2ZVxuICovXG5mdW5jdGlvbiBkaXNwYXRjaFRhc2sgKGlkLCB0YXNrLCBkZWZhdWx0SGFuZGxlcikge1xuICBjb25zdCB7IG1vZHVsZSwgbWV0aG9kLCBhcmdzIH0gPSB0YXNrXG5cbiAgaWYgKGhhc0F2YWlsYWJsZUhhbmRsZXIobW9kdWxlLCBtZXRob2QpKSB7XG4gICAgcmV0dXJuIGdsb2JhbFtoYW5kbGVyTWFwW21ldGhvZF1dKGlkLCAuLi5hcmdzLCAnLTEnKVxuICB9XG5cbiAgcmV0dXJuIGRlZmF1bHRIYW5kbGVyKGlkLCBbdGFza10sICctMScpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IENvbW1lbnQgZnJvbSAnLi9Db21tZW50J1xuaW1wb3J0IEVsZW1lbnQgZnJvbSAnLi9FbGVtZW50J1xuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4uL2JyaWRnZS9MaXN0ZW5lcidcbmltcG9ydCB7IFRhc2tDZW50ZXIgfSBmcm9tICcuLi9icmlkZ2UvVGFza0NlbnRlcidcbmltcG9ydCB7IGNyZWF0ZUhhbmRsZXIgfSBmcm9tICcuLi9icmlkZ2UvSGFuZGxlcidcbmltcG9ydCB7IGFkZERvYywgcmVtb3ZlRG9jLCBhcHBlbmRCb2R5LCBzZXRCb2R5IH0gZnJvbSAnLi9vcGVyYXRpb24nXG5cbi8qKlxuICogVXBkYXRlIGFsbCBjaGFuZ2VzIGZvciBhbiBlbGVtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGVsZW1lbnRcbiAqIEBwYXJhbSB7b2JqZWN0fSBjaGFuZ2VzXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQgKGVsLCBjaGFuZ2VzKSB7XG4gIGNvbnN0IGF0dHJzID0gY2hhbmdlcy5hdHRycyB8fCB7fVxuICBmb3IgKGNvbnN0IG5hbWUgaW4gYXR0cnMpIHtcbiAgICBlbC5zZXRBdHRyKG5hbWUsIGF0dHJzW25hbWVdLCB0cnVlKVxuICB9XG4gIGNvbnN0IHN0eWxlID0gY2hhbmdlcy5zdHlsZSB8fCB7fVxuICBmb3IgKGNvbnN0IG5hbWUgaW4gc3R5bGUpIHtcbiAgICBlbC5zZXRTdHlsZShuYW1lLCBzdHlsZVtuYW1lXSwgdHJ1ZSlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEb2N1bWVudCB7XG4gIGNvbnN0cnVjdG9yIChpZCwgdXJsLCBoYW5kbGVyKSB7XG4gICAgaWQgPSBpZCA/IGlkLnRvU3RyaW5nKCkgOiAnJ1xuICAgIHRoaXMuaWQgPSBpZFxuICAgIHRoaXMuVVJMID0gdXJsXG5cbiAgICBhZGREb2MoaWQsIHRoaXMpXG4gICAgdGhpcy5ub2RlTWFwID0ge31cbiAgICBjb25zdCBMID0gRG9jdW1lbnQuTGlzdGVuZXIgfHwgTGlzdGVuZXJcbiAgICB0aGlzLmxpc3RlbmVyID0gbmV3IEwoaWQsIGhhbmRsZXIgfHwgY3JlYXRlSGFuZGxlcihpZCwgRG9jdW1lbnQuaGFuZGxlcikpIC8vIGRlcHJlY2F0ZWRcbiAgICB0aGlzLnRhc2tDZW50ZXIgPSBuZXcgVGFza0NlbnRlcihpZCwgaGFuZGxlciA/IChpZCwgLi4uYXJncykgPT4gaGFuZGxlciguLi5hcmdzKSA6IERvY3VtZW50LmhhbmRsZXIpXG4gICAgdGhpcy5jcmVhdGVEb2N1bWVudEVsZW1lbnQoKVxuICB9XG5cbiAgLyoqXG4gICogR2V0IHRoZSBub2RlIGZyb20gbm9kZU1hcC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gcmVmZXJlbmNlIGlkXG4gICogQHJldHVybiB7b2JqZWN0fSBub2RlXG4gICovXG4gIGdldFJlZiAocmVmKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZU1hcFtyZWZdXG4gIH1cblxuICAvKipcbiAgKiBUdXJuIG9uIGJhdGNoZWQgdXBkYXRlcy5cbiAgKi9cbiAgb3BlbiAoKSB7XG4gICAgdGhpcy5saXN0ZW5lci5iYXRjaGVkID0gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAqIFR1cm4gb2ZmIGJhdGNoZWQgdXBkYXRlcy5cbiAgKi9cbiAgY2xvc2UgKCkge1xuICAgIHRoaXMubGlzdGVuZXIuYmF0Y2hlZCA9IHRydWVcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSB0aGUgZG9jdW1lbnQgZWxlbWVudC5cbiAgKiBAcmV0dXJuIHtvYmplY3R9IGRvY3VtZW50RWxlbWVudFxuICAqL1xuICBjcmVhdGVEb2N1bWVudEVsZW1lbnQgKCkge1xuICAgIGlmICghdGhpcy5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGVsID0gbmV3IEVsZW1lbnQoJ2RvY3VtZW50JylcbiAgICAgIGVsLmRvY0lkID0gdGhpcy5pZFxuICAgICAgZWwub3duZXJEb2N1bWVudCA9IHRoaXNcbiAgICAgIGVsLnJvbGUgPSAnZG9jdW1lbnRFbGVtZW50J1xuICAgICAgZWwuZGVwdGggPSAwXG4gICAgICBlbC5yZWYgPSAnX2RvY3VtZW50RWxlbWVudCdcbiAgICAgIHRoaXMubm9kZU1hcC5fZG9jdW1lbnRFbGVtZW50ID0gZWxcbiAgICAgIHRoaXMuZG9jdW1lbnRFbGVtZW50ID0gZWxcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsLCAnYXBwZW5kQ2hpbGQnLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAobm9kZSkgPT4ge1xuICAgICAgICAgIGFwcGVuZEJvZHkodGhpcywgbm9kZSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsLCAnaW5zZXJ0QmVmb3JlJywge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogKG5vZGUsIGJlZm9yZSkgPT4ge1xuICAgICAgICAgIGFwcGVuZEJvZHkodGhpcywgbm9kZSwgYmVmb3JlKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRvY3VtZW50RWxlbWVudFxuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlIHRoZSBib2R5IGVsZW1lbnQuXG4gICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAgKiBAcGFyYW0ge29iamN0fSBwcm9wc1xuICAqIEByZXR1cm4ge29iamVjdH0gYm9keSBlbGVtZW50XG4gICovXG4gIGNyZWF0ZUJvZHkgKHR5cGUsIHByb3BzKSB7XG4gICAgaWYgKCF0aGlzLmJvZHkpIHtcbiAgICAgIGNvbnN0IGVsID0gbmV3IEVsZW1lbnQodHlwZSwgcHJvcHMpXG4gICAgICBzZXRCb2R5KHRoaXMsIGVsKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJvZHlcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSBhbiBlbGVtZW50LlxuICAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lXG4gICogQHBhcmFtIHtvYmpjdH0gcHJvcHNcbiAgKiBAcmV0dXJuIHtvYmplY3R9IGVsZW1lbnRcbiAgKi9cbiAgY3JlYXRlRWxlbWVudCAodGFnTmFtZSwgcHJvcHMpIHtcbiAgICByZXR1cm4gbmV3IEVsZW1lbnQodGFnTmFtZSwgcHJvcHMpXG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgYW4gY29tbWVudC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICAqIEByZXR1cm4ge29iamVjdH0gY29tbWVudFxuICAqL1xuICBjcmVhdGVDb21tZW50ICh0ZXh0KSB7XG4gICAgcmV0dXJuIG5ldyBDb21tZW50KHRleHQpXG4gIH1cblxuICAvKipcbiAgKiBGaXJlIGFuIGV2ZW50IG9uIHNwZWNpZmllZCBlbGVtZW50IG1hbnVhbGx5LlxuICAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50XG4gICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IHR5cGVcbiAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnQgb2JqZWN0XG4gICogQHBhcmFtIHtvYmplY3R9IGRvbSBjaGFuZ2VzXG4gICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAgKiBAcmV0dXJuIHt9IGFueXRoaW5nIHJldHVybmVkIGJ5IGhhbmRsZXIgZnVuY3Rpb25cbiAgKi9cbiAgZmlyZUV2ZW50IChlbCwgdHlwZSwgZXZlbnQsIGRvbUNoYW5nZXMsIG9wdGlvbnMpIHtcbiAgICBpZiAoIWVsKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgZXZlbnQgPSBldmVudCB8fCB7fVxuICAgIGV2ZW50LnR5cGUgPSBldmVudC50eXBlIHx8IHR5cGVcbiAgICBldmVudC50YXJnZXQgPSBlbFxuICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQgPSBlbFxuICAgIGV2ZW50LnRpbWVzdGFtcCA9IERhdGUubm93KClcbiAgICBpZiAoZG9tQ2hhbmdlcykge1xuICAgICAgdXBkYXRlRWxlbWVudChlbCwgZG9tQ2hhbmdlcylcbiAgICB9XG4gICAgY29uc3QgaXNCdWJibGUgPSB0aGlzLmdldFJlZignX3Jvb3QnKS5hdHRyWydidWJibGUnXSA9PT0gJ3RydWUnXG4gICAgcmV0dXJuIGVsLmZpcmVFdmVudCh0eXBlLCBldmVudCwgaXNCdWJibGUsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgKiBEZXN0cm95IGN1cnJlbnQgZG9jdW1lbnQsIGFuZCByZW1vdmUgaXRzZWxmIGZvcm0gZG9jTWFwLlxuICAqL1xuICBkZXN0cm95ICgpIHtcbiAgICB0aGlzLnRhc2tDZW50ZXIuZGVzdHJveUNhbGxiYWNrKClcbiAgICBkZWxldGUgdGhpcy5saXN0ZW5lclxuICAgIGRlbGV0ZSB0aGlzLm5vZGVNYXBcbiAgICBkZWxldGUgdGhpcy50YXNrQ2VudGVyXG4gICAgcmVtb3ZlRG9jKHRoaXMuaWQpXG4gIH1cbn1cblxuLy8gZGVmYXVsdCB0YXNrIGhhbmRsZXJcbkRvY3VtZW50LmhhbmRsZXIgPSBudWxsXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IERvY3VtZW50IGZyb20gJy4uL3Zkb20vRG9jdW1lbnQnXG5pbXBvcnQgeyBpc1JlZ2lzdGVyZWRNb2R1bGUsIGdldE1vZHVsZURlc2NyaXB0aW9uIH0gZnJvbSAnLi9tb2R1bGUnXG5pbXBvcnQgeyBpc1JlZ2lzdGVyZWRDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudCdcbmltcG9ydCB7IGdldFRhc2tDZW50ZXIgfSBmcm9tICcuLi92ZG9tL29wZXJhdGlvbidcblxuY29uc3QgbW9kdWxlUHJveGllcyA9IHt9XG5cbmZ1bmN0aW9uIHNldElkICh3ZWV4LCBpZCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkod2VleCwgJ1tbQ3VycmVudEluc3RhbmNlSWRdXScsIHsgdmFsdWU6IGlkIH0pXG59XG5cbmZ1bmN0aW9uIGdldElkICh3ZWV4KSB7XG4gIHJldHVybiB3ZWV4WydbW0N1cnJlbnRJbnN0YW5jZUlkXV0nXVxufVxuXG5mdW5jdGlvbiBtb2R1bGVHZXR0ZXIgKGlkLCBtb2R1bGUsIG1ldGhvZCkge1xuICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcihpZClcbiAgaWYgKCF0YXNrQ2VudGVyIHx8IHR5cGVvZiB0YXNrQ2VudGVyLnNlbmQgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gZmluZCB0YXNrQ2VudGVyICgke2lkfSkuYClcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiAoLi4uYXJncykgPT4gdGFza0NlbnRlci5zZW5kKCdtb2R1bGUnLCB7IG1vZHVsZSwgbWV0aG9kIH0sIGFyZ3MpXG59XG5cbmZ1bmN0aW9uIG1vZHVsZVNldHRlciAoaWQsIG1vZHVsZSwgbWV0aG9kLCBmbikge1xuICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcihpZClcbiAgaWYgKCF0YXNrQ2VudGVyIHx8IHR5cGVvZiB0YXNrQ2VudGVyLnNlbmQgIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gZmluZCB0YXNrQ2VudGVyICgke2lkfSkuYClcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSAke21vZHVsZX0uJHttZXRob2R9IG11c3QgYmUgYXNzaWduZWQgYXMgYSBmdW5jdGlvbi5gKVxuICAgIHJldHVybiBudWxsXG4gIH1cbiAgcmV0dXJuIGZuID0+IHRhc2tDZW50ZXIuc2VuZCgnbW9kdWxlJywgeyBtb2R1bGUsIG1ldGhvZCB9LCBbZm5dKVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXZWV4SW5zdGFuY2Uge1xuICBjb25zdHJ1Y3RvciAoaWQsIGNvbmZpZykge1xuICAgIHNldElkKHRoaXMsIFN0cmluZyhpZCkpXG4gICAgdGhpcy5jb25maWcgPSBjb25maWcgfHwge31cbiAgICB0aGlzLmRvY3VtZW50ID0gbmV3IERvY3VtZW50KGlkLCB0aGlzLmNvbmZpZy5idW5kbGVVcmwpXG4gICAgdGhpcy5yZXF1aXJlTW9kdWxlID0gdGhpcy5yZXF1aXJlTW9kdWxlLmJpbmQodGhpcylcbiAgICB0aGlzLmlzUmVnaXN0ZXJlZE1vZHVsZSA9IGlzUmVnaXN0ZXJlZE1vZHVsZVxuICAgIHRoaXMuaXNSZWdpc3RlcmVkQ29tcG9uZW50ID0gaXNSZWdpc3RlcmVkQ29tcG9uZW50XG4gIH1cblxuICByZXF1aXJlTW9kdWxlIChtb2R1bGVOYW1lKSB7XG4gICAgY29uc3QgaWQgPSBnZXRJZCh0aGlzKVxuICAgIGlmICghKGlkICYmIHRoaXMuZG9jdW1lbnQgJiYgdGhpcy5kb2N1bWVudC50YXNrQ2VudGVyKSkge1xuICAgICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIHJlcXVpcmVNb2R1bGUoXCIke21vZHVsZU5hbWV9XCIpLCBgXG4gICAgICAgICsgYGluc3RhbmNlICgke2lkfSkgZG9lc24ndCBleGlzdCBhbnltb3JlLmApXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyB3YXJuIGZvciB1bmtub3duIG1vZHVsZVxuICAgIGlmICghaXNSZWdpc3RlcmVkTW9kdWxlKG1vZHVsZU5hbWUpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFtKUyBGcmFtZXdvcmtdIHVzaW5nIHVucmVnaXN0ZXJlZCB3ZWV4IG1vZHVsZSBcIiR7bW9kdWxlTmFtZX1cImApXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgbmV3IG1vZHVsZSBwcm94eVxuICAgIGNvbnN0IHByb3h5TmFtZSA9IGAke21vZHVsZU5hbWV9IyR7aWR9YFxuICAgIGlmICghbW9kdWxlUHJveGllc1twcm94eU5hbWVdKSB7XG4gICAgICAvLyBjcmVhdGUgcmVnaXN0ZXJlZCBtb2R1bGUgYXBpc1xuICAgICAgY29uc3QgbW9kdWxlRGVmaW5lID0gZ2V0TW9kdWxlRGVzY3JpcHRpb24obW9kdWxlTmFtZSlcbiAgICAgIGNvbnN0IG1vZHVsZUFwaXMgPSB7fVxuICAgICAgZm9yIChjb25zdCBtZXRob2ROYW1lIGluIG1vZHVsZURlZmluZSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlQXBpcywgbWV0aG9kTmFtZSwge1xuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGdldDogKCkgPT4gbW9kdWxlR2V0dGVyKGlkLCBtb2R1bGVOYW1lLCBtZXRob2ROYW1lKSxcbiAgICAgICAgICBzZXQ6IGZuID0+IG1vZHVsZVNldHRlcihpZCwgbW9kdWxlTmFtZSwgbWV0aG9kTmFtZSwgZm4pXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIC8vIGNyZWF0ZSBtb2R1bGUgUHJveHlcbiAgICAgIGlmICh0eXBlb2YgUHJveHkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbW9kdWxlUHJveGllc1twcm94eU5hbWVdID0gbmV3IFByb3h5KG1vZHVsZUFwaXMsIHtcbiAgICAgICAgICBnZXQgKHRhcmdldCwgbWV0aG9kTmFtZSkge1xuICAgICAgICAgICAgaWYgKG1ldGhvZE5hbWUgaW4gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgIHJldHVybiB0YXJnZXRbbWV0aG9kTmFtZV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gdXNpbmcgdW5yZWdpc3RlcmVkIG1ldGhvZCBcIiR7bW9kdWxlTmFtZX0uJHttZXRob2ROYW1lfVwiYClcbiAgICAgICAgICAgIHJldHVybiBtb2R1bGVHZXR0ZXIoaWQsIG1vZHVsZU5hbWUsIG1ldGhvZE5hbWUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIG1vZHVsZVByb3hpZXNbcHJveHlOYW1lXSA9IG1vZHVsZUFwaXNcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbW9kdWxlUHJveGllc1twcm94eU5hbWVdXG4gIH1cblxuICBzdXBwb3J0cyAoY29uZGl0aW9uKSB7XG4gICAgaWYgKHR5cGVvZiBjb25kaXRpb24gIT09ICdzdHJpbmcnKSByZXR1cm4gbnVsbFxuXG4gICAgY29uc3QgcmVzID0gY29uZGl0aW9uLm1hdGNoKC9eQChcXHcrKVxcLyhcXHcrKShcXC4oXFx3KykpPyQvaSlcbiAgICBpZiAocmVzKSB7XG4gICAgICBjb25zdCB0eXBlID0gcmVzWzFdXG4gICAgICBjb25zdCBuYW1lID0gcmVzWzJdXG4gICAgICBjb25zdCBtZXRob2QgPSByZXNbNF1cbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdtb2R1bGUnOiByZXR1cm4gaXNSZWdpc3RlcmVkTW9kdWxlKG5hbWUsIG1ldGhvZClcbiAgICAgICAgY2FzZSAnY29tcG9uZW50JzogcmV0dXJuIGlzUmVnaXN0ZXJlZENvbXBvbmVudChuYW1lKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyByZWdpc3RlclN0eWxlU2hlZXQgKHN0eWxlcykge1xuICAvLyAgIGlmICh0aGlzLmRvY3VtZW50KSB7XG4gIC8vICAgICB0aGlzLmRvY3VtZW50LnJlZ2lzdGVyU3R5bGVTaGVldChzdHlsZXMpXG4gIC8vICAgfVxuICAvLyB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgaW5pdCBhcyBpbml0VGFza0hhbmRsZXIgfSBmcm9tICcuLi9icmlkZ2UvVGFza0NlbnRlcidcbmltcG9ydCB7IHJlY2VpdmVUYXNrcyB9IGZyb20gJy4uL2JyaWRnZS9yZWNlaXZlcidcbmltcG9ydCB7IHJlZ2lzdGVyTW9kdWxlcyB9IGZyb20gJy4vbW9kdWxlJ1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21wb25lbnRzIH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgeyBzZXJ2aWNlcywgcmVnaXN0ZXIsIHVucmVnaXN0ZXIgfSBmcm9tICcuL3NlcnZpY2UnXG5pbXBvcnQgeyB0cmFjayB9IGZyb20gJy4uL2JyaWRnZS9kZWJ1ZydcbmltcG9ydCBXZWV4SW5zdGFuY2UgZnJvbSAnLi9XZWV4SW5zdGFuY2UnXG5pbXBvcnQgeyBnZXREb2MgfSBmcm9tICcuLi92ZG9tL29wZXJhdGlvbidcblxubGV0IGZyYW1ld29ya3NcbmxldCBydW50aW1lQ29uZmlnXG5cbmNvbnN0IHZlcnNpb25SZWdFeHAgPSAvXlxccypcXC9cXC8gKihcXHtbXn1dKlxcfSkgKlxccj9cXG4vXG5cbi8qKlxuICogRGV0ZWN0IGEgSlMgQnVuZGxlIGNvZGUgYW5kIG1ha2Ugc3VyZSB3aGljaCBmcmFtZXdvcmsgaXQncyBiYXNlZCB0by4gRWFjaCBKU1xuICogQnVuZGxlIHNob3VsZCBtYWtlIHN1cmUgdGhhdCBpdCBzdGFydHMgd2l0aCBhIGxpbmUgb2YgSlNPTiBjb21tZW50IGFuZCBpc1xuICogbW9yZSB0aGF0IG9uZSBsaW5lLlxuICogQHBhcmFtICB7c3RyaW5nfSBjb2RlXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIGdldEJ1bmRsZVR5cGUgKGNvZGUpIHtcbiAgY29uc3QgcmVzdWx0ID0gdmVyc2lvblJlZ0V4cC5leGVjKGNvZGUpXG4gIGlmIChyZXN1bHQpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaW5mbyA9IEpTT04ucGFyc2UocmVzdWx0WzFdKVxuICAgICAgcmV0dXJuIGluZm8uZnJhbWV3b3JrXG4gICAgfVxuICAgIGNhdGNoIChlKSB7fVxuICB9XG5cbiAgLy8gZGVmYXVsdCBidW5kbGUgdHlwZVxuICByZXR1cm4gJ1dlZXgnXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlcnZpY2VzIChpZCwgZW52LCBjb25maWcpIHtcbiAgLy8gSW5pdCBKYXZhU2NyaXB0IHNlcnZpY2VzIGZvciB0aGlzIGluc3RhbmNlLlxuICBjb25zdCBzZXJ2aWNlTWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICBzZXJ2aWNlTWFwLnNlcnZpY2UgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gIHNlcnZpY2VzLmZvckVhY2goKHsgbmFtZSwgb3B0aW9ucyB9KSA9PiB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnKSB7XG4gICAgICBjb25zb2xlLmRlYnVnKGBbSlMgUnVudGltZV0gY3JlYXRlIHNlcnZpY2UgJHtuYW1lfS5gKVxuICAgIH1cbiAgICBjb25zdCBjcmVhdGUgPSBvcHRpb25zLmNyZWF0ZVxuICAgIGlmIChjcmVhdGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNyZWF0ZShpZCwgZW52LCBjb25maWcpXG4gICAgICAgIE9iamVjdC5hc3NpZ24oc2VydmljZU1hcC5zZXJ2aWNlLCByZXN1bHQpXG4gICAgICAgIE9iamVjdC5hc3NpZ24oc2VydmljZU1hcCwgcmVzdWx0Lmluc3RhbmNlKVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW0pTIFJ1bnRpbWVdIEZhaWxlZCB0byBjcmVhdGUgc2VydmljZSAke25hbWV9LmApXG4gICAgICB9XG4gICAgfVxuICB9KVxuICBkZWxldGUgc2VydmljZU1hcC5zZXJ2aWNlLmluc3RhbmNlXG4gIE9iamVjdC5mcmVlemUoc2VydmljZU1hcC5zZXJ2aWNlKVxuICByZXR1cm4gc2VydmljZU1hcFxufVxuXG5jb25zdCBpbnN0YW5jZVR5cGVNYXAgPSB7fVxuZnVuY3Rpb24gZ2V0RnJhbWV3b3JrVHlwZSAoaWQpIHtcbiAgcmV0dXJuIGluc3RhbmNlVHlwZU1hcFtpZF1cbn1cblxuZnVuY3Rpb24gY3JlYXRlSW5zdGFuY2VDb250ZXh0IChpZCwgb3B0aW9ucyA9IHt9LCBkYXRhKSB7XG4gIGNvbnN0IHdlZXggPSBuZXcgV2VleEluc3RhbmNlKGlkLCBvcHRpb25zKVxuICBPYmplY3QuZnJlZXplKHdlZXgpXG5cbiAgY29uc3QgYnVuZGxlVHlwZSA9IG9wdGlvbnMuYnVuZGxlVHlwZSB8fCAnVnVlJ1xuICBpbnN0YW5jZVR5cGVNYXBbaWRdID0gYnVuZGxlVHlwZVxuICBjb25zdCBmcmFtZXdvcmsgPSBydW50aW1lQ29uZmlnLmZyYW1ld29ya3NbYnVuZGxlVHlwZV1cbiAgaWYgKCFmcmFtZXdvcmspIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKGBbSlMgRnJhbWV3b3JrXSBJbnZhbGlkIGJ1bmRsZSB0eXBlIFwiJHtidW5kbGVUeXBlfVwiLmApXG4gIH1cbiAgdHJhY2soaWQsICdidW5kbGVUeXBlJywgYnVuZGxlVHlwZSlcblxuICAvLyBwcmVwYXJlIGpzIHNlcnZpY2VcbiAgY29uc3Qgc2VydmljZXMgPSBjcmVhdGVTZXJ2aWNlcyhpZCwge1xuICAgIHdlZXgsXG4gICAgY29uZmlnOiBvcHRpb25zLFxuICAgIGNyZWF0ZWQ6IERhdGUubm93KCksXG4gICAgZnJhbWV3b3JrOiBidW5kbGVUeXBlLFxuICAgIGJ1bmRsZVR5cGVcbiAgfSwgcnVudGltZUNvbmZpZylcbiAgT2JqZWN0LmZyZWV6ZShzZXJ2aWNlcylcblxuICAvLyBwcmVwYXJlIHJ1bnRpbWUgY29udGV4dFxuICBjb25zdCBydW50aW1lQ29udGV4dCA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgT2JqZWN0LmFzc2lnbihydW50aW1lQ29udGV4dCwgc2VydmljZXMsIHtcbiAgICB3ZWV4LFxuICAgIHNlcnZpY2VzIC8vIFRlbXBvcmFyeSBjb21wYXRpYmxlIHdpdGggc29tZSBsZWdhY3kgQVBJcyBpbiBSYXhcbiAgfSlcbiAgT2JqZWN0LmZyZWV6ZShydW50aW1lQ29udGV4dClcblxuICAvLyBwcmVwYXJlIGluc3RhbmNlIGNvbnRleHRcbiAgY29uc3QgaW5zdGFuY2VDb250ZXh0ID0gT2JqZWN0LmFzc2lnbih7fSwgcnVudGltZUNvbnRleHQpXG4gIGlmICh0eXBlb2YgZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlQ29udGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIE9iamVjdC5hc3NpZ24oaW5zdGFuY2VDb250ZXh0LCBmcmFtZXdvcmsuY3JlYXRlSW5zdGFuY2VDb250ZXh0KGlkLCBydW50aW1lQ29udGV4dCwgZGF0YSkpXG4gIH1cbiAgT2JqZWN0LmZyZWV6ZShpbnN0YW5jZUNvbnRleHQpXG4gIHJldHVybiBpbnN0YW5jZUNvbnRleHRcbn1cblxuLyoqXG4gKiBDaGVjayB3aGljaCBmcmFtZXdvcmsgYSBjZXJ0YWluIEpTIEJ1bmRsZSBjb2RlIGJhc2VkIHRvLiBBbmQgY3JlYXRlIGluc3RhbmNlXG4gKiBieSB0aGlzIGZyYW1ld29yay5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUluc3RhbmNlIChpZCwgY29kZSwgY29uZmlnLCBkYXRhKSB7XG4gIGlmIChpbnN0YW5jZVR5cGVNYXBbaWRdKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgVGhlIGluc3RhbmNlIGlkIFwiJHtpZH1cIiBoYXMgYWxyZWFkeSBiZWVuIHVzZWQhYClcbiAgfVxuXG4gIC8vIEluaXQgaW5zdGFuY2UgaW5mby5cbiAgY29uc3QgYnVuZGxlVHlwZSA9IGdldEJ1bmRsZVR5cGUoY29kZSlcbiAgaW5zdGFuY2VUeXBlTWFwW2lkXSA9IGJ1bmRsZVR5cGVcblxuICAvLyBJbml0IGluc3RhbmNlIGNvbmZpZy5cbiAgY29uZmlnID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb25maWcgfHwge30pKVxuICBjb25maWcuZW52ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWwuV1hFbnZpcm9ubWVudCB8fCB7fSkpXG4gIGNvbmZpZy5idW5kbGVUeXBlID0gYnVuZGxlVHlwZVxuXG4gIGNvbnN0IGZyYW1ld29yayA9IHJ1bnRpbWVDb25maWcuZnJhbWV3b3Jrc1tidW5kbGVUeXBlXVxuICBpZiAoIWZyYW1ld29yaykge1xuICAgIHJldHVybiBuZXcgRXJyb3IoYFtKUyBGcmFtZXdvcmtdIEludmFsaWQgYnVuZGxlIHR5cGUgXCIke2J1bmRsZVR5cGV9XCIuYClcbiAgfVxuICBpZiAoYnVuZGxlVHlwZSA9PT0gJ1dlZXgnKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gQ09NUEFUSUJJTElUWSBXQVJOSU5HOiBgXG4gICAgICArIGBXZWV4IERTTCAxLjAgKC53ZSkgZnJhbWV3b3JrIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQhIGBcbiAgICAgICsgYEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCB2ZXJzaW9uIG9mIFdlZXhTREssIGBcbiAgICAgICsgYHlvdXIgcGFnZSB3b3VsZCBiZSBjcmFzaCBpZiB5b3Ugc3RpbGwgdXNpbmcgdGhlIFwiLndlXCIgZnJhbWV3b3JrLiBgXG4gICAgICArIGBQbGVhc2UgdXBncmFkZSBpdCB0byBWdWUuanMgb3IgUmF4LmApXG4gIH1cblxuICBjb25zdCBpbnN0YW5jZUNvbnRleHQgPSBjcmVhdGVJbnN0YW5jZUNvbnRleHQoaWQsIGNvbmZpZywgZGF0YSlcbiAgaWYgKHR5cGVvZiBmcmFtZXdvcmsuY3JlYXRlSW5zdGFuY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBUZW1wb3JhcnkgY29tcGF0aWJsZSB3aXRoIHNvbWUgbGVnYWN5IEFQSXMgaW4gUmF4LFxuICAgIC8vIHNvbWUgUmF4IHBhZ2UgaXMgdXNpbmcgdGhlIGxlZ2FjeSBcIi53ZVwiIGZyYW1ld29yay5cbiAgICBpZiAoYnVuZGxlVHlwZSA9PT0gJ1JheCcgfHwgYnVuZGxlVHlwZSA9PT0gJ1dlZXgnKSB7XG4gICAgICBjb25zdCByYXhJbnN0YW5jZUNvbnRleHQgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgY29uZmlnLFxuICAgICAgICBjcmVhdGVkOiBEYXRlLm5vdygpLFxuICAgICAgICBmcmFtZXdvcms6IGJ1bmRsZVR5cGVcbiAgICAgIH0sIGluc3RhbmNlQ29udGV4dClcbiAgICAgIHJldHVybiBmcmFtZXdvcmsuY3JlYXRlSW5zdGFuY2UoaWQsIGNvZGUsIGNvbmZpZywgZGF0YSwgcmF4SW5zdGFuY2VDb250ZXh0KVxuICAgIH1cbiAgICByZXR1cm4gZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlKGlkLCBjb2RlLCBjb25maWcsIGRhdGEsIGluc3RhbmNlQ29udGV4dClcbiAgfVxuICAvLyBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBDYW4ndCBmaW5kIGF2YWlsYWJsZSBcImNyZWF0ZUluc3RhbmNlXCIgbWV0aG9kIGluICR7YnVuZGxlVHlwZX0hYClcbiAgcnVuSW5Db250ZXh0KGNvZGUsIGluc3RhbmNlQ29udGV4dClcbn1cblxuLyoqXG4gKiBSdW4ganMgY29kZSBpbiBhIHNwZWNpZmljIGNvbnRleHQuXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHBhcmFtIHtvYmplY3R9IGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gcnVuSW5Db250ZXh0IChjb2RlLCBjb250ZXh0KSB7XG4gIGNvbnN0IGtleXMgPSBbXVxuICBjb25zdCBhcmdzID0gW11cbiAgZm9yIChjb25zdCBrZXkgaW4gY29udGV4dCkge1xuICAgIGtleXMucHVzaChrZXkpXG4gICAgYXJncy5wdXNoKGNvbnRleHRba2V5XSlcbiAgfVxuXG4gIGNvbnN0IGJ1bmRsZSA9IGBcbiAgICAoZnVuY3Rpb24gKGdsb2JhbCkge1xuICAgICAgJHtjb2RlfVxuICAgIH0pKE9iamVjdC5jcmVhdGUodGhpcykpXG4gIGBcblxuICByZXR1cm4gKG5ldyBGdW5jdGlvbiguLi5rZXlzLCBidW5kbGUpKSguLi5hcmdzKVxufVxuXG4vKipcbiAqIEdldCB0aGUgSlNPTiBvYmplY3Qgb2YgdGhlIHJvb3QgZWxlbWVudC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnN0YW5jZUlkXG4gKi9cbmZ1bmN0aW9uIGdldFJvb3QgKGluc3RhbmNlSWQpIHtcbiAgY29uc3QgZG9jdW1lbnQgPSBnZXREb2MoaW5zdGFuY2VJZClcbiAgdHJ5IHtcbiAgICBpZiAoZG9jdW1lbnQgJiYgZG9jdW1lbnQuYm9keSkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkudG9KU09OKClcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gZ2V0IHRoZSB2aXJ0dWFsIGRvbSB0cmVlLmApXG4gICAgcmV0dXJuXG4gIH1cbn1cblxuY29uc3QgbWV0aG9kcyA9IHtcbiAgY3JlYXRlSW5zdGFuY2UsXG4gIGNyZWF0ZUluc3RhbmNlQ29udGV4dCxcbiAgZ2V0Um9vdCxcbiAgZ2V0RG9jdW1lbnQ6IGdldERvYyxcbiAgcmVnaXN0ZXJTZXJ2aWNlOiByZWdpc3RlcixcbiAgdW5yZWdpc3RlclNlcnZpY2U6IHVucmVnaXN0ZXIsXG4gIGNhbGxKUyAoaWQsIHRhc2tzKSB7XG4gICAgY29uc3QgZnJhbWV3b3JrID0gZnJhbWV3b3Jrc1tnZXRGcmFtZXdvcmtUeXBlKGlkKV1cbiAgICBpZiAoZnJhbWV3b3JrICYmIHR5cGVvZiBmcmFtZXdvcmsucmVjZWl2ZVRhc2tzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gZnJhbWV3b3JrLnJlY2VpdmVUYXNrcyhpZCwgdGFza3MpXG4gICAgfVxuICAgIHJldHVybiByZWNlaXZlVGFza3MoaWQsIHRhc2tzKVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgbWV0aG9kcyB3aGljaCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2ROYW1lXG4gKi9cbmZ1bmN0aW9uIGdlbkluc3RhbmNlIChtZXRob2ROYW1lKSB7XG4gIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGNvbnN0IGlkID0gYXJnc1swXVxuICAgIGNvbnN0IHR5cGUgPSBnZXRGcmFtZXdvcmtUeXBlKGlkKVxuICAgIGlmICh0eXBlICYmIGZyYW1ld29ya3NbdHlwZV0pIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZyYW1ld29ya3NbdHlwZV1bbWV0aG9kTmFtZV0oLi4uYXJncylcbiAgICAgIGNvbnN0IGluZm8gPSB7IGZyYW1ld29yazogdHlwZSB9XG5cbiAgICAgIC8vIExpZmVjeWNsZSBtZXRob2RzXG4gICAgICBpZiAobWV0aG9kTmFtZSA9PT0gJ3JlZnJlc2hJbnN0YW5jZScpIHtcbiAgICAgICAgc2VydmljZXMuZm9yRWFjaChzZXJ2aWNlID0+IHtcbiAgICAgICAgICBjb25zdCByZWZyZXNoID0gc2VydmljZS5vcHRpb25zLnJlZnJlc2hcbiAgICAgICAgICBpZiAocmVmcmVzaCkge1xuICAgICAgICAgICAgcmVmcmVzaChpZCwgeyBpbmZvLCBydW50aW1lOiBydW50aW1lQ29uZmlnIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAobWV0aG9kTmFtZSA9PT0gJ2Rlc3Ryb3lJbnN0YW5jZScpIHtcbiAgICAgICAgc2VydmljZXMuZm9yRWFjaChzZXJ2aWNlID0+IHtcbiAgICAgICAgICBjb25zdCBkZXN0cm95ID0gc2VydmljZS5vcHRpb25zLmRlc3Ryb3lcbiAgICAgICAgICBpZiAoZGVzdHJveSkge1xuICAgICAgICAgICAgZGVzdHJveShpZCwgeyBpbmZvLCBydW50aW1lOiBydW50aW1lQ29uZmlnIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICBkZWxldGUgaW5zdGFuY2VUeXBlTWFwW2lkXVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfVxuICAgIHJldHVybiBuZXcgRXJyb3IoYFtKUyBGcmFtZXdvcmtdIFVzaW5nIGludmFsaWQgaW5zdGFuY2UgaWQgYFxuICAgICAgKyBgXCIke2lkfVwiIHdoZW4gY2FsbGluZyAke21ldGhvZE5hbWV9LmApXG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlciBtZXRob2RzIHdoaWNoIGluaXQgZWFjaCBmcmFtZXdvcmtzLlxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZE5hbWVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHNoYXJlZE1ldGhvZFxuICovXG5mdW5jdGlvbiBhZGFwdE1ldGhvZCAobWV0aG9kTmFtZSwgc2hhcmVkTWV0aG9kKSB7XG4gIG1ldGhvZHNbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGlmICh0eXBlb2Ygc2hhcmVkTWV0aG9kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBzaGFyZWRNZXRob2QoLi4uYXJncylcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBkZXByZWNhdGVkXG4gICAgZm9yIChjb25zdCBuYW1lIGluIHJ1bnRpbWVDb25maWcuZnJhbWV3b3Jrcykge1xuICAgICAgY29uc3QgZnJhbWV3b3JrID0gcnVudGltZUNvbmZpZy5mcmFtZXdvcmtzW25hbWVdXG4gICAgICBpZiAoZnJhbWV3b3JrICYmIGZyYW1ld29ya1ttZXRob2ROYW1lXSkge1xuICAgICAgICBmcmFtZXdvcmtbbWV0aG9kTmFtZV0oLi4uYXJncylcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdCAoY29uZmlnKSB7XG4gIHJ1bnRpbWVDb25maWcgPSBjb25maWcgfHwge31cbiAgZnJhbWV3b3JrcyA9IHJ1bnRpbWVDb25maWcuZnJhbWV3b3JrcyB8fCB7fVxuICBpbml0VGFza0hhbmRsZXIoKVxuXG4gIC8vIEluaXQgZWFjaCBmcmFtZXdvcmsgYnkgYGluaXRgIG1ldGhvZCBhbmQgYGNvbmZpZ2Agd2hpY2ggY29udGFpbnMgdGhyZWVcbiAgLy8gdmlydHVhbC1ET00gQ2xhc3M6IGBEb2N1bWVudGAsIGBFbGVtZW50YCAmIGBDb21tZW50YCwgYW5kIGEgSlMgYnJpZGdlIG1ldGhvZDpcbiAgLy8gYHNlbmRUYXNrcyguLi5hcmdzKWAuXG4gIGZvciAoY29uc3QgbmFtZSBpbiBmcmFtZXdvcmtzKSB7XG4gICAgY29uc3QgZnJhbWV3b3JrID0gZnJhbWV3b3Jrc1tuYW1lXVxuICAgIGlmICh0eXBlb2YgZnJhbWV3b3JrLmluaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZyYW1ld29yay5pbml0KGNvbmZpZylcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7fVxuICAgIH1cbiAgfVxuXG4gIGFkYXB0TWV0aG9kKCdyZWdpc3RlckNvbXBvbmVudHMnLCByZWdpc3RlckNvbXBvbmVudHMpXG4gIGFkYXB0TWV0aG9kKCdyZWdpc3Rlck1vZHVsZXMnLCByZWdpc3Rlck1vZHVsZXMpXG4gIGFkYXB0TWV0aG9kKCdyZWdpc3Rlck1ldGhvZHMnKVxuXG4gIDsgWydkZXN0cm95SW5zdGFuY2UnLCAncmVmcmVzaEluc3RhbmNlJ10uZm9yRWFjaChnZW5JbnN0YW5jZSlcblxuICByZXR1cm4gbWV0aG9kc1xufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBOb2RlIGZyb20gJy4vTm9kZSdcbmltcG9ydCBFbGVtZW50IGZyb20gJy4vRWxlbWVudCdcbmltcG9ydCBDb21tZW50IGZyb20gJy4vQ29tbWVudCdcbmltcG9ydCBEb2N1bWVudCBmcm9tICcuL0RvY3VtZW50J1xuXG5leHBvcnQge1xuICByZWdpc3RlckVsZW1lbnQsXG4gIHVucmVnaXN0ZXJFbGVtZW50LFxuICBpc1dlZXhFbGVtZW50LFxuICBjbGVhcldlZXhFbGVtZW50c1xufSBmcm9tICcuL1dlZXhFbGVtZW50J1xuXG5leHBvcnQge1xuICBEb2N1bWVudCxcbiAgTm9kZSxcbiAgRWxlbWVudCxcbiAgQ29tbWVudFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IERvY3VtZW50LCBFbGVtZW50LCBDb21tZW50IH0gZnJvbSAnLi4vdmRvbSdcbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuLi9icmlkZ2UvTGlzdGVuZXInXG5pbXBvcnQgeyBUYXNrQ2VudGVyIH0gZnJvbSAnLi4vYnJpZGdlL1Rhc2tDZW50ZXInXG5cbmNvbnN0IGNvbmZpZyA9IHtcbiAgRG9jdW1lbnQsIEVsZW1lbnQsIENvbW1lbnQsIExpc3RlbmVyLFxuICBUYXNrQ2VudGVyLFxuICBzZW5kVGFza3MgKC4uLmFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIGNhbGxOYXRpdmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBjYWxsTmF0aXZlKC4uLmFyZ3MpXG4gICAgfVxuICAgIHJldHVybiAoZ2xvYmFsLmNhbGxOYXRpdmUgfHwgKCgpID0+IHt9KSkoLi4uYXJncylcbiAgfVxufVxuXG5Eb2N1bWVudC5oYW5kbGVyID0gY29uZmlnLnNlbmRUYXNrc1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWdcbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgaW5pdCBmcm9tICcuL2luaXQnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHsgcmVnaXN0ZXIsIHVucmVnaXN0ZXIsIGhhcyB9IGZyb20gJy4vc2VydmljZSdcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIGZyZWV6ZVByb3RvdHlwZSAoKSB7XG4gIC8vIE9iamVjdC5mcmVlemUoY29uZmlnLkVsZW1lbnQpXG4gIE9iamVjdC5mcmVlemUoY29uZmlnLkNvbW1lbnQpXG4gIE9iamVjdC5mcmVlemUoY29uZmlnLkxpc3RlbmVyKVxuICBPYmplY3QuZnJlZXplKGNvbmZpZy5Eb2N1bWVudC5wcm90b3R5cGUpXG4gIC8vIE9iamVjdC5mcmVlemUoY29uZmlnLkVsZW1lbnQucHJvdG90eXBlKVxuICBPYmplY3QuZnJlZXplKGNvbmZpZy5Db21tZW50LnByb3RvdHlwZSlcbiAgT2JqZWN0LmZyZWV6ZShjb25maWcuTGlzdGVuZXIucHJvdG90eXBlKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHNlcnZpY2U6IHsgcmVnaXN0ZXIsIHVucmVnaXN0ZXIsIGhhcyB9LFxuICBmcmVlemVQcm90b3R5cGUsXG4gIGluaXQsXG4gIGNvbmZpZ1xufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogTW9jayBNZXNzYWdlRXZlbnQgdHlwZVxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBkaWN0IHsgZGF0YSwgb3JpZ2luLCBzb3VyY2UsIHBvcnRzIH1cbiAqXG4gKiBUaGlzIHR5cGUgaGFzIGJlZW4gc2ltcGxpZmllZC5cbiAqIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2NvbW1zLmh0bWwjbWVzc2FnZWV2ZW50XG4gKiBodHRwczovL2RvbS5zcGVjLndoYXR3Zy5vcmcvI2ludGVyZmFjZS1ldmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gTWVzc2FnZUV2ZW50ICh0eXBlLCBkaWN0ID0ge30pIHtcbiAgdGhpcy50eXBlID0gdHlwZSB8fCAnbWVzc2FnZSdcblxuICB0aGlzLmRhdGEgPSBkaWN0LmRhdGEgfHwgbnVsbFxuICB0aGlzLm9yaWdpbiA9IGRpY3Qub3JpZ2luIHx8ICcnXG4gIHRoaXMuc291cmNlID0gZGljdC5zb3VyY2UgfHwgbnVsbFxuICB0aGlzLnBvcnRzID0gZGljdC5wb3J0cyB8fCBbXVxuXG4gIC8vIGluaGVyaXQgcHJvcGVydGllc1xuICB0aGlzLnRhcmdldCA9IG51bGxcbiAgdGhpcy50aW1lU3RhbXAgPSBEYXRlLm5vdygpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBUaGUgcG9seWZpbGwgb2YgQnJvYWRjYXN0Q2hhbm5lbCBBUEkuXG4gKiBUaGlzIGFwaSBjYW4gYmUgdXNlZCB0byBhY2hpZXZlIGludGVyLWluc3RhbmNlIGNvbW11bmljYXRpb25zLlxuICpcbiAqIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2NvbW1zLmh0bWwjYnJvYWRjYXN0aW5nLXRvLW90aGVyLWJyb3dzaW5nLWNvbnRleHRzXG4gKi9cblxuaW1wb3J0IHsgTWVzc2FnZUV2ZW50IH0gZnJvbSAnLi9tZXNzYWdlLWV2ZW50J1xuXG5jb25zdCBjaGFubmVscyA9IHt9XG5jb25zdCBpbnN0YW5jZXMgPSB7fVxuXG4vKipcbiAqIEFuIGVtcHR5IGNvbnN0cnVjdG9yIGZvciBCcm9hZGNhc3RDaGFubmVsIHBvbHlmaWxsLlxuICogVGhlIHJlYWwgY29uc3RydWN0b3Igd2lsbCBiZSBkZWZpbmVkIHdoZW4gYSBXZWV4IGluc3RhbmNlIGNyZWF0ZWQgYmVjYXVzZVxuICogd2UgbmVlZCB0byB0cmFjayB0aGUgY2hhbm5lbCBieSBXZWV4IGluc3RhbmNlIGlkLlxuICovXG5mdW5jdGlvbiBCcm9hZGNhc3RDaGFubmVsICgpIHt9XG5cbi8qKlxuICogU2VuZHMgdGhlIGdpdmVuIG1lc3NhZ2UgdG8gb3RoZXIgQnJvYWRjYXN0Q2hhbm5lbCBvYmplY3RzIHNldCB1cCBmb3IgdGhpcyBjaGFubmVsLlxuICogQHBhcmFtIHthbnl9IG1lc3NhZ2VcbiAqL1xuQnJvYWRjYXN0Q2hhbm5lbC5wcm90b3R5cGUucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBCcm9hZGNhc3RDaGFubmVsIFwiJHt0aGlzLm5hbWV9XCIgaXMgY2xvc2VkLmApXG4gIH1cblxuICBjb25zdCBzdWJzY3JpYmVycyA9IGNoYW5uZWxzW3RoaXMubmFtZV1cbiAgaWYgKHN1YnNjcmliZXJzICYmIHN1YnNjcmliZXJzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGNvbnN0IG1lbWJlciA9IHN1YnNjcmliZXJzW2ldXG5cbiAgICAgIGlmIChtZW1iZXIuX2Nsb3NlZCB8fCBtZW1iZXIgPT09IHRoaXMpIGNvbnRpbnVlXG5cbiAgICAgIGlmICh0eXBlb2YgbWVtYmVyLm9ubWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBtZW1iZXIub25tZXNzYWdlKG5ldyBNZXNzYWdlRXZlbnQoJ21lc3NhZ2UnLCB7IGRhdGE6IG1lc3NhZ2UgfSkpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2xvc2VzIHRoZSBCcm9hZGNhc3RDaGFubmVsIG9iamVjdCwgb3BlbmluZyBpdCB1cCB0byBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gKi9cbkJyb2FkY2FzdENoYW5uZWwucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB0aGlzLl9jbG9zZWQgPSB0cnVlXG5cbiAgLy8gcmVtb3ZlIGl0c2VsZiBmcm9tIGNoYW5uZWxzLlxuICBpZiAoY2hhbm5lbHNbdGhpcy5uYW1lXSkge1xuICAgIGNvbnN0IHN1YnNjcmliZXJzID0gY2hhbm5lbHNbdGhpcy5uYW1lXS5maWx0ZXIoeCA9PiB4ICE9PSB0aGlzKVxuICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGgpIHtcbiAgICAgIGNoYW5uZWxzW3RoaXMubmFtZV0gPSBzdWJzY3JpYmVyc1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjaGFubmVsc1t0aGlzLm5hbWVdXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgY3JlYXRlOiAoaWQsIGVudiwgY29uZmlnKSA9PiB7XG4gICAgaW5zdGFuY2VzW2lkXSA9IFtdXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwuQnJvYWRjYXN0Q2hhbm5lbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHt9XG4gICAgfVxuICAgIGNvbnN0IHNlcnZpY2VPYmplY3QgPSB7XG4gICAgICAvKipcbiAgICAgICAqIFJldHVybnMgYSBuZXcgQnJvYWRjYXN0Q2hhbm5lbCBvYmplY3QgdmlhIHdoaWNoIG1lc3NhZ2VzIGZvciB0aGUgZ2l2ZW5cbiAgICAgICAqIGNoYW5uZWwgbmFtZSBjYW4gYmUgc2VudCBhbmQgcmVjZWl2ZWQuXG4gICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgICAgICovXG4gICAgICBCcm9hZGNhc3RDaGFubmVsOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAvLyB0aGUgbmFtZSBwcm9wZXJ0eSBpcyByZWFkb25seVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ25hbWUnLCB7XG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogU3RyaW5nKG5hbWUpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcbiAgICAgICAgdGhpcy5vbm1lc3NhZ2UgPSBudWxsXG5cbiAgICAgICAgaWYgKCFjaGFubmVsc1t0aGlzLm5hbWVdKSB7XG4gICAgICAgICAgY2hhbm5lbHNbdGhpcy5uYW1lXSA9IFtdXG4gICAgICAgIH1cbiAgICAgICAgY2hhbm5lbHNbdGhpcy5uYW1lXS5wdXNoKHRoaXMpXG4gICAgICAgIGluc3RhbmNlc1tpZF0ucHVzaCh0aGlzKVxuICAgICAgfVxuICAgIH1cbiAgICBzZXJ2aWNlT2JqZWN0LkJyb2FkY2FzdENoYW5uZWwucHJvdG90eXBlID0gQnJvYWRjYXN0Q2hhbm5lbC5wcm90b3R5cGVcbiAgICByZXR1cm4ge1xuICAgICAgaW5zdGFuY2U6IHNlcnZpY2VPYmplY3RcbiAgICB9XG4gIH0sXG4gIGRlc3Ryb3k6IChpZCwgZW52KSA9PiB7XG4gICAgaW5zdGFuY2VzW2lkXS5mb3JFYWNoKGNoYW5uZWwgPT4gY2hhbm5lbC5jbG9zZSgpKVxuICAgIGRlbGV0ZSBpbnN0YW5jZXNbaWRdXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IEJyb2FkY2FzdENoYW5uZWwgZnJvbSAnLi9icm9hZGNhc3QtY2hhbm5lbC9pbmRleCdcblxuZXhwb3J0IGRlZmF1bHQge1xuICBCcm9hZGNhc3RDaGFubmVsXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgc3VidmVyc2lvbiB9IGZyb20gJy4uLy4uL3BhY2thZ2UuanNvbidcbmltcG9ydCBydW50aW1lIGZyb20gJy4uL2FwaSdcbmltcG9ydCBzZXJ2aWNlcyBmcm9tICcuLi9zZXJ2aWNlcydcblxuLyoqXG4gKiBTZXR1cCBmcmFtZXdvcmtzIHdpdGggcnVudGltZS5cbiAqIFlvdSBjYW4gcGFja2FnZSBtb3JlIGZyYW1ld29ya3MgYnlcbiAqICBwYXNzaW5nIHRoZW0gYXMgYXJndW1lbnRzLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoZnJhbWV3b3Jrcykge1xuICBjb25zdCB7IGluaXQsIGNvbmZpZyB9ID0gcnVudGltZVxuICBjb25maWcuZnJhbWV3b3JrcyA9IGZyYW1ld29ya3NcbiAgY29uc3QgeyBuYXRpdmUsIHRyYW5zZm9ybWVyIH0gPSBzdWJ2ZXJzaW9uXG5cbiAgZm9yIChjb25zdCBzZXJ2aWNlTmFtZSBpbiBzZXJ2aWNlcykge1xuICAgIHJ1bnRpbWUuc2VydmljZS5yZWdpc3RlcihzZXJ2aWNlTmFtZSwgc2VydmljZXNbc2VydmljZU5hbWVdKVxuICB9XG5cbiAgcnVudGltZS5mcmVlemVQcm90b3R5cGUoKVxuXG4gIC8vIHJlZ2lzdGVyIGZyYW1ld29yayBtZXRhIGluZm9cbiAgZ2xvYmFsLmZyYW1ld29ya1ZlcnNpb24gPSBuYXRpdmVcbiAgZ2xvYmFsLnRyYW5zZm9ybWVyVmVyc2lvbiA9IHRyYW5zZm9ybWVyXG5cbiAgLy8gaW5pdCBmcmFtZXdvcmtzXG4gIGNvbnN0IGdsb2JhbE1ldGhvZHMgPSBpbml0KGNvbmZpZylcblxuICAvLyBzZXQgZ2xvYmFsIG1ldGhvZHNcbiAgZm9yIChjb25zdCBtZXRob2ROYW1lIGluIGdsb2JhbE1ldGhvZHMpIHtcbiAgICBnbG9iYWxbbWV0aG9kTmFtZV0gPSAoLi4uYXJncykgPT4ge1xuICAgICAgY29uc3QgcmV0ID0gZ2xvYmFsTWV0aG9kc1ttZXRob2ROYW1lXSguLi5hcmdzKVxuICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IocmV0LnRvU3RyaW5nKCkpXG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0XG4gICAgfVxuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlldyBUaGUgYXBpIGZvciBpbnZva2luZyB3aXRoIFwiJFwiIHByZWZpeFxuICovXG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgdXNlICR2bSBpbnN0ZWFkXG4gKiBmaW5kIHRoZSB2bSBieSBpZFxuICogTm90ZTogdGhlcmUgaXMgb25seSBvbmUgaWQgaW4gd2hvbGUgY29tcG9uZW50XG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlkXG4gKiBAcmV0dXJuIHtWbX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICQgKGlkKSB7XG4gIGNvbnNvbGUud2FybignW0pTIEZyYW1ld29ya10gVm0jJCBpcyBkZXByZWNhdGVkLCBwbGVhc2UgdXNlIFZtIyR2bSBpbnN0ZWFkJylcbiAgY29uc3QgaW5mbyA9IHRoaXMuX2lkc1tpZF1cbiAgaWYgKGluZm8pIHtcbiAgICByZXR1cm4gaW5mby52bVxuICB9XG59XG5cbi8qKlxuICogZmluZCB0aGUgZWxlbWVudCBieSBpZFxuICogTm90ZTogdGhlcmUgaXMgb25seSBvbmUgaWQgaW4gd2hvbGUgY29tcG9uZW50XG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlkXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG5leHBvcnQgZnVuY3Rpb24gJGVsIChpZCkge1xuICBjb25zdCBpbmZvID0gdGhpcy5faWRzW2lkXVxuICBpZiAoaW5mbykge1xuICAgIHJldHVybiBpbmZvLmVsXG4gIH1cbn1cblxuLyoqXG4gKiBmaW5kIHRoZSB2bSBvZiB0aGUgY3VzdG9tIGNvbXBvbmVudCBieSBpZFxuICogTm90ZTogdGhlcmUgaXMgb25seSBvbmUgaWQgaW4gd2hvbGUgY29tcG9uZW50XG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlkXG4gKiBAcmV0dXJuIHtWbX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICR2bSAoaWQpIHtcbiAgY29uc3QgaW5mbyA9IHRoaXMuX2lkc1tpZF1cbiAgaWYgKGluZm8pIHtcbiAgICByZXR1cm4gaW5mby52bVxuICB9XG59XG5cbi8qKlxuICogRmlyZSB3aGVuIGRpZmZlciByZW5kZXJpbmcgZmluaXNoZWRcbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICRyZW5kZXJUaGVuIChmbikge1xuICBjb25zdCBhcHAgPSB0aGlzLl9hcHBcbiAgY29uc3QgZGlmZmVyID0gYXBwLmRpZmZlclxuICByZXR1cm4gZGlmZmVyLnRoZW4oKCkgPT4ge1xuICAgIGZuKClcbiAgfSlcbn1cblxuLyoqXG4gKiBzY3JvbGwgYW4gZWxlbWVudCBzcGVjaWZpZWQgYnkgaWQgaW50byB2aWV3LFxuICogbW9yZW92ZXIgc3BlY2lmeSBhIG51bWJlciBvZiBvZmZzZXQgb3B0aW9uYWxseVxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHBhcmFtICB7bnVtYmVyfSBvZmZzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICRzY3JvbGxUbyAoaWQsIG9mZnNldCkge1xuICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIFZtIyRzY3JvbGxUbyBpcyBkZXByZWNhdGVkLCAnICtcbiAgICAgICAgICAncGxlYXNlIHVzZSBcInJlcXVpcmUoXFwnQHdlZXgtbW9kdWxlL2RvbVxcJyknICtcbiAgICAgICAgICAnLnNjcm9sbFRvKGVsLCBvcHRpb25zKVwiIGluc3RlYWQnKVxuICBjb25zdCBlbCA9IHRoaXMuJGVsKGlkKVxuICBpZiAoZWwpIHtcbiAgICBjb25zdCBkb20gPSB0aGlzLl9hcHAucmVxdWlyZU1vZHVsZSgnZG9tJylcbiAgICBkb20uc2Nyb2xsVG9FbGVtZW50KGVsLnJlZiwgeyBvZmZzZXQ6IG9mZnNldCB9KVxuICB9XG59XG5cbi8qKlxuICogcGVyZm9ybSB0cmFuc2l0aW9uIGFuaW1hdGlvbiBvbiBhbiBlbGVtZW50IHNwZWNpZmllZCBieSBpZFxuICogQHBhcmFtICB7c3RyaW5nfSAgIGlkXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgb3B0aW9uc1xuICogQHBhcmFtICB7b2JqZWN0fSAgIG9wdGlvbnMuc3R5bGVzXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgb3B0aW9ucy5kdXJhdGlvbihtcylcbiAqIEBwYXJhbSAge29iamVjdH0gICBbb3B0aW9ucy50aW1pbmdGdW5jdGlvbl1cbiAqIEBwYXJhbSAge29iamVjdH0gICBbb3B0aW9ucy5kZWxheT0wKG1zKV1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gJHRyYW5zaXRpb24gKGlkLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBjb25zdCBlbCA9IHRoaXMuJGVsKGlkKVxuICBpZiAoZWwgJiYgb3B0aW9ucyAmJiBvcHRpb25zLnN0eWxlcykge1xuICAgIGNvbnN0IGFuaW1hdGlvbiA9IHRoaXMuX2FwcC5yZXF1aXJlTW9kdWxlKCdhbmltYXRpb24nKVxuICAgIGFuaW1hdGlvbi50cmFuc2l0aW9uKGVsLnJlZiwgb3B0aW9ucywgKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMuX3NldFN0eWxlKGVsLCBvcHRpb25zLnN0eWxlcylcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKC4uLmFyZ3MpXG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIGdldCBzb21lIGNvbmZpZ1xuICogQHJldHVybiB7b2JqZWN0fSBzb21lIGNvbmZpZyBmb3IgYXBwIGluc3RhbmNlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYnVuZGxlVXJsXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGRlYnVnXG4gKiBAcHJvcGVydHkge29iamVjdH0gZW52XG4gKiBAcHJvcGVydHkge3N0cmluZ30gZW52LndlZXhWZXJzaW9uKGV4LiAxLjAuMClcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBlbnYuYXBwTmFtZShleC4gVEIvVE0pXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZW52LmFwcFZlcnNpb24oZXguIDUuMC4wKVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGVudi5wbGF0Zm9ybShleC4gaU9TL0FuZHJvaWQpXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZW52Lm9zVmVyc2lvbihleC4gNy4wLjApXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZW52LmRldmljZU1vZGVsICoqbmF0aXZlIG9ubHkqKlxuICogQHByb3BlcnR5IHtudW1iZXJ9IGVudi5bZGV2aWNlV2lkdGg9NzUwXVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGVudi5kZXZpY2VIZWlnaHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICRnZXRDb25maWcgKGNhbGxiYWNrKSB7XG4gIGNvbnN0IGNvbmZpZyA9IHRoaXMuX2FwcC5vcHRpb25zXG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIHRoZSBjYWxsYmFjayBvZiBWbSMkZ2V0Q29uZmlnKGNhbGxiYWNrKSBpcyBkZXByZWNhdGVkLCAnICtcbiAgICAgICd0aGlzIGFwaSBub3cgY2FuIGRpcmVjdGx5IFJFVFVSTiBjb25maWcgaW5mby4nKVxuICAgIGNhbGxiYWNrKGNvbmZpZylcbiAgfVxuICByZXR1cm4gY29uZmlnXG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqIHJlcXVlc3QgbmV0d29yayB2aWEgaHR0cCBwcm90b2NvbFxuICogQHBhcmFtICB7b2JqZWN0fSAgIHBhcmFtc1xuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkc2VuZEh0dHAgKHBhcmFtcywgY2FsbGJhY2spIHtcbiAgY29uc29sZS53YXJuKCdbSlMgRnJhbWV3b3JrXSBWbSMkc2VuZEh0dHAgaXMgZGVwcmVjYXRlZCwgJyArXG4gICAgICAgICAgJ3BsZWFzZSB1c2UgXCJyZXF1aXJlKFxcJ0B3ZWV4LW1vZHVsZS9zdHJlYW1cXCcpJyArXG4gICAgICAgICAgJy5zZW5kSHR0cChwYXJhbXMsIGNhbGxiYWNrKVwiIGluc3RlYWQnKVxuICBjb25zdCBzdHJlYW0gPSB0aGlzLl9hcHAucmVxdWlyZU1vZHVsZSgnc3RyZWFtJylcbiAgc3RyZWFtLnNlbmRIdHRwKHBhcmFtcywgY2FsbGJhY2spXG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqIG9wZW4gYSB1cmxcbiAqIEBwYXJhbSAge3N0cmluZ30gdXJsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkb3BlblVSTCAodXJsKSB7XG4gIGNvbnNvbGUud2FybignW0pTIEZyYW1ld29ya10gVm0jJG9wZW5VUkwgaXMgZGVwcmVjYXRlZCwgJyArXG4gICAgICAgICAgJ3BsZWFzZSB1c2UgXCJyZXF1aXJlKFxcJ0B3ZWV4LW1vZHVsZS9ldmVudFxcJyknICtcbiAgICAgICAgICAnLm9wZW5VUkwodXJsKVwiIGluc3RlYWQnKVxuICBjb25zdCBldmVudCA9IHRoaXMuX2FwcC5yZXF1aXJlTW9kdWxlKCdldmVudCcpXG4gIGV2ZW50Lm9wZW5VUkwodXJsKVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiBzZXQgYSB0aXRsZSBmb3IgcGFnZVxuICogQHBhcmFtICB7c3RyaW5nfSB0aXRsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gJHNldFRpdGxlICh0aXRsZSkge1xuICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIFZtIyRzZXRUaXRsZSBpcyBkZXByZWNhdGVkLCAnICtcbiAgICAgICAgICAncGxlYXNlIHVzZSBcInJlcXVpcmUoXFwnQHdlZXgtbW9kdWxlL3BhZ2VJbmZvXFwnKScgK1xuICAgICAgICAgICcuc2V0VGl0bGUodGl0bGUpXCIgaW5zdGVhZCcpXG4gIGNvbnN0IHBhZ2VJbmZvID0gdGhpcy5fYXBwLnJlcXVpcmVNb2R1bGUoJ3BhZ2VJbmZvJylcbiAgcGFnZUluZm8uc2V0VGl0bGUodGl0bGUpXG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgdXNlIFwicmVxdWlyZSgnQHdlZXgtbW9kdWxlL21vZHVsZU5hbWUnKSBpbnN0ZWFkXCJcbiAqIGludm9rZSBhIG5hdGl2ZSBtZXRob2QgYnkgc3BlY2lmaW5nIHRoZSBuYW1lIG9mIG1vZHVsZSBhbmQgbWV0aG9kXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG1vZHVsZU5hbWVcbiAqIEBwYXJhbSAge3N0cmluZ30gbWV0aG9kTmFtZVxuICogQHBhcmFtICB7Li4uKn0gdGhlIHJlc3QgYXJndW1lbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkY2FsbCAobW9kdWxlTmFtZSwgbWV0aG9kTmFtZSwgLi4uYXJncykge1xuICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIFZtIyRjYWxsIGlzIGRlcHJlY2F0ZWQsICcgK1xuICAgICdwbGVhc2UgdXNlIFwicmVxdWlyZShcXCdAd2VleC1tb2R1bGUvbW9kdWxlTmFtZVxcJylcIiBpbnN0ZWFkJylcbiAgY29uc3QgbW9kdWxlID0gdGhpcy5fYXBwLnJlcXVpcmVNb2R1bGUobW9kdWxlTmFtZSlcbiAgaWYgKG1vZHVsZSAmJiBtb2R1bGVbbWV0aG9kTmFtZV0pIHtcbiAgICBtb2R1bGVbbWV0aG9kTmFtZV0oLi4uYXJncylcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vKipcbiAqIE1peCBwcm9wZXJ0aWVzIGludG8gdGFyZ2V0IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBmcm9tXG4gKi9cblxuZnVuY3Rpb24gZXh0ZW5kICh0YXJnZXQsIC4uLnNyYykge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBPYmplY3QuYXNzaWduKHRhcmdldCwgLi4uc3JjKVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnN0IGZpcnN0ID0gc3JjLnNoaWZ0KClcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBmaXJzdCkge1xuICAgICAgdGFyZ2V0W2tleV0gPSBmaXJzdFtrZXldXG4gICAgfVxuICAgIGlmIChzcmMubGVuZ3RoKSB7XG4gICAgICBleHRlbmQodGFyZ2V0LCAuLi5zcmMpXG4gICAgfVxuICB9XG4gIHJldHVybiB0YXJnZXRcbn1cblxuLyoqXG4gKiBEZWZpbmUgYSBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHBhcmFtIHtCb29sZWFufSBbZW51bWVyYWJsZV1cbiAqL1xuXG5mdW5jdGlvbiBkZWYgKG9iaiwga2V5LCB2YWwsIGVudW1lcmFibGUpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XG4gICAgdmFsdWU6IHZhbCxcbiAgICBlbnVtZXJhYmxlOiAhIWVudW1lcmFibGUsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG59XG5cbi8qKlxuICogUmVtb3ZlIGFuIGl0ZW0gZnJvbSBhbiBhcnJheVxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyclxuICogQHBhcmFtIHsqfSBpdGVtXG4gKi9cblxuZnVuY3Rpb24gcmVtb3ZlIChhcnIsIGl0ZW0pIHtcbiAgaWYgKGFyci5sZW5ndGgpIHtcbiAgICBjb25zdCBpbmRleCA9IGFyci5pbmRleE9mKGl0ZW0pXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHJldHVybiBhcnIuc3BsaWNlKGluZGV4LCAxKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIG9iamVjdCBoYXMgdGhlIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmNvbnN0IGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuZnVuY3Rpb24gaGFzT3duIChvYmosIGtleSkge1xuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSlcbn1cblxuLyoqXG4gKiBTaW1wbGUgYmluZCwgZmFzdGVyIHRoYW4gbmF0aXZlXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjdHhcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmZ1bmN0aW9uIGJpbmQgKGZuLCBjdHgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChhKSB7XG4gICAgY29uc3QgbCA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICByZXR1cm4gbFxuICAgICAgPyBsID4gMVxuICAgICAgICA/IGZuLmFwcGx5KGN0eCwgYXJndW1lbnRzKVxuICAgICAgICA6IGZuLmNhbGwoY3R4LCBhKVxuICAgICAgOiBmbi5jYWxsKGN0eClcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgYW4gQXJyYXktbGlrZSBvYmplY3QgdG8gYSByZWFsIEFycmF5LlxuICpcbiAqIEBwYXJhbSB7QXJyYXktbGlrZX0gbGlzdFxuICogQHBhcmFtIHtOdW1iZXJ9IFtzdGFydF0gLSBzdGFydCBpbmRleFxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cblxuZnVuY3Rpb24gdG9BcnJheSAobGlzdCwgc3RhcnQpIHtcbiAgc3RhcnQgPSBzdGFydCB8fCAwXG4gIGxldCBpID0gbGlzdC5sZW5ndGggLSBzdGFydFxuICBjb25zdCByZXQgPSBuZXcgQXJyYXkoaSlcbiAgd2hpbGUgKGktLSkge1xuICAgIHJldFtpXSA9IGxpc3RbaSArIHN0YXJ0XVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuLyoqXG4gKiBRdWljayBvYmplY3QgY2hlY2sgLSB0aGlzIGlzIHByaW1hcmlseSB1c2VkIHRvIHRlbGxcbiAqIE9iamVjdHMgZnJvbSBwcmltaXRpdmUgdmFsdWVzIHdoZW4gd2Uga25vdyB0aGUgdmFsdWVcbiAqIGlzIGEgSlNPTi1jb21wbGlhbnQgdHlwZS5cbiAqXG4gKiBAcGFyYW0geyp9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5mdW5jdGlvbiBpc09iamVjdCAob2JqKSB7XG4gIHJldHVybiBvYmogIT09IG51bGwgJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCdcbn1cblxuLyoqXG4gKiBTdHJpY3Qgb2JqZWN0IHR5cGUgY2hlY2suIE9ubHkgcmV0dXJucyB0cnVlXG4gKiBmb3IgcGxhaW4gSmF2YVNjcmlwdCBvYmplY3RzLlxuICpcbiAqIEBwYXJhbSB7Kn0gb2JqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5cbmNvbnN0IHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuY29uc3QgT0JKRUNUX1NUUklORyA9ICdbb2JqZWN0IE9iamVjdF0nXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0IChvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gT0JKRUNUX1NUUklOR1xufVxuXG5leHBvcnQge1xuICBleHRlbmQsXG4gIGRlZixcbiAgcmVtb3ZlLFxuICBoYXNPd24sXG4gIGJpbmQsXG4gIHRvQXJyYXksXG4gIGlzT2JqZWN0LFxuICBpc1BsYWluT2JqZWN0XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmV4cG9ydCB7XG4gIGV4dGVuZCxcbiAgZGVmLFxuICByZW1vdmUsXG4gIGhhc093bixcbiAgYmluZCxcbiAgdG9BcnJheSxcbiAgaXNPYmplY3QsXG4gIGlzUGxhaW5PYmplY3Rcbn0gZnJvbSAnLi9zaGFyZWQnXG5cbi8qKlxuICogQ2hlY2sgaWYgYSBzdHJpbmcgc3RhcnRzIHdpdGggJCBvciBfXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gaXNSZXNlcnZlZCAoc3RyKSB7XG4gIGNvbnN0IGMgPSAoc3RyICsgJycpLmNoYXJDb2RlQXQoMClcbiAgcmV0dXJuIGMgPT09IDB4MjQgfHwgYyA9PT0gMHg1RlxufVxuXG4vLyBjYW4gd2UgdXNlIF9fcHJvdG9fXz9cbmV4cG9ydCBjb25zdCBoYXNQcm90byA9ICdfX3Byb3RvX18nIGluIHt9XG5cbmxldCBfU2V0XG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuaWYgKHR5cGVvZiBTZXQgIT09ICd1bmRlZmluZWQnICYmIFNldC50b1N0cmluZygpLm1hdGNoKC9uYXRpdmUgY29kZS8pKSB7XG4gIC8vIHVzZSBuYXRpdmUgU2V0IHdoZW4gYXZhaWxhYmxlLlxuICBfU2V0ID0gU2V0XG59XG5lbHNlIHtcbiAgLy8gYSBub24tc3RhbmRhcmQgU2V0IHBvbHlmaWxsIHRoYXQgb25seSB3b3JrcyB3aXRoIHByaW1pdGl2ZSBrZXlzLlxuICBfU2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICB9XG4gIF9TZXQucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5zZXRba2V5XSAhPT0gdW5kZWZpbmVkXG4gIH1cbiAgX1NldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGtleSkge1xuICAgIGlmIChrZXkgPT0gbnVsbCB8fCB0aGlzLnNldFtrZXldKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5zZXRba2V5XSA9IDFcbiAgfVxuICBfU2V0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldCA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgfVxufVxuXG5leHBvcnQgeyBfU2V0IH1cblxuLyoqXG4gKiBQb2x5ZmlsbCBpbiBpT1M3IGJ5IG5hdGl2ZSBiZWNhdXNlIHRoZSBKYXZhU2NyaXB0IHBvbHlmaWxsIGhhcyBtZW1vcnkgcHJvYmxlbS5cbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmV3U2V0ICgpIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgKi9cbiAgaWYgKHR5cGVvZiBuYXRpdmVTZXQgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG5hdGl2ZVNldC5jcmVhdGUoKVxuICB9XG4gIC8qIGVzbGludC1lbmFibGUgKi9cbiAgcmV0dXJuIG5ldyBfU2V0KClcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBjYWNoZWQgdmVyc2lvbiBvZiBhIHB1cmUgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBjYWNoZWQgKGZuKSB7XG4gIGNvbnN0IGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICByZXR1cm4gZnVuY3Rpb24gY2FjaGVkRm4gKHN0cikge1xuICAgIGNvbnN0IGhpdCA9IGNhY2hlW3N0cl1cbiAgICByZXR1cm4gaGl0IHx8IChjYWNoZVtzdHJdID0gZm4oc3RyKSlcbiAgfVxufVxuXG4vKipcbiAqIENhbWVsaXplIGEgaHlwaGVuLWRlbG1pdGVkIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuY29uc3QgY2FtZWxpemVSRSA9IC8tKFxcdykvZ1xuZXhwb3J0IGNvbnN0IGNhbWVsaXplID0gY2FjaGVkKHN0ciA9PiB7XG4gIHJldHVybiBzdHIucmVwbGFjZShjYW1lbGl6ZVJFLCB0b1VwcGVyKVxufSlcblxuZnVuY3Rpb24gdG9VcHBlciAoXywgYykge1xuICByZXR1cm4gYyA/IGMudG9VcHBlckNhc2UoKSA6ICcnXG59XG5cbi8qKlxuICogSHlwaGVuYXRlIGEgY2FtZWxDYXNlIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuY29uc3QgaHlwaGVuYXRlUkUgPSAvKFthLXpcXGRdKShbQS1aXSkvZ1xuZXhwb3J0IGNvbnN0IGh5cGhlbmF0ZSA9IGNhY2hlZChzdHIgPT4ge1xuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoaHlwaGVuYXRlUkUsICckMS0kMicpXG4gICAgLnRvTG93ZXJDYXNlKClcbn0pXG5cbmV4cG9ydCBmdW5jdGlvbiB0eXBvZiAodikge1xuICBjb25zdCBzID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpXG4gIHJldHVybiBzLnN1YnN0cmluZyg4LCBzLmxlbmd0aCAtIDEpLnRvTG93ZXJDYXNlKClcbn1cblxuLy8gd2VleCBuYW1lIHJ1bGVzXG5cbmNvbnN0IFdFRVhfQ09NUE9ORU5UX1JFRyA9IC9eQHdlZXgtY29tcG9uZW50XFwvL1xuY29uc3QgV0VFWF9NT0RVTEVfUkVHID0gL15Ad2VleC1tb2R1bGVcXC8vXG5jb25zdCBOT1JNQUxfTU9EVUxFX1JFRyA9IC9eXFwuezEsMn1cXC8vXG5jb25zdCBKU19TVVJGSVhfUkVHID0gL1xcLmpzJC9cblxuZXhwb3J0IGNvbnN0IGlzV2VleENvbXBvbmVudCA9IG5hbWUgPT4gISFuYW1lLm1hdGNoKFdFRVhfQ09NUE9ORU5UX1JFRylcbmV4cG9ydCBjb25zdCBpc1dlZXhNb2R1bGUgPSBuYW1lID0+ICEhbmFtZS5tYXRjaChXRUVYX01PRFVMRV9SRUcpXG5leHBvcnQgY29uc3QgaXNOb3JtYWxNb2R1bGUgPSBuYW1lID0+ICEhbmFtZS5tYXRjaChOT1JNQUxfTU9EVUxFX1JFRylcbmV4cG9ydCBjb25zdCBpc05wbU1vZHVsZSA9IG5hbWUgPT4gIWlzV2VleENvbXBvbmVudChuYW1lKSAmJiAhaXNXZWV4TW9kdWxlKG5hbWUpICYmICFpc05vcm1hbE1vZHVsZShuYW1lKVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlV2VleFByZWZpeCAoc3RyKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHN0ci5yZXBsYWNlKFdFRVhfQ09NUE9ORU5UX1JFRywgJycpLnJlcGxhY2UoV0VFWF9NT0RVTEVfUkVHLCAnJylcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlSlNTdXJmaXggKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoSlNfU1VSRklYX1JFRywgJycpXG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuXG5cbmltcG9ydCB7IHJlbW92ZSB9IGZyb20gJy4uL3V0aWwvaW5kZXgnXG5cbmxldCB1aWQgPSAwXG5cbi8qKlxuICogQSBkZXAgaXMgYW4gb2JzZXJ2YWJsZSB0aGF0IGNhbiBoYXZlIG11bHRpcGxlXG4gKiBkaXJlY3RpdmVzIHN1YnNjcmliaW5nIHRvIGl0LlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIERlcCAoKSB7XG4gIHRoaXMuaWQgPSB1aWQrK1xuICB0aGlzLnN1YnMgPSBbXVxufVxuXG4vLyB0aGUgY3VycmVudCB0YXJnZXQgd2F0Y2hlciBiZWluZyBldmFsdWF0ZWQuXG4vLyB0aGlzIGlzIGdsb2JhbGx5IHVuaXF1ZSBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG9ubHkgb25lXG4vLyB3YXRjaGVyIGJlaW5nIGV2YWx1YXRlZCBhdCBhbnkgdGltZS5cbkRlcC50YXJnZXQgPSBudWxsXG5sZXQgdGFyZ2V0U3RhY2sgPSBbXVxuXG5leHBvcnQgZnVuY3Rpb24gcHVzaFRhcmdldCAoX3RhcmdldCkge1xuICBpZiAoRGVwLnRhcmdldCkgdGFyZ2V0U3RhY2sucHVzaChEZXAudGFyZ2V0KVxuICBEZXAudGFyZ2V0ID0gX3RhcmdldFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9wVGFyZ2V0ICgpIHtcbiAgRGVwLnRhcmdldCA9IHRhcmdldFN0YWNrLnBvcCgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldFRhcmdldCAoKSB7XG4gIERlcC50YXJnZXQgPSBudWxsXG4gIHRhcmdldFN0YWNrID0gW11cbn1cblxuLyoqXG4gKiBBZGQgYSBkaXJlY3RpdmUgc3Vic2NyaWJlci5cbiAqXG4gKiBAcGFyYW0ge0RpcmVjdGl2ZX0gc3ViXG4gKi9cblxuRGVwLnByb3RvdHlwZS5hZGRTdWIgPSBmdW5jdGlvbiAoc3ViKSB7XG4gIHRoaXMuc3Vicy5wdXNoKHN1Yilcbn1cblxuLyoqXG4gKiBSZW1vdmUgYSBkaXJlY3RpdmUgc3Vic2NyaWJlci5cbiAqXG4gKiBAcGFyYW0ge0RpcmVjdGl2ZX0gc3ViXG4gKi9cblxuRGVwLnByb3RvdHlwZS5yZW1vdmVTdWIgPSBmdW5jdGlvbiAoc3ViKSB7XG4gIHJlbW92ZSh0aGlzLnN1YnMsIHN1Yilcbn1cblxuLyoqXG4gKiBBZGQgc2VsZiBhcyBhIGRlcGVuZGVuY3kgdG8gdGhlIHRhcmdldCB3YXRjaGVyLlxuICovXG5cbkRlcC5wcm90b3R5cGUuZGVwZW5kID0gZnVuY3Rpb24gKCkge1xuICBpZiAoRGVwLnRhcmdldCkge1xuICAgIERlcC50YXJnZXQuYWRkRGVwKHRoaXMpXG4gIH1cbn1cblxuLyoqXG4gKiBOb3RpZnkgYWxsIHN1YnNjcmliZXJzIG9mIGEgbmV3IHZhbHVlLlxuICovXG5cbkRlcC5wcm90b3R5cGUubm90aWZ5ID0gZnVuY3Rpb24gKCkge1xuICAvLyBzdGFibGl6ZSB0aGUgc3Vic2NyaWJlciBsaXN0IGZpcnN0XG4gIGNvbnN0IHN1YnMgPSB0aGlzLnN1YnMuc2xpY2UoKVxuICBmb3IgKGxldCBpID0gMCwgbCA9IHN1YnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgc3Vic1tpXS51cGRhdGUoKVxuICB9XG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuXG5cbmltcG9ydCBEZXAsIHsgcHVzaFRhcmdldCwgcG9wVGFyZ2V0IH0gZnJvbSAnLi9kZXAnXG4vLyBpbXBvcnQgeyBwdXNoV2F0Y2hlciB9IGZyb20gJy4vYmF0Y2hlcidcbmltcG9ydCB7XG4gIHJlbW92ZSxcbiAgZXh0ZW5kLFxuICBpc09iamVjdCxcbiAgY3JlYXRlTmV3U2V0XG4gIC8vIF9TZXQgYXMgU2V0XG59IGZyb20gJy4uL3V0aWwvaW5kZXgnXG5cbmxldCB1aWQgPSAwXG5cbi8qKlxuICogQSB3YXRjaGVyIHBhcnNlcyBhbiBleHByZXNzaW9uLCBjb2xsZWN0cyBkZXBlbmRlbmNpZXMsXG4gKiBhbmQgZmlyZXMgY2FsbGJhY2sgd2hlbiB0aGUgZXhwcmVzc2lvbiB2YWx1ZSBjaGFuZ2VzLlxuICogVGhpcyBpcyB1c2VkIGZvciBib3RoIHRoZSAkd2F0Y2goKSBhcGkgYW5kIGRpcmVjdGl2ZXMuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gZXhwT3JGblxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2JcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiAgICAgICAgICAgICAgICAgLSB7QXJyYXl9IGZpbHRlcnNcbiAqICAgICAgICAgICAgICAgICAtIHtCb29sZWFufSB0d29XYXlcbiAqICAgICAgICAgICAgICAgICAtIHtCb29sZWFufSBkZWVwXG4gKiAgICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gdXNlclxuICogICAgICAgICAgICAgICAgIC0ge0Jvb2xlYW59IHN5bmNcbiAqICAgICAgICAgICAgICAgICAtIHtCb29sZWFufSBsYXp5XG4gKiAgICAgICAgICAgICAgICAgLSB7RnVuY3Rpb259IFtwcmVQcm9jZXNzXVxuICogICAgICAgICAgICAgICAgIC0ge0Z1bmN0aW9ufSBbcG9zdFByb2Nlc3NdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBXYXRjaGVyICh2bSwgZXhwT3JGbiwgY2IsIG9wdGlvbnMpIHtcbiAgLy8gbWl4IGluIG9wdGlvbnNcbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBleHRlbmQodGhpcywgb3B0aW9ucylcbiAgfVxuICBjb25zdCBpc0ZuID0gdHlwZW9mIGV4cE9yRm4gPT09ICdmdW5jdGlvbidcbiAgdGhpcy52bSA9IHZtXG4gIHZtLl93YXRjaGVycy5wdXNoKHRoaXMpXG4gIHRoaXMuZXhwcmVzc2lvbiA9IGV4cE9yRm5cbiAgdGhpcy5jYiA9IGNiXG4gIHRoaXMuaWQgPSArK3VpZCAvLyB1aWQgZm9yIGJhdGNoaW5nXG4gIHRoaXMuYWN0aXZlID0gdHJ1ZVxuICB0aGlzLmRpcnR5ID0gdGhpcy5sYXp5IC8vIGZvciBsYXp5IHdhdGNoZXJzXG4gIHRoaXMuZGVwcyA9IFtdXG4gIHRoaXMubmV3RGVwcyA9IFtdXG4gIHRoaXMuZGVwSWRzID0gY3JlYXRlTmV3U2V0KCkgLy8gbmV3IFNldCgpXG4gIHRoaXMubmV3RGVwSWRzID0gY3JlYXRlTmV3U2V0KCkgLy8gbmV3IFNldCgpXG4gIC8vIHBhcnNlIGV4cHJlc3Npb24gZm9yIGdldHRlclxuICBpZiAoaXNGbikge1xuICAgIHRoaXMuZ2V0dGVyID0gZXhwT3JGblxuICB9XG4gIHRoaXMudmFsdWUgPSB0aGlzLmxhenlcbiAgICA/IHVuZGVmaW5lZFxuICAgIDogdGhpcy5nZXQoKVxuICAvLyBzdGF0ZSBmb3IgYXZvaWRpbmcgZmFsc2UgdHJpZ2dlcnMgZm9yIGRlZXAgYW5kIEFycmF5XG4gIC8vIHdhdGNoZXJzIGR1cmluZyB2bS5fZGlnZXN0KClcbiAgdGhpcy5xdWV1ZWQgPSB0aGlzLnNoYWxsb3cgPSBmYWxzZVxufVxuXG4vKipcbiAqIEV2YWx1YXRlIHRoZSBnZXR0ZXIsIGFuZCByZS1jb2xsZWN0IGRlcGVuZGVuY2llcy5cbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gIHB1c2hUYXJnZXQodGhpcylcbiAgY29uc3QgdmFsdWUgPSB0aGlzLmdldHRlci5jYWxsKHRoaXMudm0sIHRoaXMudm0pXG4gIC8vIFwidG91Y2hcIiBldmVyeSBwcm9wZXJ0eSBzbyB0aGV5IGFyZSBhbGwgdHJhY2tlZCBhc1xuICAvLyBkZXBlbmRlbmNpZXMgZm9yIGRlZXAgd2F0Y2hpbmdcbiAgaWYgKHRoaXMuZGVlcCkge1xuICAgIHRyYXZlcnNlKHZhbHVlKVxuICB9XG4gIHBvcFRhcmdldCgpXG4gIHRoaXMuY2xlYW51cERlcHMoKVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBBZGQgYSBkZXBlbmRlbmN5IHRvIHRoaXMgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSB7RGVwfSBkZXBcbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS5hZGREZXAgPSBmdW5jdGlvbiAoZGVwKSB7XG4gIGNvbnN0IGlkID0gZGVwLmlkXG4gIGlmICghdGhpcy5uZXdEZXBJZHMuaGFzKGlkKSkge1xuICAgIHRoaXMubmV3RGVwSWRzLmFkZChpZClcbiAgICB0aGlzLm5ld0RlcHMucHVzaChkZXApXG4gICAgaWYgKCF0aGlzLmRlcElkcy5oYXMoaWQpKSB7XG4gICAgICBkZXAuYWRkU3ViKHRoaXMpXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2xlYW4gdXAgZm9yIGRlcGVuZGVuY3kgY29sbGVjdGlvbi5cbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS5jbGVhbnVwRGVwcyA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IGkgPSB0aGlzLmRlcHMubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICBjb25zdCBkZXAgPSB0aGlzLmRlcHNbaV1cbiAgICBpZiAoIXRoaXMubmV3RGVwSWRzLmhhcyhkZXAuaWQpKSB7XG4gICAgICBkZXAucmVtb3ZlU3ViKHRoaXMpXG4gICAgfVxuICB9XG4gIGxldCB0bXAgPSB0aGlzLmRlcElkc1xuICB0aGlzLmRlcElkcyA9IHRoaXMubmV3RGVwSWRzXG4gIHRoaXMubmV3RGVwSWRzID0gdG1wXG4gIHRoaXMubmV3RGVwSWRzLmNsZWFyKClcbiAgdG1wID0gdGhpcy5kZXBzXG4gIHRoaXMuZGVwcyA9IHRoaXMubmV3RGVwc1xuICB0aGlzLm5ld0RlcHMgPSB0bXBcbiAgdGhpcy5uZXdEZXBzLmxlbmd0aCA9IDBcbn1cblxuLyoqXG4gKiBTdWJzY3JpYmVyIGludGVyZmFjZS5cbiAqIFdpbGwgYmUgY2FsbGVkIHdoZW4gYSBkZXBlbmRlbmN5IGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIHtCb29sZWFufSBzaGFsbG93XG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKHNoYWxsb3cpIHtcbiAgaWYgKHRoaXMubGF6eSkge1xuICAgIHRoaXMuZGlydHkgPSB0cnVlXG4gIH0gZWxzZSB7XG4gICAgdGhpcy5ydW4oKVxuICB9XG4gIC8vIH0gZWxzZSBpZiAodGhpcy5zeW5jKSB7XG4gIC8vICAgdGhpcy5ydW4oKVxuICAvLyB9IGVsc2Uge1xuICAvLyAgIC8vIGlmIHF1ZXVlZCwgb25seSBvdmVyd3JpdGUgc2hhbGxvdyB3aXRoIG5vbi1zaGFsbG93LFxuICAvLyAgIC8vIGJ1dCBub3QgdGhlIG90aGVyIHdheSBhcm91bmQuXG4gIC8vICAgdGhpcy5zaGFsbG93ID0gdGhpcy5xdWV1ZWRcbiAgLy8gICAgID8gc2hhbGxvd1xuICAvLyAgICAgICA/IHRoaXMuc2hhbGxvd1xuICAvLyAgICAgICA6IGZhbHNlXG4gIC8vICAgICA6ICEhc2hhbGxvd1xuICAvLyAgIHRoaXMucXVldWVkID0gdHJ1ZVxuICAvLyAgIHB1c2hXYXRjaGVyKHRoaXMpXG4gIC8vIH1cbn1cblxuLyoqXG4gKiBCYXRjaGVyIGpvYiBpbnRlcmZhY2UuXG4gKiBXaWxsIGJlIGNhbGxlZCBieSB0aGUgYmF0Y2hlci5cbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5nZXQoKVxuICAgIGlmIChcbiAgICAgIHZhbHVlICE9PSB0aGlzLnZhbHVlIHx8XG4gICAgICAvLyBEZWVwIHdhdGNoZXJzIGFuZCB3YXRjaGVycyBvbiBPYmplY3QvQXJyYXlzIHNob3VsZCBmaXJlIGV2ZW5cbiAgICAgIC8vIHdoZW4gdGhlIHZhbHVlIGlzIHRoZSBzYW1lLCBiZWNhdXNlIHRoZSB2YWx1ZSBtYXlcbiAgICAgIC8vIGhhdmUgbXV0YXRlZDsgYnV0IG9ubHkgZG8gc28gaWYgdGhpcyBpcyBhXG4gICAgICAvLyBub24tc2hhbGxvdyB1cGRhdGUgKGNhdXNlZCBieSBhIHZtIGRpZ2VzdCkuXG4gICAgICAoKGlzT2JqZWN0KHZhbHVlKSB8fCB0aGlzLmRlZXApICYmICF0aGlzLnNoYWxsb3cpXG4gICAgKSB7XG4gICAgICAvLyBzZXQgbmV3IHZhbHVlXG4gICAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXMudmFsdWVcbiAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgICAgdGhpcy5jYi5jYWxsKHRoaXMudm0sIHZhbHVlLCBvbGRWYWx1ZSlcbiAgICB9XG4gICAgdGhpcy5xdWV1ZWQgPSB0aGlzLnNoYWxsb3cgPSBmYWxzZVxuICB9XG59XG5cbi8qKlxuICogRXZhbHVhdGUgdGhlIHZhbHVlIG9mIHRoZSB3YXRjaGVyLlxuICogVGhpcyBvbmx5IGdldHMgY2FsbGVkIGZvciBsYXp5IHdhdGNoZXJzLlxuICovXG5cbldhdGNoZXIucHJvdG90eXBlLmV2YWx1YXRlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnZhbHVlID0gdGhpcy5nZXQoKVxuICB0aGlzLmRpcnR5ID0gZmFsc2Vcbn1cblxuLyoqXG4gKiBEZXBlbmQgb24gYWxsIGRlcHMgY29sbGVjdGVkIGJ5IHRoaXMgd2F0Y2hlci5cbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS5kZXBlbmQgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBpID0gdGhpcy5kZXBzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgdGhpcy5kZXBzW2ldLmRlcGVuZCgpXG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmUgc2VsZiBmcm9tIGFsbCBkZXBlbmRlbmNpZXMnIHN1YmNyaWJlciBsaXN0LlxuICovXG5cbldhdGNoZXIucHJvdG90eXBlLnRlYXJkb3duID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAvLyByZW1vdmUgc2VsZiBmcm9tIHZtJ3Mgd2F0Y2hlciBsaXN0XG4gICAgLy8gdGhpcyBpcyBhIHNvbWV3aGF0IGV4cGVuc2l2ZSBvcGVyYXRpb24gc28gd2Ugc2tpcCBpdFxuICAgIC8vIGlmIHRoZSB2bSBpcyBiZWluZyBkZXN0cm95ZWQgb3IgaXMgcGVyZm9ybWluZyBhIHYtZm9yXG4gICAgLy8gcmUtcmVuZGVyICh0aGUgd2F0Y2hlciBsaXN0IGlzIHRoZW4gZmlsdGVyZWQgYnkgdi1mb3IpLlxuICAgIGlmICghdGhpcy52bS5faXNCZWluZ0Rlc3Ryb3llZCAmJiAhdGhpcy52bS5fdkZvclJlbW92aW5nKSB7XG4gICAgICByZW1vdmUodGhpcy52bS5fd2F0Y2hlcnMsIHRoaXMpXG4gICAgfVxuICAgIGxldCBpID0gdGhpcy5kZXBzLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHRoaXMuZGVwc1tpXS5yZW1vdmVTdWIodGhpcylcbiAgICB9XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxuICAgIHRoaXMudm0gPSB0aGlzLmNiID0gdGhpcy52YWx1ZSA9IG51bGxcbiAgfVxufVxuXG4vKipcbiAqIFJlY3J1c2l2ZWx5IHRyYXZlcnNlIGFuIG9iamVjdCB0byBldm9rZSBhbGwgY29udmVydGVkXG4gKiBnZXR0ZXJzLCBzbyB0aGF0IGV2ZXJ5IG5lc3RlZCBwcm9wZXJ0eSBpbnNpZGUgdGhlIG9iamVjdFxuICogaXMgY29sbGVjdGVkIGFzIGEgXCJkZWVwXCIgZGVwZW5kZW5jeS5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbFxuICogQHBhcmFtIHtTZXR9IHNlZW5cbiAqL1xuXG5jb25zdCBzZWVuT2JqZWN0cyA9IGNyZWF0ZU5ld1NldCgpIC8vIG5ldyBTZXQoKVxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIHRyYXZlcnNlICh2YWwsIHNlZW4pIHtcbiAgbGV0IGksIGtleXMsIGlzQSwgaXNPXG4gIGlmICghc2Vlbikge1xuICAgIHNlZW4gPSBzZWVuT2JqZWN0c1xuICAgIHNlZW4uY2xlYXIoKVxuICB9XG4gIGlzQSA9IEFycmF5LmlzQXJyYXkodmFsKVxuICBpc08gPSBpc09iamVjdCh2YWwpXG4gIGlmIChpc0EgfHwgaXNPKSB7XG4gICAgaWYgKHZhbC5fX29iX18pIHtcbiAgICAgIGNvbnN0IGRlcElkID0gdmFsLl9fb2JfXy5kZXAuaWRcbiAgICAgIGlmIChzZWVuLmhhcyhkZXBJZCkpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWVuLmFkZChkZXBJZClcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzQSkge1xuICAgICAgaSA9IHZhbC5sZW5ndGhcbiAgICAgIHdoaWxlIChpLS0pIHRyYXZlcnNlKHZhbFtpXSwgc2VlbilcbiAgICB9IGVsc2UgaWYgKGlzTykge1xuICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHZhbClcbiAgICAgIGkgPSBrZXlzLmxlbmd0aFxuICAgICAgd2hpbGUgKGktLSkgdHJhdmVyc2UodmFsW2tleXNbaV1dLCBzZWVuKVxuICAgIH1cbiAgfVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgKi9cblxuXG5pbXBvcnQgeyBkZWYgfSBmcm9tICcuLi91dGlsL2luZGV4J1xuXG5jb25zdCBhcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlXG5leHBvcnQgY29uc3QgYXJyYXlNZXRob2RzID0gT2JqZWN0LmNyZWF0ZShhcnJheVByb3RvKVxuXG4vKipcbiAqIEludGVyY2VwdCBtdXRhdGluZyBtZXRob2RzIGFuZCBlbWl0IGV2ZW50c1xuICovXG5cbjtbXG4gICdwdXNoJyxcbiAgJ3BvcCcsXG4gICdzaGlmdCcsXG4gICd1bnNoaWZ0JyxcbiAgJ3NwbGljZScsXG4gICdzb3J0JyxcbiAgJ3JldmVyc2UnXG5dXG4uZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gIC8vIGNhY2hlIG9yaWdpbmFsIG1ldGhvZFxuICBjb25zdCBvcmlnaW5hbCA9IGFycmF5UHJvdG9bbWV0aG9kXVxuICBkZWYoYXJyYXlNZXRob2RzLCBtZXRob2QsIGZ1bmN0aW9uIG11dGF0b3IgKCkge1xuICAgIC8vIGF2b2lkIGxlYWtpbmcgYXJndW1lbnRzOlxuICAgIC8vIGh0dHA6Ly9qc3BlcmYuY29tL2Nsb3N1cmUtd2l0aC1hcmd1bWVudHNcbiAgICBsZXQgaSA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICBjb25zdCBhcmdzID0gbmV3IEFycmF5KGkpXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXVxuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmdzKVxuICAgIGNvbnN0IG9iID0gdGhpcy5fX29iX19cbiAgICBsZXQgaW5zZXJ0ZWRcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgY2FzZSAncHVzaCc6XG4gICAgICAgIGluc2VydGVkID0gYXJnc1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAndW5zaGlmdCc6XG4gICAgICAgIGluc2VydGVkID0gYXJnc1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnc3BsaWNlJzpcbiAgICAgICAgaW5zZXJ0ZWQgPSBhcmdzLnNsaWNlKDIpXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICAgIGlmIChpbnNlcnRlZCkgb2Iub2JzZXJ2ZUFycmF5KGluc2VydGVkKVxuICAgIC8vIG5vdGlmeSBjaGFuZ2VcbiAgICBvYi5kZXAubm90aWZ5KClcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0pXG59KVxuXG4vKipcbiAqIFN3YXAgdGhlIGVsZW1lbnQgYXQgdGhlIGdpdmVuIGluZGV4IHdpdGggYSBuZXcgdmFsdWVcbiAqIGFuZCBlbWl0cyBjb3JyZXNwb25kaW5nIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEByZXR1cm4geyp9IC0gcmVwbGFjZWQgZWxlbWVudFxuICovXG5cbmRlZihcbiAgYXJyYXlQcm90byxcbiAgJyRzZXQnLFxuICBmdW5jdGlvbiAkc2V0IChpbmRleCwgdmFsKSB7XG4gICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBcIkFycmF5LnByb3RvdHlwZS4kc2V0XCIgaXMgbm90IGEgc3RhbmRhcmQgQVBJLGBcbiAgICAgICsgYCBpdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgdmVyc2lvbi5gKVxuICAgIGlmIChpbmRleCA+PSB0aGlzLmxlbmd0aCkge1xuICAgICAgdGhpcy5sZW5ndGggPSBpbmRleCArIDFcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc3BsaWNlKGluZGV4LCAxLCB2YWwpWzBdXG4gIH1cbilcblxuLyoqXG4gKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gcmVtb3ZlIHRoZSBlbGVtZW50IGF0IGdpdmVuIGluZGV4LlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBpbmRleFxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5kZWYoXG4gIGFycmF5UHJvdG8sXG4gICckcmVtb3ZlJyxcbiAgZnVuY3Rpb24gJHJlbW92ZSAoaW5kZXgpIHtcbiAgICBjb25zb2xlLndhcm4oYFtKUyBGcmFtZXdvcmtdIFwiQXJyYXkucHJvdG90eXBlLiRyZW1vdmVcIiBpcyBub3QgYSBzdGFuZGFyZCBBUEksYFxuICAgICAgKyBgIGl0IHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCB2ZXJzaW9uLmApXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCF0aGlzLmxlbmd0aCkgcmV0dXJuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICBpZiAodHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJykge1xuICAgICAgaW5kZXggPSB0aGlzLmluZGV4T2YoaW5kZXgpXG4gICAgfVxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuc3BsaWNlKGluZGV4LCAxKVxuICAgIH1cbiAgfVxuKVxuIiwiLyogZXNsaW50LWRpc2FibGUgKi9cblxuXG5pbXBvcnQgRGVwIGZyb20gJy4vZGVwJ1xuaW1wb3J0IHsgYXJyYXlNZXRob2RzIH0gZnJvbSAnLi9hcnJheSdcbmltcG9ydCB7XG4gIGRlZixcbiAgcmVtb3ZlLFxuICBpc09iamVjdCxcbiAgaXNQbGFpbk9iamVjdCxcbiAgaGFzUHJvdG8sXG4gIGhhc093bixcbiAgaXNSZXNlcnZlZFxufSBmcm9tICcuLi91dGlsL2luZGV4J1xuXG5jb25zdCBhcnJheUtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhhcnJheU1ldGhvZHMpXG5cbi8qKlxuICogT2JzZXJ2ZXIgY2xhc3MgdGhhdCBhcmUgYXR0YWNoZWQgdG8gZWFjaCBvYnNlcnZlZFxuICogb2JqZWN0LiBPbmNlIGF0dGFjaGVkLCB0aGUgb2JzZXJ2ZXIgY29udmVydHMgdGFyZ2V0XG4gKiBvYmplY3QncyBwcm9wZXJ0eSBrZXlzIGludG8gZ2V0dGVyL3NldHRlcnMgdGhhdFxuICogY29sbGVjdCBkZXBlbmRlbmNpZXMgYW5kIGRpc3BhdGNoZXMgdXBkYXRlcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gdmFsdWVcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBPYnNlcnZlciAodmFsdWUpIHtcbiAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gIHRoaXMuZGVwID0gbmV3IERlcCgpXG4gIGRlZih2YWx1ZSwgJ19fb2JfXycsIHRoaXMpXG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIGNvbnN0IGF1Z21lbnQgPSBoYXNQcm90b1xuICAgICAgPyBwcm90b0F1Z21lbnRcbiAgICAgIDogY29weUF1Z21lbnRcbiAgICBhdWdtZW50KHZhbHVlLCBhcnJheU1ldGhvZHMsIGFycmF5S2V5cylcbiAgICB0aGlzLm9ic2VydmVBcnJheSh2YWx1ZSlcbiAgfSBlbHNlIHtcbiAgICB0aGlzLndhbGsodmFsdWUpXG4gIH1cbn1cblxuLy8gSW5zdGFuY2UgbWV0aG9kc1xuXG4vKipcbiAqIFdhbGsgdGhyb3VnaCBlYWNoIHByb3BlcnR5IGFuZCBjb252ZXJ0IHRoZW0gaW50b1xuICogZ2V0dGVyL3NldHRlcnMuIFRoaXMgbWV0aG9kIHNob3VsZCBvbmx5IGJlIGNhbGxlZCB3aGVuXG4gKiB2YWx1ZSB0eXBlIGlzIE9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKi9cblxuT2JzZXJ2ZXIucHJvdG90eXBlLndhbGsgPSBmdW5jdGlvbiAob2JqKSB7XG4gIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICB0aGlzLmNvbnZlcnQoa2V5LCBvYmpba2V5XSlcbiAgfVxufVxuXG4vKipcbiAqIE9ic2VydmUgYSBsaXN0IG9mIEFycmF5IGl0ZW1zLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGl0ZW1zXG4gKi9cblxuT2JzZXJ2ZXIucHJvdG90eXBlLm9ic2VydmVBcnJheSA9IGZ1bmN0aW9uIChpdGVtcykge1xuICBmb3IgKGxldCBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIG9ic2VydmUoaXRlbXNbaV0pXG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgcHJvcGVydHkgaW50byBnZXR0ZXIvc2V0dGVyIHNvIHdlIGNhbiBlbWl0XG4gKiB0aGUgZXZlbnRzIHdoZW4gdGhlIHByb3BlcnR5IGlzIGFjY2Vzc2VkL2NoYW5nZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5PYnNlcnZlci5wcm90b3R5cGUuY29udmVydCA9IGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICBkZWZpbmVSZWFjdGl2ZSh0aGlzLnZhbHVlLCBrZXksIHZhbClcbn1cblxuLyoqXG4gKiBBZGQgYW4gb3duZXIgdm0sIHNvIHRoYXQgd2hlbiAkc2V0LyRkZWxldGUgbXV0YXRpb25zXG4gKiBoYXBwZW4gd2UgY2FuIG5vdGlmeSBvd25lciB2bXMgdG8gcHJveHkgdGhlIGtleXMgYW5kXG4gKiBkaWdlc3QgdGhlIHdhdGNoZXJzLiBUaGlzIGlzIG9ubHkgY2FsbGVkIHdoZW4gdGhlIG9iamVjdFxuICogaXMgb2JzZXJ2ZWQgYXMgYW4gaW5zdGFuY2UncyByb290ICRkYXRhLlxuICpcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICovXG5cbk9ic2VydmVyLnByb3RvdHlwZS5hZGRWbSA9IGZ1bmN0aW9uICh2bSkge1xuICAodGhpcy52bXMgfHwgKHRoaXMudm1zID0gW10pKS5wdXNoKHZtKVxufVxuXG4vKipcbiAqIFJlbW92ZSBhbiBvd25lciB2bS4gVGhpcyBpcyBjYWxsZWQgd2hlbiB0aGUgb2JqZWN0IGlzXG4gKiBzd2FwcGVkIG91dCBhcyBhbiBpbnN0YW5jZSdzICRkYXRhIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqL1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuT2JzZXJ2ZXIucHJvdG90eXBlLnJlbW92ZVZtID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJlbW92ZSh0aGlzLnZtcywgdm0pXG59XG5cbi8vIGhlbHBlcnNcblxuLyoqXG4gKiBBdWdtZW50IGFuIHRhcmdldCBPYmplY3Qgb3IgQXJyYXkgYnkgaW50ZXJjZXB0aW5nXG4gKiB0aGUgcHJvdG90eXBlIGNoYWluIHVzaW5nIF9fcHJvdG9fX1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAqL1xuXG5mdW5jdGlvbiBwcm90b0F1Z21lbnQgKHRhcmdldCwgc3JjKSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG4gIHRhcmdldC5fX3Byb3RvX18gPSBzcmNcbiAgLyogZXNsaW50LWVuYWJsZSBuby1wcm90byAqL1xufVxuXG4vKipcbiAqIEF1Z21lbnQgYW4gdGFyZ2V0IE9iamVjdCBvciBBcnJheSBieSBkZWZpbmluZ1xuICogaGlkZGVuIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IHRhcmdldFxuICogQHBhcmFtIHtPYmplY3R9IHByb3RvXG4gKi9cblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIGNvcHlBdWdtZW50ICh0YXJnZXQsIHNyYywga2V5cykge1xuICBmb3IgKGxldCBpID0gMCwgbCA9IGtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0ga2V5c1tpXVxuICAgIGRlZih0YXJnZXQsIGtleSwgc3JjW2tleV0pXG4gIH1cbn1cblxuLyoqXG4gKiBBdHRlbXB0IHRvIGNyZWF0ZSBhbiBvYnNlcnZlciBpbnN0YW5jZSBmb3IgYSB2YWx1ZSxcbiAqIHJldHVybnMgdGhlIG5ldyBvYnNlcnZlciBpZiBzdWNjZXNzZnVsbHkgb2JzZXJ2ZWQsXG4gKiBvciB0aGUgZXhpc3Rpbmcgb2JzZXJ2ZXIgaWYgdGhlIHZhbHVlIGFscmVhZHkgaGFzIG9uZS5cbiAqXG4gKiBAcGFyYW0geyp9IHZhbHVlXG4gKiBAcGFyYW0ge1Z1ZX0gW3ZtXVxuICogQHJldHVybiB7T2JzZXJ2ZXJ8dW5kZWZpbmVkfVxuICogQHN0YXRpY1xuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBvYnNlcnZlICh2YWx1ZSwgdm0pIHtcbiAgaWYgKCFpc09iamVjdCh2YWx1ZSkpIHtcbiAgICByZXR1cm5cbiAgfVxuICBsZXQgb2JcbiAgaWYgKGhhc093bih2YWx1ZSwgJ19fb2JfXycpICYmIHZhbHVlLl9fb2JfXyBpbnN0YW5jZW9mIE9ic2VydmVyKSB7XG4gICAgb2IgPSB2YWx1ZS5fX29iX19cbiAgfSBlbHNlIGlmIChcbiAgICAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgaXNQbGFpbk9iamVjdCh2YWx1ZSkpICYmXG4gICAgT2JqZWN0LmlzRXh0ZW5zaWJsZSh2YWx1ZSkgJiZcbiAgICAhdmFsdWUuX2lzVnVlXG4gICkge1xuICAgIG9iID0gbmV3IE9ic2VydmVyKHZhbHVlKVxuICB9XG4gIGlmIChvYiAmJiB2bSkge1xuICAgIG9iLmFkZFZtKHZtKVxuICB9XG4gIHJldHVybiBvYlxufVxuXG4vKipcbiAqIERlZmluZSBhIHJlYWN0aXZlIHByb3BlcnR5IG9uIGFuIE9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0geyp9IHZhbFxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmVSZWFjdGl2ZSAob2JqLCBrZXksIHZhbCkge1xuICBjb25zdCBkZXAgPSBuZXcgRGVwKClcblxuICBjb25zdCBwcm9wZXJ0eSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpXG4gIGlmIChwcm9wZXJ0eSAmJiBwcm9wZXJ0eS5jb25maWd1cmFibGUgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBjYXRlciBmb3IgcHJlLWRlZmluZWQgZ2V0dGVyL3NldHRlcnNcbiAgY29uc3QgZ2V0dGVyID0gcHJvcGVydHkgJiYgcHJvcGVydHkuZ2V0XG4gIGNvbnN0IHNldHRlciA9IHByb3BlcnR5ICYmIHByb3BlcnR5LnNldFxuXG4gIGxldCBjaGlsZE9iID0gb2JzZXJ2ZSh2YWwpXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gcmVhY3RpdmVHZXR0ZXIgKCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXR0ZXIgPyBnZXR0ZXIuY2FsbChvYmopIDogdmFsXG4gICAgICBpZiAoRGVwLnRhcmdldCkge1xuICAgICAgICBkZXAuZGVwZW5kKClcbiAgICAgICAgaWYgKGNoaWxkT2IpIHtcbiAgICAgICAgICBjaGlsZE9iLmRlcC5kZXBlbmQoKVxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIGZvciAobGV0IGUsIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBlID0gdmFsdWVbaV1cbiAgICAgICAgICAgIGUgJiYgZS5fX29iX18gJiYgZS5fX29iX18uZGVwLmRlcGVuZCgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gcmVhY3RpdmVTZXR0ZXIgKG5ld1ZhbCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXR0ZXIgPyBnZXR0ZXIuY2FsbChvYmopIDogdmFsXG4gICAgICBpZiAobmV3VmFsID09PSB2YWx1ZSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmIChzZXR0ZXIpIHtcbiAgICAgICAgc2V0dGVyLmNhbGwob2JqLCBuZXdWYWwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWwgPSBuZXdWYWxcbiAgICAgIH1cbiAgICAgIGNoaWxkT2IgPSBvYnNlcnZlKG5ld1ZhbClcbiAgICAgIGRlcC5ub3RpZnkoKVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBTZXQgYSBwcm9wZXJ0eSBvbiBhbiBvYmplY3QuIEFkZHMgdGhlIG5ldyBwcm9wZXJ0eSBhbmRcbiAqIHRyaWdnZXJzIGNoYW5nZSBub3RpZmljYXRpb24gaWYgdGhlIHByb3BlcnR5IGRvZXNuJ3RcbiAqIGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEBwdWJsaWNcbiAqL1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldCAob2JqLCBrZXksIHZhbCkge1xuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgcmV0dXJuIG9iai5zcGxpY2Uoa2V5LCAxLCB2YWwpXG4gIH1cbiAgaWYgKGhhc093bihvYmosIGtleSkpIHtcbiAgICBvYmpba2V5XSA9IHZhbFxuICAgIHJldHVyblxuICB9XG4gIGlmIChvYmouX2lzVnVlKSB7XG4gICAgc2V0KG9iai5fZGF0YSwga2V5LCB2YWwpXG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3Qgb2IgPSBvYmouX19vYl9fXG4gIGlmICghb2IpIHtcbiAgICBvYmpba2V5XSA9IHZhbFxuICAgIHJldHVyblxuICB9XG4gIG9iLmNvbnZlcnQoa2V5LCB2YWwpXG4gIG9iLmRlcC5ub3RpZnkoKVxuICBpZiAob2Iudm1zKSB7XG4gICAgbGV0IGkgPSBvYi52bXMubGVuZ3RoXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3Qgdm0gPSBvYi52bXNbaV1cbiAgICAgIHByb3h5KHZtLCBrZXkpXG4gICAgICAvLyB2bS4kZm9yY2VVcGRhdGUoKVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsXG59XG5cbi8qKlxuICogRGVsZXRlIGEgcHJvcGVydHkgYW5kIHRyaWdnZXIgY2hhbmdlIGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKi9cblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWwgKG9iaiwga2V5KSB7XG4gIGlmICghaGFzT3duKG9iaiwga2V5KSkge1xuICAgIHJldHVyblxuICB9XG4gIGRlbGV0ZSBvYmpba2V5XVxuICBjb25zdCBvYiA9IG9iai5fX29iX19cblxuICBpZiAoIW9iKSB7XG4gICAgaWYgKG9iai5faXNWdWUpIHtcbiAgICAgIGRlbGV0ZSBvYmouX2RhdGFba2V5XVxuICAgICAgLy8gb2JqLiRmb3JjZVVwZGF0ZSgpXG4gICAgfVxuICAgIHJldHVyblxuICB9XG4gIG9iLmRlcC5ub3RpZnkoKVxuICBpZiAob2Iudm1zKSB7XG4gICAgbGV0IGkgPSBvYi52bXMubGVuZ3RoXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgY29uc3Qgdm0gPSBvYi52bXNbaV1cbiAgICAgIHVucHJveHkodm0sIGtleSlcbiAgICAgIC8vIHZtLiRmb3JjZVVwZGF0ZSgpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IEtFWV9XT1JEUyA9IFsnJGluZGV4JywgJyR2YWx1ZScsICckZXZlbnQnXVxuZXhwb3J0IGZ1bmN0aW9uIHByb3h5ICh2bSwga2V5KSB7XG4gIGlmIChLRVlfV09SRFMuaW5kZXhPZihrZXkpID4gLTEgfHwgIWlzUmVzZXJ2ZWQoa2V5KSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bSwga2V5LCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbiBwcm94eUdldHRlciAoKSB7XG4gICAgICAgIHJldHVybiB2bS5fZGF0YVtrZXldXG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbiBwcm94eVNldHRlciAodmFsKSB7XG4gICAgICAgIHZtLl9kYXRhW2tleV0gPSB2YWxcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5leHBvcnQgZnVuY3Rpb24gdW5wcm94eSAodm0sIGtleSkge1xuICBpZiAoIWlzUmVzZXJ2ZWQoa2V5KSkge1xuICAgIGRlbGV0ZSB2bVtrZXldXG4gIH1cbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlICovXG5cblxuaW1wb3J0IFdhdGNoZXIgZnJvbSAnLi93YXRjaGVyJ1xuaW1wb3J0IERlcCBmcm9tICcuL2RlcCdcbmltcG9ydCB7XG4gIG9ic2VydmUsXG4gIHByb3h5LFxuICB1bnByb3h5XG59IGZyb20gJy4vb2JzZXJ2ZXInXG5pbXBvcnQge1xuICBpc1BsYWluT2JqZWN0LFxuICBiaW5kXG59IGZyb20gJy4uL3V0aWwvaW5kZXgnXG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0U3RhdGUgKHZtKSB7XG4gIHZtLl93YXRjaGVycyA9IFtdXG4gIGluaXREYXRhKHZtKVxuICBpbml0Q29tcHV0ZWQodm0pXG4gIGluaXRNZXRob2RzKHZtKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdERhdGEgKHZtKSB7XG4gIGxldCBkYXRhID0gdm0uX2RhdGFcblxuICBpZiAoIWlzUGxhaW5PYmplY3QoZGF0YSkpIHtcbiAgICBkYXRhID0ge31cbiAgfVxuICAvLyBwcm94eSBkYXRhIG9uIGluc3RhbmNlXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhkYXRhKVxuICBsZXQgaSA9IGtleXMubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICBwcm94eSh2bSwga2V5c1tpXSlcbiAgfVxuICAvLyBvYnNlcnZlIGRhdGFcbiAgb2JzZXJ2ZShkYXRhLCB2bSlcbn1cblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIG5vb3AgKCkge1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdENvbXB1dGVkICh2bSkge1xuICBjb25zdCBjb21wdXRlZCA9IHZtLl9jb21wdXRlZFxuICBpZiAoY29tcHV0ZWQpIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gY29tcHV0ZWQpIHtcbiAgICAgIGNvbnN0IHVzZXJEZWYgPSBjb21wdXRlZFtrZXldXG4gICAgICBjb25zdCBkZWYgPSB7XG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB1c2VyRGVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGRlZi5nZXQgPSBtYWtlQ29tcHV0ZWRHZXR0ZXIodXNlckRlZiwgdm0pXG4gICAgICAgIGRlZi5zZXQgPSBub29wXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWYuZ2V0ID0gdXNlckRlZi5nZXRcbiAgICAgICAgICA/IHVzZXJEZWYuY2FjaGUgIT09IGZhbHNlXG4gICAgICAgICAgICA/IG1ha2VDb21wdXRlZEdldHRlcih1c2VyRGVmLmdldCwgdm0pXG4gICAgICAgICAgICA6IGJpbmQodXNlckRlZi5nZXQsIHZtKVxuICAgICAgICAgIDogbm9vcFxuICAgICAgICBkZWYuc2V0ID0gdXNlckRlZi5zZXRcbiAgICAgICAgICA/IGJpbmQodXNlckRlZi5zZXQsIHZtKVxuICAgICAgICAgIDogbm9vcFxuICAgICAgfVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZtLCBrZXksIGRlZilcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZUNvbXB1dGVkR2V0dGVyIChnZXR0ZXIsIG93bmVyKSB7XG4gIGNvbnN0IHdhdGNoZXIgPSBuZXcgV2F0Y2hlcihvd25lciwgZ2V0dGVyLCBudWxsLCB7XG4gICAgbGF6eTogdHJ1ZVxuICB9KVxuICByZXR1cm4gZnVuY3Rpb24gY29tcHV0ZWRHZXR0ZXIgKCkge1xuICAgIGlmICh3YXRjaGVyLmRpcnR5KSB7XG4gICAgICB3YXRjaGVyLmV2YWx1YXRlKClcbiAgICB9XG4gICAgaWYgKERlcC50YXJnZXQpIHtcbiAgICAgIHdhdGNoZXIuZGVwZW5kKClcbiAgICB9XG4gICAgcmV0dXJuIHdhdGNoZXIudmFsdWVcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdE1ldGhvZHMgKHZtKSB7XG4gIGNvbnN0IG1ldGhvZHMgPSB2bS5fbWV0aG9kc1xuICBpZiAobWV0aG9kcykge1xuICAgIGZvciAobGV0IGtleSBpbiBtZXRob2RzKSB7XG4gICAgICB2bVtrZXldID0gbWV0aG9kc1trZXldXG4gICAgfVxuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8vIEB0b2RvOiBJdCBzaG91bGQgYmUgcmVnaXN0ZXJlZCBieSBuYXRpdmUgZnJvbSBgcmVnaXN0ZXJDb21wb25lbnRzKClgLlxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG5hdGl2ZUNvbXBvbmVudE1hcDoge1xuICAgIHRleHQ6IHRydWUsXG4gICAgaW1hZ2U6IHRydWUsXG4gICAgY29udGFpbmVyOiB0cnVlLFxuICAgIHNsaWRlcjoge1xuICAgICAgdHlwZTogJ3NsaWRlcicsXG4gICAgICBhcHBlbmQ6ICd0cmVlJ1xuICAgIH0sXG4gICAgY2VsbDoge1xuICAgICAgdHlwZTogJ2NlbGwnLFxuICAgICAgYXBwZW5kOiAndHJlZSdcbiAgICB9XG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBEaXJlY3RpdmUgUGFyc2VyXG4gKi9cblxuaW1wb3J0IHsgYmluZCwgdHlwb2YgfSBmcm9tICcuLi91dGlsL2luZGV4J1xuaW1wb3J0IFdhdGNoZXIgZnJvbSAnLi4vY29yZS93YXRjaGVyJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnXG5cbmNvbnN0IHsgbmF0aXZlQ29tcG9uZW50TWFwIH0gPSBjb25maWdcblxuY29uc3QgU0VUVEVSUyA9IHtcbiAgYXR0cjogJ3NldEF0dHInLFxuICBzdHlsZTogJ3NldFN0eWxlJyxcbiAgZXZlbnQ6ICdhZGRFdmVudCdcbn1cblxuLyoqXG4gKiBhcHBseSB0aGUgbmF0aXZlIGNvbXBvbmVudCdzIG9wdGlvbnMoc3BlY2lmaWVkIGJ5IHRlbXBsYXRlLnR5cGUpXG4gKiB0byB0aGUgdGVtcGxhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5TmFpdHZlQ29tcG9uZW50T3B0aW9ucyAodGVtcGxhdGUpIHtcbiAgY29uc3QgeyB0eXBlIH0gPSB0ZW1wbGF0ZVxuICBjb25zdCBvcHRpb25zID0gbmF0aXZlQ29tcG9uZW50TWFwW3R5cGVdXG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgIGlmICh0ZW1wbGF0ZVtrZXldID09IG51bGwpIHtcbiAgICAgICAgdGVtcGxhdGVba2V5XSA9IG9wdGlvbnNba2V5XVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHlwb2YodGVtcGxhdGVba2V5XSkgPT09ICdvYmplY3QnICYmXG4gICAgICAgIHR5cG9mKG9wdGlvbnNba2V5XSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc3Via2V5IGluIG9wdGlvbnNba2V5XSkge1xuICAgICAgICAgIGlmICh0ZW1wbGF0ZVtrZXldW3N1YmtleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgdGVtcGxhdGVba2V5XVtzdWJrZXldID0gb3B0aW9uc1trZXldW3N1YmtleV1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBiaW5kIGFsbCBpZCwgYXR0ciwgY2xhc3NuYW1lcywgc3R5bGUsIGV2ZW50cyB0byBhbiBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kRWxlbWVudCAodm0sIGVsLCB0ZW1wbGF0ZSkge1xuICBzZXRJZCh2bSwgZWwsIHRlbXBsYXRlLmlkLCB2bSlcbiAgc2V0QXR0cih2bSwgZWwsIHRlbXBsYXRlLmF0dHIpXG4gIHNldENsYXNzKHZtLCBlbCwgdGVtcGxhdGUuY2xhc3NMaXN0KVxuICBzZXRTdHlsZSh2bSwgZWwsIHRlbXBsYXRlLnN0eWxlKVxuICBiaW5kRXZlbnRzKHZtLCBlbCwgdGVtcGxhdGUuZXZlbnRzKVxufVxuXG4vKipcbiAqIGJpbmQgYWxsIHByb3BzIHRvIHN1YiB2bSBhbmQgYmluZCBhbGwgc3R5bGUsIGV2ZW50cyB0byB0aGUgcm9vdCBlbGVtZW50XG4gKiBvZiB0aGUgc3ViIHZtIGlmIGl0IGRvZXNuJ3QgaGF2ZSBhIHJlcGxhY2VkIG11bHRpLW5vZGUgZnJhZ21lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRTdWJWbSAodm0sIHN1YlZtLCB0ZW1wbGF0ZSwgcmVwZWF0SXRlbSkge1xuICBzdWJWbSA9IHN1YlZtIHx8IHt9XG4gIHRlbXBsYXRlID0gdGVtcGxhdGUgfHwge31cblxuICBjb25zdCBvcHRpb25zID0gc3ViVm0uX29wdGlvbnMgfHwge31cblxuICAvLyBiaW5kIHByb3BzXG4gIGxldCBwcm9wcyA9IG9wdGlvbnMucHJvcHNcblxuICBpZiAoQXJyYXkuaXNBcnJheShwcm9wcykpIHtcbiAgICBwcm9wcyA9IHByb3BzLnJlZHVjZSgocmVzdWx0LCB2YWx1ZSkgPT4ge1xuICAgICAgcmVzdWx0W3ZhbHVlXSA9IHRydWVcbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9LCB7fSlcbiAgfVxuXG4gIG1lcmdlUHJvcHMocmVwZWF0SXRlbSwgcHJvcHMsIHZtLCBzdWJWbSlcbiAgbWVyZ2VQcm9wcyh0ZW1wbGF0ZS5hdHRyLCBwcm9wcywgdm0sIHN1YlZtKVxufVxuXG4vKipcbiAqIG1lcmdlIGNsYXNzIGFuZCBzdHlsZXMgZnJvbSB2bSB0byBzdWIgdm0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kU3ViVm1BZnRlckluaXRpYWxpemVkICh2bSwgc3ViVm0sIHRlbXBsYXRlLCB0YXJnZXQgPSB7fSkge1xuICBtZXJnZUNsYXNzU3R5bGUodGVtcGxhdGUuY2xhc3NMaXN0LCB2bSwgc3ViVm0pXG4gIG1lcmdlU3R5bGUodGVtcGxhdGUuc3R5bGUsIHZtLCBzdWJWbSlcblxuICAvLyBiaW5kIHN1YlZtIHRvIHRoZSB0YXJnZXQgZWxlbWVudFxuICBpZiAodGFyZ2V0LmNoaWxkcmVuKSB7XG4gICAgdGFyZ2V0LmNoaWxkcmVuW3RhcmdldC5jaGlsZHJlbi5sZW5ndGggLSAxXS5fdm0gPSBzdWJWbVxuICB9XG4gIGVsc2Uge1xuICAgIHRhcmdldC5fdm0gPSBzdWJWbVxuICB9XG59XG5cbi8qKlxuICogQmluZCBwcm9wcyBmcm9tIHZtIHRvIHN1YiB2bSBhbmQgd2F0Y2ggdGhlaXIgdXBkYXRlcy5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VQcm9wcyAodGFyZ2V0LCBwcm9wcywgdm0sIHN1YlZtKSB7XG4gIGlmICghdGFyZ2V0KSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgZm9yIChjb25zdCBrZXkgaW4gdGFyZ2V0KSB7XG4gICAgaWYgKCFwcm9wcyB8fCBwcm9wc1trZXldKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRhcmdldFtrZXldXG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNvbnN0IHJldHVyblZhbHVlID0gd2F0Y2godm0sIHZhbHVlLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgIHN1YlZtW2tleV0gPSB2XG4gICAgICAgIH0pXG4gICAgICAgIHN1YlZtW2tleV0gPSByZXR1cm5WYWx1ZVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHN1YlZtW2tleV0gPSB2YWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJpbmQgc3R5bGUgZnJvbSB2bSB0byBzdWIgdm0gYW5kIHdhdGNoIHRoZWlyIHVwZGF0ZXMuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlU3R5bGUgKHRhcmdldCwgdm0sIHN1YlZtKSB7XG4gIGZvciAoY29uc3Qga2V5IGluIHRhcmdldCkge1xuICAgIGNvbnN0IHZhbHVlID0gdGFyZ2V0W2tleV1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zdCByZXR1cm5WYWx1ZSA9IHdhdGNoKHZtLCB2YWx1ZSwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgaWYgKHN1YlZtLl9yb290RWwpIHtcbiAgICAgICAgICBzdWJWbS5fcm9vdEVsLnNldFN0eWxlKGtleSwgdilcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHN1YlZtLl9yb290RWwuc2V0U3R5bGUoa2V5LCByZXR1cm5WYWx1ZSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAoc3ViVm0uX3Jvb3RFbCkge1xuICAgICAgICBzdWJWbS5fcm9vdEVsLnNldFN0eWxlKGtleSwgdmFsdWUpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQmluZCBjbGFzcyAmIHN0eWxlIGZyb20gdm0gdG8gc3ViIHZtIGFuZCB3YXRjaCB0aGVpciB1cGRhdGVzLlxuICovXG5mdW5jdGlvbiBtZXJnZUNsYXNzU3R5bGUgKHRhcmdldCwgdm0sIHN1YlZtKSB7XG4gIGNvbnN0IGNzcyA9IHZtLl9vcHRpb25zICYmIHZtLl9vcHRpb25zLnN0eWxlIHx8IHt9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICghc3ViVm0uX3Jvb3RFbCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3QgY2xhc3NOYW1lID0gJ0BvcmlnaW5hbFJvb3RFbCdcbiAgY3NzW2NsYXNzTmFtZV0gPSBzdWJWbS5fcm9vdEVsLmNsYXNzU3R5bGVcblxuICBmdW5jdGlvbiBhZGRDbGFzc05hbWUgKGxpc3QsIG5hbWUpIHtcbiAgICBpZiAodHlwb2YobGlzdCkgPT09ICdhcnJheScpIHtcbiAgICAgIGxpc3QudW5zaGlmdChuYW1lKVxuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgdmFsdWUgPSB3YXRjaCh2bSwgdGFyZ2V0LCB2ID0+IHtcbiAgICAgIGFkZENsYXNzTmFtZSh2LCBjbGFzc05hbWUpXG4gICAgICBzZXRDbGFzc1N0eWxlKHN1YlZtLl9yb290RWwsIGNzcywgdilcbiAgICB9KVxuICAgIGFkZENsYXNzTmFtZSh2YWx1ZSwgY2xhc3NOYW1lKVxuICAgIHNldENsYXNzU3R5bGUoc3ViVm0uX3Jvb3RFbCwgY3NzLCB2YWx1ZSlcbiAgfVxuICBlbHNlIGlmICh0YXJnZXQgIT0gbnVsbCkge1xuICAgIGFkZENsYXNzTmFtZSh0YXJnZXQsIGNsYXNzTmFtZSlcbiAgICBzZXRDbGFzc1N0eWxlKHN1YlZtLl9yb290RWwsIGNzcywgdGFyZ2V0KVxuICB9XG59XG5cbi8qKlxuICogYmluZCBpZCB0byBhbiBlbGVtZW50XG4gKiBlYWNoIGlkIGlzIHVuaXF1ZSBpbiBhIHdob2xlIHZtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRJZCAodm0sIGVsLCBpZCwgdGFyZ2V0KSB7XG4gIGNvbnN0IG1hcCA9IE9iamVjdC5jcmVhdGUobnVsbClcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhtYXAsIHtcbiAgICB2bToge1xuICAgICAgdmFsdWU6IHRhcmdldCxcbiAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2VcbiAgICB9LFxuICAgIGVsOiB7XG4gICAgICBnZXQ6ICgpID0+IGVsIHx8IHRhcmdldC5fcm9vdEVsLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZVxuICAgIH1cbiAgfSlcblxuICBpZiAodHlwZW9mIGlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgaGFuZGxlciA9IGlkXG4gICAgaWQgPSBoYW5kbGVyLmNhbGwodm0pXG4gICAgaWYgKGlkIHx8IGlkID09PSAwKSB7XG4gICAgICB2bS5faWRzW2lkXSA9IG1hcFxuICAgIH1cbiAgICB3YXRjaCh2bSwgaGFuZGxlciwgKG5ld0lkKSA9PiB7XG4gICAgICBpZiAobmV3SWQpIHtcbiAgICAgICAgdm0uX2lkc1tuZXdJZF0gPSBtYXBcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIGVsc2UgaWYgKGlkICYmIHR5cGVvZiBpZCA9PT0gJ3N0cmluZycpIHtcbiAgICB2bS5faWRzW2lkXSA9IG1hcFxuICB9XG59XG5cbi8qKlxuICogYmluZCBhdHRyIHRvIGFuIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gc2V0QXR0ciAodm0sIGVsLCBhdHRyKSB7XG4gIGJpbmREaXIodm0sIGVsLCAnYXR0cicsIGF0dHIpXG59XG5cbmZ1bmN0aW9uIHNldENsYXNzU3R5bGUgKGVsLCBjc3MsIGNsYXNzTGlzdCkge1xuICBpZiAodHlwZW9mIGNsYXNzTGlzdCA9PT0gJ3N0cmluZycpIHtcbiAgICBjbGFzc0xpc3QgPSBjbGFzc0xpc3Quc3BsaXQoL1xccysvKVxuICB9XG4gIGNsYXNzTGlzdC5mb3JFYWNoKChuYW1lLCBpKSA9PiB7XG4gICAgY2xhc3NMaXN0LnNwbGljZShpLCAxLCAuLi5uYW1lLnNwbGl0KC9cXHMrLykpXG4gIH0pXG4gIGNvbnN0IGNsYXNzU3R5bGUgPSB7fVxuICBjb25zdCBsZW5ndGggPSBjbGFzc0xpc3QubGVuZ3RoXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHN0eWxlID0gY3NzW2NsYXNzTGlzdFtpXV1cbiAgICBpZiAoc3R5bGUpIHtcbiAgICAgIE9iamVjdC5rZXlzKHN0eWxlKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgY2xhc3NTdHlsZVtrZXldID0gc3R5bGVba2V5XVxuICAgICAgfSlcbiAgICB9XG4gIH1cbiAgZWwuc2V0Q2xhc3NTdHlsZShjbGFzc1N0eWxlKVxufVxuXG4vKipcbiAqIGJpbmQgY2xhc3NuYW1lcyB0byBhbiBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIHNldENsYXNzICh2bSwgZWwsIGNsYXNzTGlzdCkge1xuICBpZiAodHlwZW9mIGNsYXNzTGlzdCAhPT0gJ2Z1bmN0aW9uJyAmJiAhQXJyYXkuaXNBcnJheShjbGFzc0xpc3QpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkoY2xhc3NMaXN0KSAmJiAhY2xhc3NMaXN0Lmxlbmd0aCkge1xuICAgIGVsLnNldENsYXNzU3R5bGUoe30pXG4gICAgcmV0dXJuXG4gIH1cblxuICBjb25zdCBzdHlsZSA9IHZtLl9vcHRpb25zICYmIHZtLl9vcHRpb25zLnN0eWxlIHx8IHt9XG4gIGlmICh0eXBlb2YgY2xhc3NMaXN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3QgdmFsdWUgPSB3YXRjaCh2bSwgY2xhc3NMaXN0LCB2ID0+IHtcbiAgICAgIHNldENsYXNzU3R5bGUoZWwsIHN0eWxlLCB2KVxuICAgIH0pXG4gICAgc2V0Q2xhc3NTdHlsZShlbCwgc3R5bGUsIHZhbHVlKVxuICB9XG4gIGVsc2Uge1xuICAgIHNldENsYXNzU3R5bGUoZWwsIHN0eWxlLCBjbGFzc0xpc3QpXG4gIH1cbn1cblxuLyoqXG4gKiBiaW5kIHN0eWxlIHRvIGFuIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gc2V0U3R5bGUgKHZtLCBlbCwgc3R5bGUpIHtcbiAgYmluZERpcih2bSwgZWwsICdzdHlsZScsIHN0eWxlKVxufVxuXG4vKipcbiAqIGFkZCBhbiBldmVudCB0eXBlIGFuZCBoYW5kbGVyIHRvIGFuIGVsZW1lbnQgYW5kIGdlbmVyYXRlIGEgZG9tIHVwZGF0ZVxuICovXG5mdW5jdGlvbiBzZXRFdmVudCAodm0sIGVsLCB0eXBlLCBoYW5kbGVyKSB7XG4gIGVsLmFkZEV2ZW50KHR5cGUsIGJpbmQoaGFuZGxlciwgdm0pKVxufVxuXG4vKipcbiAqIGFkZCBhbGwgZXZlbnRzIG9mIGFuIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gYmluZEV2ZW50cyAodm0sIGVsLCBldmVudHMpIHtcbiAgaWYgKCFldmVudHMpIHtcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZXZlbnRzKVxuICBsZXQgaSA9IGtleXMubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICBjb25zdCBrZXkgPSBrZXlzW2ldXG4gICAgbGV0IGhhbmRsZXIgPSBldmVudHNba2V5XVxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGhhbmRsZXIgPSB2bVtoYW5kbGVyXVxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBUaGUgZXZlbnQgaGFuZGxlciBcIiR7aGFuZGxlcn1cIiBpcyBub3QgZGVmaW5lZC5gKVxuICAgICAgfVxuICAgIH1cbiAgICBzZXRFdmVudCh2bSwgZWwsIGtleSwgaGFuZGxlcilcbiAgfVxufVxuXG4vKipcbiAqIHNldCBhIHNlcmllcyBvZiBtZW1iZXJzIGFzIGEga2luZCBvZiBhbiBlbGVtZW50XG4gKiBmb3IgZXhhbXBsZTogc3R5bGUsIGF0dHIsIC4uLlxuICogaWYgdGhlIHZhbHVlIGlzIGEgZnVuY3Rpb24gdGhlbiBiaW5kIHRoZSBkYXRhIGNoYW5nZXNcbiAqL1xuZnVuY3Rpb24gYmluZERpciAodm0sIGVsLCBuYW1lLCBkYXRhKSB7XG4gIGlmICghZGF0YSkge1xuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhkYXRhKVxuICBsZXQgaSA9IGtleXMubGVuZ3RoXG4gIHdoaWxlIChpLS0pIHtcbiAgICBjb25zdCBrZXkgPSBrZXlzW2ldXG4gICAgY29uc3QgdmFsdWUgPSBkYXRhW2tleV1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBiaW5kS2V5KHZtLCBlbCwgbmFtZSwga2V5LCB2YWx1ZSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlbFtTRVRURVJTW25hbWVdXShrZXksIHZhbHVlKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIGJpbmQgZGF0YSBjaGFuZ2VzIHRvIGEgY2VydGFpbiBrZXkgdG8gYSBuYW1lIHNlcmllcyBpbiBhbiBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIGJpbmRLZXkgKHZtLCBlbCwgbmFtZSwga2V5LCBjYWxjKSB7XG4gIGNvbnN0IG1ldGhvZE5hbWUgPSBTRVRURVJTW25hbWVdXG4gIC8vIHdhdGNoIHRoZSBjYWxjLCBhbmQgcmV0dXJucyBhIHZhbHVlIGJ5IGNhbGMuY2FsbCgpXG4gIGNvbnN0IHZhbHVlID0gd2F0Y2godm0sIGNhbGMsICh2YWx1ZSkgPT4ge1xuICAgIGZ1bmN0aW9uIGhhbmRsZXIgKCkge1xuICAgICAgZWxbbWV0aG9kTmFtZV0oa2V5LCB2YWx1ZSlcbiAgICB9XG4gICAgY29uc3QgZGlmZmVyID0gdm0gJiYgdm0uX2FwcCAmJiB2bS5fYXBwLmRpZmZlclxuICAgIGlmIChkaWZmZXIpIHtcbiAgICAgIGRpZmZlci5hcHBlbmQoJ2VsZW1lbnQnLCBlbC5kZXB0aCB8fCAwLCBlbC5yZWYsIGhhbmRsZXIpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaGFuZGxlcigpXG4gICAgfVxuICB9KVxuXG4gIGVsW21ldGhvZE5hbWVdKGtleSwgdmFsdWUpXG59XG5cbi8qKlxuICogd2F0Y2ggYSBjYWxjIGZ1bmN0aW9uIGFuZCBjYWxsYmFjayBpZiB0aGUgY2FsYyB2YWx1ZSBjaGFuZ2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3YXRjaCAodm0sIGNhbGMsIGNhbGxiYWNrKSB7XG4gIGlmICh2bS5fc3RhdGljKSB7XG4gICAgcmV0dXJuIGNhbGMuY2FsbCh2bSwgdm0pXG4gIH1cbiAgY29uc3Qgd2F0Y2hlciA9IG5ldyBXYXRjaGVyKHZtLCBjYWxjLCBmdW5jdGlvbiAodmFsdWUsIG9sZFZhbHVlKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdmFsdWUgPT09IG9sZFZhbHVlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY2FsbGJhY2sodmFsdWUpXG4gIH0pXG5cbiAgcmV0dXJuIHdhdGNoZXIudmFsdWVcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IERvY3VtZW50ICYgRWxlbWVudCBIZWxwZXJzLlxuICpcbiAqIHJlcXVpcmVkOlxuICogRG9jdW1lbnQjOiBjcmVhdGVFbGVtZW50LCBjcmVhdGVDb21tZW50LCBnZXRSZWZcbiAqIEVsZW1lbnQjOiBhcHBlbmRDaGlsZCwgaW5zZXJ0QmVmb3JlLCByZW1vdmVDaGlsZCwgbmV4dFNpYmxpbmdcbiAqL1xuXG4vKipcbiAqIENyZWF0ZSBhIGJvZHkgYnkgdHlwZVxuICogVXNpbmcgdGhpcy5fYXBwLmRvY1xuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQm9keSAodm0sIHR5cGUpIHtcbiAgY29uc3QgZG9jID0gdm0uX2FwcC5kb2NcbiAgcmV0dXJuIGRvYy5jcmVhdGVCb2R5KHR5cGUpXG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIGVsZW1lbnQgYnkgdHlwZVxuICogVXNpbmcgdGhpcy5fYXBwLmRvY1xuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudCAodm0sIHR5cGUpIHtcbiAgY29uc3QgZG9jID0gdm0uX2FwcC5kb2NcbiAgcmV0dXJuIGRvYy5jcmVhdGVFbGVtZW50KHR5cGUpXG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCByZXR1cm4gYSBmcmFnIGJsb2NrIGZvciBhbiBlbGVtZW50LlxuICogVGhlIGZyYWcgYmxvY2sgaGFzIGEgc3RhcnRlciwgZW5kZXIgYW5kIHRoZSBlbGVtZW50IGl0c2VsZi5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9IGVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUJsb2NrICh2bSwgZWxlbWVudCkge1xuICBjb25zdCBzdGFydCA9IGNyZWF0ZUJsb2NrU3RhcnQodm0pXG4gIGNvbnN0IGVuZCA9IGNyZWF0ZUJsb2NrRW5kKHZtKVxuICBjb25zdCBibG9ja0lkID0gbGFzdGVzdEJsb2NrSWQrK1xuICBpZiAoZWxlbWVudC5lbGVtZW50KSB7XG4gICAgbGV0IHVwZGF0ZU1hcmsgPSBlbGVtZW50LnVwZGF0ZU1hcmtcbiAgICBpZiAodXBkYXRlTWFyaykge1xuICAgICAgaWYgKHVwZGF0ZU1hcmsuZWxlbWVudCkge1xuICAgICAgICB1cGRhdGVNYXJrID0gdXBkYXRlTWFyay5lbmRcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQuZWxlbWVudC5pbnNlcnRBZnRlcihlbmQsIHVwZGF0ZU1hcmspXG4gICAgICBlbGVtZW50LmVsZW1lbnQuaW5zZXJ0QWZ0ZXIoc3RhcnQsIHVwZGF0ZU1hcmspXG4gICAgICBlbGVtZW50LnVwZGF0ZU1hcmsgPSBlbmRcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlbGVtZW50LmVsZW1lbnQuaW5zZXJ0QmVmb3JlKHN0YXJ0LCBlbGVtZW50LmVuZClcbiAgICAgIGVsZW1lbnQuZWxlbWVudC5pbnNlcnRCZWZvcmUoZW5kLCBlbGVtZW50LmVuZClcbiAgICB9XG4gICAgZWxlbWVudCA9IGVsZW1lbnQuZWxlbWVudFxuICB9XG4gIGVsc2Uge1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoc3RhcnQpXG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChlbmQpXG4gIH1cbiAgcmV0dXJuIHsgc3RhcnQsIGVuZCwgZWxlbWVudCwgYmxvY2tJZCB9XG59XG5cbmxldCBsYXN0ZXN0QmxvY2tJZCA9IDFcblxuLyoqXG4gKiBDcmVhdGUgYW5kIHJldHVybiBhIGJsb2NrIHN0YXJ0ZXIuXG4gKiBVc2luZyB0aGlzLl9hcHAuZG9jXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUJsb2NrU3RhcnQgKHZtKSB7XG4gIGNvbnN0IGRvYyA9IHZtLl9hcHAuZG9jXG4gIGNvbnN0IGFuY2hvciA9IGRvYy5jcmVhdGVDb21tZW50KCdzdGFydCcpXG4gIHJldHVybiBhbmNob3Jcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHJldHVybiBhIGJsb2NrIGVuZGVyLlxuICogVXNpbmcgdGhpcy5fYXBwLmRvY1xuICovXG5mdW5jdGlvbiBjcmVhdGVCbG9ja0VuZCAodm0pIHtcbiAgY29uc3QgZG9jID0gdm0uX2FwcC5kb2NcbiAgY29uc3QgYW5jaG9yID0gZG9jLmNyZWF0ZUNvbW1lbnQoJ2VuZCcpXG4gIHJldHVybiBhbmNob3Jcbn1cblxuLyoqXG4gKiBBdHRhY2ggdGFyZ2V0IHRvIGEgY2VydGFpbiBkZXN0IHVzaW5nIGFwcGVuZENoaWxkIGJ5IGRlZmF1bHQuXG4gKiBJZiB0aGUgZGVzdCBpcyBhIGZyYWcgYmxvY2sgdGhlbiBpbnNlcnQgYmVmb3JlIHRoZSBlbmRlci5cbiAqIElmIHRoZSB0YXJnZXQgaXMgYSBmcmFnIGJsb2NrIHRoZW4gYXR0YWNoIHRoZSBzdGFydGVyIGFuZCBlbmRlciBpbiBvcmRlci5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9IHRhcmdldFxuICogQHBhcmFtICB7b2JqZWN0fSBkZXN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hUYXJnZXQgKHZtLCB0YXJnZXQsIGRlc3QpIHtcbiAgaWYgKGRlc3QuZWxlbWVudCkge1xuICAgIGNvbnN0IGJlZm9yZSA9IGRlc3QuZW5kXG4gICAgY29uc3QgYWZ0ZXIgPSBkZXN0LnVwZGF0ZU1hcmtcbiAgICAvLyBwdXNoIG5ldyB0YXJnZXQgZm9yIHdhdGNoIGxpc3QgdXBkYXRlIGxhdGVyXG4gICAgaWYgKGRlc3QuY2hpbGRyZW4pIHtcbiAgICAgIGRlc3QuY2hpbGRyZW4ucHVzaCh0YXJnZXQpXG4gICAgfVxuICAgIC8vIGZvciBjaGVjayByZXBlYXQgY2FzZVxuICAgIGlmIChhZnRlcikge1xuICAgICAgY29uc3Qgc2lnbmFsID0gbW92ZVRhcmdldCh2bSwgdGFyZ2V0LCBhZnRlcilcbiAgICAgIGRlc3QudXBkYXRlTWFyayA9IHRhcmdldC5lbGVtZW50ID8gdGFyZ2V0LmVuZCA6IHRhcmdldFxuICAgICAgcmV0dXJuIHNpZ25hbFxuICAgIH1cbiAgICBlbHNlIGlmICh0YXJnZXQuZWxlbWVudCkge1xuICAgICAgZGVzdC5lbGVtZW50Lmluc2VydEJlZm9yZSh0YXJnZXQuc3RhcnQsIGJlZm9yZSlcbiAgICAgIGRlc3QuZWxlbWVudC5pbnNlcnRCZWZvcmUodGFyZ2V0LmVuZCwgYmVmb3JlKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBkZXN0LmVsZW1lbnQuaW5zZXJ0QmVmb3JlKHRhcmdldCwgYmVmb3JlKVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBpZiAodGFyZ2V0LmVsZW1lbnQpIHtcbiAgICAgIGRlc3QuYXBwZW5kQ2hpbGQodGFyZ2V0LnN0YXJ0KVxuICAgICAgZGVzdC5hcHBlbmRDaGlsZCh0YXJnZXQuZW5kKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBkZXN0LmFwcGVuZENoaWxkKHRhcmdldClcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNb3ZlIHRhcmdldCBiZWZvcmUgYSBjZXJ0YWluIGVsZW1lbnQuIFRoZSB0YXJnZXQgbWF5YmUgYmxvY2sgb3IgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9IHRhcmdldFxuICogQHBhcmFtICB7b2JqZWN0fSBiZWZvcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVUYXJnZXQgKHZtLCB0YXJnZXQsIGFmdGVyKSB7XG4gIGlmICh0YXJnZXQuZWxlbWVudCkge1xuICAgIHJldHVybiBtb3ZlQmxvY2sodGFyZ2V0LCBhZnRlcilcbiAgfVxuICByZXR1cm4gbW92ZUVsZW1lbnQodGFyZ2V0LCBhZnRlcilcbn1cblxuLyoqXG4gKiBNb3ZlIGVsZW1lbnQgYmVmb3JlIGEgY2VydGFpbiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSAge29iamVjdH0gZWxlbWVudFxuICogQHBhcmFtICB7b2JqZWN0fSBiZWZvcmVcbiAqL1xuZnVuY3Rpb24gbW92ZUVsZW1lbnQgKGVsZW1lbnQsIGFmdGVyKSB7XG4gIGNvbnN0IHBhcmVudCA9IGFmdGVyLnBhcmVudE5vZGVcbiAgaWYgKHBhcmVudCkge1xuICAgIHJldHVybiBwYXJlbnQuaW5zZXJ0QWZ0ZXIoZWxlbWVudCwgYWZ0ZXIpXG4gIH1cbn1cblxuLyoqXG4gKiBNb3ZlIGFsbCBlbGVtZW50cyBvZiB0aGUgYmxvY2sgYmVmb3JlIGEgY2VydGFpbiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSAge29iamVjdH0gZnJhZ0Jsb2NrXG4gKiBAcGFyYW0gIHtvYmplY3R9IGJlZm9yZVxuICovXG5mdW5jdGlvbiBtb3ZlQmxvY2sgKGZyYWdCbG9jaywgYWZ0ZXIpIHtcbiAgY29uc3QgcGFyZW50ID0gYWZ0ZXIucGFyZW50Tm9kZVxuXG4gIGlmIChwYXJlbnQpIHtcbiAgICBsZXQgZWwgPSBmcmFnQmxvY2suc3RhcnRcbiAgICBsZXQgc2lnbmFsXG4gICAgY29uc3QgZ3JvdXAgPSBbZWxdXG5cbiAgICB3aGlsZSAoZWwgJiYgZWwgIT09IGZyYWdCbG9jay5lbmQpIHtcbiAgICAgIGVsID0gZWwubmV4dFNpYmxpbmdcbiAgICAgIGdyb3VwLnB1c2goZWwpXG4gICAgfVxuXG4gICAgbGV0IHRlbXAgPSBhZnRlclxuICAgIGdyb3VwLmV2ZXJ5KChlbCkgPT4ge1xuICAgICAgc2lnbmFsID0gcGFyZW50Lmluc2VydEFmdGVyKGVsLCB0ZW1wKVxuICAgICAgdGVtcCA9IGVsXG4gICAgICByZXR1cm4gc2lnbmFsICE9PSAtMVxuICAgIH0pXG5cbiAgICByZXR1cm4gc2lnbmFsXG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmUgdGFyZ2V0IGZyb20gRE9NIHRyZWUuXG4gKiBJZiB0aGUgdGFyZ2V0IGlzIGEgZnJhZyBibG9jayB0aGVuIGNhbGwgX3JlbW92ZUJsb2NrXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSB0YXJnZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVRhcmdldCAodm0sIHRhcmdldCwgcHJlc2VydmVCbG9jayA9IGZhbHNlKSB7XG4gIGlmICh0YXJnZXQuZWxlbWVudCkge1xuICAgIHJlbW92ZUJsb2NrKHRhcmdldCwgcHJlc2VydmVCbG9jaylcbiAgfVxuICBlbHNlIHtcbiAgICByZW1vdmVFbGVtZW50KHRhcmdldClcbiAgfVxuICBpZiAodGFyZ2V0Ll92bSkge1xuICAgIHRhcmdldC5fdm0uJGVtaXQoJ2hvb2s6ZGVzdHJveWVkJylcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZSBhIGNlcnRhaW4gZWxlbWVudC5cbiAqIFVzaW5nIHRoaXMuX2FwcC5kb2NcbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9IHRhcmdldFxuICovXG5mdW5jdGlvbiByZW1vdmVFbGVtZW50ICh0YXJnZXQpIHtcbiAgY29uc3QgcGFyZW50ID0gdGFyZ2V0LnBhcmVudE5vZGVcblxuICBpZiAocGFyZW50KSB7XG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKHRhcmdldClcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZSBhIGZyYWcgYmxvY2suXG4gKiBUaGUgc2Vjb25kIHBhcmFtIGRlY2lkZXMgd2hldGhlciB0aGUgYmxvY2sgc2VsZiBzaG91bGQgYmUgcmVtb3ZlZCB0b28uXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSAgZnJhZ0Jsb2NrXG4gKiBAcGFyYW0gIHtCb29sZWFufSBwcmVzZXJ2ZUJsb2NrPWZhbHNlXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUJsb2NrIChmcmFnQmxvY2ssIHByZXNlcnZlQmxvY2sgPSBmYWxzZSkge1xuICBjb25zdCByZXN1bHQgPSBbXVxuICBsZXQgZWwgPSBmcmFnQmxvY2suc3RhcnQubmV4dFNpYmxpbmdcblxuICB3aGlsZSAoZWwgJiYgZWwgIT09IGZyYWdCbG9jay5lbmQpIHtcbiAgICByZXN1bHQucHVzaChlbClcbiAgICBlbCA9IGVsLm5leHRTaWJsaW5nXG4gIH1cblxuICBpZiAoIXByZXNlcnZlQmxvY2spIHtcbiAgICByZW1vdmVFbGVtZW50KGZyYWdCbG9jay5zdGFydClcbiAgfVxuICByZXN1bHQuZm9yRWFjaCgoZWwpID0+IHtcbiAgICByZW1vdmVFbGVtZW50KGVsKVxuICB9KVxuICBpZiAoIXByZXNlcnZlQmxvY2spIHtcbiAgICByZW1vdmVFbGVtZW50KGZyYWdCbG9jay5lbmQpXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBWaWV3TW9kZWwgdGVtcGxhdGUgcGFyc2VyICYgZGF0YS1iaW5kaW5nIHByb2Nlc3NcbiAqL1xuXG5pbXBvcnQge1xuICBleHRlbmQsXG4gIGlzT2JqZWN0LFxuICBiaW5kXG59IGZyb20gJy4uL3V0aWwvaW5kZXgnXG5pbXBvcnQge1xuICBpbml0RGF0YSxcbiAgaW5pdENvbXB1dGVkXG59IGZyb20gJy4uL2NvcmUvc3RhdGUnXG5pbXBvcnQge1xuICBiaW5kRWxlbWVudCxcbiAgc2V0SWQsXG4gIGJpbmRTdWJWbSxcbiAgYmluZFN1YlZtQWZ0ZXJJbml0aWFsaXplZCxcbiAgYXBwbHlOYWl0dmVDb21wb25lbnRPcHRpb25zLFxuICB3YXRjaFxufSBmcm9tICcuL2RpcmVjdGl2ZSdcbmltcG9ydCB7XG4gIGNyZWF0ZUJsb2NrLFxuICBjcmVhdGVCb2R5LFxuICBjcmVhdGVFbGVtZW50LFxuICBhdHRhY2hUYXJnZXQsXG4gIG1vdmVUYXJnZXQsXG4gIHJlbW92ZVRhcmdldFxufSBmcm9tICcuL2RvbS1oZWxwZXInXG5cbi8qKlxuICogYnVpbGQoKVxuICogICBjb21waWxlKHRlbXBsYXRlLCBwYXJlbnROb2RlKVxuICogICAgIGlmICh0eXBlIGlzIGNvbnRlbnQpIGNyZWF0ZSBjb250ZW50Tm9kZVxuICogICAgIGVsc2UgaWYgKGRpcnMgaGF2ZSB2LWZvcikgZm9yZWFjaCAtPiBjcmVhdGUgY29udGV4dFxuICogICAgICAgLT4gY29tcGlsZSh0ZW1wbGF0ZVdpdGhvdXRGb3IsIHBhcmVudE5vZGUpOiBkaWZmKGxpc3QpIG9uY2hhbmdlXG4gKiAgICAgZWxzZSBpZiAoZGlycyBoYXZlIHYtaWYpIGFzc2VydFxuICogICAgICAgLT4gY29tcGlsZSh0ZW1wbGF0ZVdpdGhvdXRJZiwgcGFyZW50Tm9kZSk6IHRvZ2dsZShzaG93bikgb25jaGFuZ2VcbiAqICAgICBlbHNlIGlmICh0eXBlIGlzIGR5bmFtaWMpXG4gKiAgICAgICAtPiBjb21waWxlKHRlbXBsYXRlV2l0aG91dER5bmFtaWNUeXBlLCBwYXJlbnROb2RlKTogd2F0Y2godHlwZSkgb25jaGFuZ2VcbiAqICAgICBlbHNlIGlmICh0eXBlIGlzIGN1c3RvbSlcbiAqICAgICAgIGFkZENoaWxkVm0odm0sIHBhcmVudFZtKVxuICogICAgICAgYnVpbGQoZXh0ZXJuYWxEaXJzKVxuICogICAgICAgZm9yZWFjaCBjaGlsZE5vZGVzIC0+IGNvbXBpbGUoY2hpbGROb2RlLCB0ZW1wbGF0ZSlcbiAqICAgICBlbHNlIGlmICh0eXBlIGlzIG5hdGl2ZSlcbiAqICAgICAgIHNldChkaXJzKTogdXBkYXRlKGlkL2F0dHIvc3R5bGUvY2xhc3MpIG9uY2hhbmdlXG4gKiAgICAgICBhcHBlbmQodGVtcGxhdGUsIHBhcmVudE5vZGUpXG4gKiAgICAgICBmb3JlYWNoIGNoaWxkTm9kZXMgLT4gY29tcGlsZShjaGlsZE5vZGUsIHRlbXBsYXRlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGQgKHZtKSB7XG4gIGNvbnN0IG9wdCA9IHZtLl9vcHRpb25zIHx8IHt9XG4gIGNvbnN0IHRlbXBsYXRlID0gb3B0LnRlbXBsYXRlIHx8IHt9XG5cbiAgaWYgKG9wdC5yZXBsYWNlKSB7XG4gICAgaWYgKHRlbXBsYXRlLmNoaWxkcmVuICYmIHRlbXBsYXRlLmNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuICAgICAgY29tcGlsZSh2bSwgdGVtcGxhdGUuY2hpbGRyZW5bMF0sIHZtLl9wYXJlbnRFbClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21waWxlKHZtLCB0ZW1wbGF0ZS5jaGlsZHJlbiwgdm0uX3BhcmVudEVsKVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBjb21waWxlKHZtLCB0ZW1wbGF0ZSwgdm0uX3BhcmVudEVsKVxuICB9XG5cbiAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gXCJyZWFkeVwiIGxpZmVjeWNsZSBpbiBWbSgke3ZtLl90eXBlfSlgKVxuICB2bS4kZW1pdCgnaG9vazpyZWFkeScpXG4gIHZtLl9yZWFkeSA9IHRydWVcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBlbGVtZW50cyBieSBjaGlsZCBvciBjaGlsZHJlbiBhbmQgYXBwZW5kIHRvIHBhcmVudCBlbGVtZW50cy5cbiAqIFJvb3QgZWxlbWVudCBpbmZvIHdvdWxkIGJlIG1lcmdlZCBpZiBoYXMuIFRoZSBmaXJzdCBhcmd1bWVudCBtYXkgYmUgYW4gYXJyYXlcbiAqIGlmIHRoZSByb290IGVsZW1lbnQgd2l0aCBvcHRpb25zLnJlcGxhY2UgaGFzIG5vdCBvbmx5IG9uZSBjaGlsZC5cbiAqXG4gKiBAcGFyYW0ge29iamVjdHxhcnJheX0gdGFyZ2V0XG4gKiBAcGFyYW0ge29iamVjdH0gICAgICAgZGVzdFxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgIG1ldGFcbiAqL1xuZnVuY3Rpb24gY29tcGlsZSAodm0sIHRhcmdldCwgZGVzdCwgbWV0YSkge1xuICBjb25zdCBhcHAgPSB2bS5fYXBwIHx8IHt9XG5cbiAgaWYgKGFwcC5sYXN0U2lnbmFsID09PSAtMSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKHRhcmdldC5hdHRyICYmIHRhcmdldC5hdHRyLmhhc093blByb3BlcnR5KCdzdGF0aWMnKSkge1xuICAgIHZtLl9zdGF0aWMgPSB0cnVlXG4gIH1cblxuICBpZiAodGFyZ2V0SXNGcmFnbWVudCh0YXJnZXQpKSB7XG4gICAgY29tcGlsZUZyYWdtZW50KHZtLCB0YXJnZXQsIGRlc3QsIG1ldGEpXG4gICAgcmV0dXJuXG4gIH1cbiAgbWV0YSA9IG1ldGEgfHwge31cbiAgaWYgKHRhcmdldElzQ29udGVudCh0YXJnZXQpKSB7XG4gICAgY29uc29sZS5kZWJ1ZygnW0pTIEZyYW1ld29ya10gY29tcGlsZSBcImNvbnRlbnRcIiBibG9jayBieScsIHRhcmdldClcbiAgICB2bS5fY29udGVudCA9IGNyZWF0ZUJsb2NrKHZtLCBkZXN0KVxuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKHRhcmdldE5lZWRDaGVja1JlcGVhdCh0YXJnZXQsIG1ldGEpKSB7XG4gICAgY29uc29sZS5kZWJ1ZygnW0pTIEZyYW1ld29ya10gY29tcGlsZSBcInJlcGVhdFwiIGxvZ2ljIGJ5JywgdGFyZ2V0KVxuICAgIGlmIChkZXN0LnR5cGUgPT09ICdkb2N1bWVudCcpIHtcbiAgICAgIGNvbnNvbGUud2FybignW0pTIEZyYW1ld29ya10gVGhlIHJvb3QgZWxlbWVudCBkb2VzXFwndCBzdXBwb3J0IGByZXBlYXRgIGRpcmVjdGl2ZSEnKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbXBpbGVSZXBlYXQodm0sIHRhcmdldCwgZGVzdClcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKHRhcmdldE5lZWRDaGVja1Nob3duKHRhcmdldCwgbWV0YSkpIHtcbiAgICBjb25zb2xlLmRlYnVnKCdbSlMgRnJhbWV3b3JrXSBjb21waWxlIFwiaWZcIiBsb2dpYyBieScsIHRhcmdldClcbiAgICBpZiAoZGVzdC50eXBlID09PSAnZG9jdW1lbnQnKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIFRoZSByb290IGVsZW1lbnQgZG9lc1xcJ3Qgc3VwcG9ydCBgaWZgIGRpcmVjdGl2ZSEnKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbXBpbGVTaG93bih2bSwgdGFyZ2V0LCBkZXN0LCBtZXRhKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCB0eXBlR2V0dGVyID0gbWV0YS50eXBlIHx8IHRhcmdldC50eXBlXG4gIGlmICh0YXJnZXROZWVkQ2hlY2tUeXBlKHR5cGVHZXR0ZXIsIG1ldGEpKSB7XG4gICAgY29tcGlsZVR5cGUodm0sIHRhcmdldCwgZGVzdCwgdHlwZUdldHRlciwgbWV0YSlcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCB0eXBlID0gdHlwZUdldHRlclxuICBjb25zdCBjb21wb25lbnQgPSB0YXJnZXRJc0NvbXBvc2VkKHZtLCB0YXJnZXQsIHR5cGUpXG4gIGlmIChjb21wb25lbnQpIHtcbiAgICBjb25zb2xlLmRlYnVnKCdbSlMgRnJhbWV3b3JrXSBjb21waWxlIGNvbXBvc2VkIGNvbXBvbmVudCBieScsIHRhcmdldClcbiAgICBjb21waWxlQ3VzdG9tQ29tcG9uZW50KHZtLCBjb21wb25lbnQsIHRhcmdldCwgZGVzdCwgdHlwZSwgbWV0YSlcbiAgICByZXR1cm5cbiAgfVxuICBjb25zb2xlLmRlYnVnKCdbSlMgRnJhbWV3b3JrXSBjb21waWxlIG5hdGl2ZSBjb21wb25lbnQgYnknLCB0YXJnZXQpXG4gIGNvbXBpbGVOYXRpdmVDb21wb25lbnQodm0sIHRhcmdldCwgZGVzdCwgdHlwZSlcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0YXJnZXQgaXMgYSBmcmFnbWVudCAoYW4gYXJyYXkpLlxuICpcbiAqIEBwYXJhbSAge29iamVjdH0gIHRhcmdldFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gdGFyZ2V0SXNGcmFnbWVudCAodGFyZ2V0KSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHRhcmdldClcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0YXJnZXQgdHlwZSBpcyBjb250ZW50L3Nsb3QuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSAgdGFyZ2V0XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB0YXJnZXRJc0NvbnRlbnQgKHRhcmdldCkge1xuICByZXR1cm4gdGFyZ2V0LnR5cGUgPT09ICdjb250ZW50JyB8fCB0YXJnZXQudHlwZSA9PT0gJ3Nsb3QnXG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGFyZ2V0IG5lZWQgdG8gY29tcGlsZSBieSBhIGxpc3QuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSAgdGFyZ2V0XG4gKiBAcGFyYW0gIHtvYmplY3R9ICBtZXRhXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB0YXJnZXROZWVkQ2hlY2tSZXBlYXQgKHRhcmdldCwgbWV0YSkge1xuICByZXR1cm4gIW1ldGEuaGFzT3duUHJvcGVydHkoJ3JlcGVhdCcpICYmIHRhcmdldC5yZXBlYXRcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0YXJnZXQgbmVlZCB0byBjb21waWxlIGJ5IGEgYm9vbGVhbiB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9ICB0YXJnZXRcbiAqIEBwYXJhbSAge29iamVjdH0gIG1ldGFcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHRhcmdldE5lZWRDaGVja1Nob3duICh0YXJnZXQsIG1ldGEpIHtcbiAgcmV0dXJuICFtZXRhLmhhc093blByb3BlcnR5KCdzaG93bicpICYmIHRhcmdldC5zaG93blxufVxuXG4vKipcbiAqIENoZWNrIGlmIHRhcmdldCBuZWVkIHRvIGNvbXBpbGUgYnkgYSBkeW5hbWljIHR5cGUuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfGZ1bmN0aW9ufSB0eXBlR2V0dGVyXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgICAgICAgIG1ldGFcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHRhcmdldE5lZWRDaGVja1R5cGUgKHR5cGVHZXR0ZXIsIG1ldGEpIHtcbiAgcmV0dXJuICh0eXBlb2YgdHlwZUdldHRlciA9PT0gJ2Z1bmN0aW9uJykgJiYgIW1ldGEuaGFzT3duUHJvcGVydHkoJ3R5cGUnKVxufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMga2luZCBvZiBjb21wb25lbnQgaXMgY29tcG9zZWQuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSAgdHlwZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gdGFyZ2V0SXNDb21wb3NlZCAodm0sIHRhcmdldCwgdHlwZSkge1xuICBsZXQgY29tcG9uZW50XG4gIGlmICh2bS5fYXBwICYmIHZtLl9hcHAuY3VzdG9tQ29tcG9uZW50TWFwKSB7XG4gICAgY29tcG9uZW50ID0gdm0uX2FwcC5jdXN0b21Db21wb25lbnRNYXBbdHlwZV1cbiAgfVxuICBpZiAodm0uX29wdGlvbnMgJiYgdm0uX29wdGlvbnMuY29tcG9uZW50cykge1xuICAgIGNvbXBvbmVudCA9IHZtLl9vcHRpb25zLmNvbXBvbmVudHNbdHlwZV1cbiAgfVxuICBpZiAodGFyZ2V0LmNvbXBvbmVudCkge1xuICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudCB8fCB7fVxuICB9XG4gIHJldHVybiBjb21wb25lbnRcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgbGlzdCBvZiB0YXJnZXRzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0XG4gKiBAcGFyYW0ge29iamVjdH0gbWV0YVxuICovXG5mdW5jdGlvbiBjb21waWxlRnJhZ21lbnQgKHZtLCB0YXJnZXQsIGRlc3QsIG1ldGEpIHtcbiAgY29uc3QgZnJhZ0Jsb2NrID0gY3JlYXRlQmxvY2sodm0sIGRlc3QpXG4gIHRhcmdldC5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgIGNvbXBpbGUodm0sIGNoaWxkLCBmcmFnQmxvY2ssIG1ldGEpXG4gIH0pXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIHRhcmdldCB3aXRoIHJlcGVhdCBkaXJlY3RpdmUuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICogQHBhcmFtIHtvYmplY3R9IGRlc3RcbiAqL1xuZnVuY3Rpb24gY29tcGlsZVJlcGVhdCAodm0sIHRhcmdldCwgZGVzdCkge1xuICBjb25zdCByZXBlYXQgPSB0YXJnZXQucmVwZWF0XG4gIGNvbnN0IG9sZFN0eWxlID0gdHlwZW9mIHJlcGVhdCA9PT0gJ2Z1bmN0aW9uJ1xuICBsZXQgZ2V0dGVyID0gcmVwZWF0LmdldHRlciB8fCByZXBlYXQuZXhwcmVzc2lvbiB8fCByZXBlYXRcbiAgaWYgKHR5cGVvZiBnZXR0ZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICBnZXR0ZXIgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBbXSB9XG4gIH1cbiAgY29uc3Qga2V5ID0gcmVwZWF0LmtleSB8fCAnJGluZGV4J1xuICBjb25zdCB2YWx1ZSA9IHJlcGVhdC52YWx1ZSB8fCAnJHZhbHVlJ1xuICBjb25zdCB0cmFja0J5ID0gcmVwZWF0LnRyYWNrQnkgfHwgdGFyZ2V0LnRyYWNrQnkgfHxcbiAgICAodGFyZ2V0LmF0dHIgJiYgdGFyZ2V0LmF0dHIudHJhY2tCeSlcblxuICBjb25zdCBmcmFnQmxvY2sgPSBjcmVhdGVCbG9jayh2bSwgZGVzdClcbiAgZnJhZ0Jsb2NrLmNoaWxkcmVuID0gW11cbiAgZnJhZ0Jsb2NrLmRhdGEgPSBbXVxuICBmcmFnQmxvY2sudm1zID0gW11cblxuICBiaW5kUmVwZWF0KHZtLCB0YXJnZXQsIGZyYWdCbG9jaywgeyBnZXR0ZXIsIGtleSwgdmFsdWUsIHRyYWNrQnksIG9sZFN0eWxlIH0pXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIHRhcmdldCB3aXRoIGlmIGRpcmVjdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0XG4gKiBAcGFyYW0ge29iamVjdH0gZGVzdFxuICogQHBhcmFtIHtvYmplY3R9IG1ldGFcbiAqL1xuZnVuY3Rpb24gY29tcGlsZVNob3duICh2bSwgdGFyZ2V0LCBkZXN0LCBtZXRhKSB7XG4gIGNvbnN0IG5ld01ldGEgPSB7IHNob3duOiB0cnVlIH1cbiAgY29uc3QgZnJhZ0Jsb2NrID0gY3JlYXRlQmxvY2sodm0sIGRlc3QpXG5cbiAgaWYgKGRlc3QuZWxlbWVudCAmJiBkZXN0LmNoaWxkcmVuKSB7XG4gICAgZGVzdC5jaGlsZHJlbi5wdXNoKGZyYWdCbG9jaylcbiAgfVxuXG4gIGlmIChtZXRhLnJlcGVhdCkge1xuICAgIG5ld01ldGEucmVwZWF0ID0gbWV0YS5yZXBlYXRcbiAgfVxuXG4gIGJpbmRTaG93bih2bSwgdGFyZ2V0LCBmcmFnQmxvY2ssIG5ld01ldGEpXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIHRhcmdldCB3aXRoIGR5bmFtaWMgY29tcG9uZW50IHR5cGUuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9ICAgdGFyZ2V0XG4gKiBAcGFyYW0ge29iamVjdH0gICBkZXN0XG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0eXBlR2V0dGVyXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVUeXBlICh2bSwgdGFyZ2V0LCBkZXN0LCB0eXBlR2V0dGVyLCBtZXRhKSB7XG4gIGNvbnN0IHR5cGUgPSB0eXBlR2V0dGVyLmNhbGwodm0pXG4gIGNvbnN0IG5ld01ldGEgPSBleHRlbmQoeyB0eXBlIH0sIG1ldGEpXG4gIGNvbnN0IGZyYWdCbG9jayA9IGNyZWF0ZUJsb2NrKHZtLCBkZXN0KVxuXG4gIGlmIChkZXN0LmVsZW1lbnQgJiYgZGVzdC5jaGlsZHJlbikge1xuICAgIGRlc3QuY2hpbGRyZW4ucHVzaChmcmFnQmxvY2spXG4gIH1cblxuICB3YXRjaCh2bSwgdHlwZUdldHRlciwgKHZhbHVlKSA9PiB7XG4gICAgY29uc3QgbmV3TWV0YSA9IGV4dGVuZCh7IHR5cGU6IHZhbHVlIH0sIG1ldGEpXG4gICAgcmVtb3ZlVGFyZ2V0KHZtLCBmcmFnQmxvY2ssIHRydWUpXG4gICAgY29tcGlsZSh2bSwgdGFyZ2V0LCBmcmFnQmxvY2ssIG5ld01ldGEpXG4gIH0pXG5cbiAgY29tcGlsZSh2bSwgdGFyZ2V0LCBmcmFnQmxvY2ssIG5ld01ldGEpXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIGNvbXBvc2VkIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0XG4gKiBAcGFyYW0ge29iamVjdH0gZGVzdFxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqL1xuZnVuY3Rpb24gY29tcGlsZUN1c3RvbUNvbXBvbmVudCAodm0sIGNvbXBvbmVudCwgdGFyZ2V0LCBkZXN0LCB0eXBlLCBtZXRhKSB7XG4gIGNvbnN0IEN0b3IgPSB2bS5jb25zdHJ1Y3RvclxuICBjb25zdCBzdWJWbSA9IG5ldyBDdG9yKHR5cGUsIGNvbXBvbmVudCwgdm0sIGRlc3QsIHVuZGVmaW5lZCwge1xuICAgICdob29rOmluaXQnOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodm0uX3N0YXRpYykge1xuICAgICAgICB0aGlzLl9zdGF0aWMgPSB2bS5fc3RhdGljXG4gICAgICB9XG4gICAgICBzZXRJZCh2bSwgbnVsbCwgdGFyZ2V0LmlkLCB0aGlzKVxuICAgICAgLy8gYmluZCB0ZW1wbGF0ZSBlYXJsaWVyIGJlY2F1c2Ugb2YgbGlmZWN5Y2xlIGlzc3Vlc1xuICAgICAgdGhpcy5fZXh0ZXJuYWxCaW5kaW5nID0ge1xuICAgICAgICBwYXJlbnQ6IHZtLFxuICAgICAgICB0ZW1wbGF0ZTogdGFyZ2V0XG4gICAgICB9XG4gICAgfSxcbiAgICAnaG9vazpjcmVhdGVkJzogZnVuY3Rpb24gKCkge1xuICAgICAgYmluZFN1YlZtKHZtLCB0aGlzLCB0YXJnZXQsIG1ldGEucmVwZWF0KVxuICAgIH0sXG4gICAgJ2hvb2s6cmVhZHknOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5fY29udGVudCkge1xuICAgICAgICBjb21waWxlQ2hpbGRyZW4odm0sIHRhcmdldCwgdGhpcy5fY29udGVudClcbiAgICAgIH1cbiAgICB9XG4gIH0pXG4gIGJpbmRTdWJWbUFmdGVySW5pdGlhbGl6ZWQodm0sIHN1YlZtLCB0YXJnZXQsIGRlc3QpXG59XG5cbi8qKlxuICogR2VuZXJhdGUgZWxlbWVudCBmcm9tIHRlbXBsYXRlIGFuZCBhdHRhY2ggdG8gdGhlIGRlc3QgaWYgbmVlZGVkLlxuICogVGhlIHRpbWUgdG8gYXR0YWNoIGRlcGVuZHMgb24gd2hldGhlciB0aGUgbW9kZSBzdGF0dXMgaXMgbm9kZSBvciB0cmVlLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSB0ZW1wbGF0ZVxuICogQHBhcmFtIHtvYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVOYXRpdmVDb21wb25lbnQgKHZtLCB0ZW1wbGF0ZSwgZGVzdCwgdHlwZSkge1xuICBhcHBseU5haXR2ZUNvbXBvbmVudE9wdGlvbnModGVtcGxhdGUpXG5cbiAgbGV0IGVsZW1lbnRcbiAgaWYgKGRlc3QucmVmID09PSAnX2RvY3VtZW50RWxlbWVudCcpIHtcbiAgICAvLyBpZiBpdHMgcGFyZW50IGlzIGRvY3VtZW50RWxlbWVudCB0aGVuIGl0J3MgYSBib2R5XG4gICAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gY29tcGlsZSB0byBjcmVhdGUgYm9keSBmb3IgJHt0eXBlfWApXG4gICAgZWxlbWVudCA9IGNyZWF0ZUJvZHkodm0sIHR5cGUpXG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gY29tcGlsZSB0byBjcmVhdGUgZWxlbWVudCBmb3IgJHt0eXBlfWApXG4gICAgZWxlbWVudCA9IGNyZWF0ZUVsZW1lbnQodm0sIHR5cGUpXG4gIH1cblxuICBpZiAoIXZtLl9yb290RWwpIHtcbiAgICB2bS5fcm9vdEVsID0gZWxlbWVudFxuICAgIC8vIGJpbmQgZXZlbnQgZWFybGllciBiZWNhdXNlIG9mIGxpZmVjeWNsZSBpc3N1ZXNcbiAgICBjb25zdCBiaW5kaW5nID0gdm0uX2V4dGVybmFsQmluZGluZyB8fCB7fVxuICAgIGNvbnN0IHRhcmdldCA9IGJpbmRpbmcudGVtcGxhdGVcbiAgICBjb25zdCBwYXJlbnRWbSA9IGJpbmRpbmcucGFyZW50XG4gICAgaWYgKHRhcmdldCAmJiB0YXJnZXQuZXZlbnRzICYmIHBhcmVudFZtICYmIGVsZW1lbnQpIHtcbiAgICAgIGZvciAoY29uc3QgdHlwZSBpbiB0YXJnZXQuZXZlbnRzKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSBwYXJlbnRWbVt0YXJnZXQuZXZlbnRzW3R5cGVdXVxuICAgICAgICBpZiAoaGFuZGxlcikge1xuICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnQodHlwZSwgYmluZChoYW5kbGVyLCBwYXJlbnRWbSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBiaW5kRWxlbWVudCh2bSwgZWxlbWVudCwgdGVtcGxhdGUpXG5cbiAgaWYgKHRlbXBsYXRlLmF0dHIgJiYgdGVtcGxhdGUuYXR0ci5hcHBlbmQpIHsgLy8gYmFja3dhcmQsIGFwcGVuZCBwcm9wIGluIGF0dHJcbiAgICB0ZW1wbGF0ZS5hcHBlbmQgPSB0ZW1wbGF0ZS5hdHRyLmFwcGVuZFxuICB9XG5cbiAgaWYgKHRlbXBsYXRlLmFwcGVuZCkgeyAvLyBnaXZlIHRoZSBhcHBlbmQgYXR0cmlidXRlIGZvciBpb3MgYWRhcHRhdGlvblxuICAgIGVsZW1lbnQuYXR0ciA9IGVsZW1lbnQuYXR0ciB8fCB7fVxuICAgIGVsZW1lbnQuYXR0ci5hcHBlbmQgPSB0ZW1wbGF0ZS5hcHBlbmRcbiAgfVxuXG4gIGNvbnN0IHRyZWVNb2RlID0gdGVtcGxhdGUuYXBwZW5kID09PSAndHJlZSdcbiAgY29uc3QgYXBwID0gdm0uX2FwcCB8fCB7fVxuICBpZiAoYXBwLmxhc3RTaWduYWwgIT09IC0xICYmICF0cmVlTW9kZSkge1xuICAgIGNvbnNvbGUuZGVidWcoJ1tKUyBGcmFtZXdvcmtdIGNvbXBpbGUgdG8gYXBwZW5kIHNpbmdsZSBub2RlIGZvcicsIGVsZW1lbnQpXG4gICAgYXBwLmxhc3RTaWduYWwgPSBhdHRhY2hUYXJnZXQodm0sIGVsZW1lbnQsIGRlc3QpXG4gIH1cbiAgaWYgKGFwcC5sYXN0U2lnbmFsICE9PSAtMSkge1xuICAgIGNvbXBpbGVDaGlsZHJlbih2bSwgdGVtcGxhdGUsIGVsZW1lbnQpXG4gIH1cbiAgaWYgKGFwcC5sYXN0U2lnbmFsICE9PSAtMSAmJiB0cmVlTW9kZSkge1xuICAgIGNvbnNvbGUuZGVidWcoJ1tKUyBGcmFtZXdvcmtdIGNvbXBpbGUgdG8gYXBwZW5kIHdob2xlIHRyZWUgZm9yJywgZWxlbWVudClcbiAgICBhcHAubGFzdFNpZ25hbCA9IGF0dGFjaFRhcmdldCh2bSwgZWxlbWVudCwgZGVzdClcbiAgfVxufVxuXG4vKipcbiAqIFNldCBhbGwgY2hpbGRyZW4gdG8gYSBjZXJ0YWluIHBhcmVudCBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSB0ZW1wbGF0ZVxuICogQHBhcmFtIHtvYmplY3R9IGRlc3RcbiAqL1xuZnVuY3Rpb24gY29tcGlsZUNoaWxkcmVuICh2bSwgdGVtcGxhdGUsIGRlc3QpIHtcbiAgY29uc3QgYXBwID0gdm0uX2FwcCB8fCB7fVxuICBjb25zdCBjaGlsZHJlbiA9IHRlbXBsYXRlLmNoaWxkcmVuXG4gIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICBjaGlsZHJlbi5ldmVyeSgoY2hpbGQpID0+IHtcbiAgICAgIGNvbXBpbGUodm0sIGNoaWxkLCBkZXN0KVxuICAgICAgcmV0dXJuIGFwcC5sYXN0U2lnbmFsICE9PSAtMVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBXYXRjaCB0aGUgbGlzdCB1cGRhdGUgYW5kIHJlZnJlc2ggdGhlIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICogQHBhcmFtIHtvYmplY3R9IGZyYWdCbG9jayB7dm1zLCBkYXRhLCBjaGlsZHJlbn1cbiAqIEBwYXJhbSB7b2JqZWN0fSBpbmZvICAgICAge2dldHRlciwga2V5LCB2YWx1ZSwgdHJhY2tCeSwgb2xkU3R5bGV9XG4gKi9cbmZ1bmN0aW9uIGJpbmRSZXBlYXQgKHZtLCB0YXJnZXQsIGZyYWdCbG9jaywgaW5mbykge1xuICBjb25zdCB2bXMgPSBmcmFnQmxvY2sudm1zXG4gIGNvbnN0IGNoaWxkcmVuID0gZnJhZ0Jsb2NrLmNoaWxkcmVuXG4gIGNvbnN0IHsgZ2V0dGVyLCB0cmFja0J5LCBvbGRTdHlsZSB9ID0gaW5mb1xuICBjb25zdCBrZXlOYW1lID0gaW5mby5rZXlcbiAgY29uc3QgdmFsdWVOYW1lID0gaW5mby52YWx1ZVxuXG4gIGZ1bmN0aW9uIGNvbXBpbGVJdGVtIChpdGVtLCBpbmRleCwgY29udGV4dCkge1xuICAgIGxldCBtZXJnZWREYXRhXG4gICAgaWYgKG9sZFN0eWxlKSB7XG4gICAgICBtZXJnZWREYXRhID0gaXRlbVxuICAgICAgaWYgKGlzT2JqZWN0KGl0ZW0pKSB7XG4gICAgICAgIG1lcmdlZERhdGFba2V5TmFtZV0gPSBpbmRleFxuICAgICAgICBpZiAoIW1lcmdlZERhdGEuaGFzT3duUHJvcGVydHkoJ0lOREVYJykpIHtcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobWVyZ2VkRGF0YSwgJ0lOREVYJywge1xuICAgICAgICAgICAgdmFsdWU6ICgpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbSlMgRnJhbWV3b3JrXSBcIklOREVYXCIgaW4gcmVwZWF0IGlzIGRlcHJlY2F0ZWQsICcgK1xuICAgICAgICAgICAgICAgICdwbGVhc2UgdXNlIFwiJGluZGV4XCIgaW5zdGVhZCcpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW0pTIEZyYW1ld29ya10gRWFjaCBsaXN0IGl0ZW0gbXVzdCBiZSBhbiBvYmplY3QgaW4gb2xkLXN0eWxlIHJlcGVhdCwgJ1xuICAgICAgICAgICsgJ3BsZWFzZSB1c2UgYHJlcGVhdD17e3YgaW4gbGlzdH19YCBpbnN0ZWFkLicpXG4gICAgICAgIG1lcmdlZERhdGEgPSB7fVxuICAgICAgICBtZXJnZWREYXRhW2tleU5hbWVdID0gaW5kZXhcbiAgICAgICAgbWVyZ2VkRGF0YVt2YWx1ZU5hbWVdID0gaXRlbVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1lcmdlZERhdGEgPSB7fVxuICAgICAgbWVyZ2VkRGF0YVtrZXlOYW1lXSA9IGluZGV4XG4gICAgICBtZXJnZWREYXRhW3ZhbHVlTmFtZV0gPSBpdGVtXG4gICAgfVxuICAgIGNvbnN0IG5ld0NvbnRleHQgPSBtZXJnZUNvbnRleHQoY29udGV4dCwgbWVyZ2VkRGF0YSlcbiAgICB2bXMucHVzaChuZXdDb250ZXh0KVxuICAgIGNvbXBpbGUobmV3Q29udGV4dCwgdGFyZ2V0LCBmcmFnQmxvY2ssIHsgcmVwZWF0OiBpdGVtIH0pXG4gIH1cblxuICBjb25zdCBsaXN0ID0gd2F0Y2hCbG9jayh2bSwgZnJhZ0Jsb2NrLCBnZXR0ZXIsICdyZXBlYXQnLFxuICAgIChkYXRhKSA9PiB7XG4gICAgICBjb25zb2xlLmRlYnVnKCdbSlMgRnJhbWV3b3JrXSB0aGUgXCJyZXBlYXRcIiBpdGVtIGhhcyBjaGFuZ2VkJywgZGF0YSlcbiAgICAgIGlmICghZnJhZ0Jsb2NrIHx8ICFkYXRhKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCBvbGRDaGlsZHJlbiA9IGNoaWxkcmVuLnNsaWNlKClcbiAgICAgIGNvbnN0IG9sZFZtcyA9IHZtcy5zbGljZSgpXG4gICAgICBjb25zdCBvbGREYXRhID0gZnJhZ0Jsb2NrLmRhdGEuc2xpY2UoKVxuICAgICAgLy8gMS4gY29sbGVjdCBhbGwgbmV3IHJlZnMgdHJhY2sgYnlcbiAgICAgIGNvbnN0IHRyYWNrTWFwID0ge31cbiAgICAgIGNvbnN0IHJldXNlZE1hcCA9IHt9XG4gICAgICBkYXRhLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGtleSA9IHRyYWNrQnkgPyBpdGVtW3RyYWNrQnldIDogKG9sZFN0eWxlID8gaXRlbVtrZXlOYW1lXSA6IGluZGV4KVxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgaWYgKGtleSA9PSBudWxsIHx8IGtleSA9PT0gJycpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0cmFja01hcFtrZXldID0gaXRlbVxuICAgICAgfSlcblxuICAgICAgLy8gMi4gcmVtb3ZlIHVudXNlZCBlbGVtZW50IGZvcmVhY2ggb2xkIGl0ZW1cbiAgICAgIGNvbnN0IHJldXNlZExpc3QgPSBbXVxuICAgICAgb2xkRGF0YS5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBrZXkgPSB0cmFja0J5ID8gaXRlbVt0cmFja0J5XSA6IChvbGRTdHlsZSA/IGl0ZW1ba2V5TmFtZV0gOiBpbmRleClcbiAgICAgICAgaWYgKHRyYWNrTWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICByZXVzZWRNYXBba2V5XSA9IHtcbiAgICAgICAgICAgIGl0ZW0sIGluZGV4LCBrZXksXG4gICAgICAgICAgICB0YXJnZXQ6IG9sZENoaWxkcmVuW2luZGV4XSxcbiAgICAgICAgICAgIHZtOiBvbGRWbXNbaW5kZXhdXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldXNlZExpc3QucHVzaChpdGVtKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJlbW92ZVRhcmdldCh2bSwgb2xkQ2hpbGRyZW5baW5kZXhdKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyAzLiBjcmVhdGUgbmV3IGVsZW1lbnQgZm9yZWFjaCBuZXcgaXRlbVxuICAgICAgY2hpbGRyZW4ubGVuZ3RoID0gMFxuICAgICAgdm1zLmxlbmd0aCA9IDBcbiAgICAgIGZyYWdCbG9jay5kYXRhID0gZGF0YS5zbGljZSgpXG4gICAgICBmcmFnQmxvY2sudXBkYXRlTWFyayA9IGZyYWdCbG9jay5zdGFydFxuXG4gICAgICBkYXRhLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGtleSA9IHRyYWNrQnkgPyBpdGVtW3RyYWNrQnldIDogKG9sZFN0eWxlID8gaXRlbVtrZXlOYW1lXSA6IGluZGV4KVxuICAgICAgICBjb25zdCByZXVzZWQgPSByZXVzZWRNYXBba2V5XVxuICAgICAgICBpZiAocmV1c2VkKSB7XG4gICAgICAgICAgaWYgKHJldXNlZC5pdGVtID09PSByZXVzZWRMaXN0WzBdKSB7XG4gICAgICAgICAgICByZXVzZWRMaXN0LnNoaWZ0KClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXVzZWRMaXN0LiRyZW1vdmUocmV1c2VkLml0ZW0pXG4gICAgICAgICAgICBtb3ZlVGFyZ2V0KHZtLCByZXVzZWQudGFyZ2V0LCBmcmFnQmxvY2sudXBkYXRlTWFyaywgdHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgY2hpbGRyZW4ucHVzaChyZXVzZWQudGFyZ2V0KVxuICAgICAgICAgIHZtcy5wdXNoKHJldXNlZC52bSlcbiAgICAgICAgICBpZiAob2xkU3R5bGUpIHtcbiAgICAgICAgICAgIHJldXNlZC52bSA9IGl0ZW1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXVzZWQudm1bdmFsdWVOYW1lXSA9IGl0ZW1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV1c2VkLnZtW2tleU5hbWVdID0gaW5kZXhcbiAgICAgICAgICBmcmFnQmxvY2sudXBkYXRlTWFyayA9IHJldXNlZC50YXJnZXRcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBjb21waWxlSXRlbShpdGVtLCBpbmRleCwgdm0pXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGRlbGV0ZSBmcmFnQmxvY2sudXBkYXRlTWFya1xuICAgIH1cbiAgKVxuXG4gIGZyYWdCbG9jay5kYXRhID0gbGlzdC5zbGljZSgwKVxuICBsaXN0LmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgY29tcGlsZUl0ZW0oaXRlbSwgaW5kZXgsIHZtKVxuICB9KVxufVxuXG4vKipcbiAqIFdhdGNoIHRoZSBkaXNwbGF5IHVwZGF0ZSBhbmQgYWRkL3JlbW92ZSB0aGUgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9IHRhcmdldFxuICogQHBhcmFtICB7b2JqZWN0fSBmcmFnQmxvY2tcbiAqIEBwYXJhbSAge29iamVjdH0gY29udGV4dFxuICovXG5mdW5jdGlvbiBiaW5kU2hvd24gKHZtLCB0YXJnZXQsIGZyYWdCbG9jaywgbWV0YSkge1xuICBjb25zdCBkaXNwbGF5ID0gd2F0Y2hCbG9jayh2bSwgZnJhZ0Jsb2NrLCB0YXJnZXQuc2hvd24sICdzaG93bicsXG4gICAgKGRpc3BsYXkpID0+IHtcbiAgICAgIGNvbnNvbGUuZGVidWcoJ1tKUyBGcmFtZXdvcmtdIHRoZSBcImlmXCIgaXRlbSB3YXMgY2hhbmdlZCcsIGRpc3BsYXkpXG5cbiAgICAgIGlmICghZnJhZ0Jsb2NrIHx8ICEhZnJhZ0Jsb2NrLmRpc3BsYXkgPT09ICEhZGlzcGxheSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGZyYWdCbG9jay5kaXNwbGF5ID0gISFkaXNwbGF5XG4gICAgICBpZiAoZGlzcGxheSkge1xuICAgICAgICBjb21waWxlKHZtLCB0YXJnZXQsIGZyYWdCbG9jaywgbWV0YSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByZW1vdmVUYXJnZXQodm0sIGZyYWdCbG9jaywgdHJ1ZSlcbiAgICAgIH1cbiAgICB9XG4gIClcblxuICBmcmFnQmxvY2suZGlzcGxheSA9ICEhZGlzcGxheVxuICBpZiAoZGlzcGxheSkge1xuICAgIGNvbXBpbGUodm0sIHRhcmdldCwgZnJhZ0Jsb2NrLCBtZXRhKVxuICB9XG59XG5cbi8qKlxuICogV2F0Y2ggY2FsYyB2YWx1ZSBjaGFuZ2VzIGFuZCBhcHBlbmQgY2VydGFpbiB0eXBlIGFjdGlvbiB0byBkaWZmZXIuXG4gKiBJdCBpcyB1c2VkIGZvciBpZiBvciByZXBlYXQgZGF0YS1iaW5kaW5nIGdlbmVyYXRvci5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgZnJhZ0Jsb2NrXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gY2FsY1xuICogQHBhcmFtICB7c3RyaW5nfSAgIHR5cGVcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBoYW5kbGVyXG4gKiBAcmV0dXJuIHthbnl9ICAgICAgaW5pdCB2YWx1ZSBvZiBjYWxjXG4gKi9cbmZ1bmN0aW9uIHdhdGNoQmxvY2sgKHZtLCBmcmFnQmxvY2ssIGNhbGMsIHR5cGUsIGhhbmRsZXIpIHtcbiAgY29uc3QgZGlmZmVyID0gdm0gJiYgdm0uX2FwcCAmJiB2bS5fYXBwLmRpZmZlclxuICBjb25zdCBjb25maWcgPSB7fVxuICBjb25zdCBkZXB0aCA9IChmcmFnQmxvY2suZWxlbWVudC5kZXB0aCB8fCAwKSArIDFcblxuICByZXR1cm4gd2F0Y2godm0sIGNhbGMsICh2YWx1ZSkgPT4ge1xuICAgIGNvbmZpZy5sYXRlc3RWYWx1ZSA9IHZhbHVlXG4gICAgaWYgKGRpZmZlciAmJiAhY29uZmlnLnJlY29yZGVkKSB7XG4gICAgICBkaWZmZXIuYXBwZW5kKHR5cGUsIGRlcHRoLCBmcmFnQmxvY2suYmxvY2tJZCwgKCkgPT4ge1xuICAgICAgICBjb25zdCBsYXRlc3RWYWx1ZSA9IGNvbmZpZy5sYXRlc3RWYWx1ZVxuICAgICAgICBoYW5kbGVyKGxhdGVzdFZhbHVlKVxuICAgICAgICBjb25maWcucmVjb3JkZWQgPSBmYWxzZVxuICAgICAgICBjb25maWcubGF0ZXN0VmFsdWUgPSB1bmRlZmluZWRcbiAgICAgIH0pXG4gICAgfVxuICAgIGNvbmZpZy5yZWNvcmRlZCA9IHRydWVcbiAgfSlcbn1cblxuLyoqXG4gKiBDbG9uZSBhIGNvbnRleHQgYW5kIG1lcmdlIGNlcnRhaW4gZGF0YS5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9IG1lcmdlZERhdGFcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZnVuY3Rpb24gbWVyZ2VDb250ZXh0IChjb250ZXh0LCBtZXJnZWREYXRhKSB7XG4gIGNvbnN0IG5ld0NvbnRleHQgPSBPYmplY3QuY3JlYXRlKGNvbnRleHQpXG4gIG5ld0NvbnRleHQuX2RhdGEgPSBtZXJnZWREYXRhXG4gIGluaXREYXRhKG5ld0NvbnRleHQpXG4gIGluaXRDb21wdXRlZChuZXdDb250ZXh0KVxuICBuZXdDb250ZXh0Ll9yZWFsUGFyZW50ID0gY29udGV4dFxuICBpZiAoY29udGV4dC5fc3RhdGljKSB7XG4gICAgbmV3Q29udGV4dC5fc3RhdGljID0gY29udGV4dC5fc3RhdGljXG4gIH1cbiAgcmV0dXJuIG5ld0NvbnRleHRcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBFdmVyeXRoaW5nIGFib3V0IGNvbXBvbmVudCBldmVudCB3aGljaCBpbmNsdWRlcyBldmVudCBvYmplY3QsIGV2ZW50IGxpc3RlbmVyLFxuICogZXZlbnQgZW1pdHRlciBhbmQgbGlmZWN5Y2xlIGhvb2tzLlxuICovXG5cbi8qKlxuICogRXZlbnQgb2JqZWN0IGRlZmluaXRpb24uIEFuIGV2ZW50IG9iamVjdCBoYXMgYHR5cGVgLCBgdGltZXN0YW1wYCBhbmRcbiAqIGBkZXRhaWxgIGZyb20gd2hpY2ggYSBjb21wb25lbnQgZW1pdC4gVGhlIGV2ZW50IG9iamVjdCBjb3VsZCBiZSBkaXNwYXRjaGVkIHRvXG4gKiBwYXJlbnRzIG9yIGJyb2FkY2FzdGVkIHRvIGNoaWxkcmVuIGV4Y2VwdCBgdGhpcy5zdG9wKClgIGlzIGNhbGxlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge2FueX0gICAgZGV0YWlsXG4gKi9cbmZ1bmN0aW9uIEV2dCAodHlwZSwgZGV0YWlsKSB7XG4gIGlmIChkZXRhaWwgaW5zdGFuY2VvZiBFdnQpIHtcbiAgICByZXR1cm4gZGV0YWlsXG4gIH1cblxuICB0aGlzLnRpbWVzdGFtcCA9IERhdGUubm93KClcbiAgdGhpcy5kZXRhaWwgPSBkZXRhaWxcbiAgdGhpcy50eXBlID0gdHlwZVxuXG4gIGxldCBzaG91bGRTdG9wID0gZmFsc2VcblxuICAvKipcbiAgICogc3RvcCBkaXNwYXRjaCBhbmQgYnJvYWRjYXN0XG4gICAqL1xuICB0aGlzLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgc2hvdWxkU3RvcCA9IHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBjaGVjayBpZiBpdCBjYW4ndCBiZSBkaXNwYXRjaGVkIG9yIGJyb2FkY2FzdGVkXG4gICAqL1xuICB0aGlzLmhhc1N0b3BwZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHNob3VsZFN0b3BcbiAgfVxufVxuXG4vKipcbiAqIEVtaXQgYW4gZXZlbnQgYnV0IG5vdCBicm9hZGNhc3QgZG93biBvciBkaXNwYXRjaCB1cC5cbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICogQHBhcmFtICB7YW55fSAgICBkZXRhaWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICRlbWl0ICh0eXBlLCBkZXRhaWwpIHtcbiAgY29uc3QgZXZlbnRzID0gdGhpcy5fdm1FdmVudHNcbiAgY29uc3QgaGFuZGxlckxpc3QgPSBldmVudHNbdHlwZV1cbiAgaWYgKGhhbmRsZXJMaXN0KSB7XG4gICAgY29uc3QgZXZ0ID0gbmV3IEV2dCh0eXBlLCBkZXRhaWwpXG4gICAgaGFuZGxlckxpc3QuZm9yRWFjaCgoaGFuZGxlcikgPT4ge1xuICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGV2dClcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCBhbmQgZGlzcGF0Y2ggaXQgdXAuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSAge2FueX0gICAgZGV0YWlsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkZGlzcGF0Y2ggKHR5cGUsIGRldGFpbCkge1xuICBjb25zdCBldnQgPSBuZXcgRXZ0KHR5cGUsIGRldGFpbClcbiAgdGhpcy4kZW1pdCh0eXBlLCBldnQpXG5cbiAgaWYgKCFldnQuaGFzU3RvcHBlZCgpICYmIHRoaXMuX3BhcmVudCAmJiB0aGlzLl9wYXJlbnQuJGRpc3BhdGNoKSB7XG4gICAgdGhpcy5fcGFyZW50LiRkaXNwYXRjaCh0eXBlLCBldnQpXG4gIH1cbn1cblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IGFuZCBicm9hZGNhc3QgaXQgZG93bi5cbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZVxuICogQHBhcmFtICB7YW55fSAgICBkZXRhaWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICRicm9hZGNhc3QgKHR5cGUsIGRldGFpbCkge1xuICBjb25zdCBldnQgPSBuZXcgRXZ0KHR5cGUsIGRldGFpbClcbiAgdGhpcy4kZW1pdCh0eXBlLCBldnQpXG5cbiAgaWYgKCFldnQuaGFzU3RvcHBlZCgpICYmIHRoaXMuX2NoaWxkcmVuVm1zKSB7XG4gICAgdGhpcy5fY2hpbGRyZW5WbXMuZm9yRWFjaCgoc3ViVm0pID0+IHtcbiAgICAgIHN1YlZtLiRicm9hZGNhc3QodHlwZSwgZXZ0KVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBBZGQgZXZlbnQgbGlzdGVuZXIuXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdHlwZVxuICogQHBhcmFtICB7ZnVuY3Rpb259IGhhbmRsZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICRvbiAodHlwZSwgaGFuZGxlcikge1xuICBpZiAoIXR5cGUgfHwgdHlwZW9mIGhhbmRsZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBldmVudHMgPSB0aGlzLl92bUV2ZW50c1xuICBjb25zdCBoYW5kbGVyTGlzdCA9IGV2ZW50c1t0eXBlXSB8fCBbXVxuICBoYW5kbGVyTGlzdC5wdXNoKGhhbmRsZXIpXG4gIGV2ZW50c1t0eXBlXSA9IGhhbmRsZXJMaXN0XG5cbiAgLy8gZml4ZWQgb2xkIHZlcnNpb24gbGlmZWN5Y2xlIGRlc2lnblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHR5cGUgPT09ICdob29rOnJlYWR5JyAmJiB0aGlzLl9yZWFkeSkge1xuICAgIHRoaXMuJGVtaXQoJ2hvb2s6cmVhZHknKVxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVyLlxuICogQHBhcmFtICB7c3RyaW5nfSAgIHR5cGVcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkb2ZmICh0eXBlLCBoYW5kbGVyKSB7XG4gIGlmICghdHlwZSkge1xuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGV2ZW50cyA9IHRoaXMuX3ZtRXZlbnRzXG4gIGlmICghaGFuZGxlcikge1xuICAgIGRlbGV0ZSBldmVudHNbdHlwZV1cbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBoYW5kbGVyTGlzdCA9IGV2ZW50c1t0eXBlXVxuICBpZiAoIWhhbmRsZXJMaXN0KSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaGFuZGxlckxpc3QuJHJlbW92ZShoYW5kbGVyKVxufVxuXG5jb25zdCBMSUZFX0NZQ0xFX1RZUEVTID0gWydpbml0JywgJ2NyZWF0ZWQnLCAncmVhZHknLCAnZGVzdHJveWVkJ11cblxuLyoqXG4gKiBJbml0IGV2ZW50czpcbiAqIDEuIGxpc3RlbiBgZXZlbnRzYCBpbiBjb21wb25lbnQgb3B0aW9ucyAmIGBleHRlcm5hbEV2ZW50c2AuXG4gKiAyLiBiaW5kIGxpZmVjeWNsZSBob29rcy5cbiAqIEBwYXJhbSAge1ZtfSAgICAgdm1cbiAqIEBwYXJhbSAge29iamVjdH0gZXh0ZXJuYWxFdmVudHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRFdmVudHMgKHZtLCBleHRlcm5hbEV2ZW50cykge1xuICBjb25zdCBvcHRpb25zID0gdm0uX29wdGlvbnMgfHwge31cbiAgY29uc3QgZXZlbnRzID0gb3B0aW9ucy5ldmVudHMgfHwge31cbiAgZm9yIChjb25zdCB0eXBlMSBpbiBldmVudHMpIHtcbiAgICB2bS4kb24odHlwZTEsIGV2ZW50c1t0eXBlMV0pXG4gIH1cbiAgZm9yIChjb25zdCB0eXBlMiBpbiBleHRlcm5hbEV2ZW50cykge1xuICAgIHZtLiRvbih0eXBlMiwgZXh0ZXJuYWxFdmVudHNbdHlwZTJdKVxuICB9XG4gIExJRkVfQ1lDTEVfVFlQRVMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgIHZtLiRvbihgaG9vazoke3R5cGV9YCwgb3B0aW9uc1t0eXBlXSlcbiAgfSlcbn1cblxuLyoqXG4gKiBCaW5kIGV2ZW50IHJlbGF0ZWQgbWV0aG9kcyB0byBWaWV3TW9kZWwgaW5zdGFuY2UuXG4gKiBAcGFyYW0gIHtWbX0gdm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1peGluRXZlbnRzICh2bSkge1xuICB2bS4kZW1pdCA9ICRlbWl0XG4gIHZtLiRkaXNwYXRjaCA9ICRkaXNwYXRjaFxuICB2bS4kYnJvYWRjYXN0ID0gJGJyb2FkY2FzdFxuICB2bS4kb24gPSAkb25cbiAgdm0uJG9mZiA9ICRvZmZcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBWaWV3TW9kZWwgQ29uc3RydWN0b3IgJiBkZWZpbml0aW9uXG4gKi9cblxuaW1wb3J0IHsgZXh0ZW5kIH0gZnJvbSAnLi4vdXRpbC9pbmRleCdcbmltcG9ydCB7XG4gIGluaXRTdGF0ZVxufSBmcm9tICcuLi9jb3JlL3N0YXRlJ1xuaW1wb3J0IHtcbiAgYnVpbGRcbn0gZnJvbSAnLi9jb21waWxlcidcbmltcG9ydCB7XG4gIHNldCxcbiAgZGVsXG59IGZyb20gJy4uL2NvcmUvb2JzZXJ2ZXInXG5pbXBvcnQge1xuICB3YXRjaFxufSBmcm9tICcuL2RpcmVjdGl2ZSdcbmltcG9ydCB7XG4gIGluaXRFdmVudHMsXG4gIG1peGluRXZlbnRzXG59IGZyb20gJy4vZXZlbnRzJ1xuXG4vKipcbiAqIFZpZXdNb2RlbCBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAgICBjb21wb25lbnQgb3B0aW9uc1xuICogQHBhcmFtIHtvYmplY3R9IHBhcmVudFZtICAgd2hpY2ggY29udGFpbnMgX2FwcFxuICogQHBhcmFtIHtvYmplY3R9IHBhcmVudEVsICAgcm9vdCBlbGVtZW50IG9yIGZyYWcgYmxvY2tcbiAqIEBwYXJhbSB7b2JqZWN0fSBtZXJnZWREYXRhIGV4dGVybmFsIGRhdGFcbiAqIEBwYXJhbSB7b2JqZWN0fSBleHRlcm5hbEV2ZW50cyBleHRlcm5hbCBldmVudHNcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gVm0gKFxuICB0eXBlLFxuICBvcHRpb25zLFxuICBwYXJlbnRWbSxcbiAgcGFyZW50RWwsXG4gIG1lcmdlZERhdGEsXG4gIGV4dGVybmFsRXZlbnRzXG4pIHtcbiAgcGFyZW50Vm0gPSBwYXJlbnRWbSB8fCB7fVxuICB0aGlzLl9wYXJlbnQgPSBwYXJlbnRWbS5fcmVhbFBhcmVudCA/IHBhcmVudFZtLl9yZWFsUGFyZW50IDogcGFyZW50Vm1cbiAgdGhpcy5fYXBwID0gcGFyZW50Vm0uX2FwcCB8fCB7fVxuICBwYXJlbnRWbS5fY2hpbGRyZW5WbXMgJiYgcGFyZW50Vm0uX2NoaWxkcmVuVm1zLnB1c2godGhpcylcblxuICBpZiAoIW9wdGlvbnMgJiYgdGhpcy5fYXBwLmN1c3RvbUNvbXBvbmVudE1hcCkge1xuICAgIG9wdGlvbnMgPSB0aGlzLl9hcHAuY3VzdG9tQ29tcG9uZW50TWFwW3R5cGVdXG4gIH1cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuICBjb25zdCBkYXRhID0gb3B0aW9ucy5kYXRhIHx8IHt9XG5cbiAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnNcbiAgdGhpcy5fbWV0aG9kcyA9IG9wdGlvbnMubWV0aG9kcyB8fCB7fVxuICB0aGlzLl9jb21wdXRlZCA9IG9wdGlvbnMuY29tcHV0ZWQgfHwge31cbiAgdGhpcy5fY3NzID0gb3B0aW9ucy5zdHlsZSB8fCB7fVxuICB0aGlzLl9pZHMgPSB7fVxuICB0aGlzLl92bUV2ZW50cyA9IHt9XG4gIHRoaXMuX2NoaWxkcmVuVm1zID0gW11cbiAgdGhpcy5fdHlwZSA9IHR5cGVcblxuICAvLyBiaW5kIGV2ZW50cyBhbmQgbGlmZWN5Y2xlc1xuICBpbml0RXZlbnRzKHRoaXMsIGV4dGVybmFsRXZlbnRzKVxuXG4gIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIFwiaW5pdFwiIGxpZmVjeWNsZSBpbiBWbSgke3RoaXMuX3R5cGV9KWApXG4gIHRoaXMuJGVtaXQoJ2hvb2s6aW5pdCcpXG4gIHRoaXMuX2luaXRlZCA9IHRydWVcblxuICAvLyBwcm94eSBkYXRhIGFuZCBtZXRob2RzXG4gIC8vIG9ic2VydmUgZGF0YSBhbmQgYWRkIHRoaXMgdG8gdm1zXG4gIHRoaXMuX2RhdGEgPSB0eXBlb2YgZGF0YSA9PT0gJ2Z1bmN0aW9uJyA/IGRhdGEoKSA6IGRhdGFcbiAgaWYgKG1lcmdlZERhdGEpIHtcbiAgICBleHRlbmQodGhpcy5fZGF0YSwgbWVyZ2VkRGF0YSlcbiAgfVxuICBpbml0U3RhdGUodGhpcylcblxuICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBcImNyZWF0ZWRcIiBsaWZlY3ljbGUgaW4gVm0oJHt0aGlzLl90eXBlfSlgKVxuICB0aGlzLiRlbWl0KCdob29rOmNyZWF0ZWQnKVxuICB0aGlzLl9jcmVhdGVkID0gdHJ1ZVxuXG4gIC8vIGJhY2t3YXJkIG9sZCByZWFkeSBlbnRyeVxuICBpZiAob3B0aW9ucy5tZXRob2RzICYmIG9wdGlvbnMubWV0aG9kcy5yZWFkeSkge1xuICAgIGNvbnNvbGUud2FybignXCJleHBvcnRzLm1ldGhvZHMucmVhZHlcIiBpcyBkZXByZWNhdGVkLCAnICtcbiAgICAgICdwbGVhc2UgdXNlIFwiZXhwb3J0cy5jcmVhdGVkXCIgaW5zdGVhZCcpXG4gICAgb3B0aW9ucy5tZXRob2RzLnJlYWR5LmNhbGwodGhpcylcbiAgfVxuXG4gIGlmICghdGhpcy5fYXBwLmRvYykge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy8gaWYgbm8gcGFyZW50RWxlbWVudCB0aGVuIHNwZWNpZnkgdGhlIGRvY3VtZW50RWxlbWVudFxuICB0aGlzLl9wYXJlbnRFbCA9IHBhcmVudEVsIHx8IHRoaXMuX2FwcC5kb2MuZG9jdW1lbnRFbGVtZW50XG4gIGJ1aWxkKHRoaXMpXG59XG5cbm1peGluRXZlbnRzKFZtLnByb3RvdHlwZSlcblxuLyoqXG4gKiBXYXRjaCBhbiBmdW5jdGlvbiBhbmQgYmluZCBhbGwgdGhlIGRhdGEgYXBwZWFyZWQgaW4gaXQuIFdoZW4gdGhlIHJlbGF0ZWRcbiAqIGRhdGEgY2hhbmdlcywgdGhlIGNhbGxiYWNrIHdpbGwgYmUgY2FsbGVkIHdpdGggbmV3IHZhbHVlIGFzIDFzdCBwYXJhbS5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuVm0ucHJvdG90eXBlLiR3YXRjaCA9IGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgd2F0Y2godGhpcywgZm4sIGNhbGxiYWNrKVxufVxuXG5WbS5zZXQgPSBzZXRcblZtLmRlbGV0ZSA9IGRlbFxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5sZXQgbmF0aXZlTW9kdWxlcyA9IHt9XG5cbi8vIGZvciB0ZXN0aW5nXG5cbi8qKlxuICogZm9yIHRlc3RpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZHVsZSAobW9kdWxlTmFtZSkge1xuICByZXR1cm4gbmF0aXZlTW9kdWxlc1ttb2R1bGVOYW1lXVxufVxuXG4vKipcbiAqIGZvciB0ZXN0aW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhck1vZHVsZXMgKCkge1xuICBuYXRpdmVNb2R1bGVzID0ge31cbn1cblxuLy8gZm9yIGZyYW1ld29ya1xuXG4vKipcbiAqIGluaXQgbW9kdWxlcyBmb3IgYW4gYXBwIGluc3RhbmNlXG4gKiB0aGUgc2Vjb25kIHBhcmFtIGRldGVybWluZXMgd2hldGhlciB0byByZXBsYWNlIGFuIGV4aXN0ZWQgbWV0aG9kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0TW9kdWxlcyAobW9kdWxlcywgaWZSZXBsYWNlKSB7XG4gIGZvciAoY29uc3QgbW9kdWxlTmFtZSBpbiBtb2R1bGVzKSB7XG4gICAgLy8gaW5pdCBgbW9kdWxlc1ttb2R1bGVOYW1lXVtdYFxuICAgIGxldCBtZXRob2RzID0gbmF0aXZlTW9kdWxlc1ttb2R1bGVOYW1lXVxuICAgIGlmICghbWV0aG9kcykge1xuICAgICAgbWV0aG9kcyA9IHt9XG4gICAgICBuYXRpdmVNb2R1bGVzW21vZHVsZU5hbWVdID0gbWV0aG9kc1xuICAgIH1cblxuICAgIC8vIHB1c2ggZWFjaCBub24tZXhpc3RlZCBuZXcgbWV0aG9kXG4gICAgbW9kdWxlc1ttb2R1bGVOYW1lXS5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSAnc3RyaW5nJykge1xuICAgICAgICBtZXRob2QgPSB7XG4gICAgICAgICAgbmFtZTogbWV0aG9kXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFtZXRob2RzW21ldGhvZC5uYW1lXSB8fCBpZlJlcGxhY2UpIHtcbiAgICAgICAgbWV0aG9kc1ttZXRob2QubmFtZV0gPSBtZXRob2RcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogaW5pdCBhcHAgbWV0aG9kc1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdE1ldGhvZHMgKFZtLCBhcGlzKSB7XG4gIGNvbnN0IHAgPSBWbS5wcm90b3R5cGVcblxuICBmb3IgKGNvbnN0IGFwaU5hbWUgaW4gYXBpcykge1xuICAgIGlmICghcC5oYXNPd25Qcm9wZXJ0eShhcGlOYW1lKSkge1xuICAgICAgcFthcGlOYW1lXSA9IGFwaXNbYXBpTmFtZV1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBnZXQgYSBtb2R1bGUgb2YgbWV0aG9kcyBmb3IgYW4gYXBwIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXF1aXJlTW9kdWxlIChhcHAsIG5hbWUpIHtcbiAgY29uc3QgbWV0aG9kcyA9IG5hdGl2ZU1vZHVsZXNbbmFtZV1cbiAgY29uc3QgdGFyZ2V0ID0ge31cbiAgZm9yIChjb25zdCBtZXRob2ROYW1lIGluIG1ldGhvZHMpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBtZXRob2ROYW1lLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbiBtb2R1bGVHZXR0ZXIgKCkge1xuICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IGFwcC5jYWxsVGFza3Moe1xuICAgICAgICAgIG1vZHVsZTogbmFtZSxcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZE5hbWUsXG4gICAgICAgICAgYXJnczogYXJnc1xuICAgICAgICB9KVxuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24gbW9kdWxlU2V0dGVyICh2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgcmV0dXJuIGFwcC5jYWxsVGFza3Moe1xuICAgICAgICAgICAgbW9kdWxlOiBuYW1lLFxuICAgICAgICAgICAgbWV0aG9kOiBtZXRob2ROYW1lLFxuICAgICAgICAgICAgYXJnczogW3ZhbHVlXVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHJldHVybiB0YXJnZXRcbn1cblxuLyoqXG4gKiBnZXQgYSBjdXN0b20gY29tcG9uZW50IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcXVpcmVDdXN0b21Db21wb25lbnQgKGFwcCwgbmFtZSkge1xuICBjb25zdCB7IGN1c3RvbUNvbXBvbmVudE1hcCB9ID0gYXBwXG4gIHJldHVybiBjdXN0b21Db21wb25lbnRNYXBbbmFtZV1cbn1cblxuLyoqXG4gKiByZWdpc3RlciBhIGN1c3RvbSBjb21wb25lbnQgb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDdXN0b21Db21wb25lbnQgKGFwcCwgbmFtZSwgZGVmKSB7XG4gIGNvbnN0IHsgY3VzdG9tQ29tcG9uZW50TWFwIH0gPSBhcHBcblxuICBpZiAoY3VzdG9tQ29tcG9uZW50TWFwW25hbWVdKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gZGVmaW5lIGEgY29tcG9uZW50KCR7bmFtZX0pIHRoYXQgYWxyZWFkeSBleGlzdHNgKVxuICAgIHJldHVyblxuICB9XG5cbiAgY3VzdG9tQ29tcG9uZW50TWFwW25hbWVdID0gZGVmXG59XG4iLCJleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBTZW1WZXI7XG5cbi8vIFRoZSBkZWJ1ZyBmdW5jdGlvbiBpcyBleGNsdWRlZCBlbnRpcmVseSBmcm9tIHRoZSBtaW5pZmllZCB2ZXJzaW9uLlxuLyogbm9taW4gKi8gdmFyIGRlYnVnO1xuLyogbm9taW4gKi8gaWYgKHR5cGVvZiBwcm9jZXNzID09PSAnb2JqZWN0JyAmJlxuICAgIC8qIG5vbWluICovIHByb2Nlc3MuZW52ICYmXG4gICAgLyogbm9taW4gKi8gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyAmJlxuICAgIC8qIG5vbWluICovIC9cXGJzZW12ZXJcXGIvaS50ZXN0KHByb2Nlc3MuZW52Lk5PREVfREVCVUcpKVxuICAvKiBub21pbiAqLyBkZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuICAgIC8qIG5vbWluICovIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAvKiBub21pbiAqLyBhcmdzLnVuc2hpZnQoJ1NFTVZFUicpO1xuICAgIC8qIG5vbWluICovIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICAgIC8qIG5vbWluICovIH07XG4vKiBub21pbiAqLyBlbHNlXG4gIC8qIG5vbWluICovIGRlYnVnID0gZnVuY3Rpb24oKSB7fTtcblxuLy8gTm90ZTogdGhpcyBpcyB0aGUgc2VtdmVyLm9yZyB2ZXJzaW9uIG9mIHRoZSBzcGVjIHRoYXQgaXQgaW1wbGVtZW50c1xuLy8gTm90IG5lY2Vzc2FyaWx5IHRoZSBwYWNrYWdlIHZlcnNpb24gb2YgdGhpcyBjb2RlLlxuZXhwb3J0cy5TRU1WRVJfU1BFQ19WRVJTSU9OID0gJzIuMC4wJztcblxudmFyIE1BWF9MRU5HVEggPSAyNTY7XG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSIHx8IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8vIFRoZSBhY3R1YWwgcmVnZXhwcyBnbyBvbiBleHBvcnRzLnJlXG52YXIgcmUgPSBleHBvcnRzLnJlID0gW107XG52YXIgc3JjID0gZXhwb3J0cy5zcmMgPSBbXTtcbnZhciBSID0gMDtcblxuLy8gVGhlIGZvbGxvd2luZyBSZWd1bGFyIEV4cHJlc3Npb25zIGNhbiBiZSB1c2VkIGZvciB0b2tlbml6aW5nLFxuLy8gdmFsaWRhdGluZywgYW5kIHBhcnNpbmcgU2VtVmVyIHZlcnNpb24gc3RyaW5ncy5cblxuLy8gIyMgTnVtZXJpYyBJZGVudGlmaWVyXG4vLyBBIHNpbmdsZSBgMGAsIG9yIGEgbm9uLXplcm8gZGlnaXQgZm9sbG93ZWQgYnkgemVybyBvciBtb3JlIGRpZ2l0cy5cblxudmFyIE5VTUVSSUNJREVOVElGSUVSID0gUisrO1xuc3JjW05VTUVSSUNJREVOVElGSUVSXSA9ICcwfFsxLTldXFxcXGQqJztcbnZhciBOVU1FUklDSURFTlRJRklFUkxPT1NFID0gUisrO1xuc3JjW05VTUVSSUNJREVOVElGSUVSTE9PU0VdID0gJ1swLTldKyc7XG5cblxuLy8gIyMgTm9uLW51bWVyaWMgSWRlbnRpZmllclxuLy8gWmVybyBvciBtb3JlIGRpZ2l0cywgZm9sbG93ZWQgYnkgYSBsZXR0ZXIgb3IgaHlwaGVuLCBhbmQgdGhlbiB6ZXJvIG9yXG4vLyBtb3JlIGxldHRlcnMsIGRpZ2l0cywgb3IgaHlwaGVucy5cblxudmFyIE5PTk5VTUVSSUNJREVOVElGSUVSID0gUisrO1xuc3JjW05PTk5VTUVSSUNJREVOVElGSUVSXSA9ICdcXFxcZCpbYS16QS1aLV1bYS16QS1aMC05LV0qJztcblxuXG4vLyAjIyBNYWluIFZlcnNpb25cbi8vIFRocmVlIGRvdC1zZXBhcmF0ZWQgbnVtZXJpYyBpZGVudGlmaWVycy5cblxudmFyIE1BSU5WRVJTSU9OID0gUisrO1xuc3JjW01BSU5WRVJTSU9OXSA9ICcoJyArIHNyY1tOVU1FUklDSURFTlRJRklFUl0gKyAnKVxcXFwuJyArXG4gICAgICAgICAgICAgICAgICAgJygnICsgc3JjW05VTUVSSUNJREVOVElGSUVSXSArICcpXFxcXC4nICtcbiAgICAgICAgICAgICAgICAgICAnKCcgKyBzcmNbTlVNRVJJQ0lERU5USUZJRVJdICsgJyknO1xuXG52YXIgTUFJTlZFUlNJT05MT09TRSA9IFIrKztcbnNyY1tNQUlOVkVSU0lPTkxPT1NFXSA9ICcoJyArIHNyY1tOVU1FUklDSURFTlRJRklFUkxPT1NFXSArICcpXFxcXC4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcoJyArIHNyY1tOVU1FUklDSURFTlRJRklFUkxPT1NFXSArICcpXFxcXC4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcoJyArIHNyY1tOVU1FUklDSURFTlRJRklFUkxPT1NFXSArICcpJztcblxuLy8gIyMgUHJlLXJlbGVhc2UgVmVyc2lvbiBJZGVudGlmaWVyXG4vLyBBIG51bWVyaWMgaWRlbnRpZmllciwgb3IgYSBub24tbnVtZXJpYyBpZGVudGlmaWVyLlxuXG52YXIgUFJFUkVMRUFTRUlERU5USUZJRVIgPSBSKys7XG5zcmNbUFJFUkVMRUFTRUlERU5USUZJRVJdID0gJyg/OicgKyBzcmNbTlVNRVJJQ0lERU5USUZJRVJdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnfCcgKyBzcmNbTk9OTlVNRVJJQ0lERU5USUZJRVJdICsgJyknO1xuXG52YXIgUFJFUkVMRUFTRUlERU5USUZJRVJMT09TRSA9IFIrKztcbnNyY1tQUkVSRUxFQVNFSURFTlRJRklFUkxPT1NFXSA9ICcoPzonICsgc3JjW05VTUVSSUNJREVOVElGSUVSTE9PU0VdICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd8JyArIHNyY1tOT05OVU1FUklDSURFTlRJRklFUl0gKyAnKSc7XG5cblxuLy8gIyMgUHJlLXJlbGVhc2UgVmVyc2lvblxuLy8gSHlwaGVuLCBmb2xsb3dlZCBieSBvbmUgb3IgbW9yZSBkb3Qtc2VwYXJhdGVkIHByZS1yZWxlYXNlIHZlcnNpb25cbi8vIGlkZW50aWZpZXJzLlxuXG52YXIgUFJFUkVMRUFTRSA9IFIrKztcbnNyY1tQUkVSRUxFQVNFXSA9ICcoPzotKCcgKyBzcmNbUFJFUkVMRUFTRUlERU5USUZJRVJdICtcbiAgICAgICAgICAgICAgICAgICcoPzpcXFxcLicgKyBzcmNbUFJFUkVMRUFTRUlERU5USUZJRVJdICsgJykqKSknO1xuXG52YXIgUFJFUkVMRUFTRUxPT1NFID0gUisrO1xuc3JjW1BSRVJFTEVBU0VMT09TRV0gPSAnKD86LT8oJyArIHNyY1tQUkVSRUxFQVNFSURFTlRJRklFUkxPT1NFXSArXG4gICAgICAgICAgICAgICAgICAgICAgICcoPzpcXFxcLicgKyBzcmNbUFJFUkVMRUFTRUlERU5USUZJRVJMT09TRV0gKyAnKSopKSc7XG5cbi8vICMjIEJ1aWxkIE1ldGFkYXRhIElkZW50aWZpZXJcbi8vIEFueSBjb21iaW5hdGlvbiBvZiBkaWdpdHMsIGxldHRlcnMsIG9yIGh5cGhlbnMuXG5cbnZhciBCVUlMRElERU5USUZJRVIgPSBSKys7XG5zcmNbQlVJTERJREVOVElGSUVSXSA9ICdbMC05QS1aYS16LV0rJztcblxuLy8gIyMgQnVpbGQgTWV0YWRhdGFcbi8vIFBsdXMgc2lnbiwgZm9sbG93ZWQgYnkgb25lIG9yIG1vcmUgcGVyaW9kLXNlcGFyYXRlZCBidWlsZCBtZXRhZGF0YVxuLy8gaWRlbnRpZmllcnMuXG5cbnZhciBCVUlMRCA9IFIrKztcbnNyY1tCVUlMRF0gPSAnKD86XFxcXCsoJyArIHNyY1tCVUlMRElERU5USUZJRVJdICtcbiAgICAgICAgICAgICAnKD86XFxcXC4nICsgc3JjW0JVSUxESURFTlRJRklFUl0gKyAnKSopKSc7XG5cblxuLy8gIyMgRnVsbCBWZXJzaW9uIFN0cmluZ1xuLy8gQSBtYWluIHZlcnNpb24sIGZvbGxvd2VkIG9wdGlvbmFsbHkgYnkgYSBwcmUtcmVsZWFzZSB2ZXJzaW9uIGFuZFxuLy8gYnVpbGQgbWV0YWRhdGEuXG5cbi8vIE5vdGUgdGhhdCB0aGUgb25seSBtYWpvciwgbWlub3IsIHBhdGNoLCBhbmQgcHJlLXJlbGVhc2Ugc2VjdGlvbnMgb2Zcbi8vIHRoZSB2ZXJzaW9uIHN0cmluZyBhcmUgY2FwdHVyaW5nIGdyb3Vwcy4gIFRoZSBidWlsZCBtZXRhZGF0YSBpcyBub3QgYVxuLy8gY2FwdHVyaW5nIGdyb3VwLCBiZWNhdXNlIGl0IHNob3VsZCBub3QgZXZlciBiZSB1c2VkIGluIHZlcnNpb25cbi8vIGNvbXBhcmlzb24uXG5cbnZhciBGVUxMID0gUisrO1xudmFyIEZVTExQTEFJTiA9ICd2PycgKyBzcmNbTUFJTlZFUlNJT05dICtcbiAgICAgICAgICAgICAgICBzcmNbUFJFUkVMRUFTRV0gKyAnPycgK1xuICAgICAgICAgICAgICAgIHNyY1tCVUlMRF0gKyAnPyc7XG5cbnNyY1tGVUxMXSA9ICdeJyArIEZVTExQTEFJTiArICckJztcblxuLy8gbGlrZSBmdWxsLCBidXQgYWxsb3dzIHYxLjIuMyBhbmQgPTEuMi4zLCB3aGljaCBwZW9wbGUgZG8gc29tZXRpbWVzLlxuLy8gYWxzbywgMS4wLjBhbHBoYTEgKHByZXJlbGVhc2Ugd2l0aG91dCB0aGUgaHlwaGVuKSB3aGljaCBpcyBwcmV0dHlcbi8vIGNvbW1vbiBpbiB0aGUgbnBtIHJlZ2lzdHJ5LlxudmFyIExPT1NFUExBSU4gPSAnW3Y9XFxcXHNdKicgKyBzcmNbTUFJTlZFUlNJT05MT09TRV0gK1xuICAgICAgICAgICAgICAgICBzcmNbUFJFUkVMRUFTRUxPT1NFXSArICc/JyArXG4gICAgICAgICAgICAgICAgIHNyY1tCVUlMRF0gKyAnPyc7XG5cbnZhciBMT09TRSA9IFIrKztcbnNyY1tMT09TRV0gPSAnXicgKyBMT09TRVBMQUlOICsgJyQnO1xuXG52YXIgR1RMVCA9IFIrKztcbnNyY1tHVExUXSA9ICcoKD86PHw+KT89PyknO1xuXG4vLyBTb21ldGhpbmcgbGlrZSBcIjIuKlwiIG9yIFwiMS4yLnhcIi5cbi8vIE5vdGUgdGhhdCBcIngueFwiIGlzIGEgdmFsaWQgeFJhbmdlIGlkZW50aWZlciwgbWVhbmluZyBcImFueSB2ZXJzaW9uXCJcbi8vIE9ubHkgdGhlIGZpcnN0IGl0ZW0gaXMgc3RyaWN0bHkgcmVxdWlyZWQuXG52YXIgWFJBTkdFSURFTlRJRklFUkxPT1NFID0gUisrO1xuc3JjW1hSQU5HRUlERU5USUZJRVJMT09TRV0gPSBzcmNbTlVNRVJJQ0lERU5USUZJRVJMT09TRV0gKyAnfHh8WHxcXFxcKic7XG52YXIgWFJBTkdFSURFTlRJRklFUiA9IFIrKztcbnNyY1tYUkFOR0VJREVOVElGSUVSXSA9IHNyY1tOVU1FUklDSURFTlRJRklFUl0gKyAnfHh8WHxcXFxcKic7XG5cbnZhciBYUkFOR0VQTEFJTiA9IFIrKztcbnNyY1tYUkFOR0VQTEFJTl0gPSAnW3Y9XFxcXHNdKignICsgc3JjW1hSQU5HRUlERU5USUZJRVJdICsgJyknICtcbiAgICAgICAgICAgICAgICAgICAnKD86XFxcXC4oJyArIHNyY1tYUkFOR0VJREVOVElGSUVSXSArICcpJyArXG4gICAgICAgICAgICAgICAgICAgJyg/OlxcXFwuKCcgKyBzcmNbWFJBTkdFSURFTlRJRklFUl0gKyAnKScgK1xuICAgICAgICAgICAgICAgICAgICcoPzonICsgc3JjW1BSRVJFTEVBU0VdICsgJyk/JyArXG4gICAgICAgICAgICAgICAgICAgc3JjW0JVSUxEXSArICc/JyArXG4gICAgICAgICAgICAgICAgICAgJyk/KT8nO1xuXG52YXIgWFJBTkdFUExBSU5MT09TRSA9IFIrKztcbnNyY1tYUkFOR0VQTEFJTkxPT1NFXSA9ICdbdj1cXFxcc10qKCcgKyBzcmNbWFJBTkdFSURFTlRJRklFUkxPT1NFXSArICcpJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnKD86XFxcXC4oJyArIHNyY1tYUkFOR0VJREVOVElGSUVSTE9PU0VdICsgJyknICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcoPzpcXFxcLignICsgc3JjW1hSQU5HRUlERU5USUZJRVJMT09TRV0gKyAnKScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyg/OicgKyBzcmNbUFJFUkVMRUFTRUxPT1NFXSArICcpPycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjW0JVSUxEXSArICc/JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnKT8pPyc7XG5cbnZhciBYUkFOR0UgPSBSKys7XG5zcmNbWFJBTkdFXSA9ICdeJyArIHNyY1tHVExUXSArICdcXFxccyonICsgc3JjW1hSQU5HRVBMQUlOXSArICckJztcbnZhciBYUkFOR0VMT09TRSA9IFIrKztcbnNyY1tYUkFOR0VMT09TRV0gPSAnXicgKyBzcmNbR1RMVF0gKyAnXFxcXHMqJyArIHNyY1tYUkFOR0VQTEFJTkxPT1NFXSArICckJztcblxuLy8gVGlsZGUgcmFuZ2VzLlxuLy8gTWVhbmluZyBpcyBcInJlYXNvbmFibHkgYXQgb3IgZ3JlYXRlciB0aGFuXCJcbnZhciBMT05FVElMREUgPSBSKys7XG5zcmNbTE9ORVRJTERFXSA9ICcoPzp+Pj8pJztcblxudmFyIFRJTERFVFJJTSA9IFIrKztcbnNyY1tUSUxERVRSSU1dID0gJyhcXFxccyopJyArIHNyY1tMT05FVElMREVdICsgJ1xcXFxzKyc7XG5yZVtUSUxERVRSSU1dID0gbmV3IFJlZ0V4cChzcmNbVElMREVUUklNXSwgJ2cnKTtcbnZhciB0aWxkZVRyaW1SZXBsYWNlID0gJyQxfic7XG5cbnZhciBUSUxERSA9IFIrKztcbnNyY1tUSUxERV0gPSAnXicgKyBzcmNbTE9ORVRJTERFXSArIHNyY1tYUkFOR0VQTEFJTl0gKyAnJCc7XG52YXIgVElMREVMT09TRSA9IFIrKztcbnNyY1tUSUxERUxPT1NFXSA9ICdeJyArIHNyY1tMT05FVElMREVdICsgc3JjW1hSQU5HRVBMQUlOTE9PU0VdICsgJyQnO1xuXG4vLyBDYXJldCByYW5nZXMuXG4vLyBNZWFuaW5nIGlzIFwiYXQgbGVhc3QgYW5kIGJhY2t3YXJkcyBjb21wYXRpYmxlIHdpdGhcIlxudmFyIExPTkVDQVJFVCA9IFIrKztcbnNyY1tMT05FQ0FSRVRdID0gJyg/OlxcXFxeKSc7XG5cbnZhciBDQVJFVFRSSU0gPSBSKys7XG5zcmNbQ0FSRVRUUklNXSA9ICcoXFxcXHMqKScgKyBzcmNbTE9ORUNBUkVUXSArICdcXFxccysnO1xucmVbQ0FSRVRUUklNXSA9IG5ldyBSZWdFeHAoc3JjW0NBUkVUVFJJTV0sICdnJyk7XG52YXIgY2FyZXRUcmltUmVwbGFjZSA9ICckMV4nO1xuXG52YXIgQ0FSRVQgPSBSKys7XG5zcmNbQ0FSRVRdID0gJ14nICsgc3JjW0xPTkVDQVJFVF0gKyBzcmNbWFJBTkdFUExBSU5dICsgJyQnO1xudmFyIENBUkVUTE9PU0UgPSBSKys7XG5zcmNbQ0FSRVRMT09TRV0gPSAnXicgKyBzcmNbTE9ORUNBUkVUXSArIHNyY1tYUkFOR0VQTEFJTkxPT1NFXSArICckJztcblxuLy8gQSBzaW1wbGUgZ3QvbHQvZXEgdGhpbmcsIG9yIGp1c3QgXCJcIiB0byBpbmRpY2F0ZSBcImFueSB2ZXJzaW9uXCJcbnZhciBDT01QQVJBVE9STE9PU0UgPSBSKys7XG5zcmNbQ09NUEFSQVRPUkxPT1NFXSA9ICdeJyArIHNyY1tHVExUXSArICdcXFxccyooJyArIExPT1NFUExBSU4gKyAnKSR8XiQnO1xudmFyIENPTVBBUkFUT1IgPSBSKys7XG5zcmNbQ09NUEFSQVRPUl0gPSAnXicgKyBzcmNbR1RMVF0gKyAnXFxcXHMqKCcgKyBGVUxMUExBSU4gKyAnKSR8XiQnO1xuXG5cbi8vIEFuIGV4cHJlc3Npb24gdG8gc3RyaXAgYW55IHdoaXRlc3BhY2UgYmV0d2VlbiB0aGUgZ3RsdCBhbmQgdGhlIHRoaW5nXG4vLyBpdCBtb2RpZmllcywgc28gdGhhdCBgPiAxLjIuM2AgPT0+IGA+MS4yLjNgXG52YXIgQ09NUEFSQVRPUlRSSU0gPSBSKys7XG5zcmNbQ09NUEFSQVRPUlRSSU1dID0gJyhcXFxccyopJyArIHNyY1tHVExUXSArXG4gICAgICAgICAgICAgICAgICAgICAgJ1xcXFxzKignICsgTE9PU0VQTEFJTiArICd8JyArIHNyY1tYUkFOR0VQTEFJTl0gKyAnKSc7XG5cbi8vIHRoaXMgb25lIGhhcyB0byB1c2UgdGhlIC9nIGZsYWdcbnJlW0NPTVBBUkFUT1JUUklNXSA9IG5ldyBSZWdFeHAoc3JjW0NPTVBBUkFUT1JUUklNXSwgJ2cnKTtcbnZhciBjb21wYXJhdG9yVHJpbVJlcGxhY2UgPSAnJDEkMiQzJztcblxuXG4vLyBTb21ldGhpbmcgbGlrZSBgMS4yLjMgLSAxLjIuNGBcbi8vIE5vdGUgdGhhdCB0aGVzZSBhbGwgdXNlIHRoZSBsb29zZSBmb3JtLCBiZWNhdXNlIHRoZXknbGwgYmVcbi8vIGNoZWNrZWQgYWdhaW5zdCBlaXRoZXIgdGhlIHN0cmljdCBvciBsb29zZSBjb21wYXJhdG9yIGZvcm1cbi8vIGxhdGVyLlxudmFyIEhZUEhFTlJBTkdFID0gUisrO1xuc3JjW0hZUEhFTlJBTkdFXSA9ICdeXFxcXHMqKCcgKyBzcmNbWFJBTkdFUExBSU5dICsgJyknICtcbiAgICAgICAgICAgICAgICAgICAnXFxcXHMrLVxcXFxzKycgK1xuICAgICAgICAgICAgICAgICAgICcoJyArIHNyY1tYUkFOR0VQTEFJTl0gKyAnKScgK1xuICAgICAgICAgICAgICAgICAgICdcXFxccyokJztcblxudmFyIEhZUEhFTlJBTkdFTE9PU0UgPSBSKys7XG5zcmNbSFlQSEVOUkFOR0VMT09TRV0gPSAnXlxcXFxzKignICsgc3JjW1hSQU5HRVBMQUlOTE9PU0VdICsgJyknICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdcXFxccystXFxcXHMrJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnKCcgKyBzcmNbWFJBTkdFUExBSU5MT09TRV0gKyAnKScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1xcXFxzKiQnO1xuXG4vLyBTdGFyIHJhbmdlcyBiYXNpY2FsbHkganVzdCBhbGxvdyBhbnl0aGluZyBhdCBhbGwuXG52YXIgU1RBUiA9IFIrKztcbnNyY1tTVEFSXSA9ICcoPHw+KT89P1xcXFxzKlxcXFwqJztcblxuLy8gQ29tcGlsZSB0byBhY3R1YWwgcmVnZXhwIG9iamVjdHMuXG4vLyBBbGwgYXJlIGZsYWctZnJlZSwgdW5sZXNzIHRoZXkgd2VyZSBjcmVhdGVkIGFib3ZlIHdpdGggYSBmbGFnLlxuZm9yICh2YXIgaSA9IDA7IGkgPCBSOyBpKyspIHtcbiAgZGVidWcoaSwgc3JjW2ldKTtcbiAgaWYgKCFyZVtpXSlcbiAgICByZVtpXSA9IG5ldyBSZWdFeHAoc3JjW2ldKTtcbn1cblxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlO1xuZnVuY3Rpb24gcGFyc2UodmVyc2lvbiwgbG9vc2UpIHtcbiAgaWYgKHZlcnNpb24gaW5zdGFuY2VvZiBTZW1WZXIpXG4gICAgcmV0dXJuIHZlcnNpb247XG5cbiAgaWYgKHR5cGVvZiB2ZXJzaW9uICE9PSAnc3RyaW5nJylcbiAgICByZXR1cm4gbnVsbDtcblxuICBpZiAodmVyc2lvbi5sZW5ndGggPiBNQVhfTEVOR1RIKVxuICAgIHJldHVybiBudWxsO1xuXG4gIHZhciByID0gbG9vc2UgPyByZVtMT09TRV0gOiByZVtGVUxMXTtcbiAgaWYgKCFyLnRlc3QodmVyc2lvbikpXG4gICAgcmV0dXJuIG51bGw7XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gbmV3IFNlbVZlcih2ZXJzaW9uLCBsb29zZSk7XG4gIH0gY2F0Y2ggKGVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0cy52YWxpZCA9IHZhbGlkO1xuZnVuY3Rpb24gdmFsaWQodmVyc2lvbiwgbG9vc2UpIHtcbiAgdmFyIHYgPSBwYXJzZSh2ZXJzaW9uLCBsb29zZSk7XG4gIHJldHVybiB2ID8gdi52ZXJzaW9uIDogbnVsbDtcbn1cblxuXG5leHBvcnRzLmNsZWFuID0gY2xlYW47XG5mdW5jdGlvbiBjbGVhbih2ZXJzaW9uLCBsb29zZSkge1xuICB2YXIgcyA9IHBhcnNlKHZlcnNpb24udHJpbSgpLnJlcGxhY2UoL15bPXZdKy8sICcnKSwgbG9vc2UpO1xuICByZXR1cm4gcyA/IHMudmVyc2lvbiA6IG51bGw7XG59XG5cbmV4cG9ydHMuU2VtVmVyID0gU2VtVmVyO1xuXG5mdW5jdGlvbiBTZW1WZXIodmVyc2lvbiwgbG9vc2UpIHtcbiAgaWYgKHZlcnNpb24gaW5zdGFuY2VvZiBTZW1WZXIpIHtcbiAgICBpZiAodmVyc2lvbi5sb29zZSA9PT0gbG9vc2UpXG4gICAgICByZXR1cm4gdmVyc2lvbjtcbiAgICBlbHNlXG4gICAgICB2ZXJzaW9uID0gdmVyc2lvbi52ZXJzaW9uO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2ZXJzaW9uICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgVmVyc2lvbjogJyArIHZlcnNpb24pO1xuICB9XG5cbiAgaWYgKHZlcnNpb24ubGVuZ3RoID4gTUFYX0xFTkdUSClcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2ZXJzaW9uIGlzIGxvbmdlciB0aGFuICcgKyBNQVhfTEVOR1RIICsgJyBjaGFyYWN0ZXJzJylcblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2VtVmVyKSlcbiAgICByZXR1cm4gbmV3IFNlbVZlcih2ZXJzaW9uLCBsb29zZSk7XG5cbiAgZGVidWcoJ1NlbVZlcicsIHZlcnNpb24sIGxvb3NlKTtcbiAgdGhpcy5sb29zZSA9IGxvb3NlO1xuICB2YXIgbSA9IHZlcnNpb24udHJpbSgpLm1hdGNoKGxvb3NlID8gcmVbTE9PU0VdIDogcmVbRlVMTF0pO1xuXG4gIGlmICghbSlcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIFZlcnNpb246ICcgKyB2ZXJzaW9uKTtcblxuICB0aGlzLnJhdyA9IHZlcnNpb247XG5cbiAgLy8gdGhlc2UgYXJlIGFjdHVhbGx5IG51bWJlcnNcbiAgdGhpcy5tYWpvciA9ICttWzFdO1xuICB0aGlzLm1pbm9yID0gK21bMl07XG4gIHRoaXMucGF0Y2ggPSArbVszXTtcblxuICBpZiAodGhpcy5tYWpvciA+IE1BWF9TQUZFX0lOVEVHRVIgfHwgdGhpcy5tYWpvciA8IDApXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBtYWpvciB2ZXJzaW9uJylcblxuICBpZiAodGhpcy5taW5vciA+IE1BWF9TQUZFX0lOVEVHRVIgfHwgdGhpcy5taW5vciA8IDApXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBtaW5vciB2ZXJzaW9uJylcblxuICBpZiAodGhpcy5wYXRjaCA+IE1BWF9TQUZFX0lOVEVHRVIgfHwgdGhpcy5wYXRjaCA8IDApXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBwYXRjaCB2ZXJzaW9uJylcblxuICAvLyBudW1iZXJpZnkgYW55IHByZXJlbGVhc2UgbnVtZXJpYyBpZHNcbiAgaWYgKCFtWzRdKVxuICAgIHRoaXMucHJlcmVsZWFzZSA9IFtdO1xuICBlbHNlXG4gICAgdGhpcy5wcmVyZWxlYXNlID0gbVs0XS5zcGxpdCgnLicpLm1hcChmdW5jdGlvbihpZCkge1xuICAgICAgaWYgKC9eWzAtOV0rJC8udGVzdChpZCkpIHtcbiAgICAgICAgdmFyIG51bSA9ICtpZDtcbiAgICAgICAgaWYgKG51bSA+PSAwICYmIG51bSA8IE1BWF9TQUZFX0lOVEVHRVIpXG4gICAgICAgICAgcmV0dXJuIG51bTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpZDtcbiAgICB9KTtcblxuICB0aGlzLmJ1aWxkID0gbVs1XSA/IG1bNV0uc3BsaXQoJy4nKSA6IFtdO1xuICB0aGlzLmZvcm1hdCgpO1xufVxuXG5TZW1WZXIucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnZlcnNpb24gPSB0aGlzLm1ham9yICsgJy4nICsgdGhpcy5taW5vciArICcuJyArIHRoaXMucGF0Y2g7XG4gIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoKVxuICAgIHRoaXMudmVyc2lvbiArPSAnLScgKyB0aGlzLnByZXJlbGVhc2Uuam9pbignLicpO1xuICByZXR1cm4gdGhpcy52ZXJzaW9uO1xufTtcblxuU2VtVmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy52ZXJzaW9uO1xufTtcblxuU2VtVmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24ob3RoZXIpIHtcbiAgZGVidWcoJ1NlbVZlci5jb21wYXJlJywgdGhpcy52ZXJzaW9uLCB0aGlzLmxvb3NlLCBvdGhlcik7XG4gIGlmICghKG90aGVyIGluc3RhbmNlb2YgU2VtVmVyKSlcbiAgICBvdGhlciA9IG5ldyBTZW1WZXIob3RoZXIsIHRoaXMubG9vc2UpO1xuXG4gIHJldHVybiB0aGlzLmNvbXBhcmVNYWluKG90aGVyKSB8fCB0aGlzLmNvbXBhcmVQcmUob3RoZXIpO1xufTtcblxuU2VtVmVyLnByb3RvdHlwZS5jb21wYXJlTWFpbiA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gIGlmICghKG90aGVyIGluc3RhbmNlb2YgU2VtVmVyKSlcbiAgICBvdGhlciA9IG5ldyBTZW1WZXIob3RoZXIsIHRoaXMubG9vc2UpO1xuXG4gIHJldHVybiBjb21wYXJlSWRlbnRpZmllcnModGhpcy5tYWpvciwgb3RoZXIubWFqb3IpIHx8XG4gICAgICAgICBjb21wYXJlSWRlbnRpZmllcnModGhpcy5taW5vciwgb3RoZXIubWlub3IpIHx8XG4gICAgICAgICBjb21wYXJlSWRlbnRpZmllcnModGhpcy5wYXRjaCwgb3RoZXIucGF0Y2gpO1xufTtcblxuU2VtVmVyLnByb3RvdHlwZS5jb21wYXJlUHJlID0gZnVuY3Rpb24ob3RoZXIpIHtcbiAgaWYgKCEob3RoZXIgaW5zdGFuY2VvZiBTZW1WZXIpKVxuICAgIG90aGVyID0gbmV3IFNlbVZlcihvdGhlciwgdGhpcy5sb29zZSk7XG5cbiAgLy8gTk9UIGhhdmluZyBhIHByZXJlbGVhc2UgaXMgPiBoYXZpbmcgb25lXG4gIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoICYmICFvdGhlci5wcmVyZWxlYXNlLmxlbmd0aClcbiAgICByZXR1cm4gLTE7XG4gIGVsc2UgaWYgKCF0aGlzLnByZXJlbGVhc2UubGVuZ3RoICYmIG90aGVyLnByZXJlbGVhc2UubGVuZ3RoKVxuICAgIHJldHVybiAxO1xuICBlbHNlIGlmICghdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCAmJiAhb3RoZXIucHJlcmVsZWFzZS5sZW5ndGgpXG4gICAgcmV0dXJuIDA7XG5cbiAgdmFyIGkgPSAwO1xuICBkbyB7XG4gICAgdmFyIGEgPSB0aGlzLnByZXJlbGVhc2VbaV07XG4gICAgdmFyIGIgPSBvdGhlci5wcmVyZWxlYXNlW2ldO1xuICAgIGRlYnVnKCdwcmVyZWxlYXNlIGNvbXBhcmUnLCBpLCBhLCBiKTtcbiAgICBpZiAoYSA9PT0gdW5kZWZpbmVkICYmIGIgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAwO1xuICAgIGVsc2UgaWYgKGIgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGEgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAtMTtcbiAgICBlbHNlIGlmIChhID09PSBiKVxuICAgICAgY29udGludWU7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGNvbXBhcmVJZGVudGlmaWVycyhhLCBiKTtcbiAgfSB3aGlsZSAoKytpKTtcbn07XG5cbi8vIHByZW1pbm9yIHdpbGwgYnVtcCB0aGUgdmVyc2lvbiB1cCB0byB0aGUgbmV4dCBtaW5vciByZWxlYXNlLCBhbmQgaW1tZWRpYXRlbHlcbi8vIGRvd24gdG8gcHJlLXJlbGVhc2UuIHByZW1ham9yIGFuZCBwcmVwYXRjaCB3b3JrIHRoZSBzYW1lIHdheS5cblNlbVZlci5wcm90b3R5cGUuaW5jID0gZnVuY3Rpb24ocmVsZWFzZSwgaWRlbnRpZmllcikge1xuICBzd2l0Y2ggKHJlbGVhc2UpIHtcbiAgICBjYXNlICdwcmVtYWpvcic6XG4gICAgICB0aGlzLnByZXJlbGVhc2UubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMucGF0Y2ggPSAwO1xuICAgICAgdGhpcy5taW5vciA9IDA7XG4gICAgICB0aGlzLm1ham9yKys7XG4gICAgICB0aGlzLmluYygncHJlJywgaWRlbnRpZmllcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdwcmVtaW5vcic6XG4gICAgICB0aGlzLnByZXJlbGVhc2UubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMucGF0Y2ggPSAwO1xuICAgICAgdGhpcy5taW5vcisrO1xuICAgICAgdGhpcy5pbmMoJ3ByZScsIGlkZW50aWZpZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncHJlcGF0Y2gnOlxuICAgICAgLy8gSWYgdGhpcyBpcyBhbHJlYWR5IGEgcHJlcmVsZWFzZSwgaXQgd2lsbCBidW1wIHRvIHRoZSBuZXh0IHZlcnNpb25cbiAgICAgIC8vIGRyb3AgYW55IHByZXJlbGVhc2VzIHRoYXQgbWlnaHQgYWxyZWFkeSBleGlzdCwgc2luY2UgdGhleSBhcmUgbm90XG4gICAgICAvLyByZWxldmFudCBhdCB0aGlzIHBvaW50LlxuICAgICAgdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLmluYygncGF0Y2gnLCBpZGVudGlmaWVyKTtcbiAgICAgIHRoaXMuaW5jKCdwcmUnLCBpZGVudGlmaWVyKTtcbiAgICAgIGJyZWFrO1xuICAgIC8vIElmIHRoZSBpbnB1dCBpcyBhIG5vbi1wcmVyZWxlYXNlIHZlcnNpb24sIHRoaXMgYWN0cyB0aGUgc2FtZSBhc1xuICAgIC8vIHByZXBhdGNoLlxuICAgIGNhc2UgJ3ByZXJlbGVhc2UnOlxuICAgICAgaWYgKHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPT09IDApXG4gICAgICAgIHRoaXMuaW5jKCdwYXRjaCcsIGlkZW50aWZpZXIpO1xuICAgICAgdGhpcy5pbmMoJ3ByZScsIGlkZW50aWZpZXIpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdtYWpvcic6XG4gICAgICAvLyBJZiB0aGlzIGlzIGEgcHJlLW1ham9yIHZlcnNpb24sIGJ1bXAgdXAgdG8gdGhlIHNhbWUgbWFqb3IgdmVyc2lvbi5cbiAgICAgIC8vIE90aGVyd2lzZSBpbmNyZW1lbnQgbWFqb3IuXG4gICAgICAvLyAxLjAuMC01IGJ1bXBzIHRvIDEuMC4wXG4gICAgICAvLyAxLjEuMCBidW1wcyB0byAyLjAuMFxuICAgICAgaWYgKHRoaXMubWlub3IgIT09IDAgfHwgdGhpcy5wYXRjaCAhPT0gMCB8fCB0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwKVxuICAgICAgICB0aGlzLm1ham9yKys7XG4gICAgICB0aGlzLm1pbm9yID0gMDtcbiAgICAgIHRoaXMucGF0Y2ggPSAwO1xuICAgICAgdGhpcy5wcmVyZWxlYXNlID0gW107XG4gICAgICBicmVhaztcbiAgICBjYXNlICdtaW5vcic6XG4gICAgICAvLyBJZiB0aGlzIGlzIGEgcHJlLW1pbm9yIHZlcnNpb24sIGJ1bXAgdXAgdG8gdGhlIHNhbWUgbWlub3IgdmVyc2lvbi5cbiAgICAgIC8vIE90aGVyd2lzZSBpbmNyZW1lbnQgbWlub3IuXG4gICAgICAvLyAxLjIuMC01IGJ1bXBzIHRvIDEuMi4wXG4gICAgICAvLyAxLjIuMSBidW1wcyB0byAxLjMuMFxuICAgICAgaWYgKHRoaXMucGF0Y2ggIT09IDAgfHwgdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgdGhpcy5taW5vcisrO1xuICAgICAgdGhpcy5wYXRjaCA9IDA7XG4gICAgICB0aGlzLnByZXJlbGVhc2UgPSBbXTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3BhdGNoJzpcbiAgICAgIC8vIElmIHRoaXMgaXMgbm90IGEgcHJlLXJlbGVhc2UgdmVyc2lvbiwgaXQgd2lsbCBpbmNyZW1lbnQgdGhlIHBhdGNoLlxuICAgICAgLy8gSWYgaXQgaXMgYSBwcmUtcmVsZWFzZSBpdCB3aWxsIGJ1bXAgdXAgdG8gdGhlIHNhbWUgcGF0Y2ggdmVyc2lvbi5cbiAgICAgIC8vIDEuMi4wLTUgcGF0Y2hlcyB0byAxLjIuMFxuICAgICAgLy8gMS4yLjAgcGF0Y2hlcyB0byAxLjIuMVxuICAgICAgaWYgKHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPT09IDApXG4gICAgICAgIHRoaXMucGF0Y2grKztcbiAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtdO1xuICAgICAgYnJlYWs7XG4gICAgLy8gVGhpcyBwcm9iYWJseSBzaG91bGRuJ3QgYmUgdXNlZCBwdWJsaWNseS5cbiAgICAvLyAxLjAuMCBcInByZVwiIHdvdWxkIGJlY29tZSAxLjAuMC0wIHdoaWNoIGlzIHRoZSB3cm9uZyBkaXJlY3Rpb24uXG4gICAgY2FzZSAncHJlJzpcbiAgICAgIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwKVxuICAgICAgICB0aGlzLnByZXJlbGVhc2UgPSBbMF07XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnByZXJlbGVhc2UubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoLS1pID49IDApIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucHJlcmVsZWFzZVtpXSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRoaXMucHJlcmVsZWFzZVtpXSsrO1xuICAgICAgICAgICAgaSA9IC0yO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaSA9PT0gLTEpIC8vIGRpZG4ndCBpbmNyZW1lbnQgYW55dGhpbmdcbiAgICAgICAgICB0aGlzLnByZXJlbGVhc2UucHVzaCgwKTtcbiAgICAgIH1cbiAgICAgIGlmIChpZGVudGlmaWVyKSB7XG4gICAgICAgIC8vIDEuMi4wLWJldGEuMSBidW1wcyB0byAxLjIuMC1iZXRhLjIsXG4gICAgICAgIC8vIDEuMi4wLWJldGEuZm9vYmx6IG9yIDEuMi4wLWJldGEgYnVtcHMgdG8gMS4yLjAtYmV0YS4wXG4gICAgICAgIGlmICh0aGlzLnByZXJlbGVhc2VbMF0gPT09IGlkZW50aWZpZXIpIHtcbiAgICAgICAgICBpZiAoaXNOYU4odGhpcy5wcmVyZWxlYXNlWzFdKSlcbiAgICAgICAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtpZGVudGlmaWVyLCAwXTtcbiAgICAgICAgfSBlbHNlXG4gICAgICAgICAgdGhpcy5wcmVyZWxlYXNlID0gW2lkZW50aWZpZXIsIDBdO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIGluY3JlbWVudCBhcmd1bWVudDogJyArIHJlbGVhc2UpO1xuICB9XG4gIHRoaXMuZm9ybWF0KCk7XG4gIHRoaXMucmF3ID0gdGhpcy52ZXJzaW9uO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmV4cG9ydHMuaW5jID0gaW5jO1xuZnVuY3Rpb24gaW5jKHZlcnNpb24sIHJlbGVhc2UsIGxvb3NlLCBpZGVudGlmaWVyKSB7XG4gIGlmICh0eXBlb2YobG9vc2UpID09PSAnc3RyaW5nJykge1xuICAgIGlkZW50aWZpZXIgPSBsb29zZTtcbiAgICBsb29zZSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmV0dXJuIG5ldyBTZW1WZXIodmVyc2lvbiwgbG9vc2UpLmluYyhyZWxlYXNlLCBpZGVudGlmaWVyKS52ZXJzaW9uO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydHMuZGlmZiA9IGRpZmY7XG5mdW5jdGlvbiBkaWZmKHZlcnNpb24xLCB2ZXJzaW9uMikge1xuICBpZiAoZXEodmVyc2lvbjEsIHZlcnNpb24yKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2Uge1xuICAgIHZhciB2MSA9IHBhcnNlKHZlcnNpb24xKTtcbiAgICB2YXIgdjIgPSBwYXJzZSh2ZXJzaW9uMik7XG4gICAgaWYgKHYxLnByZXJlbGVhc2UubGVuZ3RoIHx8IHYyLnByZXJlbGVhc2UubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gdjEpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJ21ham9yJyB8fCBrZXkgPT09ICdtaW5vcicgfHwga2V5ID09PSAncGF0Y2gnKSB7XG4gICAgICAgICAgaWYgKHYxW2tleV0gIT09IHYyW2tleV0pIHtcbiAgICAgICAgICAgIHJldHVybiAncHJlJytrZXk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gJ3ByZXJlbGVhc2UnO1xuICAgIH1cbiAgICBmb3IgKHZhciBrZXkgaW4gdjEpIHtcbiAgICAgIGlmIChrZXkgPT09ICdtYWpvcicgfHwga2V5ID09PSAnbWlub3InIHx8IGtleSA9PT0gJ3BhdGNoJykge1xuICAgICAgICBpZiAodjFba2V5XSAhPT0gdjJba2V5XSkge1xuICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0cy5jb21wYXJlSWRlbnRpZmllcnMgPSBjb21wYXJlSWRlbnRpZmllcnM7XG5cbnZhciBudW1lcmljID0gL15bMC05XSskLztcbmZ1bmN0aW9uIGNvbXBhcmVJZGVudGlmaWVycyhhLCBiKSB7XG4gIHZhciBhbnVtID0gbnVtZXJpYy50ZXN0KGEpO1xuICB2YXIgYm51bSA9IG51bWVyaWMudGVzdChiKTtcblxuICBpZiAoYW51bSAmJiBibnVtKSB7XG4gICAgYSA9ICthO1xuICAgIGIgPSArYjtcbiAgfVxuXG4gIHJldHVybiAoYW51bSAmJiAhYm51bSkgPyAtMSA6XG4gICAgICAgICAoYm51bSAmJiAhYW51bSkgPyAxIDpcbiAgICAgICAgIGEgPCBiID8gLTEgOlxuICAgICAgICAgYSA+IGIgPyAxIDpcbiAgICAgICAgIDA7XG59XG5cbmV4cG9ydHMucmNvbXBhcmVJZGVudGlmaWVycyA9IHJjb21wYXJlSWRlbnRpZmllcnM7XG5mdW5jdGlvbiByY29tcGFyZUlkZW50aWZpZXJzKGEsIGIpIHtcbiAgcmV0dXJuIGNvbXBhcmVJZGVudGlmaWVycyhiLCBhKTtcbn1cblxuZXhwb3J0cy5tYWpvciA9IG1ham9yO1xuZnVuY3Rpb24gbWFqb3IoYSwgbG9vc2UpIHtcbiAgcmV0dXJuIG5ldyBTZW1WZXIoYSwgbG9vc2UpLm1ham9yO1xufVxuXG5leHBvcnRzLm1pbm9yID0gbWlub3I7XG5mdW5jdGlvbiBtaW5vcihhLCBsb29zZSkge1xuICByZXR1cm4gbmV3IFNlbVZlcihhLCBsb29zZSkubWlub3I7XG59XG5cbmV4cG9ydHMucGF0Y2ggPSBwYXRjaDtcbmZ1bmN0aW9uIHBhdGNoKGEsIGxvb3NlKSB7XG4gIHJldHVybiBuZXcgU2VtVmVyKGEsIGxvb3NlKS5wYXRjaDtcbn1cblxuZXhwb3J0cy5jb21wYXJlID0gY29tcGFyZTtcbmZ1bmN0aW9uIGNvbXBhcmUoYSwgYiwgbG9vc2UpIHtcbiAgcmV0dXJuIG5ldyBTZW1WZXIoYSwgbG9vc2UpLmNvbXBhcmUobmV3IFNlbVZlcihiLCBsb29zZSkpO1xufVxuXG5leHBvcnRzLmNvbXBhcmVMb29zZSA9IGNvbXBhcmVMb29zZTtcbmZ1bmN0aW9uIGNvbXBhcmVMb29zZShhLCBiKSB7XG4gIHJldHVybiBjb21wYXJlKGEsIGIsIHRydWUpO1xufVxuXG5leHBvcnRzLnJjb21wYXJlID0gcmNvbXBhcmU7XG5mdW5jdGlvbiByY29tcGFyZShhLCBiLCBsb29zZSkge1xuICByZXR1cm4gY29tcGFyZShiLCBhLCBsb29zZSk7XG59XG5cbmV4cG9ydHMuc29ydCA9IHNvcnQ7XG5mdW5jdGlvbiBzb3J0KGxpc3QsIGxvb3NlKSB7XG4gIHJldHVybiBsaXN0LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBleHBvcnRzLmNvbXBhcmUoYSwgYiwgbG9vc2UpO1xuICB9KTtcbn1cblxuZXhwb3J0cy5yc29ydCA9IHJzb3J0O1xuZnVuY3Rpb24gcnNvcnQobGlzdCwgbG9vc2UpIHtcbiAgcmV0dXJuIGxpc3Quc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGV4cG9ydHMucmNvbXBhcmUoYSwgYiwgbG9vc2UpO1xuICB9KTtcbn1cblxuZXhwb3J0cy5ndCA9IGd0O1xuZnVuY3Rpb24gZ3QoYSwgYiwgbG9vc2UpIHtcbiAgcmV0dXJuIGNvbXBhcmUoYSwgYiwgbG9vc2UpID4gMDtcbn1cblxuZXhwb3J0cy5sdCA9IGx0O1xuZnVuY3Rpb24gbHQoYSwgYiwgbG9vc2UpIHtcbiAgcmV0dXJuIGNvbXBhcmUoYSwgYiwgbG9vc2UpIDwgMDtcbn1cblxuZXhwb3J0cy5lcSA9IGVxO1xuZnVuY3Rpb24gZXEoYSwgYiwgbG9vc2UpIHtcbiAgcmV0dXJuIGNvbXBhcmUoYSwgYiwgbG9vc2UpID09PSAwO1xufVxuXG5leHBvcnRzLm5lcSA9IG5lcTtcbmZ1bmN0aW9uIG5lcShhLCBiLCBsb29zZSkge1xuICByZXR1cm4gY29tcGFyZShhLCBiLCBsb29zZSkgIT09IDA7XG59XG5cbmV4cG9ydHMuZ3RlID0gZ3RlO1xuZnVuY3Rpb24gZ3RlKGEsIGIsIGxvb3NlKSB7XG4gIHJldHVybiBjb21wYXJlKGEsIGIsIGxvb3NlKSA+PSAwO1xufVxuXG5leHBvcnRzLmx0ZSA9IGx0ZTtcbmZ1bmN0aW9uIGx0ZShhLCBiLCBsb29zZSkge1xuICByZXR1cm4gY29tcGFyZShhLCBiLCBsb29zZSkgPD0gMDtcbn1cblxuZXhwb3J0cy5jbXAgPSBjbXA7XG5mdW5jdGlvbiBjbXAoYSwgb3AsIGIsIGxvb3NlKSB7XG4gIHZhciByZXQ7XG4gIHN3aXRjaCAob3ApIHtcbiAgICBjYXNlICc9PT0nOlxuICAgICAgaWYgKHR5cGVvZiBhID09PSAnb2JqZWN0JykgYSA9IGEudmVyc2lvbjtcbiAgICAgIGlmICh0eXBlb2YgYiA9PT0gJ29iamVjdCcpIGIgPSBiLnZlcnNpb247XG4gICAgICByZXQgPSBhID09PSBiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnIT09JzpcbiAgICAgIGlmICh0eXBlb2YgYSA9PT0gJ29iamVjdCcpIGEgPSBhLnZlcnNpb247XG4gICAgICBpZiAodHlwZW9mIGIgPT09ICdvYmplY3QnKSBiID0gYi52ZXJzaW9uO1xuICAgICAgcmV0ID0gYSAhPT0gYjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJyc6IGNhc2UgJz0nOiBjYXNlICc9PSc6IHJldCA9IGVxKGEsIGIsIGxvb3NlKTsgYnJlYWs7XG4gICAgY2FzZSAnIT0nOiByZXQgPSBuZXEoYSwgYiwgbG9vc2UpOyBicmVhaztcbiAgICBjYXNlICc+JzogcmV0ID0gZ3QoYSwgYiwgbG9vc2UpOyBicmVhaztcbiAgICBjYXNlICc+PSc6IHJldCA9IGd0ZShhLCBiLCBsb29zZSk7IGJyZWFrO1xuICAgIGNhc2UgJzwnOiByZXQgPSBsdChhLCBiLCBsb29zZSk7IGJyZWFrO1xuICAgIGNhc2UgJzw9JzogcmV0ID0gbHRlKGEsIGIsIGxvb3NlKTsgYnJlYWs7XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBvcGVyYXRvcjogJyArIG9wKTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG5leHBvcnRzLkNvbXBhcmF0b3IgPSBDb21wYXJhdG9yO1xuZnVuY3Rpb24gQ29tcGFyYXRvcihjb21wLCBsb29zZSkge1xuICBpZiAoY29tcCBpbnN0YW5jZW9mIENvbXBhcmF0b3IpIHtcbiAgICBpZiAoY29tcC5sb29zZSA9PT0gbG9vc2UpXG4gICAgICByZXR1cm4gY29tcDtcbiAgICBlbHNlXG4gICAgICBjb21wID0gY29tcC52YWx1ZTtcbiAgfVxuXG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDb21wYXJhdG9yKSlcbiAgICByZXR1cm4gbmV3IENvbXBhcmF0b3IoY29tcCwgbG9vc2UpO1xuXG4gIGRlYnVnKCdjb21wYXJhdG9yJywgY29tcCwgbG9vc2UpO1xuICB0aGlzLmxvb3NlID0gbG9vc2U7XG4gIHRoaXMucGFyc2UoY29tcCk7XG5cbiAgaWYgKHRoaXMuc2VtdmVyID09PSBBTlkpXG4gICAgdGhpcy52YWx1ZSA9ICcnO1xuICBlbHNlXG4gICAgdGhpcy52YWx1ZSA9IHRoaXMub3BlcmF0b3IgKyB0aGlzLnNlbXZlci52ZXJzaW9uO1xuXG4gIGRlYnVnKCdjb21wJywgdGhpcyk7XG59XG5cbnZhciBBTlkgPSB7fTtcbkNvbXBhcmF0b3IucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24oY29tcCkge1xuICB2YXIgciA9IHRoaXMubG9vc2UgPyByZVtDT01QQVJBVE9STE9PU0VdIDogcmVbQ09NUEFSQVRPUl07XG4gIHZhciBtID0gY29tcC5tYXRjaChyKTtcblxuICBpZiAoIW0pXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjb21wYXJhdG9yOiAnICsgY29tcCk7XG5cbiAgdGhpcy5vcGVyYXRvciA9IG1bMV07XG4gIGlmICh0aGlzLm9wZXJhdG9yID09PSAnPScpXG4gICAgdGhpcy5vcGVyYXRvciA9ICcnO1xuXG4gIC8vIGlmIGl0IGxpdGVyYWxseSBpcyBqdXN0ICc+JyBvciAnJyB0aGVuIGFsbG93IGFueXRoaW5nLlxuICBpZiAoIW1bMl0pXG4gICAgdGhpcy5zZW12ZXIgPSBBTlk7XG4gIGVsc2VcbiAgICB0aGlzLnNlbXZlciA9IG5ldyBTZW1WZXIobVsyXSwgdGhpcy5sb29zZSk7XG59O1xuXG5Db21wYXJhdG9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy52YWx1ZTtcbn07XG5cbkNvbXBhcmF0b3IucHJvdG90eXBlLnRlc3QgPSBmdW5jdGlvbih2ZXJzaW9uKSB7XG4gIGRlYnVnKCdDb21wYXJhdG9yLnRlc3QnLCB2ZXJzaW9uLCB0aGlzLmxvb3NlKTtcblxuICBpZiAodGhpcy5zZW12ZXIgPT09IEFOWSlcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAodHlwZW9mIHZlcnNpb24gPT09ICdzdHJpbmcnKVxuICAgIHZlcnNpb24gPSBuZXcgU2VtVmVyKHZlcnNpb24sIHRoaXMubG9vc2UpO1xuXG4gIHJldHVybiBjbXAodmVyc2lvbiwgdGhpcy5vcGVyYXRvciwgdGhpcy5zZW12ZXIsIHRoaXMubG9vc2UpO1xufTtcblxuQ29tcGFyYXRvci5wcm90b3R5cGUuaW50ZXJzZWN0cyA9IGZ1bmN0aW9uKGNvbXAsIGxvb3NlKSB7XG4gIGlmICghKGNvbXAgaW5zdGFuY2VvZiBDb21wYXJhdG9yKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2EgQ29tcGFyYXRvciBpcyByZXF1aXJlZCcpO1xuICB9XG5cbiAgdmFyIHJhbmdlVG1wO1xuXG4gIGlmICh0aGlzLm9wZXJhdG9yID09PSAnJykge1xuICAgIHJhbmdlVG1wID0gbmV3IFJhbmdlKGNvbXAudmFsdWUsIGxvb3NlKTtcbiAgICByZXR1cm4gc2F0aXNmaWVzKHRoaXMudmFsdWUsIHJhbmdlVG1wLCBsb29zZSk7XG4gIH0gZWxzZSBpZiAoY29tcC5vcGVyYXRvciA9PT0gJycpIHtcbiAgICByYW5nZVRtcCA9IG5ldyBSYW5nZSh0aGlzLnZhbHVlLCBsb29zZSk7XG4gICAgcmV0dXJuIHNhdGlzZmllcyhjb21wLnNlbXZlciwgcmFuZ2VUbXAsIGxvb3NlKTtcbiAgfVxuXG4gIHZhciBzYW1lRGlyZWN0aW9uSW5jcmVhc2luZyA9XG4gICAgKHRoaXMub3BlcmF0b3IgPT09ICc+PScgfHwgdGhpcy5vcGVyYXRvciA9PT0gJz4nKSAmJlxuICAgIChjb21wLm9wZXJhdG9yID09PSAnPj0nIHx8IGNvbXAub3BlcmF0b3IgPT09ICc+Jyk7XG4gIHZhciBzYW1lRGlyZWN0aW9uRGVjcmVhc2luZyA9XG4gICAgKHRoaXMub3BlcmF0b3IgPT09ICc8PScgfHwgdGhpcy5vcGVyYXRvciA9PT0gJzwnKSAmJlxuICAgIChjb21wLm9wZXJhdG9yID09PSAnPD0nIHx8IGNvbXAub3BlcmF0b3IgPT09ICc8Jyk7XG4gIHZhciBzYW1lU2VtVmVyID0gdGhpcy5zZW12ZXIudmVyc2lvbiA9PT0gY29tcC5zZW12ZXIudmVyc2lvbjtcbiAgdmFyIGRpZmZlcmVudERpcmVjdGlvbnNJbmNsdXNpdmUgPVxuICAgICh0aGlzLm9wZXJhdG9yID09PSAnPj0nIHx8IHRoaXMub3BlcmF0b3IgPT09ICc8PScpICYmXG4gICAgKGNvbXAub3BlcmF0b3IgPT09ICc+PScgfHwgY29tcC5vcGVyYXRvciA9PT0gJzw9Jyk7XG4gIHZhciBvcHBvc2l0ZURpcmVjdGlvbnNMZXNzVGhhbiA9XG4gICAgY21wKHRoaXMuc2VtdmVyLCAnPCcsIGNvbXAuc2VtdmVyLCBsb29zZSkgJiZcbiAgICAoKHRoaXMub3BlcmF0b3IgPT09ICc+PScgfHwgdGhpcy5vcGVyYXRvciA9PT0gJz4nKSAmJlxuICAgIChjb21wLm9wZXJhdG9yID09PSAnPD0nIHx8IGNvbXAub3BlcmF0b3IgPT09ICc8JykpO1xuICB2YXIgb3Bwb3NpdGVEaXJlY3Rpb25zR3JlYXRlclRoYW4gPVxuICAgIGNtcCh0aGlzLnNlbXZlciwgJz4nLCBjb21wLnNlbXZlciwgbG9vc2UpICYmXG4gICAgKCh0aGlzLm9wZXJhdG9yID09PSAnPD0nIHx8IHRoaXMub3BlcmF0b3IgPT09ICc8JykgJiZcbiAgICAoY29tcC5vcGVyYXRvciA9PT0gJz49JyB8fCBjb21wLm9wZXJhdG9yID09PSAnPicpKTtcblxuICByZXR1cm4gc2FtZURpcmVjdGlvbkluY3JlYXNpbmcgfHwgc2FtZURpcmVjdGlvbkRlY3JlYXNpbmcgfHxcbiAgICAoc2FtZVNlbVZlciAmJiBkaWZmZXJlbnREaXJlY3Rpb25zSW5jbHVzaXZlKSB8fFxuICAgIG9wcG9zaXRlRGlyZWN0aW9uc0xlc3NUaGFuIHx8IG9wcG9zaXRlRGlyZWN0aW9uc0dyZWF0ZXJUaGFuO1xufTtcblxuXG5leHBvcnRzLlJhbmdlID0gUmFuZ2U7XG5mdW5jdGlvbiBSYW5nZShyYW5nZSwgbG9vc2UpIHtcbiAgaWYgKHJhbmdlIGluc3RhbmNlb2YgUmFuZ2UpIHtcbiAgICBpZiAocmFuZ2UubG9vc2UgPT09IGxvb3NlKSB7XG4gICAgICByZXR1cm4gcmFuZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UucmF3LCBsb29zZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHJhbmdlIGluc3RhbmNlb2YgQ29tcGFyYXRvcikge1xuICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UudmFsdWUsIGxvb3NlKTtcbiAgfVxuXG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSYW5nZSkpXG4gICAgcmV0dXJuIG5ldyBSYW5nZShyYW5nZSwgbG9vc2UpO1xuXG4gIHRoaXMubG9vc2UgPSBsb29zZTtcblxuICAvLyBGaXJzdCwgc3BsaXQgYmFzZWQgb24gYm9vbGVhbiBvciB8fFxuICB0aGlzLnJhdyA9IHJhbmdlO1xuICB0aGlzLnNldCA9IHJhbmdlLnNwbGl0KC9cXHMqXFx8XFx8XFxzKi8pLm1hcChmdW5jdGlvbihyYW5nZSkge1xuICAgIHJldHVybiB0aGlzLnBhcnNlUmFuZ2UocmFuZ2UudHJpbSgpKTtcbiAgfSwgdGhpcykuZmlsdGVyKGZ1bmN0aW9uKGMpIHtcbiAgICAvLyB0aHJvdyBvdXQgYW55IHRoYXQgYXJlIG5vdCByZWxldmFudCBmb3Igd2hhdGV2ZXIgcmVhc29uXG4gICAgcmV0dXJuIGMubGVuZ3RoO1xuICB9KTtcblxuICBpZiAoIXRoaXMuc2V0Lmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgU2VtVmVyIFJhbmdlOiAnICsgcmFuZ2UpO1xuICB9XG5cbiAgdGhpcy5mb3JtYXQoKTtcbn1cblxuUmFuZ2UucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnJhbmdlID0gdGhpcy5zZXQubWFwKGZ1bmN0aW9uKGNvbXBzKSB7XG4gICAgcmV0dXJuIGNvbXBzLmpvaW4oJyAnKS50cmltKCk7XG4gIH0pLmpvaW4oJ3x8JykudHJpbSgpO1xuICByZXR1cm4gdGhpcy5yYW5nZTtcbn07XG5cblJhbmdlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5yYW5nZTtcbn07XG5cblJhbmdlLnByb3RvdHlwZS5wYXJzZVJhbmdlID0gZnVuY3Rpb24ocmFuZ2UpIHtcbiAgdmFyIGxvb3NlID0gdGhpcy5sb29zZTtcbiAgcmFuZ2UgPSByYW5nZS50cmltKCk7XG4gIGRlYnVnKCdyYW5nZScsIHJhbmdlLCBsb29zZSk7XG4gIC8vIGAxLjIuMyAtIDEuMi40YCA9PiBgPj0xLjIuMyA8PTEuMi40YFxuICB2YXIgaHIgPSBsb29zZSA/IHJlW0hZUEhFTlJBTkdFTE9PU0VdIDogcmVbSFlQSEVOUkFOR0VdO1xuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UoaHIsIGh5cGhlblJlcGxhY2UpO1xuICBkZWJ1ZygnaHlwaGVuIHJlcGxhY2UnLCByYW5nZSk7XG4gIC8vIGA+IDEuMi4zIDwgMS4yLjVgID0+IGA+MS4yLjMgPDEuMi41YFxuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UocmVbQ09NUEFSQVRPUlRSSU1dLCBjb21wYXJhdG9yVHJpbVJlcGxhY2UpO1xuICBkZWJ1ZygnY29tcGFyYXRvciB0cmltJywgcmFuZ2UsIHJlW0NPTVBBUkFUT1JUUklNXSk7XG5cbiAgLy8gYH4gMS4yLjNgID0+IGB+MS4yLjNgXG4gIHJhbmdlID0gcmFuZ2UucmVwbGFjZShyZVtUSUxERVRSSU1dLCB0aWxkZVRyaW1SZXBsYWNlKTtcblxuICAvLyBgXiAxLjIuM2AgPT4gYF4xLjIuM2BcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKHJlW0NBUkVUVFJJTV0sIGNhcmV0VHJpbVJlcGxhY2UpO1xuXG4gIC8vIG5vcm1hbGl6ZSBzcGFjZXNcbiAgcmFuZ2UgPSByYW5nZS5zcGxpdCgvXFxzKy8pLmpvaW4oJyAnKTtcblxuICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgcmFuZ2UgaXMgY29tcGxldGVseSB0cmltbWVkIGFuZFxuICAvLyByZWFkeSB0byBiZSBzcGxpdCBpbnRvIGNvbXBhcmF0b3JzLlxuXG4gIHZhciBjb21wUmUgPSBsb29zZSA/IHJlW0NPTVBBUkFUT1JMT09TRV0gOiByZVtDT01QQVJBVE9SXTtcbiAgdmFyIHNldCA9IHJhbmdlLnNwbGl0KCcgJykubWFwKGZ1bmN0aW9uKGNvbXApIHtcbiAgICByZXR1cm4gcGFyc2VDb21wYXJhdG9yKGNvbXAsIGxvb3NlKTtcbiAgfSkuam9pbignICcpLnNwbGl0KC9cXHMrLyk7XG4gIGlmICh0aGlzLmxvb3NlKSB7XG4gICAgLy8gaW4gbG9vc2UgbW9kZSwgdGhyb3cgb3V0IGFueSB0aGF0IGFyZSBub3QgdmFsaWQgY29tcGFyYXRvcnNcbiAgICBzZXQgPSBzZXQuZmlsdGVyKGZ1bmN0aW9uKGNvbXApIHtcbiAgICAgIHJldHVybiAhIWNvbXAubWF0Y2goY29tcFJlKTtcbiAgICB9KTtcbiAgfVxuICBzZXQgPSBzZXQubWFwKGZ1bmN0aW9uKGNvbXApIHtcbiAgICByZXR1cm4gbmV3IENvbXBhcmF0b3IoY29tcCwgbG9vc2UpO1xuICB9KTtcblxuICByZXR1cm4gc2V0O1xufTtcblxuUmFuZ2UucHJvdG90eXBlLmludGVyc2VjdHMgPSBmdW5jdGlvbihyYW5nZSwgbG9vc2UpIHtcbiAgaWYgKCEocmFuZ2UgaW5zdGFuY2VvZiBSYW5nZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhIFJhbmdlIGlzIHJlcXVpcmVkJyk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5zZXQuc29tZShmdW5jdGlvbih0aGlzQ29tcGFyYXRvcnMpIHtcbiAgICByZXR1cm4gdGhpc0NvbXBhcmF0b3JzLmV2ZXJ5KGZ1bmN0aW9uKHRoaXNDb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gcmFuZ2Uuc2V0LnNvbWUoZnVuY3Rpb24ocmFuZ2VDb21wYXJhdG9ycykge1xuICAgICAgICByZXR1cm4gcmFuZ2VDb21wYXJhdG9ycy5ldmVyeShmdW5jdGlvbihyYW5nZUNvbXBhcmF0b3IpIHtcbiAgICAgICAgICByZXR1cm4gdGhpc0NvbXBhcmF0b3IuaW50ZXJzZWN0cyhyYW5nZUNvbXBhcmF0b3IsIGxvb3NlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vLyBNb3N0bHkganVzdCBmb3IgdGVzdGluZyBhbmQgbGVnYWN5IEFQSSByZWFzb25zXG5leHBvcnRzLnRvQ29tcGFyYXRvcnMgPSB0b0NvbXBhcmF0b3JzO1xuZnVuY3Rpb24gdG9Db21wYXJhdG9ycyhyYW5nZSwgbG9vc2UpIHtcbiAgcmV0dXJuIG5ldyBSYW5nZShyYW5nZSwgbG9vc2UpLnNldC5tYXAoZnVuY3Rpb24oY29tcCkge1xuICAgIHJldHVybiBjb21wLm1hcChmdW5jdGlvbihjKSB7XG4gICAgICByZXR1cm4gYy52YWx1ZTtcbiAgICB9KS5qb2luKCcgJykudHJpbSgpLnNwbGl0KCcgJyk7XG4gIH0pO1xufVxuXG4vLyBjb21wcmlzZWQgb2YgeHJhbmdlcywgdGlsZGVzLCBzdGFycywgYW5kIGd0bHQncyBhdCB0aGlzIHBvaW50LlxuLy8gYWxyZWFkeSByZXBsYWNlZCB0aGUgaHlwaGVuIHJhbmdlc1xuLy8gdHVybiBpbnRvIGEgc2V0IG9mIEpVU1QgY29tcGFyYXRvcnMuXG5mdW5jdGlvbiBwYXJzZUNvbXBhcmF0b3IoY29tcCwgbG9vc2UpIHtcbiAgZGVidWcoJ2NvbXAnLCBjb21wKTtcbiAgY29tcCA9IHJlcGxhY2VDYXJldHMoY29tcCwgbG9vc2UpO1xuICBkZWJ1ZygnY2FyZXQnLCBjb21wKTtcbiAgY29tcCA9IHJlcGxhY2VUaWxkZXMoY29tcCwgbG9vc2UpO1xuICBkZWJ1ZygndGlsZGVzJywgY29tcCk7XG4gIGNvbXAgPSByZXBsYWNlWFJhbmdlcyhjb21wLCBsb29zZSk7XG4gIGRlYnVnKCd4cmFuZ2UnLCBjb21wKTtcbiAgY29tcCA9IHJlcGxhY2VTdGFycyhjb21wLCBsb29zZSk7XG4gIGRlYnVnKCdzdGFycycsIGNvbXApO1xuICByZXR1cm4gY29tcDtcbn1cblxuZnVuY3Rpb24gaXNYKGlkKSB7XG4gIHJldHVybiAhaWQgfHwgaWQudG9Mb3dlckNhc2UoKSA9PT0gJ3gnIHx8IGlkID09PSAnKic7XG59XG5cbi8vIH4sIH4+IC0tPiAqIChhbnksIGtpbmRhIHNpbGx5KVxuLy8gfjIsIH4yLngsIH4yLngueCwgfj4yLCB+PjIueCB+PjIueC54IC0tPiA+PTIuMC4wIDwzLjAuMFxuLy8gfjIuMCwgfjIuMC54LCB+PjIuMCwgfj4yLjAueCAtLT4gPj0yLjAuMCA8Mi4xLjBcbi8vIH4xLjIsIH4xLjIueCwgfj4xLjIsIH4+MS4yLnggLS0+ID49MS4yLjAgPDEuMy4wXG4vLyB+MS4yLjMsIH4+MS4yLjMgLS0+ID49MS4yLjMgPDEuMy4wXG4vLyB+MS4yLjAsIH4+MS4yLjAgLS0+ID49MS4yLjAgPDEuMy4wXG5mdW5jdGlvbiByZXBsYWNlVGlsZGVzKGNvbXAsIGxvb3NlKSB7XG4gIHJldHVybiBjb21wLnRyaW0oKS5zcGxpdCgvXFxzKy8pLm1hcChmdW5jdGlvbihjb21wKSB7XG4gICAgcmV0dXJuIHJlcGxhY2VUaWxkZShjb21wLCBsb29zZSk7XG4gIH0pLmpvaW4oJyAnKTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZVRpbGRlKGNvbXAsIGxvb3NlKSB7XG4gIHZhciByID0gbG9vc2UgPyByZVtUSUxERUxPT1NFXSA6IHJlW1RJTERFXTtcbiAgcmV0dXJuIGNvbXAucmVwbGFjZShyLCBmdW5jdGlvbihfLCBNLCBtLCBwLCBwcikge1xuICAgIGRlYnVnKCd0aWxkZScsIGNvbXAsIF8sIE0sIG0sIHAsIHByKTtcbiAgICB2YXIgcmV0O1xuXG4gICAgaWYgKGlzWChNKSlcbiAgICAgIHJldCA9ICcnO1xuICAgIGVsc2UgaWYgKGlzWChtKSlcbiAgICAgIHJldCA9ICc+PScgKyBNICsgJy4wLjAgPCcgKyAoK00gKyAxKSArICcuMC4wJztcbiAgICBlbHNlIGlmIChpc1gocCkpXG4gICAgICAvLyB+MS4yID09ID49MS4yLjAgPDEuMy4wXG4gICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLjAgPCcgKyBNICsgJy4nICsgKCttICsgMSkgKyAnLjAnO1xuICAgIGVsc2UgaWYgKHByKSB7XG4gICAgICBkZWJ1ZygncmVwbGFjZVRpbGRlIHByJywgcHIpO1xuICAgICAgaWYgKHByLmNoYXJBdCgwKSAhPT0gJy0nKVxuICAgICAgICBwciA9ICctJyArIHByO1xuICAgICAgcmV0ID0gJz49JyArIE0gKyAnLicgKyBtICsgJy4nICsgcCArIHByICtcbiAgICAgICAgICAgICcgPCcgKyBNICsgJy4nICsgKCttICsgMSkgKyAnLjAnO1xuICAgIH0gZWxzZVxuICAgICAgLy8gfjEuMi4zID09ID49MS4yLjMgPDEuMy4wXG4gICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLicgKyBwICtcbiAgICAgICAgICAgICcgPCcgKyBNICsgJy4nICsgKCttICsgMSkgKyAnLjAnO1xuXG4gICAgZGVidWcoJ3RpbGRlIHJldHVybicsIHJldCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfSk7XG59XG5cbi8vIF4gLS0+ICogKGFueSwga2luZGEgc2lsbHkpXG4vLyBeMiwgXjIueCwgXjIueC54IC0tPiA+PTIuMC4wIDwzLjAuMFxuLy8gXjIuMCwgXjIuMC54IC0tPiA+PTIuMC4wIDwzLjAuMFxuLy8gXjEuMiwgXjEuMi54IC0tPiA+PTEuMi4wIDwyLjAuMFxuLy8gXjEuMi4zIC0tPiA+PTEuMi4zIDwyLjAuMFxuLy8gXjEuMi4wIC0tPiA+PTEuMi4wIDwyLjAuMFxuZnVuY3Rpb24gcmVwbGFjZUNhcmV0cyhjb21wLCBsb29zZSkge1xuICByZXR1cm4gY29tcC50cmltKCkuc3BsaXQoL1xccysvKS5tYXAoZnVuY3Rpb24oY29tcCkge1xuICAgIHJldHVybiByZXBsYWNlQ2FyZXQoY29tcCwgbG9vc2UpO1xuICB9KS5qb2luKCcgJyk7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VDYXJldChjb21wLCBsb29zZSkge1xuICBkZWJ1ZygnY2FyZXQnLCBjb21wLCBsb29zZSk7XG4gIHZhciByID0gbG9vc2UgPyByZVtDQVJFVExPT1NFXSA6IHJlW0NBUkVUXTtcbiAgcmV0dXJuIGNvbXAucmVwbGFjZShyLCBmdW5jdGlvbihfLCBNLCBtLCBwLCBwcikge1xuICAgIGRlYnVnKCdjYXJldCcsIGNvbXAsIF8sIE0sIG0sIHAsIHByKTtcbiAgICB2YXIgcmV0O1xuXG4gICAgaWYgKGlzWChNKSlcbiAgICAgIHJldCA9ICcnO1xuICAgIGVsc2UgaWYgKGlzWChtKSlcbiAgICAgIHJldCA9ICc+PScgKyBNICsgJy4wLjAgPCcgKyAoK00gKyAxKSArICcuMC4wJztcbiAgICBlbHNlIGlmIChpc1gocCkpIHtcbiAgICAgIGlmIChNID09PSAnMCcpXG4gICAgICAgIHJldCA9ICc+PScgKyBNICsgJy4nICsgbSArICcuMCA8JyArIE0gKyAnLicgKyAoK20gKyAxKSArICcuMCc7XG4gICAgICBlbHNlXG4gICAgICAgIHJldCA9ICc+PScgKyBNICsgJy4nICsgbSArICcuMCA8JyArICgrTSArIDEpICsgJy4wLjAnO1xuICAgIH0gZWxzZSBpZiAocHIpIHtcbiAgICAgIGRlYnVnKCdyZXBsYWNlQ2FyZXQgcHInLCBwcik7XG4gICAgICBpZiAocHIuY2hhckF0KDApICE9PSAnLScpXG4gICAgICAgIHByID0gJy0nICsgcHI7XG4gICAgICBpZiAoTSA9PT0gJzAnKSB7XG4gICAgICAgIGlmIChtID09PSAnMCcpXG4gICAgICAgICAgcmV0ID0gJz49JyArIE0gKyAnLicgKyBtICsgJy4nICsgcCArIHByICtcbiAgICAgICAgICAgICAgICAnIDwnICsgTSArICcuJyArIG0gKyAnLicgKyAoK3AgKyAxKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldCA9ICc+PScgKyBNICsgJy4nICsgbSArICcuJyArIHAgKyBwciArXG4gICAgICAgICAgICAgICAgJyA8JyArIE0gKyAnLicgKyAoK20gKyAxKSArICcuMCc7XG4gICAgICB9IGVsc2VcbiAgICAgICAgcmV0ID0gJz49JyArIE0gKyAnLicgKyBtICsgJy4nICsgcCArIHByICtcbiAgICAgICAgICAgICAgJyA8JyArICgrTSArIDEpICsgJy4wLjAnO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Zygnbm8gcHInKTtcbiAgICAgIGlmIChNID09PSAnMCcpIHtcbiAgICAgICAgaWYgKG0gPT09ICcwJylcbiAgICAgICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLicgKyBwICtcbiAgICAgICAgICAgICAgICAnIDwnICsgTSArICcuJyArIG0gKyAnLicgKyAoK3AgKyAxKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldCA9ICc+PScgKyBNICsgJy4nICsgbSArICcuJyArIHAgK1xuICAgICAgICAgICAgICAgICcgPCcgKyBNICsgJy4nICsgKCttICsgMSkgKyAnLjAnO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldCA9ICc+PScgKyBNICsgJy4nICsgbSArICcuJyArIHAgK1xuICAgICAgICAgICAgICAnIDwnICsgKCtNICsgMSkgKyAnLjAuMCc7XG4gICAgfVxuXG4gICAgZGVidWcoJ2NhcmV0IHJldHVybicsIHJldCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VYUmFuZ2VzKGNvbXAsIGxvb3NlKSB7XG4gIGRlYnVnKCdyZXBsYWNlWFJhbmdlcycsIGNvbXAsIGxvb3NlKTtcbiAgcmV0dXJuIGNvbXAuc3BsaXQoL1xccysvKS5tYXAoZnVuY3Rpb24oY29tcCkge1xuICAgIHJldHVybiByZXBsYWNlWFJhbmdlKGNvbXAsIGxvb3NlKTtcbiAgfSkuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlWFJhbmdlKGNvbXAsIGxvb3NlKSB7XG4gIGNvbXAgPSBjb21wLnRyaW0oKTtcbiAgdmFyIHIgPSBsb29zZSA/IHJlW1hSQU5HRUxPT1NFXSA6IHJlW1hSQU5HRV07XG4gIHJldHVybiBjb21wLnJlcGxhY2UociwgZnVuY3Rpb24ocmV0LCBndGx0LCBNLCBtLCBwLCBwcikge1xuICAgIGRlYnVnKCd4UmFuZ2UnLCBjb21wLCByZXQsIGd0bHQsIE0sIG0sIHAsIHByKTtcbiAgICB2YXIgeE0gPSBpc1goTSk7XG4gICAgdmFyIHhtID0geE0gfHwgaXNYKG0pO1xuICAgIHZhciB4cCA9IHhtIHx8IGlzWChwKTtcbiAgICB2YXIgYW55WCA9IHhwO1xuXG4gICAgaWYgKGd0bHQgPT09ICc9JyAmJiBhbnlYKVxuICAgICAgZ3RsdCA9ICcnO1xuXG4gICAgaWYgKHhNKSB7XG4gICAgICBpZiAoZ3RsdCA9PT0gJz4nIHx8IGd0bHQgPT09ICc8Jykge1xuICAgICAgICAvLyBub3RoaW5nIGlzIGFsbG93ZWRcbiAgICAgICAgcmV0ID0gJzwwLjAuMCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBub3RoaW5nIGlzIGZvcmJpZGRlblxuICAgICAgICByZXQgPSAnKic7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChndGx0ICYmIGFueVgpIHtcbiAgICAgIC8vIHJlcGxhY2UgWCB3aXRoIDBcbiAgICAgIGlmICh4bSlcbiAgICAgICAgbSA9IDA7XG4gICAgICBpZiAoeHApXG4gICAgICAgIHAgPSAwO1xuXG4gICAgICBpZiAoZ3RsdCA9PT0gJz4nKSB7XG4gICAgICAgIC8vID4xID0+ID49Mi4wLjBcbiAgICAgICAgLy8gPjEuMiA9PiA+PTEuMy4wXG4gICAgICAgIC8vID4xLjIuMyA9PiA+PSAxLjIuNFxuICAgICAgICBndGx0ID0gJz49JztcbiAgICAgICAgaWYgKHhtKSB7XG4gICAgICAgICAgTSA9ICtNICsgMTtcbiAgICAgICAgICBtID0gMDtcbiAgICAgICAgICBwID0gMDtcbiAgICAgICAgfSBlbHNlIGlmICh4cCkge1xuICAgICAgICAgIG0gPSArbSArIDE7XG4gICAgICAgICAgcCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZ3RsdCA9PT0gJzw9Jykge1xuICAgICAgICAvLyA8PTAuNy54IGlzIGFjdHVhbGx5IDwwLjguMCwgc2luY2UgYW55IDAuNy54IHNob3VsZFxuICAgICAgICAvLyBwYXNzLiAgU2ltaWxhcmx5LCA8PTcueCBpcyBhY3R1YWxseSA8OC4wLjAsIGV0Yy5cbiAgICAgICAgZ3RsdCA9ICc8JztcbiAgICAgICAgaWYgKHhtKVxuICAgICAgICAgIE0gPSArTSArIDE7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBtID0gK20gKyAxO1xuICAgICAgfVxuXG4gICAgICByZXQgPSBndGx0ICsgTSArICcuJyArIG0gKyAnLicgKyBwO1xuICAgIH0gZWxzZSBpZiAoeG0pIHtcbiAgICAgIHJldCA9ICc+PScgKyBNICsgJy4wLjAgPCcgKyAoK00gKyAxKSArICcuMC4wJztcbiAgICB9IGVsc2UgaWYgKHhwKSB7XG4gICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLjAgPCcgKyBNICsgJy4nICsgKCttICsgMSkgKyAnLjAnO1xuICAgIH1cblxuICAgIGRlYnVnKCd4UmFuZ2UgcmV0dXJuJywgcmV0KTtcblxuICAgIHJldHVybiByZXQ7XG4gIH0pO1xufVxuXG4vLyBCZWNhdXNlICogaXMgQU5ELWVkIHdpdGggZXZlcnl0aGluZyBlbHNlIGluIHRoZSBjb21wYXJhdG9yLFxuLy8gYW5kICcnIG1lYW5zIFwiYW55IHZlcnNpb25cIiwganVzdCByZW1vdmUgdGhlICpzIGVudGlyZWx5LlxuZnVuY3Rpb24gcmVwbGFjZVN0YXJzKGNvbXAsIGxvb3NlKSB7XG4gIGRlYnVnKCdyZXBsYWNlU3RhcnMnLCBjb21wLCBsb29zZSk7XG4gIC8vIExvb3NlbmVzcyBpcyBpZ25vcmVkIGhlcmUuICBzdGFyIGlzIGFsd2F5cyBhcyBsb29zZSBhcyBpdCBnZXRzIVxuICByZXR1cm4gY29tcC50cmltKCkucmVwbGFjZShyZVtTVEFSXSwgJycpO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGlzIHBhc3NlZCB0byBzdHJpbmcucmVwbGFjZShyZVtIWVBIRU5SQU5HRV0pXG4vLyBNLCBtLCBwYXRjaCwgcHJlcmVsZWFzZSwgYnVpbGRcbi8vIDEuMiAtIDMuNC41ID0+ID49MS4yLjAgPD0zLjQuNVxuLy8gMS4yLjMgLSAzLjQgPT4gPj0xLjIuMCA8My41LjAgQW55IDMuNC54IHdpbGwgZG9cbi8vIDEuMiAtIDMuNCA9PiA+PTEuMi4wIDwzLjUuMFxuZnVuY3Rpb24gaHlwaGVuUmVwbGFjZSgkMCxcbiAgICAgICAgICAgICAgICAgICAgICAgZnJvbSwgZk0sIGZtLCBmcCwgZnByLCBmYixcbiAgICAgICAgICAgICAgICAgICAgICAgdG8sIHRNLCB0bSwgdHAsIHRwciwgdGIpIHtcblxuICBpZiAoaXNYKGZNKSlcbiAgICBmcm9tID0gJyc7XG4gIGVsc2UgaWYgKGlzWChmbSkpXG4gICAgZnJvbSA9ICc+PScgKyBmTSArICcuMC4wJztcbiAgZWxzZSBpZiAoaXNYKGZwKSlcbiAgICBmcm9tID0gJz49JyArIGZNICsgJy4nICsgZm0gKyAnLjAnO1xuICBlbHNlXG4gICAgZnJvbSA9ICc+PScgKyBmcm9tO1xuXG4gIGlmIChpc1godE0pKVxuICAgIHRvID0gJyc7XG4gIGVsc2UgaWYgKGlzWCh0bSkpXG4gICAgdG8gPSAnPCcgKyAoK3RNICsgMSkgKyAnLjAuMCc7XG4gIGVsc2UgaWYgKGlzWCh0cCkpXG4gICAgdG8gPSAnPCcgKyB0TSArICcuJyArICgrdG0gKyAxKSArICcuMCc7XG4gIGVsc2UgaWYgKHRwcilcbiAgICB0byA9ICc8PScgKyB0TSArICcuJyArIHRtICsgJy4nICsgdHAgKyAnLScgKyB0cHI7XG4gIGVsc2VcbiAgICB0byA9ICc8PScgKyB0bztcblxuICByZXR1cm4gKGZyb20gKyAnICcgKyB0bykudHJpbSgpO1xufVxuXG5cbi8vIGlmIEFOWSBvZiB0aGUgc2V0cyBtYXRjaCBBTEwgb2YgaXRzIGNvbXBhcmF0b3JzLCB0aGVuIHBhc3NcblJhbmdlLnByb3RvdHlwZS50ZXN0ID0gZnVuY3Rpb24odmVyc2lvbikge1xuICBpZiAoIXZlcnNpb24pXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgdmVyc2lvbiA9PT0gJ3N0cmluZycpXG4gICAgdmVyc2lvbiA9IG5ldyBTZW1WZXIodmVyc2lvbiwgdGhpcy5sb29zZSk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNldC5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0ZXN0U2V0KHRoaXMuc2V0W2ldLCB2ZXJzaW9uKSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbmZ1bmN0aW9uIHRlc3RTZXQoc2V0LCB2ZXJzaW9uKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFzZXRbaV0udGVzdCh2ZXJzaW9uKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICh2ZXJzaW9uLnByZXJlbGVhc2UubGVuZ3RoKSB7XG4gICAgLy8gRmluZCB0aGUgc2V0IG9mIHZlcnNpb25zIHRoYXQgYXJlIGFsbG93ZWQgdG8gaGF2ZSBwcmVyZWxlYXNlc1xuICAgIC8vIEZvciBleGFtcGxlLCBeMS4yLjMtcHIuMSBkZXN1Z2FycyB0byA+PTEuMi4zLXByLjEgPDIuMC4wXG4gICAgLy8gVGhhdCBzaG91bGQgYWxsb3cgYDEuMi4zLXByLjJgIHRvIHBhc3MuXG4gICAgLy8gSG93ZXZlciwgYDEuMi40LWFscGhhLm5vdHJlYWR5YCBzaG91bGQgTk9UIGJlIGFsbG93ZWQsXG4gICAgLy8gZXZlbiB0aG91Z2ggaXQncyB3aXRoaW4gdGhlIHJhbmdlIHNldCBieSB0aGUgY29tcGFyYXRvcnMuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZXQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGRlYnVnKHNldFtpXS5zZW12ZXIpO1xuICAgICAgaWYgKHNldFtpXS5zZW12ZXIgPT09IEFOWSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChzZXRbaV0uc2VtdmVyLnByZXJlbGVhc2UubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgYWxsb3dlZCA9IHNldFtpXS5zZW12ZXI7XG4gICAgICAgIGlmIChhbGxvd2VkLm1ham9yID09PSB2ZXJzaW9uLm1ham9yICYmXG4gICAgICAgICAgICBhbGxvd2VkLm1pbm9yID09PSB2ZXJzaW9uLm1pbm9yICYmXG4gICAgICAgICAgICBhbGxvd2VkLnBhdGNoID09PSB2ZXJzaW9uLnBhdGNoKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFZlcnNpb24gaGFzIGEgLXByZSwgYnV0IGl0J3Mgbm90IG9uZSBvZiB0aGUgb25lcyB3ZSBsaWtlLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnRzLnNhdGlzZmllcyA9IHNhdGlzZmllcztcbmZ1bmN0aW9uIHNhdGlzZmllcyh2ZXJzaW9uLCByYW5nZSwgbG9vc2UpIHtcbiAgdHJ5IHtcbiAgICByYW5nZSA9IG5ldyBSYW5nZShyYW5nZSwgbG9vc2UpO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gcmFuZ2UudGVzdCh2ZXJzaW9uKTtcbn1cblxuZXhwb3J0cy5tYXhTYXRpc2Z5aW5nID0gbWF4U2F0aXNmeWluZztcbmZ1bmN0aW9uIG1heFNhdGlzZnlpbmcodmVyc2lvbnMsIHJhbmdlLCBsb29zZSkge1xuICB2YXIgbWF4ID0gbnVsbDtcbiAgdmFyIG1heFNWID0gbnVsbDtcbiAgdHJ5IHtcbiAgICB2YXIgcmFuZ2VPYmogPSBuZXcgUmFuZ2UocmFuZ2UsIGxvb3NlKTtcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB2ZXJzaW9ucy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHJhbmdlT2JqLnRlc3QodikpIHsgLy8gc2F0aXNmaWVzKHYsIHJhbmdlLCBsb29zZSlcbiAgICAgIGlmICghbWF4IHx8IG1heFNWLmNvbXBhcmUodikgPT09IC0xKSB7IC8vIGNvbXBhcmUobWF4LCB2LCB0cnVlKVxuICAgICAgICBtYXggPSB2O1xuICAgICAgICBtYXhTViA9IG5ldyBTZW1WZXIobWF4LCBsb29zZSk7XG4gICAgICB9XG4gICAgfVxuICB9KVxuICByZXR1cm4gbWF4O1xufVxuXG5leHBvcnRzLm1pblNhdGlzZnlpbmcgPSBtaW5TYXRpc2Z5aW5nO1xuZnVuY3Rpb24gbWluU2F0aXNmeWluZyh2ZXJzaW9ucywgcmFuZ2UsIGxvb3NlKSB7XG4gIHZhciBtaW4gPSBudWxsO1xuICB2YXIgbWluU1YgPSBudWxsO1xuICB0cnkge1xuICAgIHZhciByYW5nZU9iaiA9IG5ldyBSYW5nZShyYW5nZSwgbG9vc2UpO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHZlcnNpb25zLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICBpZiAocmFuZ2VPYmoudGVzdCh2KSkgeyAvLyBzYXRpc2ZpZXModiwgcmFuZ2UsIGxvb3NlKVxuICAgICAgaWYgKCFtaW4gfHwgbWluU1YuY29tcGFyZSh2KSA9PT0gMSkgeyAvLyBjb21wYXJlKG1pbiwgdiwgdHJ1ZSlcbiAgICAgICAgbWluID0gdjtcbiAgICAgICAgbWluU1YgPSBuZXcgU2VtVmVyKG1pbiwgbG9vc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIG1pbjtcbn1cblxuZXhwb3J0cy52YWxpZFJhbmdlID0gdmFsaWRSYW5nZTtcbmZ1bmN0aW9uIHZhbGlkUmFuZ2UocmFuZ2UsIGxvb3NlKSB7XG4gIHRyeSB7XG4gICAgLy8gUmV0dXJuICcqJyBpbnN0ZWFkIG9mICcnIHNvIHRoYXQgdHJ1dGhpbmVzcyB3b3Jrcy5cbiAgICAvLyBUaGlzIHdpbGwgdGhyb3cgaWYgaXQncyBpbnZhbGlkIGFueXdheVxuICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UsIGxvb3NlKS5yYW5nZSB8fCAnKic7XG4gIH0gY2F0Y2ggKGVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLy8gRGV0ZXJtaW5lIGlmIHZlcnNpb24gaXMgbGVzcyB0aGFuIGFsbCB0aGUgdmVyc2lvbnMgcG9zc2libGUgaW4gdGhlIHJhbmdlXG5leHBvcnRzLmx0ciA9IGx0cjtcbmZ1bmN0aW9uIGx0cih2ZXJzaW9uLCByYW5nZSwgbG9vc2UpIHtcbiAgcmV0dXJuIG91dHNpZGUodmVyc2lvbiwgcmFuZ2UsICc8JywgbG9vc2UpO1xufVxuXG4vLyBEZXRlcm1pbmUgaWYgdmVyc2lvbiBpcyBncmVhdGVyIHRoYW4gYWxsIHRoZSB2ZXJzaW9ucyBwb3NzaWJsZSBpbiB0aGUgcmFuZ2UuXG5leHBvcnRzLmd0ciA9IGd0cjtcbmZ1bmN0aW9uIGd0cih2ZXJzaW9uLCByYW5nZSwgbG9vc2UpIHtcbiAgcmV0dXJuIG91dHNpZGUodmVyc2lvbiwgcmFuZ2UsICc+JywgbG9vc2UpO1xufVxuXG5leHBvcnRzLm91dHNpZGUgPSBvdXRzaWRlO1xuZnVuY3Rpb24gb3V0c2lkZSh2ZXJzaW9uLCByYW5nZSwgaGlsbywgbG9vc2UpIHtcbiAgdmVyc2lvbiA9IG5ldyBTZW1WZXIodmVyc2lvbiwgbG9vc2UpO1xuICByYW5nZSA9IG5ldyBSYW5nZShyYW5nZSwgbG9vc2UpO1xuXG4gIHZhciBndGZuLCBsdGVmbiwgbHRmbiwgY29tcCwgZWNvbXA7XG4gIHN3aXRjaCAoaGlsbykge1xuICAgIGNhc2UgJz4nOlxuICAgICAgZ3RmbiA9IGd0O1xuICAgICAgbHRlZm4gPSBsdGU7XG4gICAgICBsdGZuID0gbHQ7XG4gICAgICBjb21wID0gJz4nO1xuICAgICAgZWNvbXAgPSAnPj0nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnPCc6XG4gICAgICBndGZuID0gbHQ7XG4gICAgICBsdGVmbiA9IGd0ZTtcbiAgICAgIGx0Zm4gPSBndDtcbiAgICAgIGNvbXAgPSAnPCc7XG4gICAgICBlY29tcCA9ICc8PSc7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTXVzdCBwcm92aWRlIGEgaGlsbyB2YWwgb2YgXCI8XCIgb3IgXCI+XCInKTtcbiAgfVxuXG4gIC8vIElmIGl0IHNhdGlzaWZlcyB0aGUgcmFuZ2UgaXQgaXMgbm90IG91dHNpZGVcbiAgaWYgKHNhdGlzZmllcyh2ZXJzaW9uLCByYW5nZSwgbG9vc2UpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gRnJvbSBub3cgb24sIHZhcmlhYmxlIHRlcm1zIGFyZSBhcyBpZiB3ZSdyZSBpbiBcImd0clwiIG1vZGUuXG4gIC8vIGJ1dCBub3RlIHRoYXQgZXZlcnl0aGluZyBpcyBmbGlwcGVkIGZvciB0aGUgXCJsdHJcIiBmdW5jdGlvbi5cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlLnNldC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBjb21wYXJhdG9ycyA9IHJhbmdlLnNldFtpXTtcblxuICAgIHZhciBoaWdoID0gbnVsbDtcbiAgICB2YXIgbG93ID0gbnVsbDtcblxuICAgIGNvbXBhcmF0b3JzLmZvckVhY2goZnVuY3Rpb24oY29tcGFyYXRvcikge1xuICAgICAgaWYgKGNvbXBhcmF0b3Iuc2VtdmVyID09PSBBTlkpIHtcbiAgICAgICAgY29tcGFyYXRvciA9IG5ldyBDb21wYXJhdG9yKCc+PTAuMC4wJylcbiAgICAgIH1cbiAgICAgIGhpZ2ggPSBoaWdoIHx8IGNvbXBhcmF0b3I7XG4gICAgICBsb3cgPSBsb3cgfHwgY29tcGFyYXRvcjtcbiAgICAgIGlmIChndGZuKGNvbXBhcmF0b3Iuc2VtdmVyLCBoaWdoLnNlbXZlciwgbG9vc2UpKSB7XG4gICAgICAgIGhpZ2ggPSBjb21wYXJhdG9yO1xuICAgICAgfSBlbHNlIGlmIChsdGZuKGNvbXBhcmF0b3Iuc2VtdmVyLCBsb3cuc2VtdmVyLCBsb29zZSkpIHtcbiAgICAgICAgbG93ID0gY29tcGFyYXRvcjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIElmIHRoZSBlZGdlIHZlcnNpb24gY29tcGFyYXRvciBoYXMgYSBvcGVyYXRvciB0aGVuIG91ciB2ZXJzaW9uXG4gICAgLy8gaXNuJ3Qgb3V0c2lkZSBpdFxuICAgIGlmIChoaWdoLm9wZXJhdG9yID09PSBjb21wIHx8IGhpZ2gub3BlcmF0b3IgPT09IGVjb21wKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGxvd2VzdCB2ZXJzaW9uIGNvbXBhcmF0b3IgaGFzIGFuIG9wZXJhdG9yIGFuZCBvdXIgdmVyc2lvblxuICAgIC8vIGlzIGxlc3MgdGhhbiBpdCB0aGVuIGl0IGlzbid0IGhpZ2hlciB0aGFuIHRoZSByYW5nZVxuICAgIGlmICgoIWxvdy5vcGVyYXRvciB8fCBsb3cub3BlcmF0b3IgPT09IGNvbXApICYmXG4gICAgICAgIGx0ZWZuKHZlcnNpb24sIGxvdy5zZW12ZXIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChsb3cub3BlcmF0b3IgPT09IGVjb21wICYmIGx0Zm4odmVyc2lvbiwgbG93LnNlbXZlcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydHMucHJlcmVsZWFzZSA9IHByZXJlbGVhc2U7XG5mdW5jdGlvbiBwcmVyZWxlYXNlKHZlcnNpb24sIGxvb3NlKSB7XG4gIHZhciBwYXJzZWQgPSBwYXJzZSh2ZXJzaW9uLCBsb29zZSk7XG4gIHJldHVybiAocGFyc2VkICYmIHBhcnNlZC5wcmVyZWxlYXNlLmxlbmd0aCkgPyBwYXJzZWQucHJlcmVsZWFzZSA6IG51bGw7XG59XG5cbmV4cG9ydHMuaW50ZXJzZWN0cyA9IGludGVyc2VjdHM7XG5mdW5jdGlvbiBpbnRlcnNlY3RzKHIxLCByMiwgbG9vc2UpIHtcbiAgcjEgPSBuZXcgUmFuZ2UocjEsIGxvb3NlKVxuICByMiA9IG5ldyBSYW5nZShyMiwgbG9vc2UpXG4gIHJldHVybiByMS5pbnRlcnNlY3RzKHIyKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcidcbmltcG9ydCB7IGlzUGxhaW5PYmplY3QsIHR5cG9mIH0gZnJvbSAnLi4vdXRpbC9pbmRleCdcblxuLyoqXG4gKiBOb3JtYWxpemUgYSB2ZXJzaW9uIHN0cmluZy5cbiAqIEBwYXJhbSAge1N0cmluZ30gVmVyc2lvbi4gaWU6IDEsIDEuMCwgMS4wLjBcbiAqIEByZXR1cm4ge1N0cmluZ30gVmVyc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVmVyc2lvbiAodikge1xuICBjb25zdCBpc1ZhbGlkID0gc2VtdmVyLnZhbGlkKHYpXG4gIGlmIChpc1ZhbGlkKSB7XG4gICAgcmV0dXJuIHZcbiAgfVxuXG4gIHYgPSB0eXBlb2YgKHYpID09PSAnc3RyaW5nJyA/IHYgOiAnJ1xuICBjb25zdCBzcGxpdCA9IHYuc3BsaXQoJy4nKVxuICBsZXQgaSA9IDBcbiAgY29uc3QgcmVzdWx0ID0gW11cblxuICB3aGlsZSAoaSA8IDMpIHtcbiAgICBjb25zdCBzID0gdHlwZW9mIChzcGxpdFtpXSkgPT09ICdzdHJpbmcnICYmIHNwbGl0W2ldID8gc3BsaXRbaV0gOiAnMCdcbiAgICByZXN1bHQucHVzaChzKVxuICAgIGkrK1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdC5qb2luKCcuJylcbn1cblxuLyoqXG4gKiBHZXQgaW5mb3JtYXRpb25zIGZyb20gZGlmZmVyZW50IGVycm9yIGtleS4gTGlrZTpcbiAqIC0gY29kZVxuICogLSBlcnJvck1lc3NhZ2VcbiAqIC0gZXJyb3JUeXBlXG4gKiAtIGlzRG93bmdyYWRlXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGtleVxuICogQHBhcmFtICB7c3RyaW5nfSB2YWxcbiAqIEBwYXJhbSAge3N0cmluZ30gY3JpdGVyaWFcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEVycm9yIChrZXksIHZhbCwgY3JpdGVyaWEpIHtcbiAgY29uc3QgcmVzdWx0ID0ge1xuICAgIGlzRG93bmdyYWRlOiB0cnVlLFxuICAgIGVycm9yVHlwZTogMSxcbiAgICBjb2RlOiAxMDAwXG4gIH1cbiAgY29uc3QgZ2V0TXNnID0gZnVuY3Rpb24gKGtleSwgdmFsLCBjcml0ZXJpYSkge1xuICAgIHJldHVybiAnRG93bmdyYWRlWycgKyBrZXkgKyAnXSA6OiBkZXZpY2VJbmZvICdcbiAgICAgICsgdmFsICsgJyBtYXRjaGVkIGNyaXRlcmlhICcgKyBjcml0ZXJpYVxuICB9XG4gIGNvbnN0IF9rZXkgPSBrZXkudG9Mb3dlckNhc2UoKVxuXG4gIHJlc3VsdC5lcnJvck1lc3NhZ2UgPSBnZXRNc2coa2V5LCB2YWwsIGNyaXRlcmlhKVxuXG4gIGlmIChfa2V5LmluZGV4T2YoJ29zdmVyc2lvbicpID49IDApIHtcbiAgICByZXN1bHQuY29kZSA9IDEwMDFcbiAgfVxuICBlbHNlIGlmIChfa2V5LmluZGV4T2YoJ2FwcHZlcnNpb24nKSA+PSAwKSB7XG4gICAgcmVzdWx0LmNvZGUgPSAxMDAyXG4gIH1cbiAgZWxzZSBpZiAoX2tleS5pbmRleE9mKCd3ZWV4dmVyc2lvbicpID49IDApIHtcbiAgICByZXN1bHQuY29kZSA9IDEwMDNcbiAgfVxuICBlbHNlIGlmIChfa2V5LmluZGV4T2YoJ2RldmljZW1vZGVsJykgPj0gMCkge1xuICAgIHJlc3VsdC5jb2RlID0gMTAwNFxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIFdFRVggZnJhbWV3b3JrIGlucHV0KGRldmljZUluZm8pXG4gKiB7XG4gKiAgIHBsYXRmb3JtOiAnaU9TJyBvciAnYW5kcm9pZCdcbiAqICAgb3NWZXJzaW9uOiAnMS4wLjAnIG9yICcxLjAnIG9yICcxJ1xuICogICBhcHBWZXJzaW9uOiAnMS4wLjAnIG9yICcxLjAnIG9yICcxJ1xuICogICB3ZWV4VmVyc2lvbjogJzEuMC4wJyBvciAnMS4wJyBvciAnMSdcbiAqICAgZERldmljZU1vZGVsOiAnTU9ERUxfTkFNRSdcbiAqIH1cbiAqXG4gKiBkb3duZ3JhZGUgY29uZmlnKGNvbmZpZylcbiAqIHtcbiAqICAgaW9zOiB7XG4gKiAgICAgb3NWZXJzaW9uOiAnPjEuMC4wJyBvciAnPj0xLjAuMCcgb3IgJzwxLjAuMCcgb3IgJzw9MS4wLjAnIG9yICcxLjAuMCdcbiAqICAgICBhcHBWZXJzaW9uOiAnPjEuMC4wJyBvciAnPj0xLjAuMCcgb3IgJzwxLjAuMCcgb3IgJzw9MS4wLjAnIG9yICcxLjAuMCdcbiAqICAgICB3ZWV4VmVyc2lvbjogJz4xLjAuMCcgb3IgJz49MS4wLjAnIG9yICc8MS4wLjAnIG9yICc8PTEuMC4wJyBvciAnMS4wLjAnXG4gKiAgICAgZGV2aWNlTW9kZWw6IFsnbW9kZWxBJywgJ21vZGVsQicsIC4uLl1cbiAqICAgfSxcbiAqICAgYW5kcm9pZDoge1xuICogICAgIG9zVmVyc2lvbjogJz4xLjAuMCcgb3IgJz49MS4wLjAnIG9yICc8MS4wLjAnIG9yICc8PTEuMC4wJyBvciAnMS4wLjAnXG4gKiAgICAgYXBwVmVyc2lvbjogJz4xLjAuMCcgb3IgJz49MS4wLjAnIG9yICc8MS4wLjAnIG9yICc8PTEuMC4wJyBvciAnMS4wLjAnXG4gKiAgICAgd2VleFZlcnNpb246ICc+MS4wLjAnIG9yICc+PTEuMC4wJyBvciAnPDEuMC4wJyBvciAnPD0xLjAuMCcgb3IgJzEuMC4wJ1xuICogICAgIGRldmljZU1vZGVsOiBbJ21vZGVsQScsICdtb2RlbEInLCAuLi5dXG4gKiAgIH1cbiAqIH1cbiAqXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSBkZXZpY2VJbmZvIFdlZXggU0RLIGZyYW1ld29yayBpbnB1dFxuICogQHBhcmFtICB7b2JqZWN0fSBjb25maWcgICAgIHVzZXIgaW5wdXRcbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICB7IGlzRG93bmdyYWRlOiB0cnVlL2ZhbHNlLCBlcnJvck1lc3NhZ2UuLi4gfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2sgKGNvbmZpZywgZGV2aWNlSW5mbykge1xuICBkZXZpY2VJbmZvID0gZGV2aWNlSW5mbyB8fCBnbG9iYWwuV1hFbnZpcm9ubWVudFxuICBkZXZpY2VJbmZvID0gaXNQbGFpbk9iamVjdChkZXZpY2VJbmZvKSA/IGRldmljZUluZm8gOiB7fVxuXG4gIGxldCByZXN1bHQgPSB7XG4gICAgaXNEb3duZ3JhZGU6IGZhbHNlIC8vIGRlZmF1dGwgaXMgcGFzc1xuICB9XG5cbiAgaWYgKHR5cG9mKGNvbmZpZykgPT09ICdmdW5jdGlvbicpIHtcbiAgICBsZXQgY3VzdG9tRG93bmdyYWRlID0gY29uZmlnLmNhbGwodGhpcywgZGV2aWNlSW5mbywge1xuICAgICAgc2VtdmVyOiBzZW12ZXIsXG4gICAgICBub3JtYWxpemVWZXJzaW9uXG4gICAgfSlcblxuICAgIGN1c3RvbURvd25ncmFkZSA9ICEhY3VzdG9tRG93bmdyYWRlXG5cbiAgICByZXN1bHQgPSBjdXN0b21Eb3duZ3JhZGUgPyBnZXRFcnJvcignY3VzdG9tJywgJycsICdjdXN0b20gcGFyYW1zJykgOiByZXN1bHRcbiAgfVxuICBlbHNlIHtcbiAgICBjb25maWcgPSBpc1BsYWluT2JqZWN0KGNvbmZpZykgPyBjb25maWcgOiB7fVxuXG4gICAgY29uc3QgcGxhdGZvcm0gPSBkZXZpY2VJbmZvLnBsYXRmb3JtIHx8ICd1bmtub3cnXG4gICAgY29uc3QgZFBsYXRmb3JtID0gcGxhdGZvcm0udG9Mb3dlckNhc2UoKVxuICAgIGNvbnN0IGNPYmogPSBjb25maWdbZFBsYXRmb3JtXSB8fCB7fVxuXG4gICAgZm9yIChjb25zdCBpIGluIGRldmljZUluZm8pIHtcbiAgICAgIGNvbnN0IGtleSA9IGlcbiAgICAgIGNvbnN0IGtleUxvd2VyID0ga2V5LnRvTG93ZXJDYXNlKClcbiAgICAgIGNvbnN0IHZhbCA9IGRldmljZUluZm9baV1cbiAgICAgIGNvbnN0IGlzVmVyc2lvbiA9IGtleUxvd2VyLmluZGV4T2YoJ3ZlcnNpb24nKSA+PSAwXG4gICAgICBjb25zdCBpc0RldmljZU1vZGVsID0ga2V5TG93ZXIuaW5kZXhPZignZGV2aWNlbW9kZWwnKSA+PSAwXG4gICAgICBjb25zdCBjcml0ZXJpYSA9IGNPYmpbaV1cblxuICAgICAgaWYgKGNyaXRlcmlhICYmIGlzVmVyc2lvbikge1xuICAgICAgICBjb25zdCBjID0gbm9ybWFsaXplVmVyc2lvbihjcml0ZXJpYSlcbiAgICAgICAgY29uc3QgZCA9IG5vcm1hbGl6ZVZlcnNpb24oZGV2aWNlSW5mb1tpXSlcblxuICAgICAgICBpZiAoc2VtdmVyLnNhdGlzZmllcyhkLCBjKSkge1xuICAgICAgICAgIHJlc3VsdCA9IGdldEVycm9yKGtleSwgdmFsLCBjcml0ZXJpYSlcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChpc0RldmljZU1vZGVsKSB7XG4gICAgICAgIGNvbnN0IF9jcml0ZXJpYSA9IHR5cG9mKGNyaXRlcmlhKSA9PT0gJ2FycmF5JyA/IGNyaXRlcmlhIDogW2NyaXRlcmlhXVxuICAgICAgICBpZiAoX2NyaXRlcmlhLmluZGV4T2YodmFsKSA+PSAwKSB7XG4gICAgICAgICAgcmVzdWx0ID0gZ2V0RXJyb3Ioa2V5LCB2YWwsIGNyaXRlcmlhKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRWaWV3cG9ydCAoYXBwLCBjb25maWdzID0ge30pIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIFNldCB2aWV3cG9ydCAod2lkdGg6ICR7Y29uZmlncy53aWR0aH0pIGZvciBhcHAjJHthcHAuaWR9LmApXG4gICAgdmFsaWRhdGVWaWV3cG9ydChjb25maWdzKVxuICB9XG5cbiAgLy8gU2VuZCB2aWV3cG9ydCBjb25maWdzIHRvIG5hdGl2ZVxuICBpZiAoYXBwICYmIGFwcC5jYWxsVGFza3MpIHtcbiAgICByZXR1cm4gYXBwLmNhbGxUYXNrcyhbe1xuICAgICAgbW9kdWxlOiAnbWV0YScsXG4gICAgICBtZXRob2Q6ICdzZXRWaWV3cG9ydCcsXG4gICAgICBhcmdzOiBbY29uZmlnc11cbiAgICB9XSlcbiAgfVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnKSB7XG4gICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBDYW4ndCBmaW5kIFwiY2FsbFRhc2tzXCIgbWV0aG9kIG9uIGN1cnJlbnQgYXBwLmApXG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGUgdmlld3BvcnQgY29uZmlnLlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZ3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlVmlld3BvcnQgKGNvbmZpZ3MgPSB7fSkge1xuICBjb25zdCB7IHdpZHRoIH0gPSBjb25maWdzXG4gIGlmICh3aWR0aCkge1xuICAgIGlmICh0eXBlb2Ygd2lkdGggIT09ICdudW1iZXInICYmIHdpZHRoICE9PSAnZGV2aWNlLXdpZHRoJykge1xuICAgICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBOb3Qgc3VwcG9ydCB0byB1c2UgJHt3aWR0aH0gYXMgdmlld3BvcnQgd2lkdGguYClcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGNvbnNvbGUud2FybignW0pTIEZyYW1ld29ya10gdGhlIHZpZXdwb3J0IGNvbmZpZyBzaG91bGQgY29udGFpbiB0aGUgXCJ3aWR0aFwiIHByb3BlcnR5LicpXG4gIHJldHVybiBmYWxzZVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcidcbmltcG9ydCBWbSBmcm9tICcuLi8uLi92bS9pbmRleCdcbmltcG9ydCAqIGFzIGRvd25ncmFkZSBmcm9tICcuLi9kb3duZ3JhZGUnXG5pbXBvcnQgeyBzZXRWaWV3cG9ydCB9IGZyb20gJy4uL3ZpZXdwb3J0J1xuaW1wb3J0IHtcbiAgcmVxdWlyZUN1c3RvbUNvbXBvbmVudFxufSBmcm9tICcuLi9yZWdpc3RlcidcbmltcG9ydCB7XG4gIGlzUGxhaW5PYmplY3QsXG4gIGlzV2VleENvbXBvbmVudCxcbiAgaXNOcG1Nb2R1bGUsXG4gIHJlbW92ZVdlZXhQcmVmaXgsXG4gIHJlbW92ZUpTU3VyZml4XG59IGZyb20gJy4uLy4uL3V0aWwvaW5kZXgnXG5cbi8qKlxuICogYm9vdHN0cmFwIGFwcCBmcm9tIGEgY2VydGFpbiBjdXN0b20gY29tcG9uZW50IHdpdGggY29uZmlnICYgZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gYm9vdHN0cmFwIChhcHAsIG5hbWUsIGNvbmZpZywgZGF0YSkge1xuICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBib290c3RyYXAgZm9yICR7bmFtZX1gKVxuXG4gIC8vIDEuIHZhbGlkYXRlIGN1c3RvbSBjb21wb25lbnQgbmFtZSBmaXJzdFxuICBsZXQgY2xlYW5OYW1lXG4gIGlmIChpc1dlZXhDb21wb25lbnQobmFtZSkpIHtcbiAgICBjbGVhbk5hbWUgPSByZW1vdmVXZWV4UHJlZml4KG5hbWUpXG4gIH1cbiAgZWxzZSBpZiAoaXNOcG1Nb2R1bGUobmFtZSkpIHtcbiAgICBjbGVhbk5hbWUgPSByZW1vdmVKU1N1cmZpeChuYW1lKVxuICAgIC8vIGNoZWNrIGlmIGRlZmluZSBieSBvbGQgJ2RlZmluZScgbWV0aG9kXG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCFyZXF1aXJlQ3VzdG9tQ29tcG9uZW50KGFwcCwgY2xlYW5OYW1lKSkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcihgSXQncyBub3QgYSBjb21wb25lbnQ6ICR7bmFtZX1gKVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKGBXcm9uZyBjb21wb25lbnQgbmFtZTogJHtuYW1lfWApXG4gIH1cblxuICAvLyAyLiB2YWxpZGF0ZSBjb25maWd1cmF0aW9uXG4gIGNvbmZpZyA9IGlzUGxhaW5PYmplY3QoY29uZmlnKSA/IGNvbmZpZyA6IHt9XG4gIC8vIDIuMSB0cmFuc2Zvcm1lciB2ZXJzaW9uIGNoZWNrXG4gIGlmICh0eXBlb2YgY29uZmlnLnRyYW5zZm9ybWVyVmVyc2lvbiA9PT0gJ3N0cmluZycgJiZcbiAgICB0eXBlb2YgZ2xvYmFsLnRyYW5zZm9ybWVyVmVyc2lvbiA9PT0gJ3N0cmluZycgJiZcbiAgICAhc2VtdmVyLnNhdGlzZmllcyhjb25maWcudHJhbnNmb3JtZXJWZXJzaW9uLFxuICAgICAgZ2xvYmFsLnRyYW5zZm9ybWVyVmVyc2lvbikpIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKGBKUyBCdW5kbGUgdmVyc2lvbjogJHtjb25maWcudHJhbnNmb3JtZXJWZXJzaW9ufSBgICtcbiAgICAgIGBub3QgY29tcGF0aWJsZSB3aXRoICR7Z2xvYmFsLnRyYW5zZm9ybWVyVmVyc2lvbn1gKVxuICB9XG4gIC8vIDIuMiBkb3duZ3JhZGUgdmVyc2lvbiBjaGVja1xuICBjb25zdCBkb3duZ3JhZGVSZXN1bHQgPSBkb3duZ3JhZGUuY2hlY2soY29uZmlnLmRvd25ncmFkZSlcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChkb3duZ3JhZGVSZXN1bHQuaXNEb3duZ3JhZGUpIHtcbiAgICBhcHAuY2FsbFRhc2tzKFt7XG4gICAgICBtb2R1bGU6ICdpbnN0YW5jZVdyYXAnLFxuICAgICAgbWV0aG9kOiAnZXJyb3InLFxuICAgICAgYXJnczogW1xuICAgICAgICBkb3duZ3JhZGVSZXN1bHQuZXJyb3JUeXBlLFxuICAgICAgICBkb3duZ3JhZGVSZXN1bHQuY29kZSxcbiAgICAgICAgZG93bmdyYWRlUmVzdWx0LmVycm9yTWVzc2FnZVxuICAgICAgXVxuICAgIH1dKVxuICAgIHJldHVybiBuZXcgRXJyb3IoYERvd25ncmFkZVske2Rvd25ncmFkZVJlc3VsdC5jb2RlfV06ICR7ZG93bmdyYWRlUmVzdWx0LmVycm9yTWVzc2FnZX1gKVxuICB9XG5cbiAgLy8gc2V0IHZpZXdwb3J0XG4gIGlmIChjb25maWcudmlld3BvcnQpIHtcbiAgICBzZXRWaWV3cG9ydChhcHAsIGNvbmZpZy52aWV3cG9ydClcbiAgfVxuXG4gIC8vIDMuIGNyZWF0ZSBhIG5ldyBWbSB3aXRoIGN1c3RvbSBjb21wb25lbnQgbmFtZSBhbmQgZGF0YVxuICBhcHAudm0gPSBuZXcgVm0oY2xlYW5OYW1lLCBudWxsLCB7IF9hcHA6IGFwcCB9LCBudWxsLCBkYXRhKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQge1xuICBpc1dlZXhDb21wb25lbnQsXG4gIGlzV2VleE1vZHVsZSxcbiAgaXNOb3JtYWxNb2R1bGUsXG4gIGlzTnBtTW9kdWxlLFxuICByZW1vdmVXZWV4UHJlZml4LFxuICByZW1vdmVKU1N1cmZpeFxufSBmcm9tICcuLi8uLi91dGlsL2luZGV4J1xuaW1wb3J0IHtcbiAgcmVnaXN0ZXJDdXN0b21Db21wb25lbnQsXG4gIHJlcXVpcmVDdXN0b21Db21wb25lbnQsXG4gIGluaXRNb2R1bGVzXG59IGZyb20gJy4uL3JlZ2lzdGVyJ1xuXG4vKipcbiAqIGRlZmluZShuYW1lLCBmYWN0b3J5KSBmb3IgcHJpbWFyeSB1c2FnZVxuICogb3JcbiAqIGRlZmluZShuYW1lLCBkZXBzLCBmYWN0b3J5KSBmb3IgY29tcGF0aWJpbGl0eVxuICogTm90aWNlOiBETyBOT1QgdXNlIGZ1bmN0aW9uIGRlZmluZSgpIHt9LFxuICogaXQgd2lsbCBjYXVzZSBlcnJvciBhZnRlciBidWlsZGVkIGJ5IHdlYnBhY2tcbiAqL1xuZXhwb3J0IGNvbnN0IGRlZmluZUZuID0gZnVuY3Rpb24gKGFwcCwgbmFtZSwgLi4uYXJncykge1xuICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBkZWZpbmUgYSBjb21wb25lbnQgJHtuYW1lfWApXG5cbiAgLy8gYWRhcHQgYXJnczpcbiAgLy8gMS4gbmFtZSwgZGVwc1tdLCBmYWN0b3J5KClcbiAgLy8gMi4gbmFtZSwgZmFjdG9yeSgpXG4gIC8vIDMuIG5hbWUsIGRlZmluaXRpb257fVxuICBsZXQgZmFjdG9yeSwgZGVmaW5pdGlvblxuICBpZiAoYXJncy5sZW5ndGggPiAxKSB7XG4gICAgZGVmaW5pdGlvbiA9IGFyZ3NbMV1cbiAgfVxuICBlbHNlIHtcbiAgICBkZWZpbml0aW9uID0gYXJnc1swXVxuICB9XG4gIGlmICh0eXBlb2YgZGVmaW5pdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGZhY3RvcnkgPSBkZWZpbml0aW9uXG4gICAgZGVmaW5pdGlvbiA9IG51bGxcbiAgfVxuXG4gIC8vIHJlc29sdmUgZGVmaW5pdGlvbiBmcm9tIGZhY3RvcnlcbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCByID0gKG5hbWUpID0+IHtcbiAgICAgIGlmIChpc1dlZXhDb21wb25lbnQobmFtZSkpIHtcbiAgICAgICAgY29uc3QgY2xlYW5OYW1lID0gcmVtb3ZlV2VleFByZWZpeChuYW1lKVxuICAgICAgICByZXR1cm4gcmVxdWlyZUN1c3RvbUNvbXBvbmVudChhcHAsIGNsZWFuTmFtZSlcbiAgICAgIH1cbiAgICAgIGlmIChpc1dlZXhNb2R1bGUobmFtZSkpIHtcbiAgICAgICAgY29uc3QgY2xlYW5OYW1lID0gcmVtb3ZlV2VleFByZWZpeChuYW1lKVxuICAgICAgICByZXR1cm4gYXBwLnJlcXVpcmVNb2R1bGUoY2xlYW5OYW1lKVxuICAgICAgfVxuICAgICAgaWYgKGlzTm9ybWFsTW9kdWxlKG5hbWUpIHx8IGlzTnBtTW9kdWxlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IHJlbW92ZUpTU3VyZml4KG5hbWUpXG4gICAgICAgIHJldHVybiBhcHAuY29tbW9uTW9kdWxlc1tjbGVhbk5hbWVdXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IG0gPSB7IGV4cG9ydHM6IHt9fVxuICAgIGZhY3RvcnkociwgbS5leHBvcnRzLCBtKVxuICAgIGRlZmluaXRpb24gPSBtLmV4cG9ydHNcbiAgfVxuXG4gIC8vIGFwcGx5IGRlZmluaXRpb25cbiAgaWYgKGlzV2VleENvbXBvbmVudChuYW1lKSkge1xuICAgIGNvbnN0IGNsZWFuTmFtZSA9IHJlbW92ZVdlZXhQcmVmaXgobmFtZSlcbiAgICByZWdpc3RlckN1c3RvbUNvbXBvbmVudChhcHAsIGNsZWFuTmFtZSwgZGVmaW5pdGlvbilcbiAgfVxuICBlbHNlIGlmIChpc1dlZXhNb2R1bGUobmFtZSkpIHtcbiAgICBjb25zdCBjbGVhbk5hbWUgPSByZW1vdmVXZWV4UHJlZml4KG5hbWUpXG4gICAgaW5pdE1vZHVsZXMoeyBbY2xlYW5OYW1lXTogZGVmaW5pdGlvbiB9KVxuICB9XG4gIGVsc2UgaWYgKGlzTm9ybWFsTW9kdWxlKG5hbWUpKSB7XG4gICAgY29uc3QgY2xlYW5OYW1lID0gcmVtb3ZlSlNTdXJmaXgobmFtZSlcbiAgICBhcHAuY29tbW9uTW9kdWxlc1tjbGVhbk5hbWVdID0gZGVmaW5pdGlvblxuICB9XG4gIGVsc2UgaWYgKGlzTnBtTW9kdWxlKG5hbWUpKSB7XG4gICAgY29uc3QgY2xlYW5OYW1lID0gcmVtb3ZlSlNTdXJmaXgobmFtZSlcbiAgICBpZiAoZGVmaW5pdGlvbi50ZW1wbGF0ZSB8fFxuICAgICAgICBkZWZpbml0aW9uLnN0eWxlIHx8XG4gICAgICAgIGRlZmluaXRpb24ubWV0aG9kcykge1xuICAgICAgLy8gZG93bmdyYWRlIHRvIG9sZCBkZWZpbmUgbWV0aG9kIChkZWZpbmUoJ2NvbXBvbmVudE5hbWUnLCBmYWN0b3J5KSlcbiAgICAgIC8vIHRoZSBleHBvcnRzIGNvbnRhaW4gb25lIGtleSBvZiB0ZW1wbGF0ZSwgc3R5bGUgb3IgbWV0aG9kc1xuICAgICAgLy8gYnV0IGl0IGhhcyByaXNrISEhXG4gICAgICByZWdpc3RlckN1c3RvbUNvbXBvbmVudChhcHAsIGNsZWFuTmFtZSwgZGVmaW5pdGlvbilcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBhcHAuY29tbW9uTW9kdWxlc1tjbGVhbk5hbWVdID0gZGVmaW5pdGlvblxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlciAoYXBwLCB0eXBlLCBvcHRpb25zKSB7XG4gIGNvbnNvbGUud2FybignW0pTIEZyYW1ld29ya10gUmVnaXN0ZXIgaXMgZGVwcmVjYXRlZCwgcGxlYXNlIGluc3RhbGwgbGFzdGVzdCB0cmFuc2Zvcm1lci4nKVxuICByZWdpc3RlckN1c3RvbUNvbXBvbmVudChhcHAsIHR5cGUsIG9wdGlvbnMpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogYXBpIHRoYXQgaW52b2tlZCBieSBqcyBidW5kbGUgY29kZVxuICpcbiAqIC0gZGVmaW5lKG5hbWUsIGZhY3RvcnkpOiBkZWZpbmUgYSBuZXcgY29tcG9zZWQgY29tcG9uZW50IHR5cGVcbiAqIC0gYm9vdHN0cmFwKHR5cGUsIGNvbmZpZywgZGF0YSk6IHJlcXVpcmUgYSBjZXJ0YWluIHR5cGUgJlxuICogICAgICAgICByZW5kZXIgd2l0aCAob3B0aW9uYWwpIGRhdGFcbiAqXG4gKiBkZXByZWNhdGVkOlxuICogLSByZWdpc3Rlcih0eXBlLCBvcHRpb25zKTogcmVnaXN0ZXIgYSBuZXcgY29tcG9zZWQgY29tcG9uZW50IHR5cGVcbiAqIC0gcmVuZGVyKHR5cGUsIGRhdGEpOiByZW5kZXIgYnkgYSBjZXJ0YWluIHR5cGUgd2l0aCAob3B0aW9uYWwpIGRhdGFcbiAqIC0gcmVxdWlyZSh0eXBlKShkYXRhKTogcmVxdWlyZSBhIHR5cGUgdGhlbiByZW5kZXIgd2l0aCBkYXRhXG4gKi9cblxuZXhwb3J0IHsgYm9vdHN0cmFwIH0gZnJvbSAnLi9ib290c3RyYXAnXG5leHBvcnQgeyBkZWZpbmVGbiwgcmVnaXN0ZXIgfSBmcm9tICcuL2RlZmluZSdcbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBpbnN0YW5jZSBjb250cm9scyBmcm9tIG5hdGl2ZVxuICpcbiAqIC0gZmlyZSBldmVudFxuICogLSBjYWxsYmFja1xuICogLSByZWZyZXNoXG4gKiAtIGRlc3Ryb3lcbiAqXG4gKiBjb3JyZXNwb25kZWQgd2l0aCB0aGUgQVBJIG9mIGluc3RhbmNlIG1hbmFnZXIgKGZyYW1ld29yay5qcylcbiAqL1xuaW1wb3J0IHsgZXh0ZW5kLCB0eXBvZiB9IGZyb20gJy4uLy4uL3V0aWwvaW5kZXgnXG5cbi8qKlxuICogUmVmcmVzaCBhbiBhcHAgd2l0aCBkYXRhIHRvIGl0cyByb290IGNvbXBvbmVudCBvcHRpb25zLlxuICogQHBhcmFtICB7b2JqZWN0fSBhcHBcbiAqIEBwYXJhbSAge2FueX0gICAgZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaCAoYXBwLCBkYXRhKSB7XG4gIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIFJlZnJlc2ggd2l0aGAsIGRhdGEsIGBpbiBpbnN0YW5jZVske2FwcC5pZH1dYClcbiAgY29uc3Qgdm0gPSBhcHAudm1cbiAgaWYgKHZtICYmIGRhdGEpIHtcbiAgICBpZiAodHlwZW9mIHZtLnJlZnJlc2hEYXRhID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2bS5yZWZyZXNoRGF0YShkYXRhKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGV4dGVuZCh2bSwgZGF0YSlcbiAgICB9XG4gICAgYXBwLmRpZmZlci5mbHVzaCgpXG4gICAgYXBwLmRvYy50YXNrQ2VudGVyLnNlbmQoJ2RvbScsIHsgYWN0aW9uOiAncmVmcmVzaEZpbmlzaCcgfSwgW10pXG4gICAgcmV0dXJuXG4gIH1cbiAgcmV0dXJuIG5ldyBFcnJvcihgaW52YWxpZCBkYXRhIFwiJHtkYXRhfVwiYClcbn1cblxuLyoqXG4gKiBEZXN0cm95IGFuIGFwcC5cbiAqIEBwYXJhbSAge29iamVjdH0gYXBwXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95IChhcHApIHtcbiAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gRGVzdG9yeSBhbiBpbnN0YW5jZSgke2FwcC5pZH0pYClcblxuICBpZiAoYXBwLnZtKSB7XG4gICAgZGVzdHJveVZtKGFwcC52bSlcbiAgfVxuXG4gIGFwcC5pZCA9ICcnXG4gIGFwcC5vcHRpb25zID0gbnVsbFxuICBhcHAuYmxvY2tzID0gbnVsbFxuICBhcHAudm0gPSBudWxsXG4gIGFwcC5kb2MudGFza0NlbnRlci5kZXN0cm95Q2FsbGJhY2soKVxuICBhcHAuZG9jLmRlc3Ryb3koKVxuICBhcHAuZG9jID0gbnVsbFxuICBhcHAuY3VzdG9tQ29tcG9uZW50TWFwID0gbnVsbFxuICBhcHAuY29tbW9uTW9kdWxlcyA9IG51bGxcbn1cblxuLyoqXG4gKiBEZXN0cm95IGFuIFZtLlxuICogQHBhcmFtIHtvYmplY3R9IHZtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vm0gKHZtKSB7XG4gIGRlbGV0ZSB2bS5fYXBwXG4gIGRlbGV0ZSB2bS5fY29tcHV0ZWRcbiAgZGVsZXRlIHZtLl9jc3NcbiAgZGVsZXRlIHZtLl9kYXRhXG4gIGRlbGV0ZSB2bS5faWRzXG4gIGRlbGV0ZSB2bS5fbWV0aG9kc1xuICBkZWxldGUgdm0uX29wdGlvbnNcbiAgZGVsZXRlIHZtLl9wYXJlbnRcbiAgZGVsZXRlIHZtLl9wYXJlbnRFbFxuICBkZWxldGUgdm0uX3Jvb3RFbFxuXG4gIC8vIHJlbW92ZSBhbGwgd2F0Y2hlcnNcbiAgaWYgKHZtLl93YXRjaGVycykge1xuICAgIGxldCB3YXRjaGVyQ291bnQgPSB2bS5fd2F0Y2hlcnMubGVuZ3RoXG4gICAgd2hpbGUgKHdhdGNoZXJDb3VudC0tKSB7XG4gICAgICB2bS5fd2F0Y2hlcnNbd2F0Y2hlckNvdW50XS50ZWFyZG93bigpXG4gICAgfVxuICAgIGRlbGV0ZSB2bS5fd2F0Y2hlcnNcbiAgfVxuXG4gIC8vIGRlc3Ryb3kgY2hpbGQgdm1zIHJlY3Vyc2l2ZWx5XG4gIGlmICh2bS5fY2hpbGRyZW5WbXMpIHtcbiAgICBsZXQgdm1Db3VudCA9IHZtLl9jaGlsZHJlblZtcy5sZW5ndGhcbiAgICB3aGlsZSAodm1Db3VudC0tKSB7XG4gICAgICBkZXN0cm95Vm0odm0uX2NoaWxkcmVuVm1zW3ZtQ291bnRdKVxuICAgIH1cbiAgICBkZWxldGUgdm0uX2NoaWxkcmVuVm1zXG4gIH1cblxuICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBcImRlc3Ryb3llZFwiIGxpZmVjeWNsZSBpbiBWbSgke3ZtLl90eXBlfSlgKVxuICB2bS4kZW1pdCgnaG9vazpkZXN0cm95ZWQnKVxuXG4gIGRlbGV0ZSB2bS5fdHlwZVxuICBkZWxldGUgdm0uX3ZtRXZlbnRzXG59XG5cbi8qKlxuICogR2V0IGEgSlNPTiBvYmplY3QgdG8gZGVzY3JpYmUgdGhlIGRvY3VtZW50IGJvZHkuXG4gKiBAcGFyYW0gIHtvYmplY3R9IGFwcFxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQgKGFwcCkge1xuICBjb25zdCBkb2MgPSBhcHAuZG9jIHx8IHt9XG4gIGNvbnN0IGJvZHkgPSBkb2MuYm9keSB8fCB7fVxuICByZXR1cm4gYm9keS50b0pTT04gPyBib2R5LnRvSlNPTigpIDoge31cbn1cblxuLyoqXG4gKiBGaXJlIGFuIGV2ZW50IGZyb20gcmVuZGVyZXIuIFRoZSBldmVudCBoYXMgdHlwZSwgYW4gZXZlbnQgb2JqZWN0IGFuZCBhblxuICogZWxlbWVudCByZWYuIElmIHRoZSBldmVudCBjb21lcyB3aXRoIHNvbWUgdmlydHVhbC1ET00gY2hhbmdlcywgaXQgc2hvdWxkXG4gKiBoYXZlIG9uZSBtb3JlIHBhcmFtZXRlciB0byBkZXNjcmliZSB0aGUgY2hhbmdlcy5cbiAqIEBwYXJhbSAge29iamVjdH0gYXBwXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHJlZlxuICogQHBhcmFtICB7dHlwZX0gICB0eXBlXG4gKiBAcGFyYW0gIHtvYmplY3R9IGVcbiAqIEBwYXJhbSAge29iamVjdH0gZG9tQ2hhbmdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmlyZUV2ZW50IChhcHAsIHJlZiwgdHlwZSwgZSwgZG9tQ2hhbmdlcykge1xuICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBGaXJlIGEgXCIke3R5cGV9XCIgZXZlbnQgb24gYW4gZWxlbWVudCgke3JlZn0pIGluIGluc3RhbmNlKCR7YXBwLmlkfSlgKVxuICBpZiAoQXJyYXkuaXNBcnJheShyZWYpKSB7XG4gICAgcmVmLnNvbWUoKHJlZikgPT4ge1xuICAgICAgcmV0dXJuIGZpcmVFdmVudChhcHAsIHJlZiwgdHlwZSwgZSkgIT09IGZhbHNlXG4gICAgfSlcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBlbCA9IGFwcC5kb2MuZ2V0UmVmKHJlZilcbiAgaWYgKGVsKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXBwLmRvYy5maXJlRXZlbnQoZWwsIHR5cGUsIGUsIGRvbUNoYW5nZXMpXG4gICAgYXBwLmRpZmZlci5mbHVzaCgpXG4gICAgYXBwLmRvYy50YXNrQ2VudGVyLnNlbmQoJ2RvbScsIHsgYWN0aW9uOiAndXBkYXRlRmluaXNoJyB9LCBbXSlcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgcmV0dXJuIG5ldyBFcnJvcihgaW52YWxpZCBlbGVtZW50IHJlZmVyZW5jZSBcIiR7cmVmfVwiYClcbn1cblxuLyoqXG4gKiBNYWtlIGEgY2FsbGJhY2sgZm9yIGEgY2VydGFpbiBhcHAuXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgYXBwXG4gKiBAcGFyYW0gIHtudW1iZXJ9ICAgY2FsbGJhY2tJZFxuICogQHBhcmFtICB7YW55fSAgICAgIGRhdGFcbiAqIEBwYXJhbSAge2Jvb2xlYW59ICBpZktlZXBBbGl2ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsbGJhY2sgKGFwcCwgY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpIHtcbiAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gSW52b2tlIGEgY2FsbGJhY2soJHtjYWxsYmFja0lkfSkgd2l0aGAsIGRhdGEsIGBpbiBpbnN0YW5jZSgke2FwcC5pZH0pYClcbiAgY29uc3QgcmVzdWx0ID0gYXBwLmRvYy50YXNrQ2VudGVyLmNhbGxiYWNrKGNhbGxiYWNrSWQsIGRhdGEsIGlmS2VlcEFsaXZlKVxuICB1cGRhdGVBY3Rpb25zKGFwcClcbiAgYXBwLmRvYy50YXNrQ2VudGVyLnNlbmQoJ2RvbScsIHsgYWN0aW9uOiAndXBkYXRlRmluaXNoJyB9LCBbXSlcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHZpcnR1YWwtRE9NIG11dGF0aW9ucyB0b2dldGhlciBhbmQgc2VuZCB0aGVtIHRvIHJlbmRlcmVyLlxuICogQHBhcmFtICB7b2JqZWN0fSBhcHBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUFjdGlvbnMgKGFwcCkge1xuICBhcHAuZGlmZmVyLmZsdXNoKClcbn1cblxuLyoqXG4gKiBDYWxsIGFsbCB0YXNrcyBmcm9tIGFuIGFwcCB0byByZW5kZXJlciAobmF0aXZlKS5cbiAqIEBwYXJhbSAge29iamVjdH0gYXBwXG4gKiBAcGFyYW0gIHthcnJheX0gIHRhc2tzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxsVGFza3MgKGFwcCwgdGFza3MpIHtcbiAgbGV0IHJlc3VsdFxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmICh0eXBvZih0YXNrcykgIT09ICdhcnJheScpIHtcbiAgICB0YXNrcyA9IFt0YXNrc11cbiAgfVxuXG4gIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgcmVzdWx0ID0gYXBwLmRvYy50YXNrQ2VudGVyLnNlbmQoXG4gICAgICAnbW9kdWxlJyxcbiAgICAgIHtcbiAgICAgICAgbW9kdWxlOiB0YXNrLm1vZHVsZSxcbiAgICAgICAgbWV0aG9kOiB0YXNrLm1ldGhvZFxuICAgICAgfSxcbiAgICAgIHRhc2suYXJnc1xuICAgIClcbiAgfSlcblxuICByZXR1cm4gcmVzdWx0XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogaW5zdGFuY2UgY29udHJvbHMgZnJvbSBuYXRpdmVcbiAqXG4gKiAtIGluaXQgYnVuZGxlXG4gKlxuICogY29ycmVzcG9uZGVkIHdpdGggdGhlIEFQSSBvZiBpbnN0YW5jZSBtYW5hZ2VyIChmcmFtZXdvcmsuanMpXG4gKi9cblxuaW1wb3J0IFZtIGZyb20gJy4uLy4uL3ZtL2luZGV4J1xuaW1wb3J0IHsgcmVtb3ZlV2VleFByZWZpeCB9IGZyb20gJy4uLy4uL3V0aWwvaW5kZXgnXG5pbXBvcnQge1xuICBkZWZpbmVGbixcbiAgYm9vdHN0cmFwLFxuICByZWdpc3RlclxufSBmcm9tICcuLi9idW5kbGUvaW5kZXgnXG5pbXBvcnQgeyB1cGRhdGVBY3Rpb25zIH0gZnJvbSAnLi9taXNjJ1xuXG4vKipcbiAqIEluaXQgYW4gYXBwIGJ5IHJ1biBjb2RlIHdpdGdoIGRhdGFcbiAqIEBwYXJhbSAge29iamVjdH0gYXBwXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSAge29iamVjdH0gZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdCAoYXBwLCBjb2RlLCBkYXRhLCBzZXJ2aWNlcykge1xuICBjb25zb2xlLmRlYnVnKCdbSlMgRnJhbWV3b3JrXSBJbnRpYWxpemUgYW4gaW5zdGFuY2Ugd2l0aDpcXG4nLCBkYXRhKVxuICBsZXQgcmVzdWx0XG5cbiAgLy8gcHJlcGFyZSBhcHAgZW52IG1ldGhvZHNcbiAgY29uc3QgYnVuZGxlRGVmaW5lID0gKC4uLmFyZ3MpID0+IGRlZmluZUZuKGFwcCwgLi4uYXJncylcbiAgY29uc3QgYnVuZGxlQm9vdHN0cmFwID0gKG5hbWUsIGNvbmZpZywgX2RhdGEpID0+IHtcbiAgICByZXN1bHQgPSBib290c3RyYXAoYXBwLCBuYW1lLCBjb25maWcsIF9kYXRhIHx8IGRhdGEpXG4gICAgdXBkYXRlQWN0aW9ucyhhcHApXG4gICAgYXBwLmRvYy5saXN0ZW5lci5jcmVhdGVGaW5pc2goKVxuICAgIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIEFmdGVyIGludGlhbGl6ZWQgYW4gaW5zdGFuY2UoJHthcHAuaWR9KWApXG4gIH1cbiAgY29uc3QgYnVuZGxlVm0gPSBWbVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBjb25zdCBidW5kbGVSZWdpc3RlciA9ICguLi5hcmdzKSA9PiByZWdpc3RlcihhcHAsIC4uLmFyZ3MpXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGNvbnN0IGJ1bmRsZVJlbmRlciA9IChuYW1lLCBfZGF0YSkgPT4ge1xuICAgIHJlc3VsdCA9IGJvb3RzdHJhcChhcHAsIG5hbWUsIHt9LCBfZGF0YSlcbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBjb25zdCBidW5kbGVSZXF1aXJlID0gbmFtZSA9PiBfZGF0YSA9PiB7XG4gICAgcmVzdWx0ID0gYm9vdHN0cmFwKGFwcCwgbmFtZSwge30sIF9kYXRhKVxuICB9XG4gIGNvbnN0IGJ1bmRsZURvY3VtZW50ID0gYXBwLmRvY1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBjb25zdCBidW5kbGVSZXF1aXJlTW9kdWxlID0gbmFtZSA9PiBhcHAucmVxdWlyZU1vZHVsZShyZW1vdmVXZWV4UHJlZml4KG5hbWUpKVxuXG4gIGNvbnN0IHdlZXhHbG9iYWxPYmplY3QgPSB7XG4gICAgY29uZmlnOiBhcHAub3B0aW9ucyxcbiAgICBkZWZpbmU6IGJ1bmRsZURlZmluZSxcbiAgICBib290c3RyYXA6IGJ1bmRsZUJvb3RzdHJhcCxcbiAgICByZXF1aXJlTW9kdWxlOiBidW5kbGVSZXF1aXJlTW9kdWxlLFxuICAgIGRvY3VtZW50OiBidW5kbGVEb2N1bWVudCxcbiAgICBWbTogYnVuZGxlVm1cbiAgfVxuXG4gIE9iamVjdC5mcmVlemUod2VleEdsb2JhbE9iamVjdClcblxuICAvLyBwcmVwYXJlIGNvZGVcbiAgbGV0IGZ1bmN0aW9uQm9keVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHR5cGVvZiBjb2RlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gYGZ1bmN0aW9uICgpIHsuLi59YCAtPiBgey4uLn1gXG4gICAgLy8gbm90IHZlcnkgc3RyaWN0XG4gICAgZnVuY3Rpb25Cb2R5ID0gY29kZS50b1N0cmluZygpLnN1YnN0cigxMilcbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBlbHNlIGlmIChjb2RlKSB7XG4gICAgZnVuY3Rpb25Cb2R5ID0gY29kZS50b1N0cmluZygpXG4gIH1cbiAgLy8gd3JhcCBJRkZFIGFuZCB1c2Ugc3RyaWN0IG1vZGVcbiAgZnVuY3Rpb25Cb2R5ID0gYChmdW5jdGlvbihnbG9iYWwpe1xcblxcblwidXNlIHN0cmljdFwiO1xcblxcbiAke2Z1bmN0aW9uQm9keX0gXFxuXFxufSkoT2JqZWN0LmNyZWF0ZSh0aGlzKSlgXG5cbiAgLy8gcnVuIGNvZGUgYW5kIGdldCByZXN1bHRcbiAgY29uc3QgeyBXWEVudmlyb25tZW50IH0gPSBnbG9iYWxcbiAgY29uc3QgdGltZXJBUElzID0ge31cblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKFdYRW52aXJvbm1lbnQgJiYgV1hFbnZpcm9ubWVudC5wbGF0Zm9ybSAhPT0gJ1dlYicpIHtcbiAgICAvLyB0aW1lciBBUElzIHBvbHlmaWxsIGluIG5hdGl2ZVxuICAgIGNvbnN0IHRpbWVyID0gYXBwLnJlcXVpcmVNb2R1bGUoJ3RpbWVyJylcbiAgICBPYmplY3QuYXNzaWduKHRpbWVyQVBJcywge1xuICAgICAgc2V0VGltZW91dDogKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgaGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBhcmdzWzBdKC4uLmFyZ3Muc2xpY2UoMikpXG4gICAgICAgIH1cbiAgICAgICAgdGltZXIuc2V0VGltZW91dChoYW5kbGVyLCBhcmdzWzFdKVxuICAgICAgICByZXR1cm4gYXBwLmRvYy50YXNrQ2VudGVyLmNhbGxiYWNrTWFuYWdlci5sYXN0Q2FsbGJhY2tJZC50b1N0cmluZygpXG4gICAgICB9LFxuICAgICAgc2V0SW50ZXJ2YWw6ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXJnc1swXSguLi5hcmdzLnNsaWNlKDIpKVxuICAgICAgICB9XG4gICAgICAgIHRpbWVyLnNldEludGVydmFsKGhhbmRsZXIsIGFyZ3NbMV0pXG4gICAgICAgIHJldHVybiBhcHAuZG9jLnRhc2tDZW50ZXIuY2FsbGJhY2tNYW5hZ2VyLmxhc3RDYWxsYmFja0lkLnRvU3RyaW5nKClcbiAgICAgIH0sXG4gICAgICBjbGVhclRpbWVvdXQ6IChuKSA9PiB7XG4gICAgICAgIHRpbWVyLmNsZWFyVGltZW91dChuKVxuICAgICAgfSxcbiAgICAgIGNsZWFySW50ZXJ2YWw6IChuKSA9PiB7XG4gICAgICAgIHRpbWVyLmNsZWFySW50ZXJ2YWwobilcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIC8vIHJ1biBjb2RlIGFuZCBnZXQgcmVzdWx0XG4gIGNvbnN0IGdsb2JhbE9iamVjdHMgPSBPYmplY3QuYXNzaWduKHtcbiAgICBkZWZpbmU6IGJ1bmRsZURlZmluZSxcbiAgICByZXF1aXJlOiBidW5kbGVSZXF1aXJlLFxuICAgIGJvb3RzdHJhcDogYnVuZGxlQm9vdHN0cmFwLFxuICAgIHJlZ2lzdGVyOiBidW5kbGVSZWdpc3RlcixcbiAgICByZW5kZXI6IGJ1bmRsZVJlbmRlcixcbiAgICBfX3dlZXhfZGVmaW5lX186IGJ1bmRsZURlZmluZSwgLy8gYWxpYXMgZm9yIGRlZmluZVxuICAgIF9fd2VleF9ib290c3RyYXBfXzogYnVuZGxlQm9vdHN0cmFwLCAvLyBhbGlhcyBmb3IgYm9vdHN0cmFwXG4gICAgX193ZWV4X2RvY3VtZW50X186IGJ1bmRsZURvY3VtZW50LFxuICAgIF9fd2VleF9yZXF1aXJlX186IGJ1bmRsZVJlcXVpcmVNb2R1bGUsXG4gICAgX193ZWV4X3ZpZXdtb2RlbF9fOiBidW5kbGVWbSxcbiAgICB3ZWV4OiB3ZWV4R2xvYmFsT2JqZWN0XG4gIH0sIHRpbWVyQVBJcywgc2VydmljZXMpXG4gIGlmICghY2FsbEZ1bmN0aW9uTmF0aXZlKGdsb2JhbE9iamVjdHMsIGZ1bmN0aW9uQm9keSkpIHtcbiAgICAvLyBJZiBmYWlsZWQgdG8gY29tcGlsZSBmdW5jdGlvbkJvZHkgb24gbmF0aXZlIHNpZGUsXG4gICAgLy8gZmFsbGJhY2sgdG8gY2FsbEZ1bmN0aW9uLlxuICAgIGNhbGxGdW5jdGlvbihnbG9iYWxPYmplY3RzLCBmdW5jdGlvbkJvZHkpXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogQ2FsbCBhIG5ldyBmdW5jdGlvbiBib2R5IHdpdGggc29tZSBnbG9iYWwgb2JqZWN0cy5cbiAqIEBwYXJhbSAge29iamVjdH0gZ2xvYmFsT2JqZWN0c1xuICogQHBhcmFtICB7c3RyaW5nfSBjb2RlXG4gKiBAcmV0dXJuIHthbnl9XG4gKi9cbmZ1bmN0aW9uIGNhbGxGdW5jdGlvbiAoZ2xvYmFsT2JqZWN0cywgYm9keSkge1xuICBjb25zdCBnbG9iYWxLZXlzID0gW11cbiAgY29uc3QgZ2xvYmFsVmFsdWVzID0gW11cbiAgZm9yIChjb25zdCBrZXkgaW4gZ2xvYmFsT2JqZWN0cykge1xuICAgIGdsb2JhbEtleXMucHVzaChrZXkpXG4gICAgZ2xvYmFsVmFsdWVzLnB1c2goZ2xvYmFsT2JqZWN0c1trZXldKVxuICB9XG4gIGdsb2JhbEtleXMucHVzaChib2R5KVxuXG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBGdW5jdGlvbiguLi5nbG9iYWxLZXlzKVxuICByZXR1cm4gcmVzdWx0KC4uLmdsb2JhbFZhbHVlcylcbn1cblxuLyoqXG4gKiBDYWxsIGEgbmV3IGZ1bmN0aW9uIGdlbmVyYXRlZCBvbiB0aGUgVjggbmF0aXZlIHNpZGUuXG4gKiBAcGFyYW0gIHtvYmplY3R9IGdsb2JhbE9iamVjdHNcbiAqIEBwYXJhbSAge3N0cmluZ30gYm9keVxuICogQHJldHVybiB7Ym9vbGVhbn0gcmV0dXJuIHRydWUgaWYgbm8gZXJyb3Igb2NjdXJyZWQuXG4gKi9cbmZ1bmN0aW9uIGNhbGxGdW5jdGlvbk5hdGl2ZSAoZ2xvYmFsT2JqZWN0cywgYm9keSkge1xuICBpZiAodHlwZW9mIGNvbXBpbGVBbmRSdW5CdW5kbGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGxldCBmbiA9IHZvaWQgMFxuICBsZXQgaXNOYXRpdmVDb21waWxlT2sgPSBmYWxzZVxuICBsZXQgc2NyaXB0ID0gJyhmdW5jdGlvbiAoJ1xuICBjb25zdCBnbG9iYWxLZXlzID0gW11cbiAgY29uc3QgZ2xvYmFsVmFsdWVzID0gW11cbiAgZm9yIChjb25zdCBrZXkgaW4gZ2xvYmFsT2JqZWN0cykge1xuICAgIGdsb2JhbEtleXMucHVzaChrZXkpXG4gICAgZ2xvYmFsVmFsdWVzLnB1c2goZ2xvYmFsT2JqZWN0c1trZXldKVxuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZ2xvYmFsS2V5cy5sZW5ndGggLSAxOyArK2kpIHtcbiAgICBzY3JpcHQgKz0gZ2xvYmFsS2V5c1tpXVxuICAgIHNjcmlwdCArPSAnLCdcbiAgfVxuICBzY3JpcHQgKz0gZ2xvYmFsS2V5c1tnbG9iYWxLZXlzLmxlbmd0aCAtIDFdXG4gIHNjcmlwdCArPSAnKSB7J1xuICBzY3JpcHQgKz0gYm9keVxuICBzY3JpcHQgKz0gJ30gKSdcblxuICB0cnkge1xuICAgIGNvbnN0IHdlZXggPSBnbG9iYWxPYmplY3RzLndlZXggfHwge31cbiAgICBjb25zdCBjb25maWcgPSB3ZWV4LmNvbmZpZyB8fCB7fVxuICAgIGZuID0gY29tcGlsZUFuZFJ1bkJ1bmRsZShzY3JpcHQsIGNvbmZpZy5idW5kbGVVcmwsIGNvbmZpZy5idW5kbGVEaWdlc3QsIGNvbmZpZy5jb2RlQ2FjaGVQYXRoKVxuICAgIGlmIChmbiAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGZuKC4uLmdsb2JhbFZhbHVlcylcbiAgICAgIGlzTmF0aXZlQ29tcGlsZU9rID0gdHJ1ZVxuICAgIH1cbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgfVxuXG4gIHJldHVybiBpc05hdGl2ZUNvbXBpbGVPa1xufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIGluc3RhbmNlIGNvbnRyb2xzIGZyb20gbmF0aXZlXG4gKlxuICogLSBpbml0IGJ1bmRsZVxuICogLSBmaXJlIGV2ZW50XG4gKiAtIGNhbGxiYWNrXG4gKiAtIGRlc3Ryb3lcbiAqXG4gKiBjb3JyZXNwb25kZWQgd2l0aCB0aGUgQVBJIG9mIGluc3RhbmNlIG1hbmFnZXIgKGZyYW1ld29yay5qcylcbiAqL1xuZXhwb3J0IHsgaW5pdCB9IGZyb20gJy4vaW5pdCdcblxuZXhwb3J0IHtcbiAgcmVmcmVzaCxcbiAgZGVzdHJveSxcbiAgZ2V0Um9vdEVsZW1lbnQsXG4gIGZpcmVFdmVudCxcbiAgY2FsbGJhY2ssXG4gIHVwZGF0ZUFjdGlvbnMsXG4gIGNhbGxUYXNrc1xufSBmcm9tICcuL21pc2MnXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpZmZlciB7XG4gIGNvbnN0cnVjdG9yIChpZCkge1xuICAgIHRoaXMuaWQgPSBpZFxuICAgIHRoaXMubWFwID0gW11cbiAgICB0aGlzLmhvb2tzID0gW11cbiAgfVxuICBpc0VtcHR5ICgpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAubGVuZ3RoID09PSAwXG4gIH1cbiAgYXBwZW5kICh0eXBlLCBkZXB0aCA9IDAsIHJlZiwgaGFuZGxlcikge1xuICAgIGlmICghdGhpcy5oYXNUaW1lcikge1xuICAgICAgdGhpcy5oYXNUaW1lciA9IHRydWVcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmhhc1RpbWVyID0gZmFsc2VcbiAgICAgICAgdGhpcy5mbHVzaCh0cnVlKVxuICAgICAgfSwgMClcbiAgICB9XG4gICAgY29uc3QgbWFwID0gdGhpcy5tYXBcbiAgICBpZiAoIW1hcFtkZXB0aF0pIHtcbiAgICAgIG1hcFtkZXB0aF0gPSB7fVxuICAgIH1cbiAgICBjb25zdCBncm91cCA9IG1hcFtkZXB0aF1cbiAgICBpZiAoIWdyb3VwW3R5cGVdKSB7XG4gICAgICBncm91cFt0eXBlXSA9IHt9XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnZWxlbWVudCcpIHtcbiAgICAgIGlmICghZ3JvdXBbdHlwZV1bcmVmXSkge1xuICAgICAgICBncm91cFt0eXBlXVtyZWZdID0gW11cbiAgICAgIH1cbiAgICAgIGdyb3VwW3R5cGVdW3JlZl0ucHVzaChoYW5kbGVyKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGdyb3VwW3R5cGVdW3JlZl0gPSBoYW5kbGVyXG4gICAgfVxuICB9XG4gIGZsdXNoIChpc1RpbWVvdXQpIHtcbiAgICBjb25zdCBtYXAgPSB0aGlzLm1hcC5zbGljZSgpXG4gICAgdGhpcy5tYXAubGVuZ3RoID0gMFxuICAgIG1hcC5mb3JFYWNoKChncm91cCkgPT4ge1xuICAgICAgY2FsbFR5cGVNYXAoZ3JvdXAsICdyZXBlYXQnKVxuICAgICAgY2FsbFR5cGVNYXAoZ3JvdXAsICdzaG93bicpXG4gICAgICBjYWxsVHlwZUxpc3QoZ3JvdXAsICdlbGVtZW50JylcbiAgICB9KVxuXG4gICAgY29uc3QgaG9va3MgPSB0aGlzLmhvb2tzLnNsaWNlKClcbiAgICB0aGlzLmhvb2tzLmxlbmd0aCA9IDBcbiAgICBob29rcy5mb3JFYWNoKChmbikgPT4ge1xuICAgICAgZm4oKVxuICAgIH0pXG5cbiAgICBpZiAoIXRoaXMuaXNFbXB0eSgpKSB7XG4gICAgICB0aGlzLmZsdXNoKClcbiAgICB9XG4gIH1cbiAgdGhlbiAoZm4pIHtcbiAgICB0aGlzLmhvb2tzLnB1c2goZm4pXG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbFR5cGVNYXAgKGdyb3VwLCB0eXBlKSB7XG4gIGNvbnN0IG1hcCA9IGdyb3VwW3R5cGVdXG4gIGZvciAoY29uc3QgcmVmIGluIG1hcCkge1xuICAgIG1hcFtyZWZdKClcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsVHlwZUxpc3QgKGdyb3VwLCB0eXBlKSB7XG4gIGNvbnN0IG1hcCA9IGdyb3VwW3R5cGVdXG4gIGZvciAoY29uc3QgcmVmIGluIG1hcCkge1xuICAgIGNvbnN0IGxpc3QgPSBtYXBbcmVmXVxuICAgIGxpc3QuZm9yRWFjaCgoaGFuZGxlcikgPT4geyBoYW5kbGVyKCkgfSlcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIFdlZXggQXBwIGNvbnN0cnVjdG9yICYgZGVmaW5pdGlvblxuICovXG5cbmltcG9ydCBEaWZmZXIgZnJvbSAnLi9kaWZmZXInXG5pbXBvcnQgcmVuZGVyZXIgZnJvbSAnLi4vY29uZmlnJ1xuXG4vKipcbiAqIEFwcCBjb25zdHJ1Y3RvciBmb3IgV2VleCBmcmFtZXdvcmsuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCAoaWQsIG9wdGlvbnMpIHtcbiAgdGhpcy5pZCA9IGlkXG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgdGhpcy52bSA9IG51bGxcbiAgdGhpcy5jdXN0b21Db21wb25lbnRNYXAgPSB7fVxuICB0aGlzLmNvbW1vbk1vZHVsZXMgPSB7fVxuXG4gIC8vIGRvY3VtZW50XG4gIHRoaXMuZG9jID0gbmV3IHJlbmRlcmVyLkRvY3VtZW50KFxuICAgIGlkLFxuICAgIHRoaXMub3B0aW9ucy5idW5kbGVVcmwsXG4gICAgbnVsbCxcbiAgICByZW5kZXJlci5MaXN0ZW5lclxuICApXG4gIHRoaXMuZGlmZmVyID0gbmV3IERpZmZlcihpZClcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBXZWV4IGluc3RhbmNlIGNvbnN0cnVjdG9yICYgZGVmaW5pdGlvblxuICovXG5cbmltcG9ydCB7IHJlcXVpcmVNb2R1bGUgfSBmcm9tICcuL3JlZ2lzdGVyJ1xuaW1wb3J0IHsgdXBkYXRlQWN0aW9ucywgY2FsbFRhc2tzIH0gZnJvbSAnLi9jdHJsL2luZGV4J1xuaW1wb3J0IEFwcCBmcm9tICcuL2luc3RhbmNlJ1xuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKi9cbkFwcC5wcm90b3R5cGUucmVxdWlyZU1vZHVsZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHJldHVybiByZXF1aXJlTW9kdWxlKHRoaXMsIG5hbWUpXG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWRcbiAqL1xuQXBwLnByb3RvdHlwZS51cGRhdGVBY3Rpb25zID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdXBkYXRlQWN0aW9ucyh0aGlzKVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKi9cbkFwcC5wcm90b3R5cGUuY2FsbFRhc2tzID0gZnVuY3Rpb24gKHRhc2tzKSB7XG4gIHJldHVybiBjYWxsVGFza3ModGhpcywgdGFza3MpXG59XG5cbi8qKlxuICogUHJldmVudCBtb2RpZmljYXRpb24gb2YgQXBwIGFuZCBBcHAucHJvdG90eXBlXG4gKi9cbk9iamVjdC5mcmVlemUoQXBwKVxuT2JqZWN0LmZyZWV6ZShBcHAucHJvdG90eXBlKVxuXG5leHBvcnQgZGVmYXVsdCBBcHBcbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGluc3RhbmNlTWFwID0ge31cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IEFwcCBmcm9tICcuLi9hcHAvaW5kZXgnXG5pbXBvcnQgeyBpbnN0YW5jZU1hcCB9IGZyb20gJy4vbWFwJ1xuaW1wb3J0IHsgaW5pdCBhcyBpbml0QXBwIH0gZnJvbSAnLi4vYXBwL2N0cmwvaW5kZXgnXG5pbXBvcnQgeyByZXNldFRhcmdldCB9IGZyb20gJy4uL2NvcmUvZGVwJ1xuXG4vKipcbiAqIENyZWF0ZSBhIFdlZXggaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHBhcmFtICB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0gIHtvYmplY3R9IG9wdGlvbnNcbiAqICAgICAgICAgb3B0aW9uIGBIQVNfTE9HYCBlbmFibGUgcHJpbnQgbG9nXG4gKiBAcGFyYW0gIHtvYmplY3R9IGRhdGFcbiAqIEBwYXJhbSAge29iamVjdH0gaW5mbyB7IGNyZWF0ZWQsIC4uLiBzZXJ2aWNlcyB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbnN0YW5jZSAoaWQsIGNvZGUsIG9wdGlvbnMsIGRhdGEsIGluZm8pIHtcbiAgY29uc3QgeyBzZXJ2aWNlcyB9ID0gaW5mbyB8fCB7fVxuICByZXNldFRhcmdldCgpXG4gIGxldCBpbnN0YW5jZSA9IGluc3RhbmNlTWFwW2lkXVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICBsZXQgcmVzdWx0XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmICghaW5zdGFuY2UpIHtcbiAgICBpbnN0YW5jZSA9IG5ldyBBcHAoaWQsIG9wdGlvbnMpXG4gICAgaW5zdGFuY2VNYXBbaWRdID0gaW5zdGFuY2VcbiAgICByZXN1bHQgPSBpbml0QXBwKGluc3RhbmNlLCBjb2RlLCBkYXRhLCBzZXJ2aWNlcylcbiAgfVxuICBlbHNlIHtcbiAgICByZXN1bHQgPSBuZXcgRXJyb3IoYGludmFsaWQgaW5zdGFuY2UgaWQgXCIke2lkfVwiYClcbiAgfVxuICByZXR1cm4gKHJlc3VsdCBpbnN0YW5jZW9mIEVycm9yKSA/IHJlc3VsdCA6IGluc3RhbmNlXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHtcbiAgcmVmcmVzaCxcbiAgZGVzdHJveVxufSBmcm9tICcuLi9hcHAvY3RybC9pbmRleCdcbmltcG9ydCB7IGluc3RhbmNlTWFwIH0gZnJvbSAnLi9tYXAnXG5pbXBvcnQgeyByZXNldFRhcmdldCB9IGZyb20gJy4uL2NvcmUvZGVwJ1xuXG4vKipcbiAqIEluaXQgY29uZmlnIGluZm9ybWF0aW9ucyBmb3IgV2VleCBmcmFtZXdvcmtcbiAqIEBwYXJhbSAge29iamVjdH0gY2ZnXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0IChjZmcpIHtcbiAgY29uZmlnLkRvY3VtZW50ID0gY2ZnLkRvY3VtZW50XG4gIGNvbmZpZy5FbGVtZW50ID0gY2ZnLkVsZW1lbnRcbiAgY29uZmlnLkNvbW1lbnQgPSBjZmcuQ29tbWVudFxuICBjb25maWcuc2VuZFRhc2tzID0gY2ZnLnNlbmRUYXNrc1xuICBjb25maWcuTGlzdGVuZXIgPSBjZmcuTGlzdGVuZXJcbn1cblxuLyoqXG4gKiBSZWZyZXNoIGEgV2VleCBpbnN0YW5jZSB3aXRoIGRhdGEuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHBhcmFtICB7b2JqZWN0fSBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoSW5zdGFuY2UgKGlkLCBkYXRhKSB7XG4gIGNvbnN0IGluc3RhbmNlID0gaW5zdGFuY2VNYXBbaWRdXG4gIGxldCByZXN1bHRcbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKGluc3RhbmNlKSB7XG4gICAgcmVzdWx0ID0gcmVmcmVzaChpbnN0YW5jZSwgZGF0YSlcbiAgfVxuICBlbHNlIHtcbiAgICByZXN1bHQgPSBuZXcgRXJyb3IoYGludmFsaWQgaW5zdGFuY2UgaWQgXCIke2lkfVwiYClcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogRGVzdHJveSBhIFdlZXggaW5zdGFuY2UuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95SW5zdGFuY2UgKGlkKSB7XG4gIC8vIE1hcmt1cCBzb21lIGdsb2JhbCBzdGF0ZSBpbiBuYXRpdmUgc2lkZVxuICBpZiAodHlwZW9mIG1hcmt1cFN0YXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgbWFya3VwU3RhdGUoKVxuICB9XG5cbiAgcmVzZXRUYXJnZXQoKVxuICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlTWFwW2lkXVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAoIWluc3RhbmNlKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgaW52YWxpZCBpbnN0YW5jZSBpZCBcIiR7aWR9XCJgKVxuICB9XG4gIGRlc3Ryb3koaW5zdGFuY2UpXG4gIGRlbGV0ZSBpbnN0YW5jZU1hcFtpZF1cbiAgLy8gbm90aWZ5Q29udGV4dERpc3Bvc2VkIGlzIHVzZWQgdG8gdGVsbCB2OCB0byBkbyBhIGZ1bGwgR0MsXG4gIC8vIGJ1dCB0aGlzIHdvdWxkIGhhdmUgYSBuZWdhdGl2ZSBwZXJmb3JtYW5jZSBpbXBhY3Qgb24gd2VleCxcbiAgLy8gYmVjYXVzZSBhbGwgdGhlIGlubGluZSBjYWNoZSBpbiB2OCB3b3VsZCBnZXQgY2xlYXJlZFxuICAvLyBkdXJpbmcgYSBmdWxsIEdDLlxuICAvLyBUbyB0YWtlIGNhcmUgb2YgYm90aCBtZW1vcnkgYW5kIHBlcmZvcm1hbmNlLCBqdXN0IHRlbGwgdjhcbiAgLy8gdG8gZG8gYSBmdWxsIEdDIGV2ZXJ5IGVpZ2h0ZWVuIHRpbWVzLlxuICBjb25zdCBpZE51bSA9IE1hdGgucm91bmQoaWQpXG4gIGNvbnN0IHJvdW5kID0gMThcbiAgaWYgKGlkTnVtID4gMCkge1xuICAgIGNvbnN0IHJlbWFpbmRlciA9IGlkTnVtICUgcm91bmRcbiAgICBpZiAoIXJlbWFpbmRlciAmJiB0eXBlb2Ygbm90aWZ5VHJpbU1lbW9yeSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbm90aWZ5VHJpbU1lbW9yeSgpXG4gICAgfVxuICB9XG4gIHJldHVybiBpbnN0YW5jZU1hcFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgVm0gZnJvbSAnLi4vdm0vaW5kZXgnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7XG4gIGluaXRNb2R1bGVzLFxuICBpbml0TWV0aG9kc1xufSBmcm9tICcuLi9hcHAvcmVnaXN0ZXInXG5cbmNvbnN0IHtcbiAgbmF0aXZlQ29tcG9uZW50TWFwXG59ID0gY29uZmlnXG5cbi8qKlxuICogUmVnaXN0ZXIgdGhlIG5hbWUgb2YgZWFjaCBuYXRpdmUgY29tcG9uZW50LlxuICogQHBhcmFtICB7YXJyYXl9IGNvbXBvbmVudHMgYXJyYXkgb2YgbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnRzIChjb21wb25lbnRzKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudHMpKSB7XG4gICAgY29tcG9uZW50cy5mb3JFYWNoKGZ1bmN0aW9uIHJlZ2lzdGVyIChuYW1lKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmICghbmFtZSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgbmF0aXZlQ29tcG9uZW50TWFwW25hbWVdID0gdHJ1ZVxuICAgICAgfVxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGVsc2UgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbmFtZS50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICBuYXRpdmVDb21wb25lbnRNYXBbbmFtZS50eXBlXSA9IG5hbWVcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgdGhlIG5hbWUgYW5kIG1ldGhvZHMgb2YgZWFjaCBtb2R1bGUuXG4gKiBAcGFyYW0gIHtvYmplY3R9IG1vZHVsZXMgYSBvYmplY3Qgb2YgbW9kdWxlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJNb2R1bGVzIChtb2R1bGVzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmICh0eXBlb2YgbW9kdWxlcyA9PT0gJ29iamVjdCcpIHtcbiAgICBpbml0TW9kdWxlcyhtb2R1bGVzKVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgdGhlIG5hbWUgYW5kIG1ldGhvZHMgb2YgZWFjaCBhcGkuXG4gKiBAcGFyYW0gIHtvYmplY3R9IGFwaXMgYSBvYmplY3Qgb2YgYXBpc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJNZXRob2RzIChtZXRob2RzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmICh0eXBlb2YgbWV0aG9kcyA9PT0gJ29iamVjdCcpIHtcbiAgICBpbml0TWV0aG9kcyhWbSwgbWV0aG9kcylcbiAgfVxufVxuXG4vLyBAdG9kbzogSGFjayBmb3IgdGhpcyBmcmFtZXdvcmsgb25seS4gV2lsbCBiZSByZS1kZXNpZ25lZCBvciByZW1vdmVkIGxhdGVyLlxuZ2xvYmFsLnJlZ2lzdGVyTWV0aG9kcyA9IHJlZ2lzdGVyTWV0aG9kc1xuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgeyBpbnN0YW5jZU1hcCB9IGZyb20gJy4vbWFwJ1xuaW1wb3J0IHtcbiAgZmlyZUV2ZW50LFxuICBjYWxsYmFja1xufSBmcm9tICcuLi9hcHAvY3RybC9pbmRleCdcblxuY29uc3QganNIYW5kbGVycyA9IHtcbiAgZmlyZUV2ZW50OiAoaWQsIC4uLmFyZ3MpID0+IHtcbiAgICByZXR1cm4gZmlyZUV2ZW50KGluc3RhbmNlTWFwW2lkXSwgLi4uYXJncylcbiAgfSxcbiAgY2FsbGJhY2s6IChpZCwgLi4uYXJncykgPT4ge1xuICAgIHJldHVybiBjYWxsYmFjayhpbnN0YW5jZU1hcFtpZF0sIC4uLmFyZ3MpXG4gIH1cbn1cblxuLyoqXG4gKiBBY2NlcHQgY2FsbHMgZnJvbSBuYXRpdmUgKGV2ZW50IG9yIGNhbGxiYWNrKS5cbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGlkXG4gKiBAcGFyYW0gIHthcnJheX0gdGFza3MgbGlzdCB3aXRoIGBtZXRob2RgIGFuZCBgYXJnc2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY2VpdmVUYXNrcyAoaWQsIHRhc2tzKSB7XG4gIGNvbnN0IGluc3RhbmNlID0gaW5zdGFuY2VNYXBbaWRdXG4gIGlmIChpbnN0YW5jZSAmJiBBcnJheS5pc0FycmF5KHRhc2tzKSkge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXVxuICAgIHRhc2tzLmZvckVhY2goKHRhc2spID0+IHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSBqc0hhbmRsZXJzW3Rhc2subWV0aG9kXVxuICAgICAgY29uc3QgYXJncyA9IFsuLi50YXNrLmFyZ3NdXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGFyZ3MudW5zaGlmdChpZClcbiAgICAgICAgcmVzdWx0cy5wdXNoKGhhbmRsZXIoLi4uYXJncykpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gcmVzdWx0c1xuICB9XG4gIHJldHVybiBuZXcgRXJyb3IoYGludmFsaWQgaW5zdGFuY2UgaWQgXCIke2lkfVwiIG9yIHRhc2tzYClcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgaW5zdGFuY2VNYXAgfSBmcm9tICcuL21hcCdcbmltcG9ydCB7XG4gIGdldFJvb3RFbGVtZW50XG59IGZyb20gJy4uL2FwcC9jdHJsL2luZGV4J1xuXG4vKipcbiAqIEdldCBhIHdob2xlIGVsZW1lbnQgdHJlZSBvZiBhbiBpbnN0YW5jZSBmb3IgZGVidWdnaW5nLlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7b2JqZWN0fSBhIHZpcnR1YWwgZG9tIHRyZWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3QgKGlkKSB7XG4gIGNvbnN0IGluc3RhbmNlID0gaW5zdGFuY2VNYXBbaWRdXG4gIGxldCByZXN1bHRcbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKGluc3RhbmNlKSB7XG4gICAgcmVzdWx0ID0gZ2V0Um9vdEVsZW1lbnQoaW5zdGFuY2UpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmVzdWx0ID0gbmV3IEVycm9yKGBpbnZhbGlkIGluc3RhbmNlIGlkIFwiJHtpZH1cImApXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vKipcbiAqIEBmaWxlT3ZlcnZpZXcgV2VleCBmcmFtZXdvcmsgZW50cnkuXG4gKi9cblxuaW1wb3J0ICogYXMgbWV0aG9kcyBmcm9tICcuL2FwaS9tZXRob2RzJ1xuXG5pbXBvcnQgVm0gZnJvbSAnLi92bSdcbmV4cG9ydCB7IGNyZWF0ZUluc3RhbmNlIH0gZnJvbSAnLi9zdGF0aWMvY3JlYXRlJ1xuZXhwb3J0IHsgaW5pdCwgcmVmcmVzaEluc3RhbmNlLCBkZXN0cm95SW5zdGFuY2UgfSBmcm9tICcuL3N0YXRpYy9saWZlJ1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21wb25lbnRzLCByZWdpc3Rlck1vZHVsZXMsIHJlZ2lzdGVyTWV0aG9kcyB9IGZyb20gJy4vc3RhdGljL3JlZ2lzdGVyJ1xuZXhwb3J0IHsgcmVjZWl2ZVRhc2tzIH0gZnJvbSAnLi9zdGF0aWMvYnJpZGdlJ1xuZXhwb3J0IHsgZ2V0Um9vdCB9IGZyb20gJy4vc3RhdGljL21pc2MnXG5cbi8vIHJlZ2lzdGVyIHNwZWNpYWwgbWV0aG9kcyBmb3IgV2VleCBmcmFtZXdvcmtcbnJlZ2lzdGVyTWV0aG9kcyhtZXRob2RzKVxuXG4vKipcbiAqIFByZXZlbnQgbW9kaWZpY2F0aW9uIG9mIFZtIGFuZCBWbS5wcm90b3R5cGVcbiAqL1xuT2JqZWN0LmZyZWV6ZShWbSlcblxuZXhwb3J0IHsgcmVnaXN0ZXJDb21wb25lbnRzLCByZWdpc3Rlck1vZHVsZXMsIHJlZ2lzdGVyTWV0aG9kcyB9XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHNldHVwIGZyb20gJy4vc2V0dXAnXG5pbXBvcnQgKiBhcyBXZWV4IGZyb20gJy4uL2ZyYW1ld29ya3MvbGVnYWN5L2luZGV4J1xuXG5zZXR1cCh7IFdlZXggfSlcbiJdLCJuYW1lcyI6WyJsZXQiLCJjb25zdCIsIkVsZW1lbnQiLCJzdXBlciIsInRhc2tDZW50ZXIiLCJwdXJlQmVmb3JlIiwiaW5kZXgiLCJ0aGlzIiwiaW5pdCIsIm5hbWUiLCJzZXJ2aWNlcyIsImluaXRUYXNrSGFuZGxlciIsIkJyb2FkY2FzdENoYW5uZWwiLCJ0eXBvZiIsInVpZCIsImFyZ3VtZW50cyIsInNldElkIiwiaSIsInR5cGUiLCJpbml0TWV0aG9kcyIsImRvd25ncmFkZS5jaGVjayIsImNsZWFuTmFtZSIsInJlZ2lzdGVyIiwiZmlyZUV2ZW50IiwiY2FsbGJhY2siLCJBcHAiLCJyZW5kZXJlciIsImNyZWF0ZUluc3RhbmNlIiwiaW5pdEFwcCIsImNvbmZpZyIsIm5hdGl2ZUNvbXBvbmVudE1hcCIsInJlZ2lzdGVyQ29tcG9uZW50cyIsInJlZ2lzdGVyTW9kdWxlcyIsInJlY2VpdmVUYXNrcyIsImdldFJvb3QiLCJtZXRob2RzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCQUEsSUFBSSxXQUFXLEdBQUcsRUFBQztBQUNuQixBQUFPLFNBQVMsUUFBUSxJQUFJO0VBQzFCLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUU7Q0FDbEM7O0FBRUQsQUFBTyxTQUFTLEtBQUssRUFBRSxDQUFDLEVBQUU7RUFDeEJDLElBQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7RUFDM0MsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztDQUNwQzs7QUFFRCxBQUFPLFNBQVMsY0FBYyxFQUFFLE1BQU0sRUFBRTtFQUN0QyxJQUFJLE9BQU8sSUFBSSxLQUFLLFVBQVUsRUFBRTtJQUM5QixPQUFPLEVBQUU7R0FDVjtFQUNEQSxJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJO0lBQ3JDLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztjQUN0QixNQUFLLFNBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUM7R0FDbEMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDO0VBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0NBQ3BCOztBQUVELEFBQU8sU0FBUyxjQUFjLEVBQUUsTUFBTSxFQUFFO0VBQ3RDLElBQUksT0FBTyxJQUFJLEtBQUssVUFBVSxFQUFFO0lBQzlCLE9BQU8sSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDO0dBQzFCO0VBQ0RBLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUM7RUFDM0JBLElBQU0sS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUM7RUFDM0MsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sWUFBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQzNDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBQztHQUM1QixFQUFDO0VBQ0YsT0FBTyxLQUFLLENBQUMsTUFBTTtDQUNwQjs7Ozs7O0FBTUQsQUFBTyxTQUFTLE9BQU8sRUFBRSxHQUFHLEVBQUU7RUFDNUIsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7SUFDbkMsT0FBTyxJQUFJO0dBQ1o7O0VBRUQsS0FBS0EsSUFBTSxHQUFHLElBQUksR0FBRyxFQUFFO0lBQ3JCLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtNQUNsRCxPQUFPLEtBQUs7S0FDYjtHQUNGO0VBQ0QsT0FBTyxJQUFJO0NBQ1o7O0FDdEVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBOzs7OztBQU9BLEFBQU8sU0FBUyxrQkFBa0IsRUFBRSxDQUFDLEVBQUU7RUFDckNBLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUM7O0VBRXJCLFFBQVEsSUFBSTtJQUNWLEtBQUssV0FBVyxDQUFDO0lBQ2pCLEtBQUssTUFBTTtNQUNULE9BQU8sRUFBRTs7SUFFWCxLQUFLLFFBQVE7TUFDWCxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUU7SUFDckIsS0FBSyxNQUFNO01BQ1QsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFOztJQUV4QixLQUFLLFFBQVEsQ0FBQztJQUNkLEtBQUssUUFBUSxDQUFDO0lBQ2QsS0FBSyxTQUFTLENBQUM7SUFDZixLQUFLLE9BQU8sQ0FBQztJQUNiLEtBQUssUUFBUTtNQUNYLE9BQU8sQ0FBQzs7SUFFVixLQUFLLGFBQWE7TUFDaEIsT0FBTztRQUNMLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7T0FDMUI7O0lBRUgsS0FBSyxXQUFXLENBQUM7SUFDakIsS0FBSyxZQUFZLENBQUM7SUFDbEIsS0FBSyxtQkFBbUIsQ0FBQztJQUN6QixLQUFLLFlBQVksQ0FBQztJQUNsQixLQUFLLGFBQWEsQ0FBQztJQUNuQixLQUFLLFlBQVksQ0FBQztJQUNsQixLQUFLLGFBQWEsQ0FBQztJQUNuQixLQUFLLGNBQWMsQ0FBQztJQUNwQixLQUFLLGNBQWM7TUFDakIsT0FBTztRQUNMLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO09BQ2pDOztJQUVIO01BQ0UsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztHQUMzQjtDQUNGOztBQUVELEFBQU8sU0FBUyxlQUFlLEVBQUUsSUFBSSxFQUFFO0VBQ3JDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTs7SUFFNUIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRTtNQUMvQyxPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztLQUN6Qzs7SUFFREEsSUFBTSxRQUFRLEdBQUcsR0FBRTtJQUNuQixLQUFLQSxJQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7TUFDdEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUM7S0FDM0M7SUFDRCxPQUFPLFFBQVE7R0FDaEI7RUFDRCxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxPQUFPLEVBQUU7SUFDM0IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQztHQUNqQztFQUNELE9BQU8sSUFBSTtDQUNaOztBQzFGRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSxBQUVBLFNBQVMsVUFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0VBQ2hELFFBQVUsSUFBSSxTQUFJLFFBQVEsU0FBSSxXQUFXLENBQUU7Q0FDNUM7Ozs7Ozs7OztBQVNELElBQXFCLGVBQWUsR0FDbEMsd0JBQVcsRUFBRSxVQUFVLEVBQUU7RUFDekIsSUFBTSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFDO0VBQ3RDLElBQU0sQ0FBQyxjQUFjLEdBQUcsRUFBQztFQUN6QixJQUFNLENBQUMsU0FBUyxHQUFHLEdBQUU7RUFDckIsSUFBTSxDQUFDLEtBQUssR0FBRyxHQUFFO0VBQ2hCO0FBQ0gsMEJBQUUsR0FBRyxpQkFBRSxRQUFRLEVBQUU7RUFDZixJQUFNLENBQUMsY0FBYyxHQUFFO0VBQ3ZCLElBQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLFNBQVE7RUFDaEQsT0FBUyxJQUFJLENBQUMsY0FBYztFQUMzQjtBQUNILDBCQUFFLE1BQU0sb0JBQUUsVUFBVSxFQUFFO0VBQ3BCLElBQVEsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFDO0VBQzdDLE9BQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUM7RUFDbkMsT0FBUyxRQUFRO0VBQ2hCO0FBQ0gsMEJBQUUsWUFBWSwwQkFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUU7O0VBRXpELElBQVEsR0FBRyxHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztFQUNyRCxJQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDckIsT0FBUyxDQUFDLElBQUksNERBQXdELEdBQUcsV0FBSztHQUM3RTtFQUNILElBQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsYUFBWTtFQUMvQjtBQUNILDBCQUFFLFdBQVcseUJBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBWSxFQUFFO3FDQUFQLEdBQUc7OztFQUVwRCxJQUFRLEdBQUcsR0FBRyxVQUFVLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7RUFDckQsSUFBUSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUM7RUFDdEMsSUFBTSxPQUFPLFlBQVksS0FBSyxVQUFVLEVBQUU7SUFDeEMsT0FBUyxDQUFDLEtBQUssbURBQStDLE9BQU8sYUFBWSxlQUFTLEdBQUcsV0FBSztJQUNsRyxPQUFTLElBQUk7R0FDWjtFQUNILElBQU0sTUFBTSxHQUFHLEtBQUk7RUFDbkIsSUFBTTtJQUNKLE1BQVEsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBQztHQUN0RDtFQUNILE9BQVMsQ0FBQyxFQUFFO0lBQ1YsT0FBUyxDQUFDLEtBQUssK0RBQTJELEdBQUcsV0FBSztHQUNqRjtFQUNILE9BQVMsTUFBTTtFQUNkO0FBQ0gsMEJBQUUsT0FBTyxxQkFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtFQUN4QyxJQUFRLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBQztFQUM3QyxJQUFNLE9BQU8sV0FBVyxLQUFLLFdBQVcsSUFBSSxXQUFXLEtBQUssS0FBSyxFQUFFO0lBQ2pFLE9BQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUM7R0FDbEM7RUFDSCxJQUFNLE9BQU8sUUFBUSxLQUFLLFVBQVUsRUFBRTtJQUNwQyxPQUFTLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDdkM7RUFDSCxPQUFTLElBQUksS0FBSyw2QkFBeUIsVUFBVSxTQUFJO0VBQ3hEO0FBQ0gsMEJBQUUsS0FBSyxxQkFBSTtFQUNULElBQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRTtFQUNyQixJQUFNLENBQUMsS0FBSyxHQUFHLEdBQUU7Q0FDaEI7O0FDdkZIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBQSxJQUFNLE1BQU0sR0FBRyxHQUFFOzs7Ozs7O0FBT2pCLEFBQU8sU0FBUyxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRTtFQUMvQixJQUFJLEVBQUUsRUFBRTtJQUNOLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFHO0dBQ2pCO0NBQ0Y7Ozs7OztBQU1ELEFBQU8sU0FBUyxNQUFNLEVBQUUsRUFBRSxFQUFFO0VBQzFCLE9BQU8sTUFBTSxDQUFDLEVBQUUsQ0FBQztDQUNsQjs7Ozs7O0FBTUQsQUFBTyxTQUFTLFNBQVMsRUFBRSxFQUFFLEVBQUU7RUFDN0IsT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFDO0NBQ2xCOzs7Ozs7OztBQVFELEFBTUM7Ozs7Ozs7QUFPRCxBQUFPLFNBQVMsYUFBYSxFQUFFLEVBQUUsRUFBRTtFQUNqQ0EsSUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEVBQUUsRUFBQztFQUN0QixJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxFQUFFO0lBQ3pCLE9BQU8sR0FBRyxDQUFDLFVBQVU7R0FDdEI7RUFDRCxPQUFPLElBQUk7Q0FDWjs7Ozs7Ozs7QUFRRCxBQUFPLFNBQVMsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO0VBQzdDLElBQVEsZUFBZSx1QkFBUTs7RUFFL0IsSUFBSSxlQUFlLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtJQUM5RCxNQUFNO0dBQ1A7RUFDREEsSUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLFNBQVE7RUFDekNBLElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFDO0VBQzVDLElBQUksV0FBVyxHQUFHLENBQUMsRUFBRTtJQUNuQixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztHQUNwQjtPQUNJO0lBQ0gsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBQztHQUN0Qzs7RUFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO0lBQ3ZCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7TUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRTtNQUNuQixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUc7TUFDeEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxnQkFBZTtNQUNqQyxVQUFVLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBQztLQUNsQztTQUNJO01BQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLFdBQUMsT0FBTTtRQUMxQixLQUFLLENBQUMsVUFBVSxHQUFHLEtBQUk7T0FDeEIsRUFBQztNQUNGLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFDO01BQ2xCLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUU7TUFDbkIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFHO01BQ3hCLFVBQVUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFDO01BQ2pDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFDO0tBQ2hDO0lBQ0QsZUFBZSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0lBQ3ZDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFDO0dBQ3BCO09BQ0k7SUFDSCxJQUFJLENBQUMsVUFBVSxHQUFHLGdCQUFlO0lBQ2pDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUk7R0FDN0I7Q0FDRjs7QUFFRCxTQUFTLFFBQVEsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFO0VBQzVCQSxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFFO0VBQzFCLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLElBQUksT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7SUFDdEUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUM7R0FDN0Q7Q0FDRjs7Ozs7OztBQU9ELEFBQU8sU0FBUyxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRTtFQUNoQyxFQUFFLENBQUMsSUFBSSxHQUFHLE9BQU07RUFDaEIsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFDO0VBQ1osT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUM7RUFDN0IsRUFBRSxDQUFDLEdBQUcsR0FBRyxRQUFPO0VBQ2hCLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUU7RUFDdEIsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFFO0NBQ2Q7Ozs7Ozs7QUFPRCxBQUFPLFNBQVMsVUFBVSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7RUFDeEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFNO0VBQ3hCLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRTtJQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFLO0lBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLGNBQWE7SUFDekMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUk7SUFDOUMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLEVBQUM7R0FDOUI7RUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sV0FBQyxPQUFNO0lBQzFCLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFDO0dBQ3hCLEVBQUM7Q0FDSDs7Ozs7O0FBTUQsQUFBTyxTQUFTLFdBQVcsRUFBRSxJQUFJLEVBQUU7RUFDakMsT0FBTyxJQUFJLEVBQUU7SUFDWCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO01BQ3ZCLE9BQU8sSUFBSTtLQUNaO0lBQ0QsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFXO0dBQ3hCO0NBQ0Y7Ozs7OztBQU1ELEFBQU8sU0FBUyxlQUFlLEVBQUUsSUFBSSxFQUFFO0VBQ3JDLE9BQU8sSUFBSSxFQUFFO0lBQ1gsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsRUFBRTtNQUN2QixPQUFPLElBQUk7S0FDWjtJQUNELElBQUksR0FBRyxJQUFJLENBQUMsZ0JBQWU7R0FDNUI7Q0FDRjs7Ozs7Ozs7OztBQVVELEFBQU8sU0FBUyxXQUFXLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFOztFQUVsRSxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUU7SUFDaEIsUUFBUSxHQUFHLEVBQUM7R0FDYjtFQUNEQSxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBQztFQUNqQ0EsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBQztFQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFDO0VBQ2hDLElBQUksYUFBYSxFQUFFO0lBQ2pCLE1BQU0sS0FBSyxNQUFNLENBQUMsV0FBVyxHQUFHLE1BQU0sRUFBQztJQUN2QyxNQUFNLENBQUMsZUFBZSxHQUFHLE9BQU07SUFDL0IsTUFBTSxDQUFDLFdBQVcsR0FBRyxNQUFLO0lBQzFCLEtBQUssS0FBSyxLQUFLLENBQUMsZUFBZSxHQUFHLE1BQU0sRUFBQztHQUMxQztFQUNELE9BQU8sUUFBUTtDQUNoQjs7Ozs7Ozs7OztBQVVELEFBQU8sU0FBUyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFO0VBQ2hFQSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBQzs7RUFFbEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO0lBQ2IsT0FBTyxDQUFDLENBQUM7R0FDVjtFQUNELElBQUksYUFBYSxFQUFFO0lBQ2pCQSxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBQztJQUM5QkEsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUM7SUFDN0IsTUFBTSxLQUFLLE1BQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSyxFQUFDO0lBQ3RDLEtBQUssS0FBSyxLQUFLLENBQUMsZUFBZSxHQUFHLE1BQU0sRUFBQztHQUMxQztFQUNELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBQztFQUNyQkQsSUFBSSxhQUFhLEdBQUcsU0FBUTtFQUM1QixJQUFJLEtBQUssSUFBSSxRQUFRLEVBQUU7SUFDckIsYUFBYSxHQUFHLFFBQVEsR0FBRyxFQUFDO0dBQzdCO0VBQ0RDLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFDO0VBQ3pDQSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFDO0VBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUM7RUFDckMsSUFBSSxhQUFhLEVBQUU7SUFDakIsU0FBUyxLQUFLLFNBQVMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxFQUFDO0lBQzdDLE1BQU0sQ0FBQyxlQUFlLEdBQUcsVUFBUztJQUNsQyxNQUFNLENBQUMsV0FBVyxHQUFHLFNBQVE7SUFDN0IsUUFBUSxLQUFLLFFBQVEsQ0FBQyxlQUFlLEdBQUcsTUFBTSxFQUFDO0dBQ2hEO0VBQ0QsSUFBSSxLQUFLLEtBQUssYUFBYSxFQUFFO0lBQzNCLE9BQU8sQ0FBQyxDQUFDO0dBQ1Y7RUFDRCxPQUFPLFFBQVE7Q0FDaEI7Ozs7Ozs7O0FBUUQsQUFBTyxTQUFTLFdBQVcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRTtFQUN4REEsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUM7O0VBRWxDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtJQUNiLE1BQU07R0FDUDtFQUNELElBQUksYUFBYSxFQUFFO0lBQ2pCQSxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBQztJQUM5QkEsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUM7SUFDN0IsTUFBTSxLQUFLLE1BQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSyxFQUFDO0lBQ3RDLEtBQUssS0FBSyxLQUFLLENBQUMsZUFBZSxHQUFHLE1BQU0sRUFBQztHQUMxQztFQUNELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBQztDQUN0Qjs7QUMvUUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFHQSxJQUFxQixJQUFJLEdBQ3ZCLGFBQVcsSUFBSTtFQUNmLElBQU0sQ0FBQyxNQUFNLEdBQUcsUUFBUSxHQUFFO0VBQzFCLElBQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU07RUFDeEIsSUFBTSxDQUFDLFFBQVEsR0FBRyxHQUFFO0VBQ3BCLElBQU0sQ0FBQyxZQUFZLEdBQUcsR0FBRTtFQUN4QixJQUFNLENBQUMsVUFBVSxHQUFHLEtBQUk7RUFDeEIsSUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFJO0VBQ3pCLElBQU0sQ0FBQyxlQUFlLEdBQUcsS0FBSTtFQUM1Qjs7Ozs7QUFLSCxlQUFFLE9BQU8sdUJBQUk7RUFDWCxJQUFRLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQztFQUNoQyxJQUFNLEdBQUcsRUFBRTtJQUNULE9BQVMsSUFBSSxDQUFDLE1BQUs7SUFDbkIsT0FBUyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUM7R0FDaEM7RUFDSCxJQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sV0FBQyxPQUFNO0lBQzVCLEtBQU8sQ0FBQyxPQUFPLEdBQUU7R0FDaEIsRUFBQztDQUNIOztBQzdDSDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLEFBRUFELElBQUlFLFVBQU87O0FBRVgsQUFBTyxTQUFTLFVBQVUsRUFBRSxFQUFFLEVBQUU7RUFDOUJBLFNBQU8sR0FBRyxHQUFFO0NBQ2I7Ozs7OztBQU1ERCxJQUFNLGtCQUFrQixHQUFHLEdBQUU7Ozs7Ozs7QUFPN0IsQUFBTyxTQUFTLGVBQWUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFOztFQUU5QyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtJQUMvQixNQUFNO0dBQ1A7OztFQUdELElBQU0sV0FBVzs7Ozs7Ozs7OztJQUFTQyxZQUFVOzs7RUFHcEMsT0FBTyxDQUFDLE9BQU8sV0FBQyxZQUFXO0lBQ3pCLFdBQVcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsWUFBbUI7Ozs7TUFDckRELElBQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDO01BQzVDLElBQUksVUFBVSxFQUFFO1FBQ2QsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtVQUNsQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7VUFDYixTQUFTLEVBQUUsSUFBSTtVQUNmLE1BQU0sRUFBRSxVQUFVO1NBQ25CLEVBQUUsSUFBSSxDQUFDO09BQ1Q7TUFDRjtHQUNGLEVBQUM7OztFQUdGLGtCQUFrQixDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVc7Q0FDdkM7O0FBRUQsQUFFQzs7QUFFRCxBQUFPLFNBQVMsY0FBYyxFQUFFLElBQUksRUFBRTtFQUNwQyxPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQztDQUNoQzs7QUFFRCxBQUVDOzs7Ozs7QUMxRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFjQUEsSUFBTSxnQkFBZ0IsR0FBRyxNQUFLO0FBQzlCQSxJQUFNLGFBQWEsR0FBRztFQUNwQixPQUFPLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsVUFBVTtFQUMzRCxVQUFVLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLE9BQU87RUFDekU7O0FBRUQsU0FBUyxZQUFZLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtFQUNsQ0EsSUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBQztFQUN6QixHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxLQUFJO0NBQ2hDOztBQUVELElBQXFCLE9BQU87RUFDMUIsZ0JBQVcsRUFBRSxJQUF1QixFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7K0JBQXhDLEdBQUc7O0lBQ2xCRSxZQUFLLEtBQUMsRUFBQzs7SUFFUEYsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBQztJQUN4QyxJQUFJLFdBQVcsSUFBSSxDQUFDLFVBQVUsRUFBRTtNQUM5QixPQUFPLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDO0tBQzFDOztJQUVELEtBQUssR0FBRyxLQUFLLElBQUksR0FBRTtJQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUM7SUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLEdBQUU7SUFDeEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTTtJQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUk7SUFDaEIsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLEdBQUU7SUFDNUIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxJQUFJLEdBQUU7SUFDOUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxJQUFJLEdBQUU7SUFDeEMsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFFO0lBQ2YsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFFO0lBQ2xCLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRTs7Ozs7MENBQ3ZCOzs7Ozs7O29CQU9ELFdBQVcseUJBQUUsSUFBSSxFQUFFO0lBQ2pCLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksRUFBRTtNQUMvQyxNQUFNO0tBQ1A7O0lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7TUFDcEIsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7TUFDdEIsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksRUFBQztNQUM1RCxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDZCxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUM7T0FDL0I7TUFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBQztRQUM5REEsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7UUFDNUMsSUFBSSxVQUFVLEVBQUU7VUFDZCxPQUFPLFVBQVUsQ0FBQyxJQUFJO1lBQ3BCLEtBQUs7WUFDTCxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUU7WUFDeEIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztXQUM5QjtTQUNGO09BQ0Y7S0FDRjtTQUNJO01BQ0gsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksRUFBQztNQUMxRCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCQSxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUM7UUFDMUVBLElBQU1HLFlBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQztRQUM1QyxJQUFJQSxZQUFVLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtVQUM1QixPQUFPQSxZQUFVLENBQUMsSUFBSTtZQUNwQixLQUFLO1lBQ0wsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO1lBQ3pCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQztXQUM1QjtTQUNGO09BQ0Y7S0FDRjtJQUNGOzs7Ozs7OztvQkFRRCxZQUFZLDBCQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7SUFDMUIsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxFQUFFO01BQy9DLE1BQU07S0FDUDtJQUNELElBQUksSUFBSSxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFDLEVBQUU7TUFDeEUsTUFBTTtLQUNQO0lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7TUFDcEIsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7TUFDdEIsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBQztNQUNyRSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDZCxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUM7T0FDL0I7TUFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCSCxJQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFDO1FBQ3RDQSxJQUFNLEtBQUssR0FBRyxXQUFXO1VBQ3ZCLElBQUk7VUFDSixJQUFJLENBQUMsWUFBWTtVQUNqQixVQUFVO2NBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO2NBQ3JDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTTtVQUM3QjtRQUNEQSxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQztRQUM1QyxJQUFJLFVBQVUsRUFBRTtVQUNkLE9BQU8sVUFBVSxDQUFDLElBQUk7WUFDcEIsS0FBSztZQUNMLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRTtZQUN4QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssQ0FBQztXQUNqQztTQUNGO09BQ0Y7S0FDRjtTQUNJO01BQ0gsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBQztNQUNuRSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCQSxJQUFNSSxZQUFVLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBQzs7UUFFdENKLElBQU1LLE9BQUssR0FBRyxTQUFTO1VBQ3JCLElBQUk7VUFDSixJQUFJLENBQUMsWUFBWTtVQUNqQkQsWUFBVTtjQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDQSxZQUFVLENBQUM7Y0FDckMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNO1VBQzdCO1FBQ0RKLElBQU1HLFlBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQztRQUM1QyxJQUFJQSxZQUFVLElBQUlFLE9BQUssSUFBSSxDQUFDLEVBQUU7VUFDNUIsT0FBT0YsWUFBVSxDQUFDLElBQUk7WUFDcEIsS0FBSztZQUNMLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRTtZQUN6QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRUUsT0FBSyxDQUFDO1dBQzVCO1NBQ0Y7T0FDRjtLQUNGO0lBQ0Y7Ozs7Ozs7O29CQVFELFdBQVcseUJBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtJQUN4QixJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxJQUFJLEVBQUU7TUFDL0MsTUFBTTtLQUNQO0lBQ0QsSUFBSSxJQUFJLEtBQUssS0FBSyxLQUFLLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxLQUFLLENBQUMsRUFBRTtNQUM5RSxNQUFNO0tBQ1A7SUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtNQUNwQixVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksRUFBQztNQUN0QixXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBQzs7TUFFeEUsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ2QsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFDO09BQy9CO01BQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsRUFBRTtRQUN2QkwsSUFBTSxLQUFLLEdBQUcsV0FBVztVQUN2QixJQUFJO1VBQ0osSUFBSSxDQUFDLFlBQVk7VUFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQztVQUN0RDtRQUNEQSxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQzs7UUFFNUMsSUFBSSxVQUFVLEVBQUU7VUFDZCxPQUFPLFVBQVUsQ0FBQyxJQUFJO1lBQ3BCLEtBQUs7WUFDTCxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUU7WUFDeEIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUM7V0FDakM7U0FDRjtPQUNGO0tBQ0Y7U0FDSTtNQUNILFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFDO01BQ3RFLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLEVBQUU7UUFDdkJBLElBQU1LLE9BQUssR0FBRyxTQUFTO1VBQ3JCLElBQUk7VUFDSixJQUFJLENBQUMsWUFBWTtVQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDO1VBQ3REO1FBQ0RMLElBQU1HLFlBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQztRQUM1QyxJQUFJQSxZQUFVLElBQUlFLE9BQUssSUFBSSxDQUFDLEVBQUU7VUFDNUIsT0FBT0YsWUFBVSxDQUFDLElBQUk7WUFDcEIsS0FBSztZQUNMLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRTtZQUN6QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRUUsT0FBSyxDQUFDO1dBQzVCO1NBQ0Y7T0FDRjtLQUNGO0lBQ0Y7Ozs7Ozs7b0JBT0QsV0FBVyx5QkFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO0lBQzVCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtNQUNuQixXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFDO01BQ3RDLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLEVBQUU7UUFDdkIsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFDO1FBQ3BDTCxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQztRQUM1QyxJQUFJLFVBQVUsRUFBRTtVQUNkLFVBQVUsQ0FBQyxJQUFJO1lBQ2IsS0FBSztZQUNMLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRTtZQUMzQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDWDtTQUNGO09BQ0Y7S0FDRjtJQUNELElBQUksQ0FBQyxTQUFTLEVBQUU7TUFDZCxJQUFJLENBQUMsT0FBTyxHQUFFO0tBQ2Y7SUFDRjs7Ozs7b0JBS0QsS0FBSyxxQkFBSTtJQUNQQSxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQzs7SUFFNUMsSUFBSSxVQUFVLEVBQUU7TUFDZCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sV0FBQyxNQUFLO1FBQzdCLFVBQVUsQ0FBQyxJQUFJO1VBQ2IsS0FBSztVQUNMLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRTtVQUMzQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7VUFDWDtPQUNGLEVBQUM7S0FDSDtJQUNELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxXQUFDLE1BQUs7TUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRTtLQUNmLEVBQUM7SUFDRixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxFQUFDO0lBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLEVBQUM7SUFDN0I7Ozs7Ozs7O29CQVFELE9BQU8scUJBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDM0IsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO01BQ2hELE1BQU07S0FDUDtJQUNELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBSztJQUN0QkEsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7SUFDNUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxVQUFVLEVBQUU7TUFDekJBLElBQU0sTUFBTSxHQUFHLEdBQUU7TUFDakIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQUs7TUFDbkIsVUFBVSxDQUFDLElBQUk7UUFDYixLQUFLO1FBQ0wsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO1FBQ3pCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUM7UUFDbkI7S0FDRjtJQUNGOzs7Ozs7O29CQU9ELFFBQVEsc0JBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRTs7O0lBQzlCLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFFLFFBQU07SUFDakNBLElBQU0sU0FBUyxHQUFHLEdBQUU7SUFDcEIsS0FBS0EsSUFBTSxHQUFHLElBQUksWUFBWSxFQUFFO01BQzlCLElBQUlNLE1BQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3hDQSxNQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUM7UUFDbEMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUM7T0FDbkM7S0FDRjtJQUNELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7TUFDdkJOLElBQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDO01BQzVDLElBQUksQ0FBQyxNQUFNLElBQUksVUFBVSxFQUFFO1FBQ3pCLFVBQVUsQ0FBQyxJQUFJO1VBQ2IsS0FBSztVQUNMLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRTtVQUN6QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDO1VBQ3RCO09BQ0Y7S0FDRjtJQUNGOzs7Ozs7OztvQkFRRCxRQUFRLHNCQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO0lBQzVCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtNQUNqRCxNQUFNO0tBQ1A7SUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQUs7SUFDdkJBLElBQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDO0lBQzVDLElBQUksQ0FBQyxNQUFNLElBQUksVUFBVSxFQUFFO01BQ3pCQSxJQUFNLE1BQU0sR0FBRyxHQUFFO01BQ2pCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFLO01BQ25CLFVBQVUsQ0FBQyxJQUFJO1FBQ2IsS0FBSztRQUNMLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRTtRQUN6QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDO1FBQ25CO0tBQ0Y7SUFDRjs7Ozs7OztvQkFPRCxTQUFTLHVCQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUU7OztJQUNoQyxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBRSxRQUFNO0lBQ2xDQSxJQUFNLFNBQVMsR0FBRyxHQUFFO0lBQ3BCLEtBQUtBLElBQU0sR0FBRyxJQUFJLGFBQWEsRUFBRTtNQUMvQixJQUFJTSxNQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUMxQ0EsTUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxhQUFhLENBQUMsR0FBRyxFQUFDO1FBQ3BDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxhQUFhLENBQUMsR0FBRyxFQUFDO09BQ3BDO0tBQ0Y7SUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO01BQ3ZCTixJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQztNQUM1QyxJQUFJLENBQUMsTUFBTSxJQUFJLFVBQVUsRUFBRTtRQUN6QixVQUFVLENBQUMsSUFBSTtVQUNiLEtBQUs7VUFDTCxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7VUFDekIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQztVQUN0QjtPQUNGO0tBQ0Y7SUFDRjs7Ozs7O29CQU1ELGFBQWEsMkJBQUUsVUFBVSxFQUFFOzs7O0lBRXpCLEtBQUtBLElBQU0sR0FBRyxJQUFJTSxNQUFJLENBQUMsVUFBVSxFQUFFO01BQ2pDQSxNQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUU7S0FDMUI7O0lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBQztJQUMxQ04sSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7SUFDNUMsSUFBSSxVQUFVLEVBQUU7TUFDZCxVQUFVLENBQUMsSUFBSTtRQUNiLEtBQUs7UUFDTCxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7UUFDekIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQjtLQUNGO0lBQ0Y7Ozs7Ozs7b0JBT0QsUUFBUSxzQkFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTtJQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtNQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRTtLQUNoQjtJQUNELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO01BQ3JCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBRSxPQUFPLFVBQUUsTUFBTSxHQUFFO01BQ3RDQSxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQztNQUM1QyxJQUFJLFVBQVUsRUFBRTtRQUNkLFVBQVUsQ0FBQyxJQUFJO1VBQ2IsS0FBSztVQUNMLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRTtVQUN0QixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO1VBQ2pCO09BQ0Y7S0FDRjtJQUNGOzs7Ozs7b0JBTUQsV0FBVyx5QkFBRSxJQUFJLEVBQUU7SUFDakIsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7TUFDbEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQztNQUN2QkEsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7TUFDNUMsSUFBSSxVQUFVLEVBQUU7UUFDZCxVQUFVLENBQUMsSUFBSTtVQUNiLEtBQUs7VUFDTCxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7VUFDekIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztVQUNqQjtPQUNGO0tBQ0Y7SUFDRjs7Ozs7Ozs7OztvQkFVRCxTQUFTLHVCQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRTtJQUN6Q0QsSUFBSSxNQUFNLEdBQUcsS0FBSTtJQUNqQkEsSUFBSSxpQkFBaUIsR0FBRyxNQUFLO0lBQzdCQyxJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQztJQUNsQyxJQUFJLFNBQVMsSUFBSSxLQUFLLEVBQUU7TUFDdEJBLElBQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFPO01BQ2pDLEtBQUssQ0FBQyxlQUFlLGVBQU07UUFDekIsaUJBQWlCLEdBQUcsS0FBSTtRQUN6QjtNQUNELElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDN0IsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFJLFlBQUMsSUFBSSxXQUFLLE9BQU8sQ0FBQyxNQUFNLEdBQUUsUUFBSyxFQUFDO09BQ3REO1dBQ0k7UUFDSCxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFDO09BQ25DO0tBQ0Y7O0lBRUQsSUFBSSxDQUFDLGlCQUFpQjtTQUNqQixRQUFRO1VBQ1AsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNwQyxJQUFJLENBQUMsVUFBVTtTQUNmLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFO01BQzlCLEtBQUssQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVU7TUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUM7S0FDakQ7O0lBRUQsT0FBTyxNQUFNO0lBQ2Q7Ozs7OztvQkFNRCxPQUFPLHVCQUFJO0lBQ1QsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDdEQ7Ozs7OztvQkFNRCxNQUFNLHNCQUFJOzs7SUFDUkEsSUFBTSxNQUFNLEdBQUc7TUFDYixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUU7TUFDeEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO01BQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO01BQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUU7TUFDdEI7SUFDREEsSUFBTSxLQUFLLEdBQUcsR0FBRTtJQUNoQixLQUFLQSxJQUFNLElBQUksSUFBSU0sTUFBSSxDQUFDLEtBQUssRUFBRTtNQUM3QixPQUFnQixHQUFHQSxNQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7VUFBMUIsTUFBTSxjQUFxQjtNQUNuQyxJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ1gsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUM7T0FDakI7V0FDSTtRQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBRSxJQUFJLFVBQUUsTUFBTSxFQUFFLEVBQUM7T0FDN0I7S0FDRjtJQUNELElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtNQUNoQixNQUFNLENBQUMsS0FBSyxHQUFHLE1BQUs7S0FDckI7SUFDRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFO01BQzVCLE1BQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLFdBQUUsS0FBSyxFQUFFLFNBQUcsS0FBSyxDQUFDLE1BQU0sS0FBRSxFQUFDO0tBQ25FO0lBQ0QsT0FBTyxNQUFNO0lBQ2Q7Ozs7OztvQkFNRCxRQUFRLHdCQUFJO0lBQ1YsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUk7SUFDdEIsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNwQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxHQUFHO0lBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxXQUFFLEtBQUssRUFBRSxTQUFHLEtBQUssQ0FBQyxRQUFRLEtBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDM0QsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRztHQUN2Qjs7O0VBNWRrQzs7QUErZHJDLFVBQVUsQ0FBQyxPQUFPLENBQUM7O0FDM2dCbkI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFLQVAsSUFBSSxRQUFRLEdBQUcsWUFBWSxHQUFFOzs7QUFHN0IsQUFBTyxJQUFNLFVBQVUsR0FDckIsbUJBQVcsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFO0VBQzVCLE1BQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtJQUMxQyxVQUFZLEVBQUUsSUFBSTtJQUNsQixLQUFPLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztHQUNsQixFQUFDO0VBQ0osTUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7SUFDL0MsVUFBWSxFQUFFLElBQUk7SUFDbEIsS0FBTyxFQUFFLElBQUksZUFBZSxDQUFDLEVBQUUsQ0FBQztHQUMvQixFQUFDO0VBQ0osUUFBVSxHQUFHLFNBQVMsSUFBSSxZQUFZLEdBQUU7RUFDdkM7O0FBRUgscUJBQUUsUUFBUSxzQkFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtFQUN6QyxPQUFTLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDO0VBQ25FOztBQUVILHFCQUFFLFlBQVksNEJBQVc7Ozs7RUFDdkIsY0FBUyxJQUFJLENBQUMsaUJBQWdCLGtCQUFZLENBQUMsS0FBRyxJQUFJO1lBQUM7RUFDbEQ7O0FBRUgscUJBQUUsV0FBVywyQkFBVzs7OztFQUN0QixjQUFTLElBQUksQ0FBQyxpQkFBZ0IsaUJBQVcsQ0FBQyxLQUFHLElBQUk7WUFBQztFQUNqRDs7QUFFSCxxQkFBRSxVQUFVLHdCQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFO0VBQzVDLElBQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0lBQ3BCLE1BQVEsRUFBRSxLQUFLO0lBQ2YsTUFBUSxFQUFFLHFCQUFxQjtHQUM5QixFQUFFLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBQztFQUNyQzs7QUFFSCxxQkFBRSxlQUFlLCtCQUFJO0VBQ25CLE9BQVMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUU7RUFDcEM7Ozs7Ozs7O0FBUUgscUJBQUUsU0FBUyx1QkFBRSxDQUFDLEVBQUU7RUFDZCxJQUFRLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFDO0VBQ3ZCLElBQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxPQUFPLEVBQUU7SUFDL0IsT0FBUyxDQUFDLENBQUMsR0FBRztHQUNiO0VBQ0gsSUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxZQUFZLE9BQU8sRUFBRTtJQUMvQyxPQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRztHQUNqQjtFQUNILElBQU0sSUFBSSxLQUFLLFVBQVUsRUFBRTtJQUN6QixPQUFTLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtHQUM5QztFQUNILE9BQVMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO0VBQzdCOztBQUVILHFCQUFFLElBQUksa0JBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFOzs7RUFDbkMsSUFBVTtRQUFRO1FBQVc7UUFBSztRQUFRLE1BQU0saUJBQVc7O0VBRTNELElBQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxXQUFDLEtBQUksU0FBR08sTUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUMsRUFBQzs7RUFFN0MsUUFBVSxJQUFJO0lBQ1osS0FBTyxLQUFLO01BQ1YsT0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUM7SUFDOUMsS0FBTyxXQUFXO01BQ2hCLE9BQVMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFFLFNBQVMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzNHO01BQ0UsT0FBUyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDO0dBQzVFO0VBQ0Y7O0FBRUgscUJBQUUsT0FBTyxxQkFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0VBQ3ZCLE9BQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDO0VBQzNDOztBQUVILHFCQUFFLGFBQWEsMkJBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0VBQzNDLE9BQVMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDO0VBQzFFOztBQUVILHFCQUFFLFVBQVUsd0JBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0VBQzNDLE9BQVMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQztDQUMxRSxDQUNGOztBQUVELEFBQU8sU0FBU0MsTUFBSSxJQUFJO0VBQ3RCUCxJQUFNLFdBQVcsR0FBRztJQUNsQixZQUFZLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtJQUNyQyxZQUFZLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtJQUNyQyxhQUFhLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjs7SUFFdkMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxjQUFjOztJQUVqQyxVQUFVLEVBQUUsTUFBTSxDQUFDLGNBQWM7SUFDakMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxpQkFBaUI7SUFDdkMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxlQUFlO0lBQ25DLFdBQVcsRUFBRSxNQUFNLENBQUMsZUFBZTtJQUNuQyxXQUFXLEVBQUUsTUFBTSxDQUFDLGVBQWU7O0lBRW5DLFFBQVEsRUFBRSxNQUFNLENBQUMsWUFBWTtJQUM3QixXQUFXLEVBQUUsTUFBTSxDQUFDLGVBQWU7SUFDcEM7RUFDREEsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLFVBQVM7OytCQUVGO0lBQzlCQSxJQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFDO0lBQ2hDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNO2dCQUNqQixFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQUcsWUFBTSxXQUFDLEVBQUUsV0FBSyxNQUFJLElBQUM7Z0JBQ2hDLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBRyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLFFBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEtBQUM7OztFQUo3RSxLQUFLQSxJQUFNLElBQUksSUFBSSxXQUFXLGVBSzdCOztFQUVELEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsbUJBQW1CO2VBQy9DLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsU0FDaEMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTLE9BQUUsR0FBRyxVQUFFLE1BQU0sUUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFDLEVBQUM7O0VBRXhFLEtBQUssQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLGdCQUFnQjtlQUN6QyxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FDMUIsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQUUsTUFBTSxVQUFFLE1BQU0sUUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFDLEVBQUM7Q0FDOUM7O0FDaEpEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUEsU0FBUyxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUU7RUFDckVBLElBQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFDO0VBQ2xDLElBQUksRUFBRSxFQUFFO0lBQ04sT0FBTyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUM7R0FDL0Q7RUFDRCxPQUFPLElBQUksS0FBSyxtQ0FBK0IsTUFBTSxTQUFJO0NBQzFEOztBQUVELFNBQVMsUUFBUSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtFQUMxRCxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDO0NBQ25FOztBQUVELFNBQVMsYUFBYSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7RUFDbEUsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7SUFDckMsT0FBTyxDQUFDLEtBQUssQ0FBQywyREFBdUQsRUFBQztJQUN0RSxPQUFPLElBQUk7R0FDWjtFQUNERCxJQUFJLE1BQU0sR0FBRyxLQUFJO0VBQ2pCLElBQUk7SUFDRixNQUFNLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0dBQzNFO0VBQ0QsT0FBTyxDQUFDLEVBQUU7SUFDUixPQUFPLENBQUMsS0FBSyw4Q0FBMEMsSUFBSSxTQUFJLElBQUksbUJBQWEsV0FBVyxTQUFJO0dBQ2hHO0VBQ0QsT0FBTyxNQUFNO0NBQ2Q7Ozs7Ozs7O0FBUUQsQUFBTyxTQUFTLFlBQVksRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFO0VBQ3ZDQyxJQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFDO0VBQzNCLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDYixPQUFPLElBQUksS0FBSyxDQUFDLHlDQUF5QztRQUN0RCxlQUFhLEVBQUUsd0JBQXFCLENBQUM7R0FDMUM7RUFDRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDeEIsT0FBTyxLQUFLLENBQUMsR0FBRyxXQUFDLE1BQUs7TUFDcEIsUUFBUSxJQUFJLENBQUMsTUFBTTtRQUNqQixLQUFLLFVBQVUsRUFBRSxPQUFPLGNBQVEsV0FBQyxRQUFRLFdBQUssSUFBSSxDQUFDLE1BQUksQ0FBQztRQUN4RCxLQUFLLGVBQWUsQ0FBQztRQUNyQixLQUFLLFdBQVcsRUFBRSxPQUFPLGVBQVMsV0FBQyxRQUFRLFdBQUssSUFBSSxDQUFDLE1BQUksQ0FBQztRQUMxRCxLQUFLLGVBQWUsRUFBRSxPQUFPLG1CQUFhLFdBQUMsUUFBUSxXQUFLLElBQUksQ0FBQyxNQUFJLENBQUM7T0FDbkU7S0FDRixDQUFDO0dBQ0g7Q0FDRjs7QUN0RUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkFBLElBQU0sV0FBVyxHQUFHLEdBQUU7Ozs7OztBQU10QixBQUFPLFNBQVMsZUFBZSxFQUFFLFVBQVUsRUFBRTsrQkFDWjtJQUM3QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFO01BQ3RCLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFFO0tBQ3ZCO0lBQ0QsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sV0FBQyxRQUFPO01BQzlCLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO1FBQzlCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxLQUFJO09BQ2pDO1dBQ0k7UUFDSCxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFJO09BQzdDO0tBQ0YsRUFBQzs7O0VBWEosS0FBS0EsSUFBTSxJQUFJLElBQUksVUFBVSxlQVk1QjtDQUNGOzs7Ozs7O0FBT0QsQUFBTyxTQUFTLGtCQUFrQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7RUFDaEQsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7SUFDOUIsT0FBTyxDQUFDLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUMxRDtFQUNELE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7Q0FDM0I7O0FBRUQsQUFBTyxTQUFTLG9CQUFvQixFQUFFLElBQUksRUFBRTtFQUMxQyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUM7Q0FDekI7O0FDdkREOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBRUFBLElBQU0sY0FBYyxHQUFHLEdBQUU7Ozs7OztBQU16QixBQUFPLFNBQVMsa0JBQWtCLEVBQUUsYUFBYSxFQUFFO0VBQ2pELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRTtJQUNoQyxhQUFhLENBQUMsT0FBTyxXQUFDLFdBQVU7TUFDOUIsSUFBSSxDQUFDLFNBQVMsRUFBRTtRQUNkLE1BQU07T0FDUDtNQUNELElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFO1FBQ2pDLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxLQUFJO09BQ2pDO1dBQ0ksSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLElBQUksT0FBTyxTQUFTLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUM1RSxjQUFjLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVM7UUFDMUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBQztPQUNuRDtLQUNGLEVBQUM7R0FDSDtDQUNGOzs7Ozs7QUFNRCxBQUFPLFNBQVMscUJBQXFCLEVBQUUsSUFBSSxFQUFFO0VBQzNDLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7Q0FDOUI7O0FDbEREOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkEsQUFBT0EsSUFBTSxRQUFRLEdBQUcsR0FBRTs7Ozs7Ozs7Ozs7Ozs7OztBQWdCMUIsQUFBTyxTQUFTLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0VBQ3ZDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ2IsT0FBTyxDQUFDLElBQUksaUJBQWEsSUFBSSx1Q0FBaUM7R0FDL0Q7T0FDSTtJQUNILE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUM7SUFDcEMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFFLElBQUksV0FBRSxPQUFPLEVBQUUsRUFBQztHQUNqQztDQUNGOzs7Ozs7QUFNRCxBQUFPLFNBQVMsVUFBVSxFQUFFLElBQUksRUFBRTtFQUNoQyxRQUFRLENBQUMsSUFBSSxXQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUU7SUFDN0IsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtNQUN6QixRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUM7TUFDekIsT0FBTyxJQUFJO0tBQ1o7R0FDRixFQUFDO0NBQ0g7Ozs7Ozs7QUFPRCxBQUFPLFNBQVMsR0FBRyxFQUFFLElBQUksRUFBRTtFQUN6QixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0NBQzFCOzs7Ozs7O0FBT0QsU0FBUyxPQUFPLEVBQUUsSUFBSSxFQUFFO0VBQ3RCLE9BQU8sUUFBUSxDQUFDLEdBQUcsV0FBQyxTQUFRLFNBQUcsT0FBTyxDQUFDLE9BQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Q0FDM0Q7O0FDNUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBR08sU0FBUyxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7RUFDdENBLElBQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxFQUFFLEVBQUM7RUFDcEMsSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLFVBQVUsQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFO0lBQ3hELE9BQU8sQ0FBQyxLQUFLLENBQUMsMENBQTBDLEVBQUM7SUFDekQsTUFBTTtHQUNQO0VBQ0QsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtJQUNuQixPQUFPLENBQUMsSUFBSSwwQ0FBdUMsSUFBSSxvQkFBZSxLQUFLLFNBQUk7SUFDL0UsTUFBTTtHQUNQO0VBQ0RBLElBQU0sS0FBSyxHQUFHLFVBQVEsSUFBSSxTQUFJLE1BQUs7RUFDbkMsSUFBSTtJQUNGLElBQUksa0JBQWtCLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxFQUFFO01BQ25EQSxJQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBQztNQUNuQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBRztNQUNwQixVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUN4QixNQUFNLEVBQUUsV0FBVztRQUNuQixNQUFNLEVBQUUsY0FBYztPQUN2QixFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUM7S0FDZDtHQUNGO0VBQ0QsT0FBTyxHQUFHLEVBQUU7SUFDVixPQUFPLENBQUMsS0FBSyx3Q0FBb0MsS0FBSyxXQUFLO0dBQzVEO0NBQ0Y7O0FDOUNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBR0EsSUFBcUIsT0FBTztFQUMxQixnQkFBVyxFQUFFLEtBQUssRUFBRTtJQUNsQkUsWUFBSyxLQUFDLEVBQUM7O0lBRVAsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFDO0lBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxHQUFFO0lBQ3hCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU07SUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxVQUFTO0lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBSztJQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUU7SUFDbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFFOzs7OzswQ0FDdkI7Ozs7OztvQkFNRCxRQUFRLHdCQUFJO0lBQ1YsT0FBTyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNO0dBQ3JDOzs7RUFuQmtDOztBQ3RCckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QkEsU0FBUyxZQUFZLEVBQUUsSUFBSSxFQUFFLElBQVMsRUFBRTs2QkFBUCxHQUFHOztFQUNsQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7Q0FDbkQ7O0FBRUQsSUFBcUIsUUFBUSxHQUMzQixpQkFBVyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDMUIsSUFBTSxDQUFDLEVBQUUsR0FBRyxHQUFFO0VBQ2QsSUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFLO0VBQ3RCLElBQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRTtFQUNuQixJQUFNLE9BQU8sT0FBTyxLQUFLLFVBQVUsRUFBRTtJQUNuQyxNQUFRLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7TUFDdkMsWUFBYyxFQUFFLElBQUk7TUFDcEIsVUFBWSxFQUFFLElBQUk7TUFDbEIsUUFBVSxFQUFFLElBQUk7TUFDaEIsS0FBTyxFQUFFLE9BQU87S0FDZixFQUFDO0dBQ0g7T0FDSTtJQUNMLE9BQVMsQ0FBQyxLQUFLLENBQUMsNERBQTRELEVBQUM7R0FDNUU7RUFDRjs7Ozs7OztBQU9ILG1CQUFFLFlBQVksMEJBQUUsUUFBUSxFQUFFO0VBQ3hCLElBQVEsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFPO0VBQzlCLE9BQVMsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDO0VBQ3pEOzs7Ozs7O0FBT0gsbUJBQUUsWUFBWSwwQkFBRSxRQUFRLEVBQUU7RUFDeEIsSUFBUSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQU87RUFDOUIsT0FBUyxPQUFPLENBQUMsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUM7RUFDekQ7Ozs7Ozs7QUFPSCxtQkFBRSxhQUFhLDJCQUFFLFFBQVEsRUFBRTtFQUN6QixJQUFRLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBTztFQUM5QixPQUFTLE9BQU8sQ0FBQyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQztFQUMxRDs7Ozs7OztBQU9ILG1CQUFFLFVBQVUsd0JBQUUsT0FBTyxFQUFFO0VBQ3JCLElBQVEsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUU7RUFDL0IsSUFBUSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVE7RUFDaEMsT0FBUyxJQUFJLENBQUMsU0FBUTtFQUN0QixJQUFRLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDO0VBQ3RELElBQU0sUUFBUSxFQUFFO0lBQ2QsT0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxHQUFHLFdBQUMsT0FBTTtNQUMvQyxPQUFTLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3pELENBQUMsRUFBQztHQUNKO0VBQ0gsT0FBUyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztFQUNoQzs7Ozs7Ozs7O0FBU0gsbUJBQUUsVUFBVSx3QkFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRTtFQUNqQyxJQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFO0lBQ25CLEtBQU8sR0FBRyxDQUFDLEVBQUM7R0FDWDtFQUNILE9BQVMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0VBQ25GOzs7Ozs7O0FBT0gsbUJBQUUsYUFBYSwyQkFBRSxHQUFHLEVBQUU7RUFDcEIsSUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBQ3hCLElBQVEsT0FBTyxHQUFHLEdBQUcsQ0FBQyxHQUFHLFdBQUUsQ0FBQyxFQUFFLFNBQUcsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFDLEVBQUM7SUFDcEUsT0FBUyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztHQUNoQztFQUNILE9BQVMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUM3RDs7Ozs7Ozs7O0FBU0gsbUJBQUUsV0FBVyx5QkFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRTtFQUMxQyxPQUFTLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUNuRjs7Ozs7Ozs7O0FBU0gsbUJBQUUsT0FBTyxxQkFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRTtFQUMxQixJQUFRLE1BQU0sR0FBRyxHQUFFO0VBQ25CLE1BQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFLO0VBQ3JCLE9BQVMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDbkU7Ozs7Ozs7OztBQVNILG1CQUFFLFFBQVEsc0JBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUU7RUFDM0IsSUFBUSxNQUFNLEdBQUcsR0FBRTtFQUNuQixNQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBSztFQUNyQixPQUFTLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQ25FOzs7Ozs7OztBQVFILG1CQUFFLFNBQVMsdUJBQUUsR0FBRyxFQUFFLEtBQUssRUFBRTtFQUN2QixPQUFTLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0VBQ2xFOzs7Ozs7OztBQVFILG1CQUFFLFFBQVEsc0JBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtFQUNyQixPQUFTLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQzlEOzs7Ozs7OztBQVFILG1CQUFFLFdBQVcseUJBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtFQUN4QixPQUFTLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ2pFOzs7Ozs7OztBQVFILG1CQUFFLE9BQU8scUJBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtFQUN0QixPQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUU7RUFDbEI7Ozs7Ozs7QUFPSCxtQkFBRSxVQUFVLHdCQUFFLE9BQU8sRUFBRTtFQUNyQixJQUFRLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBTztFQUM5QixJQUFRLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBTzs7RUFFOUIsSUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7SUFDN0IsT0FBUyxHQUFHLENBQUMsT0FBTyxFQUFDO0dBQ3BCOztFQUVILElBQU0sSUFBSSxDQUFDLE9BQU8sRUFBRTtJQUNsQixPQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFDO0dBQ3JDO09BQ0k7SUFDTCxPQUFTLE9BQU8sQ0FBQyxPQUFPLENBQUM7R0FDeEI7Q0FDRjs7QUMxTkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCQUYsSUFBTSxVQUFVLEdBQUc7RUFDakIsVUFBVSxFQUFFLGdCQUFnQjtFQUM1QixVQUFVLEVBQUUsZ0JBQWdCO0VBQzVCLGFBQWEsRUFBRSxtQkFBbUI7RUFDbEMsV0FBVyxFQUFFLGlCQUFpQjtFQUM5QixXQUFXLEVBQUUsaUJBQWlCO0VBQzlCLFdBQVcsRUFBRSxpQkFBaUI7RUFDOUIsUUFBUSxFQUFFLGNBQWM7RUFDeEIsV0FBVyxFQUFFLGlCQUFpQjtFQUMvQjs7Ozs7Ozs7QUFRRCxBQUFPLFNBQVMsYUFBYSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDMUNBLElBQU0sY0FBYyxHQUFHLE9BQU8sSUFBSSxNQUFNLENBQUMsV0FBVTs7O0VBR25ELElBQUksT0FBTyxjQUFjLEtBQUssVUFBVSxFQUFFO0lBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUM7R0FDakQ7O0VBRUQsT0FBTyxTQUFTLFdBQVcsRUFBRSxLQUFLLEVBQUU7O0lBRWxDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO01BQ3pCLEtBQUssR0FBRyxDQUFDLEtBQUssRUFBQztLQUNoQjtJQUNELEtBQUtELElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUNyQ0MsSUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxFQUFDO01BQzlELElBQUksV0FBVyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ3RCLE9BQU8sV0FBVztPQUNuQjtLQUNGO0dBQ0Y7Q0FDRjs7Ozs7Ozs7QUFRRCxTQUFTLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUU7RUFDNUMsT0FBTyxNQUFNLEtBQUssS0FBSztPQUNsQixVQUFVLENBQUMsTUFBTSxDQUFDO09BQ2xCLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLFVBQVU7Q0FDdEQ7Ozs7Ozs7OztBQVNELFNBQVMsWUFBWSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFO0VBQy9DLElBQVE7TUFBUTtNQUFRLElBQUksYUFBUzs7RUFFckMsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUU7SUFDdkMsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFDLFdBQUMsRUFBRSxXQUFLLElBQUksR0FBRSxPQUFJLENBQUM7R0FDckQ7O0VBRUQsT0FBTyxjQUFjLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDO0NBQ3hDOztBQzFGRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQTs7Ozs7QUFZQSxTQUFTLGFBQWEsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFO0VBQ25DQSxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxJQUFJLEdBQUU7RUFDakMsS0FBS0EsSUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO0lBQ3hCLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUM7R0FDcEM7RUFDREEsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxHQUFFO0VBQ2pDLEtBQUtBLElBQU1RLE1BQUksSUFBSSxLQUFLLEVBQUU7SUFDeEIsRUFBRSxDQUFDLFFBQVEsQ0FBQ0EsTUFBSSxFQUFFLEtBQUssQ0FBQ0EsTUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFDO0dBQ3JDO0NBQ0Y7O0FBRUQsSUFBcUIsUUFBUSxHQUMzQixpQkFBVyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFO0VBQy9CLEVBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUU7RUFDOUIsSUFBTSxDQUFDLEVBQUUsR0FBRyxHQUFFO0VBQ2QsSUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFHOztFQUVoQixNQUFRLENBQUMsRUFBRSxFQUFFLElBQUksRUFBQztFQUNsQixJQUFNLENBQUMsT0FBTyxHQUFHLEdBQUU7RUFDbkIsSUFBUSxDQUFDLEdBQUcsUUFBUSxDQUFDLFFBQVEsSUFBSSxTQUFRO0VBQ3pDLElBQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxhQUFhLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBQztFQUMzRSxJQUFNLENBQUMsVUFBVSxHQUFHLElBQUksVUFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLGFBQUksRUFBRSxFQUFXOzs7O1dBQUcsYUFBTyxDQUFDLFFBQUcsSUFBSTtHQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBQztFQUN0RyxJQUFNLENBQUMscUJBQXFCLEdBQUU7RUFDN0I7Ozs7Ozs7QUFPSCxtQkFBRSxNQUFNLG9CQUFFLEdBQUcsRUFBRTtFQUNiLE9BQVMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7RUFDekI7Ozs7O0FBS0gsbUJBQUUsSUFBSSxvQkFBSTtFQUNSLElBQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLE1BQUs7RUFDOUI7Ozs7O0FBS0gsbUJBQUUsS0FBSyxxQkFBSTtFQUNULElBQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLEtBQUk7RUFDN0I7Ozs7OztBQU1ILG1CQUFFLHFCQUFxQixxQ0FBSTs7O0VBQ3pCLElBQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO0lBQzNCLElBQVEsRUFBRSxHQUFHLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBQztJQUNwQyxFQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFFO0lBQ3BCLEVBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSTtJQUN6QixFQUFJLENBQUMsSUFBSSxHQUFHLGtCQUFpQjtJQUM3QixFQUFJLENBQUMsS0FBSyxHQUFHLEVBQUM7SUFDZCxFQUFJLENBQUMsR0FBRyxHQUFHLG1CQUFrQjtJQUM3QixJQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixHQUFHLEdBQUU7SUFDcEMsSUFBTSxDQUFDLGVBQWUsR0FBRyxHQUFFOztJQUUzQixNQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxhQUFhLEVBQUU7TUFDekMsWUFBYyxFQUFFLElBQUk7TUFDcEIsVUFBWSxFQUFFLElBQUk7TUFDbEIsUUFBVSxFQUFFLElBQUk7TUFDaEIsS0FBTyxZQUFHLElBQUksRUFBRTtRQUNkLFVBQVksQ0FBQ0YsTUFBSSxFQUFFLElBQUksRUFBQztPQUN2QjtLQUNGLEVBQUM7O0lBRUosTUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFO01BQzFDLFlBQWMsRUFBRSxJQUFJO01BQ3BCLFVBQVksRUFBRSxJQUFJO01BQ2xCLFFBQVUsRUFBRSxJQUFJO01BQ2hCLEtBQU8sWUFBRyxJQUFJLEVBQUUsTUFBTSxFQUFFO1FBQ3RCLFVBQVksQ0FBQ0EsTUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7T0FDL0I7S0FDRixFQUFDO0dBQ0g7O0VBRUgsT0FBUyxJQUFJLENBQUMsZUFBZTtFQUM1Qjs7Ozs7Ozs7QUFRSCxtQkFBRSxVQUFVLHdCQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7RUFDekIsSUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7SUFDaEIsSUFBUSxFQUFFLEdBQUcsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBQztJQUNyQyxPQUFTLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBQztHQUNsQjs7RUFFSCxPQUFTLElBQUksQ0FBQyxJQUFJO0VBQ2pCOzs7Ozs7OztBQVFILG1CQUFFLGFBQWEsMkJBQUUsT0FBTyxFQUFFLEtBQUssRUFBRTtFQUMvQixPQUFTLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUM7RUFDbkM7Ozs7Ozs7QUFPSCxtQkFBRSxhQUFhLDJCQUFFLElBQUksRUFBRTtFQUNyQixPQUFTLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQztFQUN6Qjs7Ozs7Ozs7Ozs7QUFXSCxtQkFBRSxTQUFTLHVCQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUU7RUFDakQsSUFBTSxDQUFDLEVBQUUsRUFBRTtJQUNULE1BQVE7R0FDUDtFQUNILEtBQU8sR0FBRyxLQUFLLElBQUksR0FBRTtFQUNyQixLQUFPLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSTtFQUNqQyxLQUFPLENBQUMsTUFBTSxHQUFHLEdBQUU7RUFDbkIsS0FBTyxDQUFDLGFBQWEsR0FBRyxHQUFFO0VBQzFCLEtBQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRTtFQUM5QixJQUFNLFVBQVUsRUFBRTtJQUNoQixhQUFlLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBQztHQUM5QjtFQUNILElBQVEsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLE9BQU07RUFDakUsT0FBUyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQztFQUNwRDs7Ozs7QUFLSCxtQkFBRSxPQUFPLHVCQUFJO0VBQ1gsSUFBTSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEdBQUU7RUFDbkMsT0FBUyxJQUFJLENBQUMsU0FBUTtFQUN0QixPQUFTLElBQUksQ0FBQyxRQUFPO0VBQ3JCLE9BQVMsSUFBSSxDQUFDLFdBQVU7RUFDeEIsU0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUM7Q0FDbkI7OztBQUlILFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSTs7QUM1THZCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLEFBS0FOLElBQU0sYUFBYSxHQUFHLEdBQUU7O0FBRXhCLFNBQVMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7RUFDeEIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUM7Q0FDcEU7O0FBRUQsU0FBUyxLQUFLLEVBQUUsSUFBSSxFQUFFO0VBQ3BCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDO0NBQ3JDOztBQUVELFNBQVMsWUFBWSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFO0VBQ3pDQSxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsRUFBRSxFQUFDO0VBQ3BDLElBQUksQ0FBQyxVQUFVLElBQUksT0FBTyxVQUFVLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRTtJQUN4RCxPQUFPLENBQUMsS0FBSyxpREFBOEMsRUFBRSxVQUFLO0lBQ2xFLE9BQU8sSUFBSTtHQUNaO0VBQ0QsbUJBQWlCOzs7O1dBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBRSxNQUFNLFVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSTtHQUFDO0NBQ3hFOztBQUVELFNBQVMsWUFBWSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtFQUM3Q0EsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLEVBQUUsRUFBQztFQUNwQyxJQUFJLENBQUMsVUFBVSxJQUFJLE9BQU8sVUFBVSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7SUFDeEQsT0FBTyxDQUFDLEtBQUssaURBQThDLEVBQUUsVUFBSztJQUNsRSxPQUFPLElBQUk7R0FDWjtFQUNELElBQUksT0FBTyxFQUFFLEtBQUssVUFBVSxFQUFFO0lBQzVCLE9BQU8sQ0FBQyxLQUFLLHNCQUFtQixNQUFNLFNBQUksTUFBTSx3Q0FBbUM7SUFDbkYsT0FBTyxJQUFJO0dBQ1o7RUFDRCxpQkFBTyxJQUFHLFNBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBRSxNQUFNLFVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBQztDQUNqRTs7QUFFRCxJQUFxQixZQUFZLEdBQy9CLHFCQUFXLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRTtFQUN6QixLQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBQztFQUN6QixJQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxHQUFFO0VBQzVCLElBQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFDO0VBQ3pELElBQU0sQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0VBQ3BELElBQU0sQ0FBQyxrQkFBa0IsR0FBRyxtQkFBa0I7RUFDOUMsSUFBTSxDQUFDLHFCQUFxQixHQUFHLHNCQUFxQjtFQUNuRDs7QUFFSCx1QkFBRSxhQUFhLDJCQUFFLFVBQVUsRUFBRTtFQUMzQixJQUFRLEVBQUUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFDO0VBQ3hCLElBQU0sRUFBRSxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFO0lBQ3hELE9BQVMsQ0FBQyxLQUFLLENBQUMsOENBQTJDLFVBQVUsVUFBTTtRQUNyRSxlQUFhLEVBQUUsNkJBQTBCLEVBQUM7SUFDaEQsTUFBUTtHQUNQOzs7RUFHSCxJQUFNLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLEVBQUU7SUFDckMsT0FBUyxDQUFDLElBQUksdURBQW1ELFVBQVUsVUFBSTtJQUMvRSxNQUFRO0dBQ1A7OztFQUdILElBQVEsU0FBUyxHQUFHLFVBQWEsU0FBSSxHQUFFO0VBQ3ZDLElBQU0sQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEVBQUU7O0lBRS9CLElBQVEsWUFBWSxHQUFHLG9CQUFvQixDQUFDLFVBQVUsRUFBQztJQUN2RCxJQUFRLFVBQVUsR0FBRyxHQUFFO0lBQ3ZCLG1DQUF5QztNQUN2QyxNQUFRLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUU7UUFDOUMsVUFBWSxFQUFFLElBQUk7UUFDbEIsWUFBYyxFQUFFLElBQUk7UUFDcEIsR0FBSyxjQUFLLFNBQUcsWUFBWSxDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsVUFBVSxJQUFDO1FBQ3JELEdBQUssWUFBRSxJQUFHLFNBQUcsWUFBWSxDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEVBQUUsSUFBQztPQUN4RCxFQUFDOzs7TUFOSixLQUFLQSxJQUFNLFVBQVUsSUFBSSxZQUFZLHFCQU9wQzs7O0lBR0gsSUFBTSxPQUFPLEtBQUssS0FBSyxVQUFVLEVBQUU7TUFDakMsYUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtRQUNqRCxpQkFBSyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUU7VUFDekIsSUFBTSxVQUFVLElBQUksTUFBTSxFQUFFO1lBQzFCLE9BQVMsTUFBTSxDQUFDLFVBQVUsQ0FBQztXQUMxQjtVQUNILE9BQVMsQ0FBQyxJQUFJLGtEQUE4QyxVQUFVLFNBQUksVUFBVSxVQUFJO1VBQ3hGLE9BQVMsWUFBWSxDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDO1NBQ2hEO09BQ0YsRUFBQztLQUNIO1NBQ0k7TUFDTCxhQUFlLENBQUMsU0FBUyxDQUFDLEdBQUcsV0FBVTtLQUN0QztHQUNGOztFQUVILE9BQVMsYUFBYSxDQUFDLFNBQVMsQ0FBQztFQUNoQzs7QUFFSCx1QkFBRSxRQUFRLHNCQUFFLFNBQVMsRUFBRTtFQUNyQixJQUFNLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBRSxPQUFPLE1BQUk7O0VBRWhELElBQVEsR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUM7RUFDM0QsSUFBTSxHQUFHLEVBQUU7SUFDVCxJQUFRLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFDO0lBQ3JCLElBQVEsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUM7SUFDckIsSUFBUSxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBQztJQUN2QixRQUFVLElBQUk7TUFDWixLQUFPLFFBQVEsRUFBRSxPQUFPLGtCQUFrQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7TUFDeEQsS0FBTyxXQUFXLEVBQUUsT0FBTyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7S0FDckQ7R0FDRjs7RUFFSCxPQUFTLElBQUk7Q0FDWjs7QUNsSUg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFTQUQsSUFBSSxXQUFVO0FBQ2RBLElBQUksY0FBYTs7QUFFakJDLElBQU0sYUFBYSxHQUFHLCtCQUE4Qjs7Ozs7Ozs7O0FBU3BELFNBQVMsYUFBYSxFQUFFLElBQUksRUFBRTtFQUM1QkEsSUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUM7RUFDdkMsSUFBSSxNQUFNLEVBQUU7SUFDVixJQUFJO01BQ0ZBLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDO01BQ2xDLE9BQU8sSUFBSSxDQUFDLFNBQVM7S0FDdEI7SUFDRCxPQUFPLENBQUMsRUFBRSxFQUFFO0dBQ2I7OztFQUdELE9BQU8sTUFBTTtDQUNkOztBQUVELFNBQVMsY0FBYyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFOztFQUV4Q0EsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUM7RUFDdEMsVUFBVSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBQztFQUN4QyxRQUFRLENBQUMsT0FBTyxXQUFFLEdBQWlCLEVBQUU7UUFBakI7UUFBTTs7SUFDeEIsQUFBNEM7TUFDMUMsT0FBTyxDQUFDLEtBQUssbUNBQWdDLElBQUksU0FBSTtLQUN0RDtJQUNEQSxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTTtJQUM3QixJQUFJLE1BQU0sRUFBRTtNQUNWLElBQUk7UUFDRkEsSUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFDO1FBQ3RDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUM7UUFDekMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBQztPQUMzQztNQUNELE9BQU8sQ0FBQyxFQUFFO1FBQ1IsT0FBTyxDQUFDLEtBQUssNkNBQTBDLElBQUksU0FBSTtPQUNoRTtLQUNGO0dBQ0YsRUFBQztFQUNGLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFRO0VBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBQztFQUNqQyxPQUFPLFVBQVU7Q0FDbEI7O0FBRURBLElBQU0sZUFBZSxHQUFHLEdBQUU7QUFDMUIsU0FBUyxnQkFBZ0IsRUFBRSxFQUFFLEVBQUU7RUFDN0IsT0FBTyxlQUFlLENBQUMsRUFBRSxDQUFDO0NBQzNCOztBQUVELFNBQVMscUJBQXFCLEVBQUUsRUFBRSxFQUFFLE9BQVksRUFBRSxJQUFJLEVBQUU7bUNBQWIsR0FBRzs7RUFDNUNBLElBQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUM7RUFDMUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUM7O0VBRW5CQSxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLE1BQUs7RUFDOUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVU7RUFDaENBLElBQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFDO0VBQ3RELElBQUksQ0FBQyxTQUFTLEVBQUU7SUFDZCxPQUFPLElBQUksS0FBSyw0Q0FBd0MsVUFBVSxVQUFLO0dBQ3hFO0VBQ0QsS0FBSyxDQUFDLEVBQUUsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFDOzs7RUFHbkNBLElBQU1TLFdBQVEsR0FBRyxjQUFjLENBQUMsRUFBRSxFQUFFO1VBQ2xDLElBQUk7SUFDSixNQUFNLEVBQUUsT0FBTztJQUNmLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO0lBQ25CLFNBQVMsRUFBRSxVQUFVO2dCQUNyQixVQUFVO0dBQ1gsRUFBRSxhQUFhLEVBQUM7RUFDakIsTUFBTSxDQUFDLE1BQU0sQ0FBQ0EsV0FBUSxFQUFDOzs7RUFHdkJULElBQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFDO0VBQzFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFUyxXQUFRLEVBQUU7VUFDdEMsSUFBSTtjQUNKQSxXQUFRO0dBQ1QsRUFBQztFQUNGLE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFDOzs7RUFHN0JULElBQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGNBQWMsRUFBQztFQUN6RCxJQUFJLE9BQU8sU0FBUyxDQUFDLHFCQUFxQixLQUFLLFVBQVUsRUFBRTtJQUN6RCxNQUFNLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMscUJBQXFCLENBQUMsRUFBRSxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsRUFBQztHQUMxRjtFQUNELE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFDO0VBQzlCLE9BQU8sZUFBZTtDQUN2Qjs7Ozs7Ozs7OztBQVVELFNBQVMsY0FBYyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtFQUMvQyxJQUFJLGVBQWUsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUN2QixPQUFPLElBQUksS0FBSyx5QkFBcUIsRUFBRSxnQ0FBMkI7R0FDbkU7OztFQUdEQSxJQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFDO0VBQ3RDLGVBQWUsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFVOzs7RUFHaEMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLEVBQUM7RUFDakQsTUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUMsRUFBQztFQUNuRSxNQUFNLENBQUMsVUFBVSxHQUFHLFdBQVU7O0VBRTlCQSxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBQztFQUN0RCxJQUFJLENBQUMsU0FBUyxFQUFFO0lBQ2QsT0FBTyxJQUFJLEtBQUssNENBQXdDLFVBQVUsVUFBSztHQUN4RTtFQUNELElBQUksVUFBVSxLQUFLLE1BQU0sRUFBRTtJQUN6QixPQUFPLENBQUMsS0FBSyxDQUFDLHdDQUF3QztRQUNsRCx1REFBdUQ7UUFDdkQscURBQXFEO1FBQ3JELHFFQUFtRTtRQUNuRSxxQ0FBcUMsRUFBQztHQUMzQzs7RUFFREEsSUFBTSxlQUFlLEdBQUcscUJBQXFCLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUM7RUFDL0QsSUFBSSxPQUFPLFNBQVMsQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFOzs7SUFHbEQsSUFBSSxVQUFVLEtBQUssS0FBSyxJQUFJLFVBQVUsS0FBSyxNQUFNLEVBQUU7TUFDakRBLElBQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDdkMsTUFBTTtRQUNOLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ25CLFNBQVMsRUFBRSxVQUFVO09BQ3RCLEVBQUUsZUFBZSxFQUFDO01BQ25CLE9BQU8sU0FBUyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsa0JBQWtCLENBQUM7S0FDNUU7SUFDRCxPQUFPLFNBQVMsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQztHQUN6RTs7RUFFRCxZQUFZLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBQztDQUNwQzs7Ozs7OztBQU9ELFNBQVMsWUFBWSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7RUFDcENBLElBQU0sSUFBSSxHQUFHLEdBQUU7RUFDZkEsSUFBTSxJQUFJLEdBQUcsR0FBRTtFQUNmLEtBQUtBLElBQU0sR0FBRyxJQUFJLE9BQU8sRUFBRTtJQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQztJQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0dBQ3hCOztFQUVEQSxJQUFNLE1BQU0sR0FBRyx1Q0FFVCxJQUFJLHVDQUVUOztFQUVELE9BQU8sQ0FBQyxvQ0FBSSxRQUFRLG1CQUFJLElBQUksR0FBRSxPQUFNLElBQUMsT0FBQyxDQUFDLFFBQUcsSUFBSSxDQUFDO0NBQ2hEOzs7Ozs7QUFNRCxTQUFTLE9BQU8sRUFBRSxVQUFVLEVBQUU7RUFDNUJBLElBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUM7RUFDbkMsSUFBSTtJQUNGLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUU7TUFDN0IsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtLQUM5QjtHQUNGO0VBQ0QsT0FBTyxDQUFDLEVBQUU7SUFDUixPQUFPLENBQUMsS0FBSyxDQUFDLG9EQUFvRCxFQUFDO0lBQ25FLE1BQU07R0FDUDtDQUNGOztBQUVEQSxJQUFNLE9BQU8sR0FBRztrQkFDZCxjQUFjO3lCQUNkLHFCQUFxQjtXQUNyQixPQUFPO0VBQ1AsV0FBVyxFQUFFLE1BQU07RUFDbkIsZUFBZSxFQUFFLFFBQVE7RUFDekIsaUJBQWlCLEVBQUUsVUFBVTtFQUM3Qix1QkFBTSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUU7SUFDakJBLElBQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsRUFBQztJQUNsRCxJQUFJLFNBQVMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxZQUFZLEtBQUssVUFBVSxFQUFFO01BQzdELE9BQU8sU0FBUyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDO0tBQ3pDO0lBQ0QsT0FBTyxZQUFZLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQztHQUMvQjtFQUNGOzs7Ozs7QUFNRCxTQUFTLFdBQVcsRUFBRSxVQUFVLEVBQUU7RUFDaEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLFlBQW1COzs7O0lBQ3ZDQSxJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFDO0lBQ2xCQSxJQUFNLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUM7SUFDakMsSUFBSSxJQUFJLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO01BQzVCQSxJQUFNLE1BQU0sVUFBRyxVQUFVLENBQUMsSUFBSSxHQUFFLFVBQVUsT0FBQyxDQUFDLEtBQUcsSUFBSSxFQUFDO01BQ3BEQSxJQUFNLElBQUksR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFJLEdBQUU7OztNQUdoQyxJQUFJLFVBQVUsS0FBSyxpQkFBaUIsRUFBRTtRQUNwQyxRQUFRLENBQUMsT0FBTyxXQUFDLFNBQVE7VUFDdkJBLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBTztVQUN2QyxJQUFJLE9BQU8sRUFBRTtZQUNYLE9BQU8sQ0FBQyxFQUFFLEVBQUUsUUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxFQUFDO1dBQzlDO1NBQ0YsRUFBQztPQUNIO1dBQ0ksSUFBSSxVQUFVLEtBQUssaUJBQWlCLEVBQUU7UUFDekMsUUFBUSxDQUFDLE9BQU8sV0FBQyxTQUFRO1VBQ3ZCQSxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQU87VUFDdkMsSUFBSSxPQUFPLEVBQUU7WUFDWCxPQUFPLENBQUMsRUFBRSxFQUFFLFFBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsRUFBQztXQUM5QztTQUNGLEVBQUM7UUFDRixPQUFPLGVBQWUsQ0FBQyxFQUFFLEVBQUM7T0FDM0I7O01BRUQsT0FBTyxNQUFNO0tBQ2Q7SUFDRCxPQUFPLElBQUksS0FBSyxDQUFDLDJDQUEyQztRQUN4RCxPQUFJLEVBQUUsd0JBQWtCLFVBQVUsTUFBRztZQUFDO0lBQzNDO0NBQ0Y7Ozs7Ozs7QUFPRCxTQUFTLFdBQVcsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFO0VBQzlDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxZQUFtQjs7OztJQUN2QyxJQUFJLE9BQU8sWUFBWSxLQUFLLFVBQVUsRUFBRTtNQUN0QyxrQkFBWSxDQUFDLFFBQUcsSUFBSSxFQUFDO0tBQ3RCOzs7SUFHRCxLQUFLQSxJQUFNLElBQUksSUFBSSxhQUFhLENBQUMsVUFBVSxFQUFFO01BQzNDQSxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsVUFBVSxDQUFDLElBQUksRUFBQztNQUNoRCxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFDdEMsU0FBUyxDQUFDLFVBQVUsT0FBQyxDQUFDLFdBQUcsSUFBSSxFQUFDO09BQy9CO0tBQ0Y7SUFDRjtDQUNGOztBQUVELEFBQWUsU0FBU08sT0FBSSxFQUFFLE1BQU0sRUFBRTtFQUNwQyxhQUFhLEdBQUcsTUFBTSxJQUFJLEdBQUU7RUFDNUIsVUFBVSxHQUFHLGFBQWEsQ0FBQyxVQUFVLElBQUksR0FBRTtFQUMzQ0csTUFBZSxHQUFFOzs7OztFQUtqQixLQUFLVixJQUFNLElBQUksSUFBSSxVQUFVLEVBQUU7SUFDN0JBLElBQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUM7SUFDbEMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFO01BQ3hDLElBQUk7UUFDRixTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBQztPQUN2QjtNQUNELE9BQU8sQ0FBQyxFQUFFLEVBQUU7S0FDYjtHQUNGOztFQUVELFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBQztFQUNyRCxXQUFXLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxFQUFDO0VBQy9DLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQzs7R0FFN0IsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBQzs7RUFFN0QsT0FBTyxPQUFPO0NBQ2Y7O0FDMVREOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFJQUEsSUFBTSxNQUFNLEdBQUc7WUFDYixRQUFRLFdBQUUsT0FBTyxXQUFFLE9BQU8sWUFBRSxRQUFRO2NBQ3BDLFVBQVU7RUFDViw2QkFBUyxJQUFXOzs7O0lBQ2xCLElBQUksT0FBTyxVQUFVLEtBQUssVUFBVSxFQUFFO01BQ3BDLE9BQU8sZ0JBQVUsQ0FBQyxRQUFHLElBQUksQ0FBQztLQUMzQjtJQUNELE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxpQkFBUSxFQUFLLENBQUMsT0FBQyxDQUFDLFFBQUcsSUFBSSxDQUFDO0dBQ2xEO0VBQ0Y7O0FBRUQsUUFBUSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsU0FBUzs7QUNsQ25DOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBO0FBS0EsU0FBUyxlQUFlLElBQUk7O0VBRTFCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBQztFQUM3QixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUM7RUFDOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBQzs7RUFFeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBQztFQUN2QyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFDO0NBQ3pDOztBQUVELGNBQWU7RUFDYixPQUFPLEVBQUUsWUFBRSxRQUFRLGNBQUUsVUFBVSxPQUFFLEdBQUcsRUFBRTttQkFDdEMsZUFBZTtRQUNmTyxPQUFJO1VBQ0osTUFBTTtDQUNQOztBQ3ZDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxBQUFPLFNBQVMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFTLEVBQUU7NkJBQVAsR0FBRzs7RUFDekMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksVUFBUzs7RUFFN0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUk7RUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLEdBQUU7RUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUk7RUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEdBQUU7OztFQUc3QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUk7RUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFFO0NBQzVCOztBQ3ZDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJBLEFBRUFQLElBQU0sUUFBUSxHQUFHLEdBQUU7QUFDbkJBLElBQU0sU0FBUyxHQUFHLEdBQUU7Ozs7Ozs7QUFPcEIsU0FBUyxnQkFBZ0IsSUFBSSxFQUFFOzs7Ozs7QUFNL0IsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxVQUFVLE9BQU8sRUFBRTs7O0VBQzFELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtJQUNoQixNQUFNLElBQUksS0FBSywyQkFBc0IsSUFBSSxDQUFDLEtBQUksb0JBQWU7R0FDOUQ7O0VBRURBLElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0VBQ3ZDLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7SUFDckMsS0FBS0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO01BQzNDQyxJQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsQ0FBQyxFQUFDOztNQUU3QixJQUFJLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxLQUFLTSxNQUFJLElBQUUsVUFBUTs7TUFFL0MsSUFBSSxPQUFPLE1BQU0sQ0FBQyxTQUFTLEtBQUssVUFBVSxFQUFFO1FBQzFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxZQUFZLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUM7T0FDakU7S0FDRjtHQUNGO0VBQ0Y7Ozs7O0FBS0QsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxZQUFZOzs7RUFDN0MsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0lBQ2hCLE1BQU07R0FDUDs7RUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUk7OztFQUduQixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDdkJOLElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxXQUFDLEdBQUUsU0FBRyxDQUFDLEtBQUtNLFNBQUksRUFBQztJQUMvRCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7TUFDdEIsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFXO0tBQ2xDO1NBQ0k7TUFDSCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0tBQzNCO0dBQ0Y7RUFDRjs7QUFFRCx5QkFBZTtFQUNiLE1BQU0sWUFBRyxFQUFFLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRTtJQUN4QixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRTtJQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLGdCQUFnQixLQUFLLFVBQVUsRUFBRTtNQUNqRCxPQUFPLEVBQUU7S0FDVjtJQUNETixJQUFNLGFBQWEsR0FBRzs7Ozs7O01BTXBCLGdCQUFnQixFQUFFLFVBQVUsSUFBSSxFQUFFOztRQUVoQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUU7VUFDbEMsWUFBWSxFQUFFLEtBQUs7VUFDbkIsVUFBVSxFQUFFLElBQUk7VUFDaEIsUUFBUSxFQUFFLEtBQUs7VUFDZixLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNwQixFQUFDOztRQUVGLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBSztRQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUk7O1FBRXJCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1VBQ3hCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRTtTQUN6QjtRQUNELFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztRQUM5QixTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztPQUN6QjtNQUNGO0lBQ0QsYUFBYSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFTO0lBQ3JFLE9BQU87TUFDTCxRQUFRLEVBQUUsYUFBYTtLQUN4QjtHQUNGO0VBQ0QsT0FBTyxZQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUU7SUFDakIsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sV0FBQyxTQUFRLFNBQUcsT0FBTyxDQUFDLEtBQUssS0FBRSxFQUFDO0lBQ2pELE9BQU8sU0FBUyxDQUFDLEVBQUUsRUFBQztHQUNyQjtDQUNGOztBQzVIRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLEFBRUEsaUJBQWU7b0JBQ2JXLGtCQUFnQjtDQUNqQjs7QUN0QkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkE7Ozs7O0FBU0EsQUFBZSxnQkFBVSxVQUFVLEVBQUU7RUFDbkMsSUFBUTtNQUFNLE1BQU0sa0JBQVk7RUFDaEMsTUFBTSxDQUFDLFVBQVUsR0FBRyxXQUFVO0VBQzlCLElBQVE7TUFBUSxXQUFXLDBCQUFlOztFQUUxQyxLQUFLWCxJQUFNLFdBQVcsSUFBSVMsVUFBUSxFQUFFO0lBQ2xDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRUEsVUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFDO0dBQzdEOztFQUVELE9BQU8sQ0FBQyxlQUFlLEdBQUU7OztFQUd6QixNQUFNLENBQUMsZ0JBQWdCLEdBQUcsT0FBTTtFQUNoQyxNQUFNLENBQUMsa0JBQWtCLEdBQUcsWUFBVzs7O0VBR3ZDVCxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFDOzs7cUNBR007SUFDdEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxlQUFhOzs7O01BQzdCQSxJQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsVUFBVSxPQUFDLENBQUMsZUFBRyxJQUFJLEVBQUM7TUFDOUMsSUFBSSxHQUFHLFlBQVksS0FBSyxFQUFFO1FBQ3hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFDO09BQzlCO01BQ0QsT0FBTyxHQUFHO01BQ1g7OztFQVBILEtBQUtBLElBQU0sVUFBVSxJQUFJLGFBQWEscUJBUXJDO0NBQ0Y7O0FDeEREOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTZCQSxBQUFPLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtFQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLDhEQUE4RCxFQUFDO0VBQzVFQSxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQztFQUMxQixJQUFJLElBQUksRUFBRTtJQUNSLE9BQU8sSUFBSSxDQUFDLEVBQUU7R0FDZjtDQUNGOzs7Ozs7OztBQVFELEFBQU8sU0FBUyxHQUFHLEVBQUUsRUFBRSxFQUFFO0VBQ3ZCQSxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQztFQUMxQixJQUFJLElBQUksRUFBRTtJQUNSLE9BQU8sSUFBSSxDQUFDLEVBQUU7R0FDZjtDQUNGOzs7Ozs7OztBQVFELEFBQU8sU0FBUyxHQUFHLEVBQUUsRUFBRSxFQUFFO0VBQ3ZCQSxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQztFQUMxQixJQUFJLElBQUksRUFBRTtJQUNSLE9BQU8sSUFBSSxDQUFDLEVBQUU7R0FDZjtDQUNGOzs7Ozs7O0FBT0QsQUFBTyxTQUFTLFdBQVcsRUFBRSxFQUFFLEVBQUU7RUFDL0JBLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFJO0VBQ3JCQSxJQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTTtFQUN6QixPQUFPLE1BQU0sQ0FBQyxJQUFJLGFBQUk7SUFDcEIsRUFBRSxHQUFFO0dBQ0wsQ0FBQztDQUNIOzs7Ozs7OztBQVFELEFBQU8sU0FBUyxTQUFTLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRTtFQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLDZDQUE2QztVQUNsRCwyQ0FBMkM7VUFDM0MsaUNBQWlDLEVBQUM7RUFDMUNBLElBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFDO0VBQ3ZCLElBQUksRUFBRSxFQUFFO0lBQ05BLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBQztJQUMxQyxHQUFHLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUM7R0FDaEQ7Q0FDRjs7Ozs7Ozs7Ozs7O0FBWUQsQUFBTyxTQUFTLFdBQVcsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRTs7O0VBQ2xEQSxJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBQztFQUN2QixJQUFJLEVBQUUsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTtJQUNuQ0EsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFDO0lBQ3RELFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLGNBQVk7Ozs7TUFDOUNNLE1BQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUM7TUFDbEMsUUFBUSxJQUFJLGNBQVEsQ0FBQyxRQUFHLElBQUksRUFBQztLQUM5QixFQUFDO0dBQ0g7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkQsQUFBTyxTQUFTLFVBQVUsRUFBRSxRQUFRLEVBQUU7RUFDcENOLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBTztFQUNoQyxJQUFJLE9BQU8sUUFBUSxLQUFLLFVBQVUsRUFBRTtJQUNsQyxPQUFPLENBQUMsSUFBSSxDQUFDLHdFQUF3RTtNQUNuRiwrQ0FBK0MsRUFBQztJQUNsRCxRQUFRLENBQUMsTUFBTSxFQUFDO0dBQ2pCO0VBQ0QsT0FBTyxNQUFNO0NBQ2Q7Ozs7Ozs7O0FBUUQsQUFBTyxTQUFTLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFO0VBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkNBQTZDO1VBQ2xELDhDQUE4QztVQUM5QyxzQ0FBc0MsRUFBQztFQUMvQ0EsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFDO0VBQ2hELE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBQztDQUNsQzs7Ozs7OztBQU9ELEFBQU8sU0FBUyxRQUFRLEVBQUUsR0FBRyxFQUFFO0VBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUMsNENBQTRDO1VBQ2pELDZDQUE2QztVQUM3Qyx3QkFBd0IsRUFBQztFQUNqQ0EsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFDO0VBQzlDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFDO0NBQ25COzs7Ozs7O0FBT0QsQUFBTyxTQUFTLFNBQVMsRUFBRSxLQUFLLEVBQUU7RUFDaEMsT0FBTyxDQUFDLElBQUksQ0FBQyw2Q0FBNkM7VUFDbEQsZ0RBQWdEO1VBQ2hELDJCQUEyQixFQUFDO0VBQ3BDQSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUM7RUFDcEQsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUM7Q0FDekI7Ozs7Ozs7OztBQVNELEFBQU8sU0FBUyxLQUFLLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBVzs7OztFQUN0RCxPQUFPLENBQUMsSUFBSSxDQUFDLHlDQUF5QztJQUNwRCwyREFBMkQsRUFBQztFQUM5REEsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFDO0VBQ2xELElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRTtJQUNoQyxNQUFNLENBQUMsVUFBVSxPQUFDLENBQUMsUUFBRyxJQUFJLEVBQUM7R0FDNUI7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNqTUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QkEsU0FBUyxNQUFNLEVBQUUsTUFBTSxFQUFVOzs7OztFQUUvQixJQUFJLE9BQU8sTUFBTSxDQUFDLE1BQU0sS0FBSyxVQUFVLEVBQUU7SUFDdkMsTUFBTSxDQUFDLFlBQU0sV0FBQyxNQUFNLFdBQUssS0FBRyxFQUFDO0dBQzlCO09BQ0k7SUFDSEEsSUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssR0FBRTtJQUN6QixLQUFLQSxJQUFNLEdBQUcsSUFBSSxLQUFLLEVBQUU7TUFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEVBQUM7S0FDekI7SUFDRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUU7TUFDZCxZQUFNLFdBQUMsTUFBTSxXQUFLLEtBQUcsRUFBQztLQUN2QjtHQUNGO0VBQ0QsT0FBTyxNQUFNO0NBQ2Q7Ozs7Ozs7Ozs7O0FBV0QsU0FBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFO0VBQ3ZDLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtJQUM5QixLQUFLLEVBQUUsR0FBRztJQUNWLFVBQVUsRUFBRSxDQUFDLENBQUMsVUFBVTtJQUN4QixRQUFRLEVBQUUsSUFBSTtJQUNkLFlBQVksRUFBRSxJQUFJO0dBQ25CLEVBQUM7Q0FDSDs7Ozs7Ozs7O0FBU0QsU0FBUyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtFQUMxQixJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUU7SUFDZEEsSUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUM7SUFDL0IsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7TUFDZCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztLQUM1QjtHQUNGO0NBQ0Y7Ozs7Ozs7OztBQVNEQSxJQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWM7QUFDdEQsU0FBUyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUN6QixPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztDQUNyQzs7Ozs7Ozs7OztBQVVELFNBQVMsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUU7RUFDdEIsT0FBTyxVQUFVLENBQUMsRUFBRTtJQUNsQkEsSUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLE9BQU07SUFDMUIsT0FBTyxDQUFDO1FBQ0osQ0FBQyxHQUFHLENBQUM7VUFDSCxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUM7VUFDeEIsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ2pCLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0dBQ2pCO0NBQ0Y7Ozs7Ozs7Ozs7O0FBNkJELFNBQVMsUUFBUSxFQUFFLEdBQUcsRUFBRTtFQUN0QixPQUFPLEdBQUcsS0FBSyxJQUFJLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtDQUMvQzs7Ozs7Ozs7OztBQVVEQSxJQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVE7QUFDMUNBLElBQU0sYUFBYSxHQUFHLGtCQUFpQjtBQUN2QyxTQUFTLGFBQWEsRUFBRSxHQUFHLEVBQUU7RUFDM0IsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLGFBQWE7Q0FDNUM7O0FDdEpEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7Ozs7Ozs7QUFrQkEsQUFBTyxTQUFTLFVBQVUsRUFBRSxHQUFHLEVBQUU7RUFDL0JBLElBQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQyxFQUFDO0VBQ2xDLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSTtDQUNoQzs7O0FBR0QsQUFBT0EsSUFBTSxRQUFRLEdBQUcsV0FBVyxJQUFJLEdBQUU7O0FBRXpDRCxJQUFJLEtBQUk7O0FBRVIsSUFBSSxPQUFPLEdBQUcsS0FBSyxXQUFXLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRTs7RUFFckUsSUFBSSxHQUFHLElBQUc7Q0FDWDtLQUNJOztFQUVILElBQUksR0FBRyxZQUFZO0lBQ2pCLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUM7SUFDL0I7RUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxVQUFVLEdBQUcsRUFBRTtJQUNsQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUztJQUNuQztFQUNELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLFVBQVUsR0FBRyxFQUFFO0lBQ2xDLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO01BQ2hDLE1BQU07S0FDUDtJQUNELElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBQztJQUNsQjtFQUNELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFlBQVk7SUFDakMsSUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBQztJQUMvQjtDQUNGOztBQUVEOzs7OztBQU9BLEFBQU8sU0FBUyxZQUFZLElBQUk7OztFQUc5QixJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFBRTtJQUNqQyxPQUFPLFNBQVMsQ0FBQyxNQUFNLEVBQUU7R0FDMUI7O0VBRUQsT0FBTyxJQUFJLElBQUksRUFBRTtDQUNsQjs7Ozs7Ozs7O0FBU0QsQUFNQzs7QUFZQzs7QUFFRixBQWdCRTs7QUFFRixBQUFPLFNBQVNhLE9BQUssRUFBRSxDQUFDLEVBQUU7RUFDeEJaLElBQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7RUFDM0MsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRTtDQUNsRDs7OztBQUlEQSxJQUFNLGtCQUFrQixHQUFHLHFCQUFvQjtBQUMvQ0EsSUFBTSxlQUFlLEdBQUcsa0JBQWlCO0FBQ3pDQSxJQUFNLGlCQUFpQixHQUFHLGFBQVk7QUFDdENBLElBQU0sYUFBYSxHQUFHLFFBQU87O0FBRTdCLEFBQU9BLElBQU0sZUFBZSxhQUFHLE1BQUssU0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsS0FBQztBQUN2RSxBQUFPQSxJQUFNLFlBQVksYUFBRyxNQUFLLFNBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxLQUFDO0FBQ2pFLEFBQU9BLElBQU0sY0FBYyxhQUFHLE1BQUssU0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsS0FBQztBQUNyRSxBQUFPQSxJQUFNLFdBQVcsYUFBRyxNQUFLLFNBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxLQUFDOztBQUV6RyxBQUFPLFNBQVMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO0VBQ3JDQSxJQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFDO0VBQy9FLE9BQU8sTUFBTTtDQUNkOztBQUVELEFBQU8sU0FBUyxjQUFjLEVBQUUsR0FBRyxFQUFFO0VBQ25DLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO0NBQ3RDOztBQzNKRDs7O0FBR0EsQUFFQUQsSUFBSWMsS0FBRyxHQUFHLEVBQUM7Ozs7Ozs7OztBQVNYLEFBQWUsU0FBUyxHQUFHLElBQUk7RUFDN0IsSUFBSSxDQUFDLEVBQUUsR0FBR0EsS0FBRyxHQUFFO0VBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFFO0NBQ2Y7Ozs7O0FBS0QsR0FBRyxDQUFDLE1BQU0sR0FBRyxLQUFJO0FBQ2pCZCxJQUFJLFdBQVcsR0FBRyxHQUFFOztBQUVwQixBQUFPLFNBQVMsVUFBVSxFQUFFLE9BQU8sRUFBRTtFQUNuQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxJQUFDO0VBQzVDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsUUFBTztDQUNyQjs7QUFFRCxBQUFPLFNBQVMsU0FBUyxJQUFJO0VBQzNCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLEdBQUcsR0FBRTtDQUMvQjs7QUFFRCxBQUFPLFNBQVMsV0FBVyxJQUFJO0VBQzdCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsS0FBSTtFQUNqQixXQUFXLEdBQUcsR0FBRTtDQUNqQjs7Ozs7Ozs7QUFRRCxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxVQUFVLEdBQUcsRUFBRTtFQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUM7RUFDcEI7Ozs7Ozs7O0FBUUQsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxHQUFHLEVBQUU7RUFDdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFDO0VBQ3ZCOzs7Ozs7QUFNRCxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZO0VBQ2pDLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRTtJQUNkLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBQztHQUN4QjtFQUNGOzs7Ozs7QUFNRCxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZOztFQUVqQ0MsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUU7RUFDOUIsS0FBS0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDM0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRTtHQUNqQjtDQUNGOztBQy9FRDs7O0FBR0E7QUFFQSxBQVFBQSxJQUFJLEdBQUcsR0FBRyxFQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JYLEFBQWUsU0FBUyxPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFOztFQUV6RCxJQUFJLE9BQU8sRUFBRTtJQUNYLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFDO0dBQ3RCO0VBQ0RDLElBQU0sSUFBSSxHQUFHLE9BQU8sT0FBTyxLQUFLLFdBQVU7RUFDMUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFFO0VBQ1osRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0VBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBTztFQUN6QixJQUFJLENBQUMsRUFBRSxHQUFHLEdBQUU7RUFDWixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBRztFQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSTtFQUNsQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFJO0VBQ3RCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRTtFQUNkLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRTtFQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLFlBQVksR0FBRTtFQUM1QixJQUFJLENBQUMsU0FBUyxHQUFHLFlBQVksR0FBRTs7RUFFL0IsSUFBSSxJQUFJLEVBQUU7SUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLFFBQU87R0FDdEI7RUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJO01BQ2xCLFNBQVM7TUFDVCxJQUFJLENBQUMsR0FBRyxHQUFFOzs7RUFHZCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBSztDQUNuQzs7Ozs7O0FBTUQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsWUFBWTtFQUNsQyxVQUFVLENBQUMsSUFBSSxFQUFDO0VBQ2hCQSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUM7OztFQUdoRCxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7SUFDYixRQUFRLENBQUMsS0FBSyxFQUFDO0dBQ2hCO0VBQ0QsU0FBUyxHQUFFO0VBQ1gsSUFBSSxDQUFDLFdBQVcsR0FBRTtFQUNsQixPQUFPLEtBQUs7RUFDYjs7Ozs7Ozs7QUFRRCxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxVQUFVLEdBQUcsRUFBRTtFQUN4Q0EsSUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUU7RUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBQzNCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBQztJQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUM7SUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO01BQ3hCLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFDO0tBQ2pCO0dBQ0Y7RUFDRjs7Ozs7O0FBTUQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsWUFBWTs7O0VBQzFDRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU07RUFDeEIsT0FBTyxDQUFDLEVBQUUsRUFBRTtJQUNWQyxJQUFNLEdBQUcsR0FBR00sTUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7SUFDeEIsSUFBSSxDQUFDQSxNQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7TUFDL0IsR0FBRyxDQUFDLFNBQVMsQ0FBQ0EsTUFBSSxFQUFDO0tBQ3BCO0dBQ0Y7RUFDRFAsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU07RUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBUztFQUM1QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUc7RUFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUU7RUFDdEIsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFJO0VBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBTztFQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUc7RUFDbEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsRUFBQztFQUN4Qjs7Ozs7Ozs7O0FBU0QsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBVSxPQUFPLEVBQUU7RUFDNUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFJO0dBQ2xCLE1BQU07SUFDTCxJQUFJLENBQUMsR0FBRyxHQUFFO0dBQ1g7Ozs7Ozs7Ozs7Ozs7O0VBY0Y7Ozs7Ozs7QUFPRCxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxZQUFZO0VBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtJQUNmQyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFFO0lBQ3hCO01BQ0UsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLOzs7OztPQUtuQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztNQUNqRDs7TUFFQUEsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQUs7TUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFLO01BQ2xCLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBQztLQUN2QztJQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFLO0dBQ25DO0VBQ0Y7Ozs7Ozs7QUFPRCxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxZQUFZO0VBQ3ZDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRTtFQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQUs7RUFDbkI7Ozs7OztBQU1ELE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVk7OztFQUNyQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFNO0VBQ3hCLE9BQU8sQ0FBQyxFQUFFLEVBQUU7SUFDVk8sTUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUU7R0FDdEI7RUFDRjs7Ozs7O0FBTUQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsWUFBWTs7O0VBQ3ZDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTs7Ozs7SUFLZixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFO01BQ3hELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUM7S0FDaEM7SUFDRFAsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFNO0lBQ3hCLE9BQU8sQ0FBQyxFQUFFLEVBQUU7TUFDVk8sTUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUNBLE1BQUksRUFBQztLQUM3QjtJQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBSztJQUNuQixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFJO0dBQ3RDO0VBQ0Y7Ozs7Ozs7Ozs7O0FBV0ROLElBQU0sV0FBVyxHQUFHLFlBQVksR0FBRTs7QUFFbEMsU0FBUyxRQUFRLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtFQUM1QkQsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFHO0VBQ3JCLElBQUksQ0FBQyxJQUFJLEVBQUU7SUFDVCxJQUFJLEdBQUcsWUFBVztJQUNsQixJQUFJLENBQUMsS0FBSyxHQUFFO0dBQ2I7RUFDRCxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUM7RUFDeEIsR0FBRyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUM7RUFDbkIsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFO0lBQ2QsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFO01BQ2RDLElBQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUU7TUFDL0IsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ25CLE1BQU07T0FDUCxNQUFNO1FBQ0wsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUM7T0FDaEI7S0FDRjtJQUNELElBQUksR0FBRyxFQUFFO01BQ1AsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxPQUFNO01BQ2QsT0FBTyxDQUFDLEVBQUUsSUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksSUFBQztLQUNuQyxNQUFNLElBQUksR0FBRyxFQUFFO01BQ2QsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFDO01BQ3ZCLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTTtNQUNmLE9BQU8sQ0FBQyxFQUFFLElBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLElBQUM7S0FDekM7R0FDRjtDQUNGOztBQzdQRDs7O0FBR0EsQUFFQUEsSUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVM7QUFDbEMsQUFBT0EsSUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FNcEQ7RUFDQyxNQUFNO0VBQ04sS0FBSztFQUNMLE9BQU87RUFDUCxTQUFTO0VBQ1QsUUFBUTtFQUNSLE1BQU07RUFDTixTQUFTO0NBQ1Y7Q0FDQSxPQUFPLENBQUMsVUFBVSxNQUFNLEVBQUU7O0VBRXpCQSxJQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFDO0VBQ25DLEdBQUcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsT0FBTyxJQUFJOzs7OztJQUc1Q0QsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLE9BQU07SUFDeEJDLElBQU0sSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBQztJQUN6QixPQUFPLENBQUMsRUFBRSxFQUFFO01BQ1YsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHYyxXQUFTLENBQUMsQ0FBQyxFQUFDO0tBQ3ZCO0lBQ0RkLElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBQztJQUN6Q0EsSUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU07SUFDdEJELElBQUksU0FBUTtJQUNaLFFBQVEsTUFBTTtNQUNaLEtBQUssTUFBTTtRQUNULFFBQVEsR0FBRyxLQUFJO1FBQ2YsS0FBSztNQUNQLEtBQUssU0FBUztRQUNaLFFBQVEsR0FBRyxLQUFJO1FBQ2YsS0FBSztNQUNQLEtBQUssUUFBUTtRQUNYLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQztRQUN4QixLQUFLO0tBQ1I7SUFDRCxJQUFJLFFBQVEsSUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsSUFBQzs7SUFFdkMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUU7SUFDZixPQUFPLE1BQU07R0FDZCxFQUFDO0NBQ0gsRUFBQzs7Ozs7Ozs7Ozs7QUFXRixHQUFHO0VBQ0QsVUFBVTtFQUNWLE1BQU07RUFDTixTQUFTLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFO0lBQ3pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0VBQThEO1FBQ3ZFLDBDQUEwQyxFQUFDO0lBQy9DLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7TUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLEdBQUcsRUFBQztLQUN4QjtJQUNELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUNyQztFQUNGOzs7Ozs7Ozs7QUFTRCxHQUFHO0VBQ0QsVUFBVTtFQUNWLFNBQVM7RUFDVCxTQUFTLE9BQU8sRUFBRSxLQUFLLEVBQUU7SUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxtRUFBaUU7UUFDMUUsMENBQTBDLEVBQUM7O0lBRS9DLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFFLFFBQU07O0lBRXhCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO01BQzdCLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQztLQUM1Qjs7SUFFRCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTtNQUNkLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBQztLQUN0QjtHQUNGO0NBQ0Y7O0FDbkdEOzs7QUFHQSxBQVlBQyxJQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsWUFBWSxFQUFDOzs7Ozs7Ozs7Ozs7QUFZMUQsQUFBTyxTQUFTLFFBQVEsRUFBRSxLQUFLLEVBQUU7RUFDL0IsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFLO0VBQ2xCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUU7RUFDcEIsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDO0VBQzFCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUN4QkEsSUFBTSxPQUFPLEdBQUcsUUFBUTtRQUNwQixZQUFZO1FBQ1osWUFBVztJQUNmLE9BQU8sQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBQztJQUN2QyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBQztHQUN6QixNQUFNO0lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7R0FDakI7Q0FDRjs7Ozs7Ozs7Ozs7O0FBWUQsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxHQUFHLEVBQUU7OztFQUN2QyxLQUFLRCxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUU7SUFDbkJPLE1BQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBQztHQUM1QjtFQUNGOzs7Ozs7OztBQVFELFFBQVEsQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLFVBQVUsS0FBSyxFQUFFO0VBQ2pELEtBQUtQLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzVDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUM7R0FDbEI7RUFDRjs7Ozs7Ozs7OztBQVVELFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLFVBQVUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUMvQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFDO0VBQ3JDOzs7Ozs7Ozs7OztBQVdELFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsRUFBRSxFQUFFO0VBQ3ZDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUM7RUFDdkM7Ozs7Ozs7Ozs7QUFVRCxRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxVQUFVLEVBQUUsRUFBRTtFQUMxQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUM7RUFDckI7Ozs7Ozs7Ozs7OztBQVlELFNBQVMsWUFBWSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7O0VBRWxDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsSUFBRzs7Q0FFdkI7Ozs7Ozs7Ozs7O0FBV0QsU0FBUyxXQUFXLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUU7RUFDdkMsS0FBS0EsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDM0NDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUM7SUFDbkIsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0dBQzNCO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7QUFhRCxBQUFPLFNBQVMsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7RUFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNwQixNQUFNO0dBQ1A7RUFDREQsSUFBSSxHQUFFO0VBQ04sSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLFlBQVksUUFBUSxFQUFFO0lBQy9ELEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTTtHQUNsQixNQUFNO0lBQ0wsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUM7SUFDN0MsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDMUIsQ0FBQyxLQUFLLENBQUMsTUFBTTtJQUNiO0lBQ0EsRUFBRSxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssRUFBQztHQUN6QjtFQUNELElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtJQUNaLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFDO0dBQ2I7RUFDRCxPQUFPLEVBQUU7Q0FDVjs7Ozs7Ozs7OztBQVVELEFBQU8sU0FBUyxjQUFjLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7RUFDN0NDLElBQU0sR0FBRyxHQUFHLElBQUksR0FBRyxHQUFFOztFQUVyQkEsSUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUM7RUFDMUQsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyxLQUFLLEVBQUU7SUFDL0MsTUFBTTtHQUNQOzs7RUFHREEsSUFBTSxNQUFNLEdBQUcsUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFHO0VBQ3ZDQSxJQUFNLE1BQU0sR0FBRyxRQUFRLElBQUksUUFBUSxDQUFDLElBQUc7O0VBRXZDRCxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFDO0VBQzFCLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtJQUM5QixVQUFVLEVBQUUsSUFBSTtJQUNoQixZQUFZLEVBQUUsSUFBSTtJQUNsQixHQUFHLEVBQUUsU0FBUyxjQUFjLElBQUk7TUFDOUJDLElBQU0sS0FBSyxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUc7TUFDN0MsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFO1FBQ2QsR0FBRyxDQUFDLE1BQU0sR0FBRTtRQUNaLElBQUksT0FBTyxFQUFFO1VBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUU7U0FDckI7UUFDRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7VUFDeEIsS0FBS0QsSUFBSSxZQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQy9DLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFDO1lBQ1osQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFFO1dBQ3ZDO1NBQ0Y7T0FDRjtNQUNELE9BQU8sS0FBSztLQUNiO0lBQ0QsR0FBRyxFQUFFLFNBQVMsY0FBYyxFQUFFLE1BQU0sRUFBRTtNQUNwQ0MsSUFBTSxLQUFLLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBRztNQUM3QyxJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUU7UUFDcEIsTUFBTTtPQUNQO01BQ0QsSUFBSSxNQUFNLEVBQUU7UUFDVixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUM7T0FDekIsTUFBTTtRQUNMLEdBQUcsR0FBRyxPQUFNO09BQ2I7TUFDRCxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBQztNQUN6QixHQUFHLENBQUMsTUFBTSxHQUFFO0tBQ2I7R0FDRixFQUFDO0NBQ0g7Ozs7Ozs7Ozs7Ozs7O0FBY0QsQUFBTyxTQUFTLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUNsQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDdEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO0dBQy9CO0VBQ0QsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0lBQ3BCLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFHO0lBQ2QsTUFBTTtHQUNQO0VBQ0QsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFO0lBQ2QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBQztJQUN4QixNQUFNO0dBQ1A7RUFDREEsSUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLE9BQU07RUFDckIsSUFBSSxDQUFDLEVBQUUsRUFBRTtJQUNQLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFHO0lBQ2QsTUFBTTtHQUNQO0VBQ0QsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFDO0VBQ3BCLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFFO0VBQ2YsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFO0lBQ1ZELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTTtJQUNyQixPQUFPLENBQUMsRUFBRSxFQUFFO01BQ1ZDLElBQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDO01BQ3BCLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFDOztLQUVmO0dBQ0Y7RUFDRCxPQUFPLEdBQUc7Q0FDWDs7Ozs7Ozs7OztBQVVELEFBQU8sU0FBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUM3QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtJQUNyQixNQUFNO0dBQ1A7RUFDRCxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUM7RUFDZkEsSUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLE9BQU07O0VBRXJCLElBQUksQ0FBQyxFQUFFLEVBQUU7SUFDUCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUU7TUFDZCxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFDOztLQUV0QjtJQUNELE1BQU07R0FDUDtFQUNELEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFFO0VBQ2YsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFO0lBQ1ZELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTTtJQUNyQixPQUFPLENBQUMsRUFBRSxFQUFFO01BQ1ZDLElBQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDO01BQ3BCLE9BQU8sQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFDOztLQUVqQjtHQUNGO0NBQ0Y7O0FBRURBLElBQU0sU0FBUyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUM7QUFDaEQsQUFBTyxTQUFTLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFO0VBQzlCLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtJQUNuRCxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUU7TUFDN0IsWUFBWSxFQUFFLElBQUk7TUFDbEIsVUFBVSxFQUFFLElBQUk7TUFDaEIsR0FBRyxFQUFFLFNBQVMsV0FBVyxJQUFJO1FBQzNCLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7T0FDckI7TUFDRCxHQUFHLEVBQUUsU0FBUyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBQzlCLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBRztPQUNwQjtLQUNGLEVBQUM7R0FDSDtDQUNGOzs7QUFHRCxBQUFPLFNBQVMsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUU7RUFDaEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtJQUNwQixPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUM7R0FDZjtDQUNGOztBQ2xVRDs7O0FBR0EsQUFZTyxTQUFTLFNBQVMsRUFBRSxFQUFFLEVBQUU7RUFDN0IsRUFBRSxDQUFDLFNBQVMsR0FBRyxHQUFFO0VBQ2pCLFFBQVEsQ0FBQyxFQUFFLEVBQUM7RUFDWixZQUFZLENBQUMsRUFBRSxFQUFDO0VBQ2hCLFdBQVcsQ0FBQyxFQUFFLEVBQUM7Q0FDaEI7O0FBRUQsQUFBTyxTQUFTLFFBQVEsRUFBRSxFQUFFLEVBQUU7RUFDNUJELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxNQUFLOztFQUVuQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ3hCLElBQUksR0FBRyxHQUFFO0dBQ1Y7O0VBRURDLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0VBQzlCRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTTtFQUNuQixPQUFPLENBQUMsRUFBRSxFQUFFO0lBQ1YsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUM7R0FDbkI7O0VBRUQsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUM7Q0FDbEI7OztBQUdELFNBQVMsSUFBSSxJQUFJO0NBQ2hCOztBQUVELEFBQU8sU0FBUyxZQUFZLEVBQUUsRUFBRSxFQUFFO0VBQ2hDQyxJQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsVUFBUztFQUM3QixJQUFJLFFBQVEsRUFBRTtJQUNaLEtBQUtELElBQUksR0FBRyxJQUFJLFFBQVEsRUFBRTtNQUN4QkMsSUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBQztNQUM3QkEsSUFBTSxHQUFHLEdBQUc7UUFDVixVQUFVLEVBQUUsSUFBSTtRQUNoQixZQUFZLEVBQUUsSUFBSTtRQUNuQjtNQUNELElBQUksT0FBTyxPQUFPLEtBQUssVUFBVSxFQUFFO1FBQ2pDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBQztRQUN6QyxHQUFHLENBQUMsR0FBRyxHQUFHLEtBQUk7T0FDZixNQUFNO1FBQ0wsR0FBRyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRztZQUNqQixPQUFPLENBQUMsS0FBSyxLQUFLLEtBQUs7Y0FDckIsa0JBQWtCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7Y0FDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBQ3ZCLEtBQUk7UUFDUixHQUFHLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztZQUNyQixLQUFJO09BQ1Q7TUFDRCxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFDO0tBQ3BDO0dBQ0Y7Q0FDRjs7QUFFRCxTQUFTLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7RUFDMUNBLElBQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0lBQy9DLElBQUksRUFBRSxJQUFJO0dBQ1gsRUFBQztFQUNGLE9BQU8sU0FBUyxjQUFjLElBQUk7SUFDaEMsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO01BQ2pCLE9BQU8sQ0FBQyxRQUFRLEdBQUU7S0FDbkI7SUFDRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUU7TUFDZCxPQUFPLENBQUMsTUFBTSxHQUFFO0tBQ2pCO0lBQ0QsT0FBTyxPQUFPLENBQUMsS0FBSztHQUNyQjtDQUNGOztBQUVELEFBQU8sU0FBUyxXQUFXLEVBQUUsRUFBRSxFQUFFO0VBQy9CQSxJQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsU0FBUTtFQUMzQixJQUFJLE9BQU8sRUFBRTtJQUNYLEtBQUtELElBQUksR0FBRyxJQUFJLE9BQU8sRUFBRTtNQUN2QixFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBQztLQUN2QjtHQUNGO0NBQ0Y7O0FDM0ZEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CQSxlQUFlO0VBQ2Isa0JBQWtCLEVBQUU7SUFDbEIsSUFBSSxFQUFFLElBQUk7SUFDVixLQUFLLEVBQUUsSUFBSTtJQUNYLFNBQVMsRUFBRSxJQUFJO0lBQ2YsTUFBTSxFQUFFO01BQ04sSUFBSSxFQUFFLFFBQVE7TUFDZCxNQUFNLEVBQUUsTUFBTTtLQUNmO0lBQ0QsSUFBSSxFQUFFO01BQ0osSUFBSSxFQUFFLE1BQU07TUFDWixNQUFNLEVBQUUsTUFBTTtLQUNmO0dBQ0Y7Q0FDRjs7QUNsQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJBLEFBSUEsSUFBUSxrQkFBa0IsK0JBQVc7O0FBRXJDQyxJQUFNLE9BQU8sR0FBRztFQUNkLElBQUksRUFBRSxTQUFTO0VBQ2YsS0FBSyxFQUFFLFVBQVU7RUFDakIsS0FBSyxFQUFFLFVBQVU7RUFDbEI7Ozs7OztBQU1ELEFBQU8sU0FBUywyQkFBMkIsRUFBRSxRQUFRLEVBQUU7RUFDckQsSUFBUSxJQUFJLGlCQUFhO0VBQ3pCQSxJQUFNLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUM7O0VBRXhDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO0lBQy9CLEtBQUtBLElBQU0sR0FBRyxJQUFJLE9BQU8sRUFBRTtNQUN6QixJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDekIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUM7T0FDN0I7V0FDSSxJQUFJWSxPQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssUUFBUTtRQUN4Q0EsT0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtRQUNsQyxLQUFLWixJQUFNLE1BQU0sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7VUFDakMsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxFQUFFO1lBQ2pDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFDO1dBQzdDO1NBQ0Y7T0FDRjtLQUNGO0dBQ0Y7Q0FDRjs7Ozs7QUFLRCxBQUFPLFNBQVMsV0FBVyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFO0VBQzdDZSxPQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBQztFQUM5QixPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFDO0VBQzlCLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQUM7RUFDcEMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBQztFQUNoQyxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFDO0NBQ3BDOzs7Ozs7QUFNRCxBQUFPLFNBQVMsU0FBUyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRTtFQUMxRCxLQUFLLEdBQUcsS0FBSyxJQUFJLEdBQUU7RUFDbkIsUUFBUSxHQUFHLFFBQVEsSUFBSSxHQUFFOztFQUV6QmYsSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFFBQVEsSUFBSSxHQUFFOzs7RUFHcENELElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFLOztFQUV6QixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDeEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLFdBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtNQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSTtNQUNwQixPQUFPLE1BQU07S0FDZCxFQUFFLEVBQUUsRUFBQztHQUNQOztFQUVELFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUM7RUFDeEMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUM7Q0FDNUM7Ozs7O0FBS0QsQUFBTyxTQUFTLHlCQUF5QixFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQVcsRUFBRTtpQ0FBUCxHQUFHOztFQUN2RSxlQUFlLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFDO0VBQzlDLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUM7OztFQUdyQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDbkIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsTUFBSztHQUN4RDtPQUNJO0lBQ0gsTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFLO0dBQ25CO0NBQ0Y7Ozs7O0FBS0QsU0FBUyxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFO0VBQzdDLElBQUksQ0FBQyxNQUFNLEVBQUU7SUFDWCxNQUFNO0dBQ1A7OEJBQ3lCO0lBQ3hCLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO01BQ3hCQyxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxFQUFDO01BQ3pCLElBQUksT0FBTyxLQUFLLEtBQUssVUFBVSxFQUFFO1FBQy9CQSxJQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsRUFBRTtVQUNoRCxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBQztTQUNmLEVBQUM7UUFDRixLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsWUFBVztPQUN6QjtXQUNJO1FBQ0gsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQUs7T0FDbkI7S0FDRjs7O0VBWkgsS0FBS0EsSUFBTSxHQUFHLElBQUksTUFBTSxjQWF2QjtDQUNGOzs7OztBQUtELFNBQVMsVUFBVSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFOzhCQUNaO0lBQ3hCQSxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxFQUFDO0lBQ3pCLElBQUksT0FBTyxLQUFLLEtBQUssVUFBVSxFQUFFO01BQy9CQSxJQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsRUFBRTtRQUNoRCxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7VUFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBQztTQUMvQjtPQUNGLEVBQUM7TUFDRixLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFDO0tBQ3pDO1NBQ0k7TUFDSCxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7UUFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBQztPQUNuQztLQUNGOzs7RUFkSCxLQUFLQSxJQUFNLEdBQUcsSUFBSSxNQUFNLGNBZXZCO0NBQ0Y7Ozs7O0FBS0QsU0FBUyxlQUFlLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUU7RUFDM0NBLElBQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksR0FBRTs7O0VBR2xELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO0lBQ2xCLE1BQU07R0FDUDs7RUFFREEsSUFBTSxTQUFTLEdBQUcsa0JBQWlCO0VBQ25DLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVU7O0VBRXpDLFNBQVMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7SUFDakMsSUFBSVksT0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLE9BQU8sRUFBRTtNQUMzQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBQztLQUNuQjtHQUNGOztFQUVELElBQUksT0FBTyxNQUFNLEtBQUssVUFBVSxFQUFFO0lBQ2hDWixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsRUFBRSxFQUFFLE1BQU0sWUFBRSxHQUFFO01BQ2hDLFlBQVksQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFDO01BQzFCLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUM7S0FDckMsRUFBQztJQUNGLFlBQVksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFDO0lBQzlCLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUM7R0FDekM7T0FDSSxJQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUU7SUFDdkIsWUFBWSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUM7SUFDL0IsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBQztHQUMxQztDQUNGOzs7Ozs7QUFNRCxBQUFPLFNBQVNlLE9BQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUU7RUFDekNmLElBQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFDOztFQUUvQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFO0lBQzNCLEVBQUUsRUFBRTtNQUNGLEtBQUssRUFBRSxNQUFNO01BQ2IsUUFBUSxFQUFFLEtBQUs7TUFDZixZQUFZLEVBQUUsS0FBSztLQUNwQjtJQUNELEVBQUUsRUFBRTtNQUNGLEdBQUcsY0FBSyxTQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsVUFBTztNQUMvQixZQUFZLEVBQUUsS0FBSztLQUNwQjtHQUNGLEVBQUM7O0VBRUYsSUFBSSxPQUFPLEVBQUUsS0FBSyxVQUFVLEVBQUU7SUFDNUJBLElBQU0sT0FBTyxHQUFHLEdBQUU7SUFDbEIsRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDO0lBQ3JCLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUU7TUFDbEIsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFHO0tBQ2xCO0lBQ0QsS0FBSyxDQUFDLEVBQUUsRUFBRSxPQUFPLFlBQUcsS0FBSyxFQUFFO01BQ3pCLElBQUksS0FBSyxFQUFFO1FBQ1QsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFHO09BQ3JCO0tBQ0YsRUFBQztHQUNIO09BQ0ksSUFBSSxFQUFFLElBQUksT0FBTyxFQUFFLEtBQUssUUFBUSxFQUFFO0lBQ3JDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBRztHQUNsQjtDQUNGOzs7OztBQUtELFNBQVMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFO0VBQzlCLE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUM7Q0FDOUI7O0FBRUQsU0FBUyxhQUFhLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUU7RUFDMUMsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUU7SUFDakMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFDO0dBQ25DO0VBQ0QsU0FBUyxDQUFDLE9BQU8sV0FBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO0lBQzFCLFNBQVMsQ0FBQyxZQUFNLGNBQUMsQ0FBQyxFQUFFLENBQUMsV0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBQyxFQUFDO0dBQzdDLEVBQUM7RUFDRkEsSUFBTSxVQUFVLEdBQUcsR0FBRTtFQUNyQkEsSUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU07OzRCQUVFO0lBQy9CQSxJQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO0lBQy9CLElBQUksS0FBSyxFQUFFO01BQ1QsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLFdBQUUsR0FBRyxFQUFFO1FBQy9CLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFDO09BQzdCLEVBQUM7S0FDSDs7O0VBTkgsS0FBS0QsSUFBSWlCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsWUFPOUI7RUFDRCxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBQztDQUM3Qjs7Ozs7QUFLRCxTQUFTLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRTtFQUNwQyxJQUFJLE9BQU8sU0FBUyxLQUFLLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7SUFDaEUsTUFBTTtHQUNQO0VBQ0QsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtJQUNqRCxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBQztJQUNwQixNQUFNO0dBQ1A7O0VBRURoQixJQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLEdBQUU7RUFDcEQsSUFBSSxPQUFPLFNBQVMsS0FBSyxVQUFVLEVBQUU7SUFDbkNBLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxFQUFFLEVBQUUsU0FBUyxZQUFFLEdBQUU7TUFDbkMsYUFBYSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFDO0tBQzVCLEVBQUM7SUFDRixhQUFhLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUM7R0FDaEM7T0FDSTtJQUNILGFBQWEsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBQztHQUNwQztDQUNGOzs7OztBQUtELFNBQVMsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFO0VBQ2hDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUM7Q0FDaEM7Ozs7O0FBS0QsU0FBUyxRQUFRLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0VBQ3hDLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUM7Q0FDckM7Ozs7O0FBS0QsU0FBUyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUU7RUFDbkMsSUFBSSxDQUFDLE1BQU0sRUFBRTtJQUNYLE1BQU07R0FDUDtFQUNEQSxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBQztFQUNoQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU07RUFDbkIsT0FBTyxDQUFDLEVBQUUsRUFBRTtJQUNWQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFDO0lBQ25CRCxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxFQUFDO0lBQ3pCLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO01BQy9CLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFDOztNQUVyQixJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxDQUFDLElBQUksMENBQXNDLE9BQU8sMEJBQW9CO09BQzlFO0tBQ0Y7SUFDRCxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO0dBQy9CO0NBQ0Y7Ozs7Ozs7QUFPRCxTQUFTLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7RUFDcEMsSUFBSSxDQUFDLElBQUksRUFBRTtJQUNULE1BQU07R0FDUDtFQUNEQyxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztFQUM5QkQsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU07RUFDbkIsT0FBTyxDQUFDLEVBQUUsRUFBRTtJQUNWQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFDO0lBQ25CQSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFDO0lBQ3ZCLElBQUksT0FBTyxLQUFLLEtBQUssVUFBVSxFQUFFO01BQy9CLE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFDO0tBQ2xDO1NBQ0k7TUFDSCxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBQztLQUM5QjtHQUNGO0NBQ0Y7Ozs7O0FBS0QsU0FBUyxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtFQUN6Q0EsSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBQzs7RUFFaENBLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxZQUFHLEtBQUssRUFBRTtJQUNwQyxTQUFTLE9BQU8sSUFBSTtNQUNsQixFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBQztLQUMzQjtJQUNEQSxJQUFNLE1BQU0sR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU07SUFDOUMsSUFBSSxNQUFNLEVBQUU7TUFDVixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBQztLQUN6RDtTQUNJO01BQ0gsT0FBTyxHQUFFO0tBQ1Y7R0FDRixFQUFDOztFQUVGLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFDO0NBQzNCOzs7OztBQUtELEFBQU8sU0FBUyxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7RUFDekMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFO0lBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7R0FDekI7RUFDREEsSUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEtBQUssRUFBRSxRQUFRLEVBQUU7O0lBRS9ELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxRQUFRLEVBQUU7TUFDbkQsTUFBTTtLQUNQO0lBQ0QsUUFBUSxDQUFDLEtBQUssRUFBQztHQUNoQixFQUFDOztFQUVGLE9BQU8sT0FBTyxDQUFDLEtBQUs7Q0FDckI7O0FDeFhEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdDQSxBQUFPLFNBQVMsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUU7RUFDcENBLElBQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBRztFQUN2QixPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO0NBQzVCOzs7Ozs7OztBQVFELEFBQU8sU0FBUyxhQUFhLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRTtFQUN2Q0EsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFHO0VBQ3ZCLE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7Q0FDL0I7Ozs7Ozs7O0FBUUQsQUFBTyxTQUFTLFdBQVcsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFO0VBQ3hDQSxJQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUM7RUFDbENBLElBQU0sR0FBRyxHQUFHLGNBQWMsQ0FBQyxFQUFFLEVBQUM7RUFDOUJBLElBQU0sT0FBTyxHQUFHLGNBQWMsR0FBRTtFQUNoQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7SUFDbkJELElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxXQUFVO0lBQ25DLElBQUksVUFBVSxFQUFFO01BQ2QsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFO1FBQ3RCLFVBQVUsR0FBRyxVQUFVLENBQUMsSUFBRztPQUM1QjtNQUNELE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUM7TUFDNUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBQztNQUM5QyxPQUFPLENBQUMsVUFBVSxHQUFHLElBQUc7S0FDekI7U0FDSTtNQUNILE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFDO01BQ2hELE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFDO0tBQy9DO0lBQ0QsT0FBTyxHQUFHLE9BQU8sQ0FBQyxRQUFPO0dBQzFCO09BQ0k7SUFDSCxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBQztJQUMxQixPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBQztHQUN6QjtFQUNELE9BQU8sU0FBRSxLQUFLLE9BQUUsR0FBRyxXQUFFLE9BQU8sV0FBRSxPQUFPLEVBQUU7Q0FDeEM7O0FBRURBLElBQUksY0FBYyxHQUFHLEVBQUM7Ozs7OztBQU10QixTQUFTLGdCQUFnQixFQUFFLEVBQUUsRUFBRTtFQUM3QkMsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFHO0VBQ3ZCQSxJQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBQztFQUN6QyxPQUFPLE1BQU07Q0FDZDs7Ozs7O0FBTUQsU0FBUyxjQUFjLEVBQUUsRUFBRSxFQUFFO0VBQzNCQSxJQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUc7RUFDdkJBLElBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFDO0VBQ3ZDLE9BQU8sTUFBTTtDQUNkOzs7Ozs7Ozs7O0FBVUQsQUFBTyxTQUFTLFlBQVksRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtFQUM5QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7SUFDaEJBLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFHO0lBQ3ZCQSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVTs7SUFFN0IsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO01BQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBQztLQUMzQjs7SUFFRCxJQUFJLEtBQUssRUFBRTtNQUNUQSxJQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUM7TUFDNUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBTTtNQUN0RCxPQUFPLE1BQU07S0FDZDtTQUNJLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtNQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBQztNQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBQztLQUM5QztTQUNJO01BQ0gsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO0tBQ2pEO0dBQ0Y7T0FDSTtJQUNILElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtNQUNsQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUM7TUFDOUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFDO0tBQzdCO1NBQ0k7TUFDSCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO0tBQ2hDO0dBQ0Y7Q0FDRjs7Ozs7Ozs7QUFRRCxBQUFPLFNBQVMsVUFBVSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO0VBQzdDLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtJQUNsQixPQUFPLFNBQVMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO0dBQ2hDO0VBQ0QsT0FBTyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztDQUNsQzs7Ozs7Ozs7QUFRRCxTQUFTLFdBQVcsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFO0VBQ3BDQSxJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsV0FBVTtFQUMvQixJQUFJLE1BQU0sRUFBRTtJQUNWLE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDO0dBQzFDO0NBQ0Y7Ozs7Ozs7O0FBUUQsU0FBUyxTQUFTLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRTtFQUNwQ0EsSUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFdBQVU7O0VBRS9CLElBQUksTUFBTSxFQUFFO0lBQ1ZELElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxNQUFLO0lBQ3hCQSxJQUFJLE9BQU07SUFDVkMsSUFBTSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEVBQUM7O0lBRWxCLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxTQUFTLENBQUMsR0FBRyxFQUFFO01BQ2pDLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBVztNQUNuQixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQztLQUNmOztJQUVERCxJQUFJLElBQUksR0FBRyxNQUFLO0lBQ2hCLEtBQUssQ0FBQyxLQUFLLFdBQUUsRUFBRSxFQUFFO01BQ2YsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLElBQUksRUFBQztNQUNyQyxJQUFJLEdBQUcsR0FBRTtNQUNULE9BQU8sTUFBTSxLQUFLLENBQUMsQ0FBQztLQUNyQixFQUFDOztJQUVGLE9BQU8sTUFBTTtHQUNkO0NBQ0Y7Ozs7Ozs7O0FBUUQsQUFBTyxTQUFTLFlBQVksRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLGFBQXFCLEVBQUU7K0NBQVYsR0FBRzs7RUFDeEQsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFO0lBQ2xCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFDO0dBQ25DO09BQ0k7SUFDSCxhQUFhLENBQUMsTUFBTSxFQUFDO0dBQ3RCO0VBQ0QsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFO0lBQ2QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUM7R0FDbkM7Q0FDRjs7Ozs7Ozs7QUFRRCxTQUFTLGFBQWEsRUFBRSxNQUFNLEVBQUU7RUFDOUJDLElBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFVOztFQUVoQyxJQUFJLE1BQU0sRUFBRTtJQUNWLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFDO0dBQzNCO0NBQ0Y7Ozs7Ozs7OztBQVNELFNBQVMsV0FBVyxFQUFFLFNBQVMsRUFBRSxhQUFxQixFQUFFOytDQUFWLEdBQUc7O0VBQy9DQSxJQUFNLE1BQU0sR0FBRyxHQUFFO0VBQ2pCRCxJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLFlBQVc7O0VBRXBDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxTQUFTLENBQUMsR0FBRyxFQUFFO0lBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDO0lBQ2YsRUFBRSxHQUFHLEVBQUUsQ0FBQyxZQUFXO0dBQ3BCOztFQUVELElBQUksQ0FBQyxhQUFhLEVBQUU7SUFDbEIsYUFBYSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUM7R0FDL0I7RUFDRCxNQUFNLENBQUMsT0FBTyxXQUFFLEVBQUUsRUFBRTtJQUNsQixhQUFhLENBQUMsRUFBRSxFQUFDO0dBQ2xCLEVBQUM7RUFDRixJQUFJLENBQUMsYUFBYSxFQUFFO0lBQ2xCLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFDO0dBQzdCO0NBQ0Y7O0FDalFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTZDQSxBQUFPLFNBQVMsS0FBSyxFQUFFLEVBQUUsRUFBRTtFQUN6QkMsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsSUFBSSxHQUFFO0VBQzdCQSxJQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxJQUFJLEdBQUU7O0VBRW5DLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRTtJQUNmLElBQUksUUFBUSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDdkQsT0FBTyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUM7S0FDaEQ7U0FDSTtNQUNILE9BQU8sQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFDO0tBQzdDO0dBQ0Y7T0FDSTtJQUNILE9BQU8sQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUM7R0FDcEM7O0VBRUQsT0FBTyxDQUFDLEtBQUssaURBQTJDLEVBQUUsQ0FBQyxNQUFLLFNBQUk7RUFDcEUsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUM7RUFDdEIsRUFBRSxDQUFDLE1BQU0sR0FBRyxLQUFJO0NBQ2pCOzs7Ozs7Ozs7OztBQVdELFNBQVMsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtFQUN4Q0EsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxHQUFFOztFQUV6QixJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLEVBQUU7SUFDekIsTUFBTTtHQUNQOztFQUVELElBQUksTUFBTSxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRTtJQUN2RCxFQUFFLENBQUMsT0FBTyxHQUFHLEtBQUk7R0FDbEI7O0VBRUQsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRTtJQUM1QixlQUFlLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0lBQ3ZDLE1BQU07R0FDUDtFQUNELElBQUksR0FBRyxJQUFJLElBQUksR0FBRTtFQUNqQixJQUFJLGVBQWUsQ0FBQyxNQUFNLENBQUMsRUFBRTtJQUMzQixPQUFPLENBQUMsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLE1BQU0sRUFBQztJQUNsRSxFQUFFLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFDO0lBQ25DLE1BQU07R0FDUDs7RUFFRCxJQUFJLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtJQUN2QyxPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLE1BQU0sRUFBQztJQUNqRSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFO01BQzVCLE9BQU8sQ0FBQyxJQUFJLENBQUMscUVBQXFFLEVBQUM7S0FDcEY7U0FDSTtNQUNILGFBQWEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztLQUNoQztJQUNELE1BQU07R0FDUDtFQUNELElBQUksb0JBQW9CLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO0lBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0NBQXNDLEVBQUUsTUFBTSxFQUFDO0lBQzdELElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7TUFDNUIsT0FBTyxDQUFDLElBQUksQ0FBQyxpRUFBaUUsRUFBQztLQUNoRjtTQUNJO01BQ0gsWUFBWSxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztLQUNyQztJQUNELE1BQU07R0FDUDtFQUNEQSxJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxLQUFJO0VBQzNDLElBQUksbUJBQW1CLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxFQUFFO0lBQ3pDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO0lBQy9DLE1BQU07R0FDUDtFQUNEQSxJQUFNLElBQUksR0FBRyxXQUFVO0VBQ3ZCQSxJQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztFQUNwRCxJQUFJLFNBQVMsRUFBRTtJQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsOENBQThDLEVBQUUsTUFBTSxFQUFDO0lBQ3JFLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0lBQy9ELE1BQU07R0FDUDtFQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsNENBQTRDLEVBQUUsTUFBTSxFQUFDO0VBQ25FLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztDQUMvQzs7Ozs7Ozs7QUFRRCxTQUFTLGdCQUFnQixFQUFFLE1BQU0sRUFBRTtFQUNqQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0NBQzdCOzs7Ozs7OztBQVFELFNBQVMsZUFBZSxFQUFFLE1BQU0sRUFBRTtFQUNoQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLEtBQUssU0FBUyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssTUFBTTtDQUMzRDs7Ozs7Ozs7O0FBU0QsU0FBUyxxQkFBcUIsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0VBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNO0NBQ3ZEOzs7Ozs7Ozs7QUFTRCxTQUFTLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7RUFDM0MsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksTUFBTSxDQUFDLEtBQUs7Q0FDckQ7Ozs7Ozs7OztBQVNELFNBQVMsbUJBQW1CLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTtFQUM5QyxPQUFPLENBQUMsT0FBTyxVQUFVLEtBQUssVUFBVSxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUM7Q0FDMUU7Ozs7Ozs7O0FBUUQsU0FBUyxnQkFBZ0IsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtFQUMzQ0QsSUFBSSxVQUFTO0VBQ2IsSUFBSSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUU7SUFDekMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFDO0dBQzdDO0VBQ0QsSUFBSSxFQUFFLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO0lBQ3pDLFNBQVMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUM7R0FDekM7RUFDRCxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7SUFDcEIsU0FBUyxHQUFHLFNBQVMsSUFBSSxHQUFFO0dBQzVCO0VBQ0QsT0FBTyxTQUFTO0NBQ2pCOzs7Ozs7Ozs7QUFTRCxTQUFTLGVBQWUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7RUFDaERDLElBQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFDO0VBQ3ZDLE1BQU0sQ0FBQyxPQUFPLFdBQUUsS0FBSyxFQUFFO0lBQ3JCLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUM7R0FDcEMsRUFBQztDQUNIOzs7Ozs7OztBQVFELFNBQVMsYUFBYSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0VBQ3hDQSxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTTtFQUM1QkEsSUFBTSxRQUFRLEdBQUcsT0FBTyxNQUFNLEtBQUssV0FBVTtFQUM3Q0QsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxJQUFJLE9BQU07RUFDekQsSUFBSSxPQUFPLE1BQU0sS0FBSyxVQUFVLEVBQUU7SUFDaEMsTUFBTSxHQUFHLFlBQVksRUFBRSxPQUFPLEVBQUUsR0FBRTtHQUNuQztFQUNEQyxJQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxJQUFJLFNBQVE7RUFDbENBLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLElBQUksU0FBUTtFQUN0Q0EsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTztLQUM3QyxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFDOztFQUV0Q0EsSUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUM7RUFDdkMsU0FBUyxDQUFDLFFBQVEsR0FBRyxHQUFFO0VBQ3ZCLFNBQVMsQ0FBQyxJQUFJLEdBQUcsR0FBRTtFQUNuQixTQUFTLENBQUMsR0FBRyxHQUFHLEdBQUU7O0VBRWxCLFVBQVUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxVQUFFLE1BQU0sT0FBRSxHQUFHLFNBQUUsS0FBSyxXQUFFLE9BQU8sWUFBRSxRQUFRLEVBQUUsRUFBQztDQUM3RTs7Ozs7Ozs7O0FBU0QsU0FBUyxZQUFZLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0VBQzdDQSxJQUFNLE9BQU8sR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLEdBQUU7RUFDL0JBLElBQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFDOztFQUV2QyxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtJQUNqQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUM7R0FDOUI7O0VBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0lBQ2YsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTTtHQUM3Qjs7RUFFRCxTQUFTLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFDO0NBQzFDOzs7Ozs7Ozs7QUFTRCxTQUFTLFdBQVcsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFO0VBQ3hEQSxJQUFNLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQztFQUNoQ0EsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFFBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFDO0VBQ3RDQSxJQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsRUFBRSxFQUFFLElBQUksRUFBQzs7RUFFdkMsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDakMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDO0dBQzlCOztFQUVELEtBQUssQ0FBQyxFQUFFLEVBQUUsVUFBVSxZQUFHLEtBQUssRUFBRTtJQUM1QkEsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBQztJQUM3QyxZQUFZLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUM7SUFDakMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBQztHQUN4QyxFQUFDOztFQUVGLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUM7Q0FDeEM7Ozs7Ozs7OztBQVNELFNBQVMsc0JBQXNCLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7RUFDeEVBLElBQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxZQUFXO0VBQzNCQSxJQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFO0lBQzNELFdBQVcsRUFBRSxZQUFZO01BQ3ZCLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRTtRQUNkLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLFFBQU87T0FDMUI7TUFDRGUsT0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUM7O01BRWhDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRztRQUN0QixNQUFNLEVBQUUsRUFBRTtRQUNWLFFBQVEsRUFBRSxNQUFNO1FBQ2pCO0tBQ0Y7SUFDRCxjQUFjLEVBQUUsWUFBWTtNQUMxQixTQUFTLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBQztLQUN6QztJQUNELFlBQVksRUFBRSxZQUFZO01BQ3hCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNqQixlQUFlLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFDO09BQzNDO0tBQ0Y7R0FDRixFQUFDO0VBQ0YseUJBQXlCLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFDO0NBQ25EOzs7Ozs7Ozs7O0FBVUQsU0FBUyxzQkFBc0IsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7RUFDekQsMkJBQTJCLENBQUMsUUFBUSxFQUFDOztFQUVyQ2hCLElBQUksUUFBTztFQUNYLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxrQkFBa0IsRUFBRTs7SUFFbkMsT0FBTyxDQUFDLEtBQUssaURBQThDLElBQUksR0FBRztJQUNsRSxPQUFPLEdBQUcsVUFBVSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUM7R0FDL0I7T0FDSTtJQUNILE9BQU8sQ0FBQyxLQUFLLG9EQUFpRCxJQUFJLEdBQUc7SUFDckUsT0FBTyxHQUFHLGFBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFDO0dBQ2xDOztFQUVELElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO0lBQ2YsRUFBRSxDQUFDLE9BQU8sR0FBRyxRQUFPOztJQUVwQkMsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixJQUFJLEdBQUU7SUFDekNBLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxTQUFRO0lBQy9CQSxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTTtJQUMvQixJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLFFBQVEsSUFBSSxPQUFPLEVBQUU7TUFDbEQsS0FBS0EsSUFBTWlCLE1BQUksSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2hDakIsSUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUNpQixNQUFJLENBQUMsRUFBQztRQUM3QyxJQUFJLE9BQU8sRUFBRTtVQUNYLE9BQU8sQ0FBQyxRQUFRLENBQUNBLE1BQUksRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFDO1NBQ2hEO09BQ0Y7S0FDRjtHQUNGOztFQUVELFdBQVcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBQzs7RUFFbEMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO0lBQ3pDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFNO0dBQ3ZDOztFQUVELElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtJQUNuQixPQUFPLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLElBQUksR0FBRTtJQUNqQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsT0FBTTtHQUN0Qzs7RUFFRGpCLElBQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEtBQUssT0FBTTtFQUMzQ0EsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxHQUFFO0VBQ3pCLElBQUksR0FBRyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtJQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLGtEQUFrRCxFQUFFLE9BQU8sRUFBQztJQUMxRSxHQUFHLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQztHQUNqRDtFQUNELElBQUksR0FBRyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsRUFBRTtJQUN6QixlQUFlLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUM7R0FDdkM7RUFDRCxJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLElBQUksUUFBUSxFQUFFO0lBQ3JDLE9BQU8sQ0FBQyxLQUFLLENBQUMsaURBQWlELEVBQUUsT0FBTyxFQUFDO0lBQ3pFLEdBQUcsQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFDO0dBQ2pEO0NBQ0Y7Ozs7Ozs7O0FBUUQsU0FBUyxlQUFlLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7RUFDNUNBLElBQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLElBQUksR0FBRTtFQUN6QkEsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFNBQVE7RUFDbEMsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtJQUMvQixRQUFRLENBQUMsS0FBSyxXQUFFLEtBQUssRUFBRTtNQUNyQixPQUFPLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUM7TUFDeEIsT0FBTyxHQUFHLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQztLQUM3QixFQUFDO0dBQ0g7Q0FDRjs7Ozs7Ozs7O0FBU0QsU0FBUyxVQUFVLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO0VBQ2hEQSxJQUFNLEdBQUcsR0FBRyxTQUFTLENBQUMsSUFBRztFQUN6QkEsSUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFNBQVE7RUFDbkMsSUFBUTtNQUFRO01BQVMsUUFBUSxpQkFBUztFQUMxQ0EsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUc7RUFDeEJBLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFLOztFQUU1QixTQUFTLFdBQVcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTtJQUMxQ0QsSUFBSSxXQUFVO0lBQ2QsSUFBSSxRQUFRLEVBQUU7TUFDWixVQUFVLEdBQUcsS0FBSTtNQUNqQixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNsQixVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBSztRQUMzQixJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRTtVQUN2QyxNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUU7WUFDekMsS0FBSyxjQUFLO2NBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyxrREFBa0Q7Z0JBQzdELDZCQUE2QixFQUFDO2FBQ2pDO1dBQ0YsRUFBQztTQUNIO09BQ0Y7V0FDSTtRQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsdUVBQXVFO1lBQ2hGLDRDQUE0QyxFQUFDO1FBQ2pELFVBQVUsR0FBRyxHQUFFO1FBQ2YsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE1BQUs7UUFDM0IsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUk7T0FDN0I7S0FDRjtTQUNJO01BQ0gsVUFBVSxHQUFHLEdBQUU7TUFDZixVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBSztNQUMzQixVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSTtLQUM3QjtJQUNEQyxJQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQztJQUNwRCxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBQztJQUNwQixPQUFPLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUM7R0FDekQ7O0VBRURBLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRO2NBQ3BELElBQUksRUFBRTtNQUNMLE9BQU8sQ0FBQyxLQUFLLENBQUMsOENBQThDLEVBQUUsSUFBSSxFQUFDO01BQ25FLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDdkIsTUFBTTtPQUNQOztNQUVEQSxJQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsS0FBSyxHQUFFO01BQ3BDQSxJQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxHQUFFO01BQzFCQSxJQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRTs7TUFFdENBLElBQU0sUUFBUSxHQUFHLEdBQUU7TUFDbkJBLElBQU0sU0FBUyxHQUFHLEdBQUU7TUFDcEIsSUFBSSxDQUFDLE9BQU8sV0FBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO1FBQ3pCQSxJQUFNLEdBQUcsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsS0FBSyxFQUFDOztRQUV4RSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxLQUFLLEVBQUUsRUFBRTtVQUM3QixNQUFNO1NBQ1A7UUFDRCxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSTtPQUNyQixFQUFDOzs7TUFHRkEsSUFBTSxVQUFVLEdBQUcsR0FBRTtNQUNyQixPQUFPLENBQUMsT0FBTyxXQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7UUFDNUJBLElBQU0sR0FBRyxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxLQUFLLEVBQUM7UUFDeEUsSUFBSSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1VBQ2hDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRztrQkFDZixJQUFJLFNBQUUsS0FBSyxPQUFFLEdBQUc7WUFDaEIsTUFBTSxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFDMUIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDbEI7VUFDRCxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztTQUN0QjthQUNJO1VBQ0gsWUFBWSxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUM7U0FDckM7T0FDRixFQUFDOzs7TUFHRixRQUFRLENBQUMsTUFBTSxHQUFHLEVBQUM7TUFDbkIsR0FBRyxDQUFDLE1BQU0sR0FBRyxFQUFDO01BQ2QsU0FBUyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFFO01BQzdCLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLE1BQUs7O01BRXRDLElBQUksQ0FBQyxPQUFPLFdBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtRQUN6QkEsSUFBTSxHQUFHLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEtBQUssRUFBQztRQUN4RUEsSUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsRUFBQztRQUM3QixJQUFJLE1BQU0sRUFBRTtVQUNWLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDakMsVUFBVSxDQUFDLEtBQUssR0FBRTtXQUNuQjtlQUNJO1lBQ0gsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFDO1lBQy9CLFVBQVUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksRUFBQztXQUMxRDtVQUNELFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBQztVQUM1QixHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUM7VUFDbkIsSUFBSSxRQUFRLEVBQUU7WUFDWixNQUFNLENBQUMsRUFBRSxHQUFHLEtBQUk7V0FDakI7ZUFDSTtZQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSTtXQUM1QjtVQUNELE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBSztVQUMxQixTQUFTLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxPQUFNO1NBQ3JDO2FBQ0k7VUFDSCxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUM7U0FDN0I7T0FDRixFQUFDOztNQUVGLE9BQU8sU0FBUyxDQUFDLFdBQVU7S0FDNUI7SUFDRjs7RUFFRCxTQUFTLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDO0VBQzlCLElBQUksQ0FBQyxPQUFPLFdBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtJQUN6QixXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUM7R0FDN0IsRUFBQztDQUNIOzs7Ozs7Ozs7QUFTRCxTQUFTLFNBQVMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7RUFDL0NBLElBQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTztjQUM1RCxPQUFPLEVBQUU7TUFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLE9BQU8sRUFBQzs7TUFFbEUsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUMsT0FBTyxFQUFFO1FBQ25ELE1BQU07T0FDUDtNQUNELFNBQVMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQU87TUFDN0IsSUFBSSxPQUFPLEVBQUU7UUFDWCxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDO09BQ3JDO1dBQ0k7UUFDSCxZQUFZLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUM7T0FDbEM7S0FDRjtJQUNGOztFQUVELFNBQVMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQU87RUFDN0IsSUFBSSxPQUFPLEVBQUU7SUFDWCxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDO0dBQ3JDO0NBQ0Y7Ozs7Ozs7Ozs7OztBQVlELFNBQVMsVUFBVSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7RUFDdkRBLElBQU0sTUFBTSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTTtFQUM5Q0EsSUFBTSxNQUFNLEdBQUcsR0FBRTtFQUNqQkEsSUFBTSxLQUFLLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksRUFBQzs7RUFFaEQsT0FBTyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksWUFBRyxLQUFLLEVBQUU7SUFDN0IsTUFBTSxDQUFDLFdBQVcsR0FBRyxNQUFLO0lBQzFCLElBQUksTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtNQUM5QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLE9BQU8sY0FBSztRQUMvQ0EsSUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVc7UUFDdEMsT0FBTyxDQUFDLFdBQVcsRUFBQztRQUNwQixNQUFNLENBQUMsUUFBUSxHQUFHLE1BQUs7UUFDdkIsTUFBTSxDQUFDLFdBQVcsR0FBRyxVQUFTO09BQy9CLEVBQUM7S0FDSDtJQUNELE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSTtHQUN2QixDQUFDO0NBQ0g7Ozs7Ozs7O0FBUUQsU0FBUyxZQUFZLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRTtFQUMxQ0EsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUM7RUFDekMsVUFBVSxDQUFDLEtBQUssR0FBRyxXQUFVO0VBQzdCLFFBQVEsQ0FBQyxVQUFVLEVBQUM7RUFDcEIsWUFBWSxDQUFDLFVBQVUsRUFBQztFQUN4QixVQUFVLENBQUMsV0FBVyxHQUFHLFFBQU87RUFDaEMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO0lBQ25CLFVBQVUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFFBQU87R0FDckM7RUFDRCxPQUFPLFVBQVU7Q0FDbEI7O0FDM25CRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStCQSxTQUFTLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO0VBQzFCLElBQUksTUFBTSxZQUFZLEdBQUcsRUFBRTtJQUN6QixPQUFPLE1BQU07R0FDZDs7RUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUU7RUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFNO0VBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSTs7RUFFaEJELElBQUksVUFBVSxHQUFHLE1BQUs7Ozs7O0VBS3RCLElBQUksQ0FBQyxJQUFJLEdBQUcsWUFBWTtJQUN0QixVQUFVLEdBQUcsS0FBSTtJQUNsQjs7Ozs7RUFLRCxJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVk7SUFDNUIsT0FBTyxVQUFVO0lBQ2xCO0NBQ0Y7Ozs7Ozs7QUFPRCxBQUFPLFNBQVMsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7OztFQUNuQ0MsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVM7RUFDN0JBLElBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUM7RUFDaEMsSUFBSSxXQUFXLEVBQUU7SUFDZkEsSUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztJQUNqQyxXQUFXLENBQUMsT0FBTyxXQUFFLE9BQU8sRUFBRTtNQUM1QixPQUFPLENBQUMsSUFBSSxDQUFDTSxNQUFJLEVBQUUsR0FBRyxFQUFDO0tBQ3hCLEVBQUM7R0FDSDtDQUNGOzs7Ozs7O0FBT0QsQUFBTyxTQUFTLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFO0VBQ3ZDTixJQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFDO0VBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQzs7RUFFckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO0lBQy9ELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUM7R0FDbEM7Q0FDRjs7Ozs7OztBQU9ELEFBQU8sU0FBUyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRTtFQUN4Q0EsSUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztFQUNqQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUM7O0VBRXJCLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtJQUMxQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sV0FBRSxLQUFLLEVBQUU7TUFDaEMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFDO0tBQzVCLEVBQUM7R0FDSDtDQUNGOzs7Ozs7O0FBT0QsQUFBTyxTQUFTLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0VBQ2xDLElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxPQUFPLEtBQUssVUFBVSxFQUFFO0lBQzFDLE1BQU07R0FDUDtFQUNEQSxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBUztFQUM3QkEsSUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUU7RUFDdEMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUM7RUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVc7Ozs7RUFJMUIsSUFBSSxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7SUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUM7R0FDekI7Q0FDRjs7Ozs7OztBQU9ELEFBQU8sU0FBUyxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtFQUNuQyxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ1QsTUFBTTtHQUNQO0VBQ0RBLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFTO0VBQzdCLElBQUksQ0FBQyxPQUFPLEVBQUU7SUFDWixPQUFPLE1BQU0sQ0FBQyxJQUFJLEVBQUM7SUFDbkIsTUFBTTtHQUNQO0VBQ0RBLElBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUM7RUFDaEMsSUFBSSxDQUFDLFdBQVcsRUFBRTtJQUNoQixNQUFNO0dBQ1A7RUFDRCxXQUFXLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBQztDQUM3Qjs7QUFFREEsSUFBTSxnQkFBZ0IsR0FBRyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBQzs7Ozs7Ozs7O0FBU2xFLEFBQU8sU0FBUyxVQUFVLEVBQUUsRUFBRSxFQUFFLGNBQWMsRUFBRTtFQUM5Q0EsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFFBQVEsSUFBSSxHQUFFO0VBQ2pDQSxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLEdBQUU7RUFDbkMsS0FBS0EsSUFBTSxLQUFLLElBQUksTUFBTSxFQUFFO0lBQzFCLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBQztHQUM3QjtFQUNELEtBQUtBLElBQU0sS0FBSyxJQUFJLGNBQWMsRUFBRTtJQUNsQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUM7R0FDckM7RUFDRCxnQkFBZ0IsQ0FBQyxPQUFPLFdBQUUsSUFBSSxFQUFFO0lBQzlCLEVBQUUsQ0FBQyxHQUFHLFlBQVMsSUFBSSxHQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQztHQUN0QyxFQUFDO0NBQ0g7Ozs7OztBQU1ELEFBQU8sU0FBUyxXQUFXLEVBQUUsRUFBRSxFQUFFO0VBQy9CLEVBQUUsQ0FBQyxLQUFLLEdBQUcsTUFBSztFQUNoQixFQUFFLENBQUMsU0FBUyxHQUFHLFVBQVM7RUFDeEIsRUFBRSxDQUFDLFVBQVUsR0FBRyxXQUFVO0VBQzFCLEVBQUUsQ0FBQyxHQUFHLEdBQUcsSUFBRztFQUNaLEVBQUUsQ0FBQyxJQUFJLEdBQUcsS0FBSTtDQUNmOztBQ2xMRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkE7Ozs7Ozs7Ozs7QUE2QkEsQUFBZSxTQUFTLEVBQUU7RUFDeEIsSUFBSTtFQUNKLE9BQU87RUFDUCxRQUFRO0VBQ1IsUUFBUTtFQUNSLFVBQVU7RUFDVixjQUFjO0VBQ2Q7RUFDQSxRQUFRLEdBQUcsUUFBUSxJQUFJLEdBQUU7RUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLEdBQUcsU0FBUTtFQUNyRSxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLElBQUksR0FBRTtFQUMvQixRQUFRLENBQUMsWUFBWSxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQzs7RUFFekQsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFO0lBQzVDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBQztHQUM3QztFQUNELE9BQU8sR0FBRyxPQUFPLElBQUksR0FBRTs7RUFFdkJBLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLElBQUksR0FBRTs7RUFFL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFPO0VBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxHQUFFO0VBQ3JDLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxHQUFFO0VBQ3ZDLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxHQUFFO0VBQy9CLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRTtFQUNkLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRTtFQUNuQixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUU7RUFDdEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFJOzs7RUFHakIsVUFBVSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUM7O0VBRWhDLE9BQU8sQ0FBQyxLQUFLLGdEQUEwQyxJQUFJLENBQUMsTUFBSyxTQUFJO0VBQ3JFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFDO0VBQ3ZCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSTs7OztFQUluQixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sSUFBSSxLQUFLLFVBQVUsR0FBRyxJQUFJLEVBQUUsR0FBRyxLQUFJO0VBQ3ZELElBQUksVUFBVSxFQUFFO0lBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFDO0dBQy9CO0VBQ0QsU0FBUyxDQUFDLElBQUksRUFBQzs7RUFFZixPQUFPLENBQUMsS0FBSyxtREFBNkMsSUFBSSxDQUFDLE1BQUssU0FBSTtFQUN4RSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBQztFQUMxQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUk7OztFQUdwQixJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7SUFDNUMsT0FBTyxDQUFDLElBQUksQ0FBQyx5Q0FBeUM7TUFDcEQsc0NBQXNDLEVBQUM7SUFDekMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQztHQUNqQzs7RUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7SUFDbEIsTUFBTTtHQUNQOzs7RUFHRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZTtFQUMxRCxLQUFLLENBQUMsSUFBSSxFQUFDO0NBQ1o7O0FBRUQsV0FBVyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUM7Ozs7Ozs7OztBQVN6QixFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxVQUFVLEVBQUUsRUFBRSxRQUFRLEVBQUU7RUFDNUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFDO0VBQzFCOztBQUVELEVBQUUsQ0FBQyxHQUFHLEdBQUcsSUFBRztBQUNaLEVBQUUsQ0FBQyxNQUFNLEdBQUcsR0FBRzs7QUNsSWY7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQUQsSUFBSSxhQUFhLEdBQUcsR0FBRTs7Ozs7OztBQU90QixBQUVDOzs7OztBQUtELEFBRUM7Ozs7Ozs7O0FBUUQsQUFBTyxTQUFTLFdBQVcsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFO3FDQUNiOztJQUVoQ0EsSUFBSSxPQUFPLEdBQUcsYUFBYSxDQUFDLFVBQVUsRUFBQztJQUN2QyxJQUFJLENBQUMsT0FBTyxFQUFFO01BQ1osT0FBTyxHQUFHLEdBQUU7TUFDWixhQUFhLENBQUMsVUFBVSxDQUFDLEdBQUcsUUFBTztLQUNwQzs7O0lBR0QsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLE1BQU0sRUFBRTtNQUM1QyxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtRQUM5QixNQUFNLEdBQUc7VUFDUCxJQUFJLEVBQUUsTUFBTTtVQUNiO09BQ0Y7O01BRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxFQUFFO1FBQ3RDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTTtPQUM5QjtLQUNGLEVBQUM7OztFQW5CSixLQUFLQyxJQUFNLFVBQVUsSUFBSSxPQUFPLHFCQW9CL0I7Q0FDRjs7Ozs7QUFLRCxBQUFPLFNBQVNrQixhQUFXLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRTtFQUNyQ2xCLElBQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFTOztFQUV0QixLQUFLQSxJQUFNLE9BQU8sSUFBSSxJQUFJLEVBQUU7SUFDMUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUU7TUFDOUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUM7S0FDM0I7R0FDRjtDQUNGOzs7OztBQUtELEFBQU8sU0FBUyxhQUFhLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtFQUN4Q0EsSUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBQztFQUNuQ0EsSUFBTSxNQUFNLEdBQUcsR0FBRTtxQ0FDaUI7SUFDaEMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFO01BQ3hDLFlBQVksRUFBRSxJQUFJO01BQ2xCLFVBQVUsRUFBRSxJQUFJO01BQ2hCLEdBQUcsRUFBRSxTQUFTLFlBQVksSUFBSTtRQUM1QixtQkFBaUI7Ozs7aUJBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztVQUNoQyxNQUFNLEVBQUUsSUFBSTtVQUNaLE1BQU0sRUFBRSxVQUFVO1VBQ2xCLElBQUksRUFBRSxJQUFJO1NBQ1g7U0FBQztPQUNIO01BQ0QsR0FBRyxFQUFFLFNBQVMsWUFBWSxFQUFFLEtBQUssRUFBRTtRQUNqQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFVBQVUsRUFBRTtVQUMvQixPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUM7WUFDbkIsTUFBTSxFQUFFLElBQUk7WUFDWixNQUFNLEVBQUUsVUFBVTtZQUNsQixJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUM7V0FDZCxDQUFDO1NBQ0g7T0FDRjtLQUNGLEVBQUM7OztFQXBCSixLQUFLQSxJQUFNLFVBQVUsSUFBSSxPQUFPLHFCQXFCL0I7RUFDRCxPQUFPLE1BQU07Q0FDZDs7Ozs7QUFLRCxBQUFPLFNBQVMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtFQUNqRCxJQUFRLGtCQUFrQiwwQkFBUTtFQUNsQyxPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQztDQUNoQzs7Ozs7QUFLRCxBQUFPLFNBQVMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7RUFDdkQsSUFBUSxrQkFBa0IsMEJBQVE7O0VBRWxDLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDNUIsT0FBTyxDQUFDLEtBQUsseUNBQXNDLElBQUksNkJBQXdCO0lBQy9FLE1BQU07R0FDUDs7RUFFRCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFHO0NBQy9COzs7Ozs7O0FDbElELE9BQU8sR0FBRyxjQUFjLEdBQUcsTUFBTSxDQUFDOzs7WUFHdEIsSUFBSSxLQUFLLENBQUM7WUFDVixJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVE7Z0JBQzNCLE9BQU8sQ0FBQyxHQUFHO2dCQUNYLEtBQXNCO2dCQUN0QixhQUFhLENBQUMsSUFBSSxDQUFDLEtBQXNCLENBQUM7Z0JBQzVDLEtBQUssR0FBRyxXQUFXO2dCQUNqQixJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ2hDLEdBQUM7O2dCQUVKLEtBQUssR0FBRyxXQUFXLEVBQUUsR0FBQzs7OztBQUlwQywyQkFBMkIsR0FBRyxPQUFPLENBQUM7O0FBRXRDLElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUNyQixJQUFJLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQzs7O0FBR25FLElBQUksRUFBRSxHQUFHLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDekIsSUFBSSxHQUFHLEdBQUcsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Ozs7Ozs7O0FBUVYsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUM1QixHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxhQUFhLENBQUM7QUFDdkMsSUFBSSxzQkFBc0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNqQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsR0FBRyxRQUFRLENBQUM7Ozs7Ozs7QUFPdkMsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUMvQixHQUFHLENBQUMsb0JBQW9CLENBQUMsR0FBRyw0QkFBNEIsQ0FBQzs7Ozs7O0FBTXpELElBQUksV0FBVyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ3RCLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsTUFBTTttQkFDckMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLE1BQU07bUJBQ3JDLEdBQUcsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxHQUFHLENBQUM7O0FBRXRELElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDM0IsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLE1BQU07d0JBQzFDLEdBQUcsR0FBRyxHQUFHLENBQUMsc0JBQXNCLENBQUMsR0FBRyxNQUFNO3dCQUMxQyxHQUFHLEdBQUcsR0FBRyxDQUFDLHNCQUFzQixDQUFDLEdBQUcsR0FBRyxDQUFDOzs7OztBQUtoRSxJQUFJLG9CQUFvQixHQUFHLENBQUMsRUFBRSxDQUFDO0FBQy9CLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUM7NEJBQzlCLEdBQUcsR0FBRyxHQUFHLENBQUMsb0JBQW9CLENBQUMsR0FBRyxHQUFHLENBQUM7O0FBRWxFLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDcEMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQztpQ0FDbkMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEdBQUcsQ0FBQzs7Ozs7OztBQU92RSxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNyQixHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsT0FBTyxHQUFHLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQztrQkFDbkMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLE1BQU0sQ0FBQzs7QUFFaEUsSUFBSSxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDMUIsR0FBRyxDQUFDLGVBQWUsQ0FBQyxHQUFHLFFBQVEsR0FBRyxHQUFHLENBQUMseUJBQXlCLENBQUM7dUJBQ3pDLFFBQVEsR0FBRyxHQUFHLENBQUMseUJBQXlCLENBQUMsR0FBRyxNQUFNLENBQUM7Ozs7O0FBSzFFLElBQUksZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQzFCLEdBQUcsQ0FBQyxlQUFlLENBQUMsR0FBRyxlQUFlLENBQUM7Ozs7OztBQU12QyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNoQixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUM7YUFDaEMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsR0FBRyxNQUFNLENBQUM7Ozs7Ozs7Ozs7OztBQVl0RCxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNmLElBQUksU0FBUyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDO2dCQUN2QixHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRztnQkFDckIsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQzs7QUFFakMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxTQUFTLEdBQUcsR0FBRyxDQUFDOzs7OztBQUtsQyxJQUFJLFVBQVUsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2lCQUNsQyxHQUFHLENBQUMsZUFBZSxDQUFDLEdBQUcsR0FBRztpQkFDMUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQzs7QUFFbEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDaEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDOztBQUVwQyxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNmLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUM7Ozs7O0FBSzNCLElBQUkscUJBQXFCLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDaEMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsR0FBRyxDQUFDLHNCQUFzQixDQUFDLEdBQUcsVUFBVSxDQUFDO0FBQ3RFLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDM0IsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsVUFBVSxDQUFDOztBQUU1RCxJQUFJLFdBQVcsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUN0QixHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsV0FBVyxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEdBQUc7bUJBQ3pDLFNBQVMsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxHQUFHO21CQUN2QyxTQUFTLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsR0FBRzttQkFDdkMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJO21CQUM5QixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRzttQkFDaEIsTUFBTSxDQUFDOztBQUUxQixJQUFJLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO0FBQzNCLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLFdBQVcsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUMsR0FBRyxHQUFHO3dCQUM5QyxTQUFTLEdBQUcsR0FBRyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsR0FBRzt3QkFDNUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEdBQUc7d0JBQzVDLEtBQUssR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSTt3QkFDbkMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUc7d0JBQ2hCLE1BQU0sQ0FBQzs7QUFFL0IsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDaEUsSUFBSSxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDdEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEdBQUcsQ0FBQzs7OztBQUkxRSxJQUFJLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNwQixHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDOztBQUUzQixJQUFJLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNwQixHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsUUFBUSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDcEQsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNoRCxJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQzs7QUFFN0IsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDaEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUMzRCxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNyQixHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxHQUFHLENBQUM7Ozs7QUFJckUsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQzs7QUFFM0IsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFFBQVEsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQ3BELEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDaEQsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7O0FBRTdCLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ2hCLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDM0QsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDckIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsR0FBRyxDQUFDOzs7QUFHckUsSUFBSSxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDMUIsR0FBRyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxHQUFHLFVBQVUsR0FBRyxPQUFPLENBQUM7QUFDeEUsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDckIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxHQUFHLFNBQVMsR0FBRyxPQUFPLENBQUM7Ozs7O0FBS2xFLElBQUksY0FBYyxHQUFHLENBQUMsRUFBRSxDQUFDO0FBQ3pCLEdBQUcsQ0FBQyxjQUFjLENBQUMsR0FBRyxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztzQkFDcEIsT0FBTyxHQUFHLFVBQVUsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQzs7O0FBRzFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDMUQsSUFBSSxxQkFBcUIsR0FBRyxRQUFRLENBQUM7Ozs7Ozs7QUFPckMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDdEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLFFBQVEsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsR0FBRzttQkFDakMsV0FBVzttQkFDWCxHQUFHLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUc7bUJBQzVCLE9BQU8sQ0FBQzs7QUFFM0IsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUMzQixHQUFHLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxRQUFRLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsR0FBRzt3QkFDdEMsV0FBVzt3QkFDWCxHQUFHLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsR0FBRzt3QkFDakMsT0FBTyxDQUFDOzs7QUFHaEMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDZixHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsaUJBQWlCLENBQUM7Ozs7QUFJOUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxQixLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2pCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQ1IsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDO0NBQzlCOztBQUVELGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDdEIsU0FBUyxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRTtFQUM3QixJQUFJLE9BQU8sWUFBWSxNQUFNO01BQzNCLE9BQU8sT0FBTyxHQUFDOztFQUVqQixJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVE7TUFDN0IsT0FBTyxJQUFJLEdBQUM7O0VBRWQsSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLFVBQVU7TUFDN0IsT0FBTyxJQUFJLEdBQUM7O0VBRWQsSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDckMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO01BQ2xCLE9BQU8sSUFBSSxHQUFDOztFQUVkLElBQUk7SUFDRixPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztHQUNuQyxDQUFDLE9BQU8sRUFBRSxFQUFFO0lBQ1gsT0FBTyxJQUFJLENBQUM7R0FDYjtDQUNGOztBQUVELGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDdEIsU0FBUyxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRTtFQUM3QixJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0VBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0NBQzdCOzs7QUFHRCxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFNBQVMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUU7RUFDN0IsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0VBQzNELE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0NBQzdCOztBQUVELGNBQWMsR0FBRyxNQUFNLENBQUM7O0FBRXhCLFNBQVMsTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUU7RUFDOUIsSUFBSSxPQUFPLFlBQVksTUFBTSxFQUFFO0lBQzdCLElBQUksT0FBTyxDQUFDLEtBQUssS0FBSyxLQUFLO1FBQ3pCLE9BQU8sT0FBTyxHQUFDOztRQUVmLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxHQUFDO0dBQzdCLE1BQU0sSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7SUFDdEMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxPQUFPLENBQUMsQ0FBQztHQUNwRDs7RUFFRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsVUFBVTtNQUM3QixNQUFNLElBQUksU0FBUyxDQUFDLHlCQUF5QixHQUFHLFVBQVUsR0FBRyxhQUFhLEdBQUM7O0VBRTdFLElBQUksRUFBRSxJQUFJLFlBQVksTUFBTSxDQUFDO01BQzNCLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFDOztFQUVwQyxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztFQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztFQUNuQixJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0VBRTNELElBQUksQ0FBQyxDQUFDO01BQ0osTUFBTSxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxPQUFPLENBQUMsR0FBQzs7RUFFckQsSUFBSSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUM7OztFQUduQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7RUFFbkIsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLGdCQUFnQixJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQztNQUNqRCxNQUFNLElBQUksU0FBUyxDQUFDLHVCQUF1QixHQUFDOztFQUU5QyxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsZ0JBQWdCLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO01BQ2pELE1BQU0sSUFBSSxTQUFTLENBQUMsdUJBQXVCLEdBQUM7O0VBRTlDLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUM7TUFDakQsTUFBTSxJQUFJLFNBQVMsQ0FBQyx1QkFBdUIsR0FBQzs7O0VBRzlDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ1AsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLEdBQUM7O01BRXJCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUU7TUFDakQsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ3ZCLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2QsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxnQkFBZ0I7WUFDcEMsT0FBTyxHQUFHLEdBQUM7T0FDZDtNQUNELE9BQU8sRUFBRSxDQUFDO0tBQ1gsQ0FBQyxHQUFDOztFQUVMLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0VBQ3pDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztDQUNmOztBQUVELE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFdBQVc7RUFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0VBQ2hFLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNO01BQ3hCLElBQUksQ0FBQyxPQUFPLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFDO0VBQ2xELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztDQUNyQixDQUFDOztBQUVGLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFdBQVc7RUFDckMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0NBQ3JCLENBQUM7O0FBRUYsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxLQUFLLEVBQUU7RUFDekMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztFQUN6RCxJQUFJLEVBQUUsS0FBSyxZQUFZLE1BQU0sQ0FBQztNQUM1QixLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBQzs7RUFFeEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDMUQsQ0FBQzs7QUFFRixNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxTQUFTLEtBQUssRUFBRTtFQUM3QyxJQUFJLEVBQUUsS0FBSyxZQUFZLE1BQU0sQ0FBQztNQUM1QixLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBQzs7RUFFeEMsT0FBTyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDM0Msa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQzNDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3BELENBQUM7O0FBRUYsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxLQUFLLEVBQUU7OztFQUM1QyxJQUFJLEVBQUUsS0FBSyxZQUFZLE1BQU0sQ0FBQztNQUM1QixLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBQzs7O0VBR3hDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU07TUFDcEQsT0FBTyxDQUFDLENBQUMsR0FBQztPQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU07TUFDekQsT0FBTyxDQUFDLEdBQUM7T0FDTixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU07TUFDMUQsT0FBTyxDQUFDLEdBQUM7O0VBRVgsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ1YsR0FBRztJQUNELElBQUksQ0FBQyxHQUFHTSxNQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsS0FBSyxDQUFDLG9CQUFvQixFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckMsSUFBSSxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsS0FBSyxTQUFTO1FBQ3BDLE9BQU8sQ0FBQyxHQUFDO1NBQ04sSUFBSSxDQUFDLEtBQUssU0FBUztRQUN0QixPQUFPLENBQUMsR0FBQztTQUNOLElBQUksQ0FBQyxLQUFLLFNBQVM7UUFDdEIsT0FBTyxDQUFDLENBQUMsR0FBQztTQUNQLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDZCxXQUFTOztRQUVULE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFDO0dBQ25DLFFBQVEsRUFBRSxDQUFDLEVBQUU7Q0FDZixDQUFDOzs7O0FBSUYsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsU0FBUyxPQUFPLEVBQUUsVUFBVSxFQUFFOzs7RUFDbkQsUUFBUSxPQUFPO0lBQ2IsS0FBSyxVQUFVO01BQ2IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO01BQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO01BQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7TUFDZixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7TUFDYixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztNQUM1QixNQUFNO0lBQ1IsS0FBSyxVQUFVO01BQ2IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO01BQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO01BQ2YsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO01BQ2IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7TUFDNUIsTUFBTTtJQUNSLEtBQUssVUFBVTs7OztNQUliLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztNQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztNQUM5QixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztNQUM1QixNQUFNOzs7SUFHUixLQUFLLFlBQVk7TUFDZixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUM7VUFDOUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEdBQUM7TUFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7TUFDNUIsTUFBTTs7SUFFUixLQUFLLE9BQU87Ozs7O01BS1YsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDO1VBQ3RFLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBQztNQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO01BQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7TUFDZixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztNQUNyQixNQUFNO0lBQ1IsS0FBSyxPQUFPOzs7OztNQUtWLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQztVQUNsRCxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUM7TUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztNQUNmLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO01BQ3JCLE1BQU07SUFDUixLQUFLLE9BQU87Ozs7O01BS1YsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDO1VBQzlCLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBQztNQUNmLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO01BQ3JCLE1BQU07OztJQUdSLEtBQUssS0FBSztNQUNSLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQztVQUM5QixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUM7V0FDbkI7UUFDSCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUMvQixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtVQUNmLElBQUksT0FBT0EsTUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUU7WUFDMUNBLE1BQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNyQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7V0FDUjtTQUNGO1FBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ1YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUM7T0FDM0I7TUFDRCxJQUFJLFVBQVUsRUFBRTs7O1FBR2QsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVUsRUFBRTtVQUNyQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2NBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEdBQUM7U0FDckM7WUFDQyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxHQUFDO09BQ3JDO01BQ0QsTUFBTTs7SUFFUjtNQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLEdBQUcsT0FBTyxDQUFDLENBQUM7R0FDN0Q7RUFDRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7RUFDZCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7RUFDeEIsT0FBTyxJQUFJLENBQUM7Q0FDYixDQUFDOztBQUVGLFdBQVcsR0FBRyxHQUFHLENBQUM7QUFDbEIsU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO0VBQ2hELElBQUksT0FBTyxLQUFLLENBQUMsS0FBSyxRQUFRLEVBQUU7SUFDOUIsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUNuQixLQUFLLEdBQUcsU0FBUyxDQUFDO0dBQ25COztFQUVELElBQUk7SUFDRixPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQztHQUNwRSxDQUFDLE9BQU8sRUFBRSxFQUFFO0lBQ1gsT0FBTyxJQUFJLENBQUM7R0FDYjtDQUNGOztBQUVELFlBQVksR0FBRyxJQUFJLENBQUM7QUFDcEIsU0FBUyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRTtFQUNoQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUU7SUFDMUIsT0FBTyxJQUFJLENBQUM7R0FDYixNQUFNO0lBQ0wsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3pCLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN6QixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO01BQ2hELEtBQUssSUFBSSxHQUFHLElBQUksRUFBRSxFQUFFO1FBQ2xCLElBQUksR0FBRyxLQUFLLE9BQU8sSUFBSSxHQUFHLEtBQUssT0FBTyxJQUFJLEdBQUcsS0FBSyxPQUFPLEVBQUU7VUFDekQsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQztXQUNsQjtTQUNGO09BQ0Y7TUFDRCxPQUFPLFlBQVksQ0FBQztLQUNyQjtJQUNELEtBQUssSUFBSSxHQUFHLElBQUksRUFBRSxFQUFFO01BQ2xCLElBQUksR0FBRyxLQUFLLE9BQU8sSUFBSSxHQUFHLEtBQUssT0FBTyxJQUFJLEdBQUcsS0FBSyxPQUFPLEVBQUU7UUFDekQsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1VBQ3ZCLE9BQU8sR0FBRyxDQUFDO1NBQ1o7T0FDRjtLQUNGO0dBQ0Y7Q0FDRjs7QUFFRCwwQkFBMEIsR0FBRyxrQkFBa0IsQ0FBQzs7QUFFaEQsSUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDO0FBQ3pCLFNBQVMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtFQUNoQyxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzNCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7O0VBRTNCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtJQUNoQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7R0FDUjs7RUFFRCxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztTQUNwQixDQUFDLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO1NBQ25CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1YsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO1NBQ1QsQ0FBQyxDQUFDO0NBQ1Y7O0FBRUQsMkJBQTJCLEdBQUcsbUJBQW1CLENBQUM7QUFDbEQsU0FBUyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ2pDLE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0NBQ2pDOztBQUVELGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDdEIsU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRTtFQUN2QixPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUM7Q0FDbkM7O0FBRUQsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUN0QixTQUFTLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFO0VBQ3ZCLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQztDQUNuQzs7QUFFRCxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFNBQVMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUU7RUFDdkIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDO0NBQ25DOztBQUVELGVBQWUsR0FBRyxPQUFPLENBQUM7QUFDMUIsU0FBUyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7RUFDNUIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0NBQzNEOztBQUVELG9CQUFvQixHQUFHLFlBQVksQ0FBQztBQUNwQyxTQUFTLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQzFCLE9BQU8sT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Q0FDNUI7O0FBRUQsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDO0FBQzVCLFNBQVMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFO0VBQzdCLE9BQU8sT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Q0FDN0I7O0FBRUQsWUFBWSxHQUFHLElBQUksQ0FBQztBQUNwQixTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0VBQ3pCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFDOUIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDckMsQ0FBQyxDQUFDO0NBQ0o7O0FBRUQsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUN0QixTQUFTLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0VBQzFCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFDOUIsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDdEMsQ0FBQyxDQUFDO0NBQ0o7O0FBRUQsVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNoQixTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRTtFQUN2QixPQUFPLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNqQzs7QUFFRCxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFO0VBQ3ZCLE9BQU8sT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2pDOztBQUVELFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDaEIsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7RUFDdkIsT0FBTyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDbkM7O0FBRUQsV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUNsQixTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRTtFQUN4QixPQUFPLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUNuQzs7QUFFRCxXQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFO0VBQ3hCLE9BQU8sT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ2xDOztBQUVELFdBQVcsR0FBRyxHQUFHLENBQUM7QUFDbEIsU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7RUFDeEIsT0FBTyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDbEM7O0FBRUQsV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUNsQixTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7RUFDNUIsSUFBSSxHQUFHLENBQUM7RUFDUixRQUFRLEVBQUU7SUFDUixLQUFLLEtBQUs7TUFDUixJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBQztNQUN6QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBQztNQUN6QyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztNQUNkLE1BQU07SUFDUixLQUFLLEtBQUs7TUFDUixJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBQztNQUN6QyxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBQztNQUN6QyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztNQUNkLE1BQU07SUFDUixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTTtJQUMzRCxLQUFLLElBQUksRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNO0lBQ3pDLEtBQUssR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU07SUFDdkMsS0FBSyxJQUFJLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTTtJQUN6QyxLQUFLLEdBQUcsRUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNO0lBQ3ZDLEtBQUssSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU07SUFDekMsU0FBUyxNQUFNLElBQUksU0FBUyxDQUFDLG9CQUFvQixHQUFHLEVBQUUsQ0FBQyxDQUFDO0dBQ3pEO0VBQ0QsT0FBTyxHQUFHLENBQUM7Q0FDWjs7QUFFRCxrQkFBa0IsR0FBRyxVQUFVLENBQUM7QUFDaEMsU0FBUyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtFQUMvQixJQUFJLElBQUksWUFBWSxVQUFVLEVBQUU7SUFDOUIsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUs7UUFDdEIsT0FBTyxJQUFJLEdBQUM7O1FBRVosSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUM7R0FDckI7O0VBRUQsSUFBSSxFQUFFLElBQUksWUFBWSxVQUFVLENBQUM7TUFDL0IsT0FBTyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUM7O0VBRXJDLEtBQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0VBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0VBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7O0VBRWpCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHO01BQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFDOztNQUVoQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUM7O0VBRW5ELEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Q0FDckI7O0FBRUQsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ2IsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsU0FBUyxJQUFJLEVBQUU7RUFDMUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0VBQzFELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7O0VBRXRCLElBQUksQ0FBQyxDQUFDO01BQ0osTUFBTSxJQUFJLFNBQVMsQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsR0FBQzs7RUFFckQsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDckIsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLEdBQUc7TUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLEdBQUM7OztFQUdyQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNQLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUFDOztNQUVsQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUM7Q0FDOUMsQ0FBQzs7QUFFRixVQUFVLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxXQUFXO0VBQ3pDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztDQUNuQixDQUFDOztBQUVGLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFNBQVMsT0FBTyxFQUFFO0VBQzVDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDOztFQUU5QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssR0FBRztNQUNyQixPQUFPLElBQUksR0FBQzs7RUFFZCxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVE7TUFDN0IsT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUM7O0VBRTVDLE9BQU8sR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQzdELENBQUM7O0FBRUYsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxJQUFJLEVBQUUsS0FBSyxFQUFFO0VBQ3RELElBQUksRUFBRSxJQUFJLFlBQVksVUFBVSxDQUFDLEVBQUU7SUFDakMsTUFBTSxJQUFJLFNBQVMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0dBQ2pEOztFQUVELElBQUksUUFBUSxDQUFDOztFQUViLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxFQUFFLEVBQUU7SUFDeEIsUUFBUSxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDeEMsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDL0MsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssRUFBRSxFQUFFO0lBQy9CLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0dBQ2hEOztFQUVELElBQUksdUJBQXVCO0lBQ3pCLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxHQUFHO0tBQy9DLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssR0FBRyxDQUFDLENBQUM7RUFDcEQsSUFBSSx1QkFBdUI7SUFDekIsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLEdBQUc7S0FDL0MsSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxHQUFHLENBQUMsQ0FBQztFQUNwRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztFQUM3RCxJQUFJLDRCQUE0QjtJQUM5QixDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSTtLQUNoRCxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUFDO0VBQ3JELElBQUksMEJBQTBCO0lBQzVCLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztLQUN4QyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssR0FBRztLQUNoRCxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDckQsSUFBSSw2QkFBNkI7SUFDL0IsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO0tBQ3hDLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxHQUFHO0tBQ2hELElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzs7RUFFckQsT0FBTyx1QkFBdUIsSUFBSSx1QkFBdUI7S0FDdEQsVUFBVSxJQUFJLDRCQUE0QixDQUFDO0lBQzVDLDBCQUEwQixJQUFJLDZCQUE2QixDQUFDO0NBQy9ELENBQUM7OztBQUdGLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDdEIsU0FBUyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtFQUMzQixJQUFJLEtBQUssWUFBWSxLQUFLLEVBQUU7SUFDMUIsSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLEtBQUssRUFBRTtNQUN6QixPQUFPLEtBQUssQ0FBQztLQUNkLE1BQU07TUFDTCxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDcEM7R0FDRjs7RUFFRCxJQUFJLEtBQUssWUFBWSxVQUFVLEVBQUU7SUFDL0IsT0FBTyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0dBQ3RDOztFQUVELElBQUksRUFBRSxJQUFJLFlBQVksS0FBSyxDQUFDO01BQzFCLE9BQU8sSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxHQUFDOztFQUVqQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzs7O0VBR25CLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO0VBQ2pCLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxLQUFLLEVBQUU7SUFDdkQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0dBQ3RDLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFOztJQUUxQixPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUM7R0FDakIsQ0FBQyxDQUFDOztFQUVILElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRTtJQUNwQixNQUFNLElBQUksU0FBUyxDQUFDLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxDQUFDO0dBQ3ZEOztFQUVELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztDQUNmOztBQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFdBQVc7RUFDbEMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEtBQUssRUFBRTtJQUN4QyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7R0FDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztFQUNyQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7Q0FDbkIsQ0FBQzs7QUFFRixLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxXQUFXO0VBQ3BDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztDQUNuQixDQUFDOztBQUVGLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLFNBQVMsS0FBSyxFQUFFO0VBQzNDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7RUFDdkIsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztFQUNyQixLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzs7RUFFN0IsSUFBSSxFQUFFLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQztFQUN4RCxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7RUFDekMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDOztFQUUvQixLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztFQUNqRSxLQUFLLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDOzs7RUFHcEQsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7OztFQUd2RCxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQzs7O0VBR3ZELEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7Ozs7RUFLckMsSUFBSSxNQUFNLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7RUFDMUQsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUU7SUFDNUMsT0FBTyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0dBQ3JDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQzFCLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTs7SUFFZCxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksRUFBRTtNQUM5QixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzdCLENBQUMsQ0FBQztHQUNKO0VBQ0QsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLEVBQUU7SUFDM0IsT0FBTyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDcEMsQ0FBQyxDQUFDOztFQUVILE9BQU8sR0FBRyxDQUFDO0NBQ1osQ0FBQzs7QUFFRixLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLEtBQUssRUFBRSxLQUFLLEVBQUU7RUFDbEQsSUFBSSxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsRUFBRTtJQUM3QixNQUFNLElBQUksU0FBUyxDQUFDLHFCQUFxQixDQUFDLENBQUM7R0FDNUM7O0VBRUQsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLGVBQWUsRUFBRTtJQUM3QyxPQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsU0FBUyxjQUFjLEVBQUU7TUFDcEQsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLGdCQUFnQixFQUFFO1FBQy9DLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFNBQVMsZUFBZSxFQUFFO1VBQ3RELE9BQU8sY0FBYyxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDMUQsQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBQ0osQ0FBQzs7O0FBR0YscUJBQXFCLEdBQUcsYUFBYSxDQUFDO0FBQ3RDLFNBQVMsYUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7RUFDbkMsT0FBTyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRTtJQUNwRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7TUFDMUIsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDO0tBQ2hCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQ2hDLENBQUMsQ0FBQztDQUNKOzs7OztBQUtELFNBQVMsZUFBZSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7RUFDcEMsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztFQUNwQixJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztFQUNsQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0VBQ3JCLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0VBQ2xDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7RUFDdEIsSUFBSSxHQUFHLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDbkMsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztFQUN0QixJQUFJLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztFQUNqQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0VBQ3JCLE9BQU8sSUFBSSxDQUFDO0NBQ2I7O0FBRUQsU0FBUyxHQUFHLENBQUMsRUFBRSxFQUFFO0VBQ2YsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLEtBQUssR0FBRyxJQUFJLEVBQUUsS0FBSyxHQUFHLENBQUM7Q0FDdEQ7Ozs7Ozs7O0FBUUQsU0FBUyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtFQUNsQyxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxFQUFFO0lBQ2pELE9BQU8sWUFBWSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztHQUNsQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2Q7O0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtFQUNqQyxJQUFJLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztFQUMzQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtJQUM5QyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDckMsSUFBSSxHQUFHLENBQUM7O0lBRVIsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ1IsR0FBRyxHQUFHLEVBQUUsR0FBQztTQUNOLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNiLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLFFBQVEsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUM7U0FDM0MsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDOztRQUViLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFDO1NBQzNELElBQUksRUFBRSxFQUFFO01BQ1gsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO01BQzdCLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO1VBQ3RCLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFDO01BQ2hCLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFO1lBQ2pDLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztLQUN4Qzs7UUFFQyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1lBQzVCLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBQzs7SUFFekMsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMzQixPQUFPLEdBQUcsQ0FBQztHQUNaLENBQUMsQ0FBQztDQUNKOzs7Ozs7OztBQVFELFNBQVMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7RUFDbEMsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRTtJQUNqRCxPQUFPLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDbEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNkOztBQUVELFNBQVMsWUFBWSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7RUFDakMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDNUIsSUFBSSxDQUFDLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDM0MsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7SUFDOUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3JDLElBQUksR0FBRyxDQUFDOztJQUVSLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNSLEdBQUcsR0FBRyxFQUFFLEdBQUM7U0FDTixJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDYixHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFDO1NBQzNDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQ2YsSUFBSSxDQUFDLEtBQUssR0FBRztVQUNYLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFDOztVQUU5RCxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUM7S0FDekQsTUFBTSxJQUFJLEVBQUUsRUFBRTtNQUNiLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQztNQUM3QixJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRztVQUN0QixFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBQztNQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUU7UUFDYixJQUFJLENBQUMsS0FBSyxHQUFHO1lBQ1gsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pDLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUM7O1lBRTFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUNqQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUM7T0FDMUM7VUFDQyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRTtjQUNqQyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFDO0tBQ2xDLE1BQU07TUFDTCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7TUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUU7UUFDYixJQUFJLENBQUMsS0FBSyxHQUFHO1lBQ1gsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztnQkFDNUIsSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBQzs7WUFFMUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztnQkFDNUIsSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFDO09BQzFDO1VBQ0MsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztjQUM1QixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFDO0tBQ2xDOztJQUVELEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDM0IsT0FBTyxHQUFHLENBQUM7R0FDWixDQUFDLENBQUM7Q0FDSjs7QUFFRCxTQUFTLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0VBQ25DLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDckMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRTtJQUMxQyxPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDbkMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNkOztBQUVELFNBQVMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7RUFDbEMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztFQUNuQixJQUFJLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUM3QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFNBQVMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7SUFDdEQsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5QyxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEIsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQzs7SUFFZCxJQUFJLElBQUksS0FBSyxHQUFHLElBQUksSUFBSTtRQUN0QixJQUFJLEdBQUcsRUFBRSxHQUFDOztJQUVaLElBQUksRUFBRSxFQUFFO01BQ04sSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7O1FBRWhDLEdBQUcsR0FBRyxRQUFRLENBQUM7T0FDaEIsTUFBTTs7UUFFTCxHQUFHLEdBQUcsR0FBRyxDQUFDO09BQ1g7S0FDRixNQUFNLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTs7TUFFdkIsSUFBSSxFQUFFO1VBQ0osQ0FBQyxHQUFHLENBQUMsR0FBQztNQUNSLElBQUksRUFBRTtVQUNKLENBQUMsR0FBRyxDQUFDLEdBQUM7O01BRVIsSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFOzs7O1FBSWhCLElBQUksR0FBRyxJQUFJLENBQUM7UUFDWixJQUFJLEVBQUUsRUFBRTtVQUNOLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7VUFDWCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1VBQ04sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNQLE1BQU0sSUFBSSxFQUFFLEVBQUU7VUFDYixDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1VBQ1gsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNQO09BQ0YsTUFBTSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7OztRQUd4QixJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ1gsSUFBSSxFQUFFO1lBQ0osQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBQzs7WUFFWCxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFDO09BQ2Q7O01BRUQsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0tBQ3BDLE1BQU0sSUFBSSxFQUFFLEVBQUU7TUFDYixHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDO0tBQy9DLE1BQU0sSUFBSSxFQUFFLEVBQUU7TUFDYixHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztLQUMvRDs7SUFFRCxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxDQUFDOztJQUU1QixPQUFPLEdBQUcsQ0FBQztHQUNaLENBQUMsQ0FBQztDQUNKOzs7O0FBSUQsU0FBUyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtFQUNqQyxLQUFLLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQzs7RUFFbkMsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztDQUMxQzs7Ozs7OztBQU9ELFNBQVMsYUFBYSxDQUFDLEVBQUU7dUJBQ0YsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFO3VCQUN6QixFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRTs7RUFFOUMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDO01BQ1QsSUFBSSxHQUFHLEVBQUUsR0FBQztPQUNQLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztNQUNkLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLE1BQU0sR0FBQztPQUN2QixJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7TUFDZCxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBQzs7TUFFbkMsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUM7O0VBRXJCLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztNQUNULEVBQUUsR0FBRyxFQUFFLEdBQUM7T0FDTCxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7TUFDZCxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBQztPQUMzQixJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7TUFDZCxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFDO09BQ3BDLElBQUksR0FBRztNQUNWLEVBQUUsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFDOztNQUVqRCxFQUFFLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBQzs7RUFFakIsT0FBTyxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDO0NBQ2pDOzs7O0FBSUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsU0FBUyxPQUFPLEVBQUU7OztFQUN2QyxJQUFJLENBQUMsT0FBTztNQUNWLE9BQU8sS0FBSyxHQUFDOztFQUVmLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUTtNQUM3QixPQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBQzs7RUFFNUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3hDLElBQUksT0FBTyxDQUFDQSxNQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztRQUMvQixPQUFPLElBQUksR0FBQztHQUNmO0VBQ0QsT0FBTyxLQUFLLENBQUM7Q0FDZCxDQUFDOztBQUVGLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUU7RUFDN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDbkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLE9BQU8sS0FBSyxHQUFDO0dBQ2hCOztFQUVELElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7Ozs7OztJQU03QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUNuQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO01BQ3JCLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxHQUFHO1VBQ3ZCLFdBQVM7O01BRVgsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3ZDLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDNUIsSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQyxLQUFLO1lBQy9CLE9BQU8sQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLEtBQUs7WUFDL0IsT0FBTyxDQUFDLEtBQUssS0FBSyxPQUFPLENBQUMsS0FBSztZQUNqQyxPQUFPLElBQUksR0FBQztPQUNmO0tBQ0Y7OztJQUdELE9BQU8sS0FBSyxDQUFDO0dBQ2Q7O0VBRUQsT0FBTyxJQUFJLENBQUM7Q0FDYjs7QUFFRCxpQkFBaUIsR0FBRyxTQUFTLENBQUM7QUFDOUIsU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7RUFDeEMsSUFBSTtJQUNGLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDakMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtJQUNYLE9BQU8sS0FBSyxDQUFDO0dBQ2Q7RUFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Q0FDNUI7O0FBRUQscUJBQXFCLEdBQUcsYUFBYSxDQUFDO0FBQ3RDLFNBQVMsYUFBYSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFO0VBQzdDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztFQUNmLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztFQUNqQixJQUFJO0lBQ0YsSUFBSSxRQUFRLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0dBQ3hDLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDWCxPQUFPLElBQUksQ0FBQztHQUNiO0VBQ0QsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtJQUM1QixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDcEIsSUFBSSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ25DLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDUixLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO09BQ2hDO0tBQ0Y7R0FDRixFQUFDO0VBQ0YsT0FBTyxHQUFHLENBQUM7Q0FDWjs7QUFFRCxxQkFBcUIsR0FBRyxhQUFhLENBQUM7QUFDdEMsU0FBUyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7RUFDN0MsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0VBQ2YsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0VBQ2pCLElBQUk7SUFDRixJQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7R0FDeEMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtJQUNYLE9BQU8sSUFBSSxDQUFDO0dBQ2I7RUFDRCxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO0lBQzVCLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNwQixJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2xDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDUixLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO09BQ2hDO0tBQ0Y7R0FDRixFQUFDO0VBQ0YsT0FBTyxHQUFHLENBQUM7Q0FDWjs7QUFFRCxrQkFBa0IsR0FBRyxVQUFVLENBQUM7QUFDaEMsU0FBUyxVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtFQUNoQyxJQUFJOzs7SUFHRixPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDO0dBQzdDLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDWCxPQUFPLElBQUksQ0FBQztHQUNiO0NBQ0Y7OztBQUdELFdBQVcsR0FBRyxHQUFHLENBQUM7QUFDbEIsU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7RUFDbEMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7Q0FDNUM7OztBQUdELFdBQVcsR0FBRyxHQUFHLENBQUM7QUFDbEIsU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7RUFDbEMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7Q0FDNUM7O0FBRUQsZUFBZSxHQUFHLE9BQU8sQ0FBQztBQUMxQixTQUFTLE9BQU8sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7RUFDNUMsT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztFQUNyQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDOztFQUVoQyxJQUFJLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUM7RUFDbkMsUUFBUSxJQUFJO0lBQ1YsS0FBSyxHQUFHO01BQ04sSUFBSSxHQUFHLEVBQUUsQ0FBQztNQUNWLEtBQUssR0FBRyxHQUFHLENBQUM7TUFDWixJQUFJLEdBQUcsRUFBRSxDQUFDO01BQ1YsSUFBSSxHQUFHLEdBQUcsQ0FBQztNQUNYLEtBQUssR0FBRyxJQUFJLENBQUM7TUFDYixNQUFNO0lBQ1IsS0FBSyxHQUFHO01BQ04sSUFBSSxHQUFHLEVBQUUsQ0FBQztNQUNWLEtBQUssR0FBRyxHQUFHLENBQUM7TUFDWixJQUFJLEdBQUcsRUFBRSxDQUFDO01BQ1YsSUFBSSxHQUFHLEdBQUcsQ0FBQztNQUNYLEtBQUssR0FBRyxJQUFJLENBQUM7TUFDYixNQUFNO0lBQ1I7TUFDRSxNQUFNLElBQUksU0FBUyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7R0FDaEU7OztFQUdELElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUU7SUFDcEMsT0FBTyxLQUFLLENBQUM7R0FDZDs7Ozs7RUFLRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDekMsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFL0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2hCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQzs7SUFFZixXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsVUFBVSxFQUFFO01BQ3ZDLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxHQUFHLEVBQUU7UUFDN0IsVUFBVSxHQUFHLElBQUksVUFBVSxDQUFDLFNBQVMsRUFBQztPQUN2QztNQUNELElBQUksR0FBRyxJQUFJLElBQUksVUFBVSxDQUFDO01BQzFCLEdBQUcsR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDO01BQ3hCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRTtRQUMvQyxJQUFJLEdBQUcsVUFBVSxDQUFDO09BQ25CLE1BQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFO1FBQ3JELEdBQUcsR0FBRyxVQUFVLENBQUM7T0FDbEI7S0FDRixDQUFDLENBQUM7Ozs7SUFJSCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxFQUFFO01BQ3JELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7Ozs7SUFJRCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxRQUFRLEtBQUssSUFBSTtRQUN2QyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtNQUM5QixPQUFPLEtBQUssQ0FBQztLQUNkLE1BQU0sSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtNQUM5RCxPQUFPLEtBQUssQ0FBQztLQUNkO0dBQ0Y7RUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOztBQUVELGtCQUFrQixHQUFHLFVBQVUsQ0FBQztBQUNoQyxTQUFTLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFO0VBQ2xDLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDbkMsT0FBTyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztDQUN4RTs7QUFFRCxrQkFBa0IsR0FBRyxVQUFVLENBQUM7QUFDaEMsU0FBUyxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUU7RUFDakMsRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUM7RUFDekIsRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUM7RUFDekIsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztDQUN6Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDL3dDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOzs7OztBQVFBLEFBQU8sU0FBUyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUU7RUFDbkNOLElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDO0VBQy9CLElBQUksT0FBTyxFQUFFO0lBQ1gsT0FBTyxDQUFDO0dBQ1Q7O0VBRUQsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEtBQUssUUFBUSxHQUFHLENBQUMsR0FBRyxHQUFFO0VBQ3BDQSxJQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBQztFQUMxQkQsSUFBSSxDQUFDLEdBQUcsRUFBQztFQUNUQyxJQUFNLE1BQU0sR0FBRyxHQUFFOztFQUVqQixPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDWkEsSUFBTSxDQUFDLEdBQUcsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFHO0lBQ3JFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDO0lBQ2QsQ0FBQyxHQUFFO0dBQ0o7O0VBRUQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztDQUN4Qjs7Ozs7Ozs7Ozs7OztBQWFELEFBQU8sU0FBUyxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUU7RUFDNUNBLElBQU0sTUFBTSxHQUFHO0lBQ2IsV0FBVyxFQUFFLElBQUk7SUFDakIsU0FBUyxFQUFFLENBQUM7SUFDWixJQUFJLEVBQUUsSUFBSTtJQUNYO0VBQ0RBLElBQU0sTUFBTSxHQUFHLFVBQVUsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUU7SUFDM0MsT0FBTyxZQUFZLEdBQUcsR0FBRyxHQUFHLGtCQUFrQjtRQUMxQyxHQUFHLEdBQUcsb0JBQW9CLEdBQUcsUUFBUTtJQUMxQztFQUNEQSxJQUFNLElBQUksR0FBRyxHQUFHLENBQUMsV0FBVyxHQUFFOztFQUU5QixNQUFNLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBQzs7RUFFaEQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNsQyxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUk7R0FDbkI7T0FDSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ3hDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsS0FBSTtHQUNuQjtPQUNJLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDekMsTUFBTSxDQUFDLElBQUksR0FBRyxLQUFJO0dBQ25CO09BQ0ksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUN6QyxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUk7R0FDbkI7O0VBRUQsT0FBTyxNQUFNO0NBQ2Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlDRCxBQUFPLFNBQVMsS0FBSyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUU7RUFDekMsVUFBVSxHQUFHLFVBQVUsSUFBSSxNQUFNLENBQUMsY0FBYTtFQUMvQyxVQUFVLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsR0FBRyxHQUFFOztFQUV4REQsSUFBSSxNQUFNLEdBQUc7SUFDWCxXQUFXLEVBQUUsS0FBSztJQUNuQjs7RUFFRCxJQUFJYSxPQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxFQUFFO0lBQ2hDYixJQUFJLGVBQWUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7TUFDbEQsTUFBTSxFQUFFLE1BQU07d0JBQ2QsZ0JBQWdCO0tBQ2pCLEVBQUM7O0lBRUYsZUFBZSxHQUFHLENBQUMsQ0FBQyxnQkFBZTs7SUFFbkMsTUFBTSxHQUFHLGVBQWUsR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxlQUFlLENBQUMsR0FBRyxPQUFNO0dBQzVFO09BQ0k7SUFDSCxNQUFNLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sR0FBRyxHQUFFOztJQUU1Q0MsSUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsSUFBSSxTQUFRO0lBQ2hEQSxJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsV0FBVyxHQUFFO0lBQ3hDQSxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRTs7SUFFcEMsS0FBS0EsSUFBTSxDQUFDLElBQUksVUFBVSxFQUFFO01BQzFCQSxJQUFNLEdBQUcsR0FBRyxFQUFDO01BQ2JBLElBQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxXQUFXLEdBQUU7TUFDbENBLElBQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEVBQUM7TUFDekJBLElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksRUFBQztNQUNsREEsSUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFDO01BQzFEQSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFDOztNQUV4QixJQUFJLFFBQVEsSUFBSSxTQUFTLEVBQUU7UUFDekJBLElBQU0sQ0FBQyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBQztRQUNwQ0EsSUFBTSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFDOztRQUV6QyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1VBQzFCLE1BQU0sR0FBRyxRQUFRLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUM7VUFDckMsS0FBSztTQUNOO09BQ0Y7V0FDSSxJQUFJLGFBQWEsRUFBRTtRQUN0QkEsSUFBTSxTQUFTLEdBQUdZLE9BQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxPQUFPLEdBQUcsUUFBUSxHQUFHLENBQUMsUUFBUSxFQUFDO1FBQ3JFLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7VUFDL0IsTUFBTSxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBQztVQUNyQyxLQUFLO1NBQ047T0FDRjtLQUNGO0dBQ0Y7O0VBRUQsT0FBTyxNQUFNO0NBQ2Q7O0FDM0tEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsQUFBTyxTQUFTLFdBQVcsRUFBRSxHQUFHLEVBQUUsT0FBWSxFQUFFO21DQUFQLEdBQUc7OztFQUUxQyxBQUE0QztJQUMxQyxPQUFPLENBQUMsS0FBSyw0Q0FBd0MsT0FBTyxDQUFDLE1BQUssbUJBQWEsR0FBRyxDQUFDLEdBQUUsU0FBSTtJQUN6RixnQkFBZ0IsQ0FBQyxPQUFPLEVBQUM7R0FDMUI7OztFQUdELElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxTQUFTLEVBQUU7SUFDeEIsT0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7TUFDcEIsTUFBTSxFQUFFLE1BQU07TUFDZCxNQUFNLEVBQUUsYUFBYTtNQUNyQixJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUM7S0FDaEIsQ0FBQyxDQUFDO0dBQ0o7OztPQUdJLEFBQTRDO0lBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0VBQThELEVBQUM7R0FDN0U7Q0FDRjs7Ozs7O0FBTUQsQUFBTyxTQUFTLGdCQUFnQixFQUFFLE9BQVksRUFBRTttQ0FBUCxHQUFHOztFQUMxQyxJQUFRLEtBQUssaUJBQVk7RUFDekIsSUFBSSxLQUFLLEVBQUU7SUFDVCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssY0FBYyxFQUFFO01BQ3pELE9BQU8sQ0FBQyxJQUFJLHlDQUFzQyxLQUFLLDJCQUFzQjtNQUM3RSxPQUFPLEtBQUs7S0FDYjtJQUNELE9BQU8sSUFBSTtHQUNaO0VBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyx5RUFBeUUsRUFBQztFQUN2RixPQUFPLEtBQUs7Q0FDYjs7QUN2REQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7O0FBa0JBLEFBQU8sU0FBUyxTQUFTLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0VBQ2xELE9BQU8sQ0FBQyxLQUFLLG9DQUFpQyxJQUFJLEdBQUc7OztFQUdyRGIsSUFBSSxVQUFTO0VBQ2IsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDekIsU0FBUyxHQUFHLGdCQUFnQixDQUFDLElBQUksRUFBQztHQUNuQztPQUNJLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQzFCLFNBQVMsR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFDOzs7SUFHaEMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsRUFBRTtNQUMzQyxPQUFPLElBQUksS0FBSyw2QkFBMEIsSUFBSSxFQUFHO0tBQ2xEO0dBQ0Y7T0FDSTtJQUNILE9BQU8sSUFBSSxLQUFLLDZCQUEwQixJQUFJLEVBQUc7R0FDbEQ7OztFQUdELE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUU7O0VBRTVDLElBQUksT0FBTyxNQUFNLENBQUMsa0JBQWtCLEtBQUssUUFBUTtJQUMvQyxPQUFPLE1BQU0sQ0FBQyxrQkFBa0IsS0FBSyxRQUFRO0lBQzdDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO01BQ3pDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO0lBQzlCLE9BQU8sSUFBSSxLQUFLLENBQUMseUJBQXNCLE1BQU0sQ0FBQyxtQkFBa0IsTUFBRztNQUNqRSwwQkFBdUIsTUFBTSxDQUFDLGtCQUFrQixDQUFFLENBQUM7R0FDdEQ7O0VBRURDLElBQU0sZUFBZSxHQUFHbUIsS0FBZSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUM7O0VBRXpELElBQUksZUFBZSxDQUFDLFdBQVcsRUFBRTtJQUMvQixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7TUFDYixNQUFNLEVBQUUsY0FBYztNQUN0QixNQUFNLEVBQUUsT0FBTztNQUNmLElBQUksRUFBRTtRQUNKLGVBQWUsQ0FBQyxTQUFTO1FBQ3pCLGVBQWUsQ0FBQyxJQUFJO1FBQ3BCLGVBQWUsQ0FBQyxZQUFZO09BQzdCO0tBQ0YsQ0FBQyxFQUFDO0lBQ0gsT0FBTyxJQUFJLEtBQUssa0JBQWMsZUFBZSxDQUFDLEtBQUksWUFBTSxlQUFlLENBQUMsWUFBWSxHQUFHO0dBQ3hGOzs7RUFHRCxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDbkIsV0FBVyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFDO0dBQ2xDOzs7RUFHRCxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztDQUM1RDs7QUN6RkQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7Ozs7OztBQXFCQSxBQUFPbkIsSUFBTSxRQUFRLEdBQUcsVUFBVSxHQUFHLEVBQUUsSUFBSSxFQUFXOzs7O3lEQUFDO0VBQ3JELE9BQU8sQ0FBQyxLQUFLLHlDQUFzQyxJQUFJLEdBQUc7Ozs7OztFQU0xREQsSUFBSSxPQUFPLEVBQUUsV0FBVTtFQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0lBQ25CLFVBQVUsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFDO0dBQ3JCO09BQ0k7SUFDSCxVQUFVLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBQztHQUNyQjtFQUNELElBQUksT0FBTyxVQUFVLEtBQUssVUFBVSxFQUFFO0lBQ3BDLE9BQU8sR0FBRyxXQUFVO0lBQ3BCLFVBQVUsR0FBRyxLQUFJO0dBQ2xCOzs7RUFHRCxJQUFJLE9BQU8sRUFBRTtJQUNYQyxJQUFNLENBQUMsYUFBSSxJQUFJLEVBQUU7TUFDZixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN6QkEsSUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxFQUFDO1FBQ3hDLE9BQU8sc0JBQXNCLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQztPQUM5QztNQUNELElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3RCQSxJQUFNb0IsV0FBUyxHQUFHLGdCQUFnQixDQUFDLElBQUksRUFBQztRQUN4QyxPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUNBLFdBQVMsQ0FBQztPQUNwQztNQUNELElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUM3Q3BCLElBQU1vQixXQUFTLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBQztRQUN0QyxPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUNBLFdBQVMsQ0FBQztPQUNwQztNQUNGO0lBQ0RwQixJQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUM7SUFDeEIsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBQztJQUN4QixVQUFVLEdBQUcsQ0FBQyxDQUFDLFFBQU87R0FDdkI7OztFQUdELElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ3pCQSxJQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUM7SUFDeEMsdUJBQXVCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUM7R0FDcEQ7T0FDSSxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUMzQkEsSUFBTW9CLFdBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUM7SUFDeEMsV0FBVyxTQUFDLEVBQUMsS0FBQyxDQUFDQSxXQUFTLENBQUMsR0FBRSxVQUFVLFFBQUc7R0FDekM7T0FDSSxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUM3QnBCLElBQU1vQixXQUFTLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBQztJQUN0QyxHQUFHLENBQUMsYUFBYSxDQUFDQSxXQUFTLENBQUMsR0FBRyxXQUFVO0dBQzFDO09BQ0ksSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDMUJwQixJQUFNb0IsV0FBUyxHQUFHLGNBQWMsQ0FBQyxJQUFJLEVBQUM7SUFDdEMsSUFBSSxVQUFVLENBQUMsUUFBUTtRQUNuQixVQUFVLENBQUMsS0FBSztRQUNoQixVQUFVLENBQUMsT0FBTyxFQUFFOzs7O01BSXRCLHVCQUF1QixDQUFDLEdBQUcsRUFBRUEsV0FBUyxFQUFFLFVBQVUsRUFBQztLQUNwRDtTQUNJO01BQ0gsR0FBRyxDQUFDLGFBQWEsQ0FBQ0EsV0FBUyxDQUFDLEdBQUcsV0FBVTtLQUMxQztHQUNGO0VBQ0Y7Ozs7O0FBS0QsQUFBTyxTQUFTQyxVQUFRLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7RUFDNUMsT0FBTyxDQUFDLElBQUksQ0FBQyw0RUFBNEUsRUFBQztFQUMxRix1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztDQUM1Qzs7QUNsSEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJBOzs7OztBQU9BLEFBQU8sU0FBUyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtFQUNsQyxPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLElBQUkscUJBQWlCLEdBQUcsQ0FBQyxHQUFFLFNBQUk7RUFDNUVyQixJQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRTtFQUNqQixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7SUFDZCxJQUFJLE9BQU8sRUFBRSxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUU7TUFDeEMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUM7S0FDckI7U0FDSTtNQUNILE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFDO0tBQ2pCO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUU7SUFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsRUFBRSxFQUFFLEVBQUM7SUFDL0QsTUFBTTtHQUNQO0VBQ0QsT0FBTyxJQUFJLEtBQUssc0JBQWtCLElBQUksU0FBSTtDQUMzQzs7Ozs7O0FBTUQsQUFBTyxTQUFTLE9BQU8sRUFBRSxHQUFHLEVBQUU7RUFDNUIsT0FBTyxDQUFDLEtBQUssMkNBQXVDLEdBQUcsQ0FBQyxHQUFFLFNBQUk7O0VBRTlELElBQUksR0FBRyxDQUFDLEVBQUUsRUFBRTtJQUNWLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFDO0dBQ2xCOztFQUVELEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRTtFQUNYLEdBQUcsQ0FBQyxPQUFPLEdBQUcsS0FBSTtFQUNsQixHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUk7RUFDakIsR0FBRyxDQUFDLEVBQUUsR0FBRyxLQUFJO0VBQ2IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsZUFBZSxHQUFFO0VBQ3BDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFFO0VBQ2pCLEdBQUcsQ0FBQyxHQUFHLEdBQUcsS0FBSTtFQUNkLEdBQUcsQ0FBQyxrQkFBa0IsR0FBRyxLQUFJO0VBQzdCLEdBQUcsQ0FBQyxhQUFhLEdBQUcsS0FBSTtDQUN6Qjs7Ozs7O0FBTUQsQUFBTyxTQUFTLFNBQVMsRUFBRSxFQUFFLEVBQUU7RUFDN0IsT0FBTyxFQUFFLENBQUMsS0FBSTtFQUNkLE9BQU8sRUFBRSxDQUFDLFVBQVM7RUFDbkIsT0FBTyxFQUFFLENBQUMsS0FBSTtFQUNkLE9BQU8sRUFBRSxDQUFDLE1BQUs7RUFDZixPQUFPLEVBQUUsQ0FBQyxLQUFJO0VBQ2QsT0FBTyxFQUFFLENBQUMsU0FBUTtFQUNsQixPQUFPLEVBQUUsQ0FBQyxTQUFRO0VBQ2xCLE9BQU8sRUFBRSxDQUFDLFFBQU87RUFDakIsT0FBTyxFQUFFLENBQUMsVUFBUztFQUNuQixPQUFPLEVBQUUsQ0FBQyxRQUFPOzs7RUFHakIsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFO0lBQ2hCRCxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU07SUFDdEMsT0FBTyxZQUFZLEVBQUUsRUFBRTtNQUNyQixFQUFFLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDLFFBQVEsR0FBRTtLQUN0QztJQUNELE9BQU8sRUFBRSxDQUFDLFVBQVM7R0FDcEI7OztFQUdELElBQUksRUFBRSxDQUFDLFlBQVksRUFBRTtJQUNuQkEsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFNO0lBQ3BDLE9BQU8sT0FBTyxFQUFFLEVBQUU7TUFDaEIsU0FBUyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUM7S0FDcEM7SUFDRCxPQUFPLEVBQUUsQ0FBQyxhQUFZO0dBQ3ZCOztFQUVELE9BQU8sQ0FBQyxLQUFLLHFEQUErQyxFQUFFLENBQUMsTUFBSyxTQUFJO0VBQ3hFLEVBQUUsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUM7O0VBRTFCLE9BQU8sRUFBRSxDQUFDLE1BQUs7RUFDZixPQUFPLEVBQUUsQ0FBQyxVQUFTO0NBQ3BCOzs7Ozs7O0FBT0QsQUFBTyxTQUFTLGNBQWMsRUFBRSxHQUFHLEVBQUU7RUFDbkNDLElBQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRTtFQUN6QkEsSUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFFO0VBQzNCLE9BQU8sSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtDQUN4Qzs7Ozs7Ozs7Ozs7O0FBWUQsQUFBTyxTQUFTc0IsV0FBUyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUU7RUFDeEQsT0FBTyxDQUFDLEtBQUssK0JBQTJCLElBQUksK0JBQXlCLEdBQUcsdUJBQWlCLEdBQUcsQ0FBQyxHQUFFLFNBQUk7RUFDbkcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBQ3RCLEdBQUcsQ0FBQyxJQUFJLFdBQUUsR0FBRyxFQUFFO01BQ2IsT0FBT0EsV0FBUyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUs7S0FDOUMsRUFBQztJQUNGLE1BQU07R0FDUDtFQUNEdEIsSUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFDO0VBQzlCLElBQUksRUFBRSxFQUFFO0lBQ05BLElBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBQztJQUN6RCxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRTtJQUNsQixHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxFQUFFLEVBQUUsRUFBQztJQUM5RCxPQUFPLE1BQU07R0FDZDtFQUNELE9BQU8sSUFBSSxLQUFLLG1DQUErQixHQUFHLFNBQUk7Q0FDdkQ7Ozs7Ozs7OztBQVNELEFBQU8sU0FBU3VCLFVBQVEsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUU7RUFDNUQsT0FBTyxDQUFDLEtBQUssd0NBQXFDLFVBQVUsY0FBVSxJQUFJLHFCQUFpQixHQUFHLENBQUMsR0FBRSxTQUFJO0VBQ3JHdkIsSUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFDO0VBQ3pFLGFBQWEsQ0FBQyxHQUFHLEVBQUM7RUFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsRUFBRSxFQUFFLEVBQUM7RUFDOUQsT0FBTyxNQUFNO0NBQ2Q7Ozs7OztBQU1ELEFBQU8sU0FBUyxhQUFhLEVBQUUsR0FBRyxFQUFFO0VBQ2xDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFFO0NBQ25COzs7Ozs7O0FBT0QsQUFBTyxTQUFTLFNBQVMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFO0VBQ3JDRCxJQUFJLE9BQU07OztFQUdWLElBQUlhLE9BQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxPQUFPLEVBQUU7SUFDNUIsS0FBSyxHQUFHLENBQUMsS0FBSyxFQUFDO0dBQ2hCOztFQUVELEtBQUssQ0FBQyxPQUFPLFdBQUMsTUFBSztJQUNqQixNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSTtNQUM5QixRQUFRO01BQ1I7UUFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDbkIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO09BQ3BCO01BQ0QsSUFBSSxDQUFDLElBQUk7TUFDVjtHQUNGLEVBQUM7O0VBRUYsT0FBTyxNQUFNO0NBQ2Q7O0FDM01EOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQkE7Ozs7OztBQWVBLEFBQU8sU0FBU0wsTUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtFQUMvQyxPQUFPLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxFQUFFLElBQUksRUFBQztFQUNuRVIsSUFBSSxPQUFNOzs7RUFHVkMsSUFBTSxZQUFZLGVBQWE7Ozs7V0FBRyxjQUFRLFdBQUMsR0FBRyxXQUFLLE1BQUk7SUFBQztFQUN4REEsSUFBTSxlQUFlLGFBQUksSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7SUFDNUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLElBQUksSUFBSSxFQUFDO0lBQ3BELGFBQWEsQ0FBQyxHQUFHLEVBQUM7SUFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFFO0lBQy9CLE9BQU8sQ0FBQyxLQUFLLG9EQUFnRCxHQUFHLENBQUMsR0FBRSxTQUFJO0lBQ3hFO0VBQ0RBLElBQU0sUUFBUSxHQUFHLEdBQUU7O0VBRW5CQSxJQUFNLGNBQWMsZUFBYTs7OztXQUFHcUIsZ0JBQVEsV0FBQyxHQUFHLFdBQUssTUFBSTtJQUFDOztFQUUxRHJCLElBQU0sWUFBWSxhQUFJLElBQUksRUFBRSxLQUFLLEVBQUU7SUFDakMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUM7SUFDekM7O0VBRURBLElBQU0sYUFBYSxhQUFHLE1BQUssbUJBQUcsT0FBTTtJQUNsQyxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBQztPQUN6QztFQUNEQSxJQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsSUFBRzs7RUFFOUJBLElBQU0sbUJBQW1CLGFBQUcsTUFBSyxTQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUM7O0VBRTdFQSxJQUFNLGdCQUFnQixHQUFHO0lBQ3ZCLE1BQU0sRUFBRSxHQUFHLENBQUMsT0FBTztJQUNuQixNQUFNLEVBQUUsWUFBWTtJQUNwQixTQUFTLEVBQUUsZUFBZTtJQUMxQixhQUFhLEVBQUUsbUJBQW1CO0lBQ2xDLFFBQVEsRUFBRSxjQUFjO0lBQ3hCLEVBQUUsRUFBRSxRQUFRO0lBQ2I7O0VBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBQzs7O0VBRy9CRCxJQUFJLGFBQVk7O0VBRWhCLElBQUksT0FBTyxJQUFJLEtBQUssVUFBVSxFQUFFOzs7SUFHOUIsWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDO0dBQzFDOztPQUVJLElBQUksSUFBSSxFQUFFO0lBQ2IsWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUU7R0FDL0I7O0VBRUQsWUFBWSxHQUFHLCtDQUEyQyxZQUFZLGtDQUE4Qjs7O0VBR3BHLElBQVEsYUFBYSx3QkFBVztFQUNoQ0MsSUFBTSxTQUFTLEdBQUcsR0FBRTs7O0VBR3BCLElBQUksYUFBYSxJQUFJLGFBQWEsQ0FBQyxRQUFRLEtBQUssS0FBSyxFQUFFOztJQUVyREEsSUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUM7SUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7TUFDdkIsVUFBVSxjQUFZOzs7O1FBQ3BCQSxJQUFNLE9BQU8sR0FBRyxZQUFZO1VBQzFCLElBQUksQ0FBQyxDQUFDLE9BQUMsQ0FBQyxNQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUM7VUFDMUI7UUFDRCxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUM7UUFDbEMsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRTtPQUNwRTtNQUNELFdBQVcsY0FBWTs7OztRQUNyQkEsSUFBTSxPQUFPLEdBQUcsWUFBWTtVQUMxQixJQUFJLENBQUMsQ0FBQyxPQUFDLENBQUMsTUFBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFDO1VBQzFCO1FBQ0QsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQ25DLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUU7T0FDcEU7TUFDRCxZQUFZLFlBQUcsQ0FBQyxFQUFFO1FBQ2hCLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFDO09BQ3RCO01BQ0QsYUFBYSxZQUFHLENBQUMsRUFBRTtRQUNqQixLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBQztPQUN2QjtLQUNGLEVBQUM7R0FDSDs7RUFFREEsSUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQyxNQUFNLEVBQUUsWUFBWTtJQUNwQixPQUFPLEVBQUUsYUFBYTtJQUN0QixTQUFTLEVBQUUsZUFBZTtJQUMxQixRQUFRLEVBQUUsY0FBYztJQUN4QixNQUFNLEVBQUUsWUFBWTtJQUNwQixlQUFlLEVBQUUsWUFBWTtJQUM3QixrQkFBa0IsRUFBRSxlQUFlO0lBQ25DLGlCQUFpQixFQUFFLGNBQWM7SUFDakMsZ0JBQWdCLEVBQUUsbUJBQW1CO0lBQ3JDLGtCQUFrQixFQUFFLFFBQVE7SUFDNUIsSUFBSSxFQUFFLGdCQUFnQjtHQUN2QixFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUM7RUFDdkIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsRUFBRTs7O0lBR3BELFlBQVksQ0FBQyxhQUFhLEVBQUUsWUFBWSxFQUFDO0dBQzFDOztFQUVELE9BQU8sTUFBTTtDQUNkOzs7Ozs7OztBQVFELFNBQVMsWUFBWSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUU7RUFDMUNBLElBQU0sVUFBVSxHQUFHLEdBQUU7RUFDckJBLElBQU0sWUFBWSxHQUFHLEdBQUU7RUFDdkIsS0FBS0EsSUFBTSxHQUFHLElBQUksYUFBYSxFQUFFO0lBQy9CLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFDO0lBQ3BCLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxFQUFDO0dBQ3RDO0VBQ0QsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUM7O0VBRXJCQSxJQUFNLE1BQU0sR0FBRyxvQ0FBSSxRQUFRLG1CQUFJLFVBQVUsS0FBQztFQUMxQyxPQUFPLFlBQU0sQ0FBQyxRQUFHLFlBQVksQ0FBQztDQUMvQjs7Ozs7Ozs7QUFRRCxTQUFTLGtCQUFrQixFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUU7RUFDaEQsSUFBSSxPQUFPLG1CQUFtQixLQUFLLFVBQVUsRUFBRTtJQUM3QyxPQUFPLEtBQUs7R0FDYjs7RUFFREQsSUFBSSxFQUFFLEdBQUcsS0FBSyxFQUFDO0VBQ2ZBLElBQUksaUJBQWlCLEdBQUcsTUFBSztFQUM3QkEsSUFBSSxNQUFNLEdBQUcsY0FBYTtFQUMxQkMsSUFBTSxVQUFVLEdBQUcsR0FBRTtFQUNyQkEsSUFBTSxZQUFZLEdBQUcsR0FBRTtFQUN2QixLQUFLQSxJQUFNLEdBQUcsSUFBSSxhQUFhLEVBQUU7SUFDL0IsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUM7SUFDcEIsWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUM7R0FDdEM7RUFDRCxLQUFLRCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQzlDLE1BQU0sSUFBSSxVQUFVLENBQUMsQ0FBQyxFQUFDO0lBQ3ZCLE1BQU0sSUFBSSxJQUFHO0dBQ2Q7RUFDRCxNQUFNLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO0VBQzNDLE1BQU0sSUFBSSxNQUFLO0VBQ2YsTUFBTSxJQUFJLEtBQUk7RUFDZCxNQUFNLElBQUksTUFBSzs7RUFFZixJQUFJO0lBQ0ZDLElBQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLElBQUksR0FBRTtJQUNyQ0EsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFFO0lBQ2hDLEVBQUUsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxhQUFhLEVBQUM7SUFDN0YsSUFBSSxFQUFFLElBQUksT0FBTyxFQUFFLEtBQUssVUFBVSxFQUFFO01BQ2xDLFFBQUUsQ0FBQyxRQUFHLFlBQVksRUFBQztNQUNuQixpQkFBaUIsR0FBRyxLQUFJO0tBQ3pCO0dBQ0Y7RUFDRCxPQUFPLENBQUMsRUFBRTtJQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDO0dBQ2pCOztFQUVELE9BQU8saUJBQWlCO0NBQ3pCOztBQ25ORDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxJQUFxQixNQUFNLEdBQ3pCLGVBQVcsRUFBRSxFQUFFLEVBQUU7RUFDakIsSUFBTSxDQUFDLEVBQUUsR0FBRyxHQUFFO0VBQ2QsSUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFFO0VBQ2YsSUFBTSxDQUFDLEtBQUssR0FBRyxHQUFFO0VBQ2hCO0FBQ0gsaUJBQUUsT0FBTyx1QkFBSTtFQUNYLE9BQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQztFQUM3QjtBQUNILGlCQUFFLE1BQU0sb0JBQUUsSUFBSSxFQUFFLEtBQVMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFOztpQ0FBcEIsR0FBRzs7RUFDdEIsSUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDcEIsSUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFJO0lBQ3RCLFVBQVksYUFBSTtNQUNkLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBSztNQUN2QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQztLQUNqQixFQUFFLENBQUMsRUFBQztHQUNOO0VBQ0gsSUFBUSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUc7RUFDdEIsSUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNqQixHQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRTtHQUNoQjtFQUNILElBQVEsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUM7RUFDMUIsSUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNsQixLQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRTtHQUNqQjtFQUNILElBQU0sSUFBSSxLQUFLLFNBQVMsRUFBRTtJQUN4QixJQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO01BQ3ZCLEtBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFFO0tBQ3RCO0lBQ0gsS0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUM7R0FDL0I7T0FDSTtJQUNMLEtBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFPO0dBQzNCO0VBQ0Y7QUFDSCxpQkFBRSxLQUFLLG1CQUFFLFNBQVMsRUFBRTtFQUNsQixJQUFRLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRTtFQUM5QixJQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxFQUFDO0VBQ3JCLEdBQUssQ0FBQyxPQUFPLFdBQUUsS0FBSyxFQUFFO0lBQ3BCLFdBQWEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFDO0lBQzlCLFdBQWEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFDO0lBQzdCLFlBQWMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFDO0dBQy9CLEVBQUM7O0VBRUosSUFBUSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUU7RUFDbEMsSUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBQztFQUN2QixLQUFPLENBQUMsT0FBTyxXQUFFLEVBQUUsRUFBRTtJQUNuQixFQUFJLEdBQUU7R0FDTCxFQUFDOztFQUVKLElBQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDckIsSUFBTSxDQUFDLEtBQUssR0FBRTtHQUNiO0VBQ0Y7QUFDSCxpQkFBRSxJQUFJLGtCQUFFLEVBQUUsRUFBRTtFQUNWLElBQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQztDQUNwQjs7QUFHSCxTQUFTLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO0VBQ2pDQSxJQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFDO0VBQ3ZCLEtBQUtBLElBQU0sR0FBRyxJQUFJLEdBQUcsRUFBRTtJQUNyQixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUU7R0FDWDtDQUNGOztBQUVELFNBQVMsWUFBWSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7RUFDbENBLElBQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUM7RUFDdkIsS0FBS0EsSUFBTSxHQUFHLElBQUksR0FBRyxFQUFFO0lBQ3JCQSxJQUFNLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFDO0lBQ3JCLElBQUksQ0FBQyxPQUFPLFdBQUUsT0FBTyxFQUFFLEVBQUssT0FBTyxHQUFFLEVBQUUsRUFBQztHQUN6QztDQUNGOztBQzFGRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkE7Ozs7O0FBUUEsQUFBZSxTQUFTd0IsS0FBRyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDeEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFFO0VBQ1osSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLElBQUksR0FBRTtFQUM1QixJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUk7RUFDZCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsR0FBRTtFQUM1QixJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUU7OztFQUd2QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUlDLFFBQVEsQ0FBQyxRQUFRO0lBQzlCLEVBQUU7SUFDRixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVM7SUFDdEIsSUFBSTtJQUNKQSxRQUFRLENBQUMsUUFBUTtJQUNsQjtFQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsRUFBRSxFQUFDO0NBQzdCOztBQzlDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkE7OztBQU9BRCxLQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBRyxVQUFVLElBQUksRUFBRTtFQUM1QyxPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO0VBQ2pDOzs7OztBQUtEQSxLQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBRyxZQUFZO0VBQ3hDLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQztFQUMzQjs7Ozs7QUFLREEsS0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxLQUFLLEVBQUU7RUFDekMsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQztFQUM5Qjs7Ozs7QUFLRCxNQUFNLENBQUMsTUFBTSxDQUFDQSxLQUFHLEVBQUM7QUFDbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQ0EsS0FBRyxDQUFDLFNBQVMsQ0FBQzs7QUNwRDVCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsQUFBT3hCLElBQU0sV0FBVyxHQUFHLEVBQUU7O0FDbEI3Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOzs7Ozs7Ozs7O0FBZUEsQUFBTyxTQUFTMEIsZ0JBQWMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0VBQzdELE9BQWtCLEdBQUcsSUFBSSxJQUFJO01BQXJCLFFBQVEsZ0JBQWU7RUFDL0IsV0FBVyxHQUFFO0VBQ2IzQixJQUFJLFFBQVEsR0FBRyxXQUFXLENBQUMsRUFBRSxFQUFDOztFQUU5QixPQUFPLEdBQUcsT0FBTyxJQUFJLEdBQUU7RUFDdkJBLElBQUksT0FBTTs7RUFFVixJQUFJLENBQUMsUUFBUSxFQUFFO0lBQ2IsUUFBUSxHQUFHLElBQUl5QixLQUFHLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBQztJQUMvQixXQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUTtJQUMxQixNQUFNLEdBQUdHLE1BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7R0FDakQ7T0FDSTtJQUNILE1BQU0sR0FBRyxJQUFJLEtBQUssNkJBQXlCLEVBQUUsVUFBSTtHQUNsRDtFQUNELE9BQU8sQ0FBQyxNQUFNLFlBQVksS0FBSyxJQUFJLE1BQU0sR0FBRyxRQUFRO0NBQ3JEOztBQ2xERDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOzs7O0FBWUEsQUFBTyxTQUFTcEIsTUFBSSxFQUFFLEdBQUcsRUFBRTtFQUN6QnFCLFFBQU0sQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLFNBQVE7RUFDOUJBLFFBQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQU87RUFDNUJBLFFBQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQU87RUFDNUJBLFFBQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLFVBQVM7RUFDaENBLFFBQU0sQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLFNBQVE7Q0FDL0I7Ozs7Ozs7O0FBUUQsQUFBTyxTQUFTLGVBQWUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFO0VBQ3pDNUIsSUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLEVBQUUsRUFBQztFQUNoQ0QsSUFBSSxPQUFNOztFQUVWLElBQUksUUFBUSxFQUFFO0lBQ1osTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFDO0dBQ2pDO09BQ0k7SUFDSCxNQUFNLEdBQUcsSUFBSSxLQUFLLDZCQUF5QixFQUFFLFVBQUk7R0FDbEQ7RUFDRCxPQUFPLE1BQU07Q0FDZDs7Ozs7O0FBTUQsQUFBTyxTQUFTLGVBQWUsRUFBRSxFQUFFLEVBQUU7O0VBRW5DLElBQUksT0FBTyxXQUFXLEtBQUssVUFBVSxFQUFFO0lBQ3JDLFdBQVcsR0FBRTtHQUNkOztFQUVELFdBQVcsR0FBRTtFQUNiQyxJQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsRUFBRSxFQUFDOztFQUVoQyxJQUFJLENBQUMsUUFBUSxFQUFFO0lBQ2IsT0FBTyxJQUFJLEtBQUssNkJBQXlCLEVBQUUsU0FBSTtHQUNoRDtFQUNELE9BQU8sQ0FBQyxRQUFRLEVBQUM7RUFDakIsT0FBTyxXQUFXLENBQUMsRUFBRSxFQUFDOzs7Ozs7O0VBT3RCQSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBQztFQUM1QkEsSUFBTSxLQUFLLEdBQUcsR0FBRTtFQUNoQixJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7SUFDYkEsSUFBTSxTQUFTLEdBQUcsS0FBSyxHQUFHLE1BQUs7SUFDL0IsSUFBSSxDQUFDLFNBQVMsSUFBSSxPQUFPLGdCQUFnQixLQUFLLFVBQVUsRUFBRTtNQUN4RCxnQkFBZ0IsR0FBRTtLQUNuQjtHQUNGO0VBQ0QsT0FBTyxXQUFXO0NBQ25COztBQzFGRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBLEFBT0EsSUFDRTZCLG9CQUFrQiwrQkFDVjs7Ozs7O0FBTVYsQUFBTyxTQUFTQyxvQkFBa0IsRUFBRSxVQUFVLEVBQUU7RUFDOUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO0lBQzdCLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxRQUFRLEVBQUUsSUFBSSxFQUFFOztNQUUxQyxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1QsTUFBTTtPQUNQO01BQ0QsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDNUJELG9CQUFrQixDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUk7T0FDaEM7O1dBRUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNsRUEsb0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUk7T0FDckM7S0FDRixFQUFDO0dBQ0g7Q0FDRjs7Ozs7O0FBTUQsQUFBTyxTQUFTRSxpQkFBZSxFQUFFLE9BQU8sRUFBRTs7RUFFeEMsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7SUFDL0IsV0FBVyxDQUFDLE9BQU8sRUFBQztHQUNyQjtDQUNGOzs7Ozs7QUFNRCxBQUFPLFNBQVMsZUFBZSxFQUFFLE9BQU8sRUFBRTs7RUFFeEMsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7SUFDL0JiLGFBQVcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFDO0dBQ3pCO0NBQ0Y7OztBQUdELE1BQU0sQ0FBQyxlQUFlLEdBQUcsZUFBZTs7QUMxRXhDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsQUFNQWxCLElBQU0sVUFBVSxHQUFHO0VBQ2pCLFNBQVMsWUFBRyxFQUFFLEVBQVc7Ozs7SUFDdkIsT0FBT3NCLGlCQUFTLFdBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFLLE1BQUksQ0FBQztHQUMzQztFQUNELFFBQVEsWUFBRyxFQUFFLEVBQVc7Ozs7SUFDdEIsT0FBT0MsZ0JBQVEsV0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQUssTUFBSSxDQUFDO0dBQzFDO0VBQ0Y7Ozs7Ozs7O0FBUUQsQUFBTyxTQUFTUyxjQUFZLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRTtFQUN2Q2hDLElBQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxFQUFFLEVBQUM7RUFDaEMsSUFBSSxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtJQUNwQ0EsSUFBTSxPQUFPLEdBQUcsR0FBRTtJQUNsQixLQUFLLENBQUMsT0FBTyxXQUFFLElBQUksRUFBRTtNQUNuQkEsSUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUM7TUFDdkNBLElBQU0sSUFBSSxHQUFHLFdBQUksSUFBSSxDQUFDLElBQUksR0FBQzs7TUFFM0IsSUFBSSxPQUFPLE9BQU8sS0FBSyxVQUFVLEVBQUU7UUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUM7UUFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFPLENBQUMsUUFBRyxJQUFJLENBQUMsRUFBQztPQUMvQjtLQUNGLEVBQUM7SUFDRixPQUFPLE9BQU87R0FDZjtFQUNELE9BQU8sSUFBSSxLQUFLLDZCQUF5QixFQUFFLGtCQUFhO0NBQ3pEOztBQ3ZERDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOzs7OztBQVVBLEFBQU8sU0FBU2lDLFNBQU8sRUFBRSxFQUFFLEVBQUU7RUFDM0JqQyxJQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsRUFBRSxFQUFDO0VBQ2hDRCxJQUFJLE9BQU07O0VBRVYsSUFBSSxRQUFRLEVBQUU7SUFDWixNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsRUFBQztHQUNsQztPQUNJO0lBQ0gsTUFBTSxHQUFHLElBQUksS0FBSyw2QkFBeUIsRUFBRSxVQUFJO0dBQ2xEO0VBQ0QsT0FBTyxNQUFNO0NBQ2Q7O0FDdkNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBO0FBVUEsZUFBZSxDQUFDbUMsU0FBTyxFQUFDOzs7OztBQUt4QixNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQzs7QUFFakIsQUFBK0Q7Ozs7Ozs7Ozs7Ozs7OztBQ3ZDL0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsQUFHQSxLQUFLLENBQUMsUUFBRSxJQUFJLEVBQUUsQ0FBQzs7OzsifQ==
