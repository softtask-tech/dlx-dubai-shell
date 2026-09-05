import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { canRenderDemoProjects } from "./demo-host";

function requestHostnames(headers: Headers | Record<string, string | undefined>): {
  hostname: string;
  forwardedHostname: string;
} {
  if (headers instanceof Headers) {
    return {
      hostname: headers.get("host") ?? "",
      forwardedHostname: headers.get("x-forwarded-host") ?? "",
    };
  }
  return {
    hostname: headers["host"] ?? "",
    forwardedHostname: headers["x-forwarded-host"] ?? "",
  };
}

/**
 * Resolve preview access on the server for every route navigation. The public
 * production host is denied even if the build was accidentally given the flag.
 */
export const getDemoProjectAccessFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    try {
      const headers = getRequestHeaders();
      return canRenderDemoProjects({
        flag: import.meta.env["VITE_ENABLE_DEMO_PROJECTS"],
        ...requestHostnames(headers),
      });
    } catch {
      return false;
    }
  },
);
