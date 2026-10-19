---
tags:
  - table
  - UTIL
---
# LT_PASSWORD_HISTORY

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 853
**Last Analyzed**: 2025-09-16 03:16:47
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USER_ID | VARCHAR2(50) | Yes |  |  |
| 2 | OLD_PASSWORD | RAW(50) | Yes |  |  |
| 3 | ACTUAL_DATE | DATE | Yes |  |  |
| 4 | RESET_DATE | DATE | Yes |  |  |

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
