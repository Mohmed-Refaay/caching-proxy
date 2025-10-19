# Caching Proxy

A high-performance HTTP caching proxy server built with Node.js that forwards requests to DummyJSON API while implementing intelligent caching and request deduplication.

## Features

- **Smart Caching**: Caches GET requests with configurable TTL (Time To Live)
- **Request Deduplication**: Uses mutex locks to prevent duplicate concurrent requests to the same endpoint
- **Cache Headers**: Adds `X-Cache` header to indicate cache HIT or MISS
- **Request Logging**: Built-in request logging using Morgan
- **TTL Extension**: Cache TTL is refreshed on each cache hit to keep frequently accessed data available

## How It Works

1. **Cache Miss**: When a GET request is made to an uncached endpoint, the proxy forwards the request to the target API
2. **Cache Hit**: Subsequent requests to the same endpoint return cached data and extend the TTL
3. **Request Deduplication**: Multiple concurrent requests to the same uncached endpoint are deduplicated using async mutexes
4. **TTL Management**: Cached data expires after 5 seconds of inactivity, but TTL is refreshed on each access

## Configuration

- **Target Host**: `https://dummyjson.com` (configurable via `TARGET_HOST` constant)
- **Cache TTL**: 5 seconds (configurable via `TTL` constant)
- **Server Port**: 8080
- **Server Host**: 127.0.0.1

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd caching-proxy
```

2. Install dependencies:

```bash
yarn install
```

## Usage

### Starting the Server

```bash
node index.js
```

The server will start on `http://127.0.0.1:8080`

### Making Requests

The proxy forwards all requests to DummyJSON API. You can make requests to any DummyJSON endpoint:

```bash
# Get a product (will be cached)
curl "http://127.0.0.1:8080/products/1"

# Get all products (will be cached)
curl "http://127.0.0.1:8080/products"

# Search products (will be cached)
curl "http://127.0.0.1:8080/products/search?q=phone"
```

### Cache Headers

The proxy adds an `X-Cache` header to all responses:

- `X-Cache: HIT` - Data served from cache
- `X-Cache: MISS` - Data fetched from origin server

## Architecture

### Core Components

- **HTTP Server**: Built using Node.js native `http` module
- **Caching Layer**: In-memory cache with automatic TTL-based expiration
- **Request Deduplication**: Async mutex implementation to prevent thundering herd
- **Logging**: Morgan middleware for request logging

### Cache Strategy

- Only GET requests are cached
- Cache keys are based on the request path
- TTL is refreshed on each cache hit (LRU-like behavior)
- Failed requests (non-2xx status codes) are not cached

### Request Flow

```
Client Request → Mutex Check → Cache Check → Origin Request (if needed) → Cache Store → Response
```
