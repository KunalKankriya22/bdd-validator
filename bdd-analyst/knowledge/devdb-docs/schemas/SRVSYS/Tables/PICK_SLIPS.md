---
tags:
  - table
  - SRVSYS
---
# PICK_SLIPS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3608
**Last Analyzed**: 2025-09-16 03:16:08
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PICK_SLIP_ID | VARCHAR2(13) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 4 | PICK_SLIP_TYPE | VARCHAR2(2) | No |  |  |
| 5 | PICK_SLIP_STATUS | VARCHAR2(2) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | PICKED_BY | VARCHAR2(10) | Yes |  |  |
| 8 | SOURCE_HOSPITAL | VARCHAR2(10) | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**PICK_SLIPS_PK**: `PICK_SLIP_ID, CHAPTER_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| ORDERS_PICK_SLIPS_FK | ORDER_NO, CHAPTER_ID | [[schemas/SRVSYS/Tables/ORDERS\|SRVSYS.ORDERS]] (ORDER_NO, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PICK_SLIPS_IDX_2 | NORMAL | NONUNIQUE | PICK_SLIP_ID, CHAPTER_ID, ORDER_NO | VALID |
| PICK_SLIPS_IDX_3 | NORMAL | NONUNIQUE | ORDER_NO, CHAPTER_ID, PICK_SLIP_ID | VALID |
| PICK_SLIPS_IDX_4 | NORMAL | NONUNIQUE | PICK_SLIP_TYPE, PICK_SLIP_STATUS, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/PS_BI|PS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/PS_BU|PS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| V_ALL_ORD_SHIP | VIEW | SRVSYS |
| V_ORDERS_TO_SHIPMENTS | VIEW | SRVSYS |
