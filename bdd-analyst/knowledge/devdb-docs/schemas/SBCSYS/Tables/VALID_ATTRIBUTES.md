---
tags:
  - table
  - SBCSYS
---
# VALID_ATTRIBUTES

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 849
**Last Analyzed**: 2025-09-17 03:00:48
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ATTRIB_GROUP | VARCHAR2(5) | No |  |  |
| 2 | ATTRIB_CODE | VARCHAR2(10) | No |  |  |
| 3 | ATTRIB_DESC | VARCHAR2(50) | No |  |  |
| 4 | PRICE | NUMBER(13,2) | Yes |  |  |
| 5 | STOP_LABEL_FLAG | VARCHAR2(1) | No |  |  |
| 6 | STATUS_FLAG | VARCHAR2(1) | No |  |  |
| 7 | ASSIGN_AFTER_LABEL_FLAG | VARCHAR2(1) | No |  |  |
| 8 | SHOW_ON_LABEL_FLAG | VARCHAR2(1) | No |  |  |
| 9 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 10 | ATTRIB_CUSTOM | VARCHAR2(1) | Yes |  |  |
| 11 | NORMAL_STOCK_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | SERVICE_CODE | VARCHAR2(8) | Yes |  |  |
| 13 | CREDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | EFF_DATE | DATE | No |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 17 | AUDIT_KEY | NUMBER | No |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 19 | ATTRIB_LABEL | VARCHAR2(30) | Yes |  |  |
| 20 | ATTRIB_ABBREV | VARCHAR2(12) | Yes |  |  |
| 21 | ATTRIB_POSITION | NUMBER(1) | Yes |  |  |
| 22 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 23 | ATTRIB_TYPE | VARCHAR2(1) | Yes |  |  |
| 24 | EXCLUSIVITY_FLAG | VARCHAR2(1) | Yes |  |  |
| 25 | EQ_CODE128_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 26 | EQ_CODE128_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 27 | DELETE_ALLOWED | VARCHAR2(1) | Yes |  |  |
| 28 | OLD_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 29 | OLD_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ATTRIBUTES_IDX_1 | NORMAL | UNIQUE | ATTRIB_GROUP, ATTRIB_CODE, UNIT_SCHEME_TYPE | VALID |

## Triggers

- [[schemas/SBCSYS/Triggers/VATTRIB_BEFORE_DELETE|VATTRIB_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/SBCSYS/Triggers/VATTRIB_INSERT_UPDATE|VATTRIB_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |

## Depended On By

| Object | Type | Schema |
| --- | --- | --- |
| VSERV_ATTRIBUTES | VIEW | SBCSYS |
