import { fetchWrapper } from '~root/_helpers';

const baseUrl = process.env.REACT_APP_SERVER_URL+"/meetings";

export const meetingService = {
    getMeetings,
    getRecordings,
    getAll,
    getById,
    create,
    endMeeting,
    deleteRecording,
    getActiveUsers,
    getAllRecordings,
    getAllMeetings,
    getMP4
};

function getMP4(recordID){
    return fetchWrapper.get(`${baseUrl}/get-mp4?id=${recordID}`,{})
}
function endMeeting(url){
    return fetchWrapper.post(`${baseUrl}/end-meeting`,{url:url})
}

function getMeetings(id){
    return fetchWrapper.get(`${baseUrl}/get-meetings?id=${id}`,{})
}
function getRecordings(){
    return fetchWrapper.get(`${baseUrl}/get-recordings`,{})
}

function getAllRecordings(){
    return fetchWrapper.get(`${baseUrl}/get-all-recordings`,{})
}

function getAllMeetings(){
    return fetchWrapper.get(`${baseUrl}/get-all-meetings`,{})
}

function getAll() {
    return fetchWrapper.get(baseUrl);
}

function getById(id) {
    return fetchWrapper.get(`${baseUrl}/${id}`);
}

function create(params) {
    return fetchWrapper.post(baseUrl, params);
}


function deleteRecording(id,lang){
    return fetchWrapper.delete(`${baseUrl}/${id}/${lang}`)
}

function getActiveUsers(id){
    return fetchWrapper.get(`${baseUrl}/active-users/${id}`);
}


