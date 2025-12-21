import { db } from "../../../helpers/db";
import { type OutputType, schema } from "./list_GET.schema";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import superjson from 'superjson';
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== 'admin') {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Manually convert types for zod parsing from URLSearchParams
    const parsedParams = {
      ...queryParams,
      page: queryParams.page ? parseInt(queryParams.page, 10) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : undefined,
      isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined,
    };

    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'name', 
      sortDirection = 'asc',
      name,
      code,
      locationType,
      isActive
    } = schema.parse(parsedParams);

    const offset = (page - 1) * limit;

    let query = db.selectFrom('locations');
    let countQuery = db.selectFrom('locations').select(db.fn.count('id').as('total'));

    if (name) {
      query = query.where('name', 'ilike', `%${name}%`);
      countQuery = countQuery.where('name', 'ilike', `%${name}%`);
    }
    if (code) {
      query = query.where('code', 'ilike', `%${code}%`);
      countQuery = countQuery.where('code', 'ilike', `%${code}%`);
    }
    if (locationType) {
      query = query.where('locationType', '=', locationType);
      countQuery = countQuery.where('locationType', '=', locationType);
    }
    if (isActive !== undefined) {
      query = query.where('isActive', '=', isActive);
      countQuery = countQuery.where('isActive', '=', isActive);
    }

    const locations = await query
      .selectAll()
      .orderBy(sortBy, sortDirection)
      .limit(limit)
      .offset(offset)
      .execute();

    const totalResult = await countQuery.executeTakeFirstOrThrow();
    const total = Number(totalResult.total);

    const response: OutputType = {
      locations,
      total,
      page,
      limit,
    };

    return new Response(superjson.stringify(response));

  } catch (error) {
    console.error("Error fetching inventory locations:", error);
    if (error instanceof ZodError) {
      return new Response(superjson.stringify({ error: "Invalid query parameters", details: error.errors }), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: `Failed to fetch inventory locations: ${errorMessage}` }), { status: 500 });
  }
}