---
tags:
  - table
  - SBCSYS
---
# VALID_ATTRIBUTE_CONFIG_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 357
**Last Analyzed**: 2025-09-16 03:15:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 2 | PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 3 | ATTRIB_CLASS | VARCHAR2(5) | Yes |  |  |
| 4 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 5 | ATTRIB_MODIFIER | VARCHAR2(5) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | MODIFIED_DATE | DATE | Yes |  |  |
| 9 | LAST_MODIFIED_BY | VARCHAR2(30) | Yes |  |  |
| 10 | INSERT_DATE | DATE | Yes |  |  |
| 11 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 13 | FCN_NAME | VARCHAR2(30) | Yes |  |  |
| 14 | AUDIT_KEY | NUMBER | No |  |  |
| 15 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 16 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |

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
