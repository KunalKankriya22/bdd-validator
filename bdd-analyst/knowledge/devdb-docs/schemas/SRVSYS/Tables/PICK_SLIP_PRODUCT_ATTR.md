---
tags:
  - table
  - SRVSYS
---
# PICK_SLIP_PRODUCT_ATTR

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 850
**Last Analyzed**: 2025-09-16 03:16:09
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PICK_SLIP_ID | VARCHAR2(13) | No |  |  |
| 2 | CHAPTER_ID | VARCHAR2(4) | No |  |  |
| 3 | UNIT_ID | VARCHAR2(15) | No |  |  |
| 4 | COLL_DATE | DATE | No |  |  |
| 5 | PRODUCT_CODE | VARCHAR2(8) | No |  |  |
| 6 | ALIQUOT | VARCHAR2(2) | No |  |  |
| 7 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 8 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 9 | INSERT_DATE | DATE | No |  |  |
| 10 | PRICE | NUMBER(9,2) | Yes |  |  |
| 11 | AUDIT_KEY | NUMBER | Yes |  |  |
| 12 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**PICK_SLIP_PROD_ATTR_PK**: `PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT, ATTRIB_GROUP, ATTRIB_CODE`

## Foreign Keys

| Constraint | Columns | References | On Delete |
| --- | --- | --- | --- |
| PROD_PICK_SLIP_PROD_ATTR_FK | PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT | [[schemas/SRVSYS/Tables/PICK_SLIP_PRODUCTS\|SRVSYS.PICK_SLIP_PRODUCTS]] (PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT) | NO ACTION |

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PICK_SLIP_PROD_ATTR_PK | NORMAL | UNIQUE | PICK_SLIP_ID, CHAPTER_ID, UNIT_ID, COLL_DATE, PRODUCT_CODE, ALIQUOT, ATTRIB_GROUP, ATTRIB_CODE | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
