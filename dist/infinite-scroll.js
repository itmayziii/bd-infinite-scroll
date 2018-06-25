(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["infinite-scroll"] = factory();
	else
		root["infinite-scroll"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.InfiniteScroll = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * FIXME Noticing that if the page does not take up the height of the screen, the infinite scroll fails to jump to the right spot
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

__webpack_require__(2);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InfiniteScroll = exports.InfiniteScroll = function () {
    function InfiniteScroll(window, $, router, screen, pages, metadataManager) {
        var scrollPercentage = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : { up: 10, down: 80 };

        _classCallCheck(this, InfiniteScroll);

        this._window = window;
        this._$ = $;
        this._router = router;
        this._screen = screen;
        this._pages = pages;
        this._metadataManager = metadataManager;
        this._scrollPercentage = scrollPercentage;

        this._pauseScrollListening = false;
        this._lastLoadedRoute = null;
        this._$window = $(window);
        this._$document = $(window.document);
        this._updateInterval = null;
    }

    _createClass(InfiniteScroll, [{
        key: 'initialize',
        value: function initialize() {
            this._$document.scrollTop(0);
            this._keepPagesUpToDate();
            this._handleCurrentUrl().then(this._listenToScroll());
        }
    }, {
        key: '_listenToScroll',
        value: function _listenToScroll() {
            var _this = this;

            this._$document.scroll(function () {
                _this._respondToPercentScrolledDown();
                _this._respondToPercentScrolledUp();
                _this._checkIfPageChanged();
            });
        }

        /**
         * This is definitely a hack solution. The problem is that we need to maintain where the pages start using their top position,
         * so that we can adjust the navigation accordingly when a user scrolls. One of the issues we face is that when you prepend content
         * there is no DOM event that lets you know that the DOM is done rendering, thus trying to get a dynamic elements top
         * position becomes impossible. To get around this we are simply updating top positions every 1 second until all pages are loaded.
         * I tried using setTimeout(() => {}, 0) to push the method to end of the event loop as discussed here https://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
         * I also tried using requestAnimationFrame as discussed here https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
         * I had no luck in either case.
         * @private
         */

    }, {
        key: '_keepPagesUpToDate',
        value: function _keepPagesUpToDate() {
            var _this2 = this;

            this._updateInterval = setInterval(function () {
                var areAllPagesLoaded = _this2._pages.filter(function (page) {
                    return page.loaded === false;
                }).length === 0;
                if (areAllPagesLoaded) {
                    // once all pages are loaded lets wait 10 seconds before clearing the interval, maybe an unneeded optimization
                    setTimeout(function () {
                        clearInterval(_this2._updateInterval);
                    }, 10 * 1000);
                }

                _this2._updateLoadedPages();
            }, 1000);
        }
    }, {
        key: '_respondToPercentScrolledUp',
        value: function _respondToPercentScrolledUp() {
            if (this._pauseScrollListening) {
                return;
            }

            var minimumScrollPoint = (this._$document.height() - this._$window.height()) * (this._scrollPercentage.up / 100);
            if (this._$document.scrollTop() <= minimumScrollPoint) {
                this._loadPreviousPage();
            }
        }
    }, {
        key: '_respondToPercentScrolledDown',
        value: function _respondToPercentScrolledDown() {
            if (this._pauseScrollListening) {
                return;
            }

            var minimumScrollPoint = (this._$document.height() - this._$window.height()) * (this._scrollPercentage.down / 100);
            if (this._$document.scrollTop() >= minimumScrollPoint) {
                this._loadNextPage();
            }
        }
    }, {
        key: '_handleCurrentUrl',
        value: function _handleCurrentUrl() {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                _this3._lastLoadedRoute = _this3._router.getPath();
                var lastLoadedPageIndex = _this3._findPageIndexByRoute(_this3._lastLoadedRoute);
                _this3._pages[lastLoadedPageIndex].loaded = true;

                if (!_this3._pageExists(_this3._lastLoadedRoute)) {
                    console.error('InfiniteScroll: page ' + _this3._lastLoadedRoute + ' does not exist');
                    _this3._router.navigate(_this3._pages[0].route);
                    reject();
                    return;
                }

                if (!_this3._isFirstPage()) {
                    _this3._loadPreviousPage().then(function () {
                        var scrollBackToPage = _this3._pages[_this3._findPageIndexByRoute(_this3._lastLoadedRoute)];
                        _this3._$window.scrollTop(scrollBackToPage.topPosition);
                    });
                }

                resolve();
            });
        }
    }, {
        key: '_loadPage',
        value: function _loadPage(page) {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
                _this4._$.ajax(page.route, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }).done(resolve).fail(function (error) {
                    console.error('InfiniteScroll: Could retrieve a page, failed with error ', error);
                    reject(error);
                });
            });
        }
    }, {
        key: '_loadPages',
        value: function _loadPages(pages) {
            var _this5 = this;

            var queryParams = [];

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = pages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var page = _step.value;

                    queryParams.push({ key: 'page[]', value: page.route });
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            var queryString = this._router.createQueryParamsString(queryParams);

            return new Promise(function (resolve, reject) {
                _this5._$.ajax('views' + queryString, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }).done(resolve).fail(function (error) {
                    console.error('InfiniteScroll: Could retrieve multiple pages, failed with error ', error);
                    reject(error);
                });
            });
        }
    }, {
        key: '_loadNextPage',
        value: function _loadNextPage() {
            var _this6 = this;

            return new Promise(function (resolve, reject) {
                if (_this6._isLastPage()) {
                    resolve();
                    return;
                }

                _this6._pauseScrollListening = true;

                var nextPage = _this6._pages[_this6._determineLastLoadedPageIndex() + 1];
                _this6._loadPage(nextPage).then(function (loadedNextPage) {
                    var lastPageLoaded = _this6._findPageByRoute(_this6._lastLoadedRoute);
                    var $lastPageLoadedElement = _this6._$('#' + lastPageLoaded.id);
                    $lastPageLoadedElement.after(loadedNextPage);

                    _this6._lastLoadedRoute = nextPage.route;
                    _this6._markPageAsLoaded(_this6._lastLoadedRoute);
                    _this6._updateLoadedPages(nextPage.route);

                    _this6._pauseScrollListening = false;
                    resolve();
                }).catch(reject);
            });
        }
    }, {
        key: '_markPageAsLoaded',
        value: function _markPageAsLoaded(route) {
            var pageIndex = this._findPageIndexByRoute(route);
            this._pages[pageIndex].loaded = true;
        }
    }, {
        key: '_loadPreviousPage',
        value: function _loadPreviousPage() {
            var _this7 = this;

            return new Promise(function (resolve, reject) {
                if (_this7._pages[0].loaded === true) {
                    resolve();
                    return;
                }

                _this7._pauseScrollListening = true;

                var firstLoadedPageIndex = _this7._pages.findIndex(function (page) {
                    return page.loaded === true;
                });
                var previousPage = _this7._pages[firstLoadedPageIndex - 1];

                _this7._loadPage(previousPage).then(function (loadedPreviousPage) {
                    var firstLoadedPage = _this7._pages[firstLoadedPageIndex];
                    var $firstLoadedPageElement = _this7._$('#' + firstLoadedPage.id);
                    $firstLoadedPageElement.before(loadedPreviousPage);

                    _this7._markPageAsLoaded(previousPage.route);
                    _this7._updateLoadedPages();

                    _this7._pauseScrollListening = false;
                    resolve();
                }).catch(reject);
            });
        }
    }, {
        key: '_isLastPage',
        value: function _isLastPage() {
            var lastPageIndex = this._pages.length - 1;
            var lastLoadedPageIndex = this._determineLastLoadedPageIndex();
            return lastLoadedPageIndex === lastPageIndex;
        }
    }, {
        key: '_isFirstPage',
        value: function _isFirstPage() {
            return this._determineLastLoadedPageIndex() === 0;
        }
    }, {
        key: '_determineLastLoadedPageIndex',
        value: function _determineLastLoadedPageIndex() {
            return this._findPageIndexByRoute(this._lastLoadedRoute);
        }
    }, {
        key: '_pageExists',
        value: function _pageExists(route) {
            var page = this._findPageByRoute(route);
            return page !== undefined;
        }
    }, {
        key: '_checkIfPageChanged',
        value: function _checkIfPageChanged() {

            // Create the event
            var pageChangedEvent = new CustomEvent('pageChangedEvent');

            var centerOfPage = this._screen.calculateCenterOfPage();

            var loadedPages = this._pages.filter(function (page) {
                return page.loaded === true;
            });
            var pageIndex = this._screen.findCurrentElementBasedOnPosition(loadedPages, centerOfPage);

            var onPage = loadedPages[pageIndex];
            var currentPath = this._router.getPath();
            if (currentPath !== onPage.route) {
                this._router.navigate(onPage.route, false);
                this._updateMetadata(onPage);
                window.dispatchEvent(pageChangedEvent);
            }
        }
    }, {
        key: '_updateMetadata',
        value: function _updateMetadata(page) {
            var _this8 = this;

            this._metadataManager.getMetadataForRoute(page.metaRoute).then(function (metaForRoute) {
                _this8._window.document.title = metaForRoute.title;
                _this8._metadataManager.changeMetadata(metaForRoute);
            });
        }
    }, {
        key: '_updateLoadedPages',
        value: function _updateLoadedPages() {
            var _this9 = this;

            this._pages.forEach(function (page, pageIndex) {
                if (page.loaded === false) {
                    return;
                }

                var $page = _this9._$('#' + page.id);

                if (!$page.length) {
                    console.error('InfiniteScroll: Could not find page with ID - ' + page.id);
                }

                var navigation = _this9._$('#navigation');
                var navigationHeight = navigation.length ? navigation.height() : 0;

                _this9._pages[pageIndex].topPosition = $page.offset().top - navigationHeight;
            });
        }
    }, {
        key: '_findPageByRoute',
        value: function _findPageByRoute(route) {
            return this._pages.find(function (page) {
                return route === page.route;
            });
        }
    }, {
        key: '_findPageIndexByRoute',
        value: function _findPageIndexByRoute(route) {
            return this._pages.findIndex(function (page) {
                return route === page.route;
            });
        }
    }]);

    return InfiniteScroll;
}();

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// source: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
(function () {

    if (typeof window.CustomEvent === "function") return false;

    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();

/***/ })
/******/ ]);
});