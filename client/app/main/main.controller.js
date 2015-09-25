'use strict';

angular.module('stocksAppApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    var responseData;

    function randomColor() {
      return '#'+Math.floor(Math.random()*16777215).toString(16);
    }

    function addTicker (name) {
      var apiKey = 'JyxB-gxLf3qkgstzGzx1';
      var apiUrl = 'https://www.quandl.com/api/v3/datasets/WIKI/' + name + '.json?start_date=2015-01-01&column_index=1&api_key=' + apiKey;
      $http.get(apiUrl)
        .then(function(response) {
          responseData = response.data.dataset.data;
          if (!$scope.data) {
            $scope.data = responseData.map(function(item) {
              var dataObj = {x: new Date(item[0])};
              dataObj[name] = item[1];
              return dataObj;
            });
          } else {
            responseData.forEach(function(item) {
              var newDate = new Date(item[0]);
              var newPrice = item[1];
              var dataDate = $scope.data.filter(function(day) {return day.x === newDate;});
              var dataObj;
              if (dataDate.length === 0) {
                dataObj = {x: newDate};
              } else {
                dataObj = dataDate[0];
              }
              dataObj[name] = newPrice;
              $scope.data.push(dataObj);
            });
          }

          $scope.options.series.push({
            y: name,
            label: name,
            color: randomColor()
          });
          console.log(responseData);
        });
    }

    function removeTicker (name) {
      $scope.data.forEach(function (day) {
        day[name] = undefined;
      });
      $scope.options.series = $scope.options.series.filter(function(item) {
        return item.label !== name;
      });
    }


    $scope.options = {
      axes: {
        x: {
          type: 'date'
        }
      },
      series: [],
      tooltip: {
        mode: 'axes'
      }
    };

    // addTicker('GOOG');


    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      awesomeThings.forEach(function(thing) {
        addTicker(thing.name);
      });
      socket.syncUpdates('thing', $scope.awesomeThings);
    });

    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      addTicker($scope.newThing);
      $scope.newThing = '';
    };

    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
      removeTicker(thing.name);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });
  });
