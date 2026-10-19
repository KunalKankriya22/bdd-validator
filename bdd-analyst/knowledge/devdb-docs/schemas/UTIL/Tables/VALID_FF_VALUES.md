---
tags:
  - table
  - UTIL
---
# VALID_FF_VALUES

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 18
**Last Analyzed**: 2026-05-01 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | COLL_ID | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | SOURCE_TYPE | VARCHAR2(5) | No |  |  |
| 4 | SOURCE_CODE | VARCHAR2(2) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | LAST_MODIFIED_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/UTIL/Triggers/VALID_FF_VALUES_BD|VALID_FF_VALUES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/VALID_FF_VALUES_BI|VALID_FF_VALUES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/UTIL/Triggers/VALID_FF_VALUES_BU|VALID_FF_VALUES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
