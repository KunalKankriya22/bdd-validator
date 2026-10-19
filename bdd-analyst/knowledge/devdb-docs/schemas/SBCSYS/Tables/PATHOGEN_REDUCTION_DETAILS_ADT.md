---
tags:
  - table
  - SBCSYS
---
# PATHOGEN_REDUCTION_DETAILS_ADT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1491
**Last Analyzed**: 2025-09-16 03:14:33
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | INITIAL_PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 5 | VOL_TYPE_SET | VARCHAR2(5) | Yes |  |  |
| 6 | SUSPENSION_TYPE | VARCHAR2(20) | Yes |  |  |
| 7 | INIT_PLT_COUNT | NUMBER | Yes |  |  |
| 8 | RBC_CONTENT_STATUS | VARCHAR2(5) | Yes |  |  |
| 9 | BLEED_START_TIME | DATE | Yes |  |  |
| 10 | BLEED_END_TIME | DATE | Yes |  |  |
| 11 | INITIAL_PROD_WEIGHT | NUMBER | Yes |  |  |
| 12 | INITIAL_PROD_VOL | NUMBER | Yes |  |  |
| 13 | EQUIP_TYPE | VARCHAR2(10) | Yes |  |  |
| 14 | ILLUMINATION_START_TIME | DATE | Yes |  |  |
| 15 | SET_ID_LOT_NO | VARCHAR2(10) | Yes |  |  |
| 16 | TREATMENT_DATE | DATE | Yes |  |  |
| 17 | TREATMENT_START_TIME | DATE | Yes |  |  |
| 18 | TREATMENT_TIME | VARCHAR2(10) | Yes |  |  |
| 19 | OPERATOR_ID | VARCHAR2(30) | Yes |  |  |
| 20 | CAD_START_TIME | DATE | Yes |  |  |
| 21 | CAD_END_TIME | DATE | Yes |  |  |
| 22 | CAD_TOTAL_TIME | VARCHAR2(10) | Yes |  |  |
| 23 | ILLUMINATION_STATUS | VARCHAR2(1) | Yes |  |  |
| 24 | ANTICOAGULANT_VOLUME | NUMBER(4) | Yes |  |  |
| 25 | AGGR_ACC | VARCHAR2(1) | Yes |  |  |
| 26 | SUIT_STATUS_REASON | VARCHAR2(200) | Yes |  |  |
| 27 | INSERT_DATE | DATE | Yes |  |  |
| 28 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 29 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 30 | AUDIT_KEY | NUMBER | No |  |  |
| 31 | SUIT_STATUS_CODE | VARCHAR2(1) | Yes |  |  |
| 32 | SUIT_PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 33 | ILLUMINATOR_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 34 | CAD_PROD_CODE | VARCHAR2(8) | Yes |  |  |
| 35 | FINAL_PRD_NUM_OF_BAGS | NUMBER | Yes |  |  |
| 36 | ILLUMINATOR_MESSAGE | VARCHAR2(240) | Yes |  |  |
| 37 | PROD_CATEGORY | VARCHAR2(10) | Yes |  |  |
| 38 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 39 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

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
