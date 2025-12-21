import { z } from "zod";
import superjson from "superjson";
import { withAuth } from "../../helpers/withAuth";
import { db } from "../../helpers/db";
import { schema, OutputType } from "./cash-report_GET.schema";
import { sql } from "kysely";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export const handle = withAuth(async (request: Request) => {
  try {
    const url = new URL(request.url);
    const queryParams = {
      sessionId: url.searchParams.get("sessionId") || undefined,
      date: url.searchParams.get("date") || undefined,
    };

    const input = schema.parse(queryParams);

    if (input.sessionId) {
      // Single session implementation with direct logic
      const session = await db
        .selectFrom("cashSessions")
        .select(["id", "openedAt", "closedAt", "openingAmount", "closingAmount"])
        .where("id", "=", input.sessionId)
        .executeTakeFirst();

      if (!session) {
        return new Response(
          superjson.stringify({ error: "Session not found" }),
          { status: 404 }
        );
      }

      // 1. Calculate session date ranges
      const sessionStart = new Date(session.openedAt);
      const sessionEnd = session.closedAt 
        ? new Date(session.closedAt) 
        : new Date();

      // 2. Calculate transaction totals with specific query
      const transactionTotals = await db
        .selectFrom("transactions")
        .leftJoin("payments", "payments.transactionId", "transactions.id")
        .select([
          sql<string>`COUNT(DISTINCT transactions.id)`.as("totalTransactions"),
          sql<string>`SUM(transactions.total_amount)`.as("totalSales"),
          sql<string>`SUM(CASE WHEN payments.method = 'cash' THEN payments.amount ELSE 0 END)`.as("totalCash"),
          sql<string>`SUM(CASE WHEN payments.method = 'card' THEN payments.amount ELSE 0 END)`.as("totalCard"),
        ])
        .where("transactions.createdAt", ">=", sessionStart)
        .where("transactions.createdAt", "<=", sessionEnd)
        .executeTakeFirst();

      // 3. Calculate cash movements with specific query
      const cashMovements = await db
        .selectFrom("cashMovements")
        .select([
          sql<string>`SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END)`.as("movementsIn"),
          sql<string>`SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END)`.as("movementsOut"),
        ])
        .where("sessionId", "=", input.sessionId)
        .executeTakeFirst();

      // Rename variables to match the provided code
      const transactionStats = transactionTotals;
      const movements = cashMovements;

      const openingAmount = Number(session.openingAmount || 0);
      const closingAmount = session.closingAmount 
        ? Number(session.closingAmount) 
        : null;

      const totalSales = Number(transactionStats?.totalSales || 0);
      const totalCash = Number(transactionStats?.totalCash || 0);
      const totalCard = Number(transactionStats?.totalCard || 0);
      const totalTransactions = Number(transactionStats?.totalTransactions || 0);

      const movementsIn = Number(movements?.movementsIn || 0);
      const movementsOut = Number(movements?.movementsOut || 0);

      const expectedCash = openingAmount + totalCash + movementsIn - movementsOut;
      const difference = closingAmount !== null 
        ? closingAmount - expectedCash 
        : null;

      const report: OutputType = {
        sessionId: session.id,
        openedAt: new Date(session.openedAt),
        closedAt: session.closedAt ? new Date(session.closedAt) : null,
        openingAmount,
        closingAmount,
        expectedCash,
        actualCash: closingAmount,
        difference,
        totalSales,
        totalCash,
        totalCard,
        totalTransactions,
        movementsIn,
        movementsOut,
      };

      return new Response(superjson.stringify(report), { status: 200 });
    } else {
      // Date-based aggregated report logic (unchanged)
      const targetDate = input.date ? parseISO(input.date) : new Date();
      const startDate = startOfDay(targetDate);
      const endDate = endOfDay(targetDate);

      const sessions = await db
        .selectFrom("cashSessions")
        .select(["id", "openedAt", "closedAt"])
        .where("openedAt", ">=", startDate)
        .where("openedAt", "<=", endDate)
        .orderBy("openedAt", "asc")
        .execute();

      if (sessions.length === 0) {
        return new Response(
          superjson.stringify({ error: "No sessions found for the specified date" }),
          { status: 404 }
        );
      }

      const sessionIds = sessions.map((s) => s.id);
      const openedAt = sessions[0].openedAt;
      const lastSession = sessions[sessions.length - 1];
      const closedAt = sessions.every(s => s.closedAt) ? lastSession.closedAt : null;

      if (!openedAt) {
        return new Response(
          superjson.stringify({ error: "Could not determine session start time." }),
          { status: 400 }
        );
      }

      const timeRangeEnd = closedAt ?? new Date();

      // Get aggregated session data
      const sessionData = await db
        .selectFrom("cashSessions")
        .select([
          db.fn.sum("openingAmount").as("openingAmount"),
          db.fn.sum("closingAmount").as("closingAmount"),
        ])
        .where("id", "in", sessionIds)
        .executeTakeFirst();

      // Get transaction and payment data
      const transactionData = await db
        .selectFrom("transactions")
        .leftJoin("payments", "payments.transactionId", "transactions.id")
        .select([
          sql<string>`COUNT(DISTINCT transactions.id)`.as("totalTransactions"),
          sql<string>`SUM(transactions.total_amount)`.as("totalSales"),
          sql<string>`SUM(CASE WHEN payments.method = 'cash' THEN payments.amount ELSE 0 END)`.as("totalCash"),
          sql<string>`SUM(CASE WHEN payments.method = 'card' THEN payments.amount ELSE 0 END)`.as("totalCard"),
        ])
        .where("transactions.createdAt", ">=", openedAt)
        .where("transactions.createdAt", "<=", timeRangeEnd)
        .executeTakeFirst();

      // Get cash movements data
      const movementsData = await db
        .selectFrom("cashMovements")
        .select([
          sql<string>`SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END)`.as("movementsIn"),
          sql<string>`SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END)`.as("movementsOut"),
        ])
        .where("sessionId", "in", sessionIds)
        .executeTakeFirst();

      const openingAmount = Number(sessionData?.openingAmount || 0);
      const closingAmount = sessionData?.closingAmount ? Number(sessionData.closingAmount) : null;
      const totalSales = Number(transactionData?.totalSales || 0);
      const totalCash = Number(transactionData?.totalCash || 0);
      const totalCard = Number(transactionData?.totalCard || 0);
      const totalTransactions = parseInt(transactionData?.totalTransactions || "0", 10);
      const movementsIn = Number(movementsData?.movementsIn || 0);
      const movementsOut = Number(movementsData?.movementsOut || 0);

      const expectedCash = openingAmount + totalCash + movementsIn - movementsOut;
      const actualCash = closingAmount;
      const difference = actualCash !== null ? actualCash - expectedCash : null;

      const report: OutputType = {
        date: input.date,
        reportGeneratedAt: new Date(),
        period: {
          start: openedAt,
          end: closedAt,
        },
        openingAmount,
        closingAmount,
        totalSales,
        totalCash,
        totalCard,
        totalTransactions,
        movementsIn,
        movementsOut,
        expectedCash,
        actualCash,
        difference,
      };

      return new Response(superjson.stringify(report), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error('Error generating cash report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      superjson.stringify({ error: `Failed to generate report: ${errorMessage}` }),
      { status: 500 }
    );
  }
});