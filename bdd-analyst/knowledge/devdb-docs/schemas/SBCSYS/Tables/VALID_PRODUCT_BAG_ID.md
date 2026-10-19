---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCT_BAG_ID

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1494
**Last Analyzed**: 2025-09-16 03:16:01
**Partitioned**: NO

> [!quote] Created from Entity VALID PRODUCT BAG ID by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 2 | BAG_ID | VARCHAR2(4) | No |  |  |
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
| VALID_PRODUCT_BAG_ID_IDX1 | NORMAL | UNIQUE | PRODUCT_CODE, BAG_ID | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VPRODUCT_BAG_BEFORE_DELETE|VPRODUCT_BAG_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VPRODUCT_BAG_INSERT_UPDATE|VPRODUCT_BAG_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
