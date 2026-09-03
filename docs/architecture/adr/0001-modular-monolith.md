# ADR 0001: Modular monolith and central Prisma migrations

Status: Accepted

Gemai remains one deployable NestJS modular monolith with API, worker and relay process roles. PostgreSQL uses the existing central Prisma migration system.

Schema-per-domain and microservices are rejected for this release because they add distributed transactions and operational ownership without improving the current scale target. Context ownership is enforced in application modules, command boundaries, composite tenant keys and tests.

PostGIS is rejected. Calendar overlap exclusion uses PostgreSQL range types with `btree_gist`. A generic workflow engine is rejected; the existing versioned Flow product remains the automation runtime.
