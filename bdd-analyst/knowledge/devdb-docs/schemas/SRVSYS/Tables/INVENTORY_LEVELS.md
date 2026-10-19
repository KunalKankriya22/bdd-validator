---
tags:
  - table
  - SRVSYS
---
# INVENTORY_LEVELS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1034
**Last Analyzed**: 2026-05-23 15:07:17
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | INVENTORY_CLASS | VARCHAR2(2) | No |  |  |
| 4 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 5 | BLOOD_TYPE | VARCHAR2(4) | No |  |  |
| 6 | TIER | NUMBER(2) | No |  |  |
| 7 | ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 8 | ATTRIB_GROUP | VARCHAR2(10) | Yes |  |  |
| 9 | QTY | NUMBER(5) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| INVENTORY_LEVELS_UK | CUSTOMER_ID, CHAPTER_ID, INVENTORY_CLASS, PRODUCT_TYPE, BLOOD_TYPE, TIER, ATTRIB_CODE, ATTRIB_GROUP | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| INVENTORY_LEVELS_UK | NORMAL | UNIQUE | CUSTOMER_ID, CHAPTER_ID, INVENTORY_CLASS, PRODUCT_TYPE, BLOOD_TYPE, TIER, ATTRIB_CODE, ATTRIB_GROUP | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
