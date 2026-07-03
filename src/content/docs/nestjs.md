---
title: NestJS
sidebar:
  order: 260
description: Use UQL in NestJS with the UqlModule, injectable querier pool, and auto-generated entity routes.
---

## NestJS Integration

`uql-orm/nestjs` ships a minimal dynamic module that registers your querier pool with Nest's DI container, sets it as UQL's default pool (so everything else works unchanged: middleware, fetch handler, `getQuerier()`, `@Transactional`), and ends the pool on application shutdown.

### Setup

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { UqlModule } from 'uql-orm/nestjs';
import { pool } from './uql.config.js';

@Module({
  imports: [UqlModule.forRoot({ pool })], // global by default; pass global: false to scope it
})
export class AppModule {}
```

### Injecting the pool into services

```ts
import { Inject, Injectable } from '@nestjs/common';
import { UQL_QUERIER_POOL } from 'uql-orm/nestjs';
import type { QuerierPool, Query } from 'uql-orm/type';
import { User } from './shared/models/index.js';

@Injectable()
export class UsersService {
  constructor(@Inject(UQL_QUERIER_POOL) private readonly pool: QuerierPool) {}

  findMany(q: Query<User>) {
    return this.pool.withQuerier((querier) => querier.findMany(User, q));
  }

  create(user: User) {
    return this.pool.transaction((querier) => querier.insertOne(User, user));
  }
}
```

`withQuerier` handles acquire/release; `transaction` adds begin/commit/rollback. Both are built into every `QuerierPool`.

:::note[Why inject the pool and not a querier?]
A `Querier` is a stateful unit of work: it holds a database connection and possibly an open transaction, and it must be acquired and released per operation. Injecting one as a Nest singleton would pin a single connection for the app's lifetime and share transaction state across concurrent requests; making it request-scoped forces the whole provider graph to be re-instantiated per request and still leaves release timing to an interceptor. The pool is the stateless, shareable resource, so it is the right thing to own via DI, and `withQuerier`/`transaction` scope the stateful querier to exactly the lines that need it.
:::

:::note
`UQL_QUERIER_POOL` is for your own providers. UQL's internals (`getQuerier`, `querierMiddleware`, `createFetchHandler`, `@Transactional`) read the default pool that `forRoot` registers, so overriding the DI provider does not redirect them.
:::

### Auto-generated entity routes

Nest's default platform is Express, so the [Express middleware](/extensions-express) mounts directly in `main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { querierMiddleware } from 'uql-orm/express';
import { AppModule } from './app.module.js';
import { User, Post } from './shared/models/index.js';

const app = await NestFactory.create(AppModule);
app.enableShutdownHooks(); // lets UqlModule end the pool on SIGTERM
app.use('/api', querierMiddleware({ include: [User, Post] }));
await app.listen(3000);
```

On the Fastify platform, use [`createFetchHandler` with the bridge recipe](/extensions-http) instead.

:::tip
Use the middleware for entity CRUD and hand-written Nest controllers for everything else; unknown routes fall through, so both coexist under the same prefix.
:::
