---
tags:
  - table
  - LTWEB
---
# WEB_DONOR_RESPONSES_HDR

**Schema**: [[schemas/LTWEB/LTWEB|LTWEB]]
**Tablespace**: BC_DATA
**Estimated Rows**: 37
**Last Analyzed**: 2025-10-21 03:00:25
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ONLINE_ID | VARCHAR2(15) | Yes |  |  |
| 2 | ID | VARCHAR2(2000) | Yes |  |  |
| 3 | LAST_NAME | VARCHAR2(30) | Yes |  |  |
| 4 | FIRST_NAME | VARCHAR2(25) | Yes |  |  |
| 5 | GENDER | VARCHAR2(1) | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | DATE_OF_BIRTH | DATE | Yes |  |  |
| 8 | USER_LANGUAGE | VARCHAR2(2) | Yes |  |  |
| 9 | ID_TYPE | VARCHAR2(5) | Yes |  |  |
| 10 | DOWNLOAD_COMPLETE | VARCHAR2(1) | Yes |  |  |
| 11 | ABBR_ELIGIBLE | VARCHAR2(1) | Yes |  |  |
| 12 | REFRESH_TOKEN | VARCHAR2(200) | Yes |  |  |
| 13 | ISSUED_DATE | DATE | Yes |  |  |
| 14 | EXPIRES_DATE | DATE | Yes |  |  |

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
