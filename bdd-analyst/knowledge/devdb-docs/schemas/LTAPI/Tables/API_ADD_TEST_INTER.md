---
tags:
  - table
  - LTAPI
---
# API_ADD_TEST_INTER

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EXT_BATCH_ID | VARCHAR2(20) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(16) | No |  |  |
| 4 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 5 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | CANCEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | INTER_RELEASE_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | PROCESS_STATUS | VARCHAR2(1) | Yes |  |  |
| 9 | PROCESS_DATE | DATE | Yes |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_KEY | NUMBER(10) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/LTAPI/Triggers/API_ADD_TEST_INTER_BI|API_ADD_TEST_INTER_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
