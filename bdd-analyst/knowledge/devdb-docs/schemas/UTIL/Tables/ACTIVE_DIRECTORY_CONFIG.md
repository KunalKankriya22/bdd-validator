---
tags:
  - table
  - UTIL
---
# ACTIVE_DIRECTORY_CONFIG

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2025-09-16 03:16:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AD_HOST | VARCHAR2(300) | Yes |  |  |
| 2 | AD_PORT | NUMBER | Yes |  |  |
| 3 | AD_USE_SSL | VARCHAR2(1) | Yes |  |  |
| 4 | AD_SSL_WALLET_PWD | RAW(1000) | Yes |  |  |
| 5 | AD_SSL_AUTH | NUMBER | Yes |  |  |
| 6 | AD_SVC_USER | VARCHAR2(100) | Yes |  |  |
| 7 | AD_SVC_USERDN | VARCHAR2(500) | Yes |  |  |
| 8 | AD_SVC_PWD | RAW(1000) | Yes |  |  |
| 9 | AD_USE_SVC_ACCT | VARCHAR2(1) | Yes |  |  |
| 10 | AD_SEARCH_FILTER | VARCHAR2(300) | Yes |  |  |
| 11 | AD_SEARCH_BASE | VARCHAR2(500) | Yes |  |  |
| 12 | AD_USER_DOMAIN | VARCHAR2(50) | Yes |  |  |
| 13 | AD_USERID_ATTRIB | VARCHAR2(300) | Yes |  |  |
| 14 | OFFLINE_AUTH | VARCHAR2(1) | Yes |  |  |

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
