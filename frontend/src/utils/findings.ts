import type { Finding } from '../types';

export type GroupedFinding = Finding & { groupExplanations: string[] };

/** Collapse equivalent outcomes while retaining all distinct explanations and citations. */
export function groupFindings(findings: Finding[]): GroupedFinding[] {
  const groups = new Map<string, GroupedFinding>();
  for (const finding of findings) {
    const key = JSON.stringify([
      finding.rule_code,
      finding.category,
      finding.status,
      finding.summary,
      finding.recommended_next_step,
      finding.limitations,
    ]);
    const current = groups.get(key);
    if (!current) {
      groups.set(key, {
        ...finding,
        evidence: [...(finding.evidence || [])],
        compared_fields: [...finding.compared_fields],
        groupExplanations: [finding.explanation],
      });
      continue;
    }
    current.groupExplanations = Array.from(new Set([...current.groupExplanations, finding.explanation]));
    current.compared_fields = Array.from(new Set([...current.compared_fields, ...finding.compared_fields]));
    const evidenceKeys = new Set(current.evidence.map((item) => `${item.source_record_id}|${item.field_name}|${item.observed_value ?? ''}`));
    for (const item of finding.evidence || []) {
      const evidenceKey = `${item.source_record_id}|${item.field_name}|${item.observed_value ?? ''}`;
      if (!evidenceKeys.has(evidenceKey)) {
        current.evidence.push(item);
        evidenceKeys.add(evidenceKey);
      }
    }
  }
  const statusOrder: Record<string, number> = {
    conflict_detected: 0,
    review_required: 1,
    insufficient_information: 2,
    no_inconsistency_found: 3,
    not_applicable: 4,
  };
  return Array.from(groups.values()).sort((a, b) =>
    (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || a.rule_code.localeCompare(b.rule_code) || a.summary.localeCompare(b.summary)
  );
}

/** Return rule checks connected to this finding through shared source records. */
export function relatedRuleCodes(finding: Finding, findings: Finding[]): string[] {
  const related = new Set([finding.rule_code]);
  const sourceIds = new Set(finding.evidence.map((item) => item.source_record_id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of findings) {
      if (related.has(candidate.rule_code)) continue;
      const candidateSourceIds = candidate.evidence.map((item) => item.source_record_id);
      if (candidateSourceIds.some((id) => sourceIds.has(id))) {
        related.add(candidate.rule_code);
        candidateSourceIds.forEach((id) => sourceIds.add(id));
        changed = true;
      }
    }
  }
  return related.size > 1 ? Array.from(related).sort() : [];
}

export function findingIssueMetrics(findings: Finding[]) {
  const actionable = findings.filter((finding) => [
    'conflict_detected', 'review_required', 'insufficient_information',
  ].includes(finding.status));
  const parents = actionable.map((_, index) => index);
  const root = (index: number): number => {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  };
  for (let left = 0; left < actionable.length; left += 1) {
    const leftSources = new Set(actionable[left].evidence.map((item) => item.source_record_id));
    for (let right = left + 1; right < actionable.length; right += 1) {
      const sharesSource = actionable[right].evidence.some((item) => leftSources.has(item.source_record_id));
      if (actionable[left].rule_code === actionable[right].rule_code || sharesSource) {
        const leftRoot = root(left);
        const rightRoot = root(right);
        if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
      }
    }
  }
  const components = new Map<number, Finding[]>();
  actionable.forEach((finding, index) => {
    const key = root(index);
    components.set(key, [...(components.get(key) || []), finding]);
  });
  const statusOrder = ['conflict_detected', 'review_required', 'insufficient_information'];
  const issuesByStatus = { conflict_detected: 0, review_required: 0, insufficient_information: 0 };
  const checksByStatus = { conflict_detected: 0, review_required: 0, insufficient_information: 0 };
  for (const component of components.values()) {
    const status = statusOrder.find((candidate) => component.some((finding) => finding.status === candidate));
    if (status) {
      issuesByStatus[status as keyof typeof issuesByStatus] += 1;
      checksByStatus[status as keyof typeof checksByStatus] += component.length;
    }
  }
  return { issueCount: components.size, checkCount: actionable.length, issuesByStatus, checksByStatus };
}
