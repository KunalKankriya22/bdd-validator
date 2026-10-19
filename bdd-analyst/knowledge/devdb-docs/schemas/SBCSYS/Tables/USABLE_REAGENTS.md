---
tags:
  - table
  - SBCSYS
---
# USABLE_REAGENTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 529
**Last Analyzed**: 2025-09-16 03:15:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | REAGENT_ID | VARCHAR2(10) | No |  |  |
| 4 | REAGENT_TYPE | VARCHAR2(1) | Yes |  |  |
| 5 | REAGENT_CODE | VARCHAR2(5) | No |  |  |
| 6 | CONTAINER_ID | VARCHAR2(10) | Yes |  |  |
| 7 | SUPPLIER_CODE | VARCHAR2(50) | Yes |  |  |
| 8 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 9 | MIN_STORAGE_TEMP | NUMBER(5,2) | Yes |  |  |
| 10 | MAX_STORAGE_TEMP | NUMBER(5,2) | Yes |  |  |
| 11 | STORAGE_LOCN | VARCHAR2(8) | Yes |  |  |
| 12 | CHANNEL_NO | VARCHAR2(2) | Yes |  |  |
| 13 | CONTROL_IND | VARCHAR2(6) | Yes |  |  |
| 14 | ACTUAL_RESULT | VARCHAR2(6) | Yes |  |  |
| 15 | EXPIRY_DATE | DATE | Yes |  |  |
| 16 | CHK_OUT_TST | NUMBER(10) | Yes |  |  |
| 17 | PREP_DATE | DATE | Yes |  |  |
| 18 | PREP_BY | VARCHAR2(6) | Yes |  |  |
| 19 | REAGENT_STATUS | VARCHAR2(5) | Yes |  |  |
| 20 | QC_FLAG | VARCHAR2(1) | Yes |  |  |
| 21 | QC_DATE | DATE | Yes |  |  |
| 22 | QC_USER | VARCHAR2(6) | Yes |  |  |
| 23 | REVIEW_FLAG | VARCHAR2(1) | Yes |  |  |
| 24 | REVIEW_DATE | DATE | Yes |  |  |
| 25 | REVIEW_USER | VARCHAR2(6) | Yes |  |  |
| 26 | PROGRAM_ID | VARCHAR2(8) | Yes |  |  |
| 27 | TEST_KIT_ID | VARCHAR2(14) | Yes |  |  |
| 28 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 29 | CHK_OUT_REASON | VARCHAR2(7) | Yes |  |  |
| 30 | TECH1_RESULT | VARCHAR2(6) | Yes |  |  |
| 31 | TECH2_RESULT | VARCHAR2(6) | Yes |  |  |
| 32 | SUPER_RESULT | VARCHAR2(6) | Yes |  |  |
| 33 | OUT_DESTINATION | VARCHAR2(7) | Yes |  |  |
| 34 | MANUFACTURER | VARCHAR2(50) | Yes |  |  |
| 35 | KIT_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |

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
