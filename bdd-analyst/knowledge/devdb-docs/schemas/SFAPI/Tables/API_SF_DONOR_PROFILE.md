---
tags:
  - table
  - SFAPI
---
# API_SF_DONOR_PROFILE

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 60664
**Last Analyzed**: 2025-11-23 12:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 2 | GENDER | VARCHAR2(1) | No |  |  |
| 3 | DATE_OF_BIRTH | DATE | No |  |  |
| 4 | FIRST_NAME | VARCHAR2(25) | No |  |  |
| 5 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 6 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 7 | SSN | NUMBER(9) | Yes |  |  |
| 8 | LAST_NAME_SUFFIX | VARCHAR2(5) | Yes |  |  |
| 9 | ETHNIC_GROUP | VARCHAR2(5) | Yes |  |  |
| 10 | DONOR_WEIGHT | NUMBER(6) | Yes |  |  |
| 11 | HEIGHT | VARCHAR2(10) | Yes |  |  |
| 12 | HOME_PHONE | VARCHAR2(15) | Yes |  |  |
| 13 | MOBILE_PHONE | VARCHAR2(15) | Yes |  |  |
| 14 | WORK_PHONE | VARCHAR2(15) | Yes |  |  |
| 15 | HOME_ADDRESS_STREET | VARCHAR2(50) | Yes |  |  |
| 16 | HOME_ADDRESS_CITY | VARCHAR2(50) | Yes |  |  |
| 17 | HOME_ADDRESS_STATE | VARCHAR2(50) | Yes |  |  |
| 18 | HOME_ADDRESS_ZIP | VARCHAR2(10) | Yes |  |  |
| 19 | HOME_ADDRESS_APT | VARCHAR2(10) | Yes |  |  |
| 20 | ALT_ADDRESS_STREET | VARCHAR2(50) | Yes |  |  |
| 21 | ALT_ADDRESS_CITY | VARCHAR2(50) | Yes |  |  |
| 22 | ALT_ADDRESS_STATE | VARCHAR2(50) | Yes |  |  |
| 23 | ALT_ADDRESS_ZIP | VARCHAR2(10) | Yes |  |  |
| 24 | ALT_ADDRESS_APT | VARCHAR2(10) | Yes |  |  |
| 25 | EMAIL | VARCHAR2(100) | Yes |  |  |
| 26 | BLOOD_TYPE | VARCHAR2(5) | Yes |  |  |
| 27 | DONOR_PICTURE | BLOB | Yes |  |  |
| 28 | INSERT_DATE | DATE | No |  |  |
| 29 | RECORD_READ_DATE | DATE | Yes |  |  |
| 30 | YTD_DONATIONS | NUMBER | Yes |  |  |
| 31 | LIFE_DONATIONS | NUMBER | Yes |  |  |
| 32 | WORK_EXTENSION | NUMBER(6) | Yes |  |  |
| 33 | INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 34 | INTL_ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 35 | INTL_ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 36 | INTL_ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 37 | INTL_ADDRESS_4 | VARCHAR2(50) | Yes |  |  |
| 38 | COUNTRY_NAME | VARCHAR2(50) | Yes |  |  |
| 39 | INTL_POSTAL_CODE | VARCHAR2(15) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_SF_DONOR_PROFILE_PK | NORMAL | UNIQUE | DONOR_ID | VALID |

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| DONOR_PICTURE | SYS_LOB0000076623C00027$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
