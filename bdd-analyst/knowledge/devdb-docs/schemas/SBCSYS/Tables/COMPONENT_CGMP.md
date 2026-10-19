---
tags:
  - table
  - SBCSYS
---
# COMPONENT_CGMP

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 12146
**Last Analyzed**: 2025-09-16 03:14:23
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 5 | ALIQUOT | VARCHAR2(2) | Yes |  |  |
| 6 | PARM_CODE | VARCHAR2(5) | No |  |  |
| 7 | PARM_VALUE | VARCHAR2(10) | Yes |  |  |
| 8 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 9 | PROCESS_DATS | DATE | Yes |  |  |
| 10 | INSERT_DATS | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(10) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| COMPONENT_CGMP_UK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ALIQUOT, PARM_CODE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_CGMP_IDX1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ALIQUOT, PARM_CODE | VALID |
| COMPONENT_CGMP_IDX_1 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE | VALID |
| COMPONENT_CGMP_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/COMPONENT_CGMP_BEFORE_DELETE|COMPONENT_CGMP_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/COMPONENT_CGMP_BEFORE_INSERT|COMPONENT_CGMP_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/COMPONENT_CGMP_BEFORE_UPDATE|COMPONENT_CGMP_BEFORE_UPDATE]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
