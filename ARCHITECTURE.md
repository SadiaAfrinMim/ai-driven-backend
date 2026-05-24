# Architecture & Best Practices Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  (Next.js Frontend - Web/Mobile)                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
┌─────────────────────────▼────────────────────────────────────────┐
│                     API GATEWAY / MIDDLEWARE                     │
├──────────────────────────────────────────────────────────────────┤
│ - Authentication (JWT)                                           │
│ - Rate Limiting (express-rate-limit)                           │
│ - CORS & Security (Helmet)                                     │
│ - Request Logging (Pino)                                       │
│ - Error Handling                                               │
└────────┬─────────────────────────────────────────────┬──────────┘
         │                                            │
         ▼                                            ▼
┌──────────────────────┐                  ┌──────────────────────┐
│   CONTROLLER LAYER   │                  │  VALIDATION LAYER    │
│                      │                  │                      │
│ - aiController.ts    │◄─────Zod────────►│ - Zod Schemas       │
│ - Route handlers     │                  │ - Input validation  │
│ - Request parsing    │                  │ - Type safety       │
└─────────┬────────────┘                  └──────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (Business Logic)               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ai.service.ts (Orchestration)              │  │
│  │  - Routes requests to EnhancedAIService                 │  │
│  │  - Delegates to appropriate modules                     │  │
│  │  - Transforms responses                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        EnhancedAIService.ts (Core Business Logic)       │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ Product Description Generation                 │   │  │
│  │  │ - Prompt engineering                          │   │  │
│  │  │ - Cache management                            │   │  │
│  │  │ - Provider integration                        │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ Smart Recommendations                         │   │  │
│  │  │ - Collaborative filtering                     │   │  │
│  │  │ - User preference analysis                    │   │  │
│  │  │ - Scoring algorithm                           │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ Chat Processing                                │   │  │
│  │  │ - Message handling                            │   │  │
│  │  │ - Context management                          │   │  │
│  │  │ - Response generation                         │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
         │                           │
    ┌────▼────┐               ┌─────▼──────┐
    │          │               │             │
    ▼          ▼               ▼             ▼
┌────────┐  ┌──────┐    ┌──────────┐  ┌──────────┐
│ CACHE  │  │ AI   │    │DATABASE  │  │MONITORING
│LAYER   │  │LAYER │    │LAYER     │  │SERVICE
└────────┘  └──────┘    └──────────┘  └──────────┘
    │          │              │             │
    ▼          ▼              ▼             ▼
 REDIS      OPENAI        POSTGRESQL    LOGGING
```

## Layer Details

### 1. **Controller Layer** (HTTP/Request Handling)
```typescript
// Path: src/app/modules/ai/ai.controller.ts
- Receives HTTP requests
- Parses request body/params
- Calls service layer
- Formats response
- Handles errors
```

### 2. **Service Layer** (Business Logic)
```typescript
// Path: src/app/modules/ai/ai.service.ts
- Orchestrates multiple modules
- Handles complex workflows
- Manages transactions
- Delegates to specialized services
```

### 3. **Enhanced AI Service** (Core Logic)
```typescript
// Path: src/app/modules/ai/EnhancedAIService.ts
- Product generation logic
- Cache integration
- Provider selection
- Result formatting
```

### 4. **AI Provider Layer** (Strategy Pattern)
```typescript
// Path: src/app/modules/ai/AIProvider.ts
// Interfaces defining contract

// Path: src/app/modules/ai/OpenAIProvider.ts
// Real OpenAI implementation

// Path: src/app/modules/ai/AIProviderFactory.ts
// Provider instantiation & management
```

### 5. **Infrastructure Layer**
```
CacheService      - Redis caching
MonitoringService - Metrics & tracking
Database          - Prisma ORM
```

## Design Patterns Explained

### 1. **Strategy Pattern** (AI Providers)
```
Problem: Need multiple AI implementations (OpenAI, Claude, Gemini)
Solution: Abstract interface with pluggable implementations

┌─────────────────────────┐
│    AIProvider (ABC)     │
│ ┌─────────────────────┐ │
│ │ generateContent()   │ │
│ │ validateRequest()   │ │
│ └─────────────────────┘ │
└────────────────────▲────┘
                     │
       ┌─────────────┴──────────────┐
       │                            │
┌──────▼────────────┐       ┌──────▼────────────┐
│ OpenAIProvider    │       │ ClaudeProvider    │
│ (Concrete)        │       │ (Future)          │
└───────────────────┘       └───────────────────┘
```

### 2. **Factory Pattern** (Provider Management)
```
Problem: How to create and manage AI providers
Solution: Factory provides centralized creation

AIProviderFactory.initialize()
  ├── new OpenAIProvider()
  └── new ClaudeProvider() (future)

AIProviderFactory.getProvider('openai')
  └── Returns OpenAIProvider instance
```

### 3. **Decorator Pattern** (Caching)
```
Problem: Want to add caching without modifying AI provider
Solution: Decorator wraps service with cache logic

generateProductDescription()
  ├── Check Cache
  │   ├── Hit → Return cached
  │   └── Miss → Continue
  ├── Call AI Provider
  ├── Store in Cache
  └── Return result
```

### 4. **Repository Pattern** (Database)
```
Problem: Tight coupling to database implementation
Solution: Abstract database operations

// Instead of:
const item = await db.query('SELECT ...')

// Use:
const item = await itemRepository.findById(id)
// Or with Prisma:
const item = await prisma.item.findUnique(...)
```

### 5. **Dependency Injection**
```
// Bad: Tight coupling
class UserService {
  private emailService = new EmailService()
}

// Good: Dependency injection
class UserService {
  constructor(private emailService: EmailService) {}
}

// Or with factories:
const emailService = new EmailService()
const userService = new UserService(emailService)
```

## Request Flow Example

### Generate Product Description

```
1. HTTP POST /api/v1/ai/generate-content
   │
   ├─ Middleware:
   │  ├─ Authentication (JWT)
   │  ├─ Rate Limiting check
   │  └─ Logging start
   │
   ├─ Controller (aiController.generateContent):
   │  ├─ Parse request body
   │  ├─ Validate with Zod schema
   │  └─ Call aiService.generateContent()
   │
   ├─ Service (aiService.generateContent):
   │  ├─ Route to enhancedAIService
   │  └─ Call generateProductDescription()
   │
   ├─ Enhanced Service (EnhancedAIService):
   │  ├─ Generate cache key
   │  ├─ Check cacheService.get(key)
   │  │  ├─ HIT → Return cached result
   │  │  └─ MISS → Continue
   │  │
   │  ├─ Build prompt from request
   │  ├─ Get AI provider (AIProviderFactory)
   │  └─ Call aiProvider.generateContent()
   │
   ├─ AI Provider (OpenAIProvider):
   │  ├─ Validate request
   │  ├─ Build system prompt
   │  ├─ Call OpenAI API
   │  └─ Count tokens
   │
   ├─ OpenAI API:
   │  └─ Returns: { content, usage }
   │
   ├─ Enhanced Service (cont'd):
   │  ├─ Format response
   │  ├─ Store in cache (cacheService.set)
   │  └─ Record metrics (monitoringService)
   │
   ├─ Service (cont'd):
   │  └─ Return response
   │
   ├─ Controller (cont'd):
   │  ├─ Format JSON response
   │  └─ Send 200 OK
   │
   └─ Response: {
      "success": true,
      "data": {
        "content": "...",
        "metadata": {...}
      }
    }
```

## Best Practices Implemented

### 1. **Type Safety**
```typescript
// Use strict TypeScript types throughout
interface GenerateContentRequest {
  prompt: string;
  type: 'product-description' | 'product-title' | 'blog' | 'chat';
  tone?: 'professional' | 'casual' | 'creative' | 'formal';
}

// Validate at boundaries
const validated = GenerateContentRequest.parse(input)
```

### 2. **Error Handling**
```typescript
try {
  const result = await aiProvider.generateContent(request);
  return result;
} catch (error) {
  if (error instanceof RateLimitError) {
    throw new ApiError(429, 'Rate limit exceeded');
  }
  throw new ApiError(500, 'AI generation failed');
}
```

### 3. **Logging & Monitoring**
```typescript
console.log('📝 Blog generation request:', requestData);
monitoringService.recordRequest({
  endpoint: '/ai/generate-content',
  method: 'POST',
  statusCode: 200,
  responseTime: 1234,
});
```

### 4. **Resource Management**
```typescript
// Cache with TTL
await cacheService.set(key, value, {
  ttl: 3600,
  tags: ['product-descriptions']
});

// Graceful degradation when Redis unavailable
const cached = await cacheService.get(key) || null;
if (!cached) {
  // Generate new content
}
```

### 5. **Configuration Management**
```typescript
// Environment-based config
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
};
```

## Performance Optimization Techniques

### 1. **Caching Strategy**
```
Cache Key: product-desc:{topic}:{category}:{tone}
TTL: 1 hour
Tags: product-descriptions, {category}
Invalidation: Auto-expire or tag-based
```

### 2. **Token Optimization**
```typescript
// Reuse patterns
- Similar products → Same description template
- Different tones → Prompt modification, not new API call
- Batch similar requests

// Token counting
const tokens = response.usage.completion_tokens;
console.log(`Used ${tokens} tokens`);
```

### 3. **Request Deduplication**
```typescript
// If two identical requests arrive, serve from in-flight promise
// Prevents duplicate API calls
const requests = new Map();
if (requests.has(key)) {
  return requests.get(key);
}

const promise = aiProvider.generateContent(request);
requests.set(key, promise);
```

### 4. **Rate Limiting**
```typescript
// Per-user limits
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  keyGenerator: (req) => req.user.id,
}));
```

## Security Best Practices

### 1. **API Key Management**
```typescript
// ✅ Good: Environment variable
const apiKey = process.env.OPENAI_API_KEY;

// ❌ Bad: Hardcoded in code
const apiKey = 'sk-...actual-key...';

// ❌ Bad: In version control
git add .env  // Add .env to .gitignore
```

### 2. **Input Validation**
```typescript
// Validate all user input
const schema = z.object({
  topic: z.string().min(1).max(1000),
  tone: z.enum(['professional', 'casual', 'creative', 'formal']),
});

const validated = schema.parse(userInput);
```

### 3. **Error Messages**
```typescript
// ✅ Good: Generic error message
throw new ApiError(500, 'Content generation failed');

// ❌ Bad: Exposes sensitive info
throw new Error(`OpenAI API key invalid: ${apiKey}`);
```

### 4. **Rate Limiting**
```typescript
// Prevent abuse
app.use('/api', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests, please try again later',
}));
```

## Testing Strategy

### Unit Tests
```typescript
// Test AIProvider in isolation
describe('OpenAIProvider', () => {
  it('should validate requests correctly', () => {
    const provider = new OpenAIProvider();
    expect(provider.validateRequest({...})).toBe(true);
  });
});
```

### Integration Tests
```typescript
// Test full flow
describe('Product Description Generation', () => {
  it('should generate description and cache result', async () => {
    const result = await enhancedAIService
      .generateProductDescription({...});
    expect(result).toHaveProperty('content');
  });
});
```

### E2E Tests
```typescript
// Test API endpoints
describe('POST /api/v1/ai/generate-content', () => {
  it('should return product description', async () => {
    const response = await request(app)
      .post('/api/v1/ai/generate-content')
      .send({...})
      .expect(200);
  });
});
```

## Monitoring & Observability

### Metrics to Track
```
- Request count per endpoint
- Response time (average, p95, p99)
- Error rate (4xx, 5xx)
- Cache hit/miss ratio
- Token usage per provider
- Cost tracking
```

### Health Checks
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnected,
    cache: cacheService.isAvailable(),
    ai: aiProvider.isHealthy(),
  });
});
```

### Logging Strategy
```typescript
// Development: Verbose logging
LOG_LEVEL=debug npm run dev

// Production: Minimal logging
LOG_LEVEL=warn npm start
```

---

**This architecture ensures scalability, maintainability, and extensibility for future enhancements.**
