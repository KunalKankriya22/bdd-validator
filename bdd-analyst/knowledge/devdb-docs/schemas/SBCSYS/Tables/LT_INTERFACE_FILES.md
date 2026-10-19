---
tags:
  - table
  - SBCSYS
---
# LT_INTERFACE_FILES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 108774
**Last Analyzed**: 2026-05-09 11:01:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | FILE_ID | VARCHAR2(240) | Yes |  |  |
| 3 | DATA_STRING | VARCHAR2(3000) | Yes |  |  |
| 4 | EXTERNAL_SOURCE | VARCHAR2(30) | Yes |  |  |
| 5 | PROCESSED_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | INSERT_DATE | DATE | Yes |  |  |
| 7 | RECORD_ID | NUMBER | Yes |  |  |
| 8 | FAILURE_REASON | VARCHAR2(1000) | Yes |  |  |
| 9 | LINE_ORDER | NUMBER | Yes |  |  |
| 10 | LIFETRAK_FORMAT | VARCHAR2(1) | Yes |  |  |
| 11 | INSERT_USER | VARCHAR2(50) | Yes |  |  |
| 12 | PROCESSED_DATE | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/LT_INTERFACE_FILES_BI|LT_INTERFACE_FILES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/LT_INTERFACE_FILES_BU|LT_INTERFACE_FILES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
