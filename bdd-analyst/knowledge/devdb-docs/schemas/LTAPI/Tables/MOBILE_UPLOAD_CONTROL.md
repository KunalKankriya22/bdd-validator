---
tags:
  - table
  - LTAPI
---
# MOBILE_UPLOAD_CONTROL

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2025-10-25 03:00:04
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LAPTOP_ID | VARCHAR2(20) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | SUBMIT_TIME | DATE | No |  |  |
| 4 | END_TIME | DATE | Yes |  |  |
| 5 | PROC_STATUS | VARCHAR2(1) | No |  |  |
| 6 | UPLOAD_ID | VARCHAR2(50) | No |  |  |
| 7 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 8 | EXTRACT_SEQ | NUMBER | No |  |  |
| 9 | START_TIME | DATE | Yes |  |  |

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
