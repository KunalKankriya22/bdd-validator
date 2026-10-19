---
tags:
  - table
  - SBCSYS
---
# VALID_CATALOG_DETAILS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 334
**Last Analyzed**: 2025-09-16 03:15:58
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CATALOG_NUMBER | VARCHAR2(10) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | CONTAINER_ID | VARCHAR2(3) | No |  |  |
| 4 | INLINE_FILTER_FLAG | VARCHAR2(1) | No |  |  |
| 5 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 6 | SUB_PROD_TYPES | VARCHAR2(250) | Yes |  |  |
| 7 | INSERT_DATE | DATE | No |  |  |
| 8 | INSERT_USER | VARCHAR2(30) | No |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | BASE_CATALOG_NO | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_CATALOG_DETAILS_BD|VALID_CATALOG_DETAILS_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_CATALOG_DETAILS_BI|VALID_CATALOG_DETAILS_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_CATALOG_DETAILS_BU|VALID_CATALOG_DETAILS_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
