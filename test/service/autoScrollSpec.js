describe('$autoScroll', function() {

  var elmSpy;

  function addElements() {
    var elements = sliceArgs(arguments);

    return function() {
      forEach(elements, function(identifier) {
        var match = identifier.match(/(\w* )?(\w*)=(\w*)/),
            jqElm = jqLite('<' + (match[1] || 'a ') + match[2] + '="' + match[3] + '"/>'),
            elm = jqElm[0];

        elmSpy[identifier] = spyOn(elm, 'scrollIntoView');
        jqLite(document.body).append(jqElm);
      });
    };
  }

  function changeHashAndScroll(hash) {
    return function($location, $autoScroll) {
      $location.hash(hash);
      $autoScroll();
    };
  }

  function expectScrollingToTop($window) {
    forEach(elmSpy, function(spy, id) {
      expect(spy).not.toHaveBeenCalled();
    });

    expect($window.scrollTo).toHaveBeenCalledWith(0, 0);
  }

  function expectScrollingTo(identifier) {
    return function($window) {
      forEach(elmSpy, function(spy, id) {
        if (identifier === id) expect(spy).toHaveBeenCalledOnce();
        else expect(spy).not.toHaveBeenCalled();
      });
      expect($window.scrollTo).not.toHaveBeenCalled();
    };
  }

  function expectNoScrolling() {
    return expectScrollingTo(NaN);
  }

  function disableScroller() {
    return function($autoScrollProvider) {
      $autoScrollProvider.disable();
    };
  }


  beforeEach(inject(function($provide) {
    elmSpy = {};
    $provide.value('$window', {
      scrollTo: jasmine.createSpy('$window.scrollTo'),
      document: document
    });
  }));


  it('should scroll to top of the window if empty hash', inject(
    changeHashAndScroll(''),
    expectScrollingToTop));


  it('should not scroll if hash does not match any element', inject(
    addElements('id=one', 'id=two'),
    changeHashAndScroll('non-existing'),
    expectNoScrolling()));


  it('should scroll to anchor element with name', inject(
    addElements('a name=abc'),
    changeHashAndScroll('abc'),
    expectScrollingTo('a name=abc')));


  it('should not scroll to other than anchor element with name', inject(
    addElements('input name=xxl', 'select name=xxl', 'form name=xxl'),
    changeHashAndScroll('xxl'),
    expectNoScrolling()));


  it('should scroll to anchor even if other element with given name exist', inject(
    addElements('input name=some', 'a name=some'),
    changeHashAndScroll('some'),
    expectScrollingTo('a name=some')));


  it('should scroll to element with id with precedence over name', inject(
    addElements('name=abc', 'id=abc'),
    changeHashAndScroll('abc'),
    expectScrollingTo('id=abc')));


  it('should scroll to top if hash == "top" and no matching element', inject(
    changeHashAndScroll('top'),
    expectScrollingToTop));


  it('should scroll to element with id "top" if present', inject(
    addElements('id=top'),
    changeHashAndScroll('top'),
    expectScrollingTo('id=top')));


  it('should not scroll when disabled', inject(
    addElements('id=fake', 'a name=fake', 'input name=fake'),
    disableScroller(),
    changeHashAndScroll('fake'),
    expectNoScrolling()));


  describe('watcher', function() {

    function initLocation(config) {
      return function($provide, $locationProvider) {
        $provide.value('$sniffer', {history: config.historyApi});
        $locationProvider.html5Mode(config.html5Mode);
      };
    }

    function changeHashAndDigest(hash) {
      return function ($location, $rootScope, $autoScroll) {
        $location.hash(hash);
        $rootScope.$digest();
      };
    }

    afterEach(inject(function($document) {
      dealoc($document);
    }));


    it('should scroll to element when hash change in hashbang mode', inject(
      initLocation({html5Mode: false, historyApi: true}),
      addElements('id=some'),
      changeHashAndDigest('some'),
      expectScrollingTo('id=some')));


    it('should scroll to element when hash change in html5 mode with no history api', inject(
      initLocation({html5Mode: true, historyApi: false}),
      addElements('id=some'),
      changeHashAndDigest('some'),
      expectScrollingTo('id=some')));


    it('should not scroll when element does not exist', inject(
      initLocation({html5Mode: false, historyApi: false}),
      addElements('id=some'),
      changeHashAndDigest('other'),
      expectNoScrolling()));


    it('should not scroll when html5 mode with history api', inject(
      initLocation({html5Mode: true, historyApi: true}),
      addElements('id=some'),
      changeHashAndDigest('some'),
      expectNoScrolling()));


    it('should not scroll when disabled', inject(
      disableScroller(),
      initLocation({html5Mode: false, historyApi: false}),
      addElements('id=fake'),
      changeHashAndDigest('fake'),
      expectNoScrolling()));
  });
});

