SET SERVEROUTPUT ON;
DECLARE
    /*
     -- Cron runs every day at 01:00 hrs. 
     
     -- Eg: cron on 24th day at 01:00 AM (sydate is 07/24 01:00)
     
     -- TO_DATE
     -- ld_to_date will be 07/22 00:00 hrs.
     -- query picks records that were processed until 07/21 end of day.
     
     
     -- FROM_DATE
     -- Take until_date from the last cron job if available
     -- OR default it to SYSDATE - 365
     -- IF until_date is 07/16, query will pick records from 07/17 00:00 hrs.
     -- ld_from_date will be 07/17
     
     Ver: 01    -- 07/03/2024
     Ver: 02    -- 07/30/2024 -- MLT-7060
    */
    ld_from_date DATE;
    ld_to_date   DATE;
    
    ln_job_id           NUMBER;
    nAddRecordsCnt      NUMBER;
    nCancelRecordsCnt   NUMBER;
    
    lv_error        VARCHAR2(2000);
    
    FUNCTION insert_job RETURN NUMBER IS
        l_job_id NUMBER;
    BEGIN
        INSERT INTO ag_tf_controller(job_id, extract_status, job_date) 
            VALUES (audit_seq.NEXTVAL, 'P', SYSDATE)
        RETURNING job_id INTO l_job_id;

        RETURN l_job_id;
    END insert_job;    
BEGIN
    -- step 1) Create a job in ag_tf_controller table.
    ln_job_id   := insert_job;
    lv_error    := NULL;
    
    BEGIN
        ld_to_date := TRUNC(SYSDATE) - 2;
        
        SELECT NVL(MAX(until_date) + 1, TRUNC(SYSDATE) - 365 )
         INTO ld_from_date
         FROM ag_tf_controller
         WHERE job_id = (
                    SELECT MAX(JOB_ID)
                      FROM ag_tf_controller
                     WHERE job_id <> ln_job_id);
        
        --DBMS_OUTPUT.PUT_LINE('From Date ' || TO_CHAR(ld_from_date, 'MM-DD-YYYY'));
        --DBMS_OUTPUT.PUT_LINE('To Date ' || TO_CHAR(ld_to_date, 'MM-DD-YYYY'));
        
        INSERT INTO ag_tf_api (
            unit_id,
            antigen_code,
            result_code,
            insert_date,
            cancel_date,
            invalidate_date,
            tf_status
        )
            SELECT
                TRIM("DonationID")      AS unit_id,
                TRIM("Antigen")         AS antigen_code,
                TRIM("Interpretation")  AS result_code,
                "AddDateTime"           AS insert_date,
                "AgCancelDT"            AS cancel_date,
                "AgTestInvalDT"         AS invalidate_date,
                TRIM("Active_Status")   AS tf_status
            FROM
                antigentesthistoryforbloodcenterspre2023@dg4msql
            WHERE "AddDateTime" BETWEEN ld_from_date AND ld_to_date ;
        
        nAddRecordsCnt := SQL%ROWCOUNT;
        --DBMS_OUTPUT.PUT_LINE('Rows processed for new records' || SQL%ROWCOUNT);

        INSERT INTO ag_tf_api (
            unit_id,
            antigen_code,
            result_code,
            insert_date,
            cancel_date,
            invalidate_date,
            tf_status
        )
            SELECT
                TRIM("DonationID")      AS unit_id,
                TRIM("Antigen")         AS antigen_code,
                TRIM("Interpretation")  AS result_code,
                "AddDateTime"           AS insert_date,
                "AgCancelDT"            AS cancel_date,
                "AgTestInvalDT"         AS invalidate_date,
                TRIM("Active_Status")   AS tf_status
            FROM
                antigentesthistoryforbloodcenterspre2023@dg4msql
            WHERE "AgCancelDT" IS NOT NULL
              AND "AgCancelDT" BETWEEN ld_from_date AND ld_to_date ;
        
        nCancelRecordsCnt := SQL%ROWCOUNT;
        --DBMS_OUTPUT.PUT_LINE('Rows processed for cancelled records' || SQL%ROWCOUNT);

        UPDATE ag_tf_controller
          SET extract_status        = 'C',
              tf_from_date          = ld_from_date,
              tf_to_date            = ld_to_date ,
              tf_add_records_cnt    = nAddRecordsCnt,
              tf_cancel_records_cnt = nCancelRecordsCnt,
              job_error     = NULL                   
         WHERE job_id = ln_job_id;

    EXCEPTION
        WHEN OTHERS THEN
            lv_error := SUBSTR(SQLERRM, 1, 1500);
            UPDATE ag_tf_controller
              SET extract_status        = 'E',
                  tf_from_date          = ld_from_date,
                  tf_to_date            = ld_to_date ,
                  tf_add_records_cnt    = nAddRecordsCnt,
                  tf_cancel_records_cnt = nCancelRecordsCnt,
                  job_error             = lv_error                   
             WHERE job_id = ln_job_id;
            --DBMS_OUTPUT.PUT_LINE(SQLERRM);
    END;

    COMMIT;
    
    -- call interface pkg only if no errors.
    IF lv_error IS NULL THEN
        ag_tf_interface.process_tf_api(ln_job_id);
    END IF;
END;