---
tags:
  - table
  - SBCSYS
---
# TEST_KIT_REAGENTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1417
**Last Analyzed**: 2025-09-16 03:14:44
**Partitioned**: NO

> [!quote] Created from Entity TEST KIT REAGENT by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | TEST_KIT_ID | VARCHAR2(14) | No |  |  |
| 2 | TEST_CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | REAGENT_TYPE | VARCHAR2(1) | No |  |  |
| 4 | REAGENT_NAME | VARCHAR2(50) | Yes |  |  |
| 5 | EXPIRY_DATE | DATE | No |  |  |
| 6 | CHANNEL | NUMBER(2) | Yes |  |  |
| 7 | MANUFACTURER | VARCHAR2(50) | Yes |  |  |
| 8 | LOT_NUMBER | VARCHAR2(30) | Yes |  |  |
| 9 | REAGENT_CODE | VARCHAR2(5) | Yes |  |  |
| 10 | SUPPLIER_CODE | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| KIT_TEST_KIT_REAG_FK | TEST_KIT_ID, TEST_CHAPTER_ID | [[schemas/SBCSYS/Tables/TEST_KITS\|SBCSYS.TEST_KITS]] (TEST_KIT_ID, TEST_CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
