require("rootpath")();
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const errorHandler = require("_middleware/error-handler");
const socket = require("socket.io");
const authorize = require("_middleware/authorize");
const Role = require("_helpers/role");
const fileupload = require("express-fileupload");
const shortid = require("shortid");
const path = require("path");
const fs = require("fs");
const db = require("_helpers/db");
app.use(fileupload());
const bbb = require("bigbluebutton-js");
const sha1 = require("sha1");

// Sprawdź wersję BigBlueButton przy starcie
const { checkBBBVersion } = require("_helpers/bbb-version-check");
const { logAPIChanges } = require("_helpers/bbb-api-adapter");

checkBBBVersion()
  .then(() => logAPIChanges())
  .catch(error => {
    console.error('Failed to check BBB version:', error);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

if(!fs.existsSync(path.join(__dirname, "logs.txt"))){
  fs.closeSync(fs.openSync("logs.txt", 'w'));
}
// allow cors requests from any origin and with credentials
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

// Health check endpoint for CI/CD - MUST be before static middleware
app.get("/health", (req, res) => {
  try {
    // Get port using same logic as server startup
    let healthPort;
    if (process.env.NODE_ENV === "production") {
      healthPort = process.env.PORT_API || process.env.PORT || 55984;
    } else {
      healthPort = process.env.PORT_API_DEV || process.env.PORT || 1234;
    }
    
    // Simple health check - no database or external dependencies
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: healthPort,
      nodeEnv: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ 
      status: "error", 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

//
app.use("/", express.static("static"));

app.get("/getLogoName/:id?", async function (req, res) {
  if (req.params.id) {
    const account = await db.Account.findOne({ _id: req.params.id });
    res.json({ name: account.logo });
  } else res.json({ name: process.env.DOMAIN == "hxspace" ? "ykSEGbsNO.png" : "proxeon-logo.png" });
});

app.get("/getLogoRoom/:id?", async function (req, res) {
  if (req.params.id) {
    let room;
    room = await db.Room.findOne({ user_join_id: req.params.id });
    if (!room) room = await db.Room.findOne({ mod_join_id: req.params.id });

    const account = await db.Account.findOne({ _id: room.userID });
    res.json({ name: account.logo });
  } else res.json({ name: process.env.DOMAIN == "hxspace" ? "ykSEGbsNO.png" : "proxeon-logo.png" });
});

app.get("/getLogo/:id?", function (req, res) {
  if (!req.params.id)
    res.sendFile(
      path.join(
        __dirname,
        "public",
        "logos",
        process.env.DOMAIN == "hxspace" ? "ykSEGbsNO.png" : "proxeon-logo.png"
      )
    );
  else res.sendFile(__dirname + "/public/logos/" + req.params.id);
});
app.get("/getMeetingInfoFromInternal/:id", async function (req, res) {
  var meetings = [];
  let url = process.env.BBB_URL + "api/getMeetings";
  let request = "getMeetings";
	let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  let results = [];
  url += "?checksum=" + sha;
  let http = bbb.http;
	await http(url).then((res) => {
		meetings = res.meetings.meeting;
  });
  if(meetings!=undefined && meetings[0]!=undefined){
    meetings.forEach(function(meeting){
      if(meeting.internalMeetingID==req.params.id){
        results = meeting;
      }
    })
  }else{
    if(meetings!=undefined && meetings.internalMeetingID==req.params.id){
      results = meetings;
    }
  }
  
  res.json(results);
  res.end();
});
app.get("/getMeetingLogo/:id", async function (req, res) {
  const meeting = await db.Meeting.findOne({ meetingID: req.params.id });
  if (meeting && meeting.roomID) {
    const room = await db.Room.findOne({ id: meeting.roomID });
    if (room && room.userID) {
      const user = await db.Account.findOne({ _id: room.userID });
      res.sendFile(path.join(__dirname, "public", "logos", user.logo));
    }
    else
    res.end()
  }
  else
  res.end()
});

app.get("/logosList", authorize(Role.Admin), async function (req, res) {
  const dirPath = path.join(__dirname, "public", "logos");
  var logos = [];

  var files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    let fileStat = fs.statSync(dirPath + "/" + file).isDirectory();
    if (!fileStat) {
      logos.push(file);
    }
  });

  res.send(logos);
});

app.post("/upload", authorize(Role.Admin), function (req, res) {
  if (!req.files.file) throw "No file";

  if (req.files.file.size / 1024 / 1024 >= 10)
    throw "File cannot be bigger than " + 10 + "MB"; //logo max size

  var img = req.files.file;

  const name = shortid.generate();

  img.mv(__dirname + "/public/logos/" + name + ".png", function (err) {
    if (err) {
      console.log(err);
    } else {
      res.json({ message: "ok" });
    }
  });
});

// start server
// Use environment-specific port variables with fallbacks
let port;
if (process.env.NODE_ENV === "production") {
  // Production: use PORT_API (default: 55984) or fallback to PORT or 55984
  port = process.env.PORT_API || process.env.PORT || 55984;
} else {
  // Development: use PORT_API_DEV (default: 1234) or fallback to PORT or 1234
  port = process.env.PORT_API_DEV || process.env.PORT || 1234;
}
const server = app.listen(port, () => {
  console.log("Server listening on port " + port);
});

const io = socket(server);

module.exports = { passSocket };

function passSocket() {
  return io;
}

// api routes
app.use("/accounts", require("./accounts/accounts.controller"));
app.use("/meetings", require("./controllers/meetings.controller"));
app.use("/roomservice", require("./controllers/room.controller"));
app.use("/slides", require("./controllers/slides.controller"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/static/index.html"));
});
// swagger docs route

app.use("/api-docs", require("_helpers/swagger"));

// global error handler
app.use(errorHandler);
