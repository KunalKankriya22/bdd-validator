---
module: Donor
sub_module: "Donor Queries & Search"
title: "Donor Details Query"
mnemonic: dpqdrdtl
tags:
  - screen
  - donor
  - donor-queries-and-search
---

# dpqdrdtl — Donor Details Query

**Module:** [[Donor]] > [[Donor Queries & Search]]

## Database Tables

- [[central_notes]]
- [[DONOR_INTERDICTIONS]]
- [[DONOR_LETTERS]]
- [[DONORS]]
- [[merge_hold_units]]
- [[MERGe_hold_units]]
- [[MERGED_DONOR_INTERDICTIONS]]
- [[MERGED_DONORS]]
- [[POTENTIAL_DUPLICATES]]
- [[select vd.chapter_id]]
- [[vd.donation_type]]
- [[vd.procedure_code]]
- [[vp.sort_sequence &amp;#10;  from valid_donproc_codes vd]]
- [[valid_proc_codes vp &amp;#10; where vd.donation_type = 'AL' and&amp;#10;       vd.procedure_code = vp.procedure_code and&amp;#10;       vp.sort_sequence &lt; 100 and&amp;#10;       sysdate between vp.eff_date and nvl(vp.term_date]]
- [[sysdate+1) and&amp;#10;       sysdate between vd.eff_date and nvl(vd.term_date]]
- [[sysdate+1) &amp;#10;]]

## Opens/Navigates To

- [[dpwaaddr]]
- [[dpwiaddr]]
