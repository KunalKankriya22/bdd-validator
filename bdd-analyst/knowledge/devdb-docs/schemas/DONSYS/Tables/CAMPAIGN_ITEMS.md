---
tags:
  - table
  - DONSYS
---
# CAMPAIGN_ITEMS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 171
**Last Analyzed**: 2025-09-16 03:10:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CAMPAIGN_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | ITEM_ID | VARCHAR2(10) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**CAMPAIGN_ITEMS_PK**: `CAMPAIGN_ID, CHAPTER_ID, ITEM_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| CAMPAIGN_CAMPAIGN_ITEMS_FK | CAMPAIGN_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/CAMPAIGNS\|DONSYS.CAMPAIGNS]] (CAMPAIGN_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CAMPAIGN_ITEMS_PK | NORMAL | UNIQUE | CAMPAIGN_ID, CHAPTER_ID, ITEM_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/CAMPAIGN_ITEMS_BI|CAMPAIGN_ITEMS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
