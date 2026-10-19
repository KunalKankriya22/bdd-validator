/*
*************************************************************************
Ver: 02	05/18/2022	
    1) RSM_REPORT.POP_RSM_TABLE parameters updated.
	2) lt_user_session.set_chapter_id call added(to show the log file report in print screen)
Ver: 03 04/26/2023 : Do not generate RSM Report if unit count is 0.    
Ver: 04 05/03/2023 : abort flag check added
*************************************************************************
*/
declare
  cursor c1 is
  select * 
    from rgt_schedule_extract
   where nvl(status, '*') != 'C';

 ---- SCR 19037
  cursor c2(p_parm_id VARCHAR2) is
  select user_name
    from rpt_parm
   where parm_id = p_parm_id;
  --
  
  t_chapter_local_time  date;
  t_pp_id               varchar2(4);
  t_status              varchar2(200);
  t_err_msg             varchar2(300);
  t_user_name	        varchar2(50); -- SCR 19037
  exit_program          exception;
  unit_cnt              NUMBER;
  lv_abort_flag         VARCHAR2(1);
  ln_rsm_units_cnt      NUMBER;
begin
  for c1rec in c1 loop
    t_chapter_local_time := lifetrack_timezone_convert.get_local_time(c1rec.chapter_id, sysdate);
    lt_user_session.set_chapter_id(c1rec.chapter_id);
    t_status := null;

    if t_chapter_local_time >= c1rec.extract_date_time then
      begin
        select to_char(systimestamp, 'SSFF2') 
          into t_pp_id
          from dual;
      end;

      rgprextr.main_program(c1rec.result_parm_id,
                            c1rec.chapter_id,
                            c1rec.contract_id,
                            t_pp_id,
                            t_status);

      if t_status is not null then
        t_err_msg := 'Error in RGPREXTR package - ' || t_status;
        raise exit_program;
      else
        begin
          update rgt_schedule_extract
             set status = 'C'
           where file_name = c1rec.file_name
             and extract_date_time = c1rec.extract_date_time
             and chapter_id = c1rec.chapter_id
             and contract_id = c1rec.contract_id
             and result_parm_id = c1rec.result_parm_id;
        exception
          when others then
            t_err_msg := 'Error while updating the RGT_SCHEDULE_EXTRACT for parm ID ' || c1rec.result_parm_id;
            raise exit_program;
        end;
      end if;

      commit;

      -- 08/20/2015 SCR 19037
      -- Generate RSM report.
      IF NVL(c1rec.gen_report,'N') = 'Y' THEN

			-- V14 (this table gets populated in RGPREXTR pkg)
		  BEGIN
            SELECT NVL(unit_count,0), NVL(abort_flag,'N') INTO unit_cnt , lv_abort_flag
              FROM rgt_result_parms
             WHERE result_parm_id = c1rec.result_parm_id
               AND chapter_id = c1rec.chapter_id
               AND contract_id = c1rec.contract_id
               AND ROWNUM = 1; -- unit cnt will be the same on all the batches. Pick any one record.	
		  EXCEPTION
		  	WHEN OTHERS THEN
		  		unit_cnt := 0;
                lv_abort_flag := 'N';
		  END;
		  --------------------------------          
   
        IF unit_cnt <> 0 THEN
            OPEN c2(c1rec.report_id);
            FETCH c2 INTO t_user_name;
            CLOSE c2;
      
            IF t_user_name IS NOT NULL THEN	
              lt_user_session.set_userid(t_user_name); 
            END IF;      
          
            rsm_report.pop_rsm_table
              (
                 c1rec.result_parm_id
                ,c1rec.chapter_id
                ,c1rec.report_id
              );
        ELSIF unit_cnt = 0 AND lv_abort_flag <> 'Y' THEN          
            OPEN c2(c1rec.report_id);
            FETCH c2 INTO t_user_name;
            CLOSE c2;
      
            IF t_user_name IS NOT NULL THEN	
              lt_user_session.set_userid(t_user_name); 
            END IF;      
          
            rsm_report.pop_rsm_table
              (
                 c1rec.result_parm_id
                ,c1rec.chapter_id
                ,c1rec.report_id
              );  
              
			  SELECT COUNT(1) INTO ln_rsm_units_cnt
			    FROM rsm_report_details
			   WHERE report_id = c1rec.report_id
			     AND result_parm_id = c1rec.result_parm_id;
			  
			   IF ln_rsm_units_cnt = 0 THEN
			   	  DELETE FROM rpt_parm WHERE parm_id = c1rec.report_id;
                    COMMIT;
			   END IF;              
        ELSE
            delete from rpt_parm where parm_id = c1rec.report_id;
            COMMIT;            
        END IF;
        
      END IF;
      ---

    end if;
  end loop;
exception
  when exit_program then
    dbms_output.put_line(t_err_msg);
end;
/

