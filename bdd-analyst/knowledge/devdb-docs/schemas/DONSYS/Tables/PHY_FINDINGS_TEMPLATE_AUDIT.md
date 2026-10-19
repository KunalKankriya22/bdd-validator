---
tags:
  - table
  - DONSYS
---
# PHY_FINDINGS_TEMPLATE_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5543
**Last Analyzed**: 2026-05-16 11:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | AUDIT_KEY | NUMBER | No |  |  |
| 2 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 3 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 4 | USER_ID | VARCHAR2(6) | No |  |  |
| 5 | TEMPLATE_ID | VARCHAR2(10) | Yes |  |  |
| 6 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 7 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 8 | PHYSICAL_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 10 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 11 | DATA_TYPE | VARCHAR2(1) | Yes |  |  |
| 12 | EFF_DATE | DATE | Yes |  |  |
| 13 | TERM_DATE | DATE | Yes |  |  |

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
