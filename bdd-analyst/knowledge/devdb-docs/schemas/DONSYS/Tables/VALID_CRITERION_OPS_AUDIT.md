---
tags:
  - table
  - DONSYS
---
# VALID_CRITERION_OPS_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 410
**Last Analyzed**: 2025-09-16 03:14:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | CRITERION_NAME | VARCHAR2(25) | Yes |  |  |
| 6 | CRITERION_OP | VARCHAR2(10) | Yes |  |  |
| 7 | V_TABLE_NAME | VARCHAR2(32) | Yes |  |  |
| 8 | PASS_SEQ | NUMBER(3) | Yes |  |  |
| 9 | TABLE_JOIN | VARCHAR2(1) | Yes |  |  |
| 10 | TITLE_TEXT | VARCHAR2(30) | Yes |  |  |
| 11 | FIELD_TEXT_1 | VARCHAR2(20) | Yes |  |  |
| 12 | FIELD_TEXT_2 | VARCHAR2(20) | Yes |  |  |
| 13 | DESC_HINT_TEXT | VARCHAR2(100) | Yes |  |  |
| 14 | WHERE_CLAUSE | VARCHAR2(1000) | Yes |  |  |
| 15 | EFF_DATE | DATE | Yes |  |  |
| 16 | TERM_DATE | DATE | Yes |  |  |

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
