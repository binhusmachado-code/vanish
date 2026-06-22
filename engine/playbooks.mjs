/**
 * VANISH broker opt-out playbooks.
 *
 * One object per broker, faithfully adapted from references/site-playbooks.md.
 * Ordered by friction: easiest (fewest gates) first, hardest last. The engine
 * walks these in array order so the operator clears the cheap wins before the
 * grind (Whitepages phone call, Intelius 15-minute window, etc.).
 *
 * IMPORTANT: brokers 403 automated fetchers and change their markup often.
 * Treat `steps` button labels and field layouts as EXPECTED, not guaranteed —
 * the engine auto-fills best-effort and the human finishes whatever it can't.
 *
 * @typedef {object} Playbook
 * @property {string} id              kebab-case stable id (matches screenshot dir + dashboard)
 * @property {string} name           human display name
 * @property {string} optOutUrl      where the opt-out flow starts
 * @property {boolean} findListingFirst  must locate/select a listing before opting out
 * @property {'email'|'phone-call'|'captcha+email'|'email+second-code'} verification
 * @property {'none'|'checkbox'|'recaptcha'|'hcaptcha'|'stacking'|'two-gates'} captcha
 * @property {string|null} expiryWindow  verification-link / session time-box, if any
 * @property {string|null} network   sister-site family note, if relevant
 * @property {string[]} requiredFields  what the form needs from the customer
 * @property {string[]} steps        human-readable procedure (the opt-out walkthrough)
 * @property {string} processing     realistic time-to-removal after submission
 * @property {string} notes          gotchas, dark patterns, relisting, support lines
 */

/** @type {Playbook[]} */
export const PLAYBOOKS = [
  // ---- Tier 1: lowest friction (single email link, little/no CAPTCHA) ----
  {
    id: "nuwber",
    name: "Nuwber",
    optOutUrl: "https://nuwber.com/removal/link",
    findListingFirst: true,
    verification: "email",
    captcha: "none",
    expiryWindow: null,
    network: null,
    requiredFields: ["profileUrl", "email"],
    steps: [
      "Search yourself on nuwber.com (name + location, phone, address, or email).",
      "Open your record and copy the profile URL.",
      "On /removal/link, paste the profile URL, then click Opt Out.",
      "Enter the verification email, then click Remove.",
      "Open the confirmation email (usually <1 min; check spam) and click Confirm Request.",
    ],
    processing: "Often <24 h, up to ~48 h.",
    notes:
      "Per-URL: common names / old addresses create multiple listings, each its own URL — opt out of each. No CAPTCHA reported. Support: (844) 912-1292.",
  },
  {
    id: "truepeoplesearch",
    name: "TruePeopleSearch",
    optOutUrl: "https://www.truepeoplesearch.com/removal",
    findListingFirst: true,
    verification: "email",
    captcha: "checkbox",
    expiryWindow: null,
    network: "Sister of FastPeopleSearch (same operator, separate opt-out). The .info/.net/.io TLD copies each need their own opt-out.",
    requiredFields: ["email", "firstName", "lastName", "city", "state"],
    steps: [
      "Open /removal. Enter the email, tick the agreement box, pass the 'I am human' check, click Begin Removal.",
      "A search opens — search by first name, last name, city, state.",
      "Find the listing, click View Details.",
      "Scroll the record, click Remove This Record.",
      "Open the confirmation email and click the verification link to finalize.",
    ],
    processing: "~72 h best case, ~1–2 weeks realistic.",
    notes:
      "Multiple listings each need a separate submission (same email is fine). Relisting is common — recheck periodically.",
  },
  {
    id: "usphonebook",
    name: "USPhonebook",
    optOutUrl: "https://www.usphonebook.com/opt-out",
    findListingFirst: true,
    verification: "email",
    captcha: "recaptcha",
    expiryWindow: "~24 h verification link",
    network: "Often grouped with Spokeo but no confirmed shared opt-out — treat as separate.",
    requiredFields: ["email", "firstName", "lastName", "city", "state"],
    steps: [
      "Open /opt-out, check both consent boxes, enter the email.",
      "Complete the reCAPTCHA.",
      "Search by name + city/state (or phone/address).",
      "Open your listing, then click Remove Record.",
      "Open the email and click the removal link (expires ~24 h).",
    ],
    processing: "Within 72 h (sometimes ~12 h).",
    notes: "Support: (888) 747-4095. Verification link is time-boxed — finish the same day.",
  },
  {
    id: "beenverified",
    name: "BeenVerified",
    optOutUrl: "https://www.beenverified.com/app/optout/search",
    findListingFirst: true,
    verification: "email",
    captcha: "checkbox",
    expiryWindow: "~48 h verification link",
    network:
      "The Lifetime Value Co. family — PeopleLooker, NeighborWho, Ownerly, NumberGuru, Bumper, PeopleSmart likely need separate opt-outs (sources conflict; opt out of each and verify).",
    requiredFields: ["fullName", "state", "email"],
    steps: [
      "Reach the opt-out via the homepage footer 'Do Not Sell or Share My Personal Information' (most reliable path).",
      "Search full name + state.",
      "Click Opt Out / Proceed to Opt Out next to your record.",
      "Enter the email, complete the 'I am human' check.",
      "Open the email within ~5 min (link expires ~48 h) and click the green Verify Opt-Out.",
    ],
    processing: "24–72 h (sometimes up to ~7 business days).",
    notes:
      "One opt-out per email address — multiple listings may need emailing them directly. No profile-URL paste (you select from results).",
  },
  {
    id: "spokeo",
    name: "Spokeo",
    optOutUrl: "https://www.spokeo.com/optout",
    findListingFirst: true,
    verification: "email",
    captcha: "recaptcha",
    expiryWindow: null,
    network:
      "No sister network, but Spokeo creates MULTIPLE profiles per person (name variants, different emails/addresses) — each profile URL is its own opt-out.",
    requiredFields: ["profileUrl", "email"],
    steps: [
      "Search your name (refine by email/phone/address), open the matching profile, copy its URL.",
      "On /optout, scroll to the form (oddly labeled 'opt out your information').",
      "Paste the profile URL and the email.",
      "Complete the reCAPTCHA, then click Opt Out.",
      "Open the email and click the verification link.",
      "Recheck the saved URL after 24–72 h for 'No Results Found.'",
    ],
    processing: "24–72 h.",
    notes:
      "Multiple profiles per person — each URL is a separate opt-out. Re-lists every ~3–6 months. Use an alias email to dodge marketing.",
  },

  // ---- Tier 2: stacking CAPTCHAs / two gates / tight windows ----
  {
    id: "fastpeoplesearch",
    name: "FastPeopleSearch",
    optOutUrl: "https://www.fastpeoplesearch.com/removal",
    findListingFirst: true,
    verification: "email",
    captcha: "stacking",
    expiryWindow: null,
    network: "Sister of TruePeopleSearch (same operator, separate opt-out).",
    requiredFields: ["email", "firstName", "lastName", "city", "state"],
    steps: [
      "Open /removal. Enter the email, tick the terms box, complete the CAPTCHA, click Begin Removal Process.",
      "Enter full name, city, state, then click Free Search.",
      "Find the listing, then click View Free Details.",
      "Click the red Remove My Record.",
      "Open the verification email and click the confirmation link.",
    ],
    processing: "24–72 h after verification.",
    notes:
      "CAPTCHA ESCALATES — up to half a dozen in one session per Security.org. Expect to hand off to the operator. Duplicate listings common.",
  },
  {
    id: "checkpeople",
    name: "CheckPeople",
    optOutUrl: "https://checkpeople.com/opt-out",
    findListingFirst: true,
    verification: "captcha+email",
    captcha: "hcaptcha",
    expiryWindow: null,
    network: "Independent — covers only checkpeople.com.",
    requiredFields: ["firstName", "lastName", "city", "state", "email"],
    steps: [
      "Open /opt-out. Enter full name, city, state (exactly as listed).",
      "Solve the hCaptcha, then click Search.",
      "Find your record, then click Remove Record / Opt-Out.",
      "Enter name + email, solve the hCaptcha AGAIN, then click Submit Request.",
      "Open the email (check spam) and click the verification link.",
    ],
    processing: "~5–7 days.",
    notes:
      "hCaptcha appears TWICE. Phone: (800) 267-2122. Email fallback asks for full name, DOB, current/past addresses, and the profile URL.",
  },
  {
    id: "peoplefinders",
    name: "PeopleFinders",
    optOutUrl: "https://www.peoplefinders.com/opt-out",
    findListingFirst: false,
    verification: "captcha+email",
    captcha: "two-gates",
    expiryWindow: "~24 h verification link",
    network: "Independent (not PeopleConnect) — covers only peoplefinders.com.",
    requiredFields: ["fullName", "email"],
    steps: [
      "Open /opt-out, choose public record removal, then click Next.",
      "Enter name + email, solve the CAPTCHA, then click Send Request.",
      "Open the confirmation email and click the link (expires ~24 h).",
      "On the record form, fill the required (asterisked) fields to locate your profile.",
      "Solve the CAPTCHA AGAIN, then submit.",
      "Recheck after clearing cache.",
    ],
    processing: "3–7 days (up to ~15).",
    notes: "Two CAPTCHAs (one before the email link, one after). Link is time-boxed to ~24 h.",
  },
  {
    id: "mylife",
    name: "MyLife",
    optOutUrl: "https://www.mylife.com/ccpa/index.pubview",
    findListingFirst: true,
    verification: "captcha+email",
    captcha: "recaptcha",
    expiryWindow: "recheck ~15 days",
    network: null,
    requiredFields: ["firstName", "lastName", "state", "profileUrl", "email"],
    steps: [
      "Search your name, open your 'Reputation Profile,' copy the profile URL.",
      "On the CCPA form, fill required fields and paste the profile URL.",
      "Solve the CAPTCHA ('I'm not a robot').",
      "Submit; watch for a confirmation email (may take 24–48 h) and click the link.",
    ],
    processing: "1–2 weeks; recheck ~15 days. Re-appears often.",
    notes:
      "WORST dark patterns — alarming 'Reputation Scores' / criminal teasers funnel toward PAID subscriptions; the free CCPA path is intentionally obscured (footer / FAQ #11). Email fallback: membersupport@mylife.com. Phone: (888) 704-1900. Use a disposable email.",
  },

  // ---- Tier 3: heaviest friction (two CAPTCHA gates, phone call, tight family window) ----
  {
    id: "radaris",
    name: "Radaris",
    optOutUrl: "https://radaris.com/control-privacy",
    findListingFirst: true,
    verification: "captcha+email",
    captcha: "two-gates",
    expiryWindow: "email may take 30+ min",
    network:
      "Large affiliated fleet, each SEPARATE: Centeda, Trustoria, BizStanding, Homemetry, Rehold, Virtory, ClubSet, NewEnglandFacts, Pub360, HomeFlock, DiFive, ProjectLab. Centeda and Trustoria especially need their own opt-outs.",
    requiredFields: ["fullName", "city", "state", "profileUrl", "email"],
    steps: [
      "Search yourself, open your profile, click View Profile, copy the profile URL.",
      "On control-privacy, enter full name, city, state, profile URL, then click Next.",
      "Confirm identity / Start Removing, click through the loading screens.",
      "Enter the email, complete the CAPTCHA, click Submit.",
      "Click the email confirmation link (email can take 30+ minutes).",
      "Return, pass a SECOND CAPTCHA, click Submit again for the confirmation message.",
    ],
    processing: "~24 h.",
    notes:
      "Heaviest friction of the free sites: two CAPTCHA gates and a slow confirmation email. Part of a large fleet that needs separate opt-outs.",
  },
  {
    id: "whitepages",
    name: "Whitepages",
    optOutUrl: "https://www.whitepages.com/suppression-requests",
    findListingFirst: true,
    verification: "phone-call",
    captcha: "none",
    expiryWindow: "finish in one sitting",
    network: "411.com is the same data but a SEPARATE sister-site opt-out.",
    requiredFields: ["fullName", "city", "state", "profileUrl", "phone", "removalReason"],
    steps: [
      "Search name + city + state.",
      "Click View Details on your listing (use View Full Report for a Premium listing).",
      "Copy the profile URL.",
      "On the suppression page, paste the URL, then click Next.",
      "Confirm the details, then click Remove Me.",
      "Pick a removal reason from the required dropdown.",
      "Enter a phone number; the page shows a verification code.",
      "ANSWER the automated phone call and key in / confirm the on-screen code.",
      "See the submitted confirmation.",
    ],
    processing: "~24 h.",
    notes:
      "Verification is a REAL-TIME automated phone call with an on-screen code — the operator MUST do this live; there is no email path. Standard opt-out does NOT remove Premium listings (handle via 'View Full Report'). Each listing separate.",
  },
  {
    id: "intelius",
    name: "Intelius (PeopleConnect)",
    optOutUrl: "https://suppression.peopleconnect.us/login",
    findListingFirst: false,
    verification: "email+second-code",
    captcha: "recaptcha",
    expiryWindow: "~15 min verification link",
    network:
      "ONE suppression covers the WHOLE PeopleConnect family: TruthFinder, Instant Checkmate, US Search, ZabaSearch, Classmates.com, Addresses.com, PeopleLookup, DateCheck, PublicRecords.com.",
    requiredFields: ["email", "dob", "fullName", "nameVariants"],
    steps: [
      "From the Intelius footer reach Manage My Suppression Rules (opens suppression.peopleconnect.us).",
      "Enter the email, agree to terms.",
      "Open the verification email and click Verify Email (link expires ~15 min — finish in one sitting).",
      "Enter date of birth (CANNOT be changed later — double-check it).",
      "Enter your complete legal name (add aliases / maiden names).",
      "Select your record(s).",
      "Complete a second verification (code via email or phone).",
      "Set status to Suppressed and save.",
    ],
    processing: "~72 h, up to 10 business days across the family.",
    notes:
      "BIG upside: one suppression covers the entire PeopleConnect family — do this once and TruthFinder, Instant Checkmate, US Search, ZabaSearch, Classmates, etc. are all covered. The 15-minute window is tight — have the operator's inbox open BEFORE starting. DOB is permanent once entered.",
  },
];

export default PLAYBOOKS;
