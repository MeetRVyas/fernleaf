'use client';

import { useState } from 'react';
import { Button, Group, NumberInput, Paper, Select, Stack, Switch, Table, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { can, PERM, listTiers, createTier, updateTier, getTierPrices, setManualPrice, clearManualPrice, priceTierBody, formatMoney } from '@fernleaf/shared';
import { api } from '../../lib/api';
import { useSession } from '../../lib/auth';
import { showApiError } from '../../lib/errors';

type TierBody = (typeof priceTierBody)['_output'];
const emptyTier: TierBody = { name: '', isDefault: false, isActive: true, derivationKind: 'NONE', factorMilli: null, baseTierId: null, percentBp: null };

export function PricingScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [tierId, setTierId] = useState<string | null>(null);
  const [missingOnly, setMissingOnly] = useState(false);
  const [priceSubject, setPriceSubject] = useState<'DISH' | 'OPTION'>('DISH');
  const tiers = useQuery({ queryKey: ['pricing', 'tiers'], queryFn: () => api.call(listTiers) });
  const selected = tierId ?? tiers.data?.[0]?.id ?? null;
  const prices = useQuery({ queryKey: ['pricing', 'prices', selected, missingOnly], queryFn: () => api.call(getTierPrices, { params: { id: selected! }, query: { page: 1, pageSize: 100, missingOnly } }), enabled: !!selected });
  const form = useForm({ initialValues: emptyTier, validate: zod4Resolver(priceTierBody) });
  const [subjectId, setSubjectId] = useState('');
  const [priceCents, setPriceCents] = useState<number | string>(0);
  const saveTier = useMutation({ mutationFn: (body: TierBody) => api.call(createTier, { body }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['pricing'] }); form.reset(); } });
  const toggleTier = useMutation({ mutationFn: (isActive: boolean) => api.call(updateTier, { params: { id: selected! }, body: { isActive } }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pricing'] }) });
  const savePrice = useMutation({ mutationFn: () => api.call(setManualPrice, { params: { id: selected! }, body: { subjectType: priceSubject, subjectId, priceCents: Number(priceCents) } }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['pricing', 'prices'] }); setSubjectId(''); } });
  const clearPrice = useMutation({ mutationFn: (row: { subjectType: 'DISH' | 'OPTION'; subjectId: string }) => api.call(clearManualPrice, { params: { id: selected!, ...row } }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pricing', 'prices'] }) });

  if (session.isLoading) return <Text>Loading permissions…</Text>;
  if (session.isError || !session.data || !can(session.data, PERM.pricing.read)) return <Text>Access denied.</Text>;
  const manage = can(session.data, PERM.pricing.manage);
  return <Stack p="lg">
    <Title order={2}>Price tiers</Title>
    {tiers.isLoading && <Text>Loading tiers…</Text>}
    {tiers.isError && <Button onClick={() => void tiers.refetch()}>Could not load tiers. Retry</Button>}
    {tiers.data?.length === 0 && <Text>No price tiers yet.</Text>}
    {tiers.data && tiers.data.length > 0 && <>
      <Select label="Tier" data={tiers.data.map(tier => ({ value: tier.id, label: tier.name }))} value={selected} onChange={setTierId} />
      {manage && tiers.data.find(tier => tier.id === selected) && <Button variant="light" disabled={tiers.data.find(tier => tier.id === selected)?.isDefault} loading={toggleTier.isPending} onClick={() => void toggleTier.mutateAsync(!tiers.data!.find(tier => tier.id === selected)!.isActive).catch(showApiError)}>{tiers.data.find(tier => tier.id === selected)?.isActive ? 'Deactivate tier' : 'Activate tier'}</Button>}
      <Switch label="Missing prices only" checked={missingOnly} onChange={event => setMissingOnly(event.currentTarget.checked)} />
      {prices.isLoading && <Text>Loading prices…</Text>}
      {prices.isError && <Button onClick={() => void prices.refetch()}>Could not load prices. Retry</Button>}
      {prices.data?.items.length === 0 && <Text>No price rows for this filter.</Text>}
      {!!prices.data?.items.length && <Table striped withTableBorder><Table.Thead><Table.Tr><Table.Th>Subject</Table.Th><Table.Th>Price</Table.Th><Table.Th>Source</Table.Th><Table.Th /></Table.Tr></Table.Thead><Table.Tbody>{prices.data.items.map(row => <Table.Tr key={`${row.subjectType}:${row.subjectId}`}><Table.Td>{row.name}</Table.Td><Table.Td>{row.priceCents === null ? 'Missing' : formatMoney(row.priceCents)}</Table.Td><Table.Td>{row.source}</Table.Td><Table.Td>{manage && row.source === 'MANUAL' && <Button variant="subtle" onClick={() => void clearPrice.mutateAsync(row).catch(showApiError)}>Clear</Button>}</Table.Td></Table.Tr>)}</Table.Tbody></Table>}
    </>}
    {manage && <Group align="start" grow>
      <Paper withBorder p="md"><form onSubmit={form.onSubmit(values => { void saveTier.mutateAsync(values).catch(error => showApiError(error, form.setFieldError)); })}><Stack><Title order={3}>New tier</Title><TextInput label="Name" {...form.getInputProps('name')} /><Switch label="Default" {...form.getInputProps('isDefault', { type: 'checkbox' })} /><Select label="Derivation" data={['NONE', 'COST_MULTIPLIER', 'PERCENT_OVER_TIER']} {...form.getInputProps('derivationKind')} /><NumberInput label="Factor milli" value={form.values.factorMilli ?? ''} onChange={value => form.setFieldValue('factorMilli', value === '' ? null : Number(value))} /><TextInput label="Base tier ID" value={form.values.baseTierId ?? ''} onChange={event => form.setFieldValue('baseTierId', event.currentTarget.value || null)} /><NumberInput label="Percent basis points" value={form.values.percentBp ?? ''} onChange={value => form.setFieldValue('percentBp', value === '' ? null : Number(value))} /><Button type="submit" loading={saveTier.isPending}>Create tier</Button></Stack></form></Paper>
      <Paper withBorder p="md"><Stack><Title order={3}>Set manual price</Title><Select label="Subject type" data={['DISH', 'OPTION']} value={priceSubject} onChange={value => setPriceSubject(value === 'OPTION' ? 'OPTION' : 'DISH')} /><TextInput label="Subject ID" value={subjectId} onChange={event => setSubjectId(event.currentTarget.value)} /><NumberInput label="Price in cents" min={0} value={priceCents} onChange={setPriceCents} /><Button disabled={!selected} loading={savePrice.isPending} onClick={() => void savePrice.mutateAsync().catch(showApiError)}>Save price</Button></Stack></Paper>
    </Group>}
  </Stack>;
}
