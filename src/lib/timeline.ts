/**
 * Idővonal játék tiszta logikája (szerver oldal, DB nélkül tesztelhető).
 */

export interface TimelinePhoto {
    id: string;
    url: string;
    date: Date | string;
    title: string;
}

export const TIMELINE_MIN_PHOTOS = 3;
export const TIMELINE_ROUND_SIZE = 5;

/** Fisher–Yates keverés (új tömböt ad vissza). */
export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Keverés, amely nem adhat vissza már helyes sorrendet (ha van értelme). */
export function shuffleUnsolved(photos: TimelinePhoto[], rnd: () => number = Math.random): TimelinePhoto[] {
    if (photos.length < 2) return [...photos];
    for (let i = 0; i < 20; i++) {
        const s = shuffle(photos, rnd);
        if (!isChronological(s.map(p => p.id), photos)) return s;
    }
    return [...photos].reverse();
}

const time = (p: TimelinePhoto) => new Date(p.date).getTime();

/** Érvényes sorrend-e: pontosan a játék fotóinak azonosítói, ismétlés nélkül. */
export function isValidOrder(order: unknown, photos: TimelinePhoto[]): order is string[] {
    if (!Array.isArray(order) || order.length !== photos.length) return false;
    const ids = new Set(photos.map(p => String(p.id)));
    const seen = new Set<string>();
    for (const id of order) {
        if (typeof id !== 'string' || !ids.has(id) || seen.has(id)) return false;
        seen.add(id);
    }
    return true;
}

/** Időrendben (legrégebbi → legújabb) van-e; azonos dátumú fotók felcserélhetők. */
export function isChronological(order: string[], photos: TimelinePhoto[]): boolean {
    const byId = new Map(photos.map(p => [String(p.id), p]));
    for (let i = 1; i < order.length; i++) {
        const a = byId.get(order[i - 1]);
        const b = byId.get(order[i]);
        if (!a || !b || time(a) > time(b)) return false;
    }
    return true;
}

/** Hány elem áll már a helyes (dátum szerinti) helyén. */
export function countCorrect(order: string[], photos: TimelinePhoto[]): number {
    const sorted = [...photos].sort((a, b) => time(a) - time(b));
    const byId = new Map(photos.map(p => [String(p.id), p]));
    let n = 0;
    order.forEach((id, i) => {
        const p = byId.get(id);
        if (p && sorted[i] && time(p) === time(sorted[i])) n++;
    });
    return n;
}

/** A tárolt sorrend alkalmazása a fotókra (hiányos/hibás sorrend esetén az eredeti). */
export function applyOrder(photos: TimelinePhoto[], order?: string[]): TimelinePhoto[] {
    if (!isValidOrder(order, photos)) return photos;
    const byId = new Map(photos.map(p => [String(p.id), p]));
    return order.map(id => byId.get(id)!);
}

/** Kliensnek küldhető nézet: dátum csak megnyert játéknál látszik. */
export function sanitizeTimeline(game: any) {
    const doc = typeof game.toObject === 'function' ? game.toObject() : game;
    const won = doc.status === 'won';
    const photos = applyOrder(
        (doc.photos || []).map((p: any) => ({ id: String(p.id), url: p.url, date: p.date, title: p.title })),
        doc.order
    ).map(p => (won ? p : { id: p.id, url: p.url, title: p.title }));
    return {
        _id: String(doc._id),
        spaceId: doc.spaceId,
        creatorId: doc.creatorId || doc.hostId,
        creatorName: doc.creatorName,
        status: doc.status,
        moves: doc.moves || 0,
        attempts: doc.attempts || 0,
        wonBy: doc.wonBy,
        photos,
    };
}
