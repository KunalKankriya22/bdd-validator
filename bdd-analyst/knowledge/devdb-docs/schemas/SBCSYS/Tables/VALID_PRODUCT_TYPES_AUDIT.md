---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCT_TYPES_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 433
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
| 11 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 12 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 13 | DEFAULT_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 14 | ATTRIB_FLAG | VARCHAR2(1) | Yes |  |  |

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
