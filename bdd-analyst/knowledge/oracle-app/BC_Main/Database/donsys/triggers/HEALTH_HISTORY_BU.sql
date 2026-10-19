--------------------------------------------------------
--  DDL for Trigger HEALTH_HISTORY_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."HEALTH_HISTORY_BU" 
  BEFORE UPDATE ON HEALTH_HISTORY
  FOR EACH ROW
BEGIN
  --
  if nvl(:old.transaction_id, '*') != nvl(:new.transaction_id, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'transaction_id',
         :old.transaction_id,
         :new.transaction_id);
    end;
  end if;
  if nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'chapter_id',
         :old.chapter_id,
         :new.chapter_id);
    end;
  end if;
  if nvl(:old.question_code, '*') != nvl(:new.question_code, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'question_code',
         :old.question_code,
         :new.question_code);
    end;
  end if;
  if nvl(:old.answer_code, '*') != nvl(:new.answer_code, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'answer_code',
         :old.answer_code,
         :new.answer_code);
    end;
  end if;
  if nvl(:old.response, '*') != nvl(:new.response, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'response',
         :old.response,
         :new.response);
    end;
  end if;
  if nvl(:old.template_id, '*') != nvl(:new.template_id, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'template_id',
         :old.template_id,
         :new.template_id);
    end;
  end if;
  if nvl(:old.inter_code, '*') != nvl(:new.inter_code, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'inter_code',
         :old.inter_code,
         :new.inter_code);
    end;
  end if;
  if nvl(:old.deferral_period, -1) != nvl(:new.deferral_period, -1) then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'deferral_period',
         :old.deferral_period,
         :new.deferral_period);
    end;
  end if;
  if nvl(:old.period_type, '*') != nvl(:new.period_type, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'period_type',
         :old.period_type,
         :new.period_type);
    end;
  end if;
  if nvl(:old.incident_date, to_date('01-JAN-33', 'DD-MON-YY')) !=
     nvl(:new.incident_date, to_date('01-JAN-33', 'DD-MON-YY')) then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'incident_date',
         :old.incident_date,
         :new.incident_date);
    end;
  end if;
  if nvl(:old.comments, '*') != nvl(:new.comments, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'comments',
         :old.comments,
         :new.comments);
    end;
  end if;
  if nvl(:old.def_thru_date, to_date('01-JAN-33', 'DD-MON-YY')) !=
     nvl(:new.def_thru_date, to_date('01-JAN-33', 'DD-MON-YY')) then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'def_thru_date',
         :old.def_thru_date,
         :new.def_thru_date);
    end;
  end if;
  if nvl(:old.insert_date, to_date('01-JAN-33', 'DD-MON-YY')) !=
     nvl(:new.insert_date, to_date('01-JAN-33', 'DD-MON-YY')) then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'insert_date',
         :old.insert_date,
         :new.insert_date);
    end;
  end if;
  if nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') then
    begin
      insert into HEALTH_HISTORY_AUDIT
        (audit_key,
         audit_insert_dats,
         program_id,
         user_id,
         action_code,
         column_name,
         old_value,
         new_value)
      values
        (:old.audit_key,
         sysdate,
         :new.program_id,
         substr(lt_user_session.get_userid, 1, 6),
         'U',
         'insert_user',
         :old.insert_user,
         :new.insert_user);
    end;
  end if;
  --

  emf_util.staging_insert('HEALTH_HISTORY',
                          :NEW.audit_key,
                          :NEW.program_id,
                          'DON',
                          'HEALTH_HISTORY_BU',
                          'U');
end;

/
ALTER TRIGGER "DONSYS"."HEALTH_HISTORY_BU" ENABLE;
