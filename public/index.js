$(function() {
    // expose our socket client
    var socket = io();
    
    // handle and submit new chat messages to server...
    $("form").submit(function(e) {
      e.preventDefault(); // prevents reloading...
      var msg = $("#m").val();
      if(msg.includes("ℏ")) { 
        alert("sorry, you're unable to send messages with ℏ in them!");
      }
      else { 
        socket.emit("chat message", $("#m").val());
      }
      $("#m").val("");
      return false;
    });
  
    // listen for new chat messages from our server...
    // these will all sent over the Hedera consensus service!
    socket.on("chat message", function(msg) {
  
      // split message by a specific, special character...
      var splitMsg = msg.split("ℏ");
  
      // grab the specifically formatted message...
      var operatorId = splitMsg[0]; 
      var clientId = splitMsg[1].slice(0,6) + "..";
      var msg = splitMsg[2];
      var sequenceNumber = splitMsg[3];
      var trimmedHash = "runningHash: "+splitMsg[4].slice(0,6) + "..";
      var trimmedTimestamp = splitMsg[5].slice(0,25);
    
      // grab & trim our topic ID
      var topicId = document.getElementById("topic-id");
      var idString = topicId.innerHTML.substring(7, topicId.length);
    
      // append the split message to the HTML in pieces...
      $("#messages").append(
        $("<li>").addClass("new-message").append(
          $("<div>").addClass("message").append( 
            $("<p>").text(operatorId+"@"+clientId).addClass("client")).append(
              $("<div>").addClass("message-body").append( 
                $("<div>").text(msg).addClass("message-content")).append(
                $("<div>").text(trimmedTimestamp).addClass("message-timestamp")))).append(
          $("<div>").addClass("meta").append( 
            $("<p>").text("sequence: "+ sequenceNumber).addClass("details")).append(
            $("<p>").text(trimmedHash).addClass("details")).append(
            $("<a>").text("view transaction").addClass("details")
              .attr("target", "_blank")
              .attr("href", `https://explorer.kabuto.sh/testnet/topic/${idString}/message/${sequenceNumber}`))));
    
      // update the current sequence number...
      $("#sequence-number").text("last message sequence number: " + sequenceNumber + "  ");
    });
  
    // listen for new client connections from server...
    socket.on("connect message", function(msg) {
      // send new connection message...
      var splitMsg = msg.split("ℏ");
      $("#messages").append(
        $("<li>").text('new connection: ' + splitMsg[0] + "@" + splitMsg[1]).addClass("new-connection"));
      // update clients topic id...
      var topicId = document.getElementById("topic-id");
      topicId.innerHTML = "Topic: " + splitMsg[2];
    });
    
    // listen for client disconnections from server...
    socket.on("disconnect message", function(msg) {
      // send new disconnection message...
      var splitMsg = msg.split("ℏ");
      $("#messages").append(
        $("<li>").text(splitMsg[0] + "@" + splitMsg[1] + ' has disconnected').addClass("disconnection"));
    });
  });