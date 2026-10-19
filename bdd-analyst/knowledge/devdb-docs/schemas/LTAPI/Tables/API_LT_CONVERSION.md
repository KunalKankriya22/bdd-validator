---
tags:
  - table
  - LTAPI
---
# API_LT_CONVERSION

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 231
**Last Analyzed**: 2025-07-18 03:04:41
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SOURCE_APPL_ID | VARCHAR2(15) | Yes |  |  |
| 2 | SOURCE_VALUE_TYPE | VARCHAR2(50) | Yes |  |  |
| 3 | SOURCE_VALUE | VARCHAR2(15) | Yes |  |  |
| 4 | TARGET_APPL_ID | VARCHAR2(15) | Yes |  |  |
| 5 | TARGET_VALUE_TYPE | VARCHAR2(50) | Yes |  |  |
| 6 | TARGET_VALUE | VARCHAR2(15) | Yes |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | INSERT_DATE | DATE | Yes |  |  |
| 10 | LAST_MOD_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

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
