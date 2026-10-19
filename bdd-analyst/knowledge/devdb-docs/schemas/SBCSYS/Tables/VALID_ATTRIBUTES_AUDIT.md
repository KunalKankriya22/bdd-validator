---
tags:
  - table
  - SBCSYS
---
# VALID_ATTRIBUTES_AUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 10819
**Last Analyzed**: 2025-09-16 03:15:57
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 2 | ATTRIB_CODE | VARCHAR2(10) | Yes |  |  |
| 3 | ATTRIB_DESC | VARCHAR2(50) | Yes |  |  |
| 4 | PRICE | NUMBER(13,2) | Yes |  |  |
| 5 | STOP_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 6 | STATUS_FLAG | VARCHAR2(1) | Yes |  |  |
| 7 | ASSIGN_AFTER_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 8 | SHOW_ON_LABEL_FLAG | VARCHAR2(1) | Yes |  |  |
| 9 | INTER_CODE | VARCHAR2(4) | Yes |  |  |
| 10 | ATTRIB_CUSTOM | VARCHAR2(1) | Yes |  |  |
| 11 | NORMAL_STOCK_FLAG | VARCHAR2(1) | Yes |  |  |
| 12 | SERVICE_CODE | VARCHAR2(8) | Yes |  |  |
| 13 | CREDIT_FLAG | VARCHAR2(1) | Yes |  |  |
| 14 | EFF_DATE | DATE | Yes |  |  |
| 15 | TERM_DATE | DATE | Yes |  |  |
| 16 | LAST_MODIFIED_DATE | DATE | Yes |  |  |
| 17 | AUDIT_KEY | NUMBER | No |  |  |
| 18 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 19 | AUDIT_INSERT_DATS | DATE | No |  |  |
| 20 | AUDIT_INSERT_USER | VARCHAR2(6) | No |  |  |
| 21 | ATTRIB_LABEL | VARCHAR2(30) | Yes |  |  |
| 22 | ATTRIB_ABBREV | VARCHAR2(12) | Yes |  |  |
| 23 | ATTRIB_POSITION | NUMBER(1) | Yes |  |  |
| 24 | UNIT_SCHEME_TYPE | VARCHAR2(1) | Yes |  |  |
| 25 | ATTRIB_TYPE | VARCHAR2(1) | Yes |  |  |
| 26 | EXCLUSIVITY_FLAG | VARCHAR2(1) | Yes |  |  |
| 27 | EQ_CODE128_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |
| 28 | EQ_CODE128_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 29 | DELETE_ALLOWED | VARCHAR2(1) | Yes |  |  |
| 30 | OLD_ATTRIB_CODE | VARCHAR2(4) | Yes |  |  |
| 31 | OLD_ATTRIB_GROUP | VARCHAR2(5) | Yes |  |  |

## Primary Key

> [!warning] No primary key defined

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| VALID_ATTRIBUTES_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY | VALID |
| VALID_ATTR_AUDIT_IDX_1 | NORMAL | NONUNIQUE | AUDIT_KEY, AUDIT_INSERT_DATS | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
