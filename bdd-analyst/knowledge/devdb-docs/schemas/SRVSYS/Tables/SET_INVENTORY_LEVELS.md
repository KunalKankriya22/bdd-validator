---
tags:
  - table
  - SRVSYS
---
# SET_INVENTORY_LEVELS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 634
**Last Analyzed**: 2026-05-24 15:07:49
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INVENTORY_CLASS | VARCHAR2(2) | No |  |  |
| 2 | INVENTORY_TYPE | VARCHAR2(2) | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 5 | BLOOD_TYPE | VARCHAR2(4) | No |  |  |
| 6 | QTY | NUMBER(5) | No |  |  |
| 7 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 8 | TIER | NUMBER(2) | Yes |  |  |
| 9 | ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 10 | ATTRIB_GROUP | VARCHAR2(10) | Yes |  |  |
| 11 | EFF_DATE | DATE | No |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SET_INVENTORY_LEVELS_IDX_1 | NORMAL | UNIQUE | INVENTORY_CLASS, INVENTORY_TYPE, CHAPTER_ID, CUSTOMER_ID, PRODUCT_TYPE, BLOOD_TYPE, ATTRIB_CODE, ATTRIB_GROUP | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/SET_INVENTORY_LEVELS_BD|SET_INVENTORY_LEVELS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/SET_INVENTORY_LEVELS_BI|SET_INVENTORY_LEVELS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/SET_INVENTORY_LEVELS_BU|SET_INVENTORY_LEVELS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
