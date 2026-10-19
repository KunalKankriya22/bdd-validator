---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCT_CONV

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 229
**Last Analyzed**: 2026-05-24 23:08:01
**Partitioned**: NO

> [!quote] Created from Entity VALID PRODUCT CONVERSION by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SOURCE_PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 2 | TARGET_PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 3 | EFF_DATE | DATE | No |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 6 | AUDIT_KEY | NUMBER | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PRODUCT_CONV_IDX_1 | NORMAL | UNIQUE | SOURCE_PRODUCT_CODE, TARGET_PRODUCT_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_PROD_CONV_BEFORE_DELETE|VALID_PROD_CONV_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_PROD_CONV_INSERT_UPDATE|VALID_PROD_CONV_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
