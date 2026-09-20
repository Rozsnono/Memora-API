/**
 * ==============================================================================
 * Dedicated Storage API Helper (Synology NAS WebDAV Chunked Uploader)
 * ==============================================================================
 */

export function getStorageApiUrl(): string {
    let url =
        process.env.UPLOAD_API_URL ||
        process.env.NEXT_PUBLIC_UPLOAD_API_URL ||
        'https://api.filesharer.rozsnorbert.hu:9443';
    url = url.trim().replace(/\/+$/, '');
    return url;
}

export function getStorageApiKey(): string {
    return (
        process.env.UPLOAD_API_KEY ||
        process.env.NEXT_PUBLIC_UPLOAD_API_KEY ||
        ''
    );
}

export interface DirectDownloadOptions {
    inline?: boolean;
    apiKey?: string;
}

/**
 * Generates direct download / inline image viewing URL from the Synology NAS WebDAV path.
 */
export function buildDirectDownloadUrl(
    webdavPath: string,
    options: DirectDownloadOptions = {}
): string {
    const baseUrl = getStorageApiUrl();
    const key = options.apiKey || getStorageApiKey();

    const url = new URL('/download', baseUrl);
    url.searchParams.set('path', webdavPath);

    if (key) {
        url.searchParams.set('apiKey', key);
    }

    if (options.inline) {
        url.searchParams.set('inline', 'true');
    }

    return url.toString();
}
