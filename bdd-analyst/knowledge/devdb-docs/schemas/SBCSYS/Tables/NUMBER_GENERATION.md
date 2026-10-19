---
tags:
  - table
  - SBCSYS
---
# NUMBER_GENERATION

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 400
**Last Analyzed**: 2026-05-24 19:07:56
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | NUMBER_TYPE | VARCHAR2(20) | No |  |  |
| 3 | MAX_NUMBER | NUMBER | No |  |  |
| 4 | RESET_CYCLE | VARCHAR2(1) | Yes |  |  |
| 5 | LAST_RESET_DATE | DATE | Yes |  |  |
| 6 | STARTING_NUMBER | NUMBER | Yes |  |  |

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
