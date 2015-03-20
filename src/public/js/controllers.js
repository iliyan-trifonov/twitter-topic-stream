(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.controllers", [
        "TwitterTopicStream.services",
        "TwitterTopicStream.vars",
        "ngSanitize",
        "ngAnimate"
    ])
    .controller("IndexCtrl", [
        '$scope', 'mySocket', 'maxTweets', 'search', 'Api',
        function ($scope, mySocket, maxTweets, search, Api) {

            var listen = true,
                streamRunning = true;

            $scope.tweets = [];

            $scope.maxTweets = maxTweets;
            $scope.search = search;
            $scope.messageTxt = "";
            $scope.toggleStreamButtonTxt = "Stop";

            $scope.$on("socket:tweet", function (ev, data) {
                if (!listen) {
                    return;
                }
                $scope.tweets.push(data);
                var len = $scope.tweets.length;
                if (len > maxTweets) {
                    //or .splice(0, 1)
                    $scope.tweets.splice(0, len - maxTweets);
                }
            });

            $scope.updateSearch = function () {
                listen = false;
                $scope.tweets = [];
                Api.tweets.setSearch($scope.search)
                    .success(function () {
                        listen = true;
                        showMessage("Updated");
                    });
            };

            $scope.toggleStream = function () {
                var command;
                if (true === streamRunning) {
                    listen = false;
                    command = "stop";
                } else {
                    listen = true;
                    command = "start";
                }
                console.log("command: " + command);
                Api.tweets.toggleStream(command)
                    .success(function () {
                        streamRunning = ("start" === command);
                        console.log("success: streamRunning = " + streamRunning + ", listen = " + listen);
                    });
            };

            function showMessage(message)
            {
                console.log("new message: " + message);
                $scope.messageTxt = message;
            }

            function setButtonText(text)
            {
                $scope.toggleStreamButtonTxt = text;
            }

            $scope.$watch(function () {
                return streamRunning;
            }, function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    if (true === newVal) {
                        $scope.toggleStreamButtonTxt = "Stop";
                        showMessage("Started");
                        setButtonText("Stop");
                    } else {
                        $scope.toggleStreamButtonTxt = "Start";
                        showMessage("Stopped");
                        setButtonText("Start");
                    }
                }
            });
        }
    ]);

})(angular);
