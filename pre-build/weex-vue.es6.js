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
let nextNodeRef = 1;
function uniqueId () {
  return (nextNodeRef++).toString()
}

function typof (v) {
  const s = Object.prototype.toString.call(v);
  return s.substring(8, s.length - 1)
}

function bufferToBase64 (buffer) {
  if (typeof btoa !== 'function') {
    return ''
  }
  const string = Array.prototype.map.call(
    new Uint8Array(buffer),
    code => String.fromCharCode(code)
  ).join('');
  return btoa(string) // eslint-disable-line no-undef
}

function base64ToBuffer (base64) {
  if (typeof atob !== 'function') {
    return new ArrayBuffer(0)
  }
  const string = atob(base64); // eslint-disable-line no-undef
  const array = new Uint8Array(string.length);
  Array.prototype.forEach.call(string, (ch, i) => {
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

  for (const key in any) {
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
  const type = typof(v);

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

    const realData = {};
    for (const key in data) {
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
  return `${type}@${hookName}#${componentId}`
}

/**
 * For general callback management of a certain Weex instance.
 * Because function can not passed into native, so we create callback
 * callback id for each function and pass the callback id into native
 * in fact. And when a callback called from native, we can find the real
 * callback through the callback id we have passed before.
 */
class CallbackManager {
  constructor (instanceId) {
    this.instanceId = String(instanceId);
    this.lastCallbackId = 0;
    this.callbacks = {};
    this.hooks = {};
  }
  add (callback) {
    this.lastCallbackId++;
    this.callbacks[this.lastCallbackId] = callback;
    return this.lastCallbackId
  }
  remove (callbackId) {
    const callback = this.callbacks[callbackId];
    delete this.callbacks[callbackId];
    return callback
  }
  registerHook (componentId, type, hookName, hookFunction) {
    // TODO: validate arguments
    const key = getHookKey(componentId, type, hookName);
    if (this.hooks[key]) {
      console.warn(`[JS Framework] Override an existing component hook "${key}".`);
    }
    this.hooks[key] = hookFunction;
  }
  triggerHook (componentId, type, hookName, options = {}) {
    // TODO: validate arguments
    const key = getHookKey(componentId, type, hookName);
    const hookFunction = this.hooks[key];
    if (typeof hookFunction !== 'function') {
      console.error(`[JS Framework] Invalid hook function type (${typeof hookFunction}) on "${key}".`);
      return null
    }
    let result = null;
    try {
      result = hookFunction.apply(null, options.args || []);
    }
    catch (e) {
      console.error(`[JS Framework] Failed to execute the hook function on "${key}".`);
    }
    return result
  }
  consume (callbackId, data, ifKeepAlive) {
    const callback = this.callbacks[callbackId];
    if (typeof ifKeepAlive === 'undefined' || ifKeepAlive === false) {
      delete this.callbacks[callbackId];
    }
    if (typeof callback === 'function') {
      return callback(decodePrimitive(data))
    }
    return new Error(`invalid callback id "${callbackId}"`)
  }
  close () {
    this.callbacks = {};
    this.hooks = {};
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

const docMap = {};

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
  const doc = docMap[id];
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
  const { documentElement } = doc;

  if (documentElement.pureChildren.length > 0 || node.parentNode) {
    return
  }
  const children = documentElement.children;
  const beforeIndex = children.indexOf(before);
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
      node.children.forEach(child => {
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
  const body = node.toJSON();
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
  node.children.forEach(child => {
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
  const before = list[newIndex - 1];
  const after = list[newIndex];
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
  const index = list.indexOf(target);
  /* istanbul ignore next */
  if (index < 0) {
    return -1
  }
  if (changeSibling) {
    const before = list[index - 1];
    const after = list[index + 1];
    before && (before.nextSibling = after);
    after && (after.previousSibling = before);
  }
  list.splice(index, 1);
  let newIndexAfter = newIndex;
  if (index <= newIndex) {
    newIndexAfter = newIndex - 1;
  }
  const beforeNew = list[newIndexAfter - 1];
  const afterNew = list[newIndexAfter];
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
  const index = list.indexOf(target);
  /* istanbul ignore next */
  if (index < 0) {
    return
  }
  if (changeSibling) {
    const before = list[index - 1];
    const after = list[index + 1];
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

class Node {
  constructor () {
    this.nodeId = uniqueId();
    this.ref = this.nodeId;
    this.children = [];
    this.pureChildren = [];
    this.parentNode = null;
    this.nextSibling = null;
    this.previousSibling = null;
  }

  /**
  * Destroy current node, and remove itself form nodeMap.
  */
  destroy () {
    const doc = getDoc(this.docId);
    if (doc) {
      delete this.docId;
      delete doc.nodeMap[this.nodeId];
    }
    this.children.forEach(child => {
      child.destroy();
    });
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
let Element$1;

function setElement (El) {
  Element$1 = El;
}

/**
 * A map which stores all type of elements.
 * @type {Object}
 */
const registeredElements = {};

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
  class WeexElement extends Element$1 {}

  // Add methods to prototype.
  methods.forEach(methodName => {
    WeexElement.prototype[methodName] = function (...args) {
      const taskCenter = getTaskCenter(this.docId);
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

const DEFAULT_TAG_NAME = 'div';
const BUBBLE_EVENTS = [
  'click', 'longpress', 'touchstart', 'touchmove', 'touchend',
  'panstart', 'panmove', 'panend', 'horizontalpan', 'verticalpan', 'swipe'
];

function registerNode (docId, node) {
  const doc = getDoc(docId);
  doc.nodeMap[node.nodeId] = node;
}

class Element extends Node {
  constructor (type = DEFAULT_TAG_NAME, props, isExtended) {
    super();

    const WeexElement = getWeexElement(type);
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

  /**
   * Append a child node.
   * @param {object} node
   * @return {undefined | number} the signal sent by native
   */
  appendChild (node) {
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
        const taskCenter = getTaskCenter(this.docId);
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
        const index = moveIndex(node, this.pureChildren, this.pureChildren.length);
        const taskCenter = getTaskCenter(this.docId);
        if (taskCenter && index >= 0) {
          return taskCenter.send(
            'dom',
            { action: 'moveElement' },
            [node.ref, this.ref, index]
          )
        }
      }
    }
  }

  /**
   * Insert a node before specified node.
   * @param {object} node
   * @param {object} before
   * @return {undefined | number} the signal sent by native
   */
  insertBefore (node, before) {
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
        const pureBefore = nextElement(before);
        const index = insertIndex(
          node,
          this.pureChildren,
          pureBefore
            ? this.pureChildren.indexOf(pureBefore)
            : this.pureChildren.length
        );
        const taskCenter = getTaskCenter(this.docId);
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
        const pureBefore = nextElement(before);
        /* istanbul ignore next */
        const index = moveIndex(
          node,
          this.pureChildren,
          pureBefore
            ? this.pureChildren.indexOf(pureBefore)
            : this.pureChildren.length
        );
        const taskCenter = getTaskCenter(this.docId);
        if (taskCenter && index >= 0) {
          return taskCenter.send(
            'dom',
            { action: 'moveElement' },
            [node.ref, this.ref, index]
          )
        }
      }
    }
  }

  /**
   * Insert a node after specified node.
   * @param {object} node
   * @param {object} after
   * @return {undefined | number} the signal sent by native
   */
  insertAfter (node, after) {
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
        const index = insertIndex(
          node,
          this.pureChildren,
          this.pureChildren.indexOf(previousElement(after)) + 1
        );
        const taskCenter = getTaskCenter(this.docId);
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
        const index = moveIndex(
          node,
          this.pureChildren,
          this.pureChildren.indexOf(previousElement(after)) + 1
        );
        const taskCenter = getTaskCenter(this.docId);
        if (taskCenter && index >= 0) {
          return taskCenter.send(
            'dom',
            { action: 'moveElement' },
            [node.ref, this.ref, index]
          )
        }
      }
    }
  }

  /**
   * Remove a child node, and decide whether it should be destroyed.
   * @param {object} node
   * @param {boolean} preserved
   */
  removeChild (node, preserved) {
    if (node.parentNode) {
      removeIndex(node, this.children, true);
      if (node.nodeType === 1) {
        removeIndex(node, this.pureChildren);
        const taskCenter = getTaskCenter(this.docId);
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
  }

  /**
   * Clear all child nodes.
   */
  clear () {
    const taskCenter = getTaskCenter(this.docId);
    /* istanbul ignore else */
    if (taskCenter) {
      this.pureChildren.forEach(node => {
        taskCenter.send(
          'dom',
          { action: 'removeElement' },
          [node.ref]
        );
      });
    }
    this.children.forEach(node => {
      node.destroy();
    });
    this.children.length = 0;
    this.pureChildren.length = 0;
  }

  /**
   * Set an attribute, and decide whether the task should be send to native.
   * @param {string} key
   * @param {string | number} value
   * @param {boolean} silent
   */
  setAttr (key, value, silent) {
    if (this.attr[key] === value && silent !== false) {
      return
    }
    this.attr[key] = value;
    const taskCenter = getTaskCenter(this.docId);
    if (!silent && taskCenter) {
      const result = {};
      result[key] = value;
      taskCenter.send(
        'dom',
        { action: 'updateAttrs' },
        [this.ref, result]
      );
    }
  }

  /**
   * Set batched attributes.
   * @param {object} batchedAttrs
   * @param {boolean} silent
   */
  setAttrs (batchedAttrs, silent) {
    if (isEmpty(batchedAttrs)) return
    const mutations = {};
    for (const key in batchedAttrs) {
      if (this.attr[key] !== batchedAttrs[key]) {
        this.attr[key] = batchedAttrs[key];
        mutations[key] = batchedAttrs[key];
      }
    }
    if (!isEmpty(mutations)) {
      const taskCenter = getTaskCenter(this.docId);
      if (!silent && taskCenter) {
        taskCenter.send(
          'dom',
          { action: 'updateAttrs' },
          [this.ref, mutations]
        );
      }
    }
  }

  /**
   * Set a style property, and decide whether the task should be send to native.
   * @param {string} key
   * @param {string | number} value
   * @param {boolean} silent
   */
  setStyle (key, value, silent) {
    if (this.style[key] === value && silent !== false) {
      return
    }
    this.style[key] = value;
    const taskCenter = getTaskCenter(this.docId);
    if (!silent && taskCenter) {
      const result = {};
      result[key] = value;
      taskCenter.send(
        'dom',
        { action: 'updateStyle' },
        [this.ref, result]
      );
    }
  }

  /**
   * Set batched style properties.
   * @param {object} batchedStyles
   * @param {boolean} silent
   */
  setStyles (batchedStyles, silent) {
    if (isEmpty(batchedStyles)) return
    const mutations = {};
    for (const key in batchedStyles) {
      if (this.style[key] !== batchedStyles[key]) {
        this.style[key] = batchedStyles[key];
        mutations[key] = batchedStyles[key];
      }
    }
    if (!isEmpty(mutations)) {
      const taskCenter = getTaskCenter(this.docId);
      if (!silent && taskCenter) {
        taskCenter.send(
          'dom',
          { action: 'updateStyle' },
          [this.ref, mutations]
        );
      }
    }
  }

  /**
   * Set style properties from class.
   * @param {object} classStyle
   */
  setClassStyle (classStyle) {
    // reset previous class style to empty string
    for (const key in this.classStyle) {
      this.classStyle[key] = '';
    }

    Object.assign(this.classStyle, classStyle);
    const taskCenter = getTaskCenter(this.docId);
    if (taskCenter) {
      taskCenter.send(
        'dom',
        { action: 'updateStyle' },
        [this.ref, this.toStyle()]
      );
    }
  }

  /**
   * Add an event handler.
   * @param {string} event type
   * @param {function} event handler
   */
  addEvent (type, handler, params) {
    if (!this.event) {
      this.event = {};
    }
    if (!this.event[type]) {
      this.event[type] = { handler, params };
      const taskCenter = getTaskCenter(this.docId);
      if (taskCenter) {
        taskCenter.send(
          'dom',
          { action: 'addEvent' },
          [this.ref, type]
        );
      }
    }
  }

  /**
   * Remove an event handler.
   * @param {string} event type
   */
  removeEvent (type) {
    if (this.event && this.event[type]) {
      delete this.event[type];
      const taskCenter = getTaskCenter(this.docId);
      if (taskCenter) {
        taskCenter.send(
          'dom',
          { action: 'removeEvent' },
          [this.ref, type]
        );
      }
    }
  }

  /**
   * Fire an event manually.
   * @param {string} type type
   * @param {function} event handler
   * @param {boolean} isBubble whether or not event bubble
   * @param {boolean} options
   * @return {} anything returned by handler function
   */
  fireEvent (type, event, isBubble, options) {
    let result = null;
    let isStopPropagation = false;
    const eventDesc = this.event[type];
    if (eventDesc && event) {
      const handler = eventDesc.handler;
      event.stopPropagation = () => {
        isStopPropagation = true;
      };
      if (options && options.params) {
        result = handler.call(this, ...options.params, event);
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
  }

  /**
   * Get all styles of current element.
   * @return {object} style
   */
  toStyle () {
    return Object.assign({}, this.classStyle, this.style)
  }

  /**
   * Convert current element to JSON like object.
   * @return {object} element
   */
  toJSON () {
    const result = {
      ref: this.ref.toString(),
      type: this.type,
      attr: this.attr,
      style: this.toStyle()
    };
    const event = [];
    for (const type in this.event) {
      const { params } = this.event[type];
      if (!params) {
        event.push(type);
      }
      else {
        event.push({ type, params });
      }
    }
    if (event.length) {
      result.event = event;
    }
    if (this.pureChildren.length) {
      result.children = this.pureChildren.map((child) => child.toJSON());
    }
    return result
  }

  /**
   * Convert to HTML element tag string.
   * @return {stirng} html
   */
  toString () {
    return '<' + this.type +
    ' attr=' + JSON.stringify(this.attr) +
    ' style=' + JSON.stringify(this.toStyle()) + '>' +
    this.pureChildren.map((child) => child.toString()).join('') +
    '</' + this.type + '>'
  }
}

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

let fallback = function () {};

// The API of TaskCenter would be re-design.
class TaskCenter {
  constructor (id, sendTasks) {
    Object.defineProperty(this, 'instanceId', {
      enumerable: true,
      value: String(id)
    });
    Object.defineProperty(this, 'callbackManager', {
      enumerable: true,
      value: new CallbackManager(id)
    });
    fallback = sendTasks || function () {};
  }

  callback (callbackId, data, ifKeepAlive) {
    return this.callbackManager.consume(callbackId, data, ifKeepAlive)
  }

  registerHook (...args) {
    return this.callbackManager.registerHook(...args)
  }

  triggerHook (...args) {
    return this.callbackManager.triggerHook(...args)
  }

  updateData (componentId, newData, callback) {
    this.send('module', {
      module: 'dom',
      method: 'updateComponentData'
    }, [componentId, newData, callback]);
  }

  destroyCallback () {
    return this.callbackManager.close()
  }

  /**
   * Normalize a value. Specially, if the value is a function, then generate a function id
   * and save it to `CallbackManager`, at last return the function id.
   * @param  {any}        v
   * @return {primitive}
   */
  normalize (v) {
    const type = typof(v);
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
  }

  send (type, params, args, options) {
    const { action, component, ref, module, method } = params;

    args = args.map(arg => this.normalize(arg));

    switch (type) {
      case 'dom':
        return this[action](this.instanceId, args)
      case 'component':
        return this.componentHandler(this.instanceId, ref, method, args, Object.assign({ component }, options))
      default:
        return this.moduleHandler(this.instanceId, module, method, args, options)
    }
  }

  callDOM (action, args) {
    return this[action](this.instanceId, args)
  }

  callComponent (ref, method, args, options) {
    return this.componentHandler(this.instanceId, ref, method, args, options)
  }

  callModule (module, method, args, options) {
    return this.moduleHandler(this.instanceId, module, method, args, options)
  }
}

function init$1 () {
  const DOM_METHODS = {
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
  const proto = TaskCenter.prototype;

  for (const name in DOM_METHODS) {
    const method = DOM_METHODS[name];
    proto[name] = method ?
      (id, args) => method(id, ...args) :
      (id, args) => fallback(id, [{ module: 'dom', method: name, args }], '-1');
  }

  proto.componentHandler = global.callNativeComponent ||
    ((id, ref, method, args, options) =>
      fallback(id, [{ component: options.component, ref, method, args }]));

  proto.moduleHandler = global.callNativeModule ||
    ((id, module, method, args) =>
      fallback(id, [{ module, method, args }]));
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
  const el = document.getRef(nodeId);
  if (el) {
    return document.fireEvent(el, type, event, domChanges, params)
  }
  return new Error(`invalid element reference "${nodeId}"`)
}

function callback (document, callbackId, data, ifKeepAlive) {
  return document.taskCenter.callback(callbackId, data, ifKeepAlive)
}

function componentHook (document, componentId, type, hook, options) {
  if (!document || !document.taskCenter) {
    console.error(`[JS Framework] Can't find "document" or "taskCenter".`);
    return null
  }
  let result = null;
  try {
    result = document.taskCenter.triggerHook(componentId, type, hook, options);
  }
  catch (e) {
    console.error(`[JS Framework] Failed to trigger the "${type}@${hook}" hook on ${componentId}.`);
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
  const document = getDoc(id);
  if (!document) {
    return new Error(`[JS Framework] Failed to receiveTasks, `
      + `instance (${id}) is not available.`)
  }
  if (Array.isArray(tasks)) {
    return tasks.map(task => {
      switch (task.method) {
        case 'callback': return callback(document, ...task.args)
        case 'fireEventSync':
        case 'fireEvent': return fireEvent(document, ...task.args)
        case 'componentHook': return componentHook(document, ...task.args)
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

const weexModules = {};

/**
 * Register native modules information.
 * @param {object} newModules
 */
function registerModules (newModules) {
  for (const name in newModules) {
    if (!weexModules[name]) {
      weexModules[name] = {};
    }
    newModules[name].forEach(method => {
      if (typeof method === 'string') {
        weexModules[name][method] = true;
      }
      else {
        weexModules[name][method.name] = method.args;
      }
    });
  }
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

const weexComponents = {};

/**
 * Register native components information.
 * @param {array} newComponents
 */
function registerComponents (newComponents) {
  if (Array.isArray(newComponents)) {
    newComponents.forEach(component => {
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

const services = [];

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
    console.warn(`Service "${name}" has been registered already!`);
  }
  else {
    options = Object.assign({}, options);
    services.push({ name, options });
  }
}

/**
 * Unregister a JavaScript service by name
 * @param {string} name
 */
function unregister (name) {
  services.some((service, index) => {
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
  return services.map(service => service.name).indexOf(name)
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
  const taskCenter = getTaskCenter(id);
  if (!taskCenter || typeof taskCenter.send !== 'function') {
    console.error(`[JS Framework] Failed to create tracker!`);
    return
  }
  if (!type || !value) {
    console.warn(`[JS Framework] Invalid track type (${type}) or value (${value})`);
    return
  }
  const label = `jsfm.${type}.${value}`;
  try {
    if (isRegisteredModule('userTrack', 'addPerfPoint')) {
      const message = Object.create(null);
      message[label] = '4';
      taskCenter.send('module', {
        module: 'userTrack',
        method: 'addPerfPoint'
      }, [message]);
    }
  }
  catch (err) {
    console.error(`[JS Framework] Failed to trace "${label}"!`);
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

class Comment extends Node {
  constructor (value) {
    super();

    this.nodeType = 8;
    this.nodeId = uniqueId();
    this.ref = this.nodeId;
    this.type = 'comment';
    this.value = value;
    this.children = [];
    this.pureChildren = [];
  }

  /**
  * Convert to HTML comment string.
  * @return {stirng} html
  */
  toString () {
    return '<!-- ' + this.value + ' -->'
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
* Create the action object.
* @param {string} name
* @param {array} arguments
* @return {object} action
*/
function createAction (name, args = []) {
  return { module: 'dom', method: name, args: args }
}

class Listener {
  constructor (id, handler) {
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
  }

  /**
   * Send the "createFinish" signal.
   * @param {function} callback
   * @return {undefined | number} the signal sent by native
   */
  createFinish (callback) {
    const handler = this.handler;
    return handler([createAction('createFinish')], callback)
  }

  /**
   * Send the "updateFinish" signal.
   * @param {function} callback
   * @return {undefined | number} the signal sent by native
   */
  updateFinish (callback) {
    const handler = this.handler;
    return handler([createAction('updateFinish')], callback)
  }

  /**
   * Send the "refreshFinish" signal.
   * @param {function} callback
   * @return {undefined | number} the signal sent by native
   */
  refreshFinish (callback) {
    const handler = this.handler;
    return handler([createAction('refreshFinish')], callback)
  }

  /**
   * Send the "createBody" signal.
   * @param {object} element
   * @return {undefined | number} the signal sent by native
   */
  createBody (element) {
    const body = element.toJSON();
    const children = body.children;
    delete body.children;
    const actions = [createAction('createBody', [body])];
    if (children) {
      actions.push.apply(actions, children.map(child => {
        return createAction('addElement', [body.ref, child, -1])
      }));
    }
    return this.addActions(actions)
  }

  /**
   * Send the "addElement" signal.
   * @param {object} element
   * @param {stirng} reference id
   * @param {number} index
   * @return {undefined | number} the signal sent by native
   */
  addElement (element, ref, index) {
    if (!(index >= 0)) {
      index = -1;
    }
    return this.addActions(createAction('addElement', [ref, element.toJSON(), index]))
  }

  /**
   * Send the "removeElement" signal.
   * @param {stirng} reference id
   * @return {undefined | number} the signal sent by native
   */
  removeElement (ref) {
    if (Array.isArray(ref)) {
      const actions = ref.map((r) => createAction('removeElement', [r]));
      return this.addActions(actions)
    }
    return this.addActions(createAction('removeElement', [ref]))
  }

  /**
   * Send the "moveElement" signal.
   * @param {stirng} target reference id
   * @param {stirng} parent reference id
   * @param {number} index
   * @return {undefined | number} the signal sent by native
   */
  moveElement (targetRef, parentRef, index) {
    return this.addActions(createAction('moveElement', [targetRef, parentRef, index]))
  }

  /**
   * Send the "updateAttrs" signal.
   * @param {stirng} reference id
   * @param {stirng} key
   * @param {stirng} value
   * @return {undefined | number} the signal sent by native
   */
  setAttr (ref, key, value) {
    const result = {};
    result[key] = value;
    return this.addActions(createAction('updateAttrs', [ref, result]))
  }

  /**
   * Send the "updateStyle" signal, update a sole style.
   * @param {stirng} reference id
   * @param {stirng} key
   * @param {stirng} value
   * @return {undefined | number} the signal sent by native
   */
  setStyle (ref, key, value) {
    const result = {};
    result[key] = value;
    return this.addActions(createAction('updateStyle', [ref, result]))
  }

  /**
   * Send the "updateStyle" signal.
   * @param {stirng} reference id
   * @param {object} style
   * @return {undefined | number} the signal sent by native
   */
  setStyles (ref, style) {
    return this.addActions(createAction('updateStyle', [ref, style]))
  }

  /**
   * Send the "addEvent" signal.
   * @param {stirng} reference id
   * @param {string} event type
   * @return {undefined | number} the signal sent by native
   */
  addEvent (ref, type) {
    return this.addActions(createAction('addEvent', [ref, type]))
  }

  /**
   * Send the "removeEvent" signal.
   * @param {stirng} reference id
   * @param {string} event type
   * @return {undefined | number} the signal sent by native
   */
  removeEvent (ref, type) {
    return this.addActions(createAction('removeEvent', [ref, type]))
  }

  /**
   * Default handler.
   * @param {object | array} actions
   * @param {function} callback
   * @return {} anything returned by callback function
   */
  handler (actions, cb) {
    return cb && cb()
  }

  /**
   * Add actions into updates.
   * @param {object | array} actions
   * @return {undefined | number} the signal sent by native
   */
  addActions (actions) {
    const updates = this.updates;
    const handler = this.handler;

    if (!Array.isArray(actions)) {
      actions = [actions];
    }

    if (this.batched) {
      updates.push.apply(updates, actions);
    }
    else {
      return handler(actions)
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
 * Task handler for communication between javascript and native.
 */

const handlerMap = {
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
  const defaultHandler = handler || global.callNative;

  /* istanbul ignore if */
  if (typeof defaultHandler !== 'function') {
    console.error('[JS Runtime] no default handler');
  }

  return function taskHandler (tasks) {
    /* istanbul ignore if */
    if (!Array.isArray(tasks)) {
      tasks = [tasks];
    }
    for (let i = 0; i < tasks.length; i++) {
      const returnValue = dispatchTask(id, tasks[i], defaultHandler);
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
  const { module, method, args } = task;

  if (hasAvailableHandler(module, method)) {
    return global[handlerMap[method]](id, ...args, '-1')
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
  const attrs = changes.attrs || {};
  for (const name in attrs) {
    el.setAttr(name, attrs[name], true);
  }
  const style = changes.style || {};
  for (const name in style) {
    el.setStyle(name, style[name], true);
  }
}

class Document {
  constructor (id, url, handler) {
    id = id ? id.toString() : '';
    this.id = id;
    this.URL = url;

    addDoc(id, this);
    this.nodeMap = {};
    const L = Document.Listener || Listener;
    this.listener = new L(id, handler || createHandler(id, Document.handler)); // deprecated
    this.taskCenter = new TaskCenter(id, handler ? (id, ...args) => handler(...args) : Document.handler);
    this.createDocumentElement();
  }

  /**
  * Get the node from nodeMap.
  * @param {string} reference id
  * @return {object} node
  */
  getRef (ref) {
    return this.nodeMap[ref]
  }

  /**
  * Turn on batched updates.
  */
  open () {
    this.listener.batched = false;
  }

  /**
  * Turn off batched updates.
  */
  close () {
    this.listener.batched = true;
  }

  /**
  * Create the document element.
  * @return {object} documentElement
  */
  createDocumentElement () {
    if (!this.documentElement) {
      const el = new Element('document');
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
        value: (node) => {
          appendBody(this, node);
        }
      });

      Object.defineProperty(el, 'insertBefore', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: (node, before) => {
          appendBody(this, node, before);
        }
      });
    }

    return this.documentElement
  }

  /**
  * Create the body element.
  * @param {string} type
  * @param {objct} props
  * @return {object} body element
  */
  createBody (type, props) {
    if (!this.body) {
      const el = new Element(type, props);
      setBody(this, el);
    }

    return this.body
  }

  /**
  * Create an element.
  * @param {string} tagName
  * @param {objct} props
  * @return {object} element
  */
  createElement (tagName, props) {
    return new Element(tagName, props)
  }

  /**
  * Create an comment.
  * @param {string} text
  * @return {object} comment
  */
  createComment (text) {
    return new Comment(text)
  }

  /**
  * Fire an event on specified element manually.
  * @param {object} element
  * @param {string} event type
  * @param {object} event object
  * @param {object} dom changes
  * @param {object} options
  * @return {} anything returned by handler function
  */
  fireEvent (el, type, event, domChanges, options) {
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
    const isBubble = this.getRef('_root').attr['bubble'] === 'true';
    return el.fireEvent(type, event, isBubble, options)
  }

  /**
  * Destroy current document, and remove itself form docMap.
  */
  destroy () {
    this.taskCenter.destroyCallback();
    delete this.listener;
    delete this.nodeMap;
    delete this.taskCenter;
    removeDoc(this.id);
  }
}

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

const moduleProxies = {};

function setId (weex, id) {
  Object.defineProperty(weex, '[[CurrentInstanceId]]', { value: id });
}

function getId (weex) {
  return weex['[[CurrentInstanceId]]']
}

function moduleGetter (id, module, method) {
  const taskCenter = getTaskCenter(id);
  if (!taskCenter || typeof taskCenter.send !== 'function') {
    console.error(`[JS Framework] Failed to find taskCenter (${id}).`);
    return null
  }
  return (...args) => taskCenter.send('module', { module, method }, args)
}

function moduleSetter (id, module, method, fn) {
  const taskCenter = getTaskCenter(id);
  if (!taskCenter || typeof taskCenter.send !== 'function') {
    console.error(`[JS Framework] Failed to find taskCenter (${id}).`);
    return null
  }
  if (typeof fn !== 'function') {
    console.error(`[JS Framework] ${module}.${method} must be assigned as a function.`);
    return null
  }
  return fn => taskCenter.send('module', { module, method }, [fn])
}

class WeexInstance {
  constructor (id, config) {
    setId(this, String(id));
    this.config = config || {};
    this.document = new Document(id, this.config.bundleUrl);
    this.requireModule = this.requireModule.bind(this);
    this.isRegisteredModule = isRegisteredModule;
    this.isRegisteredComponent = isRegisteredComponent;
  }

  requireModule (moduleName) {
    const id = getId(this);
    if (!(id && this.document && this.document.taskCenter)) {
      console.error(`[JS Framework] Failed to requireModule("${moduleName}"), `
        + `instance (${id}) doesn't exist anymore.`);
      return
    }

    // warn for unknown module
    if (!isRegisteredModule(moduleName)) {
      console.warn(`[JS Framework] using unregistered weex module "${moduleName}"`);
      return
    }

    // create new module proxy
    const proxyName = `${moduleName}#${id}`;
    if (!moduleProxies[proxyName]) {
      // create registered module apis
      const moduleDefine = getModuleDescription(moduleName);
      const moduleApis = {};
      for (const methodName in moduleDefine) {
        Object.defineProperty(moduleApis, methodName, {
          enumerable: true,
          configurable: true,
          get: () => moduleGetter(id, moduleName, methodName),
          set: fn => moduleSetter(id, moduleName, methodName, fn)
        });
      }

      // create module Proxy
      if (typeof Proxy === 'function') {
        moduleProxies[proxyName] = new Proxy(moduleApis, {
          get (target, methodName) {
            if (methodName in target) {
              return target[methodName]
            }
            console.warn(`[JS Framework] using unregistered method "${moduleName}.${methodName}"`);
            return moduleGetter(id, moduleName, methodName)
          }
        });
      }
      else {
        moduleProxies[proxyName] = moduleApis;
      }
    }

    return moduleProxies[proxyName]
  }

  supports (condition) {
    if (typeof condition !== 'string') return null

    const res = condition.match(/^@(\w+)\/(\w+)(\.(\w+))?$/i);
    if (res) {
      const type = res[1];
      const name = res[2];
      const method = res[4];
      switch (type) {
        case 'module': return isRegisteredModule(name, method)
        case 'component': return isRegisteredComponent(name)
      }
    }

    return null
  }

  // registerStyleSheet (styles) {
  //   if (this.document) {
  //     this.document.registerStyleSheet(styles)
  //   }
  // }
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

let frameworks;
let runtimeConfig;

const versionRegExp = /^\s*\/\/ *(\{[^}]*\}) *\r?\n/;

/**
 * Detect a JS Bundle code and make sure which framework it's based to. Each JS
 * Bundle should make sure that it starts with a line of JSON comment and is
 * more that one line.
 * @param  {string} code
 * @return {object}
 */
function getBundleType (code) {
  const result = versionRegExp.exec(code);
  if (result) {
    try {
      const info = JSON.parse(result[1]);
      return info.framework
    }
    catch (e) {}
  }

  // default bundle type
  return 'Weex'
}

function createServices (id, env, config) {
  // Init JavaScript services for this instance.
  const serviceMap = Object.create(null);
  serviceMap.service = Object.create(null);
  services.forEach(({ name, options }) => {
    {
      console.debug(`[JS Runtime] create service ${name}.`);
    }
    const create = options.create;
    if (create) {
      try {
        const result = create(id, env, config);
        Object.assign(serviceMap.service, result);
        Object.assign(serviceMap, result.instance);
      }
      catch (e) {
        console.error(`[JS Runtime] Failed to create service ${name}.`);
      }
    }
  });
  delete serviceMap.service.instance;
  Object.freeze(serviceMap.service);
  return serviceMap
}

const instanceTypeMap = {};
function getFrameworkType (id) {
  return instanceTypeMap[id]
}

function createInstanceContext (id, options = {}, data) {
  const weex = new WeexInstance(id, options);
  Object.freeze(weex);

  const bundleType = options.bundleType || 'Vue';
  instanceTypeMap[id] = bundleType;
  const framework = runtimeConfig.frameworks[bundleType];
  if (!framework) {
    return new Error(`[JS Framework] Invalid bundle type "${bundleType}".`)
  }
  track(id, 'bundleType', bundleType);

  // prepare js service
  const services$$1 = createServices(id, {
    weex,
    config: options,
    created: Date.now(),
    framework: bundleType,
    bundleType
  }, runtimeConfig);
  Object.freeze(services$$1);

  // prepare runtime context
  const runtimeContext = Object.create(null);
  Object.assign(runtimeContext, services$$1, {
    weex,
    services: services$$1 // Temporary compatible with some legacy APIs in Rax
  });
  Object.freeze(runtimeContext);

  // prepare instance context
  const instanceContext = Object.assign({}, runtimeContext);
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
    return new Error(`The instance id "${id}" has already been used!`)
  }

  // Init instance info.
  const bundleType = getBundleType(code);
  instanceTypeMap[id] = bundleType;

  // Init instance config.
  config = JSON.parse(JSON.stringify(config || {}));
  config.env = JSON.parse(JSON.stringify(global.WXEnvironment || {}));
  config.bundleType = bundleType;

  const framework = runtimeConfig.frameworks[bundleType];
  if (!framework) {
    return new Error(`[JS Framework] Invalid bundle type "${bundleType}".`)
  }
  if (bundleType === 'Weex') {
    console.error(`[JS Framework] COMPATIBILITY WARNING: `
      + `Weex DSL 1.0 (.we) framework is no longer supported! `
      + `It will be removed in the next version of WeexSDK, `
      + `your page would be crash if you still using the ".we" framework. `
      + `Please upgrade it to Vue.js or Rax.`);
  }

  const instanceContext = createInstanceContext(id, config, data);
  if (typeof framework.createInstance === 'function') {
    // Temporary compatible with some legacy APIs in Rax,
    // some Rax page is using the legacy ".we" framework.
    if (bundleType === 'Rax' || bundleType === 'Weex') {
      const raxInstanceContext = Object.assign({
        config,
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
  const keys = [];
  const args = [];
  for (const key in context) {
    keys.push(key);
    args.push(context[key]);
  }

  const bundle = `
    (function (global) {
      ${code}
    })(Object.create(this))
  `;

  return (new Function(...keys, bundle))(...args)
}

/**
 * Get the JSON object of the root element.
 * @param {string} instanceId
 */
function getRoot (instanceId) {
  const document = getDoc(instanceId);
  try {
    if (document && document.body) {
      return document.body.toJSON()
    }
  }
  catch (e) {
    console.error(`[JS Framework] Failed to get the virtual dom tree.`);
    return
  }
}

const methods = {
  createInstance,
  createInstanceContext,
  getRoot,
  getDocument: getDoc,
  registerService: register,
  unregisterService: unregister,
  callJS (id, tasks) {
    const framework = frameworks[getFrameworkType(id)];
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
  methods[methodName] = function (...args) {
    const id = args[0];
    const type = getFrameworkType(id);
    if (type && frameworks[type]) {
      const result = frameworks[type][methodName](...args);
      const info = { framework: type };

      // Lifecycle methods
      if (methodName === 'refreshInstance') {
        services.forEach(service => {
          const refresh = service.options.refresh;
          if (refresh) {
            refresh(id, { info, runtime: runtimeConfig });
          }
        });
      }
      else if (methodName === 'destroyInstance') {
        services.forEach(service => {
          const destroy = service.options.destroy;
          if (destroy) {
            destroy(id, { info, runtime: runtimeConfig });
          }
        });
        delete instanceTypeMap[id];
      }

      return result
    }
    return new Error(`[JS Framework] Using invalid instance id `
      + `"${id}" when calling ${methodName}.`)
  };
}

/**
 * Register methods which init each frameworks.
 * @param {string} methodName
 * @param {function} sharedMethod
 */
function adaptMethod (methodName, sharedMethod) {
  methods[methodName] = function (...args) {
    if (typeof sharedMethod === 'function') {
      sharedMethod(...args);
    }

    // TODO: deprecated
    for (const name in runtimeConfig.frameworks) {
      const framework = runtimeConfig.frameworks[name];
      if (framework && framework[methodName]) {
        framework[methodName](...args);
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
  for (const name in frameworks) {
    const framework = frameworks[name];
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

const config = {
  Document, Element, Comment, Listener,
  TaskCenter,
  sendTasks (...args) {
    if (typeof callNative === 'function') {
      return callNative(...args)
    }
    return (global.callNative || (() => {}))(...args)
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
  service: { register, unregister, has },
  freezePrototype,
  init: init$$1,
  config
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
function MessageEvent (type, dict = {}) {
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

const channels = {};
const instances = {};

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
  if (this._closed) {
    throw new Error(`BroadcastChannel "${this.name}" is closed.`)
  }

  const subscribers = channels[this.name];
  if (subscribers && subscribers.length) {
    for (let i = 0; i < subscribers.length; ++i) {
      const member = subscribers[i];

      if (member._closed || member === this) continue

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
  if (this._closed) {
    return
  }

  this._closed = true;

  // remove itself from channels.
  if (channels[this.name]) {
    const subscribers = channels[this.name].filter(x => x !== this);
    if (subscribers.length) {
      channels[this.name] = subscribers;
    }
    else {
      delete channels[this.name];
    }
  }
};

var BroadcastChannel$1 = {
  create: (id, env, config) => {
    instances[id] = [];
    if (typeof global.BroadcastChannel === 'function') {
      return {}
    }
    const serviceObject = {
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
  destroy: (id, env) => {
    instances[id].forEach(channel => channel.close());
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
  const { init, config } = runtime;
  config.frameworks = frameworks;
  const { native, transformer } = subversion;

  for (const serviceName in services$1) {
    runtime.service.register(serviceName, services$1[serviceName]);
  }

  runtime.freezePrototype();

  // register framework meta info
  global.frameworkVersion = native;
  global.transformerVersion = transformer;

  // init frameworks
  const globalMethods = init(config);

  // set global methods
  for (const methodName in globalMethods) {
    global[methodName] = (...args) => {
      const ret = globalMethods[methodName](...args);
      if (ret instanceof Error) {
        console.error(ret.toString());
      }
      return ret
    };
  }
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
  if ( text === void 0 ) text = '';

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
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

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

  for (var key in propsOptions) loop( key );
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

      for (var key in value) loop( key );
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
  if ( options === void 0 ) options = {};

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
  if ( data === void 0 ) data = {};

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
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var handler = function () {
        args[0].apply(args, args.slice(2));
      };

      timer.setTimeout(handler, args[1]);
      return instance.document.taskCenter.callbackManager.lastCallbackId.toString()
    },
    setInterval: function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

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

setup({ Vue });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VleC12dWUuZXM2LmpzIiwic291cmNlcyI6WyIuLi9ydW50aW1lL3NoYXJlZC91dGlscy5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL25vcm1hbGl6ZS5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL0NhbGxiYWNrTWFuYWdlci5qcyIsIi4uL3J1bnRpbWUvdmRvbS9vcGVyYXRpb24uanMiLCIuLi9ydW50aW1lL3Zkb20vTm9kZS5qcyIsIi4uL3J1bnRpbWUvdmRvbS9XZWV4RWxlbWVudC5qcyIsIi4uL3J1bnRpbWUvdmRvbS9FbGVtZW50LmpzIiwiLi4vcnVudGltZS9icmlkZ2UvVGFza0NlbnRlci5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL3JlY2VpdmVyLmpzIiwiLi4vcnVudGltZS9hcGkvbW9kdWxlLmpzIiwiLi4vcnVudGltZS9hcGkvY29tcG9uZW50LmpzIiwiLi4vcnVudGltZS9hcGkvc2VydmljZS5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL2RlYnVnLmpzIiwiLi4vcnVudGltZS92ZG9tL0NvbW1lbnQuanMiLCIuLi9ydW50aW1lL2JyaWRnZS9MaXN0ZW5lci5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL0hhbmRsZXIuanMiLCIuLi9ydW50aW1lL3Zkb20vRG9jdW1lbnQuanMiLCIuLi9ydW50aW1lL2FwaS9XZWV4SW5zdGFuY2UuanMiLCIuLi9ydW50aW1lL2FwaS9pbml0LmpzIiwiLi4vcnVudGltZS92ZG9tL2luZGV4LmpzIiwiLi4vcnVudGltZS9hcGkvY29uZmlnLmpzIiwiLi4vcnVudGltZS9hcGkvaW5kZXguanMiLCIuLi9ydW50aW1lL3NlcnZpY2VzL2Jyb2FkY2FzdC1jaGFubmVsL21lc3NhZ2UtZXZlbnQuanMiLCIuLi9ydW50aW1lL3NlcnZpY2VzL2Jyb2FkY2FzdC1jaGFubmVsL2luZGV4LmpzIiwiLi4vcnVudGltZS9zZXJ2aWNlcy9pbmRleC5qcyIsIi4uL3J1bnRpbWUvZW50cmllcy9zZXR1cC5qcyIsIi4uL25vZGVfbW9kdWxlcy93ZWV4LXZ1ZS1mcmFtZXdvcmsvZmFjdG9yeS5qcyIsIi4uL25vZGVfbW9kdWxlcy93ZWV4LXZ1ZS1mcmFtZXdvcmsvaW5kZXguanMiLCIuLi9ydW50aW1lL2VudHJpZXMvdnVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEdldCBhIHVuaXF1ZSBpZC5cbiAqL1xubGV0IG5leHROb2RlUmVmID0gMVxuZXhwb3J0IGZ1bmN0aW9uIHVuaXF1ZUlkICgpIHtcbiAgcmV0dXJuIChuZXh0Tm9kZVJlZisrKS50b1N0cmluZygpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0eXBvZiAodikge1xuICBjb25zdCBzID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpXG4gIHJldHVybiBzLnN1YnN0cmluZyg4LCBzLmxlbmd0aCAtIDEpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWZmZXJUb0Jhc2U2NCAoYnVmZmVyKSB7XG4gIGlmICh0eXBlb2YgYnRvYSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiAnJ1xuICB9XG4gIGNvbnN0IHN0cmluZyA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChcbiAgICBuZXcgVWludDhBcnJheShidWZmZXIpLFxuICAgIGNvZGUgPT4gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKVxuICApLmpvaW4oJycpXG4gIHJldHVybiBidG9hKHN0cmluZykgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxufVxuXG5leHBvcnQgZnVuY3Rpb24gYmFzZTY0VG9CdWZmZXIgKGJhc2U2NCkge1xuICBpZiAodHlwZW9mIGF0b2IgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gbmV3IEFycmF5QnVmZmVyKDApXG4gIH1cbiAgY29uc3Qgc3RyaW5nID0gYXRvYihiYXNlNjQpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShzdHJpbmcubGVuZ3RoKVxuICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHN0cmluZywgKGNoLCBpKSA9PiB7XG4gICAgYXJyYXlbaV0gPSBjaC5jaGFyQ29kZUF0KDApXG4gIH0pXG4gIHJldHVybiBhcnJheS5idWZmZXJcbn1cblxuLyoqXG4gKiBEZXRlY3QgaWYgdGhlIHBhcmFtIGlzIGZhbHN5IG9yIGVtcHR5XG4gKiBAcGFyYW0ge2FueX0gYW55XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0VtcHR5IChhbnkpIHtcbiAgaWYgKCFhbnkgfHwgdHlwZW9mIGFueSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgaW4gYW55KSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhbnksIGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IHR5cG9mLCBidWZmZXJUb0Jhc2U2NCwgYmFzZTY0VG9CdWZmZXIgfSBmcm9tICcuLi9zaGFyZWQvdXRpbHMnXG5cbi8qKlxuICogTm9ybWFsaXplIGEgcHJpbWl0aXZlIHZhbHVlLlxuICogQHBhcmFtICB7YW55fSAgICAgICAgdlxuICogQHJldHVybiB7cHJpbWl0aXZlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUHJpbWl0aXZlICh2KSB7XG4gIGNvbnN0IHR5cGUgPSB0eXBvZih2KVxuXG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ1VuZGVmaW5lZCc6XG4gICAgY2FzZSAnTnVsbCc6XG4gICAgICByZXR1cm4gJydcblxuICAgIGNhc2UgJ1JlZ0V4cCc6XG4gICAgICByZXR1cm4gdi50b1N0cmluZygpXG4gICAgY2FzZSAnRGF0ZSc6XG4gICAgICByZXR1cm4gdi50b0lTT1N0cmluZygpXG5cbiAgICBjYXNlICdOdW1iZXInOlxuICAgIGNhc2UgJ1N0cmluZyc6XG4gICAgY2FzZSAnQm9vbGVhbic6XG4gICAgY2FzZSAnQXJyYXknOlxuICAgIGNhc2UgJ09iamVjdCc6XG4gICAgICByZXR1cm4gdlxuXG4gICAgY2FzZSAnQXJyYXlCdWZmZXInOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgJ0B0eXBlJzogJ2JpbmFyeScsXG4gICAgICAgIGRhdGFUeXBlOiB0eXBlLFxuICAgICAgICBiYXNlNjQ6IGJ1ZmZlclRvQmFzZTY0KHYpXG4gICAgICB9XG5cbiAgICBjYXNlICdJbnQ4QXJyYXknOlxuICAgIGNhc2UgJ1VpbnQ4QXJyYXknOlxuICAgIGNhc2UgJ1VpbnQ4Q2xhbXBlZEFycmF5JzpcbiAgICBjYXNlICdJbnQxNkFycmF5JzpcbiAgICBjYXNlICdVaW50MTZBcnJheSc6XG4gICAgY2FzZSAnSW50MzJBcnJheSc6XG4gICAgY2FzZSAnVWludDMyQXJyYXknOlxuICAgIGNhc2UgJ0Zsb2F0MzJBcnJheSc6XG4gICAgY2FzZSAnRmxvYXQ2NEFycmF5JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgICdAdHlwZSc6ICdiaW5hcnknLFxuICAgICAgICBkYXRhVHlwZTogdHlwZSxcbiAgICAgICAgYmFzZTY0OiBidWZmZXJUb0Jhc2U2NCh2LmJ1ZmZlcilcbiAgICAgIH1cblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodilcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlUHJpbWl0aXZlIChkYXRhKSB7XG4gIGlmICh0eXBvZihkYXRhKSA9PT0gJ09iamVjdCcpIHtcbiAgICAvLyBkZWNvZGUgYmFzZTY0IGludG8gYmluYXJ5XG4gICAgaWYgKGRhdGFbJ0B0eXBlJ10gJiYgZGF0YVsnQHR5cGUnXSA9PT0gJ2JpbmFyeScpIHtcbiAgICAgIHJldHVybiBiYXNlNjRUb0J1ZmZlcihkYXRhLmJhc2U2NCB8fCAnJylcbiAgICB9XG5cbiAgICBjb25zdCByZWFsRGF0YSA9IHt9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuICAgICAgcmVhbERhdGFba2V5XSA9IGRlY29kZVByaW1pdGl2ZShkYXRhW2tleV0pXG4gICAgfVxuICAgIHJldHVybiByZWFsRGF0YVxuICB9XG4gIGlmICh0eXBvZihkYXRhKSA9PT0gJ0FycmF5Jykge1xuICAgIHJldHVybiBkYXRhLm1hcChkZWNvZGVQcmltaXRpdmUpXG4gIH1cbiAgcmV0dXJuIGRhdGFcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBkZWNvZGVQcmltaXRpdmUgfSBmcm9tICcuL25vcm1hbGl6ZSdcblxuZnVuY3Rpb24gZ2V0SG9va0tleSAoY29tcG9uZW50SWQsIHR5cGUsIGhvb2tOYW1lKSB7XG4gIHJldHVybiBgJHt0eXBlfUAke2hvb2tOYW1lfSMke2NvbXBvbmVudElkfWBcbn1cblxuLyoqXG4gKiBGb3IgZ2VuZXJhbCBjYWxsYmFjayBtYW5hZ2VtZW50IG9mIGEgY2VydGFpbiBXZWV4IGluc3RhbmNlLlxuICogQmVjYXVzZSBmdW5jdGlvbiBjYW4gbm90IHBhc3NlZCBpbnRvIG5hdGl2ZSwgc28gd2UgY3JlYXRlIGNhbGxiYWNrXG4gKiBjYWxsYmFjayBpZCBmb3IgZWFjaCBmdW5jdGlvbiBhbmQgcGFzcyB0aGUgY2FsbGJhY2sgaWQgaW50byBuYXRpdmVcbiAqIGluIGZhY3QuIEFuZCB3aGVuIGEgY2FsbGJhY2sgY2FsbGVkIGZyb20gbmF0aXZlLCB3ZSBjYW4gZmluZCB0aGUgcmVhbFxuICogY2FsbGJhY2sgdGhyb3VnaCB0aGUgY2FsbGJhY2sgaWQgd2UgaGF2ZSBwYXNzZWQgYmVmb3JlLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYWxsYmFja01hbmFnZXIge1xuICBjb25zdHJ1Y3RvciAoaW5zdGFuY2VJZCkge1xuICAgIHRoaXMuaW5zdGFuY2VJZCA9IFN0cmluZyhpbnN0YW5jZUlkKVxuICAgIHRoaXMubGFzdENhbGxiYWNrSWQgPSAwXG4gICAgdGhpcy5jYWxsYmFja3MgPSB7fVxuICAgIHRoaXMuaG9va3MgPSB7fVxuICB9XG4gIGFkZCAoY2FsbGJhY2spIHtcbiAgICB0aGlzLmxhc3RDYWxsYmFja0lkKytcbiAgICB0aGlzLmNhbGxiYWNrc1t0aGlzLmxhc3RDYWxsYmFja0lkXSA9IGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubGFzdENhbGxiYWNrSWRcbiAgfVxuICByZW1vdmUgKGNhbGxiYWNrSWQpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuY2FsbGJhY2tzW2NhbGxiYWNrSWRdXG4gICAgZGVsZXRlIHRoaXMuY2FsbGJhY2tzW2NhbGxiYWNrSWRdXG4gICAgcmV0dXJuIGNhbGxiYWNrXG4gIH1cbiAgcmVnaXN0ZXJIb29rIChjb21wb25lbnRJZCwgdHlwZSwgaG9va05hbWUsIGhvb2tGdW5jdGlvbikge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIGFyZ3VtZW50c1xuICAgIGNvbnN0IGtleSA9IGdldEhvb2tLZXkoY29tcG9uZW50SWQsIHR5cGUsIGhvb2tOYW1lKVxuICAgIGlmICh0aGlzLmhvb2tzW2tleV0pIHtcbiAgICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gT3ZlcnJpZGUgYW4gZXhpc3RpbmcgY29tcG9uZW50IGhvb2sgXCIke2tleX1cIi5gKVxuICAgIH1cbiAgICB0aGlzLmhvb2tzW2tleV0gPSBob29rRnVuY3Rpb25cbiAgfVxuICB0cmlnZ2VySG9vayAoY29tcG9uZW50SWQsIHR5cGUsIGhvb2tOYW1lLCBvcHRpb25zID0ge30pIHtcbiAgICAvLyBUT0RPOiB2YWxpZGF0ZSBhcmd1bWVudHNcbiAgICBjb25zdCBrZXkgPSBnZXRIb29rS2V5KGNvbXBvbmVudElkLCB0eXBlLCBob29rTmFtZSlcbiAgICBjb25zdCBob29rRnVuY3Rpb24gPSB0aGlzLmhvb2tzW2tleV1cbiAgICBpZiAodHlwZW9mIGhvb2tGdW5jdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gSW52YWxpZCBob29rIGZ1bmN0aW9uIHR5cGUgKCR7dHlwZW9mIGhvb2tGdW5jdGlvbn0pIG9uIFwiJHtrZXl9XCIuYClcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBudWxsXG4gICAgdHJ5IHtcbiAgICAgIHJlc3VsdCA9IGhvb2tGdW5jdGlvbi5hcHBseShudWxsLCBvcHRpb25zLmFyZ3MgfHwgW10pXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gZXhlY3V0ZSB0aGUgaG9vayBmdW5jdGlvbiBvbiBcIiR7a2V5fVwiLmApXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBjb25zdW1lIChjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSkge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3NbY2FsbGJhY2tJZF1cbiAgICBpZiAodHlwZW9mIGlmS2VlcEFsaXZlID09PSAndW5kZWZpbmVkJyB8fCBpZktlZXBBbGl2ZSA9PT0gZmFsc2UpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmNhbGxiYWNrc1tjYWxsYmFja0lkXVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZGVjb2RlUHJpbWl0aXZlKGRhdGEpKVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEVycm9yKGBpbnZhbGlkIGNhbGxiYWNrIGlkIFwiJHtjYWxsYmFja0lkfVwiYClcbiAgfVxuICBjbG9zZSAoKSB7XG4gICAgdGhpcy5jYWxsYmFja3MgPSB7fVxuICAgIHRoaXMuaG9va3MgPSB7fVxuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuY29uc3QgZG9jTWFwID0ge31cblxuLyoqXG4gKiBBZGQgYSBkb2N1bWVudCBvYmplY3QgaW50byBkb2NNYXAuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSBkb2N1bWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkRG9jIChpZCwgZG9jKSB7XG4gIGlmIChpZCkge1xuICAgIGRvY01hcFtpZF0gPSBkb2NcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgZG9jdW1lbnQgb2JqZWN0IGJ5IGlkLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREb2MgKGlkKSB7XG4gIHJldHVybiBkb2NNYXBbaWRdXG59XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBkb2N1bWVudCBmcm9tIGRvY01hcCBieSBpZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRG9jIChpZCkge1xuICBkZWxldGUgZG9jTWFwW2lkXVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiBHZXQgbGlzdGVuZXIgYnkgZG9jdW1lbnQgaWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEByZXR1cm4ge29iamVjdH0gbGlzdGVuZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExpc3RlbmVyIChpZCkge1xuICBjb25zdCBkb2MgPSBkb2NNYXBbaWRdXG4gIGlmIChkb2MgJiYgZG9jLmxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIGRvYy5saXN0ZW5lclxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogR2V0IFRhc2tDZW50ZXIgaW5zdGFuY2UgYnkgaWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEByZXR1cm4ge29iamVjdH0gVGFza0NlbnRlclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFza0NlbnRlciAoaWQpIHtcbiAgY29uc3QgZG9jID0gZG9jTWFwW2lkXVxuICBpZiAoZG9jICYmIGRvYy50YXNrQ2VudGVyKSB7XG4gICAgcmV0dXJuIGRvYy50YXNrQ2VudGVyXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBBcHBlbmQgYm9keSBub2RlIHRvIGRvY3VtZW50RWxlbWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBkb2N1bWVudFxuICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBiZWZvcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZEJvZHkgKGRvYywgbm9kZSwgYmVmb3JlKSB7XG4gIGNvbnN0IHsgZG9jdW1lbnRFbGVtZW50IH0gPSBkb2NcblxuICBpZiAoZG9jdW1lbnRFbGVtZW50LnB1cmVDaGlsZHJlbi5sZW5ndGggPiAwIHx8IG5vZGUucGFyZW50Tm9kZSkge1xuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGNoaWxkcmVuID0gZG9jdW1lbnRFbGVtZW50LmNoaWxkcmVuXG4gIGNvbnN0IGJlZm9yZUluZGV4ID0gY2hpbGRyZW4uaW5kZXhPZihiZWZvcmUpXG4gIGlmIChiZWZvcmVJbmRleCA8IDApIHtcbiAgICBjaGlsZHJlbi5wdXNoKG5vZGUpXG4gIH1cbiAgZWxzZSB7XG4gICAgY2hpbGRyZW4uc3BsaWNlKGJlZm9yZUluZGV4LCAwLCBub2RlKVxuICB9XG5cbiAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICBpZiAobm9kZS5yb2xlID09PSAnYm9keScpIHtcbiAgICAgIG5vZGUuZG9jSWQgPSBkb2MuaWRcbiAgICAgIG5vZGUub3duZXJEb2N1bWVudCA9IGRvY1xuICAgICAgbm9kZS5wYXJlbnROb2RlID0gZG9jdW1lbnRFbGVtZW50XG4gICAgICBsaW5rUGFyZW50KG5vZGUsIGRvY3VtZW50RWxlbWVudClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICBjaGlsZC5wYXJlbnROb2RlID0gbm9kZVxuICAgICAgfSlcbiAgICAgIHNldEJvZHkoZG9jLCBub2RlKVxuICAgICAgbm9kZS5kb2NJZCA9IGRvYy5pZFxuICAgICAgbm9kZS5vd25lckRvY3VtZW50ID0gZG9jXG4gICAgICBsaW5rUGFyZW50KG5vZGUsIGRvY3VtZW50RWxlbWVudClcbiAgICAgIGRlbGV0ZSBkb2Mubm9kZU1hcFtub2RlLm5vZGVJZF1cbiAgICB9XG4gICAgZG9jdW1lbnRFbGVtZW50LnB1cmVDaGlsZHJlbi5wdXNoKG5vZGUpXG4gICAgc2VuZEJvZHkoZG9jLCBub2RlKVxuICB9XG4gIGVsc2Uge1xuICAgIG5vZGUucGFyZW50Tm9kZSA9IGRvY3VtZW50RWxlbWVudFxuICAgIGRvYy5ub2RlTWFwW25vZGUucmVmXSA9IG5vZGVcbiAgfVxufVxuXG5mdW5jdGlvbiBzZW5kQm9keSAoZG9jLCBub2RlKSB7XG4gIGNvbnN0IGJvZHkgPSBub2RlLnRvSlNPTigpXG4gIGlmIChkb2MgJiYgZG9jLnRhc2tDZW50ZXIgJiYgdHlwZW9mIGRvYy50YXNrQ2VudGVyLnNlbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkb2MudGFza0NlbnRlci5zZW5kKCdkb20nLCB7IGFjdGlvbjogJ2NyZWF0ZUJvZHknIH0sIFtib2R5XSlcbiAgfVxufVxuXG4vKipcbiAqIFNldCB1cCBib2R5IG5vZGUuXG4gKiBAcGFyYW0ge29iamVjdH0gZG9jdW1lbnRcbiAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRCb2R5IChkb2MsIGVsKSB7XG4gIGVsLnJvbGUgPSAnYm9keSdcbiAgZWwuZGVwdGggPSAxXG4gIGRlbGV0ZSBkb2Mubm9kZU1hcFtlbC5ub2RlSWRdXG4gIGVsLnJlZiA9ICdfcm9vdCdcbiAgZG9jLm5vZGVNYXAuX3Jvb3QgPSBlbFxuICBkb2MuYm9keSA9IGVsXG59XG5cbi8qKlxuICogRXN0YWJsaXNoIHRoZSBjb25uZWN0aW9uIGJldHdlZW4gcGFyZW50IGFuZCBjaGlsZCBub2RlLlxuICogQHBhcmFtIHtvYmplY3R9IGNoaWxkIG5vZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnQgbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlua1BhcmVudCAobm9kZSwgcGFyZW50KSB7XG4gIG5vZGUucGFyZW50Tm9kZSA9IHBhcmVudFxuICBpZiAocGFyZW50LmRvY0lkKSB7XG4gICAgbm9kZS5kb2NJZCA9IHBhcmVudC5kb2NJZFxuICAgIG5vZGUub3duZXJEb2N1bWVudCA9IHBhcmVudC5vd25lckRvY3VtZW50XG4gICAgbm9kZS5vd25lckRvY3VtZW50Lm5vZGVNYXBbbm9kZS5ub2RlSWRdID0gbm9kZVxuICAgIG5vZGUuZGVwdGggPSBwYXJlbnQuZGVwdGggKyAxXG4gIH1cbiAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICBsaW5rUGFyZW50KGNoaWxkLCBub2RlKVxuICB9KVxufVxuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBzaWJsaW5nIGVsZW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbmV4dEVsZW1lbnQgKG5vZGUpIHtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIG5vZGVcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmdcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgcHJldmlvdXMgc2libGluZyBlbGVtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZXZpb3VzRWxlbWVudCAobm9kZSkge1xuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICByZXR1cm4gbm9kZVxuICAgIH1cbiAgICBub2RlID0gbm9kZS5wcmV2aW91c1NpYmxpbmdcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydCBhIG5vZGUgaW50byBsaXN0IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IG5vZGVcbiAqIEBwYXJhbSB7YXJyYXl9IGxpc3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBuZXdJbmRleFxuICogQHBhcmFtIHtib29sZWFufSBjaGFuZ2VTaWJsaW5nXG4gKiBAcmV0dXJuIHtudW1iZXJ9IG5ld0luZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRJbmRleCAodGFyZ2V0LCBsaXN0LCBuZXdJbmRleCwgY2hhbmdlU2libGluZykge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAobmV3SW5kZXggPCAwKSB7XG4gICAgbmV3SW5kZXggPSAwXG4gIH1cbiAgY29uc3QgYmVmb3JlID0gbGlzdFtuZXdJbmRleCAtIDFdXG4gIGNvbnN0IGFmdGVyID0gbGlzdFtuZXdJbmRleF1cbiAgbGlzdC5zcGxpY2UobmV3SW5kZXgsIDAsIHRhcmdldClcbiAgaWYgKGNoYW5nZVNpYmxpbmcpIHtcbiAgICBiZWZvcmUgJiYgKGJlZm9yZS5uZXh0U2libGluZyA9IHRhcmdldClcbiAgICB0YXJnZXQucHJldmlvdXNTaWJsaW5nID0gYmVmb3JlXG4gICAgdGFyZ2V0Lm5leHRTaWJsaW5nID0gYWZ0ZXJcbiAgICBhZnRlciAmJiAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nID0gdGFyZ2V0KVxuICB9XG4gIHJldHVybiBuZXdJbmRleFxufVxuXG4vKipcbiAqIE1vdmUgdGhlIG5vZGUgdG8gYSBuZXcgaW5kZXggaW4gbGlzdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgbm9kZVxuICogQHBhcmFtIHthcnJheX0gbGlzdFxuICogQHBhcmFtIHtudW1iZXJ9IG5ld0luZGV4XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoYW5nZVNpYmxpbmdcbiAqIEByZXR1cm4ge251bWJlcn0gbmV3SW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVJbmRleCAodGFyZ2V0LCBsaXN0LCBuZXdJbmRleCwgY2hhbmdlU2libGluZykge1xuICBjb25zdCBpbmRleCA9IGxpc3QuaW5kZXhPZih0YXJnZXQpXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmIChpbmRleCA8IDApIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoY2hhbmdlU2libGluZykge1xuICAgIGNvbnN0IGJlZm9yZSA9IGxpc3RbaW5kZXggLSAxXVxuICAgIGNvbnN0IGFmdGVyID0gbGlzdFtpbmRleCArIDFdXG4gICAgYmVmb3JlICYmIChiZWZvcmUubmV4dFNpYmxpbmcgPSBhZnRlcilcbiAgICBhZnRlciAmJiAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nID0gYmVmb3JlKVxuICB9XG4gIGxpc3Quc3BsaWNlKGluZGV4LCAxKVxuICBsZXQgbmV3SW5kZXhBZnRlciA9IG5ld0luZGV4XG4gIGlmIChpbmRleCA8PSBuZXdJbmRleCkge1xuICAgIG5ld0luZGV4QWZ0ZXIgPSBuZXdJbmRleCAtIDFcbiAgfVxuICBjb25zdCBiZWZvcmVOZXcgPSBsaXN0W25ld0luZGV4QWZ0ZXIgLSAxXVxuICBjb25zdCBhZnRlck5ldyA9IGxpc3RbbmV3SW5kZXhBZnRlcl1cbiAgbGlzdC5zcGxpY2UobmV3SW5kZXhBZnRlciwgMCwgdGFyZ2V0KVxuICBpZiAoY2hhbmdlU2libGluZykge1xuICAgIGJlZm9yZU5ldyAmJiAoYmVmb3JlTmV3Lm5leHRTaWJsaW5nID0gdGFyZ2V0KVxuICAgIHRhcmdldC5wcmV2aW91c1NpYmxpbmcgPSBiZWZvcmVOZXdcbiAgICB0YXJnZXQubmV4dFNpYmxpbmcgPSBhZnRlck5ld1xuICAgIGFmdGVyTmV3ICYmIChhZnRlck5ldy5wcmV2aW91c1NpYmxpbmcgPSB0YXJnZXQpXG4gIH1cbiAgaWYgKGluZGV4ID09PSBuZXdJbmRleEFmdGVyKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgcmV0dXJuIG5ld0luZGV4XG59XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBub2RlIGZyb20gbGlzdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgbm9kZVxuICogQHBhcmFtIHthcnJheX0gbGlzdFxuICogQHBhcmFtIHtib29sZWFufSBjaGFuZ2VTaWJsaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVJbmRleCAodGFyZ2V0LCBsaXN0LCBjaGFuZ2VTaWJsaW5nKSB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKHRhcmdldClcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIHJldHVyblxuICB9XG4gIGlmIChjaGFuZ2VTaWJsaW5nKSB7XG4gICAgY29uc3QgYmVmb3JlID0gbGlzdFtpbmRleCAtIDFdXG4gICAgY29uc3QgYWZ0ZXIgPSBsaXN0W2luZGV4ICsgMV1cbiAgICBiZWZvcmUgJiYgKGJlZm9yZS5uZXh0U2libGluZyA9IGFmdGVyKVxuICAgIGFmdGVyICYmIChhZnRlci5wcmV2aW91c1NpYmxpbmcgPSBiZWZvcmUpXG4gIH1cbiAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgdW5pcXVlSWQgfSBmcm9tICcuLi9zaGFyZWQvdXRpbHMnXG5pbXBvcnQgeyBnZXREb2MgfSBmcm9tICcuL29wZXJhdGlvbidcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTm9kZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLm5vZGVJZCA9IHVuaXF1ZUlkKClcbiAgICB0aGlzLnJlZiA9IHRoaXMubm9kZUlkXG4gICAgdGhpcy5jaGlsZHJlbiA9IFtdXG4gICAgdGhpcy5wdXJlQ2hpbGRyZW4gPSBbXVxuICAgIHRoaXMucGFyZW50Tm9kZSA9IG51bGxcbiAgICB0aGlzLm5leHRTaWJsaW5nID0gbnVsbFxuICAgIHRoaXMucHJldmlvdXNTaWJsaW5nID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICogRGVzdHJveSBjdXJyZW50IG5vZGUsIGFuZCByZW1vdmUgaXRzZWxmIGZvcm0gbm9kZU1hcC5cbiAgKi9cbiAgZGVzdHJveSAoKSB7XG4gICAgY29uc3QgZG9jID0gZ2V0RG9jKHRoaXMuZG9jSWQpXG4gICAgaWYgKGRvYykge1xuICAgICAgZGVsZXRlIHRoaXMuZG9jSWRcbiAgICAgIGRlbGV0ZSBkb2Mubm9kZU1hcFt0aGlzLm5vZGVJZF1cbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgIGNoaWxkLmRlc3Ryb3koKVxuICAgIH0pXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgZ2V0VGFza0NlbnRlciB9IGZyb20gJy4vb3BlcmF0aW9uJ1xuXG5sZXQgRWxlbWVudFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0RWxlbWVudCAoRWwpIHtcbiAgRWxlbWVudCA9IEVsXG59XG5cbi8qKlxuICogQSBtYXAgd2hpY2ggc3RvcmVzIGFsbCB0eXBlIG9mIGVsZW1lbnRzLlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgcmVnaXN0ZXJlZEVsZW1lbnRzID0ge31cblxuLyoqXG4gKiBSZWdpc3RlciBhbiBleHRlbmRlZCBlbGVtZW50IHR5cGUgd2l0aCBjb21wb25lbnQgbWV0aG9kcy5cbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZSAgICBjb21wb25lbnQgdHlwZVxuICogQHBhcmFtICB7YXJyYXl9ICBtZXRob2RzIGEgbGlzdCBvZiBtZXRob2QgbmFtZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRWxlbWVudCAodHlwZSwgbWV0aG9kcykge1xuICAvLyBTa2lwIHdoZW4gbm8gc3BlY2lhbCBjb21wb25lbnQgbWV0aG9kcy5cbiAgaWYgKCFtZXRob2RzIHx8ICFtZXRob2RzLmxlbmd0aCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy8gSW5pdCBjb25zdHJ1Y3Rvci5cbiAgY2xhc3MgV2VleEVsZW1lbnQgZXh0ZW5kcyBFbGVtZW50IHt9XG5cbiAgLy8gQWRkIG1ldGhvZHMgdG8gcHJvdG90eXBlLlxuICBtZXRob2RzLmZvckVhY2gobWV0aG9kTmFtZSA9PiB7XG4gICAgV2VleEVsZW1lbnQucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKCdjb21wb25lbnQnLCB7XG4gICAgICAgICAgcmVmOiB0aGlzLnJlZixcbiAgICAgICAgICBjb21wb25lbnQ6IHR5cGUsXG4gICAgICAgICAgbWV0aG9kOiBtZXRob2ROYW1lXG4gICAgICAgIH0sIGFyZ3MpXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIEFkZCB0byBlbGVtZW50IHR5cGUgbWFwLlxuICByZWdpc3RlcmVkRWxlbWVudHNbdHlwZV0gPSBXZWV4RWxlbWVudFxufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5yZWdpc3RlckVsZW1lbnQgKHR5cGUpIHtcbiAgZGVsZXRlIHJlZ2lzdGVyZWRFbGVtZW50c1t0eXBlXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2VleEVsZW1lbnQgKHR5cGUpIHtcbiAgcmV0dXJuIHJlZ2lzdGVyZWRFbGVtZW50c1t0eXBlXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXZWV4RWxlbWVudCAodHlwZSkge1xuICByZXR1cm4gISFyZWdpc3RlcmVkRWxlbWVudHNbdHlwZV1cbn1cblxuLyoqXG4gKiBDbGVhciBhbGwgZWxlbWVudCB0eXBlcy4gT25seSBmb3IgdGVzdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyV2VleEVsZW1lbnRzICgpIHtcbiAgZm9yIChjb25zdCB0eXBlIGluIHJlZ2lzdGVyZWRFbGVtZW50cykge1xuICAgIHVucmVnaXN0ZXJFbGVtZW50KHR5cGUpXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL05vZGUnXG5pbXBvcnQge1xuICBnZXREb2MsXG4gIGdldFRhc2tDZW50ZXIsXG4gIGxpbmtQYXJlbnQsXG4gIG5leHRFbGVtZW50LFxuICBwcmV2aW91c0VsZW1lbnQsXG4gIGluc2VydEluZGV4LFxuICBtb3ZlSW5kZXgsXG4gIHJlbW92ZUluZGV4XG59IGZyb20gJy4vb3BlcmF0aW9uJ1xuaW1wb3J0IHsgdW5pcXVlSWQsIGlzRW1wdHkgfSBmcm9tICcuLi9zaGFyZWQvdXRpbHMnXG5pbXBvcnQgeyBnZXRXZWV4RWxlbWVudCwgc2V0RWxlbWVudCB9IGZyb20gJy4vV2VleEVsZW1lbnQnXG5cbmNvbnN0IERFRkFVTFRfVEFHX05BTUUgPSAnZGl2J1xuY29uc3QgQlVCQkxFX0VWRU5UUyA9IFtcbiAgJ2NsaWNrJywgJ2xvbmdwcmVzcycsICd0b3VjaHN0YXJ0JywgJ3RvdWNobW92ZScsICd0b3VjaGVuZCcsXG4gICdwYW5zdGFydCcsICdwYW5tb3ZlJywgJ3BhbmVuZCcsICdob3Jpem9udGFscGFuJywgJ3ZlcnRpY2FscGFuJywgJ3N3aXBlJ1xuXVxuXG5mdW5jdGlvbiByZWdpc3Rlck5vZGUgKGRvY0lkLCBub2RlKSB7XG4gIGNvbnN0IGRvYyA9IGdldERvYyhkb2NJZClcbiAgZG9jLm5vZGVNYXBbbm9kZS5ub2RlSWRdID0gbm9kZVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbGVtZW50IGV4dGVuZHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yICh0eXBlID0gREVGQVVMVF9UQUdfTkFNRSwgcHJvcHMsIGlzRXh0ZW5kZWQpIHtcbiAgICBzdXBlcigpXG5cbiAgICBjb25zdCBXZWV4RWxlbWVudCA9IGdldFdlZXhFbGVtZW50KHR5cGUpXG4gICAgaWYgKFdlZXhFbGVtZW50ICYmICFpc0V4dGVuZGVkKSB7XG4gICAgICByZXR1cm4gbmV3IFdlZXhFbGVtZW50KHR5cGUsIHByb3BzLCB0cnVlKVxuICAgIH1cblxuICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICB0aGlzLm5vZGVUeXBlID0gMVxuICAgIHRoaXMubm9kZUlkID0gdW5pcXVlSWQoKVxuICAgIHRoaXMucmVmID0gdGhpcy5ub2RlSWRcbiAgICB0aGlzLnR5cGUgPSB0eXBlXG4gICAgdGhpcy5hdHRyID0gcHJvcHMuYXR0ciB8fCB7fVxuICAgIHRoaXMuc3R5bGUgPSBwcm9wcy5zdHlsZSB8fCB7fVxuICAgIHRoaXMuY2xhc3NTdHlsZSA9IHByb3BzLmNsYXNzU3R5bGUgfHwge31cbiAgICB0aGlzLmV2ZW50ID0ge31cbiAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICB0aGlzLnB1cmVDaGlsZHJlbiA9IFtdXG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIGEgY2hpbGQgbm9kZS5cbiAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBhcHBlbmRDaGlsZCAobm9kZSkge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUgJiYgbm9kZS5wYXJlbnROb2RlICE9PSB0aGlzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICBpZiAoIW5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbGlua1BhcmVudChub2RlLCB0aGlzKVxuICAgICAgaW5zZXJ0SW5kZXgobm9kZSwgdGhpcy5jaGlsZHJlbiwgdGhpcy5jaGlsZHJlbi5sZW5ndGgsIHRydWUpXG4gICAgICBpZiAodGhpcy5kb2NJZCkge1xuICAgICAgICByZWdpc3Rlck5vZGUodGhpcy5kb2NJZCwgbm9kZSlcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGluc2VydEluZGV4KG5vZGUsIHRoaXMucHVyZUNoaWxkcmVuLCB0aGlzLnB1cmVDaGlsZHJlbi5sZW5ndGgpXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgICAgcmV0dXJuIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAgICdkb20nLFxuICAgICAgICAgICAgeyBhY3Rpb246ICdhZGRFbGVtZW50JyB9LFxuICAgICAgICAgICAgW3RoaXMucmVmLCBub2RlLnRvSlNPTigpLCAtMV1cbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtb3ZlSW5kZXgobm9kZSwgdGhpcy5jaGlsZHJlbiwgdGhpcy5jaGlsZHJlbi5sZW5ndGgsIHRydWUpXG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICBjb25zdCBpbmRleCA9IG1vdmVJbmRleChub2RlLCB0aGlzLnB1cmVDaGlsZHJlbiwgdGhpcy5wdXJlQ2hpbGRyZW4ubGVuZ3RoKVxuICAgICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgICBpZiAodGFza0NlbnRlciAmJiBpbmRleCA+PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAgICdkb20nLFxuICAgICAgICAgICAgeyBhY3Rpb246ICdtb3ZlRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFtub2RlLnJlZiwgdGhpcy5yZWYsIGluZGV4XVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnQgYSBub2RlIGJlZm9yZSBzcGVjaWZpZWQgbm9kZS5cbiAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAgICogQHBhcmFtIHtvYmplY3R9IGJlZm9yZVxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGluc2VydEJlZm9yZSAobm9kZSwgYmVmb3JlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAobm9kZSA9PT0gYmVmb3JlIHx8IChub2RlLm5leHRTaWJsaW5nICYmIG5vZGUubmV4dFNpYmxpbmcgPT09IGJlZm9yZSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIW5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbGlua1BhcmVudChub2RlLCB0aGlzKVxuICAgICAgaW5zZXJ0SW5kZXgobm9kZSwgdGhpcy5jaGlsZHJlbiwgdGhpcy5jaGlsZHJlbi5pbmRleE9mKGJlZm9yZSksIHRydWUpXG4gICAgICBpZiAodGhpcy5kb2NJZCkge1xuICAgICAgICByZWdpc3Rlck5vZGUodGhpcy5kb2NJZCwgbm9kZSlcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHB1cmVCZWZvcmUgPSBuZXh0RWxlbWVudChiZWZvcmUpXG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW5zZXJ0SW5kZXgoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICB0aGlzLnB1cmVDaGlsZHJlbixcbiAgICAgICAgICBwdXJlQmVmb3JlXG4gICAgICAgICAgICA/IHRoaXMucHVyZUNoaWxkcmVuLmluZGV4T2YocHVyZUJlZm9yZSlcbiAgICAgICAgICAgIDogdGhpcy5wdXJlQ2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ2FkZEVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbdGhpcy5yZWYsIG5vZGUudG9KU09OKCksIGluZGV4XVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1vdmVJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmluZGV4T2YoYmVmb3JlKSwgdHJ1ZSlcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHB1cmVCZWZvcmUgPSBuZXh0RWxlbWVudChiZWZvcmUpXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIGNvbnN0IGluZGV4ID0gbW92ZUluZGV4KFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4sXG4gICAgICAgICAgcHVyZUJlZm9yZVxuICAgICAgICAgICAgPyB0aGlzLnB1cmVDaGlsZHJlbi5pbmRleE9mKHB1cmVCZWZvcmUpXG4gICAgICAgICAgICA6IHRoaXMucHVyZUNoaWxkcmVuLmxlbmd0aFxuICAgICAgICApXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyICYmIGluZGV4ID49IDApIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ21vdmVFbGVtZW50JyB9LFxuICAgICAgICAgICAgW25vZGUucmVmLCB0aGlzLnJlZiwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydCBhIG5vZGUgYWZ0ZXIgc3BlY2lmaWVkIG5vZGUuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhZnRlclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGluc2VydEFmdGVyIChub2RlLCBhZnRlcikge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUgJiYgbm9kZS5wYXJlbnROb2RlICE9PSB0aGlzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKG5vZGUgPT09IGFmdGVyIHx8IChub2RlLnByZXZpb3VzU2libGluZyAmJiBub2RlLnByZXZpb3VzU2libGluZyA9PT0gYWZ0ZXIpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCFub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIGxpbmtQYXJlbnQobm9kZSwgdGhpcylcbiAgICAgIGluc2VydEluZGV4KG5vZGUsIHRoaXMuY2hpbGRyZW4sIHRoaXMuY2hpbGRyZW4uaW5kZXhPZihhZnRlcikgKyAxLCB0cnVlKVxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmICh0aGlzLmRvY0lkKSB7XG4gICAgICAgIHJlZ2lzdGVyTm9kZSh0aGlzLmRvY0lkLCBub2RlKVxuICAgICAgfVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnNlcnRJbmRleChcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIHRoaXMucHVyZUNoaWxkcmVuLFxuICAgICAgICAgIHRoaXMucHVyZUNoaWxkcmVuLmluZGV4T2YocHJldmlvdXNFbGVtZW50KGFmdGVyKSkgKyAxXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ2FkZEVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbdGhpcy5yZWYsIG5vZGUudG9KU09OKCksIGluZGV4XVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1vdmVJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmluZGV4T2YoYWZ0ZXIpICsgMSwgdHJ1ZSlcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gbW92ZUluZGV4KFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4sXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4uaW5kZXhPZihwcmV2aW91c0VsZW1lbnQoYWZ0ZXIpKSArIDFcbiAgICAgICAgKVxuICAgICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgICBpZiAodGFza0NlbnRlciAmJiBpbmRleCA+PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAgICdkb20nLFxuICAgICAgICAgICAgeyBhY3Rpb246ICdtb3ZlRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFtub2RlLnJlZiwgdGhpcy5yZWYsIGluZGV4XVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBjaGlsZCBub2RlLCBhbmQgZGVjaWRlIHdoZXRoZXIgaXQgc2hvdWxkIGJlIGRlc3Ryb3llZC5cbiAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAgICogQHBhcmFtIHtib29sZWFufSBwcmVzZXJ2ZWRcbiAgICovXG4gIHJlbW92ZUNoaWxkIChub2RlLCBwcmVzZXJ2ZWQpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICByZW1vdmVJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0cnVlKVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgcmVtb3ZlSW5kZXgobm9kZSwgdGhpcy5wdXJlQ2hpbGRyZW4pXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ3JlbW92ZUVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbbm9kZS5yZWZdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghcHJlc2VydmVkKSB7XG4gICAgICBub2RlLmRlc3Ryb3koKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBhbGwgY2hpbGQgbm9kZXMuXG4gICAqL1xuICBjbGVhciAoKSB7XG4gICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICB0aGlzLnB1cmVDaGlsZHJlbi5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgICB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgeyBhY3Rpb246ICdyZW1vdmVFbGVtZW50JyB9LFxuICAgICAgICAgIFtub2RlLnJlZl1cbiAgICAgICAgKVxuICAgICAgfSlcbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgbm9kZS5kZXN0cm95KClcbiAgICB9KVxuICAgIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID0gMFxuICAgIHRoaXMucHVyZUNoaWxkcmVuLmxlbmd0aCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYW4gYXR0cmlidXRlLCBhbmQgZGVjaWRlIHdoZXRoZXIgdGhlIHRhc2sgc2hvdWxkIGJlIHNlbmQgdG8gbmF0aXZlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyfSB2YWx1ZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNpbGVudFxuICAgKi9cbiAgc2V0QXR0ciAoa2V5LCB2YWx1ZSwgc2lsZW50KSB7XG4gICAgaWYgKHRoaXMuYXR0cltrZXldID09PSB2YWx1ZSAmJiBzaWxlbnQgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5hdHRyW2tleV0gPSB2YWx1ZVxuICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgaWYgKCFzaWxlbnQgJiYgdGFza0NlbnRlcikge1xuICAgICAgY29uc3QgcmVzdWx0ID0ge31cbiAgICAgIHJlc3VsdFtrZXldID0gdmFsdWVcbiAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgJ2RvbScsXG4gICAgICAgIHsgYWN0aW9uOiAndXBkYXRlQXR0cnMnIH0sXG4gICAgICAgIFt0aGlzLnJlZiwgcmVzdWx0XVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYmF0Y2hlZCBhdHRyaWJ1dGVzLlxuICAgKiBAcGFyYW0ge29iamVjdH0gYmF0Y2hlZEF0dHJzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2lsZW50XG4gICAqL1xuICBzZXRBdHRycyAoYmF0Y2hlZEF0dHJzLCBzaWxlbnQpIHtcbiAgICBpZiAoaXNFbXB0eShiYXRjaGVkQXR0cnMpKSByZXR1cm5cbiAgICBjb25zdCBtdXRhdGlvbnMgPSB7fVxuICAgIGZvciAoY29uc3Qga2V5IGluIGJhdGNoZWRBdHRycykge1xuICAgICAgaWYgKHRoaXMuYXR0cltrZXldICE9PSBiYXRjaGVkQXR0cnNba2V5XSkge1xuICAgICAgICB0aGlzLmF0dHJba2V5XSA9IGJhdGNoZWRBdHRyc1trZXldXG4gICAgICAgIG11dGF0aW9uc1trZXldID0gYmF0Y2hlZEF0dHJzW2tleV1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpc0VtcHR5KG11dGF0aW9ucykpIHtcbiAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICBpZiAoIXNpbGVudCAmJiB0YXNrQ2VudGVyKSB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ3VwZGF0ZUF0dHJzJyB9LFxuICAgICAgICAgIFt0aGlzLnJlZiwgbXV0YXRpb25zXVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIHN0eWxlIHByb3BlcnR5LCBhbmQgZGVjaWRlIHdoZXRoZXIgdGhlIHRhc2sgc2hvdWxkIGJlIHNlbmQgdG8gbmF0aXZlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyfSB2YWx1ZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNpbGVudFxuICAgKi9cbiAgc2V0U3R5bGUgKGtleSwgdmFsdWUsIHNpbGVudCkge1xuICAgIGlmICh0aGlzLnN0eWxlW2tleV0gPT09IHZhbHVlICYmIHNpbGVudCAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLnN0eWxlW2tleV0gPSB2YWx1ZVxuICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgaWYgKCFzaWxlbnQgJiYgdGFza0NlbnRlcikge1xuICAgICAgY29uc3QgcmVzdWx0ID0ge31cbiAgICAgIHJlc3VsdFtrZXldID0gdmFsdWVcbiAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgJ2RvbScsXG4gICAgICAgIHsgYWN0aW9uOiAndXBkYXRlU3R5bGUnIH0sXG4gICAgICAgIFt0aGlzLnJlZiwgcmVzdWx0XVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYmF0Y2hlZCBzdHlsZSBwcm9wZXJ0aWVzLlxuICAgKiBAcGFyYW0ge29iamVjdH0gYmF0Y2hlZFN0eWxlc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNpbGVudFxuICAgKi9cbiAgc2V0U3R5bGVzIChiYXRjaGVkU3R5bGVzLCBzaWxlbnQpIHtcbiAgICBpZiAoaXNFbXB0eShiYXRjaGVkU3R5bGVzKSkgcmV0dXJuXG4gICAgY29uc3QgbXV0YXRpb25zID0ge31cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBiYXRjaGVkU3R5bGVzKSB7XG4gICAgICBpZiAodGhpcy5zdHlsZVtrZXldICE9PSBiYXRjaGVkU3R5bGVzW2tleV0pIHtcbiAgICAgICAgdGhpcy5zdHlsZVtrZXldID0gYmF0Y2hlZFN0eWxlc1trZXldXG4gICAgICAgIG11dGF0aW9uc1trZXldID0gYmF0Y2hlZFN0eWxlc1trZXldXG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNFbXB0eShtdXRhdGlvbnMpKSB7XG4gICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgaWYgKCFzaWxlbnQgJiYgdGFza0NlbnRlcikge1xuICAgICAgICB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgeyBhY3Rpb246ICd1cGRhdGVTdHlsZScgfSxcbiAgICAgICAgICBbdGhpcy5yZWYsIG11dGF0aW9uc11cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgc3R5bGUgcHJvcGVydGllcyBmcm9tIGNsYXNzLlxuICAgKiBAcGFyYW0ge29iamVjdH0gY2xhc3NTdHlsZVxuICAgKi9cbiAgc2V0Q2xhc3NTdHlsZSAoY2xhc3NTdHlsZSkge1xuICAgIC8vIHJlc2V0IHByZXZpb3VzIGNsYXNzIHN0eWxlIHRvIGVtcHR5IHN0cmluZ1xuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuY2xhc3NTdHlsZSkge1xuICAgICAgdGhpcy5jbGFzc1N0eWxlW2tleV0gPSAnJ1xuICAgIH1cblxuICAgIE9iamVjdC5hc3NpZ24odGhpcy5jbGFzc1N0eWxlLCBjbGFzc1N0eWxlKVxuICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgJ2RvbScsXG4gICAgICAgIHsgYWN0aW9uOiAndXBkYXRlU3R5bGUnIH0sXG4gICAgICAgIFt0aGlzLnJlZiwgdGhpcy50b1N0eWxlKCldXG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBldmVudCBoYW5kbGVyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgdHlwZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudCBoYW5kbGVyXG4gICAqL1xuICBhZGRFdmVudCAodHlwZSwgaGFuZGxlciwgcGFyYW1zKSB7XG4gICAgaWYgKCF0aGlzLmV2ZW50KSB7XG4gICAgICB0aGlzLmV2ZW50ID0ge31cbiAgICB9XG4gICAgaWYgKCF0aGlzLmV2ZW50W3R5cGVdKSB7XG4gICAgICB0aGlzLmV2ZW50W3R5cGVdID0geyBoYW5kbGVyLCBwYXJhbXMgfVxuICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ2FkZEV2ZW50JyB9LFxuICAgICAgICAgIFt0aGlzLnJlZiwgdHlwZV1cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IHR5cGVcbiAgICovXG4gIHJlbW92ZUV2ZW50ICh0eXBlKSB7XG4gICAgaWYgKHRoaXMuZXZlbnQgJiYgdGhpcy5ldmVudFt0eXBlXSkge1xuICAgICAgZGVsZXRlIHRoaXMuZXZlbnRbdHlwZV1cbiAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgICB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgeyBhY3Rpb246ICdyZW1vdmVFdmVudCcgfSxcbiAgICAgICAgICBbdGhpcy5yZWYsIHR5cGVdXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmlyZSBhbiBldmVudCBtYW51YWxseS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgdHlwZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNCdWJibGUgd2hldGhlciBvciBub3QgZXZlbnQgYnViYmxlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9uc1xuICAgKiBAcmV0dXJuIHt9IGFueXRoaW5nIHJldHVybmVkIGJ5IGhhbmRsZXIgZnVuY3Rpb25cbiAgICovXG4gIGZpcmVFdmVudCAodHlwZSwgZXZlbnQsIGlzQnViYmxlLCBvcHRpb25zKSB7XG4gICAgbGV0IHJlc3VsdCA9IG51bGxcbiAgICBsZXQgaXNTdG9wUHJvcGFnYXRpb24gPSBmYWxzZVxuICAgIGNvbnN0IGV2ZW50RGVzYyA9IHRoaXMuZXZlbnRbdHlwZV1cbiAgICBpZiAoZXZlbnREZXNjICYmIGV2ZW50KSB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gZXZlbnREZXNjLmhhbmRsZXJcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9ICgpID0+IHtcbiAgICAgICAgaXNTdG9wUHJvcGFnYXRpb24gPSB0cnVlXG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnBhcmFtcykge1xuICAgICAgICByZXN1bHQgPSBoYW5kbGVyLmNhbGwodGhpcywgLi4ub3B0aW9ucy5wYXJhbXMsIGV2ZW50KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGhhbmRsZXIuY2FsbCh0aGlzLCBldmVudClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWlzU3RvcFByb3BhZ2F0aW9uXG4gICAgICAmJiBpc0J1YmJsZVxuICAgICAgJiYgKEJVQkJMRV9FVkVOVFMuaW5kZXhPZih0eXBlKSAhPT0gLTEpXG4gICAgICAmJiB0aGlzLnBhcmVudE5vZGVcbiAgICAgICYmIHRoaXMucGFyZW50Tm9kZS5maXJlRXZlbnQpIHtcbiAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQgPSB0aGlzLnBhcmVudE5vZGVcbiAgICAgIHRoaXMucGFyZW50Tm9kZS5maXJlRXZlbnQodHlwZSwgZXZlbnQsIGlzQnViYmxlKSAvLyBubyBvcHRpb25zXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgc3R5bGVzIG9mIGN1cnJlbnQgZWxlbWVudC5cbiAgICogQHJldHVybiB7b2JqZWN0fSBzdHlsZVxuICAgKi9cbiAgdG9TdHlsZSAoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY2xhc3NTdHlsZSwgdGhpcy5zdHlsZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IGN1cnJlbnQgZWxlbWVudCB0byBKU09OIGxpa2Ugb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGVsZW1lbnRcbiAgICovXG4gIHRvSlNPTiAoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgcmVmOiB0aGlzLnJlZi50b1N0cmluZygpLFxuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgYXR0cjogdGhpcy5hdHRyLFxuICAgICAgc3R5bGU6IHRoaXMudG9TdHlsZSgpXG4gICAgfVxuICAgIGNvbnN0IGV2ZW50ID0gW11cbiAgICBmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy5ldmVudCkge1xuICAgICAgY29uc3QgeyBwYXJhbXMgfSA9IHRoaXMuZXZlbnRbdHlwZV1cbiAgICAgIGlmICghcGFyYW1zKSB7XG4gICAgICAgIGV2ZW50LnB1c2godHlwZSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBldmVudC5wdXNoKHsgdHlwZSwgcGFyYW1zIH0pXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChldmVudC5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdC5ldmVudCA9IGV2ZW50XG4gICAgfVxuICAgIGlmICh0aGlzLnB1cmVDaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdC5jaGlsZHJlbiA9IHRoaXMucHVyZUNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IGNoaWxkLnRvSlNPTigpKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCB0byBIVE1MIGVsZW1lbnQgdGFnIHN0cmluZy5cbiAgICogQHJldHVybiB7c3Rpcm5nfSBodG1sXG4gICAqL1xuICB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICc8JyArIHRoaXMudHlwZSArXG4gICAgJyBhdHRyPScgKyBKU09OLnN0cmluZ2lmeSh0aGlzLmF0dHIpICtcbiAgICAnIHN0eWxlPScgKyBKU09OLnN0cmluZ2lmeSh0aGlzLnRvU3R5bGUoKSkgKyAnPicgK1xuICAgIHRoaXMucHVyZUNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IGNoaWxkLnRvU3RyaW5nKCkpLmpvaW4oJycpICtcbiAgICAnPC8nICsgdGhpcy50eXBlICsgJz4nXG4gIH1cbn1cblxuc2V0RWxlbWVudChFbGVtZW50KVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBDYWxsYmFja01hbmFnZXIgZnJvbSAnLi9DYWxsYmFja01hbmFnZXInXG5pbXBvcnQgRWxlbWVudCBmcm9tICcuLi92ZG9tL0VsZW1lbnQnXG5pbXBvcnQgeyB0eXBvZiB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcbmltcG9ydCB7IG5vcm1hbGl6ZVByaW1pdGl2ZSB9IGZyb20gJy4vbm9ybWFsaXplJ1xuXG5sZXQgZmFsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fVxuXG4vLyBUaGUgQVBJIG9mIFRhc2tDZW50ZXIgd291bGQgYmUgcmUtZGVzaWduLlxuZXhwb3J0IGNsYXNzIFRhc2tDZW50ZXIge1xuICBjb25zdHJ1Y3RvciAoaWQsIHNlbmRUYXNrcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnaW5zdGFuY2VJZCcsIHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogU3RyaW5nKGlkKVxuICAgIH0pXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdjYWxsYmFja01hbmFnZXInLCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG5ldyBDYWxsYmFja01hbmFnZXIoaWQpXG4gICAgfSlcbiAgICBmYWxsYmFjayA9IHNlbmRUYXNrcyB8fCBmdW5jdGlvbiAoKSB7fVxuICB9XG5cbiAgY2FsbGJhY2sgKGNhbGxiYWNrSWQsIGRhdGEsIGlmS2VlcEFsaXZlKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbGJhY2tNYW5hZ2VyLmNvbnN1bWUoY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpXG4gIH1cblxuICByZWdpc3Rlckhvb2sgKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsYmFja01hbmFnZXIucmVnaXN0ZXJIb29rKC4uLmFyZ3MpXG4gIH1cblxuICB0cmlnZ2VySG9vayAoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrTWFuYWdlci50cmlnZ2VySG9vayguLi5hcmdzKVxuICB9XG5cbiAgdXBkYXRlRGF0YSAoY29tcG9uZW50SWQsIG5ld0RhdGEsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5zZW5kKCdtb2R1bGUnLCB7XG4gICAgICBtb2R1bGU6ICdkb20nLFxuICAgICAgbWV0aG9kOiAndXBkYXRlQ29tcG9uZW50RGF0YSdcbiAgICB9LCBbY29tcG9uZW50SWQsIG5ld0RhdGEsIGNhbGxiYWNrXSlcbiAgfVxuXG4gIGRlc3Ryb3lDYWxsYmFjayAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbGJhY2tNYW5hZ2VyLmNsb3NlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgYSB2YWx1ZS4gU3BlY2lhbGx5LCBpZiB0aGUgdmFsdWUgaXMgYSBmdW5jdGlvbiwgdGhlbiBnZW5lcmF0ZSBhIGZ1bmN0aW9uIGlkXG4gICAqIGFuZCBzYXZlIGl0IHRvIGBDYWxsYmFja01hbmFnZXJgLCBhdCBsYXN0IHJldHVybiB0aGUgZnVuY3Rpb24gaWQuXG4gICAqIEBwYXJhbSAge2FueX0gICAgICAgIHZcbiAgICogQHJldHVybiB7cHJpbWl0aXZlfVxuICAgKi9cbiAgbm9ybWFsaXplICh2KSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cG9mKHYpXG4gICAgaWYgKHYgJiYgdiBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIHJldHVybiB2LnJlZlxuICAgIH1cbiAgICBpZiAodiAmJiB2Ll9pc1Z1ZSAmJiB2LiRlbCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIHJldHVybiB2LiRlbC5yZWZcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdGdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLmNhbGxiYWNrTWFuYWdlci5hZGQodikudG9TdHJpbmcoKVxuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplUHJpbWl0aXZlKHYpXG4gIH1cblxuICBzZW5kICh0eXBlLCBwYXJhbXMsIGFyZ3MsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7IGFjdGlvbiwgY29tcG9uZW50LCByZWYsIG1vZHVsZSwgbWV0aG9kIH0gPSBwYXJhbXNcblxuICAgIGFyZ3MgPSBhcmdzLm1hcChhcmcgPT4gdGhpcy5ub3JtYWxpemUoYXJnKSlcblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnZG9tJzpcbiAgICAgICAgcmV0dXJuIHRoaXNbYWN0aW9uXSh0aGlzLmluc3RhbmNlSWQsIGFyZ3MpXG4gICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRIYW5kbGVyKHRoaXMuaW5zdGFuY2VJZCwgcmVmLCBtZXRob2QsIGFyZ3MsIE9iamVjdC5hc3NpZ24oeyBjb21wb25lbnQgfSwgb3B0aW9ucykpXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGVIYW5kbGVyKHRoaXMuaW5zdGFuY2VJZCwgbW9kdWxlLCBtZXRob2QsIGFyZ3MsIG9wdGlvbnMpXG4gICAgfVxuICB9XG5cbiAgY2FsbERPTSAoYWN0aW9uLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXNbYWN0aW9uXSh0aGlzLmluc3RhbmNlSWQsIGFyZ3MpXG4gIH1cblxuICBjYWxsQ29tcG9uZW50IChyZWYsIG1ldGhvZCwgYXJncywgb3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLmNvbXBvbmVudEhhbmRsZXIodGhpcy5pbnN0YW5jZUlkLCByZWYsIG1ldGhvZCwgYXJncywgb3B0aW9ucylcbiAgfVxuXG4gIGNhbGxNb2R1bGUgKG1vZHVsZSwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlSGFuZGxlcih0aGlzLmluc3RhbmNlSWQsIG1vZHVsZSwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0ICgpIHtcbiAgY29uc3QgRE9NX01FVEhPRFMgPSB7XG4gICAgY3JlYXRlRmluaXNoOiBnbG9iYWwuY2FsbENyZWF0ZUZpbmlzaCxcbiAgICB1cGRhdGVGaW5pc2g6IGdsb2JhbC5jYWxsVXBkYXRlRmluaXNoLFxuICAgIHJlZnJlc2hGaW5pc2g6IGdsb2JhbC5jYWxsUmVmcmVzaEZpbmlzaCxcblxuICAgIGNyZWF0ZUJvZHk6IGdsb2JhbC5jYWxsQ3JlYXRlQm9keSxcblxuICAgIGFkZEVsZW1lbnQ6IGdsb2JhbC5jYWxsQWRkRWxlbWVudCxcbiAgICByZW1vdmVFbGVtZW50OiBnbG9iYWwuY2FsbFJlbW92ZUVsZW1lbnQsXG4gICAgbW92ZUVsZW1lbnQ6IGdsb2JhbC5jYWxsTW92ZUVsZW1lbnQsXG4gICAgdXBkYXRlQXR0cnM6IGdsb2JhbC5jYWxsVXBkYXRlQXR0cnMsXG4gICAgdXBkYXRlU3R5bGU6IGdsb2JhbC5jYWxsVXBkYXRlU3R5bGUsXG5cbiAgICBhZGRFdmVudDogZ2xvYmFsLmNhbGxBZGRFdmVudCxcbiAgICByZW1vdmVFdmVudDogZ2xvYmFsLmNhbGxSZW1vdmVFdmVudFxuICB9XG4gIGNvbnN0IHByb3RvID0gVGFza0NlbnRlci5wcm90b3R5cGVcblxuICBmb3IgKGNvbnN0IG5hbWUgaW4gRE9NX01FVEhPRFMpIHtcbiAgICBjb25zdCBtZXRob2QgPSBET01fTUVUSE9EU1tuYW1lXVxuICAgIHByb3RvW25hbWVdID0gbWV0aG9kID9cbiAgICAgIChpZCwgYXJncykgPT4gbWV0aG9kKGlkLCAuLi5hcmdzKSA6XG4gICAgICAoaWQsIGFyZ3MpID0+IGZhbGxiYWNrKGlkLCBbeyBtb2R1bGU6ICdkb20nLCBtZXRob2Q6IG5hbWUsIGFyZ3MgfV0sICctMScpXG4gIH1cblxuICBwcm90by5jb21wb25lbnRIYW5kbGVyID0gZ2xvYmFsLmNhbGxOYXRpdmVDb21wb25lbnQgfHxcbiAgICAoKGlkLCByZWYsIG1ldGhvZCwgYXJncywgb3B0aW9ucykgPT5cbiAgICAgIGZhbGxiYWNrKGlkLCBbeyBjb21wb25lbnQ6IG9wdGlvbnMuY29tcG9uZW50LCByZWYsIG1ldGhvZCwgYXJncyB9XSkpXG5cbiAgcHJvdG8ubW9kdWxlSGFuZGxlciA9IGdsb2JhbC5jYWxsTmF0aXZlTW9kdWxlIHx8XG4gICAgKChpZCwgbW9kdWxlLCBtZXRob2QsIGFyZ3MpID0+XG4gICAgICBmYWxsYmFjayhpZCwgW3sgbW9kdWxlLCBtZXRob2QsIGFyZ3MgfV0pKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IGdldERvYyB9IGZyb20gJy4uL3Zkb20vb3BlcmF0aW9uJ1xuXG5mdW5jdGlvbiBmaXJlRXZlbnQgKGRvY3VtZW50LCBub2RlSWQsIHR5cGUsIGV2ZW50LCBkb21DaGFuZ2VzLCBwYXJhbXMpIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRSZWYobm9kZUlkKVxuICBpZiAoZWwpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuZmlyZUV2ZW50KGVsLCB0eXBlLCBldmVudCwgZG9tQ2hhbmdlcywgcGFyYW1zKVxuICB9XG4gIHJldHVybiBuZXcgRXJyb3IoYGludmFsaWQgZWxlbWVudCByZWZlcmVuY2UgXCIke25vZGVJZH1cImApXG59XG5cbmZ1bmN0aW9uIGNhbGxiYWNrIChkb2N1bWVudCwgY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpIHtcbiAgcmV0dXJuIGRvY3VtZW50LnRhc2tDZW50ZXIuY2FsbGJhY2soY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpXG59XG5cbmZ1bmN0aW9uIGNvbXBvbmVudEhvb2sgKGRvY3VtZW50LCBjb21wb25lbnRJZCwgdHlwZSwgaG9vaywgb3B0aW9ucykge1xuICBpZiAoIWRvY3VtZW50IHx8ICFkb2N1bWVudC50YXNrQ2VudGVyKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gQ2FuJ3QgZmluZCBcImRvY3VtZW50XCIgb3IgXCJ0YXNrQ2VudGVyXCIuYClcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGxldCByZXN1bHQgPSBudWxsXG4gIHRyeSB7XG4gICAgcmVzdWx0ID0gZG9jdW1lbnQudGFza0NlbnRlci50cmlnZ2VySG9vayhjb21wb25lbnRJZCwgdHlwZSwgaG9vaywgb3B0aW9ucylcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byB0cmlnZ2VyIHRoZSBcIiR7dHlwZX1AJHtob29rfVwiIGhvb2sgb24gJHtjb21wb25lbnRJZH0uYClcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogQWNjZXB0IGNhbGxzIGZyb20gbmF0aXZlIChldmVudCBvciBjYWxsYmFjaykuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHBhcmFtICB7YXJyYXl9IHRhc2tzIGxpc3Qgd2l0aCBgbWV0aG9kYCBhbmQgYGFyZ3NgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNlaXZlVGFza3MgKGlkLCB0YXNrcykge1xuICBjb25zdCBkb2N1bWVudCA9IGdldERvYyhpZClcbiAgaWYgKCFkb2N1bWVudCkge1xuICAgIHJldHVybiBuZXcgRXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byByZWNlaXZlVGFza3MsIGBcbiAgICAgICsgYGluc3RhbmNlICgke2lkfSkgaXMgbm90IGF2YWlsYWJsZS5gKVxuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KHRhc2tzKSkge1xuICAgIHJldHVybiB0YXNrcy5tYXAodGFzayA9PiB7XG4gICAgICBzd2l0Y2ggKHRhc2subWV0aG9kKSB7XG4gICAgICAgIGNhc2UgJ2NhbGxiYWNrJzogcmV0dXJuIGNhbGxiYWNrKGRvY3VtZW50LCAuLi50YXNrLmFyZ3MpXG4gICAgICAgIGNhc2UgJ2ZpcmVFdmVudFN5bmMnOlxuICAgICAgICBjYXNlICdmaXJlRXZlbnQnOiByZXR1cm4gZmlyZUV2ZW50KGRvY3VtZW50LCAuLi50YXNrLmFyZ3MpXG4gICAgICAgIGNhc2UgJ2NvbXBvbmVudEhvb2snOiByZXR1cm4gY29tcG9uZW50SG9vayhkb2N1bWVudCwgLi4udGFzay5hcmdzKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCB3ZWV4TW9kdWxlcyA9IHt9XG5cbi8qKlxuICogUmVnaXN0ZXIgbmF0aXZlIG1vZHVsZXMgaW5mb3JtYXRpb24uXG4gKiBAcGFyYW0ge29iamVjdH0gbmV3TW9kdWxlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJNb2R1bGVzIChuZXdNb2R1bGVzKSB7XG4gIGZvciAoY29uc3QgbmFtZSBpbiBuZXdNb2R1bGVzKSB7XG4gICAgaWYgKCF3ZWV4TW9kdWxlc1tuYW1lXSkge1xuICAgICAgd2VleE1vZHVsZXNbbmFtZV0gPSB7fVxuICAgIH1cbiAgICBuZXdNb2R1bGVzW25hbWVdLmZvckVhY2gobWV0aG9kID0+IHtcbiAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSAnc3RyaW5nJykge1xuICAgICAgICB3ZWV4TW9kdWxlc1tuYW1lXVttZXRob2RdID0gdHJ1ZVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHdlZXhNb2R1bGVzW25hbWVdW21ldGhvZC5uYW1lXSA9IG1ldGhvZC5hcmdzXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBvciB0aGUgbWV0aG9kIGhhcyBiZWVuIHJlZ2lzdGVyZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gbW9kdWxlIG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2QgbmFtZSAob3B0aW9uYWwpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1JlZ2lzdGVyZWRNb2R1bGUgKG5hbWUsIG1ldGhvZCkge1xuICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gISEod2VleE1vZHVsZXNbbmFtZV0gJiYgd2VleE1vZHVsZXNbbmFtZV1bbWV0aG9kXSlcbiAgfVxuICByZXR1cm4gISF3ZWV4TW9kdWxlc1tuYW1lXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kdWxlRGVzY3JpcHRpb24gKG5hbWUpIHtcbiAgcmV0dXJuIHdlZXhNb2R1bGVzW25hbWVdXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgcmVnaXN0ZXJFbGVtZW50IH0gZnJvbSAnLi4vdmRvbS9XZWV4RWxlbWVudCdcblxuY29uc3Qgd2VleENvbXBvbmVudHMgPSB7fVxuXG4vKipcbiAqIFJlZ2lzdGVyIG5hdGl2ZSBjb21wb25lbnRzIGluZm9ybWF0aW9uLlxuICogQHBhcmFtIHthcnJheX0gbmV3Q29tcG9uZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnRzIChuZXdDb21wb25lbnRzKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG5ld0NvbXBvbmVudHMpKSB7XG4gICAgbmV3Q29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICB3ZWV4Q29tcG9uZW50c1tjb21wb25lbnRdID0gdHJ1ZVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGNvbXBvbmVudC50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICB3ZWV4Q29tcG9uZW50c1tjb21wb25lbnQudHlwZV0gPSBjb21wb25lbnRcbiAgICAgICAgcmVnaXN0ZXJFbGVtZW50KGNvbXBvbmVudC50eXBlLCBjb21wb25lbnQubWV0aG9kcylcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgY29tcG9uZW50IGhhcyBiZWVuIHJlZ2lzdGVyZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50IG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVnaXN0ZXJlZENvbXBvbmVudCAobmFtZSkge1xuICByZXR1cm4gISF3ZWV4Q29tcG9uZW50c1tuYW1lXVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEpTIFNlcnZpY2VzXG5cbmV4cG9ydCBjb25zdCBzZXJ2aWNlcyA9IFtdXG5cbi8qKlxuICogUmVnaXN0ZXIgYSBKYXZhU2NyaXB0IHNlcnZpY2UuXG4gKiBBIEphdmFTY3JpcHQgc2VydmljZSBvcHRpb25zIGNvdWxkIGhhdmUgYSBzZXQgb2YgbGlmZWN5Y2xlIG1ldGhvZHNcbiAqIGZvciBlYWNoIFdlZXggaW5zdGFuY2UuIEZvciBleGFtcGxlOiBjcmVhdGUsIHJlZnJlc2gsIGRlc3Ryb3kuXG4gKiBGb3IgdGhlIEpTIGZyYW1ld29yayBtYWludGFpbmVyIGlmIHlvdSB3YW50IHRvIHN1cHBseSBzb21lIGZlYXR1cmVzXG4gKiB3aGljaCBuZWVkIHRvIHdvcmsgd2VsbCBpbiBkaWZmZXJlbnQgV2VleCBpbnN0YW5jZXMsIGV2ZW4gaW4gZGlmZmVyZW50XG4gKiBmcmFtZXdvcmtzIHNlcGFyYXRlbHkuIFlvdSBjYW4gbWFrZSBhIEphdmFTY3JpcHQgc2VydmljZSB0byBpbml0XG4gKiBpdHMgdmFyaWFibGVzIG9yIGNsYXNzZXMgZm9yIGVhY2ggV2VleCBpbnN0YW5jZSB3aGVuIGl0J3MgY3JlYXRlZFxuICogYW5kIHJlY3ljbGUgdGhlbSB3aGVuIGl0J3MgZGVzdHJveWVkLlxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQ291bGQgaGF2ZSB7IGNyZWF0ZSwgcmVmcmVzaCwgZGVzdHJveSB9XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICBsaWZlY3ljbGUgbWV0aG9kcy4gSW4gY3JlYXRlIG1ldGhvZCBpdCBzaG91bGRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhbiBvYmplY3Qgb2Ygd2hhdCB2YXJpYWJsZXMgb3IgY2xhc3Nlc1xuICogICAgICAgICAgICAgICAgICAgICAgICAgd291bGQgYmUgaW5qZWN0ZWQgaW50byB0aGUgV2VleCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyIChuYW1lLCBvcHRpb25zKSB7XG4gIGlmIChoYXMobmFtZSkpIHtcbiAgICBjb25zb2xlLndhcm4oYFNlcnZpY2UgXCIke25hbWV9XCIgaGFzIGJlZW4gcmVnaXN0ZXJlZCBhbHJlYWR5IWApXG4gIH1cbiAgZWxzZSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpXG4gICAgc2VydmljZXMucHVzaCh7IG5hbWUsIG9wdGlvbnMgfSlcbiAgfVxufVxuXG4vKipcbiAqIFVucmVnaXN0ZXIgYSBKYXZhU2NyaXB0IHNlcnZpY2UgYnkgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVucmVnaXN0ZXIgKG5hbWUpIHtcbiAgc2VydmljZXMuc29tZSgoc2VydmljZSwgaW5kZXgpID0+IHtcbiAgICBpZiAoc2VydmljZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICBzZXJ2aWNlcy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIEphdmFTY3JpcHQgc2VydmljZSB3aXRoIGEgY2VydGFpbiBuYW1lIGV4aXN0ZWQuXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzIChuYW1lKSB7XG4gIHJldHVybiBpbmRleE9mKG5hbWUpID49IDBcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBpbmRleCBvZiBhIEphdmFTY3JpcHQgc2VydmljZSBieSBuYW1lXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gaW5kZXhPZiAobmFtZSkge1xuICByZXR1cm4gc2VydmljZXMubWFwKHNlcnZpY2UgPT4gc2VydmljZS5uYW1lKS5pbmRleE9mKG5hbWUpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgZ2V0VGFza0NlbnRlciB9IGZyb20gJy4uL3Zkb20vb3BlcmF0aW9uJ1xuaW1wb3J0IHsgaXNSZWdpc3RlcmVkTW9kdWxlIH0gZnJvbSAnLi4vYXBpL21vZHVsZSdcblxuZXhwb3J0IGZ1bmN0aW9uIHRyYWNrIChpZCwgdHlwZSwgdmFsdWUpIHtcbiAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIoaWQpXG4gIGlmICghdGFza0NlbnRlciB8fCB0eXBlb2YgdGFza0NlbnRlci5zZW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIGNyZWF0ZSB0cmFja2VyIWApXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKCF0eXBlIHx8ICF2YWx1ZSkge1xuICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gSW52YWxpZCB0cmFjayB0eXBlICgke3R5cGV9KSBvciB2YWx1ZSAoJHt2YWx1ZX0pYClcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBsYWJlbCA9IGBqc2ZtLiR7dHlwZX0uJHt2YWx1ZX1gXG4gIHRyeSB7XG4gICAgaWYgKGlzUmVnaXN0ZXJlZE1vZHVsZSgndXNlclRyYWNrJywgJ2FkZFBlcmZQb2ludCcpKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgICAgbWVzc2FnZVtsYWJlbF0gPSAnNCdcbiAgICAgIHRhc2tDZW50ZXIuc2VuZCgnbW9kdWxlJywge1xuICAgICAgICBtb2R1bGU6ICd1c2VyVHJhY2snLFxuICAgICAgICBtZXRob2Q6ICdhZGRQZXJmUG9pbnQnXG4gICAgICB9LCBbbWVzc2FnZV0pXG4gICAgfVxuICB9XG4gIGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gdHJhY2UgXCIke2xhYmVsfVwiIWApXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVycm9yICguLi5tZXNzYWdlcykge1xuICBpZiAodHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBgLCAuLi5tZXNzYWdlcylcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlRXhjZXB0aW9uIChlcnIpIHtcbiAgaWYgKHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnRvU3RyaW5nKCkpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7fVxuICB9XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgdGhyb3cgZXJyXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL05vZGUnXG5pbXBvcnQgeyB1bmlxdWVJZCB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tbWVudCBleHRlbmRzIE5vZGUge1xuICBjb25zdHJ1Y3RvciAodmFsdWUpIHtcbiAgICBzdXBlcigpXG5cbiAgICB0aGlzLm5vZGVUeXBlID0gOFxuICAgIHRoaXMubm9kZUlkID0gdW5pcXVlSWQoKVxuICAgIHRoaXMucmVmID0gdGhpcy5ub2RlSWRcbiAgICB0aGlzLnR5cGUgPSAnY29tbWVudCdcbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICB0aGlzLnB1cmVDaGlsZHJlbiA9IFtdXG4gIH1cblxuICAvKipcbiAgKiBDb252ZXJ0IHRvIEhUTUwgY29tbWVudCBzdHJpbmcuXG4gICogQHJldHVybiB7c3Rpcm5nfSBodG1sXG4gICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJzwhLS0gJyArIHRoaXMudmFsdWUgKyAnIC0tPidcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuKiBDcmVhdGUgdGhlIGFjdGlvbiBvYmplY3QuXG4qIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4qIEBwYXJhbSB7YXJyYXl9IGFyZ3VtZW50c1xuKiBAcmV0dXJuIHtvYmplY3R9IGFjdGlvblxuKi9cbmZ1bmN0aW9uIGNyZWF0ZUFjdGlvbiAobmFtZSwgYXJncyA9IFtdKSB7XG4gIHJldHVybiB7IG1vZHVsZTogJ2RvbScsIG1ldGhvZDogbmFtZSwgYXJnczogYXJncyB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IgKGlkLCBoYW5kbGVyKSB7XG4gICAgdGhpcy5pZCA9IGlkXG4gICAgdGhpcy5iYXRjaGVkID0gZmFsc2VcbiAgICB0aGlzLnVwZGF0ZXMgPSBbXVxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdoYW5kbGVyJywge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogaGFuZGxlclxuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbSlMgUnVudGltZV0gaW52YWxpZCBwYXJhbWV0ZXIsIGhhbmRsZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJjcmVhdGVGaW5pc2hcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgY3JlYXRlRmluaXNoIChjYWxsYmFjaykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLmhhbmRsZXJcbiAgICByZXR1cm4gaGFuZGxlcihbY3JlYXRlQWN0aW9uKCdjcmVhdGVGaW5pc2gnKV0sIGNhbGxiYWNrKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwidXBkYXRlRmluaXNoXCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIHVwZGF0ZUZpbmlzaCAoY2FsbGJhY2spIHtcbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVyXG4gICAgcmV0dXJuIGhhbmRsZXIoW2NyZWF0ZUFjdGlvbigndXBkYXRlRmluaXNoJyldLCBjYWxsYmFjaylcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcInJlZnJlc2hGaW5pc2hcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgcmVmcmVzaEZpbmlzaCAoY2FsbGJhY2spIHtcbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVyXG4gICAgcmV0dXJuIGhhbmRsZXIoW2NyZWF0ZUFjdGlvbigncmVmcmVzaEZpbmlzaCcpXSwgY2FsbGJhY2spXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJjcmVhdGVCb2R5XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZWxlbWVudFxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGNyZWF0ZUJvZHkgKGVsZW1lbnQpIHtcbiAgICBjb25zdCBib2R5ID0gZWxlbWVudC50b0pTT04oKVxuICAgIGNvbnN0IGNoaWxkcmVuID0gYm9keS5jaGlsZHJlblxuICAgIGRlbGV0ZSBib2R5LmNoaWxkcmVuXG4gICAgY29uc3QgYWN0aW9ucyA9IFtjcmVhdGVBY3Rpb24oJ2NyZWF0ZUJvZHknLCBbYm9keV0pXVxuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgYWN0aW9ucy5wdXNoLmFwcGx5KGFjdGlvbnMsIGNoaWxkcmVuLm1hcChjaGlsZCA9PiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVBY3Rpb24oJ2FkZEVsZW1lbnQnLCBbYm9keS5yZWYsIGNoaWxkLCAtMV0pXG4gICAgICB9KSlcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhhY3Rpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwiYWRkRWxlbWVudFwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtvYmplY3R9IGVsZW1lbnRcbiAgICogQHBhcmFtIHtzdGlybmd9IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBhZGRFbGVtZW50IChlbGVtZW50LCByZWYsIGluZGV4KSB7XG4gICAgaWYgKCEoaW5kZXggPj0gMCkpIHtcbiAgICAgIGluZGV4ID0gLTFcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ2FkZEVsZW1lbnQnLCBbcmVmLCBlbGVtZW50LnRvSlNPTigpLCBpbmRleF0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwicmVtb3ZlRWxlbWVudFwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtzdGlybmd9IHJlZmVyZW5jZSBpZFxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIHJlbW92ZUVsZW1lbnQgKHJlZikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHJlZikpIHtcbiAgICAgIGNvbnN0IGFjdGlvbnMgPSByZWYubWFwKChyKSA9PiBjcmVhdGVBY3Rpb24oJ3JlbW92ZUVsZW1lbnQnLCBbcl0pKVxuICAgICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhhY3Rpb25zKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbigncmVtb3ZlRWxlbWVudCcsIFtyZWZdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcIm1vdmVFbGVtZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gdGFyZ2V0IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcGFyZW50IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBtb3ZlRWxlbWVudCAodGFyZ2V0UmVmLCBwYXJlbnRSZWYsIGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ21vdmVFbGVtZW50JywgW3RhcmdldFJlZiwgcGFyZW50UmVmLCBpbmRleF0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwidXBkYXRlQXR0cnNcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtzdGlybmd9IGtleVxuICAgKiBAcGFyYW0ge3N0aXJuZ30gdmFsdWVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBzZXRBdHRyIChyZWYsIGtleSwgdmFsdWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fVxuICAgIHJlc3VsdFtrZXldID0gdmFsdWVcbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbigndXBkYXRlQXR0cnMnLCBbcmVmLCByZXN1bHRdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcInVwZGF0ZVN0eWxlXCIgc2lnbmFsLCB1cGRhdGUgYSBzb2xlIHN0eWxlLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSBrZXlcbiAgICogQHBhcmFtIHtzdGlybmd9IHZhbHVlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgc2V0U3R5bGUgKHJlZiwga2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCd1cGRhdGVTdHlsZScsIFtyZWYsIHJlc3VsdF0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwidXBkYXRlU3R5bGVcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtvYmplY3R9IHN0eWxlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgc2V0U3R5bGVzIChyZWYsIHN0eWxlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ3VwZGF0ZVN0eWxlJywgW3JlZiwgc3R5bGVdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcImFkZEV2ZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCB0eXBlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgYWRkRXZlbnQgKHJlZiwgdHlwZSkge1xuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCdhZGRFdmVudCcsIFtyZWYsIHR5cGVdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcInJlbW92ZUV2ZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCB0eXBlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgcmVtb3ZlRXZlbnQgKHJlZiwgdHlwZSkge1xuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCdyZW1vdmVFdmVudCcsIFtyZWYsIHR5cGVdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZhdWx0IGhhbmRsZXIuXG4gICAqIEBwYXJhbSB7b2JqZWN0IHwgYXJyYXl9IGFjdGlvbnNcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybiB7fSBhbnl0aGluZyByZXR1cm5lZCBieSBjYWxsYmFjayBmdW5jdGlvblxuICAgKi9cbiAgaGFuZGxlciAoYWN0aW9ucywgY2IpIHtcbiAgICByZXR1cm4gY2IgJiYgY2IoKVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhY3Rpb25zIGludG8gdXBkYXRlcy5cbiAgICogQHBhcmFtIHtvYmplY3QgfCBhcnJheX0gYWN0aW9uc1xuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGFkZEFjdGlvbnMgKGFjdGlvbnMpIHtcbiAgICBjb25zdCB1cGRhdGVzID0gdGhpcy51cGRhdGVzXG4gICAgY29uc3QgaGFuZGxlciA9IHRoaXMuaGFuZGxlclxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFjdGlvbnMpKSB7XG4gICAgICBhY3Rpb25zID0gW2FjdGlvbnNdXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYmF0Y2hlZCkge1xuICAgICAgdXBkYXRlcy5wdXNoLmFwcGx5KHVwZGF0ZXMsIGFjdGlvbnMpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGhhbmRsZXIoYWN0aW9ucylcbiAgICB9XG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIFRhc2sgaGFuZGxlciBmb3IgY29tbXVuaWNhdGlvbiBiZXR3ZWVuIGphdmFzY3JpcHQgYW5kIG5hdGl2ZS5cbiAqL1xuXG5jb25zdCBoYW5kbGVyTWFwID0ge1xuICBjcmVhdGVCb2R5OiAnY2FsbENyZWF0ZUJvZHknLFxuICBhZGRFbGVtZW50OiAnY2FsbEFkZEVsZW1lbnQnLFxuICByZW1vdmVFbGVtZW50OiAnY2FsbFJlbW92ZUVsZW1lbnQnLFxuICBtb3ZlRWxlbWVudDogJ2NhbGxNb3ZlRWxlbWVudCcsXG4gIHVwZGF0ZUF0dHJzOiAnY2FsbFVwZGF0ZUF0dHJzJyxcbiAgdXBkYXRlU3R5bGU6ICdjYWxsVXBkYXRlU3R5bGUnLFxuICBhZGRFdmVudDogJ2NhbGxBZGRFdmVudCcsXG4gIHJlbW92ZUV2ZW50OiAnY2FsbFJlbW92ZUV2ZW50J1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIHRhc2sgaGFuZGxlci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlclxuICogQHJldHVybiB7ZnVuY3Rpb259IHRhc2tIYW5kbGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVIYW5kbGVyIChpZCwgaGFuZGxlcikge1xuICBjb25zdCBkZWZhdWx0SGFuZGxlciA9IGhhbmRsZXIgfHwgZ2xvYmFsLmNhbGxOYXRpdmVcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHR5cGVvZiBkZWZhdWx0SGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tKUyBSdW50aW1lXSBubyBkZWZhdWx0IGhhbmRsZXInKVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHRhc2tIYW5kbGVyICh0YXNrcykge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh0YXNrcykpIHtcbiAgICAgIHRhc2tzID0gW3Rhc2tzXVxuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhc2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByZXR1cm5WYWx1ZSA9IGRpc3BhdGNoVGFzayhpZCwgdGFza3NbaV0sIGRlZmF1bHRIYW5kbGVyKVxuICAgICAgaWYgKHJldHVyblZhbHVlID09PSAtMSkge1xuICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGVyZSBpcyBhIGNvcnJlc3BvbmRpbmcgYXZhaWxhYmxlIGhhbmRsZXIgaW4gdGhlIGVudmlyb25tZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IG1vZHVsZVxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaGFzQXZhaWxhYmxlSGFuZGxlciAobW9kdWxlLCBtZXRob2QpIHtcbiAgcmV0dXJuIG1vZHVsZSA9PT0gJ2RvbSdcbiAgICAmJiBoYW5kbGVyTWFwW21ldGhvZF1cbiAgICAmJiB0eXBlb2YgZ2xvYmFsW2hhbmRsZXJNYXBbbWV0aG9kXV0gPT09ICdmdW5jdGlvbidcbn1cblxuLyoqXG4gKiBEaXNwYXRjaCB0aGUgdGFzayB0byB0aGUgc3BlY2lmaWVkIGhhbmRsZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXNrXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0SGFuZGxlclxuICogQHJldHVybiB7bnVtYmVyfSBzaWduYWwgcmV0dXJuZWQgZnJvbSBuYXRpdmVcbiAqL1xuZnVuY3Rpb24gZGlzcGF0Y2hUYXNrIChpZCwgdGFzaywgZGVmYXVsdEhhbmRsZXIpIHtcbiAgY29uc3QgeyBtb2R1bGUsIG1ldGhvZCwgYXJncyB9ID0gdGFza1xuXG4gIGlmIChoYXNBdmFpbGFibGVIYW5kbGVyKG1vZHVsZSwgbWV0aG9kKSkge1xuICAgIHJldHVybiBnbG9iYWxbaGFuZGxlck1hcFttZXRob2RdXShpZCwgLi4uYXJncywgJy0xJylcbiAgfVxuXG4gIHJldHVybiBkZWZhdWx0SGFuZGxlcihpZCwgW3Rhc2tdLCAnLTEnKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBDb21tZW50IGZyb20gJy4vQ29tbWVudCdcbmltcG9ydCBFbGVtZW50IGZyb20gJy4vRWxlbWVudCdcbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuLi9icmlkZ2UvTGlzdGVuZXInXG5pbXBvcnQgeyBUYXNrQ2VudGVyIH0gZnJvbSAnLi4vYnJpZGdlL1Rhc2tDZW50ZXInXG5pbXBvcnQgeyBjcmVhdGVIYW5kbGVyIH0gZnJvbSAnLi4vYnJpZGdlL0hhbmRsZXInXG5pbXBvcnQgeyBhZGREb2MsIHJlbW92ZURvYywgYXBwZW5kQm9keSwgc2V0Qm9keSB9IGZyb20gJy4vb3BlcmF0aW9uJ1xuXG4vKipcbiAqIFVwZGF0ZSBhbGwgY2hhbmdlcyBmb3IgYW4gZWxlbWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50XG4gKiBAcGFyYW0ge29iamVjdH0gY2hhbmdlc1xuICovXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50IChlbCwgY2hhbmdlcykge1xuICBjb25zdCBhdHRycyA9IGNoYW5nZXMuYXR0cnMgfHwge31cbiAgZm9yIChjb25zdCBuYW1lIGluIGF0dHJzKSB7XG4gICAgZWwuc2V0QXR0cihuYW1lLCBhdHRyc1tuYW1lXSwgdHJ1ZSlcbiAgfVxuICBjb25zdCBzdHlsZSA9IGNoYW5nZXMuc3R5bGUgfHwge31cbiAgZm9yIChjb25zdCBuYW1lIGluIHN0eWxlKSB7XG4gICAgZWwuc2V0U3R5bGUobmFtZSwgc3R5bGVbbmFtZV0sIHRydWUpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRG9jdW1lbnQge1xuICBjb25zdHJ1Y3RvciAoaWQsIHVybCwgaGFuZGxlcikge1xuICAgIGlkID0gaWQgPyBpZC50b1N0cmluZygpIDogJydcbiAgICB0aGlzLmlkID0gaWRcbiAgICB0aGlzLlVSTCA9IHVybFxuXG4gICAgYWRkRG9jKGlkLCB0aGlzKVxuICAgIHRoaXMubm9kZU1hcCA9IHt9XG4gICAgY29uc3QgTCA9IERvY3VtZW50Lkxpc3RlbmVyIHx8IExpc3RlbmVyXG4gICAgdGhpcy5saXN0ZW5lciA9IG5ldyBMKGlkLCBoYW5kbGVyIHx8IGNyZWF0ZUhhbmRsZXIoaWQsIERvY3VtZW50LmhhbmRsZXIpKSAvLyBkZXByZWNhdGVkXG4gICAgdGhpcy50YXNrQ2VudGVyID0gbmV3IFRhc2tDZW50ZXIoaWQsIGhhbmRsZXIgPyAoaWQsIC4uLmFyZ3MpID0+IGhhbmRsZXIoLi4uYXJncykgOiBEb2N1bWVudC5oYW5kbGVyKVxuICAgIHRoaXMuY3JlYXRlRG9jdW1lbnRFbGVtZW50KClcbiAgfVxuXG4gIC8qKlxuICAqIEdldCB0aGUgbm9kZSBmcm9tIG5vZGVNYXAuXG4gICogQHBhcmFtIHtzdHJpbmd9IHJlZmVyZW5jZSBpZFxuICAqIEByZXR1cm4ge29iamVjdH0gbm9kZVxuICAqL1xuICBnZXRSZWYgKHJlZikge1xuICAgIHJldHVybiB0aGlzLm5vZGVNYXBbcmVmXVxuICB9XG5cbiAgLyoqXG4gICogVHVybiBvbiBiYXRjaGVkIHVwZGF0ZXMuXG4gICovXG4gIG9wZW4gKCkge1xuICAgIHRoaXMubGlzdGVuZXIuYmF0Y2hlZCA9IGZhbHNlXG4gIH1cblxuICAvKipcbiAgKiBUdXJuIG9mZiBiYXRjaGVkIHVwZGF0ZXMuXG4gICovXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLmxpc3RlbmVyLmJhdGNoZWQgPSB0cnVlXG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgdGhlIGRvY3VtZW50IGVsZW1lbnQuXG4gICogQHJldHVybiB7b2JqZWN0fSBkb2N1bWVudEVsZW1lbnRcbiAgKi9cbiAgY3JlYXRlRG9jdW1lbnRFbGVtZW50ICgpIHtcbiAgICBpZiAoIXRoaXMuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICBjb25zdCBlbCA9IG5ldyBFbGVtZW50KCdkb2N1bWVudCcpXG4gICAgICBlbC5kb2NJZCA9IHRoaXMuaWRcbiAgICAgIGVsLm93bmVyRG9jdW1lbnQgPSB0aGlzXG4gICAgICBlbC5yb2xlID0gJ2RvY3VtZW50RWxlbWVudCdcbiAgICAgIGVsLmRlcHRoID0gMFxuICAgICAgZWwucmVmID0gJ19kb2N1bWVudEVsZW1lbnQnXG4gICAgICB0aGlzLm5vZGVNYXAuX2RvY3VtZW50RWxlbWVudCA9IGVsXG4gICAgICB0aGlzLmRvY3VtZW50RWxlbWVudCA9IGVsXG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbCwgJ2FwcGVuZENoaWxkJywge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogKG5vZGUpID0+IHtcbiAgICAgICAgICBhcHBlbmRCb2R5KHRoaXMsIG5vZGUpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbCwgJ2luc2VydEJlZm9yZScsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IChub2RlLCBiZWZvcmUpID0+IHtcbiAgICAgICAgICBhcHBlbmRCb2R5KHRoaXMsIG5vZGUsIGJlZm9yZSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudEVsZW1lbnRcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSB0aGUgYm9keSBlbGVtZW50LlxuICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gICogQHBhcmFtIHtvYmpjdH0gcHJvcHNcbiAgKiBAcmV0dXJuIHtvYmplY3R9IGJvZHkgZWxlbWVudFxuICAqL1xuICBjcmVhdGVCb2R5ICh0eXBlLCBwcm9wcykge1xuICAgIGlmICghdGhpcy5ib2R5KSB7XG4gICAgICBjb25zdCBlbCA9IG5ldyBFbGVtZW50KHR5cGUsIHByb3BzKVxuICAgICAgc2V0Qm9keSh0aGlzLCBlbClcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ib2R5XG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgYW4gZWxlbWVudC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZVxuICAqIEBwYXJhbSB7b2JqY3R9IHByb3BzXG4gICogQHJldHVybiB7b2JqZWN0fSBlbGVtZW50XG4gICovXG4gIGNyZWF0ZUVsZW1lbnQgKHRhZ05hbWUsIHByb3BzKSB7XG4gICAgcmV0dXJuIG5ldyBFbGVtZW50KHRhZ05hbWUsIHByb3BzKVxuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlIGFuIGNvbW1lbnQuXG4gICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAgKiBAcmV0dXJuIHtvYmplY3R9IGNvbW1lbnRcbiAgKi9cbiAgY3JlYXRlQ29tbWVudCAodGV4dCkge1xuICAgIHJldHVybiBuZXcgQ29tbWVudCh0ZXh0KVxuICB9XG5cbiAgLyoqXG4gICogRmlyZSBhbiBldmVudCBvbiBzcGVjaWZpZWQgZWxlbWVudCBtYW51YWxseS5cbiAgKiBAcGFyYW0ge29iamVjdH0gZWxlbWVudFxuICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCB0eXBlXG4gICogQHBhcmFtIHtvYmplY3R9IGV2ZW50IG9iamVjdFxuICAqIEBwYXJhbSB7b2JqZWN0fSBkb20gY2hhbmdlc1xuICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICogQHJldHVybiB7fSBhbnl0aGluZyByZXR1cm5lZCBieSBoYW5kbGVyIGZ1bmN0aW9uXG4gICovXG4gIGZpcmVFdmVudCAoZWwsIHR5cGUsIGV2ZW50LCBkb21DaGFuZ2VzLCBvcHRpb25zKSB7XG4gICAgaWYgKCFlbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGV2ZW50ID0gZXZlbnQgfHwge31cbiAgICBldmVudC50eXBlID0gZXZlbnQudHlwZSB8fCB0eXBlXG4gICAgZXZlbnQudGFyZ2V0ID0gZWxcbiAgICBldmVudC5jdXJyZW50VGFyZ2V0ID0gZWxcbiAgICBldmVudC50aW1lc3RhbXAgPSBEYXRlLm5vdygpXG4gICAgaWYgKGRvbUNoYW5nZXMpIHtcbiAgICAgIHVwZGF0ZUVsZW1lbnQoZWwsIGRvbUNoYW5nZXMpXG4gICAgfVxuICAgIGNvbnN0IGlzQnViYmxlID0gdGhpcy5nZXRSZWYoJ19yb290JykuYXR0clsnYnViYmxlJ10gPT09ICd0cnVlJ1xuICAgIHJldHVybiBlbC5maXJlRXZlbnQodHlwZSwgZXZlbnQsIGlzQnViYmxlLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICogRGVzdHJveSBjdXJyZW50IGRvY3VtZW50LCBhbmQgcmVtb3ZlIGl0c2VsZiBmb3JtIGRvY01hcC5cbiAgKi9cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy50YXNrQ2VudGVyLmRlc3Ryb3lDYWxsYmFjaygpXG4gICAgZGVsZXRlIHRoaXMubGlzdGVuZXJcbiAgICBkZWxldGUgdGhpcy5ub2RlTWFwXG4gICAgZGVsZXRlIHRoaXMudGFza0NlbnRlclxuICAgIHJlbW92ZURvYyh0aGlzLmlkKVxuICB9XG59XG5cbi8vIGRlZmF1bHQgdGFzayBoYW5kbGVyXG5Eb2N1bWVudC5oYW5kbGVyID0gbnVsbFxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBEb2N1bWVudCBmcm9tICcuLi92ZG9tL0RvY3VtZW50J1xuaW1wb3J0IHsgaXNSZWdpc3RlcmVkTW9kdWxlLCBnZXRNb2R1bGVEZXNjcmlwdGlvbiB9IGZyb20gJy4vbW9kdWxlJ1xuaW1wb3J0IHsgaXNSZWdpc3RlcmVkQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgeyBnZXRUYXNrQ2VudGVyIH0gZnJvbSAnLi4vdmRvbS9vcGVyYXRpb24nXG5cbmNvbnN0IG1vZHVsZVByb3hpZXMgPSB7fVxuXG5mdW5jdGlvbiBzZXRJZCAod2VleCwgaWQpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHdlZXgsICdbW0N1cnJlbnRJbnN0YW5jZUlkXV0nLCB7IHZhbHVlOiBpZCB9KVxufVxuXG5mdW5jdGlvbiBnZXRJZCAod2VleCkge1xuICByZXR1cm4gd2VleFsnW1tDdXJyZW50SW5zdGFuY2VJZF1dJ11cbn1cblxuZnVuY3Rpb24gbW9kdWxlR2V0dGVyIChpZCwgbW9kdWxlLCBtZXRob2QpIHtcbiAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIoaWQpXG4gIGlmICghdGFza0NlbnRlciB8fCB0eXBlb2YgdGFza0NlbnRlci5zZW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIGZpbmQgdGFza0NlbnRlciAoJHtpZH0pLmApXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gKC4uLmFyZ3MpID0+IHRhc2tDZW50ZXIuc2VuZCgnbW9kdWxlJywgeyBtb2R1bGUsIG1ldGhvZCB9LCBhcmdzKVxufVxuXG5mdW5jdGlvbiBtb2R1bGVTZXR0ZXIgKGlkLCBtb2R1bGUsIG1ldGhvZCwgZm4pIHtcbiAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIoaWQpXG4gIGlmICghdGFza0NlbnRlciB8fCB0eXBlb2YgdGFza0NlbnRlci5zZW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIGZpbmQgdGFza0NlbnRlciAoJHtpZH0pLmApXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gJHttb2R1bGV9LiR7bWV0aG9kfSBtdXN0IGJlIGFzc2lnbmVkIGFzIGEgZnVuY3Rpb24uYClcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiBmbiA9PiB0YXNrQ2VudGVyLnNlbmQoJ21vZHVsZScsIHsgbW9kdWxlLCBtZXRob2QgfSwgW2ZuXSlcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2VleEluc3RhbmNlIHtcbiAgY29uc3RydWN0b3IgKGlkLCBjb25maWcpIHtcbiAgICBzZXRJZCh0aGlzLCBTdHJpbmcoaWQpKVxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnIHx8IHt9XG4gICAgdGhpcy5kb2N1bWVudCA9IG5ldyBEb2N1bWVudChpZCwgdGhpcy5jb25maWcuYnVuZGxlVXJsKVxuICAgIHRoaXMucmVxdWlyZU1vZHVsZSA9IHRoaXMucmVxdWlyZU1vZHVsZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5pc1JlZ2lzdGVyZWRNb2R1bGUgPSBpc1JlZ2lzdGVyZWRNb2R1bGVcbiAgICB0aGlzLmlzUmVnaXN0ZXJlZENvbXBvbmVudCA9IGlzUmVnaXN0ZXJlZENvbXBvbmVudFxuICB9XG5cbiAgcmVxdWlyZU1vZHVsZSAobW9kdWxlTmFtZSkge1xuICAgIGNvbnN0IGlkID0gZ2V0SWQodGhpcylcbiAgICBpZiAoIShpZCAmJiB0aGlzLmRvY3VtZW50ICYmIHRoaXMuZG9jdW1lbnQudGFza0NlbnRlcikpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byByZXF1aXJlTW9kdWxlKFwiJHttb2R1bGVOYW1lfVwiKSwgYFxuICAgICAgICArIGBpbnN0YW5jZSAoJHtpZH0pIGRvZXNuJ3QgZXhpc3QgYW55bW9yZS5gKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gd2FybiBmb3IgdW5rbm93biBtb2R1bGVcbiAgICBpZiAoIWlzUmVnaXN0ZXJlZE1vZHVsZShtb2R1bGVOYW1lKSkge1xuICAgICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSB1c2luZyB1bnJlZ2lzdGVyZWQgd2VleCBtb2R1bGUgXCIke21vZHVsZU5hbWV9XCJgKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIG5ldyBtb2R1bGUgcHJveHlcbiAgICBjb25zdCBwcm94eU5hbWUgPSBgJHttb2R1bGVOYW1lfSMke2lkfWBcbiAgICBpZiAoIW1vZHVsZVByb3hpZXNbcHJveHlOYW1lXSkge1xuICAgICAgLy8gY3JlYXRlIHJlZ2lzdGVyZWQgbW9kdWxlIGFwaXNcbiAgICAgIGNvbnN0IG1vZHVsZURlZmluZSA9IGdldE1vZHVsZURlc2NyaXB0aW9uKG1vZHVsZU5hbWUpXG4gICAgICBjb25zdCBtb2R1bGVBcGlzID0ge31cbiAgICAgIGZvciAoY29uc3QgbWV0aG9kTmFtZSBpbiBtb2R1bGVEZWZpbmUpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZUFwaXMsIG1ldGhvZE5hbWUsIHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICBnZXQ6ICgpID0+IG1vZHVsZUdldHRlcihpZCwgbW9kdWxlTmFtZSwgbWV0aG9kTmFtZSksXG4gICAgICAgICAgc2V0OiBmbiA9PiBtb2R1bGVTZXR0ZXIoaWQsIG1vZHVsZU5hbWUsIG1ldGhvZE5hbWUsIGZuKVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICAvLyBjcmVhdGUgbW9kdWxlIFByb3h5XG4gICAgICBpZiAodHlwZW9mIFByb3h5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG1vZHVsZVByb3hpZXNbcHJveHlOYW1lXSA9IG5ldyBQcm94eShtb2R1bGVBcGlzLCB7XG4gICAgICAgICAgZ2V0ICh0YXJnZXQsIG1ldGhvZE5hbWUpIHtcbiAgICAgICAgICAgIGlmIChtZXRob2ROYW1lIGluIHRhcmdldCkge1xuICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W21ldGhvZE5hbWVdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtKUyBGcmFtZXdvcmtdIHVzaW5nIHVucmVnaXN0ZXJlZCBtZXRob2QgXCIke21vZHVsZU5hbWV9LiR7bWV0aG9kTmFtZX1cImApXG4gICAgICAgICAgICByZXR1cm4gbW9kdWxlR2V0dGVyKGlkLCBtb2R1bGVOYW1lLCBtZXRob2ROYW1lKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBtb2R1bGVQcm94aWVzW3Byb3h5TmFtZV0gPSBtb2R1bGVBcGlzXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZHVsZVByb3hpZXNbcHJveHlOYW1lXVxuICB9XG5cbiAgc3VwcG9ydHMgKGNvbmRpdGlvbikge1xuICAgIGlmICh0eXBlb2YgY29uZGl0aW9uICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGxcblxuICAgIGNvbnN0IHJlcyA9IGNvbmRpdGlvbi5tYXRjaCgvXkAoXFx3KylcXC8oXFx3KykoXFwuKFxcdyspKT8kL2kpXG4gICAgaWYgKHJlcykge1xuICAgICAgY29uc3QgdHlwZSA9IHJlc1sxXVxuICAgICAgY29uc3QgbmFtZSA9IHJlc1syXVxuICAgICAgY29uc3QgbWV0aG9kID0gcmVzWzRdXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnbW9kdWxlJzogcmV0dXJuIGlzUmVnaXN0ZXJlZE1vZHVsZShuYW1lLCBtZXRob2QpXG4gICAgICAgIGNhc2UgJ2NvbXBvbmVudCc6IHJldHVybiBpc1JlZ2lzdGVyZWRDb21wb25lbnQobmFtZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gcmVnaXN0ZXJTdHlsZVNoZWV0IChzdHlsZXMpIHtcbiAgLy8gICBpZiAodGhpcy5kb2N1bWVudCkge1xuICAvLyAgICAgdGhpcy5kb2N1bWVudC5yZWdpc3RlclN0eWxlU2hlZXQoc3R5bGVzKVxuICAvLyAgIH1cbiAgLy8gfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IGluaXQgYXMgaW5pdFRhc2tIYW5kbGVyIH0gZnJvbSAnLi4vYnJpZGdlL1Rhc2tDZW50ZXInXG5pbXBvcnQgeyByZWNlaXZlVGFza3MgfSBmcm9tICcuLi9icmlkZ2UvcmVjZWl2ZXInXG5pbXBvcnQgeyByZWdpc3Rlck1vZHVsZXMgfSBmcm9tICcuL21vZHVsZSdcbmltcG9ydCB7IHJlZ2lzdGVyQ29tcG9uZW50cyB9IGZyb20gJy4vY29tcG9uZW50J1xuaW1wb3J0IHsgc2VydmljZXMsIHJlZ2lzdGVyLCB1bnJlZ2lzdGVyIH0gZnJvbSAnLi9zZXJ2aWNlJ1xuaW1wb3J0IHsgdHJhY2sgfSBmcm9tICcuLi9icmlkZ2UvZGVidWcnXG5pbXBvcnQgV2VleEluc3RhbmNlIGZyb20gJy4vV2VleEluc3RhbmNlJ1xuaW1wb3J0IHsgZ2V0RG9jIH0gZnJvbSAnLi4vdmRvbS9vcGVyYXRpb24nXG5cbmxldCBmcmFtZXdvcmtzXG5sZXQgcnVudGltZUNvbmZpZ1xuXG5jb25zdCB2ZXJzaW9uUmVnRXhwID0gL15cXHMqXFwvXFwvICooXFx7W159XSpcXH0pICpcXHI/XFxuL1xuXG4vKipcbiAqIERldGVjdCBhIEpTIEJ1bmRsZSBjb2RlIGFuZCBtYWtlIHN1cmUgd2hpY2ggZnJhbWV3b3JrIGl0J3MgYmFzZWQgdG8uIEVhY2ggSlNcbiAqIEJ1bmRsZSBzaG91bGQgbWFrZSBzdXJlIHRoYXQgaXQgc3RhcnRzIHdpdGggYSBsaW5lIG9mIEpTT04gY29tbWVudCBhbmQgaXNcbiAqIG1vcmUgdGhhdCBvbmUgbGluZS5cbiAqIEBwYXJhbSAge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5mdW5jdGlvbiBnZXRCdW5kbGVUeXBlIChjb2RlKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHZlcnNpb25SZWdFeHAuZXhlYyhjb2RlKVxuICBpZiAocmVzdWx0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGluZm8gPSBKU09OLnBhcnNlKHJlc3VsdFsxXSlcbiAgICAgIHJldHVybiBpbmZvLmZyYW1ld29ya1xuICAgIH1cbiAgICBjYXRjaCAoZSkge31cbiAgfVxuXG4gIC8vIGRlZmF1bHQgYnVuZGxlIHR5cGVcbiAgcmV0dXJuICdXZWV4J1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZXJ2aWNlcyAoaWQsIGVudiwgY29uZmlnKSB7XG4gIC8vIEluaXQgSmF2YVNjcmlwdCBzZXJ2aWNlcyBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgY29uc3Qgc2VydmljZU1hcCA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgc2VydmljZU1hcC5zZXJ2aWNlID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICBzZXJ2aWNlcy5mb3JFYWNoKCh7IG5hbWUsIG9wdGlvbnMgfSkgPT4ge1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgICAgY29uc29sZS5kZWJ1ZyhgW0pTIFJ1bnRpbWVdIGNyZWF0ZSBzZXJ2aWNlICR7bmFtZX0uYClcbiAgICB9XG4gICAgY29uc3QgY3JlYXRlID0gb3B0aW9ucy5jcmVhdGVcbiAgICBpZiAoY3JlYXRlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBjcmVhdGUoaWQsIGVudiwgY29uZmlnKVxuICAgICAgICBPYmplY3QuYXNzaWduKHNlcnZpY2VNYXAuc2VydmljZSwgcmVzdWx0KVxuICAgICAgICBPYmplY3QuYXNzaWduKHNlcnZpY2VNYXAsIHJlc3VsdC5pbnN0YW5jZSlcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBSdW50aW1lXSBGYWlsZWQgdG8gY3JlYXRlIHNlcnZpY2UgJHtuYW1lfS5gKVxuICAgICAgfVxuICAgIH1cbiAgfSlcbiAgZGVsZXRlIHNlcnZpY2VNYXAuc2VydmljZS5pbnN0YW5jZVxuICBPYmplY3QuZnJlZXplKHNlcnZpY2VNYXAuc2VydmljZSlcbiAgcmV0dXJuIHNlcnZpY2VNYXBcbn1cblxuY29uc3QgaW5zdGFuY2VUeXBlTWFwID0ge31cbmZ1bmN0aW9uIGdldEZyYW1ld29ya1R5cGUgKGlkKSB7XG4gIHJldHVybiBpbnN0YW5jZVR5cGVNYXBbaWRdXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUluc3RhbmNlQ29udGV4dCAoaWQsIG9wdGlvbnMgPSB7fSwgZGF0YSkge1xuICBjb25zdCB3ZWV4ID0gbmV3IFdlZXhJbnN0YW5jZShpZCwgb3B0aW9ucylcbiAgT2JqZWN0LmZyZWV6ZSh3ZWV4KVxuXG4gIGNvbnN0IGJ1bmRsZVR5cGUgPSBvcHRpb25zLmJ1bmRsZVR5cGUgfHwgJ1Z1ZSdcbiAgaW5zdGFuY2VUeXBlTWFwW2lkXSA9IGJ1bmRsZVR5cGVcbiAgY29uc3QgZnJhbWV3b3JrID0gcnVudGltZUNvbmZpZy5mcmFtZXdvcmtzW2J1bmRsZVR5cGVdXG4gIGlmICghZnJhbWV3b3JrKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgW0pTIEZyYW1ld29ya10gSW52YWxpZCBidW5kbGUgdHlwZSBcIiR7YnVuZGxlVHlwZX1cIi5gKVxuICB9XG4gIHRyYWNrKGlkLCAnYnVuZGxlVHlwZScsIGJ1bmRsZVR5cGUpXG5cbiAgLy8gcHJlcGFyZSBqcyBzZXJ2aWNlXG4gIGNvbnN0IHNlcnZpY2VzID0gY3JlYXRlU2VydmljZXMoaWQsIHtcbiAgICB3ZWV4LFxuICAgIGNvbmZpZzogb3B0aW9ucyxcbiAgICBjcmVhdGVkOiBEYXRlLm5vdygpLFxuICAgIGZyYW1ld29yazogYnVuZGxlVHlwZSxcbiAgICBidW5kbGVUeXBlXG4gIH0sIHJ1bnRpbWVDb25maWcpXG4gIE9iamVjdC5mcmVlemUoc2VydmljZXMpXG5cbiAgLy8gcHJlcGFyZSBydW50aW1lIGNvbnRleHRcbiAgY29uc3QgcnVudGltZUNvbnRleHQgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gIE9iamVjdC5hc3NpZ24ocnVudGltZUNvbnRleHQsIHNlcnZpY2VzLCB7XG4gICAgd2VleCxcbiAgICBzZXJ2aWNlcyAvLyBUZW1wb3JhcnkgY29tcGF0aWJsZSB3aXRoIHNvbWUgbGVnYWN5IEFQSXMgaW4gUmF4XG4gIH0pXG4gIE9iamVjdC5mcmVlemUocnVudGltZUNvbnRleHQpXG5cbiAgLy8gcHJlcGFyZSBpbnN0YW5jZSBjb250ZXh0XG4gIGNvbnN0IGluc3RhbmNlQ29udGV4dCA9IE9iamVjdC5hc3NpZ24oe30sIHJ1bnRpbWVDb250ZXh0KVxuICBpZiAodHlwZW9mIGZyYW1ld29yay5jcmVhdGVJbnN0YW5jZUNvbnRleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBPYmplY3QuYXNzaWduKGluc3RhbmNlQ29udGV4dCwgZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlQ29udGV4dChpZCwgcnVudGltZUNvbnRleHQsIGRhdGEpKVxuICB9XG4gIE9iamVjdC5mcmVlemUoaW5zdGFuY2VDb250ZXh0KVxuICByZXR1cm4gaW5zdGFuY2VDb250ZXh0XG59XG5cbi8qKlxuICogQ2hlY2sgd2hpY2ggZnJhbWV3b3JrIGEgY2VydGFpbiBKUyBCdW5kbGUgY29kZSBiYXNlZCB0by4gQW5kIGNyZWF0ZSBpbnN0YW5jZVxuICogYnkgdGhpcyBmcmFtZXdvcmsuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICovXG5mdW5jdGlvbiBjcmVhdGVJbnN0YW5jZSAoaWQsIGNvZGUsIGNvbmZpZywgZGF0YSkge1xuICBpZiAoaW5zdGFuY2VUeXBlTWFwW2lkXSkge1xuICAgIHJldHVybiBuZXcgRXJyb3IoYFRoZSBpbnN0YW5jZSBpZCBcIiR7aWR9XCIgaGFzIGFscmVhZHkgYmVlbiB1c2VkIWApXG4gIH1cblxuICAvLyBJbml0IGluc3RhbmNlIGluZm8uXG4gIGNvbnN0IGJ1bmRsZVR5cGUgPSBnZXRCdW5kbGVUeXBlKGNvZGUpXG4gIGluc3RhbmNlVHlwZU1hcFtpZF0gPSBidW5kbGVUeXBlXG5cbiAgLy8gSW5pdCBpbnN0YW5jZSBjb25maWcuXG4gIGNvbmZpZyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY29uZmlnIHx8IHt9KSlcbiAgY29uZmlnLmVudiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFsLldYRW52aXJvbm1lbnQgfHwge30pKVxuICBjb25maWcuYnVuZGxlVHlwZSA9IGJ1bmRsZVR5cGVcblxuICBjb25zdCBmcmFtZXdvcmsgPSBydW50aW1lQ29uZmlnLmZyYW1ld29ya3NbYnVuZGxlVHlwZV1cbiAgaWYgKCFmcmFtZXdvcmspIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKGBbSlMgRnJhbWV3b3JrXSBJbnZhbGlkIGJ1bmRsZSB0eXBlIFwiJHtidW5kbGVUeXBlfVwiLmApXG4gIH1cbiAgaWYgKGJ1bmRsZVR5cGUgPT09ICdXZWV4Jykge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIENPTVBBVElCSUxJVFkgV0FSTklORzogYFxuICAgICAgKyBgV2VleCBEU0wgMS4wICgud2UpIGZyYW1ld29yayBpcyBubyBsb25nZXIgc3VwcG9ydGVkISBgXG4gICAgICArIGBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgdmVyc2lvbiBvZiBXZWV4U0RLLCBgXG4gICAgICArIGB5b3VyIHBhZ2Ugd291bGQgYmUgY3Jhc2ggaWYgeW91IHN0aWxsIHVzaW5nIHRoZSBcIi53ZVwiIGZyYW1ld29yay4gYFxuICAgICAgKyBgUGxlYXNlIHVwZ3JhZGUgaXQgdG8gVnVlLmpzIG9yIFJheC5gKVxuICB9XG5cbiAgY29uc3QgaW5zdGFuY2VDb250ZXh0ID0gY3JlYXRlSW5zdGFuY2VDb250ZXh0KGlkLCBjb25maWcsIGRhdGEpXG4gIGlmICh0eXBlb2YgZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVGVtcG9yYXJ5IGNvbXBhdGlibGUgd2l0aCBzb21lIGxlZ2FjeSBBUElzIGluIFJheCxcbiAgICAvLyBzb21lIFJheCBwYWdlIGlzIHVzaW5nIHRoZSBsZWdhY3kgXCIud2VcIiBmcmFtZXdvcmsuXG4gICAgaWYgKGJ1bmRsZVR5cGUgPT09ICdSYXgnIHx8IGJ1bmRsZVR5cGUgPT09ICdXZWV4Jykge1xuICAgICAgY29uc3QgcmF4SW5zdGFuY2VDb250ZXh0ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgY3JlYXRlZDogRGF0ZS5ub3coKSxcbiAgICAgICAgZnJhbWV3b3JrOiBidW5kbGVUeXBlXG4gICAgICB9LCBpbnN0YW5jZUNvbnRleHQpXG4gICAgICByZXR1cm4gZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlKGlkLCBjb2RlLCBjb25maWcsIGRhdGEsIHJheEluc3RhbmNlQ29udGV4dClcbiAgICB9XG4gICAgcmV0dXJuIGZyYW1ld29yay5jcmVhdGVJbnN0YW5jZShpZCwgY29kZSwgY29uZmlnLCBkYXRhLCBpbnN0YW5jZUNvbnRleHQpXG4gIH1cbiAgLy8gY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gQ2FuJ3QgZmluZCBhdmFpbGFibGUgXCJjcmVhdGVJbnN0YW5jZVwiIG1ldGhvZCBpbiAke2J1bmRsZVR5cGV9IWApXG4gIHJ1bkluQ29udGV4dChjb2RlLCBpbnN0YW5jZUNvbnRleHQpXG59XG5cbi8qKlxuICogUnVuIGpzIGNvZGUgaW4gYSBzcGVjaWZpYyBjb250ZXh0LlxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIHJ1bkluQ29udGV4dCAoY29kZSwgY29udGV4dCkge1xuICBjb25zdCBrZXlzID0gW11cbiAgY29uc3QgYXJncyA9IFtdXG4gIGZvciAoY29uc3Qga2V5IGluIGNvbnRleHQpIHtcbiAgICBrZXlzLnB1c2goa2V5KVxuICAgIGFyZ3MucHVzaChjb250ZXh0W2tleV0pXG4gIH1cblxuICBjb25zdCBidW5kbGUgPSBgXG4gICAgKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICAgICR7Y29kZX1cbiAgICB9KShPYmplY3QuY3JlYXRlKHRoaXMpKVxuICBgXG5cbiAgcmV0dXJuIChuZXcgRnVuY3Rpb24oLi4ua2V5cywgYnVuZGxlKSkoLi4uYXJncylcbn1cblxuLyoqXG4gKiBHZXQgdGhlIEpTT04gb2JqZWN0IG9mIHRoZSByb290IGVsZW1lbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5zdGFuY2VJZFxuICovXG5mdW5jdGlvbiBnZXRSb290IChpbnN0YW5jZUlkKSB7XG4gIGNvbnN0IGRvY3VtZW50ID0gZ2V0RG9jKGluc3RhbmNlSWQpXG4gIHRyeSB7XG4gICAgaWYgKGRvY3VtZW50ICYmIGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5ib2R5LnRvSlNPTigpXG4gICAgfVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIGdldCB0aGUgdmlydHVhbCBkb20gdHJlZS5gKVxuICAgIHJldHVyblxuICB9XG59XG5cbmNvbnN0IG1ldGhvZHMgPSB7XG4gIGNyZWF0ZUluc3RhbmNlLFxuICBjcmVhdGVJbnN0YW5jZUNvbnRleHQsXG4gIGdldFJvb3QsXG4gIGdldERvY3VtZW50OiBnZXREb2MsXG4gIHJlZ2lzdGVyU2VydmljZTogcmVnaXN0ZXIsXG4gIHVucmVnaXN0ZXJTZXJ2aWNlOiB1bnJlZ2lzdGVyLFxuICBjYWxsSlMgKGlkLCB0YXNrcykge1xuICAgIGNvbnN0IGZyYW1ld29yayA9IGZyYW1ld29ya3NbZ2V0RnJhbWV3b3JrVHlwZShpZCldXG4gICAgaWYgKGZyYW1ld29yayAmJiB0eXBlb2YgZnJhbWV3b3JrLnJlY2VpdmVUYXNrcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIGZyYW1ld29yay5yZWNlaXZlVGFza3MoaWQsIHRhc2tzKVxuICAgIH1cbiAgICByZXR1cm4gcmVjZWl2ZVRhc2tzKGlkLCB0YXNrcylcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVyIG1ldGhvZHMgd2hpY2ggd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggaW5zdGFuY2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kTmFtZVxuICovXG5mdW5jdGlvbiBnZW5JbnN0YW5jZSAobWV0aG9kTmFtZSkge1xuICBtZXRob2RzW21ldGhvZE5hbWVdID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpZCA9IGFyZ3NbMF1cbiAgICBjb25zdCB0eXBlID0gZ2V0RnJhbWV3b3JrVHlwZShpZClcbiAgICBpZiAodHlwZSAmJiBmcmFtZXdvcmtzW3R5cGVdKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBmcmFtZXdvcmtzW3R5cGVdW21ldGhvZE5hbWVdKC4uLmFyZ3MpXG4gICAgICBjb25zdCBpbmZvID0geyBmcmFtZXdvcms6IHR5cGUgfVxuXG4gICAgICAvLyBMaWZlY3ljbGUgbWV0aG9kc1xuICAgICAgaWYgKG1ldGhvZE5hbWUgPT09ICdyZWZyZXNoSW5zdGFuY2UnKSB7XG4gICAgICAgIHNlcnZpY2VzLmZvckVhY2goc2VydmljZSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVmcmVzaCA9IHNlcnZpY2Uub3B0aW9ucy5yZWZyZXNoXG4gICAgICAgICAgaWYgKHJlZnJlc2gpIHtcbiAgICAgICAgICAgIHJlZnJlc2goaWQsIHsgaW5mbywgcnVudGltZTogcnVudGltZUNvbmZpZyB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG1ldGhvZE5hbWUgPT09ICdkZXN0cm95SW5zdGFuY2UnKSB7XG4gICAgICAgIHNlcnZpY2VzLmZvckVhY2goc2VydmljZSA9PiB7XG4gICAgICAgICAgY29uc3QgZGVzdHJveSA9IHNlcnZpY2Uub3B0aW9ucy5kZXN0cm95XG4gICAgICAgICAgaWYgKGRlc3Ryb3kpIHtcbiAgICAgICAgICAgIGRlc3Ryb3koaWQsIHsgaW5mbywgcnVudGltZTogcnVudGltZUNvbmZpZyB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlVHlwZU1hcFtpZF1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cbiAgICByZXR1cm4gbmV3IEVycm9yKGBbSlMgRnJhbWV3b3JrXSBVc2luZyBpbnZhbGlkIGluc3RhbmNlIGlkIGBcbiAgICAgICsgYFwiJHtpZH1cIiB3aGVuIGNhbGxpbmcgJHttZXRob2ROYW1lfS5gKVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgbWV0aG9kcyB3aGljaCBpbml0IGVhY2ggZnJhbWV3b3Jrcy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2ROYW1lXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzaGFyZWRNZXRob2RcbiAqL1xuZnVuY3Rpb24gYWRhcHRNZXRob2QgKG1ldGhvZE5hbWUsIHNoYXJlZE1ldGhvZCkge1xuICBtZXRob2RzW21ldGhvZE5hbWVdID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIHNoYXJlZE1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgc2hhcmVkTWV0aG9kKC4uLmFyZ3MpXG4gICAgfVxuXG4gICAgLy8gVE9ETzogZGVwcmVjYXRlZFxuICAgIGZvciAoY29uc3QgbmFtZSBpbiBydW50aW1lQ29uZmlnLmZyYW1ld29ya3MpIHtcbiAgICAgIGNvbnN0IGZyYW1ld29yayA9IHJ1bnRpbWVDb25maWcuZnJhbWV3b3Jrc1tuYW1lXVxuICAgICAgaWYgKGZyYW1ld29yayAmJiBmcmFtZXdvcmtbbWV0aG9kTmFtZV0pIHtcbiAgICAgICAgZnJhbWV3b3JrW21ldGhvZE5hbWVdKC4uLmFyZ3MpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXQgKGNvbmZpZykge1xuICBydW50aW1lQ29uZmlnID0gY29uZmlnIHx8IHt9XG4gIGZyYW1ld29ya3MgPSBydW50aW1lQ29uZmlnLmZyYW1ld29ya3MgfHwge31cbiAgaW5pdFRhc2tIYW5kbGVyKClcblxuICAvLyBJbml0IGVhY2ggZnJhbWV3b3JrIGJ5IGBpbml0YCBtZXRob2QgYW5kIGBjb25maWdgIHdoaWNoIGNvbnRhaW5zIHRocmVlXG4gIC8vIHZpcnR1YWwtRE9NIENsYXNzOiBgRG9jdW1lbnRgLCBgRWxlbWVudGAgJiBgQ29tbWVudGAsIGFuZCBhIEpTIGJyaWRnZSBtZXRob2Q6XG4gIC8vIGBzZW5kVGFza3MoLi4uYXJncylgLlxuICBmb3IgKGNvbnN0IG5hbWUgaW4gZnJhbWV3b3Jrcykge1xuICAgIGNvbnN0IGZyYW1ld29yayA9IGZyYW1ld29ya3NbbmFtZV1cbiAgICBpZiAodHlwZW9mIGZyYW1ld29yay5pbml0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0cnkge1xuICAgICAgICBmcmFtZXdvcmsuaW5pdChjb25maWcpXG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge31cbiAgICB9XG4gIH1cblxuICBhZGFwdE1ldGhvZCgncmVnaXN0ZXJDb21wb25lbnRzJywgcmVnaXN0ZXJDb21wb25lbnRzKVxuICBhZGFwdE1ldGhvZCgncmVnaXN0ZXJNb2R1bGVzJywgcmVnaXN0ZXJNb2R1bGVzKVxuICBhZGFwdE1ldGhvZCgncmVnaXN0ZXJNZXRob2RzJylcblxuICA7IFsnZGVzdHJveUluc3RhbmNlJywgJ3JlZnJlc2hJbnN0YW5jZSddLmZvckVhY2goZ2VuSW5zdGFuY2UpXG5cbiAgcmV0dXJuIG1ldGhvZHNcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL05vZGUnXG5pbXBvcnQgRWxlbWVudCBmcm9tICcuL0VsZW1lbnQnXG5pbXBvcnQgQ29tbWVudCBmcm9tICcuL0NvbW1lbnQnXG5pbXBvcnQgRG9jdW1lbnQgZnJvbSAnLi9Eb2N1bWVudCdcblxuZXhwb3J0IHtcbiAgcmVnaXN0ZXJFbGVtZW50LFxuICB1bnJlZ2lzdGVyRWxlbWVudCxcbiAgaXNXZWV4RWxlbWVudCxcbiAgY2xlYXJXZWV4RWxlbWVudHNcbn0gZnJvbSAnLi9XZWV4RWxlbWVudCdcblxuZXhwb3J0IHtcbiAgRG9jdW1lbnQsXG4gIE5vZGUsXG4gIEVsZW1lbnQsXG4gIENvbW1lbnRcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBEb2N1bWVudCwgRWxlbWVudCwgQ29tbWVudCB9IGZyb20gJy4uL3Zkb20nXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi4vYnJpZGdlL0xpc3RlbmVyJ1xuaW1wb3J0IHsgVGFza0NlbnRlciB9IGZyb20gJy4uL2JyaWRnZS9UYXNrQ2VudGVyJ1xuXG5jb25zdCBjb25maWcgPSB7XG4gIERvY3VtZW50LCBFbGVtZW50LCBDb21tZW50LCBMaXN0ZW5lcixcbiAgVGFza0NlbnRlcixcbiAgc2VuZFRhc2tzICguLi5hcmdzKSB7XG4gICAgaWYgKHR5cGVvZiBjYWxsTmF0aXZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gY2FsbE5hdGl2ZSguLi5hcmdzKVxuICAgIH1cbiAgICByZXR1cm4gKGdsb2JhbC5jYWxsTmF0aXZlIHx8ICgoKSA9PiB7fSkpKC4uLmFyZ3MpXG4gIH1cbn1cblxuRG9jdW1lbnQuaGFuZGxlciA9IGNvbmZpZy5zZW5kVGFza3NcblxuZXhwb3J0IGRlZmF1bHQgY29uZmlnXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IGluaXQgZnJvbSAnLi9pbml0J1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB7IHJlZ2lzdGVyLCB1bnJlZ2lzdGVyLCBoYXMgfSBmcm9tICcuL3NlcnZpY2UnXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiBmcmVlemVQcm90b3R5cGUgKCkge1xuICAvLyBPYmplY3QuZnJlZXplKGNvbmZpZy5FbGVtZW50KVxuICBPYmplY3QuZnJlZXplKGNvbmZpZy5Db21tZW50KVxuICBPYmplY3QuZnJlZXplKGNvbmZpZy5MaXN0ZW5lcilcbiAgT2JqZWN0LmZyZWV6ZShjb25maWcuRG9jdW1lbnQucHJvdG90eXBlKVxuICAvLyBPYmplY3QuZnJlZXplKGNvbmZpZy5FbGVtZW50LnByb3RvdHlwZSlcbiAgT2JqZWN0LmZyZWV6ZShjb25maWcuQ29tbWVudC5wcm90b3R5cGUpXG4gIE9iamVjdC5mcmVlemUoY29uZmlnLkxpc3RlbmVyLnByb3RvdHlwZSlcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBzZXJ2aWNlOiB7IHJlZ2lzdGVyLCB1bnJlZ2lzdGVyLCBoYXMgfSxcbiAgZnJlZXplUHJvdG90eXBlLFxuICBpbml0LFxuICBjb25maWdcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIE1vY2sgTWVzc2FnZUV2ZW50IHR5cGVcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge29iamVjdH0gZGljdCB7IGRhdGEsIG9yaWdpbiwgc291cmNlLCBwb3J0cyB9XG4gKlxuICogVGhpcyB0eXBlIGhhcyBiZWVuIHNpbXBsaWZpZWQuXG4gKiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9jb21tcy5odG1sI21lc3NhZ2VldmVudFxuICogaHR0cHM6Ly9kb20uc3BlYy53aGF0d2cub3JnLyNpbnRlcmZhY2UtZXZlbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE1lc3NhZ2VFdmVudCAodHlwZSwgZGljdCA9IHt9KSB7XG4gIHRoaXMudHlwZSA9IHR5cGUgfHwgJ21lc3NhZ2UnXG5cbiAgdGhpcy5kYXRhID0gZGljdC5kYXRhIHx8IG51bGxcbiAgdGhpcy5vcmlnaW4gPSBkaWN0Lm9yaWdpbiB8fCAnJ1xuICB0aGlzLnNvdXJjZSA9IGRpY3Quc291cmNlIHx8IG51bGxcbiAgdGhpcy5wb3J0cyA9IGRpY3QucG9ydHMgfHwgW11cblxuICAvLyBpbmhlcml0IHByb3BlcnRpZXNcbiAgdGhpcy50YXJnZXQgPSBudWxsXG4gIHRoaXMudGltZVN0YW1wID0gRGF0ZS5ub3coKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogVGhlIHBvbHlmaWxsIG9mIEJyb2FkY2FzdENoYW5uZWwgQVBJLlxuICogVGhpcyBhcGkgY2FuIGJlIHVzZWQgdG8gYWNoaWV2ZSBpbnRlci1pbnN0YW5jZSBjb21tdW5pY2F0aW9ucy5cbiAqXG4gKiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9jb21tcy5odG1sI2Jyb2FkY2FzdGluZy10by1vdGhlci1icm93c2luZy1jb250ZXh0c1xuICovXG5cbmltcG9ydCB7IE1lc3NhZ2VFdmVudCB9IGZyb20gJy4vbWVzc2FnZS1ldmVudCdcblxuY29uc3QgY2hhbm5lbHMgPSB7fVxuY29uc3QgaW5zdGFuY2VzID0ge31cblxuLyoqXG4gKiBBbiBlbXB0eSBjb25zdHJ1Y3RvciBmb3IgQnJvYWRjYXN0Q2hhbm5lbCBwb2x5ZmlsbC5cbiAqIFRoZSByZWFsIGNvbnN0cnVjdG9yIHdpbGwgYmUgZGVmaW5lZCB3aGVuIGEgV2VleCBpbnN0YW5jZSBjcmVhdGVkIGJlY2F1c2VcbiAqIHdlIG5lZWQgdG8gdHJhY2sgdGhlIGNoYW5uZWwgYnkgV2VleCBpbnN0YW5jZSBpZC5cbiAqL1xuZnVuY3Rpb24gQnJvYWRjYXN0Q2hhbm5lbCAoKSB7fVxuXG4vKipcbiAqIFNlbmRzIHRoZSBnaXZlbiBtZXNzYWdlIHRvIG90aGVyIEJyb2FkY2FzdENoYW5uZWwgb2JqZWN0cyBzZXQgdXAgZm9yIHRoaXMgY2hhbm5lbC5cbiAqIEBwYXJhbSB7YW55fSBtZXNzYWdlXG4gKi9cbkJyb2FkY2FzdENoYW5uZWwucHJvdG90eXBlLnBvc3RNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQnJvYWRjYXN0Q2hhbm5lbCBcIiR7dGhpcy5uYW1lfVwiIGlzIGNsb3NlZC5gKVxuICB9XG5cbiAgY29uc3Qgc3Vic2NyaWJlcnMgPSBjaGFubmVsc1t0aGlzLm5hbWVdXG4gIGlmIChzdWJzY3JpYmVycyAmJiBzdWJzY3JpYmVycy5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBtZW1iZXIgPSBzdWJzY3JpYmVyc1tpXVxuXG4gICAgICBpZiAobWVtYmVyLl9jbG9zZWQgfHwgbWVtYmVyID09PSB0aGlzKSBjb250aW51ZVxuXG4gICAgICBpZiAodHlwZW9mIG1lbWJlci5vbm1lc3NhZ2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbWVtYmVyLm9ubWVzc2FnZShuZXcgTWVzc2FnZUV2ZW50KCdtZXNzYWdlJywgeyBkYXRhOiBtZXNzYWdlIH0pKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsb3NlcyB0aGUgQnJvYWRjYXN0Q2hhbm5lbCBvYmplY3QsIG9wZW5pbmcgaXQgdXAgdG8gZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICovXG5Ccm9hZGNhc3RDaGFubmVsLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxuXG4gIC8vIHJlbW92ZSBpdHNlbGYgZnJvbSBjaGFubmVscy5cbiAgaWYgKGNoYW5uZWxzW3RoaXMubmFtZV0pIHtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IGNoYW5uZWxzW3RoaXMubmFtZV0uZmlsdGVyKHggPT4geCAhPT0gdGhpcylcbiAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoKSB7XG4gICAgICBjaGFubmVsc1t0aGlzLm5hbWVdID0gc3Vic2NyaWJlcnNcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkZWxldGUgY2hhbm5lbHNbdGhpcy5uYW1lXVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGNyZWF0ZTogKGlkLCBlbnYsIGNvbmZpZykgPT4ge1xuICAgIGluc3RhbmNlc1tpZF0gPSBbXVxuICAgIGlmICh0eXBlb2YgZ2xvYmFsLkJyb2FkY2FzdENoYW5uZWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB7fVxuICAgIH1cbiAgICBjb25zdCBzZXJ2aWNlT2JqZWN0ID0ge1xuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm5zIGEgbmV3IEJyb2FkY2FzdENoYW5uZWwgb2JqZWN0IHZpYSB3aGljaCBtZXNzYWdlcyBmb3IgdGhlIGdpdmVuXG4gICAgICAgKiBjaGFubmVsIG5hbWUgY2FuIGJlIHNlbnQgYW5kIHJlY2VpdmVkLlxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgICAqL1xuICAgICAgQnJvYWRjYXN0Q2hhbm5lbDogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgLy8gdGhlIG5hbWUgcHJvcGVydHkgaXMgcmVhZG9ubHlcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICduYW1lJywge1xuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6IFN0cmluZyhuYW1lKVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlXG4gICAgICAgIHRoaXMub25tZXNzYWdlID0gbnVsbFxuXG4gICAgICAgIGlmICghY2hhbm5lbHNbdGhpcy5uYW1lXSkge1xuICAgICAgICAgIGNoYW5uZWxzW3RoaXMubmFtZV0gPSBbXVxuICAgICAgICB9XG4gICAgICAgIGNoYW5uZWxzW3RoaXMubmFtZV0ucHVzaCh0aGlzKVxuICAgICAgICBpbnN0YW5jZXNbaWRdLnB1c2godGhpcylcbiAgICAgIH1cbiAgICB9XG4gICAgc2VydmljZU9iamVjdC5Ccm9hZGNhc3RDaGFubmVsLnByb3RvdHlwZSA9IEJyb2FkY2FzdENoYW5uZWwucHJvdG90eXBlXG4gICAgcmV0dXJuIHtcbiAgICAgIGluc3RhbmNlOiBzZXJ2aWNlT2JqZWN0XG4gICAgfVxuICB9LFxuICBkZXN0cm95OiAoaWQsIGVudikgPT4ge1xuICAgIGluc3RhbmNlc1tpZF0uZm9yRWFjaChjaGFubmVsID0+IGNoYW5uZWwuY2xvc2UoKSlcbiAgICBkZWxldGUgaW5zdGFuY2VzW2lkXVxuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCBCcm9hZGNhc3RDaGFubmVsIGZyb20gJy4vYnJvYWRjYXN0LWNoYW5uZWwvaW5kZXgnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgQnJvYWRjYXN0Q2hhbm5lbFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IHN1YnZlcnNpb24gfSBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nXG5pbXBvcnQgcnVudGltZSBmcm9tICcuLi9hcGknXG5pbXBvcnQgc2VydmljZXMgZnJvbSAnLi4vc2VydmljZXMnXG5cbi8qKlxuICogU2V0dXAgZnJhbWV3b3JrcyB3aXRoIHJ1bnRpbWUuXG4gKiBZb3UgY2FuIHBhY2thZ2UgbW9yZSBmcmFtZXdvcmtzIGJ5XG4gKiAgcGFzc2luZyB0aGVtIGFzIGFyZ3VtZW50cy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGZyYW1ld29ya3MpIHtcbiAgY29uc3QgeyBpbml0LCBjb25maWcgfSA9IHJ1bnRpbWVcbiAgY29uZmlnLmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzXG4gIGNvbnN0IHsgbmF0aXZlLCB0cmFuc2Zvcm1lciB9ID0gc3VidmVyc2lvblxuXG4gIGZvciAoY29uc3Qgc2VydmljZU5hbWUgaW4gc2VydmljZXMpIHtcbiAgICBydW50aW1lLnNlcnZpY2UucmVnaXN0ZXIoc2VydmljZU5hbWUsIHNlcnZpY2VzW3NlcnZpY2VOYW1lXSlcbiAgfVxuXG4gIHJ1bnRpbWUuZnJlZXplUHJvdG90eXBlKClcblxuICAvLyByZWdpc3RlciBmcmFtZXdvcmsgbWV0YSBpbmZvXG4gIGdsb2JhbC5mcmFtZXdvcmtWZXJzaW9uID0gbmF0aXZlXG4gIGdsb2JhbC50cmFuc2Zvcm1lclZlcnNpb24gPSB0cmFuc2Zvcm1lclxuXG4gIC8vIGluaXQgZnJhbWV3b3Jrc1xuICBjb25zdCBnbG9iYWxNZXRob2RzID0gaW5pdChjb25maWcpXG5cbiAgLy8gc2V0IGdsb2JhbCBtZXRob2RzXG4gIGZvciAoY29uc3QgbWV0aG9kTmFtZSBpbiBnbG9iYWxNZXRob2RzKSB7XG4gICAgZ2xvYmFsW21ldGhvZE5hbWVdID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IHJldCA9IGdsb2JhbE1ldGhvZHNbbWV0aG9kTmFtZV0oLi4uYXJncylcbiAgICAgIGlmIChyZXQgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKHJldC50b1N0cmluZygpKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJldFxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHdlZXhGYWN0b3J5IChleHBvcnRzLCBkb2N1bWVudCkge1xuXG4vKiAgKi9cblxudmFyIGVtcHR5T2JqZWN0ID0gT2JqZWN0LmZyZWV6ZSh7fSk7XG5cbi8vIHRoZXNlIGhlbHBlcnMgcHJvZHVjZXMgYmV0dGVyIHZtIGNvZGUgaW4gSlMgZW5naW5lcyBkdWUgdG8gdGhlaXJcbi8vIGV4cGxpY2l0bmVzcyBhbmQgZnVuY3Rpb24gaW5saW5pbmdcbmZ1bmN0aW9uIGlzVW5kZWYgKHYpIHtcbiAgcmV0dXJuIHYgPT09IHVuZGVmaW5lZCB8fCB2ID09PSBudWxsXG59XG5cbmZ1bmN0aW9uIGlzRGVmICh2KSB7XG4gIHJldHVybiB2ICE9PSB1bmRlZmluZWQgJiYgdiAhPT0gbnVsbFxufVxuXG5mdW5jdGlvbiBpc1RydWUgKHYpIHtcbiAgcmV0dXJuIHYgPT09IHRydWVcbn1cblxuZnVuY3Rpb24gaXNGYWxzZSAodikge1xuICByZXR1cm4gdiA9PT0gZmFsc2Vcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB2YWx1ZSBpcyBwcmltaXRpdmVcbiAqL1xuZnVuY3Rpb24gaXNQcmltaXRpdmUgKHZhbHVlKSB7XG4gIHJldHVybiAoXG4gICAgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHxcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJ1xuICApXG59XG5cbi8qKlxuICogUXVpY2sgb2JqZWN0IGNoZWNrIC0gdGhpcyBpcyBwcmltYXJpbHkgdXNlZCB0byB0ZWxsXG4gKiBPYmplY3RzIGZyb20gcHJpbWl0aXZlIHZhbHVlcyB3aGVuIHdlIGtub3cgdGhlIHZhbHVlXG4gKiBpcyBhIEpTT04tY29tcGxpYW50IHR5cGUuXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0IChvYmopIHtcbiAgcmV0dXJuIG9iaiAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0J1xufVxuXG4vKipcbiAqIEdldCB0aGUgcmF3IHR5cGUgc3RyaW5nIG9mIGEgdmFsdWUgZS5nLiBbb2JqZWN0IE9iamVjdF1cbiAqL1xudmFyIF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbmZ1bmN0aW9uIHRvUmF3VHlwZSAodmFsdWUpIHtcbiAgcmV0dXJuIF90b1N0cmluZy5jYWxsKHZhbHVlKS5zbGljZSg4LCAtMSlcbn1cblxuLyoqXG4gKiBTdHJpY3Qgb2JqZWN0IHR5cGUgY2hlY2suIE9ubHkgcmV0dXJucyB0cnVlXG4gKiBmb3IgcGxhaW4gSmF2YVNjcmlwdCBvYmplY3RzLlxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0IChvYmopIHtcbiAgcmV0dXJuIF90b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nXG59XG5cbmZ1bmN0aW9uIGlzUmVnRXhwICh2KSB7XG4gIHJldHVybiBfdG9TdHJpbmcuY2FsbCh2KSA9PT0gJ1tvYmplY3QgUmVnRXhwXSdcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB2YWwgaXMgYSB2YWxpZCBhcnJheSBpbmRleC5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZEFycmF5SW5kZXggKHZhbCkge1xuICB2YXIgbiA9IHBhcnNlRmxvYXQoU3RyaW5nKHZhbCkpO1xuICByZXR1cm4gbiA+PSAwICYmIE1hdGguZmxvb3IobikgPT09IG4gJiYgaXNGaW5pdGUodmFsKVxufVxuXG4vKipcbiAqIENvbnZlcnQgYSB2YWx1ZSB0byBhIHN0cmluZyB0aGF0IGlzIGFjdHVhbGx5IHJlbmRlcmVkLlxuICovXG5mdW5jdGlvbiB0b1N0cmluZyAodmFsKSB7XG4gIHJldHVybiB2YWwgPT0gbnVsbFxuICAgID8gJydcbiAgICA6IHR5cGVvZiB2YWwgPT09ICdvYmplY3QnXG4gICAgICA/IEpTT04uc3RyaW5naWZ5KHZhbCwgbnVsbCwgMilcbiAgICAgIDogU3RyaW5nKHZhbClcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgaW5wdXQgdmFsdWUgdG8gYSBudW1iZXIgZm9yIHBlcnNpc3RlbmNlLlxuICogSWYgdGhlIGNvbnZlcnNpb24gZmFpbHMsIHJldHVybiBvcmlnaW5hbCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyICh2YWwpIHtcbiAgdmFyIG4gPSBwYXJzZUZsb2F0KHZhbCk7XG4gIHJldHVybiBpc05hTihuKSA/IHZhbCA6IG5cbn1cblxuLyoqXG4gKiBNYWtlIGEgbWFwIGFuZCByZXR1cm4gYSBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYSBrZXlcbiAqIGlzIGluIHRoYXQgbWFwLlxuICovXG5mdW5jdGlvbiBtYWtlTWFwIChcbiAgc3RyLFxuICBleHBlY3RzTG93ZXJDYXNlXG4pIHtcbiAgdmFyIG1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHZhciBsaXN0ID0gc3RyLnNwbGl0KCcsJyk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIG1hcFtsaXN0W2ldXSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIGV4cGVjdHNMb3dlckNhc2VcbiAgICA/IGZ1bmN0aW9uICh2YWwpIHsgcmV0dXJuIG1hcFt2YWwudG9Mb3dlckNhc2UoKV07IH1cbiAgICA6IGZ1bmN0aW9uICh2YWwpIHsgcmV0dXJuIG1hcFt2YWxdOyB9XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSB0YWcgaXMgYSBidWlsdC1pbiB0YWcuXG4gKi9cbnZhciBpc0J1aWx0SW5UYWcgPSBtYWtlTWFwKCdzbG90LGNvbXBvbmVudCcsIHRydWUpO1xuXG4vKipcbiAqIENoZWNrIGlmIGEgYXR0cmlidXRlIGlzIGEgcmVzZXJ2ZWQgYXR0cmlidXRlLlxuICovXG52YXIgaXNSZXNlcnZlZEF0dHJpYnV0ZSA9IG1ha2VNYXAoJ2tleSxyZWYsc2xvdCxzbG90LXNjb3BlLGlzJyk7XG5cbi8qKlxuICogUmVtb3ZlIGFuIGl0ZW0gZnJvbSBhbiBhcnJheVxuICovXG5mdW5jdGlvbiByZW1vdmUgKGFyciwgaXRlbSkge1xuICBpZiAoYXJyLmxlbmd0aCkge1xuICAgIHZhciBpbmRleCA9IGFyci5pbmRleE9mKGl0ZW0pO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICByZXR1cm4gYXJyLnNwbGljZShpbmRleCwgMSlcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBvYmplY3QgaGFzIHRoZSBwcm9wZXJ0eS5cbiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbmZ1bmN0aW9uIGhhc093biAob2JqLCBrZXkpIHtcbiAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgY2FjaGVkIHZlcnNpb24gb2YgYSBwdXJlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjYWNoZWQgKGZuKSB7XG4gIHZhciBjYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHJldHVybiAoZnVuY3Rpb24gY2FjaGVkRm4gKHN0cikge1xuICAgIHZhciBoaXQgPSBjYWNoZVtzdHJdO1xuICAgIHJldHVybiBoaXQgfHwgKGNhY2hlW3N0cl0gPSBmbihzdHIpKVxuICB9KVxufVxuXG4vKipcbiAqIENhbWVsaXplIGEgaHlwaGVuLWRlbGltaXRlZCBzdHJpbmcuXG4gKi9cbnZhciBjYW1lbGl6ZVJFID0gLy0oXFx3KS9nO1xudmFyIGNhbWVsaXplID0gY2FjaGVkKGZ1bmN0aW9uIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKGNhbWVsaXplUkUsIGZ1bmN0aW9uIChfLCBjKSB7IHJldHVybiBjID8gYy50b1VwcGVyQ2FzZSgpIDogJyc7IH0pXG59KTtcblxuLyoqXG4gKiBDYXBpdGFsaXplIGEgc3RyaW5nLlxuICovXG52YXIgY2FwaXRhbGl6ZSA9IGNhY2hlZChmdW5jdGlvbiAoc3RyKSB7XG4gIHJldHVybiBzdHIuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSlcbn0pO1xuXG4vKipcbiAqIEh5cGhlbmF0ZSBhIGNhbWVsQ2FzZSBzdHJpbmcuXG4gKi9cbnZhciBoeXBoZW5hdGVSRSA9IC9cXEIoW0EtWl0pL2c7XG52YXIgaHlwaGVuYXRlID0gY2FjaGVkKGZ1bmN0aW9uIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKGh5cGhlbmF0ZVJFLCAnLSQxJykudG9Mb3dlckNhc2UoKVxufSk7XG5cbi8qKlxuICogU2ltcGxlIGJpbmQsIGZhc3RlciB0aGFuIG5hdGl2ZVxuICovXG5mdW5jdGlvbiBiaW5kIChmbiwgY3R4KSB7XG4gIGZ1bmN0aW9uIGJvdW5kRm4gKGEpIHtcbiAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgcmV0dXJuIGxcbiAgICAgID8gbCA+IDFcbiAgICAgICAgPyBmbi5hcHBseShjdHgsIGFyZ3VtZW50cylcbiAgICAgICAgOiBmbi5jYWxsKGN0eCwgYSlcbiAgICAgIDogZm4uY2FsbChjdHgpXG4gIH1cbiAgLy8gcmVjb3JkIG9yaWdpbmFsIGZuIGxlbmd0aFxuICBib3VuZEZuLl9sZW5ndGggPSBmbi5sZW5ndGg7XG4gIHJldHVybiBib3VuZEZuXG59XG5cbi8qKlxuICogQ29udmVydCBhbiBBcnJheS1saWtlIG9iamVjdCB0byBhIHJlYWwgQXJyYXkuXG4gKi9cbmZ1bmN0aW9uIHRvQXJyYXkgKGxpc3QsIHN0YXJ0KSB7XG4gIHN0YXJ0ID0gc3RhcnQgfHwgMDtcbiAgdmFyIGkgPSBsaXN0Lmxlbmd0aCAtIHN0YXJ0O1xuICB2YXIgcmV0ID0gbmV3IEFycmF5KGkpO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgcmV0W2ldID0gbGlzdFtpICsgc3RhcnRdO1xuICB9XG4gIHJldHVybiByZXRcbn1cblxuLyoqXG4gKiBNaXggcHJvcGVydGllcyBpbnRvIHRhcmdldCBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIGV4dGVuZCAodG8sIF9mcm9tKSB7XG4gIGZvciAodmFyIGtleSBpbiBfZnJvbSkge1xuICAgIHRvW2tleV0gPSBfZnJvbVtrZXldO1xuICB9XG4gIHJldHVybiB0b1xufVxuXG4vKipcbiAqIE1lcmdlIGFuIEFycmF5IG9mIE9iamVjdHMgaW50byBhIHNpbmdsZSBPYmplY3QuXG4gKi9cbmZ1bmN0aW9uIHRvT2JqZWN0IChhcnIpIHtcbiAgdmFyIHJlcyA9IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhcnJbaV0pIHtcbiAgICAgIGV4dGVuZChyZXMsIGFycltpXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuLyoqXG4gKiBQZXJmb3JtIG5vIG9wZXJhdGlvbi5cbiAqIFN0dWJiaW5nIGFyZ3MgdG8gbWFrZSBGbG93IGhhcHB5IHdpdGhvdXQgbGVhdmluZyB1c2VsZXNzIHRyYW5zcGlsZWQgY29kZVxuICogd2l0aCAuLi5yZXN0IChodHRwczovL2Zsb3cub3JnL2Jsb2cvMjAxNy8wNS8wNy9TdHJpY3QtRnVuY3Rpb24tQ2FsbC1Bcml0eS8pXG4gKi9cbmZ1bmN0aW9uIG5vb3AgKGEsIGIsIGMpIHt9XG5cbi8qKlxuICogQWx3YXlzIHJldHVybiBmYWxzZS5cbiAqL1xudmFyIG5vID0gZnVuY3Rpb24gKGEsIGIsIGMpIHsgcmV0dXJuIGZhbHNlOyB9O1xuXG4vKipcbiAqIFJldHVybiBzYW1lIHZhbHVlXG4gKi9cbnZhciBpZGVudGl0eSA9IGZ1bmN0aW9uIChfKSB7IHJldHVybiBfOyB9O1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgc3RhdGljIGtleXMgc3RyaW5nIGZyb20gY29tcGlsZXIgbW9kdWxlcy5cbiAqL1xuXG5cbi8qKlxuICogQ2hlY2sgaWYgdHdvIHZhbHVlcyBhcmUgbG9vc2VseSBlcXVhbCAtIHRoYXQgaXMsXG4gKiBpZiB0aGV5IGFyZSBwbGFpbiBvYmplY3RzLCBkbyB0aGV5IGhhdmUgdGhlIHNhbWUgc2hhcGU/XG4gKi9cbmZ1bmN0aW9uIGxvb3NlRXF1YWwgKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHsgcmV0dXJuIHRydWUgfVxuICB2YXIgaXNPYmplY3RBID0gaXNPYmplY3QoYSk7XG4gIHZhciBpc09iamVjdEIgPSBpc09iamVjdChiKTtcbiAgaWYgKGlzT2JqZWN0QSAmJiBpc09iamVjdEIpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIGlzQXJyYXlBID0gQXJyYXkuaXNBcnJheShhKTtcbiAgICAgIHZhciBpc0FycmF5QiA9IEFycmF5LmlzQXJyYXkoYik7XG4gICAgICBpZiAoaXNBcnJheUEgJiYgaXNBcnJheUIpIHtcbiAgICAgICAgcmV0dXJuIGEubGVuZ3RoID09PSBiLmxlbmd0aCAmJiBhLmV2ZXJ5KGZ1bmN0aW9uIChlLCBpKSB7XG4gICAgICAgICAgcmV0dXJuIGxvb3NlRXF1YWwoZSwgYltpXSlcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoIWlzQXJyYXlBICYmICFpc0FycmF5Qikge1xuICAgICAgICB2YXIga2V5c0EgPSBPYmplY3Qua2V5cyhhKTtcbiAgICAgICAgdmFyIGtleXNCID0gT2JqZWN0LmtleXMoYik7XG4gICAgICAgIHJldHVybiBrZXlzQS5sZW5ndGggPT09IGtleXNCLmxlbmd0aCAmJiBrZXlzQS5ldmVyeShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgcmV0dXJuIGxvb3NlRXF1YWwoYVtrZXldLCBiW2tleV0pXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9IGVsc2UgaWYgKCFpc09iamVjdEEgJiYgIWlzT2JqZWN0Qikge1xuICAgIHJldHVybiBTdHJpbmcoYSkgPT09IFN0cmluZyhiKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmZ1bmN0aW9uIGxvb3NlSW5kZXhPZiAoYXJyLCB2YWwpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobG9vc2VFcXVhbChhcnJbaV0sIHZhbCkpIHsgcmV0dXJuIGkgfVxuICB9XG4gIHJldHVybiAtMVxufVxuXG4vKipcbiAqIEVuc3VyZSBhIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbmx5IG9uY2UuXG4gKi9cbmZ1bmN0aW9uIG9uY2UgKGZuKSB7XG4gIHZhciBjYWxsZWQgPSBmYWxzZTtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIWNhbGxlZCkge1xuICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG59XG5cbnZhciBTU1JfQVRUUiA9ICdkYXRhLXNlcnZlci1yZW5kZXJlZCc7XG5cbnZhciBBU1NFVF9UWVBFUyA9IFtcbiAgJ2NvbXBvbmVudCcsXG4gICdkaXJlY3RpdmUnLFxuICAnZmlsdGVyJ1xuXTtcblxudmFyIExJRkVDWUNMRV9IT09LUyA9IFtcbiAgJ2JlZm9yZUNyZWF0ZScsXG4gICdjcmVhdGVkJyxcbiAgJ2JlZm9yZU1vdW50JyxcbiAgJ21vdW50ZWQnLFxuICAnYmVmb3JlVXBkYXRlJyxcbiAgJ3VwZGF0ZWQnLFxuICAnYmVmb3JlRGVzdHJveScsXG4gICdkZXN0cm95ZWQnLFxuICAnYWN0aXZhdGVkJyxcbiAgJ2RlYWN0aXZhdGVkJyxcbiAgJ2Vycm9yQ2FwdHVyZWQnXG5dO1xuXG4vKiAgKi9cblxudmFyIGNvbmZpZyA9ICh7XG4gIC8qKlxuICAgKiBPcHRpb24gbWVyZ2Ugc3RyYXRlZ2llcyAodXNlZCBpbiBjb3JlL3V0aWwvb3B0aW9ucylcbiAgICovXG4gIC8vICRmbG93LWRpc2FibGUtbGluZVxuICBvcHRpb25NZXJnZVN0cmF0ZWdpZXM6IE9iamVjdC5jcmVhdGUobnVsbCksXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gc3VwcHJlc3Mgd2FybmluZ3MuXG4gICAqL1xuICBzaWxlbnQ6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBTaG93IHByb2R1Y3Rpb24gbW9kZSB0aXAgbWVzc2FnZSBvbiBib290P1xuICAgKi9cbiAgcHJvZHVjdGlvblRpcDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyxcblxuICAvKipcbiAgICogV2hldGhlciB0byBlbmFibGUgZGV2dG9vbHNcbiAgICovXG4gIGRldnRvb2xzOiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIHJlY29yZCBwZXJmXG4gICAqL1xuICBwZXJmb3JtYW5jZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIEVycm9yIGhhbmRsZXIgZm9yIHdhdGNoZXIgZXJyb3JzXG4gICAqL1xuICBlcnJvckhhbmRsZXI6IG51bGwsXG5cbiAgLyoqXG4gICAqIFdhcm4gaGFuZGxlciBmb3Igd2F0Y2hlciB3YXJuc1xuICAgKi9cbiAgd2FybkhhbmRsZXI6IG51bGwsXG5cbiAgLyoqXG4gICAqIElnbm9yZSBjZXJ0YWluIGN1c3RvbSBlbGVtZW50c1xuICAgKi9cbiAgaWdub3JlZEVsZW1lbnRzOiBbXSxcblxuICAvKipcbiAgICogQ3VzdG9tIHVzZXIga2V5IGFsaWFzZXMgZm9yIHYtb25cbiAgICovXG4gIC8vICRmbG93LWRpc2FibGUtbGluZVxuICBrZXlDb2RlczogT2JqZWN0LmNyZWF0ZShudWxsKSxcblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB0YWcgaXMgcmVzZXJ2ZWQgc28gdGhhdCBpdCBjYW5ub3QgYmUgcmVnaXN0ZXJlZCBhcyBhXG4gICAqIGNvbXBvbmVudC4gVGhpcyBpcyBwbGF0Zm9ybS1kZXBlbmRlbnQgYW5kIG1heSBiZSBvdmVyd3JpdHRlbi5cbiAgICovXG4gIGlzUmVzZXJ2ZWRUYWc6IG5vLFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBhdHRyaWJ1dGUgaXMgcmVzZXJ2ZWQgc28gdGhhdCBpdCBjYW5ub3QgYmUgdXNlZCBhcyBhIGNvbXBvbmVudFxuICAgKiBwcm9wLiBUaGlzIGlzIHBsYXRmb3JtLWRlcGVuZGVudCBhbmQgbWF5IGJlIG92ZXJ3cml0dGVuLlxuICAgKi9cbiAgaXNSZXNlcnZlZEF0dHI6IG5vLFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHRhZyBpcyBhbiB1bmtub3duIGVsZW1lbnQuXG4gICAqIFBsYXRmb3JtLWRlcGVuZGVudC5cbiAgICovXG4gIGlzVW5rbm93bkVsZW1lbnQ6IG5vLFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG5hbWVzcGFjZSBvZiBhbiBlbGVtZW50XG4gICAqL1xuICBnZXRUYWdOYW1lc3BhY2U6IG5vb3AsXG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSByZWFsIHRhZyBuYW1lIGZvciB0aGUgc3BlY2lmaWMgcGxhdGZvcm0uXG4gICAqL1xuICBwYXJzZVBsYXRmb3JtVGFnTmFtZTogaWRlbnRpdHksXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGFuIGF0dHJpYnV0ZSBtdXN0IGJlIGJvdW5kIHVzaW5nIHByb3BlcnR5LCBlLmcuIHZhbHVlXG4gICAqIFBsYXRmb3JtLWRlcGVuZGVudC5cbiAgICovXG4gIG11c3RVc2VQcm9wOiBubyxcblxuICAvKipcbiAgICogRXhwb3NlZCBmb3IgbGVnYWN5IHJlYXNvbnNcbiAgICovXG4gIF9saWZlY3ljbGVIb29rczogTElGRUNZQ0xFX0hPT0tTXG59KTtcblxuLyogICovXG5cbi8qKlxuICogQ2hlY2sgaWYgYSBzdHJpbmcgc3RhcnRzIHdpdGggJCBvciBfXG4gKi9cbmZ1bmN0aW9uIGlzUmVzZXJ2ZWQgKHN0cikge1xuICB2YXIgYyA9IChzdHIgKyAnJykuY2hhckNvZGVBdCgwKTtcbiAgcmV0dXJuIGMgPT09IDB4MjQgfHwgYyA9PT0gMHg1RlxufVxuXG4vKipcbiAqIERlZmluZSBhIHByb3BlcnR5LlxuICovXG5mdW5jdGlvbiBkZWYgKG9iaiwga2V5LCB2YWwsIGVudW1lcmFibGUpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwga2V5LCB7XG4gICAgdmFsdWU6IHZhbCxcbiAgICBlbnVtZXJhYmxlOiAhIWVudW1lcmFibGUsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pO1xufVxuXG4vKipcbiAqIFBhcnNlIHNpbXBsZSBwYXRoLlxuICovXG52YXIgYmFpbFJFID0gL1teXFx3LiRdLztcbmZ1bmN0aW9uIHBhcnNlUGF0aCAocGF0aCkge1xuICBpZiAoYmFpbFJFLnRlc3QocGF0aCkpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgc2VnbWVudHMgPSBwYXRoLnNwbGl0KCcuJyk7XG4gIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFvYmopIHsgcmV0dXJuIH1cbiAgICAgIG9iaiA9IG9ialtzZWdtZW50c1tpXV07XG4gICAgfVxuICAgIHJldHVybiBvYmpcbiAgfVxufVxuXG4vKiAgKi9cblxuXG4vLyBjYW4gd2UgdXNlIF9fcHJvdG9fXz9cbnZhciBoYXNQcm90byA9ICdfX3Byb3RvX18nIGluIHt9O1xuXG4vLyBCcm93c2VyIGVudmlyb25tZW50IHNuaWZmaW5nXG52YXIgaW5Ccm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG52YXIgaW5XZWV4ID0gdHlwZW9mIFdYRW52aXJvbm1lbnQgIT09ICd1bmRlZmluZWQnICYmICEhV1hFbnZpcm9ubWVudC5wbGF0Zm9ybTtcbnZhciB3ZWV4UGxhdGZvcm0gPSBpbldlZXggJiYgV1hFbnZpcm9ubWVudC5wbGF0Zm9ybS50b0xvd2VyQ2FzZSgpO1xudmFyIFVBID0gaW5Ccm93c2VyICYmIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCk7XG52YXIgaXNJRSA9IFVBICYmIC9tc2llfHRyaWRlbnQvLnRlc3QoVUEpO1xudmFyIGlzSUU5ID0gVUEgJiYgVUEuaW5kZXhPZignbXNpZSA5LjAnKSA+IDA7XG52YXIgaXNFZGdlID0gVUEgJiYgVUEuaW5kZXhPZignZWRnZS8nKSA+IDA7XG52YXIgaXNBbmRyb2lkID0gKFVBICYmIFVBLmluZGV4T2YoJ2FuZHJvaWQnKSA+IDApIHx8ICh3ZWV4UGxhdGZvcm0gPT09ICdhbmRyb2lkJyk7XG52YXIgaXNJT1MgPSAoVUEgJiYgL2lwaG9uZXxpcGFkfGlwb2R8aW9zLy50ZXN0KFVBKSkgfHwgKHdlZXhQbGF0Zm9ybSA9PT0gJ2lvcycpO1xudmFyIGlzQ2hyb21lID0gVUEgJiYgL2Nocm9tZVxcL1xcZCsvLnRlc3QoVUEpICYmICFpc0VkZ2U7XG5cbi8vIEZpcmVmb3ggaGFzIGEgXCJ3YXRjaFwiIGZ1bmN0aW9uIG9uIE9iamVjdC5wcm90b3R5cGUuLi5cbnZhciBuYXRpdmVXYXRjaCA9ICh7fSkud2F0Y2g7XG5cblxuaWYgKGluQnJvd3Nlcikge1xuICB0cnkge1xuICAgIHZhciBvcHRzID0ge307XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9wdHMsICdwYXNzaXZlJywgKHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0ICgpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblxuICAgICAgfVxuICAgIH0pKTsgLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL2Zsb3cvaXNzdWVzLzI4NVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0ZXN0LXBhc3NpdmUnLCBudWxsLCBvcHRzKTtcbiAgfSBjYXRjaCAoZSkge31cbn1cblxuLy8gdGhpcyBuZWVkcyB0byBiZSBsYXp5LWV2YWxlZCBiZWNhdXNlIHZ1ZSBtYXkgYmUgcmVxdWlyZWQgYmVmb3JlXG4vLyB2dWUtc2VydmVyLXJlbmRlcmVyIGNhbiBzZXQgVlVFX0VOVlxudmFyIF9pc1NlcnZlcjtcbnZhciBpc1NlcnZlclJlbmRlcmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKF9pc1NlcnZlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCFpbkJyb3dzZXIgJiYgIWluV2VleCAmJiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gZGV0ZWN0IHByZXNlbmNlIG9mIHZ1ZS1zZXJ2ZXItcmVuZGVyZXIgYW5kIGF2b2lkXG4gICAgICAvLyBXZWJwYWNrIHNoaW1taW5nIHRoZSBwcm9jZXNzXG4gICAgICBfaXNTZXJ2ZXIgPSBnbG9iYWxbJ3Byb2Nlc3MnXS5lbnYuVlVFX0VOViA9PT0gJ3NlcnZlcic7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9pc1NlcnZlciA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gX2lzU2VydmVyXG59O1xuXG4vLyBkZXRlY3QgZGV2dG9vbHNcbnZhciBkZXZ0b29scyA9IGluQnJvd3NlciAmJiB3aW5kb3cuX19WVUVfREVWVE9PTFNfR0xPQkFMX0hPT0tfXztcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIGlzTmF0aXZlIChDdG9yKSB7XG4gIHJldHVybiB0eXBlb2YgQ3RvciA9PT0gJ2Z1bmN0aW9uJyAmJiAvbmF0aXZlIGNvZGUvLnRlc3QoQ3Rvci50b1N0cmluZygpKVxufVxuXG52YXIgaGFzU3ltYm9sID1cbiAgdHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgaXNOYXRpdmUoU3ltYm9sKSAmJlxuICB0eXBlb2YgUmVmbGVjdCAhPT0gJ3VuZGVmaW5lZCcgJiYgaXNOYXRpdmUoUmVmbGVjdC5vd25LZXlzKTtcblxudmFyIF9TZXQ7XG4vKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi8gLy8gJGZsb3ctZGlzYWJsZS1saW5lXG5pZiAodHlwZW9mIFNldCAhPT0gJ3VuZGVmaW5lZCcgJiYgaXNOYXRpdmUoU2V0KSkge1xuICAvLyB1c2UgbmF0aXZlIFNldCB3aGVuIGF2YWlsYWJsZS5cbiAgX1NldCA9IFNldDtcbn0gZWxzZSB7XG4gIC8vIGEgbm9uLXN0YW5kYXJkIFNldCBwb2x5ZmlsbCB0aGF0IG9ubHkgd29ya3Mgd2l0aCBwcmltaXRpdmUga2V5cy5cbiAgX1NldCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2V0ICgpIHtcbiAgICAgIHRoaXMuc2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9XG4gICAgU2V0LnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiBoYXMgKGtleSkge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0W2tleV0gPT09IHRydWVcbiAgICB9O1xuICAgIFNldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkIChrZXkpIHtcbiAgICAgIHRoaXMuc2V0W2tleV0gPSB0cnVlO1xuICAgIH07XG4gICAgU2V0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyICgpIHtcbiAgICAgIHRoaXMuc2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFNldDtcbiAgfSgpKTtcbn1cblxuLyogICovXG5cbnZhciB3YXJuID0gbm9vcDtcbnZhciB0aXAgPSBub29wO1xudmFyIGdlbmVyYXRlQ29tcG9uZW50VHJhY2UgPSAobm9vcCk7IC8vIHdvcmsgYXJvdW5kIGZsb3cgY2hlY2tcbnZhciBmb3JtYXRDb21wb25lbnROYW1lID0gKG5vb3ApO1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICB2YXIgaGFzQ29uc29sZSA9IHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJztcbiAgdmFyIGNsYXNzaWZ5UkUgPSAvKD86XnxbLV9dKShcXHcpL2c7XG4gIHZhciBjbGFzc2lmeSA9IGZ1bmN0aW9uIChzdHIpIHsgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlKGNsYXNzaWZ5UkUsIGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLnRvVXBwZXJDYXNlKCk7IH0pXG4gICAgLnJlcGxhY2UoL1stX10vZywgJycpOyB9O1xuXG4gIHdhcm4gPSBmdW5jdGlvbiAobXNnLCB2bSkge1xuICAgIHZhciB0cmFjZSA9IHZtID8gZ2VuZXJhdGVDb21wb25lbnRUcmFjZSh2bSkgOiAnJztcblxuICAgIGlmIChjb25maWcud2FybkhhbmRsZXIpIHtcbiAgICAgIGNvbmZpZy53YXJuSGFuZGxlci5jYWxsKG51bGwsIG1zZywgdm0sIHRyYWNlKTtcbiAgICB9IGVsc2UgaWYgKGhhc0NvbnNvbGUgJiYgKCFjb25maWcuc2lsZW50KSkge1xuICAgICAgY29uc29sZS5lcnJvcigoXCJbVnVlIHdhcm5dOiBcIiArIG1zZyArIHRyYWNlKSk7XG4gICAgfVxuICB9O1xuXG4gIHRpcCA9IGZ1bmN0aW9uIChtc2csIHZtKSB7XG4gICAgaWYgKGhhc0NvbnNvbGUgJiYgKCFjb25maWcuc2lsZW50KSkge1xuICAgICAgY29uc29sZS53YXJuKFwiW1Z1ZSB0aXBdOiBcIiArIG1zZyArIChcbiAgICAgICAgdm0gPyBnZW5lcmF0ZUNvbXBvbmVudFRyYWNlKHZtKSA6ICcnXG4gICAgICApKTtcbiAgICB9XG4gIH07XG5cbiAgZm9ybWF0Q29tcG9uZW50TmFtZSA9IGZ1bmN0aW9uICh2bSwgaW5jbHVkZUZpbGUpIHtcbiAgICBpZiAodm0uJHJvb3QgPT09IHZtKSB7XG4gICAgICByZXR1cm4gJzxSb290PidcbiAgICB9XG4gICAgdmFyIG9wdGlvbnMgPSB0eXBlb2Ygdm0gPT09ICdmdW5jdGlvbicgJiYgdm0uY2lkICE9IG51bGxcbiAgICAgID8gdm0ub3B0aW9uc1xuICAgICAgOiB2bS5faXNWdWVcbiAgICAgICAgPyB2bS4kb3B0aW9ucyB8fCB2bS5jb25zdHJ1Y3Rvci5vcHRpb25zXG4gICAgICAgIDogdm0gfHwge307XG4gICAgdmFyIG5hbWUgPSBvcHRpb25zLm5hbWUgfHwgb3B0aW9ucy5fY29tcG9uZW50VGFnO1xuICAgIHZhciBmaWxlID0gb3B0aW9ucy5fX2ZpbGU7XG4gICAgaWYgKCFuYW1lICYmIGZpbGUpIHtcbiAgICAgIHZhciBtYXRjaCA9IGZpbGUubWF0Y2goLyhbXi9cXFxcXSspXFwudnVlJC8pO1xuICAgICAgbmFtZSA9IG1hdGNoICYmIG1hdGNoWzFdO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICAobmFtZSA/IChcIjxcIiArIChjbGFzc2lmeShuYW1lKSkgKyBcIj5cIikgOiBcIjxBbm9ueW1vdXM+XCIpICtcbiAgICAgIChmaWxlICYmIGluY2x1ZGVGaWxlICE9PSBmYWxzZSA/IChcIiBhdCBcIiArIGZpbGUpIDogJycpXG4gICAgKVxuICB9O1xuXG4gIHZhciByZXBlYXQgPSBmdW5jdGlvbiAoc3RyLCBuKSB7XG4gICAgdmFyIHJlcyA9ICcnO1xuICAgIHdoaWxlIChuKSB7XG4gICAgICBpZiAobiAlIDIgPT09IDEpIHsgcmVzICs9IHN0cjsgfVxuICAgICAgaWYgKG4gPiAxKSB7IHN0ciArPSBzdHI7IH1cbiAgICAgIG4gPj49IDE7XG4gICAgfVxuICAgIHJldHVybiByZXNcbiAgfTtcblxuICBnZW5lcmF0ZUNvbXBvbmVudFRyYWNlID0gZnVuY3Rpb24gKHZtKSB7XG4gICAgaWYgKHZtLl9pc1Z1ZSAmJiB2bS4kcGFyZW50KSB7XG4gICAgICB2YXIgdHJlZSA9IFtdO1xuICAgICAgdmFyIGN1cnJlbnRSZWN1cnNpdmVTZXF1ZW5jZSA9IDA7XG4gICAgICB3aGlsZSAodm0pIHtcbiAgICAgICAgaWYgKHRyZWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHZhciBsYXN0ID0gdHJlZVt0cmVlLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIGlmIChsYXN0LmNvbnN0cnVjdG9yID09PSB2bS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgY3VycmVudFJlY3Vyc2l2ZVNlcXVlbmNlKys7XG4gICAgICAgICAgICB2bSA9IHZtLiRwYXJlbnQ7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudFJlY3Vyc2l2ZVNlcXVlbmNlID4gMCkge1xuICAgICAgICAgICAgdHJlZVt0cmVlLmxlbmd0aCAtIDFdID0gW2xhc3QsIGN1cnJlbnRSZWN1cnNpdmVTZXF1ZW5jZV07XG4gICAgICAgICAgICBjdXJyZW50UmVjdXJzaXZlU2VxdWVuY2UgPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0cmVlLnB1c2godm0pO1xuICAgICAgICB2bSA9IHZtLiRwYXJlbnQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ1xcblxcbmZvdW5kIGluXFxuXFxuJyArIHRyZWVcbiAgICAgICAgLm1hcChmdW5jdGlvbiAodm0sIGkpIHsgcmV0dXJuIChcIlwiICsgKGkgPT09IDAgPyAnLS0tPiAnIDogcmVwZWF0KCcgJywgNSArIGkgKiAyKSkgKyAoQXJyYXkuaXNBcnJheSh2bSlcbiAgICAgICAgICAgID8gKChmb3JtYXRDb21wb25lbnROYW1lKHZtWzBdKSkgKyBcIi4uLiAoXCIgKyAodm1bMV0pICsgXCIgcmVjdXJzaXZlIGNhbGxzKVwiKVxuICAgICAgICAgICAgOiBmb3JtYXRDb21wb25lbnROYW1lKHZtKSkpOyB9KVxuICAgICAgICAuam9pbignXFxuJylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIChcIlxcblxcbihmb3VuZCBpbiBcIiArIChmb3JtYXRDb21wb25lbnROYW1lKHZtKSkgKyBcIilcIilcbiAgICB9XG4gIH07XG59XG5cbi8qICAqL1xuXG5cbnZhciB1aWQkMSA9IDA7XG5cbi8qKlxuICogQSBkZXAgaXMgYW4gb2JzZXJ2YWJsZSB0aGF0IGNhbiBoYXZlIG11bHRpcGxlXG4gKiBkaXJlY3RpdmVzIHN1YnNjcmliaW5nIHRvIGl0LlxuICovXG52YXIgRGVwID0gZnVuY3Rpb24gRGVwICgpIHtcbiAgdGhpcy5pZCA9IHVpZCQxKys7XG4gIHRoaXMuc3VicyA9IFtdO1xufTtcblxuRGVwLnByb3RvdHlwZS5hZGRTdWIgPSBmdW5jdGlvbiBhZGRTdWIgKHN1Yikge1xuICB0aGlzLnN1YnMucHVzaChzdWIpO1xufTtcblxuRGVwLnByb3RvdHlwZS5yZW1vdmVTdWIgPSBmdW5jdGlvbiByZW1vdmVTdWIgKHN1Yikge1xuICByZW1vdmUodGhpcy5zdWJzLCBzdWIpO1xufTtcblxuRGVwLnByb3RvdHlwZS5kZXBlbmQgPSBmdW5jdGlvbiBkZXBlbmQgKCkge1xuICBpZiAoRGVwLnRhcmdldCkge1xuICAgIERlcC50YXJnZXQuYWRkRGVwKHRoaXMpO1xuICB9XG59O1xuXG5EZXAucHJvdG90eXBlLm5vdGlmeSA9IGZ1bmN0aW9uIG5vdGlmeSAoKSB7XG4gIC8vIHN0YWJpbGl6ZSB0aGUgc3Vic2NyaWJlciBsaXN0IGZpcnN0XG4gIHZhciBzdWJzID0gdGhpcy5zdWJzLnNsaWNlKCk7XG4gIGZvciAodmFyIGkgPSAwLCBsID0gc3Vicy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBzdWJzW2ldLnVwZGF0ZSgpO1xuICB9XG59O1xuXG4vLyB0aGUgY3VycmVudCB0YXJnZXQgd2F0Y2hlciBiZWluZyBldmFsdWF0ZWQuXG4vLyB0aGlzIGlzIGdsb2JhbGx5IHVuaXF1ZSBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG9ubHkgb25lXG4vLyB3YXRjaGVyIGJlaW5nIGV2YWx1YXRlZCBhdCBhbnkgdGltZS5cbkRlcC50YXJnZXQgPSBudWxsO1xudmFyIHRhcmdldFN0YWNrID0gW107XG5cbmZ1bmN0aW9uIHB1c2hUYXJnZXQgKF90YXJnZXQpIHtcbiAgaWYgKERlcC50YXJnZXQpIHsgdGFyZ2V0U3RhY2sucHVzaChEZXAudGFyZ2V0KTsgfVxuICBEZXAudGFyZ2V0ID0gX3RhcmdldDtcbn1cblxuZnVuY3Rpb24gcG9wVGFyZ2V0ICgpIHtcbiAgRGVwLnRhcmdldCA9IHRhcmdldFN0YWNrLnBvcCgpO1xufVxuXG4vKiAgKi9cblxudmFyIFZOb2RlID0gZnVuY3Rpb24gVk5vZGUgKFxuICB0YWcsXG4gIGRhdGEsXG4gIGNoaWxkcmVuLFxuICB0ZXh0LFxuICBlbG0sXG4gIGNvbnRleHQsXG4gIGNvbXBvbmVudE9wdGlvbnMsXG4gIGFzeW5jRmFjdG9yeVxuKSB7XG4gIHRoaXMudGFnID0gdGFnO1xuICB0aGlzLmRhdGEgPSBkYXRhO1xuICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIHRoaXMudGV4dCA9IHRleHQ7XG4gIHRoaXMuZWxtID0gZWxtO1xuICB0aGlzLm5zID0gdW5kZWZpbmVkO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLmZuQ29udGV4dCA9IHVuZGVmaW5lZDtcbiAgdGhpcy5mbk9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gIHRoaXMuZm5TY29wZUlkID0gdW5kZWZpbmVkO1xuICB0aGlzLmtleSA9IGRhdGEgJiYgZGF0YS5rZXk7XG4gIHRoaXMuY29tcG9uZW50T3B0aW9ucyA9IGNvbXBvbmVudE9wdGlvbnM7XG4gIHRoaXMuY29tcG9uZW50SW5zdGFuY2UgPSB1bmRlZmluZWQ7XG4gIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICB0aGlzLnJhdyA9IGZhbHNlO1xuICB0aGlzLmlzU3RhdGljID0gZmFsc2U7XG4gIHRoaXMuaXNSb290SW5zZXJ0ID0gdHJ1ZTtcbiAgdGhpcy5pc0NvbW1lbnQgPSBmYWxzZTtcbiAgdGhpcy5pc0Nsb25lZCA9IGZhbHNlO1xuICB0aGlzLmlzT25jZSA9IGZhbHNlO1xuICB0aGlzLmFzeW5jRmFjdG9yeSA9IGFzeW5jRmFjdG9yeTtcbiAgdGhpcy5hc3luY01ldGEgPSB1bmRlZmluZWQ7XG4gIHRoaXMuaXNBc3luY1BsYWNlaG9sZGVyID0gZmFsc2U7XG59O1xuXG52YXIgcHJvdG90eXBlQWNjZXNzb3JzID0geyBjaGlsZDogeyBjb25maWd1cmFibGU6IHRydWUgfSB9O1xuXG4vLyBERVBSRUNBVEVEOiBhbGlhcyBmb3IgY29tcG9uZW50SW5zdGFuY2UgZm9yIGJhY2t3YXJkcyBjb21wYXQuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xucHJvdG90eXBlQWNjZXNzb3JzLmNoaWxkLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuY29tcG9uZW50SW5zdGFuY2Vcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCBWTm9kZS5wcm90b3R5cGUsIHByb3RvdHlwZUFjY2Vzc29ycyApO1xuXG52YXIgY3JlYXRlRW1wdHlWTm9kZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gIGlmICggdGV4dCA9PT0gdm9pZCAwICkgdGV4dCA9ICcnO1xuXG4gIHZhciBub2RlID0gbmV3IFZOb2RlKCk7XG4gIG5vZGUudGV4dCA9IHRleHQ7XG4gIG5vZGUuaXNDb21tZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIG5vZGVcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVRleHRWTm9kZSAodmFsKSB7XG4gIHJldHVybiBuZXcgVk5vZGUodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgU3RyaW5nKHZhbCkpXG59XG5cbi8vIG9wdGltaXplZCBzaGFsbG93IGNsb25lXG4vLyB1c2VkIGZvciBzdGF0aWMgbm9kZXMgYW5kIHNsb3Qgbm9kZXMgYmVjYXVzZSB0aGV5IG1heSBiZSByZXVzZWQgYWNyb3NzXG4vLyBtdWx0aXBsZSByZW5kZXJzLCBjbG9uaW5nIHRoZW0gYXZvaWRzIGVycm9ycyB3aGVuIERPTSBtYW5pcHVsYXRpb25zIHJlbHlcbi8vIG9uIHRoZWlyIGVsbSByZWZlcmVuY2UuXG5mdW5jdGlvbiBjbG9uZVZOb2RlICh2bm9kZSwgZGVlcCkge1xuICB2YXIgY29tcG9uZW50T3B0aW9ucyA9IHZub2RlLmNvbXBvbmVudE9wdGlvbnM7XG4gIHZhciBjbG9uZWQgPSBuZXcgVk5vZGUoXG4gICAgdm5vZGUudGFnLFxuICAgIHZub2RlLmRhdGEsXG4gICAgdm5vZGUuY2hpbGRyZW4sXG4gICAgdm5vZGUudGV4dCxcbiAgICB2bm9kZS5lbG0sXG4gICAgdm5vZGUuY29udGV4dCxcbiAgICBjb21wb25lbnRPcHRpb25zLFxuICAgIHZub2RlLmFzeW5jRmFjdG9yeVxuICApO1xuICBjbG9uZWQubnMgPSB2bm9kZS5ucztcbiAgY2xvbmVkLmlzU3RhdGljID0gdm5vZGUuaXNTdGF0aWM7XG4gIGNsb25lZC5rZXkgPSB2bm9kZS5rZXk7XG4gIGNsb25lZC5pc0NvbW1lbnQgPSB2bm9kZS5pc0NvbW1lbnQ7XG4gIGNsb25lZC5mbkNvbnRleHQgPSB2bm9kZS5mbkNvbnRleHQ7XG4gIGNsb25lZC5mbk9wdGlvbnMgPSB2bm9kZS5mbk9wdGlvbnM7XG4gIGNsb25lZC5mblNjb3BlSWQgPSB2bm9kZS5mblNjb3BlSWQ7XG4gIGNsb25lZC5pc0Nsb25lZCA9IHRydWU7XG4gIGlmIChkZWVwKSB7XG4gICAgaWYgKHZub2RlLmNoaWxkcmVuKSB7XG4gICAgICBjbG9uZWQuY2hpbGRyZW4gPSBjbG9uZVZOb2Rlcyh2bm9kZS5jaGlsZHJlbiwgdHJ1ZSk7XG4gICAgfVxuICAgIGlmIChjb21wb25lbnRPcHRpb25zICYmIGNvbXBvbmVudE9wdGlvbnMuY2hpbGRyZW4pIHtcbiAgICAgIGNvbXBvbmVudE9wdGlvbnMuY2hpbGRyZW4gPSBjbG9uZVZOb2Rlcyhjb21wb25lbnRPcHRpb25zLmNoaWxkcmVuLCB0cnVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNsb25lZFxufVxuXG5mdW5jdGlvbiBjbG9uZVZOb2RlcyAodm5vZGVzLCBkZWVwKSB7XG4gIHZhciBsZW4gPSB2bm9kZXMubGVuZ3RoO1xuICB2YXIgcmVzID0gbmV3IEFycmF5KGxlbik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICByZXNbaV0gPSBjbG9uZVZOb2RlKHZub2Rlc1tpXSwgZGVlcCk7XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG4vKlxuICogbm90IHR5cGUgY2hlY2tpbmcgdGhpcyBmaWxlIGJlY2F1c2UgZmxvdyBkb2Vzbid0IHBsYXkgd2VsbCB3aXRoXG4gKiBkeW5hbWljYWxseSBhY2Nlc3NpbmcgbWV0aG9kcyBvbiBBcnJheSBwcm90b3R5cGVcbiAqL1xuXG52YXIgYXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcbnZhciBhcnJheU1ldGhvZHMgPSBPYmplY3QuY3JlYXRlKGFycmF5UHJvdG8pO1tcbiAgJ3B1c2gnLFxuICAncG9wJyxcbiAgJ3NoaWZ0JyxcbiAgJ3Vuc2hpZnQnLFxuICAnc3BsaWNlJyxcbiAgJ3NvcnQnLFxuICAncmV2ZXJzZSdcbl0uZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gIC8vIGNhY2hlIG9yaWdpbmFsIG1ldGhvZFxuICB2YXIgb3JpZ2luYWwgPSBhcnJheVByb3RvW21ldGhvZF07XG4gIGRlZihhcnJheU1ldGhvZHMsIG1ldGhvZCwgZnVuY3Rpb24gbXV0YXRvciAoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICB3aGlsZSAoIGxlbi0tICkgYXJnc1sgbGVuIF0gPSBhcmd1bWVudHNbIGxlbiBdO1xuXG4gICAgdmFyIHJlc3VsdCA9IG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIHZhciBvYiA9IHRoaXMuX19vYl9fO1xuICAgIHZhciBpbnNlcnRlZDtcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgY2FzZSAncHVzaCc6XG4gICAgICBjYXNlICd1bnNoaWZ0JzpcbiAgICAgICAgaW5zZXJ0ZWQgPSBhcmdzO1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnc3BsaWNlJzpcbiAgICAgICAgaW5zZXJ0ZWQgPSBhcmdzLnNsaWNlKDIpO1xuICAgICAgICBicmVha1xuICAgIH1cbiAgICBpZiAoaW5zZXJ0ZWQpIHsgb2Iub2JzZXJ2ZUFycmF5KGluc2VydGVkKTsgfVxuICAgIC8vIG5vdGlmeSBjaGFuZ2VcbiAgICBvYi5kZXAubm90aWZ5KCk7XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9KTtcbn0pO1xuXG4vKiAgKi9cblxudmFyIGFycmF5S2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGFycmF5TWV0aG9kcyk7XG5cbi8qKlxuICogQnkgZGVmYXVsdCwgd2hlbiBhIHJlYWN0aXZlIHByb3BlcnR5IGlzIHNldCwgdGhlIG5ldyB2YWx1ZSBpc1xuICogYWxzbyBjb252ZXJ0ZWQgdG8gYmVjb21lIHJlYWN0aXZlLiBIb3dldmVyIHdoZW4gcGFzc2luZyBkb3duIHByb3BzLFxuICogd2UgZG9uJ3Qgd2FudCB0byBmb3JjZSBjb252ZXJzaW9uIGJlY2F1c2UgdGhlIHZhbHVlIG1heSBiZSBhIG5lc3RlZCB2YWx1ZVxuICogdW5kZXIgYSBmcm96ZW4gZGF0YSBzdHJ1Y3R1cmUuIENvbnZlcnRpbmcgaXQgd291bGQgZGVmZWF0IHRoZSBvcHRpbWl6YXRpb24uXG4gKi9cbnZhciBvYnNlcnZlclN0YXRlID0ge1xuICBzaG91bGRDb252ZXJ0OiB0cnVlXG59O1xuXG4vKipcbiAqIE9ic2VydmVyIGNsYXNzIHRoYXQgYXJlIGF0dGFjaGVkIHRvIGVhY2ggb2JzZXJ2ZWRcbiAqIG9iamVjdC4gT25jZSBhdHRhY2hlZCwgdGhlIG9ic2VydmVyIGNvbnZlcnRzIHRhcmdldFxuICogb2JqZWN0J3MgcHJvcGVydHkga2V5cyBpbnRvIGdldHRlci9zZXR0ZXJzIHRoYXRcbiAqIGNvbGxlY3QgZGVwZW5kZW5jaWVzIGFuZCBkaXNwYXRjaGVzIHVwZGF0ZXMuXG4gKi9cbnZhciBPYnNlcnZlciA9IGZ1bmN0aW9uIE9ic2VydmVyICh2YWx1ZSkge1xuICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIHRoaXMuZGVwID0gbmV3IERlcCgpO1xuICB0aGlzLnZtQ291bnQgPSAwO1xuICBkZWYodmFsdWUsICdfX29iX18nLCB0aGlzKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgdmFyIGF1Z21lbnQgPSBoYXNQcm90b1xuICAgICAgPyBwcm90b0F1Z21lbnRcbiAgICAgIDogY29weUF1Z21lbnQ7XG4gICAgYXVnbWVudCh2YWx1ZSwgYXJyYXlNZXRob2RzLCBhcnJheUtleXMpO1xuICAgIHRoaXMub2JzZXJ2ZUFycmF5KHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLndhbGsodmFsdWUpO1xuICB9XG59O1xuXG4vKipcbiAqIFdhbGsgdGhyb3VnaCBlYWNoIHByb3BlcnR5IGFuZCBjb252ZXJ0IHRoZW0gaW50b1xuICogZ2V0dGVyL3NldHRlcnMuIFRoaXMgbWV0aG9kIHNob3VsZCBvbmx5IGJlIGNhbGxlZCB3aGVuXG4gKiB2YWx1ZSB0eXBlIGlzIE9iamVjdC5cbiAqL1xuT2JzZXJ2ZXIucHJvdG90eXBlLndhbGsgPSBmdW5jdGlvbiB3YWxrIChvYmopIHtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBkZWZpbmVSZWFjdGl2ZShvYmosIGtleXNbaV0sIG9ialtrZXlzW2ldXSk7XG4gIH1cbn07XG5cbi8qKlxuICogT2JzZXJ2ZSBhIGxpc3Qgb2YgQXJyYXkgaXRlbXMuXG4gKi9cbk9ic2VydmVyLnByb3RvdHlwZS5vYnNlcnZlQXJyYXkgPSBmdW5jdGlvbiBvYnNlcnZlQXJyYXkgKGl0ZW1zKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsID0gaXRlbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgb2JzZXJ2ZShpdGVtc1tpXSk7XG4gIH1cbn07XG5cbi8vIGhlbHBlcnNcblxuLyoqXG4gKiBBdWdtZW50IGFuIHRhcmdldCBPYmplY3Qgb3IgQXJyYXkgYnkgaW50ZXJjZXB0aW5nXG4gKiB0aGUgcHJvdG90eXBlIGNoYWluIHVzaW5nIF9fcHJvdG9fX1xuICovXG5mdW5jdGlvbiBwcm90b0F1Z21lbnQgKHRhcmdldCwgc3JjLCBrZXlzKSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG4gIHRhcmdldC5fX3Byb3RvX18gPSBzcmM7XG4gIC8qIGVzbGludC1lbmFibGUgbm8tcHJvdG8gKi9cbn1cblxuLyoqXG4gKiBBdWdtZW50IGFuIHRhcmdldCBPYmplY3Qgb3IgQXJyYXkgYnkgZGVmaW5pbmdcbiAqIGhpZGRlbiBwcm9wZXJ0aWVzLlxuICovXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gY29weUF1Z21lbnQgKHRhcmdldCwgc3JjLCBrZXlzKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsID0ga2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICBkZWYodGFyZ2V0LCBrZXksIHNyY1trZXldKTtcbiAgfVxufVxuXG4vKipcbiAqIEF0dGVtcHQgdG8gY3JlYXRlIGFuIG9ic2VydmVyIGluc3RhbmNlIGZvciBhIHZhbHVlLFxuICogcmV0dXJucyB0aGUgbmV3IG9ic2VydmVyIGlmIHN1Y2Nlc3NmdWxseSBvYnNlcnZlZCxcbiAqIG9yIHRoZSBleGlzdGluZyBvYnNlcnZlciBpZiB0aGUgdmFsdWUgYWxyZWFkeSBoYXMgb25lLlxuICovXG5mdW5jdGlvbiBvYnNlcnZlICh2YWx1ZSwgYXNSb290RGF0YSkge1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSB8fCB2YWx1ZSBpbnN0YW5jZW9mIFZOb2RlKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIG9iO1xuICBpZiAoaGFzT3duKHZhbHVlLCAnX19vYl9fJykgJiYgdmFsdWUuX19vYl9fIGluc3RhbmNlb2YgT2JzZXJ2ZXIpIHtcbiAgICBvYiA9IHZhbHVlLl9fb2JfXztcbiAgfSBlbHNlIGlmIChcbiAgICBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQgJiZcbiAgICAhaXNTZXJ2ZXJSZW5kZXJpbmcoKSAmJlxuICAgIChBcnJheS5pc0FycmF5KHZhbHVlKSB8fCBpc1BsYWluT2JqZWN0KHZhbHVlKSkgJiZcbiAgICBPYmplY3QuaXNFeHRlbnNpYmxlKHZhbHVlKSAmJlxuICAgICF2YWx1ZS5faXNWdWVcbiAgKSB7XG4gICAgb2IgPSBuZXcgT2JzZXJ2ZXIodmFsdWUpO1xuICB9XG4gIGlmIChhc1Jvb3REYXRhICYmIG9iKSB7XG4gICAgb2Iudm1Db3VudCsrO1xuICB9XG4gIHJldHVybiBvYlxufVxuXG4vKipcbiAqIERlZmluZSBhIHJlYWN0aXZlIHByb3BlcnR5IG9uIGFuIE9iamVjdC5cbiAqL1xuZnVuY3Rpb24gZGVmaW5lUmVhY3RpdmUgKFxuICBvYmosXG4gIGtleSxcbiAgdmFsLFxuICBjdXN0b21TZXR0ZXIsXG4gIHNoYWxsb3dcbikge1xuICB2YXIgZGVwID0gbmV3IERlcCgpO1xuXG4gIHZhciBwcm9wZXJ0eSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpO1xuICBpZiAocHJvcGVydHkgJiYgcHJvcGVydHkuY29uZmlndXJhYmxlID09PSBmYWxzZSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy8gY2F0ZXIgZm9yIHByZS1kZWZpbmVkIGdldHRlci9zZXR0ZXJzXG4gIHZhciBnZXR0ZXIgPSBwcm9wZXJ0eSAmJiBwcm9wZXJ0eS5nZXQ7XG4gIHZhciBzZXR0ZXIgPSBwcm9wZXJ0eSAmJiBwcm9wZXJ0eS5zZXQ7XG5cbiAgdmFyIGNoaWxkT2IgPSAhc2hhbGxvdyAmJiBvYnNlcnZlKHZhbCk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24gcmVhY3RpdmVHZXR0ZXIgKCkge1xuICAgICAgdmFyIHZhbHVlID0gZ2V0dGVyID8gZ2V0dGVyLmNhbGwob2JqKSA6IHZhbDtcbiAgICAgIGlmIChEZXAudGFyZ2V0KSB7XG4gICAgICAgIGRlcC5kZXBlbmQoKTtcbiAgICAgICAgaWYgKGNoaWxkT2IpIHtcbiAgICAgICAgICBjaGlsZE9iLmRlcC5kZXBlbmQoKTtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGRlcGVuZEFycmF5KHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiByZWFjdGl2ZVNldHRlciAobmV3VmFsKSB7XG4gICAgICB2YXIgdmFsdWUgPSBnZXR0ZXIgPyBnZXR0ZXIuY2FsbChvYmopIDogdmFsO1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tc2VsZi1jb21wYXJlICovXG4gICAgICBpZiAobmV3VmFsID09PSB2YWx1ZSB8fCAobmV3VmFsICE9PSBuZXdWYWwgJiYgdmFsdWUgIT09IHZhbHVlKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tc2VsZi1jb21wYXJlICovXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBjdXN0b21TZXR0ZXIpIHtcbiAgICAgICAgY3VzdG9tU2V0dGVyKCk7XG4gICAgICB9XG4gICAgICBpZiAoc2V0dGVyKSB7XG4gICAgICAgIHNldHRlci5jYWxsKG9iaiwgbmV3VmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbCA9IG5ld1ZhbDtcbiAgICAgIH1cbiAgICAgIGNoaWxkT2IgPSAhc2hhbGxvdyAmJiBvYnNlcnZlKG5ld1ZhbCk7XG4gICAgICBkZXAubm90aWZ5KCk7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBTZXQgYSBwcm9wZXJ0eSBvbiBhbiBvYmplY3QuIEFkZHMgdGhlIG5ldyBwcm9wZXJ0eSBhbmRcbiAqIHRyaWdnZXJzIGNoYW5nZSBub3RpZmljYXRpb24gaWYgdGhlIHByb3BlcnR5IGRvZXNuJ3RcbiAqIGFscmVhZHkgZXhpc3QuXG4gKi9cbmZ1bmN0aW9uIHNldCAodGFyZ2V0LCBrZXksIHZhbCkge1xuICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQpICYmIGlzVmFsaWRBcnJheUluZGV4KGtleSkpIHtcbiAgICB0YXJnZXQubGVuZ3RoID0gTWF0aC5tYXgodGFyZ2V0Lmxlbmd0aCwga2V5KTtcbiAgICB0YXJnZXQuc3BsaWNlKGtleSwgMSwgdmFsKTtcbiAgICByZXR1cm4gdmFsXG4gIH1cbiAgaWYgKGtleSBpbiB0YXJnZXQgJiYgIShrZXkgaW4gT2JqZWN0LnByb3RvdHlwZSkpIHtcbiAgICB0YXJnZXRba2V5XSA9IHZhbDtcbiAgICByZXR1cm4gdmFsXG4gIH1cbiAgdmFyIG9iID0gKHRhcmdldCkuX19vYl9fO1xuICBpZiAodGFyZ2V0Ll9pc1Z1ZSB8fCAob2IgJiYgb2Iudm1Db3VudCkpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAnQXZvaWQgYWRkaW5nIHJlYWN0aXZlIHByb3BlcnRpZXMgdG8gYSBWdWUgaW5zdGFuY2Ugb3IgaXRzIHJvb3QgJGRhdGEgJyArXG4gICAgICAnYXQgcnVudGltZSAtIGRlY2xhcmUgaXQgdXBmcm9udCBpbiB0aGUgZGF0YSBvcHRpb24uJ1xuICAgICk7XG4gICAgcmV0dXJuIHZhbFxuICB9XG4gIGlmICghb2IpIHtcbiAgICB0YXJnZXRba2V5XSA9IHZhbDtcbiAgICByZXR1cm4gdmFsXG4gIH1cbiAgZGVmaW5lUmVhY3RpdmUob2IudmFsdWUsIGtleSwgdmFsKTtcbiAgb2IuZGVwLm5vdGlmeSgpO1xuICByZXR1cm4gdmFsXG59XG5cbi8qKlxuICogRGVsZXRlIGEgcHJvcGVydHkgYW5kIHRyaWdnZXIgY2hhbmdlIGlmIG5lY2Vzc2FyeS5cbiAqL1xuZnVuY3Rpb24gZGVsICh0YXJnZXQsIGtleSkge1xuICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQpICYmIGlzVmFsaWRBcnJheUluZGV4KGtleSkpIHtcbiAgICB0YXJnZXQuc3BsaWNlKGtleSwgMSk7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIG9iID0gKHRhcmdldCkuX19vYl9fO1xuICBpZiAodGFyZ2V0Ll9pc1Z1ZSB8fCAob2IgJiYgb2Iudm1Db3VudCkpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAnQXZvaWQgZGVsZXRpbmcgcHJvcGVydGllcyBvbiBhIFZ1ZSBpbnN0YW5jZSBvciBpdHMgcm9vdCAkZGF0YSAnICtcbiAgICAgICctIGp1c3Qgc2V0IGl0IHRvIG51bGwuJ1xuICAgICk7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKCFoYXNPd24odGFyZ2V0LCBrZXkpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgZGVsZXRlIHRhcmdldFtrZXldO1xuICBpZiAoIW9iKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgb2IuZGVwLm5vdGlmeSgpO1xufVxuXG4vKipcbiAqIENvbGxlY3QgZGVwZW5kZW5jaWVzIG9uIGFycmF5IGVsZW1lbnRzIHdoZW4gdGhlIGFycmF5IGlzIHRvdWNoZWQsIHNpbmNlXG4gKiB3ZSBjYW5ub3QgaW50ZXJjZXB0IGFycmF5IGVsZW1lbnQgYWNjZXNzIGxpa2UgcHJvcGVydHkgZ2V0dGVycy5cbiAqL1xuZnVuY3Rpb24gZGVwZW5kQXJyYXkgKHZhbHVlKSB7XG4gIGZvciAodmFyIGUgPSAodm9pZCAwKSwgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBlID0gdmFsdWVbaV07XG4gICAgZSAmJiBlLl9fb2JfXyAmJiBlLl9fb2JfXy5kZXAuZGVwZW5kKCk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZSkpIHtcbiAgICAgIGRlcGVuZEFycmF5KGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiAgKi9cblxuLyoqXG4gKiBPcHRpb24gb3ZlcndyaXRpbmcgc3RyYXRlZ2llcyBhcmUgZnVuY3Rpb25zIHRoYXQgaGFuZGxlXG4gKiBob3cgdG8gbWVyZ2UgYSBwYXJlbnQgb3B0aW9uIHZhbHVlIGFuZCBhIGNoaWxkIG9wdGlvblxuICogdmFsdWUgaW50byB0aGUgZmluYWwgdmFsdWUuXG4gKi9cbnZhciBzdHJhdHMgPSBjb25maWcub3B0aW9uTWVyZ2VTdHJhdGVnaWVzO1xuXG4vKipcbiAqIE9wdGlvbnMgd2l0aCByZXN0cmljdGlvbnNcbiAqL1xuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgc3RyYXRzLmVsID0gc3RyYXRzLnByb3BzRGF0YSA9IGZ1bmN0aW9uIChwYXJlbnQsIGNoaWxkLCB2bSwga2V5KSB7XG4gICAgaWYgKCF2bSkge1xuICAgICAgd2FybihcbiAgICAgICAgXCJvcHRpb24gXFxcIlwiICsga2V5ICsgXCJcXFwiIGNhbiBvbmx5IGJlIHVzZWQgZHVyaW5nIGluc3RhbmNlIFwiICtcbiAgICAgICAgJ2NyZWF0aW9uIHdpdGggdGhlIGBuZXdgIGtleXdvcmQuJ1xuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRTdHJhdChwYXJlbnQsIGNoaWxkKVxuICB9O1xufVxuXG4vKipcbiAqIEhlbHBlciB0aGF0IHJlY3Vyc2l2ZWx5IG1lcmdlcyB0d28gZGF0YSBvYmplY3RzIHRvZ2V0aGVyLlxuICovXG5mdW5jdGlvbiBtZXJnZURhdGEgKHRvLCBmcm9tKSB7XG4gIGlmICghZnJvbSkgeyByZXR1cm4gdG8gfVxuICB2YXIga2V5LCB0b1ZhbCwgZnJvbVZhbDtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhmcm9tKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0ga2V5c1tpXTtcbiAgICB0b1ZhbCA9IHRvW2tleV07XG4gICAgZnJvbVZhbCA9IGZyb21ba2V5XTtcbiAgICBpZiAoIWhhc093bih0bywga2V5KSkge1xuICAgICAgc2V0KHRvLCBrZXksIGZyb21WYWwpO1xuICAgIH0gZWxzZSBpZiAoaXNQbGFpbk9iamVjdCh0b1ZhbCkgJiYgaXNQbGFpbk9iamVjdChmcm9tVmFsKSkge1xuICAgICAgbWVyZ2VEYXRhKHRvVmFsLCBmcm9tVmFsKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRvXG59XG5cbi8qKlxuICogRGF0YVxuICovXG5mdW5jdGlvbiBtZXJnZURhdGFPckZuIChcbiAgcGFyZW50VmFsLFxuICBjaGlsZFZhbCxcbiAgdm1cbikge1xuICBpZiAoIXZtKSB7XG4gICAgLy8gaW4gYSBWdWUuZXh0ZW5kIG1lcmdlLCBib3RoIHNob3VsZCBiZSBmdW5jdGlvbnNcbiAgICBpZiAoIWNoaWxkVmFsKSB7XG4gICAgICByZXR1cm4gcGFyZW50VmFsXG4gICAgfVxuICAgIGlmICghcGFyZW50VmFsKSB7XG4gICAgICByZXR1cm4gY2hpbGRWYWxcbiAgICB9XG4gICAgLy8gd2hlbiBwYXJlbnRWYWwgJiBjaGlsZFZhbCBhcmUgYm90aCBwcmVzZW50LFxuICAgIC8vIHdlIG5lZWQgdG8gcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZVxuICAgIC8vIG1lcmdlZCByZXN1bHQgb2YgYm90aCBmdW5jdGlvbnMuLi4gbm8gbmVlZCB0b1xuICAgIC8vIGNoZWNrIGlmIHBhcmVudFZhbCBpcyBhIGZ1bmN0aW9uIGhlcmUgYmVjYXVzZVxuICAgIC8vIGl0IGhhcyB0byBiZSBhIGZ1bmN0aW9uIHRvIHBhc3MgcHJldmlvdXMgbWVyZ2VzLlxuICAgIHJldHVybiBmdW5jdGlvbiBtZXJnZWREYXRhRm4gKCkge1xuICAgICAgcmV0dXJuIG1lcmdlRGF0YShcbiAgICAgICAgdHlwZW9mIGNoaWxkVmFsID09PSAnZnVuY3Rpb24nID8gY2hpbGRWYWwuY2FsbCh0aGlzLCB0aGlzKSA6IGNoaWxkVmFsLFxuICAgICAgICB0eXBlb2YgcGFyZW50VmFsID09PSAnZnVuY3Rpb24nID8gcGFyZW50VmFsLmNhbGwodGhpcywgdGhpcykgOiBwYXJlbnRWYWxcbiAgICAgIClcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1lcmdlZEluc3RhbmNlRGF0YUZuICgpIHtcbiAgICAgIC8vIGluc3RhbmNlIG1lcmdlXG4gICAgICB2YXIgaW5zdGFuY2VEYXRhID0gdHlwZW9mIGNoaWxkVmFsID09PSAnZnVuY3Rpb24nXG4gICAgICAgID8gY2hpbGRWYWwuY2FsbCh2bSwgdm0pXG4gICAgICAgIDogY2hpbGRWYWw7XG4gICAgICB2YXIgZGVmYXVsdERhdGEgPSB0eXBlb2YgcGFyZW50VmFsID09PSAnZnVuY3Rpb24nXG4gICAgICAgID8gcGFyZW50VmFsLmNhbGwodm0sIHZtKVxuICAgICAgICA6IHBhcmVudFZhbDtcbiAgICAgIGlmIChpbnN0YW5jZURhdGEpIHtcbiAgICAgICAgcmV0dXJuIG1lcmdlRGF0YShpbnN0YW5jZURhdGEsIGRlZmF1bHREYXRhKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHREYXRhXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbnN0cmF0cy5kYXRhID0gZnVuY3Rpb24gKFxuICBwYXJlbnRWYWwsXG4gIGNoaWxkVmFsLFxuICB2bVxuKSB7XG4gIGlmICghdm0pIHtcbiAgICBpZiAoY2hpbGRWYWwgJiYgdHlwZW9mIGNoaWxkVmFsICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAgICdUaGUgXCJkYXRhXCIgb3B0aW9uIHNob3VsZCBiZSBhIGZ1bmN0aW9uICcgK1xuICAgICAgICAndGhhdCByZXR1cm5zIGEgcGVyLWluc3RhbmNlIHZhbHVlIGluIGNvbXBvbmVudCAnICtcbiAgICAgICAgJ2RlZmluaXRpb25zLicsXG4gICAgICAgIHZtXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gcGFyZW50VmFsXG4gICAgfVxuICAgIHJldHVybiBtZXJnZURhdGFPckZuKHBhcmVudFZhbCwgY2hpbGRWYWwpXG4gIH1cblxuICByZXR1cm4gbWVyZ2VEYXRhT3JGbihwYXJlbnRWYWwsIGNoaWxkVmFsLCB2bSlcbn07XG5cbi8qKlxuICogSG9va3MgYW5kIHByb3BzIGFyZSBtZXJnZWQgYXMgYXJyYXlzLlxuICovXG5mdW5jdGlvbiBtZXJnZUhvb2sgKFxuICBwYXJlbnRWYWwsXG4gIGNoaWxkVmFsXG4pIHtcbiAgcmV0dXJuIGNoaWxkVmFsXG4gICAgPyBwYXJlbnRWYWxcbiAgICAgID8gcGFyZW50VmFsLmNvbmNhdChjaGlsZFZhbClcbiAgICAgIDogQXJyYXkuaXNBcnJheShjaGlsZFZhbClcbiAgICAgICAgPyBjaGlsZFZhbFxuICAgICAgICA6IFtjaGlsZFZhbF1cbiAgICA6IHBhcmVudFZhbFxufVxuXG5MSUZFQ1lDTEVfSE9PS1MuZm9yRWFjaChmdW5jdGlvbiAoaG9vaykge1xuICBzdHJhdHNbaG9va10gPSBtZXJnZUhvb2s7XG59KTtcblxuLyoqXG4gKiBBc3NldHNcbiAqXG4gKiBXaGVuIGEgdm0gaXMgcHJlc2VudCAoaW5zdGFuY2UgY3JlYXRpb24pLCB3ZSBuZWVkIHRvIGRvXG4gKiBhIHRocmVlLXdheSBtZXJnZSBiZXR3ZWVuIGNvbnN0cnVjdG9yIG9wdGlvbnMsIGluc3RhbmNlXG4gKiBvcHRpb25zIGFuZCBwYXJlbnQgb3B0aW9ucy5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VBc3NldHMgKFxuICBwYXJlbnRWYWwsXG4gIGNoaWxkVmFsLFxuICB2bSxcbiAga2V5XG4pIHtcbiAgdmFyIHJlcyA9IE9iamVjdC5jcmVhdGUocGFyZW50VmFsIHx8IG51bGwpO1xuICBpZiAoY2hpbGRWYWwpIHtcbiAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGFzc2VydE9iamVjdFR5cGUoa2V5LCBjaGlsZFZhbCwgdm0pO1xuICAgIHJldHVybiBleHRlbmQocmVzLCBjaGlsZFZhbClcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcmVzXG4gIH1cbn1cblxuQVNTRVRfVFlQRVMuZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICBzdHJhdHNbdHlwZSArICdzJ10gPSBtZXJnZUFzc2V0cztcbn0pO1xuXG4vKipcbiAqIFdhdGNoZXJzLlxuICpcbiAqIFdhdGNoZXJzIGhhc2hlcyBzaG91bGQgbm90IG92ZXJ3cml0ZSBvbmVcbiAqIGFub3RoZXIsIHNvIHdlIG1lcmdlIHRoZW0gYXMgYXJyYXlzLlxuICovXG5zdHJhdHMud2F0Y2ggPSBmdW5jdGlvbiAoXG4gIHBhcmVudFZhbCxcbiAgY2hpbGRWYWwsXG4gIHZtLFxuICBrZXlcbikge1xuICAvLyB3b3JrIGFyb3VuZCBGaXJlZm94J3MgT2JqZWN0LnByb3RvdHlwZS53YXRjaC4uLlxuICBpZiAocGFyZW50VmFsID09PSBuYXRpdmVXYXRjaCkgeyBwYXJlbnRWYWwgPSB1bmRlZmluZWQ7IH1cbiAgaWYgKGNoaWxkVmFsID09PSBuYXRpdmVXYXRjaCkgeyBjaGlsZFZhbCA9IHVuZGVmaW5lZDsgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKCFjaGlsZFZhbCkgeyByZXR1cm4gT2JqZWN0LmNyZWF0ZShwYXJlbnRWYWwgfHwgbnVsbCkgfVxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGFzc2VydE9iamVjdFR5cGUoa2V5LCBjaGlsZFZhbCwgdm0pO1xuICB9XG4gIGlmICghcGFyZW50VmFsKSB7IHJldHVybiBjaGlsZFZhbCB9XG4gIHZhciByZXQgPSB7fTtcbiAgZXh0ZW5kKHJldCwgcGFyZW50VmFsKTtcbiAgZm9yICh2YXIga2V5JDEgaW4gY2hpbGRWYWwpIHtcbiAgICB2YXIgcGFyZW50ID0gcmV0W2tleSQxXTtcbiAgICB2YXIgY2hpbGQgPSBjaGlsZFZhbFtrZXkkMV07XG4gICAgaWYgKHBhcmVudCAmJiAhQXJyYXkuaXNBcnJheShwYXJlbnQpKSB7XG4gICAgICBwYXJlbnQgPSBbcGFyZW50XTtcbiAgICB9XG4gICAgcmV0W2tleSQxXSA9IHBhcmVudFxuICAgICAgPyBwYXJlbnQuY29uY2F0KGNoaWxkKVxuICAgICAgOiBBcnJheS5pc0FycmF5KGNoaWxkKSA/IGNoaWxkIDogW2NoaWxkXTtcbiAgfVxuICByZXR1cm4gcmV0XG59O1xuXG4vKipcbiAqIE90aGVyIG9iamVjdCBoYXNoZXMuXG4gKi9cbnN0cmF0cy5wcm9wcyA9XG5zdHJhdHMubWV0aG9kcyA9XG5zdHJhdHMuaW5qZWN0ID1cbnN0cmF0cy5jb21wdXRlZCA9IGZ1bmN0aW9uIChcbiAgcGFyZW50VmFsLFxuICBjaGlsZFZhbCxcbiAgdm0sXG4gIGtleVxuKSB7XG4gIGlmIChjaGlsZFZhbCAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgYXNzZXJ0T2JqZWN0VHlwZShrZXksIGNoaWxkVmFsLCB2bSk7XG4gIH1cbiAgaWYgKCFwYXJlbnRWYWwpIHsgcmV0dXJuIGNoaWxkVmFsIH1cbiAgdmFyIHJldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGV4dGVuZChyZXQsIHBhcmVudFZhbCk7XG4gIGlmIChjaGlsZFZhbCkgeyBleHRlbmQocmV0LCBjaGlsZFZhbCk7IH1cbiAgcmV0dXJuIHJldFxufTtcbnN0cmF0cy5wcm92aWRlID0gbWVyZ2VEYXRhT3JGbjtcblxuLyoqXG4gKiBEZWZhdWx0IHN0cmF0ZWd5LlxuICovXG52YXIgZGVmYXVsdFN0cmF0ID0gZnVuY3Rpb24gKHBhcmVudFZhbCwgY2hpbGRWYWwpIHtcbiAgcmV0dXJuIGNoaWxkVmFsID09PSB1bmRlZmluZWRcbiAgICA/IHBhcmVudFZhbFxuICAgIDogY2hpbGRWYWxcbn07XG5cbi8qKlxuICogVmFsaWRhdGUgY29tcG9uZW50IG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ29tcG9uZW50cyAob3B0aW9ucykge1xuICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucy5jb21wb25lbnRzKSB7XG4gICAgdmFsaWRhdGVDb21wb25lbnROYW1lKGtleSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVDb21wb25lbnROYW1lIChuYW1lKSB7XG4gIGlmICghL15bYS16QS1aXVtcXHctXSokLy50ZXN0KG5hbWUpKSB7XG4gICAgd2FybihcbiAgICAgICdJbnZhbGlkIGNvbXBvbmVudCBuYW1lOiBcIicgKyBuYW1lICsgJ1wiLiBDb21wb25lbnQgbmFtZXMgJyArXG4gICAgICAnY2FuIG9ubHkgY29udGFpbiBhbHBoYW51bWVyaWMgY2hhcmFjdGVycyBhbmQgdGhlIGh5cGhlbiwgJyArXG4gICAgICAnYW5kIG11c3Qgc3RhcnQgd2l0aCBhIGxldHRlci4nXG4gICAgKTtcbiAgfVxuICBpZiAoaXNCdWlsdEluVGFnKG5hbWUpIHx8IGNvbmZpZy5pc1Jlc2VydmVkVGFnKG5hbWUpKSB7XG4gICAgd2FybihcbiAgICAgICdEbyBub3QgdXNlIGJ1aWx0LWluIG9yIHJlc2VydmVkIEhUTUwgZWxlbWVudHMgYXMgY29tcG9uZW50ICcgK1xuICAgICAgJ2lkOiAnICsgbmFtZVxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBFbnN1cmUgYWxsIHByb3BzIG9wdGlvbiBzeW50YXggYXJlIG5vcm1hbGl6ZWQgaW50byB0aGVcbiAqIE9iamVjdC1iYXNlZCBmb3JtYXQuXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByb3BzIChvcHRpb25zLCB2bSkge1xuICB2YXIgcHJvcHMgPSBvcHRpb25zLnByb3BzO1xuICBpZiAoIXByb3BzKSB7IHJldHVybiB9XG4gIHZhciByZXMgPSB7fTtcbiAgdmFyIGksIHZhbCwgbmFtZTtcbiAgaWYgKEFycmF5LmlzQXJyYXkocHJvcHMpKSB7XG4gICAgaSA9IHByb3BzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICB2YWwgPSBwcm9wc1tpXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgICAgICBuYW1lID0gY2FtZWxpemUodmFsKTtcbiAgICAgICAgcmVzW25hbWVdID0geyB0eXBlOiBudWxsIH07XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgd2FybigncHJvcHMgbXVzdCBiZSBzdHJpbmdzIHdoZW4gdXNpbmcgYXJyYXkgc3ludGF4LicpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpc1BsYWluT2JqZWN0KHByb3BzKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBwcm9wcykge1xuICAgICAgdmFsID0gcHJvcHNba2V5XTtcbiAgICAgIG5hbWUgPSBjYW1lbGl6ZShrZXkpO1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgaXNQbGFpbk9iamVjdCh2YWwpKSB7XG4gICAgICAgIHZhbGlkYXRlUHJvcE9iamVjdChuYW1lLCB2YWwsIHZtKTtcbiAgICAgIH1cbiAgICAgIHJlc1tuYW1lXSA9IGlzUGxhaW5PYmplY3QodmFsKVxuICAgICAgICA/IHZhbFxuICAgICAgICA6IHsgdHlwZTogdmFsIH07XG4gICAgfVxuICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICB3YXJuKFxuICAgICAgXCJJbnZhbGlkIHZhbHVlIGZvciBvcHRpb24gXFxcInByb3BzXFxcIjogZXhwZWN0ZWQgYW4gQXJyYXkgb3IgYW4gT2JqZWN0LCBcIiArXG4gICAgICBcImJ1dCBnb3QgXCIgKyAodG9SYXdUeXBlKHByb3BzKSkgKyBcIi5cIixcbiAgICAgIHZtXG4gICAgKTtcbiAgfVxuICBvcHRpb25zLnByb3BzID0gcmVzO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIHdoZXRoZXIgYSBwcm9wIG9iamVjdCBrZXlzIGFyZSB2YWxpZC5cbiAqL1xudmFyIHByb3BPcHRpb25zUkUgPSAvXih0eXBlfGRlZmF1bHR8cmVxdWlyZWR8dmFsaWRhdG9yKSQvO1xuXG5mdW5jdGlvbiB2YWxpZGF0ZVByb3BPYmplY3QgKFxuICBwcm9wTmFtZSxcbiAgcHJvcCxcbiAgdm1cbikge1xuICBmb3IgKHZhciBrZXkgaW4gcHJvcCkge1xuICAgIGlmICghcHJvcE9wdGlvbnNSRS50ZXN0KGtleSkpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgIChcIkludmFsaWQga2V5IFxcXCJcIiArIGtleSArIFwiXFxcIiBpbiB2YWxpZGF0aW9uIHJ1bGVzIG9iamVjdCBmb3IgcHJvcCBcXFwiXCIgKyBwcm9wTmFtZSArIFwiXFxcIi5cIiksXG4gICAgICAgIHZtXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhbGwgaW5qZWN0aW9ucyBpbnRvIE9iamVjdC1iYXNlZCBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplSW5qZWN0IChvcHRpb25zLCB2bSkge1xuICB2YXIgaW5qZWN0ID0gb3B0aW9ucy5pbmplY3Q7XG4gIGlmICghaW5qZWN0KSB7IHJldHVybiB9XG4gIHZhciBub3JtYWxpemVkID0gb3B0aW9ucy5pbmplY3QgPSB7fTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoaW5qZWN0KSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5qZWN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBub3JtYWxpemVkW2luamVjdFtpXV0gPSB7IGZyb206IGluamVjdFtpXSB9O1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc1BsYWluT2JqZWN0KGluamVjdCkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gaW5qZWN0KSB7XG4gICAgICB2YXIgdmFsID0gaW5qZWN0W2tleV07XG4gICAgICBub3JtYWxpemVkW2tleV0gPSBpc1BsYWluT2JqZWN0KHZhbClcbiAgICAgICAgPyBleHRlbmQoeyBmcm9tOiBrZXkgfSwgdmFsKVxuICAgICAgICA6IHsgZnJvbTogdmFsIH07XG4gICAgfVxuICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICB3YXJuKFxuICAgICAgXCJJbnZhbGlkIHZhbHVlIGZvciBvcHRpb24gXFxcImluamVjdFxcXCI6IGV4cGVjdGVkIGFuIEFycmF5IG9yIGFuIE9iamVjdCwgXCIgK1xuICAgICAgXCJidXQgZ290IFwiICsgKHRvUmF3VHlwZShpbmplY3QpKSArIFwiLlwiLFxuICAgICAgdm1cbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogTm9ybWFsaXplIHJhdyBmdW5jdGlvbiBkaXJlY3RpdmVzIGludG8gb2JqZWN0IGZvcm1hdC5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplRGlyZWN0aXZlcyAob3B0aW9ucykge1xuICB2YXIgZGlycyA9IG9wdGlvbnMuZGlyZWN0aXZlcztcbiAgaWYgKGRpcnMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGlycykge1xuICAgICAgdmFyIGRlZiA9IGRpcnNba2V5XTtcbiAgICAgIGlmICh0eXBlb2YgZGVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGRpcnNba2V5XSA9IHsgYmluZDogZGVmLCB1cGRhdGU6IGRlZiB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhc3NlcnRPYmplY3RUeXBlIChuYW1lLCB2YWx1ZSwgdm0pIHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgIHdhcm4oXG4gICAgICBcIkludmFsaWQgdmFsdWUgZm9yIG9wdGlvbiBcXFwiXCIgKyBuYW1lICsgXCJcXFwiOiBleHBlY3RlZCBhbiBPYmplY3QsIFwiICtcbiAgICAgIFwiYnV0IGdvdCBcIiArICh0b1Jhd1R5cGUodmFsdWUpKSArIFwiLlwiLFxuICAgICAgdm1cbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogTWVyZ2UgdHdvIG9wdGlvbiBvYmplY3RzIGludG8gYSBuZXcgb25lLlxuICogQ29yZSB1dGlsaXR5IHVzZWQgaW4gYm90aCBpbnN0YW50aWF0aW9uIGFuZCBpbmhlcml0YW5jZS5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VPcHRpb25zIChcbiAgcGFyZW50LFxuICBjaGlsZCxcbiAgdm1cbikge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGNoZWNrQ29tcG9uZW50cyhjaGlsZCk7XG4gIH1cblxuICBpZiAodHlwZW9mIGNoaWxkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2hpbGQgPSBjaGlsZC5vcHRpb25zO1xuICB9XG5cbiAgbm9ybWFsaXplUHJvcHMoY2hpbGQsIHZtKTtcbiAgbm9ybWFsaXplSW5qZWN0KGNoaWxkLCB2bSk7XG4gIG5vcm1hbGl6ZURpcmVjdGl2ZXMoY2hpbGQpO1xuICB2YXIgZXh0ZW5kc0Zyb20gPSBjaGlsZC5leHRlbmRzO1xuICBpZiAoZXh0ZW5kc0Zyb20pIHtcbiAgICBwYXJlbnQgPSBtZXJnZU9wdGlvbnMocGFyZW50LCBleHRlbmRzRnJvbSwgdm0pO1xuICB9XG4gIGlmIChjaGlsZC5taXhpbnMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkLm1peGlucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHBhcmVudCA9IG1lcmdlT3B0aW9ucyhwYXJlbnQsIGNoaWxkLm1peGluc1tpXSwgdm0pO1xuICAgIH1cbiAgfVxuICB2YXIgb3B0aW9ucyA9IHt9O1xuICB2YXIga2V5O1xuICBmb3IgKGtleSBpbiBwYXJlbnQpIHtcbiAgICBtZXJnZUZpZWxkKGtleSk7XG4gIH1cbiAgZm9yIChrZXkgaW4gY2hpbGQpIHtcbiAgICBpZiAoIWhhc093bihwYXJlbnQsIGtleSkpIHtcbiAgICAgIG1lcmdlRmllbGQoa2V5KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbWVyZ2VGaWVsZCAoa2V5KSB7XG4gICAgdmFyIHN0cmF0ID0gc3RyYXRzW2tleV0gfHwgZGVmYXVsdFN0cmF0O1xuICAgIG9wdGlvbnNba2V5XSA9IHN0cmF0KHBhcmVudFtrZXldLCBjaGlsZFtrZXldLCB2bSwga2V5KTtcbiAgfVxuICByZXR1cm4gb3B0aW9uc1xufVxuXG4vKipcbiAqIFJlc29sdmUgYW4gYXNzZXQuXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgYmVjYXVzZSBjaGlsZCBpbnN0YW5jZXMgbmVlZCBhY2Nlc3NcbiAqIHRvIGFzc2V0cyBkZWZpbmVkIGluIGl0cyBhbmNlc3RvciBjaGFpbi5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUFzc2V0IChcbiAgb3B0aW9ucyxcbiAgdHlwZSxcbiAgaWQsXG4gIHdhcm5NaXNzaW5nXG4pIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIGFzc2V0cyA9IG9wdGlvbnNbdHlwZV07XG4gIC8vIGNoZWNrIGxvY2FsIHJlZ2lzdHJhdGlvbiB2YXJpYXRpb25zIGZpcnN0XG4gIGlmIChoYXNPd24oYXNzZXRzLCBpZCkpIHsgcmV0dXJuIGFzc2V0c1tpZF0gfVxuICB2YXIgY2FtZWxpemVkSWQgPSBjYW1lbGl6ZShpZCk7XG4gIGlmIChoYXNPd24oYXNzZXRzLCBjYW1lbGl6ZWRJZCkpIHsgcmV0dXJuIGFzc2V0c1tjYW1lbGl6ZWRJZF0gfVxuICB2YXIgUGFzY2FsQ2FzZUlkID0gY2FwaXRhbGl6ZShjYW1lbGl6ZWRJZCk7XG4gIGlmIChoYXNPd24oYXNzZXRzLCBQYXNjYWxDYXNlSWQpKSB7IHJldHVybiBhc3NldHNbUGFzY2FsQ2FzZUlkXSB9XG4gIC8vIGZhbGxiYWNrIHRvIHByb3RvdHlwZSBjaGFpblxuICB2YXIgcmVzID0gYXNzZXRzW2lkXSB8fCBhc3NldHNbY2FtZWxpemVkSWRdIHx8IGFzc2V0c1tQYXNjYWxDYXNlSWRdO1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuTWlzc2luZyAmJiAhcmVzKSB7XG4gICAgd2FybihcbiAgICAgICdGYWlsZWQgdG8gcmVzb2x2ZSAnICsgdHlwZS5zbGljZSgwLCAtMSkgKyAnOiAnICsgaWQsXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiB2YWxpZGF0ZVByb3AgKFxuICBrZXksXG4gIHByb3BPcHRpb25zLFxuICBwcm9wc0RhdGEsXG4gIHZtXG4pIHtcbiAgdmFyIHByb3AgPSBwcm9wT3B0aW9uc1trZXldO1xuICB2YXIgYWJzZW50ID0gIWhhc093bihwcm9wc0RhdGEsIGtleSk7XG4gIHZhciB2YWx1ZSA9IHByb3BzRGF0YVtrZXldO1xuICAvLyBoYW5kbGUgYm9vbGVhbiBwcm9wc1xuICBpZiAoaXNUeXBlKEJvb2xlYW4sIHByb3AudHlwZSkpIHtcbiAgICBpZiAoYWJzZW50ICYmICFoYXNPd24ocHJvcCwgJ2RlZmF1bHQnKSkge1xuICAgICAgdmFsdWUgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKCFpc1R5cGUoU3RyaW5nLCBwcm9wLnR5cGUpICYmICh2YWx1ZSA9PT0gJycgfHwgdmFsdWUgPT09IGh5cGhlbmF0ZShrZXkpKSkge1xuICAgICAgdmFsdWUgPSB0cnVlO1xuICAgIH1cbiAgfVxuICAvLyBjaGVjayBkZWZhdWx0IHZhbHVlXG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFsdWUgPSBnZXRQcm9wRGVmYXVsdFZhbHVlKHZtLCBwcm9wLCBrZXkpO1xuICAgIC8vIHNpbmNlIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGEgZnJlc2ggY29weSxcbiAgICAvLyBtYWtlIHN1cmUgdG8gb2JzZXJ2ZSBpdC5cbiAgICB2YXIgcHJldlNob3VsZENvbnZlcnQgPSBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQ7XG4gICAgb2JzZXJ2ZXJTdGF0ZS5zaG91bGRDb252ZXJ0ID0gdHJ1ZTtcbiAgICBvYnNlcnZlKHZhbHVlKTtcbiAgICBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQgPSBwcmV2U2hvdWxkQ29udmVydDtcbiAgfVxuICBpZiAoXG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJlxuICAgIC8vIHNraXAgdmFsaWRhdGlvbiBmb3Igd2VleCByZWN5Y2xlLWxpc3QgY2hpbGQgY29tcG9uZW50IHByb3BzXG4gICAgISh0cnVlICYmIGlzT2JqZWN0KHZhbHVlKSAmJiAoJ0BiaW5kaW5nJyBpbiB2YWx1ZSkpXG4gICkge1xuICAgIGFzc2VydFByb3AocHJvcCwga2V5LCB2YWx1ZSwgdm0sIGFic2VudCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogR2V0IHRoZSBkZWZhdWx0IHZhbHVlIG9mIGEgcHJvcC5cbiAqL1xuZnVuY3Rpb24gZ2V0UHJvcERlZmF1bHRWYWx1ZSAodm0sIHByb3AsIGtleSkge1xuICAvLyBubyBkZWZhdWx0LCByZXR1cm4gdW5kZWZpbmVkXG4gIGlmICghaGFzT3duKHByb3AsICdkZWZhdWx0JykpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cbiAgdmFyIGRlZiA9IHByb3AuZGVmYXVsdDtcbiAgLy8gd2FybiBhZ2FpbnN0IG5vbi1mYWN0b3J5IGRlZmF1bHRzIGZvciBPYmplY3QgJiBBcnJheVxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBpc09iamVjdChkZWYpKSB7XG4gICAgd2FybihcbiAgICAgICdJbnZhbGlkIGRlZmF1bHQgdmFsdWUgZm9yIHByb3AgXCInICsga2V5ICsgJ1wiOiAnICtcbiAgICAgICdQcm9wcyB3aXRoIHR5cGUgT2JqZWN0L0FycmF5IG11c3QgdXNlIGEgZmFjdG9yeSBmdW5jdGlvbiAnICtcbiAgICAgICd0byByZXR1cm4gdGhlIGRlZmF1bHQgdmFsdWUuJyxcbiAgICAgIHZtXG4gICAgKTtcbiAgfVxuICAvLyB0aGUgcmF3IHByb3AgdmFsdWUgd2FzIGFsc28gdW5kZWZpbmVkIGZyb20gcHJldmlvdXMgcmVuZGVyLFxuICAvLyByZXR1cm4gcHJldmlvdXMgZGVmYXVsdCB2YWx1ZSB0byBhdm9pZCB1bm5lY2Vzc2FyeSB3YXRjaGVyIHRyaWdnZXJcbiAgaWYgKHZtICYmIHZtLiRvcHRpb25zLnByb3BzRGF0YSAmJlxuICAgIHZtLiRvcHRpb25zLnByb3BzRGF0YVtrZXldID09PSB1bmRlZmluZWQgJiZcbiAgICB2bS5fcHJvcHNba2V5XSAhPT0gdW5kZWZpbmVkXG4gICkge1xuICAgIHJldHVybiB2bS5fcHJvcHNba2V5XVxuICB9XG4gIC8vIGNhbGwgZmFjdG9yeSBmdW5jdGlvbiBmb3Igbm9uLUZ1bmN0aW9uIHR5cGVzXG4gIC8vIGEgdmFsdWUgaXMgRnVuY3Rpb24gaWYgaXRzIHByb3RvdHlwZSBpcyBmdW5jdGlvbiBldmVuIGFjcm9zcyBkaWZmZXJlbnQgZXhlY3V0aW9uIGNvbnRleHRcbiAgcmV0dXJuIHR5cGVvZiBkZWYgPT09ICdmdW5jdGlvbicgJiYgZ2V0VHlwZShwcm9wLnR5cGUpICE9PSAnRnVuY3Rpb24nXG4gICAgPyBkZWYuY2FsbCh2bSlcbiAgICA6IGRlZlxufVxuXG4vKipcbiAqIEFzc2VydCB3aGV0aGVyIGEgcHJvcCBpcyB2YWxpZC5cbiAqL1xuZnVuY3Rpb24gYXNzZXJ0UHJvcCAoXG4gIHByb3AsXG4gIG5hbWUsXG4gIHZhbHVlLFxuICB2bSxcbiAgYWJzZW50XG4pIHtcbiAgaWYgKHByb3AucmVxdWlyZWQgJiYgYWJzZW50KSB7XG4gICAgd2FybihcbiAgICAgICdNaXNzaW5nIHJlcXVpcmVkIHByb3A6IFwiJyArIG5hbWUgKyAnXCInLFxuICAgICAgdm1cbiAgICApO1xuICAgIHJldHVyblxuICB9XG4gIGlmICh2YWx1ZSA9PSBudWxsICYmICFwcm9wLnJlcXVpcmVkKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIHR5cGUgPSBwcm9wLnR5cGU7XG4gIHZhciB2YWxpZCA9ICF0eXBlIHx8IHR5cGUgPT09IHRydWU7XG4gIHZhciBleHBlY3RlZFR5cGVzID0gW107XG4gIGlmICh0eXBlKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHR5cGUpKSB7XG4gICAgICB0eXBlID0gW3R5cGVdO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGUubGVuZ3RoICYmICF2YWxpZDsgaSsrKSB7XG4gICAgICB2YXIgYXNzZXJ0ZWRUeXBlID0gYXNzZXJ0VHlwZSh2YWx1ZSwgdHlwZVtpXSk7XG4gICAgICBleHBlY3RlZFR5cGVzLnB1c2goYXNzZXJ0ZWRUeXBlLmV4cGVjdGVkVHlwZSB8fCAnJyk7XG4gICAgICB2YWxpZCA9IGFzc2VydGVkVHlwZS52YWxpZDtcbiAgICB9XG4gIH1cbiAgaWYgKCF2YWxpZCkge1xuICAgIHdhcm4oXG4gICAgICBcIkludmFsaWQgcHJvcDogdHlwZSBjaGVjayBmYWlsZWQgZm9yIHByb3AgXFxcIlwiICsgbmFtZSArIFwiXFxcIi5cIiArXG4gICAgICBcIiBFeHBlY3RlZCBcIiArIChleHBlY3RlZFR5cGVzLm1hcChjYXBpdGFsaXplKS5qb2luKCcsICcpKSArXG4gICAgICBcIiwgZ290IFwiICsgKHRvUmF3VHlwZSh2YWx1ZSkpICsgXCIuXCIsXG4gICAgICB2bVxuICAgICk7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIHZhbGlkYXRvciA9IHByb3AudmFsaWRhdG9yO1xuICBpZiAodmFsaWRhdG9yKSB7XG4gICAgaWYgKCF2YWxpZGF0b3IodmFsdWUpKSB7XG4gICAgICB3YXJuKFxuICAgICAgICAnSW52YWxpZCBwcm9wOiBjdXN0b20gdmFsaWRhdG9yIGNoZWNrIGZhaWxlZCBmb3IgcHJvcCBcIicgKyBuYW1lICsgJ1wiLicsXG4gICAgICAgIHZtXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG52YXIgc2ltcGxlQ2hlY2tSRSA9IC9eKFN0cmluZ3xOdW1iZXJ8Qm9vbGVhbnxGdW5jdGlvbnxTeW1ib2wpJC87XG5cbmZ1bmN0aW9uIGFzc2VydFR5cGUgKHZhbHVlLCB0eXBlKSB7XG4gIHZhciB2YWxpZDtcbiAgdmFyIGV4cGVjdGVkVHlwZSA9IGdldFR5cGUodHlwZSk7XG4gIGlmIChzaW1wbGVDaGVja1JFLnRlc3QoZXhwZWN0ZWRUeXBlKSkge1xuICAgIHZhciB0ID0gdHlwZW9mIHZhbHVlO1xuICAgIHZhbGlkID0gdCA9PT0gZXhwZWN0ZWRUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgLy8gZm9yIHByaW1pdGl2ZSB3cmFwcGVyIG9iamVjdHNcbiAgICBpZiAoIXZhbGlkICYmIHQgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YWxpZCA9IHZhbHVlIGluc3RhbmNlb2YgdHlwZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWRUeXBlID09PSAnT2JqZWN0Jykge1xuICAgIHZhbGlkID0gaXNQbGFpbk9iamVjdCh2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoZXhwZWN0ZWRUeXBlID09PSAnQXJyYXknKSB7XG4gICAgdmFsaWQgPSBBcnJheS5pc0FycmF5KHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICB2YWxpZCA9IHZhbHVlIGluc3RhbmNlb2YgdHlwZTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHZhbGlkOiB2YWxpZCxcbiAgICBleHBlY3RlZFR5cGU6IGV4cGVjdGVkVHlwZVxuICB9XG59XG5cbi8qKlxuICogVXNlIGZ1bmN0aW9uIHN0cmluZyBuYW1lIHRvIGNoZWNrIGJ1aWx0LWluIHR5cGVzLFxuICogYmVjYXVzZSBhIHNpbXBsZSBlcXVhbGl0eSBjaGVjayB3aWxsIGZhaWwgd2hlbiBydW5uaW5nXG4gKiBhY3Jvc3MgZGlmZmVyZW50IHZtcyAvIGlmcmFtZXMuXG4gKi9cbmZ1bmN0aW9uIGdldFR5cGUgKGZuKSB7XG4gIHZhciBtYXRjaCA9IGZuICYmIGZuLnRvU3RyaW5nKCkubWF0Y2goL15cXHMqZnVuY3Rpb24gKFxcdyspLyk7XG4gIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogJydcbn1cblxuZnVuY3Rpb24gaXNUeXBlICh0eXBlLCBmbikge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoZm4pKSB7XG4gICAgcmV0dXJuIGdldFR5cGUoZm4pID09PSBnZXRUeXBlKHR5cGUpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGZuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGdldFR5cGUoZm5baV0pID09PSBnZXRUeXBlKHR5cGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICByZXR1cm4gZmFsc2Vcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9yIChlcnIsIHZtLCBpbmZvKSB7XG4gIGlmICh2bSkge1xuICAgIHZhciBjdXIgPSB2bTtcbiAgICB3aGlsZSAoKGN1ciA9IGN1ci4kcGFyZW50KSkge1xuICAgICAgdmFyIGhvb2tzID0gY3VyLiRvcHRpb25zLmVycm9yQ2FwdHVyZWQ7XG4gICAgICBpZiAoaG9va3MpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgY2FwdHVyZSA9IGhvb2tzW2ldLmNhbGwoY3VyLCBlcnIsIHZtLCBpbmZvKSA9PT0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoY2FwdHVyZSkgeyByZXR1cm4gfVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGdsb2JhbEhhbmRsZUVycm9yKGUsIGN1ciwgJ2Vycm9yQ2FwdHVyZWQgaG9vaycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBnbG9iYWxIYW5kbGVFcnJvcihlcnIsIHZtLCBpbmZvKTtcbn1cblxuZnVuY3Rpb24gZ2xvYmFsSGFuZGxlRXJyb3IgKGVyciwgdm0sIGluZm8pIHtcbiAgaWYgKGNvbmZpZy5lcnJvckhhbmRsZXIpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGNvbmZpZy5lcnJvckhhbmRsZXIuY2FsbChudWxsLCBlcnIsIHZtLCBpbmZvKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZ0Vycm9yKGUsIG51bGwsICdjb25maWcuZXJyb3JIYW5kbGVyJyk7XG4gICAgfVxuICB9XG4gIGxvZ0Vycm9yKGVyciwgdm0sIGluZm8pO1xufVxuXG5mdW5jdGlvbiBsb2dFcnJvciAoZXJyLCB2bSwgaW5mbykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIHdhcm4oKFwiRXJyb3IgaW4gXCIgKyBpbmZvICsgXCI6IFxcXCJcIiArIChlcnIudG9TdHJpbmcoKSkgKyBcIlxcXCJcIiksIHZtKTtcbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAoKGluQnJvd3NlciB8fCBpbldlZXgpICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBlcnJcbiAgfVxufVxuXG4vKiAgKi9cbi8qIGdsb2JhbHMgTWVzc2FnZUNoYW5uZWwgKi9cblxudmFyIGNhbGxiYWNrcyA9IFtdO1xudmFyIHBlbmRpbmcgPSBmYWxzZTtcblxuZnVuY3Rpb24gZmx1c2hDYWxsYmFja3MgKCkge1xuICBwZW5kaW5nID0gZmFsc2U7XG4gIHZhciBjb3BpZXMgPSBjYWxsYmFja3Muc2xpY2UoMCk7XG4gIGNhbGxiYWNrcy5sZW5ndGggPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNvcGllcy5sZW5ndGg7IGkrKykge1xuICAgIGNvcGllc1tpXSgpO1xuICB9XG59XG5cbi8vIEhlcmUgd2UgaGF2ZSBhc3luYyBkZWZlcnJpbmcgd3JhcHBlcnMgdXNpbmcgYm90aCBtaWNybyBhbmQgbWFjcm8gdGFza3MuXG4vLyBJbiA8IDIuNCB3ZSB1c2VkIG1pY3JvIHRhc2tzIGV2ZXJ5d2hlcmUsIGJ1dCB0aGVyZSBhcmUgc29tZSBzY2VuYXJpb3Mgd2hlcmVcbi8vIG1pY3JvIHRhc2tzIGhhdmUgdG9vIGhpZ2ggYSBwcmlvcml0eSBhbmQgZmlyZXMgaW4gYmV0d2VlbiBzdXBwb3NlZGx5XG4vLyBzZXF1ZW50aWFsIGV2ZW50cyAoZS5nLiAjNDUyMSwgIzY2OTApIG9yIGV2ZW4gYmV0d2VlbiBidWJibGluZyBvZiB0aGUgc2FtZVxuLy8gZXZlbnQgKCM2NTY2KS4gSG93ZXZlciwgdXNpbmcgbWFjcm8gdGFza3MgZXZlcnl3aGVyZSBhbHNvIGhhcyBzdWJ0bGUgcHJvYmxlbXNcbi8vIHdoZW4gc3RhdGUgaXMgY2hhbmdlZCByaWdodCBiZWZvcmUgcmVwYWludCAoZS5nLiAjNjgxMywgb3V0LWluIHRyYW5zaXRpb25zKS5cbi8vIEhlcmUgd2UgdXNlIG1pY3JvIHRhc2sgYnkgZGVmYXVsdCwgYnV0IGV4cG9zZSBhIHdheSB0byBmb3JjZSBtYWNybyB0YXNrIHdoZW5cbi8vIG5lZWRlZCAoZS5nLiBpbiBldmVudCBoYW5kbGVycyBhdHRhY2hlZCBieSB2LW9uKS5cbnZhciBtaWNyb1RpbWVyRnVuYztcbnZhciBtYWNyb1RpbWVyRnVuYztcbnZhciB1c2VNYWNyb1Rhc2sgPSBmYWxzZTtcblxuLy8gRGV0ZXJtaW5lIChtYWNybykgVGFzayBkZWZlciBpbXBsZW1lbnRhdGlvbi5cbi8vIFRlY2huaWNhbGx5IHNldEltbWVkaWF0ZSBzaG91bGQgYmUgdGhlIGlkZWFsIGNob2ljZSwgYnV0IGl0J3Mgb25seSBhdmFpbGFibGVcbi8vIGluIElFLiBUaGUgb25seSBwb2x5ZmlsbCB0aGF0IGNvbnNpc3RlbnRseSBxdWV1ZXMgdGhlIGNhbGxiYWNrIGFmdGVyIGFsbCBET01cbi8vIGV2ZW50cyB0cmlnZ2VyZWQgaW4gdGhlIHNhbWUgbG9vcCBpcyBieSB1c2luZyBNZXNzYWdlQ2hhbm5lbC5cbi8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgIT09ICd1bmRlZmluZWQnICYmIGlzTmF0aXZlKHNldEltbWVkaWF0ZSkpIHtcbiAgbWFjcm9UaW1lckZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgc2V0SW1tZWRpYXRlKGZsdXNoQ2FsbGJhY2tzKTtcbiAgfTtcbn0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJyAmJiAoXG4gIGlzTmF0aXZlKE1lc3NhZ2VDaGFubmVsKSB8fFxuICAvLyBQaGFudG9tSlNcbiAgTWVzc2FnZUNoYW5uZWwudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgTWVzc2FnZUNoYW5uZWxDb25zdHJ1Y3Rvcl0nXG4pKSB7XG4gIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gIHZhciBwb3J0ID0gY2hhbm5lbC5wb3J0MjtcbiAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaENhbGxiYWNrcztcbiAgbWFjcm9UaW1lckZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcG9ydC5wb3N0TWVzc2FnZSgxKTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIG1hY3JvVGltZXJGdW5jID0gZnVuY3Rpb24gKCkge1xuICAgIHNldFRpbWVvdXQoZmx1c2hDYWxsYmFja3MsIDApO1xuICB9O1xufVxuXG4vLyBEZXRlcm1pbmUgTWljcm9UYXNrIGRlZmVyIGltcGxlbWVudGF0aW9uLlxuLyogaXN0YW5idWwgaWdub3JlIG5leHQsICRmbG93LWRpc2FibGUtbGluZSAqL1xuaWYgKHR5cGVvZiBQcm9taXNlICE9PSAndW5kZWZpbmVkJyAmJiBpc05hdGl2ZShQcm9taXNlKSkge1xuICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpO1xuICBtaWNyb1RpbWVyRnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICBwLnRoZW4oZmx1c2hDYWxsYmFja3MpO1xuICAgIC8vIGluIHByb2JsZW1hdGljIFVJV2ViVmlld3MsIFByb21pc2UudGhlbiBkb2Vzbid0IGNvbXBsZXRlbHkgYnJlYWssIGJ1dFxuICAgIC8vIGl0IGNhbiBnZXQgc3R1Y2sgaW4gYSB3ZWlyZCBzdGF0ZSB3aGVyZSBjYWxsYmFja3MgYXJlIHB1c2hlZCBpbnRvIHRoZVxuICAgIC8vIG1pY3JvdGFzayBxdWV1ZSBidXQgdGhlIHF1ZXVlIGlzbid0IGJlaW5nIGZsdXNoZWQsIHVudGlsIHRoZSBicm93c2VyXG4gICAgLy8gbmVlZHMgdG8gZG8gc29tZSBvdGhlciB3b3JrLCBlLmcuIGhhbmRsZSBhIHRpbWVyLiBUaGVyZWZvcmUgd2UgY2FuXG4gICAgLy8gXCJmb3JjZVwiIHRoZSBtaWNyb3Rhc2sgcXVldWUgdG8gYmUgZmx1c2hlZCBieSBhZGRpbmcgYW4gZW1wdHkgdGltZXIuXG4gICAgaWYgKGlzSU9TKSB7IHNldFRpbWVvdXQobm9vcCk7IH1cbiAgfTtcbn0gZWxzZSB7XG4gIC8vIGZhbGxiYWNrIHRvIG1hY3JvXG4gIG1pY3JvVGltZXJGdW5jID0gbWFjcm9UaW1lckZ1bmM7XG59XG5cbi8qKlxuICogV3JhcCBhIGZ1bmN0aW9uIHNvIHRoYXQgaWYgYW55IGNvZGUgaW5zaWRlIHRyaWdnZXJzIHN0YXRlIGNoYW5nZSxcbiAqIHRoZSBjaGFuZ2VzIGFyZSBxdWV1ZWQgdXNpbmcgYSBUYXNrIGluc3RlYWQgb2YgYSBNaWNyb1Rhc2suXG4gKi9cblxuXG5mdW5jdGlvbiBuZXh0VGljayAoY2IsIGN0eCkge1xuICB2YXIgX3Jlc29sdmU7XG4gIGNhbGxiYWNrcy5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoY2IpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNiLmNhbGwoY3R4KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaGFuZGxlRXJyb3IoZSwgY3R4LCAnbmV4dFRpY2snKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKF9yZXNvbHZlKSB7XG4gICAgICBfcmVzb2x2ZShjdHgpO1xuICAgIH1cbiAgfSk7XG4gIGlmICghcGVuZGluZykge1xuICAgIHBlbmRpbmcgPSB0cnVlO1xuICAgIGlmICh1c2VNYWNyb1Rhc2spIHtcbiAgICAgIG1hY3JvVGltZXJGdW5jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1pY3JvVGltZXJGdW5jKCk7XG4gICAgfVxuICB9XG4gIC8vICRmbG93LWRpc2FibGUtbGluZVxuICBpZiAoIWNiICYmIHR5cGVvZiBQcm9taXNlICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgX3Jlc29sdmUgPSByZXNvbHZlO1xuICAgIH0pXG4gIH1cbn1cblxuLyogICovXG5cbi8qIG5vdCB0eXBlIGNoZWNraW5nIHRoaXMgZmlsZSBiZWNhdXNlIGZsb3cgZG9lc24ndCBwbGF5IHdlbGwgd2l0aCBQcm94eSAqL1xuXG52YXIgaW5pdFByb3h5O1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICB2YXIgYWxsb3dlZEdsb2JhbHMgPSBtYWtlTWFwKFxuICAgICdJbmZpbml0eSx1bmRlZmluZWQsTmFOLGlzRmluaXRlLGlzTmFOLCcgK1xuICAgICdwYXJzZUZsb2F0LHBhcnNlSW50LGRlY29kZVVSSSxkZWNvZGVVUklDb21wb25lbnQsZW5jb2RlVVJJLGVuY29kZVVSSUNvbXBvbmVudCwnICtcbiAgICAnTWF0aCxOdW1iZXIsRGF0ZSxBcnJheSxPYmplY3QsQm9vbGVhbixTdHJpbmcsUmVnRXhwLE1hcCxTZXQsSlNPTixJbnRsLCcgK1xuICAgICdyZXF1aXJlJyAvLyBmb3IgV2VicGFjay9Ccm93c2VyaWZ5XG4gICk7XG5cbiAgdmFyIHdhcm5Ob25QcmVzZW50ID0gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7XG4gICAgd2FybihcbiAgICAgIFwiUHJvcGVydHkgb3IgbWV0aG9kIFxcXCJcIiArIGtleSArIFwiXFxcIiBpcyBub3QgZGVmaW5lZCBvbiB0aGUgaW5zdGFuY2UgYnV0IFwiICtcbiAgICAgICdyZWZlcmVuY2VkIGR1cmluZyByZW5kZXIuIE1ha2Ugc3VyZSB0aGF0IHRoaXMgcHJvcGVydHkgaXMgcmVhY3RpdmUsICcgK1xuICAgICAgJ2VpdGhlciBpbiB0aGUgZGF0YSBvcHRpb24sIG9yIGZvciBjbGFzcy1iYXNlZCBjb21wb25lbnRzLCBieSAnICtcbiAgICAgICdpbml0aWFsaXppbmcgdGhlIHByb3BlcnR5LiAnICtcbiAgICAgICdTZWU6IGh0dHBzOi8vdnVlanMub3JnL3YyL2d1aWRlL3JlYWN0aXZpdHkuaHRtbCNEZWNsYXJpbmctUmVhY3RpdmUtUHJvcGVydGllcy4nLFxuICAgICAgdGFyZ2V0XG4gICAgKTtcbiAgfTtcblxuICB2YXIgaGFzUHJveHkgPVxuICAgIHR5cGVvZiBQcm94eSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICBQcm94eS50b1N0cmluZygpLm1hdGNoKC9uYXRpdmUgY29kZS8pO1xuXG4gIGlmIChoYXNQcm94eSkge1xuICAgIHZhciBpc0J1aWx0SW5Nb2RpZmllciA9IG1ha2VNYXAoJ3N0b3AscHJldmVudCxzZWxmLGN0cmwsc2hpZnQsYWx0LG1ldGEsZXhhY3QnKTtcbiAgICBjb25maWcua2V5Q29kZXMgPSBuZXcgUHJveHkoY29uZmlnLmtleUNvZGVzLCB7XG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldCAodGFyZ2V0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChpc0J1aWx0SW5Nb2RpZmllcihrZXkpKSB7XG4gICAgICAgICAgd2FybigoXCJBdm9pZCBvdmVyd3JpdGluZyBidWlsdC1pbiBtb2RpZmllciBpbiBjb25maWcua2V5Q29kZXM6IC5cIiArIGtleSkpO1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRhcmdldFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdmFyIGhhc0hhbmRsZXIgPSB7XG4gICAgaGFzOiBmdW5jdGlvbiBoYXMgKHRhcmdldCwga2V5KSB7XG4gICAgICB2YXIgaGFzID0ga2V5IGluIHRhcmdldDtcbiAgICAgIHZhciBpc0FsbG93ZWQgPSBhbGxvd2VkR2xvYmFscyhrZXkpIHx8IGtleS5jaGFyQXQoMCkgPT09ICdfJztcbiAgICAgIGlmICghaGFzICYmICFpc0FsbG93ZWQpIHtcbiAgICAgICAgd2Fybk5vblByZXNlbnQodGFyZ2V0LCBrZXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhhcyB8fCAhaXNBbGxvd2VkXG4gICAgfVxuICB9O1xuXG4gIHZhciBnZXRIYW5kbGVyID0ge1xuICAgIGdldDogZnVuY3Rpb24gZ2V0ICh0YXJnZXQsIGtleSkge1xuICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmICEoa2V5IGluIHRhcmdldCkpIHtcbiAgICAgICAgd2Fybk5vblByZXNlbnQodGFyZ2V0LCBrZXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRhcmdldFtrZXldXG4gICAgfVxuICB9O1xuXG4gIGluaXRQcm94eSA9IGZ1bmN0aW9uIGluaXRQcm94eSAodm0pIHtcbiAgICBpZiAoaGFzUHJveHkpIHtcbiAgICAgIC8vIGRldGVybWluZSB3aGljaCBwcm94eSBoYW5kbGVyIHRvIHVzZVxuICAgICAgdmFyIG9wdGlvbnMgPSB2bS4kb3B0aW9ucztcbiAgICAgIHZhciBoYW5kbGVycyA9IG9wdGlvbnMucmVuZGVyICYmIG9wdGlvbnMucmVuZGVyLl93aXRoU3RyaXBwZWRcbiAgICAgICAgPyBnZXRIYW5kbGVyXG4gICAgICAgIDogaGFzSGFuZGxlcjtcbiAgICAgIHZtLl9yZW5kZXJQcm94eSA9IG5ldyBQcm94eSh2bSwgaGFuZGxlcnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2bS5fcmVuZGVyUHJveHkgPSB2bTtcbiAgICB9XG4gIH07XG59XG5cbi8qICAqL1xuXG52YXIgc2Vlbk9iamVjdHMgPSBuZXcgX1NldCgpO1xuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHRyYXZlcnNlIGFuIG9iamVjdCB0byBldm9rZSBhbGwgY29udmVydGVkXG4gKiBnZXR0ZXJzLCBzbyB0aGF0IGV2ZXJ5IG5lc3RlZCBwcm9wZXJ0eSBpbnNpZGUgdGhlIG9iamVjdFxuICogaXMgY29sbGVjdGVkIGFzIGEgXCJkZWVwXCIgZGVwZW5kZW5jeS5cbiAqL1xuZnVuY3Rpb24gdHJhdmVyc2UgKHZhbCkge1xuICBfdHJhdmVyc2UodmFsLCBzZWVuT2JqZWN0cyk7XG4gIHNlZW5PYmplY3RzLmNsZWFyKCk7XG59XG5cbmZ1bmN0aW9uIF90cmF2ZXJzZSAodmFsLCBzZWVuKSB7XG4gIHZhciBpLCBrZXlzO1xuICB2YXIgaXNBID0gQXJyYXkuaXNBcnJheSh2YWwpO1xuICBpZiAoKCFpc0EgJiYgIWlzT2JqZWN0KHZhbCkpIHx8IE9iamVjdC5pc0Zyb3plbih2YWwpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKHZhbC5fX29iX18pIHtcbiAgICB2YXIgZGVwSWQgPSB2YWwuX19vYl9fLmRlcC5pZDtcbiAgICBpZiAoc2Vlbi5oYXMoZGVwSWQpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgc2Vlbi5hZGQoZGVwSWQpO1xuICB9XG4gIGlmIChpc0EpIHtcbiAgICBpID0gdmFsLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7IF90cmF2ZXJzZSh2YWxbaV0sIHNlZW4pOyB9XG4gIH0gZWxzZSB7XG4gICAga2V5cyA9IE9iamVjdC5rZXlzKHZhbCk7XG4gICAgaSA9IGtleXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHsgX3RyYXZlcnNlKHZhbFtrZXlzW2ldXSwgc2Vlbik7IH1cbiAgfVxufVxuXG52YXIgbWFyaztcbnZhciBtZWFzdXJlO1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICB2YXIgcGVyZiA9IGluQnJvd3NlciAmJiB3aW5kb3cucGVyZm9ybWFuY2U7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoXG4gICAgcGVyZiAmJlxuICAgIHBlcmYubWFyayAmJlxuICAgIHBlcmYubWVhc3VyZSAmJlxuICAgIHBlcmYuY2xlYXJNYXJrcyAmJlxuICAgIHBlcmYuY2xlYXJNZWFzdXJlc1xuICApIHtcbiAgICBtYXJrID0gZnVuY3Rpb24gKHRhZykgeyByZXR1cm4gcGVyZi5tYXJrKHRhZyk7IH07XG4gICAgbWVhc3VyZSA9IGZ1bmN0aW9uIChuYW1lLCBzdGFydFRhZywgZW5kVGFnKSB7XG4gICAgICBwZXJmLm1lYXN1cmUobmFtZSwgc3RhcnRUYWcsIGVuZFRhZyk7XG4gICAgICBwZXJmLmNsZWFyTWFya3Moc3RhcnRUYWcpO1xuICAgICAgcGVyZi5jbGVhck1hcmtzKGVuZFRhZyk7XG4gICAgICBwZXJmLmNsZWFyTWVhc3VyZXMobmFtZSk7XG4gICAgfTtcbiAgfVxufVxuXG4vKiAgKi9cblxudmFyIG5vcm1hbGl6ZUV2ZW50ID0gY2FjaGVkKGZ1bmN0aW9uIChuYW1lKSB7XG4gIHZhciBwYXNzaXZlID0gbmFtZS5jaGFyQXQoMCkgPT09ICcmJztcbiAgbmFtZSA9IHBhc3NpdmUgPyBuYW1lLnNsaWNlKDEpIDogbmFtZTtcbiAgdmFyIG9uY2UkJDEgPSBuYW1lLmNoYXJBdCgwKSA9PT0gJ34nOyAvLyBQcmVmaXhlZCBsYXN0LCBjaGVja2VkIGZpcnN0XG4gIG5hbWUgPSBvbmNlJCQxID8gbmFtZS5zbGljZSgxKSA6IG5hbWU7XG4gIHZhciBjYXB0dXJlID0gbmFtZS5jaGFyQXQoMCkgPT09ICchJztcbiAgbmFtZSA9IGNhcHR1cmUgPyBuYW1lLnNsaWNlKDEpIDogbmFtZTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBuYW1lLFxuICAgIG9uY2U6IG9uY2UkJDEsXG4gICAgY2FwdHVyZTogY2FwdHVyZSxcbiAgICBwYXNzaXZlOiBwYXNzaXZlXG4gIH1cbn0pO1xuXG5mdW5jdGlvbiBjcmVhdGVGbkludm9rZXIgKGZucykge1xuICBmdW5jdGlvbiBpbnZva2VyICgpIHtcbiAgICB2YXIgYXJndW1lbnRzJDEgPSBhcmd1bWVudHM7XG5cbiAgICB2YXIgZm5zID0gaW52b2tlci5mbnM7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZm5zKSkge1xuICAgICAgdmFyIGNsb25lZCA9IGZucy5zbGljZSgpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbG9uZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2xvbmVkW2ldLmFwcGx5KG51bGwsIGFyZ3VtZW50cyQxKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcmV0dXJuIGhhbmRsZXIgcmV0dXJuIHZhbHVlIGZvciBzaW5nbGUgaGFuZGxlcnNcbiAgICAgIHJldHVybiBmbnMuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuICAgIH1cbiAgfVxuICBpbnZva2VyLmZucyA9IGZucztcbiAgcmV0dXJuIGludm9rZXJcbn1cblxuZnVuY3Rpb24gdXBkYXRlTGlzdGVuZXJzIChcbiAgb24sXG4gIG9sZE9uLFxuICBhZGQsXG4gIHJlbW92ZSQkMSxcbiAgdm1cbikge1xuICB2YXIgbmFtZSwgZGVmLCBjdXIsIG9sZCwgZXZlbnQ7XG4gIGZvciAobmFtZSBpbiBvbikge1xuICAgIGRlZiA9IGN1ciA9IG9uW25hbWVdO1xuICAgIG9sZCA9IG9sZE9uW25hbWVdO1xuICAgIGV2ZW50ID0gbm9ybWFsaXplRXZlbnQobmFtZSk7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHRydWUgJiYgaXNQbGFpbk9iamVjdChkZWYpKSB7XG4gICAgICBjdXIgPSBkZWYuaGFuZGxlcjtcbiAgICAgIGV2ZW50LnBhcmFtcyA9IGRlZi5wYXJhbXM7XG4gICAgfVxuICAgIGlmIChpc1VuZGVmKGN1cikpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgd2FybihcbiAgICAgICAgXCJJbnZhbGlkIGhhbmRsZXIgZm9yIGV2ZW50IFxcXCJcIiArIChldmVudC5uYW1lKSArIFwiXFxcIjogZ290IFwiICsgU3RyaW5nKGN1ciksXG4gICAgICAgIHZtXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoaXNVbmRlZihvbGQpKSB7XG4gICAgICBpZiAoaXNVbmRlZihjdXIuZm5zKSkge1xuICAgICAgICBjdXIgPSBvbltuYW1lXSA9IGNyZWF0ZUZuSW52b2tlcihjdXIpO1xuICAgICAgfVxuICAgICAgYWRkKGV2ZW50Lm5hbWUsIGN1ciwgZXZlbnQub25jZSwgZXZlbnQuY2FwdHVyZSwgZXZlbnQucGFzc2l2ZSwgZXZlbnQucGFyYW1zKTtcbiAgICB9IGVsc2UgaWYgKGN1ciAhPT0gb2xkKSB7XG4gICAgICBvbGQuZm5zID0gY3VyO1xuICAgICAgb25bbmFtZV0gPSBvbGQ7XG4gICAgfVxuICB9XG4gIGZvciAobmFtZSBpbiBvbGRPbikge1xuICAgIGlmIChpc1VuZGVmKG9uW25hbWVdKSkge1xuICAgICAgZXZlbnQgPSBub3JtYWxpemVFdmVudChuYW1lKTtcbiAgICAgIHJlbW92ZSQkMShldmVudC5uYW1lLCBvbGRPbltuYW1lXSwgZXZlbnQuY2FwdHVyZSk7XG4gICAgfVxuICB9XG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBtZXJnZVZOb2RlSG9vayAoZGVmLCBob29rS2V5LCBob29rKSB7XG4gIGlmIChkZWYgaW5zdGFuY2VvZiBWTm9kZSkge1xuICAgIGRlZiA9IGRlZi5kYXRhLmhvb2sgfHwgKGRlZi5kYXRhLmhvb2sgPSB7fSk7XG4gIH1cbiAgdmFyIGludm9rZXI7XG4gIHZhciBvbGRIb29rID0gZGVmW2hvb2tLZXldO1xuXG4gIGZ1bmN0aW9uIHdyYXBwZWRIb29rICgpIHtcbiAgICBob29rLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgLy8gaW1wb3J0YW50OiByZW1vdmUgbWVyZ2VkIGhvb2sgdG8gZW5zdXJlIGl0J3MgY2FsbGVkIG9ubHkgb25jZVxuICAgIC8vIGFuZCBwcmV2ZW50IG1lbW9yeSBsZWFrXG4gICAgcmVtb3ZlKGludm9rZXIuZm5zLCB3cmFwcGVkSG9vayk7XG4gIH1cblxuICBpZiAoaXNVbmRlZihvbGRIb29rKSkge1xuICAgIC8vIG5vIGV4aXN0aW5nIGhvb2tcbiAgICBpbnZva2VyID0gY3JlYXRlRm5JbnZva2VyKFt3cmFwcGVkSG9va10pO1xuICB9IGVsc2Uge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmIChpc0RlZihvbGRIb29rLmZucykgJiYgaXNUcnVlKG9sZEhvb2subWVyZ2VkKSkge1xuICAgICAgLy8gYWxyZWFkeSBhIG1lcmdlZCBpbnZva2VyXG4gICAgICBpbnZva2VyID0gb2xkSG9vaztcbiAgICAgIGludm9rZXIuZm5zLnB1c2god3JhcHBlZEhvb2spO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBleGlzdGluZyBwbGFpbiBob29rXG4gICAgICBpbnZva2VyID0gY3JlYXRlRm5JbnZva2VyKFtvbGRIb29rLCB3cmFwcGVkSG9va10pO1xuICAgIH1cbiAgfVxuXG4gIGludm9rZXIubWVyZ2VkID0gdHJ1ZTtcbiAgZGVmW2hvb2tLZXldID0gaW52b2tlcjtcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGV4dHJhY3RQcm9wc0Zyb21WTm9kZURhdGEgKFxuICBkYXRhLFxuICBDdG9yLFxuICB0YWdcbikge1xuICAvLyB3ZSBhcmUgb25seSBleHRyYWN0aW5nIHJhdyB2YWx1ZXMgaGVyZS5cbiAgLy8gdmFsaWRhdGlvbiBhbmQgZGVmYXVsdCB2YWx1ZXMgYXJlIGhhbmRsZWQgaW4gdGhlIGNoaWxkXG4gIC8vIGNvbXBvbmVudCBpdHNlbGYuXG4gIHZhciBwcm9wT3B0aW9ucyA9IEN0b3Iub3B0aW9ucy5wcm9wcztcbiAgaWYgKGlzVW5kZWYocHJvcE9wdGlvbnMpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIHJlcyA9IHt9O1xuICB2YXIgYXR0cnMgPSBkYXRhLmF0dHJzO1xuICB2YXIgcHJvcHMgPSBkYXRhLnByb3BzO1xuICBpZiAoaXNEZWYoYXR0cnMpIHx8IGlzRGVmKHByb3BzKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBwcm9wT3B0aW9ucykge1xuICAgICAgdmFyIGFsdEtleSA9IGh5cGhlbmF0ZShrZXkpO1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgdmFyIGtleUluTG93ZXJDYXNlID0ga2V5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBrZXkgIT09IGtleUluTG93ZXJDYXNlICYmXG4gICAgICAgICAgYXR0cnMgJiYgaGFzT3duKGF0dHJzLCBrZXlJbkxvd2VyQ2FzZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGlwKFxuICAgICAgICAgICAgXCJQcm9wIFxcXCJcIiArIGtleUluTG93ZXJDYXNlICsgXCJcXFwiIGlzIHBhc3NlZCB0byBjb21wb25lbnQgXCIgK1xuICAgICAgICAgICAgKGZvcm1hdENvbXBvbmVudE5hbWUodGFnIHx8IEN0b3IpKSArIFwiLCBidXQgdGhlIGRlY2xhcmVkIHByb3AgbmFtZSBpc1wiICtcbiAgICAgICAgICAgIFwiIFxcXCJcIiArIGtleSArIFwiXFxcIi4gXCIgK1xuICAgICAgICAgICAgXCJOb3RlIHRoYXQgSFRNTCBhdHRyaWJ1dGVzIGFyZSBjYXNlLWluc2Vuc2l0aXZlIGFuZCBjYW1lbENhc2VkIFwiICtcbiAgICAgICAgICAgIFwicHJvcHMgbmVlZCB0byB1c2UgdGhlaXIga2ViYWItY2FzZSBlcXVpdmFsZW50cyB3aGVuIHVzaW5nIGluLURPTSBcIiArXG4gICAgICAgICAgICBcInRlbXBsYXRlcy4gWW91IHNob3VsZCBwcm9iYWJseSB1c2UgXFxcIlwiICsgYWx0S2V5ICsgXCJcXFwiIGluc3RlYWQgb2YgXFxcIlwiICsga2V5ICsgXCJcXFwiLlwiXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2hlY2tQcm9wKHJlcywgcHJvcHMsIGtleSwgYWx0S2V5LCB0cnVlKSB8fFxuICAgICAgY2hlY2tQcm9wKHJlcywgYXR0cnMsIGtleSwgYWx0S2V5LCBmYWxzZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gY2hlY2tQcm9wIChcbiAgcmVzLFxuICBoYXNoLFxuICBrZXksXG4gIGFsdEtleSxcbiAgcHJlc2VydmVcbikge1xuICBpZiAoaXNEZWYoaGFzaCkpIHtcbiAgICBpZiAoaGFzT3duKGhhc2gsIGtleSkpIHtcbiAgICAgIHJlc1trZXldID0gaGFzaFtrZXldO1xuICAgICAgaWYgKCFwcmVzZXJ2ZSkge1xuICAgICAgICBkZWxldGUgaGFzaFtrZXldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKGhhc093bihoYXNoLCBhbHRLZXkpKSB7XG4gICAgICByZXNba2V5XSA9IGhhc2hbYWx0S2V5XTtcbiAgICAgIGlmICghcHJlc2VydmUpIHtcbiAgICAgICAgZGVsZXRlIGhhc2hbYWx0S2V5XTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKiAgKi9cblxuLy8gVGhlIHRlbXBsYXRlIGNvbXBpbGVyIGF0dGVtcHRzIHRvIG1pbmltaXplIHRoZSBuZWVkIGZvciBub3JtYWxpemF0aW9uIGJ5XG4vLyBzdGF0aWNhbGx5IGFuYWx5emluZyB0aGUgdGVtcGxhdGUgYXQgY29tcGlsZSB0aW1lLlxuLy9cbi8vIEZvciBwbGFpbiBIVE1MIG1hcmt1cCwgbm9ybWFsaXphdGlvbiBjYW4gYmUgY29tcGxldGVseSBza2lwcGVkIGJlY2F1c2UgdGhlXG4vLyBnZW5lcmF0ZWQgcmVuZGVyIGZ1bmN0aW9uIGlzIGd1YXJhbnRlZWQgdG8gcmV0dXJuIEFycmF5PFZOb2RlPi4gVGhlcmUgYXJlXG4vLyB0d28gY2FzZXMgd2hlcmUgZXh0cmEgbm9ybWFsaXphdGlvbiBpcyBuZWVkZWQ6XG5cbi8vIDEuIFdoZW4gdGhlIGNoaWxkcmVuIGNvbnRhaW5zIGNvbXBvbmVudHMgLSBiZWNhdXNlIGEgZnVuY3Rpb25hbCBjb21wb25lbnRcbi8vIG1heSByZXR1cm4gYW4gQXJyYXkgaW5zdGVhZCBvZiBhIHNpbmdsZSByb290LiBJbiB0aGlzIGNhc2UsIGp1c3QgYSBzaW1wbGVcbi8vIG5vcm1hbGl6YXRpb24gaXMgbmVlZGVkIC0gaWYgYW55IGNoaWxkIGlzIGFuIEFycmF5LCB3ZSBmbGF0dGVuIHRoZSB3aG9sZVxuLy8gdGhpbmcgd2l0aCBBcnJheS5wcm90b3R5cGUuY29uY2F0LiBJdCBpcyBndWFyYW50ZWVkIHRvIGJlIG9ubHkgMS1sZXZlbCBkZWVwXG4vLyBiZWNhdXNlIGZ1bmN0aW9uYWwgY29tcG9uZW50cyBhbHJlYWR5IG5vcm1hbGl6ZSB0aGVpciBvd24gY2hpbGRyZW4uXG5mdW5jdGlvbiBzaW1wbGVOb3JtYWxpemVDaGlsZHJlbiAoY2hpbGRyZW4pIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuW2ldKSkge1xuICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGNoaWxkcmVuKVxuICAgIH1cbiAgfVxuICByZXR1cm4gY2hpbGRyZW5cbn1cblxuLy8gMi4gV2hlbiB0aGUgY2hpbGRyZW4gY29udGFpbnMgY29uc3RydWN0cyB0aGF0IGFsd2F5cyBnZW5lcmF0ZWQgbmVzdGVkIEFycmF5cyxcbi8vIGUuZy4gPHRlbXBsYXRlPiwgPHNsb3Q+LCB2LWZvciwgb3Igd2hlbiB0aGUgY2hpbGRyZW4gaXMgcHJvdmlkZWQgYnkgdXNlclxuLy8gd2l0aCBoYW5kLXdyaXR0ZW4gcmVuZGVyIGZ1bmN0aW9ucyAvIEpTWC4gSW4gc3VjaCBjYXNlcyBhIGZ1bGwgbm9ybWFsaXphdGlvblxuLy8gaXMgbmVlZGVkIHRvIGNhdGVyIHRvIGFsbCBwb3NzaWJsZSB0eXBlcyBvZiBjaGlsZHJlbiB2YWx1ZXMuXG5mdW5jdGlvbiBub3JtYWxpemVDaGlsZHJlbiAoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGlzUHJpbWl0aXZlKGNoaWxkcmVuKVxuICAgID8gW2NyZWF0ZVRleHRWTm9kZShjaGlsZHJlbildXG4gICAgOiBBcnJheS5pc0FycmF5KGNoaWxkcmVuKVxuICAgICAgPyBub3JtYWxpemVBcnJheUNoaWxkcmVuKGNoaWxkcmVuKVxuICAgICAgOiB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gaXNUZXh0Tm9kZSAobm9kZSkge1xuICByZXR1cm4gaXNEZWYobm9kZSkgJiYgaXNEZWYobm9kZS50ZXh0KSAmJiBpc0ZhbHNlKG5vZGUuaXNDb21tZW50KVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheUNoaWxkcmVuIChjaGlsZHJlbiwgbmVzdGVkSW5kZXgpIHtcbiAgdmFyIHJlcyA9IFtdO1xuICB2YXIgaSwgYywgbGFzdEluZGV4LCBsYXN0O1xuICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBjID0gY2hpbGRyZW5baV07XG4gICAgaWYgKGlzVW5kZWYoYykgfHwgdHlwZW9mIGMgPT09ICdib29sZWFuJykgeyBjb250aW51ZSB9XG4gICAgbGFzdEluZGV4ID0gcmVzLmxlbmd0aCAtIDE7XG4gICAgbGFzdCA9IHJlc1tsYXN0SW5kZXhdO1xuICAgIC8vICBuZXN0ZWRcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjKSkge1xuICAgICAgaWYgKGMubGVuZ3RoID4gMCkge1xuICAgICAgICBjID0gbm9ybWFsaXplQXJyYXlDaGlsZHJlbihjLCAoKG5lc3RlZEluZGV4IHx8ICcnKSArIFwiX1wiICsgaSkpO1xuICAgICAgICAvLyBtZXJnZSBhZGphY2VudCB0ZXh0IG5vZGVzXG4gICAgICAgIGlmIChpc1RleHROb2RlKGNbMF0pICYmIGlzVGV4dE5vZGUobGFzdCkpIHtcbiAgICAgICAgICByZXNbbGFzdEluZGV4XSA9IGNyZWF0ZVRleHRWTm9kZShsYXN0LnRleHQgKyAoY1swXSkudGV4dCk7XG4gICAgICAgICAgYy5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHJlcy5wdXNoLmFwcGx5KHJlcywgYyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1ByaW1pdGl2ZShjKSkge1xuICAgICAgaWYgKGlzVGV4dE5vZGUobGFzdCkpIHtcbiAgICAgICAgLy8gbWVyZ2UgYWRqYWNlbnQgdGV4dCBub2Rlc1xuICAgICAgICAvLyB0aGlzIGlzIG5lY2Vzc2FyeSBmb3IgU1NSIGh5ZHJhdGlvbiBiZWNhdXNlIHRleHQgbm9kZXMgYXJlXG4gICAgICAgIC8vIGVzc2VudGlhbGx5IG1lcmdlZCB3aGVuIHJlbmRlcmVkIHRvIEhUTUwgc3RyaW5nc1xuICAgICAgICByZXNbbGFzdEluZGV4XSA9IGNyZWF0ZVRleHRWTm9kZShsYXN0LnRleHQgKyBjKTtcbiAgICAgIH0gZWxzZSBpZiAoYyAhPT0gJycpIHtcbiAgICAgICAgLy8gY29udmVydCBwcmltaXRpdmUgdG8gdm5vZGVcbiAgICAgICAgcmVzLnB1c2goY3JlYXRlVGV4dFZOb2RlKGMpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzVGV4dE5vZGUoYykgJiYgaXNUZXh0Tm9kZShsYXN0KSkge1xuICAgICAgICAvLyBtZXJnZSBhZGphY2VudCB0ZXh0IG5vZGVzXG4gICAgICAgIHJlc1tsYXN0SW5kZXhdID0gY3JlYXRlVGV4dFZOb2RlKGxhc3QudGV4dCArIGMudGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBkZWZhdWx0IGtleSBmb3IgbmVzdGVkIGFycmF5IGNoaWxkcmVuIChsaWtlbHkgZ2VuZXJhdGVkIGJ5IHYtZm9yKVxuICAgICAgICBpZiAoaXNUcnVlKGNoaWxkcmVuLl9pc1ZMaXN0KSAmJlxuICAgICAgICAgIGlzRGVmKGMudGFnKSAmJlxuICAgICAgICAgIGlzVW5kZWYoYy5rZXkpICYmXG4gICAgICAgICAgaXNEZWYobmVzdGVkSW5kZXgpKSB7XG4gICAgICAgICAgYy5rZXkgPSBcIl9fdmxpc3RcIiArIG5lc3RlZEluZGV4ICsgXCJfXCIgKyBpICsgXCJfX1wiO1xuICAgICAgICB9XG4gICAgICAgIHJlcy5wdXNoKGMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBlbnN1cmVDdG9yIChjb21wLCBiYXNlKSB7XG4gIGlmIChcbiAgICBjb21wLl9fZXNNb2R1bGUgfHxcbiAgICAoaGFzU3ltYm9sICYmIGNvbXBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9PT0gJ01vZHVsZScpXG4gICkge1xuICAgIGNvbXAgPSBjb21wLmRlZmF1bHQ7XG4gIH1cbiAgcmV0dXJuIGlzT2JqZWN0KGNvbXApXG4gICAgPyBiYXNlLmV4dGVuZChjb21wKVxuICAgIDogY29tcFxufVxuXG5mdW5jdGlvbiBjcmVhdGVBc3luY1BsYWNlaG9sZGVyIChcbiAgZmFjdG9yeSxcbiAgZGF0YSxcbiAgY29udGV4dCxcbiAgY2hpbGRyZW4sXG4gIHRhZ1xuKSB7XG4gIHZhciBub2RlID0gY3JlYXRlRW1wdHlWTm9kZSgpO1xuICBub2RlLmFzeW5jRmFjdG9yeSA9IGZhY3Rvcnk7XG4gIG5vZGUuYXN5bmNNZXRhID0geyBkYXRhOiBkYXRhLCBjb250ZXh0OiBjb250ZXh0LCBjaGlsZHJlbjogY2hpbGRyZW4sIHRhZzogdGFnIH07XG4gIHJldHVybiBub2RlXG59XG5cbmZ1bmN0aW9uIHJlc29sdmVBc3luY0NvbXBvbmVudCAoXG4gIGZhY3RvcnksXG4gIGJhc2VDdG9yLFxuICBjb250ZXh0XG4pIHtcbiAgaWYgKGlzVHJ1ZShmYWN0b3J5LmVycm9yKSAmJiBpc0RlZihmYWN0b3J5LmVycm9yQ29tcCkpIHtcbiAgICByZXR1cm4gZmFjdG9yeS5lcnJvckNvbXBcbiAgfVxuXG4gIGlmIChpc0RlZihmYWN0b3J5LnJlc29sdmVkKSkge1xuICAgIHJldHVybiBmYWN0b3J5LnJlc29sdmVkXG4gIH1cblxuICBpZiAoaXNUcnVlKGZhY3RvcnkubG9hZGluZykgJiYgaXNEZWYoZmFjdG9yeS5sb2FkaW5nQ29tcCkpIHtcbiAgICByZXR1cm4gZmFjdG9yeS5sb2FkaW5nQ29tcFxuICB9XG5cbiAgaWYgKGlzRGVmKGZhY3RvcnkuY29udGV4dHMpKSB7XG4gICAgLy8gYWxyZWFkeSBwZW5kaW5nXG4gICAgZmFjdG9yeS5jb250ZXh0cy5wdXNoKGNvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIHZhciBjb250ZXh0cyA9IGZhY3RvcnkuY29udGV4dHMgPSBbY29udGV4dF07XG4gICAgdmFyIHN5bmMgPSB0cnVlO1xuXG4gICAgdmFyIGZvcmNlUmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjb250ZXh0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY29udGV4dHNbaV0uJGZvcmNlVXBkYXRlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciByZXNvbHZlID0gb25jZShmdW5jdGlvbiAocmVzKSB7XG4gICAgICAvLyBjYWNoZSByZXNvbHZlZFxuICAgICAgZmFjdG9yeS5yZXNvbHZlZCA9IGVuc3VyZUN0b3IocmVzLCBiYXNlQ3Rvcik7XG4gICAgICAvLyBpbnZva2UgY2FsbGJhY2tzIG9ubHkgaWYgdGhpcyBpcyBub3QgYSBzeW5jaHJvbm91cyByZXNvbHZlXG4gICAgICAvLyAoYXN5bmMgcmVzb2x2ZXMgYXJlIHNoaW1tZWQgYXMgc3luY2hyb25vdXMgZHVyaW5nIFNTUilcbiAgICAgIGlmICghc3luYykge1xuICAgICAgICBmb3JjZVJlbmRlcigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlamVjdCA9IG9uY2UoZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgICBcIkZhaWxlZCB0byByZXNvbHZlIGFzeW5jIGNvbXBvbmVudDogXCIgKyAoU3RyaW5nKGZhY3RvcnkpKSArXG4gICAgICAgIChyZWFzb24gPyAoXCJcXG5SZWFzb246IFwiICsgcmVhc29uKSA6ICcnKVxuICAgICAgKTtcbiAgICAgIGlmIChpc0RlZihmYWN0b3J5LmVycm9yQ29tcCkpIHtcbiAgICAgICAgZmFjdG9yeS5lcnJvciA9IHRydWU7XG4gICAgICAgIGZvcmNlUmVuZGVyKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVzID0gZmFjdG9yeShyZXNvbHZlLCByZWplY3QpO1xuXG4gICAgaWYgKGlzT2JqZWN0KHJlcykpIHtcbiAgICAgIGlmICh0eXBlb2YgcmVzLnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gKCkgPT4gUHJvbWlzZVxuICAgICAgICBpZiAoaXNVbmRlZihmYWN0b3J5LnJlc29sdmVkKSkge1xuICAgICAgICAgIHJlcy50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNEZWYocmVzLmNvbXBvbmVudCkgJiYgdHlwZW9mIHJlcy5jb21wb25lbnQudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXMuY29tcG9uZW50LnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcblxuICAgICAgICBpZiAoaXNEZWYocmVzLmVycm9yKSkge1xuICAgICAgICAgIGZhY3RvcnkuZXJyb3JDb21wID0gZW5zdXJlQ3RvcihyZXMuZXJyb3IsIGJhc2VDdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0RlZihyZXMubG9hZGluZykpIHtcbiAgICAgICAgICBmYWN0b3J5LmxvYWRpbmdDb21wID0gZW5zdXJlQ3RvcihyZXMubG9hZGluZywgYmFzZUN0b3IpO1xuICAgICAgICAgIGlmIChyZXMuZGVsYXkgPT09IDApIHtcbiAgICAgICAgICAgIGZhY3RvcnkubG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAoaXNVbmRlZihmYWN0b3J5LnJlc29sdmVkKSAmJiBpc1VuZGVmKGZhY3RvcnkuZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgZmFjdG9yeS5sb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JjZVJlbmRlcigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCByZXMuZGVsYXkgfHwgMjAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNEZWYocmVzLnRpbWVvdXQpKSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoaXNVbmRlZihmYWN0b3J5LnJlc29sdmVkKSkge1xuICAgICAgICAgICAgICByZWplY3QoXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJ1xuICAgICAgICAgICAgICAgICAgPyAoXCJ0aW1lb3V0IChcIiArIChyZXMudGltZW91dCkgKyBcIm1zKVwiKVxuICAgICAgICAgICAgICAgICAgOiBudWxsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgcmVzLnRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3luYyA9IGZhbHNlO1xuICAgIC8vIHJldHVybiBpbiBjYXNlIHJlc29sdmVkIHN5bmNocm9ub3VzbHlcbiAgICByZXR1cm4gZmFjdG9yeS5sb2FkaW5nXG4gICAgICA/IGZhY3RvcnkubG9hZGluZ0NvbXBcbiAgICAgIDogZmFjdG9yeS5yZXNvbHZlZFxuICB9XG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBpc0FzeW5jUGxhY2Vob2xkZXIgKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUuaXNDb21tZW50ICYmIG5vZGUuYXN5bmNGYWN0b3J5XG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBnZXRGaXJzdENvbXBvbmVudENoaWxkIChjaGlsZHJlbikge1xuICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbikpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IGNoaWxkcmVuW2ldO1xuICAgICAgaWYgKGlzRGVmKGMpICYmIChpc0RlZihjLmNvbXBvbmVudE9wdGlvbnMpIHx8IGlzQXN5bmNQbGFjZWhvbGRlcihjKSkpIHtcbiAgICAgICAgcmV0dXJuIGNcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyogICovXG5cbi8qICAqL1xuXG5mdW5jdGlvbiBpbml0RXZlbnRzICh2bSkge1xuICB2bS5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgdm0uX2hhc0hvb2tFdmVudCA9IGZhbHNlO1xuICAvLyBpbml0IHBhcmVudCBhdHRhY2hlZCBldmVudHNcbiAgdmFyIGxpc3RlbmVycyA9IHZtLiRvcHRpb25zLl9wYXJlbnRMaXN0ZW5lcnM7XG4gIGlmIChsaXN0ZW5lcnMpIHtcbiAgICB1cGRhdGVDb21wb25lbnRMaXN0ZW5lcnModm0sIGxpc3RlbmVycyk7XG4gIH1cbn1cblxudmFyIHRhcmdldDtcblxuZnVuY3Rpb24gYWRkIChldmVudCwgZm4sIG9uY2UpIHtcbiAgaWYgKG9uY2UpIHtcbiAgICB0YXJnZXQuJG9uY2UoZXZlbnQsIGZuKTtcbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuJG9uKGV2ZW50LCBmbik7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlJDEgKGV2ZW50LCBmbikge1xuICB0YXJnZXQuJG9mZihldmVudCwgZm4pO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDb21wb25lbnRMaXN0ZW5lcnMgKFxuICB2bSxcbiAgbGlzdGVuZXJzLFxuICBvbGRMaXN0ZW5lcnNcbikge1xuICB0YXJnZXQgPSB2bTtcbiAgdXBkYXRlTGlzdGVuZXJzKGxpc3RlbmVycywgb2xkTGlzdGVuZXJzIHx8IHt9LCBhZGQsIHJlbW92ZSQxLCB2bSk7XG4gIHRhcmdldCA9IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZXZlbnRzTWl4aW4gKFZ1ZSkge1xuICB2YXIgaG9va1JFID0gL15ob29rOi87XG4gIFZ1ZS5wcm90b3R5cGUuJG9uID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gICAgdmFyIHZtID0gdGhpcztcbiAgICBpZiAoQXJyYXkuaXNBcnJheShldmVudCkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gZXZlbnQubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRoaXMkMS4kb24oZXZlbnRbaV0sIGZuKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgKHZtLl9ldmVudHNbZXZlbnRdIHx8ICh2bS5fZXZlbnRzW2V2ZW50XSA9IFtdKSkucHVzaChmbik7XG4gICAgICAvLyBvcHRpbWl6ZSBob29rOmV2ZW50IGNvc3QgYnkgdXNpbmcgYSBib29sZWFuIGZsYWcgbWFya2VkIGF0IHJlZ2lzdHJhdGlvblxuICAgICAgLy8gaW5zdGVhZCBvZiBhIGhhc2ggbG9va3VwXG4gICAgICBpZiAoaG9va1JFLnRlc3QoZXZlbnQpKSB7XG4gICAgICAgIHZtLl9oYXNIb29rRXZlbnQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdm1cbiAgfTtcblxuICBWdWUucHJvdG90eXBlLiRvbmNlID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgZnVuY3Rpb24gb24gKCkge1xuICAgICAgdm0uJG9mZihldmVudCwgb24pO1xuICAgICAgZm4uYXBwbHkodm0sIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIG9uLmZuID0gZm47XG4gICAgdm0uJG9uKGV2ZW50LCBvbik7XG4gICAgcmV0dXJuIHZtXG4gIH07XG5cbiAgVnVlLnByb3RvdHlwZS4kb2ZmID0gZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gICAgdmFyIHZtID0gdGhpcztcbiAgICAvLyBhbGxcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHZtLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgcmV0dXJuIHZtXG4gICAgfVxuICAgIC8vIGFycmF5IG9mIGV2ZW50c1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV2ZW50KSkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBldmVudC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdGhpcyQxLiRvZmYoZXZlbnRbaV0sIGZuKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2bVxuICAgIH1cbiAgICAvLyBzcGVjaWZpYyBldmVudFxuICAgIHZhciBjYnMgPSB2bS5fZXZlbnRzW2V2ZW50XTtcbiAgICBpZiAoIWNicykge1xuICAgICAgcmV0dXJuIHZtXG4gICAgfVxuICAgIGlmICghZm4pIHtcbiAgICAgIHZtLl9ldmVudHNbZXZlbnRdID0gbnVsbDtcbiAgICAgIHJldHVybiB2bVxuICAgIH1cbiAgICBpZiAoZm4pIHtcbiAgICAgIC8vIHNwZWNpZmljIGhhbmRsZXJcbiAgICAgIHZhciBjYjtcbiAgICAgIHZhciBpJDEgPSBjYnMubGVuZ3RoO1xuICAgICAgd2hpbGUgKGkkMS0tKSB7XG4gICAgICAgIGNiID0gY2JzW2kkMV07XG4gICAgICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XG4gICAgICAgICAgY2JzLnNwbGljZShpJDEsIDEpO1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZtXG4gIH07XG5cbiAgVnVlLnByb3RvdHlwZS4kZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHZhciBsb3dlckNhc2VFdmVudCA9IGV2ZW50LnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAobG93ZXJDYXNlRXZlbnQgIT09IGV2ZW50ICYmIHZtLl9ldmVudHNbbG93ZXJDYXNlRXZlbnRdKSB7XG4gICAgICAgIHRpcChcbiAgICAgICAgICBcIkV2ZW50IFxcXCJcIiArIGxvd2VyQ2FzZUV2ZW50ICsgXCJcXFwiIGlzIGVtaXR0ZWQgaW4gY29tcG9uZW50IFwiICtcbiAgICAgICAgICAoZm9ybWF0Q29tcG9uZW50TmFtZSh2bSkpICsgXCIgYnV0IHRoZSBoYW5kbGVyIGlzIHJlZ2lzdGVyZWQgZm9yIFxcXCJcIiArIGV2ZW50ICsgXCJcXFwiLiBcIiArXG4gICAgICAgICAgXCJOb3RlIHRoYXQgSFRNTCBhdHRyaWJ1dGVzIGFyZSBjYXNlLWluc2Vuc2l0aXZlIGFuZCB5b3UgY2Fubm90IHVzZSBcIiArXG4gICAgICAgICAgXCJ2LW9uIHRvIGxpc3RlbiB0byBjYW1lbENhc2UgZXZlbnRzIHdoZW4gdXNpbmcgaW4tRE9NIHRlbXBsYXRlcy4gXCIgK1xuICAgICAgICAgIFwiWW91IHNob3VsZCBwcm9iYWJseSB1c2UgXFxcIlwiICsgKGh5cGhlbmF0ZShldmVudCkpICsgXCJcXFwiIGluc3RlYWQgb2YgXFxcIlwiICsgZXZlbnQgKyBcIlxcXCIuXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNicyA9IHZtLl9ldmVudHNbZXZlbnRdO1xuICAgIGlmIChjYnMpIHtcbiAgICAgIGNicyA9IGNicy5sZW5ndGggPiAxID8gdG9BcnJheShjYnMpIDogY2JzO1xuICAgICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cywgMSk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNicy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjYnNbaV0uYXBwbHkodm0sIGFyZ3MpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgaGFuZGxlRXJyb3IoZSwgdm0sIChcImV2ZW50IGhhbmRsZXIgZm9yIFxcXCJcIiArIGV2ZW50ICsgXCJcXFwiXCIpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdm1cbiAgfTtcbn1cblxuLyogICovXG5cblxuXG4vKipcbiAqIFJ1bnRpbWUgaGVscGVyIGZvciByZXNvbHZpbmcgcmF3IGNoaWxkcmVuIFZOb2RlcyBpbnRvIGEgc2xvdCBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVTbG90cyAoXG4gIGNoaWxkcmVuLFxuICBjb250ZXh0XG4pIHtcbiAgdmFyIHNsb3RzID0ge307XG4gIGlmICghY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gc2xvdHNcbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgIHZhciBkYXRhID0gY2hpbGQuZGF0YTtcbiAgICAvLyByZW1vdmUgc2xvdCBhdHRyaWJ1dGUgaWYgdGhlIG5vZGUgaXMgcmVzb2x2ZWQgYXMgYSBWdWUgc2xvdCBub2RlXG4gICAgaWYgKGRhdGEgJiYgZGF0YS5hdHRycyAmJiBkYXRhLmF0dHJzLnNsb3QpIHtcbiAgICAgIGRlbGV0ZSBkYXRhLmF0dHJzLnNsb3Q7XG4gICAgfVxuICAgIC8vIG5hbWVkIHNsb3RzIHNob3VsZCBvbmx5IGJlIHJlc3BlY3RlZCBpZiB0aGUgdm5vZGUgd2FzIHJlbmRlcmVkIGluIHRoZVxuICAgIC8vIHNhbWUgY29udGV4dC5cbiAgICBpZiAoKGNoaWxkLmNvbnRleHQgPT09IGNvbnRleHQgfHwgY2hpbGQuZm5Db250ZXh0ID09PSBjb250ZXh0KSAmJlxuICAgICAgZGF0YSAmJiBkYXRhLnNsb3QgIT0gbnVsbFxuICAgICkge1xuICAgICAgdmFyIG5hbWUgPSBkYXRhLnNsb3Q7XG4gICAgICB2YXIgc2xvdCA9IChzbG90c1tuYW1lXSB8fCAoc2xvdHNbbmFtZV0gPSBbXSkpO1xuICAgICAgaWYgKGNoaWxkLnRhZyA9PT0gJ3RlbXBsYXRlJykge1xuICAgICAgICBzbG90LnB1c2guYXBwbHkoc2xvdCwgY2hpbGQuY2hpbGRyZW4gfHwgW10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2xvdC5wdXNoKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgKHNsb3RzLmRlZmF1bHQgfHwgKHNsb3RzLmRlZmF1bHQgPSBbXSkpLnB1c2goY2hpbGQpO1xuICAgIH1cbiAgfVxuICAvLyBpZ25vcmUgc2xvdHMgdGhhdCBjb250YWlucyBvbmx5IHdoaXRlc3BhY2VcbiAgZm9yICh2YXIgbmFtZSQxIGluIHNsb3RzKSB7XG4gICAgaWYgKHNsb3RzW25hbWUkMV0uZXZlcnkoaXNXaGl0ZXNwYWNlKSkge1xuICAgICAgZGVsZXRlIHNsb3RzW25hbWUkMV07XG4gICAgfVxuICB9XG4gIHJldHVybiBzbG90c1xufVxuXG5mdW5jdGlvbiBpc1doaXRlc3BhY2UgKG5vZGUpIHtcbiAgcmV0dXJuIChub2RlLmlzQ29tbWVudCAmJiAhbm9kZS5hc3luY0ZhY3RvcnkpIHx8IG5vZGUudGV4dCA9PT0gJyAnXG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTY29wZWRTbG90cyAoXG4gIGZucywgLy8gc2VlIGZsb3cvdm5vZGVcbiAgcmVzXG4pIHtcbiAgcmVzID0gcmVzIHx8IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGZucy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGZuc1tpXSkpIHtcbiAgICAgIHJlc29sdmVTY29wZWRTbG90cyhmbnNbaV0sIHJlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc1tmbnNbaV0ua2V5XSA9IGZuc1tpXS5mbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG4vKiAgKi9cblxudmFyIGFjdGl2ZUluc3RhbmNlID0gbnVsbDtcbnZhciBpc1VwZGF0aW5nQ2hpbGRDb21wb25lbnQgPSBmYWxzZTtcblxuZnVuY3Rpb24gaW5pdExpZmVjeWNsZSAodm0pIHtcbiAgdmFyIG9wdGlvbnMgPSB2bS4kb3B0aW9ucztcblxuICAvLyBsb2NhdGUgZmlyc3Qgbm9uLWFic3RyYWN0IHBhcmVudFxuICB2YXIgcGFyZW50ID0gb3B0aW9ucy5wYXJlbnQ7XG4gIGlmIChwYXJlbnQgJiYgIW9wdGlvbnMuYWJzdHJhY3QpIHtcbiAgICB3aGlsZSAocGFyZW50LiRvcHRpb25zLmFic3RyYWN0ICYmIHBhcmVudC4kcGFyZW50KSB7XG4gICAgICBwYXJlbnQgPSBwYXJlbnQuJHBhcmVudDtcbiAgICB9XG4gICAgcGFyZW50LiRjaGlsZHJlbi5wdXNoKHZtKTtcbiAgfVxuXG4gIHZtLiRwYXJlbnQgPSBwYXJlbnQ7XG4gIHZtLiRyb290ID0gcGFyZW50ID8gcGFyZW50LiRyb290IDogdm07XG5cbiAgdm0uJGNoaWxkcmVuID0gW107XG4gIHZtLiRyZWZzID0ge307XG5cbiAgdm0uX3dhdGNoZXIgPSBudWxsO1xuICB2bS5faW5hY3RpdmUgPSBudWxsO1xuICB2bS5fZGlyZWN0SW5hY3RpdmUgPSBmYWxzZTtcbiAgdm0uX2lzTW91bnRlZCA9IGZhbHNlO1xuICB2bS5faXNEZXN0cm95ZWQgPSBmYWxzZTtcbiAgdm0uX2lzQmVpbmdEZXN0cm95ZWQgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gbGlmZWN5Y2xlTWl4aW4gKFZ1ZSkge1xuICBWdWUucHJvdG90eXBlLl91cGRhdGUgPSBmdW5jdGlvbiAodm5vZGUsIGh5ZHJhdGluZykge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgaWYgKHZtLl9pc01vdW50ZWQpIHtcbiAgICAgIGNhbGxIb29rKHZtLCAnYmVmb3JlVXBkYXRlJyk7XG4gICAgfVxuICAgIHZhciBwcmV2RWwgPSB2bS4kZWw7XG4gICAgdmFyIHByZXZWbm9kZSA9IHZtLl92bm9kZTtcbiAgICB2YXIgcHJldkFjdGl2ZUluc3RhbmNlID0gYWN0aXZlSW5zdGFuY2U7XG4gICAgYWN0aXZlSW5zdGFuY2UgPSB2bTtcbiAgICB2bS5fdm5vZGUgPSB2bm9kZTtcbiAgICAvLyBWdWUucHJvdG90eXBlLl9fcGF0Y2hfXyBpcyBpbmplY3RlZCBpbiBlbnRyeSBwb2ludHNcbiAgICAvLyBiYXNlZCBvbiB0aGUgcmVuZGVyaW5nIGJhY2tlbmQgdXNlZC5cbiAgICBpZiAoIXByZXZWbm9kZSkge1xuICAgICAgLy8gaW5pdGlhbCByZW5kZXJcbiAgICAgIHZtLiRlbCA9IHZtLl9fcGF0Y2hfXyhcbiAgICAgICAgdm0uJGVsLCB2bm9kZSwgaHlkcmF0aW5nLCBmYWxzZSAvKiByZW1vdmVPbmx5ICovLFxuICAgICAgICB2bS4kb3B0aW9ucy5fcGFyZW50RWxtLFxuICAgICAgICB2bS4kb3B0aW9ucy5fcmVmRWxtXG4gICAgICApO1xuICAgICAgLy8gbm8gbmVlZCBmb3IgdGhlIHJlZiBub2RlcyBhZnRlciBpbml0aWFsIHBhdGNoXG4gICAgICAvLyB0aGlzIHByZXZlbnRzIGtlZXBpbmcgYSBkZXRhY2hlZCBET00gdHJlZSBpbiBtZW1vcnkgKCM1ODUxKVxuICAgICAgdm0uJG9wdGlvbnMuX3BhcmVudEVsbSA9IHZtLiRvcHRpb25zLl9yZWZFbG0gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyB1cGRhdGVzXG4gICAgICB2bS4kZWwgPSB2bS5fX3BhdGNoX18ocHJldlZub2RlLCB2bm9kZSk7XG4gICAgfVxuICAgIGFjdGl2ZUluc3RhbmNlID0gcHJldkFjdGl2ZUluc3RhbmNlO1xuICAgIC8vIHVwZGF0ZSBfX3Z1ZV9fIHJlZmVyZW5jZVxuICAgIGlmIChwcmV2RWwpIHtcbiAgICAgIHByZXZFbC5fX3Z1ZV9fID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHZtLiRlbCkge1xuICAgICAgdm0uJGVsLl9fdnVlX18gPSB2bTtcbiAgICB9XG4gICAgLy8gaWYgcGFyZW50IGlzIGFuIEhPQywgdXBkYXRlIGl0cyAkZWwgYXMgd2VsbFxuICAgIGlmICh2bS4kdm5vZGUgJiYgdm0uJHBhcmVudCAmJiB2bS4kdm5vZGUgPT09IHZtLiRwYXJlbnQuX3Zub2RlKSB7XG4gICAgICB2bS4kcGFyZW50LiRlbCA9IHZtLiRlbDtcbiAgICB9XG4gICAgLy8gdXBkYXRlZCBob29rIGlzIGNhbGxlZCBieSB0aGUgc2NoZWR1bGVyIHRvIGVuc3VyZSB0aGF0IGNoaWxkcmVuIGFyZVxuICAgIC8vIHVwZGF0ZWQgaW4gYSBwYXJlbnQncyB1cGRhdGVkIGhvb2suXG4gIH07XG5cbiAgVnVlLnByb3RvdHlwZS4kZm9yY2VVcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICBpZiAodm0uX3dhdGNoZXIpIHtcbiAgICAgIHZtLl93YXRjaGVyLnVwZGF0ZSgpO1xuICAgIH1cbiAgfTtcblxuICBWdWUucHJvdG90eXBlLiRkZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgaWYgKHZtLl9pc0JlaW5nRGVzdHJveWVkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY2FsbEhvb2sodm0sICdiZWZvcmVEZXN0cm95Jyk7XG4gICAgdm0uX2lzQmVpbmdEZXN0cm95ZWQgPSB0cnVlO1xuICAgIC8vIHJlbW92ZSBzZWxmIGZyb20gcGFyZW50XG4gICAgdmFyIHBhcmVudCA9IHZtLiRwYXJlbnQ7XG4gICAgaWYgKHBhcmVudCAmJiAhcGFyZW50Ll9pc0JlaW5nRGVzdHJveWVkICYmICF2bS4kb3B0aW9ucy5hYnN0cmFjdCkge1xuICAgICAgcmVtb3ZlKHBhcmVudC4kY2hpbGRyZW4sIHZtKTtcbiAgICB9XG4gICAgLy8gdGVhcmRvd24gd2F0Y2hlcnNcbiAgICBpZiAodm0uX3dhdGNoZXIpIHtcbiAgICAgIHZtLl93YXRjaGVyLnRlYXJkb3duKCk7XG4gICAgfVxuICAgIHZhciBpID0gdm0uX3dhdGNoZXJzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICB2bS5fd2F0Y2hlcnNbaV0udGVhcmRvd24oKTtcbiAgICB9XG4gICAgLy8gcmVtb3ZlIHJlZmVyZW5jZSBmcm9tIGRhdGEgb2JcbiAgICAvLyBmcm96ZW4gb2JqZWN0IG1heSBub3QgaGF2ZSBvYnNlcnZlci5cbiAgICBpZiAodm0uX2RhdGEuX19vYl9fKSB7XG4gICAgICB2bS5fZGF0YS5fX29iX18udm1Db3VudC0tO1xuICAgIH1cbiAgICAvLyBjYWxsIHRoZSBsYXN0IGhvb2suLi5cbiAgICB2bS5faXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgIC8vIGludm9rZSBkZXN0cm95IGhvb2tzIG9uIGN1cnJlbnQgcmVuZGVyZWQgdHJlZVxuICAgIHZtLl9fcGF0Y2hfXyh2bS5fdm5vZGUsIG51bGwpO1xuICAgIC8vIGZpcmUgZGVzdHJveWVkIGhvb2tcbiAgICBjYWxsSG9vayh2bSwgJ2Rlc3Ryb3llZCcpO1xuICAgIC8vIHR1cm4gb2ZmIGFsbCBpbnN0YW5jZSBsaXN0ZW5lcnMuXG4gICAgdm0uJG9mZigpO1xuICAgIC8vIHJlbW92ZSBfX3Z1ZV9fIHJlZmVyZW5jZVxuICAgIGlmICh2bS4kZWwpIHtcbiAgICAgIHZtLiRlbC5fX3Z1ZV9fID0gbnVsbDtcbiAgICB9XG4gICAgLy8gcmVsZWFzZSBjaXJjdWxhciByZWZlcmVuY2UgKCM2NzU5KVxuICAgIGlmICh2bS4kdm5vZGUpIHtcbiAgICAgIHZtLiR2bm9kZS5wYXJlbnQgPSBudWxsO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gbW91bnRDb21wb25lbnQgKFxuICB2bSxcbiAgZWwsXG4gIGh5ZHJhdGluZ1xuKSB7XG4gIHZtLiRlbCA9IGVsO1xuICBpZiAoIXZtLiRvcHRpb25zLnJlbmRlcikge1xuICAgIHZtLiRvcHRpb25zLnJlbmRlciA9IGNyZWF0ZUVtcHR5Vk5vZGU7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgaWYgKCh2bS4kb3B0aW9ucy50ZW1wbGF0ZSAmJiB2bS4kb3B0aW9ucy50ZW1wbGF0ZS5jaGFyQXQoMCkgIT09ICcjJykgfHxcbiAgICAgICAgdm0uJG9wdGlvbnMuZWwgfHwgZWwpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICAnWW91IGFyZSB1c2luZyB0aGUgcnVudGltZS1vbmx5IGJ1aWxkIG9mIFZ1ZSB3aGVyZSB0aGUgdGVtcGxhdGUgJyArXG4gICAgICAgICAgJ2NvbXBpbGVyIGlzIG5vdCBhdmFpbGFibGUuIEVpdGhlciBwcmUtY29tcGlsZSB0aGUgdGVtcGxhdGVzIGludG8gJyArXG4gICAgICAgICAgJ3JlbmRlciBmdW5jdGlvbnMsIG9yIHVzZSB0aGUgY29tcGlsZXItaW5jbHVkZWQgYnVpbGQuJyxcbiAgICAgICAgICB2bVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICAnRmFpbGVkIHRvIG1vdW50IGNvbXBvbmVudDogdGVtcGxhdGUgb3IgcmVuZGVyIGZ1bmN0aW9uIG5vdCBkZWZpbmVkLicsXG4gICAgICAgICAgdm1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY2FsbEhvb2sodm0sICdiZWZvcmVNb3VudCcpO1xuXG4gIHZhciB1cGRhdGVDb21wb25lbnQ7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBjb25maWcucGVyZm9ybWFuY2UgJiYgbWFyaykge1xuICAgIHVwZGF0ZUNvbXBvbmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBuYW1lID0gdm0uX25hbWU7XG4gICAgICB2YXIgaWQgPSB2bS5fdWlkO1xuICAgICAgdmFyIHN0YXJ0VGFnID0gXCJ2dWUtcGVyZi1zdGFydDpcIiArIGlkO1xuICAgICAgdmFyIGVuZFRhZyA9IFwidnVlLXBlcmYtZW5kOlwiICsgaWQ7XG5cbiAgICAgIG1hcmsoc3RhcnRUYWcpO1xuICAgICAgdmFyIHZub2RlID0gdm0uX3JlbmRlcigpO1xuICAgICAgbWFyayhlbmRUYWcpO1xuICAgICAgbWVhc3VyZSgoXCJ2dWUgXCIgKyBuYW1lICsgXCIgcmVuZGVyXCIpLCBzdGFydFRhZywgZW5kVGFnKTtcblxuICAgICAgbWFyayhzdGFydFRhZyk7XG4gICAgICB2bS5fdXBkYXRlKHZub2RlLCBoeWRyYXRpbmcpO1xuICAgICAgbWFyayhlbmRUYWcpO1xuICAgICAgbWVhc3VyZSgoXCJ2dWUgXCIgKyBuYW1lICsgXCIgcGF0Y2hcIiksIHN0YXJ0VGFnLCBlbmRUYWcpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgdXBkYXRlQ29tcG9uZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdm0uX3VwZGF0ZSh2bS5fcmVuZGVyKCksIGh5ZHJhdGluZyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHdlIHNldCB0aGlzIHRvIHZtLl93YXRjaGVyIGluc2lkZSB0aGUgd2F0Y2hlcidzIGNvbnN0cnVjdG9yXG4gIC8vIHNpbmNlIHRoZSB3YXRjaGVyJ3MgaW5pdGlhbCBwYXRjaCBtYXkgY2FsbCAkZm9yY2VVcGRhdGUgKGUuZy4gaW5zaWRlIGNoaWxkXG4gIC8vIGNvbXBvbmVudCdzIG1vdW50ZWQgaG9vayksIHdoaWNoIHJlbGllcyBvbiB2bS5fd2F0Y2hlciBiZWluZyBhbHJlYWR5IGRlZmluZWRcbiAgbmV3IFdhdGNoZXIodm0sIHVwZGF0ZUNvbXBvbmVudCwgbm9vcCwgbnVsbCwgdHJ1ZSAvKiBpc1JlbmRlcldhdGNoZXIgKi8pO1xuICBoeWRyYXRpbmcgPSBmYWxzZTtcblxuICAvLyBtYW51YWxseSBtb3VudGVkIGluc3RhbmNlLCBjYWxsIG1vdW50ZWQgb24gc2VsZlxuICAvLyBtb3VudGVkIGlzIGNhbGxlZCBmb3IgcmVuZGVyLWNyZWF0ZWQgY2hpbGQgY29tcG9uZW50cyBpbiBpdHMgaW5zZXJ0ZWQgaG9va1xuICBpZiAodm0uJHZub2RlID09IG51bGwpIHtcbiAgICB2bS5faXNNb3VudGVkID0gdHJ1ZTtcbiAgICBjYWxsSG9vayh2bSwgJ21vdW50ZWQnKTtcbiAgfVxuICByZXR1cm4gdm1cbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2hpbGRDb21wb25lbnQgKFxuICB2bSxcbiAgcHJvcHNEYXRhLFxuICBsaXN0ZW5lcnMsXG4gIHBhcmVudFZub2RlLFxuICByZW5kZXJDaGlsZHJlblxuKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaXNVcGRhdGluZ0NoaWxkQ29tcG9uZW50ID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIGRldGVybWluZSB3aGV0aGVyIGNvbXBvbmVudCBoYXMgc2xvdCBjaGlsZHJlblxuICAvLyB3ZSBuZWVkIHRvIGRvIHRoaXMgYmVmb3JlIG92ZXJ3cml0aW5nICRvcHRpb25zLl9yZW5kZXJDaGlsZHJlblxuICB2YXIgaGFzQ2hpbGRyZW4gPSAhIShcbiAgICByZW5kZXJDaGlsZHJlbiB8fCAgICAgICAgICAgICAgIC8vIGhhcyBuZXcgc3RhdGljIHNsb3RzXG4gICAgdm0uJG9wdGlvbnMuX3JlbmRlckNoaWxkcmVuIHx8ICAvLyBoYXMgb2xkIHN0YXRpYyBzbG90c1xuICAgIHBhcmVudFZub2RlLmRhdGEuc2NvcGVkU2xvdHMgfHwgLy8gaGFzIG5ldyBzY29wZWQgc2xvdHNcbiAgICB2bS4kc2NvcGVkU2xvdHMgIT09IGVtcHR5T2JqZWN0IC8vIGhhcyBvbGQgc2NvcGVkIHNsb3RzXG4gICk7XG5cbiAgdm0uJG9wdGlvbnMuX3BhcmVudFZub2RlID0gcGFyZW50Vm5vZGU7XG4gIHZtLiR2bm9kZSA9IHBhcmVudFZub2RlOyAvLyB1cGRhdGUgdm0ncyBwbGFjZWhvbGRlciBub2RlIHdpdGhvdXQgcmUtcmVuZGVyXG5cbiAgaWYgKHZtLl92bm9kZSkgeyAvLyB1cGRhdGUgY2hpbGQgdHJlZSdzIHBhcmVudFxuICAgIHZtLl92bm9kZS5wYXJlbnQgPSBwYXJlbnRWbm9kZTtcbiAgfVxuICB2bS4kb3B0aW9ucy5fcmVuZGVyQ2hpbGRyZW4gPSByZW5kZXJDaGlsZHJlbjtcblxuICAvLyB1cGRhdGUgJGF0dHJzIGFuZCAkbGlzdGVuZXJzIGhhc2hcbiAgLy8gdGhlc2UgYXJlIGFsc28gcmVhY3RpdmUgc28gdGhleSBtYXkgdHJpZ2dlciBjaGlsZCB1cGRhdGUgaWYgdGhlIGNoaWxkXG4gIC8vIHVzZWQgdGhlbSBkdXJpbmcgcmVuZGVyXG4gIHZtLiRhdHRycyA9IChwYXJlbnRWbm9kZS5kYXRhICYmIHBhcmVudFZub2RlLmRhdGEuYXR0cnMpIHx8IGVtcHR5T2JqZWN0O1xuICB2bS4kbGlzdGVuZXJzID0gbGlzdGVuZXJzIHx8IGVtcHR5T2JqZWN0O1xuXG4gIC8vIHVwZGF0ZSBwcm9wc1xuICBpZiAocHJvcHNEYXRhICYmIHZtLiRvcHRpb25zLnByb3BzKSB7XG4gICAgb2JzZXJ2ZXJTdGF0ZS5zaG91bGRDb252ZXJ0ID0gZmFsc2U7XG4gICAgdmFyIHByb3BzID0gdm0uX3Byb3BzO1xuICAgIHZhciBwcm9wS2V5cyA9IHZtLiRvcHRpb25zLl9wcm9wS2V5cyB8fCBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0gcHJvcEtleXNbaV07XG4gICAgICBwcm9wc1trZXldID0gdmFsaWRhdGVQcm9wKGtleSwgdm0uJG9wdGlvbnMucHJvcHMsIHByb3BzRGF0YSwgdm0pO1xuICAgIH1cbiAgICBvYnNlcnZlclN0YXRlLnNob3VsZENvbnZlcnQgPSB0cnVlO1xuICAgIC8vIGtlZXAgYSBjb3B5IG9mIHJhdyBwcm9wc0RhdGFcbiAgICB2bS4kb3B0aW9ucy5wcm9wc0RhdGEgPSBwcm9wc0RhdGE7XG4gIH1cblxuICAvLyB1cGRhdGUgbGlzdGVuZXJzXG4gIGlmIChsaXN0ZW5lcnMpIHtcbiAgICB2YXIgb2xkTGlzdGVuZXJzID0gdm0uJG9wdGlvbnMuX3BhcmVudExpc3RlbmVycztcbiAgICB2bS4kb3B0aW9ucy5fcGFyZW50TGlzdGVuZXJzID0gbGlzdGVuZXJzO1xuICAgIHVwZGF0ZUNvbXBvbmVudExpc3RlbmVycyh2bSwgbGlzdGVuZXJzLCBvbGRMaXN0ZW5lcnMpO1xuICB9XG4gIC8vIHJlc29sdmUgc2xvdHMgKyBmb3JjZSB1cGRhdGUgaWYgaGFzIGNoaWxkcmVuXG4gIGlmIChoYXNDaGlsZHJlbikge1xuICAgIHZtLiRzbG90cyA9IHJlc29sdmVTbG90cyhyZW5kZXJDaGlsZHJlbiwgcGFyZW50Vm5vZGUuY29udGV4dCk7XG4gICAgdm0uJGZvcmNlVXBkYXRlKCk7XG4gIH1cblxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlzVXBkYXRpbmdDaGlsZENvbXBvbmVudCA9IGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzSW5JbmFjdGl2ZVRyZWUgKHZtKSB7XG4gIHdoaWxlICh2bSAmJiAodm0gPSB2bS4kcGFyZW50KSkge1xuICAgIGlmICh2bS5faW5hY3RpdmUpIHsgcmV0dXJuIHRydWUgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBhY3RpdmF0ZUNoaWxkQ29tcG9uZW50ICh2bSwgZGlyZWN0KSB7XG4gIGlmIChkaXJlY3QpIHtcbiAgICB2bS5fZGlyZWN0SW5hY3RpdmUgPSBmYWxzZTtcbiAgICBpZiAoaXNJbkluYWN0aXZlVHJlZSh2bSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfSBlbHNlIGlmICh2bS5fZGlyZWN0SW5hY3RpdmUpIHtcbiAgICByZXR1cm5cbiAgfVxuICBpZiAodm0uX2luYWN0aXZlIHx8IHZtLl9pbmFjdGl2ZSA9PT0gbnVsbCkge1xuICAgIHZtLl9pbmFjdGl2ZSA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdm0uJGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhY3RpdmF0ZUNoaWxkQ29tcG9uZW50KHZtLiRjaGlsZHJlbltpXSk7XG4gICAgfVxuICAgIGNhbGxIb29rKHZtLCAnYWN0aXZhdGVkJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVhY3RpdmF0ZUNoaWxkQ29tcG9uZW50ICh2bSwgZGlyZWN0KSB7XG4gIGlmIChkaXJlY3QpIHtcbiAgICB2bS5fZGlyZWN0SW5hY3RpdmUgPSB0cnVlO1xuICAgIGlmIChpc0luSW5hY3RpdmVUcmVlKHZtKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICB9XG4gIGlmICghdm0uX2luYWN0aXZlKSB7XG4gICAgdm0uX2luYWN0aXZlID0gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZtLiRjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgZGVhY3RpdmF0ZUNoaWxkQ29tcG9uZW50KHZtLiRjaGlsZHJlbltpXSk7XG4gICAgfVxuICAgIGNhbGxIb29rKHZtLCAnZGVhY3RpdmF0ZWQnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsSG9vayAodm0sIGhvb2spIHtcbiAgdmFyIGhhbmRsZXJzID0gdm0uJG9wdGlvbnNbaG9va107XG4gIGlmIChoYW5kbGVycykge1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gaGFuZGxlcnMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICBoYW5kbGVyc1tpXS5jYWxsKHZtKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaGFuZGxlRXJyb3IoZSwgdm0sIChob29rICsgXCIgaG9va1wiKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmICh2bS5faGFzSG9va0V2ZW50KSB7XG4gICAgdm0uJGVtaXQoJ2hvb2s6JyArIGhvb2spO1xuICB9XG59XG5cbi8qICAqL1xuXG5cbnZhciBNQVhfVVBEQVRFX0NPVU5UID0gMTAwO1xuXG52YXIgcXVldWUgPSBbXTtcbnZhciBhY3RpdmF0ZWRDaGlsZHJlbiA9IFtdO1xudmFyIGhhcyA9IHt9O1xudmFyIGNpcmN1bGFyID0ge307XG52YXIgd2FpdGluZyA9IGZhbHNlO1xudmFyIGZsdXNoaW5nID0gZmFsc2U7XG52YXIgaW5kZXggPSAwO1xuXG4vKipcbiAqIFJlc2V0IHRoZSBzY2hlZHVsZXIncyBzdGF0ZS5cbiAqL1xuZnVuY3Rpb24gcmVzZXRTY2hlZHVsZXJTdGF0ZSAoKSB7XG4gIGluZGV4ID0gcXVldWUubGVuZ3RoID0gYWN0aXZhdGVkQ2hpbGRyZW4ubGVuZ3RoID0gMDtcbiAgaGFzID0ge307XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgY2lyY3VsYXIgPSB7fTtcbiAgfVxuICB3YWl0aW5nID0gZmx1c2hpbmcgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBGbHVzaCBib3RoIHF1ZXVlcyBhbmQgcnVuIHRoZSB3YXRjaGVycy5cbiAqL1xuZnVuY3Rpb24gZmx1c2hTY2hlZHVsZXJRdWV1ZSAoKSB7XG4gIGZsdXNoaW5nID0gdHJ1ZTtcbiAgdmFyIHdhdGNoZXIsIGlkO1xuXG4gIC8vIFNvcnQgcXVldWUgYmVmb3JlIGZsdXNoLlxuICAvLyBUaGlzIGVuc3VyZXMgdGhhdDpcbiAgLy8gMS4gQ29tcG9uZW50cyBhcmUgdXBkYXRlZCBmcm9tIHBhcmVudCB0byBjaGlsZC4gKGJlY2F1c2UgcGFyZW50IGlzIGFsd2F5c1xuICAvLyAgICBjcmVhdGVkIGJlZm9yZSB0aGUgY2hpbGQpXG4gIC8vIDIuIEEgY29tcG9uZW50J3MgdXNlciB3YXRjaGVycyBhcmUgcnVuIGJlZm9yZSBpdHMgcmVuZGVyIHdhdGNoZXIgKGJlY2F1c2VcbiAgLy8gICAgdXNlciB3YXRjaGVycyBhcmUgY3JlYXRlZCBiZWZvcmUgdGhlIHJlbmRlciB3YXRjaGVyKVxuICAvLyAzLiBJZiBhIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQgZHVyaW5nIGEgcGFyZW50IGNvbXBvbmVudCdzIHdhdGNoZXIgcnVuLFxuICAvLyAgICBpdHMgd2F0Y2hlcnMgY2FuIGJlIHNraXBwZWQuXG4gIHF1ZXVlLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuaWQgLSBiLmlkOyB9KTtcblxuICAvLyBkbyBub3QgY2FjaGUgbGVuZ3RoIGJlY2F1c2UgbW9yZSB3YXRjaGVycyBtaWdodCBiZSBwdXNoZWRcbiAgLy8gYXMgd2UgcnVuIGV4aXN0aW5nIHdhdGNoZXJzXG4gIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IHF1ZXVlLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIHdhdGNoZXIgPSBxdWV1ZVtpbmRleF07XG4gICAgaWQgPSB3YXRjaGVyLmlkO1xuICAgIGhhc1tpZF0gPSBudWxsO1xuICAgIHdhdGNoZXIucnVuKCk7XG4gICAgLy8gaW4gZGV2IGJ1aWxkLCBjaGVjayBhbmQgc3RvcCBjaXJjdWxhciB1cGRhdGVzLlxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGhhc1tpZF0gIT0gbnVsbCkge1xuICAgICAgY2lyY3VsYXJbaWRdID0gKGNpcmN1bGFyW2lkXSB8fCAwKSArIDE7XG4gICAgICBpZiAoY2lyY3VsYXJbaWRdID4gTUFYX1VQREFURV9DT1VOVCkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgICdZb3UgbWF5IGhhdmUgYW4gaW5maW5pdGUgdXBkYXRlIGxvb3AgJyArIChcbiAgICAgICAgICAgIHdhdGNoZXIudXNlclxuICAgICAgICAgICAgICA/IChcImluIHdhdGNoZXIgd2l0aCBleHByZXNzaW9uIFxcXCJcIiArICh3YXRjaGVyLmV4cHJlc3Npb24pICsgXCJcXFwiXCIpXG4gICAgICAgICAgICAgIDogXCJpbiBhIGNvbXBvbmVudCByZW5kZXIgZnVuY3Rpb24uXCJcbiAgICAgICAgICApLFxuICAgICAgICAgIHdhdGNoZXIudm1cbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBrZWVwIGNvcGllcyBvZiBwb3N0IHF1ZXVlcyBiZWZvcmUgcmVzZXR0aW5nIHN0YXRlXG4gIHZhciBhY3RpdmF0ZWRRdWV1ZSA9IGFjdGl2YXRlZENoaWxkcmVuLnNsaWNlKCk7XG4gIHZhciB1cGRhdGVkUXVldWUgPSBxdWV1ZS5zbGljZSgpO1xuXG4gIHJlc2V0U2NoZWR1bGVyU3RhdGUoKTtcblxuICAvLyBjYWxsIGNvbXBvbmVudCB1cGRhdGVkIGFuZCBhY3RpdmF0ZWQgaG9va3NcbiAgY2FsbEFjdGl2YXRlZEhvb2tzKGFjdGl2YXRlZFF1ZXVlKTtcbiAgY2FsbFVwZGF0ZWRIb29rcyh1cGRhdGVkUXVldWUpO1xuXG4gIC8vIGRldnRvb2wgaG9va1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKGRldnRvb2xzICYmIGNvbmZpZy5kZXZ0b29scykge1xuICAgIGRldnRvb2xzLmVtaXQoJ2ZsdXNoJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbFVwZGF0ZWRIb29rcyAocXVldWUpIHtcbiAgdmFyIGkgPSBxdWV1ZS5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICB2YXIgd2F0Y2hlciA9IHF1ZXVlW2ldO1xuICAgIHZhciB2bSA9IHdhdGNoZXIudm07XG4gICAgaWYgKHZtLl93YXRjaGVyID09PSB3YXRjaGVyICYmIHZtLl9pc01vdW50ZWQpIHtcbiAgICAgIGNhbGxIb29rKHZtLCAndXBkYXRlZCcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFF1ZXVlIGEga2VwdC1hbGl2ZSBjb21wb25lbnQgdGhhdCB3YXMgYWN0aXZhdGVkIGR1cmluZyBwYXRjaC5cbiAqIFRoZSBxdWV1ZSB3aWxsIGJlIHByb2Nlc3NlZCBhZnRlciB0aGUgZW50aXJlIHRyZWUgaGFzIGJlZW4gcGF0Y2hlZC5cbiAqL1xuZnVuY3Rpb24gcXVldWVBY3RpdmF0ZWRDb21wb25lbnQgKHZtKSB7XG4gIC8vIHNldHRpbmcgX2luYWN0aXZlIHRvIGZhbHNlIGhlcmUgc28gdGhhdCBhIHJlbmRlciBmdW5jdGlvbiBjYW5cbiAgLy8gcmVseSBvbiBjaGVja2luZyB3aGV0aGVyIGl0J3MgaW4gYW4gaW5hY3RpdmUgdHJlZSAoZS5nLiByb3V0ZXItdmlldylcbiAgdm0uX2luYWN0aXZlID0gZmFsc2U7XG4gIGFjdGl2YXRlZENoaWxkcmVuLnB1c2godm0pO1xufVxuXG5mdW5jdGlvbiBjYWxsQWN0aXZhdGVkSG9va3MgKHF1ZXVlKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICBxdWV1ZVtpXS5faW5hY3RpdmUgPSB0cnVlO1xuICAgIGFjdGl2YXRlQ2hpbGRDb21wb25lbnQocXVldWVbaV0sIHRydWUgLyogdHJ1ZSAqLyk7XG4gIH1cbn1cblxuLyoqXG4gKiBQdXNoIGEgd2F0Y2hlciBpbnRvIHRoZSB3YXRjaGVyIHF1ZXVlLlxuICogSm9icyB3aXRoIGR1cGxpY2F0ZSBJRHMgd2lsbCBiZSBza2lwcGVkIHVubGVzcyBpdCdzXG4gKiBwdXNoZWQgd2hlbiB0aGUgcXVldWUgaXMgYmVpbmcgZmx1c2hlZC5cbiAqL1xuZnVuY3Rpb24gcXVldWVXYXRjaGVyICh3YXRjaGVyKSB7XG4gIHZhciBpZCA9IHdhdGNoZXIuaWQ7XG4gIGlmIChoYXNbaWRdID09IG51bGwpIHtcbiAgICBoYXNbaWRdID0gdHJ1ZTtcbiAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICBxdWV1ZS5wdXNoKHdhdGNoZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBhbHJlYWR5IGZsdXNoaW5nLCBzcGxpY2UgdGhlIHdhdGNoZXIgYmFzZWQgb24gaXRzIGlkXG4gICAgICAvLyBpZiBhbHJlYWR5IHBhc3QgaXRzIGlkLCBpdCB3aWxsIGJlIHJ1biBuZXh0IGltbWVkaWF0ZWx5LlxuICAgICAgdmFyIGkgPSBxdWV1ZS5sZW5ndGggLSAxO1xuICAgICAgd2hpbGUgKGkgPiBpbmRleCAmJiBxdWV1ZVtpXS5pZCA+IHdhdGNoZXIuaWQpIHtcbiAgICAgICAgaS0tO1xuICAgICAgfVxuICAgICAgcXVldWUuc3BsaWNlKGkgKyAxLCAwLCB3YXRjaGVyKTtcbiAgICB9XG4gICAgLy8gcXVldWUgdGhlIGZsdXNoXG4gICAgaWYgKCF3YWl0aW5nKSB7XG4gICAgICB3YWl0aW5nID0gdHJ1ZTtcbiAgICAgIG5leHRUaWNrKGZsdXNoU2NoZWR1bGVyUXVldWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiAgKi9cblxudmFyIHVpZCQyID0gMDtcblxuLyoqXG4gKiBBIHdhdGNoZXIgcGFyc2VzIGFuIGV4cHJlc3Npb24sIGNvbGxlY3RzIGRlcGVuZGVuY2llcyxcbiAqIGFuZCBmaXJlcyBjYWxsYmFjayB3aGVuIHRoZSBleHByZXNzaW9uIHZhbHVlIGNoYW5nZXMuXG4gKiBUaGlzIGlzIHVzZWQgZm9yIGJvdGggdGhlICR3YXRjaCgpIGFwaSBhbmQgZGlyZWN0aXZlcy5cbiAqL1xudmFyIFdhdGNoZXIgPSBmdW5jdGlvbiBXYXRjaGVyIChcbiAgdm0sXG4gIGV4cE9yRm4sXG4gIGNiLFxuICBvcHRpb25zLFxuICBpc1JlbmRlcldhdGNoZXJcbikge1xuICB0aGlzLnZtID0gdm07XG4gIGlmIChpc1JlbmRlcldhdGNoZXIpIHtcbiAgICB2bS5fd2F0Y2hlciA9IHRoaXM7XG4gIH1cbiAgdm0uX3dhdGNoZXJzLnB1c2godGhpcyk7XG4gIC8vIG9wdGlvbnNcbiAgaWYgKG9wdGlvbnMpIHtcbiAgICB0aGlzLmRlZXAgPSAhIW9wdGlvbnMuZGVlcDtcbiAgICB0aGlzLnVzZXIgPSAhIW9wdGlvbnMudXNlcjtcbiAgICB0aGlzLmxhenkgPSAhIW9wdGlvbnMubGF6eTtcbiAgICB0aGlzLnN5bmMgPSAhIW9wdGlvbnMuc3luYztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRlZXAgPSB0aGlzLnVzZXIgPSB0aGlzLmxhenkgPSB0aGlzLnN5bmMgPSBmYWxzZTtcbiAgfVxuICB0aGlzLmNiID0gY2I7XG4gIHRoaXMuaWQgPSArK3VpZCQyOyAvLyB1aWQgZm9yIGJhdGNoaW5nXG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgdGhpcy5kaXJ0eSA9IHRoaXMubGF6eTsgLy8gZm9yIGxhenkgd2F0Y2hlcnNcbiAgdGhpcy5kZXBzID0gW107XG4gIHRoaXMubmV3RGVwcyA9IFtdO1xuICB0aGlzLmRlcElkcyA9IG5ldyBfU2V0KCk7XG4gIHRoaXMubmV3RGVwSWRzID0gbmV3IF9TZXQoKTtcbiAgdGhpcy5leHByZXNzaW9uID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJ1xuICAgID8gZXhwT3JGbi50b1N0cmluZygpXG4gICAgOiAnJztcbiAgLy8gcGFyc2UgZXhwcmVzc2lvbiBmb3IgZ2V0dGVyXG4gIGlmICh0eXBlb2YgZXhwT3JGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuZ2V0dGVyID0gZXhwT3JGbjtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmdldHRlciA9IHBhcnNlUGF0aChleHBPckZuKTtcbiAgICBpZiAoIXRoaXMuZ2V0dGVyKSB7XG4gICAgICB0aGlzLmdldHRlciA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgICBcIkZhaWxlZCB3YXRjaGluZyBwYXRoOiBcXFwiXCIgKyBleHBPckZuICsgXCJcXFwiIFwiICtcbiAgICAgICAgJ1dhdGNoZXIgb25seSBhY2NlcHRzIHNpbXBsZSBkb3QtZGVsaW1pdGVkIHBhdGhzLiAnICtcbiAgICAgICAgJ0ZvciBmdWxsIGNvbnRyb2wsIHVzZSBhIGZ1bmN0aW9uIGluc3RlYWQuJyxcbiAgICAgICAgdm1cbiAgICAgICk7XG4gICAgfVxuICB9XG4gIHRoaXMudmFsdWUgPSB0aGlzLmxhenlcbiAgICA/IHVuZGVmaW5lZFxuICAgIDogdGhpcy5nZXQoKTtcbn07XG5cbi8qKlxuICogRXZhbHVhdGUgdGhlIGdldHRlciwgYW5kIHJlLWNvbGxlY3QgZGVwZW5kZW5jaWVzLlxuICovXG5XYXRjaGVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKCkge1xuICBwdXNoVGFyZ2V0KHRoaXMpO1xuICB2YXIgdmFsdWU7XG4gIHZhciB2bSA9IHRoaXMudm07XG4gIHRyeSB7XG4gICAgdmFsdWUgPSB0aGlzLmdldHRlci5jYWxsKHZtLCB2bSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICBoYW5kbGVFcnJvcihlLCB2bSwgKFwiZ2V0dGVyIGZvciB3YXRjaGVyIFxcXCJcIiArICh0aGlzLmV4cHJlc3Npb24pICsgXCJcXFwiXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBcInRvdWNoXCIgZXZlcnkgcHJvcGVydHkgc28gdGhleSBhcmUgYWxsIHRyYWNrZWQgYXNcbiAgICAvLyBkZXBlbmRlbmNpZXMgZm9yIGRlZXAgd2F0Y2hpbmdcbiAgICBpZiAodGhpcy5kZWVwKSB7XG4gICAgICB0cmF2ZXJzZSh2YWx1ZSk7XG4gICAgfVxuICAgIHBvcFRhcmdldCgpO1xuICAgIHRoaXMuY2xlYW51cERlcHMoKTtcbiAgfVxuICByZXR1cm4gdmFsdWVcbn07XG5cbi8qKlxuICogQWRkIGEgZGVwZW5kZW5jeSB0byB0aGlzIGRpcmVjdGl2ZS5cbiAqL1xuV2F0Y2hlci5wcm90b3R5cGUuYWRkRGVwID0gZnVuY3Rpb24gYWRkRGVwIChkZXApIHtcbiAgdmFyIGlkID0gZGVwLmlkO1xuICBpZiAoIXRoaXMubmV3RGVwSWRzLmhhcyhpZCkpIHtcbiAgICB0aGlzLm5ld0RlcElkcy5hZGQoaWQpO1xuICAgIHRoaXMubmV3RGVwcy5wdXNoKGRlcCk7XG4gICAgaWYgKCF0aGlzLmRlcElkcy5oYXMoaWQpKSB7XG4gICAgICBkZXAuYWRkU3ViKHRoaXMpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDbGVhbiB1cCBmb3IgZGVwZW5kZW5jeSBjb2xsZWN0aW9uLlxuICovXG5XYXRjaGVyLnByb3RvdHlwZS5jbGVhbnVwRGVwcyA9IGZ1bmN0aW9uIGNsZWFudXBEZXBzICgpIHtcbiAgICB2YXIgdGhpcyQxID0gdGhpcztcblxuICB2YXIgaSA9IHRoaXMuZGVwcy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICB2YXIgZGVwID0gdGhpcyQxLmRlcHNbaV07XG4gICAgaWYgKCF0aGlzJDEubmV3RGVwSWRzLmhhcyhkZXAuaWQpKSB7XG4gICAgICBkZXAucmVtb3ZlU3ViKHRoaXMkMSk7XG4gICAgfVxuICB9XG4gIHZhciB0bXAgPSB0aGlzLmRlcElkcztcbiAgdGhpcy5kZXBJZHMgPSB0aGlzLm5ld0RlcElkcztcbiAgdGhpcy5uZXdEZXBJZHMgPSB0bXA7XG4gIHRoaXMubmV3RGVwSWRzLmNsZWFyKCk7XG4gIHRtcCA9IHRoaXMuZGVwcztcbiAgdGhpcy5kZXBzID0gdGhpcy5uZXdEZXBzO1xuICB0aGlzLm5ld0RlcHMgPSB0bXA7XG4gIHRoaXMubmV3RGVwcy5sZW5ndGggPSAwO1xufTtcblxuLyoqXG4gKiBTdWJzY3JpYmVyIGludGVyZmFjZS5cbiAqIFdpbGwgYmUgY2FsbGVkIHdoZW4gYSBkZXBlbmRlbmN5IGNoYW5nZXMuXG4gKi9cbldhdGNoZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmICh0aGlzLmxhenkpIHtcbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0aGlzLnN5bmMpIHtcbiAgICB0aGlzLnJ1bigpO1xuICB9IGVsc2Uge1xuICAgIHF1ZXVlV2F0Y2hlcih0aGlzKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTY2hlZHVsZXIgam9iIGludGVyZmFjZS5cbiAqIFdpbGwgYmUgY2FsbGVkIGJ5IHRoZSBzY2hlZHVsZXIuXG4gKi9cbldhdGNoZXIucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIHJ1biAoKSB7XG4gIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgIHZhciB2YWx1ZSA9IHRoaXMuZ2V0KCk7XG4gICAgaWYgKFxuICAgICAgdmFsdWUgIT09IHRoaXMudmFsdWUgfHxcbiAgICAgIC8vIERlZXAgd2F0Y2hlcnMgYW5kIHdhdGNoZXJzIG9uIE9iamVjdC9BcnJheXMgc2hvdWxkIGZpcmUgZXZlblxuICAgICAgLy8gd2hlbiB0aGUgdmFsdWUgaXMgdGhlIHNhbWUsIGJlY2F1c2UgdGhlIHZhbHVlIG1heVxuICAgICAgLy8gaGF2ZSBtdXRhdGVkLlxuICAgICAgaXNPYmplY3QodmFsdWUpIHx8XG4gICAgICB0aGlzLmRlZXBcbiAgICApIHtcbiAgICAgIC8vIHNldCBuZXcgdmFsdWVcbiAgICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhpcy5jYi5jYWxsKHRoaXMudm0sIHZhbHVlLCBvbGRWYWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBoYW5kbGVFcnJvcihlLCB0aGlzLnZtLCAoXCJjYWxsYmFjayBmb3Igd2F0Y2hlciBcXFwiXCIgKyAodGhpcy5leHByZXNzaW9uKSArIFwiXFxcIlwiKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2IuY2FsbCh0aGlzLnZtLCB2YWx1ZSwgb2xkVmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBFdmFsdWF0ZSB0aGUgdmFsdWUgb2YgdGhlIHdhdGNoZXIuXG4gKiBUaGlzIG9ubHkgZ2V0cyBjYWxsZWQgZm9yIGxhenkgd2F0Y2hlcnMuXG4gKi9cbldhdGNoZXIucHJvdG90eXBlLmV2YWx1YXRlID0gZnVuY3Rpb24gZXZhbHVhdGUgKCkge1xuICB0aGlzLnZhbHVlID0gdGhpcy5nZXQoKTtcbiAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBEZXBlbmQgb24gYWxsIGRlcHMgY29sbGVjdGVkIGJ5IHRoaXMgd2F0Y2hlci5cbiAqL1xuV2F0Y2hlci5wcm90b3R5cGUuZGVwZW5kID0gZnVuY3Rpb24gZGVwZW5kICgpIHtcbiAgICB2YXIgdGhpcyQxID0gdGhpcztcblxuICB2YXIgaSA9IHRoaXMuZGVwcy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICB0aGlzJDEuZGVwc1tpXS5kZXBlbmQoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZW1vdmUgc2VsZiBmcm9tIGFsbCBkZXBlbmRlbmNpZXMnIHN1YnNjcmliZXIgbGlzdC5cbiAqL1xuV2F0Y2hlci5wcm90b3R5cGUudGVhcmRvd24gPSBmdW5jdGlvbiB0ZWFyZG93biAoKSB7XG4gICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgLy8gcmVtb3ZlIHNlbGYgZnJvbSB2bSdzIHdhdGNoZXIgbGlzdFxuICAgIC8vIHRoaXMgaXMgYSBzb21ld2hhdCBleHBlbnNpdmUgb3BlcmF0aW9uIHNvIHdlIHNraXAgaXRcbiAgICAvLyBpZiB0aGUgdm0gaXMgYmVpbmcgZGVzdHJveWVkLlxuICAgIGlmICghdGhpcy52bS5faXNCZWluZ0Rlc3Ryb3llZCkge1xuICAgICAgcmVtb3ZlKHRoaXMudm0uX3dhdGNoZXJzLCB0aGlzKTtcbiAgICB9XG4gICAgdmFyIGkgPSB0aGlzLmRlcHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIHRoaXMkMS5kZXBzW2ldLnJlbW92ZVN1Yih0aGlzJDEpO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB9XG59O1xuXG4vKiAgKi9cblxudmFyIHNoYXJlZFByb3BlcnR5RGVmaW5pdGlvbiA9IHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgY29uZmlndXJhYmxlOiB0cnVlLFxuICBnZXQ6IG5vb3AsXG4gIHNldDogbm9vcFxufTtcblxuZnVuY3Rpb24gcHJveHkgKHRhcmdldCwgc291cmNlS2V5LCBrZXkpIHtcbiAgc2hhcmVkUHJvcGVydHlEZWZpbml0aW9uLmdldCA9IGZ1bmN0aW9uIHByb3h5R2V0dGVyICgpIHtcbiAgICByZXR1cm4gdGhpc1tzb3VyY2VLZXldW2tleV1cbiAgfTtcbiAgc2hhcmVkUHJvcGVydHlEZWZpbml0aW9uLnNldCA9IGZ1bmN0aW9uIHByb3h5U2V0dGVyICh2YWwpIHtcbiAgICB0aGlzW3NvdXJjZUtleV1ba2V5XSA9IHZhbDtcbiAgfTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24pO1xufVxuXG5mdW5jdGlvbiBpbml0U3RhdGUgKHZtKSB7XG4gIHZtLl93YXRjaGVycyA9IFtdO1xuICB2bS5faW5saW5lQ29tcHV0ZWQgPSBudWxsO1xuICB2YXIgb3B0cyA9IHZtLiRvcHRpb25zO1xuICBpZiAob3B0cy5wcm9wcykgeyBpbml0UHJvcHModm0sIG9wdHMucHJvcHMpOyB9XG4gIGlmIChvcHRzLm1ldGhvZHMpIHsgaW5pdE1ldGhvZHModm0sIG9wdHMubWV0aG9kcyk7IH1cbiAgaWYgKG9wdHMuZGF0YSkge1xuICAgIGluaXREYXRhKHZtKTtcbiAgfSBlbHNlIHtcbiAgICBvYnNlcnZlKHZtLl9kYXRhID0ge30sIHRydWUgLyogYXNSb290RGF0YSAqLyk7XG4gIH1cbiAgaWYgKG9wdHMuY29tcHV0ZWQpIHsgaW5pdENvbXB1dGVkKHZtLCBvcHRzLmNvbXB1dGVkKTsgfVxuICBpZiAob3B0cy53YXRjaCAmJiBvcHRzLndhdGNoICE9PSBuYXRpdmVXYXRjaCkge1xuICAgIGluaXRXYXRjaCh2bSwgb3B0cy53YXRjaCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdFByb3BzICh2bSwgcHJvcHNPcHRpb25zKSB7XG4gIHZhciBwcm9wc0RhdGEgPSB2bS4kb3B0aW9ucy5wcm9wc0RhdGEgfHwge307XG4gIHZhciBwcm9wcyA9IHZtLl9wcm9wcyA9IHt9O1xuICAvLyBjYWNoZSBwcm9wIGtleXMgc28gdGhhdCBmdXR1cmUgcHJvcHMgdXBkYXRlcyBjYW4gaXRlcmF0ZSB1c2luZyBBcnJheVxuICAvLyBpbnN0ZWFkIG9mIGR5bmFtaWMgb2JqZWN0IGtleSBlbnVtZXJhdGlvbi5cbiAgdmFyIGtleXMgPSB2bS4kb3B0aW9ucy5fcHJvcEtleXMgPSBbXTtcbiAgdmFyIGlzUm9vdCA9ICF2bS4kcGFyZW50O1xuICAvLyByb290IGluc3RhbmNlIHByb3BzIHNob3VsZCBiZSBjb252ZXJ0ZWRcbiAgb2JzZXJ2ZXJTdGF0ZS5zaG91bGRDb252ZXJ0ID0gaXNSb290O1xuICB2YXIgbG9vcCA9IGZ1bmN0aW9uICgga2V5ICkge1xuICAgIGtleXMucHVzaChrZXkpO1xuICAgIHZhciB2YWx1ZSA9IHZhbGlkYXRlUHJvcChrZXksIHByb3BzT3B0aW9ucywgcHJvcHNEYXRhLCB2bSk7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgdmFyIGh5cGhlbmF0ZWRLZXkgPSBoeXBoZW5hdGUoa2V5KTtcbiAgICAgIGlmIChpc1Jlc2VydmVkQXR0cmlidXRlKGh5cGhlbmF0ZWRLZXkpIHx8XG4gICAgICAgICAgY29uZmlnLmlzUmVzZXJ2ZWRBdHRyKGh5cGhlbmF0ZWRLZXkpKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgKFwiXFxcIlwiICsgaHlwaGVuYXRlZEtleSArIFwiXFxcIiBpcyBhIHJlc2VydmVkIGF0dHJpYnV0ZSBhbmQgY2Fubm90IGJlIHVzZWQgYXMgY29tcG9uZW50IHByb3AuXCIpLFxuICAgICAgICAgIHZtXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBkZWZpbmVSZWFjdGl2ZShwcm9wcywga2V5LCB2YWx1ZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodm0uJHBhcmVudCAmJiAhaXNVcGRhdGluZ0NoaWxkQ29tcG9uZW50KSB7XG4gICAgICAgICAgd2FybihcbiAgICAgICAgICAgIFwiQXZvaWQgbXV0YXRpbmcgYSBwcm9wIGRpcmVjdGx5IHNpbmNlIHRoZSB2YWx1ZSB3aWxsIGJlIFwiICtcbiAgICAgICAgICAgIFwib3ZlcndyaXR0ZW4gd2hlbmV2ZXIgdGhlIHBhcmVudCBjb21wb25lbnQgcmUtcmVuZGVycy4gXCIgK1xuICAgICAgICAgICAgXCJJbnN0ZWFkLCB1c2UgYSBkYXRhIG9yIGNvbXB1dGVkIHByb3BlcnR5IGJhc2VkIG9uIHRoZSBwcm9wJ3MgXCIgK1xuICAgICAgICAgICAgXCJ2YWx1ZS4gUHJvcCBiZWluZyBtdXRhdGVkOiBcXFwiXCIgKyBrZXkgKyBcIlxcXCJcIixcbiAgICAgICAgICAgIHZtXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmluZVJlYWN0aXZlKHByb3BzLCBrZXksIHZhbHVlKTtcbiAgICB9XG4gICAgLy8gc3RhdGljIHByb3BzIGFyZSBhbHJlYWR5IHByb3hpZWQgb24gdGhlIGNvbXBvbmVudCdzIHByb3RvdHlwZVxuICAgIC8vIGR1cmluZyBWdWUuZXh0ZW5kKCkuIFdlIG9ubHkgbmVlZCB0byBwcm94eSBwcm9wcyBkZWZpbmVkIGF0XG4gICAgLy8gaW5zdGFudGlhdGlvbiBoZXJlLlxuICAgIGlmICghKGtleSBpbiB2bSkpIHtcbiAgICAgIHByb3h5KHZtLCBcIl9wcm9wc1wiLCBrZXkpO1xuICAgIH1cbiAgfTtcblxuICBmb3IgKHZhciBrZXkgaW4gcHJvcHNPcHRpb25zKSBsb29wKCBrZXkgKTtcbiAgb2JzZXJ2ZXJTdGF0ZS5zaG91bGRDb252ZXJ0ID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaW5pdERhdGEgKHZtKSB7XG4gIHZhciBkYXRhID0gdm0uJG9wdGlvbnMuZGF0YTtcbiAgZGF0YSA9IHZtLl9kYXRhID0gdHlwZW9mIGRhdGEgPT09ICdmdW5jdGlvbidcbiAgICA/IGdldERhdGEoZGF0YSwgdm0pXG4gICAgOiBkYXRhIHx8IHt9O1xuICBpZiAoIWlzUGxhaW5PYmplY3QoZGF0YSkpIHtcbiAgICBkYXRhID0ge307XG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgJ2RhdGEgZnVuY3Rpb25zIHNob3VsZCByZXR1cm4gYW4gb2JqZWN0OlxcbicgK1xuICAgICAgJ2h0dHBzOi8vdnVlanMub3JnL3YyL2d1aWRlL2NvbXBvbmVudHMuaHRtbCNkYXRhLU11c3QtQmUtYS1GdW5jdGlvbicsXG4gICAgICB2bVxuICAgICk7XG4gIH1cbiAgLy8gcHJveHkgZGF0YSBvbiBpbnN0YW5jZVxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICB2YXIgcHJvcHMgPSB2bS4kb3B0aW9ucy5wcm9wcztcbiAgdmFyIG1ldGhvZHMgPSB2bS4kb3B0aW9ucy5tZXRob2RzO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGlmIChtZXRob2RzICYmIGhhc093bihtZXRob2RzLCBrZXkpKSB7XG4gICAgICAgIHdhcm4oXG4gICAgICAgICAgKFwiTWV0aG9kIFxcXCJcIiArIGtleSArIFwiXFxcIiBoYXMgYWxyZWFkeSBiZWVuIGRlZmluZWQgYXMgYSBkYXRhIHByb3BlcnR5LlwiKSxcbiAgICAgICAgICB2bVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJvcHMgJiYgaGFzT3duKHByb3BzLCBrZXkpKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHdhcm4oXG4gICAgICAgIFwiVGhlIGRhdGEgcHJvcGVydHkgXFxcIlwiICsga2V5ICsgXCJcXFwiIGlzIGFscmVhZHkgZGVjbGFyZWQgYXMgYSBwcm9wLiBcIiArXG4gICAgICAgIFwiVXNlIHByb3AgZGVmYXVsdCB2YWx1ZSBpbnN0ZWFkLlwiLFxuICAgICAgICB2bVxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKCFpc1Jlc2VydmVkKGtleSkpIHtcbiAgICAgIHByb3h5KHZtLCBcIl9kYXRhXCIsIGtleSk7XG4gICAgfVxuICB9XG4gIC8vIG9ic2VydmUgZGF0YVxuICBvYnNlcnZlKGRhdGEsIHRydWUgLyogYXNSb290RGF0YSAqLyk7XG59XG5cbmZ1bmN0aW9uIGdldERhdGEgKGRhdGEsIHZtKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRhdGEuY2FsbCh2bSwgdm0pXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBoYW5kbGVFcnJvcihlLCB2bSwgXCJkYXRhKClcIik7XG4gICAgcmV0dXJuIHt9XG4gIH1cbn1cblxudmFyIGNvbXB1dGVkV2F0Y2hlck9wdGlvbnMgPSB7IGxhenk6IHRydWUgfTtcblxuZnVuY3Rpb24gaW5pdENvbXB1dGVkICh2bSwgY29tcHV0ZWQpIHtcbiAgLy8gJGZsb3ctZGlzYWJsZS1saW5lXG4gIHZhciB3YXRjaGVycyA9IHZtLl9jb21wdXRlZFdhdGNoZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgLy8gY29tcHV0ZWQgcHJvcGVydGllcyBhcmUganVzdCBnZXR0ZXJzIGR1cmluZyBTU1JcbiAgdmFyIGlzU1NSID0gaXNTZXJ2ZXJSZW5kZXJpbmcoKTtcblxuICBmb3IgKHZhciBrZXkgaW4gY29tcHV0ZWQpIHtcbiAgICB2YXIgdXNlckRlZiA9IGNvbXB1dGVkW2tleV07XG4gICAgdmFyIGdldHRlciA9IHR5cGVvZiB1c2VyRGVmID09PSAnZnVuY3Rpb24nID8gdXNlckRlZiA6IHVzZXJEZWYuZ2V0O1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGdldHRlciA9PSBudWxsKSB7XG4gICAgICB3YXJuKFxuICAgICAgICAoXCJHZXR0ZXIgaXMgbWlzc2luZyBmb3IgY29tcHV0ZWQgcHJvcGVydHkgXFxcIlwiICsga2V5ICsgXCJcXFwiLlwiKSxcbiAgICAgICAgdm1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCFpc1NTUikge1xuICAgICAgLy8gY3JlYXRlIGludGVybmFsIHdhdGNoZXIgZm9yIHRoZSBjb21wdXRlZCBwcm9wZXJ0eS5cbiAgICAgIHdhdGNoZXJzW2tleV0gPSBuZXcgV2F0Y2hlcihcbiAgICAgICAgdm0sXG4gICAgICAgIGdldHRlciB8fCBub29wLFxuICAgICAgICBub29wLFxuICAgICAgICBjb21wdXRlZFdhdGNoZXJPcHRpb25zXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIGNvbXBvbmVudC1kZWZpbmVkIGNvbXB1dGVkIHByb3BlcnRpZXMgYXJlIGFscmVhZHkgZGVmaW5lZCBvbiB0aGVcbiAgICAvLyBjb21wb25lbnQgcHJvdG90eXBlLiBXZSBvbmx5IG5lZWQgdG8gZGVmaW5lIGNvbXB1dGVkIHByb3BlcnRpZXMgZGVmaW5lZFxuICAgIC8vIGF0IGluc3RhbnRpYXRpb24gaGVyZS5cbiAgICBpZiAoIShrZXkgaW4gdm0pKSB7XG4gICAgICBkZWZpbmVDb21wdXRlZCh2bSwga2V5LCB1c2VyRGVmKTtcbiAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGlmIChrZXkgaW4gdm0uJGRhdGEpIHtcbiAgICAgICAgd2FybigoXCJUaGUgY29tcHV0ZWQgcHJvcGVydHkgXFxcIlwiICsga2V5ICsgXCJcXFwiIGlzIGFscmVhZHkgZGVmaW5lZCBpbiBkYXRhLlwiKSwgdm0pO1xuICAgICAgfSBlbHNlIGlmICh2bS4kb3B0aW9ucy5wcm9wcyAmJiBrZXkgaW4gdm0uJG9wdGlvbnMucHJvcHMpIHtcbiAgICAgICAgd2FybigoXCJUaGUgY29tcHV0ZWQgcHJvcGVydHkgXFxcIlwiICsga2V5ICsgXCJcXFwiIGlzIGFscmVhZHkgZGVmaW5lZCBhcyBhIHByb3AuXCIpLCB2bSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlZmluZUNvbXB1dGVkIChcbiAgdGFyZ2V0LFxuICBrZXksXG4gIHVzZXJEZWZcbikge1xuICB2YXIgc2hvdWxkQ2FjaGUgPSAhaXNTZXJ2ZXJSZW5kZXJpbmcoKTtcbiAgaWYgKHR5cGVvZiB1c2VyRGVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgc2hhcmVkUHJvcGVydHlEZWZpbml0aW9uLmdldCA9IHNob3VsZENhY2hlXG4gICAgICA/IGNyZWF0ZUNvbXB1dGVkR2V0dGVyKGtleSlcbiAgICAgIDogdXNlckRlZjtcbiAgICBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24uc2V0ID0gbm9vcDtcbiAgfSBlbHNlIHtcbiAgICBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24uZ2V0ID0gdXNlckRlZi5nZXRcbiAgICAgID8gc2hvdWxkQ2FjaGUgJiYgdXNlckRlZi5jYWNoZSAhPT0gZmFsc2VcbiAgICAgICAgPyBjcmVhdGVDb21wdXRlZEdldHRlcihrZXkpXG4gICAgICAgIDogdXNlckRlZi5nZXRcbiAgICAgIDogbm9vcDtcbiAgICBzaGFyZWRQcm9wZXJ0eURlZmluaXRpb24uc2V0ID0gdXNlckRlZi5zZXRcbiAgICAgID8gdXNlckRlZi5zZXRcbiAgICAgIDogbm9vcDtcbiAgfVxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJlxuICAgICAgc2hhcmVkUHJvcGVydHlEZWZpbml0aW9uLnNldCA9PT0gbm9vcCkge1xuICAgIHNoYXJlZFByb3BlcnR5RGVmaW5pdGlvbi5zZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB3YXJuKFxuICAgICAgICAoXCJDb21wdXRlZCBwcm9wZXJ0eSBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgd2FzIGFzc2lnbmVkIHRvIGJ1dCBpdCBoYXMgbm8gc2V0dGVyLlwiKSxcbiAgICAgICAgdGhpc1xuICAgICAgKTtcbiAgICB9O1xuICB9XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgc2hhcmVkUHJvcGVydHlEZWZpbml0aW9uKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQ29tcHV0ZWRHZXR0ZXIgKGtleSkge1xuICByZXR1cm4gZnVuY3Rpb24gY29tcHV0ZWRHZXR0ZXIgKCkge1xuICAgIHZhciB3YXRjaGVyID0gdGhpcy5fY29tcHV0ZWRXYXRjaGVycyAmJiB0aGlzLl9jb21wdXRlZFdhdGNoZXJzW2tleV07XG4gICAgaWYgKHdhdGNoZXIpIHtcbiAgICAgIGlmICh3YXRjaGVyLmRpcnR5KSB7XG4gICAgICAgIHdhdGNoZXIuZXZhbHVhdGUoKTtcbiAgICAgIH1cbiAgICAgIGlmIChEZXAudGFyZ2V0KSB7XG4gICAgICAgIHdhdGNoZXIuZGVwZW5kKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2F0Y2hlci52YWx1ZVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0TWV0aG9kcyAodm0sIG1ldGhvZHMpIHtcbiAgdmFyIHByb3BzID0gdm0uJG9wdGlvbnMucHJvcHM7XG4gIGZvciAodmFyIGtleSBpbiBtZXRob2RzKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIGlmIChtZXRob2RzW2tleV0gPT0gbnVsbCkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgIFwiTWV0aG9kIFxcXCJcIiArIGtleSArIFwiXFxcIiBoYXMgYW4gdW5kZWZpbmVkIHZhbHVlIGluIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbi4gXCIgK1xuICAgICAgICAgIFwiRGlkIHlvdSByZWZlcmVuY2UgdGhlIGZ1bmN0aW9uIGNvcnJlY3RseT9cIixcbiAgICAgICAgICB2bVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKHByb3BzICYmIGhhc093bihwcm9wcywga2V5KSkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgIChcIk1ldGhvZCBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgaGFzIGFscmVhZHkgYmVlbiBkZWZpbmVkIGFzIGEgcHJvcC5cIiksXG4gICAgICAgICAgdm1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICgoa2V5IGluIHZtKSAmJiBpc1Jlc2VydmVkKGtleSkpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICBcIk1ldGhvZCBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgY29uZmxpY3RzIHdpdGggYW4gZXhpc3RpbmcgVnVlIGluc3RhbmNlIG1ldGhvZC4gXCIgK1xuICAgICAgICAgIFwiQXZvaWQgZGVmaW5pbmcgY29tcG9uZW50IG1ldGhvZHMgdGhhdCBzdGFydCB3aXRoIF8gb3IgJC5cIlxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICB2bVtrZXldID0gbWV0aG9kc1trZXldID09IG51bGwgPyBub29wIDogYmluZChtZXRob2RzW2tleV0sIHZtKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0V2F0Y2ggKHZtLCB3YXRjaCkge1xuICBmb3IgKHZhciBrZXkgaW4gd2F0Y2gpIHtcbiAgICB2YXIgaGFuZGxlciA9IHdhdGNoW2tleV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjcmVhdGVXYXRjaGVyKHZtLCBrZXksIGhhbmRsZXJbaV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjcmVhdGVXYXRjaGVyKHZtLCBrZXksIGhhbmRsZXIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVXYXRjaGVyIChcbiAgdm0sXG4gIGtleU9yRm4sXG4gIGhhbmRsZXIsXG4gIG9wdGlvbnNcbikge1xuICBpZiAoaXNQbGFpbk9iamVjdChoYW5kbGVyKSkge1xuICAgIG9wdGlvbnMgPSBoYW5kbGVyO1xuICAgIGhhbmRsZXIgPSBoYW5kbGVyLmhhbmRsZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnc3RyaW5nJykge1xuICAgIGhhbmRsZXIgPSB2bVtoYW5kbGVyXTtcbiAgfVxuICByZXR1cm4gdm0uJHdhdGNoKGtleU9yRm4sIGhhbmRsZXIsIG9wdGlvbnMpXG59XG5cbmZ1bmN0aW9uIHN0YXRlTWl4aW4gKFZ1ZSkge1xuICAvLyBmbG93IHNvbWVob3cgaGFzIHByb2JsZW1zIHdpdGggZGlyZWN0bHkgZGVjbGFyZWQgZGVmaW5pdGlvbiBvYmplY3RcbiAgLy8gd2hlbiB1c2luZyBPYmplY3QuZGVmaW5lUHJvcGVydHksIHNvIHdlIGhhdmUgdG8gcHJvY2VkdXJhbGx5IGJ1aWxkIHVwXG4gIC8vIHRoZSBvYmplY3QgaGVyZS5cbiAgdmFyIGRhdGFEZWYgPSB7fTtcbiAgZGF0YURlZi5nZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9kYXRhIH07XG4gIHZhciBwcm9wc0RlZiA9IHt9O1xuICBwcm9wc0RlZi5nZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9wcm9wcyB9O1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGRhdGFEZWYuc2V0ID0gZnVuY3Rpb24gKG5ld0RhdGEpIHtcbiAgICAgIHdhcm4oXG4gICAgICAgICdBdm9pZCByZXBsYWNpbmcgaW5zdGFuY2Ugcm9vdCAkZGF0YS4gJyArXG4gICAgICAgICdVc2UgbmVzdGVkIGRhdGEgcHJvcGVydGllcyBpbnN0ZWFkLicsXG4gICAgICAgIHRoaXNcbiAgICAgICk7XG4gICAgfTtcbiAgICBwcm9wc0RlZi5zZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB3YXJuKFwiJHByb3BzIGlzIHJlYWRvbmx5LlwiLCB0aGlzKTtcbiAgICB9O1xuICB9XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShWdWUucHJvdG90eXBlLCAnJGRhdGEnLCBkYXRhRGVmKTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFZ1ZS5wcm90b3R5cGUsICckcHJvcHMnLCBwcm9wc0RlZik7XG5cbiAgVnVlLnByb3RvdHlwZS4kc2V0ID0gc2V0O1xuICBWdWUucHJvdG90eXBlLiRkZWxldGUgPSBkZWw7XG5cbiAgVnVlLnByb3RvdHlwZS4kd2F0Y2ggPSBmdW5jdGlvbiAoXG4gICAgZXhwT3JGbixcbiAgICBjYixcbiAgICBvcHRpb25zXG4gICkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgaWYgKGlzUGxhaW5PYmplY3QoY2IpKSB7XG4gICAgICByZXR1cm4gY3JlYXRlV2F0Y2hlcih2bSwgZXhwT3JGbiwgY2IsIG9wdGlvbnMpXG4gICAgfVxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMudXNlciA9IHRydWU7XG4gICAgdmFyIHdhdGNoZXIgPSBuZXcgV2F0Y2hlcih2bSwgZXhwT3JGbiwgY2IsIG9wdGlvbnMpO1xuICAgIGlmIChvcHRpb25zLmltbWVkaWF0ZSkge1xuICAgICAgY2IuY2FsbCh2bSwgd2F0Y2hlci52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiB1bndhdGNoRm4gKCkge1xuICAgICAgd2F0Y2hlci50ZWFyZG93bigpO1xuICAgIH1cbiAgfTtcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGluaXRQcm92aWRlICh2bSkge1xuICB2YXIgcHJvdmlkZSA9IHZtLiRvcHRpb25zLnByb3ZpZGU7XG4gIGlmIChwcm92aWRlKSB7XG4gICAgdm0uX3Byb3ZpZGVkID0gdHlwZW9mIHByb3ZpZGUgPT09ICdmdW5jdGlvbidcbiAgICAgID8gcHJvdmlkZS5jYWxsKHZtKVxuICAgICAgOiBwcm92aWRlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRJbmplY3Rpb25zICh2bSkge1xuICB2YXIgcmVzdWx0ID0gcmVzb2x2ZUluamVjdCh2bS4kb3B0aW9ucy5pbmplY3QsIHZtKTtcbiAgaWYgKHJlc3VsdCkge1xuICAgIG9ic2VydmVyU3RhdGUuc2hvdWxkQ29udmVydCA9IGZhbHNlO1xuICAgIE9iamVjdC5rZXlzKHJlc3VsdCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgZGVmaW5lUmVhY3RpdmUodm0sIGtleSwgcmVzdWx0W2tleV0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB3YXJuKFxuICAgICAgICAgICAgXCJBdm9pZCBtdXRhdGluZyBhbiBpbmplY3RlZCB2YWx1ZSBkaXJlY3RseSBzaW5jZSB0aGUgY2hhbmdlcyB3aWxsIGJlIFwiICtcbiAgICAgICAgICAgIFwib3ZlcndyaXR0ZW4gd2hlbmV2ZXIgdGhlIHByb3ZpZGVkIGNvbXBvbmVudCByZS1yZW5kZXJzLiBcIiArXG4gICAgICAgICAgICBcImluamVjdGlvbiBiZWluZyBtdXRhdGVkOiBcXFwiXCIgKyBrZXkgKyBcIlxcXCJcIixcbiAgICAgICAgICAgIHZtXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWZpbmVSZWFjdGl2ZSh2bSwga2V5LCByZXN1bHRba2V5XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgb2JzZXJ2ZXJTdGF0ZS5zaG91bGRDb252ZXJ0ID0gdHJ1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlSW5qZWN0IChpbmplY3QsIHZtKSB7XG4gIGlmIChpbmplY3QpIHtcbiAgICAvLyBpbmplY3QgaXMgOmFueSBiZWNhdXNlIGZsb3cgaXMgbm90IHNtYXJ0IGVub3VnaCB0byBmaWd1cmUgb3V0IGNhY2hlZFxuICAgIHZhciByZXN1bHQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHZhciBrZXlzID0gaGFzU3ltYm9sXG4gICAgICA/IFJlZmxlY3Qub3duS2V5cyhpbmplY3QpLmZpbHRlcihmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGluamVjdCwga2V5KS5lbnVtZXJhYmxlXG4gICAgICB9KVxuICAgICAgOiBPYmplY3Qua2V5cyhpbmplY3QpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgIHZhciBwcm92aWRlS2V5ID0gaW5qZWN0W2tleV0uZnJvbTtcbiAgICAgIHZhciBzb3VyY2UgPSB2bTtcbiAgICAgIHdoaWxlIChzb3VyY2UpIHtcbiAgICAgICAgaWYgKHNvdXJjZS5fcHJvdmlkZWQgJiYgcHJvdmlkZUtleSBpbiBzb3VyY2UuX3Byb3ZpZGVkKSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0gPSBzb3VyY2UuX3Byb3ZpZGVkW3Byb3ZpZGVLZXldO1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgICAgc291cmNlID0gc291cmNlLiRwYXJlbnQ7XG4gICAgICB9XG4gICAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgICBpZiAoJ2RlZmF1bHQnIGluIGluamVjdFtrZXldKSB7XG4gICAgICAgICAgdmFyIHByb3ZpZGVEZWZhdWx0ID0gaW5qZWN0W2tleV0uZGVmYXVsdDtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IHR5cGVvZiBwcm92aWRlRGVmYXVsdCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgPyBwcm92aWRlRGVmYXVsdC5jYWxsKHZtKVxuICAgICAgICAgICAgOiBwcm92aWRlRGVmYXVsdDtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgd2FybigoXCJJbmplY3Rpb24gXFxcIlwiICsga2V5ICsgXCJcXFwiIG5vdCBmb3VuZFwiKSwgdm0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufVxuXG4vKiAgKi9cblxuLyoqXG4gKiBSdW50aW1lIGhlbHBlciBmb3IgcmVuZGVyaW5nIHYtZm9yIGxpc3RzLlxuICovXG5mdW5jdGlvbiByZW5kZXJMaXN0IChcbiAgdmFsLFxuICByZW5kZXJcbikge1xuICB2YXIgcmV0LCBpLCBsLCBrZXlzLCBrZXk7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbCkgfHwgdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXQgPSBuZXcgQXJyYXkodmFsLmxlbmd0aCk7XG4gICAgZm9yIChpID0gMCwgbCA9IHZhbC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHJldFtpXSA9IHJlbmRlcih2YWxbaV0sIGkpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHJldCA9IG5ldyBBcnJheSh2YWwpO1xuICAgIGZvciAoaSA9IDA7IGkgPCB2YWw7IGkrKykge1xuICAgICAgcmV0W2ldID0gcmVuZGVyKGkgKyAxLCBpKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QodmFsKSkge1xuICAgIGtleXMgPSBPYmplY3Qua2V5cyh2YWwpO1xuICAgIHJldCA9IG5ldyBBcnJheShrZXlzLmxlbmd0aCk7XG4gICAgZm9yIChpID0gMCwgbCA9IGtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgcmV0W2ldID0gcmVuZGVyKHZhbFtrZXldLCBrZXksIGkpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNEZWYocmV0KSkge1xuICAgIChyZXQpLl9pc1ZMaXN0ID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbi8qICAqL1xuXG4vKipcbiAqIFJ1bnRpbWUgaGVscGVyIGZvciByZW5kZXJpbmcgPHNsb3Q+XG4gKi9cbmZ1bmN0aW9uIHJlbmRlclNsb3QgKFxuICBuYW1lLFxuICBmYWxsYmFjayxcbiAgcHJvcHMsXG4gIGJpbmRPYmplY3Rcbikge1xuICB2YXIgc2NvcGVkU2xvdEZuID0gdGhpcy4kc2NvcGVkU2xvdHNbbmFtZV07XG4gIHZhciBub2RlcztcbiAgaWYgKHNjb3BlZFNsb3RGbikgeyAvLyBzY29wZWQgc2xvdFxuICAgIHByb3BzID0gcHJvcHMgfHwge307XG4gICAgaWYgKGJpbmRPYmplY3QpIHtcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmICFpc09iamVjdChiaW5kT2JqZWN0KSkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgICdzbG90IHYtYmluZCB3aXRob3V0IGFyZ3VtZW50IGV4cGVjdHMgYW4gT2JqZWN0JyxcbiAgICAgICAgICB0aGlzXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBwcm9wcyA9IGV4dGVuZChleHRlbmQoe30sIGJpbmRPYmplY3QpLCBwcm9wcyk7XG4gICAgfVxuICAgIG5vZGVzID0gc2NvcGVkU2xvdEZuKHByb3BzKSB8fCBmYWxsYmFjaztcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xvdE5vZGVzID0gdGhpcy4kc2xvdHNbbmFtZV07XG4gICAgLy8gd2FybiBkdXBsaWNhdGUgc2xvdCB1c2FnZVxuICAgIGlmIChzbG90Tm9kZXMpIHtcbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHNsb3ROb2Rlcy5fcmVuZGVyZWQpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICBcIkR1cGxpY2F0ZSBwcmVzZW5jZSBvZiBzbG90IFxcXCJcIiArIG5hbWUgKyBcIlxcXCIgZm91bmQgaW4gdGhlIHNhbWUgcmVuZGVyIHRyZWUgXCIgK1xuICAgICAgICAgIFwiLSB0aGlzIHdpbGwgbGlrZWx5IGNhdXNlIHJlbmRlciBlcnJvcnMuXCIsXG4gICAgICAgICAgdGhpc1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgc2xvdE5vZGVzLl9yZW5kZXJlZCA9IHRydWU7XG4gICAgfVxuICAgIG5vZGVzID0gc2xvdE5vZGVzIHx8IGZhbGxiYWNrO1xuICB9XG5cbiAgdmFyIHRhcmdldCA9IHByb3BzICYmIHByb3BzLnNsb3Q7XG4gIGlmICh0YXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy4kY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnLCB7IHNsb3Q6IHRhcmdldCB9LCBub2RlcylcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbm9kZXNcbiAgfVxufVxuXG4vKiAgKi9cblxuLyoqXG4gKiBSdW50aW1lIGhlbHBlciBmb3IgcmVzb2x2aW5nIGZpbHRlcnNcbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUZpbHRlciAoaWQpIHtcbiAgcmV0dXJuIHJlc29sdmVBc3NldCh0aGlzLiRvcHRpb25zLCAnZmlsdGVycycsIGlkLCB0cnVlKSB8fCBpZGVudGl0eVxufVxuXG4vKiAgKi9cblxuLyoqXG4gKiBSdW50aW1lIGhlbHBlciBmb3IgY2hlY2tpbmcga2V5Q29kZXMgZnJvbSBjb25maWcuXG4gKiBleHBvc2VkIGFzIFZ1ZS5wcm90b3R5cGUuX2tcbiAqIHBhc3NpbmcgaW4gZXZlbnRLZXlOYW1lIGFzIGxhc3QgYXJndW1lbnQgc2VwYXJhdGVseSBmb3IgYmFja3dhcmRzIGNvbXBhdFxuICovXG5mdW5jdGlvbiBjaGVja0tleUNvZGVzIChcbiAgZXZlbnRLZXlDb2RlLFxuICBrZXksXG4gIGJ1aWx0SW5BbGlhcyxcbiAgZXZlbnRLZXlOYW1lXG4pIHtcbiAgdmFyIGtleUNvZGVzID0gY29uZmlnLmtleUNvZGVzW2tleV0gfHwgYnVpbHRJbkFsaWFzO1xuICBpZiAoa2V5Q29kZXMpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlDb2RlcykpIHtcbiAgICAgIHJldHVybiBrZXlDb2Rlcy5pbmRleE9mKGV2ZW50S2V5Q29kZSkgPT09IC0xXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBrZXlDb2RlcyAhPT0gZXZlbnRLZXlDb2RlXG4gICAgfVxuICB9IGVsc2UgaWYgKGV2ZW50S2V5TmFtZSkge1xuICAgIHJldHVybiBoeXBoZW5hdGUoZXZlbnRLZXlOYW1lKSAhPT0ga2V5XG4gIH1cbn1cblxuLyogICovXG5cbi8qKlxuICogUnVudGltZSBoZWxwZXIgZm9yIG1lcmdpbmcgdi1iaW5kPVwib2JqZWN0XCIgaW50byBhIFZOb2RlJ3MgZGF0YS5cbiAqL1xuZnVuY3Rpb24gYmluZE9iamVjdFByb3BzIChcbiAgZGF0YSxcbiAgdGFnLFxuICB2YWx1ZSxcbiAgYXNQcm9wLFxuICBpc1N5bmNcbikge1xuICBpZiAodmFsdWUpIHtcbiAgICBpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgICAndi1iaW5kIHdpdGhvdXQgYXJndW1lbnQgZXhwZWN0cyBhbiBPYmplY3Qgb3IgQXJyYXkgdmFsdWUnLFxuICAgICAgICB0aGlzXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSB0b09iamVjdCh2YWx1ZSk7XG4gICAgICB9XG4gICAgICB2YXIgaGFzaDtcbiAgICAgIHZhciBsb29wID0gZnVuY3Rpb24gKCBrZXkgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBrZXkgPT09ICdjbGFzcycgfHxcbiAgICAgICAgICBrZXkgPT09ICdzdHlsZScgfHxcbiAgICAgICAgICBpc1Jlc2VydmVkQXR0cmlidXRlKGtleSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgaGFzaCA9IGRhdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHR5cGUgPSBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMudHlwZTtcbiAgICAgICAgICBoYXNoID0gYXNQcm9wIHx8IGNvbmZpZy5tdXN0VXNlUHJvcCh0YWcsIHR5cGUsIGtleSlcbiAgICAgICAgICAgID8gZGF0YS5kb21Qcm9wcyB8fCAoZGF0YS5kb21Qcm9wcyA9IHt9KVxuICAgICAgICAgICAgOiBkYXRhLmF0dHJzIHx8IChkYXRhLmF0dHJzID0ge30pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKGtleSBpbiBoYXNoKSkge1xuICAgICAgICAgIGhhc2hba2V5XSA9IHZhbHVlW2tleV07XG5cbiAgICAgICAgICBpZiAoaXNTeW5jKSB7XG4gICAgICAgICAgICB2YXIgb24gPSBkYXRhLm9uIHx8IChkYXRhLm9uID0ge30pO1xuICAgICAgICAgICAgb25bKFwidXBkYXRlOlwiICsga2V5KV0gPSBmdW5jdGlvbiAoJGV2ZW50KSB7XG4gICAgICAgICAgICAgIHZhbHVlW2tleV0gPSAkZXZlbnQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlKSBsb29wKCBrZXkgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRhdGFcbn1cblxuLyogICovXG5cbi8qKlxuICogUnVudGltZSBoZWxwZXIgZm9yIHJlbmRlcmluZyBzdGF0aWMgdHJlZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclN0YXRpYyAoXG4gIGluZGV4LFxuICBpc0luRm9yXG4pIHtcbiAgdmFyIGNhY2hlZCA9IHRoaXMuX3N0YXRpY1RyZWVzIHx8ICh0aGlzLl9zdGF0aWNUcmVlcyA9IFtdKTtcbiAgdmFyIHRyZWUgPSBjYWNoZWRbaW5kZXhdO1xuICAvLyBpZiBoYXMgYWxyZWFkeS1yZW5kZXJlZCBzdGF0aWMgdHJlZSBhbmQgbm90IGluc2lkZSB2LWZvcixcbiAgLy8gd2UgY2FuIHJldXNlIHRoZSBzYW1lIHRyZWUgYnkgZG9pbmcgYSBzaGFsbG93IGNsb25lLlxuICBpZiAodHJlZSAmJiAhaXNJbkZvcikge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHRyZWUpXG4gICAgICA/IGNsb25lVk5vZGVzKHRyZWUpXG4gICAgICA6IGNsb25lVk5vZGUodHJlZSlcbiAgfVxuICAvLyBvdGhlcndpc2UsIHJlbmRlciBhIGZyZXNoIHRyZWUuXG4gIHRyZWUgPSBjYWNoZWRbaW5kZXhdID0gdGhpcy4kb3B0aW9ucy5zdGF0aWNSZW5kZXJGbnNbaW5kZXhdLmNhbGwoXG4gICAgdGhpcy5fcmVuZGVyUHJveHksXG4gICAgbnVsbCxcbiAgICB0aGlzIC8vIGZvciByZW5kZXIgZm5zIGdlbmVyYXRlZCBmb3IgZnVuY3Rpb25hbCBjb21wb25lbnQgdGVtcGxhdGVzXG4gICk7XG4gIG1hcmtTdGF0aWModHJlZSwgKFwiX19zdGF0aWNfX1wiICsgaW5kZXgpLCBmYWxzZSk7XG4gIHJldHVybiB0cmVlXG59XG5cbi8qKlxuICogUnVudGltZSBoZWxwZXIgZm9yIHYtb25jZS5cbiAqIEVmZmVjdGl2ZWx5IGl0IG1lYW5zIG1hcmtpbmcgdGhlIG5vZGUgYXMgc3RhdGljIHdpdGggYSB1bmlxdWUga2V5LlxuICovXG5mdW5jdGlvbiBtYXJrT25jZSAoXG4gIHRyZWUsXG4gIGluZGV4LFxuICBrZXlcbikge1xuICBtYXJrU3RhdGljKHRyZWUsIChcIl9fb25jZV9fXCIgKyBpbmRleCArIChrZXkgPyAoXCJfXCIgKyBrZXkpIDogXCJcIikpLCB0cnVlKTtcbiAgcmV0dXJuIHRyZWVcbn1cblxuZnVuY3Rpb24gbWFya1N0YXRpYyAoXG4gIHRyZWUsXG4gIGtleSxcbiAgaXNPbmNlXG4pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodHJlZSkpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRyZWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0cmVlW2ldICYmIHR5cGVvZiB0cmVlW2ldICE9PSAnc3RyaW5nJykge1xuICAgICAgICBtYXJrU3RhdGljTm9kZSh0cmVlW2ldLCAoa2V5ICsgXCJfXCIgKyBpKSwgaXNPbmNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbWFya1N0YXRpY05vZGUodHJlZSwga2V5LCBpc09uY2UpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hcmtTdGF0aWNOb2RlIChub2RlLCBrZXksIGlzT25jZSkge1xuICBub2RlLmlzU3RhdGljID0gdHJ1ZTtcbiAgbm9kZS5rZXkgPSBrZXk7XG4gIG5vZGUuaXNPbmNlID0gaXNPbmNlO1xufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gYmluZE9iamVjdExpc3RlbmVycyAoZGF0YSwgdmFsdWUpIHtcbiAgaWYgKHZhbHVlKSB7XG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgICAndi1vbiB3aXRob3V0IGFyZ3VtZW50IGV4cGVjdHMgYW4gT2JqZWN0IHZhbHVlJyxcbiAgICAgICAgdGhpc1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIG9uID0gZGF0YS5vbiA9IGRhdGEub24gPyBleHRlbmQoe30sIGRhdGEub24pIDoge307XG4gICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gb25ba2V5XTtcbiAgICAgICAgdmFyIG91cnMgPSB2YWx1ZVtrZXldO1xuICAgICAgICBvbltrZXldID0gZXhpc3RpbmcgPyBbXS5jb25jYXQoZXhpc3RpbmcsIG91cnMpIDogb3VycztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRhdGFcbn1cblxuLyogICovXG5cbi8qKlxuICogVGhpcyBydW50aW1lIGhlbHBlciBjcmVhdGVzIGFuIGlubGluZSBjb21wdXRlZCBwcm9wZXJ0eSBmb3IgY29tcG9uZW50XG4gKiBwcm9wcyB0aGF0IGNvbnRhaW4gb2JqZWN0IG9yIGFycmF5IGxpdGVyYWxzLiBUaGUgY2FjaGluZyBlbnN1cmVzIHRoZSBzYW1lXG4gKiBvYmplY3QvYXJyYXkgaXMgcmV0dXJuZWQgdW5sZXNzIHRoZSB2YWx1ZSBoYXMgaW5kZWVkIGNoYW5nZWQsIHRodXMgYXZvaWRpbmdcbiAqIHRoZSBjaGlsZCBjb21wb25lbnQgdG8gYWx3YXlzIHJlLXJlbmRlciB3aGVuIGNvbXBhcmluZyBwcm9wcyB2YWx1ZXMuXG4gKlxuICogSW5zdGFsbGVkIHRvIHRoZSBpbnN0YW5jZSBhcyBfYSwgcmVxdWlyZXMgc3BlY2lhbCBoYW5kbGluZyBpbiBwYXJzZXIgdGhhdFxuICogdHJhbnNmb3JtcyB0aGUgZm9sbG93aW5nXG4gKiAgIDxmb28gOmJhcj1cInsgYTogMSB9XCIvPlxuICogdG86XG4gKiAgIDxmb28gOmJhcj1cIl9hKDAsIGZ1bmN0aW9uKCl7cmV0dXJuIHsgYTogMSB9fSlcIlxuICovXG5mdW5jdGlvbiBjcmVhdGVJbmxpbmVDb21wdXRlZCAoaWQsIGdldHRlcikge1xuICB2YXIgdm0gPSB0aGlzO1xuICB2YXIgd2F0Y2hlcnMgPSB2bS5faW5saW5lQ29tcHV0ZWQgfHwgKHZtLl9pbmxpbmVDb21wdXRlZCA9IHt9KTtcbiAgdmFyIGNhY2hlZCQkMSA9IHdhdGNoZXJzW2lkXTtcbiAgaWYgKGNhY2hlZCQkMSkge1xuICAgIHJldHVybiBjYWNoZWQkJDEudmFsdWVcbiAgfSBlbHNlIHtcbiAgICB3YXRjaGVyc1tpZF0gPSBuZXcgV2F0Y2hlcih2bSwgZ2V0dGVyLCBub29wLCB7IHN5bmM6IHRydWUgfSk7XG4gICAgcmV0dXJuIHdhdGNoZXJzW2lkXS52YWx1ZVxuICB9XG59XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBpbnN0YWxsUmVuZGVySGVscGVycyAodGFyZ2V0KSB7XG4gIHRhcmdldC5fbyA9IG1hcmtPbmNlO1xuICB0YXJnZXQuX24gPSB0b051bWJlcjtcbiAgdGFyZ2V0Ll9zID0gdG9TdHJpbmc7XG4gIHRhcmdldC5fbCA9IHJlbmRlckxpc3Q7XG4gIHRhcmdldC5fdCA9IHJlbmRlclNsb3Q7XG4gIHRhcmdldC5fcSA9IGxvb3NlRXF1YWw7XG4gIHRhcmdldC5faSA9IGxvb3NlSW5kZXhPZjtcbiAgdGFyZ2V0Ll9tID0gcmVuZGVyU3RhdGljO1xuICB0YXJnZXQuX2YgPSByZXNvbHZlRmlsdGVyO1xuICB0YXJnZXQuX2sgPSBjaGVja0tleUNvZGVzO1xuICB0YXJnZXQuX2IgPSBiaW5kT2JqZWN0UHJvcHM7XG4gIHRhcmdldC5fdiA9IGNyZWF0ZVRleHRWTm9kZTtcbiAgdGFyZ2V0Ll9lID0gY3JlYXRlRW1wdHlWTm9kZTtcbiAgdGFyZ2V0Ll91ID0gcmVzb2x2ZVNjb3BlZFNsb3RzO1xuICB0YXJnZXQuX2cgPSBiaW5kT2JqZWN0TGlzdGVuZXJzO1xuICB0YXJnZXQuX2EgPSBjcmVhdGVJbmxpbmVDb21wdXRlZDtcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIEZ1bmN0aW9uYWxSZW5kZXJDb250ZXh0IChcbiAgZGF0YSxcbiAgcHJvcHMsXG4gIGNoaWxkcmVuLFxuICBwYXJlbnQsXG4gIEN0b3Jcbikge1xuICB2YXIgb3B0aW9ucyA9IEN0b3Iub3B0aW9ucztcbiAgdGhpcy5kYXRhID0gZGF0YTtcbiAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICB0aGlzLmxpc3RlbmVycyA9IGRhdGEub24gfHwgZW1wdHlPYmplY3Q7XG4gIHRoaXMuaW5qZWN0aW9ucyA9IHJlc29sdmVJbmplY3Qob3B0aW9ucy5pbmplY3QsIHBhcmVudCk7XG4gIHRoaXMuc2xvdHMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiByZXNvbHZlU2xvdHMoY2hpbGRyZW4sIHBhcmVudCk7IH07XG5cbiAgLy8gZW5zdXJlIHRoZSBjcmVhdGVFbGVtZW50IGZ1bmN0aW9uIGluIGZ1bmN0aW9uYWwgY29tcG9uZW50c1xuICAvLyBnZXRzIGEgdW5pcXVlIGNvbnRleHQgLSB0aGlzIGlzIG5lY2Vzc2FyeSBmb3IgY29ycmVjdCBuYW1lZCBzbG90IGNoZWNrXG4gIHZhciBjb250ZXh0Vm0gPSBPYmplY3QuY3JlYXRlKHBhcmVudCk7XG4gIHZhciBpc0NvbXBpbGVkID0gaXNUcnVlKG9wdGlvbnMuX2NvbXBpbGVkKTtcbiAgdmFyIG5lZWROb3JtYWxpemF0aW9uID0gIWlzQ29tcGlsZWQ7XG5cbiAgLy8gc3VwcG9ydCBmb3IgY29tcGlsZWQgZnVuY3Rpb25hbCB0ZW1wbGF0ZVxuICBpZiAoaXNDb21waWxlZCkge1xuICAgIC8vIGV4cG9zaW5nICRvcHRpb25zIGZvciByZW5kZXJTdGF0aWMoKVxuICAgIHRoaXMuJG9wdGlvbnMgPSBvcHRpb25zO1xuICAgIC8vIHByZS1yZXNvbHZlIHNsb3RzIGZvciByZW5kZXJTbG90KClcbiAgICB0aGlzLiRzbG90cyA9IHRoaXMuc2xvdHMoKTtcbiAgICB0aGlzLiRzY29wZWRTbG90cyA9IGRhdGEuc2NvcGVkU2xvdHMgfHwgZW1wdHlPYmplY3Q7XG4gIH1cblxuICBpZiAob3B0aW9ucy5fc2NvcGVJZCkge1xuICAgIHRoaXMuX2MgPSBmdW5jdGlvbiAoYSwgYiwgYywgZCkge1xuICAgICAgdmFyIHZub2RlID0gY3JlYXRlRWxlbWVudChjb250ZXh0Vm0sIGEsIGIsIGMsIGQsIG5lZWROb3JtYWxpemF0aW9uKTtcbiAgICAgIGlmICh2bm9kZSkge1xuICAgICAgICB2bm9kZS5mblNjb3BlSWQgPSBvcHRpb25zLl9zY29wZUlkO1xuICAgICAgICB2bm9kZS5mbkNvbnRleHQgPSBwYXJlbnQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gdm5vZGVcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX2MgPSBmdW5jdGlvbiAoYSwgYiwgYywgZCkgeyByZXR1cm4gY3JlYXRlRWxlbWVudChjb250ZXh0Vm0sIGEsIGIsIGMsIGQsIG5lZWROb3JtYWxpemF0aW9uKTsgfTtcbiAgfVxufVxuXG5pbnN0YWxsUmVuZGVySGVscGVycyhGdW5jdGlvbmFsUmVuZGVyQ29udGV4dC5wcm90b3R5cGUpO1xuXG5mdW5jdGlvbiBjcmVhdGVGdW5jdGlvbmFsQ29tcG9uZW50IChcbiAgQ3RvcixcbiAgcHJvcHNEYXRhLFxuICBkYXRhLFxuICBjb250ZXh0Vm0sXG4gIGNoaWxkcmVuXG4pIHtcbiAgdmFyIG9wdGlvbnMgPSBDdG9yLm9wdGlvbnM7XG4gIHZhciBwcm9wcyA9IHt9O1xuICB2YXIgcHJvcE9wdGlvbnMgPSBvcHRpb25zLnByb3BzO1xuICBpZiAoaXNEZWYocHJvcE9wdGlvbnMpKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHByb3BPcHRpb25zKSB7XG4gICAgICBwcm9wc1trZXldID0gdmFsaWRhdGVQcm9wKGtleSwgcHJvcE9wdGlvbnMsIHByb3BzRGF0YSB8fCBlbXB0eU9iamVjdCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChpc0RlZihkYXRhLmF0dHJzKSkgeyBtZXJnZVByb3BzKHByb3BzLCBkYXRhLmF0dHJzKTsgfVxuICAgIGlmIChpc0RlZihkYXRhLnByb3BzKSkgeyBtZXJnZVByb3BzKHByb3BzLCBkYXRhLnByb3BzKTsgfVxuICB9XG5cbiAgdmFyIHJlbmRlckNvbnRleHQgPSBuZXcgRnVuY3Rpb25hbFJlbmRlckNvbnRleHQoXG4gICAgZGF0YSxcbiAgICBwcm9wcyxcbiAgICBjaGlsZHJlbixcbiAgICBjb250ZXh0Vm0sXG4gICAgQ3RvclxuICApO1xuXG4gIHZhciB2bm9kZSA9IG9wdGlvbnMucmVuZGVyLmNhbGwobnVsbCwgcmVuZGVyQ29udGV4dC5fYywgcmVuZGVyQ29udGV4dCk7XG5cbiAgaWYgKHZub2RlIGluc3RhbmNlb2YgVk5vZGUpIHtcbiAgICB2bm9kZS5mbkNvbnRleHQgPSBjb250ZXh0Vm07XG4gICAgdm5vZGUuZm5PcHRpb25zID0gb3B0aW9ucztcbiAgICBpZiAoZGF0YS5zbG90KSB7XG4gICAgICAodm5vZGUuZGF0YSB8fCAodm5vZGUuZGF0YSA9IHt9KSkuc2xvdCA9IGRhdGEuc2xvdDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdm5vZGVcbn1cblxuZnVuY3Rpb24gbWVyZ2VQcm9wcyAodG8sIGZyb20pIHtcbiAgZm9yICh2YXIga2V5IGluIGZyb20pIHtcbiAgICB0b1tjYW1lbGl6ZShrZXkpXSA9IGZyb21ba2V5XTtcbiAgfVxufVxuXG4vKiAgKi9cblxuXG52YXIgUkVDWUNMRV9MSVNUX01BUktFUiA9ICdAaW5SZWN5Y2xlTGlzdCc7XG5cbi8vIFJlZ2lzdGVyIHRoZSBjb21wb25lbnQgaG9vayB0byB3ZWV4IG5hdGl2ZSByZW5kZXIgZW5naW5lLlxuLy8gVGhlIGhvb2sgd2lsbCBiZSB0cmlnZ2VyZWQgYnkgbmF0aXZlLCBub3QgamF2YXNjcmlwdC5cbmZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50SG9vayAoXG4gIGNvbXBvbmVudElkLFxuICB0eXBlLCAvLyBob29rIHR5cGUsIGNvdWxkIGJlIFwibGlmZWN5Y2xlXCIgb3IgXCJpbnN0YW5jZVwiXG4gIGhvb2ssIC8vIGhvb2sgbmFtZVxuICBmblxuKSB7XG4gIGlmICghZG9jdW1lbnQgfHwgIWRvY3VtZW50LnRhc2tDZW50ZXIpIHtcbiAgICB3YXJuKFwiQ2FuJ3QgZmluZCBhdmFpbGFibGUgXFxcImRvY3VtZW50XFxcIiBvciBcXFwidGFza0NlbnRlclxcXCIuXCIpO1xuICAgIHJldHVyblxuICB9XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQudGFza0NlbnRlci5yZWdpc3Rlckhvb2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQudGFza0NlbnRlci5yZWdpc3Rlckhvb2soY29tcG9uZW50SWQsIHR5cGUsIGhvb2ssIGZuKVxuICB9XG4gIHdhcm4oKFwiRmFpbGVkIHRvIHJlZ2lzdGVyIGNvbXBvbmVudCBob29rIFxcXCJcIiArIHR5cGUgKyBcIkBcIiArIGhvb2sgKyBcIiNcIiArIGNvbXBvbmVudElkICsgXCJcXFwiLlwiKSk7XG59XG5cbi8vIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIHRoZSBjb21wb25lbnQgdG8gd2VleCBuYXRpdmUgcmVuZGVyIGVuZ2luZS5cbmZ1bmN0aW9uIHVwZGF0ZUNvbXBvbmVudERhdGEgKFxuICBjb21wb25lbnRJZCxcbiAgbmV3RGF0YSxcbiAgY2FsbGJhY2tcbikge1xuICBpZiAoIWRvY3VtZW50IHx8ICFkb2N1bWVudC50YXNrQ2VudGVyKSB7XG4gICAgd2FybihcIkNhbid0IGZpbmQgYXZhaWxhYmxlIFxcXCJkb2N1bWVudFxcXCIgb3IgXFxcInRhc2tDZW50ZXJcXFwiLlwiKTtcbiAgICByZXR1cm5cbiAgfVxuICBpZiAodHlwZW9mIGRvY3VtZW50LnRhc2tDZW50ZXIudXBkYXRlRGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBkb2N1bWVudC50YXNrQ2VudGVyLnVwZGF0ZURhdGEoY29tcG9uZW50SWQsIG5ld0RhdGEsIGNhbGxiYWNrKVxuICB9XG4gIHdhcm4oKFwiRmFpbGVkIHRvIHVwZGF0ZSBjb21wb25lbnQgZGF0YSAoXCIgKyBjb21wb25lbnRJZCArIFwiKS5cIikpO1xufVxuXG4vKiAgKi9cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL0hhbmtzMTAxMDAvd2VleC1uYXRpdmUtZGlyZWN0aXZlL3RyZWUvbWFzdGVyL2NvbXBvbmVudFxuXG52YXIgdWlkJDMgPSAwO1xuXG4vLyBvdmVycmlkZSBWdWUucHJvdG90eXBlLl9pbml0XG5mdW5jdGlvbiBpbml0VmlydHVhbENvbXBvbmVudCAob3B0aW9ucykge1xuICBpZiAoIG9wdGlvbnMgPT09IHZvaWQgMCApIG9wdGlvbnMgPSB7fTtcblxuICB2YXIgdm0gPSB0aGlzO1xuICB2YXIgY29tcG9uZW50SWQgPSBvcHRpb25zLmNvbXBvbmVudElkO1xuXG4gIC8vIHZpcnR1YWwgY29tcG9uZW50IHVpZFxuICB2bS5fdWlkID0gXCJ2aXJ0dWFsLWNvbXBvbmVudC1cIiArICh1aWQkMysrKTtcblxuICAvLyBhIGZsYWcgdG8gYXZvaWQgdGhpcyBiZWluZyBvYnNlcnZlZFxuICB2bS5faXNWdWUgPSB0cnVlO1xuICAvLyBtZXJnZSBvcHRpb25zXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuX2lzQ29tcG9uZW50KSB7XG4gICAgLy8gb3B0aW1pemUgaW50ZXJuYWwgY29tcG9uZW50IGluc3RhbnRpYXRpb25cbiAgICAvLyBzaW5jZSBkeW5hbWljIG9wdGlvbnMgbWVyZ2luZyBpcyBwcmV0dHkgc2xvdywgYW5kIG5vbmUgb2YgdGhlXG4gICAgLy8gaW50ZXJuYWwgY29tcG9uZW50IG9wdGlvbnMgbmVlZHMgc3BlY2lhbCB0cmVhdG1lbnQuXG4gICAgaW5pdEludGVybmFsQ29tcG9uZW50KHZtLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICB2bS4kb3B0aW9ucyA9IG1lcmdlT3B0aW9ucyhcbiAgICAgIHJlc29sdmVDb25zdHJ1Y3Rvck9wdGlvbnModm0uY29uc3RydWN0b3IpLFxuICAgICAgb3B0aW9ucyB8fCB7fSxcbiAgICAgIHZtXG4gICAgKTtcbiAgfVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaW5pdFByb3h5KHZtKTtcbiAgfSBlbHNlIHtcbiAgICB2bS5fcmVuZGVyUHJveHkgPSB2bTtcbiAgfVxuXG4gIHZtLl9zZWxmID0gdm07XG4gIGluaXRMaWZlY3ljbGUodm0pO1xuICBpbml0RXZlbnRzKHZtKTtcbiAgaW5pdFJlbmRlcih2bSk7XG4gIGNhbGxIb29rKHZtLCAnYmVmb3JlQ3JlYXRlJyk7XG4gIGluaXRJbmplY3Rpb25zKHZtKTsgLy8gcmVzb2x2ZSBpbmplY3Rpb25zIGJlZm9yZSBkYXRhL3Byb3BzXG4gIGluaXRTdGF0ZSh2bSk7XG4gIGluaXRQcm92aWRlKHZtKTsgLy8gcmVzb2x2ZSBwcm92aWRlIGFmdGVyIGRhdGEvcHJvcHNcbiAgY2FsbEhvb2sodm0sICdjcmVhdGVkJyk7XG5cbiAgLy8gc2VuZCBpbml0aWFsIGRhdGEgdG8gbmF0aXZlXG4gIHZhciBkYXRhID0gdm0uJG9wdGlvbnMuZGF0YTtcbiAgdmFyIHBhcmFtcyA9IHR5cGVvZiBkYXRhID09PSAnZnVuY3Rpb24nXG4gICAgPyBnZXREYXRhKGRhdGEsIHZtKVxuICAgIDogZGF0YSB8fCB7fTtcbiAgaWYgKGlzUGxhaW5PYmplY3QocGFyYW1zKSkge1xuICAgIHVwZGF0ZUNvbXBvbmVudERhdGEoY29tcG9uZW50SWQsIHBhcmFtcyk7XG4gIH1cblxuICByZWdpc3RlckNvbXBvbmVudEhvb2soY29tcG9uZW50SWQsICdsaWZlY3ljbGUnLCAnYXR0YWNoJywgZnVuY3Rpb24gKCkge1xuICAgIGNhbGxIb29rKHZtLCAnYmVmb3JlTW91bnQnKTtcblxuICAgIHZhciB1cGRhdGVDb21wb25lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2bS5fdXBkYXRlKHZtLl92bm9kZSwgZmFsc2UpO1xuICAgIH07XG4gICAgbmV3IFdhdGNoZXIodm0sIHVwZGF0ZUNvbXBvbmVudCwgbm9vcCwgbnVsbCwgdHJ1ZSk7XG5cbiAgICB2bS5faXNNb3VudGVkID0gdHJ1ZTtcbiAgICBjYWxsSG9vayh2bSwgJ21vdW50ZWQnKTtcbiAgfSk7XG5cbiAgcmVnaXN0ZXJDb21wb25lbnRIb29rKGNvbXBvbmVudElkLCAnbGlmZWN5Y2xlJywgJ2RldGFjaCcsIGZ1bmN0aW9uICgpIHtcbiAgICB2bS4kZGVzdHJveSgpO1xuICB9KTtcbn1cblxuLy8gb3ZlcnJpZGUgVnVlLnByb3RvdHlwZS5fdXBkYXRlXG5mdW5jdGlvbiB1cGRhdGVWaXJ0dWFsQ29tcG9uZW50ICh2bm9kZSkge1xuICB2YXIgdm0gPSB0aGlzO1xuICB2YXIgY29tcG9uZW50SWQgPSB2bS4kb3B0aW9ucy5jb21wb25lbnRJZDtcbiAgaWYgKHZtLl9pc01vdW50ZWQpIHtcbiAgICBjYWxsSG9vayh2bSwgJ2JlZm9yZVVwZGF0ZScpO1xuICB9XG4gIHZtLl92bm9kZSA9IHZub2RlO1xuICBpZiAodm0uX2lzTW91bnRlZCAmJiBjb21wb25lbnRJZCkge1xuICAgIC8vIFRPRE86IGRhdGEgc2hvdWxkIGJlIGZpbHRlcmVkIGFuZCB3aXRob3V0IGJpbmRpbmdzXG4gICAgdmFyIGRhdGEgPSBPYmplY3QuYXNzaWduKHt9LCB2bS5fZGF0YSk7XG4gICAgdXBkYXRlQ29tcG9uZW50RGF0YShjb21wb25lbnRJZCwgZGF0YSwgZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbEhvb2sodm0sICd1cGRhdGVkJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuLy8gbGlzdGVuaW5nIG9uIG5hdGl2ZSBjYWxsYmFja1xuZnVuY3Rpb24gcmVzb2x2ZVZpcnR1YWxDb21wb25lbnQgKHZub2RlKSB7XG4gIHZhciBCYXNlQ3RvciA9IHZub2RlLmNvbXBvbmVudE9wdGlvbnMuQ3RvcjtcbiAgdmFyIFZpcnR1YWxDb21wb25lbnQgPSBCYXNlQ3Rvci5leHRlbmQoe30pO1xuICB2YXIgY2lkID0gVmlydHVhbENvbXBvbmVudC5jaWQ7XG4gIFZpcnR1YWxDb21wb25lbnQucHJvdG90eXBlLl9pbml0ID0gaW5pdFZpcnR1YWxDb21wb25lbnQ7XG4gIFZpcnR1YWxDb21wb25lbnQucHJvdG90eXBlLl91cGRhdGUgPSB1cGRhdGVWaXJ0dWFsQ29tcG9uZW50O1xuXG4gIHZub2RlLmNvbXBvbmVudE9wdGlvbnMuQ3RvciA9IEJhc2VDdG9yLmV4dGVuZCh7XG4gICAgYmVmb3JlQ3JlYXRlOiBmdW5jdGlvbiBiZWZvcmVDcmVhdGUgKCkge1xuICAgICAgLy8gY29uc3Qgdm06IENvbXBvbmVudCA9IHRoaXNcblxuICAgICAgLy8gVE9ETzogbGlzdGVuIG9uIGFsbCBldmVudHMgYW5kIGRpc3BhdGNoIHRoZW0gdG8gdGhlXG4gICAgICAvLyBjb3JyZXNwb25kaW5nIHZpcnR1YWwgY29tcG9uZW50cyBhY2NvcmRpbmcgdG8gdGhlIGNvbXBvbmVudElkLlxuICAgICAgLy8gdm0uX3ZpcnR1YWxDb21wb25lbnRzID0ge31cbiAgICAgIHZhciBjcmVhdGVWaXJ0dWFsQ29tcG9uZW50ID0gZnVuY3Rpb24gKGNvbXBvbmVudElkLCBwcm9wc0RhdGEpIHtcbiAgICAgICAgLy8gY3JlYXRlIHZpcnR1YWwgY29tcG9uZW50XG4gICAgICAgIC8vIGNvbnN0IHN1YlZtID1cbiAgICAgICAgbmV3IFZpcnR1YWxDb21wb25lbnQoe1xuICAgICAgICAgIGNvbXBvbmVudElkOiBjb21wb25lbnRJZCxcbiAgICAgICAgICBwcm9wc0RhdGE6IHByb3BzRGF0YVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgKHZtLl92aXJ0dWFsQ29tcG9uZW50cykge1xuICAgICAgICAvLyAgIHZtLl92aXJ0dWFsQ29tcG9uZW50c1tjb21wb25lbnRJZF0gPSBzdWJWbVxuICAgICAgICAvLyB9XG4gICAgICB9O1xuXG4gICAgICByZWdpc3RlckNvbXBvbmVudEhvb2soY2lkLCAnbGlmZWN5Y2xlJywgJ2NyZWF0ZScsIGNyZWF0ZVZpcnR1YWxDb21wb25lbnQpO1xuICAgIH0sXG4gICAgYmVmb3JlRGVzdHJveTogZnVuY3Rpb24gYmVmb3JlRGVzdHJveSAoKSB7XG4gICAgICBkZWxldGUgdGhpcy5fdmlydHVhbENvbXBvbmVudHM7XG4gICAgfVxuICB9KTtcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGlzUmVjeWNsYWJsZUNvbXBvbmVudCAodm5vZGUpIHtcbiAgcmV0dXJuIHZub2RlLmRhdGEuYXR0cnNcbiAgICA/IChSRUNZQ0xFX0xJU1RfTUFSS0VSIGluIHZub2RlLmRhdGEuYXR0cnMpXG4gICAgOiBmYWxzZVxufVxuXG5mdW5jdGlvbiByZW5kZXJSZWN5Y2xhYmxlQ29tcG9uZW50VGVtcGxhdGUgKHZub2RlKSB7XG4gIC8vICRmbG93LWRpc2FibGUtbGluZVxuICBkZWxldGUgdm5vZGUuZGF0YS5hdHRyc1tSRUNZQ0xFX0xJU1RfTUFSS0VSXTtcbiAgcmVzb2x2ZVZpcnR1YWxDb21wb25lbnQodm5vZGUpO1xuICB2YXIgdm0gPSBjcmVhdGVDb21wb25lbnRJbnN0YW5jZUZvclZub2RlKHZub2RlKTtcbiAgdmFyIHJlbmRlciA9ICh2bS4kb3B0aW9ucylbJ0ByZW5kZXInXTtcbiAgaWYgKHJlbmRlcikge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodm0pXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBoYW5kbGVFcnJvcihlcnIsIHZtLCBcIkByZW5kZXJcIik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHdhcm4oXG4gICAgICBcIkByZW5kZXIgZnVuY3Rpb24gbm90IGRlZmluZWQgb24gY29tcG9uZW50IHVzZWQgaW4gPHJlY3ljbGUtbGlzdD4uIFwiICtcbiAgICAgIFwiTWFrZSBzdXJlIHRvIGRlY2xhcmUgYHJlY3ljbGFibGU9XFxcInRydWVcXFwiYCBvbiB0aGUgY29tcG9uZW50J3MgdGVtcGxhdGUuXCIsXG4gICAgICB2bVxuICAgICk7XG4gIH1cbn1cblxuLyogICovXG5cbi8vIGhvb2tzIHRvIGJlIGludm9rZWQgb24gY29tcG9uZW50IFZOb2RlcyBkdXJpbmcgcGF0Y2hcbnZhciBjb21wb25lbnRWTm9kZUhvb2tzID0ge1xuICBpbml0OiBmdW5jdGlvbiBpbml0IChcbiAgICB2bm9kZSxcbiAgICBoeWRyYXRpbmcsXG4gICAgcGFyZW50RWxtLFxuICAgIHJlZkVsbVxuICApIHtcbiAgICBpZiAoIXZub2RlLmNvbXBvbmVudEluc3RhbmNlIHx8IHZub2RlLmNvbXBvbmVudEluc3RhbmNlLl9pc0Rlc3Ryb3llZCkge1xuICAgICAgdmFyIGNoaWxkID0gdm5vZGUuY29tcG9uZW50SW5zdGFuY2UgPSBjcmVhdGVDb21wb25lbnRJbnN0YW5jZUZvclZub2RlKFxuICAgICAgICB2bm9kZSxcbiAgICAgICAgYWN0aXZlSW5zdGFuY2UsXG4gICAgICAgIHBhcmVudEVsbSxcbiAgICAgICAgcmVmRWxtXG4gICAgICApO1xuICAgICAgY2hpbGQuJG1vdW50KGh5ZHJhdGluZyA/IHZub2RlLmVsbSA6IHVuZGVmaW5lZCwgaHlkcmF0aW5nKTtcbiAgICB9IGVsc2UgaWYgKHZub2RlLmRhdGEua2VlcEFsaXZlKSB7XG4gICAgICAvLyBrZXB0LWFsaXZlIGNvbXBvbmVudHMsIHRyZWF0IGFzIGEgcGF0Y2hcbiAgICAgIHZhciBtb3VudGVkTm9kZSA9IHZub2RlOyAvLyB3b3JrIGFyb3VuZCBmbG93XG4gICAgICBjb21wb25lbnRWTm9kZUhvb2tzLnByZXBhdGNoKG1vdW50ZWROb2RlLCBtb3VudGVkTm9kZSk7XG4gICAgfVxuICB9LFxuXG4gIHByZXBhdGNoOiBmdW5jdGlvbiBwcmVwYXRjaCAob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB2bm9kZS5jb21wb25lbnRPcHRpb25zO1xuICAgIHZhciBjaGlsZCA9IHZub2RlLmNvbXBvbmVudEluc3RhbmNlID0gb2xkVm5vZGUuY29tcG9uZW50SW5zdGFuY2U7XG4gICAgdXBkYXRlQ2hpbGRDb21wb25lbnQoXG4gICAgICBjaGlsZCxcbiAgICAgIG9wdGlvbnMucHJvcHNEYXRhLCAvLyB1cGRhdGVkIHByb3BzXG4gICAgICBvcHRpb25zLmxpc3RlbmVycywgLy8gdXBkYXRlZCBsaXN0ZW5lcnNcbiAgICAgIHZub2RlLCAvLyBuZXcgcGFyZW50IHZub2RlXG4gICAgICBvcHRpb25zLmNoaWxkcmVuIC8vIG5ldyBjaGlsZHJlblxuICAgICk7XG4gIH0sXG5cbiAgaW5zZXJ0OiBmdW5jdGlvbiBpbnNlcnQgKHZub2RlKSB7XG4gICAgdmFyIGNvbnRleHQgPSB2bm9kZS5jb250ZXh0O1xuICAgIHZhciBjb21wb25lbnRJbnN0YW5jZSA9IHZub2RlLmNvbXBvbmVudEluc3RhbmNlO1xuICAgIGlmICghY29tcG9uZW50SW5zdGFuY2UuX2lzTW91bnRlZCkge1xuICAgICAgY29tcG9uZW50SW5zdGFuY2UuX2lzTW91bnRlZCA9IHRydWU7XG4gICAgICBjYWxsSG9vayhjb21wb25lbnRJbnN0YW5jZSwgJ21vdW50ZWQnKTtcbiAgICB9XG4gICAgaWYgKHZub2RlLmRhdGEua2VlcEFsaXZlKSB7XG4gICAgICBpZiAoY29udGV4dC5faXNNb3VudGVkKSB7XG4gICAgICAgIC8vIHZ1ZS1yb3V0ZXIjMTIxMlxuICAgICAgICAvLyBEdXJpbmcgdXBkYXRlcywgYSBrZXB0LWFsaXZlIGNvbXBvbmVudCdzIGNoaWxkIGNvbXBvbmVudHMgbWF5XG4gICAgICAgIC8vIGNoYW5nZSwgc28gZGlyZWN0bHkgd2Fsa2luZyB0aGUgdHJlZSBoZXJlIG1heSBjYWxsIGFjdGl2YXRlZCBob29rc1xuICAgICAgICAvLyBvbiBpbmNvcnJlY3QgY2hpbGRyZW4uIEluc3RlYWQgd2UgcHVzaCB0aGVtIGludG8gYSBxdWV1ZSB3aGljaCB3aWxsXG4gICAgICAgIC8vIGJlIHByb2Nlc3NlZCBhZnRlciB0aGUgd2hvbGUgcGF0Y2ggcHJvY2VzcyBlbmRlZC5cbiAgICAgICAgcXVldWVBY3RpdmF0ZWRDb21wb25lbnQoY29tcG9uZW50SW5zdGFuY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aXZhdGVDaGlsZENvbXBvbmVudChjb21wb25lbnRJbnN0YW5jZSwgdHJ1ZSAvKiBkaXJlY3QgKi8pO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95ICh2bm9kZSkge1xuICAgIHZhciBjb21wb25lbnRJbnN0YW5jZSA9IHZub2RlLmNvbXBvbmVudEluc3RhbmNlO1xuICAgIGlmICghY29tcG9uZW50SW5zdGFuY2UuX2lzRGVzdHJveWVkKSB7XG4gICAgICBpZiAoIXZub2RlLmRhdGEua2VlcEFsaXZlKSB7XG4gICAgICAgIGNvbXBvbmVudEluc3RhbmNlLiRkZXN0cm95KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWFjdGl2YXRlQ2hpbGRDb21wb25lbnQoY29tcG9uZW50SW5zdGFuY2UsIHRydWUgLyogZGlyZWN0ICovKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbnZhciBob29rc1RvTWVyZ2UgPSBPYmplY3Qua2V5cyhjb21wb25lbnRWTm9kZUhvb2tzKTtcblxuZnVuY3Rpb24gY3JlYXRlQ29tcG9uZW50IChcbiAgQ3RvcixcbiAgZGF0YSxcbiAgY29udGV4dCxcbiAgY2hpbGRyZW4sXG4gIHRhZ1xuKSB7XG4gIGlmIChpc1VuZGVmKEN0b3IpKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgYmFzZUN0b3IgPSBjb250ZXh0LiRvcHRpb25zLl9iYXNlO1xuXG4gIC8vIHBsYWluIG9wdGlvbnMgb2JqZWN0OiB0dXJuIGl0IGludG8gYSBjb25zdHJ1Y3RvclxuICBpZiAoaXNPYmplY3QoQ3RvcikpIHtcbiAgICBDdG9yID0gYmFzZUN0b3IuZXh0ZW5kKEN0b3IpO1xuICB9XG5cbiAgLy8gaWYgYXQgdGhpcyBzdGFnZSBpdCdzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIGFuIGFzeW5jIGNvbXBvbmVudCBmYWN0b3J5LFxuICAvLyByZWplY3QuXG4gIGlmICh0eXBlb2YgQ3RvciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICB3YXJuKChcIkludmFsaWQgQ29tcG9uZW50IGRlZmluaXRpb246IFwiICsgKFN0cmluZyhDdG9yKSkpLCBjb250ZXh0KTtcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBhc3luYyBjb21wb25lbnRcbiAgdmFyIGFzeW5jRmFjdG9yeTtcbiAgaWYgKGlzVW5kZWYoQ3Rvci5jaWQpKSB7XG4gICAgYXN5bmNGYWN0b3J5ID0gQ3RvcjtcbiAgICBDdG9yID0gcmVzb2x2ZUFzeW5jQ29tcG9uZW50KGFzeW5jRmFjdG9yeSwgYmFzZUN0b3IsIGNvbnRleHQpO1xuICAgIGlmIChDdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIHJldHVybiBhIHBsYWNlaG9sZGVyIG5vZGUgZm9yIGFzeW5jIGNvbXBvbmVudCwgd2hpY2ggaXMgcmVuZGVyZWRcbiAgICAgIC8vIGFzIGEgY29tbWVudCBub2RlIGJ1dCBwcmVzZXJ2ZXMgYWxsIHRoZSByYXcgaW5mb3JtYXRpb24gZm9yIHRoZSBub2RlLlxuICAgICAgLy8gdGhlIGluZm9ybWF0aW9uIHdpbGwgYmUgdXNlZCBmb3IgYXN5bmMgc2VydmVyLXJlbmRlcmluZyBhbmQgaHlkcmF0aW9uLlxuICAgICAgcmV0dXJuIGNyZWF0ZUFzeW5jUGxhY2Vob2xkZXIoXG4gICAgICAgIGFzeW5jRmFjdG9yeSxcbiAgICAgICAgZGF0YSxcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgIHRhZ1xuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIGRhdGEgPSBkYXRhIHx8IHt9O1xuXG4gIC8vIHJlc29sdmUgY29uc3RydWN0b3Igb3B0aW9ucyBpbiBjYXNlIGdsb2JhbCBtaXhpbnMgYXJlIGFwcGxpZWQgYWZ0ZXJcbiAgLy8gY29tcG9uZW50IGNvbnN0cnVjdG9yIGNyZWF0aW9uXG4gIHJlc29sdmVDb25zdHJ1Y3Rvck9wdGlvbnMoQ3Rvcik7XG5cbiAgLy8gdHJhbnNmb3JtIGNvbXBvbmVudCB2LW1vZGVsIGRhdGEgaW50byBwcm9wcyAmIGV2ZW50c1xuICBpZiAoaXNEZWYoZGF0YS5tb2RlbCkpIHtcbiAgICB0cmFuc2Zvcm1Nb2RlbChDdG9yLm9wdGlvbnMsIGRhdGEpO1xuICB9XG5cbiAgLy8gZXh0cmFjdCBwcm9wc1xuICB2YXIgcHJvcHNEYXRhID0gZXh0cmFjdFByb3BzRnJvbVZOb2RlRGF0YShkYXRhLCBDdG9yLCB0YWcpO1xuXG4gIC8vIGZ1bmN0aW9uYWwgY29tcG9uZW50XG4gIGlmIChpc1RydWUoQ3Rvci5vcHRpb25zLmZ1bmN0aW9uYWwpKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUZ1bmN0aW9uYWxDb21wb25lbnQoQ3RvciwgcHJvcHNEYXRhLCBkYXRhLCBjb250ZXh0LCBjaGlsZHJlbilcbiAgfVxuXG4gIC8vIGV4dHJhY3QgbGlzdGVuZXJzLCBzaW5jZSB0aGVzZSBuZWVkcyB0byBiZSB0cmVhdGVkIGFzXG4gIC8vIGNoaWxkIGNvbXBvbmVudCBsaXN0ZW5lcnMgaW5zdGVhZCBvZiBET00gbGlzdGVuZXJzXG4gIHZhciBsaXN0ZW5lcnMgPSBkYXRhLm9uO1xuICAvLyByZXBsYWNlIHdpdGggbGlzdGVuZXJzIHdpdGggLm5hdGl2ZSBtb2RpZmllclxuICAvLyBzbyBpdCBnZXRzIHByb2Nlc3NlZCBkdXJpbmcgcGFyZW50IGNvbXBvbmVudCBwYXRjaC5cbiAgZGF0YS5vbiA9IGRhdGEubmF0aXZlT247XG5cbiAgaWYgKGlzVHJ1ZShDdG9yLm9wdGlvbnMuYWJzdHJhY3QpKSB7XG4gICAgLy8gYWJzdHJhY3QgY29tcG9uZW50cyBkbyBub3Qga2VlcCBhbnl0aGluZ1xuICAgIC8vIG90aGVyIHRoYW4gcHJvcHMgJiBsaXN0ZW5lcnMgJiBzbG90XG5cbiAgICAvLyB3b3JrIGFyb3VuZCBmbG93XG4gICAgdmFyIHNsb3QgPSBkYXRhLnNsb3Q7XG4gICAgZGF0YSA9IHt9O1xuICAgIGlmIChzbG90KSB7XG4gICAgICBkYXRhLnNsb3QgPSBzbG90O1xuICAgIH1cbiAgfVxuXG4gIC8vIG1lcmdlIGNvbXBvbmVudCBtYW5hZ2VtZW50IGhvb2tzIG9udG8gdGhlIHBsYWNlaG9sZGVyIG5vZGVcbiAgbWVyZ2VIb29rcyhkYXRhKTtcblxuICAvLyByZXR1cm4gYSBwbGFjZWhvbGRlciB2bm9kZVxuICB2YXIgbmFtZSA9IEN0b3Iub3B0aW9ucy5uYW1lIHx8IHRhZztcbiAgdmFyIHZub2RlID0gbmV3IFZOb2RlKFxuICAgIChcInZ1ZS1jb21wb25lbnQtXCIgKyAoQ3Rvci5jaWQpICsgKG5hbWUgPyAoXCItXCIgKyBuYW1lKSA6ICcnKSksXG4gICAgZGF0YSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY29udGV4dCxcbiAgICB7IEN0b3I6IEN0b3IsIHByb3BzRGF0YTogcHJvcHNEYXRhLCBsaXN0ZW5lcnM6IGxpc3RlbmVycywgdGFnOiB0YWcsIGNoaWxkcmVuOiBjaGlsZHJlbiB9LFxuICAgIGFzeW5jRmFjdG9yeVxuICApO1xuXG4gIC8vIFdlZXggc3BlY2lmaWM6IGludm9rZSByZWN5Y2xlLWxpc3Qgb3B0aW1pemVkIEByZW5kZXIgZnVuY3Rpb24gZm9yXG4gIC8vIGV4dHJhY3RpbmcgY2VsbC1zbG90IHRlbXBsYXRlLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vSGFua3MxMDEwMC93ZWV4LW5hdGl2ZS1kaXJlY3RpdmUvdHJlZS9tYXN0ZXIvY29tcG9uZW50XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAodHJ1ZSAmJiBpc1JlY3ljbGFibGVDb21wb25lbnQodm5vZGUpKSB7XG4gICAgcmV0dXJuIHJlbmRlclJlY3ljbGFibGVDb21wb25lbnRUZW1wbGF0ZSh2bm9kZSlcbiAgfVxuXG4gIHJldHVybiB2bm9kZVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDb21wb25lbnRJbnN0YW5jZUZvclZub2RlIChcbiAgdm5vZGUsIC8vIHdlIGtub3cgaXQncyBNb3VudGVkQ29tcG9uZW50Vk5vZGUgYnV0IGZsb3cgZG9lc24ndFxuICBwYXJlbnQsIC8vIGFjdGl2ZUluc3RhbmNlIGluIGxpZmVjeWNsZSBzdGF0ZVxuICBwYXJlbnRFbG0sXG4gIHJlZkVsbVxuKSB7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIF9pc0NvbXBvbmVudDogdHJ1ZSxcbiAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICBfcGFyZW50Vm5vZGU6IHZub2RlLFxuICAgIF9wYXJlbnRFbG06IHBhcmVudEVsbSB8fCBudWxsLFxuICAgIF9yZWZFbG06IHJlZkVsbSB8fCBudWxsXG4gIH07XG4gIC8vIGNoZWNrIGlubGluZS10ZW1wbGF0ZSByZW5kZXIgZnVuY3Rpb25zXG4gIHZhciBpbmxpbmVUZW1wbGF0ZSA9IHZub2RlLmRhdGEuaW5saW5lVGVtcGxhdGU7XG4gIGlmIChpc0RlZihpbmxpbmVUZW1wbGF0ZSkpIHtcbiAgICBvcHRpb25zLnJlbmRlciA9IGlubGluZVRlbXBsYXRlLnJlbmRlcjtcbiAgICBvcHRpb25zLnN0YXRpY1JlbmRlckZucyA9IGlubGluZVRlbXBsYXRlLnN0YXRpY1JlbmRlckZucztcbiAgfVxuICByZXR1cm4gbmV3IHZub2RlLmNvbXBvbmVudE9wdGlvbnMuQ3RvcihvcHRpb25zKVxufVxuXG5mdW5jdGlvbiBtZXJnZUhvb2tzIChkYXRhKSB7XG4gIGlmICghZGF0YS5ob29rKSB7XG4gICAgZGF0YS5ob29rID0ge307XG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBob29rc1RvTWVyZ2UubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIga2V5ID0gaG9va3NUb01lcmdlW2ldO1xuICAgIHZhciBmcm9tUGFyZW50ID0gZGF0YS5ob29rW2tleV07XG4gICAgdmFyIG91cnMgPSBjb21wb25lbnRWTm9kZUhvb2tzW2tleV07XG4gICAgZGF0YS5ob29rW2tleV0gPSBmcm9tUGFyZW50ID8gbWVyZ2VIb29rJDEob3VycywgZnJvbVBhcmVudCkgOiBvdXJzO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1lcmdlSG9vayQxIChvbmUsIHR3bykge1xuICByZXR1cm4gZnVuY3Rpb24gKGEsIGIsIGMsIGQpIHtcbiAgICBvbmUoYSwgYiwgYywgZCk7XG4gICAgdHdvKGEsIGIsIGMsIGQpO1xuICB9XG59XG5cbi8vIHRyYW5zZm9ybSBjb21wb25lbnQgdi1tb2RlbCBpbmZvICh2YWx1ZSBhbmQgY2FsbGJhY2spIGludG9cbi8vIHByb3AgYW5kIGV2ZW50IGhhbmRsZXIgcmVzcGVjdGl2ZWx5LlxuZnVuY3Rpb24gdHJhbnNmb3JtTW9kZWwgKG9wdGlvbnMsIGRhdGEpIHtcbiAgdmFyIHByb3AgPSAob3B0aW9ucy5tb2RlbCAmJiBvcHRpb25zLm1vZGVsLnByb3ApIHx8ICd2YWx1ZSc7XG4gIHZhciBldmVudCA9IChvcHRpb25zLm1vZGVsICYmIG9wdGlvbnMubW9kZWwuZXZlbnQpIHx8ICdpbnB1dCc7KGRhdGEucHJvcHMgfHwgKGRhdGEucHJvcHMgPSB7fSkpW3Byb3BdID0gZGF0YS5tb2RlbC52YWx1ZTtcbiAgdmFyIG9uID0gZGF0YS5vbiB8fCAoZGF0YS5vbiA9IHt9KTtcbiAgaWYgKGlzRGVmKG9uW2V2ZW50XSkpIHtcbiAgICBvbltldmVudF0gPSBbZGF0YS5tb2RlbC5jYWxsYmFja10uY29uY2F0KG9uW2V2ZW50XSk7XG4gIH0gZWxzZSB7XG4gICAgb25bZXZlbnRdID0gZGF0YS5tb2RlbC5jYWxsYmFjaztcbiAgfVxufVxuXG4vKiAgKi9cblxudmFyIFNJTVBMRV9OT1JNQUxJWkUgPSAxO1xudmFyIEFMV0FZU19OT1JNQUxJWkUgPSAyO1xuXG4vLyB3cmFwcGVyIGZ1bmN0aW9uIGZvciBwcm92aWRpbmcgYSBtb3JlIGZsZXhpYmxlIGludGVyZmFjZVxuLy8gd2l0aG91dCBnZXR0aW5nIHllbGxlZCBhdCBieSBmbG93XG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50IChcbiAgY29udGV4dCxcbiAgdGFnLFxuICBkYXRhLFxuICBjaGlsZHJlbixcbiAgbm9ybWFsaXphdGlvblR5cGUsXG4gIGFsd2F5c05vcm1hbGl6ZVxuKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGRhdGEpIHx8IGlzUHJpbWl0aXZlKGRhdGEpKSB7XG4gICAgbm9ybWFsaXphdGlvblR5cGUgPSBjaGlsZHJlbjtcbiAgICBjaGlsZHJlbiA9IGRhdGE7XG4gICAgZGF0YSA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoaXNUcnVlKGFsd2F5c05vcm1hbGl6ZSkpIHtcbiAgICBub3JtYWxpemF0aW9uVHlwZSA9IEFMV0FZU19OT1JNQUxJWkU7XG4gIH1cbiAgcmV0dXJuIF9jcmVhdGVFbGVtZW50KGNvbnRleHQsIHRhZywgZGF0YSwgY2hpbGRyZW4sIG5vcm1hbGl6YXRpb25UeXBlKVxufVxuXG5mdW5jdGlvbiBfY3JlYXRlRWxlbWVudCAoXG4gIGNvbnRleHQsXG4gIHRhZyxcbiAgZGF0YSxcbiAgY2hpbGRyZW4sXG4gIG5vcm1hbGl6YXRpb25UeXBlXG4pIHtcbiAgaWYgKGlzRGVmKGRhdGEpICYmIGlzRGVmKChkYXRhKS5fX29iX18pKSB7XG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB3YXJuKFxuICAgICAgXCJBdm9pZCB1c2luZyBvYnNlcnZlZCBkYXRhIG9iamVjdCBhcyB2bm9kZSBkYXRhOiBcIiArIChKU09OLnN0cmluZ2lmeShkYXRhKSkgKyBcIlxcblwiICtcbiAgICAgICdBbHdheXMgY3JlYXRlIGZyZXNoIHZub2RlIGRhdGEgb2JqZWN0cyBpbiBlYWNoIHJlbmRlciEnLFxuICAgICAgY29udGV4dFxuICAgICk7XG4gICAgcmV0dXJuIGNyZWF0ZUVtcHR5Vk5vZGUoKVxuICB9XG4gIC8vIG9iamVjdCBzeW50YXggaW4gdi1iaW5kXG4gIGlmIChpc0RlZihkYXRhKSAmJiBpc0RlZihkYXRhLmlzKSkge1xuICAgIHRhZyA9IGRhdGEuaXM7XG4gIH1cbiAgaWYgKCF0YWcpIHtcbiAgICAvLyBpbiBjYXNlIG9mIGNvbXBvbmVudCA6aXMgc2V0IHRvIGZhbHN5IHZhbHVlXG4gICAgcmV0dXJuIGNyZWF0ZUVtcHR5Vk5vZGUoKVxuICB9XG4gIC8vIHdhcm4gYWdhaW5zdCBub24tcHJpbWl0aXZlIGtleVxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJlxuICAgIGlzRGVmKGRhdGEpICYmIGlzRGVmKGRhdGEua2V5KSAmJiAhaXNQcmltaXRpdmUoZGF0YS5rZXkpXG4gICkge1xuICAgIGlmICghdHJ1ZSB8fCAhKCdAYmluZGluZycgaW4gZGF0YS5rZXkpKSB7XG4gICAgICB3YXJuKFxuICAgICAgICAnQXZvaWQgdXNpbmcgbm9uLXByaW1pdGl2ZSB2YWx1ZSBhcyBrZXksICcgK1xuICAgICAgICAndXNlIHN0cmluZy9udW1iZXIgdmFsdWUgaW5zdGVhZC4nLFxuICAgICAgICBjb250ZXh0XG4gICAgICApO1xuICAgIH1cbiAgfVxuICAvLyBzdXBwb3J0IHNpbmdsZSBmdW5jdGlvbiBjaGlsZHJlbiBhcyBkZWZhdWx0IHNjb3BlZCBzbG90XG4gIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJlxuICAgIHR5cGVvZiBjaGlsZHJlblswXSA9PT0gJ2Z1bmN0aW9uJ1xuICApIHtcbiAgICBkYXRhID0gZGF0YSB8fCB7fTtcbiAgICBkYXRhLnNjb3BlZFNsb3RzID0geyBkZWZhdWx0OiBjaGlsZHJlblswXSB9O1xuICAgIGNoaWxkcmVuLmxlbmd0aCA9IDA7XG4gIH1cbiAgaWYgKG5vcm1hbGl6YXRpb25UeXBlID09PSBBTFdBWVNfTk9STUFMSVpFKSB7XG4gICAgY2hpbGRyZW4gPSBub3JtYWxpemVDaGlsZHJlbihjaGlsZHJlbik7XG4gIH0gZWxzZSBpZiAobm9ybWFsaXphdGlvblR5cGUgPT09IFNJTVBMRV9OT1JNQUxJWkUpIHtcbiAgICBjaGlsZHJlbiA9IHNpbXBsZU5vcm1hbGl6ZUNoaWxkcmVuKGNoaWxkcmVuKTtcbiAgfVxuICB2YXIgdm5vZGUsIG5zO1xuICBpZiAodHlwZW9mIHRhZyA9PT0gJ3N0cmluZycpIHtcbiAgICB2YXIgQ3RvcjtcbiAgICBucyA9IChjb250ZXh0LiR2bm9kZSAmJiBjb250ZXh0LiR2bm9kZS5ucykgfHwgY29uZmlnLmdldFRhZ05hbWVzcGFjZSh0YWcpO1xuICAgIGlmIChjb25maWcuaXNSZXNlcnZlZFRhZyh0YWcpKSB7XG4gICAgICAvLyBwbGF0Zm9ybSBidWlsdC1pbiBlbGVtZW50c1xuICAgICAgdm5vZGUgPSBuZXcgVk5vZGUoXG4gICAgICAgIGNvbmZpZy5wYXJzZVBsYXRmb3JtVGFnTmFtZSh0YWcpLCBkYXRhLCBjaGlsZHJlbixcbiAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGNvbnRleHRcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChpc0RlZihDdG9yID0gcmVzb2x2ZUFzc2V0KGNvbnRleHQuJG9wdGlvbnMsICdjb21wb25lbnRzJywgdGFnKSkpIHtcbiAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgdm5vZGUgPSBjcmVhdGVDb21wb25lbnQoQ3RvciwgZGF0YSwgY29udGV4dCwgY2hpbGRyZW4sIHRhZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHVua25vd24gb3IgdW5saXN0ZWQgbmFtZXNwYWNlZCBlbGVtZW50c1xuICAgICAgLy8gY2hlY2sgYXQgcnVudGltZSBiZWNhdXNlIGl0IG1heSBnZXQgYXNzaWduZWQgYSBuYW1lc3BhY2Ugd2hlbiBpdHNcbiAgICAgIC8vIHBhcmVudCBub3JtYWxpemVzIGNoaWxkcmVuXG4gICAgICB2bm9kZSA9IG5ldyBWTm9kZShcbiAgICAgICAgdGFnLCBkYXRhLCBjaGlsZHJlbixcbiAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGNvbnRleHRcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIGRpcmVjdCBjb21wb25lbnQgb3B0aW9ucyAvIGNvbnN0cnVjdG9yXG4gICAgdm5vZGUgPSBjcmVhdGVDb21wb25lbnQodGFnLCBkYXRhLCBjb250ZXh0LCBjaGlsZHJlbik7XG4gIH1cbiAgaWYgKGlzRGVmKHZub2RlKSkge1xuICAgIGlmIChucykgeyBhcHBseU5TKHZub2RlLCBucyk7IH1cbiAgICByZXR1cm4gdm5vZGVcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY3JlYXRlRW1wdHlWTm9kZSgpXG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlOUyAodm5vZGUsIG5zLCBmb3JjZSkge1xuICB2bm9kZS5ucyA9IG5zO1xuICBpZiAodm5vZGUudGFnID09PSAnZm9yZWlnbk9iamVjdCcpIHtcbiAgICAvLyB1c2UgZGVmYXVsdCBuYW1lc3BhY2UgaW5zaWRlIGZvcmVpZ25PYmplY3RcbiAgICBucyA9IHVuZGVmaW5lZDtcbiAgICBmb3JjZSA9IHRydWU7XG4gIH1cbiAgaWYgKGlzRGVmKHZub2RlLmNoaWxkcmVuKSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdm5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSB2bm9kZS5jaGlsZHJlbltpXTtcbiAgICAgIGlmIChpc0RlZihjaGlsZC50YWcpICYmIChpc1VuZGVmKGNoaWxkLm5zKSB8fCBpc1RydWUoZm9yY2UpKSkge1xuICAgICAgICBhcHBseU5TKGNoaWxkLCBucywgZm9yY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gaW5pdFJlbmRlciAodm0pIHtcbiAgdm0uX3Zub2RlID0gbnVsbDsgLy8gdGhlIHJvb3Qgb2YgdGhlIGNoaWxkIHRyZWVcbiAgdm0uX3N0YXRpY1RyZWVzID0gbnVsbDsgLy8gdi1vbmNlIGNhY2hlZCB0cmVlc1xuICB2YXIgb3B0aW9ucyA9IHZtLiRvcHRpb25zO1xuICB2YXIgcGFyZW50Vm5vZGUgPSB2bS4kdm5vZGUgPSBvcHRpb25zLl9wYXJlbnRWbm9kZTsgLy8gdGhlIHBsYWNlaG9sZGVyIG5vZGUgaW4gcGFyZW50IHRyZWVcbiAgdmFyIHJlbmRlckNvbnRleHQgPSBwYXJlbnRWbm9kZSAmJiBwYXJlbnRWbm9kZS5jb250ZXh0O1xuICB2bS4kc2xvdHMgPSByZXNvbHZlU2xvdHMob3B0aW9ucy5fcmVuZGVyQ2hpbGRyZW4sIHJlbmRlckNvbnRleHQpO1xuICB2bS4kc2NvcGVkU2xvdHMgPSBlbXB0eU9iamVjdDtcbiAgLy8gYmluZCB0aGUgY3JlYXRlRWxlbWVudCBmbiB0byB0aGlzIGluc3RhbmNlXG4gIC8vIHNvIHRoYXQgd2UgZ2V0IHByb3BlciByZW5kZXIgY29udGV4dCBpbnNpZGUgaXQuXG4gIC8vIGFyZ3Mgb3JkZXI6IHRhZywgZGF0YSwgY2hpbGRyZW4sIG5vcm1hbGl6YXRpb25UeXBlLCBhbHdheXNOb3JtYWxpemVcbiAgLy8gaW50ZXJuYWwgdmVyc2lvbiBpcyB1c2VkIGJ5IHJlbmRlciBmdW5jdGlvbnMgY29tcGlsZWQgZnJvbSB0ZW1wbGF0ZXNcbiAgdm0uX2MgPSBmdW5jdGlvbiAoYSwgYiwgYywgZCkgeyByZXR1cm4gY3JlYXRlRWxlbWVudCh2bSwgYSwgYiwgYywgZCwgZmFsc2UpOyB9O1xuICAvLyBub3JtYWxpemF0aW9uIGlzIGFsd2F5cyBhcHBsaWVkIGZvciB0aGUgcHVibGljIHZlcnNpb24sIHVzZWQgaW5cbiAgLy8gdXNlci13cml0dGVuIHJlbmRlciBmdW5jdGlvbnMuXG4gIHZtLiRjcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQpIHsgcmV0dXJuIGNyZWF0ZUVsZW1lbnQodm0sIGEsIGIsIGMsIGQsIHRydWUpOyB9O1xuXG4gIC8vICRhdHRycyAmICRsaXN0ZW5lcnMgYXJlIGV4cG9zZWQgZm9yIGVhc2llciBIT0MgY3JlYXRpb24uXG4gIC8vIHRoZXkgbmVlZCB0byBiZSByZWFjdGl2ZSBzbyB0aGF0IEhPQ3MgdXNpbmcgdGhlbSBhcmUgYWx3YXlzIHVwZGF0ZWRcbiAgdmFyIHBhcmVudERhdGEgPSBwYXJlbnRWbm9kZSAmJiBwYXJlbnRWbm9kZS5kYXRhO1xuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgZGVmaW5lUmVhY3RpdmUodm0sICckYXR0cnMnLCBwYXJlbnREYXRhICYmIHBhcmVudERhdGEuYXR0cnMgfHwgZW1wdHlPYmplY3QsIGZ1bmN0aW9uICgpIHtcbiAgICAgICFpc1VwZGF0aW5nQ2hpbGRDb21wb25lbnQgJiYgd2FybihcIiRhdHRycyBpcyByZWFkb25seS5cIiwgdm0pO1xuICAgIH0sIHRydWUpO1xuICAgIGRlZmluZVJlYWN0aXZlKHZtLCAnJGxpc3RlbmVycycsIG9wdGlvbnMuX3BhcmVudExpc3RlbmVycyB8fCBlbXB0eU9iamVjdCwgZnVuY3Rpb24gKCkge1xuICAgICAgIWlzVXBkYXRpbmdDaGlsZENvbXBvbmVudCAmJiB3YXJuKFwiJGxpc3RlbmVycyBpcyByZWFkb25seS5cIiwgdm0pO1xuICAgIH0sIHRydWUpO1xuICB9IGVsc2Uge1xuICAgIGRlZmluZVJlYWN0aXZlKHZtLCAnJGF0dHJzJywgcGFyZW50RGF0YSAmJiBwYXJlbnREYXRhLmF0dHJzIHx8IGVtcHR5T2JqZWN0LCBudWxsLCB0cnVlKTtcbiAgICBkZWZpbmVSZWFjdGl2ZSh2bSwgJyRsaXN0ZW5lcnMnLCBvcHRpb25zLl9wYXJlbnRMaXN0ZW5lcnMgfHwgZW1wdHlPYmplY3QsIG51bGwsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlck1peGluIChWdWUpIHtcbiAgLy8gaW5zdGFsbCBydW50aW1lIGNvbnZlbmllbmNlIGhlbHBlcnNcbiAgaW5zdGFsbFJlbmRlckhlbHBlcnMoVnVlLnByb3RvdHlwZSk7XG5cbiAgVnVlLnByb3RvdHlwZS4kbmV4dFRpY2sgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gbmV4dFRpY2soZm4sIHRoaXMpXG4gIH07XG5cbiAgVnVlLnByb3RvdHlwZS5fcmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgdmFyIHJlZiA9IHZtLiRvcHRpb25zO1xuICAgIHZhciByZW5kZXIgPSByZWYucmVuZGVyO1xuICAgIHZhciBfcGFyZW50Vm5vZGUgPSByZWYuX3BhcmVudFZub2RlO1xuXG4gICAgaWYgKHZtLl9pc01vdW50ZWQpIHtcbiAgICAgIC8vIGlmIHRoZSBwYXJlbnQgZGlkbid0IHVwZGF0ZSwgdGhlIHNsb3Qgbm9kZXMgd2lsbCBiZSB0aGUgb25lcyBmcm9tXG4gICAgICAvLyBsYXN0IHJlbmRlci4gVGhleSBuZWVkIHRvIGJlIGNsb25lZCB0byBlbnN1cmUgXCJmcmVzaG5lc3NcIiBmb3IgdGhpcyByZW5kZXIuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gdm0uJHNsb3RzKSB7XG4gICAgICAgIHZhciBzbG90ID0gdm0uJHNsb3RzW2tleV07XG4gICAgICAgIC8vIF9yZW5kZXJlZCBpcyBhIGZsYWcgYWRkZWQgYnkgcmVuZGVyU2xvdCwgYnV0IG1heSBub3QgYmUgcHJlc2VudFxuICAgICAgICAvLyBpZiB0aGUgc2xvdCBpcyBwYXNzZWQgZnJvbSBtYW51YWxseSB3cml0dGVuIHJlbmRlciBmdW5jdGlvbnNcbiAgICAgICAgaWYgKHNsb3QuX3JlbmRlcmVkIHx8IChzbG90WzBdICYmIHNsb3RbMF0uZWxtKSkge1xuICAgICAgICAgIHZtLiRzbG90c1trZXldID0gY2xvbmVWTm9kZXMoc2xvdCwgdHJ1ZSAvKiBkZWVwICovKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZtLiRzY29wZWRTbG90cyA9IChfcGFyZW50Vm5vZGUgJiYgX3BhcmVudFZub2RlLmRhdGEuc2NvcGVkU2xvdHMpIHx8IGVtcHR5T2JqZWN0O1xuXG4gICAgLy8gc2V0IHBhcmVudCB2bm9kZS4gdGhpcyBhbGxvd3MgcmVuZGVyIGZ1bmN0aW9ucyB0byBoYXZlIGFjY2Vzc1xuICAgIC8vIHRvIHRoZSBkYXRhIG9uIHRoZSBwbGFjZWhvbGRlciBub2RlLlxuICAgIHZtLiR2bm9kZSA9IF9wYXJlbnRWbm9kZTtcbiAgICAvLyByZW5kZXIgc2VsZlxuICAgIHZhciB2bm9kZTtcbiAgICB0cnkge1xuICAgICAgdm5vZGUgPSByZW5kZXIuY2FsbCh2bS5fcmVuZGVyUHJveHksIHZtLiRjcmVhdGVFbGVtZW50KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBoYW5kbGVFcnJvcihlLCB2bSwgXCJyZW5kZXJcIik7XG4gICAgICAvLyByZXR1cm4gZXJyb3IgcmVuZGVyIHJlc3VsdCxcbiAgICAgIC8vIG9yIHByZXZpb3VzIHZub2RlIHRvIHByZXZlbnQgcmVuZGVyIGVycm9yIGNhdXNpbmcgYmxhbmsgY29tcG9uZW50XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgaWYgKHZtLiRvcHRpb25zLnJlbmRlckVycm9yKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZub2RlID0gdm0uJG9wdGlvbnMucmVuZGVyRXJyb3IuY2FsbCh2bS5fcmVuZGVyUHJveHksIHZtLiRjcmVhdGVFbGVtZW50LCBlKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBoYW5kbGVFcnJvcihlLCB2bSwgXCJyZW5kZXJFcnJvclwiKTtcbiAgICAgICAgICAgIHZub2RlID0gdm0uX3Zub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2bm9kZSA9IHZtLl92bm9kZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdm5vZGUgPSB2bS5fdm5vZGU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHJldHVybiBlbXB0eSB2bm9kZSBpbiBjYXNlIHRoZSByZW5kZXIgZnVuY3Rpb24gZXJyb3JlZCBvdXRcbiAgICBpZiAoISh2bm9kZSBpbnN0YW5jZW9mIFZOb2RlKSkge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgQXJyYXkuaXNBcnJheSh2bm9kZSkpIHtcbiAgICAgICAgd2FybihcbiAgICAgICAgICAnTXVsdGlwbGUgcm9vdCBub2RlcyByZXR1cm5lZCBmcm9tIHJlbmRlciBmdW5jdGlvbi4gUmVuZGVyIGZ1bmN0aW9uICcgK1xuICAgICAgICAgICdzaG91bGQgcmV0dXJuIGEgc2luZ2xlIHJvb3Qgbm9kZS4nLFxuICAgICAgICAgIHZtXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICB2bm9kZSA9IGNyZWF0ZUVtcHR5Vk5vZGUoKTtcbiAgICB9XG4gICAgLy8gc2V0IHBhcmVudFxuICAgIHZub2RlLnBhcmVudCA9IF9wYXJlbnRWbm9kZTtcbiAgICByZXR1cm4gdm5vZGVcbiAgfTtcbn1cblxuLyogICovXG5cbnZhciB1aWQgPSAwO1xuXG5mdW5jdGlvbiBpbml0TWl4aW4gKFZ1ZSkge1xuICBWdWUucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIC8vIGEgdWlkXG4gICAgdm0uX3VpZCA9IHVpZCsrO1xuXG4gICAgdmFyIHN0YXJ0VGFnLCBlbmRUYWc7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgY29uZmlnLnBlcmZvcm1hbmNlICYmIG1hcmspIHtcbiAgICAgIHN0YXJ0VGFnID0gXCJ2dWUtcGVyZi1zdGFydDpcIiArICh2bS5fdWlkKTtcbiAgICAgIGVuZFRhZyA9IFwidnVlLXBlcmYtZW5kOlwiICsgKHZtLl91aWQpO1xuICAgICAgbWFyayhzdGFydFRhZyk7XG4gICAgfVxuXG4gICAgLy8gYSBmbGFnIHRvIGF2b2lkIHRoaXMgYmVpbmcgb2JzZXJ2ZWRcbiAgICB2bS5faXNWdWUgPSB0cnVlO1xuICAgIC8vIG1lcmdlIG9wdGlvbnNcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLl9pc0NvbXBvbmVudCkge1xuICAgICAgLy8gb3B0aW1pemUgaW50ZXJuYWwgY29tcG9uZW50IGluc3RhbnRpYXRpb25cbiAgICAgIC8vIHNpbmNlIGR5bmFtaWMgb3B0aW9ucyBtZXJnaW5nIGlzIHByZXR0eSBzbG93LCBhbmQgbm9uZSBvZiB0aGVcbiAgICAgIC8vIGludGVybmFsIGNvbXBvbmVudCBvcHRpb25zIG5lZWRzIHNwZWNpYWwgdHJlYXRtZW50LlxuICAgICAgaW5pdEludGVybmFsQ29tcG9uZW50KHZtLCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdm0uJG9wdGlvbnMgPSBtZXJnZU9wdGlvbnMoXG4gICAgICAgIHJlc29sdmVDb25zdHJ1Y3Rvck9wdGlvbnModm0uY29uc3RydWN0b3IpLFxuICAgICAgICBvcHRpb25zIHx8IHt9LFxuICAgICAgICB2bVxuICAgICAgKTtcbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgaW5pdFByb3h5KHZtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdm0uX3JlbmRlclByb3h5ID0gdm07XG4gICAgfVxuICAgIC8vIGV4cG9zZSByZWFsIHNlbGZcbiAgICB2bS5fc2VsZiA9IHZtO1xuICAgIGluaXRMaWZlY3ljbGUodm0pO1xuICAgIGluaXRFdmVudHModm0pO1xuICAgIGluaXRSZW5kZXIodm0pO1xuICAgIGNhbGxIb29rKHZtLCAnYmVmb3JlQ3JlYXRlJyk7XG4gICAgaW5pdEluamVjdGlvbnModm0pOyAvLyByZXNvbHZlIGluamVjdGlvbnMgYmVmb3JlIGRhdGEvcHJvcHNcbiAgICBpbml0U3RhdGUodm0pO1xuICAgIGluaXRQcm92aWRlKHZtKTsgLy8gcmVzb2x2ZSBwcm92aWRlIGFmdGVyIGRhdGEvcHJvcHNcbiAgICBjYWxsSG9vayh2bSwgJ2NyZWF0ZWQnKTtcblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIGNvbmZpZy5wZXJmb3JtYW5jZSAmJiBtYXJrKSB7XG4gICAgICB2bS5fbmFtZSA9IGZvcm1hdENvbXBvbmVudE5hbWUodm0sIGZhbHNlKTtcbiAgICAgIG1hcmsoZW5kVGFnKTtcbiAgICAgIG1lYXN1cmUoKFwidnVlIFwiICsgKHZtLl9uYW1lKSArIFwiIGluaXRcIiksIHN0YXJ0VGFnLCBlbmRUYWcpO1xuICAgIH1cblxuICAgIGlmICh2bS4kb3B0aW9ucy5lbCkge1xuICAgICAgdm0uJG1vdW50KHZtLiRvcHRpb25zLmVsKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGluaXRJbnRlcm5hbENvbXBvbmVudCAodm0sIG9wdGlvbnMpIHtcbiAgdmFyIG9wdHMgPSB2bS4kb3B0aW9ucyA9IE9iamVjdC5jcmVhdGUodm0uY29uc3RydWN0b3Iub3B0aW9ucyk7XG4gIC8vIGRvaW5nIHRoaXMgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIGR5bmFtaWMgZW51bWVyYXRpb24uXG4gIHZhciBwYXJlbnRWbm9kZSA9IG9wdGlvbnMuX3BhcmVudFZub2RlO1xuICBvcHRzLnBhcmVudCA9IG9wdGlvbnMucGFyZW50O1xuICBvcHRzLl9wYXJlbnRWbm9kZSA9IHBhcmVudFZub2RlO1xuICBvcHRzLl9wYXJlbnRFbG0gPSBvcHRpb25zLl9wYXJlbnRFbG07XG4gIG9wdHMuX3JlZkVsbSA9IG9wdGlvbnMuX3JlZkVsbTtcblxuICB2YXIgdm5vZGVDb21wb25lbnRPcHRpb25zID0gcGFyZW50Vm5vZGUuY29tcG9uZW50T3B0aW9ucztcbiAgb3B0cy5wcm9wc0RhdGEgPSB2bm9kZUNvbXBvbmVudE9wdGlvbnMucHJvcHNEYXRhO1xuICBvcHRzLl9wYXJlbnRMaXN0ZW5lcnMgPSB2bm9kZUNvbXBvbmVudE9wdGlvbnMubGlzdGVuZXJzO1xuICBvcHRzLl9yZW5kZXJDaGlsZHJlbiA9IHZub2RlQ29tcG9uZW50T3B0aW9ucy5jaGlsZHJlbjtcbiAgb3B0cy5fY29tcG9uZW50VGFnID0gdm5vZGVDb21wb25lbnRPcHRpb25zLnRhZztcblxuICBpZiAob3B0aW9ucy5yZW5kZXIpIHtcbiAgICBvcHRzLnJlbmRlciA9IG9wdGlvbnMucmVuZGVyO1xuICAgIG9wdHMuc3RhdGljUmVuZGVyRm5zID0gb3B0aW9ucy5zdGF0aWNSZW5kZXJGbnM7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUNvbnN0cnVjdG9yT3B0aW9ucyAoQ3Rvcikge1xuICB2YXIgb3B0aW9ucyA9IEN0b3Iub3B0aW9ucztcbiAgaWYgKEN0b3Iuc3VwZXIpIHtcbiAgICB2YXIgc3VwZXJPcHRpb25zID0gcmVzb2x2ZUNvbnN0cnVjdG9yT3B0aW9ucyhDdG9yLnN1cGVyKTtcbiAgICB2YXIgY2FjaGVkU3VwZXJPcHRpb25zID0gQ3Rvci5zdXBlck9wdGlvbnM7XG4gICAgaWYgKHN1cGVyT3B0aW9ucyAhPT0gY2FjaGVkU3VwZXJPcHRpb25zKSB7XG4gICAgICAvLyBzdXBlciBvcHRpb24gY2hhbmdlZCxcbiAgICAgIC8vIG5lZWQgdG8gcmVzb2x2ZSBuZXcgb3B0aW9ucy5cbiAgICAgIEN0b3Iuc3VwZXJPcHRpb25zID0gc3VwZXJPcHRpb25zO1xuICAgICAgLy8gY2hlY2sgaWYgdGhlcmUgYXJlIGFueSBsYXRlLW1vZGlmaWVkL2F0dGFjaGVkIG9wdGlvbnMgKCM0OTc2KVxuICAgICAgdmFyIG1vZGlmaWVkT3B0aW9ucyA9IHJlc29sdmVNb2RpZmllZE9wdGlvbnMoQ3Rvcik7XG4gICAgICAvLyB1cGRhdGUgYmFzZSBleHRlbmQgb3B0aW9uc1xuICAgICAgaWYgKG1vZGlmaWVkT3B0aW9ucykge1xuICAgICAgICBleHRlbmQoQ3Rvci5leHRlbmRPcHRpb25zLCBtb2RpZmllZE9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgb3B0aW9ucyA9IEN0b3Iub3B0aW9ucyA9IG1lcmdlT3B0aW9ucyhzdXBlck9wdGlvbnMsIEN0b3IuZXh0ZW5kT3B0aW9ucyk7XG4gICAgICBpZiAob3B0aW9ucy5uYW1lKSB7XG4gICAgICAgIG9wdGlvbnMuY29tcG9uZW50c1tvcHRpb25zLm5hbWVdID0gQ3RvcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnNcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZU1vZGlmaWVkT3B0aW9ucyAoQ3Rvcikge1xuICB2YXIgbW9kaWZpZWQ7XG4gIHZhciBsYXRlc3QgPSBDdG9yLm9wdGlvbnM7XG4gIHZhciBleHRlbmRlZCA9IEN0b3IuZXh0ZW5kT3B0aW9ucztcbiAgdmFyIHNlYWxlZCA9IEN0b3Iuc2VhbGVkT3B0aW9ucztcbiAgZm9yICh2YXIga2V5IGluIGxhdGVzdCkge1xuICAgIGlmIChsYXRlc3Rba2V5XSAhPT0gc2VhbGVkW2tleV0pIHtcbiAgICAgIGlmICghbW9kaWZpZWQpIHsgbW9kaWZpZWQgPSB7fTsgfVxuICAgICAgbW9kaWZpZWRba2V5XSA9IGRlZHVwZShsYXRlc3Rba2V5XSwgZXh0ZW5kZWRba2V5XSwgc2VhbGVkW2tleV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbW9kaWZpZWRcbn1cblxuZnVuY3Rpb24gZGVkdXBlIChsYXRlc3QsIGV4dGVuZGVkLCBzZWFsZWQpIHtcbiAgLy8gY29tcGFyZSBsYXRlc3QgYW5kIHNlYWxlZCB0byBlbnN1cmUgbGlmZWN5Y2xlIGhvb2tzIHdvbid0IGJlIGR1cGxpY2F0ZWRcbiAgLy8gYmV0d2VlbiBtZXJnZXNcbiAgaWYgKEFycmF5LmlzQXJyYXkobGF0ZXN0KSkge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBzZWFsZWQgPSBBcnJheS5pc0FycmF5KHNlYWxlZCkgPyBzZWFsZWQgOiBbc2VhbGVkXTtcbiAgICBleHRlbmRlZCA9IEFycmF5LmlzQXJyYXkoZXh0ZW5kZWQpID8gZXh0ZW5kZWQgOiBbZXh0ZW5kZWRdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF0ZXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBwdXNoIG9yaWdpbmFsIG9wdGlvbnMgYW5kIG5vdCBzZWFsZWQgb3B0aW9ucyB0byBleGNsdWRlIGR1cGxpY2F0ZWQgb3B0aW9uc1xuICAgICAgaWYgKGV4dGVuZGVkLmluZGV4T2YobGF0ZXN0W2ldKSA+PSAwIHx8IHNlYWxlZC5pbmRleE9mKGxhdGVzdFtpXSkgPCAwKSB7XG4gICAgICAgIHJlcy5wdXNoKGxhdGVzdFtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXNcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbGF0ZXN0XG4gIH1cbn1cblxuZnVuY3Rpb24gVnVlJDIgKG9wdGlvbnMpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiZcbiAgICAhKHRoaXMgaW5zdGFuY2VvZiBWdWUkMilcbiAgKSB7XG4gICAgd2FybignVnVlIGlzIGEgY29uc3RydWN0b3IgYW5kIHNob3VsZCBiZSBjYWxsZWQgd2l0aCB0aGUgYG5ld2Aga2V5d29yZCcpO1xuICB9XG4gIHRoaXMuX2luaXQob3B0aW9ucyk7XG59XG5cbmluaXRNaXhpbihWdWUkMik7XG5zdGF0ZU1peGluKFZ1ZSQyKTtcbmV2ZW50c01peGluKFZ1ZSQyKTtcbmxpZmVjeWNsZU1peGluKFZ1ZSQyKTtcbnJlbmRlck1peGluKFZ1ZSQyKTtcblxuLyogICovXG5cbmZ1bmN0aW9uIGluaXRVc2UgKFZ1ZSkge1xuICBWdWUudXNlID0gZnVuY3Rpb24gKHBsdWdpbikge1xuICAgIHZhciBpbnN0YWxsZWRQbHVnaW5zID0gKHRoaXMuX2luc3RhbGxlZFBsdWdpbnMgfHwgKHRoaXMuX2luc3RhbGxlZFBsdWdpbnMgPSBbXSkpO1xuICAgIGlmIChpbnN0YWxsZWRQbHVnaW5zLmluZGV4T2YocGx1Z2luKSA+IC0xKSB7XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8vIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xuICAgIHZhciBhcmdzID0gdG9BcnJheShhcmd1bWVudHMsIDEpO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICBpZiAodHlwZW9mIHBsdWdpbi5pbnN0YWxsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwbHVnaW4uaW5zdGFsbC5hcHBseShwbHVnaW4sIGFyZ3MpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBsdWdpbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcGx1Z2luLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH1cbiAgICBpbnN0YWxsZWRQbHVnaW5zLnB1c2gocGx1Z2luKTtcbiAgICByZXR1cm4gdGhpc1xuICB9O1xufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gaW5pdE1peGluJDEgKFZ1ZSkge1xuICBWdWUubWl4aW4gPSBmdW5jdGlvbiAobWl4aW4pIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBtZXJnZU9wdGlvbnModGhpcy5vcHRpb25zLCBtaXhpbik7XG4gICAgcmV0dXJuIHRoaXNcbiAgfTtcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGluaXRFeHRlbmQgKFZ1ZSkge1xuICAvKipcbiAgICogRWFjaCBpbnN0YW5jZSBjb25zdHJ1Y3RvciwgaW5jbHVkaW5nIFZ1ZSwgaGFzIGEgdW5pcXVlXG4gICAqIGNpZC4gVGhpcyBlbmFibGVzIHVzIHRvIGNyZWF0ZSB3cmFwcGVkIFwiY2hpbGRcbiAgICogY29uc3RydWN0b3JzXCIgZm9yIHByb3RvdHlwYWwgaW5oZXJpdGFuY2UgYW5kIGNhY2hlIHRoZW0uXG4gICAqL1xuICBWdWUuY2lkID0gMDtcbiAgdmFyIGNpZCA9IDE7XG5cbiAgLyoqXG4gICAqIENsYXNzIGluaGVyaXRhbmNlXG4gICAqL1xuICBWdWUuZXh0ZW5kID0gZnVuY3Rpb24gKGV4dGVuZE9wdGlvbnMpIHtcbiAgICBleHRlbmRPcHRpb25zID0gZXh0ZW5kT3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgU3VwZXIgPSB0aGlzO1xuICAgIHZhciBTdXBlcklkID0gU3VwZXIuY2lkO1xuICAgIHZhciBjYWNoZWRDdG9ycyA9IGV4dGVuZE9wdGlvbnMuX0N0b3IgfHwgKGV4dGVuZE9wdGlvbnMuX0N0b3IgPSB7fSk7XG4gICAgaWYgKGNhY2hlZEN0b3JzW1N1cGVySWRdKSB7XG4gICAgICByZXR1cm4gY2FjaGVkQ3RvcnNbU3VwZXJJZF1cbiAgICB9XG5cbiAgICB2YXIgbmFtZSA9IGV4dGVuZE9wdGlvbnMubmFtZSB8fCBTdXBlci5vcHRpb25zLm5hbWU7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgbmFtZSkge1xuICAgICAgdmFsaWRhdGVDb21wb25lbnROYW1lKG5hbWUpO1xuICAgIH1cblxuICAgIHZhciBTdWIgPSBmdW5jdGlvbiBWdWVDb21wb25lbnQgKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuX2luaXQob3B0aW9ucyk7XG4gICAgfTtcbiAgICBTdWIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdXBlci5wcm90b3R5cGUpO1xuICAgIFN1Yi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdWI7XG4gICAgU3ViLmNpZCA9IGNpZCsrO1xuICAgIFN1Yi5vcHRpb25zID0gbWVyZ2VPcHRpb25zKFxuICAgICAgU3VwZXIub3B0aW9ucyxcbiAgICAgIGV4dGVuZE9wdGlvbnNcbiAgICApO1xuICAgIFN1Ylsnc3VwZXInXSA9IFN1cGVyO1xuXG4gICAgLy8gRm9yIHByb3BzIGFuZCBjb21wdXRlZCBwcm9wZXJ0aWVzLCB3ZSBkZWZpbmUgdGhlIHByb3h5IGdldHRlcnMgb25cbiAgICAvLyB0aGUgVnVlIGluc3RhbmNlcyBhdCBleHRlbnNpb24gdGltZSwgb24gdGhlIGV4dGVuZGVkIHByb3RvdHlwZS4gVGhpc1xuICAgIC8vIGF2b2lkcyBPYmplY3QuZGVmaW5lUHJvcGVydHkgY2FsbHMgZm9yIGVhY2ggaW5zdGFuY2UgY3JlYXRlZC5cbiAgICBpZiAoU3ViLm9wdGlvbnMucHJvcHMpIHtcbiAgICAgIGluaXRQcm9wcyQxKFN1Yik7XG4gICAgfVxuICAgIGlmIChTdWIub3B0aW9ucy5jb21wdXRlZCkge1xuICAgICAgaW5pdENvbXB1dGVkJDEoU3ViKTtcbiAgICB9XG5cbiAgICAvLyBhbGxvdyBmdXJ0aGVyIGV4dGVuc2lvbi9taXhpbi9wbHVnaW4gdXNhZ2VcbiAgICBTdWIuZXh0ZW5kID0gU3VwZXIuZXh0ZW5kO1xuICAgIFN1Yi5taXhpbiA9IFN1cGVyLm1peGluO1xuICAgIFN1Yi51c2UgPSBTdXBlci51c2U7XG5cbiAgICAvLyBjcmVhdGUgYXNzZXQgcmVnaXN0ZXJzLCBzbyBleHRlbmRlZCBjbGFzc2VzXG4gICAgLy8gY2FuIGhhdmUgdGhlaXIgcHJpdmF0ZSBhc3NldHMgdG9vLlxuICAgIEFTU0VUX1RZUEVTLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgIFN1Ylt0eXBlXSA9IFN1cGVyW3R5cGVdO1xuICAgIH0pO1xuICAgIC8vIGVuYWJsZSByZWN1cnNpdmUgc2VsZi1sb29rdXBcbiAgICBpZiAobmFtZSkge1xuICAgICAgU3ViLm9wdGlvbnMuY29tcG9uZW50c1tuYW1lXSA9IFN1YjtcbiAgICB9XG5cbiAgICAvLyBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBzdXBlciBvcHRpb25zIGF0IGV4dGVuc2lvbiB0aW1lLlxuICAgIC8vIGxhdGVyIGF0IGluc3RhbnRpYXRpb24gd2UgY2FuIGNoZWNrIGlmIFN1cGVyJ3Mgb3B0aW9ucyBoYXZlXG4gICAgLy8gYmVlbiB1cGRhdGVkLlxuICAgIFN1Yi5zdXBlck9wdGlvbnMgPSBTdXBlci5vcHRpb25zO1xuICAgIFN1Yi5leHRlbmRPcHRpb25zID0gZXh0ZW5kT3B0aW9ucztcbiAgICBTdWIuc2VhbGVkT3B0aW9ucyA9IGV4dGVuZCh7fSwgU3ViLm9wdGlvbnMpO1xuXG4gICAgLy8gY2FjaGUgY29uc3RydWN0b3JcbiAgICBjYWNoZWRDdG9yc1tTdXBlcklkXSA9IFN1YjtcbiAgICByZXR1cm4gU3ViXG4gIH07XG59XG5cbmZ1bmN0aW9uIGluaXRQcm9wcyQxIChDb21wKSB7XG4gIHZhciBwcm9wcyA9IENvbXAub3B0aW9ucy5wcm9wcztcbiAgZm9yICh2YXIga2V5IGluIHByb3BzKSB7XG4gICAgcHJveHkoQ29tcC5wcm90b3R5cGUsIFwiX3Byb3BzXCIsIGtleSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdENvbXB1dGVkJDEgKENvbXApIHtcbiAgdmFyIGNvbXB1dGVkID0gQ29tcC5vcHRpb25zLmNvbXB1dGVkO1xuICBmb3IgKHZhciBrZXkgaW4gY29tcHV0ZWQpIHtcbiAgICBkZWZpbmVDb21wdXRlZChDb21wLnByb3RvdHlwZSwga2V5LCBjb21wdXRlZFtrZXldKTtcbiAgfVxufVxuXG4vKiAgKi9cblxuZnVuY3Rpb24gaW5pdEFzc2V0UmVnaXN0ZXJzIChWdWUpIHtcbiAgLyoqXG4gICAqIENyZWF0ZSBhc3NldCByZWdpc3RyYXRpb24gbWV0aG9kcy5cbiAgICovXG4gIEFTU0VUX1RZUEVTLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICBWdWVbdHlwZV0gPSBmdW5jdGlvbiAoXG4gICAgICBpZCxcbiAgICAgIGRlZmluaXRpb25cbiAgICApIHtcbiAgICAgIGlmICghZGVmaW5pdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zW3R5cGUgKyAncyddW2lkXVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHR5cGUgPT09ICdjb21wb25lbnQnKSB7XG4gICAgICAgICAgdmFsaWRhdGVDb21wb25lbnROYW1lKGlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ2NvbXBvbmVudCcgJiYgaXNQbGFpbk9iamVjdChkZWZpbml0aW9uKSkge1xuICAgICAgICAgIGRlZmluaXRpb24ubmFtZSA9IGRlZmluaXRpb24ubmFtZSB8fCBpZDtcbiAgICAgICAgICBkZWZpbml0aW9uID0gdGhpcy5vcHRpb25zLl9iYXNlLmV4dGVuZChkZWZpbml0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ2RpcmVjdGl2ZScgJiYgdHlwZW9mIGRlZmluaXRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBkZWZpbml0aW9uID0geyBiaW5kOiBkZWZpbml0aW9uLCB1cGRhdGU6IGRlZmluaXRpb24gfTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbdHlwZSArICdzJ11baWRdID0gZGVmaW5pdGlvbjtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25cbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbn1cblxuLyogICovXG5cbmZ1bmN0aW9uIGdldENvbXBvbmVudE5hbWUgKG9wdHMpIHtcbiAgcmV0dXJuIG9wdHMgJiYgKG9wdHMuQ3Rvci5vcHRpb25zLm5hbWUgfHwgb3B0cy50YWcpXG59XG5cbmZ1bmN0aW9uIG1hdGNoZXMgKHBhdHRlcm4sIG5hbWUpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkocGF0dGVybikpIHtcbiAgICByZXR1cm4gcGF0dGVybi5pbmRleE9mKG5hbWUpID4gLTFcbiAgfSBlbHNlIGlmICh0eXBlb2YgcGF0dGVybiA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcGF0dGVybi5zcGxpdCgnLCcpLmluZGV4T2YobmFtZSkgPiAtMVxuICB9IGVsc2UgaWYgKGlzUmVnRXhwKHBhdHRlcm4pKSB7XG4gICAgcmV0dXJuIHBhdHRlcm4udGVzdChuYW1lKVxuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBwcnVuZUNhY2hlIChrZWVwQWxpdmVJbnN0YW5jZSwgZmlsdGVyKSB7XG4gIHZhciBjYWNoZSA9IGtlZXBBbGl2ZUluc3RhbmNlLmNhY2hlO1xuICB2YXIga2V5cyA9IGtlZXBBbGl2ZUluc3RhbmNlLmtleXM7XG4gIHZhciBfdm5vZGUgPSBrZWVwQWxpdmVJbnN0YW5jZS5fdm5vZGU7XG4gIGZvciAodmFyIGtleSBpbiBjYWNoZSkge1xuICAgIHZhciBjYWNoZWROb2RlID0gY2FjaGVba2V5XTtcbiAgICBpZiAoY2FjaGVkTm9kZSkge1xuICAgICAgdmFyIG5hbWUgPSBnZXRDb21wb25lbnROYW1lKGNhY2hlZE5vZGUuY29tcG9uZW50T3B0aW9ucyk7XG4gICAgICBpZiAobmFtZSAmJiAhZmlsdGVyKG5hbWUpKSB7XG4gICAgICAgIHBydW5lQ2FjaGVFbnRyeShjYWNoZSwga2V5LCBrZXlzLCBfdm5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwcnVuZUNhY2hlRW50cnkgKFxuICBjYWNoZSxcbiAga2V5LFxuICBrZXlzLFxuICBjdXJyZW50XG4pIHtcbiAgdmFyIGNhY2hlZCQkMSA9IGNhY2hlW2tleV07XG4gIGlmIChjYWNoZWQkJDEgJiYgKCFjdXJyZW50IHx8IGNhY2hlZCQkMS50YWcgIT09IGN1cnJlbnQudGFnKSkge1xuICAgIGNhY2hlZCQkMS5jb21wb25lbnRJbnN0YW5jZS4kZGVzdHJveSgpO1xuICB9XG4gIGNhY2hlW2tleV0gPSBudWxsO1xuICByZW1vdmUoa2V5cywga2V5KTtcbn1cblxudmFyIHBhdHRlcm5UeXBlcyA9IFtTdHJpbmcsIFJlZ0V4cCwgQXJyYXldO1xuXG52YXIgS2VlcEFsaXZlID0ge1xuICBuYW1lOiAna2VlcC1hbGl2ZScsXG4gIGFic3RyYWN0OiB0cnVlLFxuXG4gIHByb3BzOiB7XG4gICAgaW5jbHVkZTogcGF0dGVyblR5cGVzLFxuICAgIGV4Y2x1ZGU6IHBhdHRlcm5UeXBlcyxcbiAgICBtYXg6IFtTdHJpbmcsIE51bWJlcl1cbiAgfSxcblxuICBjcmVhdGVkOiBmdW5jdGlvbiBjcmVhdGVkICgpIHtcbiAgICB0aGlzLmNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmtleXMgPSBbXTtcbiAgfSxcblxuICBkZXN0cm95ZWQ6IGZ1bmN0aW9uIGRlc3Ryb3llZCAoKSB7XG4gICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcyQxLmNhY2hlKSB7XG4gICAgICBwcnVuZUNhY2hlRW50cnkodGhpcyQxLmNhY2hlLCBrZXksIHRoaXMkMS5rZXlzKTtcbiAgICB9XG4gIH0sXG5cbiAgd2F0Y2g6IHtcbiAgICBpbmNsdWRlOiBmdW5jdGlvbiBpbmNsdWRlICh2YWwpIHtcbiAgICAgIHBydW5lQ2FjaGUodGhpcywgZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIG1hdGNoZXModmFsLCBuYW1lKTsgfSk7XG4gICAgfSxcbiAgICBleGNsdWRlOiBmdW5jdGlvbiBleGNsdWRlICh2YWwpIHtcbiAgICAgIHBydW5lQ2FjaGUodGhpcywgZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuICFtYXRjaGVzKHZhbCwgbmFtZSk7IH0pO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgdmFyIHNsb3QgPSB0aGlzLiRzbG90cy5kZWZhdWx0O1xuICAgIHZhciB2bm9kZSA9IGdldEZpcnN0Q29tcG9uZW50Q2hpbGQoc2xvdCk7XG4gICAgdmFyIGNvbXBvbmVudE9wdGlvbnMgPSB2bm9kZSAmJiB2bm9kZS5jb21wb25lbnRPcHRpb25zO1xuICAgIGlmIChjb21wb25lbnRPcHRpb25zKSB7XG4gICAgICAvLyBjaGVjayBwYXR0ZXJuXG4gICAgICB2YXIgbmFtZSA9IGdldENvbXBvbmVudE5hbWUoY29tcG9uZW50T3B0aW9ucyk7XG4gICAgICB2YXIgcmVmID0gdGhpcztcbiAgICAgIHZhciBpbmNsdWRlID0gcmVmLmluY2x1ZGU7XG4gICAgICB2YXIgZXhjbHVkZSA9IHJlZi5leGNsdWRlO1xuICAgICAgaWYgKFxuICAgICAgICAvLyBub3QgaW5jbHVkZWRcbiAgICAgICAgKGluY2x1ZGUgJiYgKCFuYW1lIHx8ICFtYXRjaGVzKGluY2x1ZGUsIG5hbWUpKSkgfHxcbiAgICAgICAgLy8gZXhjbHVkZWRcbiAgICAgICAgKGV4Y2x1ZGUgJiYgbmFtZSAmJiBtYXRjaGVzKGV4Y2x1ZGUsIG5hbWUpKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB2bm9kZVxuICAgICAgfVxuXG4gICAgICB2YXIgcmVmJDEgPSB0aGlzO1xuICAgICAgdmFyIGNhY2hlID0gcmVmJDEuY2FjaGU7XG4gICAgICB2YXIga2V5cyA9IHJlZiQxLmtleXM7XG4gICAgICB2YXIga2V5ID0gdm5vZGUua2V5ID09IG51bGxcbiAgICAgICAgLy8gc2FtZSBjb25zdHJ1Y3RvciBtYXkgZ2V0IHJlZ2lzdGVyZWQgYXMgZGlmZmVyZW50IGxvY2FsIGNvbXBvbmVudHNcbiAgICAgICAgLy8gc28gY2lkIGFsb25lIGlzIG5vdCBlbm91Z2ggKCMzMjY5KVxuICAgICAgICA/IGNvbXBvbmVudE9wdGlvbnMuQ3Rvci5jaWQgKyAoY29tcG9uZW50T3B0aW9ucy50YWcgPyAoXCI6OlwiICsgKGNvbXBvbmVudE9wdGlvbnMudGFnKSkgOiAnJylcbiAgICAgICAgOiB2bm9kZS5rZXk7XG4gICAgICBpZiAoY2FjaGVba2V5XSkge1xuICAgICAgICB2bm9kZS5jb21wb25lbnRJbnN0YW5jZSA9IGNhY2hlW2tleV0uY29tcG9uZW50SW5zdGFuY2U7XG4gICAgICAgIC8vIG1ha2UgY3VycmVudCBrZXkgZnJlc2hlc3RcbiAgICAgICAgcmVtb3ZlKGtleXMsIGtleSk7XG4gICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FjaGVba2V5XSA9IHZub2RlO1xuICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgLy8gcHJ1bmUgb2xkZXN0IGVudHJ5XG4gICAgICAgIGlmICh0aGlzLm1heCAmJiBrZXlzLmxlbmd0aCA+IHBhcnNlSW50KHRoaXMubWF4KSkge1xuICAgICAgICAgIHBydW5lQ2FjaGVFbnRyeShjYWNoZSwga2V5c1swXSwga2V5cywgdGhpcy5fdm5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZub2RlLmRhdGEua2VlcEFsaXZlID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHZub2RlIHx8IChzbG90ICYmIHNsb3RbMF0pXG4gIH1cbn07XG5cbnZhciBidWlsdEluQ29tcG9uZW50cyA9IHtcbiAgS2VlcEFsaXZlOiBLZWVwQWxpdmVcbn07XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBpbml0R2xvYmFsQVBJIChWdWUpIHtcbiAgLy8gY29uZmlnXG4gIHZhciBjb25maWdEZWYgPSB7fTtcbiAgY29uZmlnRGVmLmdldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbmZpZzsgfTtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBjb25maWdEZWYuc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgd2FybihcbiAgICAgICAgJ0RvIG5vdCByZXBsYWNlIHRoZSBWdWUuY29uZmlnIG9iamVjdCwgc2V0IGluZGl2aWR1YWwgZmllbGRzIGluc3RlYWQuJ1xuICAgICAgKTtcbiAgICB9O1xuICB9XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShWdWUsICdjb25maWcnLCBjb25maWdEZWYpO1xuXG4gIC8vIGV4cG9zZWQgdXRpbCBtZXRob2RzLlxuICAvLyBOT1RFOiB0aGVzZSBhcmUgbm90IGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgcHVibGljIEFQSSAtIGF2b2lkIHJlbHlpbmcgb25cbiAgLy8gdGhlbSB1bmxlc3MgeW91IGFyZSBhd2FyZSBvZiB0aGUgcmlzay5cbiAgVnVlLnV0aWwgPSB7XG4gICAgd2Fybjogd2FybixcbiAgICBleHRlbmQ6IGV4dGVuZCxcbiAgICBtZXJnZU9wdGlvbnM6IG1lcmdlT3B0aW9ucyxcbiAgICBkZWZpbmVSZWFjdGl2ZTogZGVmaW5lUmVhY3RpdmVcbiAgfTtcblxuICBWdWUuc2V0ID0gc2V0O1xuICBWdWUuZGVsZXRlID0gZGVsO1xuICBWdWUubmV4dFRpY2sgPSBuZXh0VGljaztcblxuICBWdWUub3B0aW9ucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIEFTU0VUX1RZUEVTLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICBWdWUub3B0aW9uc1t0eXBlICsgJ3MnXSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIH0pO1xuXG4gIC8vIHRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgXCJiYXNlXCIgY29uc3RydWN0b3IgdG8gZXh0ZW5kIGFsbCBwbGFpbi1vYmplY3RcbiAgLy8gY29tcG9uZW50cyB3aXRoIGluIFdlZXgncyBtdWx0aS1pbnN0YW5jZSBzY2VuYXJpb3MuXG4gIFZ1ZS5vcHRpb25zLl9iYXNlID0gVnVlO1xuXG4gIGV4dGVuZChWdWUub3B0aW9ucy5jb21wb25lbnRzLCBidWlsdEluQ29tcG9uZW50cyk7XG5cbiAgaW5pdFVzZShWdWUpO1xuICBpbml0TWl4aW4kMShWdWUpO1xuICBpbml0RXh0ZW5kKFZ1ZSk7XG4gIGluaXRBc3NldFJlZ2lzdGVycyhWdWUpO1xufVxuXG5pbml0R2xvYmFsQVBJKFZ1ZSQyKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFZ1ZSQyLnByb3RvdHlwZSwgJyRpc1NlcnZlcicsIHtcbiAgZ2V0OiBpc1NlcnZlclJlbmRlcmluZ1xufSk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShWdWUkMi5wcm90b3R5cGUsICckc3NyQ29udGV4dCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiBnZXQgKCkge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIHRoaXMuJHZub2RlICYmIHRoaXMuJHZub2RlLnNzckNvbnRleHRcbiAgfVxufSk7XG5cblZ1ZSQyLnZlcnNpb24gPSAnMi41LjExJztcblxudmFyIGxhdGVzdE5vZGVJZCA9IDE7XG5cbmZ1bmN0aW9uIFRleHROb2RlICh0ZXh0KSB7XG4gIHRoaXMuaW5zdGFuY2VJZCA9ICcnO1xuICB0aGlzLm5vZGVJZCA9IGxhdGVzdE5vZGVJZCsrO1xuICB0aGlzLnBhcmVudE5vZGUgPSBudWxsO1xuICB0aGlzLm5vZGVUeXBlID0gMztcbiAgdGhpcy50ZXh0ID0gdGV4dDtcbn1cblxuLyogZ2xvYmFscyBkb2N1bWVudCAqL1xuLy8gZG9jdW1lbnQgaXMgaW5qZWN0ZWQgYnkgd2VleCBmYWN0b3J5IHdyYXBwZXJcblxudmFyIG5hbWVzcGFjZU1hcCA9IHt9O1xuXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50JDEgKHRhZ05hbWUpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TIChuYW1lc3BhY2UsIHRhZ05hbWUpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZXNwYWNlICsgJzonICsgdGFnTmFtZSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUgKHRleHQpIHtcbiAgcmV0dXJuIG5ldyBUZXh0Tm9kZSh0ZXh0KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDb21tZW50ICh0ZXh0KSB7XG4gIHJldHVybiBkb2N1bWVudC5jcmVhdGVDb21tZW50KHRleHQpXG59XG5cbmZ1bmN0aW9uIGluc2VydEJlZm9yZSAobm9kZSwgdGFyZ2V0LCBiZWZvcmUpIHtcbiAgaWYgKHRhcmdldC5ub2RlVHlwZSA9PT0gMykge1xuICAgIGlmIChub2RlLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgbm9kZS5zZXRBdHRyKCd2YWx1ZScsIHRhcmdldC50ZXh0KTtcbiAgICAgIHRhcmdldC5wYXJlbnROb2RlID0gbm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHRleHQgPSBjcmVhdGVFbGVtZW50JDEoJ3RleHQnKTtcbiAgICAgIHRleHQuc2V0QXR0cigndmFsdWUnLCB0YXJnZXQudGV4dCk7XG4gICAgICBub2RlLmluc2VydEJlZm9yZSh0ZXh0LCBiZWZvcmUpO1xuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBub2RlLmluc2VydEJlZm9yZSh0YXJnZXQsIGJlZm9yZSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNoaWxkIChub2RlLCBjaGlsZCkge1xuICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDMpIHtcbiAgICBub2RlLnNldEF0dHIoJ3ZhbHVlJywgJycpO1xuICAgIHJldHVyblxuICB9XG4gIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRDaGlsZCAobm9kZSwgY2hpbGQpIHtcbiAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAzKSB7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICBub2RlLnNldEF0dHIoJ3ZhbHVlJywgY2hpbGQudGV4dCk7XG4gICAgICBjaGlsZC5wYXJlbnROb2RlID0gbm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHRleHQgPSBjcmVhdGVFbGVtZW50JDEoJ3RleHQnKTtcbiAgICAgIHRleHQuc2V0QXR0cigndmFsdWUnLCBjaGlsZC50ZXh0KTtcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgfVxuICAgIHJldHVyblxuICB9XG5cbiAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZCk7XG59XG5cbmZ1bmN0aW9uIHBhcmVudE5vZGUgKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUucGFyZW50Tm9kZVxufVxuXG5mdW5jdGlvbiBuZXh0U2libGluZyAobm9kZSkge1xuICByZXR1cm4gbm9kZS5uZXh0U2libGluZ1xufVxuXG5mdW5jdGlvbiB0YWdOYW1lIChub2RlKSB7XG4gIHJldHVybiBub2RlLnR5cGVcbn1cblxuZnVuY3Rpb24gc2V0VGV4dENvbnRlbnQgKG5vZGUsIHRleHQpIHtcbiAgbm9kZS5wYXJlbnROb2RlLnNldEF0dHIoJ3ZhbHVlJywgdGV4dCk7XG59XG5cbmZ1bmN0aW9uIHNldEF0dHJpYnV0ZSAobm9kZSwga2V5LCB2YWwpIHtcbiAgbm9kZS5zZXRBdHRyKGtleSwgdmFsKTtcbn1cblxuXG52YXIgbm9kZU9wcyA9IE9iamVjdC5mcmVlemUoe1xuXHRuYW1lc3BhY2VNYXA6IG5hbWVzcGFjZU1hcCxcblx0Y3JlYXRlRWxlbWVudDogY3JlYXRlRWxlbWVudCQxLFxuXHRjcmVhdGVFbGVtZW50TlM6IGNyZWF0ZUVsZW1lbnROUyxcblx0Y3JlYXRlVGV4dE5vZGU6IGNyZWF0ZVRleHROb2RlLFxuXHRjcmVhdGVDb21tZW50OiBjcmVhdGVDb21tZW50LFxuXHRpbnNlcnRCZWZvcmU6IGluc2VydEJlZm9yZSxcblx0cmVtb3ZlQ2hpbGQ6IHJlbW92ZUNoaWxkLFxuXHRhcHBlbmRDaGlsZDogYXBwZW5kQ2hpbGQsXG5cdHBhcmVudE5vZGU6IHBhcmVudE5vZGUsXG5cdG5leHRTaWJsaW5nOiBuZXh0U2libGluZyxcblx0dGFnTmFtZTogdGFnTmFtZSxcblx0c2V0VGV4dENvbnRlbnQ6IHNldFRleHRDb250ZW50LFxuXHRzZXRBdHRyaWJ1dGU6IHNldEF0dHJpYnV0ZVxufSk7XG5cbi8qICAqL1xuXG52YXIgcmVmID0ge1xuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZSAoXywgdm5vZGUpIHtcbiAgICByZWdpc3RlclJlZih2bm9kZSk7XG4gIH0sXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlIChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICBpZiAob2xkVm5vZGUuZGF0YS5yZWYgIT09IHZub2RlLmRhdGEucmVmKSB7XG4gICAgICByZWdpc3RlclJlZihvbGRWbm9kZSwgdHJ1ZSk7XG4gICAgICByZWdpc3RlclJlZih2bm9kZSk7XG4gICAgfVxuICB9LFxuICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95ICh2bm9kZSkge1xuICAgIHJlZ2lzdGVyUmVmKHZub2RlLCB0cnVlKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcmVnaXN0ZXJSZWYgKHZub2RlLCBpc1JlbW92YWwpIHtcbiAgdmFyIGtleSA9IHZub2RlLmRhdGEucmVmO1xuICBpZiAoIWtleSkgeyByZXR1cm4gfVxuXG4gIHZhciB2bSA9IHZub2RlLmNvbnRleHQ7XG4gIHZhciByZWYgPSB2bm9kZS5jb21wb25lbnRJbnN0YW5jZSB8fCB2bm9kZS5lbG07XG4gIHZhciByZWZzID0gdm0uJHJlZnM7XG4gIGlmIChpc1JlbW92YWwpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShyZWZzW2tleV0pKSB7XG4gICAgICByZW1vdmUocmVmc1trZXldLCByZWYpO1xuICAgIH0gZWxzZSBpZiAocmVmc1trZXldID09PSByZWYpIHtcbiAgICAgIHJlZnNba2V5XSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHZub2RlLmRhdGEucmVmSW5Gb3IpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZWZzW2tleV0pKSB7XG4gICAgICAgIHJlZnNba2V5XSA9IFtyZWZdO1xuICAgICAgfSBlbHNlIGlmIChyZWZzW2tleV0uaW5kZXhPZihyZWYpIDwgMCkge1xuICAgICAgICAvLyAkZmxvdy1kaXNhYmxlLWxpbmVcbiAgICAgICAgcmVmc1trZXldLnB1c2gocmVmKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVmc1trZXldID0gcmVmO1xuICAgIH1cbiAgfVxufVxuXG4vKiAgKi9cblxuXG5cbnZhciBpc0hUTUxUYWcgPSBtYWtlTWFwKFxuICAnaHRtbCxib2R5LGJhc2UsaGVhZCxsaW5rLG1ldGEsc3R5bGUsdGl0bGUsJyArXG4gICdhZGRyZXNzLGFydGljbGUsYXNpZGUsZm9vdGVyLGhlYWRlcixoMSxoMixoMyxoNCxoNSxoNixoZ3JvdXAsbmF2LHNlY3Rpb24sJyArXG4gICdkaXYsZGQsZGwsZHQsZmlnY2FwdGlvbixmaWd1cmUscGljdHVyZSxocixpbWcsbGksbWFpbixvbCxwLHByZSx1bCwnICtcbiAgJ2EsYixhYmJyLGJkaSxiZG8sYnIsY2l0ZSxjb2RlLGRhdGEsZGZuLGVtLGksa2JkLG1hcmsscSxycCxydCxydGMscnVieSwnICtcbiAgJ3Msc2FtcCxzbWFsbCxzcGFuLHN0cm9uZyxzdWIsc3VwLHRpbWUsdSx2YXIsd2JyLGFyZWEsYXVkaW8sbWFwLHRyYWNrLHZpZGVvLCcgK1xuICAnZW1iZWQsb2JqZWN0LHBhcmFtLHNvdXJjZSxjYW52YXMsc2NyaXB0LG5vc2NyaXB0LGRlbCxpbnMsJyArXG4gICdjYXB0aW9uLGNvbCxjb2xncm91cCx0YWJsZSx0aGVhZCx0Ym9keSx0ZCx0aCx0ciwnICtcbiAgJ2J1dHRvbixkYXRhbGlzdCxmaWVsZHNldCxmb3JtLGlucHV0LGxhYmVsLGxlZ2VuZCxtZXRlcixvcHRncm91cCxvcHRpb24sJyArXG4gICdvdXRwdXQscHJvZ3Jlc3Msc2VsZWN0LHRleHRhcmVhLCcgK1xuICAnZGV0YWlscyxkaWFsb2csbWVudSxtZW51aXRlbSxzdW1tYXJ5LCcgK1xuICAnY29udGVudCxlbGVtZW50LHNoYWRvdyx0ZW1wbGF0ZSxibG9ja3F1b3RlLGlmcmFtZSx0Zm9vdCdcbik7XG5cbi8vIHRoaXMgbWFwIGlzIGludGVudGlvbmFsbHkgc2VsZWN0aXZlLCBvbmx5IGNvdmVyaW5nIFNWRyBlbGVtZW50cyB0aGF0IG1heVxuLy8gY29udGFpbiBjaGlsZCBlbGVtZW50cy5cbnZhciBpc1NWRyA9IG1ha2VNYXAoXG4gICdzdmcsYW5pbWF0ZSxjaXJjbGUsY2xpcHBhdGgsY3Vyc29yLGRlZnMsZGVzYyxlbGxpcHNlLGZpbHRlcixmb250LWZhY2UsJyArXG4gICdmb3JlaWduT2JqZWN0LGcsZ2x5cGgsaW1hZ2UsbGluZSxtYXJrZXIsbWFzayxtaXNzaW5nLWdseXBoLHBhdGgscGF0dGVybiwnICtcbiAgJ3BvbHlnb24scG9seWxpbmUscmVjdCxzd2l0Y2gsc3ltYm9sLHRleHQsdGV4dHBhdGgsdHNwYW4sdXNlLHZpZXcnLFxuICB0cnVlXG4pO1xuXG5cblxuXG5cblxuXG5cblxudmFyIGlzVGV4dElucHV0VHlwZSA9IG1ha2VNYXAoJ3RleHQsbnVtYmVyLHBhc3N3b3JkLHNlYXJjaCxlbWFpbCx0ZWwsdXJsJyk7XG5cbi8qKlxuICogVmlydHVhbCBET00gcGF0Y2hpbmcgYWxnb3JpdGhtIGJhc2VkIG9uIFNuYWJiZG9tIGJ5XG4gKiBTaW1vbiBGcmlpcyBWaW5kdW0gKEBwYWxkZXBpbmQpXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9wYWxkZXBpbmQvc25hYmJkb20vYmxvYi9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIG1vZGlmaWVkIGJ5IEV2YW4gWW91IChAeXl4OTkwODAzKVxuICpcbiAqIE5vdCB0eXBlLWNoZWNraW5nIHRoaXMgYmVjYXVzZSB0aGlzIGZpbGUgaXMgcGVyZi1jcml0aWNhbCBhbmQgdGhlIGNvc3RcbiAqIG9mIG1ha2luZyBmbG93IHVuZGVyc3RhbmQgaXQgaXMgbm90IHdvcnRoIGl0LlxuICovXG5cbnZhciBlbXB0eU5vZGUgPSBuZXcgVk5vZGUoJycsIHt9LCBbXSk7XG5cbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ2FjdGl2YXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveSddO1xuXG5mdW5jdGlvbiBzYW1lVm5vZGUgKGEsIGIpIHtcbiAgcmV0dXJuIChcbiAgICBhLmtleSA9PT0gYi5rZXkgJiYgKFxuICAgICAgKFxuICAgICAgICBhLnRhZyA9PT0gYi50YWcgJiZcbiAgICAgICAgYS5pc0NvbW1lbnQgPT09IGIuaXNDb21tZW50ICYmXG4gICAgICAgIGlzRGVmKGEuZGF0YSkgPT09IGlzRGVmKGIuZGF0YSkgJiZcbiAgICAgICAgc2FtZUlucHV0VHlwZShhLCBiKVxuICAgICAgKSB8fCAoXG4gICAgICAgIGlzVHJ1ZShhLmlzQXN5bmNQbGFjZWhvbGRlcikgJiZcbiAgICAgICAgYS5hc3luY0ZhY3RvcnkgPT09IGIuYXN5bmNGYWN0b3J5ICYmXG4gICAgICAgIGlzVW5kZWYoYi5hc3luY0ZhY3RvcnkuZXJyb3IpXG4gICAgICApXG4gICAgKVxuICApXG59XG5cbmZ1bmN0aW9uIHNhbWVJbnB1dFR5cGUgKGEsIGIpIHtcbiAgaWYgKGEudGFnICE9PSAnaW5wdXQnKSB7IHJldHVybiB0cnVlIH1cbiAgdmFyIGk7XG4gIHZhciB0eXBlQSA9IGlzRGVmKGkgPSBhLmRhdGEpICYmIGlzRGVmKGkgPSBpLmF0dHJzKSAmJiBpLnR5cGU7XG4gIHZhciB0eXBlQiA9IGlzRGVmKGkgPSBiLmRhdGEpICYmIGlzRGVmKGkgPSBpLmF0dHJzKSAmJiBpLnR5cGU7XG4gIHJldHVybiB0eXBlQSA9PT0gdHlwZUIgfHwgaXNUZXh0SW5wdXRUeXBlKHR5cGVBKSAmJiBpc1RleHRJbnB1dFR5cGUodHlwZUIpXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUtleVRvT2xkSWR4IChjaGlsZHJlbiwgYmVnaW5JZHgsIGVuZElkeCkge1xuICB2YXIgaSwga2V5O1xuICB2YXIgbWFwID0ge307XG4gIGZvciAoaSA9IGJlZ2luSWR4OyBpIDw9IGVuZElkeDsgKytpKSB7XG4gICAga2V5ID0gY2hpbGRyZW5baV0ua2V5O1xuICAgIGlmIChpc0RlZihrZXkpKSB7IG1hcFtrZXldID0gaTsgfVxuICB9XG4gIHJldHVybiBtYXBcbn1cblxuZnVuY3Rpb24gY3JlYXRlUGF0Y2hGdW5jdGlvbiAoYmFja2VuZCkge1xuICB2YXIgaSwgajtcbiAgdmFyIGNicyA9IHt9O1xuXG4gIHZhciBtb2R1bGVzID0gYmFja2VuZC5tb2R1bGVzO1xuICB2YXIgbm9kZU9wcyA9IGJhY2tlbmQubm9kZU9wcztcblxuICBmb3IgKGkgPSAwOyBpIDwgaG9va3MubGVuZ3RoOyArK2kpIHtcbiAgICBjYnNbaG9va3NbaV1dID0gW107XG4gICAgZm9yIChqID0gMDsgaiA8IG1vZHVsZXMubGVuZ3RoOyArK2opIHtcbiAgICAgIGlmIChpc0RlZihtb2R1bGVzW2pdW2hvb2tzW2ldXSkpIHtcbiAgICAgICAgY2JzW2hvb2tzW2ldXS5wdXNoKG1vZHVsZXNbal1baG9va3NbaV1dKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBlbXB0eU5vZGVBdCAoZWxtKSB7XG4gICAgcmV0dXJuIG5ldyBWTm9kZShub2RlT3BzLnRhZ05hbWUoZWxtKS50b0xvd2VyQ2FzZSgpLCB7fSwgW10sIHVuZGVmaW5lZCwgZWxtKVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUm1DYiAoY2hpbGRFbG0sIGxpc3RlbmVycykge1xuICAgIGZ1bmN0aW9uIHJlbW92ZSAoKSB7XG4gICAgICBpZiAoLS1yZW1vdmUubGlzdGVuZXJzID09PSAwKSB7XG4gICAgICAgIHJlbW92ZU5vZGUoY2hpbGRFbG0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZW1vdmUubGlzdGVuZXJzID0gbGlzdGVuZXJzO1xuICAgIHJldHVybiByZW1vdmVcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZU5vZGUgKGVsKSB7XG4gICAgdmFyIHBhcmVudCA9IG5vZGVPcHMucGFyZW50Tm9kZShlbCk7XG4gICAgLy8gZWxlbWVudCBtYXkgaGF2ZSBhbHJlYWR5IGJlZW4gcmVtb3ZlZCBkdWUgdG8gdi1odG1sIC8gdi10ZXh0XG4gICAgaWYgKGlzRGVmKHBhcmVudCkpIHtcbiAgICAgIG5vZGVPcHMucmVtb3ZlQ2hpbGQocGFyZW50LCBlbCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNVbmtub3duRWxlbWVudCQkMSAodm5vZGUsIGluVlByZSkge1xuICAgIHJldHVybiAoXG4gICAgICAhaW5WUHJlICYmXG4gICAgICAhdm5vZGUubnMgJiZcbiAgICAgICEoXG4gICAgICAgIGNvbmZpZy5pZ25vcmVkRWxlbWVudHMubGVuZ3RoICYmXG4gICAgICAgIGNvbmZpZy5pZ25vcmVkRWxlbWVudHMuc29tZShmdW5jdGlvbiAoaWdub3JlKSB7XG4gICAgICAgICAgcmV0dXJuIGlzUmVnRXhwKGlnbm9yZSlcbiAgICAgICAgICAgID8gaWdub3JlLnRlc3Qodm5vZGUudGFnKVxuICAgICAgICAgICAgOiBpZ25vcmUgPT09IHZub2RlLnRhZ1xuICAgICAgICB9KVxuICAgICAgKSAmJlxuICAgICAgY29uZmlnLmlzVW5rbm93bkVsZW1lbnQodm5vZGUudGFnKVxuICAgIClcbiAgfVxuXG4gIHZhciBjcmVhdGluZ0VsbUluVlByZSA9IDA7XG4gIGZ1bmN0aW9uIGNyZWF0ZUVsbSAodm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgcGFyZW50RWxtLCByZWZFbG0sIG5lc3RlZCkge1xuICAgIHZub2RlLmlzUm9vdEluc2VydCA9ICFuZXN0ZWQ7IC8vIGZvciB0cmFuc2l0aW9uIGVudGVyIGNoZWNrXG4gICAgaWYgKGNyZWF0ZUNvbXBvbmVudCh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBwYXJlbnRFbG0sIHJlZkVsbSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHZhciBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICB2YXIgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICB2YXIgdGFnID0gdm5vZGUudGFnO1xuICAgIGlmIChpc0RlZih0YWcpKSB7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLnByZSkge1xuICAgICAgICAgIGNyZWF0aW5nRWxtSW5WUHJlKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVW5rbm93bkVsZW1lbnQkJDEodm5vZGUsIGNyZWF0aW5nRWxtSW5WUHJlKSkge1xuICAgICAgICAgIHdhcm4oXG4gICAgICAgICAgICAnVW5rbm93biBjdXN0b20gZWxlbWVudDogPCcgKyB0YWcgKyAnPiAtIGRpZCB5b3UgJyArXG4gICAgICAgICAgICAncmVnaXN0ZXIgdGhlIGNvbXBvbmVudCBjb3JyZWN0bHk/IEZvciByZWN1cnNpdmUgY29tcG9uZW50cywgJyArXG4gICAgICAgICAgICAnbWFrZSBzdXJlIHRvIHByb3ZpZGUgdGhlIFwibmFtZVwiIG9wdGlvbi4nLFxuICAgICAgICAgICAgdm5vZGUuY29udGV4dFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZub2RlLmVsbSA9IHZub2RlLm5zXG4gICAgICAgID8gbm9kZU9wcy5jcmVhdGVFbGVtZW50TlModm5vZGUubnMsIHRhZylcbiAgICAgICAgOiBub2RlT3BzLmNyZWF0ZUVsZW1lbnQodGFnLCB2bm9kZSk7XG4gICAgICBzZXRTY29wZSh2bm9kZSk7XG5cbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAge1xuICAgICAgICAvLyBpbiBXZWV4LCB0aGUgZGVmYXVsdCBpbnNlcnRpb24gb3JkZXIgaXMgcGFyZW50LWZpcnN0LlxuICAgICAgICAvLyBMaXN0IGl0ZW1zIGNhbiBiZSBvcHRpbWl6ZWQgdG8gdXNlIGNoaWxkcmVuLWZpcnN0IGluc2VydGlvblxuICAgICAgICAvLyB3aXRoIGFwcGVuZD1cInRyZWVcIi5cbiAgICAgICAgdmFyIGFwcGVuZEFzVHJlZSA9IGlzRGVmKGRhdGEpICYmIGlzVHJ1ZShkYXRhLmFwcGVuZEFzVHJlZSk7XG4gICAgICAgIGlmICghYXBwZW5kQXNUcmVlKSB7XG4gICAgICAgICAgaWYgKGlzRGVmKGRhdGEpKSB7XG4gICAgICAgICAgICBpbnZva2VDcmVhdGVIb29rcyh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW5zZXJ0KHBhcmVudEVsbSwgdm5vZGUuZWxtLCByZWZFbG0pO1xuICAgICAgICB9XG4gICAgICAgIGNyZWF0ZUNoaWxkcmVuKHZub2RlLCBjaGlsZHJlbiwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgaWYgKGFwcGVuZEFzVHJlZSkge1xuICAgICAgICAgIGlmIChpc0RlZihkYXRhKSkge1xuICAgICAgICAgICAgaW52b2tlQ3JlYXRlSG9va3Modm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGluc2VydChwYXJlbnRFbG0sIHZub2RlLmVsbSwgcmVmRWxtKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBkYXRhICYmIGRhdGEucHJlKSB7XG4gICAgICAgIGNyZWF0aW5nRWxtSW5WUHJlLS07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1RydWUodm5vZGUuaXNDb21tZW50KSkge1xuICAgICAgdm5vZGUuZWxtID0gbm9kZU9wcy5jcmVhdGVDb21tZW50KHZub2RlLnRleHQpO1xuICAgICAgaW5zZXJ0KHBhcmVudEVsbSwgdm5vZGUuZWxtLCByZWZFbG0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2bm9kZS5lbG0gPSBub2RlT3BzLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpO1xuICAgICAgaW5zZXJ0KHBhcmVudEVsbSwgdm5vZGUuZWxtLCByZWZFbG0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudCAodm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgcGFyZW50RWxtLCByZWZFbG0pIHtcbiAgICB2YXIgaSA9IHZub2RlLmRhdGE7XG4gICAgaWYgKGlzRGVmKGkpKSB7XG4gICAgICB2YXIgaXNSZWFjdGl2YXRlZCA9IGlzRGVmKHZub2RlLmNvbXBvbmVudEluc3RhbmNlKSAmJiBpLmtlZXBBbGl2ZTtcbiAgICAgIGlmIChpc0RlZihpID0gaS5ob29rKSAmJiBpc0RlZihpID0gaS5pbml0KSkge1xuICAgICAgICBpKHZub2RlLCBmYWxzZSAvKiBoeWRyYXRpbmcgKi8sIHBhcmVudEVsbSwgcmVmRWxtKTtcbiAgICAgIH1cbiAgICAgIC8vIGFmdGVyIGNhbGxpbmcgdGhlIGluaXQgaG9vaywgaWYgdGhlIHZub2RlIGlzIGEgY2hpbGQgY29tcG9uZW50XG4gICAgICAvLyBpdCBzaG91bGQndmUgY3JlYXRlZCBhIGNoaWxkIGluc3RhbmNlIGFuZCBtb3VudGVkIGl0LiB0aGUgY2hpbGRcbiAgICAgIC8vIGNvbXBvbmVudCBhbHNvIGhhcyBzZXQgdGhlIHBsYWNlaG9sZGVyIHZub2RlJ3MgZWxtLlxuICAgICAgLy8gaW4gdGhhdCBjYXNlIHdlIGNhbiBqdXN0IHJldHVybiB0aGUgZWxlbWVudCBhbmQgYmUgZG9uZS5cbiAgICAgIGlmIChpc0RlZih2bm9kZS5jb21wb25lbnRJbnN0YW5jZSkpIHtcbiAgICAgICAgaW5pdENvbXBvbmVudCh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgaWYgKGlzVHJ1ZShpc1JlYWN0aXZhdGVkKSkge1xuICAgICAgICAgIHJlYWN0aXZhdGVDb21wb25lbnQodm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgcGFyZW50RWxtLCByZWZFbG0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5pdENvbXBvbmVudCAodm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgIGlmIChpc0RlZih2bm9kZS5kYXRhLnBlbmRpbmdJbnNlcnQpKSB7XG4gICAgICBpbnNlcnRlZFZub2RlUXVldWUucHVzaC5hcHBseShpbnNlcnRlZFZub2RlUXVldWUsIHZub2RlLmRhdGEucGVuZGluZ0luc2VydCk7XG4gICAgICB2bm9kZS5kYXRhLnBlbmRpbmdJbnNlcnQgPSBudWxsO1xuICAgIH1cbiAgICB2bm9kZS5lbG0gPSB2bm9kZS5jb21wb25lbnRJbnN0YW5jZS4kZWw7XG4gICAgaWYgKGlzUGF0Y2hhYmxlKHZub2RlKSkge1xuICAgICAgaW52b2tlQ3JlYXRlSG9va3Modm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICBzZXRTY29wZSh2bm9kZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGVtcHR5IGNvbXBvbmVudCByb290LlxuICAgICAgLy8gc2tpcCBhbGwgZWxlbWVudC1yZWxhdGVkIG1vZHVsZXMgZXhjZXB0IGZvciByZWYgKCMzNDU1KVxuICAgICAgcmVnaXN0ZXJSZWYodm5vZGUpO1xuICAgICAgLy8gbWFrZSBzdXJlIHRvIGludm9rZSB0aGUgaW5zZXJ0IGhvb2tcbiAgICAgIGluc2VydGVkVm5vZGVRdWV1ZS5wdXNoKHZub2RlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFjdGl2YXRlQ29tcG9uZW50ICh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCBwYXJlbnRFbG0sIHJlZkVsbSkge1xuICAgIHZhciBpO1xuICAgIC8vIGhhY2sgZm9yICM0MzM5OiBhIHJlYWN0aXZhdGVkIGNvbXBvbmVudCB3aXRoIGlubmVyIHRyYW5zaXRpb25cbiAgICAvLyBkb2VzIG5vdCB0cmlnZ2VyIGJlY2F1c2UgdGhlIGlubmVyIG5vZGUncyBjcmVhdGVkIGhvb2tzIGFyZSBub3QgY2FsbGVkXG4gICAgLy8gYWdhaW4uIEl0J3Mgbm90IGlkZWFsIHRvIGludm9sdmUgbW9kdWxlLXNwZWNpZmljIGxvZ2ljIGluIGhlcmUgYnV0XG4gICAgLy8gdGhlcmUgZG9lc24ndCBzZWVtIHRvIGJlIGEgYmV0dGVyIHdheSB0byBkbyBpdC5cbiAgICB2YXIgaW5uZXJOb2RlID0gdm5vZGU7XG4gICAgd2hpbGUgKGlubmVyTm9kZS5jb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgaW5uZXJOb2RlID0gaW5uZXJOb2RlLmNvbXBvbmVudEluc3RhbmNlLl92bm9kZTtcbiAgICAgIGlmIChpc0RlZihpID0gaW5uZXJOb2RlLmRhdGEpICYmIGlzRGVmKGkgPSBpLnRyYW5zaXRpb24pKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMuYWN0aXZhdGUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBjYnMuYWN0aXZhdGVbaV0oZW1wdHlOb2RlLCBpbm5lck5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGluc2VydGVkVm5vZGVRdWV1ZS5wdXNoKGlubmVyTm9kZSk7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIC8vIHVubGlrZSBhIG5ld2x5IGNyZWF0ZWQgY29tcG9uZW50LFxuICAgIC8vIGEgcmVhY3RpdmF0ZWQga2VlcC1hbGl2ZSBjb21wb25lbnQgZG9lc24ndCBpbnNlcnQgaXRzZWxmXG4gICAgaW5zZXJ0KHBhcmVudEVsbSwgdm5vZGUuZWxtLCByZWZFbG0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5zZXJ0IChwYXJlbnQsIGVsbSwgcmVmJCQxKSB7XG4gICAgaWYgKGlzRGVmKHBhcmVudCkpIHtcbiAgICAgIGlmIChpc0RlZihyZWYkJDEpKSB7XG4gICAgICAgIGlmIChyZWYkJDEucGFyZW50Tm9kZSA9PT0gcGFyZW50KSB7XG4gICAgICAgICAgbm9kZU9wcy5pbnNlcnRCZWZvcmUocGFyZW50LCBlbG0sIHJlZiQkMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVPcHMuYXBwZW5kQ2hpbGQocGFyZW50LCBlbG0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUNoaWxkcmVuICh2bm9kZSwgY2hpbGRyZW4sIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSkge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgY2hlY2tEdXBsaWNhdGVLZXlzKGNoaWxkcmVuKTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY3JlYXRlRWxtKGNoaWxkcmVuW2ldLCBpbnNlcnRlZFZub2RlUXVldWUsIHZub2RlLmVsbSwgbnVsbCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1ByaW1pdGl2ZSh2bm9kZS50ZXh0KSkge1xuICAgICAgbm9kZU9wcy5hcHBlbmRDaGlsZCh2bm9kZS5lbG0sIG5vZGVPcHMuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzUGF0Y2hhYmxlICh2bm9kZSkge1xuICAgIHdoaWxlICh2bm9kZS5jb21wb25lbnRJbnN0YW5jZSkge1xuICAgICAgdm5vZGUgPSB2bm9kZS5jb21wb25lbnRJbnN0YW5jZS5fdm5vZGU7XG4gICAgfVxuICAgIHJldHVybiBpc0RlZih2bm9kZS50YWcpXG4gIH1cblxuICBmdW5jdGlvbiBpbnZva2VDcmVhdGVIb29rcyAodm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgIGZvciAodmFyIGkkMSA9IDA7IGkkMSA8IGNicy5jcmVhdGUubGVuZ3RoOyArK2kkMSkge1xuICAgICAgY2JzLmNyZWF0ZVtpJDFdKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgIH1cbiAgICBpID0gdm5vZGUuZGF0YS5ob29rOyAvLyBSZXVzZSB2YXJpYWJsZVxuICAgIGlmIChpc0RlZihpKSkge1xuICAgICAgaWYgKGlzRGVmKGkuY3JlYXRlKSkgeyBpLmNyZWF0ZShlbXB0eU5vZGUsIHZub2RlKTsgfVxuICAgICAgaWYgKGlzRGVmKGkuaW5zZXJ0KSkgeyBpbnNlcnRlZFZub2RlUXVldWUucHVzaCh2bm9kZSk7IH1cbiAgICB9XG4gIH1cblxuICAvLyBzZXQgc2NvcGUgaWQgYXR0cmlidXRlIGZvciBzY29wZWQgQ1NTLlxuICAvLyB0aGlzIGlzIGltcGxlbWVudGVkIGFzIGEgc3BlY2lhbCBjYXNlIHRvIGF2b2lkIHRoZSBvdmVyaGVhZFxuICAvLyBvZiBnb2luZyB0aHJvdWdoIHRoZSBub3JtYWwgYXR0cmlidXRlIHBhdGNoaW5nIHByb2Nlc3MuXG4gIGZ1bmN0aW9uIHNldFNjb3BlICh2bm9kZSkge1xuICAgIHZhciBpO1xuICAgIGlmIChpc0RlZihpID0gdm5vZGUuZm5TY29wZUlkKSkge1xuICAgICAgbm9kZU9wcy5zZXRBdHRyaWJ1dGUodm5vZGUuZWxtLCBpLCAnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhbmNlc3RvciA9IHZub2RlO1xuICAgICAgd2hpbGUgKGFuY2VzdG9yKSB7XG4gICAgICAgIGlmIChpc0RlZihpID0gYW5jZXN0b3IuY29udGV4dCkgJiYgaXNEZWYoaSA9IGkuJG9wdGlvbnMuX3Njb3BlSWQpKSB7XG4gICAgICAgICAgbm9kZU9wcy5zZXRBdHRyaWJ1dGUodm5vZGUuZWxtLCBpLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgYW5jZXN0b3IgPSBhbmNlc3Rvci5wYXJlbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGZvciBzbG90IGNvbnRlbnQgdGhleSBzaG91bGQgYWxzbyBnZXQgdGhlIHNjb3BlSWQgZnJvbSB0aGUgaG9zdCBpbnN0YW5jZS5cbiAgICBpZiAoaXNEZWYoaSA9IGFjdGl2ZUluc3RhbmNlKSAmJlxuICAgICAgaSAhPT0gdm5vZGUuY29udGV4dCAmJlxuICAgICAgaSAhPT0gdm5vZGUuZm5Db250ZXh0ICYmXG4gICAgICBpc0RlZihpID0gaS4kb3B0aW9ucy5fc2NvcGVJZClcbiAgICApIHtcbiAgICAgIG5vZGVPcHMuc2V0QXR0cmlidXRlKHZub2RlLmVsbSwgaSwgJycpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFZub2RlcyAocGFyZW50RWxtLCByZWZFbG0sIHZub2Rlcywgc3RhcnRJZHgsIGVuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgY3JlYXRlRWxtKHZub2Rlc1tzdGFydElkeF0sIGluc2VydGVkVm5vZGVRdWV1ZSwgcGFyZW50RWxtLCByZWZFbG0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rICh2bm9kZSkge1xuICAgIHZhciBpLCBqO1xuICAgIHZhciBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICBpZiAoaXNEZWYoZGF0YSkpIHtcbiAgICAgIGlmIChpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS5kZXN0cm95KSkgeyBpKHZub2RlKTsgfVxuICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5kZXN0cm95Lmxlbmd0aDsgKytpKSB7IGNicy5kZXN0cm95W2ldKHZub2RlKTsgfVxuICAgIH1cbiAgICBpZiAoaXNEZWYoaSA9IHZub2RlLmNoaWxkcmVuKSkge1xuICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XG4gICAgICAgIGludm9rZURlc3Ryb3lIb29rKHZub2RlLmNoaWxkcmVuW2pdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVWbm9kZXMgKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XG4gICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgdmFyIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgaWYgKGlzRGVmKGNoLnRhZykpIHtcbiAgICAgICAgICByZW1vdmVBbmRJbnZva2VSZW1vdmVIb29rKGNoKTtcbiAgICAgICAgICBpbnZva2VEZXN0cm95SG9vayhjaCk7XG4gICAgICAgIH0gZWxzZSB7IC8vIFRleHQgbm9kZVxuICAgICAgICAgIHJlbW92ZU5vZGUoY2guZWxtKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUFuZEludm9rZVJlbW92ZUhvb2sgKHZub2RlLCBybSkge1xuICAgIGlmIChpc0RlZihybSkgfHwgaXNEZWYodm5vZGUuZGF0YSkpIHtcbiAgICAgIHZhciBpO1xuICAgICAgdmFyIGxpc3RlbmVycyA9IGNicy5yZW1vdmUubGVuZ3RoICsgMTtcbiAgICAgIGlmIChpc0RlZihybSkpIHtcbiAgICAgICAgLy8gd2UgaGF2ZSBhIHJlY3Vyc2l2ZWx5IHBhc3NlZCBkb3duIHJtIGNhbGxiYWNrXG4gICAgICAgIC8vIGluY3JlYXNlIHRoZSBsaXN0ZW5lcnMgY291bnRcbiAgICAgICAgcm0ubGlzdGVuZXJzICs9IGxpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGRpcmVjdGx5IHJlbW92aW5nXG4gICAgICAgIHJtID0gY3JlYXRlUm1DYih2bm9kZS5lbG0sIGxpc3RlbmVycyk7XG4gICAgICB9XG4gICAgICAvLyByZWN1cnNpdmVseSBpbnZva2UgaG9va3Mgb24gY2hpbGQgY29tcG9uZW50IHJvb3Qgbm9kZVxuICAgICAgaWYgKGlzRGVmKGkgPSB2bm9kZS5jb21wb25lbnRJbnN0YW5jZSkgJiYgaXNEZWYoaSA9IGkuX3Zub2RlKSAmJiBpc0RlZihpLmRhdGEpKSB7XG4gICAgICAgIHJlbW92ZUFuZEludm9rZVJlbW92ZUhvb2soaSwgcm0pO1xuICAgICAgfVxuICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5yZW1vdmUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY2JzLnJlbW92ZVtpXSh2bm9kZSwgcm0pO1xuICAgICAgfVxuICAgICAgaWYgKGlzRGVmKGkgPSB2bm9kZS5kYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLnJlbW92ZSkpIHtcbiAgICAgICAgaSh2bm9kZSwgcm0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm0oKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlTm9kZSh2bm9kZS5lbG0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUNoaWxkcmVuIChwYXJlbnRFbG0sIG9sZENoLCBuZXdDaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCByZW1vdmVPbmx5KSB7XG4gICAgdmFyIG9sZFN0YXJ0SWR4ID0gMDtcbiAgICB2YXIgbmV3U3RhcnRJZHggPSAwO1xuICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xuICAgIHZhciBvbGRTdGFydFZub2RlID0gb2xkQ2hbMF07XG4gICAgdmFyIG9sZEVuZFZub2RlID0gb2xkQ2hbb2xkRW5kSWR4XTtcbiAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcbiAgICB2YXIgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWzBdO1xuICAgIHZhciBuZXdFbmRWbm9kZSA9IG5ld0NoW25ld0VuZElkeF07XG4gICAgdmFyIG9sZEtleVRvSWR4LCBpZHhJbk9sZCwgdm5vZGVUb01vdmUsIHJlZkVsbTtcblxuICAgIC8vIHJlbW92ZU9ubHkgaXMgYSBzcGVjaWFsIGZsYWcgdXNlZCBvbmx5IGJ5IDx0cmFuc2l0aW9uLWdyb3VwPlxuICAgIC8vIHRvIGVuc3VyZSByZW1vdmVkIGVsZW1lbnRzIHN0YXkgaW4gY29ycmVjdCByZWxhdGl2ZSBwb3NpdGlvbnNcbiAgICAvLyBkdXJpbmcgbGVhdmluZyB0cmFuc2l0aW9uc1xuICAgIHZhciBjYW5Nb3ZlID0gIXJlbW92ZU9ubHk7XG5cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgY2hlY2tEdXBsaWNhdGVLZXlzKG5ld0NoKTtcbiAgICB9XG5cbiAgICB3aGlsZSAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4ICYmIG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgaWYgKGlzVW5kZWYob2xkU3RhcnRWbm9kZSkpIHtcbiAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBoYXMgYmVlbiBtb3ZlZCBsZWZ0XG4gICAgICB9IGVsc2UgaWYgKGlzVW5kZWYob2xkRW5kVm5vZGUpKSB7XG4gICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgfSBlbHNlIGlmIChzYW1lVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHtcbiAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07XG4gICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgcGF0Y2hWbm9kZShvbGRFbmRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkgeyAvLyBWbm9kZSBtb3ZlZCByaWdodFxuICAgICAgICBwYXRjaFZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBjYW5Nb3ZlICYmIG5vZGVPcHMuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgb2xkU3RhcnRWbm9kZS5lbG0sIG5vZGVPcHMubmV4dFNpYmxpbmcob2xkRW5kVm5vZGUuZWxtKSk7XG4gICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgbmV3RW5kVm5vZGUgPSBuZXdDaFstLW5ld0VuZElkeF07XG4gICAgICB9IGVsc2UgaWYgKHNhbWVWbm9kZShvbGRFbmRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHsgLy8gVm5vZGUgbW92ZWQgbGVmdFxuICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBjYW5Nb3ZlICYmIG5vZGVPcHMuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgb2xkRW5kVm5vZGUuZWxtLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNVbmRlZihvbGRLZXlUb0lkeCkpIHsgb2xkS2V5VG9JZHggPSBjcmVhdGVLZXlUb09sZElkeChvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7IH1cbiAgICAgICAgaWR4SW5PbGQgPSBpc0RlZihuZXdTdGFydFZub2RlLmtleSlcbiAgICAgICAgICA/IG9sZEtleVRvSWR4W25ld1N0YXJ0Vm5vZGUua2V5XVxuICAgICAgICAgIDogZmluZElkeEluT2xkKG5ld1N0YXJ0Vm5vZGUsIG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICAgICAgaWYgKGlzVW5kZWYoaWR4SW5PbGQpKSB7IC8vIE5ldyBlbGVtZW50XG4gICAgICAgICAgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgcGFyZW50RWxtLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdm5vZGVUb01vdmUgPSBvbGRDaFtpZHhJbk9sZF07XG4gICAgICAgICAgaWYgKHNhbWVWbm9kZSh2bm9kZVRvTW92ZSwgbmV3U3RhcnRWbm9kZSkpIHtcbiAgICAgICAgICAgIHBhdGNoVm5vZGUodm5vZGVUb01vdmUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICBvbGRDaFtpZHhJbk9sZF0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBjYW5Nb3ZlICYmIG5vZGVPcHMuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgdm5vZGVUb01vdmUuZWxtLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNhbWUga2V5IGJ1dCBkaWZmZXJlbnQgZWxlbWVudC4gdHJlYXQgYXMgbmV3IGVsZW1lbnRcbiAgICAgICAgICAgIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUsIHBhcmVudEVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvbGRTdGFydElkeCA+IG9sZEVuZElkeCkge1xuICAgICAgcmVmRWxtID0gaXNVbmRlZihuZXdDaFtuZXdFbmRJZHggKyAxXSkgPyBudWxsIDogbmV3Q2hbbmV3RW5kSWR4ICsgMV0uZWxtO1xuICAgICAgYWRkVm5vZGVzKHBhcmVudEVsbSwgcmVmRWxtLCBuZXdDaCwgbmV3U3RhcnRJZHgsIG5ld0VuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICB9IGVsc2UgaWYgKG5ld1N0YXJ0SWR4ID4gbmV3RW5kSWR4KSB7XG4gICAgICByZW1vdmVWbm9kZXMocGFyZW50RWxtLCBvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2hlY2tEdXBsaWNhdGVLZXlzIChjaGlsZHJlbikge1xuICAgIHZhciBzZWVuS2V5cyA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB2bm9kZSA9IGNoaWxkcmVuW2ldO1xuICAgICAgdmFyIGtleSA9IHZub2RlLmtleTtcbiAgICAgIGlmIChpc0RlZihrZXkpKSB7XG4gICAgICAgIGlmIChzZWVuS2V5c1trZXldKSB7XG4gICAgICAgICAgd2FybihcbiAgICAgICAgICAgIChcIkR1cGxpY2F0ZSBrZXlzIGRldGVjdGVkOiAnXCIgKyBrZXkgKyBcIicuIFRoaXMgbWF5IGNhdXNlIGFuIHVwZGF0ZSBlcnJvci5cIiksXG4gICAgICAgICAgICB2bm9kZS5jb250ZXh0XG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWVuS2V5c1trZXldID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRJZHhJbk9sZCAobm9kZSwgb2xkQ2gsIHN0YXJ0LCBlbmQpIHtcbiAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdmFyIGMgPSBvbGRDaFtpXTtcbiAgICAgIGlmIChpc0RlZihjKSAmJiBzYW1lVm5vZGUobm9kZSwgYykpIHsgcmV0dXJuIGkgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhdGNoVm5vZGUgKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCByZW1vdmVPbmx5KSB7XG4gICAgaWYgKG9sZFZub2RlID09PSB2bm9kZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIGVsbSA9IHZub2RlLmVsbSA9IG9sZFZub2RlLmVsbTtcblxuICAgIGlmIChpc1RydWUob2xkVm5vZGUuaXNBc3luY1BsYWNlaG9sZGVyKSkge1xuICAgICAgaWYgKGlzRGVmKHZub2RlLmFzeW5jRmFjdG9yeS5yZXNvbHZlZCkpIHtcbiAgICAgICAgaHlkcmF0ZShvbGRWbm9kZS5lbG0sIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdm5vZGUuaXNBc3luY1BsYWNlaG9sZGVyID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIHJldXNlIGVsZW1lbnQgZm9yIHN0YXRpYyB0cmVlcy5cbiAgICAvLyBub3RlIHdlIG9ubHkgZG8gdGhpcyBpZiB0aGUgdm5vZGUgaXMgY2xvbmVkIC1cbiAgICAvLyBpZiB0aGUgbmV3IG5vZGUgaXMgbm90IGNsb25lZCBpdCBtZWFucyB0aGUgcmVuZGVyIGZ1bmN0aW9ucyBoYXZlIGJlZW5cbiAgICAvLyByZXNldCBieSB0aGUgaG90LXJlbG9hZC1hcGkgYW5kIHdlIG5lZWQgdG8gZG8gYSBwcm9wZXIgcmUtcmVuZGVyLlxuICAgIGlmIChpc1RydWUodm5vZGUuaXNTdGF0aWMpICYmXG4gICAgICBpc1RydWUob2xkVm5vZGUuaXNTdGF0aWMpICYmXG4gICAgICB2bm9kZS5rZXkgPT09IG9sZFZub2RlLmtleSAmJlxuICAgICAgKGlzVHJ1ZSh2bm9kZS5pc0Nsb25lZCkgfHwgaXNUcnVlKHZub2RlLmlzT25jZSkpXG4gICAgKSB7XG4gICAgICB2bm9kZS5jb21wb25lbnRJbnN0YW5jZSA9IG9sZFZub2RlLmNvbXBvbmVudEluc3RhbmNlO1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIGk7XG4gICAgdmFyIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIGlmIChpc0RlZihkYXRhKSAmJiBpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS5wcmVwYXRjaCkpIHtcbiAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICB9XG5cbiAgICB2YXIgb2xkQ2ggPSBvbGRWbm9kZS5jaGlsZHJlbjtcbiAgICB2YXIgY2ggPSB2bm9kZS5jaGlsZHJlbjtcbiAgICBpZiAoaXNEZWYoZGF0YSkgJiYgaXNQYXRjaGFibGUodm5vZGUpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnVwZGF0ZS5sZW5ndGg7ICsraSkgeyBjYnMudXBkYXRlW2ldKG9sZFZub2RlLCB2bm9kZSk7IH1cbiAgICAgIGlmIChpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS51cGRhdGUpKSB7IGkob2xkVm5vZGUsIHZub2RlKTsgfVxuICAgIH1cbiAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgaWYgKGlzRGVmKG9sZENoKSAmJiBpc0RlZihjaCkpIHtcbiAgICAgICAgaWYgKG9sZENoICE9PSBjaCkgeyB1cGRhdGVDaGlsZHJlbihlbG0sIG9sZENoLCBjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCByZW1vdmVPbmx5KTsgfVxuICAgICAgfSBlbHNlIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKSB7IG5vZGVPcHMuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7IH1cbiAgICAgICAgYWRkVm5vZGVzKGVsbSwgbnVsbCwgY2gsIDAsIGNoLmxlbmd0aCAtIDEsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGlzRGVmKG9sZENoKSkge1xuICAgICAgICByZW1vdmVWbm9kZXMoZWxtLCBvbGRDaCwgMCwgb2xkQ2gubGVuZ3RoIC0gMSk7XG4gICAgICB9IGVsc2UgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKSB7XG4gICAgICAgIG5vZGVPcHMuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvbGRWbm9kZS50ZXh0ICE9PSB2bm9kZS50ZXh0KSB7XG4gICAgICBub2RlT3BzLnNldFRleHRDb250ZW50KGVsbSwgdm5vZGUudGV4dCk7XG4gICAgfVxuICAgIGlmIChpc0RlZihkYXRhKSkge1xuICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLnBvc3RwYXRjaCkpIHsgaShvbGRWbm9kZSwgdm5vZGUpOyB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW52b2tlSW5zZXJ0SG9vayAodm5vZGUsIHF1ZXVlLCBpbml0aWFsKSB7XG4gICAgLy8gZGVsYXkgaW5zZXJ0IGhvb2tzIGZvciBjb21wb25lbnQgcm9vdCBub2RlcywgaW52b2tlIHRoZW0gYWZ0ZXIgdGhlXG4gICAgLy8gZWxlbWVudCBpcyByZWFsbHkgaW5zZXJ0ZWRcbiAgICBpZiAoaXNUcnVlKGluaXRpYWwpICYmIGlzRGVmKHZub2RlLnBhcmVudCkpIHtcbiAgICAgIHZub2RlLnBhcmVudC5kYXRhLnBlbmRpbmdJbnNlcnQgPSBxdWV1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBxdWV1ZVtpXS5kYXRhLmhvb2suaW5zZXJ0KHF1ZXVlW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB2YXIgaHlkcmF0aW9uQmFpbGVkID0gZmFsc2U7XG4gIC8vIGxpc3Qgb2YgbW9kdWxlcyB0aGF0IGNhbiBza2lwIGNyZWF0ZSBob29rIGR1cmluZyBoeWRyYXRpb24gYmVjYXVzZSB0aGV5XG4gIC8vIGFyZSBhbHJlYWR5IHJlbmRlcmVkIG9uIHRoZSBjbGllbnQgb3IgaGFzIG5vIG5lZWQgZm9yIGluaXRpYWxpemF0aW9uXG4gIC8vIE5vdGU6IHN0eWxlIGlzIGV4Y2x1ZGVkIGJlY2F1c2UgaXQgcmVsaWVzIG9uIGluaXRpYWwgY2xvbmUgZm9yIGZ1dHVyZVxuICAvLyBkZWVwIHVwZGF0ZXMgKCM3MDYzKS5cbiAgdmFyIGlzUmVuZGVyZWRNb2R1bGUgPSBtYWtlTWFwKCdhdHRycyxjbGFzcyxzdGF0aWNDbGFzcyxzdGF0aWNTdHlsZSxrZXknKTtcblxuICAvLyBOb3RlOiB0aGlzIGlzIGEgYnJvd3Nlci1vbmx5IGZ1bmN0aW9uIHNvIHdlIGNhbiBhc3N1bWUgZWxtcyBhcmUgRE9NIG5vZGVzLlxuICBmdW5jdGlvbiBoeWRyYXRlIChlbG0sIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUsIGluVlByZSkge1xuICAgIHZhciBpO1xuICAgIHZhciB0YWcgPSB2bm9kZS50YWc7XG4gICAgdmFyIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHZhciBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuICAgIGluVlByZSA9IGluVlByZSB8fCAoZGF0YSAmJiBkYXRhLnByZSk7XG4gICAgdm5vZGUuZWxtID0gZWxtO1xuXG4gICAgaWYgKGlzVHJ1ZSh2bm9kZS5pc0NvbW1lbnQpICYmIGlzRGVmKHZub2RlLmFzeW5jRmFjdG9yeSkpIHtcbiAgICAgIHZub2RlLmlzQXN5bmNQbGFjZWhvbGRlciA9IHRydWU7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICAvLyBhc3NlcnQgbm9kZSBtYXRjaFxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICBpZiAoIWFzc2VydE5vZGVNYXRjaChlbG0sIHZub2RlLCBpblZQcmUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNEZWYoZGF0YSkpIHtcbiAgICAgIGlmIChpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS5pbml0KSkgeyBpKHZub2RlLCB0cnVlIC8qIGh5ZHJhdGluZyAqLyk7IH1cbiAgICAgIGlmIChpc0RlZihpID0gdm5vZGUuY29tcG9uZW50SW5zdGFuY2UpKSB7XG4gICAgICAgIC8vIGNoaWxkIGNvbXBvbmVudC4gaXQgc2hvdWxkIGhhdmUgaHlkcmF0ZWQgaXRzIG93biB0cmVlLlxuICAgICAgICBpbml0Q29tcG9uZW50KHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNEZWYodGFnKSkge1xuICAgICAgaWYgKGlzRGVmKGNoaWxkcmVuKSkge1xuICAgICAgICAvLyBlbXB0eSBlbGVtZW50LCBhbGxvdyBjbGllbnQgdG8gcGljayB1cCBhbmQgcG9wdWxhdGUgY2hpbGRyZW5cbiAgICAgICAgaWYgKCFlbG0uaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgY3JlYXRlQ2hpbGRyZW4odm5vZGUsIGNoaWxkcmVuLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHYtaHRtbCBhbmQgZG9tUHJvcHM6IGlubmVySFRNTFxuICAgICAgICAgIGlmIChpc0RlZihpID0gZGF0YSkgJiYgaXNEZWYoaSA9IGkuZG9tUHJvcHMpICYmIGlzRGVmKGkgPSBpLmlubmVySFRNTCkpIHtcbiAgICAgICAgICAgIGlmIChpICE9PSBlbG0uaW5uZXJIVE1MKSB7XG4gICAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICFoeWRyYXRpb25CYWlsZWRcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgaHlkcmF0aW9uQmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1BhcmVudDogJywgZWxtKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3NlcnZlciBpbm5lckhUTUw6ICcsIGkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignY2xpZW50IGlubmVySFRNTDogJywgZWxtLmlubmVySFRNTCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGl0ZXJhdGUgYW5kIGNvbXBhcmUgY2hpbGRyZW4gbGlzdHNcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbk1hdGNoID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBjaGlsZE5vZGUgPSBlbG0uZmlyc3RDaGlsZDtcbiAgICAgICAgICAgIGZvciAodmFyIGkkMSA9IDA7IGkkMSA8IGNoaWxkcmVuLmxlbmd0aDsgaSQxKyspIHtcbiAgICAgICAgICAgICAgaWYgKCFjaGlsZE5vZGUgfHwgIWh5ZHJhdGUoY2hpbGROb2RlLCBjaGlsZHJlbltpJDFdLCBpbnNlcnRlZFZub2RlUXVldWUsIGluVlByZSkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbk1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjaGlsZE5vZGUgPSBjaGlsZE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiBjaGlsZE5vZGUgaXMgbm90IG51bGwsIGl0IG1lYW5zIHRoZSBhY3R1YWwgY2hpbGROb2RlcyBsaXN0IGlzXG4gICAgICAgICAgICAvLyBsb25nZXIgdGhhbiB0aGUgdmlydHVhbCBjaGlsZHJlbiBsaXN0LlxuICAgICAgICAgICAgaWYgKCFjaGlsZHJlbk1hdGNoIHx8IGNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAhaHlkcmF0aW9uQmFpbGVkXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGh5ZHJhdGlvbkJhaWxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdQYXJlbnQ6ICcsIGVsbSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdNaXNtYXRjaGluZyBjaGlsZE5vZGVzIHZzLiBWTm9kZXM6ICcsIGVsbS5jaGlsZE5vZGVzLCBjaGlsZHJlbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaXNEZWYoZGF0YSkpIHtcbiAgICAgICAgdmFyIGZ1bGxJbnZva2UgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICBpZiAoIWlzUmVuZGVyZWRNb2R1bGUoa2V5KSkge1xuICAgICAgICAgICAgZnVsbEludm9rZSA9IHRydWU7XG4gICAgICAgICAgICBpbnZva2VDcmVhdGVIb29rcyh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghZnVsbEludm9rZSAmJiBkYXRhWydjbGFzcyddKSB7XG4gICAgICAgICAgLy8gZW5zdXJlIGNvbGxlY3RpbmcgZGVwcyBmb3IgZGVlcCBjbGFzcyBiaW5kaW5ncyBmb3IgZnV0dXJlIHVwZGF0ZXNcbiAgICAgICAgICB0cmF2ZXJzZShkYXRhWydjbGFzcyddKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZWxtLmRhdGEgIT09IHZub2RlLnRleHQpIHtcbiAgICAgIGVsbS5kYXRhID0gdm5vZGUudGV4dDtcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGFzc2VydE5vZGVNYXRjaCAobm9kZSwgdm5vZGUsIGluVlByZSkge1xuICAgIGlmIChpc0RlZih2bm9kZS50YWcpKSB7XG4gICAgICByZXR1cm4gdm5vZGUudGFnLmluZGV4T2YoJ3Z1ZS1jb21wb25lbnQnKSA9PT0gMCB8fCAoXG4gICAgICAgICFpc1Vua25vd25FbGVtZW50JCQxKHZub2RlLCBpblZQcmUpICYmXG4gICAgICAgIHZub2RlLnRhZy50b0xvd2VyQ2FzZSgpID09PSAobm9kZS50YWdOYW1lICYmIG5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpKVxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gKHZub2RlLmlzQ29tbWVudCA/IDggOiAzKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBwYXRjaCAob2xkVm5vZGUsIHZub2RlLCBoeWRyYXRpbmcsIHJlbW92ZU9ubHksIHBhcmVudEVsbSwgcmVmRWxtKSB7XG4gICAgaWYgKGlzVW5kZWYodm5vZGUpKSB7XG4gICAgICBpZiAoaXNEZWYob2xkVm5vZGUpKSB7IGludm9rZURlc3Ryb3lIb29rKG9sZFZub2RlKTsgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIGlzSW5pdGlhbFBhdGNoID0gZmFsc2U7XG4gICAgdmFyIGluc2VydGVkVm5vZGVRdWV1ZSA9IFtdO1xuXG4gICAgaWYgKGlzVW5kZWYob2xkVm5vZGUpKSB7XG4gICAgICAvLyBlbXB0eSBtb3VudCAobGlrZWx5IGFzIGNvbXBvbmVudCksIGNyZWF0ZSBuZXcgcm9vdCBlbGVtZW50XG4gICAgICBpc0luaXRpYWxQYXRjaCA9IHRydWU7XG4gICAgICBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgcGFyZW50RWxtLCByZWZFbG0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaXNSZWFsRWxlbWVudCA9IGlzRGVmKG9sZFZub2RlLm5vZGVUeXBlKTtcbiAgICAgIGlmICghaXNSZWFsRWxlbWVudCAmJiBzYW1lVm5vZGUob2xkVm5vZGUsIHZub2RlKSkge1xuICAgICAgICAvLyBwYXRjaCBleGlzdGluZyByb290IG5vZGVcbiAgICAgICAgcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgcmVtb3ZlT25seSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNSZWFsRWxlbWVudCkge1xuICAgICAgICAgIC8vIG1vdW50aW5nIHRvIGEgcmVhbCBlbGVtZW50XG4gICAgICAgICAgLy8gY2hlY2sgaWYgdGhpcyBpcyBzZXJ2ZXItcmVuZGVyZWQgY29udGVudCBhbmQgaWYgd2UgY2FuIHBlcmZvcm1cbiAgICAgICAgICAvLyBhIHN1Y2Nlc3NmdWwgaHlkcmF0aW9uLlxuICAgICAgICAgIGlmIChvbGRWbm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBvbGRWbm9kZS5oYXNBdHRyaWJ1dGUoU1NSX0FUVFIpKSB7XG4gICAgICAgICAgICBvbGRWbm9kZS5yZW1vdmVBdHRyaWJ1dGUoU1NSX0FUVFIpO1xuICAgICAgICAgICAgaHlkcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzVHJ1ZShoeWRyYXRpbmcpKSB7XG4gICAgICAgICAgICBpZiAoaHlkcmF0ZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkpIHtcbiAgICAgICAgICAgICAgaW52b2tlSW5zZXJ0SG9vayh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIG9sZFZub2RlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgICAgICAgd2FybihcbiAgICAgICAgICAgICAgICAnVGhlIGNsaWVudC1zaWRlIHJlbmRlcmVkIHZpcnR1YWwgRE9NIHRyZWUgaXMgbm90IG1hdGNoaW5nICcgK1xuICAgICAgICAgICAgICAgICdzZXJ2ZXItcmVuZGVyZWQgY29udGVudC4gVGhpcyBpcyBsaWtlbHkgY2F1c2VkIGJ5IGluY29ycmVjdCAnICtcbiAgICAgICAgICAgICAgICAnSFRNTCBtYXJrdXAsIGZvciBleGFtcGxlIG5lc3RpbmcgYmxvY2stbGV2ZWwgZWxlbWVudHMgaW5zaWRlICcgK1xuICAgICAgICAgICAgICAgICc8cD4sIG9yIG1pc3NpbmcgPHRib2R5Pi4gQmFpbGluZyBoeWRyYXRpb24gYW5kIHBlcmZvcm1pbmcgJyArXG4gICAgICAgICAgICAgICAgJ2Z1bGwgY2xpZW50LXNpZGUgcmVuZGVyLidcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gZWl0aGVyIG5vdCBzZXJ2ZXItcmVuZGVyZWQsIG9yIGh5ZHJhdGlvbiBmYWlsZWQuXG4gICAgICAgICAgLy8gY3JlYXRlIGFuIGVtcHR5IG5vZGUgYW5kIHJlcGxhY2UgaXRcbiAgICAgICAgICBvbGRWbm9kZSA9IGVtcHR5Tm9kZUF0KG9sZFZub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlcGxhY2luZyBleGlzdGluZyBlbGVtZW50XG4gICAgICAgIHZhciBvbGRFbG0gPSBvbGRWbm9kZS5lbG07XG4gICAgICAgIHZhciBwYXJlbnRFbG0kMSA9IG5vZGVPcHMucGFyZW50Tm9kZShvbGRFbG0pO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBuZXcgbm9kZVxuICAgICAgICBjcmVhdGVFbG0oXG4gICAgICAgICAgdm5vZGUsXG4gICAgICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlLFxuICAgICAgICAgIC8vIGV4dHJlbWVseSByYXJlIGVkZ2UgY2FzZTogZG8gbm90IGluc2VydCBpZiBvbGQgZWxlbWVudCBpcyBpbiBhXG4gICAgICAgICAgLy8gbGVhdmluZyB0cmFuc2l0aW9uLiBPbmx5IGhhcHBlbnMgd2hlbiBjb21iaW5pbmcgdHJhbnNpdGlvbiArXG4gICAgICAgICAgLy8ga2VlcC1hbGl2ZSArIEhPQ3MuICgjNDU5MClcbiAgICAgICAgICBvbGRFbG0uX2xlYXZlQ2IgPyBudWxsIDogcGFyZW50RWxtJDEsXG4gICAgICAgICAgbm9kZU9wcy5uZXh0U2libGluZyhvbGRFbG0pXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gdXBkYXRlIHBhcmVudCBwbGFjZWhvbGRlciBub2RlIGVsZW1lbnQsIHJlY3Vyc2l2ZWx5XG4gICAgICAgIGlmIChpc0RlZih2bm9kZS5wYXJlbnQpKSB7XG4gICAgICAgICAgdmFyIGFuY2VzdG9yID0gdm5vZGUucGFyZW50O1xuICAgICAgICAgIHZhciBwYXRjaGFibGUgPSBpc1BhdGNoYWJsZSh2bm9kZSk7XG4gICAgICAgICAgd2hpbGUgKGFuY2VzdG9yKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNicy5kZXN0cm95Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIGNicy5kZXN0cm95W2ldKGFuY2VzdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFuY2VzdG9yLmVsbSA9IHZub2RlLmVsbTtcbiAgICAgICAgICAgIGlmIChwYXRjaGFibGUpIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaSQxID0gMDsgaSQxIDwgY2JzLmNyZWF0ZS5sZW5ndGg7ICsraSQxKSB7XG4gICAgICAgICAgICAgICAgY2JzLmNyZWF0ZVtpJDFdKGVtcHR5Tm9kZSwgYW5jZXN0b3IpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vICM2NTEzXG4gICAgICAgICAgICAgIC8vIGludm9rZSBpbnNlcnQgaG9va3MgdGhhdCBtYXkgaGF2ZSBiZWVuIG1lcmdlZCBieSBjcmVhdGUgaG9va3MuXG4gICAgICAgICAgICAgIC8vIGUuZy4gZm9yIGRpcmVjdGl2ZXMgdGhhdCB1c2VzIHRoZSBcImluc2VydGVkXCIgaG9vay5cbiAgICAgICAgICAgICAgdmFyIGluc2VydCA9IGFuY2VzdG9yLmRhdGEuaG9vay5pbnNlcnQ7XG4gICAgICAgICAgICAgIGlmIChpbnNlcnQubWVyZ2VkKSB7XG4gICAgICAgICAgICAgICAgLy8gc3RhcnQgYXQgaW5kZXggMSB0byBhdm9pZCByZS1pbnZva2luZyBjb21wb25lbnQgbW91bnRlZCBob29rXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSQyID0gMTsgaSQyIDwgaW5zZXJ0LmZucy5sZW5ndGg7IGkkMisrKSB7XG4gICAgICAgICAgICAgICAgICBpbnNlcnQuZm5zW2kkMl0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlZ2lzdGVyUmVmKGFuY2VzdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFuY2VzdG9yID0gYW5jZXN0b3IucGFyZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlc3Ryb3kgb2xkIG5vZGVcbiAgICAgICAgaWYgKGlzRGVmKHBhcmVudEVsbSQxKSkge1xuICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0kMSwgW29sZFZub2RlXSwgMCwgMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNEZWYob2xkVm5vZGUudGFnKSkge1xuICAgICAgICAgIGludm9rZURlc3Ryb3lIb29rKG9sZFZub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGludm9rZUluc2VydEhvb2sodm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSwgaXNJbml0aWFsUGF0Y2gpO1xuICAgIHJldHVybiB2bm9kZS5lbG1cbiAgfVxufVxuXG4vKiAgKi9cblxudmFyIGRpcmVjdGl2ZXMgPSB7XG4gIGNyZWF0ZTogdXBkYXRlRGlyZWN0aXZlcyxcbiAgdXBkYXRlOiB1cGRhdGVEaXJlY3RpdmVzLFxuICBkZXN0cm95OiBmdW5jdGlvbiB1bmJpbmREaXJlY3RpdmVzICh2bm9kZSkge1xuICAgIHVwZGF0ZURpcmVjdGl2ZXModm5vZGUsIGVtcHR5Tm9kZSk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHVwZGF0ZURpcmVjdGl2ZXMgKG9sZFZub2RlLCB2bm9kZSkge1xuICBpZiAob2xkVm5vZGUuZGF0YS5kaXJlY3RpdmVzIHx8IHZub2RlLmRhdGEuZGlyZWN0aXZlcykge1xuICAgIF91cGRhdGUob2xkVm5vZGUsIHZub2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfdXBkYXRlIChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgdmFyIGlzQ3JlYXRlID0gb2xkVm5vZGUgPT09IGVtcHR5Tm9kZTtcbiAgdmFyIGlzRGVzdHJveSA9IHZub2RlID09PSBlbXB0eU5vZGU7XG4gIHZhciBvbGREaXJzID0gbm9ybWFsaXplRGlyZWN0aXZlcyQxKG9sZFZub2RlLmRhdGEuZGlyZWN0aXZlcywgb2xkVm5vZGUuY29udGV4dCk7XG4gIHZhciBuZXdEaXJzID0gbm9ybWFsaXplRGlyZWN0aXZlcyQxKHZub2RlLmRhdGEuZGlyZWN0aXZlcywgdm5vZGUuY29udGV4dCk7XG5cbiAgdmFyIGRpcnNXaXRoSW5zZXJ0ID0gW107XG4gIHZhciBkaXJzV2l0aFBvc3RwYXRjaCA9IFtdO1xuXG4gIHZhciBrZXksIG9sZERpciwgZGlyO1xuICBmb3IgKGtleSBpbiBuZXdEaXJzKSB7XG4gICAgb2xkRGlyID0gb2xkRGlyc1trZXldO1xuICAgIGRpciA9IG5ld0RpcnNba2V5XTtcbiAgICBpZiAoIW9sZERpcikge1xuICAgICAgLy8gbmV3IGRpcmVjdGl2ZSwgYmluZFxuICAgICAgY2FsbEhvb2skMShkaXIsICdiaW5kJywgdm5vZGUsIG9sZFZub2RlKTtcbiAgICAgIGlmIChkaXIuZGVmICYmIGRpci5kZWYuaW5zZXJ0ZWQpIHtcbiAgICAgICAgZGlyc1dpdGhJbnNlcnQucHVzaChkaXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBleGlzdGluZyBkaXJlY3RpdmUsIHVwZGF0ZVxuICAgICAgZGlyLm9sZFZhbHVlID0gb2xkRGlyLnZhbHVlO1xuICAgICAgY2FsbEhvb2skMShkaXIsICd1cGRhdGUnLCB2bm9kZSwgb2xkVm5vZGUpO1xuICAgICAgaWYgKGRpci5kZWYgJiYgZGlyLmRlZi5jb21wb25lbnRVcGRhdGVkKSB7XG4gICAgICAgIGRpcnNXaXRoUG9zdHBhdGNoLnB1c2goZGlyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoZGlyc1dpdGhJbnNlcnQubGVuZ3RoKSB7XG4gICAgdmFyIGNhbGxJbnNlcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpcnNXaXRoSW5zZXJ0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxIb29rJDEoZGlyc1dpdGhJbnNlcnRbaV0sICdpbnNlcnRlZCcsIHZub2RlLCBvbGRWbm9kZSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAoaXNDcmVhdGUpIHtcbiAgICAgIG1lcmdlVk5vZGVIb29rKHZub2RlLCAnaW5zZXJ0JywgY2FsbEluc2VydCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxJbnNlcnQoKTtcbiAgICB9XG4gIH1cblxuICBpZiAoZGlyc1dpdGhQb3N0cGF0Y2gubGVuZ3RoKSB7XG4gICAgbWVyZ2VWTm9kZUhvb2sodm5vZGUsICdwb3N0cGF0Y2gnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpcnNXaXRoUG9zdHBhdGNoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxIb29rJDEoZGlyc1dpdGhQb3N0cGF0Y2hbaV0sICdjb21wb25lbnRVcGRhdGVkJywgdm5vZGUsIG9sZFZub2RlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlmICghaXNDcmVhdGUpIHtcbiAgICBmb3IgKGtleSBpbiBvbGREaXJzKSB7XG4gICAgICBpZiAoIW5ld0RpcnNba2V5XSkge1xuICAgICAgICAvLyBubyBsb25nZXIgcHJlc2VudCwgdW5iaW5kXG4gICAgICAgIGNhbGxIb29rJDEob2xkRGlyc1trZXldLCAndW5iaW5kJywgb2xkVm5vZGUsIG9sZFZub2RlLCBpc0Rlc3Ryb3kpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG52YXIgZW1wdHlNb2RpZmllcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5mdW5jdGlvbiBub3JtYWxpemVEaXJlY3RpdmVzJDEgKFxuICBkaXJzLFxuICB2bVxuKSB7XG4gIHZhciByZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBpZiAoIWRpcnMpIHtcbiAgICAvLyAkZmxvdy1kaXNhYmxlLWxpbmVcbiAgICByZXR1cm4gcmVzXG4gIH1cbiAgdmFyIGksIGRpcjtcbiAgZm9yIChpID0gMDsgaSA8IGRpcnMubGVuZ3RoOyBpKyspIHtcbiAgICBkaXIgPSBkaXJzW2ldO1xuICAgIGlmICghZGlyLm1vZGlmaWVycykge1xuICAgICAgLy8gJGZsb3ctZGlzYWJsZS1saW5lXG4gICAgICBkaXIubW9kaWZpZXJzID0gZW1wdHlNb2RpZmllcnM7XG4gICAgfVxuICAgIHJlc1tnZXRSYXdEaXJOYW1lKGRpcildID0gZGlyO1xuICAgIGRpci5kZWYgPSByZXNvbHZlQXNzZXQodm0uJG9wdGlvbnMsICdkaXJlY3RpdmVzJywgZGlyLm5hbWUsIHRydWUpO1xuICB9XG4gIC8vICRmbG93LWRpc2FibGUtbGluZVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGdldFJhd0Rpck5hbWUgKGRpcikge1xuICByZXR1cm4gZGlyLnJhd05hbWUgfHwgKChkaXIubmFtZSkgKyBcIi5cIiArIChPYmplY3Qua2V5cyhkaXIubW9kaWZpZXJzIHx8IHt9KS5qb2luKCcuJykpKVxufVxuXG5mdW5jdGlvbiBjYWxsSG9vayQxIChkaXIsIGhvb2ssIHZub2RlLCBvbGRWbm9kZSwgaXNEZXN0cm95KSB7XG4gIHZhciBmbiA9IGRpci5kZWYgJiYgZGlyLmRlZltob29rXTtcbiAgaWYgKGZuKSB7XG4gICAgdHJ5IHtcbiAgICAgIGZuKHZub2RlLmVsbSwgZGlyLCB2bm9kZSwgb2xkVm5vZGUsIGlzRGVzdHJveSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaGFuZGxlRXJyb3IoZSwgdm5vZGUuY29udGV4dCwgKFwiZGlyZWN0aXZlIFwiICsgKGRpci5uYW1lKSArIFwiIFwiICsgaG9vayArIFwiIGhvb2tcIikpO1xuICAgIH1cbiAgfVxufVxuXG52YXIgYmFzZU1vZHVsZXMgPSBbXG4gIHJlZixcbiAgZGlyZWN0aXZlc1xuXTtcblxuLyogICovXG5cbmZ1bmN0aW9uIHVwZGF0ZUF0dHJzIChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgaWYgKCFvbGRWbm9kZS5kYXRhLmF0dHJzICYmICF2bm9kZS5kYXRhLmF0dHJzKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIGtleSwgY3VyLCBvbGQ7XG4gIHZhciBlbG0gPSB2bm9kZS5lbG07XG4gIHZhciBvbGRBdHRycyA9IG9sZFZub2RlLmRhdGEuYXR0cnMgfHwge307XG4gIHZhciBhdHRycyA9IHZub2RlLmRhdGEuYXR0cnMgfHwge307XG4gIC8vIGNsb25lIG9ic2VydmVkIG9iamVjdHMsIGFzIHRoZSB1c2VyIHByb2JhYmx5IHdhbnRzIHRvIG11dGF0ZSBpdFxuICBpZiAoYXR0cnMuX19vYl9fKSB7XG4gICAgYXR0cnMgPSB2bm9kZS5kYXRhLmF0dHJzID0gZXh0ZW5kKHt9LCBhdHRycyk7XG4gIH1cblxuICB2YXIgc3VwcG9ydEJhdGNoVXBkYXRlID0gdHlwZW9mIGVsbS5zZXRBdHRycyA9PT0gJ2Z1bmN0aW9uJztcbiAgdmFyIGJhdGNoZWRBdHRycyA9IHt9O1xuICBmb3IgKGtleSBpbiBhdHRycykge1xuICAgIGN1ciA9IGF0dHJzW2tleV07XG4gICAgb2xkID0gb2xkQXR0cnNba2V5XTtcbiAgICBpZiAob2xkICE9PSBjdXIpIHtcbiAgICAgIHN1cHBvcnRCYXRjaFVwZGF0ZVxuICAgICAgICA/IChiYXRjaGVkQXR0cnNba2V5XSA9IGN1cilcbiAgICAgICAgOiBlbG0uc2V0QXR0cihrZXksIGN1cik7XG4gICAgfVxuICB9XG4gIGZvciAoa2V5IGluIG9sZEF0dHJzKSB7XG4gICAgaWYgKGF0dHJzW2tleV0gPT0gbnVsbCkge1xuICAgICAgc3VwcG9ydEJhdGNoVXBkYXRlXG4gICAgICAgID8gKGJhdGNoZWRBdHRyc1trZXldID0gdW5kZWZpbmVkKVxuICAgICAgICA6IGVsbS5zZXRBdHRyKGtleSk7XG4gICAgfVxuICB9XG4gIGlmIChzdXBwb3J0QmF0Y2hVcGRhdGUpIHtcbiAgICBlbG0uc2V0QXR0cnMoYmF0Y2hlZEF0dHJzKTtcbiAgfVxufVxuXG52YXIgYXR0cnMgPSB7XG4gIGNyZWF0ZTogdXBkYXRlQXR0cnMsXG4gIHVwZGF0ZTogdXBkYXRlQXR0cnNcbn07XG5cbi8qICAqL1xuXG5mdW5jdGlvbiB1cGRhdGVDbGFzcyAob2xkVm5vZGUsIHZub2RlKSB7XG4gIHZhciBlbCA9IHZub2RlLmVsbTtcbiAgdmFyIGN0eCA9IHZub2RlLmNvbnRleHQ7XG5cbiAgdmFyIGRhdGEgPSB2bm9kZS5kYXRhO1xuICB2YXIgb2xkRGF0YSA9IG9sZFZub2RlLmRhdGE7XG4gIGlmICghZGF0YS5zdGF0aWNDbGFzcyAmJlxuICAgICFkYXRhLmNsYXNzICYmXG4gICAgKCFvbGREYXRhIHx8ICghb2xkRGF0YS5zdGF0aWNDbGFzcyAmJiAhb2xkRGF0YS5jbGFzcykpXG4gICkge1xuICAgIHJldHVyblxuICB9XG5cbiAgdmFyIG9sZENsYXNzTGlzdCA9IFtdO1xuICAvLyB1bmxpa2Ugd2ViLCB3ZWV4IHZub2RlIHN0YXRpY0NsYXNzIGlzIGFuIEFycmF5XG4gIHZhciBvbGRTdGF0aWNDbGFzcyA9IG9sZERhdGEuc3RhdGljQ2xhc3M7XG4gIGlmIChvbGRTdGF0aWNDbGFzcykge1xuICAgIG9sZENsYXNzTGlzdC5wdXNoLmFwcGx5KG9sZENsYXNzTGlzdCwgb2xkU3RhdGljQ2xhc3MpO1xuICB9XG4gIGlmIChvbGREYXRhLmNsYXNzKSB7XG4gICAgb2xkQ2xhc3NMaXN0LnB1c2guYXBwbHkob2xkQ2xhc3NMaXN0LCBvbGREYXRhLmNsYXNzKTtcbiAgfVxuXG4gIHZhciBjbGFzc0xpc3QgPSBbXTtcbiAgLy8gdW5saWtlIHdlYiwgd2VleCB2bm9kZSBzdGF0aWNDbGFzcyBpcyBhbiBBcnJheVxuICB2YXIgc3RhdGljQ2xhc3MgPSBkYXRhLnN0YXRpY0NsYXNzO1xuICBpZiAoc3RhdGljQ2xhc3MpIHtcbiAgICBjbGFzc0xpc3QucHVzaC5hcHBseShjbGFzc0xpc3QsIHN0YXRpY0NsYXNzKTtcbiAgfVxuICBpZiAoZGF0YS5jbGFzcykge1xuICAgIGNsYXNzTGlzdC5wdXNoLmFwcGx5KGNsYXNzTGlzdCwgZGF0YS5jbGFzcyk7XG4gIH1cblxuICB2YXIgc3R5bGUgPSBnZXRTdHlsZShvbGRDbGFzc0xpc3QsIGNsYXNzTGlzdCwgY3R4KTtcbiAgaWYgKHR5cGVvZiBlbC5zZXRTdHlsZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBlbC5zZXRTdHlsZXMoc3R5bGUpO1xuICB9IGVsc2Uge1xuICAgIGZvciAodmFyIGtleSBpbiBzdHlsZSkge1xuICAgICAgZWwuc2V0U3R5bGUoa2V5LCBzdHlsZVtrZXldKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGUgKG9sZENsYXNzTGlzdCwgY2xhc3NMaXN0LCBjdHgpIHtcbiAgLy8gc3R5bGUgaXMgYSB3ZWV4LW9ubHkgaW5qZWN0ZWQgb2JqZWN0XG4gIC8vIGNvbXBpbGVkIGZyb20gPHN0eWxlPiB0YWdzIGluIHdlZXggZmlsZXNcbiAgdmFyIHN0eWxlc2hlZXQgPSBjdHguJG9wdGlvbnMuc3R5bGUgfHwge307XG4gIHZhciByZXN1bHQgPSB7fTtcbiAgY2xhc3NMaXN0LmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgc3R5bGUgPSBzdHlsZXNoZWV0W25hbWVdO1xuICAgIGV4dGVuZChyZXN1bHQsIHN0eWxlKTtcbiAgfSk7XG4gIG9sZENsYXNzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdmFyIHN0eWxlID0gc3R5bGVzaGVldFtuYW1lXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3R5bGUpIHtcbiAgICAgIGlmICghcmVzdWx0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSAnJztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0XG59XG5cbnZhciBrbGFzcyA9IHtcbiAgY3JlYXRlOiB1cGRhdGVDbGFzcyxcbiAgdXBkYXRlOiB1cGRhdGVDbGFzc1xufTtcblxuLyogICovXG5cbnZhciB0YXJnZXQkMTtcblxuZnVuY3Rpb24gYWRkJDEgKFxuICBldmVudCxcbiAgaGFuZGxlcixcbiAgb25jZSxcbiAgY2FwdHVyZSxcbiAgcGFzc2l2ZSxcbiAgcGFyYW1zXG4pIHtcbiAgaWYgKGNhcHR1cmUpIHtcbiAgICBjb25zb2xlLmxvZygnV2VleCBkbyBub3Qgc3VwcG9ydCBldmVudCBpbiBidWJibGUgcGhhc2UuJyk7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKG9uY2UpIHtcbiAgICB2YXIgb2xkSGFuZGxlciA9IGhhbmRsZXI7XG4gICAgdmFyIF90YXJnZXQgPSB0YXJnZXQkMTsgLy8gc2F2ZSBjdXJyZW50IHRhcmdldCBlbGVtZW50IGluIGNsb3N1cmVcbiAgICBoYW5kbGVyID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICB2YXIgcmVzID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICA/IG9sZEhhbmRsZXIoZXYpXG4gICAgICAgIDogb2xkSGFuZGxlci5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKHJlcyAhPT0gbnVsbCkge1xuICAgICAgICByZW1vdmUkMihldmVudCwgbnVsbCwgbnVsbCwgX3RhcmdldCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICB0YXJnZXQkMS5hZGRFdmVudChldmVudCwgaGFuZGxlciwgcGFyYW1zKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlJDIgKFxuICBldmVudCxcbiAgaGFuZGxlcixcbiAgY2FwdHVyZSxcbiAgX3RhcmdldFxuKSB7XG4gIChfdGFyZ2V0IHx8IHRhcmdldCQxKS5yZW1vdmVFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZURPTUxpc3RlbmVycyAob2xkVm5vZGUsIHZub2RlKSB7XG4gIGlmICghb2xkVm5vZGUuZGF0YS5vbiAmJiAhdm5vZGUuZGF0YS5vbikge1xuICAgIHJldHVyblxuICB9XG4gIHZhciBvbiA9IHZub2RlLmRhdGEub24gfHwge307XG4gIHZhciBvbGRPbiA9IG9sZFZub2RlLmRhdGEub24gfHwge307XG4gIHRhcmdldCQxID0gdm5vZGUuZWxtO1xuICB1cGRhdGVMaXN0ZW5lcnMob24sIG9sZE9uLCBhZGQkMSwgcmVtb3ZlJDIsIHZub2RlLmNvbnRleHQpO1xuICB0YXJnZXQkMSA9IHVuZGVmaW5lZDtcbn1cblxudmFyIGV2ZW50cyA9IHtcbiAgY3JlYXRlOiB1cGRhdGVET01MaXN0ZW5lcnMsXG4gIHVwZGF0ZTogdXBkYXRlRE9NTGlzdGVuZXJzXG59O1xuXG4vKiAgKi9cblxudmFyIG5vcm1hbGl6ZSA9IGNhY2hlZChjYW1lbGl6ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVN0eWxlIChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgaWYgKCF2bm9kZS5kYXRhLnN0YXRpY1N0eWxlKSB7XG4gICAgdXBkYXRlU3R5bGUob2xkVm5vZGUsIHZub2RlKTtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgZWxtID0gdm5vZGUuZWxtO1xuICB2YXIgc3RhdGljU3R5bGUgPSB2bm9kZS5kYXRhLnN0YXRpY1N0eWxlO1xuICB2YXIgc3VwcG9ydEJhdGNoVXBkYXRlID0gdHlwZW9mIGVsbS5zZXRTdHlsZXMgPT09ICdmdW5jdGlvbic7XG4gIHZhciBiYXRjaGVkU3R5bGVzID0ge307XG4gIGZvciAodmFyIG5hbWUgaW4gc3RhdGljU3R5bGUpIHtcbiAgICBpZiAoc3RhdGljU3R5bGVbbmFtZV0pIHtcbiAgICAgIHN1cHBvcnRCYXRjaFVwZGF0ZVxuICAgICAgICA/IChiYXRjaGVkU3R5bGVzW25vcm1hbGl6ZShuYW1lKV0gPSBzdGF0aWNTdHlsZVtuYW1lXSlcbiAgICAgICAgOiBlbG0uc2V0U3R5bGUobm9ybWFsaXplKG5hbWUpLCBzdGF0aWNTdHlsZVtuYW1lXSk7XG4gICAgfVxuICB9XG4gIGlmIChzdXBwb3J0QmF0Y2hVcGRhdGUpIHtcbiAgICBlbG0uc2V0U3R5bGVzKGJhdGNoZWRTdHlsZXMpO1xuICB9XG4gIHVwZGF0ZVN0eWxlKG9sZFZub2RlLCB2bm9kZSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxlIChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgaWYgKCFvbGRWbm9kZS5kYXRhLnN0eWxlICYmICF2bm9kZS5kYXRhLnN0eWxlKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIGN1ciwgbmFtZTtcbiAgdmFyIGVsbSA9IHZub2RlLmVsbTtcbiAgdmFyIG9sZFN0eWxlID0gb2xkVm5vZGUuZGF0YS5zdHlsZSB8fCB7fTtcbiAgdmFyIHN0eWxlID0gdm5vZGUuZGF0YS5zdHlsZSB8fCB7fTtcblxuICB2YXIgbmVlZENsb25lID0gc3R5bGUuX19vYl9fO1xuXG4gIC8vIGhhbmRsZSBhcnJheSBzeW50YXhcbiAgaWYgKEFycmF5LmlzQXJyYXkoc3R5bGUpKSB7XG4gICAgc3R5bGUgPSB2bm9kZS5kYXRhLnN0eWxlID0gdG9PYmplY3QkMShzdHlsZSk7XG4gIH1cblxuICAvLyBjbG9uZSB0aGUgc3R5bGUgZm9yIGZ1dHVyZSB1cGRhdGVzLFxuICAvLyBpbiBjYXNlIHRoZSB1c2VyIG11dGF0ZXMgdGhlIHN0eWxlIG9iamVjdCBpbi1wbGFjZS5cbiAgaWYgKG5lZWRDbG9uZSkge1xuICAgIHN0eWxlID0gdm5vZGUuZGF0YS5zdHlsZSA9IGV4dGVuZCh7fSwgc3R5bGUpO1xuICB9XG5cbiAgdmFyIHN1cHBvcnRCYXRjaFVwZGF0ZSA9IHR5cGVvZiBlbG0uc2V0U3R5bGVzID09PSAnZnVuY3Rpb24nO1xuICB2YXIgYmF0Y2hlZFN0eWxlcyA9IHt9O1xuICBmb3IgKG5hbWUgaW4gb2xkU3R5bGUpIHtcbiAgICBpZiAoIXN0eWxlW25hbWVdKSB7XG4gICAgICBzdXBwb3J0QmF0Y2hVcGRhdGVcbiAgICAgICAgPyAoYmF0Y2hlZFN0eWxlc1tub3JtYWxpemUobmFtZSldID0gJycpXG4gICAgICAgIDogZWxtLnNldFN0eWxlKG5vcm1hbGl6ZShuYW1lKSwgJycpO1xuICAgIH1cbiAgfVxuICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICBjdXIgPSBzdHlsZVtuYW1lXTtcbiAgICBzdXBwb3J0QmF0Y2hVcGRhdGVcbiAgICAgID8gKGJhdGNoZWRTdHlsZXNbbm9ybWFsaXplKG5hbWUpXSA9IGN1cilcbiAgICAgIDogZWxtLnNldFN0eWxlKG5vcm1hbGl6ZShuYW1lKSwgY3VyKTtcbiAgfVxuICBpZiAoc3VwcG9ydEJhdGNoVXBkYXRlKSB7XG4gICAgZWxtLnNldFN0eWxlcyhiYXRjaGVkU3R5bGVzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b09iamVjdCQxIChhcnIpIHtcbiAgdmFyIHJlcyA9IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhcnJbaV0pIHtcbiAgICAgIGV4dGVuZChyZXMsIGFycltpXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXNcbn1cblxudmFyIHN0eWxlID0ge1xuICBjcmVhdGU6IGNyZWF0ZVN0eWxlLFxuICB1cGRhdGU6IHVwZGF0ZVN0eWxlXG59O1xuXG4vKiAgKi9cblxuLyoqXG4gKiBBZGQgY2xhc3Mgd2l0aCBjb21wYXRpYmlsaXR5IGZvciBTVkcgc2luY2UgY2xhc3NMaXN0IGlzIG5vdCBzdXBwb3J0ZWQgb25cbiAqIFNWRyBlbGVtZW50cyBpbiBJRVxuICovXG5cblxuLyoqXG4gKiBSZW1vdmUgY2xhc3Mgd2l0aCBjb21wYXRpYmlsaXR5IGZvciBTVkcgc2luY2UgY2xhc3NMaXN0IGlzIG5vdCBzdXBwb3J0ZWQgb25cbiAqIFNWRyBlbGVtZW50cyBpbiBJRVxuICovXG5cbi8qICAqL1xuXG5mdW5jdGlvbiByZXNvbHZlVHJhbnNpdGlvbiAoZGVmKSB7XG4gIGlmICghZGVmKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKHR5cGVvZiBkZWYgPT09ICdvYmplY3QnKSB7XG4gICAgdmFyIHJlcyA9IHt9O1xuICAgIGlmIChkZWYuY3NzICE9PSBmYWxzZSkge1xuICAgICAgZXh0ZW5kKHJlcywgYXV0b0Nzc1RyYW5zaXRpb24oZGVmLm5hbWUgfHwgJ3YnKSk7XG4gICAgfVxuICAgIGV4dGVuZChyZXMsIGRlZik7XG4gICAgcmV0dXJuIHJlc1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWYgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGF1dG9Dc3NUcmFuc2l0aW9uKGRlZilcbiAgfVxufVxuXG52YXIgYXV0b0Nzc1RyYW5zaXRpb24gPSBjYWNoZWQoZnVuY3Rpb24gKG5hbWUpIHtcbiAgcmV0dXJuIHtcbiAgICBlbnRlckNsYXNzOiAobmFtZSArIFwiLWVudGVyXCIpLFxuICAgIGVudGVyVG9DbGFzczogKG5hbWUgKyBcIi1lbnRlci10b1wiKSxcbiAgICBlbnRlckFjdGl2ZUNsYXNzOiAobmFtZSArIFwiLWVudGVyLWFjdGl2ZVwiKSxcbiAgICBsZWF2ZUNsYXNzOiAobmFtZSArIFwiLWxlYXZlXCIpLFxuICAgIGxlYXZlVG9DbGFzczogKG5hbWUgKyBcIi1sZWF2ZS10b1wiKSxcbiAgICBsZWF2ZUFjdGl2ZUNsYXNzOiAobmFtZSArIFwiLWxlYXZlLWFjdGl2ZVwiKVxuICB9XG59KTtcblxudmFyIGhhc1RyYW5zaXRpb24gPSBpbkJyb3dzZXIgJiYgIWlzSUU5O1xuLy8gVHJhbnNpdGlvbiBwcm9wZXJ0eS9ldmVudCBzbmlmZmluZ1xuXG5cblxuXG5pZiAoaGFzVHJhbnNpdGlvbikge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHdpbmRvdy5vbnRyYW5zaXRpb25lbmQgPT09IHVuZGVmaW5lZCAmJlxuICAgIHdpbmRvdy5vbndlYmtpdHRyYW5zaXRpb25lbmQgIT09IHVuZGVmaW5lZFxuICApIHtcblxuICB9XG4gIGlmICh3aW5kb3cub25hbmltYXRpb25lbmQgPT09IHVuZGVmaW5lZCAmJlxuICAgIHdpbmRvdy5vbndlYmtpdGFuaW1hdGlvbmVuZCAhPT0gdW5kZWZpbmVkXG4gICkge1xuXG4gIH1cbn1cblxuLy8gYmluZGluZyB0byB3aW5kb3cgaXMgbmVjZXNzYXJ5IHRvIG1ha2UgaG90IHJlbG9hZCB3b3JrIGluIElFIGluIHN0cmljdCBtb2RlXG52YXIgcmFmID0gaW5Ccm93c2VyXG4gID8gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgID8gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKHdpbmRvdylcbiAgICA6IHNldFRpbWVvdXRcbiAgOiAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBmdW5jdGlvbiAoZm4pIHsgcmV0dXJuIGZuKCk7IH07XG5cbnZhciB0cmFuc2l0aW9uID0ge1xuICBjcmVhdGU6IGVudGVyLFxuICBhY3RpdmF0ZTogZW50ZXIsXG4gIHJlbW92ZTogbGVhdmVcbn07XG5cbmZ1bmN0aW9uIGVudGVyIChfLCB2bm9kZSkge1xuICB2YXIgZWwgPSB2bm9kZS5lbG07XG5cbiAgLy8gY2FsbCBsZWF2ZSBjYWxsYmFjayBub3dcbiAgaWYgKGVsLl9sZWF2ZUNiKSB7XG4gICAgZWwuX2xlYXZlQ2IuY2FuY2VsbGVkID0gdHJ1ZTtcbiAgICBlbC5fbGVhdmVDYigpO1xuICB9XG5cbiAgdmFyIGRhdGEgPSByZXNvbHZlVHJhbnNpdGlvbih2bm9kZS5kYXRhLnRyYW5zaXRpb24pO1xuICBpZiAoIWRhdGEpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoZWwuX2VudGVyQ2IpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHZhciBlbnRlckNsYXNzID0gZGF0YS5lbnRlckNsYXNzO1xuICB2YXIgZW50ZXJUb0NsYXNzID0gZGF0YS5lbnRlclRvQ2xhc3M7XG4gIHZhciBlbnRlckFjdGl2ZUNsYXNzID0gZGF0YS5lbnRlckFjdGl2ZUNsYXNzO1xuICB2YXIgYXBwZWFyQ2xhc3MgPSBkYXRhLmFwcGVhckNsYXNzO1xuICB2YXIgYXBwZWFyVG9DbGFzcyA9IGRhdGEuYXBwZWFyVG9DbGFzcztcbiAgdmFyIGFwcGVhckFjdGl2ZUNsYXNzID0gZGF0YS5hcHBlYXJBY3RpdmVDbGFzcztcbiAgdmFyIGJlZm9yZUVudGVyID0gZGF0YS5iZWZvcmVFbnRlcjtcbiAgdmFyIGVudGVyID0gZGF0YS5lbnRlcjtcbiAgdmFyIGFmdGVyRW50ZXIgPSBkYXRhLmFmdGVyRW50ZXI7XG4gIHZhciBlbnRlckNhbmNlbGxlZCA9IGRhdGEuZW50ZXJDYW5jZWxsZWQ7XG4gIHZhciBiZWZvcmVBcHBlYXIgPSBkYXRhLmJlZm9yZUFwcGVhcjtcbiAgdmFyIGFwcGVhciA9IGRhdGEuYXBwZWFyO1xuICB2YXIgYWZ0ZXJBcHBlYXIgPSBkYXRhLmFmdGVyQXBwZWFyO1xuICB2YXIgYXBwZWFyQ2FuY2VsbGVkID0gZGF0YS5hcHBlYXJDYW5jZWxsZWQ7XG5cbiAgdmFyIGNvbnRleHQgPSBhY3RpdmVJbnN0YW5jZTtcbiAgdmFyIHRyYW5zaXRpb25Ob2RlID0gYWN0aXZlSW5zdGFuY2UuJHZub2RlO1xuICB3aGlsZSAodHJhbnNpdGlvbk5vZGUgJiYgdHJhbnNpdGlvbk5vZGUucGFyZW50KSB7XG4gICAgdHJhbnNpdGlvbk5vZGUgPSB0cmFuc2l0aW9uTm9kZS5wYXJlbnQ7XG4gICAgY29udGV4dCA9IHRyYW5zaXRpb25Ob2RlLmNvbnRleHQ7XG4gIH1cblxuICB2YXIgaXNBcHBlYXIgPSAhY29udGV4dC5faXNNb3VudGVkIHx8ICF2bm9kZS5pc1Jvb3RJbnNlcnQ7XG5cbiAgaWYgKGlzQXBwZWFyICYmICFhcHBlYXIgJiYgYXBwZWFyICE9PSAnJykge1xuICAgIHJldHVyblxuICB9XG5cbiAgdmFyIHN0YXJ0Q2xhc3MgPSBpc0FwcGVhciA/IGFwcGVhckNsYXNzIDogZW50ZXJDbGFzcztcbiAgdmFyIHRvQ2xhc3MgPSBpc0FwcGVhciA/IGFwcGVhclRvQ2xhc3MgOiBlbnRlclRvQ2xhc3M7XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzQXBwZWFyID8gYXBwZWFyQWN0aXZlQ2xhc3MgOiBlbnRlckFjdGl2ZUNsYXNzO1xuICB2YXIgYmVmb3JlRW50ZXJIb29rID0gaXNBcHBlYXIgPyAoYmVmb3JlQXBwZWFyIHx8IGJlZm9yZUVudGVyKSA6IGJlZm9yZUVudGVyO1xuICB2YXIgZW50ZXJIb29rID0gaXNBcHBlYXIgPyAodHlwZW9mIGFwcGVhciA9PT0gJ2Z1bmN0aW9uJyA/IGFwcGVhciA6IGVudGVyKSA6IGVudGVyO1xuICB2YXIgYWZ0ZXJFbnRlckhvb2sgPSBpc0FwcGVhciA/IChhZnRlckFwcGVhciB8fCBhZnRlckVudGVyKSA6IGFmdGVyRW50ZXI7XG4gIHZhciBlbnRlckNhbmNlbGxlZEhvb2sgPSBpc0FwcGVhciA/IChhcHBlYXJDYW5jZWxsZWQgfHwgZW50ZXJDYW5jZWxsZWQpIDogZW50ZXJDYW5jZWxsZWQ7XG5cbiAgdmFyIHVzZXJXYW50c0NvbnRyb2wgPVxuICAgIGVudGVySG9vayAmJlxuICAgIC8vIGVudGVySG9vayBtYXkgYmUgYSBib3VuZCBtZXRob2Qgd2hpY2ggZXhwb3Nlc1xuICAgIC8vIHRoZSBsZW5ndGggb2Ygb3JpZ2luYWwgZm4gYXMgX2xlbmd0aFxuICAgIChlbnRlckhvb2suX2xlbmd0aCB8fCBlbnRlckhvb2subGVuZ3RoKSA+IDE7XG5cbiAgdmFyIHN0eWxlc2hlZXQgPSB2bm9kZS5jb250ZXh0LiRvcHRpb25zLnN0eWxlIHx8IHt9O1xuICB2YXIgc3RhcnRTdGF0ZSA9IHN0eWxlc2hlZXRbc3RhcnRDbGFzc107XG4gIHZhciB0cmFuc2l0aW9uUHJvcGVydGllcyA9IChzdHlsZXNoZWV0WydAVFJBTlNJVElPTiddICYmIHN0eWxlc2hlZXRbJ0BUUkFOU0lUSU9OJ11bYWN0aXZlQ2xhc3NdKSB8fCB7fTtcbiAgdmFyIGVuZFN0YXRlID0gZ2V0RW50ZXJUYXJnZXRTdGF0ZShlbCwgc3R5bGVzaGVldCwgc3RhcnRDbGFzcywgdG9DbGFzcywgYWN0aXZlQ2xhc3MsIHZub2RlLmNvbnRleHQpO1xuICB2YXIgbmVlZEFuaW1hdGlvbiA9IE9iamVjdC5rZXlzKGVuZFN0YXRlKS5sZW5ndGggPiAwO1xuXG4gIHZhciBjYiA9IGVsLl9lbnRlckNiID0gb25jZShmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGNiLmNhbmNlbGxlZCkge1xuICAgICAgZW50ZXJDYW5jZWxsZWRIb29rICYmIGVudGVyQ2FuY2VsbGVkSG9vayhlbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFmdGVyRW50ZXJIb29rICYmIGFmdGVyRW50ZXJIb29rKGVsKTtcbiAgICB9XG4gICAgZWwuX2VudGVyQ2IgPSBudWxsO1xuICB9KTtcblxuICAvLyBXZSBuZWVkIHRvIHdhaXQgdW50aWwgdGhlIG5hdGl2ZSBlbGVtZW50IGhhcyBiZWVuIGluc2VydGVkLCBidXQgY3VycmVudGx5XG4gIC8vIHRoZXJlJ3Mgbm8gQVBJIHRvIGRvIHRoYXQuIFNvIHdlIGhhdmUgdG8gd2FpdCBcIm9uZSBmcmFtZVwiIC0gbm90IGVudGlyZWx5XG4gIC8vIHN1cmUgaWYgdGhpcyBpcyBndWFyYW50ZWVkIHRvIGJlIGVub3VnaCAoZS5nLiBvbiBzbG93IGRldmljZXM/KVxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGFyZW50ID0gZWwucGFyZW50Tm9kZTtcbiAgICB2YXIgcGVuZGluZ05vZGUgPSBwYXJlbnQgJiYgcGFyZW50Ll9wZW5kaW5nICYmIHBhcmVudC5fcGVuZGluZ1t2bm9kZS5rZXldO1xuICAgIGlmIChwZW5kaW5nTm9kZSAmJlxuICAgICAgcGVuZGluZ05vZGUuY29udGV4dCA9PT0gdm5vZGUuY29udGV4dCAmJlxuICAgICAgcGVuZGluZ05vZGUudGFnID09PSB2bm9kZS50YWcgJiZcbiAgICAgIHBlbmRpbmdOb2RlLmVsbS5fbGVhdmVDYlxuICAgICkge1xuICAgICAgcGVuZGluZ05vZGUuZWxtLl9sZWF2ZUNiKCk7XG4gICAgfVxuICAgIGVudGVySG9vayAmJiBlbnRlckhvb2soZWwsIGNiKTtcblxuICAgIGlmIChuZWVkQW5pbWF0aW9uKSB7XG4gICAgICB2YXIgYW5pbWF0aW9uID0gdm5vZGUuY29udGV4dC4kcmVxdWlyZVdlZXhNb2R1bGUoJ2FuaW1hdGlvbicpO1xuICAgICAgYW5pbWF0aW9uLnRyYW5zaXRpb24oZWwucmVmLCB7XG4gICAgICAgIHN0eWxlczogZW5kU3RhdGUsXG4gICAgICAgIGR1cmF0aW9uOiB0cmFuc2l0aW9uUHJvcGVydGllcy5kdXJhdGlvbiB8fCAwLFxuICAgICAgICBkZWxheTogdHJhbnNpdGlvblByb3BlcnRpZXMuZGVsYXkgfHwgMCxcbiAgICAgICAgdGltaW5nRnVuY3Rpb246IHRyYW5zaXRpb25Qcm9wZXJ0aWVzLnRpbWluZ0Z1bmN0aW9uIHx8ICdsaW5lYXInXG4gICAgICB9LCB1c2VyV2FudHNDb250cm9sID8gbm9vcCA6IGNiKTtcbiAgICB9IGVsc2UgaWYgKCF1c2VyV2FudHNDb250cm9sKSB7XG4gICAgICBjYigpO1xuICAgIH1cbiAgfSwgMTYpO1xuXG4gIC8vIHN0YXJ0IGVudGVyIHRyYW5zaXRpb25cbiAgYmVmb3JlRW50ZXJIb29rICYmIGJlZm9yZUVudGVySG9vayhlbCk7XG5cbiAgaWYgKHN0YXJ0U3RhdGUpIHtcbiAgICBpZiAodHlwZW9mIGVsLnNldFN0eWxlcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZWwuc2V0U3R5bGVzKHN0YXJ0U3RhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gc3RhcnRTdGF0ZSkge1xuICAgICAgICBlbC5zZXRTdHlsZShrZXksIHN0YXJ0U3RhdGVba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCFuZWVkQW5pbWF0aW9uICYmICF1c2VyV2FudHNDb250cm9sKSB7XG4gICAgY2IoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBsZWF2ZSAodm5vZGUsIHJtKSB7XG4gIHZhciBlbCA9IHZub2RlLmVsbTtcblxuICAvLyBjYWxsIGVudGVyIGNhbGxiYWNrIG5vd1xuICBpZiAoZWwuX2VudGVyQ2IpIHtcbiAgICBlbC5fZW50ZXJDYi5jYW5jZWxsZWQgPSB0cnVlO1xuICAgIGVsLl9lbnRlckNiKCk7XG4gIH1cblxuICB2YXIgZGF0YSA9IHJlc29sdmVUcmFuc2l0aW9uKHZub2RlLmRhdGEudHJhbnNpdGlvbik7XG4gIGlmICghZGF0YSkge1xuICAgIHJldHVybiBybSgpXG4gIH1cblxuICBpZiAoZWwuX2xlYXZlQ2IpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHZhciBsZWF2ZUNsYXNzID0gZGF0YS5sZWF2ZUNsYXNzO1xuICB2YXIgbGVhdmVUb0NsYXNzID0gZGF0YS5sZWF2ZVRvQ2xhc3M7XG4gIHZhciBsZWF2ZUFjdGl2ZUNsYXNzID0gZGF0YS5sZWF2ZUFjdGl2ZUNsYXNzO1xuICB2YXIgYmVmb3JlTGVhdmUgPSBkYXRhLmJlZm9yZUxlYXZlO1xuICB2YXIgbGVhdmUgPSBkYXRhLmxlYXZlO1xuICB2YXIgYWZ0ZXJMZWF2ZSA9IGRhdGEuYWZ0ZXJMZWF2ZTtcbiAgdmFyIGxlYXZlQ2FuY2VsbGVkID0gZGF0YS5sZWF2ZUNhbmNlbGxlZDtcbiAgdmFyIGRlbGF5TGVhdmUgPSBkYXRhLmRlbGF5TGVhdmU7XG5cbiAgdmFyIHVzZXJXYW50c0NvbnRyb2wgPVxuICAgIGxlYXZlICYmXG4gICAgLy8gbGVhdmUgaG9vayBtYXkgYmUgYSBib3VuZCBtZXRob2Qgd2hpY2ggZXhwb3Nlc1xuICAgIC8vIHRoZSBsZW5ndGggb2Ygb3JpZ2luYWwgZm4gYXMgX2xlbmd0aFxuICAgIChsZWF2ZS5fbGVuZ3RoIHx8IGxlYXZlLmxlbmd0aCkgPiAxO1xuXG4gIHZhciBzdHlsZXNoZWV0ID0gdm5vZGUuY29udGV4dC4kb3B0aW9ucy5zdHlsZSB8fCB7fTtcbiAgdmFyIHN0YXJ0U3RhdGUgPSBzdHlsZXNoZWV0W2xlYXZlQ2xhc3NdO1xuICB2YXIgZW5kU3RhdGUgPSBzdHlsZXNoZWV0W2xlYXZlVG9DbGFzc10gfHwgc3R5bGVzaGVldFtsZWF2ZUFjdGl2ZUNsYXNzXTtcbiAgdmFyIHRyYW5zaXRpb25Qcm9wZXJ0aWVzID0gKHN0eWxlc2hlZXRbJ0BUUkFOU0lUSU9OJ10gJiYgc3R5bGVzaGVldFsnQFRSQU5TSVRJT04nXVtsZWF2ZUFjdGl2ZUNsYXNzXSkgfHwge307XG5cbiAgdmFyIGNiID0gZWwuX2xlYXZlQ2IgPSBvbmNlKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoZWwucGFyZW50Tm9kZSAmJiBlbC5wYXJlbnROb2RlLl9wZW5kaW5nKSB7XG4gICAgICBlbC5wYXJlbnROb2RlLl9wZW5kaW5nW3Zub2RlLmtleV0gPSBudWxsO1xuICAgIH1cbiAgICBpZiAoY2IuY2FuY2VsbGVkKSB7XG4gICAgICBsZWF2ZUNhbmNlbGxlZCAmJiBsZWF2ZUNhbmNlbGxlZChlbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJtKCk7XG4gICAgICBhZnRlckxlYXZlICYmIGFmdGVyTGVhdmUoZWwpO1xuICAgIH1cbiAgICBlbC5fbGVhdmVDYiA9IG51bGw7XG4gIH0pO1xuXG4gIGlmIChkZWxheUxlYXZlKSB7XG4gICAgZGVsYXlMZWF2ZShwZXJmb3JtTGVhdmUpO1xuICB9IGVsc2Uge1xuICAgIHBlcmZvcm1MZWF2ZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVyZm9ybUxlYXZlICgpIHtcbiAgICB2YXIgYW5pbWF0aW9uID0gdm5vZGUuY29udGV4dC4kcmVxdWlyZVdlZXhNb2R1bGUoJ2FuaW1hdGlvbicpO1xuICAgIC8vIHRoZSBkZWxheWVkIGxlYXZlIG1heSBoYXZlIGFscmVhZHkgYmVlbiBjYW5jZWxsZWRcbiAgICBpZiAoY2IuY2FuY2VsbGVkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLy8gcmVjb3JkIGxlYXZpbmcgZWxlbWVudFxuICAgIGlmICghdm5vZGUuZGF0YS5zaG93KSB7XG4gICAgICAoZWwucGFyZW50Tm9kZS5fcGVuZGluZyB8fCAoZWwucGFyZW50Tm9kZS5fcGVuZGluZyA9IHt9KSlbdm5vZGUua2V5XSA9IHZub2RlO1xuICAgIH1cbiAgICBiZWZvcmVMZWF2ZSAmJiBiZWZvcmVMZWF2ZShlbCk7XG5cbiAgICBpZiAoc3RhcnRTdGF0ZSkge1xuICAgICAgYW5pbWF0aW9uLnRyYW5zaXRpb24oZWwucmVmLCB7XG4gICAgICAgIHN0eWxlczogc3RhcnRTdGF0ZVxuICAgICAgfSwgbmV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBuZXh0ICgpIHtcbiAgICAgIGFuaW1hdGlvbi50cmFuc2l0aW9uKGVsLnJlZiwge1xuICAgICAgICBzdHlsZXM6IGVuZFN0YXRlLFxuICAgICAgICBkdXJhdGlvbjogdHJhbnNpdGlvblByb3BlcnRpZXMuZHVyYXRpb24gfHwgMCxcbiAgICAgICAgZGVsYXk6IHRyYW5zaXRpb25Qcm9wZXJ0aWVzLmRlbGF5IHx8IDAsXG4gICAgICAgIHRpbWluZ0Z1bmN0aW9uOiB0cmFuc2l0aW9uUHJvcGVydGllcy50aW1pbmdGdW5jdGlvbiB8fCAnbGluZWFyJ1xuICAgICAgfSwgdXNlcldhbnRzQ29udHJvbCA/IG5vb3AgOiBjYik7XG4gICAgfVxuXG4gICAgbGVhdmUgJiYgbGVhdmUoZWwsIGNiKTtcbiAgICBpZiAoIWVuZFN0YXRlICYmICF1c2VyV2FudHNDb250cm9sKSB7XG4gICAgICBjYigpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBkZXRlcm1pbmUgdGhlIHRhcmdldCBhbmltYXRpb24gc3R5bGUgZm9yIGFuIGVudGVyaW5nIHRyYW5zaXRpb24uXG5mdW5jdGlvbiBnZXRFbnRlclRhcmdldFN0YXRlIChlbCwgc3R5bGVzaGVldCwgc3RhcnRDbGFzcywgZW5kQ2xhc3MsIGFjdGl2ZUNsYXNzLCB2bSkge1xuICB2YXIgdGFyZ2V0U3RhdGUgPSB7fTtcbiAgdmFyIHN0YXJ0U3RhdGUgPSBzdHlsZXNoZWV0W3N0YXJ0Q2xhc3NdO1xuICB2YXIgZW5kU3RhdGUgPSBzdHlsZXNoZWV0W2VuZENsYXNzXTtcbiAgdmFyIGFjdGl2ZVN0YXRlID0gc3R5bGVzaGVldFthY3RpdmVDbGFzc107XG4gIC8vIDEuIGZhbGxiYWNrIHRvIGVsZW1lbnQncyBkZWZhdWx0IHN0eWxpbmdcbiAgaWYgKHN0YXJ0U3RhdGUpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3RhcnRTdGF0ZSkge1xuICAgICAgdGFyZ2V0U3RhdGVba2V5XSA9IGVsLnN0eWxlW2tleV07XG4gICAgICBpZiAoXG4gICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiZcbiAgICAgICAgdGFyZ2V0U3RhdGVba2V5XSA9PSBudWxsICYmXG4gICAgICAgICghYWN0aXZlU3RhdGUgfHwgYWN0aXZlU3RhdGVba2V5XSA9PSBudWxsKSAmJlxuICAgICAgICAoIWVuZFN0YXRlIHx8IGVuZFN0YXRlW2tleV0gPT0gbnVsbClcbiAgICAgICkge1xuICAgICAgICB3YXJuKFxuICAgICAgICAgIFwidHJhbnNpdGlvbiBwcm9wZXJ0eSBcXFwiXCIgKyBrZXkgKyBcIlxcXCIgaXMgZGVjbGFyZWQgaW4gZW50ZXIgc3RhcnRpbmcgY2xhc3MgKC5cIiArIHN0YXJ0Q2xhc3MgKyBcIiksIFwiICtcbiAgICAgICAgICBcImJ1dCBub3QgZGVjbGFyZWQgYW55d2hlcmUgaW4gZW50ZXIgZW5kaW5nIGNsYXNzICguXCIgKyBlbmRDbGFzcyArIFwiKSwgXCIgK1xuICAgICAgICAgIFwiZW50ZXIgYWN0aXZlIGNhc3MgKC5cIiArIGFjdGl2ZUNsYXNzICsgXCIpIG9yIHRoZSBlbGVtZW50J3MgZGVmYXVsdCBzdHlsaW5nLiBcIiArXG4gICAgICAgICAgXCJOb3RlIGluIFdlZXgsIENTUyBwcm9wZXJ0aWVzIG5lZWQgZXhwbGljaXQgdmFsdWVzIHRvIGJlIHRyYW5zaXRpb25hYmxlLlwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIDIuIGlmIHN0YXRlIGlzIG1peGVkIGluIGFjdGl2ZSBzdGF0ZSwgZXh0cmFjdCB0aGVtIHdoaWxlIGV4Y2x1ZGluZ1xuICAvLyAgICB0cmFuc2l0aW9uIHByb3BlcnRpZXNcbiAgaWYgKGFjdGl2ZVN0YXRlKSB7XG4gICAgZm9yICh2YXIga2V5JDEgaW4gYWN0aXZlU3RhdGUpIHtcbiAgICAgIGlmIChrZXkkMS5pbmRleE9mKCd0cmFuc2l0aW9uJykgIT09IDApIHtcbiAgICAgICAgdGFyZ2V0U3RhdGVba2V5JDFdID0gYWN0aXZlU3RhdGVba2V5JDFdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyAzLiBleHBsaWNpdCBlbmRTdGF0ZSBoYXMgaGlnaGVzdCBwcmlvcml0eVxuICBpZiAoZW5kU3RhdGUpIHtcbiAgICBleHRlbmQodGFyZ2V0U3RhdGUsIGVuZFN0YXRlKTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0U3RhdGVcbn1cblxudmFyIHBsYXRmb3JtTW9kdWxlcyA9IFtcbiAgYXR0cnMsXG4gIGtsYXNzLFxuICBldmVudHMsXG4gIHN0eWxlLFxuICB0cmFuc2l0aW9uXG5dO1xuXG4vKiAgKi9cblxuLy8gdGhlIGRpcmVjdGl2ZSBtb2R1bGUgc2hvdWxkIGJlIGFwcGxpZWQgbGFzdCwgYWZ0ZXIgYWxsXG4vLyBidWlsdC1pbiBtb2R1bGVzIGhhdmUgYmVlbiBhcHBsaWVkLlxudmFyIG1vZHVsZXMgPSBwbGF0Zm9ybU1vZHVsZXMuY29uY2F0KGJhc2VNb2R1bGVzKTtcblxudmFyIHBhdGNoID0gY3JlYXRlUGF0Y2hGdW5jdGlvbih7XG4gIG5vZGVPcHM6IG5vZGVPcHMsXG4gIG1vZHVsZXM6IG1vZHVsZXMsXG4gIExPTkdfTElTVF9USFJFU0hPTEQ6IDEwXG59KTtcblxudmFyIHBsYXRmb3JtRGlyZWN0aXZlcyA9IHtcbn07XG5cbi8qICAqL1xuXG5mdW5jdGlvbiBnZXRWTm9kZVR5cGUgKHZub2RlKSB7XG4gIGlmICghdm5vZGUudGFnKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgcmV0dXJuIHZub2RlLnRhZy5yZXBsYWNlKC92dWVcXC1jb21wb25lbnRcXC0oXFxkK1xcLSk/LywgJycpXG59XG5cbmZ1bmN0aW9uIGlzU2ltcGxlU3BhbiAodm5vZGUpIHtcbiAgcmV0dXJuIHZub2RlLmNoaWxkcmVuICYmXG4gICAgdm5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmXG4gICAgIXZub2RlLmNoaWxkcmVuWzBdLnRhZ1xufVxuXG5mdW5jdGlvbiBwYXJzZVN0eWxlICh2bm9kZSkge1xuICBpZiAoIXZub2RlIHx8ICF2bm9kZS5kYXRhKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIHJlZiA9IHZub2RlLmRhdGE7XG4gIHZhciBzdGF0aWNTdHlsZSA9IHJlZi5zdGF0aWNTdHlsZTtcbiAgdmFyIHN0YXRpY0NsYXNzID0gcmVmLnN0YXRpY0NsYXNzO1xuICBpZiAodm5vZGUuZGF0YS5zdHlsZSB8fCB2bm9kZS5kYXRhLmNsYXNzIHx8IHN0YXRpY1N0eWxlIHx8IHN0YXRpY0NsYXNzKSB7XG4gICAgdmFyIHN0eWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHN0YXRpY1N0eWxlLCB2bm9kZS5kYXRhLnN0eWxlKTtcbiAgICB2YXIgY3NzTWFwID0gdm5vZGUuY29udGV4dC4kb3B0aW9ucy5zdHlsZSB8fCB7fTtcbiAgICB2YXIgY2xhc3NMaXN0ID0gW10uY29uY2F0KHN0YXRpY0NsYXNzLCB2bm9kZS5kYXRhLmNsYXNzKTtcbiAgICBjbGFzc0xpc3QuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgaWYgKG5hbWUgJiYgY3NzTWFwW25hbWVdKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oc3R5bGVzLCBjc3NNYXBbbmFtZV0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdHlsZXNcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0Vk5vZGVDaGlsZHJlbiAoY2hpbGRyZW4pIHtcbiAgaWYgKCFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHJldHVybiBjaGlsZHJlbi5tYXAoZnVuY3Rpb24gKHZub2RlKSB7XG4gICAgdmFyIHR5cGUgPSBnZXRWTm9kZVR5cGUodm5vZGUpO1xuICAgIHZhciBwcm9wcyA9IHsgdHlwZTogdHlwZSB9O1xuXG4gICAgLy8gY29udmVydCByYXcgdGV4dCBub2RlXG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICBwcm9wcy50eXBlID0gJ3NwYW4nO1xuICAgICAgcHJvcHMuYXR0ciA9IHtcbiAgICAgICAgdmFsdWU6ICh2bm9kZS50ZXh0IHx8ICcnKS50cmltKClcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3BzLnN0eWxlID0gcGFyc2VTdHlsZSh2bm9kZSk7XG4gICAgICBpZiAodm5vZGUuZGF0YSkge1xuICAgICAgICBwcm9wcy5hdHRyID0gdm5vZGUuZGF0YS5hdHRycztcbiAgICAgICAgaWYgKHZub2RlLmRhdGEub24pIHtcbiAgICAgICAgICBwcm9wcy5ldmVudHMgPSB2bm9kZS5kYXRhLm9uO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodHlwZSA9PT0gJ3NwYW4nICYmIGlzU2ltcGxlU3Bhbih2bm9kZSkpIHtcbiAgICAgICAgcHJvcHMuYXR0ciA9IHByb3BzLmF0dHIgfHwge307XG4gICAgICAgIHByb3BzLmF0dHIudmFsdWUgPSB2bm9kZS5jaGlsZHJlblswXS50ZXh0LnRyaW0oKTtcbiAgICAgICAgcmV0dXJuIHByb3BzXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHZub2RlLmNoaWxkcmVuICYmIHZub2RlLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgcHJvcHMuY2hpbGRyZW4gPSBjb252ZXJ0Vk5vZGVDaGlsZHJlbih2bm9kZS5jaGlsZHJlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BzXG4gIH0pXG59XG5cbnZhciBSaWNodGV4dCA9IHtcbiAgbmFtZTogJ3JpY2h0ZXh0JyxcbiAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIgKGgpIHtcbiAgICByZXR1cm4gaCgnd2VleDpyaWNodGV4dCcsIHtcbiAgICAgIG9uOiB0aGlzLl9ldmVudHMsXG4gICAgICBhdHRyczoge1xuICAgICAgICB2YWx1ZTogY29udmVydFZOb2RlQ2hpbGRyZW4odGhpcy4kb3B0aW9ucy5fcmVuZGVyQ2hpbGRyZW4gfHwgW10pXG4gICAgICB9XG4gICAgfSlcbiAgfVxufTtcblxuLyogICovXG5cbi8vIFByb3ZpZGVzIHRyYW5zaXRpb24gc3VwcG9ydCBmb3IgYSBzaW5nbGUgZWxlbWVudC9jb21wb25lbnQuXG4vLyBzdXBwb3J0cyB0cmFuc2l0aW9uIG1vZGUgKG91dC1pbiAvIGluLW91dClcblxudmFyIHRyYW5zaXRpb25Qcm9wcyA9IHtcbiAgbmFtZTogU3RyaW5nLFxuICBhcHBlYXI6IEJvb2xlYW4sXG4gIGNzczogQm9vbGVhbixcbiAgbW9kZTogU3RyaW5nLFxuICB0eXBlOiBTdHJpbmcsXG4gIGVudGVyQ2xhc3M6IFN0cmluZyxcbiAgbGVhdmVDbGFzczogU3RyaW5nLFxuICBlbnRlclRvQ2xhc3M6IFN0cmluZyxcbiAgbGVhdmVUb0NsYXNzOiBTdHJpbmcsXG4gIGVudGVyQWN0aXZlQ2xhc3M6IFN0cmluZyxcbiAgbGVhdmVBY3RpdmVDbGFzczogU3RyaW5nLFxuICBhcHBlYXJDbGFzczogU3RyaW5nLFxuICBhcHBlYXJBY3RpdmVDbGFzczogU3RyaW5nLFxuICBhcHBlYXJUb0NsYXNzOiBTdHJpbmcsXG4gIGR1cmF0aW9uOiBbTnVtYmVyLCBTdHJpbmcsIE9iamVjdF1cbn07XG5cbi8vIGluIGNhc2UgdGhlIGNoaWxkIGlzIGFsc28gYW4gYWJzdHJhY3QgY29tcG9uZW50LCBlLmcuIDxrZWVwLWFsaXZlPlxuLy8gd2Ugd2FudCB0byByZWN1cnNpdmVseSByZXRyaWV2ZSB0aGUgcmVhbCBjb21wb25lbnQgdG8gYmUgcmVuZGVyZWRcbmZ1bmN0aW9uIGdldFJlYWxDaGlsZCAodm5vZGUpIHtcbiAgdmFyIGNvbXBPcHRpb25zID0gdm5vZGUgJiYgdm5vZGUuY29tcG9uZW50T3B0aW9ucztcbiAgaWYgKGNvbXBPcHRpb25zICYmIGNvbXBPcHRpb25zLkN0b3Iub3B0aW9ucy5hYnN0cmFjdCkge1xuICAgIHJldHVybiBnZXRSZWFsQ2hpbGQoZ2V0Rmlyc3RDb21wb25lbnRDaGlsZChjb21wT3B0aW9ucy5jaGlsZHJlbikpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZub2RlXG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdFRyYW5zaXRpb25EYXRhIChjb21wKSB7XG4gIHZhciBkYXRhID0ge307XG4gIHZhciBvcHRpb25zID0gY29tcC4kb3B0aW9ucztcbiAgLy8gcHJvcHNcbiAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMucHJvcHNEYXRhKSB7XG4gICAgZGF0YVtrZXldID0gY29tcFtrZXldO1xuICB9XG4gIC8vIGV2ZW50cy5cbiAgLy8gZXh0cmFjdCBsaXN0ZW5lcnMgYW5kIHBhc3MgdGhlbSBkaXJlY3RseSB0byB0aGUgdHJhbnNpdGlvbiBtZXRob2RzXG4gIHZhciBsaXN0ZW5lcnMgPSBvcHRpb25zLl9wYXJlbnRMaXN0ZW5lcnM7XG4gIGZvciAodmFyIGtleSQxIGluIGxpc3RlbmVycykge1xuICAgIGRhdGFbY2FtZWxpemUoa2V5JDEpXSA9IGxpc3RlbmVyc1trZXkkMV07XG4gIH1cbiAgcmV0dXJuIGRhdGFcbn1cblxuZnVuY3Rpb24gcGxhY2Vob2xkZXIgKGgsIHJhd0NoaWxkKSB7XG4gIGlmICgvXFxkLWtlZXAtYWxpdmUkLy50ZXN0KHJhd0NoaWxkLnRhZykpIHtcbiAgICByZXR1cm4gaCgna2VlcC1hbGl2ZScsIHtcbiAgICAgIHByb3BzOiByYXdDaGlsZC5jb21wb25lbnRPcHRpb25zLnByb3BzRGF0YVxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gaGFzUGFyZW50VHJhbnNpdGlvbiAodm5vZGUpIHtcbiAgd2hpbGUgKCh2bm9kZSA9IHZub2RlLnBhcmVudCkpIHtcbiAgICBpZiAodm5vZGUuZGF0YS50cmFuc2l0aW9uKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpc1NhbWVDaGlsZCAoY2hpbGQsIG9sZENoaWxkKSB7XG4gIHJldHVybiBvbGRDaGlsZC5rZXkgPT09IGNoaWxkLmtleSAmJiBvbGRDaGlsZC50YWcgPT09IGNoaWxkLnRhZ1xufVxuXG52YXIgVHJhbnNpdGlvbiQxID0ge1xuICBuYW1lOiAndHJhbnNpdGlvbicsXG4gIHByb3BzOiB0cmFuc2l0aW9uUHJvcHMsXG4gIGFic3RyYWN0OiB0cnVlLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyIChoKSB7XG4gICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLiRzbG90cy5kZWZhdWx0O1xuICAgIGlmICghY2hpbGRyZW4pIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIGZpbHRlciBvdXQgdGV4dCBub2RlcyAocG9zc2libGUgd2hpdGVzcGFjZXMpXG4gICAgY2hpbGRyZW4gPSBjaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMudGFnIHx8IGlzQXN5bmNQbGFjZWhvbGRlcihjKTsgfSk7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIHdhcm4gbXVsdGlwbGUgZWxlbWVudHNcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiBjaGlsZHJlbi5sZW5ndGggPiAxKSB7XG4gICAgICB3YXJuKFxuICAgICAgICAnPHRyYW5zaXRpb24+IGNhbiBvbmx5IGJlIHVzZWQgb24gYSBzaW5nbGUgZWxlbWVudC4gVXNlICcgK1xuICAgICAgICAnPHRyYW5zaXRpb24tZ3JvdXA+IGZvciBsaXN0cy4nLFxuICAgICAgICB0aGlzLiRwYXJlbnRcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIG1vZGUgPSB0aGlzLm1vZGU7XG5cbiAgICAvLyB3YXJuIGludmFsaWQgbW9kZVxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmXG4gICAgICBtb2RlICYmIG1vZGUgIT09ICdpbi1vdXQnICYmIG1vZGUgIT09ICdvdXQtaW4nXG4gICAgKSB7XG4gICAgICB3YXJuKFxuICAgICAgICAnaW52YWxpZCA8dHJhbnNpdGlvbj4gbW9kZTogJyArIG1vZGUsXG4gICAgICAgIHRoaXMuJHBhcmVudFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB2YXIgcmF3Q2hpbGQgPSBjaGlsZHJlblswXTtcblxuICAgIC8vIGlmIHRoaXMgaXMgYSBjb21wb25lbnQgcm9vdCBub2RlIGFuZCB0aGUgY29tcG9uZW50J3NcbiAgICAvLyBwYXJlbnQgY29udGFpbmVyIG5vZGUgYWxzbyBoYXMgdHJhbnNpdGlvbiwgc2tpcC5cbiAgICBpZiAoaGFzUGFyZW50VHJhbnNpdGlvbih0aGlzLiR2bm9kZSkpIHtcbiAgICAgIHJldHVybiByYXdDaGlsZFxuICAgIH1cblxuICAgIC8vIGFwcGx5IHRyYW5zaXRpb24gZGF0YSB0byBjaGlsZFxuICAgIC8vIHVzZSBnZXRSZWFsQ2hpbGQoKSB0byBpZ25vcmUgYWJzdHJhY3QgY29tcG9uZW50cyBlLmcuIGtlZXAtYWxpdmVcbiAgICB2YXIgY2hpbGQgPSBnZXRSZWFsQ2hpbGQocmF3Q2hpbGQpO1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmICghY2hpbGQpIHtcbiAgICAgIHJldHVybiByYXdDaGlsZFxuICAgIH1cblxuICAgIGlmICh0aGlzLl9sZWF2aW5nKSB7XG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXIoaCwgcmF3Q2hpbGQpXG4gICAgfVxuXG4gICAgLy8gZW5zdXJlIGEga2V5IHRoYXQgaXMgdW5pcXVlIHRvIHRoZSB2bm9kZSB0eXBlIGFuZCB0byB0aGlzIHRyYW5zaXRpb25cbiAgICAvLyBjb21wb25lbnQgaW5zdGFuY2UuIFRoaXMga2V5IHdpbGwgYmUgdXNlZCB0byByZW1vdmUgcGVuZGluZyBsZWF2aW5nIG5vZGVzXG4gICAgLy8gZHVyaW5nIGVudGVyaW5nLlxuICAgIHZhciBpZCA9IFwiX190cmFuc2l0aW9uLVwiICsgKHRoaXMuX3VpZCkgKyBcIi1cIjtcbiAgICBjaGlsZC5rZXkgPSBjaGlsZC5rZXkgPT0gbnVsbFxuICAgICAgPyBjaGlsZC5pc0NvbW1lbnRcbiAgICAgICAgPyBpZCArICdjb21tZW50J1xuICAgICAgICA6IGlkICsgY2hpbGQudGFnXG4gICAgICA6IGlzUHJpbWl0aXZlKGNoaWxkLmtleSlcbiAgICAgICAgPyAoU3RyaW5nKGNoaWxkLmtleSkuaW5kZXhPZihpZCkgPT09IDAgPyBjaGlsZC5rZXkgOiBpZCArIGNoaWxkLmtleSlcbiAgICAgICAgOiBjaGlsZC5rZXk7XG5cbiAgICB2YXIgZGF0YSA9IChjaGlsZC5kYXRhIHx8IChjaGlsZC5kYXRhID0ge30pKS50cmFuc2l0aW9uID0gZXh0cmFjdFRyYW5zaXRpb25EYXRhKHRoaXMpO1xuICAgIHZhciBvbGRSYXdDaGlsZCA9IHRoaXMuX3Zub2RlO1xuICAgIHZhciBvbGRDaGlsZCA9IGdldFJlYWxDaGlsZChvbGRSYXdDaGlsZCk7XG5cbiAgICAvLyBtYXJrIHYtc2hvd1xuICAgIC8vIHNvIHRoYXQgdGhlIHRyYW5zaXRpb24gbW9kdWxlIGNhbiBoYW5kIG92ZXIgdGhlIGNvbnRyb2wgdG8gdGhlIGRpcmVjdGl2ZVxuICAgIGlmIChjaGlsZC5kYXRhLmRpcmVjdGl2ZXMgJiYgY2hpbGQuZGF0YS5kaXJlY3RpdmVzLnNvbWUoZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQubmFtZSA9PT0gJ3Nob3cnOyB9KSkge1xuICAgICAgY2hpbGQuZGF0YS5zaG93ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBvbGRDaGlsZCAmJlxuICAgICAgb2xkQ2hpbGQuZGF0YSAmJlxuICAgICAgIWlzU2FtZUNoaWxkKGNoaWxkLCBvbGRDaGlsZCkgJiZcbiAgICAgICFpc0FzeW5jUGxhY2Vob2xkZXIob2xkQ2hpbGQpICYmXG4gICAgICAvLyAjNjY4NyBjb21wb25lbnQgcm9vdCBpcyBhIGNvbW1lbnQgbm9kZVxuICAgICAgIShvbGRDaGlsZC5jb21wb25lbnRJbnN0YW5jZSAmJiBvbGRDaGlsZC5jb21wb25lbnRJbnN0YW5jZS5fdm5vZGUuaXNDb21tZW50KVxuICAgICkge1xuICAgICAgLy8gcmVwbGFjZSBvbGQgY2hpbGQgdHJhbnNpdGlvbiBkYXRhIHdpdGggZnJlc2ggb25lXG4gICAgICAvLyBpbXBvcnRhbnQgZm9yIGR5bmFtaWMgdHJhbnNpdGlvbnMhXG4gICAgICB2YXIgb2xkRGF0YSA9IG9sZENoaWxkLmRhdGEudHJhbnNpdGlvbiA9IGV4dGVuZCh7fSwgZGF0YSk7XG4gICAgICAvLyBoYW5kbGUgdHJhbnNpdGlvbiBtb2RlXG4gICAgICBpZiAobW9kZSA9PT0gJ291dC1pbicpIHtcbiAgICAgICAgLy8gcmV0dXJuIHBsYWNlaG9sZGVyIG5vZGUgYW5kIHF1ZXVlIHVwZGF0ZSB3aGVuIGxlYXZlIGZpbmlzaGVzXG4gICAgICAgIHRoaXMuX2xlYXZpbmcgPSB0cnVlO1xuICAgICAgICBtZXJnZVZOb2RlSG9vayhvbGREYXRhLCAnYWZ0ZXJMZWF2ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aGlzJDEuX2xlYXZpbmcgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzJDEuJGZvcmNlVXBkYXRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcGxhY2Vob2xkZXIoaCwgcmF3Q2hpbGQpXG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT09ICdpbi1vdXQnKSB7XG4gICAgICAgIGlmIChpc0FzeW5jUGxhY2Vob2xkZXIoY2hpbGQpKSB7XG4gICAgICAgICAgcmV0dXJuIG9sZFJhd0NoaWxkXG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRlbGF5ZWRMZWF2ZTtcbiAgICAgICAgdmFyIHBlcmZvcm1MZWF2ZSA9IGZ1bmN0aW9uICgpIHsgZGVsYXllZExlYXZlKCk7IH07XG4gICAgICAgIG1lcmdlVk5vZGVIb29rKGRhdGEsICdhZnRlckVudGVyJywgcGVyZm9ybUxlYXZlKTtcbiAgICAgICAgbWVyZ2VWTm9kZUhvb2soZGF0YSwgJ2VudGVyQ2FuY2VsbGVkJywgcGVyZm9ybUxlYXZlKTtcbiAgICAgICAgbWVyZ2VWTm9kZUhvb2sob2xkRGF0YSwgJ2RlbGF5TGVhdmUnLCBmdW5jdGlvbiAobGVhdmUpIHsgZGVsYXllZExlYXZlID0gbGVhdmU7IH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByYXdDaGlsZFxuICB9XG59O1xuXG4vLyByZXVzZSBzYW1lIHRyYW5zaXRpb24gY29tcG9uZW50IGxvZ2ljIGZyb20gd2ViXG5cbnZhciBwcm9wcyA9IGV4dGVuZCh7XG4gIHRhZzogU3RyaW5nLFxuICBtb3ZlQ2xhc3M6IFN0cmluZ1xufSwgdHJhbnNpdGlvblByb3BzKTtcblxuZGVsZXRlIHByb3BzLm1vZGU7XG5cbnZhciBUcmFuc2l0aW9uR3JvdXAgPSB7XG4gIHByb3BzOiBwcm9wcyxcblxuICBjcmVhdGVkOiBmdW5jdGlvbiBjcmVhdGVkICgpIHtcbiAgICB2YXIgZG9tID0gdGhpcy4kcmVxdWlyZVdlZXhNb2R1bGUoJ2RvbScpO1xuICAgIHRoaXMuZ2V0UG9zaXRpb24gPSBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGRvbS5nZXRDb21wb25lbnRSZWN0KGVsLnJlZiwgZnVuY3Rpb24gKHJlcykge1xuICAgICAgICBpZiAoIXJlcy5yZXN1bHQpIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKChcImZhaWxlZCB0byBnZXQgcmVjdCBmb3IgZWxlbWVudDogXCIgKyAoZWwudGFnKSkpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKHJlcy5zaXplKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7IH07XG5cbiAgICB2YXIgYW5pbWF0aW9uID0gdGhpcy4kcmVxdWlyZVdlZXhNb2R1bGUoJ2FuaW1hdGlvbicpO1xuICAgIHRoaXMuYW5pbWF0ZSA9IGZ1bmN0aW9uIChlbCwgb3B0aW9ucykgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgIGFuaW1hdGlvbi50cmFuc2l0aW9uKGVsLnJlZiwgb3B0aW9ucywgcmVzb2x2ZSk7XG4gICAgfSk7IH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIgKGgpIHtcbiAgICB2YXIgdGFnID0gdGhpcy50YWcgfHwgdGhpcy4kdm5vZGUuZGF0YS50YWcgfHwgJ3NwYW4nO1xuICAgIHZhciBtYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHZhciBwcmV2Q2hpbGRyZW4gPSB0aGlzLnByZXZDaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgdmFyIHJhd0NoaWxkcmVuID0gdGhpcy4kc2xvdHMuZGVmYXVsdCB8fCBbXTtcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuID0gW107XG4gICAgdmFyIHRyYW5zaXRpb25EYXRhID0gZXh0cmFjdFRyYW5zaXRpb25EYXRhKHRoaXMpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYXdDaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGMgPSByYXdDaGlsZHJlbltpXTtcbiAgICAgIGlmIChjLnRhZykge1xuICAgICAgICBpZiAoYy5rZXkgIT0gbnVsbCAmJiBTdHJpbmcoYy5rZXkpLmluZGV4T2YoJ19fdmxpc3QnKSAhPT0gMCkge1xuICAgICAgICAgIGNoaWxkcmVuLnB1c2goYyk7XG4gICAgICAgICAgbWFwW2Mua2V5XSA9IGNcbiAgICAgICAgICA7KGMuZGF0YSB8fCAoYy5kYXRhID0ge30pKS50cmFuc2l0aW9uID0gdHJhbnNpdGlvbkRhdGE7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgIHZhciBvcHRzID0gYy5jb21wb25lbnRPcHRpb25zO1xuICAgICAgICAgIHZhciBuYW1lID0gb3B0c1xuICAgICAgICAgICAgPyAob3B0cy5DdG9yLm9wdGlvbnMubmFtZSB8fCBvcHRzLnRhZylcbiAgICAgICAgICAgIDogYy50YWc7XG4gICAgICAgICAgd2FybigoXCI8dHJhbnNpdGlvbi1ncm91cD4gY2hpbGRyZW4gbXVzdCBiZSBrZXllZDogPFwiICsgbmFtZSArIFwiPlwiKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocHJldkNoaWxkcmVuKSB7XG4gICAgICB2YXIga2VwdCA9IFtdO1xuICAgICAgdmFyIHJlbW92ZWQgPSBbXTtcbiAgICAgIHByZXZDaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIGMuZGF0YS50cmFuc2l0aW9uID0gdHJhbnNpdGlvbkRhdGE7XG5cbiAgICAgICAgLy8gVE9ETzogcmVjb3JkIGJlZm9yZSBwYXRjaCBwb3NpdGlvbnNcblxuICAgICAgICBpZiAobWFwW2Mua2V5XSkge1xuICAgICAgICAgIGtlcHQucHVzaChjKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZW1vdmVkLnB1c2goYyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5rZXB0ID0gaCh0YWcsIG51bGwsIGtlcHQpO1xuICAgICAgdGhpcy5yZW1vdmVkID0gcmVtb3ZlZDtcbiAgICB9XG5cbiAgICByZXR1cm4gaCh0YWcsIG51bGwsIGNoaWxkcmVuKVxuICB9LFxuXG4gIGJlZm9yZVVwZGF0ZTogZnVuY3Rpb24gYmVmb3JlVXBkYXRlICgpIHtcbiAgICAvLyBmb3JjZSByZW1vdmluZyBwYXNzXG4gICAgdGhpcy5fX3BhdGNoX18oXG4gICAgICB0aGlzLl92bm9kZSxcbiAgICAgIHRoaXMua2VwdCxcbiAgICAgIGZhbHNlLCAvLyBoeWRyYXRpbmdcbiAgICAgIHRydWUgLy8gcmVtb3ZlT25seSAoIWltcG9ydGFudCBhdm9pZHMgdW5uZWNlc3NhcnkgbW92ZXMpXG4gICAgKTtcbiAgICB0aGlzLl92bm9kZSA9IHRoaXMua2VwdDtcbiAgfSxcblxuICB1cGRhdGVkOiBmdW5jdGlvbiB1cGRhdGVkICgpIHtcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLnByZXZDaGlsZHJlbjtcbiAgICB2YXIgbW92ZUNsYXNzID0gdGhpcy5tb3ZlQ2xhc3MgfHwgKCh0aGlzLm5hbWUgfHwgJ3YnKSArICctbW92ZScpO1xuICAgIHZhciBtb3ZlRGF0YSA9IGNoaWxkcmVuLmxlbmd0aCAmJiB0aGlzLmdldE1vdmVEYXRhKGNoaWxkcmVuWzBdLmNvbnRleHQsIG1vdmVDbGFzcyk7XG4gICAgaWYgKCFtb3ZlRGF0YSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gVE9ETzogZmluaXNoIGltcGxlbWVudGluZyBtb3ZlIGFuaW1hdGlvbnMgb25jZVxuICAgIC8vIHdlIGhhdmUgYWNjZXNzIHRvIHN5bmMgZ2V0Q29tcG9uZW50UmVjdCgpXG5cbiAgICAvLyBjaGlsZHJlbi5mb3JFYWNoKGNhbGxQZW5kaW5nQ2JzKVxuXG4gICAgLy8gUHJvbWlzZS5hbGwoY2hpbGRyZW4ubWFwKGMgPT4ge1xuICAgIC8vICAgY29uc3Qgb2xkUG9zID0gYy5kYXRhLnBvc1xuICAgIC8vICAgY29uc3QgbmV3UG9zID0gYy5kYXRhLm5ld1Bvc1xuICAgIC8vICAgY29uc3QgZHggPSBvbGRQb3MubGVmdCAtIG5ld1Bvcy5sZWZ0XG4gICAgLy8gICBjb25zdCBkeSA9IG9sZFBvcy50b3AgLSBuZXdQb3MudG9wXG4gICAgLy8gICBpZiAoZHggfHwgZHkpIHtcbiAgICAvLyAgICAgYy5kYXRhLm1vdmVkID0gdHJ1ZVxuICAgIC8vICAgICByZXR1cm4gdGhpcy5hbmltYXRlKGMuZWxtLCB7XG4gICAgLy8gICAgICAgc3R5bGVzOiB7XG4gICAgLy8gICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGUoJHtkeH1weCwke2R5fXB4KWBcbiAgICAvLyAgICAgICB9XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICB9XG4gICAgLy8gfSkpLnRoZW4oKCkgPT4ge1xuICAgIC8vICAgY2hpbGRyZW4uZm9yRWFjaChjID0+IHtcbiAgICAvLyAgICAgaWYgKGMuZGF0YS5tb3ZlZCkge1xuICAgIC8vICAgICAgIHRoaXMuYW5pbWF0ZShjLmVsbSwge1xuICAgIC8vICAgICAgICAgc3R5bGVzOiB7XG4gICAgLy8gICAgICAgICAgIHRyYW5zZm9ybTogJydcbiAgICAvLyAgICAgICAgIH0sXG4gICAgLy8gICAgICAgICBkdXJhdGlvbjogbW92ZURhdGEuZHVyYXRpb24gfHwgMCxcbiAgICAvLyAgICAgICAgIGRlbGF5OiBtb3ZlRGF0YS5kZWxheSB8fCAwLFxuICAgIC8vICAgICAgICAgdGltaW5nRnVuY3Rpb246IG1vdmVEYXRhLnRpbWluZ0Z1bmN0aW9uIHx8ICdsaW5lYXInXG4gICAgLy8gICAgICAgfSlcbiAgICAvLyAgICAgfVxuICAgIC8vICAgfSlcbiAgICAvLyB9KVxuICB9LFxuXG4gIG1ldGhvZHM6IHtcbiAgICBnZXRNb3ZlRGF0YTogZnVuY3Rpb24gZ2V0TW92ZURhdGEgKGNvbnRleHQsIG1vdmVDbGFzcykge1xuICAgICAgdmFyIHN0eWxlc2hlZXQgPSBjb250ZXh0LiRvcHRpb25zLnN0eWxlIHx8IHt9O1xuICAgICAgcmV0dXJuIHN0eWxlc2hlZXRbJ0BUUkFOU0lUSU9OJ10gJiYgc3R5bGVzaGVldFsnQFRSQU5TSVRJT04nXVttb3ZlQ2xhc3NdXG4gICAgfVxuICB9XG59O1xuXG4vLyBmdW5jdGlvbiBjYWxsUGVuZGluZ0NicyAoYykge1xuLy8gICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbi8vICAgaWYgKGMuZWxtLl9tb3ZlQ2IpIHtcbi8vICAgICBjLmVsbS5fbW92ZUNiKClcbi8vICAgfVxuLy8gICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbi8vICAgaWYgKGMuZWxtLl9lbnRlckNiKSB7XG4vLyAgICAgYy5lbG0uX2VudGVyQ2IoKVxuLy8gICB9XG4vLyB9XG5cbnZhciBwbGF0Zm9ybUNvbXBvbmVudHMgPSB7XG4gIFJpY2h0ZXh0OiBSaWNodGV4dCxcbiAgVHJhbnNpdGlvbjogVHJhbnNpdGlvbiQxLFxuICBUcmFuc2l0aW9uR3JvdXA6IFRyYW5zaXRpb25Hcm91cFxufTtcblxuLyogICovXG5cbi8vIFRoZXNlIHV0aWwgZnVuY3Rpb25zIGFyZSBzcGxpdCBpbnRvIGl0cyBvd24gZmlsZSBiZWNhdXNlIFJvbGx1cCBjYW5ub3QgZHJvcFxuLy8gbWFrZU1hcCgpIGR1ZSB0byBwb3RlbnRpYWwgc2lkZSBlZmZlY3RzLCBzbyB0aGVzZSB2YXJpYWJsZXMgZW5kIHVwXG4vLyBibG9hdGluZyB0aGUgd2ViIGJ1aWxkcy5cblxudmFyIGlzUmVzZXJ2ZWRUYWckMSA9IG1ha2VNYXAoXG4gICd0ZW1wbGF0ZSxzY3JpcHQsc3R5bGUsZWxlbWVudCxjb250ZW50LHNsb3QsbGluayxtZXRhLHN2Zyx2aWV3LCcgK1xuICAnYSxkaXYsaW1nLGltYWdlLHRleHQsc3BhbixpbnB1dCxzd2l0Y2gsdGV4dGFyZWEsc3Bpbm5lcixzZWxlY3QsJyArXG4gICdzbGlkZXIsc2xpZGVyLW5laWdoYm9yLGluZGljYXRvcixjYW52YXMsJyArXG4gICdsaXN0LGNlbGwsaGVhZGVyLGxvYWRpbmcsbG9hZGluZy1pbmRpY2F0b3IscmVmcmVzaCxzY3JvbGxhYmxlLHNjcm9sbGVyLCcgK1xuICAndmlkZW8sd2ViLGVtYmVkLHRhYmJhcix0YWJoZWFkZXIsZGF0ZXBpY2tlcix0aW1lcGlja2VyLG1hcnF1ZWUsY291bnRkb3duJyxcbiAgdHJ1ZVxuKTtcblxuLy8gRWxlbWVudHMgdGhhdCB5b3UgY2FuLCBpbnRlbnRpb25hbGx5LCBsZWF2ZSBvcGVuIChhbmQgd2hpY2ggY2xvc2UgdGhlbXNlbHZlcylcbi8vIG1vcmUgZmxleGlibGUgdGhhbiB3ZWJcbnZhciBjYW5CZUxlZnRPcGVuVGFnID0gbWFrZU1hcChcbiAgJ3dlYixzcGlubmVyLHN3aXRjaCx2aWRlbyx0ZXh0YXJlYSxjYW52YXMsJyArXG4gICdpbmRpY2F0b3IsbWFycXVlZSxjb3VudGRvd24nLFxuICB0cnVlXG4pO1xuXG52YXIgaXNSdW50aW1lQ29tcG9uZW50ID0gbWFrZU1hcChcbiAgJ3JpY2h0ZXh0LHRyYW5zaXRpb24sdHJhbnNpdGlvbi1ncm91cCcsXG4gIHRydWVcbik7XG5cbnZhciBpc1VuYXJ5VGFnID0gbWFrZU1hcChcbiAgJ2VtYmVkLGltZyxpbWFnZSxpbnB1dCxsaW5rLG1ldGEnLFxuICB0cnVlXG4pO1xuXG5mdW5jdGlvbiBtdXN0VXNlUHJvcCAodGFnLCB0eXBlLCBuYW1lKSB7XG4gIHJldHVybiBmYWxzZVxufVxuXG5cblxuZnVuY3Rpb24gaXNVbmtub3duRWxlbWVudCQxICh0YWcpIHtcbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIHF1ZXJ5IChlbCwgZG9jdW1lbnQpIHtcbiAgLy8gZG9jdW1lbnQgaXMgaW5qZWN0ZWQgYnkgd2VleCBmYWN0b3J5IHdyYXBwZXJcbiAgdmFyIHBsYWNlaG9sZGVyID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgncm9vdCcpO1xuICBwbGFjZWhvbGRlci5oYXNBdHRyaWJ1dGUgPSBwbGFjZWhvbGRlci5yZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoKSB7fTsgLy8gaGFjayBmb3IgcGF0Y2hcbiAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKHBsYWNlaG9sZGVyKTtcbiAgcmV0dXJuIHBsYWNlaG9sZGVyXG59XG5cbi8qICAqL1xuXG4vLyBpbnN0YWxsIHBsYXRmb3JtIHNwZWNpZmljIHV0aWxzXG5WdWUkMi5jb25maWcubXVzdFVzZVByb3AgPSBtdXN0VXNlUHJvcDtcblZ1ZSQyLmNvbmZpZy5pc1Jlc2VydmVkVGFnID0gaXNSZXNlcnZlZFRhZyQxO1xuVnVlJDIuY29uZmlnLmlzUnVudGltZUNvbXBvbmVudCA9IGlzUnVudGltZUNvbXBvbmVudDtcblZ1ZSQyLmNvbmZpZy5pc1Vua25vd25FbGVtZW50ID0gaXNVbmtub3duRWxlbWVudCQxO1xuXG4vLyBpbnN0YWxsIHBsYXRmb3JtIHJ1bnRpbWUgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50c1xuVnVlJDIub3B0aW9ucy5kaXJlY3RpdmVzID0gcGxhdGZvcm1EaXJlY3RpdmVzO1xuVnVlJDIub3B0aW9ucy5jb21wb25lbnRzID0gcGxhdGZvcm1Db21wb25lbnRzO1xuXG4vLyBpbnN0YWxsIHBsYXRmb3JtIHBhdGNoIGZ1bmN0aW9uXG5WdWUkMi5wcm90b3R5cGUuX19wYXRjaF9fID0gcGF0Y2g7XG5cbi8vIHdyYXAgbW91bnRcblZ1ZSQyLnByb3RvdHlwZS4kbW91bnQgPSBmdW5jdGlvbiAoXG4gIGVsLFxuICBoeWRyYXRpbmdcbikge1xuICByZXR1cm4gbW91bnRDb21wb25lbnQoXG4gICAgdGhpcyxcbiAgICBlbCAmJiBxdWVyeShlbCwgdGhpcy4kZG9jdW1lbnQpLFxuICAgIGh5ZHJhdGluZ1xuICApXG59O1xuXG4vLyB0aGlzIGVudHJ5IGlzIGJ1aWx0IGFuZCB3cmFwcGVkIHdpdGggYSBmYWN0b3J5IGZ1bmN0aW9uXG4vLyB1c2VkIHRvIGdlbmVyYXRlIGEgZnJlc2ggY29weSBvZiBWdWUgZm9yIGV2ZXJ5IFdlZXggaW5zdGFuY2UuXG5cbmV4cG9ydHMuVnVlID0gVnVlJDI7XG5cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuLyogICovXG5cbi8vIHRoaXMgd2lsbCBiZSBwcmVzZXJ2ZWQgZHVyaW5nIGJ1aWxkXG4vLyAkZmxvdy1kaXNhYmxlLWxpbmVcbnZhciBWdWVGYWN0b3J5ID0gcmVxdWlyZSgnLi9mYWN0b3J5Jyk7XG5cbnZhciBpbnN0YW5jZU9wdGlvbnMgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGUgaW5zdGFuY2UgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlSW5zdGFuY2VDb250ZXh0IChcbiAgaW5zdGFuY2VJZCxcbiAgcnVudGltZUNvbnRleHQsXG4gIGRhdGFcbikge1xuICBpZiAoIGRhdGEgPT09IHZvaWQgMCApIGRhdGEgPSB7fTtcblxuICB2YXIgd2VleCA9IHJ1bnRpbWVDb250ZXh0LndlZXg7XG4gIHZhciBpbnN0YW5jZSA9IGluc3RhbmNlT3B0aW9uc1tpbnN0YW5jZUlkXSA9IHtcbiAgICBpbnN0YW5jZUlkOiBpbnN0YW5jZUlkLFxuICAgIGNvbmZpZzogd2VleC5jb25maWcsXG4gICAgZG9jdW1lbnQ6IHdlZXguZG9jdW1lbnQsXG4gICAgZGF0YTogZGF0YVxuICB9O1xuXG4gIC8vIEVhY2ggaW5zdGFuY2UgaGFzIGEgaW5kZXBlbmRlbnQgYFZ1ZWAgbW9kdWxlIGluc3RhbmNlXG4gIHZhciBWdWUgPSBpbnN0YW5jZS5WdWUgPSBjcmVhdGVWdWVNb2R1bGVJbnN0YW5jZShpbnN0YW5jZUlkLCB3ZWV4KTtcblxuICAvLyBERVBSRUNBVEVEXG4gIHZhciB0aW1lckFQSXMgPSBnZXRJbnN0YW5jZVRpbWVyKGluc3RhbmNlSWQsIHdlZXgucmVxdWlyZU1vZHVsZSk7XG5cbiAgdmFyIGluc3RhbmNlQ29udGV4dCA9IE9iamVjdC5hc3NpZ24oeyBWdWU6IFZ1ZSB9LCB0aW1lckFQSXMpO1xuICBPYmplY3QuZnJlZXplKGluc3RhbmNlQ29udGV4dCk7XG4gIHJldHVybiBpbnN0YW5jZUNvbnRleHRcbn1cblxuLyoqXG4gKiBEZXN0cm95IGFuIGluc3RhbmNlIHdpdGggaWQuIEl0IHdpbGwgbWFrZSBzdXJlIGFsbCBtZW1vcnkgb2ZcbiAqIHRoaXMgaW5zdGFuY2UgcmVsZWFzZWQgYW5kIG5vIG1vcmUgbGVha3MuXG4gKi9cbmZ1bmN0aW9uIGRlc3Ryb3lJbnN0YW5jZSAoaW5zdGFuY2VJZCkge1xuICB2YXIgaW5zdGFuY2UgPSBpbnN0YW5jZU9wdGlvbnNbaW5zdGFuY2VJZF07XG4gIGlmIChpbnN0YW5jZSAmJiBpbnN0YW5jZS5hcHAgaW5zdGFuY2VvZiBpbnN0YW5jZS5WdWUpIHtcbiAgICB0cnkge1xuICAgICAgaW5zdGFuY2UuYXBwLiRkZXN0cm95KCk7XG4gICAgICBpbnN0YW5jZS5kb2N1bWVudC5kZXN0cm95KCk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgICBkZWxldGUgaW5zdGFuY2UuZG9jdW1lbnQ7XG4gICAgZGVsZXRlIGluc3RhbmNlLmFwcDtcbiAgfVxuICBkZWxldGUgaW5zdGFuY2VPcHRpb25zW2luc3RhbmNlSWRdO1xufVxuXG4vKipcbiAqIFJlZnJlc2ggYW4gaW5zdGFuY2Ugd2l0aCBpZCBhbmQgbmV3IHRvcC1sZXZlbCBjb21wb25lbnQgZGF0YS5cbiAqIEl0IHdpbGwgdXNlIGBWdWUuc2V0YCBvbiBhbGwga2V5cyBvZiB0aGUgbmV3IGRhdGEuIFNvIGl0J3MgYmV0dGVyXG4gKiBkZWZpbmUgYWxsIHBvc3NpYmxlIG1lYW5pbmdmdWwga2V5cyB3aGVuIGluc3RhbmNlIGNyZWF0ZWQuXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hJbnN0YW5jZSAoXG4gIGluc3RhbmNlSWQsXG4gIGRhdGFcbikge1xuICB2YXIgaW5zdGFuY2UgPSBpbnN0YW5jZU9wdGlvbnNbaW5zdGFuY2VJZF07XG4gIGlmICghaW5zdGFuY2UgfHwgIShpbnN0YW5jZS5hcHAgaW5zdGFuY2VvZiBpbnN0YW5jZS5WdWUpKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcigoXCJyZWZyZXNoSW5zdGFuY2U6IGluc3RhbmNlIFwiICsgaW5zdGFuY2VJZCArIFwiIG5vdCBmb3VuZCFcIikpXG4gIH1cbiAgaWYgKGluc3RhbmNlLlZ1ZSAmJiBpbnN0YW5jZS5WdWUuc2V0KSB7XG4gICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgIGluc3RhbmNlLlZ1ZS5zZXQoaW5zdGFuY2UuYXBwLCBrZXksIGRhdGFba2V5XSk7XG4gICAgfVxuICB9XG4gIC8vIEZpbmFsbHkgYHJlZnJlc2hGaW5pc2hgIHNpZ25hbCBuZWVkZWQuXG4gIGluc3RhbmNlLmRvY3VtZW50LnRhc2tDZW50ZXIuc2VuZCgnZG9tJywgeyBhY3Rpb246ICdyZWZyZXNoRmluaXNoJyB9LCBbXSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZnJlc2ggaW5zdGFuY2Ugb2YgVnVlIGZvciBlYWNoIFdlZXggaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVZ1ZU1vZHVsZUluc3RhbmNlIChcbiAgaW5zdGFuY2VJZCxcbiAgd2VleFxuKSB7XG4gIHZhciBleHBvcnRzID0ge307XG4gIFZ1ZUZhY3RvcnkoZXhwb3J0cywgd2VleC5kb2N1bWVudCk7XG4gIHZhciBWdWUgPSBleHBvcnRzLlZ1ZTtcblxuICB2YXIgaW5zdGFuY2UgPSBpbnN0YW5jZU9wdGlvbnNbaW5zdGFuY2VJZF07XG5cbiAgLy8gcGF0Y2ggcmVzZXJ2ZWQgdGFnIGRldGVjdGlvbiB0byBhY2NvdW50IGZvciBkeW5hbWljYWxseSByZWdpc3RlcmVkXG4gIC8vIGNvbXBvbmVudHNcbiAgdmFyIHdlZXhSZWdleCA9IC9ed2VleDovaTtcbiAgdmFyIGlzUmVzZXJ2ZWRUYWcgPSBWdWUuY29uZmlnLmlzUmVzZXJ2ZWRUYWcgfHwgKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KTtcbiAgdmFyIGlzUnVudGltZUNvbXBvbmVudCA9IFZ1ZS5jb25maWcuaXNSdW50aW1lQ29tcG9uZW50IHx8IChmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSk7XG4gIFZ1ZS5jb25maWcuaXNSZXNlcnZlZFRhZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuICghaXNSdW50aW1lQ29tcG9uZW50KG5hbWUpICYmIHdlZXguc3VwcG9ydHMoKFwiQGNvbXBvbmVudC9cIiArIG5hbWUpKSkgfHxcbiAgICAgIGlzUmVzZXJ2ZWRUYWcobmFtZSkgfHxcbiAgICAgIHdlZXhSZWdleC50ZXN0KG5hbWUpXG4gIH07XG4gIFZ1ZS5jb25maWcucGFyc2VQbGF0Zm9ybVRhZ05hbWUgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gbmFtZS5yZXBsYWNlKHdlZXhSZWdleCwgJycpOyB9O1xuXG4gIC8vIGV4cG9zZSB3ZWV4LXNwZWNpZmljIGluZm9cbiAgVnVlLnByb3RvdHlwZS4kaW5zdGFuY2VJZCA9IGluc3RhbmNlSWQ7XG4gIFZ1ZS5wcm90b3R5cGUuJGRvY3VtZW50ID0gaW5zdGFuY2UuZG9jdW1lbnQ7XG5cbiAgLy8gZXhwb3NlIHdlZXggbmF0aXZlIG1vZHVsZSBnZXR0ZXIgb24gc3ViVnVlIHByb3RvdHlwZSBzbyB0aGF0XG4gIC8vIHZkb20gcnVudGltZSBtb2R1bGVzIGNhbiBhY2Nlc3MgbmF0aXZlIG1vZHVsZXMgdmlhIHZub2RlLmNvbnRleHRcbiAgVnVlLnByb3RvdHlwZS4kcmVxdWlyZVdlZXhNb2R1bGUgPSB3ZWV4LnJlcXVpcmVNb2R1bGU7XG5cbiAgLy8gSGFjayBgVnVlYCBiZWhhdmlvciB0byBoYW5kbGUgaW5zdGFuY2UgaW5mb3JtYXRpb24gYW5kIGRhdGFcbiAgLy8gYmVmb3JlIHJvb3QgY29tcG9uZW50IGNyZWF0ZWQuXG4gIFZ1ZS5taXhpbih7XG4gICAgYmVmb3JlQ3JlYXRlOiBmdW5jdGlvbiBiZWZvcmVDcmVhdGUgKCkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLiRvcHRpb25zO1xuICAgICAgLy8gcm9vdCBjb21wb25lbnQgKHZtKVxuICAgICAgaWYgKG9wdGlvbnMuZWwpIHtcbiAgICAgICAgLy8gc2V0IGV4dGVybmFsIGRhdGEgb2YgaW5zdGFuY2VcbiAgICAgICAgdmFyIGRhdGFPcHRpb24gPSBvcHRpb25zLmRhdGE7XG4gICAgICAgIHZhciBpbnRlcm5hbERhdGEgPSAodHlwZW9mIGRhdGFPcHRpb24gPT09ICdmdW5jdGlvbicgPyBkYXRhT3B0aW9uKCkgOiBkYXRhT3B0aW9uKSB8fCB7fTtcbiAgICAgICAgb3B0aW9ucy5kYXRhID0gT2JqZWN0LmFzc2lnbihpbnRlcm5hbERhdGEsIGluc3RhbmNlLmRhdGEpO1xuICAgICAgICAvLyByZWNvcmQgaW5zdGFuY2UgYnkgaWRcbiAgICAgICAgaW5zdGFuY2UuYXBwID0gdGhpcztcbiAgICAgIH1cbiAgICB9LFxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uIG1vdW50ZWQgKCkge1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLiRvcHRpb25zO1xuICAgICAgLy8gcm9vdCBjb21wb25lbnQgKHZtKVxuICAgICAgaWYgKG9wdGlvbnMuZWwgJiYgd2VleC5kb2N1bWVudCAmJiBpbnN0YW5jZS5hcHAgPT09IHRoaXMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBTZW5kIFwiY3JlYXRlRmluaXNoXCIgc2lnbmFsIHRvIG5hdGl2ZS5cbiAgICAgICAgICB3ZWV4LmRvY3VtZW50LnRhc2tDZW50ZXIuc2VuZCgnZG9tJywgeyBhY3Rpb246ICdjcmVhdGVGaW5pc2gnIH0sIFtdKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBKdXN0IGluc3RhbmNlIHZhcmlhYmxlIGB3ZWV4LmNvbmZpZ2BcbiAgICogR2V0IGluc3RhbmNlIGNvbmZpZy5cbiAgICogQHJldHVybiB7b2JqZWN0fVxuICAgKi9cbiAgVnVlLnByb3RvdHlwZS4kZ2V0Q29uZmlnID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChpbnN0YW5jZS5hcHAgaW5zdGFuY2VvZiBWdWUpIHtcbiAgICAgIHJldHVybiBpbnN0YW5jZS5jb25maWdcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIFZ1ZVxufVxuXG4vKipcbiAqIERFUFJFQ0FURURcbiAqIEdlbmVyYXRlIEhUTUw1IFRpbWVyIEFQSXMuIEFuIGltcG9ydGFudCBwb2ludCBpcyB0aGF0IHRoZSBjYWxsYmFja1xuICogd2lsbCBiZSBjb252ZXJ0ZWQgaW50byBjYWxsYmFjayBpZCB3aGVuIHNlbnQgdG8gbmF0aXZlLiBTbyB0aGVcbiAqIGZyYW1ld29yayBjYW4gbWFrZSBzdXJlIG5vIHNpZGUgZWZmZWN0IG9mIHRoZSBjYWxsYmFjayBoYXBwZW5lZCBhZnRlclxuICogYW4gaW5zdGFuY2UgZGVzdHJveWVkLlxuICovXG5mdW5jdGlvbiBnZXRJbnN0YW5jZVRpbWVyIChcbiAgaW5zdGFuY2VJZCxcbiAgbW9kdWxlR2V0dGVyXG4pIHtcbiAgdmFyIGluc3RhbmNlID0gaW5zdGFuY2VPcHRpb25zW2luc3RhbmNlSWRdO1xuICB2YXIgdGltZXIgPSBtb2R1bGVHZXR0ZXIoJ3RpbWVyJyk7XG4gIHZhciB0aW1lckFQSXMgPSB7XG4gICAgc2V0VGltZW91dDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbXSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHdoaWxlICggbGVuLS0gKSBhcmdzWyBsZW4gXSA9IGFyZ3VtZW50c1sgbGVuIF07XG5cbiAgICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBhcmdzWzBdLmFwcGx5KGFyZ3MsIGFyZ3Muc2xpY2UoMikpO1xuICAgICAgfTtcblxuICAgICAgdGltZXIuc2V0VGltZW91dChoYW5kbGVyLCBhcmdzWzFdKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZS5kb2N1bWVudC50YXNrQ2VudGVyLmNhbGxiYWNrTWFuYWdlci5sYXN0Q2FsbGJhY2tJZC50b1N0cmluZygpXG4gICAgfSxcbiAgICBzZXRJbnRlcnZhbDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbXSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHdoaWxlICggbGVuLS0gKSBhcmdzWyBsZW4gXSA9IGFyZ3VtZW50c1sgbGVuIF07XG5cbiAgICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBhcmdzWzBdLmFwcGx5KGFyZ3MsIGFyZ3Muc2xpY2UoMikpO1xuICAgICAgfTtcblxuICAgICAgdGltZXIuc2V0SW50ZXJ2YWwoaGFuZGxlciwgYXJnc1sxXSk7XG4gICAgICByZXR1cm4gaW5zdGFuY2UuZG9jdW1lbnQudGFza0NlbnRlci5jYWxsYmFja01hbmFnZXIubGFzdENhbGxiYWNrSWQudG9TdHJpbmcoKVxuICAgIH0sXG4gICAgY2xlYXJUaW1lb3V0OiBmdW5jdGlvbiAobikge1xuICAgICAgdGltZXIuY2xlYXJUaW1lb3V0KG4pO1xuICAgIH0sXG4gICAgY2xlYXJJbnRlcnZhbDogZnVuY3Rpb24gKG4pIHtcbiAgICAgIHRpbWVyLmNsZWFySW50ZXJ2YWwobik7XG4gICAgfVxuICB9O1xuICByZXR1cm4gdGltZXJBUElzXG59XG5cbmV4cG9ydHMuY3JlYXRlSW5zdGFuY2VDb250ZXh0ID0gY3JlYXRlSW5zdGFuY2VDb250ZXh0O1xuZXhwb3J0cy5kZXN0cm95SW5zdGFuY2UgPSBkZXN0cm95SW5zdGFuY2U7XG5leHBvcnRzLnJlZnJlc2hJbnN0YW5jZSA9IHJlZnJlc2hJbnN0YW5jZTtcbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgc2V0dXAgZnJvbSAnLi9zZXR1cCdcbmltcG9ydCAqIGFzIFZ1ZSBmcm9tICd3ZWV4LXZ1ZS1mcmFtZXdvcmsnXG5cbnNldHVwKHsgVnVlIH0pXG4iXSwibmFtZXMiOlsiRWxlbWVudCIsImluaXQiLCJzZXJ2aWNlcyIsImluaXRUYXNrSGFuZGxlciIsIkJyb2FkY2FzdENoYW5uZWwiLCJWdWVGYWN0b3J5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCQSxJQUFJLFdBQVcsR0FBRyxFQUFDO0FBQ25CLEFBQU8sU0FBUyxRQUFRLElBQUk7RUFDMUIsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLFFBQVEsRUFBRTtDQUNsQzs7QUFFRCxBQUFPLFNBQVMsS0FBSyxFQUFFLENBQUMsRUFBRTtFQUN4QixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDO0VBQzNDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Q0FDcEM7O0FBRUQsQUFBTyxTQUFTLGNBQWMsRUFBRSxNQUFNLEVBQUU7RUFDdEMsSUFBSSxPQUFPLElBQUksS0FBSyxVQUFVLEVBQUU7SUFDOUIsT0FBTyxFQUFFO0dBQ1Y7RUFDRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJO0lBQ3JDLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQztJQUN0QixJQUFJLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7R0FDbEMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDO0VBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0NBQ3BCOztBQUVELEFBQU8sU0FBUyxj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QVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7Ozs7O0FBSzlDLElBQUksUUFBUSxHQUFHLFVBQVUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDOzs7Ozs7Ozs7OztBQVcxQyxTQUFTLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ3pCLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxFQUFFO0VBQzVCLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM1QixJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDNUIsSUFBSSxTQUFTLElBQUksU0FBUyxFQUFFO0lBQzFCLElBQUk7TUFDRixJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2hDLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDaEMsSUFBSSxRQUFRLElBQUksUUFBUSxFQUFFO1FBQ3hCLE9BQU8sQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1VBQ3RELE9BQU8sVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDM0IsQ0FBQztPQUNILE1BQU0sSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNqQyxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNCLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsT0FBTyxLQUFLLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssQ0FB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
