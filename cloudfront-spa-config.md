# CloudFront Configuration for SPA Routing

## Problem
When users directly access URLs like `https://yourdomain.com/orders`, CloudFront/S3 returns 404 because these routes don't exist as physical files.

## Solution
Configure CloudFront to redirect all non-asset requests to `index.html` so Angular can handle the routing.

## CloudFront Error Pages Configuration

Add these Custom Error Response configurations in CloudFront:

### Error Page 1 - Handle 404 errors
- **HTTP Error Code**: 404
- **Error Caching Minimum TTL**: 0
- **Customize Error Response**: Yes
- **Response Page Path**: `/index.html`
- **HTTP Response Code**: 200

### Error Page 2 - Handle 403 errors  
- **HTTP Error Code**: 403
- **Error Caching Minimum TTL**: 0
- **Customize Error Response**: Yes
- **Response Page Path**: `/index.html`
- **HTTP Response Code**: 200

## Alternative: CloudFront Functions (Recommended)

Use a CloudFront Function to handle SPA routing more elegantly:

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check whether the URI is missing a file name.
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // Check whether the URI is missing a file extension.
    else if (!uri.includes('.')) {
        request.uri = '/index.html';
    }
    
    return request;
}
```

## Deployment Manifest Structure

For production, your `deployment-manifest.json` should look like:

```json
{
  "cart": {
    "version": "v1.0.0",
    "release": "2025-01-01"
  },
  "checkout": {
    "version": "v1.0.0", 
    "release": "2025-01-01"
  },
  "orders": {
    "version": "v1.0.0",
    "release": "2025-01-01"
  }
}
```

This will resolve to URLs like:
- `https://yourdomain.com/apps/cart/v1.0.0/remoteEntry.js`
- `https://yourdomain.com/apps/checkout/v1.0.0/remoteEntry.js`
- `https://yourdomain.com/apps/orders/v1.0.0/remoteEntry.js`

## S3 Bucket Structure

```
s3://your-bucket/
├── index.html (shell app)
├── deployment-manifest.json
├── apps/
│   ├── cart/
│   │   └── v1.0.0/
│   │       ├── remoteEntry.js
│   │       └── [other cart files]
│   ├── checkout/
│   │   └── v1.0.0/
│   │       ├── remoteEntry.js
│   │       └── [other checkout files]
│   └── orders/
│       └── v1.0.0/
│           ├── remoteEntry.js
│           └── [other orders files]
```
