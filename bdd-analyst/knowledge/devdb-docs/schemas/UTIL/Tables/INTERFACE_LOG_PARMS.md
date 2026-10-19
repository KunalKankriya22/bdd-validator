---
tags:
  - table
  - UTIL
---
# INTERFACE_LOG_PARMS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 30722418
**Last Analyzed**: 2026-02-24 04:00:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INTERFACE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | TEST_GROUP | VARCHAR2(10) | Yes |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | FROM_DATE | DATE | Yes |  |  |
| 7 | TO_DATE | DATE | Yes |  |  |

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
