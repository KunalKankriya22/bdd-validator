---
tags:
  - table
  - DONSYS
---
# PHYSICIAN_LIST

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1234
**Last Analyzed**: 2026-05-15 03:03:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PHY_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 4 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 5 | MI | VARCHAR2(25) | Yes |  |  |
| 6 | STREET_NAME | VARCHAR2(50) | Yes |  |  |
| 7 | USPS_ID | NUMBER(6) | Yes |  |  |
| 8 | SPECIALTY_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 11 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 12 | INSERT_DATE | DATE | No |  |  |
| 13 | AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 14 | PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 15 | HOSPITAL_ID | VARCHAR2(10) | Yes |  |  |
| 16 | EFF_DATE | DATE | Yes |  |  |
| 17 | TERM_DATE | DATE | Yes |  |  |
| 18 | INTL_POSTAL_CODE | VARCHAR2(10) | Yes |  |  |
| 19 | INTL_HOME_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 20 | INTL_WORK_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 21 | INTL_WORK_PHONE_EXT | VARCHAR2(8) | Yes |  |  |
| 22 | INTL_MOBILE_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 23 | INTL_FAX_NO | VARCHAR2(20) | Yes |  |  |
| 24 | INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 25 | INTL_ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 26 | INTL_ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 27 | INTL_ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 28 | INTL_ADDRESS_4 | VARCHAR2(50) | Yes |  |  |
| 29 | COUNTRY_NAME | VARCHAR2(50) | Yes |  |  |

## Primary Key

**PHYSICIAN_LIST_PK**: `PHY_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PHYSICIAN_LIST_IDX1 | NORMAL | NONUNIQUE | LAST_NAME, FIRST_NAME | VALID |
| PHYSICIAN_LIST_PK | NORMAL | UNIQUE | PHY_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/PHYSICIAN_LIST_BI|PHYSICIAN_LIST_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
