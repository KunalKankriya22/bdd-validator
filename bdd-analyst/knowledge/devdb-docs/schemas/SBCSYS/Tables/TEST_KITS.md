---
tags:
  - table
  - SBCSYS
---
# TEST_KITS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 909
**Last Analyzed**: 2025-09-16 03:14:43
**Partitioned**: NO

> [!quote] Created from Entity TEST KIT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_KIT_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | TEST_ID | VARCHAR2(10) | No |  |  |
| 4 | TEST_KIT_CLASS | VARCHAR2(4) | Yes |  |  |
| 5 | INSERT_DATS | DATE | No |  |  |
| 6 | QC_FREQUENCY | VARCHAR2(1) | Yes |  |  |
| 7 | QC_REVIEWED_BY | VARCHAR2(6) | Yes |  |  |
| 8 | QC_REVIEWED_DATE | DATE | Yes |  |  |
| 9 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 10 | KIT_USED_IND | DATE | Yes |  |  |
| 11 | QC_EXPIRY_DATE | DATE | Yes |  |  |
| 12 | TESTING_LAB_CODE | VARCHAR2(2) | Yes |  |  |
| 13 | APPR_LIC_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**TEST_KITS_PK**: `TEST_KIT_ID, TEST_CHAPTER_ID`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| TEST_TEST_KITS_FK | TEST_ID | [[schemas/SBCSYS/Tables/VALID_TESTS\|SBCSYS.VALID_TESTS]] (TEST_ID) | NO ACTION |

## Referenced By

| Source | Constraint | Columns |
| --- | --- | --- |
| [[schemas/SBCSYS/Tables/TEST_KIT_REAGENTS\|SBCSYS.TEST_KIT_REAGENTS]] | KIT_TEST_KIT_REAG_FK | TEST_KIT_ID, TEST_CHAPTER_ID → TEST_KIT_ID, TEST_CHAPTER_ID |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| TEST_KITS_IDX_1 | NORMAL | UNIQUE | TEST_KIT_ID, TEST_CHAPTER_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
