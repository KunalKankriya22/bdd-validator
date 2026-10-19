---
tags:
  - table
  - SBCSYS
---
# ARC_LOG_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:14:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(11) | Yes |  |  |
| 2 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 3 | COLL_DATE | DATE | Yes |  |  |
| 4 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 5 | ARC_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ARC_LOG_DET_IDX1 | NORMAL | NONUNIQUE | UNIT_ID | VALID |
| ARC_LOG_DET_IDX2 | NORMAL | NONUNIQUE | SESSION_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
