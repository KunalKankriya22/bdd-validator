---
tags:
  - table
  - DONSYS
---
# EMPLOYEES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 979
**Last Analyzed**: 2025-09-16 03:13:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | STAFF_NO | VARCHAR2(6) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | FIRST_NAME | VARCHAR2(25) | No |  |  |
| 4 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 5 | INITIALS | VARCHAR2(3) | Yes |  |  |
| 6 | DEPT_ID | VARCHAR2(5) | Yes |  |  |
| 7 | STAFF_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | EMP_CLASS | VARCHAR2(5) | Yes |  |  |
| 9 | OVERTIME_PREF_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | COST_PER_HOUR | NUMBER(6,2) | Yes |  |  |
| 11 | TEAM_ID | VARCHAR2(5) | Yes |  |  |
| 12 | ADDRESS_ID | VARCHAR2(10) | Yes |  |  |
| 13 | OTHER_PHONE_NO | VARCHAR2(14) | Yes |  |  |
| 14 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 15 | SSN | NUMBER(9) | Yes |  |  |
| 16 | HIRE_DATE | DATE | Yes |  |  |
| 17 | SCHEDULE_FROM_DATE | DATE | Yes |  |  |
| 18 | HOURLY_RATE | NUMBER(6,2) | Yes |  |  |
| 19 | EM_CONTACT_NAME | VARCHAR2(30) | Yes |  |  |
| 20 | EM_CONTACT_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 21 | EM_CONTACT_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 22 | FACILITY_CODE | VARCHAR2(5) | Yes |  |  |
| 23 | EFF_DATE | DATE | No |  |  |
| 24 | TERM_DATE | DATE | Yes |  |  |
| 25 | AUDIT_KEY | NUMBER | No |  |  |
| 26 | INSERT_DATE | DATE | No |  |  |
| 27 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 30 | COURIER_ID | VARCHAR2(10) | Yes |  |  |
| 31 | EMP_PASSWORD | VARCHAR2(10) | Yes |  |  |
| 32 | PASSWORD_HINT | VARCHAR2(30) | Yes |  |  |
| 33 | TEAM_SEQ | NUMBER(4) | Yes |  |  |
| 34 | MIX_TEAM | VARCHAR2(1) | Yes |  |  |
| 35 | SUPERVISOR | VARCHAR2(6) | Yes |  |  |
| 36 | EXT_STAFF_NO | VARCHAR2(30) | Yes |  |  |

## Primary Key

**EMPLOYEES_PK**: `STAFF_NO, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/DRIVE_EMPLOYEES\|DONSYS.DRIVE_EMPLOYEES]] | EMP_DRIVE_EMPLOYEES_FK | STAFF_NO, CHAPTER_ID → STAFF_NO, CHAPTER_ID |
| [[schemas/DONSYS/Tables/EMP_FACILITIES\|DONSYS.EMP_FACILITIES]] | EMP_EMP_FACILITIES_FK | STAFF_NO, CHAPTER_ID → STAFF_NO, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| EMPLOYEES_PK | NORMAL | UNIQUE | STAFF_NO, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/EMPLOYEES_BD|EMPLOYEES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/EMPLOYEES_BI|EMPLOYEES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/EMPLOYEES_BU|EMPLOYEES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| DON_INFO | FUNCTION | DONSYS |
