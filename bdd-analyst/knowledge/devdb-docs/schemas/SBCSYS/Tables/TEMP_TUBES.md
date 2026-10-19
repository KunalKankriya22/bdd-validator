---
tags:
  - table
  - SBCSYS
---
# TEMP_TUBES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 13
**Last Analyzed**: 2025-11-22 04:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PURPLE_TUBE_FLAG | VARCHAR2(1) | Yes |  |  |
| 4 | RED_TUBE_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | TUBE_CHECKIN_DATS | DATE | No |  |  |
| 6 | EXTRACT_STATUS | VARCHAR2(1) | Yes |  |  |
| 7 | PURPLE_TUBE2_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | SR_REASON | VARCHAR2(5) | Yes |  |  |
| 9 | SR_USER | VARCHAR2(6) | Yes |  |  |
| 10 | RED_TUBE2 | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEMP_TUBES_IDX_1 | NORMAL | UNIQUE | UNIT_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
