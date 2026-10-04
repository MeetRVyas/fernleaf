export type OfferedGroup = { id: string; isRequired: boolean; options: { id: string; active: boolean; priceCents: number | null }[] };
export function visibleCategory(isActive: boolean, isSecret: boolean, isHidden: boolean, direct: boolean): boolean {
  return isActive && !isHidden && (direct || !isSecret);
}
export function visibleDish(isActive: boolean, isHidden: boolean, priceCents: number | null, groups: OfferedGroup[]): boolean {
  return isActive && !isHidden && priceCents !== null && priceCents > 0 &&
    groups.every(group => !group.isRequired || group.options.some(option => option.active && option.priceCents !== null));
}
