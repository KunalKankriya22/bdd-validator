---
tags:
  - table
  - LTAPI
---
# API_MASTER_CODES

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-02-26 22:00:29
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CODE_TYPE | VARCHAR2(5) | No |  |  |
| 2 | CODE | VARCHAR2(5) | No |  |  |
| 3 | DESCRIPTION | VARCHAR2(50) | Yes |  |  |
| 4 | NUMERAL_VALUE | NUMBER(10,3) | Yes |  |  |
| 5 | SORT_SEQUENCE_1 | NUMBER(3) | Yes |  |  |
| 6 | SORT_SEQUENCE_2 | NUMBER(3) | Yes |  |  |
| 7 | SORT_SEQUENCE_3 | NUMBER(3) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/LTAPI/Triggers/API_MASTER_CODES_BD|API_MASTER_CODES_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/LTAPI/Triggers/API_MASTER_CODES_BI|API_MASTER_CODES_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/LTAPI/Triggers/API_MASTER_CODES_BU|API_MASTER_CODES_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
