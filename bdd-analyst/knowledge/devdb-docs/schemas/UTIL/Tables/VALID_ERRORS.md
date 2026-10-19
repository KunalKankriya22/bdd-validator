---
tags:
  - table
  - UTIL
---
# VALID_ERRORS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2505
**Last Analyzed**: 2026-04-14 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ERROR_CODE | VARCHAR2(5) | No |  |  |
| 2 | ERROR_TYPE | VARCHAR2(1) | No |  |  |
| 3 | ERROR | VARCHAR2(70) | No |  |  |
| 4 | AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**VALID_ERRORS_PK**: `ERROR_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ERRORS_PK | NORMAL | UNIQUE | ERROR_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
