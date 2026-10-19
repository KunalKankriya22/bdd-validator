---
tags:
  - table
  - UTIL
---
# VALID_SMRT_MFG_CONFIG

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:49
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SOURCE_LOCATION | VARCHAR2(4) | No |  |  |
| 2 | SOURCE_TYPE | VARCHAR2(5) | No |  |  |
| 3 | SOURCE_VALUE_1 | VARCHAR2(10) | Yes |  |  |
| 4 | SOURCE_VALUE_2 | VARCHAR2(10) | Yes |  |  |
| 5 | SOURCE_VALUE_3 | VARCHAR2(10) | Yes |  |  |
| 6 | TARGET_LOCATION | VARCHAR2(4) | No |  |  |
| 7 | TARGET_VALUES | VARCHAR2(100) | No |  |  |
| 8 | TARGET_APPLY_ON_1 | VARCHAR2(50) | Yes |  |  |
| 9 | TARGET_APPLY_ON_2 | VARCHAR2(50) | Yes |  |  |
| 10 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | EFF_DATE | DATE | No |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
