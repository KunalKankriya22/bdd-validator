---
tags:
  - table
  - SBCSYS
---
# CNF_EXTRACT_UNITS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 27
**Last Analyzed**: 2026-05-09 11:01:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EXTRACT_ID | VARCHAR2(20) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | BATCH_ID | VARCHAR2(14) | Yes |  |  |
| 6 | CONTRACT_ID | VARCHAR2(9) | Yes |  |  |
| 7 | OS_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 8 | QC_DATE | DATE | Yes |  |  |
| 9 | RECEIVED_DATE | DATE | Yes |  |  |
| 10 | TEST_SERIES_ID | VARCHAR2(10) | Yes |  |  |
| 11 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 12 | SELECT_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | QC_USER | VARCHAR2(30) | Yes |  |  |
| 18 | RE_EXTRACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 19 | EXTRACT_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/CNF_EXTRACT_UNITS_BI|CNF_EXTRACT_UNITS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| CNPREXTR | PACKAGE | SBCSYS |
