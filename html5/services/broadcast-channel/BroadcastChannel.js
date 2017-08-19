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
 * Implement the MessageEvent.
 *
 * This type has been simplified.
 * https://html.spec.whatwg.org/multipage/comms.html#messageevent
 * https://dom.spec.whatwg.org/#interface-event
 */
export class MessageEvent {
  /**
   * @param {string} type event type
   * @param {object} dict { data, origin, source, ports }
   */
  constructor (type, dict = {}) {
    this.type = type || 'message'

    this.data = dict.data || null
    this.origin = dict.origin || ''
    this.source = dict.source || null
    this.ports = dict.ports || []

    // inherit properties
    this.target = null
    this.timeStamp = Date.now()
  }
}

const channels = {}

/**
 * Implement the BroadcastChannel API.
 * This api can be used to achieve inter-instance communications.
 *
 * https://html.spec.whatwg.org/multipage/comms.html#broadcasting-to-other-browsing-contexts
 */
export class BroadcastChannel {
  /**
   * @param {string} name
   */
  constructor (name) {
    // the name property is readonly
    Object.defineProperty(this, 'name', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: String(name)
    })

    this._closed = false
    this.onmessage = null

    if (!channels[this.name]) {
      channels[this.name] = []
    }
    channels[this.name].push(this)
  }

  /**
   * Sends the given message to other BroadcastChannel objects set up for this channel.
   * @param {any} message
   */
  postMessage (message) {
    if (this._closed) {
      throw new Error(`BroadcastChannel "${this.name}" is closed.`)
    }

    const subscribers = channels[this.name]
    if (subscribers && subscribers.length) {
      for (let i = 0; i < subscribers.length; ++i) {
        const member = subscribers[i]
        if (member._closed || member === this) continue
        if (typeof member.onmessage === 'function') {
          member.onmessage(new MessageEvent('message', { data: message }))
        }
      }
    }
  }

  /**
   * Closes the BroadcastChannel object, opening it up to garbage collection.
   */
  close () {
    if (this._closed) {
      return
    }

    // remove itself from channels.
    if (channels[this.name]) {
      const subscribers = channels[this.name].filter(x => x !== this)
      if (subscribers.length) {
        channels[this.name] = subscribers
      }
      else {
        delete channels[this.name]
      }
    }

    this._closed = true
  }
}
