import {
    CHANGE_COLOR_TO_ORANGE,
    CHANGE_COLOR_TO_BLUE,
    CHANGE_COLOR_TO_GREEN,
    CHANGE_COLOR_TO_RED,
    CHANGE_COLOR_TO_VAILLANT,
    CHANGE_COLOR_TO_SAUNIER
} from '../actions/colorActions';

const initialState = {
    color: process.env.REACT_APP_DOMAIN.toLowerCase()==='hxspace' || window.location.hostname==="ropibrwarszawa.hxspace.pl"?'blue':'green',
};

export default function (state = initialState, action) {
    switch (action.type) {
        case CHANGE_COLOR_TO_ORANGE:
            return { color: 'orange' };
        case CHANGE_COLOR_TO_BLUE:
            return { color: 'blue' };
        case CHANGE_COLOR_TO_GREEN:
            return { color: 'green' };
        case CHANGE_COLOR_TO_RED:
            return { color: 'red' };
        case CHANGE_COLOR_TO_SAUNIER:
            return { color: 'saunier' };
        case CHANGE_COLOR_TO_VAILLANT:
            return { color: 'vaillant' };
        default:
            return state;
    }
}
