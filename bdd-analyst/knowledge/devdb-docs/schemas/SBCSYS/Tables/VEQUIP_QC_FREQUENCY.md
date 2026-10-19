---
tags:
  - table
  - SBCSYS
---
# VEQUIP_QC_FREQUENCY

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 5
**Last Analyzed**: 2025-09-26 03:00:21
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | FREQUENCY_CODE | VARCHAR2(4) | Yes |  |  |
| 2 | FREQUENCY_DESC | VARCHAR2(50) | Yes |  |  |
| 3 | MONTHS | NUMBER(9) | Yes |  |  |
| 4 | START_DATE | DATE | Yes |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED | DATE | Yes |  |  |
| 7 | INSERTED_BY | VARCHAR2(6) | Yes |  |  |

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
