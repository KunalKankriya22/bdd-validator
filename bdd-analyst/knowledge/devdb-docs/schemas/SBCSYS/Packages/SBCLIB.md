---
tags:
  - package
  - SBCSYS
---
# SBCLIB

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE sbclib IS
/*  Version History  ------

   Ver: 01   Initial version at LT2018
   Ver: 02  adding customner overriding confirmatory testing --2018R2
   Ver: 03  MLT-2866
   Ver: 04  MLT-3149
   Ver: 05  MLT-5039 (process_tcicoldt_units routine added)
   Ver: 06  MLT-5958 gen_seq added.
   Ver: 07  MLT-6032 (created the routine object_lock_unlock)
   Ver: 08  MLT-6583 (new routines added to be called from DELUNIT)
   Ver: 09  MLT-8187  (wallet check for reports)

*/
    FUNCTION calculate_time (
        start_time DATE,
        end_time   DATE
    ) RETURN VARCHAR2;

    FUNCTION unit_system_interdiction (
        p_unit_id           VARCHAR2,
        p_coll_date         DATE,
        p_chapter_id        VARCHAR2,
        p_system_inter_code VARCHAR2,
        p_user_id           VARCHAR2,
        p_prog_name         VARCHAR2
    ) RETURN VARCHAR2;

    FUNCTION comp_system_interdiction (
        p_unit_id           VARCHAR2,
        p_coll_date         DATE,
        p_chapter_id        VARCHAR2,
        p_product_code      VARCHAR2,
        p_system_inter_code VARCHAR2,
        p_user_id           VARCHAR2,
        p_prog_name         VARCHAR2
    ) RETURN VARCHAR2;

    FUNCTION insert_test_parms (
        p_chapter_id VARCHAR2,
        p_test_id    VARCHAR2,
        p_tb_id      VARCHAR2,
        p_parm_type  VARCHAR2,
        p_program_id VARCHAR2
    ) RETURN VARCHAR2;
	-- Added "p_test_chapter_id" parameter to below function
	-- Added by Kishore on 03/12/2012
    FUNCTION load_holding_tests (
        p_unit_id         VARCHAR2,
        p_test_id         VARCHAR2,
        p_well_number     VARCHAR2,
        p_absorbance      VARCHAR2,
        p_ratio           VARCHAR2,
        p_result_status   VARCHAR2,
        p_tb_id           VARCHAR2,
        p_machine_id      VARCHAR2,
        p_status          VARCHAR2,
        p_machine_flags   VARCHAR2,
        p_program_id      VARCHAR2,
        p_result_dats     DATE,
        p_test_chapter_id VARCHAR2
    ) RETURN VARCHAR2;

    FUNCTION move_holding_tests (
        p_chapter_id VARCHAR2,
        p_test_id    VARCHAR2,
        p_tb_id      VARCHAR2,
        p_void_code  VARCHAR2,
        p_program_id VARCHAR2
    ) RETURN VARCHAR2;

    PROCEDURE validate_unit_chkdigit (
        p_unit_id   IN VARCHAR2,
        p_chk_digit OUT VARCHAR2
    );

    PROCEDURE generate_batch_id (
        p_chapter_id IN VARCHAR2,
        p_program_id IN VARCHAR2,
        p_batch_id   OUT NUMBER,
        p_status     OUT VARCHAR2
    );

  -- SCR 177145  -- LT2015SP1
    PROCEDURE gen_seq (
        p_type    IN VARCHAR2,
        p_chp_id  IN VARCHAR2,
        p_seq     OUT VARCHAR2,
        p_err_msg OUT VARCHAR2
    );

    FUNCTION gen_seq (
        p_type   IN VARCHAR2,
        p_chp_id IN VARCHAR2
    ) RETURN NUMBER;

    PROCEDURE intercept_data_parser (
        pl_inp_file_name IN VARCHAR2,
        pl_inp_record    IN VARCHAR2,
        pl_chapter_id    IN VARCHAR2,
        pl_user_id       IN VARCHAR2,
        pl_error         OUT VARCHAR2
    );

    PROCEDURE sch_customer_over_tests (
        pl_unit_id              IN VARCHAR2,
        pl_coll_date            IN DATE,
        pl_chapter_id           IN VARCHAR2,
        pl_reactive_test_id     IN VARCHAR2,
        pl_reactive_result_code IN VARCHAR2,
        pl_plate_seq            IN VARCHAR2,
        pl_program_id           IN VARCHAR2,
        pl_utrs_or_utb          IN VARCHAR2,
        pl_out_status           OUT VARCHAR2
    );

    TYPE string_array IS
        TABLE OF VARCHAR2(200) INDEX BY BINARY_INTEGER;
    TYPE stringindex_array IS
        TABLE OF BOOLEAN INDEX BY VARCHAR2(200);
    PROCEDURE process_tcicoldt_units (
        units_list_in IN string_array,
        chapter_id_in IN VARCHAR2,
        batch_id_out  OUT VARCHAR2,
        status_out    OUT VARCHAR2
    );

    PROCEDURE object_lock_unlock (
        p_pkg_name IN VARCHAR2,
        p_fcn_name IN VARCHAR2,
        p_user     IN VARCHAR2,
        p_flag_ul  IN VARCHAR2
    );

    FUNCTION delunit_tabCount(
        table_in IN VARCHAR2,
        colname_in IN VARCHAR2,
        colvalue_in IN VARCHAR2 )
        RETURN PLS_INTEGER;

    PROCEDURE delunit_insert_deleted_units(
        unit_id_in IN VARCHAR2,
        prog_name_in IN VARCHAR2,
        user_id_in   IN VARCHAR2,
        status_out OUT VARCHAR2);

    PROCEDURE delunit_do_delete(
        unit_id_in IN VARCHAR2,
        prog_name_in IN VARCHAR2,
        status_out OUT VARCHAR2);

     FUNCTION WALLET_ENABLED
         RETURN BOOLEAN;



END sbclib;
```
