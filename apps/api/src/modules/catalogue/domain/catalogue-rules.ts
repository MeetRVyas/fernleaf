export function normalizeSku(sku: string): string {
  return sku.trim().toLowerCase();
}

export function hasDuplicateOptionIds(options: readonly { optionId: string }[]): boolean {
  return new Set(options.map(option => option.optionId)).size !== options.length;
}

export function validSingleChoice(isRequired: boolean, selectedOptionIds: readonly string[]): boolean {
  return isRequired ? selectedOptionIds.length === 1 : selectedOptionIds.length <= 1;
}
