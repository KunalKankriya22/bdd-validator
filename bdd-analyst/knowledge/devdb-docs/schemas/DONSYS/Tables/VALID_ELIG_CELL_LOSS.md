---
tags:
  - table
  - DONSYS
---
# VALID_ELIG_CELL_LOSS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 47
**Last Analyzed**: 2026-04-21 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(5) | No |  |  |
| 2 | CELL_TYPE | VARCHAR2(5) | No |  |  |
| 3 | MAXIMUM_LOSS | NUMBER(6) | No |  |  |
| 4 | DAYS_BETWEEN | NUMBER(6) | No |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 8 | INSERT_DATE | DATE | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |
| 11 | FROM_WEIGHT | NUMBER(6) | Yes |  |  |
| 12 | TO_WEIGHT | NUMBER(6) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_ELIG_CELL_LOSS_BD|VALID_ELIG_CELL_LOSS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ELIG_CELL_LOSS_BI|VALID_ELIG_CELL_LOSS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ELIG_CELL_LOSS_BU|VALID_ELIG_CELL_LOSS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
