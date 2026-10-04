'use client';

import { Group, Pagination, Select, Table, Text, TextInput, UnstyledButton } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { EmptyState, ErrorState, LoadingState } from './states';

export type TableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortKey?: string;
};

export type TableState = { page: number; pageSize: number; sort?: string; filters: Record<string, string> };

export function useTableState(filterKeys: readonly string[]): TableState {
  const search = useSearchParams();
  const numberParam = (name: string, fallback: number) => {
    const value = Number(search.get(name));
    return Number.isInteger(value) && value > 0 ? value : fallback;
  };
  return {
    page: numberParam('page', 1),
    pageSize: Math.min(numberParam('pageSize', 25), 100),
    sort: search.get('sort') ?? undefined,
    filters: Object.fromEntries(filterKeys.map(key => [key, search.get(key) ?? ''])),
  };
}

export function ServerTable<T>({ columns, items, total, rowKey, filterKeys = [], loading = false, error = false, retry }: {
  columns: readonly TableColumn<T>[];
  items: readonly T[];
  total: number;
  rowKey: (row: T) => string;
  filterKeys?: readonly string[];
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
}) {
  const state = useTableState(filterKeys);
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const update = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(search.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    router.replace(`${pathname}${params.size ? `?${params}` : ''}`);
  };
  const pages = Math.max(1, Math.ceil(total / state.pageSize));

  return <>
    {filterKeys.length > 0 && <Group mb="md" align="end">
      {filterKeys.map(key => <TextInput key={key} label={key} defaultValue={state.filters[key]}
        onKeyDown={event => { if (event.key === 'Enter') update({ [key]: event.currentTarget.value, page: '1' }); }}
        onBlur={event => update({ [key]: event.currentTarget.value, page: '1' })} />)}
    </Group>}
    {loading ? <LoadingState /> : error ? <ErrorState retry={retry} /> : items.length === 0 ? <EmptyState /> :
      <Table.ScrollContainer minWidth={600}><Table striped highlightOnHover>
        <Table.Thead><Table.Tr>{columns.map(column => <Table.Th key={column.key}>
          {column.sortKey ? <UnstyledButton onClick={() => update({ sort: `${column.sortKey}:${state.sort === `${column.sortKey}:asc` ? 'desc' : 'asc'}`, page: '1' })}>
            {column.label}{state.sort?.startsWith(`${column.sortKey}:`) ? (state.sort.endsWith(':asc') ? ' ↑' : ' ↓') : ''}
          </UnstyledButton> : column.label}
        </Table.Th>)}</Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(row => <Table.Tr key={rowKey(row)}>{columns.map(column => <Table.Td key={column.key}>{column.render(row)}</Table.Td>)}</Table.Tr>)}</Table.Tbody>
      </Table></Table.ScrollContainer>}
    <Group mt="md" justify="space-between" wrap="wrap">
      <Text size="sm" c="dimmed">{total} results</Text>
      <Pagination value={Math.min(state.page, pages)} onChange={page => update({ page: String(page) })} total={pages} />
      <Select aria-label="Page size" w={100} value={String(state.pageSize)} onChange={value => update({ pageSize: value ?? '25', page: '1' })} data={['10', '25', '50', '100']} />
    </Group>
  </>;
}
