(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.controllers", [
        "TwitterTopicStream.services",
        "TwitterTopicStream.vars",
        "ngSanitize",
        "ngAnimate"
    ])
    .controller("IndexCtrl", [
        '$scope', 'mySocket', 'maxTweets', 'search', 'Api', '$interval', '$timeout', 'streamRunning',
        function ($scope, mySocket, maxTweets, search, Api, $interval, $timeout, streamRunning) {

            var listen = streamRunning,
                notifications = [],
                displayingMessage = false;

            $scope.tweets = [];

            $scope.maxTweets = maxTweets;
            $scope.search = search;
            $scope.messageTxt = "";
            $scope.toggleStreamButtonTxt = "Stop";

            $scope.$on("socket:error", function (ev, data) {
                streamRunning = false;
                listen = false;
                console.log("stream error", data);
            });

            $scope.$on("socket:tweetsclients", function (ev, data) {
                $scope.tweetsClients = data;
            });
            $scope.$on("socket:tweetsfirst", function (ev, data) {
                $scope.tweetsFirst = data;
            });
            $scope.$on("socket:tweetscount", function (ev, data) {
                $scope.tweetsCount = data;
            });

            $scope.$on("socket:tweetstarted", function (ev, data) {
                streamRunning = true;
                listen = true;
            });

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
                        streamRunning = true;
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
                //console.log("command: " + command);
                Api.tweets.toggleStream(command)
                    .success(function () {
                        streamRunning = ("start" === command);
                        //console.log("success: streamRunning = " + streamRunning + ", listen = " + listen);
                    });
            };

            function showMessage(message)
            {
                //console.log("new message: " + message);
                notifications.push(message);
            }

            function setButtonText(text)
            {
                $scope.toggleStreamButtonTxt = text;
            }

            function streamRunningWatch (newVal) {
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

            $scope.$watch(function () {
                return streamRunning;
            }, function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    streamRunningWatch(newVal);
                }
            });

            $interval(function () {
                if (notifications.length > 0 && !displayingMessage) {
                    displayingMessage = true;
                    $scope.messageTxt = notifications.splice(0, 1);
                    $timeout(function () {
                        $scope.messageTxt = "";
                        displayingMessage = false;
                    }, 1E3);
                }
            }, 500);

            if (!streamRunning) {
                streamRunningWatch(1);
            }
        }
    ]);

})(angular);
