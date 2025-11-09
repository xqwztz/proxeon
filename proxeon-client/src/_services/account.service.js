import { BehaviorSubject } from 'rxjs';
import { fetchWrapper, history } from '~root/_helpers';
import { changeColorToBlue, changeColorToGreen } from '~root/redux/actions/colorActions';
import store from '~root/containers/App/store'

const userSubject = new BehaviorSubject(null);
const baseUrl = process.env.REACT_APP_SERVER_URL+"/accounts";


export const accountService = {
    login,
    logout,
    refreshToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    changePassword,
    getAll,
    getById,
    create,
    update,
    getActiveUsers,
    delete: _delete,
    user: userSubject.asObservable(),
    get userValue () { return userSubject.value }
};

function login(email, password, lang) {
    return fetchWrapper.post(`${baseUrl}/authenticate`, { email, password,lang})
        .then(user => {
            // publish user to subscribers and start timer to refresh token
            userSubject.next(user);
            startRefreshTokenTimer();
            return user;
        });
}

function changePassword(id,currentPassword, newPassword, newPasswordRepeat,lang) {
    return fetchWrapper.put(`${baseUrl}/changePassword/${id}`, 
    {currentPassword:currentPassword, newPassword:newPassword, newPasswordRepeat:newPasswordRepeat,lang:lang}
    )
}


function logout(lang) {
    // revoke token, stop refresh timer, publish null to user subscribers and redirect to login page
    fetchWrapper.post(`${baseUrl}/revoke-token`, {lang});
    stopRefreshTokenTimer();    
    userSubject.next(null);   
    process.env.REACT_APP_DOMAIN.toLowerCase()==='hxspace' || window.location.hostname==="ropibrwarszawa.hxspace.pl"?   
    store.dispatch(changeColorToBlue())
    :
    store.dispatch(changeColorToGreen())

    history.push("/login")    
}

function refreshToken() {
    
    return fetchWrapper.post(`${baseUrl}/refresh-token`, {})
        .then(user => {
            // publish user to subscribers and start timer to refresh token
            
            userSubject.next(user);
            startRefreshTokenTimer();
            return user;
        })
        .catch(err=>{

        })
}

function register(params,lang) {
    params.lang=lang
    return fetchWrapper.post(`${baseUrl}/register`, params);
}

function verifyEmail(token,lang) {
    const params={token:token,lang:lang}
    return fetchWrapper.post(`${baseUrl}/verify-email`, params);
}

function forgotPassword(email,lang) {
    const params={email:email, lang:lang}
    return fetchWrapper.post(`${baseUrl}/forgot-password`, params);
}

function validateResetToken(token,lang) {
    const params={token:token, lang:lang}
    return fetchWrapper.post(`${baseUrl}/validate-reset-token`, params);
}

function resetPassword({ token, password, confirmPassword },lang) {
    return fetchWrapper.post(`${baseUrl}/reset-password`, { token, password, confirmPassword,lang });
}

function getAll() {
    return fetchWrapper.get(`${baseUrl}`);
}

function getById(id,lang) {
    return fetchWrapper.get(`${baseUrl}/${id}/${lang}`);
}

function create(params,lang) {
    params.lang=lang
    return fetchWrapper.post(baseUrl, params);
}

function update(id, params,lang) {
    params.lang=lang
    if(id===userSubject.value.id && params.role==="User" && userSubject.value.role==="Admin"){
        throw new Error("error");
    }
    return fetchWrapper.put(`${baseUrl}/${id}`, params)
        .then(user => {
            // update stored user if the logged in user updated their own record
            if (user.id === userSubject.value.id) {
                // publish updated user to subscribers
                user = { ...userSubject.value, ...user };
                userSubject.next(user);
            }
            return user;
        });
}

// prefixed with underscore because 'delete' is a reserved word in javascript
function _delete(id) {
    return fetchWrapper.delete(`${baseUrl}/${id}`)
        .then(x => {
            // auto logout if the logged in user deleted their own record
            if (id === userSubject.value.id) {
                logout();
            }
            return x;
        });
}

function getActiveUsers(){
    return fetchWrapper.get(`${baseUrl}/active-users`)    
}

// helper functions

let refreshTokenTimeout;

function startRefreshTokenTimer() {
    // parse json object from base64 encoded jwt token
    const jwtToken = JSON.parse(atob(userSubject.value.jwtToken.split('.')[1]));

    // set a timeout to refresh the token a minute before it expires
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);
    refreshTokenTimeout = setTimeout(refreshToken, timeout);
}

function stopRefreshTokenTimer() {
    clearTimeout(refreshTokenTimeout);
}


