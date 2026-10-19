---
tags:
  - package
  - SBCSYS
---
# CONFIRM_TEST_RESULTS

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "CONFIRM_TEST_RESULTS" is

  -- Author  : ASHOKV
  -- Created : 9/6/2018 4:51:45 PM
  -- Purpose : Schedule tests using test series configuration table

  -- Public type declarations

  -- Public constant declarations

  -- Public variable declarations


  -- Public function and procedure declarations
  PROCEDURE check_series_config(p_unit_id        IN VARCHAR2, -- mandatory
                                p_chapter_id     IN VARCHAR2, -- mandatory
                                p_test_series_id IN VARCHAR2, -- optional
                                p_program_id     IN VARCHAR2, -- mandatory
                                p_final_flag     OUT VARCHAR2, -- final flag if test series id is passed.
                                p_status         OUT VARCHAR2  -- status -- 'OK' or error msg.
                                );

end confirm_test_results;

```
