const db = require("_helpers/db");
const { v4: uuidv4 } = require("uuid");
const fetch = require("node-fetch");
const bbb = require("bigbluebutton-js");
const sha1 = require("sha1");
const jwt = require("jwt-simple");
var server = require("../app");
const io = server.passSocket();
var generator = require("generate-password");
const axios = require("axios");
var convert = require("xml-js");
const { adaptCreateParameters, validateCreateParameters } = require("_helpers/bbb-api-adapter");

module.exports = {
  getMeetings,
  getRecordings,
  endMeeting,
  meetingEnded,
  recordingReady,
  createMeeting,
  getAttendees,
  basicDetails,
  checkMeeting,
  deleteRecording,
  getActiveUsers,
  getAllRecordings,
  getAllMeetings,
  deleteOnboxRecording,
};

async function createMeeting(params) {
  const account = await db.Account.findOne({_id:params.userID})

  delete Object.assign(params, { ["roomID"]: params["id"] })["id"];
  delete params._id;

  const id = uuidv4();
  let api = bbb.api(process.env.BBB_URL, process.env.BBB_SECRET);
  let http = bbb.http;

  const slides = await db.Slide.find({ roomID: params.roomID });

  let xml =
    "<?xml version='1.0' encoding='UTF-8'?><modules><module name='presentation'>";
  if (slides.length > 0) {
    for (let i = 0; i < slides.length; i++) {
      xml +=
        "<document url='https://" +
        process.env.DOMAIN +
        ".pl/slides/getPresentation/" +
        slides[i]._id +
        "' filename='" +
        slides[i].localName +
        "'/>";
    }
  }

  xml += "</module></modules>";

  const admin_passw = generator.generate({
    length: 10,
    numbers: true,
  });
  const user_passw = generator.generate({
    length: 10,
    numbers: true,
  });

  let guest_policy;

  params.ask_moderator
    ? (guest_policy = "ASK_MODERATOR")
    : (guest_policy = "ALWAYS_ACCEPT");

  let meeting;

  let callback =
    "https://" +
    process.env.DOMAIN +
    ".pl/meetings/meetingEnded?id=" +
    params.roomID;

  let recording_callback =
    "https://" + process.env.DOMAIN + ".pl/meetings/recordingReady";

  // Przygotuj podstawowe parametry create
  // BBB 3.0 wymaga prawidłowych formatów URL i boolean
  
  // Ensure logoutURL has proper protocol
  let logoutURL = account.hostname || ("https://" + process.env.DOMAIN + ".pl");
  if (logoutURL && !logoutURL.startsWith('http')) {
    logoutURL = 'https://' + logoutURL;
  }
  
  let createParams = {
    record: true,
    allowStartStopRecording: true,
    attendeePW: user_passw,
    moderatorPW: admin_passw,
    meta_endCallbackUrl: callback,
    logoutURL: logoutURL,
    ["meta_bbb-recording-ready-url"]: recording_callback,
    muteOnStart: Boolean(params.mute_on_start), // Ensure boolean
    guestPolicy: guest_policy,
  };

  // Waliduj i dostosuj parametry do wersji BBB
  const validation = await validateCreateParameters(createParams);
  if (validation.warnings.length > 0) {
    console.log('⚠️  BBB API Warnings:');
    validation.warnings.forEach(w => console.log(`   ${w}`));
  }

  // Dostosuj parametry do wersji BBB (usuń przestarzałe dla 3.0)
  createParams = await adaptCreateParameters(createParams);

  console.log('🔍 Creating meeting with params:', JSON.stringify(createParams, null, 2));
  
  let meetingCreateUrl = api.administration.create(params.name, id, createParams);
  
  console.log('🔗 BBB API URL:', meetingCreateUrl);

  await axios({
    method: "post",
    url: meetingCreateUrl,
    headers: { "Content-Type": "text/xml" },
    data: xml,
  })
    .then((res) => {
      const obj = JSON.parse(convert.xml2json(res.data, { compact: true }));
      
      // Sprawdź czy BBB zwrócił błąd
      if (obj.response?.returncode?._text !== 'SUCCESS') {
        const errorMessage = obj.response?.message?._text || 'Unknown BBB error';
        const errorKey = obj.response?.messageKey?._text || 'unknownError';
        console.error('❌ BBB API Error:', errorKey, '-', errorMessage);
        throw new Error(`BBB API Error: ${errorMessage}`);
      }
      
      let date = new Date(Date.now());
      date.toString();
      params.startDate = date;
      params.meetingID = obj.response.meetingID._text;
      params.author = params.userID;
      params.admin_passw = admin_passw;
      params.user_passw = user_passw;
    })
    .then(async () => {
      meeting = new db.Meeting(params);
      await meeting.save();
    })
    .catch((err) => {
      console.error('❌ Error creating meeting:', err.message || err);
      console.error('URL:', meetingCreateUrl);
      throw err; // Rzuć błąd dalej aby można było go obsłużyć
    });

  return { meetingID: meeting.meetingID };
}

async function endMeeting(params) {
  var info = "";
  await fetch(params.url)
    .then(() => {
      info = "ok";
    })
    .catch((err) => {
      info = err;
    });
  return info;
}

async function checkMeeting(id, roomID) {
  let url = process.env.BBB_URL + "api/isMeetingRunning?meetingID=" + id;
  let request = "isMeetingRunningmeetingID=" + id;
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  url += "&checksum=" + sha;
  let http = bbb.http;


  await http(url).then(async (res) => {
    if (!res.running) {
      const room = await db.Room.findOne({ id: roomID });
      room.meetingID = null;
      await room.save();

     
    }
  });
  return true;
}

async function recordingReady(params) {
  const decoded = jwt.decode(params.signed_parameters, process.env.BBB_SECRET);

  await db.Meeting.updateOne(
    { meetingID: decoded.meeting_id },
    {
      $set: {
        recordingID: decoded.record_id,
        recordingStatus: "downloaded",
        recordingLink:
          process.env.BBB_DOWNLOAD_URL +
          decoded.record_id +
          "/" +
          decoded.record_id +
          ".mp4",
      },
    }
  );
  return true;
}

async function meetingEnded(params) {
  const room = await db.Room.findOne({ id: params.id });

  if (params.meetingID === room.meetingID) {
    room.meetingID = null;
    await room.save();

    io.emit("end", params.id);

    if (params.recordingmarks == "true") {
      let meeting = await db.Meeting.findOne({ meetingID: params.meetingID });

      const param = { recordingStatus: "encoding" };
      Object.assign(meeting, param);

      await meeting.save();
    }
  }
}

async function getMeetings(room_id) {
  const meetings = await db.Meeting.find({
    roomID: room_id,
    recordingStatus: { $exists: true },
  }).sort({ startDate: "descending" });
  return meetings.map((x) => basicDetails(x));
}

async function getAllMeetings(){
	var meetings = [];
	let url = process.env.BBB_URL + "api/getMeetings";
	let request = "getMeetings";
	let sha = request + process.env.BBB_SECRET;
	sha = sha1(sha);
	url += "?checksum=" + sha;
	let http = bbb.http;
	await http(url).then((res) => {
		meetings = res.meetings.meeting;
	});
	return meetings;
}

async function getAllRecordings(){
	var recordings = [];
	let url = process.env.BBB_URL + "api/getRecordings?state=any";
	let request = "getRecordingsstate=any";
	let sha = request + process.env.BBB_SECRET;
	sha = sha1(sha);
	url += "&checksum=" + sha;
	let http = bbb.http
	await http(url).then((res) => {
		recordings = res.recordings.recording;
  });
  recordings = {
    recordings: recordings,
    BBB_DOWNLOAD_URL: process.env.BBB_DOWNLOAD_URL
  };
	return recordings;
}

async function getRecordings(id) {
  const meetings = await getMeetings();
  var recordings = [];
  await Promise.all(
    meetings.map(async (item) => {
      let url =
        process.env.BBB_URL + "api/getRecordings?meetingID=" + item.meetingID;
      let request = "getRecordingsmeetingID=" + item.meetingID;
      let sha = request + process.env.BBB_SECRET;
      sha = sha1(sha);
      url += "&checksum=" + sha;
      let http = bbb.http;
      await http(url).then((res) => {
        if (!res.messageKey) {
          res.recordings.recording.src =
            process.env.BBB_DOWNLOAD_URL +
            res.recordings.recording.recordID +
            "/" +
            res.recordings.recording.recordID +
            ".mp4";
          recordings.push(res.recordings.recording);
        }
      });
    })
  );
  return recordings;
}

async function getAttendees(id) {
  let url = process.env.BBB_URL + "api/getMeetingInfo?meetingID=" + id;
  let request = "getMeetingInfomeetingID=" + id;
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  url += "&checksum=" + sha;
  let http = bbb.http;
  let users = [];
  await http(url).then((res) => {
    users = res.attendees;
  });
  return users;
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

async function deleteRecording(id) {
  const meeting = await db.Meeting.findOne({ meetingID: id });

  let url =
    process.env.BBB_URL +
    "api/deleteRecordings?recordID=" +
    meeting.recordingID;
  let request = "deleteRecordingsrecordID=" + meeting.recordingID;
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  url += "&checksum=" + sha;
  let http = bbb.http;
  await http(url)
    .then(async (res) => {
      await db.Meeting.updateOne(
        { meetingID: id },
        { $unset: { recordingID: "", recordingStatus: "", recordingLink: "" } }
      );
      return true;
    })
    .catch((err) => {
      console.log("error accured");
      throw err;
    });
}

async function deleteOnboxRecording(id) {
  const meeting = await db.Meeting.findOne({ meetingID: id });

  let url =
    process.env.BBB_URL +
    "api/deleteRecordings?recordID=" +
    meeting.recordingID;
  let request = "deleteRecordingsrecordID=" + meeting.recordingID;
  let sha = request + process.env.BBB_SECRET;
  sha = sha1(sha);
  url += "&checksum=" + sha;
  let http = bbb.http;
  await http(url)
    .then(async (res) => {
      await db.Meeting.updateOne(
        { meetingID: id },
        { $unset: { recordingID: "", recordingStatus: "", recordingLink: "" } }
      );
      return true;
    })
    .catch((err) => {
      console.log("error accured");
      throw err;
    });
}

async function getActiveUsers(roomID, user) {
  let room = await db.Room.findOne({ _id: roomID });

  if (!room) throw "Room doesnt exist";

  if (room.userID != user.id) throw "Unauthorized";

  if (!room.meetingID) return { isMeetingRunning: false, users: [] };
  else {
    await checkMeeting(room.meetingID, room.id);

    room = await db.Room.findOne({ _id: roomID });
    
    if (!room.meetingID) return { isMeetingRunning: false, users: [] };

    const users = await getAttendees(room.meetingID);

    let nicks = [];

    if (!users || !users.attendee) return { isMeetingRunning: true, users: [] };

    if (Array.isArray(users.attendee)) {
      nicks = users.attendee.map((item) => {
        return item.fullName;
      });
    } else {
      nicks = [users.attendee.fullName];
    }

    return { isMeetingRunning: true, users: nicks };
  }
}
