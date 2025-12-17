
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

// Use a fallback key for development if env is missing (DO NOT USE IN PRODUCTION without env)
// The key must be 32 bytes (64 hex characters)
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') 
    : Buffer.from('ac001b45d1039b146c38e722b24bfc32cc5f05386a7cce3b99675c405f3f0a07', 'hex'); // Default for now to ensure it works immediately

const IV_LENGTH = 16; // AES block size

/**
 * Encrypts a buffer and returns the encrypted buffer with IV prepended
 */
export function encryptBuffer(buffer: Buffer): Buffer {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return Buffer.concat([iv, encrypted]);
}

/**
 * Decrypts a buffer (expects IV prepended)
 */
export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
    const iv = encryptedBuffer.subarray(0, IV_LENGTH);
    const encryptedText = encryptedBuffer.subarray(IV_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]);
}

/**
 * Encrypts a file stream from source to destination
 */
export async function encryptFile(sourcePath: string, destPath: string): Promise<void> {
    await mkdir(dirname(destPath), { recursive: true });
    
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    const input = createReadStream(sourcePath);
    const output = createWriteStream(destPath);
    
    // Write IV first
    output.write(iv);
    
    await pipeline(input, cipher, output);
}

/**
 * Decrypts a file stream and returns a readable stream
 * This is useful for streaming the response to the user
 */
export async function getDecryptedStream(encryptedFilePath: string) {
    // We need to read the IV first
    const { open } = await import('fs/promises');
    const handle = await open(encryptedFilePath, 'r');
    
    const ivBuffer = Buffer.alloc(IV_LENGTH);
    await handle.read(ivBuffer, 0, IV_LENGTH, 0);
    await handle.close();
    
    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, ivBuffer);
    
    const input = createReadStream(encryptedFilePath, { start: IV_LENGTH }); // Skip IV
    
    // Return the piped stream? No, pipeline is for writing to a destination.
    // We want a readable stream.
    // We can just pipe the input through the decipher.
    return input.pipe(decipher);
}
