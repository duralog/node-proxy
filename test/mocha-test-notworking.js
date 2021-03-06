/*jslint forin: true, onevar: true, immed: true */

describe('weak()', function () {
  process.env['NODE_PATH'] += ':' + __dirname + "/../lib";

  var assert = require('assert'),
    undef,
    called, p,
    Proxy = require("../lib/node-proxy.js"),
    createProxyFunction = function(handlers, callTrap, constructorTrap) {
      called = "createProxyFunction";

      return Proxy.createFunction({
        "delete": function (name){
          called = "delete";
          var r = true;
          if (name in handlers) {
            r = (delete handlers[name]);
          }
          return r;
        },
        enumerate: function (){
          called = "enumerate";
          return Object.keys(handlers);
        },
        fix: function (){
          called = "fix";
          return handlers;
        },
        has: function (name){
          called = "has";
          return (name in handlers);
        },
        get: function (receiver, name){
          called = "get";
          if (!(name in handlers)) {
            return undef;
          }
          return "get" in handlers[name] && typeof(handlers[name].get) == "function" ?
              handlers[name].get.call(receiver) :
              (handlers[name].value || undef);
        },
        set: function (receiver, name, val){
          called = "set";
          if (!(name in handlers)) {
            defineProperty.call(this, name, {
              configurable:true,
              writable:true,
              enumerable:true,
              value:val,
              get:function (){return val;},
              set:function (v){val=v;}
            });
            called = "set";
            return true;
          }
          if (!handlers[name].configurable) {
            return false;
          }
          if ("set" in handlers[name]) {
            handlers[name].set.call(receiver, val);
          }

          handlers[name].value = val;
          return true;
        }
      }, callTrap);
    },
    createProxy = function (handlers) {
      called = "createProxy";

      function defineProperty(name, pd){
        called = "defineProperty";
        if (name in handlers && !handlers[name].configurable) {
          return null;
        }
        handlers[name] = pd;
        return null;
      }

      return Proxy.create({
        getOwnPropertyDescriptor:function (name){
          called = "getOwnPropertyDescriptor";
          return handlers.hasOwnProperty(name) ? handlers[name] : undef;
        },
        getPropertyDescriptor:function (name){
          called = "getPropertyDescriptor";
          return name in handlers ? handlers[name] : undef;
        },
        defineProperty: defineProperty,
        getOwnPropertyNames:function (){
          called = "getOwnPropertyNames";
          return Object.getOwnPropertyNames(handlers);
        },
        "delete":function (name){
          called = "delete";
          var r = true;
          if (name in handlers) {
            r = (delete handlers[name]);
          }
          return r;
        },
        enumerate:function (){
          called = "enumerate";
          return Object.keys(handlers);
        },
        fix:function (){
          called = "fix";
          return handlers;
        },
        has:function (name){
          called = "has";
          //console.log("has called on: "+name);
          //console.log(name in handlers)
          return (name in handlers);
        },
        hasOwn:function (name){
          called = "hasOwn";
          return handlers.hasOwnProperty(name);
        },
        get:function (receiver, name){
          called = "get";
          //console.log(arguments.callee.caller)
          if (!(name in handlers)) {
            return undef;
          }
          return "get" in handlers[name] && typeof(handlers[name].get) == "function" ?
              handlers[name].get.call(receiver) :
              (handlers[name].value || undef);
        },
        set:function (receiver, name, val){
          called = "set";
          if (!(name in handlers)) {
            defineProperty.call(this, name, {
              configurable:true,
              writable:true,
              enumerable:true,
              value:val,
              get:function (){return val;},
              set:function (v){val=v;}
            });
            called = "set";
            return true;
          }
          if (!handlers[name].configurable) {
            return false;
          }
          if ("set" in handlers[name]) {
            handlers[name].set.call(receiver, val);
          }

          handlers[name].value = val;
          return true;
        }
      });
    },
    proxyTest,
    clone,
    cloneProxy,
    proxyTrapTest,
    proxyTrapTestInstance,
    firstValue = "firstProp",
    names,
    count,
    regex = /regex/,
    base = {},
    handlers = {
      first: {
        get:function (){return firstValue;},
        set:function (val){firstValue = val;}
      }
    },
    funcHandlers = {
      test: {
        get:function(){return "working";}
      }
    },
    callTrap = function() {
      called = "callTrap";
      return this;
    };
    describe("Base Proxy methods", function() {
      proxyTrapTest = createProxyFunction(funcHandlers, callTrap);
        describe("Proxy.create", function() {
          proxyTest = createProxy(handlers);
          assert.equal(called, "createProxy", "createProxy was not the last method called");
          assert.ok(typeof proxyTest == "object");
        });

        describe("Proxy.createFunction", function() {
          //proxyTrapTest = createProxyFunction(funcHandlers, callTrap);
          assert.equal(called, "createProxyFunction", "createProxyFunction was not the last method called");
          //assert.ok(typeof proxyTrapTest == "function", "proxyTrapTest is not a function");
        });

        describe("Proxy.createFunction with optional constructor trap", function() {
          //proxyTrapTest = createProxyFunction(funcHandlers, callTrap, constructTrap);
        });

        describe("Proxy.isTrapping on proxy object", function() {
          assert.ok(Proxy.isTrapping(proxyTest), "proxyTest is not trapping");
        });

        describe("proxy function is callable", function() {
          console.log("...", proxyTrapTest)
          proxyTrapTest();
          assert.equal(called, "callTrap", "callTrap was not the last function called");
        });

        describe("proxy function has accessible properties", function() {
          assert.ok("test" in proxyTrapTest, "'test' not in proxyTrapTest");
        });

        describe("proxy function get properties", function() {
          assert.equal(proxyTrapTest.test, "working", "'test' not in proxyTrapTest");
        });

        describe("proxy function as constructor", function() {
          proxyTrapTestInstance = new proxyTrapTest();
          assert.equal(called, "callTrap", "callTrap was not last call");
        });

        describe("proxy function instance property handling", function() {
          assert.ok("test" in proxyTrapTestInstance, "no 'test' in proxyTrapTestInstance");
          assert.equal(called, "has", "did not call has");
        });
      });

      describe("Testing proxy object instance", function() {
        describe("has property 'first'", function() {
          assert.ok("first" in proxyTest, "proxyTest does not have a property named 'first'");
          //assert.equal(called, "has", "the has method was not the last method called");
        });

        describe("get property 'first'", function(){
          assert.equal(proxyTest.first, firstValue);
          assert.equal(called, "get", "the get method was not the last method called");
        });

        describe("set property 'first' to new value", function() {
          proxyTest.first = "changed";
          assert.equal(called, "set", "the set method was not the last method called");
          assert.equal(proxyTest.first, firstValue, "proxyTest.first != firstValue");
        });

        describe("set new property 'second'", function() {
          proxyTest.second = "secondProp";
          assert.equal(called, "set", "the set method was not the last method called");
        });

        describe("has new property 'second'", function() {
          assert.ok("second" in proxyTest, "proxyTest does not have the property 'second'");
        });

        describe("get newly set property 'second'", function() {
          assert.equal(proxyTest.second, "secondProp", "proxyTest.second is not equal to 'secondProp'");
        });

        describe("iterate property names", function() {
          count = 0;
          for (p in proxyTest){++count;}
          assert.equal(count, 2, "there are not 2 properties on proxyTest");
        });

        describe("Object.getOwnPropertyNames on proxy object", function() {
          names = Object.getOwnPropertyNames(proxyTest);
          assert.equal(called, "enumerate", "Object.getOwnPropertyNames did not invoke enumerate");
        });

        describe("Object.getOwnPropertyNames returned an Array", function() {
          assert.ok(names instanceof Array);
        });

        describe("Object.getOwnPropertyNames return value has the correct length", function() {
          assert.equal(names.length, 2, "2 property names were not returned");
        });

        describe("Object.getOwnPropertyNames has the correct values", function() {
          assert.equal(names[0], "first", "The first property name is not 'first'");
          assert.equal(names[1], "second", "The second property name is not 'second'");
        });

        describe("Object.keys on proxy object", function() {
          names = Object.keys(proxyTest);
          assert.equal(called, "enumerate", "Object.keys did not invoke 'enumerate'");
        });

        describe("Object.keys returned an Array", function() {
          assert.ok(names instanceof Array);
        });

        describe("Object.keys return value has the correct length", function() {
          assert.equal(names.length, 2, "2 property names were not returned");
        });

        describe("Object.keys has the correct values", function() {
          assert.equal(names[0], "first", "The first property name is not 'first'");
          assert.equal(names[1], "second", "The second property name is not 'second'");
        });

        describe("delete 'second'", function() {
          assert.ok((delete proxyTest.second), "Delete the property 'second' from the proxy");
          assert.equal(called, "delete", "the delete method was not the last method called");

        });

        describe("proxy instance no longer has property 'second'", function() {
          assert.ok(!Object.prototype.hasOwnProperty.call(proxyTest, "second"), "proxyTest still hasOwnProperty the property 'second'");
          assert.ok(!("second" in proxyTest), "proxyTest still has the property 'second'");
        });
      });

      describe("Fundamental traps", function() {
        describe("PropertyDescriptor context for get should be the receiver", function() {
          var tester = 1,
              proxy = Proxy.create({
                getPropertyDescriptor: function(name) {
                  if (name === "tester") {
                    return {
                      get: function(name) {
                        assert.ok(this === proxy, "PropertyDescriptor context is not the receiver");
                        return tester;
                      }
                    };
                  }
                }
              });
          assert.ok(proxy.tester === tester, "PropertyDescriptor failed to properly set the test variable");
        });

        describe("PropertyDescriptor context for set should be the receiver", function() {
          var tester = 1,
              proxy = Proxy.create({
                getPropertyDescriptor: function(name) {
                  if (name === "tester") {
                    return {
                      set: function(name, value) {
                        assert.ok(this === proxy, "PropertyDescriptor context is not the receiver");
                        tester = value;
                      }
                    };
                  }
                }
              });
          proxy.tester = 2;
        });

        // TODO: write more PropertyDescriptor tests:
        // value, configurable, enumerable, writable, ...

        describe("PropertyDescriptor should get value if get method is not supplied", function() {
          var pd = { value: 2 },
              proxy = Proxy.create({
                getPropertyDescriptor: function(name) {
                  return pd;
                }
              });
          assert.ok(proxy.tester === pd.value, "PropertyDescriptor did not return appropriate value");
        });

        describe("PropertyDescriptor should set value if set method is not supplied", function() {
          var pd = {
                value: 2
              },
              proxy = Proxy.create({
                getPropertyDescriptor: function(name) {
                  return pd;
                }
              });
          proxy.tester = 3;
          assert.ok(proxy.tester === pd.value, "PropertyDescriptor value was not changed");
        });

        // TODO: write more fundamental trap tests:
        // getOwnPropertyDescriptor, getPropertyNam);es, getOwnPropertyNames, ...
      });

      describe("Derived traps", function() {
        describe("proxy context should be the PropertyHandler for derived trap 'get'", function() {
          var tester = 5,
              handler = {
                get: function(receiver, name) {
                  assert.ok(this === handler, "PropertyHandler is not the appropriate context");
                  return tester;
                }
              },
              proxy = Proxy.create(handler);
          assert.ok(proxy.tester === tester, "PropertyHandler get method was not called properly");
        });

        describe("proxy context should be the PropertyHandler for derived trap 'has'", function() {
          var tester = 5,
              handler = {
                has: function(name) {
                  assert.ok(this === handler, "PropertyHandler is not the appropriate context");
                  return (name === "tester2");
                }
              },
              proxy = Proxy.create(handler);
          assert.ok("tester2" in proxy, "PropertyHanlder is not responding correctly to has");
        });

        describe("proxy context should be the PropertyHandler for derived trap 'enumerate'", function() {
          var handler = {
                enumerate: function() {
                  assert.ok(this === handler, "PropertyHandler is not the appropriate context");
                  return ["tester"];
                }
              },
              proxy = Proxy.create(handler), p;
          for (p in proxy) {
            assert.ok(p === "tester", "PropertyHandler responded with incorrect enumerate value: '" + p + "'");
          }
        });

        describe("proxy context should be the PropertyHandler for derived trap 'set'", function() {
          var tester = 5,
              called = false;
              handler = {
                set: function(receiver, name, value) {
                  called = true;
                  assert.ok(this === handler, "PropertyHandler is not the appropriate context");
                  tester = value;
                }
              },
              proxy = Proxy.create(handler);
          proxy.tester = 6;
          assert.ok(called, "PropertyHandler set method was not called properly");
        });

        // TODO: write more derived trap tests:
        // keys, hasOwn, ...);
      });

      describe("ECMAScript 5 implementation methods", function() {
        describe("Proxy.defineProperty on proxy object", function() {
          Proxy.defineProperty(proxyTest, 'third', {
            get: function() {
              return "third";
            }
          });
          assert.equal(called, "defineProperty", "defineProperty was not called: "+called);
        });

        describe("proxy has newly defined property", function() {
          assert.ok("third" in proxyTest);
        });

        describe("proxy's newly defined property have correct return value", function() {
          assert.equal(proxyTest.third, "third", "proxyTest.third != 'third'");
        });

        describe("proxy's newly defined property are reflected in underlying handlers", function() {
          assert.ok("third" in handlers, "'third' is not in handlers");
        });

        describe("Proxy.defineProperties on proxy object", function() {
          Proxy.defineProperties(proxyTest, {
            fourth: {
              get: function() {
                return "fourth";
              }
            },
            fifth: {
              get: function() {
                return "fifth";
              }
            }
          });
          assert.equal(called, "defineProperty", "defineProperty was not called: "+called);
        });

        describe("proxy has newly defined properties", function() {
          assert.ok("fourth" in proxyTest);
          assert.ok("fifth" in proxyTest);
        });

        describe("proxy's newly defined properties have correct return value", function() {
          assert.equal(proxyTest.fourth, "fourth", "proxyTest.fourth != 'fourth'");
          assert.equal(proxyTest.fifth, "fifth", "proxyTest.fifth != 'fifth'");
        });

        describe("proxy's newly defined properties are reflected in underlying handlers", function() {
          assert.ok("fourth" in handlers, "'fourth' is not in handlers");
          assert.ok("fifth" in handlers, "'fifth' is not in handlers");
        });
      });

      describe("Additional method tests", function() {
        describe("Proxy.isProxy proxy object", function() {
          assert.ok(Proxy.isProxy(proxyTest), "proxyTest is not a Proxy");
        });

        describe("Proxy.isProxy non-proxy object", function() {
          assert.ok(!Proxy.isProxy({}), "object is a Proxy");
        });

        describe("Proxy.setPrototype of proxy object", function() {
          assert.ok(Proxy.setPrototype(proxyTest, RegExp.prototype), "unable to set prototype of RegExp on proxyTest");
        });

        describe("proxy object is instanceof RegExp", function() {
          assert.ok(proxyTest instanceof RegExp, "proxyTest is not an instanceof RegExp");
        });

        describe("Proxy.setPrototype of non-proxy object", function() {
          assert.ok(Proxy.setPrototype(base, Number.prototype), "unable to set prototype of Number on base");
        });

        describe("non-proxy object is instanceof RegExp", function() {
          assert.ok(base instanceof Number, "base is not an instanceof Number");
        });

        describe("Proxy.clone proxy object", function() {
          cloneProxy = Proxy.clone(proxyTest);
          assert.ok(typeof cloneProxy == "object", "cloneProxy does not result in an object");
        });

        describe("cloned proxy maintains prototype of base proxy", function() {
          assert.ok(cloneProxy instanceof RegExp, "cloneProxy is not an instanceof RegExp");
        });

        describe("Proxy.clone non-proxy object", function() {
          clone = Proxy.clone(base);
          assert.ok(clone !== base, "clone is identical to base object");

        });

        describe("cloned object maintains prototype of base", function() {
          assert.ok(clone instanceof Number, "clone is not an instance of a Number");
        });

        describe("set hidden property on cloned object", function() {
          assert.ok(Proxy.hidden(clone, "hiddenTest", regex), "unable to set hidden property 'hiddenTest' on clone");
        });

        describe("get hidden property on cloned object", function() {
          assert.ok(Proxy.hidden(clone, "hiddenTest") === regex, "unable to retrieve hidden property 'hiddenTest' on clone");
        });
      });
    }); //, section, sectionName, test, testIndex, sectionIndex = 0, totalTests = 0, passedTests = 0, failedTests = 0;

  // console.log("Running tests...\n");

  // for (sectionName in tests) {
  //   ++sectionIndex;
  //   console.log("\n" + sectionIndex + ": "+ sectionName);

  //   testIndex = 0;
  //   section = tests[sectionName];

  //   for (test in section) {
  //     ++totalTests;
  //     ++testIndex;
  //     process.stdout.write("  " + test + ": ");

  //     try{
  //       section[test]();
  //       ++passedTests;
  //       console.log("PASS");
  //     } catch(e) {
  //       ++failedTests;
  //       console.log("FAIL: "+ e.message);
  //     }
  //   }
  // }

  // console.log("\nPassed " + passedTests + " of " + totalTests + " tests");
  // console.log("\nFailed " + failedTests + " of " + totalTests + " tests");
  // console.log("");

  // process.exit(0);
