---
tags:
  - package
  - SBCSYS
---
# CNFRESQC

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "CNFRESQC" is

  -- Author  : ASHOKV
  -- Created : 9/6/2018 4:51:45 PM
  -- Purpose : Schedule tests using test series configuration table

  -- Public type declarations

  -- Public constant declarations

  -- Public variable declarations
  --TYPE units_rt IS RECORD(unit_id VARCHAR2(15), chapter_id VARCHAR2(4), coll_date DATE, qc_reason VARCHAR2(200));
  --TYPE units_aat IS TABLE OF units_rt INDEX BY BINARY_INTEGER;
  TYPE units_cnt_rt IS RECORD(total_units NUMBER, skipped_units NUMBER, incomp_res_units NUMBER, SQC_units  NUMBER);

  /*
  -- Public function and procedure declarations
  PROCEDURE compute_qc_test_flag(p_test_series_id IN VARCHAR2,
                                p_test_id         IN VARCHAR2,
                                p_chapter_id      IN VARCHAR2,
                                p_units_qc        OUT units_aat,
                                p_units_cnt       OUT units_cnt_rt,
                                p_status          OUT VARCHAR2  -- status -- 'OK' or error msg.
                                );

 */
  procedure gen_Exception_log(p_session_id IN VARCHAR2,
                                 p_chapter_id IN VARCHAR2,
                                 p_user_id    IN VARCHAR2,
                                 p_status OUT VARCHAR2);


  PROCEDURE compute_qc( p_session_id    IN VARCHAR2,
                        p_chapter_id    IN VARCHAR2,
                        p_series_id     IN VARCHAR2,
                        p_test_id       IN VARCHAR2,
                        p_qc_totals     OUT units_cnt_rt,
                        p_status        OUT VARCHAR2);


end CNFRESQC;

```
