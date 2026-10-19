---
tags:
  - table
  - VISTA
---
# VIS_DONATION

**Schema**: [[schemas/VISTA/VISTA|VISTA]]
**Tablespace**: BC_DATA
**Estimated Rows**: 85
**Last Analyzed**: 2025-09-26 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TRANSACTION_ID | VARCHAR2(20) | Yes |  |  |
| 2 | IS_SOLICITED_FLAG | VARCHAR2(1) | Yes |  |  |
| 3 | UNIT_NUMBER | VARCHAR2(20) | Yes |  |  |
| 4 | DONOR_ID | VARCHAR2(20) | Yes |  |  |
| 5 | VISIT_DATE | DATE | Yes |  |  |
| 6 | LOCATION_CODE | VARCHAR2(15) | Yes |  |  |
| 7 | DONOR_REJECTED | VARCHAR2(1) | Yes |  |  |
| 8 | DONOR_HEIGHT | NUMBER(6) | Yes |  |  |
| 9 | DONOR_WEIGHT | NUMBER(6) | Yes |  |  |
| 10 | DONOR_TBV | NUMBER(6) | Yes |  |  |
| 11 | PRE_HEMATOCRIT | NUMBER(6) | Yes |  |  |
| 12 | PRE_HEMOGLOBIN | NUMBER(6) | Yes |  |  |
| 13 | PRE_PLATELET | NUMBER(6) | Yes |  |  |
| 14 | PRE_BP_SYSTOLIC | NUMBER(6) | Yes |  |  |
| 15 | PRE_BP_DIASTOLIC | NUMBER(6) | Yes |  |  |
| 16 | PRE_TEMPERATURE | NUMBER(6) | Yes |  |  |
| 17 | PRE_PULSE | NUMBER(6) | Yes |  |  |
| 18 | PROCEDURE_CODE | VARCHAR2(15) | Yes |  |  |
| 19 | PLATELET_PROD_CODE | VARCHAR2(7) | Yes |  |  |
| 20 | PLATELET_YIELD | NUMBER(6) | Yes |  |  |
| 21 | PLATELET_BAG_VOL | NUMBER(6) | Yes |  |  |
| 22 | PLATELET_PLASMA_VOL | NUMBER(6) | Yes |  |  |
| 23 | PLATELET_AC_VOL | NUMBER(6) | Yes |  |  |
| 24 | COUNT_PLT_PROD_FLAG | VARCHAR2(1) | Yes |  |  |
| 25 | PLT_YIELD_VERIFY_FLAG | VARCHAR2(1) | Yes |  |  |
| 26 | PLT_VOL_VERIFY_FLAG | VARCHAR2(1) | Yes |  |  |
| 27 | PLT_CONCEN_VERIFY_FLAG | VARCHAR2(1) | Yes |  |  |
| 28 | PLASMA_PRODUCT_CODE | VARCHAR2(10) | Yes |  |  |
| 29 | PLASMA_BAG_VOL | NUMBER(6) | Yes |  |  |
| 30 | PLASMA_PRODUCT_VOL | NUMBER(6) | Yes |  |  |
| 31 | PLASMA_AC_VOL | NUMBER(6) | Yes |  |  |
| 32 | PLASMA_VOL_VERIFY_FLAG | VARCHAR2(1) | Yes |  |  |
| 33 | COUNT_PLASMA_PROD_FLAG | VARCHAR2(1) | Yes |  |  |
| 34 | RBC_PRODUCT_CODE | VARCHAR2(10) | Yes |  |  |
| 35 | RBC_PRODUCT_VOL | NUMBER(6) | Yes |  |  |
| 36 | RBC_PACKED_VOL | NUMBER(6) | Yes |  |  |
| 37 | RBC_AC_VOL | NUMBER(6) | Yes |  |  |
| 38 | RBC_VOL_VERIFY_FLAG | VARCHAR2(1) | Yes |  |  |
| 39 | RBC_COLLECT_HEMATOCRIT | NUMBER(6) | Yes |  |  |
| 40 | REPLACEMENT_FLUID_USED | NUMBER(6) | Yes |  |  |
| 41 | RINSEBACK_FLAG | VARCHAR2(1) | Yes |  |  |
| 42 | PLASMA_TUBING_RESIDUAL | NUMBER(6) | Yes |  |  |
| 43 | RBC_TUBING_RESIDUAL | NUMBER(6) | Yes |  |  |
| 44 | MISC_PLASMA_LOSS | NUMBER(6) | Yes |  |  |
| 45 | MISC_RBC_LOSS | NUMBER(6) | Yes |  |  |
| 46 | PLASMA_SAMPLING_LOSS | NUMBER(6) | Yes |  |  |
| 47 | RBC_SAMPLING_LOSS | NUMBER(6) | Yes |  |  |
| 48 | BLOOD_VOL_PROCESSED | NUMBER(6) | Yes |  |  |
| 49 | TOTAL_VOL_DONATED | NUMBER(6) | Yes |  |  |
| 50 | TOTAL_BLOOD_LOSS | NUMBER(6) | Yes |  |  |
| 51 | TOTAL_PLASMA_LOSS | NUMBER(6) | Yes |  |  |
| 52 | TOTAL_RBC_LOSS | NUMBER(6) | Yes |  |  |
| 53 | AC_VOL_USED | NUMBER(6) | Yes |  |  |
| 54 | AC_RATIO | NUMBER(6) | Yes |  |  |
| 55 | AC_INFUSION | NUMBER(6) | Yes |  |  |
| 56 | AC_VOL_TO_DONOR | NUMBER(6) | Yes |  |  |
| 57 | ACCESS_LOCATION | NUMBER(2) | Yes |  |  |
| 58 | RETURN_LOCATION | NUMBER(2) | Yes |  |  |
| 59 | POST_HEMATOCRIT | NUMBER(6) | Yes |  |  |
| 60 | POST_HEMOGLOBIN | NUMBER(6) | Yes |  |  |
| 61 | POST_PLATELET | NUMBER(6) | Yes |  |  |
| 62 | POST_BP_SYSTOLIC | NUMBER(6) | Yes |  |  |
| 63 | POST_BP_DIASTOLIC | NUMBER(6) | Yes |  |  |
| 64 | POST_PULSE | NUMBER(6) | Yes |  |  |
| 65 | DONOR_CONNECT_TIME | VARCHAR2(5) | Yes |  |  |
| 66 | DONOR_CONNECT_DATE | DATE | Yes |  |  |
| 67 | PROC_END_TIME | VARCHAR2(5) | Yes |  |  |
| 68 | PROC_END_DATE | DATE | Yes |  |  |
| 69 | LENGTH_OF_RUN | NUMBER(3) | Yes |  |  |
| 70 | MACHINE_ID | VARCHAR2(20) | Yes |  |  |
| 71 | MACHINE_TYPE | VARCHAR2(30) | Yes |  |  |
| 72 | MACHINE_SERIAL_NBR | VARCHAR2(30) | Yes |  |  |
| 73 | TUBING_SET_MANUF | VARCHAR2(30) | Yes |  |  |
| 74 | TUBING_SET_CATALOG_NBR | VARCHAR2(30) | Yes |  |  |
| 75 | TUBING_SET_LOT_NBR | VARCHAR2(30) | Yes |  |  |
| 76 | OPER1_BADGE_ID | VARCHAR2(20) | Yes |  |  |
| 77 | OPER2_BADGE_ID | VARCHAR2(20) | Yes |  |  |
| 78 | OPER3_BADGE_ID | VARCHAR2(20) | Yes |  |  |
| 79 | OPER4_BADGE_ID | VARCHAR2(20) | Yes |  |  |
| 80 | OBSERV_CODE1 | VARCHAR2(6) | Yes |  |  |
| 81 | OBSERV_CODE2 | VARCHAR2(6) | Yes |  |  |
| 82 | OBSERV_CODE3 | VARCHAR2(6) | Yes |  |  |
| 83 | OBSERV_CODE4 | VARCHAR2(6) | Yes |  |  |
| 84 | OBSERV_CODE5 | VARCHAR2(6) | Yes |  |  |
| 85 | OBSERV_CODE6 | VARCHAR2(6) | Yes |  |  |
| 86 | OBSERV_CODE7 | VARCHAR2(6) | Yes |  |  |
| 87 | OBSERV_CODE8 | VARCHAR2(6) | Yes |  |  |
| 88 | OBSERV_CODE9 | VARCHAR2(6) | Yes |  |  |
| 89 | OBSERV_CODE10 | VARCHAR2(6) | Yes |  |  |
| 90 | ABORTED_RUN_CODE | VARCHAR2(6) | Yes |  |  |
| 91 | INCOMPLETE_PROC_FLAG | VARCHAR2(1) | Yes |  |  |
| 92 | REASON_CODE | VARCHAR2(6) | Yes |  |  |
| 93 | CONTAINER_TYPE_CODE | VARCHAR2(20) | Yes |  |  |
| 94 | COMMENTS | VARCHAR2(80) | Yes |  |  |
| 95 | STATUS | VARCHAR2(3) | Yes |  |  |
| 96 | STATUS_DATE | DATE | Yes |  |  |
| 97 | FILE_NAME | VARCHAR2(60) | Yes |  |  |

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
