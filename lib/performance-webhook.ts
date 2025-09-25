interface PerformanceDeviceData {
  lcp: number;
  cls: number;
  inp: number;
}

interface PerformanceWebhookData {
  desktop: PerformanceDeviceData;
  mobile: PerformanceDeviceData;
}

interface CruxDataItem {
  key: string;
  formFactor: 'DESKTOP' | 'PHONE';
  firstDate: string;
  lastDate: string;
  cruxData: string; // JSON string
}

// Global cache for all webhook data - single source of truth
const globalWebhookCache = new Map<string, { data: PerformanceWebhookData; timestamp: number }>();
const allProjectsCache = new Map<string, { data: CruxDataItem[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (longer cache)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 30 * 1000; // 30 seconds between requests (more aggressive)

// Fetch all projects data once and cache it globally
async function fetchAllProjectsData(): Promise<CruxDataItem[] | null> {
  // Check if we have cached data for all projects
  const cachedAllData = allProjectsCache.get('all_projects');
  if (cachedAllData && Date.now() - cachedAllData.timestamp < CACHE_DURATION) {
    console.log('Using cached all projects data');
    return cachedAllData.data;
  }

  // Rate limiting - prevent too frequent requests
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    console.log('Rate limited - using cached data or null');
    return cachedAllData?.data || null;
  }

  try {
    lastRequestTime = now;
    console.log('Fetching fresh webhook data for all projects');

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      return null;
    }

    const data: CruxDataItem[] = await response.json();
    console.log(`Fetched ${data.length} CrUX data items from webhook`);

    // Cache the raw data for all projects
    allProjectsCache.set('all_projects', { data, timestamp: now });

    return data;
  } catch (error) {
    console.error('Error fetching all projects data from webhook:', error);
    return null;
  }
}

// Batch fetch for multiple projects - much more efficient for homepage
export async function fetchPerformanceMetricsForAllProjects(): Promise<Map<string, PerformanceWebhookData>> {
  const results = new Map<string, PerformanceWebhookData>();

  // Fetch all data once
  const allData = await fetchAllProjectsData();

  if (!allData) {
    console.warn('No webhook data available, using defaults for all projects');
    return results;
  }

  // Process each project from the single webhook response
  const uniqueProjectKeys = [...new Set(allData.map(item => item.key))];

  for (const projectKey of uniqueProjectKeys) {
    const projectData = allData.filter(item => item.key === projectKey);
    const desktopData = projectData.find(item => item.formFactor === 'DESKTOP');
    const mobileData = projectData.find(item => item.formFactor === 'PHONE');

    const result: PerformanceWebhookData = {
      desktop: desktopData ? extractMetricsFromCrux(desktopData.cruxData) : getDefaultDeviceData('desktop'),
      mobile: mobileData ? extractMetricsFromCrux(mobileData.cruxData) : getDefaultDeviceData('mobile')
    };

    // Cache each project result
    globalWebhookCache.set(projectKey, { data: result, timestamp: Date.now() });
    results.set(projectKey, result);
  }

  console.log(`Processed performance data for ${results.size} projects`);
  return results;
}

export async function fetchPerformanceMetricsForProject(projectKey: string): Promise<PerformanceWebhookData | null> {
  // First check project-specific cache
  const projectCachedData = globalWebhookCache.get(projectKey);
  if (projectCachedData && Date.now() - projectCachedData.timestamp < CACHE_DURATION) {
    console.log(`Using cached data for project: ${projectKey}`);
    return projectCachedData.data;
  }

  // Fetch all projects data (uses its own caching)
  const allData = await fetchAllProjectsData();

  if (!allData) {
    console.warn(`No webhook data available, using defaults for ${projectKey}`);
    return getDefaultPerformanceData();
  }

  // Find data for the specific project
  const projectData = allData.filter(item => item.key === projectKey);

  if (projectData.length === 0) {
    console.warn(`No data found for project key: ${projectKey}`);
    return getDefaultPerformanceData();
  }

  // Extract desktop and mobile data
  const desktopData = projectData.find(item => item.formFactor === 'DESKTOP');
  const mobileData = projectData.find(item => item.formFactor === 'PHONE');

  const result: PerformanceWebhookData = {
    desktop: desktopData ? extractMetricsFromCrux(desktopData.cruxData) : getDefaultDeviceData('desktop'),
    mobile: mobileData ? extractMetricsFromCrux(mobileData.cruxData) : getDefaultDeviceData('mobile')
  };

  // Cache the project-specific result
  globalWebhookCache.set(projectKey, { data: result, timestamp: Date.now() });

  return result;
}

function extractMetricsFromCrux(cruxDataString: string): PerformanceDeviceData {
  try {
    const cruxData = JSON.parse(cruxDataString);
    const metrics = cruxData.record?.metrics;

    if (!metrics) {
      throw new Error('No metrics found in crux data');
    }

    // Extract p75 values (converting to appropriate units)
    const lcpRaw = metrics.largest_contentful_paint?.percentiles?.p75;
    const clsRaw = metrics.cumulative_layout_shift?.percentiles?.p75;
    const inpRaw = metrics.interaction_to_next_paint?.percentiles?.p75;

    const lcp = parseFloat(lcpRaw || '2500') / 1000; // Convert ms to seconds
    const cls = parseFloat(clsRaw || '0.1');
    const inp = parseFloat(inpRaw || '200');

    const result = {
      lcp: Math.round(lcp * 100) / 100, // Round to 2 decimal places
      cls: Math.round(cls * 1000) / 1000, // Round to 3 decimal places
      inp: Math.round(inp)
    };

    return result;
  } catch (error) {
    console.error('Error parsing CrUX data:', error);
    return {
      lcp: 2.5,
      cls: 0.1,
      inp: 200
    };
  }
}

// Legacy function for backward compatibility
export async function fetchPerformanceMetrics(): Promise<PerformanceWebhookData | null> {
  // Default to diptyque for backward compatibility
  return fetchPerformanceMetricsForProject('diptyque');
}

function getDefaultDeviceData(device: 'desktop' | 'mobile'): PerformanceDeviceData {
  if (device === 'desktop') {
    return {
      lcp: 2.2,
      cls: 0.08,
      inp: 180,
    };
  } else {
    return {
      lcp: 2.8,
      cls: 0.12,
      inp: 220,
    };
  }
}

function getDefaultPerformanceData(): PerformanceWebhookData {
  // Fallback data when webhook is unavailable
  return {
    desktop: getDefaultDeviceData('desktop'),
    mobile: getDefaultDeviceData('mobile')
  };
}

// Map internal project IDs to webhook keys
export function getProjectWebhookKey(projectId: string): string {
  const keyMap: Record<string, string> = {
    'diptyque': 'diptyque',
    'byredo': 'byredo',
    'swissense': 'swisssense', // Note: webhook uses 'swisssense', not 'swissense'
    'elon': 'elon'
  };

  return keyMap[projectId] || projectId;
}