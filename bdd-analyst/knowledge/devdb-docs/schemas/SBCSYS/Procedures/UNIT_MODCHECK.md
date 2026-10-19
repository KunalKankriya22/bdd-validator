---
tags:
  - procedure
  - SBCSYS
---
# UNIT_MODCHECK

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Type**: FUNCTION

## Dependencies

- STANDARD (PACKAGE in SYS)

## Source Code

```plsql
FUNCTION              "UNIT_MODCHECK" (P_unit_id IN Varchar2) return varchar2

IS
   temp_v_len	number :=0;
   temp_v_chr	varchar2(1);
   temp_n_A		Number :=0;
   temp_n_check_value Number:=0;
   temp_n_Si		Number:=0;
   temp_v_unit_id  varchar2(15) := P_unit_id;
   v_chk_digit varchar2(15) := '';
BEGIN
  temp_v_len := NVL(LENGTH ( p_unit_id ), 0) ;
  if temp_v_len > 7 then
    FOR I in 1 .. temp_v_len LOOP
      temp_v_chr := SUBSTR(temp_v_unit_id,I,1);
      IF ( LTRIM(temp_v_chr,'0987654321') IS  NULL )  THEN
        temp_n_A := ASCII( temp_v_chr) - 48;
      ELSIF ( temp_v_chr = '*' ) THEN
         temp_n_A := 36;
      ELSE
         temp_n_A := ASCII(temp_v_chr) - 55;
      END IF;
      temp_n_Si := MOD(((temp_n_Si+temp_n_A)*2),37);
   END LOOP;
   temp_n_check_value :=MOD((38-temp_n_Si),37);
   -- based on the check_value get the decoded value from the
   v_chk_digit := SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*',
                         temp_n_check_value+1,1);
   v_chk_digit := '-' || v_chk_digit;
 end if;
 return P_unit_id||v_chk_digit;
EXCEPTION when others then return P_unit_id;
END;

```
