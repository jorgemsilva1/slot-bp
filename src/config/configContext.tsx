import React from 'preact/compat';
import { useContext, useReducer } from 'preact/hooks';

type InitialState = {
    win_percentage: 'auto' | number;
    user_type: undefined | 'regular' | 'bacana';
    blocked: boolean;
    num_of_plays: null | number;
};

type ConfigReducerActions = {
    type:
        | 'SET_WIN_PERCENTAGE'
        | 'SET_USER_TYPE'
        | 'SET_NUM_OF_PLAYS'
        | 'SET_BLOCKED'
        | 'SET_INITIAL_STATE_DATA'
        | 'RESET_STATE';
    value: any;
};

const ConfigContext = React.createContext();

const initialState: InitialState = {
    win_percentage: 'auto',
    user_type: undefined,
    blocked: true,
    num_of_plays: null,
};

// ACTIONS
export const SET_WIN_PERCENTAGE = 'SET_WIN_PERCENTAGE';
export const SET_USER_TYPE = 'SET_USER_TYPE';
export const SET_NUM_OF_PLAYS = 'SET_NUM_OF_PLAYS';
export const SET_BLOCKED = 'SET_BLOCKED';
export const SET_INITIAL_STATE_DATA = 'SET_INITIAL_STATE_DATA';
export const RESET_STATE = 'RESET_STATE';

export const setInitialStateData = (
    userType: any,
    numOfPlays: any,
    percentage: any
) => ({
    type: SET_INITIAL_STATE_DATA,
    userType,
    numOfPlays,
    percentage,
});

export const setWinPercentage = (percentage: number) => ({
    type: SET_WIN_PERCENTAGE,
    value: percentage,
});

export const setUserType = (userType: 'regular' | 'bacana' | undefined) => ({
    type: SET_USER_TYPE,
    value: userType,
});

export const setNumOfPlays = (numOfPlays: any) => ({
    type: SET_NUM_OF_PLAYS,
    value: numOfPlays,
});

export const setBlocked = (blocked: boolean) => ({
    type: SET_BLOCKED,
    value: blocked,
});

export const resetState = () => ({
    type: RESET_STATE,
    value: '',
});

export function configReducer(
    state: InitialState,
    action: ConfigReducerActions
): InitialState {
    switch (action.type) {
        case SET_WIN_PERCENTAGE:
            return { ...state, win_percentage: action.value };
        case SET_USER_TYPE:
            return { ...state, user_type: action.value };
        case SET_NUM_OF_PLAYS:
            return { ...state, num_of_plays: action.value };
        case SET_BLOCKED:
            return { ...state, blocked: action.value };
        case SET_INITIAL_STATE_DATA:
            return {
                ...state,
                num_of_plays: action.numOfPlays,
                user_type: action.userType,
                win_percentage: action.percentage,
            };
        case RESET_STATE:
            return initialState;
        default:
            return state;
    }
}

function ConfigProvider(props: any) {
    const [config, dispatch] = useReducer(configReducer, initialState);
    const configData = { config, dispatch };
    return <ConfigContext.Provider value={configData} {...props} />;
}

function useConfigContext(): any {
    return useContext(ConfigContext);
}

export { ConfigProvider, useConfigContext };
