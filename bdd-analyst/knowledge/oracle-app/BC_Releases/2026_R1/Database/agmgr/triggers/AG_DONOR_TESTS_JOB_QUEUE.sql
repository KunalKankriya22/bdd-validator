create or replace TRIGGER "AGMGR"."AG_DONOR_TESTS_JOB_QUEUE" BEFORE
    INSERT ON AG_DONOR_TESTS_JOB_QUEUE
    FOR EACH ROW
BEGIN
    IF :new.program_id IS NULL THEN
        :new.program_id := 'MANUAL';
    END IF;

    IF :new.insert_date IS NULL THEN
        :new.insert_date := SYSDATE;
    END IF;
END;