/**
 * Elastic APM — must load before any other application modules.
 * Loads dotenv here so ELASTIC_APM_* vars are available before apm.start().
 */
import "dotenv/config";
import apm from "elastic-apm-node";

function isApmExplicitlyDisabled(): boolean {
  return process.env.ELASTIC_APM_ACTIVE === "false";
}

function isApmExplicitlyEnabled(): boolean {
  return process.env.ELASTIC_APM_ACTIVE === "true";
}

function hasApmAuth(): boolean {
  const token = process.env.ELASTIC_APM_SECRET_TOKEN?.trim() ?? "";
  const apiKey = process.env.ELASTIC_APM_API_KEY?.trim() ?? "";
  return token.length > 0 || apiKey.length > 0;
}

function resolveApmServerUrl(): string {
  return process.env.ELASTIC_APM_SERVER_URL?.trim() ?? "";
}

/**
 * Agent starts only when SERVER_URL + auth are set (avoids failed sends in local dev).
 * NODE_ENV=test and ELASTIC_APM_ACTIVE=false always disable the agent.
 */
function shouldStartApm(): boolean {
  if (process.env.NODE_ENV === "test" || isApmExplicitlyDisabled()) {
    return false;
  }
  const serverUrl = resolveApmServerUrl();
  const authOk = hasApmAuth();
  if (isApmExplicitlyEnabled() && (!serverUrl || !authOk)) {
    console.warn(
      "[apm] ELASTIC_APM_ACTIVE=true but ELASTIC_APM_SERVER_URL and auth (SECRET_TOKEN or API_KEY) are required; agent not started.",
    );
  }
  return Boolean(serverUrl && authOk);
}

if (shouldStartApm()) {
  const serverUrl = resolveApmServerUrl();
  const secretToken = process.env.ELASTIC_APM_SECRET_TOKEN?.trim();
  const apiKey = process.env.ELASTIC_APM_API_KEY?.trim();

  apm.start({
    serviceName: process.env.ELASTIC_APM_SERVICE_NAME?.trim() || "photorev-api",
    serverUrl,
    ...(secretToken ? { secretToken } : {}),
    ...(apiKey ? { apiKey } : {}),
    environment:
      process.env.ELASTIC_APM_ENVIRONMENT?.trim() ||
      process.env.NODE_ENV ||
      "development",
    active: true,
    captureBody: "off",
    transactionIgnoreUrls: ["/health", "/health/*"],
    usePathAsTransactionName: true,
  });
}

export default apm;
