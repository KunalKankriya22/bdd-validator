---
tags:
  - table
  - DONSYS
---
# MOBILE_DRIVE_SLOTS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1608
**Last Analyzed**: 2025-09-16 03:13:59
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | DRIVE_ID | VARCHAR2(10) | No |  |  |
| 2 | TIME_OF_DAY | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | DRIVE_DATE | DATE | No |  |  |
| 5 | MAX_SLOTS | NUMBER | No |  |  |
| 6 | BOOKED_SLOTS | NUMBER | Yes |  |  |
| 7 | ORPHAN_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 9 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 10 | INSERT_DATE | DATE | No |  |  |

## Primary Key

**MOBILE_DRIVE_SLOTS_PK**: `DRIVE_ID, TIME_OF_DAY, CHAPTER_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| MOBILE_DRIVE_SLOT_DRIVE_FK | DRIVE_ID, CHAPTER_ID | [[schemas/DONSYS/Tables/DRIVES\|DONSYS.DRIVES]] (DRIVE_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| MOBILE_DRIVE_SLOTS_PK | NORMAL | UNIQUE | DRIVE_ID, TIME_OF_DAY, CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
