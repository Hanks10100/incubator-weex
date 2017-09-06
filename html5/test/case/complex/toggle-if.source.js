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

define('@weex-component/b10eae658724a2c7d23a07232d6eca7a', function(require, exports, module) {

      ;
      module.exports = {
          data: function() {
              return {
                  show: true
              }
          },
          methods: {
              toggle: function() {
                  this.show = !this.show;
              }
          }
      }


      ;
      module.exports.style = {}

      ;
      module.exports.template = {
          "type": "div",
          "events": {
              "click": "toggle"
          },
          "children": [{
              "type": "text",
              "shown": function() {
                  return this.show
              },
              "attr": {
                  "value": "AAA"
              }
          }, {
              "type": "text",
              "attr": {
                  "value": "BBB"
              }
          }, {
              "type": "text",
              "shown": function() {
                  return !this.show
              },
              "attr": {
                  "value": "CCC"
              }
          }]
      }

      ;
  })

  // require module
  bootstrap('@weex-component/b10eae658724a2c7d23a07232d6eca7a', {
      "transformerVersion": "0.4.3"
  })