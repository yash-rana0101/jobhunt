import type { CompanyContact, ReferralTarget } from "@job-hunter/database";

export interface ContactRecommendations {
  bestOverall?: CompanyContact;
  bestReferral?: CompanyContact & { referralTarget?: ReferralTarget };
  bestTechnical?: CompanyContact;
  bestRecruiter?: CompanyContact;
  bestExecutive?: CompanyContact;
}

export function generateRecommendations(
  contacts: CompanyContact[],
  referrals: ReferralTarget[],
): ContactRecommendations {
  if (contacts.length === 0) {
    return {};
  }

  // Filter contacts by confidence threshold of 50 to keep results high quality
  const qualityContacts = contacts.filter((c) => c.confidenceScore >= 50);
  const candidates = qualityContacts.length > 0 ? qualityContacts : contacts;

  // 1. Best Overall (highest contactPriority)
  const bestOverall = [...candidates].sort((a, b) => b.contactPriority - a.contactPriority)[0];

  // 2. Best Referral
  let bestReferral: (CompanyContact & { referralTarget?: ReferralTarget }) | undefined;
  const sortedReferrals = [...referrals].sort((a, b) => {
    if (a.ranking !== b.ranking) {
      return a.ranking - b.ranking; // smaller is better (e.g. 1 > 5)
    }
    // secondary sort by contact priority
    const contactA = contacts.find((c) => c.id === a.contactId);
    const contactB = contacts.find((c) => c.id === b.contactId);
    return (contactB?.contactPriority || 0) - (contactA?.contactPriority || 0);
  });

  if (sortedReferrals.length > 0 && sortedReferrals[0]) {
    const topReferral = sortedReferrals[0];
    const contact = contacts.find((c) => c.id === topReferral.contactId);
    if (contact) {
      bestReferral = {
        ...contact,
        referralTarget: topReferral,
      };
    }
  }

  // 3. Best Technical (ENGINEERING_MANAGER, CTO, TEAM_LEAD)
  const techContacts = candidates.filter(
    (c) =>
      c.category === "ENGINEERING_MANAGER" || c.category === "CTO" || c.category === "TEAM_LEAD",
  );
  const bestTechnical = techContacts.sort((a, b) => b.contactPriority - a.contactPriority)[0];

  // 4. Best Recruiter (RECRUITER)
  const recruiters = candidates.filter((c) => c.category === "RECRUITER");
  const bestRecruiter = recruiters.sort((a, b) => b.contactPriority - a.contactPriority)[0];

  // 5. Best Executive (FOUNDER, CTO)
  const executives = candidates.filter((c) => c.category === "FOUNDER" || c.category === "CTO");
  const bestExecutive = executives.sort((a, b) => b.contactPriority - a.contactPriority)[0];

  return {
    bestOverall,
    bestReferral,
    bestTechnical,
    bestRecruiter,
    bestExecutive,
  };
}
