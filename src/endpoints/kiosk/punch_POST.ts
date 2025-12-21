import { handle as handleTimeclockPunch } from '../timeclock/punch_POST';

/**
 * Handles kiosk punch requests by delegating to the main timeclock punch endpoint.
 * This serves as an alias, ensuring consistent logic while providing a kiosk-specific API route.
 * @param request The incoming HTTP request.
 * @returns A Response object from the timeclock punch handler.
 */
export async function handle(request: Request): Promise<Response> {
  // Delegate directly to the existing timeclock punch handler
  return handleTimeclockPunch(request);
}