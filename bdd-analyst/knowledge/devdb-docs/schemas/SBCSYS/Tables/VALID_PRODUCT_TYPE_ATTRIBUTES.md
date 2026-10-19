---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCT_TYPE_ATTRIBUTES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 97
**Last Analyzed**: 2025-09-16 03:16:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 3 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 4 | ANTICOAGULANT_CODE | VARCHAR2(5) | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | VOLUME | NUMBER(5,2) | Yes |  |  |
| 11 | OLD_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 12 | MODIFIER_CODE | VARCHAR2(10) | Yes |  |  |
| 13 | OLD_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 14 | PRODUCT_CLASS | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/VALID_PRDTY_ATTR_BEFORE_DELETE|VALID_PRDTY_ATTR_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VALID_PRDTY_ATTR_INSERT_UPDATE|VALID_PRDTY_ATTR_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
