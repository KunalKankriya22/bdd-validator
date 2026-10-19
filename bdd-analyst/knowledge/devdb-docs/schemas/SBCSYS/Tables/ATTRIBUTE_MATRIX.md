---
tags:
  - table
  - SBCSYS
---
# ATTRIBUTE_MATRIX

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 196
**Last Analyzed**: 2025-09-17 03:00:47
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
| 12 | OLD_ATTRIB_DELETED_GROUP | VARCHAR2(5) | Yes |  |  |
| 13 | OLD_ATTRIB_DELETED_CODE | VARCHAR2(4) | Yes |  |  |
| 14 | OLD_ASSOCIATED_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 15 | OLD_ASSOCIATED_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 16 | DELETE_MODIFIER_CODE | VARCHAR2(10) | Yes |  |  |
| 17 | ADD_MODIFIER_CODE | VARCHAR2(10) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Triggers

- [[schemas/SBCSYS/Triggers/ATTRIB_MATRIX_BEFORE_DELETE|ATTRIB_MATRIX_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/ATTRIB_MATRIX_INSERT_UPDATE|ATTRIB_MATRIX_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
