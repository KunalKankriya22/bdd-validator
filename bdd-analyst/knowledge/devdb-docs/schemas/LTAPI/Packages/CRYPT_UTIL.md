---
tags:
  - package
  - LTAPI
---
# CRYPT_UTIL

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE         "CRYPT_UTIL" as
  function crypt (p_str in varchar2, p_key in raw) return raw;
  function decrypt (p_data in raw, p_key in raw) return varchar2;
  function get_key return raw;
end crypt_util;

```
