(this.nativeLog || function(s) {console.log(s)})('Weex JS Framework 0.24.0, Build 2018-01-05 12:20. (Rax: 0.4.20)');
;(this.getJSFMVersion = function(){return "0.24.0"});
var global = this; var process = {env:{}}; var setTimeout = global.setTimeout;

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

var subversion = {"framework":"0.24.0","transformer":">=0.1.5 <0.5"};

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
    this.classList = props.classList || [];
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
   * TODO: deprecated
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
   * Set class list.
   * @param {array} classList
   */
  // setClassList (classList) {
  //   const classes = typeof classList === 'string'
  //     ? classList.split(/\s+/)
  //     : Array.from(classList)
  //   if (Array.isArray(classes) && classes.length > 0) {
  //     this.classList = classes
  //     const taskCenter = getTaskCenter(this.docId)
  //     if (taskCenter) {
  //       taskCenter.send(
  //         'dom',
  //         { action: 'updateClassList' },
  //         [this.ref, this.classList.slice()]
  //       )
  //     }
  //   }
  // }

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
      type: this.type
    };
    if (!isEmpty(this.attr)) {
      result.attr = this.attr;
    }
    if (this.classList.length > 0) {
      result.classList = this.classList.slice();
    }
    const style = this.toStyle();
    if (!isEmpty(style)) {
      result.style = style;
    }
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
    registerStyleSheets: global.callRegisterStyleSheets,
    addElement: global.callAddElement,
    removeElement: global.callRemoveElement,
    moveElement: global.callMoveElement,
    updateAttrs: global.callUpdateAttrs,
    updateStyle: global.callUpdateStyle,
    updateClassList: global.callUpdateClassList,

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
  * Register StyleSheets.
  * @param {string} scopeId
  * @return {array<object>} styleSheets
  */
  // registerStyleSheets (scopeId, styleSheets) {
  //   const sheets = Array.isArray(styleSheets) ? styleSheets : [styleSheets]
  //   if (this.taskCenter && sheets.length) {
  //     return this.taskCenter.send(
  //       'dom',
  //       { action: 'registerStyleSheets' },
  //       [scopeId, sheets]
  //     )
  //   }
  // }

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

var framework_weex = createCommonjsModule(function (module) {
module.exports = /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!***********************************************************************************************************************!*\
  !*** ./packages/weex-rax-framework/node_modules/.npminstall/event-target-shim/2.0.0/event-target-shim/lib/commons.js ***!
  \***********************************************************************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var createUniqueKey = module.exports.createUniqueKey = (
    typeof Symbol !== "undefined" ? Symbol : //eslint-disable-line no-undef
    /* otherwise */ function createUniqueKey(name) {
        return "[[" + name + "_" + Math.random().toFixed(8).slice(2) + "]]"
    }
);

/**
 * Checks whether the given value is a non-null object or not.
 *
 * @param {any} x - The value to be check.
 * @returns {boolean} `true` if the value is a non-null object.
 * @private
 */
var isObject = module.exports.isObject = function isObject(x) {
    return typeof x === "object" && x !== null
};

/**
 * The key of listeners.
 *
 * @type {symbol|string}
 * @private
 */
module.exports.LISTENERS = createUniqueKey("listeners");

/**
 * A value of kind for listeners which are registered in the capturing phase.
 *
 * @type {number}
 * @private
 */
module.exports.CAPTURE = 1;

/**
 * A value of kind for listeners which are registered in the bubbling phase.
 *
 * @type {number}
 * @private
 */
module.exports.BUBBLE = 2;

/**
 * A value of kind for listeners which are registered as an attribute.
 *
 * @type {number}
 * @private
 */
module.exports.ATTRIBUTE = 3;

/**
 * @typedef object ListenerNode
 * @property {function} listener - A listener function.
 * @property {number} kind - The kind of the listener.
 * @property {ListenerNode|null} next - The next node.
 *      If this node is the last, this is `null`.
 */

/**
 * Creates a node of singly linked list for a list of listeners.
 *
 * @param {function} listener - A listener function.
 * @param {number} kind - The kind of the listener.
 * @param {object} [options] - The option object.
 * @param {boolean} [options.once] - The flag to remove the listener at the first call.
 * @param {boolean} [options.passive] - The flag to ignore `event.preventDefault` method.
 * @returns {ListenerNode} The created listener node.
 */
module.exports.newNode = function newNode(listener, kind, options) {
    var obj = isObject(options);

    return {
        listener: listener,
        kind: kind,
        once: obj && Boolean(options.once),
        passive: obj && Boolean(options.passive),
        next: null,
    }
};


/***/ }),
/* 1 */
/*!****************************************************!*\
  !*** ./packages/weex-rax-framework/src/emitter.js ***!
  \****************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventEmitter = function () {
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this._listeners = {};
  }

  /**
   * Adds a listener function to the specified event.
   * @param {String} type
   * @param {Function} listener
   * @param {Boolean} once
   */


  _createClass(EventEmitter, [{
    key: "_addListener",
    value: function _addListener(type, listener, once) {
      this._listeners[type] = this._listeners[type] || [];
      this._listeners[type].push({ listener: listener, once: once });
      return this;
    }

    /**
     * Adds a listener function to the specified event.
     * @param {String} type
     * @param {Function} listener
     * @return {Object} Current instance of EventEmitter for chaining.
     */

  }, {
    key: "on",
    value: function on(type, listener) {
      return this._addListener(type, listener, false);
    }
  }, {
    key: "once",
    value: function once(type, listener) {
      return this._addListener(type, listener, true);
    }

    /**
     * Removes a listener function to the specified event.
     * @param {String} type
     * @param {Function} listener
     * @return {Object} Current instance of EventEmitter for chaining.
     */

  }, {
    key: "off",
    value: function off(type, listener) {
      // alias
      if (!this._listeners[type]) {
        return this;
      }
      if (!this._listeners[type].length) {
        return this;
      }
      if (!listener) {
        delete this._listeners[type];
        return this;
      }
      this._listeners[type] = this._listeners[type].filter(function (_listener) {
        return !(_listener.listener === listener);
      });
      return this;
    }

    /**
     * Emits an specified event.
     * @param {String} type
     * @param {Object} payload
     * @return {Object} Current instance of EventEmitter for chaining.
     */

  }, {
    key: "emit",
    value: function emit(type, payload) {
      var _this = this;

      if (!this._listeners[type]) {
        return this;
      }
      this._listeners[type].forEach(function (_listener) {
        _listener.listener.apply(_this, [payload]);
        if (_listener.once) {
          _this.removeListener(type, _listener.listener);
        }
      });
      return this;
    }
  }]);

  return EventEmitter;
}();

exports.default = EventEmitter;
module.exports = exports["default"];

/***/ }),
/* 2 */
/*!****************************************************************************************************************************!*\
  !*** ./packages/weex-rax-framework/node_modules/.npminstall/event-target-shim/2.0.0/event-target-shim/lib/event-target.js ***!
  \****************************************************************************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var Commons = __webpack_require__(/*! ./commons */ 0);
var CustomEventTarget = __webpack_require__(/*! ./custom-event-target */ 15);
var EventWrapper = __webpack_require__(/*! ./event-wrapper */ 16);
var isObject = Commons.isObject;
var LISTENERS = Commons.LISTENERS;
var CAPTURE = Commons.CAPTURE;
var BUBBLE = Commons.BUBBLE;
var ATTRIBUTE = Commons.ATTRIBUTE;
var newNode = Commons.newNode;
var defineCustomEventTarget = CustomEventTarget.defineCustomEventTarget;
var createEventWrapper = EventWrapper.createEventWrapper;
var STOP_IMMEDIATE_PROPAGATION_FLAG = EventWrapper.STOP_IMMEDIATE_PROPAGATION_FLAG;
var PASSIVE_LISTENER_FLAG = EventWrapper.PASSIVE_LISTENER_FLAG;

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

/**
 * A flag which shows there is the native `EventTarget` interface object.
 *
 * @type {boolean}
 * @private
 */
var HAS_EVENTTARGET_INTERFACE = (
    typeof window !== "undefined" &&
    typeof window.EventTarget !== "undefined"
);

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * An implementation for `EventTarget` interface.
 *
 * @constructor
 * @public
 */
var EventTarget = module.exports = function EventTarget() {
    if (this instanceof EventTarget) {
        // this[LISTENERS] is a Map.
        // Its key is event type.
        // Its value is ListenerNode object or null.
        //
        // interface ListenerNode {
        //     var listener: Function
        //     var kind: CAPTURE|BUBBLE|ATTRIBUTE
        //     var next: ListenerNode|null
        // }
        Object.defineProperty(this, LISTENERS, {value: Object.create(null)});
    }
    else if (arguments.length === 1 && Array.isArray(arguments[0])) {
        return defineCustomEventTarget(EventTarget, arguments[0])
    }
    else if (arguments.length > 0) {
        var types = Array(arguments.length);
        for (var i = 0; i < arguments.length; ++i) {
            types[i] = arguments[i];
        }

        // To use to extend with attribute listener properties.
        // e.g.
        //     class MyCustomObject extends EventTarget("message", "error") {
        //         //...
        //     }
        return defineCustomEventTarget(EventTarget, types)
    }
    else {
        throw new TypeError("Cannot call a class as a function")
    }
};

EventTarget.prototype = Object.create(
    (HAS_EVENTTARGET_INTERFACE ? window.EventTarget : Object).prototype,
    {
        constructor: {
            value: EventTarget,
            writable: true,
            configurable: true,
        },

        addEventListener: {
            value: function addEventListener(type, listener, options) {
                if (listener == null) {
                    return false
                }
                if (typeof listener !== "function" && typeof listener !== "object") {
                    throw new TypeError("\"listener\" is not an object.")
                }

                var capture = isObject(options) ? Boolean(options.capture) : Boolean(options);
                var kind = (capture ? CAPTURE : BUBBLE);
                var node = this[LISTENERS][type];
                if (node == null) {
                    this[LISTENERS][type] = newNode(listener, kind, options);
                    return true
                }

                var prev = null;
                while (node != null) {
                    if (node.listener === listener && node.kind === kind) {
                        // Should ignore a duplicated listener.
                        return false
                    }
                    prev = node;
                    node = node.next;
                }

                prev.next = newNode(listener, kind, options);
                return true
            },
            configurable: true,
            writable: true,
        },

        removeEventListener: {
            value: function removeEventListener(type, listener, options) {
                if (listener == null) {
                    return false
                }

                var capture = isObject(options) ? Boolean(options.capture) : Boolean(options);
                var kind = (capture ? CAPTURE : BUBBLE);
                var prev = null;
                var node = this[LISTENERS][type];
                while (node != null) {
                    if (node.listener === listener && node.kind === kind) {
                        if (prev == null) {
                            this[LISTENERS][type] = node.next;
                        }
                        else {
                            prev.next = node.next;
                        }
                        return true
                    }

                    prev = node;
                    node = node.next;
                }

                return false
            },
            configurable: true,
            writable: true,
        },

        dispatchEvent: {
            value: function dispatchEvent(event) {
                // If listeners aren't registered, terminate.
                var type = event.type;
                var node = this[LISTENERS][type];
                if (node == null) {
                    return true
                }

                // Since we cannot rewrite several properties, so wrap object.
                var wrapped = createEventWrapper(event, this);

                // This doesn't process capturing phase and bubbling phase.
                // This isn't participating in a tree.
                var prev = null;
                while (node != null) {
                    // Remove this listener if it's once
                    if (node.once) {
                        if (prev == null) {
                            this[LISTENERS][type] = node.next;
                        }
                        else {
                            prev.next = node.next;
                        }
                    }
                    else {
                        prev = node;
                    }

                    // Call this listener
                    wrapped[PASSIVE_LISTENER_FLAG] = node.passive;
                    if (typeof node.listener === "function") {
                        node.listener.call(this, wrapped);
                    }
                    else if (node.kind !== ATTRIBUTE && typeof node.listener.handleEvent === "function") {
                        node.listener.handleEvent(wrapped);
                    }

                    // Break if `event.stopImmediatePropagation` was called.
                    if (wrapped[STOP_IMMEDIATE_PROPAGATION_FLAG]) {
                        break
                    }

                    node = node.next;
                }

                return !wrapped.defaultPrevented
            },
            configurable: true,
            writable: true,
        },
    }
);


/***/ }),
/* 3 */
/*!**************************************************!*\
  !*** ./packages/weex-rax-framework/src/index.js ***!
  \**************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.getInstance = getInstance;
exports.init = init;
exports.registerComponents = registerComponents;
exports.registerMethods = registerMethods;
exports.registerModules = registerModules;
exports.createInstance = createInstance;
exports.refreshInstance = refreshInstance;
exports.destroyInstance = destroyInstance;
exports.getRoot = getRoot;
exports.receiveTasks = receiveTasks;

var _builtin = __webpack_require__(/*! ./builtin */ 4);

var _emitter = __webpack_require__(/*! ./emitter */ 1);

var _emitter2 = _interopRequireDefault(_emitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NativeComponents = {};
var NativeModules = {};

var Document = void 0;
var Element = void 0;
var Comment = void 0;

var MODULE_NAME_PREFIX = '@weex-module/';
var MODAL_MODULE = MODULE_NAME_PREFIX + 'modal';
var NAVIGATOR_MODULE = MODULE_NAME_PREFIX + 'navigator';
// Instance hub
var instances = {};
// Bundles hub
var bundles = {};
var noop = function noop() {};

function dispatchEventToInstance(event, targetOrigin) {
  var instance;
  for (var i in instances) {
    if (instances.hasOwnProperty(i)) {
      instance = instances[i];
      if (targetOrigin === '*' || targetOrigin === instance.origin) {
        event.target = instance.window;
        // FIXME: Need async?
        instance.window.dispatchEvent(event);
      }
    }
  }
}

function getInstance(instanceId) {
  var instance = instances[instanceId];
  if (!instance) {
    throw new Error('Invalid instance id "' + instanceId + '"');
  }
  return instance;
}

function init(config) {
  Document = config.Document;
  Element = config.Element;
  Comment = config.Comment;
}

/**
 * register the name of each native component
 * @param  {array} components array of name
 */
function registerComponents(components) {
  if (Array.isArray(components)) {
    components.forEach(function register(name) {
      /* istanbul ignore if */
      if (!name) {
        return;
      }
      if (typeof name === 'string') {
        NativeComponents[name] = true;
      } else if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object' && typeof name.type === 'string') {
        NativeComponents[name.type] = name;
      }
    });
  }
}

function __weex_module_supports__(name) {
  var parts = name.split('.');
  if (parts.length === 1) {
    return Boolean(NativeModules[name]);
  } else {
    var moduleName = parts[0];
    var methodName = parts[1];
    var moduleMethods = NativeModules[moduleName];

    if (moduleMethods) {
      for (var i = 0; i < moduleMethods.length; i++) {
        var method = moduleMethods[i];
        if ((typeof method === 'undefined' ? 'undefined' : _typeof(method)) === 'object' && method.name === methodName || method === methodName) {
          return true;
        }
      }
    }

    return false;
  }
}

function __weex_tag_supports__(name) {
  return Boolean(NativeComponents[name]);
}

/**
 * register the name and methods of each api
 * @param  {object} apis a object of apis
 */
function registerMethods(apis) {}
// Noop


/**
 * register the name and methods of each module
 * @param  {object} modules a object of modules
 */
function registerModules(newModules) {
  if ((typeof newModules === 'undefined' ? 'undefined' : _typeof(newModules)) === 'object') {
    for (var name in newModules) {
      if (Object.prototype.hasOwnProperty.call(newModules, name)) {
        NativeModules[name] = newModules[name];
      }
    }
  }
}

function genBuiltinModules(modules, moduleFactories, context) {
  for (var moduleName in moduleFactories) {
    modules[moduleName] = {
      factory: moduleFactories[moduleName].bind(context),
      module: { exports: {} },
      isInitialized: false
    };
  }
  return modules;
}

function genNativeModules(modules, document) {
  if ((typeof NativeModules === 'undefined' ? 'undefined' : _typeof(NativeModules)) === 'object') {
    var _loop = function _loop(name) {
      var moduleName = MODULE_NAME_PREFIX + name;
      modules[moduleName] = {
        module: { exports: {} },
        isInitialized: true
      };

      NativeModules[name].forEach(function (method) {
        if (typeof method === 'string') {
          method = {
            name: method
          };
        }
        var methodName = method.name;

        modules[moduleName].module.exports[methodName] = function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          var options = {};
          var lastArg = args[args.length - 1];
          if (lastArg && (typeof lastArg === 'undefined' ? 'undefined' : _typeof(lastArg)) === 'object' && lastArg.__weex_options__) {
            options = lastArg.__weex_options__;
            // Remove the last in args
            args.pop();
          }
          // https://github.com/alibaba/weex/issues/1677
          return document.taskCenter.send('module', {
            module: name,
            method: methodName
          }, args, options);
        };
      });
    };

    for (var name in NativeModules) {
      _loop(name);
    }
  }

  return modules;
}

/**
 * create a Weex instance
 *
 * @param  {string} instanceId
 * @param  {string} __weex_code__
 * @param  {object} [__weex_options__] {bundleUrl, debug}
 */
function createInstance(instanceId, __weex_code__, __weex_options__, __weex_data__, __weex_config__) {
  var instance = instances[instanceId];
  if (instance == undefined) {
    // Mark start time
    var responseEnd = Date.now();
    var __weex_env__ = (typeof WXEnvironment === 'undefined' ? 'undefined' : _typeof(WXEnvironment)) === 'object' && WXEnvironment || {};
    // For better performance use built-in promise first
    var shared = __webpack_require__(/*! runtime-shared/dist/shared.function */ 6)();

    var _Promise = typeof _Promise === 'function' ? _Promise : shared.Promise;
    var _Symbol = typeof _Symbol === 'function' ? _Symbol : shared.Symbol;
    var _Set = typeof _Set === 'function' ? _Set : shared.Set;
    var _Map = typeof _Map === 'function' ? _Map : shared.Map;
    var _WeakMap = typeof _WeakMap === 'function' ? _WeakMap : shared.WeakMap;
    var _WeakSet = typeof _WeakSet === 'function' ? _WeakSet : shared.WeakSet;
    var URL = shared.URL,
        URLSearchParams = shared.URLSearchParams,
        FontFace = shared.FontFace,
        matchMedia = shared.matchMedia;

    var bundleUrl = __weex_options__.bundleUrl || 'about:blank';

    if (!__weex_options__.bundleUrl) {
      console.error('Error: Must have bundleUrl option when createInstance, downgrade to "about:blank".');
    } else if (!bundleUrl.split('//')[0]) {
      bundleUrl = 'https:' + bundleUrl;
    }

    var document = new Document(instanceId, bundleUrl);
    var documentURL = new URL(bundleUrl);
    var modules = {};

    instance = instances[instanceId] = {
      document: document,
      instanceId: instanceId,
      bundleUrl: bundleUrl,
      bundleCode: __weex_code__,
      modules: modules,
      origin: documentURL.origin,
      uid: 0
    };

    // Generate native modules map at instance init
    genNativeModules(modules, document);
    var __weex_define__ = __webpack_require__(/*! ./define.weex */ 7)(modules);
    var __weex_require__ = __webpack_require__(/*! ./require.weex */ 8)(modules);
    var __weex_downgrade__ = __webpack_require__(/*! ./downgrade.weex */ 9)(__weex_require__);
    // Extend document
    __webpack_require__(/*! ./document.weex */ 11)(__weex_require__, document);

    var location = __webpack_require__(/*! ./location.weex */ 12)(__weex_require__, documentURL);

    var _require = __webpack_require__(/*! ./fetch.weex */ 13)(__weex_require__, _Promise),
        fetch = _require.fetch,
        Headers = _require.Headers,
        Request = _require.Request,
        Response = _require.Response;

    var XMLHttpRequest = __webpack_require__(/*! ./xmlhttprequest.weex */ 14)(__weex_require__);
    var WebSocket = __webpack_require__(/*! ./websocket.weex */ 17)(__weex_require__);

    var _require2 = __webpack_require__(/*! ./timer.weex */ 18)(__weex_require__, document),
        setTimeout = _require2.setTimeout,
        clearTimeout = _require2.clearTimeout,
        setInterval = _require2.setInterval,
        clearInterval = _require2.clearInterval,
        requestAnimationFrame = _require2.requestAnimationFrame,
        cancelAnimationFrame = _require2.cancelAnimationFrame;

    var _require3 = __webpack_require__(/*! ./base64.weex */ 19)(),
        atob = _require3.atob,
        btoa = _require3.btoa;

    var performance = __webpack_require__(/*! ./performance.weex */ 20)(responseEnd);

    var _require4 = __webpack_require__(/*! ./event.weex */ 21)(),
        Event = _require4.Event,
        CustomEvent = _require4.CustomEvent;

    var windowEmitter = new _emitter2.default();

    var window = {
      // ES
      Promise: _Promise,
      Symbol: _Symbol,
      Map: _Map,
      Set: _Set,
      WeakMap: _WeakMap,
      WeakSet: _WeakSet,
      // W3C: https://www.w3.org/TR/html5/browsers.html#browsing-context-name
      name: '',
      // This read-only property indicates whether the referenced window is closed or not.
      closed: false,
      atob: atob,
      btoa: btoa,
      performance: performance,
      // W3C
      document: document,
      location: location,
      // https://www.w3.org/TR/2009/WD-html5-20090423/browsers.html#dom-navigator
      navigator: {
        product: 'Weex',
        platform: __weex_env__.platform,
        appName: __weex_env__.appName,
        appVersion: __weex_env__.appVersion,
        // Weex/0.12 iOS/9.3 (iPhone7,2) AppName/0.12
        userAgent: 'Weex/' + __weex_env__.weexVersion + ' ' + __weex_env__.platform + '/' + __weex_env__.osVersion + ' (' + __weex_env__.deviceModel + ') ' + __weex_env__.appName + '/' + __weex_env__.appVersion
      },
      // https://drafts.csswg.org/cssom-view/#the-screen-interface
      screen: {
        width: __weex_env__.deviceWidth,
        height: __weex_env__.deviceHeight,
        availWidth: __weex_env__.deviceWidth,
        availHeight: __weex_env__.deviceHeight,
        colorDepth: 24,
        pixelDepth: 24
      },
      devicePixelRatio: __weex_env__.scale,
      fetch: fetch,
      Headers: Headers,
      Response: Response,
      Request: Request,
      XMLHttpRequest: XMLHttpRequest,
      URL: URL,
      URLSearchParams: URLSearchParams,
      FontFace: FontFace,
      WebSocket: WebSocket,
      Event: Event,
      CustomEvent: CustomEvent,
      matchMedia: matchMedia,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      requestAnimationFrame: requestAnimationFrame,
      cancelAnimationFrame: cancelAnimationFrame,
      alert: function alert(message) {
        var modal = __weex_require__(MODAL_MODULE);
        modal.alert({
          message: message
        }, function () {});
      },
      open: function open(url) {
        var weexNavigator = __weex_require__(NAVIGATOR_MODULE);
        weexNavigator.push({
          url: url,
          animated: true
        }, noop);
      },
      close: function close() {
        var weexNavigator = __weex_require__(NAVIGATOR_MODULE);
        weexNavigator.close({
          animated: true
        }, noop, noop);
      },
      postMessage: function postMessage(message, targetOrigin) {
        var event = {
          origin: location.origin,
          data: JSON.parse(JSON.stringify(message)),
          type: 'message',
          source: window // FIXME: maybe not export window
        };
        dispatchEventToInstance(event, targetOrigin);
      },
      addEventListener: function addEventListener(type, listener) {
        windowEmitter.on(type, listener);
      },
      removeEventListener: function removeEventListener(type, listener) {
        windowEmitter.off(type, listener);
      },
      dispatchEvent: function dispatchEvent(e) {
        windowEmitter.emit(e.type, e);
      },
      // ModuleJS
      define: __weex_define__,
      require: __weex_require__,
      // Weex
      __weex_document__: document,
      __weex_module_supports__: __weex_module_supports__,
      __weex_tag_supports__: __weex_tag_supports__,
      __weex_define__: __weex_define__,
      __weex_require__: __weex_require__,
      __weex_downgrade__: __weex_downgrade__,
      __weex_env__: __weex_env__,
      __weex_code__: __weex_code__,
      __weex_options__: __weex_options__,
      __weex_data__: __weex_data__,
      __weex_config__: __weex_config__
    };

    instance.window = window.self = window.window = window;

    var builtinGlobals = {};
    var builtinModules = {};
    try {
      builtinGlobals = __weex_config__.services.builtinGlobals;
      // Modules should wrap as module factory format
      builtinModules = __weex_config__.services.builtinModules;
    } catch (e) {}

    Object.assign(window, builtinGlobals);

    var moduleFactories = _extends({}, _builtin.ModuleFactories, builtinModules);
    genBuiltinModules(modules, moduleFactories, window);
    // In weex iOS or Android
    if (__weex_env__.platform !== 'Web') {
      var timing = performance.timing;
      timing.domLoading = Date.now();

      // Use the cached init function, if existed in bundles
      var _init = bundles[__weex_code__] ? bundles[__weex_code__] : new Function('with(this){(function(){"use strict";\n' + __weex_code__ + '\n}).call(this)}');

      _init.call(
      // Context is window
      window);

      timing.domInteractive = timing.domComplete = timing.domInteractive = Date.now();

      // Cache the init function
      bundles[__weex_code__] = _init;
    } else {
      // In weex h5
      var _init2 = new Function('"use strict";\n' + __weex_code__);

      _init2.call(window);
    }
  } else {
    throw new Error('Instance id "' + instanceId + '" existed when create instance');
  }
}

/**
 * refresh a Weex instance
 *
 * @param  {string} instanceId
 * @param  {object} data
 */
function refreshInstance(instanceId, data) {
  var instance = getInstance(instanceId);
  var document = instance.document;
  document.documentElement.fireEvent('refresh', {
    timestamp: Date.now(),
    data: data
  });
  document.taskCenter.send('dom', { action: 'refreshFinish' }, []);
}

/**
 * destroy a Weex instance
 * @param  {string} instanceId
 */
function destroyInstance(instanceId) {
  var instance = getInstance(instanceId);
  var bundleCode = instance.bundleCode;
  instance.window.closed = true;

  var document = instance.document;
  document.documentElement.fireEvent('destory', {
    timestamp: Date.now()
  });

  if (document.destroy) {
    document.destroy();
  }

  if (document.taskCenter && document.taskCenter.destroyCallback) {
    document.taskCenter.destroyCallback();
  }

  delete instances[instanceId];
  delete bundles[bundleCode];
}

/**
 * get a whole element tree of an instance
 * for debugging
 * @param  {string} instanceId
 * @return {object} a virtual dom tree
 */
function getRoot(instanceId) {
  var instance = getInstance(instanceId);
  var document = instance.document;
  return document.toJSON ? document.toJSON() : {};
}

function fireEvent(doc, ref, type, e, domChanges, params) {
  if (Array.isArray(ref)) {
    ref.some(function (ref) {
      return fireEvent(doc, ref, type, e) !== false;
    });
    return;
  }

  var el = doc.getRef(ref);

  if (el) {
    var result = doc.fireEvent(el, type, e, domChanges, params);
    return result;
  }

  return new Error('Invalid element reference "' + ref + '"');
}

/**
 * accept calls from native (event or callback)
 *
 * @param  {string} instanceId
 * @param  {array} tasks list with `method` and `args`
 */
function receiveTasks(instanceId, tasks) {
  var instance = getInstance(instanceId);
  if (Array.isArray(tasks)) {
    var document = instance.document;

    var results = [];
    tasks.forEach(function (task) {
      var result = void 0;
      if (task.method === 'fireEvent') {
        var _task$args = _slicedToArray(task.args, 5),
            nodeId = _task$args[0],
            type = _task$args[1],
            data = _task$args[2],
            domChanges = _task$args[3],
            params = _task$args[4];

        result = fireEvent(document, nodeId, type, data, domChanges, params);
      } else if (task.method === 'callback') {
        var _task$args2 = _slicedToArray(task.args, 3),
            uid = _task$args2[0],
            _data = _task$args2[1],
            ifKeepAlive = _task$args2[2];

        result = document.taskCenter.callback(uid, _data, ifKeepAlive);
      }
      results.push(result);
    });
    return results;
  }
}

// FIXME: Hack for rollup build "import Rax from 'weex-rax-framework'", in rollup if `module.exports` has `__esModule` key must return by export default
exports.default = exports;

/***/ }),
/* 4 */
/*!****************************************************!*\
  !*** ./packages/weex-rax-framework/src/builtin.js ***!
  \****************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ModuleFactories = exports.ModuleFactories = {
  'rax': __webpack_require__(/*! rax/dist/rax.factory */ 5)
};

/***/ }),
/* 5 */
/*!******************************************!*\
  !*** ./packages/rax/dist/rax.factory.js ***!
  \******************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

module.exports = function(require, exports, module) {
  var __weex_document__ = this["__weex_document__"];
var document = this["document"];
  module.exports = /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 17);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
/*
 * Stateful things in runtime
 */
exports.default = {
  component: null,
  mountID: 1,
  sandbox: true,
  // Roots
  rootComponents: {},
  rootInstances: {},
  // Inject
  hook: null,
  driver: null,
  monitor: null
};
module.exports = exports["default"];

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

var _element = __webpack_require__(6);

var _unmountComponentAtNode = __webpack_require__(9);

var _unmountComponentAtNode2 = _interopRequireDefault(_unmountComponentAtNode);

var _instantiateComponent = __webpack_require__(2);

var _instantiateComponent2 = _interopRequireDefault(_instantiateComponent);

var _shouldUpdateComponent = __webpack_require__(3);

var _shouldUpdateComponent2 = _interopRequireDefault(_shouldUpdateComponent);

var _root = __webpack_require__(19);

var _root2 = _interopRequireDefault(_root);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Instance manager
 */
var KEY = '$$instance';

exports.default = {
  set: function set(node, instance) {
    if (!node[KEY]) {
      node[KEY] = instance;
      // Record root instance to roots map
      if (instance.rootID) {
        _host2.default.rootInstances[instance.rootID] = instance;
        _host2.default.rootComponents[instance.rootID] = instance._internal;
      }
    }
  },
  get: function get(node) {
    return node[KEY];
  },
  remove: function remove(node) {
    var instance = this.get(node);
    if (instance) {
      node[KEY] = null;
      if (instance.rootID) {
        delete _host2.default.rootComponents[instance.rootID];
        delete _host2.default.rootInstances[instance.rootID];
      }
    }
  },
  mount: function mount(element, container, parentInstance) {
    _host2.default.driver.beforeRender && _host2.default.driver.beforeRender();

    // Real native root node is body
    if (container == null) {
      container = _host2.default.driver.createBody();
    }

    // Get the context from the conceptual parent component.
    var parentContext = void 0;
    if (parentInstance) {
      var parentInternal = parentInstance._internal;
      parentContext = parentInternal._processChildContext(parentInternal._context);
    }

    var prevRootInstance = this.get(container);
    var hasPrevRootInstance = prevRootInstance && prevRootInstance.isRootComponent;

    if (hasPrevRootInstance) {
      var prevRenderedComponent = prevRootInstance.getRenderedComponent();
      var prevElement = prevRenderedComponent._currentElement;
      if ((0, _shouldUpdateComponent2.default)(prevElement, element)) {
        var prevUnmaskedContext = prevRenderedComponent._context;
        prevRenderedComponent.updateComponent(prevElement, element, prevUnmaskedContext, parentContext || prevUnmaskedContext);

        return prevRootInstance;
      } else {
        _host2.default.hook.Reconciler.unmountComponent(prevRootInstance);
        (0, _unmountComponentAtNode2.default)(container);
      }
    }

    var wrappedElement = (0, _element.createElement)(_root2.default, null, element);
    var renderedComponent = (0, _instantiateComponent2.default)(wrappedElement);
    var defaultContext = parentContext || {};
    var rootInstance = renderedComponent.mountComponent(container, null, defaultContext);
    this.set(container, rootInstance);

    // After render callback
    _host2.default.driver.afterRender && _host2.default.driver.afterRender(rootInstance);

    // Devtool render new root hook
    _host2.default.hook.Mount._renderNewRootComponent(rootInstance._internal);

    return rootInstance;
  }
};
module.exports = exports['default'];

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function instantiateComponent(element) {
  var instance = void 0;

  if (element === undefined || element === null || element === false || element === true) {
    instance = new _host2.default.EmptyComponent();
  } else if (Array.isArray(element)) {
    instance = new _host2.default.FragmentComponent(element);
  } else if ((typeof element === 'undefined' ? 'undefined' : _typeof(element)) === 'object' && element.type) {
    // Special case string values
    if (typeof element.type === 'string') {
      instance = new _host2.default.NativeComponent(element);
    } else {
      instance = new _host2.default.CompositeComponent(element);
    }
  } else if (typeof element === 'string' || typeof element === 'number') {
    instance = new _host2.default.TextComponent(element);
  } else {
    throw new Error('Invalid element type: ' + element + '. (keys: ' + Object.keys(element) + ')');
  }

  instance._mountIndex = 0;

  return instance;
}

exports.default = instantiateComponent;
module.exports = exports['default'];

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function shouldUpdateComponent(prevElement, nextElement) {
  // TODO: prevElement and nextElement could be array
  var prevEmpty = prevElement === null;
  var nextEmpty = nextElement === null;
  if (prevEmpty || nextEmpty) {
    return prevEmpty === nextEmpty;
  }

  var prevType = typeof prevElement === 'undefined' ? 'undefined' : _typeof(prevElement);
  var nextType = typeof nextElement === 'undefined' ? 'undefined' : _typeof(nextElement);
  if (prevType === 'string' || prevType === 'number') {
    return nextType === 'string' || nextType === 'number';
  } else {
    return prevType === 'object' && nextType === 'object' && prevElement.type === nextElement.type && prevElement.key === nextElement.key;
  }
}

exports.default = shouldUpdateComponent;
module.exports = exports['default'];

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Base component class.
 */
var Component = function () {
  function Component(props, context, updater) {
    _classCallCheck(this, Component);

    this.props = props;
    this.context = context;
    this.refs = {};
    this.updater = updater;
  }

  _createClass(Component, [{
    key: "isComponentClass",
    value: function isComponentClass() {}
  }, {
    key: "setState",
    value: function setState(partialState, callback) {
      this.updater.setState(this, partialState, callback);
    }
  }, {
    key: "forceUpdate",
    value: function forceUpdate(callback) {
      this.updater.forceUpdate(this, callback);
    }
  }]);

  return Component;
}();

exports.default = Component;
module.exports = exports["default"];

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _instance = __webpack_require__(1);

var _instance2 = _interopRequireDefault(_instance);

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  ComponentTree: {
    getClosestInstanceFromNode: function getClosestInstanceFromNode(node) {
      return _instance2.default.get(node);
    },
    getNodeFromInstance: function getNodeFromInstance(inst) {
      // inst is an internal instance (but could be a composite)
      while (inst._renderedComponent) {
        inst = inst._renderedComponent;
      }

      if (inst) {
        return inst._nativeNode;
      } else {
        return null;
      }
    }
  },
  Mount: {
    _instancesByReactRootID: _host2.default.rootComponents,

    // Stub - React DevTools expects to find this method and replace it
    // with a wrapper in order to observe new root components being added
    _renderNewRootComponent: function _renderNewRootComponent() {}
  },
  Reconciler: {
    // Stubs - React DevTools expects to find these methods and replace them
    // with wrappers in order to observe components being mounted, updated and
    // unmounted
    mountComponent: function mountComponent() {},
    receiveComponent: function receiveComponent() {},
    unmountComponent: function unmountComponent() {}
  },
  // monitor the info of all components
  monitor: null
};
module.exports = exports['default'];

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.createElement = createElement;
exports.createFactory = createFactory;
exports.cloneElement = cloneElement;
exports.isValidElement = isValidElement;

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

var _flattenChildren = __webpack_require__(7);

var _flattenChildren2 = _interopRequireDefault(_flattenChildren);

var _universalEnv = __webpack_require__(8);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RESERVED_PROPS = {
  key: true,
  ref: true
};

function getRenderErrorInfo() {
  if (_host2.default.component) {
    var name = _host2.default.component.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

function Element(type, key, ref, props, owner) {
  if (_universalEnv.isWeex) {
    props = filterProps(type, props);
  }

  return {
    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,
    // Record the component responsible for creating this element.
    _owner: owner
  };
}

exports.default = Element;


function flattenStyle(style) {
  if (!style) {
    return undefined;
  }

  if (!Array.isArray(style)) {
    return style;
  } else {
    var result = {};
    for (var i = 0; i < style.length; ++i) {
      var computedStyle = flattenStyle(style[i]);
      if (computedStyle) {
        for (var key in computedStyle) {
          result[key] = computedStyle[key];
        }
      }
    }
    return result;
  }
}

// TODO: move to weex-drvier
function filterProps(type, props) {
  // Only for weex text
  if (type === 'text') {
    var children = props.children;
    var value = props.value;

    // Value is first
    if (value == null && children != null) {
      if (Array.isArray(children)) {
        children = children.map(function (val) {
          if (typeof val === 'number' || typeof val === 'string') {
            return val;
          } else {
            return '';
          }
        }).join('');
      } else if (typeof children !== 'number' && typeof children !== 'string') {
        children = '';
      }

      props.value = String(children);
    }

    props.children = null;
  }

  return props;
}

function createElement(type, config, children) {
  if (type == null) {
    throw Error('createElement: type should not be null or undefined.' + getRenderErrorInfo());
  }
  // Reserved names are extracted
  var props = {};
  var propName = void 0;
  var key = null;
  var ref = null;

  if (config != null) {
    ref = config.ref === undefined ? null : config.ref;
    key = config.key === undefined ? null : String(config.key);
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (!RESERVED_PROPS[propName]) {
        props[propName] = config[propName];
      }
    }
  }

  var childrenLength = arguments.length - 2;
  if (childrenLength > 0) {
    if (childrenLength === 1 && !Array.isArray(children)) {
      props.children = children;
    } else {
      var childArray = children;
      if (childrenLength > 1) {
        childArray = new Array(childrenLength);
        for (var i = 0; i < childrenLength; i++) {
          childArray[i] = arguments[i + 2];
        }
      }
      props.children = (0, _flattenChildren2.default)(childArray);
    }
  }

  // Resolve default props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  if (props.style && (Array.isArray(props.style) || _typeof(props.style) === 'object')) {
    props.style = flattenStyle(props.style);
  }

  return new Element(type, key, ref, props, _host2.default.component);
}

function createFactory(type) {
  var factory = createElement.bind(null, type);
  // Expose the type on the factory and the prototype so that it can be
  // easily accessed on elements. E.g. `<Foo />.type === Foo`.
  // This should not be named `constructor` since this may not be the function
  // that created the element, and it may not even be a constructor.
  factory.type = type;
  return factory;
}

function cloneElement(element, config) {
  if (!isValidElement(element)) {
    throw Error('cloneElement: not a valid element.' + getRenderErrorInfo());
  }

  // Original props are copied
  var props = Object.assign({}, element.props);

  // Reserved names are extracted
  var key = element.key;
  var ref = element.ref;

  // Owner will be preserved, unless ref is overridden
  var owner = element._owner;

  if (config) {
    // Should reset ref and owner if has a new ref
    if (config.ref !== undefined) {
      ref = config.ref;
      owner = _host2.default.component;
    }

    if (config.key !== undefined) {
      key = String(config.key);
    }

    // Resolve default props
    var defaultProps = void 0;
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }
    // Remaining properties override existing props
    var propName = void 0;
    for (propName in config) {
      if (config.hasOwnProperty(propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          // Resolve default props
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  if (children.length) {
    props.children = (0, _flattenChildren2.default)(children);
  }

  return new Element(element.type, key, ref, props, owner);
}

function isValidElement(object) {
  return (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && object !== null && object.type && object.props;
}

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = flattenChildren;
function traverseChildren(children, result) {
  if (Array.isArray(children)) {
    for (var i = 0, l = children.length; i < l; i++) {
      traverseChildren(children[i], result);
    }
  } else {
    result.push(children);
  }
}

function flattenChildren(children) {
  if (children == null) {
    return children;
  }
  var result = [];
  traverseChildren(children, result);

  if (result.length === 1) {
    result = result[0];
  }

  return result;
}
module.exports = exports["default"];

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

// https://www.w3.org/TR/html5/webappapis.html#dom-navigator-appcodename
var isWeb = exports.isWeb = (typeof navigator === 'undefined' ? 'undefined' : _typeof(navigator)) === 'object' && (navigator.appCodeName === 'Mozilla' || navigator.product === 'Gecko');
var isNode = exports.isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);
var isWeex = exports.isWeex = typeof callNative === 'function';
var isReactNative = exports.isReactNative = typeof __fbBatchedBridgeConfig !== 'undefined';
exports['default'] = module.exports;
exports.default = module.exports;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = unmountComponentAtNode;

var _instance = __webpack_require__(1);

var _instance2 = _interopRequireDefault(_instance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function unmountComponentAtNode(node) {
  var component = _instance2.default.get(node);

  if (!component) {
    return false;
  }

  _instance2.default.remove(node);
  component._internal.unmountComponent();

  return true;
}
module.exports = exports['default'];

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _inject = __webpack_require__(22);

var _inject2 = _interopRequireDefault(_inject);

var _instance = __webpack_require__(1);

var _instance2 = _interopRequireDefault(_instance);

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function render(element, container, options, callback) {
  // Compatible with `render(element, container, callback)`
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }

  options = options || {};
  // Init inject
  (0, _inject2.default)(options);

  var rootComponent = _instance2.default.mount(element, container, options.parent);
  var componentInstance = rootComponent.getPublicInstance();

  if (callback) {
    callback.call(componentInstance);
  }

  return componentInstance;
}

exports.default = render;
module.exports = exports['default'];

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

var _ref = __webpack_require__(12);

var _ref2 = _interopRequireDefault(_ref);

var _instantiateComponent = __webpack_require__(2);

var _instantiateComponent2 = _interopRequireDefault(_instantiateComponent);

var _shouldUpdateComponent = __webpack_require__(3);

var _shouldUpdateComponent2 = _interopRequireDefault(_shouldUpdateComponent);

var _getElementKeyName = __webpack_require__(13);

var _getElementKeyName2 = _interopRequireDefault(_getElementKeyName);

var _instance = __webpack_require__(1);

var _instance2 = _interopRequireDefault(_instance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var STYLE = 'style';
var CHILDREN = 'children';
var TREE = 'tree';
var EVENT_PREFIX_REGEXP = /on[A-Z]/;

/**
 * Native Component
 */

var NativeComponent = function () {
  function NativeComponent(element) {
    _classCallCheck(this, NativeComponent);

    this._currentElement = element;
  }

  _createClass(NativeComponent, [{
    key: 'mountComponent',
    value: function mountComponent(parent, parentInstance, context, childMounter) {
      // Parent native element
      this._parent = parent;
      this._parentInstance = parentInstance;
      this._context = context;
      this._mountID = _host2.default.mountID++;

      var props = this._currentElement.props;
      var type = this._currentElement.type;
      var instance = {
        _internal: this,
        type: type,
        props: props
      };
      var appendType = props.append; // Default is node

      this._instance = instance;

      // Clone a copy for style diff
      this._prevStyleCopy = Object.assign({}, props.style);

      var nativeNode = this.getNativeNode();

      if (appendType !== TREE) {
        if (childMounter) {
          childMounter(nativeNode, parent);
        } else {
          _host2.default.driver.appendChild(nativeNode, parent);
        }
      }

      if (this._currentElement && this._currentElement.ref) {
        _ref2.default.attach(this._currentElement._owner, this._currentElement.ref, this);
      }

      // Process children
      var children = props.children;
      if (children != null) {
        this.mountChildren(children, context);
      }

      if (appendType === TREE) {
        if (childMounter) {
          childMounter(nativeNode, parent);
        } else {
          _host2.default.driver.appendChild(nativeNode, parent);
        }
      }

      _host2.default.hook.Reconciler.mountComponent(this);

      return instance;
    }
  }, {
    key: 'mountChildren',
    value: function mountChildren(children, context) {
      var _this = this;

      if (!Array.isArray(children)) {
        children = [children];
      }

      var renderedChildren = this._renderedChildren = {};

      var renderedChildrenImage = children.map(function (element, index) {
        var renderedChild = (0, _instantiateComponent2.default)(element);
        var name = (0, _getElementKeyName2.default)(renderedChildren, element, index);
        renderedChildren[name] = renderedChild;
        renderedChild._mountIndex = index;
        // Mount
        var mountImage = renderedChild.mountComponent(_this.getNativeNode(), _this._instance, context, null);
        return mountImage;
      });

      return renderedChildrenImage;
    }
  }, {
    key: 'unmountChildren',
    value: function unmountChildren(notRemoveChild) {
      var renderedChildren = this._renderedChildren;

      if (renderedChildren) {
        for (var name in renderedChildren) {
          var renderedChild = renderedChildren[name];
          renderedChild.unmountComponent(notRemoveChild);
        }
        this._renderedChildren = null;
      }
    }
  }, {
    key: 'unmountComponent',
    value: function unmountComponent(notRemoveChild) {
      if (this._nativeNode) {
        var ref = this._currentElement.ref;
        if (ref) {
          _ref2.default.detach(this._currentElement._owner, ref, this);
        }

        _instance2.default.remove(this._nativeNode);
        if (!notRemoveChild) {
          _host2.default.driver.removeChild(this._nativeNode, this._parent);
        }
        _host2.default.driver.removeAllEventListeners(this._nativeNode);
      }

      this.unmountChildren(notRemoveChild);

      _host2.default.hook.Reconciler.unmountComponent(this);

      this._currentElement = null;
      this._nativeNode = null;
      this._parent = null;
      this._parentInstance = null;
      this._context = null;
      this._instance = null;
      this._prevStyleCopy = null;
    }
  }, {
    key: 'updateComponent',
    value: function updateComponent(prevElement, nextElement, prevContext, nextContext) {
      // Replace current element
      this._currentElement = nextElement;

      _ref2.default.update(prevElement, nextElement, this);

      var prevProps = prevElement.props;
      var nextProps = nextElement.props;

      this.updateProperties(prevProps, nextProps);
      this.updateChildren(nextProps.children, nextContext);

      _host2.default.hook.Reconciler.receiveComponent(this);
    }
  }, {
    key: 'updateProperties',
    value: function updateProperties(prevProps, nextProps) {
      var propKey = void 0;
      var styleName = void 0;
      var styleUpdates = void 0;
      for (propKey in prevProps) {
        if (propKey === CHILDREN || nextProps.hasOwnProperty(propKey) || !prevProps.hasOwnProperty(propKey) || prevProps[propKey] == null) {
          continue;
        }
        if (propKey === STYLE) {
          var lastStyle = this._prevStyleCopy;
          for (styleName in lastStyle) {
            if (lastStyle.hasOwnProperty(styleName)) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          this._prevStyleCopy = null;
        } else if (EVENT_PREFIX_REGEXP.test(propKey)) {
          if (typeof prevProps[propKey] === 'function') {
            _host2.default.driver.removeEventListener(this.getNativeNode(), propKey.slice(2).toLowerCase(), prevProps[propKey]);
          }
        } else {
          _host2.default.driver.removeAttribute(this.getNativeNode(), propKey, prevProps[propKey]);
        }
      }

      for (propKey in nextProps) {
        var nextProp = nextProps[propKey];
        var prevProp = propKey === STYLE ? this._prevStyleCopy : prevProps != null ? prevProps[propKey] : undefined;
        if (propKey === CHILDREN || !nextProps.hasOwnProperty(propKey) || nextProp === prevProp || nextProp == null && prevProp == null) {
          continue;
        }
        // Update style
        if (propKey === STYLE) {
          if (nextProp) {
            // Clone property
            nextProp = this._prevStyleCopy = Object.assign({}, nextProp);
          } else {
            this._prevStyleCopy = null;
          }

          if (prevProp != null) {
            // Unset styles on `prevProp` but not on `nextProp`.
            for (styleName in prevProp) {
              if (prevProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
                styleUpdates = styleUpdates || {};
                styleUpdates[styleName] = '';
              }
            }
            // Update styles that changed since `prevProp`.
            for (styleName in nextProp) {
              if (nextProp.hasOwnProperty(styleName) && prevProp[styleName] !== nextProp[styleName]) {
                styleUpdates = styleUpdates || {};
                styleUpdates[styleName] = nextProp[styleName];
              }
            }
          } else {
            // Assign next prop when prev style is null
            styleUpdates = nextProp;
          }

          // Update event binding
        } else if (EVENT_PREFIX_REGEXP.test(propKey)) {
          var eventName = propKey.slice(2).toLowerCase();

          if (typeof prevProp === 'function') {
            _host2.default.driver.removeEventListener(this.getNativeNode(), eventName, prevProp, nextProps);
          }

          if (typeof nextProp === 'function') {
            _host2.default.driver.addEventListener(this.getNativeNode(), eventName, nextProp, nextProps);
          }
          // Update other property
        } else {
          if (nextProp != null) {
            _host2.default.driver.setAttribute(this.getNativeNode(), propKey, nextProp);
          } else {
            _host2.default.driver.removeAttribute(this.getNativeNode(), propKey, prevProps[propKey]);
          }
          
        }
      }

      if (styleUpdates) {
        _host2.default.driver.setStyles(this.getNativeNode(), styleUpdates);
      }
    }
  }, {
    key: 'updateChildren',
    value: function updateChildren(nextChildrenElements, context) {
      var _this2 = this;

      // prev rendered children
      var prevChildren = this._renderedChildren;

      if (nextChildrenElements == null && prevChildren == null) {
        return;
      }

      var nextChildren = {};
      var oldNodes = {};

      if (nextChildrenElements != null) {
        if (!Array.isArray(nextChildrenElements)) {
          nextChildrenElements = [nextChildrenElements];
        }

        // Update next children elements
        for (var index = 0, length = nextChildrenElements.length; index < length; index++) {
          var nextElement = nextChildrenElements[index];
          var name = (0, _getElementKeyName2.default)(nextChildren, nextElement, index);
          var prevChild = prevChildren && prevChildren[name];
          var prevElement = prevChild && prevChild._currentElement;

          if (prevChild != null && (0, _shouldUpdateComponent2.default)(prevElement, nextElement)) {
            // Pass the same context when updating chidren
            prevChild.updateComponent(prevElement, nextElement, context, context);
            nextChildren[name] = prevChild;
          } else {
            // Unmount the prevChild when nextChild is different element type.
            if (prevChild) {
              var oldNativeNode = prevChild.getNativeNode();
              // Delay remove child
              prevChild.unmountComponent(true);
              oldNodes[name] = oldNativeNode;
            }
            // The child must be instantiated before it's mounted.
            nextChildren[name] = (0, _instantiateComponent2.default)(nextElement);
          }
        }
      }

      var firstPrevChild = void 0;
      var delayRemoveFirstPrevChild = void 0;
      // Unmount children that are no longer present.
      if (prevChildren != null) {
        for (var _name in prevChildren) {
          if (!prevChildren.hasOwnProperty(_name)) {
            continue;
          }

          var _prevChild = prevChildren[_name];
          var shouldRemove = !nextChildren[_name];

          // Store old first child ref for append node ahead and maybe delay remove it
          if (!firstPrevChild) {
            firstPrevChild = _prevChild;
            delayRemoveFirstPrevChild = shouldRemove;
          } else if (shouldRemove) {
            _prevChild.unmountComponent();
          }
        }
      }

      if (nextChildren != null) {
        (function () {
          // `nextIndex` will increment for each child in `nextChildren`, but
          // `lastIndex` will be the last index visited in `prevChildren`.
          var lastIndex = 0;
          var nextIndex = 0;
          var lastPlacedNode = null;
          var nextNativeNode = [];

          var _loop = function _loop(_name2) {
            if (!nextChildren.hasOwnProperty(_name2)) {
              return 'continue';
            }

            var nextChild = nextChildren[_name2];
            var prevChild = prevChildren && prevChildren[_name2];

            if (prevChild === nextChild) {
              var prevChildNativeNode = prevChild.getNativeNode();
              // Convert to array type
              if (!Array.isArray(prevChildNativeNode)) {
                prevChildNativeNode = [prevChildNativeNode];
              }

              // If the index of `child` is less than `lastIndex`, then it needs to
              // be moved. Otherwise, we do not need to move it because a child will be
              // inserted or moved before `child`.
              if (prevChild._mountIndex < lastIndex) {
                // Get the last child
                if (Array.isArray(lastPlacedNode)) {
                  lastPlacedNode = lastPlacedNode[lastPlacedNode.length - 1];
                }

                for (var _i = prevChildNativeNode.length - 1; _i >= 0; _i--) {
                  _host2.default.driver.insertAfter(prevChildNativeNode[_i], lastPlacedNode);
                }
              }

              nextNativeNode = nextNativeNode.concat(prevChildNativeNode);

              lastIndex = Math.max(prevChild._mountIndex, lastIndex);
              prevChild._mountIndex = nextIndex;
            } else {
              if (prevChild != null) {
                // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
                lastIndex = Math.max(prevChild._mountIndex, lastIndex);
              }

              var parent = _this2.getNativeNode();
              // Fragment extended native component, so if parent is fragment should get this._parent
              if (Array.isArray(parent)) {
                parent = _this2._parent;
              }

              nextChild.mountComponent(parent, _this2._instance, context, function (newChild, parent) {
                // TODO: Rework the duplicate code
                var oldChild = oldNodes[_name2];
                if (!Array.isArray(newChild)) {
                  newChild = [newChild];
                }

                if (oldChild) {
                  // The oldChild or newChild all maybe fragment
                  if (!Array.isArray(oldChild)) {
                    oldChild = [oldChild];
                  }

                  // If newChild count large then oldChild
                  var lastNewChild = void 0;
                  for (var _i2 = 0; _i2 < newChild.length; _i2++) {
                    var child = newChild[_i2];
                    if (oldChild[_i2]) {
                      _host2.default.driver.replaceChild(child, oldChild[_i2]);
                    } else {
                      _host2.default.driver.insertAfter(child, lastNewChild);
                    }
                    lastNewChild = child;
                  }

                  // If newChild count less then oldChild
                  if (newChild.length < oldChild.length) {
                    for (var _i3 = newChild.length; _i3 < oldChild.length; _i3++) {
                      _host2.default.driver.removeChild(oldChild[_i3]);
                    }
                  }
                } else {
                  // Insert child at a specific index

                  // Get the last child
                  if (Array.isArray(lastPlacedNode)) {
                    lastPlacedNode = lastPlacedNode[lastPlacedNode.length - 1];
                  }

                  var prevFirstNativeNode = void 0;

                  if (firstPrevChild && !lastPlacedNode) {
                    prevFirstNativeNode = firstPrevChild.getNativeNode();
                    if (Array.isArray(prevFirstNativeNode)) {
                      prevFirstNativeNode = prevFirstNativeNode[0];
                    }
                  }

                  for (var _i4 = newChild.length - 1; _i4 >= 0; _i4--) {
                    var _child = newChild[_i4];
                    if (lastPlacedNode) {
                      _host2.default.driver.insertAfter(_child, lastPlacedNode);
                    } else if (prevFirstNativeNode) {
                      _host2.default.driver.insertBefore(_child, prevFirstNativeNode);
                    } else {
                      _host2.default.driver.appendChild(_child, parent);
                    }
                  }
                }

                nextNativeNode = nextNativeNode.concat(newChild);
              });
              nextChild._mountIndex = nextIndex;
            }

            nextIndex++;
            lastPlacedNode = nextChild.getNativeNode();
          };

          for (var _name2 in nextChildren) {
            var _ret2 = _loop(_name2);

            if (_ret2 === 'continue') continue;
          }

          // Sync update native refs
          if (Array.isArray(_this2._nativeNode)) {
            // Clear all and push the new array
            _this2._nativeNode.splice(0, _this2._nativeNode.length);
            for (var i = 0; i < nextNativeNode.length; i++) {
              _this2._nativeNode.push(nextNativeNode[i]);
            }
          }
        })();
      }

      if (delayRemoveFirstPrevChild) {
        firstPrevChild.unmountComponent();
      }

      this._renderedChildren = nextChildren;
    }
  }, {
    key: 'getNativeNode',
    value: function getNativeNode() {
      if (this._nativeNode == null) {
        this._nativeNode = _host2.default.driver.createElement(this._instance);
        _instance2.default.set(this._nativeNode, this._instance);
      }

      return this._nativeNode;
    }
  }, {
    key: 'getPublicInstance',
    value: function getPublicInstance() {
      return this.getNativeNode();
    }
  }, {
    key: 'getName',
    value: function getName() {
      return this._currentElement.type;
    }
  }]);

  return NativeComponent;
}();

exports.default = NativeComponent;
module.exports = exports['default'];

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
/*
 * Ref manager
 */

exports.default = {
  update: function update(prevElement, nextElement, component) {
    var prevRef = prevElement != null && prevElement.ref;
    var nextRef = nextElement != null && nextElement.ref;

    // Update refs in owner component
    if (prevRef !== nextRef) {
      // Detach prev RenderedElement's ref
      prevRef != null && this.detach(prevElement._owner, prevRef, component);
      // Attach next RenderedElement's ref
      nextRef != null && this.attach(nextElement._owner, nextRef, component);
    }
  },
  attach: function attach(ownerComponent, ref, component) {
    if (!ownerComponent) {
      throw new Error('You might be adding a ref to a component that was not created inside a component\'s ' + '`render` method, or you have multiple copies of Rax loaded.');
    }

    var instance = component.getPublicInstance();
    if (typeof ref === 'function') {
      ref(instance);
    } else {
      ownerComponent._instance.refs[ref] = instance;
    }
  },
  detach: function detach(ownerComponent, ref, component) {
    if (typeof ref === 'function') {
      // When the referenced component is unmounted and whenever the ref changes, the old ref will be called with null as an argument.
      ref(null);
    } else {
      // Must match component and ref could detach the ref on owner when A's before ref is B's current ref
      var instance = component.getPublicInstance();
      if (ownerComponent._instance.refs[ref] === instance) {
        delete ownerComponent._instance.refs[ref];
      }
    }
  }
};
module.exports = exports['default'];

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (children, element, index) {
  var elementKey = element && element.key;
  var hasKey = typeof elementKey === 'string';
  var defaultName = '.' + index.toString(36);

  if (hasKey) {
    var keyName = '$' + elementKey;
    // Child keys must be unique.
    var keyUnique = children[keyName] === undefined;
    // Only the first child will be used when encountered two children with the same key
    if (!keyUnique) console.warn('Encountered two children with the same key "' + elementKey + '".');

    return keyUnique ? keyName : defaultName;
  } else {
    return defaultName;
  }
};

module.exports = exports['default'];

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isRem = isRem;
exports.calcRem = calcRem;
exports.getRem = getRem;
exports.setRem = setRem;
exports.isUnitNumber = isUnitNumber;
exports.convertUnit = convertUnit;
/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var UNITLESS_NUMBER_PROPS = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridColumn: true,
  fontWeight: true,
  lineClamp: true,
  // We make lineHeight default is px that is diff with w3c spec
  // lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  // Weex only
  lines: true
};
var SUFFIX = 'rem';
var REM_REG = /[-+]?\d*\.?\d+rem/g;

// Default 1 rem to 1 px
var defaultRemUnit = 1;

/**
 * Is string contains rem
 * @param {String} str
 * @returns {Boolean}
 */
function isRem(str) {
  return typeof str === 'string' && str.indexOf(SUFFIX) !== -1;
}

/**
 * Calculate rem to pixels: '1.2rem' => 1.2 * rem
 * @param {String} str
 * @param {Number} rem
 * @returns {number}
 */
function calcRem(str) {
  var remUnit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultRemUnit;

  return str.replace(REM_REG, function (rem) {
    return parseFloat(rem) * remUnit + 'px';
  });
}

function getRem() {
  return defaultRemUnit;
}

function setRem(rem) {
  defaultRemUnit = rem;
}

function isUnitNumber(val, prop) {
  return typeof val === 'number' && !UNITLESS_NUMBER_PROPS[prop];
}

function convertUnit(val, prop) {
  var remUnit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultRemUnit;

  if (prop && isUnitNumber(val, prop)) {
    return val * remUnit + 'px';
  } else if (isRem(val)) {
    return calcRem(val, remUnit);
  }

  return val;
}
exports['default'] = module.exports;
exports.default = module.exports;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformPropsAttrsToStyle = transformPropsAttrsToStyle;
exports.renamePropsAttr = renamePropsAttr;
/**
 * transformPropAttrsToStyle
 *
 * @param {Object} props
 * @param {Array} attrs
 */
function transformPropsAttrsToStyle(props, attrs) {
  props.style = props.style || {};

  attrs.forEach(function (attr) {
    if (props[attr] && !props.style[attr]) {
      props.style[attr] = props[attr];
      delete props[attr];
    }
  });

  return props;
}

/**
 * renamePropsAttr
 *
 * @param {Object} props
 * @param {String} originalAttrName
 * @param {String} newAttrName
 */
function renamePropsAttr(props, originalAttrName, newAttrName) {
  if (props[originalAttrName] && !props[newAttrName]) {
    props[newAttrName] = props[originalAttrName];
    delete props[originalAttrName];
  }

  return props;
}
exports["default"] = module.exports;
exports.default = module.exports;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findDOMNode(instance) {
  if (instance == null) {
    return null;
  }

  // If a native node, weex may not export ownerDocument property
  if (instance.ownerDocument || instance.nodeType) {
    return instance;
  }

  // Native component
  if (instance._nativeNode) {
    return instance._nativeNode;
  }

  if (typeof instance == 'string') {
    return _host2.default.driver.getElementById(instance);
  }

  if (typeof instance.render !== 'function') {
    throw new Error('findDOMNode: find by neither component nor DOM node.');
  }

  // Composite component
  var internal = instance._internal;

  if (internal) {
    while (!internal._nativeNode) {
      internal = internal._renderedComponent;
      // If not mounted
      if (internal == null) {
        return null;
      }
    }
    return internal._nativeNode;
  } else {
    throw new Error('findDOMNode: find on an unmounted component.');
  }
}

exports.default = findDOMNode;
module.exports = exports['default'];

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Children = exports.version = exports.setNativeProps = exports.findComponentInstance = exports.unmountComponentAtNode = exports.findDOMNode = exports.hydrate = exports.render = exports.PropTypes = exports.PureComponent = exports.Component = exports.createFactory = exports.isValidElement = exports.cloneElement = exports.createElement = undefined;

__webpack_require__(18);

var _element = __webpack_require__(6);

var _component = __webpack_require__(4);

var _component2 = _interopRequireDefault(_component);

var _purecomponent = __webpack_require__(20);

var _purecomponent2 = _interopRequireDefault(_purecomponent);

var _proptypes = __webpack_require__(21);

var _proptypes2 = _interopRequireDefault(_proptypes);

var _render2 = __webpack_require__(10);

var _render3 = _interopRequireDefault(_render2);

var _hydrate2 = __webpack_require__(42);

var _hydrate3 = _interopRequireDefault(_hydrate2);

var _findDOMNode2 = __webpack_require__(16);

var _findDOMNode3 = _interopRequireDefault(_findDOMNode2);

var _unmountComponentAtNode2 = __webpack_require__(9);

var _unmountComponentAtNode3 = _interopRequireDefault(_unmountComponentAtNode2);

var _findComponentInstance2 = __webpack_require__(43);

var _findComponentInstance3 = _interopRequireDefault(_findComponentInstance2);

var _setNativeProps2 = __webpack_require__(44);

var _setNativeProps3 = _interopRequireDefault(_setNativeProps2);

var _version2 = __webpack_require__(45);

var _version3 = _interopRequireDefault(_version2);

var _children = __webpack_require__(46);

var _children2 = _interopRequireDefault(_children);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.createElement = _element.createElement;
exports.cloneElement = _element.cloneElement;
exports.isValidElement = _element.isValidElement;
exports.createFactory = _element.createFactory;
exports.Component = _component2.default;
exports.PureComponent = _purecomponent2.default;
exports.PropTypes = _proptypes2.default;
exports.render = _render3.default;
exports.hydrate = _hydrate3.default;
exports.findDOMNode = _findDOMNode3.default;
exports.unmountComponentAtNode = _unmountComponentAtNode3.default;
exports.findComponentInstance = _findComponentInstance3.default;
exports.setNativeProps = _setNativeProps3.default;
exports.version = _version3.default;
exports.Children = _children2.default;

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

var _hook = __webpack_require__(5);

var _hook2 = _interopRequireDefault(_hook);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject === 'function') {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.inject(_hook2.default);
}

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _component = __webpack_require__(4);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var rootCounter = 1;

var Root = function (_Component) {
  _inherits(Root, _Component);

  function Root() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, Root);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Root.__proto__ || Object.getPrototypeOf(Root)).call.apply(_ref, [this].concat(args))), _this), _this.rootID = rootCounter++, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(Root, [{
    key: 'isRootComponent',
    value: function isRootComponent() {}
  }, {
    key: 'render',
    value: function render() {
      return this.props.children;
    }
  }, {
    key: 'getPublicInstance',
    value: function getPublicInstance() {
      return this.getRenderedComponent().getPublicInstance();
    }
  }, {
    key: 'getRenderedComponent',
    value: function getRenderedComponent() {
      return this._internal._renderedComponent;
    }
  }]);

  return Root;
}(_component2.default);

exports.default = Root;
module.exports = exports['default'];

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _component = __webpack_require__(4);

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Pure component class.
 */
var PureComponent = function (_Component) {
  _inherits(PureComponent, _Component);

  function PureComponent(props, context) {
    _classCallCheck(this, PureComponent);

    return _possibleConstructorReturn(this, (PureComponent.__proto__ || Object.getPrototypeOf(PureComponent)).call(this, props, context));
  }

  _createClass(PureComponent, [{
    key: 'isPureComponentClass',
    value: function isPureComponentClass() {}
  }]);

  return PureComponent;
}(_component2.default);

exports.default = PureComponent;
module.exports = exports['default'];

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
/*
 * Current PropTypes only export some api with react, not validate in runtime.
 */

function createChainableTypeChecker(validate) {
  function checkType(isRequired, props, propName, componentName, location, propFullName) {
    return typeChecker;
  }

  var chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);

  return chainedCheckType;
}

function createTypeChecker(expectedType) {
  function validate(props, propName, componentName, location, propFullName) {
    // Noop
  }
  return createChainableTypeChecker(validate);
}

var typeChecker = createTypeChecker();

exports.default = {
  array: typeChecker,
  bool: typeChecker,
  func: typeChecker,
  number: typeChecker,
  object: typeChecker,
  string: typeChecker,
  symbol: typeChecker,
  element: typeChecker,
  node: typeChecker,
  any: typeChecker,
  arrayOf: typeChecker,
  instanceOf: typeChecker,
  objectOf: typeChecker,
  oneOf: typeChecker,
  oneOfType: typeChecker,
  shape: typeChecker
};
module.exports = exports["default"];

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = inject;

var _universalEnv = __webpack_require__(8);

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

var _empty = __webpack_require__(23);

var _empty2 = _interopRequireDefault(_empty);

var _native = __webpack_require__(11);

var _native2 = _interopRequireDefault(_native);

var _text = __webpack_require__(24);

var _text2 = _interopRequireDefault(_text);

var _composite = __webpack_require__(25);

var _composite2 = _interopRequireDefault(_composite);

var _fragment = __webpack_require__(29);

var _fragment2 = _interopRequireDefault(_fragment);

var _driverWeex = __webpack_require__(30);

var _driverWeex2 = _interopRequireDefault(_driverWeex);

var _driverBrowser = __webpack_require__(40);

var _driverBrowser2 = _interopRequireDefault(_driverBrowser);

var _hook = __webpack_require__(5);

var _hook2 = _interopRequireDefault(_hook);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function inject(_ref) {
  var driver = _ref.driver,
      hook = _ref.hook,
      measurer = _ref.measurer,
      deviceWidth = _ref.deviceWidth,
      viewportWidth = _ref.viewportWidth,
      eventRegistry = _ref.eventRegistry;

  // Inject component class
  _host2.default.EmptyComponent = _empty2.default;
  _host2.default.NativeComponent = _native2.default;
  _host2.default.TextComponent = _text2.default;
  _host2.default.FragmentComponent = _fragment2.default;
  _host2.default.CompositeComponent = _composite2.default;

  // Inject devtool hook
  _host2.default.hook = hook || _hook2.default;

  // Inject performance measurer
  _host2.default.measurer = measurer;

  // Inject render driver
  if (!_host2.default.driver) {
    if (!driver) {
      if (_universalEnv.isWeex) {
        driver = _driverWeex2.default;
      } else if (_universalEnv.isWeb) {
        driver = _driverBrowser2.default;
      } else {
        throw Error('No builtin driver matched');
      }
    }
    _host2.default.driver = driver;
  }

  if (deviceWidth && _host2.default.driver.setDeviceWidth) {
    _host2.default.driver.setDeviceWidth(deviceWidth);
  }

  if (viewportWidth && _host2.default.driver.setViewportWidth) {
    _host2.default.driver.setViewportWidth(viewportWidth);
  }

  if (eventRegistry) {
    _host2.default.driver.eventRegistry = eventRegistry;
  }
}
module.exports = exports['default'];

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Empty Component
 */
var EmptyComponent = function () {
  function EmptyComponent() {
    _classCallCheck(this, EmptyComponent);

    this._currentElement = null;
  }

  _createClass(EmptyComponent, [{
    key: 'mountComponent',
    value: function mountComponent(parent, parentInstance, context, childMounter) {
      this._parent = parent;
      this._parentInstance = parentInstance;
      this._context = context;

      var instance = {
        _internal: this
      };

      var nativeNode = this.getNativeNode();
      if (childMounter) {
        childMounter(nativeNode, parent);
      } else {
        _host2.default.driver.appendChild(nativeNode, parent);
      }

      return instance;
    }
  }, {
    key: 'unmountComponent',
    value: function unmountComponent(notRemoveChild) {
      if (this._nativeNode && !notRemoveChild) {
        _host2.default.driver.removeChild(this._nativeNode, this._parent);
      }

      this._nativeNode = null;
      this._parent = null;
      this._parentInstance = null;
      this._context = null;
    }
  }, {
    key: 'updateComponent',
    value: function updateComponent() {
      // Noop
    }
  }, {
    key: 'getNativeNode',
    value: function getNativeNode() {
      // Weex native node
      if (this._nativeNode == null) {
        this._nativeNode = _host2.default.driver.createEmpty();
      }

      return this._nativeNode;
    }
  }]);

  return EmptyComponent;
}();

exports.default = EmptyComponent;
module.exports = exports['default'];

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Text Component
 */
var TextComponent = function () {
  function TextComponent(element) {
    _classCallCheck(this, TextComponent);

    this._currentElement = element;
    this._stringText = String(element);
  }

  _createClass(TextComponent, [{
    key: 'mountComponent',
    value: function mountComponent(parent, parentInstance, context, childMounter) {
      this._parent = parent;
      this._parentInstance = parentInstance;
      this._context = context;
      this._mountID = _host2.default.mountID++;

      // Weex dom operation
      var nativeNode = this.getNativeNode();

      if (childMounter) {
        childMounter(nativeNode, parent);
      } else {
        _host2.default.driver.appendChild(nativeNode, parent);
      }

      var instance = {
        _internal: this
      };

      _host2.default.hook.Reconciler.mountComponent(this);

      return instance;
    }
  }, {
    key: 'unmountComponent',
    value: function unmountComponent(notRemoveChild) {
      if (this._nativeNode && !notRemoveChild) {
        _host2.default.driver.removeChild(this._nativeNode, this._parent);
      }

      _host2.default.hook.Reconciler.unmountComponent(this);

      this._currentElement = null;
      this._nativeNode = null;
      this._parent = null;
      this._parentInstance = null;
      this._context = null;
      this._stringText = null;
    }
  }, {
    key: 'updateComponent',
    value: function updateComponent(prevElement, nextElement, context) {
      // If some text do noting
      if (prevElement !== nextElement) {
        // Replace current element
        this._currentElement = nextElement;
        // Devtool read the latest stringText value
        this._stringText = String(nextElement);
        _host2.default.driver.updateText(this.getNativeNode(), this._stringText);
        _host2.default.hook.Reconciler.receiveComponent(this);
      }
    }
  }, {
    key: 'getNativeNode',
    value: function getNativeNode() {
      if (this._nativeNode == null) {
        this._nativeNode = _host2.default.driver.createText(this._stringText);
      }
      return this._nativeNode;
    }
  }]);

  return TextComponent;
}();

exports.default = TextComponent;
module.exports = exports['default'];

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stateless = __webpack_require__(26);

var _stateless2 = _interopRequireDefault(_stateless);

var _updater = __webpack_require__(27);

var _updater2 = _interopRequireDefault(_updater);

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

var _ref = __webpack_require__(12);

var _ref2 = _interopRequireDefault(_ref);

var _instantiateComponent = __webpack_require__(2);

var _instantiateComponent2 = _interopRequireDefault(_instantiateComponent);

var _shouldUpdateComponent = __webpack_require__(3);

var _shouldUpdateComponent2 = _interopRequireDefault(_shouldUpdateComponent);

var _shallowEqual = __webpack_require__(28);

var _shallowEqual2 = _interopRequireDefault(_shallowEqual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function performInSandbox(fn, instance, callback) {
  try {
    return fn();
  } catch (e) {
    if (callback) {
      callback(e);
    } else {
      handleError(instance, e);
    }
  }
}

function handleError(instance, error) {
  var boundary = void 0;

  while (instance) {
    if (typeof instance.componentDidCatch === 'function') {
      boundary = instance;
      break;
    } else if (instance._internal && instance._internal._parentInstance) {
      instance = instance._internal._parentInstance;
    } else {
      break;
    }
  }

  if (boundary) {
    boundary.componentDidCatch(error);
  } else {
    if (_host2.default.sandbox) {
      setTimeout(function () {
        throw error;
      }, 0);
    } else {
      throw error;
    }
  }
}

var CompositeComponent = function () {
  function CompositeComponent(element) {
    _classCallCheck(this, CompositeComponent);

    this._currentElement = element;
  }

  _createClass(CompositeComponent, [{
    key: 'getName',
    value: function getName() {
      var type = this._currentElement.type;
      var constructor = this._instance && this._instance.constructor;
      return type.displayName || constructor && constructor.displayName || type.name || constructor && constructor.name || null;
    }
  }, {
    key: 'mountComponent',
    value: function mountComponent(parent, parentInstance, context, childMounter) {
      this._parent = parent;
      this._parentInstance = parentInstance;
      this._context = context;
      this._mountID = _host2.default.mountID++;
      this._updateCount = 0;

      var Component = this._currentElement.type;
      var publicProps = this._currentElement.props;
      var isClass = Component.prototype;
      var isComponentClass = isClass && Component.prototype.isComponentClass;
      // Class stateless component without state but have lifecycles
      var isStatelessClass = isClass && Component.prototype.render;

      // Context process
      var publicContext = this._processContext(context);

      // Initialize the public class
      var instance = void 0;
      var renderedElement = void 0;

      if (isComponentClass || isStatelessClass) {
        // Component instance
        instance = new Component(publicProps, publicContext, _updater2.default);
      } else if (typeof Component === 'function') {
        // Functional stateless component without state and lifecycles
        instance = new _stateless2.default(Component);
      } else {
        throw new Error('Invalid component type: ' + Component + '. (keys: ' + Object.keys(Component) + ')');
      }

      // These should be set up in the constructor, but as a convenience for
      // simpler class abstractions, we set them up after the fact.
      instance.props = publicProps;
      instance.context = publicContext;
      instance.refs = {};

      // Inject the updater into instance
      instance.updater = _updater2.default;
      instance._internal = this;
      this._instance = instance;

      // Init state, must be set to an object or null
      var initialState = instance.state;
      if (initialState === undefined) {
        // TODO clone the state?
        instance.state = initialState = null;
      }

      var error = null;
      var errorCallback = function errorCallback(e) {
        error = e;
      };

      if (instance.componentWillMount) {
        performInSandbox(function () {
          {
            instance.componentWillMount();
          }
        }, instance, errorCallback);
      }

      if (renderedElement == null) {
        _host2.default.component = this;
        // Process pending state when call setState in componentWillMount
        instance.state = this._processPendingState(publicProps, publicContext);

        performInSandbox(function () {
          {
            renderedElement = instance.render();
          }
        }, instance, errorCallback);

        _host2.default.component = null;
      }

      this._renderedComponent = (0, _instantiateComponent2.default)(renderedElement);
      this._renderedComponent.mountComponent(this._parent, instance, this._processChildContext(context), childMounter);

      if (error) {
        handleError(instance, error);
      }

      if (this._currentElement && this._currentElement.ref) {
        _ref2.default.attach(this._currentElement._owner, this._currentElement.ref, this);
      }

      if (instance.componentDidMount) {
        performInSandbox(function () {
          {
            instance.componentDidMount();
          }
        }, instance);
      }

      _host2.default.hook.Reconciler.mountComponent(this);

      return instance;
    }
  }, {
    key: 'unmountComponent',
    value: function unmountComponent(notRemoveChild) {
      var instance = this._instance;

      if (instance.componentWillUnmount) {
        performInSandbox(function () {
          instance.componentWillUnmount();
        }, instance);
      }

      _host2.default.hook.Reconciler.unmountComponent(this);

      instance._internal = null;

      if (this._renderedComponent != null) {
        var ref = this._currentElement.ref;
        if (ref) {
          _ref2.default.detach(this._currentElement._owner, ref, this);
        }

        this._renderedComponent.unmountComponent(notRemoveChild);
        this._renderedComponent = null;
        this._instance = null;
      }

      this._currentElement = null;
      this._parentInstance = null;

      // Reset pending fields
      // Even if this component is scheduled for another update in ReactUpdates,
      // it would still be ignored because these fields are reset.
      this._pendingStateQueue = null;
      this._pendingForceUpdate = false;

      // These fields do not really need to be reset since this object is no
      // longer accessible.
      this._context = null;
    }

    /**
     * Filters the context object to only contain keys specified in
     * `contextTypes`
     */

  }, {
    key: '_processContext',
    value: function _processContext(context) {
      var Component = this._currentElement.type;
      var contextTypes = Component.contextTypes;
      if (!contextTypes) {
        return {};
      }
      var maskedContext = {};
      for (var contextName in contextTypes) {
        maskedContext[contextName] = context[contextName];
      }
      return maskedContext;
    }
  }, {
    key: '_processChildContext',
    value: function _processChildContext(currentContext) {
      var instance = this._instance;
      var childContext = instance.getChildContext && instance.getChildContext();
      if (childContext) {
        return Object.assign({}, currentContext, childContext);
      }
      return currentContext;
    }
  }, {
    key: '_processPendingState',
    value: function _processPendingState(props, context) {
      var instance = this._instance;
      var queue = this._pendingStateQueue;
      if (!queue) {
        return instance.state;
      }
      // Reset pending queue
      this._pendingStateQueue = null;
      var nextState = Object.assign({}, instance.state);
      for (var i = 0; i < queue.length; i++) {
        var partial = queue[i];
        Object.assign(nextState, typeof partial === 'function' ? partial.call(instance, nextState, props, context) : partial);
      }

      return nextState;
    }
  }, {
    key: 'updateComponent',
    value: function updateComponent(prevElement, nextElement, prevUnmaskedContext, nextUnmaskedContext) {
      var instance = this._instance;

      if (!instance) {
        console.error('Update component \'' + this.getName() + '\' that has already been unmounted (or failed to mount).');
      }

      var willReceive = false;
      var nextContext = void 0;
      var nextProps = void 0;

      // Determine if the context has changed or not
      if (this._context === nextUnmaskedContext) {
        nextContext = instance.context;
      } else {
        nextContext = this._processContext(nextUnmaskedContext);
        willReceive = true;
      }

      // Distinguish between a props update versus a simple state update
      if (prevElement === nextElement) {
        // Skip checking prop types again -- we don't read component.props to avoid
        // warning for DOM component props in this upgrade
        nextProps = nextElement.props;
      } else {
        nextProps = nextElement.props;
        willReceive = true;
      }

      var hasReceived = willReceive && instance.componentWillReceiveProps;

      if (hasReceived) {
        // Calling this.setState() within componentWillReceiveProps will not trigger an additional render.
        this._pendingState = true;
        performInSandbox(function () {
          instance.componentWillReceiveProps(nextProps, nextContext);
        }, instance);
        this._pendingState = false;
      }

      // Update refs
      _ref2.default.update(prevElement, nextElement, this);

      // Shoud update always default
      var shouldUpdate = true;
      var prevProps = instance.props;
      var prevState = instance.state;
      // TODO: could delay execution processPendingState
      var nextState = this._processPendingState(nextProps, nextContext);

      // ShouldComponentUpdate is not called when forceUpdate is used
      if (!this._pendingForceUpdate) {
        if (instance.shouldComponentUpdate) {
          shouldUpdate = performInSandbox(function () {
            return instance.shouldComponentUpdate(nextProps, nextState, nextContext);
          }, instance);
        } else if (instance.isPureComponentClass) {
          shouldUpdate = !(0, _shallowEqual2.default)(prevProps, nextProps) || !(0, _shallowEqual2.default)(prevState, nextState);
        }
      }

      if (shouldUpdate) {
        this._pendingForceUpdate = false;
        // Will set `this.props`, `this.state` and `this.context`.
        var prevContext = instance.context;

        // Cannot use this.setState() in componentWillUpdate.
        // If need to update state in response to a prop change, use componentWillReceiveProps instead.
        performInSandbox(function () {
          if (instance.componentWillUpdate) {
            instance.componentWillUpdate(nextProps, nextState, nextContext);
          }
        }, instance);

        // Replace with next
        this._currentElement = nextElement;
        this._context = nextUnmaskedContext;
        instance.props = nextProps;
        instance.state = nextState;
        instance.context = nextContext;

        this._updateRenderedComponent(nextUnmaskedContext);

        performInSandbox(function () {
          if (instance.componentDidUpdate) {
            instance.componentDidUpdate(prevProps, prevState, prevContext);
          }
        }, instance);

        this._updateCount++;
      } else {
        // If it's determined that a component should not update, we still want
        // to set props and state but we shortcut the rest of the update.
        this._currentElement = nextElement;
        this._context = nextUnmaskedContext;
        instance.props = nextProps;
        instance.state = nextState;
        instance.context = nextContext;
      }

      // Flush setState callbacks set in componentWillReceiveProps
      if (hasReceived) {
        var callbacks = this._pendingCallbacks;
        this._pendingCallbacks = null;
        _updater2.default.runCallbacks(callbacks, instance);
      }

      _host2.default.hook.Reconciler.receiveComponent(this);
    }

    /**
     * Call the component's `render` method and update the DOM accordingly.
     */

  }, {
    key: '_updateRenderedComponent',
    value: function _updateRenderedComponent(context) {
      var prevRenderedComponent = this._renderedComponent;
      var prevRenderedElement = prevRenderedComponent._currentElement;

      var instance = this._instance;
      var nextRenderedElement = void 0;

      _host2.default.component = this;

      performInSandbox(function () {
        {
          nextRenderedElement = instance.render();
        }
      }, instance);

      _host2.default.component = null;

      if ((0, _shouldUpdateComponent2.default)(prevRenderedElement, nextRenderedElement)) {
        prevRenderedComponent.updateComponent(prevRenderedElement, nextRenderedElement, prevRenderedComponent._context, this._processChildContext(context));
        
      } else {
        var oldChild = prevRenderedComponent.getNativeNode();
        prevRenderedComponent.unmountComponent(true);

        this._renderedComponent = (0, _instantiateComponent2.default)(nextRenderedElement);
        this._renderedComponent.mountComponent(this._parent, instance, this._processChildContext(context), function (newChild, parent) {
          // TODO: Duplicate code in native component file
          if (!Array.isArray(newChild)) {
            newChild = [newChild];
          }

          // oldChild or newChild all maybe fragment
          if (!Array.isArray(oldChild)) {
            oldChild = [oldChild];
          }

          // If newChild count large then oldChild
          var lastNewChild = void 0;
          for (var i = 0; i < newChild.length; i++) {
            var child = newChild[i];
            if (oldChild[i]) {
              _host2.default.driver.replaceChild(child, oldChild[i]);
            } else {
              _host2.default.driver.insertAfter(child, lastNewChild);
            }
            lastNewChild = child;
          }

          // If newChild count less then oldChild
          if (newChild.length < oldChild.length) {
            for (var _i = newChild.length; _i < oldChild.length; _i++) {
              _host2.default.driver.removeChild(oldChild[_i]);
            }
          }
        });
      }
    }
  }, {
    key: 'getNativeNode',
    value: function getNativeNode() {
      var renderedComponent = this._renderedComponent;
      if (renderedComponent) {
        return renderedComponent.getNativeNode();
      }
    }
  }, {
    key: 'getPublicInstance',
    value: function getPublicInstance() {
      var instance = this._instance;
      // The Stateless components cannot be given refs
      if (instance instanceof _stateless2.default) {
        return null;
      }
      return instance;
    }
  }]);

  return CompositeComponent;
}();

exports.default = CompositeComponent;
module.exports = exports['default'];

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Stateless Component Class Wrapper
 */
var StatelessComponent = function () {
  function StatelessComponent(pureRender) {
    _classCallCheck(this, StatelessComponent);

    // A stateless function
    this.pureRender = pureRender;
  }

  _createClass(StatelessComponent, [{
    key: 'render',
    value: function render() {
      return this.pureRender(this.props, this.context);
    }
  }]);

  return StatelessComponent;
}();

exports.default = StatelessComponent;
module.exports = exports['default'];

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
function enqueueCallback(internal, callback) {
  if (callback) {
    var callbackQueue = internal._pendingCallbacks || (internal._pendingCallbacks = []);
    callbackQueue.push(callback);
  }
}

function enqueueState(internal, partialState) {
  if (partialState) {
    var stateQueue = internal._pendingStateQueue || (internal._pendingStateQueue = []);
    stateQueue.push(partialState);
  }
}

var Updater = {
  setState: function setState(component, partialState, callback) {
    var internal = component._internal;

    if (!internal) {
      return;
    }

    enqueueState(internal, partialState);
    enqueueCallback(internal, callback);

    // pending in componentWillReceiveProps and componentWillMount
    if (!internal._pendingState && internal._renderedComponent) {
      this.runUpdate(component);
    }
  },

  forceUpdate: function forceUpdate(component, callback) {
    var internal = component._internal;

    if (!internal) {
      return;
    }

    internal._pendingForceUpdate = true;

    enqueueCallback(internal, callback);
    // pending in componentWillMount
    if (internal._renderedComponent) {
      this.runUpdate(component);
    }
  },

  runUpdate: function runUpdate(component) {
    var internal = component._internal;

    // If updateComponent happens to enqueue any new updates, we
    // shouldn't execute the callbacks until the next render happens, so
    // stash the callbacks first
    var callbacks = internal._pendingCallbacks;
    internal._pendingCallbacks = null;

    var prevElement = internal._currentElement;
    var prevUnmaskedContext = internal._context;

    if (internal._pendingStateQueue || internal._pendingForceUpdate) {
      internal.updateComponent(prevElement, prevElement, prevUnmaskedContext, prevUnmaskedContext);
    }

    this.runCallbacks(callbacks, component);
  },

  runCallbacks: function runCallbacks(callbacks, context) {
    if (callbacks) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i].call(context);
      }
    }
  }
};

exports.default = Updater;
module.exports = exports["default"];

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    return x !== 0 || 1 / x === 1 / y;
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  }
}

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual(objA, objB) {
  if (is(objA, objB)) {
    return true;
  }

  if ((typeof objA === 'undefined' ? 'undefined' : _typeof(objA)) !== 'object' || objA === null || (typeof objB === 'undefined' ? 'undefined' : _typeof(objB)) !== 'object' || objB === null) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

exports.default = shallowEqual;
module.exports = exports['default'];

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

var _native = __webpack_require__(11);

var _native2 = _interopRequireDefault(_native);

var _instance = __webpack_require__(1);

var _instance2 = _interopRequireDefault(_instance);

var _instantiateComponent = __webpack_require__(2);

var _instantiateComponent2 = _interopRequireDefault(_instantiateComponent);

var _getElementKeyName = __webpack_require__(13);

var _getElementKeyName2 = _interopRequireDefault(_getElementKeyName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Fragment Component
 */
var FragmentComponent = function (_NativeComponent) {
  _inherits(FragmentComponent, _NativeComponent);

  function FragmentComponent(element) {
    _classCallCheck(this, FragmentComponent);

    return _possibleConstructorReturn(this, (FragmentComponent.__proto__ || Object.getPrototypeOf(FragmentComponent)).call(this, element));
  }

  _createClass(FragmentComponent, [{
    key: 'mountComponent',
    value: function mountComponent(parent, parentInstance, context, childMounter) {
      // Parent native element
      this._parent = parent;
      this._parentInstance = parentInstance;
      this._context = context;
      this._mountID = _host2.default.mountID++;

      var instance = {
        _internal: this
      };
      this._instance = instance;

      var fragment = this.getNativeNode();
      var children = this._currentElement;

      // Process children
      this.mountChildren(children, context);

      if (childMounter) {
        childMounter(fragment, parent);
      } else {
        var isFragmentParent = Array.isArray(parent);
        for (var i = 0; i < fragment.length; i++) {
          var child = fragment[i];
          // When the parent is also a fragment
          if (isFragmentParent) {
            parent.push(child);
          } else {
            _host2.default.driver.appendChild(child, parent);
          }
        }
      }

      return instance;
    }
  }, {
    key: 'mountChildren',
    value: function mountChildren(children, context) {
      var _this2 = this;

      var renderedChildren = this._renderedChildren = {};
      var fragment = this.getNativeNode();

      var renderedChildrenImage = children.map(function (element, index) {
        var renderedChild = (0, _instantiateComponent2.default)(element);
        var name = (0, _getElementKeyName2.default)(renderedChildren, element, index);
        renderedChildren[name] = renderedChild;
        renderedChild._mountIndex = index;
        // Mount
        var mountImage = renderedChild.mountComponent(_this2._parent, _this2._instance, context, function (nativeNode) {
          if (Array.isArray(nativeNode)) {
            for (var i = 0; i < nativeNode.length; i++) {
              fragment.push(nativeNode[i]);
            }
          } else {
            fragment.push(nativeNode);
          }
        });
        return mountImage;
      });

      return renderedChildrenImage;
    }
  }, {
    key: 'unmountComponent',
    value: function unmountComponent(notRemoveChild) {
      if (this._nativeNode) {
        _instance2.default.remove(this._nativeNode);
        if (!notRemoveChild) {
          for (var i = 0; i < this._nativeNode.length; i++) {
            _host2.default.driver.removeChild(this._nativeNode[i]);
          }
        }
      }

      // Do not need remove child when their parent is removed
      this.unmountChildren(true);

      this._currentElement = null;
      this._nativeNode = null;
      this._parent = null;
      this._parentInstance = null;
      this._context = null;
      this._instance = null;
    }
  }, {
    key: 'updateComponent',
    value: function updateComponent(prevElement, nextElement, prevContext, nextContext) {
      // Replace current element
      this._currentElement = nextElement;
      this.updateChildren(this._currentElement, nextContext);
    }
  }, {
    key: 'getNativeNode',
    value: function getNativeNode() {
      if (this._nativeNode == null) {
        this._nativeNode = [];
      }

      return this._nativeNode;
    }
  }, {
    key: 'getPublicInstance',
    value: function getPublicInstance() {
      return this.getNativeNode();
    }
  }, {
    key: 'getName',
    value: function getName() {
      return 'fragment';
    }
  }]);

  return FragmentComponent;
}(_native2.default);

exports.default = FragmentComponent;
module.exports = exports['default'];

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
}; /**
    * Weex driver
    */

var _styleUnit = __webpack_require__(14);

var _elements = __webpack_require__(31);

var _elements2 = _interopRequireDefault(_elements);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var STYLE = 'style';
var ID = 'id';
var TEXT = 'text';
var CHILDREN = 'children';
var EVENT_PREFIX_REGEXP = /^on[A-Z]/;
var ARIA_PREFIX_REGEXP = /^aria-/;

var nodeMaps = {};
/* global __weex_document__ */
var document = (typeof __weex_document__ === 'undefined' ? 'undefined' : _typeof(__weex_document__)) === 'object' ? __weex_document__ : (typeof document === 'undefined' ? 'undefined' : _typeof(document)) === 'object' ? document : null;

var Driver = {
  deviceWidth: 750,
  viewportWidth: 750,

  getDeviceWidth: function getDeviceWidth() {
    return this.deviceWidth;
  },
  setDeviceWidth: function setDeviceWidth(width) {
    this.deviceWidth = width;
  },
  getViewportWidth: function getViewportWidth() {
    return this.viewportWidth;
  },
  setViewportWidth: function setViewportWidth(width) {
    this.viewportWidth = width;
  },
  getElementById: function getElementById(id) {
    return nodeMaps[id];
  },
  createBody: function createBody() {
    if (document.body) {
      return document.body;
    }

    var documentElement = document.documentElement;
    var body = document.createBody();
    documentElement.appendChild(body);

    return body;
  },
  createComment: function createComment(content) {
    return document.createComment(content);
  },
  createEmpty: function createEmpty() {
    return this.createComment(' empty ');
  },
  createText: function createText(text) {
    return Driver.createElement({
      type: TEXT,
      props: {
        value: text
      }
    });
  },
  updateText: function updateText(node, content) {
    this.setAttribute(node, 'value', content);
  },
  createElement: function createElement(component) {
    var htmlElement = _elements2.default[component.type];
    if (htmlElement) {
      component = htmlElement.parse(component);
    }

    var props = component.props;
    var style = {};
    var originStyle = props[STYLE];
    for (var prop in originStyle) {
      style[prop] = (0, _styleUnit.convertUnit)(originStyle[prop], prop);
    }

    var node = document.createElement(component.type, {
      style: style
    });

    this.setNativeProps(node, props, true);

    return node;
  },
  appendChild: function appendChild(node, parent) {
    return parent.appendChild(node);
  },
  removeChild: function removeChild(node, parent) {
    parent = parent || node.parentNode;
    var id = node.attr && node.attr[ID];
    if (id != null) {
      nodeMaps[id] = null;
    }
    return parent.removeChild(node);
  },
  replaceChild: function replaceChild(newChild, oldChild, parent) {
    parent = parent || oldChild.parentNode;
    var previousSibling = oldChild.previousSibling;
    var nextSibling = oldChild.nextSibling;
    this.removeChild(oldChild, parent);

    if (previousSibling) {
      this.insertAfter(newChild, previousSibling, parent);
    } else if (nextSibling) {
      this.insertBefore(newChild, nextSibling, parent);
    } else {
      this.appendChild(newChild, parent);
    }
  },
  insertAfter: function insertAfter(node, after, parent) {
    parent = parent || after.parentNode;
    return parent.insertAfter(node, after);
  },
  insertBefore: function insertBefore(node, before, parent) {
    parent = parent || before.parentNode;
    return parent.insertBefore(node, before);
  },
  addEventListener: function addEventListener(node, eventName, eventHandler, props) {
    var params = props[eventName + 'EventParams'];
    return node.addEvent(eventName, eventHandler, params);
  },
  removeEventListener: function removeEventListener(node, eventName, eventHandler) {
    return node.removeEvent(eventName, eventHandler);
  },
  removeAllEventListeners: function removeAllEventListeners(node) {
    // Noop
  },
  removeAttribute: function removeAttribute(node, propKey, propValue) {
    if (propKey == ID) {
      nodeMaps[propValue] = null;
    }
    // Weex native will crash when pass null value
    return node.setAttr(propKey, undefined, false);
  },
  setAttribute: function setAttribute(node, propKey, propValue) {
    if (propKey == ID) {
      nodeMaps[propValue] = node;
    }

    // Weex only support `ariaLabel` format, convert `aria-label` format to camelcase
    if (ARIA_PREFIX_REGEXP.test(propKey)) {
      propKey = propKey.replace(/\-(\w)/, function (m, p1) {
        return p1.toUpperCase();
      });
    }

    return node.setAttr(propKey, propValue, false);
  },
  setStyles: function setStyles(node, styles) {
    // TODO if more then one style update, call setStyles will be better performance
    for (var key in styles) {
      var val = styles[key];
      val = (0, _styleUnit.convertUnit)(val, key);
      node.setStyle(key, val);
    }
  },
  beforeRender: function beforeRender() {
    // Turn off batched updates
    document.open();

    // Init rem unit
    (0, _styleUnit.setRem)(this.getDeviceWidth() / this.getViewportWidth());
  },
  afterRender: function afterRender() {
    if (document.listener && document.listener.createFinish) {
      document.listener.createFinish();
    }

    // Turn on batched updates
    document.close();
  },
  setNativeProps: function setNativeProps(node, props, skipSetStyles) {
    for (var prop in props) {
      var value = props[prop];
      if (prop === CHILDREN) {
        continue;
      }

      if (value != null) {
        if (prop === STYLE) {
          if (skipSetStyles) {
            continue;
          }
          this.setStyles(node, value);
        } else if (EVENT_PREFIX_REGEXP.test(prop)) {
          var eventName = prop.slice(2).toLowerCase();
          this.addEventListener(node, eventName, value, props);
        } else {
          this.setAttribute(node, prop, value);
        }
      }
    }
  }
};

exports.default = Driver;
module.exports = exports['default'];

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _img = __webpack_require__(32);

var _img2 = _interopRequireDefault(_img);

var _video = __webpack_require__(33);

var _video2 = _interopRequireDefault(_video);

var _textarea = __webpack_require__(34);

var _textarea2 = _interopRequireDefault(_textarea);

var _span = __webpack_require__(35);

var _span2 = _interopRequireDefault(_span);

var _p = __webpack_require__(36);

var _p2 = _interopRequireDefault(_p);

var _button = __webpack_require__(37);

var _button2 = _interopRequireDefault(_button);

var _heading = __webpack_require__(38);

var _heading2 = _interopRequireDefault(_heading);

var _block = __webpack_require__(39);

var _block2 = _interopRequireDefault(_block);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = {
  span: _span2.default,
  p: _p2.default,
  img: _img2.default,
  button: _button2.default,
  video: _video2.default,
  textarea: _textarea2.default,
  h1: _heading2.default,
  h2: _heading2.default,
  h3: _heading2.default,
  h4: _heading2.default,
  h5: _heading2.default,
  h6: _heading2.default,
  nav: _block2.default,
  article: _block2.default,
  section: _block2.default,
  // Conflict with weex header tag
  // header: block,
  footer: _block2.default,
  aside: _block2.default,
  main: _block2.default
};
module.exports = exports['default'];

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _parseProps = __webpack_require__(15);

exports.default = {

  /**
   * parse w3c attrs to weex module attrs
   *
   * @param {Object} w3c component data
   * @return {Object} weex component data
   */
  parse: function parse(component) {
    var props = component.props;

    component.type = 'image';

    // modify props
    component.props = (0, _parseProps.transformPropsAttrsToStyle)(props, ['width', 'height']);

    return component;
  }
};
module.exports = exports['default'];

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _parseProps = __webpack_require__(15);

exports.default = {

  /**
   * parse w3c attrs to weex module attrs
   *
   * @param {Object} w3c component data
   * @return {Object} weex component data
   */
  parse: function parse(component) {
    var props = component.props;

    // modify props

    component.props = (0, _parseProps.transformPropsAttrsToStyle)(props, ['width', 'height']);

    return component;
  }
};
module.exports = exports['default'];

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {

  /**
   * parse w3c attrs to weex module attrs
   *
   * @param {Object} w3c component data
   * @return {Object} weex component data
   */
  parse: function parse(component) {
    var props = component.props;

    if (typeof props.children === 'string' && !props.value) {
      props.value = props.children;
      props.children = null;
    }

    return component;
  }
};
module.exports = exports['default'];

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  parse: function parse(component) {
    var props = component.props;

    component.type = 'text';

    if (typeof props.children === 'string' && !props.value) {
      props.value = props.children;
      props.children = null;
    }

    return component;
  }
};
module.exports = exports['default'];

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

var BASE_FONT_SIZE = 28;

var defaultParagraphStyle = {
  fontSize: BASE_FONT_SIZE,
  marginTop: BASE_FONT_SIZE,
  marginBottom: BASE_FONT_SIZE
};

var TypographyElements = {
  u: {
    textDecoration: 'underline'
  },
  s: {
    textDecoration: 'line-through'
  },
  i: {
    fontStyle: 'italic'
  },
  b: {
    fontWeight: 'bold'
  },
  del: {
    textDecoration: 'line-through'
  },
  em: {
    fontStyle: 'italic'
  },
  strong: {
    fontWeight: 'bold'
  },
  big: {
    fontSize: BASE_FONT_SIZE * 1.2
  },
  small: {
    fontSize: BASE_FONT_SIZE * 0.8
  }
};

function transformString(string) {
  return {
    type: 'span',
    attr: {
      value: string
    }
  };
}

function transformChild(child) {
  var type = child.type;
  var props = child.props;
  var style = props.style;
  var nestedChildren = props.children;
  // Alias img tag
  if (type === 'img') {
    type = 'image';
  }

  // Transfrom to span
  if (TypographyElements[type]) {
    style = _extends({}, TypographyElements[type], style);
    type = 'span';
  }

  props.style = null;
  props.children = null;

  var element = {
    type: type,
    style: style,
    attr: props || {}
  };

  if (nestedChildren) {
    if (type === 'span' && typeof nestedChildren === 'string') {
      element.attr.value = nestedChildren;
    } else {
      element.children = transformChildren(nestedChildren);
    }
  }

  return element;
}

function transformChildren(children) {
  var elements = [];
  if (!Array.isArray(children)) {
    children = [children];
  }

  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (typeof child === 'string') {
      elements.push(transformString(child));
    } else if ((typeof child === 'undefined' ? 'undefined' : _typeof(child)) === 'object') {
      elements.push(transformChild(child));
    }
  }

  return elements;
}

exports.default = {
  parse: function parse(component) {
    var props = component.props;

    var children = props.children;

    component.type = 'richtext';

    props.style = _extends({}, defaultParagraphStyle, props.style);

    props.value = transformChildren(children);
    props.children = null;

    return component;
  }
};
module.exports = exports['default'];

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

/**
 * weex button
 *
 * props: disabled, style
 */

exports.default = {
  parse: function parse(component) {
    var props = component.props;

    component.type = 'text';

    var style = props.style,
        disabled = props.disabled,
        children = props.children;

    var textStyle = _extends({
      textAlign: 'center',
      fontSize: 22,
      paddingTop: 4,
      paddingRight: 12,
      paddingBottom: 6,
      paddingLeft: 12,
      borderWidth: 4,
      borderStyle: 'solid',
      borderColor: '#000000',
      backgroudColor: '#c0c0c0'
    }, style);

    if (disabled) {
      props.onClick = null;
      textStyle = _extends({}, textStyle, {
        color: '#7f7f7f',
        borderColor: '#7f7f7f'
      });
    }

    if (typeof children === 'string') {
      props.value = children;
      props.children = null;
    }

    return component;
  }
};
module.exports = exports['default'];

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

var BASE_FONT_SIZE = 28;

function generateHeadingStyle(baseFontSize, fontMultiplier, marginMultiplier) {
  return {
    fontSize: baseFontSize * fontMultiplier,
    marginTop: baseFontSize * fontMultiplier * marginMultiplier,
    marginBottom: baseFontSize * fontMultiplier * marginMultiplier,
    fontWeight: 'bold'
  };
}

var HeadingElements = {
  h1: generateHeadingStyle(BASE_FONT_SIZE, 2, 0.67),
  h2: generateHeadingStyle(BASE_FONT_SIZE, 1.5, 0.83),
  h3: generateHeadingStyle(BASE_FONT_SIZE, 1.17, 1),
  h4: generateHeadingStyle(BASE_FONT_SIZE, 1, 1.33),
  h5: generateHeadingStyle(BASE_FONT_SIZE, 0.83, 1.67),
  h6: generateHeadingStyle(BASE_FONT_SIZE, 0.67, 2.33)
};

exports.default = {
  parse: function parse(component) {
    var type = component.type,
        props = component.props;

    component.type = 'text';
    props.style = _extends({}, HeadingElements[type] || HeadingElements.h6, props.style);

    if (typeof props.children === 'string' && !props.value) {
      props.value = props.children;
      props.children = null;
    }

    return component;
  }
};
module.exports = exports['default'];

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {

  /**
   * parse w3c attrs to weex module attrs
   *
   * @param {Object} w3c component data
   * @return {Object} weex component data
   */
  parse: function parse(component) {
    component.type = 'div';
    return component;
  }
};
module.exports = exports['default'];

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _styleUnit = __webpack_require__(14);

var _flexbox = __webpack_require__(41);

var _flexbox2 = _interopRequireDefault(_flexbox);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Web Browser driver
 **/

/* global DEVICE_WIDTH, VIEWPORT_WIDTH */

var DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
var CLASS_NAME = 'className';
var CLASS = 'class';
var STYLE = 'style';
var CHILDREN = 'children';
var EVENT_PREFIX_REGEXP = /on[A-Z]/;

var ADD_EVENT = 'addEvent';
var REMOVE_EVENT = 'removeEvent';

var Driver = {

  deviceWidth: typeof DEVICE_WIDTH !== 'undefined' && DEVICE_WIDTH || null,
  viewportWidth: typeof VIEWPORT_WIDTH !== 'undefined' && VIEWPORT_WIDTH || 750,
  eventRegistry: {},

  getDeviceWidth: function getDeviceWidth() {
    return this.deviceWidth || document.documentElement.clientWidth;
  },
  setDeviceWidth: function setDeviceWidth(width) {
    this.deviceWidth = width;
  },
  getViewportWidth: function getViewportWidth() {
    return this.viewportWidth;
  },
  setViewportWidth: function setViewportWidth(width) {
    this.viewportWidth = width;
  },
  getElementById: function getElementById(id) {
    return document.getElementById(id);
  },
  createBody: function createBody() {
    return document.body;
  },
  createComment: function createComment(content) {
    return document.createComment(content);
  },
  createEmpty: function createEmpty() {
    return this.createComment(' empty ');
  },
  createText: function createText(text) {
    return document.createTextNode(text);
  },
  updateText: function updateText(node, text) {
    var textContentAttr = 'textContent' in document ? 'textContent' : 'nodeValue';
    node[textContentAttr] = text;
  },
  createElement: function createElement(component) {
    var node = document.createElement(component.type);
    var props = component.props;

    this.setNativeProps(node, props);

    return node;
  },
  appendChild: function appendChild(node, parent) {
    return parent.appendChild(node);
  },
  removeChild: function removeChild(node, parent) {
    parent = parent || node.parentNode;
    // Maybe has been removed when remove child
    if (parent) {
      parent.removeChild(node);
    }
  },
  replaceChild: function replaceChild(newChild, oldChild, parent) {
    parent = parent || oldChild.parentNode;
    parent.replaceChild(newChild, oldChild);
  },
  insertAfter: function insertAfter(node, after, parent) {
    parent = parent || after.parentNode;
    var nextSibling = after.nextSibling;
    if (nextSibling) {
      parent.insertBefore(node, nextSibling);
    } else {
      parent.appendChild(node);
    }
  },
  insertBefore: function insertBefore(node, before, parent) {
    parent = parent || before.parentNode;
    parent.insertBefore(node, before);
  },
  addEventListener: function addEventListener(node, eventName, eventHandler, props) {
    if (this.eventRegistry[eventName]) {
      return this.eventRegistry[eventName](ADD_EVENT, node, eventName, eventHandler, props);
    } else {
      return node.addEventListener(eventName, eventHandler);
    }
  },
  removeEventListener: function removeEventListener(node, eventName, eventHandler, props) {
    if (this.eventRegistry[eventName]) {
      return this.eventRegistry[eventName](REMOVE_EVENT, node, eventName, eventHandler, props);
    } else {
      return node.removeEventListener(eventName, eventHandler);
    }
  },
  removeAllEventListeners: function removeAllEventListeners(node) {
    // noop
  },
  removeAttribute: function removeAttribute(node, propKey) {
    if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      return node.innerHTML = null;
    }

    if (propKey === CLASS_NAME) {
      propKey = CLASS;
    }

    if (propKey in node) {
      try {
        // Some node property is readonly when in strict mode
        node[propKey] = null;
      } catch (e) {}
    }

    node.removeAttribute(propKey);
  },
  setAttribute: function setAttribute(node, propKey, propValue) {
    if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      return node.innerHTML = propValue.__html;
    }

    if (propKey === CLASS_NAME) {
      propKey = CLASS;
    }

    if (propKey in node) {
      try {
        // Some node property is readonly when in strict mode
        node[propKey] = propValue;
      } catch (e) {
        node.setAttribute(propKey, propValue);
      }
    } else {
      node.setAttribute(propKey, propValue);
    }
  },
  setStyles: function setStyles(node, styles) {
    var tranformedStyles = {};

    for (var prop in styles) {
      var val = styles[prop];
      if (_flexbox2.default.isFlexProp(prop)) {
        _flexbox2.default[prop](val, tranformedStyles);
      } else {
        tranformedStyles[prop] = (0, _styleUnit.convertUnit)(val, prop);
      }
    }

    for (var _prop in tranformedStyles) {
      var transformValue = tranformedStyles[_prop];
      // hack handle compatibility issue
      if (Array.isArray(transformValue)) {
        for (var i = 0; i < transformValue.length; i++) {
          node.style[_prop] = transformValue[i];
        }
      } else {
        node.style[_prop] = transformValue;
      }
    }
  },
  beforeRender: function beforeRender() {
    // Init rem unit
    (0, _styleUnit.setRem)(this.getDeviceWidth() / this.getViewportWidth());
  },
  setNativeProps: function setNativeProps(node, props) {
    for (var prop in props) {
      var value = props[prop];
      if (prop === CHILDREN) {
        continue;
      }

      if (value != null) {
        if (prop === STYLE) {
          this.setStyles(node, value);
        } else if (EVENT_PREFIX_REGEXP.test(prop)) {
          var eventName = prop.slice(2).toLowerCase();
          this.addEventListener(node, eventName, value);
        } else {
          this.setAttribute(node, prop, value);
        }
      }
    }
  }
};

exports.default = Driver;
module.exports = exports['default'];

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
var BOX_ALIGN = {
  stretch: 'stretch',
  'flex-start': 'start',
  'flex-end': 'end',
  center: 'center'
};

var BOX_ORIENT = {
  row: 'horizontal',
  column: 'vertical'
};

var BOX_PACK = {
  'flex-start': 'start',
  'flex-end': 'end',
  center: 'center',
  'space-between': 'justify',
  'space-around': 'justify' // Just same as `space-between`
};

var FLEX_PROPS = {
  display: true,
  flex: true,
  alignItems: true,
  alignSelf: true,
  flexDirection: true,
  justifyContent: true,
  flexWrap: true
};

var Flexbox = {
  isFlexProp: function isFlexProp(prop) {
    return FLEX_PROPS[prop];
  },
  display: function display(value) {
    var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (value === 'flex') {
      style.display = ['-webkit-box', '-webkit-flex', 'flex'];
    } else {
      style.display = value;
    }

    return style;
  },
  flex: function flex(value) {
    var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    style.webkitBoxFlex = value;
    style.webkitFlex = value;
    style.flex = value;
    return style;
  },
  flexWrap: function flexWrap(value) {
    var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    style.flexWrap = value;
    return style;
  },
  alignItems: function alignItems(value) {
    var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    style.webkitBoxAlign = BOX_ALIGN[value];
    style.webkitAlignItems = value;
    style.alignItems = value;
    return style;
  },
  alignSelf: function alignSelf(value) {
    var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    style.webkitAlignSelf = value;
    style.alignSelf = value;
    return style;
  },
  flexDirection: function flexDirection(value) {
    var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    style.webkitBoxOrient = BOX_ORIENT[value];
    style.webkitFlexDirection = value;
    style.flexDirection = value;
    return style;
  },
  justifyContent: function justifyContent(value) {
    var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    style.webkitBoxPack = BOX_PACK[value];
    style.webkitJustifyContent = value;
    style.justifyContent = value;
    return style;
  }
};

exports.default = Flexbox;
module.exports = exports['default'];

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _render = __webpack_require__(10);

var _render2 = _interopRequireDefault(_render);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function hydrate(element, container, options, callback) {
  // Handle server rendered element
  if (container.childNodes) {
    // Clone childNodes, Because removeChild will causing change in childNodes length
    var childNodes = [].concat(_toConsumableArray(container.childNodes));

    for (var i = 0; i < childNodes.length; i++) {
      var rootChildNode = childNodes[i];
      container.removeChild(rootChildNode);
    }
  }

  return (0, _render2.default)(element, container, options, callback);
}

exports.default = hydrate;
module.exports = exports['default'];

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _instance = __webpack_require__(1);

var _instance2 = _interopRequireDefault(_instance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findComponentInstance(node) {
  if (node == null) {
    return null;
  }
  return _instance2.default.get(node);
}

exports.default = findComponentInstance;
module.exports = exports['default'];

/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = setNativeProps;

var _host = __webpack_require__(0);

var _host2 = _interopRequireDefault(_host);

var _findDOMNode = __webpack_require__(16);

var _findDOMNode2 = _interopRequireDefault(_findDOMNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setNativeProps(node, props) {
  node = (0, _findDOMNode2.default)(node);
  _host2.default.driver.setNativeProps(node, props);
}
module.exports = exports['default'];

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = '0.4.20';
module.exports = exports['default'];

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _flattenChildren = __webpack_require__(7);

var _flattenChildren2 = _interopRequireDefault(_flattenChildren);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function convertChildrenToArray(children) {
  // flatten children
  children = (0, _flattenChildren2.default)(children, []);
  return Array.isArray(children) ? children : [].concat(children);
}

var Children = {
  map: function map(children, fn, ctx) {
    if (children == null) return null;
    children = convertChildrenToArray(children);
    return children.map(function (child, index) {
      return fn.call(ctx, child, index);
    });
  },
  forEach: function forEach(children, fn, ctx) {
    if (children == null) return null;
    children = convertChildrenToArray(children);
    children.forEach(function (child, index) {
      return fn.call(ctx, child, index);
    });
  },
  count: function count(children) {
    if (children == null) return 0;
    return convertChildrenToArray(children).length;
  },
  only: function only(children) {
    // `only` receive rax element child
    // null value is not acceptable
    children = Children.toArray(children);
    if (children.length !== 1) throw new Error('Children.only: expected to receive a single element child.');
    return children[0];
  },
  toArray: function toArray(children) {
    if (children == null) return [];
    // `toArray` filter null value
    return convertChildrenToArray(children).filter(function (child) {
      return child !== null;
    });
  }
};

exports.default = Children;
module.exports = exports['default'];

/***/ })
/******/ ]);};


/***/ }),
/* 6 */
/*!*********************************************************!*\
  !*** ./packages/runtime-shared/dist/shared.function.js ***!
  \*********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports) {

module.exports = function() {
  return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint no-extend-native: "off", new-cap: "off" */

var defineProperties = Object.defineProperties,
    defineProperty = Object.defineProperty,
    SymbolPolyfill,
    HiddenSymbol,
    globalSymbols = Object.create(null);

function isSymbol(x) {
  if (!x) return false;
  if ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'symbol') return true;
  if (!x.constructor) return false;
  if (x.constructor.name !== 'Symbol') return false;
  return x[x.constructor.toStringTag] === 'Symbol';
}

function validateSymbol(value) {
  if (!isSymbol(value)) throw new TypeError(value + ' is not a symbol');
  return value;
}

var generateName = function () {
  var created = Object.create(null);
  return function (desc) {
    var postfix = 0,
        name;
    while (created[desc + (postfix || '')]) {
      ++postfix;
    }desc += postfix || '';
    created[desc] = true;
    name = '@@' + desc;
    return name;
  };
}();

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function _Symbol(description) {
  if (this instanceof HiddenSymbol) throw new TypeError('Symbol is not a constructor');
  return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
module.exports = SymbolPolyfill = function _Symbol2(description) {
  var symbol;
  if (this instanceof _Symbol2) throw new TypeError('Symbol is not a constructor');
  symbol = Object.create(HiddenSymbol.prototype);
  description = description === undefined ? '' : String(description);
  return defineProperties(symbol, {
    __description__: { value: description },
    __name__: { value: generateName(description) }
  });
};
defineProperties(SymbolPolyfill, {
  for: { value: function value(key) {
      if (globalSymbols[key]) return globalSymbols[key];
      return globalSymbols[key] = SymbolPolyfill(String(key));
    } },
  keyFor: { value: function value(s) {
      var key;
      validateSymbol(s);
      for (key in globalSymbols) {
        if (globalSymbols[key] === s) return key;
      }
    } },

  // To ensure proper interoperability with other native functions (e.g. Array.from)
  // fallback to eventual native implementation of given symbol
  hasInstance: { value: SymbolPolyfill('hasInstance') },
  isConcatSpreadable: { value: SymbolPolyfill('isConcatSpreadable') },
  iterator: { value: SymbolPolyfill('iterator') },
  match: { value: SymbolPolyfill('match') },
  replace: { value: SymbolPolyfill('replace') },
  search: { value: SymbolPolyfill('search') },
  species: { value: SymbolPolyfill('species') },
  split: { value: SymbolPolyfill('split') },
  toPrimitive: { value: SymbolPolyfill('toPrimitive') },
  toStringTag: { value: SymbolPolyfill('toStringTag') },
  unscopables: { value: SymbolPolyfill('unscopables') }
});

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
  constructor: { value: SymbolPolyfill },
  toString: { value: function value() {
      return this.__name__;
    } }
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
  toString: { value: function value() {
      return 'Symbol (' + validateSymbol(this).__description__ + ')';
    } },
  valueOf: { value: function value() {
      return validateSymbol(this);
    } }
});

defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, {
  value: function value() {
    var symbol = validateSymbol(this);
    if ((typeof symbol === 'undefined' ? 'undefined' : _typeof(symbol)) === 'symbol') return symbol;
    return symbol.toString();
  }
});
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, { value: 'Symbol' });

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag, { value: SymbolPolyfill.prototype[SymbolPolyfill.toStringTag] });

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive, { value: SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive] });

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // https://github.com/WebReflection/url-search-params


var _symbol = __webpack_require__(0);

var _symbol2 = _interopRequireDefault(_symbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var find = /[!'\(\)~]|%20|%00/g;
var plus = /\+/g;
var replace = {
  '!': '%21',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '~': '%7E',
  '%20': '+',
  '%00': '\x00'
};
var replacer = function replacer(match) {
  return replace[match];
};
var secret = '__URLSearchParams__';

function encode(str) {
  return encodeURIComponent(str).replace(find, replacer);
}

function decode(str) {
  return decodeURIComponent(str.replace(plus, ' '));
}

var URLSearchParams = function () {
  function URLSearchParams(query) {
    _classCallCheck(this, URLSearchParams);

    this[secret] = Object.create(null);
    if (!query) return;
    if (query.charAt(0) === '?') {
      query = query.slice(1);
    }
    for (var index, value, pairs = (query || '').split('&'), i = 0, length = pairs.length; i < length; i++) {
      value = pairs[i];
      index = value.indexOf('=');
      if (-1 < index) {
        this.append(decode(value.slice(0, index)), decode(value.slice(index + 1)));
      } else if (value.length) {
        this.append(decode(value), '');
      }
    }
  }

  _createClass(URLSearchParams, [{
    key: 'append',
    value: function append(name, value) {
      var dict = this[secret];
      if (name in dict) {
        dict[name].push('' + value);
      } else {
        dict[name] = ['' + value];
      }
    }
  }, {
    key: 'delete',
    value: function _delete(name) {
      delete this[secret][name];
    }
  }, {
    key: 'get',
    value: function get(name) {
      var dict = this[secret];
      return name in dict ? dict[name][0] : null;
    }
  }, {
    key: 'getAll',
    value: function getAll(name) {
      var dict = this[secret];
      return name in dict ? dict[name].slice(0) : [];
    }
  }, {
    key: 'has',
    value: function has(name) {
      return name in this[secret];
    }
  }, {
    key: 'set',
    value: function set(name, value) {
      this[secret][name] = ['' + value];
    }
  }, {
    key: 'forEach',
    value: function forEach(callback, thisArg) {
      var dict = this[secret];
      Object.getOwnPropertyNames(dict).forEach(function (name) {
        dict[name].forEach(function (value) {
          callback.call(thisArg, value, name, this);
        }, this);
      }, this);
    }
  }, {
    key: 'keys',
    value: function keys() {
      var items = [];
      this.forEach(function (value, name) {
        items.push(name);
      });
      var iterator = {
        next: function next() {
          var value = items.shift();
          return { done: value === undefined, value: value };
        }
      };

      iterator[_symbol2.default.iterator] = function () {
        return iterator;
      };

      return iterator;
    }
  }, {
    key: 'values',
    value: function values() {
      var items = [];
      this.forEach(function (value) {
        items.push(value);
      });
      var iterator = {
        next: function next() {
          var value = items.shift();
          return { done: value === undefined, value: value };
        }
      };

      iterator[_symbol2.default.iterator] = function () {
        return iterator;
      };

      return iterator;
    }
  }, {
    key: 'entries',
    value: function entries() {
      var items = [];
      this.forEach(function (value, name) {
        items.push([name, value]);
      });
      var iterator = {
        next: function next() {
          var value = items.shift();
          return { done: value === undefined, value: value };
        }
      };

      iterator[_symbol2.default.iterator] = function () {
        return iterator;
      };

      return iterator;
    }
  }, {
    key: 'toString',
    value: function toString() {
      var dict = this[secret],
          query = [],
          i,
          key,
          name,
          value;
      for (key in dict) {
        name = encode(key);
        for (i = 0, value = dict[key]; i < value.length; i++) {
          query.push(name + '=' + encode(value[i]));
        }
      }
      return query.join('&');
    }
  }]);

  return URLSearchParams;
}();

URLSearchParams.prototype[_symbol2.default.iterator] = URLSearchParams.prototype.entries;

module.exports = URLSearchParams;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  get Promise() {
    return __webpack_require__(3);
  },
  get Symbol() {
    return __webpack_require__(0);
  },
  get Map() {
    return __webpack_require__(4);
  },
  get Set() {
    return __webpack_require__(5);
  },
  get WeakMap() {
    return __webpack_require__(6);
  },
  get WeakSet() {
    return __webpack_require__(7);
  },
  get FontFace() {
    return __webpack_require__(8);
  },
  get URL() {
    return __webpack_require__(9);
  },
  get URLSearchParams() {
    return __webpack_require__(1);
  },
  get matchMedia() {
    return __webpack_require__(10);
  }
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint no-extend-native: "off" */

function noop() {}

// Use polyfill for setImmediate for performance gains
var asap = typeof setImmediate === 'function' && setImmediate || function (fn) {
  if (typeof setTimeout === 'function') {
    setTimeout(fn, 0);
  } else {
    fn();
  }
};

var onUnhandledRejection = function onUnhandledRejection(err) {
  if (typeof console !== 'undefined' && console) {
    console.log('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function () {
    fn.apply(thisArg, arguments);
  };
}

function Promise(fn) {
  if (_typeof(this) !== 'object') throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('Promise resolver is not a function');
  this._state = 0;
  this._handled = false;
  this._value = undefined;
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  asap(function () {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
    if (newValue && ((typeof newValue === 'undefined' ? 'undefined' : _typeof(newValue)) === 'object' || typeof newValue === 'function')) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    asap(function () {
      if (!self._handled) {
        onUnhandledRejection(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return;
      done = true;
      resolve(self, value);
    }, function (reason) {
      if (done) return;
      done = true;
      reject(self, reason);
    });
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function (onFulfilled, onRejected) {
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(val, function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function (value) {
  if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function (resolve) {
    resolve(value);
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    for (var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
};

/**
 * Set the immediate function to execute callbacks
 * @param fn {function} Function to execute
 * @private
 */
Promise._setImmediateFn = function _setImmediateFn(fn) {
  asap = fn;
};

Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
  onUnhandledRejection = fn;
};

module.exports = Promise;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var _symbol = __webpack_require__(0);

var _symbol2 = _interopRequireDefault(_symbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Deleted map items mess with iterator pointers, so rather than removing them mark them as deleted. Can't use undefined or null since those both valid keys so use a private symbol.
var undefMarker = (0, _symbol2.default)('undef');
// NaN cannot be found in an array using indexOf, so we encode NaNs using a private symbol.
/* eslint no-extend-native: "off" */
var NaNMarker = (0, _symbol2.default)('NaN');
var ACCESSOR_SUPPORT = true;

function encodeKey(key) {
  return Number.isNaN(key) ? NaNMarker : key;
}

function decodeKey(encodedKey) {
  return encodedKey === NaNMarker ? NaN : encodedKey;
}

function makeIterator(mapInst, getter) {
  var nextIdx = 0;
  var done = false;
  return {
    next: function next() {
      if (nextIdx === mapInst._keys.length) done = true;
      if (!done) {
        while (mapInst._keys[nextIdx] === undefMarker) {
          nextIdx++;
        }return { value: getter.call(mapInst, nextIdx++), done: false };
      } else {
        return { value: void 0, done: true };
      }
    }
  };
}

function calcSize(mapInst) {
  var size = 0;
  for (var i = 0, s = mapInst._keys.length; i < s; i++) {
    if (mapInst._keys[i] !== undefMarker) size++;
  }
  return size;
}

function hasProtoMethod(instance, method) {
  return typeof instance[method] === 'function';
}

var Map = function Map(data) {
  this._keys = [];
  this._values = [];
  // If `data` is iterable (indicated by presence of a forEach method), pre-populate the map
  if (data && hasProtoMethod(data, 'forEach')) {
    // Fastpath: If `data` is a Map, shortcircuit all following the checks
    if (data instanceof Map ||
    // If `data` is not an instance of Map, it could be because you have a Map from an iframe or a worker or something.
    // Check if  `data` has all the `Map` methods and if so, assume data is another Map
    hasProtoMethod(data, 'clear') && hasProtoMethod(data, 'delete') && hasProtoMethod(data, 'entries') && hasProtoMethod(data, 'forEach') && hasProtoMethod(data, 'get') && hasProtoMethod(data, 'has') && hasProtoMethod(data, 'keys') && hasProtoMethod(data, 'set') && hasProtoMethod(data, 'values')) {
      data.forEach(function (value, key) {
        this.set.apply(this, [key, value]);
      }, this);
    } else {
      data.forEach(function (item) {
        this.set.apply(this, item);
      }, this);
    }
  }

  if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
};
Map.prototype = {};

// Some old engines do not support ES5 getters/setters.  Since Map only requires these for the size property, we can fall back to setting the size property statically each time the size of the map changes.
try {
  Object.defineProperty(Map.prototype, 'size', {
    get: function get() {
      return calcSize(this);
    }
  });
} catch (e) {
  ACCESSOR_SUPPORT = false;
}

Map.prototype.get = function (key) {
  var idx = this._keys.indexOf(encodeKey(key));
  return idx !== -1 ? this._values[idx] : undefined;
};
Map.prototype.set = function (key, value) {
  var idx = this._keys.indexOf(encodeKey(key));
  if (idx !== -1) {
    this._values[idx] = value;
  } else {
    this._keys.push(encodeKey(key));
    this._values.push(value);
    if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
  }
  return this;
};
Map.prototype.has = function (key) {
  return this._keys.indexOf(encodeKey(key)) !== -1;
};
Map.prototype.delete = function (key) {
  var idx = this._keys.indexOf(encodeKey(key));
  if (idx === -1) return false;
  this._keys[idx] = undefMarker;
  this._values[idx] = undefMarker;
  if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
  return true;
};
Map.prototype.clear = function () {
  this._keys = this._values = [];
  if (!ACCESSOR_SUPPORT) this.size = 0;
};
Map.prototype.values = function () {
  return makeIterator(this, function (i) {
    return this._values[i];
  });
};
Map.prototype.keys = function () {
  return makeIterator(this, function (i) {
    return decodeKey(this._keys[i]);
  });
};
Map.prototype.entries = Map.prototype[_symbol2.default.iterator] = function () {
  return makeIterator(this, function (i) {
    return [decodeKey(this._keys[i]), this._values[i]];
  });
};
Map.prototype.forEach = function (callbackFn, thisArg) {
  thisArg = thisArg || global;
  var iterator = this.entries();
  var result = iterator.next();
  while (result.done === false) {
    callbackFn.call(thisArg, result.value[1], result.value[0], this);
    result = iterator.next();
  }
};

Map.prototype[_symbol2.default.species] = Map;

Object.defineProperty(Map, 'constructor', {
  value: Map
});

try {
  Object.defineProperty(Map, 'length', {
    value: 0
  });
} catch (e) {}

module.exports = Map;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var _symbol = __webpack_require__(0);

var _symbol2 = _interopRequireDefault(_symbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Deleted map items mess with iterator pointers, so rather than removing them mark them as deleted. Can't use undefined or null since those both valid keys so use a private symbol.
var undefMarker = (0, _symbol2.default)('undef');

// NaN cannot be found in an array using indexOf, so we encode NaNs using a private symbol.
/* eslint no-extend-native: "off" */
var NaNMarker = (0, _symbol2.default)('NaN');

var ACCESSOR_SUPPORT = true;

function encodeVal(data) {
  return Number.isNaN(data) ? NaNMarker : data;
}

function decodeVal(encodedData) {
  return encodedData === NaNMarker ? NaN : encodedData;
}

function makeIterator(setInst, getter) {
  var nextIdx = 0;
  return {
    next: function next() {
      while (setInst._values[nextIdx] === undefMarker) {
        nextIdx++;
      }if (nextIdx === setInst._values.length) {
        return { value: void 0, done: true };
      } else {
        return { value: getter.call(setInst, nextIdx++), done: false };
      }
    }
  };
}

function calcSize(setInst) {
  var size = 0;
  for (var i = 0, s = setInst._values.length; i < s; i++) {
    if (setInst._values[i] !== undefMarker) size++;
  }
  return size;
}

var Set = function Set(data) {
  this._values = [];

  // If `data` is iterable (indicated by presence of a forEach method), pre-populate the set
  data && typeof data.forEach === 'function' && data.forEach(function (item) {
    this.add.call(this, item);
  }, this);

  if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
};

// Some old engines do not support ES5 getters/setters.  Since Set only requires these for the size property, we can fall back to setting the size property statically each time the size of the set changes.
try {
  Object.defineProperty(Set.prototype, 'size', {
    get: function get() {
      return calcSize(this);
    }
  });
} catch (e) {
  ACCESSOR_SUPPORT = false;
}

Set.prototype.add = function (value) {
  value = encodeVal(value);
  if (this._values.indexOf(value) === -1) {
    this._values.push(value);
    if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
  }
  return this;
};
Set.prototype.has = function (value) {
  return this._values.indexOf(encodeVal(value)) !== -1;
};
Set.prototype.delete = function (value) {
  var idx = this._values.indexOf(encodeVal(value));
  if (idx === -1) return false;
  this._values[idx] = undefMarker;
  if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
  return true;
};
Set.prototype.clear = function () {
  this._values = [];
  if (!ACCESSOR_SUPPORT) this.size = 0;
};
Set.prototype.values = Set.prototype.keys = function () {
  return makeIterator(this, function (i) {
    return decodeVal(this._values[i]);
  });
};
Set.prototype.entries = Set.prototype[_symbol2.default.iterator] = function () {
  return makeIterator(this, function (i) {
    return [decodeVal(this._values[i]), decodeVal(this._values[i])];
  });
};
Set.prototype.forEach = function (callbackFn, thisArg) {
  thisArg = thisArg || global;
  var iterator = this.entries();
  var result = iterator.next();
  while (result.done === false) {
    callbackFn.call(thisArg, result.value[1], result.value[0], this);
    result = iterator.next();
  }
};

Set.prototype[_symbol2.default.species] = Set;

Object.defineProperty(Set, 'constructor', {
  value: Set
});

try {
  Object.defineProperty(Set, 'length', {
    value: 0
  });
} catch (e) {}

module.exports = Set;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint no-extend-native: "off" */

var defineProperty = Object.defineProperty;
var counter = Date.now() % 1e9;

var WeakMap = function WeakMap(data) {
  this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');

  // If data is iterable (indicated by presence of a forEach method), pre-populate the map
  data && data.forEach && data.forEach(function (item) {
    this.set.apply(this, item);
  }, this);
};

WeakMap.prototype.set = function (key, value) {
  if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) !== 'object' && typeof key !== 'function') throw new TypeError('Invalid value used as weak map key');

  var entry = key[this.name];
  if (entry && entry[0] === key) entry[1] = value;else defineProperty(key, this.name, { value: [key, value], writable: true });
  return this;
};

WeakMap.prototype.get = function (key) {
  var entry;
  return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
};

WeakMap.prototype.delete = function (key) {
  var entry = key[this.name];
  if (!entry || entry[0] !== key) return false;
  entry[0] = entry[1] = undefined;
  return true;
};

WeakMap.prototype.has = function (key) {
  var entry = key[this.name];
  if (!entry) return false;
  return entry[0] === key;
};

module.exports = WeakMap;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

var counter = Date.now() % 1e9;

var WeakSet = function WeakSet(data) {
  this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
  data && data.forEach && data.forEach(this.add, this);
};

WeakSet.prototype.add = function (obj) {
  var name = this.name;
  if (!obj[name]) Object.defineProperty(obj, name, { value: true, writable: true });
  return this;
};

WeakSet.prototype.delete = function (obj) {
  if (!obj[this.name]) return false;
  obj[this.name] = undefined;
  return true;
};

WeakSet.prototype.has = function (obj) {
  return !!obj[this.name];
};

module.exports = WeakSet;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FontFace = function FontFace(family, source) {
  _classCallCheck(this, FontFace);

  this.family = family;
  this.source = source;
};

module.exports = FontFace;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var URLSearchParams = __webpack_require__(1);

var relative = Object.create(null);
relative.ftp = 21;
relative.file = 0;
relative.gopher = 70;
relative.http = 80;
relative.https = 443;
relative.ws = 80;
relative.wss = 443;

var relativePathDotMapping = Object.create(null);
relativePathDotMapping['%2e'] = '.';
relativePathDotMapping['.%2e'] = '..';
relativePathDotMapping['%2e.'] = '..';
relativePathDotMapping['%2e%2e'] = '..';

function isRelativeScheme(scheme) {
  return relative[scheme] !== undefined;
}

function invalid() {
  clear.call(this);
  this._isInvalid = true;
}

function IDNAToASCII(h) {
  if ('' == h) {
    invalid.call(this);
  }
  // XXX
  return h.toLowerCase();
}

function percentEscape(c) {
  var unicode = c.charCodeAt(0);
  if (unicode > 0x20 && unicode < 0x7F &&
  // " # < > ? `
  [0x22, 0x23, 0x3C, 0x3E, 0x3F, 0x60].indexOf(unicode) == -1) {
    return c;
  }
  return encodeURIComponent(c);
}

function percentEscapeQuery(c) {
  // XXX This actually needs to encode c using encoding and then
  // convert the bytes one-by-one.

  var unicode = c.charCodeAt(0);
  if (unicode > 0x20 && unicode < 0x7F &&
  // " # < > ` (do not escape '?')
  [0x22, 0x23, 0x3C, 0x3E, 0x60].indexOf(unicode) == -1) {
    return c;
  }
  return encodeURIComponent(c);
}

var EOF = undefined,
    ALPHA = /[a-zA-Z]/,
    ALPHANUMERIC = /[a-zA-Z0-9\+\-\.]/;

function parse(input, stateOverride, base) {
  function err(message) {
    errors.push(message);
  }

  var state = stateOverride || 'scheme start',
      cursor = 0,
      buffer = '',
      seenAt = false,
      seenBracket = false,
      errors = [];

  loop: while ((input[cursor - 1] != EOF || cursor == 0) && !this._isInvalid) {
    var c = input[cursor];
    switch (state) {
      case 'scheme start':
        if (c && ALPHA.test(c)) {
          buffer += c.toLowerCase(); // ASCII-safe
          state = 'scheme';
        } else if (!stateOverride) {
          buffer = '';
          state = 'no scheme';
          continue;
        } else {
          err('Invalid scheme.');
          break loop;
        }
        break;

      case 'scheme':
        if (c && ALPHANUMERIC.test(c)) {
          buffer += c.toLowerCase(); // ASCII-safe
        } else if (':' == c) {
          this._scheme = buffer;
          buffer = '';
          if (stateOverride) {
            break loop;
          }
          if (isRelativeScheme(this._scheme)) {
            this._isRelative = true;
          }
          if ('file' == this._scheme) {
            state = 'relative';
          } else if (this._isRelative && base && base._scheme == this._scheme) {
            state = 'relative or authority';
          } else if (this._isRelative) {
            state = 'authority first slash';
          } else {
            state = 'scheme data';
          }
        } else if (!stateOverride) {
          buffer = '';
          cursor = 0;
          state = 'no scheme';
          continue;
        } else if (EOF == c) {
          break loop;
        } else {
          err('Code point not allowed in scheme: ' + c);
          break loop;
        }
        break;

      case 'scheme data':
        if ('?' == c) {
          state = 'query';
        } else if ('#' == c) {
          this._fragment = '#';
          state = 'fragment';
        } else {
          // XXX error handling
          if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
            this._schemeData += percentEscape(c);
          }
        }
        break;

      case 'no scheme':
        if (!base || !isRelativeScheme(base._scheme)) {
          err('Missing scheme.');
          invalid.call(this);
        } else {
          state = 'relative';
          continue;
        }
        break;

      case 'relative or authority':
        if ('/' == c && '/' == input[cursor + 1]) {
          state = 'authority ignore slashes';
        } else {
          err('Expected /, got: ' + c);
          state = 'relative';
          continue;
        }
        break;

      case 'relative':
        this._isRelative = true;
        if ('file' != this._scheme) this._scheme = base._scheme;
        if (EOF == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = base._query;
          this._username = base._username;
          this._password = base._password;
          break loop;
        } else if ('/' == c || '\\' == c) {
          if ('\\' == c) err('\\ is an invalid code point.');
          state = 'relative slash';
        } else if ('?' == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = '?';
          this._username = base._username;
          this._password = base._password;
          state = 'query';
        } else if ('#' == c) {
          this._host = base._host;
          this._port = base._port;
          this._path = base._path.slice();
          this._query = base._query;
          this._fragment = '#';
          this._username = base._username;
          this._password = base._password;
          state = 'fragment';
        } else {
          var nextC = input[cursor + 1];
          var nextNextC = input[cursor + 2];
          if ('file' != this._scheme || !ALPHA.test(c) || nextC != ':' && nextC != '|' || EOF != nextNextC && '/' != nextNextC && '\\' != nextNextC && '?' != nextNextC && '#' != nextNextC) {
            this._host = base._host;
            this._port = base._port;
            this._username = base._username;
            this._password = base._password;
            this._path = base._path.slice();
            this._path.pop();
          }
          state = 'relative path';
          continue;
        }
        break;

      case 'relative slash':
        if ('/' == c || '\\' == c) {
          if ('\\' == c) {
            err('\\ is an invalid code point.');
          }
          if ('file' == this._scheme) {
            state = 'file host';
          } else {
            state = 'authority ignore slashes';
          }
        } else {
          if ('file' != this._scheme) {
            this._host = base._host;
            this._port = base._port;
            this._username = base._username;
            this._password = base._password;
          }
          state = 'relative path';
          continue;
        }
        break;

      case 'authority first slash':
        if ('/' == c) {
          state = 'authority second slash';
        } else {
          err("Expected '/', got: " + c);
          state = 'authority ignore slashes';
          continue;
        }
        break;

      case 'authority second slash':
        state = 'authority ignore slashes';
        if ('/' != c) {
          err("Expected '/', got: " + c);
          continue;
        }
        break;

      case 'authority ignore slashes':
        if ('/' != c && '\\' != c) {
          state = 'authority';
          continue;
        } else {
          err('Expected authority, got: ' + c);
        }
        break;

      case 'authority':
        if ('@' == c) {
          if (seenAt) {
            err('@ already seen.');
            buffer += '%40';
          }
          seenAt = true;
          for (var i = 0; i < buffer.length; i++) {
            var cp = buffer[i];
            if ('\t' == cp || '\n' == cp || '\r' == cp) {
              err('Invalid whitespace in authority.');
              continue;
            }
            // XXX check URL code points
            if (':' == cp && null === this._password) {
              this._password = '';
              continue;
            }
            var tempC = percentEscape(cp);
            null !== this._password ? this._password += tempC : this._username += tempC;
          }
          buffer = '';
        } else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
          cursor -= buffer.length;
          buffer = '';
          state = 'host';
          continue;
        } else {
          buffer += c;
        }
        break;

      case 'file host':
        if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
          if (buffer.length == 2 && ALPHA.test(buffer[0]) && (buffer[1] == ':' || buffer[1] == '|')) {
            state = 'relative path';
          } else if (buffer.length == 0) {
            state = 'relative path start';
          } else {
            this._host = IDNAToASCII.call(this, buffer);
            buffer = '';
            state = 'relative path start';
          }
          continue;
        } else if ('\t' == c || '\n' == c || '\r' == c) {
          err('Invalid whitespace in file host.');
        } else {
          buffer += c;
        }
        break;

      case 'host':
      case 'hostname':
        if (':' == c && !seenBracket) {
          // XXX host parsing
          this._host = IDNAToASCII.call(this, buffer);
          buffer = '';
          state = 'port';
          if ('hostname' == stateOverride) {
            break loop;
          }
        } else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
          this._host = IDNAToASCII.call(this, buffer);
          buffer = '';
          state = 'relative path start';
          if (stateOverride) {
            break loop;
          }
          continue;
        } else if ('\t' != c && '\n' != c && '\r' != c) {
          if ('[' == c) {
            seenBracket = true;
          } else if (']' == c) {
            seenBracket = false;
          }
          buffer += c;
        } else {
          err('Invalid code point in host/hostname: ' + c);
        }
        break;

      case 'port':
        if (/[0-9]/.test(c)) {
          buffer += c;
        } else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c || stateOverride) {
          if ('' != buffer) {
            var temp = parseInt(buffer, 10);
            if (temp != relative[this._scheme]) {
              this._port = temp + '';
            }
            buffer = '';
          }
          if (stateOverride) {
            break loop;
          }
          state = 'relative path start';
          continue;
        } else if ('\t' == c || '\n' == c || '\r' == c) {
          err('Invalid code point in port: ' + c);
        } else {
          invalid.call(this);
        }
        break;

      case 'relative path start':
        if ('\\' == c) err("'\\' not allowed in path.");
        state = 'relative path';
        if ('/' != c && '\\' != c) {
          continue;
        }
        break;

      case 'relative path':
        if (EOF == c || '/' == c || '\\' == c || !stateOverride && ('?' == c || '#' == c)) {
          if ('\\' == c) {
            err('\\ not allowed in relative path.');
          }
          var tmp;
          if (tmp = relativePathDotMapping[buffer.toLowerCase()]) {
            buffer = tmp;
          }
          if ('..' == buffer) {
            this._path.pop();
            if ('/' != c && '\\' != c) {
              this._path.push('');
            }
          } else if ('.' == buffer && '/' != c && '\\' != c) {
            this._path.push('');
          } else if ('.' != buffer) {
            if ('file' == this._scheme && this._path.length == 0 && buffer.length == 2 && ALPHA.test(buffer[0]) && buffer[1] == '|') {
              buffer = buffer[0] + ':';
            }
            this._path.push(buffer);
          }
          buffer = '';
          if ('?' == c) {
            this._query = '?';
            state = 'query';
          } else if ('#' == c) {
            this._fragment = '#';
            state = 'fragment';
          }
        } else if ('\t' != c && '\n' != c && '\r' != c) {
          buffer += percentEscape(c);
        }
        break;

      case 'query':
        if (!stateOverride && '#' == c) {
          this._fragment = '#';
          state = 'fragment';
        } else if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
          this._query += percentEscapeQuery(c);
        }
        break;

      case 'fragment':
        if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
          this._fragment += c;
        }
        break;
    }

    cursor++;
  }
}

function clear() {
  this._scheme = '';
  this._schemeData = '';
  this._username = '';
  this._password = null;
  this._host = '';
  this._port = '';
  this._path = [];
  this._query = '';
  this._fragment = '';
  this._isInvalid = false;
  this._isRelative = false;
}

// Does not process domain names or IP addresses.
// Does not handle encoding for the query parameter.
function URL(url, base /* , encoding */) {
  if (base !== undefined && !(base instanceof URL)) base = new URL(String(base));

  this._url = url;
  clear.call(this);

  var input = url.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, '');
  // encoding = encoding || 'utf-8'

  parse.call(this, input, null, base);
}

URL.prototype = {
  toString: function toString() {
    return this.href;
  },
  get href() {
    if (this._isInvalid) return this._url;

    var authority = '';
    if ('' != this._username || null != this._password) {
      authority = this._username + (null != this._password ? ':' + this._password : '') + '@';
    }

    return this.protocol + (this._isRelative ? '//' + authority + this.host : '') + this.pathname + this._query + this._fragment;
  },
  set href(href) {
    clear.call(this);
    parse.call(this, href);
  },

  get protocol() {
    return this._scheme + ':';
  },
  set protocol(protocol) {
    if (this._isInvalid) return;
    parse.call(this, protocol + ':', 'scheme start');
  },

  get host() {
    return this._isInvalid ? '' : this._port ? this._host + ':' + this._port : this._host;
  },
  set host(host) {
    if (this._isInvalid || !this._isRelative) return;
    parse.call(this, host, 'host');
  },

  get hostname() {
    return this._host;
  },
  set hostname(hostname) {
    if (this._isInvalid || !this._isRelative) return;
    parse.call(this, hostname, 'hostname');
  },

  get port() {
    return this._port;
  },
  set port(port) {
    if (this._isInvalid || !this._isRelative) return;
    parse.call(this, port, 'port');
  },

  get pathname() {
    return this._isInvalid ? '' : this._isRelative ? '/' + this._path.join('/') : this._schemeData;
  },
  set pathname(pathname) {
    if (this._isInvalid || !this._isRelative) return;
    this._path = [];
    parse.call(this, pathname, 'relative path start');
  },

  get search() {
    return this._isInvalid || !this._query || '?' == this._query ? '' : this._query;
  },
  set search(search) {
    if (this._isInvalid || !this._isRelative) return;
    this._query = '?';
    if ('?' == search[0]) search = search.slice(1);
    parse.call(this, search, 'query');
  },

  get searchParams() {
    return new URLSearchParams(this.search);
  },

  get hash() {
    return this._isInvalid || !this._fragment || '#' == this._fragment ? '' : this._fragment;
  },
  set hash(hash) {
    if (this._isInvalid) return;
    this._fragment = '#';
    if ('#' == hash[0]) hash = hash.slice(1);
    parse.call(this, hash, 'fragment');
  },

  get origin() {
    var host;
    if (this._isInvalid || !this._scheme) {
      return '';
    }
    // javascript: Gecko returns String(""), WebKit/Blink String("null")
    // Gecko throws error for "data://"
    // data: Gecko returns "", Blink returns "data://", WebKit returns "null"
    // Gecko returns String("") for file: mailto:
    // WebKit/Blink returns String("SCHEME://") for file: mailto:
    switch (this._scheme) {
      case 'data':
      case 'file':
      case 'javascript':
      case 'mailto':
        return 'null';
    }
    host = this.host;
    if (!host) {
      return '';
    }
    return this._scheme + '://' + host;
  }
};

module.exports = URL;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

var RE_MEDIA_QUERY = /^(?:(only|not)?\s*([_a-z][_a-z0-9-]*)|(\([^\)]+\)))(?:\s*and\s*(.*))?$/i,
    RE_MQ_EXPRESSION = /^\(\s*([_a-z-][_a-z0-9-]*)\s*(?:\:\s*([^\)]+))?\s*\)$/,
    RE_MQ_FEATURE = /^(?:(min|max)-)?(.+)/;

function _matches(media, values) {
  return _parseQuery(media).some(function (query) {
    var inverse = query.inverse;

    var typeMatch = query.type === 'all' || values.type === query.type;

    if (typeMatch && inverse || !(typeMatch || inverse)) {
      return false;
    }

    var expressionsMatch = query.expressions.every(function (expression) {
      var feature = expression.feature,
          modifier = expression.modifier,
          expValue = expression.value,
          value = values[feature];

      if (!value) {
        return false;
      }

      switch (feature) {
        case 'width':
        case 'height':
          expValue = parseFloat(expValue);
          value = parseFloat(value);
          break;
      }

      switch (modifier) {
        case 'min':
          return value >= expValue;
        case 'max':
          return value <= expValue;
        default:
          return value === expValue;
      }
    });

    return expressionsMatch && !inverse || !expressionsMatch && inverse;
  });
}

function _parseQuery(media) {
  return media.split(',').map(function (query) {
    query = query.trim();

    var captures = query.match(RE_MEDIA_QUERY);

    if (!captures) {
      throw new SyntaxError('Invalid CSS media query: "' + query + '"');
    }

    var modifier = captures[1],
        type = captures[2],
        expressions = ((captures[3] || '') + (captures[4] || '')).trim(),
        parsed = {};

    parsed.inverse = !!modifier && modifier.toLowerCase() === 'not';
    parsed.type = type ? type.toLowerCase() : 'all';

    if (!expressions) {
      parsed.expressions = [];
      return parsed;
    }

    expressions = expressions.match(/\([^\)]+\)/g);

    if (!expressions) {
      throw new SyntaxError('Invalid CSS media query: "' + query + '"');
    }

    parsed.expressions = expressions.map(function (expression) {
      var captures = expression.match(RE_MQ_EXPRESSION);

      if (!captures) {
        throw new SyntaxError('Invalid CSS media query: "' + query + '"');
      }

      var feature = captures[1].toLowerCase().match(RE_MQ_FEATURE);

      return {
        modifier: feature[1],
        feature: feature[2],
        value: captures[2]
      };
    });

    return parsed;
  });
}

function matchMedia(media) {
  var mql = {
    matches: false,
    media: media
  };

  if (media === '') {
    mql.matches = true;
    return mql;
  }

  mql.matches = _matches(media, {
    type: 'screen',
    width: window.screen.width,
    height: window.screen.height
  });

  return mql;
}

module.exports = matchMedia;

/***/ })
/******/ ])};

/***/ }),
/* 7 */
/*!********************************************************!*\
  !*** ./packages/weex-rax-framework/src/define.weex.js ***!
  \********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

module.exports = function (modules) {
  function define(name, deps, factory) {
    if (deps instanceof Function) {
      factory = deps;
      deps = [];
    }

    modules[name] = {
      factory: factory,
      deps: deps,
      module: { exports: {} },
      isInitialized: false,
      hasError: false
    };
  }

  return define;
};

/***/ }),
/* 8 */
/*!*********************************************************!*\
  !*** ./packages/weex-rax-framework/src/require.weex.js ***!
  \*********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

module.exports = function (modules) {
  function require(name) {
    var mod = modules[name];

    if (mod && mod.isInitialized) {
      return mod.module.exports;
    }

    if (!mod) {
      throw new Error('Requiring unknown module "' + name + '"');
    }

    if (mod.hasError) {
      throw new Error('Requiring module "' + name + '" which threw an exception');
    }

    try {
      mod.isInitialized = true;
      mod.factory(require, mod.module.exports, mod.module);
    } catch (e) {
      mod.hasError = true;
      mod.isInitialized = false;
      throw e;
    }

    return mod.module.exports;
  }

  return require;
};

/***/ }),
/* 9 */
/*!***********************************************************!*\
  !*** ./packages/weex-rax-framework/src/downgrade.weex.js ***!
  \***********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var _semver = __webpack_require__(/*! ./semver */ 10);

var _semver2 = _interopRequireDefault(_semver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function normalizeVersion(v) {
  if (v == '*') {
    return v;
  }
  v = typeof v === 'string' ? v : '';
  var split = v.split('.');
  var i = 0;
  var result = [];

  while (i < 3) {
    var s = typeof split[i] === 'string' && split[i] ? split[i] : '0';
    result.push(s);
    i++;
  }

  return result.join('.');
} /* global WXEnvironment */

function getError(key, val, criteria) {
  var result = {
    isDowngrade: true,
    errorType: 1,
    code: 1000
  };
  var getMsg = function getMsg(key, val, criteria) {
    return 'Downgrade[' + key + '] :: deviceInfo ' + val + ' matched criteria ' + criteria;
  };
  var _key = key.toLowerCase();

  if (_key.indexOf('osversion') >= 0) {
    result.code = 1001;
  } else if (_key.indexOf('appversion') >= 0) {
    result.code = 1002;
  } else if (_key.indexOf('weexversion') >= 0) {
    result.code = 1003;
  } else if (_key.indexOf('devicemodel') >= 0) {
    result.code = 1004;
  }

  result.errorMessage = getMsg(key, val, criteria);
  return result;
}

/**
 * config
 *
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
 */
function check(config) {
  var result = {
    isDowngrade: false
  };

  var deviceInfo = WXEnvironment;

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

      if (_semver2.default.satisfies(d, c)) {
        result = getError(key, val, criteria);
        break;
      }
    } else if (isDeviceModel) {
      var _criteria = Array.isArray(criteria) ? criteria : [criteria];

      if (_criteria.indexOf(val) >= 0) {
        result = getError(key, val, criteria);
        break;
      }
    }
  }

  return result;
}

module.exports = function (__weex_require__) {
  return function (config) {
    var nativeInstanceWrap = __weex_require__('@weex-module/instanceWrap');
    var result = check(config);
    if (result.isDowngrade) {
      nativeInstanceWrap.error(result.errorType, result.code, result.errorMessage);
      return true;
    }
    return false;
  };
};

/***/ }),
/* 10 */
/*!***************************************************!*\
  !*** ./packages/weex-rax-framework/src/semver.js ***!
  \***************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = {
  satisfies: function satisfies(left, right) {
    var regex = /(\W+)?([\d|.]+)/;

    if ((typeof left === 'undefined' ? 'undefined' : _typeof(left)) + (typeof right === 'undefined' ? 'undefined' : _typeof(right)) != 'stringstring') return false;

    if (right == '*') {
      return true;
    }

    var arr = right.match(regex);
    var a = left.split('.'),
        i = 0,
        b = arr[2].split('.'),
        len = Math.max(a.length, b.length);

    var flag = 0;
    for (var _i = 0; _i < len; _i++) {
      if (a[_i] && !b[_i] && parseInt(a[_i]) > 0 || parseInt(a[_i]) > parseInt(b[_i])) {
        flag = 1;
        break;
      } else if (b[_i] && !a[_i] && parseInt(b[_i]) > 0 || parseInt(a[_i]) < parseInt(b[_i])) {
        flag = -1;
        break;
      }
    }

    switch (arr[1]) {
      case '<':
        if (flag === -1) {
          return true;
        }
        break;
      case '<=':
        if (flag !== 1) {
          return true;
        }
        break;
      case '>':
        if (flag === 1) {
          return true;
        }
        break;
      case '>=':
        if (flag !== -1) {
          return true;
        }
        break;
      default:
        if (flag === 0) {
          return true;
        }
        break;
    }
    return false;
  }
};
module.exports = exports['default'];

/***/ }),
/* 11 */
/*!**********************************************************!*\
  !*** ./packages/weex-rax-framework/src/document.weex.js ***!
  \**********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var _emitter = __webpack_require__(/*! ./emitter */ 1);

var _emitter2 = _interopRequireDefault(_emitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DOM_MODULE = '@weex-module/dom';
var VISIBLE = 'visible';
var HIDDEN = 'hidden';
var VISIBILITY_CHANGE_EVENT = 'visibilitychange';

function addBodyAppearListener(document) {
  document.body.addEvent('viewappear', function (e) {
    document.visibilityState = VISIBLE;
    e.type = VISIBILITY_CHANGE_EVENT;
    document.dispatchEvent(e);
  });

  document.body.addEvent('viewdisappear', function (e) {
    document.visibilityState = HIDDEN;
    e.type = VISIBILITY_CHANGE_EVENT;
    document.dispatchEvent(e);
  });
}

function removeBodyAppearListener(document) {
  if (document.body) {
    document.body.removeEvent('viewappear');
    document.body.removeEvent('viewdisappear');
  }
}

module.exports = function (__weex_require__, document) {
  // Add w3c events
  var documentEmitter = new _emitter2.default();
  var hasVisibilityEventPending = false;

  // Weex freezed the document maybe throw error
  try {
    document.addEventListener = function (type, listener) {
      if (type === VISIBILITY_CHANGE_EVENT) {
        if (document.body) {
          addBodyAppearListener(document);
        } else {
          hasVisibilityEventPending = true;
        }
      }
      documentEmitter.on(type, listener);
    };

    document.removeEventListener = function (type, listener) {
      if (type === VISIBILITY_CHANGE_EVENT) {
        removeBodyAppearListener(document);
      }
      documentEmitter.off(type, listener);
    };

    document.dispatchEvent = function (e) {
      documentEmitter.emit(e.type, e);
    };

    // FontFace
    document.fonts = {
      add: function add(fontFace) {
        var domModule = __weex_require__(DOM_MODULE);
        domModule.addRule('fontFace', {
          fontFamily: fontFace.family,
          src: fontFace.source // url('uri') : single quotes are required around uri, and double quotes can not work in weex
        });
      }
    };

    // Init visibility state
    document.visibilityState = VISIBLE;

    // Hijack the origin createBody
    var originCreateBody = document.createBody;

    Object.defineProperty(document, 'createBody', {
      value: function value() {
        var body = originCreateBody.apply(document, arguments);

        if (hasVisibilityEventPending) {
          addBodyAppearListener(document);
        }
        return body;
      }
    });
  } catch (e) {
    console.log(e);
  }

  return document;
};

/***/ }),
/* 12 */
/*!**********************************************************!*\
  !*** ./packages/weex-rax-framework/src/location.weex.js ***!
  \**********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var LOCATION_MODULE = '@weex-module/location';
var NAVIGATOR_MODULE = '@weex-module/navigator';

module.exports = function (__weex_require__, location) {
  location.assign = function (url) {
    var weexNavigator = __weex_require__(NAVIGATOR_MODULE);
    weexNavigator.push({
      url: url,
      animated: 'true'
    }, function (e) {
      // noop
    });
  };

  location.replace = function (url) {
    var weexLocation = __weex_require__(LOCATION_MODULE);
    weexLocation.replace(url);
  };

  location.reload = function (forceReload) {
    var weexLocation = __weex_require__(LOCATION_MODULE);
    weexLocation.reload(forceReload);
  };

  return location;
};

/***/ }),
/* 13 */
/*!*******************************************************!*\
  !*** ./packages/weex-rax-framework/src/fetch.weex.js ***!
  \*******************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var STREAM_MODULE = '@weex-module/stream';

module.exports = function (__weex_require__, Promise) {
  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    // FIXME: In spdy the response header has name like ":version" that is invalid
    // if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
    //   throw new TypeError('Invalid character in header field name');
    // }
    return name.toLowerCase();
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value;
  }

  function Headers(headers) {
    this.originHeaders = headers;
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function (value, name) {
        this.append(name, value);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function (name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function (name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ',' + value : value;
  };

  Headers.prototype.delete = function (name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function (name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null;
  };

  Headers.prototype.has = function (name) {
    return this.map.hasOwnProperty(normalizeName(name));
  };

  Headers.prototype.set = function (name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)];
  };

  Headers.prototype.forEach = function (callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'));
    }
    body.bodyUsed = true;
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function (body, options) {
      this._bodyInit = body;
      if (typeof body === 'string') {
        this._bodyText = body;
      } else if (!body) {
        this._bodyText = '';
      } else {
        throw new Error('unsupported BodyInit type');
      }
    };

    this.text = function () {
      var rejected = consumed(this);
      return rejected ? rejected : Promise.resolve(this._bodyText);
    };

    this.json = function () {
      return this.text().then(JSON.parse);
    };

    return this;
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = input;
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this._initBody(body, options);
  }

  Request.prototype.clone = function () {
    return new Request(this);
  };

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = 'status' in options ? options.status : 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit, options);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function () {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    });
  };

  Response.error = function () {
    var response = new Response(null, { status: 0, statusText: '' });
    response.type = 'error';
    return response;
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function (url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  var fetch = function fetch(input, init) {
    return new Promise(function (resolve, reject) {
      var request;
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input;
      } else {
        request = new Request(input, init);
      }

      var params = {
        url: request.url,
        method: request.method,
        headers: request.headers && request.headers.originHeaders
      };

      if (typeof request._bodyInit !== 'undefined') {
        params.body = request._bodyInit;
      }

      params.type = init && init.dataType ? init.dataType : 'text';

      var nativeFetch = __weex_require__(STREAM_MODULE).fetch;
      nativeFetch(params, function (response) {
        try {
          typeof response === 'string' && (response = JSON.parse(response));
          var data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

          var res = new Response(data, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            url: request.url
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      }, function (progress) {});
    });
  };

  return {
    fetch: fetch,
    Headers: Headers,
    Request: Request,
    Response: Response
  };
};

/***/ }),
/* 14 */
/*!****************************************************************!*\
  !*** ./packages/weex-rax-framework/src/xmlhttprequest.weex.js ***!
  \****************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var STREAM_MODULE = '@weex-module/stream';
var eventTarget = __webpack_require__(/*! event-target-shim */ 2);

var UNSENT = 0;
var OPENED = 1;
var HEADERS_RECEIVED = 2;
var LOADING = 3;
var DONE = 4;

var XHR_EVENTS = ['abort', 'error', 'load', 'loadstart', 'progress', 'timeout', 'loadend', 'readystatechange'];

module.exports = function (__weex_require__) {
  var XMLHttpRequest = function (_eventTarget) {
    _inherits(XMLHttpRequest, _eventTarget);

    // EventTarget automatically initializes these to `null`.
    function XMLHttpRequest() {
      _classCallCheck(this, XMLHttpRequest);

      var _this = _possibleConstructorReturn(this, (XMLHttpRequest.__proto__ || Object.getPrototypeOf(XMLHttpRequest)).call(this));

      _this.UNSENT = UNSENT;
      _this.OPENED = OPENED;
      _this.HEADERS_RECEIVED = HEADERS_RECEIVED;
      _this.LOADING = LOADING;
      _this.DONE = DONE;
      _this.readyState = UNSENT;
      _this.status = 0;
      _this.statusText = '';
      _this.timeout = 0;
      _this._aborted = false;
      _this._hasError = false;
      _this._method = null;
      _this._response = '';
      _this._url = null;
      _this._timedOut = false;

      _this._reset();
      return _this;
    }

    _createClass(XMLHttpRequest, [{
      key: '_reset',
      value: function _reset() {
        this.readyState = this.UNSENT;
        this.responseHeaders = undefined;
        this.status = 0;

        this._hasError = false;
        this._headers = {};
        this._response = '';
        this._responseType = '';
        this._sent = false;
        this._lowerCaseResponseHeaders = {};

        this._timedOut = false;
      }
    }, {
      key: 'getAllResponseHeaders',
      value: function getAllResponseHeaders() {
        if (!this.responseHeaders) {
          // according to the spec, return null if no response has been received
          return null;
        }
        var headers = this.responseHeaders || {};
        return Object.keys(headers).map(function (headerName) {
          return headerName + ': ' + headers[headerName];
        }).join('\r\n');
      }
    }, {
      key: 'getResponseHeader',
      value: function getResponseHeader(header) {
        var value = this._lowerCaseResponseHeaders[header.toLowerCase()];
        return value !== undefined ? value : null;
      }
    }, {
      key: 'setRequestHeader',
      value: function setRequestHeader(header, value) {
        if (this.readyState !== this.OPENED) {
          throw new Error('Request has not been opened');
        }
        this._headers[header.toLowerCase()] = String(value);
      }
    }, {
      key: 'open',
      value: function open(method, url, async) {
        /* Other optional arguments are not supported yet */
        if (this.readyState !== this.UNSENT) {
          throw new Error('Cannot open, already sending');
        }
        if (async !== undefined && !async) {
          // async is default
          throw new Error('Synchronous http requests are not supported');
        }
        if (!url) {
          throw new Error('Cannot load an empty url');
        }
        this._method = method.toUpperCase();
        this._url = url;
        this._aborted = false;
        this.setReadyState(this.OPENED);
      }
    }, {
      key: 'send',
      value: function send(data) {
        var _this2 = this;

        if (this.readyState !== this.OPENED) {
          throw new Error('Request has not been opened');
        }
        if (this._sent) {
          throw new Error('Request has already been sent');
        }
        this._sent = true;

        var nativeFetch = __weex_require__(STREAM_MODULE).fetch;

        nativeFetch({
          method: this._method,
          url: this._url,
          headers: this._headers,
          body: data,
          type: 'text'
        }, function (response) {
          try {
            typeof response === 'string' && (response = JSON.parse(response));

            _this2.status = response.status;
            _this2.statusText = response.statusText;
            _this2.setResponseHeaders(response.headers);

            if (response.ok) {
              _this2._response = response.data;
            } else {
              if (_this2._responseType === '' || _this2._responseType === 'text') {
                _this2._response = response.data;
              }
              _this2._hasError = true;
            }
          } catch (err) {}

          _this2.setReadyState(_this2.DONE);
        }, function (progress) {
          _this2.status = progress.status;
          _this2.statusText = progress.statusText;
          _this2.setResponseHeaders(progress.headers);
          _this2.setReadyState(progress.readyState);
        });
      }
    }, {
      key: 'abort',
      value: function abort() {
        this._aborted = true;

        // TODO: Weex native not support abort now

        // only call onreadystatechange if there is something to abort,
        // below logic is per spec
        if (!(this.readyState === this.UNSENT || this.readyState === this.OPENED && !this._sent || this.readyState === this.DONE)) {
          this._reset();
          this.setReadyState(this.DONE);
        }
        // Reset again after, in case modified in handler
        this._reset();
      }
    }, {
      key: 'setResponseHeaders',
      value: function setResponseHeaders(responseHeaders) {
        this.responseHeaders = responseHeaders || null;
        var headers = responseHeaders || {};
        this._lowerCaseResponseHeaders = Object.keys(headers).reduce(function (lcaseHeaders, headerName) {
          lcaseHeaders[headerName.toLowerCase()] = headers[headerName];
          return lcaseHeaders;
        }, {});
      }
    }, {
      key: 'setReadyState',
      value: function setReadyState(newState) {
        this.readyState = newState;
        this.dispatchEvent({ type: 'readystatechange' });
        if (newState === this.DONE) {
          if (this._aborted) {
            this.dispatchEvent({ type: 'abort' });
          } else if (this._hasError) {
            if (this._timedOut) {
              this.dispatchEvent({ type: 'timeout' });
            } else {
              this.dispatchEvent({ type: 'error' });
            }
          } else {
            this.dispatchEvent({ type: 'load' });
          }
          this.dispatchEvent({ type: 'loadend' });
        }
      }
    }, {
      key: 'responseType',
      get: function get() {
        return this._responseType;
      },
      set: function set(responseType) {
        if (this._sent) {
          throw new Error('Failed to set the \'responseType\' property on \'XMLHttpRequest\': The ' + 'response type cannot be set after the request has been sent.');
        }

        this._responseType = responseType;
      }
    }, {
      key: 'responseText',
      get: function get() {
        if (this._responseType !== '' && this._responseType !== 'text') {
          throw new Error("The 'responseText' property is only available if 'responseType' " + ('is set to \'\' or \'text\', but it is \'' + this._responseType + '\'.'));
        }
        if (this.readyState < LOADING) {
          return '';
        }
        return this._response;
      }
    }, {
      key: 'response',
      get: function get() {
        var responseType = this.responseType;

        if (responseType === '' || responseType === 'text') {
          return this.readyState < LOADING || this._hasError ? '' : this._response;
        }

        if (this.readyState !== DONE) {
          return null;
        }
      }
    }]);

    return XMLHttpRequest;
  }(eventTarget.apply(undefined, XHR_EVENTS));

  XMLHttpRequest.UNSENT = UNSENT;
  XMLHttpRequest.OPENED = OPENED;
  XMLHttpRequest.HEADERS_RECEIVED = HEADERS_RECEIVED;
  XMLHttpRequest.LOADING = LOADING;
  XMLHttpRequest.DONE = DONE;


  return XMLHttpRequest;
};

/***/ }),
/* 15 */
/*!***********************************************************************************************************************************!*\
  !*** ./packages/weex-rax-framework/node_modules/.npminstall/event-target-shim/2.0.0/event-target-shim/lib/custom-event-target.js ***!
  \***********************************************************************************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var Commons = __webpack_require__(/*! ./commons */ 0);
var LISTENERS = Commons.LISTENERS;
var ATTRIBUTE = Commons.ATTRIBUTE;
var newNode = Commons.newNode;

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Gets a specified attribute listener from a given EventTarget object.
 *
 * @param {EventTarget} eventTarget - An EventTarget object to get.
 * @param {string} type - An event type to get.
 * @returns {function|null} The found attribute listener.
 */
function getAttributeListener(eventTarget, type) {
    var node = eventTarget[LISTENERS][type];
    while (node != null) {
        if (node.kind === ATTRIBUTE) {
            return node.listener
        }
        node = node.next;
    }
    return null
}

/**
 * Sets a specified attribute listener to a given EventTarget object.
 *
 * @param {EventTarget} eventTarget - An EventTarget object to set.
 * @param {string} type - An event type to set.
 * @param {function|null} listener - A listener to be set.
 * @returns {void}
 */
function setAttributeListener(eventTarget, type, listener) {
    if (typeof listener !== "function" && typeof listener !== "object") {
        listener = null; // eslint-disable-line no-param-reassign
    }

    var prev = null;
    var node = eventTarget[LISTENERS][type];
    while (node != null) {
        if (node.kind === ATTRIBUTE) {
            // Remove old value.
            if (prev == null) {
                eventTarget[LISTENERS][type] = node.next;
            }
            else {
                prev.next = node.next;
            }
        }
        else {
            prev = node;
        }

        node = node.next;
    }

    // Add new value.
    if (listener != null) {
        if (prev == null) {
            eventTarget[LISTENERS][type] = newNode(listener, ATTRIBUTE);
        }
        else {
            prev.next = newNode(listener, ATTRIBUTE);
        }
    }
}

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

/**
 * Defines an `EventTarget` implementation which has `onfoobar` attributes.
 *
 * @param {EventTarget} EventTargetBase - A base implementation of EventTarget.
 * @param {string[]} types - A list of event types which are defined as attribute listeners.
 * @returns {EventTarget} The defined `EventTarget` implementation which has attribute listeners.
 */
module.exports.defineCustomEventTarget = function(EventTargetBase, types) {
    /**
     * The constructor of custom event target.
     * @constructor
     */
    function EventTarget() {
        EventTargetBase.call(this);
    }

    var descripter = {
        constructor: {
            value: EventTarget,
            configurable: true,
            writable: true,
        },
    };

    types.forEach(function(type) {
        descripter["on" + type] = {
            get: function() {
                return getAttributeListener(this, type)
            },
            set: function(listener) {
                setAttributeListener(this, type, listener);
            },
            configurable: true,
            enumerable: true,
        };
    });

    EventTarget.prototype = Object.create(EventTargetBase.prototype, descripter);

    return EventTarget
};


/***/ }),
/* 16 */
/*!*****************************************************************************************************************************!*\
  !*** ./packages/weex-rax-framework/node_modules/.npminstall/event-target-shim/2.0.0/event-target-shim/lib/event-wrapper.js ***!
  \*****************************************************************************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var createUniqueKey = __webpack_require__(/*! ./commons */ 0).createUniqueKey;

//-----------------------------------------------------------------------------
// Constsnts
//-----------------------------------------------------------------------------

/**
 * The key of the flag which is turned on by `stopImmediatePropagation` method.
 *
 * @type {symbol|string}
 * @private
 */
var STOP_IMMEDIATE_PROPAGATION_FLAG =
    createUniqueKey("stop_immediate_propagation_flag");

/**
 * The key of the flag which is turned on by `preventDefault` method.
 *
 * @type {symbol|string}
 * @private
 */
var CANCELED_FLAG = createUniqueKey("canceled_flag");

/**
 * The key of the flag that it cannot use `preventDefault` method.
 *
 * @type {symbol|string}
 * @private
 */
var PASSIVE_LISTENER_FLAG = createUniqueKey("passive_listener_flag");

/**
 * The key of the original event object.
 *
 * @type {symbol|string}
 * @private
 */
var ORIGINAL_EVENT = createUniqueKey("original_event");

/**
 * Method definitions for the event wrapper.
 *
 * @type {object}
 * @private
 */
var wrapperPrototypeDefinition = Object.freeze({
    stopPropagation: Object.freeze({
        value: function stopPropagation() {
            var e = this[ORIGINAL_EVENT];
            if (typeof e.stopPropagation === "function") {
                e.stopPropagation();
            }
        },
        writable: true,
        configurable: true,
    }),

    stopImmediatePropagation: Object.freeze({
        value: function stopImmediatePropagation() {
            this[STOP_IMMEDIATE_PROPAGATION_FLAG] = true;

            var e = this[ORIGINAL_EVENT];
            if (typeof e.stopImmediatePropagation === "function") {
                e.stopImmediatePropagation();
            }
        },
        writable: true,
        configurable: true,
    }),

    preventDefault: Object.freeze({
        value: function preventDefault() {
            if (this[PASSIVE_LISTENER_FLAG]) {
                return
            }
            if (this.cancelable === true) {
                this[CANCELED_FLAG] = true;
            }

            var e = this[ORIGINAL_EVENT];
            if (typeof e.preventDefault === "function") {
                e.preventDefault();
            }
        },
        writable: true,
        configurable: true,
    }),

    defaultPrevented: Object.freeze({
        get: function defaultPrevented() {
            return this[CANCELED_FLAG]
        },
        enumerable: true,
        configurable: true,
    }),
});

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

module.exports.STOP_IMMEDIATE_PROPAGATION_FLAG = STOP_IMMEDIATE_PROPAGATION_FLAG;
module.exports.PASSIVE_LISTENER_FLAG = PASSIVE_LISTENER_FLAG;

/**
 * Creates an event wrapper.
 *
 * We cannot modify several properties of `Event` object, so we need to create the wrapper.
 * Plus, this wrapper supports non `Event` objects.
 *
 * @param {Event|{type: string}} event - An original event to create the wrapper.
 * @param {EventTarget} eventTarget - The event target of the event.
 * @returns {Event} The created wrapper. This object is implemented `Event` interface.
 * @private
 */
module.exports.createEventWrapper = function createEventWrapper(event, eventTarget) {
    var timeStamp = (
        typeof event.timeStamp === "number" ? event.timeStamp : Date.now()
    );
    var propertyDefinition = {
        type: {value: event.type, enumerable: true},
        target: {value: eventTarget, enumerable: true},
        currentTarget: {value: eventTarget, enumerable: true},
        eventPhase: {value: 2, enumerable: true},
        bubbles: {value: Boolean(event.bubbles), enumerable: true},
        cancelable: {value: Boolean(event.cancelable), enumerable: true},
        timeStamp: {value: timeStamp, enumerable: true},
        isTrusted: {value: false, enumerable: true},
    };
    propertyDefinition[STOP_IMMEDIATE_PROPAGATION_FLAG] = {value: false, writable: true};
    propertyDefinition[CANCELED_FLAG] = {value: false, writable: true};
    propertyDefinition[PASSIVE_LISTENER_FLAG] = {value: false, writable: true};
    propertyDefinition[ORIGINAL_EVENT] = {value: event};

    // For CustomEvent.
    if (typeof event.detail !== "undefined") {
        propertyDefinition.detail = {value: event.detail, enumerable: true};
    }

    return Object.create(
        Object.create(event, wrapperPrototypeDefinition),
        propertyDefinition
    )
};


/***/ }),
/* 17 */
/*!***********************************************************!*\
  !*** ./packages/weex-rax-framework/src/websocket.weex.js ***!
  \***********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var eventTarget = __webpack_require__(/*! event-target-shim */ 2);

var WEB_SOCKET_MODULE = '@weex-module/webSocket';

var CONNECTING = 0;
var OPEN = 1;
var CLOSING = 2;
var CLOSED = 3;

var WEBSOCKET_EVENTS = ['close', 'error', 'message', 'open'];

/**
 * Event object passed to the `onopen`, `onclose`, `onmessage`, `onerror`
 * callbacks of `WebSocket`.
 *
 * The `type` property is "open", "close", "message", "error" respectively.
 *
 * In case of "message", the `data` property contains the incoming data.
 */

var WebSocketEvent = function WebSocketEvent(type, eventInitDict) {
  _classCallCheck(this, WebSocketEvent);

  this.type = type.toString();
  Object.assign(this, eventInitDict);
};

module.exports = function (__weex_require__) {
  /**
   * Browser-compatible WebSockets implementation.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
   * See https://github.com/websockets/ws
   */
  var WebSocket = function (_eventTarget) {
    _inherits(WebSocket, _eventTarget);

    function WebSocket(url, protocols) {
      _classCallCheck(this, WebSocket);

      var _this = _possibleConstructorReturn(this, (WebSocket.__proto__ || Object.getPrototypeOf(WebSocket)).call(this));

      var websocket = __weex_require__(WEB_SOCKET_MODULE);
      // eslint-disable-next-line new-cap
      websocket.WebSocket(url, protocols);
      _this.readyState = CONNECTING;
      _this.websocket = websocket;

      websocket.onmessage(function (ev) {
        _this.dispatchEvent(new WebSocketEvent('message', ev));
      });

      websocket.onopen(function (ev) {
        _this.readyState = OPEN;
        _this.dispatchEvent(new WebSocketEvent('open'));
      });

      websocket.onclose(function (ev) {
        _this.readyState = CLOSED;
        _this.dispatchEvent(new WebSocketEvent('close', {
          code: ev.code,
          reason: ev.reason
        }));
      });

      websocket.onerror(function (ev) {
        _this.dispatchEvent(new WebSocketEvent('error', ev));
      });
      return _this;
    }

    _createClass(WebSocket, [{
      key: 'close',
      value: function close(code, reason) {
        if (this.readyState === CLOSING || this.readyState === CLOSED) {
          return;
        }

        this.readyState = CLOSING;
        this.websocket.close(code, reason);
      }
    }, {
      key: 'send',
      value: function send(data) {
        if (typeof data === 'string') {
          this.websocket.send(data);
          return;
        }

        throw new Error('Unsupported data type');
      }
    }]);

    return WebSocket;
  }(eventTarget(WEBSOCKET_EVENTS));

  WebSocket.CONNECTING = CONNECTING;
  WebSocket.OPEN = OPEN;
  WebSocket.CLOSING = CLOSING;
  WebSocket.CLOSED = CLOSED;


  return WebSocket;
};

/***/ }),
/* 18 */
/*!*******************************************************!*\
  !*** ./packages/weex-rax-framework/src/timer.weex.js ***!
  \*******************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

var TIMER_MODULE = '@weex-module/timer';

module.exports = function (__weex_require__, document) {
  var setTimeout = function setTimeout(handler, time) {
    var timer = __weex_require__(TIMER_MODULE);
    timer.setTimeout(handler, time);
    return document.taskCenter.callbackManager.lastCallbackId.toString();
  };

  var setInterval = function setInterval(handler, time) {
    var timer = __weex_require__(TIMER_MODULE);
    timer.setInterval(handler, time);
    return document.taskCenter.callbackManager.lastCallbackId.toString();
  };

  var clearTimeout = function clearTimeout(n) {
    var timer = __weex_require__(TIMER_MODULE);
    timer.clearTimeout(n);
  };

  var clearInterval = function clearInterval(n) {
    var timer = __weex_require__(TIMER_MODULE);
    timer.clearInterval(n);
  };

  var requestAnimationFrame = function requestAnimationFrame(callback) {
    var timer = __weex_require__(TIMER_MODULE);
    return timer.setTimeout(callback, 16);
  };

  var cancelAnimationFrame = function cancelAnimationFrame(n) {
    var timer = __weex_require__(TIMER_MODULE);
    timer.clearTimeout(n);
  };

  return {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame
  };
};

/***/ }),
/* 19 */
/*!********************************************************!*\
  !*** ./packages/weex-rax-framework/src/base64.weex.js ***!
  \********************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

module.exports = function () {
  var base64 = {};
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  base64.btoa = function (input) {
    var str = String(input);
    for (
    // initialize result and counter
    var block, charCode, idx = 0, map = chars, output = '';
    // if the next str index does not exist:
    //   change the mapping table to "="
    //   check if d has no fractional digits
    str.charAt(idx | 0) || (map = '=', idx % 1);
    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
    output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
      charCode = str.charCodeAt(idx += 3 / 4);
      if (charCode > 0xFF) {
        throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  };

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  base64.atob = function (input) {
    var str = String(input).replace(/=+$/, '');
    if (str.length % 4 == 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
    // initialize result and counters
    var bc = 0, bs, buffer, idx = 0, output = '';
    // get next character
    buffer = str.charAt(idx++);
    // character found in table? initialize bit storage and add its ascii value;
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  };

  return base64;
};

/***/ }),
/* 20 */
/*!*************************************************************!*\
  !*** ./packages/weex-rax-framework/src/performance.weex.js ***!
  \*************************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = function (responseEnd) {
  var _performance$timing;

  var performance = {};
  // TODO: current can not get navigationStart time
  performance.timing = (_performance$timing = {
    unloadEventStart: 0,
    unloadEventEnd: 0,
    navigationStart: responseEnd,
    redirectStart: 0,
    redirectEnd: 0,
    fetchStart: responseEnd,
    domainLookupStart: responseEnd,
    domainLookupEnd: responseEnd,
    connectStart: responseEnd,
    secureConnectionStart: responseEnd
  }, _defineProperty(_performance$timing, "connectStart", responseEnd), _defineProperty(_performance$timing, "requestStart", responseEnd), _defineProperty(_performance$timing, "responseStart", responseEnd), _defineProperty(_performance$timing, "responseEnd", responseEnd), _defineProperty(_performance$timing, "domLoading", 0), _defineProperty(_performance$timing, "domInteractive", 0), _defineProperty(_performance$timing, "domComplete", 0), _defineProperty(_performance$timing, "domContentLoadedEventStart", 0), _defineProperty(_performance$timing, "domContentLoadedEventEnd", 0), _defineProperty(_performance$timing, "loadEventStart", 0), _defineProperty(_performance$timing, "loadEventEnd", 0), _performance$timing);
  performance.now = function () {
    return Date.now() - performance.timing.navigationStart;
  };

  return performance;
};

/***/ }),
/* 21 */
/*!*******************************************************!*\
  !*** ./packages/weex-rax-framework/src/event.weex.js ***!
  \*******************************************************/
/*! no static exports found */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
  var Event = function Event(type) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Event);

    this.type = type;
    this.bubbles = Boolean(params.bubbles);
    this.cancelable = Boolean(params.cancelable);
  };

  var CustomEvent = function (_Event) {
    _inherits(CustomEvent, _Event);

    function CustomEvent(type) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, CustomEvent);

      var _this = _possibleConstructorReturn(this, (CustomEvent.__proto__ || Object.getPrototypeOf(CustomEvent)).call(this, type, params));

      _this.detail = params.detail;
      return _this;
    }

    return CustomEvent;
  }(Event);

  return {
    Event: Event,
    CustomEvent: CustomEvent
  };
};

/***/ })
/******/ ]);

});

var framework_weex$1 = unwrapExports(framework_weex);


var Rax = Object.freeze({
	default: framework_weex$1,
	__moduleExports: framework_weex
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

setup({ Rax });

})));
//# sourceMappingURL=weex-rax.es6.js.map
