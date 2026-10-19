---
tags:
  - table
  - SBCSYS
---
# LBL_PRODUCT_TYPE_CONFIG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 45
**Last Analyzed**: 2026-04-21 03:00:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BARCODE_VALUE | VARCHAR2(10) | No |  |  |
| 2 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 3 | INSERT_DATE | DATE | No |  |  |
| 4 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | PRIORITY_SEQ | NUMBER(2) | Yes |  |  |

## Primary Key

**LBL_PRODUCT_TYPE_CONFIG_PK**: `BARCODE_VALUE, PRODUCT_TYPE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| LBL_PRODUCT_TYPE_CONFIG_PK | NORMAL | UNIQUE | BARCODE_VALUE, PRODUCT_TYPE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/LBL_PRODUCT_TYPE_CONFIG_BI|LBL_PRODUCT_TYPE_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
