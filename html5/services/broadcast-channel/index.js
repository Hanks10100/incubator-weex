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

import { BroadcastChannel } from './BroadcastChannel'

const listeners = {}

export default {
  create (id) {
    if (typeof global.BroadcastChannel === 'function') {
      return {}
    }

    listeners[id] = []
    class InstanceBroadcastChannel extends BroadcastChannel {
      constructor (...args) {
        super(...args)
        listeners[id].push(this)
      }
    }
    return {
      instance: {
        BroadcastChannel: InstanceBroadcastChannel
      }
    }
  },

  destroy (id) {
    if (id && listeners[id]) {
      listeners[id].forEach(member => member.close())
      delete listeners[id]
    }
  }
}
