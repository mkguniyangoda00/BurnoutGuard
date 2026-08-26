async function waitForEndpoint(url: string, timeoutMs = 120_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const response = await fetch(url);
    if (response.ok) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

export default async function globalSetup(_config: any) {
  await waitForEndpoint('http://localhost:5173');
  await waitForEndpoint('http://localhost:5000/api/health');
}
