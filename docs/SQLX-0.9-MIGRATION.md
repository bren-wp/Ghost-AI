# SQLx 0.9 migration — reviewed dynamic SQL

SQLx 0.9 requires an explicit `sqlx::AssertSqlSafe` at callsites using
constructed SQL strings. This change updates 53 such query calls in 19 source
files, including statement-building inside schema migrations.

**Security review:**
- `soft_delete::tombstone_update` uses only table names present in
  `wipe_fragment`'s hard-coded whitelist; callers provide fixed SQL
  predicates or internal generated message-tree predicates. Runtime record
  identifiers and dates are bound using `.bind()`.
- SQLite schema migrations construct names from in-source static arrays and
  fixed column declarations. `PRAGMA user_version` interpolates an `i32`,
  not untrusted SQL.
- Message ancestry/deletion uses fixed recursive-CTE templates and bound IDs.
- Model-preset optional update clauses come from a literal list of column
  assignments and `?` markers; field values remain bound.
- Tool/attachment `IN` statements generate only `?` placeholders, matching
  the number of items. The items are bound separately.
- Search, fetch, skill and translation-history SELECT/UPDATE fragments use
  in-source SQL constant columns and in-source fixed clauses.

`AssertSqlSafe` does **not** sanitize SQL. Treat every new dynamic
interpolation as a security review requirement. Never interpolate user-provided
values into the SQL string: use prepared statements with bind parameters.
Prefer static SQL or a SQLx QueryBuilder for future query construction. Keep
Windows native builds, DB tests and `tests/test_sqlx_safe_queries.py` in CI.
