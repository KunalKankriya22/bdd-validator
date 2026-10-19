---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCT_TYPES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 30
**Last Analyzed**: 2026-05-23 03:00:14
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE_CODE | VARCHAR2(5) | No |  |  |
| 2 | PRODUCT_TYPE_DESC | VARCHAR2(30) | Yes |  |  |
| 3 | PRODUCT_GROUP_IDENTIFIER | VARCHAR2(3) | Yes |  |  |
| 4 | PRODUCT_GROUP_NAME | VARCHAR2(30) | Yes |  |  |
| 5 | ABO_ONLY | VARCHAR2(1) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 11 | DEFAULT_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 12 | ATTRIB_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | WEIGHT_REQUIRED | VARCHAR2(1) | Yes |  |  |
| 14 | PRODUCT_CLASS | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_PROD_TYPES_BEFORE_DELETE|VALID_PROD_TYPES_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_PROD_TYPES_INSERT_UPDATE|VALID_PROD_TYPES_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
