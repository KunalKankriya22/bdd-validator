--------------------------------------------------------
--  DDL for Trigger VSERV_CONTACTS_BEFORE_DEL
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_CONTACTS_BEFORE_DEL" before delete on vserv_contacts
for each row
begin
  insert into vserv_contacts_audit
  (
   audit_key,
   program_id,
   last_name,
   first_name,
   inst_id,
   chapter_id,
   customer_id,
   salutation,
   title,
   day_phone_no,
   night_phone_no,
   fax_no,
   telex_no,
   eff_date,
   term_date,
   last_modified_date,
   contact_type,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :old.audit_key,
    'DELETE',
    :old.last_name,
    :old.first_name,
    :old.inst_id,
    :old.chapter_id,
    :old.customer_id,
    :old.salutation,
    :old.title,
    :old.day_phone_no,
    :old.night_phone_no,
    :old.fax_no,
    :old.telex_no,
    :old.eff_date,
    :old.term_date,
    :old.last_modified_date,
    :old.contact_type,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_CONTACTS_BEFORE_DEL" ENABLE;
