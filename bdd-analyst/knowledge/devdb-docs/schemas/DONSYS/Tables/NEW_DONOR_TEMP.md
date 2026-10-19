---
tags:
  - table
  - DONSYS
---
# NEW_DONOR_TEMP

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 13
**Last Analyzed**: 2025-10-08 03:00:18
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 2 | SSN | NUMBER(9) | Yes |  |  |
| 3 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 4 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 5 | FIRST_NAME | VARCHAR2(30) | Yes |  |  |
| 6 | MIDDLE_NAME | VARCHAR2(30) | Yes |  |  |
| 7 | GENDER | VARCHAR2(1) | Yes |  |  |
| 8 | STREET_NAME | VARCHAR2(50) | Yes |  |  |
| 9 | SUITE_APT | VARCHAR2(10) | Yes |  |  |
| 10 | CITY | VARCHAR2(40) | Yes |  |  |
| 11 | STATE | VARCHAR2(2) | Yes |  |  |
| 12 | ZIP | VARCHAR2(5) | Yes |  |  |
| 13 | ADDRESS_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | B_AREA_CODE | VARCHAR2(3) | Yes |  |  |
| 15 | B_PHONE_NO | VARCHAR2(7) | Yes |  |  |
| 16 | H_AREA_CODE | VARCHAR2(3) | Yes |  |  |
| 17 | H_PHONE_NO | VARCHAR2(7) | Yes |  |  |
| 18 | EXTENSION | NUMBER(6) | Yes |  |  |
| 19 | EMAIL | VARCHAR2(128) | Yes |  |  |
| 20 | EMP_SCHOOL | VARCHAR2(50) | Yes |  |  |
| 21 | NEW_DONOR_FLAG | VARCHAR2(1) | Yes |  |  |
| 22 | ETHNIC_GROUP | VARCHAR2(5) | Yes |  |  |
| 23 | INSERT_DATE | DATE | Yes |  |  |
| 24 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 25 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 26 | SESSION_ID | VARCHAR2(40) | Yes |  |  |
| 27 | PRINT_STATUS | VARCHAR2(1) | Yes |  |  |
| 28 | DEFERRAL_STATUS | VARCHAR2(1) | Yes |  |  |
| 29 | PRINT_DATE | DATE | Yes |  |  |
| 30 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 31 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 32 | BLOOD_TYPE_DES | VARCHAR2(10) | Yes |  |  |
| 33 | HEIGHT | VARCHAR2(10) | Yes |  |  |
| 34 | WEIGHT | NUMBER | Yes |  |  |
| 35 | ALTERNATE_ID | VARCHAR2(20) | Yes |  |  |
| 36 | ALTERNATE_ID_TYPE | VARCHAR2(5) | Yes |  |  |
| 37 | SCAN_ID | VARCHAR2(20) | Yes |  |  |
| 38 | CREDIT_SPONSOR | VARCHAR2(10) | Yes |  |  |
| 39 | LAST_NAME_SUFFIX | VARCHAR2(5) | Yes |  |  |
| 40 | ALIAS | VARCHAR2(15) | Yes |  |  |
| 41 | DONOR_ID_VERIFIED | VARCHAR2(1) | Yes |  |  |
| 42 | INTL_ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 43 | INTL_ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 44 | INTL_ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 45 | INTL_ADDRESS_4 | VARCHAR2(50) | Yes |  |  |
| 46 | COUNTRY_NAME | VARCHAR2(50) | Yes |  |  |
| 47 | INTL_POSTAL_CODE | VARCHAR2(15) | Yes |  |  |
| 48 | INTL_HOME_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 49 | INTL_WORK_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 50 | INTL_WORK_PHONE_EXT | VARCHAR2(8) | Yes |  |  |
| 51 | INTL_MOBILE_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 52 | INTL_FAX_NO | VARCHAR2(20) | Yes |  |  |
| 53 | INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 54 | ABBR_ELIG_STATUS | VARCHAR2(1) | Yes |  |  |
| 55 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/NEW_DONOR_TEMP_BI|NEW_DONOR_TEMP_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
