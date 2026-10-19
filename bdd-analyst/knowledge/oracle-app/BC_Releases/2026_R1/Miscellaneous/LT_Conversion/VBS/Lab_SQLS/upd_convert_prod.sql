update convert_products set convert_flag='Z' where
convert_flag is null
/
update convert_products set convert_flag='9' where
convert_flag='S' and shipped_to is null
/

