---
tags:
  - table
  - LTAPI
---
# API_MOBILE_DRIVE_SLOTS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | TIME_OF_DAY | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | DRIVE_DATE | DATE | No |  |  |
| 5 | MAX_SLOTS | NUMBER | No |  |  |
| 6 | BOOKED_SLOTS | NUMBER | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 12 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 13 | LT_UPLOAD_STATUS | DATE | Yes |  |  |

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
