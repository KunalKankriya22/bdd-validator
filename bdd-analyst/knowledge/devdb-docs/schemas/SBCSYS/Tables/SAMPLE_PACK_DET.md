---
tags:
  - table
  - SBCSYS
---
# SAMPLE_PACK_DET

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 351
**Last Analyzed**: 2025-09-16 03:14:40
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BOX_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | PURPLE_TUBE_FLAG | VARCHAR2(1) | Yes |  |  |
| 5 | PURPLE_TUBE2_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | RED_TUBE_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
