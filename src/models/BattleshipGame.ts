import mongoose, { Schema, models, model } from 'mongoose';

const CoordinateSchema = new Schema({
    r: { type: Number, required: true },
    c: { type: Number, required: true },
}, { _id: false });

const ShipSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    positions: [CoordinateSchema],
    hits: { type: Number, default: 0 },
    sunk: { type: Boolean, default: false }
}, { _id: false });

const ShotSchema = new Schema({
    r: { type: Number, required: true },
    c: { type: Number, required: true },
    result: { type: String, enum: ['hit', 'miss', 'sunk'], required: true },
    shipId: { type: String, default: null }
}, { _id: false });

const PlayerSchema = new Schema({
    id: { type: String, default: null },
    name: { type: String, default: null },
    ready: { type: Boolean, default: false },
    ships: [ShipSchema]
}, { _id: false });

const BattleshipGameSchema = new Schema({
    spaceId: { type: String, required: true, index: true },
    creatorName: { type: String, required: true },
    isAiMode: { type: Boolean, default: false },
    player1: { type: PlayerSchema, required: true },
    player2: { type: PlayerSchema, default: null },
    boardSize: { type: Number, default: 8 },
    player1Shots: [ShotSchema],
    player2Shots: [ShotSchema],
    turn: { type: String, default: null },
    status: {
        type: String,
        enum: ['setup', 'playing', 'won'],
        default: 'setup'
    },
    winner: { type: String, default: null },
    unlockedMemories: [{ type: Schema.Types.Mixed }]
}, { timestamps: true });

export const BattleshipGame = models.BattleshipGame || model('BattleshipGame', BattleshipGameSchema);
