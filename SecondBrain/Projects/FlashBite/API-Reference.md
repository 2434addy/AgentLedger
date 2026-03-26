---
project: FlashBite
type: api-reference
status: active
tags:
  - api
  - nestjs
  - rest
  - websocket
  - razorpay
created: 2026-03-24
---

# FlashBite API Reference

**Base URL:** `http://localhost:3001/api/v1`
**Swagger:** `http://localhost:3001/api/docs`
**Auth:** `Authorization: Bearer <accessToken>` (unless marked Public)

See also [[Architecture]], [[Setup-Guide]].

## Auth Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/send-otp` | Public | Send OTP to phone |
| POST | `/auth/verify-otp` | Public | Verify OTP, issue JWT tokens |
| POST | `/auth/refresh-token` | Public | Refresh access token via cookie |

## Users Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | Bearer | Get current user profile |
| PATCH | `/users/me` | Bearer | Update name, email, avatar |
| GET | `/users/me/addresses` | Bearer | List addresses |
| POST | `/users/me/addresses` | Bearer | Create address |
| PATCH | `/users/me/addresses/:id` | Bearer | Update address |
| DELETE | `/users/me/addresses/:id` | Bearer | Delete address |

## Restaurants Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/restaurants` | Public | List with pagination/filters |
| GET | `/restaurants/search` | Public | Search by cuisine, location, radius |
| GET | `/restaurants/:id` | Public | Restaurant detail |
| GET | `/restaurants/:id/menu` | Public | Menu with categories + items |

## Cart Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cart` | Bearer | Get user's cart |
| POST | `/cart/items` | Bearer | Add item |
| PATCH | `/cart/items/:id` | Bearer | Update quantity |
| DELETE | `/cart/items/:id` | Bearer | Remove item |
| DELETE | `/cart` | Bearer | Clear cart |

## Orders Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | Bearer | Create order from cart |
| GET | `/orders` | Bearer | List user's orders |
| GET | `/orders/:id` | Bearer | Order detail with items |
| PATCH | `/orders/:id/cancel` | Bearer | Cancel order |
| GET | `/orders/:id/track` | Bearer | Tracking history |
| GET | `/orders/:id/driver-location` | Bearer | Delivery partner GPS |
| GET | `/orders/:id/driver` | Bearer | Delivery partner info |
| PATCH | `/orders/:id/status` | Admin/Restaurant/Delivery | Update status |

## Payments Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-order` | Customer | Create Razorpay order |
| POST | `/payments/verify` | Customer | Verify payment signature |
| POST | `/payments/refund` | Customer | Request refund |

## Coupons Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/coupons/validate` | Customer | Validate coupon applicability |
| GET | `/coupons` | Customer | List applicable coupons |

## Delivery Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/delivery/register` | Public | Register as delivery partner |
| PATCH | `/delivery/toggle-online` | DeliveryPartner | Go online/offline |
| GET | `/delivery/dashboard` | DeliveryPartner | Today's summary |
| GET | `/delivery/current` | DeliveryPartner | Active assignment |
| PATCH | `/delivery/location` | DeliveryPartner | Update GPS |
| GET | `/delivery/earnings` | DeliveryPartner | Earnings summary |
| GET | `/delivery/history` | DeliveryPartner | Past deliveries |
| POST | `/delivery/orders/:id/accept` | DeliveryPartner | Accept order |
| POST | `/delivery/orders/:id/reject` | DeliveryPartner | Reject order |
| PATCH | `/delivery/assignments/:id/picked-up` | DeliveryPartner | Mark picked up |
| PATCH | `/delivery/assignments/:id/delivered` | DeliveryPartner | Mark delivered |

## Restaurant Owner Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/restaurant-owner/register` | Public | Register owner |
| GET | `/restaurant-owner/dashboard` | RestaurantOwner | Dashboard summary |
| GET | `/restaurant-owner/restaurant` | RestaurantOwner | Get restaurant |
| POST | `/restaurant-owner/restaurant` | RestaurantOwner | Create restaurant |
| PATCH | `/restaurant-owner/restaurant` | RestaurantOwner | Update restaurant |
| GET | `/restaurant-owner/menu` | RestaurantOwner | Get menu |
| POST | `/restaurant-owner/menu` | RestaurantOwner | Add menu item |
| PATCH | `/restaurant-owner/menu/:id` | RestaurantOwner | Update menu item |
| DELETE | `/restaurant-owner/menu/:id` | RestaurantOwner | Delete menu item |
| GET | `/restaurant-owner/analytics` | RestaurantOwner | Analytics data |
| GET | `/restaurant-owner/reviews` | RestaurantOwner | Reviews list |
| GET | `/restaurant-owner/orders` | RestaurantOwner | Orders list |
| GET | `/restaurant-owner/orders/:id` | RestaurantOwner | Order detail |
| PATCH | `/restaurant-owner/orders/:id/status` | RestaurantOwner | Update order status |
| PATCH | `/restaurant-owner/reviews/:id/reply` | RestaurantOwner | Reply to review |
| PATCH | `/restaurant-owner/toggle-availability` | RestaurantOwner | Toggle availability |

## Admin Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | Admin | KPI statistics |
| GET | `/admin/users` | Admin | List all users |
| GET | `/admin/orders` | Admin | List all orders |
| GET | `/admin/restaurants` | Admin | List all restaurants |
| PATCH | `/admin/restaurants/:id` | Admin | Update restaurant status |

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Server status |

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number is invalid"
  }
}
```

## Error Codes

| Code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 400 | Invalid request body/params |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Insufficient role |
| `RESOURCE_NOT_FOUND` | 404 | Entity doesn't exist |
| `DUPLICATE_RESOURCE` | 409 | Conflict (phone already registered) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `PAYMENT_FAILED` | 402 | Razorpay error |
| `RESTAURANT_CLOSED` | 400 | Outside operating hours |
| `OUT_OF_DELIVERY_RANGE` | 400 | Beyond 7km radius |
| `ORDER_NOT_CANCELLABLE` | 400 | Past READY status |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

| Scope | Limit |
|-------|-------|
| General | 100 req/min per IP |
| Auth | 20 req/min per IP |
| OTP Send | 3 req/min per phone |
| Payments | 5 req/min per user |

## WebSocket Events

**Namespace:** `/tracking` | **Auth:** JWT token via `auth` or query param

| Direction | Event | Payload |
|-----------|-------|---------|
| C→S | `join-order` | `{ orderId }` |
| C→S | `leave-order` | `{ orderId }` |
| C→S | `join:restaurant` | `{ restaurantId }` |
| C→S | `delivery:update_location` | `{ lat, lng }` |
| S→C | `order:status_updated` | `{ orderId, status }` |
| S→C | `order:delivery_location` | `{ lat, lng }` |
| S→C | `order:eta_updated` | `{ orderId, eta }` |
| S→C | `notification:new` | `{ title, body }` |

## Refund Rules

| Category | Auto-Approve | Max Amount | SLA |
|----------|-------------|-----------|-----|
| Missing item | Yes | Item price | < 60s |
| Wrong item | Yes | Item price | < 60s |
| Quality issue | No (manual) | Order total | < 24h |
| Late delivery (>45min) | Yes | Delivery fee | < 60s |
| Order not received | No (manual) | Order total | < 2h |
