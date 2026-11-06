export function knownDefect(description: string) {
  return {
    tag: ['@regression', '@known-defect'],
    annotation: { type: 'known-defect', description },
  };
}

export function documentationBug(description: string) {
  return {
    tag: ['@regression', '@contract'],
    annotation: { type: 'documentation-bug', description },
  };
}
