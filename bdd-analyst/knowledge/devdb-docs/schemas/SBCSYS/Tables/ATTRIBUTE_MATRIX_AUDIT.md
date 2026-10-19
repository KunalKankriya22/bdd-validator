---
tags:
  - table
  - SBCSYS
---
# ATTRIBUTE_MATRIX_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1353
**Last Analyzed**: 2025-09-16 03:14:19
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ATTRIB_ADDED_GROUP | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_ADDED_CODE | VARCHAR2(10) | No |  |  |
| 3 | ATTRIB_DELETED_GROUP | VARCHAR2(5) | Yes |  |  |
| 4 | ATTRIB_DELETED_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | ASSOCIATED_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 6 | ASSOCIATED_ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 7 | EFF_DATE | DATE | Yes |  |  |
| 8 | TERM_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 10 | AUDIT_KEY | NUMBER | Yes |  |  |
| 11 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 12 | AUDIT_INSERT_DATS | DATE | Yes |  |  |
| 13 | AUDIT_INSERT_USER | VARCHAR2(6) | Yes |  |  |
| 14 | OLD_ATTRIB_DELETED_GROUP | VARCHAR2(5) | Yes |  |  |
| 15 | OLD_ATTRIB_DELETED_CODE | VARCHAR2(4) | Yes |  |  |
| 16 | OLD_ASSOCIATED_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 17 | OLD_ASSOCIATED_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 18 | DELETE_MODIFIER_CODE | VARCHAR2(10) | Yes |  |  |
| 19 | ADD_MODIFIER_CODE | VARCHAR2(10) | Yes |  |  |

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
