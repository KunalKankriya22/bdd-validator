---
tags:
  - table
  - SBCSYS
---
# BARCODE_VALUES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2025-09-16 03:14:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | LABEL_TYPE | VARCHAR2(4) | Yes |  |  |
| 2 | LABEL_VALUE | VARCHAR2(10) | Yes |  |  |
| 3 | LABEL_INTERPRETATION | VARCHAR2(40) | Yes |  |  |
| 4 | START_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |

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
