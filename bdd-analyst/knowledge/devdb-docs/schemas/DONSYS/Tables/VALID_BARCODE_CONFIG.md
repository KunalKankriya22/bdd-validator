---
tags:
  - table
  - DONSYS
---
# VALID_BARCODE_CONFIG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 8
**Last Analyzed**: 2025-09-16 03:14:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | BARCODE_TYPE | VARCHAR2(5) | No |  |  |
| 2 | START_CODE | VARCHAR2(20) | No |  |  |
| 3 | STOP_CODE | VARCHAR2(20) | Yes |  |  |
| 4 | STRING_LEN | NUMBER | Yes |  |  |
| 5 | INSERT_DATE | DATE | No |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/DONSYS/Triggers/VALID_BARCODE_CONFIG_BI|VALID_BARCODE_CONFIG_BI]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
