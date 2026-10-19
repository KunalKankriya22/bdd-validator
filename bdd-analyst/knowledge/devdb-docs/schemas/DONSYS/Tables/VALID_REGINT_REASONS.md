---
tags:
  - table
  - DONSYS
---
# VALID_REGINT_REASONS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 46
**Last Analyzed**: 2026-04-23 03:00:05
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTER_REASON | VARCHAR2(10) | No |  |  |
| 2 | INTER_CODE | VARCHAR2(5) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_REGINT_REASONS_PK**: `INTER_REASON, INTER_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_REGINT_REASONS_AUDIT_IDX | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| VALID_REGINT_REASONS_PK | NORMAL | UNIQUE | INTER_REASON, INTER_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_REGINT_REASONS_BD|VALID_REGINT_REASONS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_REGINT_REASONS_BI|VALID_REGINT_REASONS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_REGINT_REASONS_BU|VALID_REGINT_REASONS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| GENBDR | PACKAGE | DONSYS |
