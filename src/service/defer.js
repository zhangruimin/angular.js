/**
 * @workInProgress
 * @ngdoc service
 * @name angular.service.$defer
 * @requires $browser
 * @requires $exceptionHandler
 * @requires $updateView
 *
 * @description
 * Defers an execution of a function using various queues.
 *
 * When `queue` argument is undefined or set to `'$setTimeout'`, the defered function `fn` will be
 * delegated to {@link angular.service.$browser.defer $browser.defer}, which will result in
 * in a `setTimeout` timer to be registered with delay set to the `delay` value. The function
 * `fn` will be wrapped into {@link angular.scope.$apply rootScope.$apply}, in order to to allow the
 * deferred function to participate in angular's app life-cycle.
 *
 * In tests you can use `$defer.flush('$setTimeout') or `$browser.defer.flush()` to flush the queue
 * of deferred functions in the `'$setTimeout'` queue.
 *
 * When `queue` argument is defined, the `fn` function will be put into a queue specified by this
 * argument. To flush the queue in application or test, call `$defer.flush(queueName)`.
 *
 * Angular uses a queue called `'$burp'`, to execute task synchronously with regards to the $apply
 * cycle. This queue is flushed right after `$digest` (hence the name).
 *
 * A task can be removed from any execution queue (if it hasn't executed yet), by calling
 *`$defer.cancel(cancelToken)`, where `cancelToken` is the return value of calling the $defer
 * function when registering `fn`.
 *
 * @param {string=} [queue='$setTimeout'] The name of the deferral queue.
 * @param {function()} fn A task — function, execution of which should be deferred.
 * @param {(number|string)=} [delay=0] of milliseconds to defer the function execution in the
 *   $setTimeout queue.
 * @returns {*} A token, which can be passed into $defer.cancel() method to cancel the deferred
 *   task.
 */
angularServiceInject('$defer', function($browser, $exceptionHandler) {
  var scope = this,
      queues = {},
      canceledTasks = {},
      idGenerator = 0,
      setTimeoutQ = '$setTimeout';

  function defer(queue, fn, delay) {
    if (isFunction(queue)) {
      delay = fn;
      fn = queue;
      queue = setTimeoutQ;
    }

    if (queue != setTimeoutQ) {
      var id = idGenerator++;
      (queues[queue] || (queues[queue] = [])).push({id: id, fn: fn});
      return {q: queue, id: id};
    }

    return $browser.defer(function() {
      scope.$apply(fn);
    }, delay);
  };


  defer.flush = function(queue) {
    assertArg(queue, 'queue');

    if (queue == setTimeoutQ) {
      $browser.defer.flush();
    }

    forEach(queues[queue], function(task) {
      try {
        if (!(canceledTasks[queue] && canceledTasks[queue][task.id])) {
          task.fn();
        }
      } catch(e) {
        $exceptionHandler(e);
      }
    });

    queues[queue] = [];
    canceledTasks[queue] = {};
  }


  defer.cancel = function(cancelToken) {
    if (isUndefined(cancelToken)) return;

    if (cancelToken.q) {
      (canceledTasks[cancelToken.q] || (canceledTasks[cancelToken.q] = {}))[cancelToken.id] = true;
    } else {
      $browser.defer.cancel(deferId);
    }
  }


  return defer;
}, ['$browser', '$exceptionHandler']);
