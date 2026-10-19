---
tags:
  - table
  - UTIL
---
# USER_REFRESH_TOKEN

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Tablespace**: BC_DATA
**Estimated Rows**: 4288
**Last Analyzed**: 2025-11-15 04:00:10
**Partitioned**: NO

## Columns

| # | Column | Type | Nullable | Default | Comment |
| --- | --- | --- | --- | --- | --- |
| 1 | SESSION_ID | VARCHAR2(40) | No |  |  |
| 2 | USER_ID | VARCHAR2(30) | Yes |  |  |
| 3 | JWT_ID | VARCHAR2(100) | Yes |  |  |
| 4 | REFRESH_TOKEN | VARCHAR2(200) | Yes |  |  |
| 5 | ISSUED_DATE | DATE | Yes |  |  |
| 6 | EXPIRES_DATE | DATE | Yes |  |  |
| 7 | USED | VARCHAR2(1) | Yes |  |  |
| 8 | INVALIDATED | VARCHAR2(1) | Yes |  |  |

## Primary Key

**USER_REFRESH_TOKEN_PK**: `SESSION_ID`

## Foreign Keys

_None_

## Referenced By

_None_

## Indexes

| Index | Type | Unique | Columns | Status |
| --- | --- | --- | --- | --- |
| USER_REFRESH_TOKEN_PK | NORMAL | UNIQUE | SESSION_ID | VALID |

## Grants

| Grantee | Privilege | Grantable |
| --- | --- | --- |
| PUBLIC | DELETE | NO |
| PUBLIC | INSERT | NO |
| PUBLIC | SELECT | NO |
| PUBLIC | UPDATE | NO |
