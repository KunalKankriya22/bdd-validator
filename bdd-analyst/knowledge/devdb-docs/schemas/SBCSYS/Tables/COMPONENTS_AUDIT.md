---
tags:
  - table
  - SBCSYS
---
# COMPONENTS_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 107973
**Last Analyzed**: 2025-09-16 03:14:22
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | UNIT_ID | VARCHAR2(15) | Yes |  |  |
| 2 | COLL_DATE | DATE | Yes |  |  |
| 3 | CHAPTER_ID | VARCHAR2(4) | Yes |  |  |
| 4 | COMPONENT_PREFIX | VARCHAR2(2) | Yes |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 6 | BAG_ID | VARCHAR2(10) | Yes |  |  |
| 7 | EXPIRY_DATE | DATE | Yes |  |  |
| 8 | SYSTEM_LABEL_DECISION | VARCHAR2(4) | Yes |  |  |
| 9 | REJECT_REASON_CODE | VARCHAR2(5) | Yes |  |  |
| 10 | INSERT_DATS | DATE | Yes |  |  |
| 11 | RELABEL_PRODUCT_CODE | VARCHAR2(8) | Yes |  |  |
| 12 | POOLED_COMPONENT_ID | VARCHAR2(15) | Yes |  |  |
| 13 | VOID_REASON_CODE | VARCHAR2(4) | Yes |  |  |
| 14 | COMPONENT_STATUS | VARCHAR2(1) | Yes |  |  |
| 15 | OUT_OF_SYSTEM_DATS | DATE | Yes |  |  |
| 16 | COMPONENT_WEIGHT | NUMBER(5,2) | Yes |  |  |
| 17 | COMPONENT_COUNT | NUMBER(5,2) | Yes |  |  |
| 18 | NOTE_ID | NUMBER(10) | Yes |  |  |
| 19 | LABEL_USER_ID | VARCHAR2(6) | Yes |  |  |
| 20 | LABEL_DATS | DATE | Yes |  |  |
| 21 | AUDIT_KEY | NUMBER | No |  |  |
| 22 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 23 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 24 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 25 | BAGS_USED | NUMBER | Yes |  |  |
| 26 | WAREHOUSE_ID | VARCHAR2(1) | Yes |  |  |
| 27 | IMP_LICENSE_FLAG | VARCHAR2(1) | Yes |  |  |
| 28 | PRE_LABEL_SLD | VARCHAR2(4) | Yes |  |  |
| 29 | PRE_LABEL_USER_ID | VARCHAR2(6) | Yes |  |  |
| 30 | PRE_LABEL_DATS | DATE | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| COMPONENTS_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
