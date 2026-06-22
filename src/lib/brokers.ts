/**
 * US data brokers & people-search sites we target.
 * `method` is how the opt-out is filed — drives the removal engine:
 *   form  = web form (automatable with Playwright)
 *   email = opt-out via email (semi-automatable)
 *   portal= authenticated/verified portal (manual fallback, often CAPTCHA)
 *
 * This is the seed list. Expand toward the full ~200 in production.
 */
export interface Broker {
  name: string;
  domain: string;
  optOutUrl: string;
  method: "form" | "email" | "portal";
  tier: "major" | "standard";
}

export const BROKERS: Broker[] = [
  { name: "Spokeo", domain: "spokeo.com", optOutUrl: "https://www.spokeo.com/optout", method: "form", tier: "major" },
  { name: "Whitepages", domain: "whitepages.com", optOutUrl: "https://www.whitepages.com/suppression-requests", method: "portal", tier: "major" },
  { name: "BeenVerified", domain: "beenverified.com", optOutUrl: "https://www.beenverified.com/app/optout/search", method: "form", tier: "major" },
  { name: "Radaris", domain: "radaris.com", optOutUrl: "https://radaris.com/control/privacy", method: "portal", tier: "major" },
  { name: "MyLife", domain: "mylife.com", optOutUrl: "https://www.mylife.com/ccpa/index.pubview", method: "email", tier: "major" },
  { name: "TruePeopleSearch", domain: "truepeoplesearch.com", optOutUrl: "https://www.truepeoplesearch.com/removal", method: "form", tier: "major" },
  { name: "Intelius", domain: "intelius.com", optOutUrl: "https://www.intelius.com/opt-out", method: "form", tier: "major" },
  { name: "PeopleFinders", domain: "peoplefinders.com", optOutUrl: "https://www.peoplefinders.com/opt-out", method: "form", tier: "standard" },
  { name: "PeekYou", domain: "peekyou.com", optOutUrl: "https://www.peekyou.com/about/contact/optout", method: "form", tier: "standard" },
  { name: "InstantCheckmate", domain: "instantcheckmate.com", optOutUrl: "https://www.instantcheckmate.com/opt-out", method: "form", tier: "standard" },
  { name: "TruthFinder", domain: "truthfinder.com", optOutUrl: "https://www.truthfinder.com/opt-out", method: "form", tier: "standard" },
  { name: "USPhonebook", domain: "usphonebook.com", optOutUrl: "https://www.usphonebook.com/opt-out", method: "form", tier: "standard" },
  { name: "FastPeopleSearch", domain: "fastpeoplesearch.com", optOutUrl: "https://www.fastpeoplesearch.com/removal", method: "form", tier: "standard" },
  { name: "Nuwber", domain: "nuwber.com", optOutUrl: "https://nuwber.com/removal/link", method: "email", tier: "standard" },
  { name: "Advanced Background Checks", domain: "advancedbackgroundchecks.com", optOutUrl: "https://www.advancedbackgroundchecks.com/removal", method: "form", tier: "standard" },
  { name: "SearchPeopleFree", domain: "searchpeoplefree.com", optOutUrl: "https://www.searchpeoplefree.com/opt-out", method: "form", tier: "standard" },
  { name: "ClustrMaps", domain: "clustrmaps.com", optOutUrl: "https://clustrmaps.com/bl/opt-out", method: "form", tier: "standard" },
  { name: "Acxiom", domain: "acxiom.com", optOutUrl: "https://isapps.acxiom.com/optout/optout.aspx", method: "portal", tier: "major" },
  { name: "LexisNexis", domain: "lexisnexis.com", optOutUrl: "https://optout.lexisnexis.com", method: "portal", tier: "major" },
  { name: "PeopleConnect", domain: "peopleconnect.us", optOutUrl: "https://www.peopleconnect.us/optout", method: "email", tier: "standard" },
];
