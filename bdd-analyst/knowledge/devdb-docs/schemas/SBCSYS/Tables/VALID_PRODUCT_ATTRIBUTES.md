---
tags:
  - table
  - SBCSYS
---
# VALID_PRODUCT_ATTRIBUTES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 396
**Last Analyzed**: 2026-05-21 03:00:12
**Partitioned**: NO

> [!quote] Created from Entity VALID PRODUCT ATTRIBUTE by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | PRODUCT_TYPE | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 3 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 4 | LIFE_SPAN_IND | VARCHAR2(1) | Yes |  |  |
| 5 | LIFE_SPAN | VARCHAR2(4) | Yes |  |  |
| 6 | EFF_DATE | DATE | Yes |  |  |
| 7 | TERM_DATE | DATE | Yes |  |  |
| 8 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 9 | AUDIT_KEY | NUMBER | Yes |  |  |
| 10 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |
| 11 | NEW_PRODUCT_TYPE | VARCHAR2(5) | Yes |  |  |
| 12 | LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 13 | OLD_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 14 | OLD_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |

## Primary Key

**VALID_PRODUCT_ATTRIBUTES_PK**: `PRODUCT_TYPE, ATTRIB_GROUP, ATTRIB_CODE`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_PRODUCT_ATTRIBUTES_PK | NORMAL | UNIQUE | PRODUCT_TYPE, ATTRIB_GROUP, ATTRIB_CODE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VPRODUCT_ATTR_BEFORE_DELETE|VPRODUCT_ATTR_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VPRODUCT_ATTR_INSERT_UPDATE|VPRODUCT_ATTR_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
