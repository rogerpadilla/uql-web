---
title: Soft Delete
sidebar:
  order: 80
description: Mark rows as deleted without removing them, using a softDelete field.
---

## Soft-Delete

Soft-delete allows you to mark records as "deleted" instead of physically removing them from the database. This is essential for auditing, data recovery, and maintaining relational integrity.

### Configuration

Mark one field with `softDelete` in its `@Field` options. Its presence makes the entity soft-deletable - there's no separate `@Entity` flag. The value controls what gets stamped on delete: pass `true` to stamp the current timestamp (`new Date()`), or a callback (e.g. `() => Date.now()` for an epoch-millis column) to stamp anything else. An entity may have at most one soft-delete field.

```ts
import { Entity, Id, Field } from 'uql-orm';

@Entity()
export class User {
  @Id()
  id?: number;

  @Field()
  name?: string;

  /**
   * `softDelete` marks this as the field stamped on delete. `softDelete: true` stamps the
   * current timestamp (`new Date()`) - so for this column it's equivalent to the callback below;
   * pass a callback only when you need a different value (e.g. `() => Date.now()`).
   */
  @Field({
    type: 'timestamptz',
    softDelete: true,
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
-- Only already-live rows are stamped
UPDATE "User" SET "deletedAt" = $1 WHERE "id" = $2 AND "deletedAt" IS NULL
```

#### 2. Querying records
By default, soft-deleted records are excluded from all queries.

```ts title="You write"
const users = await querier.findMany(User, { $select: { id: true, name: true } });
```

```sql title="Generated SQL"
SELECT "id", "name" FROM "User" WHERE "deletedAt" IS NULL
```

Under the hood, soft-delete is the built-in **`softDelete`** [query filter](/querying/filters) (auto-registered from the `@Field({ softDelete })` above), so it composes with any other filters you define.

### Reading trashed rows

**Only trashed** - just constrain the field in your `$where`. The soft-delete filter steps aside for any key you set, so this is a plain, serializable query (no helper, no special option):

```ts
const trashed = await querier.findMany(User, { $where: { deletedAt: { $ne: null } } });
// generates: ... WHERE deletedAt IS NOT NULL
```

**Live + trashed** - this fully turns the filter off, so it's a server-side option (`withDeleted()`), not part of the serializable query - the same reason filter bypass never crosses the HTTP wire:

```ts
import { withDeleted } from 'uql-orm';

const all = await querier.findMany(User, { $where: { /* ... */ } }, withDeleted());
```

### Restoring

`restore` un-deletes rows by setting the soft-delete field back to `null` (it finds trashed rows even though the filter is normally on):

```ts
await querier.restoreOneById(User, 1);
await querier.restoreMany(User, { $where: { companyId: 5 } });
```

### Hard Delete

Pass `{ hardDelete: true }` to permanently remove rows instead of stamping them (this ignores the soft-delete filter, so already-deleted rows are removed too):

```ts
await querier.deleteOneById(User, 1, { hardDelete: true });
await querier.deleteMany(User, { $where: { companyId: 5 } }, { hardDelete: true });
```

Soft-delete restore does not cascade - restore related entities explicitly if needed.

