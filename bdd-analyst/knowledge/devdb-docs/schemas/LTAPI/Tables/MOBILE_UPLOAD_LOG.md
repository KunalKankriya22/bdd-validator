---
tags:
  - table
  - LTAPI
---
# MOBILE_UPLOAD_LOG

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2554
**Last Analyzed**: 2025-08-20 03:00:31
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UPLOAD_ID | VARCHAR2(50) | No |  |  |
| 2 | TABLE_NAME | VARCHAR2(50) | No |  |  |
| 3 | LOG_TEXT | VARCHAR2(2000) | No |  |  |
| 4 | LOG_SEQ | NUMBER | No |  |  |
| 5 | STATUS | VARCHAR2(1) | Yes |  |  |
| 6 | START_TIME | DATE | Yes |  |  |
| 7 | END_TIME | DATE | Yes |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 10 | PROCESS_TIME | INTERVAL DAY(2) TO SECOND(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MOBILE_UPLOAD_LOG_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
