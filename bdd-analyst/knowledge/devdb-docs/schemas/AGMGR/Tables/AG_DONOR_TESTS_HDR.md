---
tags:
  - table
  - AGMGR
---
# AG_DONOR_TESTS_HDR

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1243
**Last Analyzed**: 2025-10-02 03:00:20
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | ANTIGEN_CODE | VARCHAR2(10) | No |  |  |
| 3 | RESULT_CODE | VARCHAR2(10) | Yes |  |  |
| 4 | CONFIRM_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | CONFIRM_DATE | DATE | Yes |  |  |
| 6 | RESULT_PENDING | NUMBER | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | PRIMARY_RULE_ID | NUMBER(7) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | ANTIGEN_GROUP | VARCHAR2(10) | Yes |  |  |
| 13 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/AGMGR/Triggers/AG_DONOR_TESTS_HDR_BD|AG_DONOR_TESTS_HDR_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/AGMGR/Triggers/AG_DONOR_TESTS_HDR_BI|AG_DONOR_TESTS_HDR_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/AGMGR/Triggers/AG_DONOR_TESTS_HDR_BU|AG_DONOR_TESTS_HDR_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
