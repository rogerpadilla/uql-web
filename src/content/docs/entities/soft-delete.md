---
title: Soft Delete
sidebar:
  order: 80
description: Mark rows as deleted without removing them, using a softDelete field.
---

## Soft-Delete

Soft-delete allows you to mark records as "deleted" instead of physically removing them from the database. This is essential for auditing, data recovery, and maintaining relational integrity.

### Configuration

Mark one field with `softDelete` in its `@Field` options. Its presence makes the entity soft-deletable — there's no separate `@Entity` flag. The value controls what gets stamped on delete: pass `true` to stamp `Date.now()`, or a callback (e.g. `() => new Date()`) to stamp anything else. An entity may have at most one soft-delete field.

```ts
import { Entity, Id, Field } from 'uql-orm';

@Entity()
export class User {
  @Id()
  id?: number;

  @Field()
  name?: string;

  /**
   * `softDelete` marks this as the field stamped on delete. The callback decides
   * the value — here a native timestamp; use `softDelete: true` to stamp `Date.now()`.
   */
  @Field({
    type: 'timestamptz',
    softDelete: () => new Date(),
  })
  deletedAt?: Date;
}
```

### Automatic Transformation

When soft-delete is enabled, UQL automatically transforms `delete` operations into `update` operations and adds filters to all `find` operations.

#### 1. Deleting a record
```ts title="You write"
await querier.deleteOneById(User, 1);
```

```sql title="Generated SQL"
UPDATE "User" SET "deletedAt" = $1 WHERE "id" = $2
```

#### 2. Querying records
By default, soft-deleted records are excluded from all queries.

```ts title="You write"
const users = await querier.findMany(User, { $select: { id: true, name: true } });
```

```sql title="Generated SQL"
SELECT "id", "name" FROM "User" WHERE "deletedAt" IS NULL
```

### Advanced: Including Soft-Deleted Records

If you need to include soft-deleted records (e.g., for an admin panel), you can bypass the filter in the query options.

```ts
const allUsers = await querier.findMany(User, {
  $where: { /* your filters */ }
}, { 
  // Bypass soft-delete filter
  softDelete: false 
});
```

