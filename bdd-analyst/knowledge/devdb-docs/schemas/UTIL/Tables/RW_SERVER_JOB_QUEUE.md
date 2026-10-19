---
tags:
  - table
  - UTIL
---
# RW_SERVER_JOB_QUEUE

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5087
**Last Analyzed**: 2025-11-20 04:00:36
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | JOB_QUEUE | VARCHAR2(30) | Yes |  |  |
| 2 | JOB_ID | NUMBER | Yes |  |  |
| 3 | JOB_TYPE | VARCHAR2(30) | Yes |  |  |
| 4 | JOB_NAME | VARCHAR2(4000) | Yes |  |  |
| 5 | STATUS_CODE | NUMBER | Yes |  |  |
| 6 | STATUS_MESSAGE | VARCHAR2(4000) | Yes |  |  |
| 7 | COMMAND_LINE | VARCHAR2(4000) | Yes |  |  |
| 8 | OWNER | VARCHAR2(30) | Yes |  |  |
| 9 | DESTYPE | VARCHAR2(80) | Yes |  |  |
| 10 | DESNAME | VARCHAR2(4000) | Yes |  |  |
| 11 | SERVER | VARCHAR2(80) | Yes |  |  |
| 12 | QUEUED | DATE | Yes |  |  |
| 13 | STARTED | DATE | Yes |  |  |
| 14 | FINISHED | DATE | Yes |  |  |
| 15 | RUN_ELAPSE | NUMBER | Yes |  |  |
| 16 | TOTAL_ELAPSE | NUMBER | Yes |  |  |
| 17 | LAST_RUN | DATE | Yes |  |  |
| 18 | NEXT_RUN | DATE | Yes |  |  |
| 19 | REPEAT_INTERVAL | NUMBER | Yes |  |  |
| 20 | REPEAT_PATTERN | NUMBER | Yes |  |  |
| 21 | CACHE_KEY | VARCHAR2(4000) | Yes |  |  |
| 22 | CACHE_HIT | NUMBER | Yes |  |  |

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
