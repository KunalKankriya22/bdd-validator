---
tags:
  - table
  - UTIL
---
# DONOR_CARD_PARM

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 39
**Last Analyzed**: 2025-10-08 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(40) | Yes |  |  |
| 2 | TOKEN_ID | VARCHAR2(3000) | Yes |  |  |
| 3 | USER_ID | VARCHAR2(30) | Yes |  |  |
| 4 | CARD_ID | VARCHAR2(30) | Yes |  |  |
| 5 | REFRESH_TOKEN | VARCHAR2(200) | Yes |  |  |
| 6 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | DONOR_ID | VARCHAR2(10) | Yes |  |  |

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
