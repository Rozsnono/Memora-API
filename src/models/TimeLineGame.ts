import mongoose, { Schema, models, model } from 'mongoose';

/**
 * Idővonal (Timeliner) játék. A `photos` a helyes dátumokat is tartalmazza,
 * de a kliensnek küldött válaszból a dátum kimarad (lásd lib/timeline.ts),
 * amíg a játék meg nem nyerődik. Az `order` a közösen alakított aktuális sorrend.
 */
const TimelineGameSchema = new Schema({
    spaceId: { type: String, required: true },
    hostId: { type: String, required: true },
    creatorId: { type: String },
    creatorName: { type: String, required: true },
    photos: [{
        id: String,
        url: String,
        date: Date,
        title: String
    }],
    // Fotó-azonosítók aktuális sorrendben (közös, szinkronizált állapot)
    order: [String],
    moves: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    wonBy: { type: String },
    status: { type: String, enum: ['playing', 'won'], default: 'playing' }
}, { timestamps: true });

export const TimelineGame = models.TimelineGame || model('TimelineGame', TimelineGameSchema);
