/**
 * Torpedó (Battleship) közös szerveroldali segédfüggvények:
 *  - sanitizeGame: az ellenfél el nem süllyesztett hajóinak pozícióját nem adjuk ki a kliensnek (csalás ellen)
 *  - validateFleet: a kliens által küldött elrendezés ellenőrzése
 */
export const BOARD_SIZE = 8; // alapértelmezett (régi játékok)
export const MIN_BOARD = 5;
export const MAX_BOARD = 10;
export const MAX_FILL = 0.4; // a hajók a tábla legfeljebb ennyi részét foglalhatják el

export type Difficulty = 'easy' | 'normal' | 'hard' | 'custom';

export const FLEET_DEFS = [
    { id: 'cruise', type: 'cruise', name: 'Grand Voyage', size: 4 },
    { id: 'sailboat', type: 'sailboat', name: 'Sunset Sailboat', size: 3 },
    { id: 'catamaran', type: 'catamaran', name: 'Adventure Catamaran', size: 2 },
    { id: 'island', type: 'island', name: 'Beacon Island', size: 1 },
];

export const DIFFICULTY_PRESETS: Record<Exclude<Difficulty, 'custom'>, { boardSize: number; shipIds: string[] }> = {
    easy: { boardSize: 6, shipIds: ['sailboat', 'catamaran', 'island'] },
    normal: { boardSize: 8, shipIds: ['cruise', 'sailboat', 'catamaran', 'island'] },
    hard: { boardSize: 10, shipIds: ['cruise', 'sailboat', 'catamaran', 'island'] },
};

/** A játék flottája (régi, flotta nélküli dokumentumoknál az alapértelmezett). */
export function gameFleet(game: any): any[] {
    return game?.fleet && game.fleet.length ? game.fleet : FLEET_DEFS;
}

export function gameBoardSize(game: any): number {
    return game?.boardSize || BOARD_SIZE;
}

/** Nehézség / egyéni beállítások feloldása és ellenőrzése. */
export function resolveConfig(input: { difficulty?: string; boardSize?: number; shipIds?: string[] }):
    { difficulty: Difficulty; boardSize: number; fleet: any[] } | { error: string } {
    const difficulty = (input.difficulty || 'normal') as Difficulty;
    let boardSize: number;
    let shipIds: string[];
    if (difficulty === 'custom') {
        boardSize = Number(input.boardSize);
        shipIds = Array.isArray(input.shipIds) ? input.shipIds : [];
    } else if (difficulty in DIFFICULTY_PRESETS) {
        ({ boardSize, shipIds } = DIFFICULTY_PRESETS[difficulty]);
    } else {
        return { error: 'Unknown difficulty.' };
    }
    if (!Number.isInteger(boardSize) || boardSize < MIN_BOARD || boardSize > MAX_BOARD) {
        return { error: `Board size must be between ${MIN_BOARD} and ${MAX_BOARD}.` };
    }
    const fleet = FLEET_DEFS.filter((d) => shipIds.includes(d.id));
    if (fleet.length === 0) return { error: 'Select at least one ship.' };
    const cells = fleet.reduce((a, d) => a + d.size, 0);
    if (cells > boardSize * boardSize * MAX_FILL) {
        return { error: 'Too many ships for this board size.' };
    }
    return { difficulty, boardSize, fleet };
}

/** Véletlenszerű, átfedésmentes flotta az adott táblán. */
export function generateRandomFleet(boardSize: number, fleet: any[]) {
    for (let round = 0; round < 50; round++) {
        const occupied = new Set<string>();
        const ships: any[] = [];
        let ok = true;
        for (const def of fleet) {
            let placed = false;
            for (let attempt = 0; attempt < 200 && !placed; attempt++) {
                const horizontal = Math.random() > 0.5;
                const startR = Math.floor(Math.random() * (horizontal ? boardSize : boardSize - def.size + 1));
                const startC = Math.floor(Math.random() * (horizontal ? boardSize - def.size + 1 : boardSize));
                const positions = Array.from({ length: def.size }, (_, i) => ({
                    r: horizontal ? startR : startR + i,
                    c: horizontal ? startC + i : startC,
                }));
                if (positions.some((p) => occupied.has(`${p.r},${p.c}`))) continue;
                positions.forEach((p) => occupied.add(`${p.r},${p.c}`));
                ships.push({ ...def, positions, hits: 0, sunk: false });
                placed = true;
            }
            if (!placed) { ok = false; break; }
        }
        if (ok) return ships;
    }
    throw new Error('Could not generate a fleet');
}

export function sanitizeGame(game: any, viewerId?: string | null) {
    const obj = game?.toObject ? game.toObject() : { ...game };
    const hide = (player: any) => {
        if (!player) return player;
        if (viewerId && player.id === viewerId) return player;
        return { ...player, ships: (player.ships || []).filter((s: any) => s.sunk) };
    };
    obj.player1 = hide(obj.player1);
    obj.player2 = hide(obj.player2);
    return obj;
}

/** Visszaadja a normalizált flottát, vagy hibaüzenetet (string), ha az elrendezés érvénytelen. */
export function validateFleet(input: any, boardSize: number = BOARD_SIZE, fleetDefs: any[] = FLEET_DEFS): { ships: any[] } | { error: string } {
    if (!Array.isArray(input) || input.length !== fleetDefs.length) {
        return { error: 'Invalid fleet: every ship must be placed.' };
    }
    const occupied = new Set<string>();
    const ships: any[] = [];
    for (const def of fleetDefs) {
        const ship = input.find((s: any) => s?.id === def.id);
        const pos = ship?.positions;
        if (!Array.isArray(pos) || pos.length !== def.size) {
            return { error: `Invalid placement for ${def.name}.` };
        }
        for (const p of pos) {
            if (!Number.isInteger(p?.r) || !Number.isInteger(p?.c) ||
                p.r < 0 || p.r >= boardSize || p.c < 0 || p.c >= boardSize) {
                return { error: `${def.name} is outside the board.` };
            }
            if (occupied.has(`${p.r},${p.c}`)) return { error: 'Ships must not overlap.' };
            occupied.add(`${p.r},${p.c}`);
        }
        const sameRow = pos.every((p: any) => p.r === pos[0].r);
        const sameCol = pos.every((p: any) => p.c === pos[0].c);
        const coords = pos.map((p: any) => (sameRow ? p.c : p.r)).sort((a: number, b: number) => a - b);
        const contiguous = coords.every((v: number, i: number) => i === 0 || v === coords[i - 1] + 1);
        if (!(sameRow || sameCol) || !contiguous) {
            return { error: `${def.name} must be a straight line.` };
        }
        ships.push({
            ...def,
            positions: pos.map((p: any) => ({ r: p.r, c: p.c })),
            hits: 0,
            sunk: false,
        });
    }
    return { ships };
}
