---
tags:
  - table
  - SRVSYS
---
# SHIPMENTS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 2133
**Last Analyzed**: 2025-09-16 03:16:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SHIPMENT_NO | VARCHAR2(14) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CONSIGNEE_ID | VARCHAR2(10) | No |  |  |
| 4 | SHIPMENT_DATE | DATE | No |  |  |
| 5 | SHIPMENT_STATUS | VARCHAR2(2) | No |  |  |
| 6 | SHIPPED_BY_USER_ID | VARCHAR2(30) | No |  |  |
| 7 | SHIPMENT_TYPE | VARCHAR2(2) | No |  |  |
| 8 | RECEIPT_DATE | DATE | Yes |  |  |
| 9 | RECEIVED_BY | VARCHAR2(50) | Yes |  |  |
| 10 | TEMPERATURE | NUMBER(5,2) | Yes |  |  |
| 11 | CARRIER | VARCHAR2(5) | Yes |  |  |
| 12 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 13 | TRACK_NO | VARCHAR2(30) | Yes |  |  |
| 14 | FLIGHT_NO | VARCHAR2(6) | Yes |  |  |
| 15 | INVOICE_PRINTED_DATE | DATE | Yes |  |  |
| 16 | AUDIT_KEY | NUMBER | Yes |  |  |
| 17 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**SHIPMENTS_PK**: `SHIPMENT_NO, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| SHIPMENTS_INDX1 | NORMAL | NONUNIQUE | SHIPMENT_STATUS, SHIPMENT_DATE, CHAPTER_ID | VALID |
| SHIPMENTS_PK | NORMAL | UNIQUE | SHIPMENT_NO, CHAPTER_ID | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/SH_BI|SH_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/SH_BU|SH_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
