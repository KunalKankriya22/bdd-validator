CREATE OR REPLACE TRIGGER "AGMGR"."VALID_ANTIGEN_GROUPS_BI" BEFORE
    INSERT ON "AGMGR"."VALID_ANTIGEN_GROUPS"
    FOR EACH ROW
BEGIN
    IF :new.program_id IS NULL THEN
        :new.program_id := 'MANUAL';
    END IF;

    IF :new.insert_user IS NULL THEN
        :new.insert_user := lt_user_session.get_userid;
    END IF;

    IF :new.insert_date IS NULL THEN
        :new.insert_date := sysdate;
    END IF;

    IF :new.audit_key IS NULL THEN
        :new.audit_key := audit_seq.nextval;
    END IF;

END;