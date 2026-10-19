---
tags:
  - table
  - DONSYS
---
# PHYSICAL_FINDINGS_TEMPLATE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 844
**Last Analyzed**: 2026-04-30 03:00:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEMPLATE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DONATION_TYPE | VARCHAR2(5) | No |  |  |
| 4 | PHYSICAL_CODE | VARCHAR2(5) | No |  |  |
| 5 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 7 | DATA_TYPE | VARCHAR2(1) | Yes |  |  |
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

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| PHYSICAL_FINDINGS_TEMPLATE_U1 | TEMPLATE_ID, CHAPTER_ID, PHYSICAL_CODE, PROCEDURE_CODE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PHYSICAL_FINDINGS_TEMPLATE_U1 | NORMAL | UNIQUE | TEMPLATE_ID, CHAPTER_ID, PHYSICAL_CODE, PROCEDURE_CODE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/PHYSICAL_FINDINGS_TEMPLATE_BD|PHYSICAL_FINDINGS_TEMPLATE_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/PHYSICAL_FINDINGS_TEMPLATE_BI|PHYSICAL_FINDINGS_TEMPLATE_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/PHYSICAL_FINDINGS_TEMPLATE_BU|PHYSICAL_FINDINGS_TEMPLATE_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
