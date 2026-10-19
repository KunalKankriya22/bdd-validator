---
tags:
  - package
  - SBCSYS
---
# DEL_ATTRIBUTE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE  Del_attribute
AS
   TYPE TAB1 IS
   TABLE OF VARCHAR2(9)
   INDEX BY BINARY_INTEGER;

   PROCEDURE split(p_FORMULA    in  varchar2,
                   p_PROD_CODE  in  varchar2,
                   p_split_table IN OUT TAB1,
                   p_no_of_elements OUT number);
   PROCEDURE Sort(p_Sort_table  IN OUT TAB1,
                  p_Size_of_table number);
   PROCEDURE add_attribute(p_product_code varchar2,
                          p_attribute_to_add varchar2,
                          p_new_product_code out varchar2 ,
                          p_final_formula out varchar2,
                          p_product_type in varchar2 := null ,
                          p_delete_attribute in varchar2 := null);
   PROCEDURE Delete_product_attribute (P_unit_id varchar2,
                          p_coll_date date,
                          p_chapter_id varchar2,
                          p_user_id varchar2,
                          p_program_id varchar2,
                          P_product_code varchar2,
                          P_attrib_code varchar2,
                          P_update_flag varchar2,
                          P_new_product_code out varchar2,
                          P_new_product_formula out varchar2);
END;
```
