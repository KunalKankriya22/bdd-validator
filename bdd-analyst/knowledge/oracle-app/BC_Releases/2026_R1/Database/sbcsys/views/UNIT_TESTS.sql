CREATE OR REPLACE FORCE EDITIONABLE VIEW "SBCSYS"."UNIT_TESTS" ( "SCHEDULE_FLAG",
"UNIT_ID",
"COLL_DATE",
"CHAPTER_ID",
"TEST_SEQ_NO",
"TEST_ID",
"TEST_STATE",
"TEST_MODE",
"RESULT_STATUS_1",
"RESULT_STATUS_2",
"CANCEL_FLAG",
"EDIT_RESULT_FLAG",
"TB_ID",
"TEST_CHAPTER_ID",
"TB_SEQ_NO",
"WELL_NUMBER",
"ABSORBANCE",
"RATIO",
"RESULT_DATS",
"RESULT_USER_ID",
"TESTING_LAB_CODE",
"INSERT_DATS",
"INSERT_USER_ID",
"AUDIT_KEY",
"PROGRAM_ID",
"PROFILE_SET_ID",
"REP_PROFILE_SET_ID" ) AS
    SELECT
        'Y' schedule_flag,
        unit_id,
        coll_date,
        chapter_id,
        test_seq_no,
        test_id,
        test_state,
        test_mode,
        result_status_1,
        result_status_2,
        cancel_flag,
        edit_result_flag,
        tb_id,
        test_chapter_id,
        tb_seq_no,
        well_number,
        absorbance,
        ratio,
        result_dats,
        result_user_id,
        testing_lab_code,
        insert_dats,
        insert_user_id,
        audit_key,
        program_id,
        profile_set_id,
        rep_profile_set_id
    FROM
        utrs
    UNION ALL
    SELECT
        'N',
        unit_id,
        coll_date,
        chapter_id,
        test_seq_no,
        test_id,
        test_state,
        test_mode,
        result_status_1,
        result_status_2,
        cancel_flag,
        edit_result_flag,
        tb_id,
        test_chapter_id,
        tb_seq_no,
        well_number,
        absorbance,
        ratio,
        result_dats,
        result_user_id,
        testing_lab_code,
        insert_dats,
        insert_user_id,
        audit_key,
        program_id,
        profile_set_id,
        rep_profile_set_id
    FROM
        unit_test_base;

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "DONSYS";

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "LTAPI";

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "LTWEB";

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "SRVSYS";

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "UTIL";

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "VISTA";

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "DBADMN";

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "LTRAK_ROLE";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "DONSYS";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "LTAPI";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "LTWEB";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "SRVSYS";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "UTIL";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "VISTA";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "DBADMN";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "LTRAK_ROLE";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "DONSYS";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "LTAPI";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "LTWEB";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "SRVSYS";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "UTIL";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "VISTA";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "DBADMN";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "LTRAK_ROLE";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "DONSYS";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "LTAPI";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "LTWEB";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "SRVSYS";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "UTIL";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "VISTA";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "DBADMN";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "LTRAK_ROLE";

GRANT UPDATE ON "SBCSYS"."UNIT_TESTS" TO "BLOODC_ROLE";

GRANT SELECT ON "SBCSYS"."UNIT_TESTS" TO "BLOODC_ROLE";

GRANT INSERT ON "SBCSYS"."UNIT_TESTS" TO "BLOODC_ROLE";

GRANT DELETE ON "SBCSYS"."UNIT_TESTS" TO "BLOODC_ROLE";