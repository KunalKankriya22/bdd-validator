---
tags:
  - table
  - DONSYS
---
# HEALTH_HISTORY_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 607434
**Last Analyzed**: 2025-10-29 03:00:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | ACTION_CODE | VARCHAR2(1) | No |  |  |
| 6 | COLUMN_NAME | VARCHAR2(50) | No |  |  |
| 7 | OLD_VALUE | VARCHAR2(240) | Yes |  |  |
| 8 | NEW_VALUE | VARCHAR2(240) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| HEALTH_HISTORY_AUDIT_CO | NORMAL | NONUNIQUE | COLUMN_NAME, OLD_VALUE | VALID |
| HEALTH_HISTORY_AUDIT_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
