import { exploreMoves } from "./algorithm/draughts-engine"
import { BaseGameContext, Color } from "./types"

export const getActionBySquareClick = (x: number, y: number, startColor: Color, context: BaseGameContext) => {
    if (context.selectedDraught) {
        const possibleMove = context.possibleMoves.find((m) => m?.coords.x === x && m?.coords.y === y)
        if (possibleMove) {
            return {
                type: "moveDraught",
                position: possibleMove,
            }
        }
    }

    if (!context.moveInProgress && context.activeColor === startColor) {
        const draught = context.draughts.find((d) => d.coords.x === x && d.coords.y === y)
        if (draught) {
            if (draught.color === context.activeColor) {
                return {
                    type: "selectDraught",
                    draught,
                    possibleMoves: exploreMoves(draught, context.draughts, context.activeColor === "white"),
                }
            }
        }

        return {
            type: "selectDraught",
            draught: undefined,
            possibleMoves: [],
        }
    }

    return undefined
}
