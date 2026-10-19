---
tags:
  - table
  - SBCSYS
---
# FR_MASTER_CODES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 77
**Last Analyzed**: 2026-05-22 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CODE_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CODE | VARCHAR2(5) | No |  |  |
| 3 | CODE_DESC | VARCHAR2(50) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 7 | AUDIT_KEY | NUMBER | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**FR_MASTER_CODES_PK**: `CODE_TYPE, CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FR_MASTER_CODES_IDX_1 | NORMAL | UNIQUE | CODE_TYPE, CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/FR_MASTER_CODES_BEFORE_DELETE|FR_MASTER_CODES_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/FR_MASTER_CODES_INSERT_UPDATE|FR_MASTER_CODES_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
