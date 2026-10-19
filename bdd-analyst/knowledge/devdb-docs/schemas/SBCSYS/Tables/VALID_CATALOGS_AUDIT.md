---
tags:
  - table
  - SBCSYS
---
# VALID_CATALOGS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1363
**Last Analyzed**: 2025-09-16 03:15:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CATALOG_NUMBER | VARCHAR2(10) | No |  |  |
| 2 | WEIGHT_OF_BAG | NUMBER(5,2) | Yes |  |  |
| 3 | MANUFACTURER | VARCHAR2(40) | Yes |  |  |
| 4 | TOTAL_BAGS_IN_SET | NUMBER | Yes |  |  |
| 5 | ANTICOAGULANT | VARCHAR2(5) | Yes |  |  |
| 6 | ADDITIVE_SOLUTION | VARCHAR2(20) | Yes |  |  |
| 7 | COLLECTION_VOLUME | NUMBER(5,2) | Yes |  |  |
| 8 | BAG_STORAGE_RESTRICTION | VARCHAR2(20) | Yes |  |  |
| 9 | BAG_VOLUME | NUMBER(5,2) | Yes |  |  |
| 10 | BAG_TYPE | VARCHAR2(10) | Yes |  |  |
| 11 | EFF_DATE | DATE | Yes |  |  |
| 12 | TERM_DATE | DATE | Yes |  |  |
| 13 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | Yes |  |  |
| 15 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 16 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 17 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
