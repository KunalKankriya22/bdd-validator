create or replace TRIGGER "AGMGR"."AG_TF_API_BI" BEFORE
    INSERT ON AG_TF_API
    FOR EACH ROW
BEGIN
    IF :new.bc_insert_date IS NULL THEN
        :new.bc_insert_date := SYSDATE;
    END IF;
END;