# MLT - [TICKET_NUMBER] - [Ticket Title]
<!--- 
Before creating your PR, ensure you followed the following steps to meet minimal requirements. Check them when verified.
--->

## 📘 Documentation / References
- BloodCenters API & UI PR Checklist: https://wellsky.atlassian.net/wiki/spaces/MBM/pages/2906554373/BloodCenters+API+and+UI+-+PR+Checklist
- Guideline: Chapter-wise Timezone Handling & DB Pattern: https://wellsky.atlassian.net/wiki/spaces/MBM/pages/2919760162/Guideline+Chapter-wise+Timezone+Handling+DB+Operations+Pattern

---

# PR Checklist

<details open>
<summary> Build & Tests</summary>

- [ ] Build succeeds (ng build)
- [ ] No linting errors (ng lint)
- [ ] All tests pass (npm test)
- [ ] Branch is up to date with Dev
- [ ] Tested on Chrome, Edge, Firefox

</details>

<details open>
<summary> Angular Code Standards</summary>

- [ ] Components use standalone: true
- [ ] Services use providedIn: 'root'
- [ ] Spec files created for new components/services
- [ ] No any types (use proper interfaces)
- [ ] RxJS subscriptions unsubscribed (takeUntil or async pipe)

</details>

<details open>
<summary> API & Constants</summary>

- [ ] API endpoints in api.constants.ts (not hardcoded)
- [ ] Routes in route.constants.ts
- [ ] Error handling with SnackbarService (not console.log)

</details>

<details open>
<summary> Forms & Validation</summary>

- [ ] Form validation uses Angular validators
- [ ] Error messages are user-friendly
- [ ] Submit button disabled when form invalid
- [ ] Required fields marked with (*)

</details>

<details open>
<summary> Code Quality</summary>

- [ ] No console.log() statements
- [ ] No commented-out code
- [ ] Business logic in services (not components)
- [ ] Proper TypeScript interfaces (no any)

</details>

<details open>
<summary> Security & Session</summary>

- [ ] Cookies use secure: true and sameSite: 'Strict'
- [ ] Chapter/warehouse/timezone data stored in cookies
- [ ] Cookies cleared on logout
- [ ] AuthInterceptor handles tokens

</details>

<details open open>
<summary>Accessibility (WCAG)</summary>

- [ ] Keyboard navigation works
- [ ] ARIA labels on form fields
- [ ] Focus indicators visible

</details>

<details open>
<summary>🚀 Final Checks</summary>

- [ ] npm run lint
- [ ] npm test
- [ ] ng build --configuration=production

</details>

<details open>
<summary>💡 Quick Reference (Naming & Constants)</summary>

Components → `component-name.ts`; Services → `service-name.service.ts`; API → `api.constants.ts`; Routes → `fcn-route-map.ts`, `route-registry.ts`, `route-keys.ts`

</details>

---

<details open>
<summary>📝 Description</summary>

<!-- Provide a concise summary of the changes. Editable in the PR -->

</details>

<details open>
<summary>🔗 Related Issue</summary>

<!-- Link the Jira/Ticket number or related issue here. Editable in the PR -->

</details>

<details open>
<summary>🧪 Testing Notes</summary>

<!-- Include testing steps, environments, or special notes. Editable in the PR -->

</details>

<details open>
<summary>📷 Screenshots (if applicable)</summary>

<!-- Add screenshots or recordings if relevant. Editable in the PR -->

</details>