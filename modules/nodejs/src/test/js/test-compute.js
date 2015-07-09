/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var TestUtils = require("./test-utils").TestUtils;

var Ignite = require(TestUtils.scriptPath());
var CacheEntry = Ignite.CacheEntry;

var assert = require("assert");

testComputeRunScript = function() {
    TestUtils.startIgniteNode(onStart.bind(null, computeRunScript));
}

testComputeExecute = function() {
    TestUtils.startIgniteNode(computeExecute);
}

testComputeAllNodeExecute = function() {
    TestUtils.startIgniteNode(computeAllNodeExecute);
}

testComputeCacheSizeExecute = function() {
    TestUtils.startIgniteNode(computeCacheSizeExecute);
}

testComputeCacheExecute = function() {
    TestUtils.startIgniteNode(computeCacheExecute);
}

testComputeRunScriptContainsKey = function() {
    function computeRunScriptContainsKey(error, ignite) {
        assert(error == null, "Error on start:" + error);

        var comp = ignite.compute();

        var f = function(key) {
            var cache = ignite.cache("mycache");
            cache.put(key, "[AAAAAAA]");

            if (!cache.containsKey(key))
                throw "Contains key does not work."

            return key;
        }

        function onEnd(err, res) {
            assert(err == null);
            assert(TestUtils.compareObject(initKey, res), "Incorrect result after script.")

            ignite.cache("mycache").containsKey(initKey, function(err0, res0) {
                assert(err0 === null, "Get error on js contatins key [err=" + err0 + "]");
                assert(res0 === true, "Incorrect value on js contains key [res=" + res0 + "]");
                TestUtils.testDone();
            });
        }

        var initKey = {"1" : ["1", "2"]};

        comp.run(f, initKey, onEnd.bind(null));
    }

    TestUtils.startIgniteNode(computeRunScriptContainsKey);
}

testComputeRunScriptContainsKeys = function() {
    function computeRunScriptContainsKey(error, ignite) {
        assert(error == null, "Error on start:" + error);

        var comp = ignite.compute();

        var f = function(keys) {
            var cache = ignite.cache("mycache");
            cache.put(keys[0], "[AAAAAAA]");
            cache.put(keys[1], "[BBBBBBB]");

            if (!cache.containsKeys(keys))
                throw "Contains key does not work."

            return keys;
        }

        function onEnd(err, res) {
            assert(err == null);
            assert(TestUtils.compareObject([initKey0, initKey1], res), "Incorrect result after script.")

            ignite.cache("mycache").containsKey(initKey0, function(err0, res0) {
                assert(err0 === null, "Get error on js contatins key [err=" + err0 + "]");
                assert(res0 === true, "Incorrect value on js contains key [res=" + res0 + "]");
                TestUtils.testDone();
            });
        }

        var initKey0 = {"1" : ["1", "2"]};
        var initKey1 = {"2" : "AAA"};

        comp.run(f, [initKey0, initKey1], onEnd.bind(null));
    }

    TestUtils.startIgniteNode(computeRunScriptContainsKey);
}

testComputeRunScriptPutAllGetAll = function() {
    function computeRunScriptPutAllGetAll(error, ignite) {
        assert(error == null, "Error on start:" + error);

        var comp = ignite.compute();

        var f = function(args) {
            var cache = ignite.cache("mycache");

            cache.putAll(args[0]);

            return cache.getAll(args[1]);
        }

        function onEnd(err, res) {
            assert(err == null);

            assert(TestUtils.compareObject(initEntries[0].key, res[0].key), "Incorrect result after script " +
                "[InitEntries=" + JSON.stringify(initEntries[0].key) + ", val=" + JSON.stringify(res[0].key) + "]");

            ignite.cache("mycache").containsKey(initKey0, function(err0, res0) {
                assert(err0 === null, "Get error on js contatins key [err=" + err0 + "]");
                assert(res0 === true, "Incorrect value on js contains key [res=" + res0 + "]");
                TestUtils.testDone();
            });
        }

        var initKey0 = {"1" : ["1", "2"]};
        var initKey1 = {"2" : "AAA"};
        var initVal0 = {"1" : ["1", "2"]};
        var initVal1 = {"2" : "AAA"};
        var initEntries = [new CacheEntry(initKey0, initVal0), new CacheEntry(initKey1, initVal1)];

        comp.run(f, [initEntries, [initKey0, initKey1]],
            onEnd.bind(null));
    }

    TestUtils.startIgniteNode(computeRunScriptPutAllGetAll);
}

testComputeRunScriptRemoveOperations = function() {
    computeRunScriptRemoveOperations = function(error, ignite) {
        assert(error === null, "Error on put:" + error);

        var comp = ignite.compute();

        var f = function (args) {
            var cache = ignite.cache("mycache");

            if (cache.remove("key1") === true) {
                throw "Incorrect remove from empty map";
            }

            var key0 = {"keyName" : "keyVal"};
            var key1 = {"keyName" : "keyVal1"};
            var val0 = {"valName" : 1};
            var val1 = {"valName" : 2};

            var entries = [new CacheEntry(key0, val0), new CacheEntry(key1, val1)];
            var keys = [key0, key1];

            cache.put(key0, val0);

            if (cache.removeValue(key0, val1) === true) {
                throw "Incorrect removeValue from empty map [key=" + JSON.stringify(key0) + "]";
            }

            if (cache.remove(key0) === false) {
                throw "Incorrect remove from empty map [key=" + JSON.stringify(key0) + "]";
            }

            cache.put(key0, val0);

            if (cache.replaceValue(key0, val0, val1) === true) {
                throw "Incorrect replaceValue result [key=" + JSON.stringify(key0) + "]";
            }

            var prevVal = cache.getAndReplace(key0, val1);

            if (prevVal.valName !== val0.valName) {
                throw "Incorrect getAndReplace result [key=" + JSON.stringify(key0) +
                 ", prevVal=" + prevVal.valName +
                 ", expected=" + val0.valName + "]";
            }

            prevVal = cache.get(key0);

            if (prevVal.valName !== val1.valName) {
                throw "Incorrect getAndReplace result [key=" + JSON.stringify(key0) + "]";
            }

            cache.removeAllFromCache();

            if (cache.get(key0) !== null) {
                throw "Incorrect removeAll result";
            }

            cache.putAll(entries);

            if (cache.replace(key1, val0) !== true) {
                throw "Incorrect replace result";
            }

            prevVal = cache.get(key1);

            if (prevVal.valName !== val0.valName) {
                throw "Incorrect replace [key=" + JSON.stringify(key1) + "]";
            }

            cache.removeAll(keys);

            if (cache.size() !== 0) {
                throw "Incorrect removeAll result.";
            }
        }

        function onEnd(err, res) {
            assert(err == null);

            TestUtils.testDone();
        }

        comp.run(f, [], onEnd.bind(null));
    }

    TestUtils.startIgniteNode(computeRunScriptRemoveOperations);
}

testComputeMapReduceGetAndPut = function() {
    function computeMapReduceGetAndPut(error, ignite) {
        assert(error == null, "Error on start:" + error);

        var map = function(nodes, arg) {
            for (var i = 0; i < nodes.length; i++) {
                var f = function (val) {
                    var prev = ignite.cache("mycache").getAndPutIfAbsent(val, val);

                    if (prev !== null) {
                        throw "Get and put if absent does not work.";
                    }

                    return val;
                };

                emit(f, i, nodes[i]);
            }
        };

        var reduce = function(results) {
            var sum = 0;

            for (var i = 0; i < results.length; ++i) {
                if (results.indexOf(i) === -1) {
                    throw "Do not find " + i;
                }

                var prev = ignite.cache("mycache").getAndPut(i, i + 1);

                if (prev !== i) {
                    throw "Incorrect previous value [key=" + i + ", val=" + prev + "]";
                }

                sum += prev;
            }

            return sum;
        };

        var callback = function(err, res) {
            assert(err == null, "Get error on compute task [err=" + err + "]");
            assert(res === 1);

            TestUtils.testDone();
        }

        ignite.compute().mapReduce(map, reduce, [], callback);
    }

    TestUtils.startIgniteNode(computeMapReduceGetAndPut);
}

testComputeMapReduceGetAndRemoveObject = function() {
    function computeMapReduceGetAndRemove(error, ignite) {
        assert(error == null, "Error on start:" + error);

        var map = function(nodes, entries) {
            for (var i = 0; i < entries.length; i++) {
                var f = function (entry) {
                    var cache = ignite.cache("mycache");
                    print("ENTRY =" + entry);

                    print("ENTRY Key=" + entry.key);

                    if (cache.putIfAbsent(entry.key, entry.value) !== true) {
                        throw "Incorrect put if absent result."
                    }

                    if (cache.putIfAbsent(entry.key, "1") !== false) {
                        throw "Incorrect put if absent result."
                    }

                    return cache.getAndRemove(entry.key);
                };

                emit(f, entries[i], nodes[i % nodes.length]);
            }
        };

        var reduce = function(results) {
            var sum = 0;

            for (var i = 0; i < results.length; ++i) {
                sum += results[i].age;
            }

            return sum;
        };

        var callback = function(err, res) {
            assert(err == null, "Get error on compute task [err=" + err + "]");
            assert(res === 25, "Incorrect reduce result.");

            TestUtils.testDone();
        }


        entries = [];

        var key1 = {"name" : "Ann"};
        var key2 = {"name" : "Paul"};
        var val1 = {"age" : 12, "books" : ["1", "Book"]};
        var val2 = {"age" : 13, "books" : ["1", "Book"]};

        entries.push(new CacheEntry(key1, val1));
        entries.push(new CacheEntry(key2, val2));

        ignite.compute().mapReduce(map, reduce, entries, callback);
    }

    TestUtils.startIgniteNode(computeMapReduceGetAndRemove);
}

function onStart(onPut, error, ignite) {
    var cache = ignite.cache("mycache");

    var params = [];

    for (var i = 900; i < 1000; ++i) {
        params.push(new CacheEntry("key" + i,  "val" + i));
    }

    cache.putAll(params, onPut.bind(null, ignite))
}

function computeRunScript(ignite, error) {
    assert(error == null, "Error on put:" + error);

    var comp = ignite.compute();

    var f = function (args) {
        print("!!!!" + args + " " + ignite.name());
        return args + " " + ignite.name();
    }

    function onEnd(err, res) {
        assert(err == null);
        assert(res.indexOf("NodeJsComputeSelfTest") !== -1, "Incorrect result message. [mes=" + res + "].");
        assert(res.indexOf("GridGain") !== -1, "Incorrect result message. [mes=" + res + "].");

        TestUtils.testDone();
    }

    comp.run(f, "GridGain", onEnd.bind(null));
}

function computeExecute(error, ignite) {
    assert(error == null, "Error on put:" + error);

    var map = function(nodes, arg) {
        var words = arg.split(" ");

        for (var i = 0; i < words.length; i++) {
            var f = function (word) {
                print(">>> Printing " + word);

                return word.length;
            };

            emit(f, words[i], nodes[i %  nodes.length]);
        }
    };

    var reduce = function(results) {
        var sum = 0;

        for (var i = 0; i < results.length; ++i) {
            sum += results[i];
        }

        return sum;
    };

    var callback = function(err, res) {
        assert(err == null, "Get error on compute task [err=" + err + "]");
        assert.equal(res, 7);

        TestUtils.testDone();
    }

    ignite.compute().mapReduce(map, reduce, "Hi Alice", callback);
}

function computeAllNodeExecute(error, ignite) {
    assert(error == null, "Error on put:" + error);

    var map = function(nodes, arg) {
        for (var i = 0; i < nodes.length; i++) {
            var f = function (node) {
                print(">>> Printing " + node.id().toString());

                return "";
            };

            emit(f, nodes[i %  nodes.length], nodes[i %  nodes.length]);
        }
    };

    var reduce = function(results) {};

    var callback = function(err, res) {
        assert(err == null, "Get error on compute task [err=" + err + "]");
        TestUtils.testDone();
    }

    ignite.compute().mapReduce(map, reduce, "", callback);
}

function computeCacheExecute(error, ignite) {
    assert(error == null, "Error on put:" + error);

    var map = function(nodes, args) {
        for (var i = 0; i < 1; i++) {
            var f = function (args1) {
                ignite.cache("mycache").put({"1": "1"},  2);

                var val = ignite.cache("mycache").get({"1": "1"});

                if (val !== 2) {
                    throw "Incorrect return val [expected=2, val=" + val + "]";
                }

                var val1 = ignite.cache("mycache").get(args1.get(0));

                if (val1["age"] !== 12) {
                    throw "Incorrect age [expected=12, val=" + val + "]";
                }

                print("BOOKS=" + val1.books);

                if (val1.books.length !== 2) {
                    throw "Incorrect books length [expected=2, val=" +
                        val1.books.length + "]";
                }

                if (val1.books[0] !== "1") {
                    throw "Incorrect books value [expected=1, val=" +
                        val1.books[0] + "]";
                }
                if (val1.books[1] !== "Book") {
                    throw "Incorrect books value [expected=Book, val=" +
                        val1.books[1] + "]";
                }

                return val1;
            };

            emit(f, args, nodes[i]);
        }
    };

    var reduce = function(results) {
        return {"1" : 1};
    };

    var callback = function(err, res) {
        assert(err == null, "Get error on compute task [err=" + err + "]");

        assert(TestUtils.compareObject({"1": 1}, res),
            "Incorrect result [exp= {1:1}, val=" + res);

        ignite.cache("mycache").size(function(err, size){
            assert(size === 3, "Incorrect size [size=" + 3 + ", res=" + size + "]");
            TestUtils.testDone();
        })
    }

    entries = [];

    var key1 = {"name" : "Ann"};
    var key2 = {"name" : "Paul"};
    var val1 = {"age" : 12, "books" : ["1", "Book"]};
    var val2 = {"age" : 13, "books" : ["1", "Book"]};

    entries.push(new CacheEntry(key1, val1));
    entries.push(new CacheEntry(key2, val2));

    ignite.cache("mycache").putAll(entries, function(err) {
        ignite.compute().mapReduce(map, reduce, [key1, val1], callback);
    });
}

function computeCacheSizeExecute(error, ignite) {
    assert(error == null, "Error on put:" + error);

    var map = function(nodes, arg) {
        for (var i = 0; i < nodes.length; i++) {
            var f = function (args) {
                print("!!!!!Node id " + ignite.localNode().id());

                return ignite.cache("mycache").localSize();
            };

            emit(f, [1, 2], nodes[i]);
        }
    };

    var reduce = function(results) {
        var sum = 0;

        for (var i = 0; i < results.length; i++) {
            sum += results[i];
        }

        return sum;
    };

    var callback = function(err, res) {
        assert(err == null, "Get error on compute task [err=" + err + "]");

        ignite.cache("mycache").size(function(err, size){
            assert(size === res, "Incorrect size [size=" + size + ", res=" + res + "]");
            TestUtils.testDone();
        })
    }

    ignite.cache("mycache").put("key", "val",
        function(err) {
            ignite.compute().mapReduce(map, reduce, "", callback);
        });
}

testComputeFuncWithErrorExecute = function() {
    var map = function(nodes, arg) {
        var f = function(args){throw "Bad function";};

        for (var i = 0; i < nodes.length; i++) {
            emit(f, "", nodes[i %  nodes.length]);
        }
    };

    testComputeWithErrors(map);
}

testComputeIncorrectFuncExecute = function() {
    var map = function(nodes, arg) {
        var f = function() {
            prin("hi");
        };

        for (var i = 0; i < nodes.length; i++) {
            emit(f, "", nodes[i %  nodes.length]);
        }
    };

    testComputeWithErrors(map);
}

testComputeIncorrectMapExecute = function() {
    var map = function(nodes, arg) {
        var f = function() {
            print("hi");
        };

        for (i = 0; i < nodes.length; i++) {
            emit(f, "", nodes[a %  nodes.length]);
        }
    };

    testComputeWithErrors(map);
}

function testComputeWithErrors(map) {
    function computeErrorExecute(error, ignite) {
        var callback = function(err, res) {
            assert(err != null, "Do not get error on compute task.");

            assert(err.indexOf("Function evaluation failed") > -1, "Incorrect error "+
                "[expected=function evaluation failed, value=" + err + "]");

            TestUtils.testDone();
        }

        ignite.compute().mapReduce(map, function (args) {}, "Hi Alice", callback);
    }

    TestUtils.startIgniteNode(computeErrorExecute);
}