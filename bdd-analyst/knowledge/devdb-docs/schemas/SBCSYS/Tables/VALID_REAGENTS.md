---
tags:
  - table
  - SBCSYS
---
# VALID_REAGENTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 446
**Last Analyzed**: 2025-09-16 03:16:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | REAGENT_CODE | VARCHAR2(5) | No |  |  |
| 2 | REAGENT_NAME | VARCHAR2(50) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | PREPARATION_FLAG | VARCHAR2(10) | Yes |  |  |
| 5 | EFF_DATE | DATE | No |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFY_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFY_USER | VARCHAR2(6) | Yes |  |  |
| 9 | REAGENT_TYPE | VARCHAR2(1) | Yes |  |  |
| 10 | CONTROL_FLAG | VARCHAR2(1) | Yes |  |  |
| 11 | MASTER_LOT_REQUIRED | VARCHAR2(1) | Yes |  |  |
| 12 | PREQUALIFICATION_FLAG | VARCHAR2(1) | Yes |  |  |

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
