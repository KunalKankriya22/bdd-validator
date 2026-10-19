---
tags:
  - table
  - SBCSYS
---
# RGT_ADHOC_TESTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | PROFILE_SET_ID | VARCHAR2(20) | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_ADHOC_TESTS_BI|RGT_ADHOC_TESTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
