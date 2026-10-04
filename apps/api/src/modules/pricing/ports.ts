export type SubjectRef = {
  type: 'DISH' | 'OPTION';
  id: string;
  costCents: number;
};
export interface PricingPort {
  effectiveTierId(companyId: string): Promise<string>;
  resolve(
    tierId: string,
    subjects: SubjectRef[],
  ): Promise<Map<string, number | null>>;
}
export const PRICING_PORT = Symbol('PricingPort');
export const STUB_TIER_ID = '00000000-0000-4000-8000-000000000001';
export class StubPricingPort implements PricingPort {
  async effectiveTierId(companyId: string): Promise<string> {
    void companyId;
    return STUB_TIER_ID;
  }
  async resolve(
    _tierId: string,
    subjects: SubjectRef[],
  ): Promise<Map<string, number | null>> {
    return new Map(
      subjects.map((subject) => [
        `${subject.type}:${subject.id}`,
        subject.type === 'DISH' &&
        subject.id === '00000000-0000-4000-8000-000000000011'
          ? 215
          : null,
      ]),
    );
  }
}
