import { withAuth } from "../../helpers/withAuth";
import { runPreDeploymentChecks } from "../../helpers/deploymentAutomationServer";
import { OutputType } from "./pre-deploy-checks_POST.schema";
import { User } from "../../helpers/User";
import superjson from "superjson";

async function handler(request: Request, user: User): Promise<Response> {
  if (user.role !== "admin") {
    return new Response(
      superjson.stringify({ error: "Forbidden: Access is restricted to administrators." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`[Pre-Deploy Checks] Triggered by admin user: ${user.email} (${user.uuid})`);
    const results = await runPreDeploymentChecks();
    
    // The status code should reflect the success of the API call itself,
    // not the outcome of the checks. The frontend will interpret the payload.
    return new Response(superjson.stringify(results satisfies OutputType), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
    console.error("[Pre-Deploy Checks] A critical error occurred while running checks via endpoint:", error);
    
    return new Response(
      superjson.stringify({ 
        overallSuccess: false,
        message: `Critical failure during check execution: ${errorMessage}`,
        checkResults: [],
      } satisfies OutputType),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const handle = withAuth(handler);