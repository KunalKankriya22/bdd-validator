---
tags:
  - table
  - DONSYS
---
# DRIVE_EMPLOYEES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 304
**Last Analyzed**: 2025-09-16 03:13:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 4 | IN_TIME | DATE | No |  |  |
| 5 | OUT_TIME | DATE | No |  |  |
| 6 | OT_HOURS | NUMBER(6,2) | Yes |  |  |
| 7 | STAFF_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | JOB_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | SPECIAL_JOB_CODE | VARCHAR2(5) | Yes |  |  |
| 10 | HOURLY_RATE | NUMBER(6,2) | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**DRIVE_EMPLOYEES_PK**: `DRIVE_ID, CHAPTER_ID, STAFF_NO`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| EMP_DRIVE_EMPLOYEES_FK | STAFF_NO, CHAPTER_ID | [[schemas/DONSYS/Tables/EMPLOYEES\|DONSYS.EMPLOYEES]] (STAFF_NO, CHAPTER_ID) | NO ACTION |

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/DRIVE_EMP_DIFFS\|DONSYS.DRIVE_EMP_DIFFS]] | DRIVE_EMP_DRIVE_EMP_DIFFS_FK | DRIVE_ID, CHAPTER_ID, STAFF_NO → DRIVE_ID, CHAPTER_ID, STAFF_NO |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_EMPLOYEES_IDX2 | NORMAL | NONUNIQUE | STAFF_NO | VALID |
| DRIVE_EMPLOYEES_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, STAFF_NO | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_EMPLOYEES_BI|DRIVE_EMPLOYEES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
