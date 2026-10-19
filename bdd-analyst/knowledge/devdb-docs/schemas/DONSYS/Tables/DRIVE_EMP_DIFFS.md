---
tags:
  - table
  - DONSYS
---
# DRIVE_EMP_DIFFS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 11
**Last Analyzed**: 2025-09-16 03:13:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 4 | DIFF_CODE | VARCHAR2(5) | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 6 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |

## Primary Key

**DRIVE_EMP_DIFFS_PK**: `DRIVE_ID, CHAPTER_ID, STAFF_NO, DIFF_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DRIVE_EMP_DRIVE_EMP_DIFFS_FK | DRIVE_ID, CHAPTER_ID, STAFF_NO | [[schemas/DONSYS/Tables/DRIVE_EMPLOYEES\|DONSYS.DRIVE_EMPLOYEES]] (DRIVE_ID, CHAPTER_ID, STAFF_NO) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_EMP_DIFFS_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, STAFF_NO, DIFF_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_EMP_DIFFS_BI|DRIVE_EMP_DIFFS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
