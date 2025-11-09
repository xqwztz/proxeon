const db = require("_helpers/db");
const bbb = require("bigbluebutton-js");
const sha1 = require("sha1");
const shortid = require("shortid");
const meetingService = require("./meeting.service.js");
const fs = require("fs");
var server = require("../app");
const io = server.passSocket();
const path = require("path");
const fetch = require("node-fetch");

module.exports = {
  create,
  getAll,
  getOneRoom,
  update,
  createMeeting,
  getLink,
  meetingEnded,
  checkCode,
  validateCode,
  checkRecordings,
  checkBBBStatus,
  deleteRoom,
  createOnbox,
  getOnboxMeetings,
};

async function getLink(params, user) {
  // Initialize BBB API
  let api = bbb.api(process.env.BBB_URL, process.env.BBB_SECRET);
  
  let meeting;
  let room_old, room;

  if (params.type == "usr")
    room_old = await db.Room.findOne({ user_join_id: params.roomID });
  else if (params.type == "mod")
    room_old = await db.Room.findOne({ mod_join_id: params.roomID });
  else throw "Błędny link";
  if (!room_old) throw "This room does not exist";
  if (room_old.waitingForStart) {
    if(!room_old.meetingID){
      let Thirty_Seconds = 1000 * 30;
      if(((new Date()) - room_old.waitingForStartTimeStamp) > Thirty_Seconds ){
        room_old.waitingForStart = false;
      }
      await room_old.save()
    }
    
    throw "busy";
  }

  if (room_old.meetingID) {
    await meetingService.checkMeeting(room_old.meetingID, room_old.id);
    room = await db.Room.findOne({ id: room_old.id });
  } else {
    room = room_old;
    if (room.user_start_meeting || params.type === "mod") {
      room.waitingForStart = true;
      room.waitingForStartTimeStamp = new Date();
      await room.save();
    }
  }

  let url = "";

  if (!room.meetingID && !room.user_start_meeting && params.type === "usr") {
    const check = setInterval(async () => {
      let room_wait = await db.Room.findOne({ id: room.id });
      if (room_wait.meetingID) {
        meeting = await db.Meeting.findOne({ meetingID: room_wait.meetingID });

        // Build join options using bigbluebutton-js
        const password = params.type === "mod" ? meeting.admin_passw : meeting.user_passw;
        const joinOptions = {};

        // Add guest parameter for regular users
        if (params.type === "usr") {
          joinOptions.guest = true;
        }

        // Add custom style for specific room
        if (room.id == "ovlM6w3-1") {
          joinOptions["userdata-bbb_custom_style"] = ":root{--loader-bg:#2a2a31;}.overlay--1aTlbi{background-color:#2a2a31!important;}body{background-color:#2a2a31!important;}.primary--1IbqAO{background-color:#fe5500!important}.primary--1IbqAO>i::before{color:white!important}";
        }

        // Generate join URL using bigbluebutton-js library
        url = api.administration.join(params.login, meeting.meetingID, password, joinOptions);

        let users = await meetingService.getAttendees(room_wait.meetingID);

        let attendee = users.attendee;

        if (
          (Array.isArray(attendee) && attendee.length > 0) ||
          (typeof attendee == "object" && Object.keys(attendee).length > 0)
        ) {
          io.emit("modEntered");
          clearInterval(check);
        }
      }
    }, 1000);

    throw "wait";
  } else if (
    !room.meetingID &&
    (room.user_start_meeting || params.type === "mod")
  ) {
    room = await createMeeting(room.id, user);
    io.emit("userStarted", { room: room.id, meeting: room.meetingID });
  }

  meeting = await db.Meeting.findOne({ meetingID: room.meetingID });

  // Build join options using bigbluebutton-js
  const password = params.type === "mod" ? meeting.admin_passw : meeting.user_passw;
  const joinOptions = {};

  // Add guest parameter for regular users
  if (params.type === "usr") {
    joinOptions.guest = true;
  }

  // Add custom style for specific room
  if (room.id == "ovlM6w3-1") {
    joinOptions["userdata-bbb_custom_style"] = ":root{--loader-bg:#2a2a31;}.overlay--1aTlbi{background-color:#2a2a31!important;}body{background-color:#2a2a31!important;}.primary--1IbqAO{background-color:#fe5500!important}.primary--1IbqAO>i::before{color:white!important}";
  }

  // Generate join URL using bigbluebutton-js library
  url = api.administration.join(params.login, meeting.meetingID, password, joinOptions);

  return url;
}

async function meetingEnded(id) {
  io.emit("end", id);
  const room = await db.Room.findOne({ meetingID: id });
  room.meetingID = null;
  await room.save();
}

async function createMeeting(id, user) {
  const writeToFile = (data) => {
    fs.open(path.join(__dirname, "..", "logs.txt"), "a", 666, function (e, id) {
      fs.write(id, data, "utf8", function () {
        fs.close(id, function () { });
      });
    });
  };

  writeToFile(
    `[${user}] - ${new Date(
      Date.now()
    ).toISOString()} - Request for creating meeting in room ${id}\n`
  );

  return new Promise(async (resolve, reject) => {
    const room = await db.Room.findOne({ id: id });
    const obj = JSON.parse(JSON.stringify(room));

    meetingService
      .createMeeting(obj, user)
      .then(async (meeting) => {
        writeToFile(
          `[${user}] - ${new Date(
            Date.now()
          ).toISOString()} - Created meeting in room ${room.id}\n`
        );

        await db.Room.updateOne({ id: id }, { meetingID: meeting.meetingID });
        const updated_room = await db.Room.findOne({ id: id });

        writeToFile(
          `[${user}] - ${new Date(Date.now()).toISOString()} - Updated room ${room.id
          } with meeting ID ${meeting.meetingID}\n`
        );

        waitForStart(id, meeting.meetingID);

        resolve(updated_room);
      })
      .catch(async (err) => {
        await db.Room.updateOne({ id: id }, { $unset: { waitingForStart: 1 } });

        writeToFile(
          `[${user}] - ${new Date(
            Date.now()
          ).toISOString()} - Error with creating meeting in room ${room.id}\n`
        );

        reject("Nie udało się utworzyć spotkania, spróbuj ponownie za chwilę");
      });
  });
}

function waitForStart(id, meetingID) {
  const interv = setInterval(() => {
    let url =
      process.env.BBB_URL + "api/isMeetingRunning?meetingID=" + meetingID;
    const request = "isMeetingRunningmeetingID=" + meetingID;
    let sha = request + process.env.BBB_SECRET;
    sha = sha1(sha);
    url += "&checksum=" + sha;
    let http = bbb.http;

    http(url).then(async (res) => {
      if (res.running) {
        await db.Room.updateOne({ id: id }, { $unset: { waitingForStart: 1 } });
        clearInterval(interv);
      }
    });
  }, 1500);
}

async function getAll(user_id) {
  const rooms = await db.Room.find({ userID: user_id });
  return rooms;
}

async function getOneRoom(room_id) {
  const room = await db.Room.findOne({ id: room_id });
  return room;
}

async function getOnboxMeetings(roomID) {
  const meetings = await db.Meeting.find({
    roomID: roomID,
    recordingStatus: { $exists: true },
  }).sort({ startDate: "descending" });

  return meetings.map((x) => basicDetails(x));

}

async function update(id, params) {
  const room = await getOneRoom(id);

  if (
    room.name !== params.name &&
    (await db.Room.findOne({ name: params.name, userID: params.userID }))
  ) {
    throw "Room with this name already exists";
  }

  if (room.accessCode && !params.accessCode) {
    await db.Room.updateOne({ id: id }, { $unset: { accessCode: "" } });
  }

  Object.assign(room, params);

  await room.save();

  return room;
}

async function create(params) {
  if (await db.Room.findOne({ name: params.name, userID: params.userID })) {
    throw "Room with this name already exists";
  }

  const room_id = shortid.generate();
  params.id = room_id;

  const room_user_id = shortid.generate();
  params.user_join_id = room_user_id;

  const room_mod_id = shortid.generate();
  params.mod_join_id = room_mod_id;

  params.createDate = new Date(Date.now());
  const room = new db.Room(params);
  await room.save();

  return "ok";
}

async function createOnbox(params) {
  const userID = '603ca5bc220c3de31eb4bb7a';

  const room_id = shortid.generate(), room_user_id = shortid.generate(), room_mod_id = shortid.generate();


  const room = new db.Room({
    id: room_id,
    user_join_id: room_user_id,
    mod_join_id: room_mod_id,
    createDate: new Date(Date.now()),
    name: "ONBOX - " + params.name,
    user_start_meeting: true,
    mute_on_start: false,
    ask_moderator: false,
    userID: userID
  });

  await room.save();

  return {
    roomID: room_id,
    user_join_id: room.user_join_id,
    mod_join_id: room.mod_join_id
  }
}

async function checkCode(id) {
  let room, is_mod = false;
  room = await db.Room.findOne({ user_join_id: id });
  if (!room) {
    room = await db.Room.findOne({ mod_join_id: id })
    is_mod = true
  };

  if (!room) throw "Room does not exist";

  const owner = await db.Account.findOne({ _id: room.userID });

  return {
    code: room.accessCode && !is_mod,
    name: room.name,
    color: owner.color,
    user_id: room.userID,
  }
}

async function validateCode(params) {
  let room;
  room = await db.Room.findOne({ user_join_id: params.id });
  if (!room) room = await db.Room.findOne({ mod_join_id: params.id });

  if (!room) throw "Room does not exist";

  if (!room.accessCode || (room.accessCode && params.code === room.accessCode))
    return true;
  else return false;
}

async function checkRecordingsFromMeetings(meetings_ids) {
  let url = process.env.BBB_URL + "api/getRecordings?meetingID=" + meetings_ids;
  let request = "getRecordingsmeetingID=" + meetings_ids;
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  url += "&checksum=" + sha;
  let http = bbb.http;

  let count;
  let recordings = [];

  await http(url)
    .then(async (res) => {
      recordings = res.recordings;
      if (res.recordings == "") count = 0;
      else {
        if (Array.isArray(res.recordings.recording))
          count = res.recordings.recording.length;
        else count = 1;
      }
    })
    .catch((err) => {
      console.log("error while reading recordings from bbb");
      console.log(err);
      count = -1;
    });

  return { count, recordings };
}

async function getMeetingsIDs(roomID) {
  const meetings = await db.Meeting.find({ roomID: roomID });

  let meetings_string = "";

  for (const meeting of meetings) {
    meetings_string += meeting.meetingID + ",";
  }

  if (meetings_string == "") return undefined;
  else {
    meetings_string = meetings_string.substring(0, meetings_string.length - 1);

    return meetings_string;
  }
}

async function getRecordingsIDs(meetings) {
  const recordings = await checkRecordingsFromMeetings(meetings);

  switch (recordings.count) {
    case -1: {
      throw "Error while reading recordings";
    }
    case 0: {
      return "";
    }
    case 1: {
      return recordings.recordings.recording.recordID;
    }
    default: {
      let recording_ids = "";
      recordings.recordings.recording.map((item) => {
        recording_ids += item.recordID + ",";
      });

      recording_ids = recording_ids.substring(0, recording_ids.length - 1);

      return recording_ids;
    }
  }
}

async function checkRecordings(id, user) {
  const room = await db.Room.findOne({ _id: id });

  if (room.userID != user.id) throw "Unauthorized";

  const meetings_string = await getMeetingsIDs(room.id);

  const recordings = await checkRecordingsFromMeetings(meetings_string);

  if (recordings.count == -1) throw "Error while reading recordings";

  return recordings.count;
}

async function checkBBBStatus() {
  const respond = { status: false };

  const BBB_response = await fetch(process.env.BBB_URL);
  if (BBB_response.status === 200) {
    respond.status = true;
  }

  return respond
}

async function deleteRecordings(ids) {
  let url = process.env.BBB_URL + "api/deleteRecordings?recordID=" + ids;
  let request = "deleteRecordingsrecordID=" + ids;
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  url += "&checksum=" + sha;
  let http = bbb.http;

  let status;

  await http(url)
    .then(async (res) => {
      if (res.deleted) status = true;
      else status = false;
    })
    .catch((err) => {
      console.log("error while deleting recordings from bbb");
      console.log(err);
      status = false;
    });

  return status;
}

async function deleteRoom(id, user) {
  const room = await db.Room.findOne({ _id: id });

  if (room.userID != user.id) throw "Unauthorized";

  const meetings_ids = await getMeetingsIDs(room.id);

  if (meetings_ids) {
    const recording_ids = await getRecordingsIDs(meetings_ids);

    let can_delete_room = true;
    if (recording_ids != "") {
      can_delete_room = await deleteRecordings(recording_ids);
    }

    if (!can_delete_room)
      throw "Nie można usunąć pokoju, błąd przy usuwaniu nagrań z serwera";
  }

  await db.Meeting.deleteMany({ roomID: room.id });

  await db.Room.deleteOne({ _id: room._id });

  return "Pokój został usunięty";
}

function basicDetails(meeting) {
  const {
    id,
    meetingID,
    recordingLink,
    recordingStatus,
    roomID,
    startDate,
  } = meeting;
  return { id, meetingID, recordingLink, recordingStatus, roomID, startDate };
}
