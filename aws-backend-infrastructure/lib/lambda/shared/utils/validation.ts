/**
 * Validation Utilities
 * Provides common validation functions for input data
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate coordinates (latitude and longitude)
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

/**
 * Validate latitude
 */
export function isValidLatitude(latitude: number): boolean {
    return typeof latitude === 'number' && latitude >= -90 && latitude <= 90;
}

/**
 * Validate longitude
 */
export function isValidLongitude(longitude: number): boolean {
    return typeof longitude === 'number' && longitude >= -180 && longitude <= 180;
}

/**
 * Validate file type by extension
 */
export function isValidFileType(
    fileName: string,
    allowedExtensions: string[]
): boolean {
    const extension = fileName.toLowerCase().split('.').pop();
    return extension ? allowedExtensions.includes(extension) : false;
}

/**
 * Validate image file type
 */
export function isValidImageType(fileName: string): boolean {
    return isValidFileType(fileName, ['jpg', 'jpeg', 'png', 'heic', 'webp']);
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(
    fileSize: number,
    maxSizeInMB: number = 10
): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return fileSize > 0 && fileSize <= maxSizeInBytes;
}

/**
 * Validate UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validate phone number (basic international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validate password strength
 * Requirements: min 8 chars, uppercase, lowercase, number, special char
 */
export function isValidPassword(password: string): boolean {
    if (password.length < 8) return false;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields(
    obj: Record<string, any>,
    requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter(
        (field) => obj[field] === undefined || obj[field] === null || obj[field] === ''
    );

    return {
        valid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Validate string length
 */
export function isValidStringLength(
    str: string,
    minLength: number = 0,
    maxLength: number = Infinity
): boolean {
    return str.length >= minLength && str.length <= maxLength;
}

/**
 * Validate number range
 */
export function isValidNumberRange(
    num: number,
    min: number = -Infinity,
    max: number = Infinity
): boolean {
    return typeof num === 'number' && num >= min && num <= max;
}

/**
 * Validate array length
 */
export function isValidArrayLength(
    arr: any[],
    minLength: number = 0,
    maxLength: number = Infinity
): boolean {
    return Array.isArray(arr) && arr.length >= minLength && arr.length <= maxLength;
}

/**
 * Sanitize string (remove potentially dangerous characters)
 */
export function sanitizeString(str: string): string {
    return str
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Validate ISO 8601 date string
 */
export function isValidISODate(dateString: string): boolean {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoDateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
