---
tags:
  - table
  - SBCSYS
---
# COMPONENT_INTERDICTIONS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4766
**Last Analyzed**: 2025-09-16 03:14:24
**Partitioned**: NO

> [!quote] Created from Entity COMPONENT INTERDICTION by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 5 | INTER_CODE | VARCHAR2(4) | No |  |  |
| 6 | INSERT_DATS | DATE | No |  |  |
| 7 | INTER_USER_ID | VARCHAR2(6) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| COMP_INTERDICTIONS_UK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, INTER_CODE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_INTERDICTIONS_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, INTER_CODE | VALID |
| COMPONENT_INTERDICTIONS_IDX_2 | NORMAL | NONUNIQUE | COLL_DATE | VALID |
| COMPONENT_INTERDICTIONS_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/COMPONENT_INTER_BEFORE_DELETE|COMPONENT_INTER_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/COMPONENT_INTER_BEFORE_INSERT|COMPONENT_INTER_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
