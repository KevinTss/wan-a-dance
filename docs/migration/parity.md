# Parity matrix — legacy NestJS API → platform

Every legacy endpoint and e2e suite, its target release, and status. Update the row in the PR that ports it.
Status: `todo` · `ported` (core + tests) · `done` (core + API + UI + e2e) · `deferred (Rx)` · `dropped` (with reason).

## Endpoints (82)

| Module       | Endpoint                                                                     | Release                                | Status    |
| ------------ | ---------------------------------------------------------------------------- | -------------------------------------- | --------- |
| auth         | POST /auth/sign-up                                                           | R1 (email code) / R2 (password, reset) | todo      |
| auth         | POST /auth/sign-in                                                           | R1 (email code) / R2 (password, reset) | todo      |
| auth         | POST /auth/refresh-token                                                     | R1 (email code) / R2 (password, reset) | todo      |
| auth         | POST /auth/forgot-password                                                   | R1 (email code) / R2 (password, reset) | todo      |
| auth         | POST /auth/reset-password                                                    | R1 (email code) / R2 (password, reset) | todo      |
| auth         | POST /auth/verify-email                                                      | R1 (email code) / R2 (password, reset) | todo      |
| auth         | POST /auth/resend-verification                                               | R1 (email code) / R2 (password, reset) | todo      |
| auth         | GET /auth/me                                                                 | R1 (email code) / R2 (password, reset) | todo      |
| auth         | PATCH /auth/change-password                                                  | R1 (email code) / R2 (password, reset) | todo      |
| credits      | POST /workspaces/:slug/events/:eventId/attendees                             | R1 (manual) / R2                       | todo      |
| credits      | DELETE /workspaces/:slug/events/:eventId/attendees/:attendeeId               | R1 (manual) / R2                       | todo      |
| credits      | PUT /workspaces/:slug/events/:eventId/cancellation-policy                    | R1 (manual) / R2                       | todo      |
| credits      | POST /workspaces/:slug/products                                              | R1 (manual) / R2                       | todo      |
| credits      | GET /workspaces/:slug/products                                               | R1 (manual) / R2                       | todo      |
| credits      | PATCH /workspaces/:slug/products/:productId                                  | R1 (manual) / R2                       | todo      |
| credits      | POST /workspaces/:slug/products/:productId/prices                            | R1 (manual) / R2                       | todo      |
| credits      | POST /workspaces/:slug/purchases                                             | R1 (manual) / R2                       | todo      |
| credits      | PATCH /workspaces/:slug/purchases/:purchaseId/confirm                        | R1 (manual) / R2                       | todo      |
| credits      | PATCH /workspaces/:slug/purchases/:purchaseId/cancel                         | R1 (manual) / R2                       | todo      |
| credits      | PATCH /workspaces/:slug/purchases/:purchaseId/refund                         | R1 (manual) / R2                       | todo      |
| credits      | POST /workspaces/:slug/members/:memberId/grants                              | R1 (manual) / R2                       | todo      |
| credits      | DELETE /workspaces/:slug/members/:memberId/grants/:grantId                   | R1 (manual) / R2                       | todo      |
| event        | POST /workspaces/:slug/events                                                | R1                                     | todo      |
| event        | GET /workspaces/:slug/events                                                 | R1                                     | todo      |
| event        | GET /workspaces/:slug/events/:eventId                                        | R1                                     | todo      |
| event        | PATCH /workspaces/:slug/events/:eventId                                      | R1                                     | todo      |
| event        | PATCH /workspaces/:slug/events/:eventId/future                               | R1                                     | todo      |
| event        | POST /workspaces/:slug/events/:eventId/cancel                                | R1                                     | todo      |
| event        | POST /workspaces/:slug/events/participants                                   | R1                                     | todo      |
| event        | POST /workspaces/:slug/events/:eventId/registrations                         | R1                                     | todo      |
| event        | PATCH /workspaces/:slug/events/:eventId/registrations/:registrationId/cancel | R1                                     | todo      |
| event        | POST /workspaces/:slug/events/:eventId/self-register                         | R1                                     | todo      |
| invitation   | GET /invitations                                                             | R1                                     | todo      |
| invitation   | POST /invitations/workspace/:slug                                            | R1                                     | todo      |
| invitation   | POST /invitations/event/:slug                                                | R1                                     | todo      |
| invitation   | GET /invitations/workspace/:slug                                             | R1                                     | todo      |
| invitation   | GET /invitations/token/:token                                                | R1                                     | todo      |
| invitation   | POST /invitations/accept/:token                                              | R1                                     | todo      |
| invitation   | POST /invitations/decline/:token                                             | R1                                     | todo      |
| material     | POST /materials                                                              | R3                                     | todo      |
| material     | GET /materials                                                               | R3                                     | todo      |
| material     | GET /materials/shared                                                        | R3                                     | todo      |
| material     | GET /materials/:id                                                           | R3                                     | todo      |
| material     | PATCH /materials/:id                                                         | R3                                     | todo      |
| material     | DELETE /materials/:id                                                        | R3                                     | todo      |
| material     | POST /materials/:id/share/:studentId                                         | R3                                     | todo      |
| material     | POST /materials/:id/view                                                     | R3                                     | todo      |
| member       | GET /workspaces/:slug/members                                                | R1                                     | todo      |
| member       | POST /workspaces/:slug/members                                               | R1                                     | todo      |
| member       | GET /workspaces/:slug/members/:id                                            | R1                                     | todo      |
| member       | PATCH /workspaces/:slug/members/:memberId                                    | R1                                     | todo      |
| member       | DELETE /workspaces/:slug/members/:memberId                                   | R1                                     | todo      |
| member       | DELETE /workspaces/:slug/members                                             | R1                                     | todo      |
| member       | GET /workspaces/:slug/members/:memberId/dance-levels                         | R1                                     | todo      |
| member       | PUT /workspaces/:slug/members/:memberId/dance-levels/:danceType              | R1                                     | todo      |
| member       | DELETE /workspaces/:slug/members/:memberId/dance-levels/:danceType           | R1                                     | todo      |
| member       | PATCH /workspaces/:slug/members/:memberId/status                             | R1                                     | todo      |
| member       | GET /workspaces/:slug/members/:memberId/status-history                       | R1                                     | todo      |
| notification | POST /notifications                                                          | R3                                     | todo      |
| notification | GET /notifications                                                           | R3                                     | todo      |
| notification | GET /notifications/unread-count                                              | R3                                     | todo      |
| notification | GET /notifications/:id                                                       | R3                                     | todo      |
| notification | PATCH /notifications/mark-all-read                                           | R3                                     | todo      |
| notification | PATCH /notifications/:id                                                     | R3                                     | todo      |
| ping         | GET /ping                                                                    | R0 (/api/v1/health)                    | done (R0) |
| user         | GET /users                                                                   | R6 (admin)                             | todo      |
| user         | GET /users/:id                                                               | R6 (admin)                             | todo      |
| user         | PATCH /users/:id                                                             | R6 (admin)                             | todo      |
| user         | DELETE /users/:id                                                            | R6 (admin)                             | todo      |
| whatsapp     | PATCH /workspaces/:slug/members/:memberId/whatsapp                           | R3                                     | todo      |
| whatsapp     | DELETE /workspaces/:slug/members/:memberId/whatsapp                          | R3                                     | todo      |
| whatsapp     | POST /workspaces/:slug/members/:memberId/whatsapp/send                       | R3                                     | todo      |
| whatsapp     | GET /workspaces/:slug/whatsapp/usage                                         | R3                                     | todo      |
| whatsapp     | GET /whatsapp/webhook                                                        | R3                                     | todo      |
| whatsapp     | POST /whatsapp/webhook                                                       | R3                                     | todo      |
| workspace    | POST /workspaces                                                             | R1                                     | todo      |
| workspace    | GET /workspaces                                                              | R1                                     | todo      |
| workspace    | GET /workspaces/:slug                                                        | R1                                     | todo      |
| workspace    | PATCH /workspaces/:slug                                                      | R1                                     | todo      |
| workspace    | PATCH /workspaces/:slug/configuration                                        | R1                                     | todo      |
| workspace    | DELETE /workspaces/:slug                                                     | R1                                     | todo      |
| workspace    | GET /workspaces/:slug/materials                                              | R1                                     | todo      |

## Legacy e2e suites

| Module    | File                  | Cases | Release                                | Status |
| --------- | --------------------- | ----- | -------------------------------------- | ------ |
| auth      | auth.e2e.spec.ts      | 30    | R1 (email code) / R2 (password, reset) | todo   |
| event     | event.e2e.spec.ts     | 14    | R1                                     | todo   |
| material  | material.e2e.spec.ts  | 2     | R3                                     | todo   |
| member    | member.e2e.spec.ts    | 61    | R1                                     | todo   |
| user      | user.e2e.spec.ts      | 18    | R6 (admin)                             | todo   |
| workspace | workspace.e2e.spec.ts | 3     | R1                                     | todo   |

## Already covered in R0

- Auth: email OTP sign-up/sign-in, wrong/expired/reused code, lockout, rate limit, existing-user sign-in (`packages/auth/src/auth.test.ts`, `apps/e2e/tests/ui/auth.spec.ts`).
- Health/version (`/api/v1/health`).
