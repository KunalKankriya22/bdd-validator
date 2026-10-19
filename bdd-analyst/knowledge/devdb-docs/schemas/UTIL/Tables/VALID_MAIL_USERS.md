---
tags:
  - table
  - UTIL
---
# VALID_MAIL_USERS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8
**Last Analyzed**: 2025-09-16 03:16:49
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | FCN_CODE | VARCHAR2(25) | No |  |  |
| 2 | TO_EMAIL | VARCHAR2(200) | Yes |  |  |
| 3 | PHONE_NO | VARCHAR2(50) | Yes |  |  |
| 4 | PROVIDER_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | MAIL_TYPE | VARCHAR2(1) | No |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |

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
