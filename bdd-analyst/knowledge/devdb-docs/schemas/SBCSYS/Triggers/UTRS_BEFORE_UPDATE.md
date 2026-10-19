---
tags:
  - trigger
  - SBCSYS
---
# UTRS_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UTRS|UTRS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    aud_rec utrs_audit%rowtype;

    PROCEDURE reset_qc IS
        -- same as utrs_before_insert trigger.
        -- only change in update trigger is to reset qc only if the test being
        -- resulted is an additional test.
        t_qc_test_flag    units.qc_test_flag%TYPE;
        t_qc_test_date    units.qc_test_date%TYPE;
        t_batch_id        units.batch_id%TYPE;
        t_contract_id     units.contract_id%TYPE;
        t_local_dt        DATE;
        t_results_qc_date batch_inputs.results_qc_date%TYPE;
        t_results_qc_user batch_inputs.results_qc_user%TYPE;
        t_unit_count      NUMBER := 0;
        t_qc_reqd         VARCHAR2(1);
        nCount            NUMBER:=0;
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
                t_local_dt := lifetrack_timezone_convert.get_local_time(:old.chapter_id, sysdate);
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

    END reset_qc;

BEGIN
    aud_rec.audit_key := :old.audit_key;
    aud_rec.program_id := :new.program_id;
    IF nvl(:old.unit_id, '*') != nvl(:new.unit_id, '*') THEN
        aud_rec.unit_id := nvl(:new.unit_id, '*');
    END IF;

    IF nvl(:old.coll_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.coll_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
        aud_rec.coll_date := nvl(:new.coll_date, TO_DATE('01-JAN-33', 'DD-MON-YY'));
    END IF;

    IF nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') THEN
        aud_rec.chapter_id := nvl(:new.chapter_id, '*');
    END IF;

    IF nvl(:old.test_seq_no, -1) != nvl(:new.test_seq_no, -1) THEN
        aud_rec.test_seq_no := nvl(:new.test_seq_no, -1);
    END IF;

    IF nvl(:old.test_id, '*') != nvl(:new.test_id, '*') THEN
        aud_rec.test_id := nvl(:new.test_id, '*');
    END IF;

    IF nvl(:old.test_state, '*') != nvl(:new.test_state, '*') THEN
        aud_rec.test_state := nvl(:new.test_state, '*');
    END IF;

    IF nvl(:old.test_mode, '*') != nvl(:new.test_mode, '*') THEN
        aud_rec.test_mode := nvl(:new.test_mode, '*');
    END IF;

    IF nvl(:old.result_status_1, '*') != nvl(:new.result_status_1, '*') THEN
        aud_rec.result_status_1 := nvl(:new.result_status_1, '*');
       -- /* Update the result flag in RGT_INTERIM_RESULTS , to indicate result
       --    result has come, so that interim result is no more extracted  */
        IF ( nvl(:new.result_status_1, '*') != '*' ) THEN
            BEGIN
                UPDATE rgt_interim_results rgt
                SET
                    rgt.result_flag = 'Y'
                WHERE
                        rgt.unit_id = :old.unit_id
                    AND rgt.coll_date = :old.coll_date
                    AND rgt.chapter_id = :old.chapter_id
                    AND EXISTS (
                        SELECT
                            'x'
                        FROM
                            units u
                        WHERE
                                u.chapter_id = rgt.chapter_id
                            AND u.contract_id = rgt.contract_id
                            AND u.unit_id = rgt.unit_id
                            AND u.coll_date = rgt.coll_date
                    )
                    AND rgt.test_id = :old.test_id
                    AND rgt.test_seq_no = :old.test_seq_no
                    AND nvl(rgt.result_flag, 'N') = 'N';

            EXCEPTION
                WHEN no_data_found THEN
                    NULL;
            END;

        END IF;

    END IF;

    IF nvl(:old.result_status_2, '*') != nvl(:new.result_status_2, '*') THEN
        aud_rec.result_status_2 := nvl(:new.result_status_2, '*');
    END IF;

    IF nvl(:old.cancel_flag, '*') != nvl(:new.cancel_flag, '*') THEN
        aud_rec.cancel_flag := nvl(:new.cancel_flag, '*');
       -- /* Update the result flag in RGT_INTERIM_RESULTS , to indicate test
       --    is canceled (C) or when canceled test is rescheduled (null) */
        BEGIN
            UPDATE rgt_interim_results rgt
            SET
                rgt.result_flag = decode(nvl(:new.cancel_flag, 'N'), 'Y', 'C', NULL)
            WHERE
                    rgt.unit_id = :old.unit_id
                AND rgt.coll_date = :old.coll_date
                AND rgt.chapter_id = :old.chapter_id
                AND EXISTS (
                    SELECT
                        'x'
                    FROM
                        units u
                    WHERE
                            u.chapter_id = rgt.chapter_id
                        AND u.contract_id = rgt.contract_id
                        AND u.unit_id = rgt.unit_id
                        AND u.coll_date = rgt.coll_date
                )
                AND rgt.test_id = :old.test_id
                AND rgt.test_seq_no = :old.test_seq_no;

        EXCEPTION
            WHEN no_data_found THEN
                NULL;
        END;

    END IF;

    IF nvl(:old.edit_result_flag, '*') != nvl(:new.edit_result_flag, '*') THEN
        aud_rec.edit_result_flag := nvl(:new.edit_result_flag, '*');
    END IF;

    IF nvl(:old.tb_id, '*') != nvl(:new.tb_id, '*') THEN
        aud_rec.tb_id := nvl(:new.tb_id, '*');
    END IF;

    IF nvl(:old.test_chapter_id, '*') != nvl(:new.test_chapter_id, '*') THEN
        aud_rec.test_chapter_id := nvl(:new.test_chapter_id, '*');
    END IF;

    IF nvl(:old.tb_seq_no, -1) != nvl(:new.tb_seq_no, -1) THEN
        aud_rec.tb_seq_no := nvl(:new.tb_seq_no, -1);
    END IF;

    IF nvl(:old.well_number, '*') != nvl(:new.well_number, '*') THEN
        aud_rec.well_number := nvl(:new.well_number, '*');
    END IF;

    IF nvl(:old.absorbance, '*') != nvl(:new.absorbance, '*') THEN
        aud_rec.absorbance := nvl(:new.absorbance, '*');
    END IF;

    IF nvl(:old.ratio, '*') != nvl(:new.ratio, '*') THEN
        aud_rec.ratio := nvl(:new.ratio, '*');
    END IF;

    IF nvl(:old.result_dats, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.result_dats, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
        aud_rec.result_dats := nvl(:new.result_dats, TO_DATE('01-JAN-33', 'DD-MON-YY'));
    END IF;

    IF nvl(:old.result_user_id, '*') != nvl(:new.result_user_id, '*') THEN
        aud_rec.result_user_id := nvl(:new.result_user_id, '*');
    END IF;

    IF nvl(:old.testing_lab_code, '*') != nvl(:new.testing_lab_code, '*') THEN
        aud_rec.testing_lab_code := nvl(:new.testing_lab_code, '*');
    END IF;

    IF nvl(:old.extract_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.extract_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
        aud_rec.extract_date := nvl(:new.extract_date, TO_DATE('01-JAN-33', 'DD-MON
-YY'));
    END IF;

    IF nvl(:old.profile_set_id, '*') != nvl(:new.profile_set_id, '*') THEN
        aud_rec.profile_set_id := nvl(:new.profile_set_id, '*');
    END IF;

    IF nvl(:old.test_series_id, '*') != nvl(:new.test_series_id, '*') THEN
        aud_rec.test_series_id := nvl(:new.test_series_id, '*');
    END IF;

    IF nvl(:old.qc_test_flag, '*') != nvl(:new.qc_test_flag, '*') THEN
        aud_rec.qc_test_flag := nvl(:new.qc_test_flag, '*');
    END IF;

    IF nvl(:old.qc_test_user, '*') != nvl(:new.qc_test_user, '*') THEN
        aud_rec.qc_test_user := nvl(:new.qc_test_user, '*');
    END IF;

    IF nvl(:old.qc_test_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.qc_test_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
        aud_rec.qc_test_date := nvl(:new.qc_test_date, TO_DATE('01-JAN-33', 'DD-MON-YY'));
    END IF;

    IF nvl(:old.NOTE_ID, -1) != nvl(:new.NOTE_ID, -1) THEN
        aud_rec.note_id := nvl(:new.note_id, -1);
    END IF;

    IF nvl(:old.REP_PROFILE_SET_ID, '*') != nvl(:new.REP_PROFILE_SET_ID, '*') THEN
        aud_rec.REP_PROFILE_SET_ID := nvl(:new.REP_PROFILE_SET_ID, '*');
    END IF;

    IF nvl(:old.VOID_CANCEL_FLAG, '*') != nvl(:new.VOID_CANCEL_FLAG, '*') THEN
        aud_rec.VOID_CANCEL_FLAG := nvl(:new.VOID_CANCEL_FLAG, '*');
    END IF;

    IF nvl(:old.VOID_CANCEL_ID, '*') != nvl(:new.VOID_CANCEL_ID, '*') THEN
        aud_rec.VOID_CANCEL_ID := nvl(:new.VOID_CANCEL_ID, '*');
    END IF;


  --
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
        audit_insert_dats,
        audit_insert_user,
        profile_set_id,
        test_series_id,
        qc_test_flag,
        qc_test_date,
        qc_test_user,
        note_id,
        rep_profile_set_id,
        void_cancel_flag,
        void_cancel_id
    ) VALUES (
        aud_rec.unit_id,
        aud_rec.coll_date,
        aud_rec.chapter_id,
        aud_rec.test_seq_no,
        aud_rec.test_id,
        aud_rec.test_state,
        aud_rec.test_mode,
        aud_rec.result_status_1,
        aud_rec.result_status_2,
        aud_rec.cancel_flag,
        aud_rec.edit_result_flag,
        aud_rec.tb_id,
        aud_rec.test_chapter_id,
        aud_rec.tb_seq_no,
        aud_rec.well_number,
        aud_rec.absorbance,
        aud_rec.ratio,
        aud_rec.result_dats,
        aud_rec.result_user_id,
        aud_rec.testing_lab_code,
        aud_rec.insert_dats,
        aud_rec.insert_user_id,
        aud_rec.audit_key,
        aud_rec.program_id,
        sysdate,
        lt_user_session.get_userid,
        aud_rec.profile_set_id,
        aud_rec.test_series_id,
        aud_rec.qc_test_flag,
        aud_rec.qc_test_date,
        aud_rec.qc_test_user,
        aud_rec.note_id,
        aud_rec.rep_profile_set_id,
        aud_rec.void_cancel_flag,
        aud_rec.void_cancel_id
    );

  --
  -- Check if profile_set_id is NULL
    IF
        :old.profile_set_id IS NULL
        AND :old.result_status_1 IS NULL
        AND :new.result_status_1 IS NOT NULL
    THEN
        reset_qc;
    END IF;

    emf_util.staging_insert('UTRS', :new.audit_key, :new.program_id, 'LAB', 'UTRS_BEFORE_UPDATE',
                           'U');

END;
```
