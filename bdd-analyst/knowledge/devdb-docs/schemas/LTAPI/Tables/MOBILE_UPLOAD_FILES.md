---
tags:
  - table
  - LTAPI
---
# MOBILE_UPLOAD_FILES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 555
**Last Analyzed**: 2025-10-25 03:00:05
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UPLOAD_ID | VARCHAR2(50) | No |  |  |
| 2 | FILE_NAME | VARCHAR2(150) | No |  |  |
| 3 | DUMP_FILE | BLOB | No |  |  |
| 4 | INSERT_DATE | DATE | No |  |  |
| 5 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 6 | UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 7 | SESSION_ID | VARCHAR2(50) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| DUMP_FILE | SYS_LOB0000076620C00003$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
