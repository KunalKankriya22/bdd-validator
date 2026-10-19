---
tags:
  - table
  - DONSYS
---
# DONOR_ADDRESSES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 90371
**Last Analyzed**: 2026-05-16 11:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ADDRESS_TYPE | VARCHAR2(5) | No |  |  |
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
| 14 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 15 | INSERT_DATE | DATE | No |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 17 | AUDIT_KEY | NUMBER | No |  |  |
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
| 46 | INTL_CITY_NAME | VARCHAR2(50) | Yes |  |  |
| 47 | ALT_INTL_CITY_NAME | VARCHAR2(50) | Yes |  |  |
| 48 | INTL_CITY | VARCHAR2(50) | Yes |  |  |

## Primary Key

**DONOR_ADDRESSES_PK**: `DONOR_ID, CHAPTER_ID, ADDRESS_TYPE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONOR_ADDRESSES_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| DONOR_ADDRESSES_IDX1 | NORMAL | NONUNIQUE | D_PHONE_NO | VALID |
| DONOR_ADDRESSES_IDX2 | NORMAL | NONUNIQUE | H_PHONE_NO | VALID |
| DONOR_ADDRESSES_IDX3 | NORMAL | NONUNIQUE | USPS_ID | VALID |
| DONOR_ADDRESSES_PK | NORMAL | UNIQUE | DONOR_ID, CHAPTER_ID, ADDRESS_TYPE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONOR_ADDRESSES_BI|DONOR_ADDRESSES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_ADDRESSES_BU|DONOR_ADDRESSES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)
- [[schemas/DONSYS/Triggers/DONOR_ADDRESS_SF_UPD|DONOR_ADDRESS_SF_UPD]] — AFTER EACH ROW UPDATE (ENABLED)

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
| GENBDR | PACKAGE | DONSYS |
