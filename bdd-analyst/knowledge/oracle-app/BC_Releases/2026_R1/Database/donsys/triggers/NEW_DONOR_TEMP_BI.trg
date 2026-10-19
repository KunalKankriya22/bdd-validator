create or replace TRIGGER "DONSYS"."NEW_DONOR_TEMP_BI" BEFORE
    INSERT ON new_donor_temp
    FOR EACH ROW
BEGIN
    IF :new.insert_date IS NULL THEN
        :new.insert_date := sysdate;
    END IF;
END;
/

