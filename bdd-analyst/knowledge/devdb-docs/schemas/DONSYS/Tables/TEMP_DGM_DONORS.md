---
tags:
  - table
  - DONSYS
---
# TEMP_DGM_DONORS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2592
**Last Analyzed**: 2025-09-16 03:14:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 3 | LAST_NAME_SNDX | VARCHAR2(4) | Yes |  |  |
| 4 | FIRST_NAME | VARCHAR2(24) | Yes |  |  |
| 5 | FIRST_NAME_SNDX | VARCHAR2(4) | Yes |  |  |
| 6 | MIDDLE_NAME | VARCHAR2(12) | Yes |  |  |
| 7 | BIRTHDATE | DATE | Yes |  |  |
| 8 | SOCIAL_SECURITY_NO | NUMBER(10) | Yes |  |  |
| 9 | BLOOD_TYPE | VARCHAR2(4) | Yes |  |  |
| 10 | SEX | VARCHAR2(1) | Yes |  |  |
| 11 | INSERT_DATE | DATE | Yes |  |  |

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
