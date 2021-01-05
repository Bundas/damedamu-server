import { Position } from "./algorithm/draughts-engine";

export interface BaseGameContext {
    draughts: Array<Draught>
    selectedDraught: Draught | undefined
    killIds: Array<number | string>
    possibleMoves: Array<Position>
    moveInProgress: boolean
    activeColor: Color
}

export type Color = "black" | "white"

export interface Coordinates {
    x: number
    y: number
}

export interface Draught {
    coords: Coordinates
    godMode: boolean
    color: Color
    id: number | string
}
