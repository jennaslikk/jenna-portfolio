import { compare, hash } from 'bcryptjs';

export function normaliseUsername(value) {
 return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function validUsername(value) {
 return /^[a-z0-9_-]{3,40}$/.test(value);
}

export function validPassword(value) {
 // bcrypt ignores bytes after 72; reject long input rather than silently truncating it.
 return typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72;
}

export function hashPassword(password) {
 return hash(password, 12);
}

export function verifyPassword(password, passwordHash) {
 return compare(password, passwordHash);
}
