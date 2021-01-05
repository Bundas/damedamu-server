import produce from "immer"
import { shouldEnableGodMode } from "./algorithm/should-enable-god-mode"

import { BaseGameContext, Color } from "./types"

export const createDraughtReducer = (bottomColor: Color) => (state: BaseGameContext, action: any) => {
    if (action.type === "resetState") {
        return { ...state, ...action.state }
    }

    return produce(state, (draft) => {
        switch (action.type) {
            case "selectDraught": {
                draft.selectedDraught = action.draught
                draft.possibleMoves = action.possibleMoves
                break
            }
            case "moveDraught": {
                if (draft.selectedDraught) {
                    draft.selectedDraught.coords.x = action.position.coords.x
                    draft.selectedDraught.coords.y = action.position.coords.y
                    draft.possibleMoves = action.position.availableMoves
                    draft.moveInProgress = action.position.availableMoves.length > 0

                    if (action.position.killId) {
                        draft.killIds.push(action.position.killId)
                    }

                    const selectedDraught = draft.draughts.find((d) => d.id === draft.selectedDraught?.id)
                    if (selectedDraught) {
                        selectedDraught.coords = action.position.coords
                        if (shouldEnableGodMode(selectedDraught, bottomColor)) {
                            selectedDraught.godMode = true
                        }
                    }

                    if (!draft.moveInProgress) {
                        draft.draughts = draft.draughts.filter((d) => !draft.killIds.includes(d.id))
                        draft.killIds = []
                        draft.activeColor = draft.activeColor === "white" ? "black" : "white"
                        draft.selectedDraught = undefined
                    }
                }
                break
            }
        }
    })
}
