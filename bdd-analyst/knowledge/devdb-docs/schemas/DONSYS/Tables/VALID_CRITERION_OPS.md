---
tags:
  - table
  - DONSYS
---
# VALID_CRITERION_OPS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 86
**Last Analyzed**: 2025-09-16 03:14:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CRITERION_NAME | VARCHAR2(25) | No |  |  |
| 2 | CRITERION_OP | VARCHAR2(10) | No |  |  |
| 3 | V_TABLE_NAME | VARCHAR2(32) | No |  |  |
| 4 | TABLE_JOIN | VARCHAR2(1) | No |  |  |
| 5 | PASS_SEQ | NUMBER(3) | Yes |  |  |
| 6 | TITLE_TEXT | VARCHAR2(30) | Yes |  |  |
| 7 | FIELD_TEXT_1 | VARCHAR2(20) | Yes |  |  |
| 8 | FIELD_TEXT_2 | VARCHAR2(20) | Yes |  |  |
| 9 | FIELD_TEXT_3 | VARCHAR2(20) | Yes |  |  |
| 10 | DESC_HINT_TEXT | VARCHAR2(100) | Yes |  |  |
| 11 | WHERE_CLAUSE | VARCHAR2(2000) | Yes |  |  |
| 12 | EFF_DATE | DATE | No |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |
| 14 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 15 | INSERT_DATE | DATE | No |  |  |
| 16 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 17 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_CRITERION_OPS_BD|VALID_CRITERION_OPS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_CRITERION_OPS_BI|VALID_CRITERION_OPS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_CRITERION_OPS_BU|VALID_CRITERION_OPS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
