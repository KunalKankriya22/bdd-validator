---
tags:
  - table
  - DONSYS
---
# DONOR_LABEL_PRINT_FILE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 18064
**Last Analyzed**: 2026-05-20 03:00:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 2 | COLL_DATE | VARCHAR2(10) | Yes |  |  |
| 3 | COMM_CODE | VARCHAR2(5) | Yes |  |  |
| 4 | GALLONS | NUMBER(3) | Yes |  |  |
| 5 | PRINT_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

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
