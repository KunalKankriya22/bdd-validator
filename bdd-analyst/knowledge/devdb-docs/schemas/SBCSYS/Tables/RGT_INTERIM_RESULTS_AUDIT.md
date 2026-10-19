---
tags:
  - table
  - SBCSYS
---
# RGT_INTERIM_RESULTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1010
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 4 | BATCH_ID | VARCHAR2(15) | Yes |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | TEST_SEQ_NO | NUMBER(2) | Yes |  |  |
| 7 | RESULT_CODE | VARCHAR2(4) | Yes |  |  |
| 8 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 9 | INSERT_DATS | DATE | Yes |  |  |
| 10 | EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | FIRST_EXTRACT_DATE | DATE | Yes |  |  |
| 12 | LAST_EXTRACT_DATE | DATE | Yes |  |  |
| 13 | RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | COLL_DATE | DATE | Yes |  |  |
| 15 | RESULTS_QC_DATE | DATE | Yes |  |  |
| 16 | RESULTS_QC_USER | VARCHAR2(6) | Yes |  |  |
| 17 | AUDIT_KEY | NUMBER | Yes |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 19 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 20 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
