---
tags:
  - table
  - DONSYS
---
# EMPLOYEES_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8267
**Last Analyzed**: 2025-09-16 03:13:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | STAFF_NO | VARCHAR2(6) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 8 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 9 | INITIALS | VARCHAR2(3) | Yes |  |  |
| 10 | DEPT_ID | VARCHAR2(5) | Yes |  |  |
| 11 | STAFF_TYPE | VARCHAR2(5) | Yes |  |  |
| 12 | EMP_CLASS | VARCHAR2(5) | Yes |  |  |
| 13 | OVERTIME_PREF_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | COST_PER_HOUR | NUMBER(6,2) | Yes |  |  |
| 15 | TEAM_ID | VARCHAR2(5) | Yes |  |  |
| 16 | ADDRESS_ID | VARCHAR2(10) | Yes |  |  |
| 17 | OTHER_PHONE_NO | VARCHAR2(14) | Yes |  |  |
| 18 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 19 | SSN | NUMBER(9) | Yes |  |  |
| 20 | HIRE_DATE | DATE | Yes |  |  |
| 21 | SCHEDULE_FROM_DATE | DATE | Yes |  |  |
| 22 | HOURLY_RATE | NUMBER(6,2) | Yes |  |  |
| 23 | EM_CONTACT_NAME | VARCHAR2(30) | Yes |  |  |
| 24 | EM_CONTACT_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 25 | EM_CONTACT_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 26 | FACILITY_CODE | VARCHAR2(5) | Yes |  |  |
| 27 | EFF_DATE | DATE | Yes |  |  |
| 28 | TERM_DATE | DATE | Yes |  |  |

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
