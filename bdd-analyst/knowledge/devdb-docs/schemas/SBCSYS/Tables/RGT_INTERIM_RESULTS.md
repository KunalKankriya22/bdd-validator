---
tags:
  - table
  - SBCSYS
---
# RGT_INTERIM_RESULTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 572
**Last Analyzed**: 2025-09-16 03:14:35
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | CONTRACT_ID | VARCHAR2(9) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | BATCH_ID | VARCHAR2(15) | No |  |  |
| 5 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 6 | TEST_SEQ_NO | NUMBER(2) | Yes |  |  |
| 7 | RESULT_CODE | VARCHAR2(4) | Yes |  |  |
| 8 | INSERT_USER_ID | VARCHAR2(6) | Yes |  |  |
| 9 | INSERT_DATS | DATE | Yes |  |  |
| 10 | EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 12 | FIRST_EXTRACT_DATE | DATE | Yes |  |  |
| 13 | LAST_EXTRACT_DATE | DATE | Yes |  |  |
| 14 | RESULT_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | COLL_DATE | DATE | No |  |  |
| 16 | RESULTS_QC_DATE | DATE | Yes |  |  |
| 17 | RESULTS_QC_USER | VARCHAR2(6) | Yes |  |  |
| 18 | AUDIT_KEY | NUMBER | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/RGT_INTERIM_RESULTS_BD|RGT_INTERIM_RESULTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_INTERIM_RESULTS_BI|RGT_INTERIM_RESULTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/RGT_INTERIM_RESULTS_BU|RGT_INTERIM_RESULTS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
