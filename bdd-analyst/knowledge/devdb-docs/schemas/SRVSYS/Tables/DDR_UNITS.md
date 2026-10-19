---
tags:
  - table
  - SRVSYS
---
# DDR_UNITS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 59
**Last Analyzed**: 2025-11-23 12:00:06
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 3 | COLL_DATE | DATE | No |  |  |
| 4 | MODIFY_DATE | DATE | No |  |  |

## Primary Key

**DUT_PK**: `CHAPTER_ID, UNIT_ID, COLL_DATE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| DUT_PK | NORMAL | UNIQUE | CHAPTER_ID, UNIT_ID, COLL_DATE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
