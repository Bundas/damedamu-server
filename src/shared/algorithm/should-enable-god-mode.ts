import { Color, Draught } from "../types"

export const shouldEnableGodMode = (draught: Draught, bottomColor: Color) => {
    if (draught.coords.y === 0) {
        if (draught.color === bottomColor) {
            return true
        }
    }

    if (draught.coords.y === 7) {
        if (draught.color !== bottomColor) {
            return true
        }
    }

    return false
}
