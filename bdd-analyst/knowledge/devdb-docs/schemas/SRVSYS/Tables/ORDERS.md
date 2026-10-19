---
tags:
  - table
  - SRVSYS
---
# ORDERS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3768
**Last Analyzed**: 2025-09-16 03:16:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ORDER_NO | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ORDER_TYPE | VARCHAR2(2) | No |  |  |
| 4 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 5 | CONSIGNEE_ID | VARCHAR2(10) | No |  |  |
| 6 | PAYEE_ID | VARCHAR2(10) | No |  |  |
| 7 | ORDER_STATUS | VARCHAR2(2) | No |  |  |
| 8 | ORDER_CLASS | VARCHAR2(2) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | INSERT_USER_ID | VARCHAR2(10) | No |  |  |
| 11 | LAST_ACTIVITY_DATE | DATE | No |  |  |
| 12 | CONTRACT_ID | VARCHAR2(10) | Yes |  |  |
| 13 | ORDERED_BY | VARCHAR2(50) | Yes |  |  |
| 14 | COD_FLAG | VARCHAR2(1) | Yes |  |  |
| 15 | EST_ARRIVAL_TIME | DATE | Yes |  |  |
| 16 | FIRST_SHIP_DATE | DATE | Yes |  |  |
| 17 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 18 | STANDING_ORDER_FLAG | VARCHAR2(1) | Yes |  |  |
| 19 | ORDER_MODE | VARCHAR2(2) | Yes |  |  |
| 20 | AUDIT_KEY | NUMBER | Yes |  |  |
| 21 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**ORDERS_PK**: `ORDER_NO, CHAPTER_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| CUSTOMER_ORDERS_FK | CUSTOMER_ID, CHAPTER_ID | [[schemas/SRVSYS/Tables/CUSTOMERS\|SRVSYS.CUSTOMERS]] (CUSTOMER_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SRVSYS/Tables/ORDER_CHARGES\|SRVSYS.ORDER_CHARGES]] | ORDERS_ORDER_CHARGES_FK | ORDER_NO, CHAPTER_ID → ORDER_NO, CHAPTER_ID |
| [[schemas/SRVSYS/Tables/ORDER_ITEMS\|SRVSYS.ORDER_ITEMS]] | ORDERS_ORDER_DETAILS_FK | ORDER_NO, CHAPTER_ID → ORDER_NO, CHAPTER_ID |
| [[schemas/SRVSYS/Tables/ORDER_ITEM_ANTIGENS\|SRVSYS.ORDER_ITEM_ANTIGENS]] | ORD_ORD_ITEM_ANTIGENS_FK | ORDER_NO, CHAPTER_ID → ORDER_NO, CHAPTER_ID |
| [[schemas/SRVSYS/Tables/ORDER_ITEM_ATTRIBUTES\|SRVSYS.ORDER_ITEM_ATTRIBUTES]] | ORD_ORD_ITEM_ATTRIB_FK | ORDER_NO, CHAPTER_ID → ORDER_NO, CHAPTER_ID |
| [[schemas/SRVSYS/Tables/PICK_SLIPS\|SRVSYS.PICK_SLIPS]] | ORDERS_PICK_SLIPS_FK | ORDER_NO, CHAPTER_ID → ORDER_NO, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ORDERS_IDX_2 | NORMAL | NONUNIQUE | ORDER_TYPE, ORDER_STATUS, CHAPTER_ID | VALID |
| ORDERS_IDX_3 | NORMAL | NONUNIQUE | INSERT_DATE | VALID |
| ORDERS_PK | NORMAL | UNIQUE | ORDER_NO, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/OR_BI|OR_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/OR_BU|OR_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| GEN_ORDER_NO | FUNCTION | SRVSYS |
| V_ALL_ORD_SHIP | VIEW | SRVSYS |
| V_ORDERS_TO_SHIPMENTS | VIEW | SRVSYS |
