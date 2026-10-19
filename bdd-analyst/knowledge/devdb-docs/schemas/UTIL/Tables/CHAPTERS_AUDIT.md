---
tags:
  - table
  - UTIL
---
# CHAPTERS_AUDIT

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 42826
**Last Analyzed**: 2025-09-16 03:16:16
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | CHAPTER_NAME | VARCHAR2(50) | Yes |  |  |
| 3 | CHAPTER_SHORT_NAME | VARCHAR2(10) | Yes |  |  |
| 4 | ADDRESS_ID | NUMBER(6) | Yes |  |  |
| 5 | PRINT_HDR | VARCHAR2(50) | Yes |  |  |
| 6 | TEST_CHAPTER_IND | VARCHAR2(1) | Yes |  |  |
| 7 | BATCH_SEQ | NUMBER(7) | Yes |  |  |
| 8 | TB_SEQ | NUMBER(7) | Yes |  |  |
| 9 | WS_SEQ | NUMBER(7) | Yes |  |  |
| 10 | SDC_WS_SEQ | NUMBER(7) | Yes |  |  |
| 11 | TEST_KIT_SEQ | NUMBER(7) | Yes |  |  |
| 12 | DRIVE_ID | VARCHAR2(6) | Yes |  |  |
| 13 | UNIT_SCHEME | VARCHAR2(1) | Yes |  |  |
| 14 | GROUP_SITE_ID | VARCHAR2(7) | Yes |  |  |
| 15 | POOL_SEQ | NUMBER(7) | Yes |  |  |
| 16 | WORK_NUMBER_SEQ | NUMBER(5) | Yes |  |  |
| 17 | MAX_BLEED_TIME | NUMBER(2) | Yes |  |  |
| 18 | SLOW_BLEED_TIME | NUMBER(2) | Yes |  |  |
| 19 | CUE_SCAN_FLAG | VARCHAR2(1) | Yes |  |  |
| 20 | SEQ_CHECKIN_FLAG | VARCHAR2(1) | Yes |  |  |
| 21 | QC_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 22 | NURSING_FLAG | VARCHAR2(1) | Yes |  |  |
| 23 | FFP_FREEZE_DURN | NUMBER(5,2) | Yes |  |  |
| 24 | CRYO_TIME_LIMIT | NUMBER(5,2) | Yes |  |  |
| 25 | ALT_E_LEVEL | NUMBER(7,2) | Yes |  |  |
| 26 | ALT_SE_LEVEL | NUMBER(7,2) | Yes |  |  |
| 27 | LAB_CP6_DATS | DATE | Yes |  |  |
| 28 | DMIS_LABDS_DATS | DATE | Yes |  |  |
| 29 | DMIS_LAB_DATS | DATE | Yes |  |  |
| 30 | LAB_DMIS_DATS | DATE | Yes |  |  |
| 31 | LAB_AD_DATS | DATE | Yes |  |  |
| 32 | INST_ID | VARCHAR2(4) | Yes |  |  |
| 33 | TAX_ID | VARCHAR2(9) | Yes |  |  |
| 34 | ORDER_MIN_LIFETIME | NUMBER(5) | Yes |  |  |
| 35 | MAX_DISCOUNT_PCT | NUMBER(5,2) | Yes |  |  |
| 36 | RARITY_PERCENT | NUMBER(6,4) | Yes |  |  |
| 37 | VRARITY_PERCENT | NUMBER(6,4) | Yes |  |  |
| 38 | RBC_RETURNABLE_DAYS | NUMBER(2) | Yes |  |  |
| 39 | RBC_DESIGNATED_RETURN | VARCHAR2(1) | Yes |  |  |
| 40 | RBC_REDUCED_PRICE_DAYS | NUMBER(2) | Yes |  |  |
| 41 | PLT_RETURNABLE_HRS | NUMBER(2) | Yes |  |  |
| 42 | PLT_DESIGNATED_RETURN | VARCHAR2(1) | Yes |  |  |
| 43 | PLT_HLA_MATCH_RETURN | VARCHAR2(1) | Yes |  |  |
| 44 | ACCEPT_EXPIRED | VARCHAR2(1) | Yes |  |  |
| 45 | QUARANTINE_ALERT_TIME | NUMBER(2) | Yes |  |  |
| 46 | MAX_LAB_CHK_DAYS | NUMBER(2) | Yes |  |  |
| 47 | MAX_INV_CHK_DAYS | NUMBER(2) | Yes |  |  |
| 48 | LABEL_REVIEW_FLAG | VARCHAR2(1) | Yes |  |  |
| 49 | FI_COMPANY_NO | VARCHAR2(2) | Yes |  |  |
| 50 | SAMPLE_UNIT_DAYS | NUMBER(4) | Yes |  |  |
| 51 | EFF_DATE | DATE | Yes |  |  |
| 52 | TERM_DATE | DATE | Yes |  |  |
| 53 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 54 | AUDIT_KEY | NUMBER | No |  |  |
| 55 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 56 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 57 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 58 | FI_CONTROL_NO | NUMBER(5) | Yes |  |  |
| 59 | ABORH_BATCH_SIZE | NUMBER(6) | Yes |  |  |
| 60 | VALIDATE_FF_VALUE | VARCHAR2(1) | Yes |  |  |
| 61 | VALIDATE_YY_VALUE | VARCHAR2(3) | Yes |  |  |
| 62 | AUTO_CROSS_ALLOWED | VARCHAR2(1) | Yes |  |  |
| 63 | DIRECTED_CROSS_ALLOWED | VARCHAR2(1) | Yes |  |  |
| 64 | ISBT_START_DATE | DATE | Yes |  |  |

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
