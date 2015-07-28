Twitter Topic Stream
---

You set a word or words to look for and the application will show you a real-time stream of any tweets containing the
word specified. You can use special symbols like # and @ for topics and tags.


Tech
----

This is a JavaScript application that uses Node.js as a back-end. It setups a connection to Twitter and is able to 
receive search requests from multiple users.

The front-end is built with Angular.js. Custom css for ng-cloak is used. ngAnimate with css3 animations(keyframes) is 
used to animate the stream and the single tweets for the user to get a better picture of what comes and when and for 
the to page to look like a real water stream.

When a new tweet is found the back-end sends it to the front-end through web sockets using Socket.IO.

Web Sockets and sessions are connected together so when a user comes back to the page his settings and streams are 
waiting intact. Also when the user closes the page his stream is stopped. After the user quits his stream and data are
deleted after a small interval: this is like an automatic cleanup of the server's resources. The client will be 
recreated the next time he visits the page.

You can start multiple streams by using different browsers in your computer.

If the back-end is restarted, the front-end detects that and suggests a page refresh after the server comes back online.

Install
---

Run these commands before starting the application:

    npm install
    bower install
    
Create a new app on your [Twitter dev account](https://apps.twitter.com/). Then copy the config/config.json.dist to 
config/config.json and put your [Twitter app data](https://apps.twitter.com/) inside. You can also set the default 
search term and the maximum tweets on page.
    
Then start the Node.js application like this:

    npm start
    
After that go to `http://localhost:3000` and start your own stream.
