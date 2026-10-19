create or replace TRIGGER "AGMGR"."VALID_ANTIGEN_CONFIG_DET_BI"
 BEFORE INSERT
 ON "AGMGR"."VALID_ANTIGEN_CONFIG_DET"
 FOR EACH ROW
BEGIN
    IF :new.program_id IS NULL THEN
        :new.program_id := 'MANUAL';
    END IF;

    IF :new.insert_user IS NULL THEN
        :new.insert_user := lt_user_session.get_userid;
    END IF;

    IF :new.insert_date IS NULL THEN
        :new.insert_date := SYSDATE;
    END IF;

    IF :new.audit_key IS NULL THEN
        :new.audit_key := audit_seq.NEXTVAL;
    END IF;
END;