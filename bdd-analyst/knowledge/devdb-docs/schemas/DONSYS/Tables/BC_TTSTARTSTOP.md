---
tags:
  - table
  - DONSYS
---
# BC_TTSTARTSTOP

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 60
**Last Analyzed**: 2025-09-16 03:10:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LABEL_TYPE | VARCHAR2(10) | Yes |  |  |
| 2 | LINE_NO | NUMBER(2) | Yes |  |  |
| 3 | START_CODE | VARCHAR2(50) | Yes |  |  |
| 4 | STOP_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 7 | INSERT_DATS | DATE | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | VALUE_START_CODE | VARCHAR2(25) | Yes |  |  |

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
