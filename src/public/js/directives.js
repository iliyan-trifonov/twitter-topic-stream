(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.directives", [])
        .directive("notification", [
            function () {
                return {
                    restrict: 'E',
                    replace: true,
                    scope: {
                        "message": '='
                    },
                    template: '<span ng-bind="message" class="notification"></span>'
                };
            }
        ])
        .directive("singleTweet", [
            function () {
                return {
                    restrict: 'E',
                    scope: {
                        "tweet": '='
                    },
                    templateUrl: '/partials/directives/tweet.html'
                };
            }
        ]);
})(angular);
