SET SERVEROUTPUT ON;

declare
   lv_status   varchar2(2000);
   p_status    varchar2(2000);
   szextapplid varchar2(10) := 'DON';
   nconvcount  number := 0;
   procedure process_donation_interdictions (
      p_upload_id in varchar2,
      pl_status   out varchar2
   ) as

      cursor api_cur (
         p_trn_mode varchar2
      ) is
      select transaction_id,
             chapter_id,
             inter_code,
             inter_type,
             source_code,
             release_user,
             release_date,
             unit_id,
             term_reason,
             term_date,
             group_id,
             originated_from,
             reason_code,
             group_mode,
             program_id,
             insert_user,
             insert_date,
             coll_date,
             comments,
             audit_key
        from api_donation_interdictions
       where lt_upload_date is null
         and upload_id = p_upload_id
         and transaction_mode = 'I';

      szdonorid    varchar2(10);
      p_err_flag   varchar2(1);
      p_err_msg    varchar2(240);
      ncount       number := 0;
      nactkey      number;
      sztransid    varchar2(10);
      nauditkey    number := 0;
      log_and_exit exception;
      skip_record exception;
      ninter       number := 0;
      type t_row_type is
         table of donation_interdictions%rowtype index by pls_integer;
      lt_api_rows  t_row_type;
      lt_main_rows t_row_type;
      main_row     donation_interdictions%rowtype;
   begin
      pl_status := 'OK';
      select transaction_id,
             chapter_id,
             inter_code,
             inter_type,
             source_code,
             release_user,
             release_date,
             unit_id,
             term_reason,
             term_date,
             group_id,
             originated_from,
             reason_code,
             group_mode,
             program_id,
             insert_user,
             insert_date,
             coll_date,
             comments,
             audit_key
      bulk collect
        into lt_api_rows
        from api_donation_interdictions
       where lt_upload_date is null
         and upload_id = p_upload_id
         and transaction_mode = 'I';

      for indx in 1..lt_api_rows.count loop
         begin
            main_row := lt_api_rows(indx);
          --check if the interdiction is valid

            select nvl(
               count(*),
               0
            )
              into ninter
              from valid_interdictions
             where inter_code = main_row.inter_code
               and sysdate between eff_date and nvl(
               term_date,
               sysdate + 1
            );

            if ninter = 0 then
               p_status := main_row.inter_code || ' is not valid';
               raise skip_record;
            end if;


            select nvl(
               count(*),
               0
            )
              into nconvcount
              from api_upload_conversion
             where id_type = 'ADTID'
               and temp_audit_key = main_row.audit_key;

            if nconvcount > 0 then
               p_status := 'This DONATION INTER is already uploaded-' || main_row.audit_key;
               raise skip_record;
            else
              --generate LT audit key

               select audit_seq.nextval
                 into nauditkey
                 from dual;

               main_row.audit_key := nauditkey;
               insert into api_upload_conversion (
                  ext_temp_id,
                  lifetrak_perm_id,
                  id_type,
                  temp_audit_key,
                  perm_audit_key,
                  source_id,
                  insert_date
               ) values ( null,
                          null,
                          'ADTID',
                          main_row.audit_key,
                          nauditkey,
                          szextapplid,
                          sysdate );

              --get the actual transaction id from the conversion table

               if main_row.transaction_id is not null then
                  begin
                     select lifetrak_perm_id
                       into sztransid
                       from api_upload_conversion
                      where ext_temp_id = main_row.transaction_id
                        and id_type = 'TRNID'
                        and rownum = 1; --V08 (OLD) -- V13;
                  exception
                     when no_data_found then
                        begin
                           select transaction_id
                             into sztransid
                             from donations
                            where transaction_id = main_row.transaction_id;
                        exception
                           when no_data_found then
                              p_status := 'Cannot locate record-Error 23 ' || sqlerrm;
                        --rollback_and_exit(Z1.data_source,p_status);
                              raise skip_record;
                        end;
                  end;
               end if;

               main_row.transaction_id := sztransid;
               p_status := null;
               insert into donation_interdictions values main_row;

            --   add_error_log(Z1.data_source,
            --                 'Created DONATION INTERDICTIONS :' ||
            --                 Z1.transaction_id || '-' || szTransID);

            end if; --for nConvCount

            update api_donation_interdictions
               set lt_upload_date = sysdate,
                   lt_upload_status = 'S'
             where audit_key = lt_api_rows(indx).audit_key
               and upload_id = p_upload_id;

         exception
            when skip_record then
               update api_donation_interdictions
                  set lt_upload_date = sysdate,
                      lt_upload_status = 'F'
                where audit_key = lt_api_rows(indx).audit_key
                  and upload_id = p_upload_id;
            -- add_error_log(Z1.data_source, p_status);
               dbms_output.put_line('Skip record- donation inter: ' || p_status);
         end;

      --COMMIT; -- SCR 177143 - Commiting transaction at a record by record level.

      end loop;





   exception
      when others then
         pl_status := sqlerrm;
         dbms_output.put_line('donation inter: other :' || pl_status);
   end process_donation_interdictions;

begin
   process_donation_interdictions(
      '102_030725143524_IBC',
      lv_status
   );
   dbms_output.put_line('Status: ' || lv_status);
end;

commit;