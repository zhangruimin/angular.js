describe('$defer', function() {

  describe('setTimeout backed deferral', function() {
    var scope, $browser, $defer, $exceptionHandler;

    beforeEach(function(){
      scope = angular.scope(angular.service,
                            {'$exceptionHandler': jasmine.createSpy('$exceptionHandler')});
      $browser = scope.$service('$browser');
      $defer = scope.$service('$defer');
      $exceptionHandler = scope.$service('$exceptionHandler');
    });

    afterEach(function(){
      dealoc(scope);
    });


    it('should delegate functions to $browser.defer', function() {
      var counter = 0;
      $defer(function() { counter++; });

      expect(counter).toBe(0);

      $browser.defer.flush();
      expect(counter).toBe(1);

      $browser.defer.flush(); //does nothing
      expect(counter).toBe(1);

      expect($exceptionHandler).not.toHaveBeenCalled();
    });


    it('should delegate exception to the $exceptionHandler service', function() {
      $defer(function() {throw "Test Error";});
      expect($exceptionHandler).not.toHaveBeenCalled();

      $browser.defer.flush();
      expect($exceptionHandler).toHaveBeenCalledWith("Test Error");
    });


    it('should call $apply after each callback is executed', function() {
      var eval = this.spyOn(scope, '$apply').andCallThrough();

      $defer(function() {});
      expect(eval).wasNotCalled();

      $browser.defer.flush();
      expect(eval).wasCalled();

      eval.reset(); //reset the spy;

      $defer(function() {});
      $defer(function() {});
      $browser.defer.flush();
      expect(eval.callCount).toBe(2);
    });


    it('should call $apply even if an exception is thrown in callback', function() {
      var eval = this.spyOn(scope, '$apply').andCallThrough();

      $defer(function() {throw "Test Error";});
      expect(eval).wasNotCalled();

      $browser.defer.flush();
      expect(eval).wasCalled();
    });


    it('should allow you to specify the delay time', function(){
      var defer = this.spyOn($browser, 'defer');
      $defer(noop, 123);
      expect(defer.callCount).toEqual(1);
      expect(defer.mostRecentCall.args[1]).toEqual(123);
    });
  });


  describe('queue based deferral', function() {
    var scope, defer, log;

    beforeEach(function() {
      scope = angular.scope();
      $defer = scope.$service('$defer');
      log = [];
    });


    it('should allow a task to be scheduled and executed upon flush()', function() {
      var id = $defer('myQueue', function() { log.push('work'); });
      expect(id).toBeDefined();
      expect(log).toEqual([]);

      $defer.flush('wrongQueue');
      expect(log).toEqual([]);

      $defer.flush('myQueue');
      expect(log).toEqual(['work']);
    });


    it('should allow a task to be overriden by another task', function() {
      $defer('myQueue', function() { log.push('work 0') });
      var id = $defer('myQueue', function() { log.push('work 1') });
      $defer('myQueue', function() { log.push('work 2') });
      $defer('myQueue', function() { log.push('work 3') });
      $defer.cancel(id);

      $defer.flush('myQueue');
      expect(log).toEqual(['work 0', 'work 2', 'work 3']);
    });


    it('should ignore attempts to overide flushed tasks', function() {
      var id = $defer('myQueue', function() { log.push('work 0') });
      $defer.flush('myQueue');

      $defer('myQueue', function() { log.push('work 1') });
      $defer.cancel(id);
      $defer.flush('myQueue');

      expect(log).toEqual(['work 0', 'work 1']);
    });


    it('should generate different ids for tasks', function() {
      var id1 = $defer('myQueue', function() {});
      var id2 = $defer('myQueue', function() {});
      var id3 = $defer('myQueue', function() {});
      expect(id1.id < id2.id < id3.id).toBe(true);
    });
  });
});
