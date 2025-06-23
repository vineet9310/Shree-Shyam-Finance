import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

/**
 * Extracts the user ID from the JWT in the request cookies.
 * This is a regular synchronous utility function.
 * @param request - The NextRequest object from an API route or middleware.
 * @returns The user ID string from the token's payload.
 * @throws An error if the token is missing, invalid, or expired.
 */
export function getUserIdFromToken(request: NextRequest): string {
    try {
        // 1. Get the token from the 'token' cookie.
        const token = request.cookies.get('token')?.value;
        if (!token) {
            throw new Error('Authentication token not found. Please log in.');
        }

        // 2. Verify the token is valid and not expired.
        const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);
        const userId = decodedToken.id;

        // 3. Ensure the token's payload contains the user ID.
        if (!userId) {
            throw new Error('Authentication failed. User ID not found in token.');
        }

        return userId;
    } catch (error: any) {
        // Provide user-friendly messages for common token errors.
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new Error('Your session has expired. Please log in again.');
        }
        // Re-throw any other unexpected errors.
        throw error;
    }
}
