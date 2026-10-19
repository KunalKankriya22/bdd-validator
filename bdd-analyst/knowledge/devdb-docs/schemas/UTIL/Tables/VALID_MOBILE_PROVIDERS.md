---
tags:
  - table
  - UTIL
---
# VALID_MOBILE_PROVIDERS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 19
**Last Analyzed**: 2025-09-16 03:16:49
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROVIDER_CODE | VARCHAR2(10) | No |  |  |
| 2 | PROVIDER_DESC | VARCHAR2(500) | No |  |  |
| 3 | SMS_GATEWAY | VARCHAR2(100) | No |  |  |
| 4 | MMS_GATEWAY | VARCHAR2(100) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |

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
