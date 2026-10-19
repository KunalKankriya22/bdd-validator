---
tags:
  - table
  - DONSYS
---
# VALID_STRONG_REACTIVITY

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 98
**Last Analyzed**: 2026-05-21 03:00:11
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EPITOPE_ID_1 | VARCHAR2(6) | No |  |  |
| 2 | EPITOPE_ID_2 | VARCHAR2(6) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | BOND | VARCHAR2(1) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | AUDIT_KEY | NUMBER | No |  |  |

## Primary Key

**VALID_STRONG_REACTIVITY_PK**: `EPITOPE_ID_1, EPITOPE_ID_2, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_STRONG_REACTIVITY_PK | NORMAL | UNIQUE | EPITOPE_ID_1, EPITOPE_ID_2, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_STRONG_REACTIVITY_BD|VALID_STRONG_REACTIVITY_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_STRONG_REACTIVITY_BI|VALID_STRONG_REACTIVITY_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_STRONG_REACTIVITY_BU|VALID_STRONG_REACTIVITY_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
