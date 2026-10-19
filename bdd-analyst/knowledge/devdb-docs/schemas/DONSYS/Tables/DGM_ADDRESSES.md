---
tags:
  - table
  - DONSYS
---
# DGM_ADDRESSES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 3000
**Last Analyzed**: 2025-09-16 03:10:41
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CNT | NUMBER(4) | Yes |  |  |
| 2 | STREET | VARCHAR2(50) | Yes |  |  |
| 3 | W_AREA | NUMBER(3) | Yes |  |  |
| 4 | W_PHONE | NUMBER(7) | Yes |  |  |
| 5 | W_EXT | NUMBER(4) | Yes |  |  |
| 6 | H_AREA | NUMBER(3) | Yes |  |  |
| 7 | H_PHONE | NUMBER(7) | Yes |  |  |
| 8 | USPS_ID | NUMBER(6) | Yes |  |  |

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
