(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.controllers", [
        "TwitterTopicStream.services",
        "ngSanitize"
    ])
    .controller("IndexCtrl", [
        '$scope', 'Api',
        function ($scope, Api) {
            $scope.tweets = [];

            Api.tweets.list()
                .success(function (tweets) {
                    $scope.tweets = tweets;
                });
        }
    ]);

})(angular);
