---
tags:
  - table
  - DONSYS
---
# CAMPAIGN_MEDIAS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 107
**Last Analyzed**: 2025-09-16 03:10:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CAMPAIGN_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | MEDIA_TYPE | VARCHAR2(5) | No |  |  |
| 4 | MEDIA_VALUE | VARCHAR2(128) | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(8) | No |  |  |
| 6 | INSERT_DATE | DATE | No |  |  |
| 7 | INSERT_USER | VARCHAR2(6) | No |  |  |

## Primary Key

**CAMPAIGN_MEDIAS_PK**: `CAMPAIGN_ID, CHAPTER_ID, MEDIA_TYPE, MEDIA_VALUE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| CAMPAIGN_CAMPAIGN_MEDIA_FK | CAMPAIGN_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/CAMPAIGNS\|DONSYS.CAMPAIGNS]] (CAMPAIGN_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CAMPAIGN_MEDIAS_PK | NORMAL | UNIQUE | CAMPAIGN_ID, CHAPTER_ID, MEDIA_TYPE, MEDIA_VALUE | VALID |

## Triggers

- [[schemas/DONSYS/Triggers/CAMPAIGN_MEDIAS_BI|CAMPAIGN_MEDIAS_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
