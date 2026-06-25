---
title: FAQ
sidebar:
  order: 600
  label: FAQ
description: Frequently asked questions about UQL ORM
---

## Getting Started

### What is UQL and when should I use it?

UQL is a JSON-native ORM for TypeScript that offers:
- **Serializable queries** — Queries are plain JSON objects you can cache, send over HTTP, or store
- **No codegen** — Your TypeScript classes are the schema, no build step needed
- **One API everywhere** — Same syntax works on PostgreSQL, MySQL, MongoDB, SQLite, and edge runtimes
- **Zero-allocation engine** — 3.9M+ ops/s query generation performance

Use UQL when you want Prisma-level ergonomics at query-builder speed, especially for:
- AI/RAG applications with semantic search
- Multi-tenant SaaS across multiple databases
- High-concurrency APIs needing predictable latency

### How is UQL different from Prisma, Drizzle, or TypeORM?

| Feature | UQL | Prisma | Drizzle | TypeORM |
|---------|-----|--------|---------|---------|
| Query format | JSON object | Object literal | Function chains | Method chains |
| Codegen | None needed | Required | None | None |
| Multi-DB API | One syntax | Separate per-database | Separate per-database | Separate per-database |
| Browser queries | First-class | Not supported | Manual | Manual |
| Vector search | Native operator | Raw SQL | Raw SQL | Raw SQL |

### Is UQL production-ready?

Yes. UQL powers [Variability.ai](https://variability.ai), an AI meeting intelligence platform processing thousands of requests daily. The ORM is battle-tested in production.

---

## Installation & Setup

### Which database drivers do I need?

| Database | Driver Package |
|----------|----------------|
| PostgreSQL | `pg` |
| MySQL | `mysql2` |
| MariaDB | `mariadb` or `mysql2` |
| SQLite | `better-sqlite3` |
| MongoDB | `mongodb` |
| Bun SQL Native | Built-in (no install) |
| Cloudflare D1 | `uql-orm/d1` |
| Neon | `@neondatabase/serverless` |

For Bun, you don't need external drivers — Bun's native SQL supports PostgreSQL, MySQL, and SQLite out of the box.

### Do I need special TypeScript configuration?

If using **decorators** (`@Entity()`, `@Field()`):
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

If using the **imperative API** (`defineEntity`), no special configuration needed.

Always ensure `"module": "NodeNext"` or `"module": "ESNext"` in your `tsconfig.json`.

---

## Core Concepts

### What does "JSON-native" mean?

A UQL query is a plain JavaScript object:

```ts
{
  $select: { id: true, name: true },
  $where: { email: { $endsWith: '@uql-orm.dev' } },
  $sort: { createdAt: 'desc' },
  $limit: 10
}
```

This means:
- ✅ You can `JSON.stringify()` and send over HTTP
- ✅ Cache queries easily
- ✅ Diff queries programmatically
- ✅ Share between backend and frontend

### What's the difference between `type` and `columnType`?

Use `type` for portability, `columnType` for precise SQL control:

```ts
// ✅ RECOMMENDED: Cross-database portable
@Field({ type: 'uuid' })

// ⚠️ USE RARELY: Exact SQL control
@Field({ columnType: 'CHAR(36)' })
```

`type: 'uuid'` generates `UUID` on Postgres but `CHAR(36)` on MySQL automatically.

### What's the difference between `$select` and `$populate`?

- **`$select`** — Scalar fields (strings, numbers, dates, JSON)
- **`$populate`** — Related entities (relations)

```ts
{
  $select: { id: true, name: true },           // scalar fields
  $populate: { posts: { $select: { title: true } } }  // relations
}
```

---

## Queries & Relations

### How do I filter by nested JSON properties?

Use dot-notation paths in `$where`:

```ts
await querier.findMany(Company, {
  $where: {
    'settings.isArchived': { $ne: true },
    'settings.theme': 'dark',
  },
});
```

Works across all SQL dialects — UQL generates dialect-specific SQL automatically.

### How do I join relations?

```ts
await querier.findMany(Post, {
  $select: {
    id: true,
    title: true,
    author: {
      $select: { id: true, name: true }
    }
  },
  $where: { author: { name: 'Roger' } }
});
```

UQL automatically generates efficient SQL with joins.

### How do I count related records?

```ts
await querier.findMany(Category, {
  $where: {
    measureUnits: { $size: { $gte: 2 } }
  }
});
```

Uses efficient `COUNT(*)` subqueries.

---

## Migrations & Schema

### Do I need to write SQL migrations manually?

No. UQL uses an **Entity-First** approach:

```bash
# 1. Update your entity class
# 2. Auto-generate the migration
npx uql-migrate generate:entities add_user_nickname

# 3. Apply it
npx uql-migrate up
```

UQL diffs your entities against the live database and generates the exact SQL.

### Can I still write manual migrations?

Yes. Use `generate` for manual SQL:

```bash
npx uql-migrate generate seed_default_roles
# Edit the generated file
npx uql-migrate up
```

---

## Advanced Features

### How does vector search work?

```ts
const results = await querier.findMany(Article, {
  $sort: {
    embedding: {
      $vector: queryEmbedding,
      $distance: 'cosine',
      $project: 'similarity'
    }
  },
  $limit: 10
});
```

Works on PostgreSQL (pgvector), MySQL 8.4+, MariaDB 11.4+, SQLite (sqlite-vec), and MongoDB Atlas — all with the same query syntax.

### What's the performance like?

UQL achieves 3.9M+ ops/s in our [open benchmark](/comparison#performance) by using:
- Zero-allocation query generation
- Pre-computed schema lookups at startup
- Efficient query planning

On average, UQL is ~2.4× faster than the next fastest ORM.

---

## Troubleshooting

### Why am I getting "Decorators not working"?

1. Ensure `experimentalDecorators` and `emitDecoratorMetadata` in `tsconfig.json`
2. Set `"module": "NodeNext"` or `"module": "ESNext"`
3. Ensure `"type": "module"` in `package.json`
4. Use `.js` extensions in imports (TypeScript resolves to `.ts`)

### Why am I getting "Connection refused"?

1. Verify your database is running
2. Check credentials in `uql.config.ts`
3. Ensure the database exists (`createdb your_db`)
4. For Docker, verify network settings and port mappings

### Why is my query slow?

1. Check if you're missing indexes on filtered columns
2. Use `findManyStream` for large result sets
3. Consider pagination with `$limit` and `$skip`
4. Profile with `console.time()` to identify bottlenecks

---

## Ecosystem & Integrations

### How do I use UQL with Express?

```ts
import express from 'express';
import { querierMiddleware } from 'uql-orm/express';

const app = express();
app.use(express.json());

app.use('/api', querierMiddleware({
  include: [User, Post]
}));
```

Auto-generates REST endpoints for your entities.

### How do I use UQL in the browser?

```ts
import { HttpQuerier } from 'uql-orm/browser';

const querier = new HttpQuerier('/api');
const users = await querier.findMany(User, {
  $where: { status: 'active' }
});
```

Use the same syntax as the backend with type-safe queries.

### Can I use UQL with Cloudflare Workers?

Yes. Use `uql-orm/d1` for Cloudflare D1:

```ts
import { D1QuerierPool } from 'uql-orm/d1';

const pool = new D1QuerierPool(DATABASE);
```

---

## Gotchas & Best Practices

### What should I avoid?

1. **Loading all relations** — Use `$select` on relations to limit fields
2. **N+1 queries** — UQL prevents this automatically with relation loading
3. **Large result sets** — Use `findManyStream` for memory efficiency
4. **Blocking hooks** — Keep `after*` hooks fast or use a queue

### What's the recommended project structure?

```
src/
├── entities/
│   ├── User.ts
│   ├── Post.ts
│   └── index.ts
├── uql.config.ts
└── app.ts
```

Export both config and pool from `uql.config.ts` for migrations:

```ts
export default { pool, entities } satisfies Config;
export { pool };
```

---

<LinkCard title="Join our Discord" href="https://discord.gg/uql" description="Ask questions and get help from the community" />
<LinkCard title="View on GitHub" href="https://github.com/rogerpadilla/uql" description="Report issues and contribute" />
