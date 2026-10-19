---
tags:
  - table
  - SRVSYS
---
# CUSTOMER_PREFERRED_TIERS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 47
**Last Analyzed**: 2025-09-27 03:00:34
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CUSTOMER_ID | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 4 | TIER | NUMBER(2) | No |  |  |
| 5 | ALTERNATE_TIER_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | EFF_DATE | DATE | No |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

**CUSTOMER_PREF_TIERS_PK**: `CUSTOMER_ID, CHAPTER_ID, PRODUCT_TYPE, TIER`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| CUST_CUST_PREF_TIERS_FK | CUSTOMER_ID, CHAPTER_ID | [[schemas/SRVSYS/Tables/CUSTOMERS\|SRVSYS.CUSTOMERS]] (CUSTOMER_ID, CHAPTER_ID) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| CUSTOMER_PREFERRED_TIERS_IDX_1 | NORMAL | UNIQUE | CUSTOMER_ID, CHAPTER_ID, PRODUCT_TYPE, TIER | VALID |

## Triggers

- [[schemas/SRVSYS/Triggers/CUSTOMER_PREFERRED_TIERS_BD|CUSTOMER_PREFERRED_TIERS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SRVSYS/Triggers/CUSTOMER_PREFERRED_TIERS_BI|CUSTOMER_PREFERRED_TIERS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SRVSYS/Triggers/CUSTOMER_PREFERRED_TIERS_BU|CUSTOMER_PREFERRED_TIERS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
