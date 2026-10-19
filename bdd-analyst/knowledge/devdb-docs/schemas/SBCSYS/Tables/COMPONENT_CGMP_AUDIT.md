---
tags:
  - table
  - SBCSYS
---
# COMPONENT_CGMP_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 16604
**Last Analyzed**: 2025-09-20 03:00:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 5 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 6 | PARM_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | PARM_VALUE | VARCHAR2(10) | Yes |  |  |
| 8 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 9 | PROCESS_DATS | DATE | Yes |  |  |
| 10 | INSERT_DATS | DATE | Yes |  |  |
| 11 | INSERT_USER | VARCHAR2(10) | Yes |  |  |
| 12 | AUDIT_KEY | NUMBER | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 14 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 15 | AUDIT_INSERT_USER | VARCHAR2(10) | Yes |  |  |

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
