---
tags:
  - table
  - UTIL
---
# LT_APPLICATION_CONFIG

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2026-04-25 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | APPL_ID | VARCHAR2(15) | Yes |  |  |
| 2 | TIME_ZONE_ENABLED | VARCHAR2(1) | Yes |  |  |
| 3 | MULTI_CHAPTER | VARCHAR2(1) | Yes |  |  |
| 4 | SINGLE_USER | VARCHAR2(1) | Yes |  |  |
| 5 | STRONG_PWD_ENABLED | VARCHAR2(1) | Yes |  |  |
| 6 | SILENT_LOGIN | VARCHAR2(1) | Yes |  |  |
| 7 | LOGIN_WARNING | VARCHAR2(1) | Yes |  |  |
| 8 | DEFAULT_DBASE | VARCHAR2(50) | Yes |  |  |
| 9 | EXTERNAL_AUTH | VARCHAR2(1) | Yes |  |  |
| 10 | SPECIAL_SCANNING | VARCHAR2(1) | Yes |  |  |
| 11 | INT_ADDRESS_SUPPORT | VARCHAR2(1) | Yes |  |  |
| 12 | KTRAK_INTEGRATED | VARCHAR2(1) | Yes |  |  |
| 13 | AD_ENABLED | VARCHAR2(1) | Yes |  |  |
| 14 | TOUT_IDLE | NUMBER | Yes |  |  |
| 15 | TOUT_WARN | NUMBER | Yes |  |  |
| 16 | OKTA_AUTH | VARCHAR2(1) | Yes |  |  |
| 17 | WALLET_ENABLED | VARCHAR2(1) | Yes |  |  |

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
