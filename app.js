// Bootstrap app with top-level controller
angular.module('places', ['ngSanitize', 'angularSearchPlaces'])
  .controller('PlacesSearchController', ['$window', PlacesSearchController]);

function PlacesSearchController($window) {
  this.city = "San Francisco";
  this.searchTerms = "";
  this.searchResult = {};
  this.go = function() {
    if (this.searchTerms) {
      $window.alert("Do something with the search result!");
    }
  };
}

angular.module('angularSearchPlaces', [])

/***** Search Places Input Directive *****
 *
 * A directive that when added to an input field, searches a city
 *
 * Depedencies: $compile, $timeout, $templateRequest
 *
 * Suggested usage:
 * <input type="text"
    ej-search-places-input
    search-results-limit="15"
    complete-result="searchResult"
    placeholder="e.g., Mission Dolores Park, Chinese food, etc..."
    ng-model="searchTerms"
    city="LOS_ANGELES" />
 *
 * The directive is restricted to being an attribute only, so only add
 * "ej-search-places-input" to an <input>, as above.
 *
 * Attributes:
 * - search-results-limit: optional, takes a number representing how many search
 *   results you want displayed below the input box. Defaults to 8.
 * - complete-result: optional, takes a scope variable that should be defined in
 *   your controller as an empty object. Once a search result is clicked on from
 *   the list, it will be populated with the complete result object from the
 *   Google Places API. This allows you to use more than just the name of the
 *   place (represented by the search terms)
 * - ng-model: required, as this is used to do the actual search
 * - city: optional, defaults to San Francisco. See below for how to add cities.
 * - placeholder: optional, but a nice touch
 *
 * Additional Info:
 * The "Powered by Google" icon that shows up at the bottom of the search
 * results is required by Google in exchange for the use of their PlacesSearch
 * API.
 *
 */

.directive('ejSearchPlacesInput', ['$compile', '$timeout', '$templateRequest',
            function($compile, $timeout, $templateRequest) {
/**
 *  In order to generate Nearby Search results, a location must be specified.
 *  (https://developers.google.com/maps/documentation/javascript/places#place_search_requests)
 *  The more accurate way to do it for a city is to specify location using
 *  LatLngBounds, which is made up of a two LatLng objects at the southwest and
 *  northeast corners.
 */
  // Manually find and set the latitude/longitude coordinates that best bound
  // the city (in this case, San Francisco)
  var SF_SW = new google.maps.LatLng(37.706885, -122.521027);
  var SF_NE = new google.maps.LatLng(37.834843, -122.357262);
  // Create the LatLngBounds object
  var SAN_FRANCISCO = new google.maps.LatLngBounds(SF_SW, SF_NE);

  function link($scope, $el, $attrs, ngModelCtrl) {

    $scope.queryInProgress = false;

    // Set the limit on search results to a reasonable number by default
    var resultsLimit = $scope.$eval($attrs.searchResultsLimit) || 8;

    // Set a debounce on updating the model so we're not sending tons of requests
    ngModelCtrl.$options = {
      debounce : 500
    };
    ngModelCtrl.$options.updateOnDefault = true;

    // Create an empty results array that can be populated with results
    $scope.results = [];

    // Grab the search results template and place it into the DOM
    var templatePath = 'search-results.html';
    $templateRequest(templatePath).then(function(content) {
      var $results = $compile(content)($scope);
      $el.after($results);
    });

    // For whatever reason, the PlacesService expects a div or a Map object. We
    // can't pass the div that displays our results because it gets removed from
    // the DOM. Thus, we feed it an empty div.
    var placesDiv = angular.element('<div id="empty" style="display: none;"></div>');
    $el.after(placesDiv);
    var places;
    // Call within a timeout to be safe and make sure that the PlacesService is
    // instantiated properly.
    $timeout(function() {
      var emptyDiv = document.getElementById('empty');
      places = new google.maps.places.PlacesService(emptyDiv);
    });

    // We want to watch the model for changes and query the PlacesService
    $scope.$watch("ngModel", function(newVal) {
      // Don't do any searching if there's no search terms
      if (!newVal) { return; }
      if (!$scope.city) {
        $scope.city = SAN_FRANCISCO;
      }
      // Only submit another query if there isn't one in progress already,
      // otherwise, this may lead to strange results showing up for the user due
      // to the asynchronicity of the requests
      if (!$scope.queryInProgress) {
        searchPlaces($scope.city, newVal);
      }
    });

    /**
     * Perform a Nearby Search for a particular location using the Google Maps
     * API PlacesService
     * @param  {LatLngBounds Obj} location    The location you want to search
     * @param  {String} searchTerms           What you're searching for
     */
    function searchPlaces(location, searchTerms) {
      // Build the request. In this case we are using LatLngBounds ("bounds").
      var request = {
        bounds: location,
        keyword: searchTerms
      };
      // Do The Thing (i.e., a nearby search)
      places.nearbySearch(request, buildResults);
      // Set the query to be in progress
      $scope.queryInProgress = true;
    }

    /**
     * Build the list of results from the PlacesService searching
     * @param  {Object} results The results from the PlacesSearch API query
     * @param  {Enum} status  An enumeration representing various statuses of
     *                        the PlacesSearch query
     */
    function buildResults(results, status) {
      // Once the results come in, the query is no longer in progress
      $scope.queryInProgress = false;
      // If the search returns results successfully with no errors
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Remove results after the specified limit
        if (resultsLimit < results.length) {
          results = results.slice(0, resultsLimit);
        }
        // Bind the results to the scope, you mope!
        $scope.results = results;
      }
      // If the search doesn't return results
      else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        $scope.results = [{name: 'No results. Try different search terms?'}];
      }
      $scope.$apply();
    }

    /**
     * Select the desired result from the list to populate the search box and
     * the complete search result object in the parent scope
     * @param  {Number} resultIndex The index of the result clicked on
     */
    $scope.selectResult = function(resultIndex) {
      $scope.ngModel = $scope.results[resultIndex].name;
      $scope.completeResult = $scope.results[resultIndex];
    };

  } // end link function

  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      ngModel: '=',
      completeResult: '=?',
      city: '=?'
    },
    link: link
  };
}])

// A filter that highlights the search terms found in the results (ripped from
// angular-ui-bootstrap typeahead)
.filter('highlightSearchTerms', function() {

  function escapeRegexp(queryToEscape) {
    return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
  }

  return function(matchItem, searchTerms) {
    return searchTerms ? ('' + matchItem).replace(new RegExp(escapeRegexp(searchTerms), 'gi'), '<strong>$&</strong>') : matchItem;
  };
});

/* Some possible LatLngBound objects for other cities:

var laSW = new google.maps.LatLng(33.700910, -118.622533)
var laNE = new google.maps.LatLng(34.340590, -118.140508)
var losAngeles = new google.maps.LatLngBounds(laSW, laNE);

var chSW = new google.maps.LatLng(41.635691, -87.929909)
var chNE = new google.maps.LatLng(42.028104, -87.524102)
var chicago = new google.maps.LatLngBounds(chSW, chNE);

var nySW = new google.maps.LatLng(40.487720, -74.270132)
var nyNE = new google.maps.LatLng(40.914059, -73.694036)
var newYork = new google.maps.LatLngBounds(nySW, nyhNE);
*/