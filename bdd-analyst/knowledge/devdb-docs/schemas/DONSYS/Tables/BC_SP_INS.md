---
tags:
  - table
  - DONSYS
---
# BC_SP_INS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 132
**Last Analyzed**: 2026-05-10 11:00:07
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LABEL_CODE | VARCHAR2(10) | Yes |  |  |
| 2 | LINE_NUMBER | NUMBER(2) | Yes |  |  |
| 3 | LINE_TEXT | VARCHAR2(45) | Yes |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 5 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 6 | INSERT_DATS | DATE | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/BC_SP_INS_BI|BC_SP_INS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
