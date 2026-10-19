---
tags:
  - table
  - SBCSYS
---
# FR_VPRODUCT_PROCESSES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 245
**Last Analyzed**: 2025-09-16 03:14:28
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PROCESS_CODE | VARCHAR2(5) | No |  |  |
| 2 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 9 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 10 | OLD_ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 11 | OLD_ATTRIB_GROUP | VARCHAR2(10) | Yes |  |  |

## Primary Key

**FR_PROD_PROCESSES_PK**: `PROCESS_CODE, PRODUCT_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| PROD_FR_PROD_PROCESS_FK | PRODUCT_CODE | [[schemas/SBCSYS/Tables/VALID_PRODUCTS\|SBCSYS.VALID_PRODUCTS]] (PRODUCT_CODE) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FR_VPRODUCT_PROCESSES_IDX_1 | NORMAL | UNIQUE | PROCESS_CODE, PRODUCT_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/FR_PROD_PROC_BEFORE_DELETE|FR_PROD_PROC_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/FR_PROD_PROC_INSERT_UPDATE|FR_PROD_PROC_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
