---
tags:
  - table
  - DONSYS
---
# VALID_ITEM_MASTER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 64
**Last Analyzed**: 2026-03-07 04:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ITEM_CODE | VARCHAR2(10) | No |  |  |
| 2 | ITEM_DESC | VARCHAR2(50) | No |  |  |
| 3 | LOT_REQD | VARCHAR2(1) | Yes |  |  |
| 4 | AVG_COST | NUMBER(8,2) | Yes |  |  |
| 5 | ENFORCE_EXIPIRATION | VARCHAR2(1) | Yes |  |  |
| 6 | RESOURCE_CODE | VARCHAR2(5) | Yes |  |  |
| 7 | MINIMUM_LEVEL | NUMBER(4) | Yes |  |  |
| 8 | REORDER_LEVEL | NUMBER(4) | Yes |  |  |
| 9 | RETURN_FLAG | VARCHAR2(1) | Yes |  |  |
| 10 | QTY_ON_HAND | NUMBER(4) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | INSERT_DATE | DATE | No |  |  |
| 15 | INSERT_USER | VARCHAR2(6) | No |  |  |
| 16 | AUDIT_KEY | NUMBER | No |  |  |
| 17 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| VALID_ITEM_MASTER_UNIQUE | ITEM_CODE, CHAPTER_ID | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ITEM_MASTER_UNIQUE | NORMAL | UNIQUE | ITEM_CODE, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/VALID_ITEM_MASTER_BD|VALID_ITEM_MASTER_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ITEM_MASTER_BI|VALID_ITEM_MASTER_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/VALID_ITEM_MASTER_BU|VALID_ITEM_MASTER_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
