---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCT_CODE_ATTR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 39
**Last Analyzed**: 2025-09-16 03:16:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 3 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 4 | EFF_DATE | DATE | No |  |  |
| 5 | TERM_DATE | DATE | Yes |  |  |
| 6 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 7 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | No |  |  |
| 9 | OLD_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 10 | OLD_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VPRODUCTCODEATTR_BEFORE_DELETE|VPRODUCTCODEATTR_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VPRODUCTCODEATTR_INSERT_UPDATE|VPRODUCTCODEATTR_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
