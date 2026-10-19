---
tags:
  - table
  - UTIL
---
# FCN_GRP_PRIV

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 294
**Last Analyzed**: 2026-04-23 03:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | USER_ID | VARCHAR2(10) | No |  |  |
| 2 | APPL_ID | VARCHAR2(4) | No |  |  |
| 3 | GRP_ID | VARCHAR2(5) | No |  |  |
| 4 | ACC_PRIV | NUMBER(1) | No |  |  |
| 5 | INSERT_DATE | DATE | Yes |  |  |
| 6 | INSERT_USER | VARCHAR2(30) | Yes |  |  |
| 7 | AUDIT_KEY | NUMBER | Yes |  |  |
| 8 | PROGRAM_ID | VARCHAR2(30) | Yes |  |  |

## Primary Key

**FCN_GRP_PRIV_PK**: `USER_ID, APPL_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| FCN_GRP_PRIV_PK | NORMAL | UNIQUE | USER_ID, APPL_ID | VALID |

## Triggers

- [[schemas/UTIL/Triggers/FCN_GRP_PRIV_BD|FCN_GRP_PRIV_BD]] — BEFORE EACH ROW DELETE (ENABLED)
- [[schemas/UTIL/Triggers/FCN_GRP_PRIV_BI|FCN_GRP_PRIV_BI]] — BEFORE EACH ROW INSERT (ENABLED)
- [[schemas/UTIL/Triggers/FCN_GRP_PRIV_BU|FCN_GRP_PRIV_BU]] — BEFORE EACH ROW UPDATE (ENABLED)

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
| USER_MENU | VIEW | UTIL |
