import { fetchWrapper} from '~root/_helpers';

const baseUrl = process.env.REACT_APP_SERVER_URL+"/roomservice";

export const roomService = {
    getMeetings,
    getRecordings,
    getAll,
    getById,
    create,
    endMeeting,
    update,
    startMeeting,
    getLink,
    checkForCode,
    validateCode,
    checkRecordings,
    deleteRoom,
    getLogoFromUserId
};


function endMeeting(url){
    return fetchWrapper.post(`${baseUrl}/end-meeting`,{url:url})
}

function getLogoFromUserId(user_id){
    return fetchWrapper.get(`${process.env.REACT_APP_SERVER_URL}/getLogoName/`+user_id,{});
}

function getMeetings(){
    return fetchWrapper.get(`${baseUrl}/get-meetings`,{})
}
function getRecordings(){
    return fetchWrapper.get(`${baseUrl}/get-recordings`,{})
}

function getAll(user_id) {
    return fetchWrapper.get(`${baseUrl}/get-rooms/${user_id}`);
}

function getById(id) {
    return fetchWrapper.get(`${baseUrl}/${id}`);
}

function create(params) {

    return fetchWrapper.post(baseUrl, params);
}
function update(params,id) {
    return fetchWrapper.put(`${baseUrl}/${id}`, params)
}
function startMeeting(params) {
    return fetchWrapper.put(`${baseUrl}/create-meeting/${params}`)
}
function getLink(params) {
    return fetchWrapper.post(`${baseUrl}/create-link`,params)
}
function checkForCode(id){
    return fetchWrapper.get(`${baseUrl}/checkCode/${id}`)
}
function validateCode(code,id){
    return fetchWrapper.post(`${baseUrl}/validateCode`,{id:id, code:code})
}

function checkRecordings(id){
    return fetchWrapper.get(`${baseUrl}/check-recordings/${id}`)
}

function deleteRoom(id){
    return fetchWrapper.delete(`${baseUrl}/delete-room/${id}`)
}