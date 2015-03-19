(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.controllers", [
        "TwitterTopicStream.services",
        "ngSanitize"
    ])
    .controller("IndexCtrl", [
        '$scope', 'mySocket',
        function ($scope, mySocket) {
            $scope.tweets = [];

            $scope.$on("socket:tweet", function (ev, data) {
                $scope.tweets.push(data);
                $scope.$apply();
            });
        }
    ]);

})(angular);
