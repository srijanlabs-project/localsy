---
id: LOCALISY-DOC-802
title: Routing and Resolution Deep Specification
document: 02-routing-and-resolution.md
version: 1.0
status: Draft
---

# 1. Purpose

Define how Localisy resolves user and page context into the correct locality scope.

# 2. Inputs

- route path
- subdomain
- pincode
- GPS coordinates
- stored user preference

# 3. Resolution Order

1. explicit route or forced locality context
2. valid subdomain mapping
3. valid pincode mapping
4. GPS-based locality resolution if available and permitted
5. manual user selection
6. configured fallback locality or landing page

# 4. Business Rules

- explicit route context wins over inferred context
- only active localities may resolve as primary destinations
- invalid or stale mappings must fail safely into fallback selection

# 5. Edge Cases

- pincode maps to inactive locality
- subdomain exists but locality disabled
- GPS resolves to unsupported locality
- business route points to listing in different locality context

# 6. Test Focus

- routing determinism
- mismatch handling
- fallback correctness
- SEO route preservation
