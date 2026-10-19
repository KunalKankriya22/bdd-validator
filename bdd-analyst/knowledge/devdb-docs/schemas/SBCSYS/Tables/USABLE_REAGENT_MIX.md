---
tags:
  - table
  - SBCSYS
---
# USABLE_REAGENT_MIX

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 21
**Last Analyzed**: 2025-09-16 03:15:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | PREP_REAGENT_ID | VARCHAR2(10) | No |  |  |
| 3 | REAGENT_ID | VARCHAR2(10) | No |  |  |
| 4 | REAGENT_NAME | VARCHAR2(12) | No |  |  |
| 5 | CONTAINER_ID | VARCHAR2(10) | Yes |  |  |
| 6 | EXPIRY_DATE | DATE | Yes |  |  |
| 7 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 8 | BOX_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(8) | Yes |  |  |
| 10 | QUANTITY | NUMBER(10) | Yes |  |  |
| 11 | REAGENT_CODE | VARCHAR2(5) | Yes |  |  |

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
