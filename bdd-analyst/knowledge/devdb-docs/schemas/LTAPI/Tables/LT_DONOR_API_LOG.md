---
tags:
  - table
  - LTAPI
---
# LT_DONOR_API_LOG

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2026-03-27 03:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SOURCE_ID | VARCHAR2(50) | Yes |  |  |
| 2 | DATA_SOURCE_NAME | VARCHAR2(100) | Yes |  |  |
| 3 | LOG_TEXT | VARCHAR2(1000) | Yes |  |  |
| 4 | INSERT_DATE | DATE | Yes |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 6 | LOG_SEQ | NUMBER | Yes |  |  |
| 7 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| LT_DONOR_API_LOG_SI | NORMAL | NONUNIQUE | SOURCE_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
