---
tags:
  - table
  - DONSYS
---
# PHYSICAL_FINDINGS_HOLD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 735
**Last Analyzed**: 2025-10-07 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PHYSICAL_CODE | VARCHAR2(5) | No |  |  |
| 4 | PHYSICAL_VALUE | VARCHAR2(10) | Yes |  |  |
| 5 | INTER_CODE | VARCHAR2(5) | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | SORT_SEQUENCE | NUMBER(3) | Yes |  |  |
| 11 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 12 | PHYSICAL_VALUE_REPEAT | VARCHAR2(10) | Yes |  |  |
| 13 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 14 | EQUIP_REFERENCE_REPEAT | VARCHAR2(9) | Yes |  |  |

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
