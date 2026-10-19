---
module: Donor
sub_module: "Blood Drives & Scheduling"
title: "Create/Modify Mobile Drives"
mnemonic: mcimobdr
tags:
  - screen
  - donor
  - blood-drives-and-scheduling
---

# mcimobdr — Create/Modify Mobile Drives

**Module:** [[Donor]] > [[Blood Drives & Scheduling]]

## Database Tables

- [[CENTRAL_NOTES]]
- [[DRIVE_ESTIMATED_RESOURCES]]
- [[DRIVE_FACILITIES]]
- [[DRIVE_SPONSORS]]
- [[drives]]
- [[DRIVES]]
- [[TEMP_DRIVE_SPONSORS]]
- [[TEMP_DRIVES]]

## Dropdown/LOV Sources
Values in dropdowns on this screen come from:

- [[DRIVE_SPONSORS]]
- [[EMPLOYEES]]
- [[LOCATIONS]]
- [[SPONSOR_CONTACTS]]
- [[SPONSORS]]
- [[SYSTEM_USERS]]
- [[TEMP_DRIVE_SPONSORS]]
- [[TEMP_DRIVES]]
- [[VALID_MASTER_CODES]]
- [[VALID_RESOURCES]]
- [[VALID_USER_ACCESS_CLASSES]]
- [[VALID_USER_PRIVS]]

## Opens/Navigates To

- [[mcqdrive]]
- [[mrqspall]]

## Called By
These screens open this form:

- [[mrqrecdr]]
- [[mrqspter]]
