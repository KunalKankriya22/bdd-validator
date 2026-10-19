---
tags:
  - table
  - LTAPI
---
# API_DONOR_ADDRESSES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 281
**Last Analyzed**: 2025-10-23 03:00:24
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | ADDRESS_TYPE | VARCHAR2(5) | Yes |  |  |
| 4 | STREET_NAME | VARCHAR2(50) | Yes |  |  |
| 5 | SUITE_APT | VARCHAR2(10) | Yes |  |  |
| 6 | D_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | D_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 8 | EXTENSION | NUMBER(6) | Yes |  |  |
| 9 | H_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 10 | H_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 11 | EMAIL | VARCHAR2(128) | Yes |  |  |
| 12 | USPS_ID | NUMBER(6) | Yes |  |  |
| 13 | MAPSCO | VARCHAR2(10) | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 15 | INSERT_DATE | DATE | Yes |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 17 | AUDIT_KEY | NUMBER | Yes |  |  |
| 18 | INTL_ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 19 | INTL_ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 20 | INTL_ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 21 | COUNTRY_NAME | VARCHAR2(50) | Yes |  |  |
| 22 | INTL_POSTAL_CODE | VARCHAR2(15) | Yes |  |  |
| 23 | INTL_HOME_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 24 | INTL_WORK_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 25 | INTL_WORK_PHONE_EXT | VARCHAR2(8) | Yes |  |  |
| 26 | INTL_MOBILE_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 27 | INTL_FAX_NO | VARCHAR2(20) | Yes |  |  |
| 28 | INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 29 | INTL_ADDRESS_4 | VARCHAR2(50) | Yes |  |  |
| 30 | ALT_STREET_NAME | VARCHAR2(50) | Yes |  |  |
| 31 | ALT_SUITE_APT | VARCHAR2(10) | Yes |  |  |
| 32 | ALT_USPS_ID | NUMBER(6) | Yes |  |  |
| 33 | ALT_INTL_ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 34 | ALT_INTL_ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 35 | ALT_INTL_ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 36 | ALT_INTL_ADDRESS_4 | VARCHAR2(50) | Yes |  |  |
| 37 | ALT_COUNTRY_NAME | VARCHAR2(50) | Yes |  |  |
| 38 | ALT_INTL_POSTAL_CODE | VARCHAR2(15) | Yes |  |  |
| 39 | ALT_INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 40 | M_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 41 | M_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 42 | OTHER_CONTACT_NO | VARCHAR2(20) | Yes |  |  |
| 43 | ALT_INTL_PHONE_NO | VARCHAR2(20) | Yes |  |  |
| 44 | PREFERRED_CONTACT_FLAG | VARCHAR2(1) | Yes |  |  |
| 45 | PREFERRED_CONTACT_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 46 | TRANSACTION_MODE | VARCHAR2(2) | Yes |  |  |
| 47 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 48 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 49 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 50 | INTL_CITY_NAME | VARCHAR2(50) | Yes |  |  |
| 51 | ALT_INTL_CITY_NAME | VARCHAR2(50) | Yes |  |  |
| 52 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 53 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 54 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_ADDRESSES_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
