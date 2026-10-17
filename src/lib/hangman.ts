// Akasztófa (Secret Echo) közös szabályai és válasz-sanitizálás.
// A titkos szó csak a feladónak és a játék végén kerül ki a szerverről.

export const MAX_WORD_LENGTH = 60;
export const MAX_CATEGORY_LENGTH = 40;

/** Betű-e a karakter (a számok, írásjelek, szóköz eleve fel vannak fedve). */
export function isGuessableChar(ch: string): boolean {
    return /^\p{L}$/u.test(ch);
}

/** Szó normalizálása: felesleges szóközök törlése, nagybetűsítés. */
export function normalizeWord(raw: unknown): string {
    return String(raw ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
}

/** Tipp normalizálása: pontosan egy betű, különben null. */
export function normalizeLetter(raw: unknown): string | null {
    const s = String(raw ?? '').trim().toUpperCase();
    return Array.from(s).length === 1 && isGuessableChar(s) ? s : null;
}

export function isWordSolved(word: string, guessed: string[]): boolean {
    return Array.from(word).every((ch) => !isGuessableChar(ch) || guessed.includes(ch));
}

/** A szó rejtett alakja: nem talált betűk helyén '_'. */
export function maskWord(word: string, guessed: string[]): string {
    return Array.from(word)
        .map((ch) => (!isGuessableChar(ch) || guessed.includes(ch) ? ch : '_'))
        .join('');
}

/**
 * Kliensnek adható játékállapot. `word` csak a feladónak (viewerId egyezik) vagy lezárt játéknál.
 * A Pusher-broadcast viewerId nélkül megy, tehát soha nem tartalmazza a szót.
 */
export function sanitizeHangman(game: any, viewerId?: string | null) {
    const g = typeof game.toObject === 'function' ? game.toObject() : game;
    const over = g.status === 'won' || g.status === 'lost';
    const out: any = {
        _id: String(g._id),
        spaceId: g.spaceId,
        creatorId: g.creatorId,
        creatorName: g.creatorName,
        category: g.category,
        guessedLetters: g.guessedLetters || [],
        wrongGuesses: g.wrongGuesses || 0,
        maxAttempts: g.maxAttempts || 6,
        status: g.status,
        solo: !!g.solo,
        createdAt: g.createdAt,
        pattern: maskWord(g.word, g.guessedLetters || []),
    };
    if (over || (viewerId && viewerId === g.creatorId)) out.word = g.word;
    return out;
}
