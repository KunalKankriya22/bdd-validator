---
tags:
  - package
  - DONSYS
---
# LBDNC

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE LBDNC IS


PROCEDURE read_lab_test_results
              (p_unit_id    IN   VARCHAR2,
               p_f_date     IN   DATE,
               p_t_date     IN   DATE,
               p_test_grp   IN   VARCHAR2,
               p_test_id    IN   VARCHAR2,
               p_chapter    IN   VARCHAR2,
               i_id         IN OUT  VARCHAR2);
PROCEDURE get_result_status
              (c_unit_id    IN   VARCHAR2,
               c_chapter    IN   VARCHAR2,
               c_date       IN   DATE,
               c_test_id    IN   VARCHAR2,
               c_result     OUT  VARCHAR2,
               c_absorb     OUT  VARCHAR2,
               c_status     OUT  VARCHAR2);
FUNCTION  is_donor_attached
              (a_unit_id    IN   VARCHAR2,
               a_chapter    IN   VARCHAR2,
               a_coll_date  IN   DATE,
               c_donor_id   OUT  VARCHAR2)    RETURN boolean;
FUNCTION  is_result_ok
              (i_unit_id    IN   VARCHAR2,
               i_chapter    IN   VARCHAR2,
               i_coll_date  IN   DATE,
               i_test_id    IN   VARCHAR2)      RETURN boolean;
PROCEDURE place_donor_interdiction
              (c_test_id    IN   VARCHAR2,
               c_result     IN   VARCHAR2,
               c_status     IN   VARCHAR2,
               c_unit_id    IN   VARCHAR2,
               c_chapter    IN   VARCHAR2,
               c_coll_date  IN   DATE,
               c_donor_id   IN   VARCHAR2);
PROCEDURE check_donor_abo
              (b_unit_id    IN   VARCHAR2,
               b_chapter    IN   VARCHAR2,
               b_coll_date  IN   DATE,
               b_result     IN   VARCHAR2,
               abo_status   OUT  VARCHAR2);
PROCEDURE check_result_override
              (c_unit_id        IN   VARCHAR2,
               c_chapter        IN   VARCHAR2,
               c_coll_date      IN   DATE,
               c_test_id        IN   VARCHAR2,
               c_test_result    IN   VARCHAR2,
               c_override_flag  OUT  VARCHAR2);
PROCEDURE remove_lab_result_hold
              (c_unit_id        IN   VARCHAR2,
               c_chapter        IN   VARCHAR2,
               c_coll_date      IN   DATE,
               c_donor_id       IN   VARCHAR2);
END LBDNC;
```
