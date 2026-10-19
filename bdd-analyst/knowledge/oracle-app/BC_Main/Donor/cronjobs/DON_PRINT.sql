	set heading off
	set pages 0
	set feedback off
	set verify off
	set echo on
	set flush off
	set trimspool on
	set embedded on
        set termout off
        column line1 fold_b 1
        column line2 fold_b 1
        column line3 fold_b 1
        column line4 fold_b 1
        spool &1

	update print_request_queue set printed_date=
          to_date('&1','MMDDYYHH24MISS') ;


	select 'lp -onb '||decode(form_type,'COMPRESSED', '-ocpi=18','NORMAL', '-ocpi=11','LANDSCAPE','-olandscape','LANDCOMP', '-ocpi=18 -olandscape')||' -n'||nvl(to_char(no_of_copies),1)||' -d'||printer_name||' /home/reports/'||file_name line3
        from print_request_queue
	where printed_date=to_date('&1','MMDDYYHH24MISS') 
	order by request_date asc;


	delete print_request_queue where printed_date=
        to_date('&1','MMDDYYHH24MISS') ;

	commit;
	exit
