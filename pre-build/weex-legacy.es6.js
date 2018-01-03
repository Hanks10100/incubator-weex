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
  const info = this._ids[id];
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
  const info = this._ids[id];
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
  const info = this._ids[id];
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
  const app = this._app;
  const differ = app.differ;
  return differ.then(() => {
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
  const el = this.$el(id);
  if (el) {
    const dom = this._app.requireModule('dom');
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
  const el = this.$el(id);
  if (el && options && options.styles) {
    const animation = this._app.requireModule('animation');
    animation.transition(el.ref, options, (...args) => {
      this._setStyle(el, options.styles);
      callback && callback(...args);
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
  const config = this._app.options;
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
  const stream = this._app.requireModule('stream');
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
  const event = this._app.requireModule('event');
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
  const pageInfo = this._app.requireModule('pageInfo');
  pageInfo.setTitle(title);
}

/**
 * @deprecated use "require('@weex-module/moduleName') instead"
 * invoke a native method by specifing the name of module and method
 * @param  {string} moduleName
 * @param  {string} methodName
 * @param  {...*} the rest arguments
 */
function $call (moduleName, methodName, ...args) {
  console.warn('[JS Framework] Vm#$call is deprecated, ' +
    'please use "require(\'@weex-module/moduleName\')" instead');
  const module = this._app.requireModule(moduleName);
  if (module && module[methodName]) {
    module[methodName](...args);
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

function extend (target, ...src) {
  /* istanbul ignore else */
  if (typeof Object.assign === 'function') {
    Object.assign(target, ...src);
  }
  else {
    const first = src.shift();
    for (const key in first) {
      target[key] = first[key];
    }
    if (src.length) {
      extend(target, ...src);
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
    const index = arr.indexOf(item);
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
const hasOwnProperty = Object.prototype.hasOwnProperty;
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
    const l = arguments.length;
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

const toString = Object.prototype.toString;
const OBJECT_STRING = '[object Object]';
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
  const c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

// can we use __proto__?
const hasProto = '__proto__' in {};

let _Set;
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
  const s = Object.prototype.toString.call(v);
  return s.substring(8, s.length - 1).toLowerCase()
}

// weex name rules

const WEEX_COMPONENT_REG = /^@weex-component\//;
const WEEX_MODULE_REG = /^@weex-module\//;
const NORMAL_MODULE_REG = /^\.{1,2}\//;
const JS_SURFIX_REG = /\.js$/;

const isWeexComponent = name => !!name.match(WEEX_COMPONENT_REG);
const isWeexModule = name => !!name.match(WEEX_MODULE_REG);
const isNormalModule = name => !!name.match(NORMAL_MODULE_REG);
const isNpmModule = name => !isWeexComponent(name) && !isWeexModule(name) && !isNormalModule(name);

function removeWeexPrefix (str) {
  const result = str.replace(WEEX_COMPONENT_REG, '').replace(WEEX_MODULE_REG, '');
  return result
}

function removeJSSurfix (str) {
  return str.replace(JS_SURFIX_REG, '')
}

/* eslint-disable */


let uid$1 = 0;

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
let targetStack = [];

function pushTarget (_target) {
  if (Dep.target) targetStack.push(Dep.target);
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
  const subs = this.subs.slice();
  for (let i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

/* eslint-disable */


// import { pushWatcher } from './batcher'
let uid = 0;

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
  const isFn = typeof expOrFn === 'function';
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
  const value = this.getter.call(this.vm, this.vm);
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
  const id = dep.id;
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
  let i = this.deps.length;
  while (i--) {
    const dep = this.deps[i];
    if (!this.newDepIds.has(dep.id)) {
      dep.removeSub(this);
    }
  }
  let tmp = this.depIds;
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
    const value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated; but only do so if this is a
      // non-shallow update (caused by a vm digest).
      ((isObject(value) || this.deep) && !this.shallow)
    ) {
      // set new value
      const oldValue = this.value;
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
  let i = this.deps.length;
  while (i--) {
    this.deps[i].depend();
  }
};

/**
 * Remove self from all dependencies' subcriber list.
 */

Watcher.prototype.teardown = function () {
  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed or is performing a v-for
    // re-render (the watcher list is then filtered by v-for).
    if (!this.vm._isBeingDestroyed && !this.vm._vForRemoving) {
      remove(this.vm._watchers, this);
    }
    let i = this.deps.length;
    while (i--) {
      this.deps[i].removeSub(this);
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

const seenObjects = createNewSet(); // new Set()
/* istanbul ignore next */
function traverse (val, seen) {
  let i, keys, isA, isO;
  if (!seen) {
    seen = seenObjects;
    seen.clear();
  }
  isA = Array.isArray(val);
  isO = isObject(val);
  if (isA || isO) {
    if (val.__ob__) {
      const depId = val.__ob__.dep.id;
      if (seen.has(depId)) {
        return
      } else {
        seen.add(depId);
      }
    }
    if (isA) {
      i = val.length;
      while (i--) traverse(val[i], seen);
    } else if (isO) {
      keys = Object.keys(val);
      i = keys.length;
      while (i--) traverse(val[keys[i]], seen);
    }
  }
}

/* eslint-disable */


const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);[
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
  const original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    // avoid leaking arguments:
    // http://jsperf.com/closure-with-arguments
    let i = arguments.length;
    const args = new Array(i);
    while (i--) {
      args[i] = arguments[i];
    }
    const result = original.apply(this, args);
    const ob = this.__ob__;
    let inserted;
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
    if (inserted) ob.observeArray(inserted);
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
    console.warn(`[JS Framework] "Array.prototype.$set" is not a standard API,`
      + ` it will be removed in the next version.`);
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
    console.warn(`[JS Framework] "Array.prototype.$remove" is not a standard API,`
      + ` it will be removed in the next version.`);
    /* istanbul ignore if */
    if (!this.length) return
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


const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

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
    const augment = hasProto
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
  for (let key in obj) {
    this.convert(key, obj[key]);
  }
};

/**
 * Observe a list of Array items.
 *
 * @param {Array} items
 */

Observer.prototype.observeArray = function (items) {
  for (let i = 0, l = items.length; i < l; i++) {
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
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
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
  let ob;
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
  const dep = new Dep();

  const property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get;
  const setter = property && property.set;

  let childOb = observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
        if (Array.isArray(value)) {
          for (let e, i = 0, l = value.length; i < l; i++) {
            e = value[i];
            e && e.__ob__ && e.__ob__.dep.depend();
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val;
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
  const ob = obj.__ob__;
  if (!ob) {
    obj[key] = val;
    return
  }
  ob.convert(key, val);
  ob.dep.notify();
  if (ob.vms) {
    let i = ob.vms.length;
    while (i--) {
      const vm = ob.vms[i];
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
  const ob = obj.__ob__;

  if (!ob) {
    if (obj._isVue) {
      delete obj._data[key];
      // obj.$forceUpdate()
    }
    return
  }
  ob.dep.notify();
  if (ob.vms) {
    let i = ob.vms.length;
    while (i--) {
      const vm = ob.vms[i];
      unproxy(vm, key);
      // vm.$forceUpdate()
    }
  }
}

const KEY_WORDS = ['$index', '$value', '$event'];
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
  let data = vm._data;

  if (!isPlainObject(data)) {
    data = {};
  }
  // proxy data on instance
  const keys = Object.keys(data);
  let i = keys.length;
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
  const computed = vm._computed;
  if (computed) {
    for (let key in computed) {
      const userDef = computed[key];
      const def = {
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
  const watcher = new Watcher(owner, getter, null, {
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
  const methods = vm._methods;
  if (methods) {
    for (let key in methods) {
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

const { nativeComponentMap } = config$2;

const SETTERS = {
  attr: 'setAttr',
  style: 'setStyle',
  event: 'addEvent'
};

/**
 * apply the native component's options(specified by template.type)
 * to the template
 */
function applyNaitveComponentOptions (template) {
  const { type } = template;
  const options = nativeComponentMap[type];

  if (typeof options === 'object') {
    for (const key in options) {
      if (template[key] == null) {
        template[key] = options[key];
      }
      else if (typof$1(template[key]) === 'object' &&
        typof$1(options[key]) === 'object') {
        for (const subkey in options[key]) {
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

  const options = subVm._options || {};

  // bind props
  let props = options.props;

  if (Array.isArray(props)) {
    props = props.reduce((result, value) => {
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
function bindSubVmAfterInitialized (vm, subVm, template, target = {}) {
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
  for (const key in target) {
    if (!props || props[key]) {
      const value = target[key];
      if (typeof value === 'function') {
        const returnValue = watch(vm, value, function (v) {
          subVm[key] = v;
        });
        subVm[key] = returnValue;
      }
      else {
        subVm[key] = value;
      }
    }
  }
}

/**
 * Bind style from vm to sub vm and watch their updates.
 */
function mergeStyle (target, vm, subVm) {
  for (const key in target) {
    const value = target[key];
    if (typeof value === 'function') {
      const returnValue = watch(vm, value, function (v) {
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
  }
}

/**
 * Bind class & style from vm to sub vm and watch their updates.
 */
function mergeClassStyle (target, vm, subVm) {
  const css = vm._options && vm._options.style || {};

  /* istanbul ignore if */
  if (!subVm._rootEl) {
    return
  }

  const className = '@originalRootEl';
  css[className] = subVm._rootEl.classStyle;

  function addClassName (list, name) {
    if (typof$1(list) === 'array') {
      list.unshift(name);
    }
  }

  if (typeof target === 'function') {
    const value = watch(vm, target, v => {
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
  const map = Object.create(null);

  Object.defineProperties(map, {
    vm: {
      value: target,
      writable: false,
      configurable: false
    },
    el: {
      get: () => el || target._rootEl,
      configurable: false
    }
  });

  if (typeof id === 'function') {
    const handler = id;
    id = handler.call(vm);
    if (id || id === 0) {
      vm._ids[id] = map;
    }
    watch(vm, handler, (newId) => {
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
  classList.forEach((name, i) => {
    classList.splice(i, 1, ...name.split(/\s+/));
  });
  const classStyle = {};
  const length = classList.length;

  for (let i = 0; i < length; i++) {
    const style = css[classList[i]];
    if (style) {
      Object.keys(style).forEach((key) => {
        classStyle[key] = style[key];
      });
    }
  }
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

  const style = vm._options && vm._options.style || {};
  if (typeof classList === 'function') {
    const value = watch(vm, classList, v => {
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
  const keys = Object.keys(events);
  let i = keys.length;
  while (i--) {
    const key = keys[i];
    let handler = events[key];
    if (typeof handler === 'string') {
      handler = vm[handler];
      /* istanbul ignore if */
      if (!handler) {
        console.warn(`[JS Framework] The event handler "${handler}" is not defined.`);
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
  const keys = Object.keys(data);
  let i = keys.length;
  while (i--) {
    const key = keys[i];
    const value = data[key];
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
  const methodName = SETTERS[name];
  // watch the calc, and returns a value by calc.call()
  const value = watch(vm, calc, (value) => {
    function handler () {
      el[methodName](key, value);
    }
    const differ = vm && vm._app && vm._app.differ;
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
  const watcher = new Watcher(vm, calc, function (value, oldValue) {
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
  const doc = vm._app.doc;
  return doc.createBody(type)
}

/**
 * Create an element by type
 * Using this._app.doc
 *
 * @param  {string} type
 */
function createElement (vm, type) {
  const doc = vm._app.doc;
  return doc.createElement(type)
}

/**
 * Create and return a frag block for an element.
 * The frag block has a starter, ender and the element itself.
 *
 * @param  {object} element
 */
function createBlock (vm, element) {
  const start = createBlockStart(vm);
  const end = createBlockEnd(vm);
  const blockId = lastestBlockId++;
  if (element.element) {
    let updateMark = element.updateMark;
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
  return { start, end, element, blockId }
}

let lastestBlockId = 1;

/**
 * Create and return a block starter.
 * Using this._app.doc
 */
function createBlockStart (vm) {
  const doc = vm._app.doc;
  const anchor = doc.createComment('start');
  return anchor
}

/**
 * Create and return a block ender.
 * Using this._app.doc
 */
function createBlockEnd (vm) {
  const doc = vm._app.doc;
  const anchor = doc.createComment('end');
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
    const before = dest.end;
    const after = dest.updateMark;
    // push new target for watch list update later
    if (dest.children) {
      dest.children.push(target);
    }
    // for check repeat case
    if (after) {
      const signal = moveTarget(vm, target, after);
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
  const parent = after.parentNode;
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
  const parent = after.parentNode;

  if (parent) {
    let el = fragBlock.start;
    let signal;
    const group = [el];

    while (el && el !== fragBlock.end) {
      el = el.nextSibling;
      group.push(el);
    }

    let temp = after;
    group.every((el) => {
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
function removeTarget (vm, target, preserveBlock = false) {
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
  const parent = target.parentNode;

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
function removeBlock (fragBlock, preserveBlock = false) {
  const result = [];
  let el = fragBlock.start.nextSibling;

  while (el && el !== fragBlock.end) {
    result.push(el);
    el = el.nextSibling;
  }

  if (!preserveBlock) {
    removeElement(fragBlock.start);
  }
  result.forEach((el) => {
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
  const opt = vm._options || {};
  const template = opt.template || {};

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

  console.debug(`[JS Framework] "ready" lifecycle in Vm(${vm._type})`);
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
  const app = vm._app || {};

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
  const typeGetter = meta.type || target.type;
  if (targetNeedCheckType(typeGetter, meta)) {
    compileType(vm, target, dest, typeGetter, meta);
    return
  }
  const type = typeGetter;
  const component = targetIsComposed(vm, target, type);
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
  let component;
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
  const fragBlock = createBlock(vm, dest);
  target.forEach((child) => {
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
  const repeat = target.repeat;
  const oldStyle = typeof repeat === 'function';
  let getter = repeat.getter || repeat.expression || repeat;
  if (typeof getter !== 'function') {
    getter = function () { return [] };
  }
  const key = repeat.key || '$index';
  const value = repeat.value || '$value';
  const trackBy = repeat.trackBy || target.trackBy ||
    (target.attr && target.attr.trackBy);

  const fragBlock = createBlock(vm, dest);
  fragBlock.children = [];
  fragBlock.data = [];
  fragBlock.vms = [];

  bindRepeat(vm, target, fragBlock, { getter, key, value, trackBy, oldStyle });
}

/**
 * Compile a target with if directive.
 *
 * @param {object} target
 * @param {object} dest
 * @param {object} meta
 */
function compileShown (vm, target, dest, meta) {
  const newMeta = { shown: true };
  const fragBlock = createBlock(vm, dest);

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
  const type = typeGetter.call(vm);
  const newMeta = extend({ type }, meta);
  const fragBlock = createBlock(vm, dest);

  if (dest.element && dest.children) {
    dest.children.push(fragBlock);
  }

  watch(vm, typeGetter, (value) => {
    const newMeta = extend({ type: value }, meta);
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
  const Ctor = vm.constructor;
  const subVm = new Ctor(type, component, vm, dest, undefined, {
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

  let element;
  if (dest.ref === '_documentElement') {
    // if its parent is documentElement then it's a body
    console.debug(`[JS Framework] compile to create body for ${type}`);
    element = createBody(vm, type);
  }
  else {
    console.debug(`[JS Framework] compile to create element for ${type}`);
    element = createElement(vm, type);
  }

  if (!vm._rootEl) {
    vm._rootEl = element;
    // bind event earlier because of lifecycle issues
    const binding = vm._externalBinding || {};
    const target = binding.template;
    const parentVm = binding.parent;
    if (target && target.events && parentVm && element) {
      for (const type in target.events) {
        const handler = parentVm[target.events[type]];
        if (handler) {
          element.addEvent(type, bind(handler, parentVm));
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

  const treeMode = template.append === 'tree';
  const app = vm._app || {};
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
  const app = vm._app || {};
  const children = template.children;
  if (children && children.length) {
    children.every((child) => {
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
  const vms = fragBlock.vms;
  const children = fragBlock.children;
  const { getter, trackBy, oldStyle } = info;
  const keyName = info.key;
  const valueName = info.value;

  function compileItem (item, index, context) {
    let mergedData;
    if (oldStyle) {
      mergedData = item;
      if (isObject(item)) {
        mergedData[keyName] = index;
        if (!mergedData.hasOwnProperty('INDEX')) {
          Object.defineProperty(mergedData, 'INDEX', {
            value: () => {
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
    const newContext = mergeContext(context, mergedData);
    vms.push(newContext);
    compile(newContext, target, fragBlock, { repeat: item });
  }

  const list = watchBlock(vm, fragBlock, getter, 'repeat',
    (data) => {
      console.debug('[JS Framework] the "repeat" item has changed', data);
      if (!fragBlock || !data) {
        return
      }

      const oldChildren = children.slice();
      const oldVms = vms.slice();
      const oldData = fragBlock.data.slice();
      // 1. collect all new refs track by
      const trackMap = {};
      const reusedMap = {};
      data.forEach((item, index) => {
        const key = trackBy ? item[trackBy] : (oldStyle ? item[keyName] : index);
        /* istanbul ignore if */
        if (key == null || key === '') {
          return
        }
        trackMap[key] = item;
      });

      // 2. remove unused element foreach old item
      const reusedList = [];
      oldData.forEach((item, index) => {
        const key = trackBy ? item[trackBy] : (oldStyle ? item[keyName] : index);
        if (trackMap.hasOwnProperty(key)) {
          reusedMap[key] = {
            item, index, key,
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

      data.forEach((item, index) => {
        const key = trackBy ? item[trackBy] : (oldStyle ? item[keyName] : index);
        const reused = reusedMap[key];
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
  list.forEach((item, index) => {
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
  const display = watchBlock(vm, fragBlock, target.shown, 'shown',
    (display) => {
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
  const differ = vm && vm._app && vm._app.differ;
  const config = {};
  const depth = (fragBlock.element.depth || 0) + 1;

  return watch(vm, calc, (value) => {
    config.latestValue = value;
    if (differ && !config.recorded) {
      differ.append(type, depth, fragBlock.blockId, () => {
        const latestValue = config.latestValue;
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
  const newContext = Object.create(context);
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

  let shouldStop = false;

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
  const events = this._vmEvents;
  const handlerList = events[type];
  if (handlerList) {
    const evt = new Evt(type, detail);
    handlerList.forEach((handler) => {
      handler.call(this, evt);
    });
  }
}

/**
 * Emit an event and dispatch it up.
 * @param  {string} type
 * @param  {any}    detail
 */
function $dispatch (type, detail) {
  const evt = new Evt(type, detail);
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
  const evt = new Evt(type, detail);
  this.$emit(type, evt);

  if (!evt.hasStopped() && this._childrenVms) {
    this._childrenVms.forEach((subVm) => {
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
  const events = this._vmEvents;
  const handlerList = events[type] || [];
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
  const events = this._vmEvents;
  if (!handler) {
    delete events[type];
    return
  }
  const handlerList = events[type];
  if (!handlerList) {
    return
  }
  handlerList.$remove(handler);
}

const LIFE_CYCLE_TYPES = ['init', 'created', 'ready', 'destroyed'];

/**
 * Init events:
 * 1. listen `events` in component options & `externalEvents`.
 * 2. bind lifecycle hooks.
 * @param  {Vm}     vm
 * @param  {object} externalEvents
 */
function initEvents (vm, externalEvents) {
  const options = vm._options || {};
  const events = options.events || {};
  for (const type1 in events) {
    vm.$on(type1, events[type1]);
  }
  for (const type2 in externalEvents) {
    vm.$on(type2, externalEvents[type2]);
  }
  LIFE_CYCLE_TYPES.forEach((type) => {
    vm.$on(`hook:${type}`, options[type]);
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

  const data = options.data || {};

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

  console.debug(`[JS Framework] "init" lifecycle in Vm(${this._type})`);
  this.$emit('hook:init');
  this._inited = true;

  // proxy data and methods
  // observe data and add this to vms
  this._data = typeof data === 'function' ? data() : data;
  if (mergedData) {
    extend(this._data, mergedData);
  }
  initState(this);

  console.debug(`[JS Framework] "created" lifecycle in Vm(${this._type})`);
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
let nativeModules = {};

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
  for (const moduleName in modules) {
    // init `modules[moduleName][]`
    let methods = nativeModules[moduleName];
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
  }
}

/**
 * init app methods
 */
function initMethods$1 (Vm, apis) {
  const p = Vm.prototype;

  for (const apiName in apis) {
    if (!p.hasOwnProperty(apiName)) {
      p[apiName] = apis[apiName];
    }
  }
}

/**
 * get a module of methods for an app instance
 */
function requireModule (app, name) {
  const methods = nativeModules[name];
  const target = {};
  for (const methodName in methods) {
    Object.defineProperty(target, methodName, {
      configurable: true,
      enumerable: true,
      get: function moduleGetter () {
        return (...args) => app.callTasks({
          module: name,
          method: methodName,
          args: args
        })
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
  }
  return target
}

/**
 * get a custom component options
 */
function requireCustomComponent (app, name) {
  const { customComponentMap } = app;
  return customComponentMap[name]
}

/**
 * register a custom component options
 */
function registerCustomComponent (app, name, def) {
  const { customComponentMap } = app;

  if (customComponentMap[name]) {
    console.error(`[JS Framework] define a component(${name}) that already exists`);
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
  /* nomin */ debug = function() {
    /* nomin */ var args = Array.prototype.slice.call(arguments, 0);
    /* nomin */ args.unshift('SEMVER');
    /* nomin */ console.log.apply(console, args);
    /* nomin */ };
/* nomin */ else
  /* nomin */ debug = function() {};

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
    re[i] = new RegExp(src[i]);
}

exports.parse = parse;
function parse(version, loose) {
  if (version instanceof SemVer)
    return version;

  if (typeof version !== 'string')
    return null;

  if (version.length > MAX_LENGTH)
    return null;

  var r = loose ? re[LOOSE] : re[FULL];
  if (!r.test(version))
    return null;

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
      return version;
    else
      version = version.version;
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version);
  }

  if (version.length > MAX_LENGTH)
    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')

  if (!(this instanceof SemVer))
    return new SemVer(version, loose);

  debug('SemVer', version, loose);
  this.loose = loose;
  var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);

  if (!m)
    throw new TypeError('Invalid Version: ' + version);

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0)
    throw new TypeError('Invalid major version')

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0)
    throw new TypeError('Invalid minor version')

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0)
    throw new TypeError('Invalid patch version')

  // numberify any prerelease numeric ids
  if (!m[4])
    this.prerelease = [];
  else
    this.prerelease = m[4].split('.').map(function(id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id;
        if (num >= 0 && num < MAX_SAFE_INTEGER)
          return num;
      }
      return id;
    });

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function() {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  if (this.prerelease.length)
    this.version += '-' + this.prerelease.join('.');
  return this.version;
};

SemVer.prototype.toString = function() {
  return this.version;
};

SemVer.prototype.compare = function(other) {
  debug('SemVer.compare', this.version, this.loose, other);
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return this.compareMain(other) || this.comparePre(other);
};

SemVer.prototype.compareMain = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch);
};

SemVer.prototype.comparePre = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length)
    return -1;
  else if (!this.prerelease.length && other.prerelease.length)
    return 1;
  else if (!this.prerelease.length && !other.prerelease.length)
    return 0;

  var i = 0;
  do {
    var a = this.prerelease[i];
    var b = other.prerelease[i];
    debug('prerelease compare', i, a, b);
    if (a === undefined && b === undefined)
      return 0;
    else if (b === undefined)
      return 1;
    else if (a === undefined)
      return -1;
    else if (a === b)
      continue;
    else
      return compareIdentifiers(a, b);
  } while (++i);
};

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function(release, identifier) {
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
        this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;

    case 'major':
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0)
        this.major++;
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
        this.minor++;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0)
        this.patch++;
      this.prerelease = [];
      break;
    // This probably shouldn't be used publicly.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0)
        this.prerelease = [0];
      else {
        var i = this.prerelease.length;
        while (--i >= 0) {
          if (typeof this.prerelease[i] === 'number') {
            this.prerelease[i]++;
            i = -2;
          }
        }
        if (i === -1) // didn't increment anything
          this.prerelease.push(0);
      }
      if (identifier) {
        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
        if (this.prerelease[0] === identifier) {
          if (isNaN(this.prerelease[1]))
            this.prerelease = [identifier, 0];
        } else
          this.prerelease = [identifier, 0];
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
      if (typeof a === 'object') a = a.version;
      if (typeof b === 'object') b = b.version;
      ret = a === b;
      break;
    case '!==':
      if (typeof a === 'object') a = a.version;
      if (typeof b === 'object') b = b.version;
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
      return comp;
    else
      comp = comp.value;
  }

  if (!(this instanceof Comparator))
    return new Comparator(comp, loose);

  debug('comparator', comp, loose);
  this.loose = loose;
  this.parse(comp);

  if (this.semver === ANY)
    this.value = '';
  else
    this.value = this.operator + this.semver.version;

  debug('comp', this);
}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m)
    throw new TypeError('Invalid comparator: ' + comp);

  this.operator = m[1];
  if (this.operator === '=')
    this.operator = '';

  // if it literally is just '>' or '' then allow anything.
  if (!m[2])
    this.semver = ANY;
  else
    this.semver = new SemVer(m[2], this.loose);
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {
  debug('Comparator.test', version, this.loose);

  if (this.semver === ANY)
    return true;

  if (typeof version === 'string')
    version = new SemVer(version, this.loose);

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
    return new Range(range, loose);

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
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    else if (isX(p))
      // ~1.2 == >=1.2.0 <1.3.0
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    else if (pr) {
      debug('replaceTilde pr', pr);
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      ret = '>=' + M + '.' + m + '.' + p + pr +
            ' <' + M + '.' + (+m + 1) + '.0';
    } else
      // ~1.2.3 == >=1.2.3 <1.3.0
      ret = '>=' + M + '.' + m + '.' + p +
            ' <' + M + '.' + (+m + 1) + '.0';

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
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    else if (isX(p)) {
      if (M === '0')
        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
      else
        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
    } else if (pr) {
      debug('replaceCaret pr', pr);
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      if (M === '0') {
        if (m === '0')
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + m + '.' + (+p + 1);
        else
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + (+m + 1) + '.0';
      } else
        ret = '>=' + M + '.' + m + '.' + p + pr +
              ' <' + (+M + 1) + '.0.0';
    } else {
      debug('no pr');
      if (M === '0') {
        if (m === '0')
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + m + '.' + (+p + 1);
        else
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0';
      } else
        ret = '>=' + M + '.' + m + '.' + p +
              ' <' + (+M + 1) + '.0.0';
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
      gtlt = '';

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
        m = 0;
      if (xp)
        p = 0;

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
          M = +M + 1;
        else
          m = +m + 1;
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
    from = '';
  else if (isX(fm))
    from = '>=' + fM + '.0.0';
  else if (isX(fp))
    from = '>=' + fM + '.' + fm + '.0';
  else
    from = '>=' + from;

  if (isX(tM))
    to = '';
  else if (isX(tm))
    to = '<' + (+tM + 1) + '.0.0';
  else if (isX(tp))
    to = '<' + tM + '.' + (+tm + 1) + '.0';
  else if (tpr)
    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
  else
    to = '<=' + to;

  return (from + ' ' + to).trim();
}


// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function(version) {
  if (!version)
    return false;

  if (typeof version === 'string')
    version = new SemVer(version, this.loose);

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version))
      return true;
  }
  return false;
};

function testSet(set, version) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version))
      return false;
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
        continue;

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch)
          return true;
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
  const isValid = semver.valid(v);
  if (isValid) {
    return v
  }

  v = typeof (v) === 'string' ? v : '';
  const split = v.split('.');
  let i = 0;
  const result = [];

  while (i < 3) {
    const s = typeof (split[i]) === 'string' && split[i] ? split[i] : '0';
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
  const result = {
    isDowngrade: true,
    errorType: 1,
    code: 1000
  };
  const getMsg = function (key, val, criteria) {
    return 'Downgrade[' + key + '] :: deviceInfo '
      + val + ' matched criteria ' + criteria
  };
  const _key = key.toLowerCase();

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

  let result = {
    isDowngrade: false // defautl is pass
  };

  if (typof$1(config) === 'function') {
    let customDowngrade = config.call(this, deviceInfo, {
      semver: semver,
      normalizeVersion
    });

    customDowngrade = !!customDowngrade;

    result = customDowngrade ? getError('custom', '', 'custom params') : result;
  }
  else {
    config = isPlainObject(config) ? config : {};

    const platform = deviceInfo.platform || 'unknow';
    const dPlatform = platform.toLowerCase();
    const cObj = config[dPlatform] || {};

    for (const i in deviceInfo) {
      const key = i;
      const keyLower = key.toLowerCase();
      const val = deviceInfo[i];
      const isVersion = keyLower.indexOf('version') >= 0;
      const isDeviceModel = keyLower.indexOf('devicemodel') >= 0;
      const criteria = cObj[i];

      if (criteria && isVersion) {
        const c = normalizeVersion(criteria);
        const d = normalizeVersion(deviceInfo[i]);

        if (semver.satisfies(d, c)) {
          result = getError(key, val, criteria);
          break
        }
      }
      else if (isDeviceModel) {
        const _criteria = typof$1(criteria) === 'array' ? criteria : [criteria];
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
function setViewport (app, configs = {}) {
  /* istanbul ignore if */
  {
    console.debug(`[JS Framework] Set viewport (width: ${configs.width}) for app#${app.id}.`);
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
    console.warn(`[JS Framework] Can't find "callTasks" method on current app.`);
  }
}

/**
 * Validate the viewport config.
 * @param {Object} configs
 */
function validateViewport (configs = {}) {
  const { width } = configs;
  if (width) {
    if (typeof width !== 'number' && width !== 'device-width') {
      console.warn(`[JS Framework] Not support to use ${width} as viewport width.`);
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
  console.debug(`[JS Framework] bootstrap for ${name}`);

  // 1. validate custom component name first
  let cleanName;
  if (isWeexComponent(name)) {
    cleanName = removeWeexPrefix(name);
  }
  else if (isNpmModule(name)) {
    cleanName = removeJSSurfix(name);
    // check if define by old 'define' method
    /* istanbul ignore if */
    if (!requireCustomComponent(app, cleanName)) {
      return new Error(`It's not a component: ${name}`)
    }
  }
  else {
    return new Error(`Wrong component name: ${name}`)
  }

  // 2. validate configuration
  config = isPlainObject(config) ? config : {};
  // 2.1 transformer version check
  if (typeof config.transformerVersion === 'string' &&
    typeof global.transformerVersion === 'string' &&
    !semver.satisfies(config.transformerVersion,
      global.transformerVersion)) {
    return new Error(`JS Bundle version: ${config.transformerVersion} ` +
      `not compatible with ${global.transformerVersion}`)
  }
  // 2.2 downgrade version check
  const downgradeResult = check(config.downgrade);
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
    return new Error(`Downgrade[${downgradeResult.code}]: ${downgradeResult.errorMessage}`)
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
const defineFn = function (app, name, ...args) {
  console.debug(`[JS Framework] define a component ${name}`);

  // adapt args:
  // 1. name, deps[], factory()
  // 2. name, factory()
  // 3. name, definition{}
  let factory, definition;
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
    const r = (name) => {
      if (isWeexComponent(name)) {
        const cleanName = removeWeexPrefix(name);
        return requireCustomComponent(app, cleanName)
      }
      if (isWeexModule(name)) {
        const cleanName = removeWeexPrefix(name);
        return app.requireModule(cleanName)
      }
      if (isNormalModule(name) || isNpmModule(name)) {
        const cleanName = removeJSSurfix(name);
        return app.commonModules[cleanName]
      }
    };
    const m = { exports: {}};
    factory(r, m.exports, m);
    definition = m.exports;
  }

  // apply definition
  if (isWeexComponent(name)) {
    const cleanName = removeWeexPrefix(name);
    registerCustomComponent(app, cleanName, definition);
  }
  else if (isWeexModule(name)) {
    const cleanName = removeWeexPrefix(name);
    initModules({ [cleanName]: definition });
  }
  else if (isNormalModule(name)) {
    const cleanName = removeJSSurfix(name);
    app.commonModules[cleanName] = definition;
  }
  else if (isNpmModule(name)) {
    const cleanName = removeJSSurfix(name);
    if (definition.template ||
        definition.style ||
        definition.methods) {
      // downgrade to old define method (define('componentName', factory))
      // the exports contain one key of template, style or methods
      // but it has risk!!!
      registerCustomComponent(app, cleanName, definition);
    }
    else {
      app.commonModules[cleanName] = definition;
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
  console.debug(`[JS Framework] Refresh with`, data, `in instance[${app.id}]`);
  const vm = app.vm;
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
  return new Error(`invalid data "${data}"`)
}

/**
 * Destroy an app.
 * @param  {object} app
 */
function destroy (app) {
  console.debug(`[JS Framework] Destory an instance(${app.id})`);

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
    let watcherCount = vm._watchers.length;
    while (watcherCount--) {
      vm._watchers[watcherCount].teardown();
    }
    delete vm._watchers;
  }

  // destroy child vms recursively
  if (vm._childrenVms) {
    let vmCount = vm._childrenVms.length;
    while (vmCount--) {
      destroyVm(vm._childrenVms[vmCount]);
    }
    delete vm._childrenVms;
  }

  console.debug(`[JS Framework] "destroyed" lifecycle in Vm(${vm._type})`);
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
  const doc = app.doc || {};
  const body = doc.body || {};
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
  console.debug(`[JS Framework] Fire a "${type}" event on an element(${ref}) in instance(${app.id})`);
  if (Array.isArray(ref)) {
    ref.some((ref) => {
      return fireEvent$1(app, ref, type, e) !== false
    });
    return
  }
  const el = app.doc.getRef(ref);
  if (el) {
    const result = app.doc.fireEvent(el, type, e, domChanges);
    app.differ.flush();
    app.doc.taskCenter.send('dom', { action: 'updateFinish' }, []);
    return result
  }
  return new Error(`invalid element reference "${ref}"`)
}

/**
 * Make a callback for a certain app.
 * @param  {object}   app
 * @param  {number}   callbackId
 * @param  {any}      data
 * @param  {boolean}  ifKeepAlive
 */
function callback$1 (app, callbackId, data, ifKeepAlive) {
  console.debug(`[JS Framework] Invoke a callback(${callbackId}) with`, data, `in instance(${app.id})`);
  const result = app.doc.taskCenter.callback(callbackId, data, ifKeepAlive);
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
  let result;

  /* istanbul ignore next */
  if (typof$1(tasks) !== 'array') {
    tasks = [tasks];
  }

  tasks.forEach(task => {
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
  let result;

  // prepare app env methods
  const bundleDefine = (...args) => defineFn(app, ...args);
  const bundleBootstrap = (name, config, _data) => {
    result = bootstrap(app, name, config, _data || data);
    updateActions(app);
    app.doc.listener.createFinish();
    console.debug(`[JS Framework] After intialized an instance(${app.id})`);
  };
  const bundleVm = Vm;
  /* istanbul ignore next */
  const bundleRegister = (...args) => register$1(app, ...args);
  /* istanbul ignore next */
  const bundleRender = (name, _data) => {
    result = bootstrap(app, name, {}, _data);
  };
  /* istanbul ignore next */
  const bundleRequire = name => _data => {
    result = bootstrap(app, name, {}, _data);
  };
  const bundleDocument = app.doc;
  /* istanbul ignore next */
  const bundleRequireModule = name => app.requireModule(removeWeexPrefix(name));

  const weexGlobalObject = {
    config: app.options,
    define: bundleDefine,
    bootstrap: bundleBootstrap,
    requireModule: bundleRequireModule,
    document: bundleDocument,
    Vm: bundleVm
  };

  Object.freeze(weexGlobalObject);

  // prepare code
  let functionBody;
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
  functionBody = `(function(global){\n\n"use strict";\n\n ${functionBody} \n\n})(Object.create(this))`;

  // run code and get result
  const { WXEnvironment } = global;
  const timerAPIs = {};

  /* istanbul ignore if */
  if (WXEnvironment && WXEnvironment.platform !== 'Web') {
    // timer APIs polyfill in native
    const timer = app.requireModule('timer');
    Object.assign(timerAPIs, {
      setTimeout: (...args) => {
        const handler = function () {
          args[0](...args.slice(2));
        };
        timer.setTimeout(handler, args[1]);
        return app.doc.taskCenter.callbackManager.lastCallbackId.toString()
      },
      setInterval: (...args) => {
        const handler = function () {
          args[0](...args.slice(2));
        };
        timer.setInterval(handler, args[1]);
        return app.doc.taskCenter.callbackManager.lastCallbackId.toString()
      },
      clearTimeout: (n) => {
        timer.clearTimeout(n);
      },
      clearInterval: (n) => {
        timer.clearInterval(n);
      }
    });
  }
  // run code and get result
  const globalObjects = Object.assign({
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
  const globalKeys = [];
  const globalValues = [];
  for (const key in globalObjects) {
    globalKeys.push(key);
    globalValues.push(globalObjects[key]);
  }
  globalKeys.push(body);

  const result = new Function(...globalKeys);
  return result(...globalValues)
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

  let fn = void 0;
  let isNativeCompileOk = false;
  let script = '(function (';
  const globalKeys = [];
  const globalValues = [];
  for (const key in globalObjects) {
    globalKeys.push(key);
    globalValues.push(globalObjects[key]);
  }
  for (let i = 0; i < globalKeys.length - 1; ++i) {
    script += globalKeys[i];
    script += ',';
  }
  script += globalKeys[globalKeys.length - 1];
  script += ') {';
  script += body;
  script += '} )';

  try {
    const weex = globalObjects.weex || {};
    const config = weex.config || {};
    fn = compileAndRunBundle(script, config.bundleUrl, config.bundleDigest, config.codeCachePath);
    if (fn && typeof fn === 'function') {
      fn(...globalValues);
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
class Differ {
  constructor (id) {
    this.id = id;
    this.map = [];
    this.hooks = [];
  }
  isEmpty () {
    return this.map.length === 0
  }
  append (type, depth = 0, ref, handler) {
    if (!this.hasTimer) {
      this.hasTimer = true;
      setTimeout(() => {
        this.hasTimer = false;
        this.flush(true);
      }, 0);
    }
    const map = this.map;
    if (!map[depth]) {
      map[depth] = {};
    }
    const group = map[depth];
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
  }
  flush (isTimeout) {
    const map = this.map.slice();
    this.map.length = 0;
    map.forEach((group) => {
      callTypeMap(group, 'repeat');
      callTypeMap(group, 'shown');
      callTypeList(group, 'element');
    });

    const hooks = this.hooks.slice();
    this.hooks.length = 0;
    hooks.forEach((fn) => {
      fn();
    });

    if (!this.isEmpty()) {
      this.flush();
    }
  }
  then (fn) {
    this.hooks.push(fn);
  }
}

function callTypeMap (group, type) {
  const map = group[type];
  for (const ref in map) {
    map[ref]();
  }
}

function callTypeList (group, type) {
  const map = group[type];
  for (const ref in map) {
    const list = map[ref];
    list.forEach((handler) => { handler(); });
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
const instanceMap = {};

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
  const { services } = info || {};
  resetTarget();
  let instance = instanceMap[id];
  /* istanbul ignore else */
  options = options || {};
  let result;
  /* istanbul ignore else */
  if (!instance) {
    instance = new App$1(id, options);
    instanceMap[id] = instance;
    result = init$2(instance, code, data, services);
  }
  else {
    result = new Error(`invalid instance id "${id}"`);
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
  const instance = instanceMap[id];
  let result;
  /* istanbul ignore else */
  if (instance) {
    result = refresh(instance, data);
  }
  else {
    result = new Error(`invalid instance id "${id}"`);
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
  const instance = instanceMap[id];
  /* istanbul ignore else */
  if (!instance) {
    return new Error(`invalid instance id "${id}"`)
  }
  destroy(instance);
  delete instanceMap[id];
  // notifyContextDisposed is used to tell v8 to do a full GC,
  // but this would have a negative performance impact on weex,
  // because all the inline cache in v8 would get cleared
  // during a full GC.
  // To take care of both memory and performance, just tell v8
  // to do a full GC every eighteen times.
  const idNum = Math.round(id);
  const round = 18;
  if (idNum > 0) {
    const remainder = idNum % round;
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
const {
  nativeComponentMap: nativeComponentMap$1
} = config$2;

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
const jsHandlers = {
  fireEvent: (id, ...args) => {
    return fireEvent$1(instanceMap[id], ...args)
  },
  callback: (id, ...args) => {
    return callback$1(instanceMap[id], ...args)
  }
};

/**
 * Accept calls from native (event or callback).
 *
 * @param  {string} id
 * @param  {array} tasks list with `method` and `args`
 */
function receiveTasks$1 (id, tasks) {
  const instance = instanceMap[id];
  if (instance && Array.isArray(tasks)) {
    const results = [];
    tasks.forEach((task) => {
      const handler = jsHandlers[task.method];
      const args = [...task.args];
      /* istanbul ignore else */
      if (typeof handler === 'function') {
        args.unshift(id);
        results.push(handler(...args));
      }
    });
    return results
  }
  return new Error(`invalid instance id "${id}" or tasks`)
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
  const instance = instanceMap[id];
  let result;
  /* istanbul ignore else */
  if (instance) {
    result = getRootElement(instance);
  }
  else {
    result = new Error(`invalid instance id "${id}"`);
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

setup({ Weex });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VleC1sZWdhY3kuZXM2LmpzIiwic291cmNlcyI6WyIuLi9ydW50aW1lL3NoYXJlZC91dGlscy5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL25vcm1hbGl6ZS5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL0NhbGxiYWNrTWFuYWdlci5qcyIsIi4uL3J1bnRpbWUvdmRvbS9vcGVyYXRpb24uanMiLCIuLi9ydW50aW1lL3Zkb20vTm9kZS5qcyIsIi4uL3J1bnRpbWUvdmRvbS9XZWV4RWxlbWVudC5qcyIsIi4uL3J1bnRpbWUvdmRvbS9FbGVtZW50LmpzIiwiLi4vcnVudGltZS9icmlkZ2UvVGFza0NlbnRlci5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL3JlY2VpdmVyLmpzIiwiLi4vcnVudGltZS9hcGkvbW9kdWxlLmpzIiwiLi4vcnVudGltZS9hcGkvY29tcG9uZW50LmpzIiwiLi4vcnVudGltZS9hcGkvc2VydmljZS5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL2RlYnVnLmpzIiwiLi4vcnVudGltZS92ZG9tL0NvbW1lbnQuanMiLCIuLi9ydW50aW1lL2JyaWRnZS9MaXN0ZW5lci5qcyIsIi4uL3J1bnRpbWUvYnJpZGdlL0hhbmRsZXIuanMiLCIuLi9ydW50aW1lL3Zkb20vRG9jdW1lbnQuanMiLCIuLi9ydW50aW1lL2FwaS9XZWV4SW5zdGFuY2UuanMiLCIuLi9ydW50aW1lL2FwaS9pbml0LmpzIiwiLi4vcnVudGltZS92ZG9tL2luZGV4LmpzIiwiLi4vcnVudGltZS9hcGkvY29uZmlnLmpzIiwiLi4vcnVudGltZS9hcGkvaW5kZXguanMiLCIuLi9ydW50aW1lL3NlcnZpY2VzL2Jyb2FkY2FzdC1jaGFubmVsL21lc3NhZ2UtZXZlbnQuanMiLCIuLi9ydW50aW1lL3NlcnZpY2VzL2Jyb2FkY2FzdC1jaGFubmVsL2luZGV4LmpzIiwiLi4vcnVudGltZS9zZXJ2aWNlcy9pbmRleC5qcyIsIi4uL3J1bnRpbWUvZW50cmllcy9zZXR1cC5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBpL21ldGhvZHMuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3V0aWwvc2hhcmVkLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS91dGlsL2luZGV4LmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9jb3JlL2RlcC5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvY29yZS93YXRjaGVyLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9jb3JlL2FycmF5LmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9jb3JlL29ic2VydmVyLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9jb3JlL3N0YXRlLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9jb25maWcuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3ZtL2RpcmVjdGl2ZS5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvdm0vZG9tLWhlbHBlci5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvdm0vY29tcGlsZXIuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L3ZtL2V2ZW50cy5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvdm0vaW5kZXguanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2FwcC9yZWdpc3Rlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9zZW12ZXIvc2VtdmVyLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcHAvZG93bmdyYWRlLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcHAvdmlld3BvcnQuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2FwcC9idW5kbGUvYm9vdHN0cmFwLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9hcHAvYnVuZGxlL2RlZmluZS5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL2J1bmRsZS9pbmRleC5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL2N0cmwvbWlzYy5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL2N0cmwvaW5pdC5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL2N0cmwvaW5kZXguanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2FwcC9kaWZmZXIuanMiLCIuLi9ydW50aW1lL2ZyYW1ld29ya3MvbGVnYWN5L2FwcC9pbnN0YW5jZS5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvYXBwL2luZGV4LmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9zdGF0aWMvbWFwLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9zdGF0aWMvY3JlYXRlLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9zdGF0aWMvbGlmZS5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvc3RhdGljL3JlZ2lzdGVyLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9zdGF0aWMvYnJpZGdlLmpzIiwiLi4vcnVudGltZS9mcmFtZXdvcmtzL2xlZ2FjeS9zdGF0aWMvbWlzYy5qcyIsIi4uL3J1bnRpbWUvZnJhbWV3b3Jrcy9sZWdhY3kvaW5kZXguanMiLCIuLi9ydW50aW1lL2VudHJpZXMvbGVnYWN5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEdldCBhIHVuaXF1ZSBpZC5cbiAqL1xubGV0IG5leHROb2RlUmVmID0gMVxuZXhwb3J0IGZ1bmN0aW9uIHVuaXF1ZUlkICgpIHtcbiAgcmV0dXJuIChuZXh0Tm9kZVJlZisrKS50b1N0cmluZygpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0eXBvZiAodikge1xuICBjb25zdCBzID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHYpXG4gIHJldHVybiBzLnN1YnN0cmluZyg4LCBzLmxlbmd0aCAtIDEpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWZmZXJUb0Jhc2U2NCAoYnVmZmVyKSB7XG4gIGlmICh0eXBlb2YgYnRvYSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiAnJ1xuICB9XG4gIGNvbnN0IHN0cmluZyA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChcbiAgICBuZXcgVWludDhBcnJheShidWZmZXIpLFxuICAgIGNvZGUgPT4gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKVxuICApLmpvaW4oJycpXG4gIHJldHVybiBidG9hKHN0cmluZykgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxufVxuXG5leHBvcnQgZnVuY3Rpb24gYmFzZTY0VG9CdWZmZXIgKGJhc2U2NCkge1xuICBpZiAodHlwZW9mIGF0b2IgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gbmV3IEFycmF5QnVmZmVyKDApXG4gIH1cbiAgY29uc3Qgc3RyaW5nID0gYXRvYihiYXNlNjQpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcbiAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShzdHJpbmcubGVuZ3RoKVxuICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHN0cmluZywgKGNoLCBpKSA9PiB7XG4gICAgYXJyYXlbaV0gPSBjaC5jaGFyQ29kZUF0KDApXG4gIH0pXG4gIHJldHVybiBhcnJheS5idWZmZXJcbn1cblxuLyoqXG4gKiBEZXRlY3QgaWYgdGhlIHBhcmFtIGlzIGZhbHN5IG9yIGVtcHR5XG4gKiBAcGFyYW0ge2FueX0gYW55XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0VtcHR5IChhbnkpIHtcbiAgaWYgKCFhbnkgfHwgdHlwZW9mIGFueSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgaW4gYW55KSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhbnksIGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IHR5cG9mLCBidWZmZXJUb0Jhc2U2NCwgYmFzZTY0VG9CdWZmZXIgfSBmcm9tICcuLi9zaGFyZWQvdXRpbHMnXG5cbi8qKlxuICogTm9ybWFsaXplIGEgcHJpbWl0aXZlIHZhbHVlLlxuICogQHBhcmFtICB7YW55fSAgICAgICAgdlxuICogQHJldHVybiB7cHJpbWl0aXZlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUHJpbWl0aXZlICh2KSB7XG4gIGNvbnN0IHR5cGUgPSB0eXBvZih2KVxuXG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ1VuZGVmaW5lZCc6XG4gICAgY2FzZSAnTnVsbCc6XG4gICAgICByZXR1cm4gJydcblxuICAgIGNhc2UgJ1JlZ0V4cCc6XG4gICAgICByZXR1cm4gdi50b1N0cmluZygpXG4gICAgY2FzZSAnRGF0ZSc6XG4gICAgICByZXR1cm4gdi50b0lTT1N0cmluZygpXG5cbiAgICBjYXNlICdOdW1iZXInOlxuICAgIGNhc2UgJ1N0cmluZyc6XG4gICAgY2FzZSAnQm9vbGVhbic6XG4gICAgY2FzZSAnQXJyYXknOlxuICAgIGNhc2UgJ09iamVjdCc6XG4gICAgICByZXR1cm4gdlxuXG4gICAgY2FzZSAnQXJyYXlCdWZmZXInOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgJ0B0eXBlJzogJ2JpbmFyeScsXG4gICAgICAgIGRhdGFUeXBlOiB0eXBlLFxuICAgICAgICBiYXNlNjQ6IGJ1ZmZlclRvQmFzZTY0KHYpXG4gICAgICB9XG5cbiAgICBjYXNlICdJbnQ4QXJyYXknOlxuICAgIGNhc2UgJ1VpbnQ4QXJyYXknOlxuICAgIGNhc2UgJ1VpbnQ4Q2xhbXBlZEFycmF5JzpcbiAgICBjYXNlICdJbnQxNkFycmF5JzpcbiAgICBjYXNlICdVaW50MTZBcnJheSc6XG4gICAgY2FzZSAnSW50MzJBcnJheSc6XG4gICAgY2FzZSAnVWludDMyQXJyYXknOlxuICAgIGNhc2UgJ0Zsb2F0MzJBcnJheSc6XG4gICAgY2FzZSAnRmxvYXQ2NEFycmF5JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgICdAdHlwZSc6ICdiaW5hcnknLFxuICAgICAgICBkYXRhVHlwZTogdHlwZSxcbiAgICAgICAgYmFzZTY0OiBidWZmZXJUb0Jhc2U2NCh2LmJ1ZmZlcilcbiAgICAgIH1cblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodilcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlUHJpbWl0aXZlIChkYXRhKSB7XG4gIGlmICh0eXBvZihkYXRhKSA9PT0gJ09iamVjdCcpIHtcbiAgICAvLyBkZWNvZGUgYmFzZTY0IGludG8gYmluYXJ5XG4gICAgaWYgKGRhdGFbJ0B0eXBlJ10gJiYgZGF0YVsnQHR5cGUnXSA9PT0gJ2JpbmFyeScpIHtcbiAgICAgIHJldHVybiBiYXNlNjRUb0J1ZmZlcihkYXRhLmJhc2U2NCB8fCAnJylcbiAgICB9XG5cbiAgICBjb25zdCByZWFsRGF0YSA9IHt9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuICAgICAgcmVhbERhdGFba2V5XSA9IGRlY29kZVByaW1pdGl2ZShkYXRhW2tleV0pXG4gICAgfVxuICAgIHJldHVybiByZWFsRGF0YVxuICB9XG4gIGlmICh0eXBvZihkYXRhKSA9PT0gJ0FycmF5Jykge1xuICAgIHJldHVybiBkYXRhLm1hcChkZWNvZGVQcmltaXRpdmUpXG4gIH1cbiAgcmV0dXJuIGRhdGFcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBkZWNvZGVQcmltaXRpdmUgfSBmcm9tICcuL25vcm1hbGl6ZSdcblxuZnVuY3Rpb24gZ2V0SG9va0tleSAoY29tcG9uZW50SWQsIHR5cGUsIGhvb2tOYW1lKSB7XG4gIHJldHVybiBgJHt0eXBlfUAke2hvb2tOYW1lfSMke2NvbXBvbmVudElkfWBcbn1cblxuLyoqXG4gKiBGb3IgZ2VuZXJhbCBjYWxsYmFjayBtYW5hZ2VtZW50IG9mIGEgY2VydGFpbiBXZWV4IGluc3RhbmNlLlxuICogQmVjYXVzZSBmdW5jdGlvbiBjYW4gbm90IHBhc3NlZCBpbnRvIG5hdGl2ZSwgc28gd2UgY3JlYXRlIGNhbGxiYWNrXG4gKiBjYWxsYmFjayBpZCBmb3IgZWFjaCBmdW5jdGlvbiBhbmQgcGFzcyB0aGUgY2FsbGJhY2sgaWQgaW50byBuYXRpdmVcbiAqIGluIGZhY3QuIEFuZCB3aGVuIGEgY2FsbGJhY2sgY2FsbGVkIGZyb20gbmF0aXZlLCB3ZSBjYW4gZmluZCB0aGUgcmVhbFxuICogY2FsbGJhY2sgdGhyb3VnaCB0aGUgY2FsbGJhY2sgaWQgd2UgaGF2ZSBwYXNzZWQgYmVmb3JlLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDYWxsYmFja01hbmFnZXIge1xuICBjb25zdHJ1Y3RvciAoaW5zdGFuY2VJZCkge1xuICAgIHRoaXMuaW5zdGFuY2VJZCA9IFN0cmluZyhpbnN0YW5jZUlkKVxuICAgIHRoaXMubGFzdENhbGxiYWNrSWQgPSAwXG4gICAgdGhpcy5jYWxsYmFja3MgPSB7fVxuICAgIHRoaXMuaG9va3MgPSB7fVxuICB9XG4gIGFkZCAoY2FsbGJhY2spIHtcbiAgICB0aGlzLmxhc3RDYWxsYmFja0lkKytcbiAgICB0aGlzLmNhbGxiYWNrc1t0aGlzLmxhc3RDYWxsYmFja0lkXSA9IGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubGFzdENhbGxiYWNrSWRcbiAgfVxuICByZW1vdmUgKGNhbGxiYWNrSWQpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuY2FsbGJhY2tzW2NhbGxiYWNrSWRdXG4gICAgZGVsZXRlIHRoaXMuY2FsbGJhY2tzW2NhbGxiYWNrSWRdXG4gICAgcmV0dXJuIGNhbGxiYWNrXG4gIH1cbiAgcmVnaXN0ZXJIb29rIChjb21wb25lbnRJZCwgdHlwZSwgaG9va05hbWUsIGhvb2tGdW5jdGlvbikge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIGFyZ3VtZW50c1xuICAgIGNvbnN0IGtleSA9IGdldEhvb2tLZXkoY29tcG9uZW50SWQsIHR5cGUsIGhvb2tOYW1lKVxuICAgIGlmICh0aGlzLmhvb2tzW2tleV0pIHtcbiAgICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gT3ZlcnJpZGUgYW4gZXhpc3RpbmcgY29tcG9uZW50IGhvb2sgXCIke2tleX1cIi5gKVxuICAgIH1cbiAgICB0aGlzLmhvb2tzW2tleV0gPSBob29rRnVuY3Rpb25cbiAgfVxuICB0cmlnZ2VySG9vayAoY29tcG9uZW50SWQsIHR5cGUsIGhvb2tOYW1lLCBvcHRpb25zID0ge30pIHtcbiAgICAvLyBUT0RPOiB2YWxpZGF0ZSBhcmd1bWVudHNcbiAgICBjb25zdCBrZXkgPSBnZXRIb29rS2V5KGNvbXBvbmVudElkLCB0eXBlLCBob29rTmFtZSlcbiAgICBjb25zdCBob29rRnVuY3Rpb24gPSB0aGlzLmhvb2tzW2tleV1cbiAgICBpZiAodHlwZW9mIGhvb2tGdW5jdGlvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gSW52YWxpZCBob29rIGZ1bmN0aW9uIHR5cGUgKCR7dHlwZW9mIGhvb2tGdW5jdGlvbn0pIG9uIFwiJHtrZXl9XCIuYClcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBudWxsXG4gICAgdHJ5IHtcbiAgICAgIHJlc3VsdCA9IGhvb2tGdW5jdGlvbi5hcHBseShudWxsLCBvcHRpb25zLmFyZ3MgfHwgW10pXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gZXhlY3V0ZSB0aGUgaG9vayBmdW5jdGlvbiBvbiBcIiR7a2V5fVwiLmApXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBjb25zdW1lIChjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSkge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3NbY2FsbGJhY2tJZF1cbiAgICBpZiAodHlwZW9mIGlmS2VlcEFsaXZlID09PSAndW5kZWZpbmVkJyB8fCBpZktlZXBBbGl2ZSA9PT0gZmFsc2UpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmNhbGxiYWNrc1tjYWxsYmFja0lkXVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZGVjb2RlUHJpbWl0aXZlKGRhdGEpKVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEVycm9yKGBpbnZhbGlkIGNhbGxiYWNrIGlkIFwiJHtjYWxsYmFja0lkfVwiYClcbiAgfVxuICBjbG9zZSAoKSB7XG4gICAgdGhpcy5jYWxsYmFja3MgPSB7fVxuICAgIHRoaXMuaG9va3MgPSB7fVxuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuY29uc3QgZG9jTWFwID0ge31cblxuLyoqXG4gKiBBZGQgYSBkb2N1bWVudCBvYmplY3QgaW50byBkb2NNYXAuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSBkb2N1bWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkRG9jIChpZCwgZG9jKSB7XG4gIGlmIChpZCkge1xuICAgIGRvY01hcFtpZF0gPSBkb2NcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgZG9jdW1lbnQgb2JqZWN0IGJ5IGlkLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREb2MgKGlkKSB7XG4gIHJldHVybiBkb2NNYXBbaWRdXG59XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBkb2N1bWVudCBmcm9tIGRvY01hcCBieSBpZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRG9jIChpZCkge1xuICBkZWxldGUgZG9jTWFwW2lkXVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiBHZXQgbGlzdGVuZXIgYnkgZG9jdW1lbnQgaWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEByZXR1cm4ge29iamVjdH0gbGlzdGVuZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExpc3RlbmVyIChpZCkge1xuICBjb25zdCBkb2MgPSBkb2NNYXBbaWRdXG4gIGlmIChkb2MgJiYgZG9jLmxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIGRvYy5saXN0ZW5lclxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogR2V0IFRhc2tDZW50ZXIgaW5zdGFuY2UgYnkgaWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEByZXR1cm4ge29iamVjdH0gVGFza0NlbnRlclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFza0NlbnRlciAoaWQpIHtcbiAgY29uc3QgZG9jID0gZG9jTWFwW2lkXVxuICBpZiAoZG9jICYmIGRvYy50YXNrQ2VudGVyKSB7XG4gICAgcmV0dXJuIGRvYy50YXNrQ2VudGVyXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBBcHBlbmQgYm9keSBub2RlIHRvIGRvY3VtZW50RWxlbWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBkb2N1bWVudFxuICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBiZWZvcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZEJvZHkgKGRvYywgbm9kZSwgYmVmb3JlKSB7XG4gIGNvbnN0IHsgZG9jdW1lbnRFbGVtZW50IH0gPSBkb2NcblxuICBpZiAoZG9jdW1lbnRFbGVtZW50LnB1cmVDaGlsZHJlbi5sZW5ndGggPiAwIHx8IG5vZGUucGFyZW50Tm9kZSkge1xuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IGNoaWxkcmVuID0gZG9jdW1lbnRFbGVtZW50LmNoaWxkcmVuXG4gIGNvbnN0IGJlZm9yZUluZGV4ID0gY2hpbGRyZW4uaW5kZXhPZihiZWZvcmUpXG4gIGlmIChiZWZvcmVJbmRleCA8IDApIHtcbiAgICBjaGlsZHJlbi5wdXNoKG5vZGUpXG4gIH1cbiAgZWxzZSB7XG4gICAgY2hpbGRyZW4uc3BsaWNlKGJlZm9yZUluZGV4LCAwLCBub2RlKVxuICB9XG5cbiAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICBpZiAobm9kZS5yb2xlID09PSAnYm9keScpIHtcbiAgICAgIG5vZGUuZG9jSWQgPSBkb2MuaWRcbiAgICAgIG5vZGUub3duZXJEb2N1bWVudCA9IGRvY1xuICAgICAgbm9kZS5wYXJlbnROb2RlID0gZG9jdW1lbnRFbGVtZW50XG4gICAgICBsaW5rUGFyZW50KG5vZGUsIGRvY3VtZW50RWxlbWVudClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICBjaGlsZC5wYXJlbnROb2RlID0gbm9kZVxuICAgICAgfSlcbiAgICAgIHNldEJvZHkoZG9jLCBub2RlKVxuICAgICAgbm9kZS5kb2NJZCA9IGRvYy5pZFxuICAgICAgbm9kZS5vd25lckRvY3VtZW50ID0gZG9jXG4gICAgICBsaW5rUGFyZW50KG5vZGUsIGRvY3VtZW50RWxlbWVudClcbiAgICAgIGRlbGV0ZSBkb2Mubm9kZU1hcFtub2RlLm5vZGVJZF1cbiAgICB9XG4gICAgZG9jdW1lbnRFbGVtZW50LnB1cmVDaGlsZHJlbi5wdXNoKG5vZGUpXG4gICAgc2VuZEJvZHkoZG9jLCBub2RlKVxuICB9XG4gIGVsc2Uge1xuICAgIG5vZGUucGFyZW50Tm9kZSA9IGRvY3VtZW50RWxlbWVudFxuICAgIGRvYy5ub2RlTWFwW25vZGUucmVmXSA9IG5vZGVcbiAgfVxufVxuXG5mdW5jdGlvbiBzZW5kQm9keSAoZG9jLCBub2RlKSB7XG4gIGNvbnN0IGJvZHkgPSBub2RlLnRvSlNPTigpXG4gIGlmIChkb2MgJiYgZG9jLnRhc2tDZW50ZXIgJiYgdHlwZW9mIGRvYy50YXNrQ2VudGVyLnNlbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkb2MudGFza0NlbnRlci5zZW5kKCdkb20nLCB7IGFjdGlvbjogJ2NyZWF0ZUJvZHknIH0sIFtib2R5XSlcbiAgfVxufVxuXG4vKipcbiAqIFNldCB1cCBib2R5IG5vZGUuXG4gKiBAcGFyYW0ge29iamVjdH0gZG9jdW1lbnRcbiAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRCb2R5IChkb2MsIGVsKSB7XG4gIGVsLnJvbGUgPSAnYm9keSdcbiAgZWwuZGVwdGggPSAxXG4gIGRlbGV0ZSBkb2Mubm9kZU1hcFtlbC5ub2RlSWRdXG4gIGVsLnJlZiA9ICdfcm9vdCdcbiAgZG9jLm5vZGVNYXAuX3Jvb3QgPSBlbFxuICBkb2MuYm9keSA9IGVsXG59XG5cbi8qKlxuICogRXN0YWJsaXNoIHRoZSBjb25uZWN0aW9uIGJldHdlZW4gcGFyZW50IGFuZCBjaGlsZCBub2RlLlxuICogQHBhcmFtIHtvYmplY3R9IGNoaWxkIG5vZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnQgbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlua1BhcmVudCAobm9kZSwgcGFyZW50KSB7XG4gIG5vZGUucGFyZW50Tm9kZSA9IHBhcmVudFxuICBpZiAocGFyZW50LmRvY0lkKSB7XG4gICAgbm9kZS5kb2NJZCA9IHBhcmVudC5kb2NJZFxuICAgIG5vZGUub3duZXJEb2N1bWVudCA9IHBhcmVudC5vd25lckRvY3VtZW50XG4gICAgbm9kZS5vd25lckRvY3VtZW50Lm5vZGVNYXBbbm9kZS5ub2RlSWRdID0gbm9kZVxuICAgIG5vZGUuZGVwdGggPSBwYXJlbnQuZGVwdGggKyAxXG4gIH1cbiAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICBsaW5rUGFyZW50KGNoaWxkLCBub2RlKVxuICB9KVxufVxuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBzaWJsaW5nIGVsZW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbmV4dEVsZW1lbnQgKG5vZGUpIHtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIG5vZGVcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmdcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgcHJldmlvdXMgc2libGluZyBlbGVtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZXZpb3VzRWxlbWVudCAobm9kZSkge1xuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICByZXR1cm4gbm9kZVxuICAgIH1cbiAgICBub2RlID0gbm9kZS5wcmV2aW91c1NpYmxpbmdcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydCBhIG5vZGUgaW50byBsaXN0IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IG5vZGVcbiAqIEBwYXJhbSB7YXJyYXl9IGxpc3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBuZXdJbmRleFxuICogQHBhcmFtIHtib29sZWFufSBjaGFuZ2VTaWJsaW5nXG4gKiBAcmV0dXJuIHtudW1iZXJ9IG5ld0luZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRJbmRleCAodGFyZ2V0LCBsaXN0LCBuZXdJbmRleCwgY2hhbmdlU2libGluZykge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAobmV3SW5kZXggPCAwKSB7XG4gICAgbmV3SW5kZXggPSAwXG4gIH1cbiAgY29uc3QgYmVmb3JlID0gbGlzdFtuZXdJbmRleCAtIDFdXG4gIGNvbnN0IGFmdGVyID0gbGlzdFtuZXdJbmRleF1cbiAgbGlzdC5zcGxpY2UobmV3SW5kZXgsIDAsIHRhcmdldClcbiAgaWYgKGNoYW5nZVNpYmxpbmcpIHtcbiAgICBiZWZvcmUgJiYgKGJlZm9yZS5uZXh0U2libGluZyA9IHRhcmdldClcbiAgICB0YXJnZXQucHJldmlvdXNTaWJsaW5nID0gYmVmb3JlXG4gICAgdGFyZ2V0Lm5leHRTaWJsaW5nID0gYWZ0ZXJcbiAgICBhZnRlciAmJiAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nID0gdGFyZ2V0KVxuICB9XG4gIHJldHVybiBuZXdJbmRleFxufVxuXG4vKipcbiAqIE1vdmUgdGhlIG5vZGUgdG8gYSBuZXcgaW5kZXggaW4gbGlzdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgbm9kZVxuICogQHBhcmFtIHthcnJheX0gbGlzdFxuICogQHBhcmFtIHtudW1iZXJ9IG5ld0luZGV4XG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNoYW5nZVNpYmxpbmdcbiAqIEByZXR1cm4ge251bWJlcn0gbmV3SW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVJbmRleCAodGFyZ2V0LCBsaXN0LCBuZXdJbmRleCwgY2hhbmdlU2libGluZykge1xuICBjb25zdCBpbmRleCA9IGxpc3QuaW5kZXhPZih0YXJnZXQpXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmIChpbmRleCA8IDApIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoY2hhbmdlU2libGluZykge1xuICAgIGNvbnN0IGJlZm9yZSA9IGxpc3RbaW5kZXggLSAxXVxuICAgIGNvbnN0IGFmdGVyID0gbGlzdFtpbmRleCArIDFdXG4gICAgYmVmb3JlICYmIChiZWZvcmUubmV4dFNpYmxpbmcgPSBhZnRlcilcbiAgICBhZnRlciAmJiAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nID0gYmVmb3JlKVxuICB9XG4gIGxpc3Quc3BsaWNlKGluZGV4LCAxKVxuICBsZXQgbmV3SW5kZXhBZnRlciA9IG5ld0luZGV4XG4gIGlmIChpbmRleCA8PSBuZXdJbmRleCkge1xuICAgIG5ld0luZGV4QWZ0ZXIgPSBuZXdJbmRleCAtIDFcbiAgfVxuICBjb25zdCBiZWZvcmVOZXcgPSBsaXN0W25ld0luZGV4QWZ0ZXIgLSAxXVxuICBjb25zdCBhZnRlck5ldyA9IGxpc3RbbmV3SW5kZXhBZnRlcl1cbiAgbGlzdC5zcGxpY2UobmV3SW5kZXhBZnRlciwgMCwgdGFyZ2V0KVxuICBpZiAoY2hhbmdlU2libGluZykge1xuICAgIGJlZm9yZU5ldyAmJiAoYmVmb3JlTmV3Lm5leHRTaWJsaW5nID0gdGFyZ2V0KVxuICAgIHRhcmdldC5wcmV2aW91c1NpYmxpbmcgPSBiZWZvcmVOZXdcbiAgICB0YXJnZXQubmV4dFNpYmxpbmcgPSBhZnRlck5ld1xuICAgIGFmdGVyTmV3ICYmIChhZnRlck5ldy5wcmV2aW91c1NpYmxpbmcgPSB0YXJnZXQpXG4gIH1cbiAgaWYgKGluZGV4ID09PSBuZXdJbmRleEFmdGVyKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgcmV0dXJuIG5ld0luZGV4XG59XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBub2RlIGZyb20gbGlzdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgbm9kZVxuICogQHBhcmFtIHthcnJheX0gbGlzdFxuICogQHBhcmFtIHtib29sZWFufSBjaGFuZ2VTaWJsaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVJbmRleCAodGFyZ2V0LCBsaXN0LCBjaGFuZ2VTaWJsaW5nKSB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKHRhcmdldClcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIHJldHVyblxuICB9XG4gIGlmIChjaGFuZ2VTaWJsaW5nKSB7XG4gICAgY29uc3QgYmVmb3JlID0gbGlzdFtpbmRleCAtIDFdXG4gICAgY29uc3QgYWZ0ZXIgPSBsaXN0W2luZGV4ICsgMV1cbiAgICBiZWZvcmUgJiYgKGJlZm9yZS5uZXh0U2libGluZyA9IGFmdGVyKVxuICAgIGFmdGVyICYmIChhZnRlci5wcmV2aW91c1NpYmxpbmcgPSBiZWZvcmUpXG4gIH1cbiAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgdW5pcXVlSWQgfSBmcm9tICcuLi9zaGFyZWQvdXRpbHMnXG5pbXBvcnQgeyBnZXREb2MgfSBmcm9tICcuL29wZXJhdGlvbidcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTm9kZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLm5vZGVJZCA9IHVuaXF1ZUlkKClcbiAgICB0aGlzLnJlZiA9IHRoaXMubm9kZUlkXG4gICAgdGhpcy5jaGlsZHJlbiA9IFtdXG4gICAgdGhpcy5wdXJlQ2hpbGRyZW4gPSBbXVxuICAgIHRoaXMucGFyZW50Tm9kZSA9IG51bGxcbiAgICB0aGlzLm5leHRTaWJsaW5nID0gbnVsbFxuICAgIHRoaXMucHJldmlvdXNTaWJsaW5nID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICogRGVzdHJveSBjdXJyZW50IG5vZGUsIGFuZCByZW1vdmUgaXRzZWxmIGZvcm0gbm9kZU1hcC5cbiAgKi9cbiAgZGVzdHJveSAoKSB7XG4gICAgY29uc3QgZG9jID0gZ2V0RG9jKHRoaXMuZG9jSWQpXG4gICAgaWYgKGRvYykge1xuICAgICAgZGVsZXRlIHRoaXMuZG9jSWRcbiAgICAgIGRlbGV0ZSBkb2Mubm9kZU1hcFt0aGlzLm5vZGVJZF1cbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgIGNoaWxkLmRlc3Ryb3koKVxuICAgIH0pXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgZ2V0VGFza0NlbnRlciB9IGZyb20gJy4vb3BlcmF0aW9uJ1xuXG5sZXQgRWxlbWVudFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0RWxlbWVudCAoRWwpIHtcbiAgRWxlbWVudCA9IEVsXG59XG5cbi8qKlxuICogQSBtYXAgd2hpY2ggc3RvcmVzIGFsbCB0eXBlIG9mIGVsZW1lbnRzLlxuICogQHR5cGUge09iamVjdH1cbiAqL1xuY29uc3QgcmVnaXN0ZXJlZEVsZW1lbnRzID0ge31cblxuLyoqXG4gKiBSZWdpc3RlciBhbiBleHRlbmRlZCBlbGVtZW50IHR5cGUgd2l0aCBjb21wb25lbnQgbWV0aG9kcy5cbiAqIEBwYXJhbSAge3N0cmluZ30gdHlwZSAgICBjb21wb25lbnQgdHlwZVxuICogQHBhcmFtICB7YXJyYXl9ICBtZXRob2RzIGEgbGlzdCBvZiBtZXRob2QgbmFtZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRWxlbWVudCAodHlwZSwgbWV0aG9kcykge1xuICAvLyBTa2lwIHdoZW4gbm8gc3BlY2lhbCBjb21wb25lbnQgbWV0aG9kcy5cbiAgaWYgKCFtZXRob2RzIHx8ICFtZXRob2RzLmxlbmd0aCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy8gSW5pdCBjb25zdHJ1Y3Rvci5cbiAgY2xhc3MgV2VleEVsZW1lbnQgZXh0ZW5kcyBFbGVtZW50IHt9XG5cbiAgLy8gQWRkIG1ldGhvZHMgdG8gcHJvdG90eXBlLlxuICBtZXRob2RzLmZvckVhY2gobWV0aG9kTmFtZSA9PiB7XG4gICAgV2VleEVsZW1lbnQucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKCdjb21wb25lbnQnLCB7XG4gICAgICAgICAgcmVmOiB0aGlzLnJlZixcbiAgICAgICAgICBjb21wb25lbnQ6IHR5cGUsXG4gICAgICAgICAgbWV0aG9kOiBtZXRob2ROYW1lXG4gICAgICAgIH0sIGFyZ3MpXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIEFkZCB0byBlbGVtZW50IHR5cGUgbWFwLlxuICByZWdpc3RlcmVkRWxlbWVudHNbdHlwZV0gPSBXZWV4RWxlbWVudFxufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5yZWdpc3RlckVsZW1lbnQgKHR5cGUpIHtcbiAgZGVsZXRlIHJlZ2lzdGVyZWRFbGVtZW50c1t0eXBlXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2VleEVsZW1lbnQgKHR5cGUpIHtcbiAgcmV0dXJuIHJlZ2lzdGVyZWRFbGVtZW50c1t0eXBlXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNXZWV4RWxlbWVudCAodHlwZSkge1xuICByZXR1cm4gISFyZWdpc3RlcmVkRWxlbWVudHNbdHlwZV1cbn1cblxuLyoqXG4gKiBDbGVhciBhbGwgZWxlbWVudCB0eXBlcy4gT25seSBmb3IgdGVzdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyV2VleEVsZW1lbnRzICgpIHtcbiAgZm9yIChjb25zdCB0eXBlIGluIHJlZ2lzdGVyZWRFbGVtZW50cykge1xuICAgIHVucmVnaXN0ZXJFbGVtZW50KHR5cGUpXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL05vZGUnXG5pbXBvcnQge1xuICBnZXREb2MsXG4gIGdldFRhc2tDZW50ZXIsXG4gIGxpbmtQYXJlbnQsXG4gIG5leHRFbGVtZW50LFxuICBwcmV2aW91c0VsZW1lbnQsXG4gIGluc2VydEluZGV4LFxuICBtb3ZlSW5kZXgsXG4gIHJlbW92ZUluZGV4XG59IGZyb20gJy4vb3BlcmF0aW9uJ1xuaW1wb3J0IHsgdW5pcXVlSWQsIGlzRW1wdHkgfSBmcm9tICcuLi9zaGFyZWQvdXRpbHMnXG5pbXBvcnQgeyBnZXRXZWV4RWxlbWVudCwgc2V0RWxlbWVudCB9IGZyb20gJy4vV2VleEVsZW1lbnQnXG5cbmNvbnN0IERFRkFVTFRfVEFHX05BTUUgPSAnZGl2J1xuY29uc3QgQlVCQkxFX0VWRU5UUyA9IFtcbiAgJ2NsaWNrJywgJ2xvbmdwcmVzcycsICd0b3VjaHN0YXJ0JywgJ3RvdWNobW92ZScsICd0b3VjaGVuZCcsXG4gICdwYW5zdGFydCcsICdwYW5tb3ZlJywgJ3BhbmVuZCcsICdob3Jpem9udGFscGFuJywgJ3ZlcnRpY2FscGFuJywgJ3N3aXBlJ1xuXVxuXG5mdW5jdGlvbiByZWdpc3Rlck5vZGUgKGRvY0lkLCBub2RlKSB7XG4gIGNvbnN0IGRvYyA9IGdldERvYyhkb2NJZClcbiAgZG9jLm5vZGVNYXBbbm9kZS5ub2RlSWRdID0gbm9kZVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbGVtZW50IGV4dGVuZHMgTm9kZSB7XG4gIGNvbnN0cnVjdG9yICh0eXBlID0gREVGQVVMVF9UQUdfTkFNRSwgcHJvcHMsIGlzRXh0ZW5kZWQpIHtcbiAgICBzdXBlcigpXG5cbiAgICBjb25zdCBXZWV4RWxlbWVudCA9IGdldFdlZXhFbGVtZW50KHR5cGUpXG4gICAgaWYgKFdlZXhFbGVtZW50ICYmICFpc0V4dGVuZGVkKSB7XG4gICAgICByZXR1cm4gbmV3IFdlZXhFbGVtZW50KHR5cGUsIHByb3BzLCB0cnVlKVxuICAgIH1cblxuICAgIHByb3BzID0gcHJvcHMgfHwge31cbiAgICB0aGlzLm5vZGVUeXBlID0gMVxuICAgIHRoaXMubm9kZUlkID0gdW5pcXVlSWQoKVxuICAgIHRoaXMucmVmID0gdGhpcy5ub2RlSWRcbiAgICB0aGlzLnR5cGUgPSB0eXBlXG4gICAgdGhpcy5hdHRyID0gcHJvcHMuYXR0ciB8fCB7fVxuICAgIHRoaXMuc3R5bGUgPSBwcm9wcy5zdHlsZSB8fCB7fVxuICAgIHRoaXMuY2xhc3NTdHlsZSA9IHByb3BzLmNsYXNzU3R5bGUgfHwge31cbiAgICB0aGlzLmV2ZW50ID0ge31cbiAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICB0aGlzLnB1cmVDaGlsZHJlbiA9IFtdXG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIGEgY2hpbGQgbm9kZS5cbiAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBhcHBlbmRDaGlsZCAobm9kZSkge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUgJiYgbm9kZS5wYXJlbnROb2RlICE9PSB0aGlzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICBpZiAoIW5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbGlua1BhcmVudChub2RlLCB0aGlzKVxuICAgICAgaW5zZXJ0SW5kZXgobm9kZSwgdGhpcy5jaGlsZHJlbiwgdGhpcy5jaGlsZHJlbi5sZW5ndGgsIHRydWUpXG4gICAgICBpZiAodGhpcy5kb2NJZCkge1xuICAgICAgICByZWdpc3Rlck5vZGUodGhpcy5kb2NJZCwgbm9kZSlcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGluc2VydEluZGV4KG5vZGUsIHRoaXMucHVyZUNoaWxkcmVuLCB0aGlzLnB1cmVDaGlsZHJlbi5sZW5ndGgpXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgICAgcmV0dXJuIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAgICdkb20nLFxuICAgICAgICAgICAgeyBhY3Rpb246ICdhZGRFbGVtZW50JyB9LFxuICAgICAgICAgICAgW3RoaXMucmVmLCBub2RlLnRvSlNPTigpLCAtMV1cbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtb3ZlSW5kZXgobm9kZSwgdGhpcy5jaGlsZHJlbiwgdGhpcy5jaGlsZHJlbi5sZW5ndGgsIHRydWUpXG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICBjb25zdCBpbmRleCA9IG1vdmVJbmRleChub2RlLCB0aGlzLnB1cmVDaGlsZHJlbiwgdGhpcy5wdXJlQ2hpbGRyZW4ubGVuZ3RoKVxuICAgICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgICBpZiAodGFza0NlbnRlciAmJiBpbmRleCA+PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAgICdkb20nLFxuICAgICAgICAgICAgeyBhY3Rpb246ICdtb3ZlRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFtub2RlLnJlZiwgdGhpcy5yZWYsIGluZGV4XVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnQgYSBub2RlIGJlZm9yZSBzcGVjaWZpZWQgbm9kZS5cbiAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAgICogQHBhcmFtIHtvYmplY3R9IGJlZm9yZVxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGluc2VydEJlZm9yZSAobm9kZSwgYmVmb3JlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUgIT09IHRoaXMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAobm9kZSA9PT0gYmVmb3JlIHx8IChub2RlLm5leHRTaWJsaW5nICYmIG5vZGUubmV4dFNpYmxpbmcgPT09IGJlZm9yZSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIW5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbGlua1BhcmVudChub2RlLCB0aGlzKVxuICAgICAgaW5zZXJ0SW5kZXgobm9kZSwgdGhpcy5jaGlsZHJlbiwgdGhpcy5jaGlsZHJlbi5pbmRleE9mKGJlZm9yZSksIHRydWUpXG4gICAgICBpZiAodGhpcy5kb2NJZCkge1xuICAgICAgICByZWdpc3Rlck5vZGUodGhpcy5kb2NJZCwgbm9kZSlcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHB1cmVCZWZvcmUgPSBuZXh0RWxlbWVudChiZWZvcmUpXG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW5zZXJ0SW5kZXgoXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICB0aGlzLnB1cmVDaGlsZHJlbixcbiAgICAgICAgICBwdXJlQmVmb3JlXG4gICAgICAgICAgICA/IHRoaXMucHVyZUNoaWxkcmVuLmluZGV4T2YocHVyZUJlZm9yZSlcbiAgICAgICAgICAgIDogdGhpcy5wdXJlQ2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ2FkZEVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbdGhpcy5yZWYsIG5vZGUudG9KU09OKCksIGluZGV4XVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1vdmVJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmluZGV4T2YoYmVmb3JlKSwgdHJ1ZSlcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHB1cmVCZWZvcmUgPSBuZXh0RWxlbWVudChiZWZvcmUpXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIGNvbnN0IGluZGV4ID0gbW92ZUluZGV4KFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4sXG4gICAgICAgICAgcHVyZUJlZm9yZVxuICAgICAgICAgICAgPyB0aGlzLnB1cmVDaGlsZHJlbi5pbmRleE9mKHB1cmVCZWZvcmUpXG4gICAgICAgICAgICA6IHRoaXMucHVyZUNoaWxkcmVuLmxlbmd0aFxuICAgICAgICApXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyICYmIGluZGV4ID49IDApIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ21vdmVFbGVtZW50JyB9LFxuICAgICAgICAgICAgW25vZGUucmVmLCB0aGlzLnJlZiwgaW5kZXhdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydCBhIG5vZGUgYWZ0ZXIgc3BlY2lmaWVkIG5vZGUuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBub2RlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhZnRlclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGluc2VydEFmdGVyIChub2RlLCBhZnRlcikge1xuICAgIGlmIChub2RlLnBhcmVudE5vZGUgJiYgbm9kZS5wYXJlbnROb2RlICE9PSB0aGlzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKG5vZGUgPT09IGFmdGVyIHx8IChub2RlLnByZXZpb3VzU2libGluZyAmJiBub2RlLnByZXZpb3VzU2libGluZyA9PT0gYWZ0ZXIpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKCFub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgIGxpbmtQYXJlbnQobm9kZSwgdGhpcylcbiAgICAgIGluc2VydEluZGV4KG5vZGUsIHRoaXMuY2hpbGRyZW4sIHRoaXMuY2hpbGRyZW4uaW5kZXhPZihhZnRlcikgKyAxLCB0cnVlKVxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmICh0aGlzLmRvY0lkKSB7XG4gICAgICAgIHJlZ2lzdGVyTm9kZSh0aGlzLmRvY0lkLCBub2RlKVxuICAgICAgfVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnNlcnRJbmRleChcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIHRoaXMucHVyZUNoaWxkcmVuLFxuICAgICAgICAgIHRoaXMucHVyZUNoaWxkcmVuLmluZGV4T2YocHJldmlvdXNFbGVtZW50KGFmdGVyKSkgKyAxXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgICAgICByZXR1cm4gdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ2FkZEVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbdGhpcy5yZWYsIG5vZGUudG9KU09OKCksIGluZGV4XVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG1vdmVJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0aGlzLmNoaWxkcmVuLmluZGV4T2YoYWZ0ZXIpICsgMSwgdHJ1ZSlcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gbW92ZUluZGV4KFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4sXG4gICAgICAgICAgdGhpcy5wdXJlQ2hpbGRyZW4uaW5kZXhPZihwcmV2aW91c0VsZW1lbnQoYWZ0ZXIpKSArIDFcbiAgICAgICAgKVxuICAgICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgICBpZiAodGFza0NlbnRlciAmJiBpbmRleCA+PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAgICdkb20nLFxuICAgICAgICAgICAgeyBhY3Rpb246ICdtb3ZlRWxlbWVudCcgfSxcbiAgICAgICAgICAgIFtub2RlLnJlZiwgdGhpcy5yZWYsIGluZGV4XVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBjaGlsZCBub2RlLCBhbmQgZGVjaWRlIHdoZXRoZXIgaXQgc2hvdWxkIGJlIGRlc3Ryb3llZC5cbiAgICogQHBhcmFtIHtvYmplY3R9IG5vZGVcbiAgICogQHBhcmFtIHtib29sZWFufSBwcmVzZXJ2ZWRcbiAgICovXG4gIHJlbW92ZUNoaWxkIChub2RlLCBwcmVzZXJ2ZWQpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICByZW1vdmVJbmRleChub2RlLCB0aGlzLmNoaWxkcmVuLCB0cnVlKVxuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgcmVtb3ZlSW5kZXgobm9kZSwgdGhpcy5wdXJlQ2hpbGRyZW4pXG4gICAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgICAgdGFza0NlbnRlci5zZW5kKFxuICAgICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgICB7IGFjdGlvbjogJ3JlbW92ZUVsZW1lbnQnIH0sXG4gICAgICAgICAgICBbbm9kZS5yZWZdXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghcHJlc2VydmVkKSB7XG4gICAgICBub2RlLmRlc3Ryb3koKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBhbGwgY2hpbGQgbm9kZXMuXG4gICAqL1xuICBjbGVhciAoKSB7XG4gICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICB0aGlzLnB1cmVDaGlsZHJlbi5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgICB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgeyBhY3Rpb246ICdyZW1vdmVFbGVtZW50JyB9LFxuICAgICAgICAgIFtub2RlLnJlZl1cbiAgICAgICAgKVxuICAgICAgfSlcbiAgICB9XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgbm9kZS5kZXN0cm95KClcbiAgICB9KVxuICAgIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID0gMFxuICAgIHRoaXMucHVyZUNoaWxkcmVuLmxlbmd0aCA9IDBcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYW4gYXR0cmlidXRlLCBhbmQgZGVjaWRlIHdoZXRoZXIgdGhlIHRhc2sgc2hvdWxkIGJlIHNlbmQgdG8gbmF0aXZlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyfSB2YWx1ZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNpbGVudFxuICAgKi9cbiAgc2V0QXR0ciAoa2V5LCB2YWx1ZSwgc2lsZW50KSB7XG4gICAgaWYgKHRoaXMuYXR0cltrZXldID09PSB2YWx1ZSAmJiBzaWxlbnQgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5hdHRyW2tleV0gPSB2YWx1ZVxuICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgaWYgKCFzaWxlbnQgJiYgdGFza0NlbnRlcikge1xuICAgICAgY29uc3QgcmVzdWx0ID0ge31cbiAgICAgIHJlc3VsdFtrZXldID0gdmFsdWVcbiAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgJ2RvbScsXG4gICAgICAgIHsgYWN0aW9uOiAndXBkYXRlQXR0cnMnIH0sXG4gICAgICAgIFt0aGlzLnJlZiwgcmVzdWx0XVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYmF0Y2hlZCBhdHRyaWJ1dGVzLlxuICAgKiBAcGFyYW0ge29iamVjdH0gYmF0Y2hlZEF0dHJzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2lsZW50XG4gICAqL1xuICBzZXRBdHRycyAoYmF0Y2hlZEF0dHJzLCBzaWxlbnQpIHtcbiAgICBpZiAoaXNFbXB0eShiYXRjaGVkQXR0cnMpKSByZXR1cm5cbiAgICBjb25zdCBtdXRhdGlvbnMgPSB7fVxuICAgIGZvciAoY29uc3Qga2V5IGluIGJhdGNoZWRBdHRycykge1xuICAgICAgaWYgKHRoaXMuYXR0cltrZXldICE9PSBiYXRjaGVkQXR0cnNba2V5XSkge1xuICAgICAgICB0aGlzLmF0dHJba2V5XSA9IGJhdGNoZWRBdHRyc1trZXldXG4gICAgICAgIG11dGF0aW9uc1trZXldID0gYmF0Y2hlZEF0dHJzW2tleV1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpc0VtcHR5KG11dGF0aW9ucykpIHtcbiAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICBpZiAoIXNpbGVudCAmJiB0YXNrQ2VudGVyKSB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ3VwZGF0ZUF0dHJzJyB9LFxuICAgICAgICAgIFt0aGlzLnJlZiwgbXV0YXRpb25zXVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIHN0eWxlIHByb3BlcnR5LCBhbmQgZGVjaWRlIHdoZXRoZXIgdGhlIHRhc2sgc2hvdWxkIGJlIHNlbmQgdG8gbmF0aXZlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyfSB2YWx1ZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNpbGVudFxuICAgKi9cbiAgc2V0U3R5bGUgKGtleSwgdmFsdWUsIHNpbGVudCkge1xuICAgIGlmICh0aGlzLnN0eWxlW2tleV0gPT09IHZhbHVlICYmIHNpbGVudCAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLnN0eWxlW2tleV0gPSB2YWx1ZVxuICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgaWYgKCFzaWxlbnQgJiYgdGFza0NlbnRlcikge1xuICAgICAgY29uc3QgcmVzdWx0ID0ge31cbiAgICAgIHJlc3VsdFtrZXldID0gdmFsdWVcbiAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgJ2RvbScsXG4gICAgICAgIHsgYWN0aW9uOiAndXBkYXRlU3R5bGUnIH0sXG4gICAgICAgIFt0aGlzLnJlZiwgcmVzdWx0XVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYmF0Y2hlZCBzdHlsZSBwcm9wZXJ0aWVzLlxuICAgKiBAcGFyYW0ge29iamVjdH0gYmF0Y2hlZFN0eWxlc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNpbGVudFxuICAgKi9cbiAgc2V0U3R5bGVzIChiYXRjaGVkU3R5bGVzLCBzaWxlbnQpIHtcbiAgICBpZiAoaXNFbXB0eShiYXRjaGVkU3R5bGVzKSkgcmV0dXJuXG4gICAgY29uc3QgbXV0YXRpb25zID0ge31cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBiYXRjaGVkU3R5bGVzKSB7XG4gICAgICBpZiAodGhpcy5zdHlsZVtrZXldICE9PSBiYXRjaGVkU3R5bGVzW2tleV0pIHtcbiAgICAgICAgdGhpcy5zdHlsZVtrZXldID0gYmF0Y2hlZFN0eWxlc1trZXldXG4gICAgICAgIG11dGF0aW9uc1trZXldID0gYmF0Y2hlZFN0eWxlc1trZXldXG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNFbXB0eShtdXRhdGlvbnMpKSB7XG4gICAgICBjb25zdCB0YXNrQ2VudGVyID0gZ2V0VGFza0NlbnRlcih0aGlzLmRvY0lkKVxuICAgICAgaWYgKCFzaWxlbnQgJiYgdGFza0NlbnRlcikge1xuICAgICAgICB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgeyBhY3Rpb246ICd1cGRhdGVTdHlsZScgfSxcbiAgICAgICAgICBbdGhpcy5yZWYsIG11dGF0aW9uc11cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgc3R5bGUgcHJvcGVydGllcyBmcm9tIGNsYXNzLlxuICAgKiBAcGFyYW0ge29iamVjdH0gY2xhc3NTdHlsZVxuICAgKi9cbiAgc2V0Q2xhc3NTdHlsZSAoY2xhc3NTdHlsZSkge1xuICAgIC8vIHJlc2V0IHByZXZpb3VzIGNsYXNzIHN0eWxlIHRvIGVtcHR5IHN0cmluZ1xuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuY2xhc3NTdHlsZSkge1xuICAgICAgdGhpcy5jbGFzc1N0eWxlW2tleV0gPSAnJ1xuICAgIH1cblxuICAgIE9iamVjdC5hc3NpZ24odGhpcy5jbGFzc1N0eWxlLCBjbGFzc1N0eWxlKVxuICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgaWYgKHRhc2tDZW50ZXIpIHtcbiAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgJ2RvbScsXG4gICAgICAgIHsgYWN0aW9uOiAndXBkYXRlU3R5bGUnIH0sXG4gICAgICAgIFt0aGlzLnJlZiwgdGhpcy50b1N0eWxlKCldXG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBldmVudCBoYW5kbGVyLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgdHlwZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudCBoYW5kbGVyXG4gICAqL1xuICBhZGRFdmVudCAodHlwZSwgaGFuZGxlciwgcGFyYW1zKSB7XG4gICAgaWYgKCF0aGlzLmV2ZW50KSB7XG4gICAgICB0aGlzLmV2ZW50ID0ge31cbiAgICB9XG4gICAgaWYgKCF0aGlzLmV2ZW50W3R5cGVdKSB7XG4gICAgICB0aGlzLmV2ZW50W3R5cGVdID0geyBoYW5kbGVyLCBwYXJhbXMgfVxuICAgICAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIodGhpcy5kb2NJZClcbiAgICAgIGlmICh0YXNrQ2VudGVyKSB7XG4gICAgICAgIHRhc2tDZW50ZXIuc2VuZChcbiAgICAgICAgICAnZG9tJyxcbiAgICAgICAgICB7IGFjdGlvbjogJ2FkZEV2ZW50JyB9LFxuICAgICAgICAgIFt0aGlzLnJlZiwgdHlwZV1cbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IHR5cGVcbiAgICovXG4gIHJlbW92ZUV2ZW50ICh0eXBlKSB7XG4gICAgaWYgKHRoaXMuZXZlbnQgJiYgdGhpcy5ldmVudFt0eXBlXSkge1xuICAgICAgZGVsZXRlIHRoaXMuZXZlbnRbdHlwZV1cbiAgICAgIGNvbnN0IHRhc2tDZW50ZXIgPSBnZXRUYXNrQ2VudGVyKHRoaXMuZG9jSWQpXG4gICAgICBpZiAodGFza0NlbnRlcikge1xuICAgICAgICB0YXNrQ2VudGVyLnNlbmQoXG4gICAgICAgICAgJ2RvbScsXG4gICAgICAgICAgeyBhY3Rpb246ICdyZW1vdmVFdmVudCcgfSxcbiAgICAgICAgICBbdGhpcy5yZWYsIHR5cGVdXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmlyZSBhbiBldmVudCBtYW51YWxseS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgdHlwZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNCdWJibGUgd2hldGhlciBvciBub3QgZXZlbnQgYnViYmxlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9uc1xuICAgKiBAcmV0dXJuIHt9IGFueXRoaW5nIHJldHVybmVkIGJ5IGhhbmRsZXIgZnVuY3Rpb25cbiAgICovXG4gIGZpcmVFdmVudCAodHlwZSwgZXZlbnQsIGlzQnViYmxlLCBvcHRpb25zKSB7XG4gICAgbGV0IHJlc3VsdCA9IG51bGxcbiAgICBsZXQgaXNTdG9wUHJvcGFnYXRpb24gPSBmYWxzZVxuICAgIGNvbnN0IGV2ZW50RGVzYyA9IHRoaXMuZXZlbnRbdHlwZV1cbiAgICBpZiAoZXZlbnREZXNjICYmIGV2ZW50KSB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gZXZlbnREZXNjLmhhbmRsZXJcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9ICgpID0+IHtcbiAgICAgICAgaXNTdG9wUHJvcGFnYXRpb24gPSB0cnVlXG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnBhcmFtcykge1xuICAgICAgICByZXN1bHQgPSBoYW5kbGVyLmNhbGwodGhpcywgLi4ub3B0aW9ucy5wYXJhbXMsIGV2ZW50KVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGhhbmRsZXIuY2FsbCh0aGlzLCBldmVudClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWlzU3RvcFByb3BhZ2F0aW9uXG4gICAgICAmJiBpc0J1YmJsZVxuICAgICAgJiYgKEJVQkJMRV9FVkVOVFMuaW5kZXhPZih0eXBlKSAhPT0gLTEpXG4gICAgICAmJiB0aGlzLnBhcmVudE5vZGVcbiAgICAgICYmIHRoaXMucGFyZW50Tm9kZS5maXJlRXZlbnQpIHtcbiAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQgPSB0aGlzLnBhcmVudE5vZGVcbiAgICAgIHRoaXMucGFyZW50Tm9kZS5maXJlRXZlbnQodHlwZSwgZXZlbnQsIGlzQnViYmxlKSAvLyBubyBvcHRpb25zXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgc3R5bGVzIG9mIGN1cnJlbnQgZWxlbWVudC5cbiAgICogQHJldHVybiB7b2JqZWN0fSBzdHlsZVxuICAgKi9cbiAgdG9TdHlsZSAoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY2xhc3NTdHlsZSwgdGhpcy5zdHlsZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IGN1cnJlbnQgZWxlbWVudCB0byBKU09OIGxpa2Ugb2JqZWN0LlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGVsZW1lbnRcbiAgICovXG4gIHRvSlNPTiAoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgcmVmOiB0aGlzLnJlZi50b1N0cmluZygpLFxuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgYXR0cjogdGhpcy5hdHRyLFxuICAgICAgc3R5bGU6IHRoaXMudG9TdHlsZSgpXG4gICAgfVxuICAgIGNvbnN0IGV2ZW50ID0gW11cbiAgICBmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy5ldmVudCkge1xuICAgICAgY29uc3QgeyBwYXJhbXMgfSA9IHRoaXMuZXZlbnRbdHlwZV1cbiAgICAgIGlmICghcGFyYW1zKSB7XG4gICAgICAgIGV2ZW50LnB1c2godHlwZSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBldmVudC5wdXNoKHsgdHlwZSwgcGFyYW1zIH0pXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChldmVudC5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdC5ldmVudCA9IGV2ZW50XG4gICAgfVxuICAgIGlmICh0aGlzLnB1cmVDaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdC5jaGlsZHJlbiA9IHRoaXMucHVyZUNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IGNoaWxkLnRvSlNPTigpKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCB0byBIVE1MIGVsZW1lbnQgdGFnIHN0cmluZy5cbiAgICogQHJldHVybiB7c3Rpcm5nfSBodG1sXG4gICAqL1xuICB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICc8JyArIHRoaXMudHlwZSArXG4gICAgJyBhdHRyPScgKyBKU09OLnN0cmluZ2lmeSh0aGlzLmF0dHIpICtcbiAgICAnIHN0eWxlPScgKyBKU09OLnN0cmluZ2lmeSh0aGlzLnRvU3R5bGUoKSkgKyAnPicgK1xuICAgIHRoaXMucHVyZUNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IGNoaWxkLnRvU3RyaW5nKCkpLmpvaW4oJycpICtcbiAgICAnPC8nICsgdGhpcy50eXBlICsgJz4nXG4gIH1cbn1cblxuc2V0RWxlbWVudChFbGVtZW50KVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBDYWxsYmFja01hbmFnZXIgZnJvbSAnLi9DYWxsYmFja01hbmFnZXInXG5pbXBvcnQgRWxlbWVudCBmcm9tICcuLi92ZG9tL0VsZW1lbnQnXG5pbXBvcnQgeyB0eXBvZiB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcbmltcG9ydCB7IG5vcm1hbGl6ZVByaW1pdGl2ZSB9IGZyb20gJy4vbm9ybWFsaXplJ1xuXG5sZXQgZmFsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fVxuXG4vLyBUaGUgQVBJIG9mIFRhc2tDZW50ZXIgd291bGQgYmUgcmUtZGVzaWduLlxuZXhwb3J0IGNsYXNzIFRhc2tDZW50ZXIge1xuICBjb25zdHJ1Y3RvciAoaWQsIHNlbmRUYXNrcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnaW5zdGFuY2VJZCcsIHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogU3RyaW5nKGlkKVxuICAgIH0pXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdjYWxsYmFja01hbmFnZXInLCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG5ldyBDYWxsYmFja01hbmFnZXIoaWQpXG4gICAgfSlcbiAgICBmYWxsYmFjayA9IHNlbmRUYXNrcyB8fCBmdW5jdGlvbiAoKSB7fVxuICB9XG5cbiAgY2FsbGJhY2sgKGNhbGxiYWNrSWQsIGRhdGEsIGlmS2VlcEFsaXZlKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbGJhY2tNYW5hZ2VyLmNvbnN1bWUoY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpXG4gIH1cblxuICByZWdpc3Rlckhvb2sgKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsYmFja01hbmFnZXIucmVnaXN0ZXJIb29rKC4uLmFyZ3MpXG4gIH1cblxuICB0cmlnZ2VySG9vayAoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrTWFuYWdlci50cmlnZ2VySG9vayguLi5hcmdzKVxuICB9XG5cbiAgdXBkYXRlRGF0YSAoY29tcG9uZW50SWQsIG5ld0RhdGEsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5zZW5kKCdtb2R1bGUnLCB7XG4gICAgICBtb2R1bGU6ICdkb20nLFxuICAgICAgbWV0aG9kOiAndXBkYXRlQ29tcG9uZW50RGF0YSdcbiAgICB9LCBbY29tcG9uZW50SWQsIG5ld0RhdGEsIGNhbGxiYWNrXSlcbiAgfVxuXG4gIGRlc3Ryb3lDYWxsYmFjayAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbGJhY2tNYW5hZ2VyLmNsb3NlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgYSB2YWx1ZS4gU3BlY2lhbGx5LCBpZiB0aGUgdmFsdWUgaXMgYSBmdW5jdGlvbiwgdGhlbiBnZW5lcmF0ZSBhIGZ1bmN0aW9uIGlkXG4gICAqIGFuZCBzYXZlIGl0IHRvIGBDYWxsYmFja01hbmFnZXJgLCBhdCBsYXN0IHJldHVybiB0aGUgZnVuY3Rpb24gaWQuXG4gICAqIEBwYXJhbSAge2FueX0gICAgICAgIHZcbiAgICogQHJldHVybiB7cHJpbWl0aXZlfVxuICAgKi9cbiAgbm9ybWFsaXplICh2KSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cG9mKHYpXG4gICAgaWYgKHYgJiYgdiBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIHJldHVybiB2LnJlZlxuICAgIH1cbiAgICBpZiAodiAmJiB2Ll9pc1Z1ZSAmJiB2LiRlbCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIHJldHVybiB2LiRlbC5yZWZcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdGdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLmNhbGxiYWNrTWFuYWdlci5hZGQodikudG9TdHJpbmcoKVxuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplUHJpbWl0aXZlKHYpXG4gIH1cblxuICBzZW5kICh0eXBlLCBwYXJhbXMsIGFyZ3MsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7IGFjdGlvbiwgY29tcG9uZW50LCByZWYsIG1vZHVsZSwgbWV0aG9kIH0gPSBwYXJhbXNcblxuICAgIGFyZ3MgPSBhcmdzLm1hcChhcmcgPT4gdGhpcy5ub3JtYWxpemUoYXJnKSlcblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnZG9tJzpcbiAgICAgICAgcmV0dXJuIHRoaXNbYWN0aW9uXSh0aGlzLmluc3RhbmNlSWQsIGFyZ3MpXG4gICAgICBjYXNlICdjb21wb25lbnQnOlxuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRIYW5kbGVyKHRoaXMuaW5zdGFuY2VJZCwgcmVmLCBtZXRob2QsIGFyZ3MsIE9iamVjdC5hc3NpZ24oeyBjb21wb25lbnQgfSwgb3B0aW9ucykpXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGVIYW5kbGVyKHRoaXMuaW5zdGFuY2VJZCwgbW9kdWxlLCBtZXRob2QsIGFyZ3MsIG9wdGlvbnMpXG4gICAgfVxuICB9XG5cbiAgY2FsbERPTSAoYWN0aW9uLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXNbYWN0aW9uXSh0aGlzLmluc3RhbmNlSWQsIGFyZ3MpXG4gIH1cblxuICBjYWxsQ29tcG9uZW50IChyZWYsIG1ldGhvZCwgYXJncywgb3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLmNvbXBvbmVudEhhbmRsZXIodGhpcy5pbnN0YW5jZUlkLCByZWYsIG1ldGhvZCwgYXJncywgb3B0aW9ucylcbiAgfVxuXG4gIGNhbGxNb2R1bGUgKG1vZHVsZSwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlSGFuZGxlcih0aGlzLmluc3RhbmNlSWQsIG1vZHVsZSwgbWV0aG9kLCBhcmdzLCBvcHRpb25zKVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0ICgpIHtcbiAgY29uc3QgRE9NX01FVEhPRFMgPSB7XG4gICAgY3JlYXRlRmluaXNoOiBnbG9iYWwuY2FsbENyZWF0ZUZpbmlzaCxcbiAgICB1cGRhdGVGaW5pc2g6IGdsb2JhbC5jYWxsVXBkYXRlRmluaXNoLFxuICAgIHJlZnJlc2hGaW5pc2g6IGdsb2JhbC5jYWxsUmVmcmVzaEZpbmlzaCxcblxuICAgIGNyZWF0ZUJvZHk6IGdsb2JhbC5jYWxsQ3JlYXRlQm9keSxcblxuICAgIGFkZEVsZW1lbnQ6IGdsb2JhbC5jYWxsQWRkRWxlbWVudCxcbiAgICByZW1vdmVFbGVtZW50OiBnbG9iYWwuY2FsbFJlbW92ZUVsZW1lbnQsXG4gICAgbW92ZUVsZW1lbnQ6IGdsb2JhbC5jYWxsTW92ZUVsZW1lbnQsXG4gICAgdXBkYXRlQXR0cnM6IGdsb2JhbC5jYWxsVXBkYXRlQXR0cnMsXG4gICAgdXBkYXRlU3R5bGU6IGdsb2JhbC5jYWxsVXBkYXRlU3R5bGUsXG5cbiAgICBhZGRFdmVudDogZ2xvYmFsLmNhbGxBZGRFdmVudCxcbiAgICByZW1vdmVFdmVudDogZ2xvYmFsLmNhbGxSZW1vdmVFdmVudFxuICB9XG4gIGNvbnN0IHByb3RvID0gVGFza0NlbnRlci5wcm90b3R5cGVcblxuICBmb3IgKGNvbnN0IG5hbWUgaW4gRE9NX01FVEhPRFMpIHtcbiAgICBjb25zdCBtZXRob2QgPSBET01fTUVUSE9EU1tuYW1lXVxuICAgIHByb3RvW25hbWVdID0gbWV0aG9kID9cbiAgICAgIChpZCwgYXJncykgPT4gbWV0aG9kKGlkLCAuLi5hcmdzKSA6XG4gICAgICAoaWQsIGFyZ3MpID0+IGZhbGxiYWNrKGlkLCBbeyBtb2R1bGU6ICdkb20nLCBtZXRob2Q6IG5hbWUsIGFyZ3MgfV0sICctMScpXG4gIH1cblxuICBwcm90by5jb21wb25lbnRIYW5kbGVyID0gZ2xvYmFsLmNhbGxOYXRpdmVDb21wb25lbnQgfHxcbiAgICAoKGlkLCByZWYsIG1ldGhvZCwgYXJncywgb3B0aW9ucykgPT5cbiAgICAgIGZhbGxiYWNrKGlkLCBbeyBjb21wb25lbnQ6IG9wdGlvbnMuY29tcG9uZW50LCByZWYsIG1ldGhvZCwgYXJncyB9XSkpXG5cbiAgcHJvdG8ubW9kdWxlSGFuZGxlciA9IGdsb2JhbC5jYWxsTmF0aXZlTW9kdWxlIHx8XG4gICAgKChpZCwgbW9kdWxlLCBtZXRob2QsIGFyZ3MpID0+XG4gICAgICBmYWxsYmFjayhpZCwgW3sgbW9kdWxlLCBtZXRob2QsIGFyZ3MgfV0pKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IGdldERvYyB9IGZyb20gJy4uL3Zkb20vb3BlcmF0aW9uJ1xuXG5mdW5jdGlvbiBmaXJlRXZlbnQgKGRvY3VtZW50LCBub2RlSWQsIHR5cGUsIGV2ZW50LCBkb21DaGFuZ2VzLCBwYXJhbXMpIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRSZWYobm9kZUlkKVxuICBpZiAoZWwpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuZmlyZUV2ZW50KGVsLCB0eXBlLCBldmVudCwgZG9tQ2hhbmdlcywgcGFyYW1zKVxuICB9XG4gIHJldHVybiBuZXcgRXJyb3IoYGludmFsaWQgZWxlbWVudCByZWZlcmVuY2UgXCIke25vZGVJZH1cImApXG59XG5cbmZ1bmN0aW9uIGNhbGxiYWNrIChkb2N1bWVudCwgY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpIHtcbiAgcmV0dXJuIGRvY3VtZW50LnRhc2tDZW50ZXIuY2FsbGJhY2soY2FsbGJhY2tJZCwgZGF0YSwgaWZLZWVwQWxpdmUpXG59XG5cbmZ1bmN0aW9uIGNvbXBvbmVudEhvb2sgKGRvY3VtZW50LCBjb21wb25lbnRJZCwgdHlwZSwgaG9vaywgb3B0aW9ucykge1xuICBpZiAoIWRvY3VtZW50IHx8ICFkb2N1bWVudC50YXNrQ2VudGVyKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gQ2FuJ3QgZmluZCBcImRvY3VtZW50XCIgb3IgXCJ0YXNrQ2VudGVyXCIuYClcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGxldCByZXN1bHQgPSBudWxsXG4gIHRyeSB7XG4gICAgcmVzdWx0ID0gZG9jdW1lbnQudGFza0NlbnRlci50cmlnZ2VySG9vayhjb21wb25lbnRJZCwgdHlwZSwgaG9vaywgb3B0aW9ucylcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byB0cmlnZ2VyIHRoZSBcIiR7dHlwZX1AJHtob29rfVwiIGhvb2sgb24gJHtjb21wb25lbnRJZH0uYClcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogQWNjZXB0IGNhbGxzIGZyb20gbmF0aXZlIChldmVudCBvciBjYWxsYmFjaykuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHBhcmFtICB7YXJyYXl9IHRhc2tzIGxpc3Qgd2l0aCBgbWV0aG9kYCBhbmQgYGFyZ3NgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNlaXZlVGFza3MgKGlkLCB0YXNrcykge1xuICBjb25zdCBkb2N1bWVudCA9IGdldERvYyhpZClcbiAgaWYgKCFkb2N1bWVudCkge1xuICAgIHJldHVybiBuZXcgRXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byByZWNlaXZlVGFza3MsIGBcbiAgICAgICsgYGluc3RhbmNlICgke2lkfSkgaXMgbm90IGF2YWlsYWJsZS5gKVxuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KHRhc2tzKSkge1xuICAgIHJldHVybiB0YXNrcy5tYXAodGFzayA9PiB7XG4gICAgICBzd2l0Y2ggKHRhc2subWV0aG9kKSB7XG4gICAgICAgIGNhc2UgJ2NhbGxiYWNrJzogcmV0dXJuIGNhbGxiYWNrKGRvY3VtZW50LCAuLi50YXNrLmFyZ3MpXG4gICAgICAgIGNhc2UgJ2ZpcmVFdmVudFN5bmMnOlxuICAgICAgICBjYXNlICdmaXJlRXZlbnQnOiByZXR1cm4gZmlyZUV2ZW50KGRvY3VtZW50LCAuLi50YXNrLmFyZ3MpXG4gICAgICAgIGNhc2UgJ2NvbXBvbmVudEhvb2snOiByZXR1cm4gY29tcG9uZW50SG9vayhkb2N1bWVudCwgLi4udGFzay5hcmdzKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5jb25zdCB3ZWV4TW9kdWxlcyA9IHt9XG5cbi8qKlxuICogUmVnaXN0ZXIgbmF0aXZlIG1vZHVsZXMgaW5mb3JtYXRpb24uXG4gKiBAcGFyYW0ge29iamVjdH0gbmV3TW9kdWxlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJNb2R1bGVzIChuZXdNb2R1bGVzKSB7XG4gIGZvciAoY29uc3QgbmFtZSBpbiBuZXdNb2R1bGVzKSB7XG4gICAgaWYgKCF3ZWV4TW9kdWxlc1tuYW1lXSkge1xuICAgICAgd2VleE1vZHVsZXNbbmFtZV0gPSB7fVxuICAgIH1cbiAgICBuZXdNb2R1bGVzW25hbWVdLmZvckVhY2gobWV0aG9kID0+IHtcbiAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSAnc3RyaW5nJykge1xuICAgICAgICB3ZWV4TW9kdWxlc1tuYW1lXVttZXRob2RdID0gdHJ1ZVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHdlZXhNb2R1bGVzW25hbWVdW21ldGhvZC5uYW1lXSA9IG1ldGhvZC5hcmdzXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBvciB0aGUgbWV0aG9kIGhhcyBiZWVuIHJlZ2lzdGVyZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gbW9kdWxlIG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2QgbmFtZSAob3B0aW9uYWwpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1JlZ2lzdGVyZWRNb2R1bGUgKG5hbWUsIG1ldGhvZCkge1xuICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gISEod2VleE1vZHVsZXNbbmFtZV0gJiYgd2VleE1vZHVsZXNbbmFtZV1bbWV0aG9kXSlcbiAgfVxuICByZXR1cm4gISF3ZWV4TW9kdWxlc1tuYW1lXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kdWxlRGVzY3JpcHRpb24gKG5hbWUpIHtcbiAgcmV0dXJuIHdlZXhNb2R1bGVzW25hbWVdXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgcmVnaXN0ZXJFbGVtZW50IH0gZnJvbSAnLi4vdmRvbS9XZWV4RWxlbWVudCdcblxuY29uc3Qgd2VleENvbXBvbmVudHMgPSB7fVxuXG4vKipcbiAqIFJlZ2lzdGVyIG5hdGl2ZSBjb21wb25lbnRzIGluZm9ybWF0aW9uLlxuICogQHBhcmFtIHthcnJheX0gbmV3Q29tcG9uZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnRzIChuZXdDb21wb25lbnRzKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG5ld0NvbXBvbmVudHMpKSB7XG4gICAgbmV3Q29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICB3ZWV4Q29tcG9uZW50c1tjb21wb25lbnRdID0gdHJ1ZVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHlwZW9mIGNvbXBvbmVudCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGNvbXBvbmVudC50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICB3ZWV4Q29tcG9uZW50c1tjb21wb25lbnQudHlwZV0gPSBjb21wb25lbnRcbiAgICAgICAgcmVnaXN0ZXJFbGVtZW50KGNvbXBvbmVudC50eXBlLCBjb21wb25lbnQubWV0aG9kcylcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgY29tcG9uZW50IGhhcyBiZWVuIHJlZ2lzdGVyZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50IG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVnaXN0ZXJlZENvbXBvbmVudCAobmFtZSkge1xuICByZXR1cm4gISF3ZWV4Q29tcG9uZW50c1tuYW1lXVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEpTIFNlcnZpY2VzXG5cbmV4cG9ydCBjb25zdCBzZXJ2aWNlcyA9IFtdXG5cbi8qKlxuICogUmVnaXN0ZXIgYSBKYXZhU2NyaXB0IHNlcnZpY2UuXG4gKiBBIEphdmFTY3JpcHQgc2VydmljZSBvcHRpb25zIGNvdWxkIGhhdmUgYSBzZXQgb2YgbGlmZWN5Y2xlIG1ldGhvZHNcbiAqIGZvciBlYWNoIFdlZXggaW5zdGFuY2UuIEZvciBleGFtcGxlOiBjcmVhdGUsIHJlZnJlc2gsIGRlc3Ryb3kuXG4gKiBGb3IgdGhlIEpTIGZyYW1ld29yayBtYWludGFpbmVyIGlmIHlvdSB3YW50IHRvIHN1cHBseSBzb21lIGZlYXR1cmVzXG4gKiB3aGljaCBuZWVkIHRvIHdvcmsgd2VsbCBpbiBkaWZmZXJlbnQgV2VleCBpbnN0YW5jZXMsIGV2ZW4gaW4gZGlmZmVyZW50XG4gKiBmcmFtZXdvcmtzIHNlcGFyYXRlbHkuIFlvdSBjYW4gbWFrZSBhIEphdmFTY3JpcHQgc2VydmljZSB0byBpbml0XG4gKiBpdHMgdmFyaWFibGVzIG9yIGNsYXNzZXMgZm9yIGVhY2ggV2VleCBpbnN0YW5jZSB3aGVuIGl0J3MgY3JlYXRlZFxuICogYW5kIHJlY3ljbGUgdGhlbSB3aGVuIGl0J3MgZGVzdHJveWVkLlxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQ291bGQgaGF2ZSB7IGNyZWF0ZSwgcmVmcmVzaCwgZGVzdHJveSB9XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICBsaWZlY3ljbGUgbWV0aG9kcy4gSW4gY3JlYXRlIG1ldGhvZCBpdCBzaG91bGRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhbiBvYmplY3Qgb2Ygd2hhdCB2YXJpYWJsZXMgb3IgY2xhc3Nlc1xuICogICAgICAgICAgICAgICAgICAgICAgICAgd291bGQgYmUgaW5qZWN0ZWQgaW50byB0aGUgV2VleCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyIChuYW1lLCBvcHRpb25zKSB7XG4gIGlmIChoYXMobmFtZSkpIHtcbiAgICBjb25zb2xlLndhcm4oYFNlcnZpY2UgXCIke25hbWV9XCIgaGFzIGJlZW4gcmVnaXN0ZXJlZCBhbHJlYWR5IWApXG4gIH1cbiAgZWxzZSB7XG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpXG4gICAgc2VydmljZXMucHVzaCh7IG5hbWUsIG9wdGlvbnMgfSlcbiAgfVxufVxuXG4vKipcbiAqIFVucmVnaXN0ZXIgYSBKYXZhU2NyaXB0IHNlcnZpY2UgYnkgbmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVucmVnaXN0ZXIgKG5hbWUpIHtcbiAgc2VydmljZXMuc29tZSgoc2VydmljZSwgaW5kZXgpID0+IHtcbiAgICBpZiAoc2VydmljZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICBzZXJ2aWNlcy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIEphdmFTY3JpcHQgc2VydmljZSB3aXRoIGEgY2VydGFpbiBuYW1lIGV4aXN0ZWQuXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzIChuYW1lKSB7XG4gIHJldHVybiBpbmRleE9mKG5hbWUpID49IDBcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBpbmRleCBvZiBhIEphdmFTY3JpcHQgc2VydmljZSBieSBuYW1lXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gaW5kZXhPZiAobmFtZSkge1xuICByZXR1cm4gc2VydmljZXMubWFwKHNlcnZpY2UgPT4gc2VydmljZS5uYW1lKS5pbmRleE9mKG5hbWUpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHsgZ2V0VGFza0NlbnRlciB9IGZyb20gJy4uL3Zkb20vb3BlcmF0aW9uJ1xuaW1wb3J0IHsgaXNSZWdpc3RlcmVkTW9kdWxlIH0gZnJvbSAnLi4vYXBpL21vZHVsZSdcblxuZXhwb3J0IGZ1bmN0aW9uIHRyYWNrIChpZCwgdHlwZSwgdmFsdWUpIHtcbiAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIoaWQpXG4gIGlmICghdGFza0NlbnRlciB8fCB0eXBlb2YgdGFza0NlbnRlci5zZW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIGNyZWF0ZSB0cmFja2VyIWApXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKCF0eXBlIHx8ICF2YWx1ZSkge1xuICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gSW52YWxpZCB0cmFjayB0eXBlICgke3R5cGV9KSBvciB2YWx1ZSAoJHt2YWx1ZX0pYClcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBsYWJlbCA9IGBqc2ZtLiR7dHlwZX0uJHt2YWx1ZX1gXG4gIHRyeSB7XG4gICAgaWYgKGlzUmVnaXN0ZXJlZE1vZHVsZSgndXNlclRyYWNrJywgJ2FkZFBlcmZQb2ludCcpKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgICAgbWVzc2FnZVtsYWJlbF0gPSAnNCdcbiAgICAgIHRhc2tDZW50ZXIuc2VuZCgnbW9kdWxlJywge1xuICAgICAgICBtb2R1bGU6ICd1c2VyVHJhY2snLFxuICAgICAgICBtZXRob2Q6ICdhZGRQZXJmUG9pbnQnXG4gICAgICB9LCBbbWVzc2FnZV0pXG4gICAgfVxuICB9XG4gIGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBGYWlsZWQgdG8gdHJhY2UgXCIke2xhYmVsfVwiIWApXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVycm9yICguLi5tZXNzYWdlcykge1xuICBpZiAodHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbSlMgRnJhbWV3b3JrXSBgLCAuLi5tZXNzYWdlcylcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlRXhjZXB0aW9uIChlcnIpIHtcbiAgaWYgKHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnRvU3RyaW5nKCkpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7fVxuICB9XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgdGhyb3cgZXJyXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL05vZGUnXG5pbXBvcnQgeyB1bmlxdWVJZCB9IGZyb20gJy4uL3NoYXJlZC91dGlscydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tbWVudCBleHRlbmRzIE5vZGUge1xuICBjb25zdHJ1Y3RvciAodmFsdWUpIHtcbiAgICBzdXBlcigpXG5cbiAgICB0aGlzLm5vZGVUeXBlID0gOFxuICAgIHRoaXMubm9kZUlkID0gdW5pcXVlSWQoKVxuICAgIHRoaXMucmVmID0gdGhpcy5ub2RlSWRcbiAgICB0aGlzLnR5cGUgPSAnY29tbWVudCdcbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICB0aGlzLnB1cmVDaGlsZHJlbiA9IFtdXG4gIH1cblxuICAvKipcbiAgKiBDb252ZXJ0IHRvIEhUTUwgY29tbWVudCBzdHJpbmcuXG4gICogQHJldHVybiB7c3Rpcm5nfSBodG1sXG4gICovXG4gIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJzwhLS0gJyArIHRoaXMudmFsdWUgKyAnIC0tPidcbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuKiBDcmVhdGUgdGhlIGFjdGlvbiBvYmplY3QuXG4qIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4qIEBwYXJhbSB7YXJyYXl9IGFyZ3VtZW50c1xuKiBAcmV0dXJuIHtvYmplY3R9IGFjdGlvblxuKi9cbmZ1bmN0aW9uIGNyZWF0ZUFjdGlvbiAobmFtZSwgYXJncyA9IFtdKSB7XG4gIHJldHVybiB7IG1vZHVsZTogJ2RvbScsIG1ldGhvZDogbmFtZSwgYXJnczogYXJncyB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IgKGlkLCBoYW5kbGVyKSB7XG4gICAgdGhpcy5pZCA9IGlkXG4gICAgdGhpcy5iYXRjaGVkID0gZmFsc2VcbiAgICB0aGlzLnVwZGF0ZXMgPSBbXVxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdoYW5kbGVyJywge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogaGFuZGxlclxuICAgICAgfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbSlMgUnVudGltZV0gaW52YWxpZCBwYXJhbWV0ZXIsIGhhbmRsZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJjcmVhdGVGaW5pc2hcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgY3JlYXRlRmluaXNoIChjYWxsYmFjaykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLmhhbmRsZXJcbiAgICByZXR1cm4gaGFuZGxlcihbY3JlYXRlQWN0aW9uKCdjcmVhdGVGaW5pc2gnKV0sIGNhbGxiYWNrKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwidXBkYXRlRmluaXNoXCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIHVwZGF0ZUZpbmlzaCAoY2FsbGJhY2spIHtcbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVyXG4gICAgcmV0dXJuIGhhbmRsZXIoW2NyZWF0ZUFjdGlvbigndXBkYXRlRmluaXNoJyldLCBjYWxsYmFjaylcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcInJlZnJlc2hGaW5pc2hcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgcmVmcmVzaEZpbmlzaCAoY2FsbGJhY2spIHtcbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVyXG4gICAgcmV0dXJuIGhhbmRsZXIoW2NyZWF0ZUFjdGlvbigncmVmcmVzaEZpbmlzaCcpXSwgY2FsbGJhY2spXG4gIH1cblxuICAvKipcbiAgICogU2VuZCB0aGUgXCJjcmVhdGVCb2R5XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge29iamVjdH0gZWxlbWVudFxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGNyZWF0ZUJvZHkgKGVsZW1lbnQpIHtcbiAgICBjb25zdCBib2R5ID0gZWxlbWVudC50b0pTT04oKVxuICAgIGNvbnN0IGNoaWxkcmVuID0gYm9keS5jaGlsZHJlblxuICAgIGRlbGV0ZSBib2R5LmNoaWxkcmVuXG4gICAgY29uc3QgYWN0aW9ucyA9IFtjcmVhdGVBY3Rpb24oJ2NyZWF0ZUJvZHknLCBbYm9keV0pXVxuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgYWN0aW9ucy5wdXNoLmFwcGx5KGFjdGlvbnMsIGNoaWxkcmVuLm1hcChjaGlsZCA9PiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVBY3Rpb24oJ2FkZEVsZW1lbnQnLCBbYm9keS5yZWYsIGNoaWxkLCAtMV0pXG4gICAgICB9KSlcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhhY3Rpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwiYWRkRWxlbWVudFwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtvYmplY3R9IGVsZW1lbnRcbiAgICogQHBhcmFtIHtzdGlybmd9IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBhZGRFbGVtZW50IChlbGVtZW50LCByZWYsIGluZGV4KSB7XG4gICAgaWYgKCEoaW5kZXggPj0gMCkpIHtcbiAgICAgIGluZGV4ID0gLTFcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ2FkZEVsZW1lbnQnLCBbcmVmLCBlbGVtZW50LnRvSlNPTigpLCBpbmRleF0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwicmVtb3ZlRWxlbWVudFwiIHNpZ25hbC5cbiAgICogQHBhcmFtIHtzdGlybmd9IHJlZmVyZW5jZSBpZFxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIHJlbW92ZUVsZW1lbnQgKHJlZikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHJlZikpIHtcbiAgICAgIGNvbnN0IGFjdGlvbnMgPSByZWYubWFwKChyKSA9PiBjcmVhdGVBY3Rpb24oJ3JlbW92ZUVsZW1lbnQnLCBbcl0pKVxuICAgICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhhY3Rpb25zKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbigncmVtb3ZlRWxlbWVudCcsIFtyZWZdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcIm1vdmVFbGVtZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gdGFyZ2V0IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcGFyZW50IHJlZmVyZW5jZSBpZFxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBtb3ZlRWxlbWVudCAodGFyZ2V0UmVmLCBwYXJlbnRSZWYsIGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ21vdmVFbGVtZW50JywgW3RhcmdldFJlZiwgcGFyZW50UmVmLCBpbmRleF0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwidXBkYXRlQXR0cnNcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtzdGlybmd9IGtleVxuICAgKiBAcGFyYW0ge3N0aXJuZ30gdmFsdWVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkIHwgbnVtYmVyfSB0aGUgc2lnbmFsIHNlbnQgYnkgbmF0aXZlXG4gICAqL1xuICBzZXRBdHRyIChyZWYsIGtleSwgdmFsdWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fVxuICAgIHJlc3VsdFtrZXldID0gdmFsdWVcbiAgICByZXR1cm4gdGhpcy5hZGRBY3Rpb25zKGNyZWF0ZUFjdGlvbigndXBkYXRlQXR0cnMnLCBbcmVmLCByZXN1bHRdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcInVwZGF0ZVN0eWxlXCIgc2lnbmFsLCB1cGRhdGUgYSBzb2xlIHN0eWxlLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSBrZXlcbiAgICogQHBhcmFtIHtzdGlybmd9IHZhbHVlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgc2V0U3R5bGUgKHJlZiwga2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCd1cGRhdGVTdHlsZScsIFtyZWYsIHJlc3VsdF0pKVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFwidXBkYXRlU3R5bGVcIiBzaWduYWwuXG4gICAqIEBwYXJhbSB7c3Rpcm5nfSByZWZlcmVuY2UgaWRcbiAgICogQHBhcmFtIHtvYmplY3R9IHN0eWxlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgc2V0U3R5bGVzIChyZWYsIHN0eWxlKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkQWN0aW9ucyhjcmVhdGVBY3Rpb24oJ3VwZGF0ZVN0eWxlJywgW3JlZiwgc3R5bGVdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcImFkZEV2ZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCB0eXBlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgYWRkRXZlbnQgKHJlZiwgdHlwZSkge1xuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCdhZGRFdmVudCcsIFtyZWYsIHR5cGVdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBcInJlbW92ZUV2ZW50XCIgc2lnbmFsLlxuICAgKiBAcGFyYW0ge3N0aXJuZ30gcmVmZXJlbmNlIGlkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCB0eXBlXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZCB8IG51bWJlcn0gdGhlIHNpZ25hbCBzZW50IGJ5IG5hdGl2ZVxuICAgKi9cbiAgcmVtb3ZlRXZlbnQgKHJlZiwgdHlwZSkge1xuICAgIHJldHVybiB0aGlzLmFkZEFjdGlvbnMoY3JlYXRlQWN0aW9uKCdyZW1vdmVFdmVudCcsIFtyZWYsIHR5cGVdKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZhdWx0IGhhbmRsZXIuXG4gICAqIEBwYXJhbSB7b2JqZWN0IHwgYXJyYXl9IGFjdGlvbnNcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybiB7fSBhbnl0aGluZyByZXR1cm5lZCBieSBjYWxsYmFjayBmdW5jdGlvblxuICAgKi9cbiAgaGFuZGxlciAoYWN0aW9ucywgY2IpIHtcbiAgICByZXR1cm4gY2IgJiYgY2IoKVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhY3Rpb25zIGludG8gdXBkYXRlcy5cbiAgICogQHBhcmFtIHtvYmplY3QgfCBhcnJheX0gYWN0aW9uc1xuICAgKiBAcmV0dXJuIHt1bmRlZmluZWQgfCBudW1iZXJ9IHRoZSBzaWduYWwgc2VudCBieSBuYXRpdmVcbiAgICovXG4gIGFkZEFjdGlvbnMgKGFjdGlvbnMpIHtcbiAgICBjb25zdCB1cGRhdGVzID0gdGhpcy51cGRhdGVzXG4gICAgY29uc3QgaGFuZGxlciA9IHRoaXMuaGFuZGxlclxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFjdGlvbnMpKSB7XG4gICAgICBhY3Rpb25zID0gW2FjdGlvbnNdXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYmF0Y2hlZCkge1xuICAgICAgdXBkYXRlcy5wdXNoLmFwcGx5KHVwZGF0ZXMsIGFjdGlvbnMpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGhhbmRsZXIoYWN0aW9ucylcbiAgICB9XG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIFRhc2sgaGFuZGxlciBmb3IgY29tbXVuaWNhdGlvbiBiZXR3ZWVuIGphdmFzY3JpcHQgYW5kIG5hdGl2ZS5cbiAqL1xuXG5jb25zdCBoYW5kbGVyTWFwID0ge1xuICBjcmVhdGVCb2R5OiAnY2FsbENyZWF0ZUJvZHknLFxuICBhZGRFbGVtZW50OiAnY2FsbEFkZEVsZW1lbnQnLFxuICByZW1vdmVFbGVtZW50OiAnY2FsbFJlbW92ZUVsZW1lbnQnLFxuICBtb3ZlRWxlbWVudDogJ2NhbGxNb3ZlRWxlbWVudCcsXG4gIHVwZGF0ZUF0dHJzOiAnY2FsbFVwZGF0ZUF0dHJzJyxcbiAgdXBkYXRlU3R5bGU6ICdjYWxsVXBkYXRlU3R5bGUnLFxuICBhZGRFdmVudDogJ2NhbGxBZGRFdmVudCcsXG4gIHJlbW92ZUV2ZW50OiAnY2FsbFJlbW92ZUV2ZW50J1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIHRhc2sgaGFuZGxlci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlclxuICogQHJldHVybiB7ZnVuY3Rpb259IHRhc2tIYW5kbGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVIYW5kbGVyIChpZCwgaGFuZGxlcikge1xuICBjb25zdCBkZWZhdWx0SGFuZGxlciA9IGhhbmRsZXIgfHwgZ2xvYmFsLmNhbGxOYXRpdmVcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHR5cGVvZiBkZWZhdWx0SGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tKUyBSdW50aW1lXSBubyBkZWZhdWx0IGhhbmRsZXInKVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHRhc2tIYW5kbGVyICh0YXNrcykge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh0YXNrcykpIHtcbiAgICAgIHRhc2tzID0gW3Rhc2tzXVxuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhc2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByZXR1cm5WYWx1ZSA9IGRpc3BhdGNoVGFzayhpZCwgdGFza3NbaV0sIGRlZmF1bHRIYW5kbGVyKVxuICAgICAgaWYgKHJldHVyblZhbHVlID09PSAtMSkge1xuICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGVyZSBpcyBhIGNvcnJlc3BvbmRpbmcgYXZhaWxhYmxlIGhhbmRsZXIgaW4gdGhlIGVudmlyb25tZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IG1vZHVsZVxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaGFzQXZhaWxhYmxlSGFuZGxlciAobW9kdWxlLCBtZXRob2QpIHtcbiAgcmV0dXJuIG1vZHVsZSA9PT0gJ2RvbSdcbiAgICAmJiBoYW5kbGVyTWFwW21ldGhvZF1cbiAgICAmJiB0eXBlb2YgZ2xvYmFsW2hhbmRsZXJNYXBbbWV0aG9kXV0gPT09ICdmdW5jdGlvbidcbn1cblxuLyoqXG4gKiBEaXNwYXRjaCB0aGUgdGFzayB0byB0aGUgc3BlY2lmaWVkIGhhbmRsZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXNrXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWZhdWx0SGFuZGxlclxuICogQHJldHVybiB7bnVtYmVyfSBzaWduYWwgcmV0dXJuZWQgZnJvbSBuYXRpdmVcbiAqL1xuZnVuY3Rpb24gZGlzcGF0Y2hUYXNrIChpZCwgdGFzaywgZGVmYXVsdEhhbmRsZXIpIHtcbiAgY29uc3QgeyBtb2R1bGUsIG1ldGhvZCwgYXJncyB9ID0gdGFza1xuXG4gIGlmIChoYXNBdmFpbGFibGVIYW5kbGVyKG1vZHVsZSwgbWV0aG9kKSkge1xuICAgIHJldHVybiBnbG9iYWxbaGFuZGxlck1hcFttZXRob2RdXShpZCwgLi4uYXJncywgJy0xJylcbiAgfVxuXG4gIHJldHVybiBkZWZhdWx0SGFuZGxlcihpZCwgW3Rhc2tdLCAnLTEnKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBDb21tZW50IGZyb20gJy4vQ29tbWVudCdcbmltcG9ydCBFbGVtZW50IGZyb20gJy4vRWxlbWVudCdcbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuLi9icmlkZ2UvTGlzdGVuZXInXG5pbXBvcnQgeyBUYXNrQ2VudGVyIH0gZnJvbSAnLi4vYnJpZGdlL1Rhc2tDZW50ZXInXG5pbXBvcnQgeyBjcmVhdGVIYW5kbGVyIH0gZnJvbSAnLi4vYnJpZGdlL0hhbmRsZXInXG5pbXBvcnQgeyBhZGREb2MsIHJlbW92ZURvYywgYXBwZW5kQm9keSwgc2V0Qm9keSB9IGZyb20gJy4vb3BlcmF0aW9uJ1xuXG4vKipcbiAqIFVwZGF0ZSBhbGwgY2hhbmdlcyBmb3IgYW4gZWxlbWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtZW50XG4gKiBAcGFyYW0ge29iamVjdH0gY2hhbmdlc1xuICovXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50IChlbCwgY2hhbmdlcykge1xuICBjb25zdCBhdHRycyA9IGNoYW5nZXMuYXR0cnMgfHwge31cbiAgZm9yIChjb25zdCBuYW1lIGluIGF0dHJzKSB7XG4gICAgZWwuc2V0QXR0cihuYW1lLCBhdHRyc1tuYW1lXSwgdHJ1ZSlcbiAgfVxuICBjb25zdCBzdHlsZSA9IGNoYW5nZXMuc3R5bGUgfHwge31cbiAgZm9yIChjb25zdCBuYW1lIGluIHN0eWxlKSB7XG4gICAgZWwuc2V0U3R5bGUobmFtZSwgc3R5bGVbbmFtZV0sIHRydWUpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRG9jdW1lbnQge1xuICBjb25zdHJ1Y3RvciAoaWQsIHVybCwgaGFuZGxlcikge1xuICAgIGlkID0gaWQgPyBpZC50b1N0cmluZygpIDogJydcbiAgICB0aGlzLmlkID0gaWRcbiAgICB0aGlzLlVSTCA9IHVybFxuXG4gICAgYWRkRG9jKGlkLCB0aGlzKVxuICAgIHRoaXMubm9kZU1hcCA9IHt9XG4gICAgY29uc3QgTCA9IERvY3VtZW50Lkxpc3RlbmVyIHx8IExpc3RlbmVyXG4gICAgdGhpcy5saXN0ZW5lciA9IG5ldyBMKGlkLCBoYW5kbGVyIHx8IGNyZWF0ZUhhbmRsZXIoaWQsIERvY3VtZW50LmhhbmRsZXIpKSAvLyBkZXByZWNhdGVkXG4gICAgdGhpcy50YXNrQ2VudGVyID0gbmV3IFRhc2tDZW50ZXIoaWQsIGhhbmRsZXIgPyAoaWQsIC4uLmFyZ3MpID0+IGhhbmRsZXIoLi4uYXJncykgOiBEb2N1bWVudC5oYW5kbGVyKVxuICAgIHRoaXMuY3JlYXRlRG9jdW1lbnRFbGVtZW50KClcbiAgfVxuXG4gIC8qKlxuICAqIEdldCB0aGUgbm9kZSBmcm9tIG5vZGVNYXAuXG4gICogQHBhcmFtIHtzdHJpbmd9IHJlZmVyZW5jZSBpZFxuICAqIEByZXR1cm4ge29iamVjdH0gbm9kZVxuICAqL1xuICBnZXRSZWYgKHJlZikge1xuICAgIHJldHVybiB0aGlzLm5vZGVNYXBbcmVmXVxuICB9XG5cbiAgLyoqXG4gICogVHVybiBvbiBiYXRjaGVkIHVwZGF0ZXMuXG4gICovXG4gIG9wZW4gKCkge1xuICAgIHRoaXMubGlzdGVuZXIuYmF0Y2hlZCA9IGZhbHNlXG4gIH1cblxuICAvKipcbiAgKiBUdXJuIG9mZiBiYXRjaGVkIHVwZGF0ZXMuXG4gICovXG4gIGNsb3NlICgpIHtcbiAgICB0aGlzLmxpc3RlbmVyLmJhdGNoZWQgPSB0cnVlXG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgdGhlIGRvY3VtZW50IGVsZW1lbnQuXG4gICogQHJldHVybiB7b2JqZWN0fSBkb2N1bWVudEVsZW1lbnRcbiAgKi9cbiAgY3JlYXRlRG9jdW1lbnRFbGVtZW50ICgpIHtcbiAgICBpZiAoIXRoaXMuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICBjb25zdCBlbCA9IG5ldyBFbGVtZW50KCdkb2N1bWVudCcpXG4gICAgICBlbC5kb2NJZCA9IHRoaXMuaWRcbiAgICAgIGVsLm93bmVyRG9jdW1lbnQgPSB0aGlzXG4gICAgICBlbC5yb2xlID0gJ2RvY3VtZW50RWxlbWVudCdcbiAgICAgIGVsLmRlcHRoID0gMFxuICAgICAgZWwucmVmID0gJ19kb2N1bWVudEVsZW1lbnQnXG4gICAgICB0aGlzLm5vZGVNYXAuX2RvY3VtZW50RWxlbWVudCA9IGVsXG4gICAgICB0aGlzLmRvY3VtZW50RWxlbWVudCA9IGVsXG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbCwgJ2FwcGVuZENoaWxkJywge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogKG5vZGUpID0+IHtcbiAgICAgICAgICBhcHBlbmRCb2R5KHRoaXMsIG5vZGUpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbCwgJ2luc2VydEJlZm9yZScsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IChub2RlLCBiZWZvcmUpID0+IHtcbiAgICAgICAgICBhcHBlbmRCb2R5KHRoaXMsIG5vZGUsIGJlZm9yZSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudEVsZW1lbnRcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSB0aGUgYm9keSBlbGVtZW50LlxuICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gICogQHBhcmFtIHtvYmpjdH0gcHJvcHNcbiAgKiBAcmV0dXJuIHtvYmplY3R9IGJvZHkgZWxlbWVudFxuICAqL1xuICBjcmVhdGVCb2R5ICh0eXBlLCBwcm9wcykge1xuICAgIGlmICghdGhpcy5ib2R5KSB7XG4gICAgICBjb25zdCBlbCA9IG5ldyBFbGVtZW50KHR5cGUsIHByb3BzKVxuICAgICAgc2V0Qm9keSh0aGlzLCBlbClcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ib2R5XG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgYW4gZWxlbWVudC5cbiAgKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZVxuICAqIEBwYXJhbSB7b2JqY3R9IHByb3BzXG4gICogQHJldHVybiB7b2JqZWN0fSBlbGVtZW50XG4gICovXG4gIGNyZWF0ZUVsZW1lbnQgKHRhZ05hbWUsIHByb3BzKSB7XG4gICAgcmV0dXJuIG5ldyBFbGVtZW50KHRhZ05hbWUsIHByb3BzKVxuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlIGFuIGNvbW1lbnQuXG4gICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAgKiBAcmV0dXJuIHtvYmplY3R9IGNvbW1lbnRcbiAgKi9cbiAgY3JlYXRlQ29tbWVudCAodGV4dCkge1xuICAgIHJldHVybiBuZXcgQ29tbWVudCh0ZXh0KVxuICB9XG5cbiAgLyoqXG4gICogRmlyZSBhbiBldmVudCBvbiBzcGVjaWZpZWQgZWxlbWVudCBtYW51YWxseS5cbiAgKiBAcGFyYW0ge29iamVjdH0gZWxlbWVudFxuICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCB0eXBlXG4gICogQHBhcmFtIHtvYmplY3R9IGV2ZW50IG9iamVjdFxuICAqIEBwYXJhbSB7b2JqZWN0fSBkb20gY2hhbmdlc1xuICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICogQHJldHVybiB7fSBhbnl0aGluZyByZXR1cm5lZCBieSBoYW5kbGVyIGZ1bmN0aW9uXG4gICovXG4gIGZpcmVFdmVudCAoZWwsIHR5cGUsIGV2ZW50LCBkb21DaGFuZ2VzLCBvcHRpb25zKSB7XG4gICAgaWYgKCFlbCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGV2ZW50ID0gZXZlbnQgfHwge31cbiAgICBldmVudC50eXBlID0gZXZlbnQudHlwZSB8fCB0eXBlXG4gICAgZXZlbnQudGFyZ2V0ID0gZWxcbiAgICBldmVudC5jdXJyZW50VGFyZ2V0ID0gZWxcbiAgICBldmVudC50aW1lc3RhbXAgPSBEYXRlLm5vdygpXG4gICAgaWYgKGRvbUNoYW5nZXMpIHtcbiAgICAgIHVwZGF0ZUVsZW1lbnQoZWwsIGRvbUNoYW5nZXMpXG4gICAgfVxuICAgIGNvbnN0IGlzQnViYmxlID0gdGhpcy5nZXRSZWYoJ19yb290JykuYXR0clsnYnViYmxlJ10gPT09ICd0cnVlJ1xuICAgIHJldHVybiBlbC5maXJlRXZlbnQodHlwZSwgZXZlbnQsIGlzQnViYmxlLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICogRGVzdHJveSBjdXJyZW50IGRvY3VtZW50LCBhbmQgcmVtb3ZlIGl0c2VsZiBmb3JtIGRvY01hcC5cbiAgKi9cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy50YXNrQ2VudGVyLmRlc3Ryb3lDYWxsYmFjaygpXG4gICAgZGVsZXRlIHRoaXMubGlzdGVuZXJcbiAgICBkZWxldGUgdGhpcy5ub2RlTWFwXG4gICAgZGVsZXRlIHRoaXMudGFza0NlbnRlclxuICAgIHJlbW92ZURvYyh0aGlzLmlkKVxuICB9XG59XG5cbi8vIGRlZmF1bHQgdGFzayBoYW5kbGVyXG5Eb2N1bWVudC5oYW5kbGVyID0gbnVsbFxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBEb2N1bWVudCBmcm9tICcuLi92ZG9tL0RvY3VtZW50J1xuaW1wb3J0IHsgaXNSZWdpc3RlcmVkTW9kdWxlLCBnZXRNb2R1bGVEZXNjcmlwdGlvbiB9IGZyb20gJy4vbW9kdWxlJ1xuaW1wb3J0IHsgaXNSZWdpc3RlcmVkQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgeyBnZXRUYXNrQ2VudGVyIH0gZnJvbSAnLi4vdmRvbS9vcGVyYXRpb24nXG5cbmNvbnN0IG1vZHVsZVByb3hpZXMgPSB7fVxuXG5mdW5jdGlvbiBzZXRJZCAod2VleCwgaWQpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHdlZXgsICdbW0N1cnJlbnRJbnN0YW5jZUlkXV0nLCB7IHZhbHVlOiBpZCB9KVxufVxuXG5mdW5jdGlvbiBnZXRJZCAod2VleCkge1xuICByZXR1cm4gd2VleFsnW1tDdXJyZW50SW5zdGFuY2VJZF1dJ11cbn1cblxuZnVuY3Rpb24gbW9kdWxlR2V0dGVyIChpZCwgbW9kdWxlLCBtZXRob2QpIHtcbiAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIoaWQpXG4gIGlmICghdGFza0NlbnRlciB8fCB0eXBlb2YgdGFza0NlbnRlci5zZW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIGZpbmQgdGFza0NlbnRlciAoJHtpZH0pLmApXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gKC4uLmFyZ3MpID0+IHRhc2tDZW50ZXIuc2VuZCgnbW9kdWxlJywgeyBtb2R1bGUsIG1ldGhvZCB9LCBhcmdzKVxufVxuXG5mdW5jdGlvbiBtb2R1bGVTZXR0ZXIgKGlkLCBtb2R1bGUsIG1ldGhvZCwgZm4pIHtcbiAgY29uc3QgdGFza0NlbnRlciA9IGdldFRhc2tDZW50ZXIoaWQpXG4gIGlmICghdGFza0NlbnRlciB8fCB0eXBlb2YgdGFza0NlbnRlci5zZW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIGZpbmQgdGFza0NlbnRlciAoJHtpZH0pLmApXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gJHttb2R1bGV9LiR7bWV0aG9kfSBtdXN0IGJlIGFzc2lnbmVkIGFzIGEgZnVuY3Rpb24uYClcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiBmbiA9PiB0YXNrQ2VudGVyLnNlbmQoJ21vZHVsZScsIHsgbW9kdWxlLCBtZXRob2QgfSwgW2ZuXSlcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2VleEluc3RhbmNlIHtcbiAgY29uc3RydWN0b3IgKGlkLCBjb25maWcpIHtcbiAgICBzZXRJZCh0aGlzLCBTdHJpbmcoaWQpKVxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnIHx8IHt9XG4gICAgdGhpcy5kb2N1bWVudCA9IG5ldyBEb2N1bWVudChpZCwgdGhpcy5jb25maWcuYnVuZGxlVXJsKVxuICAgIHRoaXMucmVxdWlyZU1vZHVsZSA9IHRoaXMucmVxdWlyZU1vZHVsZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5pc1JlZ2lzdGVyZWRNb2R1bGUgPSBpc1JlZ2lzdGVyZWRNb2R1bGVcbiAgICB0aGlzLmlzUmVnaXN0ZXJlZENvbXBvbmVudCA9IGlzUmVnaXN0ZXJlZENvbXBvbmVudFxuICB9XG5cbiAgcmVxdWlyZU1vZHVsZSAobW9kdWxlTmFtZSkge1xuICAgIGNvbnN0IGlkID0gZ2V0SWQodGhpcylcbiAgICBpZiAoIShpZCAmJiB0aGlzLmRvY3VtZW50ICYmIHRoaXMuZG9jdW1lbnQudGFza0NlbnRlcikpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIEZhaWxlZCB0byByZXF1aXJlTW9kdWxlKFwiJHttb2R1bGVOYW1lfVwiKSwgYFxuICAgICAgICArIGBpbnN0YW5jZSAoJHtpZH0pIGRvZXNuJ3QgZXhpc3QgYW55bW9yZS5gKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gd2FybiBmb3IgdW5rbm93biBtb2R1bGVcbiAgICBpZiAoIWlzUmVnaXN0ZXJlZE1vZHVsZShtb2R1bGVOYW1lKSkge1xuICAgICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSB1c2luZyB1bnJlZ2lzdGVyZWQgd2VleCBtb2R1bGUgXCIke21vZHVsZU5hbWV9XCJgKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIG5ldyBtb2R1bGUgcHJveHlcbiAgICBjb25zdCBwcm94eU5hbWUgPSBgJHttb2R1bGVOYW1lfSMke2lkfWBcbiAgICBpZiAoIW1vZHVsZVByb3hpZXNbcHJveHlOYW1lXSkge1xuICAgICAgLy8gY3JlYXRlIHJlZ2lzdGVyZWQgbW9kdWxlIGFwaXNcbiAgICAgIGNvbnN0IG1vZHVsZURlZmluZSA9IGdldE1vZHVsZURlc2NyaXB0aW9uKG1vZHVsZU5hbWUpXG4gICAgICBjb25zdCBtb2R1bGVBcGlzID0ge31cbiAgICAgIGZvciAoY29uc3QgbWV0aG9kTmFtZSBpbiBtb2R1bGVEZWZpbmUpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZUFwaXMsIG1ldGhvZE5hbWUsIHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICBnZXQ6ICgpID0+IG1vZHVsZUdldHRlcihpZCwgbW9kdWxlTmFtZSwgbWV0aG9kTmFtZSksXG4gICAgICAgICAgc2V0OiBmbiA9PiBtb2R1bGVTZXR0ZXIoaWQsIG1vZHVsZU5hbWUsIG1ldGhvZE5hbWUsIGZuKVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICAvLyBjcmVhdGUgbW9kdWxlIFByb3h5XG4gICAgICBpZiAodHlwZW9mIFByb3h5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG1vZHVsZVByb3hpZXNbcHJveHlOYW1lXSA9IG5ldyBQcm94eShtb2R1bGVBcGlzLCB7XG4gICAgICAgICAgZ2V0ICh0YXJnZXQsIG1ldGhvZE5hbWUpIHtcbiAgICAgICAgICAgIGlmIChtZXRob2ROYW1lIGluIHRhcmdldCkge1xuICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W21ldGhvZE5hbWVdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtKUyBGcmFtZXdvcmtdIHVzaW5nIHVucmVnaXN0ZXJlZCBtZXRob2QgXCIke21vZHVsZU5hbWV9LiR7bWV0aG9kTmFtZX1cImApXG4gICAgICAgICAgICByZXR1cm4gbW9kdWxlR2V0dGVyKGlkLCBtb2R1bGVOYW1lLCBtZXRob2ROYW1lKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBtb2R1bGVQcm94aWVzW3Byb3h5TmFtZV0gPSBtb2R1bGVBcGlzXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZHVsZVByb3hpZXNbcHJveHlOYW1lXVxuICB9XG5cbiAgc3VwcG9ydHMgKGNvbmRpdGlvbikge1xuICAgIGlmICh0eXBlb2YgY29uZGl0aW9uICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGxcblxuICAgIGNvbnN0IHJlcyA9IGNvbmRpdGlvbi5tYXRjaCgvXkAoXFx3KylcXC8oXFx3KykoXFwuKFxcdyspKT8kL2kpXG4gICAgaWYgKHJlcykge1xuICAgICAgY29uc3QgdHlwZSA9IHJlc1sxXVxuICAgICAgY29uc3QgbmFtZSA9IHJlc1syXVxuICAgICAgY29uc3QgbWV0aG9kID0gcmVzWzRdXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnbW9kdWxlJzogcmV0dXJuIGlzUmVnaXN0ZXJlZE1vZHVsZShuYW1lLCBtZXRob2QpXG4gICAgICAgIGNhc2UgJ2NvbXBvbmVudCc6IHJldHVybiBpc1JlZ2lzdGVyZWRDb21wb25lbnQobmFtZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gcmVnaXN0ZXJTdHlsZVNoZWV0IChzdHlsZXMpIHtcbiAgLy8gICBpZiAodGhpcy5kb2N1bWVudCkge1xuICAvLyAgICAgdGhpcy5kb2N1bWVudC5yZWdpc3RlclN0eWxlU2hlZXQoc3R5bGVzKVxuICAvLyAgIH1cbiAgLy8gfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IGluaXQgYXMgaW5pdFRhc2tIYW5kbGVyIH0gZnJvbSAnLi4vYnJpZGdlL1Rhc2tDZW50ZXInXG5pbXBvcnQgeyByZWNlaXZlVGFza3MgfSBmcm9tICcuLi9icmlkZ2UvcmVjZWl2ZXInXG5pbXBvcnQgeyByZWdpc3Rlck1vZHVsZXMgfSBmcm9tICcuL21vZHVsZSdcbmltcG9ydCB7IHJlZ2lzdGVyQ29tcG9uZW50cyB9IGZyb20gJy4vY29tcG9uZW50J1xuaW1wb3J0IHsgc2VydmljZXMsIHJlZ2lzdGVyLCB1bnJlZ2lzdGVyIH0gZnJvbSAnLi9zZXJ2aWNlJ1xuaW1wb3J0IHsgdHJhY2sgfSBmcm9tICcuLi9icmlkZ2UvZGVidWcnXG5pbXBvcnQgV2VleEluc3RhbmNlIGZyb20gJy4vV2VleEluc3RhbmNlJ1xuaW1wb3J0IHsgZ2V0RG9jIH0gZnJvbSAnLi4vdmRvbS9vcGVyYXRpb24nXG5cbmxldCBmcmFtZXdvcmtzXG5sZXQgcnVudGltZUNvbmZpZ1xuXG5jb25zdCB2ZXJzaW9uUmVnRXhwID0gL15cXHMqXFwvXFwvICooXFx7W159XSpcXH0pICpcXHI/XFxuL1xuXG4vKipcbiAqIERldGVjdCBhIEpTIEJ1bmRsZSBjb2RlIGFuZCBtYWtlIHN1cmUgd2hpY2ggZnJhbWV3b3JrIGl0J3MgYmFzZWQgdG8uIEVhY2ggSlNcbiAqIEJ1bmRsZSBzaG91bGQgbWFrZSBzdXJlIHRoYXQgaXQgc3RhcnRzIHdpdGggYSBsaW5lIG9mIEpTT04gY29tbWVudCBhbmQgaXNcbiAqIG1vcmUgdGhhdCBvbmUgbGluZS5cbiAqIEBwYXJhbSAge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5mdW5jdGlvbiBnZXRCdW5kbGVUeXBlIChjb2RlKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHZlcnNpb25SZWdFeHAuZXhlYyhjb2RlKVxuICBpZiAocmVzdWx0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGluZm8gPSBKU09OLnBhcnNlKHJlc3VsdFsxXSlcbiAgICAgIHJldHVybiBpbmZvLmZyYW1ld29ya1xuICAgIH1cbiAgICBjYXRjaCAoZSkge31cbiAgfVxuXG4gIC8vIGRlZmF1bHQgYnVuZGxlIHR5cGVcbiAgcmV0dXJuICdXZWV4J1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZXJ2aWNlcyAoaWQsIGVudiwgY29uZmlnKSB7XG4gIC8vIEluaXQgSmF2YVNjcmlwdCBzZXJ2aWNlcyBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgY29uc3Qgc2VydmljZU1hcCA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgc2VydmljZU1hcC5zZXJ2aWNlID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICBzZXJ2aWNlcy5mb3JFYWNoKCh7IG5hbWUsIG9wdGlvbnMgfSkgPT4ge1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgICAgY29uc29sZS5kZWJ1ZyhgW0pTIFJ1bnRpbWVdIGNyZWF0ZSBzZXJ2aWNlICR7bmFtZX0uYClcbiAgICB9XG4gICAgY29uc3QgY3JlYXRlID0gb3B0aW9ucy5jcmVhdGVcbiAgICBpZiAoY3JlYXRlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBjcmVhdGUoaWQsIGVudiwgY29uZmlnKVxuICAgICAgICBPYmplY3QuYXNzaWduKHNlcnZpY2VNYXAuc2VydmljZSwgcmVzdWx0KVxuICAgICAgICBPYmplY3QuYXNzaWduKHNlcnZpY2VNYXAsIHJlc3VsdC5pbnN0YW5jZSlcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBSdW50aW1lXSBGYWlsZWQgdG8gY3JlYXRlIHNlcnZpY2UgJHtuYW1lfS5gKVxuICAgICAgfVxuICAgIH1cbiAgfSlcbiAgZGVsZXRlIHNlcnZpY2VNYXAuc2VydmljZS5pbnN0YW5jZVxuICBPYmplY3QuZnJlZXplKHNlcnZpY2VNYXAuc2VydmljZSlcbiAgcmV0dXJuIHNlcnZpY2VNYXBcbn1cblxuY29uc3QgaW5zdGFuY2VUeXBlTWFwID0ge31cbmZ1bmN0aW9uIGdldEZyYW1ld29ya1R5cGUgKGlkKSB7XG4gIHJldHVybiBpbnN0YW5jZVR5cGVNYXBbaWRdXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUluc3RhbmNlQ29udGV4dCAoaWQsIG9wdGlvbnMgPSB7fSwgZGF0YSkge1xuICBjb25zdCB3ZWV4ID0gbmV3IFdlZXhJbnN0YW5jZShpZCwgb3B0aW9ucylcbiAgT2JqZWN0LmZyZWV6ZSh3ZWV4KVxuXG4gIGNvbnN0IGJ1bmRsZVR5cGUgPSBvcHRpb25zLmJ1bmRsZVR5cGUgfHwgJ1Z1ZSdcbiAgaW5zdGFuY2VUeXBlTWFwW2lkXSA9IGJ1bmRsZVR5cGVcbiAgY29uc3QgZnJhbWV3b3JrID0gcnVudGltZUNvbmZpZy5mcmFtZXdvcmtzW2J1bmRsZVR5cGVdXG4gIGlmICghZnJhbWV3b3JrKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgW0pTIEZyYW1ld29ya10gSW52YWxpZCBidW5kbGUgdHlwZSBcIiR7YnVuZGxlVHlwZX1cIi5gKVxuICB9XG4gIHRyYWNrKGlkLCAnYnVuZGxlVHlwZScsIGJ1bmRsZVR5cGUpXG5cbiAgLy8gcHJlcGFyZSBqcyBzZXJ2aWNlXG4gIGNvbnN0IHNlcnZpY2VzID0gY3JlYXRlU2VydmljZXMoaWQsIHtcbiAgICB3ZWV4LFxuICAgIGNvbmZpZzogb3B0aW9ucyxcbiAgICBjcmVhdGVkOiBEYXRlLm5vdygpLFxuICAgIGZyYW1ld29yazogYnVuZGxlVHlwZSxcbiAgICBidW5kbGVUeXBlXG4gIH0sIHJ1bnRpbWVDb25maWcpXG4gIE9iamVjdC5mcmVlemUoc2VydmljZXMpXG5cbiAgLy8gcHJlcGFyZSBydW50aW1lIGNvbnRleHRcbiAgY29uc3QgcnVudGltZUNvbnRleHQgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gIE9iamVjdC5hc3NpZ24ocnVudGltZUNvbnRleHQsIHNlcnZpY2VzLCB7XG4gICAgd2VleCxcbiAgICBzZXJ2aWNlcyAvLyBUZW1wb3JhcnkgY29tcGF0aWJsZSB3aXRoIHNvbWUgbGVnYWN5IEFQSXMgaW4gUmF4XG4gIH0pXG4gIE9iamVjdC5mcmVlemUocnVudGltZUNvbnRleHQpXG5cbiAgLy8gcHJlcGFyZSBpbnN0YW5jZSBjb250ZXh0XG4gIGNvbnN0IGluc3RhbmNlQ29udGV4dCA9IE9iamVjdC5hc3NpZ24oe30sIHJ1bnRpbWVDb250ZXh0KVxuICBpZiAodHlwZW9mIGZyYW1ld29yay5jcmVhdGVJbnN0YW5jZUNvbnRleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBPYmplY3QuYXNzaWduKGluc3RhbmNlQ29udGV4dCwgZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlQ29udGV4dChpZCwgcnVudGltZUNvbnRleHQsIGRhdGEpKVxuICB9XG4gIE9iamVjdC5mcmVlemUoaW5zdGFuY2VDb250ZXh0KVxuICByZXR1cm4gaW5zdGFuY2VDb250ZXh0XG59XG5cbi8qKlxuICogQ2hlY2sgd2hpY2ggZnJhbWV3b3JrIGEgY2VydGFpbiBKUyBCdW5kbGUgY29kZSBiYXNlZCB0by4gQW5kIGNyZWF0ZSBpbnN0YW5jZVxuICogYnkgdGhpcyBmcmFtZXdvcmsuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gKiBAcGFyYW0ge29iamVjdH0gZGF0YVxuICovXG5mdW5jdGlvbiBjcmVhdGVJbnN0YW5jZSAoaWQsIGNvZGUsIGNvbmZpZywgZGF0YSkge1xuICBpZiAoaW5zdGFuY2VUeXBlTWFwW2lkXSkge1xuICAgIHJldHVybiBuZXcgRXJyb3IoYFRoZSBpbnN0YW5jZSBpZCBcIiR7aWR9XCIgaGFzIGFscmVhZHkgYmVlbiB1c2VkIWApXG4gIH1cblxuICAvLyBJbml0IGluc3RhbmNlIGluZm8uXG4gIGNvbnN0IGJ1bmRsZVR5cGUgPSBnZXRCdW5kbGVUeXBlKGNvZGUpXG4gIGluc3RhbmNlVHlwZU1hcFtpZF0gPSBidW5kbGVUeXBlXG5cbiAgLy8gSW5pdCBpbnN0YW5jZSBjb25maWcuXG4gIGNvbmZpZyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY29uZmlnIHx8IHt9KSlcbiAgY29uZmlnLmVudiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFsLldYRW52aXJvbm1lbnQgfHwge30pKVxuICBjb25maWcuYnVuZGxlVHlwZSA9IGJ1bmRsZVR5cGVcblxuICBjb25zdCBmcmFtZXdvcmsgPSBydW50aW1lQ29uZmlnLmZyYW1ld29ya3NbYnVuZGxlVHlwZV1cbiAgaWYgKCFmcmFtZXdvcmspIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKGBbSlMgRnJhbWV3b3JrXSBJbnZhbGlkIGJ1bmRsZSB0eXBlIFwiJHtidW5kbGVUeXBlfVwiLmApXG4gIH1cbiAgaWYgKGJ1bmRsZVR5cGUgPT09ICdXZWV4Jykge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIENPTVBBVElCSUxJVFkgV0FSTklORzogYFxuICAgICAgKyBgV2VleCBEU0wgMS4wICgud2UpIGZyYW1ld29yayBpcyBubyBsb25nZXIgc3VwcG9ydGVkISBgXG4gICAgICArIGBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgdmVyc2lvbiBvZiBXZWV4U0RLLCBgXG4gICAgICArIGB5b3VyIHBhZ2Ugd291bGQgYmUgY3Jhc2ggaWYgeW91IHN0aWxsIHVzaW5nIHRoZSBcIi53ZVwiIGZyYW1ld29yay4gYFxuICAgICAgKyBgUGxlYXNlIHVwZ3JhZGUgaXQgdG8gVnVlLmpzIG9yIFJheC5gKVxuICB9XG5cbiAgY29uc3QgaW5zdGFuY2VDb250ZXh0ID0gY3JlYXRlSW5zdGFuY2VDb250ZXh0KGlkLCBjb25maWcsIGRhdGEpXG4gIGlmICh0eXBlb2YgZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVGVtcG9yYXJ5IGNvbXBhdGlibGUgd2l0aCBzb21lIGxlZ2FjeSBBUElzIGluIFJheCxcbiAgICAvLyBzb21lIFJheCBwYWdlIGlzIHVzaW5nIHRoZSBsZWdhY3kgXCIud2VcIiBmcmFtZXdvcmsuXG4gICAgaWYgKGJ1bmRsZVR5cGUgPT09ICdSYXgnIHx8IGJ1bmRsZVR5cGUgPT09ICdXZWV4Jykge1xuICAgICAgY29uc3QgcmF4SW5zdGFuY2VDb250ZXh0ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgY3JlYXRlZDogRGF0ZS5ub3coKSxcbiAgICAgICAgZnJhbWV3b3JrOiBidW5kbGVUeXBlXG4gICAgICB9LCBpbnN0YW5jZUNvbnRleHQpXG4gICAgICByZXR1cm4gZnJhbWV3b3JrLmNyZWF0ZUluc3RhbmNlKGlkLCBjb2RlLCBjb25maWcsIGRhdGEsIHJheEluc3RhbmNlQ29udGV4dClcbiAgICB9XG4gICAgcmV0dXJuIGZyYW1ld29yay5jcmVhdGVJbnN0YW5jZShpZCwgY29kZSwgY29uZmlnLCBkYXRhLCBpbnN0YW5jZUNvbnRleHQpXG4gIH1cbiAgLy8gY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gQ2FuJ3QgZmluZCBhdmFpbGFibGUgXCJjcmVhdGVJbnN0YW5jZVwiIG1ldGhvZCBpbiAke2J1bmRsZVR5cGV9IWApXG4gIHJ1bkluQ29udGV4dChjb2RlLCBpbnN0YW5jZUNvbnRleHQpXG59XG5cbi8qKlxuICogUnVuIGpzIGNvZGUgaW4gYSBzcGVjaWZpYyBjb250ZXh0LlxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIHJ1bkluQ29udGV4dCAoY29kZSwgY29udGV4dCkge1xuICBjb25zdCBrZXlzID0gW11cbiAgY29uc3QgYXJncyA9IFtdXG4gIGZvciAoY29uc3Qga2V5IGluIGNvbnRleHQpIHtcbiAgICBrZXlzLnB1c2goa2V5KVxuICAgIGFyZ3MucHVzaChjb250ZXh0W2tleV0pXG4gIH1cblxuICBjb25zdCBidW5kbGUgPSBgXG4gICAgKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICAgICR7Y29kZX1cbiAgICB9KShPYmplY3QuY3JlYXRlKHRoaXMpKVxuICBgXG5cbiAgcmV0dXJuIChuZXcgRnVuY3Rpb24oLi4ua2V5cywgYnVuZGxlKSkoLi4uYXJncylcbn1cblxuLyoqXG4gKiBHZXQgdGhlIEpTT04gb2JqZWN0IG9mIHRoZSByb290IGVsZW1lbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5zdGFuY2VJZFxuICovXG5mdW5jdGlvbiBnZXRSb290IChpbnN0YW5jZUlkKSB7XG4gIGNvbnN0IGRvY3VtZW50ID0gZ2V0RG9jKGluc3RhbmNlSWQpXG4gIHRyeSB7XG4gICAgaWYgKGRvY3VtZW50ICYmIGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5ib2R5LnRvSlNPTigpXG4gICAgfVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgW0pTIEZyYW1ld29ya10gRmFpbGVkIHRvIGdldCB0aGUgdmlydHVhbCBkb20gdHJlZS5gKVxuICAgIHJldHVyblxuICB9XG59XG5cbmNvbnN0IG1ldGhvZHMgPSB7XG4gIGNyZWF0ZUluc3RhbmNlLFxuICBjcmVhdGVJbnN0YW5jZUNvbnRleHQsXG4gIGdldFJvb3QsXG4gIGdldERvY3VtZW50OiBnZXREb2MsXG4gIHJlZ2lzdGVyU2VydmljZTogcmVnaXN0ZXIsXG4gIHVucmVnaXN0ZXJTZXJ2aWNlOiB1bnJlZ2lzdGVyLFxuICBjYWxsSlMgKGlkLCB0YXNrcykge1xuICAgIGNvbnN0IGZyYW1ld29yayA9IGZyYW1ld29ya3NbZ2V0RnJhbWV3b3JrVHlwZShpZCldXG4gICAgaWYgKGZyYW1ld29yayAmJiB0eXBlb2YgZnJhbWV3b3JrLnJlY2VpdmVUYXNrcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIGZyYW1ld29yay5yZWNlaXZlVGFza3MoaWQsIHRhc2tzKVxuICAgIH1cbiAgICByZXR1cm4gcmVjZWl2ZVRhc2tzKGlkLCB0YXNrcylcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVyIG1ldGhvZHMgd2hpY2ggd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggaW5zdGFuY2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kTmFtZVxuICovXG5mdW5jdGlvbiBnZW5JbnN0YW5jZSAobWV0aG9kTmFtZSkge1xuICBtZXRob2RzW21ldGhvZE5hbWVdID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpZCA9IGFyZ3NbMF1cbiAgICBjb25zdCB0eXBlID0gZ2V0RnJhbWV3b3JrVHlwZShpZClcbiAgICBpZiAodHlwZSAmJiBmcmFtZXdvcmtzW3R5cGVdKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBmcmFtZXdvcmtzW3R5cGVdW21ldGhvZE5hbWVdKC4uLmFyZ3MpXG4gICAgICBjb25zdCBpbmZvID0geyBmcmFtZXdvcms6IHR5cGUgfVxuXG4gICAgICAvLyBMaWZlY3ljbGUgbWV0aG9kc1xuICAgICAgaWYgKG1ldGhvZE5hbWUgPT09ICdyZWZyZXNoSW5zdGFuY2UnKSB7XG4gICAgICAgIHNlcnZpY2VzLmZvckVhY2goc2VydmljZSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVmcmVzaCA9IHNlcnZpY2Uub3B0aW9ucy5yZWZyZXNoXG4gICAgICAgICAgaWYgKHJlZnJlc2gpIHtcbiAgICAgICAgICAgIHJlZnJlc2goaWQsIHsgaW5mbywgcnVudGltZTogcnVudGltZUNvbmZpZyB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG1ldGhvZE5hbWUgPT09ICdkZXN0cm95SW5zdGFuY2UnKSB7XG4gICAgICAgIHNlcnZpY2VzLmZvckVhY2goc2VydmljZSA9PiB7XG4gICAgICAgICAgY29uc3QgZGVzdHJveSA9IHNlcnZpY2Uub3B0aW9ucy5kZXN0cm95XG4gICAgICAgICAgaWYgKGRlc3Ryb3kpIHtcbiAgICAgICAgICAgIGRlc3Ryb3koaWQsIHsgaW5mbywgcnVudGltZTogcnVudGltZUNvbmZpZyB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgZGVsZXRlIGluc3RhbmNlVHlwZU1hcFtpZF1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cbiAgICByZXR1cm4gbmV3IEVycm9yKGBbSlMgRnJhbWV3b3JrXSBVc2luZyBpbnZhbGlkIGluc3RhbmNlIGlkIGBcbiAgICAgICsgYFwiJHtpZH1cIiB3aGVuIGNhbGxpbmcgJHttZXRob2ROYW1lfS5gKVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgbWV0aG9kcyB3aGljaCBpbml0IGVhY2ggZnJhbWV3b3Jrcy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2ROYW1lXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzaGFyZWRNZXRob2RcbiAqL1xuZnVuY3Rpb24gYWRhcHRNZXRob2QgKG1ldGhvZE5hbWUsIHNoYXJlZE1ldGhvZCkge1xuICBtZXRob2RzW21ldGhvZE5hbWVdID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBpZiAodHlwZW9mIHNoYXJlZE1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgc2hhcmVkTWV0aG9kKC4uLmFyZ3MpXG4gICAgfVxuXG4gICAgLy8gVE9ETzogZGVwcmVjYXRlZFxuICAgIGZvciAoY29uc3QgbmFtZSBpbiBydW50aW1lQ29uZmlnLmZyYW1ld29ya3MpIHtcbiAgICAgIGNvbnN0IGZyYW1ld29yayA9IHJ1bnRpbWVDb25maWcuZnJhbWV3b3Jrc1tuYW1lXVxuICAgICAgaWYgKGZyYW1ld29yayAmJiBmcmFtZXdvcmtbbWV0aG9kTmFtZV0pIHtcbiAgICAgICAgZnJhbWV3b3JrW21ldGhvZE5hbWVdKC4uLmFyZ3MpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXQgKGNvbmZpZykge1xuICBydW50aW1lQ29uZmlnID0gY29uZmlnIHx8IHt9XG4gIGZyYW1ld29ya3MgPSBydW50aW1lQ29uZmlnLmZyYW1ld29ya3MgfHwge31cbiAgaW5pdFRhc2tIYW5kbGVyKClcblxuICAvLyBJbml0IGVhY2ggZnJhbWV3b3JrIGJ5IGBpbml0YCBtZXRob2QgYW5kIGBjb25maWdgIHdoaWNoIGNvbnRhaW5zIHRocmVlXG4gIC8vIHZpcnR1YWwtRE9NIENsYXNzOiBgRG9jdW1lbnRgLCBgRWxlbWVudGAgJiBgQ29tbWVudGAsIGFuZCBhIEpTIGJyaWRnZSBtZXRob2Q6XG4gIC8vIGBzZW5kVGFza3MoLi4uYXJncylgLlxuICBmb3IgKGNvbnN0IG5hbWUgaW4gZnJhbWV3b3Jrcykge1xuICAgIGNvbnN0IGZyYW1ld29yayA9IGZyYW1ld29ya3NbbmFtZV1cbiAgICBpZiAodHlwZW9mIGZyYW1ld29yay5pbml0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0cnkge1xuICAgICAgICBmcmFtZXdvcmsuaW5pdChjb25maWcpXG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge31cbiAgICB9XG4gIH1cblxuICBhZGFwdE1ldGhvZCgncmVnaXN0ZXJDb21wb25lbnRzJywgcmVnaXN0ZXJDb21wb25lbnRzKVxuICBhZGFwdE1ldGhvZCgncmVnaXN0ZXJNb2R1bGVzJywgcmVnaXN0ZXJNb2R1bGVzKVxuICBhZGFwdE1ldGhvZCgncmVnaXN0ZXJNZXRob2RzJylcblxuICA7IFsnZGVzdHJveUluc3RhbmNlJywgJ3JlZnJlc2hJbnN0YW5jZSddLmZvckVhY2goZ2VuSW5zdGFuY2UpXG5cbiAgcmV0dXJuIG1ldGhvZHNcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL05vZGUnXG5pbXBvcnQgRWxlbWVudCBmcm9tICcuL0VsZW1lbnQnXG5pbXBvcnQgQ29tbWVudCBmcm9tICcuL0NvbW1lbnQnXG5pbXBvcnQgRG9jdW1lbnQgZnJvbSAnLi9Eb2N1bWVudCdcblxuZXhwb3J0IHtcbiAgcmVnaXN0ZXJFbGVtZW50LFxuICB1bnJlZ2lzdGVyRWxlbWVudCxcbiAgaXNXZWV4RWxlbWVudCxcbiAgY2xlYXJXZWV4RWxlbWVudHNcbn0gZnJvbSAnLi9XZWV4RWxlbWVudCdcblxuZXhwb3J0IHtcbiAgRG9jdW1lbnQsXG4gIE5vZGUsXG4gIEVsZW1lbnQsXG4gIENvbW1lbnRcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgeyBEb2N1bWVudCwgRWxlbWVudCwgQ29tbWVudCB9IGZyb20gJy4uL3Zkb20nXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi4vYnJpZGdlL0xpc3RlbmVyJ1xuaW1wb3J0IHsgVGFza0NlbnRlciB9IGZyb20gJy4uL2JyaWRnZS9UYXNrQ2VudGVyJ1xuXG5jb25zdCBjb25maWcgPSB7XG4gIERvY3VtZW50LCBFbGVtZW50LCBDb21tZW50LCBMaXN0ZW5lcixcbiAgVGFza0NlbnRlcixcbiAgc2VuZFRhc2tzICguLi5hcmdzKSB7XG4gICAgaWYgKHR5cGVvZiBjYWxsTmF0aXZlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gY2FsbE5hdGl2ZSguLi5hcmdzKVxuICAgIH1cbiAgICByZXR1cm4gKGdsb2JhbC5jYWxsTmF0aXZlIHx8ICgoKSA9PiB7fSkpKC4uLmFyZ3MpXG4gIH1cbn1cblxuRG9jdW1lbnQuaGFuZGxlciA9IGNvbmZpZy5zZW5kVGFza3NcblxuZXhwb3J0IGRlZmF1bHQgY29uZmlnXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IGluaXQgZnJvbSAnLi9pbml0J1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB7IHJlZ2lzdGVyLCB1bnJlZ2lzdGVyLCBoYXMgfSBmcm9tICcuL3NlcnZpY2UnXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiBmcmVlemVQcm90b3R5cGUgKCkge1xuICAvLyBPYmplY3QuZnJlZXplKGNvbmZpZy5FbGVtZW50KVxuICBPYmplY3QuZnJlZXplKGNvbmZpZy5Db21tZW50KVxuICBPYmplY3QuZnJlZXplKGNvbmZpZy5MaXN0ZW5lcilcbiAgT2JqZWN0LmZyZWV6ZShjb25maWcuRG9jdW1lbnQucHJvdG90eXBlKVxuICAvLyBPYmplY3QuZnJlZXplKGNvbmZpZy5FbGVtZW50LnByb3RvdHlwZSlcbiAgT2JqZWN0LmZyZWV6ZShjb25maWcuQ29tbWVudC5wcm90b3R5cGUpXG4gIE9iamVjdC5mcmVlemUoY29uZmlnLkxpc3RlbmVyLnByb3RvdHlwZSlcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBzZXJ2aWNlOiB7IHJlZ2lzdGVyLCB1bnJlZ2lzdGVyLCBoYXMgfSxcbiAgZnJlZXplUHJvdG90eXBlLFxuICBpbml0LFxuICBjb25maWdcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIE1vY2sgTWVzc2FnZUV2ZW50IHR5cGVcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge29iamVjdH0gZGljdCB7IGRhdGEsIG9yaWdpbiwgc291cmNlLCBwb3J0cyB9XG4gKlxuICogVGhpcyB0eXBlIGhhcyBiZWVuIHNpbXBsaWZpZWQuXG4gKiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9jb21tcy5odG1sI21lc3NhZ2VldmVudFxuICogaHR0cHM6Ly9kb20uc3BlYy53aGF0d2cub3JnLyNpbnRlcmZhY2UtZXZlbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE1lc3NhZ2VFdmVudCAodHlwZSwgZGljdCA9IHt9KSB7XG4gIHRoaXMudHlwZSA9IHR5cGUgfHwgJ21lc3NhZ2UnXG5cbiAgdGhpcy5kYXRhID0gZGljdC5kYXRhIHx8IG51bGxcbiAgdGhpcy5vcmlnaW4gPSBkaWN0Lm9yaWdpbiB8fCAnJ1xuICB0aGlzLnNvdXJjZSA9IGRpY3Quc291cmNlIHx8IG51bGxcbiAgdGhpcy5wb3J0cyA9IGRpY3QucG9ydHMgfHwgW11cblxuICAvLyBpbmhlcml0IHByb3BlcnRpZXNcbiAgdGhpcy50YXJnZXQgPSBudWxsXG4gIHRoaXMudGltZVN0YW1wID0gRGF0ZS5ub3coKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogVGhlIHBvbHlmaWxsIG9mIEJyb2FkY2FzdENoYW5uZWwgQVBJLlxuICogVGhpcyBhcGkgY2FuIGJlIHVzZWQgdG8gYWNoaWV2ZSBpbnRlci1pbnN0YW5jZSBjb21tdW5pY2F0aW9ucy5cbiAqXG4gKiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9jb21tcy5odG1sI2Jyb2FkY2FzdGluZy10by1vdGhlci1icm93c2luZy1jb250ZXh0c1xuICovXG5cbmltcG9ydCB7IE1lc3NhZ2VFdmVudCB9IGZyb20gJy4vbWVzc2FnZS1ldmVudCdcblxuY29uc3QgY2hhbm5lbHMgPSB7fVxuY29uc3QgaW5zdGFuY2VzID0ge31cblxuLyoqXG4gKiBBbiBlbXB0eSBjb25zdHJ1Y3RvciBmb3IgQnJvYWRjYXN0Q2hhbm5lbCBwb2x5ZmlsbC5cbiAqIFRoZSByZWFsIGNvbnN0cnVjdG9yIHdpbGwgYmUgZGVmaW5lZCB3aGVuIGEgV2VleCBpbnN0YW5jZSBjcmVhdGVkIGJlY2F1c2VcbiAqIHdlIG5lZWQgdG8gdHJhY2sgdGhlIGNoYW5uZWwgYnkgV2VleCBpbnN0YW5jZSBpZC5cbiAqL1xuZnVuY3Rpb24gQnJvYWRjYXN0Q2hhbm5lbCAoKSB7fVxuXG4vKipcbiAqIFNlbmRzIHRoZSBnaXZlbiBtZXNzYWdlIHRvIG90aGVyIEJyb2FkY2FzdENoYW5uZWwgb2JqZWN0cyBzZXQgdXAgZm9yIHRoaXMgY2hhbm5lbC5cbiAqIEBwYXJhbSB7YW55fSBtZXNzYWdlXG4gKi9cbkJyb2FkY2FzdENoYW5uZWwucHJvdG90eXBlLnBvc3RNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQnJvYWRjYXN0Q2hhbm5lbCBcIiR7dGhpcy5uYW1lfVwiIGlzIGNsb3NlZC5gKVxuICB9XG5cbiAgY29uc3Qgc3Vic2NyaWJlcnMgPSBjaGFubmVsc1t0aGlzLm5hbWVdXG4gIGlmIChzdWJzY3JpYmVycyAmJiBzdWJzY3JpYmVycy5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBtZW1iZXIgPSBzdWJzY3JpYmVyc1tpXVxuXG4gICAgICBpZiAobWVtYmVyLl9jbG9zZWQgfHwgbWVtYmVyID09PSB0aGlzKSBjb250aW51ZVxuXG4gICAgICBpZiAodHlwZW9mIG1lbWJlci5vbm1lc3NhZ2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbWVtYmVyLm9ubWVzc2FnZShuZXcgTWVzc2FnZUV2ZW50KCdtZXNzYWdlJywgeyBkYXRhOiBtZXNzYWdlIH0pKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsb3NlcyB0aGUgQnJvYWRjYXN0Q2hhbm5lbCBvYmplY3QsIG9wZW5pbmcgaXQgdXAgdG8gZ2FyYmFnZSBjb2xsZWN0aW9uLlxuICovXG5Ccm9hZGNhc3RDaGFubmVsLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxuXG4gIC8vIHJlbW92ZSBpdHNlbGYgZnJvbSBjaGFubmVscy5cbiAgaWYgKGNoYW5uZWxzW3RoaXMubmFtZV0pIHtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IGNoYW5uZWxzW3RoaXMubmFtZV0uZmlsdGVyKHggPT4geCAhPT0gdGhpcylcbiAgICBpZiAoc3Vic2NyaWJlcnMubGVuZ3RoKSB7XG4gICAgICBjaGFubmVsc1t0aGlzLm5hbWVdID0gc3Vic2NyaWJlcnNcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkZWxldGUgY2hhbm5lbHNbdGhpcy5uYW1lXVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGNyZWF0ZTogKGlkLCBlbnYsIGNvbmZpZykgPT4ge1xuICAgIGluc3RhbmNlc1tpZF0gPSBbXVxuICAgIGlmICh0eXBlb2YgZ2xvYmFsLkJyb2FkY2FzdENoYW5uZWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB7fVxuICAgIH1cbiAgICBjb25zdCBzZXJ2aWNlT2JqZWN0ID0ge1xuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm5zIGEgbmV3IEJyb2FkY2FzdENoYW5uZWwgb2JqZWN0IHZpYSB3aGljaCBtZXNzYWdlcyBmb3IgdGhlIGdpdmVuXG4gICAgICAgKiBjaGFubmVsIG5hbWUgY2FuIGJlIHNlbnQgYW5kIHJlY2VpdmVkLlxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgICAqL1xuICAgICAgQnJvYWRjYXN0Q2hhbm5lbDogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgLy8gdGhlIG5hbWUgcHJvcGVydHkgaXMgcmVhZG9ubHlcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICduYW1lJywge1xuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6IFN0cmluZyhuYW1lKVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlXG4gICAgICAgIHRoaXMub25tZXNzYWdlID0gbnVsbFxuXG4gICAgICAgIGlmICghY2hhbm5lbHNbdGhpcy5uYW1lXSkge1xuICAgICAgICAgIGNoYW5uZWxzW3RoaXMubmFtZV0gPSBbXVxuICAgICAgICB9XG4gICAgICAgIGNoYW5uZWxzW3RoaXMubmFtZV0ucHVzaCh0aGlzKVxuICAgICAgICBpbnN0YW5jZXNbaWRdLnB1c2godGhpcylcbiAgICAgIH1cbiAgICB9XG4gICAgc2VydmljZU9iamVjdC5Ccm9hZGNhc3RDaGFubmVsLnByb3RvdHlwZSA9IEJyb2FkY2FzdENoYW5uZWwucHJvdG90eXBlXG4gICAgcmV0dXJuIHtcbiAgICAgIGluc3RhbmNlOiBzZXJ2aWNlT2JqZWN0XG4gICAgfVxuICB9LFxuICBkZXN0cm95OiAoaWQsIGVudikgPT4ge1xuICAgIGluc3RhbmNlc1tpZF0uZm9yRWFjaChjaGFubmVsID0+IGNoYW5uZWwuY2xvc2UoKSlcbiAgICBkZWxldGUgaW5zdGFuY2VzW2lkXVxuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCBCcm9hZGNhc3RDaGFubmVsIGZyb20gJy4vYnJvYWRjYXN0LWNoYW5uZWwvaW5kZXgnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgQnJvYWRjYXN0Q2hhbm5lbFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IHN1YnZlcnNpb24gfSBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nXG5pbXBvcnQgcnVudGltZSBmcm9tICcuLi9hcGknXG5pbXBvcnQgc2VydmljZXMgZnJvbSAnLi4vc2VydmljZXMnXG5cbi8qKlxuICogU2V0dXAgZnJhbWV3b3JrcyB3aXRoIHJ1bnRpbWUuXG4gKiBZb3UgY2FuIHBhY2thZ2UgbW9yZSBmcmFtZXdvcmtzIGJ5XG4gKiAgcGFzc2luZyB0aGVtIGFzIGFyZ3VtZW50cy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGZyYW1ld29ya3MpIHtcbiAgY29uc3QgeyBpbml0LCBjb25maWcgfSA9IHJ1bnRpbWVcbiAgY29uZmlnLmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzXG4gIGNvbnN0IHsgbmF0aXZlLCB0cmFuc2Zvcm1lciB9ID0gc3VidmVyc2lvblxuXG4gIGZvciAoY29uc3Qgc2VydmljZU5hbWUgaW4gc2VydmljZXMpIHtcbiAgICBydW50aW1lLnNlcnZpY2UucmVnaXN0ZXIoc2VydmljZU5hbWUsIHNlcnZpY2VzW3NlcnZpY2VOYW1lXSlcbiAgfVxuXG4gIHJ1bnRpbWUuZnJlZXplUHJvdG90eXBlKClcblxuICAvLyByZWdpc3RlciBmcmFtZXdvcmsgbWV0YSBpbmZvXG4gIGdsb2JhbC5mcmFtZXdvcmtWZXJzaW9uID0gbmF0aXZlXG4gIGdsb2JhbC50cmFuc2Zvcm1lclZlcnNpb24gPSB0cmFuc2Zvcm1lclxuXG4gIC8vIGluaXQgZnJhbWV3b3Jrc1xuICBjb25zdCBnbG9iYWxNZXRob2RzID0gaW5pdChjb25maWcpXG5cbiAgLy8gc2V0IGdsb2JhbCBtZXRob2RzXG4gIGZvciAoY29uc3QgbWV0aG9kTmFtZSBpbiBnbG9iYWxNZXRob2RzKSB7XG4gICAgZ2xvYmFsW21ldGhvZE5hbWVdID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IHJldCA9IGdsb2JhbE1ldGhvZHNbbWV0aG9kTmFtZV0oLi4uYXJncylcbiAgICAgIGlmIChyZXQgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKHJldC50b1N0cmluZygpKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJldFxuICAgIH1cbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vKipcbiAqIEBmaWxlT3ZlcnZpZXcgVGhlIGFwaSBmb3IgaW52b2tpbmcgd2l0aCBcIiRcIiBwcmVmaXhcbiAqL1xuXG4vKipcbiAqIEBkZXByZWNhdGVkIHVzZSAkdm0gaW5zdGVhZFxuICogZmluZCB0aGUgdm0gYnkgaWRcbiAqIE5vdGU6IHRoZXJlIGlzIG9ubHkgb25lIGlkIGluIHdob2xlIGNvbXBvbmVudFxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7Vm19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkIChpZCkge1xuICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIFZtIyQgaXMgZGVwcmVjYXRlZCwgcGxlYXNlIHVzZSBWbSMkdm0gaW5zdGVhZCcpXG4gIGNvbnN0IGluZm8gPSB0aGlzLl9pZHNbaWRdXG4gIGlmIChpbmZvKSB7XG4gICAgcmV0dXJuIGluZm8udm1cbiAgfVxufVxuXG4vKipcbiAqIGZpbmQgdGhlIGVsZW1lbnQgYnkgaWRcbiAqIE5vdGU6IHRoZXJlIGlzIG9ubHkgb25lIGlkIGluIHdob2xlIGNvbXBvbmVudFxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICRlbCAoaWQpIHtcbiAgY29uc3QgaW5mbyA9IHRoaXMuX2lkc1tpZF1cbiAgaWYgKGluZm8pIHtcbiAgICByZXR1cm4gaW5mby5lbFxuICB9XG59XG5cbi8qKlxuICogZmluZCB0aGUgdm0gb2YgdGhlIGN1c3RvbSBjb21wb25lbnQgYnkgaWRcbiAqIE5vdGU6IHRoZXJlIGlzIG9ubHkgb25lIGlkIGluIHdob2xlIGNvbXBvbmVudFxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHJldHVybiB7Vm19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkdm0gKGlkKSB7XG4gIGNvbnN0IGluZm8gPSB0aGlzLl9pZHNbaWRdXG4gIGlmIChpbmZvKSB7XG4gICAgcmV0dXJuIGluZm8udm1cbiAgfVxufVxuXG4vKipcbiAqIEZpcmUgd2hlbiBkaWZmZXIgcmVuZGVyaW5nIGZpbmlzaGVkXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkcmVuZGVyVGhlbiAoZm4pIHtcbiAgY29uc3QgYXBwID0gdGhpcy5fYXBwXG4gIGNvbnN0IGRpZmZlciA9IGFwcC5kaWZmZXJcbiAgcmV0dXJuIGRpZmZlci50aGVuKCgpID0+IHtcbiAgICBmbigpXG4gIH0pXG59XG5cbi8qKlxuICogc2Nyb2xsIGFuIGVsZW1lbnQgc3BlY2lmaWVkIGJ5IGlkIGludG8gdmlldyxcbiAqIG1vcmVvdmVyIHNwZWNpZnkgYSBudW1iZXIgb2Ygb2Zmc2V0IG9wdGlvbmFsbHlcbiAqIEBwYXJhbSAge3N0cmluZ30gaWRcbiAqIEBwYXJhbSAge251bWJlcn0gb2Zmc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkc2Nyb2xsVG8gKGlkLCBvZmZzZXQpIHtcbiAgY29uc29sZS53YXJuKCdbSlMgRnJhbWV3b3JrXSBWbSMkc2Nyb2xsVG8gaXMgZGVwcmVjYXRlZCwgJyArXG4gICAgICAgICAgJ3BsZWFzZSB1c2UgXCJyZXF1aXJlKFxcJ0B3ZWV4LW1vZHVsZS9kb21cXCcpJyArXG4gICAgICAgICAgJy5zY3JvbGxUbyhlbCwgb3B0aW9ucylcIiBpbnN0ZWFkJylcbiAgY29uc3QgZWwgPSB0aGlzLiRlbChpZClcbiAgaWYgKGVsKSB7XG4gICAgY29uc3QgZG9tID0gdGhpcy5fYXBwLnJlcXVpcmVNb2R1bGUoJ2RvbScpXG4gICAgZG9tLnNjcm9sbFRvRWxlbWVudChlbC5yZWYsIHsgb2Zmc2V0OiBvZmZzZXQgfSlcbiAgfVxufVxuXG4vKipcbiAqIHBlcmZvcm0gdHJhbnNpdGlvbiBhbmltYXRpb24gb24gYW4gZWxlbWVudCBzcGVjaWZpZWQgYnkgaWRcbiAqIEBwYXJhbSAge3N0cmluZ30gICBpZFxuICogQHBhcmFtICB7b2JqZWN0fSAgIG9wdGlvbnNcbiAqIEBwYXJhbSAge29iamVjdH0gICBvcHRpb25zLnN0eWxlc1xuICogQHBhcmFtICB7b2JqZWN0fSAgIG9wdGlvbnMuZHVyYXRpb24obXMpXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgW29wdGlvbnMudGltaW5nRnVuY3Rpb25dXG4gKiBAcGFyYW0gIHtvYmplY3R9ICAgW29wdGlvbnMuZGVsYXk9MChtcyldXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICR0cmFuc2l0aW9uIChpZCwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgY29uc3QgZWwgPSB0aGlzLiRlbChpZClcbiAgaWYgKGVsICYmIG9wdGlvbnMgJiYgb3B0aW9ucy5zdHlsZXMpIHtcbiAgICBjb25zdCBhbmltYXRpb24gPSB0aGlzLl9hcHAucmVxdWlyZU1vZHVsZSgnYW5pbWF0aW9uJylcbiAgICBhbmltYXRpb24udHJhbnNpdGlvbihlbC5yZWYsIG9wdGlvbnMsICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLl9zZXRTdHlsZShlbCwgb3B0aW9ucy5zdHlsZXMpXG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayguLi5hcmdzKVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBnZXQgc29tZSBjb25maWdcbiAqIEByZXR1cm4ge29iamVjdH0gc29tZSBjb25maWcgZm9yIGFwcCBpbnN0YW5jZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGJ1bmRsZVVybFxuICogQHByb3BlcnR5IHtib29sZWFufSBkZWJ1Z1xuICogQHByb3BlcnR5IHtvYmplY3R9IGVudlxuICogQHByb3BlcnR5IHtzdHJpbmd9IGVudi53ZWV4VmVyc2lvbihleC4gMS4wLjApXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZW52LmFwcE5hbWUoZXguIFRCL1RNKVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGVudi5hcHBWZXJzaW9uKGV4LiA1LjAuMClcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBlbnYucGxhdGZvcm0oZXguIGlPUy9BbmRyb2lkKVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGVudi5vc1ZlcnNpb24oZXguIDcuMC4wKVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGVudi5kZXZpY2VNb2RlbCAqKm5hdGl2ZSBvbmx5KipcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlbnYuW2RldmljZVdpZHRoPTc1MF1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBlbnYuZGV2aWNlSGVpZ2h0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkZ2V0Q29uZmlnIChjYWxsYmFjaykge1xuICBjb25zdCBjb25maWcgPSB0aGlzLl9hcHAub3B0aW9uc1xuICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc29sZS53YXJuKCdbSlMgRnJhbWV3b3JrXSB0aGUgY2FsbGJhY2sgb2YgVm0jJGdldENvbmZpZyhjYWxsYmFjaykgaXMgZGVwcmVjYXRlZCwgJyArXG4gICAgICAndGhpcyBhcGkgbm93IGNhbiBkaXJlY3RseSBSRVRVUk4gY29uZmlnIGluZm8uJylcbiAgICBjYWxsYmFjayhjb25maWcpXG4gIH1cbiAgcmV0dXJuIGNvbmZpZ1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiByZXF1ZXN0IG5ldHdvcmsgdmlhIGh0dHAgcHJvdG9jb2xcbiAqIEBwYXJhbSAge29iamVjdH0gICBwYXJhbXNcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gJHNlbmRIdHRwIChwYXJhbXMsIGNhbGxiYWNrKSB7XG4gIGNvbnNvbGUud2FybignW0pTIEZyYW1ld29ya10gVm0jJHNlbmRIdHRwIGlzIGRlcHJlY2F0ZWQsICcgK1xuICAgICAgICAgICdwbGVhc2UgdXNlIFwicmVxdWlyZShcXCdAd2VleC1tb2R1bGUvc3RyZWFtXFwnKScgK1xuICAgICAgICAgICcuc2VuZEh0dHAocGFyYW1zLCBjYWxsYmFjaylcIiBpbnN0ZWFkJylcbiAgY29uc3Qgc3RyZWFtID0gdGhpcy5fYXBwLnJlcXVpcmVNb2R1bGUoJ3N0cmVhbScpXG4gIHN0cmVhbS5zZW5kSHR0cChwYXJhbXMsIGNhbGxiYWNrKVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiBvcGVuIGEgdXJsXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHVybFxuICovXG5leHBvcnQgZnVuY3Rpb24gJG9wZW5VUkwgKHVybCkge1xuICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIFZtIyRvcGVuVVJMIGlzIGRlcHJlY2F0ZWQsICcgK1xuICAgICAgICAgICdwbGVhc2UgdXNlIFwicmVxdWlyZShcXCdAd2VleC1tb2R1bGUvZXZlbnRcXCcpJyArXG4gICAgICAgICAgJy5vcGVuVVJMKHVybClcIiBpbnN0ZWFkJylcbiAgY29uc3QgZXZlbnQgPSB0aGlzLl9hcHAucmVxdWlyZU1vZHVsZSgnZXZlbnQnKVxuICBldmVudC5vcGVuVVJMKHVybClcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZFxuICogc2V0IGEgdGl0bGUgZm9yIHBhZ2VcbiAqIEBwYXJhbSAge3N0cmluZ30gdGl0bGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uICRzZXRUaXRsZSAodGl0bGUpIHtcbiAgY29uc29sZS53YXJuKCdbSlMgRnJhbWV3b3JrXSBWbSMkc2V0VGl0bGUgaXMgZGVwcmVjYXRlZCwgJyArXG4gICAgICAgICAgJ3BsZWFzZSB1c2UgXCJyZXF1aXJlKFxcJ0B3ZWV4LW1vZHVsZS9wYWdlSW5mb1xcJyknICtcbiAgICAgICAgICAnLnNldFRpdGxlKHRpdGxlKVwiIGluc3RlYWQnKVxuICBjb25zdCBwYWdlSW5mbyA9IHRoaXMuX2FwcC5yZXF1aXJlTW9kdWxlKCdwYWdlSW5mbycpXG4gIHBhZ2VJbmZvLnNldFRpdGxlKHRpdGxlKVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIHVzZSBcInJlcXVpcmUoJ0B3ZWV4LW1vZHVsZS9tb2R1bGVOYW1lJykgaW5zdGVhZFwiXG4gKiBpbnZva2UgYSBuYXRpdmUgbWV0aG9kIGJ5IHNwZWNpZmluZyB0aGUgbmFtZSBvZiBtb2R1bGUgYW5kIG1ldGhvZFxuICogQHBhcmFtICB7c3RyaW5nfSBtb2R1bGVOYW1lXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG1ldGhvZE5hbWVcbiAqIEBwYXJhbSAgey4uLip9IHRoZSByZXN0IGFyZ3VtZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gJGNhbGwgKG1vZHVsZU5hbWUsIG1ldGhvZE5hbWUsIC4uLmFyZ3MpIHtcbiAgY29uc29sZS53YXJuKCdbSlMgRnJhbWV3b3JrXSBWbSMkY2FsbCBpcyBkZXByZWNhdGVkLCAnICtcbiAgICAncGxlYXNlIHVzZSBcInJlcXVpcmUoXFwnQHdlZXgtbW9kdWxlL21vZHVsZU5hbWVcXCcpXCIgaW5zdGVhZCcpXG4gIGNvbnN0IG1vZHVsZSA9IHRoaXMuX2FwcC5yZXF1aXJlTW9kdWxlKG1vZHVsZU5hbWUpXG4gIGlmIChtb2R1bGUgJiYgbW9kdWxlW21ldGhvZE5hbWVdKSB7XG4gICAgbW9kdWxlW21ldGhvZE5hbWVdKC4uLmFyZ3MpXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBNaXggcHJvcGVydGllcyBpbnRvIHRhcmdldCBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHRvXG4gKiBAcGFyYW0ge09iamVjdH0gZnJvbVxuICovXG5cbmZ1bmN0aW9uIGV4dGVuZCAodGFyZ2V0LCAuLi5zcmMpIHtcbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKHR5cGVvZiBPYmplY3QuYXNzaWduID09PSAnZnVuY3Rpb24nKSB7XG4gICAgT2JqZWN0LmFzc2lnbih0YXJnZXQsIC4uLnNyYylcbiAgfVxuICBlbHNlIHtcbiAgICBjb25zdCBmaXJzdCA9IHNyYy5zaGlmdCgpXG4gICAgZm9yIChjb25zdCBrZXkgaW4gZmlyc3QpIHtcbiAgICAgIHRhcmdldFtrZXldID0gZmlyc3Rba2V5XVxuICAgIH1cbiAgICBpZiAoc3JjLmxlbmd0aCkge1xuICAgICAgZXh0ZW5kKHRhcmdldCwgLi4uc3JjKVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0XG59XG5cbi8qKlxuICogRGVmaW5lIGEgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW2VudW1lcmFibGVdXG4gKi9cblxuZnVuY3Rpb24gZGVmIChvYmosIGtleSwgdmFsLCBlbnVtZXJhYmxlKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgIHZhbHVlOiB2YWwsXG4gICAgZW51bWVyYWJsZTogISFlbnVtZXJhYmxlLFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KVxufVxuXG4vKipcbiAqIFJlbW92ZSBhbiBpdGVtIGZyb20gYW4gYXJyYXlcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJcbiAqIEBwYXJhbSB7Kn0gaXRlbVxuICovXG5cbmZ1bmN0aW9uIHJlbW92ZSAoYXJyLCBpdGVtKSB7XG4gIGlmIChhcnIubGVuZ3RoKSB7XG4gICAgY29uc3QgaW5kZXggPSBhcnIuaW5kZXhPZihpdGVtKVxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICByZXR1cm4gYXJyLnNwbGljZShpbmRleCwgMSlcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBvYmplY3QgaGFzIHRoZSBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5jb25zdCBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbmZ1bmN0aW9uIGhhc093biAob2JqLCBrZXkpIHtcbiAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpXG59XG5cbi8qKlxuICogU2ltcGxlIGJpbmQsIGZhc3RlciB0aGFuIG5hdGl2ZVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5mdW5jdGlvbiBiaW5kIChmbiwgY3R4KSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYSkge1xuICAgIGNvbnN0IGwgPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgcmV0dXJuIGxcbiAgICAgID8gbCA+IDFcbiAgICAgICAgPyBmbi5hcHBseShjdHgsIGFyZ3VtZW50cylcbiAgICAgICAgOiBmbi5jYWxsKGN0eCwgYSlcbiAgICAgIDogZm4uY2FsbChjdHgpXG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IGFuIEFycmF5LWxpa2Ugb2JqZWN0IHRvIGEgcmVhbCBBcnJheS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5LWxpa2V9IGxpc3RcbiAqIEBwYXJhbSB7TnVtYmVyfSBbc3RhcnRdIC0gc3RhcnQgaW5kZXhcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5cbmZ1bmN0aW9uIHRvQXJyYXkgKGxpc3QsIHN0YXJ0KSB7XG4gIHN0YXJ0ID0gc3RhcnQgfHwgMFxuICBsZXQgaSA9IGxpc3QubGVuZ3RoIC0gc3RhcnRcbiAgY29uc3QgcmV0ID0gbmV3IEFycmF5KGkpXG4gIHdoaWxlIChpLS0pIHtcbiAgICByZXRbaV0gPSBsaXN0W2kgKyBzdGFydF1cbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbi8qKlxuICogUXVpY2sgb2JqZWN0IGNoZWNrIC0gdGhpcyBpcyBwcmltYXJpbHkgdXNlZCB0byB0ZWxsXG4gKiBPYmplY3RzIGZyb20gcHJpbWl0aXZlIHZhbHVlcyB3aGVuIHdlIGtub3cgdGhlIHZhbHVlXG4gKiBpcyBhIEpTT04tY29tcGxpYW50IHR5cGUuXG4gKlxuICogQHBhcmFtIHsqfSBvYmpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaXNPYmplY3QgKG9iaikge1xuICByZXR1cm4gb2JqICE9PSBudWxsICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnXG59XG5cbi8qKlxuICogU3RyaWN0IG9iamVjdCB0eXBlIGNoZWNrLiBPbmx5IHJldHVybnMgdHJ1ZVxuICogZm9yIHBsYWluIEphdmFTY3JpcHQgb2JqZWN0cy5cbiAqXG4gKiBAcGFyYW0geyp9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuXG5jb25zdCB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcbmNvbnN0IE9CSkVDVF9TVFJJTkcgPSAnW29iamVjdCBPYmplY3RdJ1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCAob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09IE9CSkVDVF9TVFJJTkdcbn1cblxuZXhwb3J0IHtcbiAgZXh0ZW5kLFxuICBkZWYsXG4gIHJlbW92ZSxcbiAgaGFzT3duLFxuICBiaW5kLFxuICB0b0FycmF5LFxuICBpc09iamVjdCxcbiAgaXNQbGFpbk9iamVjdFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5leHBvcnQge1xuICBleHRlbmQsXG4gIGRlZixcbiAgcmVtb3ZlLFxuICBoYXNPd24sXG4gIGJpbmQsXG4gIHRvQXJyYXksXG4gIGlzT2JqZWN0LFxuICBpc1BsYWluT2JqZWN0XG59IGZyb20gJy4vc2hhcmVkJ1xuXG4vKipcbiAqIENoZWNrIGlmIGEgc3RyaW5nIHN0YXJ0cyB3aXRoICQgb3IgX1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVzZXJ2ZWQgKHN0cikge1xuICBjb25zdCBjID0gKHN0ciArICcnKS5jaGFyQ29kZUF0KDApXG4gIHJldHVybiBjID09PSAweDI0IHx8IGMgPT09IDB4NUZcbn1cblxuLy8gY2FuIHdlIHVzZSBfX3Byb3RvX18/XG5leHBvcnQgY29uc3QgaGFzUHJvdG8gPSAnX19wcm90b19fJyBpbiB7fVxuXG5sZXQgX1NldFxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmlmICh0eXBlb2YgU2V0ICE9PSAndW5kZWZpbmVkJyAmJiBTZXQudG9TdHJpbmcoKS5tYXRjaCgvbmF0aXZlIGNvZGUvKSkge1xuICAvLyB1c2UgbmF0aXZlIFNldCB3aGVuIGF2YWlsYWJsZS5cbiAgX1NldCA9IFNldFxufVxuZWxzZSB7XG4gIC8vIGEgbm9uLXN0YW5kYXJkIFNldCBwb2x5ZmlsbCB0aGF0IG9ubHkgd29ya3Mgd2l0aCBwcmltaXRpdmUga2V5cy5cbiAgX1NldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldCA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgfVxuICBfU2V0LnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0W2tleV0gIT09IHVuZGVmaW5lZFxuICB9XG4gIF9TZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAoa2V5ID09IG51bGwgfHwgdGhpcy5zZXRba2V5XSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuc2V0W2tleV0gPSAxXG4gIH1cbiAgX1NldC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gIH1cbn1cblxuZXhwb3J0IHsgX1NldCB9XG5cbi8qKlxuICogUG9seWZpbGwgaW4gaU9TNyBieSBuYXRpdmUgYmVjYXVzZSB0aGUgSmF2YVNjcmlwdCBwb2x5ZmlsbCBoYXMgbWVtb3J5IHByb2JsZW0uXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5ld1NldCAoKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIC8qIGVzbGludC1kaXNhYmxlICovXG4gIGlmICh0eXBlb2YgbmF0aXZlU2V0ID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBuYXRpdmVTZXQuY3JlYXRlKClcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlICovXG4gIHJldHVybiBuZXcgX1NldCgpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgY2FjaGVkIHZlcnNpb24gb2YgYSBwdXJlIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gY2FjaGVkIChmbikge1xuICBjb25zdCBjYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgcmV0dXJuIGZ1bmN0aW9uIGNhY2hlZEZuIChzdHIpIHtcbiAgICBjb25zdCBoaXQgPSBjYWNoZVtzdHJdXG4gICAgcmV0dXJuIGhpdCB8fCAoY2FjaGVbc3RyXSA9IGZuKHN0cikpXG4gIH1cbn1cblxuLyoqXG4gKiBDYW1lbGl6ZSBhIGh5cGhlbi1kZWxtaXRlZCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmNvbnN0IGNhbWVsaXplUkUgPSAvLShcXHcpL2dcbmV4cG9ydCBjb25zdCBjYW1lbGl6ZSA9IGNhY2hlZChzdHIgPT4ge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoY2FtZWxpemVSRSwgdG9VcHBlcilcbn0pXG5cbmZ1bmN0aW9uIHRvVXBwZXIgKF8sIGMpIHtcbiAgcmV0dXJuIGMgPyBjLnRvVXBwZXJDYXNlKCkgOiAnJ1xufVxuXG4vKipcbiAqIEh5cGhlbmF0ZSBhIGNhbWVsQ2FzZSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmNvbnN0IGh5cGhlbmF0ZVJFID0gLyhbYS16XFxkXSkoW0EtWl0pL2dcbmV4cG9ydCBjb25zdCBoeXBoZW5hdGUgPSBjYWNoZWQoc3RyID0+IHtcbiAgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlKGh5cGhlbmF0ZVJFLCAnJDEtJDInKVxuICAgIC50b0xvd2VyQ2FzZSgpXG59KVxuXG5leHBvcnQgZnVuY3Rpb24gdHlwb2YgKHYpIHtcbiAgY29uc3QgcyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2KVxuICByZXR1cm4gcy5zdWJzdHJpbmcoOCwgcy5sZW5ndGggLSAxKS50b0xvd2VyQ2FzZSgpXG59XG5cbi8vIHdlZXggbmFtZSBydWxlc1xuXG5jb25zdCBXRUVYX0NPTVBPTkVOVF9SRUcgPSAvXkB3ZWV4LWNvbXBvbmVudFxcLy9cbmNvbnN0IFdFRVhfTU9EVUxFX1JFRyA9IC9eQHdlZXgtbW9kdWxlXFwvL1xuY29uc3QgTk9STUFMX01PRFVMRV9SRUcgPSAvXlxcLnsxLDJ9XFwvL1xuY29uc3QgSlNfU1VSRklYX1JFRyA9IC9cXC5qcyQvXG5cbmV4cG9ydCBjb25zdCBpc1dlZXhDb21wb25lbnQgPSBuYW1lID0+ICEhbmFtZS5tYXRjaChXRUVYX0NPTVBPTkVOVF9SRUcpXG5leHBvcnQgY29uc3QgaXNXZWV4TW9kdWxlID0gbmFtZSA9PiAhIW5hbWUubWF0Y2goV0VFWF9NT0RVTEVfUkVHKVxuZXhwb3J0IGNvbnN0IGlzTm9ybWFsTW9kdWxlID0gbmFtZSA9PiAhIW5hbWUubWF0Y2goTk9STUFMX01PRFVMRV9SRUcpXG5leHBvcnQgY29uc3QgaXNOcG1Nb2R1bGUgPSBuYW1lID0+ICFpc1dlZXhDb21wb25lbnQobmFtZSkgJiYgIWlzV2VleE1vZHVsZShuYW1lKSAmJiAhaXNOb3JtYWxNb2R1bGUobmFtZSlcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVdlZXhQcmVmaXggKHN0cikge1xuICBjb25zdCByZXN1bHQgPSBzdHIucmVwbGFjZShXRUVYX0NPTVBPTkVOVF9SRUcsICcnKS5yZXBsYWNlKFdFRVhfTU9EVUxFX1JFRywgJycpXG4gIHJldHVybiByZXN1bHRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUpTU3VyZml4IChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKEpTX1NVUkZJWF9SRUcsICcnKVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgKi9cblxuXG5pbXBvcnQgeyByZW1vdmUgfSBmcm9tICcuLi91dGlsL2luZGV4J1xuXG5sZXQgdWlkID0gMFxuXG4vKipcbiAqIEEgZGVwIGlzIGFuIG9ic2VydmFibGUgdGhhdCBjYW4gaGF2ZSBtdWx0aXBsZVxuICogZGlyZWN0aXZlcyBzdWJzY3JpYmluZyB0byBpdC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBEZXAgKCkge1xuICB0aGlzLmlkID0gdWlkKytcbiAgdGhpcy5zdWJzID0gW11cbn1cblxuLy8gdGhlIGN1cnJlbnQgdGFyZ2V0IHdhdGNoZXIgYmVpbmcgZXZhbHVhdGVkLlxuLy8gdGhpcyBpcyBnbG9iYWxseSB1bmlxdWUgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvbmx5IG9uZVxuLy8gd2F0Y2hlciBiZWluZyBldmFsdWF0ZWQgYXQgYW55IHRpbWUuXG5EZXAudGFyZ2V0ID0gbnVsbFxubGV0IHRhcmdldFN0YWNrID0gW11cblxuZXhwb3J0IGZ1bmN0aW9uIHB1c2hUYXJnZXQgKF90YXJnZXQpIHtcbiAgaWYgKERlcC50YXJnZXQpIHRhcmdldFN0YWNrLnB1c2goRGVwLnRhcmdldClcbiAgRGVwLnRhcmdldCA9IF90YXJnZXRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBvcFRhcmdldCAoKSB7XG4gIERlcC50YXJnZXQgPSB0YXJnZXRTdGFjay5wb3AoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRUYXJnZXQgKCkge1xuICBEZXAudGFyZ2V0ID0gbnVsbFxuICB0YXJnZXRTdGFjayA9IFtdXG59XG5cbi8qKlxuICogQWRkIGEgZGlyZWN0aXZlIHN1YnNjcmliZXIuXG4gKlxuICogQHBhcmFtIHtEaXJlY3RpdmV9IHN1YlxuICovXG5cbkRlcC5wcm90b3R5cGUuYWRkU3ViID0gZnVuY3Rpb24gKHN1Yikge1xuICB0aGlzLnN1YnMucHVzaChzdWIpXG59XG5cbi8qKlxuICogUmVtb3ZlIGEgZGlyZWN0aXZlIHN1YnNjcmliZXIuXG4gKlxuICogQHBhcmFtIHtEaXJlY3RpdmV9IHN1YlxuICovXG5cbkRlcC5wcm90b3R5cGUucmVtb3ZlU3ViID0gZnVuY3Rpb24gKHN1Yikge1xuICByZW1vdmUodGhpcy5zdWJzLCBzdWIpXG59XG5cbi8qKlxuICogQWRkIHNlbGYgYXMgYSBkZXBlbmRlbmN5IHRvIHRoZSB0YXJnZXQgd2F0Y2hlci5cbiAqL1xuXG5EZXAucHJvdG90eXBlLmRlcGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKERlcC50YXJnZXQpIHtcbiAgICBEZXAudGFyZ2V0LmFkZERlcCh0aGlzKVxuICB9XG59XG5cbi8qKlxuICogTm90aWZ5IGFsbCBzdWJzY3JpYmVycyBvZiBhIG5ldyB2YWx1ZS5cbiAqL1xuXG5EZXAucHJvdG90eXBlLm5vdGlmeSA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gc3RhYmxpemUgdGhlIHN1YnNjcmliZXIgbGlzdCBmaXJzdFxuICBjb25zdCBzdWJzID0gdGhpcy5zdWJzLnNsaWNlKClcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBzdWJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHN1YnNbaV0udXBkYXRlKClcbiAgfVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgKi9cblxuXG5pbXBvcnQgRGVwLCB7IHB1c2hUYXJnZXQsIHBvcFRhcmdldCB9IGZyb20gJy4vZGVwJ1xuLy8gaW1wb3J0IHsgcHVzaFdhdGNoZXIgfSBmcm9tICcuL2JhdGNoZXInXG5pbXBvcnQge1xuICByZW1vdmUsXG4gIGV4dGVuZCxcbiAgaXNPYmplY3QsXG4gIGNyZWF0ZU5ld1NldFxuICAvLyBfU2V0IGFzIFNldFxufSBmcm9tICcuLi91dGlsL2luZGV4J1xuXG5sZXQgdWlkID0gMFxuXG4vKipcbiAqIEEgd2F0Y2hlciBwYXJzZXMgYW4gZXhwcmVzc2lvbiwgY29sbGVjdHMgZGVwZW5kZW5jaWVzLFxuICogYW5kIGZpcmVzIGNhbGxiYWNrIHdoZW4gdGhlIGV4cHJlc3Npb24gdmFsdWUgY2hhbmdlcy5cbiAqIFRoaXMgaXMgdXNlZCBmb3IgYm90aCB0aGUgJHdhdGNoKCkgYXBpIGFuZCBkaXJlY3RpdmVzLlxuICpcbiAqIEBwYXJhbSB7VnVlfSB2bVxuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IGV4cE9yRm5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogICAgICAgICAgICAgICAgIC0ge0FycmF5fSBmaWx0ZXJzXG4gKiAgICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gdHdvV2F5XG4gKiAgICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gZGVlcFxuICogICAgICAgICAgICAgICAgIC0ge0Jvb2xlYW59IHVzZXJcbiAqICAgICAgICAgICAgICAgICAtIHtCb29sZWFufSBzeW5jXG4gKiAgICAgICAgICAgICAgICAgLSB7Qm9vbGVhbn0gbGF6eVxuICogICAgICAgICAgICAgICAgIC0ge0Z1bmN0aW9ufSBbcHJlUHJvY2Vzc11cbiAqICAgICAgICAgICAgICAgICAtIHtGdW5jdGlvbn0gW3Bvc3RQcm9jZXNzXVxuICogQGNvbnN0cnVjdG9yXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gV2F0Y2hlciAodm0sIGV4cE9yRm4sIGNiLCBvcHRpb25zKSB7XG4gIC8vIG1peCBpbiBvcHRpb25zXG4gIGlmIChvcHRpb25zKSB7XG4gICAgZXh0ZW5kKHRoaXMsIG9wdGlvbnMpXG4gIH1cbiAgY29uc3QgaXNGbiA9IHR5cGVvZiBleHBPckZuID09PSAnZnVuY3Rpb24nXG4gIHRoaXMudm0gPSB2bVxuICB2bS5fd2F0Y2hlcnMucHVzaCh0aGlzKVxuICB0aGlzLmV4cHJlc3Npb24gPSBleHBPckZuXG4gIHRoaXMuY2IgPSBjYlxuICB0aGlzLmlkID0gKyt1aWQgLy8gdWlkIGZvciBiYXRjaGluZ1xuICB0aGlzLmFjdGl2ZSA9IHRydWVcbiAgdGhpcy5kaXJ0eSA9IHRoaXMubGF6eSAvLyBmb3IgbGF6eSB3YXRjaGVyc1xuICB0aGlzLmRlcHMgPSBbXVxuICB0aGlzLm5ld0RlcHMgPSBbXVxuICB0aGlzLmRlcElkcyA9IGNyZWF0ZU5ld1NldCgpIC8vIG5ldyBTZXQoKVxuICB0aGlzLm5ld0RlcElkcyA9IGNyZWF0ZU5ld1NldCgpIC8vIG5ldyBTZXQoKVxuICAvLyBwYXJzZSBleHByZXNzaW9uIGZvciBnZXR0ZXJcbiAgaWYgKGlzRm4pIHtcbiAgICB0aGlzLmdldHRlciA9IGV4cE9yRm5cbiAgfVxuICB0aGlzLnZhbHVlID0gdGhpcy5sYXp5XG4gICAgPyB1bmRlZmluZWRcbiAgICA6IHRoaXMuZ2V0KClcbiAgLy8gc3RhdGUgZm9yIGF2b2lkaW5nIGZhbHNlIHRyaWdnZXJzIGZvciBkZWVwIGFuZCBBcnJheVxuICAvLyB3YXRjaGVycyBkdXJpbmcgdm0uX2RpZ2VzdCgpXG4gIHRoaXMucXVldWVkID0gdGhpcy5zaGFsbG93ID0gZmFsc2Vcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZSB0aGUgZ2V0dGVyLCBhbmQgcmUtY29sbGVjdCBkZXBlbmRlbmNpZXMuXG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICBwdXNoVGFyZ2V0KHRoaXMpXG4gIGNvbnN0IHZhbHVlID0gdGhpcy5nZXR0ZXIuY2FsbCh0aGlzLnZtLCB0aGlzLnZtKVxuICAvLyBcInRvdWNoXCIgZXZlcnkgcHJvcGVydHkgc28gdGhleSBhcmUgYWxsIHRyYWNrZWQgYXNcbiAgLy8gZGVwZW5kZW5jaWVzIGZvciBkZWVwIHdhdGNoaW5nXG4gIGlmICh0aGlzLmRlZXApIHtcbiAgICB0cmF2ZXJzZSh2YWx1ZSlcbiAgfVxuICBwb3BUYXJnZXQoKVxuICB0aGlzLmNsZWFudXBEZXBzKClcbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQWRkIGEgZGVwZW5kZW5jeSB0byB0aGlzIGRpcmVjdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge0RlcH0gZGVwXG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUuYWRkRGVwID0gZnVuY3Rpb24gKGRlcCkge1xuICBjb25zdCBpZCA9IGRlcC5pZFxuICBpZiAoIXRoaXMubmV3RGVwSWRzLmhhcyhpZCkpIHtcbiAgICB0aGlzLm5ld0RlcElkcy5hZGQoaWQpXG4gICAgdGhpcy5uZXdEZXBzLnB1c2goZGVwKVxuICAgIGlmICghdGhpcy5kZXBJZHMuaGFzKGlkKSkge1xuICAgICAgZGVwLmFkZFN1Yih0aGlzKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsZWFuIHVwIGZvciBkZXBlbmRlbmN5IGNvbGxlY3Rpb24uXG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUuY2xlYW51cERlcHMgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBpID0gdGhpcy5kZXBzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgY29uc3QgZGVwID0gdGhpcy5kZXBzW2ldXG4gICAgaWYgKCF0aGlzLm5ld0RlcElkcy5oYXMoZGVwLmlkKSkge1xuICAgICAgZGVwLnJlbW92ZVN1Yih0aGlzKVxuICAgIH1cbiAgfVxuICBsZXQgdG1wID0gdGhpcy5kZXBJZHNcbiAgdGhpcy5kZXBJZHMgPSB0aGlzLm5ld0RlcElkc1xuICB0aGlzLm5ld0RlcElkcyA9IHRtcFxuICB0aGlzLm5ld0RlcElkcy5jbGVhcigpXG4gIHRtcCA9IHRoaXMuZGVwc1xuICB0aGlzLmRlcHMgPSB0aGlzLm5ld0RlcHNcbiAgdGhpcy5uZXdEZXBzID0gdG1wXG4gIHRoaXMubmV3RGVwcy5sZW5ndGggPSAwXG59XG5cbi8qKlxuICogU3Vic2NyaWJlciBpbnRlcmZhY2UuXG4gKiBXaWxsIGJlIGNhbGxlZCB3aGVuIGEgZGVwZW5kZW5jeSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gc2hhbGxvd1xuICovXG5cbldhdGNoZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChzaGFsbG93KSB7XG4gIGlmICh0aGlzLmxhenkpIHtcbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZVxuICB9IGVsc2Uge1xuICAgIHRoaXMucnVuKClcbiAgfVxuICAvLyB9IGVsc2UgaWYgKHRoaXMuc3luYykge1xuICAvLyAgIHRoaXMucnVuKClcbiAgLy8gfSBlbHNlIHtcbiAgLy8gICAvLyBpZiBxdWV1ZWQsIG9ubHkgb3ZlcndyaXRlIHNoYWxsb3cgd2l0aCBub24tc2hhbGxvdyxcbiAgLy8gICAvLyBidXQgbm90IHRoZSBvdGhlciB3YXkgYXJvdW5kLlxuICAvLyAgIHRoaXMuc2hhbGxvdyA9IHRoaXMucXVldWVkXG4gIC8vICAgICA/IHNoYWxsb3dcbiAgLy8gICAgICAgPyB0aGlzLnNoYWxsb3dcbiAgLy8gICAgICAgOiBmYWxzZVxuICAvLyAgICAgOiAhIXNoYWxsb3dcbiAgLy8gICB0aGlzLnF1ZXVlZCA9IHRydWVcbiAgLy8gICBwdXNoV2F0Y2hlcih0aGlzKVxuICAvLyB9XG59XG5cbi8qKlxuICogQmF0Y2hlciBqb2IgaW50ZXJmYWNlLlxuICogV2lsbCBiZSBjYWxsZWQgYnkgdGhlIGJhdGNoZXIuXG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0KClcbiAgICBpZiAoXG4gICAgICB2YWx1ZSAhPT0gdGhpcy52YWx1ZSB8fFxuICAgICAgLy8gRGVlcCB3YXRjaGVycyBhbmQgd2F0Y2hlcnMgb24gT2JqZWN0L0FycmF5cyBzaG91bGQgZmlyZSBldmVuXG4gICAgICAvLyB3aGVuIHRoZSB2YWx1ZSBpcyB0aGUgc2FtZSwgYmVjYXVzZSB0aGUgdmFsdWUgbWF5XG4gICAgICAvLyBoYXZlIG11dGF0ZWQ7IGJ1dCBvbmx5IGRvIHNvIGlmIHRoaXMgaXMgYVxuICAgICAgLy8gbm9uLXNoYWxsb3cgdXBkYXRlIChjYXVzZWQgYnkgYSB2bSBkaWdlc3QpLlxuICAgICAgKChpc09iamVjdCh2YWx1ZSkgfHwgdGhpcy5kZWVwKSAmJiAhdGhpcy5zaGFsbG93KVxuICAgICkge1xuICAgICAgLy8gc2V0IG5ldyB2YWx1ZVxuICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLnZhbHVlXG4gICAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICAgIHRoaXMuY2IuY2FsbCh0aGlzLnZtLCB2YWx1ZSwgb2xkVmFsdWUpXG4gICAgfVxuICAgIHRoaXMucXVldWVkID0gdGhpcy5zaGFsbG93ID0gZmFsc2VcbiAgfVxufVxuXG4vKipcbiAqIEV2YWx1YXRlIHRoZSB2YWx1ZSBvZiB0aGUgd2F0Y2hlci5cbiAqIFRoaXMgb25seSBnZXRzIGNhbGxlZCBmb3IgbGF6eSB3YXRjaGVycy5cbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS5ldmFsdWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0KClcbiAgdGhpcy5kaXJ0eSA9IGZhbHNlXG59XG5cbi8qKlxuICogRGVwZW5kIG9uIGFsbCBkZXBzIGNvbGxlY3RlZCBieSB0aGlzIHdhdGNoZXIuXG4gKi9cblxuV2F0Y2hlci5wcm90b3R5cGUuZGVwZW5kID0gZnVuY3Rpb24gKCkge1xuICBsZXQgaSA9IHRoaXMuZGVwcy5sZW5ndGhcbiAgd2hpbGUgKGktLSkge1xuICAgIHRoaXMuZGVwc1tpXS5kZXBlbmQoKVxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIHNlbGYgZnJvbSBhbGwgZGVwZW5kZW5jaWVzJyBzdWJjcmliZXIgbGlzdC5cbiAqL1xuXG5XYXRjaGVyLnByb3RvdHlwZS50ZWFyZG93biA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgLy8gcmVtb3ZlIHNlbGYgZnJvbSB2bSdzIHdhdGNoZXIgbGlzdFxuICAgIC8vIHRoaXMgaXMgYSBzb21ld2hhdCBleHBlbnNpdmUgb3BlcmF0aW9uIHNvIHdlIHNraXAgaXRcbiAgICAvLyBpZiB0aGUgdm0gaXMgYmVpbmcgZGVzdHJveWVkIG9yIGlzIHBlcmZvcm1pbmcgYSB2LWZvclxuICAgIC8vIHJlLXJlbmRlciAodGhlIHdhdGNoZXIgbGlzdCBpcyB0aGVuIGZpbHRlcmVkIGJ5IHYtZm9yKS5cbiAgICBpZiAoIXRoaXMudm0uX2lzQmVpbmdEZXN0cm95ZWQgJiYgIXRoaXMudm0uX3ZGb3JSZW1vdmluZykge1xuICAgICAgcmVtb3ZlKHRoaXMudm0uX3dhdGNoZXJzLCB0aGlzKVxuICAgIH1cbiAgICBsZXQgaSA9IHRoaXMuZGVwcy5sZW5ndGhcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICB0aGlzLmRlcHNbaV0ucmVtb3ZlU3ViKHRoaXMpXG4gICAgfVxuICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcbiAgICB0aGlzLnZtID0gdGhpcy5jYiA9IHRoaXMudmFsdWUgPSBudWxsXG4gIH1cbn1cblxuLyoqXG4gKiBSZWNydXNpdmVseSB0cmF2ZXJzZSBhbiBvYmplY3QgdG8gZXZva2UgYWxsIGNvbnZlcnRlZFxuICogZ2V0dGVycywgc28gdGhhdCBldmVyeSBuZXN0ZWQgcHJvcGVydHkgaW5zaWRlIHRoZSBvYmplY3RcbiAqIGlzIGNvbGxlY3RlZCBhcyBhIFwiZGVlcFwiIGRlcGVuZGVuY3kuXG4gKlxuICogQHBhcmFtIHsqfSB2YWxcbiAqIEBwYXJhbSB7U2V0fSBzZWVuXG4gKi9cblxuY29uc3Qgc2Vlbk9iamVjdHMgPSBjcmVhdGVOZXdTZXQoKSAvLyBuZXcgU2V0KClcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiB0cmF2ZXJzZSAodmFsLCBzZWVuKSB7XG4gIGxldCBpLCBrZXlzLCBpc0EsIGlzT1xuICBpZiAoIXNlZW4pIHtcbiAgICBzZWVuID0gc2Vlbk9iamVjdHNcbiAgICBzZWVuLmNsZWFyKClcbiAgfVxuICBpc0EgPSBBcnJheS5pc0FycmF5KHZhbClcbiAgaXNPID0gaXNPYmplY3QodmFsKVxuICBpZiAoaXNBIHx8IGlzTykge1xuICAgIGlmICh2YWwuX19vYl9fKSB7XG4gICAgICBjb25zdCBkZXBJZCA9IHZhbC5fX29iX18uZGVwLmlkXG4gICAgICBpZiAoc2Vlbi5oYXMoZGVwSWQpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2Vlbi5hZGQoZGVwSWQpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0EpIHtcbiAgICAgIGkgPSB2YWwubGVuZ3RoXG4gICAgICB3aGlsZSAoaS0tKSB0cmF2ZXJzZSh2YWxbaV0sIHNlZW4pXG4gICAgfSBlbHNlIGlmIChpc08pIHtcbiAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh2YWwpXG4gICAgICBpID0ga2V5cy5sZW5ndGhcbiAgICAgIHdoaWxlIChpLS0pIHRyYXZlcnNlKHZhbFtrZXlzW2ldXSwgc2VlbilcbiAgICB9XG4gIH1cbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlICovXG5cblxuaW1wb3J0IHsgZGVmIH0gZnJvbSAnLi4vdXRpbC9pbmRleCdcblxuY29uc3QgYXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZVxuZXhwb3J0IGNvbnN0IGFycmF5TWV0aG9kcyA9IE9iamVjdC5jcmVhdGUoYXJyYXlQcm90bylcblxuLyoqXG4gKiBJbnRlcmNlcHQgbXV0YXRpbmcgbWV0aG9kcyBhbmQgZW1pdCBldmVudHNcbiAqL1xuXG47W1xuICAncHVzaCcsXG4gICdwb3AnLFxuICAnc2hpZnQnLFxuICAndW5zaGlmdCcsXG4gICdzcGxpY2UnLFxuICAnc29ydCcsXG4gICdyZXZlcnNlJ1xuXVxuLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAvLyBjYWNoZSBvcmlnaW5hbCBtZXRob2RcbiAgY29uc3Qgb3JpZ2luYWwgPSBhcnJheVByb3RvW21ldGhvZF1cbiAgZGVmKGFycmF5TWV0aG9kcywgbWV0aG9kLCBmdW5jdGlvbiBtdXRhdG9yICgpIHtcbiAgICAvLyBhdm9pZCBsZWFraW5nIGFyZ3VtZW50czpcbiAgICAvLyBodHRwOi8vanNwZXJmLmNvbS9jbG9zdXJlLXdpdGgtYXJndW1lbnRzXG4gICAgbGV0IGkgPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgY29uc3QgYXJncyA9IG5ldyBBcnJheShpKVxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV1cbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJncylcbiAgICBjb25zdCBvYiA9IHRoaXMuX19vYl9fXG4gICAgbGV0IGluc2VydGVkXG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgIGNhc2UgJ3B1c2gnOlxuICAgICAgICBpbnNlcnRlZCA9IGFyZ3NcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3Vuc2hpZnQnOlxuICAgICAgICBpbnNlcnRlZCA9IGFyZ3NcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3NwbGljZSc6XG4gICAgICAgIGluc2VydGVkID0gYXJncy5zbGljZSgyKVxuICAgICAgICBicmVha1xuICAgIH1cbiAgICBpZiAoaW5zZXJ0ZWQpIG9iLm9ic2VydmVBcnJheShpbnNlcnRlZClcbiAgICAvLyBub3RpZnkgY2hhbmdlXG4gICAgb2IuZGVwLm5vdGlmeSgpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9KVxufSlcblxuLyoqXG4gKiBTd2FwIHRoZSBlbGVtZW50IGF0IHRoZSBnaXZlbiBpbmRleCB3aXRoIGEgbmV3IHZhbHVlXG4gKiBhbmQgZW1pdHMgY29ycmVzcG9uZGluZyBldmVudC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKiBAcmV0dXJuIHsqfSAtIHJlcGxhY2VkIGVsZW1lbnRcbiAqL1xuXG5kZWYoXG4gIGFycmF5UHJvdG8sXG4gICckc2V0JyxcbiAgZnVuY3Rpb24gJHNldCAoaW5kZXgsIHZhbCkge1xuICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gXCJBcnJheS5wcm90b3R5cGUuJHNldFwiIGlzIG5vdCBhIHN0YW5kYXJkIEFQSSxgXG4gICAgICArIGAgaXQgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IHZlcnNpb24uYClcbiAgICBpZiAoaW5kZXggPj0gdGhpcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMubGVuZ3RoID0gaW5kZXggKyAxXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNwbGljZShpbmRleCwgMSwgdmFsKVswXVxuICB9XG4pXG5cbi8qKlxuICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIHJlbW92ZSB0aGUgZWxlbWVudCBhdCBnaXZlbiBpbmRleC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKi9cblxuZGVmKFxuICBhcnJheVByb3RvLFxuICAnJHJlbW92ZScsXG4gIGZ1bmN0aW9uICRyZW1vdmUgKGluZGV4KSB7XG4gICAgY29uc29sZS53YXJuKGBbSlMgRnJhbWV3b3JrXSBcIkFycmF5LnByb3RvdHlwZS4kcmVtb3ZlXCIgaXMgbm90IGEgc3RhbmRhcmQgQVBJLGBcbiAgICAgICsgYCBpdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgdmVyc2lvbi5gKVxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmICghdGhpcy5sZW5ndGgpIHJldHVyblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgaWYgKHR5cGVvZiBpbmRleCAhPT0gJ251bWJlcicpIHtcbiAgICAgIGluZGV4ID0gdGhpcy5pbmRleE9mKGluZGV4KVxuICAgIH1cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLnNwbGljZShpbmRleCwgMSlcbiAgICB9XG4gIH1cbilcbiIsIi8qIGVzbGludC1kaXNhYmxlICovXG5cblxuaW1wb3J0IERlcCBmcm9tICcuL2RlcCdcbmltcG9ydCB7IGFycmF5TWV0aG9kcyB9IGZyb20gJy4vYXJyYXknXG5pbXBvcnQge1xuICBkZWYsXG4gIHJlbW92ZSxcbiAgaXNPYmplY3QsXG4gIGlzUGxhaW5PYmplY3QsXG4gIGhhc1Byb3RvLFxuICBoYXNPd24sXG4gIGlzUmVzZXJ2ZWRcbn0gZnJvbSAnLi4vdXRpbC9pbmRleCdcblxuY29uc3QgYXJyYXlLZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYXJyYXlNZXRob2RzKVxuXG4vKipcbiAqIE9ic2VydmVyIGNsYXNzIHRoYXQgYXJlIGF0dGFjaGVkIHRvIGVhY2ggb2JzZXJ2ZWRcbiAqIG9iamVjdC4gT25jZSBhdHRhY2hlZCwgdGhlIG9ic2VydmVyIGNvbnZlcnRzIHRhcmdldFxuICogb2JqZWN0J3MgcHJvcGVydHkga2V5cyBpbnRvIGdldHRlci9zZXR0ZXJzIHRoYXRcbiAqIGNvbGxlY3QgZGVwZW5kZW5jaWVzIGFuZCBkaXNwYXRjaGVzIHVwZGF0ZXMuXG4gKlxuICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHZhbHVlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gT2JzZXJ2ZXIgKHZhbHVlKSB7XG4gIHRoaXMudmFsdWUgPSB2YWx1ZVxuICB0aGlzLmRlcCA9IG5ldyBEZXAoKVxuICBkZWYodmFsdWUsICdfX29iX18nLCB0aGlzKVxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBjb25zdCBhdWdtZW50ID0gaGFzUHJvdG9cbiAgICAgID8gcHJvdG9BdWdtZW50XG4gICAgICA6IGNvcHlBdWdtZW50XG4gICAgYXVnbWVudCh2YWx1ZSwgYXJyYXlNZXRob2RzLCBhcnJheUtleXMpXG4gICAgdGhpcy5vYnNlcnZlQXJyYXkodmFsdWUpXG4gIH0gZWxzZSB7XG4gICAgdGhpcy53YWxrKHZhbHVlKVxuICB9XG59XG5cbi8vIEluc3RhbmNlIG1ldGhvZHNcblxuLyoqXG4gKiBXYWxrIHRocm91Z2ggZWFjaCBwcm9wZXJ0eSBhbmQgY29udmVydCB0aGVtIGludG9cbiAqIGdldHRlci9zZXR0ZXJzLiBUaGlzIG1ldGhvZCBzaG91bGQgb25seSBiZSBjYWxsZWQgd2hlblxuICogdmFsdWUgdHlwZSBpcyBPYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICovXG5cbk9ic2VydmVyLnByb3RvdHlwZS53YWxrID0gZnVuY3Rpb24gKG9iaikge1xuICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgdGhpcy5jb252ZXJ0KGtleSwgb2JqW2tleV0pXG4gIH1cbn1cblxuLyoqXG4gKiBPYnNlcnZlIGEgbGlzdCBvZiBBcnJheSBpdGVtcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBpdGVtc1xuICovXG5cbk9ic2VydmVyLnByb3RvdHlwZS5vYnNlcnZlQXJyYXkgPSBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBpdGVtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBvYnNlcnZlKGl0ZW1zW2ldKVxuICB9XG59XG5cbi8qKlxuICogQ29udmVydCBhIHByb3BlcnR5IGludG8gZ2V0dGVyL3NldHRlciBzbyB3ZSBjYW4gZW1pdFxuICogdGhlIGV2ZW50cyB3aGVuIHRoZSBwcm9wZXJ0eSBpcyBhY2Nlc3NlZC9jaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKi9cblxuT2JzZXJ2ZXIucHJvdG90eXBlLmNvbnZlcnQgPSBmdW5jdGlvbiAoa2V5LCB2YWwpIHtcbiAgZGVmaW5lUmVhY3RpdmUodGhpcy52YWx1ZSwga2V5LCB2YWwpXG59XG5cbi8qKlxuICogQWRkIGFuIG93bmVyIHZtLCBzbyB0aGF0IHdoZW4gJHNldC8kZGVsZXRlIG11dGF0aW9uc1xuICogaGFwcGVuIHdlIGNhbiBub3RpZnkgb3duZXIgdm1zIHRvIHByb3h5IHRoZSBrZXlzIGFuZFxuICogZGlnZXN0IHRoZSB3YXRjaGVycy4gVGhpcyBpcyBvbmx5IGNhbGxlZCB3aGVuIHRoZSBvYmplY3RcbiAqIGlzIG9ic2VydmVkIGFzIGFuIGluc3RhbmNlJ3Mgcm9vdCAkZGF0YS5cbiAqXG4gKiBAcGFyYW0ge1Z1ZX0gdm1cbiAqL1xuXG5PYnNlcnZlci5wcm90b3R5cGUuYWRkVm0gPSBmdW5jdGlvbiAodm0pIHtcbiAgKHRoaXMudm1zIHx8ICh0aGlzLnZtcyA9IFtdKSkucHVzaCh2bSlcbn1cblxuLyoqXG4gKiBSZW1vdmUgYW4gb3duZXIgdm0uIFRoaXMgaXMgY2FsbGVkIHdoZW4gdGhlIG9iamVjdCBpc1xuICogc3dhcHBlZCBvdXQgYXMgYW4gaW5zdGFuY2UncyAkZGF0YSBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtWdWV9IHZtXG4gKi9cblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbk9ic2VydmVyLnByb3RvdHlwZS5yZW1vdmVWbSA9IGZ1bmN0aW9uICh2bSkge1xuICByZW1vdmUodGhpcy52bXMsIHZtKVxufVxuXG4vLyBoZWxwZXJzXG5cbi8qKlxuICogQXVnbWVudCBhbiB0YXJnZXQgT2JqZWN0IG9yIEFycmF5IGJ5IGludGVyY2VwdGluZ1xuICogdGhlIHByb3RvdHlwZSBjaGFpbiB1c2luZyBfX3Byb3RvX19cbiAqXG4gKiBAcGFyYW0ge09iamVjdHxBcnJheX0gdGFyZ2V0XG4gKiBAcGFyYW0ge09iamVjdH0gc3JjXG4gKi9cblxuZnVuY3Rpb24gcHJvdG9BdWdtZW50ICh0YXJnZXQsIHNyYykge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuICB0YXJnZXQuX19wcm90b19fID0gc3JjXG4gIC8qIGVzbGludC1lbmFibGUgbm8tcHJvdG8gKi9cbn1cblxuLyoqXG4gKiBBdWdtZW50IGFuIHRhcmdldCBPYmplY3Qgb3IgQXJyYXkgYnkgZGVmaW5pbmdcbiAqIGhpZGRlbiBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm90b1xuICovXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiBjb3B5QXVnbWVudCAodGFyZ2V0LCBzcmMsIGtleXMpIHtcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGtleXNbaV1cbiAgICBkZWYodGFyZ2V0LCBrZXksIHNyY1trZXldKVxuICB9XG59XG5cbi8qKlxuICogQXR0ZW1wdCB0byBjcmVhdGUgYW4gb2JzZXJ2ZXIgaW5zdGFuY2UgZm9yIGEgdmFsdWUsXG4gKiByZXR1cm5zIHRoZSBuZXcgb2JzZXJ2ZXIgaWYgc3VjY2Vzc2Z1bGx5IG9ic2VydmVkLFxuICogb3IgdGhlIGV4aXN0aW5nIG9ic2VydmVyIGlmIHRoZSB2YWx1ZSBhbHJlYWR5IGhhcyBvbmUuXG4gKlxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICogQHBhcmFtIHtWdWV9IFt2bV1cbiAqIEByZXR1cm4ge09ic2VydmVyfHVuZGVmaW5lZH1cbiAqIEBzdGF0aWNcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gb2JzZXJ2ZSAodmFsdWUsIHZtKSB7XG4gIGlmICghaXNPYmplY3QodmFsdWUpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgbGV0IG9iXG4gIGlmIChoYXNPd24odmFsdWUsICdfX29iX18nKSAmJiB2YWx1ZS5fX29iX18gaW5zdGFuY2VvZiBPYnNlcnZlcikge1xuICAgIG9iID0gdmFsdWUuX19vYl9fXG4gIH0gZWxzZSBpZiAoXG4gICAgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IGlzUGxhaW5PYmplY3QodmFsdWUpKSAmJlxuICAgIE9iamVjdC5pc0V4dGVuc2libGUodmFsdWUpICYmXG4gICAgIXZhbHVlLl9pc1Z1ZVxuICApIHtcbiAgICBvYiA9IG5ldyBPYnNlcnZlcih2YWx1ZSlcbiAgfVxuICBpZiAob2IgJiYgdm0pIHtcbiAgICBvYi5hZGRWbSh2bSlcbiAgfVxuICByZXR1cm4gb2Jcbn1cblxuLyoqXG4gKiBEZWZpbmUgYSByZWFjdGl2ZSBwcm9wZXJ0eSBvbiBhbiBPYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHsqfSB2YWxcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lUmVhY3RpdmUgKG9iaiwga2V5LCB2YWwpIHtcbiAgY29uc3QgZGVwID0gbmV3IERlcCgpXG5cbiAgY29uc3QgcHJvcGVydHkgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KVxuICBpZiAocHJvcGVydHkgJiYgcHJvcGVydHkuY29uZmlndXJhYmxlID09PSBmYWxzZSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy8gY2F0ZXIgZm9yIHByZS1kZWZpbmVkIGdldHRlci9zZXR0ZXJzXG4gIGNvbnN0IGdldHRlciA9IHByb3BlcnR5ICYmIHByb3BlcnR5LmdldFxuICBjb25zdCBzZXR0ZXIgPSBwcm9wZXJ0eSAmJiBwcm9wZXJ0eS5zZXRcblxuICBsZXQgY2hpbGRPYiA9IG9ic2VydmUodmFsKVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBnZXQ6IGZ1bmN0aW9uIHJlYWN0aXZlR2V0dGVyICgpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0dGVyID8gZ2V0dGVyLmNhbGwob2JqKSA6IHZhbFxuICAgICAgaWYgKERlcC50YXJnZXQpIHtcbiAgICAgICAgZGVwLmRlcGVuZCgpXG4gICAgICAgIGlmIChjaGlsZE9iKSB7XG4gICAgICAgICAgY2hpbGRPYi5kZXAuZGVwZW5kKClcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICBmb3IgKGxldCBlLCBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgZSA9IHZhbHVlW2ldXG4gICAgICAgICAgICBlICYmIGUuX19vYl9fICYmIGUuX19vYl9fLmRlcC5kZXBlbmQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHJlYWN0aXZlU2V0dGVyIChuZXdWYWwpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0dGVyID8gZ2V0dGVyLmNhbGwob2JqKSA6IHZhbFxuICAgICAgaWYgKG5ld1ZhbCA9PT0gdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBpZiAoc2V0dGVyKSB7XG4gICAgICAgIHNldHRlci5jYWxsKG9iaiwgbmV3VmFsKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsID0gbmV3VmFsXG4gICAgICB9XG4gICAgICBjaGlsZE9iID0gb2JzZXJ2ZShuZXdWYWwpXG4gICAgICBkZXAubm90aWZ5KClcbiAgICB9XG4gIH0pXG59XG5cbi8qKlxuICogU2V0IGEgcHJvcGVydHkgb24gYW4gb2JqZWN0LiBBZGRzIHRoZSBuZXcgcHJvcGVydHkgYW5kXG4gKiB0cmlnZ2VycyBjaGFuZ2Ugbm90aWZpY2F0aW9uIGlmIHRoZSBwcm9wZXJ0eSBkb2Vzbid0XG4gKiBhbHJlYWR5IGV4aXN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7Kn0gdmFsXG4gKiBAcHVibGljXG4gKi9cblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXQgKG9iaiwga2V5LCB2YWwpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgIHJldHVybiBvYmouc3BsaWNlKGtleSwgMSwgdmFsKVxuICB9XG4gIGlmIChoYXNPd24ob2JqLCBrZXkpKSB7XG4gICAgb2JqW2tleV0gPSB2YWxcbiAgICByZXR1cm5cbiAgfVxuICBpZiAob2JqLl9pc1Z1ZSkge1xuICAgIHNldChvYmouX2RhdGEsIGtleSwgdmFsKVxuICAgIHJldHVyblxuICB9XG4gIGNvbnN0IG9iID0gb2JqLl9fb2JfX1xuICBpZiAoIW9iKSB7XG4gICAgb2JqW2tleV0gPSB2YWxcbiAgICByZXR1cm5cbiAgfVxuICBvYi5jb252ZXJ0KGtleSwgdmFsKVxuICBvYi5kZXAubm90aWZ5KClcbiAgaWYgKG9iLnZtcykge1xuICAgIGxldCBpID0gb2Iudm1zLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZtID0gb2Iudm1zW2ldXG4gICAgICBwcm94eSh2bSwga2V5KVxuICAgICAgLy8gdm0uJGZvcmNlVXBkYXRlKClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG4vKipcbiAqIERlbGV0ZSBhIHByb3BlcnR5IGFuZCB0cmlnZ2VyIGNoYW5nZSBpZiBuZWNlc3NhcnkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICovXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5leHBvcnQgZnVuY3Rpb24gZGVsIChvYmosIGtleSkge1xuICBpZiAoIWhhc093bihvYmosIGtleSkpIHtcbiAgICByZXR1cm5cbiAgfVxuICBkZWxldGUgb2JqW2tleV1cbiAgY29uc3Qgb2IgPSBvYmouX19vYl9fXG5cbiAgaWYgKCFvYikge1xuICAgIGlmIChvYmouX2lzVnVlKSB7XG4gICAgICBkZWxldGUgb2JqLl9kYXRhW2tleV1cbiAgICAgIC8vIG9iai4kZm9yY2VVcGRhdGUoKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBvYi5kZXAubm90aWZ5KClcbiAgaWYgKG9iLnZtcykge1xuICAgIGxldCBpID0gb2Iudm1zLmxlbmd0aFxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGNvbnN0IHZtID0gb2Iudm1zW2ldXG4gICAgICB1bnByb3h5KHZtLCBrZXkpXG4gICAgICAvLyB2bS4kZm9yY2VVcGRhdGUoKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBLRVlfV09SRFMgPSBbJyRpbmRleCcsICckdmFsdWUnLCAnJGV2ZW50J11cbmV4cG9ydCBmdW5jdGlvbiBwcm94eSAodm0sIGtleSkge1xuICBpZiAoS0VZX1dPUkRTLmluZGV4T2Yoa2V5KSA+IC0xIHx8ICFpc1Jlc2VydmVkKGtleSkpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodm0sIGtleSwge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24gcHJveHlHZXR0ZXIgKCkge1xuICAgICAgICByZXR1cm4gdm0uX2RhdGFba2V5XVxuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24gcHJveHlTZXR0ZXIgKHZhbCkge1xuICAgICAgICB2bS5fZGF0YVtrZXldID0gdmFsXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVucHJveHkgKHZtLCBrZXkpIHtcbiAgaWYgKCFpc1Jlc2VydmVkKGtleSkpIHtcbiAgICBkZWxldGUgdm1ba2V5XVxuICB9XG59XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuXG5cbmltcG9ydCBXYXRjaGVyIGZyb20gJy4vd2F0Y2hlcidcbmltcG9ydCBEZXAgZnJvbSAnLi9kZXAnXG5pbXBvcnQge1xuICBvYnNlcnZlLFxuICBwcm94eSxcbiAgdW5wcm94eVxufSBmcm9tICcuL29ic2VydmVyJ1xuaW1wb3J0IHtcbiAgaXNQbGFpbk9iamVjdCxcbiAgYmluZFxufSBmcm9tICcuLi91dGlsL2luZGV4J1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFN0YXRlICh2bSkge1xuICB2bS5fd2F0Y2hlcnMgPSBbXVxuICBpbml0RGF0YSh2bSlcbiAgaW5pdENvbXB1dGVkKHZtKVxuICBpbml0TWV0aG9kcyh2bSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXREYXRhICh2bSkge1xuICBsZXQgZGF0YSA9IHZtLl9kYXRhXG5cbiAgaWYgKCFpc1BsYWluT2JqZWN0KGRhdGEpKSB7XG4gICAgZGF0YSA9IHt9XG4gIH1cbiAgLy8gcHJveHkgZGF0YSBvbiBpbnN0YW5jZVxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZGF0YSlcbiAgbGV0IGkgPSBrZXlzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgcHJveHkodm0sIGtleXNbaV0pXG4gIH1cbiAgLy8gb2JzZXJ2ZSBkYXRhXG4gIG9ic2VydmUoZGF0YSwgdm0pXG59XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiBub29wICgpIHtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRDb21wdXRlZCAodm0pIHtcbiAgY29uc3QgY29tcHV0ZWQgPSB2bS5fY29tcHV0ZWRcbiAgaWYgKGNvbXB1dGVkKSB7XG4gICAgZm9yIChsZXQga2V5IGluIGNvbXB1dGVkKSB7XG4gICAgICBjb25zdCB1c2VyRGVmID0gY29tcHV0ZWRba2V5XVxuICAgICAgY29uc3QgZGVmID0ge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgdXNlckRlZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBkZWYuZ2V0ID0gbWFrZUNvbXB1dGVkR2V0dGVyKHVzZXJEZWYsIHZtKVxuICAgICAgICBkZWYuc2V0ID0gbm9vcFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVmLmdldCA9IHVzZXJEZWYuZ2V0XG4gICAgICAgICAgPyB1c2VyRGVmLmNhY2hlICE9PSBmYWxzZVxuICAgICAgICAgICAgPyBtYWtlQ29tcHV0ZWRHZXR0ZXIodXNlckRlZi5nZXQsIHZtKVxuICAgICAgICAgICAgOiBiaW5kKHVzZXJEZWYuZ2V0LCB2bSlcbiAgICAgICAgICA6IG5vb3BcbiAgICAgICAgZGVmLnNldCA9IHVzZXJEZWYuc2V0XG4gICAgICAgICAgPyBiaW5kKHVzZXJEZWYuc2V0LCB2bSlcbiAgICAgICAgICA6IG5vb3BcbiAgICAgIH1cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bSwga2V5LCBkZWYpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VDb21wdXRlZEdldHRlciAoZ2V0dGVyLCBvd25lcikge1xuICBjb25zdCB3YXRjaGVyID0gbmV3IFdhdGNoZXIob3duZXIsIGdldHRlciwgbnVsbCwge1xuICAgIGxhenk6IHRydWVcbiAgfSlcbiAgcmV0dXJuIGZ1bmN0aW9uIGNvbXB1dGVkR2V0dGVyICgpIHtcbiAgICBpZiAod2F0Y2hlci5kaXJ0eSkge1xuICAgICAgd2F0Y2hlci5ldmFsdWF0ZSgpXG4gICAgfVxuICAgIGlmIChEZXAudGFyZ2V0KSB7XG4gICAgICB3YXRjaGVyLmRlcGVuZCgpXG4gICAgfVxuICAgIHJldHVybiB3YXRjaGVyLnZhbHVlXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRNZXRob2RzICh2bSkge1xuICBjb25zdCBtZXRob2RzID0gdm0uX21ldGhvZHNcbiAgaWYgKG1ldGhvZHMpIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gbWV0aG9kcykge1xuICAgICAgdm1ba2V5XSA9IG1ldGhvZHNba2V5XVxuICAgIH1cbiAgfVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vLyBAdG9kbzogSXQgc2hvdWxkIGJlIHJlZ2lzdGVyZWQgYnkgbmF0aXZlIGZyb20gYHJlZ2lzdGVyQ29tcG9uZW50cygpYC5cblxuZXhwb3J0IGRlZmF1bHQge1xuICBuYXRpdmVDb21wb25lbnRNYXA6IHtcbiAgICB0ZXh0OiB0cnVlLFxuICAgIGltYWdlOiB0cnVlLFxuICAgIGNvbnRhaW5lcjogdHJ1ZSxcbiAgICBzbGlkZXI6IHtcbiAgICAgIHR5cGU6ICdzbGlkZXInLFxuICAgICAgYXBwZW5kOiAndHJlZSdcbiAgICB9LFxuICAgIGNlbGw6IHtcbiAgICAgIHR5cGU6ICdjZWxsJyxcbiAgICAgIGFwcGVuZDogJ3RyZWUnXG4gICAgfVxuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogRGlyZWN0aXZlIFBhcnNlclxuICovXG5cbmltcG9ydCB7IGJpbmQsIHR5cG9mIH0gZnJvbSAnLi4vdXRpbC9pbmRleCdcbmltcG9ydCBXYXRjaGVyIGZyb20gJy4uL2NvcmUvd2F0Y2hlcidcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuXG5jb25zdCB7IG5hdGl2ZUNvbXBvbmVudE1hcCB9ID0gY29uZmlnXG5cbmNvbnN0IFNFVFRFUlMgPSB7XG4gIGF0dHI6ICdzZXRBdHRyJyxcbiAgc3R5bGU6ICdzZXRTdHlsZScsXG4gIGV2ZW50OiAnYWRkRXZlbnQnXG59XG5cbi8qKlxuICogYXBwbHkgdGhlIG5hdGl2ZSBjb21wb25lbnQncyBvcHRpb25zKHNwZWNpZmllZCBieSB0ZW1wbGF0ZS50eXBlKVxuICogdG8gdGhlIHRlbXBsYXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseU5haXR2ZUNvbXBvbmVudE9wdGlvbnMgKHRlbXBsYXRlKSB7XG4gIGNvbnN0IHsgdHlwZSB9ID0gdGVtcGxhdGVcbiAgY29uc3Qgb3B0aW9ucyA9IG5hdGl2ZUNvbXBvbmVudE1hcFt0eXBlXVxuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvcHRpb25zKSB7XG4gICAgICBpZiAodGVtcGxhdGVba2V5XSA9PSBudWxsKSB7XG4gICAgICAgIHRlbXBsYXRlW2tleV0gPSBvcHRpb25zW2tleV1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHR5cG9mKHRlbXBsYXRlW2tleV0pID09PSAnb2JqZWN0JyAmJlxuICAgICAgICB0eXBvZihvcHRpb25zW2tleV0pID09PSAnb2JqZWN0Jykge1xuICAgICAgICBmb3IgKGNvbnN0IHN1YmtleSBpbiBvcHRpb25zW2tleV0pIHtcbiAgICAgICAgICBpZiAodGVtcGxhdGVba2V5XVtzdWJrZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIHRlbXBsYXRlW2tleV1bc3Via2V5XSA9IG9wdGlvbnNba2V5XVtzdWJrZXldXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogYmluZCBhbGwgaWQsIGF0dHIsIGNsYXNzbmFtZXMsIHN0eWxlLCBldmVudHMgdG8gYW4gZWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZEVsZW1lbnQgKHZtLCBlbCwgdGVtcGxhdGUpIHtcbiAgc2V0SWQodm0sIGVsLCB0ZW1wbGF0ZS5pZCwgdm0pXG4gIHNldEF0dHIodm0sIGVsLCB0ZW1wbGF0ZS5hdHRyKVxuICBzZXRDbGFzcyh2bSwgZWwsIHRlbXBsYXRlLmNsYXNzTGlzdClcbiAgc2V0U3R5bGUodm0sIGVsLCB0ZW1wbGF0ZS5zdHlsZSlcbiAgYmluZEV2ZW50cyh2bSwgZWwsIHRlbXBsYXRlLmV2ZW50cylcbn1cblxuLyoqXG4gKiBiaW5kIGFsbCBwcm9wcyB0byBzdWIgdm0gYW5kIGJpbmQgYWxsIHN0eWxlLCBldmVudHMgdG8gdGhlIHJvb3QgZWxlbWVudFxuICogb2YgdGhlIHN1YiB2bSBpZiBpdCBkb2Vzbid0IGhhdmUgYSByZXBsYWNlZCBtdWx0aS1ub2RlIGZyYWdtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kU3ViVm0gKHZtLCBzdWJWbSwgdGVtcGxhdGUsIHJlcGVhdEl0ZW0pIHtcbiAgc3ViVm0gPSBzdWJWbSB8fCB7fVxuICB0ZW1wbGF0ZSA9IHRlbXBsYXRlIHx8IHt9XG5cbiAgY29uc3Qgb3B0aW9ucyA9IHN1YlZtLl9vcHRpb25zIHx8IHt9XG5cbiAgLy8gYmluZCBwcm9wc1xuICBsZXQgcHJvcHMgPSBvcHRpb25zLnByb3BzXG5cbiAgaWYgKEFycmF5LmlzQXJyYXkocHJvcHMpKSB7XG4gICAgcHJvcHMgPSBwcm9wcy5yZWR1Y2UoKHJlc3VsdCwgdmFsdWUpID0+IHtcbiAgICAgIHJlc3VsdFt2YWx1ZV0gPSB0cnVlXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSwge30pXG4gIH1cblxuICBtZXJnZVByb3BzKHJlcGVhdEl0ZW0sIHByb3BzLCB2bSwgc3ViVm0pXG4gIG1lcmdlUHJvcHModGVtcGxhdGUuYXR0ciwgcHJvcHMsIHZtLCBzdWJWbSlcbn1cblxuLyoqXG4gKiBtZXJnZSBjbGFzcyBhbmQgc3R5bGVzIGZyb20gdm0gdG8gc3ViIHZtLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZFN1YlZtQWZ0ZXJJbml0aWFsaXplZCAodm0sIHN1YlZtLCB0ZW1wbGF0ZSwgdGFyZ2V0ID0ge30pIHtcbiAgbWVyZ2VDbGFzc1N0eWxlKHRlbXBsYXRlLmNsYXNzTGlzdCwgdm0sIHN1YlZtKVxuICBtZXJnZVN0eWxlKHRlbXBsYXRlLnN0eWxlLCB2bSwgc3ViVm0pXG5cbiAgLy8gYmluZCBzdWJWbSB0byB0aGUgdGFyZ2V0IGVsZW1lbnRcbiAgaWYgKHRhcmdldC5jaGlsZHJlbikge1xuICAgIHRhcmdldC5jaGlsZHJlblt0YXJnZXQuY2hpbGRyZW4ubGVuZ3RoIC0gMV0uX3ZtID0gc3ViVm1cbiAgfVxuICBlbHNlIHtcbiAgICB0YXJnZXQuX3ZtID0gc3ViVm1cbiAgfVxufVxuXG4vKipcbiAqIEJpbmQgcHJvcHMgZnJvbSB2bSB0byBzdWIgdm0gYW5kIHdhdGNoIHRoZWlyIHVwZGF0ZXMuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlUHJvcHMgKHRhcmdldCwgcHJvcHMsIHZtLCBzdWJWbSkge1xuICBpZiAoIXRhcmdldCkge1xuICAgIHJldHVyblxuICB9XG4gIGZvciAoY29uc3Qga2V5IGluIHRhcmdldCkge1xuICAgIGlmICghcHJvcHMgfHwgcHJvcHNba2V5XSkge1xuICAgICAgY29uc3QgdmFsdWUgPSB0YXJnZXRba2V5XVxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjb25zdCByZXR1cm5WYWx1ZSA9IHdhdGNoKHZtLCB2YWx1ZSwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICBzdWJWbVtrZXldID0gdlxuICAgICAgICB9KVxuICAgICAgICBzdWJWbVtrZXldID0gcmV0dXJuVmFsdWVcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBzdWJWbVtrZXldID0gdmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCaW5kIHN0eWxlIGZyb20gdm0gdG8gc3ViIHZtIGFuZCB3YXRjaCB0aGVpciB1cGRhdGVzLlxuICovXG5mdW5jdGlvbiBtZXJnZVN0eWxlICh0YXJnZXQsIHZtLCBzdWJWbSkge1xuICBmb3IgKGNvbnN0IGtleSBpbiB0YXJnZXQpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRhcmdldFtrZXldXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc3QgcmV0dXJuVmFsdWUgPSB3YXRjaCh2bSwgdmFsdWUsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIGlmIChzdWJWbS5fcm9vdEVsKSB7XG4gICAgICAgICAgc3ViVm0uX3Jvb3RFbC5zZXRTdHlsZShrZXksIHYpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBzdWJWbS5fcm9vdEVsLnNldFN0eWxlKGtleSwgcmV0dXJuVmFsdWUpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHN1YlZtLl9yb290RWwpIHtcbiAgICAgICAgc3ViVm0uX3Jvb3RFbC5zZXRTdHlsZShrZXksIHZhbHVlKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJpbmQgY2xhc3MgJiBzdHlsZSBmcm9tIHZtIHRvIHN1YiB2bSBhbmQgd2F0Y2ggdGhlaXIgdXBkYXRlcy5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VDbGFzc1N0eWxlICh0YXJnZXQsIHZtLCBzdWJWbSkge1xuICBjb25zdCBjc3MgPSB2bS5fb3B0aW9ucyAmJiB2bS5fb3B0aW9ucy5zdHlsZSB8fCB7fVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoIXN1YlZtLl9yb290RWwpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IGNsYXNzTmFtZSA9ICdAb3JpZ2luYWxSb290RWwnXG4gIGNzc1tjbGFzc05hbWVdID0gc3ViVm0uX3Jvb3RFbC5jbGFzc1N0eWxlXG5cbiAgZnVuY3Rpb24gYWRkQ2xhc3NOYW1lIChsaXN0LCBuYW1lKSB7XG4gICAgaWYgKHR5cG9mKGxpc3QpID09PSAnYXJyYXknKSB7XG4gICAgICBsaXN0LnVuc2hpZnQobmFtZSlcbiAgICB9XG4gIH1cblxuICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHZhbHVlID0gd2F0Y2godm0sIHRhcmdldCwgdiA9PiB7XG4gICAgICBhZGRDbGFzc05hbWUodiwgY2xhc3NOYW1lKVxuICAgICAgc2V0Q2xhc3NTdHlsZShzdWJWbS5fcm9vdEVsLCBjc3MsIHYpXG4gICAgfSlcbiAgICBhZGRDbGFzc05hbWUodmFsdWUsIGNsYXNzTmFtZSlcbiAgICBzZXRDbGFzc1N0eWxlKHN1YlZtLl9yb290RWwsIGNzcywgdmFsdWUpXG4gIH1cbiAgZWxzZSBpZiAodGFyZ2V0ICE9IG51bGwpIHtcbiAgICBhZGRDbGFzc05hbWUodGFyZ2V0LCBjbGFzc05hbWUpXG4gICAgc2V0Q2xhc3NTdHlsZShzdWJWbS5fcm9vdEVsLCBjc3MsIHRhcmdldClcbiAgfVxufVxuXG4vKipcbiAqIGJpbmQgaWQgdG8gYW4gZWxlbWVudFxuICogZWFjaCBpZCBpcyB1bmlxdWUgaW4gYSB3aG9sZSB2bVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SWQgKHZtLCBlbCwgaWQsIHRhcmdldCkge1xuICBjb25zdCBtYXAgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMobWFwLCB7XG4gICAgdm06IHtcbiAgICAgIHZhbHVlOiB0YXJnZXQsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgfSxcbiAgICBlbDoge1xuICAgICAgZ2V0OiAoKSA9PiBlbCB8fCB0YXJnZXQuX3Jvb3RFbCxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2VcbiAgICB9XG4gIH0pXG5cbiAgaWYgKHR5cGVvZiBpZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSBpZFxuICAgIGlkID0gaGFuZGxlci5jYWxsKHZtKVxuICAgIGlmIChpZCB8fCBpZCA9PT0gMCkge1xuICAgICAgdm0uX2lkc1tpZF0gPSBtYXBcbiAgICB9XG4gICAgd2F0Y2godm0sIGhhbmRsZXIsIChuZXdJZCkgPT4ge1xuICAgICAgaWYgKG5ld0lkKSB7XG4gICAgICAgIHZtLl9pZHNbbmV3SWRdID0gbWFwXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBlbHNlIGlmIChpZCAmJiB0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgdm0uX2lkc1tpZF0gPSBtYXBcbiAgfVxufVxuXG4vKipcbiAqIGJpbmQgYXR0ciB0byBhbiBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIHNldEF0dHIgKHZtLCBlbCwgYXR0cikge1xuICBiaW5kRGlyKHZtLCBlbCwgJ2F0dHInLCBhdHRyKVxufVxuXG5mdW5jdGlvbiBzZXRDbGFzc1N0eWxlIChlbCwgY3NzLCBjbGFzc0xpc3QpIHtcbiAgaWYgKHR5cGVvZiBjbGFzc0xpc3QgPT09ICdzdHJpbmcnKSB7XG4gICAgY2xhc3NMaXN0ID0gY2xhc3NMaXN0LnNwbGl0KC9cXHMrLylcbiAgfVxuICBjbGFzc0xpc3QuZm9yRWFjaCgobmFtZSwgaSkgPT4ge1xuICAgIGNsYXNzTGlzdC5zcGxpY2UoaSwgMSwgLi4ubmFtZS5zcGxpdCgvXFxzKy8pKVxuICB9KVxuICBjb25zdCBjbGFzc1N0eWxlID0ge31cbiAgY29uc3QgbGVuZ3RoID0gY2xhc3NMaXN0Lmxlbmd0aFxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBzdHlsZSA9IGNzc1tjbGFzc0xpc3RbaV1dXG4gICAgaWYgKHN0eWxlKSB7XG4gICAgICBPYmplY3Qua2V5cyhzdHlsZSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGNsYXNzU3R5bGVba2V5XSA9IHN0eWxlW2tleV1cbiAgICAgIH0pXG4gICAgfVxuICB9XG4gIGVsLnNldENsYXNzU3R5bGUoY2xhc3NTdHlsZSlcbn1cblxuLyoqXG4gKiBiaW5kIGNsYXNzbmFtZXMgdG8gYW4gZWxlbWVudFxuICovXG5mdW5jdGlvbiBzZXRDbGFzcyAodm0sIGVsLCBjbGFzc0xpc3QpIHtcbiAgaWYgKHR5cGVvZiBjbGFzc0xpc3QgIT09ICdmdW5jdGlvbicgJiYgIUFycmF5LmlzQXJyYXkoY2xhc3NMaXN0KSkge1xuICAgIHJldHVyblxuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KGNsYXNzTGlzdCkgJiYgIWNsYXNzTGlzdC5sZW5ndGgpIHtcbiAgICBlbC5zZXRDbGFzc1N0eWxlKHt9KVxuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3Qgc3R5bGUgPSB2bS5fb3B0aW9ucyAmJiB2bS5fb3B0aW9ucy5zdHlsZSB8fCB7fVxuICBpZiAodHlwZW9mIGNsYXNzTGlzdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHZhbHVlID0gd2F0Y2godm0sIGNsYXNzTGlzdCwgdiA9PiB7XG4gICAgICBzZXRDbGFzc1N0eWxlKGVsLCBzdHlsZSwgdilcbiAgICB9KVxuICAgIHNldENsYXNzU3R5bGUoZWwsIHN0eWxlLCB2YWx1ZSlcbiAgfVxuICBlbHNlIHtcbiAgICBzZXRDbGFzc1N0eWxlKGVsLCBzdHlsZSwgY2xhc3NMaXN0KVxuICB9XG59XG5cbi8qKlxuICogYmluZCBzdHlsZSB0byBhbiBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIHNldFN0eWxlICh2bSwgZWwsIHN0eWxlKSB7XG4gIGJpbmREaXIodm0sIGVsLCAnc3R5bGUnLCBzdHlsZSlcbn1cblxuLyoqXG4gKiBhZGQgYW4gZXZlbnQgdHlwZSBhbmQgaGFuZGxlciB0byBhbiBlbGVtZW50IGFuZCBnZW5lcmF0ZSBhIGRvbSB1cGRhdGVcbiAqL1xuZnVuY3Rpb24gc2V0RXZlbnQgKHZtLCBlbCwgdHlwZSwgaGFuZGxlcikge1xuICBlbC5hZGRFdmVudCh0eXBlLCBiaW5kKGhhbmRsZXIsIHZtKSlcbn1cblxuLyoqXG4gKiBhZGQgYWxsIGV2ZW50cyBvZiBhbiBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIGJpbmRFdmVudHMgKHZtLCBlbCwgZXZlbnRzKSB7XG4gIGlmICghZXZlbnRzKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGV2ZW50cylcbiAgbGV0IGkgPSBrZXlzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgY29uc3Qga2V5ID0ga2V5c1tpXVxuICAgIGxldCBoYW5kbGVyID0gZXZlbnRzW2tleV1cbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICBoYW5kbGVyID0gdm1baGFuZGxlcl1cbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gVGhlIGV2ZW50IGhhbmRsZXIgXCIke2hhbmRsZXJ9XCIgaXMgbm90IGRlZmluZWQuYClcbiAgICAgIH1cbiAgICB9XG4gICAgc2V0RXZlbnQodm0sIGVsLCBrZXksIGhhbmRsZXIpXG4gIH1cbn1cblxuLyoqXG4gKiBzZXQgYSBzZXJpZXMgb2YgbWVtYmVycyBhcyBhIGtpbmQgb2YgYW4gZWxlbWVudFxuICogZm9yIGV4YW1wbGU6IHN0eWxlLCBhdHRyLCAuLi5cbiAqIGlmIHRoZSB2YWx1ZSBpcyBhIGZ1bmN0aW9uIHRoZW4gYmluZCB0aGUgZGF0YSBjaGFuZ2VzXG4gKi9cbmZ1bmN0aW9uIGJpbmREaXIgKHZtLCBlbCwgbmFtZSwgZGF0YSkge1xuICBpZiAoIWRhdGEpIHtcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZGF0YSlcbiAgbGV0IGkgPSBrZXlzLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgY29uc3Qga2V5ID0ga2V5c1tpXVxuICAgIGNvbnN0IHZhbHVlID0gZGF0YVtrZXldXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYmluZEtleSh2bSwgZWwsIG5hbWUsIGtleSwgdmFsdWUpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZWxbU0VUVEVSU1tuYW1lXV0oa2V5LCB2YWx1ZSlcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBiaW5kIGRhdGEgY2hhbmdlcyB0byBhIGNlcnRhaW4ga2V5IHRvIGEgbmFtZSBzZXJpZXMgaW4gYW4gZWxlbWVudFxuICovXG5mdW5jdGlvbiBiaW5kS2V5ICh2bSwgZWwsIG5hbWUsIGtleSwgY2FsYykge1xuICBjb25zdCBtZXRob2ROYW1lID0gU0VUVEVSU1tuYW1lXVxuICAvLyB3YXRjaCB0aGUgY2FsYywgYW5kIHJldHVybnMgYSB2YWx1ZSBieSBjYWxjLmNhbGwoKVxuICBjb25zdCB2YWx1ZSA9IHdhdGNoKHZtLCBjYWxjLCAodmFsdWUpID0+IHtcbiAgICBmdW5jdGlvbiBoYW5kbGVyICgpIHtcbiAgICAgIGVsW21ldGhvZE5hbWVdKGtleSwgdmFsdWUpXG4gICAgfVxuICAgIGNvbnN0IGRpZmZlciA9IHZtICYmIHZtLl9hcHAgJiYgdm0uX2FwcC5kaWZmZXJcbiAgICBpZiAoZGlmZmVyKSB7XG4gICAgICBkaWZmZXIuYXBwZW5kKCdlbGVtZW50JywgZWwuZGVwdGggfHwgMCwgZWwucmVmLCBoYW5kbGVyKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGhhbmRsZXIoKVxuICAgIH1cbiAgfSlcblxuICBlbFttZXRob2ROYW1lXShrZXksIHZhbHVlKVxufVxuXG4vKipcbiAqIHdhdGNoIGEgY2FsYyBmdW5jdGlvbiBhbmQgY2FsbGJhY2sgaWYgdGhlIGNhbGMgdmFsdWUgY2hhbmdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gd2F0Y2ggKHZtLCBjYWxjLCBjYWxsYmFjaykge1xuICBpZiAodm0uX3N0YXRpYykge1xuICAgIHJldHVybiBjYWxjLmNhbGwodm0sIHZtKVxuICB9XG4gIGNvbnN0IHdhdGNoZXIgPSBuZXcgV2F0Y2hlcih2bSwgY2FsYywgZnVuY3Rpb24gKHZhbHVlLCBvbGRWYWx1ZSkge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmIHZhbHVlID09PSBvbGRWYWx1ZSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNhbGxiYWNrKHZhbHVlKVxuICB9KVxuXG4gIHJldHVybiB3YXRjaGVyLnZhbHVlXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlldyBEb2N1bWVudCAmIEVsZW1lbnQgSGVscGVycy5cbiAqXG4gKiByZXF1aXJlZDpcbiAqIERvY3VtZW50IzogY3JlYXRlRWxlbWVudCwgY3JlYXRlQ29tbWVudCwgZ2V0UmVmXG4gKiBFbGVtZW50IzogYXBwZW5kQ2hpbGQsIGluc2VydEJlZm9yZSwgcmVtb3ZlQ2hpbGQsIG5leHRTaWJsaW5nXG4gKi9cblxuLyoqXG4gKiBDcmVhdGUgYSBib2R5IGJ5IHR5cGVcbiAqIFVzaW5nIHRoaXMuX2FwcC5kb2NcbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUJvZHkgKHZtLCB0eXBlKSB7XG4gIGNvbnN0IGRvYyA9IHZtLl9hcHAuZG9jXG4gIHJldHVybiBkb2MuY3JlYXRlQm9keSh0eXBlKVxufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBlbGVtZW50IGJ5IHR5cGVcbiAqIFVzaW5nIHRoaXMuX2FwcC5kb2NcbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQgKHZtLCB0eXBlKSB7XG4gIGNvbnN0IGRvYyA9IHZtLl9hcHAuZG9jXG4gIHJldHVybiBkb2MuY3JlYXRlRWxlbWVudCh0eXBlKVxufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgZnJhZyBibG9jayBmb3IgYW4gZWxlbWVudC5cbiAqIFRoZSBmcmFnIGJsb2NrIGhhcyBhIHN0YXJ0ZXIsIGVuZGVyIGFuZCB0aGUgZWxlbWVudCBpdHNlbGYuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVCbG9jayAodm0sIGVsZW1lbnQpIHtcbiAgY29uc3Qgc3RhcnQgPSBjcmVhdGVCbG9ja1N0YXJ0KHZtKVxuICBjb25zdCBlbmQgPSBjcmVhdGVCbG9ja0VuZCh2bSlcbiAgY29uc3QgYmxvY2tJZCA9IGxhc3Rlc3RCbG9ja0lkKytcbiAgaWYgKGVsZW1lbnQuZWxlbWVudCkge1xuICAgIGxldCB1cGRhdGVNYXJrID0gZWxlbWVudC51cGRhdGVNYXJrXG4gICAgaWYgKHVwZGF0ZU1hcmspIHtcbiAgICAgIGlmICh1cGRhdGVNYXJrLmVsZW1lbnQpIHtcbiAgICAgICAgdXBkYXRlTWFyayA9IHVwZGF0ZU1hcmsuZW5kXG4gICAgICB9XG4gICAgICBlbGVtZW50LmVsZW1lbnQuaW5zZXJ0QWZ0ZXIoZW5kLCB1cGRhdGVNYXJrKVxuICAgICAgZWxlbWVudC5lbGVtZW50Lmluc2VydEFmdGVyKHN0YXJ0LCB1cGRhdGVNYXJrKVxuICAgICAgZWxlbWVudC51cGRhdGVNYXJrID0gZW5kXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZWxlbWVudC5lbGVtZW50Lmluc2VydEJlZm9yZShzdGFydCwgZWxlbWVudC5lbmQpXG4gICAgICBlbGVtZW50LmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGVuZCwgZWxlbWVudC5lbmQpXG4gICAgfVxuICAgIGVsZW1lbnQgPSBlbGVtZW50LmVsZW1lbnRcbiAgfVxuICBlbHNlIHtcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHN0YXJ0KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZW5kKVxuICB9XG4gIHJldHVybiB7IHN0YXJ0LCBlbmQsIGVsZW1lbnQsIGJsb2NrSWQgfVxufVxuXG5sZXQgbGFzdGVzdEJsb2NrSWQgPSAxXG5cbi8qKlxuICogQ3JlYXRlIGFuZCByZXR1cm4gYSBibG9jayBzdGFydGVyLlxuICogVXNpbmcgdGhpcy5fYXBwLmRvY1xuICovXG5mdW5jdGlvbiBjcmVhdGVCbG9ja1N0YXJ0ICh2bSkge1xuICBjb25zdCBkb2MgPSB2bS5fYXBwLmRvY1xuICBjb25zdCBhbmNob3IgPSBkb2MuY3JlYXRlQ29tbWVudCgnc3RhcnQnKVxuICByZXR1cm4gYW5jaG9yXG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCByZXR1cm4gYSBibG9jayBlbmRlci5cbiAqIFVzaW5nIHRoaXMuX2FwcC5kb2NcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQmxvY2tFbmQgKHZtKSB7XG4gIGNvbnN0IGRvYyA9IHZtLl9hcHAuZG9jXG4gIGNvbnN0IGFuY2hvciA9IGRvYy5jcmVhdGVDb21tZW50KCdlbmQnKVxuICByZXR1cm4gYW5jaG9yXG59XG5cbi8qKlxuICogQXR0YWNoIHRhcmdldCB0byBhIGNlcnRhaW4gZGVzdCB1c2luZyBhcHBlbmRDaGlsZCBieSBkZWZhdWx0LlxuICogSWYgdGhlIGRlc3QgaXMgYSBmcmFnIGJsb2NrIHRoZW4gaW5zZXJ0IGJlZm9yZSB0aGUgZW5kZXIuXG4gKiBJZiB0aGUgdGFyZ2V0IGlzIGEgZnJhZyBibG9jayB0aGVuIGF0dGFjaCB0aGUgc3RhcnRlciBhbmQgZW5kZXIgaW4gb3JkZXIuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSAge29iamVjdH0gZGVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoVGFyZ2V0ICh2bSwgdGFyZ2V0LCBkZXN0KSB7XG4gIGlmIChkZXN0LmVsZW1lbnQpIHtcbiAgICBjb25zdCBiZWZvcmUgPSBkZXN0LmVuZFxuICAgIGNvbnN0IGFmdGVyID0gZGVzdC51cGRhdGVNYXJrXG4gICAgLy8gcHVzaCBuZXcgdGFyZ2V0IGZvciB3YXRjaCBsaXN0IHVwZGF0ZSBsYXRlclxuICAgIGlmIChkZXN0LmNoaWxkcmVuKSB7XG4gICAgICBkZXN0LmNoaWxkcmVuLnB1c2godGFyZ2V0KVxuICAgIH1cbiAgICAvLyBmb3IgY2hlY2sgcmVwZWF0IGNhc2VcbiAgICBpZiAoYWZ0ZXIpIHtcbiAgICAgIGNvbnN0IHNpZ25hbCA9IG1vdmVUYXJnZXQodm0sIHRhcmdldCwgYWZ0ZXIpXG4gICAgICBkZXN0LnVwZGF0ZU1hcmsgPSB0YXJnZXQuZWxlbWVudCA/IHRhcmdldC5lbmQgOiB0YXJnZXRcbiAgICAgIHJldHVybiBzaWduYWxcbiAgICB9XG4gICAgZWxzZSBpZiAodGFyZ2V0LmVsZW1lbnQpIHtcbiAgICAgIGRlc3QuZWxlbWVudC5pbnNlcnRCZWZvcmUodGFyZ2V0LnN0YXJ0LCBiZWZvcmUpXG4gICAgICBkZXN0LmVsZW1lbnQuaW5zZXJ0QmVmb3JlKHRhcmdldC5lbmQsIGJlZm9yZSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gZGVzdC5lbGVtZW50Lmluc2VydEJlZm9yZSh0YXJnZXQsIGJlZm9yZSlcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHRhcmdldC5lbGVtZW50KSB7XG4gICAgICBkZXN0LmFwcGVuZENoaWxkKHRhcmdldC5zdGFydClcbiAgICAgIGRlc3QuYXBwZW5kQ2hpbGQodGFyZ2V0LmVuZClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gZGVzdC5hcHBlbmRDaGlsZCh0YXJnZXQpXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTW92ZSB0YXJnZXQgYmVmb3JlIGEgY2VydGFpbiBlbGVtZW50LiBUaGUgdGFyZ2V0IG1heWJlIGJsb2NrIG9yIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSAge29iamVjdH0gYmVmb3JlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtb3ZlVGFyZ2V0ICh2bSwgdGFyZ2V0LCBhZnRlcikge1xuICBpZiAodGFyZ2V0LmVsZW1lbnQpIHtcbiAgICByZXR1cm4gbW92ZUJsb2NrKHRhcmdldCwgYWZ0ZXIpXG4gIH1cbiAgcmV0dXJuIG1vdmVFbGVtZW50KHRhcmdldCwgYWZ0ZXIpXG59XG5cbi8qKlxuICogTW92ZSBlbGVtZW50IGJlZm9yZSBhIGNlcnRhaW4gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9IGVsZW1lbnRcbiAqIEBwYXJhbSAge29iamVjdH0gYmVmb3JlXG4gKi9cbmZ1bmN0aW9uIG1vdmVFbGVtZW50IChlbGVtZW50LCBhZnRlcikge1xuICBjb25zdCBwYXJlbnQgPSBhZnRlci5wYXJlbnROb2RlXG4gIGlmIChwYXJlbnQpIHtcbiAgICByZXR1cm4gcGFyZW50Lmluc2VydEFmdGVyKGVsZW1lbnQsIGFmdGVyKVxuICB9XG59XG5cbi8qKlxuICogTW92ZSBhbGwgZWxlbWVudHMgb2YgdGhlIGJsb2NrIGJlZm9yZSBhIGNlcnRhaW4gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9IGZyYWdCbG9ja1xuICogQHBhcmFtICB7b2JqZWN0fSBiZWZvcmVcbiAqL1xuZnVuY3Rpb24gbW92ZUJsb2NrIChmcmFnQmxvY2ssIGFmdGVyKSB7XG4gIGNvbnN0IHBhcmVudCA9IGFmdGVyLnBhcmVudE5vZGVcblxuICBpZiAocGFyZW50KSB7XG4gICAgbGV0IGVsID0gZnJhZ0Jsb2NrLnN0YXJ0XG4gICAgbGV0IHNpZ25hbFxuICAgIGNvbnN0IGdyb3VwID0gW2VsXVxuXG4gICAgd2hpbGUgKGVsICYmIGVsICE9PSBmcmFnQmxvY2suZW5kKSB7XG4gICAgICBlbCA9IGVsLm5leHRTaWJsaW5nXG4gICAgICBncm91cC5wdXNoKGVsKVxuICAgIH1cblxuICAgIGxldCB0ZW1wID0gYWZ0ZXJcbiAgICBncm91cC5ldmVyeSgoZWwpID0+IHtcbiAgICAgIHNpZ25hbCA9IHBhcmVudC5pbnNlcnRBZnRlcihlbCwgdGVtcClcbiAgICAgIHRlbXAgPSBlbFxuICAgICAgcmV0dXJuIHNpZ25hbCAhPT0gLTFcbiAgICB9KVxuXG4gICAgcmV0dXJuIHNpZ25hbFxuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIHRhcmdldCBmcm9tIERPTSB0cmVlLlxuICogSWYgdGhlIHRhcmdldCBpcyBhIGZyYWcgYmxvY2sgdGhlbiBjYWxsIF9yZW1vdmVCbG9ja1xuICpcbiAqIEBwYXJhbSAge29iamVjdH0gdGFyZ2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVUYXJnZXQgKHZtLCB0YXJnZXQsIHByZXNlcnZlQmxvY2sgPSBmYWxzZSkge1xuICBpZiAodGFyZ2V0LmVsZW1lbnQpIHtcbiAgICByZW1vdmVCbG9jayh0YXJnZXQsIHByZXNlcnZlQmxvY2spXG4gIH1cbiAgZWxzZSB7XG4gICAgcmVtb3ZlRWxlbWVudCh0YXJnZXQpXG4gIH1cbiAgaWYgKHRhcmdldC5fdm0pIHtcbiAgICB0YXJnZXQuX3ZtLiRlbWl0KCdob29rOmRlc3Ryb3llZCcpXG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmUgYSBjZXJ0YWluIGVsZW1lbnQuXG4gKiBVc2luZyB0aGlzLl9hcHAuZG9jXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSB0YXJnZXRcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlRWxlbWVudCAodGFyZ2V0KSB7XG4gIGNvbnN0IHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlXG5cbiAgaWYgKHBhcmVudCkge1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0YXJnZXQpXG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmUgYSBmcmFnIGJsb2NrLlxuICogVGhlIHNlY29uZCBwYXJhbSBkZWNpZGVzIHdoZXRoZXIgdGhlIGJsb2NrIHNlbGYgc2hvdWxkIGJlIHJlbW92ZWQgdG9vLlxuICpcbiAqIEBwYXJhbSAge29iamVjdH0gIGZyYWdCbG9ja1xuICogQHBhcmFtICB7Qm9vbGVhbn0gcHJlc2VydmVCbG9jaz1mYWxzZVxuICovXG5mdW5jdGlvbiByZW1vdmVCbG9jayAoZnJhZ0Jsb2NrLCBwcmVzZXJ2ZUJsb2NrID0gZmFsc2UpIHtcbiAgY29uc3QgcmVzdWx0ID0gW11cbiAgbGV0IGVsID0gZnJhZ0Jsb2NrLnN0YXJ0Lm5leHRTaWJsaW5nXG5cbiAgd2hpbGUgKGVsICYmIGVsICE9PSBmcmFnQmxvY2suZW5kKSB7XG4gICAgcmVzdWx0LnB1c2goZWwpXG4gICAgZWwgPSBlbC5uZXh0U2libGluZ1xuICB9XG5cbiAgaWYgKCFwcmVzZXJ2ZUJsb2NrKSB7XG4gICAgcmVtb3ZlRWxlbWVudChmcmFnQmxvY2suc3RhcnQpXG4gIH1cbiAgcmVzdWx0LmZvckVhY2goKGVsKSA9PiB7XG4gICAgcmVtb3ZlRWxlbWVudChlbClcbiAgfSlcbiAgaWYgKCFwcmVzZXJ2ZUJsb2NrKSB7XG4gICAgcmVtb3ZlRWxlbWVudChmcmFnQmxvY2suZW5kKVxuICB9XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogVmlld01vZGVsIHRlbXBsYXRlIHBhcnNlciAmIGRhdGEtYmluZGluZyBwcm9jZXNzXG4gKi9cblxuaW1wb3J0IHtcbiAgZXh0ZW5kLFxuICBpc09iamVjdCxcbiAgYmluZFxufSBmcm9tICcuLi91dGlsL2luZGV4J1xuaW1wb3J0IHtcbiAgaW5pdERhdGEsXG4gIGluaXRDb21wdXRlZFxufSBmcm9tICcuLi9jb3JlL3N0YXRlJ1xuaW1wb3J0IHtcbiAgYmluZEVsZW1lbnQsXG4gIHNldElkLFxuICBiaW5kU3ViVm0sXG4gIGJpbmRTdWJWbUFmdGVySW5pdGlhbGl6ZWQsXG4gIGFwcGx5TmFpdHZlQ29tcG9uZW50T3B0aW9ucyxcbiAgd2F0Y2hcbn0gZnJvbSAnLi9kaXJlY3RpdmUnXG5pbXBvcnQge1xuICBjcmVhdGVCbG9jayxcbiAgY3JlYXRlQm9keSxcbiAgY3JlYXRlRWxlbWVudCxcbiAgYXR0YWNoVGFyZ2V0LFxuICBtb3ZlVGFyZ2V0LFxuICByZW1vdmVUYXJnZXRcbn0gZnJvbSAnLi9kb20taGVscGVyJ1xuXG4vKipcbiAqIGJ1aWxkKClcbiAqICAgY29tcGlsZSh0ZW1wbGF0ZSwgcGFyZW50Tm9kZSlcbiAqICAgICBpZiAodHlwZSBpcyBjb250ZW50KSBjcmVhdGUgY29udGVudE5vZGVcbiAqICAgICBlbHNlIGlmIChkaXJzIGhhdmUgdi1mb3IpIGZvcmVhY2ggLT4gY3JlYXRlIGNvbnRleHRcbiAqICAgICAgIC0+IGNvbXBpbGUodGVtcGxhdGVXaXRob3V0Rm9yLCBwYXJlbnROb2RlKTogZGlmZihsaXN0KSBvbmNoYW5nZVxuICogICAgIGVsc2UgaWYgKGRpcnMgaGF2ZSB2LWlmKSBhc3NlcnRcbiAqICAgICAgIC0+IGNvbXBpbGUodGVtcGxhdGVXaXRob3V0SWYsIHBhcmVudE5vZGUpOiB0b2dnbGUoc2hvd24pIG9uY2hhbmdlXG4gKiAgICAgZWxzZSBpZiAodHlwZSBpcyBkeW5hbWljKVxuICogICAgICAgLT4gY29tcGlsZSh0ZW1wbGF0ZVdpdGhvdXREeW5hbWljVHlwZSwgcGFyZW50Tm9kZSk6IHdhdGNoKHR5cGUpIG9uY2hhbmdlXG4gKiAgICAgZWxzZSBpZiAodHlwZSBpcyBjdXN0b20pXG4gKiAgICAgICBhZGRDaGlsZFZtKHZtLCBwYXJlbnRWbSlcbiAqICAgICAgIGJ1aWxkKGV4dGVybmFsRGlycylcbiAqICAgICAgIGZvcmVhY2ggY2hpbGROb2RlcyAtPiBjb21waWxlKGNoaWxkTm9kZSwgdGVtcGxhdGUpXG4gKiAgICAgZWxzZSBpZiAodHlwZSBpcyBuYXRpdmUpXG4gKiAgICAgICBzZXQoZGlycyk6IHVwZGF0ZShpZC9hdHRyL3N0eWxlL2NsYXNzKSBvbmNoYW5nZVxuICogICAgICAgYXBwZW5kKHRlbXBsYXRlLCBwYXJlbnROb2RlKVxuICogICAgICAgZm9yZWFjaCBjaGlsZE5vZGVzIC0+IGNvbXBpbGUoY2hpbGROb2RlLCB0ZW1wbGF0ZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkICh2bSkge1xuICBjb25zdCBvcHQgPSB2bS5fb3B0aW9ucyB8fCB7fVxuICBjb25zdCB0ZW1wbGF0ZSA9IG9wdC50ZW1wbGF0ZSB8fCB7fVxuXG4gIGlmIChvcHQucmVwbGFjZSkge1xuICAgIGlmICh0ZW1wbGF0ZS5jaGlsZHJlbiAmJiB0ZW1wbGF0ZS5jaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcbiAgICAgIGNvbXBpbGUodm0sIHRlbXBsYXRlLmNoaWxkcmVuWzBdLCB2bS5fcGFyZW50RWwpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29tcGlsZSh2bSwgdGVtcGxhdGUuY2hpbGRyZW4sIHZtLl9wYXJlbnRFbClcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY29tcGlsZSh2bSwgdGVtcGxhdGUsIHZtLl9wYXJlbnRFbClcbiAgfVxuXG4gIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIFwicmVhZHlcIiBsaWZlY3ljbGUgaW4gVm0oJHt2bS5fdHlwZX0pYClcbiAgdm0uJGVtaXQoJ2hvb2s6cmVhZHknKVxuICB2bS5fcmVhZHkgPSB0cnVlXG59XG5cbi8qKlxuICogR2VuZXJhdGUgZWxlbWVudHMgYnkgY2hpbGQgb3IgY2hpbGRyZW4gYW5kIGFwcGVuZCB0byBwYXJlbnQgZWxlbWVudHMuXG4gKiBSb290IGVsZW1lbnQgaW5mbyB3b3VsZCBiZSBtZXJnZWQgaWYgaGFzLiBUaGUgZmlyc3QgYXJndW1lbnQgbWF5IGJlIGFuIGFycmF5XG4gKiBpZiB0aGUgcm9vdCBlbGVtZW50IHdpdGggb3B0aW9ucy5yZXBsYWNlIGhhcyBub3Qgb25seSBvbmUgY2hpbGQuXG4gKlxuICogQHBhcmFtIHtvYmplY3R8YXJyYXl9IHRhcmdldFxuICogQHBhcmFtIHtvYmplY3R9ICAgICAgIGRlc3RcbiAqIEBwYXJhbSB7b2JqZWN0fSAgICAgICBtZXRhXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHZtLCB0YXJnZXQsIGRlc3QsIG1ldGEpIHtcbiAgY29uc3QgYXBwID0gdm0uX2FwcCB8fCB7fVxuXG4gIGlmIChhcHAubGFzdFNpZ25hbCA9PT0gLTEpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICh0YXJnZXQuYXR0ciAmJiB0YXJnZXQuYXR0ci5oYXNPd25Qcm9wZXJ0eSgnc3RhdGljJykpIHtcbiAgICB2bS5fc3RhdGljID0gdHJ1ZVxuICB9XG5cbiAgaWYgKHRhcmdldElzRnJhZ21lbnQodGFyZ2V0KSkge1xuICAgIGNvbXBpbGVGcmFnbWVudCh2bSwgdGFyZ2V0LCBkZXN0LCBtZXRhKVxuICAgIHJldHVyblxuICB9XG4gIG1ldGEgPSBtZXRhIHx8IHt9XG4gIGlmICh0YXJnZXRJc0NvbnRlbnQodGFyZ2V0KSkge1xuICAgIGNvbnNvbGUuZGVidWcoJ1tKUyBGcmFtZXdvcmtdIGNvbXBpbGUgXCJjb250ZW50XCIgYmxvY2sgYnknLCB0YXJnZXQpXG4gICAgdm0uX2NvbnRlbnQgPSBjcmVhdGVCbG9jayh2bSwgZGVzdClcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmICh0YXJnZXROZWVkQ2hlY2tSZXBlYXQodGFyZ2V0LCBtZXRhKSkge1xuICAgIGNvbnNvbGUuZGVidWcoJ1tKUyBGcmFtZXdvcmtdIGNvbXBpbGUgXCJyZXBlYXRcIiBsb2dpYyBieScsIHRhcmdldClcbiAgICBpZiAoZGVzdC50eXBlID09PSAnZG9jdW1lbnQnKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIFRoZSByb290IGVsZW1lbnQgZG9lc1xcJ3Qgc3VwcG9ydCBgcmVwZWF0YCBkaXJlY3RpdmUhJylcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21waWxlUmVwZWF0KHZtLCB0YXJnZXQsIGRlc3QpXG4gICAgfVxuICAgIHJldHVyblxuICB9XG4gIGlmICh0YXJnZXROZWVkQ2hlY2tTaG93bih0YXJnZXQsIG1ldGEpKSB7XG4gICAgY29uc29sZS5kZWJ1ZygnW0pTIEZyYW1ld29ya10gY29tcGlsZSBcImlmXCIgbG9naWMgYnknLCB0YXJnZXQpXG4gICAgaWYgKGRlc3QudHlwZSA9PT0gJ2RvY3VtZW50Jykge1xuICAgICAgY29uc29sZS53YXJuKCdbSlMgRnJhbWV3b3JrXSBUaGUgcm9vdCBlbGVtZW50IGRvZXNcXCd0IHN1cHBvcnQgYGlmYCBkaXJlY3RpdmUhJylcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb21waWxlU2hvd24odm0sIHRhcmdldCwgZGVzdCwgbWV0YSlcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgdHlwZUdldHRlciA9IG1ldGEudHlwZSB8fCB0YXJnZXQudHlwZVxuICBpZiAodGFyZ2V0TmVlZENoZWNrVHlwZSh0eXBlR2V0dGVyLCBtZXRhKSkge1xuICAgIGNvbXBpbGVUeXBlKHZtLCB0YXJnZXQsIGRlc3QsIHR5cGVHZXR0ZXIsIG1ldGEpXG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgdHlwZSA9IHR5cGVHZXR0ZXJcbiAgY29uc3QgY29tcG9uZW50ID0gdGFyZ2V0SXNDb21wb3NlZCh2bSwgdGFyZ2V0LCB0eXBlKVxuICBpZiAoY29tcG9uZW50KSB7XG4gICAgY29uc29sZS5kZWJ1ZygnW0pTIEZyYW1ld29ya10gY29tcGlsZSBjb21wb3NlZCBjb21wb25lbnQgYnknLCB0YXJnZXQpXG4gICAgY29tcGlsZUN1c3RvbUNvbXBvbmVudCh2bSwgY29tcG9uZW50LCB0YXJnZXQsIGRlc3QsIHR5cGUsIG1ldGEpXG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc29sZS5kZWJ1ZygnW0pTIEZyYW1ld29ya10gY29tcGlsZSBuYXRpdmUgY29tcG9uZW50IGJ5JywgdGFyZ2V0KVxuICBjb21waWxlTmF0aXZlQ29tcG9uZW50KHZtLCB0YXJnZXQsIGRlc3QsIHR5cGUpXG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGFyZ2V0IGlzIGEgZnJhZ21lbnQgKGFuIGFycmF5KS5cbiAqXG4gKiBAcGFyYW0gIHtvYmplY3R9ICB0YXJnZXRcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHRhcmdldElzRnJhZ21lbnQgKHRhcmdldCkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh0YXJnZXQpXG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGFyZ2V0IHR5cGUgaXMgY29udGVudC9zbG90LlxuICpcbiAqIEBwYXJhbSAge29iamVjdH0gIHRhcmdldFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gdGFyZ2V0SXNDb250ZW50ICh0YXJnZXQpIHtcbiAgcmV0dXJuIHRhcmdldC50eXBlID09PSAnY29udGVudCcgfHwgdGFyZ2V0LnR5cGUgPT09ICdzbG90J1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHRhcmdldCBuZWVkIHRvIGNvbXBpbGUgYnkgYSBsaXN0LlxuICpcbiAqIEBwYXJhbSAge29iamVjdH0gIHRhcmdldFxuICogQHBhcmFtICB7b2JqZWN0fSAgbWV0YVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gdGFyZ2V0TmVlZENoZWNrUmVwZWF0ICh0YXJnZXQsIG1ldGEpIHtcbiAgcmV0dXJuICFtZXRhLmhhc093blByb3BlcnR5KCdyZXBlYXQnKSAmJiB0YXJnZXQucmVwZWF0XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGFyZ2V0IG5lZWQgdG8gY29tcGlsZSBieSBhIGJvb2xlYW4gdmFsdWUuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSAgdGFyZ2V0XG4gKiBAcGFyYW0gIHtvYmplY3R9ICBtZXRhXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB0YXJnZXROZWVkQ2hlY2tTaG93biAodGFyZ2V0LCBtZXRhKSB7XG4gIHJldHVybiAhbWV0YS5oYXNPd25Qcm9wZXJ0eSgnc2hvd24nKSAmJiB0YXJnZXQuc2hvd25cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0YXJnZXQgbmVlZCB0byBjb21waWxlIGJ5IGEgZHluYW1pYyB0eXBlLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ3xmdW5jdGlvbn0gdHlwZUdldHRlclxuICogQHBhcmFtICB7b2JqZWN0fSAgICAgICAgICBtZXRhXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB0YXJnZXROZWVkQ2hlY2tUeXBlICh0eXBlR2V0dGVyLCBtZXRhKSB7XG4gIHJldHVybiAodHlwZW9mIHR5cGVHZXR0ZXIgPT09ICdmdW5jdGlvbicpICYmICFtZXRhLmhhc093blByb3BlcnR5KCd0eXBlJylcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGtpbmQgb2YgY29tcG9uZW50IGlzIGNvbXBvc2VkLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gIHR5cGVcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHRhcmdldElzQ29tcG9zZWQgKHZtLCB0YXJnZXQsIHR5cGUpIHtcbiAgbGV0IGNvbXBvbmVudFxuICBpZiAodm0uX2FwcCAmJiB2bS5fYXBwLmN1c3RvbUNvbXBvbmVudE1hcCkge1xuICAgIGNvbXBvbmVudCA9IHZtLl9hcHAuY3VzdG9tQ29tcG9uZW50TWFwW3R5cGVdXG4gIH1cbiAgaWYgKHZtLl9vcHRpb25zICYmIHZtLl9vcHRpb25zLmNvbXBvbmVudHMpIHtcbiAgICBjb21wb25lbnQgPSB2bS5fb3B0aW9ucy5jb21wb25lbnRzW3R5cGVdXG4gIH1cbiAgaWYgKHRhcmdldC5jb21wb25lbnQpIHtcbiAgICBjb21wb25lbnQgPSBjb21wb25lbnQgfHwge31cbiAgfVxuICByZXR1cm4gY29tcG9uZW50XG59XG5cbi8qKlxuICogQ29tcGlsZSBhIGxpc3Qgb2YgdGFyZ2V0cy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0XG4gKiBAcGFyYW0ge29iamVjdH0gZGVzdFxuICogQHBhcmFtIHtvYmplY3R9IG1ldGFcbiAqL1xuZnVuY3Rpb24gY29tcGlsZUZyYWdtZW50ICh2bSwgdGFyZ2V0LCBkZXN0LCBtZXRhKSB7XG4gIGNvbnN0IGZyYWdCbG9jayA9IGNyZWF0ZUJsb2NrKHZtLCBkZXN0KVxuICB0YXJnZXQuZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICBjb21waWxlKHZtLCBjaGlsZCwgZnJhZ0Jsb2NrLCBtZXRhKVxuICB9KVxufVxuXG4vKipcbiAqIENvbXBpbGUgYSB0YXJnZXQgd2l0aCByZXBlYXQgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVSZXBlYXQgKHZtLCB0YXJnZXQsIGRlc3QpIHtcbiAgY29uc3QgcmVwZWF0ID0gdGFyZ2V0LnJlcGVhdFxuICBjb25zdCBvbGRTdHlsZSA9IHR5cGVvZiByZXBlYXQgPT09ICdmdW5jdGlvbidcbiAgbGV0IGdldHRlciA9IHJlcGVhdC5nZXR0ZXIgfHwgcmVwZWF0LmV4cHJlc3Npb24gfHwgcmVwZWF0XG4gIGlmICh0eXBlb2YgZ2V0dGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgZ2V0dGVyID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gW10gfVxuICB9XG4gIGNvbnN0IGtleSA9IHJlcGVhdC5rZXkgfHwgJyRpbmRleCdcbiAgY29uc3QgdmFsdWUgPSByZXBlYXQudmFsdWUgfHwgJyR2YWx1ZSdcbiAgY29uc3QgdHJhY2tCeSA9IHJlcGVhdC50cmFja0J5IHx8IHRhcmdldC50cmFja0J5IHx8XG4gICAgKHRhcmdldC5hdHRyICYmIHRhcmdldC5hdHRyLnRyYWNrQnkpXG5cbiAgY29uc3QgZnJhZ0Jsb2NrID0gY3JlYXRlQmxvY2sodm0sIGRlc3QpXG4gIGZyYWdCbG9jay5jaGlsZHJlbiA9IFtdXG4gIGZyYWdCbG9jay5kYXRhID0gW11cbiAgZnJhZ0Jsb2NrLnZtcyA9IFtdXG5cbiAgYmluZFJlcGVhdCh2bSwgdGFyZ2V0LCBmcmFnQmxvY2ssIHsgZ2V0dGVyLCBrZXksIHZhbHVlLCB0cmFja0J5LCBvbGRTdHlsZSB9KVxufVxuXG4vKipcbiAqIENvbXBpbGUgYSB0YXJnZXQgd2l0aCBpZiBkaXJlY3RpdmUuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICogQHBhcmFtIHtvYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7b2JqZWN0fSBtZXRhXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVTaG93biAodm0sIHRhcmdldCwgZGVzdCwgbWV0YSkge1xuICBjb25zdCBuZXdNZXRhID0geyBzaG93bjogdHJ1ZSB9XG4gIGNvbnN0IGZyYWdCbG9jayA9IGNyZWF0ZUJsb2NrKHZtLCBkZXN0KVxuXG4gIGlmIChkZXN0LmVsZW1lbnQgJiYgZGVzdC5jaGlsZHJlbikge1xuICAgIGRlc3QuY2hpbGRyZW4ucHVzaChmcmFnQmxvY2spXG4gIH1cblxuICBpZiAobWV0YS5yZXBlYXQpIHtcbiAgICBuZXdNZXRhLnJlcGVhdCA9IG1ldGEucmVwZWF0XG4gIH1cblxuICBiaW5kU2hvd24odm0sIHRhcmdldCwgZnJhZ0Jsb2NrLCBuZXdNZXRhKVxufVxuXG4vKipcbiAqIENvbXBpbGUgYSB0YXJnZXQgd2l0aCBkeW5hbWljIGNvbXBvbmVudCB0eXBlLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSAgIHRhcmdldFxuICogQHBhcmFtIHtvYmplY3R9ICAgZGVzdFxuICogQHBhcmFtIHtmdW5jdGlvbn0gdHlwZUdldHRlclxuICovXG5mdW5jdGlvbiBjb21waWxlVHlwZSAodm0sIHRhcmdldCwgZGVzdCwgdHlwZUdldHRlciwgbWV0YSkge1xuICBjb25zdCB0eXBlID0gdHlwZUdldHRlci5jYWxsKHZtKVxuICBjb25zdCBuZXdNZXRhID0gZXh0ZW5kKHsgdHlwZSB9LCBtZXRhKVxuICBjb25zdCBmcmFnQmxvY2sgPSBjcmVhdGVCbG9jayh2bSwgZGVzdClcblxuICBpZiAoZGVzdC5lbGVtZW50ICYmIGRlc3QuY2hpbGRyZW4pIHtcbiAgICBkZXN0LmNoaWxkcmVuLnB1c2goZnJhZ0Jsb2NrKVxuICB9XG5cbiAgd2F0Y2godm0sIHR5cGVHZXR0ZXIsICh2YWx1ZSkgPT4ge1xuICAgIGNvbnN0IG5ld01ldGEgPSBleHRlbmQoeyB0eXBlOiB2YWx1ZSB9LCBtZXRhKVxuICAgIHJlbW92ZVRhcmdldCh2bSwgZnJhZ0Jsb2NrLCB0cnVlKVxuICAgIGNvbXBpbGUodm0sIHRhcmdldCwgZnJhZ0Jsb2NrLCBuZXdNZXRhKVxuICB9KVxuXG4gIGNvbXBpbGUodm0sIHRhcmdldCwgZnJhZ0Jsb2NrLCBuZXdNZXRhKVxufVxuXG4vKipcbiAqIENvbXBpbGUgYSBjb21wb3NlZCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHRhcmdldFxuICogQHBhcmFtIHtvYmplY3R9IGRlc3RcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVDdXN0b21Db21wb25lbnQgKHZtLCBjb21wb25lbnQsIHRhcmdldCwgZGVzdCwgdHlwZSwgbWV0YSkge1xuICBjb25zdCBDdG9yID0gdm0uY29uc3RydWN0b3JcbiAgY29uc3Qgc3ViVm0gPSBuZXcgQ3Rvcih0eXBlLCBjb21wb25lbnQsIHZtLCBkZXN0LCB1bmRlZmluZWQsIHtcbiAgICAnaG9vazppbml0JzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHZtLl9zdGF0aWMpIHtcbiAgICAgICAgdGhpcy5fc3RhdGljID0gdm0uX3N0YXRpY1xuICAgICAgfVxuICAgICAgc2V0SWQodm0sIG51bGwsIHRhcmdldC5pZCwgdGhpcylcbiAgICAgIC8vIGJpbmQgdGVtcGxhdGUgZWFybGllciBiZWNhdXNlIG9mIGxpZmVjeWNsZSBpc3N1ZXNcbiAgICAgIHRoaXMuX2V4dGVybmFsQmluZGluZyA9IHtcbiAgICAgICAgcGFyZW50OiB2bSxcbiAgICAgICAgdGVtcGxhdGU6IHRhcmdldFxuICAgICAgfVxuICAgIH0sXG4gICAgJ2hvb2s6Y3JlYXRlZCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGJpbmRTdWJWbSh2bSwgdGhpcywgdGFyZ2V0LCBtZXRhLnJlcGVhdClcbiAgICB9LFxuICAgICdob29rOnJlYWR5JzogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuX2NvbnRlbnQpIHtcbiAgICAgICAgY29tcGlsZUNoaWxkcmVuKHZtLCB0YXJnZXQsIHRoaXMuX2NvbnRlbnQpXG4gICAgICB9XG4gICAgfVxuICB9KVxuICBiaW5kU3ViVm1BZnRlckluaXRpYWxpemVkKHZtLCBzdWJWbSwgdGFyZ2V0LCBkZXN0KVxufVxuXG4vKipcbiAqIEdlbmVyYXRlIGVsZW1lbnQgZnJvbSB0ZW1wbGF0ZSBhbmQgYXR0YWNoIHRvIHRoZSBkZXN0IGlmIG5lZWRlZC5cbiAqIFRoZSB0aW1lIHRvIGF0dGFjaCBkZXBlbmRzIG9uIHdoZXRoZXIgdGhlIG1vZGUgc3RhdHVzIGlzIG5vZGUgb3IgdHJlZS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gdGVtcGxhdGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0XG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICovXG5mdW5jdGlvbiBjb21waWxlTmF0aXZlQ29tcG9uZW50ICh2bSwgdGVtcGxhdGUsIGRlc3QsIHR5cGUpIHtcbiAgYXBwbHlOYWl0dmVDb21wb25lbnRPcHRpb25zKHRlbXBsYXRlKVxuXG4gIGxldCBlbGVtZW50XG4gIGlmIChkZXN0LnJlZiA9PT0gJ19kb2N1bWVudEVsZW1lbnQnKSB7XG4gICAgLy8gaWYgaXRzIHBhcmVudCBpcyBkb2N1bWVudEVsZW1lbnQgdGhlbiBpdCdzIGEgYm9keVxuICAgIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIGNvbXBpbGUgdG8gY3JlYXRlIGJvZHkgZm9yICR7dHlwZX1gKVxuICAgIGVsZW1lbnQgPSBjcmVhdGVCb2R5KHZtLCB0eXBlKVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIGNvbXBpbGUgdG8gY3JlYXRlIGVsZW1lbnQgZm9yICR7dHlwZX1gKVxuICAgIGVsZW1lbnQgPSBjcmVhdGVFbGVtZW50KHZtLCB0eXBlKVxuICB9XG5cbiAgaWYgKCF2bS5fcm9vdEVsKSB7XG4gICAgdm0uX3Jvb3RFbCA9IGVsZW1lbnRcbiAgICAvLyBiaW5kIGV2ZW50IGVhcmxpZXIgYmVjYXVzZSBvZiBsaWZlY3ljbGUgaXNzdWVzXG4gICAgY29uc3QgYmluZGluZyA9IHZtLl9leHRlcm5hbEJpbmRpbmcgfHwge31cbiAgICBjb25zdCB0YXJnZXQgPSBiaW5kaW5nLnRlbXBsYXRlXG4gICAgY29uc3QgcGFyZW50Vm0gPSBiaW5kaW5nLnBhcmVudFxuICAgIGlmICh0YXJnZXQgJiYgdGFyZ2V0LmV2ZW50cyAmJiBwYXJlbnRWbSAmJiBlbGVtZW50KSB7XG4gICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gdGFyZ2V0LmV2ZW50cykge1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gcGFyZW50Vm1bdGFyZ2V0LmV2ZW50c1t0eXBlXV1cbiAgICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50KHR5cGUsIGJpbmQoaGFuZGxlciwgcGFyZW50Vm0pKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYmluZEVsZW1lbnQodm0sIGVsZW1lbnQsIHRlbXBsYXRlKVxuXG4gIGlmICh0ZW1wbGF0ZS5hdHRyICYmIHRlbXBsYXRlLmF0dHIuYXBwZW5kKSB7IC8vIGJhY2t3YXJkLCBhcHBlbmQgcHJvcCBpbiBhdHRyXG4gICAgdGVtcGxhdGUuYXBwZW5kID0gdGVtcGxhdGUuYXR0ci5hcHBlbmRcbiAgfVxuXG4gIGlmICh0ZW1wbGF0ZS5hcHBlbmQpIHsgLy8gZ2l2ZSB0aGUgYXBwZW5kIGF0dHJpYnV0ZSBmb3IgaW9zIGFkYXB0YXRpb25cbiAgICBlbGVtZW50LmF0dHIgPSBlbGVtZW50LmF0dHIgfHwge31cbiAgICBlbGVtZW50LmF0dHIuYXBwZW5kID0gdGVtcGxhdGUuYXBwZW5kXG4gIH1cblxuICBjb25zdCB0cmVlTW9kZSA9IHRlbXBsYXRlLmFwcGVuZCA9PT0gJ3RyZWUnXG4gIGNvbnN0IGFwcCA9IHZtLl9hcHAgfHwge31cbiAgaWYgKGFwcC5sYXN0U2lnbmFsICE9PSAtMSAmJiAhdHJlZU1vZGUpIHtcbiAgICBjb25zb2xlLmRlYnVnKCdbSlMgRnJhbWV3b3JrXSBjb21waWxlIHRvIGFwcGVuZCBzaW5nbGUgbm9kZSBmb3InLCBlbGVtZW50KVxuICAgIGFwcC5sYXN0U2lnbmFsID0gYXR0YWNoVGFyZ2V0KHZtLCBlbGVtZW50LCBkZXN0KVxuICB9XG4gIGlmIChhcHAubGFzdFNpZ25hbCAhPT0gLTEpIHtcbiAgICBjb21waWxlQ2hpbGRyZW4odm0sIHRlbXBsYXRlLCBlbGVtZW50KVxuICB9XG4gIGlmIChhcHAubGFzdFNpZ25hbCAhPT0gLTEgJiYgdHJlZU1vZGUpIHtcbiAgICBjb25zb2xlLmRlYnVnKCdbSlMgRnJhbWV3b3JrXSBjb21waWxlIHRvIGFwcGVuZCB3aG9sZSB0cmVlIGZvcicsIGVsZW1lbnQpXG4gICAgYXBwLmxhc3RTaWduYWwgPSBhdHRhY2hUYXJnZXQodm0sIGVsZW1lbnQsIGRlc3QpXG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgYWxsIGNoaWxkcmVuIHRvIGEgY2VydGFpbiBwYXJlbnQgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gdGVtcGxhdGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVDaGlsZHJlbiAodm0sIHRlbXBsYXRlLCBkZXN0KSB7XG4gIGNvbnN0IGFwcCA9IHZtLl9hcHAgfHwge31cbiAgY29uc3QgY2hpbGRyZW4gPSB0ZW1wbGF0ZS5jaGlsZHJlblxuICBpZiAoY2hpbGRyZW4gJiYgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgY2hpbGRyZW4uZXZlcnkoKGNoaWxkKSA9PiB7XG4gICAgICBjb21waWxlKHZtLCBjaGlsZCwgZGVzdClcbiAgICAgIHJldHVybiBhcHAubGFzdFNpZ25hbCAhPT0gLTFcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogV2F0Y2ggdGhlIGxpc3QgdXBkYXRlIGFuZCByZWZyZXNoIHRoZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSB7b2JqZWN0fSBmcmFnQmxvY2sge3ZtcywgZGF0YSwgY2hpbGRyZW59XG4gKiBAcGFyYW0ge29iamVjdH0gaW5mbyAgICAgIHtnZXR0ZXIsIGtleSwgdmFsdWUsIHRyYWNrQnksIG9sZFN0eWxlfVxuICovXG5mdW5jdGlvbiBiaW5kUmVwZWF0ICh2bSwgdGFyZ2V0LCBmcmFnQmxvY2ssIGluZm8pIHtcbiAgY29uc3Qgdm1zID0gZnJhZ0Jsb2NrLnZtc1xuICBjb25zdCBjaGlsZHJlbiA9IGZyYWdCbG9jay5jaGlsZHJlblxuICBjb25zdCB7IGdldHRlciwgdHJhY2tCeSwgb2xkU3R5bGUgfSA9IGluZm9cbiAgY29uc3Qga2V5TmFtZSA9IGluZm8ua2V5XG4gIGNvbnN0IHZhbHVlTmFtZSA9IGluZm8udmFsdWVcblxuICBmdW5jdGlvbiBjb21waWxlSXRlbSAoaXRlbSwgaW5kZXgsIGNvbnRleHQpIHtcbiAgICBsZXQgbWVyZ2VkRGF0YVxuICAgIGlmIChvbGRTdHlsZSkge1xuICAgICAgbWVyZ2VkRGF0YSA9IGl0ZW1cbiAgICAgIGlmIChpc09iamVjdChpdGVtKSkge1xuICAgICAgICBtZXJnZWREYXRhW2tleU5hbWVdID0gaW5kZXhcbiAgICAgICAgaWYgKCFtZXJnZWREYXRhLmhhc093blByb3BlcnR5KCdJTkRFWCcpKSB7XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1lcmdlZERhdGEsICdJTkRFWCcsIHtcbiAgICAgICAgICAgIHZhbHVlOiAoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybignW0pTIEZyYW1ld29ya10gXCJJTkRFWFwiIGluIHJlcGVhdCBpcyBkZXByZWNhdGVkLCAnICtcbiAgICAgICAgICAgICAgICAncGxlYXNlIHVzZSBcIiRpbmRleFwiIGluc3RlYWQnKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIEVhY2ggbGlzdCBpdGVtIG11c3QgYmUgYW4gb2JqZWN0IGluIG9sZC1zdHlsZSByZXBlYXQsICdcbiAgICAgICAgICArICdwbGVhc2UgdXNlIGByZXBlYXQ9e3t2IGluIGxpc3R9fWAgaW5zdGVhZC4nKVxuICAgICAgICBtZXJnZWREYXRhID0ge31cbiAgICAgICAgbWVyZ2VkRGF0YVtrZXlOYW1lXSA9IGluZGV4XG4gICAgICAgIG1lcmdlZERhdGFbdmFsdWVOYW1lXSA9IGl0ZW1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBtZXJnZWREYXRhID0ge31cbiAgICAgIG1lcmdlZERhdGFba2V5TmFtZV0gPSBpbmRleFxuICAgICAgbWVyZ2VkRGF0YVt2YWx1ZU5hbWVdID0gaXRlbVxuICAgIH1cbiAgICBjb25zdCBuZXdDb250ZXh0ID0gbWVyZ2VDb250ZXh0KGNvbnRleHQsIG1lcmdlZERhdGEpXG4gICAgdm1zLnB1c2gobmV3Q29udGV4dClcbiAgICBjb21waWxlKG5ld0NvbnRleHQsIHRhcmdldCwgZnJhZ0Jsb2NrLCB7IHJlcGVhdDogaXRlbSB9KVxuICB9XG5cbiAgY29uc3QgbGlzdCA9IHdhdGNoQmxvY2sodm0sIGZyYWdCbG9jaywgZ2V0dGVyLCAncmVwZWF0JyxcbiAgICAoZGF0YSkgPT4ge1xuICAgICAgY29uc29sZS5kZWJ1ZygnW0pTIEZyYW1ld29ya10gdGhlIFwicmVwZWF0XCIgaXRlbSBoYXMgY2hhbmdlZCcsIGRhdGEpXG4gICAgICBpZiAoIWZyYWdCbG9jayB8fCAhZGF0YSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3Qgb2xkQ2hpbGRyZW4gPSBjaGlsZHJlbi5zbGljZSgpXG4gICAgICBjb25zdCBvbGRWbXMgPSB2bXMuc2xpY2UoKVxuICAgICAgY29uc3Qgb2xkRGF0YSA9IGZyYWdCbG9jay5kYXRhLnNsaWNlKClcbiAgICAgIC8vIDEuIGNvbGxlY3QgYWxsIG5ldyByZWZzIHRyYWNrIGJ5XG4gICAgICBjb25zdCB0cmFja01hcCA9IHt9XG4gICAgICBjb25zdCByZXVzZWRNYXAgPSB7fVxuICAgICAgZGF0YS5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBrZXkgPSB0cmFja0J5ID8gaXRlbVt0cmFja0J5XSA6IChvbGRTdHlsZSA/IGl0ZW1ba2V5TmFtZV0gOiBpbmRleClcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICAgIGlmIChrZXkgPT0gbnVsbCB8fCBrZXkgPT09ICcnKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdHJhY2tNYXBba2V5XSA9IGl0ZW1cbiAgICAgIH0pXG5cbiAgICAgIC8vIDIuIHJlbW92ZSB1bnVzZWQgZWxlbWVudCBmb3JlYWNoIG9sZCBpdGVtXG4gICAgICBjb25zdCByZXVzZWRMaXN0ID0gW11cbiAgICAgIG9sZERhdGEuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qga2V5ID0gdHJhY2tCeSA/IGl0ZW1bdHJhY2tCeV0gOiAob2xkU3R5bGUgPyBpdGVtW2tleU5hbWVdIDogaW5kZXgpXG4gICAgICAgIGlmICh0cmFja01hcC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgcmV1c2VkTWFwW2tleV0gPSB7XG4gICAgICAgICAgICBpdGVtLCBpbmRleCwga2V5LFxuICAgICAgICAgICAgdGFyZ2V0OiBvbGRDaGlsZHJlbltpbmRleF0sXG4gICAgICAgICAgICB2bTogb2xkVm1zW2luZGV4XVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXVzZWRMaXN0LnB1c2goaXRlbSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZW1vdmVUYXJnZXQodm0sIG9sZENoaWxkcmVuW2luZGV4XSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgLy8gMy4gY3JlYXRlIG5ldyBlbGVtZW50IGZvcmVhY2ggbmV3IGl0ZW1cbiAgICAgIGNoaWxkcmVuLmxlbmd0aCA9IDBcbiAgICAgIHZtcy5sZW5ndGggPSAwXG4gICAgICBmcmFnQmxvY2suZGF0YSA9IGRhdGEuc2xpY2UoKVxuICAgICAgZnJhZ0Jsb2NrLnVwZGF0ZU1hcmsgPSBmcmFnQmxvY2suc3RhcnRcblxuICAgICAgZGF0YS5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBrZXkgPSB0cmFja0J5ID8gaXRlbVt0cmFja0J5XSA6IChvbGRTdHlsZSA/IGl0ZW1ba2V5TmFtZV0gOiBpbmRleClcbiAgICAgICAgY29uc3QgcmV1c2VkID0gcmV1c2VkTWFwW2tleV1cbiAgICAgICAgaWYgKHJldXNlZCkge1xuICAgICAgICAgIGlmIChyZXVzZWQuaXRlbSA9PT0gcmV1c2VkTGlzdFswXSkge1xuICAgICAgICAgICAgcmV1c2VkTGlzdC5zaGlmdCgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV1c2VkTGlzdC4kcmVtb3ZlKHJldXNlZC5pdGVtKVxuICAgICAgICAgICAgbW92ZVRhcmdldCh2bSwgcmV1c2VkLnRhcmdldCwgZnJhZ0Jsb2NrLnVwZGF0ZU1hcmssIHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGNoaWxkcmVuLnB1c2gocmV1c2VkLnRhcmdldClcbiAgICAgICAgICB2bXMucHVzaChyZXVzZWQudm0pXG4gICAgICAgICAgaWYgKG9sZFN0eWxlKSB7XG4gICAgICAgICAgICByZXVzZWQudm0gPSBpdGVtXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV1c2VkLnZtW3ZhbHVlTmFtZV0gPSBpdGVtXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldXNlZC52bVtrZXlOYW1lXSA9IGluZGV4XG4gICAgICAgICAgZnJhZ0Jsb2NrLnVwZGF0ZU1hcmsgPSByZXVzZWQudGFyZ2V0XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29tcGlsZUl0ZW0oaXRlbSwgaW5kZXgsIHZtKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBkZWxldGUgZnJhZ0Jsb2NrLnVwZGF0ZU1hcmtcbiAgICB9XG4gIClcblxuICBmcmFnQmxvY2suZGF0YSA9IGxpc3Quc2xpY2UoMClcbiAgbGlzdC5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xuICAgIGNvbXBpbGVJdGVtKGl0ZW0sIGluZGV4LCB2bSlcbiAgfSlcbn1cblxuLyoqXG4gKiBXYXRjaCB0aGUgZGlzcGxheSB1cGRhdGUgYW5kIGFkZC9yZW1vdmUgdGhlIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSAge29iamVjdH0gZnJhZ0Jsb2NrXG4gKiBAcGFyYW0gIHtvYmplY3R9IGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gYmluZFNob3duICh2bSwgdGFyZ2V0LCBmcmFnQmxvY2ssIG1ldGEpIHtcbiAgY29uc3QgZGlzcGxheSA9IHdhdGNoQmxvY2sodm0sIGZyYWdCbG9jaywgdGFyZ2V0LnNob3duLCAnc2hvd24nLFxuICAgIChkaXNwbGF5KSA9PiB7XG4gICAgICBjb25zb2xlLmRlYnVnKCdbSlMgRnJhbWV3b3JrXSB0aGUgXCJpZlwiIGl0ZW0gd2FzIGNoYW5nZWQnLCBkaXNwbGF5KVxuXG4gICAgICBpZiAoIWZyYWdCbG9jayB8fCAhIWZyYWdCbG9jay5kaXNwbGF5ID09PSAhIWRpc3BsYXkpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBmcmFnQmxvY2suZGlzcGxheSA9ICEhZGlzcGxheVxuICAgICAgaWYgKGRpc3BsYXkpIHtcbiAgICAgICAgY29tcGlsZSh2bSwgdGFyZ2V0LCBmcmFnQmxvY2ssIG1ldGEpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmVtb3ZlVGFyZ2V0KHZtLCBmcmFnQmxvY2ssIHRydWUpXG4gICAgICB9XG4gICAgfVxuICApXG5cbiAgZnJhZ0Jsb2NrLmRpc3BsYXkgPSAhIWRpc3BsYXlcbiAgaWYgKGRpc3BsYXkpIHtcbiAgICBjb21waWxlKHZtLCB0YXJnZXQsIGZyYWdCbG9jaywgbWV0YSlcbiAgfVxufVxuXG4vKipcbiAqIFdhdGNoIGNhbGMgdmFsdWUgY2hhbmdlcyBhbmQgYXBwZW5kIGNlcnRhaW4gdHlwZSBhY3Rpb24gdG8gZGlmZmVyLlxuICogSXQgaXMgdXNlZCBmb3IgaWYgb3IgcmVwZWF0IGRhdGEtYmluZGluZyBnZW5lcmF0b3IuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSAgIGZyYWdCbG9ja1xuICogQHBhcmFtICB7ZnVuY3Rpb259IGNhbGNcbiAqIEBwYXJhbSAge3N0cmluZ30gICB0eXBlXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gaGFuZGxlclxuICogQHJldHVybiB7YW55fSAgICAgIGluaXQgdmFsdWUgb2YgY2FsY1xuICovXG5mdW5jdGlvbiB3YXRjaEJsb2NrICh2bSwgZnJhZ0Jsb2NrLCBjYWxjLCB0eXBlLCBoYW5kbGVyKSB7XG4gIGNvbnN0IGRpZmZlciA9IHZtICYmIHZtLl9hcHAgJiYgdm0uX2FwcC5kaWZmZXJcbiAgY29uc3QgY29uZmlnID0ge31cbiAgY29uc3QgZGVwdGggPSAoZnJhZ0Jsb2NrLmVsZW1lbnQuZGVwdGggfHwgMCkgKyAxXG5cbiAgcmV0dXJuIHdhdGNoKHZtLCBjYWxjLCAodmFsdWUpID0+IHtcbiAgICBjb25maWcubGF0ZXN0VmFsdWUgPSB2YWx1ZVxuICAgIGlmIChkaWZmZXIgJiYgIWNvbmZpZy5yZWNvcmRlZCkge1xuICAgICAgZGlmZmVyLmFwcGVuZCh0eXBlLCBkZXB0aCwgZnJhZ0Jsb2NrLmJsb2NrSWQsICgpID0+IHtcbiAgICAgICAgY29uc3QgbGF0ZXN0VmFsdWUgPSBjb25maWcubGF0ZXN0VmFsdWVcbiAgICAgICAgaGFuZGxlcihsYXRlc3RWYWx1ZSlcbiAgICAgICAgY29uZmlnLnJlY29yZGVkID0gZmFsc2VcbiAgICAgICAgY29uZmlnLmxhdGVzdFZhbHVlID0gdW5kZWZpbmVkXG4gICAgICB9KVxuICAgIH1cbiAgICBjb25maWcucmVjb3JkZWQgPSB0cnVlXG4gIH0pXG59XG5cbi8qKlxuICogQ2xvbmUgYSBjb250ZXh0IGFuZCBtZXJnZSBjZXJ0YWluIGRhdGEuXG4gKlxuICogQHBhcmFtICB7b2JqZWN0fSBtZXJnZWREYXRhXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIG1lcmdlQ29udGV4dCAoY29udGV4dCwgbWVyZ2VkRGF0YSkge1xuICBjb25zdCBuZXdDb250ZXh0ID0gT2JqZWN0LmNyZWF0ZShjb250ZXh0KVxuICBuZXdDb250ZXh0Ll9kYXRhID0gbWVyZ2VkRGF0YVxuICBpbml0RGF0YShuZXdDb250ZXh0KVxuICBpbml0Q29tcHV0ZWQobmV3Q29udGV4dClcbiAgbmV3Q29udGV4dC5fcmVhbFBhcmVudCA9IGNvbnRleHRcbiAgaWYgKGNvbnRleHQuX3N0YXRpYykge1xuICAgIG5ld0NvbnRleHQuX3N0YXRpYyA9IGNvbnRleHQuX3N0YXRpY1xuICB9XG4gIHJldHVybiBuZXdDb250ZXh0XG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogRXZlcnl0aGluZyBhYm91dCBjb21wb25lbnQgZXZlbnQgd2hpY2ggaW5jbHVkZXMgZXZlbnQgb2JqZWN0LCBldmVudCBsaXN0ZW5lcixcbiAqIGV2ZW50IGVtaXR0ZXIgYW5kIGxpZmVjeWNsZSBob29rcy5cbiAqL1xuXG4vKipcbiAqIEV2ZW50IG9iamVjdCBkZWZpbml0aW9uLiBBbiBldmVudCBvYmplY3QgaGFzIGB0eXBlYCwgYHRpbWVzdGFtcGAgYW5kXG4gKiBgZGV0YWlsYCBmcm9tIHdoaWNoIGEgY29tcG9uZW50IGVtaXQuIFRoZSBldmVudCBvYmplY3QgY291bGQgYmUgZGlzcGF0Y2hlZCB0b1xuICogcGFyZW50cyBvciBicm9hZGNhc3RlZCB0byBjaGlsZHJlbiBleGNlcHQgYHRoaXMuc3RvcCgpYCBpcyBjYWxsZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICogQHBhcmFtIHthbnl9ICAgIGRldGFpbFxuICovXG5mdW5jdGlvbiBFdnQgKHR5cGUsIGRldGFpbCkge1xuICBpZiAoZGV0YWlsIGluc3RhbmNlb2YgRXZ0KSB7XG4gICAgcmV0dXJuIGRldGFpbFxuICB9XG5cbiAgdGhpcy50aW1lc3RhbXAgPSBEYXRlLm5vdygpXG4gIHRoaXMuZGV0YWlsID0gZGV0YWlsXG4gIHRoaXMudHlwZSA9IHR5cGVcblxuICBsZXQgc2hvdWxkU3RvcCA9IGZhbHNlXG5cbiAgLyoqXG4gICAqIHN0b3AgZGlzcGF0Y2ggYW5kIGJyb2FkY2FzdFxuICAgKi9cbiAgdGhpcy5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgIHNob3VsZFN0b3AgPSB0cnVlXG4gIH1cblxuICAvKipcbiAgICogY2hlY2sgaWYgaXQgY2FuJ3QgYmUgZGlzcGF0Y2hlZCBvciBicm9hZGNhc3RlZFxuICAgKi9cbiAgdGhpcy5oYXNTdG9wcGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzaG91bGRTdG9wXG4gIH1cbn1cblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IGJ1dCBub3QgYnJvYWRjYXN0IGRvd24gb3IgZGlzcGF0Y2ggdXAuXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSAge2FueX0gICAgZGV0YWlsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkZW1pdCAodHlwZSwgZGV0YWlsKSB7XG4gIGNvbnN0IGV2ZW50cyA9IHRoaXMuX3ZtRXZlbnRzXG4gIGNvbnN0IGhhbmRsZXJMaXN0ID0gZXZlbnRzW3R5cGVdXG4gIGlmIChoYW5kbGVyTGlzdCkge1xuICAgIGNvbnN0IGV2dCA9IG5ldyBFdnQodHlwZSwgZGV0YWlsKVxuICAgIGhhbmRsZXJMaXN0LmZvckVhY2goKGhhbmRsZXIpID0+IHtcbiAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBldnQpXG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIEVtaXQgYW4gZXZlbnQgYW5kIGRpc3BhdGNoIGl0IHVwLlxuICogQHBhcmFtICB7c3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0gIHthbnl9ICAgIGRldGFpbFxuICovXG5leHBvcnQgZnVuY3Rpb24gJGRpc3BhdGNoICh0eXBlLCBkZXRhaWwpIHtcbiAgY29uc3QgZXZ0ID0gbmV3IEV2dCh0eXBlLCBkZXRhaWwpXG4gIHRoaXMuJGVtaXQodHlwZSwgZXZ0KVxuXG4gIGlmICghZXZ0Lmhhc1N0b3BwZWQoKSAmJiB0aGlzLl9wYXJlbnQgJiYgdGhpcy5fcGFyZW50LiRkaXNwYXRjaCkge1xuICAgIHRoaXMuX3BhcmVudC4kZGlzcGF0Y2godHlwZSwgZXZ0KVxuICB9XG59XG5cbi8qKlxuICogRW1pdCBhbiBldmVudCBhbmQgYnJvYWRjYXN0IGl0IGRvd24uXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSAge2FueX0gICAgZGV0YWlsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkYnJvYWRjYXN0ICh0eXBlLCBkZXRhaWwpIHtcbiAgY29uc3QgZXZ0ID0gbmV3IEV2dCh0eXBlLCBkZXRhaWwpXG4gIHRoaXMuJGVtaXQodHlwZSwgZXZ0KVxuXG4gIGlmICghZXZ0Lmhhc1N0b3BwZWQoKSAmJiB0aGlzLl9jaGlsZHJlblZtcykge1xuICAgIHRoaXMuX2NoaWxkcmVuVm1zLmZvckVhY2goKHN1YlZtKSA9PiB7XG4gICAgICBzdWJWbS4kYnJvYWRjYXN0KHR5cGUsIGV2dClcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogQWRkIGV2ZW50IGxpc3RlbmVyLlxuICogQHBhcmFtICB7c3RyaW5nfSAgIHR5cGVcbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkb24gKHR5cGUsIGhhbmRsZXIpIHtcbiAgaWYgKCF0eXBlIHx8IHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgZXZlbnRzID0gdGhpcy5fdm1FdmVudHNcbiAgY29uc3QgaGFuZGxlckxpc3QgPSBldmVudHNbdHlwZV0gfHwgW11cbiAgaGFuZGxlckxpc3QucHVzaChoYW5kbGVyKVxuICBldmVudHNbdHlwZV0gPSBoYW5kbGVyTGlzdFxuXG4gIC8vIGZpeGVkIG9sZCB2ZXJzaW9uIGxpZmVjeWNsZSBkZXNpZ25cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICh0eXBlID09PSAnaG9vazpyZWFkeScgJiYgdGhpcy5fcmVhZHkpIHtcbiAgICB0aGlzLiRlbWl0KCdob29rOnJlYWR5JylcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lci5cbiAqIEBwYXJhbSAge3N0cmluZ30gICB0eXBlXG4gKiBAcGFyYW0gIHtmdW5jdGlvbn0gaGFuZGxlclxuICovXG5leHBvcnQgZnVuY3Rpb24gJG9mZiAodHlwZSwgaGFuZGxlcikge1xuICBpZiAoIXR5cGUpIHtcbiAgICByZXR1cm5cbiAgfVxuICBjb25zdCBldmVudHMgPSB0aGlzLl92bUV2ZW50c1xuICBpZiAoIWhhbmRsZXIpIHtcbiAgICBkZWxldGUgZXZlbnRzW3R5cGVdXG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgaGFuZGxlckxpc3QgPSBldmVudHNbdHlwZV1cbiAgaWYgKCFoYW5kbGVyTGlzdCkge1xuICAgIHJldHVyblxuICB9XG4gIGhhbmRsZXJMaXN0LiRyZW1vdmUoaGFuZGxlcilcbn1cblxuY29uc3QgTElGRV9DWUNMRV9UWVBFUyA9IFsnaW5pdCcsICdjcmVhdGVkJywgJ3JlYWR5JywgJ2Rlc3Ryb3llZCddXG5cbi8qKlxuICogSW5pdCBldmVudHM6XG4gKiAxLiBsaXN0ZW4gYGV2ZW50c2AgaW4gY29tcG9uZW50IG9wdGlvbnMgJiBgZXh0ZXJuYWxFdmVudHNgLlxuICogMi4gYmluZCBsaWZlY3ljbGUgaG9va3MuXG4gKiBAcGFyYW0gIHtWbX0gICAgIHZtXG4gKiBAcGFyYW0gIHtvYmplY3R9IGV4dGVybmFsRXZlbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0RXZlbnRzICh2bSwgZXh0ZXJuYWxFdmVudHMpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IHZtLl9vcHRpb25zIHx8IHt9XG4gIGNvbnN0IGV2ZW50cyA9IG9wdGlvbnMuZXZlbnRzIHx8IHt9XG4gIGZvciAoY29uc3QgdHlwZTEgaW4gZXZlbnRzKSB7XG4gICAgdm0uJG9uKHR5cGUxLCBldmVudHNbdHlwZTFdKVxuICB9XG4gIGZvciAoY29uc3QgdHlwZTIgaW4gZXh0ZXJuYWxFdmVudHMpIHtcbiAgICB2bS4kb24odHlwZTIsIGV4dGVybmFsRXZlbnRzW3R5cGUyXSlcbiAgfVxuICBMSUZFX0NZQ0xFX1RZUEVTLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICB2bS4kb24oYGhvb2s6JHt0eXBlfWAsIG9wdGlvbnNbdHlwZV0pXG4gIH0pXG59XG5cbi8qKlxuICogQmluZCBldmVudCByZWxhdGVkIG1ldGhvZHMgdG8gVmlld01vZGVsIGluc3RhbmNlLlxuICogQHBhcmFtICB7Vm19IHZtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaXhpbkV2ZW50cyAodm0pIHtcbiAgdm0uJGVtaXQgPSAkZW1pdFxuICB2bS4kZGlzcGF0Y2ggPSAkZGlzcGF0Y2hcbiAgdm0uJGJyb2FkY2FzdCA9ICRicm9hZGNhc3RcbiAgdm0uJG9uID0gJG9uXG4gIHZtLiRvZmYgPSAkb2ZmXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogVmlld01vZGVsIENvbnN0cnVjdG9yICYgZGVmaW5pdGlvblxuICovXG5cbmltcG9ydCB7IGV4dGVuZCB9IGZyb20gJy4uL3V0aWwvaW5kZXgnXG5pbXBvcnQge1xuICBpbml0U3RhdGVcbn0gZnJvbSAnLi4vY29yZS9zdGF0ZSdcbmltcG9ydCB7XG4gIGJ1aWxkXG59IGZyb20gJy4vY29tcGlsZXInXG5pbXBvcnQge1xuICBzZXQsXG4gIGRlbFxufSBmcm9tICcuLi9jb3JlL29ic2VydmVyJ1xuaW1wb3J0IHtcbiAgd2F0Y2hcbn0gZnJvbSAnLi9kaXJlY3RpdmUnXG5pbXBvcnQge1xuICBpbml0RXZlbnRzLFxuICBtaXhpbkV2ZW50c1xufSBmcm9tICcuL2V2ZW50cydcblxuLyoqXG4gKiBWaWV3TW9kZWwgY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgICAgY29tcG9uZW50IG9wdGlvbnNcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnRWbSAgIHdoaWNoIGNvbnRhaW5zIF9hcHBcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnRFbCAgIHJvb3QgZWxlbWVudCBvciBmcmFnIGJsb2NrXG4gKiBAcGFyYW0ge29iamVjdH0gbWVyZ2VkRGF0YSBleHRlcm5hbCBkYXRhXG4gKiBAcGFyYW0ge29iamVjdH0gZXh0ZXJuYWxFdmVudHMgZXh0ZXJuYWwgZXZlbnRzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFZtIChcbiAgdHlwZSxcbiAgb3B0aW9ucyxcbiAgcGFyZW50Vm0sXG4gIHBhcmVudEVsLFxuICBtZXJnZWREYXRhLFxuICBleHRlcm5hbEV2ZW50c1xuKSB7XG4gIHBhcmVudFZtID0gcGFyZW50Vm0gfHwge31cbiAgdGhpcy5fcGFyZW50ID0gcGFyZW50Vm0uX3JlYWxQYXJlbnQgPyBwYXJlbnRWbS5fcmVhbFBhcmVudCA6IHBhcmVudFZtXG4gIHRoaXMuX2FwcCA9IHBhcmVudFZtLl9hcHAgfHwge31cbiAgcGFyZW50Vm0uX2NoaWxkcmVuVm1zICYmIHBhcmVudFZtLl9jaGlsZHJlblZtcy5wdXNoKHRoaXMpXG5cbiAgaWYgKCFvcHRpb25zICYmIHRoaXMuX2FwcC5jdXN0b21Db21wb25lbnRNYXApIHtcbiAgICBvcHRpb25zID0gdGhpcy5fYXBwLmN1c3RvbUNvbXBvbmVudE1hcFt0eXBlXVxuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cbiAgY29uc3QgZGF0YSA9IG9wdGlvbnMuZGF0YSB8fCB7fVxuXG4gIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zXG4gIHRoaXMuX21ldGhvZHMgPSBvcHRpb25zLm1ldGhvZHMgfHwge31cbiAgdGhpcy5fY29tcHV0ZWQgPSBvcHRpb25zLmNvbXB1dGVkIHx8IHt9XG4gIHRoaXMuX2NzcyA9IG9wdGlvbnMuc3R5bGUgfHwge31cbiAgdGhpcy5faWRzID0ge31cbiAgdGhpcy5fdm1FdmVudHMgPSB7fVxuICB0aGlzLl9jaGlsZHJlblZtcyA9IFtdXG4gIHRoaXMuX3R5cGUgPSB0eXBlXG5cbiAgLy8gYmluZCBldmVudHMgYW5kIGxpZmVjeWNsZXNcbiAgaW5pdEV2ZW50cyh0aGlzLCBleHRlcm5hbEV2ZW50cylcblxuICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBcImluaXRcIiBsaWZlY3ljbGUgaW4gVm0oJHt0aGlzLl90eXBlfSlgKVxuICB0aGlzLiRlbWl0KCdob29rOmluaXQnKVxuICB0aGlzLl9pbml0ZWQgPSB0cnVlXG5cbiAgLy8gcHJveHkgZGF0YSBhbmQgbWV0aG9kc1xuICAvLyBvYnNlcnZlIGRhdGEgYW5kIGFkZCB0aGlzIHRvIHZtc1xuICB0aGlzLl9kYXRhID0gdHlwZW9mIGRhdGEgPT09ICdmdW5jdGlvbicgPyBkYXRhKCkgOiBkYXRhXG4gIGlmIChtZXJnZWREYXRhKSB7XG4gICAgZXh0ZW5kKHRoaXMuX2RhdGEsIG1lcmdlZERhdGEpXG4gIH1cbiAgaW5pdFN0YXRlKHRoaXMpXG5cbiAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gXCJjcmVhdGVkXCIgbGlmZWN5Y2xlIGluIFZtKCR7dGhpcy5fdHlwZX0pYClcbiAgdGhpcy4kZW1pdCgnaG9vazpjcmVhdGVkJylcbiAgdGhpcy5fY3JlYXRlZCA9IHRydWVcblxuICAvLyBiYWNrd2FyZCBvbGQgcmVhZHkgZW50cnlcbiAgaWYgKG9wdGlvbnMubWV0aG9kcyAmJiBvcHRpb25zLm1ldGhvZHMucmVhZHkpIHtcbiAgICBjb25zb2xlLndhcm4oJ1wiZXhwb3J0cy5tZXRob2RzLnJlYWR5XCIgaXMgZGVwcmVjYXRlZCwgJyArXG4gICAgICAncGxlYXNlIHVzZSBcImV4cG9ydHMuY3JlYXRlZFwiIGluc3RlYWQnKVxuICAgIG9wdGlvbnMubWV0aG9kcy5yZWFkeS5jYWxsKHRoaXMpXG4gIH1cblxuICBpZiAoIXRoaXMuX2FwcC5kb2MpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIGlmIG5vIHBhcmVudEVsZW1lbnQgdGhlbiBzcGVjaWZ5IHRoZSBkb2N1bWVudEVsZW1lbnRcbiAgdGhpcy5fcGFyZW50RWwgPSBwYXJlbnRFbCB8fCB0aGlzLl9hcHAuZG9jLmRvY3VtZW50RWxlbWVudFxuICBidWlsZCh0aGlzKVxufVxuXG5taXhpbkV2ZW50cyhWbS5wcm90b3R5cGUpXG5cbi8qKlxuICogV2F0Y2ggYW4gZnVuY3Rpb24gYW5kIGJpbmQgYWxsIHRoZSBkYXRhIGFwcGVhcmVkIGluIGl0LiBXaGVuIHRoZSByZWxhdGVkXG4gKiBkYXRhIGNoYW5nZXMsIHRoZSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCB3aXRoIG5ldyB2YWx1ZSBhcyAxc3QgcGFyYW0uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cblZtLnByb3RvdHlwZS4kd2F0Y2ggPSBmdW5jdGlvbiAoZm4sIGNhbGxiYWNrKSB7XG4gIHdhdGNoKHRoaXMsIGZuLCBjYWxsYmFjaylcbn1cblxuVm0uc2V0ID0gc2V0XG5WbS5kZWxldGUgPSBkZWxcbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xubGV0IG5hdGl2ZU1vZHVsZXMgPSB7fVxuXG4vLyBmb3IgdGVzdGluZ1xuXG4vKipcbiAqIGZvciB0ZXN0aW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2R1bGUgKG1vZHVsZU5hbWUpIHtcbiAgcmV0dXJuIG5hdGl2ZU1vZHVsZXNbbW9kdWxlTmFtZV1cbn1cblxuLyoqXG4gKiBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJNb2R1bGVzICgpIHtcbiAgbmF0aXZlTW9kdWxlcyA9IHt9XG59XG5cbi8vIGZvciBmcmFtZXdvcmtcblxuLyoqXG4gKiBpbml0IG1vZHVsZXMgZm9yIGFuIGFwcCBpbnN0YW5jZVxuICogdGhlIHNlY29uZCBwYXJhbSBkZXRlcm1pbmVzIHdoZXRoZXIgdG8gcmVwbGFjZSBhbiBleGlzdGVkIG1ldGhvZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdE1vZHVsZXMgKG1vZHVsZXMsIGlmUmVwbGFjZSkge1xuICBmb3IgKGNvbnN0IG1vZHVsZU5hbWUgaW4gbW9kdWxlcykge1xuICAgIC8vIGluaXQgYG1vZHVsZXNbbW9kdWxlTmFtZV1bXWBcbiAgICBsZXQgbWV0aG9kcyA9IG5hdGl2ZU1vZHVsZXNbbW9kdWxlTmFtZV1cbiAgICBpZiAoIW1ldGhvZHMpIHtcbiAgICAgIG1ldGhvZHMgPSB7fVxuICAgICAgbmF0aXZlTW9kdWxlc1ttb2R1bGVOYW1lXSA9IG1ldGhvZHNcbiAgICB9XG5cbiAgICAvLyBwdXNoIGVhY2ggbm9uLWV4aXN0ZWQgbmV3IG1ldGhvZFxuICAgIG1vZHVsZXNbbW9kdWxlTmFtZV0uZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgbWV0aG9kID0ge1xuICAgICAgICAgIG5hbWU6IG1ldGhvZFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghbWV0aG9kc1ttZXRob2QubmFtZV0gfHwgaWZSZXBsYWNlKSB7XG4gICAgICAgIG1ldGhvZHNbbWV0aG9kLm5hbWVdID0gbWV0aG9kXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIGluaXQgYXBwIG1ldGhvZHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRNZXRob2RzIChWbSwgYXBpcykge1xuICBjb25zdCBwID0gVm0ucHJvdG90eXBlXG5cbiAgZm9yIChjb25zdCBhcGlOYW1lIGluIGFwaXMpIHtcbiAgICBpZiAoIXAuaGFzT3duUHJvcGVydHkoYXBpTmFtZSkpIHtcbiAgICAgIHBbYXBpTmFtZV0gPSBhcGlzW2FwaU5hbWVdXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogZ2V0IGEgbW9kdWxlIG9mIG1ldGhvZHMgZm9yIGFuIGFwcCBpbnN0YW5jZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZU1vZHVsZSAoYXBwLCBuYW1lKSB7XG4gIGNvbnN0IG1ldGhvZHMgPSBuYXRpdmVNb2R1bGVzW25hbWVdXG4gIGNvbnN0IHRhcmdldCA9IHt9XG4gIGZvciAoY29uc3QgbWV0aG9kTmFtZSBpbiBtZXRob2RzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgbWV0aG9kTmFtZSwge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24gbW9kdWxlR2V0dGVyICgpIHtcbiAgICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiBhcHAuY2FsbFRhc2tzKHtcbiAgICAgICAgICBtb2R1bGU6IG5hbWUsXG4gICAgICAgICAgbWV0aG9kOiBtZXRob2ROYW1lLFxuICAgICAgICAgIGFyZ3M6IGFyZ3NcbiAgICAgICAgfSlcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIG1vZHVsZVNldHRlciAodmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHJldHVybiBhcHAuY2FsbFRhc2tzKHtcbiAgICAgICAgICAgIG1vZHVsZTogbmFtZSxcbiAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kTmFtZSxcbiAgICAgICAgICAgIGFyZ3M6IFt2YWx1ZV1cbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxuICByZXR1cm4gdGFyZ2V0XG59XG5cbi8qKlxuICogZ2V0IGEgY3VzdG9tIGNvbXBvbmVudCBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXF1aXJlQ3VzdG9tQ29tcG9uZW50IChhcHAsIG5hbWUpIHtcbiAgY29uc3QgeyBjdXN0b21Db21wb25lbnRNYXAgfSA9IGFwcFxuICByZXR1cm4gY3VzdG9tQ29tcG9uZW50TWFwW25hbWVdXG59XG5cbi8qKlxuICogcmVnaXN0ZXIgYSBjdXN0b20gY29tcG9uZW50IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ3VzdG9tQ29tcG9uZW50IChhcHAsIG5hbWUsIGRlZikge1xuICBjb25zdCB7IGN1c3RvbUNvbXBvbmVudE1hcCB9ID0gYXBwXG5cbiAgaWYgKGN1c3RvbUNvbXBvbmVudE1hcFtuYW1lXSkge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtKUyBGcmFtZXdvcmtdIGRlZmluZSBhIGNvbXBvbmVudCgke25hbWV9KSB0aGF0IGFscmVhZHkgZXhpc3RzYClcbiAgICByZXR1cm5cbiAgfVxuXG4gIGN1c3RvbUNvbXBvbmVudE1hcFtuYW1lXSA9IGRlZlxufVxuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gU2VtVmVyO1xuXG4vLyBUaGUgZGVidWcgZnVuY3Rpb24gaXMgZXhjbHVkZWQgZW50aXJlbHkgZnJvbSB0aGUgbWluaWZpZWQgdmVyc2lvbi5cbi8qIG5vbWluICovIHZhciBkZWJ1Zztcbi8qIG5vbWluICovIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gJ29iamVjdCcgJiZcbiAgICAvKiBub21pbiAqLyBwcm9jZXNzLmVudiAmJlxuICAgIC8qIG5vbWluICovIHByb2Nlc3MuZW52Lk5PREVfREVCVUcgJiZcbiAgICAvKiBub21pbiAqLyAvXFxic2VtdmVyXFxiL2kudGVzdChwcm9jZXNzLmVudi5OT0RFX0RFQlVHKSlcbiAgLyogbm9taW4gKi8gZGVidWcgPSBmdW5jdGlvbigpIHtcbiAgICAvKiBub21pbiAqLyB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgLyogbm9taW4gKi8gYXJncy51bnNoaWZ0KCdTRU1WRVInKTtcbiAgICAvKiBub21pbiAqLyBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgICAvKiBub21pbiAqLyB9O1xuLyogbm9taW4gKi8gZWxzZVxuICAvKiBub21pbiAqLyBkZWJ1ZyA9IGZ1bmN0aW9uKCkge307XG5cbi8vIE5vdGU6IHRoaXMgaXMgdGhlIHNlbXZlci5vcmcgdmVyc2lvbiBvZiB0aGUgc3BlYyB0aGF0IGl0IGltcGxlbWVudHNcbi8vIE5vdCBuZWNlc3NhcmlseSB0aGUgcGFja2FnZSB2ZXJzaW9uIG9mIHRoaXMgY29kZS5cbmV4cG9ydHMuU0VNVkVSX1NQRUNfVkVSU0lPTiA9ICcyLjAuMCc7XG5cbnZhciBNQVhfTEVOR1RIID0gMjU2O1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiB8fCA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vLyBUaGUgYWN0dWFsIHJlZ2V4cHMgZ28gb24gZXhwb3J0cy5yZVxudmFyIHJlID0gZXhwb3J0cy5yZSA9IFtdO1xudmFyIHNyYyA9IGV4cG9ydHMuc3JjID0gW107XG52YXIgUiA9IDA7XG5cbi8vIFRoZSBmb2xsb3dpbmcgUmVndWxhciBFeHByZXNzaW9ucyBjYW4gYmUgdXNlZCBmb3IgdG9rZW5pemluZyxcbi8vIHZhbGlkYXRpbmcsIGFuZCBwYXJzaW5nIFNlbVZlciB2ZXJzaW9uIHN0cmluZ3MuXG5cbi8vICMjIE51bWVyaWMgSWRlbnRpZmllclxuLy8gQSBzaW5nbGUgYDBgLCBvciBhIG5vbi16ZXJvIGRpZ2l0IGZvbGxvd2VkIGJ5IHplcm8gb3IgbW9yZSBkaWdpdHMuXG5cbnZhciBOVU1FUklDSURFTlRJRklFUiA9IFIrKztcbnNyY1tOVU1FUklDSURFTlRJRklFUl0gPSAnMHxbMS05XVxcXFxkKic7XG52YXIgTlVNRVJJQ0lERU5USUZJRVJMT09TRSA9IFIrKztcbnNyY1tOVU1FUklDSURFTlRJRklFUkxPT1NFXSA9ICdbMC05XSsnO1xuXG5cbi8vICMjIE5vbi1udW1lcmljIElkZW50aWZpZXJcbi8vIFplcm8gb3IgbW9yZSBkaWdpdHMsIGZvbGxvd2VkIGJ5IGEgbGV0dGVyIG9yIGh5cGhlbiwgYW5kIHRoZW4gemVybyBvclxuLy8gbW9yZSBsZXR0ZXJzLCBkaWdpdHMsIG9yIGh5cGhlbnMuXG5cbnZhciBOT05OVU1FUklDSURFTlRJRklFUiA9IFIrKztcbnNyY1tOT05OVU1FUklDSURFTlRJRklFUl0gPSAnXFxcXGQqW2EtekEtWi1dW2EtekEtWjAtOS1dKic7XG5cblxuLy8gIyMgTWFpbiBWZXJzaW9uXG4vLyBUaHJlZSBkb3Qtc2VwYXJhdGVkIG51bWVyaWMgaWRlbnRpZmllcnMuXG5cbnZhciBNQUlOVkVSU0lPTiA9IFIrKztcbnNyY1tNQUlOVkVSU0lPTl0gPSAnKCcgKyBzcmNbTlVNRVJJQ0lERU5USUZJRVJdICsgJylcXFxcLicgK1xuICAgICAgICAgICAgICAgICAgICcoJyArIHNyY1tOVU1FUklDSURFTlRJRklFUl0gKyAnKVxcXFwuJyArXG4gICAgICAgICAgICAgICAgICAgJygnICsgc3JjW05VTUVSSUNJREVOVElGSUVSXSArICcpJztcblxudmFyIE1BSU5WRVJTSU9OTE9PU0UgPSBSKys7XG5zcmNbTUFJTlZFUlNJT05MT09TRV0gPSAnKCcgKyBzcmNbTlVNRVJJQ0lERU5USUZJRVJMT09TRV0gKyAnKVxcXFwuJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnKCcgKyBzcmNbTlVNRVJJQ0lERU5USUZJRVJMT09TRV0gKyAnKVxcXFwuJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnKCcgKyBzcmNbTlVNRVJJQ0lERU5USUZJRVJMT09TRV0gKyAnKSc7XG5cbi8vICMjIFByZS1yZWxlYXNlIFZlcnNpb24gSWRlbnRpZmllclxuLy8gQSBudW1lcmljIGlkZW50aWZpZXIsIG9yIGEgbm9uLW51bWVyaWMgaWRlbnRpZmllci5cblxudmFyIFBSRVJFTEVBU0VJREVOVElGSUVSID0gUisrO1xuc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSXSA9ICcoPzonICsgc3JjW05VTUVSSUNJREVOVElGSUVSXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3wnICsgc3JjW05PTk5VTUVSSUNJREVOVElGSUVSXSArICcpJztcblxudmFyIFBSRVJFTEVBU0VJREVOVElGSUVSTE9PU0UgPSBSKys7XG5zcmNbUFJFUkVMRUFTRUlERU5USUZJRVJMT09TRV0gPSAnKD86JyArIHNyY1tOVU1FUklDSURFTlRJRklFUkxPT1NFXSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnfCcgKyBzcmNbTk9OTlVNRVJJQ0lERU5USUZJRVJdICsgJyknO1xuXG5cbi8vICMjIFByZS1yZWxlYXNlIFZlcnNpb25cbi8vIEh5cGhlbiwgZm9sbG93ZWQgYnkgb25lIG9yIG1vcmUgZG90LXNlcGFyYXRlZCBwcmUtcmVsZWFzZSB2ZXJzaW9uXG4vLyBpZGVudGlmaWVycy5cblxudmFyIFBSRVJFTEVBU0UgPSBSKys7XG5zcmNbUFJFUkVMRUFTRV0gPSAnKD86LSgnICsgc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSXSArXG4gICAgICAgICAgICAgICAgICAnKD86XFxcXC4nICsgc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSXSArICcpKikpJztcblxudmFyIFBSRVJFTEVBU0VMT09TRSA9IFIrKztcbnNyY1tQUkVSRUxFQVNFTE9PU0VdID0gJyg/Oi0/KCcgKyBzcmNbUFJFUkVMRUFTRUlERU5USUZJRVJMT09TRV0gK1xuICAgICAgICAgICAgICAgICAgICAgICAnKD86XFxcXC4nICsgc3JjW1BSRVJFTEVBU0VJREVOVElGSUVSTE9PU0VdICsgJykqKSknO1xuXG4vLyAjIyBCdWlsZCBNZXRhZGF0YSBJZGVudGlmaWVyXG4vLyBBbnkgY29tYmluYXRpb24gb2YgZGlnaXRzLCBsZXR0ZXJzLCBvciBoeXBoZW5zLlxuXG52YXIgQlVJTERJREVOVElGSUVSID0gUisrO1xuc3JjW0JVSUxESURFTlRJRklFUl0gPSAnWzAtOUEtWmEtei1dKyc7XG5cbi8vICMjIEJ1aWxkIE1ldGFkYXRhXG4vLyBQbHVzIHNpZ24sIGZvbGxvd2VkIGJ5IG9uZSBvciBtb3JlIHBlcmlvZC1zZXBhcmF0ZWQgYnVpbGQgbWV0YWRhdGFcbi8vIGlkZW50aWZpZXJzLlxuXG52YXIgQlVJTEQgPSBSKys7XG5zcmNbQlVJTERdID0gJyg/OlxcXFwrKCcgKyBzcmNbQlVJTERJREVOVElGSUVSXSArXG4gICAgICAgICAgICAgJyg/OlxcXFwuJyArIHNyY1tCVUlMRElERU5USUZJRVJdICsgJykqKSknO1xuXG5cbi8vICMjIEZ1bGwgVmVyc2lvbiBTdHJpbmdcbi8vIEEgbWFpbiB2ZXJzaW9uLCBmb2xsb3dlZCBvcHRpb25hbGx5IGJ5IGEgcHJlLXJlbGVhc2UgdmVyc2lvbiBhbmRcbi8vIGJ1aWxkIG1ldGFkYXRhLlxuXG4vLyBOb3RlIHRoYXQgdGhlIG9ubHkgbWFqb3IsIG1pbm9yLCBwYXRjaCwgYW5kIHByZS1yZWxlYXNlIHNlY3Rpb25zIG9mXG4vLyB0aGUgdmVyc2lvbiBzdHJpbmcgYXJlIGNhcHR1cmluZyBncm91cHMuICBUaGUgYnVpbGQgbWV0YWRhdGEgaXMgbm90IGFcbi8vIGNhcHR1cmluZyBncm91cCwgYmVjYXVzZSBpdCBzaG91bGQgbm90IGV2ZXIgYmUgdXNlZCBpbiB2ZXJzaW9uXG4vLyBjb21wYXJpc29uLlxuXG52YXIgRlVMTCA9IFIrKztcbnZhciBGVUxMUExBSU4gPSAndj8nICsgc3JjW01BSU5WRVJTSU9OXSArXG4gICAgICAgICAgICAgICAgc3JjW1BSRVJFTEVBU0VdICsgJz8nICtcbiAgICAgICAgICAgICAgICBzcmNbQlVJTERdICsgJz8nO1xuXG5zcmNbRlVMTF0gPSAnXicgKyBGVUxMUExBSU4gKyAnJCc7XG5cbi8vIGxpa2UgZnVsbCwgYnV0IGFsbG93cyB2MS4yLjMgYW5kID0xLjIuMywgd2hpY2ggcGVvcGxlIGRvIHNvbWV0aW1lcy5cbi8vIGFsc28sIDEuMC4wYWxwaGExIChwcmVyZWxlYXNlIHdpdGhvdXQgdGhlIGh5cGhlbikgd2hpY2ggaXMgcHJldHR5XG4vLyBjb21tb24gaW4gdGhlIG5wbSByZWdpc3RyeS5cbnZhciBMT09TRVBMQUlOID0gJ1t2PVxcXFxzXSonICsgc3JjW01BSU5WRVJTSU9OTE9PU0VdICtcbiAgICAgICAgICAgICAgICAgc3JjW1BSRVJFTEVBU0VMT09TRV0gKyAnPycgK1xuICAgICAgICAgICAgICAgICBzcmNbQlVJTERdICsgJz8nO1xuXG52YXIgTE9PU0UgPSBSKys7XG5zcmNbTE9PU0VdID0gJ14nICsgTE9PU0VQTEFJTiArICckJztcblxudmFyIEdUTFQgPSBSKys7XG5zcmNbR1RMVF0gPSAnKCg/Ojx8Pik/PT8pJztcblxuLy8gU29tZXRoaW5nIGxpa2UgXCIyLipcIiBvciBcIjEuMi54XCIuXG4vLyBOb3RlIHRoYXQgXCJ4LnhcIiBpcyBhIHZhbGlkIHhSYW5nZSBpZGVudGlmZXIsIG1lYW5pbmcgXCJhbnkgdmVyc2lvblwiXG4vLyBPbmx5IHRoZSBmaXJzdCBpdGVtIGlzIHN0cmljdGx5IHJlcXVpcmVkLlxudmFyIFhSQU5HRUlERU5USUZJRVJMT09TRSA9IFIrKztcbnNyY1tYUkFOR0VJREVOVElGSUVSTE9PU0VdID0gc3JjW05VTUVSSUNJREVOVElGSUVSTE9PU0VdICsgJ3x4fFh8XFxcXConO1xudmFyIFhSQU5HRUlERU5USUZJRVIgPSBSKys7XG5zcmNbWFJBTkdFSURFTlRJRklFUl0gPSBzcmNbTlVNRVJJQ0lERU5USUZJRVJdICsgJ3x4fFh8XFxcXConO1xuXG52YXIgWFJBTkdFUExBSU4gPSBSKys7XG5zcmNbWFJBTkdFUExBSU5dID0gJ1t2PVxcXFxzXSooJyArIHNyY1tYUkFOR0VJREVOVElGSUVSXSArICcpJyArXG4gICAgICAgICAgICAgICAgICAgJyg/OlxcXFwuKCcgKyBzcmNbWFJBTkdFSURFTlRJRklFUl0gKyAnKScgK1xuICAgICAgICAgICAgICAgICAgICcoPzpcXFxcLignICsgc3JjW1hSQU5HRUlERU5USUZJRVJdICsgJyknICtcbiAgICAgICAgICAgICAgICAgICAnKD86JyArIHNyY1tQUkVSRUxFQVNFXSArICcpPycgK1xuICAgICAgICAgICAgICAgICAgIHNyY1tCVUlMRF0gKyAnPycgK1xuICAgICAgICAgICAgICAgICAgICcpPyk/JztcblxudmFyIFhSQU5HRVBMQUlOTE9PU0UgPSBSKys7XG5zcmNbWFJBTkdFUExBSU5MT09TRV0gPSAnW3Y9XFxcXHNdKignICsgc3JjW1hSQU5HRUlERU5USUZJRVJMT09TRV0gKyAnKScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyg/OlxcXFwuKCcgKyBzcmNbWFJBTkdFSURFTlRJRklFUkxPT1NFXSArICcpJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnKD86XFxcXC4oJyArIHNyY1tYUkFOR0VJREVOVElGSUVSTE9PU0VdICsgJyknICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcoPzonICsgc3JjW1BSRVJFTEVBU0VMT09TRV0gKyAnKT8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1tCVUlMRF0gKyAnPycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyk/KT8nO1xuXG52YXIgWFJBTkdFID0gUisrO1xuc3JjW1hSQU5HRV0gPSAnXicgKyBzcmNbR1RMVF0gKyAnXFxcXHMqJyArIHNyY1tYUkFOR0VQTEFJTl0gKyAnJCc7XG52YXIgWFJBTkdFTE9PU0UgPSBSKys7XG5zcmNbWFJBTkdFTE9PU0VdID0gJ14nICsgc3JjW0dUTFRdICsgJ1xcXFxzKicgKyBzcmNbWFJBTkdFUExBSU5MT09TRV0gKyAnJCc7XG5cbi8vIFRpbGRlIHJhbmdlcy5cbi8vIE1lYW5pbmcgaXMgXCJyZWFzb25hYmx5IGF0IG9yIGdyZWF0ZXIgdGhhblwiXG52YXIgTE9ORVRJTERFID0gUisrO1xuc3JjW0xPTkVUSUxERV0gPSAnKD86fj4/KSc7XG5cbnZhciBUSUxERVRSSU0gPSBSKys7XG5zcmNbVElMREVUUklNXSA9ICcoXFxcXHMqKScgKyBzcmNbTE9ORVRJTERFXSArICdcXFxccysnO1xucmVbVElMREVUUklNXSA9IG5ldyBSZWdFeHAoc3JjW1RJTERFVFJJTV0sICdnJyk7XG52YXIgdGlsZGVUcmltUmVwbGFjZSA9ICckMX4nO1xuXG52YXIgVElMREUgPSBSKys7XG5zcmNbVElMREVdID0gJ14nICsgc3JjW0xPTkVUSUxERV0gKyBzcmNbWFJBTkdFUExBSU5dICsgJyQnO1xudmFyIFRJTERFTE9PU0UgPSBSKys7XG5zcmNbVElMREVMT09TRV0gPSAnXicgKyBzcmNbTE9ORVRJTERFXSArIHNyY1tYUkFOR0VQTEFJTkxPT1NFXSArICckJztcblxuLy8gQ2FyZXQgcmFuZ2VzLlxuLy8gTWVhbmluZyBpcyBcImF0IGxlYXN0IGFuZCBiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoXCJcbnZhciBMT05FQ0FSRVQgPSBSKys7XG5zcmNbTE9ORUNBUkVUXSA9ICcoPzpcXFxcXiknO1xuXG52YXIgQ0FSRVRUUklNID0gUisrO1xuc3JjW0NBUkVUVFJJTV0gPSAnKFxcXFxzKiknICsgc3JjW0xPTkVDQVJFVF0gKyAnXFxcXHMrJztcbnJlW0NBUkVUVFJJTV0gPSBuZXcgUmVnRXhwKHNyY1tDQVJFVFRSSU1dLCAnZycpO1xudmFyIGNhcmV0VHJpbVJlcGxhY2UgPSAnJDFeJztcblxudmFyIENBUkVUID0gUisrO1xuc3JjW0NBUkVUXSA9ICdeJyArIHNyY1tMT05FQ0FSRVRdICsgc3JjW1hSQU5HRVBMQUlOXSArICckJztcbnZhciBDQVJFVExPT1NFID0gUisrO1xuc3JjW0NBUkVUTE9PU0VdID0gJ14nICsgc3JjW0xPTkVDQVJFVF0gKyBzcmNbWFJBTkdFUExBSU5MT09TRV0gKyAnJCc7XG5cbi8vIEEgc2ltcGxlIGd0L2x0L2VxIHRoaW5nLCBvciBqdXN0IFwiXCIgdG8gaW5kaWNhdGUgXCJhbnkgdmVyc2lvblwiXG52YXIgQ09NUEFSQVRPUkxPT1NFID0gUisrO1xuc3JjW0NPTVBBUkFUT1JMT09TRV0gPSAnXicgKyBzcmNbR1RMVF0gKyAnXFxcXHMqKCcgKyBMT09TRVBMQUlOICsgJykkfF4kJztcbnZhciBDT01QQVJBVE9SID0gUisrO1xuc3JjW0NPTVBBUkFUT1JdID0gJ14nICsgc3JjW0dUTFRdICsgJ1xcXFxzKignICsgRlVMTFBMQUlOICsgJykkfF4kJztcblxuXG4vLyBBbiBleHByZXNzaW9uIHRvIHN0cmlwIGFueSB3aGl0ZXNwYWNlIGJldHdlZW4gdGhlIGd0bHQgYW5kIHRoZSB0aGluZ1xuLy8gaXQgbW9kaWZpZXMsIHNvIHRoYXQgYD4gMS4yLjNgID09PiBgPjEuMi4zYFxudmFyIENPTVBBUkFUT1JUUklNID0gUisrO1xuc3JjW0NPTVBBUkFUT1JUUklNXSA9ICcoXFxcXHMqKScgKyBzcmNbR1RMVF0gK1xuICAgICAgICAgICAgICAgICAgICAgICdcXFxccyooJyArIExPT1NFUExBSU4gKyAnfCcgKyBzcmNbWFJBTkdFUExBSU5dICsgJyknO1xuXG4vLyB0aGlzIG9uZSBoYXMgdG8gdXNlIHRoZSAvZyBmbGFnXG5yZVtDT01QQVJBVE9SVFJJTV0gPSBuZXcgUmVnRXhwKHNyY1tDT01QQVJBVE9SVFJJTV0sICdnJyk7XG52YXIgY29tcGFyYXRvclRyaW1SZXBsYWNlID0gJyQxJDIkMyc7XG5cblxuLy8gU29tZXRoaW5nIGxpa2UgYDEuMi4zIC0gMS4yLjRgXG4vLyBOb3RlIHRoYXQgdGhlc2UgYWxsIHVzZSB0aGUgbG9vc2UgZm9ybSwgYmVjYXVzZSB0aGV5J2xsIGJlXG4vLyBjaGVja2VkIGFnYWluc3QgZWl0aGVyIHRoZSBzdHJpY3Qgb3IgbG9vc2UgY29tcGFyYXRvciBmb3JtXG4vLyBsYXRlci5cbnZhciBIWVBIRU5SQU5HRSA9IFIrKztcbnNyY1tIWVBIRU5SQU5HRV0gPSAnXlxcXFxzKignICsgc3JjW1hSQU5HRVBMQUlOXSArICcpJyArXG4gICAgICAgICAgICAgICAgICAgJ1xcXFxzKy1cXFxccysnICtcbiAgICAgICAgICAgICAgICAgICAnKCcgKyBzcmNbWFJBTkdFUExBSU5dICsgJyknICtcbiAgICAgICAgICAgICAgICAgICAnXFxcXHMqJCc7XG5cbnZhciBIWVBIRU5SQU5HRUxPT1NFID0gUisrO1xuc3JjW0hZUEhFTlJBTkdFTE9PU0VdID0gJ15cXFxccyooJyArIHNyY1tYUkFOR0VQTEFJTkxPT1NFXSArICcpJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnXFxcXHMrLVxcXFxzKycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJygnICsgc3JjW1hSQU5HRVBMQUlOTE9PU0VdICsgJyknICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdcXFxccyokJztcblxuLy8gU3RhciByYW5nZXMgYmFzaWNhbGx5IGp1c3QgYWxsb3cgYW55dGhpbmcgYXQgYWxsLlxudmFyIFNUQVIgPSBSKys7XG5zcmNbU1RBUl0gPSAnKDx8Pik/PT9cXFxccypcXFxcKic7XG5cbi8vIENvbXBpbGUgdG8gYWN0dWFsIHJlZ2V4cCBvYmplY3RzLlxuLy8gQWxsIGFyZSBmbGFnLWZyZWUsIHVubGVzcyB0aGV5IHdlcmUgY3JlYXRlZCBhYm92ZSB3aXRoIGEgZmxhZy5cbmZvciAodmFyIGkgPSAwOyBpIDwgUjsgaSsrKSB7XG4gIGRlYnVnKGksIHNyY1tpXSk7XG4gIGlmICghcmVbaV0pXG4gICAgcmVbaV0gPSBuZXcgUmVnRXhwKHNyY1tpXSk7XG59XG5cbmV4cG9ydHMucGFyc2UgPSBwYXJzZTtcbmZ1bmN0aW9uIHBhcnNlKHZlcnNpb24sIGxvb3NlKSB7XG4gIGlmICh2ZXJzaW9uIGluc3RhbmNlb2YgU2VtVmVyKVxuICAgIHJldHVybiB2ZXJzaW9uO1xuXG4gIGlmICh0eXBlb2YgdmVyc2lvbiAhPT0gJ3N0cmluZycpXG4gICAgcmV0dXJuIG51bGw7XG5cbiAgaWYgKHZlcnNpb24ubGVuZ3RoID4gTUFYX0xFTkdUSClcbiAgICByZXR1cm4gbnVsbDtcblxuICB2YXIgciA9IGxvb3NlID8gcmVbTE9PU0VdIDogcmVbRlVMTF07XG4gIGlmICghci50ZXN0KHZlcnNpb24pKVxuICAgIHJldHVybiBudWxsO1xuXG4gIHRyeSB7XG4gICAgcmV0dXJuIG5ldyBTZW1WZXIodmVyc2lvbiwgbG9vc2UpO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydHMudmFsaWQgPSB2YWxpZDtcbmZ1bmN0aW9uIHZhbGlkKHZlcnNpb24sIGxvb3NlKSB7XG4gIHZhciB2ID0gcGFyc2UodmVyc2lvbiwgbG9vc2UpO1xuICByZXR1cm4gdiA/IHYudmVyc2lvbiA6IG51bGw7XG59XG5cblxuZXhwb3J0cy5jbGVhbiA9IGNsZWFuO1xuZnVuY3Rpb24gY2xlYW4odmVyc2lvbiwgbG9vc2UpIHtcbiAgdmFyIHMgPSBwYXJzZSh2ZXJzaW9uLnRyaW0oKS5yZXBsYWNlKC9eWz12XSsvLCAnJyksIGxvb3NlKTtcbiAgcmV0dXJuIHMgPyBzLnZlcnNpb24gOiBudWxsO1xufVxuXG5leHBvcnRzLlNlbVZlciA9IFNlbVZlcjtcblxuZnVuY3Rpb24gU2VtVmVyKHZlcnNpb24sIGxvb3NlKSB7XG4gIGlmICh2ZXJzaW9uIGluc3RhbmNlb2YgU2VtVmVyKSB7XG4gICAgaWYgKHZlcnNpb24ubG9vc2UgPT09IGxvb3NlKVxuICAgICAgcmV0dXJuIHZlcnNpb247XG4gICAgZWxzZVxuICAgICAgdmVyc2lvbiA9IHZlcnNpb24udmVyc2lvbjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmVyc2lvbiAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIFZlcnNpb246ICcgKyB2ZXJzaW9uKTtcbiAgfVxuXG4gIGlmICh2ZXJzaW9uLmxlbmd0aCA+IE1BWF9MRU5HVEgpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmVyc2lvbiBpcyBsb25nZXIgdGhhbiAnICsgTUFYX0xFTkdUSCArICcgY2hhcmFjdGVycycpXG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNlbVZlcikpXG4gICAgcmV0dXJuIG5ldyBTZW1WZXIodmVyc2lvbiwgbG9vc2UpO1xuXG4gIGRlYnVnKCdTZW1WZXInLCB2ZXJzaW9uLCBsb29zZSk7XG4gIHRoaXMubG9vc2UgPSBsb29zZTtcbiAgdmFyIG0gPSB2ZXJzaW9uLnRyaW0oKS5tYXRjaChsb29zZSA/IHJlW0xPT1NFXSA6IHJlW0ZVTExdKTtcblxuICBpZiAoIW0pXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBWZXJzaW9uOiAnICsgdmVyc2lvbik7XG5cbiAgdGhpcy5yYXcgPSB2ZXJzaW9uO1xuXG4gIC8vIHRoZXNlIGFyZSBhY3R1YWxseSBudW1iZXJzXG4gIHRoaXMubWFqb3IgPSArbVsxXTtcbiAgdGhpcy5taW5vciA9ICttWzJdO1xuICB0aGlzLnBhdGNoID0gK21bM107XG5cbiAgaWYgKHRoaXMubWFqb3IgPiBNQVhfU0FGRV9JTlRFR0VSIHx8IHRoaXMubWFqb3IgPCAwKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgbWFqb3IgdmVyc2lvbicpXG5cbiAgaWYgKHRoaXMubWlub3IgPiBNQVhfU0FGRV9JTlRFR0VSIHx8IHRoaXMubWlub3IgPCAwKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgbWlub3IgdmVyc2lvbicpXG5cbiAgaWYgKHRoaXMucGF0Y2ggPiBNQVhfU0FGRV9JTlRFR0VSIHx8IHRoaXMucGF0Y2ggPCAwKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgcGF0Y2ggdmVyc2lvbicpXG5cbiAgLy8gbnVtYmVyaWZ5IGFueSBwcmVyZWxlYXNlIG51bWVyaWMgaWRzXG4gIGlmICghbVs0XSlcbiAgICB0aGlzLnByZXJlbGVhc2UgPSBbXTtcbiAgZWxzZVxuICAgIHRoaXMucHJlcmVsZWFzZSA9IG1bNF0uc3BsaXQoJy4nKS5tYXAoZnVuY3Rpb24oaWQpIHtcbiAgICAgIGlmICgvXlswLTldKyQvLnRlc3QoaWQpKSB7XG4gICAgICAgIHZhciBudW0gPSAraWQ7XG4gICAgICAgIGlmIChudW0gPj0gMCAmJiBudW0gPCBNQVhfU0FGRV9JTlRFR0VSKVxuICAgICAgICAgIHJldHVybiBudW07XG4gICAgICB9XG4gICAgICByZXR1cm4gaWQ7XG4gICAgfSk7XG5cbiAgdGhpcy5idWlsZCA9IG1bNV0gPyBtWzVdLnNwbGl0KCcuJykgOiBbXTtcbiAgdGhpcy5mb3JtYXQoKTtcbn1cblxuU2VtVmVyLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy52ZXJzaW9uID0gdGhpcy5tYWpvciArICcuJyArIHRoaXMubWlub3IgKyAnLicgKyB0aGlzLnBhdGNoO1xuICBpZiAodGhpcy5wcmVyZWxlYXNlLmxlbmd0aClcbiAgICB0aGlzLnZlcnNpb24gKz0gJy0nICsgdGhpcy5wcmVyZWxlYXNlLmpvaW4oJy4nKTtcbiAgcmV0dXJuIHRoaXMudmVyc2lvbjtcbn07XG5cblNlbVZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudmVyc2lvbjtcbn07XG5cblNlbVZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gIGRlYnVnKCdTZW1WZXIuY29tcGFyZScsIHRoaXMudmVyc2lvbiwgdGhpcy5sb29zZSwgb3RoZXIpO1xuICBpZiAoIShvdGhlciBpbnN0YW5jZW9mIFNlbVZlcikpXG4gICAgb3RoZXIgPSBuZXcgU2VtVmVyKG90aGVyLCB0aGlzLmxvb3NlKTtcblxuICByZXR1cm4gdGhpcy5jb21wYXJlTWFpbihvdGhlcikgfHwgdGhpcy5jb21wYXJlUHJlKG90aGVyKTtcbn07XG5cblNlbVZlci5wcm90b3R5cGUuY29tcGFyZU1haW4gPSBmdW5jdGlvbihvdGhlcikge1xuICBpZiAoIShvdGhlciBpbnN0YW5jZW9mIFNlbVZlcikpXG4gICAgb3RoZXIgPSBuZXcgU2VtVmVyKG90aGVyLCB0aGlzLmxvb3NlKTtcblxuICByZXR1cm4gY29tcGFyZUlkZW50aWZpZXJzKHRoaXMubWFqb3IsIG90aGVyLm1ham9yKSB8fFxuICAgICAgICAgY29tcGFyZUlkZW50aWZpZXJzKHRoaXMubWlub3IsIG90aGVyLm1pbm9yKSB8fFxuICAgICAgICAgY29tcGFyZUlkZW50aWZpZXJzKHRoaXMucGF0Y2gsIG90aGVyLnBhdGNoKTtcbn07XG5cblNlbVZlci5wcm90b3R5cGUuY29tcGFyZVByZSA9IGZ1bmN0aW9uKG90aGVyKSB7XG4gIGlmICghKG90aGVyIGluc3RhbmNlb2YgU2VtVmVyKSlcbiAgICBvdGhlciA9IG5ldyBTZW1WZXIob3RoZXIsIHRoaXMubG9vc2UpO1xuXG4gIC8vIE5PVCBoYXZpbmcgYSBwcmVyZWxlYXNlIGlzID4gaGF2aW5nIG9uZVxuICBpZiAodGhpcy5wcmVyZWxlYXNlLmxlbmd0aCAmJiAhb3RoZXIucHJlcmVsZWFzZS5sZW5ndGgpXG4gICAgcmV0dXJuIC0xO1xuICBlbHNlIGlmICghdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCAmJiBvdGhlci5wcmVyZWxlYXNlLmxlbmd0aClcbiAgICByZXR1cm4gMTtcbiAgZWxzZSBpZiAoIXRoaXMucHJlcmVsZWFzZS5sZW5ndGggJiYgIW90aGVyLnByZXJlbGVhc2UubGVuZ3RoKVxuICAgIHJldHVybiAwO1xuXG4gIHZhciBpID0gMDtcbiAgZG8ge1xuICAgIHZhciBhID0gdGhpcy5wcmVyZWxlYXNlW2ldO1xuICAgIHZhciBiID0gb3RoZXIucHJlcmVsZWFzZVtpXTtcbiAgICBkZWJ1ZygncHJlcmVsZWFzZSBjb21wYXJlJywgaSwgYSwgYik7XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZCAmJiBiID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gMDtcbiAgICBlbHNlIGlmIChiID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChhID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAoYSA9PT0gYilcbiAgICAgIGNvbnRpbnVlO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBjb21wYXJlSWRlbnRpZmllcnMoYSwgYik7XG4gIH0gd2hpbGUgKCsraSk7XG59O1xuXG4vLyBwcmVtaW5vciB3aWxsIGJ1bXAgdGhlIHZlcnNpb24gdXAgdG8gdGhlIG5leHQgbWlub3IgcmVsZWFzZSwgYW5kIGltbWVkaWF0ZWx5XG4vLyBkb3duIHRvIHByZS1yZWxlYXNlLiBwcmVtYWpvciBhbmQgcHJlcGF0Y2ggd29yayB0aGUgc2FtZSB3YXkuXG5TZW1WZXIucHJvdG90eXBlLmluYyA9IGZ1bmN0aW9uKHJlbGVhc2UsIGlkZW50aWZpZXIpIHtcbiAgc3dpdGNoIChyZWxlYXNlKSB7XG4gICAgY2FzZSAncHJlbWFqb3InOlxuICAgICAgdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLnBhdGNoID0gMDtcbiAgICAgIHRoaXMubWlub3IgPSAwO1xuICAgICAgdGhpcy5tYWpvcisrO1xuICAgICAgdGhpcy5pbmMoJ3ByZScsIGlkZW50aWZpZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncHJlbWlub3InOlxuICAgICAgdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLnBhdGNoID0gMDtcbiAgICAgIHRoaXMubWlub3IrKztcbiAgICAgIHRoaXMuaW5jKCdwcmUnLCBpZGVudGlmaWVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3ByZXBhdGNoJzpcbiAgICAgIC8vIElmIHRoaXMgaXMgYWxyZWFkeSBhIHByZXJlbGVhc2UsIGl0IHdpbGwgYnVtcCB0byB0aGUgbmV4dCB2ZXJzaW9uXG4gICAgICAvLyBkcm9wIGFueSBwcmVyZWxlYXNlcyB0aGF0IG1pZ2h0IGFscmVhZHkgZXhpc3QsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICAgICAgLy8gcmVsZXZhbnQgYXQgdGhpcyBwb2ludC5cbiAgICAgIHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPSAwO1xuICAgICAgdGhpcy5pbmMoJ3BhdGNoJywgaWRlbnRpZmllcik7XG4gICAgICB0aGlzLmluYygncHJlJywgaWRlbnRpZmllcik7XG4gICAgICBicmVhaztcbiAgICAvLyBJZiB0aGUgaW5wdXQgaXMgYSBub24tcHJlcmVsZWFzZSB2ZXJzaW9uLCB0aGlzIGFjdHMgdGhlIHNhbWUgYXNcbiAgICAvLyBwcmVwYXRjaC5cbiAgICBjYXNlICdwcmVyZWxlYXNlJzpcbiAgICAgIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwKVxuICAgICAgICB0aGlzLmluYygncGF0Y2gnLCBpZGVudGlmaWVyKTtcbiAgICAgIHRoaXMuaW5jKCdwcmUnLCBpZGVudGlmaWVyKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnbWFqb3InOlxuICAgICAgLy8gSWYgdGhpcyBpcyBhIHByZS1tYWpvciB2ZXJzaW9uLCBidW1wIHVwIHRvIHRoZSBzYW1lIG1ham9yIHZlcnNpb24uXG4gICAgICAvLyBPdGhlcndpc2UgaW5jcmVtZW50IG1ham9yLlxuICAgICAgLy8gMS4wLjAtNSBidW1wcyB0byAxLjAuMFxuICAgICAgLy8gMS4xLjAgYnVtcHMgdG8gMi4wLjBcbiAgICAgIGlmICh0aGlzLm1pbm9yICE9PSAwIHx8IHRoaXMucGF0Y2ggIT09IDAgfHwgdGhpcy5wcmVyZWxlYXNlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgdGhpcy5tYWpvcisrO1xuICAgICAgdGhpcy5taW5vciA9IDA7XG4gICAgICB0aGlzLnBhdGNoID0gMDtcbiAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtdO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWlub3InOlxuICAgICAgLy8gSWYgdGhpcyBpcyBhIHByZS1taW5vciB2ZXJzaW9uLCBidW1wIHVwIHRvIHRoZSBzYW1lIG1pbm9yIHZlcnNpb24uXG4gICAgICAvLyBPdGhlcndpc2UgaW5jcmVtZW50IG1pbm9yLlxuICAgICAgLy8gMS4yLjAtNSBidW1wcyB0byAxLjIuMFxuICAgICAgLy8gMS4yLjEgYnVtcHMgdG8gMS4zLjBcbiAgICAgIGlmICh0aGlzLnBhdGNoICE9PSAwIHx8IHRoaXMucHJlcmVsZWFzZS5sZW5ndGggPT09IDApXG4gICAgICAgIHRoaXMubWlub3IrKztcbiAgICAgIHRoaXMucGF0Y2ggPSAwO1xuICAgICAgdGhpcy5wcmVyZWxlYXNlID0gW107XG4gICAgICBicmVhaztcbiAgICBjYXNlICdwYXRjaCc6XG4gICAgICAvLyBJZiB0aGlzIGlzIG5vdCBhIHByZS1yZWxlYXNlIHZlcnNpb24sIGl0IHdpbGwgaW5jcmVtZW50IHRoZSBwYXRjaC5cbiAgICAgIC8vIElmIGl0IGlzIGEgcHJlLXJlbGVhc2UgaXQgd2lsbCBidW1wIHVwIHRvIHRoZSBzYW1lIHBhdGNoIHZlcnNpb24uXG4gICAgICAvLyAxLjIuMC01IHBhdGNoZXMgdG8gMS4yLjBcbiAgICAgIC8vIDEuMi4wIHBhdGNoZXMgdG8gMS4yLjFcbiAgICAgIGlmICh0aGlzLnByZXJlbGVhc2UubGVuZ3RoID09PSAwKVxuICAgICAgICB0aGlzLnBhdGNoKys7XG4gICAgICB0aGlzLnByZXJlbGVhc2UgPSBbXTtcbiAgICAgIGJyZWFrO1xuICAgIC8vIFRoaXMgcHJvYmFibHkgc2hvdWxkbid0IGJlIHVzZWQgcHVibGljbHkuXG4gICAgLy8gMS4wLjAgXCJwcmVcIiB3b3VsZCBiZWNvbWUgMS4wLjAtMCB3aGljaCBpcyB0aGUgd3JvbmcgZGlyZWN0aW9uLlxuICAgIGNhc2UgJ3ByZSc6XG4gICAgICBpZiAodGhpcy5wcmVyZWxlYXNlLmxlbmd0aCA9PT0gMClcbiAgICAgICAgdGhpcy5wcmVyZWxlYXNlID0gWzBdO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5wcmVyZWxlYXNlLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKC0taSA+PSAwKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnByZXJlbGVhc2VbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aGlzLnByZXJlbGVhc2VbaV0rKztcbiAgICAgICAgICAgIGkgPSAtMjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGkgPT09IC0xKSAvLyBkaWRuJ3QgaW5jcmVtZW50IGFueXRoaW5nXG4gICAgICAgICAgdGhpcy5wcmVyZWxlYXNlLnB1c2goMCk7XG4gICAgICB9XG4gICAgICBpZiAoaWRlbnRpZmllcikge1xuICAgICAgICAvLyAxLjIuMC1iZXRhLjEgYnVtcHMgdG8gMS4yLjAtYmV0YS4yLFxuICAgICAgICAvLyAxLjIuMC1iZXRhLmZvb2JseiBvciAxLjIuMC1iZXRhIGJ1bXBzIHRvIDEuMi4wLWJldGEuMFxuICAgICAgICBpZiAodGhpcy5wcmVyZWxlYXNlWzBdID09PSBpZGVudGlmaWVyKSB7XG4gICAgICAgICAgaWYgKGlzTmFOKHRoaXMucHJlcmVsZWFzZVsxXSkpXG4gICAgICAgICAgICB0aGlzLnByZXJlbGVhc2UgPSBbaWRlbnRpZmllciwgMF07XG4gICAgICAgIH0gZWxzZVxuICAgICAgICAgIHRoaXMucHJlcmVsZWFzZSA9IFtpZGVudGlmaWVyLCAwXTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBpbmNyZW1lbnQgYXJndW1lbnQ6ICcgKyByZWxlYXNlKTtcbiAgfVxuICB0aGlzLmZvcm1hdCgpO1xuICB0aGlzLnJhdyA9IHRoaXMudmVyc2lvbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5leHBvcnRzLmluYyA9IGluYztcbmZ1bmN0aW9uIGluYyh2ZXJzaW9uLCByZWxlYXNlLCBsb29zZSwgaWRlbnRpZmllcikge1xuICBpZiAodHlwZW9mKGxvb3NlKSA9PT0gJ3N0cmluZycpIHtcbiAgICBpZGVudGlmaWVyID0gbG9vc2U7XG4gICAgbG9vc2UgPSB1bmRlZmluZWQ7XG4gIH1cblxuICB0cnkge1xuICAgIHJldHVybiBuZXcgU2VtVmVyKHZlcnNpb24sIGxvb3NlKS5pbmMocmVsZWFzZSwgaWRlbnRpZmllcikudmVyc2lvbjtcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnRzLmRpZmYgPSBkaWZmO1xuZnVuY3Rpb24gZGlmZih2ZXJzaW9uMSwgdmVyc2lvbjIpIHtcbiAgaWYgKGVxKHZlcnNpb24xLCB2ZXJzaW9uMikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICB2YXIgdjEgPSBwYXJzZSh2ZXJzaW9uMSk7XG4gICAgdmFyIHYyID0gcGFyc2UodmVyc2lvbjIpO1xuICAgIGlmICh2MS5wcmVyZWxlYXNlLmxlbmd0aCB8fCB2Mi5wcmVyZWxlYXNlLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIga2V5IGluIHYxKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICdtYWpvcicgfHwga2V5ID09PSAnbWlub3InIHx8IGtleSA9PT0gJ3BhdGNoJykge1xuICAgICAgICAgIGlmICh2MVtrZXldICE9PSB2MltrZXldKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3ByZScra2V5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuICdwcmVyZWxlYXNlJztcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIHYxKSB7XG4gICAgICBpZiAoa2V5ID09PSAnbWFqb3InIHx8IGtleSA9PT0gJ21pbm9yJyB8fCBrZXkgPT09ICdwYXRjaCcpIHtcbiAgICAgICAgaWYgKHYxW2tleV0gIT09IHYyW2tleV0pIHtcbiAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydHMuY29tcGFyZUlkZW50aWZpZXJzID0gY29tcGFyZUlkZW50aWZpZXJzO1xuXG52YXIgbnVtZXJpYyA9IC9eWzAtOV0rJC87XG5mdW5jdGlvbiBjb21wYXJlSWRlbnRpZmllcnMoYSwgYikge1xuICB2YXIgYW51bSA9IG51bWVyaWMudGVzdChhKTtcbiAgdmFyIGJudW0gPSBudW1lcmljLnRlc3QoYik7XG5cbiAgaWYgKGFudW0gJiYgYm51bSkge1xuICAgIGEgPSArYTtcbiAgICBiID0gK2I7XG4gIH1cblxuICByZXR1cm4gKGFudW0gJiYgIWJudW0pID8gLTEgOlxuICAgICAgICAgKGJudW0gJiYgIWFudW0pID8gMSA6XG4gICAgICAgICBhIDwgYiA/IC0xIDpcbiAgICAgICAgIGEgPiBiID8gMSA6XG4gICAgICAgICAwO1xufVxuXG5leHBvcnRzLnJjb21wYXJlSWRlbnRpZmllcnMgPSByY29tcGFyZUlkZW50aWZpZXJzO1xuZnVuY3Rpb24gcmNvbXBhcmVJZGVudGlmaWVycyhhLCBiKSB7XG4gIHJldHVybiBjb21wYXJlSWRlbnRpZmllcnMoYiwgYSk7XG59XG5cbmV4cG9ydHMubWFqb3IgPSBtYWpvcjtcbmZ1bmN0aW9uIG1ham9yKGEsIGxvb3NlKSB7XG4gIHJldHVybiBuZXcgU2VtVmVyKGEsIGxvb3NlKS5tYWpvcjtcbn1cblxuZXhwb3J0cy5taW5vciA9IG1pbm9yO1xuZnVuY3Rpb24gbWlub3IoYSwgbG9vc2UpIHtcbiAgcmV0dXJuIG5ldyBTZW1WZXIoYSwgbG9vc2UpLm1pbm9yO1xufVxuXG5leHBvcnRzLnBhdGNoID0gcGF0Y2g7XG5mdW5jdGlvbiBwYXRjaChhLCBsb29zZSkge1xuICByZXR1cm4gbmV3IFNlbVZlcihhLCBsb29zZSkucGF0Y2g7XG59XG5cbmV4cG9ydHMuY29tcGFyZSA9IGNvbXBhcmU7XG5mdW5jdGlvbiBjb21wYXJlKGEsIGIsIGxvb3NlKSB7XG4gIHJldHVybiBuZXcgU2VtVmVyKGEsIGxvb3NlKS5jb21wYXJlKG5ldyBTZW1WZXIoYiwgbG9vc2UpKTtcbn1cblxuZXhwb3J0cy5jb21wYXJlTG9vc2UgPSBjb21wYXJlTG9vc2U7XG5mdW5jdGlvbiBjb21wYXJlTG9vc2UoYSwgYikge1xuICByZXR1cm4gY29tcGFyZShhLCBiLCB0cnVlKTtcbn1cblxuZXhwb3J0cy5yY29tcGFyZSA9IHJjb21wYXJlO1xuZnVuY3Rpb24gcmNvbXBhcmUoYSwgYiwgbG9vc2UpIHtcbiAgcmV0dXJuIGNvbXBhcmUoYiwgYSwgbG9vc2UpO1xufVxuXG5leHBvcnRzLnNvcnQgPSBzb3J0O1xuZnVuY3Rpb24gc29ydChsaXN0LCBsb29zZSkge1xuICByZXR1cm4gbGlzdC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gZXhwb3J0cy5jb21wYXJlKGEsIGIsIGxvb3NlKTtcbiAgfSk7XG59XG5cbmV4cG9ydHMucnNvcnQgPSByc29ydDtcbmZ1bmN0aW9uIHJzb3J0KGxpc3QsIGxvb3NlKSB7XG4gIHJldHVybiBsaXN0LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBleHBvcnRzLnJjb21wYXJlKGEsIGIsIGxvb3NlKTtcbiAgfSk7XG59XG5cbmV4cG9ydHMuZ3QgPSBndDtcbmZ1bmN0aW9uIGd0KGEsIGIsIGxvb3NlKSB7XG4gIHJldHVybiBjb21wYXJlKGEsIGIsIGxvb3NlKSA+IDA7XG59XG5cbmV4cG9ydHMubHQgPSBsdDtcbmZ1bmN0aW9uIGx0KGEsIGIsIGxvb3NlKSB7XG4gIHJldHVybiBjb21wYXJlKGEsIGIsIGxvb3NlKSA8IDA7XG59XG5cbmV4cG9ydHMuZXEgPSBlcTtcbmZ1bmN0aW9uIGVxKGEsIGIsIGxvb3NlKSB7XG4gIHJldHVybiBjb21wYXJlKGEsIGIsIGxvb3NlKSA9PT0gMDtcbn1cblxuZXhwb3J0cy5uZXEgPSBuZXE7XG5mdW5jdGlvbiBuZXEoYSwgYiwgbG9vc2UpIHtcbiAgcmV0dXJuIGNvbXBhcmUoYSwgYiwgbG9vc2UpICE9PSAwO1xufVxuXG5leHBvcnRzLmd0ZSA9IGd0ZTtcbmZ1bmN0aW9uIGd0ZShhLCBiLCBsb29zZSkge1xuICByZXR1cm4gY29tcGFyZShhLCBiLCBsb29zZSkgPj0gMDtcbn1cblxuZXhwb3J0cy5sdGUgPSBsdGU7XG5mdW5jdGlvbiBsdGUoYSwgYiwgbG9vc2UpIHtcbiAgcmV0dXJuIGNvbXBhcmUoYSwgYiwgbG9vc2UpIDw9IDA7XG59XG5cbmV4cG9ydHMuY21wID0gY21wO1xuZnVuY3Rpb24gY21wKGEsIG9wLCBiLCBsb29zZSkge1xuICB2YXIgcmV0O1xuICBzd2l0Y2ggKG9wKSB7XG4gICAgY2FzZSAnPT09JzpcbiAgICAgIGlmICh0eXBlb2YgYSA9PT0gJ29iamVjdCcpIGEgPSBhLnZlcnNpb247XG4gICAgICBpZiAodHlwZW9mIGIgPT09ICdvYmplY3QnKSBiID0gYi52ZXJzaW9uO1xuICAgICAgcmV0ID0gYSA9PT0gYjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJyE9PSc6XG4gICAgICBpZiAodHlwZW9mIGEgPT09ICdvYmplY3QnKSBhID0gYS52ZXJzaW9uO1xuICAgICAgaWYgKHR5cGVvZiBiID09PSAnb2JqZWN0JykgYiA9IGIudmVyc2lvbjtcbiAgICAgIHJldCA9IGEgIT09IGI7XG4gICAgICBicmVhaztcbiAgICBjYXNlICcnOiBjYXNlICc9JzogY2FzZSAnPT0nOiByZXQgPSBlcShhLCBiLCBsb29zZSk7IGJyZWFrO1xuICAgIGNhc2UgJyE9JzogcmV0ID0gbmVxKGEsIGIsIGxvb3NlKTsgYnJlYWs7XG4gICAgY2FzZSAnPic6IHJldCA9IGd0KGEsIGIsIGxvb3NlKTsgYnJlYWs7XG4gICAgY2FzZSAnPj0nOiByZXQgPSBndGUoYSwgYiwgbG9vc2UpOyBicmVhaztcbiAgICBjYXNlICc8JzogcmV0ID0gbHQoYSwgYiwgbG9vc2UpOyBicmVhaztcbiAgICBjYXNlICc8PSc6IHJldCA9IGx0ZShhLCBiLCBsb29zZSk7IGJyZWFrO1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb3BlcmF0b3I6ICcgKyBvcCk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZXhwb3J0cy5Db21wYXJhdG9yID0gQ29tcGFyYXRvcjtcbmZ1bmN0aW9uIENvbXBhcmF0b3IoY29tcCwgbG9vc2UpIHtcbiAgaWYgKGNvbXAgaW5zdGFuY2VvZiBDb21wYXJhdG9yKSB7XG4gICAgaWYgKGNvbXAubG9vc2UgPT09IGxvb3NlKVxuICAgICAgcmV0dXJuIGNvbXA7XG4gICAgZWxzZVxuICAgICAgY29tcCA9IGNvbXAudmFsdWU7XG4gIH1cblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ29tcGFyYXRvcikpXG4gICAgcmV0dXJuIG5ldyBDb21wYXJhdG9yKGNvbXAsIGxvb3NlKTtcblxuICBkZWJ1ZygnY29tcGFyYXRvcicsIGNvbXAsIGxvb3NlKTtcbiAgdGhpcy5sb29zZSA9IGxvb3NlO1xuICB0aGlzLnBhcnNlKGNvbXApO1xuXG4gIGlmICh0aGlzLnNlbXZlciA9PT0gQU5ZKVxuICAgIHRoaXMudmFsdWUgPSAnJztcbiAgZWxzZVxuICAgIHRoaXMudmFsdWUgPSB0aGlzLm9wZXJhdG9yICsgdGhpcy5zZW12ZXIudmVyc2lvbjtcblxuICBkZWJ1ZygnY29tcCcsIHRoaXMpO1xufVxuXG52YXIgQU5ZID0ge307XG5Db21wYXJhdG9yLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKGNvbXApIHtcbiAgdmFyIHIgPSB0aGlzLmxvb3NlID8gcmVbQ09NUEFSQVRPUkxPT1NFXSA6IHJlW0NPTVBBUkFUT1JdO1xuICB2YXIgbSA9IGNvbXAubWF0Y2gocik7XG5cbiAgaWYgKCFtKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgY29tcGFyYXRvcjogJyArIGNvbXApO1xuXG4gIHRoaXMub3BlcmF0b3IgPSBtWzFdO1xuICBpZiAodGhpcy5vcGVyYXRvciA9PT0gJz0nKVxuICAgIHRoaXMub3BlcmF0b3IgPSAnJztcblxuICAvLyBpZiBpdCBsaXRlcmFsbHkgaXMganVzdCAnPicgb3IgJycgdGhlbiBhbGxvdyBhbnl0aGluZy5cbiAgaWYgKCFtWzJdKVxuICAgIHRoaXMuc2VtdmVyID0gQU5ZO1xuICBlbHNlXG4gICAgdGhpcy5zZW12ZXIgPSBuZXcgU2VtVmVyKG1bMl0sIHRoaXMubG9vc2UpO1xufTtcblxuQ29tcGFyYXRvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudmFsdWU7XG59O1xuXG5Db21wYXJhdG9yLnByb3RvdHlwZS50ZXN0ID0gZnVuY3Rpb24odmVyc2lvbikge1xuICBkZWJ1ZygnQ29tcGFyYXRvci50ZXN0JywgdmVyc2lvbiwgdGhpcy5sb29zZSk7XG5cbiAgaWYgKHRoaXMuc2VtdmVyID09PSBBTlkpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKHR5cGVvZiB2ZXJzaW9uID09PSAnc3RyaW5nJylcbiAgICB2ZXJzaW9uID0gbmV3IFNlbVZlcih2ZXJzaW9uLCB0aGlzLmxvb3NlKTtcblxuICByZXR1cm4gY21wKHZlcnNpb24sIHRoaXMub3BlcmF0b3IsIHRoaXMuc2VtdmVyLCB0aGlzLmxvb3NlKTtcbn07XG5cbkNvbXBhcmF0b3IucHJvdG90eXBlLmludGVyc2VjdHMgPSBmdW5jdGlvbihjb21wLCBsb29zZSkge1xuICBpZiAoIShjb21wIGluc3RhbmNlb2YgQ29tcGFyYXRvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhIENvbXBhcmF0b3IgaXMgcmVxdWlyZWQnKTtcbiAgfVxuXG4gIHZhciByYW5nZVRtcDtcblxuICBpZiAodGhpcy5vcGVyYXRvciA9PT0gJycpIHtcbiAgICByYW5nZVRtcCA9IG5ldyBSYW5nZShjb21wLnZhbHVlLCBsb29zZSk7XG4gICAgcmV0dXJuIHNhdGlzZmllcyh0aGlzLnZhbHVlLCByYW5nZVRtcCwgbG9vc2UpO1xuICB9IGVsc2UgaWYgKGNvbXAub3BlcmF0b3IgPT09ICcnKSB7XG4gICAgcmFuZ2VUbXAgPSBuZXcgUmFuZ2UodGhpcy52YWx1ZSwgbG9vc2UpO1xuICAgIHJldHVybiBzYXRpc2ZpZXMoY29tcC5zZW12ZXIsIHJhbmdlVG1wLCBsb29zZSk7XG4gIH1cblxuICB2YXIgc2FtZURpcmVjdGlvbkluY3JlYXNpbmcgPVxuICAgICh0aGlzLm9wZXJhdG9yID09PSAnPj0nIHx8IHRoaXMub3BlcmF0b3IgPT09ICc+JykgJiZcbiAgICAoY29tcC5vcGVyYXRvciA9PT0gJz49JyB8fCBjb21wLm9wZXJhdG9yID09PSAnPicpO1xuICB2YXIgc2FtZURpcmVjdGlvbkRlY3JlYXNpbmcgPVxuICAgICh0aGlzLm9wZXJhdG9yID09PSAnPD0nIHx8IHRoaXMub3BlcmF0b3IgPT09ICc8JykgJiZcbiAgICAoY29tcC5vcGVyYXRvciA9PT0gJzw9JyB8fCBjb21wLm9wZXJhdG9yID09PSAnPCcpO1xuICB2YXIgc2FtZVNlbVZlciA9IHRoaXMuc2VtdmVyLnZlcnNpb24gPT09IGNvbXAuc2VtdmVyLnZlcnNpb247XG4gIHZhciBkaWZmZXJlbnREaXJlY3Rpb25zSW5jbHVzaXZlID1cbiAgICAodGhpcy5vcGVyYXRvciA9PT0gJz49JyB8fCB0aGlzLm9wZXJhdG9yID09PSAnPD0nKSAmJlxuICAgIChjb21wLm9wZXJhdG9yID09PSAnPj0nIHx8IGNvbXAub3BlcmF0b3IgPT09ICc8PScpO1xuICB2YXIgb3Bwb3NpdGVEaXJlY3Rpb25zTGVzc1RoYW4gPVxuICAgIGNtcCh0aGlzLnNlbXZlciwgJzwnLCBjb21wLnNlbXZlciwgbG9vc2UpICYmXG4gICAgKCh0aGlzLm9wZXJhdG9yID09PSAnPj0nIHx8IHRoaXMub3BlcmF0b3IgPT09ICc+JykgJiZcbiAgICAoY29tcC5vcGVyYXRvciA9PT0gJzw9JyB8fCBjb21wLm9wZXJhdG9yID09PSAnPCcpKTtcbiAgdmFyIG9wcG9zaXRlRGlyZWN0aW9uc0dyZWF0ZXJUaGFuID1cbiAgICBjbXAodGhpcy5zZW12ZXIsICc+JywgY29tcC5zZW12ZXIsIGxvb3NlKSAmJlxuICAgICgodGhpcy5vcGVyYXRvciA9PT0gJzw9JyB8fCB0aGlzLm9wZXJhdG9yID09PSAnPCcpICYmXG4gICAgKGNvbXAub3BlcmF0b3IgPT09ICc+PScgfHwgY29tcC5vcGVyYXRvciA9PT0gJz4nKSk7XG5cbiAgcmV0dXJuIHNhbWVEaXJlY3Rpb25JbmNyZWFzaW5nIHx8IHNhbWVEaXJlY3Rpb25EZWNyZWFzaW5nIHx8XG4gICAgKHNhbWVTZW1WZXIgJiYgZGlmZmVyZW50RGlyZWN0aW9uc0luY2x1c2l2ZSkgfHxcbiAgICBvcHBvc2l0ZURpcmVjdGlvbnNMZXNzVGhhbiB8fCBvcHBvc2l0ZURpcmVjdGlvbnNHcmVhdGVyVGhhbjtcbn07XG5cblxuZXhwb3J0cy5SYW5nZSA9IFJhbmdlO1xuZnVuY3Rpb24gUmFuZ2UocmFuZ2UsIGxvb3NlKSB7XG4gIGlmIChyYW5nZSBpbnN0YW5jZW9mIFJhbmdlKSB7XG4gICAgaWYgKHJhbmdlLmxvb3NlID09PSBsb29zZSkge1xuICAgICAgcmV0dXJuIHJhbmdlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IFJhbmdlKHJhbmdlLnJhdywgbG9vc2UpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChyYW5nZSBpbnN0YW5jZW9mIENvbXBhcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IFJhbmdlKHJhbmdlLnZhbHVlLCBsb29zZSk7XG4gIH1cblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmFuZ2UpKVxuICAgIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UsIGxvb3NlKTtcblxuICB0aGlzLmxvb3NlID0gbG9vc2U7XG5cbiAgLy8gRmlyc3QsIHNwbGl0IGJhc2VkIG9uIGJvb2xlYW4gb3IgfHxcbiAgdGhpcy5yYXcgPSByYW5nZTtcbiAgdGhpcy5zZXQgPSByYW5nZS5zcGxpdCgvXFxzKlxcfFxcfFxccyovKS5tYXAoZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5wYXJzZVJhbmdlKHJhbmdlLnRyaW0oKSk7XG4gIH0sIHRoaXMpLmZpbHRlcihmdW5jdGlvbihjKSB7XG4gICAgLy8gdGhyb3cgb3V0IGFueSB0aGF0IGFyZSBub3QgcmVsZXZhbnQgZm9yIHdoYXRldmVyIHJlYXNvblxuICAgIHJldHVybiBjLmxlbmd0aDtcbiAgfSk7XG5cbiAgaWYgKCF0aGlzLnNldC5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIFNlbVZlciBSYW5nZTogJyArIHJhbmdlKTtcbiAgfVxuXG4gIHRoaXMuZm9ybWF0KCk7XG59XG5cblJhbmdlLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yYW5nZSA9IHRoaXMuc2V0Lm1hcChmdW5jdGlvbihjb21wcykge1xuICAgIHJldHVybiBjb21wcy5qb2luKCcgJykudHJpbSgpO1xuICB9KS5qb2luKCd8fCcpLnRyaW0oKTtcbiAgcmV0dXJuIHRoaXMucmFuZ2U7XG59O1xuXG5SYW5nZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMucmFuZ2U7XG59O1xuXG5SYW5nZS5wcm90b3R5cGUucGFyc2VSYW5nZSA9IGZ1bmN0aW9uKHJhbmdlKSB7XG4gIHZhciBsb29zZSA9IHRoaXMubG9vc2U7XG4gIHJhbmdlID0gcmFuZ2UudHJpbSgpO1xuICBkZWJ1ZygncmFuZ2UnLCByYW5nZSwgbG9vc2UpO1xuICAvLyBgMS4yLjMgLSAxLjIuNGAgPT4gYD49MS4yLjMgPD0xLjIuNGBcbiAgdmFyIGhyID0gbG9vc2UgPyByZVtIWVBIRU5SQU5HRUxPT1NFXSA6IHJlW0hZUEhFTlJBTkdFXTtcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKGhyLCBoeXBoZW5SZXBsYWNlKTtcbiAgZGVidWcoJ2h5cGhlbiByZXBsYWNlJywgcmFuZ2UpO1xuICAvLyBgPiAxLjIuMyA8IDEuMi41YCA9PiBgPjEuMi4zIDwxLjIuNWBcbiAgcmFuZ2UgPSByYW5nZS5yZXBsYWNlKHJlW0NPTVBBUkFUT1JUUklNXSwgY29tcGFyYXRvclRyaW1SZXBsYWNlKTtcbiAgZGVidWcoJ2NvbXBhcmF0b3IgdHJpbScsIHJhbmdlLCByZVtDT01QQVJBVE9SVFJJTV0pO1xuXG4gIC8vIGB+IDEuMi4zYCA9PiBgfjEuMi4zYFxuICByYW5nZSA9IHJhbmdlLnJlcGxhY2UocmVbVElMREVUUklNXSwgdGlsZGVUcmltUmVwbGFjZSk7XG5cbiAgLy8gYF4gMS4yLjNgID0+IGBeMS4yLjNgXG4gIHJhbmdlID0gcmFuZ2UucmVwbGFjZShyZVtDQVJFVFRSSU1dLCBjYXJldFRyaW1SZXBsYWNlKTtcblxuICAvLyBub3JtYWxpemUgc3BhY2VzXG4gIHJhbmdlID0gcmFuZ2Uuc3BsaXQoL1xccysvKS5qb2luKCcgJyk7XG5cbiAgLy8gQXQgdGhpcyBwb2ludCwgdGhlIHJhbmdlIGlzIGNvbXBsZXRlbHkgdHJpbW1lZCBhbmRcbiAgLy8gcmVhZHkgdG8gYmUgc3BsaXQgaW50byBjb21wYXJhdG9ycy5cblxuICB2YXIgY29tcFJlID0gbG9vc2UgPyByZVtDT01QQVJBVE9STE9PU0VdIDogcmVbQ09NUEFSQVRPUl07XG4gIHZhciBzZXQgPSByYW5nZS5zcGxpdCgnICcpLm1hcChmdW5jdGlvbihjb21wKSB7XG4gICAgcmV0dXJuIHBhcnNlQ29tcGFyYXRvcihjb21wLCBsb29zZSk7XG4gIH0pLmpvaW4oJyAnKS5zcGxpdCgvXFxzKy8pO1xuICBpZiAodGhpcy5sb29zZSkge1xuICAgIC8vIGluIGxvb3NlIG1vZGUsIHRocm93IG91dCBhbnkgdGhhdCBhcmUgbm90IHZhbGlkIGNvbXBhcmF0b3JzXG4gICAgc2V0ID0gc2V0LmZpbHRlcihmdW5jdGlvbihjb21wKSB7XG4gICAgICByZXR1cm4gISFjb21wLm1hdGNoKGNvbXBSZSk7XG4gICAgfSk7XG4gIH1cbiAgc2V0ID0gc2V0Lm1hcChmdW5jdGlvbihjb21wKSB7XG4gICAgcmV0dXJuIG5ldyBDb21wYXJhdG9yKGNvbXAsIGxvb3NlKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHNldDtcbn07XG5cblJhbmdlLnByb3RvdHlwZS5pbnRlcnNlY3RzID0gZnVuY3Rpb24ocmFuZ2UsIGxvb3NlKSB7XG4gIGlmICghKHJhbmdlIGluc3RhbmNlb2YgUmFuZ2UpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYSBSYW5nZSBpcyByZXF1aXJlZCcpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuc2V0LnNvbWUoZnVuY3Rpb24odGhpc0NvbXBhcmF0b3JzKSB7XG4gICAgcmV0dXJuIHRoaXNDb21wYXJhdG9ycy5ldmVyeShmdW5jdGlvbih0aGlzQ29tcGFyYXRvcikge1xuICAgICAgcmV0dXJuIHJhbmdlLnNldC5zb21lKGZ1bmN0aW9uKHJhbmdlQ29tcGFyYXRvcnMpIHtcbiAgICAgICAgcmV0dXJuIHJhbmdlQ29tcGFyYXRvcnMuZXZlcnkoZnVuY3Rpb24ocmFuZ2VDb21wYXJhdG9yKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXNDb21wYXJhdG9yLmludGVyc2VjdHMocmFuZ2VDb21wYXJhdG9yLCBsb29zZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuLy8gTW9zdGx5IGp1c3QgZm9yIHRlc3RpbmcgYW5kIGxlZ2FjeSBBUEkgcmVhc29uc1xuZXhwb3J0cy50b0NvbXBhcmF0b3JzID0gdG9Db21wYXJhdG9ycztcbmZ1bmN0aW9uIHRvQ29tcGFyYXRvcnMocmFuZ2UsIGxvb3NlKSB7XG4gIHJldHVybiBuZXcgUmFuZ2UocmFuZ2UsIGxvb3NlKS5zZXQubWFwKGZ1bmN0aW9uKGNvbXApIHtcbiAgICByZXR1cm4gY29tcC5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgcmV0dXJuIGMudmFsdWU7XG4gICAgfSkuam9pbignICcpLnRyaW0oKS5zcGxpdCgnICcpO1xuICB9KTtcbn1cblxuLy8gY29tcHJpc2VkIG9mIHhyYW5nZXMsIHRpbGRlcywgc3RhcnMsIGFuZCBndGx0J3MgYXQgdGhpcyBwb2ludC5cbi8vIGFscmVhZHkgcmVwbGFjZWQgdGhlIGh5cGhlbiByYW5nZXNcbi8vIHR1cm4gaW50byBhIHNldCBvZiBKVVNUIGNvbXBhcmF0b3JzLlxuZnVuY3Rpb24gcGFyc2VDb21wYXJhdG9yKGNvbXAsIGxvb3NlKSB7XG4gIGRlYnVnKCdjb21wJywgY29tcCk7XG4gIGNvbXAgPSByZXBsYWNlQ2FyZXRzKGNvbXAsIGxvb3NlKTtcbiAgZGVidWcoJ2NhcmV0JywgY29tcCk7XG4gIGNvbXAgPSByZXBsYWNlVGlsZGVzKGNvbXAsIGxvb3NlKTtcbiAgZGVidWcoJ3RpbGRlcycsIGNvbXApO1xuICBjb21wID0gcmVwbGFjZVhSYW5nZXMoY29tcCwgbG9vc2UpO1xuICBkZWJ1ZygneHJhbmdlJywgY29tcCk7XG4gIGNvbXAgPSByZXBsYWNlU3RhcnMoY29tcCwgbG9vc2UpO1xuICBkZWJ1Zygnc3RhcnMnLCBjb21wKTtcbiAgcmV0dXJuIGNvbXA7XG59XG5cbmZ1bmN0aW9uIGlzWChpZCkge1xuICByZXR1cm4gIWlkIHx8IGlkLnRvTG93ZXJDYXNlKCkgPT09ICd4JyB8fCBpZCA9PT0gJyonO1xufVxuXG4vLyB+LCB+PiAtLT4gKiAoYW55LCBraW5kYSBzaWxseSlcbi8vIH4yLCB+Mi54LCB+Mi54LngsIH4+Miwgfj4yLnggfj4yLngueCAtLT4gPj0yLjAuMCA8My4wLjBcbi8vIH4yLjAsIH4yLjAueCwgfj4yLjAsIH4+Mi4wLnggLS0+ID49Mi4wLjAgPDIuMS4wXG4vLyB+MS4yLCB+MS4yLngsIH4+MS4yLCB+PjEuMi54IC0tPiA+PTEuMi4wIDwxLjMuMFxuLy8gfjEuMi4zLCB+PjEuMi4zIC0tPiA+PTEuMi4zIDwxLjMuMFxuLy8gfjEuMi4wLCB+PjEuMi4wIC0tPiA+PTEuMi4wIDwxLjMuMFxuZnVuY3Rpb24gcmVwbGFjZVRpbGRlcyhjb21wLCBsb29zZSkge1xuICByZXR1cm4gY29tcC50cmltKCkuc3BsaXQoL1xccysvKS5tYXAoZnVuY3Rpb24oY29tcCkge1xuICAgIHJldHVybiByZXBsYWNlVGlsZGUoY29tcCwgbG9vc2UpO1xuICB9KS5qb2luKCcgJyk7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VUaWxkZShjb21wLCBsb29zZSkge1xuICB2YXIgciA9IGxvb3NlID8gcmVbVElMREVMT09TRV0gOiByZVtUSUxERV07XG4gIHJldHVybiBjb21wLnJlcGxhY2UociwgZnVuY3Rpb24oXywgTSwgbSwgcCwgcHIpIHtcbiAgICBkZWJ1ZygndGlsZGUnLCBjb21wLCBfLCBNLCBtLCBwLCBwcik7XG4gICAgdmFyIHJldDtcblxuICAgIGlmIChpc1goTSkpXG4gICAgICByZXQgPSAnJztcbiAgICBlbHNlIGlmIChpc1gobSkpXG4gICAgICByZXQgPSAnPj0nICsgTSArICcuMC4wIDwnICsgKCtNICsgMSkgKyAnLjAuMCc7XG4gICAgZWxzZSBpZiAoaXNYKHApKVxuICAgICAgLy8gfjEuMiA9PSA+PTEuMi4wIDwxLjMuMFxuICAgICAgcmV0ID0gJz49JyArIE0gKyAnLicgKyBtICsgJy4wIDwnICsgTSArICcuJyArICgrbSArIDEpICsgJy4wJztcbiAgICBlbHNlIGlmIChwcikge1xuICAgICAgZGVidWcoJ3JlcGxhY2VUaWxkZSBwcicsIHByKTtcbiAgICAgIGlmIChwci5jaGFyQXQoMCkgIT09ICctJylcbiAgICAgICAgcHIgPSAnLScgKyBwcjtcbiAgICAgIHJldCA9ICc+PScgKyBNICsgJy4nICsgbSArICcuJyArIHAgKyBwciArXG4gICAgICAgICAgICAnIDwnICsgTSArICcuJyArICgrbSArIDEpICsgJy4wJztcbiAgICB9IGVsc2VcbiAgICAgIC8vIH4xLjIuMyA9PSA+PTEuMi4zIDwxLjMuMFxuICAgICAgcmV0ID0gJz49JyArIE0gKyAnLicgKyBtICsgJy4nICsgcCArXG4gICAgICAgICAgICAnIDwnICsgTSArICcuJyArICgrbSArIDEpICsgJy4wJztcblxuICAgIGRlYnVnKCd0aWxkZSByZXR1cm4nLCByZXQpO1xuICAgIHJldHVybiByZXQ7XG4gIH0pO1xufVxuXG4vLyBeIC0tPiAqIChhbnksIGtpbmRhIHNpbGx5KVxuLy8gXjIsIF4yLngsIF4yLngueCAtLT4gPj0yLjAuMCA8My4wLjBcbi8vIF4yLjAsIF4yLjAueCAtLT4gPj0yLjAuMCA8My4wLjBcbi8vIF4xLjIsIF4xLjIueCAtLT4gPj0xLjIuMCA8Mi4wLjBcbi8vIF4xLjIuMyAtLT4gPj0xLjIuMyA8Mi4wLjBcbi8vIF4xLjIuMCAtLT4gPj0xLjIuMCA8Mi4wLjBcbmZ1bmN0aW9uIHJlcGxhY2VDYXJldHMoY29tcCwgbG9vc2UpIHtcbiAgcmV0dXJuIGNvbXAudHJpbSgpLnNwbGl0KC9cXHMrLykubWFwKGZ1bmN0aW9uKGNvbXApIHtcbiAgICByZXR1cm4gcmVwbGFjZUNhcmV0KGNvbXAsIGxvb3NlKTtcbiAgfSkuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlQ2FyZXQoY29tcCwgbG9vc2UpIHtcbiAgZGVidWcoJ2NhcmV0JywgY29tcCwgbG9vc2UpO1xuICB2YXIgciA9IGxvb3NlID8gcmVbQ0FSRVRMT09TRV0gOiByZVtDQVJFVF07XG4gIHJldHVybiBjb21wLnJlcGxhY2UociwgZnVuY3Rpb24oXywgTSwgbSwgcCwgcHIpIHtcbiAgICBkZWJ1ZygnY2FyZXQnLCBjb21wLCBfLCBNLCBtLCBwLCBwcik7XG4gICAgdmFyIHJldDtcblxuICAgIGlmIChpc1goTSkpXG4gICAgICByZXQgPSAnJztcbiAgICBlbHNlIGlmIChpc1gobSkpXG4gICAgICByZXQgPSAnPj0nICsgTSArICcuMC4wIDwnICsgKCtNICsgMSkgKyAnLjAuMCc7XG4gICAgZWxzZSBpZiAoaXNYKHApKSB7XG4gICAgICBpZiAoTSA9PT0gJzAnKVxuICAgICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLjAgPCcgKyBNICsgJy4nICsgKCttICsgMSkgKyAnLjAnO1xuICAgICAgZWxzZVxuICAgICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLjAgPCcgKyAoK00gKyAxKSArICcuMC4wJztcbiAgICB9IGVsc2UgaWYgKHByKSB7XG4gICAgICBkZWJ1ZygncmVwbGFjZUNhcmV0IHByJywgcHIpO1xuICAgICAgaWYgKHByLmNoYXJBdCgwKSAhPT0gJy0nKVxuICAgICAgICBwciA9ICctJyArIHByO1xuICAgICAgaWYgKE0gPT09ICcwJykge1xuICAgICAgICBpZiAobSA9PT0gJzAnKVxuICAgICAgICAgIHJldCA9ICc+PScgKyBNICsgJy4nICsgbSArICcuJyArIHAgKyBwciArXG4gICAgICAgICAgICAgICAgJyA8JyArIE0gKyAnLicgKyBtICsgJy4nICsgKCtwICsgMSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLicgKyBwICsgcHIgK1xuICAgICAgICAgICAgICAgICcgPCcgKyBNICsgJy4nICsgKCttICsgMSkgKyAnLjAnO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldCA9ICc+PScgKyBNICsgJy4nICsgbSArICcuJyArIHAgKyBwciArXG4gICAgICAgICAgICAgICcgPCcgKyAoK00gKyAxKSArICcuMC4wJztcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWcoJ25vIHByJyk7XG4gICAgICBpZiAoTSA9PT0gJzAnKSB7XG4gICAgICAgIGlmIChtID09PSAnMCcpXG4gICAgICAgICAgcmV0ID0gJz49JyArIE0gKyAnLicgKyBtICsgJy4nICsgcCArXG4gICAgICAgICAgICAgICAgJyA8JyArIE0gKyAnLicgKyBtICsgJy4nICsgKCtwICsgMSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLicgKyBwICtcbiAgICAgICAgICAgICAgICAnIDwnICsgTSArICcuJyArICgrbSArIDEpICsgJy4wJztcbiAgICAgIH0gZWxzZVxuICAgICAgICByZXQgPSAnPj0nICsgTSArICcuJyArIG0gKyAnLicgKyBwICtcbiAgICAgICAgICAgICAgJyA8JyArICgrTSArIDEpICsgJy4wLjAnO1xuICAgIH1cblxuICAgIGRlYnVnKCdjYXJldCByZXR1cm4nLCByZXQpO1xuICAgIHJldHVybiByZXQ7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlWFJhbmdlcyhjb21wLCBsb29zZSkge1xuICBkZWJ1ZygncmVwbGFjZVhSYW5nZXMnLCBjb21wLCBsb29zZSk7XG4gIHJldHVybiBjb21wLnNwbGl0KC9cXHMrLykubWFwKGZ1bmN0aW9uKGNvbXApIHtcbiAgICByZXR1cm4gcmVwbGFjZVhSYW5nZShjb21wLCBsb29zZSk7XG4gIH0pLmpvaW4oJyAnKTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZVhSYW5nZShjb21wLCBsb29zZSkge1xuICBjb21wID0gY29tcC50cmltKCk7XG4gIHZhciByID0gbG9vc2UgPyByZVtYUkFOR0VMT09TRV0gOiByZVtYUkFOR0VdO1xuICByZXR1cm4gY29tcC5yZXBsYWNlKHIsIGZ1bmN0aW9uKHJldCwgZ3RsdCwgTSwgbSwgcCwgcHIpIHtcbiAgICBkZWJ1ZygneFJhbmdlJywgY29tcCwgcmV0LCBndGx0LCBNLCBtLCBwLCBwcik7XG4gICAgdmFyIHhNID0gaXNYKE0pO1xuICAgIHZhciB4bSA9IHhNIHx8IGlzWChtKTtcbiAgICB2YXIgeHAgPSB4bSB8fCBpc1gocCk7XG4gICAgdmFyIGFueVggPSB4cDtcblxuICAgIGlmIChndGx0ID09PSAnPScgJiYgYW55WClcbiAgICAgIGd0bHQgPSAnJztcblxuICAgIGlmICh4TSkge1xuICAgICAgaWYgKGd0bHQgPT09ICc+JyB8fCBndGx0ID09PSAnPCcpIHtcbiAgICAgICAgLy8gbm90aGluZyBpcyBhbGxvd2VkXG4gICAgICAgIHJldCA9ICc8MC4wLjAnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbm90aGluZyBpcyBmb3JiaWRkZW5cbiAgICAgICAgcmV0ID0gJyonO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZ3RsdCAmJiBhbnlYKSB7XG4gICAgICAvLyByZXBsYWNlIFggd2l0aCAwXG4gICAgICBpZiAoeG0pXG4gICAgICAgIG0gPSAwO1xuICAgICAgaWYgKHhwKVxuICAgICAgICBwID0gMDtcblxuICAgICAgaWYgKGd0bHQgPT09ICc+Jykge1xuICAgICAgICAvLyA+MSA9PiA+PTIuMC4wXG4gICAgICAgIC8vID4xLjIgPT4gPj0xLjMuMFxuICAgICAgICAvLyA+MS4yLjMgPT4gPj0gMS4yLjRcbiAgICAgICAgZ3RsdCA9ICc+PSc7XG4gICAgICAgIGlmICh4bSkge1xuICAgICAgICAgIE0gPSArTSArIDE7XG4gICAgICAgICAgbSA9IDA7XG4gICAgICAgICAgcCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoeHApIHtcbiAgICAgICAgICBtID0gK20gKyAxO1xuICAgICAgICAgIHAgPSAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGd0bHQgPT09ICc8PScpIHtcbiAgICAgICAgLy8gPD0wLjcueCBpcyBhY3R1YWxseSA8MC44LjAsIHNpbmNlIGFueSAwLjcueCBzaG91bGRcbiAgICAgICAgLy8gcGFzcy4gIFNpbWlsYXJseSwgPD03LnggaXMgYWN0dWFsbHkgPDguMC4wLCBldGMuXG4gICAgICAgIGd0bHQgPSAnPCc7XG4gICAgICAgIGlmICh4bSlcbiAgICAgICAgICBNID0gK00gKyAxO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgbSA9ICttICsgMTtcbiAgICAgIH1cblxuICAgICAgcmV0ID0gZ3RsdCArIE0gKyAnLicgKyBtICsgJy4nICsgcDtcbiAgICB9IGVsc2UgaWYgKHhtKSB7XG4gICAgICByZXQgPSAnPj0nICsgTSArICcuMC4wIDwnICsgKCtNICsgMSkgKyAnLjAuMCc7XG4gICAgfSBlbHNlIGlmICh4cCkge1xuICAgICAgcmV0ID0gJz49JyArIE0gKyAnLicgKyBtICsgJy4wIDwnICsgTSArICcuJyArICgrbSArIDEpICsgJy4wJztcbiAgICB9XG5cbiAgICBkZWJ1ZygneFJhbmdlIHJldHVybicsIHJldCk7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9KTtcbn1cblxuLy8gQmVjYXVzZSAqIGlzIEFORC1lZCB3aXRoIGV2ZXJ5dGhpbmcgZWxzZSBpbiB0aGUgY29tcGFyYXRvcixcbi8vIGFuZCAnJyBtZWFucyBcImFueSB2ZXJzaW9uXCIsIGp1c3QgcmVtb3ZlIHRoZSAqcyBlbnRpcmVseS5cbmZ1bmN0aW9uIHJlcGxhY2VTdGFycyhjb21wLCBsb29zZSkge1xuICBkZWJ1ZygncmVwbGFjZVN0YXJzJywgY29tcCwgbG9vc2UpO1xuICAvLyBMb29zZW5lc3MgaXMgaWdub3JlZCBoZXJlLiAgc3RhciBpcyBhbHdheXMgYXMgbG9vc2UgYXMgaXQgZ2V0cyFcbiAgcmV0dXJuIGNvbXAudHJpbSgpLnJlcGxhY2UocmVbU1RBUl0sICcnKTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBpcyBwYXNzZWQgdG8gc3RyaW5nLnJlcGxhY2UocmVbSFlQSEVOUkFOR0VdKVxuLy8gTSwgbSwgcGF0Y2gsIHByZXJlbGVhc2UsIGJ1aWxkXG4vLyAxLjIgLSAzLjQuNSA9PiA+PTEuMi4wIDw9My40LjVcbi8vIDEuMi4zIC0gMy40ID0+ID49MS4yLjAgPDMuNS4wIEFueSAzLjQueCB3aWxsIGRvXG4vLyAxLjIgLSAzLjQgPT4gPj0xLjIuMCA8My41LjBcbmZ1bmN0aW9uIGh5cGhlblJlcGxhY2UoJDAsXG4gICAgICAgICAgICAgICAgICAgICAgIGZyb20sIGZNLCBmbSwgZnAsIGZwciwgZmIsXG4gICAgICAgICAgICAgICAgICAgICAgIHRvLCB0TSwgdG0sIHRwLCB0cHIsIHRiKSB7XG5cbiAgaWYgKGlzWChmTSkpXG4gICAgZnJvbSA9ICcnO1xuICBlbHNlIGlmIChpc1goZm0pKVxuICAgIGZyb20gPSAnPj0nICsgZk0gKyAnLjAuMCc7XG4gIGVsc2UgaWYgKGlzWChmcCkpXG4gICAgZnJvbSA9ICc+PScgKyBmTSArICcuJyArIGZtICsgJy4wJztcbiAgZWxzZVxuICAgIGZyb20gPSAnPj0nICsgZnJvbTtcblxuICBpZiAoaXNYKHRNKSlcbiAgICB0byA9ICcnO1xuICBlbHNlIGlmIChpc1godG0pKVxuICAgIHRvID0gJzwnICsgKCt0TSArIDEpICsgJy4wLjAnO1xuICBlbHNlIGlmIChpc1godHApKVxuICAgIHRvID0gJzwnICsgdE0gKyAnLicgKyAoK3RtICsgMSkgKyAnLjAnO1xuICBlbHNlIGlmICh0cHIpXG4gICAgdG8gPSAnPD0nICsgdE0gKyAnLicgKyB0bSArICcuJyArIHRwICsgJy0nICsgdHByO1xuICBlbHNlXG4gICAgdG8gPSAnPD0nICsgdG87XG5cbiAgcmV0dXJuIChmcm9tICsgJyAnICsgdG8pLnRyaW0oKTtcbn1cblxuXG4vLyBpZiBBTlkgb2YgdGhlIHNldHMgbWF0Y2ggQUxMIG9mIGl0cyBjb21wYXJhdG9ycywgdGhlbiBwYXNzXG5SYW5nZS5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uKHZlcnNpb24pIHtcbiAgaWYgKCF2ZXJzaW9uKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIHZlcnNpb24gPT09ICdzdHJpbmcnKVxuICAgIHZlcnNpb24gPSBuZXcgU2VtVmVyKHZlcnNpb24sIHRoaXMubG9vc2UpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZXQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGVzdFNldCh0aGlzLnNldFtpXSwgdmVyc2lvbikpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5mdW5jdGlvbiB0ZXN0U2V0KHNldCwgdmVyc2lvbikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHNldC5sZW5ndGg7IGkrKykge1xuICAgIGlmICghc2V0W2ldLnRlc3QodmVyc2lvbikpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAodmVyc2lvbi5wcmVyZWxlYXNlLmxlbmd0aCkge1xuICAgIC8vIEZpbmQgdGhlIHNldCBvZiB2ZXJzaW9ucyB0aGF0IGFyZSBhbGxvd2VkIHRvIGhhdmUgcHJlcmVsZWFzZXNcbiAgICAvLyBGb3IgZXhhbXBsZSwgXjEuMi4zLXByLjEgZGVzdWdhcnMgdG8gPj0xLjIuMy1wci4xIDwyLjAuMFxuICAgIC8vIFRoYXQgc2hvdWxkIGFsbG93IGAxLjIuMy1wci4yYCB0byBwYXNzLlxuICAgIC8vIEhvd2V2ZXIsIGAxLjIuNC1hbHBoYS5ub3RyZWFkeWAgc2hvdWxkIE5PVCBiZSBhbGxvd2VkLFxuICAgIC8vIGV2ZW4gdGhvdWdoIGl0J3Mgd2l0aGluIHRoZSByYW5nZSBzZXQgYnkgdGhlIGNvbXBhcmF0b3JzLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBkZWJ1ZyhzZXRbaV0uc2VtdmVyKTtcbiAgICAgIGlmIChzZXRbaV0uc2VtdmVyID09PSBBTlkpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoc2V0W2ldLnNlbXZlci5wcmVyZWxlYXNlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGFsbG93ZWQgPSBzZXRbaV0uc2VtdmVyO1xuICAgICAgICBpZiAoYWxsb3dlZC5tYWpvciA9PT0gdmVyc2lvbi5tYWpvciAmJlxuICAgICAgICAgICAgYWxsb3dlZC5taW5vciA9PT0gdmVyc2lvbi5taW5vciAmJlxuICAgICAgICAgICAgYWxsb3dlZC5wYXRjaCA9PT0gdmVyc2lvbi5wYXRjaClcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBWZXJzaW9uIGhhcyBhIC1wcmUsIGJ1dCBpdCdzIG5vdCBvbmUgb2YgdGhlIG9uZXMgd2UgbGlrZS5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0cy5zYXRpc2ZpZXMgPSBzYXRpc2ZpZXM7XG5mdW5jdGlvbiBzYXRpc2ZpZXModmVyc2lvbiwgcmFuZ2UsIGxvb3NlKSB7XG4gIHRyeSB7XG4gICAgcmFuZ2UgPSBuZXcgUmFuZ2UocmFuZ2UsIGxvb3NlKTtcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHJhbmdlLnRlc3QodmVyc2lvbik7XG59XG5cbmV4cG9ydHMubWF4U2F0aXNmeWluZyA9IG1heFNhdGlzZnlpbmc7XG5mdW5jdGlvbiBtYXhTYXRpc2Z5aW5nKHZlcnNpb25zLCByYW5nZSwgbG9vc2UpIHtcbiAgdmFyIG1heCA9IG51bGw7XG4gIHZhciBtYXhTViA9IG51bGw7XG4gIHRyeSB7XG4gICAgdmFyIHJhbmdlT2JqID0gbmV3IFJhbmdlKHJhbmdlLCBsb29zZSk7XG4gIH0gY2F0Y2ggKGVyKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgdmVyc2lvbnMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgIGlmIChyYW5nZU9iai50ZXN0KHYpKSB7IC8vIHNhdGlzZmllcyh2LCByYW5nZSwgbG9vc2UpXG4gICAgICBpZiAoIW1heCB8fCBtYXhTVi5jb21wYXJlKHYpID09PSAtMSkgeyAvLyBjb21wYXJlKG1heCwgdiwgdHJ1ZSlcbiAgICAgICAgbWF4ID0gdjtcbiAgICAgICAgbWF4U1YgPSBuZXcgU2VtVmVyKG1heCwgbG9vc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIG1heDtcbn1cblxuZXhwb3J0cy5taW5TYXRpc2Z5aW5nID0gbWluU2F0aXNmeWluZztcbmZ1bmN0aW9uIG1pblNhdGlzZnlpbmcodmVyc2lvbnMsIHJhbmdlLCBsb29zZSkge1xuICB2YXIgbWluID0gbnVsbDtcbiAgdmFyIG1pblNWID0gbnVsbDtcbiAgdHJ5IHtcbiAgICB2YXIgcmFuZ2VPYmogPSBuZXcgUmFuZ2UocmFuZ2UsIGxvb3NlKTtcbiAgfSBjYXRjaCAoZXIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB2ZXJzaW9ucy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgaWYgKHJhbmdlT2JqLnRlc3QodikpIHsgLy8gc2F0aXNmaWVzKHYsIHJhbmdlLCBsb29zZSlcbiAgICAgIGlmICghbWluIHx8IG1pblNWLmNvbXBhcmUodikgPT09IDEpIHsgLy8gY29tcGFyZShtaW4sIHYsIHRydWUpXG4gICAgICAgIG1pbiA9IHY7XG4gICAgICAgIG1pblNWID0gbmV3IFNlbVZlcihtaW4sIGxvb3NlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pXG4gIHJldHVybiBtaW47XG59XG5cbmV4cG9ydHMudmFsaWRSYW5nZSA9IHZhbGlkUmFuZ2U7XG5mdW5jdGlvbiB2YWxpZFJhbmdlKHJhbmdlLCBsb29zZSkge1xuICB0cnkge1xuICAgIC8vIFJldHVybiAnKicgaW5zdGVhZCBvZiAnJyBzbyB0aGF0IHRydXRoaW5lc3Mgd29ya3MuXG4gICAgLy8gVGhpcyB3aWxsIHRocm93IGlmIGl0J3MgaW52YWxpZCBhbnl3YXlcbiAgICByZXR1cm4gbmV3IFJhbmdlKHJhbmdlLCBsb29zZSkucmFuZ2UgfHwgJyonO1xuICB9IGNhdGNoIChlcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8vIERldGVybWluZSBpZiB2ZXJzaW9uIGlzIGxlc3MgdGhhbiBhbGwgdGhlIHZlcnNpb25zIHBvc3NpYmxlIGluIHRoZSByYW5nZVxuZXhwb3J0cy5sdHIgPSBsdHI7XG5mdW5jdGlvbiBsdHIodmVyc2lvbiwgcmFuZ2UsIGxvb3NlKSB7XG4gIHJldHVybiBvdXRzaWRlKHZlcnNpb24sIHJhbmdlLCAnPCcsIGxvb3NlKTtcbn1cblxuLy8gRGV0ZXJtaW5lIGlmIHZlcnNpb24gaXMgZ3JlYXRlciB0aGFuIGFsbCB0aGUgdmVyc2lvbnMgcG9zc2libGUgaW4gdGhlIHJhbmdlLlxuZXhwb3J0cy5ndHIgPSBndHI7XG5mdW5jdGlvbiBndHIodmVyc2lvbiwgcmFuZ2UsIGxvb3NlKSB7XG4gIHJldHVybiBvdXRzaWRlKHZlcnNpb24sIHJhbmdlLCAnPicsIGxvb3NlKTtcbn1cblxuZXhwb3J0cy5vdXRzaWRlID0gb3V0c2lkZTtcbmZ1bmN0aW9uIG91dHNpZGUodmVyc2lvbiwgcmFuZ2UsIGhpbG8sIGxvb3NlKSB7XG4gIHZlcnNpb24gPSBuZXcgU2VtVmVyKHZlcnNpb24sIGxvb3NlKTtcbiAgcmFuZ2UgPSBuZXcgUmFuZ2UocmFuZ2UsIGxvb3NlKTtcblxuICB2YXIgZ3RmbiwgbHRlZm4sIGx0Zm4sIGNvbXAsIGVjb21wO1xuICBzd2l0Y2ggKGhpbG8pIHtcbiAgICBjYXNlICc+JzpcbiAgICAgIGd0Zm4gPSBndDtcbiAgICAgIGx0ZWZuID0gbHRlO1xuICAgICAgbHRmbiA9IGx0O1xuICAgICAgY29tcCA9ICc+JztcbiAgICAgIGVjb21wID0gJz49JztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJzwnOlxuICAgICAgZ3RmbiA9IGx0O1xuICAgICAgbHRlZm4gPSBndGU7XG4gICAgICBsdGZuID0gZ3Q7XG4gICAgICBjb21wID0gJzwnO1xuICAgICAgZWNvbXAgPSAnPD0nO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ011c3QgcHJvdmlkZSBhIGhpbG8gdmFsIG9mIFwiPFwiIG9yIFwiPlwiJyk7XG4gIH1cblxuICAvLyBJZiBpdCBzYXRpc2lmZXMgdGhlIHJhbmdlIGl0IGlzIG5vdCBvdXRzaWRlXG4gIGlmIChzYXRpc2ZpZXModmVyc2lvbiwgcmFuZ2UsIGxvb3NlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIEZyb20gbm93IG9uLCB2YXJpYWJsZSB0ZXJtcyBhcmUgYXMgaWYgd2UncmUgaW4gXCJndHJcIiBtb2RlLlxuICAvLyBidXQgbm90ZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgZmxpcHBlZCBmb3IgdGhlIFwibHRyXCIgZnVuY3Rpb24uXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZS5zZXQubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgY29tcGFyYXRvcnMgPSByYW5nZS5zZXRbaV07XG5cbiAgICB2YXIgaGlnaCA9IG51bGw7XG4gICAgdmFyIGxvdyA9IG51bGw7XG5cbiAgICBjb21wYXJhdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGNvbXBhcmF0b3IpIHtcbiAgICAgIGlmIChjb21wYXJhdG9yLnNlbXZlciA9PT0gQU5ZKSB7XG4gICAgICAgIGNvbXBhcmF0b3IgPSBuZXcgQ29tcGFyYXRvcignPj0wLjAuMCcpXG4gICAgICB9XG4gICAgICBoaWdoID0gaGlnaCB8fCBjb21wYXJhdG9yO1xuICAgICAgbG93ID0gbG93IHx8IGNvbXBhcmF0b3I7XG4gICAgICBpZiAoZ3Rmbihjb21wYXJhdG9yLnNlbXZlciwgaGlnaC5zZW12ZXIsIGxvb3NlKSkge1xuICAgICAgICBoaWdoID0gY29tcGFyYXRvcjtcbiAgICAgIH0gZWxzZSBpZiAobHRmbihjb21wYXJhdG9yLnNlbXZlciwgbG93LnNlbXZlciwgbG9vc2UpKSB7XG4gICAgICAgIGxvdyA9IGNvbXBhcmF0b3I7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJZiB0aGUgZWRnZSB2ZXJzaW9uIGNvbXBhcmF0b3IgaGFzIGEgb3BlcmF0b3IgdGhlbiBvdXIgdmVyc2lvblxuICAgIC8vIGlzbid0IG91dHNpZGUgaXRcbiAgICBpZiAoaGlnaC5vcGVyYXRvciA9PT0gY29tcCB8fCBoaWdoLm9wZXJhdG9yID09PSBlY29tcCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBsb3dlc3QgdmVyc2lvbiBjb21wYXJhdG9yIGhhcyBhbiBvcGVyYXRvciBhbmQgb3VyIHZlcnNpb25cbiAgICAvLyBpcyBsZXNzIHRoYW4gaXQgdGhlbiBpdCBpc24ndCBoaWdoZXIgdGhhbiB0aGUgcmFuZ2VcbiAgICBpZiAoKCFsb3cub3BlcmF0b3IgfHwgbG93Lm9wZXJhdG9yID09PSBjb21wKSAmJlxuICAgICAgICBsdGVmbih2ZXJzaW9uLCBsb3cuc2VtdmVyKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAobG93Lm9wZXJhdG9yID09PSBlY29tcCAmJiBsdGZuKHZlcnNpb24sIGxvdy5zZW12ZXIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnRzLnByZXJlbGVhc2UgPSBwcmVyZWxlYXNlO1xuZnVuY3Rpb24gcHJlcmVsZWFzZSh2ZXJzaW9uLCBsb29zZSkge1xuICB2YXIgcGFyc2VkID0gcGFyc2UodmVyc2lvbiwgbG9vc2UpO1xuICByZXR1cm4gKHBhcnNlZCAmJiBwYXJzZWQucHJlcmVsZWFzZS5sZW5ndGgpID8gcGFyc2VkLnByZXJlbGVhc2UgOiBudWxsO1xufVxuXG5leHBvcnRzLmludGVyc2VjdHMgPSBpbnRlcnNlY3RzO1xuZnVuY3Rpb24gaW50ZXJzZWN0cyhyMSwgcjIsIGxvb3NlKSB7XG4gIHIxID0gbmV3IFJhbmdlKHIxLCBsb29zZSlcbiAgcjIgPSBuZXcgUmFuZ2UocjIsIGxvb3NlKVxuICByZXR1cm4gcjEuaW50ZXJzZWN0cyhyMilcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInXG5pbXBvcnQgeyBpc1BsYWluT2JqZWN0LCB0eXBvZiB9IGZyb20gJy4uL3V0aWwvaW5kZXgnXG5cbi8qKlxuICogTm9ybWFsaXplIGEgdmVyc2lvbiBzdHJpbmcuXG4gKiBAcGFyYW0gIHtTdHJpbmd9IFZlcnNpb24uIGllOiAxLCAxLjAsIDEuMC4wXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFZlcnNpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVZlcnNpb24gKHYpIHtcbiAgY29uc3QgaXNWYWxpZCA9IHNlbXZlci52YWxpZCh2KVxuICBpZiAoaXNWYWxpZCkge1xuICAgIHJldHVybiB2XG4gIH1cblxuICB2ID0gdHlwZW9mICh2KSA9PT0gJ3N0cmluZycgPyB2IDogJydcbiAgY29uc3Qgc3BsaXQgPSB2LnNwbGl0KCcuJylcbiAgbGV0IGkgPSAwXG4gIGNvbnN0IHJlc3VsdCA9IFtdXG5cbiAgd2hpbGUgKGkgPCAzKSB7XG4gICAgY29uc3QgcyA9IHR5cGVvZiAoc3BsaXRbaV0pID09PSAnc3RyaW5nJyAmJiBzcGxpdFtpXSA/IHNwbGl0W2ldIDogJzAnXG4gICAgcmVzdWx0LnB1c2gocylcbiAgICBpKytcbiAgfVxuXG4gIHJldHVybiByZXN1bHQuam9pbignLicpXG59XG5cbi8qKlxuICogR2V0IGluZm9ybWF0aW9ucyBmcm9tIGRpZmZlcmVudCBlcnJvciBrZXkuIExpa2U6XG4gKiAtIGNvZGVcbiAqIC0gZXJyb3JNZXNzYWdlXG4gKiAtIGVycm9yVHlwZVxuICogLSBpc0Rvd25ncmFkZVxuICogQHBhcmFtICB7c3RyaW5nfSBrZXlcbiAqIEBwYXJhbSAge3N0cmluZ30gdmFsXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGNyaXRlcmlhXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFcnJvciAoa2V5LCB2YWwsIGNyaXRlcmlhKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHtcbiAgICBpc0Rvd25ncmFkZTogdHJ1ZSxcbiAgICBlcnJvclR5cGU6IDEsXG4gICAgY29kZTogMTAwMFxuICB9XG4gIGNvbnN0IGdldE1zZyA9IGZ1bmN0aW9uIChrZXksIHZhbCwgY3JpdGVyaWEpIHtcbiAgICByZXR1cm4gJ0Rvd25ncmFkZVsnICsga2V5ICsgJ10gOjogZGV2aWNlSW5mbyAnXG4gICAgICArIHZhbCArICcgbWF0Y2hlZCBjcml0ZXJpYSAnICsgY3JpdGVyaWFcbiAgfVxuICBjb25zdCBfa2V5ID0ga2V5LnRvTG93ZXJDYXNlKClcblxuICByZXN1bHQuZXJyb3JNZXNzYWdlID0gZ2V0TXNnKGtleSwgdmFsLCBjcml0ZXJpYSlcblxuICBpZiAoX2tleS5pbmRleE9mKCdvc3ZlcnNpb24nKSA+PSAwKSB7XG4gICAgcmVzdWx0LmNvZGUgPSAxMDAxXG4gIH1cbiAgZWxzZSBpZiAoX2tleS5pbmRleE9mKCdhcHB2ZXJzaW9uJykgPj0gMCkge1xuICAgIHJlc3VsdC5jb2RlID0gMTAwMlxuICB9XG4gIGVsc2UgaWYgKF9rZXkuaW5kZXhPZignd2VleHZlcnNpb24nKSA+PSAwKSB7XG4gICAgcmVzdWx0LmNvZGUgPSAxMDAzXG4gIH1cbiAgZWxzZSBpZiAoX2tleS5pbmRleE9mKCdkZXZpY2Vtb2RlbCcpID49IDApIHtcbiAgICByZXN1bHQuY29kZSA9IDEwMDRcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBXRUVYIGZyYW1ld29yayBpbnB1dChkZXZpY2VJbmZvKVxuICoge1xuICogICBwbGF0Zm9ybTogJ2lPUycgb3IgJ2FuZHJvaWQnXG4gKiAgIG9zVmVyc2lvbjogJzEuMC4wJyBvciAnMS4wJyBvciAnMSdcbiAqICAgYXBwVmVyc2lvbjogJzEuMC4wJyBvciAnMS4wJyBvciAnMSdcbiAqICAgd2VleFZlcnNpb246ICcxLjAuMCcgb3IgJzEuMCcgb3IgJzEnXG4gKiAgIGREZXZpY2VNb2RlbDogJ01PREVMX05BTUUnXG4gKiB9XG4gKlxuICogZG93bmdyYWRlIGNvbmZpZyhjb25maWcpXG4gKiB7XG4gKiAgIGlvczoge1xuICogICAgIG9zVmVyc2lvbjogJz4xLjAuMCcgb3IgJz49MS4wLjAnIG9yICc8MS4wLjAnIG9yICc8PTEuMC4wJyBvciAnMS4wLjAnXG4gKiAgICAgYXBwVmVyc2lvbjogJz4xLjAuMCcgb3IgJz49MS4wLjAnIG9yICc8MS4wLjAnIG9yICc8PTEuMC4wJyBvciAnMS4wLjAnXG4gKiAgICAgd2VleFZlcnNpb246ICc+MS4wLjAnIG9yICc+PTEuMC4wJyBvciAnPDEuMC4wJyBvciAnPD0xLjAuMCcgb3IgJzEuMC4wJ1xuICogICAgIGRldmljZU1vZGVsOiBbJ21vZGVsQScsICdtb2RlbEInLCAuLi5dXG4gKiAgIH0sXG4gKiAgIGFuZHJvaWQ6IHtcbiAqICAgICBvc1ZlcnNpb246ICc+MS4wLjAnIG9yICc+PTEuMC4wJyBvciAnPDEuMC4wJyBvciAnPD0xLjAuMCcgb3IgJzEuMC4wJ1xuICogICAgIGFwcFZlcnNpb246ICc+MS4wLjAnIG9yICc+PTEuMC4wJyBvciAnPDEuMC4wJyBvciAnPD0xLjAuMCcgb3IgJzEuMC4wJ1xuICogICAgIHdlZXhWZXJzaW9uOiAnPjEuMC4wJyBvciAnPj0xLjAuMCcgb3IgJzwxLjAuMCcgb3IgJzw9MS4wLjAnIG9yICcxLjAuMCdcbiAqICAgICBkZXZpY2VNb2RlbDogWydtb2RlbEEnLCAnbW9kZWxCJywgLi4uXVxuICogICB9XG4gKiB9XG4gKlxuICpcbiAqIEBwYXJhbSAge29iamVjdH0gZGV2aWNlSW5mbyBXZWV4IFNESyBmcmFtZXdvcmsgaW5wdXRcbiAqIEBwYXJhbSAge29iamVjdH0gY29uZmlnICAgICB1c2VyIGlucHV0XG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgeyBpc0Rvd25ncmFkZTogdHJ1ZS9mYWxzZSwgZXJyb3JNZXNzYWdlLi4uIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrIChjb25maWcsIGRldmljZUluZm8pIHtcbiAgZGV2aWNlSW5mbyA9IGRldmljZUluZm8gfHwgZ2xvYmFsLldYRW52aXJvbm1lbnRcbiAgZGV2aWNlSW5mbyA9IGlzUGxhaW5PYmplY3QoZGV2aWNlSW5mbykgPyBkZXZpY2VJbmZvIDoge31cblxuICBsZXQgcmVzdWx0ID0ge1xuICAgIGlzRG93bmdyYWRlOiBmYWxzZSAvLyBkZWZhdXRsIGlzIHBhc3NcbiAgfVxuXG4gIGlmICh0eXBvZihjb25maWcpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgbGV0IGN1c3RvbURvd25ncmFkZSA9IGNvbmZpZy5jYWxsKHRoaXMsIGRldmljZUluZm8sIHtcbiAgICAgIHNlbXZlcjogc2VtdmVyLFxuICAgICAgbm9ybWFsaXplVmVyc2lvblxuICAgIH0pXG5cbiAgICBjdXN0b21Eb3duZ3JhZGUgPSAhIWN1c3RvbURvd25ncmFkZVxuXG4gICAgcmVzdWx0ID0gY3VzdG9tRG93bmdyYWRlID8gZ2V0RXJyb3IoJ2N1c3RvbScsICcnLCAnY3VzdG9tIHBhcmFtcycpIDogcmVzdWx0XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uZmlnID0gaXNQbGFpbk9iamVjdChjb25maWcpID8gY29uZmlnIDoge31cblxuICAgIGNvbnN0IHBsYXRmb3JtID0gZGV2aWNlSW5mby5wbGF0Zm9ybSB8fCAndW5rbm93J1xuICAgIGNvbnN0IGRQbGF0Zm9ybSA9IHBsYXRmb3JtLnRvTG93ZXJDYXNlKClcbiAgICBjb25zdCBjT2JqID0gY29uZmlnW2RQbGF0Zm9ybV0gfHwge31cblxuICAgIGZvciAoY29uc3QgaSBpbiBkZXZpY2VJbmZvKSB7XG4gICAgICBjb25zdCBrZXkgPSBpXG4gICAgICBjb25zdCBrZXlMb3dlciA9IGtleS50b0xvd2VyQ2FzZSgpXG4gICAgICBjb25zdCB2YWwgPSBkZXZpY2VJbmZvW2ldXG4gICAgICBjb25zdCBpc1ZlcnNpb24gPSBrZXlMb3dlci5pbmRleE9mKCd2ZXJzaW9uJykgPj0gMFxuICAgICAgY29uc3QgaXNEZXZpY2VNb2RlbCA9IGtleUxvd2VyLmluZGV4T2YoJ2RldmljZW1vZGVsJykgPj0gMFxuICAgICAgY29uc3QgY3JpdGVyaWEgPSBjT2JqW2ldXG5cbiAgICAgIGlmIChjcml0ZXJpYSAmJiBpc1ZlcnNpb24pIHtcbiAgICAgICAgY29uc3QgYyA9IG5vcm1hbGl6ZVZlcnNpb24oY3JpdGVyaWEpXG4gICAgICAgIGNvbnN0IGQgPSBub3JtYWxpemVWZXJzaW9uKGRldmljZUluZm9baV0pXG5cbiAgICAgICAgaWYgKHNlbXZlci5zYXRpc2ZpZXMoZCwgYykpIHtcbiAgICAgICAgICByZXN1bHQgPSBnZXRFcnJvcihrZXksIHZhbCwgY3JpdGVyaWEpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoaXNEZXZpY2VNb2RlbCkge1xuICAgICAgICBjb25zdCBfY3JpdGVyaWEgPSB0eXBvZihjcml0ZXJpYSkgPT09ICdhcnJheScgPyBjcml0ZXJpYSA6IFtjcml0ZXJpYV1cbiAgICAgICAgaWYgKF9jcml0ZXJpYS5pbmRleE9mKHZhbCkgPj0gMCkge1xuICAgICAgICAgIHJlc3VsdCA9IGdldEVycm9yKGtleSwgdmFsLCBjcml0ZXJpYSlcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0Vmlld3BvcnQgKGFwcCwgY29uZmlncyA9IHt9KSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcpIHtcbiAgICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBTZXQgdmlld3BvcnQgKHdpZHRoOiAke2NvbmZpZ3Mud2lkdGh9KSBmb3IgYXBwIyR7YXBwLmlkfS5gKVxuICAgIHZhbGlkYXRlVmlld3BvcnQoY29uZmlncylcbiAgfVxuXG4gIC8vIFNlbmQgdmlld3BvcnQgY29uZmlncyB0byBuYXRpdmVcbiAgaWYgKGFwcCAmJiBhcHAuY2FsbFRhc2tzKSB7XG4gICAgcmV0dXJuIGFwcC5jYWxsVGFza3MoW3tcbiAgICAgIG1vZHVsZTogJ21ldGEnLFxuICAgICAgbWV0aG9kOiAnc2V0Vmlld3BvcnQnLFxuICAgICAgYXJnczogW2NvbmZpZ3NdXG4gICAgfV0pXG4gIH1cblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBlbHNlIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gQ2FuJ3QgZmluZCBcImNhbGxUYXNrc1wiIG1ldGhvZCBvbiBjdXJyZW50IGFwcC5gKVxuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIHZpZXdwb3J0IGNvbmZpZy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWdzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVZpZXdwb3J0IChjb25maWdzID0ge30pIHtcbiAgY29uc3QgeyB3aWR0aCB9ID0gY29uZmlnc1xuICBpZiAod2lkdGgpIHtcbiAgICBpZiAodHlwZW9mIHdpZHRoICE9PSAnbnVtYmVyJyAmJiB3aWR0aCAhPT0gJ2RldmljZS13aWR0aCcpIHtcbiAgICAgIGNvbnNvbGUud2FybihgW0pTIEZyYW1ld29ya10gTm90IHN1cHBvcnQgdG8gdXNlICR7d2lkdGh9IGFzIHZpZXdwb3J0IHdpZHRoLmApXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIHRoZSB2aWV3cG9ydCBjb25maWcgc2hvdWxkIGNvbnRhaW4gdGhlIFwid2lkdGhcIiBwcm9wZXJ0eS4nKVxuICByZXR1cm4gZmFsc2Vcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInXG5pbXBvcnQgVm0gZnJvbSAnLi4vLi4vdm0vaW5kZXgnXG5pbXBvcnQgKiBhcyBkb3duZ3JhZGUgZnJvbSAnLi4vZG93bmdyYWRlJ1xuaW1wb3J0IHsgc2V0Vmlld3BvcnQgfSBmcm9tICcuLi92aWV3cG9ydCdcbmltcG9ydCB7XG4gIHJlcXVpcmVDdXN0b21Db21wb25lbnRcbn0gZnJvbSAnLi4vcmVnaXN0ZXInXG5pbXBvcnQge1xuICBpc1BsYWluT2JqZWN0LFxuICBpc1dlZXhDb21wb25lbnQsXG4gIGlzTnBtTW9kdWxlLFxuICByZW1vdmVXZWV4UHJlZml4LFxuICByZW1vdmVKU1N1cmZpeFxufSBmcm9tICcuLi8uLi91dGlsL2luZGV4J1xuXG4vKipcbiAqIGJvb3RzdHJhcCBhcHAgZnJvbSBhIGNlcnRhaW4gY3VzdG9tIGNvbXBvbmVudCB3aXRoIGNvbmZpZyAmIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJvb3RzdHJhcCAoYXBwLCBuYW1lLCBjb25maWcsIGRhdGEpIHtcbiAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gYm9vdHN0cmFwIGZvciAke25hbWV9YClcblxuICAvLyAxLiB2YWxpZGF0ZSBjdXN0b20gY29tcG9uZW50IG5hbWUgZmlyc3RcbiAgbGV0IGNsZWFuTmFtZVxuICBpZiAoaXNXZWV4Q29tcG9uZW50KG5hbWUpKSB7XG4gICAgY2xlYW5OYW1lID0gcmVtb3ZlV2VleFByZWZpeChuYW1lKVxuICB9XG4gIGVsc2UgaWYgKGlzTnBtTW9kdWxlKG5hbWUpKSB7XG4gICAgY2xlYW5OYW1lID0gcmVtb3ZlSlNTdXJmaXgobmFtZSlcbiAgICAvLyBjaGVjayBpZiBkZWZpbmUgYnkgb2xkICdkZWZpbmUnIG1ldGhvZFxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmICghcmVxdWlyZUN1c3RvbUNvbXBvbmVudChhcHAsIGNsZWFuTmFtZSkpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoYEl0J3Mgbm90IGEgY29tcG9uZW50OiAke25hbWV9YClcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgV3JvbmcgY29tcG9uZW50IG5hbWU6ICR7bmFtZX1gKVxuICB9XG5cbiAgLy8gMi4gdmFsaWRhdGUgY29uZmlndXJhdGlvblxuICBjb25maWcgPSBpc1BsYWluT2JqZWN0KGNvbmZpZykgPyBjb25maWcgOiB7fVxuICAvLyAyLjEgdHJhbnNmb3JtZXIgdmVyc2lvbiBjaGVja1xuICBpZiAodHlwZW9mIGNvbmZpZy50cmFuc2Zvcm1lclZlcnNpb24gPT09ICdzdHJpbmcnICYmXG4gICAgdHlwZW9mIGdsb2JhbC50cmFuc2Zvcm1lclZlcnNpb24gPT09ICdzdHJpbmcnICYmXG4gICAgIXNlbXZlci5zYXRpc2ZpZXMoY29uZmlnLnRyYW5zZm9ybWVyVmVyc2lvbixcbiAgICAgIGdsb2JhbC50cmFuc2Zvcm1lclZlcnNpb24pKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihgSlMgQnVuZGxlIHZlcnNpb246ICR7Y29uZmlnLnRyYW5zZm9ybWVyVmVyc2lvbn0gYCArXG4gICAgICBgbm90IGNvbXBhdGlibGUgd2l0aCAke2dsb2JhbC50cmFuc2Zvcm1lclZlcnNpb259YClcbiAgfVxuICAvLyAyLjIgZG93bmdyYWRlIHZlcnNpb24gY2hlY2tcbiAgY29uc3QgZG93bmdyYWRlUmVzdWx0ID0gZG93bmdyYWRlLmNoZWNrKGNvbmZpZy5kb3duZ3JhZGUpXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoZG93bmdyYWRlUmVzdWx0LmlzRG93bmdyYWRlKSB7XG4gICAgYXBwLmNhbGxUYXNrcyhbe1xuICAgICAgbW9kdWxlOiAnaW5zdGFuY2VXcmFwJyxcbiAgICAgIG1ldGhvZDogJ2Vycm9yJyxcbiAgICAgIGFyZ3M6IFtcbiAgICAgICAgZG93bmdyYWRlUmVzdWx0LmVycm9yVHlwZSxcbiAgICAgICAgZG93bmdyYWRlUmVzdWx0LmNvZGUsXG4gICAgICAgIGRvd25ncmFkZVJlc3VsdC5lcnJvck1lc3NhZ2VcbiAgICAgIF1cbiAgICB9XSlcbiAgICByZXR1cm4gbmV3IEVycm9yKGBEb3duZ3JhZGVbJHtkb3duZ3JhZGVSZXN1bHQuY29kZX1dOiAke2Rvd25ncmFkZVJlc3VsdC5lcnJvck1lc3NhZ2V9YClcbiAgfVxuXG4gIC8vIHNldCB2aWV3cG9ydFxuICBpZiAoY29uZmlnLnZpZXdwb3J0KSB7XG4gICAgc2V0Vmlld3BvcnQoYXBwLCBjb25maWcudmlld3BvcnQpXG4gIH1cblxuICAvLyAzLiBjcmVhdGUgYSBuZXcgVm0gd2l0aCBjdXN0b20gY29tcG9uZW50IG5hbWUgYW5kIGRhdGFcbiAgYXBwLnZtID0gbmV3IFZtKGNsZWFuTmFtZSwgbnVsbCwgeyBfYXBwOiBhcHAgfSwgbnVsbCwgZGF0YSlcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHtcbiAgaXNXZWV4Q29tcG9uZW50LFxuICBpc1dlZXhNb2R1bGUsXG4gIGlzTm9ybWFsTW9kdWxlLFxuICBpc05wbU1vZHVsZSxcbiAgcmVtb3ZlV2VleFByZWZpeCxcbiAgcmVtb3ZlSlNTdXJmaXhcbn0gZnJvbSAnLi4vLi4vdXRpbC9pbmRleCdcbmltcG9ydCB7XG4gIHJlZ2lzdGVyQ3VzdG9tQ29tcG9uZW50LFxuICByZXF1aXJlQ3VzdG9tQ29tcG9uZW50LFxuICBpbml0TW9kdWxlc1xufSBmcm9tICcuLi9yZWdpc3RlcidcblxuLyoqXG4gKiBkZWZpbmUobmFtZSwgZmFjdG9yeSkgZm9yIHByaW1hcnkgdXNhZ2VcbiAqIG9yXG4gKiBkZWZpbmUobmFtZSwgZGVwcywgZmFjdG9yeSkgZm9yIGNvbXBhdGliaWxpdHlcbiAqIE5vdGljZTogRE8gTk9UIHVzZSBmdW5jdGlvbiBkZWZpbmUoKSB7fSxcbiAqIGl0IHdpbGwgY2F1c2UgZXJyb3IgYWZ0ZXIgYnVpbGRlZCBieSB3ZWJwYWNrXG4gKi9cbmV4cG9ydCBjb25zdCBkZWZpbmVGbiA9IGZ1bmN0aW9uIChhcHAsIG5hbWUsIC4uLmFyZ3MpIHtcbiAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gZGVmaW5lIGEgY29tcG9uZW50ICR7bmFtZX1gKVxuXG4gIC8vIGFkYXB0IGFyZ3M6XG4gIC8vIDEuIG5hbWUsIGRlcHNbXSwgZmFjdG9yeSgpXG4gIC8vIDIuIG5hbWUsIGZhY3RvcnkoKVxuICAvLyAzLiBuYW1lLCBkZWZpbml0aW9ue31cbiAgbGV0IGZhY3RvcnksIGRlZmluaXRpb25cbiAgaWYgKGFyZ3MubGVuZ3RoID4gMSkge1xuICAgIGRlZmluaXRpb24gPSBhcmdzWzFdXG4gIH1cbiAgZWxzZSB7XG4gICAgZGVmaW5pdGlvbiA9IGFyZ3NbMF1cbiAgfVxuICBpZiAodHlwZW9mIGRlZmluaXRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBmYWN0b3J5ID0gZGVmaW5pdGlvblxuICAgIGRlZmluaXRpb24gPSBudWxsXG4gIH1cblxuICAvLyByZXNvbHZlIGRlZmluaXRpb24gZnJvbSBmYWN0b3J5XG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgciA9IChuYW1lKSA9PiB7XG4gICAgICBpZiAoaXNXZWV4Q29tcG9uZW50KG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IHJlbW92ZVdlZXhQcmVmaXgobmFtZSlcbiAgICAgICAgcmV0dXJuIHJlcXVpcmVDdXN0b21Db21wb25lbnQoYXBwLCBjbGVhbk5hbWUpXG4gICAgICB9XG4gICAgICBpZiAoaXNXZWV4TW9kdWxlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IHJlbW92ZVdlZXhQcmVmaXgobmFtZSlcbiAgICAgICAgcmV0dXJuIGFwcC5yZXF1aXJlTW9kdWxlKGNsZWFuTmFtZSlcbiAgICAgIH1cbiAgICAgIGlmIChpc05vcm1hbE1vZHVsZShuYW1lKSB8fCBpc05wbU1vZHVsZShuYW1lKSkge1xuICAgICAgICBjb25zdCBjbGVhbk5hbWUgPSByZW1vdmVKU1N1cmZpeChuYW1lKVxuICAgICAgICByZXR1cm4gYXBwLmNvbW1vbk1vZHVsZXNbY2xlYW5OYW1lXVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBtID0geyBleHBvcnRzOiB7fX1cbiAgICBmYWN0b3J5KHIsIG0uZXhwb3J0cywgbSlcbiAgICBkZWZpbml0aW9uID0gbS5leHBvcnRzXG4gIH1cblxuICAvLyBhcHBseSBkZWZpbml0aW9uXG4gIGlmIChpc1dlZXhDb21wb25lbnQobmFtZSkpIHtcbiAgICBjb25zdCBjbGVhbk5hbWUgPSByZW1vdmVXZWV4UHJlZml4KG5hbWUpXG4gICAgcmVnaXN0ZXJDdXN0b21Db21wb25lbnQoYXBwLCBjbGVhbk5hbWUsIGRlZmluaXRpb24pXG4gIH1cbiAgZWxzZSBpZiAoaXNXZWV4TW9kdWxlKG5hbWUpKSB7XG4gICAgY29uc3QgY2xlYW5OYW1lID0gcmVtb3ZlV2VleFByZWZpeChuYW1lKVxuICAgIGluaXRNb2R1bGVzKHsgW2NsZWFuTmFtZV06IGRlZmluaXRpb24gfSlcbiAgfVxuICBlbHNlIGlmIChpc05vcm1hbE1vZHVsZShuYW1lKSkge1xuICAgIGNvbnN0IGNsZWFuTmFtZSA9IHJlbW92ZUpTU3VyZml4KG5hbWUpXG4gICAgYXBwLmNvbW1vbk1vZHVsZXNbY2xlYW5OYW1lXSA9IGRlZmluaXRpb25cbiAgfVxuICBlbHNlIGlmIChpc05wbU1vZHVsZShuYW1lKSkge1xuICAgIGNvbnN0IGNsZWFuTmFtZSA9IHJlbW92ZUpTU3VyZml4KG5hbWUpXG4gICAgaWYgKGRlZmluaXRpb24udGVtcGxhdGUgfHxcbiAgICAgICAgZGVmaW5pdGlvbi5zdHlsZSB8fFxuICAgICAgICBkZWZpbml0aW9uLm1ldGhvZHMpIHtcbiAgICAgIC8vIGRvd25ncmFkZSB0byBvbGQgZGVmaW5lIG1ldGhvZCAoZGVmaW5lKCdjb21wb25lbnROYW1lJywgZmFjdG9yeSkpXG4gICAgICAvLyB0aGUgZXhwb3J0cyBjb250YWluIG9uZSBrZXkgb2YgdGVtcGxhdGUsIHN0eWxlIG9yIG1ldGhvZHNcbiAgICAgIC8vIGJ1dCBpdCBoYXMgcmlzayEhIVxuICAgICAgcmVnaXN0ZXJDdXN0b21Db21wb25lbnQoYXBwLCBjbGVhbk5hbWUsIGRlZmluaXRpb24pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYXBwLmNvbW1vbk1vZHVsZXNbY2xlYW5OYW1lXSA9IGRlZmluaXRpb25cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIgKGFwcCwgdHlwZSwgb3B0aW9ucykge1xuICBjb25zb2xlLndhcm4oJ1tKUyBGcmFtZXdvcmtdIFJlZ2lzdGVyIGlzIGRlcHJlY2F0ZWQsIHBsZWFzZSBpbnN0YWxsIGxhc3Rlc3QgdHJhbnNmb3JtZXIuJylcbiAgcmVnaXN0ZXJDdXN0b21Db21wb25lbnQoYXBwLCB0eXBlLCBvcHRpb25zKVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIGFwaSB0aGF0IGludm9rZWQgYnkganMgYnVuZGxlIGNvZGVcbiAqXG4gKiAtIGRlZmluZShuYW1lLCBmYWN0b3J5KTogZGVmaW5lIGEgbmV3IGNvbXBvc2VkIGNvbXBvbmVudCB0eXBlXG4gKiAtIGJvb3RzdHJhcCh0eXBlLCBjb25maWcsIGRhdGEpOiByZXF1aXJlIGEgY2VydGFpbiB0eXBlICZcbiAqICAgICAgICAgcmVuZGVyIHdpdGggKG9wdGlvbmFsKSBkYXRhXG4gKlxuICogZGVwcmVjYXRlZDpcbiAqIC0gcmVnaXN0ZXIodHlwZSwgb3B0aW9ucyk6IHJlZ2lzdGVyIGEgbmV3IGNvbXBvc2VkIGNvbXBvbmVudCB0eXBlXG4gKiAtIHJlbmRlcih0eXBlLCBkYXRhKTogcmVuZGVyIGJ5IGEgY2VydGFpbiB0eXBlIHdpdGggKG9wdGlvbmFsKSBkYXRhXG4gKiAtIHJlcXVpcmUodHlwZSkoZGF0YSk6IHJlcXVpcmUgYSB0eXBlIHRoZW4gcmVuZGVyIHdpdGggZGF0YVxuICovXG5cbmV4cG9ydCB7IGJvb3RzdHJhcCB9IGZyb20gJy4vYm9vdHN0cmFwJ1xuZXhwb3J0IHsgZGVmaW5lRm4sIHJlZ2lzdGVyIH0gZnJvbSAnLi9kZWZpbmUnXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogaW5zdGFuY2UgY29udHJvbHMgZnJvbSBuYXRpdmVcbiAqXG4gKiAtIGZpcmUgZXZlbnRcbiAqIC0gY2FsbGJhY2tcbiAqIC0gcmVmcmVzaFxuICogLSBkZXN0cm95XG4gKlxuICogY29ycmVzcG9uZGVkIHdpdGggdGhlIEFQSSBvZiBpbnN0YW5jZSBtYW5hZ2VyIChmcmFtZXdvcmsuanMpXG4gKi9cbmltcG9ydCB7IGV4dGVuZCwgdHlwb2YgfSBmcm9tICcuLi8uLi91dGlsL2luZGV4J1xuXG4vKipcbiAqIFJlZnJlc2ggYW4gYXBwIHdpdGggZGF0YSB0byBpdHMgcm9vdCBjb21wb25lbnQgb3B0aW9ucy5cbiAqIEBwYXJhbSAge29iamVjdH0gYXBwXG4gKiBAcGFyYW0gIHthbnl9ICAgIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2ggKGFwcCwgZGF0YSkge1xuICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBSZWZyZXNoIHdpdGhgLCBkYXRhLCBgaW4gaW5zdGFuY2VbJHthcHAuaWR9XWApXG4gIGNvbnN0IHZtID0gYXBwLnZtXG4gIGlmICh2bSAmJiBkYXRhKSB7XG4gICAgaWYgKHR5cGVvZiB2bS5yZWZyZXNoRGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdm0ucmVmcmVzaERhdGEoZGF0YSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBleHRlbmQodm0sIGRhdGEpXG4gICAgfVxuICAgIGFwcC5kaWZmZXIuZmx1c2goKVxuICAgIGFwcC5kb2MudGFza0NlbnRlci5zZW5kKCdkb20nLCB7IGFjdGlvbjogJ3JlZnJlc2hGaW5pc2gnIH0sIFtdKVxuICAgIHJldHVyblxuICB9XG4gIHJldHVybiBuZXcgRXJyb3IoYGludmFsaWQgZGF0YSBcIiR7ZGF0YX1cImApXG59XG5cbi8qKlxuICogRGVzdHJveSBhbiBhcHAuXG4gKiBAcGFyYW0gIHtvYmplY3R9IGFwcFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveSAoYXBwKSB7XG4gIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIERlc3RvcnkgYW4gaW5zdGFuY2UoJHthcHAuaWR9KWApXG5cbiAgaWYgKGFwcC52bSkge1xuICAgIGRlc3Ryb3lWbShhcHAudm0pXG4gIH1cblxuICBhcHAuaWQgPSAnJ1xuICBhcHAub3B0aW9ucyA9IG51bGxcbiAgYXBwLmJsb2NrcyA9IG51bGxcbiAgYXBwLnZtID0gbnVsbFxuICBhcHAuZG9jLnRhc2tDZW50ZXIuZGVzdHJveUNhbGxiYWNrKClcbiAgYXBwLmRvYy5kZXN0cm95KClcbiAgYXBwLmRvYyA9IG51bGxcbiAgYXBwLmN1c3RvbUNvbXBvbmVudE1hcCA9IG51bGxcbiAgYXBwLmNvbW1vbk1vZHVsZXMgPSBudWxsXG59XG5cbi8qKlxuICogRGVzdHJveSBhbiBWbS5cbiAqIEBwYXJhbSB7b2JqZWN0fSB2bVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZtICh2bSkge1xuICBkZWxldGUgdm0uX2FwcFxuICBkZWxldGUgdm0uX2NvbXB1dGVkXG4gIGRlbGV0ZSB2bS5fY3NzXG4gIGRlbGV0ZSB2bS5fZGF0YVxuICBkZWxldGUgdm0uX2lkc1xuICBkZWxldGUgdm0uX21ldGhvZHNcbiAgZGVsZXRlIHZtLl9vcHRpb25zXG4gIGRlbGV0ZSB2bS5fcGFyZW50XG4gIGRlbGV0ZSB2bS5fcGFyZW50RWxcbiAgZGVsZXRlIHZtLl9yb290RWxcblxuICAvLyByZW1vdmUgYWxsIHdhdGNoZXJzXG4gIGlmICh2bS5fd2F0Y2hlcnMpIHtcbiAgICBsZXQgd2F0Y2hlckNvdW50ID0gdm0uX3dhdGNoZXJzLmxlbmd0aFxuICAgIHdoaWxlICh3YXRjaGVyQ291bnQtLSkge1xuICAgICAgdm0uX3dhdGNoZXJzW3dhdGNoZXJDb3VudF0udGVhcmRvd24oKVxuICAgIH1cbiAgICBkZWxldGUgdm0uX3dhdGNoZXJzXG4gIH1cblxuICAvLyBkZXN0cm95IGNoaWxkIHZtcyByZWN1cnNpdmVseVxuICBpZiAodm0uX2NoaWxkcmVuVm1zKSB7XG4gICAgbGV0IHZtQ291bnQgPSB2bS5fY2hpbGRyZW5WbXMubGVuZ3RoXG4gICAgd2hpbGUgKHZtQ291bnQtLSkge1xuICAgICAgZGVzdHJveVZtKHZtLl9jaGlsZHJlblZtc1t2bUNvdW50XSlcbiAgICB9XG4gICAgZGVsZXRlIHZtLl9jaGlsZHJlblZtc1xuICB9XG5cbiAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gXCJkZXN0cm95ZWRcIiBsaWZlY3ljbGUgaW4gVm0oJHt2bS5fdHlwZX0pYClcbiAgdm0uJGVtaXQoJ2hvb2s6ZGVzdHJveWVkJylcblxuICBkZWxldGUgdm0uX3R5cGVcbiAgZGVsZXRlIHZtLl92bUV2ZW50c1xufVxuXG4vKipcbiAqIEdldCBhIEpTT04gb2JqZWN0IHRvIGRlc2NyaWJlIHRoZSBkb2N1bWVudCBib2R5LlxuICogQHBhcmFtICB7b2JqZWN0fSBhcHBcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RFbGVtZW50IChhcHApIHtcbiAgY29uc3QgZG9jID0gYXBwLmRvYyB8fCB7fVxuICBjb25zdCBib2R5ID0gZG9jLmJvZHkgfHwge31cbiAgcmV0dXJuIGJvZHkudG9KU09OID8gYm9keS50b0pTT04oKSA6IHt9XG59XG5cbi8qKlxuICogRmlyZSBhbiBldmVudCBmcm9tIHJlbmRlcmVyLiBUaGUgZXZlbnQgaGFzIHR5cGUsIGFuIGV2ZW50IG9iamVjdCBhbmQgYW5cbiAqIGVsZW1lbnQgcmVmLiBJZiB0aGUgZXZlbnQgY29tZXMgd2l0aCBzb21lIHZpcnR1YWwtRE9NIGNoYW5nZXMsIGl0IHNob3VsZFxuICogaGF2ZSBvbmUgbW9yZSBwYXJhbWV0ZXIgdG8gZGVzY3JpYmUgdGhlIGNoYW5nZXMuXG4gKiBAcGFyYW0gIHtvYmplY3R9IGFwcFxuICogQHBhcmFtICB7c3RyaW5nfSByZWZcbiAqIEBwYXJhbSAge3R5cGV9ICAgdHlwZVxuICogQHBhcmFtICB7b2JqZWN0fSBlXG4gKiBAcGFyYW0gIHtvYmplY3R9IGRvbUNoYW5nZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpcmVFdmVudCAoYXBwLCByZWYsIHR5cGUsIGUsIGRvbUNoYW5nZXMpIHtcbiAgY29uc29sZS5kZWJ1ZyhgW0pTIEZyYW1ld29ya10gRmlyZSBhIFwiJHt0eXBlfVwiIGV2ZW50IG9uIGFuIGVsZW1lbnQoJHtyZWZ9KSBpbiBpbnN0YW5jZSgke2FwcC5pZH0pYClcbiAgaWYgKEFycmF5LmlzQXJyYXkocmVmKSkge1xuICAgIHJlZi5zb21lKChyZWYpID0+IHtcbiAgICAgIHJldHVybiBmaXJlRXZlbnQoYXBwLCByZWYsIHR5cGUsIGUpICE9PSBmYWxzZVxuICAgIH0pXG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgZWwgPSBhcHAuZG9jLmdldFJlZihyZWYpXG4gIGlmIChlbCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGFwcC5kb2MuZmlyZUV2ZW50KGVsLCB0eXBlLCBlLCBkb21DaGFuZ2VzKVxuICAgIGFwcC5kaWZmZXIuZmx1c2goKVxuICAgIGFwcC5kb2MudGFza0NlbnRlci5zZW5kKCdkb20nLCB7IGFjdGlvbjogJ3VwZGF0ZUZpbmlzaCcgfSwgW10pXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIHJldHVybiBuZXcgRXJyb3IoYGludmFsaWQgZWxlbWVudCByZWZlcmVuY2UgXCIke3JlZn1cImApXG59XG5cbi8qKlxuICogTWFrZSBhIGNhbGxiYWNrIGZvciBhIGNlcnRhaW4gYXBwLlxuICogQHBhcmFtICB7b2JqZWN0fSAgIGFwcFxuICogQHBhcmFtICB7bnVtYmVyfSAgIGNhbGxiYWNrSWRcbiAqIEBwYXJhbSAge2FueX0gICAgICBkYXRhXG4gKiBAcGFyYW0gIHtib29sZWFufSAgaWZLZWVwQWxpdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGxiYWNrIChhcHAsIGNhbGxiYWNrSWQsIGRhdGEsIGlmS2VlcEFsaXZlKSB7XG4gIGNvbnNvbGUuZGVidWcoYFtKUyBGcmFtZXdvcmtdIEludm9rZSBhIGNhbGxiYWNrKCR7Y2FsbGJhY2tJZH0pIHdpdGhgLCBkYXRhLCBgaW4gaW5zdGFuY2UoJHthcHAuaWR9KWApXG4gIGNvbnN0IHJlc3VsdCA9IGFwcC5kb2MudGFza0NlbnRlci5jYWxsYmFjayhjYWxsYmFja0lkLCBkYXRhLCBpZktlZXBBbGl2ZSlcbiAgdXBkYXRlQWN0aW9ucyhhcHApXG4gIGFwcC5kb2MudGFza0NlbnRlci5zZW5kKCdkb20nLCB7IGFjdGlvbjogJ3VwZGF0ZUZpbmlzaCcgfSwgW10pXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCB2aXJ0dWFsLURPTSBtdXRhdGlvbnMgdG9nZXRoZXIgYW5kIHNlbmQgdGhlbSB0byByZW5kZXJlci5cbiAqIEBwYXJhbSAge29iamVjdH0gYXBwXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVBY3Rpb25zIChhcHApIHtcbiAgYXBwLmRpZmZlci5mbHVzaCgpXG59XG5cbi8qKlxuICogQ2FsbCBhbGwgdGFza3MgZnJvbSBhbiBhcHAgdG8gcmVuZGVyZXIgKG5hdGl2ZSkuXG4gKiBAcGFyYW0gIHtvYmplY3R9IGFwcFxuICogQHBhcmFtICB7YXJyYXl9ICB0YXNrc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsbFRhc2tzIChhcHAsIHRhc2tzKSB7XG4gIGxldCByZXN1bHRcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAodHlwb2YodGFza3MpICE9PSAnYXJyYXknKSB7XG4gICAgdGFza3MgPSBbdGFza3NdXG4gIH1cblxuICB0YXNrcy5mb3JFYWNoKHRhc2sgPT4ge1xuICAgIHJlc3VsdCA9IGFwcC5kb2MudGFza0NlbnRlci5zZW5kKFxuICAgICAgJ21vZHVsZScsXG4gICAgICB7XG4gICAgICAgIG1vZHVsZTogdGFzay5tb2R1bGUsXG4gICAgICAgIG1ldGhvZDogdGFzay5tZXRob2RcbiAgICAgIH0sXG4gICAgICB0YXNrLmFyZ3NcbiAgICApXG4gIH0pXG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG4vKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIGluc3RhbmNlIGNvbnRyb2xzIGZyb20gbmF0aXZlXG4gKlxuICogLSBpbml0IGJ1bmRsZVxuICpcbiAqIGNvcnJlc3BvbmRlZCB3aXRoIHRoZSBBUEkgb2YgaW5zdGFuY2UgbWFuYWdlciAoZnJhbWV3b3JrLmpzKVxuICovXG5cbmltcG9ydCBWbSBmcm9tICcuLi8uLi92bS9pbmRleCdcbmltcG9ydCB7IHJlbW92ZVdlZXhQcmVmaXggfSBmcm9tICcuLi8uLi91dGlsL2luZGV4J1xuaW1wb3J0IHtcbiAgZGVmaW5lRm4sXG4gIGJvb3RzdHJhcCxcbiAgcmVnaXN0ZXJcbn0gZnJvbSAnLi4vYnVuZGxlL2luZGV4J1xuaW1wb3J0IHsgdXBkYXRlQWN0aW9ucyB9IGZyb20gJy4vbWlzYydcblxuLyoqXG4gKiBJbml0IGFuIGFwcCBieSBydW4gY29kZSB3aXRnaCBkYXRhXG4gKiBAcGFyYW0gIHtvYmplY3R9IGFwcFxuICogQHBhcmFtICB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0gIHtvYmplY3R9IGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXQgKGFwcCwgY29kZSwgZGF0YSwgc2VydmljZXMpIHtcbiAgY29uc29sZS5kZWJ1ZygnW0pTIEZyYW1ld29ya10gSW50aWFsaXplIGFuIGluc3RhbmNlIHdpdGg6XFxuJywgZGF0YSlcbiAgbGV0IHJlc3VsdFxuXG4gIC8vIHByZXBhcmUgYXBwIGVudiBtZXRob2RzXG4gIGNvbnN0IGJ1bmRsZURlZmluZSA9ICguLi5hcmdzKSA9PiBkZWZpbmVGbihhcHAsIC4uLmFyZ3MpXG4gIGNvbnN0IGJ1bmRsZUJvb3RzdHJhcCA9IChuYW1lLCBjb25maWcsIF9kYXRhKSA9PiB7XG4gICAgcmVzdWx0ID0gYm9vdHN0cmFwKGFwcCwgbmFtZSwgY29uZmlnLCBfZGF0YSB8fCBkYXRhKVxuICAgIHVwZGF0ZUFjdGlvbnMoYXBwKVxuICAgIGFwcC5kb2MubGlzdGVuZXIuY3JlYXRlRmluaXNoKClcbiAgICBjb25zb2xlLmRlYnVnKGBbSlMgRnJhbWV3b3JrXSBBZnRlciBpbnRpYWxpemVkIGFuIGluc3RhbmNlKCR7YXBwLmlkfSlgKVxuICB9XG4gIGNvbnN0IGJ1bmRsZVZtID0gVm1cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgY29uc3QgYnVuZGxlUmVnaXN0ZXIgPSAoLi4uYXJncykgPT4gcmVnaXN0ZXIoYXBwLCAuLi5hcmdzKVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBjb25zdCBidW5kbGVSZW5kZXIgPSAobmFtZSwgX2RhdGEpID0+IHtcbiAgICByZXN1bHQgPSBib290c3RyYXAoYXBwLCBuYW1lLCB7fSwgX2RhdGEpXG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgY29uc3QgYnVuZGxlUmVxdWlyZSA9IG5hbWUgPT4gX2RhdGEgPT4ge1xuICAgIHJlc3VsdCA9IGJvb3RzdHJhcChhcHAsIG5hbWUsIHt9LCBfZGF0YSlcbiAgfVxuICBjb25zdCBidW5kbGVEb2N1bWVudCA9IGFwcC5kb2NcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgY29uc3QgYnVuZGxlUmVxdWlyZU1vZHVsZSA9IG5hbWUgPT4gYXBwLnJlcXVpcmVNb2R1bGUocmVtb3ZlV2VleFByZWZpeChuYW1lKSlcblxuICBjb25zdCB3ZWV4R2xvYmFsT2JqZWN0ID0ge1xuICAgIGNvbmZpZzogYXBwLm9wdGlvbnMsXG4gICAgZGVmaW5lOiBidW5kbGVEZWZpbmUsXG4gICAgYm9vdHN0cmFwOiBidW5kbGVCb290c3RyYXAsXG4gICAgcmVxdWlyZU1vZHVsZTogYnVuZGxlUmVxdWlyZU1vZHVsZSxcbiAgICBkb2N1bWVudDogYnVuZGxlRG9jdW1lbnQsXG4gICAgVm06IGJ1bmRsZVZtXG4gIH1cblxuICBPYmplY3QuZnJlZXplKHdlZXhHbG9iYWxPYmplY3QpXG5cbiAgLy8gcHJlcGFyZSBjb2RlXG4gIGxldCBmdW5jdGlvbkJvZHlcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICh0eXBlb2YgY29kZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIGBmdW5jdGlvbiAoKSB7Li4ufWAgLT4gYHsuLi59YFxuICAgIC8vIG5vdCB2ZXJ5IHN0cmljdFxuICAgIGZ1bmN0aW9uQm9keSA9IGNvZGUudG9TdHJpbmcoKS5zdWJzdHIoMTIpXG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgZWxzZSBpZiAoY29kZSkge1xuICAgIGZ1bmN0aW9uQm9keSA9IGNvZGUudG9TdHJpbmcoKVxuICB9XG4gIC8vIHdyYXAgSUZGRSBhbmQgdXNlIHN0cmljdCBtb2RlXG4gIGZ1bmN0aW9uQm9keSA9IGAoZnVuY3Rpb24oZ2xvYmFsKXtcXG5cXG5cInVzZSBzdHJpY3RcIjtcXG5cXG4gJHtmdW5jdGlvbkJvZHl9IFxcblxcbn0pKE9iamVjdC5jcmVhdGUodGhpcykpYFxuXG4gIC8vIHJ1biBjb2RlIGFuZCBnZXQgcmVzdWx0XG4gIGNvbnN0IHsgV1hFbnZpcm9ubWVudCB9ID0gZ2xvYmFsXG4gIGNvbnN0IHRpbWVyQVBJcyA9IHt9XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChXWEVudmlyb25tZW50ICYmIFdYRW52aXJvbm1lbnQucGxhdGZvcm0gIT09ICdXZWInKSB7XG4gICAgLy8gdGltZXIgQVBJcyBwb2x5ZmlsbCBpbiBuYXRpdmVcbiAgICBjb25zdCB0aW1lciA9IGFwcC5yZXF1aXJlTW9kdWxlKCd0aW1lcicpXG4gICAgT2JqZWN0LmFzc2lnbih0aW1lckFQSXMsIHtcbiAgICAgIHNldFRpbWVvdXQ6ICguLi5hcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXJnc1swXSguLi5hcmdzLnNsaWNlKDIpKVxuICAgICAgICB9XG4gICAgICAgIHRpbWVyLnNldFRpbWVvdXQoaGFuZGxlciwgYXJnc1sxXSlcbiAgICAgICAgcmV0dXJuIGFwcC5kb2MudGFza0NlbnRlci5jYWxsYmFja01hbmFnZXIubGFzdENhbGxiYWNrSWQudG9TdHJpbmcoKVxuICAgICAgfSxcbiAgICAgIHNldEludGVydmFsOiAoLi4uYXJncykgPT4ge1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGFyZ3NbMF0oLi4uYXJncy5zbGljZSgyKSlcbiAgICAgICAgfVxuICAgICAgICB0aW1lci5zZXRJbnRlcnZhbChoYW5kbGVyLCBhcmdzWzFdKVxuICAgICAgICByZXR1cm4gYXBwLmRvYy50YXNrQ2VudGVyLmNhbGxiYWNrTWFuYWdlci5sYXN0Q2FsbGJhY2tJZC50b1N0cmluZygpXG4gICAgICB9LFxuICAgICAgY2xlYXJUaW1lb3V0OiAobikgPT4ge1xuICAgICAgICB0aW1lci5jbGVhclRpbWVvdXQobilcbiAgICAgIH0sXG4gICAgICBjbGVhckludGVydmFsOiAobikgPT4ge1xuICAgICAgICB0aW1lci5jbGVhckludGVydmFsKG4pXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICAvLyBydW4gY29kZSBhbmQgZ2V0IHJlc3VsdFxuICBjb25zdCBnbG9iYWxPYmplY3RzID0gT2JqZWN0LmFzc2lnbih7XG4gICAgZGVmaW5lOiBidW5kbGVEZWZpbmUsXG4gICAgcmVxdWlyZTogYnVuZGxlUmVxdWlyZSxcbiAgICBib290c3RyYXA6IGJ1bmRsZUJvb3RzdHJhcCxcbiAgICByZWdpc3RlcjogYnVuZGxlUmVnaXN0ZXIsXG4gICAgcmVuZGVyOiBidW5kbGVSZW5kZXIsXG4gICAgX193ZWV4X2RlZmluZV9fOiBidW5kbGVEZWZpbmUsIC8vIGFsaWFzIGZvciBkZWZpbmVcbiAgICBfX3dlZXhfYm9vdHN0cmFwX186IGJ1bmRsZUJvb3RzdHJhcCwgLy8gYWxpYXMgZm9yIGJvb3RzdHJhcFxuICAgIF9fd2VleF9kb2N1bWVudF9fOiBidW5kbGVEb2N1bWVudCxcbiAgICBfX3dlZXhfcmVxdWlyZV9fOiBidW5kbGVSZXF1aXJlTW9kdWxlLFxuICAgIF9fd2VleF92aWV3bW9kZWxfXzogYnVuZGxlVm0sXG4gICAgd2VleDogd2VleEdsb2JhbE9iamVjdFxuICB9LCB0aW1lckFQSXMsIHNlcnZpY2VzKVxuICBpZiAoIWNhbGxGdW5jdGlvbk5hdGl2ZShnbG9iYWxPYmplY3RzLCBmdW5jdGlvbkJvZHkpKSB7XG4gICAgLy8gSWYgZmFpbGVkIHRvIGNvbXBpbGUgZnVuY3Rpb25Cb2R5IG9uIG5hdGl2ZSBzaWRlLFxuICAgIC8vIGZhbGxiYWNrIHRvIGNhbGxGdW5jdGlvbi5cbiAgICBjYWxsRnVuY3Rpb24oZ2xvYmFsT2JqZWN0cywgZnVuY3Rpb25Cb2R5KVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIENhbGwgYSBuZXcgZnVuY3Rpb24gYm9keSB3aXRoIHNvbWUgZ2xvYmFsIG9iamVjdHMuXG4gKiBAcGFyYW0gIHtvYmplY3R9IGdsb2JhbE9iamVjdHNcbiAqIEBwYXJhbSAge3N0cmluZ30gY29kZVxuICogQHJldHVybiB7YW55fVxuICovXG5mdW5jdGlvbiBjYWxsRnVuY3Rpb24gKGdsb2JhbE9iamVjdHMsIGJvZHkpIHtcbiAgY29uc3QgZ2xvYmFsS2V5cyA9IFtdXG4gIGNvbnN0IGdsb2JhbFZhbHVlcyA9IFtdXG4gIGZvciAoY29uc3Qga2V5IGluIGdsb2JhbE9iamVjdHMpIHtcbiAgICBnbG9iYWxLZXlzLnB1c2goa2V5KVxuICAgIGdsb2JhbFZhbHVlcy5wdXNoKGdsb2JhbE9iamVjdHNba2V5XSlcbiAgfVxuICBnbG9iYWxLZXlzLnB1c2goYm9keSlcblxuICBjb25zdCByZXN1bHQgPSBuZXcgRnVuY3Rpb24oLi4uZ2xvYmFsS2V5cylcbiAgcmV0dXJuIHJlc3VsdCguLi5nbG9iYWxWYWx1ZXMpXG59XG5cbi8qKlxuICogQ2FsbCBhIG5ldyBmdW5jdGlvbiBnZW5lcmF0ZWQgb24gdGhlIFY4IG5hdGl2ZSBzaWRlLlxuICogQHBhcmFtICB7b2JqZWN0fSBnbG9iYWxPYmplY3RzXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGJvZHlcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHJldHVybiB0cnVlIGlmIG5vIGVycm9yIG9jY3VycmVkLlxuICovXG5mdW5jdGlvbiBjYWxsRnVuY3Rpb25OYXRpdmUgKGdsb2JhbE9iamVjdHMsIGJvZHkpIHtcbiAgaWYgKHR5cGVvZiBjb21waWxlQW5kUnVuQnVuZGxlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBsZXQgZm4gPSB2b2lkIDBcbiAgbGV0IGlzTmF0aXZlQ29tcGlsZU9rID0gZmFsc2VcbiAgbGV0IHNjcmlwdCA9ICcoZnVuY3Rpb24gKCdcbiAgY29uc3QgZ2xvYmFsS2V5cyA9IFtdXG4gIGNvbnN0IGdsb2JhbFZhbHVlcyA9IFtdXG4gIGZvciAoY29uc3Qga2V5IGluIGdsb2JhbE9iamVjdHMpIHtcbiAgICBnbG9iYWxLZXlzLnB1c2goa2V5KVxuICAgIGdsb2JhbFZhbHVlcy5wdXNoKGdsb2JhbE9iamVjdHNba2V5XSlcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGdsb2JhbEtleXMubGVuZ3RoIC0gMTsgKytpKSB7XG4gICAgc2NyaXB0ICs9IGdsb2JhbEtleXNbaV1cbiAgICBzY3JpcHQgKz0gJywnXG4gIH1cbiAgc2NyaXB0ICs9IGdsb2JhbEtleXNbZ2xvYmFsS2V5cy5sZW5ndGggLSAxXVxuICBzY3JpcHQgKz0gJykgeydcbiAgc2NyaXB0ICs9IGJvZHlcbiAgc2NyaXB0ICs9ICd9ICknXG5cbiAgdHJ5IHtcbiAgICBjb25zdCB3ZWV4ID0gZ2xvYmFsT2JqZWN0cy53ZWV4IHx8IHt9XG4gICAgY29uc3QgY29uZmlnID0gd2VleC5jb25maWcgfHwge31cbiAgICBmbiA9IGNvbXBpbGVBbmRSdW5CdW5kbGUoc2NyaXB0LCBjb25maWcuYnVuZGxlVXJsLCBjb25maWcuYnVuZGxlRGlnZXN0LCBjb25maWcuY29kZUNhY2hlUGF0aClcbiAgICBpZiAoZm4gJiYgdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmbiguLi5nbG9iYWxWYWx1ZXMpXG4gICAgICBpc05hdGl2ZUNvbXBpbGVPayA9IHRydWVcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGUpXG4gIH1cblxuICByZXR1cm4gaXNOYXRpdmVDb21waWxlT2tcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBpbnN0YW5jZSBjb250cm9scyBmcm9tIG5hdGl2ZVxuICpcbiAqIC0gaW5pdCBidW5kbGVcbiAqIC0gZmlyZSBldmVudFxuICogLSBjYWxsYmFja1xuICogLSBkZXN0cm95XG4gKlxuICogY29ycmVzcG9uZGVkIHdpdGggdGhlIEFQSSBvZiBpbnN0YW5jZSBtYW5hZ2VyIChmcmFtZXdvcmsuanMpXG4gKi9cbmV4cG9ydCB7IGluaXQgfSBmcm9tICcuL2luaXQnXG5cbmV4cG9ydCB7XG4gIHJlZnJlc2gsXG4gIGRlc3Ryb3ksXG4gIGdldFJvb3RFbGVtZW50LFxuICBmaXJlRXZlbnQsXG4gIGNhbGxiYWNrLFxuICB1cGRhdGVBY3Rpb25zLFxuICBjYWxsVGFza3Ncbn0gZnJvbSAnLi9taXNjJ1xuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaWZmZXIge1xuICBjb25zdHJ1Y3RvciAoaWQpIHtcbiAgICB0aGlzLmlkID0gaWRcbiAgICB0aGlzLm1hcCA9IFtdXG4gICAgdGhpcy5ob29rcyA9IFtdXG4gIH1cbiAgaXNFbXB0eSAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmxlbmd0aCA9PT0gMFxuICB9XG4gIGFwcGVuZCAodHlwZSwgZGVwdGggPSAwLCByZWYsIGhhbmRsZXIpIHtcbiAgICBpZiAoIXRoaXMuaGFzVGltZXIpIHtcbiAgICAgIHRoaXMuaGFzVGltZXIgPSB0cnVlXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5oYXNUaW1lciA9IGZhbHNlXG4gICAgICAgIHRoaXMuZmx1c2godHJ1ZSlcbiAgICAgIH0sIDApXG4gICAgfVxuICAgIGNvbnN0IG1hcCA9IHRoaXMubWFwXG4gICAgaWYgKCFtYXBbZGVwdGhdKSB7XG4gICAgICBtYXBbZGVwdGhdID0ge31cbiAgICB9XG4gICAgY29uc3QgZ3JvdXAgPSBtYXBbZGVwdGhdXG4gICAgaWYgKCFncm91cFt0eXBlXSkge1xuICAgICAgZ3JvdXBbdHlwZV0gPSB7fVxuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ2VsZW1lbnQnKSB7XG4gICAgICBpZiAoIWdyb3VwW3R5cGVdW3JlZl0pIHtcbiAgICAgICAgZ3JvdXBbdHlwZV1bcmVmXSA9IFtdXG4gICAgICB9XG4gICAgICBncm91cFt0eXBlXVtyZWZdLnB1c2goaGFuZGxlcilcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBncm91cFt0eXBlXVtyZWZdID0gaGFuZGxlclxuICAgIH1cbiAgfVxuICBmbHVzaCAoaXNUaW1lb3V0KSB7XG4gICAgY29uc3QgbWFwID0gdGhpcy5tYXAuc2xpY2UoKVxuICAgIHRoaXMubWFwLmxlbmd0aCA9IDBcbiAgICBtYXAuZm9yRWFjaCgoZ3JvdXApID0+IHtcbiAgICAgIGNhbGxUeXBlTWFwKGdyb3VwLCAncmVwZWF0JylcbiAgICAgIGNhbGxUeXBlTWFwKGdyb3VwLCAnc2hvd24nKVxuICAgICAgY2FsbFR5cGVMaXN0KGdyb3VwLCAnZWxlbWVudCcpXG4gICAgfSlcblxuICAgIGNvbnN0IGhvb2tzID0gdGhpcy5ob29rcy5zbGljZSgpXG4gICAgdGhpcy5ob29rcy5sZW5ndGggPSAwXG4gICAgaG9va3MuZm9yRWFjaCgoZm4pID0+IHtcbiAgICAgIGZuKClcbiAgICB9KVxuXG4gICAgaWYgKCF0aGlzLmlzRW1wdHkoKSkge1xuICAgICAgdGhpcy5mbHVzaCgpXG4gICAgfVxuICB9XG4gIHRoZW4gKGZuKSB7XG4gICAgdGhpcy5ob29rcy5wdXNoKGZuKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxUeXBlTWFwIChncm91cCwgdHlwZSkge1xuICBjb25zdCBtYXAgPSBncm91cFt0eXBlXVxuICBmb3IgKGNvbnN0IHJlZiBpbiBtYXApIHtcbiAgICBtYXBbcmVmXSgpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbFR5cGVMaXN0IChncm91cCwgdHlwZSkge1xuICBjb25zdCBtYXAgPSBncm91cFt0eXBlXVxuICBmb3IgKGNvbnN0IHJlZiBpbiBtYXApIHtcbiAgICBjb25zdCBsaXN0ID0gbWFwW3JlZl1cbiAgICBsaXN0LmZvckVhY2goKGhhbmRsZXIpID0+IHsgaGFuZGxlcigpIH0pXG4gIH1cbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBXZWV4IEFwcCBjb25zdHJ1Y3RvciAmIGRlZmluaXRpb25cbiAqL1xuXG5pbXBvcnQgRGlmZmVyIGZyb20gJy4vZGlmZmVyJ1xuaW1wb3J0IHJlbmRlcmVyIGZyb20gJy4uL2NvbmZpZydcblxuLyoqXG4gKiBBcHAgY29uc3RydWN0b3IgZm9yIFdlZXggZnJhbWV3b3JrLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAgKGlkLCBvcHRpb25zKSB7XG4gIHRoaXMuaWQgPSBpZFxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHRoaXMudm0gPSBudWxsXG4gIHRoaXMuY3VzdG9tQ29tcG9uZW50TWFwID0ge31cbiAgdGhpcy5jb21tb25Nb2R1bGVzID0ge31cblxuICAvLyBkb2N1bWVudFxuICB0aGlzLmRvYyA9IG5ldyByZW5kZXJlci5Eb2N1bWVudChcbiAgICBpZCxcbiAgICB0aGlzLm9wdGlvbnMuYnVuZGxlVXJsLFxuICAgIG51bGwsXG4gICAgcmVuZGVyZXIuTGlzdGVuZXJcbiAgKVxuICB0aGlzLmRpZmZlciA9IG5ldyBEaWZmZXIoaWQpXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbi8qKlxuICogQGZpbGVPdmVydmlld1xuICogV2VleCBpbnN0YW5jZSBjb25zdHJ1Y3RvciAmIGRlZmluaXRpb25cbiAqL1xuXG5pbXBvcnQgeyByZXF1aXJlTW9kdWxlIH0gZnJvbSAnLi9yZWdpc3RlcidcbmltcG9ydCB7IHVwZGF0ZUFjdGlvbnMsIGNhbGxUYXNrcyB9IGZyb20gJy4vY3RybC9pbmRleCdcbmltcG9ydCBBcHAgZnJvbSAnLi9pbnN0YW5jZSdcblxuLyoqXG4gKiBAZGVwcmVjYXRlZFxuICovXG5BcHAucHJvdG90eXBlLnJlcXVpcmVNb2R1bGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICByZXR1cm4gcmVxdWlyZU1vZHVsZSh0aGlzLCBuYW1lKVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKi9cbkFwcC5wcm90b3R5cGUudXBkYXRlQWN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHVwZGF0ZUFjdGlvbnModGhpcylcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZFxuICovXG5BcHAucHJvdG90eXBlLmNhbGxUYXNrcyA9IGZ1bmN0aW9uICh0YXNrcykge1xuICByZXR1cm4gY2FsbFRhc2tzKHRoaXMsIHRhc2tzKVxufVxuXG4vKipcbiAqIFByZXZlbnQgbW9kaWZpY2F0aW9uIG9mIEFwcCBhbmQgQXBwLnByb3RvdHlwZVxuICovXG5PYmplY3QuZnJlZXplKEFwcClcbk9iamVjdC5mcmVlemUoQXBwLnByb3RvdHlwZSlcblxuZXhwb3J0IGRlZmF1bHQgQXBwXG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBpbnN0YW5jZU1hcCA9IHt9XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCBBcHAgZnJvbSAnLi4vYXBwL2luZGV4J1xuaW1wb3J0IHsgaW5zdGFuY2VNYXAgfSBmcm9tICcuL21hcCdcbmltcG9ydCB7IGluaXQgYXMgaW5pdEFwcCB9IGZyb20gJy4uL2FwcC9jdHJsL2luZGV4J1xuaW1wb3J0IHsgcmVzZXRUYXJnZXQgfSBmcm9tICcuLi9jb3JlL2RlcCdcblxuLyoqXG4gKiBDcmVhdGUgYSBXZWV4IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gaWRcbiAqIEBwYXJhbSAge3N0cmluZ30gY29kZVxuICogQHBhcmFtICB7b2JqZWN0fSBvcHRpb25zXG4gKiAgICAgICAgIG9wdGlvbiBgSEFTX0xPR2AgZW5hYmxlIHByaW50IGxvZ1xuICogQHBhcmFtICB7b2JqZWN0fSBkYXRhXG4gKiBAcGFyYW0gIHtvYmplY3R9IGluZm8geyBjcmVhdGVkLCAuLi4gc2VydmljZXMgfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW5zdGFuY2UgKGlkLCBjb2RlLCBvcHRpb25zLCBkYXRhLCBpbmZvKSB7XG4gIGNvbnN0IHsgc2VydmljZXMgfSA9IGluZm8gfHwge31cbiAgcmVzZXRUYXJnZXQoKVxuICBsZXQgaW5zdGFuY2UgPSBpbnN0YW5jZU1hcFtpZF1cbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgbGV0IHJlc3VsdFxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAoIWluc3RhbmNlKSB7XG4gICAgaW5zdGFuY2UgPSBuZXcgQXBwKGlkLCBvcHRpb25zKVxuICAgIGluc3RhbmNlTWFwW2lkXSA9IGluc3RhbmNlXG4gICAgcmVzdWx0ID0gaW5pdEFwcChpbnN0YW5jZSwgY29kZSwgZGF0YSwgc2VydmljZXMpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmVzdWx0ID0gbmV3IEVycm9yKGBpbnZhbGlkIGluc3RhbmNlIGlkIFwiJHtpZH1cImApXG4gIH1cbiAgcmV0dXJuIChyZXN1bHQgaW5zdGFuY2VvZiBFcnJvcikgPyByZXN1bHQgOiBpbnN0YW5jZVxufVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7XG4gIHJlZnJlc2gsXG4gIGRlc3Ryb3lcbn0gZnJvbSAnLi4vYXBwL2N0cmwvaW5kZXgnXG5pbXBvcnQgeyBpbnN0YW5jZU1hcCB9IGZyb20gJy4vbWFwJ1xuaW1wb3J0IHsgcmVzZXRUYXJnZXQgfSBmcm9tICcuLi9jb3JlL2RlcCdcblxuLyoqXG4gKiBJbml0IGNvbmZpZyBpbmZvcm1hdGlvbnMgZm9yIFdlZXggZnJhbWV3b3JrXG4gKiBAcGFyYW0gIHtvYmplY3R9IGNmZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdCAoY2ZnKSB7XG4gIGNvbmZpZy5Eb2N1bWVudCA9IGNmZy5Eb2N1bWVudFxuICBjb25maWcuRWxlbWVudCA9IGNmZy5FbGVtZW50XG4gIGNvbmZpZy5Db21tZW50ID0gY2ZnLkNvbW1lbnRcbiAgY29uZmlnLnNlbmRUYXNrcyA9IGNmZy5zZW5kVGFza3NcbiAgY29uZmlnLkxpc3RlbmVyID0gY2ZnLkxpc3RlbmVyXG59XG5cbi8qKlxuICogUmVmcmVzaCBhIFdlZXggaW5zdGFuY2Ugd2l0aCBkYXRhLlxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gaWRcbiAqIEBwYXJhbSAge29iamVjdH0gZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaEluc3RhbmNlIChpZCwgZGF0YSkge1xuICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlTWFwW2lkXVxuICBsZXQgcmVzdWx0XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChpbnN0YW5jZSkge1xuICAgIHJlc3VsdCA9IHJlZnJlc2goaW5zdGFuY2UsIGRhdGEpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmVzdWx0ID0gbmV3IEVycm9yKGBpbnZhbGlkIGluc3RhbmNlIGlkIFwiJHtpZH1cImApXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIERlc3Ryb3kgYSBXZWV4IGluc3RhbmNlLlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveUluc3RhbmNlIChpZCkge1xuICAvLyBNYXJrdXAgc29tZSBnbG9iYWwgc3RhdGUgaW4gbmF0aXZlIHNpZGVcbiAgaWYgKHR5cGVvZiBtYXJrdXBTdGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG1hcmt1cFN0YXRlKClcbiAgfVxuXG4gIHJlc2V0VGFyZ2V0KClcbiAgY29uc3QgaW5zdGFuY2UgPSBpbnN0YW5jZU1hcFtpZF1cbiAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgaWYgKCFpbnN0YW5jZSkge1xuICAgIHJldHVybiBuZXcgRXJyb3IoYGludmFsaWQgaW5zdGFuY2UgaWQgXCIke2lkfVwiYClcbiAgfVxuICBkZXN0cm95KGluc3RhbmNlKVxuICBkZWxldGUgaW5zdGFuY2VNYXBbaWRdXG4gIC8vIG5vdGlmeUNvbnRleHREaXNwb3NlZCBpcyB1c2VkIHRvIHRlbGwgdjggdG8gZG8gYSBmdWxsIEdDLFxuICAvLyBidXQgdGhpcyB3b3VsZCBoYXZlIGEgbmVnYXRpdmUgcGVyZm9ybWFuY2UgaW1wYWN0IG9uIHdlZXgsXG4gIC8vIGJlY2F1c2UgYWxsIHRoZSBpbmxpbmUgY2FjaGUgaW4gdjggd291bGQgZ2V0IGNsZWFyZWRcbiAgLy8gZHVyaW5nIGEgZnVsbCBHQy5cbiAgLy8gVG8gdGFrZSBjYXJlIG9mIGJvdGggbWVtb3J5IGFuZCBwZXJmb3JtYW5jZSwganVzdCB0ZWxsIHY4XG4gIC8vIHRvIGRvIGEgZnVsbCBHQyBldmVyeSBlaWdodGVlbiB0aW1lcy5cbiAgY29uc3QgaWROdW0gPSBNYXRoLnJvdW5kKGlkKVxuICBjb25zdCByb3VuZCA9IDE4XG4gIGlmIChpZE51bSA+IDApIHtcbiAgICBjb25zdCByZW1haW5kZXIgPSBpZE51bSAlIHJvdW5kXG4gICAgaWYgKCFyZW1haW5kZXIgJiYgdHlwZW9mIG5vdGlmeVRyaW1NZW1vcnkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG5vdGlmeVRyaW1NZW1vcnkoKVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5zdGFuY2VNYXBcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IFZtIGZyb20gJy4uL3ZtL2luZGV4J1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQge1xuICBpbml0TW9kdWxlcyxcbiAgaW5pdE1ldGhvZHNcbn0gZnJvbSAnLi4vYXBwL3JlZ2lzdGVyJ1xuXG5jb25zdCB7XG4gIG5hdGl2ZUNvbXBvbmVudE1hcFxufSA9IGNvbmZpZ1xuXG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBuYW1lIG9mIGVhY2ggbmF0aXZlIGNvbXBvbmVudC5cbiAqIEBwYXJhbSAge2FycmF5fSBjb21wb25lbnRzIGFycmF5IG9mIG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50cyAoY29tcG9uZW50cykge1xuICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgIGNvbXBvbmVudHMuZm9yRWFjaChmdW5jdGlvbiByZWdpc3RlciAobmFtZSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG5hdGl2ZUNvbXBvbmVudE1hcFtuYW1lXSA9IHRydWVcbiAgICAgIH1cbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBlbHNlIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG5hbWUudHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgbmF0aXZlQ29tcG9uZW50TWFwW25hbWUudHlwZV0gPSBuYW1lXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBuYW1lIGFuZCBtZXRob2RzIG9mIGVhY2ggbW9kdWxlLlxuICogQHBhcmFtICB7b2JqZWN0fSBtb2R1bGVzIGEgb2JqZWN0IG9mIG1vZHVsZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyTW9kdWxlcyAobW9kdWxlcykge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAodHlwZW9mIG1vZHVsZXMgPT09ICdvYmplY3QnKSB7XG4gICAgaW5pdE1vZHVsZXMobW9kdWxlcylcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBuYW1lIGFuZCBtZXRob2RzIG9mIGVhY2ggYXBpLlxuICogQHBhcmFtICB7b2JqZWN0fSBhcGlzIGEgb2JqZWN0IG9mIGFwaXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyTWV0aG9kcyAobWV0aG9kcykge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICBpZiAodHlwZW9mIG1ldGhvZHMgPT09ICdvYmplY3QnKSB7XG4gICAgaW5pdE1ldGhvZHMoVm0sIG1ldGhvZHMpXG4gIH1cbn1cblxuLy8gQHRvZG86IEhhY2sgZm9yIHRoaXMgZnJhbWV3b3JrIG9ubHkuIFdpbGwgYmUgcmUtZGVzaWduZWQgb3IgcmVtb3ZlZCBsYXRlci5cbmdsb2JhbC5yZWdpc3Rlck1ldGhvZHMgPSByZWdpc3Rlck1ldGhvZHNcbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuaW1wb3J0IHsgaW5zdGFuY2VNYXAgfSBmcm9tICcuL21hcCdcbmltcG9ydCB7XG4gIGZpcmVFdmVudCxcbiAgY2FsbGJhY2tcbn0gZnJvbSAnLi4vYXBwL2N0cmwvaW5kZXgnXG5cbmNvbnN0IGpzSGFuZGxlcnMgPSB7XG4gIGZpcmVFdmVudDogKGlkLCAuLi5hcmdzKSA9PiB7XG4gICAgcmV0dXJuIGZpcmVFdmVudChpbnN0YW5jZU1hcFtpZF0sIC4uLmFyZ3MpXG4gIH0sXG4gIGNhbGxiYWNrOiAoaWQsIC4uLmFyZ3MpID0+IHtcbiAgICByZXR1cm4gY2FsbGJhY2soaW5zdGFuY2VNYXBbaWRdLCAuLi5hcmdzKVxuICB9XG59XG5cbi8qKlxuICogQWNjZXB0IGNhbGxzIGZyb20gbmF0aXZlIChldmVudCBvciBjYWxsYmFjaykuXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHBhcmFtICB7YXJyYXl9IHRhc2tzIGxpc3Qgd2l0aCBgbWV0aG9kYCBhbmQgYGFyZ3NgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNlaXZlVGFza3MgKGlkLCB0YXNrcykge1xuICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlTWFwW2lkXVxuICBpZiAoaW5zdGFuY2UgJiYgQXJyYXkuaXNBcnJheSh0YXNrcykpIHtcbiAgICBjb25zdCByZXN1bHRzID0gW11cbiAgICB0YXNrcy5mb3JFYWNoKCh0YXNrKSA9PiB7XG4gICAgICBjb25zdCBoYW5kbGVyID0ganNIYW5kbGVyc1t0YXNrLm1ldGhvZF1cbiAgICAgIGNvbnN0IGFyZ3MgPSBbLi4udGFzay5hcmdzXVxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBhcmdzLnVuc2hpZnQoaWQpXG4gICAgICAgIHJlc3VsdHMucHVzaChoYW5kbGVyKC4uLmFyZ3MpKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHJlc3VsdHNcbiAgfVxuICByZXR1cm4gbmV3IEVycm9yKGBpbnZhbGlkIGluc3RhbmNlIGlkIFwiJHtpZH1cIiBvciB0YXNrc2ApXG59XG4iLCIvKlxuICogTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuICogb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4gKiBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuICogdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuICogXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4gKiB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4gKiBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuICogXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbiAqIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuICogc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuICogdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbmltcG9ydCB7IGluc3RhbmNlTWFwIH0gZnJvbSAnLi9tYXAnXG5pbXBvcnQge1xuICBnZXRSb290RWxlbWVudFxufSBmcm9tICcuLi9hcHAvY3RybC9pbmRleCdcblxuLyoqXG4gKiBHZXQgYSB3aG9sZSBlbGVtZW50IHRyZWUgb2YgYW4gaW5zdGFuY2UgZm9yIGRlYnVnZ2luZy5cbiAqIEBwYXJhbSAge3N0cmluZ30gaWRcbiAqIEByZXR1cm4ge29iamVjdH0gYSB2aXJ0dWFsIGRvbSB0cmVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290IChpZCkge1xuICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlTWFwW2lkXVxuICBsZXQgcmVzdWx0XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChpbnN0YW5jZSkge1xuICAgIHJlc3VsdCA9IGdldFJvb3RFbGVtZW50KGluc3RhbmNlKVxuICB9XG4gIGVsc2Uge1xuICAgIHJlc3VsdCA9IG5ldyBFcnJvcihgaW52YWxpZCBpbnN0YW5jZSBpZCBcIiR7aWR9XCJgKVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cbiIsIi8qXG4gKiBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4gKiBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4gKiB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4gKiBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2VcbiAqIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbiAqIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4gKiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuICogS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gKiBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4gKiB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IFdlZXggZnJhbWV3b3JrIGVudHJ5LlxuICovXG5cbmltcG9ydCAqIGFzIG1ldGhvZHMgZnJvbSAnLi9hcGkvbWV0aG9kcydcblxuaW1wb3J0IFZtIGZyb20gJy4vdm0nXG5leHBvcnQgeyBjcmVhdGVJbnN0YW5jZSB9IGZyb20gJy4vc3RhdGljL2NyZWF0ZSdcbmV4cG9ydCB7IGluaXQsIHJlZnJlc2hJbnN0YW5jZSwgZGVzdHJveUluc3RhbmNlIH0gZnJvbSAnLi9zdGF0aWMvbGlmZSdcbmltcG9ydCB7IHJlZ2lzdGVyQ29tcG9uZW50cywgcmVnaXN0ZXJNb2R1bGVzLCByZWdpc3Rlck1ldGhvZHMgfSBmcm9tICcuL3N0YXRpYy9yZWdpc3RlcidcbmV4cG9ydCB7IHJlY2VpdmVUYXNrcyB9IGZyb20gJy4vc3RhdGljL2JyaWRnZSdcbmV4cG9ydCB7IGdldFJvb3QgfSBmcm9tICcuL3N0YXRpYy9taXNjJ1xuXG4vLyByZWdpc3RlciBzcGVjaWFsIG1ldGhvZHMgZm9yIFdlZXggZnJhbWV3b3JrXG5yZWdpc3Rlck1ldGhvZHMobWV0aG9kcylcblxuLyoqXG4gKiBQcmV2ZW50IG1vZGlmaWNhdGlvbiBvZiBWbSBhbmQgVm0ucHJvdG90eXBlXG4gKi9cbk9iamVjdC5mcmVlemUoVm0pXG5cbmV4cG9ydCB7IHJlZ2lzdGVyQ29tcG9uZW50cywgcmVnaXN0ZXJNb2R1bGVzLCByZWdpc3Rlck1ldGhvZHMgfVxuIiwiLypcbiAqIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbiAqIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuICogZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbiAqIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbiAqIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuICogd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBzZXR1cCBmcm9tICcuL3NldHVwJ1xuaW1wb3J0ICogYXMgV2VleCBmcm9tICcuLi9mcmFtZXdvcmtzL2xlZ2FjeS9pbmRleCdcblxuc2V0dXAoeyBXZWV4IH0pXG4iXSwibmFtZXMiOlsiRWxlbWVudCIsImluaXQiLCJzZXJ2aWNlcyIsImluaXRUYXNrSGFuZGxlciIsIkJyb2FkY2FzdENoYW5uZWwiLCJ0eXBvZiIsInVpZCIsImNvbmZpZyIsInNldElkIiwiaW5pdE1ldGhvZHMiLCJkb3duZ3JhZGUuY2hlY2siLCJyZWdpc3RlciIsImZpcmVFdmVudCIsImNhbGxiYWNrIiwiQXBwIiwicmVuZGVyZXIiLCJjcmVhdGVJbnN0YW5jZSIsImluaXRBcHAiLCJuYXRpdmVDb21wb25lbnRNYXAiLCJyZWdpc3RlckNvbXBvbmVudHMiLCJyZWdpc3Rlck1vZHVsZXMiLCJyZWNlaXZlVGFza3MiLCJnZXRSb290IiwibWV0aG9kcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkEsSUFBSSxXQUFXLEdBQUcsRUFBQztBQUNuQixBQUFPLFNBQVMsUUFBUSxJQUFJO0VBQzFCLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUU7Q0FDbEM7O0FBRUQsQUFBTyxTQUFTLEtBQUssRUFBRSxDQUFDLEVBQUU7RUFDeEIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQztFQUMzQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0NBQ3BDOztBQUVELEFBQU8sU0FBUyxjQUFjLEVBQUUsTUFBTSxFQUFFO0VBQ3RDLElBQUksT0FBTyxJQUFJLEtBQUssVUFBVSxFQUFFO0lBQzlCLE9BQU8sRUFBRTtHQUNWO0VBQ0QsTUFBTSxNQUFNLEdB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QUFPLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7TUFDekMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7TUFDZCxNQUFNO0lBQ1IsS0FBSyxLQUFLO01BQ1IsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7TUFDekMsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7TUFDekMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7TUFDZCxNQUFNO0lBQ1IsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU07SUFDM0QsS0FBSyxJQUFJLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTTtJQUN6QyxLQUFLLEdBQUcsRUFBRSxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNO0lBQ3ZDLEtBQUssSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU07SUFDekMsS0FBSyxHQUFHLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTTtJQUN2QyxLQUFLLElBQUksRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNO0lBQ3pDLFNBQVMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLENBQUMs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
