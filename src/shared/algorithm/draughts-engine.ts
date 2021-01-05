import * as uuid from "uuid"
import { Color, Coordinates, Draught } from "../types"

export interface Position {
    coords: Coordinates
    availableMoves: Array<Position>
    killId: number | string | undefined
}

export enum Direction {
    UpLeft = 1,
    UpRight = 2,
    DownLeft = -1,
    DownRight = -2,
}

interface PossibleKill {
    victim: Draught
    killer: Draught
    direction: Direction
}

export function* exploreDiagonalBehind(direction: Direction, coords: Coordinates, godMode: boolean) {
    if (direction === Direction.UpLeft || direction === Direction.UpRight) {
        const possibleStepsToKill = godMode ? 7 - coords.y : 1

        for (let y = coords.y + 1; y <= Math.min(coords.y + possibleStepsToKill, 7); ++y) {
            const levelsSearched = y - coords.y

            if (direction === Direction.UpLeft) {
                const x = coords.x - levelsSearched
                if (x < 0) {
                    break
                }

                yield { x, y }
            } else {
                const x = coords.x + levelsSearched
                if (x > 7) {
                    break
                }

                yield { x, y }
            }
        }
    } else if (direction === Direction.DownLeft || direction === Direction.DownRight) {
        const possibleStepsToKill = godMode ? coords.y : 1

        for (let y = coords.y - 1; y >= Math.max(coords.y - possibleStepsToKill, 0); y--) {
            const levelsSearched = y - coords.y

            if (direction === Direction.DownLeft) {
                const x = coords.x + levelsSearched
                if (x < 0) {
                    break
                }

                yield { x, y }
            } else {
                const x = coords.x - levelsSearched

                if (x > 7) {
                    break
                }

                yield { x, y }
            }
        }
    }
}

const getFreeSpacesBehindDraught = (
    victimDraught: Draught,
    draughts: Array<Draught>,
    direction: Direction,
    godMode: boolean
): Array<Coordinates> => {
    const freeCoords = new Array<Coordinates>()

    for (const { x, y } of exploreDiagonalBehind(direction, victimDraught.coords, godMode)) {
        if (!draughts.some((d) => d.coords.x === x && d.coords.y === y)) {
            freeCoords.push({ x, y })
        } else {
            break
        }
    }

    return freeCoords
}

export const isFreeSpaceBehindDraught = (draught: Draught, draughts: Array<Draught>, direction: Direction) => {
    return getFreeSpacesBehindDraught(draught, draughts, direction, false).length > 0
}

export const getPossibleDiagonalKill = (
    draught: Draught,
    draughts: Array<Draught>,
    direction: Direction
): PossibleKill | undefined => {
    for (const { x, y } of exploreDiagonalBehind(direction, draught.coords, draught.godMode)) {
        const foundDraught = draughts.find((d) => d.coords.x === x && d.coords.y === y)
        if (foundDraught && foundDraught.color !== draught.color) {
            if (isFreeSpaceBehindDraught(foundDraught, draughts, direction)) {
                return {
                    killer: draught,
                    victim: foundDraught,
                    direction,
                }
            } else {
                return undefined
            }
        } else if (foundDraught && foundDraught.color === draught.color) {
            return undefined
        }
    }

    return undefined
}

export const isPossibleDiagonalKill = (draught: Draught, draughts: Array<Draught>, direction: Direction) => {
    return getPossibleDiagonalKill(draught, draughts, direction) !== undefined
}

const getPossibleKills = (
    draught: Draught,
    draughts: Array<Draught>,
    excludeDirection: Direction | undefined,
    switchSides: boolean
) => {
    const directionMultiplier = switchSides ? -1 : 1

    const possibleKills = []

    const possibleUpLeftKill = getPossibleDiagonalKill(draught, draughts, directionMultiplier * Direction.UpLeft)
    if (!(excludeDirection === directionMultiplier * Direction.UpLeft) && possibleUpLeftKill) {
        possibleKills.push(possibleUpLeftKill)
    }

    const possibleUpRightKill = getPossibleDiagonalKill(draught, draughts, directionMultiplier * Direction.UpRight)
    if (!(excludeDirection === directionMultiplier * Direction.UpRight) && possibleUpRightKill) {
        possibleKills.push(possibleUpRightKill)
    }

    if (draught.godMode) {
        const possibleDownLeftKill = getPossibleDiagonalKill(
            draught,
            draughts,
            directionMultiplier * Direction.DownLeft
        )
        if (!(excludeDirection === directionMultiplier * Direction.DownLeft) && possibleDownLeftKill) {
            possibleKills.push(possibleDownLeftKill)
        }

        const possibleDownRightKill = getPossibleDiagonalKill(
            draught,
            draughts,
            directionMultiplier * Direction.DownRight
        )
        if (!(excludeDirection === directionMultiplier * Direction.DownRight) && possibleDownRightKill) {
            possibleKills.push(possibleDownRightKill)
        }
    }

    return possibleKills
}

const getPossibleNonKillingPositions = (draught: Draught, draughts: Array<Draught>, switchSides: boolean) => {
    const directionMultiplier = switchSides ? -1 : 1

    const possiblePositions = new Array<Position>()

    const possibleUpLeftPositions: Array<Position> = getFreeSpacesBehindDraught(
        draught,
        draughts,
        directionMultiplier * Direction.UpLeft,
        draught.godMode
    ).map((c) => ({ availableMoves: [], killId: undefined, coords: c }))

    const possibleUpRightPositions: Array<Position> = getFreeSpacesBehindDraught(
        draught,
        draughts,
        directionMultiplier * Direction.UpRight,
        draught.godMode
    ).map((c) => ({ availableMoves: [], killId: undefined, coords: c }))

    const possibleDownLeftPositions: Array<Position> = getFreeSpacesBehindDraught(
        draught,
        draughts,
        directionMultiplier * Direction.DownLeft,
        draught.godMode
    ).map((c) => ({ availableMoves: [], killId: undefined, coords: c }))

    const possibleDownRightPositions: Array<Position> = getFreeSpacesBehindDraught(
        draught,
        draughts,
        directionMultiplier * Direction.DownRight,
        draught.godMode
    ).map((c) => ({ availableMoves: [], killId: undefined, coords: c }))

    possiblePositions.push(...possibleUpLeftPositions)
    possiblePositions.push(...possibleUpRightPositions)

    if (draught.godMode) {
        possiblePositions.push(...possibleDownLeftPositions)
        possiblePositions.push(...possibleDownRightPositions)
    }

    return possiblePositions
}

const getOppositeDirection = (direction: Direction) => {
    switch (direction) {
        case Direction.UpLeft:
            return Direction.DownRight
        case Direction.UpRight:
            return Direction.DownLeft
        case Direction.DownLeft:
            return Direction.UpRight
        case Direction.DownRight:
            return Direction.UpLeft
    }
}

export const exploreMoves = (
    draught: Draught,
    draughts: Array<Draught>,
    switchSides: boolean,
    killingOnly: boolean = false,
    isPositionExplored: (coords: Coordinates) => boolean = () => false,
    excludeDirection?: Direction
): Array<Position> => {
    const possiblePositions = new Array<Position>()
    const possibleKills = getPossibleKills(draught, draughts, excludeDirection, switchSides)

    if (possibleKills.length > 0) {
        for (const possibleKill of possibleKills) {
            const spacesBehindVictim = getFreeSpacesBehindDraught(
                possibleKill.victim,
                draughts,
                possibleKill.direction,
                draught.godMode
            )
            for (const freeSpaceCoords of spacesBehindVictim) {
                const position: Position = {
                    coords: freeSpaceCoords,
                    killId: possibleKill.victim.id,
                    availableMoves: !isPositionExplored(freeSpaceCoords)
                        ? exploreMoves(
                              { ...draught, coords: freeSpaceCoords },
                              draughts,
                              switchSides,
                              true,
                              (coords) => {
                                  return (
                                      isPositionExplored(coords) ||
                                      (draught.coords.x === coords.x && draught.coords.y === coords.y)
                                  )
                              },
                              getOppositeDirection(possibleKill.direction)
                          )
                        : [],
                }

                possiblePositions.push(position)
            }
        }
    } else if (!killingOnly) {
        return getPossibleNonKillingPositions(draught, draughts, switchSides)
    }

    return possiblePositions
}

export const fillStartingPosition = (bottomColor: Color = 'white') => {
    const draughts = new Array<Draught>()

    const fillRow = (y: number, color: Color) => {
        const offset = y % 2
        for (let x = offset; x < 8; x += 2) {
            draughts.push({ coords: { x, y }, color, godMode: false, id: uuid.v4() })
        }
    }

    for (let y = 0; y < 3; ++y) {
        fillRow(y, bottomColor !== "black" ? "black" : "white")
    }

    for (let y = 5; y < 8; ++y) {
        fillRow(y, bottomColor === "black" ? "black" : "white")
    }

    return draughts
}
