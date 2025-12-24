# Frontend-Backend Integration Guide

## ✅ Configuration Status

### Environment Variables
The `.env` file is **already configured** correctly:
```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8090/ws
```

### API Client
The `api.ts` service is configured to connect through the **API Gateway** at port 8080, which routes to all backend microservices.

## 📡 API Endpoints Mapping

### ✅ Session API (Session Service - Port 8081)
| Frontend Call | Backend Endpoint | Status |
|--------------|------------------|--------|
| `GET /sessions/active` | `GET /sessions/active` | ✅ Ready |
| `GET /sessions/{id}` | `GET /sessions/{sessionId}` | ✅ Ready |
| `POST /sessions` | `POST /sessions` | ✅ Ready |
| `DELETE /sessions/{id}` | `POST /sessions/{sessionId}/close` | ⚠️ Needs adjustment |

### ✅ Cart API (Cart Service - Port 8082)
| Frontend Call | Backend Endpoint | Status |
|--------------|------------------|--------|
| `GET /carts/{sessionId}` | `GET /carts/session/{sessionId}` | ⚠️ Update needed |
| `POST /carts/{sessionId}/items` | `POST /carts/{sessionId}/items` | ✅ Ready |
| `PUT /carts/{sessionId}/items/{itemId}/quantity` | `PATCH /carts/{sessionId}/items/{itemId}` | ⚠️ Method change |
| `DELETE /carts/{sessionId}/items/{itemId}` | `DELETE /carts/{sessionId}/items/{itemId}` | ✅ Ready |

### ✅ Product API (Product Service - Port 8083)
| Frontend Call | Backend Endpoint | Status |
|--------------|------------------|--------|
| `GET /products` | `GET /products` | ✅ Ready |
| `GET /products/{id}` | `GET /products/{id}` | ✅ Ready |
| `GET /products/search?q={query}` | `GET /products/search?query={query}` | ⚠️ Param name |
| `GET /products/category/{cat}` | `GET /products/category/{categoryId}` | ✅ Ready |

### ✅ Payment API (Payment Service - Port 8084)
| Frontend Call | Backend Endpoint | Status |
|--------------|------------------|--------|
| `POST /payments/initiate` | `POST /payments/initiate` | ✅ Ready |
| `GET /payments/{id}` | `GET /payments/{transactionId}` | ✅ Ready |
| N/A | `POST /payments/{id}/process` | ➕ New endpoint |

### ✅ Camera API (Camera Service - Port 8085)  
| Frontend Call | Backend Endpoint | Status |
|--------------|------------------|--------|
| `POST /camera/facial-recognition` | `POST /camera/facial-recognition` | ✅ Updated |
| `GET /camera/evidence/{sessionId}` | `GET /camera/evidence/session/{sessionId}` | ✅ Updated |

### ✅ Access API (Access Service - Port 8086)
| Frontend Call | Backend Endpoint | Status |
|--------------|------------------|--------|
| `GET /access/client-types` | `GET /access/client-types` | ✅ Ready |

## 🔧 Required Frontend Updates

### 1. Update Cart API
```typescript
export const cartApi = {
    getCart: async (sessionId: string): Promise<ShoppingCart> => {
        // Change from /carts/{sessionId} to /carts/session/{sessionId}
        const { data } = await apiClient.get<ShoppingCart>(`/carts/session/${sessionId}`);
        return data;
    },

    updateItemQuantity: async (
        sessionId: string,
        itemId: string,
        quantity: number
    ): Promise<ShoppingCart> => {
        // Change from PUT to PATCH
        const { data } = await apiClient.patch<ShoppingCart>(
            `/carts/${sessionId}/items/${itemId}`,
            { quantity }
        );
        return data;
    }
};
```

### 2. Update Product API
```typescript
searchProducts: async (query: string): Promise<Product[]> => {
    // Change param from 'q' to 'query'
    const { data } = await apiClient.get<Product[]>(`/products/search`, {
        params: { query }
    });
    return data;
}
```

### 3. Update Session API
```typescript
closeSession: async (sessionId: string): Promise<void> => {
    // Change from DELETE to POST
    await apiClient.post(`/sessions/${sessionId}/close`);
}
```

## 🚀 Testing the Integration

### 1. Start Backend Services
```bash
cd backend
docker-compose up -d postgres rabbitmq

# Start services individually (7 working services)
cd api-gateway && mvn spring-boot:run
cd session-service && mvn spring-boot:run
cd cart-service && mvn spring-boot:run
cd product-service && mvn spring-boot:run
# etc...
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Verify Connectivity
Open browser console and check:
- Network tab shows requests to `http://localhost:8080/api/*`
- Responses come from backend services
- No CORS errors

## 🔍 Debugging Tips

### Check API Gateway Routes
Visit: `http://localhost:8080/actuator/gateway/routes`

### Check Individual Services
- Session: `http://localhost:8081/health`
- Cart: `http://localhost:8082/health`
- Product: `http://localhost:8083/health`
- Access: `http://localhost:8086/health`
- Inventory: `http://localhost:8087/health`
- WebSocket: `http://localhost:8090/actuator/health`

### Common Issues

**CORS Errors:**
- Verify API Gateway CORS configuration in `application.yml`
- Check browser console for specific CORS error

**404 Not Found:**
- Verify route exists in API Gateway configuration
- Check service is running on expected port

**Connection Refused:**
- Ensure backend service is running
- Check port numbers match configuration

## ✅ What's Already Working

- ✅ API Client configured with interceptors
- ✅ JWT token handling ready
- ✅ Base URL pointing to API Gateway
- ✅ TypeScript types defined
- ✅ Error handling structure
- ✅ Timeout configuration (10 seconds)

## 📝 Next Steps

1. Apply the 3 endpoint updates above
2. Test each service integration individually
3. Implement error handling for specific HTTP codes
4. Add loading states in frontend
5. Test complete user flows (create session → add to cart → payment)
