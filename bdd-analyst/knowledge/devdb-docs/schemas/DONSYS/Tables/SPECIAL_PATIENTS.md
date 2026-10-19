---
tags:
  - table
  - DONSYS
---
# SPECIAL_PATIENTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 490
**Last Analyzed**: 2026-05-16 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PAT_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PAT_TYPE | VARCHAR2(10) | No |  |  |
| 4 | STATUS | VARCHAR2(5) | No |  |  |
| 5 | PAT_LAST_NAME | VARCHAR2(30) | No |  |  |
| 6 | PAT_FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 7 | PAT_INITIALS | VARCHAR2(3) | Yes |  |  |
| 8 | STREET_NAME | VARCHAR2(50) | Yes |  |  |
| 9 | USPS_ID | NUMBER(6) | Yes |  |  |
| 10 | SSN | NUMBER(9) | Yes |  |  |
| 11 | WEIGHT | NUMBER(5,2) | Yes |  |  |
| 12 | ALT_SSN_ID | VARCHAR2(11) | Yes |  |  |
| 13 | DOB | DATE | Yes |  |  |
| 14 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 15 | ABO_TYPE | VARCHAR2(10) | Yes |  |  |
| 16 | SEX | VARCHAR2(2) | Yes |  |  |
| 17 | PREFERRED_PROC_CODE | VARCHAR2(5) | Yes |  |  |
| 18 | CMV_STATUS | VARCHAR2(1) | Yes |  |  |
| 19 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 20 | CONTACT_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 21 | CONTACT_NAME | VARCHAR2(50) | Yes |  |  |
| 22 | CONTACT_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 23 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 24 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 25 | INSERT_DATE | DATE | No |  |  |
| 26 | AUDIT_KEY | NUMBER | No |  |  |
| 27 | INTL_CONTACT_PHONE_NO | VARCHAR2(20) | Yes |  |  |

## Primary Key

**SPECIAL_PATIENTS_PK**: `PAT_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SPECIAL_PATIENTS_IDX2 | NORMAL | NONUNIQUE | PAT_LAST_NAME, PAT_FIRST_NAME | VALID |
| SPECIAL_PATIENTS_PK | NORMAL | UNIQUE | PAT_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/SPECIAL_PATIENTS_BD|SPECIAL_PATIENTS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/SPECIAL_PATIENTS_BI|SPECIAL_PATIENTS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/SPECIAL_PATIENTS_BU|SPECIAL_PATIENTS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
