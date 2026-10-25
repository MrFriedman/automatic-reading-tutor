/**
 * Demo mode is the default front-end-only deployment.
 * Set REACT_APP_API_URL to call Flask instead.
 * REACT_APP_DEMO_MODE=true/false overrides that choice.
 */
export function resolveDemoMode(env = process.env) {
  const flag = env && env.REACT_APP_DEMO_MODE;
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  const apiUrl = ((env && env.REACT_APP_API_URL) || "").trim();
  return apiUrl.length === 0;
}

export function isDemoMode() {
  return resolveDemoMode();
}
