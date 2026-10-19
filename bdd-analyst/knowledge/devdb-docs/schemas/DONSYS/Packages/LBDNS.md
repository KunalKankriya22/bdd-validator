---
tags:
  - package
  - DONSYS
---
# LBDNS

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE LBDNS IS

intf_error exception;
PROCEDURE read_supplemental_results
              (p_unit_id    IN      VARCHAR2,
               p_f_date     IN      DATE,
               p_t_date     IN      DATE,
               p_test_grp   IN      VARCHAR2,
               p_test_id    IN      VARCHAR2,
               p_chapter    IN      VARCHAR2,
               i_id         IN OUT  VARCHAR2);

PROCEDURE get_supplemental_result_status
              (c_unit_id    IN   VARCHAR2,
               c_chapter    IN   VARCHAR2,
               c_date       IN   DATE,
               c_test_id    IN   VARCHAR2,
               c_result     OUT  VARCHAR2,
               c_absorb     OUT  VARCHAR2,
               c_status     OUT  VARCHAR2);

FUNCTION  is_supplemental_result_ok
              (i_unit_id    IN   VARCHAR2,
               i_chapter    IN   VARCHAR2,
               i_coll_date  IN   DATE,
               i_test_id    IN   VARCHAR2)      RETURN boolean;

END LBDNS;
```
