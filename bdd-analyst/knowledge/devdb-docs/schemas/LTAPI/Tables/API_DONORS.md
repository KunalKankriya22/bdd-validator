---
tags:
  - table
  - LTAPI
---
# API_DONORS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 312
**Last Analyzed**: 2025-10-25 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | GENDER | VARCHAR2(1) | Yes |  |  |
| 4 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 5 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 6 | SSN | NUMBER(9) | Yes |  |  |
| 7 | LAST_NAME_SUFFIX | VARCHAR2(5) | Yes |  |  |
| 8 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 9 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 10 | SALUTATION | VARCHAR2(5) | Yes |  |  |
| 11 | BLOOD_TYPE | VARCHAR2(5) | Yes |  |  |
| 12 | EMPLOYER_ID | VARCHAR2(10) | Yes |  |  |
| 13 | TITLE | VARCHAR2(10) | Yes |  |  |
| 14 | ETHNIC_GROUP | VARCHAR2(5) | Yes |  |  |
| 15 | STATUS | VARCHAR2(5) | Yes |  |  |
| 16 | SOUNDEX_KEY | VARCHAR2(10) | Yes |  |  |
| 17 | PREVIOS_DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 18 | ALIAS | VARCHAR2(15) | Yes |  |  |
| 19 | CLAIMED_DONATION | NUMBER(5) | Yes |  |  |
| 20 | ALTERNATE_ID | VARCHAR2(20) | Yes |  |  |
| 21 | MIGRATED_UNIT | NUMBER(4) | Yes |  |  |
| 22 | MIGRATED_ADDR1 | VARCHAR2(32) | Yes |  |  |
| 23 | MIGRATED_ADDR2 | VARCHAR2(32) | Yes |  |  |
| 24 | MIGRATED_ADDR3 | VARCHAR2(32) | Yes |  |  |
| 25 | MIGRATED_ZIP | VARCHAR2(5) | Yes |  |  |
| 26 | MIGRATED_STATUS | VARCHAR2(1) | Yes |  |  |
| 27 | MIGRATED_CITY | VARCHAR2(40) | Yes |  |  |
| 28 | LANG | VARCHAR2(15) | Yes |  |  |
| 29 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 30 | CONV_DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 31 | PREV_BLOOD_CENTER | VARCHAR2(30) | Yes |  |  |
| 32 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 33 | INSERT_DATE | DATE | Yes |  |  |
| 34 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 35 | AUDIT_KEY | NUMBER | Yes |  |  |
| 36 | MIGRATED_STATE | VARCHAR2(30) | Yes |  |  |
| 37 | FIRST_NAME_SNDX | VARCHAR2(4) | Yes |  |  |
| 38 | LIFE_DONATIONS | NUMBER | Yes |  |  |
| 39 | YTD_DONATIONS | NUMBER | Yes |  |  |
| 40 | LAST_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 41 | LAST_COLL_DATE | DATE | Yes |  |  |
| 42 | LAST_DON_TYPE | VARCHAR2(5) | Yes |  |  |
| 43 | LAST_PROC_CODE | VARCHAR2(5) | Yes |  |  |
| 44 | MIGRATED_DONOR_ID | VARCHAR2(15) | Yes |  |  |
| 45 | LIFE_CREDIT | NUMBER | Yes |  |  |
| 46 | YTD_CREDIT | NUMBER | Yes |  |  |
| 47 | HEIGHT | VARCHAR2(10) | Yes |  |  |
| 48 | ALTERNATE_ID_TYPE | VARCHAR2(5) | Yes |  |  |
| 49 | SCAN_ID | VARCHAR2(20) | Yes |  |  |
| 50 | DONOR_WEIGHT | NUMBER(6) | Yes |  |  |
| 51 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 52 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 53 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 54 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 55 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 56 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 57 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |
| 58 | GENOTYPE | VARCHAR2(500) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONORS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
