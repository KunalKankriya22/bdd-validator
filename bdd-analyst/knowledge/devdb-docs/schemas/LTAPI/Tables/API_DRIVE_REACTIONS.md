---
tags:
  - table
  - LTAPI
---
# API_DRIVE_REACTIONS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LT_DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 2 | EXT_REF_ID | VARCHAR2(15) | Yes |  |  |
| 3 | DRIVE_DATE | DATE | Yes |  |  |
| 4 | REACTION_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | TOT_REACT_COUNT | NUMBER | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | PROCESS_STATUS | VARCHAR2(1) | Yes |  |  |

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
