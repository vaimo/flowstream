# FlowStream AI - Experience is everything

A production-ready Next.js 15 dashboard for multi-project ecommerce performance tracking. Built with TypeScript, featuring live CrUX data integration, Google PageSpeed API, flow metrics, and AI-powered suggestions.

## Features

### 🎯 Core Functionality
- **Multi-project dashboard** with health status indicators (Healthy, At Risk, Critical)
- **Live CrUX data integration** via dedicated performance webhook
- **Device-specific Core Web Vitals** (Desktop vs Mobile LCP, CLS, INP)
- **Google PageSpeed API** for real-time accessibility scores
- **Flow metrics** tracking (Actionable Agile methodology)
- **AI suggestions** with OpenAI-powered and rule-based recommendations
- **Project health assessment** based on performance and flow metrics

### 📊 Metrics Tracked
- **Core Web Vitals**: Live LCP, CLS, INP from Chrome User Experience Report (CrUX)
  - Desktop vs Mobile breakdown with p75 percentiles
  - Real-time data from performance webhook
- **Web Performance**: Google PageSpeed Insights accessibility scores
- **Flow Metrics**: Throughput, Quality issues, Cycle time (P50/P85/P95)
- **Health Status**: Automated assessment (Healthy/At Risk/Critical)
- **Historical trends** with demo data for performance visualization

### 🎨 Design System
- **Vaimo brand colors** throughout the UI
- **Responsive design** with CSS Modules
- **Accessibility-first** approach
- **No external UI dependencies**

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and install dependencies
git clone <your-repo-url>
cd flowstream-ai
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Setup

Create `.env.local` with:

```bash
# Required: API key for protected endpoints
API_KEY=your-secret-api-key-here

# Required: Google PageSpeed API for accessibility scores
GOOGLE_PAGESPEED_API_KEY=your-pagespeed-api-key

# Optional: Base URL (auto-detected in development)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your-secret-api-key-here

# Optional: AI suggestions (OpenAI)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Performance Webhook Configuration

The application integrates with a live CrUX data webhook:
- **Endpoint**: `https://lokte-workflows.vaimo.network/api/v1/webhooks/3jom5U1GWCnPVME4G0KMj/sync`
- **Data Source**: Chrome User Experience Report (CrUX)
- **Rate Limiting**: 10-second minimum interval, 5-minute caching
- **Metrics**: LCP, CLS, INP p75 percentiles for Desktop and Mobile

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

#### Manual accessibility audit (axe-core + Playwright)

```bash
# Audit a specific homepage (outputs JSON to stdout)
npm run audit:a11y -- diptyque https://www.diptyqueparis.com/
```

Reports can also be generated automatically by the `Accessibility Audit` GitHub Action (see `.github/workflows/accessibility-audit.yml`).

## Current Projects

The dashboard tracks the following ecommerce sites:

- **Diptyque** - Luxury fragrance brand (`https://www.diptyqueparis.com/`)
- **Byredo** - Luxury fragrance and lifestyle (`https://www.byredo.com/eu_en`)
- **Swiss Sense** - Sleep solutions and mattresses (`http://swissense.nl/`)
- **Elon** - Nordic home electronics (`https://www.elon.se/`)

## Data Sources & Architecture

### Core Web Vitals (Live Data)
- **Source**: CrUX (Chrome User Experience Report) via webhook
- **Update Frequency**: Real-time with 5-minute caching
- **Metrics**: LCP (seconds), CLS (score), INP (milliseconds)
- **Device Breakdown**: Desktop vs Mobile p75 percentiles
- **Rate Limiting**: 10-second minimum intervals to prevent webhook overload

### Accessibility Scores (Live Data)
- **Source**: Google PageSpeed Insights API
- **Update Frequency**: Real-time per page load
- **Fallback**: Project-specific default values when API unavailable

### Flow Metrics (Demo Data)
- **Source**: Static demo data for trends and analysis
- **Metrics**: Throughput, Quality issues, Cycle times, WIP ratios

## API Usage

All non-GET endpoints require the `X-API-Key` header.

### Projects

```bash
# List all projects
curl http://localhost:3000/api/projects

# Create/update project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "id": "my-shop",
    "name": "My Shop",
    "url": "https://myshop.com",
    "description": "Main ecommerce site",
    "tags": ["ecommerce", "b2c"]
  }'
```

### Metrics (Live + Demo Data)

```bash
# Get current month metrics (live CrUX + PageSpeed data)
curl "http://localhost:3000/api/projects/diptyque/metrics"

# Get historical metrics (demo data)
curl "http://localhost:3000/api/projects/diptyque/metrics?month=2025-08"
```

### Performance Data

```bash
# Performance metrics are automatically fetched from:
# 1. CrUX webhook for Core Web Vitals (LCP, CLS, INP)
# 2. Google PageSpeed API for accessibility scores
# 3. Demo data for flow metrics and trends

# The system uses intelligent caching and rate limiting
# No manual API calls needed for performance data
```

### AI Suggestions

```bash
# Get suggestions (cached for 24 hours)
curl http://localhost:3000/api/suggestions/my-shop

# Update suggestion status
curl -X POST http://localhost:3000/api/suggestions/my-shop \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "suggestionId": "suggestion-id",
    "status": "done",
    "completedText": "Optimize images (AVIF/WebP)..."
  }'
```

### Cache Management

```bash
# Refresh project cache
curl -X POST http://localhost:3000/api/webhooks/refresh \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"projectId": "my-shop"}'

# Refresh all projects
curl -X POST http://localhost:3000/api/webhooks/refresh \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"all": true}'
```

## Caching Strategy

The application uses Next.js ISR (Incremental Static Regeneration) with tagged caching:

- **Metrics**: 60 seconds revalidation, tagged per project
- **Suggestions**: 24 hours revalidation, tagged per project
- **Lighthouse**: 5 minutes revalidation, tagged per project

### Cache Tags
- `projects` - All projects data
- `project:{id}:metrics` - Project-specific metrics
- `project:{id}:suggestions` - Project-specific suggestions
- `project:{id}:lighthouse` - Project-specific Lighthouse results

Use the refresh webhook to manually invalidate caches after data updates.

## Lighthouse Integration

### Requirements
- **Node.js runtime** (not Edge) for API routes
- Chrome/Chromium available in deployment environment
- Sufficient memory allocation (recommended: 1GB+)

### Local Testing

```bash
# Install Chrome dependencies (Ubuntu/Debian)
sudo apt-get install -y chromium-browser

# Or use Chrome
# The app will automatically find available Chrome installation
```

### Vercel Deployment Notes

The Lighthouse route (`/api/projects/[id]/lighthouse`) uses:
- `export const runtime = 'nodejs'` (required)
- Chrome launcher with headless flags
- Timeout handling for long-running analyses

For Vercel deployment, ensure:
1. Function timeout is set appropriately (60s+)
2. Memory allocation is sufficient (1GB+)
3. Node.js runtime is enabled

## Architecture

### File Structure
```
├── app/                     # Next.js App Router
│   ├── api/                 # API routes
│   ├── projects/[id]/       # Project detail pages
│   ├── layout.tsx           # Root layout ("Experience is everything")
│   └── page.tsx             # Homepage with health status cards
├── components/              # React components
│   ├── ProjectCard.tsx      # Enhanced cards with CWV sections
│   ├── DevicePerformanceCard.tsx # Desktop vs Mobile display
│   └── ...
├── lib/                     # Core business logic
│   ├── performance-webhook.ts # CrUX data integration & parsing
│   ├── accessibility.ts     # Google PageSpeed API
│   ├── suggestions.ts       # AI suggestion engine
│   ├── utils.ts            # Health status & formatting functions
│   └── repo/               # Data layer with live data integration
├── data/                    # Demo data (JSON) for trends
├── styles/                  # CSS Modules with enhanced CWV styling
└── middleware.ts            # API authentication
```

### Data Layer
- **Hybrid data sources**: Live webhook + PageSpeed API + demo data
- **Repository pattern** with intelligent data fetching per project
- **Type-safe interfaces** throughout with device-specific types
- **Caching strategy**: 5-minute webhook cache, real-time accessibility

### Suggestions Engine
Hybrid AI system that generates improvements based on:
- Core Web Vitals thresholds (LCP > 2.5s, CLS > 0.1, INP > 200ms)
- Accessibility scores < 90%
- Flow metric thresholds and quality issues
- Health status assessment (Critical/At Risk projects get priority)
  - When `OPENAI_API_KEY` is set: tailored suggestions from OpenAI (`gpt-4o-mini`)
  - Fallback: deterministic rules based on performance thresholds

### Health Status System
Projects are automatically categorized as:
- **Healthy**: Good performance + flow metrics (score ≥ 80%)
- **At Risk**: Moderate issues detected (score 60-80%)
- **Critical**: Significant performance or flow problems (score < 60%)

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   ```
   API_KEY=your-production-api-key
   NEXT_PUBLIC_API_KEY=your-production-api-key
   ```
3. Deploy with default settings

### Environment Variables

Required:
- `API_KEY` - Secret key for API authentication
- `GOOGLE_PAGESPEED_API_KEY` - **Required** for live accessibility scores via PageSpeed Insights

Optional:
- `NEXT_PUBLIC_BASE_URL` - Base URL for API calls (auto-detected)
- `NEXT_PUBLIC_API_KEY` - Client-side API key
- `OPENAI_API_KEY` / `OPENAI_MODEL` - Enables OpenAI-powered suggestions (defaults to `gpt-4o-mini`)

### Webhook Integration Notes

The performance webhook is hardcoded and requires no configuration:
- Automatically fetches CrUX data for all projects
- Handles project key mapping (`swissense` → `swisssense`)
- Built-in rate limiting and error handling
- No authentication required for webhook endpoint

### Performance Notes

- CrUX webhook calls are rate-limited to prevent 500 errors
- PageSpeed API calls happen per page load for real-time accessibility
- Demo data provides historical trends without external API dependencies
- Monitor webhook response times and cache hit ratios

## Development

### Adding New Metrics
1. Update types in `lib/types.ts`
2. Modify repository interface in `lib/repo/memoryRepo.ts`
3. Update API routes in `app/api/`
4. Add UI components as needed

### Extending Suggestions
Add new rules to `SUGGESTION_RULES` in `lib/suggestions.ts`:

```typescript
{
  id: 'new-rule',
  condition: (metrics) => /* your condition */,
  text: 'Suggestion text',
  rationale: 'Why this suggestion matters',
}
```

### Custom Charts
Extend `lib/charts.tsx` with new SVG-based components:

```typescript
export function CustomChart({ data, ...props }) {
  // Your custom SVG chart implementation
}
```

## Troubleshooting

### Webhook Issues
- **500 errors**: Rate limiting in effect - webhook calls limited to 10-second intervals
- **Missing data**: Check project key mapping in `getProjectWebhookKey()` function
- **Stale data**: 5-minute cache may show outdated values, refresh browser

### PageSpeed API Issues
- **Accessibility scores missing**: Verify `GOOGLE_PAGESPEED_API_KEY` is set correctly
- **API quota exceeded**: Monitor Google Cloud Console for usage limits
- **Fallback values**: Default scores used when API is unavailable

### Health Status Problems
- **Incorrect status**: Check health calculation in `calculateProjectHealth()` function
- **Missing badges**: Verify CSS classes for health status colors are loaded

### Performance Issues
- **Slow loading**: Check webhook response times in network tab
- **Cache problems**: Clear browser cache, check 5-minute webhook cache
- **Rate limiting**: Wait 10 seconds between manual refreshes

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

For questions or issues, please create a GitHub issue with relevant details.
