---
tags:
  - table
  - SBCSYS
---
# DRIVES_LAB

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 48240
**Last Analyzed**: 2026-03-15 15:08:27
**Partitioned**: NO

> [!quote] Created from Entity DRIVE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(6) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | DRIVE_TYPE | VARCHAR2(1) | No |  |  |
| 4 | GROUP_SITE_ID | VARCHAR2(7) | No |  |  |
| 5 | DRIVE_SCH_DATE | DATE | Yes |  |  |
| 6 | NURSING_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | OSOK_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DRIVES_IDX_1 | NORMAL | UNIQUE | DRIVE_ID, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
