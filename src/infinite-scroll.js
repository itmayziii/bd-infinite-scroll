/**
 * FIXME Noticing that if the page does not take up the height of the screen, the infinite scroll fails to jump to the right spot
 */
export class InfiniteScroll {
    constructor(window, $, router, screen, pages, metadataManager, scrollPercentage = {up: 10, down: 80}) {
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

    initialize() {
        this._$document.scrollTop(0);
        this._keepPagesUpToDate();
        this._handleCurrentUrl().then(this._listenToScroll());
    }

    _listenToScroll() {
        this._$document.scroll(() => {
            this._respondToPercentScrolledDown();
            this._respondToPercentScrolledUp();
            this._checkIfPageChanged();
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
    _keepPagesUpToDate() {
        this._updateInterval = setInterval(() => {
            const areAllPagesLoaded = this._pages.filter(page => page.loaded === false).length === 0;
            if (areAllPagesLoaded) {
                // once all pages are loaded lets wait 10 seconds before clearing the interval, maybe an unneeded optimization
                setTimeout(() => {
                    clearInterval(this._updateInterval);
                }, 10 * 1000);
            }

            this._updateLoadedPages();
        }, 1000);
    }

    _respondToPercentScrolledUp() {
        if (this._pauseScrollListening) {
            return;
        }

        const minimumScrollPoint = (this._$document.height() - this._$window.height()) * (this._scrollPercentage.up / 100);
        if (this._$document.scrollTop() <= minimumScrollPoint) {
            this._loadPreviousPage();
        }
    }

    _respondToPercentScrolledDown() {
        if (this._pauseScrollListening) {
            return;
        }

        const minimumScrollPoint = (this._$document.height() - this._$window.height()) * (this._scrollPercentage.down / 100);
        if (this._$document.scrollTop() >= minimumScrollPoint) {
            this._loadNextPage();
        }
    }

    _handleCurrentUrl() {
        return new Promise((resolve, reject) => {
            this._lastLoadedRoute = this._router.getPath();
            const lastLoadedPageIndex = this._findPageIndexByRoute(this._lastLoadedRoute);
            this._pages[lastLoadedPageIndex].loaded = true;

            if (!this._pageExists(this._lastLoadedRoute)) {
                console.error(`InfiniteScroll: page ${this._lastLoadedRoute} does not exist`);
                this._router.navigate(this._pages[0].route);
                reject();
                return;
            }

            if (!this._isFirstPage()) {
                this._loadPreviousPage().then(() => {
                    const scrollBackToPage = this._pages[this._findPageIndexByRoute(this._lastLoadedRoute)];
                    this._$window.scrollTop(scrollBackToPage.topPosition);
                });
            }

            resolve();
        });
    }

    _loadPage(page) {
        return new Promise((resolve, reject) => {
            this._$.ajax(page.route, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .done(resolve)
                .fail((error) => {
                    console.error('InfiniteScroll: Could retrieve a page, failed with error ', error);
                    reject(error);
                })
        });
    }

    _loadPages(pages) {
        let queryParams = [];

        for (let page of pages) {
            queryParams.push({key: 'page[]', value: page.route});
        }

        const queryString = this._router.createQueryParamsString(queryParams);

        return new Promise((resolve, reject) => {
            this._$.ajax(`views${queryString}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .done(resolve)
                .fail((error) => {
                    console.error('InfiniteScroll: Could retrieve multiple pages, failed with error ', error);
                    reject(error);
                })
        });
    }

    _loadNextPage() {
        return new Promise((resolve, reject) => {
            if (this._isLastPage()) {
                resolve();
                return;
            }

            this._pauseScrollListening = true;

            const nextPage = this._pages[this._determineLastLoadedPageIndex() + 1];
            this._loadPage(nextPage)
                .then((loadedNextPage) => {
                    const lastPageLoaded = this._findPageByRoute(this._lastLoadedRoute);
                    const $lastPageLoadedElement = this._$(`#${lastPageLoaded.id}`);
                    $lastPageLoadedElement.after(loadedNextPage);

                    this._lastLoadedRoute = nextPage.route;
                    this._markPageAsLoaded(this._lastLoadedRoute);
                    this._updateLoadedPages(nextPage.route);

                    this._pauseScrollListening = false;
                    resolve();
                })
                .catch(reject);
        });
    }

    _markPageAsLoaded(route) {
        const pageIndex = this._findPageIndexByRoute(route);
        this._pages[pageIndex].loaded = true;
    }

    _loadPreviousPage() {
        return new Promise((resolve, reject) => {
            if (this._pages[0].loaded === true) {
                resolve();
                return;
            }

            this._pauseScrollListening = true;

            const firstLoadedPageIndex = this._pages.findIndex((page) => {
                return page.loaded === true;
            });
            const previousPage = this._pages[firstLoadedPageIndex - 1];

            this._loadPage(previousPage)
                .then((loadedPreviousPage) => {
                    const firstLoadedPage = this._pages[firstLoadedPageIndex];
                    const $firstLoadedPageElement = this._$(`#${firstLoadedPage.id}`);
                    $firstLoadedPageElement.before(loadedPreviousPage);

                    this._markPageAsLoaded(previousPage.route);
                    this._updateLoadedPages();

                    this._pauseScrollListening = false;
                    resolve();
                })
                .catch(reject);
        });
    }

    _isLastPage() {
        const lastPageIndex = this._pages.length - 1;
        const lastLoadedPageIndex = this._determineLastLoadedPageIndex();
        return lastLoadedPageIndex === lastPageIndex;
    }

    _isFirstPage() {
        return this._determineLastLoadedPageIndex() === 0;
    }

    _determineLastLoadedPageIndex() {
        return this._findPageIndexByRoute(this._lastLoadedRoute);
    }

    _pageExists(route) {
        const page = this._findPageByRoute(route);
        return (page !== undefined);
    }

    _checkIfPageChanged() {

        // Create the event
        const pageChangedEvent = new Event('pageChangedEvent');

        const centerOfPage = this._screen.calculateCenterOfPage();

        const loadedPages = this._pages.filter(page => page.loaded === true);
        const pageIndex = this._screen.findCurrentElementBasedOnPosition(loadedPages, centerOfPage);

        const onPage = loadedPages[pageIndex];
        const currentPath = this._router.getPath();
        if (currentPath !== onPage.route) {
            this._router.navigate(onPage.route, false);
            this._updateMetadata(onPage);
            this.dispatchEvent(pageChangedEvent);
        }
    }

    _updateMetadata(page) {
        this._metadataManager.getMetadataForRoute(page.metaRoute)
            .then((metaForRoute) => {
                this._window.document.title = metaForRoute.title;
                this._metadataManager.changeMetadata(metaForRoute);
            });
    }

    _updateLoadedPages() {
        this._pages.forEach((page, pageIndex) => {
            if (page.loaded === false) {
                return;
            }

            const $page = this._$(`#${page.id}`);

            if (!$page.length) {
                console.error(`InfiniteScroll: Could not find page with ID - ${page.id}`);
            }

            const navigation = this._$('#navigation');
            const navigationHeight = (navigation.length) ? navigation.height() : 0;

            this._pages[pageIndex].topPosition = $page.offset().top - navigationHeight;
        });
    }

    _findPageByRoute(route) {
        return this._pages.find((page) => {
            return route === page.route;
        });
    }

    _findPageIndexByRoute(route) {
        return this._pages.findIndex((page) => {
            return route === page.route;
        });
    }
}