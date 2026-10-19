---
tags:
  - table
  - SBCSYS
---
# SYSTEM_ERROR_LOG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 188
**Last Analyzed**: 2025-09-17 03:00:48
**Partitioned**: NO

> [!quote] log of system errors

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MODULE_NAME | VARCHAR2(8) | No |  |  |
| 2 | INSERT_DATS | DATE | No |  |  |
| 3 | USER_ID | VARCHAR2(10) | No |  |  |
| 4 | STATEMENT_ID | VARCHAR2(6) | No |  |  |
| 5 | ERROR_KEY | VARCHAR2(70) | Yes |  |  |
| 6 | ERROR_DESC | VARCHAR2(2000) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SYSTEM_ERROR_LOG_IDX_1 | NORMAL | NONUNIQUE | INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
