---
tags:
  - table
  - DONSYS
---
# PS_TXN

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Tablespace**: BC_DATA
**Estimated Rows**: 313
**Last Analyzed**: 2025-09-16 03:14:03
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | ID | NUMBER(20) | No |  |  |
| 2 | PARENTID | NUMBER(20) | Yes |  |  |
| 3 | COLLID | NUMBER(10) | No |  |  |
| 4 | CONTENT | BLOB | Yes |  |  |
| 5 | CREATION_DATE | DATE | Yes | sysdate |  |

## Primary Key

**PS_TXN_PK**: `COLLID, ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| PS_TXN_PK | NORMAL/REV | UNIQUE | COLLID, ID | VALID |

## LOB Columns

| Column | Segment | Tablespace | In-Row | Cache |
| --- | --- | --- | --- | --- |
| CONTENT | SYS_LOB0000076590C00004$$ | BC_DATA | YES | NO |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| BLOODC_ROLE | DELETE | NO |
| BLOODC_ROLE | INSERT | NO |
| BLOODC_ROLE | SELECT | NO |
| BLOODC_ROLE | UPDATE | NO |
