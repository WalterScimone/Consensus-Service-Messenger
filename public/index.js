$(function() {
    // expose socket client...
    var socket = io();
    
    // handle and submit new chat messages to server...
    $("form").submit(function(e) {
      e.preventDefault(); // prevents reloading page...
      socket.emit("chat message", $("#m").val());
      $("#m").val("");
      return false;
    });
  
    // listen for new chat messages from our server...
    // these will all be sent over the Hedera consensus service...
    socket.on("chat message", function(msg) {
      $("#messages").append(
        $("<li>").addClass("new-message").append(
          $("<p>").text(msg).addClass("message-content")
        )
      );
    });
  
    // listen for new client connections from server...
    socket.on("connect message", function(msg) {
      // send new connection message to other clients...
      $("#messages").append(
        $("<li>").text('new connection: ' + msg).addClass("new-connection"));
    });
    
    // listen for client disconnections from server...
    socket.on("disconnect message", function(msg) {
      // send new disconnection message to other clients...
      $("#messages").append(
        $("<li>").text(msg + ' has disconnected').addClass("disconnection"));
    });
  });