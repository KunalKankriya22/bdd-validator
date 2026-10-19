---
tags:
  - table
  - DONSYS
---
# DRIVE_CAMPAIGN_ITEMS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1524
**Last Analyzed**: 2025-09-16 03:13:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ITEM_ID | VARCHAR2(10) | No |  |  |
| 4 | QTY | NUMBER(6) | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**DRIVE_CAMPAIGN_ITEMS_PK**: `DRIVE_ID, CHAPTER_ID, ITEM_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| DRIVE_DRIVE_CAMP_ITEMS_FK | DRIVE_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] (DRIVE_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVE_CAMPAIGN_ITEMS_PK | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID, ITEM_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/DRIVE_CAMPAIGN_ITEMS_BI|DRIVE_CAMPAIGN_ITEMS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
