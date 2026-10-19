---
tags:
  - trigger
  - DONSYS
---
# VALID_EQUIP_PARMS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_EQUIP_PARMS|VALID_EQUIP_PARMS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
  --

  if nvl(:old.DEVICE_TYPE,'*') !=
     nvl(:new.DEVICE_TYPE,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT(
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'DEVICE_TYPE' ,
          :old.DEVICE_TYPE ,
          :new.DEVICE_TYPE);
    end;
  end if;

  if nvl(:old.EQUIP_SUPPLY,'*') !=
     nvl(:new.EQUIP_SUPPLY,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'EQUIP_SUPPLY' ,
          :old.EQUIP_SUPPLY,
          :new.EQUIP_SUPPLY);
    end;
  end if;

  if nvl(:old.QC_TEST_PARM_CODE,'*') !=
     nvl(:new.QC_TEST_PARM_CODE,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'QC_TEST_PARM_CODE' ,
          :old.QC_TEST_PARM_CODE,
          :new.QC_TEST_PARM_CODE);
    end;
  end if;

  if nvl(:old.QC_CONDITION_CODE,'*') !=
     nvl(:new.QC_CONDITION_CODE,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'QC_CONDITION_CODE' ,
          :old.QC_CONDITION_CODE,
          :new.QC_CONDITION_CODE);
    end;
  end if;

  if nvl(:old.QC_ACCPT_VALUE,'*') !=
     nvl(:new.QC_ACCPT_VALUE,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'QC_ACCPT_VALUE' ,
          :old.QC_ACCPT_VALUE,
          :new.QC_ACCPT_VALUE);
    end;
  end if;

  if nvl(:old.DATA_TYPE,'*') !=
     nvl(:new.DATA_TYPE,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'DATA_TYPE' ,
          :old.DATA_TYPE,
          :new.DATA_TYPE);
    end;
  end if;

  if nvl(:old.VALUE_TYPE,'*') !=
     nvl(:new.VALUE_TYPE,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'VALUE_TYPE' ,
          :old.VALUE_TYPE,
          :new.VALUE_TYPE);
    end;
  end if;

  if nvl(:old.SCAN_ALLOWED,'*') !=
     nvl(:new.SCAN_ALLOWED,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'SCAN_ALLOWED' ,
          :old.SCAN_ALLOWED,
          :new.SCAN_ALLOWED);
    end;
  end if;

  if nvl(:old.RANGE_REQUIRED,'*') !=
     nvl(:new.RANGE_REQUIRED,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'RANGE_REQUIRED' ,
          :old.RANGE_REQUIRED,
          :new.RANGE_REQUIRED);
    end;
  end if;

        if nvl(:old.RANGE_VALUE,-1) !=
     nvl(:new.RANGE_VALUE,-1)
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'RANGE_VALUE' ,
          :old.RANGE_VALUE ,
          :new.RANGE_VALUE  );
    end;
  end if;



  if nvl(:old.EFF_DATE,to_date('01-JAN-33', 'DD-MON-YY')) !=
     nvl(:new.EFF_DATE,to_date('01-JAN-33', 'DD-MON-YY'))
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'EFF_DATE' ,
          :old.EFF_DATE ,
          :new.EFF_DATE  );
    end;
  end if;

  if nvl(:old.TERM_DATE,to_date('01-JAN-33', 'DD-MON-YY')) !=
     nvl(:new.TERM_DATE,to_date('01-JAN-33', 'DD-MON-YY'))
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'TERM_DATE' ,
          :old.TERM_DATE ,
          :new.TERM_DATE );
    end;
  end if;

  if nvl(:old.insert_date,to_date('01-JAN-33', 'DD-MON-YY')) !=
     nvl(:new.insert_date,to_date('01-JAN-33','DD-MON-YY'))
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'insert_date' ,
          :old.insert_date ,
          :new.insert_date  );
    end;
  end if;

  if nvl(:old.insert_user,'*') !=
     nvl(:new.insert_user,'*')
  then
    begin
        insert into VALID_EQUIP_PARMS_ADT (
          audit_key ,
          audit_insert_dats ,
          program_id ,
          user_id  ,
          action_code ,
          column_name ,
          old_value ,
          new_value)
        values (
          :old.audit_key ,
          sysdate ,
          :new.program_id ,
          substr(lt_user_session.get_userid,1,6) ,
          'U',
          'insert_user' ,
          :old.insert_user ,
          :new.insert_user  );
    end;
  end if;




--
end;

```
