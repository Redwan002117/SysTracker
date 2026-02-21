import crypto from 'crypto';

/**
 * Generate Gravatar URL from email address
 * @param email - User's email address
 * @param size - Avatar size (default: 200px)
 * @param defaultImage - Fallback image type (default: 'identicon')
 * @returns Gravatar URL
 */
export function getGravatarUrl(
    email: string, 
    size: number = 200, 
    defaultImage: 'identicon' |'mp' | 'monsterid' | 'wavatar' | 'retro' | 'robohash' | 'blank' = 'identicon'
): string {
    if (!email || typeof email !== 'string') {
        return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=${defaultImage}`;
    }

    // Normalize email: trim, lowercase
    const normalizedEmail = email.trim().toLowerCase();
    
    // Generate MD5 hash
    const hash = crypto
        .createHash('md5')
        .update(normalizedEmail)
        .digest('hex');
    
    // Build Gravatar URL
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}

/**
 * Check if Gravatar exists for email (returns true if exists, false if using default)
 * @param email - User's email address
 * @returns Promise<boolean>
 */
export async function gravatarExists(email: string): Promise<boolean> {
    try {
        const url = getGravatarUrl(email, 200, 'blank');
        const response = await fetch(url, { method: 'HEAD' });
        
        // If content-length is small, it's likely the default blank image
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength) > 100 : false;
    } catch {
        return false;
    }
}

/**
 * Fetch Gravatar URL with existence check
 * Returns Gravatar URL if it exists, null otherwise
 * @param email - User's email address
 * @param size - Avatar size
 * @returns Promise<string | null>
 */
export async function fetchGravatar(email: string, size: number = 200): Promise<string | null> {
    const gravatarUrl = getGravatarUrl(email, size);
    const exists = await gravatarExists(email);
    return exists ? gravatarUrl : null;
}
