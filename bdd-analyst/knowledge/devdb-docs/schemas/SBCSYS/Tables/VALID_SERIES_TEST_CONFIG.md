---
tags:
  - table
  - SBCSYS
---
# VALID_SERIES_TEST_CONFIG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 65
**Last Analyzed**: 2025-09-16 03:16:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_SERIES_ID | VARCHAR2(10) | Yes |  |  |
| 2 | LEVEL_CODE | NUMBER | Yes |  |  |
| 3 | SET_NO | NUMBER | Yes |  |  |
| 4 | TEST_ID | VARCHAR2(10) | No |  |  |
| 5 | RESULT_CODE | VARCHAR2(100) | Yes |  |  |
| 6 | SCHEDULE_TEST | VARCHAR2(100) | Yes |  |  |
| 7 | CANCEL_TEST | VARCHAR2(100) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 12 | INSERT_DATE | DATE | Yes |  |  |
| 13 | AUDIT_KEY | NUMBER | Yes |  |  |
| 14 | ANOTATION_CODE | VARCHAR2(10) | Yes |  |  |
| 15 | FINAL_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_SERIES_TEST_CONFIG_BD|VALID_SERIES_TEST_CONFIG_BD]] — BEFORE EACH ROW DELETE (DISABLED)
- [[schemas/SBCSYS/Triggers/VALID_SERIES_TEST_CONFIG_BI|VALID_SERIES_TEST_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_SERIES_TEST_CONFIG_BU|VALID_SERIES_TEST_CONFIG_BU]] — BEFORE EACH ROW UPDATE (DISABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
