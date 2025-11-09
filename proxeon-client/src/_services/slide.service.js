
import { fetchWrapper } from '~root/_helpers';

const baseUrl = process.env.REACT_APP_SERVER_URL+"/slides";

export const slideService = {
    getAll,
    del
};


function getAll(room_id) {
    return fetchWrapper.get(`${baseUrl}/getSlides/${room_id}`);
}
function del(slide_id) {
    return fetchWrapper.delete(`${baseUrl}/${slide_id}`)

}
