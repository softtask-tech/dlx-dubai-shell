/**
 * The server function the forms call.
 *
 * Kept apart from `leads.server.ts` so the heavy lifting stays server-only:
 * this module is reachable from the client bundle, but everything it touches on
 * the server is behind a dynamic import.
 */
import { createServerFn } from "@tanstack/react-start";

import { leadSubmissionSchema, type LeadSubmissionResult } from "./leads.server";

/**
 * Accepts an enquiry from any form on the site, scores it, stores it and
 * triggers the two emails. Validation runs again server-side, the client's
 * validation is a courtesy, not a guarantee.
 */
export const submitLeadFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSubmissionSchema.parse(data))
  .handler(async ({ data }): Promise<LeadSubmissionResult> => {
    const { submitLead } = await import("./leads.server");
    return submitLead(data);
  });
