---
tags:
  - table
  - SBCSYS
---
# VEQUIP_TYPE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 0
**Last Analyzed**: 2025-09-16 03:16:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | EQUIP_TYPE | VARCHAR2(4) | Yes |  |  |
| 2 | EQUIP_DESCR | VARCHAR2(50) | Yes |  |  |
| 3 | START_DATE | DATE | Yes |  |  |
| 4 | TERM_DATE | DATE | Yes |  |  |
| 5 | LAST_MODIFIED | DATE | Yes |  |  |
| 6 | INSERTED_BY | VARCHAR2(10) | Yes |  |  |
| 7 | EQUIP_GROUP | VARCHAR2(5) | Yes |  |  |

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
