// Bootstrap app with top-level controller
angular.module('places', ['angularSearchPlaces'])
  .controller('PlacesSearchController', PlacesSearchController);

function PlacesSearchController($window) {
  this.city = "San Francisco";
  this.searchTerms = "";
}

PlacesSearchController.prototype.go = function() {
  if (this.searchTerms) {
    $window.alert("Do something with the search result!");
  }
};

angular.module('angularSearchPlaces', [])

.directive('ejSearchPlacesInput', ['$compile', '$timeout',
            function($compile, $timeout) {
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

    // Intialize options

    // Set the limit on search results to a reasonable number by default
    var resultsLimit = $scope.$eval($attrs.searchResultsLimit) || 8;

    // Set a debounce on updating the model so we're not sending tons of requests
    ngModelCtrl.$options = {
      debounce : 500
    };
    ngModelCtrl.$options.updateOnDefault = true;

    // Create an empty results array that can be populated with results
    $scope.results = [];

    var results = angular.element('<div class="search-places-results" ng-show="ngModel"><ul>' +
      '    <li ng-repeat="result in results" ng-class="{active: isActive($index) }" ng-mouseenter="selectActive($index)" ng-click="selectMatch($index)">' +
      '    <div><span>{{ result.name }}</span>&nbsp;&nbsp;' +
      '         <span class="result-vicinity">{{ result.vicinity }}</span>' +
      '    </div></li>' +
      '</ul><img class="poweredby-logo" src="//maps.gstatic.com/mapfiles/' +
      'api-3/images/powered-by-google-on-white2.png"></div>');
    var $results = $compile(results)($scope);
    $el.after($results);

    var placesDiv = angular.element('<div id="empty" style="display: none;"></div>');
    $el.after(placesDiv);
    var places;
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
      searchPlaces($scope.city, newVal);
    });

    /**
     * Perform a Nearby Search for a particular location using the Google Maps
     * API PlacesService
     * @param  {LatLngBounds Obj} location    The location you want to search
     * @param  {String} searchTerms           What you're searching for
     */
    function searchPlaces(location, searchTerms) {
      // Build the request
      var request = {
        bounds: location,
        keyword: searchTerms
      };
      places.nearbySearch(request, buildResults);
    }

    /**
     * Build the list of results from the PlacesService search
     * @param  {[type]} results [description]
     * @param  {[type]} status  [description]
     * @return {[type]}         [description]
     */
    function buildResults(results, status) {
      // If the search returns results successfully with no errors
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Remove results after the specified limit
        if (resultsLimit < results.length) {
          results = results.slice(0, resultsLimit);
        }
        $scope.results = results;
      }
      // If the search doesn't return results
      else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        $scope.results = [{name: 'No results. Try different search terms?'}];
      }
    }
  }

  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      ngModel: '=',
      city: '=?' // The city is optional and will default to San Francisco
    },
    link: link
  };
}]);

// var laSW = new google.maps.LatLng(33.700910, -118.622533)
// var laNE = new google.maps.LatLng(34.340590, -118.140508)
// var losAngeles = new google.maps.LatLngBounds(laSW, laNE);
//
// var chSW = new google.maps.LatLng(41.635691, -87.929909)
// var chNE = new google.maps.LatLng(42.028104, -87.524102)
// var chicago = new google.maps.LatLngBounds(chSW, chNE);
//
// var nySW = new google.maps.LatLng(40.487720, -74.270132)
// var nyNE = new google.maps.LatLng(40.914059, -73.694036)
// var newYork = new google.maps.LatLngBounds(nySW, nyhNE);