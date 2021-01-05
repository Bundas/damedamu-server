/* eslint-disable @typescript-eslint/ban-ts-comment */
import http from 'http';
import express from 'express';
import { Server, Socket } from 'socket.io';

import generateShortId from './utils/generate-short-id';
import reduceState from './utils/game-reducer';
import { BaseGameContext, Color } from './shared/types';
import { fillStartingPosition } from './shared/algorithm/draughts-engine';
import { getActionBySquareClick } from './shared/draughts-action-creator';

export interface GameContext extends BaseGameContext {
    white?: Socket;
    black?: Socket;
}

interface Clients {
    [id: string]: GameContext;
}

const clients: Clients = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

clients['284007'] = {
    activeColor: 'white',
    draughts: [
        {
            color: 'white',
            coords: { x: 3, y: 4 },
            id: 'test',
            godMode: false,
        },
        {
            color: 'black',
            coords: { x: 2, y: 3 },
            id: 'test2',
            godMode: false,
        },
    ],
    killIds: [],
    moveInProgress: false,
    possibleMoves: [],
    selectedDraught: undefined,
};

// @ts-ignore
app.get('/create-game-id', (req, res) => {
    const gameId = generateShortId();
    clients[gameId] = {
        activeColor: 'white',
        draughts: fillStartingPosition(),
        killIds: [],
        moveInProgress: false,
        possibleMoves: [],
        selectedDraught: undefined,
    };

    res.json({ gameId });
});

// @ts-ignore
io.on('connection', (socket: Socket) => {
    // @ts-ignore
    const gameId = socket.handshake.query.token;
    if (!gameId) {
        console.log(
            'Socket tried to connect but without gameId so i am ignoring it',
        );
        return;
    }

    const game = clients[gameId];
    if (!game) {
        console.log(
            'Socket tried to connect but the game doesnt exist so i am ignoring it',
        );
        return;
    }

    if (!game.white) {
        clients[gameId] = reduceState(clients[gameId], {
            type: 'setWhite',
            socket,
        });
        console.log(`white has connected - ${socket.id}`);
    } else if (!game.black) {
        clients[gameId] = reduceState(clients[gameId], {
            type: 'setBlack',
            socket,
        });

        console.log(`black has connected - ${socket.id}`);
    } else {
        console.log('Socket tried to connect but there is no free space left');
        return;
    }

    socket.on('disconnect', () => {
        if (clients[gameId].black?.id === socket.id) {
            console.log('black has disconnected');
            clients[gameId] = reduceState(clients[gameId], {
                type: 'clearBlack',
            });
            clients[gameId].white?.emit('player-disconnected');
        } else {
            console.log('white has disconnected');
            clients[gameId] = reduceState(clients[gameId], {
                type: 'clearWhite',
            });
            clients[gameId].black?.emit('player-disconnected');
        }
    });

    if (clients[gameId].white && clients[gameId].black) {
        clients[gameId].white.emit('initial-data', {
            ...clients[gameId],
            white: undefined,
            black: undefined,
            startColor: 'white',
        });
        clients[gameId].black.emit('initial-data', {
            ...clients[gameId],
            white: undefined,
            black: undefined,
            startColor: 'black',
        });

        console.log('starting game');
    }

    socket.on('clicked-square', (coords) => {
        console.log(`clicked square: [${coords.x}, ${coords.y}]`);
        const color: Color =
            clients[gameId].white?.id === socket.id ? 'white' : 'black';
        if (clients[gameId].activeColor !== color) {
            return;
        }

        const action = getActionBySquareClick(
            coords.x,
            coords.y,
            color,
            clients[gameId],
        );

        if (action) {
            clients[gameId] = reduceState(clients[gameId], action);
            if (color === 'white') {
                clients[gameId].black?.emit('handle-action', action);
            } else {
                clients[gameId].white?.emit('handle-action', action);
            }
        }
    });
});

const port = process.env.PORT
server.listen(port, () => {
    console.log(`listening on *:${port}`);
});
