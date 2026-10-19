---
tags:
  - table
  - AGMGR
---
# AG_DONOR_TESTS_DET

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1739
**Last Analyzed**: 2025-11-04 04:00:23
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | ANTIGEN_CODE | VARCHAR2(10) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | TEST_TYPE | VARCHAR2(5) | No |  |  |
| 5 | TEST_DATE | DATE | No |  |  |
| 6 | TEST_RESULT | VARCHAR2(5) | No |  |  |
| 7 | LICENSED_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | CONFIRM_STATUS | VARCHAR2(1) | Yes |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 11 | TEST_SEQ_NO | NUMBER(2) | Yes |  |  |
| 12 | PRIMARY_RULE_ID | NUMBER(7) | Yes |  |  |
| 13 | RULE_ID | NUMBER(7,2) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | Yes |  |  |
| 15 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 16 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 17 | EXCLUDE_FLAG | VARCHAR2(1) | Yes |  |  |
| 18 | COLL_DATE | DATE | Yes |  |  |
| 19 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 20 | ANTIGEN_GROUP | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| AG_DONOR_TESTS_DET_DAT | NORMAL | NONUNIQUE | DONOR_ID, ANTIGEN_CODE, TEST_ID, UNIT_ID | VALID |
| AG_DONOR_TESTS_HDR_DA | NORMAL | NONUNIQUE | DONOR_ID, ANTIGEN_CODE | VALID |

## Triggers

- [[schemas/AGMGR/Triggers/AG_DONOR_TESTS_DET_BD|AG_DONOR_TESTS_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/AGMGR/Triggers/AG_DONOR_TESTS_DET_BI|AG_DONOR_TESTS_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/AGMGR/Triggers/AG_DONOR_TESTS_DET_BU|AG_DONOR_TESTS_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
