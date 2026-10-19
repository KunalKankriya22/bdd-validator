---
tags:
  - table
  - SBCSYS
---
# VALID_ABO_AUTO

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:15:56
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | RESULT_CODE | VARCHAR2(4) | No |  |  |
| 2 | CH_1_ANTI_A | VARCHAR2(1) | Yes |  |  |
| 3 | CH_2_ANTI_B | VARCHAR2(1) | Yes |  |  |
| 4 | CH_3_ANTI_AB | VARCHAR2(1) | Yes |  |  |
| 5 | CH_4_EMPTY_CELL | VARCHAR2(1) | Yes |  |  |
| 6 | CH_5_80D | VARCHAR2(1) | Yes |  |  |
| 7 | CH_6_CON | VARCHAR2(1) | Yes |  |  |
| 8 | CH_7_8GD | VARCHAR2(1) | Yes |  |  |
| 9 | CH_8_50D | VARCHAR2(1) | Yes |  |  |
| 10 | CH_9_EMPTY_CELL | VARCHAR2(1) | Yes |  |  |
| 11 | CH_10_EMPTY_CELL | VARCHAR2(1) | Yes |  |  |
| 12 | CH_11_A1 | VARCHAR2(1) | Yes |  |  |
| 13 | CH_12_B | VARCHAR2(1) | Yes |  |  |
| 14 | EFF_DATE | DATE | No |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | LAST_MODIFIED_DATE | DATE | Yes |  |  |

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
