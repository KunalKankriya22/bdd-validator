---
tags:
  - package
  - DONSYS
---
# DOD_DONOR_INFO

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
package DOD_DONOR_INFO is
/* ************************************************************
  This is to extract DOD donor information from the string
  sent to LifeTrak.

  Created By        : Kishore Gummadi
  Date Of Creation  : 02/15/2011
  Version           : [01] Kishore                    
                      [02] Ashok    Issue: unable to parse data based on line feeds as forms is not reading linefeeds.
		                    Modified logic to look for value betweeen data identifiers.
                      [03] Ashok    CAC Card identifier string length modified to be in 88, 89, 90
                      [04] Ashok    MLT-4322: extract_cac_pdf417 updated to rewrite 1Type, NType and added MType (no changes to out parameters)

  *****************************************   */
  procedure GET_RETURN_VALUE(p_display_value in  varchar2,
				     p_return_value  out number,
				     p_status        out varchar2);

  procedure CONVERT_BASE32_TO_ASCII(p_base32   in  varchar2,
						p_ascii    out varchar2,
					      p_status   out varchar2);

  procedure EXTRACT_CAC_PDF417_OLD( p_string              in  varchar2,
                                    p_bar_code_ver_code   out varchar2,
                                    p_pdi                 out varchar2,
                                    p_pd_type_code        out varchar2,
                                    p_edipi               out varchar2,
                                    p_first_name          out varchar2,
                                    p_surname             out varchar2,
                                    p_dob                 out date,
                                    p_personnel_cat_code  out varchar2,
                                    p_branch_code         out varchar2,
                                    p_pect                out varchar2,
                                    p_rank                out varchar2,
                                    p_pay_plan_code       out varchar2,
                                    p_pay_plan_grade_code out varchar2,
                                    p_card_issue_date     out date,
                                    p_card_exp_date       out date,
                                    p_card_inst_idt       out varchar2,
                                    p_status              out varchar2);

  procedure EXTRACT_CAC_PDF417( p_string              in  varchar2,
                                p_bar_code_ver_code   out varchar2,
                                p_pdi                 out varchar2,
                                p_pd_type_code        out varchar2,
                                p_edipi               out varchar2,
                                p_first_name          out varchar2,
                                p_surname             out varchar2,
                                p_dob                 out date,
                                p_personnel_cat_code  out varchar2,
                                p_branch_code         out varchar2,
                                p_pect                out varchar2,
                                p_rank                out varchar2,
                                p_pay_plan_code       out varchar2,
                                p_pay_plan_grade_code out varchar2,
                                p_card_issue_date     out date,
                                p_card_exp_date       out date,
                                p_card_inst_idt       out varchar2,
                                p_status              out varchar2);


  procedure EXTRACT_CAC_CODE39(p_string              in  varchar2,
				 	 p_ssn                 out varchar2,
				 	 p_alt_id              out varchar2,
                               p_status              out varchar2);

  procedure EXTRACT_AAMVA_PDF417(p_string			in  varchar2,
					   p_ssn			out varchar2,
                                 p_last_name		out varchar2,
                                 p_first_name         out varchar2,
                                 p_mid_name           out varchar2,
                                 p_dob                out date,
                                 p_sex                out varchar2,
                                 p_height             out varchar2,
                                 p_alt_id             out varchar2,
                                 p_alias              out varchar2,
                                 p_suffix             out varchar2,
                                 p_ethnic_grp         out varchar2,
                                 p_street             out varchar2,
                                 p_apt_suite          out varchar2,
                                 p_city               out varchar2,
                                 p_state              out varchar2,
                                 p_zip                out varchar2,
                                 p_country            out varchar2,
                                 p_status             out varchar2);

  procedure EXTRACT_CREDIT_CARD;

  procedure EXTRACT_AAMVA_MAG_STRIPE;

  procedure DETERMINE_STR_TYPE(p_string          in  varchar2,
                               p_string_type	 out varchar2,
                               p_status          out varchar2);

  procedure EXTRACT_DONOR_DATA(p_string          in  varchar2,
                               p_string_type     out varchar2,
                               p_last_name       out varchar2,
                               p_first_name      out varchar2,
                               p_dob             out date,
                               p_ssn             out varchar2,
                               p_sex             out varchar2,
                               p_alt_id          out varchar2,
                               p_alt_type        out varchar2,
                               p_addr1           out varchar2,
                               p_addr2           out varchar2,
                               p_addr3           out varchar2,
                               p_city            out varchar2,
                               p_state           out varchar2,
                               p_zip             out varchar2,
                               p_country         out varchar2,
                               p_status          out varchar2);

  procedure SET_DEBUG_ON;

  procedure SET_DEBUG_OFF;
end DOD_DONOR_INFO;

```
