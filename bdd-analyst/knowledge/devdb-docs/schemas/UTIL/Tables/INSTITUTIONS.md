---
tags:
  - table
  - UTIL
---
# INSTITUTIONS

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 1
**Last Analyzed**: 2026-05-23 11:00:02
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | INST_ID | VARCHAR2(4) | No |  |  |
| 2 | INST_NAME | VARCHAR2(50) | No |  |  |
| 3 | INST_SHORT_NAME | VARCHAR2(80) | No |  |  |
| 4 | ADDRESS_ID | NUMBER(6) | No |  |  |
| 5 | PRINT_HDR | VARCHAR2(50) | No |  |  |
| 6 | SYSTEM_NAME | VARCHAR2(50) | No |  |  |
| 7 | CODABAR_UNIT_SCHEME | VARCHAR2(1) | Yes |  |  |
| 8 | TAX_ID | VARCHAR2(9) | Yes |  |  |
| 9 | EFF_DATE | DATE | No |  |  |
| 10 | TERM_DATE | DATE | Yes |  |  |
| 11 | LAST_MODIFIED_DATE | DATE | No |  |  |
| 12 | AUDIT_KEY | NUMBER | No |  |  |
| 13 | PROGRAM_ID | VARCHAR2(30) | No |  |  |
| 14 | REG_NO | VARCHAR2(30) | Yes |  |  |
| 15 | LIC_NO | VARCHAR2(30) | Yes |  |  |
| 16 | ALPHA_NUMERIC | VARCHAR2(1) | Yes |  |  |
| 17 | CONTRACT_PREFIX | VARCHAR2(3) | Yes |  |  |

## Primary Key

**INSTITUTIONS_PK**: `INST_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| INSTITUTIONS_PK | NORMAL | UNIQUE | INST_ID | VALID |

## Triggers

- [[schemas/UTIL/Triggers/INSTITUTIONS_BEFORE_DELETE|INSTITUTIONS_BEFORE_DELETE]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/INST_BEFORE_INSERT_UPDATE|INST_BEFORE_INSERT_UPDATE]] — BEFORE EACH ROW INSERT OR UPDATE (ENABLED)

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
