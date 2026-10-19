---
tags:
  - table
  - LTAPI
---
# API_INST_UPLOAD_STATUS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 201
**Last Analyzed**: 2026-03-07 16:03:50
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | MACHINE_ID | VARCHAR2(5) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | FILE_ID | VARCHAR2(50) | No |  |  |
| 4 | LT_TB_ID | VARCHAR2(14) | No |  |  |
| 5 | UPLOAD_STATUS | VARCHAR2(1) | No |  |  |
| 6 | TOT_REC_PROCESSED | NUMBER | Yes |  |  |
| 7 | TOT_REC_LOADED | NUMBER | Yes |  |  |
| 8 | TOT_REC_REJECTED | NUMBER | Yes |  |  |
| 9 | LOG_FILE_NAME | VARCHAR2(240) | Yes |  |  |
| 10 | PROCESS_DATE | DATE | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

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
