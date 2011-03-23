//TODO: I think this should be inlined
function createScope(providers, instanceCache) {
  var scope =  new Scope();
  (scope.$service = createInjector(scope, providers, instanceCache)).eager();
  return scope;
};

/**
 * @workInProgress
 * @ngdoc function
 * @name angular.scope
 *
 * @description
 * Scope is a JavaScript object and the execution context for {@link guide.expression expressions}.
 * You can think about scopes as JavaScript objects that have extra APIs for registering
 * {@link angular.scope.$watcher watchers} and {@link angular.scope.$observe observers}.
 * A scope is the model in the model-view-controller design pattern.
 *
 * A few other characteristics of scopes:
 *
 * - Scopes can be nested. A scope (prototypically) inherits properties from its parent scope.
 * - {@link angular.directive Directives} {@link angular.scope.$observe $observe()} scopes and
 *   update HTML DOM (the view).
 * - A scope {@link angular.scope.$new become} `this` for a controller.
 * - A scope's {@link angular.scope.$apply $apply()} is used to update the listeners
 *   (render the view).
 * - Scopes can {@link angular.scope.$watch $watch()}/{@link angular.scope.$observe $observe()}
 *   properties.
 *
 * # Scope life-cycle
 *
 * Scopes are fundamental to understanding how angular applications work. Let's describe the typical
 * life-cycle of a scope (by typical we mean applications which are boot-strapped using the
 * {@link angular.directive.ng:autobind ng:autobind} directive).
 *
 * 1. Root scope is created at application compile time and it is attached to the root `<HTML>` DOM
 *    element.
 *    1. The root scope then creates an {@link angular.injector injector} which is assigned to the
 *       {@link angular.scope.$service $service} property of the root scope.
 *    2. Any eager {@link angular.scope.$service services} are initialized at this point.
 * 2. During the compilation phase, the {@link guide.compiler compiler} matches
 *    {@link angular.directive directives} against the DOM template. The directives usually fall
 *    into two categories.
 *    1. Observing {@link angular.directive directive}, such as `{{expression}}`, that update
 *       the view based on some {@link guide.expression expression}. This means that the directive
 *       wants to be notified whenever the expression changes. The directive achieves this by
 *       registering a listener using {@link angular.scope.$observe $observe()} method.
 *       (For rendering we use {@link angular.scope.$observe $observe()}
 *       instead of {@link angular.scope.$watch $watch()} because the DOM updates can be batched
 *       for performance. See {@link angular.scope.$observe $observe()} for more details.)
 *    2. Listener directives, such as {@link angular.directive.ng:click ng:click}, that register
 *       a listener with the DOM. When the DOM listener fires, the directive needs to execute the
 *       associated expression and update the view. This is done with the
 *       {@link angular.scope.$apply $apply()} method. See step #5.
 * 3. Some directives such as {@link angular.directive.ng:controller ng:controller} or
 *    {@link angular.widget.@ng:repeat ng:repeat} create new child scopes using the
 *    {@link angular.scope.$new $new()} method, and attach the child scope to the corresponding
 *    DOM element. (A scope can be retrieved for any DOM element using a
 *    `angular.element(aDomElement).scope()` method call.)
 * 4. Some scopes act as controllers (see {@link angular.directive.ng:controller ng:controller}).
 *    Controllers define methods (behavior) that can mutate the model (properties on the scope).
 *    Controllers may register {@link angular.scope.$watch watches} on the model. The watches
 *    execute immediately after the controller behavior executes, but before the DOM renders.
 *    (A controller should NEVER have reference to a DOM element)
 * 5. External event (such as a user action, timer or XHR) is received. The associated
 *    {@link guide.expression expression}
 *    (which usually calls a method on a controller) needs to be applied to the scope through the
 *    {@link angular.scope.$apply $apply()} method. The `$apply()` method then performs the
 *    following steps:
 *    1. The {@link guide.expression expression} is executed using the
 *       {@link angular.scope.$eval $eval()} method.
 *    2. Any exceptions from the execution of the expression are forwarded to the
 *       {@link angular.service.$exceptionHandler $exceptionHandler} service.
 *    3. The {@link angular.scope.$watch watch} listeners are fired immediately after
 *       the expression was executed using the {@link angular.scope.$digest $digest()} method.
 *    4. Finally the update of the DOM is scheduled using the
 *       {@link angular.service.$updateView $updateView} service (see step #6) The `$updateView`
 *       may merge multiple requests, that are close time-wise, into a single update.
 * 6. The {@link angular.service.$updateView $updateView} service then fires DOM
 *    {@link angular.scope.$observe observers} using the {@link angular.scope.$flush $flush()}
 *    method.
 *
 *
 * # Basic Operations
 * A root scope can be created by calling {@link angular.scope() angular.scope()}. Child scopes
 * are created using the {@link angular.scope.$new() $new()} method.
 * (Most scopes are created automatically when compiled HTML template is executed.)
 *
 * Here is a simple scope snippet to show how you can interact with the scope.
 * <pre>
       var scope = angular.scope();
       scope.salutation = 'Hello';
       scope.name = 'World';

       expect(scope.greeting).toEqual(undefined);

       scope.$watch('name', function(){
         this.greeting = this.salutation + ' ' + this.name + '!';
       });

       expect(scope.greeting).toEqual('Hello World!');
       scope.name = 'Misko';
       // still old value, since watches have not been called yet
       expect(scope.greeting).toEqual('Hello World!');

       scope.$digest(); // call the watches
       expect(scope.greeting).toEqual('Hello Misko!');
 * </pre>
 *
 * # Inheritance
 * A scope can inherit from a parent scope, as in this example:
 * <pre>
     var parent = angular.scope();
     var child = parent.$new();

     parent.salutation = "Hello";
     child.name = "World";
     expect(child.salutation).toEqual('Hello');

     child.salutation = "Welcome";
     expect(child.salutation).toEqual('Welcome');
     expect(parent.salutation).toEqual('Hello');
 * </pre>
 *
 * # Dependency Injection
 * See {@link guide.di dependency injection}.
 *
 *
 * @param {Object.<string, function()>=} providers Map of service factory which need to be provided
 *     for the current scope. Usually {@link angular.service}.
 * @param {Object.<string, *>=} instanceCache Provides pre-instantiated services which should
 *     append/override services provided by `providers`.
 * @returns {Object} Newly created scope.
 *
 *
 * @example
 * This example demonstrates scope inheritance and property overriding.
 *
 * In this example, the root scope encompasses the whole HTML DOM tree. This scope has `salutation`,
 * `name`, and `names` properties. The {@link angular.widget@ng:repeat ng:repeat} creates a child
 * scope, one for each element in the names array. The repeater also assigns $index and name into
 * the child scope.
 *
 * Notice that:
 *
 * - While the name is set in the child scope it does not change the name defined in the root scope.
 * - The child scope inherits the salutation property from the root scope.
 * - The $index property does not leak from the child scope to the root scope.
 *
   <doc:example>
     <doc:source>
       <ul ng:init="salutation='Hello'; name='Misko'; names=['World', 'Earth']">
         <li ng:repeat="name in names">
           {{$index}}: {{salutation}} {{name}}!
         </li>
       </ul>
       <pre>
       $index={{$index}}
       salutation={{salutation}}
       name={{name}}</pre>
     </doc:source>
     <doc:scenario>
       it('should inherit the salutation property and override the name property', function() {
         expect(using('.doc-example-live').repeater('li').row(0)).
           toEqual(['0', 'Hello', 'World']);
         expect(using('.doc-example-live').repeater('li').row(1)).
           toEqual(['1', 'Hello', 'Earth']);
         expect(using('.doc-example-live').element('pre').text()).
           toBe('       $index=\n       salutation=Hello\n       name=Misko');
       });
     </doc:scenario>
   </doc:example>
 */
function Scope(){
  this.$id = nextUid();
  this.$parent = this.$watchers = this.$observers = this.$nextSibling = this.$childHead = this.$childTail = null;
  this['this'] = this.$root =  this;
}
/**
 * @workInProgress
 * @ngdoc property
 * @name angular.scope.$id
 * @returns {number} Unique scope ID useful for debugging.
 */

/**
 * @workInProgress
 * @ngdoc property
 * @name angular.scope.$service
 * @function
 *
 * @description
 * Provides reference to an instance of {@link angular.injector injector} which can be used to
 * retrieve {@link angular.service services}. In general the use of this api is discouraged,
 * in favor of proper {@link guide.di dependency injection}.
 *
 * @returns {function} {@link angular.injector injector}
 */

/**
 * @workInProgress
 * @ngdoc property
 * @name angular.scope.$root
 * @returns {scope} The root scope of the current scope hierarchy.
 */

/**
 * @workInProgress
 * @ngdoc property
 * @name angular.scope.$parent
 * @returns {scope} The parent scope of the current scope.
 */


Scope.prototype = {
  /**
   * @workInProgress
   * @ngdoc function
   * @name angular.scope.$new
   * @function
   *
   * @description
   * Creates a new child {@link angular.scope scope}. The new scope can optionally behave as a
   * controller. The parent scope will propagate the {@link angular.scope.$digest $digest()} and
   * {@link angular.scope.$flush $flush()} events. The scope can be removed from the scope
   * hierarchy using {@link angular.scope.$destroy $destroy()}.
   *
   * @param {function()=} constructor Constructor function which the scope should behave as.
   * @param {*=} ... Any additional arguments which are curried into the constructor.
   *        See {@link guide.di dependency injection}.
   * @returns {Object} The newly created child scope.
   *
   */
  $new: function(Class){
    var Child = function(){}; // should be anonymous;
    var child;
    Child.prototype = this;
    child = new Child();
    child['this'] = child;
    child.$parent = this;
    child.$id = nextUid();
    child.$watchers = child.$observers = child.$nextSibling = child.$childHead = child.$childTail = null;
    if (this.$childHead) {
      this.$childTail.$nextSibling = child;
      this.$childTail = child;
    } else {
      this.$childHead = this.$childTail = child;
    }
    // short circuit if we have no class
    if (Class) {
      // can't use forEach, we need speed!
      var ClassPrototype = Class.prototype;
      for(var key in ClassPrototype) {
        child[key] = bind(child, ClassPrototype[key]);
      }
      this.$service.invoke(child, Class);
    }
    return child;
  },

  /**
   * @workInProgress
   * @ngdoc function
   * @name angular.scope.$watch
   * @function
   *
   * @description
   * Registers a `listener` callback to be executed whenever the `watchExpression` changes.
   *
   * - The `watchExpression` is called on every call to {@link angular.scope.$digest $digest()} and
   *   should return the value which will be watched.
   * - The `listener` is called only when the value from the current `watchExpression` and the
   *   previous call to `watchExpression' are not equal.
   * - The watch `listener` may change the model, which may trigger other `listener`s to fire.
   * - The `$watch()` achieves this by keeping a previous copy of the value and comparing it to
   *   the current property value. For non-primitive values the {@link angular.copy} and
   *   {@link angular.equals} are used.
   *
   * # When to use `$watch`?
   *
   * The `$watch` should be used from within controllers to listen on properties *immediately* after
   * a stimulus is applied to the system (see {@link angular.scope.$apply $apply()}). This is in
   * contrast to {@link angular.scope.$observe $observe()} which is used from within the directives
   * and which gets applied at some later point in time. In addition
   * {@link angular.scope.$observe $observe()} should not modify the model.
   *
   * If you want to be notified whenever {@link angular.scope.$digest $digest} is called,
   * you can register an `watchExpression` function with no `listener`.
   *
   * <table class="table">
   *   <tr>
   *     <th></td>
   *     <th>{@link angular.scope.$watch $watch()}</th>
   *     <th>{@link angular.scope.$observe $observe()}</th>
   *   </tr>
   *   <tr>
   *     <th>Execution</th>
   *     <td>immediately after {@link angular.scope.$apply $apply()}</td>
   *     <td>scheduled at some future time. See {@link angular.service.$updateView $updateView}</td>
   *   </tr>
   *   <tr>
   *     <th>Model mutation</th>
   *     <td>allowed, (rerun {@link angular.scope.$digest $digest()} until no further changes to model)</td>
   *     <td>not-allowed, must be {@link http://en.wikipedia.org/wiki/Idempotence idempotent}</td>
   *   </tr>
   *   <tr>
   *     <th>Used from</th>
   *     <td>{@link angular.directive.ng:controller controller}</td>
   *     <td>{@link angular.directive directives}</td>
   *   </tr>
   *   <tr>
   *     <th>Triggered by</th>
   *     <td>{@link angular.scope.$digest $digest()}</td>
   *     <td>{@link angular.scope.$flush $flush()}</td>
   *   </tr>
   * </table>
   *
   *
   *
   * # Example
     <pre>
       var scope = angular.scope();
       scope.name = 'misko';
       scope.counter = 0;

       expect(scope.counter).toEqual(0);
       scope.$watch('name', 'counter = counter + 1');
       expect(scope.counter).toEqual(0);

       scope.$digest();
       // no variable change
       expect(scope.counter).toEqual(0);

       scope.name = 'adam';
       scope.$digest();
       expect(scope.counter).toEqual(1);
     </pre>
   *
   *
   *
   * @param {function()|string} watchExpression Expression that is evaluated on each
   *    {@link angular.scope.$digest $digest} cycle. A change in the return value triggers a
   *    call to the `listener`.
   *
   *    - `string`: Evaluated as {@link guide.expression expression}
   *    - `function(scope)`: called with current `scope` as a parameter.
   * @param {function()|string=} listener Callback called whenever the return value of
   *   the `watchExpression` changes.
   *
   *    - `string`: Evaluated as {@link guide.expression expression}
   *    - `function(scope, newValue, oldValue)`: called with current `scope` an previous and
   *       current values as parameters.
   * @returns {function()} callback function bound to the current scope. Useful for calling the
   *    unbound `listener` function for initialization. The `listener` function will get called
   *    with the current scope and the current value of the expression.
   */
  $watch: function(watchExp, listener){
    var scope = this;
    var get = compileToFn(watchExp, 'watch');
    var listenFn = compileToFn(listener || noop, 'listener');
    var array = scope.$watchers;
    if (!array) {
      array = scope.$watchers = [];
    }
    // we use unshift since we use a while loop for speed.
    // the while loop reads in reverse order.
    array.unshift({
      fn: listenFn,
      last: copy(get(scope)),
      get: get
    });
    // we only do this on watches, since it may be expensive for $eval and it will not be needed
    return function(){
      var value = get(scope);
      listenFn(scope, value, value);
    };
  },

  /**
   * @workInProgress
   * @ngdoc function
   * @name angular.scope.$digest
   * @function
   *
   * @description
   * Process all of the {@link angular.scope.$watch watchers} of the current scope and its children.
   * Because a {@link angular.scope.$watch watcher}'s listener can change the model, the
   * `$digest()` keeps calling the {@link angular.scope.$watch watchers} until no more listeners are
   * firing. This means that it is possible to get into an infinite loop. This function will throw
   * `'Maximum iteration limit exceeded.'` if the number of iterations exceeds 100.
   *
   * Usually you don't call `$digest()` directly in
   * {@link angular.directive.ng:controller controllers} or in {@link angular.directive directives}.
   * Instead a call to {@link angular.scope.$apply $apply()} (typically from within a
   * {@link angular.directive directive}) will force a `$digest()`.
   *
   * If you want to be notified whenever `$digest()` is called,
   * you can register a `watchExpression` function  with {@link angular.scope.$watch $watch()}
   * with no `listener`.
   *
   * You may have a need to call `$digest()` from within unit-tests.
   *
   * # Example
     <pre>
       var scope = angular.scope();
       scope.name = 'misko';
       scope.counter = 0;

       expect(scope.counter).toEqual(0);
       scope.$flush('name', 'counter = counter + 1');
       expect(scope.counter).toEqual(0);

       scope.$flush();
       // no variable change
       expect(scope.counter).toEqual(0);

       scope.name = 'adam';
       scope.$flush();
       expect(scope.counter).toEqual(1);
     </pre>
   *
   * @returns {number} number of {@link angular.scope.$watch listeners} which fired.
   *
   */
  $digest: function(){
    var watches = this.$watchers,
        child,
        length,
        watch, value, last,
        count=0, iterationCount, ttl=100;
    if (this.hasOwnProperty('$phase')) {
      throw new Error(this.$phase + ' already in progress');
    }
    this.$phase = '$digest';
    do {
      iterationCount = 0;
      if (watches){
        // process our watches
        length = watches.length;
        while (length--) {
          try {
            watch = watches[length];
            // Most common watches are on primitives, in which case we can short
            // circuit it with === operator, only when === fails do we use .equals
            if ((value = watch.get(this)) !== (last = watch.last) && !equals(value, last)) {
              iterationCount++;
              watch.fn(this, watch.last = copy(value), last);
            }
          } catch (e){
            this.$service('$exceptionHandler')(e);
          }
        }
      }
      child = this.$childHead;
      while(child) {
        iterationCount += child.$digest();
        child = child.$nextSibling;
      }
      count += iterationCount;
      if(!(ttl--)) {
        throw new Error('Maximum iteration limit exceeded.');
      }
    } while (iterationCount);
    delete this.$phase;
    return count;
  },

  /**
   * @workInProgress
   * @ngdoc function
   * @name angular.scope.$observe
   * @function
   *
   * @description
   * Registers a `listener` callback to be executed whenever the `observeExpression` changes.
   *
   * - The `observeExpression` is called on every call to {@link angular.scope.$flush $flush()} and
   *   should return the value which will be observed.
   * - The `listener` is called only when the value from the current `observeExpression` and the
   *   previous call to `observeExpression' are not equal.
   * - The `$observe()` achieves this by keeping a previous copy of the value and comparing it to
   *   the current property value. For non-primitive values the {@link angular.copy} and
   *   {@link angular.equals} are used.
   *
   * # When to use `$observe`?
   *
   * {@link angular.scope.$observe $observe()} is used from within directives and gets applied at
   * some later point in time. In addition {@link angular.scope.$observe $observe()} should not
   * modify the model. This is in contrast to {@link angular.scope.$watch $watch()} which should be
   * used from within controllers to trigger a callback *immediately* after a stimulus is applied
   * to the system (see {@link angular.scope.$apply $apply()}).
   *
   * If you want to be notified whenever {@link angular.scope.$flush $flush} is called,
   * you can register an `observeExpression` function with no `listener`.
   *
   *
   * <table class="table">
   *   <tr>
   *     <th></td>
   *     <th>{@link angular.scope.$watch $watch()}</th>
   *     <th>{@link angular.scope.$observe $observe()}</th>
   *   </tr>
   *   <tr>
   *     <th>Execution</th>
   *     <td>immediately after {@link angular.scope.$apply $apply()}</td>
   *     <td>scheduled at some future time. See {@link angular.service.$updateView $updateView}</td>
   *   </tr>
   *   <tr>
   *     <th>Model mutation</th>
   *     <td>allowed, (rerun {@link angular.scope.$digest $digest()} until no further changes to model)</td>
   *     <td>not-allowed, must be {@link http://en.wikipedia.org/wiki/Idempotence idempotent}</td>
   *   </tr>
   *   <tr>
   *     <th>Used from</th>
   *     <td>{@link angular.directive.ng:controller controller}</td>
   *     <td>{@link angular.directive directives}</td>
   *   </tr>
   *   <tr>
   *     <th>Triggered by</th>
   *     <td>{@link angular.scope.$digest $digest()}</td>
   *     <td>{@link angular.scope.$flush $flush()}</td>
   *   </tr>
   * </table>
   *
   * # Example
     <pre>
       var scope = angular.scope();
       scope.name = 'misko';
       scope.counter = 0;

       expect(scope.counter).toEqual(0);
       scope.$flush('name', 'counter = counter + 1');
       expect(scope.counter).toEqual(0);

       scope.$flush();
       // no variable change
       expect(scope.counter).toEqual(0);

       scope.name = 'adam';
       scope.$flush();
       expect(scope.counter).toEqual(1);
     </pre>
   *
   * @param {function()|string} observeExpression Expression that is evaluated on each
   *    {@link angular.scope.$flush $flush} cycle. A change in the return value triggers a
   *    call to the `listener`.
   *
   *    - `string`: Evaluated as {@link guide.expression expression}
   *    - `function(scope)`: called with current `scope` as a parameter.
   * @param {function()|string=} listener Callback called whenever the return value of
   *   the `observeExpression` changes.
   *
   *    - `string`: Evaluated as {@link guide.expression expression}
   *    - `function(scope, newValue, oldValue)`: called with current `scope` an previous and
   *       current values as parameters.
   */
  $observe: function(watchExp, listener){
    var array = this.$observers;
    if (!array) {
      array = this.$observers = [];
    }
    // we use unshift since we use a while loop for speed.
    // the while loop reads in reverse order.
    array.unshift({
      fn: compileToFn(listener || noop, 'listener'),
      last: {},
      get:  compileToFn(watchExp, 'watch')
    });
  },

  /**
   * @workInProgress
   * @ngdoc function
   * @name angular.scope.$flush
   * @function
   *
   * @description
   * Process all of the {@link angular.scope.$observe observers} of the current scope
   * and its children.
   *
   * Usually you don't call `$flush()` directly in
   * {@link angular.directive.ng:controller controllers} or in {@link angular.directive directives}.
   * Instead a call to {@link angular.scope.$apply $apply()} (typically from within a
   * {@link angular.directive directive}) will scheduled a call to `$flush()` (with the
   * help of the {@link angular.service.$updateView $updateView} service).
   *
   * If you want to be notified whenever `$flush()` is called,
   * you can register a `observeExpression` function  with {@link angular.scope.$observe $observe()}
   * with no `listener`.
   *
   * You may have a need to call `$flush()` from within unit-tests.
   *
   * # Example
     <pre>
       var scope = angular.scope();
       scope.name = 'misko';
       scope.counter = 0;

       expect(scope.counter).toEqual(0);
       scope.$flush('name', 'counter = counter + 1');
       expect(scope.counter).toEqual(0);

       scope.$flush();
       // no variable change
       expect(scope.counter).toEqual(0);

       scope.name = 'adam';
       scope.$flush();
       expect(scope.counter).toEqual(1);
     </pre>
   *
   */
  $flush: function(){
    var observers = this.$observers,
        child,
        length,
        observer, value, last;
    if (this.hasOwnProperty('$phase')) {
      throw new Error(this.$phase + ' already in progress');
    }
    this.$phase = '$flush';
    if (observers){
      // process our watches
      length = observers.length;
      while (length--) {
        try {
          observer = observers[length];
          // Most common watches are on primitives, in which case we can short
          // circuit it with === operator, only when === fails do we use .equals
          if ((value = observer.get(this)) !== (last = observer.last) && !equals(value, last)) {
            observer.fn(this, observer.last = copy(value), last);
          }
        } catch (e){
          this.$service('$exceptionHandler')(e);
        }
      }
    }
    // observers can create new children
    child = this.$childHead;
    while(child) {
      child.$flush();
      child = child.$nextSibling;
    }
    delete this.$phase;
  },

  /**
   * @workInProgress
   * @ngdoc function
   * @name angular.scope.$destroy
   * @function
   *
   * @description
   * Remove the current scope (and all of its children) from the parent scope. Removal implies
   * that calls to {@link angular.scope.$digest $digest()} and
   * {@link angular.scope.$flush $flush()} will no longer propagate to the current scope and its
   * children. Removal also implies that the current scope is eligible for garbage collection.
   *
   * The `$destroy()` is usually used by directives such as
   * {@link angular.widget.@ng:repeat ng:repeat} for managing the unrolling of the loop.
   *
   */
  $destroy: function(){
    if (this.$root == this) return; // we can't remove the root node;
    var parent = this.$parent;
    var child = parent.$childHead;
    var lastChild = null;
    var nextChild = null;
    // We have to do a linear search, since we don't have doubly link list.
    // But this is intentional since removal are rare, and doubly link list is not free.
    while(child) {
      if (child == this) {
        nextChild = child.$nextSibling;
        if (parent.$childHead == child) {
          parent.$childHead = nextChild;
        }
        if (lastChild) {
          lastChild.$nextSibling = nextChild;
        }
        if (parent.$childTail == child) {
          parent.$childTail = lastChild;
        }
        return; // stop iterating we found it
      } else {
        lastChild = child;
        child = child.$nextSibling;
      }
    }
  },

  /**
   * @workInProgress
   * @ngdoc function
   * @name angular.scope.$eval
   * @function
   *
   * @description
   * Executes the expression on the current scope returning the result. Any exceptions in the
   * expression are propagated (uncaught).
   *
   * # Example
     <pre>
       var scope = angular.scope();
       scope.a = 1;
       scope.b = 2;

       expect(scope.$eval('a+b')).toEqual(3);
       expect(scope.$eval(function(){ return this.a + this.b; })).toEqual(3);
     </pre>
   *
   * @param {(string|function())=} expression An angular expression to be executed.
   *
   *    - `string`: execute using the rules as defined in  {@link guide.expression expression}.
   *    - `function(scope)`: execute the function with the current `scope` parameter.
   *
   * @returns {*} The result of evaluating the expression.
   */
  $eval: function(expr) {
    var fn = isString(expr)
      ? parser(expr).statements()
      : expr || noop;
    return fn(this);
  },

  /**
   * @workInProgress
   * @ngdoc function
   * @name angular.scope.$apply
   * @function
   *
   * @description
   * `$apply()` is used to execute an expression in angular from outside of the angular framework.
   * (For example from browser DOM events, setTimeout, XHR or third party libraries).
   * Because we are calling into the angular framework we need to perform proper scope life-cycle
   * of {@link angular.service.$exceptionHandler exception handling},
   * {@link angular.scope.$digest executing watches} and scheduling
   * {@link angular.service.$updateView updating of the view} which in turn
   * {@link angular.scope.$digest executes observers} to update the DOM.
   *
   * # Pseudo-Code of `$apply()`
      function $apply(expr) {
        try {
          return $eval(expr);
        } catch (e) {
          $exceptionHandler(e);
        } finally {
          $root.$digest();
          $updateView();
        }
      }
   *
   * @param {(string|function())=} exp An angular expression to be executed.
   *
   *    - `string`: execute using the rules as defined in  {@link guide.expression expression}.
   *    - `function(scope)`: execute the function with current `scope` parameter.
   *
   * @returns {*} The result of evaluating the expression.
   */
  $apply: function(expr) {
    try {
      return this.$eval(expr);
    } catch (e) {
      this.$service('$exceptionHandler')(e);
    } finally {
      this.$root.$digest();
      this.$service('$updateView')();
    }
  }
};

function compileToFn(exp, name) {
  var fn = isString(exp)
    ? parser(exp).statements()
    : exp;
  assertArgFn(fn, name);
  return fn;
}
