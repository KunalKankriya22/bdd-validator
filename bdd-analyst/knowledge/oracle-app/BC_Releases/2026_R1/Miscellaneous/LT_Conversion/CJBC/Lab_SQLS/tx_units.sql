-- **************************************************************************
-- PROGRAM   : TX_UNITS.SQL
-- PURPOSE   : This script would convert all the data of ACTIVE module
--          from temporary tables into all required LifeTrak /Lab - 
--        Distribution tables.
-- **************************************************************************
DECLARE
  last_id         number:=0;
  l_audit_seq     number := 0;
  tot_cnt         number  :=0;
  c_cue          varchar2(1);
  c_bag_code     varchar2(4);
  c_blood_type      varchar2(4);
  c_don_type      varchar2(1);
  c_temp_cnt       number := 0;
  c_stmt          number(5);
  c_err_msg       varchar2(60);
  c_err_flg       varchar2(1);
  uCount          number:=0;
  c_err_cd        varchar2(2);
  c_insert_user   varchar2(6);
  pgm_error       exception;
  c_error_cnt     number :=0;
  c_item_id       varchar2(30);
  c_exit_flg      varchar2(1):='N';
  c_note_id       varchar2(10);
  c_note_text     varchar2(1000);
  c_attrib_code     varchar2(4);
  ltUnit_id       varchar2(15);
  szOSUnitID       varchar2(15);
  temp_unit_id     varchar2(15);

  cursor c1 is
    select * from convert_units
     order by unit_id;

  cursor c2(p_unit_id varchar2) is
    select * from convert_unit_comments 
     where unit_id = p_unit_id;
      
  procedure insert_error is
  begin
    c_error_cnt := c_error_cnt +1;

    if c_error_cnt>100 then
      c_err_msg := 'Reached maximum no of errors';
      c_exit_flg := 'Y';
    end if;

    insert into program_errors( module_id,
            program_id,
            statement_id,
            item_id,
            error_msg,
            insert_user,
            insert_date)
         values( 'UNITS',
            'TX_UNITS',
            c_stmt,
            c_item_id,
            c_err_msg,
            'CONVERT',
            sysdate);
  end;

BEGIN   -- main begin starts here
--  set transaction use rollback segment BIG_RBS;

   -- Get the restart point
  
for c1_rec in c1
  loop
    begin

       ltUnit_id:=c1_rec.unit_id;
       szOSUnitID:=null;

      If c1_rec.lot_no is not null then 
        szOSUnitID:=c1_rec.lot_no;
      End If;

   If Length(ltUnit_id)=13 and ltUnit_id like 'W%' then 
     null;
   Else 
     begin
        select new_unit into temp_unit_id from mw_unit_trans where
        old_unit=c1_rec.unit_id;

        ltUnit_id:=temp_unit_id;
      exception when others then
        null;
      end ;
   End If;

    select nvl(count(*),0) into uCount from units where unit_id=ltUnit_id;

 If ucount = 0 then

      tot_cnt := tot_cnt +1;

      --savepoint S1;
      c_stmt :=10;
      
      IF (rtrim(ltrim(c1_rec.draw_category_code)) = 'TH') THEN
          ---therupatic donation, set the cue flag to 'T'
          c_cue := 'T';
      ELSE
         IF (rtrim(ltrim(c1_rec.draw_category_code)) = 'AD') THEN
             --Autologous donation, set the cue flag to 'S'
             c_cue := 'S';
         ELSE
            /* IF c1_rec.self_deferral_flag = 'Y' then
               c_cue := 'N';
            ELSE
               c_cue := 'Y';
            END IF;
            */
             c_cue:='Y';
         END IF;
      END IF;
      
     c_bag_code:='99';


      IF (rtrim(ltrim(c1_rec.blood_type)) is not null) THEN
         begin
           /* select life_blood_type
            into c_blood_type
            from x_blood_types
            where oldsys_blood_type = c1_rec.blood_type; */

           select decode(rtrim(ltrim(c1_rec.blood_type)),'OP','51',
                                            'AP','62',
                                            'BP','73',
                                            'ABP','84',
                                            'ON','95',
                                            'AN','06',
                                            'BN','17',
                                            'ABN','28','99')
               into c_blood_type from dual;
         exception
          when others then
            -- c_blood_type := c1_rec.blood_type;
            c_err_msg := substr(sqlerrm,1,60);
            raise pgm_error;
         end;
      ELSE
         c_blood_type := null;
      END IF;

/*     select decode(rtrim(ltrim(blood_type)),'OP','51',
                                            'AP','62',
                                            'BP','73',
                                            'ABP','84',
                                            'ON','95',
                                            'AN','06',
                                            'BN','17',
                                            'ABN','28','99')
       into c_blood_type from dual;



      -- Check for notes present on unit
      select count(*) into c_temp_cnt
       from convert_unit_comments
       where unit_id = c1_rec.unit_id;

      If c_temp_cnt > 0 then
         select notebook_seq.nextval into c_note_id from dual;

         c_note_text := null;
         for c2_rec in c2(c1_rec.unit_id)
         loop
             c_note_text := c_note_text || ' ' || c2_rec.comments;
             if length(c_note_text) >= 240 then
                exit;
             end if;
         end loop;
      
        -- Insert into note_books
       begin
         insert into note_books (note_id, note)
          values    (c_note_id,
                     c_note_text);
          c_temp_cnt := 0;
        exception
         when others then
           c_err_msg := substr(sqlerrm,1,60);
           raise pgm_error;
        end;
      else
       c_note_id := null;
      end if;

*/

      c_stmt := 20;

      -- Insert values in Unit_attributes table for donation type
     c_don_type := 'R';
     c_attrib_code := null;
  /*
  
  if (nvl(c1_rec.draw_category_code,'AL')!= 'AL') then
         if c1_rec.draw_category_code='DI' then
           c_attrib_code := '07';
           c_don_type := 'D';
        elsif c1_rec.draw_category_code ='AD' then
         c_attrib_code := '00';
         c_don_type := 'S';
        elsif c1_rec.draw_category_code='TH' then
          c_attrib_code:='14';
          c_don_type:='T';
        end if;

  */

  If nvl(c1_rec.draw_category_code ,' ') in ('03','05','14','00','07') then 
     
         select audit_seq.nextval into l_audit_seq from dual;
          c_stmt := 22;
          insert into unit_attributes (   unit_id      ,
               coll_date   ,
               chapter_id   ,
               attrib_group   ,
               attrib_code   ,
               source_test_id   ,
               status_flag   ,
               stop_label_flag   ,
               insert_dats   ,
               insert_user_id   ,
               audit_key   ,
               program_id)
          values(   ltUnit_id,
                 nvl(trunc(c1_rec.coll_date),sysdate),
                 'WAD'      ,
                 'DON'      ,
                 c1_rec.draw_category_code  ,
                 null      ,
                 'O'      ,
                 'N'      ,
                 sysdate,
                 'CONVRT'   ,
                 audit_seq.nextval,
                 'SECOND');
   end if;

      -- Insert into Unit_attributes table for Pheresis donation
      
    If c1_rec.draw_category_code in ('09') then  
      c_stmt := 23;
      select audit_seq.nextval into l_audit_seq from dual;

      c_stmt := 24;
       insert into unit_attributes (   unit_id      ,
               coll_date   ,
               chapter_id   ,
               attrib_group   ,
               attrib_code   ,
               source_test_id   ,
               status_flag   ,
               stop_label_flag   ,
               insert_dats   ,
               insert_user_id   ,
               audit_key   ,
               program_id)
      values(   ltUnit_id,
               trunc(c1_rec.coll_date),
               'WAD'      ,
               'PHER'      ,
               'PP'   ,      -- Hard coding for the time being
               null      ,
               'O'      ,
               'N'      ,
               sysdate,
               'CONVRT'   ,
               audit_seq.nextval,
               'SECOND');
      end if;

      -- Get nextval for audit_seq
     c_stmt := 25;
     select audit_seq.nextval into l_audit_seq from dual;

      -- Check if the unit is in the trnslation table
       c_stmt := 30;

       insert into units ( 
            UNIT_ID      ,
            INSERT_DATS   ,
            AUDIT_KEY   ,
            PROGRAM_ID   ,
            COLL_DATE   ,
            CHAPTER_ID   ,
            DONOR_DECISION_CODE,
            BATCH_ID   ,
            DRIVE_ID   ,
            GROUP_SITE_ID   ,
            CONTRACT_ID   ,
            BAG_CODE   ,
            ADD_ON_BAGS   ,
            BLEED_START_TIME,
            BLEED_END_TIME    ,
            LOT_NUMBER   ,
            RECEIVED_DATE   ,
            OS_UNIT_ID,
            SYSTEM_LABEL_DECISION   ,
            QC_CHECKIN_FLAG      ,
            QC_CHECKIN_DATE      ,
            QC_LABEL_FLAG      ,
            QC_LABEL_DATE      ,
            COMPONENT_REVIEW_FLAG   ,
            LAB_DONOR_DATS       ,
            DONOR_LAB_DATS       ,
            NOTE_ID      )
     values (ltUnit_id,   ---c1_rec.unit_id      ,
            sysdate   ,
            l_audit_seq   ,
            'SECOND'      ,
            trunc(c1_rec.coll_date)   ,
            'WAD'         ,
            c_cue,
            'CONV000000'      ,
            '888888'   ,
            'G888888'  ,
            'INTERNAL'      ,
            c_bag_code      ,
            null         ,
            c1_rec.coll_date   ,
            c1_rec.coll_date+10/1440,
            c1_rec.lot_no         ,
            sysdate         ,
            szOSUnitID,   ---decode(c1_rec.import_flag,'Y',c1_rec.unit_id,null),
            c_blood_type      ,
            'Y'         ,
            c1_rec.coll_date+8/24   ,
            'Y'         ,
            c1_rec.coll_date+2/3   ,
            'Y'         ,
            sysdate         ,
            sysdate         ,
            c_note_id);

      -- Get nextval for audit_seq
     c_stmt := 31;
     select audit_seq.nextval into l_audit_seq from dual;


      -- Reset Note ID
      c_note_id := null;

     -- if cnt > 20 then

       -- commit; 
      ---- cnt := 0;
      --end if;

      commit;
 
--      set transaction use rollback segment BIG_RBS;

 End if; ---for ucount
    exception
      when pgm_error then
       --rollback to savepoint S1;
        c_item_id := c1_rec.unit_id;
       insert_error;
        if c_exit_flg = 'Y' then
         exit;
        end if;

      when others then
       --rollback to savepoint S1;
       c_err_msg := substr(sqlerrm,1,240);
        c_item_id := c1_rec.unit_id;
        insert_error;
        if c_exit_flg = 'Y' then
         exit;
        end if;
     end;
  end loop;
end;
/
