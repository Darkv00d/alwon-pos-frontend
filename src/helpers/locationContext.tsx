import { getServerUserSession } from "./getServerUserSession";
import { db } from "./db";
import { Selectable } from "kysely";
import { Employees } from "./schema";

type UserWithLocation = {
  uuid: string;
  defaultLocationId: number | null;
  // In a real app, this would come from roles/permissions
  accessibleLocationIds: number[];
};

/**
 * Represents the location context for a given request.
 * Provides methods to access location IDs for read/write operations
 * and to validate user access.
 */
export class LocationContext {
  private readLocationIds: number[] | null; // null means all accessible locations
  private writeLocationId: number | null;
  private user: UserWithLocation;

  private constructor(
    user: UserWithLocation,
    readLocationIds: number[] | null,
    writeLocationId: number | null
  ) {
    this.user = user;
    this.readLocationIds = readLocationIds;
    this.writeLocationId = writeLocationId;
  }

  /**
   * Parses a comma-separated string of numbers into an array of unique, positive integers.
   * @param value The string to parse.
   * @returns An array of numbers.
   */
  private static parseNumericArray(value: string | null): number[] {
    if (!value) {
      return [];
    }
    return [
      ...new Set(
        value
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id) && id > 0)
      ),
    ];
  }

  /**
   * Parses a single numeric string into a number.
   * @param value The string to parse.
   * @returns A number or null if invalid.
   */
  private static parseSingleNumeric(value: string | null): number | null {
    if (!value) {
      return null;
    }
    const id = parseInt(value.trim(), 10);
    return !isNaN(id) && id > 0 ? id : null;
  }

  /**
   * Factory function to create and initialize a LocationContext from a Request.
   * It handles parsing headers and query parameters, and falls back to user defaults.
   *
   * @param request The incoming Request object.
   * @returns A promise that resolves to a LocationContext instance.
   * @throws An error if the user session is invalid.
   */
  public static async fromRequest(
    request: Request
  ): Promise<LocationContext> {
    const userSession = await getServerUserSession(request);
    if (!userSession) {
      // This should ideally be handled by middleware, but we fail loudly here.
      throw new Error("Authentication required: No valid user session found.");
    }

    const sessionUser = userSession.user;

    // Fetch defaultLocationId from employees table if needed
    let defaultLocationId: number | null = null;
    try {
      const employee = await db
        .selectFrom("employees")
        .select("defaultLocationId")
        .where("uuid", "=", sessionUser.uuid)
        .limit(1)
        .executeTakeFirst();
      
      defaultLocationId = employee?.defaultLocationId ?? null;
    } catch (error) {
      console.error("Error fetching employee default location:", error);
      // Continue without defaultLocationId - will be handled later
    }

    // In a real application, accessible locations would be derived from the user's role and permissions.
    // For this implementation, we'll assume an admin can access all locations, and other users
    // are restricted to their default location.
    let accessibleLocationIds: number[] = [];
    if (sessionUser.role === "admin") {
      const allLocations = await db.selectFrom("locations").select("id").execute();
      accessibleLocationIds = allLocations.map(l => l.id);
    } else if (defaultLocationId) {
      accessibleLocationIds = [defaultLocationId];
    }

    const user: UserWithLocation = {
      uuid: sessionUser.uuid,
      defaultLocationId,
      accessibleLocationIds,
    };

    const url = new URL(request.url);

    // Parse read locations (multi-ID)
    const readHeader = request.headers.get("X-Location-Ids");
    const readQuery = url.searchParams.get("locationIds");
    const parsedReadIds = this.parseNumericArray(readHeader || readQuery);
    const readLocationIds = parsedReadIds.length > 0 ? parsedReadIds : null;

    // Parse write location (single-ID)
    const writeHeader = request.headers.get("X-Location-Id");
    const writeQuery = url.searchParams.get("locationId");
    const writeLocationId = this.parseSingleNumeric(writeHeader || writeQuery);

    return new LocationContext(user, readLocationIds, writeLocationId);
  }

  /**
   * Gets the location IDs to be used for read operations (e.g., GET requests).
   *
   * - If specific location IDs were provided in the request, it returns those.
   * - If no IDs were provided, it returns null, signifying that queries should
   *   use all locations the user has access to.
   *
   * @returns An array of location IDs, or null for all accessible locations.
   */
  public getLocationIds(): number[] | null {
    return this.readLocationIds;
  }

  /**
   * Gets the single location ID to be used for write operations (e.g., POST, PUT).
   *
   * - If a specific location ID was provided in the request, it returns that ID.
   * - If no ID was provided, it falls back to the user's default location ID.
   *
   * @returns A single location ID, or null if none could be determined.
   */
  public getWriteLocationId(): number | null {
    return this.writeLocationId ?? this.user.defaultLocationId;
  }

  /**
   * Validates that the user has access to the locations specified for the operation.
   * This should be called within endpoints before performing database operations.
   *
   * @param type The type of operation, 'read' or 'write'.
   * @throws An error if the user does not have access to any of the required locations.
   */
  public validateLocationAccess(type: "read" | "write"): void {
    const userLocations = new Set(this.user.accessibleLocationIds);

    if (type === "write") {
      const writeId = this.getWriteLocationId();
      if (writeId === null) {
        throw new Error(
          "Forbidden: A location ID is required for this operation, and no default is set."
        );
      }
      if (!userLocations.has(writeId)) {
        console.error(`User ${this.user.uuid} attempted to write to unauthorized location ${writeId}.`);
        throw new Error(
          `Forbidden: You do not have permission to access location ${writeId}.`
        );
      }
    } else { // 'read'
      const readIds = this.getLocationIds();
      if (readIds) { // If specific locations are requested
        for (const id of readIds) {
          if (!userLocations.has(id)) {
            console.error(`User ${this.user.uuid} attempted to read from unauthorized location ${id}.`);
            throw new Error(
              `Forbidden: You do not have permission to access location ${id}.`
            );
          }
        }
      }
      // If readIds is null, it means "all accessible locations", which requires no specific validation
      // as the query itself should be constrained by `user.accessibleLocationIds`.
    }
  }

  /**
   * Returns the full list of location IDs the user is permitted to access.
   * Useful for constraining database queries when no specific locations are requested.
   *
   * @returns An array of all location IDs accessible by the user.
   */
  public getAccessibleLocationIds(): number[] {
    return this.user.accessibleLocationIds;
  }
}