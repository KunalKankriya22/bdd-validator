---
tags:
  - table
  - UTIL
---
# LT_PASSWORD_CONFIG

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2026-04-25 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PWD_HISTORY | NUMBER | Yes |  |  |
| 2 | PWD_MIN_LENGTH | NUMBER | Yes |  |  |
| 3 | PWD_MIN_CAPS | NUMBER | Yes |  |  |
| 4 | PWD_MIN_LOWER | NUMBER | Yes |  |  |
| 5 | PWD_MIN_NUMBER | NUMBER | Yes |  |  |
| 6 | PWD_MIN_SPECIAL | NUMBER | Yes |  |  |
| 7 | PWD_MIN_CHAR_CHG | NUMBER | Yes |  |  |
| 8 | PWD_LOCKOUT | NUMBER | Yes |  |  |
| 9 | PWD_INTRVL | NUMBER | Yes |  |  |
| 10 | PWD_METHOD | VARCHAR2(10) | Yes |  |  |
| 11 | PWD_SPECIAL | VARCHAR2(100) | Yes |  |  |
| 12 | PWD_WAR_MSG | NUMBER | Yes |  |  |
| 13 | PWD_LOCKOUT_INTERVAL | NUMBER | Yes |  |  |
| 14 | PWD_LOCKOUT_PERIOD | NUMBER | Yes |  |  |

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
