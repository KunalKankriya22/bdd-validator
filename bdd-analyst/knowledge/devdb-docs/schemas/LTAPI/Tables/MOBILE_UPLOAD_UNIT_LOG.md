---
tags:
  - table
  - LTAPI
---
# MOBILE_UPLOAD_UNIT_LOG

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 230
**Last Analyzed**: 2025-10-21 03:00:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UPLOAD_ID | VARCHAR2(50) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 3 | TABLE_NAME | VARCHAR2(50) | Yes |  |  |
| 4 | LOG_TEXT | VARCHAR2(2000) | No |  |  |
| 5 | LOG_TYPE | VARCHAR2(1) | No |  |  |
| 6 | LOG_SEQ | NUMBER | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | DEFERRAL_ID | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MOBILE_UPLOAD_USER_LOG_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
