---
tags:
  - table
  - UTIL
---
# VALID_MAIL_CONFIG

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2
**Last Analyzed**: 2025-09-16 03:16:49
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | FCN_CODE | VARCHAR2(25) | No |  |  |
| 2 | FROM_EMAIL | VARCHAR2(200) | No |  |  |
| 3 | SUBJECT | VARCHAR2(500) | No |  |  |
| 4 | EMAIL_MSG | CLOB | Yes |  |  |
| 5 | TEXT_MSG | VARCHAR2(500) | No |  |  |
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

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| EMAIL_MSG | SYS_LOB0000079815C00004$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
