/**
 * Opportunity score (computed, not stored).
 * Used for pipeline ranking in admin.
 */

const VOLUME_WEIGHT: Record<string, number> = {
  MICRO: 1,
  SMALL: 2,
  MEDIUM: 4,
  LARGE: 6,
  ENTERPRISE: 10,
};

const URGENCY_WEIGHT: Record<string, number> = {
  NORMAL: 1,
  PLANNED: 1,
  URGENT: 3,
  IMMEDIATE: 5,
};

const COMPLIANCE_WEIGHT: Record<string, number> = {
  NONE: 1,
  CRIB5: 3,
  FIRE_SAFETY: 4,
  FULL_COMPLIANCE: 6,
};

const STAGE_WEIGHT: Record<string, number> = {
  PROSPECT: 1,
  LEAD: 2,
  QUALIFIED: 4,
  ACTIVE: 6,
  CHURNED: 0,
  LAPSED: 0,
};

export interface ClientForScore {
  volumeTier: string;
  urgencyLevel: string;
  complianceRequirement: string;
  relationshipStage: string;
}

export function computeOpportunityScore(client: ClientForScore): number {
  const v = VOLUME_WEIGHT[client.volumeTier] ?? 0;
  const u = URGENCY_WEIGHT[client.urgencyLevel] ?? 0;
  const c = COMPLIANCE_WEIGHT[client.complianceRequirement] ?? 0;
  const s = STAGE_WEIGHT[client.relationshipStage] ?? 0;
  return v + u + c + s;
}

export const HIGH_SCORE_THRESHOLD = 15;
