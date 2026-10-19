---
tags:
  - procedure
  - SRVSYS
---
# GEN_ORDER_NO

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Type**: FUNCTION

## Dependencies

- DBMS_OUTPUT (SYNONYM in PUBLIC)
- NUMBER_GENERATION (SYNONYM in PUBLIC)
- [[schemas/SRVSYS/Tables/ORDERS|ORDERS]] (TABLE)
- STANDARD (PACKAGE in SYS)
- SYS_STUB_FOR_PURITY_ANALYSIS (PACKAGE in SYS)

## Source Code

```plsql
FUNCTION              "GEN_ORDER_NO" (p_chapter_id in varchar2,
					p_order_number out varchar2)
return varchar2	as
    todays_date	  varchar2(6);
    temp_number   number;
	temp_count    number;
begin
-- 	This procedure generates a new order number for a chapter.
--
-- 	The parameters are
--			1 -	Chapter ID (Input)
--			2 -	Order No (Output)
--
-- 	generate new order number in the format YYDDD-9999 where
--	YYDDD is the date of order generation in julian format and 9999 is the
--  running serial for the day.
--
	todays_date := to_char(sysdate,'yyddd-');
--
--  The following row lock is to prevent concurrent users from generating
--  same order number. Since there is a row lock on the table it is
--  recommended that calling of this function may be immediately followed by
--  a COMMIT in the calling routine.
--
    --
    select max_number+1 into temp_number
    from   number_generation
    where  chapter_id  = p_chapter_id
      and  number_type = 'ORDER_NO'
    for update of max_number;
    --
	-- check if already exists
	select count(*)
	into temp_count
	from orders
	where chapter_id = p_chapter_id
	  and order_no = todays_date || lpad(to_char(temp_number),4,'0');
    if temp_count > 0
	then
	   select max(to_number(substr(order_no,7)))+1
	   into temp_number
	   from orders
	   where chapter_id = p_chapter_id
		 and order_no like todays_date||'%';
	end if;
    --
    -- generate new order number
    p_order_number := todays_date || lpad(to_char(temp_number),4,'0');
	--
    --
    update number_generation
    set    max_number  = temp_number
    where  chapter_id  = p_chapter_id
      and  number_type = 'ORDER_NO';
	--
    return('SUCCESS');
    exception
	when others
	then
	    dbms_output.put_line('Problem with procedure gen_order_number');
	    return('FAIL');
end;

```
