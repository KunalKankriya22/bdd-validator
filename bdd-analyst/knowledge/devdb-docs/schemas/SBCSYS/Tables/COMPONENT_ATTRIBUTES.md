---
tags:
  - table
  - SBCSYS
---
# COMPONENT_ATTRIBUTES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 16010
**Last Analyzed**: 2025-09-16 03:14:22
**Partitioned**: NO

> [!quote] Created from Entity COMPONENT ATTRIBUTE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 2 | COLL_DATE | DATE | No |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 4 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 5 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 6 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 7 | INSERT_DATS | DATE | No |  |  |
| 8 | INSERT_USER_ID | VARCHAR2(6) | No |  |  |
| 9 | AUDIT_KEY | NUMBER | No |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 11 | PROC_DATE | DATE | Yes |  |  |
| 12 | ORG_IMPORTED_PROD | VARCHAR2(8) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Unique Constraints

| Constraint | Columns | Status |
| --- | --- | --- |
| COMP_ATTRIBUTES_UK | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ATTRIB_GROUP, ATTRIB_CODE | ENABLED |

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENT_ATTRIBUTES_IDX_1 | NORMAL | UNIQUE | UNIT_ID, COLL_DATE, CHAPTER_ID, PRODUCT_CODE, ATTRIB_GROUP, ATTRIB_CODE | VALID |
| COMPONENT_ATTRIBUTES_IDX_AK | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/COMPONENT_ATTR_BEFORE_DELETE|COMPONENT_ATTR_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/COMPONENT_ATTR_BEFORE_INSERT|COMPONENT_ATTR_BEFORE_INSERT]] — BEFORE EACH ROW INSERT (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
