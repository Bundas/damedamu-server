import produce from "immer";

import { GameContext } from "../main";
import {createDraughtReducer} from '../shared/draught-reducer'


const reduceState = createDraughtReducer('white');

const gameReducer = (state: GameContext, action: any) => {
    return produce(reduceState(state, action) as GameContext, draft => {
        switch(action.type) {
            case "setWhite": {
                draft.white = action.socket
                break
            }
            case "setBlack": {
                draft.black = action.socket
                break
            }
            case "clearWhite": {
                draft.white = undefined
                break;
            }
            case "clearBlack": {
                draft.black = undefined;
                break;
            }
        }
    })
}

export default gameReducer
