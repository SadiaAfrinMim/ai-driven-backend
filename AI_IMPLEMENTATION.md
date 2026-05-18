# AI Product Suggestion - Implementation Guide

## Overview

This document outlines the complete industry-standard implementation of the AI Product Suggestion application with real OpenAI integration, caching, monitoring, and advanced design patterns.

## Architecture Overview

### Core Components

#### 1. **AI Provider Layer** (Strategy Pattern)
- **AIProvider.ts** - Abstract base class defining AI provider contract
- **OpenAIProvider.ts** - Real OpenAI GPT-4 implementation
- **AIProviderFactory.ts** - Factory pattern for provider management

**Features:**
- Pluggable provider architecture for easy switching (OpenAI → Claude → Gemini)
- Streaming support for long-running operations
- Automatic retry logic with exponential backoff
- Token counting and usage tracking
- System prompts and tone/length customization

#### 2. **Caching Layer** (Performance Optimization)
- **CacheService.ts** - Redis-based caching with intelligent invalidation
- Automatic TTL management (1-hour default)
- Tag-based cache invalidation for related content
- Graceful fallback when Redis unavailable
- Key generation from request parameters

**Features:**
- LRU cache for frequently requested content
- Tag-based invalidation groups
- Memory-bound storage
- Monitoring and analytics

#### 3. **Enhanced AI Service**
- **EnhancedAIService.ts** - Business logic integrating providers and caching
- Product description generation
- Product title generation
- Smart recommendations using collaborative filtering
- Chat processing with AI

#### 4. **Monitoring & Analytics**
- **MonitoringService.ts** - Request and AI usage tracking
- Performance metrics
- API health monitoring
- Token usage analytics

### Design Patterns Used

1. **Strategy Pattern** - Multiple AI providers with common interface
2. **Factory Pattern** - Centralized provider instantiation
3. **Decorator Pattern** - Caching layer wrapping AI calls
4. **Dependency Injection** - Loose coupling between components
5. **Repository Pattern** - Database abstraction with Prisma

## Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon)
- Redis (optional, for caching)
- OpenAI API key

### 1. Install Dependencies

```bash
cd backend
npm install
```

New dependencies added:
- `openai` - OpenAI API client (v4.52.7)
- `ioredis` - Redis client (v5.3.2)
- `bull` - Job queue (v4.15.1)
- `pino` - Logger (v8.17.2)
- `pino-http` - HTTP logger (v8.6.1)

### 2. Environment Configuration

Update `.env` with:

```env
# OpenAI
OPENAI_API_KEY=your_key_here

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### 3. Initialize Redis (Optional)

For local development with caching:

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:latest

# Windows with WSL
wsl redis-server
```

### 4. Build & Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## API Usage Examples

### 1. Generate Product Description

```bash
curl -X POST http://localhost:5000/api/v1/ai/generate-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "item-description",
    "topic": "Wireless Bluetooth Headphones",
    "category": "Electronics",
    "tone": "professional",
    "length": "medium",
    "keywords": ["noise-cancelling", "comfortable", "long battery life"],
    "price": 99.99
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "Introducing premium wireless Bluetooth headphones that deliver exceptional audio quality...",
    "metadata": {
      "type": "item-description",
      "wordCount": 125,
      "model": "gpt-4-turbo",
      "generatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 2. Generate Product Title

```bash
curl -X POST http://localhost:5000/api/v1/ai/generate-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "item-title",
    "topic": "Wireless Headphones",
    "category": "Electronics",
    "keywords": ["noise-cancelling", "premium"]
  }'
```

### 3. Generate Multiple Items at Once

```bash
curl -X POST http://localhost:5000/api/v1/ai/generate-item-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topic": "Laptop Stand",
    "category": "Office Equipment",
    "keywords": ["adjustable", "portable", "ergonomic"],
    "tone": "casual"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Premium Laptop Stand - Adjustable",
    "description": "Check out this amazing laptop stand...",
    "tags": ["Office Equipment", "adjustable", "portable", "ergonomic"]
  }
}
```

### 4. Get Recommendations

```bash
curl -X GET http://localhost:5000/api/v1/ai/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "context": "profile",
    "category": "Electronics",
    "limit": 10
  }'
```

### 5. Chat with AI

```bash
curl -X POST http://localhost:5000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What makes a good laptop for programming?",
    "context": "tech"
  }'
```

## Configuration & Customization

### 1. Adjust AI Parameters

Edit `EnhancedAIService.ts`:

```typescript
// Temperature: 0-1 (0=deterministic, 1=creative)
const temperature = this.getTemperature(request.tone);

// Max tokens: 100-4000
const maxTokens = this.getMaxTokens(request.length, 2000);
```

### 2. Modify Cache TTL

```typescript
// In EnhancedAIService.ts
const cacheOptions: CacheOptions = {
  ttl: 3600, // Change to 7200 for 2 hours
  tags: ['product-descriptions']
};
```

### 3. Switch AI Provider

```typescript
// In ai.service.ts or controller
enhancedAIService.setProvider('claude'); // Switch to Claude when available
```

### 4. Custom System Prompts

Edit system context in `OpenAIProvider.ts`:

```typescript
private getSystemContext(type: string): string {
  const contexts: Record<string, string> = {
    'product-description': 'Your custom prompt here...',
    // ...
  };
  return contexts[type];
}
```

## Performance Optimization

### 1. Caching Strategy

```
Request → Cache Check → Return Cached (if hit)
                     → AI Provider → Cache → Return
```

- Cache key: `product-desc:{topic}:{category}:{tone}`
- TTL: 1 hour (configurable)
- Tag-based invalidation for category changes

### 2. Token Usage Optimization

- Reuse generated descriptions for similar requests
- Implement request deduplication
- Monitor token count in MonitoringService

### 3. Rate Limiting

- Per-user rate limiting via middleware
- API rate limits configured in `limiter.middleware.ts`
- Graceful degradation on rate limit exceed

## Monitoring & Observability

### Health Check Endpoint

```bash
curl http://localhost:5000/
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00Z",
  "cacheAvailable": true
}
```

### AI Usage Metrics

Access via monitoring service:

```typescript
const stats = monitoringService.getStats();
// {
//   totalRequests: 1250,
//   avgResponseTime: 342,
//   errorCount: 5,
//   successRate: 99,
//   aiMetrics: [...]
// }
```

### View Recent Requests

```typescript
const metrics = monitoringService.getMetrics(50); // Last 50 requests
```

## Error Handling

### Common Errors

1. **401 Authentication Failed**
   - Check OpenAI API key in `.env`
   - Verify key format: `sk-...`

2. **429 Rate Limit Exceeded**
   - Wait before retrying
   - Upgrade OpenAI plan if needed
   - Check cache hit rate

3. **500 AI Provider Error**
   - Check OpenAI API status
   - Review request parameters
   - Check token limits

### Retry Logic

Built-in retry with exponential backoff:
- Automatic retry on transient errors
- Max 3 retries with 2^n second delays
- Configurable in `OpenAIProvider.ts`

## Testing

### Unit Tests (To be added)

```bash
npm run test
```

### Manual Integration Test

```bash
# Test product description
curl -X POST http://localhost:5000/api/v1/ai/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "type": "item-description",
    "topic": "Test Product"
  }'

# Should return in <2 seconds with cached results
# Check MonitoringService logs for timing
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production OpenAI model (`gpt-4` instead of `gpt-4-turbo`)
- [ ] Configure Redis connection to managed service (Redis Cloud, AWS ElastiCache)
- [ ] Enable HTTPS
- [ ] Set appropriate rate limits
- [ ] Configure log aggregation
- [ ] Set up monitoring alerts
- [ ] Test error handling and fallbacks

### Environment Variables (Production)

```env
NODE_ENV=production
LOG_LEVEL=warn
REDIS_URL=redis://prod-redis-url
OPENAI_API_KEY=prod-key
```

## Future Enhancements

### Phase 2: Advanced Features
1. **Multiple AI Providers**
   - Claude API integration
   - Google Gemini integration
   - Automatic provider failover

2. **Advanced Caching**
   - Distributed cache with multi-region support
   - Cache warming strategies
   - Predictive prefetching

3. **Job Queue**
   - Async content generation with Bull
   - Batch processing
   - Scheduled tasks

4. **Vector Embeddings**
   - Semantic search
   - Similarity-based recommendations
   - Content clustering

### Phase 3: Analytics & Insights
1. **Dashboard**
   - Real-time usage metrics
   - Cost tracking
   - Performance graphs

2. **A/B Testing**
   - Compare AI providers
   - Test different prompts
   - Measure user engagement

3. **Machine Learning**
   - User preference learning
   - Automated prompt optimization
   - Anomaly detection

## Troubleshooting

### High Token Usage

```typescript
// Check MonitoringService stats
const stats = monitoringService.getStats();
console.log(stats.aiMetrics);

// Solutions:
// 1. Increase cache TTL
// 2. Use shorter length requests
// 3. Implement request deduplication
// 4. Batch similar requests
```

### Slow Responses

```
Check:
1. Redis connectivity: cacheService.isAvailable()
2. OpenAI API status: status.openai.com
3. Network latency: Monitor responseTime in metrics
4. Token limits: May need quota increase
```

### Memory Issues

```
Solutions:
1. Reduce metrics.maxMetricsToStore
2. Clear old cache entries
3. Implement pagination for batch operations
4. Use streaming for large responses
```

## Support & Resources

- **OpenAI Docs**: https://platform.openai.com/docs
- **Redis Docs**: https://redis.io/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Project Issues**: GitHub issues

## License

ISC

---

**Last Updated**: January 2024
**Version**: 1.0.0
