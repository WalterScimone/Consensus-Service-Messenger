// require access for dotenv...
require("dotenv").config();

// require all the necessary dependencies...
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const open = require("open");
const inquirer = require("inquirer");
const TextDecoder = require("text-encoding").TextDecoder;

// Hedera SDK...
const {
  Client,
  TopicMessageSubmitTransaction,
  TopicId,
  TopicCreateTransaction,
  TopicMessageQuery
} = require("@hashgraph/sdk");

// utilities...
const questions = require("./utils.js").question;
const UInt8ToString = require("./utils.js").UInt8ToString;
const secondsToDate = require("./utils.js").secondsToDate;
const log = require("./utils.js").handleLog;
const sleep = require("./utils.js").sleep;

//initiate mirror node connection setup...
const mirrorNodeAddress = new Client(
  "hcs.testnet.mirrornode.hedera.com:5600");

const specialChar = "ℏ";
var operatorAccount = "";
const HederaClient = Client.forTestnet();
var topicId = "";
var logStatus = "Default";

// configure our env based on prompted input...
async function init() {
  inquirer.prompt(questions).then(async function (answers) {
    try {
      logStatus = answers.status;
      configureAccount(answers.account, answers.key);
      if (answers.existingTopicId != undefined) {
        configureExistingTopic(answers.existingTopicId);
      } else {
        await configureNewTopic();
      }
      // run & serve the express app...
      runChat();
    } catch (error) {
      log("ERROR: init() failed", error, logStatus);
      process.exit(1);
    }
  });
}

function runChat() {
  app.use(express.static("public"));
  http.listen(0, function () {
    const randomInstancePort = http.address().port;
    open("http://localhost:" + randomInstancePort);
  });
  subscribeToMirror();
  io.on("connection", function (client) {
    io.emit(
      "connect message",
      operatorAccount + specialChar + client.id + specialChar + topicId
    );
    client.on("chat message", function (msg) {
      const formattedMessage =
        operatorAccount + specialChar + client.id + specialChar + msg;
      sendHCSMessage(formattedMessage);
    });
    client.on("disconnect", function () {
      io.emit("disconnect message", operatorAccount + specialChar + client.id);
    });
  });
}

//call init function which calls runChat as well...
init();

// use Hedera Consensus Service to submit message...
function sendHCSMessage(msg) {
  try {
    new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(msg)
      .execute(HederaClient);
    log("TopicMessageSubmitTransaction()", msg, logStatus);
  } catch (error) {
    log("ERROR: TopicMessageSubmitTransaction()", error, logStatus);
    process.exit(1);
  }
}
// subscribe to mirror node...
function subscribeToMirror() {
  try {
    new TopicMessageQuery()
      .setTopicId(topicId)
      .setStartTime(0)
      .subscribe(HederaClient, res => {
        log("Response from TopicMessageQuery()", res, logStatus);
        const message = Buffer.from(res.contents, "utf8").toString();
        var runningHash = UInt8ToString(res["runningHash"]);
        var timestamp = secondsToDate(res["consensusTimestamp"]);
        io.emit(
          "chat message",
          message +
          specialChar +
          res.sequenceNumber +
          specialChar +
          runningHash +
          specialChar +
          timestamp
        );
      });
    log("TopicMessageQuery()", topicId.toString(), logStatus);
  } catch (error) {
    log("ERROR: TopicMessageQuery()", error, logStatus);
    process.exit(1);
  }
}
// create new topic for consensus...
async function createNewTopic() {
  try {
    const txId = await new TopicCreateTransaction()
    .execute(
      HederaClient
    );
    log("TopicCreateTransaction()", `submitted tx ${txId}`, logStatus);
    await sleep(3000); // wait until Hedera reaches consensus
    const receipt = await txId.getReceipt(HederaClient);
    const newTopicId = receipt.topicId;
    log(
      "TopicCreateTransaction()",
      `success! new topic ${newTopicId}`,
      logStatus
    );
    return newTopicId;
  } catch (error) {
    log("ERROR: TopicCreateTransaction()", error, logStatus);
    process.exit(1);
  }
}

// configure account from init...
function configureAccount(account, key) {
  try {
    // if either values in our init() process were empty...
    // we should try and fallback to the .env configuration...
    if (account === "" || key === "") {
      log("init()", "using default .env config", logStatus);
      operatorAccount = process.env.ACCOUNT_ID;
      HederaClient.setOperator(process.env.ACCOUNT_ID, process.env.PRIVATE_KEY);
    }
    // otherwise, let's use the initalization parameters...
    else {
      operatorAccount = account;
      HederaClient.setOperator(account, key);
    }
  } catch (error) {
    log("ERROR: configureAccount()", error, logStatus);
    process.exit(1);
  }
}
// configure new topic...
async function configureNewTopic() {
  log("init()", "creating new topic", logStatus);
  topicId = await createNewTopic();
  log(
    "TopicCreateTransaction()",
    `waiting for new HCS Topic & mirror node (it may take a few seconds)`,
    logStatus
  );
  await sleep(9000);
  return;
}
// configure existing topic...
async function configureExistingTopic(existingTopicId) {
  log("init()", "connecting to existing topic", logStatus);
  if (existingTopicId === "") {
    topicId = TopicId.fromString(process.env.TOPIC_ID);
  } else {
    topicId = TopicId.fromString(existingTopicId);
  }
};
