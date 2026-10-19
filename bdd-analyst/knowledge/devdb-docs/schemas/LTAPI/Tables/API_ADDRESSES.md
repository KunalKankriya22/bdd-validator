---
tags:
  - table
  - LTAPI
---
# API_ADDRESSES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ADDRESS_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | STREET_NAME | VARCHAR2(50) | No |  |  |
| 4 | ADDRESS_1 | VARCHAR2(50) | Yes |  |  |
| 5 | ADDRESS_2 | VARCHAR2(50) | Yes |  |  |
| 6 | ADDRESS_3 | VARCHAR2(50) | Yes |  |  |
| 7 | CITY | VARCHAR2(50) | Yes |  |  |
| 8 | STATE | VARCHAR2(2) | Yes |  |  |
| 9 | ZIP | VARCHAR2(5) | Yes |  |  |
| 10 | B_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 11 | B_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 12 | B_EXTENSION | NUMBER(6) | Yes |  |  |
| 13 | H_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 14 | H_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 15 | F_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 16 | E_MAIL | VARCHAR2(128) | Yes |  |  |
| 17 | WEB_ADDRESS | VARCHAR2(128) | Yes |  |  |
| 18 | MAPSCO | VARCHAR2(10) | Yes |  |  |
| 19 | SUITE_APT | VARCHAR2(10) | Yes |  |  |
| 20 | ZIP4 | VARCHAR2(4) | Yes |  |  |
| 21 | M_AREA_CODE | VARCHAR2(5) | Yes |  |  |
| 22 | M_PHONE_NO | VARCHAR2(8) | Yes |  |  |
| 23 | PAGER | VARCHAR2(14) | Yes |  |  |
| 24 | EFF_DATE | DATE | No |  |  |
| 25 | TERM_DATE | DATE | Yes |  |  |
| 26 | INSERT_DATE | DATE | Yes |  |  |
| 27 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 28 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 29 | AUDIT_KEY | NUMBER | Yes |  |  |
| 30 | EXT_APPL_ID | VARCHAR2(50) | No |  |  |
| 31 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 32 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 33 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |

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
