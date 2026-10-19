---
tags:
  - table
  - LTAPI
---
# API_DONATIONS

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Tablespace**: BC_DATA
**Estimated Rows**: 398
**Last Analyzed**: 2025-10-21 03:00:22
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(10) | Yes |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 3 | DRIVE_ID | VARCHAR2(10) | Yes |  |  |
| 4 | COLL_DATE | DATE | Yes |  |  |
| 5 | SET_ID | VARCHAR2(14) | Yes |  |  |
| 6 | CREDIT_COUNT | NUMBER(3) | Yes |  |  |
| 7 | DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 8 | CREDIT_SPONSOR | VARCHAR2(10) | Yes |  |  |
| 9 | DONATION_TYPE | VARCHAR2(5) | Yes |  |  |
| 10 | BLEED_START_TIME_L1 | DATE | Yes |  |  |
| 11 | BLEED_START_TIME_L2 | DATE | Yes |  |  |
| 12 | BLEED_START_TIME_R1 | DATE | Yes |  |  |
| 13 | BLEED_START_TIME_R2 | DATE | Yes |  |  |
| 14 | BLEED_END_TIME_R | DATE | Yes |  |  |
| 15 | BLEED_END_TIME_L | DATE | Yes |  |  |
| 16 | BLEED_START_PHLEB_L1 | VARCHAR2(6) | Yes |  |  |
| 17 | BLEED_START_PHLEB_L2 | VARCHAR2(6) | Yes |  |  |
| 18 | BLEED_START_PHLEB_R1 | VARCHAR2(6) | Yes |  |  |
| 19 | BLEED_START_PHLEB_R2 | VARCHAR2(6) | Yes |  |  |
| 20 | BLEED_END_PHLEB_R | VARCHAR2(6) | Yes |  |  |
| 21 | BLEED_END_PHLEB_L | VARCHAR2(6) | Yes |  |  |
| 22 | DEFERRAL_REASON | VARCHAR2(50) | Yes |  |  |
| 23 | BAG_TYPE | VARCHAR2(5) | Yes |  |  |
| 24 | DONOR_CUE | VARCHAR2(1) | Yes |  |  |
| 25 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 26 | PROCEDURE_CODE | VARCHAR2(5) | Yes |  |  |
| 27 | NOTE_ID | VARCHAR2(10) | Yes |  |  |
| 28 | ORIGINAL_DONOR_ID | VARCHAR2(10) | Yes |  |  |
| 29 | LOOKUP_ID | VARCHAR2(6) | Yes |  |  |
| 30 | SCREENER_ID | VARCHAR2(6) | Yes |  |  |
| 31 | PHYSICAL_ID | VARCHAR2(6) | Yes |  |  |
| 32 | FIRST_REVIEWER_ID | VARCHAR2(6) | Yes |  |  |
| 33 | SECOND_REVIEWER_ID | VARCHAR2(6) | Yes |  |  |
| 34 | DEFERRED_THRU_DATE | DATE | Yes |  |  |
| 35 | DONOR_SIGNATURE_FLAG | VARCHAR2(1) | Yes |  |  |
| 36 | N_AUDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 37 | N_AUDIT_USER | VARCHAR2(6) | Yes |  |  |
| 38 | N_AUDIT_DATE | DATE | Yes |  |  |
| 39 | ARM_USED | VARCHAR2(1) | Yes |  |  |
| 40 | VOID_UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 41 | START_DATA_ENTRY_TIME | DATE | Yes |  |  |
| 42 | END_DATA_ENTRY_TIME | DATE | Yes |  |  |
| 43 | ENTRY_MODE | VARCHAR2(1) | Yes |  |  |
| 44 | DEFERRAL_ID | VARCHAR2(8) | Yes |  |  |
| 45 | MATERIAL_ID | VARCHAR2(6) | Yes |  |  |
| 46 | BLEED_END_TIME_L2 | DATE | Yes |  |  |
| 47 | BLEED_END_PHLEB_L2 | VARCHAR2(6) | Yes |  |  |
| 48 | BLEED_END_TIME_R2 | DATE | Yes |  |  |
| 49 | BLEED_END_PHLEB_R2 | VARCHAR2(6) | Yes |  |  |
| 50 | INTERFACE_DATE | DATE | Yes |  |  |
| 51 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 52 | INSERT_DATE | DATE | Yes |  |  |
| 53 | INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 54 | AUDIT_KEY | NUMBER | Yes |  |  |
| 55 | PLT_PRE_COUNT | NUMBER | Yes |  |  |
| 56 | PLT_POST_COUNT | NUMBER | Yes |  |  |
| 57 | DEFERRAL_TYPE | VARCHAR2(3) | Yes |  |  |
| 58 | SPONSOR_CLAIM_ID | VARCHAR2(10) | Yes |  |  |
| 59 | ACTUAL_RBC_LOSS | NUMBER(6) | Yes |  |  |
| 60 | ACTUAL_PLASMA_LOSS | NUMBER(6) | Yes |  |  |
| 61 | EQUIP_REFERENCE | VARCHAR2(9) | Yes |  |  |
| 62 | TRANSACTION_MODE | VARCHAR2(1) | Yes |  |  |
| 63 | LT_UPLOAD_DATE | DATE | Yes |  |  |
| 64 | LT_UPLOAD_STATUS | VARCHAR2(1) | Yes |  |  |
| 65 | DATA_SOURCE | VARCHAR2(100) | Yes |  |  |
| 66 | EQUIP_TYPE | VARCHAR2(5) | Yes |  |  |
| 67 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 68 | CATALOG_NUMBER | VARCHAR2(10) | Yes |  |  |
| 69 | OTHER_ARM_USED | VARCHAR2(2) | Yes |  |  |
| 70 | LAPTOP_ID | VARCHAR2(20) | Yes |  |  |
| 71 | UPLOAD_ID | VARCHAR2(50) | Yes |  |  |
| 72 | LT_UPLOAD_ERROR | VARCHAR2(1000) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| API_DONATIONS_IDX1 | NORMAL | NONUNIQUE | UNIT_ID, COLL_DATE | VALID |
| API_DONATIONS_IDX2 | NORMAL | NONUNIQUE | DONOR_ID | VALID |
| API_DONATIONS_IDX3 | NORMAL | NONUNIQUE | VOID_UNIT_ID | VALID |
| API_DONATIONS_IDX5 | NORMAL | NONUNIQUE | DEFERRAL_ID, CHAPTER_ID | VALID |
| API_DONATIONS_IDX6 | NORMAL | NONUNIQUE | DRIVE_ID | VALID |
| API_DONATIONS_IDX8 | NORMAL | NONUNIQUE | SET_ID | VALID |
| API_DONATIONS_UI | NORMAL | NONUNIQUE | UPLOAD_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
