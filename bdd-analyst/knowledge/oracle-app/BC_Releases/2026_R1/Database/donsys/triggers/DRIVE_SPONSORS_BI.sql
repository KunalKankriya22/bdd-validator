--------------------------------------------------------
--  DDL for Trigger DRIVE_SPONSORS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DRIVE_SPONSORS_BI" 
 BEFORE INSERT
 ON DRIVE_SPONSORS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into :new.audit_key from dual;
    begin
      update drives set
      projected_draw = nvl(projected_draw,0) + :new.projected_draw,
      projected_show = nvl(projected_show,0) + :new.projected_show
      where drive_id = :new.drive_id
       and  chapter_id = :new.chapter_id ;
    end;
end ;
/
ALTER TRIGGER "DONSYS"."DRIVE_SPONSORS_BI" ENABLE;
