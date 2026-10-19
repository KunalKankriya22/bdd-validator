---
tags:
  - table
  - LTAPI
---
# API_UPLOAD_CONVERSION

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 15986
**Last Analyzed**: 2026-04-08 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EXT_TEMP_ID | VARCHAR2(10) | Yes |  |  |
| 2 | LIFETRAK_PERM_ID | VARCHAR2(10) | Yes |  |  |
| 3 | ID_TYPE | VARCHAR2(20) | Yes |  |  |
| 4 | TEMP_AUDIT_KEY | NUMBER | Yes |  |  |
| 5 | PERM_AUDIT_KEY | NUMBER | Yes |  |  |
| 6 | SOURCE_ID | VARCHAR2(10) | Yes |  |  |
| 7 | INSERT_DATE | DATE | Yes |  |  |
| 8 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 9 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 10 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 11 | LAPTOP_ID | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_UPLOAD_CONVERSION_IDX1 | NORMAL | NONUNIQUE | ID_TYPE, EXT_TEMP_ID | VALID |
| API_UPLOAD_CONVERSION_IDX2 | NORMAL | NONUNIQUE | ID_TYPE, TEMP_AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
