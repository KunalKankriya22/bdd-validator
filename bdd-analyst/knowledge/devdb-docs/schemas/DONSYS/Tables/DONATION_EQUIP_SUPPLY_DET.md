---
tags:
  - table
  - DONSYS
---
# DONATION_EQUIP_SUPPLY_DET

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 18760
**Last Analyzed**: 2025-11-14 04:00:13
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | No |  |  |
| 2 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 3 | EQUIP_OR_SUPPLY | VARCHAR2(10) | No |  |  |
| 4 | EQUIP_SUPPLY_CODE | VARCHAR2(10) | No |  |  |
| 5 | SUPPLY_ID | VARCHAR2(50) | Yes |  |  |
| 6 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 7 | CATALOG_NO | VARCHAR2(10) | Yes |  |  |
| 8 | LOT_NO | VARCHAR2(20) | Yes |  |  |
| 9 | QC_STATUS | VARCHAR2(10) | Yes |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |
| 11 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | AUDIT_KEY | NUMBER | No |  |  |
| 14 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 15 | SET_ID | VARCHAR2(50) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DONATION_EQUIP_SUPPLY_DET_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DONATION_EQUIP_SUPPLY_DET_BD|DONATION_EQUIP_SUPPLY_DET_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/DONSYS/Triggers/DONATION_EQUIP_SUPPLY_DET_BI|DONATION_EQUIP_SUPPLY_DET_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/DONSYS/Triggers/DONATION_EQUIP_SUPPLY_DET_BU|DONATION_EQUIP_SUPPLY_DET_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| GENBDR | PACKAGE | DONSYS |
