(this.nativeLog || function(s) {console.log(s)})('Weex JS Framework 0.24.0, Build 2018-01-05 18:17. (Rax: 0.4.20)');
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

var framework = createCommonjsModule(function (module) {
module.exports = /******/ (function(modules) { // webpackBootstrap
/******/  // The module cache
/******/  var installedModules = {};
/******/
/******/  // The require function
/******/  function __webpack_require__(moduleId) {
/******/
/******/    // Check if module is in cache
/******/    if(installedModules[moduleId]) {
/******/      return installedModules[moduleId].exports;
/******/    }
/******/    // Create a new module (and put it into the cache)
/******/    var module = installedModules[moduleId] = {
/******/      i: moduleId,
/******/      l: false,
/******/      exports: {}
/******/    };
/******/
/******/    // Execute the module function
/******/    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/    // Flag the module as loaded
/******/    module.l = true;
/******/
/******/    // Return the exports of the module
/******/    return module.exports;
/******/  }
/******/
/******/
/******/  // expose the modules object (__webpack_modules__)
/******/  __webpack_require__.m = modules;
/******/
/******/  // expose the module cache
/******/  __webpack_require__.c = installedModules;
/******/
/******/  // define getter function for harmony exports
/******/  __webpack_require__.d = function(exports, name, getter) {
/******/    if(!__webpack_require__.o(exports, name)) {
/******/      Object.defineProperty(exports, name, {
/******/        configurable: false,
/******/        enumerable: true,
/******/        get: getter
/******/      });
/******/    }
/******/  };
/******/
/******/  // getDefaultExport function for compatibility with non-harmony modules
/******/  __webpack_require__.n = function(module) {
/******/    var getter = module && module.__esModule ?
/******/      function getDefault() { return module['default']; } :
/******/      function getModuleExports() { return module; };
/******/    __webpack_require__.d(getter, 'a', getter);
/******/    return getter;
/******/  };
/******/
/******/  // Object.prototype.hasOwnProperty.call
/******/  __webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/  // __webpack_public_path__
/******/  __webpack_require__.p = "";
/******/
/******/  // Load entry module and return exports
/******/  return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!**************************************************!*\
  !*** ./packages/weex-rax-framework/src/index.js ***!
  \**************************************************/
/*! dynamic exports provided */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getInstance = getInstance;
exports.init = init;
exports.createInstanceContext = createInstanceContext;
exports.refreshInstance = refreshInstance;
exports.destroyInstance = destroyInstance;
var Document = void 0;
var Element = void 0;
var Comment = void 0;

// Instance hub
var instances = {};

function getInstance(instanceId) {
  var instance = instances[instanceId];
  if (!instance) {
    throw new Error('Invalid instance id "' + instanceId + '"');
  }
  return instance;
}

// TODO: delete (future)
function init(config) {
  Document = config.Document;
  Element = config.Element;
  Comment = config.Comment;
}

/**
 * create a Weex instance
 *
 * @param  {string} instanceId
 * @param  {object} [__weex_options__] {bundleUrl, debug}
 * @param  {object} __weex_data__
 */
// export function createInstance(instanceId, __weex_code__, __weex_options__, __weex_data__, __weex_config__) {
function createInstanceContext(instanceId, __weex_options__, __weex_data__) {
  var instance = instances[instanceId];
  if (instance == undefined) {

    var bundleUrl = __weex_options__.weex.document.URL || 'about:blank';
    var document = new Document(instanceId, bundleUrl);
    // const documentURL = new URL(bundleUrl);
    // 待确认这块从哪里获取
    var modules = {};

    instance = instances[instanceId] = {
      document: document,
      instanceId: instanceId,
      bundleUrl: bundleUrl,
      __weex_data__: __weex_data__,
      modules: modules,
      // origin: documentURL.origin,
      uid: 0
    };

    // Extend document
    // require('./document.weex')(__weex_require__, document);

    var instanceContext = {
      instanceId: instanceId,
      bundleUrl: bundleUrl,
      document: document,
      __weex_document__: document,
      __weex_options__: __weex_options__,
      __weex_data__: __weex_data__,
      __weex_config__: __weex_options__
    };

    return instanceContext;

    // instance.window = window.self = window.window = window;

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
  // instance.window.closed = true;

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
}

// FIXME: Hack for rollup build "import Rax from 'weex-rax-framework'", in rollup if `module.exports` has `__esModule` key must return by export default
exports.default = exports;

/***/ })
/******/ ]);

});

var framework$1 = unwrapExports(framework);


var Rax = Object.freeze({
	default: framework$1,
	__moduleExports: framework
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
