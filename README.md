# FlowStream AI - Ecommerce Dashboard

A production-ready, Vercel-friendly Next.js 15 dashboard for multi-project ecommerce performance tracking. Built with TypeScript, featuring Lighthouse integration, flow metrics, and AI-powered suggestions.

## Features

### 🎯 Core Functionality
- **Multi-project dashboard** with health snapshots
- **Lighthouse integration** for performance, accessibility, best practices, and SEO
- **Flow metrics** tracking (Actionable Agile methodology)
- **AI suggestions** with rule-based improvement recommendations
- **Real-time updates** with Next.js ISR caching

### 📊 Metrics Tracked
- **Web Performance**: Lighthouse scores (Performance, A11y, Best Practices, SEO)
- **Flow Metrics**: Throughput ratio, WIP ratio, Quality metrics, Cycle time (P50/P85/P95)
- **Historical trends** with interactive SVG charts

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

# Optional: Base URL (auto-detected in development)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your-secret-api-key-here

# Optional: Live accessibility audits (Google PageSpeed Insights)
GOOGLE_PAGESPEED_API_KEY=your-pagespeed-api-key

# Optional: AI suggestions (OpenAI)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

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

### Metrics

```bash
# Get project metrics
curl "http://localhost:3000/api/projects/my-shop/metrics?month=2025-04"

# Update metrics
curl -X POST http://localhost:3000/api/projects/my-shop/metrics \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "month": "2025-04",
    "perf": {
      "performance": 0.92,
      "accessibility": 0.88,
      "bestPractices": 0.95,
      "seo": 0.91
    },
    "flow": {
      "throughputRatio": 0.65,
      "wipRatio": 0.42,
      "qualitySpecial": 0.78,
      "cycleTimeP50": 3,
      "cycleTimeP85": 7,
      "cycleTimeP95": 12
    }
  }'
```

### Lighthouse Analysis

```bash
# Run Lighthouse analysis (Node runtime required)
curl -X POST http://localhost:3000/api/projects/my-shop/lighthouse \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"url": "https://myshop.com"}'  # Optional: override project URL

# Get latest Lighthouse results
curl http://localhost:3000/api/projects/my-shop/lighthouse
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
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── components/              # React components
├── lib/                     # Core business logic
│   ├── charts.tsx           # SVG chart components
│   ├── lighthouse.ts        # Lighthouse integration
│   ├── suggestions.ts       # AI suggestion engine
│   └── repo/               # Data layer
├── data/                    # Seed data (JSON)
├── styles/                  # CSS Modules
└── middleware.ts            # API authentication
```

### Data Layer
- **In-memory storage** with JSON seed data
- **Repository pattern** for easy database swapping
- **Type-safe interfaces** throughout

### Suggestions Engine
Hybrid AI system that generates improvements based on:
- Performance scores < 90%
- Accessibility issues
- Flow metric thresholds
- Cycle time patterns
  - When `OPENAI_API_KEY` is set the dashboard requests tailored suggestions from OpenAI (defaults to `gpt-4o-mini`).
  - Falls back to deterministic rules when AI is unavailable.

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

Optional:
- `NEXT_PUBLIC_BASE_URL` - Base URL for API calls
- `NEXT_PUBLIC_API_KEY` - Client-side API key
- `GOOGLE_PAGESPEED_API_KEY` - Enables live accessibility checks via PageSpeed Insights
- `OPENAI_API_KEY` / `OPENAI_MODEL` - Enables OpenAI-powered suggestions

### Performance Notes

- Lighthouse routes may take 10-60 seconds depending on target site
- Use appropriate timeouts and memory allocation
- Consider rate limiting for production usage
- Monitor Vercel function duration and memory usage

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

### Lighthouse Issues
- **Chrome not found**: Install Chrome/Chromium or set `CHROME_PATH`
- **Memory errors**: Increase function memory allocation
- **Timeouts**: Extend function timeout limits

### API Authentication
- Ensure `X-API-Key` header is set correctly
- Check middleware configuration in `middleware.ts`
- Verify environment variables are loaded

### Caching Problems
- Use refresh webhook to clear caches
- Check cache tags in API responses
- Monitor revalidation periods

### Performance
- Monitor bundle sizes with `npm run build`
- Check Lighthouse scores of the dashboard itself
- Use Chrome DevTools for performance profiling

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

For questions or issues, please create a GitHub issue with relevant details.
