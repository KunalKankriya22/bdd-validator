---
tags:
  - trigger
  - SBCSYS
---
# UTRS_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UTRS|UTRS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    temp_audit_key    NUMBER(23);
    t_profile_set_id  utrs.profile_set_id%TYPE;

    PROCEDURE reset_qc_check IS
        t_qc_test_flag    units.qc_test_flag%TYPE;
        t_qc_test_date    units.qc_test_date%TYPE;
        t_batch_id        units.batch_id%TYPE;
        t_contract_id     units.contract_id%TYPE;
        t_local_dt        DATE;
        t_results_qc_date batch_inputs.results_qc_date%TYPE;
        t_results_qc_user batch_inputs.results_qc_user%TYPE;
        t_unit_count      NUMBER := 0;
        nCount            NUMBER:=0;
        t_qc_reqd         VARCHAR2(1);
    BEGIN
        BEGIN
            SELECT
                qc_test_flag,
                qc_test_date,
                batch_id,
                contract_id
            INTO
                t_qc_test_flag,
                t_qc_test_date,
                t_batch_id,
                t_contract_id
            FROM
                units
            WHERE
                    unit_id = :new.unit_id
                AND chapter_id = :new.chapter_id;

        EXCEPTION
            WHEN no_data_found THEN
                t_qc_test_flag := 'N';
                t_qc_test_date := NULL;
                t_batch_id := NULL;
                t_contract_id := NULL;
            WHEN OTHERS THEN
                t_qc_test_flag := 'N';
                t_qc_test_date := NULL;
                t_batch_id := NULL;
                t_contract_id := NULL;
        END;

        IF t_contract_id <> 'INTERNAL' THEN
            BEGIN
                t_local_dt := lifetrack_timezone_convert.get_local_time(:new.chapter_id, sysdate);
                BEGIN
                    -- contract_tests table should have only one test for per profile.
                    -- test being added can be an effective or terminated test.
                    -- Look at the stop_label_flag (to figure out if qc is required or not)
                    SELECT
                        NVL(stop_label_flag,'N')
                    INTO t_qc_reqd
                    FROM
                        contract_tests
                    WHERE
                            contract_id = t_contract_id
                        AND test_id = :new.test_id
                        AND profile_set_id = :new.rep_profile_set_id
                        --AND t_local_dt BETWEEN eff_date AND nvl(term_date, t_local_dt + 1)
                        AND ROWNUM = 1;

                EXCEPTION
                    -- test is outside the profile the unit was checked in - Reset QC.
                    WHEN NO_DATA_FOUND THEN
                        t_qc_reqd := 'Y';
                END;

                -- RESET QC only if the test being resulted is an additional test
                -- which is not part of a profile.

                -- Add test (either terminated or effective) which is part of the profile the unit was checked in.
                -- Add test which is outside the profile the unit was checked in - Reset QC
                IF t_qc_reqd = 'Y' THEN

                    BEGIN
                        SELECT
                            COUNT(*)
                        INTO t_unit_count
                        FROM
                            reset_qc_date_log
                        WHERE
                                chapter_id = :new.chapter_id
                            AND contract_id = t_contract_id
                            AND batch_id = t_batch_id;

                    EXCEPTION
                        WHEN OTHERS THEN
                            t_unit_count := 0;
                    END;

                    -- reset qc if qc test flag is already set OR if batch is is in reset_qc_date_log
                    IF nvl(t_qc_test_flag, 'N') = 'Y' OR t_unit_count > 0 THEN
                        BEGIN
                            UPDATE units
                            SET
                                qc_test_flag = NULL,
                                qc_test_date = NULL
                            WHERE
                                    unit_id = :new.unit_id
                                AND chapter_id = :new.chapter_id;

                        END;

                        BEGIN
                            SELECT
                                results_qc_date,
                                results_qc_user
                            INTO
                                t_results_qc_date,
                                t_results_qc_user
                            FROM
                                batch_inputs
                            WHERE
                                    batch_id = t_batch_id
                                AND chapter_id = :new.chapter_id
                                AND contract_id = t_contract_id;

                        EXCEPTION
                            WHEN no_data_found THEN
                                t_results_qc_date := NULL;
                                t_results_qc_user := NULL;
                            WHEN OTHERS THEN
                                t_results_qc_date := NULL;
                                t_results_qc_user := NULL;
                        END;

                        IF t_batch_id IS NOT NULL THEN
                            BEGIN
                                UPDATE batch_inputs
                                SET
                                    results_qc_date = NULL,
                                    results_qc_user = NULL
                                WHERE
                                        batch_id = t_batch_id
                                    AND chapter_id = :new.chapter_id
                                    AND contract_id = t_contract_id;

                            END;
                        END IF;

                  -- Check if the exact same record is already there, if so do not insert.
                  --- addwd on 09/13/23, w.r.t to email from cts on 09/12/23

                  select nvl(count(*),0) into nCount from reset_qc_date_log where
                  chapter_id=:new.chapter_id and contract_id=t_contract_id and
                  batch_id=t_batch_id and unit_id=:new.unit_id and test_id=:new.test_id;

                  If nCount = 0 then

                        BEGIN
                            INSERT INTO reset_qc_date_log (
                                chapter_id,
                                contract_id,
                                batch_id,
                                unit_id,
                                test_id,
                                prev_qc_test_flag,
                                prev_qc_test_date,
                                prev_results_qc_date,
                                prev_results_qc_user,
                                insert_date
                            ) VALUES (
                                :new.chapter_id,
                                t_contract_id,
                                t_batch_id,
                                :new.unit_id,
                                :new.test_id,
                                t_qc_test_flag,
                                t_qc_test_date,
                                t_results_qc_date,
                                t_results_qc_user,
                                sysdate
                            );

                        END;
                  End If;

                    END IF;

                END IF;
            END;
        END IF;

    END reset_qc_check;
BEGIN
    SELECT
        audit_seq_lab.NEXTVAL
    INTO temp_audit_key
    FROM
        dual;

    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id, 'MANUAL');
    IF
        :new.profile_set_id IS NULL
        AND :new.test_seq_no <> 1
    THEN
        BEGIN
            SELECT
                profile_set_id
            INTO t_profile_set_id
            FROM
                utrs
            WHERE
                    unit_id = :new.unit_id
                AND chapter_id = :new.chapter_id
                AND coll_date = :new.coll_date
                AND test_id = :new.test_id
                AND test_seq_no = 1
                AND profile_set_id IS NOT NULL
                AND ROWNUM = 1;

            :new.profile_set_id := t_profile_set_id;
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END IF;

  -- added by M. Ansell MLT-959 10/24/18
    BEGIN
        IF :new.profile_set_id IS NOT NULL THEN
            :new.rep_profile_set_id := :new.profile_set_id;
        ELSE
    /*
    --MLT-2266
     -- this is inserting secondary profile test id when a test which is part of secondary profile is added using ADDTEST screen
     -- Attach primary profile set id to rep_profile_set_id when profile_set_id is null)
      begin
        select cti.profile_set_id
          into :new.rep_profile_set_id
          from contract_tests_image cti,
               units u
         where u.contract_id = cti.contract_id
           and cti.test_id   = :new.test_id
           and u.unit_id     = :new.unit_id
           and rownum = 1 ;

      exception
        when no_data_found then
          null ;
      end ;
    --*/
      -- MLT 4627
      -- commented out code changes made as part of MLT-2266 as it incorrectly picks profile set id.
      -- instead getting profile set id from batch_inputs table.
            BEGIN
                SELECT
                    profile_set_id
                INTO :new.rep_profile_set_id
                FROM
                    units        u,
                    batch_inputs bu
                WHERE
                        u.batch_id = bu.batch_id
                    AND u.chapter_id = bu.chapter_id
                    AND u.unit_id = :new.unit_id
                    AND u.chapter_id = :new.chapter_id;

            EXCEPTION
                WHEN OTHERS THEN
                    NULL;
            END;
      ----------

            IF :new.rep_profile_set_id IS NULL THEN
                BEGIN
                    SELECT
                        rcp.profile_set_id
                    INTO :new.rep_profile_set_id
                    FROM
                        rgt_contract_profile rcp,
                        units                u
                    WHERE
                            u.contract_id = rcp.contract_id
                        AND u.unit_id = :new.unit_id
                        AND rcp.profile_type = 'P'
                        AND ROWNUM = 1;

                EXCEPTION
                    WHEN no_data_found THEN
                        NULL;
                END;

            END IF;

        END IF;
    END;


    --
    -- old.profile_set_id IS NULL when test is added through additional test process.
    reset_qc_check;


    INSERT INTO utrs_audit (
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
        extract_date,
        profile_set_id,
        test_series_id,
        qc_test_flag,
        qc_test_date,
        qc_test_user,
        note_id,
        rep_profile_set_id,
        void_cancel_flag,
        void_cancel_id,
        audit_insert_dats,
        audit_insert_user
    ) VALUES (
        :new.unit_id,
        :new.coll_date,
        :new.chapter_id,
        :new.test_seq_no,
        :new.test_id,
        :new.test_state,
        :new.test_mode,
        :new.result_status_1,
        :new.result_status_2,
        :new.cancel_flag,
        :new.edit_result_flag,
        :new.tb_id,
        :new.test_chapter_id,
        :new.tb_seq_no,
        :new.well_number,
        :new.absorbance,
        :new.ratio,
        :new.result_dats,
        :new.result_user_id,
        :new.testing_lab_code,
        :new.insert_dats,
        :new.insert_user_id,
        :new.audit_key,
        :new.program_id,
        :new.extract_date,
        :new.profile_set_id,
        :new.test_series_id,
        :new.qc_test_flag,
        :new.qc_test_date,
        :new.qc_test_user,
        :new.note_id,
        :new.rep_profile_set_id,
        :new.void_cancel_flag,
        :new.void_cancel_id,
        sysdate,
        lt_user_session.get_userid
    );

END;
```
