---
tags:
  - table
  - SBCSYS
---
# SAMPLE_NOTATION_DETAILS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 62
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | NOTATION_CODE | VARCHAR2(10) | No |  |  |
| 4 | TEST_ID | VARCHAR2(10) | Yes |  |  |
| 5 | TEST_SERIES_ID | VARCHAR2(10) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | EFF_DATE | DATE | No |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/SAMPLE_NOTATION_DETAILS_BD|SAMPLE_NOTATION_DETAILS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_NOTATION_DETAILS_BI|SAMPLE_NOTATION_DETAILS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/SAMPLE_NOTATION_DETAILS_BU|SAMPLE_NOTATION_DETAILS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
