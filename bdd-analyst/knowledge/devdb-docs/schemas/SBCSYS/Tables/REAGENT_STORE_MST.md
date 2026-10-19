---
tags:
  - table
  - SBCSYS
---
# REAGENT_STORE_MST

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1124
**Last Analyzed**: 2025-09-16 03:14:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | TEST_ID | VARCHAR2(10) | No |  |  |
| 3 | REAGENT_ID | VARCHAR2(10) | No |  |  |
| 4 | REAGENT_TYPE | VARCHAR2(1) | No |  |  |
| 5 | REAGENT_CODE | VARCHAR2(5) | No |  |  |
| 6 | CONTAINER_ID | VARCHAR2(10) | Yes |  |  |
| 7 | EXPIRY_DATE | DATE | Yes |  |  |
| 8 | SUPPLIER_CODE | VARCHAR2(5) | Yes |  |  |
| 9 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 10 | KIT_LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 11 | MIN_STORAGE_TEMP | NUMBER(5,2) | Yes |  |  |
| 12 | MAX_STORAGE_TEMP | NUMBER(5,2) | Yes |  |  |
| 13 | STORAGE_LOCATION | VARCHAR2(8) | Yes |  |  |
| 14 | CHANNEL_NO | VARCHAR2(2) | Yes |  |  |
| 15 | CONTROL_IND | VARCHAR2(6) | Yes |  |  |
| 16 | RECEIVED_DATE | DATE | Yes |  |  |
| 17 | RECEIVED_BY | VARCHAR2(6) | Yes |  |  |
| 18 | VISUAL_QC_FLAG | VARCHAR2(1) | Yes |  |  |
| 19 | QC_DATE | DATE | Yes |  |  |
| 20 | QC_BY | VARCHAR2(6) | Yes |  |  |
| 21 | NO_OF_TESTS | NUMBER(10) | Yes |  |  |
| 22 | REAGENT_STATUS | VARCHAR2(5) | Yes |  |  |
| 23 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 24 | PROGRAM_ID | VARCHAR2(8) | Yes |  |  |
| 25 | LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 26 | PACKAGE_INSERT_DATE | DATE | Yes |  |  |
| 27 | REJECT_REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 28 | REMAINING_TESTS | NUMBER(10) | Yes |  |  |
| 29 | LIC_APPROVE_FLAG | VARCHAR2(1) | Yes |  |  |

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
