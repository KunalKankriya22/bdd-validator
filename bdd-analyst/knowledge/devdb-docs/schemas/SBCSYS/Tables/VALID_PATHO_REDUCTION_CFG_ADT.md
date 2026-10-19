---
tags:
  - table
  - SBCSYS
---
# VALID_PATHO_REDUCTION_CFG_ADT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 80
**Last Analyzed**: 2025-09-16 03:16:00
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | VOLUME_TYPE_SET | VARCHAR2(10) | Yes |  |  |
| 3 | SUSPENSION_TYPE | VARCHAR2(20) | Yes |  |  |
| 4 | EQUIP_TYPE | VARCHAR2(10) | Yes |  |  |
| 5 | MIN_VOL | NUMBER(3) | Yes |  |  |
| 6 | MAX_VOL | NUMBER(3) | Yes |  |  |
| 7 | MIN_PLT_COUNT | NUMBER(6,2) | Yes |  |  |
| 8 | MAX_PLT_COUNT | NUMBER(6,2) | Yes |  |  |
| 9 | MIN_CAD_TIME | NUMBER(2) | Yes |  |  |
| 10 | MAX_CAD_TIME | NUMBER(2) | Yes |  |  |
| 11 | MAX_STORAGE_DAYS | NUMBER(3) | Yes |  |  |
| 12 | FINAL_MIN_VOLUME | NUMBER(9,2) | Yes |  |  |
| 13 | FINAL_MIN_PLT_COUNT | NUMBER(7) | Yes |  |  |
| 14 | EFF_DATE | DATE | Yes |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | INSERT_DATE | DATE | Yes |  |  |
| 17 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 19 | AUDIT_KEY | NUMBER | No |  |  |
| 20 | FINAL_MAX_VOLUME | NUMBER(9,2) | Yes |  |  |
| 21 | FINAL_MAX_PLT_COUNT | NUMBER(6,2) | Yes |  |  |
| 22 | FINAL_MAX_NO_BAGS | NUMBER(2) | Yes |  |  |
| 23 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 24 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

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
