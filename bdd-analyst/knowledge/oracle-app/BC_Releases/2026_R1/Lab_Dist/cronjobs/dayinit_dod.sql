DECLARE

  cursor c1 is
  select chapter_id, time_zone
    from chapters
   where sysdate between eff_date and nvl(term_date, sysdate + 1);

   v_local_time     date; 
   
   procedure update_chapters (pl_chapter_id  in varchar2, 
                              pl_batch_seq   in number,
                              pl_tb_seq      in number,
                              pl_ws_seq      in number,
                              pl_sdc_ws_seq  in number,
                              pl_test_kit_seq in number,
                              pl_work_num_seq in number, 
                              pl_pool_seq     in number) is
  Begin

    update chapters
      set batch_seq = pl_batch_seq,
       tb_seq = pl_tb_seq,
       ws_seq = pl_ws_seq,
       sdc_ws_seq = pl_sdc_ws_seq,
       work_number_seq = pl_work_num_seq,
       pool_seq = pl_pool_seq,
       program_id = 'DAYINIT'
      where chapter_id = pl_chapter_id;
  
  End update_chapters;

BEGIN

  FOR c1rec in c1 LOOP
    
     Begin
      select sysdate + (substr(c1rec.time_zone,1,1)||'1') *
                       to_dsinterval('0 '||substr(c1rec.time_zone,2,5)||':00')
        into v_local_time
        from dual;
    End; 

    IF to_char(v_local_time, 'HH24:MI') = '00:00' then

      begin
       If c1rec.chapter_id='BAG' then 
           update_chapters('BAG',0,4400,5800,4400,2200,0,0);

       Elsif c1rec.chapter_id='BAL' then
              update_chapters('BAL',0,4600,6000,4600,2300,0,0);

       Elsif c1rec.chapter_id='BEN' then
              update_chapters('BEN',0,200,200,200,100,0,0);

       Elsif c1rec.chapter_id='BLI' then
              update_chapters('BLI',0,400,400,400,200,0,0);

       Elsif c1rec.chapter_id='BRG' then
              update_chapters('BRG',0,600,600,600,300,0,0);

       Elsif c1rec.chapter_id='EURL' then
              update_chapters('EUR',0,800,800,800,400,0,0);

       Elsif c1rec.chapter_id='GOR' then
              update_chapters('GOR',0,1000,1000,1000,500,0,0);

       Elsif c1rec.chapter_id='GRE' then
              update_chapters('GRE',0,1200,1200,1200,600,0,0);

       Elsif c1rec.chapter_id='GUA' then
              update_chapters('GUA',0,1400,1600,1400,700,0,0);

       Elsif c1rec.chapter_id='HOO' then
              update_chapters('HOO',0,1600,2000,1600,800,0,0);

       Elsif c1rec.chapter_id='KAN' then
              update_chapters('KAN',0,4800,6200,4800,2400,0,0);

       Elsif c1rec.chapter_id='KEE' then
              update_chapters('KEE',0,1800,2200,1800,900,0,0);

       Elsif c1rec.chapter_id='LAC' then
              update_chapters('LAC',0,2000,2400,2000,1000,0,0);

       Elsif c1rec.chapter_id='LEJ' then
              update_chapters('LEJ',0,2200,2600,2200,1100,0,0);

       Elsif c1rec.chapter_id='LEW' then
              update_chapters('LEW',0,2400,3000,2400,1200,0,0);

       Elsif c1rec.chapter_id='MCG' then
              update_chapters('MCG',0,2600,3200,2600,1300,0,0);

       Elsif c1rec.chapter_id='OKI' then
              update_chapters('OKI',0,2800,3400,2800,1400,0,0);

       Elsif c1rec.chapter_id='POR' then
              update_chapters('POR',0,3000,3800,3000,1500,0,0);

       Elsif c1rec.chapter_id='SAM' then
              update_chapters('SAM',0,3200,4200,3200,1600,0,0);

       Elsif c1rec.chapter_id='SAN' then
              update_chapters('SAN',0,3400,4400,3400,1700,0,0);

       Elsif c1rec.chapter_id='TRA' then
              update_chapters('TRA',0,3600,4800,3600,1800,0,0);

       Elsif c1rec.chapter_id='TRI' then
              update_chapters('TRI',0,3800,5000,3800,1900,0,0);

       Elsif c1rec.chapter_id='WAL' then
              update_chapters('WAL',0,4000,5200,4000,2000,0,0);

       Elsif c1rec.chapter_id='WPA' then
              update_chapters('WPA',0,4200,5600,4200,2100,0,0);

       End If;
      end;
    END IF;
  End loop;

--  commit;
END;
--/
--commit
--/
--exit
