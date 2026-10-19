---
tags:
  - table
  - LTAPI
---
# API_SPONSOR_CONTACTS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:30
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SPONSOR_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CONTACT_ID | VARCHAR2(10) | No |  |  |
| 4 | CONTACT_TYPE | VARCHAR2(5) | No |  |  |
| 5 | ADDRESS_ID | VARCHAR2(10) | No |  |  |
| 6 | LAST_NAME | VARCHAR2(30) | No |  |  |
| 7 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 8 | MIDDLE_NAME | VARCHAR2(25) | Yes |  |  |
| 9 | SALUTATION | VARCHAR2(5) | Yes |  |  |
| 10 | TITLE | VARCHAR2(25) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | INSERT_DATE | DATE | No |  |  |
| 14 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | Yes |  |  |
| 17 | EXT_APPL_ID | VARCHAR2(15) | No |  |  |
| 18 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 19 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 20 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |

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
