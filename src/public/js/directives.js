(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.directives", [])
        .directive("notification", [
            '$timeout',
            function ($timeout) {
                return {
                    restrict: 'E',
                    replace: true,
                    scope: {
                        "message": '='
                    },
                    template: "<span ng-bind='message' class='notification'></span>",
                    link: function (scope, element, attrs) {
                    }
                };
            }
        ]);
})(angular);
