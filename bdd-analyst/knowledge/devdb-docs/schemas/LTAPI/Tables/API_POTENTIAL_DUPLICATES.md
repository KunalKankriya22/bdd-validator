---
tags:
  - table
  - LTAPI
---
# API_POTENTIAL_DUPLICATES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 20
**Last Analyzed**: 2025-10-21 03:00:15
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SET_ID | VARCHAR2(14) | No |  |  |
| 2 | DONOR_ID | VARCHAR2(10) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | MERGE_FLAG | VARCHAR2(5) | No |  |  |
| 5 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 6 | SET_STATUS_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | RESOLVE_USER | VARCHAR2(6) | Yes |  |  |
| 8 | RESOLVE_DATE | DATE | Yes |  |  |
| 9 | INT_LAST_NAME | VARCHAR2(1) | Yes |  |  |
| 10 | INT_SSN | VARCHAR2(1) | Yes |  |  |
| 11 | INT_DOB | VARCHAR2(1) | Yes |  |  |
| 12 | INT_SEX | VARCHAR2(1) | Yes |  |  |
| 13 | DEMOGRAPHICS_CHECK | VARCHAR2(1) | Yes |  |  |
| 14 | INTERDICTIONS_CHECK | VARCHAR2(1) | Yes |  |  |
| 15 | DONATIONS_CHECK | VARCHAR2(1) | Yes |  |  |
| 16 | ATTRIBUTES_CHECK | VARCHAR2(1) | Yes |  |  |
| 17 | KEYDATA_CHECK | VARCHAR2(1) | Yes |  |  |
| 18 | DEMOGRAPHICS_USER | VARCHAR2(6) | Yes |  |  |
| 19 | INTERDICTIONS_USER | VARCHAR2(6) | Yes |  |  |
| 20 | DONATIONS_USER | VARCHAR2(6) | Yes |  |  |
| 21 | ATTRIBUTES_USER | VARCHAR2(6) | Yes |  |  |
| 22 | KEYDATA_USER | VARCHAR2(6) | Yes |  |  |
| 23 | DEMOGRAPHICS_DATE | DATE | Yes |  |  |
| 24 | INTERDICTIONS_DATE | DATE | Yes |  |  |
| 25 | DONATIONS_DATE | DATE | Yes |  |  |
| 26 | ATTRIBUTES_DATE | DATE | Yes |  |  |
| 27 | KEYDATA_DATE | DATE | Yes |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | INSERT_DATE | DATE | No |  |  |
| 30 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 31 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 32 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 33 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 34 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 35 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 36 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 37 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |
| 38 | AUDIT_KEY | NUMBER | Yes |  |  |

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
