---
tags:
  - table
  - LTAPI
---
# API_DONOR_EMPLOYERS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EMPLOYER_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | EMPLOYER_NAME | VARCHAR2(50) | Yes |  |  |
| 4 | STREET_ADDRESS | VARCHAR2(30) | Yes |  |  |
| 5 | USPS_ID | NUMBER(6) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(8) | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 8 | INSERT_DATE | DATE | Yes |  |  |
| 9 | EFF_DATE | DATE | Yes |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | INTL_CITY | VARCHAR2(50) | Yes |  |  |
| 13 | INTL_STATE | VARCHAR2(2) | Yes |  |  |
| 14 | INTL_POSTAL_CODE | VARCHAR2(15) | Yes |  |  |
| 15 | INTL_COUNTRY_NAME | VARCHAR2(50) | Yes |  |  |
| 16 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 17 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 18 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 19 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 20 | INTL_ADDR_FLAG | VARCHAR2(1) | Yes |  |  |
| 21 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 22 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 23 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONOR_EMPLOYERS_IDX2 | NORMAL | NONUNIQUE | EMPLOYER_NAME | VALID |
| API_DONOR_EMPLOYERS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
