var reporter = require('./bdd_reporter');

var allCases = [];

var currentCase;
var currentFile;
var currentContextStartLine;
var currentCaseDone;

var bdd = {
  reporter: reporter,
  stopTest: /stop-case/,

  onError: function (exception) {
    if (!currentCase) throw exception;
    bdd.reporter.reportError(currentCase, exception);
    currentCaseDone && currentCaseDone();
  },
  current_context: [],
  current_context_fn: [],

  beforeCallbacks: {},
  afterCallbacks: {}
};

var asyncRun = function (fn) {
  // try to find first if function accept arguments
  return fn.toString().match(/^function\s*([\w\d_]+)?\s*\(([\w\d_]+)\)\s*{/)
};

var runCase = function (it_case, callback) {
  currentCase = it_case;

  if (asyncRun(it_case.runner)) {
    !function () {

      var waiter = setTimeout(function() {
        it_case.status = 'failed';
        bdd.reporter.reportError(it_case, new Error("spec timed out"));
        callback();
      }, 10000);

      var done = function () {
        clearTimeout(waiter);
        it_case.status = 'pass';
        callback();
      };

      currentCaseDone = done;

      try {
        it_case.runner(done);
        bdd.reporter.reportGood(it_case);
      } catch (e) {
        clearTimeout(waiter);
        it_case.status = 'failed';
        bdd.reporter.reportError(it_case, e);
        callback();
      }
    }();
  } else {
    currentCaseDone = undefined;
    try {
      it_case.runner();
      bdd.reporter.reportGood(it_case);
    } catch (error) {
      it_case.status = 'failed';
      if (error !== bdd.stopTest) {
        bdd.reporter.reportError(it_case, error);
      }
    }
    callback();
  }
};

var AsyncQueue = function asyncQueue (callback) {
  this.q = [];
};

AsyncQueue.prototype.runAll = function (callback) {
  var qIndex = -1;
  var q = this.q;
  var runNext = function () {
    qIndex += 1;
    if (q[qIndex]) {
      var fn = q[qIndex];
      if (asyncRun(fn)) {
        fn(runNext);
      } else {
        fn();
        runNext();
      }
    } else {
      callback();
    }
  };

  runNext();
};

AsyncQueue.prototype.push = function (callback) {
  this.q.push(callback);
};

var runCaseWithCallbacks = function bdd_runCaseWithCallbacks (it_case, callback) {
  var queue = new AsyncQueue();
  var context = it_case.context;
  if (bdd.beforeCallbacks[context]) {
    bdd.beforeCallbacks[context].forEach(function (callback) {
      queue.push(callback);
    });
  }

  queue.push(function (done) {
    runCase(it_case, done);
  });

  if (bdd.afterCallbacks[context]) {
    bdd.afterCallbacks[context].forEach(function (callback) {
      queue.push(callback);
    });
  }

  queue.runAll(callback);
}

bdd.runAllCases = function (callback) {
  var lastContext = [];

  bdd.reporter.started(allCases);

  var current_i = -1;
  var runNext = function runNext () {
    if (allCases[current_i + 1]) {
      current_i += 1;
      var theCase = allCases[current_i];
      if (theCase.context.toString() != lastContext.toString()) {
        lastContext = theCase.context;
        bdd.reporter.newContext(theCase.context);
      }
      runCaseWithCallbacks(allCases[current_i], runNext);
    } else {
      bdd.reporter.finished(allCases);
      //puts("-- finish\n");
      callback && callback(bdd.reporter.failedCases.length == 0);
    }
  };

  runNext();
};

bdd.describe = function describe (context, callback) {
  var err = new Error();
  var stack = err.stack.split("\n");
  var lineParts = stack[2].match(/\(([^:]+):(\d+).+\)/)
  currentFile = lineParts[1];
  currentContextStartLine = parseInt(lineParts[2], 10);
  //console.log(currentFile);

  bdd.current_context = [context];
  bdd.current_context_fn = callback;
  //console.log(callback.toString());
  with (bdd) {
    eval("!" + callback.toString() + "()");
  }
};

bdd.it = function it (name, runner) {
  var err = new Error();
  var stack = err.stack.split("\n");
  var line = stack[2].match(/:(\d+):\d+\)$/)[1];

  var it_case = {
    context: bdd.current_context.slice(0),
    context_fn: bdd.current_context_fn,
    currentFile: currentFile,
    currentLine: currentContextStartLine + parseInt(line, 10) - 1,
    name: name,
    runner: runner,
    status: 'defined', // status = defined, running, pass, failed
  }; 

  allCases.push(it_case);
};

bdd.before = function bdd_before (beforeCallback) {
  var context = bdd.current_context.slice(0);
  if (!bdd.beforeCallbacks[context]) {
    bdd.beforeCallbacks[context] = [];
  }
  bdd.beforeCallbacks[context].push(beforeCallback);
};

bdd.after = function it (afterCallback) {
  var context = bdd.current_context.slice(0);

  if (!bdd.afterCallbacks[context]) {
    bdd.afterCallbacks[context] = [];
  }
  bdd.afterCallbacks[context].push(afterCallback);
};

module.exports = bdd;