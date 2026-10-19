---
tags:
  - table
  - SBCSYS
---
# ERROR_LOGS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

> [!quote] Created from Entity ERROR LOG by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROGRAM_NAME | VARCHAR2(10) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | COLL_DATE | DATE | No |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 5 | ERR | NUMBER(3) | No |  |  |
| 6 | ERROR_DATE | DATE | No |  |  |
| 7 | SQLERROR_CODE | NUMBER | No |  |  |
| 8 | SQLERROR_MSG | VARCHAR2(80) | No |  |  |

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
