interface PerformanceWebhookData {
  lcp: number;
  cls: number;
  inp: number;
}

export async function fetchPerformanceMetrics(): Promise<PerformanceWebhookData | null> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://lokte-workflows.vaimo.network/api/v1/webhooks/3jom5U1GWCnPVME4G0KMj/sync', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Performance webhook responded with status: ${response.status}`);
      return getDefaultPerformanceData();
    }

    const data = await response.json();
    console.log('Performance webhook response:', data);

    // Extract LCP, CLS, INP from the webhook response
    // Adjust these field names based on the actual webhook response structure
    return {
      lcp: data.lcp || data.LCP || data.largestContentfulPaint || 2.5,
      cls: data.cls || data.CLS || data.cumulativeLayoutShift || 0.1,
      inp: data.inp || data.INP || data.interactionToNextPaint || 200,
    };
  } catch (error) {
    console.error('Error fetching performance metrics from webhook:', error);
    return getDefaultPerformanceData();
  }
}

function getDefaultPerformanceData(): PerformanceWebhookData {
  // Fallback data when webhook is unavailable
  return {
    lcp: 2.5,
    cls: 0.1,
    inp: 200,
  };
}