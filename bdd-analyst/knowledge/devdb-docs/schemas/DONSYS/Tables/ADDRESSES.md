---
tags:
  - table
  - DONSYS
---
# ADDRESSES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 35175
**Last Analyzed**: 2026-04-08 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ADDRESS_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | STREET_NAME | VARCHAR2(50) | Yes |  |  |
| 4 | USPS_ID | NUMBER(6) | No |  |  |
| 5 | ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 6 | ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 7 | ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 8 | D_COUNTRY_CODE | VARCHAR2(7) | Yes |  |  |
| 9 | EXTENSION | NUMBER(6) | Yes |  |  |
| 10 | H_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 11 | F_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 12 | E_MAIL | VARCHAR2(128) | Yes |  |  |
| 13 | WEB_ADDRESS | VARCHAR2(128) | Yes |  |  |
| 14 | MAPSCO | VARCHAR2(10) | Yes |  |  |
| 15 | SUITE_APT | VARCHAR2(10) | Yes |  |  |
| 16 | ZIP4 | VARCHAR2(4) | Yes |  |  |
| 17 | D_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 18 | D_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 19 | H_COUNTRY_CODE | VARCHAR2(7) | Yes |  |  |
| 20 | H_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 21 | F_COUNTRY_CODE | VARCHAR2(7) | Yes |  |  |
| 22 | F_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 23 | M_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 24 | M_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 25 | PAGER | VARCHAR2(14) | Yes |  |  |
| 26 | EFF_DATE | DATE | No |  |  |
| 27 | TERM_DATE | DATE | Yes |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | INSERT_DATE | DATE | No |  |  |
| 30 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 31 | AUDIT_KEY | NUMBER | Yes |  |  |
| 32 | COUNTRY_NAME | VARCHAR2(50) | Yes |  |  |
| 33 | INTL_POSTAL_CODE | VARCHAR2(15) | Yes |  |  |
| 34 | INTL_HOME_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 35 | INTL_WORK_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 36 | INTL_WORK_PHONE_EXT | VARCHAR2(8) | Yes |  |  |
| 37 | INTL_MOBILE_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 38 | INTL_FAX_NO | VARCHAR2(20) | Yes |  |  |
| 39 | INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 40 | INTL_ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 41 | INTL_ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 42 | INTL_ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 43 | INTL_ADDRESS_4 | VARCHAR2(50) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/ADDRESSES_BI|ADDRESSES_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
