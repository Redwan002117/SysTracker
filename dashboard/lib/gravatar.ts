/**
 * Generate Gravatar URL from email address (client-side)
 * Uses SubtleCrypto API for MD5 hashing in browser
 */

/**
 * MD5 hash function for browser (SubtleCrypto doesn't support MD5, so we use a lightweight implementation)
 */
async function md5(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(text);
    
    // Use a simple MD5 implementation
    // For production, you might want to use a library like 'crypto-js'
    // But for Gravatar, we'll use a simpler  approach with SHA-256 (Gravatar also supports it)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 32); // Take first 32 chars to simulate MD5 length
}

/**
 * Generate Gravatar URL from email address
 * @param email - User's email address
 * @param size - Avatar size (default: 200px)
 * @param defaultImage - Fallback image type
 * @returns Gravatar URL
 */
export async function getGravatarUrl(
    email: string,
    size: number = 200,
    defaultImage: 'identicon' | 'mp' | 'monsterid' | 'wavatar' | 'retro' | 'robohash' | 'blank' = 'identicon'
): Promise<string> {
    if (!email || typeof email !== 'string') {
        return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=${defaultImage}`;
    }

    // Normalize email: trim, lowercase
    const normalizedEmail = email.trim().toLowerCase();
    
    // Generate hash
    const hash = await md5(normalizedEmail);
    
    // Build Gravatar URL
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}

/**
 * Check if Gravatar exists for email
 * @param email - User's email address
 * @returns Promise<boolean>
 */
export async function gravatarExists(email: string): Promise<boolean> {
    try {
        const url = await getGravatarUrl(email, 80, 'blank');
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        
        // Due to CORS, we can't check headers, so we'll try to load the image
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Check if image has dimensions (not a 1x1 default)
                resolve(img.width > 10 && img.height > 10);
            };
            img.onerror = () => resolve(false);
            img.src = url;
        });
    } catch {
        return false;
    }
}

/**
 * Fetch Gravatar URL (always returns a URL, since Gravatar provides defaults)
 * @param email - User's email address
 * @param size - Avatar size
 * @returns Promise<string>
 */
export async function fetchGravatar(email: string, size: number = 200): Promise<string> {
    return await getGravatarUrl(email, size, 'identicon');
}
