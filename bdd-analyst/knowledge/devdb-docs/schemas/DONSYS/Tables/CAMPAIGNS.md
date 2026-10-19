---
tags:
  - table
  - DONSYS
---
# CAMPAIGNS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 120
**Last Analyzed**: 2025-09-16 03:10:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CAMPAIGN_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CAMPAIGN_TYPE | VARCHAR2(5) | No |  |  |
| 4 | THEME | VARCHAR2(240) | Yes |  |  |
| 5 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 6 | CAMPAIGN_SHORT_NAME | VARCHAR2(10) | Yes |  |  |
| 7 | COMMENTS | VARCHAR2(240) | Yes |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 11 | INSERT_DATE | DATE | No |  |  |
| 12 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**CAMPAIGNS_PK**: `CAMPAIGN_ID, CHAPTER_ID`

## Foreign Keys

_None_

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/DONSYS/Tables/CAMPAIGN_ITEMS\|DONSYS.CAMPAIGN_ITEMS]] | CAMPAIGN_CAMPAIGN_ITEMS_FK | CAMPAIGN_ID, CHAPTER_ID → CAMPAIGN_ID, CHAPTER_ID |
| [[schemas/DONSYS/Tables/CAMPAIGN_MEDIAS\|DONSYS.CAMPAIGN_MEDIAS]] | CAMPAIGN_CAMPAIGN_MEDIA_FK | CAMPAIGN_ID, CHAPTER_ID → CAMPAIGN_ID, CHAPTER_ID |
| [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] | CAMPAIGN_DRIVE_FK | CAMPAIGN_ID, CHAPTER_ID → CAMPAIGN_ID, CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CAMPAIGNS_PK | NORMAL | UNIQUE | CAMPAIGN_ID, CHAPTER_ID | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/CAMPAIGNS_BI|CAMPAIGNS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
