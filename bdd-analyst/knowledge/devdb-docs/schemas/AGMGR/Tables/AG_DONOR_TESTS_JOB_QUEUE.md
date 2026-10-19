---
tags:
  - table
  - AGMGR
---
# AG_DONOR_TESTS_JOB_QUEUE

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 319
**Last Analyzed**: 2026-05-17 11:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | JOB_ID | NUMBER | No | "AGMGR"."ISEQ$$_86900".nextval |  |
| 2 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | COLL_DATE | DATE | Yes |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | RESULT_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | TEST_DATE | DATE | Yes |  |  |
| 8 | TEST_SEQ_NO | NUMBER(2) | Yes |  |  |
| 9 | ACTION_FLAG | VARCHAR2(30) | Yes |  |  |
| 10 | INSERT_DATE | DATE | Yes |  |  |
| 11 | STATUS_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | STATUS_MESSAGE | VARCHAR2(4000) | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/AG_DONOR_TESTS_JOB_QUEUE|AG_DONOR_TESTS_JOB_QUEUE]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
