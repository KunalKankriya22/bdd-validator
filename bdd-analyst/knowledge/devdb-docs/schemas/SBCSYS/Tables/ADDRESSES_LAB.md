---
tags:
  - table
  - SBCSYS
---
# ADDRESSES_LAB

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 898
**Last Analyzed**: 2026-04-28 03:00:11
**Partitioned**: NO

> [!quote] Created from Entity ADDRESS by WADLEY on 16-APR-93

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ADDRESS_ID | NUMBER(6) | No |  |  |
| 2 | ADDR_1 | VARCHAR2(50) | No |  |  |
| 3 | ADDR_2 | VARCHAR2(50) | Yes |  |  |
| 4 | ADDR_3 | VARCHAR2(50) | Yes |  |  |
| 5 | CITY | VARCHAR2(75) | No |  |  |
| 6 | STATE_CODE | VARCHAR2(2) | Yes |  |  |
| 7 | ZIP | VARCHAR2(9) | No |  |  |
| 8 | COUNTRY | VARCHAR2(15) | No |  |  |
| 9 | PHONE_NUMBER | VARCHAR2(10) | Yes |  |  |
| 10 | INT_PHONE_NUMBER | VARCHAR2(15) | Yes |  |  |
| 11 | TELEX_NUMBER | VARCHAR2(15) | Yes |  |  |
| 12 | FAX_NUMBER | VARCHAR2(10) | Yes |  |  |
| 13 | EMAIL_ID | VARCHAR2(50) | Yes |  |  |
| 14 | INT_FLAG | VARCHAR2(1) | Yes |  |  |

## Primary Key

**ADDRESS_PK**: `ADDRESS_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| ADDRESSES_IDX_1 | NORMAL | UNIQUE | ADDRESS_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
