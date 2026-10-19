---
tags:
  - table
  - SBCSYS
---
# TEST_RESULT_STAGING

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 377
**Last Analyzed**: 2026-04-08 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | DATA_STRING | VARCHAR2(3000) | Yes |  |  |
| 3 | EXTERNAL_SOURCE | VARCHAR2(30) | Yes |  |  |
| 4 | FILE_ID | VARCHAR2(240) | Yes |  |  |
| 5 | PROCESSED_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | PROCESSED_DATE | DATE | Yes |  |  |
| 7 | RECORD_ID | NUMBER | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(50) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/TEST_RESULT_STAGING_BI|TEST_RESULT_STAGING_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
