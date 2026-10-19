---
tags:
  - table
  - SBCSYS
---
# VALID_PROD_TYPE_ATTRIB_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 888
**Last Analyzed**: 2025-09-16 03:16:01
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 3 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 4 | ANTICOAGULANT_CODE | VARCHAR2(1) | Yes |  |  |
| 5 | EFF_DATE | DATE | Yes |  |  |
| 6 | TERM_DATE | DATE | Yes |  |  |
| 7 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 8 | AUDIT_KEY | NUMBER | Yes |  |  |
| 9 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 10 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 11 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |

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
