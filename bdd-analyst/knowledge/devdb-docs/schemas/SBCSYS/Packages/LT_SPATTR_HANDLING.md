---
tags:
  - package
  - SBCSYS
---
# LT_SPATTR_HANDLING

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "LT_SPATTR_HANDLING" as
   /*4.01.02*/
   procedure ADD_SPATR_INTER(pUnit     in varchar2,
                             pCollDate in date,
                             pChapter  in varchar2,
                             pProd     in varchar2,
                             pShip     in varchar2 DEFAULT NULL);

   procedure DEL_SPATR_INTER(pUnit     in varchar2,
                             pCollDate in date,
                             pChapter  in varchar2,
                             pProd     in varchar2,
                             pCheck    in varchar2);

   function GET_HOLD return varchar2;

   function insert_inter (p_unit_id varchar2,
               p_coll_date date,
             p_chapter_id varchar2,
             p_inter_code varchar2,
             p_product_code varchar2 ,
             p_program_id varchar2  ) return VARCHAR2;

   procedure Log_Err(pgm_id in varchar2,
                     stmt_id in varchar2,
                     err_cd  in varchar2,
                     err_txt in varchar2);
end;

```
