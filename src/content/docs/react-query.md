---
title: React Query
sidebar:
  order: 280
description: Use UQL's serializable queries as TanStack Query cache keys for a typed data layer.
---

## React Query (TanStack Query) Recipe

A UQL query is a plain JSON object, which makes it a perfect **structural `queryKey`**: two components asking for the same data share one cache entry automatically, with no hand-maintained key strings.

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getQuerier } from 'uql-orm/browser';
import type { Query, Type } from 'uql-orm/type';
import { User } from './shared/models/index.js';

const querier = getQuerier();

export function useUqlFindMany<E extends object>(entity: Type<E>, q: Query<E>) {
  return useQuery({
    queryKey: [entity.name, q], // the serializable query IS the cache key
    queryFn: async () => (await querier.findMany(entity, q, { silent: true })).data,
  });
}

export function useUqlInsert<E extends object>(entity: Type<E>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: E) => querier.insertOne(entity, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [entity.name] }),
  });
}
```

Usage in a component:

```tsx
function ActiveUsers() {
  const { data: users, isLoading } = useUqlFindMany(User, {
    $where: { status: 'active' },
    $sort: { createdAt: 'desc' },
    $limit: 20,
  });
  // users is typed User[] | undefined
}
```

Invalidation works at any granularity: `[entity.name]` invalidates every query for that entity, while `[entity.name, q]` targets one exact query.

:::tip
React Query already owns loading and error state, so pass `{ silent: true }` and skip UQL's notification bus. For SSR, create a per-request client with scoped auth headers: `new HttpQuerier('/api', { headers })` (see the [Browser Extension](/extensions-browser)).
:::
