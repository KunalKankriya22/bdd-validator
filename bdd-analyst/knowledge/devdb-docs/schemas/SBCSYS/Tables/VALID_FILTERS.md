---
tags:
  - table
  - SBCSYS
---
# VALID_FILTERS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 71
**Last Analyzed**: 2026-05-16 03:00:12
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 2 | VENDOR_NAME | VARCHAR2(50) | No |  |  |
| 3 | NUMBER_OF_DAYS | NUMBER(4) | No |  |  |
| 4 | AUDIT_KEY | NUMBER | No |  |  |
| 5 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 6 | CATALOG_NUMBER | VARCHAR2(10) | No |  |  |
| 7 | PRODUCT_TYPE | VARCHAR2(6) | No |  |  |
| 8 | EFF_DATE | DATE | No |  |  |
| 9 | TERM_DATE | DATE | Yes |  |  |
| 10 | LAST_MODIFIED_DATE | DATE | No |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_FILTERS_INSERT|VALID_FILTERS_INSERT]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)
- [[schemas/SBCSYS/Triggers/VFILTERS_BEFORE_DELETE|VFILTERS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VFILTERS_INSERT_UPDATE|VFILTERS_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
